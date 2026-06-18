# Microservices Topology — Examples

Each example shows: the request -> the plan line -> the ordered MCP tool calls with realistic
arguments -> the quality loop. The MCP prompt this skill maps to is
`/mcp__excalidash__excalidash_microservices_topology`. Exactly ONE create path runs per drawing.

---

## Example 1 — Order platform behind Kong (preferred: apply_architecture_skill, then a structured prompt for detail)

**Request**: "Draw our microservices. A Kong gateway fronts OrderService, PaymentService,
InventoryService and UserService. Each service has its own database. OrderService publishes events to
RabbitMQ that Inventory and Shipping consume. Show which calls are sync vs async."

**Plan line**:
`TYPE=microservices PRESET=architecture LIBRARY=curated[Software Architecture, Cloud/DevOps, Technology Logos]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`

**Ordered calls**:
1. `read_mcp_guide()` — load presets, `MCP_LIBRARY_MODE`, rubric.
2. `list_templates()` — scan for a `microservices` / `service-topology` template (none required).
3. `search_libraries({ q: "api gateway service database redis cache rabbitmq queue", mode: "curated", category: "architecture", limit: 20 })`
   -> `inspect_library({ libraryId: "tech-logos/kong", autoCache: true })` -> `cache_library({ libraryId: "tech-logos" })` (official allowlisted source only; vet Kong/Postgres/MySQL/Redis/RabbitMQ, sw-arch service, db cylinder).
4. **Create (ONE path)** — `apply_architecture_skill` lays down the microservices skeleton (gateway TOP,
   services ROW, per-service stores, frames, bus, sync/async legend); the gateway/service/store/bus
   detail is carried in the `title` and (when you need explicit nodes/edges) a `create_diagram_from_prompt`
   `structure`. There is NO `skill`/`level`/`spec` argument — `apply_architecture_skill` takes only
   `{ pattern, preset?, title?, save?, name?, autoPolish? }`:
   ```
   apply_architecture_skill({
     pattern: "microservices",
     preset: "technical-docs",
     title: "Order Platform — Microservices Topology",
     save: true,
     name: "Order Platform — Microservices Topology"
   })
   ```
   If you need the exact services, stores and edge styles materialised as nodes/edges, build the
   structure with `create_diagram_from_prompt` instead (one create path total — use this OR the skeleton above):
   ```
   create_diagram_from_prompt({
     diagramType: "microservices",
     title: "Order Platform — Microservices Topology",
     direction: "TB",
     structure: {
       nodes: [
         { id: "gateway", label: "Kong gateway (auth + rate-limit)" },
         { id: "order",   label: "OrderService" },     { id: "orders-db",    label: "orders-db (Postgres)" },
         { id: "payment", label: "PaymentService" },   { id: "payments-db",  label: "payments-db (Postgres)" },
         { id: "invent",  label: "InventoryService" }, { id: "inventory-db", label: "inventory-db (MySQL)" },
         { id: "user",    label: "UserService" },      { id: "users-db",     label: "users-db (Postgres) + Redis cache" },
         { id: "bus",     label: "RabbitMQ" }
       ],
       edges: [
         { from: "gateway", to: "order",   style: "solid", label: "HTTP" },
         { from: "gateway", to: "payment", style: "solid", label: "HTTP" },
         { from: "gateway", to: "invent",  style: "solid", label: "HTTP" },
         { from: "gateway", to: "user",    style: "solid", label: "HTTP" },
         { from: "order",   to: "payment", style: "solid", label: "gRPC" },
         { from: "order",   to: "orders-db",    style: "solid", label: "owns" },
         { from: "payment", to: "payments-db",  style: "solid", label: "owns" },
         { from: "invent",  to: "inventory-db", style: "solid", label: "owns" },
         { from: "user",    to: "users-db",     style: "solid", label: "owns" },
         { from: "order",   to: "bus",    style: "dashed", label: "OrderPlaced" },
         { from: "bus",     to: "invent", style: "dashed", label: "OrderPlaced" },
         { from: "bus",     to: "ship",   style: "dashed", label: "OrderPlaced" }
       ]
     },
     save: true,
     name: "Order Platform — Microservices Topology"
   })
   ```
   Capture `drawingId`. Gateway centered TOP, four services in a ROW, each store directly below its
   service inside its own frame, RabbitMQ along the bottom. All async edges emitted as `style: "dashed"`.
