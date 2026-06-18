# n8n Workflow Diagrammer — Worked Examples

Each example shows: the request -> one plan line -> the ordered MCP tool calls with realistic arguments
-> the quality loop -> save/export. The MCP prompt this skill maps to is
`/mcp__excalidash__excalidash_n8n_workflow_diagrammer`. Exactly ONE create path runs per drawing. Secrets
are redacted BEFORE any call. Arguments use only the real tool schemas
(`create_diagram_from_prompt({ prompt, diagramType, structure, direction, title, save, name })`,
`convert_diagram_type({ structure, targetType, save, name })`,
`add_library_items_normalized({ libraryId, itemNames, position, slotSize, targetCardId, placement, save })`).

---

## Example 1 — Lead-routing webhook with happy / error / dead-letter paths (create_diagram_from_prompt)

**Request**: "Diagram our n8n lead-routing workflow. A webhook receives a lead, we enrich it via HTTP
(retry 3x), normalize fields, then IF the score >= 80 we Slack #sales-hot, otherwise we send a Gmail
nurture email. If enrichment keeps failing, alert #alerts and dead-letter it. Left-to-right."

**Plan line**:
`TYPE=flowchart DIRECTION=LR PRESET=flow LIBRARY=curated[Flow Chart Symbols, Technology Logos, Data Flow]
PATHS=happy,retry,error,dead-letter,observability VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`

**Ordered calls**:
1. `read_mcp_guide()` — load presets, `MCP_LIBRARY_MODE = curated`, rubric.
2. `list_templates()` — scan for an `n8n` / `automation` template (none reusable -> build from prompt).
3. Library vetting:
   - `search_libraries({ q: "decision diamond terminator process box", mode: "curated", category: "Flow Chart Symbols" })`
   - `search_libraries({ q: "http slack gmail webhook", mode: "curated", category: "Technology Logos" })`
   - `search_libraries({ q: "data store sink", mode: "curated", category: "Data Flow" })`
   - `inspect_library({ libraryId: "flow-chart-symbols", autoCache: true })`
   - `cache_library({ libraryId: "technology-logos" })`
4. **Create (ONE path)**:
   ```json
   create_diagram_from_prompt({
     "diagramType": "flowchart",
     "direction": "LR",
     "title": "Lead Routing — n8n Automation Flow",
     "prompt": "n8n workflow, left-to-right. Trigger (LEFT): 'Webhook (POST /lead)'. Then -> 'HTTP Request: enrich (GET api.clearbit) [retry 3x, backoff]' -> 'Set: normalize fields'. Branch (diamond) 'IF: leadScore >= 80?' with two outputs: 'true' -> 'Slack: #sales-hot' (terminal); 'false' -> 'Gmail: nurture email' -> 'NoOp' (terminal). Error lane (lower): HTTP enrich failure -> 'Slack: #alerts' (observability) -> 'Dead Letter' store (terminal). Keep the happy path straight across the center; drop the false and error paths to their own lower lanes. One trigger, connected graph, every diamond output labeled, flow reads left-to-right.",
     "save": false
   })
   ```
   -> returns `{ id: "draw_lead_routing" }`. The IF renders as a diamond; the two output edges are labeled
   `true` / `false`; the error lane drops below the happy path.
5. Place icons:
   ```json
   add_library_items_normalized({
     "libraryId": "technology-logos",
     "itemNames": ["webhook", "http", "slack", "gmail"],
     "placement": "inside-card-left",
     "slotSize": { "w": 32, "h": 32 },
     "save": false
   })
   ```
   (Webhook glyph as a `badge` on the trigger; HTTP/Slack/Gmail logos in each integration card's
   `inside-card-left`; the Dead Letter store gets a Data Flow data-store glyph in `database-symbol`.)
6. Quality loop:
   - `lint_drawing({ id: "draw_lead_routing" })` -> `hardBlockers: ["ARROW_TEXT_INTERSECTION"]` (the
     `false` label crosses the 'Slack: #sales-hot' title).
   - `score_drawing({ minimumScore: 95 })` -> `83` (penalties: ARROW_TEXT_INTERSECTION, HIGH_DENSITY).
   - `save_version({ id: "draw_lead_routing" })` (rollback target).
   - `repair_drawing({ save: true, createVersion: true, name: "route-false-and-error-lanes" })` -> drops
     the `false` edge and the error lane into separate lower channels, moves the labels into side gutters.
   - re-`lint_drawing` -> `hardBlockers: []`; re-`score_drawing({ minimumScore: 95 })` -> `96`.
7. `auto_polish_drawing({ minimumScore: 95, maxAttempts: 2, save: true })` -> re-`score_drawing` -> `97`
   (no regression; diamond + true/false labels intact).
8. `validate_architecture()` -> clean: one Webhook trigger, connected graph, IF outputs both labeled and
   each reaching a terminal, the dead-letter sink reachable from the error path.
