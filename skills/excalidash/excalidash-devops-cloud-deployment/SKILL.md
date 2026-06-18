---
name: excalidash-devops-cloud-deployment
description: Use when you need a CI/CD pipeline and/or cloud deployment topology — ordered pipeline stages left-to-right, environment/zone frames (dev/stage/prod, VPC/region/cluster), and provider logos placed in deployment-target slots.
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__create_diagram_from_prompt
  - mcp__excalidash__convert_diagram_type
  - mcp__excalidash__create_from_repo_analysis
  - mcp__excalidash__apply_architecture_skill
  - mcp__excalidash__search_libraries
  - mcp__excalidash__inspect_library
  - mcp__excalidash__cache_library
  - mcp__excalidash__add_library_items_normalized
  - mcp__excalidash__lint_drawing
  - mcp__excalidash__score_drawing
  - mcp__excalidash__repair_drawing
  - mcp__excalidash__auto_polish_drawing
  - mcp__excalidash__validate_architecture
  - mcp__excalidash__suggest_architecture_improvements
  - mcp__excalidash__save_drawing
  - mcp__excalidash__save_version
  - mcp__excalidash__get_drawing_url
  - mcp__excalidash__export_drawing
---

# DevOps & Cloud Deployment

## Objective
Produce a deployment diagram that tells two stories on one breathable canvas: the **CI/CD
pipeline** (commit -> build -> test -> package -> registry -> deploy, read strictly
left-to-right) and the **runtime deployment topology** it ships into (cloud zones / VPC /
regions, an orchestration cluster with namespaced environments, load balancers, managed
services, and the container images that move from the registry into running pods). Pipeline
stages sit in an ordered LR band; environments (dev / stage / prod) are framed; cloud
zones (VPC / region / cluster) are framed; provider logos sit in reserved deployment-target
slots; promotion arrows flow forward and are clearly distinct from the synchronous request
path inside the runtime. The result must score >= 95 with zero hard blockers.

## When to use / When NOT to use
**Use when**: the request is "draw our CI/CD pipeline", "show how a commit gets to
production", "map our cloud deployment topology", "what's running in each environment", "show
the VPC / k8s cluster / load balancers / managed services", "diagram the path from the
registry into the cluster", or "how do we promote a build from stage to prod".
**Use when**: you have a repository analysis (modules, entrypoints, services, database,
integrations) and want the deployable shape of it -> `create_from_repo_analysis`, then frame
the result into environments.
**Use when**: you already have a flat architecture or microservices diagram and want to
re-cast it as a deployment topology -> `convert_diagram_type` with `targetType: "deployment"`.

**Do NOT use when**:
- The request is the *internal* application structure (apps, APIs, datastores inside one
  system boundary) -> use the **C4 Container** skill; do not turn a container view into a
  deployment view by adding clouds.
- The request is a pure logs/metrics/traces telemetry pipeline -> use the **Observability
  Flow** skill (dashed telemetry edges, signal-type legend).
- The request is a time-ordered incident/troubleshooting walk-through -> use the
  **Troubleshooting Swimlane** skill (lanes, decisions, terminal states).
- The request is an MCP/AI server's internal transport/auth/registry separation -> use the
  **AI & MCP Architecture** skill.
- One canvas would need every environment fully exploded AND the full pipeline AND every
  managed service -> split: one pipeline diagram, one per-environment topology, cross-
  referenced by shared node names (see `../_shared/references/architecture-patterns.md`,
  "Splitting Complex Systems").

## Expected input
A short description of the delivery path and the runtime, ideally naming:
- **Pipeline stages** — ordered: source/commit, build, unit/integration test, package/image
  build, push to **registry**, deploy/promote. Name the tools where known (GitHub Actions,
  GitLab CI, Jenkins, Argo CD).
- **Registry** — the container/image registry the pipeline pushes to and the cluster pulls
  from (ECR, GCR/Artifact Registry, GHCR, Docker Hub).
- **Environments** — dev / stage / prod (or a subset), and how a build is **promoted**
  between them (auto on merge, manual gate, canary).
- **Cloud zones** — provider, region(s), VPC/subnets, availability zones where relevant.
- **Orchestration** — cluster/runtime (Kubernetes, ECS, Nomad, serverless), namespaces,
  workloads (Deployments/Services/pods), ingress.
- **Edge & traffic** — load balancer / ingress / CDN / API gateway in front of the cluster.
- **Managed services** — managed DB, cache, queue, object store, secrets manager the
  workloads depend on.
