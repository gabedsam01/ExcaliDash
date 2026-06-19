# Pre-save checklist — AI & MCP Architecture

Run this before saving any AI & MCP Architecture drawing as final. Every box must be
checked; a single unchecked gate means do NOT save.

## Score & blockers
- [ ] `score_drawing` >= 95.
- [ ] `hardBlockers == []`.
- [ ] No `ARROW_TEXT_INTERSECTION` — no arrow crosses a card or edge label.
- [ ] No `FRAME_TITLE_OVERLAP` — nothing sits in the boundary frame's top 40px title band.
- [ ] No `ITEM_OUTSIDE_FRAME` — server nodes fully inside the boundary; host + LLM fully outside.
- [ ] No `SMALL_FONT` — all labels (incl. tool-group counts) render >= 16px.
- [ ] No `HIGH_DENSITY` — card gaps >= 48px, lane gutters >= 32px; registry is 5 group rows.
- [ ] No `TEXT_NEAR_EDGE` — all content >= 40px from canvas/export bounds.

## Structure (the point of this skill)
- [ ] Four lanes present: client (host + LLM), transport, server (auth -> registry ->
      services), backend (storage + library cache).
- [ ] Transport, auth and storage are THREE distinct nodes (auth not merged into transport).
- [ ] The bearer / API-key (`exd_`) gate is an explicit node/edge labeled "verifies Bearer exd_ key".
- [ ] The external host AND the LLM are OUTSIDE the trust-boundary frame.
- [ ] Storage (PostgreSQL) is reached only through a service — no client -> storage edge.
- [ ] The 25-tool registry is summarized as Core 9 / Libraries 5 / Quality 4 / Architecture 4 /
      Templates 3, not 25 cells.
- [ ] One labeled edge per hop; no unnecessary crossings.
- [ ] `validate_architecture` clean: separation confirmed, LLM outside boundary.

## Libraries (per `MCP_LIBRARY_MODE`)
- [ ] Mode read first; in **required** mode, PostgreSQL uses a database-symbol and the
      transport/auth/registry/service cards carry server/service glyphs.
- [ ] Items pulled only from curated packs: Software Architecture, Technology Logos, Cloud/DevOps.
- [ ] Every item normalized (scale, aspect, stroke, fill) and matched to the preset.
- [ ] No icon introduces HIGH_DENSITY or lands in an arrow lane; rejected items recorded.

## Secrets
- [ ] No raw secret anywhere (bearer/API key, db URL, service-role, JWT, token, webhook, proxy).
- [ ] Bearer shown as `Bearer exd_[REDACTED_API_KEY]`; db URL as
      `postgres://exd:[REDACTED_DATABASE_URL]@db:5432/excalidash`.
- [ ] Export re-scanned as a backstop; transcript-pasted secrets redacted on input.

## Process
- [ ] One create path used (apply_architecture_skill `pattern:"mcp"` preferred).
- [ ] lint -> score -> repair loop closed BEFORE save; auto_polish ran after blockers cleared.
- [ ] `save_drawing` then `save_version` (checkpoint), then `get_drawing_url` + `export_drawing`.
