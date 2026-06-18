#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-microservices-topology skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this
 * skill maps to and the canonical plan-then-build tool-call sequence the skill performs,
 * so docs and the skill body can be diffed against one source of truth. No external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success, 1 if the documented sequence drifts.
 */
'use strict';

const SKILL = 'excalidash-microservices-topology';
const MCP_PROMPT = '/mcp__excalidash__excalidash_microservices_topology';

// Fixed diagram type for this skill (microservices / service-topology).
const DIAGRAM_TYPE = 'microservices';
const ARCHITECTURE_PATTERN = 'microservices'; // apply_architecture_skill({ pattern: "microservices" })

// Curated packs recommended for a microservices topology.
const RECOMMENDED_LIBRARIES = [
  'Software Architecture',
  'Cloud/DevOps',
  'Technology Logos',
];

// Edge semantics that define this diagram type.
const EDGE_STYLES = {
  sync: 'solid',   // gateway -> service, service -> service HTTP/gRPC request/response
  async: 'dashed', // service -> queue/bus, queue/bus -> service (fire-and-forget events)
};

// Hard topology invariants for this skill.
const INVARIANTS = [
  'one API gateway is the single front door at the TOP',
  'services are laid out in a ROW beneath the gateway',
  'each service owns exactly one datastore (database-per-service)',
  'no shared datastore and no cross-service direct DB access',
  'each bounded service lives in its own frame (service + its store)',
  'async service-to-service traffic flows through the queue / event bus (dashed)',
  'legend keys sync (solid) vs async (dashed)',
];

const MIN_SCORE = 95;
const HARD_BLOCKERS = [
  'ARROW_TEXT_INTERSECTION', // #1 risk on gateway fan-out / async edges
  'FRAME_TITLE_OVERLAP',
  'ITEM_OUTSIDE_FRAME',
  'TEXT_NEAR_EDGE',
];

// The five mutually exclusive create paths; exactly one runs per drawing.
const CREATE_PATHS = [
  'mcp__excalidash__apply_architecture_skill',   // pattern:"microservices" (preferred)
  'mcp__excalidash__create_from_repo_analysis',  // analysis:{modules,entrypoints,database,services,integrations} (reverse-engineer)
  'mcp__excalidash__convert_diagram_type',       // targetType:"microservices" (reshape a container/flow drawing)
  'mcp__excalidash__create_diagram_from_prompt', // diagramType:"microservices" with structure:{nodes,edges}
  'mcp__excalidash__create_from_template',        // templateId:"microservices"
];

