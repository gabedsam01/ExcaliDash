#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-diagram-director skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this
 * skill maps to and the canonical plan-then-build tool-call sequence the skill performs,
 * so docs and the skill body can be diffed against one source of truth. No external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success.
 */
'use strict';

const SKILL = 'excalidash-diagram-director';
const MCP_PROMPT = '/mcp__excalidash__excalidash_diagram_director';

// One diagram type must be chosen first.
const DIAGRAM_TYPES = ['flow', 'c4', 'sequence', 'security', 'dataflow'];

// Curated packs recommended for this orchestrator.
const RECOMMENDED_LIBRARIES = [
  'Software Architecture',
  'Flow Chart Symbols',
  'C4 Architecture',
];

// Canonical plan -> generate -> lint -> score -> repair -> validate -> save -> export sequence.
// Each step: the tool and what it contributes. The create step is ONE-OF.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',                 note: 'load presets, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__list_templates',                 note: 'match a template to the chosen type (optional)' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',               note: 'curated packs, if libraries apply' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',                note: 'vet candidate icons' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                  note: 'cache vetted icons' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',     note: 'ONE-OF create path (prompt-driven)' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_template',           note: 'ONE-OF create path (template-driven)' },
  { phase: 'generate', tool: 'mcp__excalidash__convert_diagram_type',           note: 'ONE-OF create path (reshape existing)' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized',   note: 'place normalized icons into slots' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                   note: 'hardBlockers must end empty' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',                  note: 'require score >= 95' },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',                 note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',            note: 'after blockers clear; re-score for no regression' },
  { phase: 'validate', tool: 'mcp__excalidash__validate_architecture',          note: 'c4 / security / dataflow correctness' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                   note: 'persist accepted drawing' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                   note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',                note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',                 note: 'excalidraw/svg/png, redacted; re-scan for secrets' },
];

const HARD_BLOCKERS = ['ARROW_TEXT_INTERSECTION', 'FRAME_TITLE_OVERLAP', 'ITEM_OUTSIDE_FRAME'];
const MIN_SCORE = 95;

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('diagram types  : ' + DIAGRAM_TYPES.join(', '));
  console.log('curated libs   : ' + RECOMMENDED_LIBRARIES.join(', '));
  console.log('min score      : ' + MIN_SCORE + ' (zero hard blockers)');
  console.log('hard blockers  : ' + HARD_BLOCKERS.join(', '));
  console.log('');
  console.log('## Plan -> build -> quality-loop sequence');
  SEQUENCE.forEach(function (step, i) {
    const n = String(i + 1).padStart(2, ' ');
    console.log(n + '. [' + step.phase + '] ' + step.tool + '  -- ' + step.note);
  });
  console.log('');
  console.log('NOTE: the three generate steps are ONE-OF; exactly one create path runs per drawing.');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(DIAGRAM_TYPES.length === 5, 'expected 5 diagram types');
  assert(RECOMMENDED_LIBRARIES.length === 3, 'expected 3 recommended libraries');
  assert(SEQUENCE.some((s) => s.phase === 'lint'), 'missing lint phase');
  assert(SEQUENCE.some((s) => s.phase === 'score'), 'missing score phase');
  assert(SEQUENCE.some((s) => s.phase === 'repair'), 'missing repair phase');
  assert(SEQUENCE.filter((s) => s.phase === 'generate' &&
    (s.tool.indexOf('create') !== -1 || s.tool.indexOf('convert') !== -1)).length >= 3,
    'expected at least 3 create/convert paths');
  assert(MIN_SCORE >= 95, 'min score must be >= 95');

  // Every tool named in the sequence must be one of the 25 real MCP tools.
  const REAL_TOOLS = [
    'read_mcp_guide', 'create_drawing', 'get_drawing', 'update_drawing', 'save_drawing',
    'save_version', 'get_drawing_url', 'export_drawing', 'create_diagram_from_prompt',
    'search_libraries', 'inspect_library', 'cache_library', 'add_library_items',
    'add_library_items_normalized', 'lint_drawing', 'score_drawing', 'repair_drawing',
    'auto_polish_drawing', 'validate_architecture', 'apply_architecture_skill',
    'create_from_repo_analysis', 'suggest_architecture_improvements', 'list_templates',
    'create_from_template', 'convert_diagram_type',
  ];
  assert(REAL_TOOLS.length === 25, 'expected exactly 25 real MCP tools');
  SEQUENCE.forEach((s) => {
    const bare = s.tool.replace('mcp__excalidash__', '');
    assert(REAL_TOOLS.indexOf(bare) !== -1, 'unknown tool in sequence: ' + s.tool);
  });

  console.log('');
  console.log('OK');
  process.exit(0);
}

main();
