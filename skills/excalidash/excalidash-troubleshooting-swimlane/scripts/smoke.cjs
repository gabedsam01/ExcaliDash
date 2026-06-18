#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-troubleshooting-swimlane skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this
 * skill maps to and the canonical plan-then-build tool-call sequence the skill performs,
 * so docs and the skill body can be diffed against one source of truth. No external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success, 1 if the documented sequence drifts.
 */
'use strict';

const SKILL = 'excalidash-troubleshooting-swimlane';
const MCP_PROMPT = '/mcp__excalidash__excalidash_troubleshooting_swimlane';

// Fixed diagram type / direction for this skill.
const DIAGRAM_TYPE = 'swimlane';
const DIRECTION = 'LR';

// Curated packs recommended for an incident/troubleshooting swimlane.
const RECOMMENDED_LIBRARIES = [
  'Flow Chart Symbols',
  'Data Flow',
  'Stick Figures',
];

// The distinct paths this skill must keep separated and traceable.
const PATHS = [
  'happy',
  'retry-backoff',
  'error',
  'dead-letter',
  'fallback',
  'escalation',
  'resolution',
];

// The three mutually exclusive create paths; exactly one runs per drawing.
const CREATE_PATHS = [
  'mcp__excalidash__convert_diagram_type',      // re-lane an existing incident flow -> swimlane (LR)
  'mcp__excalidash__create_diagram_from_prompt',// diagramType:"swimlane", direction:"LR", structure
  'mcp__excalidash__create_from_template',      // swimlane/flow templateId
];

// Canonical plan -> generate -> lint -> score -> repair -> validate -> save -> export sequence.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',               note: 'load presets, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__list_templates',               note: 'look for a swimlane/flow template (optional)' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',             note: 'curated: decision, start/end, process, actor' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',              note: 'vet candidates (aspect, stroke, fill, complexity)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                note: 'cache vetted glyphs' },
  { phase: 'generate', tool: 'mcp__excalidash__convert_diagram_type',         note: 'ONE-OF: re-lane an existing flow -> swimlane (LR)' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',   note: 'ONE-OF: diagramType:swimlane direction:LR with structure' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_template',         note: 'ONE-OF: swimlane/flow templateId' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized', note: 'decision diamonds, terminators, actor figures' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                 note: 'hardBlockers must end empty' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',                note: 'require score >= 95' },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',               note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',          note: 'after blockers clear; re-score for no regression' },
  { phase: 'validate', tool: 'mcp__excalidash__validate_architecture',        note: 'one lane per step, labelled exits, every path terminal' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                 note: 'persist accepted drawing ("<Incident> — Troubleshooting Swimlane")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                 note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',              note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',               note: 'PNG/SVG/JSON, redacted; re-scan bearer/webhook/db URL' },
];

const HARD_BLOCKERS = ['ARROW_TEXT_INTERSECTION', 'FRAME_TITLE_OVERLAP', 'ITEM_OUTSIDE_FRAME'];
const MIN_SCORE = 95;

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('diagram type   : ' + DIAGRAM_TYPE + ' (direction: ' + DIRECTION + ')');
  console.log('curated libs   : ' + RECOMMENDED_LIBRARIES.join(', '));
  console.log('paths          : ' + PATHS.join(', '));
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
  console.log('NOTE: prefer convert_diagram_type when an incident flowchart already exists.');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');
  console.log('NOTE: every step lives in exactly one lane; every path ends in an explicit terminal state.');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(DIAGRAM_TYPE === 'swimlane', 'diagram type must be swimlane');
  assert(DIRECTION === 'LR', 'direction must be LR');
  assert(MCP_PROMPT === '/mcp__excalidash__excalidash_troubleshooting_swimlane', 'mcp prompt must match registry name');
  assert(RECOMMENDED_LIBRARIES.length === 3, 'expected 3 recommended libraries');
  assert(RECOMMENDED_LIBRARIES.indexOf('Flow Chart Symbols') !== -1, 'Flow Chart Symbols must be recommended');
  assert(RECOMMENDED_LIBRARIES.indexOf('Stick Figures') !== -1, 'Stick Figures must be recommended');
  assert(PATHS.indexOf('happy') !== -1, 'must separate the happy path');
  assert(PATHS.indexOf('retry-backoff') !== -1, 'must separate the retry/backoff path');
  assert(PATHS.indexOf('dead-letter') !== -1, 'must separate the dead-letter path');
  assert(PATHS.indexOf('escalation') !== -1, 'must separate the escalation path');
  assert(CREATE_PATHS.length === 3, 'expected 3 mutually-exclusive create paths');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__convert_diagram_type') !== -1, 'convert_diagram_type must be a create path');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__create_diagram_from_prompt') !== -1, 'create_diagram_from_prompt must be a create path');
  assert(SEQUENCE.some((s) => s.phase === 'lint'), 'missing lint phase');
  assert(SEQUENCE.some((s) => s.phase === 'score'), 'missing score phase');
  assert(SEQUENCE.some((s) => s.phase === 'repair'), 'missing repair phase');
  assert(SEQUENCE.some((s) => s.phase === 'validate'), 'missing validate phase');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__add_library_items_normalized'), 'must place normalized library items');
  const generates = SEQUENCE.filter((s) => s.phase === 'generate');
  // 3 create paths + 1 library-placement step.
  assert(generates.length === 4, 'expected 3 create paths + 1 add-items step in generate phase');
  assert(HARD_BLOCKERS.length === 3, 'expected 3 hard blockers');
  assert(MIN_SCORE >= 95, 'min score must be >= 95');

  console.log('');
  console.log('OK');
  process.exit(0);
}

main();
