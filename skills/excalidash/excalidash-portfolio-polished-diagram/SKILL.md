---
name: excalidash-portfolio-polished-diagram
description: Use when you need a presentation/portfolio-grade architecture or product visual for a deck, case study or landing page — balanced composition, title band, legend, consistent iconography, the portfolio-polished preset, polished to score >= 95 and exported as PNG/SVG.
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__create_diagram_from_prompt
  - mcp__excalidash__create_from_repo_analysis
  - mcp__excalidash__convert_diagram_type
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

# Portfolio Polished Diagram

## Objective
Produce a presentation/portfolio-grade visual — an architecture overview or a product diagram
shaped for a deck slide, a case study, a README hero, or a landing page. The output is a balanced
composition under the **portfolio-polished** preset: a title band at the top, a restrained 3-hue
palette, generous and uniform spacing, consistent iconography (vendor/tech logos sitting in card
slots, never floating), and a legend that explains the visual language. This skill optimizes for
*audience-facing polish*, not exhaustive technical detail — clarity and balance over completeness.
The result must score >= 95 with zero hard blockers, and must export cleanly to PNG and SVG.

## When to use / When NOT to use
**Use when**: the request is "make this look presentation-ready", "a polished diagram for my
portfolio/case study", "a slide-quality architecture visual", "a hero image for the README",
"clean this up for a pitch deck", "give it a title, a legend and logos", or "export a PNG/SVG I can
drop into a slide". Use when an existing rough diagram needs to be re-skinned to the
portfolio-polished preset with consistent logos and a legend.

**Do NOT use when**:
- The audience is engineers who need a *correct* layered architecture with validated dependencies
  -> use the **C4 Container** / **C4 Context** / **Clean Architecture** skills, then optionally
  re-skin the result here. This skill polishes composition; it does not validate layer rules.
- The deliverable is a step-by-step process or incident path -> use a **flow / swimlane** skill;
  a polished deck visual is not a flowchart.
- The deliverable is a UI mockup -> use the **UI wireframe** skill (Lo-Fi / Web / Mobile kits).
- The content is a security/trust-boundary diagram -> use the **security** skill, which enforces
  redaction and boundary drawing beyond the baseline here.
When the substance belongs to a sibling skill, build it there first, then convert and re-skin to
portfolio-polished as a finishing pass (see Workflow step 2, convert path).

## Expected input
A short description of the system or product to visualize, plus whatever of the following exists:
- **Subject** — the system/product name and a one-line value statement for the title band.
- **Nodes / zones** — the 5-12 boxes the audience should see (more than ~12 reads as noise on a
  slide; split into multiple views instead). Each may carry a vendor/tech it represents
  (React, Postgres, AWS, Stripe) so a logo can be slotted in.
- **Edges** — the few relationships worth showing, each a short readable label (no protocol soup).
- **Brand palette** — up to 3 hues + neutrals; if absent, use the preset's restrained default.
- **Repository analysis** — when re-skinning a real codebase, a `{ modules, entrypoints, database,
  services, integrations }` object for `create_from_repo_analysis`.
Secrets must be pre-redacted before they reach any tool argument (see Secrets & redaction).

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, the scoring rubric.
2. `mcp__excalidash__search_libraries` -> `inspect_library` -> `cache_library` — vet logos from the
   curated packs (Technology Logos, Software Logos, Software Architecture).
3. ONE create path:
   - `mcp__excalidash__create_diagram_from_prompt` with `preset: "portfolio-polished"` and a
     `structure` of nodes/edges (the default path), OR
   - `mcp__excalidash__create_from_repo_analysis` with `preset: "portfolio-polished"` when
     re-skinning a real repo, OR
   - `mcp__excalidash__convert_diagram_type` to re-skin an existing diagram into the target type
     with `preset: "portfolio-polished"`.
4. `mcp__excalidash__add_library_items_normalized` — place vendor/tech logos in reserved card slots
   and legend swatches.
5. `mcp__excalidash__lint_drawing` -> `score_drawing` -> `repair_drawing` (loop).
6. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
7. `mcp__excalidash__save_drawing` -> `save_version` -> `get_drawing_url`.
8. `mcp__excalidash__export_drawing` — PNG (primary) and SVG (vector); re-scan the export.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `PRESET=portfolio-polished SUBJECT=<name> NODES=<5-12> EDGES=<few> PALETTE=<=3 hues
   LIBRARY=curated[Technology Logos, Software Logos, Software Architecture]
   VALIDATORS=lint,score,repair`. Decide the composition up front: a **title band** spanning the
   top, the diagram body centered with uniform gutters, and a **legend block** in a bottom or side
   corner. Redact any secret in the input BEFORE it reaches a tool argument.
