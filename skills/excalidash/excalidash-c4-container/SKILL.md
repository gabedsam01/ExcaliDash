---
name: excalidash-c4-container
description: Use when you need a C4 Level 2 container view of one system — its apps, APIs, datastores and the interactions between them, grouped in frames with a container-type legend.
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__apply_architecture_skill
  - mcp__excalidash__convert_diagram_type
  - mcp__excalidash__create_diagram_from_prompt
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
  - mcp__excalidash__save_drawing
  - mcp__excalidash__save_version
  - mcp__excalidash__get_drawing_url
  - mcp__excalidash__export_drawing
---

# C4 Container (Level 2)

## Objective
Produce a C4 Container diagram for ONE software system: the runnable/deployable containers
inside its boundary — web apps, mobile apps, single-page apps, API/services, message queues,
and datastores — plus the actors and external systems that touch the boundary, and one labeled
interaction per edge (with protocol/technology). Containers are grouped inside a system-boundary
frame; arrows route through gutters; a legend distinguishes container types (app / API / store /
queue / external). The result must score >= 95 with zero hard blockers.

## When to use / When NOT to use
**Use when**: the request is "show the apps, APIs and databases inside <system> and how they
talk", a Level 2 / container view, an architecture overview for engineers, a deployment-shaped
breakdown of one system, or "zoom into the box from the context diagram".
**Use when**: you already have a C4 **context** diagram and need to expand the central system one
level down -> `convert_diagram_type` to `c4_container`.

**Do NOT use when**:
- The audience just needs scope/actors/integrations of one box -> use the C4 **Context** skill (Level 1).
- The request drills into one container's classes/modules/controllers -> use the C4 **Component**
  skill (Level 3); do not put components on a container diagram.
- The request is time-ordered messages between parts -> use a sequence diagram.
- More than one system's internals are in scope -> draw one container diagram per system; do not
  merge two boundaries into one canvas.

## Expected input
A short description naming exactly one system, plus:
- **Containers** — each with a *type* (web app / SPA / mobile app / API or service / queue /
  database / cache / object store) and a *technology* ("React SPA", "Spring Boot API",
  "PostgreSQL", "Redis", "Kafka", "S3").
- **Actors** — humans that enter the boundary (e.g. "Customer", "Admin") via a front-end container.
- **External systems** — out-of-scope systems a container calls (e.g. "Stripe", "SendGrid", IdP).
- **Interactions** — one phrase + protocol per edge ("reads/writes via JDBC", "calls over HTTPS/JSON",
  "publishes to topic", "authenticates via OAuth"). Each edge connects two containers, or a
  container to an actor/external system.
If types or technologies are missing, infer the obvious ones and state the assumption.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, scoring rubric.
2. `mcp__excalidash__list_templates` — look for a `c4-container` template (optional).
3. `mcp__excalidash__search_libraries` -> `inspect_library` -> `cache_library` — vet container,
   API/service, queue, database and cloud icons from the curated packs.
4. ONE create path:
   - `mcp__excalidash__convert_diagram_type` with `targetType: "c4_container"` to expand an
     existing C4 context drawing (preferred when one exists), OR
   - `mcp__excalidash__apply_architecture_skill` with `pattern: "c4"` (describe the container
     level in the `title` and let the container structure follow), OR
   - `mcp__excalidash__create_diagram_from_prompt` with `diagramType: "c4"` and a container
     `structure` ({ nodes, edges }), OR
   - `mcp__excalidash__create_from_template` with the `c4-container` template.
5. `mcp__excalidash__add_library_items_normalized` — place container/API/queue/store/logo icons.
6. `mcp__excalidash__lint_drawing` -> `score_drawing` -> `repair_drawing` (loop).
7. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
8. `mcp__excalidash__validate_architecture` — confirm container-level correctness.
9. `mcp__excalidash__save_drawing` -> `save_version` -> `get_drawing_url` -> `export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=c4 LEVEL=container PRESET=architecture LIBRARY=curated[C4 Architecture, Software Architecture, Database/Data Platform]
   VALIDATORS=lint,score,repair,validate_architecture`. Confirm exactly one system boundary and
   that every node is a *container* (not a component, not a class). Redact any secret in the input
   (see below) BEFORE it reaches a tool argument.
