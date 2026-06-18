'use strict';

// @excalidash/claude-skills CLI.
//
// Subcommands:
//   list                                 List available skills + descriptions.
//   install --scope user|project|local   Copy every skill dir to the target.
//   uninstall --scope user|project|local Remove the excalidash skills dir.
//   verify [--scope ...]                 Check all skills exist + are well-formed.
//
// Zero runtime dependencies: only fs / path / os.
//
// Exit codes: 0 = ok, 1 = failure, 2 = usage error.

const fs = require('fs');
const path = require('path');
const os = require('os');

const { copyDir } = require('./copy.cjs');

// The skills bundle is named "excalidash" inside any skills directory.
const BUNDLE_NAME = 'excalidash';
// Shared assets directory that ships alongside the skills.
const SHARED_DIR = '_shared';
// Number of real skill directories expected (excludes _shared).
const EXPECTED_SKILL_COUNT = 25;

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function out(line) {
  process.stdout.write(`${line}\n`);
}

function err(line) {
  process.stderr.write(`${line}\n`);
}

// ---------------------------------------------------------------------------
// Source / target resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the SOURCE excalidash skills directory, in priority order:
 *   1. $EXCALIDASH_SKILLS_DIR
 *   2. bundled ./skills/excalidash next to this package
 *   3. repo path /home/ubuntu/ExcaliDash/skills/excalidash
 * @returns {string}
 */
function resolveSourceDir() {
  const candidates = [];

  if (process.env.EXCALIDASH_SKILLS_DIR) {
    candidates.push(path.resolve(process.env.EXCALIDASH_SKILLS_DIR));
  }

  // ./skills/excalidash bundled next to the package (src/ -> package root).
  candidates.push(path.resolve(__dirname, '..', 'skills', BUNDLE_NAME));

  // Repo fallback.
  candidates.push(path.resolve('/home/ubuntu/ExcaliDash/skills', BUNDLE_NAME));

  for (const candidate of candidates) {
    if (isDir(candidate)) {
      return candidate;
    }
  }

  throw new UsageError(
    [
      'Could not locate the ExcaliDash skills source directory.',
      'Looked in:',
      ...candidates.map((c) => `  - ${c}`),
      '',
      'Set EXCALIDASH_SKILLS_DIR to the directory containing the excalidash skills.',
    ].join('\n')
  );
}

/**
 * Resolve the target excalidash skills directory for a given scope.
 *
 *   user            -> ~/.claude/skills/excalidash
 *   project | local -> <projectDir>/.claude/skills/excalidash
 *
 * @param {string} scope
 * @param {string} projectDir
 * @returns {string}
 */
function resolveTargetDir(scope, projectDir) {
  if (scope === 'user') {
    return path.join(os.homedir(), '.claude', 'skills', BUNDLE_NAME);
  }
  if (scope === 'project' || scope === 'local') {
    return path.join(path.resolve(projectDir || '.'), '.claude', 'skills', BUNDLE_NAME);
  }
  throw new UsageError(`Invalid --scope "${scope}". Expected: user | project | local.`);
}

// ---------------------------------------------------------------------------
// fs helpers
// ---------------------------------------------------------------------------

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch (_err) {
    return false;
  }
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch (_err) {
    return false;
  }
}

/**
 * List the immediate subdirectories of a skills bundle dir.
 * Returns { skills: string[], hasShared: boolean }.
 */
function readBundle(bundleDir) {
  const entries = fs.readdirSync(bundleDir, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const hasShared = dirs.includes(SHARED_DIR);
  const skills = dirs.filter((d) => d !== SHARED_DIR).sort();
  return { skills, hasShared };
}

// ---------------------------------------------------------------------------
// SKILL.md frontmatter parsing (tiny YAML-ish, no deps)
// ---------------------------------------------------------------------------

/**
 * Parse the YAML frontmatter block of a SKILL.md file.
 * Returns a flat key/value map of the top-level scalar keys, or {} if none.
 * Only the leading `---\n...\n---` block is considered.
 * @param {string} skillMdPath
 * @returns {Record<string,string>}
 */
function parseFrontmatter(skillMdPath) {
  let text;
  try {
    text = fs.readFileSync(skillMdPath, 'utf8');
  } catch (_err) {
    return {};
  }

  // Normalize newlines and strip a leading BOM.
  text = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');

  if (!text.startsWith('---\n')) {
    return {};
  }

  const end = text.indexOf('\n---', 4);
  if (end === -1) {
    return {};
  }

  const block = text.slice(4, end);
  const map = {};
  let currentKey = null;

  for (const rawLine of block.split('\n')) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    // Continuation of a folded/multi-line value (indented, no top-level key).
    const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (kv && !/^\s/.test(rawLine)) {
      currentKey = kv[1];
      map[currentKey] = stripQuotes(kv[2].trim());
    } else if (currentKey && /^\s/.test(rawLine)) {
      const cont = line.trim();
      if (cont) {
        map[currentKey] = `${map[currentKey]} ${stripQuotes(cont)}`.trim();
      }
    }
  }

  return map;
}

