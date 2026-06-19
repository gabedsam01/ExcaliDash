---
name: excalidash-n8n-workflow-diagrammer
description: Use when you need to draw or review an n8n / automation / pipeline workflow as a readable left-to-right node graph — one trigger on the LEFT, processing/integration nodes flowing RIGHT, branch nodes as labeled diamonds (IF / Switch / Filter), and the operational paths (happy path, retry, error branch, dead-letter, observability/notify, fallback) made explicit with integration logos in the node slots.
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__create_diagram_from_prompt
  - mcp__excalidash__convert_diagram_type
  - mcp__excalidash__list_templates
  - mcp__excalidash__create_from_template
  - mcp__excalidash__search_libraries
  - mcp__excalidash__inspect_library
  - mcp__excalidash__cache_library
  - mcp__excalidash__add_library_items_normalized
  - mcp__excalidash__lint_drawing
  - mcp__excalidash__score_drawing
  - mcp__excalidash__repair_drawing
  - mcp__excalidash__auto_polish_drawing
  - mcp__excalidash__validate_architecture
  - mcp__excalidash__suggest_architecture_improvements
  - mcp__excalidash__save_drawing
  - mcp__excalidash__save_version
  - mcp__excalidash__get_drawing_url
  - mcp__excalidash__export_drawing
---

# n8n Workflow Diagrammer

## Objective
Produce or review an **n8n / automation / pipeline workflow** as a single readable **left-to-right (LR)
node graph**: exactly one **trigger node** on the LEFT (Webhook, Cron/Schedule, Manual, Email/IMAP,
Form), a chain of **processing & integration nodes** flowing RIGHT (HTTP Request, Set/Edit Fields,
Code/Function, Merge, Slack, Gmail, Postgres, OpenAI, Google Sheets), **branch nodes drawn as diamonds**
(IF, Switch, Filter) whose **outputs are labeled** (`true`/`false`, or named Switch cases), and terminal
**output nodes** on the RIGHT (Respond to Webhook, NoOp, a notification, a write). The defining demand of
this skill is that the **operational paths are separated and readable**: the **happy path** runs straight
LR through the center; a **retry** loop, an **error branch**, a **dead-letter** sink, an
**observability/notify** tap, and a **fallback** path each live in their own lane and never tangle with
the happy path. The hard invariant is **flow legibility**: one trigger entry on the left, every fork is a
diamond with each output edge labeled, no arrow crosses a node label, and the whole graph reads in one
direction. The result must score **>= 95 with zero hard blockers**, and `validate_architecture` must
confirm one trigger, a connected graph (no orphan node), and every diamond output reaching a downstream
node or a labeled terminal.

## When to use / When NOT to use
**Use when**: the request is "diagram our n8n workflow", "draw this automation / pipeline as a node
graph", "show the Zapier/Make/n8n flow from trigger to actions", "visualize the webhook -> enrich ->
branch -> notify pipeline", "map this Cron job's steps", "turn this n8n JSON export into a clean
diagram", "show where the IF node branches and what each path does", or "where does the workflow retry,
where does it dead-letter, and where do we alert".

**Use when**: an exported n8n workflow JSON (nodes + connections) or a prose description of an automation
needs to become a legible LR graph with branch logic and the retry / error / dead-letter / observability /
fallback paths made explicit. Reshape an existing drawing into this LR node graph with
`convert_diagram_type({ targetType: "flowchart" })`.

**Do NOT use when**:
- The request is the *deployed services / apps / datastores* of a system (not a step-by-step automation)
  -> use **C4 Container** or **Microservices Topology**.
- The request is a pub-sub / event-bus topology (producers, broker, consumers) -> use the
  **Event-Driven Diagrammer** (n8n shows one ordered automation flow, not a many-to-many event bus).
- The request is one scenario's time-ordered messages between actors with lifelines -> use a **sequence
  diagram** or the **Troubleshooting Swimlane** skill (n8n shows the static workflow graph, not one
  timed run).
- The request is a generic non-automation decision tree or business process -> use a plain **flowchart**
  (use this skill specifically when the subject is an n8n-style automation with trigger + integration nodes).

