# CQRS — Anti-Patterns

Failure modes specific to CQRS (Command-Query Responsibility Segregation) diagrams, why each is
wrong, and the fix. If a draft trips any of these, repair before scoring closes.

## Lane segregation (the core invariant)

### 1. A single shared model serving both lanes
**Symptom**: one "Order" box (or one database cylinder) is the target of both command handlers and
query handlers.
**Why wrong**: CQRS exists to SEPARATE the write model from the read model; a shared model is just
CRUD, not CQRS. `validate_architecture` flags `sharedModel`.
**Fix**: split into a write model / aggregate (top lane, write store) and a separate read model /
materialized view (bottom lane, read store); feed the read model only via a projection from the bus.

### 2. The two lanes not visually separated
**Symptom**: command handlers, the model, and query handlers are all on one row with no top/bottom
write/read split.
**Why wrong**: the whole point of the diagram is the write-vs-read segregation; a flat row hides it.
**Fix**: WRITE (command) lane on top flowing left->right; READ (query) lane on the bottom; a clear
horizontal gutter between them with only the bus->projection edge crossing.

### 3. Extra edges crossing between the lanes
**Symptom**: besides bus->projection, another arrow jumps from the write lane to the read lane
(e.g. command handler writes the read model directly, or a query handler reads the write store).
**Why wrong**: the event bus is the ONLY legitimate bridge; any other cross-lane edge re-couples the
sides.
**Fix**: keep exactly one cross-lane edge (bus -> projection); route writes to the read model only
through projections consuming events.

## Command / write side

