# C4 Container — Worked Examples

Each example shows: the request -> the plan line -> the ordered MCP tool calls with realistic
arguments -> the quality loop -> save/export. Secrets are redacted BEFORE any call.

---

## Example A — Internet Banking System (build from prompt)

**Request**: "Show the apps, APIs and databases inside our Internet Banking System and how they
talk. Customers use the web app and the mobile app; both go through an API. The API stores data in
a SQL database and sends emails through the external Email System, and makes payments through the
external Mainframe Banking System."

**Plan line**
```
TYPE=c4 LEVEL=container PRESET=architecture
LIBRARY=curated[C4 Architecture, Software Architecture, Database/Data Platform]
VALIDATORS=lint,score,repair,validate_architecture
BOUNDARY=Internet Banking System  CONTAINERS=5  EXTERNAL=2  ACTORS=1
```

**Ordered calls**

1. `read_mcp_guide()` -> note `MCP_LIBRARY_MODE = curated`, architecture preset, rubric.
2. `list_templates()` -> scan for `c4-container` (none reusable -> build from prompt).
3. Library vetting:
   - `search_libraries({ query: "container", packs: ["C4 Architecture"] })`
   - `search_libraries({ query: "API service", packs: ["Software Architecture"] })`
   - `search_libraries({ query: "relational database", packs: ["Database/Data Platform"] })`
   - `inspect_library({ itemId: "c4-container" })`, `inspect_library({ itemId: "db-relational" })`
   - `cache_library({ itemIds: ["c4-container", "db-relational", "svc-api"] })`
4. Generate (ONE path):
   ```json
   create_diagram_from_prompt({
     "diagramType": "c4",
     "preset": "architecture",
     "direction": "TB",
     "title": "Internet Banking System — Containers",
     "prompt": "C4 Container diagram for Internet Banking System. Boundary: Internet Banking System. Containers: SPA 'Web Application' (React), 'Mobile App' (Xamarin), 'API Application' (Spring Boot), 'Database' (Oracle/SQL). Actors: Customer. External (outside boundary): Email System, Mainframe Banking System. Interactions: Customer uses 'Web Application' over HTTPS; Customer uses 'Mobile App' over HTTPS; 'Web Application' calls 'API Application' over HTTPS/JSON; 'Mobile App' calls 'API Application' over HTTPS/JSON; 'API Application' reads/writes 'Database' via JDBC; 'API Application' 'sends email via' Email System over SMTP; 'API Application' 'makes payments via' Mainframe Banking System over XML/HTTPS. Group containers in the boundary frame; externals outside. Legend: app / API / store / external. No components.",
     "autoPolish": false,
     "save": false
   })
   ```
   -> returns `{ drawingId: "draw_ib_container" }`.
5. Place icons (one normalized call per card; `targetCardId` anchors the glyph to its container,
   `placement` picks the slot, `slotSize` keeps scale consistent):
   ```json
   add_library_items_normalized({
     "libraryId": "c4-architecture",
     "id": "draw_ib_container",
     "itemNames": ["container"],
     "targetCardId": "API Application",
     "placement": "inside-card-top",
     "slotSize": 32,
     "save": false
   })
   ```
   Repeat with `libraryId: "database-data-platform"`, `itemNames: ["relational"]`,
   `targetCardId: "Database"`, `placement: "database-symbol"` for the datastore, and with
   `libraryId: "stick-figures"`, `itemNames: ["person"]`, `targetCardId: "Customer"`,
   `placement: "actor"`, `slotSize: 48` for the actor.
6. Quality loop:
   - `lint_drawing({ id: "draw_ib_container" })` -> `hardBlockers: ["ARROW_TEXT_INTERSECTION"]`
     (payments label under the line).
   - `score_drawing({ minimumScore: 95 })` -> `82` (penalties: ARROW_TEXT_INTERSECTION, HIGH_DENSITY).
   - `save_version({ id: "draw_ib_container" })` (rollback checkpoint before repair).
   - `repair_drawing({ save: true, createVersion: true, name: "ib-repair-1" })` — the engine routes
     'makes payments via' through the right gutter and widens the API->Database column gutter to 48px.
   - re-`lint_drawing({ id: "draw_ib_container" })` -> `hardBlockers: []`;
     re-`score_drawing({ minimumScore: 95 })` -> `96`.
