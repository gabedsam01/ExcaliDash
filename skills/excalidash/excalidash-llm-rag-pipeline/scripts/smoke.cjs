#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-llm-rag-pipeline skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this skill
 * maps to and the canonical plan-then-build tool-call sequence the skill performs, so docs
 * and the skill body can be diffed against one source of truth. No external deps, no network.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success, 1 if the documented sequence drifts.
 */
'use strict';

const SKILL = 'excalidash-llm-rag-pipeline';
const MCP_PROMPT = '/mcp__excalidash__excalidash_llm_rag_pipeline';

// Fixed diagram type/direction for this flow skill.
const DIAGRAM_TYPE = 'flowchart';
const DIRECTION = 'LR';

// Curated packs recommended for a RAG / LLM data-flow.
const RECOMMENDED_LIBRARIES = [
  'Flow Chart Symbols',
  'Technology Logos',
  'Data Flow',
];

// The two distinct flows this skill always draws.
const PATHS = [
  { name: 'index', style: 'dashed', note: 'ingest -> chunk -> embed -> upsert into vector store (async)' },
  { name: 'query', style: 'solid',  note: 'query -> embed -> retrieve -> assemble -> prompt -> LLM -> eval -> response' },
];

// The non-happy branches that must be first-class.
const BRANCHES = ['cache-hit', 'retrieval-miss', 'guardrail/error'];

// Single create path for this skill (NOT one-of; exactly one create call covers both paths).
const CREATE_PATH = 'mcp__excalidash__create_diagram_from_prompt';

// Canonical plan -> generate -> place -> lint -> score -> repair -> polish -> validate -> save -> export.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',                note: 'load presets, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',              note: 'curated: process, decision, data-store, provider logos' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',               note: 'vet candidates (aspect, stroke, fill, complexity)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                 note: 'cache vetted icons' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',    note: 'ONE call: structure{nodes,edges}, flowchart, LR; dashed index + solid query' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized',  note: 'data-store for vector store, decision glyphs, provider logos' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                  note: 'hardBlockers must end empty' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',                 note: 'require score >= 95' },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',                note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',           note: 'after blockers clear; re-score for no regression' },
  { phase: 'validate', tool: 'mcp__excalidash__validate_architecture',         note: 'no orphan stage; every path and branch reaches a terminal' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                  note: 'persist accepted drawing ("<System> — RAG Pipeline")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                  note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',               note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',                note: 'SVG/PNG/excalidraw, redacted; re-scan vector-DB URLs/provider keys' },
];

const HARD_BLOCKERS = ['ARROW_TEXT_INTERSECTION', 'FRAME_TITLE_OVERLAP', 'ITEM_OUTSIDE_FRAME'];
const PENALTIES = ['SMALL_FONT', 'HIGH_DENSITY', 'TEXT_NEAR_EDGE'];
const MIN_SCORE = 95;

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('diagram type   : ' + DIAGRAM_TYPE + ' (direction: ' + DIRECTION + ')');
  console.log('curated libs   : ' + RECOMMENDED_LIBRARIES.join(', '));
  console.log('paths          : ' + PATHS.map((p) => p.name + '(' + p.style + ')').join(', '));
  console.log('branches       : ' + BRANCHES.join(', '));
  console.log('create path    : ' + CREATE_PATH);
  console.log('min score      : ' + MIN_SCORE + ' (zero hard blockers)');
  console.log('hard blockers  : ' + HARD_BLOCKERS.join(', '));
  console.log('penalties      : ' + PENALTIES.join(', '));
  console.log('');
  console.log('## Plan -> build -> quality-loop sequence');
  SEQUENCE.forEach(function (step, i) {
    const n = String(i + 1).padStart(2, ' ');
    console.log(n + '. [' + step.phase + '] ' + step.tool + '  -- ' + step.note);
  });
  console.log('');
  console.log('NOTE: exactly one create_diagram_from_prompt call covers BOTH paths and ALL branches.');
  console.log('NOTE: index-path edges are dashed; query-path edges are solid; the legend keys both.');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');
  console.log('NOTE: the vector store is a data store; every secret is a [REDACTED_<TYPE>] placeholder.');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(SKILL === 'excalidash-llm-rag-pipeline', 'skill id must match directory name');
  assert(MCP_PROMPT === '/mcp__excalidash__excalidash_llm_rag_pipeline', 'mcp prompt mapping must match');
  assert(DIAGRAM_TYPE === 'flowchart', 'diagram type must be flowchart');
  assert(DIRECTION === 'LR', 'direction must be LR');
  assert(RECOMMENDED_LIBRARIES.length === 3, 'expected 3 recommended libraries');
  assert(PATHS.length === 2, 'expected exactly two paths (index, query)');
  assert(PATHS.some((p) => p.name === 'index' && p.style === 'dashed'), 'index path must be dashed');
  assert(PATHS.some((p) => p.name === 'query' && p.style === 'solid'), 'query path must be solid');
  assert(BRANCHES.length === 3, 'expected cache-hit, retrieval-miss, guardrail/error branches');
  assert(CREATE_PATH === 'mcp__excalidash__create_diagram_from_prompt', 'single create path must be create_diagram_from_prompt');
  assert(SEQUENCE.filter((s) => s.tool === CREATE_PATH).length === 1, 'exactly one create call');
  assert(SEQUENCE.some((s) => s.phase === 'lint'), 'missing lint phase');
  assert(SEQUENCE.some((s) => s.phase === 'score'), 'missing score phase');
  assert(SEQUENCE.some((s) => s.phase === 'repair'), 'missing repair phase');
  assert(SEQUENCE.some((s) => s.phase === 'polish'), 'missing polish phase');
  assert(SEQUENCE.some((s) => s.phase === 'validate'), 'missing validate phase');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__add_library_items_normalized'), 'must place normalized library items');
  assert(HARD_BLOCKERS.length === 3, 'expected 3 hard blockers');
  assert(MIN_SCORE >= 95, 'min score must be >= 95');

  console.log('');
  console.log('OK');
  process.exit(0);
}

main();
