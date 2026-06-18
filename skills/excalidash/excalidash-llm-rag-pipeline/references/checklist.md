# Pre-save checklist — LLM & RAG Pipeline

Run this before saving any RAG pipeline drawing as final. Do not save until every box is checked.

## Score & blockers
- [ ] `score_drawing` >= 95 and `hardBlockers == []`.
- [ ] No `ARROW_TEXT_INTERSECTION` (no edge crosses any stage or branch label).
- [ ] No `FRAME_TITLE_OVERLAP` (lane/zone titles and the legend header are title-only).
- [ ] No `ITEM_OUTSIDE_FRAME` (every node fully inside its lane/zone).
- [ ] No `SMALL_FONT` (every label >= 16px; headings >= 20px).
- [ ] No `HIGH_DENSITY` (card gaps >= 48px, arrow lanes >= 32px, especially around the retriever).
- [ ] No `TEXT_NEAR_EDGE` (all content >= 40px from the canvas/export bounds).

## RAG-specific gates
- [ ] Index path and query path are both present and visually distinct.
- [ ] Index-path edges are dashed; query-path edges are solid; the legend keys both.
- [ ] The vector store is drawn as a data store (and any keyword/BM25 index is too).
- [ ] The full happy path is present: query → embed → retrieve → context assembly → prompt → LLM →
      post-process/eval → response.
- [ ] Cache-hit short-circuit is drawn and reaches the Response terminal.
- [ ] Retrieval-miss fallback is drawn (keyword/BM25 back into assembly; empty → Refuse/Clarify).
- [ ] Guardrail/error branch is drawn and reaches a safe-fallback terminal.
- [ ] Every stage label reads as a clear verb/noun; every branch point is a decision glyph.
- [ ] `validate_architecture` is clean: no orphan stage; every path and branch reaches a terminal.

## Library & normalization
- [ ] `MCP_LIBRARY_MODE` was read first; icons used only per mode.
- [ ] Icons pulled only from curated packs (Flow Chart Symbols, Technology Logos, Data Flow).
- [ ] In `required` mode: vector store uses a database-symbol; decisions use a decision glyph; branded
      providers use logos.
- [ ] Every inserted item is normalized (scale, aspect, stroke, fill) and sits in a defined slot, never
      in an arrow lane.
- [ ] Used and rejected items recorded.

## Secrets
- [ ] No raw secret anywhere (provider key, vector-DB URL, JWT, service-role, token, bearer, webhook, proxy).
- [ ] Every secret shown as a typed `[REDACTED_<TYPE>]` placeholder.
- [ ] Export re-scanned as a backstop (vector-DB URLs and provider keys are the common leaks).
- [ ] Prompt-assembly node notes context redaction; no real prompt with an embedded credential is shown.
