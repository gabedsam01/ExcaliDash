# Microservices Topology — Checklist

Run this checklist before saving/exporting. Every box must be checked or the drawing is not done.
See the parent `../SKILL.md` for the full workflow and `../../_shared/references/*.md` for shared rules.

## 1. Plan (before any create call)
- [ ] Plan line written:
      `TYPE=microservices PRESET=architecture LIBRARY=curated[Software Architecture, Cloud/DevOps, Technology Logos]
      VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`.
- [ ] API gateway / edge router chosen for the TOP (Kong / AWS API Gateway / nginx ingress / BFF).
- [ ] Services identified for the ROW (each independently deployable).
- [ ] Per-service datastore decided for EACH service (database-per-service; one owned store each).
- [ ] Queue / event bus product chosen for async traffic (RabbitMQ / Kafka / SQS / NATS).
- [ ] Every edge classified: sync (solid, HTTP/gRPC) vs async (dashed, queue/event).
- [ ] One frame planned per bounded service (service + its store + optional cache grouped).
- [ ] `MCP_LIBRARY_MODE` read (off / curated / required) — drives whether icons are used.
- [ ] Secrets scanned and redacted in the input BEFORE any tool argument (per-service DB URLs,
      gateway API keys, broker SASL creds, service-role keys, JWT secrets, tokens, bearer, webhook, proxy).

## 2. Generate (exactly ONE create path)
- [ ] One and only one of:
      `apply_architecture_skill({ pattern: "microservices" })` (preferred) /
      `create_from_repo_analysis({ analysis: { modules, entrypoints, database, services, integrations } })` /
      `convert_diagram_type({ structure, targetType: "microservices" })` /
      `create_diagram_from_prompt({ diagramType: "microservices", structure: { nodes, edges } })` /
      `create_from_template({ templateId: "microservices" })`.
- [ ] `drawingId` captured for downstream calls.
- [ ] Layout: gateway TOP, services in a ROW below it, each service's datastore directly BELOW it in
      the same frame, queue/event bus along the bottom or side.
- [ ] >= 32px arrow gutters reserved between gateway and the service row, and between services and the bus.

## 3. Ownership + edge styling (the defining step)
- [ ] Each service frame contains exactly ONE datastore that ONLY that service touches.
- [ ] No datastore shared between services; no service reaching into another service's store.
- [ ] Gateway -> service edges are SOLID (synchronous).
- [ ] Service -> service HTTP/gRPC request/response edges are SOLID.
- [ ] Every service -> bus and bus -> service async message edge is DASHED (`strokeStyle: "dashed"`).
- [ ] Legend keys BOTH: "solid = synchronous (HTTP/gRPC)" and "dashed = asynchronous (queue/event)".
- [ ] No solid edge used for an async message; no dashed edge used for a sync call.

## 4. Icons / libraries (if mode != off)
- [ ] Gateway logo (Kong / AWS API Gateway / nginx) on the gateway card (`inside-card-top` / `cloud-provider`).
- [ ] Service glyph or runtime/language logo (32x32) on each service card (`inside-card-top`), one each.
- [ ] `database-symbol` (or Postgres/MySQL/Mongo logo) on each per-service store.
- [ ] Cache `badge` (Redis) on services that have a private cache.
- [ ] Queue/event-bus broker logo (RabbitMQ / Kafka / SQS) on the bus card.
- [ ] `legend` block for the sync/async key.
- [ ] Items normalized (scale, aspect preserved, preset stroke/fill); rejected items recorded.

## 5. Quality loop (mandatory)
- [ ] `lint_drawing` run; `hardBlockers == []` (especially no `ARROW_TEXT_INTERSECTION` on gateway fan-out / async edges).
- [ ] `score_drawing` run; number and every penalty recorded.
- [ ] `repair_drawing` applied per blocker/penalty; loop lint -> score -> repair.
- [ ] `score >= 95` achieved.
- [ ] Rollback applied if any repair/polish pass LOWERED the score (restore last `save_version`).
- [ ] `auto_polish_drawing` run only after blockers clear; re-scored for no regression.
- [ ] Verified polish did NOT merge two service frames or flip any dashed async edge to solid.

## 6. Architecture validation
- [ ] `validate_architecture` clean: one gateway hub fronting every service.
- [ ] Every service in its own frame with exactly one owned datastore.
- [ ] No shared database; no cross-service direct DB access (database-per-service holds).
- [ ] Async edges go through the queue/bus (dashed); sync edges solid; legend keys both.
- [ ] `suggest_architecture_improvements` reviewed; accepted fixes applied then re-lint/re-score
      (shared DB, service bypassing gateway, missing circuit breaker/retry/DLQ, chatty sync chain,
      stateless service with no store, orphan queue).

## 7. Save & export
- [ ] `save_drawing` with title `"<System> — Microservices Topology"`.
- [ ] `save_version` checkpoint of the accepted state.
- [ ] `get_drawing_url` link obtained.
- [ ] `export_drawing` (svg/png/json) produced.
- [ ] Export re-scanned for secrets (per-service DB connection strings, gateway/broker creds) — all redacted.

## Final gate
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text.
- [ ] No overlapping title / frame titles / row header / legend header.
- [ ] One gateway at top; services in a row; each service owns exactly one store; no shared DB.
- [ ] Sync = solid, async = dashed, legend keys both.
- [ ] No secrets leaked anywhere (drawing, response, export).
