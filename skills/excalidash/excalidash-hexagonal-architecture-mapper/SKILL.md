---
name: excalidash-hexagonal-architecture-mapper
description: Use when you need to draw or review a Hexagonal (Ports & Adapters) architecture — a domain core in the center, named ports on its boundary, driving (primary) adapters on the left and driven (secondary) adapters on the right — and prove dependency inversion (adapters depend on ports the core owns, never the reverse).
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

# Hexagonal Architecture Mapper

## Objective
Produce or review a Hexagonal (Ports & Adapters) architecture diagram for ONE application: a
**domain/application core** in the center, the **ports** it owns sitting on its boundary, and the
**adapters** that plug into those ports flanking it — **driving (primary) adapters on the LEFT**
(REST controllers, CLI, message consumers, schedulers, test harnesses) and **driven (secondary)
adapters on the RIGHT** (DB repositories, message publishers, email/SMS, payment SaaS, file
stores). The single hard invariant is **dependency inversion**: every dependency arrow points
*toward the hexagon* — driving adapters call **driving (input) ports**; the core depends on
**driven (output) ports** it defines, and driven adapters *implement* those ports. The core never
imports an adapter or a framework. The result must score >= 95 with zero hard blockers, and
`validate_architecture` must confirm no edge points outward from the core.

## When to use / When NOT to use
**Use when**: the request is "draw/review our ports & adapters / hexagonal architecture", "show
the driving and driven adapters around the domain", "are we leaking infrastructure into the
domain?", "prove dependency inversion holds", a hexagon-with-port-stubs picture, or an audit of an
existing hexagon for an outward-pointing edge or a framework type inside the core.

**Use when**: a repository must be reverse-engineered into a hexagon — drive
`create_from_repo_analysis`, then re-classify packages into core / driving adapters / driven
adapters and identify the port interfaces between them.

**Do NOT use when**:
- The request is concentric rings (Entities -> Use Cases -> Adapters -> Frameworks) WITHOUT an
  explicit left/right driving/driven split -> use the **Clean Architecture Reviewer** skill.
  Concentric Clean rings and a ports-and-adapters hexagon are different diagrams.
- The request is the runnable apps/APIs/datastores of one system -> use the **C4 Container** skill.
- The request is bounded contexts / aggregates / context maps -> use a **DDD** skill.
- The request is split read/write command-query paths -> use **CQRS**.
- The request is one scenario's time-ordered calls -> use a sequence diagram.

## Expected input
A short description naming the application and, ideally, what lives in each region:
- **Core (center)** — domain entities, value objects, domain services, and the **application
  services / use cases** that orchestrate them ("PlaceOrder", "Order", "Money"). No framework, no
  I/O type.
- **Driving (input) ports** — interfaces the core *exposes* to be invoked ("PlaceOrderUseCase",
  "OrderQuery"). Driving adapters depend on these.
- **Driven (output) ports** — interfaces the core *owns and depends on* for outbound needs
  ("OrderRepository", "PaymentGateway", "NotificationPort"). Driven adapters implement these.
- **Driving (primary) adapters — LEFT** — REST/GraphQL controller, CLI, Kafka/SQS consumer,
  scheduler, test driver. Each calls a driving port.
- **Driven (secondary) adapters — RIGHT** — SQL/JPA repository, Kafka producer, SMTP/SendGrid
  mailer, Stripe payment client, S3 store. Each implements a driven port.
- **Crossings** — which adapter binds to which port (so an arrow lands on a *port stub*, never on a
  domain object directly).
If a region is missing, infer the obvious placement and state the assumption; if the input is a
repo, derive regions from package structure via `create_from_repo_analysis`.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, scoring rubric.
2. `mcp__excalidash__list_templates` — look for a `hexagonal` / `ports-and-adapters` template (optional).
3. `mcp__excalidash__search_libraries` -> `inspect_library` -> `cache_library` — vet hexagon,
   port/plug, adapter, repository, queue, and branded-SaaS icons from the curated packs.
