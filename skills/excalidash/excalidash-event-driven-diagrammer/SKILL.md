---
name: excalidash-event-driven-diagrammer
description: Use when you need to draw or review an event-driven / pub-sub / streaming architecture — producers (publishers) on the left emitting events through a central event bus / broker (Kafka, SQS/SNS, RabbitMQ, EventBridge) to consumers (subscribers) on the right, with an event store / topic log, dashed asynchronous arrows, and a legend that distinguishes synchronous from asynchronous edges.
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__apply_architecture_skill
  - mcp__excalidash__convert_diagram_type
  - mcp__excalidash__create_diagram_from_prompt
  - mcp__excalidash__create_from_repo_analysis
  - mcp__excalidash__list_templates
  - mcp__excalidash__create_from_template
  - mcp__excalidash__search_libraries
  - mcp__excalidash__inspect_library
  - mcp__excalidash__cache_library
  - mcp__excalidash__add_library_items_normalized
  - mcp__excalidash__lint_drawing
  - mcp__excalidash__score_drawing
  - mcp__excalidash__repair_drawing
  - mcp__excalidash__auto_polish_drawing
  - mcp__excalidash__validate_architecture
  - mcp__excalidash__suggest_architecture_improvements
  - mcp__excalidash__save_drawing
  - mcp__excalidash__save_version
  - mcp__excalidash__get_drawing_url
  - mcp__excalidash__export_drawing
---

# Event-Driven Diagrammer

## Objective
Produce or review an **event-driven architecture** diagram for ONE system: **producers
(publishers)** on the LEFT that emit events, a **central event bus / message broker** in the
MIDDLE (Kafka, AWS SNS/SQS, EventBridge, RabbitMQ, NATS, Pulsar) carrying named topics/streams,
**consumers (subscribers)** on the RIGHT that react to those events, and an **event store / topic
log** that persists the event history. The hard invariant is **async decoupling**: producer ->
bus and bus -> consumer edges are **dashed asynchronous** arrows (fire-and-forget, no return), while
the few remaining **synchronous** request/response edges are **solid** — and a **legend** must make
that distinction explicit. The result must score >= 95 with zero hard blockers, and
`validate_architecture` must confirm no producer talks to a consumer directly (everything flows
through the bus) and every event has at least one producer and one consumer.

## When to use / When NOT to use
**Use when**: the request is "draw/review our event-driven / pub-sub / event-streaming
architecture", "show how services publish and subscribe to Kafka topics", "diagram the SNS/SQS
fan-out", "map the EventBridge event flow", "where does this event get consumed?", "show the
producers, the broker, the consumers, and the event store", or "make the async edges visually
distinct from the sync calls".

**Use when**: a repository must be reverse-engineered — drive `create_from_repo_analysis`, then
classify components into producers (code that calls `.publish()`/`.send()`/`producer.send`),
consumers (`@KafkaListener`/`@SqsListener`/subscribe handlers), and the broker/topics they share.

**Do NOT use when**:
- The request is the runnable apps/APIs/datastores of one system with mostly synchronous calls ->
  use the **C4 Container** skill (use this skill only when the *event flow* is the subject).
- The request is one scenario's time-ordered messages with lifelines -> use a **sequence diagram**
  (event-driven shows the static topology; a sequence shows one ordered run).
- The request is split read/write command-query paths (commands -> write model, queries -> read
  model) -> use **CQRS** (related but distinct: CQRS is about the model split, this is about the bus).
- The request is bounded contexts / aggregates / a context map -> use a **DDD** skill.
- The request is a domain core with named ports and left/right adapters -> use **Hexagonal**.

## Expected input
A short description naming the system and, ideally, what lives in each region:
- **Producers / publishers (LEFT)** — services that emit events ("OrderService" emits
  `OrderPlaced`; "PaymentService" emits `PaymentCaptured`; "InventoryService" emits
  `StockReserved`). Optionally an external actor or webhook source.
- **Event bus / broker (CENTER)** — the transport and its named topics/streams/queues
  ("Kafka: orders, payments"; "SNS topic order-events"; "EventBridge bus default"). Name the
  broker product and the topic/queue names.
- **Consumers / subscribers (RIGHT)** — services that react ("ShippingService" consumes
  `OrderPlaced`; "EmailService" consumes `OrderPlaced` + `PaymentCaptured`; "AnalyticsSink"
  consumes everything). Note fan-out (one event, many consumers) and consumer groups.
- **Event store / log** — where the event history is durably kept (Kafka topic retention, an event
  store DB, an S3 archive). Mark it as the source of truth if event-sourced.
- **Sync edges (if any)** — the few synchronous request/response calls that are NOT through the bus
  (e.g. a consumer calling an external API to fulfil an event); these stay **solid**.
