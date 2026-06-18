# Microservices Topology — Anti-Patterns

Mistakes that wreck a microservices topology diagram, why each is wrong, and the fix. Content errors
(ownership / topology / edge semantics) are hard failures; geometry errors are blockers; the rest are
penalties.

---

## Content / topology anti-patterns (hard failures — `validate_architecture` must reject)

### 1. Shared database across services
- **Wrong**: `OrderService` and `InventoryService` both connect to one `shared-db`.
- **Why**: it breaks the database-per-service rule — the whole point of microservices is independent
  data ownership and deployability. A shared DB couples the services at the storage layer.
- **Fix**: give each service its OWN datastore inside its OWN frame. If a service needs another's data,
  call its API (solid sync) or react to its event over the bus (dashed async) — never reach into its DB.

### 2. A service reaching into another service's datastore
- **Wrong**: a direct arrow from `ShippingService` to `orders-db` (which `OrderService` owns).
- **Why**: cross-service DB access is the same coupling as a shared DB, hidden as a "shortcut". It
  bypasses the owning service's contract and invariants.
- **Fix**: route the access through the owning service (sync API call, solid) or via an event over the
  bus (dashed). A datastore is touched ONLY by the single service that owns it.

### 3. A service bypassing the gateway
- **Wrong**: an external client arrow goes straight to `PaymentService`, skipping the gateway.
- **Why**: the gateway is the single front door for auth, rate-limiting and routing; a bypass is a
  security and consistency hole.
- **Fix**: every externally-reachable service is fronted by the gateway. If a service is genuinely
  internal-only (no external traffic), draw it without an external edge and note it — do not let
  clients reach it directly.

### 4. Solid arrow for an async message (wrong edge semantics)
- **Wrong**: a service->queue or queue->service event edge drawn solid like an HTTP call.
- **Why**: async messages are fire-and-forget; a solid edge implies a blocking synchronous
  request/response with a return — the opposite of what is happening.
- **Fix**: make every service->bus and bus->service edge **dashed** (`strokeStyle: "dashed"`).
  Reserve solid edges for gateway->service and service->service HTTP/gRPC request/response.

### 5. Missing or unkeyed sync/async legend
- **Wrong**: dashed and solid edges both appear but nothing explains the difference.
- **Why**: the reader cannot tell HTTP/gRPC calls from queue/event messages; the distinction is
  meaningless without a key.
- **Fix**: add a `legend` block keying BOTH: "solid = synchronous (HTTP/gRPC)" and "dashed =
  asynchronous (queue/event)". The legend is not optional for this skill.

### 6. No gateway / multiple competing front doors
- **Wrong**: services wired directly to clients with no gateway, or two gateways both fronting the
  same services.
- **Why**: the front-door boundary is lost; auth/routing responsibility becomes ambiguous.
- **Fix**: exactly one API gateway / edge router at the TOP fronting the services. If there are
  genuinely two edges (e.g. a public gateway + an internal BFF), give each a clear, non-overlapping
  set of services and label both.

### 7. A service with no datastore presented as stateful
- **Wrong**: a service is described as owning data but no store is drawn for it.
- **Why**: the diagram misrepresents where the data lives and who owns it.
- **Fix**: draw the owned store under the service in its frame. If the service is genuinely stateless,
  say so explicitly (label "stateless") rather than leaving an ambiguous gap.

---

## Geometry / lint anti-patterns (hard blockers — `lint_drawing` must end empty)

### 8. Arrow over text on gateway fan-out or async edges (`ARROW_TEXT_INTERSECTION`) — the #1 risk here
- **Wrong**: the gateway's solid fan-out lines or the dashed queue edges cross a service name, a store
  name, or a queue label.
- **Why**: the gateway fans down to many services and the bus connects many of them; routed carelessly
  these lines slice through labels.
- **Fix**: reserve >= 32px gutters between the gateway and the service row, and between services and
  the bus; route each line in its own lane; place service/store/queue labels beside (not under) their
  line. `repair_drawing` with `strategy: "reroute-through-gutter"`.

### 9. Store or service spilling out of its frame (`ITEM_OUTSIDE_FRAME`)
- **Wrong**: a per-service datastore cylinder sits half outside its service frame, or a service card
  straddles the row/canvas edge.
- **Why**: ownership is read from the frame; a store outside its frame breaks the database-per-service
  visual.
- **Fix**: keep each service + its store fully inside its bounded-service frame; keep the gateway and
  bus fully on the canvas.

### 10. Overlapping titles / frame titles / row header (`FRAME_TITLE_OVERLAP`)
- **Wrong**: the diagram title collides with a service-frame title, or the "Services" row header sits
  on a card, or the legend header overlaps the bus.
- **Fix**: keep the diagram title, each frame title, the row header, and the legend header title-only
  and spaced apart; no header overlaps a card or another header.

### 11. Content near the export edge (`TEXT_NEAR_EDGE`)
- **Wrong**: the bus label or an outer service sits < 40px from the export bound.
- **Fix**: keep all content >= 40px from canvas/export bounds.

---

## Style / penalty anti-patterns (cost points, fix to reach >= 95)

### 12. Icon clutter on service cards
- **Wrong**: stacking the runtime logo, a DB logo, a cache logo and a queue logo all on one service card.
- **Why**: HIGH_DENSITY penalty; the store sits in its own node and the bus carries the broker logo.
- **Fix**: one primary glyph per service card (plus at most a small cache `badge`); put the
  `database-symbol` on the store node and the broker logo on the bus.

### 13. Polish merges two service frames or flips a dashed edge to solid
- **Wrong**: `auto_polish_drawing` nudges two adjacent service frames into one, or normalizes stroke
  styles and turns async edges solid.
- **Fix**: after polish, re-verify each service has its own frame and re-check edge styles; re-apply
  `dashed` to any flipped async edge and re-score. Roll back the polish pass if it dropped the score.

### 14. Chatty synchronous chain that should be async
- **Wrong**: a long solid chain `A -> B -> C -> D` of blocking calls per request.
- **Why**: it couples availability and latency across all four services (a distributed monolith).
- **Fix**: surface via `suggest_architecture_improvements`; where appropriate convert hops to async
  events over the bus (dashed) so services are decoupled.

### 15. Wrong skill for the question
- **Wrong**: using this skill for the event flow itself (-> Event-Driven), a command/query split
  (-> CQRS), bounded contexts / a context map (-> DDD), one container's internals (-> C4 Container),
  ports/adapters (-> Hexagonal), or a single deployable with internal modules (modular-monolith).
- **Fix**: use this skill only when service ownership + the gateway-fronted topology
  (gateway, services row, database-per-service, async bus) is the subject. See "When NOT to use" in
  `../SKILL.md`.

---

## Secret-leak anti-patterns (never ship)

### 16. Raw per-service DB connection strings or gateway/broker creds in labels
- **Wrong**: `postgres://app:<password>@orders-db/orders` on a store card, `[REDACTED_PROVIDER_KEY]` on the gateway,
  or RabbitMQ `sasl: svc:<password>@broker:5672` on the bus.
- **Fix**: redact BEFORE the tool call — `postgres://app:[REDACTED_DATABASE_URL]@orders-db/orders`,
  `[REDACTED_PROVIDER_KEY]`, `sasl: svc:[REDACTED_PROXY_SECRET]@broker:5672` — and re-scan the export.
  Show the concept (a key icon, "orders-db (Postgres)"), not the value.
  See `../../_shared/references/security-redaction.md`.
