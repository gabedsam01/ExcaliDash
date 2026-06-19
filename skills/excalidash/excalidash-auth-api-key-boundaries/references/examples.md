# Auth & API-Key Boundaries — Worked Examples

Each example shows: the request -> one plan line -> the ordered REAL MCP tool calls with realistic
arguments -> the quality loop -> save/export. Every literal secret is redacted BEFORE any call.
Tools and arguments use only the real ExcaliDash schemas.

---

## Example A — API-key gateway (build from prompt)

**Request**: "Diagram our API-key auth. A browser SPA and a partner service call us with an `exd_`
key. An auth gateway verifies the key against an HMAC hash, checks scopes, rate-limits and writes an
audit log; then the protected Orders API and Billing API (backed by Postgres) sit behind it."

**Redaction first** (BEFORE any call): a sample key `exd_live_8fK2qZ…` -> `exd_live_[REDACTED_API_KEY]`.

**Plan line**
```
TYPE=security THEME=auth-api-key PRESET=dark-architecture
LIBRARY=curated[Cloud Design Patterns, AWS Architecture Icons, Software Architecture]
ZONES=public(2)|boundary(verify,scope,limit,audit,vault)|authenticated(3)
VALIDATORS=lint,score,repair,validate_architecture
```

**Ordered calls**
1. `read_mcp_guide()` -> note `MCP_LIBRARY_MODE = curated`, dark-architecture preset, rubric.
2. Library vetting:
   - `search_libraries({ q: "api gateway", mode: "curated" })`
   - `search_libraries({ q: "secrets vault", mode: "curated" })`
   - `inspect_library({ libraryId: "aws-api-gateway", autoCache: true })`
   - `cache_library({ libraryId: "cloud-design-patterns" })`
3. Generate (ONE path):
   ```json
   create_diagram_from_prompt({
     "diagramType": "security",
     "direction": "LR",
     "title": "Acme API — Auth & API-Key Boundary",
     "preset": "dark-architecture",
     "save": false,
     "structure": {
       "nodes": [
         { "id": "spa",     "label": "Browser SPA",        "zone": "public" },
         { "id": "partner", "label": "Partner Service",    "zone": "public" },
         { "id": "gw",      "label": "Auth Gateway",       "zone": "boundary" },
         { "id": "verify",  "label": "Verify Key (HMAC compare)", "zone": "boundary" },
         { "id": "scope",   "label": "Scope / RBAC Check", "zone": "boundary" },
         { "id": "limit",   "label": "Rate Limit",         "zone": "boundary" },
         { "id": "audit",   "label": "Audit Log",          "zone": "boundary" },
         { "id": "vault",   "label": "Vault (HMAC secret: [REDACTED_HMAC_SECRET])", "zone": "boundary" },
         { "id": "keys",    "label": "API keys (HMAC at rest) + Rotate/Revoke", "zone": "boundary" },
         { "id": "orders",  "label": "Orders API",         "zone": "authenticated" },
         { "id": "billing", "label": "Billing API",        "zone": "authenticated" },
         { "id": "db",      "label": "Postgres",           "zone": "authenticated" }
       ],
       "edges": [
         { "from": "spa",     "to": "gw",      "label": "presents [REDACTED_API_KEY]" },
         { "from": "partner", "to": "gw",      "label": "presents [REDACTED_API_KEY]" },
         { "from": "gw",      "to": "verify",  "label": "" },
         { "from": "verify",  "to": "vault",   "label": "HMAC compare" },
         { "from": "verify",  "to": "keys",    "label": "lookup hash" },
         { "from": "verify",  "to": "scope",   "label": "valid" },
         { "from": "scope",   "to": "limit",   "label": "in scope" },
         { "from": "limit",   "to": "audit",   "label": "record" },
         { "from": "audit",   "to": "orders",  "label": "200 (scoped)" },
         { "from": "audit",   "to": "billing", "label": "200 (scoped)" },
         { "from": "orders",  "to": "db",      "label": "reads/writes" },
         { "from": "gw",      "to": "spa",     "label": "401 / 403" }
       ]
     }
   })
   ```
   -> returns `{ id: "draw_acme_auth" }`.
