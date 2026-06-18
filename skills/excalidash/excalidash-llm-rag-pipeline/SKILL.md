---
name: excalidash-llm-rag-pipeline
description: Use when you need a retrieval-augmented-generation / LLM data-flow diagram — ingest → chunk → embed → vector store → retrieve → context assembly → prompt → LLM → post-process/eval — with the async index path distinguished from the live query path and explicit cache-hit, retrieval-miss fallback and guardrail/error branches.
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__create_diagram_from_prompt
  - mcp__excalidash__search_libraries
  - mcp__excalidash__inspect_library
  - mcp__excalidash__cache_library
  - mcp__excalidash__add_library_items_normalized
  - mcp__excalidash__lint_drawing
  - mcp__excalidash__score_drawing
  - mcp__excalidash__repair_drawing
  - mcp__excalidash__auto_polish_drawing
  - mcp__excalidash__validate_architecture
  - mcp__excalidash__save_drawing
  - mcp__excalidash__save_version
  - mcp__excalidash__get_drawing_url
  - mcp__excalidash__export_drawing
---

# LLM & RAG Pipeline

## Objective
Produce a clear data-flow / flowchart of a retrieval-augmented-generation system that shows
TWO distinct flows in one canvas: the **async index path** (ingest → chunk → embed → upsert into
the vector store) drawn with **dashed** connectors, and the **live query path** (query → embed →
retrieve → context assembly → prompt template → LLM → post-process / eval → response) drawn with
**solid** connectors. The diagram must also make the non-happy branches first-class: a **cache hit**
short-circuit (semantic/response cache → response), a **retrieval-miss fallback** (low recall or empty
top-k → keyword/BM25 or "no-context, refuse/clarify" path), and a **guardrail/error path** (PII/jailbreak
filter, token-budget overflow, provider timeout → safe fallback). Every step reads as a verb, the vector
store is drawn as a data store, and ownership lanes are used only when they clarify. The result must
score >= 95 with zero hard blockers.

## When to use / When NOT to use
**Use when**: the request is "draw our RAG pipeline", "diagram the LLM retrieval flow",
"show ingest → embeddings → vector DB → retrieval → LLM", "map the index path vs the query path",
"where does caching / the fallback / the guardrail sit in our RAG", or "document the eval/post-process
stage after the model call".

**Do NOT use when**:
- The request is the broader MCP server / AI tool-architecture (transport, auth, tool registry,
  storage as architecture boundaries) -> use the **AI & MCP Architecture** skill
  (`apply_architecture_skill({ pattern: "mcp" })`), not a data-flow.
- The request is logs/metrics/traces telemetry -> use the **Observability Flow** skill.
- The request is a time-ordered message exchange between services -> use a sequence diagram.
- The request is a generic CI/CD or cloud deployment topology -> use the **DevOps & Cloud Deployment** skill.
- The request is a layered software architecture with layer-dependency rules -> use a Clean/Hexagonal
  architecture skill and `validate_architecture`.

## Expected input
A short description of the RAG system, ideally naming:
- **Sources** to ingest (docs, PDFs, web pages, tables, a warehouse).
- **Index-path stages** — loader/parser, chunker (size/overlap), embedding model, vector store
  (e.g. pgvector, Pinecone, Weaviate, FAISS) and any metadata/keyword index.
- **Query-path stages** — query embed, retriever (top-k, hybrid/rerank), context assembler, prompt
  template, the LLM (provider/model), and the post-process/eval step (citations, grounding check, scoring).
- **Branches** — what triggers a cache hit, what counts as a retrieval miss, and which guardrails run
  (input filter, output filter, token-budget guard, timeout).
Any secret (provider key, vector-DB URL, bearer) must be pre-redacted; if a stage is unnamed, infer the
obvious one and state the assumption.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, the scoring rubric.
2. `mcp__excalidash__search_libraries` -> `inspect_library` -> `cache_library` — vet process / decision /
   data-store glyphs and provider logos from the curated packs.
3. `mcp__excalidash__create_diagram_from_prompt` — the single create path; pass a `structure` of
   `{ nodes, edges }` (or a `prompt`) with `diagramType: "flowchart"` and `direction: "LR"`.
4. `mcp__excalidash__add_library_items_normalized` — place stage and provider icons into reserved slots.
5. `mcp__excalidash__lint_drawing` -> `score_drawing` -> `repair_drawing` (loop; repair mandatory).
6. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
7. `mcp__excalidash__validate_architecture` — confirm the flow has no orphan stage and both paths reach a terminal.
8. `mcp__excalidash__save_drawing` -> `save_version` -> `get_drawing_url` -> `export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=flowchart DIR=LR PRESET=technical-docs LIBRARY=curated[Flow Chart Symbols, Technology Logos, Data Flow]
   PATHS=index(dashed),query(solid) BRANCHES=cache-hit,retrieval-miss,guardrail/error
   VALIDATORS=lint,score,repair,validate_architecture`. List the index-path nodes and the query-path nodes,
   then list each branch with its trigger and its terminal. Redact any secret in the input BEFORE it reaches
   a tool argument.
