/**
 * Visual tokens + architecture enforcement bundle (Part 4). Architecture/system
 * diagrams turn on the icon + legend + rich-shape gates (all warning-level, so
 * they penalize but never hard-block) and ship a constrained 3-hue palette.
 */
import type { LintOptions } from "../quality/lint";

/** Lint overrides that enforce a polished architecture diagram. */
export const ARCHITECTURE_LINT_OVERRIDES: Partial<LintOptions> = {
  requireIcons: true,
  requireLegend: true,
  expectRichArchitecture: true,
  libraryRequiredSeverity: "warning",
};

/** Constrained 3-hue palette for architecture (blue=app, amber=service, green=data). */
export const ARCHITECTURE_PALETTE = ["#a5d8ff", "#ffd8a8", "#b2f2bb"];

const ARCH_RE = /architect|c4|system.?design|micro.?service|deploy|infra|topology|data.?flow|saas|docker/i;

/** True when a diagramType/prompt reads as an architecture/system diagram. */
export const isArchitectureDiagram = (
  diagramType?: string | null,
  prompt?: string | null,
): boolean => ARCH_RE.test(`${diagramType ?? ""} ${prompt ?? ""}`);
