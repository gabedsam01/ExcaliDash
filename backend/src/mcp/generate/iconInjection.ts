/**
 * Auto icon injection. After layout (and geometry polish), every recognized
 * node gets the matching bundled glyph injected INTO its card — server-side, so
 * the model never has to remember a second `add_library_items` call.
 *
 * For each card: widen it to reserve a left icon column, re-center the label in
 * the remaining space, drop the glyph in the reserved slot, and bind the card +
 * label + icon under one shared groupId so the widget moves/scales as a unit.
 * A per-card score guard rolls a node back to a clean primitive card if the
 * injection would lower the quality score. Idempotent: cards that already carry
 * an icon are skipped. Unrecognized labels keep their primitive card.
 */
import type { ExcalidrawElement, ExcalidrawScene } from "../types";
import { elementBBox, isShape, overlapRatio } from "../geometry/geometry";
import { fitElementsInto } from "../libraries/placement";
import { tagElement } from "../libraries/metadata";
import { isLibraryElement } from "../libraries/metadata";
import { scoreScene } from "../quality/score";
import type { LintOptions } from "../quality/lint";
import {
  iconElements,
  resolveConcept,
} from "../../libraries/conceptIndex";
import { BUNDLED_LIBRARY_ID } from "../../libraries/bundled";

const SLOT = 36;
const RESERVE = SLOT + 20;
const PAD = 8;

export interface InjectOptions {
  /** Minimum score used by the per-card score guard. */
  minimumScore?: number;
  /** Lint overrides for the score guard (kept in sync with the caller). */
  lintOverrides?: Partial<LintOptions>;
  /** Disable the score guard (used in tests / when callers want raw injection). */
  scoreGuard?: boolean;
}

const clone = (scene: ExcalidrawScene): ExcalidrawScene => ({
  ...scene,
  elements: JSON.parse(JSON.stringify(scene.elements)) as ExcalidrawElement[],
});

const uniq = (arr: string[]): string[] => Array.from(new Set(arr));

interface Card {
  card: ExcalidrawElement;
  label: ExcalidrawElement;
}

/** Cards = labelled shapes (a shape that owns a bound text child). */
const findCards = (elements: ExcalidrawElement[]): Card[] => {
  const cards: Card[] = [];
  for (const el of elements) {
    if (!isShape(el) || el.type === "frame" || el.type === "image") continue;
    if (isLibraryElement(el)) continue;
    const label = elements.find(
      (t) => t.type === "text" && t.containerId === el.id,
    );
    if (label) cards.push({ card: el, label });
  }
  return cards;
};

const cardHasIcon = (
  card: ExcalidrawElement,
  elements: ExcalidrawElement[],
): boolean => {
  const box = elementBBox(card);
  return elements.some(
    (el) => isLibraryElement(el) && overlapRatio(box, elementBBox(el)) > 0.02,
  );
};

const num = (v: unknown, f = 0): number =>
  typeof v === "number" && Number.isFinite(v) ? v : f;

/**
 * Inject a glyph into one card (mutates `elements` in place). Returns the ids of
 * the elements it added/changed so the caller can roll the card back.
 */
const injectOne = (
  elements: ExcalidrawElement[],
  card: ExcalidrawElement,
  label: ExcalidrawElement,
  iconId: string,
  itemName: string,
): { addedIds: string[]; before: { card: ExcalidrawElement; label: ExcalidrawElement } } => {
  const before = {
    card: JSON.parse(JSON.stringify(card)) as ExcalidrawElement,
    label: JSON.parse(JSON.stringify(label)) as ExcalidrawElement,
  };
  const groupId = `${card.id}__w`;

  // 1) widen card to reserve a left icon column
  card.width = num(card.width) + RESERVE;

  // 2) slot rect for the icon (left, vertically centered)
  const slotRect = {
    x: num(card.x) + PAD,
    y: num(card.y) + num(card.height) / 2 - SLOT / 2,
    width: SLOT,
    height: SLOT,
  };

  // 3) re-center the label in the space to the right of the icon
  const regionX = num(card.x) + PAD + SLOT + 10;
  const regionRight = num(card.x) + num(card.width) - 10;
  const regionW = Math.max(1, regionRight - regionX);
  label.x = regionX + Math.max(0, (regionW - num(label.width)) / 2);

  // 4) build + place the glyph, fresh ids, shared group, provenance
  const glyph = iconElements(iconId) as unknown as ExcalidrawElement[];
  const placed = fitElementsInto(glyph, slotRect, 2).map((el, i) => {
    const tagged = tagElement({ ...el }, {
      library: BUNDLED_LIBRARY_ID,
      item: itemName,
      role: "icon",
      placement: "inside-card-left",
    });
    tagged.id = `${card.id}__ic${i}`;
    tagged.groupIds = [groupId];
    tagged.frameId = card.frameId ?? null;
    return tagged;
  });

  // 5) group card + label + icon as one widget
  card.groupIds = uniq([...(card.groupIds ?? []), groupId]);
  label.groupIds = uniq([...(label.groupIds ?? []), groupId]);
  elements.push(...placed);

  return { addedIds: placed.map((e) => e.id), before };
};

/** Inject icons for every recognized node, with a per-card score guard. */
export const injectConceptIcons = (
  scene: ExcalidrawScene,
  opts: InjectOptions = {},
): { scene: ExcalidrawScene; injected: number } => {
  const working = clone(scene);
  const cards = findCards(working.elements);
  if (cards.length === 0) return { scene, injected: 0 };

  const useGuard = opts.scoreGuard !== false;
  const min = opts.minimumScore ?? 95;
  const overrides = opts.lintOverrides ?? {};
  let baseScore = useGuard ? scoreScene(working, min, overrides).score : 100;
  let injected = 0;

  for (const { card, label } of cards) {
    const labelText = typeof label.text === "string" ? label.text : "";
    const candidate = resolveConcept(labelText);
    if (!candidate) continue;
    if (cardHasIcon(card, working.elements)) continue;

    const { addedIds, before } = injectOne(
      working.elements,
      card,
      label,
      candidate.iconId,
      candidate.itemName,
    );

    if (useGuard) {
      const newScore = scoreScene(working, min, overrides).score;
      if (newScore < baseScore) {
        // roll this card back to a clean primitive card
        Object.assign(card, before.card);
        Object.assign(label, before.label);
        const addedSet = new Set(addedIds);
        working.elements = working.elements.filter((e) => !addedSet.has(e.id));
        continue;
      }
      baseScore = newScore;
    }
    injected += 1;
  }

  return injected > 0 ? { scene: working, injected } : { scene, injected: 0 };
};
