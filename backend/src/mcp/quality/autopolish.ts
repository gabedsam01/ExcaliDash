/**
 * auto_polish_drawing — lint → score → repair in a loop until the scene passes
 * MCP_MIN_DRAWING_SCORE or MCP_MAX_REPAIR_ATTEMPTS is reached.
 */
import type { DrawingScore, ExcalidrawScene } from "../types";
import { repairScene } from "./repair";
import { scoreScene } from "./score";
import type { LintOptions } from "./lint";

export interface AutoPolishOptions {
  minimumScore: number;
  maxAttempts: number;
  lintOptions?: Partial<LintOptions>;
}

export interface AutoPolishStep {
  attempt: number;
  score: number;
  issues: number;
  applied?: string[];
}

export interface AutoPolishResult {
  scene: ExcalidrawScene;
  score: DrawingScore;
  passed: boolean;
  attempts: number;
  history: AutoPolishStep[];
}

export const autoPolish = (
  scene: ExcalidrawScene,
  options: AutoPolishOptions,
): AutoPolishResult => {
  const { minimumScore, maxAttempts, lintOptions = {} } = options;
  let current = scene;
  let result = scoreScene(current, minimumScore, lintOptions);
  const history: AutoPolishStep[] = [
    { attempt: 0, score: result.score, issues: result.issues.length },
  ];

  let attempts = 0;
  while (!result.passed && attempts < maxAttempts) {
    attempts += 1;
    const repaired = repairScene(current, lintOptions);
    const nextResult = scoreScene(repaired.scene, minimumScore, lintOptions);
    history.push({
      attempt: attempts,
      score: nextResult.score,
      issues: nextResult.issues.length,
      applied: repaired.applied,
    });
    // Stop early if a pass made no progress (avoid spinning).
    if (
      nextResult.score <= result.score &&
      repaired.applied.length === 0
    ) {
      current = repaired.scene;
      result = nextResult;
      break;
    }
    current = repaired.scene;
    result = nextResult;
  }

  return {
    scene: current,
    score: result,
    passed: result.passed,
    attempts,
    history,
  };
};