4. Place icons:
   ```json
   add_library_items_normalized({
     "libraryId": "aws-architecture-icons",
     "id": "draw_acme_auth",
     "itemNames": ["api-gateway", "secrets-manager", "waf-throttle", "cloudtrail-audit"],
     "placement": "inside-card-top",
     "slotSize": 32,
     "save": false
   })
   ```
   (gateway glyph on 'Auth Gateway', vault on 'Vault', throttle as a `badge` on 'Rate Limit',
   audit-trail icon on 'Audit Log'; key/lock badge on 'Verify Key'.)
5. Quality loop:
   - `lint_drawing({ id: "draw_acme_auth" })` -> `hardBlockers: ["ARROW_TEXT_INTERSECTION"]`
     ("presents [REDACTED_API_KEY]" labels under the two client lines).
   - `score_drawing({ minimumScore: 95 })` -> `84` (penalties: ARROW_TEXT_INTERSECTION, HIGH_DENSITY).
   - `save_version({ id: "draw_acme_auth" })` (rollback target).
   - `repair_drawing({ id: "draw_acme_auth", save: false })` (route client edges through the boundary
     gutter; move labels into side lanes with 32px clearance; widen the boundary control gutters to 48px).
   - re-`lint_drawing` -> `hardBlockers: []`; re-`score_drawing` -> `96`.
6. `auto_polish_drawing({ minimumScore: 95, maxAttempts: 2 })` -> re-`score_drawing` -> `97` (kept).
7. `validate_architecture({ structure })` -> `{ ok: true, boundaries: 1, servicesInside: 3, bypass: [] }`.
   `suggest_architecture_improvements({ structure })` -> "rotation/revocation present; consider per-key
   rate-limit tiers" (advisory only).
8. `save_drawing({ id: "draw_acme_auth", name: "Acme API — Auth & API-Key Boundary" })`.
9. `save_version({ id: "draw_acme_auth" })` (accepted state).
10. `get_drawing_url({ id: "draw_acme_auth" })` -> link; `export_drawing({ id: "draw_acme_auth",
    format: "svg" })` -> **re-scan**: keys read `[REDACTED_API_KEY]`, secret reads
    `[REDACTED_HMAC_SECRET]`, only the `exd_` prefix is literal. Done.

---

## Example B — Bearer-token boundary with rotation/revocation (hexagonal skeleton)

**Request**: "Show the trust boundary for our bearer-token gateway: public clients on the outside,
the auth adapter verifying the JWT against the signing key in the vault, RBAC inside, and a
revocation path. Treat auth as the inbound adapter guarding the domain."

**Redaction first**: an example header `Authorization: Bearer <JWT>` -> `Authorization: Bearer
[REDACTED_BEARER]`; the JWT signing key -> `[REDACTED_JWT_SECRET]`.

**Plan line**
```
TYPE=security THEME=auth-bearer PATTERN=hexagonal PRESET=dark-architecture
LIBRARY=curated[Cloud Design Patterns, AWS Architecture Icons, Software Architecture]
VALIDATORS=lint,score,repair,validate_architecture
```

**Ordered calls**
1. `read_mcp_guide()`.
2. Generate (ONE path — hexagonal skeleton seats auth as the inbound adapter):
   ```json
   apply_architecture_skill({
     "pattern": "hexagonal",
     "preset": "dark-architecture",
     "title": "Acme API — Auth Adapter (Bearer)",
     "save": false
   })
   ```
   -> returns `{ id: "draw_acme_bearer" }` with an inbound-adapter port guarding the domain core.
   Relabel the inbound adapter "Auth Gateway (verify Bearer / JWT)", the secret port "Vault
   ([REDACTED_JWT_SECRET])", and add a "Rotate / Revoke" control on the token store.
3. Library vetting + `add_library_items_normalized({ libraryId: "cloud-design-patterns",
   id: "draw_acme_bearer", itemNames: ["federated-identity", "gatekeeper", "valet-key"],
   placement: "badge", slotSize: 28, save: false })` for the gateway, RBAC and key glyphs.
4. Quality loop: `lint_drawing` -> `score_drawing({ minimumScore: 95 })` (e.g. `88`, FRAME_TITLE_OVERLAP
   on the boundary frame) -> `save_version` -> `repair_drawing` (drop the control grid below the frame
   title band) -> re-lint/re-score until `>= 95` and `hardBlockers == []`. Roll back any pass that lowers
   the score.
