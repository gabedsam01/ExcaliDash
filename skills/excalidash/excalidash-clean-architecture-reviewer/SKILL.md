---
name: excalidash-clean-architecture-reviewer
description: Use when you need to draw or review a Clean (Onion/Hexagonal-adjacent) architecture as concentric or layered frames — entities at the core, use cases, interface adapters, frameworks/drivers — and prove the Dependency Rule (dependencies point inward only).
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

# Clean Architecture Reviewer

## Objective
Produce or review a Clean Architecture diagram for ONE system as concentric rings (or stacked
horizontal bands): **Entities/Enterprise Business Rules** at the core, then **Use Cases /
Application Business Rules**, then **Interface Adapters** (controllers, presenters, gateways,
repositories), then **Frameworks & Drivers** (web, DB, UI, devices, external services). The
single hard invariant is the **Dependency Rule**: source-code dependencies and arrows may only
point *inward*; nothing in an inner ring may name anything in an outer ring (the outer world is
reached through ports/interfaces owned by the inner rings). The result must score >= 95 with zero
hard blockers, and `validate_architecture` must confirm no inward-violating (outward-pointing) edge.

## When to use / When NOT to use
**Use when**: the request is "draw/review our Clean Architecture", "show the layers and prove the
dependency direction", "are we violating the Dependency Rule?", an Onion-architecture review, or a
concentric entities -> use-cases -> adapters -> frameworks picture. Also use when an existing
layered drawing needs an audit for outward-pointing arrows or for a layer leaking a framework type
into the core.

**Use when**: a repository should be reverse-engineered into a Clean view — drive
`create_from_repo_analysis` then re-classify packages into the four rings.

**Do NOT use when**:
- The request is ports-and-adapters with an explicit hexagon and named driving/driven ports ->
  use a **hexagonal** skill/preset (`apply_architecture_skill({ pattern: "hexagonal" })`); a
  hexagon is not the same diagram as concentric Clean rings.
- The request is the runnable apps/APIs/datastores of one system -> use the **C4 Container** skill.
- The request is bounded contexts / aggregates / context maps -> use a **DDD** skill.
- The request is split read/write command-query paths -> use **CQRS**.
- The request is one scenario's time-ordered calls -> use a sequence diagram.

## Expected input
A short description naming the system and, ideally, what lives in each ring:
- **Entities (core)** — enterprise business objects / invariants ("Order", "Money", "Account",
  domain policies). No framework, no I/O.
- **Use Cases** — application-specific business rules / interactors ("PlaceOrder", "CancelOrder")
  and the **ports** (input boundary, output boundary / gateway interfaces) they own.
- **Interface Adapters** — controllers, presenters, view models, gateway/repository
  *implementations*, mappers; the ring that converts between use-case shapes and outer formats.
- **Frameworks & Drivers** — web framework, ORM/DB, UI, message broker, external SaaS, devices.
- **Crossings** — which adapter implements which port, and which framework the adapter wraps
  (so the inward arrow lands on a port/interface, never on an entity directly).
If the ring membership is missing, infer the obvious placement and state the assumption; if the
input is a repo, derive rings from package/folder structure via `create_from_repo_analysis`.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, scoring rubric.
2. `mcp__excalidash__list_templates` — look for a `clean-architecture` / `onion` template (optional).
3. `mcp__excalidash__search_libraries` -> `inspect_library` -> `cache_library` — vet ring,
   port/plug, gateway, controller/presenter and framework icons from the curated packs.
4. ONE create path:
   - `mcp__excalidash__apply_architecture_skill` with `pattern: "clean"` (preferred — emits the
     concentric ring skeleton + Dependency-Rule legend), OR
   - `mcp__excalidash__create_from_repo_analysis` to reverse-engineer rings from a codebase, OR
   - `mcp__excalidash__convert_diagram_type` with `targetType: "clean"` to reshape an existing
     layered/onion drawing, OR
   - `mcp__excalidash__create_diagram_from_prompt` with `diagramType: "clean"` and a ring
     `structure`, OR
   - `mcp__excalidash__create_from_template` with the `clean-architecture` template.
5. `mcp__excalidash__add_library_items_normalized` — place ring/port/adapter/framework icons.
6. `mcp__excalidash__lint_drawing` -> `score_drawing` -> `repair_drawing` (loop).
7. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
8. `mcp__excalidash__validate_architecture` — confirm the Dependency Rule (inward-only edges).
9. `mcp__excalidash__suggest_architecture_improvements` — flag outward leaks, missing ports,
   framework types in the core; apply accepted suggestions then re-lint/re-score.
10. `mcp__excalidash__save_drawing` -> `save_version` -> `get_drawing_url` -> `export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=clean PRESET=architecture LIBRARY=curated[Software Architecture, Architecture diagram components]
   VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`.
   Confirm the four rings (entities / use-cases / adapters / frameworks) and that every
   cross-ring edge is intended to point *inward*. Redact any secret in the input (DB URL, API
   key, service-role, token, bearer, webhook/proxy secret) BEFORE it reaches a tool argument.
