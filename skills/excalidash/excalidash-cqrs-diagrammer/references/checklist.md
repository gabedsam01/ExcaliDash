# CQRS — Operating Checklist

A gate-by-gate checklist for building a CQRS (Command-Query Responsibility Segregation) diagram. Do
not advance to the next gate until the current one passes.

## Gate 0 — Read context
- [ ] Called `read_mcp_guide`; know the architecture preset and the scoring rubric.
- [ ] Read `MCP_LIBRARY_MODE` (off / curated / required).
- [ ] Scanned the input for secrets — the WRITE-store connection string, the READ-store connection
      string (often a different DB — both leak), broker SASL creds, EventStoreDB connection, query
      cache API keys, service-role keys, JWT secrets, bearer/webhook/proxy tokens.

## Gate 1 — Confirm CQRS scope (one system, two lanes)
- [ ] Identified ONE system whose command and query responsibilities are being split.
- [ ] WRITE lane listed: the **commands** (PlaceOrder, CancelOrder), the **command handlers**
      (PlaceOrderHandler), the **write model / aggregate** (Order), and the **write store**.
- [ ] BRIDGE listed: the **event bus / event store** and the **domain events** the write side emits
      (OrderPlaced, OrderCancelled).
- [ ] READ lane listed: the **projections / denormalizers** (OrderSummaryProjection), the **read
      model / materialized view** (order_summary), the **read store** (SEPARATE from the write
      store), the **query handlers** (GetOrderSummaryHandler), and the **queries** (GetOrderSummary).
- [ ] Confirmed the write model and read model are DISTINCT (no single shared "model"/store box).
- [ ] Mapped each command -> its handler -> the write model; each event -> the projection that
      consumes it -> the read model; each query -> its handler -> the read model.
- [ ] Noted consistency: the read side is eventually consistent (projection lag) unless stated sync.

## Gate 2 — Plan line (write it before any create call)
- [ ] `TYPE=cqrs`.
- [ ] `PRESET=architecture`.
- [ ] `LIBRARY=` off, or curated/required + `Software Architecture`.
- [ ] `VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`.

## Gate 3 — Library decision
- [ ] In `off`: no library calls; commands/queries as rounded cards, handlers as boxes, write/read
      models as cylinders, the event bus as a wide pipe — all primitives.
- [ ] In `curated`/`required`: searched **Software Architecture** (services, handlers, queues, the
      event-bus/pipe shape, stores); the two databases from **Database/Data Platform**; a branded
      broker/event-store (Kafka, EventStoreDB) or DB logo from **Technology Logos**; an external
      client from **Stick Figures**.
- [ ] Inspected each candidate (aspect, stroke, fill, complexity); cached keepers.
- [ ] Mapped each icon to a slot: `inside-card-top` (handler / aggregate / projection / query-handler
      glyphs), `badge` (command-bus or event-type marker), `inside-card-top`/`cloud-provider`
      (broker/event-store logo on the bus), `database-symbol` (BOTH the write store and the read
      store), `actor` (external client), `legend` (write/read key).

## Gate 4 — Generate (one path only)
- [ ] Secrets redacted in prompt/args BEFORE the call.
- [ ] Called exactly ONE of:
      `apply_architecture_skill({ pattern:"cqrs", title:"<System> — CQRS" })` (preferred),
      `create_from_repo_analysis({ analysis:{ modules, entrypoints, database, services, integrations } })` (reverse-engineer a codebase),
      `convert_diagram_type({ structure, targetType:"cqrs" })` (reshape a container/event-driven drawing),
      `create_diagram_from_prompt({ diagramType:"cqrs", structure:{ nodes, edges } })`,
      `create_from_template({ templateId:"cqrs" })`.
- [ ] Layout intent: WRITE lane along the TOP flowing LEFT->RIGHT (Command -> Command Handler ->
      Write Model -> Event Bus/Store); READ lane along the BOTTOM (Event Bus -> Projection -> Read
      Model -> Query Handler -> Query, query side reading RIGHT->LEFT back to the client); the event
      bus/store between the two lanes (right-center) as the single bridge; >= 32px arrow gutters so
      the bus->projection edge and both lane flows never cross a card or label.
- [ ] Captured the returned `drawingId`.

## Gate 5 — Lint -> score -> repair loop
- [ ] `lint_drawing`: `hardBlockers` read and listed.
- [ ] `score_drawing`: numeric score and every penalty recorded.
- [ ] `repair_drawing` called for each blocker/penalty (mandatory if score < 95 or blocker present).
- [ ] Re-linted and re-scored after each repair.
- [ ] **Rollback applied** if a repair pass lowered the score (restored prior version, smaller fix).
- [ ] Loop exited only at `score >= 95` AND `hardBlockers == []`.

## Gate 6 — Polish + architecture validation
- [ ] `auto_polish_drawing` run after blockers cleared; re-scored (no regression).
- [ ] Polish did NOT merge the two lanes or relabel the projection edge as synchronous.
- [ ] `validate_architecture` clean:
      - [ ] exactly two lanes (write top, read bottom),
      - [ ] the write model and the read model are DISTINCT nodes,
      - [ ] commands enter only the write side; queries exit only the read side,
      - [ ] the bus -> projection edge is the SINGLE bridge between lanes,
      - [ ] no command reads the read model,
      - [ ] no query writes the write model,
      - [ ] every read model is fed by at least one projection,
      - [ ] no orphan projection (consumes an event no command emits).
- [ ] `suggest_architecture_improvements` reviewed; accepted fixes applied; re-linted/re-scored.

## Gate 7 — Save + export
- [ ] `save_drawing` with title `"<System> — CQRS (Command/Query Segregation)"`.
- [ ] `save_version` checkpoint of the accepted state.
- [ ] `get_drawing_url` for the shareable link.
- [ ] `export_drawing` produced; export re-scanned for secrets (write-store AND read-store DB URLs,
      broker creds).

## Hard blockers (must all be ABSENT)
- [ ] ARROW_TEXT_INTERSECTION — no command/event/query name and no path/consistency label crosses a
      line; the bus->projection ("publishes"/"projects"/"eventually consistent") label is clear.
- [ ] FRAME_TITLE_OVERLAP — diagram title, the "Write (Command) Path" top header, the "Read (Query)
      Path" bottom header, and the legend header stay title-only.
- [ ] ITEM_OUTSIDE_FRAME — every node fully inside its lane; the event bus fully on the canvas; no
      store straddling out of a lane band.

## Penalties (drive toward zero)
- [ ] TEXT_NEAR_EDGE — content kept >= 40px from canvas/export bounds.
- [ ] HIGH_DENSITY — gaps >= 48px card/card, 32px arrow lanes; the bridge lane between write and read
      not crowded.
- [ ] SMALL_FONT — all text >= 16px, headings >= 20px; command/event/query names fit with padding.

## CQRS-specific sanity checks
- [ ] There is exactly ONE write model node and ONE+ read model node, and they are NOT the same box.
- [ ] The write store and the read store are visually distinct (two database symbols).
- [ ] The only edge crossing between the write lane and the read lane is bus -> projection.
- [ ] No arrow runs from a command/command-handler into the read model.
- [ ] No arrow runs from a query/query-handler into the write model.
- [ ] The bus -> projection edge is annotated eventually consistent (unless an explicit sync read).
- [ ] The legend names: Write (Command) path, Read (Query) path, and the eventual-consistency marker.

See ../../_shared/references/geometry-rules.md, ../../_shared/references/library-policy.md,
../../_shared/references/security-redaction.md, and ../../_shared/references/architecture-patterns.md.
