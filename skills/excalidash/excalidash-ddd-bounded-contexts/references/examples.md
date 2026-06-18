# DDD Bounded Contexts — Worked Examples

Each example shows request -> plan line -> ordered MCP calls (realistic arguments) -> validation ->
save/export. Tool names are prefixed `mcp__excalidash__`; the matching slash prompt is
`/mcp__excalidash__excalidash_ddd_bounded_contexts`.

---

## Example 1 — E-commerce context map (from a description, curated libraries)

**Request**: "Draw our e-commerce context map: Ordering, Payments, Inventory, and Shipping. Ordering
and Payments share Money and CustomerId. OrderPlaced fans out to Payments and Inventory;
PaymentCaptured goes back to Ordering; StockReserved comes from Inventory. Ordering is upstream of
Inventory with an anticorruption layer; Ordering talks to Shipping via an open host service."

**Plan line**:
`TYPE=ddd PRESET=architecture LIBRARY=curated[Software Architecture, Architecture diagram components]
VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`

**Calls**:
1. `read_mcp_guide()` -> note `MCP_LIBRARY_MODE = curated`, scoring rubric, architecture preset.
2. `list_templates({ category: "ddd" })` -> a `context-map` template exists but the relationships are
   custom, so prefer the skill path.
3. Library vetting:
   - `search_libraries({ query: "bounded context boundary", packs: ["Software Architecture", "Architecture diagram components"] })`
   - `search_libraries({ query: "domain event lightning envelope", packs: ["Software Architecture"] })`
   - `search_libraries({ query: "anticorruption layer gateway shield", packs: ["Software Architecture"] })`
   - `inspect_library({ itemId: "arch/event-bolt" })` -> aspect 1:1, low complexity, matches preset -> keep.
   - `cache_library({ itemIds: ["arch/context-frame", "arch/event-bolt", "arch/acl-gateway", "arch/shared-overlap"] })`
4. Create (ONE path). The relationships here are custom, so use `create_diagram_from_prompt` with an
   explicit `structure` rather than the bare `apply_architecture_skill({ pattern: "ddd" })` skeleton.
   (`apply_architecture_skill` takes only `{ pattern, preset?, title?, save?, name?, autoPolish? }` —
   it has no spec argument, so the exact contexts/events go through `structure` here.)
   ```
   create_diagram_from_prompt({
     diagramType: "ddd",
     title: "E-commerce — DDD Context Map",
     direction: "LR",
     structure: {
       nodes: [
         { id: "Ordering",  label: "Ordering (core) · Order(OrderLine) · VO Money, CustomerId" },
         { id: "Payments",  label: "Payments (supporting) · Payment · VO Card, Money" },
         { id: "Inventory", label: "Inventory (supporting) · StockItem · VO Sku" },
         { id: "Shipping",  label: "Shipping (generic) · Shipment · VO Address" },
         { id: "Kernel",    label: "Shared Kernel: Money, CustomerId (Ordering+Payments)" }
       ],
       edges: [
         { from: "Ordering",  to: "Payments",  label: "Shared Kernel" },
         { from: "Ordering",  to: "Inventory", label: "Customer/Supplier (U->D) + ACL" },
         { from: "Ordering",  to: "Shipping",  label: "Customer/Supplier (U->D) + OHS/PL" },
         { from: "Ordering",  to: "Payments",  label: "event: OrderPlaced" },
         { from: "Ordering",  to: "Inventory", label: "event: OrderPlaced" },
         { from: "Payments",  to: "Ordering",  label: "event: PaymentCaptured" },
         { from: "Inventory", to: "Ordering",  label: "event: StockReserved" }
       ]
     }
   })
   ```
   -> returns `{ id: "dwg_ddd_ecom_01" }`. (If you only wanted the DDD skeleton — frames, kernel seam,
   legend — you would instead call `apply_architecture_skill({ pattern: "ddd", title: "E-commerce — DDD
   Context Map" })` and refine afterward.)
