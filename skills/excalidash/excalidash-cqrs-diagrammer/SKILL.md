---
name: excalidash-cqrs-diagrammer
description: Use when you need to draw or review a CQRS (Command-Query Responsibility Segregation) diagram — a WRITE lane (command -> command handler -> write model / aggregate -> event bus / event store) on top and a READ lane (projection / denormalizer -> read model / materialized view -> query handler -> query) on the bottom, two clearly separated lanes joined only by the event bus, with the command and query sides never sharing a model.
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

# CQRS Diagrammer

## Objective
Produce or review a **CQRS (Command-Query Responsibility Segregation)** diagram for ONE system,
split into two lanes that share no model. The **WRITE path** (top lane) flows left-to-right:
**client command -> command handler / application service -> write model (aggregate)** -> it
persists and **emits domain events to the event bus / event store**. The **READ path** (bottom
lane) flows the other way for queries but is *fed* by the bus: a **projection / denormalizer**
consumes those events and updates a **read model (materialized view / denormalized store)**, which a
**query handler** serves to answer **client queries**. The hard invariant is **segregation**: the
command side and the query side never touch the same model, and the **only** link between the two
lanes is the event bus (write emits, projection consumes). The result must score >= 95 with zero
hard blockers, and `validate_architecture` must confirm the two lanes are separate, commands never
read and queries never write, and the bus is the sole bridge.

## When to use / When NOT to use
**Use when**: the request is "draw/review our CQRS architecture", "show the write side vs the read
side", "diagram command handlers, the write model, projections, and the read model", "how does a
command become a query-able view?", "show the eventual-consistency gap between write and read",
"separate our command bus from our query path", or "map our event-sourced + CQRS flow (commands ->
events -> projections -> read models)".

**Use when**: a repository must be reverse-engineered — drive `create_from_repo_analysis`, then
classify code into command handlers (`...CommandHandler`, `handle(Command)`), the write model
(aggregates / `@AggregateRoot`), projections / event handlers (`...Projection`, `on(Event)`), read
models (read-side repositories / views), and query handlers (`...QueryHandler`, `handle(Query)`).

**Do NOT use when**:
- The subject is producers / brokers / consumers and the *bus topology* itself (topics, fan-out,
  DLQ) -> use the **Event-Driven Diagrammer** (related but distinct: event-driven is about the bus;
  CQRS is about the write/read MODEL split that the bus happens to join).
- The subject is the runnable apps/APIs/datastores of one system without a write/read split ->
  use the **C4 Container** skill.
- The subject is one scenario's time-ordered messages with lifelines -> use a **sequence diagram**.
- The subject is bounded contexts / aggregates / a context map -> use a **DDD** skill (an aggregate
  may appear here as the write model, but the context map is a different view).
- The subject is a domain core with named ports and left/right adapters -> use **Hexagonal**.

## Expected input
A short description naming the system and, ideally, what lives in each lane:
- **Commands (WRITE lane, top-left)** — the write-side intents ("PlaceOrder", "CancelOrder",
  "AddLineItem") arriving from a client / API / command bus.
- **Command handlers / application services** — what validates and executes each command
  ("PlaceOrderHandler" loads the aggregate, applies the change).
- **Write model / aggregate** — the consistency boundary that owns invariants ("Order aggregate"
  in an event store or a normalized write DB). Name the write store.
- **Event bus / event store (the bridge)** — where domain events are published/persisted
  ("OrderPlaced", "OrderCancelled" appended to the event store / published to Kafka). This is the
  ONLY link between the two lanes.
- **Projections / denormalizers (READ lane)** — event handlers that subscribe to the bus and build
  read-optimized views ("OrderSummaryProjection" consumes "OrderPlaced").
- **Read model / materialized views** — denormalized, query-optimized stores ("order_summary" in a
  read DB / Elasticsearch / Redis). Name the read store; it is SEPARATE from the write store.
- **Query handlers + queries (READ lane, bottom-right back to client)** — what serves reads
  ("GetOrderSummary" query -> "OrderSummaryQueryHandler" -> read model -> client).
- **Consistency note** — synchronous vs eventually-consistent read side; the replication/projection
  lag between write and read.
If a region is missing, infer the obvious placement and state the assumption; if the input is a
repo, derive the handlers/models from naming and message types via `create_from_repo_analysis`.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, scoring rubric.
2. `mcp__excalidash__list_templates` — look for a `cqrs` / `command-query` template (optional).
3. `mcp__excalidash__search_libraries` -> `inspect_library` -> `cache_library` — vet command-bus,
   handler/service, aggregate, event-store/bus, projection, read-store/database, and query glyphs
   from curated **Software Architecture**.
