# Architecture Patterns

Built-in patterns give each diagram a known layout skeleton: the node roles, how they
group into layers/frames, and how arrows flow. Pick the pattern that matches the
system's real shape; do not force a system into a pattern it doesn't fit.

## Built-in Patterns

### clean
Concentric layers: entities at the core, then use cases, then interface adapters, then
frameworks/drivers. Dependencies point inward only. Layout: nested frames or stacked
horizontal bands, arrows always toward the center.

### hexagonal (ports & adapters)
Domain core in the center; ports on the boundary; adapters (driving on the left,
driven on the right) outside. Layout: hexagon or center box with port stubs, adapters
flanking, arrows crossing the boundary through named ports.

### ddd (domain-driven design)
Bounded contexts as frames; aggregates, entities, value objects, domain services inside;
context-map relationships (partnership, conformist, ACL) as labeled arrows between frames.

### c4
Hierarchical zoom: Context -> Container -> Component -> Code. See C4 Levels below.

### cqrs
Split command and query paths: commands -> write model -> event store; queries ->
read model/projections. Layout: two lanes (write top, read bottom) sharing an event bus.

### event-driven
Producers -> event bus/broker -> consumers, with topics/streams as channels. Layout:
central bus spine, producers feeding in, consumers fanning out, async arrows.

### microservices
Independent services, each with its own datastore, behind an API gateway; service-to-
service and service-to-broker edges. Layout: gateway at top, service grid below, each
service paired with its store.

### modular-monolith
Single deployable with internal modules as frames sharing one runtime; explicit
module boundaries and allowed dependencies. Layout: one outer frame, module frames
inside, dependency arrows respecting boundaries.

### mcp
MCP-specific: host/client on one side, MCP server(s) exposing tools/resources/prompts,
transport between them, backing systems behind the server. Layout: client lane,
transport gutter, server lane, backend lane.

## C4 Levels
1. **Context** — the system as one box plus users and external systems around it.
2. **Container** — apps, services, datastores, and how they talk inside the system.
3. **Component** — major components inside one container and their relationships.
4. **Code** — class/structure detail (rarely drawn; generate only on request).

Draw the smallest level that answers the question. Most requests stop at Container or
Component. Each level is its own diagram, not crammed into one canvas.

## Splitting Complex Systems
When one system is too dense for a single readable diagram (would trigger HIGH_DENSITY),
split it across multiple focused views instead of shrinking everything:
- **C4 split** — separate Context / Container / Component diagrams.
- **sequence** — time-ordered interactions for a single scenario (lifelines + messages).
- **swimlane** — responsibilities across actors/services for a process (lanes + steps).
- **security** — trust boundaries, authn/authz, data classification, threat surfaces.
- **data-flow** — external entities, processes, data stores, and flows (DFD style).

Choose splits by the question being asked: structure -> C4; behavior over time ->
sequence; ownership/process -> swimlane; trust/threats -> security; data movement ->
data-flow. Keep each split in its own preset-consistent diagram and cross-reference by
shared node names so the set reads as one system.
