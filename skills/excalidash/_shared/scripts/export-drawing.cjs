#!/usr/bin/env node
// export-drawing.cjs — Export an ExcaliDash drawing via the MCP HTTP endpoint.
//
// Usage:
//   EXCALIDASH_MCP_URL=<url> EXCALIDASH_TOKEN=<token> \
//     node export-drawing.cjs <drawing-id> <format> <out-file>
//
// Arguments:
//   drawing-id  ID of the drawing to export (required)
//   format      Export format, e.g. svg | png | json | excalidraw (required)
//   out-file    Destination path to write the exported result (required)
//
// Calls JSON-RPC `tools/call` with name `export_drawing` and writes the
// returned content to <out-file>. Text content is written as UTF-8; base64
// (e.g. PNG) content is decoded and written as binary.
//
// Requires Node 18+ (uses global fetch).
//
// Exit codes:
//   0  export written
//   1  request/response/write failure
//   2  missing arguments or env vars (usage printed)

'use strict';

const fs = require('fs');

function usage() {
  process.stderr.write(
    [
      'Usage:',
      '  EXCALIDASH_MCP_URL=<url> EXCALIDASH_TOKEN=<token> \\',
      '    node export-drawing.cjs <drawing-id> <format> <out-file>',
      '',
      'Arguments:',
      '  drawing-id  ID of the drawing to export',
      '  format      svg | png | json | excalidraw',
      '  out-file    Destination path for the exported result',
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

async function main() {
  const url = process.env.EXCALIDASH_MCP_URL;
  const token = process.env.EXCALIDASH_TOKEN;
  const drawingId = process.argv[2];
  const format = process.argv[3];
  const outFile = process.argv[4];

  if (!drawingId || !format || !outFile || !url || !token) {
    usage();
    process.exit(2);
  }

  let resp;
  try {
    resp = await rpc(url, token, 'tools/call', {
      name: 'export_drawing',
      arguments: { id: drawingId, drawingId, format },
    });
  } catch (err) {
    process.stderr.write(`export-drawing: request error: ${err.message}\n`);
    process.exit(1);
  }

  if (resp.status !== 200) {
    process.stderr.write(`export-drawing: HTTP ${resp.status}\n${resp.raw}\n`);
    process.exit(1);
  }

  if (!resp.body || resp.body.error) {
    const msg = resp.body && resp.body.error ? JSON.stringify(resp.body.error) : 'no/invalid body';
    process.stderr.write(`export-drawing: RPC error: ${msg}\n`);
    process.exit(1);
  }

  const result = resp.body.result;
  if (!result) {
    process.stderr.write('export-drawing: response missing result\n');
    process.exit(1);
  }

  // The MCP tool result content is an array of content parts. Find the first
  // usable part: image (base64) > resource > text.
  const content = Array.isArray(result.content) ? result.content : [];
  let wrote = false;

  for (const part of content) {
    if (part && part.type === 'image' && part.data) {
      fs.writeFileSync(outFile, Buffer.from(part.data, 'base64'));
      wrote = true;
      break;
    }
    if (part && part.type === 'resource' && part.resource) {
      const r = part.resource;
      if (typeof r.blob === 'string') {
        fs.writeFileSync(outFile, Buffer.from(r.blob, 'base64'));
        wrote = true;
        break;
      }
      if (typeof r.text === 'string') {
        fs.writeFileSync(outFile, r.text, 'utf8');
        wrote = true;
        break;
      }
    }
    if (part && part.type === 'text' && typeof part.text === 'string') {
      fs.writeFileSync(outFile, part.text, 'utf8');
      wrote = true;
      break;
    }
  }

  if (!wrote) {
    // No recognizable content part — fall back to dumping the raw result JSON.
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf8');
  }

  process.stdout.write(`export-drawing: wrote ${format} for ${drawingId} -> ${outFile}\n`);
  process.exit(0);
}

main().catch((err) => {
  process.stderr.write(`export-drawing: unexpected error: ${err && err.stack ? err.stack : err}\n`);
  process.exit(1);
});
