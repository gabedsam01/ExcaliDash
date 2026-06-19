# Repo to Diagram (skill)

## Objective
Turn a structured repository analysis into a real, readable architecture diagram on the
ExcaliDash canvas. The output must reflect actual services, data stores, and dependencies
discovered in the scan — not a generic template — and pass the quality gate before saving.

## When to use
Use when an external repo scan has produced a structured analysis (services, languages,
frameworks, datastores, external APIs, and their relationships) and the caller wants it
rendered as a diagram. Drive generation with `create_from_repo_analysis`. Prefer this over
`create_diagram_from_prompt` whenever structured repo data exists.

## Expected input
A structured analysis object, typically containing:
- `name`: project / repo name (becomes the diagram title).
- `services`: list of components, each with `id`, `label`, `type`
  (`frontend` | `backend` | `worker` | `gateway` | `database` | `cache` | `queue` | `external`),
  and optional `tech` (e.g. `react`, `postgres`, `redis`, `nginx`).
- `edges`: directed dependencies as `{ from, to, label? }` (e.g. `"HTTP"`, `"reads/writes"`).
- Optional `groups` / `boundaries`: logical layers or deployment boundaries.
If `edges` are missing, infer them conservatively from service types; never invent services.

## Visual rules
- Layout left-to-right or top-to-bottom by tier: clients/frontend -> gateway -> backend/workers
  -> datastores/external. Keep tiers aligned on a shared axis.
- One node per service. Attach a technology logo (see libraries) when `tech` is known;
  otherwise use a labeled rectangle. Databases use the cylinder shape, queues a distinct shape.
- Group related nodes inside a frame/boundary rectangle when `groups` are present.
- No crossing edges where avoidable; use orthogonal connectors with directional arrows.
- Every node and edge carries a short text label. Keep font sizes consistent.
- Apply a coherent preset: `technical-docs` for internal docs, `dark-architecture` for
  infra-heavy systems, `portfolio-polished` for external sharing.

## Logic rules
- Map service `type` -> shape/logo; map `tech` -> a specific logo via library lookup.
- Render every `edge` exactly once as a directed connector from `from` to `from`'s target.
- Preserve the analysis hierarchy: layers become rows/columns, boundaries become frames.
- Deduplicate: a single datastore referenced by many services is one node with multiple edges.
- Do not add components, integrations, or labels absent from the analysis.

## Recommended libraries
Search and cache before adding items:
- **Software Architecture** — boxes, layers, datastore and queue shapes.
- **Technology Logos** — framework/language/runtime logos (React, Node, Postgres, etc.).
- **IT Logos** — infrastructure, cloud, and networking icons.
Flow: `search_libraries` -> `inspect_library` -> `cache_library` ->
`add_library_items_normalized` (preferred for consistent sizing/placement).

## Mandatory validation
Quality flow is required before any final save. Run in order:
1. `lint_drawing` — fix structural/label issues it reports.
2. `score_drawing` — obtain a 0-100 score.
3. If score < 95: `repair_drawing` and/or `auto_polish_drawing`, then re-run `score_drawing`.
   Loop until the score is **>= 95**.
4. `auto_polish_drawing` MUST be run before the final save, even once 95 is reached.
5. Only then `save_drawing` (final). Use `save_drawing` with `asDraft: true` for intermediate
   work below 95; final saves below 95 are not permitted. Optionally `save_version` and
   `get_drawing_url` / `export_drawing` (excalidraw or svg; png may fall back).

## Minimal examples
Generate the diagram from the analysis:
```json
{
  "tool": "create_from_repo_analysis",
  "arguments": {
    "name": "OrderService",
    "preset": "technical-docs",
    "analysis": {
      "services": [
        { "id": "web", "label": "Web App", "type": "frontend", "tech": "react" },
        { "id": "api", "label": "API", "type": "backend", "tech": "node" },
        { "id": "db", "label": "Orders DB", "type": "database", "tech": "postgres" }
      ],
      "edges": [
        { "from": "web", "to": "api", "label": "HTTPS" },
        { "from": "api", "to": "db", "label": "reads/writes" }
      ]
    }
  }
}
```
Validate, polish, then save:
```json
{ "tool": "score_drawing", "arguments": { "drawingId": "ORDER-SVC" } }
```
```json
{ "tool": "auto_polish_drawing", "arguments": { "drawingId": "ORDER-SVC" } }
```
```json
{ "tool": "save_drawing", "arguments": { "drawingId": "ORDER-SVC", "asDraft": false } }
```