2. **Generate (one path only).**
   - Default: `create_diagram_from_prompt({ preset: "portfolio-polished", title: "<Subject>",
     direction: "LR" | "TB", structure: { nodes, edges }, autoPolish: false, save: false })` so
     you control the polish loop yourself.
   - Re-skin a real repo: `create_from_repo_analysis({ analysis, preset: "portfolio-polished",
     autoPolish: false, save: false })`.
   - Re-skin an existing rough diagram: `convert_diagram_type({ structure, targetType,
     preset: "portfolio-polished", autoPolish: false, save: false })`.
   Capture the returned drawing id. Aim for a balanced grid: equal column/row gutters, the visual
   center of mass on the canvas center, the title band 40px clear of the first row.
3. **Place icons.** `add_library_items_normalized` — one logo per node that represents a vendor or
   technology, in an `inside-card-left` / `inside-card-top` slot, plus keyed swatches in the
   `legend` slot. Normalize scale and preserve aspect; recolor strokes to the palette, not the
   source art. Keep iconography consistent — either every node gets a logo or none do; a half-iconed
   diagram looks unfinished.
4. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty.
5. **Score.** `score_drawing`; record the number and every penalty.
6. **Repair (MANDATORY).** For each blocker/penalty call `repair_drawing`, then re-lint and
   re-score. Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a repair pass
   lowers the score, restore the last `save_version` checkpoint and apply a smaller, targeted fix.
7. **Polish.** Only after blockers clear, run `auto_polish_drawing({ minimumScore: 95,
   maxAttempts: 3, allowDraft: false })`; re-score to confirm no regression (rollback if it drops
   below the checkpoint). Never ship a draft for a portfolio deliverable.
8. **Validate (composition).** Confirm the composition reads as a finished slide: title band
   present and balanced, legend present and keyed, logos consistent and slotted, palette capped at
   3 hues + neutrals, the whole diagram centered with margin. (This is a visual skill; for
   architecture-correctness validation use a sibling architecture skill first.)
9. **Save.** `save_drawing` with a clear title (`"<Subject> — Overview"`), then `save_version` to
   checkpoint the accepted state.
10. **Export.** `get_drawing_url` for a link, then `export_drawing({ format: "png" })` and
    `export_drawing({ format: "svg" })`; re-scan both exports for secrets as a backstop.

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — no library calls; render node labels as text and skip logos. The title band, legend
  swatches and cards are drawn with primitives in the portfolio-polished preset.
- **curated** (default) — pull only from the curated packs **Technology Logos** (vendors,
  protocols, platforms), **Software Logos** (frameworks, languages, tools), and **Software
  Architecture** (services, gateways, queues, layers). Cloud/DevOps logos are acceptable for infra
  nodes when they keep the palette consistent.
- **required** — every node that represents a branded vendor/technology MUST carry its logo, and
  the legend MUST key the icon set; a primitive where a curated logo exists is a violation.

Workflow: `search_libraries({ q, mode: "curated" })` -> `inspect_library({ libraryId })` (aspect,
stroke, fill, complexity) -> `cache_library` -> `add_library_items_normalized`. Icon slots:
`inside-card-left` / `inside-card-top` for node logos (32x32, 16px padding), `badge` for a small
type/status marker, `legend` for the keyed swatches. Normalize scale, preserve aspect, match the
portfolio-polished stroke and fill, recolor to the palette. **Reject any logo that introduces
`HIGH_DENSITY`, collides with an arrow lane, breaks palette consistency, or clashes with the
preset** — drop it and fall back to a clean primitive. Record used and rejected items.

## Validation & score
- `hardBlockers` must be empty:
  - `ARROW_TEXT_INTERSECTION` — no connecting line crosses any node label or legend text; arrows
    exit card sides and travel in >= 32px gutters.
  - `FRAME_TITLE_OVERLAP` — the title band and any frame title stay title-only; the first row of
    content starts below the reserved 40px band.
  - `ITEM_OUTSIDE_FRAME` — every node and every logo sits fully inside its card/frame inner bounds;
    no logo pokes past a card edge.
