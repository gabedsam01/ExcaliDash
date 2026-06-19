# Security Architecture — pre-save checklist

Run this before `save_drawing` on any Security Architecture drawing. Do not save until every
box is checked.

## Score & blockers
- [ ] `score_drawing({ minimumScore: 95 })` returns `>= 95`.
- [ ] `hardBlockers == []`.
- [ ] No `ARROW_TEXT_INTERSECTION` — no boundary-crossing arrow sits under a control label.
- [ ] No `FRAME_TITLE_OVERLAP` — `public` / `dmz` / `private` frame titles stay title-only.
- [ ] No `ITEM_OUTSIDE_FRAME` — every node sits fully inside its zone frame.
- [ ] No `SMALL_FONT` — control labels (JWT, RBAC, CSRF, rate limit, audit) are >= 16px and fit.
- [ ] No `HIGH_DENSITY` — the DMZ band is breathable; controls spread, not crammed.
- [ ] No `TEXT_NEAR_EDGE` — all content >= 40px from canvas/export bounds.

## Security structure gates
- [ ] Three trust-boundary frames: `public`, `dmz`, `private`.
- [ ] An explicit auth gateway node lives in the DMZ.
- [ ] Every inbound arrow passes through the auth gateway — no public->private shortcut.
- [ ] Controls present and labelled: JWT/session, RBAC, CSRF, rate limit, audit log, secrets vault.
- [ ] Each data store carries a classification badge (public / internal / confidential / restricted).
- [ ] `validate_architecture` is clean: trust boundary present, gateway on the path, no infra->private bypass.
- [ ] `suggest_architecture_improvements` flags no missing mandatory control (audit / rate limit / vault).

## Redaction gates (mandatory)
- [ ] No raw JWT secret, API key, service-role key, db URL, bearer, webhook or proxy secret anywhere.
- [ ] Every literal secret is a `[REDACTED_<TYPE>]` placeholder, with surrounding shape preserved.
- [ ] The vault node shows `[REDACTED_*]` references, not resolved secrets.
- [ ] No detected secret echoed into the response, a note, a log, or a saved snapshot.
- [ ] The export was re-scanned for secrets after `export_drawing` (connection strings / vault paths).

## Library gates
- [ ] In `required` mode: every protected service has a lock, the vault has a key/vault icon, the
      audit node has an audit icon, each store has a classification badge.
- [ ] Every inserted item is normalized (scale, aspect, stroke, fill) to the dark-architecture preset.
- [ ] No icon introduced `HIGH_DENSITY` or sits in an arrow lane; rejected items recorded.
