# Worked examples — Database & Data-Flow

Each example: the ask -> one plan line -> the ordered REAL tool calls with realistic args -> the
expected result. Every secret is redacted before it reaches a tool argument.

---

## Example 1 — ER schema with a junction table (described)

**Ask:** "Draw the orders schema: users, orders, products, with an order_items junction. Mark the
PKs and FKs and show cardinality. Orders live in Postgres."

**Plan:** `TYPE=er PRESET=technical-docs LIBRARY=curated[Data Platform, Software Logos] VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`

**Tool calls:**
```
mcp__excalidash__read_mcp_guide()
mcp__excalidash__search_libraries({ q: "postgres cylinder", mode: "curated", category: "database" })
mcp__excalidash__inspect_library({ libraryId: "data-platform" })
mcp__excalidash__cache_library({ libraryId: "data-platform" })
mcp__excalidash__create_diagram_from_prompt({
  diagramType: "er",
  direction: "LR",
  title: "Orders — ER Diagram",
  structure: {
    nodes: [
      { id: "users",       label: "users\nid uuid PK\nemail text UK\ncreated_at timestamptz" },
      { id: "orders",      label: "orders\nid uuid PK\nuser_id uuid FK -> users.id\ntotal numeric\nstatus text" },
      { id: "products",    label: "products\nid uuid PK\nsku text UK\nprice numeric" },
      { id: "order_items", label: "order_items\norder_id uuid FK -> orders.id\nproduct_id uuid FK -> products.id\nqty int" }
    ],
    edges: [
      { from: "users",  to: "orders",      label: "1:N" },
      { from: "orders", to: "order_items", label: "1:N" },
      { from: "products", to: "order_items", label: "1:N" }
    ]
  },
  save: false
})
mcp__excalidash__add_library_items_normalized({ libraryId: "data-platform", itemNames: ["postgresql"], placement: "database-symbol", targetCardId: "orders", slotSize: 32 })
mcp__excalidash__lint_drawing({ id: "<id>" })
mcp__excalidash__score_drawing({ minimumScore: 95 })
mcp__excalidash__repair_drawing({ save: false, createVersion: true })
mcp__excalidash__auto_polish_drawing({ minimumScore: 95, maxAttempts: 3 })
mcp__excalidash__validate_architecture({})
mcp__excalidash__suggest_architecture_improvements({})
mcp__excalidash__save_drawing({ id: "<id>", name: "Orders — ER Diagram" })
mcp__excalidash__save_version({ id: "<id>" })
mcp__excalidash__get_drawing_url({ id: "<id>" })
mcp__excalidash__export_drawing({ id: "<id>", format: "svg" })
```

**Expected result:** four table cards with column lists and PK/FK/UK markers; `orders N:M products`
realized through `order_items` as two `1:N` relations; cardinality in side gutters; Postgres cylinder
on the orders store; legend keys crow's-foot. `validate_architecture` confirms no dangling FK.
`score >= 95`, `hardBlockers == []`.

---

## Example 2 — Level-1 DFD for checkout (redaction in play)

**Ask:** "Make a level-1 data-flow diagram for checkout. Customer, Stripe and the email provider are
external; Validate Order / Charge Card / Send Receipt are the steps; orders DB is
`postgres://app:<password>@db.internal/main`, plus a Redis session cache and an S3 receipts bucket."

**Plan:** `TYPE=data-flow PRESET=technical-docs LIBRARY=curated[Data Flow, Software Logos, Data Platform] VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`
> Redact first: the store label becomes `postgres://app:[REDACTED_DATABASE_URL]@db.internal/main`
> in the plan line and in every tool argument.

