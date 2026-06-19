#!/usr/bin/env node
/**
 * Smoke/benchmark for the save pipeline on a large .excalidraw file.
 *
 *   node scripts/benchmark-save.cjs --file /tmp/large.excalidraw
 *   node scripts/benchmark-save.cjs --file /tmp/large.excalidraw --url http://localhost:6767
 *
 * Measures the CPU-side cost of a save (parse, per-image content hashing used by
 * de-duplication, and JSON re-serialization) plus optional server-side image
 * optimization when the backend is built (backend/dist). A real authenticated
 * HTTP save needs a logged-in session/CSRF token, so `--url` only times a
 * `/health` round-trip as a network baseline.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const args = process.argv.slice(2);
const readArg = (name, fallback) => {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  const value = args[i + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
};

const filePath = readArg("--file", null);
const url = readArg("--url", null);
if (!filePath) {
  console.error("Usage: node scripts/benchmark-save.cjs --file <path.excalidraw> [--url http://localhost:6767]");
  process.exit(1);
}

const ms = () => Number(process.hrtime.bigint()) / 1e6;
const fmtMs = (n) => `${n.toFixed(1)} ms`;
const fmtMb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MiB`;

const parseDataUrl = (dataURL) => {
  if (typeof dataURL !== "string") return null;
  const m = /^data:([^;,]+);base64,(.*)$/s.exec(dataURL);
  if (!m) return null;
  return { mimeType: m[1].toLowerCase(), buffer: Buffer.from(m[2], "base64") };
};

const loadDistOptimizer = () => {
  try {
    return require(path.resolve(__dirname, "../backend/dist/images/imageOptimizer.js"));
  } catch {
    return null;
  }
};

async function main() {
  const raw = fs.readFileSync(filePath, "utf8");
  console.log(`File: ${filePath} (${fmtMb(Buffer.byteLength(raw))})`);

  const tParse = ms();
  const drawing = JSON.parse(raw);
  const parseMs = ms() - tParse;

  const elements = Array.isArray(drawing.elements) ? drawing.elements : [];
  const files = drawing.files && typeof drawing.files === "object" ? drawing.files : {};
  const fileEntries = Object.values(files);
  const imageEntries = fileEntries.filter((f) => parseDataUrl(f && f.dataURL));

  // Content-hash pass (this is what de-duplication costs per save).
  const tHash = ms();
  const seen = new Map();
  let duplicates = 0;
  for (const f of imageEntries) {
    const parsed = parseDataUrl(f.dataURL);
    const hash = crypto.createHash("sha256").update(parsed.buffer).digest("hex");
    if (seen.has(hash)) duplicates += 1;
    else seen.set(hash, true);
  }
  const hashMs = ms() - tHash;

  const tSerialize = ms();
  const serialized = JSON.stringify(drawing);
  const serializeMs = ms() - tSerialize;

  console.log("");
  console.log(`elements:        ${elements.length}`);
  console.log(`  image elems:   ${elements.filter((e) => e && e.type === "image").length}`);
  console.log(`  arrow elems:   ${elements.filter((e) => e && e.type === "arrow").length}`);
  console.log(`files:           ${fileEntries.length} (image dataURLs: ${imageEntries.length})`);
  console.log(`  duplicate imgs: ${duplicates} (would be de-duplicated)`);
  console.log(`payload bytes:   ${fmtMb(Buffer.byteLength(serialized))}`);
  console.log("");
  console.log(`parse:           ${fmtMs(parseMs)}`);
  console.log(`hash pass:       ${fmtMs(hashMs)}`);
  console.log(`serialize:       ${fmtMs(serializeMs)}`);

  const optimizer = loadDistOptimizer();
  if (optimizer && typeof optimizer.optimizeExcalidrawFiles === "function") {
    const opts = {
      enabled: true,
      maxWidth: 1920,
      maxHeight: 1920,
      webpQuality: 82,
      jpegQuality: 82,
      pngCompressionLevel: 9,
      minBytes: 200000,
      cacheEnabled: true,
    };
    const tOpt = ms();
    const result = await optimizer.optimizeExcalidrawFiles(files, opts);
    const optMs = ms() - tOpt;
    const { stats } = result;
    console.log("");
    console.log("server image optimization (backend/dist):");
    console.log(`  time:          ${fmtMs(optMs)}`);
    console.log(`  imageFiles:    ${stats.imageFiles}`);
    console.log(`  optimized:     ${stats.optimizedFiles}`);
    console.log(`  deduped:       ${stats.dedupedFiles}`);
    if (stats.originalBytesTotal > 0) {
      const saved = stats.originalBytesTotal - stats.optimizedBytesTotal;
      const pct = ((saved / stats.originalBytesTotal) * 100).toFixed(1);
      console.log(`  bytes saved:   ${fmtMb(saved)} (${pct}%)`);
    }
  } else {
    console.log("");
    console.log("(server optimizer not benchmarked — build the backend with `npm --prefix backend run build`)");
  }

  if (url) {
    const target = `${url.replace(/\/+$/, "")}/health`;
    try {
      const tNet = ms();
      const res = await fetch(target);
      const netMs = ms() - tNet;
      console.log("");
      console.log(`network baseline (GET ${target}): ${res.status} in ${fmtMs(netMs)}`);
      console.log("(authenticated save timing needs a logged-in session + CSRF token)");
    } catch (err) {
      console.log("");
      console.log(`network baseline failed: ${err && err.message ? err.message : err}`);
    }
  }
}

main().catch((err) => {
  console.error("benchmark-save failed:", err);
  process.exit(1);
});
