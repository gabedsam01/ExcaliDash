# Visual Reviewer (skill)

## Objective
Score the visual quality of an Excalidraw drawing (0-100) and return concrete,
prioritized fixes. This skill gates the final save: nothing ships below a score
of 95. Do not generate net-new diagrams here — review, score, and repair only.

## When to use
Run this skill before saving ANY drawing as final. Trigger it after generation
(create_diagram_from_prompt, create_from_template, apply_architecture_skill,
create_from_repo_analysis, convert_diagram_type) and after any manual edit, but
before save_drawing / save_version.

## Expected input
- A drawing payload or drawing id already loaded in the MCP session.
- Optional intent: target visual preset (handdrawn-clean, technical-docs,
  startup-deck, dark-architecture, minimal-whiteboard, portfolio-polished).
- Optional: caller-supplied focus areas (e.g. "tighten alignment", "fix labels").
If no preset is given, infer one from the diagram type and keep it consistent.

## Visual rules
- Alignment: elements snap to a shared grid; no off-by-a-few-px drift.
- Spacing: uniform gaps between siblings; no overlapping shapes or text.
- Hierarchy: titles > section labels > node labels in clear size steps.
- Color: one cohesive palette from the chosen preset; max ~4 accent colors.
- Containment: text fits inside its shape; no clipped or overflowing labels.
- Connectors: arrows attach to anchors, avoid crossings, route cleanly.
- Whitespace: balanced margins; the canvas is neither cramped nor sparse.
- Consistency: stroke width, roughness, and font are uniform across the drawing.

## Logic rules
- Every node has a readable, non-placeholder label.
- Connectors express real relationships and point in a meaningful direction.
- No orphan elements (unconnected nodes that should be connected).
- Reading order flows naturally (top-to-bottom or left-to-right).
- Groups/sections map to a coherent grouping in the underlying model.
- Diagram type matches content (e.g. flowchart vs. architecture vs. mindmap).

## Recommended libraries
None. This skill reviews and repairs existing geometry; it does not add new
library items. If a review reveals missing iconography, defer to the generation
skill rather than calling add_library_items here.

## Mandatory validation
Follow the quality flow and do not skip steps:
1. `lint_drawing` — catch structural/geometry errors first.
2. `score_drawing` — get the 0-100 score plus issue list.
3. If score < 95: run `repair_drawing` for targeted fixes, then
   `auto_polish_drawing` to normalize spacing, alignment, and styling.
4. Re-run `score_drawing`. Loop until `score >= 95`.
You MUST achieve `score_drawing >= 95` AND run `auto_polish_drawing` before any
final save. Saving as final below 95 is prohibited; only `save_drawing` with
`asDraft: true` may persist a sub-95 drawing, and it must be flagged as a draft.

## Minimal examples
Score the current drawing:
```json
{
  "tool": "score_drawing",
  "arguments": { "drawingId": "dwg_123", "preset": "technical-docs" }
}
```

When the score is below threshold, polish and re-score:
```json
{
  "tool": "auto_polish_drawing",
  "arguments": { "drawingId": "dwg_123", "preset": "technical-docs", "targetScore": 95 }
}
```

Only after `score_drawing` returns `>= 95`, save the final:
```json
{
  "tool": "save_drawing",
  "arguments": { "drawingId": "dwg_123", "asDraft": false }
}
```
