# Event-Driven Diagrammer — Anti-Patterns

Mistakes that wreck an event-driven diagram, why each is wrong, and the fix. Content errors
(topology / edge semantics) are hard failures; geometry errors are blockers; the rest are penalties.

---

## Content / topology anti-patterns (hard failures — `validate_architecture` must reject)

### 1. Direct producer -> consumer edge (bypassing the bus)
- **Wrong**: `OrderService -> ShippingService` drawn as a direct arrow.
- **Why**: it defeats the entire point of event-driven architecture — the bus is what decouples
  producers from consumers. A direct edge is point-to-point coupling, not pub-sub.
- **Fix**: route through the bus — `OrderService` publishes `OrderPlaced` to a topic (dashed async);
  `ShippingService` subscribes to that topic (dashed async). No producer ever names a consumer.

### 2. Solid arrow for an event (wrong edge semantics)
- **Wrong**: a producer->bus or bus->consumer edge drawn solid like a request/response call.
- **Why**: events are fire-and-forget and asynchronous; a solid edge implies a synchronous,
  blocking call with a return — the opposite of what is happening.
- **Fix**: make every producer->bus and bus->consumer edge **dashed** (`strokeStyle: "dashed"`),
  single-headed. Reserve solid edges for genuine request/response (e.g. a consumer calling an
  external sync API) and the bus->event-store persist edge.

### 3. Missing or unkeyed sync/async legend
- **Wrong**: dashed and solid edges both appear but nothing explains the difference.
- **Why**: the reader cannot tell async from sync; the visual distinction is meaningless without a key.
- **Fix**: add a `legend` block keying BOTH lines: "solid = synchronous (request/response)" and
  "dashed = asynchronous (event/pub-sub)". The legend is not optional for this skill.

### 4. Orphan topic (produced, never consumed) or dead subscription (consumed, never produced)
- **Wrong**: `OrderPlaced` is published but no consumer subscribes; or a consumer subscribes to
  `LegacyEvent` that nobody emits.
- **Why**: an orphan topic is wasted work or a missing integration; a dead subscription is a no-op
  handler. Both signal a broken event contract.
- **Fix**: every topic/event must have >= 1 producer AND >= 1 consumer. Surface via
  `suggest_architecture_improvements`; either add the missing side or mark the event deprecated.

### 5. No central bus / multiple competing hubs
- **Wrong**: producers wire to a tangle of queues with no single broker, or two brokers both act as hubs.
- **Why**: the topology becomes unreadable and the decoupling boundary is lost.
- **Fix**: exactly one event bus / broker hub in the center; all topics live on it. If there are
  genuinely two brokers, draw a bridge/connector between them, not two parallel hubs.

### 6. No event store for an event-sourced claim
- **Wrong**: the system is described as event-sourced but there is no durable event log.
- **Why**: event sourcing requires the event store to be the source of truth; without it the diagram
  misrepresents the architecture.
- **Fix**: add an event store / topic log node with a solid persist edge from the bus and mark it as
  source of truth.

---

## Geometry / lint anti-patterns (hard blockers — `lint_drawing` must end empty)

### 7. Arrow over text on fan-out (`ARROW_TEXT_INTERSECTION`) — the #1 risk here
- **Wrong**: with one event fanning out to many consumers, a dashed line crosses a topic name or an
  event label.
- **Why**: fan-out produces many near-parallel lines; routed carelessly they slice through labels.
- **Fix**: reserve >= 32px gutters between every service row and the bus; route each dashed line in
  its own lane; place topic/event labels beside (not under) their line. Run `repair_drawing({ save:
  true, createVersion: true })` to reroute the lines through the gutter, then re-lint and re-score.

### 8. Overlapping headers (`FRAME_TITLE_OVERLAP`)
- **Wrong**: the diagram title collides with the "Producers / Publishers" or "Consumers /
  Subscribers" lane header, or the legend header sits on a card.
- **Fix**: keep the title, both lane headers, and the legend header title-only and spaced apart;
  do not let any header overlap a card or another header.

### 9. Service or topic stub spilling out (`ITEM_OUTSIDE_FRAME` / `TEXT_NEAR_EDGE`)
- **Wrong**: a consumer card or a topic stub straddles the lane/canvas edge, or text sits < 40px from
  the export bound.
- **Fix**: keep every service fully inside its lane, every topic stub on the bus face, and all
  content >= 40px from canvas/export bounds.

---

## Style / penalty anti-patterns (cost points, fix to reach >= 95)

### 10. Icon clutter on producer/consumer cards
- **Wrong**: stacking multiple logos/glyphs on each service card.
- **Why**: HIGH_DENSITY penalty; the bus logo and topic badges carry the meaning.
- **Fix**: one glyph per service card; keep the broker logo on the bus and topic badges on the stubs.

### 11. Polish silently flips a dashed edge to solid
- **Wrong**: `auto_polish_drawing` normalizes stroke styles and turns async edges solid.
- **Fix**: after polish, re-verify edge styles; re-apply `dashed` to any flipped async edge and
  re-score. Roll back the polish pass if it dropped the score.

### 12. Wrong skill for the question
- **Wrong**: using this skill for one ordered scenario (-> sequence diagram), a command/query model
  split (-> CQRS), runnable apps with mostly sync calls (-> C4 Container), or ports/adapters (-> Hexagonal).
- **Fix**: use this skill only when the *event flow* (producers, bus, topics, consumers) is the
  subject. See the "When NOT to use" section of `../SKILL.md`.

---

## Secret-leak anti-patterns (never ship)

### 13. Raw broker SASL creds / client keys in labels
- **Wrong**: `sasl: svc:<password>@broker:9092` or `<access key>` printed on the bus/producer card.
- **Fix**: redact BEFORE the tool call — `sasl: svc:[REDACTED_PROXY_SECRET]@broker:9092`,
  `[REDACTED_PROVIDER_KEY]` — and re-scan the export. Show the concept (a key icon, "Kafka SASL/SSL"),
  not the value. See `../../_shared/references/security-redaction.md`.
