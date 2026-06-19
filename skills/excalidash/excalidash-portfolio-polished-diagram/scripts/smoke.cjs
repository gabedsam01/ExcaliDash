#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-portfolio-polished-diagram skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this
 * skill maps to, the curated libraries, and the canonical plan-then-build tool-call
 * sequence the skill performs, so docs and the skill body can be diffed against one
 * source of truth. No network, no external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success, 1 if the documented sequence drifts.
 */
'use strict';

const SKILL = 'excalidash-portfolio-polished-diagram';
const MCP_PROMPT = '/mcp__excalidash__excalidash_portfolio_polished_diagram';

// Fixed preset for this visual skill.
const PRESET = 'portfolio-polished';

// Curated packs recommended for a presentation/portfolio-grade visual.
const RECOMMENDED_LIBRARIES = [
  'Technology Logos',
  'Software Logos',
  'Software Architecture',
];

// The three mutually exclusive create paths; exactly one runs per drawing.
const CREATE_PATHS = [
  'mcp__excalidash__create_diagram_from_prompt',  // default: structure + preset portfolio-polished
  'mcp__excalidash__create_from_repo_analysis',   // re-skin a real repo into a deck visual
  'mcp__excalidash__convert_diagram_type',        // re-skin an existing rough diagram
];

// Canonical plan -> generate -> place icons -> lint -> score -> repair -> polish -> save -> export.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',               note: 'load presets, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',             note: 'curated: vendor/tech logos' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',              note: 'vet candidates (aspect, stroke, fill, complexity)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                note: 'cache vetted logos' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',   note: 'ONE-OF: preset portfolio-polished + structure' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_repo_analysis',    note: 'ONE-OF: re-skin a real repo' },
  { phase: 'generate', tool: 'mcp__excalidash__convert_diagram_type',         note: 'ONE-OF: re-skin an existing diagram' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized', note: 'logos in card slots + legend swatches; aspect preserved' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                 note: 'hardBlockers must end empty' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',                note: 'require score >= 95' },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',               note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',          note: 'after blockers clear; allowDraft:false; re-score for no regression' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                 note: 'persist accepted drawing ("<Subject> — Overview")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                 note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',              note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',               note: 'PNG + SVG, redacted; re-scan both exports' },
];

const HARD_BLOCKERS = ['ARROW_TEXT_INTERSECTION', 'FRAME_TITLE_OVERLAP', 'ITEM_OUTSIDE_FRAME'];
const PENALTIES = ['HIGH_DENSITY', 'SMALL_FONT', 'TEXT_NEAR_EDGE'];
const MIN_SCORE = 95;

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('preset         : ' + PRESET);
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
  console.log('NOTE: the three generate create paths are ONE-OF; exactly one runs per drawing.');
  console.log('NOTE: prefer convert_diagram_type / create_from_repo_analysis when re-skinning existing content.');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');
  console.log('NOTE: every secret is redacted to [REDACTED_<TYPE>] before any call and re-scanned on export.');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(PRESET === 'portfolio-polished', 'preset must be portfolio-polished');
  assert(MCP_PROMPT === '/mcp__excalidash__excalidash_portfolio_polished_diagram', 'mcp prompt id drift');
  assert(RECOMMENDED_LIBRARIES.length === 3, 'expected 3 recommended libraries');
  assert(RECOMMENDED_LIBRARIES.indexOf('Technology Logos') !== -1, 'Technology Logos must be recommended');
  assert(RECOMMENDED_LIBRARIES.indexOf('Software Logos') !== -1, 'Software Logos must be recommended');
  assert(CREATE_PATHS.length === 3, 'expected 3 mutually-exclusive create paths');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__create_diagram_from_prompt') !== -1, 'create_diagram_from_prompt must be a create path');
  assert(SEQUENCE.some((s) => s.phase === 'lint'), 'missing lint phase');
  assert(SEQUENCE.some((s) => s.phase === 'score'), 'missing score phase');
  assert(SEQUENCE.some((s) => s.phase === 'repair'), 'missing repair phase');
  assert(SEQUENCE.some((s) => s.phase === 'polish'), 'missing polish phase');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__add_library_items_normalized'), 'must place normalized library items');
  assert(SEQUENCE.filter((s) => s.tool === 'mcp__excalidash__export_drawing').length === 1, 'export step present (PNG + SVG)');
  const generates = SEQUENCE.filter((s) => s.phase === 'generate');
  // 3 create paths + 1 library-placement step.
  assert(generates.length === 4, 'expected 3 create paths + 1 add-items step in generate phase');
  assert(HARD_BLOCKERS.length === 3, 'expected 3 hard blockers');
  assert(MIN_SCORE >= 95, 'min score must be >= 95');

  // Guard against the forbidden apply_architecture_skill mis-args ever appearing here.
  const seqText = JSON.stringify(SEQUENCE) + JSON.stringify(CREATE_PATHS);
  assert(seqText.indexOf('"skill"') === -1, 'must not reference a skill: arg');
  assert(seqText.indexOf('"level"') === -1, 'must not reference a level: arg');

  console.log('');
  console.log('OK');
  process.exit(0);
}

main();
