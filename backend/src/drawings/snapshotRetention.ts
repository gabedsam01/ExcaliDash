/**
 * DrawingSnapshot retention.
 *
 * A single large Excalidraw drawing (hundreds of embedded images / dataURLs)
 * can otherwise accumulate thousands of multi-MB snapshots and balloon the
 * `DrawingSnapshot` table. Retention keeps only the newest N snapshots per
 * drawing, where "newest" is ordered by version DESC, then createdAt DESC,
 * then id DESC (stable tie-breaker).
 */

export interface SnapshotRetentionRow {
  id: string;
  version: number;
  createdAt: Date | string | number;
}

const toTimeMs = (value: Date | string | number): number => {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Ordering used for retention: most-recent-first.
 * Returns < 0 when `a` is newer (should be kept ahead of `b`).
 */
export const compareSnapshotsForRetention = (
  a: SnapshotRetentionRow,
  b: SnapshotRetentionRow,
): number => {
  if (b.version !== a.version) return b.version - a.version; // version DESC
  const at = toTimeMs(a.createdAt);
  const bt = toTimeMs(b.createdAt);
  if (bt !== at) return bt - at; // createdAt DESC
  if (a.id === b.id) return 0; // id DESC
  return a.id < b.id ? 1 : -1;
};

/**
 * Given all snapshots for a drawing and the keep limit, return the ids that
 * should be deleted (i.e. everything beyond the newest `keep`).
 *
 * `keep <= 0` disables retention and never deletes anything.
 */
export const selectSnapshotIdsToDelete = (
  snapshots: readonly SnapshotRetentionRow[],
  keep: number,
): string[] => {
  if (!Number.isFinite(keep) || keep <= 0) return [];
  if (snapshots.length <= keep) return [];
  const sorted = [...snapshots].sort(compareSnapshotsForRetention);
  return sorted.slice(keep).map((row) => row.id);
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RetentionPrisma {
  drawingSnapshot: {
    findMany(args: any): Promise<Array<{ id: string }>>;
    deleteMany(args: any): Promise<{ count: number }>;
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Delete every snapshot of `drawingId` beyond the newest `keep`. Ordering is
 * pushed down to PostgreSQL (version DESC, createdAt DESC, id DESC), matching
 * `compareSnapshotsForRetention`, and only the surplus rows are loaded — never
 * the whole history — so this stays cheap even for huge tables.
 *
 * Deletes in bounded batches to avoid a single unbounded `IN (...)` statement.
 */
export const pruneDrawingSnapshots = async (
  prisma: RetentionPrisma,
  drawingId: string,
  keep: number,
  options: { batchSize?: number } = {},
): Promise<{ deleted: number }> => {
  if (!Number.isFinite(keep) || keep <= 0) return { deleted: 0 };

  const batchSize = options.batchSize && options.batchSize > 0 ? options.batchSize : 500;
  let deleted = 0;

  // Loop until `findMany(skip = keep)` returns nothing, i.e. only the newest
  // `keep` rows remain. Because the surplus is re-queried with the retention
  // ordering on every pass (never an absolute/stale offset), this is robust to
  // concurrent prunes of the same drawing: each call simply keeps deleting
  // rows ranked beyond `keep` until none are left, and the newest `keep` are
  // never in the surplus window. The iteration cap is a pathological backstop.
  const maxIterations = 100_000;
  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const surplus = await prisma.drawingSnapshot.findMany({
      where: { drawingId },
      select: { id: true },
      orderBy: [{ version: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      skip: keep,
      take: batchSize,
    });
    if (surplus.length === 0) break;
    const ids = surplus.map((row) => row.id);
    const result = await prisma.drawingSnapshot.deleteMany({
      where: { id: { in: ids } },
    });
    deleted += result.count;
  }

  return { deleted };
};
