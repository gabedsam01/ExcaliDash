# Hexagonal (Ports & Adapters) — Anti-Patterns

Failure modes specific to ports-and-adapters diagrams, why each is wrong, and the fix. If a draft
trips any of these, repair before scoring closes.

## Core & region confusion

### 1. An adapter or framework sitting in the core
**Symptom**: the center hexagon holds "OrderController", "JpaRepository", "Spring", or a Postgres
logo instead of domain + application services.
**Why wrong**: the core is technology-agnostic domain logic; an adapter/framework in the center
inverts the whole pattern. `validate_architecture` flags `frameworkInCore`.
**Fix**: move controllers to the LEFT driving lane, repositories/clients to the RIGHT driven lane,
and keep only domain entities, value objects, and application services in the hexagon.

### 2. Concentric rings instead of a hexagon with left/right lanes
**Symptom**: the draft is nested rings (Entities -> Use Cases -> Adapters -> Frameworks) with no
driving/driven split.
**Why wrong**: that is Clean/Onion, a different diagram. Hexagonal is a center core with ports on
the boundary and adapters flanking left (driving) and right (driven).
**Fix**: switch to the Clean Architecture Reviewer skill, or `convert_diagram_type({ targetType:
"hexagonal" })` to flatten the rings into a hexagon with explicit driving/driven lanes.

### 3. Two cores on one canvas
**Symptom**: two hexagons each with their own adapters on one diagram.
**Why wrong**: a hexagonal diagram has exactly one core in scope; the other application is an
external system reached through a driven adapter/port.
**Fix**: one hexagon per application; render the other as a driven adapter (e.g. an HTTP client
implementing an output port).

## Ports

### 4. Adapters wired straight to the domain (no port)
**Symptom**: an arrow runs from "REST OrderController" directly onto the "Order" entity, or from
"PlaceOrderService" directly onto "JpaOrderRepository".
**Why wrong**: ports are the contract; bypassing them couples adapters to internals and breaks
substitutability.
**Fix**: route the driving adapter onto a driving port (PlaceOrderUseCase) and the core onto a
driven port (OrderRepository); the driven adapter then *implements* that port.

### 5. Driven ports placed on the wrong side / owned by the adapter
**Symptom**: the OrderRepository port lives in the right-side adapter card, or driven ports appear
on the left face.
**Why wrong**: the core OWNS its output ports; they belong on the right boundary face, and the
adapter only implements them.
**Fix**: put driving (input) ports on the LEFT face, driven (output) ports on the RIGHT face, both
as stubs on the hexagon boundary; the adapter points in to bind/implement.

### 6. Unbound or orphan port
**Symptom**: a port stub with no adapter, or an adapter with no port.
**Why wrong**: a dead port/adapter signals an incomplete or wrong model; `validate_architecture`
flags `unboundPorts` / `orphans`.
**Fix**: bind every driving adapter to a driving port and every driven adapter to a driven port,
or remove the dead element.

## Dependency direction (inversion)

### 7. An outward-pointing edge (core -> adapter)
**Symptom**: an arrow from "PlaceOrderService" (core) to "JpaOrderRepository" (driven adapter).
**Why wrong**: this is the cardinal hexagonal sin — the core depends on infrastructure. It is a
hard architecture failure, not a style nit. `validate_architecture` reports it in `outwardEdges`.
**Fix**: invert it — the core depends on the OrderRepository driven PORT it owns; the adapter
points LEFT to implement that port. Re-route through the right-lane gutter.

### 8. Driving adapter wired directly to a driven adapter
**Symptom**: "REST OrderController" connects straight to "StripePaymentClient", skipping the core.
**Why wrong**: the application core must mediate; a controller calling infrastructure directly is a
transaction-script leak, not ports & adapters.
**Fix**: controller -> driving port -> core application service -> driven port -> driven adapter.

### 9. Arrows pointing away from the hexagon
**Symptom**: driven-side arrows point right (away from the core) or driving-side arrows point left.
**Why wrong**: all dependency arrows point TOWARD the hexagon; reversed arrows misread the
direction of control vs. dependency.
**Fix**: driving adapters point RIGHT into driving ports; driven adapters point LEFT to implement
driven ports; the core points RIGHT only to a driven port it owns.

## Edges, routing & labels