## Expected input
A description (or n8n JSON export) of the automation. Ideally naming, in flow order:
- **Trigger (LEFT)** — exactly one entry point: Webhook (path + method), Cron/Schedule (interval), Manual,
  Email Read (IMAP), Form Trigger, or an app trigger ("New row in Sheets"). Name the trigger type.
- **Processing nodes (MIDDLE)** — the transform/integration steps in order: HTTP Request (method + host),
  Set / Edit Fields, Code / Function, Merge, Item Lists, Wait, and integration nodes (Slack, Gmail,
  Postgres, OpenAI, Google Sheets, Airtable, Notion).
- **Branch nodes (diamonds)** — IF (true/false), Switch (named cases / rules), Filter (keep/drop). Name
  the condition and each output path.
- **Operational paths** — which step **retries** (and how many times / with what backoff), which failure
  routes to the **error branch**, where exhausted retries land in a **dead-letter** sink, which step taps
  an **observability/notify** channel (Slack alert, log), and which condition takes the **fallback** path.
- **Output / terminal nodes (RIGHT)** — Respond to Webhook, NoOp, a final notification or write, the
  dead-letter sink. Mark which path ends where.
- **Integrations to logo** — which nodes map to a recognizable vendor (Slack, Gmail, HTTP, Postgres,
  OpenAI, Sheets) so a Technology Logo can sit in the node slot.
If the trigger is missing, infer the obvious entry and state the assumption; if input is n8n JSON, derive
nodes from the `nodes[]` array and edges from `connections{}` (branch index 0 = true, 1 = false), and read
each node's `retryOnFail` / `continueOnFail` settings into retry and error-branch lanes.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, scoring rubric.
2. `mcp__excalidash__list_templates` — look for an `n8n` / `automation` / `pipeline` / `workflow` template (optional).
3. `mcp__excalidash__search_libraries` -> `mcp__excalidash__inspect_library` -> `mcp__excalidash__cache_library`
   — vet flow symbols (process box, decision diamond, terminator) from **Flow Chart Symbols**, integration
   logos (Slack, Gmail, HTTP, Postgres, OpenAI, Sheets) from **Technology Logos**, and data-store / queue
   glyphs (dead-letter sink, data store) from **Data Flow**.
4. ONE create path:
   - `mcp__excalidash__create_diagram_from_prompt` with `diagramType: "flowchart"` and `direction: "LR"`
     (preferred — trigger -> nodes -> branch diamonds with labeled outputs -> retry/error/dead-letter/
     observability/fallback lanes -> terminals), OR
   - `mcp__excalidash__convert_diagram_type` with `targetType: "flowchart"` to reshape an existing
     drawing or imported n8n export into the LR node graph, OR
   - `mcp__excalidash__create_from_template` with an `n8n` / `automation` template.
5. `mcp__excalidash__add_library_items_normalized` — place the integration logo in each integration node's
   icon slot and the decision-diamond / terminator symbols where they belong.
6. `mcp__excalidash__lint_drawing` -> `mcp__excalidash__score_drawing` -> `mcp__excalidash__repair_drawing` (loop).
7. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
8. `mcp__excalidash__validate_architecture` — confirm one trigger, a connected graph (no orphan node),
   every diamond output labeled and reaching a downstream node or a terminal.
9. `mcp__excalidash__suggest_architecture_improvements` — flag an unlabeled branch output, a dangling
   node, a missing error/dead-letter path, two triggers; apply accepted fixes then re-lint/re-score.
10. `mcp__excalidash__save_drawing` -> `mcp__excalidash__save_version` -> `mcp__excalidash__get_drawing_url`
    -> `mcp__excalidash__export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=flowchart DIRECTION=LR PRESET=flow LIBRARY=curated[Flow Chart Symbols, Technology Logos, Data Flow]
   PATHS=happy,retry,error,dead-letter,observability,fallback
   VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`.
   Confirm the single trigger, the ordered node chain, every branch (diamond) and its labeled outputs, the
   six operational paths, and the terminal nodes. Redact any secret in the input (webhook signing secret,
   HTTP `Authorization` bearer, API key on a Slack/OpenAI/HTTP node, Postgres connection URL, OAuth token)
   BEFORE it reaches a tool argument.
