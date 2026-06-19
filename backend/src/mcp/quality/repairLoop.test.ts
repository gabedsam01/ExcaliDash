import { describe, expect, it } from "vitest";
import type { ExcalidrawElement, ExcalidrawScene } from "../types";
import { scoreScene } from "./score";
import { runRepairLoop } from "./repairLoop";
import { styleNormalize } from "./styleFix";

const BASE = {
  angle: 0,
  strokeColor: "#1e1e1e",
  backgroundColor: "#a5d8ff",
  fillStyle: "solid",
  strokeWidth: 2,
  strokeStyle: "solid",
  roughness: 0,
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
  return { id: over.id ?? `e${n}`, type: "rectangle", x: 0, y: 0, width: 180, height: 64, ...BASE, ...over } as ExcalidrawElement;
};
const scene = (elements: ExcalidrawElement[]): ExcalidrawScene => ({
  type: "excalidraw",
  version: 2,
  source: "test",
  elements,
  appState: { gridSize: 20, viewBackgroundColor: "#ffffff" },
  files: {},
});

const card = (
  id: string,
  x: number,
  y: number,
  label: string,
  over: Partial<ExcalidrawElement> = {},
  textOver: Partial<ExcalidrawElement> = {},
): ExcalidrawElement[] => [
  el({ id, x, y, width: 180, height: 64, boundElements: [{ id: `${id}t`, type: "text" }], ...over }),
  el({ id: `${id}t`, type: "text", x: x + 50, y: y + 22, width: 90, height: 20, text: label, fontSize: 16, containerId: id, ...textOver }),
];

describe("styleNormalize fixers", () => {
  it("unifies roughness + font, raises fonts, fixes low contrast", () => {
    const s = scene([
      ...card("a", 0, 0, "Alpha", { roughness: 1 }, { fontFamily: 1 }),
      ...card("b", 0, 120, "Beta", { roughness: 0 }, { fontFamily: 2, fontSize: 12 }),
      el({ id: "faint", type: "text", x: 0, y: 260, width: 80, height: 20, text: "faint", fontSize: 18, strokeColor: "#dddddd", backgroundColor: "transparent" }),
    ]);
    const { scene: fixed, applied } = styleNormalize(s);
    expect(applied).toContain("NORMALIZE_STYLE");
    expect(applied).toContain("INCREASE_FONT_SIZE");
    expect(applied).toContain("FIX_LOW_CONTRAST");
    const roughness = new Set(
      fixed.elements.filter((e) => e.type === "rectangle").map((e) => e.roughness),
    );
    expect(roughness.size).toBe(1);
    const smallFonts = fixed.elements.filter((e) => e.type === "text" && (e.fontSize ?? 16) < 16);
    expect(smallFonts).toHaveLength(0);
  });
});

describe("runRepairLoop", () => {
  const messy = () =>
    scene([
      ...card("p", 137, 43, "PostgreSQL", { roughness: 1 }, { fontSize: 8 }), // off-grid + small font
      ...card("r", 13, 207, "Redis", { roughness: 0 }, { fontSize: 10 }), // off-grid + small font
      ...card("w", 251, 371, "API", { roughness: 1 }), // off-grid
    ]);

  it("raises the score to the bar, applies fixers, never returns worse", () => {
    const base = messy();
    const before = scoreScene(base, 95).score;
    const result = runRepairLoop(base, { minimumScore: 95, maxRounds: 4 });
    expect(result.score.score).toBeGreaterThanOrEqual(before);
    expect(result.passed).toBe(true);
    expect(result.applied.length).toBeGreaterThan(0);
    expect(result.applied).toContain("INJECT_MISSING_ICON");
    expect(result.rounds).toBeLessThanOrEqual(4);
  });

  it("is convergent — re-running a passing scene does no further rounds", () => {
    const result = runRepairLoop(messy(), { minimumScore: 95 });
    const again = runRepairLoop(result.scene, { minimumScore: 95 });
    expect(again.rounds).toBe(0);
    expect(again.score.score).toBeGreaterThanOrEqual(result.score.score);
  });

  it("keeps zero hard blockers", () => {
    const result = runRepairLoop(messy(), { minimumScore: 95 });
    expect(result.score.hardBlockers).toHaveLength(0);
  });
});
