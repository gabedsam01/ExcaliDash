# Security Architecture — worked examples

Each example: the ask -> one plan line -> the ordered REAL tool calls with realistic
arguments -> the expected result. Every secret is redacted before it reaches a tool.

---

## Example 1 — Web app with JWT auth and a confidential Postgres

**Ask:** Show the trust boundary for our web app — users on the internet, an auth gateway,
and a private Postgres holding confidential data.

**Plan:** `TYPE=security PRESET=dark-architecture ZONES=public,dmz,private GATEWAY=auth
CONTROLS=jwt,rbac,ratelimit,audit,vault LIBRARY=curated[Cloud Design Patterns, AWS Architecture Icons]`

**Tool calls:**

```
mcp__excalidash__read_mcp_guide()

mcp__excalidash__create_diagram_from_prompt({
  diagramType: "security",
  direction: "LR",
  preset: "dark-architecture",
  title: "Storefront — Security Architecture",
  save: false,
  structure: {
    nodes: [
      { id: "user",  label: "End User",                         group: "public" },
      { id: "waf",   label: "WAF",                              group: "dmz" },
      { id: "gw",    label: "Auth Gateway (JWT + RBAC + rate limit)", group: "dmz" },
      { id: "api",   label: "API Service",                     group: "private" },
      { id: "db",    label: "Postgres (confidential)",         group: "private" },
      { id: "vault", label: "Secrets Vault",                   group: "private" },
      { id: "audit", label: "Audit Log",                       group: "private" }
    ],
    edges: [
      { from: "user", to: "waf",   label: "HTTPS" },
      { from: "waf",  to: "gw",    label: "forward" },
      { from: "gw",   to: "api",   label: "JWT verified" },
      { from: "api",  to: "db",    label: "reads/writes (postgres://app:[REDACTED_DATABASE_URL]@db/main)" },
      { from: "api",  to: "vault", label: "fetch [REDACTED_DATABASE_URL]" },
      { from: "api",  to: "audit", label: "writes access events" }
    ]
  }
})

mcp__excalidash__add_library_items_normalized({ libraryId: "aws-architecture-icons",
  itemNames: ["lock", "key", "audit"], placement: "badge", slotSize: { width: 32, height: 32 }, save: false })

mcp__excalidash__lint_drawing({ id: "<id>" })
mcp__excalidash__score_drawing({ minimumScore: 95 })
mcp__excalidash__repair_drawing({ save: false })          // loop until score >= 95, hardBlockers == []
mcp__excalidash__auto_polish_drawing({ minimumScore: 95, maxAttempts: 3, save: false })
mcp__excalidash__validate_architecture({ structure: { /* same nodes/edges */ } })

mcp__excalidash__save_drawing({ id: "<id>", name: "Storefront — Security Architecture" })
mcp__excalidash__save_version({ id: "<id>" })
mcp__excalidash__get_drawing_url({ id: "<id>" })
mcp__excalidash__export_drawing({ id: "<id>", format: "svg" })   // re-scan for secrets
```

**Expected result:** three zone frames (public / dmz / private), every inbound arrow through the
Auth Gateway, Postgres badged "confidential", the vault and audit log present, the db URL shown as
`[REDACTED_DATABASE_URL]`. Score >= 95, empty hardBlockers, no arrow-over-text. Saved only after it passes.

---

## Example 2 — Layered service with RBAC, CSRF, vault, from the clean skeleton

**Ask:** Draw a defensive architecture for our internal admin platform with RBAC, CSRF protection,
a secrets manager and an audit trail.

**Plan:** `TYPE=security PRESET=dark-architecture PATTERN=clean ZONES=public,dmz,private
CONTROLS=session,rbac,csrf,audit,vault LIBRARY=curated[Cloud Design Patterns, Software Architecture]`

**Tool calls:**

```
mcp__excalidash__read_mcp_guide()

mcp__excalidash__apply_architecture_skill({
  pattern: "clean",
  preset: "dark-architecture",
  title: "Admin Platform — Security Architecture",
  save: false,
  autoPolish: false
})
// then layer the security controls onto the generated frames:
mcp__excalidash__create_diagram_from_prompt({
  diagramType: "security",
  preset: "dark-architecture",
  save: false,
  structure: {
    nodes: [
      { id: "admin", label: "Admin",                          group: "public" },
      { id: "lb",    label: "Load Balancer",                  group: "dmz" },
      { id: "gw",    label: "Auth Gateway (session + RBAC + CSRF)", group: "dmz" },
      { id: "svc",   label: "Admin Service",                  group: "private" },
      { id: "vault", label: "Secrets Manager",                group: "private" },
      { id: "audit", label: "Audit Log",                      group: "private" },
      { id: "store", label: "Config Store (restricted)",      group: "private" }
    ],
    edges: [
      { from: "admin", to: "lb",    label: "HTTPS" },
      { from: "lb",    to: "gw",    label: "forward" },
      { from: "gw",    to: "svc",   label: "session + CSRF token OK" },
      { from: "svc",   to: "vault", label: "fetch [REDACTED_SERVICE_ROLE]" },
      { from: "svc",   to: "store", label: "reads/writes" },
      { from: "svc",   to: "audit", label: "writes admin actions" }
    ]
  }
})

mcp__excalidash__lint_drawing({ id: "<id>" })
mcp__excalidash__score_drawing({ minimumScore: 95 })
mcp__excalidash__repair_drawing({ save: false })
mcp__excalidash__auto_polish_drawing({ minimumScore: 95, maxAttempts: 3, save: false })
mcp__excalidash__suggest_architecture_improvements({ structure: { /* nodes/edges */ } })
mcp__excalidash__save_drawing({ id: "<id>", name: "Admin Platform — Security Architecture" })
mcp__excalidash__export_drawing({ id: "<id>", format: "png" })
```

**Expected result:** clean layered frames reused as trust zones, CSRF + RBAC labelled on the
gateway, the service-role credential shown as `[REDACTED_SERVICE_ROLE]`, the config store badged
"restricted". `suggest_architecture_improvements` confirms audit + vault present. Score >= 95.

---

## Example 3 — Repairing an ARROW_TEXT_INTERSECTION on a boundary crossing

**Ask:** My security diagram scores 88 — the "JWT verified" arrow runs over the gateway label.

**Plan:** `FIX=ARROW_TEXT_INTERSECTION reroute gateway->api through DMZ gutter; re-score`

**Tool calls:**

```
mcp__excalidash__lint_drawing({ id: "<id>" })            // reports ARROW_TEXT_INTERSECTION on gw->api
mcp__excalidash__repair_drawing({ save: false })          // rebinds endpoints, routes via 32px gutter
mcp__excalidash__score_drawing({ minimumScore: 95 })      // now >= 95
mcp__excalidash__save_version({ id: "<id>" })             // checkpoint the accepted state
mcp__excalidash__export_drawing({ id: "<id>", format: "svg" })
```

**Expected result:** the `gw -> api` arrow now travels in the DMZ->private gutter, the "JWT
verified" label sits in the side lane with 16px clearance, the zone frames are unchanged. Score >= 95,
hardBlockers empty. Checkpointed before export.
