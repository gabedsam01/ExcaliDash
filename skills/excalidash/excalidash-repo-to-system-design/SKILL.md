---
name: excalidash-repo-to-system-design
description: Use when you have a structured repository analysis (actors, apps, gateways, services, workers, queues, databases, integrations, auth, observability, risks, flows) and need to turn it into a real, framed system-design diagram.
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__create_from_repo_analysis
  - mcp__excalidash__create_diagram_from_prompt
  - mcp__excalidash__apply_architecture_skill
  - mcp__excalidash__list_templates
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

# Repo to System Design

## Objective
Turn a structured repository analysis into a real, framed system-design diagram that an
engineer would recognize as their own system. The rich intermediate model — actors, apps,
gateways, services, workers, queues, databases, integrations, auth, observability, risks,
and flows — is fed to `create_from_repo_analysis`, which materializes one **frame per zone**
(Client / Edge / Services / Async / Data / External / Cross-cutting), routes arrows along the
real request and event flows, and emits a zone legend. The result must score >= 95 with zero
hard blockers and pass `validate_architecture`.

## When to use / When NOT to use
**Use when**: you (or an upstream analyzer) have already walked a repository and produced a
structured model — "here are the actors, the entrypoints, the services, the queues, the
databases, the third-party integrations, the auth scheme, the telemetry, and the main request
and event flows — draw the system." Use when the ask is "diagram this codebase as a system
design", "render the repo analysis", "give me the as-built architecture of this repo", or
"map this monorepo's runtime topology".

**Use when** the analysis carries *flows* (numbered request paths and event paths) that should
become routed, labeled arrows — this skill is built for flow-aware layout.

**Do NOT use when**:
- You have only a prose paragraph and no structured model -> use `excalidash-diagram-director`
  or a `create_diagram_from_prompt` architecture skill, or run a repo analysis first.
- The ask is a single canonical level/pattern (just a C4 container view, just a microservices
  topology, just an event-driven bus) -> use that dedicated skill; this skill is for the *whole*
  as-built system pulled from analysis, not one curated lens.
- The ask is behavior over time for one scenario -> use a sequence diagram.
- There is no repository / no analysis to ground the nodes -> do not invent a system.

## Expected input
A structured repository-analysis object (the rich intermediate model). Each section is optional
but the more present, the richer the zones:
- **actors** — humans/systems that initiate: `[{ name, kind: "user"|"admin"|"system" }]`.
- **apps** — deployable frontends/entrypoints: `[{ name, kind: "spa"|"web"|"mobile"|"cli", tech }]`.
- **gateways** — edge: `[{ name, kind: "api-gateway"|"bff"|"lb"|"reverse-proxy", tech }]`.
- **services** — runtime services: `[{ name, tech, owns: ["<db>"], exposes: ["<route>"] }]`.
- **workers** — async consumers/cron: `[{ name, tech, consumes: ["<queue>"] }]`.
- **queues** — brokers/topics: `[{ name, kind: "queue"|"topic"|"stream", tech }]`.
- **databases** — stores: `[{ name, kind: "relational"|"document"|"cache"|"warehouse"|"object", tech, conn }]`.
- **integrations** — third parties: `[{ name, kind: "payments"|"email"|"idp"|"saas", tech }]`.
- **auth** — `{ scheme: "oauth"|"jwt"|"session"|"mtls", idp, notes }`.
- **observability** — `{ logs, metrics, traces, dashboards }` (cross-cutting zone).
- **risks** — `[{ area, severity, note }]` (annotated as badges/callouts, not nodes in flows).
- **flows** — the spine: `[{ id, kind: "request"|"event", steps: [{ from, to, label, protocol }] }]`.
Each `conn` / token / key field MUST be redacted BEFORE it reaches a tool argument (see below).

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, scoring rubric.
2. `mcp__excalidash__list_templates` — look for a `system-design` / `repo-system` template (optional).
3. `mcp__excalidash__search_libraries` -> `inspect_library` -> `cache_library` — vet service,
   gateway, queue, database, vendor-logo and actor icons from the curated packs.
4. ONE create path:
   - `mcp__excalidash__create_from_repo_analysis` with the full intermediate model (preferred), OR
   - `mcp__excalidash__apply_architecture_skill` with `pattern: "microservices"` (downshift the
     service-heavy analysis to a topology skeleton), OR
   - `mcp__excalidash__create_diagram_from_prompt` with `diagramType: "architecture"` and an explicit
     zone/flow `structure` (fallback when no analysis object is accepted).
5. `mcp__excalidash__add_library_items_normalized` — place service/gateway/queue/store/logo/actor icons.
6. `mcp__excalidash__lint_drawing` -> `score_drawing` -> `repair_drawing` (loop).
7. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
8. `mcp__excalidash__validate_architecture` + `suggest_architecture_improvements` — confirm
   zone correctness and harvest fixes for weak edges.
