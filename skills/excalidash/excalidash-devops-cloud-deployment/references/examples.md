# DevOps & Cloud Deployment — Worked Examples

Each example shows: the request -> the plan line -> the ordered MCP tool calls with realistic
arguments -> the quality loop -> save/export. Secrets are redacted BEFORE any call. All tool
names and arguments use the real ExcaliDash schemas.

---

## Example A — GitHub Actions -> ECR -> EKS, three environments (build from prompt)

**Request**: "Draw our CI/CD pipeline and cloud deployment: GitHub Actions builds and pushes
to ECR, Argo CD deploys to an EKS cluster with dev/stage/prod namespaces behind an ALB; prod
reads/writes RDS and caches in ElastiCache."

**Plan line**
```
TYPE=deployment DIRECTION=LR PRESET=technical-docs
LIBRARY=curated[Cloud/DevOps, Technology Logos, Software Architecture]
VALIDATORS=lint,score,repair,validate_architecture
PIPELINE=5 REGISTRY=ECR ENVS=dev,stage,prod ZONE=AWS us-east-1/VPC CLUSTER=EKS
```

**Ordered calls**

1. `read_mcp_guide()` -> note `MCP_LIBRARY_MODE = curated`, technical-docs preset, rubric.
2. Library vetting:
   - `search_libraries({ q: "kubernetes container registry", mode: "curated", category: "Cloud/DevOps" })`
   - `search_libraries({ q: "aws load balancer rds", mode: "curated", category: "Cloud/DevOps" })`
   - `search_libraries({ q: "argo cd github actions docker", mode: "curated", category: "Technology Logos" })`
   - `inspect_library({ libraryId: "cloud-devops" })`, `inspect_library({ libraryId: "technology-logos" })`
   - `cache_library({ libraryId: "cloud-devops" })`, `cache_library({ libraryId: "technology-logos" })`
3. Generate (ONE path):
   ```json
   create_diagram_from_prompt({
     "diagramType": "deployment",
     "direction": "LR",
     "preset": "technical-docs",
     "title": "Checkout Service — CI/CD & Deployment",
     "save": false,
     "structure": {
       "nodes": [
         { "id": "commit",   "label": "Commit",            "kind": "pipeline-stage" },
         { "id": "build",    "label": "Build",             "kind": "pipeline-stage" },
         { "id": "test",     "label": "Test",              "kind": "pipeline-stage" },
         { "id": "image",    "label": "Image Build",       "kind": "pipeline-stage" },
         { "id": "registry", "label": "ECR (Registry)",    "kind": "registry" },
         { "id": "zone",     "label": "AWS us-east-1 / VPC","kind": "zone-frame" },
         { "id": "cluster",  "label": "EKS Cluster",       "kind": "cluster-frame", "parent": "zone" },
         { "id": "dev",      "label": "dev",               "kind": "env-frame", "parent": "cluster" },
         { "id": "stage",    "label": "stage",             "kind": "env-frame", "parent": "cluster" },
         { "id": "prod",     "label": "prod",              "kind": "env-frame", "parent": "cluster" },
         { "id": "lb",       "label": "ALB (Load Balancer)","kind": "edge", "parent": "zone" },
         { "id": "rds",      "label": "RDS (PostgreSQL)",  "kind": "managed-store", "parent": "zone" },
         { "id": "cache",    "label": "ElastiCache",       "kind": "managed-store", "parent": "zone" }
       ],
       "edges": [
         { "from": "commit", "to": "build",    "label": "" },
         { "from": "build",  "to": "test",     "label": "" },
         { "from": "test",   "to": "image",    "label": "" },
         { "from": "image",  "to": "registry", "label": "push" },
         { "from": "registry","to": "dev",     "label": "pulls image" },
         { "from": "registry","to": "stage",   "label": "pulls image" },
         { "from": "registry","to": "prod",    "label": "pulls image" },
         { "from": "dev",    "to": "stage",    "label": "promote" },
         { "from": "stage",  "to": "prod",     "label": "promote" },
         { "from": "lb",     "to": "prod",     "label": "serves traffic" },
         { "from": "prod",   "to": "rds",      "label": "reads/writes" },
         { "from": "prod",   "to": "cache",    "label": "caches in" }
       ]
     }
   })
   ```
   -> returns a drawing id (e.g. `draw_checkout_deploy`).
4. Place icons:
   ```json
   add_library_items_normalized({
     "libraryId": "cloud-devops",
     "itemNames": ["aws", "kubernetes", "elb", "rds", "redis", "ecr"],
     "placement": "cloud-provider",
     "save": false
   })
   ```
   - AWS mark in the zone frame `cloud-provider` slot, Kubernetes glyph `inside-card-top` on
     the EKS card, the ALB glyph `inside-card-top` on the load balancer, RDS in
     `database-symbol`, ElastiCache (Redis) in `database-symbol`, the ECR glyph on the registry
     hinge; Argo CD / GitHub Actions marks as a `badge` on the pipeline band.
