---
name: excalidash-microservices-topology
description: Use when you need to draw or review a microservices topology for ONE system — an API gateway at the top, independent services laid out in a row beneath it, each service paired with its OWN datastore (database-per-service), a queue / event bus carrying the asynchronous (dashed) service-to-service traffic, and a frame per bounded service — so ownership, sync vs async edges, and the gateway-fronted boundary are all explicit.
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

# Microservices Topology

## Objective
Produce or review a **microservices topology** diagram for ONE system: an **API gateway** (or
BFF / edge router) at the TOP that fronts the system, a ROW of **independent services** beneath it,
each service paired with **its own datastore** (the database-per-service rule — no shared DB), and a
**queue / event bus** carrying the **asynchronous** service-to-service messages. Each bounded
service lives in **its own frame** (service + datastore + private cache grouped together) so
ownership is unmistakable. The hard invariants are: the gateway is the single front door, **no two
services share a datastore**, synchronous request/response edges are **solid** while async
queue/event edges are **dashed**, and a **legend** keys the two. The result must score >= 95 with
zero hard blockers, and `validate_architecture` must confirm every service has exactly one owned
store and no cross-service direct DB access.

## When to use / When NOT to use
**Use when**: the request is "draw/review our microservices architecture", "show the API gateway
and the services behind it", "map our service mesh / service topology", "diagram database-per-service
ownership", "show which services talk over the queue vs HTTP", "where does the order service keep its
data?", or "make the async service-to-service edges distinct from the synchronous gateway calls".

**Use when**: a repository must be reverse-engineered — drive `create_from_repo_analysis`, then map
each deployable service to its datastore (its own DB connection string / migrations folder), classify
HTTP/gRPC calls as sync edges and broker publish/subscribe as async edges, and detect the gateway
(reverse-proxy / ingress / API-gateway config).

**Do NOT use when**:
- The focus is the *event flow itself* — producers, a central bus with named topics, consumers
  fanning out -> use the **Event-Driven** skill (this skill is about service ownership + the gateway;
  event-driven is about the bus and topics).
- The request is command/query path separation (commands -> write model, queries -> read model) ->
  use **CQRS**.
- The request is bounded contexts as a domain model with a context map (partnership, conformist, ACL)
  -> use **DDD Bounded Contexts** (this skill draws runnable services, not domain aggregates).
- The request is one container's internal components, or the full C4 container view of a *single*
  application -> use **C4 Container**.
- The request is a domain core with named ports and left/right adapters -> use **Hexagonal**.
- The request is one deployable with internal modules sharing one runtime -> that is a
  modular-monolith, not microservices.

