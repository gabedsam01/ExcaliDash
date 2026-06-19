#!/usr/bin/env node
/**
 * Generate a large .excalidraw fixture for save/performance testing — WITHOUT
 * needing any real drawing. Two modes:
 *
 *   Structured (realistic large board):
 *     node scripts/generate-large-excalidraw.cjs --images 150 --arrows 500 --output /tmp/large.excalidraw
 *     # optional: --image-kb 110  (approx KB per embedded image)
 *     #           --dup-ratio 0.2 (fraction of images that reuse another's bytes, to exercise dedupe)
 *
 *   Single big payload (back-compat):
 *     node scripts/generate-large-excalidraw.cjs --size-mb 35 --output /tmp/large.excalidraw
 *
 * NOTE: embedded image bytes are synthetic filler (not decodable PNGs), so this
 * is a payload-size / save-latency fixture. Real raster optimization is covered
 * by the backend unit tests.
 */
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);

const readArg = (name, fallback) => {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
};

const hasArg = (name) => args.includes(name);

// Tiny deterministic PRNG so runs are reproducible without Math.random.
let seedState = 0x12345678;
const rand = () => {
  seedState ^= seedState << 13;
  seedState ^= seedState >>> 17;
  seedState ^= seedState << 5;
  return ((seedState >>> 0) % 100000) / 100000;
};
const randInt = (min, max) => Math.floor(min + rand() * (max - min));
let idCounter = 0;
const nextId = (prefix) => `${prefix}-${(idCounter += 1)}`;

// Each image gets a unique marker prefix so its content (and content hash)
// differs from the others by default; --dup-ratio reuses an existing image.
const makeDataUrl = (approxBytes, marker) => {
  const prefix = Buffer.from(`excalidash-${marker}-`).toString("base64");
  const fillerLen = Math.max(4, approxBytes - prefix.length);
  return "data:image/png;base64," + prefix + "A".repeat(fillerLen);
};

const writeFixture = (drawing, outputPath) => {
  const payload = JSON.stringify(drawing);
  fs.writeFileSync(outputPath, payload);
  const mib = (Buffer.byteLength(payload) / 1024 / 1024).toFixed(2);
  const elements = drawing.elements.length;
  const files = Object.keys(drawing.files).length;
  console.log(
    `Created ${outputPath} (${mib} MiB) — elements=${elements}, files=${files}`,
  );
};

const generateStructured = () => {
  const imageCount = Math.max(0, Number(readArg("--images", "150")));
  const arrowCount = Math.max(0, Number(readArg("--arrows", "500")));
  const imageKb = Math.max(1, Number(readArg("--image-kb", "110")));
  const dupRatio = Math.min(1, Math.max(0, Number(readArg("--dup-ratio", "0"))));
  const outputPath = path.resolve(readArg("--output", "large.excalidraw"));

  if (!Number.isFinite(imageCount) || !Number.isFinite(arrowCount)) {
    throw new Error("--images and --arrows must be numbers");
  }

  const elements = [];
  const files = {};
  const imageFileIds = [];
  const imageBytes = Math.floor(imageKb * 1024);

  for (let i = 0; i < imageCount; i++) {
    const fileId = nextId("file");
    // A fraction of images reuse an earlier image's bytes (duplicate content).
    const reuse =
      dupRatio > 0 && imageFileIds.length > 0 && rand() < dupRatio
        ? imageFileIds[randInt(0, imageFileIds.length)]
        : null;
    files[fileId] = {
      id: fileId,
      mimeType: "image/png",
      created: 1700000000000 + i,
      lastRetrieved: 1700000000000 + i,
      dataURL: reuse ? files[reuse].dataURL : makeDataUrl(imageBytes, `${i}`),
    };
    imageFileIds.push(fileId);

    elements.push({
      id: nextId("img"),
      type: "image",
      x: randInt(0, 4000),
      y: randInt(0, 4000),
      width: 200,
      height: 200,
      angle: 0,
      fileId,
      status: "saved",
      strokeColor: "transparent",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      seed: randInt(1, 2 ** 30),
      version: 1,
      versionNonce: randInt(1, 2 ** 30),
      isDeleted: false,
      boundElements: null,
      updated: 1700000000000 + i,
      link: null,
      locked: false,
      frameId: null,
      groupIds: [],
      roundness: null,
    });
  }

  for (let i = 0; i < arrowCount; i++) {
    const x = randInt(0, 4000);
    const y = randInt(0, 4000);
    elements.push({
      id: nextId("arrow"),
      type: "arrow",
      x,
      y,
      width: randInt(20, 300),
      height: randInt(20, 300),
      angle: 0,
      strokeColor: "#1e1e1e",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      seed: randInt(1, 2 ** 30),
      version: 1,
      versionNonce: randInt(1, 2 ** 30),
      isDeleted: false,
      boundElements: null,
      updated: 1700000000000 + i,
      link: null,
      locked: false,
      frameId: null,
      groupIds: [],
      roundness: { type: 2 },
      points: [
        [0, 0],
        [randInt(20, 300), randInt(-150, 150)],
      ],
      lastCommittedPoint: null,
      startBinding: null,
      endBinding: null,
      startArrowhead: null,
      endArrowhead: "arrow",
    });
  }

  writeFixture(
    {
      type: "excalidraw",
      version: 2,
      source: "excalidash-large-fixture",
      elements,
      appState: { viewBackgroundColor: "#ffffff", gridSize: null },
      files,
    },
    outputPath,
  );
};

const generateSingleBig = () => {
  const sizeMb = Number(readArg("--size-mb", "35"));
  const outputPath = path.resolve(readArg("--output", `large-${sizeMb}mb.excalidraw`));
  if (!Number.isFinite(sizeMb) || sizeMb <= 0) {
    throw new Error("--size-mb must be a positive number");
  }
  const targetBytes = Math.floor(sizeMb * 1024 * 1024);
  const baseDrawing = {
    type: "excalidraw",
    version: 2,
    source: "excalidash-large-upload-fixture",
    elements: [],
    appState: { viewBackgroundColor: "#ffffff" },
    files: {
      "large-fixture-image": {
        id: "large-fixture-image",
        mimeType: "image/png",
        created: 1700000000000,
        lastRetrieved: 1700000000000,
        dataURL: "data:image/png;base64,",
      },
    },
  };
  const emptyPayloadBytes = Buffer.byteLength(JSON.stringify(baseDrawing));
  const fillerBytes = targetBytes - emptyPayloadBytes;
  if (fillerBytes < 4) {
    throw new Error(
      `Requested size is too small; use at least ${Math.ceil(emptyPayloadBytes / 1024 / 1024)} MB`,
    );
  }
  baseDrawing.files["large-fixture-image"].dataURL += "A".repeat(fillerBytes);
  writeFixture(baseDrawing, outputPath);
};

// Structured mode is selected by --images / --arrows / --image-kb; otherwise
// fall back to the single-big-payload (--size-mb) mode for back-compat.
if (hasArg("--images") || hasArg("--arrows") || hasArg("--image-kb") || hasArg("--dup-ratio")) {
  generateStructured();
} else {
  generateSingleBig();
}
