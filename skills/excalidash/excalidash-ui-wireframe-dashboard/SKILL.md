---
name: excalidash-ui-wireframe-dashboard
description: Use when you need a low-fidelity UI wireframe for a dashboard or app — nav, panels, tables, forms and KPIs laid out on a grid, with explicit empty/loading/error/success states and separate desktop and mobile frames.
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__list_templates
  - mcp__excalidash__create_from_template
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

# UI Wireframe / Dashboard

## Objective
Produce a low-fidelity UI wireframe for a dashboard or app screen: a top nav / header, a side
nav (where present), and a content area built from panels — KPI tiles, data tables, list panels,
charts, and forms — laid out on a consistent grid with even gutters. The wireframe makes the
information architecture and interaction states explicit: for any panel that loads data, draw its
**empty / loading / error / success** variants instead of one happy-path screenshot. Desktop and
mobile are drawn as **separate frames** (never one responsive blob), so the column count, nav
collapse and stacking order read clearly at each breakpoint. UI-kit items sit inside reserved
panel slots; no label overlaps another and no control escapes its card. The result must score
>= 95 with zero hard blockers.

## When to use / When NOT to use
**Use when**: the request is "wireframe this dashboard / admin / settings / analytics screen",
"sketch the app layout before we design it", "show the panels and their loading and error
states", "lay out the KPI tiles and the data table", "what does this look like on mobile vs
desktop", or any low-fidelity structural layout of a screen prior to visual design.

**Do NOT use when**:
- The request is a high-fidelity, on-brand, pixel-accurate mock with real type and color ->
  this skill is deliberately **low-fidelity**; raise the brief or hand off to a design tool.
- The request is a **user-journey / task flow** between screens (screen A -> action -> screen B)
  rather than the layout of one screen -> use a flow skill (Flow Chart Symbols + Data Flow), and
  reference wireframes only as nodes.
- The request is a **system / service architecture** (apps, APIs, datastores) -> use the matching
  architecture skill (see `../_shared/references/mcp-tool-cheatsheet.md`); do not draw boxes-and-DBs
  here.
- The request is a **state machine** for a single component's transitions -> draw a state diagram,
  not a screen wireframe (this skill draws each state as a panel variant, not transition arrows).

## Expected input
A short description of the screen(s) to wireframe, ideally naming:
- **Screen / surface** — e.g. "Analytics dashboard", "Orders admin", "Account settings".
- **Regions** — top nav / header, side nav, content area; any global elements (search, user menu).
- **Panels** — KPI tiles, data table (with columns), list, chart, form (with fields), filter bar.
- **Data-bearing panels** — which panels fetch data and therefore need empty/loading/error/success.
- **Breakpoints** — desktop and mobile are the default pair; name extras (tablet) only if asked.
- **Primary action** — the one thing the user should do first (drives emphasis, not color noise).
If states or breakpoints are unspecified, default to drawing empty/loading/error/success for every
data-bearing panel and a desktop + mobile frame pair, and state the assumption.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, the scoring rubric.
2. `mcp__excalidash__list_templates` — look for a `wireframe` / `dashboard` template (optional).
3. `mcp__excalidash__search_libraries` -> `inspect_library` -> `cache_library` — vet nav, button,
   input, table, card, chart-placeholder and mobile-frame items from the curated UI packs.
4. ONE create path:
   - `mcp__excalidash__create_from_template` with a wireframe/dashboard `templateId` (preferred
     when a reusable layout exists), OR
   - `mcp__excalidash__create_diagram_from_prompt` with a `wireframe` diagram and an explicit
     panel-grid `structure`.
5. `mcp__excalidash__add_library_items_normalized` — place UI-kit items (nav, controls, table
   rows, chart placeholders) into reserved panel slots.
6. `mcp__excalidash__lint_drawing` -> `score_drawing` -> `repair_drawing` (loop).
7. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
8. `mcp__excalidash__save_drawing` -> `save_version` -> `get_drawing_url` -> `export_drawing`.

