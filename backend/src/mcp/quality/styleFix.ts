/**
 * Deterministic style fixers (no rasterization). Used by run_repair_loop:
 *   NORMALIZE_STYLE      — lock one roughness + one font family across cards
 *   INCREASE_FONT_SIZE   — raise any sub-16px text to the readable minimum
 *   FIX_LOW_CONTRAST     — darken/lighten faint text to clear WCAG AA
 * Pure: returns a new scene + the list of fixers it actually applied.
 */
import type { ExcalidrawElement, ExcalidrawScene } from "../types";
import { isShape, isText } from "../geometry/geometry";
import { isLibraryElement, metaOf } from "../libraries/metadata";
import { contrastRatio, parseHex, relativeLuminance, WCAG_AA } from "./style";

const MIN_FONT = 16;

const isDecorative = (el: ExcalidrawElement): boolean =>
  Boolean(metaOf(el)?.role) || isLibraryElement(el);

const num = (v: unknown, f = 0): number =>
  typeof v === "number" && Number.isFinite(v) ? v : f;

const mode = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = values[0];
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
};

const clone = (scene: ExcalidrawScene): ExcalidrawScene => ({
  ...scene,
  elements: JSON.parse(JSON.stringify(scene.elements)) as ExcalidrawElement[],
});

export const styleNormalize = (
  scene: ExcalidrawScene,
): { scene: ExcalidrawScene; applied: string[] } => {
  const next = clone(scene);
  const applied = new Set<string>();
  const sceneBg = parseHex(
    String((next.appState as { viewBackgroundColor?: unknown })?.viewBackgroundColor ?? "#ffffff"),
  ) ?? { r: 255, g: 255, b: 255 };
  const byId = new Map(next.elements.map((el) => [el.id, el]));

  // NORMALIZE_STYLE — single roughness across non-decorative cards
  const cards = next.elements.filter((el) => isShape(el) && !isDecorative(el));
  const targetRoughness = mode(cards.map((el) => num(el.roughness)));
  if (targetRoughness !== null) {
    for (const el of cards) {
      if (num(el.roughness) !== targetRoughness) {
        el.roughness = targetRoughness;
        applied.add("NORMALIZE_STYLE");
      }
    }
  }

  const texts = next.elements.filter((el) => isText(el) && !isDecorative(el));
  // NORMALIZE_STYLE — single font family across labels
  const targetFont = mode(texts.map((el) => num(el.fontFamily, 1)));
  if (targetFont !== null) {
    for (const el of texts) {
      if (num(el.fontFamily, 1) !== targetFont) {
        el.fontFamily = targetFont;
        applied.add("NORMALIZE_STYLE");
      }
    }
  }

  for (const el of texts) {
    // INCREASE_FONT_SIZE
    if (num(el.fontSize, 20) < MIN_FONT) {
      el.fontSize = MIN_FONT;
      applied.add("INCREASE_FONT_SIZE");
    }
    // FIX_LOW_CONTRAST
    const fg = parseHex(String(el.strokeColor ?? "#1e1e1e"));
    if (!fg) continue;
    let bg = sceneBg;
    const container = el.containerId ? byId.get(String(el.containerId)) : undefined;
    if (container) {
      const cbg = parseHex(String(container.backgroundColor ?? ""));
      if (cbg) bg = cbg;
    }
    if (contrastRatio(fg, bg) < WCAG_AA) {
      el.strokeColor = relativeLuminance(bg) > 0.4 ? "#1e1e1e" : "#e9ecef";
      applied.add("FIX_LOW_CONTRAST");
    }
  }

  return { scene: next, applied: [...applied] };
};
