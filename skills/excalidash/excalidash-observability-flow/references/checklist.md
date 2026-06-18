# Observability Flow — Operating Checklist

A gate-by-gate checklist for building a logs/metrics/traces observability data-flow
diagram. Do not advance to the next gate until the current one passes.

## Gate 0 — Read context
- [ ] Called `read_mcp_guide`; know the technical-docs preset and the scoring rubric.
- [ ] Read `MCP_LIBRARY_MODE` (off / curated / required).
- [ ] Scanned the input for secrets — OTLP ingest tokens / bearer headers, remote-write
      credentials / database URLs, notifier webhook secrets, API keys.

## Gate 1 — Confirm flow scope
- [ ] Listed the **emitting services** and what each emits (metrics / logs / traces).
- [ ] Identified the **collector/agent** (OTel Collector, Fluent Bit/Vector, Prometheus
      scraper, sidecar).
- [ ] Named the three **signal pipelines** (Metrics, Logs, Traces) — or stated which are
      collapsed and why.
- [ ] Named the **storage backend** per signal (e.g. Prometheus, Loki, Tempo).
- [ ] Identified **dashboards** and the **alerting** terminal (rule → notifier → on-call).
- [ ] Identified the **error/backpressure** handling (buffer, drop policy, dead-letter).
- [ ] Marked which edges are **telemetry (dashed)** vs **request/work (solid)**.

## Gate 2 — Plan line (write it before any create call)
- [ ] `TYPE=flowchart` and `DIR=LR`.
- [ ] `PRESET=technical-docs`.
- [ ] `LIBRARY=` off, or curated/required + `Cloud/DevOps, Flow Chart Symbols, Data Flow`.
- [ ] `PATHS=happy|alert|error-backpressure|on-call`.
- [ ] `VALIDATORS=lint,score,repair`.

## Gate 3 — Library decision
- [ ] In `off`: no library calls; collector, lanes, cylinder storage, dashboard panel and
      bell/alert shape drawn with primitives.
- [ ] In `curated`/`required`: searched **Cloud/DevOps** (collector, agent, sidecar, queue),
      **Flow Chart Symbols** (process, decision, terminator for drop/dead-letter), **Data
      Flow** (external entity, process, data store, flow); branded backends from a curated
      logo pack only.
- [ ] Inspected each candidate (aspect, stroke, fill, complexity); cached keepers.
- [ ] Mapped each icon to a slot: `inside-card-left` (node glyph), `database-symbol`
      (storage backends), `legend` (keyed signal swatches + dashed/solid path key).

## Gate 4 — Generate (one path only)
- [ ] Secrets redacted in prompt/`structure` args BEFORE the call.
- [ ] Called exactly ONE create path: `create_diagram_from_prompt` with a `flowchart`
      `structure` (nodes + edges) and `direction: "LR"`.
- [ ] Telemetry edges encoded dashed; request/work edges solid.
- [ ] Three signal pipelines encoded as parallel lanes off the collector.
- [ ] Alert, error/backpressure, and on-call paths encoded as distinct labeled branches.
- [ ] A legend node keys metrics / logs / traces and the dashed/solid style.
- [ ] Captured the returned drawing id.

## Gate 5 — Lint → score → repair loop
- [ ] `lint_drawing`: `hardBlockers` read and listed.
- [ ] `score_drawing`: numeric score and every penalty recorded.
- [ ] `repair_drawing` called for each blocker/penalty (mandatory if score < 95 or blocker
      present).
- [ ] Re-linted and re-scored after each repair.
- [ ] **Rollback applied** if a repair pass lowered the score (restored prior version,
      smaller fix — e.g. widen one lane).
- [ ] Loop exited only at `score >= 95` AND `hardBlockers == []`.

## Gate 6 — Polish + flow validation
- [ ] `auto_polish_drawing` run after blockers cleared; re-scored (no regression).
- [ ] Flow semantics self-checked:
      - [ ] every service reaches the collector,
      - [ ] each signal lands in its own storage backend,
      - [ ] the alert path originates from a rule over stored data, not a service,
      - [ ] the error/backpressure branch terminates in a drop/dead-letter sink (not a loop
            back to a service),
      - [ ] the on-call path escalates primary → secondary → incident.

## Gate 7 — Save + export
- [ ] `save_drawing` with title `"<System> — Observability Flow"`.
- [ ] `save_version` checkpoint of the accepted state.
- [ ] `get_drawing_url` for the shareable link.
- [ ] `export_drawing` produced; export re-scanned for secrets (ingest tokens / remote-write
      creds / webhook URLs).

## Hard blockers (must all be ABSENT)
- [ ] ARROW_TEXT_INTERSECTION — no dashed/solid edge or label crosses any node or edge text;
      parallel pipeline lanes >= 32px apart.
- [ ] FRAME_TITLE_OVERLAP — band titles and legend header stay title-only.
- [ ] ITEM_OUTSIDE_FRAME — every pipeline node fully inside its band/lane.

## Penalties (drive toward zero)
- [ ] TEXT_NEAR_EDGE — content kept >= 40px from canvas/export bounds.
- [ ] HIGH_DENSITY — lanes >= 32px apart, cards >= 48px apart; three pipelines breathe (or
      split into a second view).
- [ ] SMALL_FONT — all text >= 16px (edge labels and legend key included), headings >= 20px.

## Observability-specific sanity checks
- [ ] Telemetry edges are dashed; request/work edges are solid; both keyed in the legend.
- [ ] Three signals (metrics/logs/traces) are individually traceable into distinct storage.
- [ ] The collector/agent sits between services and storage (no direct service→store edge).
- [ ] The alert path, error/backpressure path and on-call escalation are separate branches.
- [ ] Storage backends read as stores (cylinder/data-store symbol), not plain boxes.
- [ ] No raw secret anywhere (ingest token / bearer / remote-write creds / db URL / webhook).

See `../../_shared/references/geometry-rules.md`, `../../_shared/references/library-policy.md`,
`../../_shared/references/security-redaction.md`, and `../../_shared/references/visual-system.md`.
