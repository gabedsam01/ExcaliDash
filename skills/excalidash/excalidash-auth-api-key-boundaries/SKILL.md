---
name: excalidash-auth-api-key-boundaries
description: Use when you need a security view of authentication and API-key/bearer trust boundaries — the public zone, the auth/key-check boundary, and the authenticated zone behind it — covering key issuance (exd_ prefix), HMAC-at-rest, scopes, rotation/revocation, RBAC, rate limiting and audit, with every key or token shown only as [REDACTED_API_KEY].
allowed-tools:
  - mcp__excalidash__read_mcp_guide
  - mcp__excalidash__create_diagram_from_prompt
  - mcp__excalidash__apply_architecture_skill
  - mcp__excalidash__search_libraries
  - mcp__excalidash__inspect_library
  - mcp__excalidash__cache_library
  - mcp__excalidash__add_library_items_normalized
  - mcp__excalidash__lint_drawing
  - mcp__excalidash__score_drawing
  - mcp__excalidash__repair_drawing
  - mcp__excalidash__auto_polish_drawing
  - mcp__excalidash__validate_architecture
  - mcp__excalidash__suggest_architecture_improvements
  - mcp__excalidash__save_drawing
  - mcp__excalidash__save_version
  - mcp__excalidash__get_drawing_url
  - mcp__excalidash__export_drawing
---

# Auth & API-Key Boundaries

## Objective
Produce a security diagram of how a system authenticates callers and enforces an API-key/bearer
trust boundary: a **public (untrusted) zone** holding clients, the **boundary** itself — the
gateway that verifies a bearer token or an API key (issued with the `exd_` prefix, stored only as
an HMAC hash, scoped, rotatable and revocable) — and the **authenticated (trusted) zone** holding
the protected services and data behind it. The diagram makes the boundary an explicit frame, shows
the controls that live on it (key verification, scope/RBAC check, rate limit, audit log, vault for
the HMAC secret), and labels every cross-boundary edge with what is presented and what is checked.
Every key, token, bearer value or signing secret appears ONLY as a typed `[REDACTED_*]`
placeholder — never a real value. The result must score >= 95 with zero hard blockers.

## When to use / When NOT to use
**Use when**: the request is "draw how our API-key / bearer auth works", "show the trust boundary
between public clients and protected services", "diagram key issuance / rotation / revocation",
"where do we hash the key, check scopes, rate-limit and audit", "show the `exd_` key lifecycle and
RBAC", or "map the public zone vs the authenticated zone for our gateway".

**Use when** the emphasis is the *credential boundary* — issuance, hashing-at-rest, scopes,
rotation, revocation, rate limiting and audit — rather than the whole system.

**Do NOT use when**:
- The request is a broad security/trust-boundary overview (network zones, data protection,
  encryption at rest/in transit) without a specific key/bearer focus -> use the general
  **security-architecture** skill (prompt `excalidash_security_architecture`).
- The request is an MCP server / AI-tool architecture (transport + auth + tool registry +
  storage) -> use the **ai-mcp-architecture** skill; here auth is one node of many, not the subject.
- The request is a time-ordered token-exchange handshake (OAuth code -> token -> refresh as a
  sequence) -> use a sequence/flow skill; this skill draws the *static boundary*, not the timeline.
- The request is a generic C4 container/context view -> use the matching C4 skill
  (see `../_shared/references/mcp-tool-cheatsheet.md`).

## Expected input
A short description of the auth surface, ideally naming:
- **Clients / callers** in the public zone (browser SPA, mobile app, CI job, partner service, CLI).
- **The credential type** at the boundary — bearer JWT, API key (`exd_…`), or both — and where it
  is presented (`Authorization: Bearer …`, `X-Api-Key: exd_…`).
- **Boundary controls** in scope: key verification, HMAC-at-rest store, scope/RBAC enforcement,
  rate limiting, audit logging, key rotation and revocation, a vault/secrets manager for the
  signing/HMAC secret.
- **Protected services / data** in the authenticated zone the boundary guards.
Any literal key, token, JWT, HMAC secret or connection string MUST be pre-redacted as
`[REDACTED_<TYPE>]` before it reaches a tool argument; if the caller pastes a raw value, redact it
on the way in and never echo it back.

