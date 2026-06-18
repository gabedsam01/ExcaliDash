# Portfolio Polished Diagram — Worked Examples

Each example shows: the request -> the plan line -> the ordered REAL MCP tool calls with realistic
arguments (using the actual schemas) -> the quality loop -> save/export. The preset is always
`portfolio-polished`. Secrets are redacted BEFORE any call.

---

## Example A — SaaS architecture overview for a landing page (build from prompt)

**Request**: "Make a portfolio-grade architecture diagram of my SaaS for the homepage — show the web
app, API, workers, Postgres and Stripe; give it a title, a legend and vendor logos; export a PNG."

**Plan line**
```
PRESET=portfolio-polished  SUBJECT=Acme SaaS  NODES=5  EDGES=4  PALETTE=3
LIBRARY=curated[Technology Logos, Software Logos, Software Architecture]
VALIDATORS=lint,score,repair  TITLE_BAND=yes  LEGEND=bottom-left
```

**Ordered calls**

1. `read_mcp_guide()` -> note `MCP_LIBRARY_MODE = curated`, portfolio-polished preset, rubric.
2. Library vetting:
   - `search_libraries({ q: "react node postgres stripe", mode: "curated", category: "logos" })`
   - `inspect_library({ libraryId: "tech-logos", autoCache: true })`
   - `cache_library({ libraryId: "tech-logos" })`
3. Generate (ONE path):
   ```json
   create_diagram_from_prompt({
     "preset": "portfolio-polished",
     "title": "Acme SaaS — Architecture Overview",
     "direction": "LR",
     "structure": {
       "nodes": [
         { "id": "web",     "label": "Web App",   "tech": "React" },
         { "id": "api",     "label": "API",        "tech": "Node.js" },
         { "id": "worker",  "label": "Workers",    "tech": "Node.js" },
         { "id": "db",      "label": "Database",   "tech": "PostgreSQL" },
         { "id": "pay",     "label": "Payments",   "tech": "Stripe" }
       ],
       "edges": [
         { "from": "web",    "to": "api",    "label": "calls" },
         { "from": "api",    "to": "worker", "label": "enqueues" },
         { "from": "api",    "to": "db",     "label": "stores in" },
         { "from": "api",    "to": "pay",    "label": "charges via" }
       ]
     },
     "autoPolish": false,
     "save": false
   })
   ```
   -> returns `{ id: "draw_acme_overview" }`.
4. Place logos (consistent — every node gets one):
   ```json
   add_library_items_normalized({
     "libraryId": "tech-logos",
     "id": "draw_acme_overview",
     "itemNames": ["react", "nodejs", "nodejs", "postgresql", "stripe"],
     "placement": "inside-card-left",
     "slotSize": { "w": 32, "h": 32 },
     "save": false
   })
   ```
   plus legend swatches via a second `add_library_items_normalized({ placement: "legend" })`.
   Normalize: aspect preserved, strokes recolored to the palette.
5. Quality loop:
   - `lint_drawing({ id: "draw_acme_overview" })` -> `hardBlockers: ["ARROW_TEXT_INTERSECTION"]`
     (the "charges via" label under its line).
   - `score_drawing({ minimumScore: 95 })` -> `87` (penalties: ARROW_TEXT_INTERSECTION, HIGH_DENSITY).
   - `save_version({ id: "draw_acme_overview" })` (rollback target).
   - `repair_drawing({ save: true, createVersion: true, name: "route charges-via to gutter" })`.
   - re-`lint_drawing` -> `hardBlockers: []`; re-`score_drawing` -> `96`.
6. `auto_polish_drawing({ minimumScore: 95, maxAttempts: 3, allowDraft: false })` ->
   re-`score_drawing` -> `97` (no regression; keep).
7. `save_drawing({ id: "draw_acme_overview", name: "Acme SaaS — Overview" })`.
8. `save_version({ id: "draw_acme_overview" })` — checkpoint accepted state.
9. `get_drawing_url({ id: "draw_acme_overview" })` -> share link.
10. `export_drawing({ id: "draw_acme_overview", format: "png" })` and
    `export_drawing({ id: "draw_acme_overview", format: "svg" })` -> re-scan both (protocols/labels
    only, no secret). Done.

**Expected result**: a centered, title-banded, legend-keyed overview with consistent React/Node/
Postgres/Stripe logos; `score 97`, `hardBlockers == []`; PNG + SVG exported clean.

---

## Example B — Re-skin a real repo into a deck-quality visual (repo-analysis path)

**Request**: "Re-skin the architecture in this repo into a deck-quality diagram and give me an SVG."

**Plan line**
```
PRESET=portfolio-polished  SUBJECT=Checkout Service  SOURCE=repo-analysis
LIBRARY=curated[Technology Logos, Software Logos, Software Architecture]
VALIDATORS=lint,score,repair
```

