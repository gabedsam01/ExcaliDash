# Event-Driven Diagrammer — Examples

Each example shows: the request -> the plan line -> the ordered MCP tool calls with realistic
arguments -> the quality loop. The MCP prompt this skill maps to is
`/mcp__excalidash__excalidash_event_driven_diagrammer`. Exactly ONE create path runs per drawing.

---

## Example 1 — Order pipeline over Kafka (preferred: apply_architecture_skill)

**Request**: "Draw our event-driven order pipeline. OrderService, PaymentService and
InventoryService publish to Kafka; ShippingService, EmailService and an AnalyticsSink consume.
Make the async edges visually distinct from the one sync call to the carrier API."

**Plan line**:
`TYPE=event-driven PRESET=architecture LIBRARY=curated[Software Architecture, Technology Logos]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`

**Ordered calls**:
1. `read_mcp_guide()` — load presets, `MCP_LIBRARY_MODE`, rubric.
2. `list_templates()` — scan for an `event-driven` / `pub-sub` template (none required).
3. `search_libraries({ q: "kafka broker queue topic event store", mode: "core", limit: 12 })`
   -> `inspect_library({ libraryId: "tech-logos", autoCache: true })` -> `cache_library({ libraryId: "tech-logos" })`.
4. **Create (ONE path)**: scaffold the skeleton with the architecture pattern, then refine the named
   producers/topics/consumers with a prompt structure.
   ```
   apply_architecture_skill({
     pattern: "event-driven",
     title: "Order Pipeline — Event-Driven (OrderService/PaymentService/InventoryService -> Kafka -> ShippingService/EmailService/AnalyticsSink)",
     preset: "technical-docs",
     autoPolish: true,
     save: true,
     name: "Order Pipeline — Event-Driven Architecture"
   })
   ```
   When you need the exact topics and fan-out edges drawn, follow with an explicit structure (still
   ONE logical create for the drawing):
   ```
   create_diagram_from_prompt({
     diagramType: "event-driven",
     direction: "LR",
     title: "Order Pipeline — Event-Driven Architecture",
     structure: {
       nodes: [
         { id: "order",     label: "OrderService" },
         { id: "payment",   label: "PaymentService" },
         { id: "inventory", label: "InventoryService" },
         { id: "bus",       label: "Kafka (orders, payments, inventory)" },
         { id: "shipping",  label: "ShippingService" },
         { id: "email",     label: "EmailService" },
         { id: "analytics", label: "AnalyticsSink" },
         { id: "store",     label: "Kafka topic log (retention 7d)" },
         { id: "carrier",   label: "CarrierAPI (external)" }
       ],
       edges: [
         { from: "order",     to: "bus",      label: "OrderPlaced",      style: "dashed" },
         { from: "payment",   to: "bus",      label: "PaymentCaptured",  style: "dashed" },
         { from: "inventory", to: "bus",      label: "StockReserved",    style: "dashed" },
         { from: "bus",       to: "shipping", label: "OrderPlaced",      style: "dashed" },
         { from: "bus",       to: "email",    label: "OrderPlaced/PaymentCaptured", style: "dashed" },
         { from: "bus",       to: "analytics",label: "all topics",       style: "dashed" },
         { from: "bus",       to: "store",    label: "persist",          style: "solid" },
         { from: "shipping",  to: "carrier",  label: "fulfil (request/response)", style: "solid" }
       ]
     }
   })
   ```
   Capture `drawingId`. All producer->bus and bus->consumer edges emitted as `style: "dashed"`.
5. `add_library_items_normalized({ libraryId: "tech-logos", scene, itemNames: ["kafka"], targetCardId: "bus", placement: "inside-card-top", slotSize: 32, save: true })`,
   then a `badge` topic marker on each topic stub and a `database-symbol` on the event store.
6. `lint_drawing({ id: drawingId })` -> `hardBlockers: ["ARROW_TEXT_INTERSECTION at topic 'payments'"]`.
7. `score_drawing({ minimumScore: 95 })` -> `82` (penalty: fan-out lines crossing the 'payments' label).
8. `repair_drawing({ save: true, createVersion: true })`
   -> re-lint (`hardBlockers: []`) -> re-score (`96`).
9. `auto_polish_drawing({ minimumScore: 95 })` -> re-score `97` (no regression; dashed edges intact).
10. `validate_architecture({ structure })` -> clean: one Kafka hub, producers LEFT, consumers RIGHT,
    no direct producer->consumer edge, every topic has a producer and a consumer.
11. `suggest_architecture_improvements({ structure })` -> "Add a DLQ for ShippingService (at-least-once)."
    Accept -> add DLQ node -> re-lint -> re-score `96`.
12. `save_drawing({ id: drawingId, name: "Order Pipeline — Event-Driven Architecture" })` ->
    `save_version({ id: drawingId })` -> `get_drawing_url({ id: drawingId })` -> `export_drawing({ id: drawingId, format: "svg" })`.

**Result**: score 97, hardBlockers []; dashed async fan-out from Kafka, one solid sync edge to CarrierAPI,
legend keys both, DLQ added.

---

## Example 2 — Reverse-engineer pub-sub from a repo (create_from_repo_analysis)

