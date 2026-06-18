---
name: excalidash-c4-context
description: Use when you need a C4 Level 1 system-context view showing one central system, its users/actors, and the external systems it talks to, with a legend.
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__apply_architecture_skill
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

# C4 Context (Level 1)

## Objective
Produce a C4 System Context diagram: ONE software system at the center, surrounded by the
people/actors who use it and the external systems it integrates with. The only relationships
shown are between the central system and its neighbors — no internal containers, no
components, no code. The result must read at a glance, carry a legend that distinguishes
person / central system / external system, and score >= 95 with zero hard blockers.

## When to use / When NOT to use
**Use when**: the request is "the big picture", "who uses it and what it talks to", a
Level 1 / system-context view, onboarding overview, or a stakeholder map for one system.
**Use when**: the audience is non-technical and needs scope/actors/integrations, not internals.

**Do NOT use when**:
- The request is about the system's *internal* containers (web app, API, DB) -> use the
  C4 Container skill (Level 2).
- The request drills into one container's classes/modules -> use the C4 Component skill (Level 3).
- The request is time-ordered messages -> use a sequence diagram.
- More than one "central" system is in scope -> draw one context diagram per system, or
  step up to a landscape view; do not cram two centers into one canvas.

## Expected input
A short description naming exactly one system in scope, plus:
- **Actors** — human roles/users that interact with the system (e.g. "Customer", "Admin").
- **External systems** — third parties/internal-but-out-of-scope systems it depends on
  (e.g. "Stripe", "Email Service", "Mainframe", "Identity Provider").
- **Relationships** — one short phrase per edge ("makes payments using", "sends emails via",
  "authenticates against"), each anchored to the central system.
If actors or external systems are missing, infer the obvious ones and state the assumption.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, scoring rubric.
2. `mcp__excalidash__list_templates` — look for a `c4-context` template (optional).
3. `mcp__excalidash__search_libraries` -> `inspect_library` -> `cache_library` — vet
   person, system, and vendor-logo icons from the curated packs.
4. ONE create path:
   - `mcp__excalidash__apply_architecture_skill` with `pattern: "c4"` (convey the *context*
     level via `title` and the actors/external-systems structure you pass downstream), OR
   - `mcp__excalidash__create_diagram_from_prompt` with `diagramType: "c4"` and a context
     `structure` ({ nodes, edges }), OR
   - `mcp__excalidash__create_from_template` with the `c4-context` template.
5. `mcp__excalidash__add_library_items_normalized` — place actor/system/logo icons into slots.
6. `mcp__excalidash__lint_drawing` -> `score_drawing` -> `repair_drawing` (loop).
7. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
8. `mcp__excalidash__validate_architecture` — confirm context-level correctness.
9. `mcp__excalidash__save_drawing` -> `save_version` -> `get_drawing_url` -> `export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=c4 LEVEL=context PRESET=architecture LIBRARY=curated[C4 Architecture, Stick Figures, Software Logos]
   VALIDATORS=lint,score,repair,validate_architecture`. Confirm exactly one central system.
   Redact any secret in the input (see below) BEFORE it reaches a tool argument.
2. **Generate (one path only).** Prefer `apply_architecture_skill({ pattern: "c4",
   title: "<System> — System Context" })` so the central-system / actors-around /
   external-systems-around layout and the legend come from the C4 skeleton; the *context*
   (Level 1) intent is carried by the title and by keeping the structure to actors + external
   systems only (no containers). Fall back to `create_diagram_from_prompt({ diagramType: "c4",
   structure: { nodes, edges } })` with an explicit context structure, or
   `create_from_template({ templateId: "c4-context" })`. Capture the `drawingId`.
   Layout intent: central system mid-canvas; actors arranged top/left; external systems
   right/bottom; one labeled relationship line per neighbor; legend in a corner.
3. **Place icons.** `add_library_items_normalized` — person icon in the `actor` slot for each
   human, the C4 system glyph as `inside-card-top` for the central system, vendor logos as
   `inside-card-left`/`badge` for external systems that have a recognizable brand. Keep
   external-system styling visually distinct (lighter fill) from the central system.
4. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty.
5. **Score.** `score_drawing`; record the number and every penalty.
6. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint and
   re-score. Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a repair
   pass lowers the score, restore the last `save_version` checkpoint and apply a smaller fix.
7. **Polish.** Only after blockers clear, run `auto_polish_drawing`; re-score to confirm no
   regression (rollback if it drops below the checkpoint).
8. **Validate.** `validate_architecture` — every relationship must touch the central system;
   no actor or external system is orphaned; no internal containers leaked into the view.
9. **Save.** `save_drawing` with a clear title (`"<System> — System Context"`), then
   `save_version` to checkpoint the accepted state.
