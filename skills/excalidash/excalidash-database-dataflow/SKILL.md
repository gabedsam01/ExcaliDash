---
name: excalidash-database-dataflow
description: Use when you need to draw or review a database ER / schema diagram or a data-flow diagram (DFD) — entity/table cards with columns, keys and cardinality on relation arrows for ER, or external entities, processes and data stores connected by named data flows for a DFD, with cylinder/database symbols for stores and a legend that keys the relationship/flow notation.
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__create_diagram_from_prompt
  - mcp__excalidash__create_from_repo_analysis
  - mcp__excalidash__convert_diagram_type
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

# Database & Data-Flow Diagrammer

## Objective
Produce or review ONE of two related data-shaped views of a single system: an
**entity-relationship / schema (ER)** diagram, or a **data-flow diagram (DFD)**.
- **ER mode** — each entity/table is a **card** with a title row and a column list (column
  name, type, and key markers `PK` / `FK` / `UK`), and each **relation is an arrow** carrying
  cardinality (`1:1`, `1:N`, `N:M`). Many-to-many goes through an explicit junction table.
- **DFD mode** — **external entities**, **processes** and **data stores** are connected by
  **named data flows** (each arrow labelled with the data that moves). External entities are
  squares, processes are rounded shapes, stores are open-ended store shapes or cylinders.

In both modes every persistent **data store uses a cylinder / `database-symbol`** (or its engine
logo), and a **legend keys the notation** (crow's-foot or Chen for ER; Gane–Sarson
process/store/external/flow for DFD). The result **must score >= 95 with zero hard blockers**, and
`validate_architecture` must confirm referential integrity for ER (every FK targets a real PK; no
dangling relation; cardinality on every relation) or flow conservation for DFD (every process has
>= 1 input and >= 1 output; no black-hole or miracle process; every store is reachable).

## When to use / When NOT to use
**Use when**: the request is "draw our database schema / ER diagram", "show the tables and their
foreign keys", "map the relationships between User, Order, Product", "diagram the data flow through
the pipeline", "where does this data get written / read", "show the external sources, the processing
steps and the data stores", "build a Chen / crow's-foot ER diagram", or "make a level-0 / level-1 DFD".

**Use when**: a repository or live schema must be reverse-engineered — derive tables, columns and FK
relations from migration files, ORM models (`@Entity`, `models.py`, Prisma schema, `CREATE TABLE`),
or an `information_schema` dump and feed them as a structured `analysis` to `create_from_repo_analysis`.

**Do NOT use when**:
- The subject is the runnable apps/APIs/services of one system (compute, not data) -> use the
  **C4 Container** skill (`excalidash-c4-container`). Use this skill only when *tables/columns/relations*
  or *data flows* are the subject.
- The subject is publishers emitting events through a broker to subscribers -> use the
  **Event-Driven** skill (`excalidash-event-driven`); a DFD shows data movement between
  processes/stores, not pub-sub topics, partitions and consumer groups.
- The subject is read/write command-query path separation -> use **CQRS**
  (`excalidash-cqrs`); related, but CQRS is about the model split, not the schema or flow itself.
- The subject is bounded contexts / aggregates / a context map -> use a **DDD** skill; a DDD
  aggregate is a consistency boundary, not a normalized table layout.
- The subject is one ordered run's messages with lifelines -> use a **sequence diagram**.

