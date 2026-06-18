# Design Polisher — Worked Examples

These traces show real call sequences with concrete arguments. IDs are illustrative.

## Example 1 — Polishing a freshly generated diagram (87 -> 96)

Context: `create_diagram_from_prompt` produced a 9-node service map that scores 87. Two arrows cross labels and the rightmost node clips the viewport.

```
1) read_mcp_guide()
2) get_drawing({ "drawingId": "drw_8f2a" })
   -> 9 nodes, 11 arrows, bbox 0,0 -> 1480,720; viewport 1280x720
3) score_drawing({ "drawingId": "drw_8f2a" })
   -> { score: 87,
        hardBlockers: ["arrow-over-text:arr_3", "arrow-over-text:arr_7", "viewport-overflow:node_9"],
        mathematicalEvidence: { overlapAreaPx2: 0, arrowTextIntersections: 2, viewportFitRatio: 1.16, spacingVariance: 0.34 } }
4) auto_polish_drawing({ "drawingId": "drw_8f2a",
        "targetScore": 95, "preserveSemantics": true, "lockedIds": [] })
   -> repairPlan: [
        { id: "arr_3", defect: "arrow-over-text", action: "reroute", dx: 0, dy: -24 },
        { id: "arr_7", defect: "arrow-over-text", action: "reroute", dx: 0, dy: 18 },
        { id: "node_9", defect: "viewport-overflow", action: "translate", dx: -240, dy: 0 },
        { id: "node_4..node_9", defect: "spacing", action: "redistribute-x", gap: 64 } ],
      projectedScore: 96
5) lint_drawing({ "drawingId": "drw_8f2a" }) -> { errors: [], warnings: [] }
6) repair_drawing({ "drawingId": "drw_8f2a", "fixes": ["arr_3","arr_7","node_9"] })
   (auto_polish left these for explicit apply)
7) score_drawing({ "drawingId": "drw_8f2a" })
   -> { score: 96, hardBlockers: [],
        mathematicalEvidence: { overlapAreaPx2: 0, arrowTextIntersections: 0, viewportFitRatio: 0.94, spacingVariance: 0.05 } }
8) validate_architecture({ "drawingId": "drw_8f2a" }) -> { legible: true, suggestions: [] }
9) save_drawing({ "drawingId": "drw_8f2a" })
   save_version({ "drawingId": "drw_8f2a", "note": "polish: 87 -> 96" })
   get_drawing_url({ "drawingId": "drw_8f2a" }) -> https://excalidash.app/d/drw_8f2a
   export_drawing({ "drawingId": "drw_8f2a", "format": "png" })
```

Report: `Score 87 -> 96. Fixed: arrow-over-text (2), viewport-overflow (1), spacing. hardBlockers empty.`

## Example 2 — Rollback when a pass lowers the score

Context: A dense flowchart scores 91. An aggressive polish overshoots and collides headers, dropping to 88.

```
score_drawing -> 91, hardBlockers: ["header-overlap:hdr_phase2"]
auto_polish_drawing({ ..., "aggressiveness": "default" }) -> projectedScore 94
score_drawing -> 88   # WORSE than baseline
# Rollback:
#   restore pre-pass elements (kept from get_drawing snapshot)
auto_polish_drawing({ ..., "aggressiveness": "conservative", "lockedIds": ["hdr_phase1","hdr_phase2"] })
score_drawing -> 95, hardBlockers: []
save_drawing + save_version({ "note": "polish: 91 -> 95 (conservative)" })
```

Rule demonstrated: never accept a pass that lowers the score; revert and retry conservatively.

## Example 3 — Post-library-import cleanup with redaction

Context: After `add_library_items` dropped AWS icons, two icons overlap a node label and one text node contains a leaked key.

```
score_drawing -> 90, hardBlockers: ["label-overlap:icon_lambda/node_api"]
# redact before scoring final:
#   text "aws_secret_access_key=AKIA..." -> "aws_secret_access_key=[REDACTED_API_KEY]"
auto_polish_drawing({ ..., "preserveSemantics": true })
   -> repairPlan: [{ id: "icon_lambda", defect: "overlap", action: "snap-to-slot", slot: "node_api.icon" }]
repair_drawing({ "fixes": ["icon_lambda"] })
lint_drawing -> { errors: [], warnings: [] }
score_drawing -> 95, hardBlockers: []
save_drawing + save_version({ "note": "polish: 90 -> 95, icon snapped, key redacted" })
```

## Example 4 — Already at threshold

Context: Drawing already scores 97.

```
score_drawing -> 97, hardBlockers: []
# No polish needed. Confirm invariants, then save_version({ "note": "verified: 97" }).
```
Do not run `auto_polish_drawing` unnecessarily — a passing drawing should not be perturbed.
