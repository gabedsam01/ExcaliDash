# Troubleshooting Swimlane — Operating Checklist

A gate-by-gate checklist for building an incident/troubleshooting swimlane. Do not advance to the
next gate until the current one passes.

## Gate 0 — Read context
- [ ] Called `read_mcp_guide`; know the `technical-docs` preset and the scoring rubric.
- [ ] Read `MCP_LIBRARY_MODE` (off / curated / required).
- [ ] Scanned the input for secrets — bearer tokens, pager/webhook signing secrets, datastore
      connection strings, API keys, service-role keys, JWT secrets, OAuth/proxy tokens.

## Gate 1 — Confirm lanes, decisions and terminals
- [ ] Identified the **lanes** — one owner each (User, Support L1, On-call Engineer, API/Service,
      Retry Worker, Datastore, Escalation/Pager).
- [ ] Named the **trigger** and which lane it starts in.
- [ ] Listed every **decision** as a question with its yes/no or category exits
      ("Reproducible?", "Transient?", "Within SLA?", "Retries exhausted?").
- [ ] Tagged each path: happy / retry-backoff / error / dead-letter / fallback / escalation.
- [ ] Named the **terminal state** each path reaches (Resolved / Escalated / Dead-letter / Rolled back).
- [ ] Confirmed there is more than one lane (a single-lane flow belongs in `excalidash-flowchart`).

## Gate 2 — Plan line (write it before any create call)
- [ ] `TYPE=swimlane` and `DIRECTION=LR`.
- [ ] `PRESET=technical-docs`.
- [ ] `LIBRARY=` off, or curated/required + `Flow Chart Symbols, Data Flow, Stick Figures`.
- [ ] `LANES=`, `DECISIONS=`, `PATHS=happy,retry,error,dead-letter,fallback,escalation,resolution`.
- [ ] `VALIDATORS=lint,score,repair,validate_architecture`.

## Gate 3 — Library decision
- [ ] In `off`: no library calls; lane bands, start/end terminators, decision diamonds and process
      rectangles drawn with primitives.
- [ ] In `curated`/`required`: searched **Flow Chart Symbols** (start/end, decision, process, IO),
      **Data Flow** (external entity, process, data store) for systems a lane touches, and
      **Stick Figures** for human actors in lane headers.
- [ ] Inspected each candidate (aspect, stroke, fill, complexity); cached keepers.
- [ ] Mapped each icon to a slot: `actor` (lane-header people), `inside-card-top` (start/process
      glyph), decision-diamond glyph on each branch, `legend` (keyed path swatches).

## Gate 4 — Generate (one path only)
- [ ] Secrets redacted in prompt/structure/args BEFORE the call.
- [ ] Called exactly ONE of:
      `convert_diagram_type({ targetType:"swimlane", direction:"LR" })` (re-lane an existing flow),
      `create_diagram_from_prompt({ diagramType:"swimlane", direction:"LR", structure:{ nodes, edges } })`,
      `create_from_template({ templateId:"<swimlane/flow template>" })`.
- [ ] Layout intent: lanes stack top-to-bottom, flow runs left-to-right; trigger at the left edge;
      decisions branch into separate >= 32px gutter lanes; retry loops bend back through a reserved
      gutter; terminal states align on the right edge.
- [ ] Captured the returned drawing id.

## Gate 5 — Lint -> score -> repair loop
- [ ] `lint_drawing`: `hardBlockers` read and listed.
- [ ] `score_drawing`: numeric score and every penalty recorded.
- [ ] `repair_drawing` called for each blocker/penalty (mandatory if score < 95 or blocker present).
- [ ] Re-linted and re-scored after each repair.
- [ ] **Rollback applied** if a repair pass lowered the score (restored prior version, smaller fix).
- [ ] Loop exited only at `score >= 95` AND `hardBlockers == []`.

## Gate 6 — Polish + structural validation
- [ ] `auto_polish_drawing` run after blockers cleared; re-scored (no regression).
- [ ] `validate_architecture` clean:
      - [ ] every step sits in exactly one lane (none straddles a divider),
      - [ ] every decision diamond has >= 2 labelled exits,
      - [ ] every path reaches an explicit terminal state,
      - [ ] retry loops return to a real step and have an exhausted-exit,
      - [ ] no dangling/orphan step.

## Gate 7 — Save + export
- [ ] `save_drawing` with title `"<Incident> — Troubleshooting Swimlane"`.
- [ ] `save_version` checkpoint of the accepted state.
- [ ] `get_drawing_url` for the shareable link.
- [ ] `export_drawing` produced; export re-scanned for secrets (bearer / webhook / db URL).

## Hard blockers (must all be ABSENT)
- [ ] ARROW_TEXT_INTERSECTION — no branch/retry/loop line crosses any step, decision or lane label.
- [ ] FRAME_TITLE_OVERLAP — lane titles stay title-only; no step or icon in the title band.
- [ ] ITEM_OUTSIDE_FRAME — every step fully inside exactly one lane band; none straddles a divider.

## Penalties (drive toward zero)
- [ ] TEXT_NEAR_EDGE — content kept >= 40px from canvas/export bounds.
- [ ] HIGH_DENSITY — >= 48px step gaps, >= 32px branch lanes; lanes not crowded.
- [ ] SMALL_FONT — all text >= 16px, lane titles >= 20px, fitting with 16px padding.

## Swimlane-specific sanity checks
- [ ] Lanes are distinct — exactly one owner per lane.
- [ ] Decisions are diamonds with labelled exits, not plain boxes.
- [ ] Happy path, retry/backoff, error, dead-letter, fallback and escalation are separated and traceable.
- [ ] Every path ends in an explicit terminal state.
- [ ] Retry loops have a "retries exhausted?" exit to dead-letter or escalation.
- [ ] Every step is a clear verb phrase, not a noun.
- [ ] A legend keys lane ownership and path types (happy / retry / error / fallback / terminal).

See ../../_shared/references/geometry-rules.md, ../../_shared/references/library-policy.md, and
../../_shared/references/security-redaction.md.