4. ONE create path:
   - `mcp__excalidash__apply_architecture_skill` with `pattern: "cqrs"` (preferred — emits the two
     lanes: write top, read bottom, the shared event bus between them, and the write/read legend), OR
   - `mcp__excalidash__create_from_repo_analysis` to reverse-engineer handlers/models/projections, OR
   - `mcp__excalidash__convert_diagram_type` with `targetType: "cqrs"` to reshape an existing
     container/event-driven drawing into a command/query split, OR
   - `mcp__excalidash__create_diagram_from_prompt` with `diagramType: "cqrs"` and a command/event/query spec, OR
   - `mcp__excalidash__create_from_template` with the `cqrs` template.
5. `mcp__excalidash__add_library_items_normalized` — place command-bus / handler / aggregate /
   event-store / projection / read-DB / query-handler icons in their slots.
6. `mcp__excalidash__lint_drawing` -> `score_drawing` -> `repair_drawing` (loop).
7. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
8. `mcp__excalidash__validate_architecture` — confirm two separate lanes; commands never read the
   read model; queries never write the write model; the bus is the only write->read bridge.
9. `mcp__excalidash__suggest_architecture_improvements` — flag a shared model, a command querying a
   read store, a query writing the write store, an orphan projection, a read model with no projection
   feeding it; apply accepted fixes then re-lint/re-score.
10. `mcp__excalidash__save_drawing` -> `save_version` -> `get_drawing_url` -> `export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=cqrs PRESET=architecture LIBRARY=curated[Software Architecture]
   VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`.
   Confirm the two lanes (WRITE top: command -> handler -> write model -> bus; READ bottom:
   projection -> read model -> query handler -> query) and that the event bus is the sole bridge.
   Redact any secret in the input (write/read DB URLs, broker SASL creds, API key, service-role,
   token, bearer, webhook/proxy secret) BEFORE it reaches a tool argument.
2. **Generate (one path only).**
   - Prefer `apply_architecture_skill({ pattern: "cqrs", title: "<System> — CQRS" })` so the write
     lane (top), the read lane (bottom), the shared event bus/store between them, the projection
     edge, and the write/read legend come from the skeleton. (`apply_architecture_skill` takes a
     `pattern` only — convey the command/query detail in the `title` and refine downstream with
     `create_diagram_from_prompt` or `convert_diagram_type`.)
   - For a codebase: `create_from_repo_analysis({ analysis: { modules, entrypoints, database,
     services, integrations } })`, classifying code into command handlers, the write aggregate,
     projections/event handlers, read models, and query handlers via the naming/message-type hints.
   - Fallbacks: `convert_diagram_type({ structure, targetType: "cqrs" })` to reshape a container or
     event-driven drawing; `create_diagram_from_prompt({ diagramType: "cqrs", structure: { nodes,
     edges } })` with a command/event/query spec; `create_from_template({ templateId: "cqrs" })`.
     Capture `drawingId`.
   - Layout intent: **WRITE lane along the TOP**, flowing LEFT->RIGHT (Command -> Command Handler ->
     Write Model/Aggregate -> Event Bus/Store). **READ lane along the BOTTOM**: the bus feeds a
     Projection (DOWN edge from the bus), Projection -> Read Model, and then the query side flows
     RIGHT->LEFT back to the client (Read Model -> Query Handler -> Query). **Event bus/store sits
     between the two lanes** (right-center) as the single bridge. Reserve >= 32px arrow gutters so
     the bus->projection edge and the two lane flows never cross a card or a label.
3. **Lane segregation (the defining step).** The two lanes share NO model: the write model and read
   model are distinct nodes (ideally distinct stores). The ONLY edge crossing between lanes is the
   **bus -> projection** (events flowing write-side to read-side, eventually consistent). A command
   that reads the read model, a query that writes the write model, or a single "model" box serving
   both sides is a content error, not a style nit. The **legend MUST key both lanes**:
   "Write (Command) path" and "Read (Query) path", plus mark the projection edge "eventually consistent".
4. **Place icons.** `add_library_items_normalized` — a command-bus / inbox glyph on the command
   entry (`badge`), a handler/service glyph on each handler (`inside-card-top`), an aggregate glyph
   on the write model (`inside-card-top`), an event-store / bus glyph on the bridge
   (`inside-card-top`), a projection / transform glyph on the projector (`inside-card-top`), a
   `database-symbol` on BOTH the write store and the read store (so they read as distinct stores), a
   query glyph on the query handler (`inside-card-top`), and a `legend` block for the write/read key.
   Keep each card icon-light; one glyph each.
5. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty. CQRS most often trips
   `ARROW_TEXT_INTERSECTION` (the "publishes"/"projects"/"eventually consistent" label under the
   bus->projection line) — route through gutters.
6. **Score.** `score_drawing`; record the number and every penalty.
7. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint and
   re-score. Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a repair pass
   lowers the score, restore the last `save_version` checkpoint and apply a smaller fix.
