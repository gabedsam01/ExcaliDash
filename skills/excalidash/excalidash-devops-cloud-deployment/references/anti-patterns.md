# DevOps & Cloud Deployment — Anti-Patterns

Failure modes specific to CI/CD + cloud deployment diagrams, why each is wrong, and the fix.
If a draft trips any of these, repair before scoring closes. Lint codes referenced are the
ones the score engine emits: `ARROW_TEXT_INTERSECTION`, `FRAME_TITLE_OVERLAP`,
`ITEM_OUTSIDE_FRAME`, `SMALL_FONT`, `HIGH_DENSITY`, `TEXT_NEAR_EDGE`.

## Pipeline direction & ordering

### 1. Pipeline stages out of order or not left-to-right
**Symptom**: "Test" sits left of "Build", or the stages wrap into a grid with no clear reading
order.
**Why wrong**: a pipeline is a sequence; out-of-order stages misrepresent the delivery flow.
**Fix**: lay stages in one LR band, `direction: "LR"`, commit -> build -> test -> image ->
push; one forward arrow per hand-off.

### 2. A stage bypassing the registry
**Symptom**: "Build" connects straight to a cluster environment; the image registry is missing
or sits off to the side, unconnected.
**Why wrong**: in container deployment the registry is the hinge — the pipeline pushes an
image, the cluster pulls it. Skipping it hides how artifacts move.
**Fix**: route the pipeline to a single **registry** node at the band's right edge; every env
**pulls image** from that registry. `validate_architecture` should confirm the single hinge.

### 3. Pipeline and runtime merged into one undifferentiated area
**Symptom**: build steps, pods and managed services all share one flat area with no bands.
**Why wrong**: viewers can't tell the build-time chain from the run-time topology.
**Fix**: two bands — a top pipeline band (LR), a lower runtime band (framed zone/cluster/env);
the registry bridges them.

## Environments & promotion

### 4. Promotion arrows flowing backward
**Symptom**: an edge from prod back to dev, or stage -> dev "promote".
**Why wrong**: promotion is forward-only (dev -> stage -> prod); a backward edge implies a
broken release flow. `validate_architecture` flags it.
**Fix**: keep promotion monotonic forward; if you need a rollback, label it "rollback" as a
distinct dashed edge, not a "promote".

### 5. Promotion path indistinguishable from request/traffic path
**Symptom**: the same solid arrow style carries both "promote" and "serves traffic".
**Why wrong**: build-time promotion and run-time traffic are different concerns; one style
conflates them.
**Fix**: style them distinctly (promotion = forward solid with "promote" labels, traffic =
solid into the load balancer) and key both in the legend.

### 6. Workloads not assigned to any environment
**Symptom**: a "Deployment" or pod floats inside the cluster frame but outside every env
frame.
**Why wrong**: a workload runs in an environment; an unframed workload is ambiguous and trips
`ITEM_OUTSIDE_FRAME` against the env frame.
**Fix**: place every workload fully inside its dev/stage/prod env frame with >= 16px inset.

## Zones, cluster & managed services

### 7. Managed services drawn inside the cluster frame
**Symptom**: "Managed DB" / "Cache" / "Object Store" sit inside the Kubernetes/cluster frame.
**Why wrong**: managed services are cloud-provider services, not cluster workloads; placing
them in the cluster implies you run them as pods.
**Fix**: put managed services inside the **VPC/zone** frame but **outside** the cluster frame;
`validate_architecture` should confirm managed services are outside the cluster.

### 8. Cluster or env frame spilling outside the zone frame
**Symptom**: `ITEM_OUTSIDE_FRAME`; the cluster frame is half-clipped by the VPC/zone edge.
**Why wrong**: the cluster runs inside the zone; partial containment is ambiguous and a hard
blocker.
**Fix**: enlarge the zone frame or shrink/move the cluster so it sits fully inside with inset;
nest env frames fully inside the cluster.

### 9. Zone/cluster/env frame title overlapping a child or the legend
**Symptom**: `FRAME_TITLE_OVERLAP`; the "prod" label sits on top of the first workload, or the
zone title collides with the legend header.
**Why wrong**: the reserved 40px title band must stay title-only; overlap is unreadable and a
hard blocker.
**Fix**: reserve the top 40px of each frame for its title; start the first child below the
band; keep the legend header in its own corner block.

## Edge routing, traffic & labels

### 10. Traffic skipping the load balancer
**Symptom**: an internet/public edge connects straight to a pod or env "Service".
**Why wrong**: external traffic should enter via the load balancer / ingress; a direct edge
misrepresents the network path.
**Fix**: route internet -> **Load Balancer** -> env Service; only the load balancer faces the
public edge.

### 11. Pull/promote/traffic line routed over a card
**Symptom**: a "pulls image" or "promote" line passes over another env frame or a workload
card body.
**Why wrong**: it reads as a connection that doesn't exist and clutters the topology.
**Fix**: route lines through reserved >= 32px gutters between frames/cards; never cross a card.

