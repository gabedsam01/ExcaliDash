import { describe, it, expect, vi } from "vitest";
import { isSlowSave, logSlowSaveIfNeeded, type SlowSaveLog } from "./savePerf";

const log = (totalMs: number): SlowSaveLog => ({
  drawingId: "d1",
  totalMs,
  payloadBytes: 12345,
  elementsCount: 10,
  filesCount: 3,
  imageFilesCount: 2,
  snapshotCreated: true,
  snapshotAsync: true,
  stages: { parseValidateMs: 1.2, imageOptimizeMs: 50.7, dbUpdateMs: 8.4 },
});

describe("isSlowSave", () => {
  it("is true only when enabled and over the threshold", () => {
    expect(isSlowSave({ enabled: true, slowMs: 1000 }, 1500)).toBe(true);
    expect(isSlowSave({ enabled: true, slowMs: 1000 }, 999)).toBe(false);
    expect(isSlowSave({ enabled: false, slowMs: 1000 }, 5000)).toBe(false);
  });
});

describe("logSlowSaveIfNeeded", () => {
  it("logs a structured line for slow saves", () => {
    const logger = { warn: vi.fn() };
    const logged = logSlowSaveIfNeeded({ enabled: true, slowMs: 1000 }, log(2000), logger);
    expect(logged).toBe(true);
    expect(logger.warn).toHaveBeenCalledOnce();
    const [, payload] = logger.warn.mock.calls[0];
    expect(payload).toMatchObject({ drawingId: "d1", elementsCount: 10, imageFilesCount: 2 });
  });

  it("does not log fast saves", () => {
    const logger = { warn: vi.fn() };
    expect(logSlowSaveIfNeeded({ enabled: true, slowMs: 1000 }, log(50), logger)).toBe(false);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("never includes payload content (no element/file/dataURL bytes)", () => {
    const logger = { warn: vi.fn() };
    logSlowSaveIfNeeded({ enabled: true, slowMs: 1000 }, log(2000), logger);
    const [, payload] = logger.warn.mock.calls[0];
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain("data:");
    expect(serialized).not.toContain("elements\":[");
    // Only sizes/counts/timings are present.
    expect(Object.keys(payload)).toEqual(
      expect.arrayContaining(["drawingId", "totalMs", "payloadBytes", "elementsCount"]),
    );
  });
});
