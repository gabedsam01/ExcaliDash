# C4 Context — Operating Checklist

A gate-by-gate checklist for building a C4 Level 1 (System Context) diagram. Do not advance
to the next gate until the current one passes.

## Gate 0 — Read context
- [ ] Called `read_mcp_guide`; know the architecture preset and the scoring rubric.
- [ ] Read `MCP_LIBRARY_MODE` (off / curated / required).
- [ ] Scanned the input for secrets (payment keys, auth tokens, webhook secrets, db URLs).

## Gate 1 — Confirm the context scope (exactly one center)
- [ ] Identified ONE software system as the center of the diagram.
- [ ] Listed every human actor/role that interacts with it.
- [ ] Listed every external system it integrates with (third-party or out-of-scope internal).
- [ ] Wrote one short relationship phrase per neighbor, each anchored to the central system.
- [ ] Confirmed NO internal containers/components are in scope (those are Level 2/3).

## Gate 2 — Plan line (write it before any create call)
- [ ] `TYPE=c4` and `LEVEL=context`.
- [ ] `PRESET=architecture`.
- [ ] `LIBRARY=` off, or curated/required + `C4 Architecture, Stick Figures, Software Logos`.
- [ ] `VALIDATORS=lint,score,repair,validate_architecture`.

## Gate 3 — Library decision
- [ ] In `off`: no library calls; central rectangle + primitive actors + external rectangles.
- [ ] In `curated`/`required`: searched **C4 Architecture** (person, system, external-system),
      **Stick Figures** (actors), **Software Logos** (branded external systems).
- [ ] Inspected each candidate (aspect, stroke, fill, complexity); cached keepers.
- [ ] Mapped each icon to a slot: `actor` (people), `inside-card-top` (central system glyph),
      `inside-card-left`/`badge` (external-system logos), `legend` (keyed swatches).

## Gate 4 — Generate (one path only)
- [ ] Secrets redacted in prompt/args BEFORE the call.
- [ ] Called exactly ONE of: `apply_architecture_skill({ pattern:"c4", title:"<System> — System Context" })`,
      `create_diagram_from_prompt({ diagramType:"c4", structure:{ nodes, edges } })`, `create_from_template({ templateId:"c4-context" })`.
- [ ] Layout intent: central system mid-canvas; actors top/left; external systems right/bottom.
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
      - [ ] exactly one central system,
      - [ ] every relationship anchored to the central system,
      - [ ] no orphan actor or external system,
      - [ ] no internal containers/components leaked into the view.

## Gate 7 — Save + export
- [ ] `save_drawing` with title `"<System> — System Context"`.
- [ ] `save_version` checkpoint of the accepted state.
- [ ] `get_drawing_url` for the shareable link.
- [ ] `export_drawing` produced; export re-scanned for secrets.

## Hard blockers (must all be ABSENT)
- [ ] ARROW_TEXT_INTERSECTION — no relationship line crosses any label or node text.
- [ ] FRAME_TITLE_OVERLAP — title band and legend header stay title-only.
- [ ] ITEM_OUTSIDE_FRAME — every framed element fully inside its frame inner bounds.

## Penalties (drive toward zero)
- [ ] TEXT_NEAR_EDGE — content kept >= 40px from canvas/export bounds.
- [ ] HIGH_DENSITY — gaps >= 48px node/node, 32px relationship-line lanes; actors not crowded.
- [ ] SMALL_FONT — all text >= 16px, headings >= 20px, fits with 16px padding.

## Context-specific sanity checks
- [ ] The central system is visually dominant (size/fill) and unmistakably the focus.
- [ ] External systems are styled distinctly (lighter fill) from the central system.
- [ ] Each relationship label reads as a directed phrase ("makes payments using").
- [ ] The legend names exactly three roles: person / system / external system.

See ../../_shared/references/geometry-rules.md, ../../_shared/references/library-policy.md,
../../_shared/references/security-redaction.md, and ../../_shared/references/architecture-patterns.md.
