# MCP Architecture Diagrams (skill)

## Objective
Produce a clear MCP server architecture diagram that explicitly separates the
three core planes: **transport**, **auth**, and **storage**. The diagram must
show MCP tools as discrete capabilities exposed by the server and trace how a
client request flows from transport through auth into tool execution and storage.

## When to use
Use this skill whenever the request is to diagram an MCP server, its tool
surface, or the internal architecture of an MCP-based system (e.g. "diagram my
MCP server", "show the tools and how they reach the database", "MCP transport +
auth layout"). Do not use it for generic app diagrams that have no MCP server.

## Expected input
- A description of the MCP server: tool names/groups and what they do.
- Transport mode(s): stdio, HTTP/SSE, or streamable HTTP.
- Auth mechanism: API key, OAuth, bearer token, or none.
- Storage backends: Postgres, object store, cache, external APIs.
- Optional: visual preset (default `dark-architecture` or `technical-docs`).

If transport, auth, or storage are unspecified, pick sensible defaults and
label them as assumptions rather than omitting the plane.

## Visual rules
- Lay out left-to-right: **Client -> Transport -> MCP Server (Tools) -> Storage**,
  with **Auth** as a distinct gate between transport and tool dispatch.
- Use three visually separated zones (containers/frames), one per plane, so
  transport, auth, and storage are never blended into a single box.
- Represent each MCP tool (or tool group) as its own node inside the server zone.
- Arrows are directional and labeled with the protocol/payload (e.g. `JSON-RPC`,
  `tool call`, `SQL`, `signed request`).
- Prefer a single preset for the whole drawing; default `dark-architecture` for
  servers, `technical-docs` for documentation hand-off.
- Keep nodes aligned to a grid; avoid crossing arrows where reordering fixes it.

## Logic rules
- Auth must sit on the request path: every client-originated arrow reaches a tool
  only after passing the auth node. Never draw a client arrow directly to storage.
- Storage is owned by tools, not clients: only the MCP server (or its tools)
  connects to storage backends.
- Distinguish transport types if more than one exists (separate edges/labels).
- Group related tools; do not draw 25 unconnected boxes. Cluster by concern
  (generation, validation, library, persistence).
- External services (third-party APIs) belong in the storage/integration plane,
  reached only via tools.

## Recommended libraries
- **Software Architecture** — server, gateway, queue, datastore, and boundary
  primitives for the three planes.
- **Technology Logos** — concrete backend marks (Postgres, Redis, OAuth, HTTP)
  to make transport/auth/storage instantly recognizable.

Discover and load them before adding items:
```json
{ "tool": "search_libraries", "arguments": { "query": "software architecture" } }
```
Then `inspect_library`, `cache_library`, and `add_library_items_normalized`.

## Mandatory validation
Run the quality flow in order and do not skip steps:
1. `lint_drawing` — fix structural/style violations.
2. `score_drawing` — must return **>= 95**.
3. If below 95, run `repair_drawing` then `auto_polish_drawing` and re-score.
4. Always run `auto_polish_drawing` before treating the diagram as final.
5. Only then `save_drawing` as final. **Never save a final diagram scoring < 95**
   (use `asDraft: true` only for intentional work-in-progress saves).

Saving below 95 without `asDraft` is rejected by the server — re-loop instead.

## Minimal examples
Generate the base diagram from a prompt:
```json
{
  "tool": "create_diagram_from_prompt",
  "arguments": {
    "prompt": "MCP server with stdio + HTTP transport, OAuth + API-key auth gate, and 4 tool groups writing to Postgres and Redis",
    "preset": "dark-architecture"
  }
}
```

Validate and gate before saving:
```json
{ "tool": "score_drawing", "arguments": { "drawingId": "mcp-arch-01" } }
```
```json
{ "tool": "auto_polish_drawing", "arguments": { "drawingId": "mcp-arch-01", "targetScore": 95 } }
```

Persist the final, passing diagram:
```json
{ "tool": "save_drawing", "arguments": { "drawingId": "mcp-arch-01", "asDraft": false } }
```