5. Quality loop:
   - `lint_drawing({ id: "draw_checkout_deploy" })` ->
     `hardBlockers: ["ARROW_TEXT_INTERSECTION"]` (the three "pulls image" labels overlap where
     the registry fans into the envs).
   - `score_drawing({ minimumScore: 95 })` -> `84` (penalties: ARROW_TEXT_INTERSECTION,
     HIGH_DENSITY).
   - `save_version({ id: "draw_checkout_deploy" })` (rollback target).
   - `repair_drawing({ save: false, createVersion: true, name: "route registry fan-out" })`
     -> route each "pulls image" line through its own gutter, labels into side lanes with 32px
     clearance.
   - `repair_drawing({ save: false })` -> widen the inter-env frame gaps to 64px to clear
     HIGH_DENSITY.
   - re-`lint_drawing` -> `hardBlockers: []`; re-`score_drawing({ minimumScore: 95 })` -> `96`.
6. `auto_polish_drawing({ minimumScore: 95, maxAttempts: 2 })` -> re-score -> `97` (no
   regression; keep).
7. `validate_architecture({ structure: { /* the deployment structure */ } })` ->
   `{ ok: true, registryHinge: true, promotionForwardOnly: true, managedOutsideCluster: true,
   trafficViaLoadBalancer: true, orphans: [] }`; `suggest_architecture_improvements({ structure })`
   -> "consider a canary step before prod" (noted, out of scope for v1).
8. `save_drawing({ id: "draw_checkout_deploy", name: "Checkout Service — CI/CD & Deployment" })`.
9. `save_version({ id: "draw_checkout_deploy" })` (accepted checkpoint).
10. `get_drawing_url({ id: "draw_checkout_deploy" })` -> share link;
    `export_drawing({ id: "draw_checkout_deploy", format: "svg" })` -> re-scan export for
    secrets (none; protocols and service names only). Done.

---

## Example B — From a repository analysis (repo-analysis path) with secret redaction

**Request**: "We have a repo analysis JSON for OrderFlow — turn it into a deployment diagram
with environments and the pipeline that ships it. The orders service connects to
`postgres://app:<password>@prod-db.gcp-sql.internal/orders` and pulls from GHCR using
`[REDACTED_TOKEN]`."

