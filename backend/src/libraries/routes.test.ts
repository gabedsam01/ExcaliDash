import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { asyncHandler } from "../middleware/errorHandler";
import { registerLibraryRoutes } from "./routes";
import { LibraryError } from "./errors";
import type { LibraryServices } from "./index";

const buildServices = () => ({
  catalogService: {
    refresh: vi.fn(),
    getStatus: vi.fn(),
    getById: vi.fn(),
    search: vi.fn(),
  },
  packService: {
    seedPacks: vi.fn(),
    reseedMembership: vi.fn(),
    listPacks: vi.fn(),
    getPack: vi.fn(),
    getPackLibraries: vi.fn(),
    getSpecializedLibraries: vi.fn(),
    getLibraryMembership: vi.fn(),
  },
  downloadService: {
    cacheLibrary: vi.fn(),
    getItems: vi.fn(),
  },
});

const buildApp = (options: { authed?: boolean } = {}) => {
  const services = buildServices();
  const app = express();
  app.use(express.json());

  const requireAuth = ((
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (options.authed === false) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "Auth required" });
    }
    req.user = { id: "user-1", email: "u@e.com", name: "u", role: "USER" };
    next();
  }) as express.RequestHandler;

  registerLibraryRoutes(app, {
    requireAuth,
    asyncHandler,
    services: services as unknown as LibraryServices,
  });

  return { app, services };
};

describe("library routes", () => {
  it("requires authentication", async () => {
    const { app } = buildApp({ authed: false });
    const res = await request(app).get("/libraries/status");
    expect(res.status).toBe(401);
  });

  it("GET /libraries/status returns status", async () => {
    const { app, services } = buildApp();
    services.catalogService.getStatus.mockResolvedValue({
      catalogCount: 3,
      curatedCount: 2,
      lastRefreshedAt: null,
      cacheDir: "/app/data/libraries",
      publicSearchEnabled: true,
      refreshIntervalHours: 24,
      autoRefreshOnStart: true,
    });
    const res = await request(app).get("/libraries/status");
    expect(res.status).toBe(200);
    expect(res.body.catalogCount).toBe(3);
  });

  it("GET /libraries/packs hits listPacks, not the :id route", async () => {
    const { app, services } = buildApp();
    services.packService.listPacks.mockResolvedValue({ core: null, specialized: null });
    const res = await request(app).get("/libraries/packs");
    expect(res.status).toBe(200);
    expect(services.packService.listPacks).toHaveBeenCalledTimes(1);
    expect(services.catalogService.getById).not.toHaveBeenCalled();
  });

  it("GET /libraries/packs/:slug returns 404 when missing", async () => {
    const { app, services } = buildApp();
    services.packService.getPack.mockResolvedValue(null);
    const res = await request(app).get("/libraries/packs/nope");
    expect(res.status).toBe(404);
  });

  it("GET /libraries/search validates mode and forwards params", async () => {
    const { app, services } = buildApp();
    services.catalogService.search.mockResolvedValue({
      mode: "core",
      query: "aws",
      category: null,
      publicSearchEnabled: true,
      count: 0,
      results: [],
    });
    const ok = await request(app).get("/libraries/search?q=aws&mode=core&limit=5");
    expect(ok.status).toBe(200);
    expect(services.catalogService.search).toHaveBeenCalledWith({
      query: "aws",
      mode: "core",
      category: undefined,
      limit: 5,
    });

    const bad = await request(app).get("/libraries/search?mode=bogus");
    expect(bad.status).toBe(400);
  });

  it("GET /libraries/:id returns 404 then 200", async () => {
    const { app, services } = buildApp();
    services.catalogService.getById.mockResolvedValueOnce(null);
    const missing = await request(app).get("/libraries/abc");
    expect(missing.status).toBe(404);

    services.catalogService.getById.mockResolvedValueOnce({
      id: "abc",
      name: "AWS",
      slug: "x-aws",
      sourceMode: "core",
      curated: true,
      source: "x/aws.excalidrawlib",
      cached: false,
    });
    const found = await request(app).get("/libraries/abc");
    expect(found.status).toBe(200);
    expect(found.body.name).toBe("AWS");
  });

  it("POST /libraries/:id/cache maps LibraryError to its status", async () => {
    const { app, services } = buildApp();
    services.downloadService.cacheLibrary.mockRejectedValue(
      new LibraryError("too big", 413, "LIBRARY_TOO_LARGE"),
    );
    const res = await request(app).post("/libraries/abc/cache");
    expect(res.status).toBe(413);
    expect(res.body.code).toBe("LIBRARY_TOO_LARGE");
  });

  it("POST /libraries/:id/cache returns the cache result", async () => {
    const { app, services } = buildApp();
    services.downloadService.cacheLibrary.mockResolvedValue({
      id: "abc",
      source: "x/aws.excalidrawlib",
      itemCount: 2,
      sha256: "a".repeat(64),
      sizeBytes: 100,
      cachedAt: new Date().toISOString(),
      itemNames: ["EC2", "S3"],
    });
    const res = await request(app).post("/libraries/abc/cache");
    expect(res.status).toBe(200);
    expect(res.body.itemCount).toBe(2);
  });

  it("GET /libraries/:id/items returns the bounded summary", async () => {
    const { app, services } = buildApp();
    services.downloadService.getItems.mockResolvedValue({
      id: "abc",
      name: "AWS",
      slug: "x-aws",
      itemCount: 2,
      itemNames: ["EC2", "S3"],
      cached: true,
      cachedAt: null,
      sha256: null,
      sizeBytes: null,
    });
    const res = await request(app).get("/libraries/abc/items");
    expect(res.status).toBe(200);
    expect(res.body.itemNames).toEqual(["EC2", "S3"]);
  });

  it("POST /libraries/refresh reseeds and returns status", async () => {
    const { app, services } = buildApp();
    services.packService.seedPacks.mockResolvedValue(11);
    services.catalogService.refresh.mockResolvedValue({
      fetched: 5,
      upserted: 5,
      skipped: 0,
      errors: [],
      lastRefreshedAt: new Date().toISOString(),
    });
    services.packService.reseedMembership.mockResolvedValue({
      packsEnsured: 10,
      membershipResolved: 20,
      missing: [],
    });
    services.catalogService.getStatus.mockResolvedValue({
      catalogCount: 5,
      curatedCount: 5,
      lastRefreshedAt: null,
      cacheDir: "/app/data/libraries",
      publicSearchEnabled: true,
      refreshIntervalHours: 24,
      autoRefreshOnStart: true,
    });
    const res = await request(app).post("/libraries/refresh");
    expect(res.status).toBe(200);
    expect(res.body.status.catalogCount).toBe(5);
    expect(services.packService.seedPacks).toHaveBeenCalled();
    expect(services.packService.reseedMembership).toHaveBeenCalled();
  });
});