9. `suggest_architecture_improvements()` -> "Gmail nurture node has no failure handling." Accept ->
   add a labeled `error` edge from 'Gmail: nurture email' into the existing '#alerts' tap -> re-lint ->
   re-`score_drawing` -> `96`.
10. `save_drawing({ id: "draw_lead_routing", name: "Lead Routing — n8n Automation Flow" })` ->
    `save_version({ id: "draw_lead_routing" })` -> `get_drawing_url({ id: "draw_lead_routing" })` ->
    `export_drawing({ id: "draw_lead_routing", format: "svg" })` -> re-scan export (no secrets; labels only).

**Result**: score 97, hardBlockers []; one Webhook trigger LEFT, LR flow, IF diamond with labeled
true/false outputs, separated error + dead-letter lanes, integration logos in node slots.

---

## Example 2 — Import an n8n JSON export and reshape (convert_diagram_type)

**Request**: "We have an n8n workflow JSON export with a Cron trigger, a Switch on plan tier
(premium / free / default), and three Postgres writes. Turn it into a clean left-to-right diagram."

**Plan line**:
`TYPE=flowchart DIRECTION=LR PRESET=flow LIBRARY=curated[Flow Chart Symbols, Technology Logos, Data Flow]
PATHS=happy,fallback VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`

**Ordered calls**:
1. `read_mcp_guide()`.
2. **Create (ONE path)** — reshape the parsed n8n nodes/edges into an LR flowchart. Map
   `nodes[].type` to shapes and `connections{}` output indexes to labeled edges, then pass the normalized
   structure:
   ```json
   convert_diagram_type({
     "targetType": "flowchart",
     "structure": {
       "nodes": [
         { "id": "cron",     "label": "Cron (hourly)",            "shape": "terminator" },
         { "id": "switch",   "label": "Switch: plan tier",        "shape": "diamond" },
         { "id": "pg_prem",  "label": "Postgres: write premium",  "shape": "process" },
         { "id": "pg_free",  "label": "Postgres: write free",     "shape": "process" },
         { "id": "pg_def",   "label": "Postgres: write default",  "shape": "process" },
         { "id": "done",     "label": "NoOp",                     "shape": "terminator" }
       ],
       "edges": [
         { "from": "cron",   "to": "switch" },
         { "from": "switch", "to": "pg_prem", "label": "premium" },
         { "from": "switch", "to": "pg_free", "label": "free" },
         { "from": "switch", "to": "pg_def",  "label": "default" },
         { "from": "pg_prem","to": "done" },
         { "from": "pg_free","to": "done" },
         { "from": "pg_def", "to": "done" }
       ]
     },
     "name": "Plan Sync — n8n Automation Flow",
     "save": false
   })
   ```
   -> returns `{ id: "draw_plan_sync" }`. The Cron node becomes the LEFT trigger; the Switch becomes a
   diamond whose three outputs are labeled `premium` / `free` / `default`; each routes to its Postgres write.
3. Place icons:
   ```json
   add_library_items_normalized({
     "libraryId": "technology-logos",
     "itemNames": ["cron", "postgres"],
     "placement": "inside-card-left",
     "slotSize": { "w": 32, "h": 32 },
     "save": false
   })
   ```
4. Quality loop: `lint_drawing({ id: "draw_plan_sync" })` (three Switch outputs fanning out is the usual
   `ARROW_TEXT_INTERSECTION` source — stagger the lanes) -> `score_drawing({ minimumScore: 95 })` ->
   `repair_drawing({ save: true, createVersion: true })` -> loop until `score >= 95` and `hardBlockers == []`.
   Rollback any pass that lowers the score.
5. `auto_polish_drawing({ minimumScore: 95, save: true })` -> `validate_architecture()` -> finds the
   Switch `default` output goes nowhere if `done` were missing. `suggest_architecture_improvements()` ->
   "every Switch case resolves; consider a fallback for an unmatched tier." Resolve, re-lint, re-score.
6. `save_drawing({ id: "draw_plan_sync", name: "Plan Sync — n8n Automation Flow" })` ->
   `save_version({ id: "draw_plan_sync" })` -> `get_drawing_url({ id: "draw_plan_sync" })` ->
   `export_drawing({ id: "draw_plan_sync", format: "png" })`.

---

## Example 3 — Scheduled alerting pipeline with retry, fallback, and redaction (create_diagram_from_prompt)

**Request**: "Diagram our scheduled alerting n8n flow. Cron triggers, an HTTP Request hits our metrics API
with a real `Authorization: Bearer <token>` header, a Filter drops healthy services, and OpenAI summarizes
the incident before posting to Slack. If OpenAI is down, fall back to a templated message. The Postgres log
node uses a real `postgres://bot:<password>@db:5432/alerts` connection string."

**Redaction first** (BEFORE any tool call):
the raw `Authorization: Bearer <token>` header -> `Authorization: Bearer [REDACTED_BEARER]` placeholder;
the raw `postgres://bot:<password>@db:5432/alerts` URL -> `postgres://bot:[REDACTED_DATABASE_URL]@db:5432/alerts`.

