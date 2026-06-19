# Observability Flow — Worked Examples

Each example shows: the request → one plan line → the ordered MCP tool calls with realistic
arguments → the quality loop → save/export. All calls use only the real ExcaliDash tools and
the real argument schemas. Secrets are redacted BEFORE any call.

---

## Example A — OpenTelemetry pipeline, three signals (build from prompt)

**Request**: "Diagram our OpenTelemetry pipeline: the Checkout API and a Worker emit to the
OTel Collector, which fans out metrics to Prometheus, logs to Loki and traces to Tempo, all
shown in Grafana with alerting."

**Plan line**
```
TYPE=flowchart DIR=LR PRESET=technical-docs
LIBRARY=curated[Cloud/DevOps, Flow Chart Symbols, Data Flow]
PATHS=happy|alert  SIGNALS=metrics,logs,traces  STORES=3
VALIDATORS=lint,score,repair
```

**Ordered calls**
1. `read_mcp_guide()` → note `MCP_LIBRARY_MODE = curated`, technical-docs preset, rubric.
2. Library vetting:
   - `search_libraries({ q: "collector agent", mode: "curated", category: "Cloud/DevOps", limit: 8 })`
   - `search_libraries({ q: "data store", mode: "curated", category: "Data Flow", limit: 8 })`
   - `inspect_library({ libraryId: "cloud-devops/otel-collector", autoCache: true })`
   - `inspect_library({ libraryId: "data-flow/data-store", autoCache: true })`
   - `cache_library({ libraryId: "data-flow/data-store" })`
3. Generate (ONE path):
   ```json
   create_diagram_from_prompt({
     "diagramType": "flowchart",
     "direction": "LR",
     "preset": "technical-docs",
     "title": "Checkout — Observability Flow",
     "structure": {
       "nodes": [
         { "id": "svc1",  "label": "Checkout API",  "band": "Services" },
         { "id": "svc2",  "label": "Worker",        "band": "Services" },
         { "id": "coll",  "label": "OTel Collector","band": "Collector" },
         { "id": "pmet",  "label": "Metrics pipeline","band": "Pipelines" },
         { "id": "plog",  "label": "Logs pipeline",  "band": "Pipelines" },
         { "id": "ptra",  "label": "Traces pipeline", "band": "Pipelines" },
         { "id": "prom",  "label": "Prometheus", "type": "store", "band": "Storage" },
         { "id": "loki",  "label": "Loki",       "type": "store", "band": "Storage" },
         { "id": "tempo", "label": "Tempo",      "type": "store", "band": "Storage" },
         { "id": "graf",  "label": "Grafana dashboards", "band": "Dashboards+Alerting" },
         { "id": "rule",  "label": "Alert rule",  "band": "Dashboards+Alerting" },
         { "id": "notify","label": "Notifier",    "band": "Dashboards+Alerting" },
         { "id": "legend","label": "Legend: metrics/logs/traces; dashed=telemetry solid=request", "type": "legend" }
       ],
       "edges": [
         { "from": "svc1", "to": "coll", "label": "OTLP/gRPC", "style": "dashed" },
         { "from": "svc2", "to": "coll", "label": "OTLP/gRPC", "style": "dashed" },
         { "from": "coll", "to": "pmet", "label": "metrics",   "style": "dashed" },
         { "from": "coll", "to": "plog", "label": "logs",      "style": "dashed" },
         { "from": "coll", "to": "ptra", "label": "traces",    "style": "dashed" },
         { "from": "pmet", "to": "prom", "label": "remote_write", "style": "dashed" },
         { "from": "plog", "to": "loki", "label": "Loki push",    "style": "dashed" },
         { "from": "ptra", "to": "tempo","label": "OTLP",         "style": "dashed" },
         { "from": "prom", "to": "graf", "label": "query",  "style": "solid" },
         { "from": "loki", "to": "graf", "label": "query",  "style": "solid" },
         { "from": "tempo","to": "graf", "label": "query",  "style": "solid" },
         { "from": "prom", "to": "rule", "label": "evaluate", "style": "solid" },
         { "from": "rule", "to": "notify","label": "fires",   "style": "solid" }
       ]
     },
     "save": false
   })
   ```
   → returns `{ id: "draw_checkout_obs" }`.
4. Place icons:
   ```json
   add_library_items_normalized({
     "id": "draw_checkout_obs",
     "libraryId": "data-flow/data-store",
     "itemNames": ["data-store"],
     "placement": "inside-card-left",
     "slotSize": 32,
     "save": false
   })
   ```
   plus a `cloud-devops/otel-collector` glyph on the collector card and `legend` swatches
   for metrics/logs/traces.
