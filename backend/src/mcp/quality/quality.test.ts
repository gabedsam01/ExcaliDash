import { describe, expect, it } from "vitest";
import type { ExcalidrawElement, ExcalidrawScene } from "../types";
import { lintScene } from "./lint";
import { scoreScene } from "./score";
import { repairScene } from "./repair";
import { autoPolish } from "./autopolish";

const BASE = {
  angle: 0,
  strokeColor: "#1e1e1e",
  backgroundColor: "transparent",
  fillStyle: "solid",
  strokeWidth: 2,
  strokeStyle: "solid",
  roughness: 1,
  opacity: 100,
  groupIds: [] as string[],
  frameId: null as string | null,
  roundness: null,
  seed: 1,
  version: 1,
  versionNonce: 1,
  isDeleted: false,
  boundElements: null,
  updated: 1,
  link: null,
  locked: false,
};

let n = 0;
const el = (over: Partial<ExcalidrawElement>): ExcalidrawElement => {
  n += 1;
  return {
    id: over.id ?? `e${n}`,
    type: "rectangle",
    x: 0,
    y: 0,
    width: 120,
    height: 60,
    ...BASE,
    ...over,
  } as ExcalidrawElement;
};

const scene = (elements: ExcalidrawElement[]): ExcalidrawScene => ({
  type: "excalidraw",
  version: 2,
  source: "test",
  elements,
  appState: { gridSize: 20, viewBackgroundColor: "#ffffff" },
  files: {},
});

const codes = (s: ExcalidrawScene) => new Set(lintScene(s).map((i) => i.code));

describe("lint detectors (geometry)", () => {
  it("detects text outside its container", () => {
    const container = el({ id: "c", x: 0, y: 0, width: 100, height: 40 });
    const text = el({
      id: "t",
      type: "text",
      x: 10,
      y: 10,
      width: 240,
      height: 30,
      containerId: "c",
      text: "Way too long to fit",
      fontSize: 20,
    });
    expect(codes(scene([container, text]))).toContain("TEXT_OVERFLOW");
  });

  it("detects a too-small card", () => {
    expect(codes(scene([el({ width: 30, height: 18 })]))).toContain("SMALL_CARD");
  });

  it("detects overlapping shapes", () => {
    const a = el({ id: "a", x: 0, y: 0, width: 120, height: 80 });
    const b = el({ id: "b", x: 40, y: 20, width: 120, height: 80 });
    expect(codes(scene([a, b]))).toContain("OVERLAP");
  });

  it("detects an unbound arrow", () => {
    const arrow = el({
      id: "ar",
      type: "arrow",
      x: 0,
      y: 0,
      width: 100,
      height: 0,
      points: [
        [0, 0],
        [100, 0],
      ],
      startBinding: null,
      endBinding: null,
    });
    expect(codes(scene([arrow]))).toContain("ARROW_UNBOUND");
  });

  it("detects an element outside its frame", () => {
    const frame = el({ id: "f", type: "frame", x: 0, y: 0, width: 200, height: 200, name: "Group" });
    const inside = el({ id: "x", x: 400, y: 400, width: 80, height: 40, frameId: "f" });
    expect(codes(scene([frame, inside]))).toContain("ITEM_OUTSIDE_FRAME");
  });

  it("detects off-grid placement", () => {
    expect(codes(scene([el({ x: 137, y: 43 })]))).toContain("OFF_GRID");
  });

  it("detects a too-small font", () => {
    const text = el({ id: "t", type: "text", x: 0, y: 0, width: 40, height: 12, text: "hi", fontSize: 8 });
    expect(codes(scene([text]))).toContain("SMALL_FONT");
  });

  it("detects exact duplicate / fully-stacked shapes (not a false pass)", () => {
    const a = el({ id: "a", x: 0, y: 0, width: 160, height: 80 });
    const b = el({ id: "b", x: 0, y: 0, width: 160, height: 80 });
    const found = codes(scene([a, b]));
    expect(found).toContain("DUPLICATE_SHAPES");
    expect(scoreScene(scene([a, b]), 95).passed).toBe(false);
  });

  it("does not flag a small shape nested inside a large one as a duplicate", () => {
    const big = el({ id: "big", x: 0, y: 0, width: 400, height: 300 });
    const small = el({ id: "small", x: 20, y: 20, width: 60, height: 30 });
    expect(codes(scene([big, small])).has("DUPLICATE_SHAPES")).toBe(false);
  });
});

describe("score + repair + auto-polish", () => {
  it("scores a scene with an error below the passing bar", () => {
    const container = el({ id: "c", x: 0, y: 0, width: 100, height: 40 });
    const text = el({
      id: "t",
      type: "text",
      x: 10,
      y: 10,
      width: 240,
      height: 30,
      containerId: "c",
      text: "Overflowing label here",
      fontSize: 20,
    });
    const result = scoreScene(scene([container, text]), 95);
    expect(result.score).toBeLessThan(95);
    expect(result.passed).toBe(false);
    expect(result.breakdown.length).toBeGreaterThan(0);
    expect(result.repairSuggestions.length).toBeGreaterThan(0);
  });

  it("repair improves the score", () => {
    const messy = scene([
      el({ id: "a", x: 137, y: 43, width: 30, height: 18 }), // off-grid + small
      el({ id: "tt", type: "text", x: 200, y: 200, width: 20, height: 10, text: "x", fontSize: 8 }),
    ]);
    const before = scoreScene(messy, 95).score;
    const repaired = repairScene(messy);
    const after = scoreScene(repaired.scene, 95).score;
    expect(after).toBeGreaterThan(before);
    expect(repaired.applied.length).toBeGreaterThan(0);
  });

  it("auto-polish reaches the passing bar (or the attempt limit)", () => {
    const messy = scene([
      el({ id: "c", x: 0, y: 0, width: 90, height: 36 }),
      el({
        id: "t",
        type: "text",
        x: 6,
        y: 6,
        width: 200,
        height: 26,
        containerId: "c",
        text: "A long label that overflows",
        fontSize: 20,
      }),
      el({ id: "f", type: "frame", x: 0, y: 400, width: 200, height: 120, name: "" }),
      el({ id: "off", x: 333, y: 211, width: 120, height: 60 }),
    ]);
    const result = autoPolish(messy, { minimumScore: 95, maxAttempts: 6 });
    expect(result.attempts).toBeLessThanOrEqual(6);
    expect(result.passed).toBe(true);
    expect(result.score.score).toBeGreaterThanOrEqual(95);
  });

  it("never self-binds an arrow whose endpoints fall over one shape", () => {
    const shape = el({ id: "s", x: 0, y: 0, width: 200, height: 120 });
    const arrow = el({
      id: "ar",
      type: "arrow",
      x: 90,
      y: 60,
      width: 20,
      height: 0,
      points: [
        [0, 0],
        [20, 0],
      ],
      startBinding: null,
      endBinding: null,
    });
    const repaired = repairScene(scene([shape, arrow]));
    const fixed = repaired.scene.elements.find((e) => e.id === "ar")!;
    const start = fixed.startBinding?.elementId;
    const end = fixed.endBinding?.elementId;
    expect(Boolean(start && end && start === end)).toBe(false);
    const sh = repaired.scene.elements.find((e) => e.id === "s")!;
    const boundCount = (sh.boundElements ?? []).filter((b) => b.id === "ar").length;
    expect(boundCount).toBeLessThanOrEqual(1);
  });
});