- **Delivery semantics** — at-least-once / exactly-once, ordering, retries, dead-letter queue (DLQ).
If a region is missing, infer the obvious placement and state the assumption; if the input is a
repo, derive producers/consumers/topics from the messaging client calls via `create_from_repo_analysis`.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, scoring rubric.
2. `mcp__excalidash__list_templates` — look for an `event-driven` / `pub-sub` / `streaming` template (optional).
3. `mcp__excalidash__search_libraries` -> `inspect_library` -> `cache_library` — vet broker, queue,
   topic/stream, event-store, and branded-broker logos (Kafka, SNS, SQS, RabbitMQ) from curated packs.
4. ONE create path:
   - `mcp__excalidash__apply_architecture_skill` with `pattern: "event-driven"` (preferred — emits the
     producers lane, the center bus with topic stubs, the consumers lane, the event store, dashed
     async edges, and the sync/async legend), OR
   - `mcp__excalidash__create_from_repo_analysis` to reverse-engineer producers/consumers/topics, OR
   - `mcp__excalidash__convert_diagram_type` with `targetType: "event-driven"` to reshape an existing
     container/flow drawing into a pub-sub topology, OR
   - `mcp__excalidash__create_diagram_from_prompt` with `diagramType: "event-driven"` and a topic spec, OR
   - `mcp__excalidash__create_from_template` with the `event-driven` template.
5. `mcp__excalidash__add_library_items_normalized` — place broker/queue/topic/event-store/logo icons.
6. `mcp__excalidash__lint_drawing` -> `score_drawing` -> `repair_drawing` (loop).
7. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
8. `mcp__excalidash__validate_architecture` — confirm pub-sub topology (no direct producer->consumer
   edge; every event has >= 1 producer and >= 1 consumer; the bus is the only hub).
9. `mcp__excalidash__suggest_architecture_improvements` — flag orphan topics, missing DLQ, a
   producer coupled directly to a consumer, an event with no consumer; apply accepted fixes then re-lint/re-score.
10. `mcp__excalidash__save_drawing` -> `save_version` -> `get_drawing_url` -> `export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=event-driven PRESET=architecture LIBRARY=curated[Software Architecture, Technology Logos]
   VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`.
   Confirm the regions (producers LEFT / bus CENTER with named topics / consumers RIGHT / event
   store) and label which edges are async (dashed) vs sync (solid). Redact any secret in the input
   (broker SASL creds, DB URL, API key, service-role, token, bearer, webhook/proxy secret) BEFORE
   it reaches a tool argument.
2. **Generate (one path only).**
   - Prefer `apply_architecture_skill({ pattern: "event-driven", title: "<System> — Event-Driven
     Architecture", autoPolish: true })` so the producers lane, the center bus with topic stubs, the
     consumers lane, the event store, the dashed async edges, and the sync/async legend come from the
     skeleton. Convey the producer/topic/consumer detail in the `title` and refine the exact topology
     downstream with `create_diagram_from_prompt`/`convert_diagram_type` when you need named topics.
   - For a codebase: `create_from_repo_analysis({ analysis: { modules, entrypoints, database,
     services, integrations } })`, then classify components into producers (publish calls), consumers
     (listener handlers), and label the topics they share.
   - Fallbacks: `convert_diagram_type({ structure, targetType: "event-driven" })` to reshape a
     container/flow drawing; `create_diagram_from_prompt({ diagramType: "event-driven", structure:
     { nodes, edges } })` with a topic/event spec; `create_from_template({ templateId:
     "event-driven" })`. Capture `drawingId`.
   - Layout intent: **producers column on the LEFT** with dashed arrows pointing RIGHT into the bus;
     **event bus (a wide pipe/queue shape) in the CENTER** with named topic stubs on its face;
     **consumers column on the RIGHT** with dashed arrows from the bus pointing RIGHT into them;
     **event store below or beside the bus** with a solid persist edge from the bus. Reserve >= 32px
     arrow gutters between every service row and the bus so the many fan-out lines never cross text.
3. **Edge styling (the defining step).** Every producer->bus and bus->consumer edge is a **dashed**
   asynchronous arrow (`strokeStyle: "dashed"`), single-headed, fire-and-forget. The bus->event-store
   persist edge and any genuine request/response call (a consumer calling an external sync API) are
   **solid**. The **legend MUST key both**: "— solid = synchronous (request/response)" and
   "– – dashed = asynchronous (event/pub-sub)". A dashed edge for a sync call, or a solid edge for an
   event, is a content error, not a style nit.
4. **Place icons.** `add_library_items_normalized` — a broker/queue glyph (or branded Kafka/SNS/SQS/
   RabbitMQ logo) on the center bus as `inside-card-top` / `cloud-provider`; a topic/stream marker as
   a `badge` on each topic stub; an event-store/log/`database-symbol` on the store node; service-type
   glyphs as `inside-card-top` on producer/consumer cards; a `legend` block for the sync/async key.
   Keep producer/consumer cards icon-light; one glyph each.
5. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty. Fan-out diagrams most often trip
   `ARROW_TEXT_INTERSECTION` (a topic name under a routed line) — route through gutters.
6. **Score.** `score_drawing`; record the number and every penalty.
7. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint and
   re-score. Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a repair pass
   lowers the score, restore the last `save_version` checkpoint and apply a smaller fix.
8. **Polish.** Only after blockers clear, run `auto_polish_drawing`; re-score to confirm no
   regression (rollback if it drops below the checkpoint). Verify polish did NOT flip a dashed
   async edge to solid.
9. **Validate.** `validate_architecture` — exactly one bus hub; producers LEFT, consumers RIGHT; no
   direct producer->consumer edge (everything flows through the bus); every event/topic has >= 1
   producer and >= 1 consumer; the event store has a persist edge. A direct producer->consumer edge
   or an event with no consumer is a hard architecture failure, not a penalty.
10. **Review.** `suggest_architecture_improvements` — surface orphan topics (produced, never
    consumed), missing DLQ on at-least-once consumers, a producer tightly coupled to one consumer
    (should be a topic), an event with no producer (dead subscription), no event store for an
    event-sourced claim. Apply accepted fixes, then re-run lint -> score.
11. **Save.** `save_drawing` with a clear title (`"<System> — Event-Driven Architecture"`), then
    `save_version` to checkpoint the accepted state.
12. **Export.** `get_drawing_url` for a link, then `export_drawing` (svg/png/json); re-scan the
    export for secrets (broker SASL creds and consumer-side API keys are the common leak here).

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only; draw the bus as a wide pipe/queue rectangle, topic stubs as small tags,
  the event store as a cylinder; no icon calls.
- **curated** (default) — pull only from **Software Architecture** (services, queues, gateways, the
  event-bus/pipe shape) and **Technology Logos** (Kafka, RabbitMQ, NATS, AWS SNS/SQS, EventBridge,
  Pulsar broker logos). Generic boxes/pipes/stores may come from **Architecture diagram components**;
  external actors/webhook sources from **Stick Figures**.
- **required** — the broker MUST use its product logo (Kafka/SNS/SQS/RabbitMQ); each topic crossing
  MUST carry a topic/stream `badge`; the event store MUST use a `database-symbol` or log glyph; a
  primitive where a curated icon exists is a violation.

Workflow: `search_libraries` -> `inspect_library` (aspect, stroke, fill, complexity) ->
`cache_library` -> `add_library_items_normalized`. Icon slots: `inside-card-top`/`cloud-provider`
for the broker logo on the bus, `badge` for topic/stream markers on the bus face, `database-symbol`
for the event store, `inside-card-top` (32x32) for producer/consumer service glyphs, `actor` for an
external webhook/event source, `legend` for the sync/async key. Normalize scale, preserve aspect,
match the architecture preset's stroke and fill. **Reject any icon that introduces HIGH_DENSITY,
collides with a fan-out arrow lane, or clashes with the preset** — drop it and use a primitive.
Record used and rejected items.