2. **Generate (one path only).** Call `create_diagram_from_prompt` ONCE with an explicit
   `structure: { nodes, edges }`, `diagramType: "flowchart"`, `direction: "LR"`. Model the index path as a
   top band of process nodes feeding the vector store; model the query path as a parallel band beneath it
   sharing the embedding step and the vector store. Mark each index-path edge as dashed and each query-path
   edge as solid. Add decision nodes for `cache?`, `retrieved context?` and `guardrail pass?`; route each
   "no" branch to its fallback/terminal. Capture the returned `id`.
3. **Place icons.** `add_library_items_normalized` — a process glyph (`inside-card-top`) per stage, a
   `database-symbol` for the vector store and any keyword index, a decision diamond glyph for each branch
   point, and provider logos (`badge`/`inside-card-left`) for branded nodes (the embedding model, the LLM
   provider, the vector DB). Keep every icon out of the arrow lanes.
4. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty.
5. **Score.** `score_drawing`; record the number and each penalty.
6. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint and re-score. Loop
   until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a repair pass lowers the score, restore the
   last `save_version` checkpoint and apply a smaller, targeted fix.
7. **Polish.** Only after blockers clear, run `auto_polish_drawing`; re-score to confirm no regression
   (rollback if it drops below the checkpoint).
8. **Validate.** `validate_architecture` — every stage is reachable, no orphan node, the index path
   terminates at the vector store, the query path and every branch (cache hit, retrieval miss, guardrail
   fail) reaches a terminal (response or safe fallback), and no edge dangles.
9. **Save.** `save_drawing` with a clear title (`"<System> — RAG Pipeline"`), then `save_version` to
   checkpoint the accepted state.
10. **Export.** `get_drawing_url` for a link, then `export_drawing` (svg/png/excalidraw); re-scan the export
    for secrets as a backstop (vector-DB URLs and provider keys are the common leaks here).

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only: draw process rectangles, decision diamonds, the vector-store cylinder and
  parallel-line data flows by hand; no icon calls.
- **curated** (default) — pull only from **Flow Chart Symbols** (start/end terminals, process boxes,
  decision diamonds, IO parallelograms), **Data Flow** (external entity, process, data store, flow), and
  **Technology Logos** (embedding-model / LLM-provider / vector-DB vendor logos). A logo where a generic
  glyph reads better is optional; a generic glyph where a logo would clarify a branded node is fine too.
- **required** — the vector store MUST use a `database-symbol`, every decision branch MUST use a decision
  glyph, and every branded provider node (embedding model, LLM, vector DB) MUST use its logo; a primitive
  where a curated icon exists is a violation.

Workflow: `search_libraries({ q, mode: "curated", category })` -> `inspect_library({ libraryId })`
(aspect, stroke, fill, complexity) -> `cache_library` -> `add_library_items_normalized({ libraryId, itemNames,
position, slotSize, placement })`. Icon slots: `inside-card-top` for stage glyphs (32x32), `database-symbol`
for the vector/keyword store, `badge`/`inside-card-left` for provider logos, `legend` for the keyed swatches
(index path / query path / cache / fallback / guardrail). Normalize scale, preserve aspect, match the
technical-docs preset stroke and fill. **Reject any icon that introduces HIGH_DENSITY or collides with an
arrow lane** — drop it and use a primitive. Record used and rejected items.

## Validation & score
- `hardBlockers` must be empty: no `ARROW_TEXT_INTERSECTION` (a flow label never sits under a routed edge,
  most at risk where the index and query bands cross near the shared embed/vector-store nodes), no
  `FRAME_TITLE_OVERLAP` (any lane/zone frame title and the legend header stay title-only), no
  `ITEM_OUTSIDE_FRAME` (every node fully inside its lane/zone frame).
- Penalties to drive to zero: `SMALL_FONT` (every stage and branch label >= 16px), `HIGH_DENSITY` (keep
  card gaps >= 48px, arrow lanes >= 32px — RAG pipelines crowd fast around the retriever), `TEXT_NEAR_EDGE`
  (keep all content >= 40px from the canvas/export bounds).
