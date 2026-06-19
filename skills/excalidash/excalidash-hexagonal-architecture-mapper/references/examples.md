# Hexagonal (Ports & Adapters) — Worked Examples

Each example shows: the request -> the plan line -> the ordered MCP tool calls with realistic
arguments -> the quality loop -> save/export. Secrets are redacted BEFORE any call.

---

## Example A — Order Service (build with the hexagonal skill)

**Request**: "Map our Order Service as ports & adapters. A REST controller and a Kafka consumer
drive it; it persists orders in Postgres, charges via Stripe, and emails confirmations via
SendGrid. Show the ports and prove dependencies point into the domain."

**Plan line**
```
TYPE=hexagonal PRESET=architecture
LIBRARY=curated[Software Architecture, Architecture diagram components]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements
CORE=OrderService  DRIVING_PORTS=2  DRIVEN_PORTS=3  DRIVING_ADAPTERS=2  DRIVEN_ADAPTERS=3
```

**Ordered calls**

1. `read_mcp_guide()` -> note `MCP_LIBRARY_MODE = curated`, architecture preset, rubric.
2. `list_templates()` -> scan for `hexagonal` / `ports-and-adapters` (none reusable -> build with skill).
3. Library vetting:
   - `search_libraries({ q: "port plug interface", mode: "curated", category: "Software Architecture" })`
   - `search_libraries({ q: "repository database", mode: "curated", category: "Database/Data Platform" })`
   - `search_libraries({ q: "message consumer queue", mode: "curated", category: "Software Architecture" })`
   - `inspect_library({ libraryId: "software-architecture", autoCache: true })`
   - `cache_library({ libraryId: "software-architecture" })`
4. Generate (ONE path — preferred). Pass the app name and the ports/adapters detail through
   `title`; the hexagonal skeleton lays out the core, lanes, port stubs and legend:
   ```json
   apply_architecture_skill({
     "pattern": "hexagonal",
     "preset": "architecture",
     "title": "Order Service — core (Order, Money, PlaceOrderService); driving ports PlaceOrderUseCase, OrderQuery; driven ports OrderRepository, PaymentGateway, NotificationPort",
     "autoPolish": false,
     "save": false
   })
   ```
   -> emits the hexagon core, the left driving lane, the right driven lane, port stubs on the
   boundary, and the driving/driven legend. Returns `{ drawingId: "draw_orders_hex" }`. If you need
   to pin exact adapter cards and crossings, use the structural fallback instead:
   `create_diagram_from_prompt({ diagramType: "hexagonal", structure: { nodes: ["REST OrderController",
   "Kafka OrderConsumer", "OrderService core", "OrderRepository", "PaymentGateway", "NotificationPort",
   "JpaOrderRepository", "StripePaymentClient", "SendGridMailer"], edges: [["REST OrderController",
   "PlaceOrderUseCase"], ["JpaOrderRepository", "OrderRepository"]] }, title: "Order Service — Hexagonal" })`.
5. Place icons (port/plug badges, adapter glyphs, db symbol; one card per `targetCardId`):
   ```json
   add_library_items_normalized({
     "libraryId": "software-architecture",
     "itemNames": ["port-plug"],
     "targetCardId": "PlaceOrderUseCase",
     "placement": "badge",
     "save": false
   })
   ```
   Repeat per port stub (`OrderQuery`, `OrderRepository`, `PaymentGateway`, `NotificationPort`),
   and place `svc-controller`/`queue-consumer` glyphs on the driving cards and a `db-relational`
   item on `JpaOrderRepository` (DB driven adapter), normalizing scale and preserving aspect.
6. Quality loop:
   - `lint_drawing({ id: "draw_orders_hex" })` -> `hardBlockers: ["ARROW_TEXT_INTERSECTION"]`
     ("implements" label on the StripePaymentClient -> PaymentGateway line sits under the arrow).
   - `score_drawing({ minimumScore: 95 })` -> `84` (penalties: ARROW_TEXT_INTERSECTION, HIGH_DENSITY
     on the right column).
   - `save_version({ id: "draw_orders_hex" })` (rollback target).
   - `repair_drawing({ save: true, createVersion: true, name: "fix arrow-text + density" })` —
     route the 'implements' label into the right-lane gutter with 32px clearance and widen the gap
     between the three driven adapters to >= 48px; keep endpoints fixed.
   - re-`lint_drawing` -> `hardBlockers: []`; re-`score_drawing` -> `96`.
