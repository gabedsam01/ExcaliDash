# Library Curator — Worked Examples

These traces show real call sequences with concrete arguments using the real MCP tool schemas.
IDs and library/item names are illustrative. Secrets are redacted BEFORE any call.

## Example 1 — Enriching a serverless API diagram (88 -> 96)

Context: A repo-analysis diagram has plain boxes for "API Gateway", "Lambda", "DynamoDB", "S3", and a "User" actor. Structure is correct; it scores 88 and looks flat. `MCP_LIBRARY_MODE = curated`.

```
1) read_mcp_guide()                         # MCP_LIBRARY_MODE = curated
2) get_drawing({ "id": "drw_a17c" })
   -> 5 nodes, 5 arrows; snapshot kept for rollback
3) score_drawing({ "minimumScore": 95 })
   -> { score: 88, hardBlockers: [],
        mathematicalEvidence: { overlapAreaPx2: 0, arrowTextIntersections: 0,
                                viewportFitRatio: 0.91, density: "ok" } }
4) search_libraries({ "q": "api gateway",   "mode": "specialized", "category": "aws" })   -> ["aws-architecture-icons"]
   search_libraries({ "q": "lambda serverless", "mode": "specialized", "category": "aws" }) -> ["aws-architecture-icons"]
   search_libraries({ "q": "dynamodb nosql", "mode": "specialized", "category": "data" })   -> ["aws-architecture-icons","data-platform"]
   search_libraries({ "q": "s3 object storage", "mode": "specialized", "category": "aws" }) -> ["aws-architecture-icons"]
   search_libraries({ "q": "user person actor", "mode": "core", "category": "c4" })          -> ["c4-architecture"]
5) cache_library({ "libraryId": "aws-architecture-icons" })
   cache_library({ "libraryId": "data-platform" })
   cache_library({ "libraryId": "c4-architecture" })
6) inspect_library({ "libraryId": "aws-architecture-icons", "autoCache": true })
   -> apigw / lambda / dynamodb / s3 : aspect ~1:1, line style ok, recolorable -> accept
   inspect_library({ "libraryId": "data-platform" })
   -> kv : duplicate of dynamodb for this node -> reject (redundant)
   inspect_library({ "libraryId": "c4-architecture" })
   -> person: 0.6:1 actor aspect -> accept for actor slot
7) add_library_items_normalized({ "libraryId": "aws-architecture-icons",
        "id": "drw_a17c", "itemNames": ["apigw"],
        "targetCardId": "node_gw", "placement": "inside-card-left", "slotSize": 32, "save": false })
   add_library_items_normalized({ "libraryId": "aws-architecture-icons",
        "id": "drw_a17c", "itemNames": ["lambda"],
        "targetCardId": "node_fn", "placement": "inside-card-left", "slotSize": 32, "save": false })
   add_library_items_normalized({ "libraryId": "aws-architecture-icons",
        "id": "drw_a17c", "itemNames": ["dynamodb"],
        "targetCardId": "node_db", "placement": "database-symbol", "save": false })
   add_library_items_normalized({ "libraryId": "aws-architecture-icons",
        "id": "drw_a17c", "itemNames": ["s3"],
        "targetCardId": "node_obj", "placement": "inside-card-left", "slotSize": 32, "save": false })
   add_library_items_normalized({ "libraryId": "c4-architecture",
        "id": "drw_a17c", "itemNames": ["person"],
        "targetCardId": "node_usr", "placement": "actor", "slotSize": 48, "save": false })
8) score_drawing({ "minimumScore": 95 }) -> { score: 95, hardBlockers: [], mathematicalEvidence: { arrowTextIntersections: 0, density: "ok" } }
9) lint_drawing({ "id": "drw_a17c" }) -> { hardBlockers: [], warnings: [] }
   auto_polish_drawing({ "minimumScore": 95, "save": true })
   score_drawing({ "minimumScore": 95 }) -> 96, hardBlockers: []
10) validate_architecture({ "structure": { "nodes": [...], "edges": [...] } }) -> { ok: true }
11) save_drawing({ "id": "drw_a17c", "name": "Serverless API (curated)" })
    save_version({ "id": "drw_a17c" })   # note: curate: 88 -> 96; +5 icons, 1 rejected (kv redundant)
    get_drawing_url({ "id": "drw_a17c" }) -> https://excalidash.app/d/drw_a17c
    export_drawing({ "id": "drw_a17c", "format": "png" })
```

Ledger:
- Used: aws-architecture-icons:apigw -> node_gw.inside-card-left; lambda -> node_fn.inside-card-left; dynamodb -> node_db.database-symbol; s3 -> node_obj.inside-card-left; c4-architecture:person -> node_usr.actor.
- Rejected: data-platform:kv (redundant with dynamodb on the same node).

## Example 2 — Rejecting an item that lowers the score

Context: A microservices map scores 93. We try a highly detailed multi-color "Kubernetes" logo on a tight card. `MCP_LIBRARY_MODE = curated`.

