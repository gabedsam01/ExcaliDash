#!/usr/bin/env node
// verify-mcp.cjs — Verify the ExcaliDash MCP HTTP endpoint.
//
// Usage:
//   EXCALIDASH_MCP_URL=https://host/mcp EXCALIDASH_TOKEN=xxx node verify-mcp.cjs
//
// Performs JSON-RPC `initialize`, then `tools/list`, then `prompts/list`
// against the MCP HTTP endpoint and asserts:
//   - every response is HTTP 200
//   - exactly 25 tools are advertised
//   - exactly 25 prompts are advertised
// Prints a human-readable checklist.
//
// Exit codes:
//   0  all checks passed
//   1  a check failed (network error, non-200, wrong counts, etc.)
//   2  required env vars missing (usage printed)
//
// Requires Node 18+ (uses global fetch). Other scripts may `require()` this
// file and call the exported async `run()`.

'use strict';

const EXPECTED_TOOLS = 25;
const EXPECTED_PROMPTS = 25;

function usage() {
  process.stderr.write(
    [
      'Usage:',
      '  EXCALIDASH_MCP_URL=<url> EXCALIDASH_TOKEN=<token> node verify-mcp.cjs',
      '',
      'Environment:',
      '  EXCALIDASH_MCP_URL  Full URL to the MCP HTTP endpoint (required)',
      '  EXCALIDASH_TOKEN    Bearer token for authentication (required)',
      '',
    ].join('\n')
  );
}

let _rpcId = 0;

async function rpc(url, token, method, params) {
  const id = ++_rpcId;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params: params || {} }),
  });

  const text = await res.text();
  let body = null;
  // The endpoint may answer with plain JSON or an SSE stream. Try JSON first,
  // then fall back to extracting the last `data:` line from an SSE response.
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

function line(ok, label, detail) {
  const mark = ok ? '[PASS]' : '[FAIL]';
  return `${mark} ${label}${detail ? ` — ${detail}` : ''}`;
}

async function run(opts) {
  const url = (opts && opts.url) || process.env.EXCALIDASH_MCP_URL;
  const token = (opts && opts.token) || process.env.EXCALIDASH_TOKEN;

  if (!url || !token) {
    usage();
    return { code: 2, checks: [] };
  }

  const checks = [];
  let failed = false;

  function record(ok, label, detail) {
    checks.push({ ok, label, detail });
    if (!ok) failed = true;
    process.stdout.write(line(ok, label, detail) + '\n');
  }

  // 1. initialize
  let init;
  try {
    init = await rpc(url, token, 'initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'excalidash-verify-mcp', version: '1.0.0' },
    });
  } catch (err) {
    record(false, 'initialize', `request error: ${err.message}`);
    return finish(checks, failed);
  }
  record(
    init.status === 200,
    'initialize HTTP 200',
    `status ${init.status}`
  );
  const hasInitResult = !!(init.body && init.body.result);
  record(hasInitResult, 'initialize returned result', hasInitResult ? '' : 'missing result');

  // 2. tools/list
  let tools;
  try {
    tools = await rpc(url, token, 'tools/list', {});
  } catch (err) {
    record(false, 'tools/list', `request error: ${err.message}`);
    return finish(checks, failed);
  }
  record(tools.status === 200, 'tools/list HTTP 200', `status ${tools.status}`);
  const toolList =
    tools.body && tools.body.result && Array.isArray(tools.body.result.tools)
      ? tools.body.result.tools
      : null;
  if (!toolList) {
    record(false, `exactly ${EXPECTED_TOOLS} tools`, 'no tools array in response');
  } else {
    record(
      toolList.length === EXPECTED_TOOLS,
      `exactly ${EXPECTED_TOOLS} tools`,
      `got ${toolList.length}`
    );
  }

  // 3. prompts/list
  let prompts;
  try {
    prompts = await rpc(url, token, 'prompts/list', {});
  } catch (err) {
    record(false, 'prompts/list', `request error: ${err.message}`);
    return finish(checks, failed);
  }
  record(prompts.status === 200, 'prompts/list HTTP 200', `status ${prompts.status}`);
  const promptList =
    prompts.body && prompts.body.result && Array.isArray(prompts.body.result.prompts)
      ? prompts.body.result.prompts
      : null;
  if (!promptList) {
    record(false, `exactly ${EXPECTED_PROMPTS} prompts`, 'no prompts array in response');
  } else {
    record(
      promptList.length === EXPECTED_PROMPTS,
      `exactly ${EXPECTED_PROMPTS} prompts`,
      `got ${promptList.length}`
    );
  }

  return finish(checks, failed);
}

function finish(checks, failed) {
  const code = failed ? 1 : 0;
  process.stdout.write(
    `\n${failed ? 'FAILED' : 'OK'}: ${checks.filter((c) => c.ok).length}/${checks.length} checks passed\n`
  );
  return { code, checks };
}

module.exports = { run };

if (require.main === module) {
  run()
    .then((r) => process.exit(r.code))
    .catch((err) => {
      process.stderr.write(`verify-mcp: unexpected error: ${err && err.stack ? err.stack : err}\n`);
      process.exit(1);
    });
}
