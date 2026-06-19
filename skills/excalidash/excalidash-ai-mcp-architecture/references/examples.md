# Worked examples — AI & MCP Architecture

Each example: the Ask, one plan line, the ordered REAL tool calls with realistic
arguments, and the expected result. Every secret is redacted. Tools are the real 25;
`apply_architecture_skill` uses `pattern` only (no `skill`/`level`).

---

## Example 1 — Canonical ExcaliDash MCP server (skeleton path)

**Ask:** "Draw the architecture of our ExcaliDash MCP server — transport, bearer auth, the
tool registry and Postgres storage as separate nodes, and keep the LLM outside the boundary."

**Plan:** `PATTERN=mcp PRESET=dark-architecture LIBRARY=curated[Software Architecture, Technology Logos] VALIDATORS=lint,score,repair,validate_architecture`

**Tool calls:**
```
read_mcp_guide({})
search_libraries({ q: "postgres database server gateway", mode: "curated", category: "architecture", limit: 12 })
inspect_library({ libraryId: "technology-logos", autoCache: true })
apply_architecture_skill({
  pattern: "mcp",
  preset: "dark-architecture",
  title: "ExcaliDash — MCP Architecture",
  autoPolish: false,
  save: false
})            // -> drawingId "dr_mcp_01"
add_library_items_normalized({
  libraryId: "technology-logos",
  itemNames: ["postgresql"],
  targetCardId: "storage-postgres",
  placement: "database-symbol",
  slotSize: 32,
  save: false
})
lint_drawing({ id: "dr_mcp_01" })            // hardBlockers: ["ARROW_TEXT_INTERSECTION"]
repair_drawing({ save: false, createVersion: false })
lint_drawing({ id: "dr_mcp_01" })            // hardBlockers: []
score_drawing({ minimumScore: 95 })          // 93 -> below bar
auto_polish_drawing({ minimumScore: 95, maxAttempts: 3, save: false })   // -> 97
validate_architecture({})                    // separation OK; LLM outside boundary
save_drawing({ id: "dr_mcp_01", name: "ExcaliDash — MCP Architecture" })
save_version({ id: "dr_mcp_01" })
get_drawing_url({ id: "dr_mcp_01" })
export_drawing({ id: "dr_mcp_01", format: "svg" })
```

**Expected result:** four lanes — Host + LLM (outside), Transport `/mcp` JSON-RPC, server
(Auth Bearer `exd_` -> Tool Registry [Core 9 / Libraries 5 / Quality 4 / Architecture 4 /
Templates 3] -> Drawing/Quality/Architecture/Template services), backend (PostgreSQL +
Library Cache). Score 97, hardBlockers empty, no arrow-over-text, LLM confirmed outside the
trust boundary. Saved only after it passed.

---

## Example 2 — From a repository analysis object

**Ask:** "I have a repo analysis JSON for our AI tool server — turn it into an MCP
architecture diagram with the trust boundary marked." (The JSON had a connection string;
it is redacted before it reaches any tool.)

**Plan:** `PATTERN=mcp(from-repo-analysis) PRESET=dark-architecture LIBRARY=curated[Software Architecture, Cloud/DevOps] VALIDATORS=lint,score,repair,validate_architecture`

**Tool calls:**
```
read_mcp_guide({})
create_from_repo_analysis({
  analysis: {
    modules: ["transport", "auth", "tool-registry", "drawing-service", "quality-service"],
    entrypoints: ["POST /mcp (JSON-RPC)"],
    database: "postgres://exd:[REDACTED_DATABASE_URL]@db:5432/excalidash",
    services: ["drawing", "quality", "architecture", "template"],
    integrations: ["Curated Library Cache", "Host: Claude Code (LLM external)"]
  },
  preset: "dark-architecture",
  autoPolish: false,
  save: false
})            // -> drawingId "dr_mcp_02"
lint_drawing({ id: "dr_mcp_02" })            // hardBlockers: ["ITEM_OUTSIDE_FRAME"]  (a service clipped the boundary)
repair_drawing({ save: false, createVersion: false })
score_drawing({ minimumScore: 95 })          // 95
suggest_architecture_improvements({})        // hints: add rate-limit + audit-log on auth edge
auto_polish_drawing({ minimumScore: 95, maxAttempts: 2, save: false })   // -> 96
validate_architecture({})                    // transport/auth/storage distinct; LLM external
save_drawing({ id: "dr_mcp_02", name: "AI Tool Server — MCP Architecture" })
save_version({ id: "dr_mcp_02" })
export_drawing({ id: "dr_mcp_02", format: "png" })
```

**Expected result:** the analysis maps onto the four lanes; the clipped service is moved
fully inside the boundary; the db URL is shown only as
`postgres://exd:[REDACTED_DATABASE_URL]@db:5432/excalidash`. Score 96, hardBlockers empty,
storage reachable only through a service.

---

## Example 3 — Explicit structure (fallback path) + hardening advice

**Ask:** "Show where the LLM sits relative to our MCP server and make the auth and storage
separation explicit, then tell me how to harden it."

**Plan:** `PATTERN=mcp(explicit-structure) PRESET=dark-architecture LIBRARY=curated[Software Architecture, Technology Logos] VALIDATORS=lint,score,repair,validate_architecture,suggest`

**Tool calls:**
```
read_mcp_guide({})
create_diagram_from_prompt({
  diagramType: "architecture",
  direction: "LR",
  preset: "dark-architecture",
  title: "MCP Server — Trust Boundary",
  structure: {
    nodes: [
      { id: "host", label: "Host (Claude Code)" },          // outside boundary
      { id: "llm", label: "LLM" },                          // outside boundary
      { id: "transport", label: "Transport /mcp JSON-RPC" },
      { id: "auth", label: "Auth (Bearer exd_)" },
      { id: "registry", label: "Tool Registry (25: Core 9, Libraries 5, Quality 4, Architecture 4, Templates 3)" },
      { id: "svc", label: "Drawing + Quality + Architecture + Template Services" },
      { id: "pg", label: "PostgreSQL (drawings, versions, api_keys)" },
      { id: "libcache", label: "Curated Library Cache" }
    ],
    edges: [
      { from: "host", to: "llm", label: "prompts" },
      { from: "host", to: "transport", label: "calls over HTTPS" },
      { from: "transport", to: "auth", label: "verifies Bearer exd_[REDACTED_API_KEY]" },
      { from: "auth", to: "registry", label: "admits" },
      { from: "registry", to: "svc", label: "dispatches" },
      { from: "svc", to: "pg", label: "reads/writes" },
      { from: "svc", to: "libcache", label: "reads cached packs" }
    ]
  },
  save: false
})            // -> drawingId "dr_mcp_03"
lint_drawing({ id: "dr_mcp_03" })
repair_drawing({ save: false, createVersion: false })
score_drawing({ minimumScore: 95 })          // 96
validate_architecture({})                    // host + llm outside boundary; no client->pg edge
suggest_architecture_improvements({})        // rate limit, audit log, key rotation on auth
save_drawing({ id: "dr_mcp_03", name: "MCP Server — Trust Boundary" })
save_version({ id: "dr_mcp_03" })
export_drawing({ id: "dr_mcp_03", format: "excalidraw" })
```

**Expected result:** the LLM and host sit outside the trust-boundary frame; the bearer gate
is an explicit node between transport and registry; storage is reached only through the
services. Score 96, hardBlockers empty. The hardening hints (rate limit, audit log, key
rotation) are returned as advice, not drawn as raw secrets.
