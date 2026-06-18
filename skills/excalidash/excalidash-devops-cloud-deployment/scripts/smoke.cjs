#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-devops-cloud-deployment skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this
 * skill maps to and the canonical plan-then-build tool-call sequence the skill performs,
 * so docs and the skill body can be diffed against one source of truth. No external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success, 1 if the documented sequence drifts.
 */
'use strict';

const SKILL = 'excalidash-devops-cloud-deployment';
const MCP_PROMPT = '/mcp__excalidash__excalidash_devops_cloud_deployment';

// Fixed diagram type/direction for this skill.
const DIAGRAM_TYPE = 'deployment';
const DIRECTION = 'LR';
const PRESET = 'technical-docs';

// Curated packs recommended for a CI/CD + cloud deployment topology.
const RECOMMENDED_LIBRARIES = [
  'Cloud/DevOps',
  'Technology Logos',
  'Software Architecture',
];

// The three mutually exclusive create paths; exactly one runs per drawing.
const CREATE_PATHS = [
  'mcp__excalidash__create_diagram_from_prompt',  // diagramType:"deployment", direction:"LR", structure
  'mcp__excalidash__create_from_repo_analysis',   // build from a supplied repo analysis, then frame into envs
  'mcp__excalidash__convert_diagram_type',        // re-cast an existing architecture/microservices drawing
];

// Canonical plan -> generate -> lint -> score -> repair -> validate -> save -> export sequence.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',                 note: 'load presets, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',               note: 'curated: provider marks, k8s, load balancer, managed stores, logos' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',                note: 'vet candidates (aspect, stroke, fill, complexity)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                  note: 'cache vetted icons' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',     note: 'ONE-OF: diagramType:deployment, direction:LR, structure' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_repo_analysis',      note: 'ONE-OF: from repo analysis, then frame into environments' },
  { phase: 'generate', tool: 'mcp__excalidash__convert_diagram_type',           note: 'ONE-OF: targetType:deployment from an existing drawing' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized',   note: 'provider logo (cloud-provider), cluster/registry glyph, managed-store symbol' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                   note: 'hardBlockers must end empty' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',                  note: 'require score >= 95' },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',                 note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',            note: 'after blockers clear; re-score for no regression' },
  { phase: 'validate', tool: 'mcp__excalidash__validate_architecture',          note: 'registry hinge, forward-only promotion, managed outside cluster' },
  { phase: 'validate', tool: 'mcp__excalidash__suggest_architecture_improvements', note: 'review topology smells (canary, missing LB, env gaps)' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                   note: 'persist accepted drawing ("<System> — CI/CD & Deployment")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                   note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',                note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',                 note: 'PNG/SVG/excalidraw, redacted; re-scan registry tokens/DB URLs/provider keys' },
];

const HARD_BLOCKERS = ['ARROW_TEXT_INTERSECTION', 'FRAME_TITLE_OVERLAP', 'ITEM_OUTSIDE_FRAME'];
const MIN_SCORE = 95;

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('diagram type   : ' + DIAGRAM_TYPE + ' (direction: ' + DIRECTION + ', preset: ' + PRESET + ')');
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
  console.log('NOTE: pipeline stages read strictly left-to-right and end at the registry (the single runtime hinge).');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');
  console.log('NOTE: promotion (dev->stage->prod) flows forward only; managed services sit in the zone but outside the cluster.');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(DIAGRAM_TYPE === 'deployment', 'diagram type must be deployment');
  assert(DIRECTION === 'LR', 'direction must be LR');
  assert(PRESET === 'technical-docs', 'preset must be technical-docs');
  assert(RECOMMENDED_LIBRARIES.length === 3, 'expected 3 recommended libraries');
  assert(RECOMMENDED_LIBRARIES[0] === 'Cloud/DevOps', 'Cloud/DevOps must be the primary library');
  assert(CREATE_PATHS.length === 3, 'expected 3 mutually-exclusive create paths');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__create_diagram_from_prompt') !== -1, 'create_diagram_from_prompt must be a create path');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__create_from_repo_analysis') !== -1, 'create_from_repo_analysis must be a create path');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__convert_diagram_type') !== -1, 'convert_diagram_type must be a create path');
  assert(SEQUENCE.some((s) => s.phase === 'lint'), 'missing lint phase');
  assert(SEQUENCE.some((s) => s.phase === 'score'), 'missing score phase');
  assert(SEQUENCE.some((s) => s.phase === 'repair'), 'missing repair phase');
  assert(SEQUENCE.some((s) => s.phase === 'validate'), 'missing validate phase');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__validate_architecture'), 'must validate architecture');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__add_library_items_normalized'), 'must place normalized library items');
  const generates = SEQUENCE.filter((s) => s.phase === 'generate');
  // 3 create paths + 1 library-placement step.
  assert(generates.length === 4, 'expected 3 create paths + 1 add-items step in generate phase');
  // Every tool referenced must be a real mcp__excalidash__ tool name.
  SEQUENCE.forEach((s) => assert(/^mcp__excalidash__[a-z_]+$/.test(s.tool), 'non-real tool name: ' + s.tool));
  CREATE_PATHS.forEach((t) => assert(/^mcp__excalidash__[a-z_]+$/.test(t), 'non-real create path: ' + t));
  assert(MIN_SCORE >= 95, 'min score must be >= 95');

  console.log('');
  console.log('OK');
  process.exit(0);
}

main();
