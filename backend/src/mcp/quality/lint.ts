/**
 * lint_drawing detectors — geometry-backed validation of an Excalidraw scene.
 * Each detector returns LintIssue[]; the engine aggregates and de-duplicates.
 */
import type { ExcalidrawElement, ExcalidrawScene, LintIssue } from "../types";
import { measureText } from "../excalidraw/elements";
import {
  bboxArea,
  bboxCenter,
  contains,
  elementBBox,
  isFrame,
  isLinear,
  isShape,
  isText,
  isOnGrid,
  liveElements,
  maxRegionDensity,
  overlapRatio,
  unionBBox,
} from "../geometry/geometry";

export interface LintOptions {
  gridSize: number;
  minFontSize: number;
  containerPadding: number;
  overlapThreshold: number;
  densityCellSize: number;
  maxDensity: number;
  minCardWidth: number;
  minCardHeight: number;
}

export const DEFAULT_LINT_OPTIONS: LintOptions = {
  gridSize: 20,
  minFontSize: 14,
  containerPadding: 4,
  overlapThreshold: 0.15,
  densityCellSize: 220,
  maxDensity: 10,
  minCardWidth: 48,
  minCardHeight: 28,
};

const num = (v: unknown, f = 0): number =>
  typeof v === "number" && Number.isFinite(v) ? v : f;

export const resolveLintOptions = (
  scene: ExcalidrawScene,
  overrides: Partial<LintOptions> = {},
): LintOptions => {
  const grid = num((scene.appState as { gridSize?: unknown })?.gridSize, 0);
  return {
    ...DEFAULT_LINT_OPTIONS,
    ...(grid > 0 ? { gridSize: grid } : {}),
    ...overrides,
  };
};

type Detector = (
  elements: ExcalidrawElement[],
  opts: LintOptions,
) => LintIssue[];

const detectEmpty: Detector = (elements) =>
  elements.length === 0
    ? [
        {
          code: "EMPTY_SCENE",
          severity: "error",
          message: "The scene has no elements.",
          elementIds: [],
          dimension: "structure",
          repairable: false,
        },
      ]
    : [];

const detectBoundTextOverflow: Detector = (elements, opts) => {
  const byId = new Map(elements.map((el) => [el.id, el]));
  const issues: LintIssue[] = [];
  for (const el of elements) {
    if (!isText(el) || !el.containerId) continue;
    const container = byId.get(el.containerId);
    if (!container) continue;
    const textBox = elementBBox(el);
    if (!contains(elementBBox(container), textBox, opts.containerPadding)) {
      issues.push({
        code: "TEXT_OVERFLOW",
        severity: "error",
        message: `Text "${String(el.text ?? "").slice(0, 24)}" overflows its container.`,
        elementIds: [el.id, container.id],
        dimension: "containment",
        repairable: true,
      });
    }
  }
  return issues;
};

const detectSmallCards: Detector = (elements, opts) => {
  const issues: LintIssue[] = [];
  for (const el of elements) {
    if (!isShape(el) || el.type === "image") continue;
    if (num(el.width) < opts.minCardWidth || num(el.height) < opts.minCardHeight) {
      issues.push({
        code: "SMALL_CARD",
        severity: "warning",
        message: `Shape is too small (${Math.round(num(el.width))}×${Math.round(
          num(el.height),
        )}).`,
        elementIds: [el.id],
        dimension: "containment",
        repairable: true,
      });
    }
  }
  return issues;
};

const detectOverlaps: Detector = (elements, opts) => {
  const shapes = elements.filter((el) => isShape(el) && el.type !== "image");
  const issues: LintIssue[] = [];
  for (let i = 0; i < shapes.length; i += 1) {
    for (let j = i + 1; j < shapes.length; j += 1) {
      const a = shapes[i];
      const b = shapes[j];
      const boxA = elementBBox(a);
      const boxB = elementBBox(b);
      const ratio = overlapRatio(boxA, boxB);
      if (ratio > opts.overlapThreshold && ratio < 0.95) {
        issues.push({
          code: "OVERLAP",
          severity: "warning",
          message: `Shapes overlap (${Math.round(ratio * 100)}%).`,
          elementIds: [a.id, b.id],
          dimension: "layout",
          repairable: true,
        });
      } else if (ratio >= 0.95) {
        // ratio >= 0.95 is either intentional containment (small inside large)
        // OR an unintended exact duplicate (two near-equal shapes stacked).
        // Distinguish by relative size: near-equal areas => duplicate.
        const areaA = bboxArea(boxA);
        const areaB = bboxArea(boxB);
        const larger = Math.max(areaA, areaB);
        const sizeRatio = larger > 0 ? Math.min(areaA, areaB) / larger : 1;
        if (sizeRatio > 0.8) {
          issues.push({
            code: "DUPLICATE_SHAPES",
            severity: "error",
            message: `Shapes are stacked/duplicated (${Math.round(ratio * 100)}% overlap) — one hides the other.`,
            elementIds: [a.id, b.id],
            dimension: "layout",
            repairable: true,
          });
        }
      }
    }
  }
  return issues;
};

