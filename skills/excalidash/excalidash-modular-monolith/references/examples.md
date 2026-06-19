# Modular Monolith — Worked Examples

Each example shows: the request -> the plan line -> the ordered MCP tool calls with realistic
arguments -> the quality loop -> save/export. Secrets are redacted BEFORE any call.

---

## Example A — Acme Commerce (build with the modular-monolith skill)

**Request**: "Draw our Acme Commerce monolith. It's one Spring Boot app with Catalog, Ordering,
Billing, Identity, and Notifications modules. Ordering reads the catalog and charges via Billing;
Billing resolves customers via Identity. Ordering publishes `OrderPlaced`, which Billing and
Notifications consume in-process. Everything lives in one Postgres, one schema per module. Prove the
modules don't reach into each other's tables."

**Plan line**
```
TYPE=modular-monolith PRESET=architecture
LIBRARY=curated[Software Architecture, Architecture diagram components]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements
SHELL=Acme.Web  MODULES=5  SHARED_DB=1  SCHEMAS=5  BUS=in-process
```

**Ordered calls**

1. `read_mcp_guide()` -> note `MCP_LIBRARY_MODE = curated`, architecture preset, rubric.
2. `list_templates()` -> scan for `modular-monolith` (none reusable -> build with skill).
3. Library vetting:
   - `search_libraries({ q: "module component", mode: "curated", category: "architecture" })`
   - `search_libraries({ q: "public api contract interface", mode: "curated" })`
   - `search_libraries({ q: "in-process event bus queue", mode: "curated" })`
   - `search_libraries({ q: "relational database postgres", mode: "curated", category: "database" })`
   - `inspect_library({ libraryId: "software-architecture", autoCache: true })`
   - `cache_library({ libraryId: "database-data-platform" })`
4. Generate (ONE path — preferred). The module/schema detail is carried in `title`; the slices are
   refined right after with `create_diagram_from_prompt`:
   ```json
   apply_architecture_skill({
     "pattern": "modular-monolith",
     "preset": "architecture",
     "title": "Acme Commerce (Acme.Web, Spring Boot) — 5 modules, 1 shared Postgres, in-process bus",
     "save": true,
     "name": "Acme Commerce — Modular Monolith",
     "autoPolish": false
   })
   ```
   -> emits the outer Acme.Web shell frame, the module cards inside it (each with a public-API stub),
   the in-process bus strip, the legend, and the single shared Postgres cylinder. Returns
   `{ id: "draw_acme_modmono" }`. Refine the exact modules/schemas:
   ```json
   create_diagram_from_prompt({
     "diagramType": "modular-monolith",
     "structure": {
       "nodes": [
         { "id": "Catalog",       "publicApi": "CatalogApi",       "schema": "catalog" },
         { "id": "Ordering",      "publicApi": "OrderingApi",      "schema": "ordering" },
         { "id": "Billing",       "publicApi": "BillingApi",       "schema": "billing" },
         { "id": "Identity",      "publicApi": "IdentityApi",      "schema": "identity" },
         { "id": "Notifications", "publicApi": "NotificationsApi", "schema": "notifications" }
       ],
       "edges": [
         { "from": "Ordering", "to": "CatalogApi" },
         { "from": "Ordering", "to": "BillingApi" },
         { "from": "Billing",  "to": "IdentityApi" },
         { "from": "Ordering", "to": "bus", "label": "publishes OrderPlaced" },
         { "from": "bus", "to": "Billing", "label": "subscribes OrderPlaced" },
         { "from": "bus", "to": "Notifications", "label": "subscribes OrderPlaced" }
       ]
     },
     "title": "Acme Commerce — Modular Monolith",
     "save": true,
     "name": "Acme Commerce — Modular Monolith"
   })
   ```
5. Place icons:
   ```json
   add_library_items_normalized({
     "id": "draw_acme_modmono",
     "libraryId": "software-architecture",
     "itemNames": ["module-card", "contract-plug", "bus-strip"],
     "placement": "inside-card-top",
     "save": true
   })
   ```
   Then the single shared DB symbol and the one runtime logo (one normalized call each): a
   `db-relational` glyph in the `database-symbol` slot for "Shared Postgres", a `contract-plug` `badge`
   on each module's public-API stub, and one `spring-logo` `inside-card-left` on the Acme.Web title
   band. Do NOT add a second database-symbol.
