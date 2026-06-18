# Anti-patterns — Database & Data-Flow

Concrete failure modes the lint/score/validate engine catches on ER and DFD diagrams, plus the
schema/flow mistakes specific to this skill — each with its fix.

## Geometry / lint blockers (cap score < 95)

### Relation/flow line crosses a column list — `ARROW_TEXT_INTERSECTION`
The #1 failure here. A relation arrow drawn corner-to-corner cuts straight through a table's column
text, or a DFD flow line runs under the next process's label.
- **Fix**: bind arrow endpoints to a card *side* (left/right/top/bottom anchor), route through a
  >= 32px gutter between cards, and park the cardinality/flow label in the side lane — never on top
  of the line or over a column row. Re-run `lint_drawing` until this clears.

### Cardinality / flow label sits on the line — `ARROW_TEXT_INTERSECTION`
`1:N` or "payment token" placed at the arrow midpoint lands on the stroke.
- **Fix**: offset the label into the clear gutter beside the line; keep 16px clearance from both the
  stroke and any card.

### Table title row or legend header overlaps content — `FRAME_TITLE_OVERLAP`
A table card's first column row creeps into the title band, or the legend block's header overlaps its
first keyed swatch.
- **Fix**: reserve the top 40px of every card/frame for the title only; push the column list /
  legend swatches down below the title band + 16px inset.

### A table or store pokes outside its frame — `ITEM_OUTSIDE_FRAME`
A tall table card grew past the bottom of a grouping frame when columns were added.
- **Fix**: enlarge the frame, or move/resize the card to sit fully inside the frame's inner bounds
  (frame rect minus title band minus 16px inset).

## Penalties (subtract points)

### Tall column lists packed tight — `HIGH_DENSITY`
A 15-column table jammed next to three neighbours with < 48px gaps.
- **Fix**: spread the cards (card gap >= 48px), drop low-signal columns to a `+N more` note, or split
  the schema into multiple ER views.

### Column type text shrunk to fit — `SMALL_FONT`
Long types (`timestamptz`, `numeric(12,2)`) get shrunk below 16px to fit a narrow card.
- **Fix**: widen the card or abbreviate the type; never render below 16px. Headings stay >= 20px.

### Cards flush to the export edge — `TEXT_NEAR_EDGE`
A wide schema runs a table within 40px of the canvas bound.
- **Fix**: keep a 40px margin around the whole composition; move content inward or split the view.

## Schema / flow correctness (architecture failures, not penalties)

### Dangling FK — `validate_architecture` fails
`orders.customer_id -> customers.id` but there is no `customers` table.
- **Fix**: repoint the FK to the real PK (`users.id`), re-bind the relation arrow to that card's side,
  keep the cardinality. A dangling FK is a hard failure, not a style nit.

### Many-to-many drawn as a direct arrow
`orders N:M products` rendered as one arrow with no junction table.
- **Fix**: add the `order_items` junction table (composite PK or its own PK + two FKs), and draw
  two `1:N` relations into it. `suggest_architecture_improvements` flags the missing junction.

### Missing cardinality on a relation
A bare arrow between two tables with no `1:N` / `N:M` marker.
- **Fix**: add cardinality at each end (crow's-foot or Chen). Every relation must be keyed.

### Black-hole / miracle process (DFD)
A process with input flows but no output (black hole), or output flows but no input (miracle).
- **Fix**: add the missing flow, or remove the process. Every process needs >= 1 input AND >= 1 output.

### Write-only or read-only store by accident (DFD)
A store that is written but never read (or read but never written) with no intentional reason.
- **Fix**: add the missing reader/writer flow, or annotate the asymmetry as intentional (e.g. an
  append-only audit store). `suggest_architecture_improvements` surfaces this.

### Unlabelled data flow (DFD)
A flow arrow with no data name.
- **Fix**: label every flow with the data it carries ("order payload", "receipt pdf"). An unnamed
  flow is meaningless in a DFD.

## Wrong-skill / scope mistakes

### Drawing apps/services instead of tables
Putting "Auth API", "Worker" compute boxes on what should be an ER diagram.
- **Fix**: that is a C4 Container view -> `excalidash-c4-container`. Keep this skill to
  tables/columns/relations or data flows.

### Modelling pub-sub as a DFD
Drawing Kafka topics, partitions and consumer groups as "data flows".
- **Fix**: that is event-driven -> `excalidash-event-driven`. A DFD shows data between
  processes/stores, not broker topology.

## Secret leaks

### Connection string with embedded credentials on a store node
`postgres://app:<password>@db.internal/main` printed on the Postgres cylinder.
- **Fix**: redact to `postgres://app:[REDACTED_DATABASE_URL]@db.internal/main` BEFORE the tool call;
  re-scan the export. Never echo the password back to the user or leave it in a store note.

See `../../_shared/references/geometry-rules.md` for the full blocker/penalty definitions and
`../../_shared/references/security-redaction.md` for the redaction procedure.
