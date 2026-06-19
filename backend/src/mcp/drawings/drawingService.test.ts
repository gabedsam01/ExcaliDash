import { beforeEach, describe, expect, it } from "vitest";
import { createDrawingService } from "./drawingService";
import { createMcpFakePrisma, type McpFakePrisma } from "../__testfixtures__/fakePrisma";
import type { ExcalidrawScene } from "../types";

const identitySanitizer = (d: {
  elements: unknown[];
  appState: Record<string, unknown>;
  files: Record<string, unknown>;
  preview?: string | null;
}) => ({
  elements: d.elements as never,
  appState: d.appState,
  files: d.files,
  preview: d.preview ?? null,
});

const sampleScene = (): ExcalidrawScene => ({
  type: "excalidraw",
  version: 2,
  source: "test",
  elements: [
    { id: "a", type: "rectangle", x: 0, y: 0, width: 100, height: 60 } as never,
  ],
  appState: { viewBackgroundColor: "#fff" },
  files: {},
});

describe("MCP drawing service (ownership)", () => {
  let prisma: McpFakePrisma;
  let service: ReturnType<typeof createDrawingService>;

  beforeEach(() => {
    prisma = createMcpFakePrisma();
    service = createDrawingService({
      prisma,
      frontendBaseUrl: "https://excali.test",
      maxElements: 5000,
      sanitizeScene: identitySanitizer,
    });
  });

  it("creates a drawing owned by the caller", async () => {
    const summary = await service.createDrawing("user-1", {
      name: "My Diagram",
      scene: sampleScene(),
    });
    expect(summary.version).toBe(1);
    expect(summary.elementCount).toBe(1);
    const rows = prisma.__drawings();
    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBe("user-1");
  });

  it("get/update are denied across users (ownership)", async () => {
    const summary = await service.createDrawing("user-1", {
      name: "Owned",
      scene: sampleScene(),
    });
    await expect(
      service.getDrawing("user-2", summary.id, { includeData: true }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      service.updateDrawing("user-2", summary.id, { name: "hax" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("returns scene data only when includeData=true", async () => {
    const summary = await service.createDrawing("user-1", {
      name: "Owned",
      scene: sampleScene(),
    });
    const meta = await service.getDrawing("user-1", summary.id);
    expect((meta as { scene?: unknown }).scene).toBeUndefined();
    const full = await service.getDrawing("user-1", summary.id, {
      includeData: true,
    });
    expect(full.scene?.elements).toHaveLength(1);
  });

  it("updates bump the version and can snapshot first", async () => {
    const summary = await service.createDrawing("user-1", {
      name: "Owned",
      scene: sampleScene(),
    });
    const updated = await service.updateDrawing("user-1", summary.id, {
      scene: sampleScene(),
      createVersion: true,
    });
    expect(updated.version).toBe(2);
    expect(prisma.__snapshots()).toHaveLength(1);
  });

  it("save_version snapshots the current state", async () => {
    const summary = await service.createDrawing("user-1", {
      name: "Owned",
      scene: sampleScene(),
    });
    const result = await service.snapshot("user-1", summary.id);
    expect(result.version).toBe(1);
    expect(prisma.__snapshots()).toHaveLength(1);
  });

  it("rejects attaching a drawing to a collection the caller does not own", async () => {
    prisma.__seedCollection({ id: "col-owned", userId: "user-1" });
    prisma.__seedCollection({ id: "col-other", userId: "user-2" });

    // Owned collection is accepted.
    await expect(
      service.createDrawing("user-1", {
        name: "ok",
        scene: sampleScene(),
        collectionId: "col-owned",
      }),
    ).resolves.toBeTruthy();

    // Another user's collection is rejected (cross-tenant placement blocked).
    await expect(
      service.createDrawing("user-1", {
        name: "hax",
        scene: sampleScene(),
        collectionId: "col-other",
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("builds an editable URL for the owner", async () => {
    const summary = await service.createDrawing("user-1", {
      name: "Owned",
      scene: sampleScene(),
    });
    const url = await service.getDrawingUrl("user-1", summary.id);
    expect(url.url).toBe(`https://excali.test/editor/${summary.id}`);
    await expect(service.getDrawingUrl("user-2", summary.id)).rejects.toMatchObject({
      status: 404,
    });
  });
});
