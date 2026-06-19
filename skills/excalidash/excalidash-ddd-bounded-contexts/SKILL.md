---
name: excalidash-ddd-bounded-contexts
description: Use when you need to draw or review a Domain-Driven Design context map — one frame per bounded context, the aggregates/entities/value objects and ubiquitous-language terms inside each, the shared kernel between contexts, the domain events that flow across boundaries, and the context-mapping relationships (Partnership, Shared Kernel, Customer/Supplier, Conformist, Anticorruption Layer, Open Host Service, Published Language) labeled on every inter-context edge.
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

# DDD Bounded Contexts

## Objective
Produce or review a Domain-Driven Design **context map** for ONE domain: **one frame per bounded
context** (Ordering, Payments, Inventory, Shipping, Catalog, Identity), the **ubiquitous-language
model inside each** frame (aggregate roots, entities, value objects, domain services — using each
context's own vocabulary, where the same word may mean different things in two contexts), the
**shared kernel** drawn as a small jointly-owned block straddling the two contexts that co-own it,
the **domain events** that travel across boundaries (`OrderPlaced`, `PaymentCaptured`,
`StockReserved`), and a **context-mapping relationship** label on every inter-context edge
(Partnership, Shared Kernel, Customer/Supplier with U/D upstream-downstream markers, Conformist,
Anticorruption Layer (ACL), Open Host Service (OHS), Published Language (PL)). The result must score
>= 95 with zero hard blockers, and `validate_architecture` must confirm every context is a frame,
every cross-context edge carries a relationship pattern, and no aggregate is referenced across a
boundary except through a published event or an ACL.

## When to use / When NOT to use
**Use when**: the request is "draw/review our bounded contexts / context map", "show how Ordering,
Payments, and Inventory relate", "where is the shared kernel and who owns it", "which domain events
cross between contexts", "mark the upstream/downstream and anticorruption layers", a strategic-DDD
context-mapping picture, or an audit of an existing map for an unlabeled relationship, a leaked
aggregate, or a missing ACL on a Conformist edge.

**Use when**: a monorepo/modular codebase must be reverse-engineered into contexts — drive
`create_from_repo_analysis`, then group packages/modules into bounded contexts, identify the shared
kernel (code physically depended on by two contexts), and infer events from published/subscribed
message types.

**Do NOT use when**:
- The request is the *inside* of ONE context — its aggregates, invariants, and entity/VO graph in
  detail — without the cross-context map -> draw a single-frame aggregate/tactical-DDD diagram
  (a class-style ER), not a context map.
- The request is a domain core with driving/driven adapters and ports -> use the **Hexagonal
  Architecture Mapper** skill.
- The request is concentric Entities -> Use Cases -> Adapters rings -> use the **Clean Architecture
  Reviewer** skill.
- The request is the runnable apps/services/datastores of one system -> use the **C4 Container** skill.
- The request is split command/query paths -> use **CQRS**; one scenario's time-ordered calls -> a
  sequence diagram; producers -> bus -> consumers wiring -> an **event-driven** diagram (a context
  map shows *which contexts* exchange events, not broker topology).

## Expected input
A short description naming the domain and, ideally, each context with its model and relationships:
- **Bounded contexts** — the named subdomains, each its own frame ("Ordering", "Payments",
  "Inventory", "Shipping", "Catalog", "Identity & Access"). Mark core / supporting / generic if known.
- **Ubiquitous language per context** — the aggregate roots and key entities/value objects in each
  ("Order" aggregate with "OrderLine", "Money" VO in Ordering; "Payment" aggregate, "Card" VO in
  Payments). Note any term that collides across contexts (a "Customer" in Ordering vs. Billing).
- **Shared kernel** — any model jointly owned by two contexts ("Money", "CustomerId") and which two
  contexts own it together.
- **Domain events** — events published by one context and consumed by another ("OrderPlaced" from
  Ordering consumed by Payments + Inventory; "PaymentCaptured" from Payments consumed by Ordering).
- **Relationships** — the context-mapping pattern on each edge: Partnership, Shared Kernel,
  Customer/Supplier (with which side is Upstream/Downstream), Conformist, Anticorruption Layer,
  Open Host Service, Published Language.
If a relationship is missing, infer the most likely pattern and state the assumption; if the input
is a repo, derive contexts and the shared kernel from module/package structure via
`create_from_repo_analysis`.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, scoring rubric.
2. `mcp__excalidash__list_templates` — look for a `ddd` / `context-map` template (optional).
3. `mcp__excalidash__search_libraries` -> `inspect_library` -> `cache_library` — vet context/box,
   aggregate, event (lightning/envelope), shared-kernel, and ACL/gateway icons from curated packs.
4. ONE create path:
   - `mcp__excalidash__apply_architecture_skill` with `pattern: "ddd"` (preferred for the skeleton —
     emits one frame per context, the shared-kernel block straddling its owners, domain-event arrows,
     and the relationship/pattern legend; pass the contexts/events/relationships in `title` + prose,
     not as a hand-built spec), OR
   - `mcp__excalidash__create_diagram_from_prompt` with `diagramType: "ddd"` and an explicit
     `structure: { nodes, edges }` carrying contexts, events, and relationship labels (use this when
     you need a precise context/event/relationship layout), OR
   - `mcp__excalidash__create_from_repo_analysis` to reverse-engineer contexts from a codebase, OR
   - `mcp__excalidash__convert_diagram_type` with `targetType: "ddd"` to reshape an existing
     architecture `structure` into a context map, OR
   - `mcp__excalidash__create_from_template` with the `ddd` / `context-map` template.
5. `mcp__excalidash__add_library_items_normalized` — place context/aggregate/event/shared-kernel/ACL icons.
6. `mcp__excalidash__lint_drawing` -> `score_drawing` -> `repair_drawing` (loop).
7. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
8. `mcp__excalidash__validate_architecture` — confirm every context is a frame, every cross-context
   edge has a relationship pattern, the shared kernel is jointly owned, no aggregate leaks across a boundary.
9. `mcp__excalidash__suggest_architecture_improvements` — flag unlabeled relationships, missing
   ACLs, a god-context, a shared kernel that should be split; apply accepted fixes then re-lint/re-score.
10. `mcp__excalidash__save_drawing` -> `save_version` -> `get_drawing_url` -> `export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=ddd PRESET=architecture LIBRARY=curated[Software Architecture, Architecture diagram components]
   VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`.
   Confirm the contexts (one frame each), the shared kernel and its co-owners, the domain events and
   their producer/consumer contexts, and the relationship pattern on every inter-context edge. Redact
   any secret in the input (DB URL, API key, service-role, token, bearer, webhook/proxy secret)
   BEFORE it reaches a tool argument.
2. **Generate (one path only).**
   - Prefer `apply_architecture_skill({ pattern: "ddd", title: "<Domain> — DDD Context Map" })` so one
     frame per context, the shared-kernel block straddling its two owners, the domain-event arrows, and
     the relationship/pattern legend come from the skeleton. `apply_architecture_skill` takes ONLY
     `{ pattern, preset?, title?, save?, name?, autoPolish? }` — there is no spec argument; describe the
     contexts/events/relationships in the title and refine them after generation, or use
     `create_diagram_from_prompt` when you need to specify the exact graph.
   - For a precise context/event/relationship layout:
     `create_diagram_from_prompt({ diagramType: "ddd", structure: { nodes, edges } })` where `nodes` are
     the contexts (and their aggregates) and `edges` carry the domain-event and relationship-pattern labels.
   - For a codebase: `create_from_repo_analysis({ analysis: { modules, entrypoints, database, services,
     integrations } })`, then group modules into contexts, mark the physically-shared module as the
     shared kernel, and infer events from published/subscribed message types.
   - Fallbacks: `convert_diagram_type({ structure, targetType: "ddd" })` to reshape an architecture
     drawing into a context map; `create_from_template({ templateId: "context-map" })`. Capture the
     returned `id`.
   - Layout intent: **one frame per bounded context**, frames spaced on a grid with >= 80px gutters
     so inter-context arrows route cleanly between them. Aggregate roots sit near the top of each
     frame, supporting entities/VOs below; the context name is the frame title only. The **shared
     kernel** is a small box centered on the seam between the two contexts that own it (touching both
     frame edges), never buried inside one. **Domain-event arrows** carry the event name as the edge
     label and point producer -> consumer. Reserve >= 32px arrow gutters around every frame.
3. **Place icons.** `add_library_items_normalized` — a context/boundary glyph as `badge` on each
   context frame (or a core/supporting/generic marker); an aggregate-root marker as `inside-card-top`
   on each aggregate; a lightning/envelope `event-symbol` on each domain-event edge; a shared-kernel
   glyph on the seam block; an ACL/gateway glyph as `badge` on the downstream side of a Conformist or
   ACL edge. Keep frames icon-light; the value is the labels (aggregate names, event names, pattern
   names), not decoration.
4. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty.
5. **Score.** `score_drawing`; record the number and every penalty.
6. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint and re-score.
   Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a repair pass lowers the
   score, restore the last `save_version` checkpoint and apply a smaller fix.
7. **Polish.** Only after blockers clear, run `auto_polish_drawing`; re-score to confirm no
   regression (rollback if it drops below the checkpoint).
8. **Validate.** `validate_architecture` — every context is its own frame; every inter-context edge
   carries exactly one relationship pattern (Partnership / Shared Kernel / Customer-Supplier with U/D
   / Conformist / ACL / OHS / PL); the shared kernel straddles exactly its two co-owners; every
   domain event has a producer and at least one consumer context; no aggregate from one context is
   referenced inside another except via a published event or through an ACL. An unlabeled
   cross-context edge or a leaked aggregate is a hard architecture failure, not a penalty.
9. **Review.** `suggest_architecture_improvements` — surface unlabeled relationships, a missing ACL
   where a downstream Conformist consumes an upstream model directly, a shared kernel so large it
   should be split into a Published Language, a god-context owning unrelated aggregates, an event with
   no consumer (dead event) or a consumer with no producer (orphan subscription). Apply accepted
   fixes, then re-run lint -> score.
10. **Save.** `save_drawing` with a clear title (`"<Domain> — DDD Context Map"`), then `save_version`
    to checkpoint the accepted state.
11. **Export.** `get_drawing_url` for a link, then `export_drawing` (svg/png/json); re-scan the export
    for secrets (event payloads and integration notes are the common leak here).

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only; draw the context frames, aggregate cards, shared-kernel seam block, and
  event arrows by hand; no icon calls.
- **curated** (default) — pull only from **Software Architecture** (contexts, services, gateways,
  message/event symbols) and **Architecture diagram components** (generic frames, boxes, connectors,
  shared-kernel/overlap glyphs). An ACL may use a gateway/shield glyph; actors at a context boundary
  (a domain expert, an external partner) from **Stick Figures**.
- **required** — every domain-event edge MUST carry an event glyph; the shared kernel MUST carry a
  shared/overlap glyph; an ACL edge MUST carry an ACL/gateway glyph; a primitive where a curated icon
  exists is a violation.

Workflow: `search_libraries` -> `inspect_library` (aspect, stroke, fill, complexity) ->
`cache_library` -> `add_library_items_normalized`. Icon slots: `badge` for context/core-supporting
markers and ACL markers, `inside-card-top` for aggregate-root glyphs (32x32), `event-symbol` for the
lightning/envelope on event edges, `legend` for the relationship-pattern key (Partnership, Shared
Kernel, Customer/Supplier U/D, Conformist, ACL, OHS, PL). Normalize scale, preserve aspect, match the
architecture preset's stroke and fill. **Reject any icon that introduces HIGH_DENSITY, collides with
an arrow lane, or clashes with the preset** — drop it and use a primitive. Record used and rejected items.

## Validation & score
- `hardBlockers` must be empty: no `ARROW_TEXT_INTERSECTION` (an event name or pattern label never
  sits under a routed line), no `FRAME_TITLE_OVERLAP` (each context name, the shared-kernel label, and
  the legend header stay title-only), no `ITEM_OUTSIDE_FRAME` (every aggregate fully inside its
  context frame; the shared kernel intentionally straddling exactly two frame seams is allowed and
  labeled, not an orphan).
- No arrow over text: each event name / pattern label (U/D, ACL, OHS, PL) rides in a clear gutter
  beside its edge, not on the line.
- Titles/headers not overlapping: each context frame title, the shared-kernel label, and the legend
  header do not collide with each other or a card.
- Viewport fit: all content kept >= 40px from canvas/export bounds (no `TEXT_NEAR_EDGE`).
- `validate_architecture` clean: one frame per context; every cross-context edge labeled with a
  relationship pattern; shared kernel jointly owned by exactly its two contexts; every event has a
  producer + consumer; no aggregate leaked across a boundary outside an event or ACL.
- **Minimum score 95.** Repair is mandatory below 95 or with any blocker; rollback any pass that
  lowers the score.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. The leak surface here is **integration notes
and event payloads**: a sample `OrderPlaced` payload carrying a bearer token, a Payments-context note
with a Stripe key, a context's datastore connection string in a sidebar. Redact BEFORE any tool call
and re-scan the export: `postgres://orders:<password>@db/ordering` becomes
`postgres://orders:[REDACTED_DATABASE_URL]@db/ordering`; API keys, service-role keys, JWT secrets,
bearer/webhook/proxy tokens become typed placeholders (`[REDACTED_API_KEY]`,
`[REDACTED_SERVICE_ROLE]`, `[REDACTED_JWT_SECRET]`, `[REDACTED_WEBHOOK_SECRET]`,
`[REDACTED_PROXY_SECRET]`). Show the *concept* — label the event "OrderPlaced (auth: bearer)", not the
token value. Never echo a detected secret back to the user.

## Internal prompts
- **Context-map structure prompt**: `"DDD context map for <DOMAIN> (e-commerce). Bounded contexts
  (one frame each): 'Ordering' (aggregate 'Order' with 'OrderLine', VO 'Money'), 'Payments'
  (aggregate 'Payment', VO 'Card'), 'Inventory' (aggregate 'StockItem'), 'Shipping' (aggregate
  'Shipment'). Shared kernel between Ordering & Payments: 'Money', 'CustomerId'. Domain events:
  'OrderPlaced' (Ordering -> Payments, Inventory), 'PaymentCaptured' (Payments -> Ordering),
  'StockReserved' (Inventory -> Ordering). Relationships: Ordering<->Payments = Shared Kernel;
  Ordering(Customer/Supplier, Upstream)->Inventory(Downstream, Conformist via ACL);
  Ordering->Shipping = Customer/Supplier (OHS + Published Language). Legend: Partnership, Shared
  Kernel, Customer/Supplier (U/D), Conformist, ACL, OHS, PL. No aggregate referenced across a
  boundary except via an event or ACL."`
- **Convert / repo path**: `create_from_repo_analysis({ analysis: { modules: ["ordering","payments",
  "inventory","shipping","shared/money","shared/ids"], entrypoints: ["api/orders","api/payments"],
  database: "postgres", services: ["ordering","payments","inventory","shipping"], integrations:
  ["stripe","carrier-api"] } })`, then group modules into contexts (`shared/money` + `shared/ids` = the
  shared kernel) and infer events from published/subscribed types; if the source was a flat service
  drawing, reshape it with `convert_diagram_type({ structure: <serviceStructure>, targetType: "ddd" })`.
- **Repair / review nudge**: `"validate_architecture flags an UNLABELED cross-context edge:
  'Ordering' -> 'Inventory'. Fix by labeling the relationship Customer/Supplier — mark 'Ordering'
  Upstream (U) and 'Inventory' Downstream (D) — and insert an Anticorruption Layer badge on the
  Inventory side so Inventory does not consume Ordering's 'Order' aggregate directly; route the
  'OrderPlaced' event arrow through the inter-frame gutter and keep its label off the line."`

## Acceptance criteria
- [ ] One frame per bounded context; the context name is the frame title only.
- [ ] Each context's aggregate roots, entities, and value objects sit inside its own frame using that
      context's ubiquitous language (term collisions across contexts are allowed and intentional).
- [ ] The shared kernel is a single block straddling exactly the two contexts that co-own it, labeled.
- [ ] Every domain event is an arrow producer -> consumer with the event name as its edge label.
- [ ] Every inter-context edge carries exactly one relationship pattern (Partnership / Shared Kernel /
      Customer-Supplier with U/D / Conformist / ACL / OHS / PL).
- [ ] No aggregate from one context is referenced inside another except via a published event or an ACL.
- [ ] Arrows route through inter-frame gutters; no line crosses a frame, card, or another label.
- [ ] Legend states the relationship patterns used (and U/D for Customer/Supplier edges).
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`).
- [ ] Context frame titles, the shared-kernel label, and the legend header do not overlap each other
      or a card.
- [ ] Libraries used per policy when relevant (event/shared-kernel/ACL glyphs; normalized).
- [ ] `validate_architecture` clean and `suggest_architecture_improvements` reviewed/applied.
- [ ] No secrets leaked in drawing, response, or export (event payloads and integration notes redacted).

## Examples
See `./references/examples.md` for full request -> plan -> ordered tool calls with realistic
arguments, plus `./references/checklist.md` and `./references/anti-patterns.md`. Shared rules live in
`../_shared/references/library-policy.md`, `../_shared/references/security-redaction.md`,
`../_shared/references/geometry-rules.md`, and `../_shared/references/architecture-patterns.md`.
