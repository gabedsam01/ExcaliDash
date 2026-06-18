# Visual Lint & Repair Loop — Worked Examples

These traces show real, per-pass call sequences with concrete arguments. IDs and metrics are
illustrative. The defining feature is the **explicit loop**: one defect class per pass, re-score after
each pass, roll back any pass that lowers the score.

## Example 1 — Tangled service map, three passes (78 -> 96)

Context: A 10-node service map looks messy: four arrows cross labels, two parallel arrows share a lane,
and the legend header overlaps the top row. Baseline score 78.

```
1) read_mcp_guide()
2) get_drawing({ "drawingId": "drw_aa12" })
   -> 10 nodes, 14 arrows, 1 legend; bbox 0,0 -> 1620,880; viewport 1440x900
   (keep these elements as the rollback snapshot)
3) score_drawing({ "drawingId": "drw_aa12" })
   -> { score: 78,
        hardBlockers: ["ARROW_TEXT_INTERSECTION:arr_2","ARROW_TEXT_INTERSECTION:arr_5",
                       "ARROW_TEXT_INTERSECTION:arr_9","ARROW_TEXT_INTERSECTION:arr_11"],
        mathematicalEvidence: { overlapAreaPx2: 3200, arrowTextIntersections: 4,
                                viewportFitRatio: 1.08, spacingVariance: 0.41 } }

--- PASS 1: defect class ARROW_TEXT_INTERSECTION ---
4) lint_drawing({ "drawingId": "drw_aa12" })
   -> errors: [ARROW_TEXT_INTERSECTION x4, HIGH_DENSITY, FRAME_TITLE_OVERLAP:hdr_legend]
5) score_drawing -> 78   # passStartScore = 78 (snapshot taken)
6) repair_drawing({ "drawingId": "drw_aa12",
        "defectClass": "ARROW_TEXT_INTERSECTION",
        "fixes": ["arr_2","arr_5","arr_9","arr_11"],
        "preserveSemantics": true, "lockedIds": [] })
   -> rebound endpoints to card sides; routed through a 32px gutter
7) score_drawing -> 84   # > 78, keep pass
   mathematicalEvidence: { arrowTextIntersections: 0, overlapAreaPx2: 3200, viewportFitRatio: 1.08 }

--- PASS 2: defect class FRAME_TITLE_OVERLAP ---
4) lint_drawing -> errors: [FRAME_TITLE_OVERLAP:hdr_legend, HIGH_DENSITY, TEXT_NEAR_EDGE]
5) score_drawing -> 84   # passStartScore = 84
6) repair_drawing({ "drawingId": "drw_aa12", "defectClass": "FRAME_TITLE_OVERLAP",
        "fixes": ["hdr_legend"], "preserveSemantics": true })
   -> pushed legend content below the 40px title band + 16px inset
7) score_drawing -> 91   # > 84, keep pass; hardBlockers: []

--- PASS 3: defect class HIGH_DENSITY + TEXT_NEAR_EDGE (viewport) ---
4) lint_drawing -> warnings: [HIGH_DENSITY (gap 28px < 48px), TEXT_NEAR_EDGE:node_10]
5) score_drawing -> 91   # passStartScore = 91
6) repair_drawing({ "drawingId": "drw_aa12", "defectClass": "spacing",
        "action": "redistribute", "minGap": 48, "viewportMargin": 40,
        "preserveSemantics": true })
   -> redistributed columns to 48px gaps; pulled node_10 inside the 40px margin
7) score_drawing -> 96   # >= 95 AND hardBlockers empty -> EXIT LOOP
   mathematicalEvidence: { overlapAreaPx2: 0, arrowTextIntersections: 0,
                           viewportFitRatio: 0.93, spacingVariance: 0.06 }

8) save_drawing({ "drawingId": "drw_aa12" })
   save_version({ "drawingId": "drw_aa12", "note": "lint-repair: 78 -> 96 (3 passes)" })
   get_drawing_url({ "drawingId": "drw_aa12" }) -> https://excalidash.app/d/drw_aa12
   export_drawing({ "drawingId": "drw_aa12", "format": "svg" })
```

Report: `score 78 -> 84 -> 91 -> 96 (3 passes). Cleared: ARROW_TEXT_INTERSECTION(4),
FRAME_TITLE_OVERLAP, HIGH_DENSITY, TEXT_NEAR_EDGE. hardBlockers empty. arrow-over-text: 0.`

## Example 2 — A pass lowers the score; roll back and narrow (88 -> 95)

Context: Dense flowchart, baseline 88. A bulk spacing repair over-spreads the canvas and clips a node,
dropping the score.

```
score_drawing -> 88   # passStartScore (snapshot taken)
lint_drawing -> warnings: [HIGH_DENSITY (multiple gaps < 48px)]
repair_drawing({ "defectClass": "spacing", "action": "redistribute", "minGap": 64 })  # too aggressive
score_drawing -> 85   # < 88 -> ROLL BACK this pass (restore per-pass snapshot)

# Narrow the repair to the two tightest pairs only:
repair_drawing({ "defectClass": "spacing", "action": "redistribute",
                 "fixes": ["proc_3/proc_4","proc_6/proc_7"], "minGap": 48 })
score_drawing -> 95   # >= 95, hardBlockers: [] -> EXIT
save_drawing + save_version({ "note": "lint-repair: 88 -> 95 (2 passes, 1 rollback)" })
```

Rule demonstrated: trust the measured score, not the projection; revert any regressing pass and narrow.

## Example 3 — Stalls just below 95; auto_polish convergence assist (90 -> 95)

Context: After two manual passes the score plateaus at 90 with only minor spacing variance left.

```
# ... passes 1-2 cleared all hard blockers, score 82 -> 90, then no net gain ...
score_drawing -> 90, hardBlockers: []   # stalled below 95
auto_polish_drawing({ "drawingId": "drw_cc77", "targetScore": 95,
                      "preserveSemantics": true, "aggressiveness": "conservative" })
score_drawing -> 95   # convergence assist worked; if it had dropped below 90, roll it back
save_drawing + save_version({ "note": "lint-repair: 82 -> 95 (2 passes + auto_polish)" })
export_drawing({ "format": "svg" })
```

## Example 4 — Already clean; confirm and stop

Context: Drawing already scores 97 with empty `hardBlockers`.

```
get_drawing -> ...
score_drawing -> 97, hardBlockers: []
# No loop needed. Confirm invariants (arrow-over-text 0, no header overlaps, viewport fit) and
# save_version({ "note": "verified: 97" }). Do NOT run repair passes on a passing drawing.
```

## Example 5 — Redacting a leaked key before the final save

Context: While looping, a `text` node reads `service_role_key=<service-role JWT>`. Geometry passes reach 96.

```
# during pass review, before save:
#   "service_role_key=<service-role JWT>" -> "service_role_key=[REDACTED_SERVICE_ROLE]"
score_drawing -> 96, hardBlockers: []   # redaction is text-only, layout score unchanged
# re-scan serialized scene before export (backstop)
save_drawing + save_version({ "note": "lint-repair: 80 -> 96 (3 passes), service-role key redacted" })
export_drawing({ "format": "svg" })
```
