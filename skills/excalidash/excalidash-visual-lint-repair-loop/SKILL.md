---
name: excalidash-visual-lint-repair-loop
description: Use when an Excalidraw drawing looks messy — overlapping arrows, arrows crossing text, colliding headers, or cramped spacing — and needs an iterative, geometry-only lint-score-repair loop that drives the score to 95 or higher with rollback on any regression.
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__get_drawing
  - mcp__excalidash__lint_drawing
  - mcp__excalidash__score_drawing
  - mcp__excalidash__repair_drawing
  - mcp__excalidash__auto_polish_drawing
  - mcp__excalidash__save_drawing
  - mcp__excalidash__save_version
  - mcp__excalidash__get_drawing_url
  - mcp__excalidash__export_drawing
---

# Visual Lint & Repair Loop

## Objective
Take an existing, visually messy Excalidraw drawing and run an explicit, bounded iteration —
`lint_drawing` -> `score_drawing` -> `repair_drawing` -> `score_drawing` -> export — until the
drawing scores **>= 95** with zero hard blockers, or until passes stop making progress. This is a
pure geometric cleanup loop: it relocates, reroutes, and re-spaces existing elements but never adds,
deletes, or relabels nodes or edges. Unlike a single polish pass, this skill is the iterative variant
for stubborn drawings where one pass is not enough, and it **rolls back any pass that lowers the score**.

## When to use / When NOT to use
Use when:
- A drawing has visible overlapping arrows, arrows routed over text labels, or headers colliding.
- A single `auto_polish_drawing` pass did not reach 95 and you need controlled, multi-pass repair.
- The user says "this looks messy", "clean up the arrows", "fix the overlaps", "untangle this", or
  "iterate until it's clean".
- Spacing is ragged or content overflows the viewport and one fix surfaces another defect.

Do NOT use when:
- You need to create a new diagram (use a generation skill first, then this loop).
- The user wants semantic changes — adding/removing nodes, relabeling edges, restructuring topology.
- The drawing already scores >= 95 with empty `hardBlockers` (confirm and stop; do not perturb it).
- The user explicitly waived the threshold with a `draft: true` flag.

## Expected input
- A `drawingId` (or current drawing context) for a saved or in-progress scene.
- Optional `targetScore` override (default **95**).
- Optional `lockedIds` / `protectedElementIds` — geometry that must not move (pinned title, legend).
- Optional `maxPasses` (default 4) — the iteration ceiling before reporting residual blockers.

## Recommended MCP tools
Ordered call sequence (the loop body is steps 4-7, repeated):
1. `read_mcp_guide` — refresh the geometry rules and score rubric.
2. `get_drawing` — load the scene; snapshot elements for rollback; note element count and bbox.
3. `score_drawing` — baseline score + `hardBlockers` + `mathematicalEvidence` (rollback reference).
4. `lint_drawing` — enumerate defects: `ARROW_TEXT_INTERSECTION`, `FRAME_TITLE_OVERLAP`,
   `ITEM_OUTSIDE_FRAME`, `HIGH_DENSITY`, `TEXT_NEAR_EDGE`, `SMALL_FONT`, header/label overlaps.
5. `score_drawing` — score the current pass (pre-repair, to attribute the delta to this pass).
6. `repair_drawing` — apply targeted fixes for ONE defect class per pass (reroute arrows, push
   content below title bands, redistribute spacing, pull content inside the viewport margin).
7. `score_drawing` — re-score. If lower than the start-of-pass score, **roll back this pass**.
   If >= 95 and `hardBlockers` empty, exit the loop. Otherwise go to step 4 (next pass).
8. `auto_polish_drawing` — optional convergence assist if manual passes stall just short of 95.
9. `save_drawing` -> `save_version`, then `get_drawing_url` and `export_drawing` (SVG snapshot).

## Workflow
1. **Plan.** Call `read_mcp_guide`, then `get_drawing`. Record element count, overall bounding box,
   `lockedIds`, `targetScore` (default 95), and `maxPasses` (default 4). Keep the returned elements
   as the rollback snapshot for pass 1.
2. **Baseline.** Call `score_drawing`. Save `score`, `hardBlockers`, and `mathematicalEvidence`
   (overlapAreaPx2, arrowTextIntersections, viewportFitRatio, spacingVariance). This is the floor —
   the loop must never end below it.
3. **Lint.** Call `lint_drawing`. Group findings by defect class and order them most-severe-first:
   hard blockers (`ARROW_TEXT_INTERSECTION`, `FRAME_TITLE_OVERLAP`, `ITEM_OUTSIDE_FRAME`) before
   penalties (`HIGH_DENSITY`, `TEXT_NEAR_EDGE`, `SMALL_FONT`).
4. **Score (pass start).** Call `score_drawing` and remember this as `passStartScore`; snapshot the
   current elements as the per-pass rollback point.
5. **Repair.** Call `repair_drawing` targeting exactly ONE defect class this pass (e.g. only
   `ARROW_TEXT_INTERSECTION`: rebind arrow endpoints to card sides and route through a >=32px gutter).
   Pass `preserveSemantics: true` and `lockedIds`. One class per pass keeps deltas attributable.
6. **Score (pass end).** Call `score_drawing`. If the new score **< passStartScore**, restore the
   per-pass snapshot (roll back this pass) and either narrow the repair (a single element id) or move
   to the next defect class. Never keep a regressing pass.
