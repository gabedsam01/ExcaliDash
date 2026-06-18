/**
 * packService: seeds the curated packs, resolves curated names against the
 * catalog (with aliases + fuzzy matching), and exposes pack/membership reads
 * used by search and the API.
 *
 * Seeding is idempotent and never crashes startup: a name missing from the
 * official catalog is reported as a diagnostic, not thrown.
 */
import { aliasesToArray, toLibraryDto } from "./mapper";
import { normalizeName } from "./validators";
import {
  CORE_PACK,
  CORE_PACK_SLUG,
} from "./seeds/corePack";
import {
  SPECIALIZED_CATEGORIES,
  SPECIALIZED_CATEGORY_SLUGS,
  SPECIALIZED_PACK,
  SPECIALIZED_PACK_SLUG,
} from "./seeds/specializedPack";
import type {
  CatalogItemRecord,
  LibraryItemDto,
  LibraryPrisma,
  PackLibrary,
  PackSeedDiagnostics,
  SeedLibraryRef,
  SeedPackDefinition,
} from "./types";

interface PackRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  kind: string;
  category: string | null;
  parentSlug: string | null;
  enabled: boolean;
  priority: number;
}

interface ResolverItem {
  id: string;
  name: string;
  slug: string;
  source: string;
}

export interface PackSummary {
  slug: string;
  name: string;
  description: string | null;
  enabled: boolean;
  priority: number;
  itemCount: number;
}

export interface SpecializedCategorySummary extends PackSummary {
  category: string | null;
}

export interface PacksOverview {
  core: PackSummary | null;
  specialized:
    | (PackSummary & {
        categoryCount: number;
        categories: SpecializedCategorySummary[];
      })
    | null;
}

export interface PackDetail extends PackSummary {
  kind: string;
  category: string | null;
  libraries: LibraryItemDto[];
}

export interface PackService {
  seedPacks(): Promise<number>;
  reseedMembership(): Promise<PackSeedDiagnostics>;
  listPacks(): Promise<PacksOverview>;
  getPack(slug: string): Promise<PackDetail | null>;
  getPackLibraries(slug: string): Promise<PackLibrary[]>;
  getSpecializedLibraries(
    categorySlug: string | null,
  ): Promise<PackLibrary[]>;
  getLibraryMembership(
    libraryId: string,
  ): Promise<{ inCore: boolean; categories: string[] }>;
}

const SEEDABLE_PACKS: SeedPackDefinition[] = [
  CORE_PACK,
  SPECIALIZED_PACK,
  ...SPECIALIZED_CATEGORIES,
];

// Packs that hold membership (root specialized pack holds none).
const MEMBERSHIP_PACKS: SeedPackDefinition[] = [
  CORE_PACK,
  ...SPECIALIZED_CATEGORIES,
];

