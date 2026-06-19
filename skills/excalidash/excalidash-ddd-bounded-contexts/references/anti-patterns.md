# DDD Bounded Contexts — Anti-Patterns

Specific failure modes for context maps, each with the symptom, why it is wrong, and the fix. The
first six are DDD-content failures (hard `validate_architecture` failures); the rest are geometry,
library, and process slips.

## Content / strategic-DDD failures (hard)

### 1. Unlabeled cross-context edge
**Symptom**: an arrow runs `Ordering -> Inventory` with no relationship pattern.
**Why wrong**: a context map's whole purpose is the *relationships*; an unlabeled edge says nothing
about ownership, coupling, or who must change when. `validate_architecture` hard-fails.
**Fix**: label it with exactly one pattern — Partnership, Shared Kernel, Customer/Supplier (with
Upstream U / Downstream D), Conformist, ACL, OHS, or Published Language. Add U/D markers on
Customer/Supplier edges.

### 2. Leaked aggregate across a boundary
**Symptom**: the `Order` aggregate from Ordering is drawn inside, or directly referenced by, Inventory.
**Why wrong**: bounded contexts isolate models; reaching into another context's aggregate is the
coupling DDD exists to prevent. Hard fail.
**Fix**: replace the direct reference with a **published domain event** (`OrderPlaced`) or route the
consumption through an **Anticorruption Layer** that translates the upstream model into the
downstream context's own terms.

### 3. One model spanning two contexts (god-context / no real boundary)
**Symptom**: a single "Customer" entity is shared verbatim by Ordering, Billing, and Support, or one
frame holds aggregates from unrelated subdomains.
**Why wrong**: it denies that the *same word means different things* in different contexts and recreates
the big ball of mud. A god-context owning everything has no boundary at all.
**Fix**: split into per-context models that each own their version of the term ("Customer" in Ordering
vs. "Payer" in Billing vs. "Contact" in Support); link them with a relationship + translation, not a
shared class. Split a god-context along its real subdomains.

### 4. Shared kernel buried inside one context (or oversized)
**Symptom**: "Money" lives entirely inside Payments while Ordering also uses it; or the "shared kernel"
has grown to dozens of types.
**Why wrong**: a shared kernel is *jointly owned* — neither side may change it unilaterally; hiding it
inside one context misrepresents ownership. An oversized kernel re-couples the contexts it was meant to
decouple.
**Fix**: draw the kernel as a small block straddling the seam between exactly its two co-owning
contexts. If it is large, demote most of it to a **Published Language** behind an Open Host Service and
keep only the truly co-owned core in the kernel.

### 5. Dead event or orphan subscription
**Symptom**: `RefundIssued` is published but no context consumes it; or a context subscribes to an event
no context produces.
**Why wrong**: a domain event with no consumer is noise; a subscription with no producer is a broken
integration. Both indicate a modeling gap.
**Fix**: wire every event producer -> consumer, or delete the unused event/subscription. Every event
edge must have a source context and at least one target context.

### 6. Missing ACL on a Conformist/downstream edge
**Symptom**: a downstream context consumes the upstream model directly and is marked Conformist with no
Anticorruption Layer, then its own model gets polluted by upstream concepts.
**Why wrong**: Conformist accepts the upstream model as-is — fine when intentional, but when the
downstream needs its own clean model, the ACL is what protects it. Omitting it leaks the upstream
language inward.
**Fix**: insert an ACL badge on the downstream side that translates upstream terms into the downstream
context's ubiquitous language; relabel the edge ACL (or keep Conformist only if the team truly accepts
the upstream model).

## Diagram-type confusion

### 7. Drawing the inside of one context instead of the map
**Symptom**: one frame with a detailed `Order`/`OrderLine`/`Money` class graph and no other contexts.
**Why wrong**: that is a tactical/aggregate diagram, not a strategic context map.
**Fix**: zoom out to one frame per context with the relationships between them; draw the aggregate
detail in a separate tactical-DDD diagram.

### 8. Confusing a context map with deployment / broker topology
**Symptom**: the map shows Kafka brokers, topics, partitions, and queues between contexts.
**Why wrong**: a context map shows *which contexts* exchange *which domain events* and how they relate
— not the messaging infrastructure.
**Fix**: keep the event name and direction on the edge; move broker topology to an **event-driven** or
**deployment** diagram and cross-reference by event name.

### 9. Confusing it with ports & adapters or clean rings
**Symptom**: the map sprouts driving/driven adapters around a core, or concentric Entities -> Use Cases
rings.
**Why wrong**: those are the Hexagonal and Clean Architecture skills; a context map is frames +
relationships.
**Fix**: switch to the **Hexagonal Architecture Mapper** or **Clean Architecture Reviewer** skill.

## Geometry & layout

### 10. Event/pattern label sitting on the arrow (`ARROW_TEXT_INTERSECTION`)
**Symptom**: "OrderPlaced" or "Customer/Supplier (U/D)" overlaps the routed line.
**Fix**: move the label into the inter-frame gutter beside the line; reroute the arrow if needed.

### 11. Context frame title overlapping content (`FRAME_TITLE_OVERLAP`)
**Symptom**: the context name collides with an aggregate card or the legend header.
**Fix**: keep the title in the frame's title band only; push the top aggregate card below the band.

### 12. Frames too tight for inter-context arrows
**Symptom**: arrows cross through a neighboring frame because there is no gutter.
**Fix**: space frames on the grid with >= 80px gutters; route every inter-context arrow through a clear lane.

### 13. Shared-kernel block treated as an orphan (`ITEM_OUTSIDE_FRAME` misread)
**Symptom**: a repair pass moves the seam-straddling shared kernel fully inside one frame to "fix" an
outside-frame warning.
**Fix**: the shared kernel intentionally straddles two frame seams and is labeled — keep it on the
seam; suppress the warning by labeling it as the shared kernel, do not bury it.

## Library

### 14. Decorating frames into noise (HIGH_DENSITY)
**Symptom**: every aggregate gets a logo and every edge two icons; density spikes and the score drops.
**Fix**: keep frames icon-light — value is the labels. One event glyph per event edge, one shared/overlap
glyph on the kernel, one ACL glyph per ACL edge; reject any icon that lowers the score.

### 15. Off-policy art
**Symptom**: importing a random "DDD" clipart instead of curated packs.
**Fix**: pull only from Software Architecture / Architecture diagram components (+ Stick Figures for
boundary actors, gateway/shield for ACL); draw primitives when no curated icon fits.

## Process

### 16. Saving below 95 or with a blocker
**Symptom**: `save_drawing` called at score 88 "to keep going".
**Fix**: the loop is mandatory — repair until `score >= 95` and `hardBlockers == []` before saving.

### 17. Keeping a regressing pass
**Symptom**: `auto_polish_drawing` or a repair drops the score and the result is kept anyway.
**Fix**: roll back to the last `save_version` checkpoint and apply a smaller, targeted fix.

### 18. Leaking a secret in an event payload or integration note
**Symptom**: a sample `OrderPlaced` payload includes a bearer token; a Payments note holds a Stripe key.
**Fix**: redact BEFORE the first tool call (`[REDACTED_BEARER]`, `[REDACTED_API_KEY]`,
`[REDACTED_DATABASE_URL]`), show the concept not the value, and re-scan every export.