8. **Polish.** Only after blockers clear, run `auto_polish_drawing`; re-score to confirm no
   regression (rollback if it drops below the checkpoint). Verify polish did NOT merge the two
   lanes or relabel the projection edge as synchronous.
9. **Validate.** `validate_architecture` — exactly two lanes (write top, read bottom); the write
   model and read model are distinct; commands flow only into the write side; queries flow only out
   of the read side; the bus->projection edge is the single bridge; no command reads the read model
   and no query writes the write model. A shared model or a cross-lane read/write is a hard
   architecture failure, not a penalty.
10. **Review.** `suggest_architecture_improvements` — surface a read model with no projection
    feeding it, an orphan projection (consumes an event no command emits), a missing event store on
    an event-sourced claim, a command handler that reads the read model for validation (a coupling
    smell), no consistency annotation on the projection edge. Apply accepted fixes, then re-run
    lint -> score.
11. **Save.** `save_drawing` with a clear title (`"<System> — CQRS (Command/Query Segregation)"`),
    then `save_version` to checkpoint the accepted state.
12. **Export.** `get_drawing_url` for a link, then `export_drawing` (svg/png/json); re-scan the
    export for secrets (write-store and read-store DB URLs and broker creds are the common leak here).

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only; draw command/query as rounded cards, handlers as boxes, the write/read
  models as cylinders, the event bus as a wide pipe; no icon calls.
- **curated** (default) — pull only from **Software Architecture** (services, handlers, queues, the
  event-bus/pipe shape, stores). Generic boxes/pipes/cylinders may come from **Architecture diagram
  components**; the write/read databases from **Database/Data Platform**; a branded broker
  (Kafka/EventStoreDB) or DB logo from **Technology Logos**; an external client/actor from
  **Stick Figures**.
- **required** — the write store and the read store MUST each use a `database-symbol` (and read as
  distinct stores); the event bus/store MUST use the queue/bus glyph (or EventStoreDB/Kafka logo);
  a primitive where a curated icon exists is a violation.

Workflow: `search_libraries` -> `inspect_library` (aspect, stroke, fill, complexity) ->
`cache_library` -> `add_library_items_normalized`. Icon slots: `inside-card-top` for handler /
aggregate / projection / query-handler glyphs, `badge` for a command-bus / event-type marker,
`inside-card-top`/`cloud-provider` for a broker/event-store logo on the bus, `database-symbol` for
BOTH the write store and the read store, `actor` for the external client, `legend` for the write/read
key. Normalize scale, preserve aspect, match the architecture preset's stroke and fill. **Reject any
icon that introduces HIGH_DENSITY, collides with the bus->projection edge, or clashes with the
preset** — drop it and use a primitive. Record used and rejected items.

## Validation & score
- `hardBlockers` must be empty: no `ARROW_TEXT_INTERSECTION` (a command/event/query name, a
  "publishes"/"projects"/"eventually consistent" label, never sits under a routed line — the
  bus->projection edge is the #1 risk), no `FRAME_TITLE_OVERLAP` (the diagram title, the "Write
  (Command) Path" top header, the "Read (Query) Path" bottom header, and the legend header stay
  title-only), no `ITEM_OUTSIDE_FRAME` (every node fully inside its lane; the bus fully on canvas).
- No arrow over text: each command / event / query name and each path label rides in a clear gutter
  beside its line; the bus->projection label is parked in the inter-lane gutter.
- Titles/headers not overlapping: the diagram title, the "Write (Command) Path" header, the
  "Read (Query) Path" header, and the legend header do not collide with each other or a card.
- Viewport fit: all content kept >= 40px from canvas/export bounds (no `TEXT_NEAR_EDGE`).
- `validate_architecture` clean: two distinct lanes (write top, read bottom); write model != read
  model; commands enter only the write side; queries exit only the read side; the bus->projection
  edge is the single bridge; no command reads the read model and no query writes the write model.
- **Minimum score 95.** Repair is mandatory below 95 or with any blocker; rollback any pass that
  lowers the score.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. The leak surface here is the **two data
stores** and the **bus**: the write-store and read-store connection strings (often DIFFERENT DBs —
both leak), broker SASL creds on the event bus, an EventStoreDB connection string, an API key on a
query-side cache, a webhook signing secret on a command-side ingress. Redact BEFORE any tool call
and re-scan the export: `postgres://write:<password>@wdb/orders` becomes
`postgres://write:[REDACTED_DATABASE_URL]@wdb/orders` and the read store likewise; access keys,
service-role keys, JWT secrets, bearer/webhook tokens become typed placeholders
(`[REDACTED_API_KEY]`, `[REDACTED_PROVIDER_KEY]`, `[REDACTED_SERVICE_ROLE]`,
`[REDACTED_JWT_SECRET]`, `[REDACTED_WEBHOOK_SECRET]`, `[REDACTED_PROXY_SECRET]`). Show the *concept*
— label a store "Write DB (Postgres)" with a key icon for credentials — not the value. Never echo a
detected secret back to the user.

