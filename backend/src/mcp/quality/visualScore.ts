/**
 * Visual (aesthetic) scoring — distinguishes a flat/crude drawing from a
 * polished one. Two bases:
 *   - scoreVisualFromPixels: real rendered metrics from a canvas pixel grid
 *     (RGBA). Fed by the e2e Playwright capture (e2e/visual-capture.ts).
 *   - scoreVisualFromScene: a deterministic in-process proxy from element
 *     geometry (icon coverage, hue discipline, whitespace balance, legibility)
 *     — used by the score_drawing_visual MCP tool, which cannot rasterize.
 * Both return a 0-100 score; geometry hard-blockers remain the non-negotiable
 * floor elsewhere — this is an additive aesthetic signal.
 */
import type { ExcalidrawElement, ExcalidrawScene } from "../types";
import { elementBBox, isShape, isText, liveElements, overlapRatio, unionBBox } from "../geometry/geometry";
import { isLibraryElement, metaOf } from "../libraries/metadata";
import { hueFamily } from "./style";

export interface VisualMetrics {
  contrast: number;
  inkFraction: number;
  whitespace: number;
  hueFamilies: number;
  iconCoverage: number;
  legibility: number;
}

export interface VisualScore {
  score: number;
  basis: "pixels" | "scene";
  metrics: VisualMetrics;
}

export interface PixelGrid {
  width: number;
  height: number;
  /** RGBA, row-major, length = width*height*4. */
  data: ArrayLike<number>;
}

const clamp = (v: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, v));
const lum = (r: number, g: number, b: number): number =>
  (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/** Score a rendered canvas pixel grid. */
export const scoreVisualFromPixels = (grid: PixelGrid): VisualScore => {
  const { width, height, data } = grid;
  const total = Math.max(1, width * height);
  const step = Math.max(1, Math.floor(Math.sqrt(total / 20000))); // cap samples ~20k
  // background luminance from the four corners
  const cornerIdx = [0, (width - 1) * 4, (height - 1) * width * 4, (total - 1) * 4];
  const bgLum =
    cornerIdx.reduce((s, i) => s + lum(data[i] ?? 255, data[i + 1] ?? 255, data[i + 2] ?? 255), 0) /
    cornerIdx.length;

  let count = 0;
  let ink = 0;
  let sum = 0;
  let sumSq = 0;
  const hueCounts = new Array(12).fill(0);
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const L = lum(r, g, b);
      count += 1;
      sum += L;
      sumSq += L * L;
      if (Math.abs(L - bgLum) > 0.08) ink += 1;
      const fam = hueFamily(
        `#${[r, g, b].map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0")).join("")}`,
      );
      if (fam !== null) hueCounts[fam] += 1;
    }
  }
  const mean = sum / count;
  const variance = Math.max(0, sumSq / count - mean * mean);
  const contrast = Math.sqrt(variance);
  const inkFraction = ink / count;
  const hueFamilies = hueCounts.filter((c) => c / count > 0.005).length;

  const balance = clamp(100 - Math.abs(inkFraction - 0.33) * 200);
  const contrastScore = clamp(contrast * 250);
  const colorScore =
    hueFamilies >= 2 && hueFamilies <= 4
      ? 100
      : hueFamilies < 2
        ? 40
        : clamp(100 - (hueFamilies - 4) * 15, 40, 100);
  const score = Math.round(0.4 * balance + 0.35 * contrastScore + 0.25 * colorScore);
  return {
    score: clamp(score),
    basis: "pixels",
    metrics: { contrast: Math.round(contrast * 100) / 100, inkFraction: Math.round(inkFraction * 100) / 100, whitespace: Math.round((1 - inkFraction) * 100) / 100, hueFamilies, iconCoverage: 0, legibility: 0 },
  };
};

const isDecorative = (el: ExcalidrawElement): boolean =>
  Boolean(metaOf(el)?.role) || isLibraryElement(el);

/** In-process aesthetic proxy from scene geometry (no rasterization). */
export const scoreVisualFromScene = (scene: ExcalidrawScene): VisualScore => {
  const els = liveElements(scene.elements);
  const cards = els.filter((el) => isShape(el) && !isDecorative(el) && el.type !== "frame");
  const icons = els.filter(isLibraryElement);
  const texts = els.filter((el) => isText(el) && !isDecorative(el));

  // icon coverage — fraction of cards carrying an icon
  const covered = cards.filter((card) => {
    const box = elementBBox(card);
    return icons.some((ic) => overlapRatio(box, elementBBox(ic)) > 0.02);
  }).length;
  const iconCoverage = cards.length > 0 ? covered / cards.length : 0;

  // hue discipline
  const families = new Set<number>();
  for (const card of cards) {
    const fam = hueFamily(String(card.backgroundColor ?? "transparent"));
    if (fam !== null) families.add(fam);
  }
  const hueFamilies = families.size;
  const colorScore =
    hueFamilies >= 1 && hueFamilies <= 3 ? 100 : hueFamilies === 0 ? 55 : clamp(100 - (hueFamilies - 3) * 20, 40, 100);

  // whitespace balance — element ink vs bounding area
  const bbox = unionBBox(els);
  const area = bbox ? Math.max(1, (bbox.maxX - bbox.minX) * (bbox.maxY - bbox.minY)) : 1;
  const inkArea = cards.reduce((s, el) => {
    const b = elementBBox(el);
    return s + Math.max(0, (b.maxX - b.minX) * (b.maxY - b.minY));
  }, 0);
  const inkFraction = Math.min(1, inkArea / area);
  const balance = clamp(100 - Math.abs(inkFraction - 0.3) * 180);

  // legibility — fraction of texts >= 16px
  const legible = texts.filter((t) => (typeof t.fontSize === "number" ? t.fontSize : 16) >= 16).length;
  const legibility = texts.length > 0 ? legible / texts.length : 1;

  const score = Math.round(
    0.35 * (iconCoverage * 100) +
      0.25 * colorScore +
      0.2 * balance +
      0.2 * (legibility * 100),
  );
  return {
    score: clamp(score),
    basis: "scene",
    metrics: {
      contrast: 0,
      inkFraction: Math.round(inkFraction * 100) / 100,
      whitespace: Math.round((1 - inkFraction) * 100) / 100,
      hueFamilies,
      iconCoverage: Math.round(iconCoverage * 100) / 100,
      legibility: Math.round(legibility * 100) / 100,
    },
  };
};

/** Blend geometry + visual into a combined score (geometry stays dominant). */
export const blendScore = (geometry: number, visual: number, visualWeight = 0.3): number =>
  Math.round(geometry * (1 - visualWeight) + visual * visualWeight);
