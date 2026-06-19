# Portfolio Polished Diagram — Operating Checklist

A gate-by-gate checklist for building a presentation/portfolio-grade visual under the
**portfolio-polished** preset. Do not advance to the next gate until the current one passes.

## Gate 0 — Read context
- [ ] Called `read_mcp_guide`; know the portfolio-polished preset and the scoring rubric.
- [ ] Read `MCP_LIBRARY_MODE` (off / curated / required).
- [ ] Scanned the input for secrets — connection strings, API keys, service-role, JWT, bearer,
      webhook, proxy values. Portfolio visuals are the most exposed artifact; redact before any call.

## Gate 1 — Define the slide (composition before drawing)
- [ ] Named the SUBJECT and a one-line value statement for the title-band heading.
- [ ] Chose 5-12 nodes (more reads as noise at slide scale -> split into multiple views).
- [ ] Chose the few edges worth showing, each with a short readable label (no protocol soup).
- [ ] Capped the palette at 3 hues + neutrals (one primary, one accent, one supporting).
- [ ] Decided which nodes carry a vendor/tech logo — all of them or none (no half-iconing).
- [ ] Decided the legend keys (node types / icon set / color meaning) and its corner.

## Gate 2 — Plan line (write it before any create call)
- [ ] `PRESET=portfolio-polished`.
- [ ] `SUBJECT=<name>  NODES=<5-12>  EDGES=<few>  PALETTE=<=3 hues`.
- [ ] `LIBRARY=` off, or curated/required + `Technology Logos, Software Logos, Software Architecture`.
- [ ] `VALIDATORS=lint,score,repair`.

## Gate 3 — Library decision
- [ ] In `off`: no library calls; node labels as text, legend swatches and cards drawn as primitives.
- [ ] In `curated`/`required`: searched **Technology Logos** (vendors/protocols/platforms),
      **Software Logos** (frameworks/languages/tools), **Software Architecture** (services, gateways,
      queues, layers); Cloud/DevOps logos for infra if they keep the palette consistent.
- [ ] Inspected each candidate (aspect, stroke, fill, complexity); cached keepers.
- [ ] Mapped each logo to a slot: `inside-card-left`/`inside-card-top` (node logos, 32x32),
      `badge` (type marker), `legend` (keyed swatches).

## Gate 4 — Generate (one path only)
- [ ] Secrets redacted in prompt/args BEFORE the call.
- [ ] Called exactly ONE of:
      `create_diagram_from_prompt({ preset:"portfolio-polished", title, direction, structure, autoPolish:false, save:false })`,
      `create_from_repo_analysis({ analysis, preset:"portfolio-polished", autoPolish:false, save:false })`,
      `convert_diagram_type({ structure, targetType, preset:"portfolio-polished", autoPolish:false, save:false })`.
- [ ] Composition intent: title band across the top (40px clear of the body), the visual mass
      centered, equal column/row gutters, the legend in a corner block.
- [ ] Captured the returned drawing id.

## Gate 5 — Place icons
- [ ] `add_library_items_normalized` placed each logo in `inside-card-left`/`-top`; legend swatches
      in `legend`.
- [ ] `preserveAspect: true`; scale fit to the slot; strokes/fills recolored to the palette.
- [ ] Iconography is consistent across nodes (no half-iconing, no floating logos).

## Gate 6 — Lint -> score -> repair loop
- [ ] `lint_drawing`: `hardBlockers` read and listed.
- [ ] `score_drawing`: numeric score and every penalty recorded.
- [ ] `repair_drawing` called for each blocker/penalty (mandatory if score < 95 or blocker present).
- [ ] Re-linted and re-scored after each repair.
- [ ] **Rollback applied** if a repair pass lowered the score (restored prior version, smaller fix).
- [ ] Loop exited only at `score >= 95` AND `hardBlockers == []`.

## Gate 7 — Polish + composition validation
- [ ] `auto_polish_drawing({ minimumScore:95, maxAttempts:3, allowDraft:false })` run after blockers
      cleared; re-scored (no regression, else rollback).
- [ ] Composition reads as a finished slide:
      - [ ] title band present, balanced, title-only,
      - [ ] legend present and keyed,
      - [ ] logos consistent, slotted, aspect preserved,
      - [ ] palette capped at 3 hues + neutrals,
      - [ ] visual mass centered with margin.

## Gate 8 — Save + export
- [ ] `save_drawing` with title `"<Subject> — Overview"`.
- [ ] `save_version` checkpoint of the accepted state.
- [ ] `get_drawing_url` for the shareable link.
- [ ] `export_drawing({ format:"png" })` AND `export_drawing({ format:"svg" })` produced.
- [ ] Both exports re-scanned for secrets (none; every secret is `[REDACTED_<TYPE>]`).

## Hard blockers (must all be ABSENT)
- [ ] ARROW_TEXT_INTERSECTION — no connecting line crosses any node label or legend text.
- [ ] FRAME_TITLE_OVERLAP — the title band and any frame/legend header stay title-only.
- [ ] ITEM_OUTSIDE_FRAME — every node and logo fully inside its card/frame inner bounds.

## Penalties (drive toward zero)
- [ ] TEXT_NEAR_EDGE — content kept >= 40px from canvas/export bounds.
- [ ] HIGH_DENSITY — card gaps >= 48px, equal gutters; 5-12 nodes, breathable, not crowded.
- [ ] SMALL_FONT — all text >= 16px, headings >= 20px, title-band heading the largest.

## Portfolio-specific sanity checks
- [ ] A title band states the subject + value and sets the type hierarchy.
- [ ] Iconography is consistent — every vendor/tech node logo'd or none, all normalized and slotted.
- [ ] The palette reads as one brand system (<= 3 hues + neutrals), logos recolored to it.
- [ ] The legend makes the visual self-contained.
- [ ] The composition is balanced and centered with uniform gutters.
- [ ] Exports clean to both PNG and SVG; nothing looks clipped at the bounds.

See ../../_shared/references/visual-system.md, ../../_shared/references/geometry-rules.md,
../../_shared/references/library-policy.md, and ../../_shared/references/security-redaction.md.