## Recommended MCP tools (ordered call sequence)
1. `mcp__excalidash__read_mcp_guide` — load presets, `MCP_LIBRARY_MODE`, the scoring rubric.
2. `mcp__excalidash__search_libraries` -> `mcp__excalidash__inspect_library` ->
   `mcp__excalidash__cache_library` — vet gateway, key/lock, shield, queue/limiter, audit-log and
   vault icons from the curated packs (Cloud Design Patterns, AWS Architecture Icons, Software
   Architecture).
3. ONE create path:
   - `mcp__excalidash__create_diagram_from_prompt` with `diagramType: "security"` and an explicit
     public-zone / boundary / authenticated-zone structure (preferred), OR
   - `mcp__excalidash__apply_architecture_skill` with `pattern: "hexagonal"` (auth as an inbound
     adapter / port guarding the domain) when the request wants a ports-and-adapters skeleton.
4. `mcp__excalidash__add_library_items_normalized` — place gateway, key/lock, rate-limit, audit and
   vault icons into reserved slots.
5. `mcp__excalidash__lint_drawing` -> `mcp__excalidash__score_drawing` ->
   `mcp__excalidash__repair_drawing` (loop).
6. `mcp__excalidash__auto_polish_drawing` — after blockers clear; re-score for no regression.
7. `mcp__excalidash__validate_architecture` ->
   `mcp__excalidash__suggest_architecture_improvements` — confirm the boundary is modeled and
   nothing in the public zone reaches a protected service without crossing it.
8. `mcp__excalidash__save_drawing` -> `mcp__excalidash__save_version` ->
   `mcp__excalidash__get_drawing_url` -> `mcp__excalidash__export_drawing`.

## Workflow
1. **Plan.** Write the plan line before any create call:
   `TYPE=security THEME=auth-api-key PRESET=dark-architecture
   LIBRARY=curated[Cloud Design Patterns, AWS Architecture Icons, Software Architecture]
   ZONES=public|boundary|authenticated VALIDATORS=lint,score,repair,validate_architecture`.
   List the nodes per zone and the cross-boundary edges. **Redact every secret in the input BEFORE
   it reaches a tool argument** (see below). Confirm there is exactly one boundary frame and that no
   public-zone node is wired directly to a protected service.
2. **Generate (one path only).**
   - Preferred: `create_diagram_from_prompt({ diagramType: "security", direction: "LR",
     structure: { nodes, edges }, preset: "dark-architecture", title: "<System> — Auth & API-Key
     Boundary", save: false })` with the public zone on the left, the boundary frame in the middle
     (key check -> scope/RBAC -> rate limit -> audit, vault attached), and the authenticated zone on
     the right.
   - Alternative: `apply_architecture_skill({ pattern: "hexagonal", preset: "dark-architecture",
     title: "<System> — Auth Adapter", save: false })` to seat the auth gateway as the inbound
     adapter/port guarding the domain. Use ONLY the `pattern` argument — there is no `skill` or
     `level` argument.
   - Capture the returned `id`. Layout intent: clients in the public zone (left); a labeled
     **boundary frame** holding the gateway and its controls (centre); protected services and data
     in the authenticated zone (right). Reserve >= 32px arrow lanes so the "presents `[REDACTED_API_KEY]`"
     and "401 / 403" edges never cross a node or another label.
3. **Place icons.** `add_library_items_normalized` — a gateway/shield glyph as `inside-card-top`
   on the boundary card, a key/lock icon in a `badge` slot on the key-verification node, a
   rate-limit/throttle icon on the limiter node, an audit-log icon on the audit node, a vault icon
   on the HMAC-secret store. Keep the public-zone cards visually lighter and clearly outside the
   boundary frame. Reject any icon that introduces `HIGH_DENSITY` or collides with an arrow lane.
4. **Lint.** `lint_drawing({ id })`; record `hardBlockers`. Must end empty.
5. **Score.** `score_drawing({ minimumScore: 95 })`; record the number and every penalty.
6. **Repair (mandatory).** For each blocker/penalty call `repair_drawing`, then re-lint and
   re-score. Loop until `score >= 95` AND `hardBlockers == []`. **Rollback**: before the first
   repair, `save_version({ id })` as a checkpoint; if a repair pass lowers the score, restore that
   checkpoint and apply a smaller, targeted fix — investigate the blocker manually rather than
   re-running the same repair.
7. **Polish.** Only after blockers clear, run `auto_polish_drawing({ minimumScore: 95 })`; re-score
   to confirm no regression (roll back if it drops below the checkpoint).
