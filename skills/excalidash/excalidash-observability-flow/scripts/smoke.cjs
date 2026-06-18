#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-observability-flow skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this
 * skill maps to and the canonical plan-then-build tool-call sequence the skill performs,
 * so docs and the skill body can be diffed against one source of truth. No external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success, 1 if the documented sequence drifts.
 */
'use strict';

const SKILL = 'excalidash-observability-flow';
const MCP_PROMPT = '/mcp__excalidash__excalidash_observability_flow';

// Fixed diagram shape for this flow skill.
const DIAGRAM_TYPE = 'flowchart';
const DIRECTION = 'LR';
const PRESET = 'technical-docs';

// Curated packs recommended for an observability data-flow view.
const RECOMMENDED_LIBRARIES = [
  'Cloud/DevOps',
  'Flow Chart Symbols',
  'Data Flow',
];

// The three signal pipelines that fan out of the collector.
const SIGNALS = ['metrics', 'logs', 'traces'];

// The four distinct paths the diagram must separate.
const PATHS = ['happy', 'alert', 'error-backpressure', 'on-call'];

// Single create path for a flow skill (no architecture-skill / template path here).
const CREATE_PATH = 'mcp__excalidash__create_diagram_from_prompt';

// Canonical plan -> generate -> lint -> score -> repair -> polish -> save -> export sequence.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',               note: 'load technical-docs preset, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',             note: 'curated: collector/agent, decision/terminator, data-store' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',              note: 'vet candidates (aspect, stroke, fill, complexity)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                note: 'cache vetted icons' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',   note: 'flowchart structure, direction:LR, dashed telemetry edges, legend' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized', note: 'collector glyph, data-store symbols, decision/terminator, legend swatches' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                 note: 'hardBlockers must end empty' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',                note: 'require score >= 95' },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',               note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',          note: 'after blockers clear; re-score for no regression' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                 note: 'persist accepted drawing ("<System> — Observability Flow")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                 note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',              note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',               note: 'SVG/PNG/excalidraw, redacted; re-scan ingest tokens/webhook URLs' },
];

const HARD_BLOCKERS = ['ARROW_TEXT_INTERSECTION', 'FRAME_TITLE_OVERLAP', 'ITEM_OUTSIDE_FRAME'];
const MIN_SCORE = 95;

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('diagram type   : ' + DIAGRAM_TYPE + ' (direction: ' + DIRECTION + ', preset: ' + PRESET + ')');
  console.log('signals        : ' + SIGNALS.join(', '));
  console.log('paths          : ' + PATHS.join(', '));
  console.log('curated libs   : ' + RECOMMENDED_LIBRARIES.join(', '));
  console.log('min score      : ' + MIN_SCORE + ' (zero hard blockers)');
  console.log('hard blockers  : ' + HARD_BLOCKERS.join(', '));
  console.log('create path    : ' + CREATE_PATH);
  console.log('');
  console.log('## Plan -> build -> quality-loop sequence');
  SEQUENCE.forEach(function (step, i) {
    const n = String(i + 1).padStart(2, ' ');
    console.log(n + '. [' + step.phase + '] ' + step.tool + '  -- ' + step.note);
  });
  console.log('');
  console.log('NOTE: telemetry edges are DASHED; request/work edges are solid; both keyed in the legend.');
  console.log('NOTE: the collector fans out into ' + SIGNALS.length + ' signal pipelines, each to its own store.');
  console.log('NOTE: happy / alert / error-backpressure / on-call are separate, traceable branches.');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');
  console.log('NOTE: redact ingest tokens, remote-write creds and webhook URLs as [REDACTED_*] before any call.');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(DIAGRAM_TYPE === 'flowchart', 'diagram type must be flowchart');
  assert(DIRECTION === 'LR', 'direction must be LR');
  assert(PRESET === 'technical-docs', 'preset must be technical-docs');
  assert(RECOMMENDED_LIBRARIES.length === 3, 'expected 3 recommended libraries');
  assert(SIGNALS.length === 3, 'expected 3 signal pipelines (metrics/logs/traces)');
  assert(PATHS.length === 4, 'expected 4 distinct paths');
  assert(PATHS.indexOf('error-backpressure') !== -1, 'error/backpressure path must be present');
  assert(PATHS.indexOf('on-call') !== -1, 'on-call escalation path must be present');
  assert(CREATE_PATH === 'mcp__excalidash__create_diagram_from_prompt', 'single create path must be create_diagram_from_prompt');
  assert(SEQUENCE.some((s) => s.phase === 'lint'), 'missing lint phase');
  assert(SEQUENCE.some((s) => s.phase === 'score'), 'missing score phase');
  assert(SEQUENCE.some((s) => s.phase === 'repair'), 'missing repair phase');
  assert(SEQUENCE.some((s) => s.phase === 'polish'), 'missing polish phase');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__add_library_items_normalized'), 'must place normalized library items');
  assert(SEQUENCE.filter((s) => s.tool === CREATE_PATH).length === 1, 'exactly one create_diagram_from_prompt step');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__save_version'), 'must checkpoint with save_version');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__export_drawing'), 'must export');
  assert(HARD_BLOCKERS.length === 3, 'expected 3 tracked hard blockers');
  assert(MIN_SCORE >= 95, 'min score must be >= 95');

  console.log('');
  console.log('OK');
  process.exit(0);
}

main();
