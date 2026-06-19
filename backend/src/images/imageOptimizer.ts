/**
 * Server-side raster optimization + de-duplication for Excalidraw embedded
 * files (the `files` map of `{ [fileId]: { mimeType, dataURL, ... } }`).
 *
 * Large drawings embed images as base64 dataURLs; a single board can carry
 * ~17 MB of image bytes. This module:
 *   - strips metadata + clamps dimensions + re-encodes (via `sharp`),
 *   - keeps the ORIGINAL mime type (WebP→WebP, PNG→PNG, JPEG→JPEG) so existing
 *     Excalidraw elements / fileIds keep working,
 *   - de-duplicates identical content within a save so repeated images are only
 *     optimized once and the optimized buffer is reused for every fileId,
 *   - degrades gracefully: if `sharp` is missing, the file is too small, the
 *     mime is non-raster (SVG/GIF), or optimization fails, the original bytes
 *     are kept and a warning is logged.
 *
 * `sharp` is an OPTIONAL dependency. The pure helpers (parseDataUrl,
 * bufferToDataUrl, hashBuffer) never need it and are fully unit-tested.
 */
import { createHash } from "crypto";

export interface ImageOptimizeOptions {
  enabled: boolean;
  maxWidth: number;
  maxHeight: number;
  webpQuality: number;
  jpegQuality: number;
  pngCompressionLevel: number;
  /** Skip files smaller than this many bytes. */
  minBytes: number;
  /** Reuse the optimized result for identical content within one call. */
  cacheEnabled: boolean;
}

export interface ParsedDataUrl {
  mimeType: string;
  buffer: Buffer;
}

const DATA_URL_RE = /^data:([^;,]+);base64,(.*)$/s;

/** Mime types we will re-encode. SVG and GIF are intentionally excluded. */
const OPTIMIZABLE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export const isOptimizableMimeType = (mimeType: string | null | undefined): boolean =>
  typeof mimeType === "string" && OPTIMIZABLE_MIME_TYPES.has(mimeType.toLowerCase());

/** Parse a base64 `data:` URL into its mime type and raw bytes, or null. */
export const parseDataUrl = (dataURL: unknown): ParsedDataUrl | null => {
  if (typeof dataURL !== "string") return null;
  const match = DATA_URL_RE.exec(dataURL);
  if (!match) return null;
  const mimeType = match[1].trim().toLowerCase();
  const base64 = match[2];
  if (!mimeType || base64.length === 0) return null;
  try {
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length === 0) return null;
    return { mimeType, buffer };
  } catch {
    return null;
  }
};

/** Encode raw bytes back into a base64 `data:` URL of the given mime type. */
export const bufferToDataUrl = (buffer: Buffer, mimeType: string): string =>
  `data:${mimeType};base64,${buffer.toString("base64")}`;

export interface DataUrlHeader {
  mimeType: string;
  /** Approximate decoded byte length from the base64 length (no decode needed). */
  approxBytes: number;
}

const DATA_URL_HEADER_RE = /^data:([^;,]+);base64,/i;

/**
 * Inspect a base64 data URL's mime type and approximate size WITHOUT decoding
 * it. Used to cheaply skip files that can't / won't be optimized so the common
 * save path never pays for base64 decoding + hashing of small images.
 */
export const inspectDataUrlHeader = (dataURL: unknown): DataUrlHeader | null => {
  if (typeof dataURL !== "string") return null;
  const match = DATA_URL_HEADER_RE.exec(dataURL);
  if (!match) return null;
  const mimeType = match[1].trim().toLowerCase();
  if (!mimeType) return null;
  const base64Length = dataURL.length - match[0].length;
  if (base64Length <= 0) return null;
  // base64 encodes 3 bytes per 4 chars; ignoring padding is close enough.
  const approxBytes = Math.floor((base64Length * 3) / 4);
  return { mimeType, approxBytes };
};

/** Stable content hash (sha256 hex) used for de-duplication + caching. */
export const hashBuffer = (buffer: Buffer): string =>
  createHash("sha256").update(buffer).digest("hex");

// --- sharp (optional, lazily loaded) ---------------------------------------
/* eslint-disable @typescript-eslint/no-explicit-any */
let sharpModule: any | null | undefined; // undefined = untried, null = unavailable
let warnedMissingSharp = false;

const loadSharp = (): any | null => {
  if (sharpModule !== undefined) return sharpModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    sharpModule = require("sharp");
  } catch {
    sharpModule = null;
    if (!warnedMissingSharp) {
      warnedMissingSharp = true;
      console.warn(
        "[imageOptimizer] optional dependency 'sharp' is not installed; " +
          "server-side image optimization is disabled and images are stored as-is.",
      );
    }
  }
  return sharpModule;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface OptimizeImageResult {
  dataURL: string;
  mimeType: string | null;
  changed: boolean;
  originalBytes: number;
  optimizedBytes: number;
}

/**
 * Optimize a single image dataURL. Always resolves; never throws. Returns the
 * original dataURL unchanged when optimization is skipped or unhelpful.
 */
