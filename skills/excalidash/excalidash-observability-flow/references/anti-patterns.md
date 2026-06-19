# Observability Flow — Anti-Patterns

Failure modes specific to logs/metrics/traces observability data-flow diagrams, why each
is wrong, and the fix. If a draft trips any of these, repair before scoring closes. Hard
blockers (`ARROW_TEXT_INTERSECTION`, `FRAME_TITLE_OVERLAP`, `ITEM_OUTSIDE_FRAME`) cap the
score below 95 regardless of other quality.

## Signal modeling

### 1. Collapsing all three signals into one undifferentiated edge
**Symptom**: a single "telemetry" arrow from services to one "observability" box.
**Why wrong**: metrics, logs and traces have different pipelines, storage and query
patterns; merging them hides the whole point of the diagram.
**Fix**: fan the collector out into three labeled pipelines (Metrics, Logs, Traces), each
to its own storage backend, each in its own >= 32px lane.

### 2. Wiring services directly to storage, skipping the collector/agent
**Symptom**: "Checkout API → Prometheus" with no collector/scraper in between.
**Why wrong**: it misrepresents the architecture (push vs scrape, batching, backpressure
all live at the collector) and removes the node where the error/backpressure branch
originates.
**Fix**: route every emit through the collector/agent; if a backend scrapes directly, draw
the scrape as a labeled edge *from* the collector, not the service.

### 3. Telemetry edges drawn solid like request edges
**Symptom**: emit/scrape/remote-write edges use the same solid style as a request edge.
**Why wrong**: telemetry is out-of-band; rendering it solid makes it read as the request
path and defeats the legend.
**Fix**: dash every telemetry edge; reserve solid only for an optional request/work path;
key both in the legend.

## Paths & branches

### 4. Alert path originating from a service instead of from stored/queried data
**Symptom**: "Checkout API → Alert" arrow.
**Why wrong**: alerts fire from rules evaluated over stored metrics/logs, not from raw
service emission.
**Fix**: originate the alert path at an alert-rule node reading the metrics store, then
→ Notifier → On-call.

### 5. Missing error/backpressure branch
**Symptom**: the happy path is perfect but there is no path for a full buffer / dropped
telemetry.
**Why wrong**: the task requires the error/backpressure path; without it the diagram
implies telemetry never fails, which is misleading for an on-call audience.
**Fix**: add a decision node at the collector ("buffer full?") → drop/spool → Dead-letter
sink (a Flow Chart terminator), as a distinct branch.

### 6. Backpressure branch looping back into a service
**Symptom**: the drop path arrows back to "Checkout API".
**Why wrong**: dropped telemetry goes to a sink/dead-letter, not back to the emitter;
the loop reads as a retry that does not exist.
**Fix**: terminate the branch in a drop or dead-letter sink; if spool-to-disk retries,
label it explicitly and route to the collector intake, not the service.

### 7. On-call escalation flattened to a single "page someone" box
**Symptom**: Notifier → "On-call" with no escalation.
**Why wrong**: the task asks for escalation; a flat node hides the primary→secondary→
incident progression that the diagram is meant to communicate.
**Fix**: draw Primary → Secondary → Incident as an ordered escalation chain off the notifier.

## Routing & labels (geometry blockers)

### 8. Pipeline lanes too close — dashed edges cross labels
**Symptom**: `ARROW_TEXT_INTERSECTION`; the traces dashed line overdraws the logs edge label.
**Why wrong**: three parallel pipelines packed tighter than 32px collide; a hard blocker.
**Fix**: space the metrics/logs/traces lanes >= 32px apart; move each protocol label into
the side gutter beside its line with 32px clearance.

### 9. Crossed fan-out at the collector
**Symptom**: the three pipeline edges cross each other leaving the collector.
**Why wrong**: ambiguous which signal goes where; produces near-node intersections.
**Fix**: exit the collector top→metrics, middle→logs, bottom→traces in order; do not cross
the lanes.