7. `auto_polish_drawing({ minimumScore: 95 })` -> re-`score_drawing({ minimumScore: 95 })` -> `97`
   (no regression; keep).
8. `validate_architecture({ structure: <container structure> })` ->
   `{ ok: true, boundary: "Internet Banking System", containersInside: 4, externalsOutside: 2, orphans: [], componentLeak: false }`.
9. `save_drawing({ id: "draw_ib_container", name: "Internet Banking System — Containers" })`.
10. `save_version({ id: "draw_ib_container" })` (checkpoint the accepted state).
11. `get_drawing_url({ id: "draw_ib_container" })` -> share link;
    `export_drawing({ id: "draw_ib_container", format: "svg" })` -> re-scan export for secrets
    (none; protocols only). Done.

---

## Example B — Expand an existing context diagram (convert path)

**Request**: "We already have the Internet Banking System context diagram. Zoom into that box and
show its containers."

**Plan line**
```
TYPE=c4 LEVEL=container PRESET=architecture LIBRARY=curated[...] VALIDATORS=lint,score,repair,validate_architecture
SOURCE=draw_ib_context  STRATEGY=convert
```

**Ordered calls**
1. `read_mcp_guide()`.
2. Generate (ONE path — convert, preferred when a context drawing exists):
   ```json
   convert_diagram_type({
     "structure": { "nodes": ["Internet Banking System", "Customer", "Email System", "Mainframe Banking System"], "edges": ["Customer->Internet Banking System", "Internet Banking System->Email System", "Internet Banking System->Mainframe Banking System"] },
     "targetType": "c4_container",
     "preset": "architecture",
     "save": true,
     "name": "Internet Banking System — Containers (v2)"
   })
   ```
   -> central system explodes into a boundary frame holding 'Web Application', 'Mobile App',
   'API Application', 'Database'; actors/externals carried over outside the boundary.
   Returns `{ drawingId: "draw_ib_container_v2" }`.
3. Library vetting + `add_library_items_normalized` (database-symbol for 'Database', container
   glyphs for apps) as in Example A.
4. Quality loop: `lint_drawing({ id })` -> `score_drawing({ minimumScore: 95 })` (e.g. `88`) ->
   `repair_drawing({ save: true, createVersion: true })` for any `ITEM_OUTSIDE_FRAME` (a converted
   container clipping the boundary edge) -> re-lint/re-score until `>= 95` and `hardBlockers == []`.
   Rollback any pass that lowers the score.
5. `auto_polish_drawing({ minimumScore: 95 })` -> `validate_architecture({ structure })` ->
   `save_drawing({ id, name: "Internet Banking System — Containers (v2)" })` -> `save_version({ id })`
   -> `get_drawing_url({ id })` -> `export_drawing({ id, format: "svg" })`.

---

## Example C — Event-driven SaaS with queue + cache + secret redaction

**Request**: "Container view of OrderFlow. React SPA -> Orders API (Node) over HTTPS/JSON; API
reads/writes Postgres (`postgres://app:<password>@db.internal/orders`) via SQL; API caches in Redis;
API publishes order events to Kafka; a Fulfillment Worker consumes Kafka; API charges via Stripe."

**Redaction first** (BEFORE any tool call): the Postgres URL contains a password ->
`postgres://app:[REDACTED_DATABASE_URL]@db.internal/orders`.

**Plan line**
```
TYPE=c4 LEVEL=container PRESET=architecture
LIBRARY=required[C4 Architecture, Software Architecture, Database/Data Platform, Technology Logos]
VALIDATORS=lint,score,repair,validate_architecture
BOUNDARY=OrderFlow  CONTAINERS=6  EXTERNAL=1  ACTORS=1
```

**Ordered calls**
1. `read_mcp_guide()` -> `MCP_LIBRARY_MODE = required` (stores MUST use db symbol, queue MUST use
   broker icon, Stripe MUST use its logo).
