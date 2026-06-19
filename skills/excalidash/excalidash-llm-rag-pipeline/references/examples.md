# Worked examples — LLM & RAG Pipeline

Three worked examples: the ask, one plan line, the ordered REAL tool calls with realistic arguments,
and the expected result. Every secret is redacted with a typed `[REDACTED_<TYPE>]` placeholder.

---

## Example 1 — Docs → pgvector, index vs query path

**Ask:** "Diagram our RAG pipeline: ingest PDFs, chunk, embed with a provider model, store in
pgvector, then retrieve top-k and answer with the LLM — show the index path separate from the query
path."

**Plan:** `TYPE=flowchart DIR=LR PRESET=technical-docs LIBRARY=curated[Flow Chart Symbols, Technology Logos, Data Flow] PATHS=index(dashed),query(solid) BRANCHES=cache-hit VALIDATORS=lint,score,repair,validate_architecture`

**Tool calls:**
```
mcp__excalidash__read_mcp_guide({})
mcp__excalidash__search_libraries({ q: "process decision data-store", mode: "curated", category: "flow" })
mcp__excalidash__inspect_library({ libraryId: "flow-chart-symbols", autoCache: true })
mcp__excalidash__create_diagram_from_prompt({
  diagramType: "flowchart",
  direction: "LR",
  preset: "technical-docs",
  structure: {
    nodes: [
      { id: "src",    label: "PDF Sources" },
      { id: "load",   label: "Loader / Parser" },
      { id: "chunk",  label: "Chunker (1k/100 overlap)" },
      { id: "embed",  label: "Embedding Model" },
      { id: "vec",    label: "Vector Store (pgvector)", kind: "datastore" },
      { id: "query",  label: "User Query" },
      { id: "cache",  label: "cache?", kind: "decision" },
      { id: "retr",   label: "Retriever (top-k)" },
      { id: "asm",    label: "Context Assembly" },
      { id: "tmpl",   label: "Prompt Template" },
      { id: "llm",    label: "LLM" },
      { id: "eval",   label: "Post-process / Eval" },
      { id: "resp",   label: "Response", kind: "terminal" }
    ],
    edges: [
      { from: "src",   to: "load",  style: "dashed" },
      { from: "load",  to: "chunk", style: "dashed" },
      { from: "chunk", to: "embed", style: "dashed" },
      { from: "embed", to: "vec",   style: "dashed", label: "upsert" },
      { from: "query", to: "embed", style: "solid" },
      { from: "embed", to: "cache", style: "solid" },
      { from: "cache", to: "resp",  style: "solid", label: "hit" },
      { from: "cache", to: "retr",  style: "solid", label: "miss" },
      { from: "retr",  to: "vec",   style: "solid", label: "top-k" },
      { from: "retr",  to: "asm",   style: "solid" },
      { from: "asm",   to: "tmpl",  style: "solid" },
      { from: "tmpl",  to: "llm",   style: "solid" },
      { from: "llm",   to: "eval",  style: "solid" },
      { from: "eval",  to: "resp",  style: "solid" }
    ]
  },
  title: "Knowledge Base — RAG Pipeline",
  save: false
})
mcp__excalidash__add_library_items_normalized({ libraryId: "data-flow", itemNames: ["data-store"], targetCardId: "vec", placement: "database-symbol", slotSize: 32, save: false })
mcp__excalidash__lint_drawing({ id: "<drawingId>" })
mcp__excalidash__score_drawing({ minimumScore: 95 })
mcp__excalidash__repair_drawing({ save: false, createVersion: true })
mcp__excalidash__auto_polish_drawing({ minimumScore: 95, maxAttempts: 3 })
mcp__excalidash__validate_architecture({})
mcp__excalidash__save_drawing({ name: "Knowledge Base — RAG Pipeline" })
mcp__excalidash__save_version({ id: "<drawingId>" })
mcp__excalidash__get_drawing_url({ id: "<drawingId>" })
mcp__excalidash__export_drawing({ id: "<drawingId>", format: "svg" })
```

**Expected result:** a flowchart with a dashed top index band feeding a pgvector data store, a solid
query band sharing the embed node and the store, a `cache?` decision short-circuiting to Response, and
an eval stage before Response; `score >= 95`, `hardBlockers == []`, no arrow-over-text.

---

## Example 2 — Add the retrieval-miss fallback and a guardrail

**Ask:** "Draw the LLM retrieval flow and make the caching, the BM25 fallback when recall is low, and
a guardrail/error branch explicit."

**Plan:** `TYPE=flowchart DIR=LR PRESET=technical-docs LIBRARY=curated[Flow Chart Symbols, Technology Logos, Data Flow] PATHS=index(dashed),query(solid) BRANCHES=cache-hit,retrieval-miss,guardrail/error VALIDATORS=lint,score,repair,validate_architecture`

