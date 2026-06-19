# Repo to System Design — Operating Checklist

A gate-by-gate checklist for turning a structured repository analysis into a framed,
flow-routed system-design diagram. Do not advance to the next gate until the current one passes.

## Gate 0 — Read context
- [ ] Called `read_mcp_guide`; know the architecture preset and the scoring rubric.
- [ ] Read `MCP_LIBRARY_MODE` (off / curated / required).
- [ ] Scanned the analysis for secrets — DB `conn` strings, `auth.idpSecret`, integration API
      keys, JWT signing keys, webhook secrets, bearer/proxy tokens (repo analyses leak `.env`).

## Gate 1 — Confirm the intermediate model
- [ ] The analysis is the rich model, not prose: it has typed sections, not a paragraph.
- [ ] Read actors, apps, gateways, services, workers, queues, databases, integrations.
- [ ] Read `auth`, `observability`, `risks` (these populate the Cross-cutting zone / badges).
- [ ] Confirmed at least one `flow` exists with ordered `steps` (each `{ from, to, label, protocol }`).
- [ ] Every node referenced by a flow step actually exists in a section (no dangling endpoints).

## Gate 2 — Plan line (write it before any create call)
- [ ] `TYPE=system-design` and `SOURCE=repo-analysis`.
- [ ] `PRESET=architecture`.
- [ ] `ZONES=[Client, Edge, Services, Async, Data, External, Cross-cutting]` (drop empty zones).
- [ ] `LIBRARY=` off, or curated/required + `Software Architecture, Technology Logos, Cloud/DevOps, Database/Data Platform`.
- [ ] `VALIDATORS=lint,score,repair,validate_architecture`.

## Gate 3 — Library decision
- [ ] In `off`: no library calls; zone frames + service boxes + cylinder stores + queue shapes +
      actor stick-figures drawn with primitives.
- [ ] In `curated`/`required`: searched **Software Architecture** (services, gateways, queues),
      **Technology Logos** (apps/services/integration logos), **Cloud/DevOps** (LB, k8s, observability),
      **Database/Data Platform** (relational, document, cache, warehouse, object); actors from Stick Figures.
- [ ] Inspected each candidate (aspect, stroke, fill, complexity); cached keepers.
- [ ] Mapped each icon to a slot: `inside-card-top` (service/app glyph), `database-symbol` (stores),
      `cloud-provider`/`badge` (integration/cloud logos), `actor` (people), `legend` (per-zone swatch).

## Gate 4 — Generate (one path only)
- [ ] Secrets redacted in the model/args BEFORE the call.
- [ ] Called exactly ONE of:
      `create_from_repo_analysis({ analysis, preset:"architecture", autoPolish:true, save:true, name })` (preferred),
      `apply_architecture_skill({ pattern:"microservices", preset:"architecture", title })` (service-heavy fallback; `pattern` only — never `skill`/`level`),
      `create_diagram_from_prompt({ diagramType:"architecture", prompt:<zones+flows>, structure:{ nodes, edges } })` (no-object fallback).
- [ ] Layout intent: Actors+Client top, Edge below, Services central band, Async to one side,
      Data along the bottom, External on the right margin, Cross-cutting as a spanning band/corner;
      >= 32px flow gutters reserved.
- [ ] Captured the returned `drawingId`.

## Gate 5 — Lint -> score -> repair loop
- [ ] `lint_drawing`: `hardBlockers` read and listed.
- [ ] `score_drawing`: numeric score and every penalty recorded.
- [ ] `repair_drawing` called for each blocker/penalty (mandatory if score < 95 or blocker present).
- [ ] Re-linted and re-scored after each repair.
- [ ] **Rollback applied** if a repair pass lowered the score (restored prior version, smaller fix).
- [ ] Loop exited only at `score >= 95` AND `hardBlockers == []`.

## Gate 6 — Polish + architecture validation
- [ ] `auto_polish_drawing` run after blockers cleared; re-scored (no regression).
- [ ] `validate_architecture` clean:
      - [ ] every present zone has a frame,
      - [ ] every node sits inside its zone frame,
      - [ ] integrations sit in the External zone (not inside a service zone),
      - [ ] every flow step is an endpointed, labeled edge,
      - [ ] request flows and event flows are visually distinct (solid vs dashed / color),
      - [ ] no orphan node (every node touches at least one flow or ownership edge).
- [ ] `suggest_architecture_improvements` run; safe suggestions applied (e.g. add a missing
      service->owned-DB read/write edge); re-scored after each applied fix.

## Gate 7 — Save + export
- [ ] `save_drawing` with title `"<Repo> — System Design"`.
- [ ] `save_version` checkpoint of the accepted state.
- [ ] `get_drawing_url` for the shareable link.
- [ ] `export_drawing` produced; export re-scanned for secrets (DB conn / IdP / integration keys).

## Hard blockers (must all be ABSENT)
- [ ] ARROW_TEXT_INTERSECTION — no flow line crosses any label or node text.
- [ ] FRAME_TITLE_OVERLAP — zone-frame titles and the legend header stay title-only.
- [ ] ITEM_OUTSIDE_FRAME — every node fully inside its zone frame; integrations fully inside
      the External zone (not half-clipped by a frame edge).

## Penalties (drive toward zero)
- [ ] TEXT_NEAR_EDGE — content kept >= 40px from canvas/export bounds.
- [ ] HIGH_DENSITY — gaps >= 48px node/node, 32px flow lanes; zones not crowded (split if needed).
- [ ] SMALL_FONT — all text >= 16px, headings >= 20px, service tech sub-label fits with padding.

## Repo-system specific sanity checks
- [ ] Each zone is recognizable: Client, Edge, Services, Async, Data, External, Cross-cutting.
- [ ] Databases read as stores (cylinder/database-symbol); queues read as queues, not services.
- [ ] Workers sit in the Async zone next to the queues they consume.
- [ ] Auth scheme is shown as a concept (OAuth/JWT/session) with a key badge, not a secret value.
- [ ] Observability appears as a cross-cutting glyph, not as a node inside the request flow.
- [ ] Risks (if present) are badges/callouts on the relevant node, not standalone flow nodes.
- [ ] Every flow label names a protocol/verb ("calls over HTTPS/JSON", "publishes to topic"),
      not bare "uses".

See ../../_shared/references/geometry-rules.md, ../../_shared/references/library-policy.md,
../../_shared/references/security-redaction.md, and ../../_shared/references/architecture-patterns.md.
