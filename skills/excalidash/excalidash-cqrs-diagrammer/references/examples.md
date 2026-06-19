# CQRS — Worked Examples

Each example shows: the request -> the plan line -> the ordered MCP tool calls with realistic
arguments -> the quality loop -> save/export. Secrets are redacted BEFORE any call.

---

## Example A — Order Service (build with the cqrs skill)

**Request**: "Diagram our Order Service with CQRS. Commands like PlaceOrder go through handlers to
the Order aggregate in Postgres, which emits OrderPlaced. A projection builds an order_summary read
model in Elasticsearch that the GetOrderSummary query serves. Show the write/read split and the
eventual consistency."

**Plan line**
```
TYPE=cqrs PRESET=architecture LIBRARY=curated[Software Architecture]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements
WRITE=Command->Handler->Aggregate->EventStore  READ=Bus->Projection->ReadModel->QueryHandler->Query
WRITE_STORE=Postgres  READ_STORE=Elasticsearch  BRIDGE=EventBus
```

**Ordered calls**

1. `read_mcp_guide()` -> note `MCP_LIBRARY_MODE = curated`, architecture preset, rubric.
2. `list_templates()` -> scan for `cqrs` / `command-query` (none reusable -> build with skill).
3. Library vetting:
   - `search_libraries({ q: "command handler service", mode: "curated", category: "Software Architecture" })`
   - `search_libraries({ q: "aggregate domain model", mode: "curated", category: "Software Architecture" })`
   - `search_libraries({ q: "event store bus queue", mode: "curated", category: "Software Architecture" })`
   - `search_libraries({ q: "projection transform", mode: "curated", category: "Software Architecture" })`
   - `search_libraries({ q: "database store", mode: "curated", category: "Database/Data Platform" })`
   - `inspect_library({ libraryId: "software-architecture", autoCache: true })`
   - `cache_library({ source: "software-architecture" })` (official allowlisted source only)
4. Generate (ONE path — preferred). `apply_architecture_skill` takes a `pattern` only, so seed the
   CQRS skeleton with the pattern and a descriptive title, then refine the exact command/event/query
   structure with `create_diagram_from_prompt`:
   ```json
   apply_architecture_skill({
     "pattern": "cqrs",
     "preset": "architecture",
     "title": "Order Service — CQRS (Command/Query Segregation)",
     "save": true,
     "name": "Order Service — CQRS"
   })
   ```
   -> emits the two-lane CQRS skeleton: the top write lane (left->right), the bottom read lane, the
   event store/bus between them with a single bus->projection bridge edge, and the write/read legend.
   Returns `{ drawingId: "draw_orders_cqrs" }`. Refine the concrete nodes/edges with:
   ```json
   create_diagram_from_prompt({
     "diagramType": "cqrs",
     "direction": "LR",
     "structure": {
       "nodes": [
         { "id": "cmd",   "label": "PlaceOrder (command)",                "lane": "write" },
         { "id": "ch",    "label": "PlaceOrderHandler",                    "lane": "write" },
         { "id": "agg",   "label": "Order aggregate / Write DB (Postgres, normalized)", "lane": "write" },
         { "id": "bus",   "label": "Event Store / Bus",                    "lane": "bridge" },
         { "id": "proj",  "label": "OrderSummaryProjection",              "lane": "read" },
         { "id": "rm",    "label": "order_summary / Read DB (Elasticsearch, denormalized)", "lane": "read" },
         { "id": "qh",    "label": "GetOrderSummaryHandler",              "lane": "read" },
         { "id": "qry",   "label": "GetOrderSummary (query)",            "lane": "read" }
       ],
       "edges": [
         { "from": "cmd", "to": "ch",   "label": "handles" },
         { "from": "ch",  "to": "agg",  "label": "applies" },
         { "from": "agg", "to": "bus",  "label": "emits OrderPlaced" },
         { "from": "bus", "to": "proj", "label": "eventually consistent" },
         { "from": "proj","to": "rm",   "label": "denormalizes" },
         { "from": "rm",  "to": "qh",   "label": "reads" },
         { "from": "qh",  "to": "qry",  "label": "answers" }
       ]
     },
     "save": true,
     "name": "Order Service — CQRS"
   })
   ```