4. ONE create path:
   - `mcp__excalidash__apply_architecture_skill` with `pattern: "hexagonal"` (preferred — emits the
     hexagon core, left/right adapter lanes, port stubs on the boundary, and the
     driving/driven legend), OR
   - `mcp__excalidash__create_from_repo_analysis` to reverse-engineer a hexagon from a codebase, OR
   - `mcp__excalidash__convert_diagram_type` with `targetType: "hexagonal"` to reshape an existing
     clean/layered drawing into a ports-and-adapters hexagon, OR
   - `mcp__excalidash__create_diagram_from_prompt` with `diagramType: "hexagonal"` and a port/adapter `structure`, OR
   - `mcp__excalidash__create_from_template` with the `hexagonal` template.
5. `mcp__excalidash__add_library_items_normalized` — place hexagon/port/adapter/SaaS icons.
6. `mcp__excalidash__lint_drawing` -> `score_drawing` -> `repair_drawing` (loop).
7. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
8. `mcp__excalidash__validate_architecture` — confirm dependency inversion (all edges inward; core
   depends only on driven ports it owns).
9. `mcp__excalidash__suggest_architecture_improvements` — flag outward leaks, missing ports,
   framework types in the core, fat adapters; apply accepted fixes then re-lint/re-score.
10. `mcp__excalidash__save_drawing` -> `save_version` -> `get_drawing_url` -> `export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=hexagonal PRESET=architecture LIBRARY=curated[Software Architecture, Architecture diagram components]
   VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`.
   Confirm the regions (core / driving ports / driven ports / driving adapters LEFT / driven
   adapters RIGHT) and that every cross-boundary edge is intended to point *toward the hexagon*.
   Redact any secret in the input (DB URL, API key, service-role, token, bearer, webhook/proxy
   secret) BEFORE it reaches a tool argument.
2. **Generate (one path only).**
   - Prefer `apply_architecture_skill({ pattern: "hexagonal" })` so the hexagon core, the left
     driving lane, the right driven lane, the port stubs on the boundary, and the driving/driven
     legend come from the skeleton (convey the app name and detail via `title`).
   - For a codebase: `create_from_repo_analysis({ analysis: { modules, entrypoints, database,
     services, integrations } })`, mapping entrypoints/web/controllers to the driving (left) lane,
     database/services/integrations to the driven (right) lane, and the domain modules to the core;
     label the ports between them.
   - Fallbacks: `convert_diagram_type({ structure, targetType: "hexagonal" })` to reshape a
     clean/layered drawing; `create_diagram_from_prompt({ diagramType: "hexagonal", structure: {
     nodes, edges } })` with an explicit port/adapter structure; `create_from_template({ templateId:
     "hexagonal" })`. Capture `drawingId`.
   - Layout intent: **hexagon (or center box) in the middle**; **driving adapters column on the
     LEFT** with arrows pointing RIGHT into driving ports; **driven adapters column on the RIGHT**
     with arrows pointing LEFT into the driven ports the core owns (the core points right to the
     port; the adapter points left to *implement* it). Port stubs sit ON the hexagon boundary —
     driving ports on the left face, driven ports on the right face. Reserve >= 32px arrow gutters
     between every adapter row and the hexagon.
3. **Place icons.** `add_library_items_normalized` — a port/plug glyph as a `badge` on each port
   stub; a controller/CLI/consumer glyph as `inside-card-top` on each driving adapter; a
   repository/queue/store glyph as `inside-card-top` and a `database-symbol` for DB adapters on
   the driven side; branded SaaS/framework logos (Stripe, SendGrid, Kafka, Postgres) as
   `inside-card-left`/`cloud-provider` on the adapter that wraps them — never inside the core.
   Keep the core icon-light; a framework logo inside the hexagon is a content error, not a style nit.
4. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty.
5. **Score.** `score_drawing`; record the number and every penalty.
6. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint and
   re-score. Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a repair pass
   lowers the score, restore the last `save_version` checkpoint and apply a smaller fix.
7. **Polish.** Only after blockers clear, run `auto_polish_drawing`; re-score to confirm no
   regression (rollback if it drops below the checkpoint).
8. **Validate.** `validate_architecture` — exactly one core; every adapter on the correct side
   (driving LEFT, driven RIGHT); every adapter binds to a port (driving adapter -> driving port;
   driven adapter -> driven port); the core depends only on driven ports it owns; no edge points
   outward from the core; no framework type in the core; no orphan adapter or unbound port. An
   outward-pointing edge or a core->adapter dependency is a hard architecture failure, not a penalty.
