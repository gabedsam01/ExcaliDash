#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-clean-architecture-reviewer skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this
 * skill maps to and the canonical plan-then-build tool-call sequence the skill performs,
 * so docs and the skill body can be diffed against one source of truth. No external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success, 1 if the doc model drifts.
 */
'use strict';

const SKILL = 'excalidash-clean-architecture-reviewer';
const MCP_PROMPT = '/mcp__excalidash__excalidash_clean_architecture_reviewer';

// The four canonical Clean Architecture rings, outermost -> innermost is reversed here
// (innermost first) so the array index doubles as the inward-dependency rank.
const RINGS = [
  'Entities (Enterprise Business Rules)',
  'Use Cases (Application Business Rules)',
  'Interface Adapters',
  'Frameworks & Drivers',
];

// The single hard invariant this skill enforces.
const DEPENDENCY_RULE = 'cross-ring edges point INWARD only (outward edge = violation)';

// Curated packs recommended for this reviewer.
const RECOMMENDED_LIBRARIES = [
  'Software Architecture',
  'Architecture diagram components',
];

// Canonical plan -> generate -> lint -> score -> repair -> validate -> review -> save -> export.
// The create step is ONE-OF (exactly one path runs per drawing).
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',                  note: 'load presets, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__list_templates',                  note: 'match a clean-architecture/onion template (optional)' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',                note: 'curated packs: ring/port/gateway/controller icons' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',                 note: 'vet candidate icons (aspect/stroke/fill/complexity)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                   note: 'cache vetted icons' },
  { phase: 'generate', tool: 'mcp__excalidash__apply_architecture_skill',        note: 'ONE-OF create path (pattern:"clean", preferred — ring skeleton)' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_repo_analysis',       note: 'ONE-OF create path (reverse-engineer rings from a repo)' },
  { phase: 'generate', tool: 'mcp__excalidash__convert_diagram_type',            note: 'ONE-OF create path (reshape existing onion/layered -> clean)' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',      note: 'ONE-OF create path (diagramType:"clean", prompt-driven structure)' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_template',            note: 'ONE-OF create path (clean-architecture template)' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized',    note: 'place normalized ring/port/adapter/framework icons in slots' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                    note: 'hardBlockers must end empty' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',                   note: 'require score >= 95' },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',                  note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',            note: 'after blockers clear; re-score for no regression' },
  { phase: 'validate', tool: 'mcp__excalidash__validate_architecture',           note: 'Dependency Rule: four rings, inward-only edges, outwardEdges==0' },
  { phase: 'review',   tool: 'mcp__excalidash__suggest_architecture_improvements', note: 'flag outward leaks, missing ports, framework-in-core; apply & re-loop' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                    note: 'persist accepted drawing ("<System> — Clean Architecture")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                    note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',                 note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',                  note: 'PNG/SVG/JSON, redacted; re-scan for secrets (gateway/DB URLs)' },
];

const HARD_BLOCKERS = ['ARROW_TEXT_INTERSECTION', 'FRAME_TITLE_OVERLAP', 'ITEM_OUTSIDE_FRAME'];
const MIN_SCORE = 95;

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('rings          : ' + RINGS.join(' -> '));
  console.log('dependency rule: ' + DEPENDENCY_RULE);
  console.log('curated libs   : ' + RECOMMENDED_LIBRARIES.join(', '));
  console.log('min score      : ' + MIN_SCORE + ' (zero hard blockers, outwardEdges == 0)');
  console.log('hard blockers  : ' + HARD_BLOCKERS.join(', '));
  console.log('');
  console.log('## Plan -> build -> quality-loop -> review sequence');
  SEQUENCE.forEach(function (step, i) {
    const n = String(i + 1).padStart(2, ' ');
    console.log(n + '. [' + step.phase + '] ' + step.tool + '  -- ' + step.note);
  });
  console.log('');
  console.log('NOTE: the five generate "create" steps are ONE-OF; exactly one create path runs per drawing.');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');
  console.log('NOTE: validate_architecture must report outwardEdges == 0 (Dependency Rule); fix by inverting via a port.');

  // Minimal self-checks so the smoke fails loudly if the doc model drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(RINGS.length === 4, 'expected exactly 4 Clean Architecture rings');
  assert(RINGS[0].indexOf('Entities') === 0, 'innermost ring must be Entities (core)');
  assert(RINGS[3].indexOf('Frameworks') === 0, 'outermost ring must be Frameworks & Drivers');
  assert(RECOMMENDED_LIBRARIES.length === 2, 'expected 2 recommended curated libraries');
  assert(SEQUENCE.some((s) => s.phase === 'lint'), 'missing lint phase');
  assert(SEQUENCE.some((s) => s.phase === 'score'), 'missing score phase');
  assert(SEQUENCE.some((s) => s.phase === 'repair'), 'missing repair phase');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__apply_architecture_skill'), 'must offer apply_architecture_skill (pattern:"clean")');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__validate_architecture'), 'must validate the Dependency Rule');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__suggest_architecture_improvements'), 'must run suggest_architecture_improvements');
  const createPaths = SEQUENCE.filter((s) => s.phase === 'generate'
    && (s.tool.indexOf('create') !== -1 || s.tool.indexOf('convert') !== -1 || s.tool.indexOf('apply_architecture_skill') !== -1));
  assert(createPaths.length >= 5, 'expected at least 5 ONE-OF create/convert/apply paths');
  assert(MIN_SCORE >= 95, 'min score must be >= 95');

  console.log('');
  console.log('OK');
  process.exit(0);
}

main();
