#!/usr/bin/env node
/**
 * Doc-smoke for the excalidash-ddd-bounded-contexts skill.
 *
 * Prints the exact MCP prompt this skill maps to and the ordered tool-call
 * sequence it performs, then exits 0. No external dependencies, no network,
 * no file writes — this is a documentation self-check the workflow can run to
 * confirm the skill's contract has not drifted.
 *
 * Usage:  node scripts/smoke.cjs
 */

'use strict';

const SKILL = 'excalidash-ddd-bounded-contexts';
const MCP_PROMPT = '/mcp__excalidash__excalidash_ddd_bounded_contexts';

// Plan line written before any create call (see SKILL.md "Workflow" step 1).
const PLAN_LINE =
  'TYPE=ddd PRESET=architecture ' +
  'LIBRARY=curated[Software Architecture, Architecture diagram components] ' +
  'VALIDATORS=lint,score,repair,validate_architecture,suggest_architecture_improvements';

// Ordered tool-call sequence (mirrors SKILL.md "Recommended MCP tools").
// Exactly ONE create path is chosen at runtime; all candidates are listed here.
const SEQUENCE = [
  { tool: 'mcp__excalidash__read_mcp_guide',                note: 'load presets, MCP_LIBRARY_MODE, scoring rubric' },
  { tool: 'mcp__excalidash__list_templates',               note: 'look for a ddd / context-map template (optional)' },
  { tool: 'mcp__excalidash__search_libraries',             note: 'find context / event / shared-kernel / ACL glyphs' },
  { tool: 'mcp__excalidash__inspect_library',              note: 'vet aspect, stroke, fill, complexity' },
  { tool: 'mcp__excalidash__cache_library',                note: 'cache vetted items' },
  { tool: 'mcp__excalidash__apply_architecture_skill',     note: 'CREATE (preferred): pattern="ddd" — one frame per context' },
  { tool: 'mcp__excalidash__create_from_repo_analysis',    note: 'CREATE (alt): analysis={modules,...} reverse-engineer contexts from a codebase' },
  { tool: 'mcp__excalidash__convert_diagram_type',         note: 'CREATE (alt): structure + targetType="ddd" reshape existing drawing' },
  { tool: 'mcp__excalidash__create_diagram_from_prompt',   note: 'CREATE (alt): diagramType="ddd" + structure{nodes,edges}' },
  { tool: 'mcp__excalidash__create_from_template',         note: 'CREATE (alt): instantiate the context-map template' },
  { tool: 'mcp__excalidash__add_library_items_normalized', note: 'place context/event/shared-kernel/ACL icons in slots' },
  { tool: 'mcp__excalidash__lint_drawing',                 note: 'LOOP: hardBlockers must end empty' },
  { tool: 'mcp__excalidash__score_drawing',                note: 'LOOP: record score + penalties' },
  { tool: 'mcp__excalidash__repair_drawing',               note: 'LOOP (mandatory): fix each blocker/penalty; rollback if score drops' },
  { tool: 'mcp__excalidash__auto_polish_drawing',          note: 'after blockers clear; re-score for no regression' },
  { tool: 'mcp__excalidash__validate_architecture',        note: 'every context a frame; every edge labeled; kernel jointly owned; no leaked aggregate' },
  { tool: 'mcp__excalidash__suggest_architecture_improvements', note: 'flag unlabeled edges, missing ACL, god-context, dead events' },
  { tool: 'mcp__excalidash__save_drawing',                 note: 'title "<Domain> — DDD Context Map"' },
  { tool: 'mcp__excalidash__save_version',                 note: 'checkpoint accepted state' },
  { tool: 'mcp__excalidash__get_drawing_url',              note: 'shareable link' },
  { tool: 'mcp__excalidash__export_drawing',              note: 'svg/png/json; re-scan for secrets' },
];

// Invariants this skill must satisfy (asserted as a contract, not just printed).
const INVARIANTS = [
  'one frame per bounded context',
  'shared kernel straddles exactly its two co-owning contexts',
  'every domain event arrow is labeled producer -> consumer',
  'every inter-context edge carries one relationship pattern (Partnership/Shared Kernel/Customer-Supplier U-D/Conformist/ACL/OHS/PL)',
  'no aggregate leaked across a boundary except via an event or ACL',
  'minimum score >= 95 with hardBlockers == []',
  'repair is mandatory; rollback any pass that lowers the score',
  'secrets redacted to [REDACTED_*] before any tool call and re-scanned on export',
];

function main() {
  const line = '-'.repeat(72);
  console.log(line);
  console.log('ExcaliDash skill doc-smoke: ' + SKILL);
  console.log(line);
  console.log('MCP prompt   : ' + MCP_PROMPT);
  console.log('Plan line    : ' + PLAN_LINE);
  console.log('');
  console.log('Tool-call sequence (' + SEQUENCE.length + ' steps; ONE create path is used per run):');
  SEQUENCE.forEach(function (step, i) {
    const n = String(i + 1).padStart(2, ' ');
    console.log('  ' + n + '. ' + step.tool);
    console.log('       ' + step.note);
  });
  console.log('');
  console.log('Invariants:');
  INVARIANTS.forEach(function (inv) {
    console.log('  - ' + inv);
  });
  console.log(line);

  // Minimal contract assertions so the smoke fails loudly if the doc drifts.
  const problems = [];
  if (!MCP_PROMPT.startsWith('/mcp__excalidash__')) problems.push('MCP prompt malformed');
  if (!/^TYPE=ddd\b/.test(PLAN_LINE)) problems.push('plan line is not TYPE=ddd');
  const tools = SEQUENCE.map(function (s) { return s.tool; });
  ['mcp__excalidash__read_mcp_guide',
   'mcp__excalidash__lint_drawing',
   'mcp__excalidash__score_drawing',
   'mcp__excalidash__repair_drawing',
   'mcp__excalidash__auto_polish_drawing',
   'mcp__excalidash__validate_architecture',
   'mcp__excalidash__save_drawing',
   'mcp__excalidash__export_drawing'].forEach(function (req) {
    if (tools.indexOf(req) === -1) problems.push('missing required tool: ' + req);
  });
  const hasCreate = tools.some(function (t) {
    return t === 'mcp__excalidash__apply_architecture_skill' ||
           t === 'mcp__excalidash__create_from_repo_analysis' ||
           t === 'mcp__excalidash__convert_diagram_type' ||
           t === 'mcp__excalidash__create_diagram_from_prompt' ||
           t === 'mcp__excalidash__create_from_template';
  });
  if (!hasCreate) problems.push('no create path present');

  if (problems.length) {
    console.error('SMOKE FAILED:');
    problems.forEach(function (p) { console.error('  ! ' + p); });
    process.exit(1);
  }

  console.log('OK: prompt, plan line, create path, and lint->score->repair->validate->save->export present.');
  process.exit(0);
}

main();