- Penalties driven to zero:
  - `HIGH_DENSITY` — keep card gaps >= 48px and uniform gutters; a sparse, breathable slide beats a
    crowded one. Split to a second view rather than cram.
  - `SMALL_FONT` — all text >= 16px rendered, headings >= 20px; the title band heading is the
    largest type and sets the hierarchy.
  - `TEXT_NEAR_EDGE` — all content kept >= 40px from canvas/export bounds so nothing looks clipped
    in the exported PNG/SVG.
- **Minimum score 95** with empty `hardBlockers` before saving as final. Repair is mandatory below
  95 or with any blocker; rollback any pass that lowers the score.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. Portfolio visuals are the *most exposed*
artifacts this server produces — they land in public decks, case studies, READMEs and on
landing pages — so redaction matters even though the diagram is high-level. Redact BEFORE any tool
call and re-scan both exports. A datastore label `postgres://app:<password>@db/main` becomes
`postgres://app:[REDACTED_DATABASE_URL]@db/main`; an API-key annotation becomes `[REDACTED_API_KEY]`;
service-role, JWT, bearer, webhook and proxy values become typed placeholders, e.g.
`[REDACTED_SERVICE_ROLE]`, `[REDACTED_JWT_SECRET]`, `[REDACTED_BEARER]`, `[REDACTED_WEBHOOK_SECRET]`.
Show the *concept* (a "secrets vault" node, a key icon) never the value. Never echo a detected
secret back to the user.

## Internal prompts
- **Composition plan**: `"Plan a portfolio-polished overview of <SUBJECT>. List the 5-12 nodes,
  the few edges worth showing, the title-band heading, the legend keys, and which nodes get a
  vendor logo. Cap the palette at 3 hues + neutrals before drawing."`
- **Re-skin nudge**: `"Convert this diagram to targetType <T> under preset portfolio-polished; add
  a title band, a keyed legend, and consistent logos in card slots; do not change the topology."`
- **Repair nudge**: `"ARROW_TEXT_INTERSECTION on the '<edge>' label -> route the line through the
  column gutter and move the label into the side lane with 32px clearance; keep nodes fixed and the
  composition centered."`
- **Polish nudge**: `"Score the drawing; if < 95 or any hard blocker, apply the repair plan and
  re-score; confirm the title band, legend and logos are consistent before saving."`

## Example prompts for Claude Code
- "Make a portfolio-grade architecture diagram of my SaaS for the homepage — title, legend, logos,
  export a PNG."
- "Turn this rough whiteboard sketch into a polished case-study visual with our brand colors."
- "I need a presentation slide showing how our app, API, database and Stripe fit together — clean
  and balanced, with vendor logos."
- "Re-skin the architecture in this repo into a deck-quality diagram and give me an SVG."
- "Polish this diagram to portfolio quality: consistent icons, a strong legend, generous spacing,
  score at least 95."

## Acceptance criteria
- [ ] Preset is `portfolio-polished` throughout; palette capped at 3 hues + neutrals.
- [ ] A title band spans the top with the largest type; the body starts below the reserved band.
- [ ] A legend keys the visual language (node types / icon set / color meaning).
- [ ] Iconography is consistent — logos slotted in cards (`inside-card-left`/`-top`), normalized,
      aspect preserved, never floating or over text.
- [ ] Spacing is generous and uniform (card gaps >= 48px, equal gutters, composition centered).
- [ ] `score_drawing >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (`ARROW_TEXT_INTERSECTION` = 0).
- [ ] No content overlaps the title band or any frame title; nothing within 40px of export bounds.
- [ ] Libraries used per policy when relevant; off-policy/over-detailed icons rejected and recorded.
- [ ] Exports to PNG and SVG succeed; both re-scanned — no secret leaked in drawing, response, or
      export (every secret is `[REDACTED_<TYPE>]`).

## Examples
See `./references/examples.md` for full request -> plan line -> ordered REAL tool calls with
realistic arguments -> quality loop -> save/export, plus `./references/checklist.md` and
`./references/anti-patterns.md`. Shared rules live in `../_shared/references/visual-system.md`,
`../_shared/references/geometry-rules.md`, `../_shared/references/library-policy.md`,
`../_shared/references/security-redaction.md`, and `../_shared/references/mcp-tool-cheatsheet.md`.
