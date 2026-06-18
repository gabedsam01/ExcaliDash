# C4 Container — Anti-Patterns

Failure modes specific to C4 Level 2 (Container) diagrams, why each is wrong, and the fix. If a
draft trips any of these, repair before scoring closes.

## Level confusion

### 1. Drawing components instead of containers
**Symptom**: a "container" is actually a controller, service class, repository, or React component
("OrdersController", "PaymentService", "UserRepository").
**Why wrong**: those are Level-3 components; a container is a separately runnable/deployable unit
(a web app, an API process, a database, a queue). `validate_architecture` flags `componentLeak`.
**Fix**: collapse classes into their owning container ("Orders API"); move the internals to a
separate C4 **Component** diagram.

### 2. Flattening to a context diagram
**Symptom**: only the central system box and its neighbors appear — no internal apps/APIs/stores.
**Why wrong**: that is Level 1; the request asked to look *inside* the box.
**Fix**: expand the central system into its containers inside a boundary frame, or use
`convert_diagram_type({ targetType: "c4_container" })` on the existing context drawing.

### 3. Showing two systems' internals on one canvas
**Symptom**: two boundary frames, each fully exploded into containers, on one diagram.
**Why wrong**: a container diagram has exactly one boundary in scope; the other system is external
(a single box outside the boundary).
**Fix**: one container diagram per system; render the other as an external system.

## Boundary & framing

### 4. Containers spilling outside the boundary frame
**Symptom**: `ITEM_OUTSIDE_FRAME`; a container is half-clipped by the boundary edge.
**Why wrong**: every in-scope container must be fully inside the boundary; partial containment is
ambiguous and a hard blocker.
**Fix**: `repair_drawing` to nudge the container inward or enlarge the frame; keep >= 16px inner
padding.

### 5. External systems drawn inside the boundary
**Symptom**: Stripe / SendGrid / IdP sit inside the system-boundary frame.
**Why wrong**: external systems are out of scope; placing them inside implies you own/deploy them.
**Fix**: move every external system outside the frame and style it distinctly (lighter fill).

### 6. Boundary title overlapping a container or legend header
**Symptom**: `FRAME_TITLE_OVERLAP`; the boundary label sits on top of the top-row container or the
legend header collides with the diagram title.
**Why wrong**: title bands must stay title-only; overlap is unreadable and a hard blocker.
**Fix**: reserve a title band at the top of the frame; place the first container row below it;
keep the legend header in its own corner block.

## Edges, routing & labels

### 7. Arrows routed straight through container cards
**Symptom**: an interaction line passes over another container's body.
**Why wrong**: it reads as a connection that doesn't exist and clutters the grid.
**Fix**: route lines through the reserved >= 32px row/column gutters; never cross a card.

### 8. Interaction label sitting under its line
**Symptom**: `ARROW_TEXT_INTERSECTION`; the protocol label is overdrawn by the routed arrow.
**Why wrong**: the label is unreadable and it is a hard blocker.
**Fix**: move the label into the side lane beside the line with 32px clearance; keep endpoints
fixed.

### 9. Edges without a protocol/technology
**Symptom**: every arrow just says "uses" or has no label.
**Why wrong**: a container diagram's value is *how* containers talk (HTTPS/JSON, JDBC, gRPC,
Kafka, SMTP). Bare "uses" loses that.
**Fix**: label each edge with verb + protocol ("calls over HTTPS/JSON", "reads/writes via JDBC",
"publishes to topic").

### 10. Crossed Kafka pub/sub lines (producer and consumer overlapping)
**Symptom**: the API->bus and bus->worker lines cross at the queue.
**Why wrong**: produces ambiguous direction and an `ARROW_TEXT_INTERSECTION` near the broker.
**Fix**: enter the queue from one side (producers) and exit the other (consumers); give each its
own gutter lane.

## Node typing & icons

### 11. Datastores drawn as plain boxes
**Symptom**: "Database" / "Cache" / "S3" rendered as rectangles identical to services.
**Why wrong**: stores must read as stores; under `required` mode this is a policy violation.
**Fix**: use the `database-symbol` slot (cylinder/db glyph) for relational/document/cache/warehouse.

### 12. Queues indistinguishable from services
**Symptom**: "Event Bus" / "Kafka" / "SQS" look like an API card.
**Why wrong**: a queue is a distinct container type; conflating it hides the async boundary.
**Fix**: use a queue/broker icon and place "queue" in the legend.

### 13. Off-policy or over-detailed icons
**Symptom**: an icon from an arbitrary public library, or a busy multi-color glyph, lowers the
score (`HIGH_DENSITY`, preset clash).
**Why wrong**: violates `MCP_LIBRARY_MODE = curated`; noise hurts the score.
**Fix**: pull only from the curated packs (C4 Architecture, Software Architecture, Database/Data
Platform, Technology/Cloud logos); normalize stroke/fill; reject anything that lowers the score
and fall back to a primitive. Record the rejection.

## Layout & legend

### 14. No legend / undefined container types
**Symptom**: viewers can't tell an app from an API from a store from a queue.
**Why wrong**: the diagram relies on shape/color conventions that go unexplained.
**Fix**: add a legend keying app / API / store / queue / external in a corner `legend` block.

### 15. Crowded grid (HIGH_DENSITY)
**Symptom**: containers packed with < 48px gaps; no room for gutters.
**Why wrong**: arrows cannot route cleanly and density penalties pile up.
**Fix**: lay out in a roomy grid — front-ends top, APIs middle, stores/queues bottom — with
>= 48px container gaps and >= 32px arrow lanes.

### 16. Content hugging the export edge
**Symptom**: `TEXT_NEAR_EDGE`; a corner container or the legend touches the canvas bound.
**Fix**: keep all content >= 40px from canvas/export bounds.

## Security

### 17. Live connection string on a datastore card
**Symptom**: a label reads `postgres://app:<password>@db/orders` or a broker card shows SASL creds.
**Why wrong**: container diagrams are exported/embedded; a live secret leaks.
**Fix**: redact BEFORE the create call -> `postgres://app:[REDACTED_DATABASE_URL]@db/orders`;
re-scan the export. Show the *concept* of a credential, never the value.

## Quality loop

### 18. Skipping repair / accepting score < 95
**Symptom**: saving at 90 with a remaining penalty "because it looks fine".
**Why wrong**: repair is mandatory below 95 or with any blocker.
**Fix**: run the lint -> score -> repair loop until `score >= 95` and `hardBlockers == []`.

### 19. Keeping a repair/polish pass that lowered the score
**Symptom**: a polish pass reflowed the grid and dropped the score below the checkpoint.
**Why wrong**: every pass must be monotonic-up or be rolled back.
**Fix**: restore the last `save_version` checkpoint and apply a smaller, targeted fix.

See `./checklist.md`, `./examples.md`, and the shared references under `../../_shared/references/`.
