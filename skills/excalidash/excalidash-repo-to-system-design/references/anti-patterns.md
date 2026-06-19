# Repo to System Design — Anti-Patterns

Failure modes specific to turning a structured repository analysis into a framed, flow-routed
system-design diagram, why each is wrong, and the fix. If a draft trips any of these, repair
before scoring closes.

## Sourcing & grounding

### 1. Inventing nodes the analysis never had
**Symptom**: a "Cache" or "CDN" appears that is in no section of the model.
**Why wrong**: the diagram must be the *as-built* system from the analysis, not an idealized one.
Invented nodes mislead reviewers who know the repo.
**Fix**: draw only nodes present in the model; surface gaps via `suggest_architecture_improvements`
as suggestions, not as silently-added nodes.

### 2. Feeding prose instead of the rich model
**Symptom**: `create_from_repo_analysis` called with a paragraph string, or the analysis has no
typed sections and no `flows`.
**Why wrong**: this tool's value is consuming the structured model (zones + flows). Prose loses the
zone assignment and flow routing.
**Fix**: if only prose exists, run the analysis first, or use the `create_diagram_from_prompt`
zone+flow fallback — do not stuff prose into the analysis tool.

### 3. Dangling flow endpoints
**Symptom**: a flow step references a `from`/`to` node that exists in no section.
**Why wrong**: the arrow has no real endpoint; `validate_architecture` flags an orphan/edge error.
**Fix**: ensure every flow-step endpoint is a declared node before generating; add the missing node
to its section or drop the step.

## Zones & framing

### 4. Flattening everything into one zone (no frames)
**Symptom**: services, queues, databases and integrations all sit loose on one canvas, no zone frames.
**Why wrong**: the whole point is one frame per zone (Client / Edge / Services / Async / Data /
External / Cross-cutting) so the system reads at a glance.
**Fix**: regenerate with `layout: { framesPerZone: true }`; place each node in its zone frame.

### 5. Integrations drawn inside a service zone
**Symptom**: Stripe / SendGrid / Auth0 sit inside the Services frame.
**Why wrong**: third parties are external; placing them inside the system implies you own/deploy them.
`validate_architecture` flags `integrationsInExternal < count(integrations)`.
**Fix**: move every integration into the External zone on the right margin; style distinctly.

### 6. Nodes spilling outside their zone frame
**Symptom**: `ITEM_OUTSIDE_FRAME`; a database is half-clipped by the Data frame edge.
**Why wrong**: a node half-in/half-out is ambiguous and a hard blocker.
**Fix**: `repair_drawing` to nudge the node inward (>= 16px inner padding) or enlarge the frame.

### 7. Zone title overlapping a node or the legend header
**Symptom**: `FRAME_TITLE_OVERLAP`; the "Services" band title sits on the top-row service, or the
legend header collides with the diagram title.
**Why wrong**: title bands must stay title-only; overlap is unreadable and a hard blocker.
**Fix**: reserve a title band per zone; place the first node row below it; keep the legend in its
own corner block.

## Flows, routing & labels

### 8. Request and event flows look identical
**Symptom**: synchronous request paths and asynchronous event paths use the same line style.
**Why wrong**: the analysis distinguishes `kind: "request"` vs `kind: "event"`; collapsing them
hides the async boundary, which is the most important thing a system design conveys.
**Fix**: render request flows solid and event flows dashed (or distinct color); key both in the legend.

### 9. Flow label sitting under its line
**Symptom**: `ARROW_TEXT_INTERSECTION`; a step label ("routes /orders") is overdrawn by the arrow.
**Why wrong**: the label is unreadable and it is a hard blocker.
**Fix**: move the label into the side lane beside the line with 32px clearance; keep endpoints fixed.

### 10. Arrows routed straight through nodes
**Symptom**: a flow line passes over another service's or store's body.
**Why wrong**: it reads as a connection that doesn't exist and clutters the zones.
**Fix**: route lines through the reserved >= 32px row/column gutters; never cross a card.

### 11. Bare "uses" edges with no protocol
**Symptom**: every flow step says "uses" or has no protocol.
**Why wrong**: a system design's value is *how* parts talk (HTTPS/JSON, SQL, Kafka, OAuth). Bare
"uses" loses that.
**Fix**: label each step with verb + protocol ("calls over HTTPS/JSON", "reads/writes via SQL",
"publishes to topic", "authenticates via OAuth").

