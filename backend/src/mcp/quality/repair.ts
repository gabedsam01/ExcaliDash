/**
 * repair_drawing — apply deterministic, geometry-driven fixes for repairable
 * issues. Non-destructive: operates on a deep clone and reports what changed.
 */
import type { ExcalidrawElement, ExcalidrawScene } from "../types";
import { measureText } from "../excalidraw/elements";
import {
  bboxCenter,
  elementBBox,
  isFrame,
  isShape,
  liveElements,
  overlapRatio,
  snapToGrid,
} from "../geometry/geometry";
import { lintScene, resolveLintOptions, type LintOptions } from "./lint";

const num = (v: unknown, f = 0): number =>
  typeof v === "number" && Number.isFinite(v) ? v : f;

const cloneScene = (scene: ExcalidrawScene): ExcalidrawScene =>
  JSON.parse(JSON.stringify(scene)) as ExcalidrawScene;

const recenterBoundText = (
  container: ExcalidrawElement,
  elements: ExcalidrawElement[],
): void => {
  for (const el of elements) {
    if (el.type !== "text" || el.containerId !== container.id) continue;
    const metrics = measureText(
      String(el.text ?? ""),
      num(el.fontSize, 16),
      num(el.fontFamily, 2),
    );
    el.width = metrics.width;
    el.height = metrics.height;
    el.x = num(container.x) + (num(container.width) - metrics.width) / 2;
    el.y = num(container.y) + (num(container.height) - metrics.height) / 2;
  }
};

export interface RepairResult {
  scene: ExcalidrawScene;
  applied: string[];
}

