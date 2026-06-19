# Visual Lint & Repair Loop — Pre-Save Checklist

Run this gate before every `save_drawing`. Do not save until all REQUIRED items pass. The loop is
iterative: items 3-5 repeat once per pass, items 6-9 run once at the end.

## 1. Plan & snapshot
- [ ] `read_mcp_guide` called; geometry rules + score rubric refreshed.
- [ ] `get_drawing` called; element count and overall bbox recorded.
- [ ] Original elements kept as the rollback snapshot for pass 1.
- [ ] `lockedIds` / `protectedElementIds` identified (pinned title, legend).
- [ ] `targetScore` (default 95) and `maxPasses` (default 4) set.

## 2. Baseline captured (REQUIRED)
- [ ] `score_drawing` ran first; baseline score recorded as the floor.
- [ ] `hardBlockers` array copied for comparison.
- [ ] `mathematicalEvidence` captured: overlapAreaPx2, arrowTextIntersections, viewportFitRatio, spacingVariance.

## 3. Per-pass lint (repeats)
- [ ] `lint_drawing` ran; findings grouped by defect class.
- [ ] Hard blockers ordered first: `ARROW_TEXT_INTERSECTION`, `FRAME_TITLE_OVERLAP`, `ITEM_OUTSIDE_FRAME`.
- [ ] Penalties ordered after: `HIGH_DENSITY`, `TEXT_NEAR_EDGE`, `SMALL_FONT`, header/label overlaps.

## 4. Per-pass repair (repeats)
- [ ] `score_drawing` ran at pass start; `passStartScore` recorded.
- [ ] Per-pass element snapshot taken before `repair_drawing`.
- [ ] `repair_drawing` targeted exactly ONE defect class this pass.
- [ ] `preserveSemantics: true` and `lockedIds` passed; no node/edge added, deleted, or relabeled.
- [ ] Arrows rebound to card sides and routed through >=32px gutters (never over text).

## 5. Per-pass rollback check (REQUIRED, repeats)
- [ ] `score_drawing` ran at pass end.
- [ ] If pass-end score < `passStartScore`: per-pass snapshot restored (pass rolled back).
- [ ] After rollback, repair narrowed (single element id) or advanced to the next defect class.

## 6. Loop termination (REQUIRED)
- [ ] Loop exited because `score >= 95` AND `hardBlockers` empty — OR `maxPasses` reached — OR two
      consecutive passes with no net gain.
- [ ] If `auto_polish_drawing` was used as a convergence assist, it was re-scored and rolled back if it lowered the score.
- [ ] Final score is NOT lower than the baseline floor.

## 7. Geometry invariants (REQUIRED)
- [ ] `hardBlockers` is empty.
- [ ] Arrow-over-text intersections == 0.
- [ ] No title/header/label overlaps with each other or their containers.
- [ ] All elements inside viewport bounds with the 40px margin; nothing clipped (viewportFitRatio <= 1.0).
- [ ] Locked elements did not move.

## 8. Semantics & secrets (REQUIRED)
- [ ] Node count unchanged vs. baseline.
- [ ] Edge count and endpoints unchanged.
- [ ] Labels unchanged except for secret redaction.
- [ ] All `text` scanned for JWT / API key / service-role / DB URL / token / bearer / webhook / proxy
      and replaced with the correct `[REDACTED_*]` placeholder; re-scanned before export.

## 9. Library insertions (only if explicitly requested)
- [ ] Icons added via `add_library_items_normalized` (never raw), placed in a defined icon slot.
- [ ] Re-scored after insertion; any item that lowered the score or re-created an arrow-over-text was reverted.

## 10. Save & deliver
- [ ] `save_drawing` then `save_version` with note `"lint-repair: <baseline> -> <final> (<n> passes)"`.
- [ ] `get_drawing_url` returned.
- [ ] `export_drawing` (SVG snapshot) produced.
- [ ] Report includes the per-pass score trajectory and the defect classes cleared.