2. **Generate (one path only).**
   - Prefer `create_diagram_from_prompt({ diagramType: "flowchart", direction: "LR", ... })` so the trigger
     lands on the LEFT, processing/integration nodes flow RIGHT, branches render as diamonds with labeled
     outputs, and terminals sit on the RIGHT.
   - For an existing drawing or imported n8n export:
     `convert_diagram_type({ structure, targetType: "flowchart" })`, then LR is applied.
   - Template path: `create_from_template({ templateId: "n8n-workflow" })`. Capture the returned id.
   - Layout intent: **trigger node far LEFT** (terminator/rounded shape), arrows pointing **RIGHT** into
     the first processing node; **integration/processing nodes as rounded rectangles** in flow order;
     **branch nodes as diamonds** with one input on the left and **labeled output edges** leaving the
     right/top/bottom faces; **terminal nodes far RIGHT**. Reserve >= 32px arrow gutters between rows so a
     back-routed `false`/retry edge never crosses a node label.
3. **Operational paths (the defining step).** Keep the **happy path** straight across the center band. Send
   each secondary path to its own clearly separated lane: a **retry** loop arcs back into the failing node
   through an upper/lower gutter with a labeled `retry (3x, backoff)` edge; the **error branch** drops to a
   lower lane; exhausted retries flow to a **dead-letter** sink terminal; an **observability/notify** tap
   (Slack/log) branches off without interrupting the main line; the **fallback** path takes the alternate
   route when the primary integration fails. Never let two operational lanes share a gutter.
4. **Branch styling.** Every fork node (IF / Switch / Filter) is a **diamond**, not a rectangle. Each
   output edge MUST carry its **label**: IF -> `true` / `false`; Switch -> the named case (`"premium"`,
   `"free"`, `"default"`); Filter -> `keep` / `drop`. An unlabeled branch output, or a branch drawn as a
   plain box, is a content error, not a style nit.
5. **Place icons.** `add_library_items_normalized` — drop the **Technology Logo** into each integration
   node's `inside-card-left` slot (Slack, Gmail, HTTP, Postgres, OpenAI, Sheets); use **Flow Chart
   Symbols** for the decision diamond and the start/terminator shapes; use a **Data Flow** data-store glyph
   for the dead-letter sink. Trigger node gets a trigger-type glyph (clock for Cron, plug for Webhook) as
   `badge` or `inside-card-left`. One logo per node; keep the diamonds icon-light so the condition text
   stays readable.
6. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty. n8n graphs most often trip
   `ARROW_TEXT_INTERSECTION` (a `true`/`false` label, or a back-routed retry/`false` edge crossing a node
   title) — route through gutters and place edge labels beside, not under, the line.
7. **Score.** `score_drawing`; record the number and every penalty.
8. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint and re-score.
   Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a repair pass lowers the score,
   restore the last `save_version` checkpoint and apply a smaller fix.
9. **Polish.** Only after blockers clear, run `auto_polish_drawing`; re-score to confirm no regression
   (rollback if it drops below the checkpoint). Verify polish did NOT round a decision diamond into a
   rectangle or drop a branch-output / retry label.
10. **Validate.** `validate_architecture` — exactly one trigger entry on the left; a connected graph with
    no orphan/dangling node; every diamond output labeled and each output reaching a downstream node or a
    labeled terminal; LR direction consistent. A second trigger, an orphan node, or an unlabeled branch
    output is a hard failure, not a penalty.
11. **Review.** `suggest_architecture_improvements` — surface an IF with only a `true` path (missing
    `false`/error branch), an HTTP node with no retry or error handling, a failure path with no
    dead-letter sink, a Switch case that goes nowhere, a node with no outgoing edge that is not a terminal.
    Apply accepted fixes, then re-run lint -> score.
12. **Save.** `save_drawing` with a clear title (`"<Workflow> — n8n Automation Flow"`), then
    `save_version` to checkpoint the accepted state.
13. **Export.** `get_drawing_url` for a link, then `export_drawing` (svg/png/excalidraw); re-scan the
    export for secrets (webhook signing secret, HTTP bearer/API keys on integration nodes are the common leak).

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only: trigger as a rounded terminator, processing nodes as rounded rectangles,
  branches as diamonds, terminals as terminators; no icon calls.
