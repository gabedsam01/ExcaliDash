#!/usr/bin/env node
// install-skills.cjs — Thin wrapper around the excalidash-claude-skills installer.
//
// Usage:
//   node install-skills.cjs [args...]
//
// Locates the bundled installer at
//   ../../../packages/excalidash-claude-skills/bin/install.cjs
// (relative to this script) and executes it, forwarding all CLI arguments.
//
// If the installer is not present (e.g. running from a checkout without the
// packages workspace), it prints the documented npx/node commands to run the
// installer from npm instead.
//
// Exit codes:
//   0   installer ran successfully (or guidance printed when missing)
//   !0  installer's own exit code on failure

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const INSTALLER = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'packages',
  'excalidash-claude-skills',
  'bin',
  'install.cjs'
);

function printFallback() {
  process.stdout.write(
    [
      'excalidash-claude-skills installer not found at:',
      `  ${INSTALLER}`,
      '',
      'Run the published installer instead:',
      '',
      '  # via npx (no install):',
      '  npx excalidash-claude-skills install',
      '',
      '  # or install globally, then run:',
      '  npm install -g excalidash-claude-skills',
      '  excalidash-claude-skills install',
      '',
      '  # or run a locally cloned package directly:',
      '  node packages/excalidash-claude-skills/bin/install.cjs',
      '',
    ].join('\n')
  );
}

function main() {
  const forwarded = process.argv.slice(2);

  if (!fs.existsSync(INSTALLER)) {
    printFallback();
    process.exit(0);
  }

  const result = spawnSync(process.execPath, [INSTALLER, ...forwarded], {
    stdio: 'inherit',
  });

  if (result.error) {
    process.stderr.write(`install-skills: failed to exec installer: ${result.error.message}\n`);
    process.exit(1);
  }

  process.exit(result.status == null ? 1 : result.status);
}

main();