/** Apply one repair pass. The auto-polish loop re-runs this to convergence. */
export const repairScene = (
  scene: ExcalidrawScene,
  overrides: Partial<LintOptions> = {},
): RepairResult => {
  const next = cloneScene(scene);
  const opts = resolveLintOptions(next, overrides);
  const elements = liveElements(next.elements);
  const byId = new Map(elements.map((el) => [el.id, el]));
  const issues = lintScene(next, overrides);
  const applied = new Set<string>();

  // 1. Fonts first (affects text metrics used by later fixers).
  for (const issue of issues.filter((i) => i.code === "SMALL_FONT")) {
    const el = byId.get(issue.elementIds[0]);
    if (!el) continue;
    el.fontSize = opts.minFontSize;
    const metrics = measureText(
      String(el.text ?? ""),
      opts.minFontSize,
      num(el.fontFamily, 2),
    );
    el.width = metrics.width;
    el.height = metrics.height;
    if (el.containerId) {
      const container = byId.get(el.containerId);
      if (container) recenterBoundText(container, elements);
    }
    applied.add("SMALL_FONT");
  }

  // 2. Grow small cards.
  for (const issue of issues.filter((i) => i.code === "SMALL_CARD")) {
    const el = byId.get(issue.elementIds[0]);
    if (!el) continue;
    el.width = Math.max(num(el.width), 120);
    el.height = Math.max(num(el.height), 56);
    recenterBoundText(el, elements);
    applied.add("SMALL_CARD");
  }

  // 3. Grow containers whose bound text overflows.
  for (const issue of issues.filter((i) => i.code === "TEXT_OVERFLOW")) {
    const text = byId.get(issue.elementIds[0]);
    const container = byId.get(issue.elementIds[1]);
    if (!text || !container) continue;
    const metrics = measureText(
      String(text.text ?? ""),
      num(text.fontSize, 16),
      num(text.fontFamily, 2),
    );
    const pad = opts.containerPadding + 8;
    container.width = Math.max(num(container.width), metrics.width + pad * 2);
    container.height = Math.max(num(container.height), metrics.height + pad * 2);
    recenterBoundText(container, elements);
    applied.add("TEXT_OVERFLOW");
  }

  // 4. Title untitled frames.
  let frameIndex = 0;
  for (const issue of issues.filter((i) => i.code === "FRAME_NO_TITLE")) {
    const el = byId.get(issue.elementIds[0]);
    if (!el || !isFrame(el)) continue;
    frameIndex += 1;
    el.name = `Frame ${frameIndex}`;
    applied.add("FRAME_NO_TITLE");
  }

  // 5. Snap off-grid shapes/frames (and their bound text) to the grid.
  for (const issue of issues.filter((i) => i.code === "OFF_GRID")) {
    const el = byId.get(issue.elementIds[0]);
    if (!el) continue;
    el.x = snapToGrid(num(el.x), opts.gridSize);
    el.y = snapToGrid(num(el.y), opts.gridSize);
    if (isShape(el)) recenterBoundText(el, elements);
    applied.add("OFF_GRID");
  }

  // 6. Items referencing a frame they sit outside: clear the frame link.
  for (const issue of issues.filter((i) => i.code === "ITEM_OUTSIDE_FRAME")) {
    const el = byId.get(issue.elementIds[0]);
    if (!el) continue;
    el.frameId = null;
    applied.add("ITEM_OUTSIDE_FRAME");
  }

  // 7. Bind dangling arrows to the nearest shape at each free endpoint.
  const shapes = elements.filter((el) => isShape(el));
  for (const issue of issues.filter((i) => i.code === "ARROW_UNBOUND")) {
    const arrow = byId.get(issue.elementIds[0]);
    if (!arrow || arrow.type !== "arrow" || !Array.isArray(arrow.points)) continue;
    const ax = num(arrow.x);
    const ay = num(arrow.y);
    const first = arrow.points[0];
    const last = arrow.points[arrow.points.length - 1];
    const startPt: [number, number] = [ax + num(first?.[0]), ay + num(first?.[1])];
    const endPt: [number, number] = [ax + num(last?.[0]), ay + num(last?.[1])];

    const nearest = (
      point: [number, number],
      excludeId?: string,
    ): ExcalidrawElement | null => {
      let best: ExcalidrawElement | null = null;
      let bestDist = 80; // bind threshold
      for (const shape of shapes) {
        if (excludeId && shape.id === excludeId) continue;
        const [cx, cy] = bboxCenter(elementBBox(shape));
        const dist = Math.hypot(point[0] - cx, point[1] - cy);
        if (dist < bestDist) {
          bestDist = dist;
          best = shape;
        }
      }
      return best;
    };

    const addBound = (target: ExcalidrawElement) => {
      const existing = target.boundElements ?? [];
      if (!existing.some((b) => b.id === arrow.id)) {
        target.boundElements = [...existing, { id: arrow.id, type: "arrow" }];
      }
    };

    // Resolve start first; exclude it when resolving the end so an arrow whose
    // endpoints both fall over one shape never self-binds (degenerate loop).
    let startTargetId: string | undefined = arrow.startBinding?.elementId;
    if (!arrow.startBinding) {
      const target = nearest(startPt);
      if (target) {
        arrow.startBinding = { elementId: target.id, focus: 0, gap: 4 };
        addBound(target);
        startTargetId = target.id;
        applied.add("ARROW_UNBOUND");
      }
    }
    if (!arrow.endBinding) {
      const target = nearest(endPt, startTargetId);
      if (target) {
        arrow.endBinding = { elementId: target.id, focus: 0, gap: 4 };
        addBound(target);
        applied.add("ARROW_UNBOUND");
      }
    }
  }

  // 8. Nudge overlapping or duplicated/stacked shapes apart (loop converges).
  for (const issue of issues.filter(
    (i) => i.code === "OVERLAP" || i.code === "DUPLICATE_SHAPES",
  )) {
    const a = byId.get(issue.elementIds[0]);
    const b = byId.get(issue.elementIds[1]);
    if (!a || !b) continue;
    if (overlapRatio(elementBBox(a), elementBBox(b)) <= opts.overlapThreshold) {
      continue;
    }
    const boxA = elementBBox(a);
    const boxB = elementBBox(b);
    const shift = boxA.maxX - boxB.minX + 40;
    b.x = num(b.x) + shift;
    recenterBoundText(b, elements);
    applied.add("OVERLAP");
  }

  return { scene: next, applied: Array.from(applied) };
};
