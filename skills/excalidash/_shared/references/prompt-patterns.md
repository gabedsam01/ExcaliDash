# Prompt Patterns for Diagram Generation

Prompt-engineering patterns (adapted from DAIR.AI's Prompt Engineering Guide) applied
to driving the ExcaliDash tools toward a score >= 95. Each pattern below maps a general
technique to concrete diagram-generation moves.

## Context Engineering
Load only what the task needs into the working context, in priority order:
- The user's intent and the chosen preset (visual-system.md).
- The relevant pattern skeleton (architecture-patterns.md).
- The geometry constraints (geometry-rules.md) and library mode (library-policy.md).
Keep the scene model compact; reference shared docs instead of restating them. Strip
stale state between iterations so the model reasons over current geometry, not history.

## Prompt Chaining
Decompose a drawing into ordered sub-prompts, each consuming the prior output:
1. **Extract** nodes/edges/roles from the request.
2. **Choose** preset + pattern.
3. **Lay out** frames and cards on the grid.
4. **Connect** with arrows through gutters.
5. **Decorate** with curated icons (if allowed).
6. **Validate -> fix** until score >= 95.
Each step is small and checkable; a failure isolates to one link, not the whole draw.

## ReAct / Tool-Use
Interleave reasoning and tool calls: *think* (what is the structure and which
generator fits?) -> *act* (`create_diagram_from_prompt` / `apply_architecture_skill` /
`add_library_items_normalized`) -> *observe* (`get_drawing` / `lint_drawing`) -> *think*
again. Never batch blindly; observe geometry after structural changes so the next action
is grounded in the actual scene, not assumptions.

## Self-Evaluation
After generating, call `lint_drawing` then `score_drawing` and read the report as a critic
would: enumerate each blocker/penalty, hypothesize a cause, apply the minimal fix, re-score.
Treat the score as the objective; do not declare done until hard blockers are zero and score
>= 95. Prefer a targeted `repair_drawing` over a blanket `auto_polish_drawing` when you
understand the cause.

## RAG / Retrieval
Retrieve before generating: `search_libraries` + `list_templates` to ground the drawing in
existing curated assets and patterns rather than inventing shapes. Retrieve the matching
pattern skeleton and preset bundle so the output is consistent with prior diagrams.
`cache_library` retrieved packs so repeated concepts reuse the same vetted art.

## Code-Generation Prompts
When the source is code or a spec, prompt for structured extraction first
(modules, dependencies, layers, data stores), then map that structure to
`create_from_repo_analysis` (`analysis:{modules,entrypoints,database,services,integrations}`)
or `apply_architecture_skill`. Treat the diagram as compiled output of a structured
intermediate representation, not a freehand sketch — this keeps node naming aligned with
the codebase.

## Evaluation Prompts
Use an explicit rubric mirroring the quality bar: no ARROW_TEXT_INTERSECTION, no
FRAME_TITLE_OVERLAP, no ITEM_OUTSIDE_FRAME, no SMALL_FONT, density healthy, preset
consistent, secrets redacted. Score each criterion before export; an LLM-judge style
pass over the rendered scene catches issues the geometry validator cannot (e.g. unclear
labels, wrong pattern choice).

## Agent Workflows
For complex systems, run an agent loop: plan the diagram set (split via
`convert_diagram_type` into focused C4 / sequence / swimlane / data-flow views — see
architecture-patterns.md), generate each view as a sub-task, validate each independently,
then reconcile shared node names across views. Maintain a running record of used/rejected
library items and applied fixes so later views stay consistent. Stop only when every
view clears the bar and the set reads as one coherent system.

## Applying the Patterns Together
Default loop: **context-engineer** the inputs -> **retrieve** assets/patterns ->
**chain** through extract/layout/connect/decorate -> **ReAct** with observe-after-act ->
**self-evaluate** against the rubric -> **agent-reconcile** across views. This sequence
reliably reaches score >= 95 with zero blockers.
