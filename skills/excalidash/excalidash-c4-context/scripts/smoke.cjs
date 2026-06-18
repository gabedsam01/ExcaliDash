#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-c4-context skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this skill
 * maps to and the canonical plan -> generate -> lint -> score -> repair -> validate -> save ->
 * export tool-call sequence the skill performs, so docs and the skill body can be diffed
 * against one source of truth. No external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success.
 */
'use strict';

const SKILL = 'excalidash-c4-context';
const MCP_PROMPT = '/mcp__excalidash__excalidash_c4_context';

// C4 Level 1: one central system, actors and external systems around it.
const C4_LEVEL = 'context';
const NODE_KINDS = ['person', 'central system', 'external system'];

// Curated packs recommended for the System Context view.
const RECOMMENDED_LIBRARIES = [
  'C4 Architecture',
  'Stick Figures',
  'Software Logos',
];

// Canonical plan -> generate -> lint -> score -> repair -> validate -> save -> export sequence.
// The three generate steps are ONE-OF; exactly one create path runs per drawing.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',               note: 'load architecture preset, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__list_templates',               note: 'look for a c4-context template (optional)' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',             note: 'person / system / vendor-logo icons (if libraries apply)' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',              note: 'vet candidate icons (aspect, stroke, fill)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                note: 'cache vetted icons' },
  { phase: 'generate', tool: 'mcp__excalidash__apply_architecture_skill',     note: 'ONE-OF create path: pattern="c4", context via title (preferred)' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',   note: 'ONE-OF create path: diagramType="c4" with a context structure' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_template',         note: 'ONE-OF create path: templateId="c4-context"' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized', note: 'place actor / system glyph / vendor logos into slots' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                 note: 'hardBlockers must end empty' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',               note: 'require score >= 95' },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',              note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',         note: 'after blockers clear; re-score for no regression' },
  { phase: 'validate', tool: 'mcp__excalidash__validate_architecture',       note: 'one center; every edge anchored; no orphans; no internal leak' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                note: 'persist accepted drawing ("<System> - System Context")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',             note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',              note: 'PNG/SVG/JSON, redacted; re-scan for secrets' },
];

const HARD_BLOCKERS = ['ARROW_TEXT_INTERSECTION', 'FRAME_TITLE_OVERLAP', 'ITEM_OUTSIDE_FRAME'];
const MIN_SCORE = 95;

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('c4 level       : ' + C4_LEVEL);
  console.log('node kinds     : ' + NODE_KINDS.join(', '));
  console.log('curated libs   : ' + RECOMMENDED_LIBRARIES.join(', '));
  console.log('min score      : ' + MIN_SCORE + ' (zero hard blockers)');
  console.log('hard blockers  : ' + HARD_BLOCKERS.join(', '));
  console.log('');
  console.log('## Plan -> generate -> quality-loop -> validate -> save -> export sequence');
  SEQUENCE.forEach(function (step, i) {
    const n = String(i + 1).padStart(2, ' ');
    console.log(n + '. [' + step.phase + '] ' + step.tool + '  -- ' + step.note);
  });
  console.log('');
  console.log('NOTE: the three generate create steps are ONE-OF; exactly one create path runs per drawing.');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');
  console.log('NOTE: Level 1 shows ONE central system + actors + external systems only; no containers/components.');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(C4_LEVEL === 'context', 'c4 level must be "context" (Level 1)');
  assert(NODE_KINDS.length === 3, 'expected 3 node kinds: person, central system, external system');
  assert(RECOMMENDED_LIBRARIES.length === 3, 'expected 3 recommended libraries');
  assert(RECOMMENDED_LIBRARIES.indexOf('C4 Architecture') !== -1, 'C4 Architecture pack must be recommended');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__apply_architecture_skill'), 'missing apply_architecture_skill path');
  assert(SEQUENCE.some((s) => s.phase === 'lint'), 'missing lint phase');
  assert(SEQUENCE.some((s) => s.phase === 'score'), 'missing score phase');
  assert(SEQUENCE.some((s) => s.phase === 'repair'), 'missing repair phase');
  assert(SEQUENCE.some((s) => s.phase === 'validate'), 'missing validate phase');
  const createPaths = SEQUENCE.filter((s) => s.phase === 'generate' &&
    (s.tool.indexOf('create') !== -1 || s.tool.indexOf('apply_architecture_skill') !== -1));
  assert(createPaths.length >= 3, 'expected at least 3 ONE-OF create paths');
  assert(MIN_SCORE >= 95, 'min score must be >= 95');

  console.log('');
  console.log('OK');
  process.exit(0);
}

main();
