import { describe, it, expect } from "vitest";
import {
  parseDataUrl,
  bufferToDataUrl,
  hashBuffer,
  isOptimizableMimeType,
  inspectDataUrlHeader,
  optimizeImageDataUrl,
  optimizeExcalidrawFiles,
  type ImageOptimizeOptions,
} from "./imageOptimizer";

const OPTS: ImageOptimizeOptions = {
  enabled: true,
  maxWidth: 1920,
  maxHeight: 1920,
  webpQuality: 82,
  jpegQuality: 82,
  pngCompressionLevel: 9,
  minBytes: 200_000,
  cacheEnabled: true,
};

const tinyPngDataUrl =
  "data:image/png;base64," +
  // 1x1 transparent PNG
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

describe("parseDataUrl", () => {
  it("parses a valid base64 data URL", () => {
    const parsed = parseDataUrl(tinyPngDataUrl);
    expect(parsed).not.toBeNull();
    expect(parsed!.mimeType).toBe("image/png");
    expect(parsed!.buffer.length).toBeGreaterThan(0);
  });

  it("returns null for non-strings, non-data-urls and empty payloads", () => {
    expect(parseDataUrl(undefined)).toBeNull();
    expect(parseDataUrl(123)).toBeNull();
    expect(parseDataUrl("https://example.com/x.png")).toBeNull();
    expect(parseDataUrl("data:image/png;base64,")).toBeNull();
  });

  it("round-trips through bufferToDataUrl", () => {
    const parsed = parseDataUrl(tinyPngDataUrl)!;
    const url = bufferToDataUrl(parsed.buffer, parsed.mimeType);
    const reparsed = parseDataUrl(url)!;
    expect(reparsed.buffer.equals(parsed.buffer)).toBe(true);
    expect(reparsed.mimeType).toBe("image/png");
  });
});

describe("hashBuffer", () => {
  it("is stable for identical content and differs for different content", () => {
    const a = Buffer.from("hello");
    const b = Buffer.from("hello");
    const c = Buffer.from("world");
    expect(hashBuffer(a)).toBe(hashBuffer(b));
    expect(hashBuffer(a)).not.toBe(hashBuffer(c));
  });
});

describe("inspectDataUrlHeader", () => {
  it("returns mime + approx size without decoding", () => {
    const header = inspectDataUrlHeader(tinyPngDataUrl);
    expect(header).not.toBeNull();
    expect(header!.mimeType).toBe("image/png");
    // Real decoded size of the tiny PNG.
    const real = parseDataUrl(tinyPngDataUrl)!.buffer.length;
    // Approx is within a few bytes of the real decoded length.
    expect(Math.abs(header!.approxBytes - real)).toBeLessThanOrEqual(3);
  });

  it("returns null for non-data-urls and non-strings", () => {
    expect(inspectDataUrlHeader("nope")).toBeNull();
    expect(inspectDataUrlHeader(42)).toBeNull();
    expect(inspectDataUrlHeader("data:image/png;base64,")).toBeNull();
  });
});

describe("isOptimizableMimeType", () => {
  it("accepts png/jpeg/webp and rejects svg/gif/unknown", () => {
    expect(isOptimizableMimeType("image/png")).toBe(true);
    expect(isOptimizableMimeType("image/jpeg")).toBe(true);
    expect(isOptimizableMimeType("image/webp")).toBe(true);
    expect(isOptimizableMimeType("image/svg+xml")).toBe(false);
    expect(isOptimizableMimeType("image/gif")).toBe(false);
    expect(isOptimizableMimeType(undefined)).toBe(false);
  });
});

describe("optimizeImageDataUrl (no sharp needed)", () => {
  it("returns the original unchanged when disabled", async () => {
    const res = await optimizeImageDataUrl(tinyPngDataUrl, { ...OPTS, enabled: false });
    expect(res.changed).toBe(false);
    expect(res.dataURL).toBe(tinyPngDataUrl);
  });

  it("skips files below minBytes", async () => {
    const res = await optimizeImageDataUrl(tinyPngDataUrl, { ...OPTS, minBytes: 1_000_000 });
    expect(res.changed).toBe(false);
    expect(res.dataURL).toBe(tinyPngDataUrl);
  });

  it("never processes SVG as raster", async () => {
    const svg =
      "data:image/svg+xml;base64," +
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>').toString("base64");
    const res = await optimizeImageDataUrl(svg, { ...OPTS, minBytes: 0 });
    expect(res.changed).toBe(false);
  });
});

