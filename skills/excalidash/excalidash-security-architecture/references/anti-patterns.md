# Security Architecture — anti-patterns

Each failure below is either caught by the lint/score engine or by
`validate_architecture` / `suggest_architecture_improvements`. Every entry names the
mistake and its fix.

## Security-specific mistakes

- **Public talking straight to the data store.** A user/internet node connects directly to
  Postgres or a private service with no boundary in between. `validate_architecture` flags
  the frontend->DB / public->private shortcut. **Fix:** route the arrow through the DMZ auth
  gateway; the only inbound path into `private` is via an authenticated control.

- **Auth implied but not drawn.** The diagram assumes "of course there's auth" but no auth
  gateway node exists on the path. `validate_architecture` reports a missing boundary control.
  **Fix:** add an explicit Auth Gateway node in the DMZ and bind every inbound edge through it.

- **No audit log / no rate limit / no vault.** `suggest_architecture_improvements` surfaces
  these as missing mandatory controls for a defensive view. **Fix:** add an Audit Log node in
  `private`, a rate-limit label on the gateway, and a Secrets Vault node that the services read
  credentials from.

- **A literal secret in a label.** A real JWT signing key, `sk-...` API key, service-role token,
  or a `postgres://user:<password>@host/db` string pasted into a node/edge label or note. The server
  redacts on output, but you must never let it reach a tool argument. **Fix:** redact at input to
  `[REDACTED_<TYPE>]` (e.g. `postgres://app:[REDACTED_DATABASE_URL]@db/main`); show the concept,
  not the value.

- **Echoing a detected secret back.** Repeating a secret you just redacted into the chat response,
  a note, a log line, or a saved snapshot (transcript-leak). **Fix:** fail closed — never echo the
  original; the redacted placeholder is the only form that leaves memory.

- **Unclassified data stores.** Stores drawn with no classification, so a reader can't tell which
  hold confidential data. **Fix:** add a classification badge (public / internal / confidential /
  restricted) to every store.

- **Crossing the boundary outside the gateway.** A side arrow sneaks from DMZ to a private service
  bypassing the auth node (e.g. "admin tool -> DB"). **Fix:** route it through the gateway too, or
  show it explicitly as an out-of-band break-glass path with its own control label — never silently.

- **Offensive framing.** Annotating "how to bypass the WAF" or attacker steps. This skill is
  defensive. **Fix:** show controls and boundaries; describe what each control prevents, not how to
  defeat it.

- **Two perimeters on one canvas.** Merging two systems' trust boundaries to "save space" produces
  HIGH_DENSITY and an ambiguous boundary. **Fix:** one security view per system; split and say so.

## General geometry mistakes (caught by score_drawing)

- **Arrow routed over a control label** instead of through a zone gutter ->
  `ARROW_TEXT_INTERSECTION` (hard blocker). **Fix:** rebind endpoints to card sides; route through
  the >= 32px lane between zones; move the label into the side lane with 16px clearance.

- **Content pushed into a zone frame's title band** -> `FRAME_TITLE_OVERLAP` (hard blocker).
  **Fix:** start children below the reserved 40px title band plus the 16px inset.

- **A node poking across its zone frame edge** -> `ITEM_OUTSIDE_FRAME` (hard blocker). **Fix:**
  enlarge the frame or move the node fully inside the inner bounds.

- **Long control label shrunk below 16px** -> `SMALL_FONT` penalty. **Fix:** raise the font and
  relayout so it fits with 16px padding; abbreviate the label, not the type size.

- **DMZ crammed with WAF + gateway + rate limit + CSRF in a tight band** -> `HIGH_DENSITY` penalty.
  **Fix:** increase gaps (cards >= 48px), stack controls vertically, or use a control sub-frame.

- **Content flush to the canvas edge** -> `TEXT_NEAR_EDGE` penalty. **Fix:** keep >= 40px margin.

- **Saving below 95 "because it looks fine."** Always run lint -> score -> repair -> auto_polish
  first; only `save_drawing` once `score >= 95` and `hardBlockers == []`.

See `../_shared/references/geometry-rules.md` and `../_shared/references/security-redaction.md`.
