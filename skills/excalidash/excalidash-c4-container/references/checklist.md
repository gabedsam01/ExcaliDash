# C4 Container — Operating Checklist

A gate-by-gate checklist for building a C4 Level 2 (Container) diagram. Do not advance to the
next gate until the current one passes.

## Gate 0 — Read context
- [ ] Called `read_mcp_guide`; know the architecture preset and the scoring rubric.
- [ ] Read `MCP_LIBRARY_MODE` (off / curated / required).
- [ ] Scanned the input for secrets — datastore connection strings, broker creds, service-role
      keys, API keys, JWT secrets, bearer/webhook/proxy tokens.

## Gate 1 — Confirm container scope (exactly one boundary)
- [ ] Identified ONE software system whose boundary the diagram represents.
- [ ] Listed every *container* with its type (web app / SPA / mobile / API or service / queue /
      database / cache / object store) AND its technology ("React", "Spring Boot", "PostgreSQL").
- [ ] Listed actors that enter the boundary (through a front-end container).
- [ ] Listed external systems each container calls (these live OUTSIDE the boundary).
- [ ] Wrote one interaction phrase + protocol per edge ("calls over HTTPS/JSON", "reads/writes
      via JDBC", "publishes to topic", "authenticates via OAuth").
- [ ] Confirmed NO Level-3 components/classes are in scope (those belong in the Component skill).

## Gate 2 — Plan line (write it before any create call)
- [ ] `TYPE=c4` and `LEVEL=container`.
- [ ] `PRESET=architecture`.
- [ ] `LIBRARY=` off, or curated/required + `C4 Architecture, Software Architecture, Database/Data Platform`.
- [ ] `VALIDATORS=lint,score,repair,validate_architecture`.

## Gate 3 — Library decision
- [ ] In `off`: no library calls; boundary frame + container rectangles + cylinder stores + queue
      shapes drawn with primitives.
- [ ] In `curated`/`required`: searched **C4 Architecture** (container, boundary),
      **Software Architecture** (services, gateways, queues), **Database/Data Platform** (relational,
      document, cache, warehouse, queue); branded externals/infra from Technology/Cloud logos;
      people from Stick Figures.
- [ ] Inspected each candidate (aspect, stroke, fill, complexity); cached keepers.
- [ ] Mapped each icon to a slot: `inside-card-top` (container glyph), `database-symbol` (stores),
      `cloud-provider`/`badge` (infra/external logos), `actor` (people), `legend` (keyed swatches).

## Gate 4 — Generate (one path only)
- [ ] Secrets redacted in prompt/args BEFORE the call.
- [ ] Called exactly ONE of:
      `convert_diagram_type({ structure, targetType:"c4_container" })` (expand an existing context drawing),
      `apply_architecture_skill({ pattern:"c4", title:"<System> — Containers" })`,
      `create_diagram_from_prompt({ diagramType:"c4", structure:{ nodes, edges } })`,
      `create_from_template({ templateId:"c4-container" })`.
- [ ] Layout intent: boundary frame holds containers in a grid; front-ends top, APIs middle,
      datastores/queues bottom; externals outside the frame; >= 32px arrow gutters reserved.
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
      - [ ] exactly one system boundary,
      - [ ] every container inside the boundary frame,
      - [ ] every external system outside the boundary frame,
      - [ ] every interaction edge endpointed and protocol/technology-labeled,
      - [ ] no orphan container, actor, or external system,
      - [ ] no Level-3 components/classes leaked into the view.

## Gate 7 — Save + export
- [ ] `save_drawing` with title `"<System> — Containers"`.
- [ ] `save_version` checkpoint of the accepted state.
- [ ] `get_drawing_url` for the shareable link.
- [ ] `export_drawing` produced; export re-scanned for secrets (datastore URLs / broker creds).

## Hard blockers (must all be ABSENT)
- [ ] ARROW_TEXT_INTERSECTION — no interaction line crosses any label or container text.
- [ ] FRAME_TITLE_OVERLAP — boundary-frame title and legend header stay title-only.
- [ ] ITEM_OUTSIDE_FRAME — every container fully inside the boundary; externals fully outside
      (not half-clipped by the frame edge).

## Penalties (drive toward zero)
- [ ] TEXT_NEAR_EDGE — content kept >= 40px from canvas/export bounds.
- [ ] HIGH_DENSITY — gaps >= 48px container/container, 32px arrow lanes; grid not crowded.
- [ ] SMALL_FONT — all text >= 16px, headings >= 20px, container tech sub-label fits with padding.

## Container-specific sanity checks
- [ ] Every node is a container (typed + technology), not a component or a database table.
- [ ] Datastores read as stores (cylinder/database-symbol), not as plain boxes.
- [ ] Queues/brokers read as queues, distinct from services.
- [ ] External systems sit OUTSIDE the boundary and are styled distinctly (lighter fill).
- [ ] Each interaction label names a protocol/technology, not just "uses".
- [ ] The legend names container types: app / API / store / queue / external.

See ../../_shared/references/geometry-rules.md, ../../_shared/references/library-policy.md,
../../_shared/references/security-redaction.md, and ../../_shared/references/architecture-patterns.md.