5. Place icons (one normalized call per slot/card; `database-symbol` placement on BOTH stores so they
   read as distinct):
   ```json
   add_library_items_normalized({ "libraryId": "software-architecture", "itemNames": ["command-bus"],  "targetCardId": "cmd",  "placement": "badge",           "slotSize": 28, "save": false })
   add_library_items_normalized({ "libraryId": "software-architecture", "itemNames": ["svc-handler"], "targetCardId": "ch",   "placement": "inside-card-top", "slotSize": 32, "save": false })
   add_library_items_normalized({ "libraryId": "software-architecture", "itemNames": ["agg-root"],    "targetCardId": "agg",  "placement": "inside-card-top", "slotSize": 32, "save": false })
   add_library_items_normalized({ "libraryId": "database-data-platform", "itemNames": ["db-relational"], "targetCardId": "agg", "placement": "database-symbol", "slotSize": 32, "save": false })
   add_library_items_normalized({ "libraryId": "software-architecture", "itemNames": ["event-bus"],   "targetCardId": "bus",  "placement": "inside-card-top", "slotSize": 32, "save": false })
   add_library_items_normalized({ "libraryId": "software-architecture", "itemNames": ["projection"],  "targetCardId": "proj", "placement": "inside-card-top", "slotSize": 32, "save": false })
   add_library_items_normalized({ "libraryId": "database-data-platform", "itemNames": ["db-search"],   "targetCardId": "rm",  "placement": "database-symbol", "slotSize": 32, "save": false })
   add_library_items_normalized({ "libraryId": "software-architecture", "itemNames": ["query-svc"],   "targetCardId": "qh",   "placement": "inside-card-top", "slotSize": 32, "save": true })
   ```
6. Quality loop:
   - `lint_drawing({ id: "draw_orders_cqrs" })` -> `hardBlockers: ["ARROW_TEXT_INTERSECTION"]` (the
     "eventually consistent" label on the bus->OrderSummaryProjection line sits under the arrow).
   - `score_drawing({ minimumScore: 95 })` -> `83` (penalties: ARROW_TEXT_INTERSECTION, HIGH_DENSITY
     where the bus, the two stores, and the projection crowd the center-right).
   - `save_version({ id: "draw_orders_cqrs" })` (rollback target).
   - `repair_drawing({ save: true, createVersion: true, name: "repair: route eventually-consistent label into inter-lane gutter, 32px clearance; keep endpoints fixed" })`.
   - `repair_drawing({ save: true, createVersion: true, name: "repair: widen write/read lane gap to >= 64px; push read store right off the bus" })`.
   - re-`lint_drawing({ id: "draw_orders_cqrs" })` -> `hardBlockers: []`; re-`score_drawing({ minimumScore: 95 })` -> `96`.
7. `auto_polish_drawing({ minimumScore: 95, maxAttempts: 3, save: true })` -> re-`score_drawing({ minimumScore: 95 })`
   -> `97` (no regression; lanes still separate, projection edge still dashed/eventual — keep).
8. `validate_architecture({ structure })` (pass the current CQRS structure) ->
   `{ ok: true, lanes: 2, writeModel: "Order aggregate", readModels: ["order_summary"], sharedModel: false, commandReadsReadModel: false, queryWritesWriteModel: false, bridgeEdges: ["EventStore->OrderSummaryProjection"], orphanProjections: [] }`.
9. `suggest_architecture_improvements({ structure })` -> "order_summary is fed by
   OrderSummaryProjection — good; consistency annotated. No fix." (reviewed, nothing to apply).
10. `save_drawing({ id: "draw_orders_cqrs", name: "Order Service — CQRS (Command/Query Segregation)" })`.
11. `save_version({ id: "draw_orders_cqrs" })`.
12. `get_drawing_url({ id: "draw_orders_cqrs" })` -> share link; `export_drawing({ id: "draw_orders_cqrs", format: "svg" })`
    -> re-scan export for secrets (none; store labels are tech names only). Done.

---

## Example B — Reverse-engineer a repo into CQRS (repo-analysis path)

**Request**: "Generate a CQRS diagram from our `inventory` service repo so we can see whether the
command and query sides really use separate models or have leaked into one."

**Plan line**
```
TYPE=cqrs PRESET=architecture LIBRARY=curated[Software Architecture]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements
SOURCE=/repos/inventory  STRATEGY=repo-analysis
```

