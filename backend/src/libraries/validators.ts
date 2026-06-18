/**
 * Validation + normalization helpers for the library subsystem.
 *
 * Security posture (see README "Library security"):
 *   - No arbitrary URL downloads. Only the official Excalidraw catalog host and
 *     path prefix are reachable (`assertAllowedUrl`).
 *   - Every `source`/`preview` path is validated: no absolute URLs, no `..`, no
 *     path traversal, no protocol, no control characters, must end with the
 *     expected extension.
 *   - JSON is parsed defensively with clear errors.
 *   - Cache writes are constrained to the configured cache directory.
 */
import path from "path";
import { LibraryError } from "./errors";
import type { NormalizedCatalogEntry, RawCatalogEntry } from "./types";

/** Official, trusted host + path prefix. Hard-coded so env overrides cannot
 * broaden the allowlist to arbitrary hosts. */
export const ALLOWED_CATALOG_HOST = "raw.githubusercontent.com";
export const ALLOWED_CATALOG_PATH_PREFIX =
  "/excalidraw/excalidraw-libraries/main/";
export const ALLOWED_LIBRARIES_PATH_PREFIX =
  "/excalidraw/excalidraw-libraries/main/libraries/";

const SOURCE_SEGMENT = /^[A-Za-z0-9._-]+$/;
const PREVIEW_EXT = /\.(png|svg|jpg|jpeg|webp|gif)$/i;
const LIBRARY_EXT = /\.excalidrawlib$/i;

/** True if the string contains any ASCII control character (or DEL). */
const hasControlChars = (value: string): boolean => {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
};

/** Lowercase, strip accents and non-alphanumerics to single spaces. Used for
 * name matching/search so "AWS Architecture Icons" === "aws  architecture-icons". */
export const normalizeName = (value: string): string =>
  String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Kebab-case slug. */
export const slugify = (value: string): string =>
  String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Stable, globally-unique slug derived from a library's `source` path. Catalog
 * *names* are not unique (e.g. duplicate "AWS Architecture Icons"), but every
 * `source` is unique, so we slug the source minus its extension.
 */
export const slugFromSource = (source: string): string =>
  slugify(String(source).replace(LIBRARY_EXT, ""));

const isSafeRelativePath = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 256) return false;
  if (hasControlChars(trimmed)) return false;
  if (trimmed.includes("\\")) return false;
  if (trimmed.includes("://")) return false; // no protocol / absolute URL
  if (trimmed.startsWith("/")) return false; // no absolute path
  if (trimmed.includes("..")) return false; // no traversal
  const segments = trimmed.split("/");
  if (segments.length < 2) return false; // catalog uses "author/file"
  return segments.every(
    (segment) =>
      segment.length > 0 &&
      segment !== "." &&
      segment !== ".." &&
      SOURCE_SEGMENT.test(segment),
  );
};

/** A `.excalidrawlib` source path is a safe relative path with the right ext. */
export const isValidSourcePath = (source: unknown): source is string =>
  isSafeRelativePath(source) && LIBRARY_EXT.test(String(source).trim());

/** A preview path is a safe relative path pointing at an image. */
export const isValidPreviewPath = (preview: unknown): preview is string =>
  isSafeRelativePath(preview) && PREVIEW_EXT.test(String(preview).trim());

/** Join a base URL with a validated relative path (no trailing-slash issues). */
export const joinLibraryUrl = (baseUrl: string, relativePath: string): string =>
  `${baseUrl.replace(/\/+$/, "")}/${relativePath.replace(/^\/+/, "")}`;

/**
 * Assert a URL targets the official Excalidraw catalog over HTTPS. Throws a
 * 400 LibraryError otherwise. This is the single choke point that prevents
 * SSRF / arbitrary downloads even if catalog/base env vars are misconfigured.
 */
export const assertAllowedUrl = (
  rawUrl: string,
  options: { requireLibrariesPrefix?: boolean } = {},
): URL => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new LibraryError(`Invalid URL: ${rawUrl}`, 400, "INVALID_URL");
  }
  if (parsed.protocol !== "https:") {
    throw new LibraryError(
      "Only https:// downloads from the official Excalidraw catalog are allowed",
      400,
      "URL_NOT_ALLOWED",
    );
  }
  if (parsed.hostname.toLowerCase() !== ALLOWED_CATALOG_HOST) {
    throw new LibraryError(
      `Host not allowed: ${parsed.hostname}. Only ${ALLOWED_CATALOG_HOST} is permitted`,
      400,
      "URL_NOT_ALLOWED",
    );
  }
  if (parsed.pathname.includes("..")) {
    throw new LibraryError(
      "Path traversal detected in URL",
      400,
      "URL_NOT_ALLOWED",
    );
  }
  const requiredPrefix = options.requireLibrariesPrefix
    ? ALLOWED_LIBRARIES_PATH_PREFIX
    : ALLOWED_CATALOG_PATH_PREFIX;
  if (!parsed.pathname.startsWith(requiredPrefix)) {
    throw new LibraryError(
      `URL path not allowed: ${parsed.pathname}`,
      400,
      "URL_NOT_ALLOWED",
    );
  }
  return parsed;
};