5. Icons:
   ```
   add_library_items_normalized({
     libraryId: "software-architecture",
     itemNames: ["event-bolt", "shared-overlap", "acl-gateway"],
     placement: "event-symbol",
     save: true
   })
   ```
   (one normalized call per glyph family: an event bolt on each event edge, a shared-overlap glyph on
   the kernel seam, an ACL gateway badge on the Inventory side.)
6. `lint_drawing({ id: "dwg_ddd_ecom_01" })` -> `hardBlockers: ["ARROW_TEXT_INTERSECTION @ edge:OrderPlaced"]`.
7. `score_drawing({ minimumScore: 95 })` -> `82` (penalties: arrow-over-text on OrderPlaced;
   "Customer/Supplier" label near the frame edge).
8. `save_version({ id: "dwg_ddd_ecom_01" })` (rollback checkpoint), then
   `repair_drawing({ save: true, createVersion: true, name: "ddd-ecom-repair-1" })` to reroute
   OrderPlaced through the Ordering->Inventory gutter and move its label to the gutter midpoint
   -> re-`lint_drawing` -> `hardBlockers: []` -> `score_drawing({ minimumScore: 95 })` -> `94`.
9. `repair_drawing({ save: true, createVersion: true, name: "ddd-ecom-repair-2" })` to nudge the
   Customer/Supplier (U/D) label 24px off the Shipping frame edge -> re-`score_drawing({ minimumScore: 95 })` -> `97`.
10. `auto_polish_drawing({ minimumScore: 95 })` -> re-`score_drawing({ minimumScore: 95 })` -> `98` (no regression; keep).
11. `validate_architecture({ structure })` -> clean: 4 frames; SharedKernel straddles Ordering+Payments;
    every edge labeled; OrderPlaced/PaymentCaptured/StockReserved all have producer+consumer; no
    aggregate leaked (Inventory consumes OrderPlaced through the ACL, not the Order aggregate).
12. `suggest_architecture_improvements({ structure })` -> "Consider marking Ordering<->Payments as
    Partnership if release cadence is jointly planned." -> left as Shared Kernel per the request; noted.
13. `save_drawing({ id: "dwg_ddd_ecom_01", name: "E-commerce — DDD Context Map" })` ->
    `save_version({ id: "dwg_ddd_ecom_01" })`.
14. `get_drawing_url({ id: "dwg_ddd_ecom_01" })` -> `export_drawing({ id: "dwg_ddd_ecom_01", format: "svg" })`
    -> re-scan: no secrets (event names only, no payloads).

**Result**: score 98, zero blockers, 4 context frames, shared kernel on the Ordering/Payments seam,
3 labeled domain-event edges, ACL on Inventory, OHS+PL to Shipping.

---

## Example 2 — Reverse-engineer contexts from a modular monolith

**Request**: "We have a modular monolith at `/srv/shop`. Draw the bounded contexts and the shared
kernel from the code."

**Plan line**: same `TYPE=ddd` plan; create path = repo analysis.

**Calls**:
1. `read_mcp_guide()`.
2. Create from repo (`create_from_repo_analysis` takes an `analysis` object — modules, entrypoints,
   database, services, integrations — that you assemble from the codebase scan):
   ```
   create_from_repo_analysis({
     analysis: {
       modules: ["modules/ordering", "modules/payments", "modules/inventory", "modules/catalog",
                 "common/money", "common/ids"],
       entrypoints: ["api/orders", "api/checkout"],
       database: "postgres",
       services: ["ordering", "payments", "inventory", "catalog"],
       integrations: ["stripe", "events/integration-bus"]
     }
   })
   ```
   -> `{ id: "dwg_ddd_shop_01" }`. From the module list, `common/money` + `common/ids` is the shared
   kernel (depended on by Ordering + Payments) and `events/integration-bus` yields OrderPlaced,
   PaymentCaptured, ProductPriced.
3. Re-classify: confirm `common/money` + `common/ids` is the shared kernel (depended on by Ordering +
   Payments). The analyzer found `Catalog -> Ordering` consuming the `Order` type directly -> flag as a
   leaked aggregate to fix in repair.
