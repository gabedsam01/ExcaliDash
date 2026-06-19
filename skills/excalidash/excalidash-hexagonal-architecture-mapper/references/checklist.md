# Hexagonal (Ports & Adapters) — Operating Checklist

A gate-by-gate checklist for building a Hexagonal architecture diagram. Do not advance to the next
gate until the current one passes.

## Gate 0 — Read context
- [ ] Called `read_mcp_guide`; know the architecture preset and the scoring rubric.
- [ ] Read `MCP_LIBRARY_MODE` (off / curated / required).
- [ ] Scanned the input for secrets — driven-adapter DB connection strings, broker SASL creds,
      mailer/payment API keys, service-role keys, JWT secrets, bearer/webhook/proxy tokens.

## Gate 1 — Confirm hexagon scope (exactly one core)
- [ ] Identified ONE application whose domain/application core sits at the center.
- [ ] Listed core contents: domain entities/value objects + application services (use cases). NO
      framework, ORM, or I/O type belongs here.
- [ ] Listed the **driving (input) ports** the core exposes ("PlaceOrderUseCase", "OrderQuery").
- [ ] Listed the **driven (output) ports** the core owns ("OrderRepository", "PaymentGateway",
      "NotificationPort").
- [ ] Listed **driving (primary) adapters** (LEFT): REST/GraphQL controller, CLI, message consumer,
      scheduler, test driver — each calls a driving port.
- [ ] Listed **driven (secondary) adapters** (RIGHT): SQL/JPA repository, message producer, mailer,
      payment client, object store — each implements a driven port.
- [ ] Mapped each adapter -> the exact port it binds to (driving adapter -> driving port; driven
      adapter -> driven port).
- [ ] Confirmed NO concentric-ring framing is wanted (that is the Clean Architecture skill).

## Gate 2 — Plan line (write it before any create call)
- [ ] `TYPE=hexagonal`.
- [ ] `PRESET=architecture`.
- [ ] `LIBRARY=` off, or curated/required + `Software Architecture, Architecture diagram components`.
- [ ] `VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`.

## Gate 3 — Library decision
- [ ] In `off`: no library calls; hexagon core + port stubs + left/right adapter rectangles +
      cylinder stores drawn with primitives.
- [ ] In `curated`/`required`: searched **Software Architecture** (services, gateways, ports,
      repositories, queues) and **Architecture diagram components** (boxes, pipes, stores,
      hexagon/port glyphs); branded SaaS/frameworks on adapter cards from Technology/Software Logos;
      people on the driving side from Stick Figures.
- [ ] Inspected each candidate (aspect, stroke, fill, complexity); cached keepers.
- [ ] Mapped each icon to a slot: `badge` (port/plug on the boundary), `inside-card-top`
      (adapter-type glyph), `database-symbol` (DB driven adapters),
      `inside-card-left`/`cloud-provider` (SaaS/framework logos on the wrapping adapter), `actor`
      (driving-side people), `legend` (driving/driven + port key).

## Gate 4 — Generate (one path only)
- [ ] Secrets redacted in prompt/args BEFORE the call.
- [ ] Called exactly ONE of:
      `apply_architecture_skill({ pattern:"hexagonal" })` (preferred),
      `create_from_repo_analysis({ analysis:{ modules, entrypoints, database, services, integrations } })` (reverse-engineer a codebase),
      `convert_diagram_type({ structure, targetType:"hexagonal" })` (reshape a clean/layered drawing),
      `create_diagram_from_prompt({ diagramType:"hexagonal", structure:{ nodes, edges } })`,
      `create_from_template({ templateId:"hexagonal" })`.
- [ ] Layout intent: hexagon/center box in the middle; driving adapters LEFT column (arrows point
      RIGHT into driving ports); driven adapters RIGHT column (arrows point LEFT to implement driven
      ports); port stubs ON the hexagon boundary (driving on left face, driven on right face);
      >= 32px arrow gutters between every adapter row and the hexagon.
- [ ] Captured the returned `drawingId`.

## Gate 5 — Lint -> score -> repair loop
- [ ] `lint_drawing`: `hardBlockers` read and listed.
- [ ] `score_drawing`: numeric score and every penalty recorded.
- [ ] `repair_drawing` called for each blocker/penalty (mandatory if score < 95 or blocker present).
- [ ] Re-linted and re-scored after each repair.
- [ ] **Rollback applied** if a repair pass lowered the score (restored prior version, smaller fix).
- [ ] Loop exited only at `score >= 95` AND `hardBlockers == []`.

## Gate 6 — Polish + architecture validation
- [ ] `auto_polish_drawing` run after blockers cleared; re-scored (no regression).
- [ ] `validate_architecture` clean:
      - [ ] exactly one core,
      - [ ] driving (primary) adapters in the LEFT lane,
      - [ ] driven (secondary) adapters in the RIGHT lane,
      - [ ] every driving adapter bound to a driving port,
      - [ ] every driven adapter implementing a driven port the core owns,
      - [ ] the core depends only on its driven ports (no core->adapter edge),
      - [ ] every cross-boundary edge points toward the hexagon (dependency inversion),
      - [ ] no framework/ORM/SaaS type inside the core,
      - [ ] no orphan adapter and no unbound port.
- [ ] `suggest_architecture_improvements` reviewed; accepted fixes applied; re-linted/re-scored.

## Gate 7 — Save + export
- [ ] `save_drawing` with title `"<App> — Hexagonal (Ports & Adapters)"`.
- [ ] `save_version` checkpoint of the accepted state.
- [ ] `get_drawing_url` for the shareable link.
- [ ] `export_drawing` produced; export re-scanned for secrets (driven-side DB URLs / SaaS keys).

## Hard blockers (must all be ABSENT)
- [ ] ARROW_TEXT_INTERSECTION — no dependency/implements line crosses a port name or any card text.
- [ ] FRAME_TITLE_OVERLAP — diagram title, left/right lane headers, and legend header stay title-only.
- [ ] ITEM_OUTSIDE_FRAME — every adapter fully inside its lane; the core fully inside the hexagon;
      no port stub straddling out of the boundary.

## Penalties (drive toward zero)
- [ ] TEXT_NEAR_EDGE — content kept >= 40px from canvas/export bounds.
- [ ] HIGH_DENSITY — gaps >= 48px card/card, 32px arrow lanes; the two adapter columns not crowded.
- [ ] SMALL_FONT — all text >= 16px, headings >= 20px; port names and "implements" labels fit with padding.

## Hexagonal-specific sanity checks
- [ ] The center is a single domain/application core, NOT an adapter or a framework box.
- [ ] Driving ports sit on the LEFT face; driven ports sit on the RIGHT face of the hexagon.
- [ ] Every arrow points INWARD toward the hexagon (driving adapters point right; driven adapters
      point left to implement; the core points right only to a driven port it owns).
- [ ] No driving adapter is wired directly to a driven adapter (the core must mediate).
- [ ] Driven DB adapters read as stores (cylinder/database-symbol), not plain boxes.
- [ ] Branded SaaS/framework logos sit on the adapter card that wraps them — NEVER inside the core.
- [ ] The legend names: driving/primary, driven/secondary, port, implements.

See ../../_shared/references/geometry-rules.md, ../../_shared/references/library-policy.md,
../../_shared/references/security-redaction.md, and ../../_shared/references/architecture-patterns.md.
