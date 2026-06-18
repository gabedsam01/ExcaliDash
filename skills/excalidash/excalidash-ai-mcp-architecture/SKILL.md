---
name: excalidash-ai-mcp-architecture
description: Use when you need to model an MCP server or AI tool/agent architecture — client on the edge, then SEPARATE transport (/mcp JSON-RPC), bearer (exd_) auth, tool registry, drawing/quality services and storage — with the LLM kept OUTSIDE the server trust boundary.
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__apply_architecture_skill
  - mcp__excalidash__create_diagram_from_prompt
  - mcp__excalidash__create_from_repo_analysis
  - mcp__excalidash__validate_architecture
  - mcp__excalidash__suggest_architecture_improvements
  - mcp__excalidash__search_libraries
  - mcp__excalidash__inspect_library
  - mcp__excalidash__cache_library
  - mcp__excalidash__add_library_items_normalized
  - mcp__excalidash__lint_drawing
  - mcp__excalidash__score_drawing
  - mcp__excalidash__repair_drawing
  - mcp__excalidash__auto_polish_drawing
  - mcp__excalidash__save_drawing
  - mcp__excalidash__save_version
  - mcp__excalidash__get_drawing_url
  - mcp__excalidash__export_drawing
---

# AI & MCP Architecture

## Objective
Produce an architecture diagram of an MCP server (or an AI tool/agent service in that
shape): a host/client on the edge, then DISTINCT nodes for the transport (`/mcp`
JSON-RPC), bearer (`exd_`) authentication, the tool registry, the drawing and quality
services, and the backing storage — PostgreSQL plus the curated library cache. The LLM
that drives the client stays OUTSIDE the server trust boundary; the diagram makes the
transport / auth / registry / services / storage separation explicit so security and
responsibility boundaries are obvious at a glance. The result must score >= 95 with zero
hard blockers.

## When to use / When NOT to use
**Use when**: the request is "draw our MCP server", "show the AI tool architecture",
"model the host -> transport -> auth -> tools -> storage path", "where does the LLM sit
relative to the server", or "make the bearer / tool-registry / storage boundaries
explicit". Use the `mcp` pattern: client lane, transport gutter, server lane (auth +
registry + services), backend lane (storage + libraries).

**Use when** the system is genuinely MCP-shaped — a server that exposes
tools/resources/prompts over a transport to a host that embeds an LLM.

**Do NOT use when**:
- The request is the data path of a model call — ingest -> embed -> vector store ->
  retrieve -> LLM -> response -> delegate to the **LLM & RAG Pipeline** skill
  (`excalidash_llm_rag_pipeline`); that is a pipeline, not a server boundary view.
- The request is a generic multi-service backend with no MCP/tool-registry/transport
  shape -> use the **Microservices** or **Modular Monolith** architecture skill.
- The request is "all the runnable containers inside one system" with no MCP framing ->
  use the **C4 Container** skill (`excalidash-c4-container`).
- The request is the deploy/CI topology that ships this server -> use the **DevOps &
  Cloud Deployment** skill.
- The request is purely a trust-boundary/threat view -> use the **security** skill; this
  skill draws the architecture and marks the one server trust boundary, not a full threat
  model.

## Expected input
A short description of the MCP server (or AI tool service), ideally naming:
- **Client/host** — the agent or app on the edge (Claude Code, an IDE, a custom host) and
  the **LLM** it embeds (kept outside the server boundary).
- **Transport** — how the host reaches the server (`/mcp` JSON-RPC over HTTPS; stdio).
- **Auth** — the credential gate (bearer `exd_` API key; how keys are minted/verified).
- **Tool registry** — the set of exposed tools (here: the 25 ExcaliDash tools, grouped
  Core / Libraries / Quality / Architecture / Templates).
- **Services** — what the tools call (drawing service, quality/lint+score service,
  architecture service, template service).