## Validation & score
- `hardBlockers` must be empty: no `ARROW_TEXT_INTERSECTION` (a topic name, event name, or
  "async"/"sync" label never sits under a routed line — the #1 risk on fan-out), no
  `FRAME_TITLE_OVERLAP` (the diagram title, the producers/consumers lane headers, and the legend
  header stay title-only), no `ITEM_OUTSIDE_FRAME` (every service fully inside its lane; the bus and
  topic stubs fully on the canvas).
- No arrow over text: each topic name / event name / "publishes" / "subscribes" label rides in a
  clear gutter beside its dashed line.
- Titles/headers not overlapping: the diagram title, the "Producers / Publishers" left header, the
  "Consumers / Subscribers" right header, and the legend header do not collide with each other or a card.
- Viewport fit: all content kept >= 40px from canvas/export bounds (no `TEXT_NEAR_EDGE`).
- `validate_architecture` clean: one bus hub; producers LEFT, consumers RIGHT; no direct
  producer->consumer edge; every topic/event has >= 1 producer and >= 1 consumer; event store has a
  persist edge. Async edges dashed, sync edges solid, legend keys both.
- **Minimum score 95.** Repair is mandatory below 95 or with any blocker; rollback any pass that
  lowers the score.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. The leak surface here is the **broker
connection** and **consumer-side outbound calls**: Kafka/RabbitMQ SASL username:password, AWS access
keys on the SNS/SQS client, an API key a consumer uses to call an external service, a webhook signing
secret on an inbound event source. Redact BEFORE any tool call and re-scan the export:
`sasl: user:<password>@broker:9092` becomes `sasl: user:[REDACTED_PROXY_SECRET]@broker:9092`; access
keys, service-role keys, JWT secrets, bearer/webhook tokens become typed placeholders
(`[REDACTED_API_KEY]`, `[REDACTED_PROVIDER_KEY]`, `[REDACTED_SERVICE_ROLE]`,
`[REDACTED_JWT_SECRET]`, `[REDACTED_WEBHOOK_SECRET]`). Show the *concept* — label the bus "Kafka
(SASL/SSL)", a key icon for credentials — not the value. Never echo a detected secret back to the user.

## Internal prompts
- **Pub-sub topology prompt**: `"Event-driven architecture for <SYSTEM>. Producers (LEFT, dashed
  async arrows into the bus): 'OrderService' publishes 'OrderPlaced'; 'PaymentService' publishes
  'PaymentCaptured'; 'InventoryService' publishes 'StockReserved'. Event bus (CENTER): Kafka with
  topics [orders, payments, inventory]. Consumers (RIGHT, dashed async arrows from the bus):
  'ShippingService' subscribes 'OrderPlaced'; 'EmailService' subscribes 'OrderPlaced' +
  'PaymentCaptured'; 'AnalyticsSink' subscribes all (fan-out). Event store below the bus
  (solid persist edge): 'Kafka topic log (retention 7d)'. One solid sync edge: 'ShippingService' ->
  external 'CarrierAPI' (request/response). Legend: solid = synchronous, dashed = asynchronous.
  No direct producer->consumer edge; every topic has >= 1 producer and >= 1 consumer."`
- **Convert / repo path**: scan the repo for producers (`producer.send`, `kafkaTemplate.send`,
  `.publish(`, `.sendMessage(`, `sns.publish`, `eventbridge.putEvents`), consumers (`@KafkaListener`,
  `@SqsListener`, `@RabbitListener`, `subscribe(`, `.onMessage(`) and topics (`topic`, `stream`,
  `queue`, `exchange`, `eventBus`); fold the findings into the `analysis` object and call
  `create_from_repo_analysis({ analysis: { modules, entrypoints, database, services, integrations } })`,
  then `convert_diagram_type({ structure, targetType: "event-driven" })` if the source came back as a
  flat container view.
- **Repair / review nudge**: `"validate_architecture flags a DIRECT producer->consumer edge:
  'OrderService' -> 'ShippingService'. Fix by routing it through the bus: 'OrderService' publishes
  'OrderPlaced' to the Kafka 'orders' topic (dashed async); 'ShippingService' subscribes to that
  topic (dashed async). Re-route both lines through the center-lane gutter; keep the bus fixed and
  both services in their lanes. Also flip the edge style from solid to dashed (it is asynchronous)."`

## Example prompts for Claude Code
These user prompts should trigger this skill:
- "Draw our event-driven architecture: services publish to Kafka and others subscribe — show producers, the bus, the topics and the consumers."
- "Diagram the SNS/SQS fan-out for checkout, with the async edges visually distinct from the sync calls."
- "Reverse-engineer the pub-sub flow from this Spring Boot repo — who publishes what, who consumes what, over which topics."
- "Map our EventBridge event flow and call out any orphan topic or missing dead-letter queue."
- "Where does `OrderPlaced` get consumed? Show the broker, the event store, and every subscriber."

## Acceptance criteria
- [ ] Exactly one event bus / broker hub in the center, with its product named (Kafka/SNS/SQS/etc.).
- [ ] Producers (publishers) in the LEFT lane; consumers (subscribers) in the RIGHT lane.
- [ ] Named topics/streams/queues shown on the bus; fan-out (one event, many consumers) visible.
- [ ] An event store / topic log node with a persist edge from the bus.
- [ ] Every producer->bus and bus->consumer edge is a DASHED asynchronous arrow; genuine
      request/response calls are SOLID; the legend keys both sync and async.
- [ ] No direct producer->consumer edge — everything flows through the bus.
- [ ] Every topic/event has >= 1 producer and >= 1 consumer (no orphan topic, no dead subscription).
- [ ] Arrows route through gutters; no line crosses a card, a topic name, or another label.
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`).
- [ ] Diagram title, the producers/consumers lane headers, and the legend header do not overlap each other or a card.
- [ ] Libraries used per policy when relevant (broker logo, topic badges, event-store symbol; normalized).
- [ ] `validate_architecture` clean and `suggest_architecture_improvements` reviewed/applied.
- [ ] No secrets leaked in drawing, response, or export (broker SASL creds and consumer-side API keys redacted).

## Examples
See `./references/examples.md` for full request -> plan -> ordered tool calls with realistic
arguments, plus `./references/checklist.md` and `./references/anti-patterns.md`. Shared rules live
in `../_shared/references/library-policy.md`, `../_shared/references/security-redaction.md`,
`../_shared/references/geometry-rules.md`, and `../_shared/references/architecture-patterns.md`.
