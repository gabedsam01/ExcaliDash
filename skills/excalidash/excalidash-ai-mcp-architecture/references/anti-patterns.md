# Anti-patterns — AI & MCP Architecture

Each entry is a real failure mode the lint/score engine catches, or a skill-specific
modeling mistake, with the fix. Target stays: **score >= 95, hardBlockers == []**.

## Geometry / scoring blockers

### ARROW_TEXT_INTERSECTION — request line over an edge label
The `Host -> Transport -> Auth -> Registry -> Services -> Storage` chain is long and
left-to-right, so a single arrow easily crosses the next card's label.
**Fix**: bind endpoints to card sides (right anchor out, left anchor in), route through
the >= 32px lane gutter, and park each edge label in the side lane, not under the line.

### FRAME_TITLE_OVERLAP — a node pushed into the boundary-frame title band
The trust-boundary frame ("ExcaliDash MCP Server") reserves its top 40px for the title;
dropping the Auth card flush to the frame top collides with it.
**Fix**: start server-side content below the 40px title band + 16px inset; enlarge the
frame rather than nudging the title.

### ITEM_OUTSIDE_FRAME — server node clipped by the boundary, or LLM wrongly inside
Two directions: a service card extends past the boundary frame (clipped), OR the LLM/host
gets dropped INSIDE the boundary because it was nearer the other cards.
**Fix**: resize the frame so every server-side node (auth, registry, services, storage)
sits fully inside its inner bounds; keep the host and LLM fully OUTSIDE, not half-clipped.

### HIGH_DENSITY — the 25-tool registry drawn as 25 cells
Listing all 25 tools as individual boxes crushes the lane and trips HIGH_DENSITY.
**Fix**: summarize the registry as five group rows — Core 9 / Libraries 5 / Quality 4 /
Architecture 4 / Templates 3 — inside one registry card; keep card gaps >= 48px.

### SMALL_FONT — group counts shrunk to fit the registry card
Squeezing "Core 9, Libraries 5, Quality 4, Architecture 4, Templates 3" into a small card
drops text below 16px.
**Fix**: widen the registry card and relayout so every row renders >= 16px with 16px padding.

### TEXT_NEAR_EDGE — storage card flush to the canvas edge
The far-right storage lane often ends up against the export bound.
**Fix**: keep all content >= 40px from canvas/export bounds; shift the whole composition
inward or widen the canvas.

## Skill-specific modeling mistakes

### LLM drawn inside the server trust boundary
The model that drives the host is a client-side concern. Putting it inside the server
boundary implies the server hosts the LLM and misstates the trust model.
**Fix**: place the LLM in the client lane, OUTSIDE the boundary frame, with a lighter fill;
the host (not the server) talks to it.

### Auth collapsed into the transport node
"Transport" and "Auth" merged into one box hides the bearer gate — exactly the boundary
this skill exists to show.
**Fix**: keep transport (`/mcp` JSON-RPC) and auth (Bearer `exd_`) as two distinct nodes;
label the edge between them "verifies Bearer exd_ key".

### Client reaching storage directly
An arrow from Host/Transport straight to PostgreSQL skips the registry and services and
implies the database is publicly reachable.
**Fix**: route every storage access through a service; storage has no inbound edge from
the client lane. `validate_architecture` should confirm this.

### Tools talking to the LLM from inside the server
Drawing a tool/service calling the LLM puts the model on the wrong side of the boundary
again and invites a transcript-leak path.
**Fix**: the LLM is invoked by the host; the server's tools are deterministic. No
service -> LLM edge.

### A raw bearer key or db URL printed on a node/edge
`Bearer exd_live_<entropy>` or `postgres://exd:<password>@db/excalidash` on a label leaks a
secret into the drawing, the export, and the transcript.
**Fix**: redact on input — `Bearer exd_[REDACTED_API_KEY]`,
`postgres://exd:[REDACTED_DATABASE_URL]@db:5432/excalidash` — and re-scan the export.

### Inventing tools or arguments
Adding a tool name outside the 25 real tools, or passing `apply_architecture_skill`
a `skill:`/`level:` arg, breaks agreement with the MCP server.
**Fix**: use only the 25 real tools; `apply_architecture_skill` takes `pattern: "mcp"`
(no `skill`, no `level`).

### Wrong skill for the shape
Drawing ingest -> embed -> vector store -> LLM here instead of the boundary view.
**Fix**: that is a pipeline — delegate to the **LLM & RAG Pipeline** skill
(`excalidash_llm_rag_pipeline`). This skill draws the server boundary, not the model data path.

### Saving before the quality loop closes
Calling `save_drawing` while a blocker is open or the score is < 95.
**Fix**: lint -> score -> repair until `score >= 95` and `hardBlockers == []`, then polish,
then validate, then save and `save_version`.

See `../_shared/references/geometry-rules.md`, `../_shared/references/architecture-patterns.md`,
and `../_shared/references/security-redaction.md`; every blocker above is enforced by
`lint_drawing` / `score_drawing`.
