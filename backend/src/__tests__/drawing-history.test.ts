import { describe, expect, it, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { registerDrawingRoutes } from "../routes/dashboard/drawings";

/**
 * Tests for the Drawing Version History feature:
 * - Snapshots are created on scene updates
 * - GET /drawings/:id/history returns snapshot list
 * - GET /drawings/:id/history/:snapshotId returns full snapshot
 * - POST /drawings/:id/history/:snapshotId/restore restores a snapshot
 */

const MOCK_USER_ID = "user-1";
const MOCK_DRAWING_ID = "drawing-1";
const MOCK_SNAPSHOT_ID = "snapshot-1";

const mockDrawing = {
  id: MOCK_DRAWING_ID,
  name: "Test Drawing",
  elements: JSON.stringify([{ id: "el-1", type: "rectangle" }]),
  appState: JSON.stringify({ viewBackgroundColor: "#ffffff" }),
  files: "{}",
  version: 5,
  userId: MOCK_USER_ID,
  collectionId: null,
  preview: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSnapshot = {
  id: MOCK_SNAPSHOT_ID,
  drawingId: MOCK_DRAWING_ID,
  version: 4,
  elements: JSON.stringify([{ id: "el-old", type: "ellipse" }]),
  appState: JSON.stringify({ viewBackgroundColor: "#eeeeee" }),
  files: "{}",
  createdAt: new Date("2026-04-15T10:00:00Z"),
};

function buildApp() {
  const prisma = {
    drawing: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    drawingSnapshot: {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    drawingPermission: { findMany: vi.fn().mockResolvedValue([]) },
    drawingLinkShare: { findMany: vi.fn().mockResolvedValue([]) },
    collection: { findFirst: vi.fn() },
  } as any;

  const app = express();
  app.use(express.json());
  // Inject mock user
  app.use((req: any, _res: any, next: any) => {
    req.user = { id: MOCK_USER_ID, role: "USER" };
    next();
  });

  const drawingUpdateSchema = { safeParse: vi.fn() };

  registerDrawingRoutes(app, {
    prisma,
    requireAuth: (_req: any, _res: any, next: any) => next(),
    optionalAuth: (_req: any, _res: any, next: any) => next(),
    asyncHandler: (fn: any) => (req: any, res: any, next: any) => Promise.resolve(fn(req, res, next)).catch(next),
    parseJsonField: (val: string, fallback: any) => { try { return JSON.parse(val); } catch { return fallback; } },
    validateImportedDrawing: vi.fn().mockReturnValue(true),
    drawingCreateSchema: { safeParse: vi.fn().mockReturnValue({ success: true, data: {} }) },
    drawingUpdateSchema,
    respondWithValidationErrors: vi.fn(),
    ensureTrashCollection: vi.fn(),
    invalidateDrawingsCache: vi.fn(),
    buildDrawingsCacheKey: vi.fn(),
    getCachedDrawingsBody: vi.fn().mockReturnValue(null),
    cacheDrawingsResponse: vi.fn(
      (_key: string, payload: unknown) => Buffer.from(JSON.stringify(payload)),
    ),
    MAX_PAGE_SIZE: 100,
    config: {
      nodeEnv: "test",
      enableAuditLogging: false,
      snapshots: {
        maxPerDrawing: 15,
        pruneOnSave: true,
        pruneOnStartup: false,
        minIntervalSeconds: 300,
        onEverySave: false,
        forceOnVersionChange: true,
        async: false,
      },
      imageOptimization: {
        enabled: false,
        maxWidth: 1920,
        maxHeight: 1920,
        webpQuality: 82,
        jpegQuality: 82,
        pngCompressionLevel: 9,
        minBytes: 200000,
        cacheEnabled: true,
      },
      savePerf: { enabled: false, slowMs: 1000 },
    },
    logAuditEvent: vi.fn(),
  });

  return { app, prisma, drawingUpdateSchema };
}

describe("Drawing Version History", () => {
  let app: express.Express;
  let prisma: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    ({ app, prisma } = buildApp());
  });

  describe("GET /drawings/:id/history", () => {
    it("returns snapshot list for a drawing", async () => {
      prisma.drawing.findUnique.mockResolvedValue(mockDrawing);
      prisma.drawing.findFirst.mockResolvedValue(mockDrawing);
      prisma.drawingSnapshot.findMany.mockResolvedValue([
        { id: "snap-1", version: 4, createdAt: new Date("2026-04-15T10:00:00Z") },
        { id: "snap-2", version: 3, createdAt: new Date("2026-04-15T09:00:00Z") },
      ]);
      prisma.drawingSnapshot.count.mockResolvedValue(2);

      const res = await request(app).get(`/drawings/${MOCK_DRAWING_ID}/history`);

      expect(res.status).toBe(200);
      expect(res.body.snapshots).toHaveLength(2);
      expect(res.body.totalCount).toBe(2);
      expect(res.body.snapshots[0]).toHaveProperty("id");
      expect(res.body.snapshots[0]).toHaveProperty("version");
      expect(res.body.snapshots[0]).toHaveProperty("createdAt");
      // Should NOT include elements (metadata only)
      expect(res.body.snapshots[0]).not.toHaveProperty("elements");
    });

    it("returns empty list when no snapshots exist", async () => {
      prisma.drawing.findUnique.mockResolvedValue(mockDrawing);
      prisma.drawing.findFirst.mockResolvedValue(mockDrawing);
      prisma.drawingSnapshot.findMany.mockResolvedValue([]);
      prisma.drawingSnapshot.count.mockResolvedValue(0);

      const res = await request(app).get(`/drawings/${MOCK_DRAWING_ID}/history`);

      expect(res.status).toBe(200);
      expect(res.body.snapshots).toHaveLength(0);
      expect(res.body.totalCount).toBe(0);
    });

    it("respects limit and offset parameters", async () => {
      prisma.drawing.findUnique.mockResolvedValue(mockDrawing);
      prisma.drawing.findFirst.mockResolvedValue(mockDrawing);
      prisma.drawingSnapshot.findMany.mockResolvedValue([]);
      prisma.drawingSnapshot.count.mockResolvedValue(0);

      await request(app).get(`/drawings/${MOCK_DRAWING_ID}/history?limit=10&offset=5`);

      expect(prisma.drawingSnapshot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10, skip: 5 })
      );
    });
  });

  describe("GET /drawings/:id/history/:snapshotId", () => {
    it("returns full snapshot data for preview", async () => {
      prisma.drawing.findUnique.mockResolvedValue(mockDrawing);
      prisma.drawing.findFirst.mockResolvedValue(mockDrawing);
      prisma.drawingSnapshot.findFirst.mockResolvedValue(mockSnapshot);

      const res = await request(app).get(`/drawings/${MOCK_DRAWING_ID}/history/${MOCK_SNAPSHOT_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(MOCK_SNAPSHOT_ID);
      expect(res.body.version).toBe(4);
      expect(Array.isArray(res.body.elements)).toBe(true);
      expect(res.body.elements[0].id).toBe("el-old");
    });

    it("returns 404 for non-existent snapshot", async () => {
      prisma.drawing.findUnique.mockResolvedValue(mockDrawing);
      prisma.drawing.findFirst.mockResolvedValue(mockDrawing);
      prisma.drawingSnapshot.findFirst.mockResolvedValue(null);

      const res = await request(app).get(`/drawings/${MOCK_DRAWING_ID}/history/nonexistent`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Snapshot not found");
    });
  });

  describe("POST /drawings/:id/history/:snapshotId/restore", () => {
    it("restores a snapshot and creates backup of current state", async () => {
      prisma.drawing.findUnique.mockResolvedValue(mockDrawing);
      prisma.drawing.findFirst.mockResolvedValue(mockDrawing);
      prisma.drawingSnapshot.findFirst.mockResolvedValue(mockSnapshot);
      prisma.drawingSnapshot.create.mockResolvedValue({});
      prisma.drawing.update.mockResolvedValue({
        ...mockDrawing,
        elements: mockSnapshot.elements,
        appState: mockSnapshot.appState,
        files: mockSnapshot.files,
        version: 6,
      });

      const res = await request(app).post(`/drawings/${MOCK_DRAWING_ID}/history/${MOCK_SNAPSHOT_ID}/restore`);

      expect(res.status).toBe(200);

      // Should create a backup snapshot of current state
      expect(prisma.drawingSnapshot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          drawingId: MOCK_DRAWING_ID,
          version: 5,
          elements: mockDrawing.elements,
        }),
      });

      // Should update drawing with snapshot data
      expect(prisma.drawing.update).toHaveBeenCalledWith({
        where: { id: MOCK_DRAWING_ID },
        data: expect.objectContaining({
          elements: mockSnapshot.elements,
          appState: mockSnapshot.appState,
          files: mockSnapshot.files,
        }),
      });
    });

    it("returns 404 for non-existent snapshot", async () => {
      prisma.drawing.findUnique.mockResolvedValue(mockDrawing);
      prisma.drawing.findFirst.mockResolvedValue(mockDrawing);
      prisma.drawingSnapshot.findFirst.mockResolvedValue(null);

      const res = await request(app).post(`/drawings/${MOCK_DRAWING_ID}/history/nonexistent/restore`);

      expect(res.status).toBe(404);
    });
  });

  describe("Smart snapshot on scene update (PUT /drawings/:id)", () => {
    const sceneUpdate = {
      elements: [{ id: "el-new", type: "text" }],
      appState: { viewBackgroundColor: "#000" },
      version: 5,
    };

    const setupSceneSave = (
      ctx: ReturnType<typeof buildApp>,
      lastSnapshot: { createdAt: Date } | null,
    ) => {
      ctx.prisma.drawing.findUnique.mockResolvedValue(mockDrawing);
      ctx.prisma.drawing.updateMany.mockResolvedValue({ count: 1 });
      ctx.prisma.drawing.findFirst.mockResolvedValue({ ...mockDrawing, version: 6 });
      ctx.prisma.drawingSnapshot.findFirst.mockResolvedValue(lastSnapshot);
      ctx.prisma.drawingSnapshot.create.mockResolvedValue({});
      ctx.drawingUpdateSchema.safeParse.mockReturnValue({ success: true, data: sceneUpdate });
    };

    it("creates the FIRST snapshot when the drawing has no history yet", async () => {
      const ctx = buildApp();
      setupSceneSave(ctx, null); // no prior snapshot

      const res = await request(ctx.app)
        .put(`/drawings/${MOCK_DRAWING_ID}`)
        .send(sceneUpdate);

      expect(res.status).toBe(200);
      // Pre-update state is captured (version 5 = existing drawing version).
      expect(ctx.prisma.drawingSnapshot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          drawingId: MOCK_DRAWING_ID,
          version: mockDrawing.version,
          elements: mockDrawing.elements,
        }),
      });
    });

    it("does NOT create a snapshot again within the interval window", async () => {
      const ctx = buildApp();
      // A snapshot was just taken 1 second ago (< 300s interval).
      setupSceneSave(ctx, { createdAt: new Date(Date.now() - 1000) });

      const res = await request(ctx.app)
        .put(`/drawings/${MOCK_DRAWING_ID}`)
        .send(sceneUpdate);

      expect(res.status).toBe(200);
      expect(ctx.prisma.drawingSnapshot.create).not.toHaveBeenCalled();
      // The drawing itself is still updated.
      expect(ctx.prisma.drawing.updateMany).toHaveBeenCalled();
    });

    it("creates a snapshot once the interval has elapsed", async () => {
      const ctx = buildApp();
      // Last snapshot is 10 minutes old (> 300s interval).
      setupSceneSave(ctx, { createdAt: new Date(Date.now() - 10 * 60 * 1000) });

      const res = await request(ctx.app)
        .put(`/drawings/${MOCK_DRAWING_ID}`)
        .send(sceneUpdate);

      expect(res.status).toBe(200);
      expect(ctx.prisma.drawingSnapshot.create).toHaveBeenCalledOnce();
    });
  });

  describe("List route excludes giant fields by default", () => {
    it("GET /drawings selects only metadata (no elements/appState/files)", async () => {
      const ctx = buildApp();
      ctx.prisma.drawing.findMany.mockResolvedValue([]);
      ctx.prisma.drawing.count.mockResolvedValue(0);

      const res = await request(ctx.app).get(`/drawings`);

      expect(res.status).toBe(200);
      const findManyArgs = ctx.prisma.drawing.findMany.mock.calls[0][0];
      expect(findManyArgs.select).toBeDefined();
      expect(findManyArgs.select.elements).toBeUndefined();
      expect(findManyArgs.select.appState).toBeUndefined();
      expect(findManyArgs.select.files).toBeUndefined();
      expect(findManyArgs.select.id).toBe(true);
      expect(findManyArgs.select.preview).toBe(true);
    });
  });
});