- **Storage** — PostgreSQL (drawings, versions, API keys) and the curated library cache.
A repository analysis object (`{ modules, entrypoints, database, services, integrations }`)
may be supplied instead — feed it straight to `create_from_repo_analysis`. Redact every
secret BEFORE it reaches a tool argument.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, the scoring rubric.
2. `mcp__excalidash__search_libraries` -> `inspect_library` -> `cache_library` — vet
   server/service/gateway, store, and vendor icons from the curated packs.
3. ONE create path:
   - `mcp__excalidash__apply_architecture_skill` with `pattern: "mcp"` (preferred — gives
     the client lane, transport gutter, server lane and backend lane skeleton), OR
   - `mcp__excalidash__create_from_repo_analysis` with an `analysis` object when the
     server's modules/entrypoints/db/services are known, OR
   - `mcp__excalidash__create_diagram_from_prompt` with an explicit `structure:{nodes,edges}`.
4. `mcp__excalidash__add_library_items_normalized` — place server/service/store/logo icons
   in reserved slots.
5. `mcp__excalidash__lint_drawing` -> `score_drawing` -> `repair_drawing` (loop).
6. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
7. `mcp__excalidash__validate_architecture` — confirm transport/auth/storage separation and
   that the LLM is outside the server boundary.
8. `mcp__excalidash__suggest_architecture_improvements` — optional hardening hints.
9. `mcp__excalidash__save_drawing` -> `save_version` -> `get_drawing_url` -> `export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `PATTERN=mcp PRESET=dark-architecture LIBRARY=curated[Software Architecture, Technology Logos, Cloud/DevOps]
   VALIDATORS=lint,score,repair,validate_architecture`. Confirm four lanes — **client**
   (host + LLM, on the edge), **transport** (`/mcp` JSON-RPC), **server** (auth -> registry
   -> services), **backend** (PostgreSQL + library cache) — and one labeled edge per hop.
   Redact any secret in the input (see below) BEFORE it reaches a tool argument.
2. **Generate (one path only).**
   - Prefer `apply_architecture_skill({ pattern: "mcp", preset: "dark-architecture",
     title: "<Server> — MCP Architecture", save: false })` so the client/transport/server/
     backend lanes and the trust-boundary frame come from the skeleton. Capture the drawing id.
   - When a repo analysis is supplied, use `create_from_repo_analysis({ analysis, preset:
     "dark-architecture" })` so modules/entrypoints/database/services/integrations map onto
     the lanes.
   - Fallback: `create_diagram_from_prompt({ structure: { nodes, edges }, diagramType:
     "architecture", direction: "LR", preset: "dark-architecture" })` with explicit nodes
     for host, LLM (outside boundary), transport, auth, registry, each service, PostgreSQL,
     library cache.
   - Layout intent: the **host/client + LLM** sit on the LEFT, OUTSIDE the server
     trust-boundary frame; the **transport** node is the only thing the host talks to; INSIDE
     the boundary, **auth** is the first gate, then the **tool registry**, then the
     **services**, then **storage** at the far right. Reserve >= 32px arrow gutters between
     lanes so the request line never crosses a node or label.
3. **Place icons.** `add_library_items_normalized` — a server/gateway glyph
   (`inside-card-top`) on the transport and registry cards, a service glyph on each service
   card, a database-symbol on PostgreSQL, a cache glyph on the library cache, and vendor
   logos (`badge`/`cloud-provider`) only where they reinforce meaning. Keep the LLM card
   visually distinct (lighter fill, outside the boundary). Simulate the score after each add
   and reject any icon that introduces HIGH_DENSITY or lands in an arrow lane.
4. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty.
5. **Score.** `score_drawing`; record the number and every penalty.
6. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint and
   re-score. Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a repair
   pass lowers the score, restore the last `save_version` checkpoint and apply a smaller fix
   instead.
7. **Polish.** Only after blockers clear, run `auto_polish_drawing`; re-score to confirm no
   regression (roll back if it drops below the checkpoint).
8. **Validate.** `validate_architecture` — transport, auth and storage are three distinct
   nodes (no collapsing auth into transport); the bearer/API-key gate is explicit; the
   external client/host AND the LLM are OUTSIDE the trust-boundary frame; storage is reached
   only via a service, never directly by the client. Optionally
   `suggest_architecture_improvements` for hardening hints (rate limit, audit, key rotation).
9. **Save.** `save_drawing` with a clear title (`"<Server> — MCP Architecture"`), then
   `save_version` to checkpoint the accepted state.
10. **Export.** `get_drawing_url` for a link, then `export_drawing` (svg/png/excalidraw);
    re-scan the export for secrets as a backstop (bearer tokens and db URLs are the common
    leaks here).

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only; draw the four lane bands, the trust-boundary frame, the
  transport/auth/registry/service cards and the cylinder store by hand; no icon calls.
- **curated** (default) — pull only from **Software Architecture** (services, gateways,
  queues, layers — use for transport, auth gateway, registry, services), **Technology
  Logos** (PostgreSQL, JSON-RPC/protocol, host/client vendor marks), and **Cloud/DevOps**
  (container/runtime, cache) glyphs. Do not mix a second visual style into the
  dark-architecture preset.
- **required** — PostgreSQL MUST use a database-symbol, the transport/auth/registry/service
  cards MUST carry their server/service glyphs, and any branded host/vendor node MUST use
  its logo; a primitive where a curated icon exists is a violation.

Workflow: `search_libraries({ q, mode: "curated", category })` -> `inspect_library`
(aspect, stroke, fill, complexity) -> `cache_library` -> `add_library_items_normalized`.
Icon slots: `inside-card-top` for server/service glyphs (32x32), `database-symbol` for
PostgreSQL, `cloud-provider`/`badge` for vendor/runtime logos, `legend` for the keyed
swatches (client / transport / auth / registry / service / store). Normalize scale,
preserve aspect, match the preset's stroke and fill. **Reject any icon that introduces
HIGH_DENSITY or collides with an arrow lane** — drop it and use a primitive. Record used
and rejected items.

## Validation & score
- `hardBlockers` must be empty: no `ARROW_TEXT_INTERSECTION` (the request/response edges
  never sit under a routed line), no `FRAME_TITLE_OVERLAP` (the trust-boundary frame title
  and the legend header stay title-only), no `ITEM_OUTSIDE_FRAME` (every server-side node
  fully inside the boundary frame; the host and the LLM intentionally outside it, not
  half-clipped).
- No `SMALL_FONT`: every label, including the tool-group counts and edge labels, renders
  >= 16px.
- No `HIGH_DENSITY`: keep card gaps >= 48px, lane gutters >= 32px; if the 25-tool registry
  card crowds the lane, summarize it as five group rows (Core 9 / Libraries 5 / Quality 4 /
  Architecture 4 / Templates 3) rather than listing 25 cells.
- No `TEXT_NEAR_EDGE`: all content kept >= 40px from canvas/export bounds.
- `validate_architecture` clean: transport, auth and storage are distinct; the bearer gate
  is explicit; client and LLM outside the boundary; storage reached only through a service.
- **Minimum score 95.** Repair is mandatory below 95 or with any blocker; roll back any
  pass that lowers the score.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. MCP architecture diagrams are
secret-prone because the auth node carries bearer keys and the storage node carries a
connection string. Redact BEFORE any tool call and re-scan the export. Show the *concept*
of a credential, never the value:
- A bearer key `exd_live_<entropy>` becomes `Bearer exd_[REDACTED_API_KEY]` on the auth edge.
- A Postgres URL `postgres://exd:<password>@db:5432/excalidash` becomes
  `postgres://exd:[REDACTED_DATABASE_URL]@db:5432/excalidash`.
