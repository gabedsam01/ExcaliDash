/**
 * Integration tests for snapshot retention against a real PostgreSQL database.
 * Validates the production query path (orderBy version DESC, createdAt DESC,
 * id DESC + skip) used by `pruneDrawingSnapshots`, plus the smart-snapshot
 * writer end-to-end.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  getTestPrisma,
  cleanupTestDb,
  initTestDb,
  setupTestDb,
} from "./testUtils";
import { pruneDrawingSnapshots } from "../drawings/snapshotRetention";
import { createSnapshotWriter } from "../drawings/snapshotService";

describe("Snapshot retention (PostgreSQL)", () => {
  const prisma = getTestPrisma();
  let testUser: { id: string };

  beforeAll(async () => {
    setupTestDb();
    testUser = await initTestDb(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanupTestDb(prisma);
  });

  const createDrawing = async (name: string) =>
    prisma.drawing.create({
      data: {
        name,
        elements: "[]",
        appState: "{}",
        files: "{}",
        userId: testUser.id,
      },
    });

  const seedSnapshots = async (drawingId: string, count: number) => {
    for (let i = 1; i <= count; i++) {
      await prisma.drawingSnapshot.create({
        data: {
          drawingId,
          version: i,
          elements: `[{"v":${i}}]`,
          appState: "{}",
          files: "{}",
          createdAt: new Date(2026, 0, 1, 0, i, 0),
        },
      });
    }
  };

  it("keeps the newest 15 of 20 snapshots and deletes the rest", async () => {
    const drawing = await createDrawing("Big board");
    await seedSnapshots(drawing.id, 20);

    const { deleted } = await pruneDrawingSnapshots(prisma, drawing.id, 15);
    expect(deleted).toBe(5);

    const remaining = await prisma.drawingSnapshot.findMany({
      where: { drawingId: drawing.id },
      select: { version: true },
      orderBy: { version: "asc" },
    });
    expect(remaining).toHaveLength(15);
    // The 5 lowest versions (1..5) were removed; 6..20 survive.
    expect(remaining.map((r) => r.version)).toEqual(
      Array.from({ length: 15 }, (_, i) => i + 6),
    );
  });

  it("prunes correctly across multiple batches (batched loop)", async () => {
    const drawing = await createDrawing("Many snapshots");
    await seedSnapshots(drawing.id, 60);

    // Small batch size forces several findMany/deleteMany passes.
    const { deleted } = await pruneDrawingSnapshots(prisma, drawing.id, 15, {
      batchSize: 20,
    });
    expect(deleted).toBe(45);

    const remaining = await prisma.drawingSnapshot.findMany({
      where: { drawingId: drawing.id },
      select: { version: true },
      orderBy: { version: "asc" },
    });
    expect(remaining).toHaveLength(15);
    expect(remaining.map((r) => r.version)).toEqual(
      Array.from({ length: 15 }, (_, i) => i + 46),
    );
  });

  it("does not touch snapshots of other drawings", async () => {
    const a = await createDrawing("A");
    const b = await createDrawing("B");
    await seedSnapshots(a.id, 20);
    await seedSnapshots(b.id, 8);

    await pruneDrawingSnapshots(prisma, a.id, 15);

    const bCount = await prisma.drawingSnapshot.count({ where: { drawingId: b.id } });
    expect(bCount).toBe(8); // untouched
    const aCount = await prisma.drawingSnapshot.count({ where: { drawingId: a.id } });
    expect(aCount).toBe(15);
  });

  it("never deletes when keep <= 0 (retention disabled)", async () => {
    const drawing = await createDrawing("Keep all");
    await seedSnapshots(drawing.id, 20);

    const { deleted } = await pruneDrawingSnapshots(prisma, drawing.id, 0);
    expect(deleted).toBe(0);
    const count = await prisma.drawingSnapshot.count({ where: { drawingId: drawing.id } });
    expect(count).toBe(20);
  });

  it("smart writer creates a snapshot and prunes to the limit", async () => {
    const drawing = await createDrawing("Writer board");
    await seedSnapshots(drawing.id, 15); // already at the limit

    const writer = createSnapshotWriter({ prisma, maxPerDrawing: 15, pruneOnSave: true });
    const { deleted } = await writer.writeNow({
      drawingId: drawing.id,
      version: 99,
      elements: "[]",
      appState: "{}",
      files: "{}",
    });

    expect(deleted).toBe(1); // 16th created -> oldest pruned back to 15
    const count = await prisma.drawingSnapshot.count({ where: { drawingId: drawing.id } });
    expect(count).toBe(15);
    // The just-written version (99) is the newest and must survive.
    const newest = await prisma.drawingSnapshot.findFirst({
      where: { drawingId: drawing.id },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    expect(newest?.version).toBe(99);
  });
});
