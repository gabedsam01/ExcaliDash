# Modular Monolith — Anti-Patterns

Failure modes specific to modular-monolith diagrams, why each is wrong, and the fix. If a draft trips
any of these, repair before scoring closes.

## Deployable & datastore confusion

### 1. Multiple deployables / no single shell frame
**Symptom**: each module is a free-floating box with no enclosing frame, or there are several outer
frames — the diagram reads as several deployables.
**Why wrong**: a modular monolith is exactly ONE deployable; the single shell frame is the diagram's
primary signal. Multiple deployables is microservices.
**Fix**: draw ONE outer application-shell frame and place every module card INSIDE it; if the input
really has many deployables, switch to the Microservices Topology skill.

### 2. A second database (or a database per module)
**Symptom**: two database cylinders, or each module card paired with its own datastore.
**Why wrong**: a modular monolith shares ONE physical database; DB-per-module is the defining trait of
microservices, not a modular monolith. `validate_architecture` flags `extraDatastores`.
**Fix**: collapse to ONE shared database cylinder, partitioned into per-module schema lanes; delete
the extra database-symbols.

### 3. The shared DB is one undivided blob (no per-module schemas)
**Symptom**: one cylinder labelled "Database" with every module's persistence edge landing on it
undifferentiated.
**Why wrong**: the modular discipline requires each module to own its slice; an undivided DB hides the
boundary and invites shared-table coupling.
**Fix**: partition the cylinder into per-module schema lanes (`catalog`, `ordering`, ...) and land
each module's persistence edge on its own lane.

## Module boundaries

### 4. Cross-module reach-through to another module's tables
**Symptom**: an arrow from "Ordering" lands directly on the `billing` schema (or a shared table).
**Why wrong**: this is the cardinal modular-monolith sin — it couples modules at the data layer and
destroys the boundary. `validate_architecture` reports it in `reachThroughs`. It is a hard
architecture failure, not a style nit.
**Fix**: remove the persistence edge into the other schema; route the call to the other module's
PUBLIC API (e.g. Ordering -> `BillingApi`); only Billing writes the `billing` schema.

### 5. Edge landing on a module's internals instead of its public API
**Symptom**: an arrow from "Ordering" lands on Catalog's internal class/package, not on `CatalogApi`.
**Why wrong**: the public API is the contract; binding to internals couples callers to hidden detail
and breaks encapsulation.
**Fix**: every cross-module edge must terminate on the target module's public-API stub; show internals
as hidden inside the card.

### 6. A module with no public API
**Symptom**: a module card has no public-API stub yet is called by another module.
**Why wrong**: callers then bind to internals (anti-pattern 5); the contract surface is undefined.
**Fix**: give every called module a single public-API stub on its boundary and route all inbound
cross-module edges onto it.

## Dependencies

### 7. Disallowed dependency edge
**Symptom**: an edge exists that is not in the allowed-dependency set (e.g. "Catalog -> Ordering" when
only "Ordering -> Catalog" was specified).
**Why wrong**: the allowed set IS the architecture; an unlisted edge is an unintended coupling.
**Fix**: remove the edge, or, if it is legitimate, update the allowed set explicitly — never leave an
undocumented dependency.

### 8. A module dependency cycle
**Symptom**: "Ordering -> Billing -> Ordering" (directly or transitively).
**Why wrong**: cycles make modules inseparable and undeployable independently later; `validate_architecture`
flags `moduleCycles`.
**Fix**: break the cycle — invert one call via an in-process event (publish instead of call), or
extract the shared concern into a third module both depend on.

### 9. A god-module that everything depends on
**Symptom**: one module is the target of nearly every edge and holds unrelated concerns.
**Why wrong**: it becomes a hidden hub that recreates the tangled-monolith problem the modular split
was meant to solve.
**Fix**: split the god-module along its real responsibilities; `suggest_architecture_improvements`
will flag the fan-in.

## In-process bus & events

### 10. An external broker instead of an in-process bus
**Symptom**: the events flow through a Kafka/RabbitMQ box outside the shell.
**Why wrong**: a modular monolith communicates in-process; an external broker is a second deployable
and pushes the picture toward event-driven microservices.
**Fix**: draw an in-process event bus / outbox strip INSIDE the shell; label it in-process; reserve a
real broker for the Event-Driven or Microservices skills.

### 11. Publish/subscribe edges unlabelled or reversed
**Symptom**: an event edge with no "publishes"/"subscribes" label, or a subscriber drawn as the
publisher.
**Why wrong**: direction of event flow is load-bearing; ambiguity misreads who emits vs. who reacts.
**Fix**: label each event edge publish (module -> bus) or subscribe (bus -> module) and key it in the
legend.