- Dashed vs solid is preserved: index-path edges dashed, query-path edges solid, and the legend keys both.
- `validate_architecture` clean: no orphan stage; both paths and all three branches reach a terminal.
- **Minimum score 95 with empty hardBlockers.** Repair is mandatory below 95 or with any blocker; rollback
  any pass that lowers the score.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. RAG diagrams leak through vector-DB connection
strings, provider keys, and bearer headers on the LLM call. Redact BEFORE any tool call and re-scan the
export: a `postgres://app:<password>@pg/vec` vector-store label becomes
`postgres://app:[REDACTED_DATABASE_URL]@pg/vec`; the embedding/LLM provider key becomes `[REDACTED_API_KEY]`
or `[REDACTED_PROVIDER_KEY]`; an `Authorization: Bearer …` header becomes `Authorization: Bearer
[REDACTED_BEARER]`; an inbound ingestion webhook secret becomes `[REDACTED_WEBHOOK_SECRET]`. Show the
*concept* (a key icon, an edge labeled "auth via bearer") not the value. Note the transcript-leak risk:
prompts and retrieved context can themselves carry secrets — label the prompt-assembly node "redact
context before send", never paste a real prompt with embedded credentials. Never echo a detected secret
back to the user.

## Internal prompts
- **Pipeline structure prompt**: `"Flowchart (LR) of the <SYSTEM> RAG pipeline. INDEX PATH (dashed):
  Sources -> Loader/Parser -> Chunker -> Embedding Model -> Vector Store. QUERY PATH (solid): User Query ->
  Embedding Model -> [cache?] -> Retriever (top-k) -> [retrieved context?] -> Context Assembly -> Prompt
  Template -> [guardrail pass?] -> LLM -> Post-process/Eval -> Response. Branches: cache? yes -> Response;
  retrieved context? no -> Keyword/BM25 fallback -> Context Assembly (and if still empty -> Refuse/Clarify);
  guardrail pass? no -> Safe Fallback. Vector Store is a data store. Legend: index / query / cache /
  fallback / guardrail."`
- **Branch nudge**: `"Add the retrieval-miss fallback: from [retrieved context?] route the 'no' edge to a
  'Keyword/BM25 fallback' process, then back into Context Assembly; if that is also empty, route to a
  'Refuse / ask to clarify' terminal. Keep these edges solid; do not cross the index band."`
- **Repair nudge**: `"ARROW_TEXT_INTERSECTION where the query path rejoins the shared Vector Store -> route
  the retrieve edge through the 32px lane below the index band and move its 'top-k' label into the side
  gutter; keep the Vector Store node fixed."`
- **Score nudge**: `"score_drawing < 95: list each penalty (HIGH_DENSITY near the retriever, any SMALL_FONT
  on branch labels), apply the repairPlan one fix at a time, re-score, and stop at >= 95 with hardBlockers []."`

## Example prompts for Claude Code
- "Diagram our RAG pipeline: ingest PDFs, chunk, embed with a provider model, store in pgvector, then
  retrieve top-k and answer with the LLM — show the index path separate from the query path."
- "Draw the LLM retrieval flow and make the caching and the retrieval-miss fallback explicit."
- "Map our RAG with a semantic cache hit, a BM25 fallback when recall is low, and a guardrail/error branch."
- "Show ingest → chunk → embeddings → vector store → retrieval → context assembly → prompt → LLM →
  post-process/eval, dashed for async indexing."
- "Document where PII filtering and the token-budget guard sit in our RAG query path."

## Acceptance criteria
- [ ] Index path and query path are both present and visually distinct (dashed index, solid query).
- [ ] The vector store is drawn as a data store; any keyword index is too.
- [ ] Cache-hit short-circuit, retrieval-miss fallback, and guardrail/error branch are all drawn and each
      reaches a terminal.
- [ ] Every stage label reads as a clear verb/noun; every branch point is a decision glyph.
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`); no `FRAME_TITLE_OVERLAP`; no
      `ITEM_OUTSIDE_FRAME`.
- [ ] No `SMALL_FONT`, `HIGH_DENSITY`, or `TEXT_NEAR_EDGE` penalties remain.
- [ ] Libraries used per policy when relevant (database-symbol for the vector store, decision glyphs,
      provider logos; normalized).
- [ ] `validate_architecture` clean: no orphan stage; both paths and all branches terminate.
- [ ] No secrets leaked in drawing, response, or export (vector-DB URLs / provider keys / bearer redacted).

## Examples
See `./references/examples.md` for full request -> plan -> ordered tool calls with realistic arguments,
plus `./references/checklist.md` and `./references/anti-patterns.md`. Shared rules live in
`../_shared/references/library-policy.md`, `../_shared/references/security-redaction.md`,
`../_shared/references/geometry-rules.md`, and `../_shared/references/mcp-tool-cheatsheet.md`.
