/**
 * run_repair_loop — a deterministic, server-driven quality loop (NOT model
 * self-grading). Each round applies geometry repair (autoPolish), style
 * normalization, and icon injection, then re-scores. The best scene is kept and
 * any non-improving round is rolled back, so the loop never returns worse than
 * its input and always terminates (maxRounds).
 *
 * Screenshot/visual scoring runs out-of-process (score_drawing_visual, fed by
 * the e2e Playwright capture); this in-process loop uses geometry + style.
 */
import type { DrawingScore, ExcalidrawScene } from "../types";
import { scoreScene } from "./score";
import { autoPolish } from "./autopolish";
import { styleNormalize } from "./styleFix";
import type { LintOptions } from "./lint";
import { injectConceptIcons } from "../generate/iconInjection";

export interface RepairLoopOptions {
  minimumScore?: number;
  maxRounds?: number;
  maxGeometryAttempts?: number;
  lintOverrides?: Partial<LintOptions>;
  injectIcons?: boolean;
  normalizeStyle?: boolean;
}

export interface RepairLoopStep {
  round: number;
  score: number;
  issues: number;
  applied?: string[];
}

export interface RepairLoopResult {
  scene: ExcalidrawScene;
  score: DrawingScore;
  passed: boolean;
  rounds: number;
  applied: string[];
  history: RepairLoopStep[];
  notes: string[];
}

export const runRepairLoop = (
  scene: ExcalidrawScene,
  opts: RepairLoopOptions = {},
): RepairLoopResult => {
  const min = opts.minimumScore ?? 95;
  const maxRounds = opts.maxRounds ?? 4;
  const overrides = opts.lintOverrides ?? {};

  let best = scene;
  let bestScore = scoreScene(best, min, overrides);
  const applied = new Set<string>();
  const history: RepairLoopStep[] = [
    { round: 0, score: bestScore.score, issues: bestScore.issues.length },
  ];
  const notes = [
    "Server-driven loop (geometry + style). Rendered visual scoring runs out-of-process via score_drawing_visual.",
  ];

  let rounds = 0;
  while (!bestScore.passed && rounds < maxRounds) {
    rounds += 1;
    let candidate = best;
    const roundApplied: string[] = [];

    const polished = autoPolish(candidate, {
      minimumScore: min,
      maxAttempts: opts.maxGeometryAttempts ?? 6,
      lintOptions: overrides,
    });
    if (polished.attempts > 0 && polished.score.score > scoreScene(candidate, min, overrides).score) {
      roundApplied.push("GEOMETRY_REPAIR");
    }
    candidate = polished.scene;

    if (opts.normalizeStyle !== false) {
      const styled = styleNormalize(candidate);
      candidate = styled.scene;
      roundApplied.push(...styled.applied);
    }

    if (opts.injectIcons !== false) {
      const inj = injectConceptIcons(candidate, {
        minimumScore: min,
        lintOverrides: overrides,
      });
      if (inj.injected > 0) {
        candidate = inj.scene;
        roundApplied.push("INJECT_MISSING_ICON");
      }
    }

    const candScore = scoreScene(candidate, min, overrides);
    history.push({
      round: rounds,
      score: candScore.score,
      issues: candScore.issues.length,
      applied: roundApplied,
    });

    if (candScore.score > bestScore.score) {
      best = candidate;
      bestScore = candScore;
      for (const a of roundApplied) applied.add(a);
    } else {
      break; // no improvement — keep the best snapshot and stop
    }
  }

  return {
    scene: best,
    score: bestScore,
    passed: bestScore.passed,
    rounds,
    applied: [...applied],
    history,
    notes,
  };
};