There is no `validate_architecture` step here — this is a UI layout, not an architecture; layout
correctness is enforced entirely through lint -> score -> repair against the geometry rules.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=wireframe PRESET=minimal-whiteboard FRAMES=[Desktop, Mobile] STATES=[empty, loading, error, success]
   LIBRARY=curated[Lo-Fi Wireframing Kit, Web Kit, Mobile Kit] VALIDATORS=lint,score,repair`.
   List the regions (top nav, side nav, content), the panels in the content grid, and which panels
   are data-bearing (those get the four state variants). Decide the desktop column count (e.g. 12)
   and the mobile stacking order. Redact any secret in the input (see below) BEFORE it reaches a
   tool argument — sample data in a table cell is a common leak.
2. **Generate (one path only).**
   - `create_from_template({ templateId: "wireframe-dashboard", preset: "minimal-whiteboard" })`
     when a reusable grid exists, OR
   - `create_diagram_from_prompt({ diagramType: "wireframe", preset: "minimal-whiteboard",
     structure: { nodes, edges } })` with an explicit panel grid. Model each frame, region and
     panel (and each state variant) as a node; keep `edges` minimal (a wireframe is layout, not
     flow). Capture the returned drawing id.
   - Layout intent: **one frame per breakpoint**. Inside each frame, a title band, then the top
     nav, then (desktop) a side-nav column + a content grid of panels with even >= 48px gutters.
     Reserve the four state variants of a data panel as a labeled row/cluster ("Table — empty /
     loading / error / success"). Mobile stacks panels in a single column and collapses the nav.
3. **Place icons.** `add_library_items_normalized` — drop UI-kit components into reserved panel
   slots: nav bar + menu items in the header band, search/input fields in `inside-card-top`,
   button glyphs as `badge`, table-row placeholders and chart placeholders inside their panels,
   the device chrome on the mobile frame. Normalize scale and stroke to the wireframe preset.
   Reject any item that introduces `HIGH_DENSITY` or lands in an arrow/label lane.
4. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty.
5. **Score.** `score_drawing`; record the number and every penalty.
6. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint and
   re-score. Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a repair pass
   lowers the score, restore the last `save_version` checkpoint and apply a smaller, targeted fix.
7. **Polish.** Only after blockers clear, run `auto_polish_drawing`; re-score to confirm no
   regression (rollback if it drops below the checkpoint).
8. **Validate (layout).** No `validate_architecture` for a wireframe; instead confirm by hand:
   every data-bearing panel has all four state variants, desktop and mobile are separate frames,
   no control escapes its panel, and the primary action is the visual focal point.
9. **Save.** `save_drawing` with a clear title (`"<Screen> — Wireframe (Desktop + Mobile)"`),
   then `save_version` to checkpoint the accepted state.
10. **Export.** `get_drawing_url` for a link, then `export_drawing` (svg / png / excalidraw);
    re-scan the export for secrets (sample table data, real names/emails in placeholder rows).

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only; draw the frames, nav bars, panels, table rows, inputs, buttons and
  chart placeholders by hand with rectangles and short labels; no icon calls.
- **curated** (default) — pull only from **Lo-Fi Wireframing Kit** (nav, buttons, inputs, panels,
  toggles, breadcrumbs, greeked copy blocks), **Web Kit** (desktop chrome, headers, tables,
  cards, modals) and **Mobile Kit** (device frame, status bar, tab bar, mobile nav, bottom sheet).
- **required** — every nav, control, table and device frame MUST use a kit item where one exists;
  a hand-drawn rectangle where a kit control exists is a violation.

Workflow: `search_libraries({ q, mode, category })` -> `inspect_library({ libraryId, autoCache })`
-> `cache_library` -> `add_library_items_normalized({ libraryId, itemNames|indexes, position,
slotSize, targetCardId, placement, save })`. Slots: `inside-card-top` for inputs/search,
`badge` for buttons/status chips, `legend` for the state key (empty / loading / error / success),
table-row and chart placeholders inside their panels, device chrome on the mobile frame.
Normalize scale, preserve aspect, match the wireframe preset's light stroke and transparent fill.
**Reject any kit item that introduces `HIGH_DENSITY`, collides with a label lane, or pushes a
control over panel text** — drop it and use a primitive. Record used and rejected items.

## Validation & score
- `hardBlockers` must be empty:
  - **ARROW_TEXT_INTERSECTION** — any connector (e.g. a "tap" annotation arrow between states)
    never sits under a label; route it through a gutter.
  - **FRAME_TITLE_OVERLAP** — the Desktop / Mobile frame titles and the per-panel headers stay
    title-only; no nav bar or KPI tile rides into a title band.
  - **ITEM_OUTSIDE_FRAME** — every panel, control and state variant sits fully inside its
    breakpoint frame; nothing is half-clipped by the frame edge.
- **SMALL_FONT** — panel labels, table headers and field labels stay >= 16px (headings >= 20px);
  do not shrink to cram more rows — drop rows or widen the panel instead.
- **HIGH_DENSITY** — keep >= 48px between panels and >= 64px between the Desktop and Mobile
  frames; a crowded grid reads as a mock, not a wireframe, and piles on penalties.
- **TEXT_NEAR_EDGE** — keep all content >= 40px from canvas / export bounds.
- **Minimum score 95** with **empty hardBlockers** before saving as final. Repair is mandatory
  below 95 or with any blocker; rollback any pass that lowers the score.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. Wireframes leak through **sample data**:
placeholder table rows, form field values, user menus and KPI numbers. Redact BEFORE any tool
call and re-scan the export. Use obvious fake placeholders for sample rows (`Ada L.`,
`user@example.com`, `$1,234`) and never a real person's data. For any token, key or URL that
sneaks into a field, use a typed placeholder: `Authorization: Bearer [REDACTED_API_KEY]`,
`apiKey=[REDACTED_API_KEY]`, `postgres://app:[REDACTED_DATABASE_URL]@db/main`,
`[REDACTED_JWT]`, `[REDACTED_SERVICE_ROLE]`, `[REDACTED_WEBHOOK_SECRET]`. Show the *concept* of a
field (a masked password input, an "API key" row) not a live value. Never echo a detected secret
back to the user.

