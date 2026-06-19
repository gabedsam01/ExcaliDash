/**
 * Drawing persistence adapter for MCP tools. Every operation is scoped to the
 * authenticated user (ownership isolation). Scenes are stored as JSON strings
 * in the existing Drawing model; snapshots use DrawingSnapshot.
 */
import type { ExcalidrawElement, ExcalidrawScene } from "../types";
import { invalid, notFound } from "../errors";
import { pruneDrawingSnapshots } from "../../drawings/snapshotRetention";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface McpDrawingPrisma {
  drawing: {
    create(args: any): Promise<any>;
    findFirst(args: any): Promise<any | null>;
    update(args: any): Promise<any>;
  };
  drawingSnapshot: {
    create(args: any): Promise<any>;
    findMany(args: any): Promise<Array<{ id: string }>>;
    deleteMany(args: any): Promise<{ count: number }>;
  };
  collection: {
    findFirst(args: any): Promise<any | null>;
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export type SceneSanitizer = (data: {
  elements: unknown[];
  appState: Record<string, unknown>;
  files: Record<string, unknown>;
  preview?: string | null;
  name?: string;
}) => {
  elements: ExcalidrawElement[];
  appState: Record<string, unknown>;
  files: Record<string, unknown>;
  preview?: string | null;
};

export interface DrawingServiceDeps {
  prisma: McpDrawingPrisma;
  frontendBaseUrl: string | null;
  maxElements: number;
  sanitizeScene: SceneSanitizer;
  /** Snapshot retention. When omitted, snapshots are never pruned. */
  retention?: { maxPerDrawing: number; pruneOnSave: boolean };
  /**
   * Optional cache invalidation hook fired after an MCP tool creates or updates
   * a drawing, so the REST hot-drawing + listing caches stay consistent.
   */
  onDrawingChanged?: (params: { userId: string; drawingId: string }) => void;
}

export interface DrawingSummary {
  id: string;
  name: string;
  version: number;
  elementCount: number;
  collectionId: string | null;
  createdAt: string;
  updatedAt: string;
}

const parse = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== "string") return (value as T) ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const createDrawingService = (deps: DrawingServiceDeps) => {
  const { prisma, frontendBaseUrl, maxElements, sanitizeScene } = deps;

  // Keep snapshot history bounded for MCP-created checkpoints too. Best-effort:
  // a prune failure must never break the underlying tool call.
  const pruneSnapshotsIfEnabled = async (drawingId: string): Promise<void> => {
    if (!deps.retention?.pruneOnSave) return;
    try {
      await pruneDrawingSnapshots(prisma, drawingId, deps.retention.maxPerDrawing);
    } catch (err) {
      console.error("[mcp] snapshot prune failed", {
        drawingId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  // Mirror the REST guard: a caller may only attach a drawing to a collection
  // they own. (FK alone allows pointing at another tenant's collection id.)
  const assertCollectionOwned = async (
    userId: string,
    collectionId: string | null | undefined,
  ): Promise<void> => {
    if (!collectionId) return;
    const owned = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
      select: { id: true },
    });
    if (!owned) {
      throw notFound(`Collection not found: ${collectionId}`);
    }
  };

  const normalizeScene = (
    scene: Partial<ExcalidrawScene>,
    name: string,
  ): {
    elements: ExcalidrawElement[];
    appState: Record<string, unknown>;
    files: Record<string, unknown>;
    preview: string | null;
  } => {
    const rawElements = Array.isArray(scene.elements) ? scene.elements : [];
    if (rawElements.length > maxElements) {
      throw invalid(
        `Scene has ${rawElements.length} elements; the limit is ${maxElements}.`,
      );
    }
    const sanitized = sanitizeScene({
      elements: rawElements,
      appState:
        scene.appState && typeof scene.appState === "object"
          ? (scene.appState as Record<string, unknown>)
          : {},
      files:
        scene.files && typeof scene.files === "object"
          ? (scene.files as Record<string, unknown>)
          : {},
      preview: null,
      name,
    });
    return {
      elements: sanitized.elements,
      appState: sanitized.appState,
      files: sanitized.files,
      preview: sanitized.preview ?? null,
    };
  };

  const toSummary = (drawing: {
    id: string;
    name: string;
    version: number;
    elements: unknown;
    collectionId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): DrawingSummary => ({
    id: drawing.id,
    name: drawing.name,
    version: drawing.version,
    elementCount: parse<unknown[]>(drawing.elements, []).length,
    collectionId: drawing.collectionId ?? null,
    createdAt: new Date(drawing.createdAt).toISOString(),
    updatedAt: new Date(drawing.updatedAt).toISOString(),
  });

  const createDrawing = async (
    userId: string,
    params: {
      name: string;
      scene: Partial<ExcalidrawScene>;
      collectionId?: string | null;
      preview?: string | null;
    },
  ): Promise<DrawingSummary> => {
    await assertCollectionOwned(userId, params.collectionId);
    const normalized = normalizeScene(params.scene, params.name);
    const drawing = await prisma.drawing.create({
      data: {
        name: params.name.slice(0, 255) || "Untitled",
        elements: JSON.stringify(normalized.elements),
        appState: JSON.stringify(normalized.appState),
        files: JSON.stringify(normalized.files),
        preview: params.preview ?? normalized.preview ?? null,
        version: 1,
        userId,
        ...(params.collectionId ? { collectionId: params.collectionId } : {}),
      },
    });
    deps.onDrawingChanged?.({ userId, drawingId: drawing.id });
    return toSummary(drawing);
  };

  const getOwned = async (
    userId: string,
    id: string,
  ): Promise<{
    id: string;
    name: string;
    version: number;
    elements: string;
    appState: string;
    files: string;
    collectionId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> => {
    const drawing = await prisma.drawing.findFirst({
      where: { id, userId },
    });
    if (!drawing) {
      throw notFound(`Drawing not found: ${id}`);
    }
    return drawing;
  };

  const getDrawing = async (
    userId: string,
    id: string,
    options: { includeData?: boolean } = {},
  ): Promise<
    DrawingSummary & {
      scene?: ExcalidrawScene;
    }
  > => {
    const drawing = await getOwned(userId, id);
    const summary = toSummary(drawing);
    if (!options.includeData) return summary;
    return {
      ...summary,
      scene: {
        type: "excalidraw",
        version: 2,
        source: "excalidash",
        elements: parse<ExcalidrawElement[]>(drawing.elements, []),
        appState: parse<Record<string, unknown>>(drawing.appState, {}),
        files: parse<Record<string, unknown>>(drawing.files, {}),
      },
    };
  };

  const snapshot = async (
    userId: string,
    id: string,
  ): Promise<{ version: number }> => {
    const drawing = await getOwned(userId, id);
    await prisma.drawingSnapshot.create({
      data: {
        drawingId: drawing.id,
        version: drawing.version,
        elements: drawing.elements,
        appState: drawing.appState,
        files: drawing.files,
      },
    });
    await pruneSnapshotsIfEnabled(drawing.id);
    return { version: drawing.version };
  };

  const updateDrawing = async (
    userId: string,
    id: string,
    params: {
      name?: string;
      scene?: Partial<ExcalidrawScene>;
      collectionId?: string | null;
      preview?: string | null;
      createVersion?: boolean;
    },
  ): Promise<DrawingSummary> => {
    const owned = await getOwned(userId, id);
    if (params.collectionId) {
      await assertCollectionOwned(userId, params.collectionId);
    }
    if (params.createVersion) {
      await prisma.drawingSnapshot.create({
        data: {
          drawingId: owned.id,
          version: owned.version,
          elements: owned.elements,
          appState: owned.appState,
          files: owned.files,
        },
      });
      await pruneSnapshotsIfEnabled(owned.id);
    }

    const data: Record<string, unknown> = {};
    if (typeof params.name === "string") {
      data.name = params.name.slice(0, 255) || owned.name;
    }
    if (params.collectionId !== undefined) {
      data.collectionId = params.collectionId;
    }
    if (params.scene) {
      const normalized = normalizeScene(params.scene, params.name ?? owned.name);
      data.elements = JSON.stringify(normalized.elements);
      data.appState = JSON.stringify(normalized.appState);
      data.files = JSON.stringify(normalized.files);
      if (params.preview !== undefined || normalized.preview) {
        data.preview = params.preview ?? normalized.preview ?? null;
      }
      data.version = owned.version + 1;
    } else if (params.preview !== undefined) {
      data.preview = params.preview;
    }

    const updated = await prisma.drawing.update({
      where: { id: owned.id },
      data,
    });
    deps.onDrawingChanged?.({ userId, drawingId: owned.id });
    return toSummary(updated);
  };

  const getDrawingUrl = async (
    userId: string,
    id: string,
  ): Promise<{ id: string; url: string | null; editUrl: string | null; path: string }> => {
    await getOwned(userId, id);
    const path = `/editor/${id}`;
    const base = frontendBaseUrl ? frontendBaseUrl.replace(/\/+$/, "") : null;
    const url = base ? `${base}${path}` : null;
    return { id, url, editUrl: url, path };
  };

  return {
    createDrawing,
    getDrawing,
    updateDrawing,
    snapshot,
    getDrawingUrl,
    toSummary,
  };
};

export type DrawingService = ReturnType<typeof createDrawingService>;
