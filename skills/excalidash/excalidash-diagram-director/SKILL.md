---
name: excalidash-diagram-director
description: Use when a diagram request arrives and you must first decide the diagram type, preset, library policy, and quality plan before any drawing tool is called.
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__create_diagram_from_prompt
  - mcp__excalidash__create_from_template
  - mcp__excalidash__convert_diagram_type
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
  - mcp__excalidash__save_drawing
  - mcp__excalidash__save_version
  - mcp__excalidash__get_drawing_url
  - mcp__excalidash__export_drawing
---

# Diagram Director

## Objective
Diagram Director is the plan-then-build orchestrator that runs as the FIRST step of any
diagram request. It classifies the request into one diagram type (flow, c4, sequence,
security, dataflow), selects the matching preset, decides whether curated libraries
apply under the active library mode, and writes a short quality plan. It then dispatches
to the correct `create_*` tool and drives the mandatory lint -> score -> repair loop
until the drawing reaches score >= 95 with zero hard blockers. It does not invent a new
layout engine; it picks the right specialist path and enforces the bar.

## When to use / When NOT to use
Use when:
- A user asks for "a diagram", "draw the architecture", "show the flow", "sequence of...",
  "threat model", "data flow", or anything where the diagram type is not yet decided.
- You need to choose between flowchart vs C4 vs sequence vs security vs dataflow.
- A request mixes concerns (e.g. "show the system and how a login request flows") and
  must be split into the right type or multiple views.

Do NOT use when:
- The diagram type, preset, and target are already fixed and you only need to edit an
  existing scene — go straight to the specialist skill (e.g. a flowchart or C4 skill).
- The user explicitly invoked a specific create tool/template and gave full parameters.
- The task is pure export/share of an already-scored drawing.

## Expected input
- A natural-language description of what to draw (system, process, scenario, threats).
- Optional: target diagram type, preset name, template id, repo path, or an existing
  `drawingId` to convert.
- Optional: library mode hint (off / curated / required) and a destination (save title).
- Possibly secret-bearing text (env files, connection strings) — must be redacted.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load active preset list, `MCP_LIBRARY_MODE`, scoring rubric.
2. `mcp__excalidash__list_templates` — see if a template matches the chosen type (skip if none fits).
3. `mcp__excalidash__search_libraries` -> `mcp__excalidash__inspect_library` -> `mcp__excalidash__cache_library` — only if libraries apply.
4. ONE of: `mcp__excalidash__create_diagram_from_prompt` | `mcp__excalidash__create_from_template` | `mcp__excalidash__convert_diagram_type`.
5. `mcp__excalidash__add_library_items_normalized` — place vetted icons into slots (if libraries apply).
6. `mcp__excalidash__lint_drawing` -> `mcp__excalidash__score_drawing` -> `mcp__excalidash__repair_drawing` (loop).
7. `mcp__excalidash__auto_polish_drawing` — final spacing/alignment pass after blockers clear.
8. `mcp__excalidash__validate_architecture` — for c4 / security / dataflow correctness.
9. `mcp__excalidash__save_drawing` + `mcp__excalidash__save_version` -> `mcp__excalidash__get_drawing_url` -> `mcp__excalidash__export_drawing`.

## Workflow
1. **Plan** — read the guide, then decide:
   - **Type**: structure of a system -> `c4`; ordered step logic / branches -> `flow`;
     time-ordered messages between actors -> `sequence`; trust boundaries / authn-authz /
     threats -> `security`; movement of data through processes/stores -> `dataflow`.
   - **Preset**: pick the preset that matches the type (e.g. an architecture preset for
     c4, a process preset for flow). Keep one preset per drawing.
   - **Library policy**: read `MCP_LIBRARY_MODE`. In `curated`/`required`, plan which
     curated packs apply (see Library policy). In `off`, draw with primitives only.
   - **Quality plan**: note the target (score >= 95, zero blockers) and which validators
     apply (`validate_architecture` for c4/security/dataflow).
2. **Generate** — call exactly ONE create path:
   - prompt-driven: `create_diagram_from_prompt({ prompt, diagramType, preset, direction })`;
   - template-driven: `create_from_template({ templateId, preset })` when a template fits;
   - conversion: `convert_diagram_type({ structure, targetType, preset })` when reshaping an
     existing drawing. Redact secrets in the prompt BEFORE this call.
3. **Lint** — `lint_drawing({ id })`. Read `hardBlockers` (must end empty):
   ARROW_TEXT_INTERSECTION, FRAME_TITLE_OVERLAP, ITEM_OUTSIDE_FRAME.
4. **Score** — `score_drawing({ minimumScore: 95 })`. Record the numeric score and every penalty
   (TEXT_NEAR_EDGE, HIGH_DENSITY, SMALL_FONT).
5. **Repair (mandatory)** — `repair_drawing({ save: true, createVersion: true, name })`. The
   engine routes the listed blockers/penalties (reroute arrow lanes, widen gutters, push frame
   children below the title band). Repair is required whenever score < 95 or any blocker exists;
   never ship an unrepaired drawing.
6. **Re-run the loop** — lint -> score after each repair. **Rollback rule**: if a repair
   pass LOWERS the score, restore the previous version (the `save_version({ id })` checkpoint)
   and try a different, smaller fix. Iterate the lint -> score -> repair loop until
   `score >= 95` AND `hardBlockers == []`.
