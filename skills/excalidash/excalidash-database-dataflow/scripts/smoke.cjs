#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-database-dataflow skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this skill maps
 * to and the canonical plan-then-build tool-call sequence the skill performs, so docs and the
 * skill body can be diffed against one source of truth. No network, no external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success, 1 if the documented sequence drifts.
 */
'use strict';

const SKILL = 'excalidash-database-dataflow';
const MCP_PROMPT = '/mcp__excalidash__excalidash_database_dataflow';

// This skill produces ONE of two related data-shaped views.
const DIAGRAM_TYPES = ['er', 'data-flow'];

// Curated packs recommended for ER / DFD views (mirrors the MCP prompt registry entry).
const RECOMMENDED_LIBRARIES = [
  'Data Platform',
  'Software Logos',
  'Data Flow',
];

// The four mutually exclusive create paths; exactly one runs per drawing.
const CREATE_PATHS = [
  'mcp__excalidash__create_diagram_from_prompt', // structure + diagramType:"er"|"data-flow"
  'mcp__excalidash__create_from_repo_analysis',  // reverse-engineer tables/columns/FKs from analysis
  'mcp__excalidash__convert_diagram_type',       // reshape an existing structure -> er|data-flow
  'mcp__excalidash__create_from_template',        // templateId for er/schema/data-flow
];

// Canonical plan -> generate -> lint -> score -> repair -> polish -> validate -> save -> export.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',                  note: 'load presets, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__list_templates',                  note: 'look for an er/schema/data-flow template (optional)' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',                note: 'curated: cylinder store glyphs, engine logos, DFD shapes' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',                 note: 'vet candidates (aspect, stroke, fill, complexity)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                   note: 'cache vetted icons' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',      note: 'ONE-OF: structure + diagramType er|data-flow' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_repo_analysis',       note: 'ONE-OF: derive tables/columns/FKs from analysis' },
  { phase: 'generate', tool: 'mcp__excalidash__convert_diagram_type',            note: 'ONE-OF: reshape existing structure -> er|data-flow' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_template',            note: 'ONE-OF: templateId for er/schema/data-flow' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized',    note: 'cylinder/database-symbol per store, engine logos, DFD glyphs' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                    note: 'hardBlockers must end empty (watch ARROW_TEXT_INTERSECTION)' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',                   note: 'require score >= 95 (watch HIGH_DENSITY, SMALL_FONT)' },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',                  note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',            note: 'after blockers clear; re-score; keep cardinality/flow labels' },
  { phase: 'validate', tool: 'mcp__excalidash__validate_architecture',         note: 'ER referential integrity / DFD flow conservation' },
  { phase: 'validate', tool: 'mcp__excalidash__suggest_architecture_improvements', note: 'missing FK index, orphan table, missing junction, dead store' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                   note: 'persist ("<System> — ER Diagram" / "Data-Flow Diagram (L1)")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                   note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',               note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',                note: 'SVG/PNG/excalidraw; re-scan for DB connection strings' },
];

const HARD_BLOCKERS = ['ARROW_TEXT_INTERSECTION', 'FRAME_TITLE_OVERLAP', 'ITEM_OUTSIDE_FRAME'];
const MIN_SCORE = 95;

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('diagram types  : ' + DIAGRAM_TYPES.join(' | '));
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
  console.log('NOTE: prefer create_diagram_from_prompt (structure) for a described schema/flow; create_from_repo_analysis to reverse-engineer.');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');
  console.log('NOTE: every data store renders as a cylinder/database-symbol; the legend keys the notation.');
  console.log('NOTE: redact DB connection strings to [REDACTED_DATABASE_URL] before any tool call and re-scan the export.');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };

  // Only real MCP tool names are referenced.
  const REAL_TOOLS = new Set([
    'mcp__excalidash__read_mcp_guide', 'mcp__excalidash__create_drawing', 'mcp__excalidash__get_drawing',
    'mcp__excalidash__update_drawing', 'mcp__excalidash__save_drawing', 'mcp__excalidash__save_version',
    'mcp__excalidash__get_drawing_url', 'mcp__excalidash__export_drawing', 'mcp__excalidash__create_diagram_from_prompt',
    'mcp__excalidash__search_libraries', 'mcp__excalidash__inspect_library', 'mcp__excalidash__cache_library',
    'mcp__excalidash__add_library_items', 'mcp__excalidash__add_library_items_normalized',
    'mcp__excalidash__lint_drawing', 'mcp__excalidash__score_drawing', 'mcp__excalidash__repair_drawing',
    'mcp__excalidash__auto_polish_drawing', 'mcp__excalidash__validate_architecture',
    'mcp__excalidash__apply_architecture_skill', 'mcp__excalidash__create_from_repo_analysis',
    'mcp__excalidash__suggest_architecture_improvements', 'mcp__excalidash__list_templates',
    'mcp__excalidash__create_from_template', 'mcp__excalidash__convert_diagram_type',
  ]);

  assert(DIAGRAM_TYPES.length === 2, 'expected er and data-flow diagram types');
  assert(DIAGRAM_TYPES.indexOf('er') !== -1, 'er must be a diagram type');
  assert(DIAGRAM_TYPES.indexOf('data-flow') !== -1, 'data-flow must be a diagram type');
  assert(RECOMMENDED_LIBRARIES.length === 3, 'expected 3 recommended libraries');
  assert(CREATE_PATHS.length === 4, 'expected 4 mutually-exclusive create paths');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__create_diagram_from_prompt') !== -1, 'create_diagram_from_prompt must be a create path');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__create_from_repo_analysis') !== -1, 'create_from_repo_analysis must be a create path');
  CREATE_PATHS.forEach((t) => assert(REAL_TOOLS.has(t), 'create path is not a real tool: ' + t));
  SEQUENCE.forEach((s) => assert(REAL_TOOLS.has(s.tool), 'sequence references a non-real tool: ' + s.tool));
  assert(SEQUENCE.some((s) => s.phase === 'lint'), 'missing lint phase');
  assert(SEQUENCE.some((s) => s.phase === 'score'), 'missing score phase');
  assert(SEQUENCE.some((s) => s.phase === 'repair'), 'missing repair phase');
  assert(SEQUENCE.some((s) => s.phase === 'polish'), 'missing polish phase');
  assert(SEQUENCE.some((s) => s.phase === 'validate'), 'missing validate phase');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__validate_architecture'), 'must validate_architecture');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__suggest_architecture_improvements'), 'must suggest_architecture_improvements');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__add_library_items_normalized'), 'must place normalized library items');
  const generates = SEQUENCE.filter((s) => s.phase === 'generate');
  // 4 create paths + 1 library-placement step.
  assert(generates.length === 5, 'expected 4 create paths + 1 add-items step in generate phase');
  assert(HARD_BLOCKERS.indexOf('ARROW_TEXT_INTERSECTION') !== -1, 'ARROW_TEXT_INTERSECTION must be a tracked hard blocker');
  assert(MIN_SCORE >= 95, 'min score must be >= 95');

  console.log('');
  console.log('OK');
  process.exit(0);
}

main();