**Tool calls:**
```
mcp__excalidash__read_mcp_guide()
mcp__excalidash__search_libraries({ q: "data flow process external entity", mode: "curated", category: "data-flow" })
mcp__excalidash__inspect_library({ libraryId: "data-flow" })
mcp__excalidash__create_diagram_from_prompt({
  diagramType: "data-flow",
  direction: "LR",
  title: "Checkout — Data-Flow Diagram (L1)",
  structure: {
    nodes: [
      { id: "customer", label: "Customer (external)" },
      { id: "stripe",   label: "Stripe (external)" },
      { id: "email",    label: "Email Provider (external)" },
      { id: "validate", label: "Validate Order" },
      { id: "charge",   label: "Charge Card" },
      { id: "receipt",  label: "Send Receipt" },
      { id: "ordersdb", label: "orders DB\npostgres://app:[REDACTED_DATABASE_URL]@db.internal/main" },
      { id: "cache",    label: "session cache (Redis)" },
      { id: "receipts", label: "receipts (S3)" }
    ],
    edges: [
      { from: "customer", to: "validate", label: "order payload" },
      { from: "validate", to: "ordersdb", label: "persisted order" },
      { from: "validate", to: "charge",   label: "validated order" },
      { from: "charge",   to: "stripe",   label: "payment token" },
      { from: "stripe",   to: "charge",   label: "charge result" },
      { from: "charge",   to: "receipt",  label: "paid order" },
      { from: "receipt",  to: "receipts", label: "receipt pdf" },
      { from: "receipt",  to: "email",    label: "email" }
    ]
  },
  save: false
})
mcp__excalidash__add_library_items_normalized({ libraryId: "data-platform", itemNames: ["postgresql","redis","s3"], placement: "database-symbol", slotSize: 32 })
mcp__excalidash__lint_drawing({ id: "<id>" })
mcp__excalidash__score_drawing({ minimumScore: 95 })
mcp__excalidash__repair_drawing({ save: false, createVersion: true })
mcp__excalidash__auto_polish_drawing({ minimumScore: 95 })
mcp__excalidash__validate_architecture({})
mcp__excalidash__save_drawing({ id: "<id>", name: "Checkout — Data-Flow Diagram (L1)" })
mcp__excalidash__save_version({ id: "<id>" })
mcp__excalidash__export_drawing({ id: "<id>", format: "png" })
```

**Expected result:** externals on the edges, processes flowing left-to-right, three stores as
cylinders along the bottom; every flow labelled; `validate_architecture` confirms each process has
>= 1 input and >= 1 output (no black-hole/miracle). The Postgres password never appears — only
`[REDACTED_DATABASE_URL]`. `score >= 95`, `hardBlockers == []`.

---

## Example 3 — Reverse-engineer an ER diagram from a repo

**Ask:** "Reverse-engineer the schema from this service into an ER diagram and flag any FK without an
index."

**Plan:** `TYPE=er PRESET=technical-docs LIBRARY=curated[Data Platform, Software Logos] VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements`

**Tool calls:**
```
mcp__excalidash__read_mcp_guide()
mcp__excalidash__create_from_repo_analysis({
  analysis: {
    modules: ["users", "orders", "billing"],
    entrypoints: ["api/server.ts"],
    database: {
      engine: "postgres",
      tables: [
        { name: "users",  columns: ["id uuid PK", "email text UK"] },
        { name: "orders", columns: ["id uuid PK", "user_id uuid FK -> users.id", "total numeric"] }
      ],
      relations: [{ from: "orders.user_id", to: "users.id", cardinality: "N:1" }]
    },
    services: ["order-service"],
    integrations: ["stripe"]
  },
  preset: "technical-docs",
  save: false
})
mcp__excalidash__lint_drawing({ id: "<id>" })
mcp__excalidash__score_drawing({ minimumScore: 95 })
mcp__excalidash__repair_drawing({ save: false, createVersion: true })
mcp__excalidash__validate_architecture({})
mcp__excalidash__suggest_architecture_improvements({})
mcp__excalidash__save_drawing({ id: "<id>", name: "Order Service — ER Diagram" })
mcp__excalidash__export_drawing({ id: "<id>", format: "svg" })
```

**Expected result:** tables derived from the analysis with PK/FK markers and `users 1:N orders`
cardinality; `validate_architecture` confirms the FK targets a real PK;
`suggest_architecture_improvements` flags `orders.user_id` as needing an index. Any connection string
in the source is redacted before it reaches the `analysis` argument. `score >= 95`,
`hardBlockers == []`.