2. **Generate (one path only).**
   - If a C4 context drawing already exists, prefer
     `convert_diagram_type({ structure, targetType: "c4_container" })` so the central system
     expands into its containers and the boundary frame is generated for you.
   - Otherwise `apply_architecture_skill({ pattern: "c4", title: "<System> — Containers" })` so
     the boundary-frame + container-grid + container-type legend come from the C4 skeleton (the
     container level is conveyed by the title and the container structure you pass downstream).
   - Fallbacks: `create_diagram_from_prompt({ diagramType: "c4", structure: { nodes, edges } })`
     with an explicit container structure, or `create_from_template({ templateId: "c4-container" })`.
     Capture the `drawingId`.
   - Layout intent: a labeled **system-boundary frame** holds the containers in a grid; the SPA/web
     front-ends sit near the top edge where actors enter; APIs/services in the middle band;
     datastores/queues along the bottom; external systems live OUTSIDE the boundary frame. Reserve
     **arrow gutters** (>= 32px lanes) between rows/columns so interaction lines never cross a node.
3. **Place icons.** `add_library_items_normalized` — container glyph as `inside-card-top` for each
   app/service, a database-symbol in the `database-symbol` slot for each datastore, a queue/broker
   icon for message containers, vendor logos as `inside-card-left`/`badge` for branded external
   systems, person icon in the `actor` slot. Keep external-system cards visually distinct (lighter
   fill) and clearly outside the boundary.
4. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty.
5. **Score.** `score_drawing`; record the number and every penalty.
6. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint and
   re-score. Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a repair pass
   lowers the score, restore the last `save_version` checkpoint and apply a smaller fix.
7. **Polish.** Only after blockers clear, run `auto_polish_drawing`; re-score to confirm no
   regression (rollback if it drops below the checkpoint).
8. **Validate.** `validate_architecture` — every container is inside the boundary frame; every
   external system is outside it; every interaction edge has both endpoints and a labeled
   protocol/technology; no container is orphaned; no Level-3 components leaked in.
9. **Save.** `save_drawing` with a clear title (`"<System> — Containers"`), then `save_version`
   to checkpoint the accepted state.
10. **Export.** `get_drawing_url` for a link, then `export_drawing` (svg/png/json); re-scan the
    export for secrets as a backstop (datastore URLs and broker creds are common leaks here).

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only; draw the boundary frame, container rectangles, cylinder datastores
  and queue shapes by hand; no icon calls.
- **curated** (default) — pull only from **C4 Architecture** (container, boundary glyphs),
  **Software Architecture** (services, gateways, queues, layers), and **Database/Data Platform**
  (relational, document, cache, warehouse, queue). Branded externals/infra may use **Technology
  Logos** / **Cloud/DevOps** logos; people from **Stick Figures**.
- **required** — every datastore MUST use a database-symbol, every queue MUST use a queue/broker
  icon, every branded external system/cloud node MUST use its logo; a primitive where a curated
  icon exists is a violation.

Workflow: `search_libraries` -> `inspect_library` (aspect, stroke, fill, complexity) ->
`cache_library` -> `add_library_items_normalized`. Icon slots: `inside-card-top` for container
glyphs (32x32), `database-symbol` for stores, `cloud-provider`/`badge` for infra/external logos,
`actor` for people (48x48), `legend` for the keyed swatches (app / API / store / queue / external).
Normalize scale, preserve aspect, match the architecture preset's stroke and fill. **Reject any
icon that introduces HIGH_DENSITY, collides with an arrow lane, or clashes with the preset** —
drop it and use a primitive. Record used and rejected items.

## Validation & score
- `hardBlockers` must be empty: no `ARROW_TEXT_INTERSECTION` (interaction labels never sit under
  a routed line), no `FRAME_TITLE_OVERLAP` (boundary-frame title and legend header stay
  title-only), no `ITEM_OUTSIDE_FRAME` (every container fully inside the boundary frame; externals
  intentionally outside, not half-clipped).
- No arrow over text: each interaction label rides in a clear gutter beside its routed line.
- Titles/headers not overlapping: the diagram title, the boundary-frame title, and the legend
  header do not collide with each other or with any container.