- **curated** (default) — pull only from **Flow Chart Symbols** (start/terminator, process box, decision
  diamond, IO), **Technology Logos** (Slack, Gmail, HTTP, Postgres, OpenAI, Google Sheets, Airtable,
  Notion, Webhook/Cron glyphs), and **Data Flow** (data store / external entity for the dead-letter sink).
  Do not import arbitrary n8n node art from public libraries.
- **required** — every integration node that maps to a known vendor MUST carry its Technology Logo, every
  branch node MUST use the **decision diamond** from Flow Chart Symbols, and the dead-letter sink MUST use
  a Data Flow data-store glyph; a plain box where a curated diamond/logo/store exists is a violation.

Workflow: `search_libraries` -> `inspect_library` (aspect, stroke, fill, complexity) -> `cache_library`
-> `add_library_items_normalized`. Icon slots: `inside-card-left` (32x32) for the integration logo on a
processing node, `badge` for the trigger-type glyph (clock/plug) on the trigger node, `database-symbol`
for the dead-letter store, the decision-diamond shape for branch nodes. Normalize scale, preserve aspect,
match the flow preset's stroke and fill. **Reject any icon that introduces HIGH_DENSITY, collides with an
arrow lane or a branch-output / retry label, or clashes with the preset** — drop it and use a primitive.
Record used and rejected items.

## Validation & score
- `hardBlockers` must be empty: no `ARROW_TEXT_INTERSECTION` (a `true`/`false`/case label, a `retry`
  label, a node title, or a back-routed `false`/retry edge never sits under a line — the #1 risk on
  branchy flows), no `FRAME_TITLE_OVERLAP` (the diagram title and any lane labels stay title-only), no
  `ITEM_OUTSIDE_FRAME` (every node fully on the canvas, including the dropped error / dead-letter lane).
- No arrow over text: each branch-output label (`true`, `false`, `"premium"`, `keep`) and each `retry`
  label rides in a clear gutter beside its edge, never under it.
- Titles/headers not overlapping (no `FRAME_TITLE_OVERLAP`): the diagram title and any optional lane
  labels do not collide with each other or a node.
- Legibility: no `SMALL_FONT` — every node label, condition, and edge label renders >= 16px.
- Viewport fit: all content kept >= 40px from canvas/export bounds (no `TEXT_NEAR_EDGE`).
- Density: no `HIGH_DENSITY` — the six operational lanes stay >= 32px apart, cards >= 48px apart.
- `validate_architecture` clean: one trigger; connected graph (no orphan); every diamond output labeled
  and reaching a node or labeled terminal; LR direction consistent.
- **Minimum score 95 with `hardBlockers == []`.** Repair is mandatory below 95 or with any blocker;
  rollback any pass that lowers the score.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. The leak surface here is **node credentials**: a
Webhook trigger's signing secret, an HTTP Request node's `Authorization: Bearer ...` header, an API key on
a Slack/OpenAI/HTTP/Sheets node, a Postgres connection URL with embedded password, an OAuth access/refresh
token on a Gmail node. Redact BEFORE any tool call and re-scan the export:
a raw `Authorization: Bearer <token>` becomes `Authorization: Bearer [REDACTED_BEARER]` placeholder;
a raw `postgres://app:<password>@db:5432/orders` becomes `postgres://app:[REDACTED_DATABASE_URL]@db:5432/orders`;
a webhook secret becomes `[REDACTED_WEBHOOK_SECRET]`; API keys/tokens become `[REDACTED_API_KEY]` /
`[REDACTED_TOKEN]`. Show the *concept* — a key icon, a label "HTTP (Bearer auth)" — not the value. Never
echo a detected secret back to the user.

## Internal prompts
- **LR workflow prompt**: `"n8n automation workflow for <NAME>, left-to-right. Trigger (LEFT):
  'Webhook' (POST /lead). Then -> 'HTTP Request: enrich (GET api.clearbit)' [retry 3x, backoff] ->
  'Set: normalize fields'. Branch (diamond) 'IF: score >= 80?' with outputs: 'true' -> 'Slack: #sales-hot'
  (terminal); 'false' -> 'Gmail: nurture email' -> 'NoOp' (terminal). Error branch (lower lane): HTTP
  failure -> 'Slack: #alerts' (observability) -> 'Dead Letter' store. Integration logos: HTTP, Slack,
  Gmail. One trigger, connected graph, every diamond output labeled true/false, retry and error lanes
  separated, all flow reads left-to-right."`
