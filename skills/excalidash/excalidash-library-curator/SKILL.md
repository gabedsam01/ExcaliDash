---
name: excalidash-library-curator
description: Use when a diagram should use professional icons or components from curated or public Excalidraw libraries instead of plain primitives, so concepts (databases, cloud providers, frameworks, actors) render with recognizable, on-policy art.
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__search_libraries
  - mcp__excalidash__inspect_library
  - mcp__excalidash__cache_library
  - mcp__excalidash__add_library_items_normalized
  - mcp__excalidash__add_library_items
  - mcp__excalidash__get_drawing
  - mcp__excalidash__lint_drawing
  - mcp__excalidash__score_drawing
  - mcp__excalidash__repair_drawing
  - mcp__excalidash__auto_polish_drawing
  - mcp__excalidash__validate_architecture
  - mcp__excalidash__save_drawing
  - mcp__excalidash__save_version
  - mcp__excalidash__get_drawing_url
  - mcp__excalidash__export_drawing
---

# Library Curator

## Objective
Replace generic primitive nodes in an existing Excalidraw diagram with professional icons and components pulled from curated (or vetted public) libraries, so that databases, queues, cloud providers, frameworks, and actors read at a glance. The curator searches the right packs, caches them, inspects each candidate for fit, and inserts only normalized items into defined icon slots. Every insertion is score-guarded: an item that lowers the drawing's score, collides with text, or sits in an arrow lane is rejected and reverted. The deliverable is a diagram at score >= 95 with a recorded audit trail of which libraries and items were used and which were rejected and why.

## When to use / When NOT to use
Use when:
- A diagram already has the right structure (boxes, edges, labels) but uses plain rectangles where a recognizable icon would help — a "Postgres" box, an "AWS Lambda" box, a "React" box, a "User" actor.
- `MCP_LIBRARY_MODE` is `curated` (default) or `required` and the active rubric rewards iconography.
- The user asks to "use real icons", "add the AWS logos", "make this look professional", "pull from a library", or "use C4 shapes".
- A repo-analysis or template diagram produced semantically correct but visually flat nodes that map cleanly onto curated icons.

Do NOT use when:
- `MCP_LIBRARY_MODE` is `off` — draw everything with primitives instead.
- No diagram exists yet — generate structure first (diagram director), then curate.
- A needed concept has no curated icon — draw it as a primitive in the active preset rather than importing arbitrary off-policy art.
- The user wants decorative clip-art unrelated to a node's meaning.

## Expected input
- A `drawingId` for a saved or in-progress scene that already has nodes to enrich.
- A list of `iconTargets`: each is `{ nodeId, concept, slot }` — e.g. `{ "node_db": "postgresql", "slot": "database-symbol" }`, `{ "node_api": "aws-lambda", "slot": "cloud-provider" }`, `{ "node_user": "user", "slot": "actor" }`.
- Optional `preferredPacks` override (defaults to the curated set below) and a `targetScore` (default 95).
- The active `MCP_LIBRARY_MODE` (read it before searching).

## Recommended MCP tools
Ordered call sequence:
1. `read_mcp_guide` — refresh library policy, icon-slot rules, and the score rubric; read the active `MCP_LIBRARY_MODE`.
2. `get_drawing` — load the scene; snapshot elements for rollback; locate each target node's bounds and its icon slot.
3. `score_drawing` — baseline score + `mathematicalEvidence`; this is the rollback reference for every insertion.
4. `search_libraries` — for each concept, query the curated packs by name and synonyms.
5. `cache_library` — cache the matched packs locally so repeat lookups and re-inspection don't re-fetch.
6. `inspect_library` — examine each candidate item: aspect ratio, stroke width, roughness, fill, color, complexity. Reject clashing or over-detailed art.
7. `add_library_items_normalized` — insert the chosen item, normalized to the slot's box, preset stroke/fill, and palette.
8. `score_drawing` — re-score after each insertion (or each small batch); **reject and revert any item that lowers the score**.
9. `lint_drawing` → `repair_drawing` → `score_drawing` — the repair loop until score >= 95.
10. `auto_polish_drawing` — final layout pass to snap icons cleanly into slots without semantic change.
11. `validate_architecture` — advisory legibility check that icons did not obscure flow.
12. `save_drawing` → `save_version` → `get_drawing_url` → `export_drawing` for delivery.

