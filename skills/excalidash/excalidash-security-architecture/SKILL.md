---
name: excalidash-security-architecture
description: Use when you need a defensive security architecture view — public/DMZ/private trust-boundary frames, an explicit auth gateway (JWT/session, RBAC, CSRF, rate limit), an audit log and a secrets manager/vault, with every secret rendered as a [REDACTED_<TYPE>] placeholder and never a real value.
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__create_diagram_from_prompt
  - mcp__excalidash__apply_architecture_skill
  - mcp__excalidash__validate_architecture
  - mcp__excalidash__suggest_architecture_improvements
  - mcp__excalidash__search_libraries
  - mcp__excalidash__inspect_library
  - mcp__excalidash__cache_library
  - mcp__excalidash__add_library_items_normalized
  - mcp__excalidash__lint_drawing
  - mcp__excalidash__score_drawing
  - mcp__excalidash__repair_drawing
  - mcp__excalidash__auto_polish_drawing
  - mcp__excalidash__save_drawing
  - mcp__excalidash__save_version
  - mcp__excalidash__get_drawing_url
  - mcp__excalidash__export_drawing
---

# Security Architecture

## Objective
Produce a defensive security-architecture diagram for ONE system: nested trust-boundary
frames (**public** internet, a **DMZ** edge zone, a **private** internal zone), an explicit
**auth gateway** that every inbound request must traverse, and the controls that live on
that path — JWT/session validation, RBAC, CSRF protection, rate limiting, an **audit log**,
and a **secrets manager / vault** that holds credentials for the protected services and
data stores. Data nodes carry a **classification** marker (public / internal / confidential /
restricted). Every credential is shown as a concept (a key icon, a "JWT secret" label) and
every literal secret is a typed `[REDACTED_<TYPE>]` placeholder — never a real value. Arrows
cross a boundary only through the auth gateway, and each crossing reads as a deliberate,
labelled control point. The result must score >= 95 with zero hard blockers.

## When to use / When NOT to use
**Use when**: the request is "draw the security architecture / trust boundaries of <system>",
"show where auth and the firewall sit", "what's public vs DMZ vs private", "where do JWTs /
sessions / API keys / the vault live", a threat-model surface map, an audit-and-access-control
overview, or a data-classification picture of which stores hold confidential data behind which
control.

**Do NOT use when**:
- The request is specifically about the **auth / API-key / bearer boundary** between a client
  and protected services (token issuance, key rotation, bearer scopes) -> use the
  **excalidash-auth-api-key-boundaries** skill; do not duplicate its token-flow detail here.
- The request is a CI/CD or cloud-deployment topology (VPCs, regions, pipelines) -> use the
  **excalidash-devops-cloud-deployment** skill, even though it shares some AWS icons.
- The request is a plain C4 container/context view with no security framing -> use the
  **excalidash-c4-container** or C4 context skill.
- The request is a request/response sequence over time -> use a sequence/flow skill.
- More than one system's internals are in scope -> draw one security view per system; do not
  merge two trust perimeters onto one canvas (split it, and say so).

## Expected input
A short description of the system plus, where available:
- **Zones** — which components are reachable from the public internet, which sit in a DMZ
  (load balancer, WAF, reverse proxy, auth gateway), and which are private (services, data).
- **Identities / actors** — end user, admin, service account, third-party integration.
- **Controls on the path** — auth method (JWT / session / mTLS), RBAC roles, CSRF protection,
  rate limit, WAF, audit log, secrets manager / vault.
- **Data stores** — each with a *classification* (public / internal / confidential / restricted)
  and which control guards it.
- **External systems** — IdP, payment provider, third-party API the protected zone calls out to.
If a zone or control is unstated, infer the conventional placement (auth gateway in the DMZ, data
stores in private) and state the assumption. **Redact every literal secret BEFORE it reaches a
tool argument** — the server also redacts on output, but you fail closed at the input boundary.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, the scoring rubric.
2. `mcp__excalidash__search_libraries` -> `mcp__excalidash__inspect_library` ->
   `mcp__excalidash__cache_library` — vet boundary, gateway, key/lock, vault and cloud-control
   icons from the curated packs.
