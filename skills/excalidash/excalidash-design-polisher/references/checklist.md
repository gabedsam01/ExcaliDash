# Design Polisher — Pre-Save Checklist

Run this gate before every `save_drawing`. Do not save until all REQUIRED items pass.

## 1. Baseline captured
- [ ] `score_drawing` ran first; baseline score recorded.
- [ ] `hardBlockers` array copied for comparison.
- [ ] `mathematicalEvidence` captured: overlap area, arrow-text intersections, spacing variance, viewport fit ratio.
- [ ] `protectedElementIds` (if any) identified and passed as `lockedIds`.

## 2. Polish pass
- [ ] `auto_polish_drawing` called with `preserveSemantics: true` and `targetScore: 95`.
- [ ] `repairPlan` inspected; every entry has a known defect class (overlap / arrow-over-text / overflow / spacing / style).
- [ ] No `repairPlan` entry adds, deletes, or relabels a node or edge.

## 3. Lint clean
- [ ] `lint_drawing` returns zero error-level findings.
- [ ] Any remaining warnings do not touch `hardBlockers`.

## 4. Score gate (REQUIRED)
- [ ] `score_drawing` >= 95.
- [ ] `hardBlockers` is empty.
- [ ] New score is NOT lower than baseline (if lower, rolled back and re-ran conservative).

## 5. Geometry invariants (REQUIRED)
- [ ] Arrow-over-text intersections = 0.
- [ ] No title/header/label overlaps with each other or their containers.
- [ ] All elements inside viewport bounds with margin; nothing clipped.
- [ ] Locked elements did not move.

## 6. Semantics preserved (REQUIRED)
- [ ] Node count unchanged vs. baseline.
- [ ] Edge count and endpoints unchanged.
- [ ] Labels unchanged except for secret redaction.

## 7. Secrets (REQUIRED)
- [ ] All `text` elements scanned for JWT / API key / service-role / DB URL / token / bearer / webhook / proxy.
- [ ] Matches replaced with the correct `[REDACTED_*]` placeholder.

## 8. Library insertions (only if requested)
- [ ] Icons added via `add_library_items_normalized` (never raw).
- [ ] Re-scored after insertion; any item that lowered the score was reverted.

## 9. Save & deliver
- [ ] `save_drawing` then `save_version` with note `"polish: <baseline> -> <final>"`.
- [ ] `get_drawing_url` returned.
- [ ] `export_drawing` (PNG or SVG) produced.
- [ ] Report includes before/after score and fixed defect classes.