4. `lint_drawing({ id: "dwg_ddd_shop_01" })` -> `score_drawing({ minimumScore: 95 })` -> `79`
   (leaked aggregate penalty + unlabeled Catalog->Ordering edge).
5. `repair_drawing({ save: true, createVersion: true, name: "shop-repair-1" })` to label
   Catalog->Ordering as Customer/Supplier (Catalog Upstream U, Ordering Downstream D) and replace the
   direct Order-type reference with a ProductPriced event consumed via an ACL on the Ordering side
   -> re-lint -> re-`score_drawing({ minimumScore: 95 })` -> `93`.
6. `repair_drawing({ save: true, createVersion: true, name: "shop-repair-2" })` to move the
   ProductPriced event label off the routed line into the inter-frame gutter
   -> re-`score_drawing({ minimumScore: 95 })` -> `96`.
7. `auto_polish_drawing({ minimumScore: 95 })` -> `96` (no change).
8. `validate_architecture({ structure })` -> clean; `suggest_architecture_improvements({ structure })`
   -> "Catalog is generic; consider buying off-the-shelf." -> noted in the legend, not drawn.
9. `save_drawing({ id: "dwg_ddd_shop_01", name: "Shop Monolith — DDD Context Map" })` ->
   `save_version({ id: "dwg_ddd_shop_01" })` -> `get_drawing_url({ id: "dwg_ddd_shop_01" })`
   -> `export_drawing({ id: "dwg_ddd_shop_01", format: "json" })` -> re-scan (a `payments` module note
   held a Stripe key -> already replaced with `[REDACTED_API_KEY]` before the create call).

**Result**: score 96, contexts derived from modules, shared kernel = common/money + common/ids, the
Catalog->Ordering leak fixed into a ProductPriced event behind an ACL.

---

## Example 3 — Audit an existing context map

**Request**: "Review `dwg_ddd_payments_99` — is anything wrong with our context map?"

**Calls**:
1. `read_mcp_guide()`.
2. `lint_drawing({ id: "dwg_ddd_payments_99" })` -> `hardBlockers: ["FRAME_TITLE_OVERLAP @ Payments"]`.
3. `score_drawing({ minimumScore: 95 })` -> `71`.
4. `validate_architecture({ structure })` ->
   - `Payments -> Ledger` edge has NO relationship pattern (hard fail).
   - `Ledger` consumes the `Payment` aggregate directly (leaked aggregate, no ACL).
   - `RefundIssued` event has no consumer (dead event).
5. `repair_drawing({ save: true, createVersion: true, name: "audit-fix-1" })` per finding, one pass each:
   - fix the Payments frame title overlap (title-band only);
   - label Payments->Ledger as Customer/Supplier (Payments U, Ledger D) with an ACL on Ledger, and
     replace the direct Payment-aggregate reference with the PaymentCaptured event;
   - wire the dead RefundIssued event to a consumer context (-> Ledger).
6. Re-`lint_drawing` -> `hardBlockers: []`; re-`score_drawing({ minimumScore: 95 })` -> `95`.
7. `auto_polish_drawing({ minimumScore: 95 })` -> `95`; `validate_architecture({ structure })` -> clean.
8. `save_version({ id: "dwg_ddd_payments_99" })` -> `export_drawing({ id: "dwg_ddd_payments_99", format: "png" })` -> re-scan.

**Result**: title overlap fixed, the unlabeled edge given a Customer/Supplier + ACL relationship, the
leaked Payment aggregate replaced by an event, the dead RefundIssued event wired up; score 71 -> 95.

---

## Notes carried across all examples
- Exactly one create path per drawing; never mix `apply_architecture_skill` with `create_diagram_from_prompt`.
- The lint -> score -> repair loop is mandatory; never save below 95 or with a blocker.
- Roll back any repair/polish pass that lowers the score, then apply a smaller fix.
- An unlabeled cross-context edge or a leaked aggregate is a hard failure, not a penalty.
- Redact before the first tool call and re-scan every export.
