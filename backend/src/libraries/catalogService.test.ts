import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCatalogService } from "./catalogService";
import { createPackService } from "./packService";
import { createFakePrisma, type FakePrisma } from "./__testfixtures__/fakePrisma";
import { normalizeName } from "./validators";
import type { FetchLike, LibraryConfig } from "./types";

const silentLogger = { warn: () => {}, info: () => {}, error: () => {} };

const baseConfig = (over: Partial<LibraryConfig> = {}): LibraryConfig => ({
  catalogUrl:
    "https://raw.githubusercontent.com/excalidraw/excalidraw-libraries/main/libraries.json",
  baseUrl:
    "https://raw.githubusercontent.com/excalidraw/excalidraw-libraries/main/libraries",
  cacheDir: "/tmp/excalidash-libs-test",
  refreshIntervalHours: 24,
  downloadTimeoutMs: 1000,
  downloadMaxBytes: 25 * 1024 * 1024,
  publicSearchEnabled: true,
  publicSearchMaxResults: 25,
  autoRefreshOnStart: false,
  ...over,
});

const jsonFetch = (body: string): FetchLike =>
  vi.fn(async () => ({
    ok: true,
    status: 200,
    statusText: "OK",
    headers: { get: () => null },
    text: async () => body,
    arrayBuffer: async () => new TextEncoder().encode(body).buffer,
  }));

const buildServices = (prisma: FakePrisma, config: LibraryConfig, fetchImpl?: FetchLike) => {
  const packService = createPackService({ prisma, logger: silentLogger });
  const catalogService = createCatalogService({
    prisma,
    config,
    packService,
    fetchImpl,
    logger: silentLogger,
  });
  return { packService, catalogService };
};

const seedSearchCatalog = (prisma: FakePrisma) => {
  const names = [
    "AWS Architecture Icons",
    "Web Kit",
    "Cloud",
    "Kubernetes icons",
    "R Icons", // public-only (in no pack)
  ];
  prisma.__seedCatalog(
    names.map((name) => ({
      name,
      source: `seed/${normalizeName(name).replace(/ /g, "-")}.excalidrawlib`,
      description: `${name} description`,
    })),
  );
};

describe("catalogService.refresh", () => {
  let prisma: FakePrisma;
  beforeEach(() => {
    prisma = createFakePrisma();
  });

  const CATALOG = JSON.stringify([
    {
      name: "AWS Architecture Icons",
      id: "aws1",
      description: "AWS",
      source: "childishgirl/aws-architecture-icons.excalidrawlib",
      preview: "childishgirl/aws.png",
      created: "2021-01-01",
      updated: "2022-01-01",
      version: 2,
      itemNames: ["EC2", "S3"],
      authors: [{ name: "x" }],
    },
    {
      name: "Web Kit",
      source: "excacomp/web-kit.excalidrawlib",
      preview: "excacomp/web-kit.png",
      version: 1,
    },
    // Unsafe source -> skipped, not fatal.
    { name: "Evil", source: "../../etc/passwd.excalidrawlib" },
  ]);

  it("upserts valid entries and skips unsafe ones", async () => {
    const { catalogService } = buildServices(prisma, baseConfig(), jsonFetch(CATALOG));
    const result = await catalogService.refresh();
    expect(result.fetched).toBe(3);
    expect(result.upserted).toBe(2);
    expect(result.skipped).toBe(1);
    expect(prisma.__catalog()).toHaveLength(2);
    const aws = prisma.__catalog().find((c) => c.name === "AWS Architecture Icons");
    expect(aws?.slug).toBe("childishgirl-aws-architecture-icons");
    expect(aws?.officialId).toBe("aws1");
  });

  it("is idempotent (re-refresh updates in place, no duplicates)", async () => {
    const { catalogService } = buildServices(prisma, baseConfig(), jsonFetch(CATALOG));
    await catalogService.refresh();
    await catalogService.refresh();
    expect(prisma.__catalog()).toHaveLength(2);
  });

  it("reports status with catalog + curated counts", async () => {
    const { catalogService } = buildServices(prisma, baseConfig(), jsonFetch(CATALOG));
    await catalogService.refresh();
    const status = await catalogService.getStatus();
    expect(status.catalogCount).toBe(2);
    expect(status.publicSearchEnabled).toBe(true);
    expect(status.lastRefreshedAt).toBeTruthy();
  });
});

