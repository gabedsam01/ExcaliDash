/**
 * Tiny in-memory Prisma stand-in for the three library models. Implements only
 * the query shapes the services use, so seed/search idempotency can be tested
 * without a real PostgreSQL database.
 */
import type { LibraryPrisma } from "../types";

let idCounter = 0;
const genId = (prefix: string): string => {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
};

const clone = <T>(value: T): T => ({ ...(value as Record<string, unknown>) }) as T;

interface CatalogRow {
  id: string;
  officialId: string | null;
  name: string;
  slug: string;
  description: string | null;
  source: string;
  preview: string | null;
  version: number | null;
  authors: unknown;
  itemNames: unknown;
  createdDate: Date | null;
  updatedDate: Date | null;
  isCurated: boolean;
  isAvailable: boolean;
  lastFetchedAt: Date | null;
  cachedAt: Date | null;
  cachePath: string | null;
  previewCachePath: string | null;
  sha256: string | null;
  sizeBytes: number | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface PackRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  kind: string;
  category: string | null;
  parentSlug: string | null;
  isSystem: boolean;
  enabled: boolean;
  priority: number;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface PackItemRow {
  packId: string;
  libraryId: string;
  priority: number;
  aliases: unknown;
  notes: string | null;
  createdAt: Date;
}

export interface FakePrisma extends LibraryPrisma {
  /** Preload catalog records (only the fields the resolver needs are required). */
  __seedCatalog(
    entries: Array<{ name: string; source: string } & Partial<CatalogRow>>,
  ): CatalogRow[];
  __catalog(): CatalogRow[];
  __packs(): PackRow[];
  __packItems(): PackItemRow[];
}

export const createFakePrisma = (): FakePrisma => {
  const catalog: CatalogRow[] = [];
  const packs: PackRow[] = [];
  const packItems: PackItemRow[] = [];

  const newCatalogRow = (data: Record<string, unknown>): CatalogRow => ({
    id: genId("cat"),
    officialId: null,
    name: "",
    slug: "",
    description: null,
    source: "",
    preview: null,
    version: null,
    authors: null,
    itemNames: null,
    createdDate: null,
    updatedDate: null,
    isCurated: false,
    isAvailable: true,
    lastFetchedAt: null,
    cachedAt: null,
    cachePath: null,
    previewCachePath: null,
    sha256: null,
    sizeBytes: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...(data as Partial<CatalogRow>),
  });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const catalogDelegate = {
    async findMany(args?: any): Promise<unknown[]> {
      let rows = catalog;
      if (args?.where?.isCurated !== undefined) {
        rows = rows.filter((r) => r.isCurated === args.where.isCurated);
      }
      return rows.map(clone);
    },
    async findUnique(args: any): Promise<unknown | null> {
      const where = args.where ?? {};
      const row = catalog.find(
        (r) =>
          (where.id !== undefined && r.id === where.id) ||
          (where.source !== undefined && r.source === where.source) ||
          (where.officialId !== undefined && r.officialId === where.officialId),
      );
      return row ? clone(row) : null;
    },
    async findFirst(args?: any): Promise<unknown | null> {
      let rows = catalog.slice();
      if (args?.where?.lastFetchedAt?.not !== undefined) {
        rows = rows.filter((r) => r.lastFetchedAt !== null);
      }
      if (args?.orderBy?.lastFetchedAt) {
        rows.sort(
          (a, b) =>
            (b.lastFetchedAt?.getTime() ?? 0) - (a.lastFetchedAt?.getTime() ?? 0),
        );
      }
      return rows[0] ? clone(rows[0]) : null;
    },
    async upsert(args: any): Promise<unknown> {
      const where = args.where ?? {};
      const existing = catalog.find(
        (r) =>
          (where.source !== undefined && r.source === where.source) ||
          (where.id !== undefined && r.id === where.id),
      );
      if (existing) {
        Object.assign(existing, args.update);
        existing.updatedAt = new Date();
        return clone(existing);
      }
      const created = newCatalogRow(args.create);
      catalog.push(created);
      return clone(created);
    },
    async update(args: any): Promise<unknown> {
      const row = catalog.find((r) => r.id === args.where.id);
      if (!row) throw new Error(`Catalog row not found: ${args.where.id}`);
      Object.assign(row, args.data);
      row.updatedAt = new Date();
      return clone(row);
    },
    async updateMany(args: any): Promise<{ count: number }> {
      const where = args.where ?? {};
      const notIn: string[] | undefined = where.id?.notIn;
      let count = 0;
      for (const row of catalog) {
        if (where.isCurated !== undefined && row.isCurated !== where.isCurated) {
          continue;
        }
        if (notIn !== undefined && notIn.includes(row.id)) continue;
        Object.assign(row, args.data);
        count += 1;
      }
      return { count };
    },
    async deleteMany(): Promise<{ count: number }> {
      const count = catalog.length;
      catalog.length = 0;
      return { count };
    },
    async count(args?: any): Promise<number> {
      let rows = catalog;
      if (args?.where?.isCurated !== undefined) {
        rows = rows.filter((r) => r.isCurated === args.where.isCurated);
      }
      return rows.length;
    },
  };

  const packDelegate = {
    async findMany(args?: any): Promise<unknown[]> {
      let rows = packs;
      if (args?.where?.parentSlug !== undefined) {
        rows = rows.filter((r) => r.parentSlug === args.where.parentSlug);
      }
      return rows.map(clone);
    },
    async findUnique(args: any): Promise<unknown | null> {
      const where = args.where ?? {};
      const row = packs.find(
        (r) =>
          (where.slug !== undefined && r.slug === where.slug) ||
          (where.id !== undefined && r.id === where.id),
      );
      return row ? clone(row) : null;
    },
    async findFirst(): Promise<unknown | null> {
      return packs[0] ? clone(packs[0]) : null;
    },
    async upsert(args: any): Promise<unknown> {
      const existing = packs.find((r) => r.slug === args.where.slug);
      if (existing) {
        Object.assign(existing, args.update);
        existing.updatedAt = new Date();
        return clone(existing);
      }
      const created: PackRow = {
        id: genId("pack"),
        slug: "",
        name: "",
        description: null,
        kind: "CORE",
        category: null,
        parentSlug: null,
        isSystem: true,
        enabled: true,
        priority: 0,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(args.create as Partial<PackRow>),
      };
      packs.push(created);
      return clone(created);
    },
    async update(args: any): Promise<unknown> {
      const row = packs.find((r) => r.id === args.where.id);
      if (!row) throw new Error(`Pack not found: ${args.where.id}`);
      Object.assign(row, args.data);
      return clone(row);
    },
    async updateMany(): Promise<{ count: number }> {
      return { count: 0 };
    },
    async deleteMany(): Promise<{ count: number }> {
      const count = packs.length;
      packs.length = 0;
      return { count };
    },
    async count(): Promise<number> {
      return packs.length;
    },
  };

  const packItemDelegate = {
    async findMany(args?: any): Promise<unknown[]> {
      let rows = packItems.slice();
      if (args?.where?.packId !== undefined) {
        rows = rows.filter((r) => r.packId === args.where.packId);
      }
      if (args?.where?.libraryId !== undefined) {
        rows = rows.filter((r) => r.libraryId === args.where.libraryId);
      }
      return rows.map((row) => {
        const out: Record<string, unknown> = { ...row };
        if (args?.include?.library) {
          out.library = catalog.find((c) => c.id === row.libraryId) ?? null;
        }
        if (args?.include?.pack) {
          out.pack = packs.find((p) => p.id === row.packId) ?? null;
        }
        return out;
      });
    },
    async findUnique(args: any): Promise<unknown | null> {
      const key = args.where?.packId_libraryId;
      if (!key) return null;
      const row = packItems.find(
        (r) => r.packId === key.packId && r.libraryId === key.libraryId,
      );
      return row ? clone(row) : null;
    },
    async findFirst(): Promise<unknown | null> {
      return packItems[0] ? clone(packItems[0]) : null;
    },
    async upsert(args: any): Promise<unknown> {
      const key = args.where.packId_libraryId;
      const existing = packItems.find(
        (r) => r.packId === key.packId && r.libraryId === key.libraryId,
      );
      if (existing) {
        Object.assign(existing, args.update);
        return clone(existing);
      }
      const created: PackItemRow = {
        packId: key.packId,
        libraryId: key.libraryId,
        priority: 0,
        aliases: null,
        notes: null,
        createdAt: new Date(),
        ...(args.create as Partial<PackItemRow>),
      };
      packItems.push(created);
      return clone(created);
    },
    async update(args: any): Promise<unknown> {
      const key = args.where.packId_libraryId;
      const row = packItems.find(
        (r) => r.packId === key.packId && r.libraryId === key.libraryId,
      );
      if (!row) throw new Error("Pack item not found");
      Object.assign(row, args.data);
      return clone(row);
    },
    async updateMany(): Promise<{ count: number }> {
      return { count: 0 };
    },
    async deleteMany(args: any): Promise<{ count: number }> {
      const where = args.where ?? {};
      const before = packItems.length;
      for (let i = packItems.length - 1; i >= 0; i -= 1) {
        const row = packItems[i];
        const matchesPack =
          where.packId === undefined || row.packId === where.packId;
        const notInList: string[] | undefined = where.libraryId?.notIn;
        const matchesNotIn =
          notInList === undefined || !notInList.includes(row.libraryId);
        if (matchesPack && matchesNotIn) packItems.splice(i, 1);
      }
      return { count: before - packItems.length };
    },
    async count(args?: any): Promise<number> {
      let rows = packItems;
      if (args?.where?.packId !== undefined) {
        rows = rows.filter((r) => r.packId === args.where.packId);
      }
      return rows.length;
    },
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return {
    excalidrawLibraryCatalogItem: catalogDelegate,
    excalidrawLibraryPack: packDelegate,
    excalidrawLibraryPackItem: packItemDelegate,
    __seedCatalog(entries) {
      return entries.map((entry) => {
        const row = newCatalogRow({
          slug: entry.source.replace(/\.excalidrawlib$/i, ""),
          ...entry,
        });
        catalog.push(row);
        return clone(row);
      });
    },
    __catalog: () => catalog.map(clone),
    __packs: () => packs.map(clone),
    __packItems: () => packItems.map(clone),
  };
};