**Ordered calls**
1. `read_mcp_guide()`.
2. Generate (ONE path — from a `{ modules, entrypoints, database, services, integrations }` object):
   ```json
   create_from_repo_analysis({
     "analysis": {
       "modules": ["web", "api", "billing", "notifications"],
       "entrypoints": ["web/index.tsx", "api/server.ts"],
       "database": "PostgreSQL",
       "services": ["api", "billing-worker"],
       "integrations": ["Stripe", "SendGrid"]
     },
     "preset": "portfolio-polished",
     "autoPolish": false,
     "save": false
   })
   ```
   -> returns `{ id: "draw_checkout_overview" }`.
3. `add_library_items_normalized({ libraryId: "tech-logos", id: "draw_checkout_overview",
   itemNames: ["postgresql", "stripe", "sendgrid"], placement: "inside-card-left",
   slotSize: { "w": 32, "h": 32 } })` — consistent logos on the branded nodes.
4. Quality loop: `lint_drawing({ id })` -> `score_drawing({ minimumScore: 95 })` (e.g. `89`) ->
   `repair_drawing` for any `ITEM_OUTSIDE_FRAME` (a logo poking past a card edge) and `HIGH_DENSITY`
   (widen gutters) -> re-lint/re-score until `>= 95` and `hardBlockers == []`. Rollback any pass
   that lowers the score.
5. `auto_polish_drawing({ minimumScore: 95, allowDraft: false })` -> re-score (no regression).
6. `save_drawing({ id, name: "Checkout Service — Overview" })` -> `save_version({ id })` ->
   `get_drawing_url({ id })` -> `export_drawing({ id, format: "svg" })` (+ `png`) -> re-scan.

---

## Example C — Polish an existing rough diagram for a public README (convert path + redaction)

**Request**: "Polish this whiteboard diagram to portfolio quality for the README: consistent icons,
a strong legend, generous spacing. One node label has a connection string
`postgres://app:<password>@db.internal/orders`."

**Redaction first** (BEFORE any tool call): the Postgres URL carries a password ->
`postgres://app:[REDACTED_DATABASE_URL]@db.internal/orders`.

**Plan line**
```
PRESET=portfolio-polished  SUBJECT=OrderFlow  STRATEGY=convert(re-skin)
LIBRARY=curated[Technology Logos, Software Logos, Software Architecture]
VALIDATORS=lint,score,repair  REDACT=db-url
```

**Ordered calls**
1. `read_mcp_guide()`.
2. Generate (ONE path — re-skin the existing structure into a clean architecture view):
   ```json
   convert_diagram_type({
     "structure": {
       "nodes": [
         { "id": "web", "label": "Web App", "tech": "React" },
         { "id": "api", "label": "Orders API", "tech": "Node.js" },
         { "id": "db",  "label": "Orders DB", "tech": "PostgreSQL", "note": "postgres://app:[REDACTED_DATABASE_URL]@db.internal/orders" }
       ],
       "edges": [
         { "from": "web", "to": "api", "label": "calls" },
         { "from": "api", "to": "db",  "label": "stores in" }
       ]
     },
     "targetType": "architecture",
     "preset": "portfolio-polished",
     "autoPolish": false,
     "save": false
   })
   ```
   -> returns `{ id: "draw_orderflow_overview" }`.
3. `add_library_items_normalized({ libraryId: "tech-logos", id: "draw_orderflow_overview",
   itemNames: ["react", "nodejs", "postgresql"], placement: "inside-card-left",
   slotSize: { "w": 32, "h": 32 } })`; legend swatches via `placement: "legend"`.
4. Quality loop: `lint_drawing` -> `score_drawing({ minimumScore: 95 })` ->
   `repair_drawing` (route any crossing edge to a gutter, widen gutters for HIGH_DENSITY) ->
   re-lint/re-score to `>= 95`, `hardBlockers == []`. Rollback on any drop.
5. `auto_polish_drawing({ minimumScore: 95, allowDraft: false })`.
6. `save_drawing({ id, name: "OrderFlow — Overview" })` -> `save_version({ id })` ->
   `get_drawing_url({ id })`.
7. `export_drawing({ id, format: "png" })` (+ `svg`) -> **re-scan exports**: confirm the DB label
   renders as `postgres://app:[REDACTED_DATABASE_URL]@db.internal/orders`, not the real password.
   Done.

---

## Reusable argument fragments
- **Control the polish loop**: pass `autoPolish: false, save: false` on the create call so you run
  `lint -> score -> repair -> auto_polish` yourself and gate on `score >= 95`.
- **Consistent node logos**: `add_library_items_normalized({ placement: "inside-card-left",
  slotSize: { "w": 32, "h": 32 } })` with one `itemName` per branded node, aspect preserved.
- **Legend swatches**: a second `add_library_items_normalized({ placement: "legend" })`.
- **Dual export for decks + print**: `export_drawing({ format: "png" })` and
  `export_drawing({ format: "svg" })`; re-scan both for redacted secrets.

See `./checklist.md`, `./anti-patterns.md`, and the shared references under
`../../_shared/references/`.
