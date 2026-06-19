# Diagram Director (skill)

## Objective
Plan the diagram before drawing it. Decide diagram type, visual preset, and
which curated libraries to load, then commit to the mandatory quality flow
(lint -> score -> repair/polish). This planning pass prevents rework and is the
prerequisite for every `create_diagram_from_prompt` call.

## When to use
Always. Run this skill as the first step of any diagram generation, before
calling `create_diagram_from_prompt`, `create_from_template`,
`apply_architecture_skill`, `create_from_repo_analysis`, or
`convert_diagram_type`. Do not draw until the plan below is filled in.

## Expected input
- A natural-language prompt describing the diagram intent.
- Optional: target diagram type (architecture, flowchart, sequence, ER, mindmap),
  a desired visual preset, a template id, or a repo path for repo analysis.
- Optional: brand/style constraints (light vs dark, formality, audience).

Before generating, derive and record:
1. Diagram type (one of the above).
2. Visual preset (see Visual rules).
3. Libraries to load (see Recommended libraries).
4. Node/edge count estimate and grouping plan.

## Visual rules
- Pick exactly one preset and apply it consistently:
  - `handdrawn-clean` — informal sketches, brainstorming.
  - `technical-docs` — precise system/architecture docs (default for engineering).
  - `startup-deck` — pitch/marketing visuals.
  - `dark-architecture` — dark-background infra/architecture.
  - `minimal-whiteboard` — sparse ideation.
  - `portfolio-polished` — high-fidelity showcase output.
- Keep one font family and one accent color per diagram.
- Align nodes to a grid; avoid overlapping shapes and crossing edges where
  routing allows. Group related nodes and label every edge that carries meaning.
- Reserve whitespace; do not crowd. Title the canvas.

## Logic rules
- Match type to intent: flow/process -> flowchart; components/services ->
  architecture; ordered interactions -> sequence; data model -> ER.
- One direction of flow (top-down or left-right); do not mix.
- Every node has a clear label; every edge has a direction and, when needed, a label.
- No orphan nodes and no dangling edges. Decompose into sub-groups when node
  count exceeds ~12.
- Prefer `create_from_template` or `apply_architecture_skill` when the intent
  maps to a known pattern; fall back to `create_diagram_from_prompt` otherwise.

## Recommended libraries
- `Software Architecture` — cloud/service/infra components.
- `Flow Chart Symbols` — decisions, processes, terminators, connectors.

Workflow: `search_libraries` -> `inspect_library` to confirm items ->
`cache_library` -> `add_library_items` (or `add_library_items_normalized` to
snap styling to the chosen preset). Load libraries before drawing so generated
nodes reuse curated shapes.

## Mandatory validation
Never save final output without passing the full quality flow:
1. `lint_drawing` — fix structural and labeling issues.
2. `score_drawing` — returns 0-100. **The minimum passing score is 95.**
3. If score < 95: run `repair_drawing` for targeted fixes, then
   `auto_polish_drawing`, and re-run `score_drawing`. Repeat until >= 95.
4. **`auto_polish_drawing` MUST run before the final save.**
5. `save_drawing` will refuse to persist a drawing below 95 unless `asDraft`
   is set. Only call `save_drawing` as final once `score_drawing >= 95`. Use
   `save_version` for checkpoints, `get_drawing_url` / `export_drawing` after.

## Minimal examples
Plan then generate (architecture, technical preset):

```json
{
  "tool": "create_diagram_from_prompt",
  "arguments": {
    "prompt": "Web app: React client -> API gateway -> auth service + Postgres",
    "diagramType": "architecture",
    "preset": "technical-docs",
    "libraries": ["Software Architecture"]
  }
}
```

Validate and gate the save:

```json
{ "tool": "lint_drawing", "arguments": { "drawingId": "dwg_123" } }
```
```json
{ "tool": "score_drawing", "arguments": { "drawingId": "dwg_123" } }
```
```json
{ "tool": "auto_polish_drawing", "arguments": { "drawingId": "dwg_123" } }
```
```json
{
  "tool": "save_drawing",
  "arguments": { "drawingId": "dwg_123", "asDraft": false }
}
```
If `score_drawing` returns < 95, run `repair_drawing` then re-score before saving.