9. `mcp__excalidash__save_drawing` -> `save_version` -> `get_drawing_url` -> `export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=system-design SOURCE=repo-analysis PRESET=architecture
   ZONES=[Client, Edge, Services, Async, Data, External, Cross-cutting]
   LIBRARY=curated[Software Architecture, Technology Logos, Cloud/DevOps, Database/Data Platform]
   VALIDATORS=lint,score,repair,validate_architecture`. Confirm the analysis has at least one
   `flow` so arrows are grounded in real paths. **Redact** every `conn` string, token, key, IdP
   secret, webhook/proxy secret, and bearer value in the model BEFORE it reaches a tool argument.
2. **Generate (one path only).**
   - Preferred: `create_from_repo_analysis({ analysis: <model>, preset: "architecture",
     autoPolish: true, save: true, name: "<Repo> — System Design" })`. This is the only tool that
     consumes the rich model directly — it builds one frame per zone, drops each node into its zone,
     routes one arrow per flow step (labeled with the step `label` + `protocol`), and emits a zone
     legend. Each `analysis` section (`modules`, `entrypoints`, `database`, `services`,
     `integrations`) carries the redacted nodes and flows.
   - Fallback A: `apply_architecture_skill({ pattern: "microservices", preset: "architecture",
     title: "<Repo> — System Design" })` when the analysis is service-heavy and you must downshift
     to a topology skeleton. The service/queue/store detail and edges are conveyed via the `title`
     and refined afterward; there is no `skill` or `level` argument — `pattern` only.
   - Fallback B: `create_diagram_from_prompt({ diagramType: "architecture", prompt: <zone+flow
     text>, structure: { nodes, edges }, direction: "TB" })` when no analysis object is accepted.
     Capture the returned drawing id.
   - Layout intent: zones flow **left-to-right / top-to-bottom** — Actors+Client at the top edge,
     Edge (gateway/LB/BFF) below, Services in the central band, Async (queues+workers) to one side,
     Data along the bottom, External/integrations on the right margin, Cross-cutting (auth +
     observability) as a thin spanning band or corner block. Reserve **>= 32px arrow gutters** so
     request flows and event flows never cross a node or each other.
3. **Place icons.** `add_library_items_normalized` — service glyph as `inside-card-top` per
   service/worker, `database-symbol` per store, queue/broker icon per queue, vendor logos as
   `inside-card-left`/`badge` for integrations, person icon in the `actor` slot, an auth key badge
   and observability glyph in the Cross-cutting band, `legend` swatches per zone.
4. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty.
5. **Score.** `score_drawing`; record the number and every penalty.
6. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint and
   re-score. Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a repair pass
   lowers the score, restore the last `save_version` checkpoint and apply a smaller fix.
7. **Polish.** Only after blockers clear, run `auto_polish_drawing`; re-score to confirm no
   regression (rollback if it drops below the checkpoint).
8. **Validate.** `validate_architecture` — every node sits in a zone frame; every flow step is an
   endpointed, labeled edge; no orphan node; request flows and event flows are visually distinct;
   no integration drawn inside a service zone. Run `suggest_architecture_improvements` to surface
   missing edges (e.g. a service owning a DB with no read/write arrow) and apply the safe ones,
   re-scoring after each.
9. **Save.** `save_drawing` with a clear title (`"<Repo> — System Design"`), then `save_version`
   to checkpoint the accepted state.
10. **Export.** `get_drawing_url` for a link, then `export_drawing` (svg/png/json); **re-scan the
    export** for secrets — DB connection strings, IdP secrets, integration API keys and webhook
    secrets are the common leaks from a repo analysis.

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only; draw zone frames, service rectangles, cylinder stores, queue shapes
  and actor stick-figures by hand; no icon calls.
- **curated** (default) — pull only from **Software Architecture** (services, gateways, queues,
  layers), **Technology Logos** (vendor/protocol/framework logos for apps, services, integrations),
  **Cloud/DevOps** (LB, k8s, CI/CD, containers, observability), and **Database/Data Platform**
  (relational, document, cache, warehouse, object, queue). Actors from Stick Figures.
- **required** — every database MUST use a `database-symbol`, every queue MUST use a queue/broker
  icon, every branded integration/cloud node MUST use its logo; a primitive where a curated icon
  exists is a violation.

Workflow: `search_libraries` -> `inspect_library` (aspect, stroke, fill, complexity) ->
`cache_library` -> `add_library_items_normalized`. Icon slots: `inside-card-top` for service/app
glyphs (32x32), `database-symbol` for stores, `cloud-provider`/`badge` for integration/cloud logos,
`actor` for people (48x48), `legend` for the per-zone swatches. Normalize scale, preserve aspect,
match the architecture preset's stroke and fill. **Reject any icon that introduces HIGH_DENSITY,
collides with a flow lane, or clashes with the preset** — drop it and use a primitive. Record used
and rejected items so re-runs of the same repo stay consistent.