## Internal prompts
- **CQRS split prompt**: `"CQRS architecture for <SYSTEM>. WRITE lane (TOP, left->right): Client
  sends Command 'PlaceOrder' -> 'PlaceOrderHandler' (command handler) -> 'Order' write model
  (aggregate) in 'Write DB (Postgres, normalized)' -> emits 'OrderPlaced' to the Event Bus / Event
  Store (CENTER-RIGHT, the single bridge). READ lane (BOTTOM): Event Bus -> 'OrderSummaryProjection'
  (consumes 'OrderPlaced', eventually consistent) -> 'order_summary' Read Model in 'Read DB
  (denormalized / Elasticsearch)' -> 'GetOrderSummaryHandler' (query handler) -> answers Query
  'GetOrderSummary' back to the Client. Legend: Write (Command) path, Read (Query) path,
  '— — eventually consistent' on the bus->projection edge. The write model and read model are
  SEPARATE; the bus is the only link; no command reads the read model; no query writes the write model."`
- **Convert / repo path**: `create_from_repo_analysis({ analysis: { modules: ["PlaceOrderHandler",
  "Order (aggregate)", "OrderSummaryProjection", "GetOrderSummaryHandler"], entrypoints:
  ["commandBus", "queryBus"], database: "Postgres (write) + Elasticsearch (read)", services:
  ["command-side", "query-side"], integrations: ["Kafka / EventStore"] }, save: true, name:
  "<System> — CQRS" })` — derive command handlers (`...CommandHandler`, `handle(Command)`), the
  write aggregate (`@AggregateRoot`), projections (`...Projection`, `on(Event)`), read models, and
  query handlers (`...QueryHandler`) from naming/message types; then `convert_diagram_type({
  structure, targetType: "cqrs" })` if the source was a flat container view.
- **Repair / review nudge**: `"validate_architecture flags a SHARED MODEL: the command handler and
  the query handler both read/write the same 'Order' store. Split it: keep 'Order' aggregate in the
  WRITE DB (top lane), add a separate 'order_summary' READ model in the READ DB (bottom lane), and
  feed the read model only via 'OrderSummaryProjection' consuming 'OrderPlaced' from the bus (mark
  the projection edge 'eventually consistent'). Remove any command->read-model or query->write-model
  edge. Re-route the bus->projection line through the inter-lane gutter; keep the bus fixed."`

## Example prompts for Claude Code
These user prompts should trigger this skill:
- "Draw our Order Service with CQRS — commands and handlers on top, projections and the read model on the bottom."
- "Show the write side vs the read side: command bus, Order aggregate, event store, and the query-side read model."
- "How does a PlaceOrder command become a query-able order_summary view? Diagram the eventual-consistency gap."
- "Reverse-engineer our inventory repo into a CQRS diagram and check the command and query sides don't share a model."
- "Reshape our event-driven Billing drawing into a CQRS view with explicit, separate write and read databases."

## Acceptance criteria
- [ ] Two clearly separated lanes: WRITE (command) path on TOP, READ (query) path on BOTTOM.
- [ ] Write lane shows Command -> Command Handler -> Write Model (aggregate) -> Event Bus / Store.
- [ ] Read lane shows Event Bus -> Projection -> Read Model -> Query Handler -> Query (back to client).
- [ ] The write model and the read model are DISTINCT nodes (ideally distinct stores).
- [ ] The event bus / event store is the SINGLE bridge between the lanes (bus -> projection edge).
- [ ] No command reads the read model; no query writes the write model; no shared model box.
- [ ] The bus -> projection edge is marked eventually consistent; the legend keys write and read paths.
- [ ] Arrows route through gutters; no line crosses a card, a command/event/query name, or a label.
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`).
- [ ] Diagram title, the write-path / read-path lane headers, and the legend header do not overlap.
- [ ] Libraries used per policy when relevant (handler/aggregate/projection glyphs, two db-symbols; normalized).
- [ ] `validate_architecture` clean and `suggest_architecture_improvements` reviewed/applied.
- [ ] No secrets leaked (write-store AND read-store DB URLs, broker creds redacted) in drawing/response/export.

## Examples
See `./references/examples.md` for full request -> plan -> ordered tool calls with realistic
arguments, plus `./references/checklist.md` and `./references/anti-patterns.md`. Shared rules live
in `../_shared/references/library-policy.md`, `../_shared/references/security-redaction.md`,
`../_shared/references/geometry-rules.md`, and `../_shared/references/architecture-patterns.md`.
