/**
 * catalogService: fetches + normalizes the official catalog into PostgreSQL,
 * reports status, and runs mode-aware search.
 *
 * Search modes:
 *   - core        -> only core_pack
 *   - specialized -> specialized_pack (optionally one category)
 *   - public      -> full official catalog (no curated boost; disabled by flag)
 *   - all         -> core, then specialized, then public (deduped by id)
 */
import { fetchAllowedText } from "./http";
import { LibraryError } from "./errors";
import { toLibraryDto } from "./mapper";
import { matchesQuery, rankLibraries, type RankableLibrary } from "./ranking";
import { resolveCategorySlug } from "./seeds/aliases";
import { normalizeCatalogEntry } from "./validators";
import type { PackService } from "./packService";
import type {
  CatalogItemRecord,
  CatalogRefreshResult,
  FetchLike,
  LibraryConfig,
  LibraryItemDto,
  LibraryPrisma,
  LibrarySearchMode,
  LibrarySourceMode,
  LibraryStatus,
  PackLibrary,
  RawCatalogEntry,
} from "./types";

const DEFAULT_SEARCH_LIMIT = 25;
const MAX_SEARCH_LIMIT = 100;
const PUBLIC_WARNING = "Public results are not curated.";

export interface LibrarySearchParams {
  query?: string;
  mode?: LibrarySearchMode;
  category?: string;
  limit?: number;
}

export interface LibrarySearchResponse {
  mode: LibrarySearchMode;
  query: string;
  category: string | null;
  publicSearchEnabled: boolean;
  count: number;
  results: LibraryItemDto[];
  warning?: string;
}

export interface CatalogService {
  refresh(): Promise<CatalogRefreshResult>;
  getStatus(): Promise<LibraryStatus>;
  getById(id: string): Promise<LibraryItemDto | null>;
  search(params: LibrarySearchParams): Promise<LibrarySearchResponse>;
}

/** A rankable that retains its backing record + category for DTO mapping. */
interface RankableEntry extends RankableLibrary {
  _item: CatalogItemRecord;
  _category: string | null;
}

const toRankable = (
  lib: PackLibrary,
  curated: boolean,
): RankableEntry => ({
  name: lib.item.name,
  description: lib.item.description,
  itemNames: Array.isArray(lib.item.itemNames)
    ? (lib.item.itemNames as string[])
    : null,
  aliases: lib.aliases,
  curated,
  category: lib.category,
  version: lib.item.version,
  updatedDate: (lib.item.updatedDate as Date | null | undefined) ?? null,
  priority: lib.priority,
  _item: lib.item,
  _category: lib.category,
});

const catalogItemToRankable = (item: CatalogItemRecord): RankableEntry => ({
  name: item.name,
  description: item.description,
  itemNames: Array.isArray(item.itemNames)
    ? (item.itemNames as string[])
    : null,
  aliases: [],
  curated: Boolean(item.isCurated),
  category: null,
  version: item.version,
  updatedDate: (item.updatedDate as Date | null | undefined) ?? null,
  priority: 0,
  _item: item,
  _category: null,
});

const clampLimit = (limit?: number): number => {
  if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_SEARCH_LIMIT;
  return Math.max(1, Math.min(MAX_SEARCH_LIMIT, Math.trunc(limit)));
};