3. ONE create path (mutually exclusive):
   - `mcp__excalidash__apply_architecture_skill` with `pattern: "clean"` for a layered
     defensive skeleton with ready-made boundary frames (preferred when the system is layered), OR
   - `mcp__excalidash__create_diagram_from_prompt` with `diagramType: "security"` and an explicit
     zone/control `structure` (preferred when you have the node/edge list).
4. `mcp__excalidash__add_library_items_normalized` — place gateway / lock / key / vault / audit
   icons and data-classification badges into reserved slots.
5. `mcp__excalidash__lint_drawing` -> `mcp__excalidash__score_drawing` ->
   `mcp__excalidash__repair_drawing` (loop, mandatory).
6. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
7. `mcp__excalidash__validate_architecture` — confirm a trust boundary exists, no public->private
   shortcut, auth gateway on the path; `mcp__excalidash__suggest_architecture_improvements` for gaps.
8. `mcp__excalidash__save_drawing` -> `mcp__excalidash__save_version` ->
   `mcp__excalidash__get_drawing_url` -> `mcp__excalidash__export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=security PRESET=dark-architecture ZONES=public,dmz,private GATEWAY=auth CONTROLS=jwt,rbac,csrf,ratelimit,audit,vault
   LIBRARY=curated[Cloud Design Patterns, AWS Architecture Icons, Software Architecture]
   VALIDATORS=lint,score,repair,validate_architecture`. List zones, nodes, edges and the
   control on each boundary crossing. **Redact every secret in the input now**, before it
   reaches any tool argument.
2. **Generate (one path only).**
   - `apply_architecture_skill({ pattern: "clean", preset: "dark-architecture", title: "<System> — Security Architecture", save: false })`
     when the system is layered and you want generated boundary frames, OR
   - `create_diagram_from_prompt({ diagramType: "security", structure: { nodes, edges }, direction: "LR", preset: "dark-architecture", title: "<System> — Security Architecture", save: false })`
     with one node per component (each tagged to a zone group) and one edge per traversal.
   - Layout intent: three left-to-right **boundary frames** — `public` (users, internet),
     `dmz` (WAF, load balancer, **auth gateway**), `private` (services, data stores, vault,
     audit log). Every public->private arrow must pass *through* the auth gateway in the DMZ;
     reserve >= 32px arrow lanes between zones so no line crosses a control label. Capture the
     returned drawing `id`.
3. **Place icons.** `add_library_items_normalized` — a gateway/shield glyph on the auth node,
   a lock on each protected service, a key icon on the secrets-manager/vault node, an audit
   icon on the log, and a small classification badge (public/internal/confidential/restricted)
   on each data store. Keep the auth gateway visually distinct (it is the choke point).
4. **Lint.** `lint_drawing({ id })`; record `hardBlockers`. Must end empty.
5. **Score.** `score_drawing({ minimumScore: 95 })`; record the number and every penalty.
6. **Repair (mandatory).** For each blocker/penalty call `repair_drawing({ save: false })`, then
   re-lint and re-score. Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: if a
   repair pass lowers the score, restore the last `save_version` checkpoint and apply a smaller,
   targeted fix instead.
7. **Polish.** Only after blockers clear, `auto_polish_drawing({ minimumScore: 95, maxAttempts: 3, save: false })`;
   re-score to confirm no regression (roll back to the checkpoint if it drops below it).
8. **Validate.** `validate_architecture({ structure })` — a trust boundary exists, there is no
   public/frontend->DB shortcut, the auth gateway sits on every inbound path, infra does not reach
   into the private zone unmediated. Run `suggest_architecture_improvements({ structure })` and act
   on missing-control findings (no audit log, no rate limit, no vault).
