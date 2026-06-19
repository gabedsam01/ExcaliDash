# n8n Workflow Diagrammer — Anti-Patterns

Failure modes specific to an n8n / automation node graph, why each is wrong, and the fix. The first
group is what the lint/score engine catches directly; the rest are flow-content mistakes
`validate_architecture` / `suggest_architecture_improvements` catch. If a draft trips any of these,
repair before scoring closes.

## Lint / score engine blockers

### 1. Retry or `false` edge routed under a node title (ARROW_TEXT_INTERSECTION)
**Symptom**: a back-routed `false` branch or a `retry (3x)` self-loop crosses the title of the node it
arcs over; lint reports `ARROW_TEXT_INTERSECTION`.
**Why wrong**: the label and the node title are both unreadable; it is a hard blocker that caps the score
below 95.
**Fix**: `repair_drawing` to rebind the edge to a card side and route it through a dedicated >= 32px
gutter; move the `retry` / `false` label into the side lane beside the line, not under it.

### 2. Branch-output label overdrawn by its own edge (ARROW_TEXT_INTERSECTION)
**Symptom**: the `true` / `false` / `"premium"` label sits on top of the diamond's output arrow.
**Why wrong**: the label is the whole point of a branch; overdrawn, the path is ambiguous.
**Fix**: place each output label in the clear gutter beside its edge with 32px clearance; keep the
diamond and endpoints fixed.

### 3. Error / dead-letter lane spilling off the canvas (ITEM_OUTSIDE_FRAME)
**Symptom**: the dropped lower lane (error branch, dead-letter sink) extends past the canvas or frame
bound; lint reports `ITEM_OUTSIDE_FRAME` or `TEXT_NEAR_EDGE`.
**Why wrong**: a clipped node is ambiguous and a hard blocker; content flush to the edge looks cut off.
**Fix**: enlarge the canvas / frame or move the lane inward; keep all content >= 40px from the bounds.

### 4. Lane labels overlapping the title (FRAME_TITLE_OVERLAP)
**Symptom**: a "Happy path" / "Error lane" caption sits in the reserved top title band.
**Why wrong**: title bands stay title-only; overlap is unreadable and a hard blocker.
**Fix**: push lane captions below the title band, or drop them in favor of labeled edges.

### 5. Crowded node grid (HIGH_DENSITY)
**Symptom**: nodes packed with < 48px gaps; the six operational lanes share gutters; density penalties
pile up.
**Why wrong**: arrows cannot route cleanly and the graph reads as a tangle.
**Fix**: widen the layout — happy path across the center, each secondary path in its own >= 32px lane,
cards >= 48px apart.

### 6. Condition text shrunk below 16px (SMALL_FONT)
**Symptom**: a long IF condition is shrunk to fit inside a small diamond.
**Why wrong**: text below 16px is penalized and unreadable.
**Fix**: enlarge the diamond, shorten the condition to a label ("score >= 80?") and keep the detail in a
side note; never shrink-to-fit.

### 7. Edge labels hugging the export edge (TEXT_NEAR_EDGE)
**Symptom**: the far-right terminal or a fallback label sits within 40px of the canvas bound.
**Why wrong**: text near the edge reads as clipped and is penalized.
**Fix**: keep all content, including the rightmost terminal and the lowest lane, >= 40px from the bounds.

## Flow correctness (validate_architecture / suggest_architecture_improvements)

### 8. Branch drawn as a plain rectangle
**Symptom**: an IF / Switch / Filter is a rounded rectangle like every other node.
**Why wrong**: a fork must read as a fork; a box hides the branch and breaks the diamond convention.
**Fix**: use the **decision diamond** from Flow Chart Symbols; one input on the left, labeled outputs
leaving the other faces.

### 9. Unlabeled branch output
**Symptom**: a diamond's second edge has no label; `validate_architecture` flags an unlabeled output.
**Why wrong**: an unlabeled output is a content error, not a style nit — the reader cannot tell which
path is which.
**Fix**: label every output (`true`/`false`, the named Switch case, `keep`/`drop`).

### 10. Two triggers on one graph
**Symptom**: a Webhook *and* a Cron both feed the same chain as separate entries.
**Why wrong**: an n8n workflow has one trigger; two entries make the start ambiguous.
**Fix**: keep one trigger; if two real triggers exist, draw two workflows or merge them through an
explicit Merge node with one labeled entry.

### 11. Orphan / dangling node
**Symptom**: a node with no incoming edge (unreachable from the trigger) or a non-terminal node with no
outgoing edge.
**Why wrong**: a connected graph is the invariant; an orphan is dead art and a hard validation failure.
**Fix**: connect it into the flow or remove it; every node is reachable from the trigger and every
non-terminal has an outgoing edge.