describe("optimizeExcalidrawFiles", () => {
  it("returns unchanged when disabled or empty", async () => {
    const files = { f1: { mimeType: "image/png", dataURL: tinyPngDataUrl } };
    const res = await optimizeExcalidrawFiles(files, { ...OPTS, enabled: false });
    expect(res.changed).toBe(false);
    expect(res.files).toBe(files);
  });

  it("counts identical content once and de-duplicates the rest (preserving fileIds)", async () => {
    const files = {
      a: { mimeType: "image/png", dataURL: tinyPngDataUrl },
      b: { mimeType: "image/png", dataURL: tinyPngDataUrl }, // identical content
      notImage: { mimeType: "application/json", dataURL: "data:application/json;base64,e30=" },
    };
    const res = await optimizeExcalidrawFiles(files, { ...OPTS, minBytes: 0 });
    expect(res.stats.imageFiles).toBe(2); // a + b (json is not a raster image)
    expect(res.stats.dedupedFiles).toBe(1); // b reused a's result
    // fileIds are never renamed.
    expect(Object.keys(res.files).sort()).toEqual(["a", "b", "notImage"]);
  });

  it("ignores entries without a string dataURL", async () => {
    const files = { x: { mimeType: "image/png" } };
    const res = await optimizeExcalidrawFiles(files, OPTS);
    expect(res.stats.imageFiles).toBe(0);
    expect(res.changed).toBe(false);
  });

  it("counts small images but skips them (no decode/hash/optimize below minBytes)", async () => {
    // tinyPngDataUrl is well below the default 200KB threshold.
    const files = { a: { mimeType: "image/png", dataURL: tinyPngDataUrl } };
    const res = await optimizeExcalidrawFiles(files, OPTS); // minBytes 200000
    expect(res.stats.imageFiles).toBe(1); // still counted as an image
    expect(res.stats.dedupedFiles).toBe(0); // not hashed → not deduped
    expect(res.changed).toBe(false); // left untouched
    expect(res.files).toBe(files);
  });
});

// --- Optional: real raster optimization when `sharp` is installed ----------
const loadSharp = (): unknown | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("sharp");
  } catch {
    return null;
  }
};

const sharp = loadSharp() as
  | ((input: Buffer, opts?: unknown) => {
      png(opts?: unknown): { toBuffer(): Promise<Buffer> };
      resize(opts?: unknown): unknown;
      metadata(): Promise<{ width?: number; height?: number }>;
    })
  | null;

describe.runIf(Boolean(sharp))("optimizeImageDataUrl (sharp-backed)", () => {
  // Deterministic incompressible noise so the PNG is genuinely large.
  const makeNoisyPng = async (size: number): Promise<string> => {
    const channels = 3;
    const raw = Buffer.alloc(size * size * channels);
    let s = 0x9e3779b9;
    for (let i = 0; i < raw.length; i++) {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      raw[i] = (s >>> 0) & 0xff;
    }
    const png: Buffer = await (sharp as any)(raw, {
      raw: { width: size, height: size, channels },
    })
      .png()
      .toBuffer();
    return bufferToDataUrl(png, "image/png");
  };

  it("clamps oversized images and never grows the payload", async () => {
    const url = await makeNoisyPng(2400); // > 1920, large + incompressible
    const res = await optimizeImageDataUrl(url, OPTS);
    expect(res.optimizedBytes).toBeLessThanOrEqual(res.originalBytes);
    if (res.changed) {
      const parsed = parseDataUrl(res.dataURL)!;
      const meta = await (sharp as any)(parsed.buffer).metadata();
      expect(meta.width).toBeLessThanOrEqual(OPTS.maxWidth);
      expect(meta.height).toBeLessThanOrEqual(OPTS.maxHeight);
    }
  });
});