5. Quality loop:
   - `lint_drawing({ id: "draw_checkout_obs" })` → `hardBlockers: ["ARROW_TEXT_INTERSECTION"]`
     (the traces dashed edge crosses the logs label).
   - `score_drawing({ minimumScore: 95 })` → `84` (penalties: ARROW_TEXT_INTERSECTION, HIGH_DENSITY).
   - `save_version({ id: "draw_checkout_obs" })` (rollback target).
   - `repair_drawing({ save: true, createVersion: true, name: "route traces lane" })` — move
     the traces pipeline into its own lane 32px below logs; label into the side gutter.
   - re-`lint_drawing` → `hardBlockers: []`; re-`score_drawing({ minimumScore: 95 })` → `96`.
6. `auto_polish_drawing({ minimumScore: 95, maxAttempts: 2, save: true })` → re-score `97`
   (no regression; keep).
7. `save_drawing({ id: "draw_checkout_obs", name: "Checkout — Observability Flow" })`.
8. `save_version({ id: "draw_checkout_obs" })` (accepted checkpoint).
9. `get_drawing_url({ id: "draw_checkout_obs" })` → share link;
   `export_drawing({ id: "draw_checkout_obs", format: "svg" })` → re-scan (transports only; clean).

**Expected result**: an LR flow with dashed telemetry edges, three traceable signal pipelines
into Prometheus/Loki/Tempo, a Grafana dashboards + alert-rule terminal, a signal legend,
`score 97`, `hardBlockers == []`.

---

## Example B — Add the error/backpressure and on-call paths (build from prompt)

**Request**: "Extend the telemetry flow: show what happens when the collector's buffer fills
up and telemetry gets dropped, and how an alert escalates through on-call."

**Plan line**
```
TYPE=flowchart DIR=LR PRESET=technical-docs
LIBRARY=curated[Cloud/DevOps, Flow Chart Symbols, Data Flow]
PATHS=happy|alert|error-backpressure|on-call
VALIDATORS=lint,score,repair
```

**Ordered calls**
1. `read_mcp_guide()`.
2. `search_libraries({ q: "decision diamond terminator", mode: "curated", category: "Flow Chart Symbols", limit: 8 })`
   → `inspect_library({ libraryId: "flow-chart/decision", autoCache: true })`.
3. Generate (ONE path) — the happy + alert lanes from Example A, plus the two new branches:
   ```json
   create_diagram_from_prompt({
     "diagramType": "flowchart",
     "direction": "LR",
     "preset": "technical-docs",
     "title": "Checkout — Observability Flow (paths)",
     "structure": {
       "nodes": [
         { "id": "coll",  "label": "OTel Collector", "band": "Collector" },
         { "id": "full",  "label": "Buffer full?", "type": "decision", "band": "Backpressure" },
         { "id": "spool", "label": "Spool to disk", "band": "Backpressure" },
         { "id": "dlq",   "label": "Dead-letter sink", "type": "terminator", "band": "Backpressure" },
         { "id": "notify","label": "Notifier", "band": "Alerting" },
         { "id": "p1",    "label": "On-call primary", "band": "On-call" },
         { "id": "p2",    "label": "On-call secondary", "band": "On-call" },
         { "id": "inc",   "label": "Incident", "type": "terminator", "band": "On-call" }
       ],
       "edges": [
         { "from": "coll",  "to": "full",  "label": "intake",    "style": "dashed" },
         { "from": "full",  "to": "spool", "label": "yes",       "style": "solid" },
         { "from": "spool", "to": "dlq",   "label": "overflow",  "style": "solid" },
         { "from": "notify","to": "p1",    "label": "page",      "style": "solid" },
         { "from": "p1",    "to": "p2",    "label": "no ack 5m", "style": "solid" },
         { "from": "p2",    "to": "inc",   "label": "escalate",  "style": "solid" }
       ]
     },
     "save": false
   })
   ```
   → `{ id: "draw_checkout_paths" }`. The "Buffer full?" decision is a diamond; the
   dead-letter and incident nodes are terminators; the backpressure branch never loops back
   to a service.
4. `add_library_items_normalized` — Flow Chart decision glyph on "Buffer full?", terminator
   glyphs on "Dead-letter sink" and "Incident".
5. Quality loop: `lint_drawing` → `score_drawing({ minimumScore: 95 })` (expect possible
   `ARROW_TEXT_INTERSECTION` where the escalation lane crosses the alert lane) →
   `repair_drawing({ save: true, createVersion: true, name: "separate on-call lane" })` →
   re-lint/re-score to `>= 95`, `hardBlockers == []`. Rollback any pass that drops the score.
6. `auto_polish_drawing({ minimumScore: 95, save: true })`.
7. `save_drawing({ id: "draw_checkout_paths", name: "Checkout — Observability Flow (paths)" })`
   → `save_version` → `get_drawing_url` → `export_drawing({ format: "png" })`.

**Expected result**: four individually traceable paths (happy, alert, error/backpressure
ending in a dead-letter sink, on-call ending in an incident), `score >= 95`,
`hardBlockers == []`.

