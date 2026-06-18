# Clean Architecture Reviewer — Examples

Each example shows: the user request, the ring-classification decision, the plan line, and the
exact ordered MCP tool calls with realistic arguments. Drawing `id` values are illustrative. Every
example keeps four concentric rings and enforces the Dependency Rule (all cross-ring arrows inward).

---

## Example 1 — Order service, fresh diagram (apply_architecture_skill path)

**Request**: "Draw our order service in Clean Architecture. Entities are Order and Money. The
PlaceOrder use case saves orders and charges a card. Controllers come from Express; we use
Postgres and Stripe."

**Decision**: one system, four rings, framework-free core, ports owned by the use case ->
**clean** pattern via `apply_architecture_skill` so the ring skeleton + Dependency-Rule legend
come for free.

**Plan**: `TYPE=clean PRESET=architecture
LIBRARY=curated[Software Architecture, Architecture diagram components]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`

**Calls** (`id` values are illustrative):
1. `read_mcp_guide({})`
2. `list_templates({})`  -> (no exact clean-architecture template; proceed with the pattern)
3. `search_libraries({ q: "port interface gateway controller presenter", mode: "curated", category: "architecture" })`
4. `inspect_library({ libraryId: "software-architecture", autoCache: true })`
5. `cache_library({ libraryId: "software-architecture" })`
6. `apply_architecture_skill({ pattern: "clean", preset: "architecture", title: "Order Service — Clean Architecture", autoPolish: false })`  -> `{ id: "dr_clean_order_01" }`
   (Ring contents — Entities: Order, Money, OrderStatus; Use Cases: PlaceOrderInteractor owning
   ports OrderInputBoundary/OrderRepository/PaymentGateway; Adapters: OrderController,
   OrderPresenter, SqlOrderRepository implements OrderRepository, StripePaymentGateway implements
   PaymentGateway; Frameworks: Web (Express), PostgreSQL, Stripe — described in the prompt; all
   cross-ring edges inward.)
7. `add_library_items_normalized({ libraryId: "software-architecture", id: "dr_clean_order_01", itemNames: ["port-plug","controller"], slotSize: 24, placement: "badge", save: false })`
8. `lint_drawing({ id: "dr_clean_order_01" })`  -> `{ hardBlockers: ["ARROW_TEXT_INTERSECTION@SqlOrderRepository->OrderRepository"] }`
9. `score_drawing({ minimumScore: 95 })`  -> `{ score: 89, penalties: ["HIGH_DENSITY@adapters-ring"] }`
10. `repair_drawing({ save: true, createVersion: true, name: "route adapter port edge through gutter; widen adapters band" })`
11. `lint_drawing({ id: "dr_clean_order_01" })`  -> `{ hardBlockers: [] }`
12. `score_drawing({ minimumScore: 95 })`  -> `{ score: 96 }`
13. `auto_polish_drawing({ minimumScore: 95, maxAttempts: 2, save: true })` ; `score_drawing({ minimumScore: 95 })` -> `{ score: 97 }`
14. `validate_architecture({})`  -> `{ ok: true, rings: 4, outwardEdges: 0, orphanNodes: 0 }`
15. `suggest_architecture_improvements({})`  -> `{ suggestions: ["none — Dependency Rule holds"] }`
16. `save_drawing({ id: "dr_clean_order_01", name: "Order Service — Clean Architecture" })`
17. `save_version({ id: "dr_clean_order_01" })`
18. `get_drawing_url({ id: "dr_clean_order_01" })` ; `export_drawing({ id: "dr_clean_order_01", format: "svg" })` (re-scan export for secrets)

---

## Example 2 — Audit an existing onion drawing for an outward leak (review path)

**Request**: "We already have an onion diagram. Check it follows the Dependency Rule and fix
anything pointing the wrong way."

**Decision**: a drawing exists -> reshape to canonical clean rings if needed, then validate and
review; the focus is finding outward-pointing edges.

**Plan**: `TYPE=clean PRESET=architecture LIBRARY=curated[Software Architecture]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`

**Calls** (`id` values are illustrative):
1. `read_mcp_guide({})`
2. `convert_diagram_type({ structure, targetType: "clean", preset: "architecture", save: true, name: "Orders — Clean Architecture (audit)" })`  -> `{ id: "dr_clean_audit_07" }`
3. `validate_architecture({})`
   -> `{ ok: false, outwardEdges: ["Order(Entities)->SqlOrderRepository(Adapters)"], note: "entity depends on a concrete adapter" }`
4. `suggest_architecture_improvements({})`
   -> `{ suggestions: ["Invert Order->SqlOrderRepository: introduce OrderRepository PORT in the Use Cases ring; make PlaceOrderInteractor depend on the port; have SqlOrderRepository implement (point inward to) the port"] }`
5. `repair_drawing({ save: true, createVersion: true, name: "invert Order->SqlOrderRepository via OrderRepository port" })`
6. `lint_drawing({ id: "dr_clean_audit_07" })`  -> `{ hardBlockers: [] }`
7. `score_drawing({ minimumScore: 95 })`  -> `{ score: 95 }`
8. `validate_architecture({})`  -> `{ ok: true, outwardEdges: 0 }`
9. `save_drawing({ id: "dr_clean_audit_07", name: "Orders — Clean Architecture (audit)" })` ; `save_version({ id: "dr_clean_audit_07" })` ; `get_drawing_url({ id: "dr_clean_audit_07" })` ; `export_drawing({ id: "dr_clean_audit_07", format: "png" })`