8. **Validate.** `validate_architecture({ structure })` — the boundary frame exists; every
   protected service sits inside the authenticated zone; no public-zone node reaches a protected
   service without passing through the gateway; key verification, scope/RBAC, rate limit and audit
   are all present on the boundary. Then `suggest_architecture_improvements({ structure })` to catch
   a missing revocation path, an un-rate-limited route, or an audit gap.
9. **Save.** `save_drawing({ id, name: "<System> — Auth & API-Key Boundary" })`, then
   `save_version({ id })` to checkpoint the accepted state.
10. **Export.** `get_drawing_url({ id })` for a link, then `export_drawing({ id, format: "svg" })`;
    re-scan the export for secrets as a backstop — every key/token/secret must read `[REDACTED_*]`,
    never a real value.

## Library policy
Follow `../_shared/references/library-policy.md` and read `MCP_LIBRARY_MODE` first.
- **off** — primitives only; draw the boundary frame, gateway rectangle, key/lock, rate-limit,
  audit and vault shapes by hand; no icon calls.
- **curated** (default) — pull only from **Cloud Design Patterns** (gateway, throttling, valet-key,
  federated-identity, gatekeeper glyphs), **AWS Architecture Icons** (API Gateway, Cognito/IAM,
  WAF, Secrets Manager, CloudTrail), and **Software Architecture** (services, gateways, queues,
  layers). People/clients from **Stick Figures**.
- **required** — the gateway MUST use a gateway/gatekeeper icon, the secret store MUST use a
  vault/secrets-manager icon, the limiter MUST use a throttle icon, and the audit node MUST use a
  log/trail icon; a primitive where a curated icon exists is a violation.

Workflow: `search_libraries({ q: "api gateway", mode: "curated" })` -> `inspect_library` (aspect,
stroke, fill, complexity) -> `cache_library` -> `add_library_items_normalized`. Icon slots:
`inside-card-top` for the gateway glyph (32x32), `badge` for the key/lock and throttle markers,
`legend` for the keyed swatches (public / boundary / authenticated), `actor` for clients (48x48).
Normalize scale, preserve aspect, match the preset's stroke and fill. **Reject any icon that
introduces `HIGH_DENSITY`, collides with an arrow lane, or breaks preset consistency** — drop it
and use a primitive. Record used and rejected items.

## Validation & score
- `hardBlockers` must be empty: no `ARROW_TEXT_INTERSECTION` (the "presents `[REDACTED_API_KEY]`"
  and "401/403" labels never sit under a routed line), no `FRAME_TITLE_OVERLAP` (the boundary-frame
  title and the legend header stay title-only), no `ITEM_OUTSIDE_FRAME` (every protected service
  fully inside the authenticated zone; clients intentionally in the public zone, not half-clipped).
- Watch for `HIGH_DENSITY` when the boundary frame packs key-check + scope + rate-limit + audit +
  vault — widen the column gutters before adding icons.
- No `SMALL_FONT`: keep edge labels and control names legible after icon placement.
- No `TEXT_NEAR_EDGE`: keep all content >= 40px from canvas/export bounds.
- **Minimum score 95** with `hardBlockers == []` before saving as final. Repair is mandatory below
  95 or with any blocker; roll back any pass that lowers the score.
- `validate_architecture` clean: one boundary frame; protected services inside the authenticated
  zone; no public-zone -> protected-service edge bypasses the gateway; key verification, scope/RBAC,
  rate limit and audit all present.

## Secrets & redaction
Follow `../_shared/references/security-redaction.md`. This is the single most secret-prone skill:
the subject *is* credentials. Redact BEFORE any tool call and re-scan the export. Concrete rules:
- An API key like `exd_live_<entropy>` becomes `exd_live_[REDACTED_API_KEY]` — keep the `exd_` prefix
  (it is the public, non-secret part) and redact the entropy.
- A bearer header `Authorization: Bearer <JWT>` becomes `Authorization: Bearer [REDACTED_BEARER]`.
- The HMAC signing secret becomes `[REDACTED_HMAC_SECRET]`; a JWT signing key becomes
  `[REDACTED_JWT_SECRET]`; a service-role token becomes `[REDACTED_SERVICE_ROLE]`; a webhook signing
  secret becomes `[REDACTED_WEBHOOK_SECRET]`; a `postgres://app:<password>@db/main` connection string becomes
  `postgres://app:[REDACTED_DATABASE_URL]@db/main`.
- Show the *concept*, not the value: label the store "API keys (HMAC at rest)" with a vault icon,
  label the edge "presents `[REDACTED_API_KEY]`", show a key icon — never the raw key.
