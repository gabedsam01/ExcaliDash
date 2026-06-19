# n8n Workflow Diagrammer — Operating Checklist

A gate-by-gate checklist for building an n8n / automation node graph. Do not advance to the next gate
until the current one passes. See `../SKILL.md` for the full workflow and `../../_shared/references/*.md`
for shared rules.

## Gate 0 — Read context
- [ ] Called `read_mcp_guide`; know the flow preset and the scoring rubric.
- [ ] Read `MCP_LIBRARY_MODE` (off / curated / required).
- [ ] Scanned the input for secrets — webhook signing secret, HTTP `Authorization: Bearer`, node API keys
      (Slack/OpenAI/HTTP/Sheets), Postgres connection URL, OAuth access/refresh tokens.

## Gate 1 — Confirm flow scope (exactly one trigger)
- [ ] Identified ONE trigger for the LEFT (Webhook / Cron / Manual / Email / Form / app trigger), with
      its type named.
- [ ] Listed processing & integration nodes in execution order (HTTP, Set, Code, Merge, Wait, Slack,
      Gmail, Postgres, OpenAI, Sheets).
- [ ] Listed every branch node (IF / Switch / Filter) with its condition and each output named.
- [ ] Mapped the six operational paths: happy path, retry (bound + backoff), error branch,
      dead-letter sink, observability/notify tap, fallback.
- [ ] Decided terminal / output nodes (Respond to Webhook, NoOp, final notify/write, dead-letter store).
- [ ] Decided which integrations get a Technology Logo.

## Gate 2 — Plan line (write it before any create call)
- [ ] `TYPE=flowchart` and `DIRECTION=LR`.
- [ ] `PRESET=flow`.
- [ ] `LIBRARY=` off, or curated/required + `Flow Chart Symbols, Technology Logos, Data Flow`.
- [ ] `PATHS=happy,retry,error,dead-letter,observability,fallback`.
- [ ] `VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`.
- [ ] Secrets redacted in the prompt/args BEFORE the call.

## Gate 3 — Library decision
- [ ] In `off`: no library calls; trigger terminator, process boxes, decision diamonds, terminals drawn
      with primitives.
- [ ] In `curated`/`required`: searched **Flow Chart Symbols** (start/terminator, process box, decision
      diamond, IO), **Technology Logos** (Slack/Gmail/HTTP/Postgres/OpenAI/Sheets, Webhook/Cron glyphs),
      **Data Flow** (data store for the dead-letter sink).
- [ ] Inspected each candidate (aspect, stroke, fill, complexity); cached keepers.
- [ ] Mapped each icon to a slot: `inside-card-left` (integration logo, 32x32), `badge` (trigger glyph),
      `database-symbol` (dead-letter store), decision-diamond shape (branch nodes).

## Gate 4 — Generate (one path only)
- [ ] Called exactly ONE of:
      `create_diagram_from_prompt({ diagramType:"flowchart", direction:"LR", ... })` (preferred),
      `convert_diagram_type({ structure, targetType:"flowchart" })` (reshape / imported n8n JSON),
      `create_from_template({ templateId:"n8n-workflow" })`.
- [ ] Layout intent: trigger far LEFT, processing/integration nodes flowing RIGHT, branch diamonds in
      line, terminals far RIGHT; >= 32px arrow gutters reserved so each secondary lane has its own channel.
- [ ] Captured the returned drawing id.

## Gate 5 — Branch styling (the defining step)
- [ ] Every fork node (IF / Switch / Filter) is a DIAMOND, not a rectangle.
- [ ] IF outputs labeled `true` and `false`.
- [ ] Switch outputs labeled with each named case (e.g. `"premium"`, `"free"`, `"default"`).
- [ ] Filter outputs labeled `keep` / `drop`.
- [ ] Happy path reads straight LR through the center; `false` / error / fallback paths drop to their own
      separate lanes; no two operational lanes share a gutter.
- [ ] No branch drawn as a plain box; no unlabeled output edge.

