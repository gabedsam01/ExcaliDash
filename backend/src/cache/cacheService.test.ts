import { describe, it, expect, beforeEach } from "vitest";
import { CacheService } from "./cacheService";
import type { RedisConfig } from "../config";
import type { RedisLike } from "./redisClient";

/**
 * Minimal in-memory Redis double implementing just the slice CacheService uses.
 * `failMode` lets a test simulate an unreachable Redis (every command throws).
 */
class FakeRedis implements RedisLike {
  store = new Map<string, string>();
  status = "ready";
  failMode = false;

  private guard() {
    if (this.failMode) throw new Error("redis unavailable (simulated)");
  }
  async get(key: string): Promise<string | null> {
    this.guard();
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async set(key: string, value: string, ...args: any[]): Promise<any> {
    this.guard();
    const hasNX = args.includes("NX");
    if (hasNX && this.store.has(key)) return null;
    this.store.set(key, value);
    return "OK";
  }
  async del(...keys: string[]): Promise<number> {
    this.guard();
    let removed = 0;
    for (const key of keys) if (this.store.delete(key)) removed += 1;
    return removed;
  }
  async incr(key: string): Promise<number> {
    this.guard();
    const next = Number(this.store.get(key) ?? "0") + 1;
    this.store.set(key, String(next));
    return next;
  }
  async expire(): Promise<number> {
    this.guard();
    return 1;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async scan(_cursor: string | number, ...args: any[]): Promise<[string, string[]]> {
    this.guard();
    const matchIdx = args.indexOf("MATCH");
    const pattern = matchIdx >= 0 ? String(args[matchIdx + 1]) : "*";
    const prefix = pattern.replace(/\*$/, "");
    const keys = [...this.store.keys()].filter((k) => k.startsWith(prefix));
    return ["0", keys];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async eval(_script: string, _numKeys: number, ...args: any[]): Promise<any> {
    this.guard();
    const [key, token] = args as [string, string];
    if (this.store.get(key) === token) {
      this.store.delete(key);
      return 1;
    }
    return 0;
  }
  async ping(): Promise<string> {
    return "PONG";
  }
  async quit(): Promise<string> {
    return "OK";
  }
  disconnect(): void {}
  on(): void {}
}

const baseConfig = (over: Partial<RedisConfig> = {}): RedisConfig => ({
  enabled: true,
  url: "redis://localhost:6379",
  prefix: "excalidash:",
  cacheTtlSeconds: 300,
  drawingCacheTtlSeconds: 600,
  metadataCacheTtlSeconds: 300,
  saveLockTtlSeconds: 30,
  saveQueueEnabled: true,
  maxValueBytes: 1024,
  ...over,
});

const makeService = (
  fake: FakeRedis,
  over: Partial<RedisConfig> = {},
  ready = true,
) =>
  new CacheService({
    config: baseConfig(over),
    isReady: () => ready,
    getClient: () => fake,
    debug: false,
  });

describe("CacheService", () => {
  let fake: FakeRedis;
  beforeEach(() => {
    fake = new FakeRedis();
  });

  it("is a no-op when Redis is disabled (PostgreSQL only)", async () => {
    const svc = makeService(fake, { enabled: false });
    expect(svc.isReady()).toBe(false);
    expect(await svc.setDrawingRow("d1", { a: 1 })).toBe(false);
    expect(await svc.getDrawingRow("d1")).toBeNull();
    const lock = await svc.acquireSaveLock("d1");
    expect(lock).toEqual({ acquired: false, busy: false, token: null });
    // Nothing should have been written to the backing store.
    expect(fake.store.size).toBe(0);
  });

  it("does not throw and falls back when Redis is unavailable", async () => {
    const svc = makeService(fake);
    fake.failMode = true;
    // Every operation must resolve to a safe fallback, never reject.
    expect(await svc.getDrawingRow("d1")).toBeNull();
    expect(await svc.setDrawingRow("d1", { a: 1 })).toBe(false);
    expect(await svc.getUserListing("u1", "q")).toBeNull();
    const lock = await svc.acquireSaveLock("d1");
    expect(lock.acquired).toBe(false);
    await expect(svc.invalidateUserListings("u1")).resolves.toBeUndefined();
  });

  it("caches and reads back the hot drawing row (hit/miss)", async () => {
    const svc = makeService(fake);
    expect(await svc.getDrawingRow("d1")).toBeNull(); // miss
    await svc.setDrawingRow("d1", { id: "d1", name: "Board" });
    expect(await svc.getDrawingRow<{ name: string }>("d1")).toEqual({
      id: "d1",
      name: "Board",
    });
    await svc.invalidateDrawing("d1");
    expect(await svc.getDrawingRow("d1")).toBeNull(); // invalidated
  });

  it("does NOT cache values above REDIS_MAX_VALUE_BYTES", async () => {
    const svc = makeService(fake, { maxValueBytes: 32 });
    const big = "x".repeat(64);
    expect(await svc.setRaw("excalidash:drawing:d1:current", big, 60)).toBe(false);
    expect(fake.store.size).toBe(0);
    // A small value is still cached.
    expect(await svc.setRaw("excalidash:drawing:d2:current", "small", 60)).toBe(true);
    expect(fake.store.size).toBe(1);
  });

  it("serves a cached listing and invalidates it on update (generation bump)", async () => {
    const svc = makeService(fake);
    const body = JSON.stringify({ drawings: [], totalCount: 0 });
    await svc.setUserListing("u1", "qhash", body);
    expect(await svc.getUserListing("u1", "qhash")).toBe(body);

    // A write invalidates the user's listings in O(1)...
    await svc.invalidateUserListings("u1");
    expect(await svc.getUserListing("u1", "qhash")).toBeNull();

    // ...and a fresh listing under the new generation is independent.
    await svc.setUserListing("u1", "qhash", body);
    expect(await svc.getUserListing("u1", "qhash")).toBe(body);
  });

  it("collections cache is invalidated independently of drawings listings", async () => {
    const svc = makeService(fake);
    await svc.setCollectionsList("u1", [{ id: "c1" }]);
    await svc.setUserListing("u1", "q", "body");
    await svc.invalidateCollections("u1");
    expect(await svc.getCollectionsList("u1")).toBeNull();
    // Drawings listing still intact (collections-only invalidation).
    expect(await svc.getUserListing("u1", "q")).toBe("body");
  });

  it("advisory save lock prevents a concurrent save and releases cleanly", async () => {
    const svc = makeService(fake);
    const first = await svc.acquireSaveLock("d1");
    expect(first.acquired).toBe(true);
    expect(first.token).toBeTruthy();

    // A second concurrent save sees the lock as busy (coalesce).
    const second = await svc.acquireSaveLock("d1");
    expect(second).toEqual({ acquired: false, busy: true, token: null });

    // Releasing the first lock with the wrong token must NOT free it...
    await svc.releaseSaveLock("d1", { acquired: true, busy: false, token: "wrong" });
    expect((await svc.acquireSaveLock("d1")).busy).toBe(true);

    // ...releasing with the right handle frees it for the next save.
    await svc.releaseSaveLock("d1", first);
    expect((await svc.acquireSaveLock("d1")).acquired).toBe(true);
  });

  it("save lock is skipped when REDIS_SAVE_QUEUE_ENABLED=false", async () => {
    const svc = makeService(fake, { saveQueueEnabled: false });
    const lock = await svc.acquireSaveLock("d1");
    expect(lock).toEqual({ acquired: false, busy: false, token: null });
  });

  it("merges save-state without clobbering existing fields with undefined", async () => {
    const svc = makeService(fake);
    await svc.updateSaveState("d1", { snapshotAt: 1000, version: 5, status: "saved" });
    // A later metadata-only save sends payloadHash/snapshotAt undefined.
    await svc.updateSaveState("d1", {
      saveAt: 2000,
      version: 6,
      payloadHash: undefined,
      snapshotAt: undefined,
      status: "saved",
    });
    const state = await svc.getSaveState("d1");
    expect(state?.snapshotAt).toBe(1000); // preserved
    expect(state?.saveAt).toBe(2000);
    expect(state?.version).toBe(6);
  });

  it("hashPayload is stable and order-sensitive", () => {
    const a = CacheService.hashPayload(["els", "state", "files"]);
    const b = CacheService.hashPayload(["els", "state", "files"]);
    const c = CacheService.hashPayload(["els", "state", undefined]);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f]{40}$/);
  });
});
