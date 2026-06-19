import { describe, it, expect, vi } from "vitest";
import {
  compareSnapshotsForRetention,
  selectSnapshotIdsToDelete,
  pruneDrawingSnapshots,
  type SnapshotRetentionRow,
} from "./snapshotRetention";

const row = (
  id: string,
  version: number,
  createdAt: string,
): SnapshotRetentionRow => ({ id, version, createdAt });

describe("selectSnapshotIdsToDelete", () => {
  it("keeps the newest N and deletes the rest (20 -> keep 15 -> delete 5)", () => {
    const snapshots = Array.from({ length: 20 }, (_, i) =>
      row(`snap-${i}`, i + 1, `2026-01-01T00:${String(i).padStart(2, "0")}:00Z`),
    );
    const toDelete = selectSnapshotIdsToDelete(snapshots, 15);
    expect(toDelete).toHaveLength(5);
    // The 5 deleted are the lowest versions (1..5 => snap-0..snap-4).
    expect(new Set(toDelete)).toEqual(
      new Set(["snap-0", "snap-1", "snap-2", "snap-3", "snap-4"]),
    );
  });

  it("keeps the highest versions regardless of input order", () => {
    const snapshots = [
      row("a", 3, "2026-01-01T00:00:00Z"),
      row("b", 1, "2026-01-01T00:00:00Z"),
      row("c", 5, "2026-01-01T00:00:00Z"),
      row("d", 2, "2026-01-01T00:00:00Z"),
    ];
    const toDelete = selectSnapshotIdsToDelete(snapshots, 2);
    // Keep versions 5 (c) and 3 (a); delete 2 (d) and 1 (b).
    expect(new Set(toDelete)).toEqual(new Set(["b", "d"]));
  });

  it("breaks version ties by createdAt DESC, then id DESC", () => {
    const snapshots = [
      row("aaa", 7, "2026-01-01T00:00:00Z"),
      row("bbb", 7, "2026-01-01T00:00:00Z"), // same version + createdAt as aaa
      row("ccc", 7, "2026-01-02T00:00:00Z"), // newest createdAt
    ];
    // keep 1 -> newest createdAt wins (ccc); delete aaa + bbb.
    expect(selectSnapshotIdsToDelete(snapshots, 1).sort()).toEqual(["aaa", "bbb"]);
    // keep 2 -> ccc + (id DESC tie winner "bbb") kept; only "aaa" is dropped.
    expect(selectSnapshotIdsToDelete(snapshots, 2)).toEqual(["aaa"]);
  });

  it("never deletes when keep <= 0 (retention disabled)", () => {
    const snapshots = [row("a", 1, "2026-01-01T00:00:00Z"), row("b", 2, "2026-01-01T00:00:00Z")];
    expect(selectSnapshotIdsToDelete(snapshots, 0)).toEqual([]);
    expect(selectSnapshotIdsToDelete(snapshots, -5)).toEqual([]);
  });

  it("returns nothing when at or under the limit", () => {
    const snapshots = [row("a", 1, "2026-01-01T00:00:00Z")];
    expect(selectSnapshotIdsToDelete(snapshots, 15)).toEqual([]);
  });
});

describe("compareSnapshotsForRetention", () => {
  it("orders newest-first by version", () => {
    const sorted = [
      row("a", 1, "2026-01-01T00:00:00Z"),
      row("b", 3, "2026-01-01T00:00:00Z"),
      row("c", 2, "2026-01-01T00:00:00Z"),
    ].sort(compareSnapshotsForRetention);
    expect(sorted.map((s) => s.id)).toEqual(["b", "c", "a"]);
  });
});

describe("pruneDrawingSnapshots", () => {
  it("deletes only the surplus rows for the target drawing", async () => {
    const prisma = {
      drawingSnapshot: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ id: "x1" }, { id: "x2" }])
          .mockResolvedValueOnce([]),
        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const result = await pruneDrawingSnapshots(prisma, "draw-1", 15);
    expect(result.deleted).toBe(2);
    // Surplus is selected by skipping the newest `keep` with retention ordering.
    expect(prisma.drawingSnapshot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { drawingId: "draw-1" },
        skip: 15,
        orderBy: [
          { version: "desc" },
          { createdAt: "desc" },
          { id: "desc" },
        ],
      }),
    );
    expect(prisma.drawingSnapshot.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["x1", "x2"] } },
    });
  });

  it("does nothing when keep <= 0", async () => {
    const prisma = {
      drawingSnapshot: { findMany: vi.fn(), deleteMany: vi.fn() },
    };
    const result = await pruneDrawingSnapshots(prisma, "draw-1", 0);
    expect(result.deleted).toBe(0);
    expect(prisma.drawingSnapshot.findMany).not.toHaveBeenCalled();
    expect(prisma.drawingSnapshot.deleteMany).not.toHaveBeenCalled();
  });

  it("loops until findMany returns no more surplus (robust to concurrency)", async () => {
    const prisma = {
      drawingSnapshot: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ id: "a" }, { id: "b" }]) // full batch
          .mockResolvedValueOnce([{ id: "c" }]) // another batch
          .mockResolvedValueOnce([]), // drained -> stop (no early break on partial)
        deleteMany: vi
          .fn()
          .mockResolvedValueOnce({ count: 2 })
          .mockResolvedValueOnce({ count: 1 }),
      },
    };
    const result = await pruneDrawingSnapshots(prisma, "draw-1", 15, { batchSize: 2 });
    expect(result.deleted).toBe(3);
    expect(prisma.drawingSnapshot.deleteMany).toHaveBeenCalledTimes(2);
    // Re-queries after the partial batch instead of trusting a stale count.
    expect(prisma.drawingSnapshot.findMany).toHaveBeenCalledTimes(3);
  });
});