9. **Save.** `save_drawing({ id, name: "<System> — Security Architecture" })`, then
   `save_version({ id })` to checkpoint the accepted state.
10. **Export.** `get_drawing_url({ id })` for a link, then
    `export_drawing({ id, format: "svg" })` (or png/excalidraw); **re-scan the export for
    secrets** as a backstop — connection strings, bearer tokens and vault paths are the common
    leaks at this stage.

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only: draw zone frames, the gateway shield, lock/key glyphs and the
  vault by hand; no icon calls.
- **curated** (default) — pull only from **Cloud Design Patterns** (gateway, valet-key, federated
  identity, throttling, circuit-breaker glyphs), **AWS Architecture Icons** (WAF, Cognito/IAM,
  Secrets Manager, KMS, CloudTrail-style audit, VPC boundary), and **Software Architecture**
  (services, gateways, queues, layers). Actors may come from **Stick Figures**.
- **required** — every protected service MUST carry a lock, the secrets-manager/vault MUST use a
  key/vault icon, the audit node MUST use an audit/log icon, and each data store MUST show a
  classification badge; a bare primitive where a curated icon exists is a violation.

Workflow: `search_libraries({ q: "gateway lock vault audit firewall", mode: "curated" })` ->
`inspect_library({ libraryId, autoCache: true })` -> `cache_library` ->
`add_library_items_normalized({ libraryId, itemNames, position, slotSize, placement, save: false })`.
Icon slots: `inside-card-top` for the gateway shield (32x32), `badge` for the lock and the
classification marker (corner), `cloud-provider` for vendor security logos, `database-symbol`
for stores, `actor` for people (48x48), `legend` for the keyed control swatches. Normalize
scale, preserve aspect, match the dark-architecture preset's stroke/fill. **Reject any icon that
introduces HIGH_DENSITY or collides with an arrow lane** — drop it and use a primitive. Record
used and rejected items.

## Validation & score
- `hardBlockers` must be empty: no `ARROW_TEXT_INTERSECTION` (a boundary-crossing arrow never
  sits under a control label), no `FRAME_TITLE_OVERLAP` (the `public`/`dmz`/`private` frame
  titles stay title-only), no `ITEM_OUTSIDE_FRAME` (every node sits fully inside its zone frame;
  no service half-clipped across a boundary).
- No `SMALL_FONT`: control labels (RBAC, CSRF, rate limit, audit) are >= 16px and fit with 16px
  padding; do not shrink-to-fit a long label.
- No `HIGH_DENSITY`: the DMZ band stays breathable even with WAF + gateway + rate limit stacked;
  spread controls vertically or split into a sub-frame rather than cramming.
- No `TEXT_NEAR_EDGE`: keep all content >= 40px from the canvas/export bounds.
- `validate_architecture` clean: a trust boundary exists, no public->private shortcut, the auth
  gateway is on every inbound path; `suggest_architecture_improvements` surfaces no missing
  mandatory control (audit, rate limit, vault).
- **Minimum score 95 with empty hardBlockers.** Repair is mandatory below 95 or with any blocker;
  roll back any pass that lowers the score.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. This is the most secret-prone diagram type
in the set — it is *about* credentials — so redaction is non-negotiable. Redact BEFORE any tool
call and re-scan the export. Show the *concept*, not the value:
- A connection string `postgres://app:<password>@db/main` becomes
  `postgres://app:[REDACTED_DATABASE_URL]@db/main` (keep the shape, drop the value).
- A JWT signing key becomes a "JWT secret" label plus a key icon — never the bytes; the literal is
  `[REDACTED_JWT_SECRET]`.
- API keys, service-role keys, bearer values, webhook signing secrets and proxy creds become
  `[REDACTED_API_KEY]`, `[REDACTED_SERVICE_ROLE]`, `[REDACTED_BEARER]`, `[REDACTED_WEBHOOK_SECRET]`,
  `[REDACTED_PROXY_SECRET]`.
