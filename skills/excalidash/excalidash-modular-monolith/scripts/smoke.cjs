#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-modular-monolith skill.
 * Prints the exact MCP prompt this skill maps to and the canonical
 * tool-call sequence it performs, then exits 0. No external deps.
 */
'use strict';

const SKILL = 'excalidash-modular-monolith';
const MCP_PROMPT = '/mcp__excalidash__excalidash_modular_monolith';
const DIAGRAM_TYPE = 'modular-monolith';
const PRESET = 'architecture';

const CURATED_PACKS = [
  'Software Architecture',
  'Architecture diagram components',
  'Database/Data Platform',
  'Technology Logos',
  'Software Logos',
];

const ICON_SLOTS = [
  'inside-card-top',   // module glyph / in-process bus glyph
  'badge',             // public-API / contract marker on each module boundary
  'database-symbol',   // the SINGLE shared DB cylinder (schemas as sub-labels)
  'inside-card-left',  // the one deployable-runtime logo on the shell title band
  'actor',             // shell-edge people
  'legend',            // module / public-API / event / schema-ownership key
];

const TOOL_SEQUENCE = [
  'mcp__excalidash__read_mcp_guide               # presets, MCP_LIBRARY_MODE, scoring rubric',
  'mcp__excalidash__list_templates               # optional: look for a modular-monolith template',
  'mcp__excalidash__search_libraries             # module/component, contract, in-process bus, shared DB',
  'mcp__excalidash__inspect_library              # aspect/stroke/fill/complexity; reject clashing art',
  'mcp__excalidash__cache_library                # cache matched packs locally',
  'mcp__excalidash__apply_architecture_skill     # PRIMARY: pattern="modular-monolith" -> shell + modules + bus + 1 shared DB',
  '  # alt: create_from_repo_analysis(analysis={modules,entrypoints,database,services,integrations})  # reverse-engineer modules + schema ownership',
  '  # alt: convert_diagram_type(targetType="modular-monolith")   # collapse microservices -> 1 shell + 1 shared DB',
  '  # alt: create_diagram_from_prompt(diagramType="modular-monolith", structure={nodes,edges})',
  '  # alt: create_from_template(templateId="modular-monolith")',
  'mcp__excalidash__add_library_items_normalized # module glyphs, contract badges, ONE shared db-symbol, bus glyph',
  'mcp__excalidash__lint_drawing                 # record hardBlockers (must end empty)',
  'mcp__excalidash__score_drawing                # numeric score + every penalty',
  'mcp__excalidash__repair_drawing               # one defect class at a time (mandatory if <95 or blocker)',
  'mcp__excalidash__score_drawing                # loop lint->repair->score until >= 95 (rollback any pass that lowers it)',
  'mcp__excalidash__auto_polish_drawing          # only after blockers clear; re-score for no regression',
  'mcp__excalidash__validate_architecture        # 1 shell, 1 shared DB, per-module schemas, clean boundaries',
  'mcp__excalidash__suggest_architecture_improvements # reach-throughs, shared tables, 2nd DB, module cycles',
  'mcp__excalidash__save_drawing                 # title "<App> — Modular Monolith"',
  'mcp__excalidash__save_version                 # checkpoint accepted state',
  'mcp__excalidash__get_drawing_url',
  'mcp__excalidash__export_drawing               # svg/png/json; re-scan for shared-DB connection string',
];

const INVARIANTS = [
  'exactly ONE application-shell frame (the single deployable); every module fully inside it',
  'exactly ONE shared database; drawn as one cylinder partitioned into per-module schema lanes',
  'each module owns exactly one schema; persistence edge lands only on its own schema (no reach-through)',
  'every cross-module edge lands on another module public API (never internals, never a table)',
  'dependency edges match the allowed set; no module dependency cycle',
  'in-process event bus (NOT an external broker); publish/subscribe edges labelled',
  'no second datastore and no per-module database (that would be microservices)',
  'MCP_LIBRARY_MODE read; off => primitives only; required => curated icon where one exists',
  'hardBlockers empty (no ARROW_TEXT_INTERSECTION, FRAME_TITLE_OVERLAP, ITEM_OUTSIDE_FRAME)',
  'score_drawing >= 95; rollback any repair/polish pass that lowers the score',
  'validate_architecture clean; suggest_architecture_improvements reviewed/applied',
  'secrets redacted to [REDACTED_*] (shared-DB connection string is the leak surface) before save/export',
];

function main() {
  console.log('skill: ' + SKILL);
  console.log('mcp_prompt: ' + MCP_PROMPT);
  console.log('diagram_type: ' + DIAGRAM_TYPE);
  console.log('preset: ' + PRESET);
  console.log('');
  console.log('curated_packs:');
  CURATED_PACKS.forEach((p) => console.log('  - ' + p));
  console.log('');
  console.log('icon_slots:');
  ICON_SLOTS.forEach((s) => console.log('  - ' + s));
  console.log('');
  console.log('tool_call_sequence:');
  TOOL_SEQUENCE.forEach((t, i) => {
    if (t.trim().startsWith('#')) {
      console.log('     ' + t.trim());
    } else {
      console.log('  ' + (i + 1) + '. ' + t);
    }
  });
  console.log('');
  console.log('loop: plan -> generate (one path) -> lint -> score -> repair -> validate -> save -> export;');
  console.log('      lint -> repair -> score until score >= 95 (rollback any pass that lowers score)');
  console.log('');
  console.log('save_gate_invariants:');
  INVARIANTS.forEach((inv) => console.log('  - ' + inv));

  const assert = (cond, msg) => {
    if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); }
  };
  const seq = TOOL_SEQUENCE.join('\n');
  assert(SKILL === 'excalidash-modular-monolith', 'skill id must equal the directory name');
  assert(DIAGRAM_TYPE === 'modular-monolith', 'diagram type must be modular-monolith');
  assert(PRESET === 'architecture', 'preset must be architecture');
  assert(/apply_architecture_skill[^\n]*pattern="modular-monolith"/.test(seq),
    'apply_architecture_skill must use pattern= (never skill=/level=)');
  assert(!/\bskill="/.test(seq) && !/\blevel="/.test(seq),
    'no skill=/level= args allowed on apply_architecture_skill');
  ['read_mcp_guide', 'lint_drawing', 'score_drawing', 'repair_drawing',
   'auto_polish_drawing', 'validate_architecture', 'suggest_architecture_improvements',
   'save_drawing', 'save_version', 'get_drawing_url', 'export_drawing'].forEach((t) =>
    assert(seq.indexOf('mcp__excalidash__' + t) !== -1, 'missing tool in sequence: ' + t));
  assert(CURATED_PACKS.length >= 1, 'expected at least one curated pack');
  assert(ICON_SLOTS.indexOf('database-symbol') !== -1, 'expected database-symbol slot');
  console.log('');
  console.log('smoke: OK');
  process.exit(0);
}

main();
