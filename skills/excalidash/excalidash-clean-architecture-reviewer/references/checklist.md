# Clean Architecture Reviewer — Operating Checklist

A gate-by-gate checklist for building or reviewing a Clean (Onion) architecture diagram as
concentric rings. Do not advance to the next gate until the current one passes. The non-negotiable
invariant is the **Dependency Rule**: every cross-ring edge points inward.

## Gate 0 — Read context
- [ ] Called `read_mcp_guide`; know the architecture preset and the scoring rubric.
- [ ] Read `MCP_LIBRARY_MODE` (off / curated / required).
- [ ] Scanned the input for secrets — DB connection strings, ORM config, broker creds,
      service-role keys, API keys, JWT secrets, bearer/webhook/proxy tokens (the Frameworks ring
      and gateway adapters are the leak surface).

## Gate 1 — Confirm the four rings (exactly one system)
- [ ] **Entities (core)** — enterprise objects / invariants only; NO framework, NO I/O.
- [ ] **Use Cases** — interactors AND the ports they own (input boundary, output boundary /
      gateway interfaces).
- [ ] **Interface Adapters** — controllers, presenters, view models, gateway/repository
      *implementations*, mappers.
- [ ] **Frameworks & Drivers** — web framework, ORM/DB, UI, broker, external SaaS, devices.
- [ ] For each cross-ring relationship, decided which PORT the inward arrow lands on (never an
      entity directly).
- [ ] Confirmed this is concentric Clean, NOT a hexagon (hexagonal skill) and NOT containers
      (C4) and NOT bounded contexts (DDD).

## Gate 2 — Plan line (write it before any create call)
- [ ] `TYPE=clean`.
- [ ] `PRESET=architecture`.
- [ ] `LIBRARY=` off, or curated/required + `Software Architecture, Architecture diagram components`.
- [ ] `VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`.

## Gate 3 — Library decision
- [ ] In `off`: no library calls; concentric ring frames + port stubs + adapter/framework cards
      drawn with primitives.
- [ ] In `curated`/`required`: searched **Software Architecture** (services, gateways, ports,
      layers) and **Architecture diagram components** (boxes, pipes, stores, ring glyphs);
      outer-ring branded frameworks/SaaS from Technology/Software Logos; people from Stick Figures.
- [ ] Inspected each candidate (aspect, stroke, fill, complexity); cached keepers.
- [ ] Mapped each icon to a slot: `badge` (ring labels, port/plug markers), `inside-card-top`
      (controller/presenter/gateway glyphs), `inside-card-left`/`cloud-provider` (outer-ring logos),
      `legend` (Dependency-Rule key).
- [ ] Confirmed NO framework logo planned for the Entities or Use Cases rings.

## Gate 4 — Generate (one path only)
- [ ] Secrets redacted in prompt/args BEFORE the call.
- [ ] Called exactly ONE of:
      `apply_architecture_skill({ pattern:"clean" })` (preferred),
      `create_from_repo_analysis({ analysis:{ modules, entrypoints, database, services, integrations } })` (codebase reverse-engineer),
      `convert_diagram_type({ structure, targetType:"clean" })` (reshape existing onion/layered drawing),
      `create_diagram_from_prompt({ diagramType:"clean", structure:{ nodes, edges } })`,
      `create_from_template({ templateId:"clean-architecture" })`.
- [ ] Layout intent: concentric rings (Entities core -> Use Cases -> Adapters -> Frameworks) or
      stacked bands with core centered; every arrow head points inward; ports on the inner edge of
      the owning ring; adapters just outside; >= 32px arrow gutters reserved.
- [ ] Captured the returned drawing `id`.

## Gate 5 — Lint -> score -> repair loop
- [ ] `lint_drawing`: `hardBlockers` read and listed.
- [ ] `score_drawing`: numeric score and every penalty recorded.
- [ ] `repair_drawing` called for each blocker/penalty (mandatory if score < 95 or blocker present).
- [ ] Re-linted and re-scored after each repair.
- [ ] **Rollback applied** if a repair pass lowered the score (restored prior version, smaller fix).
- [ ] Loop exited only at `score >= 95` AND `hardBlockers == []`.

## Gate 6 — Polish + architecture validation + review
- [ ] `auto_polish_drawing` run after blockers cleared; re-scored (no regression).
- [ ] `validate_architecture` clean:
      - [ ] four rings present,
      - [ ] every node in exactly one ring (no straddling a ring boundary),
      - [ ] every cross-ring edge points INWARD (Dependency Rule),
      - [ ] ZERO outward-pointing edges,
      - [ ] ports owned by inner ring, implemented by outer adapter; inward arrows land on a port,
      - [ ] no framework/ORM/SaaS type inside Entities or Use Cases,
      - [ ] no orphan node.
- [ ] `suggest_architecture_improvements` run; flagged violations (outward edge, missing port,
      framework leak into core, fat adapter) reviewed; accepted fixes applied then re-linted/re-scored.

## Gate 7 — Save + export
- [ ] `save_drawing` with title `"<System> — Clean Architecture"`.
- [ ] `save_version` checkpoint of the accepted state.
- [ ] `get_drawing_url` for the shareable link.
- [ ] `export_drawing` produced; export re-scanned for secrets (gateway/DB URLs, SaaS keys).

## Hard blockers (must all be ABSENT)
- [ ] ARROW_TEXT_INTERSECTION — no dependency/port line crosses any label or card text.
- [ ] FRAME_TITLE_OVERLAP — each ring title and the legend header stay title-only.
- [ ] ITEM_OUTSIDE_FRAME — every node fully inside its assigned ring; nothing straddles a ring edge.

## Penalties (drive toward zero)
- [ ] TEXT_NEAR_EDGE — content kept >= 40px from canvas/export bounds.
- [ ] HIGH_DENSITY — rings spaced for readable bands; >= 32px arrow lanes; core not crowded.
- [ ] SMALL_FONT — all text >= 16px, ring headings >= 20px, port sub-labels fit with padding.

## Clean-architecture-specific sanity checks
- [ ] Entities ring is framework-free (no ORM annotation, no HTTP type, no SaaS logo).
- [ ] Use Cases ring owns the ports; adapters in the next ring IMPLEMENT them.
- [ ] Every inward arrow terminates on a port/interface or an inner abstraction — never on a
      concrete entity from an outer ring.
- [ ] No outward arrow anywhere (an outward edge is a Dependency-Rule violation, not a style nit).
- [ ] Frameworks & Drivers is the OUTERMOST ring; nothing depends on the system from further out
      except through that ring.
- [ ] The legend states inward = allowed / outward = forbidden.

See ../../_shared/references/geometry-rules.md, ../../_shared/references/library-policy.md,
../../_shared/references/security-redaction.md, and ../../_shared/references/architecture-patterns.md.
