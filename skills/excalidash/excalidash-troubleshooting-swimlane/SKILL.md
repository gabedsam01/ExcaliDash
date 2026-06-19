---
name: excalidash-troubleshooting-swimlane
description: Use when you need an incident/troubleshooting swimlane — one lane per actor/service/system, decision diamonds, and explicit happy-path, retry/backoff, error, dead-letter, fallback, escalation and resolution branches with a legend.
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__convert_diagram_type
  - mcp__excalidash__create_diagram_from_prompt
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
  - mcp__excalidash__save_drawing
  - mcp__excalidash__save_version
  - mcp__excalidash__get_drawing_url
  - mcp__excalidash__export_drawing
---

# Troubleshooting Swimlane

## Objective
Produce an incident/troubleshooting swimlane: a left-to-right flow split into horizontal
**lanes**, one per actor/service/system that owns part of the response (e.g. User, Support,
On-call Engineer, API/Service, Queue/Worker, Datastore, Pager/Escalation). Each step is a
clear verb, each branch point is a **decision diamond** with labelled exits, and every path
ends in an explicit **terminal state** (Resolved / Escalated / Dead-letter / Gave-up). The
diagram must separate the distinct paths — **happy path, retry/backoff, error, dead-letter,
fallback, escalation, and resolution** — so a reader can trace any one of them without the
arrows crossing. A legend keys lane ownership and path types (happy / retry / error / fallback
/ terminal). The result must score >= 95 with zero hard blockers.

## When to use / When NOT to use
**Use when**: the request is "draw the runbook for <incident>", "show how we triage and resolve
<failure>", "map who does what when <service> goes down", an on-call/runbook swimlane, an
incident-response flow with retries and escalation, or "a swimlane where each lane is an
actor/system and decisions branch to retry/error/escalate". Use when ownership matters and you
need lanes to show *who* handles each step.

**Use when** you already have a generic flowchart of the incident and need to assign ownership
lanes -> `convert_diagram_type({ targetType: "swimlane", direction: "LR" })`.

**Do NOT use when**:
- The flow has no actor/owner dimension and is a single linear process -> use the **flowchart**
  skill (`excalidash-flowchart`); a swimlane with one lane is just a flowchart.
- The focus is time-ordered request/response messages between two or three parts -> use a
  **sequence diagram**; a swimlane is for ownership + branching, not a timeline.
- The focus is metrics/traces/logs/alert wiring rather than human+system response steps -> use
  the **observability flow** skill (`excalidash-observability-flow`).
- The request is the *architecture* of the system (containers, layers, boundaries) rather than
  the *flow of handling an incident* -> use the matching architecture skill (C4 Container,
  etc.). See `../_shared/references/mcp-tool-cheatsheet.md`.

## Expected input
A short description of the incident/troubleshooting flow, ideally with:
- **Lanes** — the actors/services/systems that own steps ("User", "Support L1", "On-call
  Engineer", "Orders API", "Retry Worker", "Datastore", "Escalation/Pager"). One owner = one lane.
- **Trigger** — what starts the flow ("User reports 5xx", "Alert fires", "Job fails").
- **Decisions** — the branch points as yes/no or category questions ("Transient?", "Bug?",
  "Within SLA?", "Retries exhausted?").
- **Paths** — which branch is happy path, which is retry/backoff, which is error, which is
  dead-letter, which is fallback/escalation.
- **Terminal states** — every path's end ("Resolved", "Escalated to L2", "Dead-letter queue",
  "Rolled back").
If lanes or decisions are implicit, infer the obvious ones from the narrative and state the
assumption. Secrets in any label (tokens, db URLs, webhook signing secrets) must be redacted
BEFORE they reach a tool argument.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, the scoring rubric.
2. `mcp__excalidash__list_templates` — look for a swimlane/flow template (optional).
3. `mcp__excalidash__search_libraries` -> `mcp__excalidash__inspect_library` ->
   `mcp__excalidash__cache_library` — vet start/end, decision-diamond, process and IO glyphs
   from the curated packs, plus actor figures.
4. ONE create path:
   - `mcp__excalidash__convert_diagram_type` with `targetType: "swimlane"`, `direction: "LR"`
     to turn an existing incident flowchart into lanes (preferred when a flow already exists), OR
   - `mcp__excalidash__create_diagram_from_prompt` with `diagramType: "swimlane"`,
     `direction: "LR"` and an explicit lane/decision `structure`, OR
   - `mcp__excalidash__create_from_template` with a swimlane/flow `templateId`.
5. `mcp__excalidash__add_library_items_normalized` — place actor figures in lane headers and
   decision/start/end glyphs in reserved icon slots.
6. `mcp__excalidash__lint_drawing` -> `mcp__excalidash__score_drawing` ->
   `mcp__excalidash__repair_drawing` (loop).
7. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
8. `mcp__excalidash__validate_architecture` — confirm every step sits in exactly one lane, every
   decision has labelled exits, and every path reaches a terminal state.