## Expected input
A short description naming the system and, ideally, what lives where:
- **API gateway / edge (TOP)** — the single front door ("Kong gateway", "AWS API Gateway", "nginx
  ingress", "a BFF"). Note auth/rate-limit responsibilities if relevant. Optionally external clients
  (web/mobile) above the gateway.
- **Services (ROW)** — each independently deployable service ("OrderService", "PaymentService",
  "InventoryService", "UserService", "ShippingService"). Name the runtime/language if branding helps.
- **Per-service datastores** — the store each service OWNS ("OrderService -> orders-db (Postgres)";
  "InventoryService -> inventory-db (MySQL)"; "UserService -> users-db + Redis cache"). One store per
  service; no sharing.
- **Queue / event bus (async)** — the broker carrying async service-to-service messages ("RabbitMQ",
  "Kafka", "SQS", "NATS"). Name which services publish/consume.
- **Sync edges** — gateway -> service calls and service -> service HTTP/gRPC request/response (solid).
- **Bounded service frames** — each frame groups one service + its datastore (+ cache/sidecar).
If a region is missing, infer the obvious placement and state the assumption; if the input is a repo,
derive services/stores/edges from deployable units, DB configs, and client calls via
`create_from_repo_analysis`.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, scoring rubric.
2. `mcp__excalidash__list_templates` — look for a `microservices` / `service-topology` template (optional).
3. `mcp__excalidash__search_libraries` -> `inspect_library` -> `cache_library` — vet gateway, service,
   database, cache, and queue/event-bus glyphs plus branded logos (Kong, Postgres, MySQL, Redis,
   RabbitMQ, Kafka) from curated packs.
4. ONE create path:
   - `mcp__excalidash__apply_architecture_skill` with `pattern: "microservices"` (preferred — emits the
     gateway at the top, the services row, a datastore under each service, a frame per service, the
     queue/event-bus for async edges, and the sync/async legend), OR
   - `mcp__excalidash__create_from_repo_analysis` to reverse-engineer services/stores/edges, OR
   - `mcp__excalidash__convert_diagram_type` with `targetType: "microservices"` to reshape an existing
     container/flow drawing into a service topology, OR
   - `mcp__excalidash__create_diagram_from_prompt` with `diagramType: "microservices"` and a service `structure`, OR
   - `mcp__excalidash__create_from_template` with the `microservices` template.
5. `mcp__excalidash__add_library_items_normalized` — place gateway, service, database, cache, and
   queue/bus icons (and branded logos) in their card slots.
6. `mcp__excalidash__lint_drawing` -> `score_drawing` -> `repair_drawing` (loop).
7. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
8. `mcp__excalidash__validate_architecture` — confirm gateway-fronted topology (one gateway hub;
   every service owns exactly one store; no shared/cross-service DB; async edges dashed via the bus).
9. `mcp__excalidash__suggest_architecture_improvements` — flag a shared database, a service with no
   store, a service the gateway does not front, missing circuit-breaker/DLQ on async consumers, a
   chatty sync chain that should be async; apply accepted fixes then re-lint/re-score.
10. `mcp__excalidash__save_drawing` -> `save_version` -> `get_drawing_url` -> `export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=microservices PRESET=architecture LIBRARY=curated[Software Architecture, Cloud/DevOps, Technology Logos]
   VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`.
   Confirm the regions (gateway TOP / services ROW / a datastore under each service / queue or event
   bus for async / a frame per bounded service) and label which edges are sync (solid) vs async
   (dashed). Redact any secret in the input (DB connection string with credentials, gateway API key,
   service-role key, JWT secret, broker SASL creds, token, bearer, webhook/proxy secret) BEFORE it
   reaches a tool argument.
2. **Generate (one path only).**
   - Prefer `apply_architecture_skill({ pattern: "microservices" })` so the gateway, the services row,
     the per-service datastores, the service frames, the queue/event-bus, and the sync/async legend
     come from the skeleton. Carry the gateway/service/store/bus detail in the `title` and in the
     downstream `structure` you pass, not in a `skill`/`level` argument (those do not exist).
   - For a codebase: `create_from_repo_analysis({ analysis: { modules, entrypoints, database, services,
     integrations } })`, then map each deployable to its owned store (its DB config / migrations),
     classify HTTP/gRPC as sync and broker publish/subscribe as async, and detect the gateway/ingress.
   - Fallbacks: `convert_diagram_type({ structure, targetType: "microservices" })` to reshape a
     container/flow drawing; `create_diagram_from_prompt({ diagramType: "microservices", structure: {
     nodes, edges } })` with a service spec; `create_from_template({ templateId: "microservices" })`.
     Capture `drawingId`.
   - Layout intent: **gateway centered at the TOP** with solid arrows fanning DOWN to each service;
     **services in a single ROW** beneath the gateway; **each service's datastore directly BELOW it**
     (the cylinder under the service card) inside the **same frame**; **queue / event bus as a wide
     pipe along the bottom or side** with dashed async arrows between services that talk
     asynchronously. Reserve >= 32px arrow gutters between the gateway and the service row and between
     services and the bus so the fan-out lines never cross text.
3. **Ownership + edge styling (the defining step).** Each service frame contains exactly ONE
   datastore that ONLY that service touches (database-per-service). The gateway->service and any
   service->service HTTP/gRPC call is a **solid** synchronous arrow. Every service->bus and
   bus->service async message is a **dashed** arrow. The **legend MUST key both**:
   "— solid = synchronous (HTTP/gRPC request/response)" and "– – dashed = asynchronous (queue/event)".
   A second service reaching into another service's datastore, or a solid edge for an async message,
   is a content error, not a style nit.
4. **Place icons.** `add_library_items_normalized` — a gateway glyph (or Kong/AWS-API-Gateway/nginx
   logo) on the gateway card as `inside-card-top` / `cloud-provider`; a service glyph (or
   runtime/language logo) `inside-card-top` (32x32) on each service card; a `database-symbol` on each
   per-service store (Postgres/MySQL/Mongo logo where curated); a cache glyph (Redis) as a `badge` on
   services that have one; a queue/event-bus glyph (RabbitMQ/Kafka/SQS) on the bus card; a `legend`
   block for the sync/async key. Keep service cards icon-light; one primary glyph each plus an
   optional cache badge.
5. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty. Service-row diagrams most often
   trip `ARROW_TEXT_INTERSECTION` (a gateway fan-out line or an async edge crossing a service/store
   label) — route through gutters.
6. **Score.** `score_drawing`; record the number and every penalty.
7. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint and re-score.
   Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a repair pass lowers the score,
   restore the last `save_version` checkpoint and apply a smaller fix.
8. **Polish.** Only after blockers clear, run `auto_polish_drawing`; re-score to confirm no regression
   (rollback if it drops below the checkpoint). Verify polish did NOT merge two service frames or flip
   a dashed async edge to solid.
9. **Validate.** `validate_architecture` — exactly one gateway front door; every service is in its own
   frame with exactly one owned datastore; no datastore is shared and no service reaches into
   another's store; async edges go through the queue/bus (dashed), sync edges are solid; the legend
   keys both. A shared database, a service with no store, or a service the gateway does not front is a
   hard architecture failure, not a penalty.
10. **Review.** `suggest_architecture_improvements` — surface a shared database (split it), a service
    bypassing the gateway, a missing circuit breaker / retry / DLQ on async consumers, a chatty
    synchronous chain that should be an async event, a service with no datastore (is it stateless? say
    so), an orphan queue. Apply accepted fixes, then re-run lint -> score.
11. **Save.** `save_drawing` with a clear title (`"<System> — Microservices Topology"`), then
    `save_version` to checkpoint the accepted state.
12. **Export.** `get_drawing_url` for a link, then `export_drawing` (svg/png/json); re-scan the export
    for secrets (per-service DB connection strings and the gateway/broker credentials are the common
    leak here).

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only; draw the gateway as a wide top card, services as rectangles in a row,
  each store as a cylinder under its service, the queue/bus as a wide pipe; no icon calls.
- **curated** (default) — pull only from **Software Architecture** (gateway, services, queues,
  layers), **Cloud/DevOps** (containers, k8s, ingress, managed gateways/queues), and
  **Technology Logos** (Kong, AWS API Gateway, nginx, RabbitMQ, Kafka, SQS, plus Postgres/MySQL/
  Mongo/Redis store logos). Generic boxes/pipes/stores may come from **Architecture diagram
  components**; per-service datastores prefer **Database/Data Platform**.
- **required** — the gateway MUST use its product logo; each per-service datastore MUST use a
  `database-symbol` (or the DB vendor logo); the queue/bus MUST use its broker logo; a primitive where
  a curated icon exists is a violation.

Workflow: `search_libraries` -> `inspect_library` (aspect, stroke, fill, complexity) ->
`cache_library` -> `add_library_items_normalized`. Icon slots: `inside-card-top`/`cloud-provider`
for the gateway logo, `inside-card-top` (32x32) for each service glyph, `database-symbol` for each
per-service store, `badge` for a per-service cache (Redis) marker, `inside-card-top`/`cloud-provider`
for the queue/bus broker logo, `legend` for the sync/async key. Normalize scale, preserve aspect,
match the architecture preset's stroke and fill. **Reject any icon that introduces HIGH_DENSITY,
collides with a fan-out arrow lane, or clashes with the preset** — drop it and use a primitive.
Record used and rejected items.

## Validation & score
- `hardBlockers` must be empty: no `ARROW_TEXT_INTERSECTION` (a service name, store name, "sync"/
  "async" label, or queue name never sits under a routed line — the #1 risk on gateway fan-out and
  async edges), no `FRAME_TITLE_OVERLAP` (the diagram title, the per-service frame titles, the
  "Services" row header, and the legend header stay title-only), no `ITEM_OUTSIDE_FRAME` (every
  service + its store fully inside its bounded-service frame; the gateway and bus fully on the canvas).
- No arrow over text: each service name / store name / "publishes" / "calls" label rides in a clear
  gutter beside its line.
- Titles/headers not overlapping: the diagram title, the gateway label, each service-frame title, and
  the legend header do not collide with each other or a card.
- Viewport fit: all content kept >= 40px from canvas/export bounds (no `TEXT_NEAR_EDGE`).
- `validate_architecture` clean: one gateway hub; every service in its own frame with exactly one
  owned datastore; no shared/cross-service DB; async edges through the bus (dashed), sync edges solid,
  legend keys both.
- **Minimum score 95.** Repair is mandatory below 95 or with any blocker; rollback any pass that
  lowers the score.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. The leak surface here is the **per-service DB
connection strings** and the **gateway/broker credentials**: a `postgres://app:<password>@orders-db/orders`
URL on a store card, a gateway API key, a service-role key, a JWT signing secret, RabbitMQ/Kafka SASL
`user:<password>`, a bearer/webhook token on an async consumer. Redact BEFORE any tool call and re-scan the
export: `postgres://app:<password>@orders-db/orders` becomes
`postgres://app:[REDACTED_DATABASE_URL]@orders-db/orders`; gateway/broker/client keys become typed
placeholders (`[REDACTED_API_KEY]`, `[REDACTED_PROVIDER_KEY]`, `[REDACTED_SERVICE_ROLE]`,
`[REDACTED_JWT_SECRET]`, `[REDACTED_PROXY_SECRET]`, `[REDACTED_WEBHOOK_SECRET]`). Show the *concept* —
label a store "orders-db (Postgres)", a key icon for credentials — not the value. Never echo a
detected secret back to the user.

## Internal prompts
- **Topology spec prompt**: `"Microservices topology for <SYSTEM>. API gateway (TOP, single front
  door, solid arrows down to each service): 'Kong gateway' (auth + rate limit). Services (ROW, each in
  its own frame with its OWN datastore directly below): 'OrderService' -> 'orders-db (Postgres)';
  'PaymentService' -> 'payments-db (Postgres)'; 'InventoryService' -> 'inventory-db (MySQL)';
  'UserService' -> 'users-db (Postgres)' + Redis cache badge. Async (dashed, through the bus):
  'OrderService' publishes 'OrderPlaced' to RabbitMQ; 'InventoryService' and 'ShippingService'
  consume. Sync (solid): gateway -> every service; 'OrderService' -> 'PaymentService' (gRPC).
  Queue / event bus (bottom): 'RabbitMQ'. Legend: solid = synchronous (HTTP/gRPC), dashed =
  asynchronous (queue/event). Database-per-service: no shared DB, no cross-service DB access."`
- **Convert / repo path**: `create_from_repo_analysis({ analysis: { modules: ["order","payment","inventory","user"], entrypoints: ["api-gateway"], database: ["orders-db","payments-db","inventory-db","users-db"], services: ["OrderService","PaymentService","InventoryService","UserService"], integrations: ["RabbitMQ","Redis"] }, save: true, name: "<System> — Microservices Topology" })`
  — derive `modules`/`services` from deployable units (Dockerfile, k8s/helm manifests, service entrypoints),
  `database` from per-service DB configs (`DATABASE_URL`, `datasource.url`, `mongoUri`, migrations, `schema.prisma`),
  and `integrations` from brokers/caches (amqp, kafka, sqs, nats, Redis); then
  `convert_diagram_type({ structure, targetType: "microservices" })` if the source came back as a
  flat container view.
- **Repair / review nudge**: `"validate_architecture flags a SHARED DATABASE: 'OrderService' and
  'InventoryService' both connect to 'shared-db'. Database-per-service is violated. Fix by splitting:
  give 'OrderService' its own 'orders-db' and 'InventoryService' its own 'inventory-db', each inside
  its own frame; if they need each other's data, add an async event over the bus (dashed) or a sync
  API call (solid) — never a second service reaching into the first's store. Re-route the lines
  through the row gutter; keep the gateway fixed and each service in its frame."`

## Acceptance criteria
- [ ] Exactly one API gateway / edge router at the TOP, named (Kong / AWS API Gateway / nginx / BFF).
- [ ] Services laid out in a ROW beneath the gateway, each in its OWN bounded-service frame.
- [ ] Each service paired with exactly ONE datastore it owns, directly below it in the same frame.
- [ ] No shared datastore and no service reaching into another service's store (database-per-service).
- [ ] A queue / event bus present, named, carrying the asynchronous service-to-service messages.
- [ ] Gateway->service and service->service HTTP/gRPC edges are SOLID; queue/event edges are DASHED;
      the legend keys both sync and async.
- [ ] Gateway fronts every service (no service bypasses the gateway unless explicitly noted).
- [ ] Arrows route through gutters; no line crosses a card, a service/store name, or another label.
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`).
- [ ] Diagram title, the per-service frame titles, the row header, and the legend header do not overlap.
- [ ] Libraries used per policy when relevant (gateway logo, service glyphs, per-service db-symbols,
      cache badge, broker logo; normalized).
- [ ] `validate_architecture` clean and `suggest_architecture_improvements` reviewed/applied.
- [ ] No secrets leaked in drawing, response, or export (per-service DB URLs and gateway/broker creds redacted).

## Examples
See `./references/examples.md` for full request -> plan -> ordered tool calls with realistic
arguments, plus `./references/checklist.md` and `./references/anti-patterns.md`. Shared rules live
in `../_shared/references/library-policy.md`, `../_shared/references/security-redaction.md`,
`../_shared/references/geometry-rules.md`, and `../_shared/references/architecture-patterns.md`.
