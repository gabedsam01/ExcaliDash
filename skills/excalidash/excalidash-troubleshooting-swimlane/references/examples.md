# Troubleshooting Swimlane — Worked Examples

Each example shows: the request -> the one-line plan -> the ordered MCP tool calls with realistic
arguments (using the real tool schemas) -> the quality loop -> save/export. Secrets are redacted
BEFORE any call.

---

## Example A — Checkout 5xx incident (build from prompt)

**Request**: "Draw a troubleshooting swimlane for our checkout 5xx incident. User reports the
error; Support L1 triages; if reproducible the On-call Engineer investigates; if it's transient
the Retry Worker retries with backoff and either recovers or dead-letters; if it's a bug and we're
within SLA we fix & deploy, otherwise we page L2."

**Plan line**
```
TYPE=swimlane DIRECTION=LR PRESET=technical-docs
LIBRARY=curated[Flow Chart Symbols, Data Flow, Stick Figures]
LANES=User, Support L1, On-call Engineer, Retry Worker, Escalation
DECISIONS=Reproducible?, Transient?, Retries exhausted?, Within SLA?
PATHS=happy,retry,error,dead-letter,fallback,escalation,resolution
VALIDATORS=lint,score,repair,validate_architecture
```

**Ordered calls**

1. `read_mcp_guide()` -> note `MCP_LIBRARY_MODE = curated`, `technical-docs` preset, rubric.
2. `list_templates()` -> scan for a swimlane/flow template (none reusable -> build from prompt).
3. Library vetting:
   - `search_libraries({ q: "decision diamond", mode: "curated", category: "Flow Chart Symbols" })`
   - `search_libraries({ q: "terminator start end", mode: "curated", category: "Flow Chart Symbols" })`
   - `search_libraries({ q: "person actor", mode: "curated", category: "Stick Figures" })`
   - `inspect_library({ libraryId: "flow-decision", autoCache: true })`
   - `cache_library({ libraryId: "flow-chart-symbols" })`
4. Generate (ONE path):
   ```json
   create_diagram_from_prompt({
     "diagramType": "swimlane",
     "direction": "LR",
     "preset": "technical-docs",
     "title": "Checkout 5xx — Troubleshooting Swimlane",
     "structure": {
       "nodes": [
         { "id": "trigger", "lane": "User",            "label": "Report 5xx",          "shape": "start" },
         { "id": "triage",  "lane": "Support L1",      "label": "Triage report",       "shape": "process" },
         { "id": "repro",   "lane": "Support L1",      "label": "Reproducible?",       "shape": "decision" },
         { "id": "resolve", "lane": "Support L1",      "label": "Resolve & close",     "shape": "end" },
         { "id": "invest",  "lane": "On-call Engineer","label": "Investigate logs",    "shape": "process" },
         { "id": "trans",   "lane": "On-call Engineer","label": "Transient?",          "shape": "decision" },
         { "id": "retry",   "lane": "Retry Worker",    "label": "Retry with backoff",  "shape": "process" },
         { "id": "exhaust", "lane": "Retry Worker",    "label": "Retries exhausted?",  "shape": "decision" },
         { "id": "recov",   "lane": "Retry Worker",    "label": "Recovered",           "shape": "end" },
         { "id": "dlq",     "lane": "Retry Worker",    "label": "Dead-letter",         "shape": "end" },
         { "id": "sla",     "lane": "On-call Engineer","label": "Within SLA?",         "shape": "decision" },
         { "id": "deploy",  "lane": "On-call Engineer","label": "Fix & deploy",        "shape": "end" },
         { "id": "page",    "lane": "Escalation",      "label": "Page L2",             "shape": "end" }
       ],
       "edges": [
         { "from": "trigger", "to": "triage" },
         { "from": "triage",  "to": "repro" },
         { "from": "repro",   "to": "resolve", "label": "no" },
         { "from": "repro",   "to": "invest",  "label": "yes" },
         { "from": "invest",  "to": "trans" },
         { "from": "trans",   "to": "retry",   "label": "transient" },
         { "from": "trans",   "to": "sla",     "label": "bug" },
         { "from": "retry",   "to": "exhaust" },
         { "from": "exhaust", "to": "recov",   "label": "no" },
         { "from": "exhaust", "to": "dlq",     "label": "yes" },
         { "from": "sla",     "to": "deploy",  "label": "yes" },
         { "from": "sla",     "to": "page",    "label": "no" }
       ]
     }
   })
   ```
   -> returns `{ id: "draw_checkout_swimlane" }`.
5. Place icons:
   ```json
   add_library_items_normalized({
     "libraryId": "flow-chart-symbols",
     "itemNames": ["start", "decision", "terminator"],
     "placement": "by-slot",
     "position": { "x": 80, "y": 80 },
     "slotSize": 32,
     "save": false
   })
   ```
   plus an `actor` figure per human lane header (User, Support L1, On-call Engineer) from
   `Stick Figures`. Normalize to the `technical-docs` stroke/fill.
