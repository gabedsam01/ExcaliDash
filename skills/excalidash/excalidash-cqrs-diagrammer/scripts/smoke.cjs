#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-cqrs-diagrammer skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this
 * skill maps to and the canonical plan-then-build tool-call sequence the skill performs,
 * so docs and the skill body can be diffed against one source of truth. No external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success, 1 if the documented sequence drifts.
 */
'use strict';

const SKILL = 'excalidash-cqrs-diagrammer';
const MCP_PROMPT = '/mcp__excalidash__excalidash_cqrs_diagrammer';

// Fixed diagram type for this skill (Command-Query Responsibility Segregation).
const DIAGRAM_TYPE = 'cqrs';
const ARCHITECTURE_PATTERN = 'cqrs'; // apply_architecture_skill({ pattern: "cqrs" })

// Curated packs recommended for a CQRS write/read split.
const RECOMMENDED_LIBRARIES = [
  'Software Architecture',
];

// The five mutually exclusive create paths; exactly one runs per drawing.
const CREATE_PATHS = [
  'mcp__excalidash__apply_architecture_skill',   // pattern:"cqrs" (preferred)
  'mcp__excalidash__create_from_repo_analysis',  // target:"cqrs" (reverse-engineer a codebase)
  'mcp__excalidash__convert_diagram_type',       // targetType:"cqrs" (reshape a container/event-driven drawing)
  'mcp__excalidash__create_diagram_from_prompt', // type:"cqrs"
  'mcp__excalidash__create_from_template',        // templateId:"cqrs"
];

// Canonical plan -> generate -> lint -> score -> repair -> validate -> save -> export sequence.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',                note: 'load presets, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__list_templates',                note: 'look for a cqrs/command-query template (optional)' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',              note: 'curated: command-bus, handler, aggregate, event-store/bus, projection, read/write db, query glyphs' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',               note: 'vet candidates (aspect, stroke, fill, complexity)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                 note: 'cache vetted icons' },
  { phase: 'generate', tool: 'mcp__excalidash__apply_architecture_skill',      note: 'ONE-OF: pattern:cqrs (write lane top + read lane bottom + shared event bus + legend)' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_repo_analysis',     note: 'ONE-OF: analysis:{modules,entrypoints,database,services,integrations} (classify command/query handlers, write model, projections, read model)' },
  { phase: 'generate', tool: 'mcp__excalidash__convert_diagram_type',          note: 'ONE-OF: targetType:cqrs (reshape a container/event-driven drawing)' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',    note: 'ONE-OF: diagramType:cqrs with explicit command/event/query structure' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_template',          note: 'ONE-OF: templateId:cqrs' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized',  note: 'handler/aggregate/projection/query glyphs, event-bus glyph, TWO db-symbols (write + read)' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                  note: 'hardBlockers must end empty' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',                 note: 'require score >= 95' },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',               note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',          note: 'after blockers clear; re-score for no regression; verify lanes stay separate' },
  { phase: 'validate', tool: 'mcp__excalidash__validate_architecture',        note: 'two lanes; write model != read model; bus->projection is the single bridge; no command->read, no query->write' },
  { phase: 'validate', tool: 'mcp__excalidash__suggest_architecture_improvements', note: 'flag shared model, unfed read model, orphan projection, missing consistency note; apply accepted' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                 note: 'persist accepted drawing ("<System> — CQRS (Command/Query Segregation)")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                 note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',              note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',              note: 'PNG/SVG/JSON, redacted; re-scan write-store AND read-store DB URLs + broker creds' },
];

const HARD_BLOCKERS = ['ARROW_TEXT_INTERSECTION', 'FRAME_TITLE_OVERLAP', 'ITEM_OUTSIDE_FRAME'];
const MIN_SCORE = 95;

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('diagram type   : ' + DIAGRAM_TYPE + ' (apply_architecture_skill pattern: ' + ARCHITECTURE_PATTERN + ')');
  console.log('layout         : WRITE (command) lane TOP left->right; READ (query) lane BOTTOM; event bus/store between as the single bridge');
  console.log('invariant      : segregation -- write model != read model; bus->projection is the only cross-lane edge; no command reads / no query writes the other side');
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
  console.log('NOTE: prefer apply_architecture_skill({ pattern: "cqrs" }); use create_from_repo_analysis to reverse-engineer a codebase.');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');
  console.log('NOTE: the WRITE lane (Command -> Handler -> Write Model -> Event Bus) sits on top; the READ lane (Bus -> Projection -> Read Model -> Query Handler -> Query) sits on the bottom.');
  console.log('NOTE: the bus->projection edge is the SINGLE bridge and is marked eventually consistent; a shared model or a command->read / query->write edge is a hard architecture failure.');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(MCP_PROMPT === '/mcp__excalidash__excalidash_cqrs_diagrammer', 'mcp prompt id must match the skill');
  assert(DIAGRAM_TYPE === 'cqrs', 'diagram type must be cqrs');
  assert(ARCHITECTURE_PATTERN === 'cqrs', 'architecture pattern must be cqrs');
  assert(RECOMMENDED_LIBRARIES.length === 1, 'expected 1 recommended library');
  assert(RECOMMENDED_LIBRARIES.indexOf('Software Architecture') !== -1, 'Software Architecture must be the recommended pack');
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
