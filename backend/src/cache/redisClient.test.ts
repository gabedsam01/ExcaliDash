import { describe, it, expect, afterEach } from "vitest";
import { initRedis, isRedisReady, __resetRedisForTests } from "./redisClient";
import type { RedisConfig } from "../config";

const disabled: RedisConfig = {
  enabled: false,
  url: "redis://redis:6379",
  prefix: "excalidash:",
  cacheTtlSeconds: 300,
  drawingCacheTtlSeconds: 600,
  metadataCacheTtlSeconds: 300,
  saveLockTtlSeconds: 30,
  saveQueueEnabled: true,
  maxValueBytes: 1024,
};

describe("redisClient", () => {
  afterEach(() => {
    __resetRedisForTests();
  });

  it("reports not-ready before initialization", () => {
    expect(isRedisReady()).toBe(false);
  });

  it("returns null and stays not-ready when REDIS_ENABLED=false", () => {
    const client = initRedis(disabled);
    expect(client).toBeNull();
    expect(isRedisReady()).toBe(false);
  });
});
