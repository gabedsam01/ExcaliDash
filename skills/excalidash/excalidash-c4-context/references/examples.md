# C4 Context — Examples

Each example shows: the user request, the scope decision, the plan line, and the exact ordered
MCP tool calls with realistic arguments. `drawingId` values are illustrative. Every example
keeps ONE central system and shows only its relationships to actors and external systems.

---

## Example 1 — Internet Banking System (apply_architecture_skill path)

**Request**: "Give me a system-context diagram for our Internet Banking System. Customers
use it, it talks to the Mainframe Banking System, and it sends emails via the E-mail System."

**Decision**: one central system, human actor + two external systems -> **C4 context**, use
the C4 architecture skill so the skeleton + legend come for free.

**Plan**: `TYPE=c4 LEVEL=context PRESET=architecture
LIBRARY=curated[C4 Architecture, Stick Figures, Software Logos]
VALIDATORS=lint,score,repair,validate_architecture`

**Calls**:
```
read_mcp_guide()
list_templates({ category: "c4" })                    // optional; may expose "c4-context"
search_libraries({ query: "person actor", packs: ["Stick Figures", "C4 Architecture"] })
inspect_library({ itemId: "c4/person" })              // aspect 1:1.4, simple stroke -> keep
cache_library({ itemId: "c4/person" })
apply_architecture_skill({
  pattern: "c4", preset: "architecture",
  title: "Internet Banking System — System Context",
  save: true, name: "Internet Banking System — System Context"
})
// pattern:"c4" + a context title yields the central-system / actors / external-systems skeleton + legend.
// The Level-1 detail (one customer actor, Mainframe + E-mail System externals, the three
// relationships) is described in prose and refined via create_diagram_from_prompt when explicit
// nodes/edges are needed — apply_architecture_skill takes ONLY { pattern, preset?, title?, save?,
// name?, autoPolish? }, never a "skill", "level", or "spec" argument.
// -> { drawingId: "drw_c4ctx_001" }
add_library_items_normalized({ drawingId: "drw_c4ctx_001",
  items: [ { itemId: "c4/person", slot: "actor", target: "Personal Banking Customer" },
           { itemId: "c4/system", slot: "inside-card-top", target: "Internet Banking System" } ] })
lint_drawing({ drawingId: "drw_c4ctx_001" })          // hardBlockers: []
score_drawing({ drawingId: "drw_c4ctx_001" })         // 94, TEXT_NEAR_EDGE on E-mail System
repair_drawing({ drawingId: "drw_c4ctx_001",
  issues: ["TEXT_NEAR_EDGE: shift external-system column 48px inward"] })
lint_drawing({ drawingId: "drw_c4ctx_001" })          // hardBlockers: []
score_drawing({ drawingId: "drw_c4ctx_001" })         // 96
auto_polish_drawing({ drawingId: "drw_c4ctx_001" })
score_drawing({ drawingId: "drw_c4ctx_001" })         // 96 confirm no regression
validate_architecture({ drawingId: "drw_c4ctx_001" }) // one center, all edges anchored, no orphans
save_drawing({ drawingId: "drw_c4ctx_001", title: "Internet Banking System — System Context" })
save_version({ drawingId: "drw_c4ctx_001", label: "accepted score=96" })
get_drawing_url({ drawingId: "drw_c4ctx_001" })
export_drawing({ drawingId: "drw_c4ctx_001", format: "svg" })
```

---

## Example 2 — E-commerce Storefront with vendor logos (create_diagram_from_prompt path)

**Request**: "System context for ShopFront. Customers and Support Agents use it. It charges
cards through Stripe, authenticates with Auth0, and sends order emails via SendGrid."

**Decision**: one central system, two actors, three branded external systems -> **C4 context**;
use Software Logos for the recognizable vendors.

**Plan**: `TYPE=c4 LEVEL=context PRESET=architecture
LIBRARY=curated[C4 Architecture, Stick Figures, Software Logos]
VALIDATORS=lint,score,repair,validate_architecture`

