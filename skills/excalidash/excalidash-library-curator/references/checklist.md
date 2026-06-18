# Library Curator — Pre-Save Checklist

Run this gate before every `save_drawing`. Do not save until all REQUIRED items pass.

## 1. Mode & baseline
- [ ] `read_mcp_guide` ran; active `MCP_LIBRARY_MODE` read.
- [ ] `MCP_LIBRARY_MODE` is `curated` or `required` (if `off`, abort — use primitives only).
- [ ] `get_drawing` ran; element list kept as the rollback snapshot.
- [ ] `score_drawing` baseline recorded (score + `mathematicalEvidence`).
- [ ] Each `iconTarget` mapped to a node id, a slot, and a slot box size.

## 2. Search & cache
- [ ] `search_libraries` queried the curated packs (C4 Architecture, Software Logos, Technology Logos, AWS Architecture Icons, Data Platform) for each concept, including synonyms.
- [ ] Matched packs `cache_library`'d so re-inspection is local.
- [ ] No off-policy / arbitrary public library used for any concept.

## 3. Inspect
- [ ] `inspect_library` run on every candidate.
- [ ] Each chosen item: aspect ratio fits the slot, stroke/roughness match the preset, not over-detailed, recolorable to palette.
- [ ] Rejected candidates recorded with reasons.

## 4. Normalized insertion (REQUIRED)
- [ ] Every icon inserted via `add_library_items_normalized` (never raw `add_library_items` for placement-sensitive slots).
- [ ] Exactly one item per slot; slot is one of: inside-card-left, inside-card-top, badge, legend, actor, database-symbol, cloud-provider.
- [ ] Each icon scaled to its slot box, native aspect preserved (not stretched).
- [ ] Stroke width, roughness, and fill style match the preset; color recolored to palette.

## 5. Score guard per item (REQUIRED)
- [ ] `score_drawing` called after each insertion (or small batch).
- [ ] Any item that lowered the score, or introduced an arrow-over-text / label-overlap blocker, was reverted from the snapshot and recorded as rejected.
- [ ] Reverted concepts fell back to the preset primitive.

## 6. Lint → repair loop (REQUIRED)
- [ ] `lint_drawing` returns zero error-level findings.
- [ ] `repair_drawing` applied for residual defects (one class at a time), then re-scored.
- [ ] Loop stopped at score >= 95 or after two passes with no net gain.

## 7. Polish
- [ ] `auto_polish_drawing` run with `minimumScore: 95`, `maxAttempts: 2`, `save: true` to snap icons into slots without semantic change.
- [ ] If measured score dropped after polish, rolled back to the last `save_version` checkpoint and re-ran with a single conservative pass (`maxAttempts: 1`).

## 8. Score gate (REQUIRED)
- [ ] `score_drawing` >= 95.
- [ ] `hardBlockers` is empty.
- [ ] Final score is NOT lower than the pre-curation baseline.

## 9. Geometry invariants (REQUIRED)
- [ ] Arrow-over-text intersections = 0 (no icon pushed an arrow over a label).
- [ ] No title/header/label overlaps with each other, their containers, or any icon.
- [ ] Every icon sits inside its slot box with padding; no icon-over-text.
- [ ] All content (incl. icons) inside viewport bounds with margin; nothing clipped.

## 10. Semantics preserved (REQUIRED)
- [ ] Node count unchanged vs. baseline (icons enrich existing nodes, they don't add concepts).
- [ ] Edge count and endpoints unchanged.
- [ ] Labels unchanged except for secret redaction.

## 11. Secrets (REQUIRED)
- [ ] All `text` elements scanned for JWT / API key / provider key / service-role / DB URL / token / bearer / webhook / proxy.
- [ ] Matches replaced with the correct `[REDACTED_*]` placeholder.

## 12. Save & deliver
- [ ] `save_drawing` then `save_version` with note `"curate: <baseline> -> <final>; +<n> icons, <m> rejected"`.
- [ ] Used/rejected ledger reported (pack:item -> slot; item -> reason).
- [ ] `get_drawing_url` returned.
- [ ] `export_drawing` (PNG or SVG) produced.
