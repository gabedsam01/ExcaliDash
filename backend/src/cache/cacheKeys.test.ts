import { describe, it, expect } from "vitest";
import { createCacheKeys, normalizeCachePrefix } from "./cacheKeys";

describe("cacheKeys", () => {
  it("normalizes the prefix to a single trailing colon", () => {
    expect(normalizeCachePrefix("excalidash")).toBe("excalidash:");
    expect(normalizeCachePrefix("excalidash:")).toBe("excalidash:");
    expect(normalizeCachePrefix("  excalidash  ")).toBe("excalidash:");
    expect(normalizeCachePrefix("")).toBe("");
  });

  it("builds the documented key layout", () => {
    const k = createCacheKeys("excalidash:");
    expect(k.drawingCurrent("d1")).toBe("excalidash:drawing:d1:current");
    expect(k.drawingSaveLock("d1")).toBe("excalidash:drawing:d1:save-lock");
    expect(k.drawingSaveState("d1")).toBe("excalidash:drawing:d1:save-state");
    expect(k.userListGeneration("u1")).toBe("excalidash:user:u1:drawings:gen");
    expect(k.userDrawingsList("u1", 3, "abc")).toBe(
      "excalidash:user:u1:drawings:list:3:abc",
    );
    expect(k.userCollectionsList("u1")).toBe("excalidash:user:u1:collections:list");
  });

  it("respects a custom prefix", () => {
    const k = createCacheKeys("myapp");
    expect(k.drawingCurrent("d1")).toBe("myapp:drawing:d1:current");
  });
});