9. `mcp__excalidash__save_drawing` -> `mcp__excalidash__save_version` ->
   `mcp__excalidash__get_drawing_url` -> `mcp__excalidash__export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=swimlane DIRECTION=LR PRESET=technical-docs LIBRARY=curated[Flow Chart Symbols, Data Flow, Stick Figures]
   LANES=<owners> DECISIONS=<questions> PATHS=happy,retry,error,dead-letter,fallback,escalation,resolution
   VALIDATORS=lint,score,repair,validate_architecture`. Confirm one owner per lane and that every
   decision and every terminal state is named. Redact any secret in the input BEFORE it reaches a
   tool argument.
2. **Generate (one path only).**
   - If an incident flowchart already exists, prefer
     `convert_diagram_type({ targetType: "swimlane", direction: "LR" })` so the existing steps are
     re-laid into ownership lanes.
   - Otherwise `create_diagram_from_prompt({ diagramType: "swimlane", direction: "LR", structure: { nodes, edges } })`
     with an explicit lane assignment per node and a labelled branch per decision exit.
   - Fallback: `create_from_template` with a swimlane/flow template, then add lanes/branches.
   - Layout intent: lanes stack top-to-bottom, flow runs left-to-right; the trigger sits at the
     left edge of its owner's lane; decision diamonds branch to **separate gutter lanes** (>= 32px)
     so the happy/retry/error/fallback lines never overlap; retry loops bend back through a
     reserved lane, never over a step; terminal states align on the right edge. Reserve the top
     40px of each lane band for its title.
3. **Place icons.** `add_library_items_normalized` — a start glyph on the trigger, a decision
   diamond glyph on each branch point, end/terminator glyphs on each terminal state, an `actor`
   stick figure in each lane header. Keep icons in slots; never let one sit in an arrow lane or
   over a label.
4. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty.
5. **Score.** `score_drawing`; record the number and every penalty.
6. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint and
   re-score. Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a repair pass
   lowers the score, restore the last `save_version` checkpoint and apply a smaller, targeted fix.
7. **Polish.** Only after blockers clear, run `auto_polish_drawing`; re-score to confirm no
   regression (rollback if it drops below the checkpoint).
8. **Validate.** `validate_architecture` — every step belongs to exactly one lane; no step
   straddles two lane bands; every decision diamond has >= 2 labelled exits; every path reaches a
   terminal state; no dangling step; retry loops return to a real step.
9. **Save.** `save_drawing` with a clear title (`"<Incident> — Troubleshooting Swimlane"`), then
   `save_version` to checkpoint the accepted state.
10. **Export.** `get_drawing_url` for a link, then `export_drawing` (svg/png/excalidraw); re-scan
    the export for secrets as a backstop (runbook labels often paste a webhook secret or db URL).

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only; draw lane bands, the start/end terminators, decision diamonds and
  process rectangles by hand; no icon calls.
- **curated** (default) — pull only from **Flow Chart Symbols** (start/end, decision, process,
  IO), **Data Flow** (external entity, process, data store, flow) for the systems a lane touches,
  and **Stick Figures** for the human actors in lane headers (User, Support, On-call Engineer).
- **required** — every decision MUST use a diamond glyph, every terminal state MUST use an
  end/terminator glyph, and every human-owned lane MUST carry an actor figure; a plain rectangle
  where a curated symbol exists is a violation.

Workflow: `search_libraries` -> `inspect_library` (aspect, stroke, fill, complexity) ->
`cache_library` -> `add_library_items_normalized`. Icon slots: `actor` for lane-header people
(48x48), `inside-card-top` for start/process glyphs (32x32), a decision-diamond glyph on each
branch node, `badge` for path-type markers, `legend` for the keyed swatches (happy / retry /
error / fallback / terminal). Normalize scale, preserve aspect, match the `technical-docs` preset's
stroke and fill. **Reject any icon that introduces HIGH_DENSITY or collides with an arrow lane** —
drop it and use a primitive. Record used and rejected items.

## Validation & score
- `hardBlockers` must be empty:
  - **ARROW_TEXT_INTERSECTION** — no branch/retry/loop line crosses any step label, decision
    label, or lane title. Route each branch through its own gutter lane.
  - **FRAME_TITLE_OVERLAP** — no step or icon overlaps a lane band's reserved title; lane titles
    stay title-only.
  - **ITEM_OUTSIDE_FRAME** — every step sits fully inside exactly one lane band; nothing straddles
    a lane divider or pokes outside the bottom lane.
- Penalties to drive to zero: **SMALL_FONT** (all text >= 16px, lane titles >= 20px), **HIGH_DENSITY**
  (>= 48px step gaps, >= 32px branch lanes; split a crowded lane into more vertical space),
  **TEXT_NEAR_EDGE** (all content >= 40px from canvas/export bounds).
- No crossing arrows where a reroute through a gutter is possible; cross only when topology forces
  it, at near-90°.
- `validate_architecture` clean: one lane per step, labelled decision exits, every path terminal.
- **Minimum score 95.** Repair is mandatory below 95 or with any blocker; rollback any pass that
  lowers the score. See `../_shared/references/geometry-rules.md`.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. Runbook/troubleshooting flows are
