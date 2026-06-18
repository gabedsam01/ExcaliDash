#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-c4-container skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this
 * skill maps to and the canonical plan-then-build tool-call sequence the skill performs,
 * so docs and the skill body can be diffed against one source of truth. No external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success, 1 if the documented sequence drifts.
 */
'use strict';

const SKILL = 'excalidash-c4-container';
const MCP_PROMPT = '/mcp__excalidash__excalidash_c4_container';

// Fixed type/level for this skill.
const DIAGRAM_TYPE = 'c4';
const LEVEL = 'container';

// Curated packs recommended for a C4 container view.
const RECOMMENDED_LIBRARIES = [
  'C4 Architecture',
  'Software Architecture',
  'Database/Data Platform',
];

// The four mutually exclusive create paths; exactly one runs per drawing.
const CREATE_PATHS = [
  'mcp__excalidash__convert_diagram_type',     // expand an existing C4 context drawing -> c4_container
  'mcp__excalidash__apply_architecture_skill', // pattern:"c4"
  'mcp__excalidash__create_diagram_from_prompt',
  'mcp__excalidash__create_from_template',      // templateId:"c4-container"
];

// Canonical plan -> generate -> lint -> score -> repair -> validate -> save -> export sequence.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',               note: 'load presets, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__list_templates',               note: 'look for a c4-container template (optional)' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',             note: 'curated: container, API/service, queue, database, logos' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',              note: 'vet candidates (aspect, stroke, fill, complexity)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                note: 'cache vetted icons' },
  { phase: 'generate', tool: 'mcp__excalidash__convert_diagram_type',         note: 'ONE-OF: expand existing context -> c4_container' },
  { phase: 'generate', tool: 'mcp__excalidash__apply_architecture_skill',     note: 'ONE-OF: pattern:c4 (boundary+grid+legend)' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',   note: 'ONE-OF: diagramType:c4 with explicit container structure' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_template',         note: 'ONE-OF: templateId:c4-container' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized', note: 'container glyph, database-symbol, queue, logos, actor' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                 note: 'hardBlockers must end empty' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',               note: 'require score >= 95' },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',              note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',         note: 'after blockers clear; re-score for no regression' },
  { phase: 'validate', tool: 'mcp__excalidash__validate_architecture',       note: 'boundary correct, externals outside, no component leak' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                note: 'persist accepted drawing ("<System> — Containers")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',             note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',              note: 'PNG/SVG/JSON, redacted; re-scan datastore URLs/broker creds' },
];

const HARD_BLOCKERS = ['ARROW_TEXT_INTERSECTION', 'FRAME_TITLE_OVERLAP', 'ITEM_OUTSIDE_FRAME'];
const MIN_SCORE = 95;

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('diagram type   : ' + DIAGRAM_TYPE + ' (level: ' + LEVEL + ')');
  console.log('curated libs   : ' + RECOMMENDED_LIBRARIES.join(', '));
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
  console.log('NOTE: the four generate create paths are ONE-OF; exactly one create path runs per drawing.');
  console.log('NOTE: prefer convert_diagram_type when a C4 context drawing already exists.');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');
  console.log('NOTE: containers go inside the boundary frame; external systems go outside it.');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(DIAGRAM_TYPE === 'c4', 'diagram type must be c4');
  assert(LEVEL === 'container', 'level must be container');
  assert(RECOMMENDED_LIBRARIES.length === 3, 'expected 3 recommended libraries');
  assert(CREATE_PATHS.length === 4, 'expected 4 mutually-exclusive create paths');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__convert_diagram_type') !== -1, 'convert_diagram_type must be a create path');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__apply_architecture_skill') !== -1, 'apply_architecture_skill must be a create path');
  assert(SEQUENCE.some((s) => s.phase === 'lint'), 'missing lint phase');
  assert(SEQUENCE.some((s) => s.phase === 'score'), 'missing score phase');
  assert(SEQUENCE.some((s) => s.phase === 'repair'), 'missing repair phase');
  assert(SEQUENCE.some((s) => s.phase === 'validate'), 'missing validate phase');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__add_library_items_normalized'), 'must place normalized library items');
  const generates = SEQUENCE.filter((s) => s.phase === 'generate');
  // 4 create paths + 1 library-placement step.
  assert(generates.length === 5, 'expected 4 create paths + 1 add-items step in generate phase');
  assert(MIN_SCORE >= 95, 'min score must be >= 95');

  console.log('');
  console.log('OK');
  process.exit(0);
}

main();
