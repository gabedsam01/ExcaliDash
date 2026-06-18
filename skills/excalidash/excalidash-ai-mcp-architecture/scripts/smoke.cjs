#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-ai-mcp-architecture skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this
 * skill maps to and the canonical plan-then-build tool-call sequence the skill performs,
 * so docs and the skill body can be diffed against one source of truth. No external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success, 1 if the documented sequence drifts.
 */
'use strict';

const SKILL = 'excalidash-ai-mcp-architecture';
const MCP_PROMPT = '/mcp__excalidash__excalidash_ai_mcp_architecture';

// Fixed pattern for this skill (apply_architecture_skill takes pattern only — no skill/level).
const PATTERN = 'mcp';

// Curated packs recommended for an MCP / AI-server architecture view.
const RECOMMENDED_LIBRARIES = [
  'Software Architecture',
  'Technology Logos',
  'Cloud/DevOps',
];

// The three mutually exclusive create paths; exactly one runs per drawing.
const CREATE_PATHS = [
  'mcp__excalidash__apply_architecture_skill',   // pattern:"mcp" (preferred): client/transport/server/backend lanes
  'mcp__excalidash__create_from_repo_analysis',  // map a repo-analysis object onto the lanes
  'mcp__excalidash__create_diagram_from_prompt', // explicit structure:{nodes,edges}
];

// The four lanes this skill must produce.
const LANES = ['client (host + LLM)', 'transport (/mcp JSON-RPC)', 'server (auth -> registry -> services)', 'backend (storage + library cache)'];

// The 25-tool registry, summarized as group rows (never 25 cells).
const TOOL_GROUPS = { Core: 9, Libraries: 5, Quality: 4, Architecture: 4, Templates: 3 };

// Canonical plan -> generate -> lint -> score -> repair -> validate -> save -> export sequence.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',                 note: 'load presets, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',               note: 'curated: server/gateway, service, store, vendor logos' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',                note: 'vet candidates (aspect, stroke, fill, complexity)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                  note: 'cache vetted icons' },
  { phase: 'generate', tool: 'mcp__excalidash__apply_architecture_skill',       note: 'ONE-OF: pattern:"mcp" (client/transport/server/backend lanes)' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_repo_analysis',      note: 'ONE-OF: map repo-analysis object onto the lanes' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',     note: 'ONE-OF: explicit structure:{nodes,edges}, direction LR' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized',   note: 'server/service glyph, database-symbol (postgres), vendor logos' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                   note: 'hardBlockers must end empty' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',                  note: 'require score >= 95' },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',                 note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',            note: 'after blockers clear; re-score for no regression' },
  { phase: 'validate', tool: 'mcp__excalidash__validate_architecture',          note: 'transport/auth/storage distinct; LLM outside boundary' },
  { phase: 'validate', tool: 'mcp__excalidash__suggest_architecture_improvements', note: 'optional hardening hints (rate limit, audit, rotation)' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                   note: 'persist accepted drawing ("<Server> — MCP Architecture")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                   note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',                note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',                 note: 'svg/png/excalidraw, redacted; re-scan bearer keys / db URLs' },
];

const HARD_BLOCKERS = ['ARROW_TEXT_INTERSECTION', 'FRAME_TITLE_OVERLAP', 'ITEM_OUTSIDE_FRAME'];
const MIN_SCORE = 95;

function main() {
  const groupSummary = Object.keys(TOOL_GROUPS).map(function (k) { return k + ' ' + TOOL_GROUPS[k]; }).join(' / ');
  const toolTotal = Object.keys(TOOL_GROUPS).reduce(function (a, k) { return a + TOOL_GROUPS[k]; }, 0);

  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('pattern        : ' + PATTERN + ' (apply_architecture_skill takes pattern only)');
  console.log('lanes          : ' + LANES.join(' | '));
  console.log('tool registry  : ' + toolTotal + ' tools (' + groupSummary + ')');
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
  console.log('NOTE: the three generate create paths are ONE-OF; exactly one create path runs per drawing.');
  console.log('NOTE: prefer apply_architecture_skill({ pattern: "mcp" }) for the lane skeleton.');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');
  console.log('NOTE: the host AND the LLM stay OUTSIDE the server trust boundary; storage is reached only via a service.');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = function (cond, msg) { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(PATTERN === 'mcp', 'pattern must be mcp');
  assert(toolTotal === 25, 'tool registry must total exactly 25 tools');
  assert(RECOMMENDED_LIBRARIES.length === 3, 'expected 3 recommended libraries');
  assert(LANES.length === 4, 'expected 4 lanes (client, transport, server, backend)');
  assert(CREATE_PATHS.length === 3, 'expected 3 mutually-exclusive create paths');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__apply_architecture_skill') !== -1, 'apply_architecture_skill must be a create path');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__create_from_repo_analysis') !== -1, 'create_from_repo_analysis must be a create path');
  assert(SEQUENCE.some(function (s) { return s.phase === 'lint'; }), 'missing lint phase');
  assert(SEQUENCE.some(function (s) { return s.phase === 'score'; }), 'missing score phase');
  assert(SEQUENCE.some(function (s) { return s.phase === 'repair'; }), 'missing repair phase');
  assert(SEQUENCE.some(function (s) { return s.phase === 'validate' && s.tool === 'mcp__excalidash__validate_architecture'; }), 'missing validate_architecture');
  assert(SEQUENCE.some(function (s) { return s.tool === 'mcp__excalidash__add_library_items_normalized'; }), 'must place normalized library items');
  const generates = SEQUENCE.filter(function (s) { return s.phase === 'generate'; });
  // 3 create paths + 1 library-placement step.
  assert(generates.length === 4, 'expected 3 create paths + 1 add-items step in generate phase');
  assert(MIN_SCORE >= 95, 'min score must be >= 95');

  console.log('');
  console.log('OK');
  process.exit(0);
}

main();
