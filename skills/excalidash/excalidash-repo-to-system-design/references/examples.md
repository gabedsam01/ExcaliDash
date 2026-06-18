# Repo to System Design — Worked Examples

Each example shows: the request -> the structured analysis -> the plan line -> the ordered MCP
tool calls with realistic arguments -> the quality loop -> save/export. Secrets are redacted in
the analysis model BEFORE any call.

---

## Example A — OrderFlow monorepo (build from repo analysis, preferred path)

**Request**: "We ran the analyzer over the OrderFlow monorepo. Draw it as a system design."

**Structured analysis (redacted)**
```json
{
  "actors":    [{ "name": "Customer", "kind": "user" }, { "name": "Ops", "kind": "admin" }],
  "apps":      [{ "name": "Storefront", "kind": "spa", "tech": "React" }],
  "gateways":  [{ "name": "API Gateway", "kind": "api-gateway", "tech": "Kong" }],
  "services":  [
    { "name": "Orders",  "tech": "Node.js", "owns": ["Orders DB"], "exposes": ["/orders"] },
    { "name": "Billing", "tech": "Go",      "owns": ["Billing DB"], "exposes": ["/invoices"] },
    { "name": "Auth",    "tech": "Node.js", "owns": [], "exposes": ["/login"] }
  ],
  "workers":   [{ "name": "Fulfillment Worker", "tech": "Node.js", "consumes": ["order-events"] }],
  "queues":    [{ "name": "order-events", "kind": "topic", "tech": "Kafka" }],
  "databases": [
    { "name": "Orders DB",  "kind": "relational", "tech": "PostgreSQL", "conn": "postgres://app:[REDACTED_DATABASE_URL]@db/orders" },
    { "name": "Billing DB", "kind": "relational", "tech": "PostgreSQL", "conn": "postgres://app:[REDACTED_DATABASE_URL]@db/billing" },
    { "name": "Cache",      "kind": "cache",      "tech": "Redis" }
  ],
  "integrations": [
    { "name": "Stripe",   "kind": "payments", "tech": "Stripe API" },
    { "name": "SendGrid", "kind": "email",    "tech": "SendGrid API" }
  ],
  "auth":          { "scheme": "oauth", "idp": "Auth0", "idpSecret": "[REDACTED_PROVIDER_KEY]" },
  "observability": { "logs": "Loki", "metrics": "Prometheus", "traces": "OTel", "dashboards": "Grafana" },
  "risks":         [{ "area": "Billing DB", "severity": "med", "note": "no read replica" }],
  "flows": [
    { "id": "f1", "kind": "request", "steps": [
      { "from": "Customer", "to": "Storefront",  "label": "uses",          "protocol": "HTTPS" },
      { "from": "Storefront","to": "API Gateway", "label": "calls",         "protocol": "HTTPS/JSON" },
      { "from": "API Gateway","to": "Auth",       "label": "authenticates", "protocol": "OAuth" },
      { "from": "API Gateway","to": "Orders",     "label": "routes /orders","protocol": "HTTP/JSON" },
      { "from": "Orders",    "to": "Orders DB",   "label": "reads/writes",  "protocol": "SQL" },
      { "from": "Orders",    "to": "Cache",       "label": "caches in",     "protocol": "RESP" }
    ]},
    { "id": "f2", "kind": "event", "steps": [
      { "from": "Orders",            "to": "order-events", "label": "publishes",  "protocol": "Kafka" },
      { "from": "order-events",      "to": "Fulfillment Worker", "label": "consumes", "protocol": "Kafka" },
      { "from": "Fulfillment Worker","to": "SendGrid",     "label": "emails via", "protocol": "HTTPS" },
      { "from": "Billing",           "to": "Stripe",       "label": "charges via","protocol": "HTTPS" }
    ]}
  ]
}
```

**Redaction first** (BEFORE any call): the two Postgres `conn` passwords and the Auth0 `idpSecret`
were replaced with `[REDACTED_DATABASE_URL]` / `[REDACTED_PROVIDER_KEY]` in the model above.

