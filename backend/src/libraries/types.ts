/**
 * Shared types for the Excalidraw library management subsystem.
 *
 * This module provides the persisted, API-accessible curated-library layer that
 * the future ExcaliDash MCP server will consume. There are three access modes:
 *   - CORE_PACK        (default, always-preferred curated libraries)
 *   - SPECIALIZED_PACK (curated families grouped by category)
 *   - PUBLIC_SEARCH    (the full official Excalidraw catalog)
 */

/** Pack kinds persisted in `ExcalidrawLibraryPack.kind`. */
export type LibraryPackKind = "CORE" | "SPECIALIZED";

/** Where a search result originated. Surfaced to clients (and the future MCP). */
export type LibrarySourceMode = "core" | "specialized" | "public";

/** Accepted `mode` values for the search endpoint. */
export type LibrarySearchMode = "core" | "specialized" | "public" | "all";

/**
 * A raw entry as it appears in the official `libraries.json` catalog. Every
 * field is treated as untrusted/optional and validated before use.
 */
export interface RawCatalogEntry {
  name?: unknown;
  id?: unknown;
  description?: unknown;
  source?: unknown;
  preview?: unknown;
  created?: unknown;
  updated?: unknown;
  version?: unknown;
  itemNames?: unknown;
  authors?: unknown;
}

/** A catalog entry after validation/normalization, ready to upsert. */
export interface NormalizedCatalogEntry {
  officialId: string | null;
  name: string;
  slug: string;
  description: string | null;
  source: string;
  preview: string | null;
  version: number | null;
  authors: unknown[] | null;
  itemNames: string[] | null;
  createdDate: Date | null;
  updatedDate: Date | null;
}

/** A curated library reference inside a seed pack definition. */
export interface SeedLibraryRef {
  /** Official catalog name to resolve against. */
  name: string;
  /**
   * Alternative official catalog names to try when the primary name is not
   * present in the current catalog (e.g. "Google Architecture Icons" -> "GCP
   * Icons"). Also used as search aliases for the resolved library.
   */
  aliases?: string[];
  /** Ranking boost within the pack (higher = preferred). */
  priority?: number;
  /** Optional human note (kept in diagnostics / pack membership). */
  notes?: string;
}

/** A seed definition for a single pack (core or one specialized category). */
export interface SeedPackDefinition {
  slug: string;
  name: string;
  description?: string;
  kind: LibraryPackKind;
  /** Category slug for specialized child packs; null/undefined for roots. */
  category?: string | null;
  parentSlug?: string | null;
  priority?: number;
  libraries: SeedLibraryRef[];
}

/**
 * MCP-friendly representation of a library. Intentionally concise: it never
 * contains the raw `.excalidrawlib` blob — clients must explicitly request
 * caching/items to obtain content.
 */
export interface LibraryItemDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sourceMode: LibrarySourceMode;
  category?: string;
  curated: boolean;
  source: string;
  preview?: string;
  itemNames?: string[];
  cached: boolean;
  cachedAt?: string;
  sha256?: string;
  sizeBytes?: number;
}

/** Result of refreshing the official catalog. */
export interface CatalogRefreshResult {
  fetched: number;
  upserted: number;
  skipped: number;
  errors: string[];
  lastRefreshedAt: string | null;
}

/** Status summary surfaced by GET /libraries/status. */
export interface LibraryStatus {
  catalogCount: number;
  curatedCount: number;
  lastRefreshedAt: string | null;
  cacheDir: string;
  publicSearchEnabled: boolean;
  refreshIntervalHours: number;
  autoRefreshOnStart: boolean;
}

/** A single missing-library diagnostic produced while seeding packs. */
export interface MissingLibraryDiagnostic {
  pack: string;
  name: string;
}

/** Aggregate result of (re)seeding pack membership. */
export interface PackSeedDiagnostics {
  packsEnsured: number;
  membershipResolved: number;
  missing: MissingLibraryDiagnostic[];
  skippedReason?: string;
}

/** Combined result of a full seed (packs + catalog refresh + membership). */
export interface LibrarySeedResult {
  catalog: CatalogRefreshResult | { skipped: true; reason: string };
  packs: PackSeedDiagnostics;
}

/** Runtime configuration for the library subsystem (built from env in config.ts). */
export interface LibraryConfig {
  catalogUrl: string;
  baseUrl: string;
  cacheDir: string;
  refreshIntervalHours: number;
  downloadTimeoutMs: number;
  downloadMaxBytes: number;
  publicSearchEnabled: boolean;
  publicSearchMaxResults: number;
  autoRefreshOnStart: boolean;
}

/** A minimal body-stream reader (a subset of WHATWG ReadableStream's reader). */
export interface BodyReaderLike {
  read(): Promise<{ done: boolean; value?: Uint8Array }>;
  cancel(): Promise<void>;
}

export interface BodyStreamLike {
  getReader(): BodyReaderLike;
}

/** Minimal response shape we rely on from `fetch` (global fetch satisfies it). */
export interface FetchResponseLike {
  ok: boolean;
  status: number;
  statusText: string;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
  /** Present on the real fetch Response; enables a streamed, size-bounded read. */
  body?: BodyStreamLike | null;
}

/** Injectable fetch (defaults to global fetch; mocked in tests). */
export type FetchLike = (
  url: string,
  init?: {
    signal?: AbortSignal;
    headers?: Record<string, string>;
    /** We force "manual" so redirects are never auto-followed (SSRF guard). */
    redirect?: "error" | "manual" | "follow";
  },
) => Promise<FetchResponseLike>;

/** Loosely-typed Prisma surface used by the library services. The real
 * PrismaClient is structurally assignable; tests pass an in-memory fake. */
export interface LibraryDelegate {
  findMany(args?: unknown): Promise<unknown[]>;
  findUnique(args: unknown): Promise<unknown | null>;
  findFirst(args?: unknown): Promise<unknown | null>;
  upsert(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  updateMany(args: unknown): Promise<{ count: number }>;
  deleteMany(args: unknown): Promise<{ count: number }>;
  count(args?: unknown): Promise<number>;
}

export interface LibraryPrisma {
  excalidrawLibraryCatalogItem: LibraryDelegate;
  excalidrawLibraryPack: LibraryDelegate;
  excalidrawLibraryPackItem: LibraryDelegate;
}

/** A library row as a service consumes it (loose; mirrors the Prisma model). */
export interface CatalogItemRecord {
  id: string;
  officialId: string | null;
  name: string;
  slug: string;
  description: string | null;
  source: string;
  preview: string | null;
  version: number | null;
  itemNames: unknown;
  isCurated: boolean;
  cachePath: string | null;
  cachedAt: Date | null;
  sha256: string | null;
  sizeBytes: number | null;
  [key: string]: unknown;
}

/** A catalog library enriched with pack-membership context for ranking. */
export interface PackLibrary {
  item: CatalogItemRecord;
  aliases: string[];
  priority: number;
  category: string | null;
}
