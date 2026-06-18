# Diagram Director — Anti-Patterns

What goes wrong when the orchestrator skips planning or the quality loop. Each item gives
the failure, why it hurts, and the correct move.

## Classification & planning

### Drawing before classifying
**Failure**: jumping straight to `create_diagram_from_prompt` without choosing a type.
**Why it hurts**: a login "flow" rendered as a flowchart hides the time ordering that a
sequence diagram makes obvious; an architecture rendered as a flow loses layering.
**Fix**: always write the plan line (`TYPE/PRESET/LIBRARY/VALIDATORS`) first.

### Cramming two types into one canvas
**Failure**: "show the system AND a login request" drawn as one mixed picture.
**Why it hurts**: HIGH_DENSITY, unreadable, neither a clean C4 nor a clean sequence.
**Fix**: pick the PRIMARY type, draw it, and offer the secondary as a separate view
(e.g. a C4 Container plus a sequence diagram), cross-referenced by shared node names.

### Mixing presets in one drawing
**Failure**: half the cards use an architecture preset, half a process preset.
**Why it hurts**: inconsistent stroke/fill/roughness reads as unfinished.
**Fix**: one preset per drawing, chosen in the plan and never changed mid-build.

### Calling multiple create paths
**Failure**: `create_from_template` then `create_diagram_from_prompt` on the same scene.
**Why it hurts**: duplicated/overlapping geometry, ambiguous `drawingId`, density spikes.
**Fix**: choose exactly ONE create path per drawing.

## Quality loop

### Treating lint or score as optional
**Failure**: generating and saving without `lint_drawing` / `score_drawing`.
**Why it hurts**: ships ARROW_TEXT_INTERSECTION or FRAME_TITLE_OVERLAP to the user.
**Fix**: lint -> score is mandatory after every structural change.

### Skipping repair when score < 95
**Failure**: accepting a 90 because "it looks fine".
**Why it hurts**: 95 is the bar; below it there is a known, fixable defect.
**Fix**: `repair_drawing` is mandatory whenever score < 95 or any blocker exists; loop
until `score >= 95` and `hardBlockers == []`.

### Shipping a repair that lowered the score
**Failure**: a repair drops the score from 96 to 92 and you keep it.
**Why it hurts**: the "fix" was a regression.
**Fix**: ROLLBACK to the last `save_version` checkpoint and apply a smaller, targeted fix.

### Reaching for auto_polish before blockers are clear
**Failure**: running `auto_polish_drawing` while ITEM_OUTSIDE_FRAME still exists.
**Why it hurts**: polish optimizes spacing/alignment, not structural blockers; it can mask
the real problem or move it.
**Fix**: clear all hardBlockers via `repair_drawing` first, THEN polish, then re-score.

### Skipping validate_architecture for c4/security/dataflow
**Failure**: a geometry-clean C4 with an orphan container, or a security diagram where a
flow never crosses a trust boundary.
**Why it hurts**: the picture is pretty but structurally wrong.
**Fix**: run `validate_architecture` for these types and fix structural findings.

## Libraries

### Ignoring MCP_LIBRARY_MODE
**Failure**: inserting icons when mode is `off`, or using primitives where `required`
demands a curated icon.
**Why it hurts**: policy violation and inconsistency across drawings.
**Fix**: read the mode first; honor off / curated / required exactly.

### Pulling from arbitrary public libraries
**Failure**: importing an off-policy icon because it looked nice.
**Why it hurts**: clashes with the preset, breaks the palette, lowers the score.
**Fix**: search only the recommended curated packs (Software Architecture, Flow Chart
Symbols, C4 Architecture, Data Flow); if the concept is absent, draw a primitive.

### Inserting un-normalized icons
**Failure**: `add_library_items` raw instead of `add_library_items_normalized`.
**Why it hurts**: wrong scale/stroke/color, stretched aspect, overlaps text.
**Fix**: always normalize to the slot's target box, preserve aspect, match preset style.

### Keeping an icon that lowers the score
**Failure**: an icon causes HIGH_DENSITY or collides with an arrow lane but stays.
**Why it hurts**: decoration beats clarity — the opposite of the goal.
**Fix**: reject it, record why, and use a primitive.

## Secrets

### Redacting after generation
**Failure**: passing a raw `JWT_SECRET` or `postgres://user:<password>@host/db` into the prompt,
planning to clean it later.
**Why it hurts**: the secret is already in the scene model, logs, and possibly the export.
**Fix**: redact BEFORE the create call and re-scan the export as a backstop.

### Echoing a detected secret in the response
**Failure**: telling the user "I redacted your key sk-...".
**Why it hurts**: leaks the secret into the response/transcript.
**Fix**: never echo the value; report only the typed placeholder used.

See ../../_shared/references/geometry-rules.md, ../../_shared/references/library-policy.md,
and ../../_shared/references/security-redaction.md.