export const optimizeImageDataUrl = async (
  dataURL: string,
  opts: ImageOptimizeOptions,
): Promise<OptimizeImageResult> => {
  const parsed = parseDataUrl(dataURL);
  if (!parsed) {
    return { dataURL, mimeType: null, changed: false, originalBytes: 0, optimizedBytes: 0 };
  }
  const { mimeType, buffer } = parsed;
  const originalBytes = buffer.length;
  const unchanged: OptimizeImageResult = {
    dataURL,
    mimeType,
    changed: false,
    originalBytes,
    optimizedBytes: originalBytes,
  };

  if (!opts.enabled) return unchanged;
  if (!isOptimizableMimeType(mimeType)) return unchanged; // SVG/GIF/unknown → keep
  if (originalBytes < opts.minBytes) return unchanged;

  const sharp = loadSharp();
  if (!sharp) return unchanged;

  try {
    // `.rotate()` auto-orients from EXIF; metadata is stripped by default on
    // output. Clamp to max dimensions without ever enlarging.
    let pipeline = sharp(buffer, { failOn: "none" })
      .rotate()
      .resize({
        width: opts.maxWidth,
        height: opts.maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      });

    // Re-encode in the SAME mime type to preserve Excalidraw compatibility.
    if (mimeType === "image/png") {
      pipeline = pipeline.png({ compressionLevel: opts.pngCompressionLevel });
    } else if (mimeType === "image/jpeg") {
      pipeline = pipeline.jpeg({ quality: opts.jpegQuality, mozjpeg: true });
    } else {
      pipeline = pipeline.webp({ quality: opts.webpQuality });
    }

    const out = await pipeline.toBuffer();

    // Never grow the payload: if re-encoding didn't help, keep the original.
    if (out.length >= originalBytes) {
      return { dataURL, mimeType, changed: false, originalBytes, optimizedBytes: originalBytes };
    }

    return {
      dataURL: bufferToDataUrl(out, mimeType),
      mimeType,
      changed: true,
      originalBytes,
      optimizedBytes: out.length,
    };
  } catch (err) {
    console.warn("[imageOptimizer] optimization failed; using original", {
      mimeType,
      bytes: originalBytes,
      error: err instanceof Error ? err.message : String(err),
    });
    return unchanged;
  }
};

export interface OptimizeFilesStats {
  /** Number of file entries that were raster images (parsed as dataURLs). */
  imageFiles: number;
  /** Number of distinct images that were actually re-encoded smaller. */
  optimizedFiles: number;
  /** Number of file entries that reused an already-processed identical image. */
  dedupedFiles: number;
  originalBytesTotal: number;
  optimizedBytesTotal: number;
}

export interface OptimizeFilesResult {
  files: Record<string, unknown>;
  changed: boolean;
  changedIds: string[];
  stats: OptimizeFilesStats;
}

interface FileRecordLike {
  mimeType?: unknown;
  dataURL?: unknown;
  [key: string]: unknown;
}

const emptyStats = (): OptimizeFilesStats => ({
  imageFiles: 0,
  optimizedFiles: 0,
  dedupedFiles: 0,
  originalBytesTotal: 0,
  optimizedBytesTotal: 0,
});

/**
 * Optimize every image in an Excalidraw `files` map. fileIds are NEVER renamed
 * (element references stay valid); only each record's `dataURL` is swapped when
 * a smaller encoding is produced. Identical content is optimized once and the
 * result reused across fileIds.
 */
export const optimizeExcalidrawFiles = async (
  files: Record<string, unknown> | null | undefined,
  opts: ImageOptimizeOptions,
): Promise<OptimizeFilesResult> => {
  const stats = emptyStats();
  const source = (files ?? {}) as Record<string, FileRecordLike>;
  const entries = Object.entries(source);
  if (!opts.enabled || entries.length === 0) {
    return { files: files ?? {}, changed: false, changedIds: [], stats };
  }

  const next: Record<string, unknown> = { ...source };
  const changedIds: string[] = [];
  const resultByHash = new Map<string, { dataURL: string; changed: boolean }>();

  for (const [fileId, record] of entries) {
    const dataURL = record?.dataURL;
    if (typeof dataURL !== "string") continue;
    // Cheap header inspection first (no base64 decode).
    const header = inspectDataUrlHeader(dataURL);
    if (!header || !header.mimeType.startsWith("image/")) continue;

    stats.imageFiles += 1;

    // Pre-filter without decoding/hashing: skip non-raster (SVG/GIF) and files
    // below the size threshold. This keeps the common autosave path — where the
    // client already compressed images, so most are small — essentially free.
    if (!isOptimizableMimeType(header.mimeType) || header.approxBytes < opts.minBytes) {
      continue;
    }

    const parsed = parseDataUrl(dataURL);
    if (!parsed) continue;
    const hash = hashBuffer(parsed.buffer);

    let result = opts.cacheEnabled ? resultByHash.get(hash) : undefined;
    if (result) {
      stats.dedupedFiles += 1;
    } else {
      const opt = await optimizeImageDataUrl(dataURL, opts);
      result = { dataURL: opt.dataURL, changed: opt.changed };
      stats.originalBytesTotal += opt.originalBytes;
      stats.optimizedBytesTotal += opt.optimizedBytes;
      if (opt.changed) stats.optimizedFiles += 1;
      if (opts.cacheEnabled) resultByHash.set(hash, result);
    }

    if (result.changed && result.dataURL !== dataURL) {
      next[fileId] = { ...record, dataURL: result.dataURL };
      changedIds.push(fileId);
    }
  }

  const changed = changedIds.length > 0;
  return {
    files: changed ? next : (files ?? {}),
    changed,
    changedIds,
    stats,
  };
};