### 12. Missing error branch on a failable node
**Symptom**: an HTTP Request / integration node has only a success path;
`suggest_architecture_improvements` reports no error handling.
**Why wrong**: real automations fail; an unhandled failure is a silent gap.
**Fix**: add a labeled `error` edge into a lower lane -> observability/notify -> dead-letter sink.

### 13. Retry loop with no exit to dead-letter
**Symptom**: a retry self-loop with no bound and no dead-letter sink for exhausted attempts.
**Why wrong**: an unbounded retry hides where exhausted work actually goes.
**Fix**: label the retry edge with its bound (`retry 3x, backoff`) and route exhausted retries to a
**dead-letter** store terminal.

### 14. Operational lanes tangled together
**Symptom**: the retry, error, and fallback edges share one gutter and cross the happy path.
**Why wrong**: the separation of happy / retry / error / dead-letter / observability / fallback is the
defining value of this skill; tangling it defeats the diagram.
**Fix**: give each path its own lane; keep the happy path straight across the center; route secondary
paths above/below without crossing it.

### 15. Switch case that goes nowhere
**Symptom**: a Switch output (`"default"`) dangles with no downstream node.
**Why wrong**: every case must resolve; a dangling case is an orphan output.
**Fix**: route every case to a node or a labeled terminal (even a NoOp).

## Node typing & icons

### 16. Integration node without its logo (curated/required mode)
**Symptom**: a "Slack" / "Gmail" / "Postgres" node is a plain box under `required` mode.
**Why wrong**: a branded integration should read at a glance; under `required` this is a policy violation.
**Fix**: drop the **Technology Logo** into the `inside-card-left` slot; normalize stroke/fill.

### 17. Off-policy or over-detailed icon
**Symptom**: an icon from an arbitrary public n8n-art library, or a busy multi-color glyph, lowers the
score (`HIGH_DENSITY`, preset clash).
**Why wrong**: violates `MCP_LIBRARY_MODE = curated`; noise hurts the score.
**Fix**: pull only from the curated packs (Flow Chart Symbols, Technology Logos, Data Flow); normalize;
reject anything that lowers the score and fall back to a primitive. Record the rejection.

### 18. Dead-letter sink drawn as a plain box
**Symptom**: the dead-letter terminal looks like any other process node.
**Why wrong**: the sink is a distinct store; conflating it hides where failed items land.
**Fix**: use a **Data Flow** data-store glyph in the `database-symbol` slot for the dead-letter sink.

## Direction & shape

### 19. Flow not reading left-to-right
**Symptom**: the trigger is in the middle or the chain wanders top-to-bottom.
**Why wrong**: the LR convention is the legibility contract for this skill.
**Fix**: set `direction: "LR"`; trigger far left, terminals far right, secondary lanes above/below.

### 20. Polish rounded a diamond into a rectangle
**Symptom**: `auto_polish_drawing` reshaped a decision diamond or dropped a branch-output / retry label.
**Why wrong**: polish must not change branch semantics.
**Fix**: restore the `save_version` checkpoint and re-run polish with the diamonds locked; verify labels
survived.

## Security

### 21. Live credential on a node card
**Symptom**: an HTTP node label shows a raw `Authorization: Bearer <token>` value, or a Postgres node
shows a raw `postgres://app:<password>@db/orders` connection string, or a Slack node shows a real API key.
**Why wrong**: workflow diagrams are exported and embedded; a live secret leaks.
**Fix**: redact BEFORE the create call -> `Authorization: Bearer [REDACTED_BEARER]` placeholder,
`postgres://app:[REDACTED_DATABASE_URL]@db/orders`, `[REDACTED_API_KEY]`; re-scan the export. Show the
*concept* of a credential, never the value.

## Quality loop

### 22. Skipping repair / accepting score < 95
**Symptom**: saving at 90 with a remaining penalty "because it looks fine".
**Why wrong**: repair is mandatory below 95 or with any blocker.
**Fix**: run the lint -> score -> repair loop until `score >= 95` and `hardBlockers == []`.

### 23. Keeping a repair/polish pass that lowered the score
**Symptom**: a polish pass reflowed the lanes and dropped the score below the checkpoint.
**Why wrong**: every pass must be monotonic-up or be rolled back.
**Fix**: restore the last `save_version` checkpoint and apply a smaller, targeted fix.

See `./checklist.md`, `./examples.md`, and the shared references under `../../_shared/references/`.
