/**
 * downloadService: caches a library's `.excalidrawlib` file from the official
 * allowlisted source, with size limits, JSON validation, sha256, and a
 * cache-dir-constrained write. Also exposes a bounded item listing.
 */
import { promises as fs } from "fs";
import crypto from "crypto";
import { fetchAllowedBinary } from "./http";
import { LibraryError } from "./errors";
import {
  isValidSourcePath,
  joinLibraryUrl,
  parseExcalidrawLibrary,
  resolveCachePath,
} from "./validators";
import type {
  CatalogItemRecord,
  FetchLike,
  LibraryConfig,
  LibraryPrisma,
} from "./types";

export interface CacheResult {
  id: string;
  source: string;
  itemCount: number;
  sha256: string;
  sizeBytes: number;
  cachedAt: string;
  itemNames: string[];
}

export interface ItemsResult {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
  itemNames: string[];
  cached: boolean;
  cachedAt: string | null;
  sha256: string | null;
  sizeBytes: number | null;
}

export interface DownloadService {
  cacheLibrary(id: string): Promise<CacheResult>;
  getItems(id: string): Promise<ItemsResult>;
}

const MAX_ITEM_NAMES = 1000;

export const createDownloadService = (deps: {
  prisma: LibraryPrisma;
  config: LibraryConfig;
  fetchImpl?: FetchLike;
  logger?: Pick<Console, "warn" | "info" | "error">;
}): DownloadService => {
  const { prisma, config } = deps;
  const fetchImpl = deps.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
  const logger = deps.logger ?? console;

  const loadItem = async (id: string): Promise<CatalogItemRecord> => {
    const item = (await prisma.excalidrawLibraryCatalogItem.findUnique({
      where: { id },
    })) as CatalogItemRecord | null;
    if (!item) {
      throw new LibraryError(`Library not found: ${id}`, 404, "NOT_FOUND");
    }
    return item;
  };

  const downloadAndCache = async (
    item: CatalogItemRecord,
  ): Promise<CacheResult> => {
    if (!isValidSourcePath(item.source)) {
      throw new LibraryError(
        `Unsafe library source path: ${item.source}`,
        400,
        "INVALID_SOURCE",
      );
    }

    const url = joinLibraryUrl(config.baseUrl, item.source);
    const buffer = await fetchAllowedBinary(fetchImpl, url, {
      timeoutMs: config.downloadTimeoutMs,
      maxBytes: config.downloadMaxBytes,
      requireLibrariesPrefix: true,
    });

    const parsed = parseExcalidrawLibrary(buffer.toString("utf8"));
    if (!parsed.valid) {
      throw new LibraryError(
        `Downloaded file is not a valid .excalidrawlib document: ${item.source}`,
        422,
        "INVALID_LIBRARY",
      );
    }

    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

    const cachePath = resolveCachePath(config.cacheDir, item.source);
    await fs.mkdir(config.cacheDir, { recursive: true });
    await fs.writeFile(cachePath, buffer);

    const cachedAt = new Date();
    const itemNames = parsed.itemNames.slice(0, MAX_ITEM_NAMES);

    await prisma.excalidrawLibraryCatalogItem.update({
      where: { id: item.id },
      data: {
        cachePath,
        sizeBytes: buffer.length,
        sha256,
        cachedAt,
        lastFetchedAt: cachedAt,
        version: item.version ?? parsed.version,
        ...(itemNames.length > 0 ? { itemNames } : {}),
      },
    });

    logger.info(
      `[libraries] cached ${item.source} (${buffer.length} bytes, ${parsed.itemCount} items)`,
    );

    return {
      id: item.id,
      source: item.source,
      itemCount: parsed.itemCount,
      sha256,
      sizeBytes: buffer.length,
      cachedAt: cachedAt.toISOString(),
      itemNames,
    };
  };

  const cacheLibrary = async (id: string): Promise<CacheResult> => {
    const item = await loadItem(id);
    return downloadAndCache(item);
  };

  const readCachedFile = async (
    cachePath: string,
  ): Promise<string | null> => {
    try {
      return await fs.readFile(cachePath, "utf8");
    } catch {
      return null;
    }
  };

  const getItems = async (id: string): Promise<ItemsResult> => {
    const item = await loadItem(id);

    // Prefer the existing cache; otherwise download once.
    let text: string | null = null;
    if (item.cachePath) {
      text = await readCachedFile(item.cachePath);
    }

    if (text === null) {
      const cached = await downloadAndCache(item);
      return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        itemCount: cached.itemCount,
        itemNames: cached.itemNames,
        cached: true,
        cachedAt: cached.cachedAt,
        sha256: cached.sha256,
        sizeBytes: cached.sizeBytes,
      };
    }

    const parsed = parseExcalidrawLibrary(text);
    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      itemCount: parsed.itemCount,
      itemNames: parsed.itemNames.slice(0, MAX_ITEM_NAMES),
      cached: true,
      cachedAt: item.cachedAt ? new Date(item.cachedAt).toISOString() : null,
      sha256: item.sha256 ?? null,
      sizeBytes: typeof item.sizeBytes === "number" ? item.sizeBytes : null,
    };
  };

  return { cacheLibrary, getItems };
};