6. Quality loop:
   - `lint_drawing({ id: "draw_acme_modmono" })` -> `hardBlockers: ["ARROW_TEXT_INTERSECTION"]` (the
     "publishes OrderPlaced" label on the Ordering -> bus edge sits under the routed arrow).
   - `score_drawing({ minimumScore: 95 })` -> `83` (penalties: ARROW_TEXT_INTERSECTION, HIGH_DENSITY in
     the module grid, SMALL_FONT on the schema lane labels).
   - `save_version({ id: "draw_acme_modmono" })` (rollback target).
   - `repair_drawing({ save: true, createVersion: true, name: "after ARROW_TEXT_INTERSECTION fix" })` —
     move the 'publishes OrderPlaced' label into the gutter above the Ordering->bus edge with 32px
     clearance; keep endpoints fixed.
   - `repair_drawing({ save: true })` — widen module-card gaps to >= 48px and keep 32px lanes between
     the module rows and the bus strip (HIGH_DENSITY); raise the per-schema lane labels to >= 16px
     (SMALL_FONT).
   - re-`lint_drawing` -> `hardBlockers: []`; re-`score_drawing({ minimumScore: 95 })` -> `96`.
7. `auto_polish_drawing({ minimumScore: 95, maxAttempts: 2, save: true })` -> re-`score_drawing` ->
   `97` (no regression; keep).
8. `validate_architecture({ structure })` ->
   `{ ok: true, shellFrames: 1, modules: 5, sharedDatabases: 1, schemasPerModule: 1, reachThroughs: [], moduleCycles: [], extraDatastores: 0, internalsEdges: [] }`.
9. `suggest_architecture_improvements({ structure })` -> "Notifications has no inbound public-API
   dependency, only event subscriptions — acceptable for a sink module; no fix." (reviewed, nothing to
   apply).
10. `save_drawing({ id: "draw_acme_modmono", name: "Acme Commerce — Modular Monolith" })`.
11. `save_version({ id: "draw_acme_modmono" })`.
12. `get_drawing_url({ id: "draw_acme_modmono" })` -> share link; `export_drawing({ id:
    "draw_acme_modmono", format: "svg" })` -> re-scan export for secrets (none; schema labels only).
    Done.

---

## Example B — Reverse-engineer a repo into a modular monolith (repo-analysis path)

**Request**: "Generate a modular-monolith diagram from our `acme-platform` repo so we can see the
real modules and whether any module reads another module's tables."

**Plan line**
```
TYPE=modular-monolith PRESET=architecture LIBRARY=curated[...]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements
SOURCE=/repos/acme-platform  STRATEGY=repo-analysis
```

**Ordered calls**
1. `read_mcp_guide()`.
2. Generate (ONE path — repo analysis). Build the `analysis` object from the repo (package tree +
   migration folders), then pass it; the modules become cards inside one shell and the database schemas
   become per-module lanes:
   ```json
   create_from_repo_analysis({
     "analysis": {
       "modules": ["catalog", "ordering", "billing", "identity", "notifications"],
       "entrypoints": ["Acme.Web"],
       "database": { "engine": "postgres", "schemas": ["catalog", "ordering", "billing", "identity", "notifications"] },
       "services": [],
       "integrations": ["sendgrid"]
     },
     "preset": "architecture",
     "save": true,
     "name": "Acme Platform — Modular Monolith"
   })
   ```
   -> groups packages into module cards inside one shell, marks each module's public-API package, and
   assigns each module the schema it owns from the migration folders. Returns
   `{ id: "draw_acme_repo_modmono", warnings: ["modules/ordering reads from billing.invoices table (cross-schema query)"] }`.
3. The warning is a **reach-through** surfaced from the code: Ordering queries Billing's table
   directly. Fix in the diagram — remove the Ordering -> `billing` schema edge and route Ordering to
   `BillingApi` instead (record the code smell for the team).
4. Library vetting + `add_library_items_normalized` (module glyphs, contract-plug badges on each
   public API, one shared `database-symbol` with schema lanes) as in Example A.
5. Quality loop: `lint_drawing` -> `score_drawing` (e.g. `87`) -> `repair_drawing` for any
   `ITEM_OUTSIDE_FRAME` (a module card clipping the shell border after grouping) and the re-routed
   reach-through edge -> re-lint/re-score until `>= 95` and `hardBlockers == []`. Rollback any pass
   that lowers it.
6. `auto_polish_drawing` -> `validate_architecture` (expect `reachThroughs: []` after the fix;
   `sharedDatabases: 1`; `extraDatastores: 0`) -> `suggest_architecture_improvements` (flags the
   original cross-schema query; mark resolved) -> `save_drawing({ title: "Acme Platform — Modular
   Monolith" })` -> `save_version` -> `get_drawing_url` -> `export_drawing`.

---

## Example C — Collapse a microservices drawing + shared-DB secret redaction

**Request**: "We have a microservices drawing of Acme but we actually ship one process and one
database. Reshape it into a modular monolith. The shared Postgres is
`postgres://acme:<password>@db.internal/acme` and the Notifications module calls SendGrid with
`[REDACTED_API_KEY]`."

