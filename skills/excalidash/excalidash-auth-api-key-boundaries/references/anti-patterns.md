# Auth & API-Key Boundaries — Anti-Patterns

Real failure modes the lint/score engine catches, plus mistakes specific to drawing an
authentication / API-key trust boundary. Each has a concrete fix.

---

## Geometry / lint-engine failures

### ARROW_TEXT_INTERSECTION — the credential label sits under a routed line
The boundary is the busiest part of the canvas: every client points an edge at the gateway, and each
edge carries a label like "presents `[REDACTED_API_KEY]`". When those labels ride on top of the
routed line, lint flags `ARROW_TEXT_INTERSECTION` and the score drops.
**Fix**: route the edge through a >= 32px gutter and move the label into the side lane with 32px
clearance. `repair_drawing({ id, ... })`, then re-lint.

### FRAME_TITLE_OVERLAP — boundary-frame title collides with a control card
Packing "Verify Key", "Scope / RBAC", "Rate Limit" and "Audit Log" high inside the boundary frame
pushes the first control under the frame's "Auth Gateway" title.
**Fix**: keep the frame title in its own title band; start the control grid below it. Repair the
overlap, do not shrink the title font (that trades one blocker for `SMALL_FONT`).

### ITEM_OUTSIDE_FRAME — a protected service half-clips the authenticated zone
A converted or hand-nudged service ends up straddling the authenticated-zone boundary, or a vault
icon spills outside the frame it belongs to.
**Fix**: snap the service fully inside the authenticated zone; keep clients fully in the public zone.
Clients are *intentionally* in the public zone — but never half-clipped across the boundary edge.

### HIGH_DENSITY — five controls crammed into one boundary frame
Key verify + HMAC store + scope/RBAC + rate limit + audit + vault in a tight frame trips
`HIGH_DENSITY`, and adding icons on top makes it worse.
**Fix**: widen column gutters to 48px BEFORE adding icons; if still dense, stack controls vertically
in the boundary lane. Reject any icon that re-introduces the penalty.

### SMALL_FONT — labels shrunk to fit after icons land
Dropping a gateway/lock/throttle icon into a card and then shrinking the label to keep it on one
line trips `SMALL_FONT`.
**Fix**: enlarge the card or move the icon to a `badge` slot; never drop below the preset's minimum
font size.

### TEXT_NEAR_EDGE — the public zone runs to the canvas edge
A wide public zone (many clients) pushes the leftmost client label to the canvas bound.
**Fix**: keep all content >= 40px from canvas/export bounds; let `auto_polish_drawing` reflow, then
re-score.

---

## Skill-specific modeling mistakes

### A raw key, token, JWT or HMAC secret appears anywhere
Pasting `exd_live_<entropy>`, an `Authorization: Bearer <JWT>` header, the HMAC signing secret, or a
`postgres://app:<password>@db/main` string into a node/edge/version label or letting it reach the export.
**Fix**: redact BEFORE the tool call — `exd_live_[REDACTED_API_KEY]`, `Bearer [REDACTED_BEARER]`,
`[REDACTED_HMAC_SECRET]`, `postgres://app:[REDACTED_DATABASE_URL]@db/main`. Re-scan the export. The
only literal allowed is the public `exd_` prefix. Fail closed on uncertainty.

### Showing the API key in plaintext "at rest"
Labeling the key store "API keys" and drawing the literal value, or implying keys are stored as-is.
**Fix**: label the store "API keys (HMAC at rest)" with a vault icon; the boundary verifies by
HMAC-comparing the presented key against the stored hash. Never draw the plaintext key in the store.

### No explicit boundary — public and protected nodes share one undivided canvas
Clients and protected services drawn as one flat graph with the gateway as just another box; nothing
visually separates trusted from untrusted.
**Fix**: make the boundary an explicit frame. Public zone on one side, authenticated zone on the
other, the gateway straddling the line. `validate_architecture` should report one boundary.

### A public-zone node reaches a protected service without crossing the gateway
A "back-channel" edge from a client (or a partner service) straight to Postgres or the Orders API,
bypassing auth.
**Fix**: every edge from the public zone must terminate at the gateway; only the gateway has edges
into the authenticated zone. `suggest_architecture_improvements` flags the bypass.

### Missing the negative path (401 / 403)
Only the happy "200 (scoped)" edge is drawn; the diagram implies auth never rejects anyone.
**Fix**: draw the gateway -> client "401 / 403" edge so denial is visible. Auth that never fails is
not auth.

### Authentication shown but no authorization
A key check with no scope/RBAC step — the diagram proves *who* but not *what they may do*.
**Fix**: add the "Scope / RBAC Check" node after key verification; a valid key still gets `403` if
its scope does not cover the route.

### No rate limit, no audit
A boundary that authenticates and authorizes but neither throttles nor records.
**Fix**: include a rate-limit node and an audit-log node on the boundary; both are part of a real
key boundary and both are acceptance criteria.

### Rotation/revocation omitted
Keys are issued but the diagram has no path to rotate or revoke them — a leaked key would live
forever.
**Fix**: attach a "Rotate / Revoke" control to the key store; revocation must invalidate the HMAC
hash so the next verify fails.

### Off-policy or clashing icons
Pulling a glossy 3-color gateway logo from an arbitrary public library that clashes with the
`dark-architecture` preset and trips `HIGH_DENSITY`.
**Fix**: stay in the curated packs (Cloud Design Patterns, AWS Architecture Icons, Software
Architecture), inspect aspect/stroke/fill, normalize to the preset, and reject anything that lowers
the score — fall back to a primitive.

### Saving before the loop converges
Calling `save_drawing` while the score is still 88 or a blocker remains.
**Fix**: lint -> score -> repair is mandatory until `score >= 95` and `hardBlockers == []`; only then
`save_drawing` -> `save_version`.

See `../_shared/references/geometry-rules.md` and `../_shared/references/security-redaction.md`;
penalties are enforced by `score_drawing`.
