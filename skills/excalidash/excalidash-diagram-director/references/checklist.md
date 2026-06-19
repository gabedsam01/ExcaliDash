# Diagram Director — Operating Checklist

A gate-by-gate checklist for the plan-then-build orchestrator. Do not advance to the next
gate until the current one passes.

## Gate 0 — Read context
- [ ] Called `read_mcp_guide`; know the available presets and the scoring rubric.
- [ ] Read `MCP_LIBRARY_MODE` (off / curated / required).
- [ ] Identified whether input contains secrets (env, connection strings, headers).

## Gate 1 — Classify type (exactly one)
- [ ] Structure of a system / who-talks-to-whom -> **c4**.
- [ ] Ordered steps with branches/decisions -> **flow**.
- [ ] Time-ordered messages between named actors -> **sequence**.
- [ ] Trust boundaries / authn-authz / threats / data classification -> **security**.
- [ ] External entities + processes + stores + flows -> **dataflow**.
- [ ] Mixed request: named the PRIMARY type; flagged secondary as a candidate split.

## Gate 2 — Plan line (write it before any create call)
- [ ] `TYPE=` set to one of flow/c4/sequence/security/dataflow.
- [ ] `PRESET=` chosen (one preset, matches the type).
- [ ] `LIBRARY=` set (off, or curated/required + named packs).
- [ ] `VALIDATORS=` lists lint, score, repair (+ validate_architecture for c4/security/dataflow).

## Gate 3 — Library decision
- [ ] In `off`: no library calls; primitives only.
- [ ] In `curated`/`required`: searched the recommended packs (Software Architecture,
      Flow Chart Symbols, C4 Architecture; Data Flow for dataflow).
- [ ] Inspected each candidate (aspect, stroke, fill, complexity); cached keepers.
- [ ] Mapped each icon to a slot (inside-card-left/top, badge, legend, actor,
      database-symbol, cloud-provider).

## Gate 4 — Generate (one path only)
- [ ] Secrets redacted in the prompt/args BEFORE the call.
- [ ] Called exactly ONE of: `create_diagram_from_prompt`, `create_from_template`,
      `convert_diagram_type`.
- [ ] Captured the returned `drawingId`.

## Gate 5 — Lint -> score -> repair loop
- [ ] `lint_drawing`: `hardBlockers` read and listed.
- [ ] `score_drawing`: numeric score and every penalty recorded.
- [ ] `repair_drawing` called for each blocker/penalty (repair is mandatory if score < 95
      or any blocker present).
- [ ] Re-linted and re-scored after each repair.
- [ ] **Rollback applied** if a repair pass lowered the score (restored prior version,
      tried a smaller fix).
- [ ] Loop exited only at `score >= 95` AND `hardBlockers == []`.

## Gate 6 — Polish + architecture validation
- [ ] `auto_polish_drawing` run after blockers cleared; re-scored (no regression).
- [ ] For c4/security/dataflow: `validate_architecture` clean (no orphan nodes, missing
      boundary, or broken layer dependency).

## Gate 7 — Save + export
- [ ] `save_drawing` with a meaningful title.
- [ ] `save_version` checkpoint of the accepted state.
- [ ] `get_drawing_url` for the shareable link.
- [ ] `export_drawing` produced; export re-scanned for secrets.

## Hard blockers (must all be ABSENT)
- [ ] ARROW_TEXT_INTERSECTION — no arrow/line crosses any text box.
- [ ] FRAME_TITLE_OVERLAP — top 40px of every frame is title-only.
- [ ] ITEM_OUTSIDE_FRAME — every framed element fully inside its frame inner bounds.

## Penalties (drive toward zero)
- [ ] TEXT_NEAR_EDGE — content kept >= 40px from canvas/export bounds.
- [ ] HIGH_DENSITY — gaps >= 48px card/card, 64px frame/frame, 32px arrow lanes.
- [ ] SMALL_FONT — all text >= 16px, headings >= 20px, fits with 16px padding.

See ../../_shared/references/geometry-rules.md, ../../_shared/references/library-policy.md,
and ../../_shared/references/security-redaction.md.