- **Transcript-leak risk**: never echo a detected secret back to the user, into a node label, into a
  version label, or into an export. If a value's nature is uncertain, treat it as a secret and
  redact (fail closed).

## Internal prompts
- **Plan prompt**: `"Plan the Auth & API-Key boundary for <SYSTEM>. List public-zone clients, the
  boundary controls (key verify, HMAC-at-rest, scope/RBAC, rate limit, audit, rotation/revocation,
  vault), and the authenticated-zone services. List the cross-boundary edges and what each presents
  and checks. Redact any literal secret as [REDACTED_<TYPE>] before drawing."`
- **Structure prompt**: `"Security diagram, LR. PUBLIC ZONE: 'Browser SPA', 'Mobile App',
  'Partner Service' (each presents [REDACTED_API_KEY] or [REDACTED_BEARER]). BOUNDARY FRAME 'Auth
  Gateway': 'Verify Key (HMAC compare)' -> 'Scope / RBAC Check' -> 'Rate Limit' -> 'Audit Log';
  'Vault (HMAC secret)' attached to Verify Key; 'Rotate / Revoke' attached to the key store.
  AUTHENTICATED ZONE: 'Orders API', 'Billing API', 'Postgres'. Edges: each client -> Auth Gateway
  'presents [REDACTED_API_KEY]'; Auth Gateway -> service '200 (scoped)'; Auth Gateway -> client
  '401 / 403'. Legend: public / boundary / authenticated. Keys only as [REDACTED_API_KEY]."`
- **Repair nudge**: `"ARROW_TEXT_INTERSECTION on the 'presents [REDACTED_API_KEY]' edge -> route the
  line through the boundary gutter and move the label into the side lane with 32px clearance; keep
  the 'Auth Gateway' frame and its controls fixed."`
- **Redaction sweep**: `"Re-scan every node label, edge label, version label and the SVG/PNG export.
  Any key/token/JWT/HMAC/db-URL must read [REDACTED_<TYPE>]; the only literal allowed is the exd_
  prefix. Fail closed on uncertainty."`

## Example prompts for Claude Code
- "Diagram our API-key auth: browser and partner clients on the outside, an auth gateway that
  verifies the `exd_` key against an HMAC hash, checks scopes, rate-limits and audits, then the
  protected Orders and Billing APIs inside."
- "Show the trust boundary between the public zone and the authenticated zone for our bearer-token
  gateway, including rotation and revocation."
- "Draw the API-key lifecycle and where it's enforced — issuance with the exd_ prefix, HMAC at rest,
  scope/RBAC, rate limit, audit — as a security diagram."
- "Map how clients present a bearer token to our gateway and what comes back (200 scoped vs 401/403),
  with the vault holding the signing secret."
- "We need a security view of our API gateway showing the key check, RBAC, throttling and audit log
  as one trust boundary — keys must be redacted."

## Acceptance criteria
- [ ] Exactly one boundary frame separates the public zone from the authenticated zone.
- [ ] The bearer/API-key check is an explicit node on the boundary (key verify + HMAC-at-rest).
- [ ] Scope/RBAC, rate limit and audit log are present on the boundary; rotation/revocation shown.
- [ ] Every protected service sits inside the authenticated zone; no public-zone node reaches a
      protected service without crossing the gateway.
- [ ] Every cross-boundary edge is labeled with what is presented and what comes back (e.g.
      "presents `[REDACTED_API_KEY]`", "200 (scoped)", "401 / 403").
- [ ] `score >= 95` and `hardBlockers == []`.
- [ ] No arrow/line intersects any text (no `ARROW_TEXT_INTERSECTION`); no `FRAME_TITLE_OVERLAP`.
- [ ] Boundary-frame title and legend header do not overlap each other or a node.
- [ ] Libraries used per policy when relevant (gateway, key/lock, throttle, audit, vault; normalized).
- [ ] `validate_architecture` clean; `suggest_architecture_improvements` shows no missing
      revocation / rate-limit / audit path.
- [ ] No secret leaked in drawing, response, version label, or export — keys read `[REDACTED_API_KEY]`,
      the `exd_` prefix is the only literal.

## Examples
See `./references/examples.md` for full request -> plan -> ordered tool calls with realistic
arguments, plus `./references/checklist.md` and `./references/anti-patterns.md`. Shared rules live
in `../_shared/references/security-redaction.md`, `../_shared/references/library-policy.md`,
`../_shared/references/geometry-rules.md`, and `../_shared/references/architecture-patterns.md`.
