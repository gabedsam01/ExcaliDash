#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-design-polisher skill.
 * Prints the exact MCP prompt this skill maps to and the canonical
 * tool-call sequence it performs, then exits 0. No external deps.
 */
'use strict';

const SKILL = 'excalidash-design-polisher';
const MCP_PROMPT = '/mcp__excalidash__excalidash_design_polisher';

const TOOL_SEQUENCE = [
  'mcp__excalidash__read_mcp_guide',
  'mcp__excalidash__get_drawing',
  'mcp__excalidash__score_drawing            # baseline: capture hardBlockers + mathematicalEvidence',
  'mcp__excalidash__auto_polish_drawing      # preserveSemantics=true, targetScore=95 -> repairPlan',
  'mcp__excalidash__lint_drawing',
  'mcp__excalidash__repair_drawing           # apply residual repairPlan items',
  'mcp__excalidash__score_drawing            # re-score; loop until >=95; rollback if lower',
  'mcp__excalidash__validate_architecture    # advisory legibility check',
  'mcp__excalidash__suggest_architecture_improvements',
  'mcp__excalidash__save_drawing             # only when score >= 95 (or explicit draft)',
  'mcp__excalidash__save_version             # note: "polish: <baseline> -> <final>"',
  'mcp__excalidash__get_drawing_url',
  'mcp__excalidash__export_drawing',
];

const INVARIANTS = [
  'score_drawing >= 95',
  'hardBlockers empty',
  'arrow-over-text intersections == 0',
  'no overlapping titles/headers/labels',
  'all content within viewport bounds with margin',
  'semantics unchanged (node/edge/label counts)',
  'secrets redacted to [REDACTED_*]',
];

function main() {
  console.log('skill: ' + SKILL);
  console.log('mcp_prompt: ' + MCP_PROMPT);
  console.log('');
  console.log('tool_call_sequence:');
  TOOL_SEQUENCE.forEach((t, i) => console.log('  ' + (i + 1) + '. ' + t));
  console.log('');
  console.log('loop: lint -> score -> repair until score >= 95 (rollback any pass that lowers score)');
  console.log('');
  console.log('save_gate_invariants:');
  INVARIANTS.forEach((inv) => console.log('  - ' + inv));
  process.exit(0);
}

main();
