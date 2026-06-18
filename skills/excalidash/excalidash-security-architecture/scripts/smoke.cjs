#!/usr/bin/env node
/*
 * Doc-smoke for the excalidash-security-architecture skill.
 *
 * This is NOT a runtime test of the MCP server. It prints the exact MCP prompt this
 * skill maps to and the canonical plan-then-build tool-call sequence the skill performs,
 * so docs and the skill body can be diffed against one source of truth. No external deps.
 *
 * Usage:  node scripts/smoke.cjs
 * Exit:   0 on success, 1 if the documented sequence drifts.
 */
'use strict';

const SKILL = 'excalidash-security-architecture';
const MCP_PROMPT = '/mcp__excalidash__excalidash_security_architecture';

// Fixed diagram type for this skill.
const DIAGRAM_TYPE = 'security';

// Trust zones, in order from least to most trusted.
const ZONES = ['public', 'dmz', 'private'];

// Defensive controls this skill must surface.
const CONTROLS = ['jwt', 'rbac', 'csrf', 'rate-limit', 'audit', 'vault'];

// Data classification levels a store may carry.
const CLASSIFICATIONS = ['public', 'internal', 'confidential', 'restricted'];

// Curated packs recommended for a security architecture view.
const RECOMMENDED_LIBRARIES = [
  'Cloud Design Patterns',
  'AWS Architecture Icons',
  'Software Architecture',
];

// The two mutually exclusive create paths; exactly one runs per drawing.
// apply_architecture_skill uses pattern: (NO skill:/level: args exist).
const CREATE_PATHS = [
  'mcp__excalidash__apply_architecture_skill',   // pattern:"clean" -> generated boundary frames
  'mcp__excalidash__create_diagram_from_prompt', // diagramType:"security" + explicit zone structure
];

// Typed redaction placeholders this skill emits instead of any real secret.
const REDACTION_TYPES = [
  '[REDACTED_JWT_SECRET]',
  '[REDACTED_API_KEY]',
  '[REDACTED_SERVICE_ROLE]',
  '[REDACTED_DATABASE_URL]',
  '[REDACTED_BEARER]',
  '[REDACTED_WEBHOOK_SECRET]',
  '[REDACTED_PROXY_SECRET]',
];

// Canonical plan -> generate -> lint -> score -> repair -> validate -> save -> export sequence.
const SEQUENCE = [
  { phase: 'plan',     tool: 'mcp__excalidash__read_mcp_guide',                note: 'load presets, MCP_LIBRARY_MODE, rubric' },
  { phase: 'plan',     tool: 'mcp__excalidash__search_libraries',             note: 'curated: gateway, lock, key, vault, audit, firewall' },
  { phase: 'plan',     tool: 'mcp__excalidash__inspect_library',              note: 'vet candidates (aspect, stroke, fill, complexity)' },
  { phase: 'plan',     tool: 'mcp__excalidash__cache_library',                note: 'cache vetted icons' },
  { phase: 'generate', tool: 'mcp__excalidash__apply_architecture_skill',     note: 'ONE-OF: pattern:"clean" -> generated boundary frames' },
  { phase: 'generate', tool: 'mcp__excalidash__create_diagram_from_prompt',   note: 'ONE-OF: diagramType:"security" + explicit zone structure' },
  { phase: 'generate', tool: 'mcp__excalidash__add_library_items_normalized', note: 'gateway shield, locks, vault key, audit icon, class badges' },
  { phase: 'lint',     tool: 'mcp__excalidash__lint_drawing',                 note: 'hardBlockers must end empty' },
  { phase: 'score',    tool: 'mcp__excalidash__score_drawing',                note: 'require score >= 95' },
  { phase: 'repair',   tool: 'mcp__excalidash__repair_drawing',              note: 'mandatory; loop lint->score->repair; rollback if score drops' },
  { phase: 'polish',   tool: 'mcp__excalidash__auto_polish_drawing',         note: 'after blockers clear; re-score for no regression' },
  { phase: 'validate', tool: 'mcp__excalidash__validate_architecture',       note: 'trust boundary present; no public->private shortcut; gateway on path' },
  { phase: 'validate', tool: 'mcp__excalidash__suggest_architecture_improvements', note: 'flag missing controls (audit, rate limit, vault)' },
  { phase: 'save',     tool: 'mcp__excalidash__save_drawing',                note: 'persist accepted drawing ("<System> — Security Architecture")' },
  { phase: 'save',     tool: 'mcp__excalidash__save_version',                note: 'checkpoint accepted state (rollback target)' },
  { phase: 'export',   tool: 'mcp__excalidash__get_drawing_url',             note: 'shareable link' },
  { phase: 'export',   tool: 'mcp__excalidash__export_drawing',              note: 'SVG/PNG/JSON, redacted; re-scan for db URLs/bearer/vault paths' },
];

