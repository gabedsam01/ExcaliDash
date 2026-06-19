# Pre-save checklist — Database & Data-Flow

Run top to bottom before `save_drawing`. Do not save until every box is checked.

## Mode & input
- [ ] Diagram kind chosen and stated: ER (tables/columns/relations) or DFD
      (externals/processes/stores/flows).
- [ ] Plan line written: `TYPE=er|data-flow PRESET=... LIBRARY=curated[...] VALIDATORS=...`.
- [ ] Every secret in the input redacted to `[REDACTED_<TYPE>]` BEFORE any tool call (the plan line
      included) — no raw `postgres://user:<password>@...`.

## ER gates
- [ ] Every entity is a card with a title row + a column list (name, type).
- [ ] `PK` / `FK` / `UK` markers present and visually distinct.
- [ ] Every relation arrow carries cardinality (crow's-foot or Chen).
- [ ] Every FK targets a real PK in a real table — no dangling relation.
- [ ] Every N:M goes through an explicit junction table.

## DFD gates
- [ ] External entities, processes and data stores are distinct shapes (square / rounded / store-cylinder).
- [ ] Every flow arrow is single-headed and labelled with the data it carries.
- [ ] Every process has >= 1 input flow AND >= 1 output flow (no black-hole / miracle).
- [ ] Every store is reachable (has at least one writer and one reader, or the asymmetry is intentional).
- [ ] DFD level noted (0 = context, 1 = decomposed).

## Shared visual gates
- [ ] Every persistent data store is drawn as a cylinder / `database-symbol` (or its engine logo).
- [ ] A legend keys the notation in use.
- [ ] Relation/flow arrows bound to card sides, routed through >= 32px gutters; no line crosses a
      column list, a card, or a label.
- [ ] Cardinality / FK-target / flow labels ride in clear side lanes.
- [ ] Card gaps >= 48px, frame gaps >= 64px; column text >= 16px, headings >= 20px.
- [ ] 40px margin around the whole composition.

## Quality loop
- [ ] `lint_drawing` -> `hardBlockers == []` (no `ARROW_TEXT_INTERSECTION`, `FRAME_TITLE_OVERLAP`,
      `ITEM_OUTSIDE_FRAME`).
- [ ] `score_drawing` -> `score >= 95`; every penalty (`HIGH_DENSITY`, `SMALL_FONT`, `TEXT_NEAR_EDGE`)
      addressed.
- [ ] `repair_drawing` looped until clean; any pass that lowered the score rolled back to the last
      `save_version`.
- [ ] `auto_polish_drawing` ran after blockers cleared; re-scored with no regression; no cardinality
      label / FK arrowhead / PK marker / flow label dropped.

## Architecture validation
- [ ] `validate_architecture` clean (ER referential integrity / DFD flow conservation).
- [ ] `suggest_architecture_improvements` reviewed; accepted fixes applied and re-linted/re-scored
      (missing FK index, orphan table, missing junction, write-only store, output-less process,
      unlabelled flow).

## Save & export
- [ ] `save_drawing` with a clear title (`"<System> — ER Diagram"` / `"<System> — Data-Flow Diagram (L1)"`).
- [ ] `save_version` checkpoint taken.
- [ ] `get_drawing_url` + `export_drawing` done; export re-scanned for secrets (no connection string
      with credentials, no service-role key).