7. **Polish** — once blockers are clear, run `auto_polish_drawing({ minimumScore: 95 })` for
   final grid-snap, spacing, and alignment; re-score to confirm it did not regress.
8. **Validate architecture** — for c4 / security / dataflow, call
   `validate_architecture({ structure })` and fix any structural findings (orphan nodes,
   missing trust boundary, broken layer dependency), then re-score.
9. **Save** — `save_drawing({ id, name })` then `save_version({ id })` to checkpoint the
   accepted state.
10. **Export** — `get_drawing_url({ id })` for a shareable link and `export_drawing({ id, format })`
    (PNG/SVG/excalidraw, redacted) for the deliverable. Re-scan the export for secrets as a backstop.

## Library policy
- Read `MCP_LIBRARY_MODE` first. `off` = primitives only; `curated` = curated packs allowed
  if they don't lower the score; `required` = use a curated icon where one exists.
- **Recommended curated packs for this skill**: **Software Architecture** (services,
  queues, gateways), **Flow Chart Symbols** (start/end, decision, process, IO),
  **C4 Architecture** (person, system, container, component, boundary). For security add a
  key/lock symbol from Software Architecture; for dataflow use Data Flow (entity, process,
  store, flow).
- **Per type**: c4 -> C4 Architecture; flow -> Flow Chart Symbols; sequence -> actor/stick
  figure for lifelines; security -> C4 boundary + lock/key; dataflow -> Data Flow pack.
- **Icon slots**: place items only in defined slots — `inside-card-left`,
  `inside-card-top`, `badge`, `legend`, `actor`, `database-symbol`, `cloud-provider`.
  Never let an icon overlap card text or sit in an arrow lane.
- **Normalize** every item via `add_library_items_normalized` (scale to slot box, preserve
  aspect, match preset stroke/roughness/fill, recolor to palette).
- **Reject** any item that introduces HIGH_DENSITY, collides with text/arrows, or clashes
  with the preset — drop it and draw a primitive. Record used and rejected items.
- Full rules: ../_shared/references/library-policy.md

## Validation & score
- `hardBlockers` MUST be empty: no ARROW_TEXT_INTERSECTION, no FRAME_TITLE_OVERLAP, no
  ITEM_OUTSIDE_FRAME.
- No arrow/line segment may cross any text bounding box (arrows exit via card sides and
  travel in >= 32px gutters).
- Titles/frame headers must not overlap content — the top 40px of every frame is title-only.
- Viewport fit: >= 40px clear margin around the whole composition; nothing clipped.
- Minimum accepted score: **95**, with zero blockers. A pass that lowers the score is
  rolled back. See ../_shared/references/geometry-rules.md and ./references/checklist.md.

## Secrets & redaction
Scan all user-provided text BEFORE it enters the create call, and re-scan the export as a
backstop. Redact JWT secrets, API keys, provider keys, service-role keys, database URLs,
tokens, bearer values, webhook secrets, and proxy secrets to typed placeholders
(`[REDACTED_JWT_SECRET]`, `[REDACTED_API_KEY]`, `[REDACTED_SERVICE_ROLE]`,
`[REDACTED_DATABASE_URL]`, `[REDACTED_TOKEN]`, `[REDACTED_BEARER]`,
`[REDACTED_WEBHOOK_SECRET]`, `[REDACTED_PROXY_SECRET]`). Keep the surrounding structure so
the diagram still communicates intent (show "API key" label / key icon, never the value).
Fail closed on uncertainty. Full rules: ../_shared/references/security-redaction.md

## Internal prompts
- **Classify**: "Given this request, choose exactly one type from {flow, c4, sequence,
  security, dataflow} and justify in one line. If two types are mixed, name the primary
  type and flag the secondary as a candidate split."
- **Plan**: "Output a 4-line plan: TYPE=<>, PRESET=<>, LIBRARY=<off|curated|required +
  packs>, VALIDATORS=<lint,score,repair[,validate_architecture]>."
- **Repair loop**: "Lint and score. For each blocker/penalty, state cause -> minimal fix ->
  apply -> re-score. If the score dropped, roll back to the last checkpoint and try a
  smaller fix. Stop only at score >= 95 with zero blockers."

## Example prompts for Claude Code
These are the kinds of user requests that should trigger Diagram Director first (type not yet decided):
- "Draw our system: a Next.js web app talks to a Go API, which uses Postgres and Redis."
- "Show the checkout steps, with a branch when stock runs out."
- "How does login work over time between the browser, the API, and the database?"
- "Threat model the upload service and show the trust boundaries."
- "Take this checkout flow and turn it into a data flow diagram."

## Acceptance criteria
- [ ] Exactly one diagram type chosen and one create path called.
- [ ] `score_drawing` final result >= 95.
- [ ] `hardBlockers` is empty (no arrow/text intersection, no frame-title overlap, no item-outside-frame).
- [ ] No overlapping titles/headers; >= 40px viewport margin; nothing clipped.
- [ ] Libraries used when relevant (curated packs, normalized, in slots) or omitted in `off` mode.
- [ ] `validate_architecture` clean for c4 / security / dataflow.
- [ ] No secrets leaked in drawing, response, logs, or export.
- [ ] A repair that lowered the score was rolled back, not shipped.

## Examples
See ./references/examples.md for concrete request -> plan -> tool-call sequences.
Related: ./references/checklist.md, ./references/anti-patterns.md, and shared docs under
../_shared/references/.
