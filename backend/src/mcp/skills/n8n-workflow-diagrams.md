# n8n Workflow Diagrams (skill)

## Objective
Lay out automation workflows as readable node graphs. Render an n8n / automation
pipeline so each step is a labeled node, data flows left-to-right (or top-to-bottom),
and triggers, actions, branches, and error paths are visually distinct.

## When to use
- The prompt describes an n8n workflow, automation pipeline, or webhook/cron-driven flow.
- Input mentions triggers, nodes, integrations (Slack, Gmail, HTTP, DB), or IF/Switch branching.
- The user wants a shareable diagram of "what runs when X happens".

Do NOT use for system/cloud architecture (use the architecture skill) or pure flowcharts
with no automation context.

## Expected input
A natural-language description or structured list of nodes, e.g.:
- Trigger(s): webhook, cron/schedule, manual, app event.
- Ordered steps with integration/service names.
- Branch conditions (IF / Switch) and their outgoing labels.
- Error / fallback handling, if any.

If the input is vague, infer a single linear happy path and one error branch, and keep
node count between 4 and 20.

## Visual rules
- Flow direction: left-to-right by default; switch to top-to-bottom if more than 8 nodes.
- One node = one operation. Node label = service + verb (e.g. "Slack: Post Message").
- Color/shape coding:
  - Trigger nodes: distinct accent (rounded rectangle).
  - Action/integration nodes: rectangles, neutral fill.
  - IF/Switch nodes: diamonds.
  - Error/fallback nodes: warning accent (red/orange).
- Label every edge that leaves a branch node ("true"/"false", case names).
- Keep consistent node width; align rows/columns on a grid. No crossing edges where avoidable.
- Apply a preset: `technical-docs` (default) or `dark-architecture` for dark mode.

## Logic rules
- Exactly one entry per trigger; merge multiple triggers into a shared first action when they converge.
- Every non-terminal node has at least one outgoing edge; terminal nodes (notify/store) have none outgoing.
- Branch nodes must enumerate all outcomes; never leave an unlabeled fork.
- Loops (SplitInBatches / item iteration) are drawn with a back-edge labeled "loop".
- Do not invent integrations not implied by the input.

## Recommended libraries
1. `Flow Chart Symbols` - trigger/action/decision/terminator shapes.
2. `Technology Logos` - service icons (Slack, Gmail, HTTP, Postgres, etc.).

Resolve and attach via: `search_libraries` -> `inspect_library` -> `cache_library` ->
`add_library_items_normalized` (preferred, snaps icons onto nodes cleanly).

## Mandatory validation
Run the quality flow before any final save. This is non-negotiable:
1. `lint_drawing` - fix structural/overlap warnings.
2. `score_drawing` - obtain a 0-100 score.
3. If score < 95: run `auto_polish_drawing` (and `repair_drawing` for structural issues),
   then re-run `score_drawing`. Repeat until `score >= 95`.
4. Only after `score_drawing` returns `>= 95` AND `auto_polish_drawing` has been applied,
   call `save_drawing` as final. Below 95, `save_drawing` will refuse unless `asDraft: true`.
5. Then `save_version` and `get_drawing_url` for sharing.

## Minimal examples
Generate the base graph:
```json
{
  "tool": "create_diagram_from_prompt",
  "arguments": {
    "prompt": "n8n workflow: webhook trigger -> HTTP fetch order -> IF amount > 100 -> Slack alert; else Gmail receipt. On error -> Slack #ops.",
    "diagramType": "workflow",
    "preset": "technical-docs",
    "direction": "LR"
  }
}
```

Attach normalized service icons:
```json
{
  "tool": "add_library_items_normalized",
  "arguments": {
    "library": "Technology Logos",
    "items": ["Slack", "Gmail", "HTTP"],
    "attachToNodes": true
  }
}
```

Validate and finalize:
```json
{ "tool": "lint_drawing", "arguments": {} }
{ "tool": "score_drawing", "arguments": {} }
{ "tool": "auto_polish_drawing", "arguments": { "targetScore": 95 } }
{ "tool": "save_drawing", "arguments": { "name": "order-webhook-workflow", "asDraft": false } }
```