- The vault node holds `[REDACTED_*]` placeholder references, never the resolved secrets it issues.
**Transcript-leak risk**: never echo a detected secret back to the user, into a label, a note, a
log, or a snapshot — fail closed and redact on any uncertainty. Keep the diagram **defensive**:
show controls and boundaries, not how to bypass them.

## Internal prompts
- **Plan prompt**: `"Plan the Security Architecture for <SYSTEM>. List nodes grouped by zone
  (public / dmz / private), the auth gateway, and which control guards each boundary crossing
  (JWT, RBAC, CSRF, rate limit, audit, vault). Mark each data store's classification. Redact every
  secret to [REDACTED_<TYPE>] before drawing."`
- **Security structure prompt**: `"Security architecture for <SYSTEM>. public: 'End User', 'Admin'.
  dmz: 'WAF', 'Load Balancer', 'Auth Gateway (JWT + RBAC + CSRF + rate limit)'. private: 'API
  Service' (lock), 'Worker' (lock), 'Postgres' (confidential), 'Cache' (internal), 'Secrets Vault'
  (key icon), 'Audit Log'. Edges: users -> WAF -> Auth Gateway -> API Service; API Service ->
  Postgres; API Service -> Vault (reads [REDACTED_DATABASE_URL]); API Service -> Audit Log. Every
  inbound arrow passes through the Auth Gateway. No public->private shortcut. Legend: control types."`
- **Redaction nudge**: `"Scan every node/edge label and note; replace any JWT, API key, service-role,
  db URL, bearer, webhook or proxy value with [REDACTED_<TYPE>], keeping surrounding shape; never
  echo the original."`
- **Repair nudge**: `"ARROW_TEXT_INTERSECTION on the 'Auth Gateway -> API Service' edge: rebind the
  endpoints to card sides and route the line through the 32px DMZ->private gutter; move the 'JWT +
  RBAC' label into the side lane with 16px clearance; keep the zone frames fixed."`

## Example prompts for Claude Code
- "Draw the security architecture for our web app — show public, DMZ and private zones and where JWT auth sits."
- "Map our trust boundaries: users on the internet, WAF and auth gateway in the DMZ, services and Postgres private, with the secrets vault and audit log."
- "I need a defensive diagram showing RBAC, CSRF, rate limiting and the audit log on the request path, plus data classification on each store."
- "Show which data stores are confidential and which control guards each one — auth gateway, vault, the lot — and redact every secret."
- "Visualise our trust perimeter so I can threat-model it: no public-to-database shortcut, every inbound request through the auth gateway."

## Acceptance criteria
- [ ] Three trust-boundary frames (`public` / `dmz` / `private`); every node fully inside its zone.
- [ ] An explicit auth gateway in the DMZ; every inbound arrow passes through it (no public->private shortcut).
- [ ] Controls are visible and labelled: JWT/session, RBAC, CSRF, rate limit, audit log, secrets manager/vault.
- [ ] Each data store carries a classification (public / internal / confidential / restricted).
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No `ARROW_TEXT_INTERSECTION`; boundary-crossing arrows ride a gutter beside their control label.
- [ ] Zone-frame titles and the diagram title do not overlap each other or a node.
- [ ] Libraries used per policy when relevant (gateway/lock/key/vault/audit icons; normalized).
- [ ] `validate_architecture` clean: trust boundary present, gateway on the path; `suggest_architecture_improvements` flags no missing mandatory control.
- [ ] NO raw secret anywhere (drawing, response, export, log, snapshot) — only `[REDACTED_<TYPE>]` placeholders.

## Examples
See `./references/examples.md` for full request -> plan -> ordered tool calls with realistic
arguments, plus `./references/checklist.md` and `./references/anti-patterns.md`. Shared rules live
in `../_shared/references/security-redaction.md`, `../_shared/references/library-policy.md`,
`../_shared/references/geometry-rules.md`, and `../_shared/references/architecture-patterns.md`.
