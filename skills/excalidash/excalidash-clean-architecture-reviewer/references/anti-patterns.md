# Clean Architecture Reviewer — Anti-Patterns

What goes wrong when a Clean (Onion) architecture diagram breaks the Dependency Rule, blurs the
rings, skips the quality loop, or mishandles libraries/secrets. Each item gives the failure, why it
hurts, and the correct move.

## Dependency Rule & ring direction

### Outward-pointing dependency (the cardinal sin)
**Failure**: an arrow from an inner ring to an outer ring — e.g. `Order` (Entities) -> `SqlOrderRepository`
(Adapters), or a use case -> a framework.
**Why it hurts**: it inverts the entire point of Clean Architecture. The core now compiles against
infrastructure, so the domain cannot be tested or reused without the DB/framework, and a change in
the outer ring ripples inward.
**Fix**: introduce a **port** in the inner ring and depend on it; have the outer adapter implement
(point inward to) the port. This is a hard `validate_architecture` failure (`outwardEdges > 0`),
not a style nit.

### Inward arrow landing on a concrete entity
**Failure**: an adapter arrow points inward but terminates on a concrete `Order` instead of on a
port/interface.
**Why it hurts**: the outer ring now couples to a specific inner class rather than an abstraction;
swapping implementations or testing in isolation breaks.
**Fix**: terminate inward arrows on a port/interface owned by the Use Cases (or Entities) ring;
keep the concrete entity reachable only through that abstraction.

### Skipping the port, calling the framework directly
**Failure**: a use case calls `Email` / `Stripe` / `PostgreSQL` directly with no output port.
**Why it hurts**: the application ring depends on a driver, violating the Dependency Rule and making
the use case untestable without the real service.
**Fix**: add an output port (e.g. `Notifier`, `PaymentGateway`, `OrderRepository`) in the Use Cases
ring; the adapter implements it inward. `suggest_architecture_improvements` flags this directly.

## Ring membership & purity

### Framework or ORM type inside the core
**Failure**: an `@Entity` ORM annotation, an HTTP request type, or a vendor logo placed in the
Entities (or Use Cases) ring.
**Why it hurts**: the core stops being framework-free; the "enterprise business rules" now drag in
infrastructure and cannot be reused across delivery mechanisms.
**Fix**: keep Entities and Use Cases icon-light and framework-free; push ORM/HTTP/SaaS to the
Frameworks & Drivers ring and reach them via adapters. A framework logo in the core is a content
error, not a decoration choice.

### Node straddling two rings
**Failure**: a card half inside Use Cases and half inside Interface Adapters (triggers
`ITEM_OUTSIDE_FRAME`).
**Why it hurts**: the node's ring — and therefore its allowed dependencies — becomes ambiguous; the
diagram can no longer prove the Dependency Rule.
**Fix**: assign each node to exactly one ring; pull it fully inside that ring's frame with padding.

### Collapsing four rings into "layers" that don't match Clean
**Failure**: relabeling generic 3-tier layers (UI / Business / Data) as if they were Clean rings.
**Why it hurts**: 3-tier dependencies flow UI -> Business -> Data (outer to inner-ish but Data is
not the core); Clean puts Entities at the center and inverts I/O via ports. Mixing the two models
loses the Dependency Rule guarantee.
**Fix**: use the four canonical rings (Entities, Use Cases, Interface Adapters, Frameworks &
Drivers) with inward-only edges; do not rename a 3-tier diagram into Clean.

## Wrong diagram type

### Drawing a hexagon and calling it Clean
**Failure**: rendering ports-and-adapters as a hexagon with named driving/driven sides, then
labeling it "Clean Architecture".
**Why it hurts**: the two are related but distinct visual contracts; reviewers expecting concentric
rings (and the Dependency-Rule legend) get a different layout, and tooling validates the wrong shape.
**Fix**: if the request is ports-and-adapters, use the **hexagonal** preset
(`apply_architecture_skill({ pattern: "hexagonal" })`). Use this skill only for concentric Clean
rings.

### Putting deployable containers or bounded contexts on the rings
**Failure**: dropping "Web App", "API", "PostgreSQL" as first-class boxes (that's C4 Container) or
bounded-context frames with context-map relationships (that's DDD) into the rings.
**Why it hurts**: the diagram answers a different question and loses the layered-dependency focus.
**Fix**: hand off runnable apps/APIs/stores to the **C4 Container** skill and bounded contexts to a
**DDD** skill; keep this diagram about code-dependency direction across the four rings.

## Quality loop & validation

### Declaring done below 95 or with blockers
**Failure**: saving while `score < 95` or with a non-empty `hardBlockers` list.
**Why it hurts**: the diagram ships with overlapping ring titles, arrows over labels, or straddling
nodes — exactly what makes a Dependency-Rule review unreadable.
**Fix**: run lint -> score -> repair until `score >= 95` AND `hardBlockers == []`; repair is mandatory.

### Repair that lowers the score, kept anyway
**Failure**: a repair pass drops the score and the result is accepted.
**Why it hurts**: net-negative edits accumulate; the diagram degrades.
**Fix**: roll back to the last `save_version` checkpoint and apply a smaller, targeted fix.

### Skipping validate_architecture / suggest_architecture_improvements
**Failure**: the diagram looks clean (score 96) but never runs the architecture validators.
**Why it hurts**: a high *visual* score says nothing about the Dependency Rule; an outward edge or a
framework-in-core leak passes unnoticed.
**Fix**: always run `validate_architecture` (require `outwardEdges: 0`) and review
`suggest_architecture_improvements`; apply accepted fixes and re-loop.

## Library & geometry

### Framework logos sprinkled across inner rings
**Failure**: vendor logos placed on Use Cases or Entities cards "for recognizability".
**Why it hurts**: it both clutters the core and implies a dependency that must not exist.
**Fix**: logos only on the outer Frameworks & Drivers ring; inner rings stay framework-free; reject
any icon that triggers HIGH_DENSITY or sits in an arrow lane.

### Port labels crammed under inward arrows
**Failure**: "implements" / port-name labels rendered on top of the routed inward line
(`ARROW_TEXT_INTERSECTION`).
**Why it hurts**: the single most important relationship — adapter implements port — becomes
unreadable.
**Fix**: route the inward line through a ring gutter (>= 32px) and move the label into the side lane
with clearance.

## Secrets

### Connection strings / SaaS keys on the outer ring
**Failure**: labeling the Frameworks ring with `postgres://app:<password>@db/main` or a live Stripe key.
**Why it hurts**: exports and shared links leak credentials; the outer ring is the prime leak surface.
**Fix**: redact before any tool call (`postgres://app:[REDACTED_DATABASE_URL]@db/main`,
`[REDACTED_API_KEY]`), label by concept ("Postgres Gateway", key icon), and re-scan the export as a
backstop. Never echo a detected secret back to the user.

See ../../_shared/references/architecture-patterns.md, ../../_shared/references/geometry-rules.md,
../../_shared/references/library-policy.md, and ../../_shared/references/security-redaction.md.
