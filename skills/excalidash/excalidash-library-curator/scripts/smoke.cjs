#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-library-curator skill.
 * Prints the exact MCP prompt this skill maps to and the canonical
 * tool-call sequence it performs, then exits 0. No external deps.
 */
'use strict';

const assert = require('assert');

const SKILL = 'excalidash-library-curator';
const MCP_PROMPT = '/mcp__excalidash__excalidash_library_curator';

const CURATED_PACKS = [
  'C4 Architecture',
  'Software Logos',
  'Technology Logos',
  'AWS Architecture Icons',
  'Data Platform',
];

const ICON_SLOTS = [
  'inside-card-left',
  'inside-card-top',
  'badge',
  'legend',
  'actor',
  'database-symbol',
  'cloud-provider',
];

const TOOL_SEQUENCE = [
  'mcp__excalidash__read_mcp_guide              # read MCP_LIBRARY_MODE (off|curated|required)',
  'mcp__excalidash__get_drawing                 # snapshot elements for rollback',
  'mcp__excalidash__score_drawing               # baseline: score + mathematicalEvidence',
  'mcp__excalidash__search_libraries            # per concept, across curated packs + synonyms',
  'mcp__excalidash__cache_library               # cache matched packs locally',
  'mcp__excalidash__inspect_library             # aspect/stroke/fill/complexity; reject clashing art',
  'mcp__excalidash__add_library_items_normalized # insert into icon slot, scaled + palette-recolored',
  'mcp__excalidash__score_drawing               # per item: revert any item that lowers the score',
  'mcp__excalidash__lint_drawing',
  'mcp__excalidash__repair_drawing              # one defect class at a time',
  'mcp__excalidash__score_drawing               # loop lint->repair->score until >= 95',
  'mcp__excalidash__auto_polish_drawing         # snap icons into slots; minimumScore=95, save=true',
  'mcp__excalidash__validate_architecture       # advisory legibility check',
  'mcp__excalidash__save_drawing                # only when score >= 95 and >= baseline',
  'mcp__excalidash__save_version                # note: "curate: <baseline> -> <final>; +<n> icons, <m> rejected"',
  'mcp__excalidash__get_drawing_url',
  'mcp__excalidash__export_drawing',
];

const INVARIANTS = [
  'MCP_LIBRARY_MODE read; off => primitives only, required => curated icon where one exists',
  'every icon inserted via add_library_items_normalized (never raw for placement-sensitive slots)',
  'icon placed in exactly one defined slot; never over text; never in an arrow lane',
  'any item that lowers measured score is reverted and recorded as rejected',
  'score_drawing >= 95 and not lower than pre-curation baseline',
  'hardBlockers empty; arrow-over-text intersections == 0',
  'semantics unchanged (node/edge/label counts; icons enrich existing nodes only)',
  'used/rejected ledger reported (pack:item -> slot; item -> reason)',
  'secrets redacted to [REDACTED_*] before save',
];

const REAL_TOOLS = new Set([
  'read_mcp_guide', 'create_drawing', 'get_drawing', 'update_drawing', 'save_drawing',
  'save_version', 'get_drawing_url', 'export_drawing', 'create_diagram_from_prompt',
  'search_libraries', 'inspect_library', 'cache_library', 'add_library_items',
  'add_library_items_normalized', 'lint_drawing', 'score_drawing', 'repair_drawing',
  'auto_polish_drawing', 'validate_architecture', 'apply_architecture_skill',
  'create_from_repo_analysis', 'suggest_architecture_improvements', 'list_templates',
  'create_from_template', 'convert_diagram_type',
]);

function selfCheck() {
  assert.strictEqual(REAL_TOOLS.size, 25, 'expected exactly 25 real MCP tools');
  // Every tool named in the sequence must be one of the 25 real tools.
  TOOL_SEQUENCE.forEach((line) => {
    const m = line.match(/mcp__excalidash__([a-z_]+)/);
    assert(m, 'sequence line missing mcp__excalidash__ prefix: ' + line);
    assert(REAL_TOOLS.has(m[1]), 'unknown / invented tool: ' + m[1]);
  });
  // No stub/template tokens and no apply_architecture_skill skill:/level: drift anywhere here.
  const blob = TOOL_SEQUENCE.concat(INVARIANTS, CURATED_PACKS, ICON_SLOTS).join('\n');
  [/TODO/, /FIXME/, /TBD/, /XXX/, /\bskill:\s/, /\blevel:\s/].forEach((re) =>
    assert(!re.test(blob), 'forbidden token matched: ' + re));
  assert(/score_drawing >= 95/.test(INVARIANTS.join('\n')), 'missing 95 score gate invariant');
}

function main() {
  selfCheck();
  console.log('skill: ' + SKILL);
  console.log('mcp_prompt: ' + MCP_PROMPT);
  console.log('');
  console.log('curated_packs:');
  CURATED_PACKS.forEach((p) => console.log('  - ' + p));
  console.log('');
  console.log('icon_slots:');
  ICON_SLOTS.forEach((s) => console.log('  - ' + s));
  console.log('');
  console.log('tool_call_sequence:');
  TOOL_SEQUENCE.forEach((t, i) => console.log('  ' + (i + 1) + '. ' + t));
  console.log('');
  console.log('loop: search -> cache -> inspect -> add_normalized -> score (revert if lower);');
  console.log('      then lint -> repair -> score until score >= 95 (rollback any pass that lowers score)');
  console.log('');
  console.log('save_gate_invariants:');
  INVARIANTS.forEach((inv) => console.log('  - ' + inv));
  process.exit(0);
}

main();
