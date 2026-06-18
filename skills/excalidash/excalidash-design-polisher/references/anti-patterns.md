# Design Polisher — Anti-Patterns

Failure modes specific to the polish pass. Avoid all of these.

## Semantic drift while "polishing"
- ❌ Letting `auto_polish_drawing` or a manual `repair_drawing` add, delete, merge, or relabel nodes/edges.
- ✅ Always pass `preserveSemantics: true`. Diff node/edge counts before and after; if they differ, the pass is invalid — revert.

## Saving below threshold
- ❌ Calling `save_drawing` when `score_drawing` < 95 because "it looks fine".
- ✅ The 95 gate is mandatory. Only save below it when the user explicitly set `draft: true`, and record that waiver in the version note.

## Accepting a regression
- ❌ Keeping a polish pass whose new score is lower than the baseline because the `projectedScore` was higher.
- ✅ Trust the measured `score_drawing`, not `projectedScore`. If the measured score dropped, roll back and re-run with `aggressiveness: "conservative"`.

## Skipping the baseline
- ❌ Running `auto_polish_drawing` before ever calling `score_drawing`, leaving nothing to roll back to.
- ✅ Always `get_drawing` + `score_drawing` first to capture the snapshot and the baseline `mathematicalEvidence`.

## Treating warnings like blockers (or vice versa)
- ❌ Blocking the save on a cosmetic lint warning, or ignoring an error-level finding that maps to a `hardBlocker`.
- ✅ Resolve all error-level lint and all `hardBlockers`; warnings may remain only if they do not touch a blocker.

## Moving locked elements
- ❌ Repositioning a pinned title or legend that the user listed in `protectedElementIds`.
- ✅ Pass them as `lockedIds`; verify their geometry is byte-identical after the pass.

## Filling empty icon slots uninvited
- ❌ Pulling library icons into blank slots during a polish to "improve" the design.
- ✅ Polishing is pure layout. Flag empty slots in the report; only add icons if the user asks, and then only via `add_library_items_normalized`, re-scoring and reverting anything that lowers the score.

## Endless polish loop
- ❌ Re-running `auto_polish_drawing` indefinitely while the score oscillates.
- ✅ Stop after two consecutive passes with no net gain; report the residual `hardBlockers` instead of churning.

## Leaking secrets through imported text
- ❌ Saving a polished drawing whose text still contains a JWT, API key, DB URL, or bearer token from generation/import.
- ✅ Scan every `text` element and apply `[REDACTED_*]` before the final save.

## Perturbing a passing drawing
- ❌ Running a full polish on a drawing already scoring >= 95, introducing new overlaps.
- ✅ If the baseline already passes, confirm invariants and save a verified version; do not polish.