```
score_drawing({ "minimumScore": 95 }) -> 93 (baseline before this item)
inspect_library({ "libraryId": "technology-logos", "autoCache": true })
  -> k8s-detailed: many strokes, off-palette gradient -> risky
  -> k8s-flat: single-stroke, recolorable -> preferred
# Try the detailed one first by mistake:
add_library_items_normalized({ "libraryId": "technology-logos", "id": "drw_ms01",
   "itemNames": ["k8s-detailed"], "targetCardId": "node_orch", "placement": "inside-card-left", "save": false })
score_drawing({ "minimumScore": 95 }) -> 90   # WORSE: HIGH_DENSITY on the card
# Score guard fires -> revert k8s-detailed from snapshot, record rejection.
add_library_items_normalized({ "libraryId": "technology-logos", "id": "drw_ms01",
   "itemNames": ["k8s-flat"], "targetCardId": "node_orch", "placement": "inside-card-left", "slotSize": 32, "save": false })
score_drawing({ "minimumScore": 95 }) -> 95, hardBlockers: []
save_version({ "id": "drw_ms01" })   # note: curate: 93 -> 95; +1 icon, 1 rejected (k8s-detailed -> HIGH_DENSITY)
```

Rule demonstrated: trust the measured score, not the look; revert any item that lowers it and fall back to a simpler item or a primitive.

## Example 3 — C4 container diagram with icon slots and redaction

Context: A C4 container view has "Web App", "API", "Postgres", and a "Customer" person. One node's note leaked a connection string. `MCP_LIBRARY_MODE = required`.

```
read_mcp_guide()  # mode = required -> DB node MUST use a database symbol
get_drawing({ "id": "drw_c4ct" }) -> snapshot
score_drawing({ "minimumScore": 95 }) -> 90, hardBlockers: []
# redact before final save:
#   note "postgres://app:<password>@db.prod/main" -> "postgres://app:[REDACTED_DATABASE_URL]@db.prod/main"
search_libraries({ "q": "container", "mode": "core", "category": "c4" })   -> ["c4-architecture"]
search_libraries({ "q": "person customer", "mode": "core", "category": "c4" }) -> ["c4-architecture"]
search_libraries({ "q": "postgresql relational", "mode": "specialized", "category": "data" }) -> ["data-platform","software-logos"]
cache_library({ "libraryId": "c4-architecture" })
cache_library({ "libraryId": "data-platform" })
cache_library({ "libraryId": "software-logos" })
inspect_library({ "libraryId": "data-platform", "autoCache": true })
  -> postgres: canonical store shape -> use for database-symbol slot (required mode)
inspect_library({ "libraryId": "software-logos" })
  -> postgres: brand mark -> use as badge on the same node
add_library_items_normalized({ "libraryId": "c4-architecture", "id": "drw_c4ct",
   "itemNames": ["container"], "targetCardId": "node_web", "placement": "inside-card-top", "slotSize": 32, "save": false })
add_library_items_normalized({ "libraryId": "c4-architecture", "id": "drw_c4ct",
   "itemNames": ["container"], "targetCardId": "node_api", "placement": "inside-card-top", "slotSize": 32, "save": false })
add_library_items_normalized({ "libraryId": "data-platform", "id": "drw_c4ct",
   "itemNames": ["relational"], "targetCardId": "node_db", "placement": "database-symbol", "save": false })
add_library_items_normalized({ "libraryId": "software-logos", "id": "drw_c4ct",
   "itemNames": ["postgres"], "targetCardId": "node_db", "placement": "badge", "slotSize": 16, "save": false })
add_library_items_normalized({ "libraryId": "c4-architecture", "id": "drw_c4ct",
   "itemNames": ["person"], "targetCardId": "node_cust", "placement": "actor", "slotSize": 48, "save": false })
score_drawing({ "minimumScore": 95 }) -> 94, hardBlockers: []
lint_drawing({ "id": "drw_c4ct" }) -> { warnings: ["badge close to label on node_db"] }
repair_drawing({ "save": true, "createVersion": true, "name": "curate-badge-fix" })   # nudge badge to corner
auto_polish_drawing({ "minimumScore": 95, "save": true })
score_drawing({ "minimumScore": 95 }) -> 96, hardBlockers: []
save_drawing({ "id": "drw_c4ct", "name": "C4 Container (curated)" })
save_version({ "id": "drw_c4ct" })   # note: curate: 90 -> 96; +5 icons; DB url redacted
```

Required mode demonstrated: the database node must carry a database symbol; drawing a primitive there would be a policy violation.

## Example 4 — Nothing to curate

Context: A diagram already uses icons everywhere and scores 97, or no curated icon exists for the concepts. `MCP_LIBRARY_MODE = curated`.

```
read_mcp_guide()  # mode = curated
search_libraries({ "q": "proprietary-internal-widget", "mode": "all" }) -> []
# No curated match -> do NOT import arbitrary art. Keep the primitive.
score_drawing({ "minimumScore": 95 }) -> 97, hardBlockers: []
# No insertions warranted. Report: no curated icons applicable; drawing unchanged at 97.
```

Do not import off-policy art just to fill a slot. A primitive in the active preset is correct when no curated icon exists.

See `./checklist.md`, `./anti-patterns.md`, and the shared references under `../_shared/references/`.
</content>
</invoke>