7. **Loop.** Repeat steps 3-6 until `score >= 95` AND `hardBlockers` is empty, OR `maxPasses` is hit,
   OR two consecutive passes yield no net gain. If stalled just below 95, call `auto_polish_drawing`
   once as a convergence assist, then re-score; if it lowers the score, roll it back too.
8. **Validate.** Confirm the save gate: `hardBlockers` empty, arrow-over-text = 0, no overlapping
   headers/titles, viewport fit within tolerance, score >= 95.
9. **Save.** Only when the gate passes (or `draft: true` was explicitly granted), call `save_drawing`,
   then `save_version` with a note like `"lint-repair: 78 -> 96 (3 passes)"`.
10. **Export.** Call `get_drawing_url` and `export_drawing` (SVG snapshot) for the final deliverable.
    Report the per-pass score trajectory and the defect classes cleared.

Repair is mandatory: the drawing must not leave this skill below 95 unless the user explicitly waived
the threshold. Rollback is mandatory: any pass (manual or auto-polish) that lowers the measured score
is reverted before the next attempt.

## Library policy
This skill is pure layout — it neither searches for nor adds library packs (no curated packs apply
here). If the loop surfaces an empty icon slot left by a prior import, flag it in the report; do not
fill it. If the user explicitly asks to drop an icon mid-loop, normalize the insertion through
`add_library_items_normalized` so its scale, stroke, and grid alignment match the scene, place it only
in a defined icon slot (never an arrow lane or over text), then immediately re-score and **reject any
item that lowers the score** — revert the insertion. A decorative icon must never reintroduce an
`ARROW_TEXT_INTERSECTION` or push the drawing below 95. See ../_shared/references/library-policy.md.

## Validation & score
The drawing passes only when ALL hold:
- `hardBlockers` is empty (no `ARROW_TEXT_INTERSECTION`, `FRAME_TITLE_OVERLAP`, `ITEM_OUTSIDE_FRAME`).
- No arrow/line segment crosses any text bounding box (arrow-over-text intersections == 0).
- Titles, section headers, and node labels do not overlap each other or their containers.
- Every element fits inside the viewport with the 40px margin (viewportFitRatio <= 1.0, nothing clipped).
- `score_drawing` returns **>= 95**.

Report the per-pass trajectory and `mathematicalEvidence` deltas so the cleanup is auditable, e.g.
`arrowTextIntersections 4 -> 0`, `overlapAreaPx2 3200 -> 0`, `score 78 -> 84 -> 91 -> 96`.

## Secrets & redaction
The loop changes geometry only, but existing text may carry secrets. Before the final `save_drawing`,
scan every `text` element and replace any JWT/`JWT_SECRET`, API key (`*_API_KEY`, `sk-...`),
service-role key, database URL (`postgres://user:<password>@...`), OAuth/access/refresh token, value after
`Bearer `, webhook signing secret, or proxy credential with the matching placeholder:
`[REDACTED_JWT_SECRET]`, `[REDACTED_API_KEY]`, `[REDACTED_SERVICE_ROLE]`, `[REDACTED_DATABASE_URL]`,
`[REDACTED_TOKEN]`, `[REDACTED_BEARER]`, `[REDACTED_WEBHOOK_SECRET]`, `[REDACTED_PROXY_SECRET]`.
Redaction is a text-content change only and must not alter layout scoring; re-scan the serialized
scene before export as a backstop and fail closed. See ../_shared/references/security-redaction.md.

## Internal prompts
- Pass repair: `"Repair drawing {drawingId}, defect class {class} ONLY. preserveSemantics=true,
  lockedIds={lockedIds}. Reroute arrows to card sides through >=32px gutters; do not touch other
  defect classes this pass."`
- Rollback trigger: `"Pass score {passEnd} < pass-start {passStart}. Restore the per-pass snapshot,
  then narrow the repair to a single element id or advance to the next defect class."`
- Final report: `"score trajectory {s0} -> ... -> {final} in {n} passes. Cleared: {defectClasses}.
  hardBlockers empty. arrow-over-text: 0. Saved version: {note}. URL: {url}."`

## Example prompts for Claude Code
These user prompts should trigger this skill:
- "This service map is a mess — the arrows cross the labels everywhere. Clean it up until it scores 95."
- "auto_polish only got me to 90; iterate with multi-pass repair and roll back anything that regresses."
- "Untangle the overlapping headers and crossing arrows in drawing drw_aa12, but don't change any nodes or edges."
- "Fix the spacing and the node that's clipping off the right edge, then give me an SVG export."
- "Run the lint-score-repair loop on this diagram and report the per-pass score trajectory."

## Acceptance criteria
- [ ] `score_drawing` >= 95 (or explicit `draft: true` waiver recorded in the version note).
- [ ] `hardBlockers` array is empty.
- [ ] Zero arrow / text bounding-box intersections.
- [ ] No overlapping headers, titles, or node labels.
- [ ] All content fits within viewport bounds with the 40px margin (nothing clipped).
- [ ] Every pass that lowered the measured score was rolled back (final score never below baseline).
- [ ] Semantics unchanged: same node count, same edges, same labels (modulo redaction).
- [ ] Libraries used only on explicit request, normalized, and reverted if they lowered the score.
- [ ] No secrets present in any text element (redaction applied and re-scanned before export).
- [ ] Per-pass score trajectory and cleared defect classes reported.

## Examples
See ./references/examples.md for full per-pass call traces. See ./references/checklist.md for the
pre-save gate and ./references/anti-patterns.md for loop-specific failure modes to avoid.