5. `add_library_items_normalized({ libraryId: "tech-logos", itemNames: ["kong","postgres","mysql","redis","rabbitmq"], targetCardId: "gateway", placement: "inside-card-top", slotSize: 32, save: true })`
   — one call per target card (Kong on the gateway as `cloud-provider`; Postgres/MySQL as `database-symbol`
   on `orders-db`/`inventory-db`; Redis as a `badge` on UserService; RabbitMQ on the bus). Aspect preserved, preset stroke/fill matched.
6. `lint_drawing({ id: drawingId })` -> `hardBlockers: ["ARROW_TEXT_INTERSECTION at store 'inventory-db'"]`.
7. `score_drawing({ minimumScore: 95 })` -> `83` (penalty: gateway fan-out line crossing the 'inventory-db' label).
8. `repair_drawing({ save: true, createVersion: true })` (reroute the fan-out line through the column gutter)
   -> re-lint (`hardBlockers: []`) -> re-score (`96`).
9. `auto_polish_drawing({ minimumScore: 95 })` -> re-score `97` (no regression; dashed edges intact, frames not merged).
10. `validate_architecture({ structure })` -> clean: one Kong hub fronting all services, every service
    owns exactly one store, no shared DB, async via RabbitMQ.
11. `suggest_architecture_improvements({ structure })` -> "InventoryService consumes at-least-once —
    add a DLQ." Accept -> add DLQ node off RabbitMQ -> re-lint -> re-score `96`.
12. `save_drawing({ id: drawingId, name: "Order Platform — Microservices Topology" })` ->
    `save_version({ id: drawingId })` -> `get_drawing_url({ id: drawingId })` -> `export_drawing({ id: drawingId, format: "svg" })`.

**Result**: score 97, hardBlockers []; Kong at top, four framed services each with its own DB, solid
gateway/gRPC edges, dashed RabbitMQ events, legend keys both, DLQ added.

---

## Example 2 — Reverse-engineer a topology from a repo (create_from_repo_analysis)

**Request**: "We have a polyglot monorepo with one folder per service, a `kong.yml`, and each service
has its own `DATABASE_URL`. Reverse-engineer the microservices topology — which service owns which DB,
who calls whom, what goes over Kafka."

**Plan line**:
`TYPE=microservices PRESET=architecture LIBRARY=curated[Software Architecture, Cloud/DevOps, Technology Logos]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`

**Ordered calls**:
1. `read_mcp_guide()`.
2. **Create (ONE path)**:
   ```
   create_from_repo_analysis({
     analysis: {
       modules:      ["catalog", "pricing", "checkout", "shipping"],
       entrypoints:  ["api-gateway (kong.yml)"],
       database:     ["catalog-db", "pricing-db", "checkout-db", "shipping-db"],
       services:     ["CatalogService", "PricingService", "CheckoutService", "ShippingService"],
       integrations: ["Kafka", "Redis"]
     },
     preset: "technical-docs",
     save: true,
     name: "Commerce Platform — Microservices Topology"
   })
   ```
   Build the `analysis` from the repo before the call: derive `modules`/`services` from deployable units
   (Dockerfile, `k8s/*.yaml`, `helm/`, `service.yaml`, `main.go`, `app.py`, `package.json`), `database`
   from each service's `DATABASE_URL` / `datasource.url` / `mongoUri` / migrations / `schema.prisma`,
   `entrypoints` from the gateway config (`kong.yml`, `ingress.yaml`, `nginx.conf`), and `integrations`
   from broker/cache usage (`kafka`, `amqp`, `sqs`, `nats`, `publish(`, `subscribe(`, `@KafkaListener`,
   `@RabbitListener`, `REDIS_URL`). Capture `drawingId`. Classify HTTP/gRPC as sync edges and Kafka
   publish/subscribe as async edges; Kong is the gateway.
3. (Optional) `convert_diagram_type({ structure, targetType: "microservices" })` if the analysis came
   back as a flat container view — reshapes it into the gateway/services-row/per-service-store topology.