export const createCatalogService = (deps: {
  prisma: LibraryPrisma;
  config: LibraryConfig;
  packService: PackService;
  fetchImpl?: FetchLike;
  logger?: Pick<Console, "warn" | "info" | "error">;
}): CatalogService => {
  const { prisma, config, packService } = deps;
  const fetchImpl = deps.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
  const logger = deps.logger ?? console;

  const refresh = async (): Promise<CatalogRefreshResult> => {
    if (!fetchImpl) {
      throw new LibraryError(
        "No fetch implementation available for catalog refresh",
        500,
        "NO_FETCH",
      );
    }

    const text = await fetchAllowedText(fetchImpl, config.catalogUrl, {
      timeoutMs: config.downloadTimeoutMs,
      // Catalog is JSON metadata; reuse the same generous cap.
      maxBytes: config.downloadMaxBytes,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      throw new LibraryError(
        `Catalog JSON is invalid: ${
          error instanceof Error ? error.message : "parse error"
        }`,
        502,
        "INVALID_CATALOG_JSON",
      );
    }
    if (!Array.isArray(parsed)) {
      throw new LibraryError(
        "Catalog JSON must be an array of entries",
        502,
        "INVALID_CATALOG_SHAPE",
      );
    }

    const now = new Date();
    const entries = (parsed as RawCatalogEntry[])
      .map((raw) => normalizeCatalogEntry(raw))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    const errors: string[] = [];
    let upserted = 0;
    for (const entry of entries) {
      try {
        await prisma.excalidrawLibraryCatalogItem.upsert({
          where: { source: entry.source },
          create: {
            officialId: entry.officialId,
            name: entry.name,
            slug: entry.slug,
            description: entry.description,
            source: entry.source,
            preview: entry.preview,
            version: entry.version,
            authors: entry.authors ?? undefined,
            itemNames: entry.itemNames ?? undefined,
            createdDate: entry.createdDate,
            updatedDate: entry.updatedDate,
            isAvailable: true,
            lastFetchedAt: now,
          },
          update: {
            officialId: entry.officialId,
            name: entry.name,
            slug: entry.slug,
            description: entry.description,
            preview: entry.preview,
            version: entry.version,
            authors: entry.authors ?? undefined,
            itemNames: entry.itemNames ?? undefined,
            createdDate: entry.createdDate,
            updatedDate: entry.updatedDate,
            isAvailable: true,
            lastFetchedAt: now,
          },
        });
        upserted += 1;
      } catch (error) {
        errors.push(
          `${entry.source}: ${
            error instanceof Error ? error.message : "upsert failed"
          }`,
        );
        logger.error(`[libraries] failed to upsert ${entry.source}:`, error);
      }
    }

    const result: CatalogRefreshResult = {
      fetched: parsed.length,
      upserted,
      skipped: parsed.length - entries.length,
      errors,
      lastRefreshedAt: now.toISOString(),
    };
    logger.info(
      `[libraries] catalog refresh: fetched=${result.fetched} upserted=${result.upserted} skipped=${result.skipped}`,
    );
    return result;
  };

  const getStatus = async (): Promise<LibraryStatus> => {
    const [catalogCount, curatedCount, latest] = await Promise.all([
      prisma.excalidrawLibraryCatalogItem.count(),
      prisma.excalidrawLibraryCatalogItem.count({ where: { isCurated: true } }),
      prisma.excalidrawLibraryCatalogItem.findFirst({
        where: { lastFetchedAt: { not: null } },
        orderBy: { lastFetchedAt: "desc" },
        select: { lastFetchedAt: true },
      }) as Promise<{ lastFetchedAt: Date | null } | null>,
    ]);

    return {
      catalogCount,
      curatedCount,
      lastRefreshedAt: latest?.lastFetchedAt
        ? new Date(latest.lastFetchedAt).toISOString()
        : null,
      cacheDir: config.cacheDir,
      publicSearchEnabled: config.publicSearchEnabled,
      refreshIntervalHours: config.refreshIntervalHours,
      autoRefreshOnStart: config.autoRefreshOnStart,
    };
  };

  const getById = async (id: string): Promise<LibraryItemDto | null> => {
    const item = (await prisma.excalidrawLibraryCatalogItem.findUnique({
      where: { id },
    })) as CatalogItemRecord | null;
    if (!item) return null;

    const membership = await packService.getLibraryMembership(id);
    const sourceMode: LibrarySourceMode = membership.inCore
      ? "core"
      : membership.categories.length > 0
        ? "specialized"
        : "public";
    const category =
      sourceMode === "specialized" ? membership.categories[0] : null;

    return toLibraryDto(item, { sourceMode, category });
  };

  const getAllCatalog = async (): Promise<CatalogItemRecord[]> =>
    (await prisma.excalidrawLibraryCatalogItem.findMany()) as CatalogItemRecord[];

  /** Rank a curated pool and map to DTOs. */
  const rankCuratedPool = (
    query: string,
    pool: PackLibrary[],
    sourceMode: LibrarySourceMode,
    categoryBoost: string | null,
  ): LibraryItemDto[] => {
    const rankable = pool.map((lib) => toRankable(lib, true));
    const filtered = query
      ? rankable.filter((entry) => matchesQuery(query, entry))
      : rankable;
    const ranked = rankLibraries(query, filtered, {
      applyCuratedBoost: true,
      category: categoryBoost,
    });
    return ranked.map((entry) =>
      toLibraryDto(entry._item, {
        sourceMode,
        category: entry._category,
      }),
    );
  };

  /** Rank the full catalog as a public pool (no curated boost). `excludeIds`
   * (used by mode=all) drops already-selected curated rows BEFORE the
   * publicSearchMaxResults slice, so they never steal public-only slots. */
  const rankPublicPool = (
    query: string,
    items: CatalogItemRecord[],
    excludeIds?: Set<string>,
  ): LibraryItemDto[] => {
    const rankable = items.map(catalogItemToRankable);
    const filtered = rankable.filter(
      (entry) =>
        (!query || matchesQuery(query, entry)) &&
        !excludeIds?.has(entry._item.id),
    );
    const ranked = rankLibraries(query, filtered, {
      applyCuratedBoost: false,
    });
    return ranked
      .slice(0, config.publicSearchMaxResults)
      .map((entry) =>
        toLibraryDto(entry._item, { sourceMode: "public", category: null }),
      );
  };

  const search = async (
    params: LibrarySearchParams,
  ): Promise<LibrarySearchResponse> => {
    const query = (params.query ?? "").trim();
    const mode: LibrarySearchMode = params.mode ?? "all";
    const limit = clampLimit(params.limit);
    const publicEnabled = config.publicSearchEnabled;
    const requestedCategory = params.category ?? null;
    const categorySlug = requestedCategory
      ? resolveCategorySlug(requestedCategory)
      : null;

    const base = {
      query,
      category: categorySlug ?? requestedCategory,
      publicSearchEnabled: publicEnabled,
    };

    if (mode === "core") {
      const pool = await packService.getPackLibraries("core_pack");
      const results = rankCuratedPool(query, pool, "core", null).slice(0, limit);
      return { ...base, mode, count: results.length, results };
    }

    if (mode === "specialized") {
      const pool = await packService.getSpecializedLibraries(categorySlug);
      const results = rankCuratedPool(
        query,
        pool,
        "specialized",
        categorySlug,
      ).slice(0, limit);
      return { ...base, mode, count: results.length, results };
    }

    if (mode === "public") {
      if (!publicEnabled) {
        return {
          ...base,
          mode,
          count: 0,
          results: [],
          warning: "Public library search is disabled.",
        };
      }
      const results = rankPublicPool(query, await getAllCatalog()).slice(
        0,
        limit,
      );
      return {
        ...base,
        mode,
        count: results.length,
        results,
        warning: results.length > 0 ? PUBLIC_WARNING : undefined,
      };
    }

    // mode === "all": core, then specialized, then public; dedupe by id.
    const corePool = await packService.getPackLibraries("core_pack");
    const specializedPool =
      await packService.getSpecializedLibraries(categorySlug);
    const coreResults = rankCuratedPool(query, corePool, "core", null);
    const specializedResults = rankCuratedPool(
      query,
      specializedPool,
      "specialized",
      categorySlug,
    );
    // Exclude curated rows already selected by the core/specialized pools from
    // the public pool BEFORE its publicSearchMaxResults slice, so curated
    // duplicates don't consume (and waste) public-only slots.
    const curatedIds = new Set(
      [...coreResults, ...specializedResults].map((dto) => dto.id),
    );
    const publicResults = publicEnabled
      ? rankPublicPool(query, await getAllCatalog(), curatedIds)
      : [];

    const seen = new Set<string>();
    const merged: LibraryItemDto[] = [];
    for (const dto of [...coreResults, ...specializedResults, ...publicResults]) {
      if (seen.has(dto.id)) continue;
      seen.add(dto.id);
      merged.push(dto);
    }
    const results = merged.slice(0, limit);
    const hasPublic = results.some((dto) => dto.sourceMode === "public");
    return {
      ...base,
      mode,
      count: results.length,
      results,
      warning: hasPublic ? PUBLIC_WARNING : undefined,
    };
  };

  return { refresh, getStatus, getById, search };
};