## Workflow
1. **Plan** — Call `read_mcp_guide` and read `MCP_LIBRARY_MODE`. Call `get_drawing` and keep the element list as the rollback snapshot. For each `iconTarget`, record the node bounds, the target slot, and the slot's box size (e.g. 32x32 `inside-card-left`, 48x48 `actor`, canonical `database-symbol`).
2. **Baseline** — Call `score_drawing`. Record the score and `mathematicalEvidence` (overlap area, arrow-text intersections, viewport fit ratio, density). No insertion may push any of these the wrong way.
3. **Search** — For each concept, call `search_libraries({ q, mode, category })` (e.g. `mode: "core"` for C4, `mode: "specialized"` for AWS/Data) against the curated packs (C4 Architecture, Software Logos, Technology Logos, AWS Architecture Icons, Data Platform). Search by name and synonyms (`postgres`/`postgresql`, `lambda`/`aws lambda`/`serverless`). Collect candidate library ids and item names.
4. **Cache** — Call `cache_library` for each matched pack so subsequent `inspect_library` and re-evaluation are local and cheap.
5. **Inspect** — Call `inspect_library` on each candidate. Reject items that: clash with the preset (wrong stroke/roughness), are overly detailed (would trigger HIGH_DENSITY), have an aspect ratio that won't fit the slot, or use off-palette colors that can't be recolored. Pick the best survivor per concept; record rejects with reasons.
6. **Insert (normalized)** — For the chosen item, call `add_library_items_normalized({ libraryId, id, itemNames, targetCardId, placement, slotSize, save: false })` — `placement` selects the slot, `targetCardId` anchors the glyph to its node, `slotSize` fixes the scale, and the normalizer matches preset stroke/roughness/fill and recolors to the palette. Never use raw `add_library_items` for placement-sensitive slots. Place exactly one item per slot.
7. **Score guard (per item)** — Immediately call `score_drawing`. If the new score is **lower** than before the insertion, or a new arrow-over-text / label-overlap blocker appeared, **revert that item** (restore the snapshot for that node) and fall back to the preset primitive. Record the rejection. Never let a decorative icon drop the drawing below baseline.
8. **Lint → repair loop** — After all accepted insertions, call `lint_drawing`. Apply `repair_drawing` fixes (one defect class at a time), then `score_drawing`. Loop until score >= 95 or two passes yield no net gain. Repair is mandatory.
9. **Polish** — Call `auto_polish_drawing({ minimumScore: 95, maxAttempts: 2, save: true })` to snap icons into slots and tidy spacing without semantic change. If the measured score drops, roll back to the last `save_version` checkpoint and re-run with a lower `maxAttempts` (a single conservative pass).
10. **Validate** — Call `validate_architecture` (advisory) to confirm icons did not obscure edges or labels.
11. **Save** — Only when score >= 95, call `save_drawing` then `save_version` with a note like `"curate: 88 -> 96; +5 icons, 1 rejected"`.
12. **Export** — Call `get_drawing_url` and `export_drawing` (PNG/SVG). Report libraries used, items inserted per slot, and items rejected with reasons.

Rollback rule: any pass (insertion or polish) whose measured `score_drawing` is lower than the prior measured score is reverted from the snapshot. Trust measured scores, never projected ones.

## Library policy
Use libraries only when an icon reinforces a node's meaning, and only in `curated`/`required` mode. Preferred curated packs for this skill: **C4 Architecture** (person, system, container, component, boundary), **Software Logos** (frameworks, languages, tools), **Technology Logos** (vendors, protocols, platforms), **AWS Architecture Icons** (compute, storage, networking, managed services), and **Data Platform** (relational, document, cache, warehouse, queue). Follow the search -> cache -> inspect -> add sequence. Place each item in exactly one icon slot — `inside-card-left`, `inside-card-top`, `badge`, `legend`, `actor`, `database-symbol`, or `cloud-provider` — never over card text and never in an arrow lane. Normalize every insertion through `add_library_items_normalized`: scale to the slot box, preserve native aspect, match preset `strokeWidth`/`roughness`/`fillStyle`, and recolor to the drawing palette rather than the source. **Reject items that lower the score**, then revert and use a primitive. Maintain a per-drawing record of libraries/items used and items rejected with reasons. See ../_shared/references/library-policy.md.

