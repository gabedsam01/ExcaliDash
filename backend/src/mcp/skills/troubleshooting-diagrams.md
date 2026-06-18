# Troubleshooting Diagrams (skill)

## Objective
Map decision flows and swimlane processes for debugging incidents. Produce
clear, legible diagrams that show how a problem is diagnosed: branching
decision points, escalation paths, and ownership across lanes (teams/systems).

## When to use
Use this skill when the user asks for:
- An incident response or on-call runbook flow.
- A decision tree ("if X then Y, else Z") for debugging a class of failures.
- A swimlane process showing handoffs between teams, services, or roles.
- Root-cause analysis or escalation flowcharts.

Prefer `create_diagram_from_prompt` for free-form requests; use
`create_from_template` when a flowchart/swimlane template fits.

## Expected input
- A description of the problem space (symptom, system, or incident type).
- Optional: known steps, decision conditions, actors/lanes, terminal states.
- Optional: a visual preset and target persona (engineers vs. stakeholders).

If lanes are not specified, infer 2-4 actors (e.g., User, On-call, Service,
Escalation). If decision conditions are vague, ask for the yes/no branches.

## Visual rules
- Direction: top-to-bottom for decision trees; left-to-right for swimlanes.
- Shapes: rectangles = actions/states, diamonds = decisions, rounded/ellipse
  = start/end terminals. Be consistent across the whole diagram.
- Every decision diamond has exactly the labeled outgoing edges it needs
  (e.g., "Yes"/"No", "Timeout", "Resolved"). Never leave an edge unlabeled.
- Swimlanes: one row/column per actor, aligned; arrows crossing a lane
  boundary represent a handoff and should be visually clean (no overlap).
- Use a single color per semantic role (decision, action, terminal, error).
  Error/failure terminals get a distinct warning color.
- Keep node text to a short imperative phrase; avoid sentences.
- Recommended presets: `technical-docs` (default) or `minimal-whiteboard`
  for review sessions; `dark-architecture` for ops dashboards.

## Logic rules
- Exactly one start terminal. At least one explicit end/terminal per path.
- No orphan nodes and no dangling edges; every node is reachable from start.
- Decision branches must be mutually exclusive and collectively exhaustive.
- Loops (retry, poll) must have an exit condition that reaches a terminal.
- Map failure/escalation paths explicitly; do not let error states dead-end.
- In swimlanes, each node lives in exactly one lane; handoffs cross lanes
  via a single directed edge.

## Recommended libraries
- **Flow Chart Symbols** — terminals, process boxes, decision diamonds,
  connectors. The primary library for this skill.
- **Data Flow** — for data stores, queues, and I/O when the flow touches
  pipelines or message paths.

Workflow: `search_libraries` ("flow chart", "data flow") ->
`inspect_library` -> `cache_library` -> `add_library_items_normalized`
(prefer normalized to keep sizing/styling consistent with the canvas).

## Mandatory validation
Run the quality flow before saving. This is not optional.
1. `lint_drawing` — fix structural warnings (orphans, overlaps, unlabeled
   decision edges).
2. `score_drawing` — returns 0-100.
3. If score < 95: `repair_drawing` and/or `auto_polish_drawing`, then
   re-run `score_drawing`. Repeat until score >= 95.
4. Only after `score_drawing` returns >= 95 AND `auto_polish_drawing` has
   been applied, call `save_drawing` as final.
5. Do not call `save_drawing` as final below 95. Use `asDraft: true` only
   if the user explicitly wants an intermediate save.

## Minimal examples
Generate a swimlane incident flow:

```json
{
  "tool": "create_diagram_from_prompt",
  "arguments": {
    "prompt": "Swimlane debugging flow for a 500-error incident with lanes User, On-call Engineer, Payments Service, Escalation. Include decision: 'Reproduced?' (Yes/No) and an explicit escalation path.",
    "diagramType": "swimlane",
    "preset": "technical-docs"
  }
}
```

Validate and save as final (only after score >= 95):

```json
{
  "tool": "score_drawing",
  "arguments": { "drawingId": "drw_123" }
}
```

```json
{
  "tool": "auto_polish_drawing",
  "arguments": { "drawingId": "drw_123", "preset": "technical-docs" }
}
```

```json
{
  "tool": "save_drawing",
  "arguments": { "drawingId": "drw_123", "name": "500-error incident flow" }
}
```