5. `auto_polish_drawing({ minimumScore: 95 })` -> `validate_architecture({ structure })` (one boundary;
   domain core only reachable through the auth adapter; revocation present).
6. `save_drawing({ id: "draw_acme_bearer", name: "Acme API — Auth Adapter (Bearer)" })` ->
   `save_version` -> `get_drawing_url` -> `export_drawing({ id: "draw_acme_bearer", format: "png" })`
   -> re-scan: the bearer reads `[REDACTED_BEARER]`, the signing key reads `[REDACTED_JWT_SECRET]`. Done.

---

## Example C — Partner key with leaked-secret in the request (redaction backstop)

**Request**: "Container partner pushes events to us with key `exd_live_<entropy>` and we store keys
in Postgres `postgres://auth:<password>@db.internal/keys`. Draw the boundary."

**Redaction first** (BEFORE any tool call):
- `exd_live_<entropy>` -> `exd_live_[REDACTED_API_KEY]`.
- `postgres://auth:<password>@db.internal/keys` -> `postgres://auth:[REDACTED_DATABASE_URL]@db.internal/keys`.

**Plan line**
```
TYPE=security THEME=auth-api-key PRESET=dark-architecture
LIBRARY=curated[Cloud Design Patterns, AWS Architecture Icons, Software Architecture]
ZONES=public(1)|boundary(verify,scope,limit,audit,vault)|authenticated(2) REDACTION=2-secrets-stripped
VALIDATORS=lint,score,repair,validate_architecture
```

**Ordered calls**
1. `read_mcp_guide()`.
2. `create_diagram_from_prompt({ diagramType: "security", direction: "LR", preset: "dark-architecture",
   save: false, title: "Partner Ingest — Auth Boundary", structure: { nodes: [ { id: "partner",
   label: "Partner Service (presents exd_live_[REDACTED_API_KEY])", zone: "public" }, { id: "gw",
   label: "Auth Gateway", zone: "boundary" }, { id: "keys", label: "Key Store
   (postgres://auth:[REDACTED_DATABASE_URL]@db.internal/keys, HMAC at rest)", zone: "boundary" },
   { id: "ingest", label: "Event Ingest API", zone: "authenticated" }, { id: "bus", label: "Event Bus",
   zone: "authenticated" } ], edges: [ { from: "partner", to: "gw", label: "presents [REDACTED_API_KEY]" },
   { from: "gw", to: "keys", label: "HMAC compare" }, { from: "gw", to: "ingest", label: "200 (scoped)" },
   { from: "gw", to: "partner", label: "401 / 429" }, { from: "ingest", to: "bus", label: "publish" } ] } })`
   -> `{ id: "draw_partner_auth" }`.
3. `lint_drawing` -> `score_drawing({ minimumScore: 95 })` -> `repair_drawing` (rate-limit edge labeled
   `429`; route the deny edge through a separate gutter) until `>= 95`, `hardBlockers == []`.
4. `auto_polish_drawing({ minimumScore: 95 })` -> `validate_architecture({ structure })`.
5. `save_drawing({ id: "draw_partner_auth", name: "Partner Ingest — Auth Boundary" })` -> `save_version`
   -> `export_drawing({ id: "draw_partner_auth", format: "svg" })` -> **re-scan the export**: confirm the
   key reads `exd_live_[REDACTED_API_KEY]` and the DB URL reads
   `postgres://auth:[REDACTED_DATABASE_URL]@db.internal/keys`, never the real values. Done.

---

## Reusable argument fragments
- **Zoned structure**: each node carries a `zone` of `"public"`, `"boundary"`, or `"authenticated"`.
- **Credential edge**: `{ "from": "<client>", "to": "gw", "label": "presents [REDACTED_API_KEY]" }`.
- **Deny edge**: `{ "from": "gw", "to": "<client>", "label": "401 / 403" }` (or `429` when rate-limited).
- **Key store label**: `"API keys (HMAC at rest) + Rotate/Revoke"` — never the plaintext key.
- **Redaction backstop**: after `export_drawing`, scan the serialized output; only the `exd_` prefix
  may be literal.

See `./checklist.md`, `./anti-patterns.md`, and the shared references under `../../_shared/references/`.
