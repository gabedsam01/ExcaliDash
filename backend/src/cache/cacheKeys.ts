/**
 * Central Redis key builders. Every cache key in ExcaliDash is produced here so
 * the layout is documented in one place and the configurable REDIS_PREFIX is
 * applied consistently (multi-tenant / shared-Redis friendly).
 *
 * Documented layout (prefix defaults to "excalidash:"):
 *   <prefix>drawing:{drawingId}:current        -> cached raw Drawing row (hot read)
 *   <prefix>drawing:{drawingId}:save-lock      -> advisory save lock (SET NX EX)
 *   <prefix>drawing:{drawingId}:save-state     -> light save coordination state
 *   <prefix>user:{userId}:drawings:gen         -> per-user listing generation counter
 *   <prefix>user:{userId}:drawings:list:{gen}:{queryHash} -> cached listing body
 *   <prefix>user:{userId}:collections:list     -> cached collections metadata
 *
 * Listing keys embed a per-user "generation" segment so invalidation is O(1):
 * bumping the generation counter makes every previous listing key unreachable
 * (they then expire via TTL) without a SCAN/DEL sweep on the hot save path.
 */
export interface CacheKeyBuilder {
  drawingCurrent(drawingId: string): string;
  drawingSaveLock(drawingId: string): string;
  drawingSaveState(drawingId: string): string;
  userListGeneration(userId: string): string;
  userDrawingsList(
    userId: string,
    generation: number | string,
    queryHash: string,
  ): string;
  userCollectionsList(userId: string): string;
}

/** Normalize the configured prefix to always end with a single ":" (or be empty). */
export const normalizeCachePrefix = (prefix: string): string => {
  const trimmed = (prefix ?? "").trim();
  if (trimmed.length === 0) return "";
  return trimmed.endsWith(":") ? trimmed : `${trimmed}:`;
};

export const createCacheKeys = (prefix: string): CacheKeyBuilder => {
  const p = normalizeCachePrefix(prefix);
  return {
    drawingCurrent: (drawingId) => `${p}drawing:${drawingId}:current`,
    drawingSaveLock: (drawingId) => `${p}drawing:${drawingId}:save-lock`,
    drawingSaveState: (drawingId) => `${p}drawing:${drawingId}:save-state`,
    userListGeneration: (userId) => `${p}user:${userId}:drawings:gen`,
    userDrawingsList: (userId, generation, queryHash) =>
      `${p}user:${userId}:drawings:list:${generation}:${queryHash}`,
    userCollectionsList: (userId) => `${p}user:${userId}:collections:list`,
  };
};
