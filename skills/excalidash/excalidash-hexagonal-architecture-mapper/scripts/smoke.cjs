#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-hexagonal-architecture-mapper skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this
 * skill maps to and the canonical plan-then-build tool-call sequence the skill performs,
 * so docs and the skill body can be diffed against one source of truth. No external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success, 1 if the documented sequence drifts.
 */
'use strict';

const SKILL = 'excalidash-hexagonal-architecture-mapper';
const MCP_PROMPT = '/mcp__excalidash__excalidash_hexagonal_architecture_mapper';

// Fixed diagram type for this skill (ports & adapters / hexagonal).
const DIAGRAM_TYPE = 'hexagonal';
const ARCHITECTURE_PATTERN = 'hexagonal'; // apply_architecture_skill({ pattern: "hexagonal" })

// Curated packs recommended for a ports & adapters view.
const RECOMMENDED_LIBRARIES = [
  'Software Architecture',
  'Architecture diagram components',
];

// The five mutually exclusive create paths; exactly one runs per drawing.
const CREATE_PATHS = [
  'mcp__excalidash__apply_architecture_skill',   // pattern:"hexagonal" (preferred)
  'mcp__excalidash__create_from_repo_analysis',  // analysis:{ modules, entrypoints, database, services, integrations }
  'mcp__excalidash__convert_diagram_type',       // structure + targetType:"hexagonal" (reshape a clean/layered drawing)
  'mcp__excalidash__create_diagram_from_prompt', // diagramType:"hexagonal", structure:{ nodes, edges }
  'mcp__excalidash__create_from_template',        // templateId:"hexagonal"
];

// Canonical plan -> generate -> lint -> score -> repair -> validate -> save -> export sequence.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',                note: 'load presets, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__list_templates',                note: 'look for a hexagonal/ports-and-adapters template (optional)' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',              note: 'curated: port/plug, repository, queue/consumer, db, SaaS logos' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',               note: 'vet candidates (aspect, stroke, fill, complexity)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                 note: 'cache vetted icons' },
  { phase: 'generate', tool: 'mcp__excalidash__apply_architecture_skill',      note: 'ONE-OF: pattern:hexagonal (core + L/R lanes + port stubs + legend)' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_repo_analysis',     note: 'ONE-OF: analysis:{modules,entrypoints,database,services,integrations} (reverse-engineer a codebase)' },
  { phase: 'generate', tool: 'mcp__excalidash__convert_diagram_type',          note: 'ONE-OF: structure + targetType:hexagonal (reshape a clean/layered drawing)' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',    note: 'ONE-OF: diagramType:hexagonal with explicit port/adapter structure' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_template',          note: 'ONE-OF: templateId:hexagonal' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized',  note: 'port/plug badges, adapter glyphs, db-symbol, driven-side logos' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                  note: 'hardBlockers must end empty' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',                 note: 'require score >= 95' },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',               note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',          note: 'after blockers clear; re-score for no regression' },
  { phase: 'validate', tool: 'mcp__excalidash__validate_architecture',        note: 'dependency inversion: all edges inward; core owns driven ports; no framework in core' },
  { phase: 'validate', tool: 'mcp__excalidash__suggest_architecture_improvements', note: 'flag outward leaks, missing ports, fat adapters; apply accepted' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                 note: 'persist accepted drawing ("<App> — Hexagonal (Ports & Adapters)")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                 note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',              note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',              note: 'PNG/SVG/JSON, redacted; re-scan driven-side DB URLs/SaaS keys' },
];

const HARD_BLOCKERS = ['ARROW_TEXT_INTERSECTION', 'FRAME_TITLE_OVERLAP', 'ITEM_OUTSIDE_FRAME'];
const MIN_SCORE = 95;

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('diagram type   : ' + DIAGRAM_TYPE + ' (apply_architecture_skill pattern: ' + ARCHITECTURE_PATTERN + ')');
  console.log('layout         : driving (primary) adapters LEFT, domain core CENTER, driven (secondary) adapters RIGHT');
  console.log('invariant      : dependency inversion -- every edge points toward the hexagon; core owns its driven ports');
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
  console.log('NOTE: the five generate create paths are ONE-OF; exactly one create path runs per drawing.');
  console.log('NOTE: prefer apply_architecture_skill({ pattern: "hexagonal" }); use create_from_repo_analysis to reverse-engineer a codebase.');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');
  console.log('NOTE: driving ports on the LEFT hexagon face, driven ports on the RIGHT face; arrows land on port stubs, never on domain objects.');
  console.log('NOTE: an outward edge (core -> adapter) or a framework/SaaS logo inside the core is a hard architecture failure.');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(DIAGRAM_TYPE === 'hexagonal', 'diagram type must be hexagonal');
  assert(ARCHITECTURE_PATTERN === 'hexagonal', 'architecture pattern must be hexagonal');
  assert(RECOMMENDED_LIBRARIES.length === 2, 'expected 2 recommended libraries');
  assert(RECOMMENDED_LIBRARIES.indexOf('Software Architecture') !== -1, 'Software Architecture must be a recommended pack');
  assert(RECOMMENDED_LIBRARIES.indexOf('Architecture diagram components') !== -1, 'Architecture diagram components must be a recommended pack');
  assert(CREATE_PATHS.length === 5, 'expected 5 mutually-exclusive create paths');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__apply_architecture_skill') !== -1, 'apply_architecture_skill must be a create path');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__create_from_repo_analysis') !== -1, 'create_from_repo_analysis must be a create path');
  assert(SEQUENCE.some((s) => s.phase === 'lint'), 'missing lint phase');
  assert(SEQUENCE.some((s) => s.phase === 'score'), 'missing score phase');
  assert(SEQUENCE.some((s) => s.phase === 'repair'), 'missing repair phase');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__validate_architecture'), 'missing validate_architecture');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__add_library_items_normalized'), 'must place normalized library items');
  const generates = SEQUENCE.filter((s) => s.phase === 'generate');
  // 5 create paths + 1 library-placement step.
  assert(generates.length === 6, 'expected 5 create paths + 1 add-items step in generate phase');
  assert(MIN_SCORE >= 95, 'min score must be >= 95');

  console.log('');
  console.log('OK');
  process.exit(0);
}

main();
