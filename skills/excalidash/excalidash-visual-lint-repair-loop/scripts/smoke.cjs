#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-visual-lint-repair-loop skill.
 * Prints the exact MCP prompt this skill maps to and the canonical
 * tool-call sequence (including the iterative loop body) it performs,
 * then exits 0. No external deps.
 */
'use strict';

const SKILL = 'excalidash-visual-lint-repair-loop';
const MCP_PROMPT = '/mcp__excalidash__excalidash_visual_lint_repair_loop';

const SETUP_SEQUENCE = [
  'mcp__excalidash__read_mcp_guide',
  'mcp__excalidash__get_drawing              # snapshot elements for rollback; note count + bbox',
  'mcp__excalidash__score_drawing            # baseline: floor + hardBlockers + mathematicalEvidence',
];

const LOOP_BODY = [
  'mcp__excalidash__lint_drawing             # enumerate defects, hard blockers first',
  'mcp__excalidash__score_drawing            # passStartScore; snapshot per-pass rollback point',
  'mcp__excalidash__repair_drawing           # ONE defect class/pass; preserveSemantics=true, lockedIds',
  'mcp__excalidash__score_drawing            # pass end: if < passStartScore -> roll back this pass',
];

const FINALIZE_SEQUENCE = [
  'mcp__excalidash__auto_polish_drawing      # optional convergence assist if stalled below 95',
  'mcp__excalidash__save_drawing             # only when score >= 95 (or explicit draft)',
  'mcp__excalidash__save_version             # note: "lint-repair: <baseline> -> <final> (<n> passes)"',
  'mcp__excalidash__get_drawing_url',
  'mcp__excalidash__export_drawing           # svg snapshot',
];

const LOOP_RULE =
  'loop: lint -> score -> repair -> score, ONE defect class per pass; ' +
  'repeat until score >= 95 AND hardBlockers empty, or maxPasses (default 4), ' +
  'or two passes with no net gain; rollback any pass that lowers the measured score.';

const INVARIANTS = [
  'score_drawing >= 95',
  'hardBlockers empty (no ARROW_TEXT_INTERSECTION / FRAME_TITLE_OVERLAP / ITEM_OUTSIDE_FRAME)',
  'arrow-over-text intersections == 0',
  'no overlapping titles/headers/labels',
  'all content within viewport bounds (40px margin, viewportFitRatio <= 1.0)',
  'final score never below baseline (every regressing pass rolled back)',
  'semantics unchanged (node/edge/label counts)',
  'secrets redacted to [REDACTED_*]',
];

function printList(list, indent) {
  list.forEach((t, i) => console.log(indent + (i + 1) + '. ' + t));
}

function main() {
  console.log('skill: ' + SKILL);
  console.log('mcp_prompt: ' + MCP_PROMPT);
  console.log('');
  console.log('setup:');
  printList(SETUP_SEQUENCE, '  ');
  console.log('');
  console.log('loop_body (repeats per pass):');
  printList(LOOP_BODY, '  ');
  console.log('');
  console.log('finalize:');
  printList(FINALIZE_SEQUENCE, '  ');
  console.log('');
  console.log(LOOP_RULE);
  console.log('');
  console.log('save_gate_invariants:');
  INVARIANTS.forEach((inv) => console.log('  - ' + inv));
  process.exit(0);
}

main();
