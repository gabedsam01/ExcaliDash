# Software Architecture Diagrams (skill)

## Objective
Produce clear C4 and system architecture diagrams (system context, container, component) using curated, on-brand icons. Output must pass the quality gate (score >= 95) before it is saved as final.

## When to use
Use for any system, container, or component architecture request: "diagram our microservices", "show the AWS deployment", "C4 container view of the API", "map the data flow between services". Do not use for flowcharts, ER/schema diagrams, sequence diagrams, or UI wireframes — route those to their dedicated skills.

## Expected input
- A description of the system: services, datastores, external systems, and the boundaries between them.
- Optional: target C4 level (context / container / component). If absent, infer from scope and default to container level.
- Optional: a repo path (use `create_from_repo_analysis`) or an existing diagram to convert (`convert_diagram_type`).
- Optional: a visual preset. Default to `dark-architecture` or `technical-docs` for architecture work.

## Visual rules
- Pick ONE preset and keep it consistent. Recommended: `dark-architecture` or `technical-docs`; use `minimal-whiteboard` only for rough drafts.
- Enforce C4 layering top-to-bottom or left-to-right: actors/external systems on the edges, the system under design in the center.
- Draw explicit boundary containers (system/container boundaries) as labeled grouping rectangles around their children.
- Every arrow is directional and labeled with the protocol or intent (e.g. "HTTPS/JSON", "reads", "publishes event").
- Use curated icons for technologies (databases, queues, cloud services, language/framework logos) instead of bare rectangles.
- Maintain even spacing and alignment; no overlapping nodes, no crossing arrows where avoidable.
- Keep labels short: a noun for nodes, a verb or protocol for edges. Add a legend only when icon meaning is non-obvious.

## Logic rules
- Stay within a single C4 level per diagram — do not mix container-level and component-level detail.
- Every node must connect to at least one other node; flag and remove orphans.
- Each external dependency (3rd-party API, managed service) is a distinct, labeled node, not an annotation.
- Datastores are terminal where appropriate; show read vs write direction when it matters.
- Names must match the source (repo modules, service names) when generating from `create_from_repo_analysis`.
- Prefer `apply_architecture_skill` to normalize layout and icon usage after initial generation.

## Recommended libraries
Search and cache these before placing icons (`search_libraries` -> `inspect_library` -> `cache_library` -> `add_library_items_normalized`):
- AWS Architecture Icons — cloud services, compute, storage, networking.
- C4 Architecture — persons, software systems, containers, components, relationships.
- Software Logos — language, framework, database, and tool brand marks.
Use `add_library_items_normalized` (not raw `add_library_items`) so icon scale and style match the chosen preset.

## Mandatory validation
Never skip this flow. A diagram is NOT final until it scores at least 95.
1. `lint_drawing` — fix structural issues (overlaps, orphans, unlabeled edges).
2. `score_drawing` — obtain the 0-100 score.
3. If score < 95: run `repair_drawing` for targeted fixes, then `auto_polish_drawing`.
4. Re-run `score_drawing` and loop until score >= 95.
5. `auto_polish_drawing` MUST be run before the final save, even if the score already passed.
6. `save_drawing` only after score >= 95. Below 95, save only with `asDraft: true`. Use `save_version` to snapshot iterations and `get_drawing_url` / `export_drawing` to share.

## Minimal examples
Generate, validate, polish, then save:

```json
{
  "tool": "apply_architecture_skill",
  "arguments": {
    "skill": "software-architecture-diagrams",
    "prompt": "C4 container diagram: React SPA -> API Gateway -> Orders service and Payments service; Orders uses PostgreSQL; Payments calls Stripe; events via Kafka",
    "level": "container",
    "preset": "dark-architecture",
    "libraries": ["aws-architecture-icons", "c4-architecture", "software-logos"]
  }
}
```

```json
{ "tool": "score_drawing", "arguments": { "drawingId": "arch-001" } }
```

If the returned score is below 95:

```json
{ "tool": "auto_polish_drawing", "arguments": { "drawingId": "arch-001", "targetScore": 95 } }
```

Final save (only once score >= 95):

```json
{ "tool": "save_drawing", "arguments": { "drawingId": "arch-001", "asDraft": false } }
```
