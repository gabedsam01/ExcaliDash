/**
 * score_drawing — turn lint issues into a 0-100 quality score with a per-
 * dimension breakdown. Default passing bar is 95 (MCP_MIN_DRAWING_SCORE).
 */
import type {
  DrawingScore,
  ExcalidrawScene,
  LintIssue,
  QualityDimension,
  ScoreBreakdown,
} from "../types";
import { lintScene, type LintOptions } from "./lint";

const PENALTY: Record<LintIssue["severity"], number> = {
  error: 9,
  warning: 4,
  info: 1,
};

const DIMENSIONS: QualityDimension[] = [
  "layout",
  "containment",
  "connections",
  "spacing",
  "readability",
  "consistency",
  "structure",
];

const DIMENSION_WEIGHT: Record<QualityDimension, number> = {
  layout: 20,
  containment: 20,
  connections: 15,
  structure: 15,
  readability: 12,
  spacing: 10,
  consistency: 8,
};

const SUGGESTION: Record<string, string> = {
  TEXT_OVERFLOW: "Grow the card or shrink the label so text fits inside.",
  SMALL_CARD: "Increase the card to at least 120×56 px.",
  OVERLAP: "Separate overlapping shapes (increase spacing).",
  ARROW_UNBOUND: "Bind arrows to their start and end elements.",
  ITEM_OUTSIDE_FRAME: "Move the element inside its frame (or clear its frame).",
  OFF_GRID: "Snap elements to the grid.",
  SMALL_FONT: "Raise the font size to at least the readable minimum.",
  FRAME_NO_TITLE: "Give every frame a title.",
};

export const scoreIssues = (
  issues: LintIssue[],
  minimumScore: number,
): DrawingScore => {
  const totalPenalty = issues.reduce(
    (sum, issue) => sum + PENALTY[issue.severity],
    0,
  );
  const score = Math.max(0, Math.min(100, Math.round(100 - totalPenalty)));

  const breakdown: ScoreBreakdown[] = DIMENSIONS.map((dimension) => {
    const dimensionIssues = issues.filter((i) => i.dimension === dimension);
    const dimensionPenalty = dimensionIssues.reduce(
      (sum, i) => sum + PENALTY[i.severity],
      0,
    );
    return {
      dimension,
      score: Math.max(0, Math.min(100, Math.round(100 - dimensionPenalty * 1.2))),
      weight: DIMENSION_WEIGHT[dimension],
      issueCount: dimensionIssues.length,
    };
  });

  const repairSuggestions = Array.from(
    new Set(
      issues
        .filter((i) => i.repairable)
        .map((i) => SUGGESTION[i.code] ?? i.message),
    ),
  );

  return {
    score,
    passed: score >= minimumScore,
    minimumScore,
    issues,
    repairSuggestions,
    breakdown,
  };
};

export const scoreScene = (
  scene: ExcalidrawScene,
  minimumScore: number,
  overrides: Partial<LintOptions> = {},
): DrawingScore => scoreIssues(lintScene(scene, overrides), minimumScore);