### 4. A command that reads the read model
**Symptom**: an arrow from a command handler into the read model / read store (e.g. to "check
current view before writing").
**Why wrong**: commands must operate on the write model's invariants; reading the eventually-consistent
read model for a decision is a stale-data hazard and a coupling. `validate_architecture` flags
`commandReadsReadModel`.
**Fix**: command handlers load state from the write model / aggregate (or rehydrate from the event
store); never from the read side.

### 5. A command that returns data (command/query conflation)
**Symptom**: the PlaceOrder command is drawn returning the full order view to the client.
**Why wrong**: commands change state and return at most an ack/id; returning a read projection mixes
the responsibilities CQRS separates.
**Fix**: the command returns void/ack/id; the client issues a separate query against the read model
to get the view.

### 6. No write store / aggregate, commands writing nothing
**Symptom**: command handlers point straight at the event bus with no write model in between.
**Why wrong**: the aggregate is the consistency boundary that enforces invariants and decides which
events are emitted; skipping it loses the write model.
**Fix**: Command -> Command Handler -> Write Model (aggregate) -> emit events to the bus.

## Read / query side

### 7. A query that writes the write model
**Symptom**: an arrow from a query handler into the write store / aggregate.
**Why wrong**: queries are side-effect-free reads; writing the write model from the query side is the
mirror sin of #4. `validate_architecture` flags `queryWritesWriteModel`.
**Fix**: query handlers read ONLY the read model; remove any write edge from the read lane.

### 8. A read model with no projection feeding it
**Symptom**: a read model / view that no projection updates (it appears out of nowhere).
**Why wrong**: in CQRS the read side is built FROM events via projections; an unfed read model is
either stale or secretly sharing the write store.
**Fix**: add a projection that consumes the relevant events from the bus and updates the read model.

### 9. Orphan projection (consumes an event nobody emits)
**Symptom**: a projection subscribes to "OrderArchived" but no command/aggregate emits that event.
**Why wrong**: a dead projection signals an incomplete or wrong model; `validate_architecture` flags
`orphanProjections`.
**Fix**: emit the event from the write side, or remove the projection.

### 10. Query side missing entirely (write-only "CQRS")
**Symptom**: commands -> events but no projection / read model / query path is drawn.
**Why wrong**: that is event sourcing or pub/sub, not CQRS — the read side is half the diagram.
**Fix**: add the bottom read lane (projection -> read model -> query handler -> query); if the read
side genuinely doesn't exist, this isn't a CQRS diagram (use Event-Driven instead).

## The bridge / consistency

### 11. No event bus / event store between the lanes
**Symptom**: the write aggregate connects directly to the projection with no bus/store node.
**Why wrong**: the bus/event store is the decoupling bridge and (when event-sourced) the source of
truth; omitting it hides how the read side learns of changes.
**Fix**: insert the event bus / event store between the lanes; write emits to it, projection consumes
from it.

### 12. The projection edge marked synchronous / not annotated
**Symptom**: the bus->projection edge is solid with no consistency note, implying immediate reads.
**Why wrong**: read models are typically EVENTUALLY consistent; an unannotated/solid edge misleads on
the read-after-write gap.
**Fix**: mark the bus->projection edge "eventually consistent" (dashed); only label it synchronous if
the read side is truly updated in the same transaction.

## Edges, routing & labels

### 13. "publishes"/"projects"/"eventually consistent" label under its line
**Symptom**: `ARROW_TEXT_INTERSECTION`; the bridge-edge label is overdrawn by the routed arrow.
**Why wrong**: the label is unreadable and it is a hard blocker (the bus->projection edge is the #1
risk because it crosses the inter-lane gutter).
**Fix**: move the label into the inter-lane gutter beside the line with 32px clearance; keep endpoints
fixed.

### 14. Lane flows crossing a card
**Symptom**: the write left->right flow or the read flow passes over another node's body.
**Why wrong**: it reads as a connection that doesn't exist and clutters the lane.
**Fix**: route through the reserved >= 32px gutters between nodes; never cross a card.

## Node typing & icons

### 15. The write store and read store drawn identically (or as one)
**Symptom**: both stores are plain rectangles, or there is visibly only one store.
**Why wrong**: the two distinct stores are a primary CQRS signal; identical/merged stores hide the
split. Under `required` mode this is a policy violation.
**Fix**: use a `database-symbol` for EACH store; differentiate (e.g. Postgres normalized write vs
Elasticsearch/Redis denormalized read).

### 16. Off-policy or over-detailed icons
**Symptom**: an icon from an arbitrary public library, or a busy multi-color glyph, lowers the score
(`HIGH_DENSITY`, preset clash).
**Why wrong**: violates `MCP_LIBRARY_MODE = curated`; noise hurts the score.
**Fix**: pull only from the curated packs (Software Architecture, Database/Data Platform, Technology
Logos); normalize stroke/fill; reject anything that lowers the score and fall back to a primitive.
Record the rejection.

## Layout & legend

### 17. Write and read lanes swapped or interleaved
**Symptom**: the query path on top, the command path on the bottom, or nodes from both lanes mixed
into one band.
**Why wrong**: the top=write / bottom=read convention IS the diagram's primary reading order; swapping
or mixing breaks it.
**Fix**: write (command) lane strictly on top; read (query) lane strictly on the bottom.

### 18. No legend / undefined lane roles
**Symptom**: viewers can't tell the write path from the read path, or what the dashed bridge edge
means.
**Why wrong**: the diagram relies on lane/edge conventions that go unexplained.
**Fix**: add a legend keying Write (Command) path, Read (Query) path, and the eventual-consistency
marker in a corner `legend` block.

### 19. Lane header overlapping a card or the legend
**Symptom**: `FRAME_TITLE_OVERLAP`; the "Write (Command) Path" or "Read (Query) Path" header sits on
top of the first card or the legend header.
**Why wrong**: title bands must stay title-only; overlap is unreadable and a hard blocker.
**Fix**: reserve a title band at the top of each lane; place the first node below it; keep the legend
header in its own corner block.

### 20. Content hugging the export edge
**Symptom**: `TEXT_NEAR_EDGE`; the leftmost command or the bottom-right query touches the canvas
bound.
**Fix**: keep all content >= 40px from canvas/export bounds.

## Security

### 21. Live connection string / broker creds on a store or bus card
**Symptom**: a label reads `postgres://write:<password>@wdb/orders`, the read store shows a live URL, or
the bus shows `svc:<password>@broker:9092`.
**Why wrong**: CQRS diagrams have TWO store leak surfaces plus the bus; both DB URLs and broker creds
get exported/embedded.
**Fix**: redact BEFORE the create call -> `postgres://write:[REDACTED_DATABASE_URL]@wdb/orders` for
both stores, `svc:[REDACTED_PROXY_SECRET]@broker:9092` for the bus, `[REDACTED_API_KEY]` /
`[REDACTED_WEBHOOK_SECRET]` elsewhere; re-scan the export. Show the *concept* of a credential, never
the value.

## Quality loop

### 22. Skipping repair / accepting score < 95
**Symptom**: saving at 90 with a remaining penalty "because the lanes look fine".
**Why wrong**: repair is mandatory below 95 or with any blocker.
**Fix**: run the lint -> score -> repair loop until `score >= 95` and `hardBlockers == []`.

### 23. Keeping a repair/polish pass that lowered the score
**Symptom**: a polish pass reflowed the lanes (and maybe merged them or flipped the bridge edge to
solid) and dropped the score below the checkpoint.
**Why wrong**: every pass must be monotonic-up or be rolled back; a merged lane also breaks
segregation.
**Fix**: restore the last `save_version` checkpoint and apply a smaller, targeted fix; re-verify the
two lanes stayed separate and the bridge edge stayed eventual.

See `./checklist.md`, `./examples.md`, and the shared references under `../../_shared/references/`.