9. **Review.** `suggest_architecture_improvements` — surface inversion violations (core importing
   an adapter), missing driven ports (core calling a framework directly), infrastructure types
   leaked into the core, fat adapters carrying business logic, a driving adapter wired straight to
   a driven adapter (bypassing the core). Apply accepted fixes, then re-run lint -> score.
10. **Save.** `save_drawing` with a clear title (`"<App> — Hexagonal (Ports & Adapters)"`), then
    `save_version` to checkpoint the accepted state.
11. **Export.** `get_drawing_url` for a link, then `export_drawing` (svg/png/json); re-scan the
    export for secrets (the driven-side DB/SaaS adapters are the common leak here).

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only; draw the hexagon core, the port stubs, and the left/right adapter
  cards by hand; no icon calls.
- **curated** (default) — pull only from **Software Architecture** (services, gateways, ports,
  repositories, queues) and **Architecture diagram components** (generic boxes, pipes, stores,
  hexagon/port glyphs). Branded SaaS/frameworks on the *adapter* cards (never the core) may use
  **Technology Logos** / **Software Logos**; actors on the driving side (a CLI user, an external
  caller) from **Stick Figures**.
- **required** — every driven adapter that wraps a branded SaaS/framework MUST use its logo; every
  port crossing MUST carry a port/plug glyph; a DB adapter MUST use a `database-symbol`; a
  primitive where a curated icon exists is a violation.

Workflow: `search_libraries` -> `inspect_library` (aspect, stroke, fill, complexity) ->
`cache_library` -> `add_library_items_normalized`. Icon slots: `badge` for port/plug markers on
the hexagon boundary, `inside-card-top` for adapter-type glyphs (controller/CLI/repo/queue, 32x32),
`inside-card-left`/`cloud-provider` for SaaS/framework logos on the wrapping adapter,
`database-symbol` for DB driven adapters, `actor` for driving-side people, `legend` for the
driving/driven + port key. Normalize scale, preserve aspect, match the architecture preset's
stroke and fill. **Reject any icon that introduces HIGH_DENSITY, collides with an arrow lane, or
clashes with the preset** — drop it and use a primitive. Never place a framework logo inside the
core hexagon. Record used and rejected items.

## Validation & score
- `hardBlockers` must be empty: no `ARROW_TEXT_INTERSECTION` (a port name or "implements" label
  never sits under a routed line), no `FRAME_TITLE_OVERLAP` (the diagram title, the left/right lane
  headers, and the legend header stay title-only), no `ITEM_OUTSIDE_FRAME` (every adapter fully
  inside its lane; the core fully inside the hexagon; no port stub straddling out of the boundary).
- No arrow over text: each port name / "implements" / "calls" label rides in a clear gutter beside
  its inward line.
- Titles/headers not overlapping: the diagram title, the "Driving / Primary" left header, the
  "Driven / Secondary" right header, and the legend header do not collide with each other or a card.
- Viewport fit: all content kept >= 40px from canvas/export bounds (no `TEXT_NEAR_EDGE`).
- `validate_architecture` clean: one core; driving adapters LEFT and driven adapters RIGHT; every
  adapter bound to a port; core depends only on owned driven ports; no outward edge from the core;
  no framework in the core; no orphan adapter or unbound port.
- **Minimum score 95.** Repair is mandatory below 95 or with any blocker; rollback any pass that
  lowers the score.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. The leak surface here is the **driven
(right-side) adapters**: DB repository connection strings, broker SASL creds, mailer API keys,
payment SaaS secret keys. Redact BEFORE any tool call and re-scan the export:
`postgres://app:<password>@db/orders` becomes `postgres://app:[REDACTED_DATABASE_URL]@db/orders`; API
keys, service-role keys, JWT secrets, bearer/webhook/proxy tokens become typed placeholders
(`[REDACTED_API_KEY]`, `[REDACTED_SERVICE_ROLE]`, `[REDACTED_JWT_SECRET]`,
`[REDACTED_WEBHOOK_SECRET]`, `[REDACTED_PROXY_SECRET]`). Show the *concept* — label the right-side
card "Postgres Repository", a key icon for credentials — not the value. Never echo a detected
secret back to the user.

