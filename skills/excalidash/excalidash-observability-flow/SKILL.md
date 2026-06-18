---
name: excalidash-observability-flow
description: Use when you need a logs/metrics/traces observability pipeline — instrumented services → collector/agent → per-signal pipelines → storage → dashboards + alerting — with dashed telemetry edges, separate alert / error-backpressure / on-call paths, and a signal-type legend.
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__create_diagram_from_prompt
  - mcp__excalidash__search_libraries
  - mcp__excalidash__inspect_library
  - mcp__excalidash__cache_library
  - mcp__excalidash__add_library_items_normalized
  - mcp__excalidash__lint_drawing
  - mcp__excalidash__score_drawing
  - mcp__excalidash__repair_drawing
  - mcp__excalidash__auto_polish_drawing
  - mcp__excalidash__save_drawing
  - mcp__excalidash__save_version
  - mcp__excalidash__get_drawing_url
  - mcp__excalidash__export_drawing
---

# Observability Flow

## Objective
Produce a left-to-right observability data-flow diagram for ONE system: instrumented
services emit telemetry to a **collector/agent**, which fans the signals into three
labeled **pipelines** — metrics, logs, traces — that land in their **storage backends**
and surface in **dashboards** with an **alerting** terminal. Telemetry edges are dashed
to read as out-of-band emission; the request/work path (if shown) stays solid. The
diagram separates the **happy path** (emit → collect → store → visualize) from the
**alert path** (rule fires → notifier → on-call), the **error/backpressure path**
(buffer full → drop/spool → dead-letter) and the **on-call escalation path** (primary →
secondary → incident). A legend keys the three signal types and the path styles. The
result must score >= 95 with zero hard blockers.

## When to use / When NOT to use
**Use when**: the request is "draw our observability pipeline / telemetry flow", "show
how logs, metrics and traces move from services to dashboards and alerts", "diagram the
OpenTelemetry collector fan-out", "where do alerts come from and who gets paged", or
"show backpressure / dropped-telemetry handling".

**Do NOT use when**:
- The request is the *application* request/response flow, retries and error handling of
  business logic (not telemetry) → use the general **flowchart / data-flow** skill.
- The request is CI/CD stages or cloud deployment topology (regions/VPCs/provider logos)
  → delegate to **excalidash-devops-cloud-deployment**.
- The request is a security trust-boundary / auth view (who can read telemetry, RBAC on
  dashboards) → delegate to the **security** sibling skill; keep this diagram defensive
  but signal-flow-focused.
- The request is the internal architecture/layers of one service → use a C4 skill.
- More than one independent pipeline is in scope and the canvas gets dense → draw one
  observability flow per pipeline rather than merging (see Validation & score).
See `../_shared/references/mcp-tool-cheatsheet.md` for the sibling map.

## Expected input
A short description of the telemetry pipeline, ideally naming:
- **Emitting services** — the instrumented apps/jobs (e.g. "Checkout API", "Worker",
  "Edge proxy") and what they emit (metrics / logs / traces).
- **Collector/agent** — the OpenTelemetry Collector, Fluent Bit/Vector agent, Prometheus
  scraper, or sidecar that receives/scrapes telemetry.
- **Per-signal pipelines** — metrics, logs, traces (some systems collapse two; say so).
- **Storage backends** — e.g. Prometheus/Mimir (metrics), Loki/Elasticsearch (logs),
  Tempo/Jaeger (traces).
- **Dashboards + alerting** — Grafana/Kibana dashboards; alert rules → notifier (PagerDuty/
  Slack/email) → on-call.
- **Error/backpressure handling** — buffer/queue, drop policy, spool-to-disk, dead-letter.
Redact any endpoint credential, ingest token, or webhook secret BEFORE it reaches a tool
argument. If pipelines or backends are unstated, infer the obvious OTel-style ones and
state the assumption.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load the technical-docs preset, `MCP_LIBRARY_MODE`,
   and the scoring rubric.
2. `mcp__excalidash__search_libraries` → `mcp__excalidash__inspect_library` →
   `mcp__excalidash__cache_library` — vet collector, pipeline, storage and signal icons
   from the curated packs (Cloud/DevOps, Flow Chart Symbols, Data Flow).
3. `mcp__excalidash__create_diagram_from_prompt` — the ONE create path: a `flowchart`
   structure with `direction: "LR"`, dashed telemetry edges and a signal legend.
4. `mcp__excalidash__add_library_items_normalized` — place collector/pipeline/storage
   icons in reserved `inside-card-left` slots and legend swatches; reject any icon that
   raises density or sits in an arrow lane.
5. `mcp__excalidash__lint_drawing` → `mcp__excalidash__score_drawing` →
   `mcp__excalidash__repair_drawing` (mandatory loop, with rollback).
6. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
7. `mcp__excalidash__save_drawing` → `mcp__excalidash__save_version` →
   `mcp__excalidash__get_drawing_url` → `mcp__excalidash__export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=flowchart DIR=LR PRESET=technical-docs LIBRARY=curated[Cloud/DevOps, Flow Chart Symbols, Data Flow]
   PATHS=happy|alert|error-backpressure|on-call VALIDATORS=lint,score,repair`.
   Enumerate the swimlanes/bands left→right: **Services → Collector/Agent →
   Metrics|Logs|Traces pipelines → Storage → Dashboards + Alerting**, plus the
   error/backpressure branch off the collector and the on-call branch off alerting.
   Mark which edges are telemetry (dashed) vs request/work (solid). Redact secrets now.
2. **Generate (one path only).** Call `create_diagram_from_prompt` with a `flowchart`
   `structure` (nodes + edges) and `direction: "LR"`. Encode the three signal pipelines
   as three parallel lanes out of the collector; style every telemetry edge dashed; keep
   the alert, error-backpressure and on-call paths as visibly distinct labeled branches.
   Add a legend node keying metrics / logs / traces and the path styles. Capture the
   returned drawing id.
3. **Place icons.** `add_library_items_normalized` — collector/agent glyph, a Data Flow
   "process"/"data store" symbol per pipeline, a store/cylinder per backend, a dashboard
   glyph, a bell/alert glyph for the notifier, in `inside-card-left` slots (32x32); keyed
   swatches in the `legend`. Normalize stroke/fill to the technical-docs preset.
4. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty.
5. **Score.** `score_drawing`; record the number and every penalty.
6. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint
   and re-score. Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a
   repair pass lowers the score, restore the last `save_version` checkpoint and apply a
   smaller, targeted fix (e.g. widen one pipeline lane rather than reflow all three).
7. **Polish.** Only after blockers clear, run `auto_polish_drawing`; re-score to confirm
   no regression (rollback to the checkpoint if it drops).
8. **Validate.** Self-check the flow semantics: every service reaches the collector;
   each signal lands in its own storage; the alert path originates from a rule on stored
   data (not directly from a service); the error/backpressure branch terminates in a
   drop/dead-letter sink; the on-call path escalates primary → secondary → incident.
9. **Save.** `save_drawing` with a clear title (`"<System> — Observability Flow"`), then
   `save_version` to checkpoint the accepted state.
10. **Export.** `get_drawing_url` for a link, then `export_drawing` (svg/png/excalidraw);
    re-scan the export for secrets (ingest tokens and webhook URLs leak here most).

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only: draw the collector, pipeline lanes, cylinder storage, the
  dashboard panel and the bell/alert shape by hand; no icon calls.
- **curated** (default) — pull only from **Cloud/DevOps** (collector, agent, k8s sidecar,
  queue), **Flow Chart Symbols** (process, decision, terminator for the drop/dead-letter
  sink), and **Data Flow** (external entity, process, data store, flow). Branded backends
  (Prometheus, Loki, Grafana, Tempo) may use logos only from a curated logo pack.
- **required** — every storage backend MUST use a data-store/cylinder symbol, the
  collector MUST use a collector/agent icon, and the decision point on the
  error/backpressure branch MUST use the Flow Chart decision glyph; a primitive where a
  curated icon exists is a violation.

Workflow: `search_libraries({ q, mode, category, limit })` → `inspect_library({ libraryId,
autoCache })` → `cache_library` → `add_library_items_normalized`. Icon slots:
`inside-card-left` for node glyphs (32x32), `database-symbol` for storage backends,
`legend` for the keyed signal swatches (metrics / logs / traces) and the dashed/solid
path key. Normalize scale, preserve aspect, match the technical-docs preset's stroke and
fill. **Reject any icon that introduces HIGH_DENSITY or collides with an arrow lane** —
drop it and use a primitive. Record used and rejected items.

## Validation & score
- `hardBlockers` must be empty: no `ARROW_TEXT_INTERSECTION` (a dashed telemetry edge or
  its protocol label must never sit under a routed line — keep parallel pipeline lanes
  >= 32px apart), no `FRAME_TITLE_OVERLAP` (band/legend titles stay title-only), no
  `ITEM_OUTSIDE_FRAME` (every pipeline node fully inside its lane/band).
- Penalties driven to zero: no `SMALL_FONT` (edge labels and the legend key >= 16px), no
  `HIGH_DENSITY` (three pipeline lanes need room — split into a second view rather than
  cramming), no `TEXT_NEAR_EDGE` (content >= 40px from canvas/export bounds).
- Flow semantics: happy, alert, error-backpressure and on-call paths are each
  individually traceable; telemetry edges are dashed and the request/work edges solid;
  the three signals are distinguishable in the legend.