10. **Export.** `get_drawing_url` for a link, then `export_drawing` (svg/png/json); re-scan
    the export for secrets as a backstop.

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only; draw the central rectangle, actor stick figures with primitives,
  external-system rectangles; no icon calls.
- **curated** (default) — pull only from **C4 Architecture** (person, system, external-system
  glyphs), **Stick Figures** (actor figures), and **Software Logos** (recognizable external
  vendors like Stripe, Auth0, SendGrid).
- **required** — every human MUST use a person/stick-figure icon and every branded external
  system MUST use its logo; a primitive where a curated icon exists is a violation.

Workflow: `search_libraries` -> `inspect_library` (aspect, stroke, fill, complexity) ->
`cache_library` -> `add_library_items_normalized`. Icon slots: `actor` for people (48x48),
`inside-card-top` for the central system glyph, `inside-card-left`/`badge` for external-system
logos, `legend` for the keyed swatches (person / system / external system). Normalize scale,
preserve aspect, match the architecture preset's stroke and fill. **Reject any icon that
introduces HIGH_DENSITY, collides with a relationship line, or clashes with the preset** —
drop it and use a primitive. Record used and rejected items.

## Validation & score
- `hardBlockers` must be empty: no `ARROW_TEXT_INTERSECTION` (relationship labels never sit
  under a line), no `FRAME_TITLE_OVERLAP` (legend/title band stays title-only), no
  `ITEM_OUTSIDE_FRAME`.
- No arrow over text: each relationship label rides beside its line in a clear gutter.
- Titles/headers not overlapping: the diagram title and the legend header do not collide
  with any node or with each other.
- Viewport fit: all content kept >= 40px from canvas/export bounds (no `TEXT_NEAR_EDGE`).
- `validate_architecture` clean: single central system, every edge anchored to it, no
  orphans, no internal-detail leakage.
- **Minimum score 95.** Repair is mandatory below 95 or with any blocker; rollback any pass
  that lowers the score.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. Context diagrams often name integrations
(payment, auth, email) whose descriptions may carry credentials. Redact BEFORE any tool call
and re-scan the export: JWT/API keys/service-role/db URLs/tokens/bearer/webhook/proxy secrets
become typed placeholders, e.g. `[REDACTED_API_KEY]`, `[REDACTED_DATABASE_URL]`,
`[REDACTED_WEBHOOK_SECRET]`. Show the *concept* of a credential (label an edge "authenticates
via OAuth", not the token). Never echo a detected secret back to the user.

## Internal prompts
- **Context structure prompt**: `"C4 System Context for <SYSTEM>. Center: <SYSTEM> (software
  system). Actors: <A1>, <A2>. External systems: <E1>, <E2>, <E3>. Relationships (each from
  <SYSTEM>): <A1> uses <SYSTEM>; <SYSTEM> 'makes payments using' <E1>; <SYSTEM> 'sends email
  via' <E2>; <SYSTEM> 'authenticates against' <E3>. Add a legend: person / system / external
  system. No containers, no components."`
- **Skill invocation**: `apply_architecture_skill({ pattern: "c4", preset: "architecture",
  title: "<System> — System Context", save: true, name: "<System> — System Context" })`.
  The C4 *context* level is conveyed by the title; pass the actors/external-systems/relationships
  detail through the create-from-prompt fallback when you need explicit nodes and edges.
- **Repair nudge**: `"ARROW_TEXT_INTERSECTION on the '<rel>' edge -> move the label into the
  side gutter and add 32px arrow-lane clearance; keep the central system fixed."`

## Example prompts for Claude Code
These user prompts should trigger this skill:
- "Give me a C4 system-context diagram for our Internet Banking System and who it talks to."
- "Draw the big picture for ShopFront: who uses it and which external systems it depends on."
- "Show the scope of the HR Portal — its users and the third-party services it integrates with."
- "I need a Level 1 / system-context view of the checkout platform for a stakeholder deck."
- "Map the actors and external integrations around our notifications service (no internals)."

## Acceptance criteria
- [ ] Exactly one central system; actors and external systems arranged around it.
- [ ] Every relationship line is anchored to the central system and labeled.
- [ ] Legend distinguishes person / system / external system.
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`).
- [ ] Title and legend header do not overlap each other or any node.
- [ ] Libraries used per policy when relevant (person/stick-figure + vendor logos, normalized).
- [ ] `validate_architecture` clean: no orphans, no internal-detail leakage.
- [ ] No secrets leaked in drawing, response, or export.

## Examples
See `./references/examples.md` for full request -> plan -> ordered tool calls with realistic
arguments, plus `./references/checklist.md` and `./references/anti-patterns.md`. Shared rules
live in `../_shared/references/library-policy.md`, `../_shared/references/security-redaction.md`,
`../_shared/references/geometry-rules.md`, and `../_shared/references/architecture-patterns.md`.
