#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-event-driven-diagrammer skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this
 * skill maps to and the canonical plan-then-build tool-call sequence the skill performs,
 * so docs and the skill body can be diffed against one source of truth. No external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success, 1 if the documented sequence drifts.
 */
'use strict';

const SKILL = 'excalidash-event-driven-diagrammer';
const MCP_PROMPT = '/mcp__excalidash__excalidash_event_driven_diagrammer';

// Fixed diagram type for this skill (event-driven / pub-sub / streaming).
const DIAGRAM_TYPE = 'event-driven';
const ARCHITECTURE_PATTERN = 'event-driven'; // apply_architecture_skill({ pattern: "event-driven" })

// Curated packs recommended for an event-driven view.
const RECOMMENDED_LIBRARIES = [
  'Software Architecture',
  'Technology Logos',
];

// Edge semantics that define this diagram type.
const EDGE_STYLES = {
  async: 'dashed', // producer -> bus, bus -> consumer (fire-and-forget events)
  sync: 'solid',   // request/response calls + bus -> event-store persist
};

const MIN_SCORE = 95;
const HARD_BLOCKERS = [
  'ARROW_TEXT_INTERSECTION', // #1 risk on fan-out
  'FRAME_TITLE_OVERLAP',
  'ITEM_OUTSIDE_FRAME',
  'TEXT_NEAR_EDGE',
];

// The five mutually exclusive create paths; exactly one runs per drawing.
const CREATE_PATHS = [
  'mcp__excalidash__apply_architecture_skill',   // pattern:"event-driven" (preferred)
  'mcp__excalidash__create_from_repo_analysis',  // analysis:{...} (reverse-engineer producers/consumers/topics)
  'mcp__excalidash__convert_diagram_type',       // targetType:"event-driven" (reshape a container/flow drawing)
  'mcp__excalidash__create_diagram_from_prompt', // diagramType:"event-driven"
  'mcp__excalidash__create_from_template',        // templateId:"event-driven"
];

// Canonical plan -> generate -> lint -> score -> repair -> validate -> save -> export sequence.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',                 note: 'load presets, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__list_templates',                 note: 'look for an event-driven/pub-sub/streaming template (optional)' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',               note: 'curated: broker, queue, topic/stream, event-store, broker logos' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',                note: 'vet candidates (aspect, stroke, fill, complexity)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                  note: 'cache vetted icons (Kafka/SNS/SQS/RabbitMQ, queue, cylinder store)' },
  { phase: 'generate', tool: 'mcp__excalidash__apply_architecture_skill',       note: 'ONE-OF: pattern:event-driven (producers L + bus C + consumers R + store + legend)' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_repo_analysis',      note: 'ONE-OF: analysis:{...} (classify publish/listener calls into producers/consumers/topics)' },
  { phase: 'generate', tool: 'mcp__excalidash__convert_diagram_type',           note: 'ONE-OF: targetType:event-driven (reshape a container/flow drawing)' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',     note: 'ONE-OF: diagramType:event-driven with explicit topic/event structure' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_template',           note: 'ONE-OF: templateId:event-driven' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized',   note: 'broker logo on bus, topic badges, event-store db-symbol, service glyphs, legend' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                   note: 'hardBlockers must end empty (watch ARROW_TEXT_INTERSECTION on fan-out)' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',                  note: 'require score >= ' + MIN_SCORE },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',                 note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',            note: 'after blockers clear; re-score; verify dashed async edges not flipped to solid' },
  { phase: 'validate', tool: 'mcp__excalidash__validate_architecture',          note: 'one bus hub; no direct producer->consumer edge; every topic has >=1 producer and >=1 consumer' },
  { phase: 'validate', tool: 'mcp__excalidash__suggest_architecture_improvements', note: 'flag orphan topics, missing DLQ, producer coupled to one consumer; apply accepted' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                   note: 'persist accepted drawing ("<System> — Event-Driven Architecture")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                   note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',                note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',                 note: 'PNG/SVG/JSON, redacted; re-scan broker SASL creds + consumer-side API keys' },
];

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('diagram type   : ' + DIAGRAM_TYPE + ' (apply_architecture_skill pattern: ' + ARCHITECTURE_PATTERN + ')');
  console.log('layout         : producers (publishers) LEFT, event bus / broker CENTER, consumers (subscribers) RIGHT, event store below/beside the bus');
  console.log('edge semantics : async = ' + EDGE_STYLES.async + ' (producer->bus, bus->consumer); sync = ' + EDGE_STYLES.sync + ' (request/response + bus->event-store)');
  console.log('invariant      : async decoupling -- no direct producer->consumer edge; everything flows through the bus; legend keys sync vs async');
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
  console.log('NOTE: prefer apply_architecture_skill({ pattern: "event-driven" }); use create_from_repo_analysis to reverse-engineer a codebase.');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');
  console.log('NOTE: every producer->bus and bus->consumer edge is DASHED (async); genuine request/response calls are SOLID; the legend keys both.');
  console.log('NOTE: a direct producer->consumer edge, an orphan topic (no consumer), or a solid edge for an event is a hard architecture failure.');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(DIAGRAM_TYPE === 'event-driven', 'diagram type must be event-driven');
  assert(ARCHITECTURE_PATTERN === 'event-driven', 'architecture pattern must be event-driven');
  assert(EDGE_STYLES.async === 'dashed', 'async edges must be dashed');
  assert(EDGE_STYLES.sync === 'solid', 'sync edges must be solid');
  assert(RECOMMENDED_LIBRARIES.length === 2, 'expected 2 recommended libraries');
  assert(RECOMMENDED_LIBRARIES.indexOf('Software Architecture') !== -1, 'Software Architecture must be a recommended pack');
  assert(RECOMMENDED_LIBRARIES.indexOf('Technology Logos') !== -1, 'Technology Logos must be a recommended pack');
  assert(CREATE_PATHS.length === 5, 'expected 5 mutually-exclusive create paths');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__apply_architecture_skill') !== -1, 'apply_architecture_skill must be a create path');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__create_from_repo_analysis') !== -1, 'create_from_repo_analysis must be a create path');
  assert(HARD_BLOCKERS.indexOf('ARROW_TEXT_INTERSECTION') !== -1, 'ARROW_TEXT_INTERSECTION must be a tracked hard blocker');
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
