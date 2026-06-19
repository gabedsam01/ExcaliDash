#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-auth-api-key-boundaries skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this
 * skill maps to, the curated libraries, and the canonical plan-then-build tool-call
 * sequence the skill performs, so docs and the skill body can be diffed against one
 * source of truth. No network, no external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success, 1 if the documented sequence drifts.
 */
'use strict';

const SKILL = 'excalidash-auth-api-key-boundaries';
const MCP_PROMPT = '/mcp__excalidash__excalidash_auth_api_key_boundaries';

// Fixed diagram type + theme for this skill.
const DIAGRAM_TYPE = 'security';
const THEME = 'auth-api-key-bearer-trust-boundary';

// The three trust zones this skill always models.
const ZONES = ['public', 'boundary', 'authenticated'];

// Controls that live on the boundary frame.
const BOUNDARY_CONTROLS = [
  'verify-key (HMAC compare)',
  'scope / RBAC',
  'rate-limit',
  'audit-log',
  'rotate / revoke',
  'vault (HMAC/JWT secret)',
];

// Curated packs recommended for an auth / API-key boundary view.
const RECOMMENDED_LIBRARIES = [
  'Cloud Design Patterns',
  'AWS Architecture Icons',
  'Software Architecture',
];

// The two mutually exclusive create paths; exactly one runs per drawing.
const CREATE_PATHS = [
  'mcp__excalidash__create_diagram_from_prompt',  // diagramType:"security" with public/boundary/authenticated structure
  'mcp__excalidash__apply_architecture_skill',    // pattern:"hexagonal" (auth as inbound adapter) — pattern arg ONLY
];

// Canonical plan -> generate -> lint -> score -> repair -> validate -> save -> export sequence.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',                note: 'load presets, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',              note: 'curated: gateway, key/lock, throttle, audit, vault' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',               note: 'vet candidates (aspect, stroke, fill, complexity)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                 note: 'cache vetted icons' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',    note: 'ONE-OF: diagramType:security, public/boundary/authenticated structure' },
  { phase: 'generate', tool: 'mcp__excalidash__apply_architecture_skill',      note: 'ONE-OF: pattern:hexagonal (auth as inbound adapter) — pattern arg only' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized',  note: 'gateway, key/lock, throttle, audit, vault icons in slots' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                  note: 'hardBlockers must end empty' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',                 note: 'require score >= 95' },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',                note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',           note: 'after blockers clear; re-score for no regression' },
  { phase: 'validate', tool: 'mcp__excalidash__validate_architecture',         note: 'one boundary; services inside; no public->protected bypass' },
  { phase: 'validate', tool: 'mcp__excalidash__suggest_architecture_improvements', note: 'catch missing revocation / rate-limit / audit path' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                  note: 'persist accepted drawing ("<System> — Auth & API-Key Boundary")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                  note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',               note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',                note: 'SVG/PNG/JSON, redacted; re-scan keys/tokens/secrets' },
];

const HARD_BLOCKERS = ['ARROW_TEXT_INTERSECTION', 'FRAME_TITLE_OVERLAP', 'ITEM_OUTSIDE_FRAME'];
const MIN_SCORE = 95;

// Redaction examples (the exd_ prefix is the only literal allowed).
const REDACTION_EXAMPLES = [
  'exd_live_<entropy> -> exd_live_[REDACTED_API_KEY]',
  'Authorization: Bearer <JWT> -> Authorization: Bearer [REDACTED_BEARER]',
  'HMAC signing secret -> [REDACTED_HMAC_SECRET]',
  'postgres://app:<password>@db/main -> postgres://app:[REDACTED_DATABASE_URL]@db/main',
];

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('diagram type   : ' + DIAGRAM_TYPE + ' (theme: ' + THEME + ')');
  console.log('zones          : ' + ZONES.join(' -> '));
  console.log('boundary ctrls : ' + BOUNDARY_CONTROLS.join(', '));
  console.log('curated libs   : ' + RECOMMENDED_LIBRARIES.join(', '));
  console.log('min score      : ' + MIN_SCORE + ' (zero hard blockers)');
  console.log('hard blockers  : ' + HARD_BLOCKERS.join(', '));
  console.log('create paths   : ' + CREATE_PATHS.join(', '));
  console.log('');
  console.log('## Redaction examples');
  REDACTION_EXAMPLES.forEach(function (r) { console.log('  - ' + r); });
  console.log('');
  console.log('## Plan -> build -> quality-loop sequence');
  SEQUENCE.forEach(function (step, i) {
    const n = String(i + 1).padStart(2, ' ');
    console.log(n + '. [' + step.phase + '] ' + step.tool + '  -- ' + step.note);
  });
  console.log('');
  console.log('NOTE: the two generate create paths are ONE-OF; exactly one create path runs per drawing.');
  console.log('NOTE: apply_architecture_skill takes pattern: only (no skill:, no level:).');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');
  console.log('NOTE: protected services go inside the authenticated zone; clients stay in the public zone.');
  console.log('NOTE: every key/token/secret is [REDACTED_*]; only the exd_ prefix is literal.');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(DIAGRAM_TYPE === 'security', 'diagram type must be security');
  assert(ZONES.length === 3, 'expected exactly 3 trust zones');
  assert(ZONES.indexOf('boundary') !== -1, 'boundary zone must exist');
  assert(RECOMMENDED_LIBRARIES.length === 3, 'expected 3 recommended libraries');
  assert(RECOMMENDED_LIBRARIES.indexOf('Cloud Design Patterns') !== -1, 'Cloud Design Patterns must be recommended');
  assert(RECOMMENDED_LIBRARIES.indexOf('AWS Architecture Icons') !== -1, 'AWS Architecture Icons must be recommended');
  assert(CREATE_PATHS.length === 2, 'expected 2 mutually-exclusive create paths');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__create_diagram_from_prompt') !== -1, 'create_diagram_from_prompt must be a create path');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__apply_architecture_skill') !== -1, 'apply_architecture_skill must be a create path');
  assert(BOUNDARY_CONTROLS.length >= 5, 'expected at least 5 boundary controls (verify/scope/limit/audit/vault)');
  assert(SEQUENCE.some((s) => s.phase === 'lint'), 'missing lint phase');
  assert(SEQUENCE.some((s) => s.phase === 'score'), 'missing score phase');
  assert(SEQUENCE.some((s) => s.phase === 'repair'), 'missing repair phase');
  assert(SEQUENCE.some((s) => s.phase === 'validate'), 'missing validate phase');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__add_library_items_normalized'), 'must place normalized library items');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__suggest_architecture_improvements'), 'must run suggest_architecture_improvements');
  const generates = SEQUENCE.filter((s) => s.phase === 'generate');
  // 2 create paths + 1 library-placement step.
  assert(generates.length === 3, 'expected 2 create paths + 1 add-items step in generate phase');
  assert(REDACTION_EXAMPLES.every((r) => r.indexOf('[REDACTED_') !== -1), 'every redaction example must show a [REDACTED_*] placeholder');
  assert(MIN_SCORE >= 95, 'min score must be >= 95');

  console.log('');
  console.log('OK');
  process.exit(0);
}

main();