## Expected input
A short description naming the system and the kind of diagram, plus the entities/flows:
- **ER mode** — the entities/tables and their columns. For each table: name, columns
  (`id: uuid PK`, `email: text UK`, `user_id: uuid FK -> users.id`), and the relations to other
  tables with cardinality ("a User has many Orders" = `users 1:N orders`; "Orders to Products is
  many-to-many via `order_items`"). Note junction/join tables, nullable FKs, and unique constraints.
- **DFD mode** — the **external entities** (sources/sinks outside the system: "Customer", "Stripe",
  "Email provider"), the **processes** (transform steps: "Validate Order", "Charge Card", "Send
  Receipt"), the **data stores** (where data rests: "orders DB", "session cache", "S3 raw bucket"),
  and the **named data flows** between them (the arrow label is the data: "order payload", "payment
  token", "receipt pdf"). Note the DFD level (0 = context, 1 = decomposed).
- **Store technology** — relational (Postgres/MySQL), document (MongoDB/DynamoDB), cache
  (Redis/Memcached), warehouse (Snowflake/BigQuery), object store (S3/GCS), queue. Used to pick the
  right curated logo/symbol.

If a column type or cardinality is missing, infer the obvious one and state the assumption. If the
input is a repo/schema, derive tables/columns/relations and pass them as a structured `analysis`.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, scoring rubric.
2. `mcp__excalidash__list_templates` — look for an ER / schema / data-flow template (optional).
3. `mcp__excalidash__search_libraries` -> `mcp__excalidash__inspect_library` ->
   `mcp__excalidash__cache_library` — vet store symbols (cylinder, relational/document/cache/
   warehouse glyphs), engine logos (Postgres, MongoDB, Redis, S3, Snowflake) and DFD
   process/external-entity shapes from the curated packs.
4. ONE create path (mutually exclusive):
   - `mcp__excalidash__create_diagram_from_prompt` with a `structure: { nodes, edges }` (or a
     `prompt`) and `diagramType: "er"` or `diagramType: "data-flow"` — preferred for a described
     schema/flow, OR
   - `mcp__excalidash__create_from_repo_analysis` with a structured `analysis` to reverse-engineer
     tables/columns/FKs from migrations/ORM, OR
   - `mcp__excalidash__convert_diagram_type` with `targetType: "er"` / `"data-flow"` to reshape an
     existing structure, OR
   - `mcp__excalidash__create_from_template` with the matching `templateId`.
5. `mcp__excalidash__add_library_items_normalized` — place a cylinder/`database-symbol` on every
   store, engine logos, and DFD process/external-entity glyphs.
6. `mcp__excalidash__lint_drawing` -> `mcp__excalidash__score_drawing` ->
   `mcp__excalidash__repair_drawing` (loop until clean).
7. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
8. `mcp__excalidash__validate_architecture` — ER referential integrity / DFD flow conservation.
9. `mcp__excalidash__suggest_architecture_improvements` — flag a missing FK index, an orphan table,
   a missing junction table, a write-only/read-only store, a process with no output, an unlabelled flow.
10. `mcp__excalidash__save_drawing` -> `mcp__excalidash__save_version` ->
    `mcp__excalidash__get_drawing_url` -> `mcp__excalidash__export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=er|data-flow PRESET=technical-docs LIBRARY=curated[Data Platform, Software Logos, Data Flow]
   VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`.
   Decide ER vs DFD; list the tables (columns + keys) or the external entities / processes / stores
   (with named flows) and the relation cardinalities or flow labels. **Redact every secret in the
   input** (DB connection URL, service-role key, API key, JWT secret, bearer/webhook/proxy token)
   BEFORE it reaches a tool argument — a `postgres://user:<password>@host/db` is the #1 leak here.
2. **Generate (one path only).**
   - Prefer `create_diagram_from_prompt({ structure: { nodes, edges }, diagramType: "er", direction:
     "LR", title, save: false })` with a fully specified table/relation list, or the same with
     `diagramType: "data-flow"` and an external-entity/process/store/flow structure.
   - For a codebase/schema: `create_from_repo_analysis({ analysis: { modules, entrypoints, database,
     services, integrations }, preset: "technical-docs", save: false })`, then verify the derived
     columns, types, PK/FK markers and cardinality against the source.
   - Fallbacks: `convert_diagram_type({ structure, targetType: "er" | "data-flow" })` to reshape an
     existing structure; `create_from_template({ templateId })`. Capture the returned drawing `id`.
   - Layout intent: **ER** — table cards on a loose grid, related tables adjacent, relation arrows
     between table *sides* (never over a column list), cardinality labels in the gutter beside the
     line. **DFD** — external entities on the LEFT/RIGHT edges, processes in the MIDDLE flowing
     left-to-right (`direction: "LR"`), data stores along the bottom (cylinder / open-ended store
     shape), each flow arrow labelled with the data it carries. Reserve >= 32px arrow gutters so
     relation/flow lines never cross a card's text.
3. **Notation styling (the defining step).** ER relations carry **cardinality** at each end
   (crow's-foot `||` one / `o{` zero-or-many, or Chen `1` / `N`). Mark `PK` (key icon / bold),
   `FK` (italic + `-> target.col`) and `UK` distinctly inside the column list. DFD flows are
   **single-headed solid arrows labelled with the data name**; data stores use the **open-ended
   store shape or a cylinder**; processes use the rounded process shape; external entities use a
   square. The **legend MUST key the notation in use** (crow's-foot symbols, or DFD
   process/store/external/flow).
4. **Place icons.** `add_library_items_normalized` — a **cylinder / `database-symbol` on every data
   store** (the canonical store shape), an engine logo (Software Logos: Postgres, MySQL, MongoDB,
   Redis, S3, Snowflake) as `inside-card-top` on the store, a DFD process / external-entity glyph
   from the Data Flow pack, and a `legend` block keying the notation. Keep table cards icon-light —
   the title row + columns carry the meaning; at most one engine glyph per store.
5. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty. ER/DFD diagrams most often trip
   `ARROW_TEXT_INTERSECTION` (a relation/flow line cutting through a column list or a flow label) —
   route through gutters and bind arrows to card sides.
6. **Score.** `score_drawing`; record the number and every penalty (tall column lists invite
   `HIGH_DENSITY`; cramped column type text invites `SMALL_FONT`).
7. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint and
   re-score. Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a repair pass
   lowers the score, restore the last `save_version` checkpoint and apply a smaller fix.
8. **Polish.** Only after blockers clear, run `auto_polish_drawing`; re-score to confirm no
   regression (rollback if it drops below the checkpoint). Verify polish did NOT drop a cardinality
   label, an FK arrowhead, a PK marker, or a flow label.
9. **Validate.** `validate_architecture` — ER: every FK column targets a real PK in a real table; no
   dangling/orphan relation; every relation carries cardinality; N:M goes through a junction table.
   DFD: every process has >= 1 input flow and >= 1 output flow; no "black hole" (input, no output) or
   "miracle" (output, no input) process; every store is reachable. A dangling FK or a black-hole
   process is a hard architecture failure, not a penalty.
10. **Review.** `suggest_architecture_improvements` — surface a missing index on an FK column, an
    orphan table (no relation), a missing junction table for an N:M, a store with no writer (read-only
    sink), a process with no output, a flow with no label. Apply accepted fixes, then re-run
    lint -> score.
11. **Save.** `save_drawing` with a clear title (`"<System> — ER Diagram"` or `"<System> — Data-Flow
    Diagram (L1)"`), then `save_version` to checkpoint the accepted state.
12. **Export.** `get_drawing_url` for a link, then `export_drawing` (`format: "svg" | "png" |
    "excalidraw"`); re-scan the export for secrets (a `postgres://` / `mongodb://` connection string
    with embedded credentials is the common leak — show the shape, redact the password).

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only; draw each store as a **cylinder** (the universal database symbol),
  tables as titled cards with a column list, DFD processes as rounded rects and external entities
  as squares; no icon calls.
- **curated** (default) — pull only from **Data Platform** (relational / document / cache /
  warehouse / queue store glyphs and the cylinder symbol), **Software Logos** (Postgres, MySQL,
  MongoDB, Redis, S3, Snowflake, BigQuery engine logos) and **Data Flow** (external entity, process,
  data store, flow shapes). Generic boxes/pipes may come from **Architecture diagram components**.
- **required** — every data store MUST use a `database-symbol` (cylinder) or its engine logo; a
  plain rectangle where a cylinder/engine logo exists is a policy violation; DFD
  processes/stores/externals MUST use the Data Flow pack shapes.

Workflow: `search_libraries({ q, mode: "curated", category })` -> `inspect_library({ libraryId })`
(aspect, stroke, fill, complexity) -> `cache_library` -> `add_library_items_normalized({ libraryId,
itemNames, position, slotSize, placement })`. Icon slots: `database-symbol` (the cylinder) on every
store, `inside-card-top` (32x32) for an engine logo on a store, `inside-card-top` for a DFD
process/external glyph, `badge` for a store-type or key marker, `legend` for the notation key.
Normalize scale, preserve aspect, match the preset's stroke and fill. **Reject any icon that
introduces `HIGH_DENSITY`, collides with a relation/flow lane, or clashes with the preset** — drop
it and use the cylinder primitive. Record used and rejected items.

## Validation & score
- `hardBlockers` must be empty: no **`ARROW_TEXT_INTERSECTION`** (a relation/flow line never crosses
  a column list, a cardinality label, or a flow label — the #1 risk here), no **`FRAME_TITLE_OVERLAP`**
  (the diagram title, table title rows and the legend header stay title-only), no
  **`ITEM_OUTSIDE_FRAME`** (every table/store/process fully inside the canvas or its frame).
- No arrow over text: each cardinality label (`1:N`), FK target and DFD flow label rides in a clear
  gutter beside its line, never under a column list.
- No **`SMALL_FONT`**: column name/type text stays >= 16px; never shrink a tall column list below
  16px to fit — drop low-value columns or split the table card instead.
- No **`HIGH_DENSITY`**: card gaps >= 48px, frame gaps >= 64px, arrow lanes >= 32px; a wall of tables
  packed tight trips this — spread them or split into multiple views.
- Viewport fit: all content kept >= 40px from canvas/export bounds (no **`TEXT_NEAR_EDGE`**); long
  column lists do not push a card to the edge.
- `validate_architecture` clean: ER — every FK targets a real PK, no dangling relation, cardinality
  on every relation, N:M via junction; DFD — every process has >= 1 input and >= 1 output, no
  black-hole / miracle process, stores reachable. Stores rendered as cylinders/engine logos; legend
  keys the notation.
- **Minimum score 95 with `hardBlockers == []`.** Repair is mandatory below 95 or with any blocker;
  rollback any pass that lowers the score.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. The dominant leak surface here is the
**database connection string**: a `postgres://user:<password>@host:5432/db`, a
`mongodb+srv://user:<password>@cluster/db`, a Redis `redis://:<password>@host:6379`, a Supabase service-role
key, or an S3 access key on an object-store node. Redact BEFORE any tool call and re-scan the export:
- `postgres://app:<password>@db.internal/main` becomes
  `postgres://app:[REDACTED_DATABASE_URL]@db.internal/main` (show the shape, hide the password).
- A service-role / JWT / API / bearer / webhook value becomes a typed placeholder, e.g.
  `[REDACTED_SERVICE_ROLE]`, `[REDACTED_JWT_SECRET]`, `[REDACTED_API_KEY]`, `[REDACTED_PROVIDER_KEY]`.

Show the *concept* — label a store "Postgres (TLS)", draw a key icon for credentials — not the
value. Never echo a detected secret back to the user, and never put one in a column comment, a flow
label, or a store note. There is a transcript-leak risk: a connection string pasted into the prompt
must be redacted in the plan line too, not only in the drawing.

## Internal prompts
- **ER schema structure**: `"ER diagram for <SYSTEM>. Tables: 'users' (id uuid PK, email text UK,
  created_at timestamptz); 'orders' (id uuid PK, user_id uuid FK -> users.id, total numeric, status
  text); 'products' (id uuid PK, sku text UK, price numeric); 'order_items' (order_id uuid FK ->
  orders.id, product_id uuid FK -> products.id, qty int) as the junction for orders<->products.
  Relations: users 1:N orders (crow's-foot); orders N:M products via order_items. Mark PK/FK/UK on
  each column. Stores rendered as cylinders. Legend keys crow's-foot cardinality. No dangling FK;
  every FK targets a real PK."`
- **DFD structure**: `"Level-1 data-flow diagram for <SYSTEM>. External entities (edges): 'Customer',
  'Stripe', 'Email Provider'. Processes (center, left-to-right): 'Validate Order' -> 'Charge Card' ->
  'Send Receipt'. Data stores (bottom, cylinders): 'orders DB (Postgres)', 'session cache (Redis)',
  'receipts (S3)'. Named flows: Customer -> Validate Order: 'order payload'; Validate Order -> orders
  DB: 'persisted order'; Charge Card -> Stripe: 'payment token'; Stripe -> Charge Card: 'charge
  result'; Send Receipt -> receipts: 'receipt pdf'; Send Receipt -> Email Provider: 'email'. Legend
  keys process/store/external/flow. Every process has >= 1 input and >= 1 output."`
- **Repo derivation**: scan for `schemaHints` (`CREATE TABLE`, `@Entity`, `@Table`, `models.Model`,
  Prisma schema, migration files, `ForeignKey`, `REFERENCES`) and `keyHints` (`PRIMARY KEY`,
  `FOREIGN KEY`, `UNIQUE`, `@Id`, `@ManyToOne`, `@OneToMany`), assemble them into the `analysis`
  object's `database` field, then call `create_from_repo_analysis`.
- **Repair nudge**: `"validate_architecture flags a DANGLING FK: 'orders.customer_id' ->
  'customers.id' but there is no 'customers' table (it is 'users'). Fix by repointing the FK to
  'users.id' and re-binding the relation arrow to the 'users' card side; keep cardinality users 1:N
  orders. Then re-run lint -> score -> validate_architecture."`

## Example prompts for Claude Code
- "Draw the ER diagram for our orders service: users, orders, products and an order_items junction.
  Mark the PKs and FKs and show the cardinality."
- "Make a level-1 data-flow diagram for checkout — Customer and Stripe as external entities, Validate
  Order / Charge Card / Send Receipt as processes, and the orders DB and receipts bucket as stores."
- "Reverse-engineer the schema from this Prisma file into an ER diagram and flag any FK without an
  index."
- "Convert this rough box diagram into a proper crow's-foot ER diagram with a legend."
- "Show where the analytics events get written and read — external sources, the ETL steps, and the
  warehouse, as a DFD."

## Acceptance criteria
- [ ] Diagram kind chosen correctly: ER (tables/columns/relations) or DFD (externals/processes/stores/flows).
- [ ] ER: every entity is a card with a title row and a column list; PK/FK/UK markers present; types shown.
- [ ] ER: every relation arrow carries cardinality (crow's-foot or Chen); N:M goes through a junction table.
- [ ] ER: every FK targets a real PK in a real table — no dangling/orphan relation.
- [ ] DFD: external entities, processes and data stores are distinct shapes; every flow arrow is labelled.
- [ ] DFD: every process has >= 1 input and >= 1 output (no black-hole / miracle process); stores reachable.
- [ ] Every persistent data store is drawn as a cylinder / `database-symbol` (or its engine logo).
- [ ] A legend keys the notation in use (crow's-foot cardinality, or DFD process/store/external/flow).
- [ ] Relation/flow arrows route through gutters; no line crosses a column list, a card, or a label.
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`).
- [ ] Diagram title, table title rows, the legend header (and DFD level label) do not overlap each other or a card.
- [ ] Libraries used per policy when relevant (cylinder store symbol, engine logos, DFD shapes; normalized).
- [ ] `validate_architecture` clean and `suggest_architecture_improvements` reviewed/applied.
- [ ] No secrets leaked in drawing, response, or export (DB connection strings / service-role keys redacted).

## Examples
See `./references/examples.md` for full request -> plan -> ordered tool calls with realistic
arguments, plus `./references/checklist.md` and `./references/anti-patterns.md`. Shared rules live in
`../_shared/references/library-policy.md`, `../_shared/references/security-redaction.md`,
`../_shared/references/geometry-rules.md`, and `../_shared/references/architecture-patterns.md`.
