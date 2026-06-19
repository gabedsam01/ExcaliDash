/**
 * Central cache + save-coordination service. This is the ONLY place the app
 * talks to Redis: routes and the MCP layer call these domain methods instead of
 * issuing raw Redis commands, so caching stays consistent and easy to audit.
 *
 * Guarantees:
 *   - PostgreSQL is the source of truth. Every method degrades to a safe no-op
 *     (read => null/miss, write => skip, lock => "not in effect") when Redis is
 *     disabled or unreachable. No method ever throws into a request path.
 *   - No secrets and no oversized payloads are stored: values above
 *     REDIS_MAX_VALUE_BYTES are skipped (and logged at debug level).
 *   - Logs never include payload content (only sizes / keys / counts).
 */
import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";
import type { RedisConfig } from "../config";
import { createCacheKeys, type CacheKeyBuilder } from "./cacheKeys";
import {
  getRedisClient,
  isRedisReady,
  type RedisLike,
} from "./redisClient";

export interface SaveState {
  /** Hash of the last persisted scene payload (elements+appState+files). */
  payloadHash?: string;
  /** Epoch ms of the last successful save. */
  saveAt?: number;
  /** Epoch ms of the last snapshot written (cross-replica coalescing). */
  snapshotAt?: number;
  /** Last persisted drawing version. */
  version?: number;
  /** Light human-readable status (e.g. "saved"). */
  status?: string;
}

export interface SaveLockHandle {
  /** We hold the lock and must release it. */
  acquired: boolean;
  /** Another save for the same drawing currently holds the lock. */
  busy: boolean;
  /** Opaque token used for a safe (compare-and-delete) release. */
  token: string | null;
}

export interface CacheServiceDeps {
  config: RedisConfig;
  isReady: () => boolean;
  getClient: () => RedisLike | null;
  debug: boolean;
}

/**
 * Lua executed server-side by Redis (the `EVAL` command — NOT JavaScript eval).
 * Deletes the lock key only if it still holds our token, so a save can never
 * release a lock that a later save already re-acquired.
 */
const RELEASE_LOCK_LUA =
  "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

const NOOP_LOCK: SaveLockHandle = { acquired: false, busy: false, token: null };

export class CacheService {
  private readonly config: RedisConfig;
  private readonly keys: CacheKeyBuilder;
  private readonly isReadyFn: () => boolean;
  private readonly getClientFn: () => RedisLike | null;
  private readonly debug: boolean;

  constructor(deps: CacheServiceDeps) {
    this.config = deps.config;
    this.keys = createCacheKeys(deps.config.prefix);
    this.isReadyFn = deps.isReady;
    this.getClientFn = deps.getClient;
    this.debug = deps.debug;
  }

  /** Redis is configured AND the connection is live. */
  isReady(): boolean {
    return this.config.enabled && this.isReadyFn();
  }

  private client(): RedisLike | null {
    if (!this.config.enabled) return null;
    return this.getClientFn();
  }

  private logDebug(message: string): void {
    if (this.debug) console.log(`[cache] ${message}`);
  }

  // --- Generic helpers ------------------------------------------------------

