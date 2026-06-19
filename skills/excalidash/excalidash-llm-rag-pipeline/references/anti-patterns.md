# Anti-patterns — LLM & RAG Pipeline

Each entry is a real failure the lint/score engine catches or a RAG-specific modelling mistake,
with the concrete fix. Drive every one to zero before saving.

## Geometry / lint blockers

### ARROW_TEXT_INTERSECTION on the shared embed / vector-store node
The index path and the query path both pass through the embedding model and the vector store, so
their edges and the "top-k" / "upsert" labels stack on top of each other where the bands meet.
**Fix:** route the query-path retrieve edge through the 32px lane *below* the index band, bind the
arrow to the vector-store node's left/right side, and move every flow label into the side gutter
beside its line — never under it.

### FRAME_TITLE_OVERLAP on a lane/zone frame
You used a swimlane (e.g. "Ingestion" / "Online query") and a stage card slid up into the reserved
40px title band, or the legend header collided with the first node.
**Fix:** push lane content down so it starts below the 40px title band + 16px inset; keep the lane
title and legend header title-only.

### ITEM_OUTSIDE_FRAME — a stage pokes out of its lane
The retriever or the fallback box was nudged during repair and now extends past the lane's inner
bounds.
**Fix:** enlarge the lane frame or move/resize the node to sit fully inside (frame rect minus title
band minus 16px inset).

### SMALL_FONT on branch labels
"cache?", "context?", "guardrail pass?", "top-k", "rerank" got shrunk to fit a tight diamond.
**Fix:** raise every label to >= 16px (headings >= 20px) and relayout so the text fits with 16px
padding — never shrink-to-fit.

### HIGH_DENSITY around the retriever
RAG diagrams crowd at the retrieve → rerank → assemble cluster because it has the most nodes and
the most branches.
**Fix:** keep card gaps >= 48px and arrow lanes >= 32px; if it still reads tight, split the retriever
detail into its own zone or widen the canvas. When in doubt, add space.

### TEXT_NEAR_EDGE on the terminal nodes
The "Response" terminal or the "Refuse/Clarify" fallback sits flush against the right/bottom export
bound.
**Fix:** keep all content >= 40px from the canvas/export bounds; move terminals inward.

## RAG modelling mistakes

### Index path and query path drawn the same
Both bands use solid arrows, so a reader cannot tell async indexing from the live request.
**Fix:** make every index-path edge dashed and every query-path edge solid, and key both in the
legend (index / query). This is the defining requirement of the skill.

### Vector store drawn as a plain process box
The vector DB is the data store of the whole pipeline; a rectangle hides that.
**Fix:** draw it as a data store (`database-symbol` slot / cylinder), and draw any keyword/BM25 index
as a data store too.

### Missing the cache-hit short-circuit
The query always flows straight to the retriever, so the diagram implies every request hits the
vector DB and the LLM.
**Fix:** add a `cache?` decision after query-embed; route "yes" directly to the Response terminal,
"no" onward to the retriever.

### Retrieval miss has no fallback
On low recall / empty top-k the flow just stops or proceeds with no context, silently.
**Fix:** add a `retrieved context?` decision; route "no" to a keyword/BM25 fallback back into context
assembly, and if still empty to a "Refuse / ask to clarify" terminal. No dangling edge.

### Guardrail / error path omitted
PII/jailbreak filtering, token-budget overflow, and provider timeout are not shown, so the diagram
looks unconditionally safe.
**Fix:** add a `guardrail pass?` decision (input filter + output filter + token-budget guard +
timeout); route "no" to a safe-fallback terminal. Keep it defensive — show the control, not an
exploit.

### Post-process / eval folded into the LLM node
Citations, grounding/faithfulness check, and scoring are collapsed into "LLM", losing the eval stage.
**Fix:** draw a distinct "Post-process / Eval" stage between the LLM and the Response terminal.

### Two create calls / hand-editing after generate
Calling `create_diagram_from_prompt` twice (once per path) yields two overlapping graphs.
**Fix:** ONE create call with a single `structure: { nodes, edges }` covering both paths and all
branches; refine only via the repair loop.

### apply_architecture_skill misused here
This is a data-flow, not a layered architecture. Do not reach for `apply_architecture_skill`; if you
ever do (for the MCP-architecture sibling), it takes `pattern:` only — there is no `skill:` or
`level:` argument.

### Crossing the index band with a query edge
A query-path arrow cuts straight through the dashed ingestion band, producing crossings and reader
confusion.
**Fix:** keep the query band parallel beneath the index band; cross only at the shared embed/vector
nodes, and there at near-90° through a gutter.

### Secret pasted into a node or prompt label
A real provider key, vector-DB URL, or a sample prompt with an embedded bearer leaks into the canvas.
**Fix:** redact before the tool call — `[REDACTED_API_KEY]`, `[REDACTED_DATABASE_URL]`,
`Bearer [REDACTED_BEARER]` — label the prompt-assembly node "redact context before send", and re-scan
the export.

See `../_shared/references/geometry-rules.md` for the exact blocker definitions; every penalty here is
enforced by `score_drawing`.