const detectUnboundArrows: Detector = (elements) => {
  const issues: LintIssue[] = [];
  for (const el of elements) {
    if (el.type !== "arrow") continue;
    if (!el.startBinding || !el.endBinding) {
      issues.push({
        code: "ARROW_UNBOUND",
        severity: "warning",
        message: "Arrow is not bound to a start and/or end element.",
        elementIds: [el.id],
        dimension: "connections",
        repairable: true,
      });
    }
  }
  return issues;
};

const detectOutsideFrame: Detector = (elements) => {
  const byId = new Map(elements.map((el) => [el.id, el]));
  const issues: LintIssue[] = [];
  for (const el of elements) {
    if (!el.frameId) continue;
    const frame = byId.get(el.frameId);
    if (!frame || !isFrame(frame)) continue;
    if (!contains(elementBBox(frame), elementBBox(el), 0)) {
      issues.push({
        code: "ITEM_OUTSIDE_FRAME",
        severity: "warning",
        message: "Element references a frame but sits outside its bounds.",
        elementIds: [el.id, frame.id],
        dimension: "structure",
        repairable: true,
      });
    }
  }
  return issues;
};

const detectOffGrid: Detector = (elements, opts) => {
  const issues: LintIssue[] = [];
  for (const el of elements) {
    if (!isShape(el) && !isFrame(el)) continue;
    if (!isOnGrid(num(el.x), opts.gridSize) || !isOnGrid(num(el.y), opts.gridSize)) {
      issues.push({
        code: "OFF_GRID",
        severity: "info",
        message: `Element is off the ${opts.gridSize}px grid.`,
        elementIds: [el.id],
        dimension: "spacing",
        repairable: true,
      });
    }
  }
  return issues;
};

const detectSmallFont: Detector = (elements, opts) => {
  const issues: LintIssue[] = [];
  for (const el of elements) {
    if (!isText(el)) continue;
    if (num(el.fontSize, 20) < opts.minFontSize) {
      issues.push({
        code: "SMALL_FONT",
        severity: "warning",
        message: `Font size ${num(el.fontSize)}px is below the readable minimum (${opts.minFontSize}px).`,
        elementIds: [el.id],
        dimension: "readability",
        repairable: true,
      });
    }
  }
  return issues;
};

const detectFrameNoTitle: Detector = (elements) => {
  const issues: LintIssue[] = [];
  for (const el of elements) {
    if (!isFrame(el)) continue;
    const name = typeof el.name === "string" ? el.name.trim() : "";
    if (name.length === 0) {
      issues.push({
        code: "FRAME_NO_TITLE",
        severity: "warning",
        message: "Frame has no title.",
        elementIds: [el.id],
        dimension: "structure",
        repairable: true,
      });
    }
  }
  return issues;
};

const detectDensity: Detector = (elements, opts) => {
  const visible = elements.filter((el) => !isLinear(el));
  if (visible.length < 6) return [];
  const { max } = maxRegionDensity(visible, opts.densityCellSize);
  return max > opts.maxDensity
    ? [
        {
          code: "HIGH_DENSITY",
          severity: "warning",
          message: `Too many elements packed into one region (${max}).`,
          elementIds: [],
          dimension: "spacing",
          repairable: false,
        },
      ]
    : [];
};

const detectDisproportion: Detector = (elements) => {
  const shapes = elements.filter((el) => isShape(el) && el.type !== "image");
  if (shapes.length < 3) return [];
  const areas = shapes.map((el) => bboxArea(elementBBox(el))).sort((a, b) => a - b);
  const median = areas[Math.floor(areas.length / 2)] || 1;
  const issues: LintIssue[] = [];
  for (const el of shapes) {
    const area = bboxArea(elementBBox(el));
    if (median > 0 && (area > median * 8 || area < median / 8)) {
      issues.push({
        code: "DISPROPORTION",
        severity: "info",
        message: "Shape is strongly disproportionate to its siblings.",
        elementIds: [el.id],
        dimension: "consistency",
        repairable: false,
      });
    }
  }
  return issues;
};

const detectOutsideViewport: Detector = (elements) => {
  if (elements.length < 2) return [];
  const scene = unionBBox(elements);
  if (!scene) return [];
  const [cx, cy] = bboxCenter(scene);
  const diag = Math.hypot(scene.maxX - scene.minX, scene.maxY - scene.minY) || 1;
  const issues: LintIssue[] = [];
  for (const el of elements) {
    const [ex, ey] = bboxCenter(elementBBox(el));
    if (Math.hypot(ex - cx, ey - cy) > diag * 1.5) {
      issues.push({
        code: "OUTSIDE_VIEWPORT",
        severity: "info",
        message: "Element is far outside the main diagram region.",
        elementIds: [el.id],
        dimension: "layout",
        repairable: false,
      });
    }
  }
  return issues;
};

const DETECTORS: Detector[] = [
  detectEmpty,
  detectBoundTextOverflow,
  detectSmallCards,
  detectOverlaps,
  detectUnboundArrows,
  detectOutsideFrame,
  detectOffGrid,
  detectSmallFont,
  detectFrameNoTitle,
  detectDensity,
  detectDisproportion,
  detectOutsideViewport,
];

/** Run all detectors over a scene. */
export const lintScene = (
  scene: ExcalidrawScene,
  overrides: Partial<LintOptions> = {},
): LintIssue[] => {
  const opts = resolveLintOptions(scene, overrides);
  const elements = liveElements(scene.elements);
  return DETECTORS.flatMap((detector) => detector(elements, opts));
};

export { measureText };