**Plan line**
```
TYPE=system-design SOURCE=repo-analysis PRESET=architecture
ZONES=[Client, Edge, Services, Async, Data, External, Cross-cutting]
LIBRARY=curated[Software Architecture, Technology Logos, Cloud/DevOps, Database/Data Platform]
VALIDATORS=lint,score,repair,validate_architecture
NODES=13  FLOWS=2(request+event)
```

**Ordered calls**

1. `read_mcp_guide()` -> note `MCP_LIBRARY_MODE = curated`, architecture preset, rubric.
2. `list_templates()` -> scan for `system-design` (none reusable -> build from analysis).
3. Library vetting:
   - `search_libraries({ q: "microservice api gateway", mode: "curated", category: "Software Architecture" })`
   - `search_libraries({ q: "kafka broker postgresql redis", mode: "curated", category: "Database/Data Platform" })`
   - `search_libraries({ q: "stripe sendgrid auth0", mode: "curated", category: "Technology Logos" })`
   - `inspect_library({ libraryId: "software-architecture", autoCache: true })`,
     `inspect_library({ libraryId: "database-data-platform", autoCache: true })`
   - `cache_library({ /* official allowlisted source only */ })` for each vetted pack.
4. Generate (ONE path — repo analysis):
   ```json
   create_from_repo_analysis({
     "analysis": { /* the redacted model, folded into modules/entrypoints/database/services/integrations */ },
     "preset": "architecture",
     "autoPolish": true,
     "save": true,
     "name": "OrderFlow — System Design"
   })
   ```
   -> builds Client / Edge / Services / Async / Data / External / Cross-cutting frames, drops each
   node in its zone, routes f1 (request, solid) and f2 (event, dashed) along their steps, emits a
   zone legend. Returns `{ drawingId: "draw_orderflow_sysdesign" }`.
5. Place icons — one `add_library_items_normalized` call per card (each maps an `itemNames` glyph to
   a `targetCardId` at a `placement` slot, with a normalized `slotSize`):
   ```json
   add_library_items_normalized({ "libraryId": "software-architecture", "itemNames": ["gw-api"],       "targetCardId": "API Gateway",  "placement": "inside-card-top", "slotSize": 32, "save": true })
   add_library_items_normalized({ "libraryId": "software-architecture", "itemNames": ["svc-generic"],  "targetCardId": "Orders",       "placement": "inside-card-top", "slotSize": 32, "save": true })
   add_library_items_normalized({ "libraryId": "software-architecture", "itemNames": ["svc-generic"],  "targetCardId": "Billing",      "placement": "inside-card-top", "slotSize": 32, "save": true })
   add_library_items_normalized({ "libraryId": "software-architecture", "itemNames": ["svc-generic"],  "targetCardId": "Auth",         "placement": "inside-card-top", "slotSize": 32, "save": true })
   add_library_items_normalized({ "libraryId": "database-data-platform","itemNames": ["broker-kafka"], "targetCardId": "order-events", "placement": "inside-card-top", "slotSize": 32, "save": true })
   add_library_items_normalized({ "libraryId": "database-data-platform","itemNames": ["db-relational"],"targetCardId": "Orders DB",    "placement": "database-symbol", "slotSize": 40, "save": true })
   add_library_items_normalized({ "libraryId": "database-data-platform","itemNames": ["db-relational"],"targetCardId": "Billing DB",   "placement": "database-symbol", "slotSize": 40, "save": true })
   add_library_items_normalized({ "libraryId": "database-data-platform","itemNames": ["cache-redis"],  "targetCardId": "Cache",        "placement": "database-symbol", "slotSize": 40, "save": true })
   add_library_items_normalized({ "libraryId": "technology-logos",      "itemNames": ["logo-stripe"],  "targetCardId": "Stripe",       "placement": "badge",           "slotSize": 28, "save": true })
   add_library_items_normalized({ "libraryId": "technology-logos",      "itemNames": ["logo-sendgrid"],"targetCardId": "SendGrid",     "placement": "badge",           "slotSize": 28, "save": true })
   add_library_items_normalized({ "libraryId": "stick-figures",         "itemNames": ["stick-figure"], "targetCardId": "Customer",     "placement": "actor",           "slotSize": 48, "save": true })
   add_library_items_normalized({ "libraryId": "stick-figures",         "itemNames": ["stick-figure"], "targetCardId": "Ops",          "placement": "actor",           "slotSize": 48, "save": true })
   ```
   The tool score-simulates each insertion and rejects any item that lowers the score (drop it and
   keep the primitive).