2. `search_libraries`/`inspect_library`/`cache_library` for: container, svc-api, queue/broker
   (Kafka), db-relational (Postgres), cache (Redis), stripe logo.
3. Generate (ONE path). `apply_architecture_skill` takes only `{ pattern, preset?, title?, save?,
   name?, autoPolish? }` — it cannot carry a per-container spec — so a fully specified container
   graph goes through `create_diagram_from_prompt` with an explicit `structure` instead. (If you
   only wanted the C4 skeleton, you would call `apply_architecture_skill({ pattern: "c4", title:
   "OrderFlow — Containers" })` and add containers afterward.) Here, with the full graph in hand:
   ```json
   create_diagram_from_prompt({
     "diagramType": "c4",
     "preset": "architecture",
     "direction": "TB",
     "title": "OrderFlow — Containers",
     "structure": {
       "nodes": [
         "Customer (actor)",
         "Web App [SPA / React]",
         "Orders API [API / Node.js]",
         "Fulfillment Worker [service / Node.js]",
         "Orders DB [database / PostgreSQL] conn=postgres://app:[REDACTED_DATABASE_URL]@db.internal/orders",
         "Cache [cache / Redis]",
         "Event Bus [queue / Kafka]",
         "Stripe (external)"
       ],
       "edges": [
         "Customer -> Web App : uses (HTTPS)",
         "Web App -> Orders API : calls (HTTPS/JSON)",
         "Orders API -> Orders DB : reads/writes (SQL)",
         "Orders API -> Cache : caches in (RESP)",
         "Orders API -> Event Bus : publishes events (Kafka)",
         "Fulfillment Worker -> Event Bus : consumes events (Kafka)",
         "Orders API -> Stripe : charges via (HTTPS)"
       ]
     },
     "save": false
   })
   ```
   -> `{ drawingId: "draw_orderflow_container" }`.
4. `add_library_items_normalized` — required-mode placements, one call per card: `placement:
   "database-symbol"` (libraryId `database-data-platform`, itemNames `["relational"]`,
   targetCardId `"Orders DB"`); a cache glyph for 'Cache'; a broker glyph for 'Event Bus'; the
   Stripe logo via `libraryId: "technology-logos"`, `placement: "badge"`, `targetCardId: "Stripe"`
   (outside the boundary); container glyphs for apps; `placement: "actor"` for Customer.
5. Quality loop: `lint_drawing({ id })` (expect possible `ARROW_TEXT_INTERSECTION` on the Kafka
   pub/sub lines that cross) -> `score_drawing({ minimumScore: 95 })` ->
   `repair_drawing({ save: true, createVersion: true })` (routes the worker/consumer line through a
   separate gutter) -> re-lint/re-score to `>= 95`, `hardBlockers == []`. Rollback on any drop.
6. `auto_polish_drawing({ minimumScore: 95 })` -> `validate_architecture({ structure })`
   (Stripe outside boundary; Worker not orphaned).
7. `save_drawing({ id, name: "OrderFlow — Containers" })` -> `save_version({ id })` ->
   `get_drawing_url({ id })`.
8. `export_drawing({ id, format: "png" })` -> **re-scan export**: confirm the Postgres password is
   `[REDACTED_DATABASE_URL]` in the rendered label, not the real value. Done.

---

## Reusable argument fragments
- **Container structure node**: encode type + technology inline, e.g.
  `"Orders API [API / Node.js]"`, `"Event Bus [queue / Kafka]"`, `"Stripe (external)"`.
- **Datastore slot**: `add_library_items_normalized({ libraryId: "database-data-platform",
  itemNames: ["relational"], targetCardId: "<store>", placement: "database-symbol", slotSize: 32 })`.
- **Queue slot**: `add_library_items_normalized({ libraryId: "software-architecture",
  itemNames: ["queue"], targetCardId: "<queue>", placement: "inside-card-top", slotSize: 32 })`.
- **External-outside check**: `validate_architecture({ structure: <container structure> })` must
  return `externalsOutside == count(externalSystems)` and `componentLeak == false`.

See `./checklist.md`, `./anti-patterns.md`, and the shared references under `../../_shared/references/`.
