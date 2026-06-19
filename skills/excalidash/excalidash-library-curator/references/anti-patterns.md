# Library Curator — Anti-Patterns

Failure modes specific to pulling icons from libraries. Avoid all of these.

## Importing off-policy / arbitrary art
- ❌ Reaching into a random public Excalidraw library because it has a nice-looking icon.
- ✅ Search only the curated packs (C4 Architecture, Software Logos, Technology Logos, AWS Architecture Icons, Data Platform). If no curated match exists, draw a primitive in the active preset — never import off-policy art to fill a slot.

## Ignoring MCP_LIBRARY_MODE
- ❌ Inserting icons when `MCP_LIBRARY_MODE = off`, or drawing a primitive where `required` mode demands a curated icon (e.g. a plain rectangle for a database).
- ✅ Read the mode first. `off` = primitives only; `curated` = on-policy icons allowed; `required` = a curated icon MUST be used where one exists for the concept.

## Raw insertion instead of normalized
- ❌ Using `add_library_items` for placement-sensitive slots, dropping items at native scale/color so they overflow cards or clash with the palette.
- ✅ Use `add_library_items_normalized`: scale to the slot box, preserve native aspect, match preset stroke/roughness/fill, recolor to the drawing palette.

## Accepting a score regression
- ❌ Keeping an icon because it "looks more professional" even though the measured `score_drawing` dropped (e.g. a detailed multi-color logo triggered HIGH_DENSITY).
- ✅ Score after every insertion. If the score is lower than before that item, revert it from the snapshot and use a simpler item or a primitive. Record the rejection with a reason.

## Skipping the baseline snapshot
- ❌ Inserting icons before ever calling `get_drawing` + `score_drawing`, leaving nothing to revert to when an item fails the guard.
- ✅ Always capture the element snapshot and baseline score first; each insertion is reverted against that snapshot.

## Icon over text or in an arrow lane
- ❌ Dropping an icon on top of a node label, or in the corridor an arrow travels through, creating overlap or arrow-over-text blockers.
- ✅ Place icons only in defined slots (inside-card-left/top, badge, legend, actor, database-symbol, cloud-provider), padded, clear of labels and arrow lanes.

## Stretching / recoloring wrongly
- ❌ Forcing a wide logo into a square slot (distorted aspect), or keeping the source's off-palette colors.
- ✅ Preserve native aspect; fit to the slot's bounding box; recolor to the drawing palette, not the source brand colors (unless a brand mark in a badge is intended).

## Redundant icons on one node
- ❌ Stacking two icons that mean the same thing on a single node (e.g. a DynamoDB icon plus a generic key-value icon).
- ✅ One concept icon per slot. A brand badge may accompany a canonical store symbol, but do not duplicate the same meaning.

## Adding concepts instead of enriching
- ❌ Treating curation as a chance to add new nodes/edges the diagram didn't have.
- ✅ Curation enriches existing nodes only. Node count, edge count, and labels stay identical (modulo redaction). If counts change, the pass is invalid — revert.

## No audit trail
- ❌ Inserting icons without recording which pack/item went in which slot or which candidates were rejected and why.
- ✅ Maintain the used/rejected ledger per drawing; report it. This keeps later diagrams consistent and avoids re-evaluating known-bad art.

## Re-fetching uncached libraries
- ❌ Calling `search_libraries`/`inspect_library` repeatedly against packs you never cached, paying the fetch cost each time.
- ✅ `cache_library` matched packs once, then inspect and re-evaluate locally.

## Leaking secrets in decorated labels
- ❌ Saving a curated drawing whose node notes still contain a connection string, API key, or bearer token.
- ✅ Scan every `text` element and apply `[REDACTED_*]` before the final save; show a key icon/concept, never the value.

## Saving below threshold
- ❌ Calling `save_drawing` when `score_drawing` < 95 because the icons "look done".
- ✅ The 95 gate is mandatory and the final score must not be below the pre-curation baseline. Run the lint -> repair loop until both hold.