- A service-role / signing value becomes `[REDACTED_SERVICE_ROLE]` / `[REDACTED_JWT_SECRET]`.
Label the auth edge "verifies Bearer exd_ key", draw a key icon — do not print the key.
Never echo a detected secret back to the user, and treat the transcript itself as a leak
surface: a pasted `.env` or header is redacted on input, not just on export.

## Internal prompts
- **Plan prompt**: `"Plan the MCP architecture for <SERVER>. List four lanes — client (host
  + LLM, outside the boundary), transport (/mcp JSON-RPC), server (auth -> registry ->
  services), backend (PostgreSQL + library cache) — and the labeled edge for each hop before
  drawing."`
- **Structure prompt** (fallback create path): `"Architecture diagram, pattern MCP, direction
  LR. Outside boundary: 'Host (Claude Code)', 'LLM'. Boundary 'ExcaliDash MCP Server':
  'Transport /mcp JSON-RPC' -> 'Auth (Bearer exd_)' -> 'Tool Registry (25 tools: Core 9,
  Libraries 5, Quality 4, Architecture 4, Templates 3)' -> services 'Drawing Service',
  'Quality Service (lint/score/repair)', 'Architecture Service', 'Template Service'. Backend:
  'PostgreSQL (drawings, versions, api_keys)', 'Curated Library Cache'. Edges: Host calls
  Transport over HTTPS; Transport verifies Auth; Auth admits Registry; Registry dispatches to
  each Service; Services read/write PostgreSQL; Library tools read the Library Cache. LLM is
  outside the boundary."`
