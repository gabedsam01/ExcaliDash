# Diagram Director — Examples

Each example shows: the user request, the classification decision, the plan line, and the
exact ordered MCP tool calls with realistic arguments. `id` values are illustrative.

---

## Example 1 — Ambiguous "draw our system" -> C4 Container

**Request**: "Draw our system: a Next.js web app talks to a Go API, which uses Postgres
and Redis, behind Cloudflare."

**Decision**: structure of a system, components and how they talk -> **c4** (Container level).

**Plan**: `TYPE=c4 PRESET=architecture LIBRARY=curated[C4 Architecture, Software Architecture]
VALIDATORS=lint,score,repair,validate_architecture`

**Calls**:
```
read_mcp_guide()
list_templates()                                   // pick "c4-container" if present
search_libraries({ q: "container", mode: "core", category: "c4" })
inspect_library({ libraryId: "c4-architecture" })
cache_library({ libraryId: "c4-architecture" })
search_libraries({ q: "database cache", mode: "core" })
create_from_template({ templateId: "c4-container", preset: "architecture",
  title: "AcmeApp — C4 Container", save: false })
// -> { drawingId: "draw_c4_001" }
add_library_items_normalized({ libraryId: "c4-architecture", id: "draw_c4_001",
  itemNames: ["container"], targetCardId: "API (Go)", placement: "inside-card-top", slotSize: 32 })
add_library_items_normalized({ libraryId: "database-data-platform", id: "draw_c4_001",
  itemNames: ["relational"], targetCardId: "Postgres", placement: "database-symbol" })
add_library_items_normalized({ libraryId: "software-architecture", id: "draw_c4_001",
  itemNames: ["cache"], targetCardId: "Redis", placement: "database-symbol" })
lint_drawing({ id: "draw_c4_001" })
score_drawing({ minimumScore: 95 })                 // e.g. 91, HIGH_DENSITY on the store row
save_version({ id: "draw_c4_001" })                 // checkpoint before repair
repair_drawing({ save: true, createVersion: true, name: "c4-repair-1" })  // widens store-row gutter
lint_drawing({ id: "draw_c4_001" })                 // hardBlockers: []
score_drawing({ minimumScore: 95 })                 // 96
auto_polish_drawing({ minimumScore: 95 })
validate_architecture({ structure: { nodes: ["Web (Next.js)", "API (Go)", "Postgres", "Redis"],
  edges: ["Web (Next.js)->API (Go)", "API (Go)->Postgres", "API (Go)->Redis"] } })  // no orphans
save_drawing({ id: "draw_c4_001", name: "AcmeApp — C4 Container" })
save_version({ id: "draw_c4_001" })                 // accepted state (score=96)
get_drawing_url({ id: "draw_c4_001" })
export_drawing({ id: "draw_c4_001", format: "svg" })
```

---

## Example 2 — "Show the checkout steps" -> Flowchart

**Request**: "Show the checkout steps: cart, validate stock, if out of stock notify user,
else charge card, then create order."

**Decision**: ordered steps with a branch -> **flow**.

**Plan**: `TYPE=flow PRESET=process LIBRARY=curated[Flow Chart Symbols]
VALIDATORS=lint,score,repair`

**Calls**:
```
read_mcp_guide()
search_libraries({ q: "decision process start end", mode: "core" })
inspect_library({ libraryId: "flow-chart-symbols" })
cache_library({ libraryId: "flow-chart-symbols" })
create_diagram_from_prompt({ diagramType: "flow", preset: "process", direction: "TB",
  prompt: "Start -> Cart -> Validate stock -> decision[In stock?]: No -> Notify user -> End; Yes -> Charge card -> Create order -> End" })
// -> { drawingId: "draw_flow_002" }
add_library_items_normalized({ libraryId: "flow-chart-symbols", id: "draw_flow_002",
  itemNames: ["decision"], targetCardId: "In stock?", placement: "inside-card-left", slotSize: 32 })
lint_drawing({ id: "draw_flow_002" })                // ARROW_TEXT_INTERSECTION on "No" branch
score_drawing({ minimumScore: 95 })                  // 88
save_version({ id: "draw_flow_002" })                // checkpoint before repair
repair_drawing({ save: true, createVersion: true, name: "flow-repair-1" })  // reroutes No-branch
lint_drawing({ id: "draw_flow_002" })                // hardBlockers: []
score_drawing({ minimumScore: 95 })                  // 97
auto_polish_drawing({ minimumScore: 95 })
save_drawing({ id: "draw_flow_002", name: "Checkout Flow" })
save_version({ id: "draw_flow_002" })                // accepted state (score=97)
export_drawing({ id: "draw_flow_002", format: "png" })
```

---

## Example 3 — "How does login work over time" -> Sequence

**Request**: "How does login work: browser sends credentials to API, API checks the user
in Postgres, issues a JWT, browser stores it."

**Decision**: time-ordered messages between actors -> **sequence**.

**Plan**: `TYPE=sequence PRESET=technical-docs LIBRARY=curated[Stick Figures(actor)]
VALIDATORS=lint,score,repair`

