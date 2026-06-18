# UI Wireframe / Dashboard — Operating Checklist

A gate-by-gate checklist for building a low-fidelity dashboard/app wireframe. Do not advance to
the next gate until the current one passes.

## Gate 0 — Read context
- [ ] Called `read_mcp_guide`; know the wireframe preset (`minimal-whiteboard`) and the rubric.
- [ ] Read `MCP_LIBRARY_MODE` (off / curated / required).
- [ ] Scanned the input for secrets and real sample data — table cells, form fields, user menus,
      KPI numbers, and any token/key/URL that might land in a field.

## Gate 1 — Confirm screen scope
- [ ] Named the screen / surface (e.g. "Analytics dashboard", "Orders admin").
- [ ] Listed the regions: top nav / header, side nav (desktop), content area, global elements.
- [ ] Listed the panels in the content grid: KPI tiles, data table (with columns), chart, list,
      form (with fields), filter bar.
- [ ] Marked which panels are **data-bearing** (each needs empty/loading/error/success).
- [ ] Chose the breakpoint pair: Desktop + Mobile (plus any explicitly requested extras).
- [ ] Identified the single **primary action** (drives the one focal point).

## Gate 2 — Plan line (write it before any create call)
- [ ] `TYPE=wireframe`.
- [ ] `PRESET=minimal-whiteboard` (or another low-fi preset if requested).
- [ ] `FRAMES=[Desktop, Mobile]` and `STATES=[empty, loading, error, success]`.
- [ ] `LIBRARY=` off, or curated/required + `Lo-Fi Wireframing Kit, Web Kit, Mobile Kit`.
- [ ] `VALIDATORS=lint,score,repair` (no `validate_architecture` — this is a UI layout).

## Gate 3 — Library decision
- [ ] In `off`: no library calls; frames, nav, panels, table rows, inputs, buttons and chart
      placeholders drawn with primitives.
- [ ] In `curated`/`required`: searched **Lo-Fi Wireframing Kit** (nav, buttons, inputs, panels,
      toggles, breadcrumbs, greeked copy), **Web Kit** (desktop chrome, headers, tables,
      cards, modals), **Mobile Kit** (device frame, status bar, tab bar, bottom sheet).
- [ ] Inspected each candidate (aspect, stroke, fill, complexity); cached keepers.
- [ ] Mapped each item to a slot: `inside-card-top` (inputs/search), `badge` (buttons/chips),
      `legend` (state key), table-row/chart placeholders inside panels, device chrome on mobile.

## Gate 4 — Generate (one path only)
- [ ] Secrets and real sample data redacted in prompt/args BEFORE the call.
- [ ] Called exactly ONE of:
      `create_from_template({ templateId:"wireframe-dashboard", preset:"minimal-whiteboard" })`,
      `create_diagram_from_prompt({ diagramType:"wireframe", preset:"minimal-whiteboard", structure:{nodes,edges} })`.
- [ ] Layout intent: one frame per breakpoint; title band, then top nav, then (desktop) side-nav
      column + content grid with even >= 48px gutters; mobile single-column with collapsed nav.
- [ ] Each data-bearing panel modeled as four labeled state variants.
- [ ] Captured the returned drawing id.

## Gate 5 — Lint -> score -> repair loop
- [ ] `lint_drawing`: `hardBlockers` read and listed.
- [ ] `score_drawing`: numeric score and every penalty recorded.
- [ ] `repair_drawing` called for each blocker/penalty (mandatory if score < 95 or blocker present).
- [ ] Re-linted and re-scored after each repair.
- [ ] **Rollback applied** if a repair pass lowered the score (restored prior version, smaller fix).
- [ ] Loop exited only at `score >= 95` AND `hardBlockers == []`.

## Gate 6 — Polish + layout validation (by hand)
- [ ] `auto_polish_drawing` run after blockers cleared; re-scored (no regression).
- [ ] Desktop and Mobile are separate frames, >= 64px apart.
- [ ] Every data-bearing panel has all four states; the legend keys them.
- [ ] No control or label escapes its panel; nav band sits below the frame title band.
- [ ] The primary action is the single visual focal point.

## Gate 7 — Save + export
- [ ] `save_drawing` with title `"<Screen> — Wireframe (Desktop + Mobile)"`.
- [ ] `save_version` checkpoint of the accepted state.
- [ ] `get_drawing_url` for the shareable link.
- [ ] `export_drawing` produced; export re-scanned for sample data / tokens.

## Hard blockers (must all be ABSENT)
- [ ] ARROW_TEXT_INTERSECTION — no annotation arrow crosses any panel label or control text.
- [ ] FRAME_TITLE_OVERLAP — Desktop/Mobile frame titles and panel headers stay title-only.
- [ ] ITEM_OUTSIDE_FRAME — every panel, control and state variant fully inside its breakpoint frame.

## Penalties (drive toward zero)
- [ ] TEXT_NEAR_EDGE — content kept >= 40px from canvas/export bounds.
- [ ] HIGH_DENSITY — >= 48px between panels, >= 64px between frames; grid not crowded.
- [ ] SMALL_FONT — all labels/table headers/field labels >= 16px; headings >= 20px.

## Wireframe-specific sanity checks
- [ ] One frame per breakpoint (Desktop + Mobile); mobile is restructured, not squeezed.
- [ ] Every data-bearing panel shows empty / loading / error / success, each labeled.
- [ ] The error state includes a recovery affordance (retry / inline action).
- [ ] Panels align on a fixed column grid with even gutters.
- [ ] UI-kit items sit inside panel slots, never over a label; one fidelity throughout.
- [ ] No real names, emails, numbers or tokens in any cell/field — all redacted/fake.

See ../../_shared/references/visual-system.md, ../../_shared/references/geometry-rules.md,
../../_shared/references/library-policy.md, and ../../_shared/references/security-redaction.md.
