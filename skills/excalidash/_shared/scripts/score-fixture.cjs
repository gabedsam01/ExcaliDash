#!/usr/bin/env node
// score-fixture.cjs — Score a local .excalidraw fixture via the MCP endpoint.
//
// Usage:
//   EXCALIDASH_MCP_URL=<url> EXCALIDASH_TOKEN=<token> \
//     node score-fixture.cjs <file.excalidraw> [min-score]
//
// Arguments:
//   file.excalidraw  Local Excalidraw scene file to score (required)
//   min-score        Minimum passing score (default 95)
//
// Reads the local scene, POSTs it to JSON-RPC `tools/call` with name
// `score_drawing`, and prints the returned score, passed flag, and any
// hard blockers.
//
// Requires Node 18+ (uses global fetch).
//
// Exit codes:
//   0  score >= min-score
//   1  file missing / request failure / score < min-score
//   2  missing arguments or env vars (usage printed)

'use strict';

const fs = require('fs');

function usage() {
  process.stderr.write(
    [
      'Usage:',
      '  EXCALIDASH_MCP_URL=<url> EXCALIDASH_TOKEN=<token> \\',
      '    node score-fixture.cjs <file.excalidraw> [min-score]',
      '',
      'Arguments:',
      '  file.excalidraw  Local Excalidraw scene file to score',
      '  min-score        Minimum passing score (default 95)',
      '',
      'Environment:',
      '  EXCALIDASH_MCP_URL  Full URL to the MCP HTTP endpoint',
      '  EXCALIDASH_TOKEN    Bearer token for authentication',
      '',
    ].join('\n')
  );
}

async function rpc(url, token, method, params) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: params || {} }),
  });

  const text = await res.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch (_) {
      const dataLines = text
        .split(/\r?\n/)
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .filter(Boolean);
      const last = dataLines[dataLines.length - 1];
      if (last) {
        try {
          body = JSON.parse(last);
        } catch (_) {
          body = null;
        }
      }
    }
  }
  return { status: res.status, ok: res.ok, body, raw: text };
}

// Pull a structured score object out of an MCP tool result. The score tool may
// return structuredContent directly or embed JSON in a text content part.
function extractScore(result) {
  if (!result) return null;
  if (result.structuredContent && typeof result.structuredContent === 'object') {
    return result.structuredContent;
  }
  const content = Array.isArray(result.content) ? result.content : [];
  for (const part of content) {
    if (part && part.type === 'text' && typeof part.text === 'string') {
      try {
        return JSON.parse(part.text);
      } catch (_) {
        // not JSON; ignore
      }
    }
  }
  return null;
}

async function main() {
  const url = process.env.EXCALIDASH_MCP_URL;
  const token = process.env.EXCALIDASH_TOKEN;
  const file = process.argv[2];
  const minScore = process.argv[3] != null ? Number(process.argv[3]) : 95;

  if (!file || !url || !token) {
    usage();
    process.exit(2);
  }

  if (!fs.existsSync(file)) {
    process.stderr.write(`score-fixture: file not found: ${file}\n`);
    process.exit(1);
  }

  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (err) {
    process.stderr.write(`score-fixture: cannot read ${file}: ${err.message}\n`);
    process.exit(1);
  }

  let scene;
  try {
    scene = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(`score-fixture: invalid JSON in ${file}: ${err.message}\n`);
    process.exit(1);
  }

  let resp;
  try {
    resp = await rpc(url, token, 'tools/call', {
      name: 'score_drawing',
      arguments: {
        scene,
        elements: Array.isArray(scene.elements) ? scene.elements : undefined,
        files: scene.files,
      },
    });
  } catch (err) {
    process.stderr.write(`score-fixture: request error: ${err.message}\n`);
    process.exit(1);
  }

  if (resp.status !== 200) {
    process.stderr.write(`score-fixture: HTTP ${resp.status}\n${resp.raw}\n`);
    process.exit(1);
  }

  if (!resp.body || resp.body.error) {
    const msg = resp.body && resp.body.error ? JSON.stringify(resp.body.error) : 'no/invalid body';
    process.stderr.write(`score-fixture: RPC error: ${msg}\n`);
    process.exit(1);
  }

  const data = extractScore(resp.body.result);
  if (!data) {
    process.stderr.write('score-fixture: could not parse score from response\n');
    process.stderr.write(`${resp.raw}\n`);
    process.exit(1);
  }

  const score = Number(data.score != null ? data.score : NaN);
  const passed = data.passed;
  const hardBlockers = Array.isArray(data.hardBlockers) ? data.hardBlockers : [];

  process.stdout.write(`File:    ${file}\n`);
  process.stdout.write(`Score:   ${Number.isFinite(score) ? score : '(unknown)'}\n`);
  process.stdout.write(`Passed:  ${passed === undefined ? '(unknown)' : passed}\n`);
  process.stdout.write('Hard blockers:\n');
  if (hardBlockers.length === 0) {
    process.stdout.write('  none\n');
  } else {
    for (const b of hardBlockers) {
      process.stdout.write(`  - ${typeof b === 'string' ? b : JSON.stringify(b)}\n`);
    }
  }

  if (!Number.isFinite(score) || score < minScore) {
    process.stderr.write(`\nscore-fixture: FAILED — score ${score} < min ${minScore}\n`);
    process.exit(1);
  }

  process.stdout.write(`\nscore-fixture: OK — score ${score} >= min ${minScore}\n`);
  process.exit(0);
}

main().catch((err) => {
  process.stderr.write(`score-fixture: unexpected error: ${err && err.stack ? err.stack : err}\n`);
  process.exit(1);
});