### 10. "implements" / port label sitting under its line
**Symptom**: `ARROW_TEXT_INTERSECTION`; the "implements" or port-name label is overdrawn by the
routed arrow.
**Why wrong**: the label is unreadable and it is a hard blocker.
**Fix**: move the label into the side lane beside the line with 32px clearance; keep endpoints fixed.

### 11. Arrows routed straight through adapter cards
**Symptom**: a binding line passes over another adapter's body in the same column.
**Why wrong**: it reads as a connection that doesn't exist and clutters the lane.
**Fix**: route through the reserved >= 32px gutters between adapter rows; never cross a card.

## Node typing & icons

### 12. Driven DB adapters drawn as plain boxes
**Symptom**: "JpaOrderRepository" / "Redis cache adapter" rendered as rectangles identical to
clients.
**Why wrong**: stores must read as stores; under `required` mode this is a policy violation.
**Fix**: use the `database-symbol` slot (cylinder/db glyph) for relational/document/cache driven
adapters.

### 13. SaaS/framework logo inside the core
**Symptom**: a Stripe or Postgres logo sits inside the hexagon.
**Why wrong**: branded technology belongs on the *adapter* that wraps it; in the core it implies
the domain knows the vendor — a content error.
**Fix**: place the logo on the driven adapter card (`inside-card-left`/`cloud-provider`); keep the
core icon-light.

### 14. Off-policy or over-detailed icons
**Symptom**: an icon from an arbitrary public library, or a busy multi-color glyph, lowers the
score (`HIGH_DENSITY`, preset clash).
**Why wrong**: violates `MCP_LIBRARY_MODE = curated`; noise hurts the score.
**Fix**: pull only from the curated packs (Software Architecture, Architecture diagram components,
Technology/Software Logos); normalize stroke/fill; reject anything that lowers the score and fall
back to a primitive. Record the rejection.

## Layout & legend

### 15. Driving and driven sides swapped or mixed
**Symptom**: a REST controller in the right lane, or a DB repository in the left lane, or both
mixed into one column.
**Why wrong**: the left/right split IS the diagram's primary signal (who drives vs. who is driven).
**Fix**: driving (primary) adapters strictly LEFT; driven (secondary) adapters strictly RIGHT.

### 16. No legend / undefined port & adapter roles
**Symptom**: viewers can't tell a driving port from a driven port, or primary from secondary.
**Why wrong**: the diagram relies on side/shape conventions that go unexplained.
**Fix**: add a legend keying driving/primary, driven/secondary, port, and "implements" in a corner
`legend` block.

### 17. Lane header overlapping a card or the legend
**Symptom**: `FRAME_TITLE_OVERLAP`; the "Driving / Primary" or "Driven / Secondary" header sits on
top of the top adapter card or the legend header.
**Why wrong**: title bands must stay title-only; overlap is unreadable and a hard blocker.
**Fix**: reserve a title band at the top of each lane; place the first adapter below it; keep the
legend header in its own corner block.

### 18. Content hugging the export edge
**Symptom**: `TEXT_NEAR_EDGE`; the outermost adapter or the legend touches the canvas bound.
**Fix**: keep all content >= 40px from canvas/export bounds.

## Security

### 19. Live connection string / SaaS key on a driven adapter card
**Symptom**: a label reads `postgres://app:<password>@db/orders`, a card shows `sk_live_...`, or a
webhook adapter shows `whsec_...`.
**Why wrong**: hexagonal diagrams are exported/embedded; the driven side is the leak surface.
**Fix**: redact BEFORE the create call -> `postgres://app:[REDACTED_DATABASE_URL]@db/orders`,
`[REDACTED_API_KEY]`, `[REDACTED_WEBHOOK_SECRET]`; re-scan the export. Show the *concept* of a
credential, never the value.

## Quality loop

### 20. Skipping repair / accepting score < 95
**Symptom**: saving at 90 with a remaining penalty "because it looks fine".
**Why wrong**: repair is mandatory below 95 or with any blocker.
**Fix**: run the lint -> score -> repair loop until `score >= 95` and `hardBlockers == []`.

### 21. Keeping a repair/polish pass that lowered the score
**Symptom**: a polish pass reflowed the lanes and dropped the score below the checkpoint.
**Why wrong**: every pass must be monotonic-up or be rolled back.
**Fix**: restore the last `save_version` checkpoint and apply a smaller, targeted fix.

See `./checklist.md`, `./examples.md`, and the shared references under `../../_shared/references/`.