**Request**: "We have a Spring Boot monorepo using `@KafkaListener` and `kafkaTemplate.send`.
Reverse-engineer the event-driven diagram — who publishes what, who consumes what."

**Plan line**:
`TYPE=event-driven PRESET=architecture LIBRARY=curated[Software Architecture, Technology Logos]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`

**Ordered calls**:
1. `read_mcp_guide()`.
2. **Create (ONE path)**: scan the repo for messaging-client calls (producers: `kafkaTemplate.send`,
   `producer.send`, `.publish(`, `sns.publish`, `eventbridge.putEvents`; consumers: `@KafkaListener`,
   `@SqsListener`, `@RabbitListener`, `subscribe(`, `.onMessage(`; topics: `@KafkaListener(topics`,
   `topics =`, `TopicBuilder`, `eventBus`, `exchange`), then fold the findings into the `analysis`
   object:
   ```
   create_from_repo_analysis({
     analysis: {
       modules:      ["order-service", "payment-service", "shipping-service", "email-service"],
       entrypoints:  ["OrderController", "PaymentController"],
       database:     "PostgreSQL",
       services:     ["OrderService (publishes OrderPlaced)", "PaymentService (publishes PaymentCaptured)", "ShippingService (@KafkaListener OrderPlaced)", "EmailService (@KafkaListener OrderPlaced)"],
       integrations: ["Kafka (orders, payments)", "CarrierAPI"]
     },
     save: true,
     name: "Order Platform — Event-Driven Architecture"
   })
   ```
   Capture `drawingId`. Classify discovered components: producers LEFT, consumers RIGHT, topics on the bus.
3. (Optional) `convert_diagram_type({ structure, targetType: "event-driven" })` if the analysis came
   back as a flat container view — reshapes it into the producers/bus/consumers topology.
4. `add_library_items_normalized(...)` — Kafka logo on the bus, topic badges, event-store symbol.
5. `lint_drawing` -> `score_drawing` -> `repair_drawing` loop until `score >= 95` and `hardBlockers == []`.
6. `validate_architecture` -> finds `OrderPlaced` produced but never consumed (orphan topic).
   `suggest_architecture_improvements` -> "Orphan topic 'OrderPlaced': no consumer found — confirm a
   subscriber exists or mark deprecated." Resolve, re-lint, re-score.
7. `save_drawing` -> `save_version` -> `get_drawing_url` -> `export_drawing`.

---

## Example 3 — AWS SNS/SQS fan-out (create_diagram_from_prompt) with redaction

**Request**: "Diagram our SNS -> SQS fan-out. The publisher uses access key `<access key>` and the broker
config has `sasl: svc:<password>@broker:9092`."

**Redaction first** (BEFORE any tool call): `<access key>` -> `[REDACTED_PROVIDER_KEY]`;
`sasl: svc:<password>@broker:9092` -> `sasl: svc:[REDACTED_PROXY_SECRET]@broker:9092`.

**Plan line**:
`TYPE=event-driven PRESET=architecture LIBRARY=curated[Software Architecture, Technology Logos]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`

**Ordered calls**:
1. `read_mcp_guide()`.
2. **Create (ONE path)**:
   ```
   create_diagram_from_prompt({
     diagramType: "event-driven",
     prompt: "SNS/SQS fan-out. Producer 'CheckoutService' publishes 'OrderEvent' to SNS topic
              'order-events' (dashed async). SNS fans out to three SQS queues: 'shipping-queue',
              'email-queue', 'analytics-queue' (dashed async). Consumers (RIGHT, dashed async from
              their queue): 'ShippingWorker', 'EmailWorker', 'AnalyticsWorker'. Event store:
              'S3 event archive' (solid persist from SNS). Credentials shown as redacted labels:
              broker 'sasl: svc:[REDACTED_PROXY_SECRET]@broker:9092', client key
              '[REDACTED_PROVIDER_KEY]'. Legend: solid = synchronous, dashed = asynchronous."
   })
   ```
3. `add_library_items_normalized(...)` — SNS + SQS logos (Technology Logos) on the bus/queues, S3
   logo on the event store.
4. `lint_drawing` -> `score_drawing` -> `repair_drawing` loop -> `score >= 95`, `hardBlockers == []`.
5. `validate_architecture` -> confirm SNS is the single hub, three queues fan out, each worker
   consumes exactly its queue, no producer->consumer shortcut.
6. `save_drawing` -> `save_version` -> `get_drawing_url` -> `export_drawing`.
7. **Re-scan the export**: no raw key, no SASL password — only `[REDACTED_*]` placeholders.

---

## Notes shared across examples
- The five create paths are mutually exclusive — pick exactly one. Prefer
  `apply_architecture_skill({ pattern: "event-driven" })`; use `create_from_repo_analysis` for a codebase.
- The lint -> score -> repair loop is mandatory and repeats until `score >= 95` AND `hardBlockers == []`.
- Roll back any repair/polish pass that lowers the score (restore the last `save_version`).
- Async edges are DASHED, sync edges are SOLID, and the legend MUST key both — verify after polish.
- Redact secrets before tool calls and re-scan the export. See `../../_shared/references/security-redaction.md`.