// Canonical plan -> generate -> lint -> score -> repair -> validate -> save -> export sequence.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',                 note: 'load presets, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__list_templates',                 note: 'look for a microservices/service-topology template (optional)' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',               note: 'curated: gateway, service, database, cache, queue/event-bus glyphs + logos' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',                note: 'vet candidates (aspect, stroke, fill, complexity)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                  note: 'cache vetted icons (Kong/AWS-API-GW/nginx, Postgres/MySQL/Redis, RabbitMQ/Kafka/SQS)' },
  { phase: 'generate', tool: 'mcp__excalidash__apply_architecture_skill',       note: 'ONE-OF: pattern:microservices (gateway TOP + services ROW + per-service stores + frames + bus + legend)' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_repo_analysis',      note: 'ONE-OF: analysis:{modules,entrypoints,database,services,integrations} (map deployables to owned stores, classify sync HTTP/gRPC vs async broker)' },
  { phase: 'generate', tool: 'mcp__excalidash__convert_diagram_type',           note: 'ONE-OF: targetType:microservices (reshape a container/flow drawing)' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',     note: 'ONE-OF: diagramType:microservices with explicit structure:{nodes,edges} gateway/services/stores/bus' },
  { phase: 'generate', tool: 'mcp__excalidash__create_from_template',           note: 'ONE-OF: templateId:microservices' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized',   note: 'gateway logo, service glyphs, per-service db-symbols, Redis badge, broker logo, legend' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                   note: 'hardBlockers must end empty (watch ARROW_TEXT_INTERSECTION on gateway fan-out / async edges)' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',                  note: 'require score >= ' + MIN_SCORE },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',                 note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',            note: 'after blockers clear; re-score; verify frames not merged + dashed async edges not flipped to solid' },
  { phase: 'validate', tool: 'mcp__excalidash__validate_architecture',          note: 'one gateway hub; every service owns exactly one store; no shared/cross-service DB; async via bus' },
  { phase: 'validate', tool: 'mcp__excalidash__suggest_architecture_improvements', note: 'flag shared DB, service bypassing gateway, missing circuit-breaker/DLQ, chatty sync chain; apply accepted' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                   note: 'persist accepted drawing ("<System> — Microservices Topology")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                   note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',                note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',                 note: 'PNG/SVG/JSON, redacted; re-scan per-service DB URLs + gateway/broker creds' },
];

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('diagram type   : ' + DIAGRAM_TYPE + ' (apply_architecture_skill pattern: ' + ARCHITECTURE_PATTERN + ')');
  console.log('layout         : API gateway TOP (single front door), services in a ROW below, each service\'s OWN datastore directly under it inside its own frame, queue / event bus for async edges');
  console.log('edge semantics : sync = ' + EDGE_STYLES.sync + ' (gateway->service, service->service HTTP/gRPC); async = ' + EDGE_STYLES.async + ' (service<->queue/bus events)');
  console.log('invariant      : database-per-service -- no shared DB, no cross-service DB access; gateway fronts every service; legend keys sync vs async');
  console.log('curated libs   : ' + RECOMMENDED_LIBRARIES.join(', '));
  console.log('min score      : ' + MIN_SCORE + ' (zero hard blockers)');
  console.log('hard blockers  : ' + HARD_BLOCKERS.join(', '));
  console.log('create paths   : ' + CREATE_PATHS.join(', '));
  console.log('');
  console.log('## Topology invariants');
  INVARIANTS.forEach(function (inv, i) {
    console.log((i + 1) + '. ' + inv);
  });
  console.log('');
  console.log('## Plan -> build -> quality-loop sequence');
  SEQUENCE.forEach(function (step, i) {
    const n = String(i + 1).padStart(2, ' ');
    console.log(n + '. [' + step.phase + '] ' + step.tool + '  -- ' + step.note);
  });
  console.log('');
  console.log('NOTE: the five generate create paths are ONE-OF; exactly one create path runs per drawing.');
  console.log('NOTE: prefer apply_architecture_skill({ pattern: "microservices" }); use create_from_repo_analysis to reverse-engineer a codebase.');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');
  console.log('NOTE: each service owns exactly ONE datastore (database-per-service); gateway->service and service->service HTTP/gRPC are SOLID; queue/event edges are DASHED; the legend keys both.');
  console.log('NOTE: a shared database, a cross-service DB access, a service bypassing the gateway, or a solid edge for an async message is a hard architecture failure.');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(DIAGRAM_TYPE === 'microservices', 'diagram type must be microservices');
  assert(ARCHITECTURE_PATTERN === 'microservices', 'architecture pattern must be microservices');
  assert(EDGE_STYLES.sync === 'solid', 'sync edges must be solid');
  assert(EDGE_STYLES.async === 'dashed', 'async edges must be dashed');
  assert(RECOMMENDED_LIBRARIES.length === 3, 'expected 3 recommended libraries');
  assert(RECOMMENDED_LIBRARIES.indexOf('Software Architecture') !== -1, 'Software Architecture must be a recommended pack');
  assert(RECOMMENDED_LIBRARIES.indexOf('Cloud/DevOps') !== -1, 'Cloud/DevOps must be a recommended pack');
  assert(RECOMMENDED_LIBRARIES.indexOf('Technology Logos') !== -1, 'Technology Logos must be a recommended pack');
  assert(CREATE_PATHS.length === 5, 'expected 5 mutually-exclusive create paths');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__apply_architecture_skill') !== -1, 'apply_architecture_skill must be a create path');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__create_from_repo_analysis') !== -1, 'create_from_repo_analysis must be a create path');
  assert(HARD_BLOCKERS.indexOf('ARROW_TEXT_INTERSECTION') !== -1, 'ARROW_TEXT_INTERSECTION must be a tracked hard blocker');
  assert(INVARIANTS.length === 7, 'expected 7 topology invariants');
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