2. **Generate (one path only).**
   - Prefer `apply_architecture_skill({ pattern: "clean", title: "<System> — Clean Architecture" })`
     so the concentric ring frames, the inward-arrow convention, and the Dependency-Rule legend
     come from the skeleton.
   - For a codebase: `create_from_repo_analysis({ analysis: { modules, entrypoints, database,
     services, integrations } })`, mapping packages into the four rings, then re-classify before
     linting.
   - Fallbacks: `convert_diagram_type({ structure, targetType: "clean" })` to reshape an existing
     onion/layered drawing; `create_diagram_from_prompt({ diagramType: "clean", structure: { nodes,
     edges }, direction: "TB" })` with an explicit ring structure;
     `create_from_template({ templateId: "clean-architecture" })`. Capture the returned drawing id.
   - Layout intent: **concentric rings** (Entities innermost; Use Cases; Interface Adapters;
     Frameworks & Drivers outermost) OR equivalent **stacked horizontal bands** with the core at
     the center band. Every cross-boundary arrow head points toward the center. Ports/interfaces
     sit on the inner edge of the ring that *owns* them; adapter implementations sit just outside,
     with the inward arrow landing on the port — never on an entity. Reserve >= 32px arrow gutters.
3. **Place icons.** `add_library_items_normalized` — a small ring/layer glyph as `badge` per ring
   label, a port/plug icon in a `badge` slot where an adapter implements a port, gateway/controller/
   presenter glyphs as `inside-card-top`, framework/vendor logos as `inside-card-left`/`cloud-provider`
   on the outer ring only. Keep the Entities ring icon-light (domain stays framework-free); a
   framework logo inside the core is a content error, not just a style nit.
4. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty.
5. **Score.** `score_drawing`; record the number and every penalty.
6. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint and
   re-score. Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a repair pass
   lowers the score, restore the last `save_version` checkpoint and apply a smaller fix.
7. **Polish.** Only after blockers clear, run `auto_polish_drawing`; re-score to confirm no
   regression (rollback if it drops below the checkpoint).
8. **Validate.** `validate_architecture` — every node is assigned to exactly one ring; every
   cross-ring edge points inward; no inner ring references an outer ring; ports are owned by the
   inner side and implemented by the outer adapter; no orphan node. An outward-pointing edge is a
   hard architecture failure, not a penalty.
9. **Review.** `suggest_architecture_improvements` — surface Dependency-Rule violations, missing
   ports (use case calling a framework directly), framework/ORM types leaked into Entities, fat
   adapters doing business logic. Apply accepted fixes, then re-run lint -> score.
10. **Save.** `save_drawing` with a clear title (`"<System> — Clean Architecture"`), then
    `save_version` to checkpoint the accepted state.
11. **Export.** `get_drawing_url` for a link, then `export_drawing` (svg/png/json); re-scan the
    export for secrets as a backstop (gateway/DB labels are the common leak here).

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only; draw the concentric ring frames, port stubs, and adapter/framework
  cards by hand; no icon calls.
- **curated** (default) — pull only from **Software Architecture** (services, gateways, ports,
  layers) and **Architecture diagram components** (generic boxes, pipes, stores, ring/layer
  glyphs). Branded frameworks/SaaS on the OUTER ring may use **Technology Logos** / **Software
  Logos**; people, if any actor is shown, from **Stick Figures**.
- **required** — every adapter that wraps a branded framework/SaaS on the outer ring MUST use its
  logo; every port/interface crossing MUST carry a port/plug glyph; a primitive where a curated
  icon exists is a violation.

Workflow: `search_libraries` -> `inspect_library` (aspect, stroke, fill, complexity) ->
`cache_library` -> `add_library_items_normalized`. Icon slots: `badge` for ring labels and
port/plug markers, `inside-card-top` for controller/presenter/gateway glyphs (32x32),
`inside-card-left`/`cloud-provider` for outer-ring framework logos, `legend` for the
Dependency-Rule key (inward = allowed / outward = forbidden). Normalize scale, preserve aspect,
match the architecture preset's stroke and fill. **Reject any icon that introduces HIGH_DENSITY,
collides with an arrow lane, or clashes with the preset** — drop it and use a primitive. Never
place a framework logo inside the Entities or Use Cases rings. Record used and rejected items.

## Validation & score
- `hardBlockers` must be empty: no `ARROW_TEXT_INTERSECTION` (a port/dependency label never sits
  under a routed line), no `FRAME_TITLE_OVERLAP` (each ring's title and the legend header stay
  title-only), no `ITEM_OUTSIDE_FRAME` (every node fully inside its assigned ring frame, no node
  straddling a ring boundary).
- No arrow over text: each dependency/port label rides in a clear gutter beside its inward line.
- Titles/headers not overlapping: the diagram title, the four ring titles, and the legend header
  do not collide with each other or with any card.