- **Repair nudge**: `"ARROW_TEXT_INTERSECTION on the 'Auth admits Registry' edge -> route the
  line through the lane gutter and move the label into the side lane with 32px clearance; keep
  the Auth and Registry cards fixed inside the boundary frame."`
- **Boundary check**: `"Confirm the Host and the LLM are both OUTSIDE the trust-boundary
  frame, that storage is reached only through a service, and that transport / auth / storage
  are three distinct nodes before saving."`

## Example prompts for Claude Code
- "Draw the architecture of our ExcaliDash MCP server — transport, bearer auth, the tool
  registry and Postgres storage as separate nodes, and keep the LLM outside the boundary."
- "Diagram an MCP server: host on the edge, `/mcp` JSON-RPC transport, `exd_` bearer auth,
  25 tools in a registry, drawing + quality services, PostgreSQL."
- "I have a repo analysis JSON for our AI tool server — turn it into an MCP architecture
  diagram with the trust boundary marked."
- "Show where the LLM sits relative to our MCP server and make the auth and storage
  separation explicit."
- "Make an architecture view of our AI tool service and tell me how to harden the auth and
  storage boundaries."

## Acceptance criteria
- [ ] Four lanes present: client (host + LLM), transport, server (auth -> registry ->
      services), backend (storage + library cache).
- [ ] Transport, auth and storage are three DISTINCT nodes (auth not collapsed into transport).
- [ ] The bearer / API-key (`exd_`) gate is an explicit node/edge.
- [ ] The external host AND the LLM are OUTSIDE the trust-boundary frame.
- [ ] Storage is reached only through a service, never directly by the client.
- [ ] The 25-tool registry is summarized as five group rows, not 25 crowded cells.
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`); no `FRAME_TITLE_OVERLAP`.
- [ ] Diagram title, boundary-frame title and legend header do not overlap each other or a node.
- [ ] Libraries used per policy when relevant (database-symbol for Postgres, server/service
      glyphs, logos; normalized), without breaking the preset.
- [ ] `validate_architecture` clean: separation confirmed, LLM outside the boundary.
- [ ] No secrets leaked in drawing, response, or export (bearer keys / db URLs redacted).

## Examples
See `./references/examples.md` for full request -> plan -> ordered tool calls with realistic
arguments, plus `./references/checklist.md` and `./references/anti-patterns.md`. Shared rules
live in `../_shared/references/architecture-patterns.md`,
`../_shared/references/library-policy.md`, `../_shared/references/security-redaction.md`,
`../_shared/references/geometry-rules.md`, and `../_shared/references/mcp-tool-cheatsheet.md`.