**Ordered calls**
1. `read_mcp_guide()`.
2. Generate (ONE path — repo analysis). Pre-classify the repo by naming/message types
   (`...CommandHandler`/`handle(Command)` -> write lane; `@AggregateRoot`/`apply(` -> write model;
   `...Projection`/`on(Event)` -> projections; read-side repositories/views -> read model;
   `...QueryHandler`/`handle(Query)` -> query handlers; `EventStore`/`Kafka`/`appendToStream` ->
   bridge), then pass the structured analysis:
   ```json
   create_from_repo_analysis({
     "analysis": {
       "modules": ["PlaceStockCommandHandler", "StockItem (aggregate)", "StockLevelsProjection", "GetStockLevelsHandler"],
       "entrypoints": ["commandBus", "queryBus"],
       "database": "StockItem write store (Postgres) + stock_levels read store",
       "services": ["command-side", "query-side"],
       "integrations": ["Kafka / EventStore"]
     },
     "save": true,
     "name": "Inventory — CQRS"
   })
   ```
   -> classifies code into the write lane (command handlers + StockItem aggregate), the event store,
   and the read lane (projections + stock_levels read model + query handlers). Returns
   `{ drawingId: "draw_inventory_cqrs", warnings: ["GetStockLevelsHandler reads from StockItemRepository (write store)"] }`.
3. The warning is a **segregation violation** surfaced from code: a QUERY handler reads the WRITE
   store. Fix in the diagram — route GetStockLevelsHandler to the `stock_levels` READ model only, and
   ensure a projection feeds that read model from the bus (record the code smell for the team).
4. Library vetting + `add_library_items_normalized` (svc-handler on handlers, agg-root on the
   aggregate, event-bus on the store, projection on the projector, two `database-symbol` icons for
   the write and read stores) as in Example A.
5. Quality loop: `lint_drawing` -> `score_drawing` (e.g. `87`) -> `repair_drawing` for any
   `ITEM_OUTSIDE_FRAME` (a converted node clipping its lane band) and the re-pointed query edge ->
   re-lint/re-score until `>= 95` and `hardBlockers == []`. Rollback any pass that lowers it.
6. `auto_polish_drawing({ minimumScore: 95 })` -> `validate_architecture({ structure })` (expect
   `queryWritesWriteModel: false` and `commandReadsReadModel: false` AFTER the fix; `sharedModel:
   false`) -> `suggest_architecture_improvements({ structure })` (flags the original cross-lane read;
   mark resolved) -> `save_drawing({ id: "draw_inventory_cqrs", name: "Inventory — CQRS (Command/Query Segregation)" })`
   -> `save_version({ id: "draw_inventory_cqrs" })` -> `get_drawing_url({ id: "draw_inventory_cqrs" })`
   -> `export_drawing({ id: "draw_inventory_cqrs", format: "svg" })`.

---

## Example C — Convert an Event-Driven drawing + dual-store secret redaction

**Request**: "We have an event-driven drawing of the Billing service. Reshape it into a CQRS view so
the write and read models are explicit. The write DB is
`postgres://billing_w:<password>@wdb.internal/billing`, the read DB is
`postgres://billing_r:<password>@rdb.internal/billing_read`, and the event bus uses Kafka SASL
`svc:<password>@broker:9092`."

**Redaction first** (BEFORE any tool call):
- Write DB URL -> `postgres://billing_w:[REDACTED_DATABASE_URL]@wdb.internal/billing`.
- Read DB URL -> `postgres://billing_r:[REDACTED_DATABASE_URL]@rdb.internal/billing_read`.
- Kafka SASL -> `svc:[REDACTED_PROXY_SECRET]@broker:9092`.

**Plan line**
```
TYPE=cqrs PRESET=architecture
LIBRARY=required[Software Architecture, Database/Data Platform, Technology Logos]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements
SOURCE=draw_billing_eda  STRATEGY=convert
```

**Ordered calls**
1. `read_mcp_guide()` -> `MCP_LIBRARY_MODE = required` (both stores MUST use db symbols; Postgres MUST
   use its logo; the bus MUST use the Kafka logo / queue glyph).
2. `search_libraries`/`inspect_library`/`cache_library` for: svc-handler, agg-root, projection,
   db-relational (Postgres) x2, Kafka logo / event-bus, query-svc.
