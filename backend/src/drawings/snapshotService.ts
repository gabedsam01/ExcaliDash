/**
 * "Smart snapshot" policy + async/coalescing writer.
 *
 * Goal: stop writing a heavy DrawingSnapshot on every autosave. A snapshot is
 * only created when it adds history value (first snapshot, an explicit
 * checkpoint, or once the minimum interval has elapsed), and the write+prune
 * can run off the response path so large saves stay fast.
 */
import { pruneDrawingSnapshots, type RetentionPrisma } from "./snapshotRetention";

export interface SnapshotDecisionInput {
  /** Whether the drawing already has at least one snapshot. */
  hasAnySnapshot: boolean;
  /** Timestamp (ms) of the most recent snapshot, or null if none. */
  lastSnapshotAtMs: number | null;
  /** Current time in ms. */
  nowMs: number;
  /** Minimum seconds between snapshots. <= 0 disables interval gating. */
  minIntervalSeconds: number;
  /** Force a snapshot on every save (overrides interval gating). */
  onEverySave: boolean;
  /** Explicit checkpoint (manual save / restore / version tool). */
  forceCheckpoint?: boolean;
}

/**
 * Decide whether a new snapshot should be created for this save.
 *
 * - Always snapshot explicit checkpoints.
 * - Always snapshot when the drawing has no history yet (so restore is possible).
 * - Otherwise snapshot only once the configured interval has elapsed
 *   (or immediately when interval gating / onEverySave says so).
 */
export const shouldCreateSnapshot = (input: SnapshotDecisionInput): boolean => {
  if (input.forceCheckpoint) return true;
  if (!input.hasAnySnapshot) return true;
  if (input.onEverySave) return true;
  if (input.minIntervalSeconds <= 0) return true;
  if (input.lastSnapshotAtMs == null) return true;
  return input.nowMs - input.lastSnapshotAtMs >= input.minIntervalSeconds * 1000;
};

export interface SnapshotData {
  drawingId: string;
  version: number;
  elements: string;
  appState: string;
  files: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SnapshotWriterPrisma extends RetentionPrisma {
  drawingSnapshot: RetentionPrisma["drawingSnapshot"] & {
    create(args: any): Promise<any>;
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface SnapshotWriterDeps {
  prisma: SnapshotWriterPrisma;
  /** Keep at most this many snapshots/drawing. <= 0 disables pruning. */
  maxPerDrawing: number;
  /** Prune right after creating a snapshot. */
  pruneOnSave: boolean;
  logger?: Pick<Console, "error">;
}

export interface SnapshotWriter {
  /** Create the snapshot (and prune) inline; resolves when persisted. */
  writeNow(data: SnapshotData): Promise<{ deleted: number }>;
  /**
   * Queue an async snapshot. At most one snapshot is pending per drawing;
   * a newer payload replaces an older pending one (coalescing). Never throws.
   */
  enqueue(data: SnapshotData): void;
  /** Number of drawings with a pending snapshot (for tests/diagnostics). */
  pendingCount(): number;
  /** Resolve once all in-flight + pending async writes have drained (tests). */
  whenIdle(): Promise<void>;
}

export const createSnapshotWriter = (deps: SnapshotWriterDeps): SnapshotWriter => {
  const logger = deps.logger ?? console;
  const pending = new Map<string, SnapshotData>();
  const active = new Set<string>();
  const idleWaiters: Array<() => void> = [];

  const signalIdleIfDone = (): void => {
    if (pending.size === 0 && active.size === 0) {
      while (idleWaiters.length) idleWaiters.shift()?.();
    }
  };

  const persist = async (data: SnapshotData): Promise<{ deleted: number }> => {
    await deps.prisma.drawingSnapshot.create({
      data: {
        drawingId: data.drawingId,
        version: data.version,
        elements: data.elements,
        appState: data.appState,
        files: data.files,
      },
    });
    if (deps.pruneOnSave) {
      return pruneDrawingSnapshots(deps.prisma, data.drawingId, deps.maxPerDrawing);
    }
    return { deleted: 0 };
  };

  const drain = async (drawingId: string): Promise<void> => {
    active.add(drawingId);
    try {
      while (pending.has(drawingId)) {
        const data = pending.get(drawingId)!;
        pending.delete(drawingId);
        try {
          await persist(data);
        } catch (err) {
          // Async snapshots are best-effort: a failure must never break the
          // user's save (which already responded successfully).
          logger.error("[snapshot] async write failed", {
            drawingId,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } finally {
      active.delete(drawingId);
      signalIdleIfDone();
    }
  };

  return {
    writeNow: (data) => persist(data),
    enqueue: (data) => {
      pending.set(data.drawingId, data); // coalesce to the latest payload
      if (active.has(data.drawingId)) return;
      void drain(data.drawingId);
    },
    pendingCount: () => pending.size,
    whenIdle: () =>
      new Promise<void>((resolve) => {
        if (pending.size === 0 && active.size === 0) {
          resolve();
          return;
        }
        idleWaiters.push(resolve);
      }),
  };
};
