# Portfolio Diagrams (skill)

## Objective
Produce polished, presentation-grade architecture visuals suitable for portfolios,
pitch decks, and marketing. Diagrams must look intentional and brand-consistent:
strong alignment, generous spacing, real product logos, and zero visual clutter.
Target a final `score_drawing` of 95 or higher before persisting.

## When to use
- The user asks for a diagram for a portfolio, slide deck, landing page, or
  marketing/sales collateral.
- The audience is non-engineering or external (executives, customers, recruiters).
- Aesthetic quality and logo fidelity matter more than exhaustive technical detail.
Do NOT use for internal engineering specs (prefer `technical-docs`) or quick
ideation sketches (prefer `minimal-whiteboard` / `handdrawn-clean`).

## Expected input
- A prompt or topic describing the system/product to visualize.
- Optional: target medium (deck slide, hero image, README banner) and aspect ratio.
- Optional: brand palette / accent color and a list of named technologies to feature.
- Optional: an existing diagram id to convert or re-style via `convert_diagram_type`.
If the technology list is missing, infer it from the prompt and confirm via logos
found in `search_libraries`.

## Visual rules
- Apply the `portfolio-polished` preset on generation; fall back to `startup-deck`
  or `dark-architecture` only if the user requests a specific look.
- Use a single accent color plus neutrals; avoid more than 3 hues total.
- Keep one consistent layout grid; align edges and distribute spacing evenly.
- Prefer real vendor logos (see Recommended libraries) over generic boxes.
- Limit text: short labels, no paragraphs. One clear title, optional subtitle.
- Maintain whitespace margins around the canvas; never crowd the frame edges.
- Ensure logo sizes are uniform and edges are orthogonal (no crossing arrows).

## Logic rules
- Group components into clear tiers (client / service / data / external).
- Every node must connect to at least one other node; remove orphans.
- Arrows show real data/control flow with a consistent direction convention.
- Use `apply_architecture_skill` to enforce tiering before styling.
- When converting from a technical diagram, simplify: collapse low-level detail
  into representative blocks suited to a non-technical audience.

## Recommended libraries
Prefer these curated packs for crisp, recognizable visuals:
- **Technology Logos**
- **Software Logos**
Workflow: `search_libraries` -> `inspect_library` -> `cache_library` ->
`add_library_items_normalized` (normalized placement keeps sizing/alignment
consistent with the grid). Use `add_library_items` only when normalization is
not required.

## Mandatory validation
Validation is REQUIRED before any final save. Run in order:
1. `lint_drawing` — fix all reported structural/style issues.
2. `score_drawing` — read the 0-100 score.
3. If score < 95: run `auto_polish_drawing` (preferred for portfolio output), then
   `repair_drawing` for any remaining specific defects.
4. Re-run `score_drawing` and loop until score >= 95.
You MUST call `auto_polish_drawing` and confirm `score_drawing` >= 95 before
`save_drawing` as final. Saving below 95 is only allowed with `asDraft: true`.
After a passing save, call `save_version` and return the URL via `get_drawing_url`.

## Minimal examples
Generate, polish, validate, then save a portfolio diagram:

```json
{
  "tool": "create_diagram_from_prompt",
  "arguments": {
    "prompt": "SaaS analytics platform: web client, API gateway, processing service, Postgres, and Stripe integration",
    "preset": "portfolio-polished",
    "libraries": ["Technology Logos", "Software Logos"]
  }
}
```

```json
{
  "tool": "auto_polish_drawing",
  "arguments": { "drawingId": "drw_123", "preset": "portfolio-polished" }
}
```

```json
{
  "tool": "score_drawing",
  "arguments": { "drawingId": "drw_123" }
}
```

Only after `score_drawing` returns `>= 95`:

```json
{
  "tool": "save_drawing",
  "arguments": { "drawingId": "drw_123", "asDraft": false }
}
```
