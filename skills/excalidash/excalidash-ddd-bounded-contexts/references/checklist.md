# DDD Bounded Contexts — Pre-Flight & Acceptance Checklist

Run top to bottom. Do not call `save_drawing` until every box is checked.

## 0. Plan line (before any create call)
- [ ] Wrote: `TYPE=ddd PRESET=architecture LIBRARY=curated[Software Architecture, Architecture diagram components] VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`
- [ ] Listed every bounded context (each becomes one frame).
- [ ] Listed the shared kernel and named exactly its two co-owning contexts.
- [ ] Listed every domain event with its producer context and consumer context(s).
- [ ] Assigned a relationship pattern to every inter-context edge (Partnership / Shared Kernel /
      Customer-Supplier U/D / Conformist / ACL / OHS / PL); inferred + flagged any missing one.
- [ ] Scanned the input for secrets (DB URL, API key, service-role, token, bearer, webhook/proxy)
      and redacted BEFORE any tool argument.

## 1. Generate (one path only)
- [ ] Used exactly ONE of: `apply_architecture_skill({ pattern: "ddd" })` (preferred skeleton) /
      `create_diagram_from_prompt({ diagramType: "ddd", structure: { nodes, edges } })` /
      `create_from_repo_analysis({ analysis: { modules, entrypoints, database, services, integrations } })` /
      `convert_diagram_type({ structure, targetType: "ddd" })` / `create_from_template`.
- [ ] Captured the returned `id`.
- [ ] One frame per context; frames on a grid with >= 80px gutters for inter-context arrows.
- [ ] Aggregate roots near the top of each frame; entities/VOs below.
- [ ] Shared kernel is a block centered on the seam between its two owner frames (touching both).
- [ ] Domain-event arrows point producer -> consumer; the event name is the edge label.

## 2. Structure / content (DDD-specific)
- [ ] Context name is the frame TITLE only — not repeated as a card inside the frame.
- [ ] Each context uses its OWN ubiquitous language; a term shared by two contexts is allowed to mean
      different things (e.g. "Customer" in Ordering vs. Billing) and is NOT merged.
- [ ] No aggregate from one context is drawn inside or referenced by another context except through a
      published domain event or an ACL.
- [ ] Every inter-context edge has exactly one relationship-pattern label.
- [ ] Customer/Supplier edges show Upstream (U) and Downstream (D) markers.
- [ ] Conformist / ACL edges show the ACL badge on the downstream side.
- [ ] OHS / Published Language edges are labeled on the upstream (host) side.
- [ ] Every domain event has at least one consumer (no dead event) and a producer (no orphan subscription).

## 3. Lint -> Score -> Repair loop
- [ ] `lint_drawing` -> `hardBlockers == []` (no `ARROW_TEXT_INTERSECTION`, no `FRAME_TITLE_OVERLAP`,
      no `ITEM_OUTSIDE_FRAME` other than the intentional, labeled shared-kernel seam block).
- [ ] `score_drawing` -> recorded number + every penalty.
- [ ] `repair_drawing` per blocker/penalty; re-lint + re-score after each.
- [ ] Looped until `score >= 95` AND `hardBlockers == []`.
- [ ] Rolled back (restore last `save_version`) any pass that lowered the score; applied a smaller fix.

## 4. Polish
- [ ] `auto_polish_drawing` only after blockers cleared.
- [ ] Re-scored; confirmed no regression below the checkpoint (rolled back if it dropped).

## 5. Validate architecture
- [ ] `validate_architecture` clean: one frame per context; every cross-context edge labeled with a
      pattern; shared kernel jointly owned by exactly two contexts; every event has producer +
      consumer; no leaked aggregate.
- [ ] `suggest_architecture_improvements` reviewed; accepted fixes applied; re-linted + re-scored.

## 6. Geometry & viewport
- [ ] No event name or pattern label sits under an arrow (clear gutter beside each edge).
- [ ] Context titles, the shared-kernel label, and the legend header do not overlap each other or a card.
- [ ] All content >= 40px from canvas/export bounds (no `TEXT_NEAR_EDGE`).
- [ ] Inter-context arrows route through frame gutters; none crosses a frame, card, or another label.

## 7. Libraries (if `MCP_LIBRARY_MODE != off`)
- [ ] Pulled only from Software Architecture / Architecture diagram components (+ Stick Figures for
      boundary actors, gateway/shield for ACL).
- [ ] Event glyph on every event edge; shared/overlap glyph on the shared kernel; ACL glyph on ACL edges
      (in `required` mode these are mandatory).
- [ ] Inserted via `add_library_items_normalized` in the correct slot (`badge` / `inside-card-top` /
      `event-symbol` / `legend`); normalized scale + aspect; preset stroke/fill.
- [ ] Rejected any icon causing HIGH_DENSITY / arrow collision / preset clash; used a primitive instead.
- [ ] Recorded used + rejected items.

## 8. Secrets
- [ ] Re-scanned the serialized export; event payloads, integration notes, and per-context datastore
      strings carry typed placeholders only (`[REDACTED_*]`).
- [ ] No secret echoed in the response.

## 9. Save & export
- [ ] `save_drawing` titled `"<Domain> — DDD Context Map"`.
- [ ] `save_version` checkpoint of the accepted state.
- [ ] `get_drawing_url` link captured.
- [ ] `export_drawing` (svg/png/json) produced and re-scanned for secrets.

## Final acceptance
- [ ] `score >= 95`, `hardBlockers == []`.
- [ ] No arrow/text intersection; no overlapping headers/titles.
- [ ] One frame per context; shared kernel straddling its two owners; every cross-context edge labeled
      with a relationship pattern; no leaked aggregate.
- [ ] Libraries used when relevant; no secrets leaked.