- **Minimum score 95** with empty `hardBlockers` before saving as final. Repair is
  mandatory below 95 or with any blocker; rollback any pass that lowers the score.
See `../_shared/references/geometry-rules.md`.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. Observability pipelines are
secret-prone: collector configs carry **ingest tokens**, alert notifiers carry **webhook
secrets**, and remote-write targets carry **database URLs**. Redact BEFORE any tool call
and re-scan the export. Concrete examples — show the *concept*, never the value:
- OTLP ingest header `Authorization: Bearer <ingest-token>` → `Authorization: Bearer [REDACTED_BEARER]`.
- Grafana Cloud remote-write `https://user:<glsa-key>@prom/api/push` →
  `https://user:[REDACTED_API_KEY]@prom/api/push`.
- PagerDuty/Slack notifier URL `https://hooks.slack.com/services/<workspace>/<channel>/<token>` →
  `https://hooks.slack.com/services/[REDACTED_WEBHOOK_SECRET]`.
- Loki/Tempo basic-auth `loki://app:<password>@store` → `loki://app:[REDACTED_DATABASE_URL]@store`.
Use typed placeholders (`[REDACTED_BEARER]`, `[REDACTED_API_KEY]`, `[REDACTED_WEBHOOK_SECRET]`,
`[REDACTED_DATABASE_URL]`). Never echo a detected secret back to the user; the MCP also
redacts on output, but redact at the source first.

## Internal prompts
- **Pipeline structure prompt**: `"Observability flowchart (LR) for <SYSTEM>. Lanes:
  Services [<svc1>, <svc2>] → Collector (OTel Collector) → three signal pipelines
  {Metrics, Logs, Traces} → Storage {Prometheus, Loki, Tempo} → Dashboards (Grafana) +
  Alerting. Telemetry edges DASHED. Alert path: alert rule → Notifier → On-call.
  Error/backpressure: collector buffer full → decision → drop/spool → Dead-letter.
  On-call escalation: Primary → Secondary → Incident. Legend: metrics/logs/traces +
  dashed=telemetry, solid=request. No request internals."`
- **Repair nudge (telemetry lane)**: `"ARROW_TEXT_INTERSECTION on the 'traces' dashed
  edge → route the traces pipeline through its own lane 32px below the logs lane and move
  the label into the side gutter; keep the Tempo store fixed."`
- **Backpressure check**: `"Confirm the error/backpressure branch leaves the collector at
  a decision node and terminates in a drop or dead-letter sink, not back into a service."`
- **Redaction sweep**: `"Scan every node/edge label and the export for ingest tokens,
  remote-write creds and notifier webhook URLs; replace with typed [REDACTED_*] placeholders."`

## Example prompts for Claude Code
- "Diagram our OpenTelemetry pipeline: services emit to the collector, which fans out
  metrics to Prometheus, logs to Loki, traces to Tempo, all shown in Grafana with
  alerting."
- "Draw the observability flow including what happens when the collector's buffer fills
  up and telemetry gets dropped."
- "Show how an alert fires from our metrics and escalates through on-call — primary,
  secondary, then incident."
- "Make a telemetry data-flow with dashed signal edges and a legend for logs/metrics/traces."
- "Visualize backpressure and the dead-letter path in our logging pipeline."

## Acceptance criteria
- [ ] Left-to-right bands: Services → Collector/Agent → Metrics|Logs|Traces → Storage →
      Dashboards + Alerting.
- [ ] Telemetry edges are **dashed**; request/work edges (if any) are solid.
- [ ] Three signal pipelines are individually traceable and land in distinct storage.
- [ ] The alert path, error/backpressure path, and on-call escalation path are each
      separate, labeled branches (not merged into the happy path).
- [ ] A legend keys metrics / logs / traces and the dashed=telemetry / solid=request style.
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`); parallel pipeline
      lanes >= 32px apart.
- [ ] Band/legend titles do not overlap a node (`FRAME_TITLE_OVERLAP` absent); every
      pipeline node inside its band (`ITEM_OUTSIDE_FRAME` absent).
- [ ] Libraries used per policy when relevant (collector glyph, data-store symbols,
      decision glyph; normalized).
- [ ] No secrets leaked in drawing, response, or export (ingest tokens / remote-write
      creds / webhook URLs redacted).

## Examples
See `./references/examples.md` for full request → plan → ordered tool calls with realistic
arguments, plus `./references/checklist.md` and `./references/anti-patterns.md`. Shared
rules live in `../_shared/references/library-policy.md`,
`../_shared/references/security-redaction.md`, `../_shared/references/geometry-rules.md`,
and `../_shared/references/visual-system.md`.