## Validation & score
- `hardBlockers` must be empty: no `ARROW_TEXT_INTERSECTION` (flow step labels never sit under a
  routed line), no `FRAME_TITLE_OVERLAP` (zone-frame titles and the legend header stay title-only),
  no `ITEM_OUTSIDE_FRAME` (every node fully inside its zone frame; integrations in the External
  zone, not half-clipped).
- No arrow over text: each flow label rides in a clear gutter beside its routed line.
- Titles/headers not overlapping: the diagram title, every zone-frame title, and the legend header
  do not collide with each other or with any node.
- Viewport fit: all content kept >= 40px from canvas/export bounds (no `TEXT_NEAR_EDGE`).
- `validate_architecture` clean: zones present, every node zoned, every flow step endpointed and
  labeled, request vs event flows distinct, no orphans, no integration inside a service zone.
- **Minimum score 95.** Repair is mandatory below 95 or with any blocker; rollback any pass that
  lowers the score.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. A repo analysis is the single most
secret-prone input this server takes: it can carry `.env` values, DB connection strings, IdP
client secrets, integration API keys, webhook signing secrets and proxy creds verbatim. Redact in
the model BEFORE any tool call and re-scan the export. A `postgres://app:<password>@db/main` `conn` becomes
`postgres://app:[REDACTED_DATABASE_URL]@db/main`; an `auth.idpSecret` becomes
`[REDACTED_PROVIDER_KEY]`; integration keys become `[REDACTED_API_KEY]`; JWT signing keys become
`[REDACTED_JWT_SECRET]`; webhook secrets become `[REDACTED_WEBHOOK_SECRET]`; bearer values become
`[REDACTED_BEARER]`. Show the *concept* (label an edge "authenticates via OAuth", show a key icon
in the auth band) not the value. Never echo a detected secret back to the user.

## Internal prompts
- **Repo-analysis create (preferred)**:
  `create_from_repo_analysis({ analysis: { modules:[...], entrypoints:[...], database:{...},
  services:[...], integrations:[...] }, preset:"architecture", autoPolish:true, save:true,
  name:"<Repo> — System Design" })` — fold the rich model (actors/apps/gateways/workers/queues/
  auth/observability/risks/flows) into the `analysis.services`, `analysis.entrypoints`,
  `analysis.modules`, `analysis.database` and `analysis.integrations` sections, redacted first.
- **Zone+flow prompt (fallback)**: `"System design from repo analysis. Zones: Client (actors,
  SPA), Edge (API gateway), Services (Orders, Billing, Auth), Async (Kafka + Fulfillment Worker),
  Data (Postgres, Redis), External (Stripe, SendGrid), Cross-cutting (OAuth IdP, OTel/Grafana).
  Request flow f1: Customer -> SPA -> Gateway -> Orders -> Postgres. Event flow f2: Orders ->
  Kafka -> Fulfillment Worker. Frame each zone, route request flows solid and event flows dashed,
  add a zone legend. No secrets."`
- **Repair nudge**: `"ARROW_TEXT_INTERSECTION on flow f1 step 'calls over HTTPS/JSON' -> route the
  line through the Services-row gutter and move the label into the side lane with 32px clearance;
  keep the Orders service fixed inside the Services zone frame."`

## Example prompts for Claude Code
These user prompts should trigger this skill:
- "We ran the analyzer over the OrderFlow monorepo — draw it as a system design from the analysis."
- "Here's the repo-analysis JSON (actors, services, queues, databases, integrations, flows). Render the as-built architecture."
- "Map this monorepo's runtime topology: front-ends, gateways, services, Kafka, Postgres, Stripe, and the request and event flows."
- "Turn the structured analysis of our checkout repo into a framed system-design diagram with one frame per zone."
- "Give me the as-built system design for this codebase from the analysis, with routed request and event flows and a zone legend."

## Acceptance criteria
- [ ] Built via `create_from_repo_analysis` from the rich intermediate model (or a documented fallback).
- [ ] One frame per present zone (Client / Edge / Services / Async / Data / External / Cross-cutting).
- [ ] Every node sits inside its zone frame; integrations are in External, not inside a service zone.
- [ ] Every `flow` step is a routed, labeled arrow (label + protocol); request and event flows are visually distinct.
- [ ] A zone legend is present and accurate; no flow line crosses a node or another label.
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`); no overlapping titles/headers.
- [ ] Libraries used per policy when relevant (database-symbol, queue icons, vendor logos, actor; normalized).
- [ ] `validate_architecture` clean; `suggest_architecture_improvements` reviewed and safe fixes applied.
- [ ] No secrets leaked in drawing, response, or export (conn strings / IdP / integration keys redacted).

## Examples
See `./references/examples.md` for full request -> plan -> ordered tool calls with realistic
repo-analysis arguments, plus `./references/checklist.md` and `./references/anti-patterns.md`.
Shared rules live in `../_shared/references/library-policy.md`,
`../_shared/references/security-redaction.md`, `../_shared/references/geometry-rules.md`, and
`../_shared/references/architecture-patterns.md`.
