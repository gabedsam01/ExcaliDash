import { describe, expect, it } from "vitest";
import type { ExcalidrawScene } from "../types";
import { ensureLegend, renderLegend } from "./legend";
import { getPreset } from "./presets";
import { isLegendElement } from "../libraries/metadata";

const scene = (n: number): ExcalidrawScene => ({
  type: "excalidraw",
  version: 2,
  source: "test",
  elements: Array.from({ length: n }, (_, i) => ({
    id: `c${i}`,
    type: "rectangle",
    x: 0,
    y: i * 100,
    width: 160,
    height: 60,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "#a5d8ff",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: 1,
    version: 1,
    versionNonce: 1,
    isDeleted: false,
    boundElements: null,
    updated: 1,
    link: null,
    locked: false,
  })) as never,
  appState: { gridSize: 20, viewBackgroundColor: "#ffffff" },
  files: {},
});

describe("legend generator", () => {
  it("renders a grouped, recognizable legend", () => {
    const els = renderLegend(getPreset("technical-docs"), 400, 0);
    expect(els.length).toBeGreaterThan(4);
    expect(els.some(isLegendElement)).toBe(true);
    const groups = new Set(els.flatMap((e) => e.groupIds ?? []));
    expect(groups.size).toBe(1); // one shared widget group
    const labels = els.filter((e) => e.type === "text").map((e) => e.text);
    expect(labels).toContain("sync");
    expect(labels.some((l) => String(l).includes("async"))).toBe(true);
  });

  it("ensureLegend appends a legend once and is idempotent", () => {
    const base = scene(5);
    const first = ensureLegend(base, "technical-docs");
    expect(first.added).toBe(true);
    expect(first.scene.elements.length).toBeGreaterThan(base.elements.length);
    expect(first.scene.elements.some(isLegendElement)).toBe(true);

    const second = ensureLegend(first.scene, "technical-docs");
    expect(second.added).toBe(false);
    expect(second.scene.elements.length).toBe(first.scene.elements.length);
  });
});
