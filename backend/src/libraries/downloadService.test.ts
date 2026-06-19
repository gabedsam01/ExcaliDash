import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDownloadService } from "./downloadService";
import { createFakePrisma, type FakePrisma } from "./__testfixtures__/fakePrisma";
import { LibraryError } from "./errors";
import { resolveCachePath } from "./validators";
import type { FetchLike, LibraryConfig } from "./types";

const SOURCE = "childishgirl/aws-architecture-icons.excalidrawlib";

const silentLogger = { warn: () => {}, info: () => {}, error: () => {} };

const VALID_LIB = JSON.stringify({
  type: "excalidrawlib",
  version: 2,
  libraryItems: [
    { id: "1", name: "EC2", elements: [] },
    { id: "2", name: "S3", elements: [] },
  ],
});

const bufferFetch = (
  body: string,
  options: { contentLength?: string | null; status?: number } = {},
): FetchLike => {
  const status = options.status ?? 200;
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: "OK",
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-length"
          ? options.contentLength ?? null
          : null,
    },
    text: async () => body,
    arrayBuffer: async () => new TextEncoder().encode(body).buffer as ArrayBuffer,
  }));
};

const makeStreamBody = (chunks: Uint8Array[], onCancel?: () => void) => {
  let index = 0;
  return {
    getReader: () => ({
      read: async () =>
        index < chunks.length
          ? { done: false, value: chunks[index++] }
          : { done: true },
      cancel: async () => {
        onCancel?.();
      },
    }),
  };
};

const streamFetch = (
  chunks: Uint8Array[],
  options: { contentLength?: string | null; onCancel?: () => void } = {},
): FetchLike =>
  vi.fn(async () => ({
    ok: true,
    status: 200,
    statusText: "OK",
    headers: { get: () => options.contentLength ?? null },
    text: async () => "",
    arrayBuffer: async () =>
      Buffer.concat(chunks.map((c) => Buffer.from(c))).buffer as ArrayBuffer,
    body: makeStreamBody(chunks, options.onCancel),
  }));

describe("downloadService", () => {
  let prisma: FakePrisma;
  let cacheDir: string;
  let config: LibraryConfig;
  let libraryId: string;

  beforeEach(async () => {
    prisma = createFakePrisma();
    cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), "excalidash-cache-"));
    config = {
      catalogUrl:
        "https://raw.githubusercontent.com/excalidraw/excalidraw-libraries/main/libraries.json",
      baseUrl:
        "https://raw.githubusercontent.com/excalidraw/excalidraw-libraries/main/libraries",
      cacheDir,
      refreshIntervalHours: 24,
      downloadTimeoutMs: 1000,
      downloadMaxBytes: 25 * 1024 * 1024,
      publicSearchEnabled: true,
      publicSearchMaxResults: 25,
      autoRefreshOnStart: false,
    };
    [{ id: libraryId }] = prisma.__seedCatalog([
      { name: "AWS Architecture Icons", source: SOURCE },
    ]);
  });

  afterEach(async () => {
    await fs.rm(cacheDir, { recursive: true, force: true });
  });

  it("downloads, validates, hashes, and caches the library", async () => {
    const service = createDownloadService({
      prisma,
      config,
      fetchImpl: bufferFetch(VALID_LIB),
      logger: silentLogger,
    });
    const result = await service.cacheLibrary(libraryId);

    expect(result.itemCount).toBe(2);
    expect(result.itemNames).toEqual(["EC2", "S3"]);
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.sizeBytes).toBe(Buffer.byteLength(VALID_LIB, "utf8"));

    // File written inside the cache dir.
    const expectedPath = resolveCachePath(cacheDir, SOURCE);
    const onDisk = await fs.readFile(expectedPath, "utf8");
    expect(onDisk).toBe(VALID_LIB);

    // DB updated.
    const row = prisma.__catalog().find((c) => c.id === libraryId)!;
    expect(row.cachePath).toBe(expectedPath);
    expect(row.sha256).toBe(result.sha256);
    expect(row.sizeBytes).toBe(result.sizeBytes);
  });

  it("rejects a library that exceeds the max size (content-length)", async () => {
    const service = createDownloadService({
      prisma,
      config: { ...config, downloadMaxBytes: 10 },
      fetchImpl: bufferFetch(VALID_LIB, { contentLength: "1000000" }),
      logger: silentLogger,
    });
    await expect(service.cacheLibrary(libraryId)).rejects.toMatchObject({
      status: 413,
    });
  });

  it("rejects a library that exceeds the max size (actual bytes)", async () => {
    const big = "x".repeat(50);
    const service = createDownloadService({
      prisma,
      config: { ...config, downloadMaxBytes: 10 },
      fetchImpl: bufferFetch(big, { contentLength: null }),
      logger: silentLogger,
    });
    await expect(service.cacheLibrary(libraryId)).rejects.toBeInstanceOf(
      LibraryError,
    );
  });

  it("rejects content that is not a valid .excalidrawlib", async () => {
    const service = createDownloadService({
      prisma,
      config,
      fetchImpl: bufferFetch(JSON.stringify({ foo: "bar" })),
      logger: silentLogger,
    });
    await expect(service.cacheLibrary(libraryId)).rejects.toMatchObject({
      status: 422,
    });
  });

  it("refuses to follow an upstream redirect (allowlist cannot be escaped)", async () => {
    const service = createDownloadService({
      prisma,
      config,
      fetchImpl: bufferFetch(VALID_LIB, { status: 302 }),
      logger: silentLogger,
    });
    await expect(service.cacheLibrary(libraryId)).rejects.toMatchObject({
      status: 502,
      code: "UPSTREAM_REDIRECT",
    });
  });

  it("streams and caches when the response exposes a body reader", async () => {
    const encoded = new TextEncoder().encode(VALID_LIB);
    const mid = Math.floor(encoded.length / 2);
    const chunks = [encoded.slice(0, mid), encoded.slice(mid)];
    const service = createDownloadService({
      prisma,
      config,
      fetchImpl: streamFetch(chunks),
      logger: silentLogger,
    });
    const result = await service.cacheLibrary(libraryId);
    expect(result.itemCount).toBe(2);
    expect(result.sizeBytes).toBe(encoded.length);
  });

  it("aborts an oversized streamed download mid-flight (bounded memory)", async () => {
    let cancelled = false;
    const chunks = Array.from({ length: 4 }, () => new Uint8Array(10)); // 40 bytes
    const service = createDownloadService({
      prisma,
      config: { ...config, downloadMaxBytes: 25 },
      fetchImpl: streamFetch(chunks, { onCancel: () => (cancelled = true) }),
      logger: silentLogger,
    });
    await expect(service.cacheLibrary(libraryId)).rejects.toMatchObject({
      status: 413,
    });
    expect(cancelled).toBe(true);
  });

  it("404s for an unknown library id", async () => {
    const service = createDownloadService({
      prisma,
      config,
      fetchImpl: bufferFetch(VALID_LIB),
      logger: silentLogger,
    });
    await expect(service.cacheLibrary("nope")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("getItems caches on first read then reads from the cached file", async () => {
    const fetchImpl = bufferFetch(VALID_LIB);
    const service = createDownloadService({
      prisma,
      config,
      fetchImpl,
      logger: silentLogger,
    });

    const first = await service.getItems(libraryId);
    expect(first.itemCount).toBe(2);
    expect(first.cached).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    // Second read should hit the cache file, not the network.
    const second = await service.getItems(libraryId);
    expect(second.itemNames).toEqual(["EC2", "S3"]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