**Redaction first** (BEFORE any tool call):
- DB URL -> `postgres://app:[REDACTED_DATABASE_URL]@prod-db.gcp-sql.internal/orders`.
- registry token `<registry token>` -> `[REDACTED_TOKEN] placeholder` (shown as an "image pull
  secret" label, never the value).

**Plan line**
```
TYPE=deployment DIRECTION=LR PRESET=technical-docs
LIBRARY=required[Cloud/DevOps, Technology Logos, Software Architecture, Database/Data Platform]
VALIDATORS=lint,score,repair,validate_architecture
SOURCE=repo-analysis ZONE=GCP europe-west1/VPC CLUSTER=GKE ENVS=stage,prod
```

**Ordered calls**
1. `read_mcp_guide()` -> `MCP_LIBRARY_MODE = required` (zone MUST carry the GCP logo, cluster
   MUST carry the orchestrator glyph, managed stores MUST use a database-symbol).
2. `search_libraries` / `inspect_library` / `cache_library` for: GCP mark, GKE/Kubernetes,
   Cloud SQL, Memorystore, GHCR/registry, global load balancer.
3. Generate (ONE path — repo analysis):
   ```json
   create_from_repo_analysis({
     "analysis": {
       "modules": ["orders-api", "fulfillment-worker", "web"],
       "entrypoints": ["web (Next.js)", "orders-api (HTTP)"],
       "database": "Cloud SQL (PostgreSQL)",
       "services": ["orders-api", "fulfillment-worker"],
       "integrations": ["GHCR (image pull secret: [REDACTED_TOKEN] placeholder)", "Stripe"]
     },
     "preset": "technical-docs",
     "save": false
   })
   ```
   -> returns a drawing id (e.g. `draw_orderflow_deploy`); then frame `orders-api`,
   `fulfillment-worker`, `web` into `stage` and `prod` env frames inside a GKE cluster frame,
   inside a "GCP europe-west1 / VPC" zone frame, and prepend the pipeline band
   (commit -> build -> test -> image -> GHCR).
4. `add_library_items_normalized` — required-mode placements: GCP mark in the zone
   `cloud-provider` slot, GKE/Kubernetes glyph `inside-card-top` on the cluster card, Cloud SQL
   in `database-symbol` (labelled `postgres://app:[REDACTED_DATABASE_URL]@prod-db.gcp-sql.internal/orders`),
   Memorystore in `database-symbol`, GHCR glyph on the registry hinge, global LB glyph at the
   edge.
   ```json
   add_library_items_normalized({
     "libraryId": "cloud-devops",
     "itemNames": ["gcp", "gke", "cloud-sql", "memorystore", "global-lb"],
     "placement": "cloud-provider",
     "save": false
   })
   ```
5. Quality loop: `lint_drawing({ id })` (expect `ITEM_OUTSIDE_FRAME` — Cloud SQL initially
   placed inside the cluster frame) -> `score_drawing({ minimumScore: 95 })` -> `88` ->
   `repair_drawing({ save: false })` (move Cloud SQL and Memorystore into the zone frame
   outside the cluster, with >= 16px inset) -> re-lint/re-score to `>= 95`, `hardBlockers == []`.
   Rollback any pass that lowers the score.
6. `auto_polish_drawing({ minimumScore: 95 })` -> `validate_architecture({ structure })`
   (managed services outside the cluster; promotion stage -> prod forward; registry single
   hinge) -> `suggest_architecture_improvements({ structure })`.
7. `save_drawing({ id, name: "OrderFlow — CI/CD & Deployment" })` -> `save_version({ id })` ->
   `get_drawing_url({ id })`.
8. `export_drawing({ id, format: "png" })` -> **re-scan export**: confirm the Cloud SQL label
   shows `[REDACTED_DATABASE_URL]` and the registry shows `[REDACTED_TOKEN] placeholder`, not
   the real values. Done.

---

## Example C — Re-cast a microservices architecture into a deployment view (convert path)

**Request**: "We already have our microservices architecture diagram. Re-cast it as a
deployment view with the Azure region, the AKS cluster, and our managed services."

**Plan line**
```
TYPE=deployment DIRECTION=LR PRESET=technical-docs
LIBRARY=curated[Cloud/DevOps, Technology Logos, Software Architecture]
VALIDATORS=lint,score,repair,validate_architecture
SOURCE=existing-microservices STRATEGY=convert ZONE=Azure westeurope CLUSTER=AKS
```

**Ordered calls**
1. `read_mcp_guide()`.
2. Generate (ONE path — convert, preferred when an architecture drawing exists):
   ```json
   convert_diagram_type({
     "structure": { "nodes": [ /* services from the existing diagram */ ], "edges": [ /* ... */ ] },
     "targetType": "deployment",
     "preset": "technical-docs",
     "save": false
   })
   ```
   -> services regroup into env frames inside an AKS cluster frame inside an "Azure westeurope /
   VNet" zone frame; the gateway becomes the edge load balancer; per-service stores become
   managed services in the zone. Returns a new drawing id.
3. `add_library_items_normalized` — Azure mark in the zone `cloud-provider` slot, AKS glyph on
   the cluster, Azure Database / Cache for Redis in `database-symbol`, ACR glyph on the
   registry hinge.
4. Quality loop: `lint_drawing` -> `score_drawing({ minimumScore: 95 })` (e.g. `90`) ->
   `repair_drawing` for any `FRAME_TITLE_OVERLAP` (the converted cluster title sitting on the
   first env frame) -> re-lint/re-score until `>= 95` and `hardBlockers == []`. Rollback any
   pass that lowers the score.
5. `auto_polish_drawing` -> `validate_architecture({ structure })` ->
   `suggest_architecture_improvements({ structure })` ->
   `save_drawing({ id, name: "Platform — CI/CD & Deployment (Azure)" })` -> `save_version({ id })`
   -> `get_drawing_url({ id })` -> `export_drawing({ id, format: "svg" })` (re-scan for secrets).

---

## Reusable argument fragments
- **Registry hinge edges**: every env `{ "from": "registry", "to": "<env>", "label": "pulls image" }`.
- **Forward-only promotion**: `dev -> stage -> prod` with `"label": "promote"`; never a
  backward edge.
- **Traffic entry**: `{ "from": "lb", "to": "<prod service>", "label": "serves traffic" }`;
  only the load balancer faces the public edge.
- **Managed store slot**: `add_library_items_normalized({ libraryId: "cloud-devops", placement:
  "database-symbol", targetCardId: "<managed store card>" })`.
- **Validation expectations**: `validate_architecture({ structure })` should report
  `registryHinge == true`, `promotionForwardOnly == true`, `managedOutsideCluster == true`,
  `trafficViaLoadBalancer == true`, `orphans == []`.

See `./checklist.md`, `./anti-patterns.md`, and the shared references under
`../../_shared/references/`.
