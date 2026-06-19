#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-n8n-workflow-diagrammer skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this
 * skill maps to and the canonical plan-then-build tool-call sequence the skill performs,
 * so docs and the skill body can be diffed against one source of truth. No external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success, 1 if the documented sequence drifts.
 */
'use strict';

const SKILL = 'excalidash-n8n-workflow-diagrammer';
const MCP_PROMPT = '/mcp__excalidash__excalidash_n8n_workflow_diagrammer';

// Fixed type/direction for this skill.
const DIAGRAM_TYPE = 'flowchart';
const DIRECTION = 'LR';

// Curated packs recommended for an n8n / automation node graph.
const RECOMMENDED_LIBRARIES = [
  'Flow Chart Symbols',
  'Technology Logos',
  'Data Flow',
];

// The operational paths that must each read in their own separated lane.
const OPERATIONAL_PATHS = [
  'happy',
  'retry',
  'error',
  'dead-letter',
  'observability',
  'fallback',
];

// The three mutually exclusive create paths; exactly one runs per drawing.
const CREATE_PATHS = [
  'mcp__excalidash__create_diagram_from_prompt', // diagramType:"flowchart", direction:"LR" (preferred)
  'mcp__excalidash__convert_diagram_type',       // reshape an existing/imported n8n scene -> flowchart
  'mcp__excalidash__create_from_template',        // templateId:"n8n-workflow"
];

// Canonical plan -> generate -> lint -> score -> repair -> validate -> save -> export sequence.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',               note: 'load presets, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__list_templates',               note: 'look for an n8n/automation template (optional)' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',             note: 'curated: flow symbols, integration logos, data store' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',              note: 'vet candidates (aspect, stroke, fill, complexity)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                note: 'cache vetted icons' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',   note: 'ONE-OF: diagramType:flowchart direction:LR (preferred)' },
  { phase: 'generate', tool: 'mcp__excalidash__convert_diagram_type',         note: 'ONE-OF: reshape existing/imported n8n scene -> flowchart' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_template',         note: 'ONE-OF: templateId:n8n-workflow' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized', note: 'integration logos, decision diamonds, dead-letter store' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                 note: 'hardBlockers must end empty' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',               note: 'require score >= 95' },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',              note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',         note: 'after blockers clear; re-score for no regression' },
  { phase: 'validate', tool: 'mcp__excalidash__validate_architecture',       note: 'one trigger, connected graph, every diamond output labeled' },
  { phase: 'validate', tool: 'mcp__excalidash__suggest_architecture_improvements', note: 'flag missing error/dead-letter path, dangling node, two triggers' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                note: 'persist accepted drawing ("<Workflow> — n8n Automation Flow")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',             note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',              note: 'SVG/PNG/excalidraw, redacted; re-scan webhook secret/bearer/API keys' },
];

const HARD_BLOCKERS = ['ARROW_TEXT_INTERSECTION', 'FRAME_TITLE_OVERLAP', 'ITEM_OUTSIDE_FRAME'];
const MIN_SCORE = 95;

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('diagram type   : ' + DIAGRAM_TYPE + ' (direction: ' + DIRECTION + ')');
  console.log('curated libs   : ' + RECOMMENDED_LIBRARIES.join(', '));
  console.log('paths          : ' + OPERATIONAL_PATHS.join(', '));
  console.log('min score      : ' + MIN_SCORE + ' (zero hard blockers)');
  console.log('hard blockers  : ' + HARD_BLOCKERS.join(', '));
  console.log('create paths   : ' + CREATE_PATHS.join(', '));
  console.log('');
  console.log('## Plan -> build -> quality-loop sequence');
  SEQUENCE.forEach(function (step, i) {
    const n = String(i + 1).padStart(2, ' ');
    console.log(n + '. [' + step.phase + '] ' + step.tool + '  -- ' + step.note);
  });
  console.log('');
  console.log('NOTE: the three generate create paths are ONE-OF; exactly one create path runs per drawing.');
  console.log('NOTE: prefer create_diagram_from_prompt({ diagramType:"flowchart", direction:"LR" }).');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');
  console.log('NOTE: one trigger LEFT; branches are labeled diamonds; happy/retry/error/dead-letter/observability/fallback each in their own lane.');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(DIAGRAM_TYPE === 'flowchart', 'diagram type must be flowchart');
  assert(DIRECTION === 'LR', 'direction must be LR');
  assert(RECOMMENDED_LIBRARIES.length === 3, 'expected 3 recommended libraries');
  assert(RECOMMENDED_LIBRARIES.indexOf('Flow Chart Symbols') !== -1, 'Flow Chart Symbols must be recommended');
  assert(RECOMMENDED_LIBRARIES.indexOf('Technology Logos') !== -1, 'Technology Logos must be recommended');
  assert(OPERATIONAL_PATHS.length === 6, 'expected 6 operational paths');
  ['happy', 'retry', 'error', 'dead-letter', 'observability', 'fallback'].forEach((p) => {
    assert(OPERATIONAL_PATHS.indexOf(p) !== -1, 'missing operational path: ' + p);
  });
  assert(CREATE_PATHS.length === 3, 'expected 3 mutually-exclusive create paths');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__create_diagram_from_prompt') !== -1, 'create_diagram_from_prompt must be a create path');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__convert_diagram_type') !== -1, 'convert_diagram_type must be a create path');
  assert(SEQUENCE.some((s) => s.phase === 'lint'), 'missing lint phase');
  assert(SEQUENCE.some((s) => s.phase === 'score'), 'missing score phase');
  assert(SEQUENCE.some((s) => s.phase === 'repair'), 'missing repair phase');
  assert(SEQUENCE.some((s) => s.phase === 'validate'), 'missing validate phase');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__add_library_items_normalized'), 'must place normalized library items');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__suggest_architecture_improvements'), 'must review architecture improvements');
  const generates = SEQUENCE.filter((s) => s.phase === 'generate');
  // 3 create paths + 1 library-placement step.
  assert(generates.length === 4, 'expected 3 create paths + 1 add-items step in generate phase');
  // Every tool in the sequence must be a real mcp__excalidash__ tool.
  SEQUENCE.forEach((s) => assert(/^mcp__excalidash__[a-z_]+$/.test(s.tool), 'non-real tool name: ' + s.tool));
  assert(MIN_SCORE >= 95, 'min score must be >= 95');

  console.log('');
  console.log('OK');
  process.exit(0);
}

main();