4. `add_library_items_normalized(...)` — Kong logo on the gateway, runtime logos on services, vendor
   DB logos on each store, Kafka logo on the bus.
5. `lint_drawing` -> `score_drawing` -> `repair_drawing` loop until `score >= 95` and `hardBlockers == []`.
6. `validate_architecture` -> finds two services both connecting to `legacy-shared-db` (shared DB!).
   `suggest_architecture_improvements` -> "Shared database 'legacy-shared-db' violates
   database-per-service — split per service or expose one as the owner and the other via its API."
   Resolve (split into `catalog-db` and `pricing-db`, add an async event between them), re-lint, re-score.
7. `save_drawing` -> `save_version` -> `get_drawing_url` -> `export_drawing`.

---

## Example 3 — AWS-hosted services with redaction (create_diagram_from_prompt)

**Request**: "Diagram our AWS microservices. API Gateway fronts three Lambda-backed services, each
with its own RDS. Async over SQS. The order service config has
`postgres://app:<password>@orders.rds.amazonaws.com/orders` and a gateway key `[REDACTED_PROVIDER_KEY]`."

**Redaction first** (BEFORE any tool call):
`postgres://app:<password>@orders.rds.amazonaws.com/orders` -> `postgres://app:[REDACTED_DATABASE_URL]@orders.rds.amazonaws.com/orders`;
`<gateway provider key>` -> `[REDACTED_PROVIDER_KEY]`.

**Plan line**:
`TYPE=microservices PRESET=architecture LIBRARY=curated[Software Architecture, Cloud/DevOps, Technology Logos]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`

**Ordered calls**:
1. `read_mcp_guide()`.
2. **Create (ONE path)**:
   ```
   create_diagram_from_prompt({
     diagramType: "microservices",
     prompt: "AWS microservices topology. API gateway (TOP, single front door, solid arrows down):
              'AWS API Gateway'. Services (ROW, each in its own frame with its OWN RDS below):
              'OrderService' -> 'orders-db (RDS Postgres)'; 'PaymentService' -> 'payments-db (RDS
              Postgres)'; 'InventoryService' -> 'inventory-db (RDS MySQL)'. Async (dashed, through the
              bus): 'OrderService' publishes 'OrderPlaced' to SQS; 'InventoryService' consumes. Sync
              (solid): gateway -> each service. Queue (bottom): 'Amazon SQS'. Credentials shown as
              redacted labels: store 'postgres://app:[REDACTED_DATABASE_URL]@orders.rds.amazonaws.com/orders',
              gateway key '[REDACTED_PROVIDER_KEY]'. Legend: solid = synchronous (HTTP), dashed =
              asynchronous (queue). Database-per-service: no shared DB, no cross-service DB access."
   })
   ```
3. `add_library_items_normalized(...)` — AWS API Gateway, RDS, and SQS logos (Technology Logos /
   Cloud/DevOps) on the gateway, each store, and the bus.
4. `lint_drawing` -> `score_drawing` -> `repair_drawing` loop -> `score >= 95`, `hardBlockers == []`.
5. `validate_architecture` -> confirm AWS API Gateway is the single front door, three services each own
   exactly one RDS, no shared DB, async only through SQS, no service bypasses the gateway.
6. `save_drawing` -> `save_version` -> `get_drawing_url` -> `export_drawing`.
7. **Re-scan the export**: no raw DB password, no raw gateway key — only `[REDACTED_*]` placeholders.

---

## Notes shared across examples
- The five create paths are mutually exclusive — pick exactly one. Prefer
  `apply_architecture_skill({ pattern: "microservices" })`; use `create_from_repo_analysis` for a codebase.
- The lint -> score -> repair loop is mandatory and repeats until `score >= 95` AND `hardBlockers == []`.
- Roll back any repair/polish pass that lowers the score (restore the last `save_version`).
- Every service owns exactly one datastore (database-per-service); no shared DB, no cross-service DB access.
- Sync edges are SOLID (HTTP/gRPC), async edges are DASHED (queue/event), and the legend MUST key both —
  verify after polish that frames were not merged and no dashed edge was flipped to solid.
- Redact secrets (per-service DB URLs, gateway/broker creds) before tool calls and re-scan the export.
  See `../../_shared/references/security-redaction.md`.