- Viewport fit: all content kept >= 40px from canvas/export bounds (no `TEXT_NEAR_EDGE`).
- `validate_architecture` clean: one boundary, all containers inside it, externals outside, every
  edge endpointed and protocol-labeled, no orphans, no Level-3 component leakage.
- **Minimum score 95.** Repair is mandatory below 95 or with any blocker; rollback any pass that
  lowers the score.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. Container diagrams are the most secret-prone
C4 level because datastores and brokers carry connection strings. Redact BEFORE any tool call and
re-scan the export: a `postgres://app:<password>@db/main` label becomes
`postgres://app:[REDACTED_DATABASE_URL]@db/main`; Kafka/broker creds, service-role keys, API keys,
JWT secrets, bearer/webhook/proxy tokens become typed placeholders, e.g. `[REDACTED_DATABASE_URL]`,
`[REDACTED_SERVICE_ROLE]`, `[REDACTED_API_KEY]`, `[REDACTED_WEBHOOK_SECRET]`. Show the *concept*
(label an edge "reads/writes via JDBC", show a key icon) not the value. Never echo a detected
secret back to the user.

## Internal prompts
- **Container structure prompt**: `"C4 Container diagram for <SYSTEM>. Boundary: <SYSTEM>.
  Containers: SPA 'Web App' (React), 'Mobile App' (iOS/Android), 'API Application' (Spring Boot),
  'Worker' (consumer), 'Database' (PostgreSQL), 'Cache' (Redis), 'Event Bus' (Kafka). External:
  <E1>, <E2>. Actors: <A1>. Interactions: <A1> uses 'Web App' over HTTPS; 'Web App' calls 'API
  Application' over HTTPS/JSON; 'API Application' reads/writes 'Database' via JDBC; 'API
  Application' caches in 'Redis'; 'API Application' publishes to 'Kafka'; 'Worker' consumes
  'Kafka'; 'API Application' 'makes payments via' <E1>. Group containers in the boundary frame;
  externals outside. Legend: app / API / store / queue / external. No components."`
- **Convert (expand context -> container)**: `convert_diagram_type({ structure: <context
  structure>, targetType: "c4_container", save: true, name: "<System> — Containers" })` — pass the
  existing context drawing's structure so the central system explodes into its containers.
- **Repair nudge**: `"ARROW_TEXT_INTERSECTION on the 'reads/writes via JDBC' edge -> route the
  line through the column gutter and move the label into the side lane with 32px clearance; keep
  the 'Database' container fixed inside the boundary."`

## Example prompts for Claude Code
These user prompts should trigger this skill:
- "Show the apps, APIs and databases inside our Internet Banking System and how they talk."
- "Draw a C4 Level 2 container view of OrderFlow: React SPA, Orders API, Postgres, Redis, Kafka."
- "We already have the context diagram for the billing platform — zoom into that box and show its containers."
- "Give engineers a container diagram of the checkout system, including which protocols each link uses."
- "What runs inside the notifications service, and which datastores and queues does it depend on?"

## Acceptance criteria
- [ ] Exactly one system-boundary frame; every container is inside it; externals are outside it.
- [ ] Every node is a *container* (typed + technology), not a Level-3 component or a class.
- [ ] Every interaction edge is endpointed and labeled with a protocol/technology.
- [ ] Arrows route through gutters; no line crosses a container or another label.
- [ ] Legend distinguishes container types (app / API / store / queue / external).
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`).
- [ ] Diagram title, boundary-frame title, and legend header do not overlap each other or a node.
- [ ] Libraries used per policy when relevant (database-symbol for stores, queue icons, logos; normalized).
- [ ] `validate_architecture` clean: no orphans, no component leakage, boundary correct.
- [ ] No secrets leaked in drawing, response, or export (datastore URLs / broker creds redacted).

## Examples
See `./references/examples.md` for full request -> plan -> ordered tool calls with realistic
arguments, plus `./references/checklist.md` and `./references/anti-patterns.md`. Shared rules
live in `../_shared/references/library-policy.md`, `../_shared/references/security-redaction.md`,
`../_shared/references/geometry-rules.md`, and `../_shared/references/architecture-patterns.md`.