### 10. Edges without a transport/signal label
**Symptom**: bare arrows with no "OTLP/gRPC", "remote-write", "scrape", "push".
**Why wrong**: a telemetry diagram's value is *how* each signal moves; unlabeled edges lose it.
**Fix**: label each edge with the transport ("OTLP/gRPC", "remote_write", "scrape",
"Loki push", "Slack webhook").

## Framing & density

### 11. Pipeline node poking outside its band
**Symptom**: `ITEM_OUTSIDE_FRAME`; a storage cylinder half-clips the band edge.
**Why wrong**: partial containment is ambiguous and a hard blocker.
**Fix**: enlarge the band or move the node inward; keep >= 16px inner padding below the
40px title band.

### 12. Band/legend title overlapping a node
**Symptom**: `FRAME_TITLE_OVERLAP`; the "Storage" band label sits on the first cylinder,
or the legend header collides with the diagram title.
**Fix**: reserve the top 40px of each band for its title; start nodes below it; keep the
legend in its own corner block.

### 13. Three pipelines crammed into one viewport (HIGH_DENSITY)
**Symptom**: gaps below 48px, no room for gutters, density penalties.
**Why wrong**: three lanes plus storage plus alerting is a lot; cramming hurts the score.
**Fix**: give the lanes room; if it still won't breathe, split into two views (ingest+
storage, then dashboards+alerting) rather than one dense canvas.

### 14. Content hugging the export edge
**Symptom**: `TEXT_NEAR_EDGE`; the on-call chain or legend touches the canvas bound.
**Fix**: keep all content >= 40px from canvas/export bounds.

## Icons & policy

### 15. Storage drawn as plain boxes
**Symptom**: Prometheus/Loki/Tempo rendered as rectangles identical to services.
**Why wrong**: stores must read as stores; under `required` mode this is a policy violation.
**Fix**: use the `database-symbol` / Data Flow data-store slot for each backend.

### 16. Off-policy or busy logos lowering the score
**Symptom**: a multi-color vendor glyph from an arbitrary public library raises
`HIGH_DENSITY` or clashes with the technical-docs preset.
**Why wrong**: violates `MCP_LIBRARY_MODE = curated`; noise hurts the score.
**Fix**: pull only from Cloud/DevOps, Flow Chart Symbols, Data Flow (and a curated logo
pack); normalize stroke/fill; reject anything that lowers the score and fall back to a
primitive. Record the rejection.

### 17. Decision point on the backpressure branch drawn as a rectangle
**Symptom**: "buffer full?" rendered as a process box.
**Why wrong**: a branch point should read as a decision; under `required` mode this is a
policy violation.
**Fix**: use the Flow Chart Symbols decision (diamond) glyph for the branch.

## Security

### 18. Live ingest token / webhook URL on a node or edge
**Symptom**: a collector node label shows `Authorization: Bearer <ingest-token>`, or a notifier
edge shows a full `https://hooks.slack.com/services/<workspace>/<channel>/<token>` URL.
**Why wrong**: observability diagrams are exported and embedded in runbooks; a live secret
leaks to everyone with the runbook.
**Fix**: redact BEFORE the create call → `Bearer [REDACTED_BEARER]`,
`https://hooks.slack.com/services/[REDACTED_WEBHOOK_SECRET]`; re-scan the export. Show the
concept of the credential, never the value.

## Quality loop

### 19. Skipping repair / accepting score < 95
**Symptom**: saving at 90 with a remaining penalty "because it looks fine".
**Why wrong**: repair is mandatory below 95 or with any blocker.
**Fix**: run the lint → score → repair loop until `score >= 95` and `hardBlockers == []`.

### 20. Keeping a repair/polish pass that lowered the score
**Symptom**: a polish pass reflowed the three lanes and dropped the score below the
checkpoint.
**Why wrong**: every pass must be monotonic-up or be rolled back.
**Fix**: restore the last `save_version` checkpoint and apply a smaller, targeted fix
(widen one lane, not all three).

See `./checklist.md`, `./examples.md`, and the shared references under
`../../_shared/references/`.
