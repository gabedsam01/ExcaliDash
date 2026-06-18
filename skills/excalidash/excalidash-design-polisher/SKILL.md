---
name: excalidash-design-polisher
description: Use when an Excalidraw drawing has just been generated, imported from a library, or edited and its visual quality must be raised to a score of 95 or higher before saving or sharing.
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__get_drawing
  - mcp__excalidash__lint_drawing
  - mcp__excalidash__score_drawing
  - mcp__excalidash__repair_drawing
  - mcp__excalidash__auto_polish_drawing
  - mcp__excalidash__validate_architecture
  - mcp__excalidash__suggest_architecture_improvements
  - mcp__excalidash__save_drawing
  - mcp__excalidash__save_version
  - mcp__excalidash__get_drawing_url
  - mcp__excalidash__export_drawing
---

# Design Polisher

## Objective
Take an already-existing Excalidraw drawing and raise its visual quality to a score of at least 95 without changing its semantic content. The polisher is a pure layout-and-cleanup pass: it fixes overlaps, arrow-over-text intersections, ragged spacing, viewport overflow, and stray styling. It is the mandatory final gate that runs after any generation, template instantiation, repo-analysis diagram, or library import, and it never invents new nodes or relationships.

## When to use / When NOT to use
Use when:
- A diagram was just produced by `create_diagram_from_prompt`, `create_from_template`, `create_from_repo_analysis`, or `convert_diagram_type` and has not yet been scored.
- Library items were just added via `add_library_items` / `add_library_items_normalized` and may have shifted or collided with existing elements.
- A drawing scores below 95 and the user wants it brought up to standard.
- A user explicitly asks to "polish", "clean up", "tighten the layout", or "make it presentable".

Do NOT use when:
- You need to create a brand-new diagram from a prompt (use the generation skill, then this one).
- The user wants to change meaning — add/remove nodes, relabel edges, or restructure (that is editing, not polishing).
- The user explicitly asked for a rough draft and waived the 95 threshold.

## Expected input
- A `drawingId` (or the current drawing context) pointing to a saved or in-progress Excalidraw scene.
- Optionally a `targetScore` override (default 95) and a `draft: true` flag that, if and only if explicitly set by the user, permits saving below threshold.
- Optionally a list of `protectedElementIds` whose geometry must not move (e.g. a pinned title or legend).

## Recommended MCP tools
Ordered call sequence:
1. `read_mcp_guide` — refresh polishing conventions and the score rubric.
2. `get_drawing` — load the current scene to inspect element count and bounds.
3. `score_drawing` — baseline score; capture `hardBlockers` and `mathematicalEvidence`.
4. `auto_polish_drawing` — the core pass; returns `repairPlan`, updated elements, and a projected score.
5. `lint_drawing` — confirm no structural lint remains after the polish pass.
6. `repair_drawing` — apply any residual fixes from the `repairPlan` that `auto_polish_drawing` flagged but did not auto-apply.
7. `score_drawing` — re-score; loop steps 4-7 until score >= 95 or two passes yield no improvement.
8. `validate_architecture` / `suggest_architecture_improvements` — sanity check that polishing did not break flow legibility (read-only, advisory).
9. `save_drawing` then `save_version`, then `get_drawing_url` and `export_drawing` for delivery.

## Workflow
1. **Plan** — Call `read_mcp_guide`, then `get_drawing`. Note element count, overall bounding box, and any `protectedElementIds`. Decide the `targetScore` (default 95).
2. **Baseline score** — Call `score_drawing`. Record the numeric score, the `hardBlockers` array, and the `mathematicalEvidence` (overlap area, arrow-text intersections, spacing variance, viewport fit ratio). This is the rollback reference.
3. **Auto-polish** — Call `auto_polish_drawing` with the drawing and `{ "targetScore": 95, "preserveSemantics": true, "lockedIds": protectedElementIds }`. Inspect the returned `repairPlan`: each entry names the offending element, the defect class (overlap / arrow-over-text / overflow / spacing / style), and the proposed geometry delta.
4. **Lint** — Call `lint_drawing`. Resolve every error-level finding. Warnings are acceptable only if they do not touch `hardBlockers`.
5. **Score** — Call `score_drawing` again. If the new score is **lower** than the baseline, roll back to the pre-pass elements and re-run `auto_polish_drawing` with `aggressiveness: "conservative"`. Never accept a pass that lowers the score.
6. **Repair loop** — While score < 95: re-enter the lint → score → repair loop. Apply remaining `repairPlan` items via `repair_drawing` (targeted, one defect class at a time), then re-lint and re-score. Stop after two consecutive passes with no net gain and report the residual blockers.
7. **Validate** — Call `validate_architecture` and, if it returns suggestions, `suggest_architecture_improvements` to confirm legibility was preserved. These are advisory; do not let them mutate semantics.
8. **Save** — Only when score >= 95 (or `draft: true` was explicitly granted), call `save_drawing`, then `save_version` with a note like `"polish: 87 -> 96"`.
9. **Export** — Call `get_drawing_url` and `export_drawing` (PNG/SVG) for the final deliverable. Report the before/after score and the list of fixed defect classes.