## Internal prompts
- **Plan prompt**: `"Plan a low-fi wireframe for <SCREEN>. List regions (top nav, side nav,
  content), the panels in the content grid (KPI tiles, table with columns, chart, form with
  fields), and mark which panels are data-bearing. For every data-bearing panel, enumerate its
  empty / loading / error / success variant. Give the desktop column count and the mobile stacking
  order. Output one frame per breakpoint."`
- **Structure prompt**: `create_diagram_from_prompt({ diagramType: "wireframe",
  preset: "minimal-whiteboard", structure: { nodes: [ Desktop frame, Top nav, Side nav,
  KPI row, Table panel (empty|loading|error|success), Mobile frame, ... ], edges: [] } })`.
- **Repair nudge**: `"ARROW_TEXT_INTERSECTION on the state-annotation arrow -> route it through
  the row gutter and move its label into the side lane with 32px clearance; keep the panels
  fixed."`
- **Redaction prompt**: `"Scan every table cell, form field and KPI tile for real data; replace
  with obvious fake placeholders and turn any token/URL into a typed [REDACTED_<TYPE>] value
  before saving or exporting."`

## Example prompts for Claude Code
- "Wireframe our analytics dashboard: top nav, side nav, a row of KPI tiles, a revenue chart and
  an orders table — show the table's empty, loading, error and success states, desktop and mobile."
- "Sketch the low-fi layout for the account settings screen with a profile form and a billing
  panel, including the form's error and success states."
- "Lay out the admin orders screen as a wireframe — filter bar, data table, detail drawer — and
  show what it looks like on mobile."
- "Make a wireframe of the onboarding dashboard with an empty state for new users and a populated
  success state once they connect a data source."
- "Wireframe the reporting page: KPIs up top, a chart, a table below; separate desktop and mobile
  frames; mark the primary 'Export report' action."

## Acceptance criteria
- [ ] One frame per breakpoint: Desktop and Mobile are separate frames (>= 64px apart).
- [ ] Regions are clear: top nav, side nav (desktop), content grid on a consistent column grid.
- [ ] Every data-bearing panel shows all four states: empty, loading, error, success.
- [ ] Panels align on the grid with even >= 48px gutters; no panel hugs the frame edge.
- [ ] UI-kit items sit inside panel slots; no control escapes its card; no label overlaps another.
- [ ] The primary action is the single visual focal point (emphasis by size/placement, not noise).
- [ ] A legend keys the four states (empty / loading / error / success).
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`); no `FRAME_TITLE_OVERLAP`;
      no `ITEM_OUTSIDE_FRAME`.
- [ ] All text >= 16px (headings >= 20px); no `SMALL_FONT`; content >= 40px from bounds.
- [ ] Libraries used per policy when relevant (kit nav/controls/table/device frame; normalized).
- [ ] No secret leaked in drawing, response, or export (sample data and any token/URL redacted).

## Examples
See `./references/examples.md` for full request -> plan -> ordered tool calls with realistic
arguments, plus `./references/checklist.md` and `./references/anti-patterns.md`. Shared rules live
in `../_shared/references/visual-system.md`, `../_shared/references/geometry-rules.md`,
`../_shared/references/library-policy.md`, and `../_shared/references/security-redaction.md`.