**Calls**:
```
read_mcp_guide()
search_libraries({ q: "actor person user", mode: "core" })
create_diagram_from_prompt({ diagramType: "sequence", preset: "technical-docs",
  prompt: "actors: Browser, API, Postgres. Browser->API: POST credentials. API->Postgres: lookup user. Postgres-->API: user row. API->API: sign JWT ([REDACTED_JWT_SECRET]). API-->Browser: 200 + JWT. Browser->Browser: store token." })
// note: the JWT signing secret is redacted to [REDACTED_JWT_SECRET] BEFORE the call
// -> { drawingId: "draw_seq_003" }
add_library_items_normalized({ libraryId: "stick-figures", id: "draw_seq_003",
  itemNames: ["person"], targetCardId: "Browser", placement: "actor", slotSize: 48 })
lint_drawing({ id: "draw_seq_003" })
score_drawing({ minimumScore: 95 })                  // 95 first pass
auto_polish_drawing({ minimumScore: 95 })
score_drawing({ minimumScore: 95 })                  // 96 confirm no regression
save_drawing({ id: "draw_seq_003", name: "Login Sequence" })
save_version({ id: "draw_seq_003" })
export_drawing({ id: "draw_seq_003", format: "svg" })
```

---

## Example 4 — "Threat model the upload service" -> Security

**Request**: "Threat model the upload service: public client over the internet, an API
gateway, the upload service, an S3 bucket, all inside our VPC."

**Decision**: trust boundaries + threat surfaces -> **security**.

**Plan**: `TYPE=security PRESET=dark-architecture
LIBRARY=curated[C4 Architecture(boundary), Software Architecture(lock)]
VALIDATORS=lint,score,repair,validate_architecture`

**Calls**:
```
read_mcp_guide()
search_libraries({ q: "boundary lock key", mode: "core" })
create_diagram_from_prompt({ diagramType: "security", preset: "dark-architecture",
  prompt: "Trust boundaries: Internet (untrusted) | DMZ: API Gateway | VPC: Upload Service, S3 bucket. Flows: Client->Gateway (TLS, authn), Gateway->Upload (authz), Upload->S3 (IAM role). Mark boundary crossings as threat surfaces." })
// -> { drawingId: "draw_sec_004" }
add_library_items_normalized({ libraryId: "c4-architecture", id: "draw_sec_004",
  itemNames: ["boundary"], targetCardId: "VPC", placement: "legend" })
add_library_items_normalized({ libraryId: "software-architecture", id: "draw_sec_004",
  itemNames: ["lock"], targetCardId: "API Gateway", placement: "badge" })
lint_drawing({ id: "draw_sec_004" })                 // FRAME_TITLE_OVERLAP on VPC frame
score_drawing({ minimumScore: 95 })                  // 90
save_version({ id: "draw_sec_004" })                 // checkpoint before repair
repair_drawing({ save: true, createVersion: true, name: "sec-repair-1" })  // pushes VPC children below title band
lint_drawing({ id: "draw_sec_004" })                 // hardBlockers: []
score_drawing({ minimumScore: 95 })                  // 96
validate_architecture({ structure: { nodes: ["Client", "API Gateway", "Upload Service", "S3 bucket"],
  edges: ["Client->API Gateway", "API Gateway->Upload Service", "Upload Service->S3 bucket"] } })
  // every flow crosses a labeled boundary
save_drawing({ id: "draw_sec_004", name: "Upload Service Threat Model" })
export_drawing({ id: "draw_sec_004", format: "svg" })
```

---

## Example 5 — Convert an existing flowchart to a Data Flow Diagram

**Request**: "Take the checkout flow and turn it into a data flow diagram."

**Decision**: reshape an existing structure -> **convert** to **dataflow**.

**Plan**: `TYPE=dataflow PRESET=technical-docs LIBRARY=curated[Data Flow]
VALIDATORS=lint,score,repair,validate_architecture`

**Calls**:
```
read_mcp_guide()
convert_diagram_type({ targetType: "dataflow", preset: "technical-docs",
  structure: { nodes: ["Cart", "Validate stock", "Charge card", "Create order", "Orders"],
    edges: ["Cart->Validate stock", "Validate stock->Charge card", "Charge card->Create order", "Create order->Orders"] },
  save: true, name: "Checkout — Data Flow" })
// -> { drawingId: "draw_dfd_005" }
search_libraries({ q: "external entity process data store", mode: "core" })
add_library_items_normalized({ libraryId: "data-flow", id: "draw_dfd_005",
  itemNames: ["datastore"], targetCardId: "Orders", placement: "database-symbol" })
lint_drawing({ id: "draw_dfd_005" })
score_drawing({ minimumScore: 95 })                  // 93, TEXT_NEAR_EDGE
save_version({ id: "draw_dfd_005" })                 // checkpoint before repair
repair_drawing({ save: true, createVersion: true, name: "dfd-repair-1" })  // shifts composition inward
score_drawing({ minimumScore: 95 })                  // 96
validate_architecture({ structure: { nodes: ["Cart", "Validate stock", "Charge card", "Create order", "Orders"],
  edges: ["Cart->Validate stock", "Validate stock->Charge card", "Charge card->Create order", "Create order->Orders"] } })
  // no dangling flow without a store/entity
save_drawing({ id: "draw_dfd_005", name: "Checkout — Data Flow" })
export_drawing({ id: "draw_dfd_005", format: "excalidraw" })
```

---

## Rollback example (a repair lowered the score)

```
score_drawing({ minimumScore: 95 })                  // 96 (checkpoint saved)
save_version({ id: "draw_c4_001" })                  // accepted checkpoint at score=96
repair_drawing({ save: true, createVersion: true, name: "align-store-row" })
score_drawing({ minimumScore: 95 })                  // 92 -> regression!
// ROLLBACK: discard the regressed version and restore the score=96 checkpoint, then
// apply a smaller, targeted fix instead of the broad re-align.
repair_drawing({ save: true, createVersion: true, name: "nudge-single-store-card" })
score_drawing({ minimumScore: 95 })                  // 96 held
```
</content>
</invoke>