6. Quality loop:
   - `lint_drawing({ id: "draw_checkout_swimlane" })` -> `hardBlockers: ["ARROW_TEXT_INTERSECTION"]`
     (the retry loop-back crosses the "Retry with backoff" label).
   - `score_drawing({ minimumScore: 95 })` -> `83` (penalties: ARROW_TEXT_INTERSECTION, HIGH_DENSITY).
   - `save_version({ id: "draw_checkout_swimlane" })` (rollback target).
   - `repair_drawing({ save: false, createVersion: true, name: "route retry loop-back through gutter" })`
     -> moves the loop-back into the reserved retry gutter, label to the side lane with 32px clearance.
   - `repair_drawing({ save: false })` -> widens the On-call Engineer lane so the "Within SLA?"
     branch has its own gutter (clears HIGH_DENSITY).
   - re-`lint_drawing` -> `hardBlockers: []`; re-`score_drawing({ minimumScore: 95 })` -> `96`.
7. `auto_polish_drawing({ minimumScore: 95, maxAttempts: 2, save: false })` -> re-`score_drawing`
   -> `97` (no regression; keep).
8. `validate_architecture({})` -> `{ ok: true, lanes: 5, stepsInOneLane: 13, decisionsLabelled: 4,
   terminalsReached: ["Resolve & close","Recovered","Dead-letter","Fix & deploy","Page L2"],
   danglingSteps: [] }`.
9. `save_drawing({ id: "draw_checkout_swimlane", name: "Checkout 5xx — Troubleshooting Swimlane" })`.
10. `save_version({ id: "draw_checkout_swimlane" })`.
11. `get_drawing_url({ id: "draw_checkout_swimlane" })` -> share link;
    `export_drawing({ id: "draw_checkout_swimlane", format: "svg" })` -> re-scan the export for
    secrets (none; verbs and labels only). Done.

---

## Example B — Re-lane an existing incident flowchart (convert path)

**Request**: "We already have a flowchart of the payments-queue backup. Turn it into a swimlane so
each step shows who owns it, and add a dead-letter path when retries are exhausted."

**Plan line**
```
TYPE=swimlane DIRECTION=LR PRESET=technical-docs LIBRARY=curated[Flow Chart Symbols, Data Flow, Stick Figures]
SOURCE=draw_pmtq_flow STRATEGY=convert
LANES=Monitoring, On-call Engineer, Queue/Worker, Datastore
```

**Ordered calls**
1. `read_mcp_guide()`.
2. Generate (ONE path — convert, preferred when a flow already exists):
   ```json
   convert_diagram_type({
     "targetType": "swimlane",
     "direction": "LR",
     "preset": "technical-docs",
     "name": "Payments Queue Backup — Troubleshooting Swimlane",
     "save": false
   })
   ```
   -> re-lays the existing steps into ownership lanes and generates the lane bands. Returns a new
   drawing id; capture it.
3. Add the missing dead-letter path: a "Retries exhausted?" decision after the retry step, with the
   `yes` exit to a `Dead-letter` terminal in the Queue/Worker lane (via a follow-up
   `create_diagram_from_prompt` structure merge or a manual `save_drawing` with the added nodes/edges).
4. Library vetting + `add_library_items_normalized` (decision diamonds on branch nodes, terminator
   on Dead-letter, `actor` on the On-call Engineer lane) as in Example A.
5. Quality loop: `lint_drawing` -> `score_drawing` (e.g. `88`) -> `repair_drawing` for any
   `ITEM_OUTSIDE_FRAME` (a converted step clipping a lane divider) and `ARROW_TEXT_INTERSECTION`
   on the new dead-letter branch -> re-lint/re-score until `>= 95` and `hardBlockers == []`. Roll
   back any pass that lowers the score.
6. `auto_polish_drawing` -> `validate_architecture` (every step in one lane; dead-letter path
   reaches a terminal) -> `save_drawing` -> `save_version` -> `get_drawing_url` ->
   `export_drawing`.

---

## Example C — Login outage with secret redaction

**Request**: "Build a troubleshooting swimlane for login outages. Lanes: User, Support L1, Auth
Service, Identity Provider, Escalation. The On-call runbook step is
`curl -H 'Authorization: Bearer <JWT>' https://auth/health`
and on failure we page on-call via `https://hooks.pager/incident?token=<webhook secret>`. End states are
Resolved or Escalated to L2."

**Redaction first** (BEFORE any tool call):
- the bearer JWT in the curl step -> `curl -H 'Authorization: Bearer [REDACTED_BEARER]' https://auth/health`.
- the pager webhook token -> `https://hooks.pager/incident?token=[REDACTED_WEBHOOK_SECRET]`.