**Redaction first** (BEFORE any tool call):
- DB URL -> `postgres://acme:[REDACTED_DATABASE_URL]@db.internal/acme`.
- SendGrid key -> `[REDACTED_API_KEY]`.

**Plan line**
```
TYPE=modular-monolith PRESET=architecture
LIBRARY=required[Software Architecture, Architecture diagram components, Database/Data Platform]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements
SOURCE=draw_acme_microservices  STRATEGY=convert
```

**Ordered calls**
1. `read_mcp_guide()` -> `MCP_LIBRARY_MODE = required` (the single shared DB MUST use a db symbol;
   every public API MUST carry a contract glyph; the in-process bus MUST use a bus glyph).
2. `search_libraries`/`inspect_library`/`cache_library` for: module-card, contract-plug, bus-strip,
   db-relational (Postgres).
3. Generate (ONE path — convert, preferred when a microservices drawing exists). Pass the existing
   microservices `structure`; the redacted shared-DB label travels inside it (collapse intent —
   services -> module cards, per-service DBs -> one shared Postgres with schema lanes, broker ->
   in-process bus — is described in the `name`/title and refined afterward):
   ```json
   convert_diagram_type({
     "structure": {
       "nodes": [
         { "id": "Catalog", "schema": "catalog" },
         { "id": "Ordering", "schema": "ordering" },
         { "id": "Billing", "schema": "billing" },
         { "id": "Notifications", "schema": "notifications", "integration": "[REDACTED_API_KEY]" },
         { "id": "Shared Postgres", "label": "postgres://acme:[REDACTED_DATABASE_URL]@db.internal/acme" }
       ],
       "edges": []
     },
     "targetType": "modular-monolith",
     "preset": "architecture",
     "save": true,
     "name": "Acme — Modular Monolith (collapsed from microservices)"
   })
   ```
   -> each former service becomes a module card inside one Acme.Web shell; the per-service databases
   merge into ONE shared Postgres cylinder, each former service's data becoming a schema lane; the
   external broker collapses to an in-process bus; the API gateway becomes the shell edge. Returns
   `{ id: "draw_acme_modmono_from_ms" }`.
4. `add_library_items_normalized` — required-mode placements: ONE `database-symbol` on the shared
   Postgres cylinder (labelled `postgres://acme:[REDACTED_DATABASE_URL]@db.internal/acme`, schema
   lanes inside), contract-plug badges on every module's public API, a bus-strip glyph on the
   in-process bus, a key icon labelled `[REDACTED_API_KEY]` on the Notifications module's SendGrid
   call. Do NOT add a second database-symbol.
5. Quality loop: `lint_drawing` (expect `FRAME_TITLE_OVERLAP` where an old service title collides with
   the new shell title band, and possibly a stray second db-symbol from the merge) -> `score_drawing`
   -> `repair_drawing` (drop stale service titles; delete any duplicate database-symbol so exactly one
   shared DB remains; reserve the shell title band) -> re-lint/re-score to `>= 95`,
   `hardBlockers == []`. Rollback on any drop.
6. `auto_polish_drawing` -> `validate_architecture` (exactly one shell; exactly one shared DB; each
   module owns one schema lane; no per-module database; no reach-through) ->
   `suggest_architecture_improvements` (apply accepted).
7. `save_drawing({ title: "Acme — Modular Monolith" })` -> `save_version` -> `get_drawing_url`.
8. `export_drawing({ format: "png" })` -> **re-scan export**: confirm the shared-DB cylinder reads
   `postgres://acme:[REDACTED_DATABASE_URL]@db.internal/acme` and the Notifications card reads
   `[REDACTED_API_KEY]` in the rendered labels, not the real values. Done.

---

## Reusable argument fragments
- **Shell + grid layout**: `"layout": { "shellAsOuterFrame": true, "moduleGrid": "2x3", "dbBelowShell": true, "arrowGutters": 32 }`.
- **Public-API stub placement**: `add_library_items_normalized({ libraryId: "software-architecture", itemNames: ["contract-plug"], placement: "badge", save: true })` (one per module boundary).
- **Single shared DB slot**: `add_library_items_normalized({ libraryId: "database-data-platform", itemNames: ["db-relational"], placement: "database-symbol", save: true })` (exactly one shared DB).
- **Allowed dependency edge**: `{ "from": "Ordering", "to": "BillingApi" }` (cross-module edge lands on the public API, never a table).
- **In-process event edges**: `{ "from": "Ordering", "to": "bus", "label": "publishes OrderPlaced" }` and `{ "from": "bus", "to": "Billing", "label": "subscribes OrderPlaced" }`.
- **Boundary check**: `validate_architecture({ structure })` must return
  `sharedDatabases == 1`, `extraDatastores == 0`, `reachThroughs == []`, and `moduleCycles == []`.

See `./checklist.md`, `./anti-patterns.md`, and the shared references under `../../_shared/references/`.
