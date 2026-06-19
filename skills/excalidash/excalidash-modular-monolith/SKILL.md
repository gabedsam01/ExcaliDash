---
name: excalidash-modular-monolith
description: Use when you need to draw or review a modular-monolith architecture — ONE deployable application-shell frame containing internal module cards, each module owning a schema/slice inside a single shared database, with explicit module boundaries and allowed cross-module dependencies (no module reaching into another module's tables directly).
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

# Modular Monolith

## Objective
Produce or review a modular-monolith architecture diagram for ONE deployable: an **application-shell
frame** (the single running process / single artifact) that **contains module cards** — vertically
sliced business modules (Catalog, Ordering, Billing, Identity, Notifications) each exposing a public
API/contract and hiding its internals — all sharing **one physical database** where every module
owns its own **schema/slice** and accesses other modules only through their published interface, an
in-process API, or domain events on an in-process bus. The hard invariants are: exactly one
application-shell frame and exactly one shared database; every module fully inside the shell; every
cross-module edge lands on another module's **public API** (never on its internals and never on
another module's schema/table); the shared DB is partitioned into per-module schemas with no
cross-schema foreign-key reach-through. The result must score >= 95 with zero hard blockers, and
`validate_architecture` must confirm the single-deployable + shared-DB shape with clean module
boundaries.

## When to use / When NOT to use
**Use when**: the request is "draw/review our modular monolith", "show the modules inside our single
deployable and the one shared database", "are our modules leaking into each other's tables?", "prove
each module owns its own schema in the shared DB", "we want microservice-style boundaries but one
process / one DB for now", or an audit of an existing modular-monolith picture for a cross-module
reach-through or a second database creeping in.

**Use when**: a repository must be reverse-engineered into a modular monolith — drive
`create_from_repo_analysis`, then group packages/assemblies into modules, identify each module's
public API surface, and map which DB schema each module owns.

**Do NOT use when**:
- The system is genuinely many independently deployed services each with its OWN database behind a
  gateway -> use the **Microservices Topology** skill (separate deployables + DB-per-service, NOT one
  shell + one shared DB).
- The request is a domain core with driving/driven adapters on the boundary -> use the **Hexagonal
  Architecture Mapper** skill.
- The request is concentric rings (Entities -> Use Cases -> Adapters -> Frameworks) -> use the
  **Clean Architecture Reviewer** skill.
- The request is bounded contexts / aggregates / context maps -> use a **DDD** skill (a modular
  monolith may *realize* bounded contexts as modules, but that is a different lens).
- The request is split read/write paths -> use **CQRS**; one scenario's timed calls -> a sequence
  diagram; the runnable apps/datastores at C4 Container granularity -> the **C4 Container** skill.

## Expected input
A short description naming the application and, ideally:
- **The deployable** — the single process/artifact name and runtime ("Acme Commerce — single Spring
  Boot app", ".NET monolith `Acme.Web`"). This becomes the outer **application-shell frame**.
- **The modules** — the internal vertical slices, each a card inside the shell ("Catalog",
  "Ordering", "Billing", "Identity", "Notifications"). For each: its **public API/contract** (the
  only legal entry point) and a hint at its internals (kept hidden).
- **Allowed dependencies** — which module may call which module's public API ("Ordering -> Catalog
  (read product), Ordering -> Billing (charge), Billing -> Identity (resolve customer)"). Anything
  not listed is disallowed (and a reach-through is a violation).
- **In-process communication** — synchronous public-API calls vs. an **in-process event bus** /
  outbox ("Ordering publishes `OrderPlaced`; Notifications + Billing subscribe").
- **The shared database** — the ONE physical DB, partitioned into per-module **schemas/slices**
  ("`catalog`, `ordering`, `billing`, `identity` schemas in one Postgres"). State the rule: a module
  only touches its own schema; cross-module data needs the other module's API, not its tables.
If a region is missing, infer the obvious placement and state the assumption; if the input is a
repo, derive modules and schema ownership from package/migration structure via
`create_from_repo_analysis`.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, scoring rubric.
2. `mcp__excalidash__list_templates` — look for a `modular-monolith` template (optional).
3. `mcp__excalidash__search_libraries` -> `inspect_library` -> `cache_library` — vet module/component,
   public-API/contract, in-process bus, database/schema, and (optional) language/framework icons
   from the curated packs (default **Software Architecture**).
4. ONE create path:
   - `mcp__excalidash__apply_architecture_skill` with `pattern: "modular-monolith"` (preferred — emits
     the outer application-shell frame, the module cards inside it, the in-process bus, and the single
     shared DB partitioned into per-module schemas), OR
   - `mcp__excalidash__create_from_repo_analysis` to reverse-engineer modules + schema ownership from
     a codebase, OR
   - `mcp__excalidash__convert_diagram_type` with `targetType: "modular-monolith"` to collapse a
     microservices drawing into one shell + one shared DB, OR
   - `mcp__excalidash__create_diagram_from_prompt` with `diagramType: "modular-monolith"` and a module
     `structure` ({ nodes, edges }), OR
   - `mcp__excalidash__create_from_template` with the `modular-monolith` template.
5. `mcp__excalidash__add_library_items_normalized` — place module, public-API, bus, and shared-DB icons.
6. `mcp__excalidash__lint_drawing` -> `score_drawing` -> `repair_drawing` (loop).
7. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
8. `mcp__excalidash__validate_architecture` — confirm one shell, one shared DB, per-module schemas,
   clean module boundaries.
9. `mcp__excalidash__suggest_architecture_improvements` — flag reach-throughs, shared-table coupling,
   a second DB, a cyclic module dependency; apply accepted fixes then re-lint/re-score.
10. `mcp__excalidash__save_drawing` -> `save_version` -> `get_drawing_url` -> `export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=modular-monolith PRESET=architecture LIBRARY=curated[Software Architecture, Architecture diagram components]
   VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`.
   Confirm: ONE application-shell frame, the module list (each with its public API), the allowed
   dependency edges (module-API -> module-API only), the in-process bus, and the ONE shared DB with
   its per-module schemas. Redact any secret in the input (shared-DB connection string, API key,
   service-role, token, bearer, webhook/proxy secret) BEFORE it reaches a tool argument.
2. **Generate (one path only).**
   - Prefer `apply_architecture_skill({ pattern: "modular-monolith" })` so the outer shell frame, the
     module-card grid inside it, the in-process event bus, the legend, and the single shared DB
     partitioned into per-module schemas all come from the skeleton. Convey the module/schema detail in
     `title` and refine the slices afterward with `create_diagram_from_prompt`/`convert_diagram_type`.
   - For a codebase: `create_from_repo_analysis({ analysis: { modules, entrypoints, database,
     services, integrations } })`, then group packages into modules, mark each module's public API
     package, and assign each module the DB schema it owns from the migration folders.
   - Fallbacks: `convert_diagram_type({ structure, targetType: "modular-monolith" })` to collapse a
     microservices drawing into one shell + one shared DB; `create_diagram_from_prompt({ diagramType:
     "modular-monolith", structure: { nodes, edges } })` with an explicit module spec;
     `create_from_template({ templateId: "modular-monolith" })`. Capture the returned `id`.
   - Layout intent: a **single large outer frame = the deployable** with a title band; **module cards
     arranged in a grid inside it**, each card showing a "public API" stub on its boundary and its
     internals hidden; an **in-process bus** strip the modules attach to (publish/subscribe edges);
     the **ONE shared database** drawn as a single cylinder BELOW the shell, internally divided into
     per-module **schema lanes** (`catalog`, `ordering`, ...), each module's persistence edge landing
     ONLY on its own schema. Reserve >= 32px arrow gutters between module rows and around the bus.
3. **Place icons.** `add_library_items_normalized` — a module/component glyph as `inside-card-top` on
   each module card; a contract/plug glyph as a `badge` on each module's public-API stub; a bus/queue
   glyph on the in-process bus strip (`inside-card-top`); a `database-symbol` for the single shared DB
   cylinder with per-schema sub-labels; optional language/framework logo for the deployable runtime as
   `inside-card-left` on the shell's title band. Keep module internals icon-light. A SECOND
   database-symbol anywhere is a content error (a modular monolith has exactly one shared DB), not a
   style nit.
4. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty.
5. **Score.** `score_drawing`; record the number and every penalty.
6. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint and re-score.
   Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a repair pass lowers the
   score, restore the last `save_version` checkpoint and apply a smaller fix.
7. **Polish.** Only after blockers clear, run `auto_polish_drawing`; re-score to confirm no
   regression (rollback if it drops below the checkpoint).
8. **Validate.** `validate_architecture` — exactly ONE application-shell frame; every module fully
   inside it; exactly ONE shared database; each module owns exactly one schema/slice in that DB; every
   cross-module edge lands on a public-API stub (never on internals, never on another module's
   schema/table); the dependency edges match the allowed set; no module cycle; no second datastore. A
   cross-module table reach-through, a second DB, or a module-internals edge is a hard architecture
   failure, not a penalty.
9. **Review.** `suggest_architecture_improvements` — surface reach-throughs (module touching another
   module's schema), shared-table coupling, a god-module, a cyclic dependency, a missing public API
   (callers binding to internals), or a creeping second datastore that signals an unintended split.
   Apply accepted fixes, then re-run lint -> score.
10. **Save.** `save_drawing` with a clear title (`"<App> — Modular Monolith"`), then `save_version`
    to checkpoint the accepted state.
11. **Export.** `get_drawing_url` for a link, then `export_drawing` (svg/png/json); re-scan the
    export for secrets (the shared-DB cylinder label is the common leak here).

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only; draw the outer shell frame, the module cards, the bus strip, and the
  shared-DB cylinder with schema lanes by hand; no icon calls.
- **curated** (default) — pull only from **Software Architecture** (modules/components, in-process
  bus/queue, gateways, contracts) and **Architecture diagram components** (generic boxes, pipes,
  stores, schema lanes); the single shared store from **Database/Data Platform**; the deployable's
  runtime/language from **Software Logos** / **Technology Logos** (one logo on the shell title band,
  not on every module); actors at the shell edge from **Stick Figures**.
- **required** — the single shared DB MUST use a `database-symbol`; every module's public-API stub
  MUST carry a contract/plug glyph; the in-process bus MUST use a bus/queue glyph; a primitive where a
  curated icon exists is a violation.

Workflow: `search_libraries` -> `inspect_library` (aspect, stroke, fill, complexity) ->
`cache_library` -> `add_library_items_normalized`. Icon slots: `inside-card-top` for the module glyph
and bus glyph (32x32), `badge` for the public-API/contract marker on each module boundary,
`database-symbol` for the single shared DB cylinder (schemas as sub-labels), `inside-card-left` for
the one deployable-runtime logo on the shell title band, `actor` for shell-edge people, `legend` for
the module / public-API / event / schema-ownership key. Normalize scale, preserve aspect, match the
architecture preset's stroke and fill. **Reject any icon that introduces HIGH_DENSITY, collides with
an arrow lane, or clashes with the preset** — drop it and use a primitive. Never draw a second
database-symbol. Record used and rejected items.

## Validation & score
- `hardBlockers` must be empty: no `ARROW_TEXT_INTERSECTION` (a module name, dependency label, or
  schema label never sits under a routed line), no `FRAME_TITLE_OVERLAP` (the deployable shell title,
  each module-card title, the bus label, and the legend header stay title-only), no
  `ITEM_OUTSIDE_FRAME` (every module fully inside the shell; no module card straddling the shell
  border; the shared DB clearly attached, not clipping a module).
- No arrow over text: each dependency / "publishes" / "subscribes" / schema label rides in a clear
  gutter beside its line.
- Titles/headers not overlapping: the deployable shell title, every module-card title, the in-process
  bus label, and the legend header do not collide with each other or a card.
- Viewport fit: all content kept >= 40px from canvas/export bounds (no `TEXT_NEAR_EDGE`).
- `validate_architecture` clean: one application-shell frame; one shared DB; per-module schemas; every
  cross-module edge on a public-API stub; allowed-dependency set respected; no module cycle; no second
  datastore; no schema reach-through.
- **Minimum score 95.** Repair is mandatory below 95 or with any blocker; rollback any pass that
  lowers the score.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. The leak surface here is the **single shared
database** (its connection string) and any module that talks to an external SaaS. Redact BEFORE any
tool call and re-scan the export: `postgres://acme:<password>@db.internal/acme` becomes
`postgres://acme:[REDACTED_DATABASE_URL]@db.internal/acme`; API keys, service-role keys, JWT secrets,
bearer/webhook/proxy tokens become typed placeholders (`[REDACTED_API_KEY]`,
`[REDACTED_SERVICE_ROLE]`, `[REDACTED_JWT_SECRET]`, `[REDACTED_WEBHOOK_SECRET]`,
`[REDACTED_PROXY_SECRET]`). Show the *concept* — label the shared store "Shared Postgres
(catalog/ordering/billing schemas)", a key icon for credentials — not the value. Never echo a
detected secret back to the user.

## Internal prompts
- **Shell + modules structure prompt**: `"Modular-monolith diagram for <APP> (single deployable
  '<artifact>'). Outer application-shell frame contains module cards: 'Catalog', 'Ordering',
  'Billing', 'Identity', 'Notifications'. Each module exposes ONE public API stub on its boundary;
  internals hidden. Allowed dependencies (public-API to public-API only): Ordering -> Catalog,
  Ordering -> Billing, Billing -> Identity. In-process event bus strip: Ordering publishes
  'OrderPlaced'; Billing and Notifications subscribe. ONE shared database below the shell, drawn as a
  single cylinder split into per-module schemas: catalog, ordering, billing, identity; each module's
  persistence edge lands ONLY on its own schema (no cross-schema reach-through). Legend: module,
  public API, event (publish/subscribe), schema ownership. No second database."`
- **Convert / repo path**: `create_from_repo_analysis({ analysis: { modules: ["catalog","ordering",
  "billing","identity","notifications"], entrypoints: ["Acme.Web"], database: { engine: "postgres",
  schemas: ["catalog","ordering","billing","identity"] }, services: [], integrations: ["sendgrid"] },
  save: true, name: "<App> — Modular Monolith" })` then `convert_diagram_type({ structure, targetType:
  "modular-monolith" })` if the source was a microservices drawing, to collapse it into one shell +
  one shared DB.`
- **Repair / review nudge**: `"validate_architecture flags a REACH-THROUGH: 'Ordering' writes
  directly to the 'billing' schema. Fix by removing that persistence edge and routing Ordering to
  'Billing' module's PUBLIC API (charge) instead; Billing alone writes its own 'billing' schema.
  Re-route the call line through the module-row gutter to the Billing public-API stub; keep the shared
  DB and schema lanes fixed."`

## Example prompts for Claude Code
These user prompts should trigger this skill:
- "Draw our Acme Commerce modular monolith: one Spring Boot app with Catalog, Ordering, Billing, Identity and Notifications modules over one shared Postgres."
- "Show the modules inside our single deployable and the one shared database, with each module owning its own schema."
- "Audit this modular-monolith diagram — is any module reaching into another module's tables?"
- "Reverse-engineer `acme-platform` into a modular monolith and show whether any module reads another module's schema."
- "We ship one process and one database — reshape our microservices drawing into a modular monolith with an in-process bus."

## Acceptance criteria
- [ ] Exactly one application-shell frame (the single deployable), with a title band.
- [ ] All modules rendered as cards fully inside the shell; each shows a public-API stub on its boundary.
- [ ] Exactly one shared database, drawn as a single cylinder, partitioned into per-module schemas.
- [ ] Each module's persistence edge lands ONLY on its own schema (no cross-schema reach-through).
- [ ] Every cross-module edge lands on another module's public API — never on internals, never on a table.
- [ ] Dependency edges match the allowed set; no disallowed edge; no module dependency cycle.
- [ ] In-process bus present with publish/subscribe edges (when events are in scope).
- [ ] No second datastore and no per-module database (that would be microservices).
- [ ] Arrows route through gutters; no line crosses a card or another label.
- [ ] Legend states module, public API, event (publish/subscribe), and schema ownership.
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`).
- [ ] Shell title, every module-card title, the bus label, and the legend header do not overlap.
- [ ] Libraries used per policy when relevant (module/contract/bus glyphs, single shared DB symbol; normalized).
- [ ] `validate_architecture` clean and `suggest_architecture_improvements` reviewed/applied.
- [ ] No secrets leaked in drawing, response, or export (shared-DB connection string redacted).

## Examples
See `./references/examples.md` for full request -> plan -> ordered tool calls with realistic
arguments, plus `./references/checklist.md` and `./references/anti-patterns.md`. Shared rules live
in `../_shared/references/library-policy.md`, `../_shared/references/security-redaction.md`,
`../_shared/references/geometry-rules.md`, and `../_shared/references/architecture-patterns.md`.
