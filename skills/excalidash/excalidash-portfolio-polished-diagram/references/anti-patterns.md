# Portfolio Polished Diagram — Anti-Patterns

Failure modes specific to presentation/portfolio-grade visuals built under the
**portfolio-polished** preset, why each is wrong, and the fix. The lint/score engine catches the
geometry ones as hard blockers or penalties; the rest are composition mistakes that make a diagram
look unfinished on a slide. If a draft trips any of these, repair before scoring closes.

## Preset & palette

### 1. Mixing presets (the fastest way below 95)
**Symptom**: portfolio-polished cards next to hand-drawn strokes, or a dark-architecture surface on
a white slide.
**Why wrong**: a preset is one coherent bundle (palette + type + stroke + fill); mixing reads as
noise and drops the score.
**Fix**: pick `portfolio-polished` once and keep every element in that bundle; re-skin imports with
`convert_diagram_type({ preset: "portfolio-polished" })` instead of pasting foreign styles.

### 2. Palette sprawl (more than 3 hues)
**Symptom**: six accent colors, one per node, "to make it pop".
**Why wrong**: the palette caps at 3 hues + neutrals; more saturates the composition and hurts the
density read.
**Fix**: choose one primary, one accent (the thing to look at first), one supporting hue; everything
else is a neutral tint.

### 3. Recoloring logos to their source brand colors
**Symptom**: a rainbow of vendor logos in full brand color fighting the palette.
**Why wrong**: it breaks palette consistency even though each logo is individually "correct".
**Fix**: normalize logo strokes/fills to the drawing palette (monochrome or single-accent); the
*shape* identifies the vendor, the color belongs to the composition.

## Composition

### 4. No title band
**Symptom**: the diagram floats with no heading; the audience has no entry point.
**Why wrong**: a portfolio visual is a slide — it needs a title that states the subject and value.
**Fix**: reserve a title band across the top (40px clear of the first row); put the largest type
there as the heading.

### 5. Title band overlapping the first row
**Symptom**: `FRAME_TITLE_OVERLAP`; the heading sits on top of the top node.
**Why wrong**: title bands stay title-only; overlap is unreadable and a hard blocker.
**Fix**: push the body down so the first row starts below the reserved 40px band + inset.

### 6. Off-center / lopsided composition
**Symptom**: all the weight on the left, dead space on the right; gutters of different widths.
**Why wrong**: a portfolio visual is judged on balance; irregular gutters read as accidental.
**Fix**: center the visual mass on the canvas center; make every column/row gutter equal.

### 7. Too many nodes on one slide (HIGH_DENSITY)
**Symptom**: 18 boxes crammed edge to edge with < 48px gaps.
**Why wrong**: a deck visual should carry 5-12 nodes; more is unreadable at slide scale and trips
the `HIGH_DENSITY` penalty.
**Fix**: cut to the nodes the audience must see, or split into two views; never shrink-to-fit.

## Iconography

### 8. Half-iconed diagram
**Symptom**: three nodes have logos, the rest are bare boxes.
**Why wrong**: inconsistent iconography looks unfinished — the eye reads the bare boxes as errors.
**Fix**: either every vendor/tech node gets a normalized logo or none do; keep it consistent.

### 9. Floating logos not in a slot
**Symptom**: a logo dropped loosely on the canvas, overlapping a card edge or an arrow lane.
**Why wrong**: `ITEM_OUTSIDE_FRAME` or `ARROW_TEXT_INTERSECTION`; loose art breaks the grid.
**Fix**: place every logo via `add_library_items_normalized` into `inside-card-left`/`-top`
(32x32, 16px padding); never free-float.

### 10. Distorted logos (broken aspect ratio)
**Symptom**: a square logo stretched into a wide card slot.
**Why wrong**: non-uniform scaling distorts the brand mark and looks amateur on a slide.
**Fix**: normalize with `preserveAspect: true`; fit the slot box without stretching.

### 11. Over-detailed / off-policy icons
**Symptom**: a busy multi-color glyph from an arbitrary public library lowers the score.
**Why wrong**: violates `MCP_LIBRARY_MODE = curated`; detail noise hurts density and palette.
**Fix**: pull only from Technology Logos, Software Logos, Software Architecture; reject anything that
lowers the score and fall back to a clean primitive. Record the rejection.

## Legend

### 12. No legend
**Symptom**: colors and icon types carry meaning that goes unexplained.
**Why wrong**: the audience can't decode the visual language; a portfolio visual must be
self-contained.
**Fix**: add a `legend` block keying node types / icon set / color meaning in a bottom or side
corner.

### 13. Legend header colliding with the title or a node
**Symptom**: `FRAME_TITLE_OVERLAP` between the legend header and the title band, or the legend over
a corner node.
**Fix**: give the legend its own corner block with clear gaps; keep its header title-only.

## Routing & text

### 14. Arrow routed straight through a card
**Symptom**: a connecting line passes over another node's body.
**Why wrong**: implies a connection that doesn't exist and clutters the composition.
**Fix**: route lines through the reserved >= 32px gutters; never cross a card.

### 15. Edge label sitting under its line
**Symptom**: `ARROW_TEXT_INTERSECTION`; the label is overdrawn by the routed arrow.
**Why wrong**: the label is unreadable and it is a hard blocker.
**Fix**: move the label into the side lane beside the line with 32px clearance; keep endpoints fixed.

### 16. Protocol soup on a deck slide
**Symptom**: every edge crammed with "HTTPS/JSON over TLS 1.3, mTLS, gRPC-web…".
**Why wrong**: this is a portfolio visual, not an engineering spec; dense labels kill the polish.
**Fix**: use short readable verbs ("calls", "stores in", "publishes"); push protocol detail to a C4
container diagram if needed.

### 17. Sub-16px labels to fit more text
**Symptom**: `SMALL_FONT`; node tech sub-labels shrunk to 12px to fit.
**Why wrong**: minimum rendered font is 16px; small type fails legibility and looks cheap exported.
**Fix**: raise to >= 16px and relayout; if it won't fit, shorten the label or enlarge the card.

## Export & viewport

### 18. Content hugging the export edge
**Symptom**: `TEXT_NEAR_EDGE`; the legend or a corner node touches the canvas bound and looks
clipped in the PNG.
**Fix**: keep all content >= 40px from canvas/export bounds before exporting.

### 19. Shipping a draft / skipping the PNG+SVG export
**Symptom**: saved `asDraft: true`, or only a PNG produced when the user needs a vector for print.
**Why wrong**: a portfolio deliverable is final and usually needs both raster and vector.
**Fix**: `auto_polish_drawing({ allowDraft: false })`; export both `format: "png"` and
`format: "svg"`.

## Security

### 20. Live secret on a public slide
**Symptom**: a card label reads `postgres://app:<password>@db/main` or shows an `sk-...` API key, and
the diagram is headed for a public README.
**Why wrong**: portfolio visuals are the most exposed artifact here; a leak is public immediately.
**Fix**: redact BEFORE the create call -> `postgres://app:[REDACTED_DATABASE_URL]@db/main`,
`[REDACTED_API_KEY]`; re-scan both exports. Show the concept (a vault node, a key icon), never the
value.

## Quality loop

### 21. Accepting score < 95 because "it looks fine"
**Symptom**: saving at 91 with a remaining penalty.
**Why wrong**: repair is mandatory below 95 or with any blocker.
**Fix**: run the lint -> score -> repair loop until `score >= 95` and `hardBlockers == []`.

### 22. Keeping a polish pass that lowered the score
**Symptom**: an auto-polish reflow rebalanced the grid but dropped below the checkpoint.
**Why wrong**: every pass must be monotonic-up or be rolled back.
**Fix**: restore the last `save_version` checkpoint and apply a smaller, targeted fix.

See `./checklist.md`, `./examples.md`, and the shared references under `../../_shared/references/`.
