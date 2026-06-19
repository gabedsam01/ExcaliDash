# Design Polisher (skill)

## Objective
Drive the quality loop `lint_drawing -> score_drawing -> repair` until the drawing
reaches a passing score of **>= 95 (0-100)**. This skill turns any freshly generated
or imported drawing into a clean, consistent, save-ready artifact. Never treat a
drawing as finished below 95.

## When to use
Run this skill **immediately after any automatic generation or library import**,
specifically after:
- `create_diagram_from_prompt`, `create_from_template`, `apply_architecture_skill`
- `create_from_repo_analysis`, `convert_diagram_type`
- `add_library_items` / `add_library_items_normalized`

If you generated or mutated a drawing in this session and have not yet scored it
>= 95, invoke this skill before saving as final.

## Expected input
- A `drawingId` (or in-memory drawing reference) for the current canvas.
- Optional `preset` to enforce a coherent look (default `technical-docs`):
  `handdrawn-clean`, `technical-docs`, `startup-deck`, `dark-architecture`,
  `minimal-whiteboard`, `portfolio-polished`.
- Optional target score override (never below 95).

## Visual rules
- Pick **one** preset and apply it consistently; do not mix stroke styles or fonts.
- Align elements to a grid; keep consistent spacing/gutters between nodes.
- Avoid overlapping elements, clipped text, and arrows that don't bind to shapes.
- Keep a limited, intentional palette; respect light/dark contrast for the preset.
- Uniform font sizes by role (title > group label > node > annotation).

## Logic rules
- Every connector should bind to a real source and target; no dangling arrows.
- Labels must be present, readable, and non-truncated.
- Preserve original semantics during repair — fix layout/style, never invent nodes
  or change relationships unless `lint_drawing` flags them as broken.
- Treat `lint_drawing` findings as the authoritative repair checklist.

## Recommended libraries
None for this skill. It operates on whatever is already on the canvas. If lint
reveals missing iconography, use `search_libraries` / `inspect_library` and add via
`add_library_items_normalized`, then re-run the validation loop.

## Mandatory validation
This loop is **required** before any final save:
1. `lint_drawing` — collect structural and style issues.
2. `score_drawing` — get a 0-100 score.
3. If score < 95: run `repair_drawing` (targeted) or `auto_polish_drawing`
   (broad), then return to step 1.
4. Always run `auto_polish_drawing` once the score is in range, then re-score to
   confirm it still holds **>= 95**.
5. Only then `save_drawing` as final. `save_drawing` rejects scores below 95 unless
   `asDraft: true` is set — use draft saves only for intermediate checkpoints.

Hard requirements: a final save MUST be preceded by a `score_drawing` result
**>= 95** and a successful `auto_polish_drawing` pass. Cap automatic iterations
(e.g. 4); if still below 95, save with `asDraft: true` and report blockers.

## Minimal examples
Lint, then score the current drawing:
```json
{ "tool": "lint_drawing", "arguments": { "drawingId": "dwg_123" } }
```
```json
{ "tool": "score_drawing", "arguments": { "drawingId": "dwg_123" } }
```
Polish to spec, then re-score before saving:
```json
{
  "tool": "auto_polish_drawing",
  "arguments": {
    "drawingId": "dwg_123",
    "preset": "technical-docs",
    "targetScore": 95
  }
}
```
Final save only after confirming score >= 95:
```json
{
  "tool": "save_drawing",
  "arguments": { "drawingId": "dwg_123", "asDraft": false }
}
```
If the cap is reached below 95, checkpoint as a draft instead:
```json
{
  "tool": "save_drawing",
  "arguments": { "drawingId": "dwg_123", "asDraft": true }
}
```
