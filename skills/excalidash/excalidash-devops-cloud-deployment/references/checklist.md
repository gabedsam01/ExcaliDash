# DevOps & Cloud Deployment — Operating Checklist

A gate-by-gate checklist for building a CI/CD pipeline + cloud deployment topology. Do not
advance to the next gate until the current one passes.

## Gate 0 — Read context
- [ ] Called `read_mcp_guide`; know the `technical-docs` preset and the scoring rubric.
- [ ] Read `MCP_LIBRARY_MODE` (off / curated / required).
- [ ] Scanned the input for secrets — registry login tokens, kubeconfig bearer, managed-DB
      connection strings, cloud provider keys/service-account JSON, deploy-hook webhook
      secrets, service-role tokens.

## Gate 1 — Confirm deployment scope (two bands)
- [ ] Listed the **pipeline stages** in order (commit / build / test / image build / push to
      registry / deploy) with the CI tool named where known.
- [ ] Identified the single **registry** the pipeline pushes to and the cluster pulls from.
- [ ] Listed the **environments** (dev / stage / prod) and the **promotion** rule between them.
- [ ] Identified the **cloud zone(s)** — provider, region, VPC.
- [ ] Identified the **orchestration** runtime (Kubernetes / ECS / serverless) and its
      workloads (Deployment / Service / pods) and namespaces.
- [ ] Identified the **edge** — load balancer / ingress / CDN / API gateway.
- [ ] Listed the **managed services** (DB / cache / queue / object store / secrets manager).

## Gate 2 — Plan line (write it before any create call)
- [ ] `TYPE=deployment` and `DIRECTION=LR`.
- [ ] `PRESET=technical-docs`.
- [ ] `LIBRARY=` off, or curated/required + `Cloud/DevOps, Technology Logos, Software Architecture`.
- [ ] `VALIDATORS=lint,score,repair,validate_architecture`.
- [ ] Two bands decided: top pipeline band (LR), lower runtime band (zone -> cluster -> envs).

## Gate 3 — Library decision
- [ ] In `off`: no library calls; pipeline stages, frames and cylinders drawn with primitives.
- [ ] In `curated`/`required`: searched **Cloud/DevOps** (provider marks, CI/CD, containers,
      Kubernetes, load balancers), **Technology Logos** (Docker, Argo CD, GitHub Actions,
      registries), **Software Architecture** (gateways, queues, services); managed stores from
      **Database/Data Platform**.
- [ ] Inspected each candidate (aspect, stroke, fill, complexity); cached keepers.
- [ ] Mapped each icon to a slot: `cloud-provider` (zone/provider logo), `inside-card-top`
      (cluster / load balancer / registry glyph), `database-symbol` (managed stores), `badge`
      (CI tool mark), `legend` (keyed swatches).

## Gate 4 — Generate (one path only)
- [ ] Secrets redacted in prompt/args BEFORE the call.
- [ ] Called exactly ONE of:
      `create_diagram_from_prompt({ diagramType:"deployment", direction:"LR", structure })`,
      `create_from_repo_analysis({ analysis })` (then frame into environments),
      `convert_diagram_type({ targetType:"deployment" })` (re-cast an existing drawing).
- [ ] Layout intent: pipeline LR band ends at the registry; registry is the single hinge into
      the runtime; zone frame holds the cluster frame; cluster holds env frames; managed
      services in the zone frame but outside the cluster; load balancer at the edge; >= 32px
      arrow gutters reserved.
- [ ] Captured the returned drawing id.

## Gate 5 — Lint -> score -> repair loop
- [ ] `lint_drawing`: `hardBlockers` read and listed.
- [ ] `score_drawing`: numeric score and every penalty recorded.
- [ ] `repair_drawing` called for each blocker/penalty (mandatory if score < 95 or blocker
      present).
- [ ] Re-linted and re-scored after each repair.
- [ ] **Rollback applied** if a repair pass lowered the score (restored prior version, smaller
      fix).
- [ ] Loop exited only at `score >= 95` AND `hardBlockers == []`.

## Gate 6 — Polish + architecture validation
- [ ] `auto_polish_drawing` run after blockers cleared; re-scored (no regression).
- [ ] `validate_architecture` clean:
      - [ ] pipeline stages ordered LR, ending at the registry,
      - [ ] registry is the single pipeline -> runtime hinge,
      - [ ] promotion flows forward only (no prod -> dev edge),
      - [ ] every workload inside its env frame; env frames inside the cluster frame,
      - [ ] cluster frame inside the zone frame; managed services in the zone but outside the
            cluster,
      - [ ] traffic enters via the load balancer; no public edge skips it,
      - [ ] no orphan workload, registry, or managed service.
- [ ] `suggest_architecture_improvements` reviewed for topology smells.

## Gate 7 — Save + export
- [ ] `save_drawing` with title `"<System> — CI/CD & Deployment"`.
- [ ] `save_version` checkpoint of the accepted state.
- [ ] `get_drawing_url` for the shareable link.
- [ ] `export_drawing` produced (svg / png / excalidraw); export re-scanned for secrets
      (registry tokens / kubeconfig creds / managed-DB URLs / provider keys).

## Hard blockers (must all be ABSENT)
- [ ] ARROW_TEXT_INTERSECTION — no promotion/traffic/pull line crosses any label or card text.
- [ ] FRAME_TITLE_OVERLAP — zone/cluster/env frame titles and the legend header stay
      title-only.
- [ ] ITEM_OUTSIDE_FRAME — workloads inside env frames; env frames inside the cluster; cluster
      inside the zone; managed services inside the zone, outside the cluster (not half-clipped).

## Penalties (drive toward zero)
- [ ] TEXT_NEAR_EDGE — content kept >= 40px from canvas/export bounds.
- [ ] HIGH_DENSITY — gaps >= 48px card/card, >= 64px frame/frame, >= 32px arrow lanes; grid not
      crowded.
- [ ] SMALL_FONT — all text >= 16px, headings >= 20px, namespace/stage sub-labels fit with
      padding.

## Deployment-specific sanity checks
- [ ] Pipeline reads strictly left-to-right and ends at the registry.
- [ ] The registry is the single hand-off between pipeline and runtime.
- [ ] Promotion is forward-only and visually distinct from the traffic path.
- [ ] Managed stores read as stores (cylinder/database-symbol), not plain boxes.
- [ ] Cloud zones carry a provider logo in the `cloud-provider` slot.
- [ ] Managed services sit in the zone frame but outside the cluster frame.
- [ ] Traffic enters only via the load balancer / ingress.
- [ ] The legend names the deployment vocabulary: pipeline stage / cluster / managed service /
      promote / traffic.

See `../../_shared/references/geometry-rules.md`, `../../_shared/references/library-policy.md`,
`../../_shared/references/security-redaction.md`, and
`../../_shared/references/architecture-patterns.md`.