6. Quality loop (the create call ran with `id` captured as `draw_orderflow_sysdesign`):
   - `lint_drawing({ id: "draw_orderflow_sysdesign" })` -> `hardBlockers: ["ARROW_TEXT_INTERSECTION"]`
     (f1 "routes /orders" label under the Gateway->Orders line) + `["ITEM_OUTSIDE_FRAME"]` (Billing
     DB clipping the Data frame edge).
   - `score_drawing({ minimumScore: 95 })` -> `79` (penalties: ARROW_TEXT_INTERSECTION, ITEM_OUTSIDE_FRAME, HIGH_DENSITY).
   - `save_version({ id: "draw_orderflow_sysdesign" })` (rollback target).
   - `repair_drawing({ save: true, createVersion: true, name: "repair-outside-frame" })` — nudges
     'Billing DB' fully inside the Data zone (16px inner padding), routes 'routes /orders' through
     the Services-row gutter with 32px label clearance, and widens the Services band to 48px gaps.
   - re-`lint_drawing({ id: "draw_orderflow_sysdesign" })` -> `hardBlockers: []`;
     re-`score_drawing({ minimumScore: 95 })` -> `96`.
7. `auto_polish_drawing({ minimumScore: 95, maxAttempts: 3, save: true })` ->
   re-`score_drawing({ minimumScore: 95 })` -> `97` (no regression; keep).
8. Validate + improve:
   - `validate_architecture({ structure })` (pass the generated zone/flow structure) ->
     `{ ok: true, zones: 7, nodesZoned: 13, integrationsInExternal: 2, requestFlows: 1, eventFlows: 1, orphans: [] }`.
   - `suggest_architecture_improvements({ structure })` -> `["Billing owns Billing DB but no read/write edge"]`
     -> apply: add `Billing -> Billing DB "reads/writes" (SQL)`; re-`score_drawing({ minimumScore: 95 })` -> `97` (kept).
9. `save_drawing({ id: "draw_orderflow_sysdesign", name: "OrderFlow — System Design" })`.
10. `save_version({ id: "draw_orderflow_sysdesign" })`.
11. `get_drawing_url({ id: "draw_orderflow_sysdesign" })` -> share link;
    `export_drawing({ id: "draw_orderflow_sysdesign", format: "svg" })`
    -> **re-scan export**: confirm both Postgres labels show `[REDACTED_DATABASE_URL]` and the
    Auth0 secret is absent. Done.

---

## Example B — Service-heavy repo, downshift to microservices skeleton (fallback A)

**Request**: "The analysis is almost all services and queues — no front-end. Just lay out the
runtime topology from it."

**Plan line**
```
TYPE=system-design SOURCE=repo-analysis PRESET=architecture STRATEGY=microservices-fallback
LIBRARY=curated[Software Architecture, Database/Data Platform, Technology Logos]
VALIDATORS=lint,score,repair,validate_architecture
```

**Ordered calls**
1. `read_mcp_guide()`.
2. Generate (ONE path — downshift the service-heavy analysis to a microservices skeleton; note
   `apply_architecture_skill` takes `pattern` only — there is NO `skill` and NO `level`/`spec` arg):
   ```json
   apply_architecture_skill({
     "pattern": "microservices",
     "preset": "architecture",
     "title": "Catalog Platform — System Design (API Gateway -> Catalog/Search/Pricing over Kafka 'events')",
     "autoPolish": true,
     "save": true,
     "name": "Catalog Platform — System Design"
   })
   ```
   The service/store/broker detail (Catalog/Go/Catalog DB, Search/Rust/Search Index, Pricing/Java/
   Pricing DB, broker `events`, the routes/publishes/consumes edges) is conveyed via the `title`
   and refined with `repair_drawing`/`suggest_architecture_improvements` afterward — the topology
   skeleton (gateway top, service+store grid, broker spine) comes from `pattern: "microservices"`.
