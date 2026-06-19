/**
 * Lightweight, env-gated performance logging for drawing saves. Logs a single
 * structured line when a save exceeds SAVE_PERF_SLOW_MS so slow large-payload
 * saves can be diagnosed. NEVER logs payload content (no elements/files/dataURL
 * bytes, tokens, or other sensitive data) — only sizes, counts and timings.
 */
import type { SavePerfConfig } from "../config";

/** High-resolution millisecond clock. */
export const perfNow = (): number => Number(process.hrtime.bigint()) / 1e6;

export interface SaveStageTimings {
  parseValidateMs?: number;
  imageOptimizeMs?: number;
  dbUpdateMs?: number;
  snapshotDecisionMs?: number;
  snapshotWriteMs?: number;
  pruneMs?: number;
}

export interface SlowSaveLog {
  drawingId: string;
  totalMs: number;
  payloadBytes: number;
  elementsCount: number;
  filesCount: number;
  imageFilesCount: number;
  snapshotCreated: boolean;
  snapshotAsync: boolean;
  stages: SaveStageTimings;
}

const round = (n: number | undefined): number | undefined =>
  typeof n === "number" ? Math.round(n * 10) / 10 : undefined;

/**
 * Decide whether a save is "slow" and should be logged. Pure + exported so it
 * can be unit-tested without touching the console.
 */
export const isSlowSave = (config: SavePerfConfig, totalMs: number): boolean =>
  config.enabled && totalMs >= config.slowMs;

export const logSlowSaveIfNeeded = (
  config: SavePerfConfig,
  log: SlowSaveLog,
  logger: Pick<Console, "warn"> = console,
): boolean => {
  if (!isSlowSave(config, log.totalMs)) return false;
  logger.warn("[save-perf] slow save", {
    drawingId: log.drawingId,
    totalMs: round(log.totalMs),
    payloadBytes: log.payloadBytes,
    elementsCount: log.elementsCount,
    filesCount: log.filesCount,
    imageFilesCount: log.imageFilesCount,
    snapshotCreated: log.snapshotCreated,
    snapshotAsync: log.snapshotAsync,
    parseValidateMs: round(log.stages.parseValidateMs),
    imageOptimizeMs: round(log.stages.imageOptimizeMs),
    dbUpdateMs: round(log.stages.dbUpdateMs),
    snapshotDecisionMs: round(log.stages.snapshotDecisionMs),
    snapshotWriteMs: round(log.stages.snapshotWriteMs),
    pruneMs: round(log.stages.pruneMs),
  });
  return true;
};
