import { describe, it, expect, vi } from "vitest";
import {
  shouldCreateSnapshot,
  createSnapshotWriter,
  type SnapshotData,
} from "./snapshotService";

const baseDecision = {
  hasAnySnapshot: true,
  lastSnapshotAtMs: 1_000_000,
  nowMs: 1_000_000,
  minIntervalSeconds: 300,
  onEverySave: false,
};

describe("shouldCreateSnapshot", () => {
  it("always snapshots an explicit checkpoint", () => {
    expect(shouldCreateSnapshot({ ...baseDecision, forceCheckpoint: true })).toBe(true);
  });

  it("always snapshots when the drawing has no history yet", () => {
    expect(
      shouldCreateSnapshot({ ...baseDecision, hasAnySnapshot: false }),
    ).toBe(true);
  });

  it("snapshots every save when onEverySave is set", () => {
    expect(shouldCreateSnapshot({ ...baseDecision, onEverySave: true })).toBe(true);
  });

  it("snapshots when interval gating is disabled (<= 0)", () => {
    expect(
      shouldCreateSnapshot({ ...baseDecision, minIntervalSeconds: 0 }),
    ).toBe(true);
  });

  it("does NOT snapshot before the interval has elapsed", () => {
    expect(
      shouldCreateSnapshot({
        ...baseDecision,
        lastSnapshotAtMs: 1_000_000,
        nowMs: 1_000_000 + 200 * 1000, // 200s < 300s
      }),
    ).toBe(false);
  });

  it("snapshots once the interval has elapsed", () => {
    expect(
      shouldCreateSnapshot({
        ...baseDecision,
        lastSnapshotAtMs: 1_000_000,
        nowMs: 1_000_000 + 300 * 1000, // exactly 300s
      }),
    ).toBe(true);
  });
});

const data = (drawingId: string, version = 1): SnapshotData => ({
  drawingId,
  version,
  elements: "[]",
  appState: "{}",
  files: "{}",
});

const makePrisma = () => ({
  drawingSnapshot: {
    create: vi.fn().mockResolvedValue({}),
    findMany: vi.fn().mockResolvedValue([]),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
});

describe("createSnapshotWriter", () => {
  it("writeNow creates the snapshot and prunes when pruneOnSave is true", async () => {
    const prisma = makePrisma();
    prisma.drawingSnapshot.findMany.mockResolvedValueOnce([{ id: "old" }]);
    prisma.drawingSnapshot.deleteMany.mockResolvedValueOnce({ count: 1 });
    const writer = createSnapshotWriter({ prisma, maxPerDrawing: 15, pruneOnSave: true });
    const result = await writer.writeNow(data("d1"));
    expect(prisma.drawingSnapshot.create).toHaveBeenCalledOnce();
    expect(result.deleted).toBe(1);
  });

  it("writeNow does not prune when pruneOnSave is false", async () => {
    const prisma = makePrisma();
    const writer = createSnapshotWriter({ prisma, maxPerDrawing: 15, pruneOnSave: false });
    const result = await writer.writeNow(data("d1"));
    expect(prisma.drawingSnapshot.create).toHaveBeenCalledOnce();
    expect(prisma.drawingSnapshot.findMany).not.toHaveBeenCalled();
    expect(result.deleted).toBe(0);
  });

  it("coalesces concurrent enqueues for the same drawing", async () => {
    const prisma = makePrisma();
    let resolveCreate: (() => void) | null = null;
    prisma.drawingSnapshot.create.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          // Block the first write so subsequent enqueues pile up as one pending.
          if (!resolveCreate) resolveCreate = resolve;
          else resolve();
        }),
    );
    const writer = createSnapshotWriter({ prisma, maxPerDrawing: 15, pruneOnSave: false });

    writer.enqueue(data("d1", 1)); // starts draining (blocked on create)
    writer.enqueue(data("d1", 2)); // pending
    writer.enqueue(data("d1", 3)); // replaces pending (coalesced)
    expect(writer.pendingCount()).toBe(1);

    resolveCreate!(); // let the in-flight write finish; pending (v3) then runs
    await writer.whenIdle();

    // 2 writes total: the in-flight v1 + the single coalesced pending (v3).
    expect(prisma.drawingSnapshot.create).toHaveBeenCalledTimes(2);
    expect(writer.pendingCount()).toBe(0);
  });

  it("never throws when an async write fails (best-effort)", async () => {
    const prisma = makePrisma();
    prisma.drawingSnapshot.create.mockRejectedValue(new Error("db down"));
    const logger = { error: vi.fn() };
    const writer = createSnapshotWriter({ prisma, maxPerDrawing: 15, pruneOnSave: false, logger });
    writer.enqueue(data("d1"));
    await writer.whenIdle();
    expect(logger.error).toHaveBeenCalled();
  });
});
