# Security Architecture (skill)

## Objective
Produce diagrams that make trust boundaries, authentication/authorization flows, and
data-protection controls explicit. The reader should immediately see where untrusted
input enters, where it is verified, and where sensitive data is encrypted, stored, or logged.

## When to use
- Threat models, attack-surface or boundary diagrams.
- Auth/identity flows (OIDC, OAuth2, SSO, mTLS, token exchange).
- Data-protection reviews (encryption in transit/at rest, secrets, PII handling).
- Any request mentioning "trust boundary", "zero trust", "DMZ", "STRIDE", or "blast radius".

Do NOT use for pure runtime/system architecture with no security framing — use a
general architecture skill instead.

## Expected input
- A free-text prompt, repo path, or component list describing the system.
- Optional: a list of actors (users, services, attackers) and assets (data stores, secrets).
- Optional: known boundaries (public internet, VPC, internal network, third parties).

If actors, assets, or boundaries are unstated, infer conservative defaults (one untrusted
external zone, one trusted internal zone) and note the assumption in a caption.

## Visual rules
- Render every trust boundary as a labeled dashed rectangle (zone container). Always label
  it (e.g. "Public / Untrusted", "VPC / Trusted", "Third Party").
- Color-code by trust level: red/amber tones for untrusted, green/blue for trusted,
  gray for third-party. Keep the palette consistent across the whole diagram.
- Place every data flow that crosses a boundary as an arrow that visibly intersects the
  dashed edge; label it with protocol + auth (e.g. "HTTPS + JWT", "mTLS").
- Mark security controls inline: lock icon for encryption, key icon for secrets/KMS,
  shield for WAF/firewall, badge for authN/authZ checkpoints.
- Tag each data store with its classification (Public / Internal / Confidential / PII).
- Preferred presets: `dark-architecture` or `technical-docs`. Avoid `startup-deck`.

## Logic rules
- Every arrow crossing a boundary MUST carry an auth/encryption label; an unlabeled
  crossing is a finding, not a default.
- No untrusted actor connects directly to a data store — a verification checkpoint
  (gateway, authN, validation) must sit between them.
- Secrets and keys live in a dedicated vault/KMS node, never inline on a service.
- Show the authN step before the authZ step; never authorize before authenticating.
- Each external dependency is its own boundary; do not fold third parties into the
  trusted zone.
- Keep one diagram to one threat scope; split blast-radius views into separate drawings.

## Recommended libraries
- **Cloud Design Patterns** — gateway, valet-key, federated-identity, and boundary motifs.
- **AWS Architecture Icons** — KMS, WAF, IAM, VPC, Security Group, Secrets Manager glyphs.

Resolve and load them before placing nodes:
```
search_libraries  -> inspect_library -> cache_library -> add_library_items_normalized
```
Use `add_library_items_normalized` so icon scale/stroke match the chosen preset.

## Mandatory validation
Run the full quality flow before any final save. The minimum passing score is **95**.
1. `lint_drawing` — fix structural/label issues it reports.
2. `score_drawing` — must return **>= 95**. If below, continue.
3. `repair_drawing` then `auto_polish_drawing`, then re-run `score_drawing`.
4. `auto_polish_drawing` is REQUIRED before the final save even if the score already passes.
5. Only then `save_drawing` (final). If still below 95, save with `asDraft: true` and report the gap — never save a sub-95 drawing as final.

## Minimal examples
Generate from a prompt, then apply the skill:
```json
{
  "tool": "apply_architecture_skill",
  "arguments": {
    "skillId": "security-architecture",
    "prompt": "Web app behind a WAF and API gateway, OIDC login, PII stored in Postgres, secrets in KMS",
    "preset": "dark-architecture",
    "libraries": ["Cloud Design Patterns", "AWS Architecture Icons"]
  }
}
```
Validate and finalize:
```json
{ "tool": "score_drawing", "arguments": { "drawingId": "${id}" } }
```
```json
{ "tool": "auto_polish_drawing", "arguments": { "drawingId": "${id}", "targetScore": 95 } }
```
```json
{ "tool": "save_drawing", "arguments": { "drawingId": "${id}", "asDraft": false } }
```