export interface JsonParseResult<T> {
  ok: boolean;
  value?: T;
  error?: string;
}

/** Defensive JSON.parse that never throws. */
export const safeJsonParse = <T = unknown>(
  text: string,
): JsonParseResult<T> => {
  try {
    return { ok: true, value: JSON.parse(text) as T };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid JSON",
    };
  }
};

export interface ParsedLibraryFile {
  valid: boolean;
  version: number | null;
  itemCount: number;
  itemNames: string[];
}

/**
 * Detect and summarize a `.excalidrawlib` document. Supports both the v2
 * `libraryItems` shape and the legacy v1 `library` shape. Throws a 422
 * LibraryError when the JSON itself is unparseable.
 */
export const parseExcalidrawLibrary = (text: string): ParsedLibraryFile => {
  const parsed = safeJsonParse<Record<string, unknown>>(text);
  if (!parsed.ok || parsed.value === undefined) {
    throw new LibraryError(
      `Invalid .excalidrawlib JSON: ${parsed.error ?? "parse error"}`,
      422,
      "INVALID_LIBRARY_JSON",
    );
  }
  const data = parsed.value;
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { valid: false, version: null, itemCount: 0, itemNames: [] };
  }

  const v2Items = Array.isArray(data.libraryItems)
    ? (data.libraryItems as unknown[])
    : null;
  const v1Items = Array.isArray(data.library)
    ? (data.library as unknown[])
    : null;
  const items = v2Items ?? v1Items;

  const declaredType = data.type === "excalidrawlib";
  if (!declaredType && items === null) {
    return { valid: false, version: null, itemCount: 0, itemNames: [] };
  }

  const version =
    typeof data.version === "number" && Number.isFinite(data.version)
      ? Math.trunc(data.version)
      : null;

  const itemNames = v2Items
    ? v2Items
        .map((item) =>
          item &&
          typeof item === "object" &&
          typeof (item as { name?: unknown }).name === "string"
            ? (item as { name: string }).name
            : null,
        )
        .filter((name): name is string => Boolean(name))
    : [];

  return {
    valid: true,
    version,
    itemCount: items ? items.length : 0,
    itemNames,
  };
};

const parseCatalogDate = (value: unknown): Date | null => {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Validate + normalize a raw catalog entry. Returns `null` for entries that
 * cannot be safely used (missing name or an unsafe `source`) so the caller can
 * skip them without crashing the whole refresh.
 */
export const normalizeCatalogEntry = (
  raw: RawCatalogEntry,
): NormalizedCatalogEntry | null => {
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const source = typeof raw.source === "string" ? raw.source.trim() : "";
  if (name.length === 0 || !isValidSourcePath(source)) {
    return null;
  }

  const previewRaw = typeof raw.preview === "string" ? raw.preview.trim() : "";
  const preview = isValidPreviewPath(previewRaw) ? previewRaw : null;

  const versionNumber = Number(raw.version);
  const version = Number.isFinite(versionNumber)
    ? Math.trunc(versionNumber)
    : null;

  const officialId =
    typeof raw.id === "string" && raw.id.trim().length > 0
      ? raw.id.trim()
      : null;

  const description =
    typeof raw.description === "string" ? raw.description : null;

  const itemNames = Array.isArray(raw.itemNames)
    ? raw.itemNames.filter((item): item is string => typeof item === "string")
    : null;

  const authors = Array.isArray(raw.authors) ? (raw.authors as unknown[]) : null;

  return {
    officialId,
    name,
    slug: slugFromSource(source),
    description,
    source,
    preview,
    version,
    authors,
    itemNames,
    createdDate: parseCatalogDate(raw.created),
    updatedDate: parseCatalogDate(raw.updated),
  };
};

/** Map a `source` to a flat, collision-free cache filename. */
export const cacheFileName = (source: string): string =>
  String(source).replace(/[^A-Za-z0-9._-]+/g, "__");

/**
 * Resolve a cache file path and assert it stays inside the cache directory.
 * Defends against any traversal that slipped past `isValidSourcePath`.
 */
export const resolveCachePath = (cacheDir: string, source: string): string => {
  const resolvedDir = path.resolve(cacheDir);
  const candidate = path.resolve(resolvedDir, cacheFileName(source));
  if (
    candidate !== resolvedDir &&
    !candidate.startsWith(resolvedDir + path.sep)
  ) {
    throw new LibraryError(
      "Resolved cache path escapes the cache directory",
      400,
      "UNSAFE_CACHE_PATH",
    );
  }
  return candidate;
};