function stripQuotes(s) {
  if (s.length >= 2) {
    const a = s[0];
    const b = s[s.length - 1];
    if ((a === '"' && b === '"') || (a === "'" && b === "'")) {
      return s.slice(1, -1);
    }
  }
  return s;
}

/** Read the `description` from a skill dir's SKILL.md, or '' if unavailable. */
function readSkillDescription(skillDir) {
  const fm = parseFrontmatter(path.join(skillDir, 'SKILL.md'));
  return fm.description || '';
}

// ---------------------------------------------------------------------------
// Content quality checks (placeholders + minimum structure)
// ---------------------------------------------------------------------------

// Template / placeholder markers that must never ship in skill content.
// Deliberately conservative: these match template artifacts, NOT legitimate
// prose such as "[REDACTED_*] placeholder" (redaction) or "32px gap" (layout).
const PLACEHOLDER_PATTERNS = [
  { re: /\bTODO\b/, label: 'TODO' },
  { re: /\bFIXME\b/, label: 'FIXME' },
  { re: /\bTBD\b/, label: 'TBD' },
  { re: /\bXXX\b/, label: 'XXX' },
  { re: /lorem ipsum/i, label: 'lorem ipsum' },
  { re: /template-only/i, label: 'template-only' },
  { re: /\bdraft-only\b/i, label: 'draft-only' },
  { re: /\bfill[ -]?(?:the )?gap\b/i, label: 'fill gap' },
  { re: /placeholder (?:text|content)/i, label: 'placeholder text/content' },
  { re: /<placeholder>/i, label: '<placeholder>' },
  { re: /coming soon/i, label: 'coming soon' },
  { re: /\bto be written\b/i, label: 'to be written' },
];

// Minimum body (post-frontmatter) shape expected of a real, non-stub skill.
const MIN_BODY_CHARS = 1200;
const MIN_SECTIONS = 6;

/** All markdown files that make up a skill: SKILL.md + references/*.md. */
function listSkillMarkdown(skillDir) {
  const files = [];
  const skillMd = path.join(skillDir, 'SKILL.md');
  if (isFile(skillMd)) files.push(skillMd);
  const refDir = path.join(skillDir, 'references');
  if (isDir(refDir)) {
    for (const e of fs.readdirSync(refDir)) {
      if (e.endsWith('.md')) files.push(path.join(refDir, e));
    }
  }
  return files;
}

/** Return a list of "<token> in <file>" hits for template/placeholder markers. */
function scanPlaceholders(skillDir) {
  const hits = [];
  for (const file of listSkillMarkdown(skillDir)) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch (_err) {
      continue;
    }
    const rel =
      path.basename(path.dirname(file)) === 'references'
        ? `references/${path.basename(file)}`
        : path.basename(file);
    for (const { re, label } of PLACEHOLDER_PATTERNS) {
      if (re.test(text)) {
        hits.push(`${label} in ${rel}`);
      }
    }
  }
  return hits;
}

/** Strip a leading YAML frontmatter block and return the markdown body. */
function skillBody(skillMdPath) {
  let text;
  try {
    text = fs.readFileSync(skillMdPath, 'utf8');
  } catch (_err) {
    return '';
  }
  text = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  if (text.startsWith('---\n')) {
    const end = text.indexOf('\n---', 4);
    if (end !== -1) {
      text = text.slice(end + 4);
    }
  }
  return text;
}

