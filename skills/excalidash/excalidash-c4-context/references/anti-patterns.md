# C4 Context — Anti-Patterns

What goes wrong when a System Context (Level 1) diagram drifts into other C4 levels, skips the
quality loop, or mishandles libraries/secrets. Each item gives the failure, why it hurts, and
the correct move.

## Scope & level

### Leaking internal containers into a context view
**Failure**: drawing the web app, API, and database *inside* the central system.
**Why it hurts**: that is Level 2 (Container), not Level 1. The context view loses its single
purpose — showing scope, actors, and integrations — and becomes a cluttered half-container diagram.
**Fix**: keep the central system as ONE opaque box. If internals are requested, hand off to the
C4 Container skill (Level 2).

### More than one central system
**Failure**: two "central" systems side by side because both seemed in scope.
**Why it hurts**: a context diagram is *about one system*. Two centers make every relationship
ambiguous and crowd the canvas.
**Fix**: pick the one system in scope and draw the other as an external system, OR produce a
separate context diagram per system (or a landscape view), cross-referenced by name.

### Relationships that bypass the central system
**Failure**: drawing an edge directly between two external systems (e.g. Stripe -> Mainframe).
**Why it hurts**: in a context diagram every relationship is *to or from the central system*;
external-to-external links are out of scope and mislead the reader.
**Fix**: only draw edges anchored to the central system. Drop the rest.

### Unlabeled or vague relationships
**Failure**: bare arrows, or labels like "uses" everywhere.
**Why it hurts**: the value of a context diagram is the verbs ("makes payments using", "sends
e-mail via"); generic labels carry no information.
**Fix**: give each edge a short directed phrase describing the interaction.

## Quality loop

### Treating lint or score as optional
**Failure**: generating and saving without `lint_drawing` / `score_drawing`.
**Why it hurts**: ships an ARROW_TEXT_INTERSECTION (a relationship label buried under its line)
or a FRAME_TITLE_OVERLAP on the legend.
**Fix**: lint -> score is mandatory after every structural change.

### Skipping repair when score < 95
**Failure**: accepting a 91 because "the boxes are all there".
**Why it hurts**: 95 is the bar; below it there is a known, fixable defect (usually crowded
external systems or a label collision).
**Fix**: `repair_drawing` is mandatory whenever score < 95 or any blocker exists; loop until
`score >= 95` and `hardBlockers == []`.

### Keeping a repair/polish that lowered the score
**Failure**: a polish pass drops the score from 96 to 93 and you keep it.
**Why it hurts**: the "fix" was a regression.
**Fix**: ROLLBACK to the last `save_version` checkpoint and apply a smaller, targeted nudge.

### Skipping validate_architecture
**Failure**: a geometry-clean context diagram with an orphan external system nobody connects to.
**Why it hurts**: the picture is pretty but structurally wrong — an unconnected node implies a
relationship that was never drawn.
**Fix**: run `validate_architecture`; every actor and external system must connect to the center.

## Visual hierarchy

### Central system not visually dominant
**Failure**: the central system is the same size/fill as the external systems.
**Why it hurts**: the reader cannot tell what the diagram is *about* at a glance.
**Fix**: make the central system larger / more saturated; style external systems with a lighter
fill so they read as "outside".

### Missing or ambiguous legend
**Failure**: no legend, or a legend that does not distinguish person / system / external system.
**Why it hurts**: with three node kinds and similar shapes, the reader can't decode the diagram.
**Fix**: include a legend in a corner keying exactly person / system / external system.

## Libraries

### Ignoring MCP_LIBRARY_MODE
**Failure**: inserting icons when mode is `off`, or drawing a primitive person when `required`.
**Why it hurts**: policy violation and inconsistency across drawings.
**Fix**: read the mode first; honor off / curated / required exactly.

### Pulling logos from arbitrary public libraries
**Failure**: importing an off-policy brand logo because it looked nicer than the curated one.
**Why it hurts**: clashes with the architecture preset, breaks the palette, lowers the score.
**Fix**: use only **C4 Architecture**, **Stick Figures**, and **Software Logos**. If a vendor
has no curated logo, draw a plain external-system box and label it.

### Inserting un-normalized icons
**Failure**: `add_library_items` raw instead of `add_library_items_normalized`.
**Why it hurts**: wrong scale/stroke/color, stretched logos, person icons overlapping edge labels.
**Fix**: always normalize to the slot's target box (48x48 `actor`), preserve aspect, match preset.

### Keeping an icon that lowers the score
**Failure**: a vendor logo causes HIGH_DENSITY in the external-system column but stays.
**Why it hurts**: decoration beats clarity — the opposite of the goal.
**Fix**: reject it, record why, and fall back to a labeled box.

## Secrets

### Redacting after generation
**Failure**: passing a raw `postgres://user:<password>@host/db` or a Slack webhook token into the
context prompt, planning to clean it later.
**Why it hurts**: the secret is already in the scene model, logs, and possibly the export.
**Fix**: redact BEFORE the create call (`[REDACTED_DATABASE_URL]`, `[REDACTED_WEBHOOK_SECRET]`)
and re-scan the export as a backstop.

### Echoing a detected secret in the response
**Failure**: telling the user "I redacted your webhook xoxb-...".
**Why it hurts**: leaks the secret into the response/transcript.
**Fix**: never echo the value; report only the typed placeholder used.

See ../../_shared/references/geometry-rules.md, ../../_shared/references/library-policy.md,
../../_shared/references/security-redaction.md, and ../../_shared/references/architecture-patterns.md.
