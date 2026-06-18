# Library Policy

Library items (icons, logos, symbols) add clarity when they reinforce meaning and
hurt the score when they add noise, clash with the preset, or break geometry. This
policy governs whether and how to use them.

## MCP_LIBRARY_MODE
A server-level setting controls library usage:
- **off** — never search or insert library items. Draw everything with primitives.
- **curated** (default) — library items allowed, but only from the preferred curated
  packs below. Each item must be normalized and must not lower the score.
- **required** — library items must be used where a curated icon exists for a concept
  (e.g. a database node must use a database symbol, a cloud provider must use its logo).
  Drawing a primitive where a curated icon exists is a policy violation.

Always read the active mode before reaching for icons.

## Preferred Curated Packs
- **C4 Architecture** — person, system, container, component, boundary.
- **Software Architecture** — services, queues, gateways, layers.
- **Architecture diagram components** — generic boxes, pipes, stores.
- **Flow Chart Symbols** — start/end, decision, process, IO.
- **Data Flow** — external entity, process, data store, flow.
- **Software Logos** — frameworks, languages, tools.
- **Technology Logos** — vendors, protocols, platforms.
- **Cloud/DevOps** — AWS/GCP/Azure, CI/CD, containers, k8s.
- **Database/Data Platform** — relational, document, cache, warehouse, queue.
- **Stick Figures** — actors, users, roles.
- **UI/Wireframe** — buttons, inputs, screens, nav.

Do not pull from arbitrary public libraries. If a needed concept is not in a curated
pack, draw it with primitives in the active preset rather than importing off-policy art.

## Workflow: search -> cache -> inspect -> add
1. **search** the curated packs for the concept (by name and synonyms).
2. **cache** candidate items locally so repeat lookups don't re-fetch.
3. **inspect** each candidate: aspect ratio, stroke style, fill, color, complexity.
   Reject anything that clashes with the preset or is overly detailed.
4. **add_library_items_normalized** — insert the chosen item normalized (see below),
   placed in the correct icon slot.

## Icon Slots
Place items only in defined slots so layout stays predictable:
- **inside-card-left** / **inside-card-top** — concept icon within a card, padded 16px.
- **badge** — small status/type marker on a card corner.
- **legend** — keyed swatch in a legend block.
- **actor** — stick figure for a person/role at a flow boundary.
- **database-symbol** — canonical store shape for a data node.
- **cloud-provider** — vendor logo for an infra node.

An icon must never overlap card text or sit in an arrow lane (see geometry-rules.md).

## Normalization
Before insertion, normalize every item to match the drawing:
- **scale** — fit the slot's target box (e.g. 32x32 inside-card, 48x48 actor).
- **aspect** — preserve the item's native aspect ratio; never stretch.
- **stroke** — match the preset's `strokeWidth` and `roughness`.
- **fill** — match the preset's `fillStyle`; recolor to the palette, not the source.
- **opacity** — full opacity for content; reduce only for intentional de-emphasis.

## Score Guard & Recording
- **Reject items that lower the score.** If adding an icon introduces HIGH_DENSITY,
  collides with text/arrows, or clashes with the preset, drop it and use a primitive.
- **Record used and rejected** items per drawing: which pack/item was inserted in which
  slot, and which candidates were rejected and why. This audit trail keeps subsequent
  drawings consistent and avoids re-evaluating the same rejected art.