/** Return structural problems for a SKILL.md body (empty array = ok). */
function structureProblems(skillMdPath) {
  const body = skillBody(skillMdPath).trim();
  const problems = [];
  if (body.length < MIN_BODY_CHARS) {
    problems.push(`SKILL.md body too short (${body.length} < ${MIN_BODY_CHARS} chars)`);
  }
  const sections = (body.match(/^## /gm) || []).length;
  if (sections < MIN_SECTIONS) {
    problems.push(`SKILL.md has ${sections} "## " sections (< ${MIN_SECTIONS})`);
  }
  if (!/(^|\D)95(\D|$)/m.test(body)) {
    problems.push('SKILL.md does not reference the minimum score (95)');
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

class UsageError extends Error {}

/**
 * Parse `--flag value` / `--flag=value` / `--bool` style options.
 * Returns { _: positionals, ...flags }.
 */
function parseArgs(argv, boolFlags) {
  const bools = new Set(boolFlags || []);
  const result = { _: [] };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const body = token.slice(2);
      const eq = body.indexOf('=');
      if (eq !== -1) {
        result[body.slice(0, eq)] = body.slice(eq + 1);
      } else if (bools.has(body)) {
        result[body] = true;
      } else {
        const next = argv[i + 1];
        if (next === undefined || next.startsWith('--')) {
          // Treat as a boolean flag if no value follows.
          result[body] = true;
        } else {
          result[body] = next;
          i += 1;
        }
      }
    } else {
      result._.push(token);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function cmdList() {
  const sourceDir = resolveSourceDir();
  const { skills, hasShared } = readBundle(sourceDir);

  out(`ExcaliDash skills (source: ${sourceDir})`);
  out('');
  for (const name of skills) {
    const desc = readSkillDescription(path.join(sourceDir, name));
    out(`  ${name}${desc ? `  -  ${truncate(desc, 100)}` : ''}`);
  }
  out('');
  out(`  ${SHARED_DIR}${hasShared ? '  -  shared references & scripts' : '  (missing)'}`);
  out('');
  out(`Total: ${skills.length} skill${skills.length === 1 ? '' : 's'}${hasShared ? ` + ${SHARED_DIR}` : ''}`);
  return 0;
}

function cmdInstall(args) {
  const scope = args.scope;
  if (!scope) {
    throw new UsageError('install requires --scope user|project|local');
  }
  const force = !!args.force;
  const sourceDir = resolveSourceDir();
  const targetDir = resolveTargetDir(scope, args['project-dir']);

  const { skills, hasShared } = readBundle(sourceDir);

  // Pre-flight overwrite check (idempotent unless --force).
  if (isDir(targetDir) && !force) {
    if (fs.readdirSync(targetDir).length > 0) {
      throw new Error(
        [
          `Target already exists and is not empty: ${targetDir}`,
          'Re-run with --force to overwrite, or `uninstall` first.',
        ].join('\n')
      );
    }
  }

  fs.mkdirSync(targetDir, { recursive: true });

  out(`Installing ExcaliDash skills`);
  out(`  source: ${sourceDir}`);
  out(`  target: ${targetDir}  (scope: ${scope})`);
  out('');

  const names = [...skills];
  if (hasShared) {
    names.push(SHARED_DIR);
  }

  for (const name of names) {
    copyDir(path.join(sourceDir, name), path.join(targetDir, name), { force });
    out(`  copied  ${name}`);
  }

  out('');
  out(`Done. Installed ${skills.length} skill${skills.length === 1 ? '' : 's'}${hasShared ? ` + ${SHARED_DIR}` : ''} to ${targetDir}`);
  return 0;
}

function cmdUninstall(args) {
  const scope = args.scope;
  if (!scope) {
    throw new UsageError('uninstall requires --scope user|project|local');
  }
  const targetDir = resolveTargetDir(scope, args['project-dir']);

  if (!fs.existsSync(targetDir)) {
    out(`Nothing to remove; not installed at: ${targetDir}`);
    return 0;
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  out(`Removed ${targetDir}`);
  return 0;
}

function cmdVerify(args) {
  const scope = args.scope;
  let baseDir;
  let label;

  if (scope) {
    baseDir = resolveTargetDir(scope, args['project-dir']);
    label = `target (scope: ${scope})`;
  } else {
    baseDir = resolveSourceDir();
    label = 'source';
  }

  out(`Verifying ExcaliDash skills`);
  out(`  ${label}: ${baseDir}`);
  out('');

  if (!isDir(baseDir)) {
    err(`  MISSING  bundle directory does not exist: ${baseDir}`);
    out('');
    out('Result: FAIL');
    return 1;
  }

  const { skills, hasShared } = readBundle(baseDir);
  let failures = 0;

  for (const name of skills) {
    const skillDir = path.join(baseDir, name);
    const skillMd = path.join(skillDir, 'SKILL.md');
    const problems = [];

    if (!isFile(skillMd)) {
      problems.push('no SKILL.md');
    } else {
      const fm = parseFrontmatter(skillMd);
      if (!fm.name) problems.push('frontmatter missing "name"');
      if (!fm.description) problems.push('frontmatter missing "description"');
      if (!fm['allowed-tools']) problems.push('frontmatter missing "allowed-tools"');
      if (fm.name && fm.name !== name) {
        problems.push(`frontmatter name "${fm.name}" != directory "${name}"`);
      }

      // Content quality: no placeholder/stub markers, minimum real structure.
      const placeholders = scanPlaceholders(skillDir);
      if (placeholders.length) {
        problems.push(`placeholder markers (${placeholders.join('; ')})`);
      }
      for (const p of structureProblems(skillMd)) {
        problems.push(p);
      }
    }

    if (problems.length) {
      failures += 1;
      err(`  FAIL  ${name}  (${problems.join('; ')})`);
    } else {
      out(`  ok    ${name}`);
    }
  }

  // _shared presence.
  if (hasShared) {
    out(`  ok    ${SHARED_DIR}`);
  } else {
    failures += 1;
    err(`  FAIL  ${SHARED_DIR}  (missing)`);
  }

  // Expected count check.
  out('');
  if (skills.length !== EXPECTED_SKILL_COUNT) {
    failures += 1;
    err(`  FAIL  expected ${EXPECTED_SKILL_COUNT} skills, found ${skills.length}`);
  } else {
    out(`  ok    found expected ${EXPECTED_SKILL_COUNT} skills`);
  }

  out('');
  if (failures > 0) {
    out(`Result: FAIL (${failures} problem${failures === 1 ? '' : 's'})`);
    return 1;
  }
  out('Result: OK');
  return 0;
}

function truncate(s, n) {
  if (s.length <= n) return s;
  return `${s.slice(0, n - 1)}…`;
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

const HELP = `excalidash-skills - install ExcaliDash Claude Code skills

Usage:
  excalidash-skills <command> [options]

Commands:
  list
      List the available skills and their descriptions.

  install --scope user|project|local [--project-dir .] [--force]
      Copy every skill directory (including ${SHARED_DIR}) to the target.
      Refuses to overwrite a non-empty target unless --force is given.

  uninstall --scope user|project|local [--project-dir .]
      Remove the installed excalidash skills directory at the target.

  verify [--scope user|project|local] [--project-dir .]
      Check that all ${EXPECTED_SKILL_COUNT} skills + ${SHARED_DIR} exist and that each
      SKILL.md has name / description / allowed-tools frontmatter (name matching
      its directory), carries no placeholder/stub markers (TODO, lorem ipsum,
      template-only, draft-only, fill gap, …) in SKILL.md or references/, and
      meets a minimum real structure (>= ${MIN_SECTIONS} sections, >= ${MIN_BODY_CHARS} body chars,
      references the score gate). With no --scope, verifies the source bundle.
      Exits 1 on problems.

Targets:
  user             ~/.claude/skills/${BUNDLE_NAME}
  project | local  <project-dir>/.claude/skills/${BUNDLE_NAME}

Source resolution (first match wins):
  1. $EXCALIDASH_SKILLS_DIR
  2. ./skills/${BUNDLE_NAME} bundled next to this package
  3. /home/ubuntu/ExcaliDash/skills/${BUNDLE_NAME}

Options:
  --scope        Install/verify scope: user | project | local.
  --project-dir  Project root for project/local scope (default: .).
  --force        Overwrite existing files when installing.
  -h, --help     Show this help.

Exit codes: 0 ok, 1 failure, 2 usage error.
`;

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

function main(argv) {
  const a = argv || [];

  if (a.length === 0 || a[0] === '-h' || a[0] === '--help' || a[0] === 'help') {
    out(HELP);
    process.exit(a.length === 0 ? 2 : 0);
  }

  const command = a[0];
  const rest = a.slice(1);

  // Per-command help.
  if (rest.includes('-h') || rest.includes('--help')) {
    out(HELP);
    process.exit(0);
  }

  const args = parseArgs(rest, ['force']);

  try {
    let code;
    switch (command) {
      case 'list':
        code = cmdList();
        break;
      case 'install':
        code = cmdInstall(args);
        break;
      case 'uninstall':
        code = cmdUninstall(args);
        break;
      case 'verify':
        code = cmdVerify(args);
        break;
      default:
        err(`Unknown command: ${command}`);
        out('');
        out(HELP);
        process.exit(2);
        return;
    }
    process.exit(code);
  } catch (e) {
    if (e instanceof UsageError) {
      err(`Usage error: ${e.message}`);
      process.exit(2);
    }
    err(`Error: ${e && e.message ? e.message : e}`);
    process.exit(1);
  }
}

module.exports = { main, resolveSourceDir, resolveTargetDir, parseFrontmatter, copyDir };

if (require.main === module) {
  main(process.argv.slice(2));
}