3. `add_library_items_normalized` — `database-symbol` per store, `broker-kafka` for `events`,
   service glyphs per service (as in Example A).
4. Quality loop: `lint_drawing` -> `score_drawing` (e.g. `86`) -> `repair_drawing` for any
   `ARROW_TEXT_INTERSECTION` on crossed pub/sub lines -> re-lint/re-score to `>= 95`,
   `hardBlockers == []`. Rollback any pass that lowers the score.
5. `auto_polish_drawing` -> `validate_architecture` -> `suggest_architecture_improvements`
   -> `save_drawing({ title: "Catalog Platform — System Design" })` -> `save_version`
   -> `get_drawing_url` -> `export_drawing`.

---

## Example C — No analysis object accepted, zone+flow prompt (fallback B)

**Request**: "I have the analysis as notes, not the JSON the tool wants. Draw it anyway."

**Ordered calls**
1. `read_mcp_guide()`.
2. Generate (ONE path — prompt):
   ```json
   create_diagram_from_prompt({
     "diagramType": "architecture",
     "preset": "architecture",
     "direction": "TB",
     "prompt": "System design from repo analysis. Zones: Client (Customer, Web SPA), Edge (API Gateway), Services (Orders, Billing, Auth), Async (Kafka topic 'order-events' + Fulfillment Worker), Data (Postgres 'Orders DB', Redis 'Cache'), External (Stripe, SendGrid), Cross-cutting (OAuth via Auth0, OTel/Grafana). Request flow f1: Customer -> Web SPA -> API Gateway -> Orders -> Orders DB. Event flow f2: Orders -> Kafka -> Fulfillment Worker -> SendGrid. Frame each zone, route request flows solid and event flows dashed, add a zone legend. No secrets.",
     "autoPolish": true,
     "save": true,
     "name": "OrderFlow — System Design (from notes)"
   })
   ```
   -> `{ drawingId: "draw_prompt_sysdesign" }`.
3. Library vetting + `add_library_items_normalized` (db symbol, broker, logos, actor) as Example A.
4. Quality loop -> `auto_polish_drawing` -> `validate_architecture` ->
   `save_drawing({ title: "OrderFlow — System Design (from notes)" })` -> `save_version`
   -> `get_drawing_url` -> `export_drawing` -> re-scan export.

---

## Reusable argument fragments
- **Repo-analysis create**: `create_from_repo_analysis({ analysis, preset:"architecture", autoPolish:true, save:true, name:"<Repo> — System Design" })` — `analysis` holds `{ modules, entrypoints, database, services, integrations }`.
- **Microservices downshift**: `apply_architecture_skill({ pattern:"microservices", preset:"architecture", title:"<topology summary>" })` — `pattern` only; never `skill`/`level`.
- **Datastore slot**: `add_library_items_normalized({ libraryId, itemNames:["db-relational"], targetCardId:"<store>", placement:"database-symbol" })`.
- **Queue slot**: `add_library_items_normalized({ libraryId, itemNames:["broker-kafka"], targetCardId:"<queue>", placement:"inside-card-top" })`.
- **Integration logo (External zone)**: `add_library_items_normalized({ libraryId, itemNames:["logo-stripe"], targetCardId:"Stripe", placement:"badge" })`.
- **Flow step shape**: `{ "from": "<node>", "to": "<node>", "label": "<verb>", "protocol": "<proto>" }` — request flows solid, event flows dashed.
- **Validation gate**: `validate_architecture({ structure })` must return
  `integrationsInExternal == count(integrations)`, `orphans == []`, and both `requestFlows`/`eventFlows` counts matching the analysis.

See `./checklist.md`, `./anti-patterns.md`, and the shared references under `../../_shared/references/`.