## Internal prompts
- **Hexagon structure prompt**: `"Hexagonal (Ports & Adapters) diagram for <APP>. Core (center
  hexagon): domain 'Order', 'Money' + application service 'PlaceOrderService' (no frameworks).
  Driving (input) ports on the LEFT boundary face: 'PlaceOrderUseCase', 'OrderQuery'. Driven
  (output) ports on the RIGHT boundary face (owned by the core): 'OrderRepository',
  'PaymentGateway', 'NotificationPort'. Driving adapters (LEFT column, arrows point RIGHT into
  driving ports): 'REST OrderController', 'CLI', 'Kafka OrderConsumer'. Driven adapters (RIGHT
  column, arrows point LEFT to implement driven ports): 'JpaOrderRepository' (implements
  OrderRepository), 'StripePaymentClient' (implements PaymentGateway), 'SmtpMailer' (implements
  NotificationPort). ALL dependencies point toward the hexagon. Legend: driving/primary,
  driven/secondary, port, implements. No framework type in the core."`
- **Convert / repo path**: `create_from_repo_analysis({ analysis: { modules: ["domain",
  "application", "usecase"], entrypoints: ["web", "rest", "controller", "cli", "consumer"],
  database: "PostgreSQL", services: ["PlaceOrderService"], integrations: ["Stripe", "SendGrid"] }
  })` — the domain/application modules collapse into the core, entrypoints become driving (left)
  adapters, and database/services/integrations become driven (right) adapters; then
  `convert_diagram_type({ structure, targetType: "hexagonal" })` if the source was a flat
  clean/layered view.
- **Repair / review nudge**: `"validate_architecture flags an OUTWARD edge: 'PlaceOrderService'
  (core) -> 'JpaOrderRepository' (driven adapter). Fix by inverting it — make 'PlaceOrderService'
  depend on the 'OrderRepository' driven PORT it owns on the right hexagon face, and have
  'JpaOrderRepository' point LEFT to *implement* that port. Re-route the line through the
  right-lane gutter; keep the hexagon fixed and the adapter in the right column."`

## Example prompts for Claude Code
These user prompts should trigger this skill:
- "Map our Order Service as ports & adapters: REST and Kafka drive it; it uses Postgres, Stripe, and SendGrid."
- "Draw a hexagonal architecture for the Wallet service and prove dependency inversion holds."
- "Are we leaking infrastructure into the domain? Show the driving and driven adapters around the core."
- "Reverse-engineer our `billing` repo into a ports-and-adapters hexagon."
- "Reshape our Clean Architecture drawing of the checkout service into a hexagon with left/right lanes."

## Acceptance criteria
- [ ] Exactly one domain/application core in the center (hexagon or center box).
- [ ] Driving (primary) adapters in the LEFT lane; driven (secondary) adapters in the RIGHT lane.
- [ ] Driving ports on the left hexagon face; driven ports (owned by the core) on the right face.
- [ ] Every driving adapter binds to a driving port; every driven adapter implements a driven port;
      an arrow lands on a port stub, never directly on a domain object.
- [ ] Dependency inversion holds: every cross-boundary edge points toward the hexagon; the core
      depends only on driven ports it owns; zero outward edges; no core->adapter dependency.
- [ ] No framework/ORM/SaaS type appears inside the core.
- [ ] Arrows route through gutters; no line crosses a card or another label.
- [ ] Legend states driving/primary, driven/secondary, port, and "implements".
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`).
- [ ] Diagram title, the left/right lane headers, and the legend header do not overlap each other or a card.
- [ ] Libraries used per policy when relevant (port/plug glyphs, driven-side logos; normalized).
- [ ] `validate_architecture` clean and `suggest_architecture_improvements` reviewed/applied.
- [ ] No secrets leaked in drawing, response, or export (driven-side DB URLs and SaaS keys redacted).

## Examples
See `./references/examples.md` for full request -> plan -> ordered tool calls with realistic
arguments, plus `./references/checklist.md` and `./references/anti-patterns.md`. Shared rules live
in `../_shared/references/library-policy.md`, `../_shared/references/security-redaction.md`,
`../_shared/references/geometry-rules.md`, and `../_shared/references/architecture-patterns.md`.
