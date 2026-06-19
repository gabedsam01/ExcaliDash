# UI Wireframes (skill)

## Objective
Build low-fidelity, consistent UI wireframes (dashboards, screens, page layouts) that
communicate structure and flow without visual styling noise. Output is a clean,
gray-scale wireframe that scores >= 95 before it is saved as final.

## When to use
- The request asks for a wireframe, mockup, dashboard, screen, or page layout.
- The user wants to plan information architecture, navigation, or component placement.
- Fidelity should stay LOW: boxes, placeholder text, and labels — not real branding,
  colors, or pixel-accurate UI.
- Skip this skill for system/architecture diagrams or flowcharts (use the architecture
  or diagram skills instead).

## Expected input
- A target surface: e.g. "admin dashboard", "mobile signup screen", "settings page".
- Optional: platform (web / mobile / tablet), key sections or components, and rough
  layout intent (sidebar + main, top nav, card grid, list/detail).
- If the input is vague, assume a standard layout for the named surface and proceed;
  do not block on missing detail.

## Visual rules
- Use the `minimal-whiteboard` preset (fallback: `handdrawn-clean`) for true low fidelity.
- Grayscale only: strokes #1e1e1e / #495057, fills #f8f9fa / #e9ecef / transparent.
  No brand colors, gradients, or images.
- Represent content as placeholders: rectangles for blocks, "Lorem"-style text for copy,
  X-crossed boxes or simple icons for media.
- Align to an implicit 8px-ish grid; keep consistent gutters and equal-width columns.
- Group related elements with frames/containers; label each region (e.g. "Sidebar",
  "Header", "Main content", "Card").
- Keep typography to 2 sizes max (heading vs. body); avoid decorative styling.

## Logic rules
- Establish layout regions first (nav, header, content, footer), then fill components.
- Reflect real navigation order top-to-bottom, left-to-right; primary action top-right
  or bottom-right per platform convention.
- Reuse identical components (cards, list rows) at identical size for consistency.
- One screen = one frame; for multi-screen flows, place frames in a row and connect with
  light arrows showing the user path.
- Annotate non-obvious interactions with small note text, not with high-fidelity detail.

## Recommended libraries
Search and cache these curated packs before adding items:
- **Lo-Fi Wireframing Kit** — primary: placeholder blocks, nav bars, form fields, buttons.
- **Web Kit** — desktop/web chrome: browser frame, sidebars, data tables, modals.
- **Mobile Kit** — phone frame, tab bars, mobile form controls, app shells.

Workflow: `search_libraries` -> `inspect_library` -> `cache_library` ->
`add_library_items_normalized` (normalized keeps wireframe sizing/colors consistent).

## Mandatory validation
Quality flow is REQUIRED and runs in this exact order before any final save:
1. `lint_drawing` — fix structural / overlap / alignment issues it reports.
2. `score_drawing` — must return **>= 95**. If below, do not save as final.
3. `repair_drawing` for targeted fixes, then `auto_polish_drawing` to converge.
4. Re-run `score_drawing` until it is **>= 95**.
5. Only then `save_drawing` as final. Saving below 95 is allowed ONLY with `asDraft: true`.
`auto_polish_drawing` MUST be run before the final save even if a prior score was close.

## Minimal examples
Generate, then add wireframe components from the curated kit:

```json
{
  "tool": "create_diagram_from_prompt",
  "arguments": {
    "prompt": "Low-fidelity wireframe of an analytics admin dashboard: left sidebar nav, top header with search and avatar, 4 KPI cards row, a wide line-chart panel, and a data table below",
    "preset": "minimal-whiteboard",
    "type": "wireframe"
  }
}
```

```json
{
  "tool": "add_library_items_normalized",
  "arguments": {
    "library": "Lo-Fi Wireframing Kit",
    "items": ["nav-sidebar", "kpi-card", "data-table", "search-field"],
    "normalize": true
  }
}
```

Validate and save (only after score >= 95):

```json
{ "tool": "score_drawing", "arguments": {} }
```

```json
{ "tool": "auto_polish_drawing", "arguments": { "targetScore": 95 } }
```

```json
{ "tool": "save_drawing", "arguments": { "name": "admin-dashboard-wireframe" } }
```