describe("catalogService.search", () => {
  let prisma: FakePrisma;
  beforeEach(async () => {
    prisma = createFakePrisma();
    seedSearchCatalog(prisma);
    const { packService } = buildServices(prisma, baseConfig());
    await packService.seedPacks();
    await packService.reseedMembership();
  });

  it("mode=core searches only the core pack and flags curated", async () => {
    const { catalogService } = buildServices(prisma, baseConfig());
    const res = await catalogService.search({ query: "aws", mode: "core" });
    expect(res.results.length).toBeGreaterThan(0);
    expect(res.results.every((r) => r.sourceMode === "core")).toBe(true);
    expect(res.results.every((r) => r.curated)).toBe(true);
    // "R Icons" is public-only and must not appear in core.
    expect(res.results.some((r) => r.name === "R Icons")).toBe(false);
  });

  it("mode=public searches the full catalog without curated boost", async () => {
    const { catalogService } = buildServices(prisma, baseConfig());
    const res = await catalogService.search({ query: "icons", mode: "public" });
    expect(res.results.some((r) => r.name === "R Icons")).toBe(true);
    expect(res.results.every((r) => r.sourceMode === "public")).toBe(true);
    // The public-only "R Icons" is flagged uncurated; the response carries the
    // not-curated warning. (A library that is also in a curated pack still
    // reports curated:true — the warning, not the per-item flag, signals "public".)
    expect(res.results.find((r) => r.name === "R Icons")?.curated).toBe(false);
    expect(res.warning).toBeTruthy();
  });

  it("mode=public returns nothing when public search is disabled", async () => {
    const { catalogService } = buildServices(
      prisma,
      baseConfig({ publicSearchEnabled: false }),
    );
    const res = await catalogService.search({ query: "icons", mode: "public" });
    expect(res.results).toHaveLength(0);
    expect(res.publicSearchEnabled).toBe(false);
    expect(res.warning).toMatch(/disabled/i);
  });

  it("mode=all ranks core/specialized above public and dedupes", async () => {
    const { catalogService } = buildServices(prisma, baseConfig());
    const res = await catalogService.search({ query: "aws", mode: "all" });
    const aws = res.results.filter((r) => r.name === "AWS Architecture Icons");
    // Appears once, attributed to its highest-precedence pool (core).
    expect(aws).toHaveLength(1);
    expect(aws[0].sourceMode).toBe("core");
  });

  it("mode=all keeps public-only slots even when curated rows rank high", async () => {
    // publicSearchMaxResults=1 and query "icons" matches curated AWS/Kubernetes
    // AND public-only "R Icons". Curated rows must not consume the single public
    // slot (they are deduped out before the slice), so "R Icons" still surfaces.
    const { catalogService } = buildServices(
      prisma,
      baseConfig({ publicSearchMaxResults: 1 }),
    );
    const res = await catalogService.search({ query: "icons", mode: "all" });
    const rIcons = res.results.find((r) => r.name === "R Icons");
    expect(rIcons).toBeTruthy();
    expect(rIcons?.sourceMode).toBe("public");
  });

  it("mode=specialized resolves a category alias", async () => {
    const { catalogService } = buildServices(prisma, baseConfig());
    const res = await catalogService.search({
      query: "",
      mode: "specialized",
      category: "cloud",
    });
    expect(res.category).toBe("cloud_devops");
    expect(res.results.every((r) => r.sourceMode === "specialized")).toBe(true);
    expect(res.results.some((r) => r.name === "AWS Architecture Icons")).toBe(true);
  });
});