3. Generate (ONE path — convert, preferred when an event-driven drawing exists). Pass the existing
   drawing's `structure` so producers map to the write lane, the broker to the bridge, and consumers
   to the read lane:
   ```json
   convert_diagram_type({
     "structure": {
       "nodes": [
         { "id": "p",  "label": "BillingCommandHandler (producer)", "lane": "write" },
         { "id": "br", "label": "Kafka (SASL/SSL) — Event Store / Bus", "lane": "bridge" },
         { "id": "c",  "label": "InvoiceProjection (consumer)", "lane": "read" },
         { "id": "wdb","label": "postgres://billing_w:[REDACTED_DATABASE_URL]@wdb.internal/billing", "lane": "write" },
         { "id": "rdb","label": "postgres://billing_r:[REDACTED_DATABASE_URL]@rdb.internal/billing_read", "lane": "read" }
       ],
       "edges": [
         { "from": "p",  "to": "br", "label": "emits" },
         { "from": "br", "to": "c",  "label": "eventually consistent" }
       ]
     },
     "targetType": "cqrs",
     "preset": "architecture",
     "save": true,
     "name": "Billing — CQRS"
   })
   ```
   -> the producers collapse into the write lane (commands + handlers + aggregate), the broker
   becomes the bridge event store, and the consumers become read-lane projections feeding the read
   model; the two stores surface as distinct nodes. Returns `{ drawingId: "draw_billing_cqrs" }`.
4. `add_library_items_normalized` — required-mode placements: `database-symbol` + Postgres logo
   (`inside-card-left`) on BOTH the write store (labelled
   `postgres://billing_w:[REDACTED_DATABASE_URL]@wdb.internal/billing`) and the read store (labelled
   `postgres://billing_r:[REDACTED_DATABASE_URL]@rdb.internal/billing_read`); a Kafka logo / queue
   glyph on the event bus (labelled `Kafka (SASL/SSL)` with a key icon for
   `svc:[REDACTED_PROXY_SECRET]@broker:9092`); svc-handler/agg-root/projection/query-svc glyphs on
   their cards.
5. Quality loop: `lint_drawing` (expect `FRAME_TITLE_OVERLAP` where the old "Producers" / "Consumers"
   headers collide with the new "Write (Command) Path" / "Read (Query) Path" lane headers) ->
   `score_drawing` -> `repair_drawing` (drop the stale event-driven headers; reserve each lane's
   title band) -> re-lint/re-score to `>= 95`, `hardBlockers == []`. Rollback on any drop.
6. `auto_polish_drawing` -> `validate_architecture` (two distinct stores; `sharedModel: false`;
   bridge edge bus->projection only; no command->read, no query->write) ->
   `suggest_architecture_improvements` (apply accepted).
7. `save_drawing({ id: "draw_billing_cqrs", name: "Billing — CQRS (Command/Query Segregation)" })` ->
   `save_version({ id: "draw_billing_cqrs" })` -> `get_drawing_url({ id: "draw_billing_cqrs" })`.
8. `export_drawing({ id: "draw_billing_cqrs", format: "png" })` -> **re-scan export**: confirm BOTH store passwords read
   `[REDACTED_DATABASE_URL]` and the Kafka card reads `[REDACTED_PROXY_SECRET]` in the rendered
   labels, not the real values. Done.

---

## Reusable argument fragments
- **Two-lane layout intent**: WRITE lane top (left->right), READ lane bottom, event bus/store
  center-right as the single bridge, >= 32px arrow gutters — convey via the `direction`/`structure`
  (lane tags) passed to `create_diagram_from_prompt` / `convert_diagram_type`.
- **Bridge edge (eventual)**: the single cross-lane edge is `EventStore -> <Projection>` annotated
  `"eventually consistent"` (dashed); nothing else crosses between lanes.
- **Distinct stores**: `add_library_items_normalized({ libraryId: "database-data-platform", itemNames: ["db-relational"], targetCardId: "<write store>", placement: "database-symbol" })`
  AND `add_library_items_normalized({ libraryId: "database-data-platform", itemNames: ["db-search"], targetCardId: "<read store>", placement: "database-symbol" })` — two symbols.
- **Segregation check**: `validate_architecture({ structure })` must return `sharedModel == false`,
  `commandReadsReadModel == false`, `queryWritesWriteModel == false`, and `orphanProjections == []`.

See `./checklist.md`, `./anti-patterns.md`, and the shared references under `../../_shared/references/`.