secret-prone because steps quote real commands, pager webhooks, and datastore connection strings.
Redact BEFORE any tool call and re-scan the export. Concrete examples:
- a step "curl -H 'Authorization: Bearer <JWT>' /health" becomes
  "curl -H 'Authorization: Bearer [REDACTED_BEARER]' /health".
- a "page on-call via https://hooks.pager/x?token=<webhook secret>" becomes
  "page on-call via https://hooks.pager/x?token=[REDACTED_WEBHOOK_SECRET]".
- a "reconnect to postgres://app:<password>@db/main" becomes
  "reconnect to postgres://app:[REDACTED_DATABASE_URL]@db/main".
- API keys, service-role keys, JWT secrets, OAuth tokens, proxy creds become typed placeholders:
  `[REDACTED_API_KEY]`, `[REDACTED_SERVICE_ROLE]`, `[REDACTED_JWT_SECRET]`, `[REDACTED_TOKEN]`,
  `[REDACTED_PROXY_SECRET]`. Show the *concept* (a "verify token" step, a key icon) not the value,
  and never echo a detected secret back to the user — the transcript is shared too.

## Internal prompts
- **Lane/decision plan prompt**: `"Plan the troubleshooting swimlane for: <incident>. List the
  lanes (one owner each), the trigger, every decision question with its yes/no or category exits,
  and the terminal state each path reaches (Resolved / Escalated / Dead-letter / Rolled back).
  Tag each branch as happy / retry / error / fallback / escalation before drawing."`
- **Swimlane structure prompt**: `"Swimlane (LR) for <incident>. Lanes: User; Support L1; On-call
  Engineer; Orders API; Retry Worker; Escalation. Trigger (User lane): 'User reports 5xx'. Steps
  and decisions: Support L1 'Triage' -> decision 'Reproducible?' (yes -> Engineer 'Investigate';
  no -> Support L1 'Resolve & close'=RESOLVED). Engineer decision 'Transient?' (yes -> Retry
  Worker 'Retry w/ backoff' -> decision 'Retries exhausted?' yes -> 'Dead-letter'=DEAD-LETTER, no
  -> 'Recovered'=RESOLVED; no -> decision 'Within SLA?' yes -> 'Fix & deploy'=RESOLVED, no ->
  Escalation 'Page L2'=ESCALATED). Each step in exactly one lane; label every branch; route
  branches in separate gutters; legend: happy / retry / error / fallback / terminal."`
- **Repair nudge**: `"ARROW_TEXT_INTERSECTION on the 'Retry w/ backoff' loop-back -> route the
  return line through the reserved retry gutter under the lane and move its label into the side
  lane with 32px clearance; keep the decision diamond fixed in the Engineer lane."`
- **Re-score gate**: `"Score the drawing; if < 95 or any hard blocker remains, apply the
  repairPlan, re-lint and re-score; confirm no arrow crosses a label and every path ends in a
  terminal state before saving."`

## Example prompts for Claude Code
- "Draw a troubleshooting swimlane for our checkout 5xx incident: lanes for User, Support,
  On-call Engineer, Orders API and Retry Worker, with retry/backoff and escalation to L2."
- "Turn this incident runbook flowchart into a swimlane so each step shows who owns it, and add
  a dead-letter path when retries are exhausted."
- "Map the on-call response when the payments queue backs up — happy path, retry, error,
  dead-letter and a fallback to manual processing, ending in Resolved or Escalated."
- "Make an incident swimlane for a failed nightly job: detect, classify transient vs bug, retry
  with backoff, and page the on-call engineer if it's still failing within SLA."
- "Build a troubleshooting swimlane for login outages with lanes User / Support L1 / Auth
  Service / Identity Provider and clear Resolved vs Escalated terminal states."

## Acceptance criteria
- [ ] Lanes are distinct — exactly one owner (actor/service/system) per lane band.
- [ ] Every step sits fully inside exactly one lane; none straddles a divider (`ITEM_OUTSIDE_FRAME`).
- [ ] Every decision is a diamond with >= 2 labelled exits (yes/no or category).
- [ ] The distinct paths are separated and traceable — happy, retry/backoff, error, dead-letter,
      fallback, escalation, resolution — with branch lanes that do not overlap.
- [ ] Every path reaches an explicit terminal state (Resolved / Escalated / Dead-letter / Rolled back).
- [ ] Retry loops bend back through a reserved gutter, never over a step or label.
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`); no `FRAME_TITLE_OVERLAP`.
- [ ] Lane titles and the diagram title do not overlap each other or any step.
- [ ] A legend keys lane ownership and path types (happy / retry / error / fallback / terminal).
- [ ] Libraries used per policy when relevant (decision diamonds, terminators, actor figures; normalized).
- [ ] `validate_architecture` clean: one lane per step, labelled exits, every path terminal, no dangling step.
- [ ] No secret leaked in the drawing, the response, or the export ([REDACTED_<TYPE>] only).

## Examples
See `./references/examples.md` for full request -> plan line -> ordered tool calls with realistic
arguments, plus `./references/checklist.md` and `./references/anti-patterns.md`. Shared rules live
in `../_shared/references/geometry-rules.md`, `../_shared/references/library-policy.md`, and
`../_shared/references/security-redaction.md`.
