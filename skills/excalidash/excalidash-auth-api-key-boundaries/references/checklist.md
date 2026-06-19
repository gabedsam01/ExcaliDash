# Auth & API-Key Boundaries — Pre-Save Checklist

Run this before saving any Auth & API-Key Boundaries drawing as final. Every box must be checked.

## Score & blockers
- [ ] `score_drawing({ minimumScore: 95 })` returns `>= 95`.
- [ ] `hardBlockers == []` (lint clean).
- [ ] No `ARROW_TEXT_INTERSECTION` — no edge crosses readable text; credential labels ride in side lanes.
- [ ] No `FRAME_TITLE_OVERLAP` — boundary-frame title and legend header stay title-only.
- [ ] No `ITEM_OUTSIDE_FRAME` — protected services fully inside the authenticated zone; clients fully
      in the public zone (intentional, not half-clipped).
- [ ] No `HIGH_DENSITY` in the boundary frame — control gutters >= 48px before icons.
- [ ] No `SMALL_FONT` — control names and edge labels legible after icon placement.
- [ ] No `TEXT_NEAR_EDGE` — all content >= 40px from canvas/export bounds.

## Boundary structure
- [ ] Exactly one boundary frame separates public zone from authenticated zone.
- [ ] The bearer/API-key check is an explicit node on the boundary (key verify + HMAC-at-rest compare).
- [ ] Scope / RBAC check present after key verification.
- [ ] Rate limit node present on the boundary.
- [ ] Audit log node present on the boundary.
- [ ] Rotation / revocation control attached to the key store (revoke invalidates the HMAC hash).
- [ ] Vault / secrets-manager holds the HMAC/JWT signing secret.
- [ ] No public-zone node reaches a protected service without crossing the gateway.
- [ ] Both the positive ("200 (scoped)") and negative ("401 / 403") cross-boundary edges are drawn.

## Validation
- [ ] `validate_architecture` clean: one boundary, services inside, no bypass.
- [ ] `suggest_architecture_improvements` shows no missing revocation / rate-limit / audit path.

## Libraries
- [ ] Curated packs only (Cloud Design Patterns, AWS Architecture Icons, Software Architecture); people
      from Stick Figures.
- [ ] Gateway, key/lock, throttle, audit and vault icons normalized to the preset (scale, aspect,
      stroke, fill); placed in correct slots.
- [ ] In `required` mode: gateway, vault, limiter and audit nodes use their curated icons (no primitive
      where a curated icon exists).
- [ ] Any icon that introduced `HIGH_DENSITY` or an arrow-lane collision was rejected.

## Secrets & redaction
- [ ] Every key/token reads `[REDACTED_API_KEY]` / `[REDACTED_BEARER]`; only the `exd_` prefix is literal.
- [ ] HMAC/JWT signing secret reads `[REDACTED_HMAC_SECRET]` / `[REDACTED_JWT_SECRET]`.
- [ ] Any connection string reads `postgres://app:[REDACTED_DATABASE_URL]@host/db`.
- [ ] No raw secret in any node label, edge label, version label, response, or export.
- [ ] Export re-scanned (SVG/PNG/JSON) as a backstop; redaction confirmed in the rendered output.

## Persist
- [ ] `save_version` checkpoint taken before the first repair (rollback target).
- [ ] `save_drawing` only after the loop converged; `save_version` checkpoints the accepted state.