### 12. Crossed Kafka producer/consumer lines at a queue
**Symptom**: the service->topic and topic->worker lines cross at the queue.
**Why wrong**: ambiguous direction and an `ARROW_TEXT_INTERSECTION` near the broker.
**Fix**: enter the queue from one side (producers), exit the other (consumers); separate gutters.

## Node typing & cross-cutting

### 13. Databases or queues drawn as plain service boxes
**Symptom**: "Orders DB" / "order-events" rendered as rectangles identical to services.
**Why wrong**: stores must read as stores and queues as queues; under `required` mode this is a
policy violation.
**Fix**: use `database-symbol` for stores and a queue/broker icon for queues; place "store" and
"queue" in the legend.

### 14. Workers floating away from their queues
**Symptom**: the Fulfillment Worker sits in the Services band, far from the topic it consumes.
**Why wrong**: the async relationship is lost; the consume edge crosses the whole canvas.
**Fix**: place workers in the Async zone adjacent to the queues they consume; route the consume
edge within that zone.

### 15. Auth or observability drawn as a flow node
**Symptom**: "OTel" or "Auth0" inserted as a hop in the request flow, or a secret value on the auth
card.
**Why wrong**: auth and observability are cross-cutting; observability is not a request hop, and a
secret value must never appear.
**Fix**: put auth (scheme + key badge) and observability (glyph) in the Cross-cutting band; show the
*concept* (OAuth/JWT, traces/metrics) not the value. Auth may attach to the Edge as an
"authenticates via OAuth" edge, not as a mid-flow node.

### 16. Risks rendered as standalone nodes
**Symptom**: a "no read replica" risk becomes its own box in a zone.
**Why wrong**: risks annotate existing nodes; standalone risk boxes distort the topology.
**Fix**: attach risks as badges/callouts on the relevant node (e.g. a warning badge on Billing DB).

## Library & layout

### 17. Off-policy or over-detailed icons
**Symptom**: an icon from an arbitrary public library, or a busy multi-color logo, lowers the score
(`HIGH_DENSITY`, preset clash).
**Why wrong**: violates `MCP_LIBRARY_MODE = curated`; noise hurts the score.
**Fix**: pull only from the curated packs (Software Architecture, Technology Logos, Cloud/DevOps,
Database/Data Platform); normalize stroke/fill; reject anything that lowers the score and fall back
to a primitive. Record the rejection.

### 18. Crowded zones (HIGH_DENSITY)
**Symptom**: nodes packed with < 48px gaps; no room for flow gutters.
**Why wrong**: flows cannot route cleanly and density penalties pile up; a big monorepo overflows.
**Fix**: lay out roomy zones with >= 48px node gaps and >= 32px flow lanes; if still dense, split
the system into focused views (Context / per-domain) and cross-reference shared node names.

### 19. Content hugging the export edge
**Symptom**: `TEXT_NEAR_EDGE`; the External zone or legend touches the canvas bound.
**Fix**: keep all content >= 40px from canvas/export bounds.

## Security

### 20. Live `.env` value on a card
**Symptom**: a label reads `postgres://app:<password>@db/orders`, an Auth0 client secret, or a Stripe
key from the analysis.
**Why wrong**: a repo analysis carries real `.env` values; system designs are exported/embedded and
leak them.
**Fix**: redact in the model BEFORE the create call -> `postgres://app:[REDACTED_DATABASE_URL]@db/orders`,
`[REDACTED_PROVIDER_KEY]`, `[REDACTED_API_KEY]`; re-scan the export. Show the *concept*, never the value.

## Quality loop

### 21. Skipping repair / accepting score < 95
**Symptom**: saving at 90 with a remaining penalty "because it looks fine".
**Why wrong**: repair is mandatory below 95 or with any blocker.
**Fix**: run the lint -> score -> repair loop until `score >= 95` and `hardBlockers == []`.

### 22. Keeping a repair/polish pass that lowered the score
**Symptom**: a polish pass reflowed the zones and dropped the score below the checkpoint.
**Why wrong**: every pass must be monotonic-up or be rolled back.
**Fix**: restore the last `save_version` checkpoint and apply a smaller, targeted fix.

See `./checklist.md`, `./examples.md`, and the shared references under `../../_shared/references/`.