---

## Example 3 — Reverse-engineer Clean rings from a repo (create_from_repo_analysis path)

**Request**: "Generate a Clean Architecture view from this repo and tell me where we break the
Dependency Rule. The DB is at postgres://app:<password>@orders-db/main."

**Decision**: codebase -> `create_from_repo_analysis` with ring hints from folder structure;
the DB URL is a secret and is redacted before any tool call.

**Redaction**: the connection string becomes `postgres://app:[REDACTED_DATABASE_URL]@orders-db/main`
and is shown only as the label "Postgres Gateway" on the outer ring.

**Plan**: `TYPE=clean PRESET=architecture LIBRARY=required[Software Architecture, Architecture diagram components, Technology Logos]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`

**Calls** (`id` values are illustrative):
1. `read_mcp_guide({})`
2. `create_from_repo_analysis({ analysis: {
     modules: ["domain", "application/usecase", "adapter/controller/presenter/repository", "infra/web/db"],
     entrypoints: ["web"], database: "postgres",
     services: ["PlaceOrder","NotifyShipment"], integrations: ["stripe"] },
     preset: "architecture", save: true, name: "Orders Service — Clean Architecture (from repo)" })`
   -> `{ id: "dr_clean_repo_12", detected: { entities: 6, usecases: 9, adapters: 14, frameworks: 5 } }`
   (map `domain`->Entities, `application/usecase`->Use Cases, the adapter packages->Interface
   Adapters, `infra/web/db`->Frameworks & Drivers.)
3. `search_libraries({ q: "postgres stripe express logo", mode: "specialized", category: "logos" })` ; `inspect_library({ libraryId: "technology-logos", autoCache: true })` ; `cache_library({ libraryId: "technology-logos" })`
4. `add_library_items_normalized({ libraryId: "technology-logos", id: "dr_clean_repo_12", itemNames: ["postgresql"], slotSize: 32, placement: "cloud-provider", save: false })`  (logos OUTER ring only)
5. `lint_drawing({ id: "dr_clean_repo_12" })` -> `{ hardBlockers: ["ITEM_OUTSIDE_FRAME@PaymentPort straddling usecases/adapters"] }`
6. `score_drawing({ minimumScore: 95 })` -> `{ score: 84, penalties: ["HIGH_DENSITY@adapters","SMALL_FONT@port labels"] }`
7. `repair_drawing({ save: true, createVersion: true, name: "pull PaymentPort inside Use Cases; bump port labels to 16px; gap adapters ring" })`
8. `lint_drawing({ id: "dr_clean_repo_12" })` -> `{ hardBlockers: [] }` ; `score_drawing({ minimumScore: 95 })` -> `{ score: 93 }`
9. `repair_drawing({ save: true, createVersion: true, name: "increase inter-ring gutters to 40px; nudge framework logos off ring titles" })` ; re-lint -> `[]` ; re-score -> `96`
10. `auto_polish_drawing({ minimumScore: 95, maxAttempts: 2, save: true })` ; `score_drawing({ minimumScore: 95 })` -> `{ score: 96 }` (no regression)
11. `validate_architecture({})` -> `{ ok: false, outwardEdges: ["UseCase 'NotifyShipment'->Email(Frameworks)"] }`
12. `suggest_architecture_improvements({})` -> `{ suggestions: ["NotifyShipment calls Email directly: add Notifier output port in Use Cases; SmtpNotifier (Adapters) implements it inward"] }`
13. `repair_drawing({ save: true, createVersion: true, name: "add Notifier port; NotifyShipment->Notifier inward; SmtpNotifier->Notifier inward; remove direct ->Email edge" })`
14. `validate_architecture({})` -> `{ ok: true, outwardEdges: 0 }` ; `score_drawing({ minimumScore: 95 })` -> `{ score: 96 }`
15. `save_drawing({ id: "dr_clean_repo_12", name: "Orders Service — Clean Architecture (from repo)" })` ; `save_version({ id: "dr_clean_repo_12" })`
16. `get_drawing_url({ id: "dr_clean_repo_12" })` ; `export_drawing({ id: "dr_clean_repo_12", format: "excalidraw" })` — re-scan export; confirm `[REDACTED_DATABASE_URL]` present, no raw `<password>`.

---

## Notes carried across all examples
- Exactly ONE create path per drawing; the rest are fallbacks.
- The lint -> score -> repair loop runs until `score >= 95` AND `hardBlockers == []`; rollback any
  pass that lowers the score to the last `save_version`.
- `validate_architecture` must report `outwardEdges: 0` — an outward edge is a hard architecture
  failure, fixed by inverting the dependency through a port (see Examples 2 and 3).
- Framework/SaaS logos appear only on the outer Frameworks & Drivers ring; the core stays
  framework-free.
- Re-scan every export for secrets; DB URLs and SaaS keys are the common leak on the outer ring.
