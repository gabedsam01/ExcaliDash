# Visual Lint & Repair Loop — Anti-Patterns

Failure modes specific to the iterative lint -> score -> repair loop. Avoid all of these.

## Fixing many defect classes in one pass
- ❌ Calling `repair_drawing` for arrows, headers, AND spacing in a single pass, so a score change can't be attributed.
- ✅ One defect class per pass. Re-lint and re-score between classes so each delta is measurable and reversible.

## Keeping a regressing pass
- ❌ Accepting a pass whose pass-end score is lower than the pass-start score because "it's almost there".
- ✅ Roll back any pass measured lower than where it started. Restore the per-pass snapshot, then narrow
  the repair to a single element id or move to the next defect class.

## No per-pass snapshot
- ❌ Running `repair_drawing` without first snapshotting the current elements, leaving nothing to revert to.
- ✅ Snapshot (and record `passStartScore`) at the start of every pass — not just at the baseline.

## Skipping the baseline
- ❌ Entering the loop before ever calling `score_drawing`, so there is no floor to compare against.
- ✅ `get_drawing` + `score_drawing` first. The baseline is the floor the final result must never drop below.

## Trusting the projected score
- ❌ Treating `auto_polish_drawing`'s `projectedScore` (or a repair's expected gain) as the result.
- ✅ Only the measured `score_drawing` counts. If the measured score dropped, roll back regardless of projection.

## Endless / oscillating loop
- ❌ Re-running passes indefinitely while the score bounces between, say, 91 and 93.
- ✅ Stop at `maxPasses` (default 4) or after two consecutive passes with no net gain. Try one
  `auto_polish_drawing` convergence assist; if still stuck, report the residual `hardBlockers` instead of churning.

## Routing arrows over text to "save space"
- ❌ Letting a repair push an arrow segment across a label to shorten it.
- ✅ Rebind arrow endpoints to card sides and route through a >=32px gutter. `ARROW_TEXT_INTERSECTION` is a hard blocker.

## Semantic drift while repairing
- ❌ A repair that merges two nodes, drops an edge, or relabels a connector to reduce clutter.
- ✅ Always `preserveSemantics: true`. Diff node/edge counts before and after each pass; if they differ, the pass is invalid — revert.

## Moving locked elements
- ❌ A redistribute pass nudging a pinned title or legend the user listed in `protectedElementIds`.
- ✅ Pass them as `lockedIds`; verify their geometry is byte-identical after every pass.

## Saving below threshold
- ❌ Calling `save_drawing` at 92 because "the worst overlaps are gone".
- ✅ The 95 gate is mandatory. Only save below it when the user explicitly set `draft: true`, and record the waiver in the version note.

## Polishing a passing drawing
- ❌ Running repair passes on a drawing already at >= 95 with empty `hardBlockers`, introducing new defects.
- ✅ If the baseline already passes, confirm invariants and save a verified version; do not loop.

## Filling icon slots mid-loop
- ❌ Pulling library icons into empty slots during cleanup to "improve" the look.
- ✅ This loop is pure layout. Flag empty slots in the report; only add icons on explicit request, via
  `add_library_items_normalized`, re-scoring and reverting anything that lowers the score.

## Leaking secrets through existing text
- ❌ Saving a cleaned drawing whose text still contains a JWT, API key, service-role key, DB URL, or bearer token.
- ✅ Scan every `text` element and apply the correct `[REDACTED_*]` placeholder before the final save; re-scan before export.