- Viewport fit: all content kept >= 40px from canvas/export bounds (no `TEXT_NEAR_EDGE`).
- `validate_architecture` clean: four rings present, every node in exactly one ring, every
  cross-ring edge points inward (Dependency Rule), ports owned inside and implemented outside, no
  outward-pointing edge, no orphan node.
- **Minimum score 95.** Repair is mandatory below 95 or with any blocker; rollback any pass that
  lowers the score.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. The leak surface here is the
**Frameworks & Drivers** ring and the gateway/repository adapters: DB connection strings, ORM
config, broker creds, third-party SaaS keys. Redact BEFORE any tool call and re-scan the export:
`postgres://app:<password>@db/main` becomes `postgres://app:[REDACTED_DATABASE_URL]@db/main`; API keys,
service-role keys, JWT secrets, bearer/webhook/proxy tokens become typed placeholders
(`[REDACTED_API_KEY]`, `[REDACTED_SERVICE_ROLE]`, `[REDACTED_JWT_SECRET]`,
`[REDACTED_WEBHOOK_SECRET]`). Show the *concept* — label the outer ring "Postgres Gateway", a
key icon for credentials — not the value. Never echo a detected secret back to the user.

## Internal prompts
- **Ring structure prompt**: `"Clean Architecture diagram for <SYSTEM> as concentric rings.
  Core/Entities: 'Order', 'Money', 'OrderStatus' (no frameworks). Use Cases: 'PlaceOrderInteractor'
  owning ports 'OrderInputBoundary' (input) and 'OrderRepository', 'PaymentGateway' (output ports).
  Interface Adapters: 'OrderController', 'OrderPresenter', 'SqlOrderRepository' (implements
  OrderRepository), 'StripePaymentGateway' (implements PaymentGateway). Frameworks & Drivers:
  'Web (Express)', 'PostgreSQL', 'Stripe'. ALL dependencies point inward: controllers -> use cases
  -> entities; adapters implement use-case ports; frameworks sit outermost. Legend: inward = allowed,
  outward = Dependency-Rule violation. No framework type in the core."`
- **Convert / repo path**: `create_from_repo_analysis({ analysis: { modules: ["domain",
  "application/usecase", "adapter/controller/presenter/repository", "infra/web/db"], entrypoints:
  ["web"], database: "postgres", services: ["PlaceOrder","NotifyShipment"], integrations:
  ["stripe"] } })` — map `domain` to Entities, `application/usecase` to Use Cases, the adapter
  packages to Interface Adapters, and `infra/web/db` to Frameworks & Drivers; then
  `convert_diagram_type({ structure, targetType: "clean" })` if the source was a flat layered view.
- **Repair / review nudge**: `"validate_architecture flags an OUTWARD edge: 'Order' (Entities) ->
  'SqlOrderRepository' (Adapters). Fix by inverting it — make 'PlaceOrderInteractor' depend on the
  'OrderRepository' PORT it owns in the Use Cases ring, and have 'SqlOrderRepository' point inward
  to that port. Re-route the line through the ring gutter; keep the 'Order' entity fixed in the core."`

## Example prompts for Claude Code
- "Draw our order service in Clean Architecture — Order/Money entities, a PlaceOrder use case,
  Express controllers, Postgres and Stripe on the outside."
- "Review this onion diagram and tell me if anything breaks the Dependency Rule, then fix the
  outward-pointing arrows."
- "Generate a Clean Architecture view from this repo and flag where the core depends on a framework."
- "Are we violating the Dependency Rule? Show the four rings and prove every arrow points inward."
- "Turn our layered UI/Business/Data drawing into proper concentric Clean rings with ports."

## Acceptance criteria
- [ ] Exactly four rings present (Entities, Use Cases, Interface Adapters, Frameworks & Drivers).
- [ ] Every node assigned to exactly one ring; no node straddles a ring boundary.
- [ ] Every cross-ring edge points INWARD; zero outward-pointing edges (Dependency Rule holds).
- [ ] Ports/interfaces are owned by the inner ring and implemented by the outer adapter; inward
      arrows land on a port, never directly on an entity.
- [ ] No framework/ORM/SaaS type appears inside the Entities or Use Cases rings.
- [ ] Arrows route through gutters; no line crosses a card or another label.
- [ ] Legend states the Dependency Rule (inward = allowed / outward = forbidden).
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`).
- [ ] Diagram title, the four ring titles, and the legend header do not overlap each other or a card.
- [ ] Libraries used per policy when relevant (port/plug glyphs, outer-ring logos; normalized).
- [ ] `validate_architecture` clean and `suggest_architecture_improvements` reviewed/applied.
- [ ] No secrets leaked in drawing, response, or export (gateway/DB URLs and SaaS keys redacted).

## Examples
See `./references/examples.md` for full request -> plan -> ordered tool calls with realistic
arguments, plus `./references/checklist.md` and `./references/anti-patterns.md`. Shared rules
live in `../_shared/references/library-policy.md`, `../_shared/references/security-redaction.md`,
`../_shared/references/geometry-rules.md`, and `../_shared/references/architecture-patterns.md`.