If a piece is unstated, infer the obvious default (e.g. "push to a container registry, cluster
pulls the image") and state the assumption. Secrets must be pre-redacted (see below).

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, scoring rubric.
2. `mcp__excalidash__search_libraries` -> `mcp__excalidash__inspect_library` ->
   `mcp__excalidash__cache_library` — vet pipeline, container/k8s, load-balancer, managed-
   service and provider-logo icons from the curated packs.
3. ONE create path:
   - `mcp__excalidash__create_diagram_from_prompt` with `diagramType: "deployment"`,
     `direction: "LR"`, and a `structure` of pipeline + topology nodes/edges, OR
   - `mcp__excalidash__create_from_repo_analysis` when a repo analysis is supplied, then frame
     the result into environments, OR
   - `mcp__excalidash__convert_diagram_type` with `targetType: "deployment"` to re-cast an
     existing architecture/microservices drawing.
4. `mcp__excalidash__add_library_items_normalized` — place provider logos in `cloud-provider`
   slots, container/k8s glyphs `inside-card-top`, managed-store glyphs in `database-symbol`.
5. `mcp__excalidash__lint_drawing` -> `mcp__excalidash__score_drawing` ->
   `mcp__excalidash__repair_drawing` (loop).
6. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
7. `mcp__excalidash__validate_architecture` -> `mcp__excalidash__suggest_architecture_improvements`
   — confirm the deployment topology is sane (promotion flows forward, no env crosses a
   boundary, managed services outside the cluster frame).
8. `mcp__excalidash__save_drawing` -> `mcp__excalidash__save_version` ->
   `mcp__excalidash__get_drawing_url` -> `mcp__excalidash__export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=deployment DIRECTION=LR PRESET=technical-docs LIBRARY=curated[Cloud/DevOps, Technology Logos, Software Architecture] VALIDATORS=lint,score,repair,validate_architecture`.
   Decide the two bands: a top **pipeline band** (LR stages ending at the registry) and a
   lower **runtime band** (zone frame -> cluster frame -> env frames). Redact every secret in
   the input BEFORE it reaches a tool argument.
2. **Generate (one path only).**
   - Default: `create_diagram_from_prompt({ diagramType: "deployment", direction: "LR",
     structure: { nodes, edges }, preset: "technical-docs", title, save: false })` — pipeline
     stages as an ordered LR chain, the registry as the hinge node, then the runtime topology
     as framed zones/clusters/environments fed from the registry.
   - If a repo analysis exists: `create_from_repo_analysis({ analysis: { modules, entrypoints,
     database, services, integrations }, preset: "technical-docs" })`, then frame services
     into env frames and add the pipeline band.
   - If re-casting an existing drawing: `convert_diagram_type({ structure, targetType:
     "deployment" })`.
   - Capture the returned drawing id. Layout intent: pipeline stages flow left-to-right in
     their own band; the registry sits at the band's right edge and is the single hand-off
     into the runtime; **promotion arrows** (dev -> stage -> prod) flow forward only;
     **request/traffic** enters via the load balancer at the runtime edge; managed services
     sit OUTSIDE the cluster frame but INSIDE the VPC/zone frame; reserve >= 32px arrow
     gutters so promotion and traffic lanes never overlap.
3. **Place icons.** `add_library_items_normalized` — provider logo (AWS/GCP/Azure) in the
   zone frame's `cloud-provider` slot, a Kubernetes/orchestrator glyph `inside-card-top` on
   the cluster card, a CI tool logo `badge` on the pipeline band, a load-balancer/ingress
   glyph `inside-card-top` at the edge, managed DB/cache/queue/object-store glyphs in
   `database-symbol`/`inside-card-top`, the registry glyph on the hinge node. Normalize scale
   and aspect; match the preset's stroke and fill. **Reject any icon that introduces
   HIGH_DENSITY, clashes with the preset, or sits in a promotion/traffic arrow lane** — drop
   it and use a primitive. Record used and rejected items.
4. **Lint.** `lint_drawing`; record `hardBlockers`. Must end empty.
5. **Score.** `score_drawing`; record the number and every penalty.
6. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint and
   re-score. Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a repair pass
   lowers the score, restore the last `save_version` checkpoint and apply a smaller fix.
7. **Polish.** Only after blockers clear, run `auto_polish_drawing`; re-score to confirm no
   regression (rollback if it drops below the checkpoint).
8. **Validate.** `validate_architecture` then `suggest_architecture_improvements` — promotion
   flows forward only (no prod -> dev edge), every workload sits inside its env frame and the
   cluster frame, managed services live in the zone frame but outside the cluster frame, the
   registry is the single pipeline -> runtime hinge, and traffic enters via the load balancer.
   Flag a pipeline stage that bypasses the registry, a workload outside any environment, or a
   public-internet edge that skips the load balancer.
9. **Save.** `save_drawing` with a clear title (`"<System> — CI/CD & Deployment"`), then
   `save_version` to checkpoint the accepted state.
10. **Export.** `get_drawing_url` for a link, then `export_drawing` (svg/png/excalidraw);
    re-scan the export for secrets (registry tokens, kubeconfig creds, managed-DB connection
    strings, cloud provider keys are the common leaks here).

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only; draw pipeline stages as rounded rectangles in an LR chain, the
  zone/cluster/env frames by hand, datastores as cylinders; no icon calls.
- **curated** (default) — pull only from **Cloud/DevOps** (AWS/GCP/Azure marks, CI/CD,
  containers, Kubernetes, load balancers), **Technology Logos** (Docker, Argo CD, GitHub
  Actions, Terraform, registries) and **Software Architecture** (gateways, queues, services,
  layers). Managed stores may use **Database/Data Platform** glyphs.
- **required** — every cloud zone MUST carry its provider logo, the cluster MUST carry the
  orchestrator glyph, the registry MUST carry a registry/container glyph, every managed store
  MUST use a database-symbol; a primitive where a curated icon exists is a violation.

Workflow: `search_libraries({ q, mode, category })` -> `inspect_library({ libraryId })`
(aspect, stroke, fill, complexity) -> `cache_library` -> `add_library_items_normalized`. Icon
slots: `cloud-provider` for the zone/provider logo, `inside-card-top` for cluster/load-
balancer/registry glyphs (32x32), `database-symbol` for managed stores, `badge` for the CI
tool mark on the pipeline band, `legend` for the keyed swatches (pipeline stage / cluster /
managed service / promotion / traffic). Normalize scale, preserve aspect, match the preset's
stroke and fill. **Reject any icon that introduces HIGH_DENSITY or collides with an arrow
lane** — drop it and use a primitive. Record used and rejected items.

## Validation & score
- `hardBlockers` must be empty: no `ARROW_TEXT_INTERSECTION` (a promotion or traffic label
  never sits under a routed line), no `FRAME_TITLE_OVERLAP` (zone/cluster/env frame titles and
  the legend header stay title-only), no `ITEM_OUTSIDE_FRAME` (every workload fully inside its
  env frame; the env frames fully inside the cluster frame; managed services inside the zone
  frame but outside the cluster frame, not half-clipped).
- No arrow over text: each promotion/traffic/pull label rides in a clear gutter beside its
  line; `ARROW_TEXT_INTERSECTION == 0`.
- No `FRAME_TITLE_OVERLAP`: the diagram title, the zone/cluster/env frame titles, and the
  legend header do not collide with each other or with a node.
- No `ITEM_OUTSIDE_FRAME`: workloads inside env frames, env frames inside the cluster, managed
  services inside the zone frame.
- Penalties driven to zero: `SMALL_FONT` (all text >= 16px, headings >= 20px),
  `HIGH_DENSITY` (>= 48px card gaps, >= 64px frame gaps, >= 32px arrow lanes), `TEXT_NEAR_EDGE`
  (all content >= 40px from canvas/export bounds).
- `validate_architecture` clean: promotion flows forward, registry is the single hinge, no
  workload orphaned, managed services outside the cluster, traffic enters via the load
  balancer.
- **Minimum score 95 with empty hardBlockers.** Repair is mandatory below 95 or with any
  blocker; rollback any pass that lowers the score.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. Deployment diagrams are secret-prone
because they touch registries, clusters and managed services. Redact BEFORE any tool call and
re-scan the export. Concrete examples:
- registry login: `docker login -u ci -p [REDACTED_TOKEN]` -> show `registry pull/push (auth:
  [REDACTED_TOKEN] placeholder)`.
- managed DB URL: `postgres://app:<password>@prod-db.rds.amazonaws.com/orders` ->
  `postgres://app:[REDACTED_DATABASE_URL]@prod-db.rds.amazonaws.com/orders`.
- cloud provider key: `AKIA...` / service-account JSON -> `[REDACTED_PROVIDER_KEY] placeholder`.
- kubeconfig bearer / service-role: `[REDACTED_BEARER] placeholder` / `[REDACTED_SERVICE_ROLE]
  placeholder`.
- webhook signing secret on a deploy hook -> `[REDACTED_WEBHOOK_SECRET] placeholder`.
Show the *concept* (a key icon, an "image pull secret" label) not the value. Never echo a
detected secret back to the user, and never write one into the drawing, response, log, or
snapshot.

## Internal prompts
- **Deployment structure prompt**: `"Deployment diagram for <SYSTEM>, direction LR. Pipeline
  band (LR): 'Commit' -> 'Build' -> 'Test' -> 'Image Build' -> 'Push to Registry'. Registry:
  'Container Registry' (ECR). Runtime: zone frame '<PROVIDER> <REGION> / VPC' containing
  cluster frame 'Kubernetes' containing env frames 'dev', 'stage', 'prod'; each env has a
  'Deployment' + 'Service'; ingress 'Load Balancer' at the edge. Managed services (in VPC,
  outside cluster): 'Managed DB', 'Cache', 'Object Store'. Edges: registry -> each env
  'pulls image'; dev -> stage -> prod 'promote'; internet -> 'Load Balancer' -> prod
  'Service' 'serves traffic'; prod workloads -> 'Managed DB' 'reads/writes'. Legend: pipeline
  stage / cluster / managed service / promote / traffic."`
- **Repo-analysis prompt**: `create_from_repo_analysis({ analysis: { modules, entrypoints,
  database, services, integrations }, preset: "technical-docs", save: false })` then frame
  services into env frames and prepend the pipeline band.
- **Repair nudge**: `"ARROW_TEXT_INTERSECTION on the 'promote' edge between stage and prod ->
  route the promotion line through the inter-env gutter and move the label into the side lane
  with 32px clearance; keep the 'prod' env frame fixed inside the cluster frame."`
- **Boundary nudge**: `"ITEM_OUTSIDE_FRAME on 'Managed DB' -> it must sit inside the VPC/zone
  frame but outside the cluster frame; resize the zone frame so the managed-service row is
  fully contained with >= 16px inset."`

## Example prompts for Claude Code
- "Draw our CI/CD pipeline and cloud deployment: GitHub Actions builds and pushes to ECR, Argo
  CD deploys to an EKS cluster with dev/stage/prod namespaces behind an ALB."
- "Show how a commit gets to production — build, test, image to the registry, then promotion
  through staging into prod on Kubernetes."
- "Map our GCP deployment topology: VPC, GKE cluster, Cloud SQL, Memorystore, and a global load
  balancer in front."
- "We have a repo analysis JSON — turn it into a deployment diagram with environments and the
  pipeline that ships it."
- "Re-cast our microservices architecture as a deployment view with zones, the cluster and
  managed services."

## Acceptance criteria
- [ ] Pipeline stages are ordered and read strictly left-to-right, ending at the registry.
- [ ] The registry is the single hand-off between the pipeline and the runtime.
- [ ] Cloud zones (VPC / region) are framed; the orchestration cluster is framed inside them.
- [ ] Environments (dev / stage / prod) are framed; every workload sits inside its env frame.
- [ ] Promotion arrows flow forward only (no prod -> dev edge) and are distinct from the
      synchronous traffic path.
- [ ] Managed services live inside the zone frame but OUTSIDE the cluster frame.
- [ ] Traffic enters via the load balancer / ingress at the runtime edge.
- [ ] Provider logos sit in `cloud-provider` slots; cluster/registry/store glyphs normalized.
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`).
- [ ] No `FRAME_TITLE_OVERLAP` and no `ITEM_OUTSIDE_FRAME`.
- [ ] `validate_architecture` clean; `suggest_architecture_improvements` reviewed.
- [ ] No secret leaked in drawing, response, or export (registry tokens / DB URLs / provider
      keys redacted as `[REDACTED_<TYPE>]`).

## Examples
See `./references/examples.md` for full request -> plan line -> ordered tool calls with
realistic arguments, plus `./references/checklist.md` and `./references/anti-patterns.md`.
Shared rules live in `../_shared/references/library-policy.md`,
`../_shared/references/security-redaction.md`, `../_shared/references/geometry-rules.md`, and
`../_shared/references/architecture-patterns.md`.