## Edges, routing & labels

### 12. Dependency / event / schema label sitting under its line
**Symptom**: `ARROW_TEXT_INTERSECTION`; a "publishes OrderPlaced", "via BillingApi", or schema label
is overdrawn by the routed arrow.
**Why wrong**: the label is unreadable and it is a hard blocker.
**Fix**: move the label into the gutter beside the line with 32px clearance; keep endpoints fixed.

### 13. Arrows routed straight through module cards
**Symptom**: a dependency line passes over another module's body in the grid.
**Why wrong**: it reads as a connection that doesn't exist and clutters the shell.
**Fix**: route through the reserved >= 32px gutters between module rows/columns; never cross a card.

## Node typing & icons

### 14. The shared DB drawn as a plain box
**Symptom**: "Shared Postgres" rendered as a rectangle identical to a module card.
**Why wrong**: a store must read as a store; under `required` mode this is a policy violation.
**Fix**: use the `database-symbol` slot (cylinder/db glyph) for the single shared DB, with per-schema
sub-labels inside.

### 15. A runtime/framework logo on every module
**Symptom**: a Spring/.NET logo stamped on each module card.
**Why wrong**: the modules share one runtime; repeating the logo is noise and implies separate
runtimes. `HIGH_DENSITY` penalty.
**Fix**: place the runtime logo ONCE on the shell title band (`inside-card-left`); keep module cards
icon-light apart from a single module glyph.

### 16. Off-policy or over-detailed icons
**Symptom**: an icon from an arbitrary public library, or a busy multi-color glyph, lowers the score
(`HIGH_DENSITY`, preset clash).
**Why wrong**: violates `MCP_LIBRARY_MODE = curated`; noise hurts the score.
**Fix**: pull only from the curated packs (Software Architecture, Architecture diagram components,
Database/Data Platform, Technology/Software Logos); normalize stroke/fill; reject anything that lowers
the score and fall back to a primitive. Record the rejection.

## Layout & legend

### 17. Modules drawn outside the shell frame
**Symptom**: `ITEM_OUTSIDE_FRAME`; a module card straddles or sits outside the outer shell.
**Why wrong**: a module outside the deployable misrepresents it as a separate process.
**Fix**: keep every module fully inside the shell; resize the shell frame so all cards and the bus fit
with padding.

### 18. Shell title overlapping a module card or the bus label
**Symptom**: `FRAME_TITLE_OVERLAP`; the deployable shell title sits on top of the top module card or
the in-process bus label.
**Why wrong**: title bands must stay title-only; overlap is unreadable and a hard blocker.
**Fix**: reserve a title band at the top of the shell; place the first module row below it; keep the
bus label and legend header in their own bands/corner.

### 19. No legend / undefined module & event semantics
**Symptom**: viewers can't tell a public-API call from an event, or which schema a module owns.
**Why wrong**: the diagram relies on shape/side conventions that go unexplained.
**Fix**: add a legend keying module, public API, event (publish/subscribe), and schema ownership.

### 20. Content hugging the export edge
**Symptom**: `TEXT_NEAR_EDGE`; the outermost module or the shared-DB label touches the canvas bound.
**Fix**: keep all content >= 40px from canvas/export bounds.

## Security

### 21. Live shared-DB connection string or SaaS key on a card
**Symptom**: the shared-DB cylinder reads `postgres://acme:<password>@db.internal/acme`, or a module card
shows `[REDACTED_API_KEY]` / `[REDACTED_API_KEY]`.
**Why wrong**: modular-monolith diagrams are exported/embedded; the shared DB and any external-SaaS
module are the leak surface.
**Fix**: redact BEFORE the create call -> `postgres://acme:[REDACTED_DATABASE_URL]@db.internal/acme`,
`[REDACTED_API_KEY]`; re-scan the export. Show the *concept* of a credential, never the value.

## Quality loop

### 22. Skipping repair / accepting score < 95
**Symptom**: saving at 90 with a remaining penalty "because it looks fine".
**Why wrong**: repair is mandatory below 95 or with any blocker.
**Fix**: run the lint -> score -> repair loop until `score >= 95` and `hardBlockers == []`.

### 23. Keeping a repair/polish pass that lowered the score
**Symptom**: a polish pass reflowed the module grid and dropped the score below the checkpoint.
**Why wrong**: every pass must be monotonic-up or be rolled back.
**Fix**: restore the last `save_version` checkpoint and apply a smaller, targeted fix.

See `./checklist.md`, `./examples.md`, and the shared references under `../../_shared/references/`.
