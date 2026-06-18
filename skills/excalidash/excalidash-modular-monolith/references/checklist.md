# Modular Monolith — Operating Checklist

A gate-by-gate checklist for building a modular-monolith diagram. Do not advance to the next gate
until the current one passes.

## Gate 0 — Read context
- [ ] Called `read_mcp_guide`; know the architecture preset and the scoring rubric.
- [ ] Read `MCP_LIBRARY_MODE` (off / curated / required).
- [ ] Scanned the input for secrets — the shared-DB connection string, any module's external SaaS API
      key, service-role keys, JWT secrets, bearer/webhook/proxy tokens.

## Gate 1 — Confirm modular-monolith scope (one shell, one shared DB)
- [ ] Identified ONE deployable (single process/artifact) that becomes the outer application-shell frame.
- [ ] Confirmed it is genuinely one deployable + one shared DB — NOT many services each with its own
      DB (that is the Microservices Topology skill).
- [ ] Listed the modules (vertical slices): each a card inside the shell ("Catalog", "Ordering",
      "Billing", "Identity", "Notifications").
- [ ] For each module, identified its ONE public API/contract — the only legal entry point; internals
      stay hidden.
- [ ] Listed the allowed cross-module dependencies (public-API -> public-API only); anything not
      listed is disallowed.
- [ ] Identified in-process communication: synchronous public-API calls vs. an in-process event bus /
      outbox (who publishes, who subscribes).
- [ ] Confirmed the ONE shared database and its per-module schemas/slices; stated the rule: a module
      touches only its own schema.

## Gate 2 — Plan line (write it before any create call)
- [ ] `TYPE=modular-monolith`.
- [ ] `PRESET=architecture`.
- [ ] `LIBRARY=` off, or curated/required + `Software Architecture, Architecture diagram components`.
- [ ] `VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`.

## Gate 3 — Library decision
- [ ] In `off`: no library calls; shell frame + module cards + bus strip + shared-DB cylinder with
      schema lanes drawn with primitives.
- [ ] In `curated`/`required`: searched **Software Architecture** (modules/components, in-process
      bus/queue, gateways, contracts) and **Architecture diagram components** (boxes, pipes, stores,
      schema lanes); the single shared store from **Database/Data Platform**; the deployable runtime
      logo from Technology/Software Logos (one only, on the shell title band); people at the shell
      edge from Stick Figures.
- [ ] Inspected each candidate (aspect, stroke, fill, complexity); cached keepers.
- [ ] Mapped each icon to a slot: `inside-card-top` (module glyph / bus glyph), `badge`
      (public-API/contract on each module boundary), `database-symbol` (the single shared DB, schemas
      as sub-labels), `inside-card-left` (the one deployable-runtime logo on the shell title band),
      `actor` (shell-edge people), `legend` (module / public-API / event / schema-ownership key).

## Gate 4 — Generate (one path only)
- [ ] Secrets redacted in prompt/args BEFORE the call.
- [ ] Called exactly ONE of:
      `apply_architecture_skill({ pattern:"modular-monolith" })` (preferred; module/schema detail in
      `title`),
      `create_from_repo_analysis({ analysis:{ modules, entrypoints, database, services, integrations } })`
      (reverse-engineer modules + schema ownership),
      `convert_diagram_type({ structure, targetType:"modular-monolith" })` (collapse a microservices
      drawing into one shell + one shared DB),
      `create_diagram_from_prompt({ diagramType:"modular-monolith", structure:{ nodes, edges } })`,
      `create_from_template({ templateId:"modular-monolith" })`.
- [ ] Layout intent: one large outer shell frame (the deployable) with a title band; module cards in a
      grid inside it, each with a public-API stub; an in-process bus strip with publish/subscribe
      edges; the ONE shared DB cylinder below the shell, split into per-module schema lanes, each
      module's persistence edge landing only on its own schema; >= 32px arrow gutters between module
      rows and around the bus.
- [ ] Captured the returned drawing `id`.

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
      - [ ] exactly one application-shell frame (one deployable),
      - [ ] every module fully inside the shell,
      - [ ] exactly one shared database,
      - [ ] each module owns exactly one schema/slice in that DB,
      - [ ] each module's persistence edge lands only on its own schema (no cross-schema reach-through),
      - [ ] every cross-module edge lands on another module's public-API stub (never internals, never a table),
      - [ ] dependency edges match the allowed set,
      - [ ] no module dependency cycle,
      - [ ] no second datastore and no per-module database.
- [ ] `suggest_architecture_improvements` reviewed; accepted fixes applied; re-linted/re-scored.

## Gate 7 — Save + export
- [ ] `save_drawing` with title `"<App> — Modular Monolith"`.
- [ ] `save_version` checkpoint of the accepted state.
- [ ] `get_drawing_url` for the shareable link.
- [ ] `export_drawing` produced; export re-scanned for secrets (the shared-DB connection string).

## Hard blockers (must all be ABSENT)
- [ ] ARROW_TEXT_INTERSECTION — no dependency / publishes / subscribes / schema line crosses a module
      name or any card text.
- [ ] FRAME_TITLE_OVERLAP — shell title, every module-card title, the bus label, and the legend header
      stay title-only.
- [ ] ITEM_OUTSIDE_FRAME — every module fully inside the shell; no module straddling the shell border;
      the shared DB attached, not clipping a module.

## Penalties (drive toward zero)
- [ ] TEXT_NEAR_EDGE — content kept >= 40px from canvas/export bounds.
- [ ] HIGH_DENSITY — gaps >= 48px card/card, 32px arrow lanes; the module grid and bus not crowded.
- [ ] SMALL_FONT — all text >= 16px, headings >= 20px; module names, schema labels, and event labels
      fit with padding.

## Modular-monolith-specific sanity checks
- [ ] There is exactly ONE outer shell frame and the modules live INSIDE it (not free-floating boxes).
- [ ] Every module shows a public-API stub; cross-module arrows land on that stub, not on internals.
- [ ] There is exactly ONE database cylinder; it is partitioned into per-module schema lanes.
- [ ] No module's persistence edge crosses into another module's schema (no shared-table coupling).
- [ ] No module has a private database of its own (that would make it a microservice).
- [ ] In-process bus edges are labelled publish/subscribe; the bus is in-process, not an external broker.
- [ ] No dependency cycle between modules; the allowed-dependency set is fully respected.
- [ ] The deployable-runtime logo (if any) sits ONCE on the shell title band, not on every module.
- [ ] The legend names: module, public API, event (publish/subscribe), schema ownership.

See ../../_shared/references/geometry-rules.md, ../../_shared/references/library-policy.md,
../../_shared/references/security-redaction.md, and ../../_shared/references/architecture-patterns.md.