export const createPackService = (deps: {
  prisma: LibraryPrisma;
  logger?: Pick<Console, "warn" | "info">;
}): PackService => {
  const { prisma } = deps;
  const logger = deps.logger ?? console;

  const sourceModeForPack = (pack: PackRecord): "core" | "specialized" =>
    pack.kind === "CORE" ? "core" : "specialized";

  const resolveRef = (
    ref: SeedLibraryRef,
    byNormalizedName: Map<string, ResolverItem>,
    items: ResolverItem[],
  ): ResolverItem | null => {
    const exact = byNormalizedName.get(normalizeName(ref.name));
    if (exact) return exact;

    for (const alias of ref.aliases ?? []) {
      const match = byNormalizedName.get(normalizeName(alias));
      if (match) return match;
    }

    // Conservative fuzzy fallback on the primary name only.
    const query = normalizeName(ref.name);
    if (query.length === 0) return null;
    const startsWith = items.find((item) =>
      normalizeName(item.name).startsWith(query),
    );
    if (startsWith) return startsWith;
    const includes = items.find((item) =>
      normalizeName(item.name).includes(query),
    );
    return includes ?? null;
  };

  const seedPacks = async (): Promise<number> => {
    for (const def of SEEDABLE_PACKS) {
      await prisma.excalidrawLibraryPack.upsert({
        where: { slug: def.slug },
        create: {
          slug: def.slug,
          name: def.name,
          description: def.description ?? null,
          kind: def.kind,
          category: def.category ?? null,
          parentSlug: def.parentSlug ?? null,
          isSystem: true,
          enabled: true,
          priority: def.priority ?? 0,
        },
        update: {
          name: def.name,
          description: def.description ?? null,
          kind: def.kind,
          category: def.category ?? null,
          parentSlug: def.parentSlug ?? null,
          priority: def.priority ?? 0,
        },
      });
    }
    return SEEDABLE_PACKS.length;
  };

  const reseedMembership = async (): Promise<PackSeedDiagnostics> => {
    const items = (await prisma.excalidrawLibraryCatalogItem.findMany({
      select: { id: true, name: true, slug: true, source: true },
    })) as ResolverItem[];

    if (items.length === 0) {
      return {
        packsEnsured: MEMBERSHIP_PACKS.length,
        membershipResolved: 0,
        missing: [],
        skippedReason:
          "Catalog is empty (no successful refresh yet); skipped membership.",
      };
    }

    const byNormalizedName = new Map<string, ResolverItem>();
    for (const item of items) {
      const key = normalizeName(item.name);
      if (!byNormalizedName.has(key)) byNormalizedName.set(key, item);
    }

    const missing: PackSeedDiagnostics["missing"] = [];
    let membershipResolved = 0;
    const allResolvedIds = new Set<string>();

    for (const def of MEMBERSHIP_PACKS) {
      const dbPack = (await prisma.excalidrawLibraryPack.findUnique({
        where: { slug: def.slug },
      })) as PackRecord | null;
      if (!dbPack) continue;

      const resolvedIds = new Set<string>();

      for (const ref of def.libraries) {
        const item = resolveRef(ref, byNormalizedName, items);
        if (!item) {
          missing.push({ pack: def.slug, name: ref.name });
          logger.warn(
            `[libraries] seed: "${ref.name}" not found in catalog for pack "${def.slug}" (skipped)`,
          );
          continue;
        }
        resolvedIds.add(item.id);
        allResolvedIds.add(item.id);
        membershipResolved += 1;

        await prisma.excalidrawLibraryPackItem.upsert({
          where: { packId_libraryId: { packId: dbPack.id, libraryId: item.id } },
          create: {
            packId: dbPack.id,
            libraryId: item.id,
            priority: ref.priority ?? 0,
            aliases: ref.aliases ?? [],
            notes: ref.name,
          },
          update: {
            priority: ref.priority ?? 0,
            aliases: ref.aliases ?? [],
            notes: ref.name,
          },
        });
        await prisma.excalidrawLibraryCatalogItem.update({
          where: { id: item.id },
          data: { isCurated: true },
        });
      }

      // Prune memberships no longer in the seed (keeps reseeds deterministic).
      // Guard against an empty set, which would otherwise match-all and wipe.
      if (resolvedIds.size > 0) {
        await prisma.excalidrawLibraryPackItem.deleteMany({
          where: {
            packId: dbPack.id,
            libraryId: { notIn: Array.from(resolvedIds) },
          },
        });
      }
    }

    // Keep `isCurated` authoritative: a catalog item is curated iff it is a
    // member of at least one curated pack. Reset stale flags for items dropped
    // from the seed (guarded against the empty set, which would match-all).
    if (allResolvedIds.size > 0) {
      await prisma.excalidrawLibraryCatalogItem.updateMany({
        where: { isCurated: true, id: { notIn: Array.from(allResolvedIds) } },
        data: { isCurated: false },
      });
    }

    return {
      packsEnsured: MEMBERSHIP_PACKS.length,
      membershipResolved,
      missing,
    };
  };

  const countItems = async (packId: string): Promise<number> =>
    prisma.excalidrawLibraryPackItem.count({ where: { packId } });

  const listPacks = async (): Promise<PacksOverview> => {
    const corePack = (await prisma.excalidrawLibraryPack.findUnique({
      where: { slug: CORE_PACK_SLUG },
    })) as PackRecord | null;
    const core: PackSummary | null = corePack
      ? {
          slug: corePack.slug,
          name: corePack.name,
          description: corePack.description,
          enabled: corePack.enabled,
          priority: corePack.priority,
          itemCount: await countItems(corePack.id),
        }
      : null;

    const rootPack = (await prisma.excalidrawLibraryPack.findUnique({
      where: { slug: SPECIALIZED_PACK_SLUG },
    })) as PackRecord | null;

    const categoryPacks = (await prisma.excalidrawLibraryPack.findMany({
      where: { parentSlug: SPECIALIZED_PACK_SLUG },
    })) as PackRecord[];

    // Order by the canonical category order for a stable UI.
    const orderedCategoryPacks = [...categoryPacks].sort(
      (a, b) =>
        SPECIALIZED_CATEGORY_SLUGS.indexOf(a.category ?? a.slug) -
        SPECIALIZED_CATEGORY_SLUGS.indexOf(b.category ?? b.slug),
    );

    const categories: SpecializedCategorySummary[] = [];
    let specializedItemTotal = 0;
    for (const pack of orderedCategoryPacks) {
      const itemCount = await countItems(pack.id);
      specializedItemTotal += itemCount;
      categories.push({
        slug: pack.slug,
        name: pack.name,
        description: pack.description,
        enabled: pack.enabled,
        priority: pack.priority,
        category: pack.category,
        itemCount,
      });
    }

    const specialized = rootPack
      ? {
          slug: rootPack.slug,
          name: rootPack.name,
          description: rootPack.description,
          enabled: rootPack.enabled,
          priority: rootPack.priority,
          itemCount: specializedItemTotal,
          categoryCount: categories.length,
          categories,
        }
      : null;

    return { core, specialized };
  };

  const loadPackLibraries = async (
    pack: PackRecord,
  ): Promise<PackLibrary[]> => {
    const rows = (await prisma.excalidrawLibraryPackItem.findMany({
      where: { packId: pack.id },
      include: { library: true },
    })) as Array<{
      priority: number;
      aliases: unknown;
      library: CatalogItemRecord;
    }>;
    return rows
      .filter((row) => row.library)
      .map((row) => ({
        item: row.library,
        aliases: aliasesToArray(row.aliases),
        priority: row.priority ?? 0,
        category: pack.category,
      }));
  };

  const getPackBySlug = async (slug: string): Promise<PackRecord | null> =>
    (await prisma.excalidrawLibraryPack.findUnique({
      where: { slug },
    })) as PackRecord | null;

  const getPackLibraries = async (slug: string): Promise<PackLibrary[]> => {
    const pack = await getPackBySlug(slug);
    if (!pack) return [];
    return loadPackLibraries(pack);
  };

  const getSpecializedLibraries = async (
    categorySlug: string | null,
  ): Promise<PackLibrary[]> => {
    const packs = categorySlug
      ? (
          [await getPackBySlug(categorySlug)].filter(Boolean) as PackRecord[]
        ).filter((pack) => pack.parentSlug === SPECIALIZED_PACK_SLUG)
      : ((await prisma.excalidrawLibraryPack.findMany({
          where: { parentSlug: SPECIALIZED_PACK_SLUG },
        })) as PackRecord[]);

    const ordered = [...packs].sort(
      (a, b) =>
        SPECIALIZED_CATEGORY_SLUGS.indexOf(a.category ?? a.slug) -
        SPECIALIZED_CATEGORY_SLUGS.indexOf(b.category ?? b.slug),
    );

    const seen = new Set<string>();
    const result: PackLibrary[] = [];
    for (const pack of ordered) {
      const libs = await loadPackLibraries(pack);
      for (const lib of libs) {
        if (seen.has(lib.item.id)) continue;
        seen.add(lib.item.id);
        result.push(lib);
      }
    }
    return result;
  };

  const getPack = async (slug: string): Promise<PackDetail | null> => {
    const pack = await getPackBySlug(slug);
    if (!pack) return null;
    const itemCount = await countItems(pack.id);

    // Root specialized pack has no direct members; surface its categories'
    // libraries so the detail view is useful.
    const libraries =
      pack.slug === SPECIALIZED_PACK_SLUG
        ? await getSpecializedLibraries(null)
        : await loadPackLibraries(pack);

    const sourceMode =
      pack.slug === SPECIALIZED_PACK_SLUG
        ? "specialized"
        : sourceModeForPack(pack);

    return {
      slug: pack.slug,
      name: pack.name,
      description: pack.description,
      enabled: pack.enabled,
      priority: pack.priority,
      kind: pack.kind,
      category: pack.category,
      itemCount:
        pack.slug === SPECIALIZED_PACK_SLUG ? libraries.length : itemCount,
      libraries: libraries.map((lib) =>
        toLibraryDto(lib.item, {
          sourceMode,
          category: lib.category,
        }),
      ),
    };
  };

  const getLibraryMembership = async (
    libraryId: string,
  ): Promise<{ inCore: boolean; categories: string[] }> => {
    const rows = (await prisma.excalidrawLibraryPackItem.findMany({
      where: { libraryId },
      include: { pack: true },
    })) as Array<{ pack: PackRecord }>;
    const inCore = rows.some((row) => row.pack?.slug === CORE_PACK_SLUG);
    const categories = rows
      .map((row) => row.pack?.category)
      .filter((category): category is string => Boolean(category));
    return { inCore, categories };
  };

  return {
    seedPacks,
    reseedMembership,
    listPacks,
    getPack,
    getPackLibraries,
    getSpecializedLibraries,
    getLibraryMembership,
  };
};