- **Convert / n8n-JSON path**: `convert_diagram_type({ structure, targetType: "flowchart" })` after
  importing an n8n export — map `nodes[].type` to shapes (`n8n-nodes-base.if`/`.switch`/`.filter` ->
  diamond; `.webhook`/`.cron`/`.manualTrigger` -> trigger terminator; `.httpRequest`/`.slack`/`.gmail`/
  `.postgres` -> process box + logo), `connections{}` outputs (index 0 = `true`, 1 = `false`) to labeled
  edges, and each node's `retryOnFail`/`continueOnFail` to a retry loop or an error-branch edge; then LR.
- **Repair / review nudge**: `"validate_architecture flags an UNLABELED branch output on the 'IF: score
  >= 80?' diamond — the second edge has no label. Fix: label the two outputs 'true' and 'false', place
  each label in the gutter beside its edge (not under it), and route the 'false' edge into a separate
  lower lane so it never crosses the 'Slack: #sales-hot' node title. Keep the diamond and LR direction
  fixed; reroute only the false edge."`
- **Missing-path nudge**: `"suggest_architecture_improvements reports the 'HTTP Request: enrich' node has
  no error handling. Fix: add a labeled 'error' edge from that node into a lower lane -> 'Slack: #alerts'
  (observability) -> 'Dead Letter' store terminal; add a 'retry (3x, backoff)' self-loop through the upper
  gutter. Keep the happy path straight; do not cross the retry and error lanes."`

## Example prompts for Claude Code
- "Diagram our n8n lead-routing workflow: webhook -> enrich via HTTP -> IF score >= 80 -> Slack else Gmail."
- "Turn this n8n JSON export into a clean left-to-right diagram and show where it retries and dead-letters."
- "Draw the Cron sync automation: every hour pull rows from Sheets, transform, upsert into Postgres, alert Slack on failure."
- "Show the error handling in our Stripe webhook automation — happy path, retry, error branch, dead-letter, and the fallback."
- "Visualize this Make/Zapier-style pipeline as an n8n node graph with labeled IF/Switch branches."

## Acceptance criteria
- [ ] Exactly one trigger node on the LEFT (Webhook/Cron/Manual/Email/Form), with its type named.
- [ ] Processing & integration nodes flow strictly left-to-right in execution order.
- [ ] Every branch node (IF / Switch / Filter) is drawn as a DIAMOND, not a rectangle.
- [ ] Every branch output edge is LABELED (`true`/`false`, the named Switch case, or `keep`/`drop`).
- [ ] Happy path, retry, error branch, dead-letter, observability/notify, and fallback each read in their own lane.
- [ ] Terminal/output nodes sit on the RIGHT; each path ends at a node, a labeled terminal, or the dead-letter sink.
- [ ] Integration logos (Slack/Gmail/HTTP/Postgres/OpenAI/Sheets) placed in node icon slots, normalized.
- [ ] Connected graph: no orphan/dangling node; every node reachable from the trigger.
- [ ] Arrows route through gutters; no line crosses a node title, a branch-output label, or a retry label.
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`).
- [ ] Diagram title and any lane labels do not overlap each other or a node.
- [ ] Libraries used per policy when relevant (decision diamonds, integration logos, dead-letter store; normalized).
- [ ] `validate_architecture` clean and `suggest_architecture_improvements` reviewed/applied.
- [ ] No secrets leaked in drawing, response, or export (webhook secret, HTTP bearer, node API keys redacted).

## Examples
See `./references/examples.md` for full request -> plan -> ordered tool calls with realistic arguments,
plus `./references/checklist.md` and `./references/anti-patterns.md`. Shared rules live in
`../_shared/references/library-policy.md`, `../_shared/references/security-redaction.md`,
`../_shared/references/geometry-rules.md`, and `../_shared/references/prompt-patterns.md`.