**Calls**:
```
read_mcp_guide()
search_libraries({ query: "stripe auth0 sendgrid", packs: ["Software Logos"] })
inspect_library({ itemId: "logo/stripe" })            // clean 1:1 mark -> keep
inspect_library({ itemId: "logo/auth0" })
inspect_library({ itemId: "logo/sendgrid" })
cache_library({ itemId: "logo/stripe" })
cache_library({ itemId: "logo/auth0" })
cache_library({ itemId: "logo/sendgrid" })
create_diagram_from_prompt({ diagramType: "c4", preset: "architecture",
  prompt: "C4 System Context for ShopFront. Center: ShopFront (software system). Actors: Customer, Support Agent. External systems: Stripe, Auth0, SendGrid. Relationships (each from ShopFront): Customer 'browses and orders via' ShopFront; Support Agent 'manages orders via' ShopFront; ShopFront 'charges cards using' Stripe; ShopFront 'authenticates users with' Auth0; ShopFront 'sends order emails via' SendGrid. Legend: person / system / external system. No containers, no components." })
// -> { drawingId: "drw_c4ctx_002" }
add_library_items_normalized({ drawingId: "drw_c4ctx_002",
  items: [ { itemId: "c4/person", slot: "actor", target: "Customer" },
           { itemId: "c4/person", slot: "actor", target: "Support Agent" },
           { itemId: "logo/stripe",   slot: "inside-card-left", target: "Stripe" },
           { itemId: "logo/auth0",    slot: "inside-card-left", target: "Auth0" },
           { itemId: "logo/sendgrid", slot: "inside-card-left", target: "SendGrid" } ] })
lint_drawing({ drawingId: "drw_c4ctx_002" })          // ARROW_TEXT_INTERSECTION on "charges cards using"
score_drawing({ drawingId: "drw_c4ctx_002" })         // 89
repair_drawing({ drawingId: "drw_c4ctx_002",
  issues: ["ARROW_TEXT_INTERSECTION: move Stripe edge label into right gutter, +32px lane clearance"] })
lint_drawing({ drawingId: "drw_c4ctx_002" })          // hardBlockers: []
score_drawing({ drawingId: "drw_c4ctx_002" })         // 95
repair_drawing({ drawingId: "drw_c4ctx_002",
  issues: ["HIGH_DENSITY: spread the three external systems to >=48px vertical gap"] })
score_drawing({ drawingId: "drw_c4ctx_002" })         // 97
auto_polish_drawing({ drawingId: "drw_c4ctx_002" })
validate_architecture({ drawingId: "drw_c4ctx_002" }) // every edge touches ShopFront; no orphans
save_drawing({ drawingId: "drw_c4ctx_002", title: "ShopFront — System Context" })
save_version({ drawingId: "drw_c4ctx_002", label: "accepted score=97" })
export_drawing({ drawingId: "drw_c4ctx_002", format: "png" })
```

---

## Example 3 — Internal HR Portal with a secret in the input (redaction)

**Request**: "Context diagram for HR Portal. Employees and HR Admins use it. It pulls payroll
from the Payroll Service at `postgres://hr:<password>@payroll-db/main` and posts to a Slack webhook
`https://hooks.slack.com/services/T000/B000/<webhook token>`."

**Decision**: one central system, two actors, two external systems -> **C4 context**; the db
URL credential and the webhook token MUST be redacted before any tool call.

**Plan**: `TYPE=c4 LEVEL=context PRESET=architecture
LIBRARY=curated[C4 Architecture, Stick Figures]
VALIDATORS=lint,score,repair,validate_architecture`

**Calls**:
```
read_mcp_guide()
search_libraries({ query: "person actor", packs: ["Stick Figures"] })
create_diagram_from_prompt({ diagramType: "c4", preset: "architecture",
  prompt: "C4 System Context for HR Portal. Center: HR Portal. Actors: Employee, HR Admin. External systems: Payroll Service, Slack. Relationships (each from HR Portal): Employee 'views payslips via' HR Portal; HR Admin 'manages staff via' HR Portal; HR Portal 'reads payroll from' Payroll Service (postgres://hr:[REDACTED_DATABASE_URL]@payroll-db/main); HR Portal 'posts notifications to' Slack ([REDACTED_WEBHOOK_SECRET]). Legend: person / system / external system." })
// db credential redacted -> [REDACTED_DATABASE_URL]; webhook token redacted -> [REDACTED_WEBHOOK_SECRET] BEFORE the call
// -> { drawingId: "drw_c4ctx_003" }
add_library_items_normalized({ drawingId: "drw_c4ctx_003",
  items: [ { itemId: "stick/person", slot: "actor", target: "Employee" },
           { itemId: "stick/person", slot: "actor", target: "HR Admin" } ] })
lint_drawing({ drawingId: "drw_c4ctx_003" })          // hardBlockers: []
score_drawing({ drawingId: "drw_c4ctx_003" })         // 96
auto_polish_drawing({ drawingId: "drw_c4ctx_003" })
validate_architecture({ drawingId: "drw_c4ctx_003" })
save_drawing({ drawingId: "drw_c4ctx_003", title: "HR Portal — System Context" })
save_version({ drawingId: "drw_c4ctx_003", label: "accepted score=96" })
export_drawing({ drawingId: "drw_c4ctx_003", format: "svg" })   // re-scan export: only placeholders present
```

---

## Rollback example (a polish pass lowered the score)

```
score_drawing({ drawingId: "drw_c4ctx_001" })         // 96 (checkpoint "accepted score=96")
auto_polish_drawing({ drawingId: "drw_c4ctx_001" })   // tightened spacing
score_drawing({ drawingId: "drw_c4ctx_001" })         // 93 -> regression!
// ROLLBACK: restore the score=96 checkpoint saved by the earlier save_version({ id }), then apply
// a smaller targeted nudge instead of the full polish that regressed.
repair_drawing({ save: true, createVersion: true, name: "rollback to score=96 + nudge" })
score_drawing({ drawingId: "drw_c4ctx_001" })         // 96 held
```

---

## Wrong-skill redirect (out of scope for Level 1)

**Request**: "Show the web app, API, and Postgres inside the Internet Banking System."
**Decision**: that is internal structure -> **C4 Container (Level 2)**, not context. Hand off
to the C4 Container skill rather than adding containers to this diagram.
