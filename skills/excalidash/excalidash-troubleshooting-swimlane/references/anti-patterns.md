# Troubleshooting Swimlane — Anti-Patterns

Failure modes specific to incident/troubleshooting swimlanes, why each is wrong, and the fix. If
a draft trips any of these, repair before scoring closes. Each fix maps to a real lint code or a
`validate_architecture` check.

## Lanes & ownership

### 1. One lane (it's a flowchart, not a swimlane)
**Symptom**: every step lives in a single band; there is no ownership dimension.
**Why wrong**: a swimlane exists to show *who* handles each step. A single lane is a flowchart.
**Fix**: split into lanes by owner (User, Support, On-call Engineer, API, Worker, Escalation), or
switch to `excalidash-flowchart` if ownership genuinely does not matter.

### 2. A step straddling two lanes
**Symptom**: `ITEM_OUTSIDE_FRAME`; a process box sits on the divider between two lane bands.
**Why wrong**: an ambiguous owner — the reader cannot tell whose step it is; a hard blocker.
**Fix**: `repair_drawing` to move the step fully inside the owning lane's inner bounds (>= 16px
inset); if a step is genuinely shared, split it into a hand-off across two steps.

### 3. Multiple owners crammed into one lane
**Symptom**: "Support + Engineering" share a single band.
**Why wrong**: lanes lose their meaning; hand-offs become invisible.
**Fix**: one owner per lane; draw an explicit arrow when work hands off between lanes.

### 4. Lane title overlapped by the first step
**Symptom**: `FRAME_TITLE_OVERLAP`; the leftmost step sits on top of the lane name.
**Why wrong**: title bands must stay title-only; overlap is unreadable and a hard blocker.
**Fix**: reserve the top 40px of each lane for its title; start steps below the title band + inset.

## Decisions & branches

### 5. Decision drawn as a rectangle
**Symptom**: a branch point ("Transient?", "Bug?") is a plain process box.
**Why wrong**: readers can't see it's a branch; under `required` mode it's a policy violation.
**Fix**: use a decision-diamond glyph (Flow Chart Symbols) for every branch node.

### 6. Unlabelled or single-exit decisions
**Symptom**: a diamond with one outgoing arrow, or exits with no yes/no/category label.
**Why wrong**: a decision needs >= 2 labelled exits; `validate_architecture` flags it.
**Fix**: give every diamond at least two exits and label each ("yes"/"no", "transient"/"bug").

### 7. Branch lines overlapping each other
**Symptom**: `ARROW_TEXT_INTERSECTION` / `HIGH_DENSITY`; happy, retry and error lines share a lane
and cross over labels.
**Why wrong**: the paths become untraceable and a label gets overdrawn (hard blocker).
**Fix**: route each branch through its own >= 32px gutter; keep the happy path straight and bend
the error/retry/fallback lines into separate lanes.

## Paths & terminal states

### 8. Missing terminal state (a path just stops)
**Symptom**: an arrow ends in mid-air with no Resolved/Escalated/Dead-letter node.
**Why wrong**: the reader cannot tell how that path concludes; `validate_architecture` flags a
dangling step.
**Fix**: terminate every path with an explicit end node (Resolved / Escalated / Dead-letter /
Rolled back) using an end/terminator glyph.

### 9. Paths not separated (happy and error merged)
**Symptom**: the happy path and the error path collapse into one line so you cannot trace either.
**Why wrong**: this skill exists to separate happy path, retry/backoff, error, dead-letter,
fallback and escalation.
**Fix**: keep each path distinct end-to-end; tag them in the legend (happy / retry / error /
fallback / terminal) and color/route them separately.

### 10. Retry loop with no exit / no backoff bound
**Symptom**: a retry arrow loops forever with no "retries exhausted?" decision.
**Why wrong**: an infinite loop is not a runbook; there must be a dead-letter or escalation exit.
**Fix**: add a "Retries exhausted?" decision after the retry step; route the exhausted branch to a
dead-letter or escalation terminal.

### 11. Retry loop-back routed over a step
**Symptom**: `ARROW_TEXT_INTERSECTION`; the loop-back line crosses the retry step's label.
**Why wrong**: the label is overdrawn and unreadable (hard blocker).
**Fix**: route the return through a reserved retry gutter beneath the lane; move its label into the
side lane with 32px clearance.

### 12. No fallback / no escalation path
**Symptom**: only happy + retry; nothing for "still broken" or "out of SLA".
**Why wrong**: an incident flow must show what happens when automated recovery fails.
**Fix**: add a fallback (e.g. manual processing) and an escalation (page L2) path, each to its own
terminal.

## Step wording

### 13. Steps that are nouns, not verbs
**Symptom**: a step reads "Database" or "Logs" instead of an action.
**Why wrong**: a swimlane step is an action taken by the lane owner; nouns hide the behaviour.
**Fix**: make every step a clear verb phrase ("Check DB health", "Tail error logs", "Retry with
backoff").

## Layout, density & icons

### 14. Crowded lanes (HIGH_DENSITY)
**Symptom**: steps packed with < 48px gaps; no room for branch gutters.
**Why wrong**: branches cannot route cleanly and density penalties pile up.
**Fix**: give each lane vertical breathing room; >= 48px step gaps, >= 32px branch lanes; split a
busy lane across more height.

### 15. Content hugging the export edge
**Symptom**: `TEXT_NEAR_EDGE`; a leftmost trigger or a right-edge terminal touches the canvas bound.
**Fix**: keep all content >= 40px from canvas/export bounds.

### 16. Sub-16px labels on dense steps
**Symptom**: `SMALL_FONT`; step text shrunk to fit a crowded lane.
**Why wrong**: anything below 16px rendered is penalized; shrink-to-fit is not allowed.
**Fix**: keep all text >= 16px (lane titles >= 20px) and relayout so it fits with 16px padding.

### 17. Off-policy or over-detailed icons
**Symptom**: an icon from an arbitrary public library, or a busy multi-color glyph, lowers the
score (HIGH_DENSITY, preset clash).
**Why wrong**: violates `MCP_LIBRARY_MODE = curated`; noise hurts the score.
**Fix**: pull only from Flow Chart Symbols, Data Flow and Stick Figures; normalize stroke/fill;
reject anything that lowers the score and fall back to a primitive. Record the rejection.

## Quality loop

### 18. Skipping repair / accepting score < 95
**Symptom**: saving at 90 with a remaining penalty "because it reads fine".
**Why wrong**: repair is mandatory below 95 or with any blocker.
**Fix**: run the lint -> score -> repair loop until `score >= 95` and `hardBlockers == []`.

### 19. Keeping a repair/polish pass that lowered the score
**Symptom**: an `auto_polish_drawing` pass reflowed the lanes and dropped the score below the
checkpoint.
**Why wrong**: every pass must be monotonic-up or be rolled back.
**Fix**: restore the last `save_version` checkpoint and apply a smaller, targeted fix.

## Security

### 20. Live secret quoted in a runbook step
**Symptom**: a step shows a real bearer token, pager webhook token, or `postgres://app:<password>@db/main`.
**Why wrong**: swimlanes are exported and shared; a live secret leaks, and so does the transcript.
**Fix**: redact BEFORE the create call -> `Bearer [REDACTED_BEARER]`,
`?token=[REDACTED_WEBHOOK_SECRET]`, `postgres://app:[REDACTED_DATABASE_URL]@db/main`; re-scan the
export. Show the *concept* of the credential, never the value.

See `./checklist.md`, `./examples.md`, and the shared references under `../../_shared/references/`.
