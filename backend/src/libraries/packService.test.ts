import { beforeEach, describe, expect, it } from "vitest";
import { createPackService } from "./packService";
import { createFakePrisma, type FakePrisma } from "./__testfixtures__/fakePrisma";
import { CORE_PACK } from "./seeds/corePack";
import { SPECIALIZED_CATEGORIES } from "./seeds/specializedPack";
import { normalizeName } from "./validators";

const silentLogger = { warn: () => {}, info: () => {} };

/** Every curated name referenced by the seeds. */
const allSeedNames = (): string[] => {
  const names = new Set<string>();
  for (const ref of CORE_PACK.libraries) names.add(ref.name);
  for (const category of SPECIALIZED_CATEGORIES) {
    for (const ref of category.libraries) names.add(ref.name);
  }
  return [...names];
};

/**
 * Seed a catalog that contains every referenced name EXCEPT the two that are
 * absent from the real official catalog: "Google Architecture Icons" (resolved
 * via alias to "GCP Icons") and "Docker" (truly missing).
 */
const seedRealisticCatalog = (prisma: FakePrisma) => {
  const names = allSeedNames().filter(
    (name) => name !== "Google Architecture Icons" && name !== "Docker",
  );
  names.push("GCP Icons"); // the alias target for "Google Architecture Icons"
  prisma.__seedCatalog(
    names.map((name) => ({
      name,
      source: `seed/${normalizeName(name).replace(/ /g, "-")}.excalidrawlib`,
    })),
  );
};

describe("packService.seedPacks", () => {
  let prisma: FakePrisma;
  beforeEach(() => {
    prisma = createFakePrisma();
  });

  it("creates the core pack, specialized root, and 9 categories", async () => {
    const service = createPackService({ prisma, logger: silentLogger });
    const count = await service.seedPacks();
    expect(count).toBe(2 + SPECIALIZED_CATEGORIES.length);
    const packs = prisma.__packs();
    expect(packs.find((p) => p.slug === "core_pack")?.kind).toBe("CORE");
    expect(packs.find((p) => p.slug === "specialized_pack")?.kind).toBe(
      "SPECIALIZED",
    );
    expect(packs.filter((p) => p.parentSlug === "specialized_pack")).toHaveLength(
      SPECIALIZED_CATEGORIES.length,
    );
  });

  it("is idempotent (no duplicate packs on re-run)", async () => {
    const service = createPackService({ prisma, logger: silentLogger });
    await service.seedPacks();
    await service.seedPacks();
    expect(prisma.__packs()).toHaveLength(2 + SPECIALIZED_CATEGORIES.length);
  });
});

describe("packService.reseedMembership", () => {
  let prisma: FakePrisma;
  beforeEach(() => {
    prisma = createFakePrisma();
    seedRealisticCatalog(prisma);
  });

  it("reports only Docker as missing and resolves Google via alias", async () => {
    const service = createPackService({ prisma, logger: silentLogger });
    await service.seedPacks();
    const diagnostics = await service.reseedMembership();

    const missingNames = diagnostics.missing.map((m) => m.name);
    expect(missingNames).toContain("Docker");
    expect(new Set(missingNames)).toEqual(new Set(["Docker"]));

    // "Google Architecture Icons" resolved to the GCP Icons catalog row.
    const gcp = prisma.__catalog().find((c) => c.name === "GCP Icons");
    expect(gcp?.isCurated).toBe(true);
    const corePack = prisma.__packs().find((p) => p.slug === "core_pack")!;
    const coreItems = prisma
      .__packItems()
      .filter((pi) => pi.packId === corePack.id);
    const googleMembership = coreItems.find(
      (pi) => pi.notes === "Google Architecture Icons",
    );
    expect(googleMembership?.libraryId).toBe(gcp?.id);
  });

  it("is idempotent (membership counts stable across reseeds)", async () => {
    const service = createPackService({ prisma, logger: silentLogger });
    await service.seedPacks();
    await service.reseedMembership();
    const firstCount = prisma.__packItems().length;
    const firstCurated = prisma.__catalog().filter((c) => c.isCurated).length;

    await service.reseedMembership();
    expect(prisma.__packItems().length).toBe(firstCount);
    expect(prisma.__catalog().filter((c) => c.isCurated).length).toBe(
      firstCurated,
    );
  });

  it("does not crash and reports a reason when the catalog is empty", async () => {
    const emptyPrisma = createFakePrisma();
    const service = createPackService({
      prisma: emptyPrisma,
      logger: silentLogger,
    });
    await service.seedPacks();
    const diagnostics = await service.reseedMembership();
    expect(diagnostics.membershipResolved).toBe(0);
    expect(diagnostics.skippedReason).toBeTruthy();
    // No memberships were created or wiped.
    expect(emptyPrisma.__packItems()).toHaveLength(0);
  });

  it("marks curated items and exposes membership", async () => {
    const service = createPackService({ prisma, logger: silentLogger });
    await service.seedPacks();
    await service.reseedMembership();

    const awsRow = prisma
      .__catalog()
      .find((c) => c.name === "AWS Architecture Icons")!;
    const membership = await service.getLibraryMembership(awsRow.id);
    expect(membership.inCore).toBe(true);
    // AWS appears in cloud_devops and security categories.
    expect(membership.categories).toEqual(
      expect.arrayContaining(["cloud_devops", "security"]),
    );
  });

  it("keeps isCurated authoritative (curated iff a pack member)", async () => {
    const service = createPackService({ prisma, logger: silentLogger });
    await service.seedPacks();
    await service.reseedMembership();

    const memberIds = new Set(prisma.__packItems().map((pi) => pi.libraryId));
    for (const item of prisma.__catalog()) {
      expect(item.isCurated).toBe(memberIds.has(item.id));
    }
    // "R Icons" is not seeded into any pack here, so it must not be curated.
    prisma.__seedCatalog([
      { name: "R Icons", source: "jumpingrivers/r.excalidrawlib" },
    ]);
    await service.reseedMembership();
    const rIcons = prisma.__catalog().find((c) => c.name === "R Icons");
    expect(rIcons?.isCurated).toBe(false);
  });
});

describe("packService.listPacks / getPack", () => {
  let prisma: FakePrisma;
  beforeEach(async () => {
    prisma = createFakePrisma();
    seedRealisticCatalog(prisma);
    const service = createPackService({ prisma, logger: silentLogger });
    await service.seedPacks();
    await service.reseedMembership();
  });

  it("summarizes packs with item counts", async () => {
    const service = createPackService({ prisma, logger: silentLogger });
    const overview = await service.listPacks();
    expect(overview.core?.slug).toBe("core_pack");
    expect(overview.core?.itemCount).toBeGreaterThan(0);
    expect(overview.specialized?.categories).toHaveLength(
      SPECIALIZED_CATEGORIES.length,
    );
    for (const category of overview.specialized?.categories ?? []) {
      expect(category.itemCount).toBeGreaterThan(0);
    }
  });

  it("returns pack detail with library DTOs", async () => {
    const service = createPackService({ prisma, logger: silentLogger });
    const pack = await service.getPack("cloud_devops");
    expect(pack).not.toBeNull();
    expect(pack?.libraries.length).toBeGreaterThan(0);
    for (const dto of pack?.libraries ?? []) {
      expect(dto.sourceMode).toBe("specialized");
      expect(dto.curated).toBe(true);
    }
    expect(await service.getPack("does-not-exist")).toBeNull();
  });
});