Repair is mandatory: a drawing must not leave this skill below 95 unless the user explicitly waived the threshold.

## Library policy
This skill is pure layout — it does not add new library packs. No curated packs are recommended here. If polishing reveals an icon slot that was left empty by a prior import, do not fill it from a library unless the user asks; instead flag it in the report. If the user does request an icon, normalize every insertion through `add_library_items_normalized` so coordinates and scale match the scene, then immediately re-score and **reject any item that lowers the score** (revert the insertion). Never let a decorative library item push the drawing below 95 or create a new arrow-over-text intersection. See ../_shared/references/library-policy.md.

## Validation & score
A drawing passes only when ALL hold:
- `hardBlockers` is empty.
- No arrow path crosses any text bounding box (arrow-over-text = 0).
- Titles, section headers, and node labels do not overlap each other or their containers.
- Every element fits inside the viewport bounds with margin (viewport fit ratio within tolerance; no clipped content).
- `score_drawing` returns >= 95.

Report the `mathematicalEvidence` deltas (e.g. overlap area 1840px² -> 0, arrow-text intersections 3 -> 0) so the improvement is auditable.

## Secrets & redaction
Polishing never introduces secrets, but imported or generated text may carry them. Before saving, scan all `text` elements and replace any JWT, API key, service-role key, database URL, OAuth token, bearer token, webhook URL, or proxy credential with the matching placeholder: `[REDACTED_JWT]`, `[REDACTED_API_KEY]`, `[REDACTED_SERVICE_ROLE]`, `[REDACTED_DB_URL]`, `[REDACTED_TOKEN]`, `[REDACTED_BEARER]`, `[REDACTED_WEBHOOK]`, `[REDACTED_PROXY]`. Redaction is a text-content change only and must not alter layout scoring. See ../_shared/references/security-redaction.md.

## Internal prompts
- Polish call: `"Polish drawing {drawingId} to score >= 95. preserveSemantics=true. Lock {protectedElementIds}. Return repairPlan with defect class per element."`
- Rollback trigger: `"Score dropped from {baseline} to {new}. Revert to pre-pass elements and re-run auto_polish_drawing with aggressiveness=conservative."`
- Final report: `"Score {baseline} -> {final}. Fixed: {defectClasses}. hardBlockers: empty. arrow-over-text: 0. Saved version: {note}. URL: {url}."`

## Example prompts for Claude Code
These user prompts should trigger this skill:
- "Polish this drawing and get it above 95 before I share it."
- "Clean up the layout — some arrows cross the labels and the right edge is clipped."
- "I just imported AWS icons and a node looks crowded; tighten it up without changing anything."
- "Bring this diagram up to standard, but don't move the pinned title or legend."
- "Score and fix this scene — same nodes and edges, just make it presentable."

## Acceptance criteria
- [ ] `score_drawing` >= 95 (or explicit `draft: true` waiver recorded).
- [ ] `hardBlockers` array is empty.
- [ ] Zero arrow / text bounding-box intersections.
- [ ] No overlapping titles, headers, or node labels.
- [ ] All content fits within viewport bounds with margin.
- [ ] Semantics unchanged: same node count, same edges, same labels (modulo redaction).
- [ ] Any library icon added on request was normalized and did not lower the score; otherwise reverted.
- [ ] No secrets present in any text element (redaction applied).
- [ ] Before/after score and fixed defect classes reported.

## Examples
See ./references/examples.md for full call traces. See ./references/checklist.md for the pre-save gate and ./references/anti-patterns.md for failure modes to avoid.
