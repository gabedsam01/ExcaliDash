# Event-Driven Diagrammer — Checklist

Run this checklist before saving/exporting. Every box must be checked or the drawing is not done.
See the parent `../SKILL.md` for the full workflow and `../../_shared/references/*.md` for shared rules.

## 1. Plan (before any create call)
- [ ] Plan line written:
      `TYPE=event-driven PRESET=architecture LIBRARY=curated[Software Architecture, Technology Logos]
      VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`.
- [ ] Producers (publishers) identified for the LEFT lane.
- [ ] Event bus / broker product chosen (Kafka / SNS+SQS / EventBridge / RabbitMQ / NATS / Pulsar)
      and its named topics/streams/queues listed.
- [ ] Consumers (subscribers) identified for the RIGHT lane, including fan-out (one event -> many).
- [ ] Event store / topic log node decided (where the event history is durably kept).
- [ ] Every edge classified: async (dashed) vs sync (solid).
- [ ] `MCP_LIBRARY_MODE` read (off / curated / required) — drives whether icons are used.
- [ ] Secrets scanned and redacted in the input BEFORE any tool argument (broker SASL creds,
      consumer API keys, webhook secrets, DB URLs, tokens, bearer, proxy).

## 2. Generate (exactly ONE create path)
- [ ] One and only one of:
      `apply_architecture_skill({ pattern: "event-driven" })` (preferred) /
      `create_from_repo_analysis({ analysis: { modules, entrypoints, database, services, integrations } })` /
      `convert_diagram_type({ structure, targetType: "event-driven" })` /
      `create_diagram_from_prompt({ diagramType: "event-driven", structure: { nodes, edges } })` /
      `create_from_template({ templateId: "event-driven" })`.
- [ ] `drawingId` captured for downstream calls.
- [ ] Layout: producers LEFT, bus CENTER (wide pipe/queue with topic stubs), consumers RIGHT,
      event store below/beside the bus.
- [ ] >= 32px arrow gutters reserved between every service row and the bus (fan-out has many lines).

## 3. Edge styling (the defining step)
- [ ] Every producer -> bus edge is DASHED (`strokeStyle: "dashed"`), single-headed, fire-and-forget.
- [ ] Every bus -> consumer edge is DASHED.
- [ ] The bus -> event-store persist edge is SOLID.
- [ ] Any genuine request/response call (consumer -> external sync API) is SOLID.
- [ ] Legend keys BOTH: "solid = synchronous (request/response)" and "dashed = asynchronous (event)".
- [ ] No dashed edge used for a sync call; no solid edge used for an event.

## 4. Icons / libraries (if mode != off)
- [ ] Broker logo (Kafka/SNS/SQS/RabbitMQ) on the center bus (`inside-card-top` / `cloud-provider`).
- [ ] Topic/stream `badge` on each topic stub on the bus face.
- [ ] Event-store `database-symbol` or log glyph on the store node.
- [ ] Service-type glyph (32x32) on each producer/consumer card (`inside-card-top`), one each.
- [ ] `actor` for any external webhook/event source.
- [ ] `legend` block for the sync/async key.
- [ ] Items normalized (scale, aspect preserved, preset stroke/fill); rejected items recorded.

## 5. Quality loop (mandatory)
- [ ] `lint_drawing` run; `hardBlockers == []` (especially no `ARROW_TEXT_INTERSECTION` on fan-out).
- [ ] `score_drawing` run; number and every penalty recorded.
- [ ] `repair_drawing` applied per blocker/penalty; loop lint -> score -> repair.
- [ ] `score >= 95` achieved.
- [ ] Rollback applied if any repair/polish pass LOWERED the score (restore last `save_version`).
- [ ] `auto_polish_drawing` run only after blockers clear; re-scored for no regression.
- [ ] Verified polish did NOT flip any dashed async edge to solid.

## 6. Architecture validation
- [ ] `validate_architecture` clean: one bus hub; producers LEFT, consumers RIGHT.
- [ ] No direct producer -> consumer edge (everything flows through the bus).
- [ ] Every topic/event has >= 1 producer AND >= 1 consumer (no orphan topic, no dead subscription).
- [ ] Event store has a persist edge from the bus.
- [ ] `suggest_architecture_improvements` reviewed; accepted fixes applied then re-lint/re-score
      (orphan topics, missing DLQ, producer coupled to one consumer, event with no consumer).

## 7. Save & export
- [ ] `save_drawing` with title `"<System> — Event-Driven Architecture"`.
- [ ] `save_version` checkpoint of the accepted state.
- [ ] `get_drawing_url` link obtained.
- [ ] `export_drawing` (svg/png/json) produced.
- [ ] Export re-scanned for secrets (broker SASL creds, consumer-side API keys) — all redacted.

## Final gate
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text.
- [ ] No overlapping titles/lane headers/legend header.
- [ ] Async = dashed, sync = solid, legend keys both.
- [ ] No secrets leaked anywhere (drawing, response, export).
