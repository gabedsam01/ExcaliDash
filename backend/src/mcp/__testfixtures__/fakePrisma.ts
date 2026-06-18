/**
 * In-memory Prisma stand-in for MCP tests: drawing, drawingSnapshot and apiKey
 * delegates with just the query shapes the MCP code uses.
 */
let idCounter = 0;
const genId = (prefix: string): string => {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
};

interface DrawingRow {
  id: string;
  name: string;
  elements: string;
  appState: string;
  files: string;
  preview: string | null;
  version: number;
  userId: string;
  collectionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ApiKeyRow {
  id: string;
  prefix: string;
  userId: string;
  tokenHash: string;
  revokedAt: Date | null;
  userActive: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface McpFakePrisma {
  drawing: {
    create(args: any): Promise<any>;
    findFirst(args: any): Promise<any | null>;
    update(args: any): Promise<any>;
  };
  drawingSnapshot: {
    create(args: any): Promise<any>;
  };
  apiKey: {
    findUnique(args: any): Promise<any | null>;
    updateMany(args: any): Promise<{ count: number }>;
  };
  collection: {
    findFirst(args: any): Promise<any | null>;
  };
  __drawings(): DrawingRow[];
  __snapshots(): any[];
  __seedApiKey(row: {
    prefix: string;
    userId: string;
    tokenHash: string;
    revokedAt?: Date | null;
    userActive?: boolean;
  }): ApiKeyRow;
  __seedCollection(row: { id: string; userId: string }): void;
}

export const createMcpFakePrisma = (): McpFakePrisma => {
  const drawings: DrawingRow[] = [];
  const snapshots: any[] = [];
  const apiKeys: ApiKeyRow[] = [];
  const collections: Array<{ id: string; userId: string }> = [];

  return {
    drawing: {
      async create({ data }: any) {
        const row: DrawingRow = {
          id: genId("drawing"),
          name: data.name,
          elements: data.elements ?? "[]",
          appState: data.appState ?? "{}",
          files: data.files ?? "{}",
          preview: data.preview ?? null,
          version: data.version ?? 1,
          userId: data.userId,
          collectionId: data.collectionId ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        drawings.push(row);
        return { ...row };
      },
      async findFirst({ where }: any) {
        const row = drawings.find(
          (d) =>
            d.id === where.id &&
            (where.userId === undefined || d.userId === where.userId),
        );
        return row ? { ...row } : null;
      },
      async update({ where, data }: any) {
        const row = drawings.find((d) => d.id === where.id);
        if (!row) throw new Error(`Drawing not found: ${where.id}`);
        Object.assign(row, data);
        row.updatedAt = new Date();
        return { ...row };
      },
    },
    drawingSnapshot: {
      async create({ data }: any) {
        const snap = { id: genId("snap"), ...data, createdAt: new Date() };
        snapshots.push(snap);
        return { ...snap };
      },
    },
    apiKey: {
      async findUnique({ where }: any) {
        const row = apiKeys.find((k) => k.prefix === where.prefix);
        if (!row) return null;
        return {
          id: row.id,
          userId: row.userId,
          tokenHash: row.tokenHash,
          revokedAt: row.revokedAt,
          user: { isActive: row.userActive },
        };
      },
      async updateMany({ where }: any) {
        const row = apiKeys.find(
          (k) =>
            k.id === where.id &&
            (where.revokedAt === null ? k.revokedAt === null : true),
        );
        return { count: row ? 1 : 0 };
      },
    },
    collection: {
      async findFirst({ where }: any) {
        const row = collections.find(
          (c) =>
            c.id === where.id &&
            (where.userId === undefined || c.userId === where.userId),
        );
        return row ? { ...row } : null;
      },
    },
    __drawings: () => drawings.map((d) => ({ ...d })),
    __snapshots: () => snapshots.map((s) => ({ ...s })),
    __seedCollection: (row) => {
      collections.push({ ...row });
    },
    __seedApiKey(row) {
      const stored: ApiKeyRow = {
        id: genId("key"),
        prefix: row.prefix,
        userId: row.userId,
        tokenHash: row.tokenHash,
        revokedAt: row.revokedAt ?? null,
        userActive: row.userActive ?? true,
      };
      apiKeys.push(stored);
      return stored;
    },
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */
