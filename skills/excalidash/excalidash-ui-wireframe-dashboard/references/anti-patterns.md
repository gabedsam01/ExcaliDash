# UI Wireframe / Dashboard — Anti-Patterns

Failure modes specific to low-fidelity dashboard wireframes, why each is wrong, and the fix. If a
draft trips any of these, repair before scoring closes. Hard blockers cap the score below 95.

## Fidelity & scope

### 1. Drifting into a high-fidelity mock
**Symptom**: real brand colors, photographic placeholders, shadows, gradients and final copy on a
"wireframe".
**Why wrong**: a wireframe communicates structure and states, not visual design; the extra fidelity
adds noise (`HIGH_DENSITY`) and invites bikeshedding on color before the layout is agreed.
**Fix**: stay on the `minimal-whiteboard` preset — light strokes, transparent/single-tint fills,
greeked placeholder blocks for copy, gray boxes for images.

### 2. Drawing a screen flow instead of a screen layout
**Symptom**: arrows connect screen A -> action -> screen B across the canvas.
**Why wrong**: that is a user flow, not the layout of one screen; the wireframe skill draws the
panels and their states, not transitions between screens.
**Fix**: keep `edges` minimal; if a journey is needed, hand off to a flow skill and reference each
wireframe as a node.

## Breakpoints

### 3. One "responsive" frame instead of separate desktop and mobile
**Symptom**: a single frame with a note "this reflows on mobile".
**Why wrong**: the mobile column count, nav collapse and stacking order are exactly what the
wireframe must show; one frame hides them.
**Fix**: draw **one frame per breakpoint** — Desktop and Mobile as separate frames >= 64px apart,
each with its own grid.

### 4. Mobile frame that is just the desktop squeezed
**Symptom**: the mobile frame keeps the side nav and a 3-column grid at phone width.
**Why wrong**: it is physically impossible at that width and reads as a copy-paste, not a design.
**Fix**: collapse the side nav to a hamburger / bottom tab bar, stack panels in a single column,
and reorder by priority (primary KPI and primary action first).

## States

### 5. Only the happy-path (success) state drawn
**Symptom**: every data panel shows a full table / populated chart and nothing else.
**Why wrong**: empty, loading and error are where real UIs fail; omitting them is the most common
wireframe gap this skill exists to close.
**Fix**: for every data-bearing panel, draw all four variants — **empty** (zero-state with a CTA),
**loading** (skeleton rows / spinner placeholder), **error** (message + retry), **success**
(populated). Key them in a legend.

### 6. States drawn but not labeled or keyed
**Symptom**: four near-identical panels with no indication which is which.
**Why wrong**: viewers can't tell the empty state from the loading skeleton.
**Fix**: label each variant ("Table — loading") and add a `legend` keying the four states.

### 7. Error state with no recovery affordance
**Symptom**: an error panel shows only "Something went wrong".
**Why wrong**: a wireframe must show how the user recovers.
**Fix**: include a retry button / inline action and, where relevant, a support link in the error
variant.

## Layout & grid

### 8. Panels off the column grid with uneven gutters
**Symptom**: panels at arbitrary x positions; gutters of 12px here, 40px there; `HIGH_DENSITY`.
**Why wrong**: irregular gutters read as misalignment and crowd the label lanes.
**Fix**: snap every panel to the 20px grid on a fixed column count (e.g. 12); keep a uniform
>= 48px gutter between panels and a >= 40px gap below the nav band.

### 9. Control or text escaping its panel
**Symptom**: `ITEM_OUTSIDE_FRAME` / overflow — a button, a long table cell or a chart pokes past
the panel or frame edge.
**Why wrong**: it reads as a broken layout and is a hard blocker.
**Fix**: enlarge the panel or shrink the content; keep >= 16px inner padding; wrap long labels
rather than overflowing.

### 10. Nav bar or KPI tile riding into the frame title band
**Symptom**: `FRAME_TITLE_OVERLAP` — the top nav overlaps the "Desktop" frame title, or a panel
header collides with the frame title.
**Why wrong**: title bands must stay title-only; overlap is unreadable.
**Fix**: reserve the top 40px of each frame for its title; start the nav band below it.

## Connectors & labels

### 11. State-annotation arrow drawn over a label
**Symptom**: `ARROW_TEXT_INTERSECTION` — an arrow noting "tap row -> detail" crosses a panel label.
**Why wrong**: the label is unreadable and it is a hard blocker.
**Fix**: route the annotation through the row/column gutter and move its label into the side lane
with 32px clearance; or drop the arrow (wireframes prefer labels over connectors).

### 12. Over-connecting panels with arrows
**Symptom**: arrows between every panel turning a layout into a flow chart.
**Why wrong**: a screen wireframe is layout; arrows imply navigation that belongs in a flow.
**Fix**: remove decorative arrows; keep at most a couple of clearly-gutter-routed annotations.

## Library & icons

### 13. Off-policy or over-detailed UI art
**Symptom**: a glossy icon from an arbitrary public pack, or a busy multi-color control, lowers the
score (`HIGH_DENSITY`, preset clash).
**Why wrong**: violates `MCP_LIBRARY_MODE = curated`; detailed art clashes with a low-fi wireframe.
**Fix**: pull only from **Lo-Fi Wireframing Kit**, **Web Kit**, **Mobile Kit**; normalize stroke
and fill to the wireframe preset; reject anything that lowers the score and fall back to a
primitive. Record the rejection.

### 14. Mixing kit styles across frames
**Symptom**: a crisp Web Kit table beside a sketchy Lo-Fi panel in the same frame.
**Why wrong**: inconsistent fidelity reads as accidental and hurts the polish score.
**Fix**: pick one fidelity per drawing; normalize every kit item to the same stroke/roughness.

## Legibility & spacing

### 15. Tiny text crammed into table rows or tiles
**Symptom**: `SMALL_FONT` — 12px labels to fit more rows / more KPIs.
**Why wrong**: below 16px is illegible and penalized; cramming defeats a wireframe's clarity.
**Fix**: keep labels >= 16px (headings >= 20px); show fewer representative rows (3-5) and widen
panels rather than shrinking type.

### 16. Content hugging the export edge
**Symptom**: `TEXT_NEAR_EDGE` — a corner panel or the legend touches the canvas bound.
**Fix**: keep all content >= 40px from canvas / export bounds.

## Security

### 17. Real sample data in placeholder rows
**Symptom**: a table or user menu shows real names, emails, or a live `Authorization: Bearer ...`
in a field.
**Why wrong**: wireframes get exported and shared; real data or a token leaks.
**Fix**: use obvious fake placeholders (`Ada L.`, `user@example.com`, `$1,234`) and turn any
token/URL into a typed `[REDACTED_<TYPE>]` value (e.g. `Bearer [REDACTED_API_KEY]`) BEFORE the
create call; re-scan the export.

## Quality loop

### 18. Skipping repair / accepting score < 95
**Symptom**: saving at 90 with a remaining penalty "because it's just a wireframe".
**Why wrong**: repair is mandatory below 95 or with any blocker — the bar is the same for every
skill.
**Fix**: run lint -> score -> repair until `score >= 95` and `hardBlockers == []`.

### 19. Keeping a polish pass that lowered the score
**Symptom**: an auto-polish reflowed the grid and dropped the score below the checkpoint.
**Why wrong**: every pass must be monotonic-up or be rolled back.
**Fix**: restore the last `save_version` checkpoint and apply a smaller, targeted fix.

See `./checklist.md`, `./examples.md`, and the shared references under `../../_shared/references/`.