**Plan line**
```
TYPE=swimlane DIRECTION=LR PRESET=technical-docs
LIBRARY=required[Flow Chart Symbols, Data Flow, Stick Figures]
LANES=User, Support L1, Auth Service, Identity Provider, Escalation
DECISIONS=Health OK?, IdP reachable?, Within SLA?
PATHS=happy,error,fallback,escalation,resolution
VALIDATORS=lint,score,repair,validate_architecture
```

**Ordered calls**
1. `read_mcp_guide()` -> `MCP_LIBRARY_MODE = required` (decisions MUST be diamonds, terminals MUST
   use terminator glyphs, human lanes MUST carry actor figures).
2. `search_libraries` / `inspect_library` / `cache_library` for decision, terminator, process and
   actor glyphs from Flow Chart Symbols and Stick Figures; Data Flow data-store glyph for the
   Identity Provider node.
3. Generate (ONE path):
   ```json
   create_diagram_from_prompt({
     "diagramType": "swimlane",
     "direction": "LR",
     "preset": "technical-docs",
     "title": "Login Outage — Troubleshooting Swimlane",
     "structure": {
       "nodes": [
         { "id": "report",  "lane": "User",             "label": "Report login fails",  "shape": "start" },
         { "id": "triage",  "lane": "Support L1",       "label": "Triage & gather info", "shape": "process" },
         { "id": "probe",   "lane": "Auth Service",     "label": "curl -H 'Authorization: Bearer [REDACTED_BEARER]' https://auth/health", "shape": "process" },
         { "id": "ok",      "lane": "Auth Service",     "label": "Health OK?",          "shape": "decision" },
         { "id": "idp",     "lane": "Identity Provider","label": "IdP reachable?",      "shape": "decision" },
         { "id": "fallbk",  "lane": "Auth Service",     "label": "Serve cached session",  "shape": "process" },
         { "id": "resolved","lane": "Support L1",       "label": "Resolved",            "shape": "end" },
         { "id": "sla",     "lane": "Escalation",       "label": "Within SLA?",         "shape": "decision" },
         { "id": "page",    "lane": "Escalation",       "label": "Page L2 via https://hooks.pager/incident?token=[REDACTED_WEBHOOK_SECRET]", "shape": "end" }
       ],
       "edges": [
         { "from": "report", "to": "triage" },
         { "from": "triage", "to": "probe" },
         { "from": "probe",  "to": "ok" },
         { "from": "ok",     "to": "resolved", "label": "yes" },
         { "from": "ok",     "to": "idp",      "label": "no" },
         { "from": "idp",    "to": "fallbk",   "label": "no" },
         { "from": "idp",    "to": "sla",      "label": "yes" },
         { "from": "fallbk", "to": "resolved" },
         { "from": "sla",    "to": "page",     "label": "no" },
         { "from": "sla",    "to": "resolved", "label": "yes" }
       ]
     },
     "autoPolish": false,
     "save": false
   })
   ```
   -> `{ id: "draw_login_swimlane" }`.
4. `add_library_items_normalized` — required-mode placements: decision diamonds on `ok`/`idp`/`sla`,
   terminator glyphs on `resolved`/`page`, `actor` figures on User/Support L1/Escalation headers,
   a Data Flow store glyph on the Identity Provider lane.
5. Quality loop: `lint_drawing` (expect `ARROW_TEXT_INTERSECTION` where the fallback line crosses
   the "Health OK?" label) -> `score_drawing` -> `save_version` -> `repair_drawing` (route fallback
   through the Auth Service gutter) -> re-lint/re-score to `>= 95`, `hardBlockers == []`. Roll back
   on any drop.
6. `auto_polish_drawing` -> `validate_architecture` (every step in one lane; Resolved/Escalated both
   reachable).
7. `save_drawing({ id: "draw_login_swimlane", name: "Login Outage — Troubleshooting Swimlane" })`
   -> `save_version` -> `get_drawing_url`.
8. `export_drawing({ id: "draw_login_swimlane", format: "png" })` -> **re-scan export**: confirm the
   probe step shows `Bearer [REDACTED_BEARER]` and the page step shows
   `token=[REDACTED_WEBHOOK_SECRET]`, not the real values. Done.

---

## Reusable argument fragments
- **Swimlane create**: `create_diagram_from_prompt({ diagramType: "swimlane", direction: "LR", structure: { nodes, edges } })`.
- **Re-lane an existing flow**: `convert_diagram_type({ targetType: "swimlane", direction: "LR" })`.
- **Decision node**: `{ "id": "<q>", "lane": "<owner>", "label": "<Question?>", "shape": "decision" }` with >= 2 labelled exit edges.
- **Terminal node**: `{ "id": "<end>", "lane": "<owner>", "label": "Resolved|Escalated|Dead-letter|Rolled back", "shape": "end" }`.
- **Validate**: `validate_architecture({})` must return every step in one lane, every decision
  labelled, every path reaching a terminal, and `danglingSteps == []`.

See `./checklist.md`, `./anti-patterns.md`, and the shared references under `../../_shared/references/`.