---

## Example C — Vector → Elasticsearch logging pipeline with redaction

**Request**: "Draw our logging pipeline: services ship logs through a Vector agent to
Elasticsearch and Kibana, with a Slack alert. Vector config:
`endpoint: https://ingest:<glsa-key>@es.internal/_bulk`, alert webhook
`https://hooks.slack.com/services/<workspace>/<channel>/<token>`."

**Redaction first** (BEFORE any tool call):
- `https://ingest:<glsa-key>@es.internal/_bulk` → `https://ingest:[REDACTED_API_KEY]@es.internal/_bulk`.
- `https://hooks.slack.com/services/<workspace>/<channel>/<token>` → `https://hooks.slack.com/services/[REDACTED_WEBHOOK_SECRET]`.

**Plan line**
```
TYPE=flowchart DIR=LR PRESET=technical-docs
LIBRARY=required[Cloud/DevOps, Flow Chart Symbols, Data Flow]
PATHS=happy|alert  SIGNAL=logs  STORES=1
VALIDATORS=lint,score,repair
```

**Ordered calls**
1. `read_mcp_guide()` → `MCP_LIBRARY_MODE = required` (the Elasticsearch store MUST use a
   data-store symbol; the Vector agent MUST use a collector/agent icon).
2. `search_libraries`/`inspect_library`/`cache_library` for: vector/agent (Cloud/DevOps),
   data-store (Data Flow), bell/alert glyph.
3. Generate (ONE path):
   ```json
   create_diagram_from_prompt({
     "diagramType": "flowchart",
     "direction": "LR",
     "preset": "technical-docs",
     "title": "Logging Pipeline — Observability Flow",
     "structure": {
       "nodes": [
         { "id": "svc",  "label": "App services", "band": "Services" },
         { "id": "vec",  "label": "Vector agent",  "band": "Collector" },
         { "id": "es",   "label": "Elasticsearch", "type": "store", "band": "Storage",
           "note": "https://ingest:[REDACTED_API_KEY]@es.internal/_bulk" },
         { "id": "kib",  "label": "Kibana",        "band": "Dashboards+Alerting" },
         { "id": "alert","label": "Slack alert",   "band": "Dashboards+Alerting",
           "note": "https://hooks.slack.com/services/[REDACTED_WEBHOOK_SECRET]" }
       ],
       "edges": [
         { "from": "svc",  "to": "vec",   "label": "ship logs", "style": "dashed" },
         { "from": "vec",  "to": "es",    "label": "_bulk",     "style": "dashed" },
         { "from": "es",   "to": "kib",   "label": "query",     "style": "solid" },
         { "from": "es",   "to": "alert", "label": "watcher",   "style": "solid" }
       ]
     },
     "save": false
   })
   ```
   → `{ id: "draw_log_pipeline" }`. Note both credential-bearing values entered the call
   already redacted.
4. `add_library_items_normalized` — required-mode placements: data-store symbol on
   "Elasticsearch", agent glyph on "Vector agent", bell glyph on "Slack alert".
5. Quality loop: `lint_drawing` → `score_drawing({ minimumScore: 95 })` →
   `repair_drawing({ save: true, createVersion: true })` until `>= 95`, `hardBlockers == []`.
6. `auto_polish_drawing({ minimumScore: 95, save: true })`.
7. `save_drawing({ id: "draw_log_pipeline", name: "Logging Pipeline — Observability Flow" })`
   → `save_version` → `get_drawing_url`.
8. `export_drawing({ id: "draw_log_pipeline", format: "png" })` → **re-scan export**: confirm
   the ingest endpoint shows `[REDACTED_API_KEY]` and the alert URL shows
   `[REDACTED_WEBHOOK_SECRET]`, not the live values. Done.

**Expected result**: a logs-only LR pipeline with a dashed ship/ingest path and a solid
query/alert path, the Elasticsearch store and Vector agent rendered as required icons, every
secret redacted in the drawing and the export, `score >= 95`, `hardBlockers == []`.

---

## Reusable argument fragments
- **LR flow with bands**: `create_diagram_from_prompt({ diagramType: "flowchart",
  direction: "LR", preset: "technical-docs", structure: { nodes, edges } })`.
- **Dashed telemetry edge**: `{ "from": "<svc>", "to": "<coll>", "label": "OTLP/gRPC", "style": "dashed" }`.
- **Storage slot**: `add_library_items_normalized({ libraryId: "data-flow/data-store",
  itemNames: ["data-store"], placement: "inside-card-left", slotSize: 32 })`.
- **Backpressure terminator**: a `terminator`-typed node "Dead-letter sink" with no edge
  back to any service.
- **Redacted credential note**: `"note": "https://ingest:[REDACTED_API_KEY]@es.internal/_bulk"`.

See `./checklist.md`, `./anti-patterns.md`, and the shared references under
`../../_shared/references/`.
