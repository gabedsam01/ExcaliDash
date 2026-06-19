#!/usr/bin/env node
// inspect-excalidraw.cjs — Inspect a local .excalidraw JSON scene file.
//
// Usage:
//   node inspect-excalidraw.cjs <file.excalidraw>
//
// Reads the given .excalidraw JSON file and prints:
//   - a count of elements by `type`
//   - the number of embedded files (the `files` map)
//   - the number of `frame` elements
// It then flags obvious quality issues:
//   - zero embedded files
//   - a scene composed only of low-effort types
//     (text / rectangle / arrow / frame)
//
// Exit codes:
//   0  inspected successfully (issues are reported but not fatal)
//   1  file missing / unreadable / not valid Excalidraw JSON

'use strict';

const fs = require('fs');

function usage() {
  process.stderr.write(
    ['Usage:', '  node inspect-excalidraw.cjs <file.excalidraw>', ''].join('\n')
  );
}

function main() {
  const file = process.argv[2];
  if (!file) {
    usage();
    process.exit(1);
  }

  if (!fs.existsSync(file)) {
    process.stderr.write(`inspect-excalidraw: file not found: ${file}\n`);
    process.exit(1);
  }

  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (err) {
    process.stderr.write(`inspect-excalidraw: cannot read ${file}: ${err.message}\n`);
    process.exit(1);
  }

  let scene;
  try {
    scene = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(`inspect-excalidraw: invalid JSON in ${file}: ${err.message}\n`);
    process.exit(1);
  }

  const elements = Array.isArray(scene.elements) ? scene.elements : [];
  const files = scene.files && typeof scene.files === 'object' ? scene.files : {};

  const typeCounts = {};
  let frameCount = 0;
  for (const el of elements) {
    if (!el || typeof el.type !== 'string') continue;
    typeCounts[el.type] = (typeCounts[el.type] || 0) + 1;
    if (el.type === 'frame') frameCount += 1;
  }

  const filesCount = Object.keys(files).length;
  const distinctTypes = Object.keys(typeCounts);

  process.stdout.write(`File: ${file}\n`);
  process.stdout.write(`Type: ${scene.type || '(unknown)'}  Version: ${scene.version != null ? scene.version : '(unknown)'}\n`);
  process.stdout.write(`Elements: ${elements.length}\n`);
  process.stdout.write('Element type counts:\n');
  if (distinctTypes.length === 0) {
    process.stdout.write('  (none)\n');
  } else {
    for (const t of distinctTypes.sort()) {
      process.stdout.write(`  ${t}: ${typeCounts[t]}\n`);
    }
  }
  process.stdout.write(`Files (embedded): ${filesCount}\n`);
  process.stdout.write(`Frames: ${frameCount}\n`);

  // Issue detection.
  const lowEffortTypes = new Set(['text', 'rectangle', 'arrow', 'frame']);
  const issues = [];

  if (filesCount === 0) {
    issues.push('0 embedded files (no images/diagrams embedded)');
  }

  if (distinctTypes.length > 0 && distinctTypes.every((t) => lowEffortTypes.has(t))) {
    issues.push(
      `scene only uses low-effort types (${distinctTypes.sort().join(', ')}); ` +
        'consider richer elements (ellipse, diamond, line, freedraw, image, embeddable)'
    );
  }

  if (elements.length === 0) {
    issues.push('scene has 0 elements');
  }

  process.stdout.write('\nIssues:\n');
  if (issues.length === 0) {
    process.stdout.write('  none\n');
  } else {
    for (const i of issues) {
      process.stdout.write(`  [WARN] ${i}\n`);
    }
  }

  process.exit(0);
}

main();
