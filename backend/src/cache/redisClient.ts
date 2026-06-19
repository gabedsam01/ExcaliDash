/**
 * Optional Redis connection lifecycle.
 *
 * Redis is a SPEED layer only — PostgreSQL is always the source of truth. This
 * module owns the single ioredis connection and exposes a tiny, defensive API so
 * the rest of the codebase never imports ioredis directly:
 *
 *   - REDIS_ENABLED=false              -> no client is ever created (pure Postgres).
 *   - REDIS_ENABLED=true + reachable   -> client connects; isRedisReady() === true.
 *   - REDIS_ENABLED=true + unreachable -> one warning is logged, isRedisReady()
 *                                         stays false, and every caller transparently
 *                                         falls back to PostgreSQL.
 *
 * `ioredis` is loaded lazily via require() (like the optional `sharp` dep) so a
 * deployment that never enables Redis does not need the package installed and
 * the build/typecheck never depends on it.
 */
import type { RedisConfig } from "../config";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** The minimal slice of the ioredis client surface that the cache layer uses. */
export interface RedisLike {
  status: string;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: any[]): Promise<any>;
  del(...keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  scan(cursor: string | number, ...args: any[]): Promise<[string, string[]]>;
  eval(script: string, numKeys: number, ...args: any[]): Promise<any>;
  ping(): Promise<string>;
  quit(): Promise<any>;
  disconnect(): void;
  on(event: string, listener: (...args: any[]) => void): void;
}

let client: RedisLike | null = null;
let ready = false;
let warnedUnavailable = false;
let warnedMissingModule = false;

/** True only when a client exists AND the connection is established. */
export const isRedisReady = (): boolean => ready && client !== null;

/** The live client, or null when disabled/unavailable. */
export const getRedisClient = (): RedisLike | null => (isRedisReady() ? client : null);

const loadIoredis = (): any | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("ioredis");
  } catch {
    if (!warnedMissingModule) {
      warnedMissingModule = true;
      console.warn(
        "[redis] REDIS_ENABLED=true but the optional 'ioredis' package is not " +
          "installed; continuing with PostgreSQL only.",
      );
    }
    return null;
  }
};

/**
 * Initialize the optional Redis connection. Safe to call once at startup. Never
 * throws: any failure degrades to PostgreSQL-only mode.
 */
export const initRedis = (config: RedisConfig): RedisLike | null => {
  if (!config.enabled) {
    console.log("[redis] disabled (REDIS_ENABLED=false); using PostgreSQL only.");
    return null;
  }
  if (client) return client;

  const IoRedis = loadIoredis();
  if (!IoRedis) return null;

  const RedisCtor = IoRedis.default ?? IoRedis;
  try {
    const instance: RedisLike = new RedisCtor(config.url, {
      // Fail fast instead of buffering: a command issued while disconnected
      // must reject immediately so callers fall back to PostgreSQL.
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 5_000,
      lazyConnect: false,
      // Keep retrying in the background, but never spin hot.
      retryStrategy: (times: number) => Math.min(times * 500, 5_000),
    });

    instance.on("ready", () => {
      ready = true;
      warnedUnavailable = false;
      console.log("[redis] connected and ready (cache + save coordination enabled).");
    });
    instance.on("end", () => {
      ready = false;
    });
    instance.on("close", () => {
      ready = false;
    });
    instance.on("error", (err: Error) => {
      ready = false;
      if (!warnedUnavailable) {
        warnedUnavailable = true;
        console.warn(
          `[redis] unavailable, using PostgreSQL only: ${err?.message ?? err}`,
        );
      }
    });

    client = instance;
    return client;
  } catch (err) {
    console.warn(
      `[redis] failed to initialize, using PostgreSQL only: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    client = null;
    ready = false;
    return null;
  }
};

/** Close the connection (tests / graceful shutdown). */
export const closeRedis = async (): Promise<void> => {
  if (!client) return;
  try {
    await client.quit();
  } catch {
    try {
      client.disconnect();
    } catch {
      /* ignore */
    }
  } finally {
    client = null;
    ready = false;
  }
};

/** Test-only: reset module state between suites. */
export const __resetRedisForTests = (): void => {
  client = null;
  ready = false;
  warnedUnavailable = false;
  warnedMissingModule = false;
};
/* eslint-enable @typescript-eslint/no-explicit-any */