## Validation & score
A curated drawing passes only when ALL hold:
- `hardBlockers` is empty after all insertions and the repair loop.
- No arrow path crosses any text bounding box (arrow-over-text = 0) — icons must not push arrows over labels.
- Titles, section headers, and node labels do not overlap each other, their containers, or any inserted icon.
- Every inserted icon sits inside its slot box, padded, at preset stroke/roughness, recolored to palette, native aspect preserved.
- All content (including new icons) fits inside the viewport with margin; nothing clipped.
- `score_drawing` returns >= 95 and is not lower than the pre-curation baseline.

Report `mathematicalEvidence` deltas (e.g. score 88 -> 96, density within bounds, arrow-text intersections 0 -> 0) and the used/rejected ledger so the result is auditable.

## Secrets & redaction
Icons carry no secrets, but the node labels and notes they decorate may. Before saving, scan every `text` element and replace any JWT, API key, provider key, service-role key, database URL, OAuth/personal-access token, bearer value, webhook secret, or proxy credential with the matching typed placeholder: `[REDACTED_JWT_SECRET]`, `[REDACTED_API_KEY]`, `[REDACTED_PROVIDER_KEY]`, `[REDACTED_SERVICE_ROLE]`, `[REDACTED_DATABASE_URL]`, `[REDACTED_TOKEN]`, `[REDACTED_BEARER]`, `[REDACTED_WEBHOOK_SECRET]`, `[REDACTED_PROXY_SECRET]`. Show the concept (a key icon, a "DB URL" label) rather than the value. Redaction is text-only and must not change layout scoring. See ../_shared/references/security-redaction.md.

## Internal prompts
- Search call: `"search_libraries({ q: '{concept}', mode, category }) across [C4 Architecture, Software Logos, Technology Logos, AWS Architecture Icons, Data Platform]; include synonyms; return candidate libraryId + itemNames."`
- Insert call: `"add_library_items_normalized({ libraryId, id, itemNames: ['{item}'], targetCardId: '{nodeId}', placement: '{slot}', slotSize }) to scale to the slot box, preserve aspect, match preset stroke/roughness/fill, recolor to palette. Then score_drawing({ minimumScore: 95 }); if score < prior, revert and record rejection."`
- Final report: `"curate: {baseline} -> {final}. Used: {pack:item -> slot}*. Rejected: {item (reason)}*. hardBlockers empty. arrow-over-text 0. Saved version: {note}. URL: {url}."`

## Example prompts for Claude Code
These user prompts should trigger this skill:
- "Use the real AWS logos on my serverless diagram instead of plain boxes."
- "Add proper icons — Postgres, Redis, Kafka — to the container view I just generated."
- "Make this architecture diagram look professional with C4 shapes and vendor logos."
- "Pull database and cloud-provider icons from the curated libraries for these nodes."
- "Swap the generic 'User' rectangle for a real actor/person icon."

## Acceptance criteria
- [ ] `score_drawing` >= 95 and not lower than the pre-curation baseline.
- [ ] `hardBlockers` array is empty.
- [ ] Zero arrow / text bounding-box intersections introduced by icons.
- [ ] No overlapping titles, headers, labels, or icon-over-text.
- [ ] Every inserted icon is normalized (slot box, native aspect, preset stroke/roughness/fill, palette recolor) via `add_library_items_normalized`.
- [ ] Libraries used only in `curated`/`required` mode and only from curated packs; off-policy art not imported.
- [ ] Any item that lowered the score was reverted and recorded as rejected with a reason.
- [ ] Used/rejected ledger reported (pack:item -> slot; item -> reason).
- [ ] No secrets present in any text element (redaction applied).
- [ ] `save_version` note records the score delta and icon counts; URL and export produced.

## Examples
See ./references/examples.md for full call traces with concrete arguments. See ./references/checklist.md for the pre-save gate and ./references/anti-patterns.md for failure modes to avoid. Shared rules: ../_shared/references/library-policy.md, ../_shared/references/security-redaction.md, ../_shared/references/geometry-rules.md.