**Plan line**:
`TYPE=flowchart DIRECTION=LR PRESET=flow LIBRARY=curated[Flow Chart Symbols, Technology Logos, Data Flow]
PATHS=happy,retry,error,dead-letter,observability,fallback
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`

**Ordered calls**:
1. `read_mcp_guide()`.
2. **Create (ONE path)**:
   ```json
   create_diagram_from_prompt({
     "diagramType": "flowchart",
     "direction": "LR",
     "title": "Ops Alerting — n8n Automation Flow",
     "prompt": "n8n alerting workflow, left-to-right. Trigger (LEFT): 'Cron (every 5m)'. Then -> 'HTTP Request: GET metrics-api (auth: Bearer [REDACTED_BEARER] placeholder) [retry 3x, backoff]'. Branch (diamond) 'Filter: status != healthy?' with outputs: 'keep' -> 'OpenAI: summarize incident' -> 'Slack: #ops-alerts' (terminal); 'drop' -> 'NoOp' (terminal). Fallback lane: 'OpenAI down?' -> 'Set: templated message' -> 'Slack: #ops-alerts'. Error lane (lower): HTTP retry exhausted -> 'Slack: #ops-alerts' (observability) -> 'Dead Letter' store (terminal). Also a 'Postgres: log run' node off the HTTP step, connection 'postgres://bot:[REDACTED_DATABASE_URL]@db:5432/alerts'. Show auth/credential as a key icon label, not a value. One trigger, labeled diamond outputs, separated retry/error/fallback lanes, flow reads left-to-right.",
     "save": false
   })
   ```
   -> returns `{ id: "draw_ops_alerting" }`.
3. Place icons:
   ```json
   add_library_items_normalized({
     "libraryId": "technology-logos",
     "itemNames": ["cron", "http", "openai", "slack", "postgres"],
     "placement": "inside-card-left",
     "slotSize": { "w": 32, "h": 32 },
     "save": false
   })
   ```
   (Dead Letter store gets a Data Flow data-store glyph in `database-symbol`.)
4. Quality loop: `lint_drawing({ id: "draw_ops_alerting" })` (the retry self-loop and the error lane both
   want the same upper/lower gutter — expect `ARROW_TEXT_INTERSECTION`) ->
   `score_drawing({ minimumScore: 95 })` -> `repair_drawing({ save: true, createVersion: true })` to give
   the retry loop and the error lane separate channels -> loop until `score >= 95`, `hardBlockers == []`.
5. `auto_polish_drawing({ minimumScore: 95, save: true })` -> `validate_architecture()` -> confirm one
   Cron trigger, the Filter diamond's `keep`/`drop` outputs both labeled and reaching a terminal, no orphan
   node (the Postgres log node has its edge from HTTP, the dead-letter sink is reachable).
6. `suggest_architecture_improvements()` -> reviewed; apply accepted fixes, re-lint, re-score.
7. `save_drawing({ id: "draw_ops_alerting", name: "Ops Alerting — n8n Automation Flow" })` ->
   `save_version({ id: "draw_ops_alerting" })` -> `get_drawing_url({ id: "draw_ops_alerting" })`.
8. `export_drawing({ id: "draw_ops_alerting", format: "svg" })` -> **re-scan the export**: no raw bearer,
   no DB password — only `[REDACTED_BEARER]` and `[REDACTED_DATABASE_URL]` placeholders.

---

## Reusable argument fragments
- **Build LR**: `create_diagram_from_prompt({ diagramType: "flowchart", direction: "LR", prompt, save: false })`.
- **Reshape an import**: `convert_diagram_type({ targetType: "flowchart", structure: { nodes, edges } })`.
- **Integration logo**: `add_library_items_normalized({ libraryId: "technology-logos", itemNames: ["<vendor>"], placement: "inside-card-left", slotSize: { w: 32, h: 32 } })`.
- **Branch labels in the structure**: each diamond edge carries a `label` (`"true"` / `"false"` / a Switch
  case / `"keep"` / `"drop"`); never leave an output edge unlabeled.
- **Connected-graph check**: `validate_architecture()` must report one trigger, no orphan node, and every
  diamond output reaching a node or a labeled terminal.

## Notes shared across examples
- The three create paths are mutually exclusive — pick exactly one. Prefer
  `create_diagram_from_prompt({ diagramType: "flowchart", direction: "LR" })`; use `convert_diagram_type`
  to reshape an imported n8n JSON scene.
- The lint -> score -> repair loop is mandatory and repeats until `score >= 95` AND `hardBlockers == []`.
- Roll back any repair/polish pass that lowers the score (restore the last `save_version`).
- Every branch node is a DIAMOND and every branch output is LABELED — verify after polish (polish can
  round a diamond or drop a label).
- Keep happy / retry / error / dead-letter / observability / fallback in separate lanes; never let two
  share a gutter.
- Redact secrets before tool calls and re-scan the export. See `../../_shared/references/security-redaction.md`.

See `./checklist.md`, `./anti-patterns.md`, and the shared references under `../../_shared/references/`.