**Tool calls:**
```
mcp__excalidash__read_mcp_guide({})
mcp__excalidash__create_diagram_from_prompt({
  diagramType: "flowchart",
  direction: "LR",
  preset: "technical-docs",
  structure: {
    nodes: [
      { id: "embed", label: "Embedding Model" },
      { id: "vec",   label: "Vector Store", kind: "datastore" },
      { id: "kw",    label: "Keyword / BM25 Index", kind: "datastore" },
      { id: "ctx?",  label: "retrieved context?", kind: "decision" },
      { id: "bm25",  label: "Keyword / BM25 Fallback" },
      { id: "refuse",label: "Refuse / ask to clarify", kind: "terminal" },
      { id: "asm",   label: "Context Assembly" },
      { id: "tmpl",  label: "Prompt Template (redact context before send)" },
      { id: "guard", label: "guardrail pass?", kind: "decision" },
      { id: "safe",  label: "Safe Fallback", kind: "terminal" },
      { id: "llm",   label: "LLM" },
      { id: "resp",  label: "Response", kind: "terminal" }
    ],
    edges: [
      { from: "embed", to: "vec",    style: "solid", label: "top-k" },
      { from: "vec",   to: "ctx?",   style: "solid" },
      { from: "ctx?",  to: "asm",    style: "solid", label: "yes" },
      { from: "ctx?",  to: "bm25",   style: "solid", label: "no" },
      { from: "bm25",  to: "kw",     style: "solid" },
      { from: "bm25",  to: "asm",    style: "solid" },
      { from: "bm25",  to: "refuse", style: "solid", label: "still empty" },
      { from: "asm",   to: "tmpl",   style: "solid" },
      { from: "tmpl",  to: "guard",  style: "solid" },
      { from: "guard", to: "llm",    style: "solid", label: "pass" },
      { from: "guard", to: "safe",   style: "solid", label: "fail" },
      { from: "llm",   to: "resp",   style: "solid" }
    ]
  },
  title: "Support RAG — Fallbacks & Guardrail",
  save: false
})
mcp__excalidash__lint_drawing({ id: "<drawingId>" })
mcp__excalidash__score_drawing({ minimumScore: 95 })
mcp__excalidash__repair_drawing({ save: false, createVersion: true, name: "route bm25 edge through lower lane" })
mcp__excalidash__auto_polish_drawing({ minimumScore: 95, maxAttempts: 3 })
mcp__excalidash__validate_architecture({})
mcp__excalidash__save_drawing({ name: "Support RAG — Fallbacks & Guardrail" })
mcp__excalidash__export_drawing({ id: "<drawingId>", format: "png" })
```

**Expected result:** three labelled branches — cache short-circuit, retrieval-miss (BM25 back into
assembly, else Refuse/Clarify), and guardrail (fail → Safe Fallback) — each reaching a terminal;
`validate_architecture` finds no orphan; `score >= 95`.

---

## Example 3 — Secret in the input, redacted before drawing

**Ask:** "Document our RAG with the vector DB connection string and the provider key on the LLM call:
`postgres://app:<password>@pg.internal/vec` and `<provider API key>`, Authorization `Bearer <JWT>`."

**Plan:** `TYPE=flowchart DIR=LR PRESET=technical-docs REDACT=db-url,api-key,bearer VALIDATORS=lint,score,repair,validate_architecture`

**Tool calls (note every value is redacted BEFORE the call):**
```
mcp__excalidash__create_diagram_from_prompt({
  diagramType: "flowchart",
  direction: "LR",
  preset: "technical-docs",
  structure: {
    nodes: [
      { id: "vec", label: "Vector Store — postgres://app:[REDACTED_DATABASE_URL]@pg.internal/vec", kind: "datastore" },
      { id: "tmpl", label: "Prompt Template (redact context before send)" },
      { id: "llm", label: "LLM — key [REDACTED_API_KEY], auth: Bearer [REDACTED_BEARER]" },
      { id: "resp", label: "Response", kind: "terminal" }
    ],
    edges: [
      { from: "vec",  to: "tmpl", style: "solid", label: "top-k context" },
      { from: "tmpl", to: "llm",  style: "solid", label: "auth via bearer" },
      { from: "llm",  to: "resp", style: "solid" }
    ]
  },
  title: "RAG — Redacted Credentials",
  save: false
})
mcp__excalidash__lint_drawing({ id: "<drawingId>" })
mcp__excalidash__score_drawing({ minimumScore: 95 })
mcp__excalidash__repair_drawing({ save: false, createVersion: true })
mcp__excalidash__save_drawing({ name: "RAG — Redacted Credentials" })
mcp__excalidash__export_drawing({ id: "<drawingId>", format: "svg" })
```

**Expected result:** the diagram shows the *shape* of each credential
(`postgres://app:[REDACTED_DATABASE_URL]@pg.internal/vec`, `[REDACTED_API_KEY]`,
`Bearer [REDACTED_BEARER]`) and never the live value; the export re-scan finds no raw secret;
`score >= 95` with empty `hardBlockers`.