7. `auto_polish_drawing({ minimumScore: 95, maxAttempts: 3, save: true })` -> re-`score_drawing` ->
   `97` (no regression; keep).
8. `validate_architecture({ structure })` ->
   `{ ok: true, core: "Order Service", drivingAdaptersLeft: 2, drivenAdaptersRight: 3, unboundPorts: [], outwardEdges: [], frameworkInCore: false, orphans: [] }`.
9. `suggest_architecture_improvements({ structure })` -> "Kafka OrderConsumer and REST
   OrderController both call PlaceOrderUseCase — good; no fix." (reviewed, nothing to apply).
10. `save_drawing({ id: "draw_orders_hex", name: "Order Service — Hexagonal (Ports & Adapters)" })`.
11. `save_version({ id: "draw_orders_hex" })`.
12. `get_drawing_url({ id: "draw_orders_hex" })` -> share link; `export_drawing({ id: "draw_orders_hex", format: "svg" })`
    -> re-scan export for secrets (none; tech labels only). Done.

---

## Example B — Reverse-engineer a repo into a hexagon (repo-analysis path)

**Request**: "Generate a ports & adapters diagram from our `billing` service repo so we can see
whether infrastructure has leaked into the domain."

**Plan line**
```
TYPE=hexagonal PRESET=architecture LIBRARY=curated[...]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements
SOURCE=/repos/billing  STRATEGY=repo-analysis
```

**Ordered calls**
1. `read_mcp_guide()`.
2. Generate (ONE path — repo analysis). Build the `analysis` object from the package scan: domain
   modules feed the core, entrypoints become driving (left) adapters, and database/services/
   integrations become driven (right) adapters:
   ```json
   create_from_repo_analysis({
     "analysis": {
       "modules": ["domain.invoice", "application.billing", "usecase.charge"],
       "entrypoints": ["web.rest.BillingController", "cli.BillingCli", "messaging.BillingConsumer"],
       "database": "PostgreSQL",
       "services": ["ChargeInvoiceService", "RefundService"],
       "integrations": ["Stripe", "SendGrid"]
     },
     "preset": "architecture",
     "save": false
   })
   ```
   -> classifies modules into core / driving adapters (left) / driven adapters (right) and labels
   the ports between them. Returns `{ drawingId: "draw_billing_hex", warnings: ["domain.invoice imports adapter.out.jpa.JpaInvoiceRepository"] }`.
3. The warning is an **inversion violation** surfaced from the code: the domain imports a driven
   adapter. Fix in the diagram — make the core depend on the `InvoiceRepository` driven *port* and
   have `JpaInvoiceRepository` implement it (record the code smell for the team).
4. Library vetting + `add_library_items_normalized` (port-plug badges on each port, database-symbol
   for the JPA repository) as in Example A.
5. Quality loop: `lint_drawing` -> `score_drawing` (e.g. `88`) -> `repair_drawing` for any
   `ITEM_OUTSIDE_FRAME` (a converted adapter clipping its lane edge) and the re-pointed inversion
   edge -> re-lint/re-score until `>= 95` and `hardBlockers == []`. Rollback any pass that lowers it.
6. `auto_polish_drawing` -> `validate_architecture` (expect `outwardEdges: []` after the fix;
   `frameworkInCore: false`) -> `suggest_architecture_improvements` (flags the original leak; mark
   resolved) -> `save_drawing({ title: "Billing — Hexagonal (Ports & Adapters)" })` ->
   `save_version` -> `get_drawing_url` -> `export_drawing`.

---

## Example C — Convert a Clean drawing + driven-side secret redaction

**Request**: "We have a Clean Architecture drawing of the Wallet service. Reshape it into a ports
& adapters hexagon. The Postgres repository connects to
`postgres://wallet:<password>@db.internal/wallet` and the webhook adapter verifies with secret
`whsec_<entropy>`."