### 12. Promotion/traffic label sitting under its line
**Symptom**: `ARROW_TEXT_INTERSECTION`; the "promote" or "pulls image" label is overdrawn by
the routed arrow.
**Why wrong**: the label is unreadable and it is a hard blocker.
**Fix**: move the label into the side lane beside the line with 32px clearance; keep endpoints
fixed.

## Node typing & icons

### 13. Managed datastores drawn as plain boxes
**Symptom**: "RDS" / "Cloud SQL" / "Memorystore" rendered as rectangles identical to services.
**Why wrong**: managed stores must read as stores; under `required` mode this is a policy
violation.
**Fix**: use the `database-symbol` slot (cylinder/db glyph) for managed relational/cache
stores; object stores use a bucket/store glyph.

### 14. Cloud zone with no provider logo (required mode) or off-policy logos
**Symptom**: a bare "AWS region" rectangle in `required` mode, or a provider mark pulled from
an arbitrary public library.
**Why wrong**: `required` mode mandates the provider logo in the `cloud-provider` slot;
off-policy art violates `MCP_LIBRARY_MODE = curated` and adds noise (`HIGH_DENSITY`).
**Fix**: pull provider marks from **Cloud/DevOps** and **Technology Logos** only; place them
in the `cloud-provider` slot; normalize stroke/fill; reject and record anything that lowers
the score and fall back to a primitive.

### 15. Over-detailed multi-color provider icons crowding the canvas
**Symptom**: busy full-color cloud-architecture glyphs make gaps shrink below minimums and
trip `HIGH_DENSITY`.
**Why wrong**: detail-heavy icons clash with the technical-docs preset and crowd the topology.
**Fix**: prefer simple monochrome marks normalized to 32x32 in slots; widen frame gaps to
>= 64px; record the rejected detailed variant.

## Layout, legend & density

### 16. No legend for the deployment vocabulary
**Symptom**: viewers can't tell a pipeline stage from a cluster from a managed service, or a
promotion edge from a traffic edge.
**Why wrong**: the diagram relies on conventions that go unexplained.
**Fix**: add a legend keying pipeline stage / cluster / managed service / promote / traffic in
a corner `legend` block.

### 17. Crowded environment grid (HIGH_DENSITY)
**Symptom**: env frames packed with < 64px gaps, workloads < 48px apart, no room for gutters.
**Why wrong**: promotion and pull arrows cannot route cleanly and density penalties pile up.
**Fix**: lay env frames in a roomy row inside the cluster with >= 64px frame gaps and >= 32px
arrow lanes; split into per-environment diagrams if one canvas stays dense.

### 18. Content hugging the export edge
**Symptom**: `TEXT_NEAR_EDGE`; the legend or a corner zone frame touches the canvas bound.
**Why wrong**: it looks clipped and is penalized when text is involved.
**Fix**: keep all content >= 40px from canvas/export bounds.

### 19. Sub-16px stage labels
**Symptom**: `SMALL_FONT`; pipeline stage captions or namespace labels shrunk below 16px to
fit a crowded band.
**Why wrong**: under-16px text is illegal and penalized per element.
**Fix**: raise font to >= 16px (headings >= 20px) and widen the band/frames so text fits with
16px padding.

## Security

### 20. Live registry/cluster/managed-service credentials on a card
**Symptom**: a label reads `docker login -p [REDACTED_TOKEN]`, a kubeconfig bearer token, or
`postgres://app:<password>@prod-db.rds.amazonaws.com/orders` on the managed-DB card.
**Why wrong**: deployment diagrams are exported and embedded; a live secret leaks.
**Fix**: redact BEFORE the create call -> registry auth as `[REDACTED_TOKEN] placeholder`,
managed DB as `postgres://app:[REDACTED_DATABASE_URL]@prod-db.rds.amazonaws.com/orders`,
provider keys as `[REDACTED_PROVIDER_KEY] placeholder`, kubeconfig bearer as `[REDACTED_BEARER]
placeholder`; re-scan the export. Show the *concept* (a key icon, an "image pull secret"
label), never the value.

## Quality loop

### 21. Skipping repair / accepting score < 95
**Symptom**: saving at 90 with a remaining penalty "because it looks fine".
**Why wrong**: repair is mandatory below 95 or with any blocker.
**Fix**: run the lint -> score -> repair loop until `score >= 95` and `hardBlockers == []`.

### 22. Keeping a repair/polish pass that lowered the score
**Symptom**: an `auto_polish_drawing` pass reflowed the bands and dropped the score below the
checkpoint.
**Why wrong**: every pass must be monotonic-up or be rolled back.
**Fix**: restore the last `save_version` checkpoint and apply a smaller, targeted fix.

See `./checklist.md`, `./examples.md`, and the shared references under `../../_shared/references/`.