  /** Run `fn` when Redis is live; on any error fall back to `fallback`. */
  async withFallback<T>(fn: (client: RedisLike) => Promise<T>, fallback: T): Promise<T> {
    const client = this.client();
    if (!client || !this.isReady()) return fallback;
    try {
      return await fn(client);
    } catch (err) {
      this.logDebug(
        `redis op failed, falling back to postgres: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return fallback;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    return this.withFallback(async (client) => {
      const raw = await client.get(key);
      if (raw == null) {
        this.logDebug(`miss ${key}`);
        return null;
      }
      this.logDebug(`hit ${key}`);
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    }, null);
  }

  async getString(key: string): Promise<string | null> {
    return this.withFallback(async (client) => {
      const raw = await client.get(key);
      this.logDebug(raw == null ? `miss ${key}` : `hit ${key}`);
      return raw;
    }, null);
  }

  /** Store a pre-serialized string with a TTL, skipping oversized payloads. */
  async setRaw(
    key: string,
    value: string,
    ttlSeconds: number,
    maxBytes = this.config.maxValueBytes,
  ): Promise<boolean> {
    const bytes = Buffer.byteLength(value, "utf8");
    if (maxBytes > 0 && bytes > maxBytes) {
      this.logDebug(
        `payload too large for redis cache, skipping ${key} (${bytes} > ${maxBytes} bytes)`,
      );
      return false;
    }
    return this.withFallback(async (client) => {
      await client.set(key, value, "EX", Math.max(1, Math.trunc(ttlSeconds)));
      this.logDebug(`set ${key} (${bytes} bytes, ttl ${ttlSeconds}s)`);
      return true;
    }, false);
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<boolean> {
    return this.safeSetJson(key, value, ttlSeconds, this.config.maxValueBytes);
  }

  /** Serialize + store JSON, skipping values above `maxBytes`. */
  async safeSetJson(
    key: string,
    value: unknown,
    ttlSeconds: number,
    maxBytes = this.config.maxValueBytes,
  ): Promise<boolean> {
    let serialized: string;
    try {
      serialized = JSON.stringify(value);
    } catch {
      return false;
    }
    return this.setRaw(key, serialized, ttlSeconds, maxBytes);
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await this.withFallback(async (client) => {
      await client.del(...keys);
      this.logDebug(`invalidated ${keys.join(", ")}`);
      return true;
    }, false);
  }

  /** SCAN + DEL every key matching `<prefix>*`. Admin/maintenance use only. */
  async delPattern(prefix: string): Promise<number> {
    return this.withFallback(async (client) => {
      let cursor = "0";
      let removed = 0;
      do {
        const [next, batch] = await client.scan(
          cursor,
          "MATCH",
          `${prefix}*`,
          "COUNT",
          100,
        );
        cursor = next;
        if (batch.length > 0) {
          removed += await client.del(...batch);
        }
      } while (cursor !== "0");
      if (removed > 0) this.logDebug(`invalidated ${removed} keys matching ${prefix}*`);
      return removed;
    }, 0);
  }

  // --- Hot drawing (GET /drawings/:id) --------------------------------------

  /** Cached raw Drawing row, or null on miss/disabled. */
  async getDrawingRow<T>(drawingId: string): Promise<T | null> {
    return this.getJson<T>(this.keys.drawingCurrent(drawingId));
  }

  /** Cache the raw Drawing row (skipped automatically if it exceeds maxBytes). */
  async setDrawingRow(drawingId: string, row: unknown): Promise<boolean> {
    return this.safeSetJson(
      this.keys.drawingCurrent(drawingId),
      row,
      this.config.drawingCacheTtlSeconds,
    );
  }

  /** Invalidate the hot drawing cache (save / delete / restore / permission change). */
  async invalidateDrawing(drawingId: string): Promise<void> {
    await this.del(this.keys.drawingCurrent(drawingId));
  }

  /** Drop ALL coordination + cache state for a deleted drawing. */
  async invalidateDrawingFull(drawingId: string): Promise<void> {
    await this.del(
      this.keys.drawingCurrent(drawingId),
      this.keys.drawingSaveState(drawingId),
      this.keys.drawingSaveLock(drawingId),
    );
  }

  // --- Per-user listings (GET /drawings, /collections) ----------------------

  private async currentGeneration(userId: string): Promise<string> {
    const gen = await this.getString(this.keys.userListGeneration(userId));
    return gen ?? "0";
  }

  /** Cached listing body (raw JSON string) for a user's query, or null. */
  async getUserListing(userId: string, queryHash: string): Promise<string | null> {
    if (!this.isReady()) return null;
    const gen = await this.currentGeneration(userId);
    return this.getString(this.keys.userDrawingsList(userId, gen, queryHash));
  }

  /** Cache a listing body (raw JSON string), skipping oversized payloads. */
  async setUserListing(
    userId: string,
    queryHash: string,
    body: string,
  ): Promise<boolean> {
    if (!this.isReady()) return false;
    const gen = await this.currentGeneration(userId);
    return this.setRaw(
      this.keys.userDrawingsList(userId, gen, queryHash),
      body,
      this.config.metadataCacheTtlSeconds,
    );
  }

  async getCollectionsList<T>(userId: string): Promise<T | null> {
    return this.getJson<T>(this.keys.userCollectionsList(userId));
  }

  async setCollectionsList(userId: string, value: unknown): Promise<boolean> {
    return this.safeSetJson(
      this.keys.userCollectionsList(userId),
      value,
      this.config.metadataCacheTtlSeconds,
    );
  }

  /** Invalidate only the cached collections list (create / rename). */
  async invalidateCollections(userId: string): Promise<void> {
    await this.del(this.keys.userCollectionsList(userId));
  }

  /**
   * Invalidate a user's cached listings. O(1): bumping the per-user generation
   * counter makes every previous list key unreachable (they expire via TTL), so
   * this stays cheap even on the autosave-adjacent write path.
   */
  async invalidateUserListings(userId: string): Promise<void> {
    await this.withFallback(async (client) => {
      await client.incr(this.keys.userListGeneration(userId));
      await client.del(this.keys.userCollectionsList(userId));
      this.logDebug(`invalidated listings for user ${userId}`);
      return true;
    }, false);
  }

  // --- Save coordination (PUT /drawings/:id) --------------------------------

  /**
   * Best-effort advisory lock. Returns:
   *   - acquired=true  -> we hold the lock (release it in a finally).
   *   - busy=true      -> another save for the same drawing holds it (coalesce).
   *   - all-false      -> lock not in effect (Redis off/down/queue disabled);
   *                       proceed normally (optimistic version lock guarantees
   *                       correctness regardless).
   */
  async acquireSaveLock(drawingId: string): Promise<SaveLockHandle> {
    if (!this.config.enabled || !this.config.saveQueueEnabled || !this.isReady()) {
      return NOOP_LOCK;
    }
    const token = uuidv4();
    const key = this.keys.drawingSaveLock(drawingId);
    return this.withFallback(async (client) => {
      const result = await client.set(
        key,
        token,
        "EX",
        Math.max(1, this.config.saveLockTtlSeconds),
        "NX",
      );
      if (result === "OK") {
        this.logDebug(`save lock acquired ${key}`);
        return { acquired: true, busy: false, token } as SaveLockHandle;
      }
      this.logDebug(`save lock busy ${key} (coalescing)`);
      return { acquired: false, busy: true, token: null } as SaveLockHandle;
    }, NOOP_LOCK);
  }

  async releaseSaveLock(drawingId: string, handle: SaveLockHandle): Promise<void> {
    if (!handle.acquired || !handle.token) return;
    const key = this.keys.drawingSaveLock(drawingId);
    const token = handle.token;
    await this.withFallback(async (client) => {
      await client.eval(RELEASE_LOCK_LUA, 1, key, token);
      this.logDebug(`save lock released ${key}`);
      return true;
    }, false);
  }

  async getSaveState(drawingId: string): Promise<SaveState | null> {
    return this.getJson<SaveState>(this.keys.drawingSaveState(drawingId));
  }

  /** Merge + persist light save-state (never the snapshot payload itself). */
  async updateSaveState(drawingId: string, patch: SaveState): Promise<void> {
    if (!this.isReady()) return;
    const key = this.keys.drawingSaveState(drawingId);
    await this.withFallback(async () => {
      const current = (await this.getSaveState(drawingId)) ?? {};
      // Only defined fields override; never clobber an existing snapshotAt /
      // payloadHash with undefined (e.g. on a metadata-only update).
      const next: SaveState = { ...current };
      for (const [field, value] of Object.entries(patch)) {
        if (value !== undefined) {
          (next as Record<string, unknown>)[field] = value;
        }
      }
      await this.setRaw(
        key,
        JSON.stringify(next),
        this.config.drawingCacheTtlSeconds,
        // Save-state is tiny; never let the global cap skip it.
        0,
      );
      return true;
    }, false);
  }

  /** Stable hash of the scene payload, for duplicate-save detection. */
  static hashPayload(parts: Array<string | undefined>): string {
    const hash = createHash("sha1");
    for (const part of parts) hash.update(part ?? "");
    return hash.digest("hex");
  }
}

// --- Module singleton -------------------------------------------------------

const DISABLED_CONFIG: RedisConfig = {
  enabled: false,
  url: "",
  prefix: "excalidash:",
  cacheTtlSeconds: 300,
  drawingCacheTtlSeconds: 600,
  metadataCacheTtlSeconds: 300,
  saveLockTtlSeconds: 30,
  saveQueueEnabled: false,
  maxValueBytes: 10 * 1024 * 1024,
};

let instance: CacheService = new CacheService({
  config: DISABLED_CONFIG,
  isReady: () => false,
  getClient: () => null,
  debug: false,
});

/** Wire the cache service to the real (optional) Redis client. */
export const initCacheService = (
  config: RedisConfig,
  debug: boolean,
): CacheService => {
  instance = new CacheService({
    config,
    isReady: isRedisReady,
    getClient: getRedisClient,
    debug,
  });
  return instance;
};

/** The active cache service. Always safe to call (no-ops when Redis is off). */
export const getCache = (): CacheService => instance;

/** Test seam: inject a fake-backed service. */
export const __setCacheServiceForTests = (svc: CacheService): void => {
  instance = svc;
};