**Redaction first** (BEFORE any tool call):
- DB URL -> `postgres://wallet:[REDACTED_DATABASE_URL]@db.internal/wallet`.
- Webhook secret -> `[REDACTED_WEBHOOK_SECRET]`.

**Plan line**
```
TYPE=hexagonal PRESET=architecture
LIBRARY=required[Software Architecture, Architecture diagram components, Technology Logos]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements
SOURCE=draw_wallet_clean  STRATEGY=convert
```

**Ordered calls**
1. `read_mcp_guide()` -> `MCP_LIBRARY_MODE = required` (DB adapter MUST use db symbol; Postgres and
   Stripe MUST use logos; every port MUST carry a plug glyph).
2. `search_libraries`/`inspect_library`/`cache_library` for: port-plug, db-relational (Postgres),
   webhook/receiver glyph, Postgres logo, Stripe logo.
3. Generate (ONE path — convert, preferred when a Clean drawing exists). Pass the existing Clean
   drawing's `structure`; the target shape reorganizes rings into the hexagon's regions:
   ```json
   convert_diagram_type({
     "structure": { "nodes": ["Wallet domain", "ChargeUseCase", "Inbound REST", "Webhook Receiver", "Postgres WalletRepository", "Stripe client"], "edges": [["Inbound REST", "ChargeUseCase"], ["Postgres WalletRepository", "WalletRepository"]] },
     "targetType": "hexagonal",
     "preset": "architecture",
     "name": "Wallet Service — Hexagonal",
     "save": false
   })
   ```
   -> the concentric rings flatten into a hexagon: domain/use-cases collapse into the core; inbound
   interface adapters move to the LEFT lane; outbound gateway/repository adapters move to the RIGHT
   lane; ports surface on the boundary. Returns `{ drawingId: "draw_wallet_hex" }`.
4. `add_library_items_normalized` — required-mode placements (one `targetCardId` per call): a
   `database-symbol` + Postgres logo on the 'Postgres WalletRepository' driven card (labelled
   `postgres://wallet:[REDACTED_DATABASE_URL]@db.internal/wallet`), a webhook glyph on the
   'Webhook Receiver' driving adapter (secret shown as a key icon labelled
   `[REDACTED_WEBHOOK_SECRET]`), `port-plug` badges on every port, Stripe logo on the payment client.
5. Quality loop: `lint_drawing` (expect `FRAME_TITLE_OVERLAP` where the old ring title collides with
   the new "Driven / Secondary" right header) -> `score_drawing` -> `repair_drawing` (drop the stale
   ring title; reserve the right lane's title band) -> re-lint/re-score to `>= 95`,
   `hardBlockers == []`. Rollback on any drop.
6. `auto_polish_drawing` -> `validate_architecture` (Postgres adapter on the RIGHT implementing
   'WalletRepository'; no outward edge from core; no framework logo inside the core) ->
   `suggest_architecture_improvements` (apply accepted).
7. `save_drawing({ title: "Wallet Service — Hexagonal (Ports & Adapters)" })` -> `save_version` ->
   `get_drawing_url`.
8. `export_drawing({ format: "png" })` -> **re-scan export**: confirm the Postgres password reads
   `[REDACTED_DATABASE_URL]` and the webhook card reads `[REDACTED_WEBHOOK_SECRET]` in the rendered
   labels, not the real values. Done.

---

## Reusable argument fragments
- **Driving/driven layout**: convey "driving adapters LEFT, driven adapters RIGHT, 32px arrow
  gutters" in the `apply_architecture_skill` / `create_diagram_from_prompt` `title` (the skeleton
  applies the lanes).
- **Port stub badge**: `add_library_items_normalized({ libraryId: "software-architecture", itemNames: ["port-plug"], targetCardId: "<PortName>", placement: "badge" })`.
- **DB driven adapter symbol**: `add_library_items_normalized({ libraryId: "database-data-platform", itemNames: ["db-relational"], targetCardId: "<repo adapter>", placement: "inside" })`.
- **Inversion check**: `validate_architecture({ structure })` must return
  `outwardEdges == []`, `frameworkInCore == false`, and `unboundPorts == []`.

See `./checklist.md`, `./anti-patterns.md`, and the shared references under `../../_shared/references/`.
