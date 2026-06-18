#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-ui-wireframe-dashboard skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this
 * skill maps to and the canonical plan-then-build tool-call sequence the skill performs,
 * so docs and the skill body can be diffed against one source of truth. No external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success, 1 if the documented sequence drifts.
 */
'use strict';

const SKILL = 'excalidash-ui-wireframe-dashboard';
const MCP_PROMPT = '/mcp__excalidash__excalidash_ui_wireframe_dashboard';

// Fixed diagram type for this skill.
const DIAGRAM_TYPE = 'wireframe';

// The breakpoint frames and the explicit interaction states this skill always draws.
const FRAMES = ['Desktop', 'Mobile'];
const STATES = ['empty', 'loading', 'error', 'success'];

// Curated packs recommended for a UI wireframe / dashboard.
const RECOMMENDED_LIBRARIES = [
  'Lo-Fi Wireframing Kit',
  'Web Kit',
  'Mobile Kit',
];

// The two mutually exclusive create paths; exactly one runs per drawing.
const CREATE_PATHS = [
  'mcp__excalidash__create_from_template',       // templateId: wireframe-dashboard
  'mcp__excalidash__create_diagram_from_prompt', // diagramType: "wireframe" + panel-grid structure
];

// Canonical plan -> generate -> lint -> score -> repair -> polish -> save -> export sequence.
// NOTE: no validate_architecture — this is a UI layout, not an architecture.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',               note: 'load presets, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__list_templates',               note: 'look for a wireframe/dashboard template (optional)' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',             note: 'curated: nav, button, input, table, card, chart, device frame' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',              note: 'vet candidates (aspect, stroke, fill, complexity)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                note: 'cache vetted kit items' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_template',         note: 'ONE-OF: templateId:wireframe-dashboard (reusable grid)' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',   note: 'ONE-OF: diagramType:wireframe + explicit panel-grid structure' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized', note: 'nav, controls, table rows, chart placeholders, device chrome' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                 note: 'hardBlockers must end empty' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',               note: 'require score >= 95' },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',              note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',         note: 'after blockers clear; re-score for no regression' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                note: 'persist accepted drawing ("<Screen> — Wireframe (Desktop + Mobile)")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',             note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',              note: 'SVG/PNG/excalidraw; re-scan sample data and tokens' },
];

const HARD_BLOCKERS = ['ARROW_TEXT_INTERSECTION', 'FRAME_TITLE_OVERLAP', 'ITEM_OUTSIDE_FRAME'];
const PENALTIES = ['TEXT_NEAR_EDGE', 'HIGH_DENSITY', 'SMALL_FONT'];
const MIN_SCORE = 95;

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('diagram type   : ' + DIAGRAM_TYPE);
  console.log('frames         : ' + FRAMES.join(', '));
  console.log('states         : ' + STATES.join(', '));
  console.log('curated libs   : ' + RECOMMENDED_LIBRARIES.join(', '));
  console.log('min score      : ' + MIN_SCORE + ' (zero hard blockers)');
  console.log('hard blockers  : ' + HARD_BLOCKERS.join(', '));
  console.log('penalties      : ' + PENALTIES.join(', '));
  console.log('create paths   : ' + CREATE_PATHS.join(', '));
  console.log('');
  console.log('## Plan -> build -> quality-loop sequence');
  SEQUENCE.forEach(function (step, i) {
    const n = String(i + 1).padStart(2, ' ');
    console.log(n + '. [' + step.phase + '] ' + step.tool + '  -- ' + step.note);
  });
  console.log('');
  console.log('NOTE: the two generate create paths are ONE-OF; exactly one create path runs per drawing.');
  console.log('NOTE: draw one frame per breakpoint (Desktop + Mobile); mobile is restructured, not squeezed.');
  console.log('NOTE: every data-bearing panel shows all four states: empty, loading, error, success.');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');
  console.log('NOTE: no validate_architecture — this is a UI layout, not an architecture.');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(DIAGRAM_TYPE === 'wireframe', 'diagram type must be wireframe');
  assert(FRAMES.length === 2 && FRAMES.indexOf('Desktop') !== -1 && FRAMES.indexOf('Mobile') !== -1,
    'must draw separate Desktop and Mobile frames');
  assert(STATES.length === 4, 'expected 4 interaction states (empty, loading, error, success)');
  ['empty', 'loading', 'error', 'success'].forEach((s) =>
    assert(STATES.indexOf(s) !== -1, 'missing state: ' + s));
  assert(RECOMMENDED_LIBRARIES.length === 3, 'expected 3 recommended libraries');
  assert(RECOMMENDED_LIBRARIES.indexOf('Lo-Fi Wireframing Kit') !== -1, 'Lo-Fi Wireframing Kit must be recommended');
  assert(CREATE_PATHS.length === 2, 'expected 2 mutually-exclusive create paths');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__create_from_template') !== -1, 'create_from_template must be a create path');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__create_diagram_from_prompt') !== -1, 'create_diagram_from_prompt must be a create path');
  assert(SEQUENCE.some((s) => s.phase === 'lint'), 'missing lint phase');
  assert(SEQUENCE.some((s) => s.phase === 'score'), 'missing score phase');
  assert(SEQUENCE.some((s) => s.phase === 'repair'), 'missing repair phase');
  assert(SEQUENCE.some((s) => s.phase === 'polish'), 'missing polish phase');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__add_library_items_normalized'), 'must place normalized library items');
  // This skill is a UI layout: it must NOT call validate_architecture.
  assert(!SEQUENCE.some((s) => s.tool === 'mcp__excalidash__validate_architecture'), 'wireframe must not validate_architecture');
  const generates = SEQUENCE.filter((s) => s.phase === 'generate');
  // 2 create paths + 1 library-placement step.
  assert(generates.length === 3, 'expected 2 create paths + 1 add-items step in generate phase');
  assert(HARD_BLOCKERS.length === 3, 'expected 3 hard blockers');
  assert(MIN_SCORE >= 95, 'min score must be >= 95');

  console.log('');
  console.log('OK');
  process.exit(0);
}

main();
