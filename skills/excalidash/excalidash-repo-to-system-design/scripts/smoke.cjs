#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-repo-to-system-design skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this
 * skill maps to and the canonical plan-then-build tool-call sequence the skill performs,
 * so docs and the skill body can be diffed against one source of truth. No external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success, 1 if the documented sequence drifts.
 */
'use strict';

const SKILL = 'excalidash-repo-to-system-design';
const MCP_PROMPT = '/mcp__excalidash__excalidash_repo_to_system_design';

// Fixed type/source for this skill.
const DIAGRAM_TYPE = 'system-design';
const SOURCE = 'repo-analysis';

// One frame per zone is produced from the rich intermediate model.
const ZONES = [
  'Client',
  'Edge',
  'Services',
  'Async',
  'Data',
  'External',
  'Cross-cutting',
];

// Sections of the rich intermediate model consumed by create_from_repo_analysis.
const ANALYSIS_SECTIONS = [
  'actors', 'apps', 'gateways', 'services', 'workers', 'queues',
  'databases', 'integrations', 'auth', 'observability', 'risks', 'flows',
];

// Curated packs recommended for a repo-derived system design.
const RECOMMENDED_LIBRARIES = [
  'Software Architecture',
  'Technology Logos',
  'Cloud/DevOps',
  'Database/Data Platform',
];

// The three mutually exclusive create paths; exactly one runs per drawing.
const CREATE_PATHS = [
  'mcp__excalidash__create_from_repo_analysis',  // PREFERRED: consumes the rich model directly
  'mcp__excalidash__apply_architecture_skill',   // fallback A: service-heavy -> microservices skeleton
  'mcp__excalidash__create_diagram_from_prompt', // fallback B: no analysis object -> zone+flow prompt
];

// Canonical plan -> generate -> lint -> score -> repair -> validate -> save -> export sequence.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',                 note: 'load presets, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__list_templates',                 note: 'look for a system-design template (optional)' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',               note: 'curated: service, gateway, queue, db, vendor logos, actor' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',                note: 'vet candidates (aspect, stroke, fill, complexity)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                  note: 'cache vetted icons' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_repo_analysis',      note: 'ONE-OF (preferred): rich model -> frames per zone + routed flows + legend' },
  { phase: 'generate', tool: 'mcp__excalidash__apply_architecture_skill',       note: 'ONE-OF (fallback A): pattern:microservices topology skeleton (pattern only; no skill/level)' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',     note: 'ONE-OF (fallback B): type:architecture, explicit zones+flows' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized',   note: 'service glyph, database-symbol, queue, integration logos, actor' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                   note: 'hardBlockers must end empty' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',                  note: 'require score >= 95' },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',                 note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',            note: 'after blockers clear; re-score for no regression' },
  { phase: 'validate', tool: 'mcp__excalidash__validate_architecture',          note: 'zones present, nodes zoned, flows endpointed, integrations external' },
  { phase: 'validate', tool: 'mcp__excalidash__suggest_architecture_improvements', note: 'surface missing edges; apply safe fixes, re-score' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                   note: 'persist accepted drawing ("<Repo> — System Design")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                   note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',                note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',                 note: 'PNG/SVG/JSON, redacted; re-scan conn strings / IdP / integration keys' },
];

const HARD_BLOCKERS = ['ARROW_TEXT_INTERSECTION', 'FRAME_TITLE_OVERLAP', 'ITEM_OUTSIDE_FRAME'];
const MIN_SCORE = 95;

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('diagram type   : ' + DIAGRAM_TYPE + ' (source: ' + SOURCE + ')');
  console.log('zones          : ' + ZONES.join(', '));
  console.log('model sections : ' + ANALYSIS_SECTIONS.join(', '));
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
  console.log('NOTE: prefer create_from_repo_analysis — it is the only tool that consumes the rich model directly.');
  console.log('NOTE: create_from_repo_analysis builds one frame per zone, routes one arrow per flow step, and emits a zone legend.');
  console.log('NOTE: request flows render solid, event flows render dashed; both keyed in the legend.');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');
  console.log('NOTE: integrations belong in the External zone; auth + observability in Cross-cutting; never a secret value on a card.');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(DIAGRAM_TYPE === 'system-design', 'diagram type must be system-design');
  assert(SOURCE === 'repo-analysis', 'source must be repo-analysis');
  assert(ZONES.length === 7, 'expected 7 zones');
  assert(ANALYSIS_SECTIONS.length === 12, 'expected 12 analysis sections');
  assert(ANALYSIS_SECTIONS.indexOf('flows') !== -1, 'analysis must include flows');
  assert(RECOMMENDED_LIBRARIES.length === 4, 'expected 4 recommended libraries');
  assert(CREATE_PATHS.length === 3, 'expected 3 mutually-exclusive create paths');
  assert(CREATE_PATHS[0] === 'mcp__excalidash__create_from_repo_analysis', 'create_from_repo_analysis must be the preferred (first) create path');
  assert(SEQUENCE.some((s) => s.phase === 'lint'), 'missing lint phase');
  assert(SEQUENCE.some((s) => s.phase === 'score'), 'missing score phase');
  assert(SEQUENCE.some((s) => s.phase === 'repair'), 'missing repair phase');
  assert(SEQUENCE.some((s) => s.phase === 'validate'), 'missing validate phase');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__suggest_architecture_improvements'), 'must run suggest_architecture_improvements');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__add_library_items_normalized'), 'must place normalized library items');
  const generates = SEQUENCE.filter((s) => s.phase === 'generate');
  // 3 create paths + 1 library-placement step.
  assert(generates.length === 4, 'expected 3 create paths + 1 add-items step in generate phase');
  assert(MIN_SCORE >= 95, 'min score must be >= 95');

  console.log('');
  console.log('OK');
  process.exit(0);
}

main();