## Gate 6 — Operational paths
- [ ] Retry edge labeled with its bound (`retry 3x, backoff`) and arcs back through a dedicated gutter.
- [ ] Error branch routes to a lower lane and reaches a terminal or the dead-letter sink.
- [ ] Dead-letter sink present for exhausted retries / unrecoverable failures (Data Flow data-store glyph).
- [ ] Observability/notify tap (Slack alert / log) branches off without interrupting the happy path.
- [ ] Fallback path present where a primary integration can fail.

## Gate 7 — Icons / libraries (if mode != off)
- [ ] Integration logo (Slack/Gmail/HTTP/Postgres/OpenAI/Sheets) in each integration node's
      `inside-card-left` slot (32x32), one per node.
- [ ] Decision diamonds from Flow Chart Symbols for branch nodes; dead-letter store from Data Flow.
- [ ] Trigger-type glyph (clock for Cron, plug for Webhook) on the trigger node (`badge` / `inside-card-left`).
- [ ] Diamonds kept icon-light so the condition text stays readable.
- [ ] Items normalized (scale, aspect preserved, preset stroke/fill); rejected items recorded.

## Gate 8 — Lint -> score -> repair loop (mandatory)
- [ ] `lint_drawing`: `hardBlockers` read and listed (especially no `ARROW_TEXT_INTERSECTION` on a
      `true`/`false`/case label, a `retry` label, or a back-routed `false`/retry edge).
- [ ] `score_drawing`: numeric score and every penalty recorded.
- [ ] `repair_drawing` called for each blocker/penalty (mandatory if score < 95 or a blocker present).
- [ ] Re-linted and re-scored after each repair.
- [ ] **Rollback applied** if a repair pass lowered the score (restored prior `save_version`, smaller fix).
- [ ] Loop exited only at `score >= 95` AND `hardBlockers == []`.
- [ ] `auto_polish_drawing` run only after blockers clear; re-scored for no regression.
- [ ] Verified polish did NOT round a decision diamond into a rectangle or drop a branch-output / retry label.

## Gate 9 — Architecture validation
- [ ] `validate_architecture` clean: exactly one trigger entry on the left.
- [ ] Connected graph: no orphan / dangling node; every node reachable from the trigger.
- [ ] Every diamond output labeled and reaching a downstream node or a labeled terminal.
- [ ] LR direction consistent (no node flowing right-to-left against the grain).
- [ ] `suggest_architecture_improvements` reviewed; accepted fixes applied then re-lint/re-score
      (IF with no `false`/error path, dangling node, Switch case to nowhere, HTTP node with no retry or
      error handling, failure path with no dead-letter sink).

## Gate 10 — Save & export
- [ ] `save_drawing` with title `"<Workflow> — n8n Automation Flow"`.
- [ ] `save_version` checkpoint of the accepted state.
- [ ] `get_drawing_url` link obtained.
- [ ] `export_drawing` (svg / png / excalidraw) produced.
- [ ] Export re-scanned for secrets (webhook secret, HTTP bearer, node API keys, Postgres URL) — all redacted.

## Hard blockers (must all be ABSENT)
- [ ] ARROW_TEXT_INTERSECTION — no edge crosses a node title, a branch-output label, or a retry label.
- [ ] FRAME_TITLE_OVERLAP — the diagram title and any lane captions stay title-only.
- [ ] ITEM_OUTSIDE_FRAME — every node fully on the canvas, including the dropped error / dead-letter lane.

## Penalties (drive toward zero)
- [ ] TEXT_NEAR_EDGE — content (incl. rightmost terminal and lowest lane) kept >= 40px from the bounds.
- [ ] HIGH_DENSITY — cards >= 48px apart, operational lanes >= 32px apart; grid not crowded.
- [ ] SMALL_FONT — every node label, condition, and edge label >= 16px; headings >= 20px.

## Final gate
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text.
- [ ] One trigger, branches are labeled diamonds, flow reads left-to-right, graph fully connected.
- [ ] Happy / retry / error / dead-letter / observability / fallback each read in their own lane.
- [ ] No secrets leaked anywhere (drawing, response, export).

See ../../_shared/references/geometry-rules.md, ../../_shared/references/library-policy.md,
../../_shared/references/security-redaction.md, and ../../_shared/references/prompt-patterns.md.