const HARD_BLOCKERS = ['ARROW_TEXT_INTERSECTION', 'FRAME_TITLE_OVERLAP', 'ITEM_OUTSIDE_FRAME'];
const MIN_SCORE = 95;

function main() {
  console.log('# ExcaliDash skill doc-smoke');
  console.log('skill          : ' + SKILL);
  console.log('mcp prompt     : ' + MCP_PROMPT);
  console.log('diagram type   : ' + DIAGRAM_TYPE);
  console.log('trust zones    : ' + ZONES.join(' -> '));
  console.log('controls       : ' + CONTROLS.join(', '));
  console.log('classification : ' + CLASSIFICATIONS.join(', '));
  console.log('curated libs   : ' + RECOMMENDED_LIBRARIES.join(', '));
  console.log('redaction types: ' + REDACTION_TYPES.join(', '));
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
  console.log('NOTE: the two generate create paths are ONE-OF; exactly one create path runs per drawing.');
  console.log('NOTE: apply_architecture_skill uses pattern: only (there is NO skill: or level: arg).');
  console.log('NOTE: every inbound arrow passes through the auth gateway; no public->private shortcut.');
  console.log('NOTE: every literal secret is a [REDACTED_<TYPE>] placeholder, never a real value.');
  console.log('NOTE: lint -> score -> repair repeats until score >= ' + MIN_SCORE + ' and hardBlockers == [].');

  // Minimal self-checks so the smoke fails loudly if the doc drifts.
  const assert = (cond, msg) => { if (!cond) { console.error('SMOKE FAIL: ' + msg); process.exit(1); } };
  assert(DIAGRAM_TYPE === 'security', 'diagram type must be security');
  assert(ZONES.length === 3, 'expected 3 trust zones');
  assert(ZONES[0] === 'public' && ZONES[2] === 'private', 'zones run public -> ... -> private');
  assert(CONTROLS.indexOf('audit') !== -1, 'audit control must be present');
  assert(CONTROLS.indexOf('vault') !== -1, 'vault control must be present');
  assert(RECOMMENDED_LIBRARIES.length === 3, 'expected 3 recommended libraries');
  assert(CREATE_PATHS.length === 2, 'expected 2 mutually-exclusive create paths');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__apply_architecture_skill') !== -1, 'apply_architecture_skill must be a create path');
  assert(CREATE_PATHS.indexOf('mcp__excalidash__create_diagram_from_prompt') !== -1, 'create_diagram_from_prompt must be a create path');
  assert(REDACTION_TYPES.every((t) => /^\[REDACTED_[A-Z_]+\]$/.test(t)), 'redaction tokens must be [REDACTED_<TYPE>]');
  assert(SEQUENCE.some((s) => s.phase === 'lint'), 'missing lint phase');
  assert(SEQUENCE.some((s) => s.phase === 'score'), 'missing score phase');
  assert(SEQUENCE.some((s) => s.phase === 'repair'), 'missing repair phase');
  assert(SEQUENCE.some((s) => s.phase === 'validate'), 'missing validate phase');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__add_library_items_normalized'), 'must place normalized library items');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__validate_architecture'), 'must validate the trust boundary');
  assert(SEQUENCE.some((s) => s.tool === 'mcp__excalidash__suggest_architecture_improvements'), 'must check for missing controls');
  const generates = SEQUENCE.filter((s) => s.phase === 'generate');
  // 2 create paths + 1 library-placement step.
  assert(generates.length === 3, 'expected 2 create paths + 1 add-items step in generate phase');
  // Guard: no forbidden apply_architecture_skill args leak into the doc tokens.
  assert(SEQUENCE.every((s) => !/skill:|level:/.test(s.note)), 'apply_architecture_skill must not use skill:/level:');
  assert(MIN_SCORE >= 95, 'min score must be >= 95');

  console.log('');
  console.log('OK');
  process.exit(0);
}

main();
