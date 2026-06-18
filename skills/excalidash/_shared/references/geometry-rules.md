# Geometry Rules

These are the hard geometric constraints the validator enforces. The score starts
at 100; blockers cap the score below 95 regardless of other quality, and penalties
subtract points. Target: **score >= 95 with zero blockers**.

## Coordinate & Grid
- **Grid: 20px.** Snap every `x`, `y`, `width`, `height` to multiples of 20.
- **Viewport margin: 40px** minimum between any element and the canvas/export bounds.
  Content flush to the edge looks clipped and triggers TEXT_NEAR_EDGE when text is involved.

## Minimum Spacing (gaps between bounding boxes)
| Relationship | Min gap |
|--------------|---------|
| Card to card | **48px** |
| Frame to frame | **64px** |
| Parallel arrow lanes | **32px** |
| Isolated header to content below | **40px** |
| Text to its own container border (padding) | **16px** |

Spacing is measured between bounding boxes, not centers. Anything tighter than these
risks HIGH_DENSITY and visual collision.

## Frames
- **Title band reserved**: the top **40px** of every frame is reserved for the frame
  title. No child element may overlap that band (FRAME_TITLE_OVERLAP).
- **Containment**: every element logically belonging to a frame must sit fully inside
  the frame's inner bounds (frame rect minus title band minus 16px inset). An element
  poking outside is ITEM_OUTSIDE_FRAME.
- Frames are layout containers, not decoration — do not nest content under a frame it
  does not belong to just to fit it visually.

## Connectors (arrows / lines)
- **Connector gutters between layers**: leave a clear horizontal/vertical channel
  between stacked layers (>= 32px) so arrows have a lane to travel in.
- **Arrows exit via sides or gutters, never over labels.** Bind arrow endpoints to the
  side of a card (left/right/top/bottom anchor) and route through gutters. An arrow
  segment crossing any text bounding box is ARROW_TEXT_INTERSECTION.
- Avoid crossing arrows where a reroute through a gutter is possible. Cross only when
  topology forces it, and keep crossings at near-90°.
- Keep parallel arrows 32px apart so they read as distinct lanes.

## Text
- **Text fits**: text bounding box must fit inside its container with 16px padding on
  all sides. Overflowing text is clipped and penalized; shrink-to-fit below 16px is
  not allowed (see SMALL_FONT).
- **Legibility**: minimum rendered font size is **16px**. Headings >= 20px.
- Labels on arrows sit beside the line in a clear zone, never under another element.

## Validation Codes

### Hard Blockers (cap score < 95)
- **ARROW_TEXT_INTERSECTION** — an arrow/line segment overlaps a text element's
  bounding box. Fix: rebind endpoints to card sides; route through a 32px gutter.
- **FRAME_TITLE_OVERLAP** — a child overlaps the reserved 40px frame title band.
  Fix: push content down so it starts below the title band + inset.
- **ITEM_OUTSIDE_FRAME** — an element assigned to a frame extends beyond the frame's
  inner bounds. Fix: enlarge the frame or move/resize the element to fit inside.

### Penalties (subtract points)
- **TEXT_NEAR_EDGE** — text within the 40px viewport margin. Penalty scales with how
  close to the edge. Fix: move content inward.
- **HIGH_DENSITY** — too many elements per unit area / gaps below minimums across the
  drawing. Penalty scales with severity. Fix: increase gaps, add frames, split content
  across more space or multiple diagrams.
- **SMALL_FONT** — any text below 16px rendered. Penalty per offending element. Fix:
  raise font size and relayout so text still fits with 16px padding.

## Layout Checklist (run before validating)
1. All coordinates on the 20px grid.
2. 40px clear margin around the whole composition.
3. Card gaps >= 48px, frame gaps >= 64px, arrow lanes >= 32px, header gap >= 40px.
4. Every frame's top 40px is title-only.
5. Every framed item fully inside its frame's inner bounds.
6. No arrow crosses any text box; arrows exit via sides and travel in gutters.
7. All text >= 16px and fits with 16px padding.
8. Density looks breathable — when in doubt, add space.
