/**
 * Test utilities for backend integration tests
 *
 * ExcaliDash is PostgreSQL-only. Integration tests run against a dedicated
 * PostgreSQL database provided via DATABASE_URL (or DATABASE_URL_TEST). The
 * schema is (re)created with `prisma db push --force-reset`, so point these
 * variables at a throwaway test database — never a real one.
 */
import { PrismaClient } from "../generated/client";
import path from "path";
import { execSync } from "child_process";

const resolveTestDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;

  if (!url || url.trim().length === 0) {
    throw new Error(
      "Missing DATABASE_URL for tests. Set DATABASE_URL (or DATABASE_URL_TEST) to a " +
        "PostgreSQL test database, e.g. " +
        "postgresql://excalidash:excalidash@localhost:5432/excalidash_test?schema=public",
    );
  }

  if (/^file:/i.test(url) || /^sqlite:/i.test(url)) {
    throw new Error(
      "Tests require a PostgreSQL DATABASE_URL; SQLite is no longer supported.",
    );
  }

  return url.trim();
};

const TEST_DATABASE_URL = resolveTestDatabaseUrl();
// Ensure the app config and the Prisma CLI all resolve the same database.
process.env.DATABASE_URL = TEST_DATABASE_URL;

/**
 * Get a test Prisma client pointing to the PostgreSQL test database
 */
export const getTestPrisma = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: TEST_DATABASE_URL,
      },
    },
  });
};

/**
 * Setup the test database by (re)creating the schema from prisma/schema.prisma.
 * Uses `db push --force-reset` so each run starts from a clean PostgreSQL schema.
 */
export const setupTestDb = () => {
  try {
    execSync("npx prisma db push --skip-generate --force-reset", {
      cwd: path.resolve(__dirname, "../../"),
      env: {
        ...process.env,
        DATABASE_URL: TEST_DATABASE_URL,
      },
      stdio: "pipe",
    });
  } catch (error) {
    console.error("Failed to setup test database:", error);
    throw error;
  }
};

/**
 * Clean up the test database between tests
 */
export const cleanupTestDb = async (prisma: PrismaClient) => {
  await prisma.drawing.deleteMany({});
  await prisma.collection.deleteMany({});
};

/**
 * Create a test user for testing
 */
export const createTestUser = async (prisma: PrismaClient, email: string = "test@example.com") => {
  const bcrypt = require("bcrypt");
  const passwordHash = await bcrypt.hash("testpassword", 10);
  
  return await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: "Test User",
    },
  });
};

/**
 * Initialize test database with required data
 */
export const initTestDb = async (prisma: PrismaClient) => {
  const testUser = await createTestUser(prisma);
  const trashCollectionId = `trash:${testUser.id}`;
  
  const trash = await prisma.collection.findFirst({
    where: { id: trashCollectionId, userId: testUser.id },
  });
  if (!trash) {
    await prisma.collection.create({
      data: { id: trashCollectionId, name: "Trash", userId: testUser.id },
    });
  }
  
  return testUser;
};

/**
 * Generate a sample base64 PNG image data URL
 * This creates a small but valid PNG for testing
 */
export const generateSampleImageDataUrl = (size: "small" | "medium" | "large" = "small"): string => {
  const smallPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
  
  if (size === "small") {
    return `data:image/png;base64,${smallPng}`;
  }
  
  const repetitions = size === "medium" ? 1000 : 10000;
  const paddedBase64 = smallPng.repeat(repetitions);
  
  return `data:image/png;base64,${paddedBase64}`;
};

/**
 * Generate a large image data URL that exceeds the 10000 char limit
 * This is specifically designed to catch the truncation bug from issue #17
 */
export const generateLargeImageDataUrl = (): string => {
  const baseImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
  const largeBase64 = baseImage.repeat(500);
  return `data:image/png;base64,${largeBase64}`;
};

/**
 * Create a sample Excalidraw files object with embedded images
 */
export const createSampleFilesObject = (imageCount: number = 1, size: "small" | "large" = "small") => {
  const files: Record<string, any> = {};
  
  for (let i = 0; i < imageCount; i++) {
    const fileId = `file-${i}-${Date.now()}`;
    files[fileId] = {
      id: fileId,
      mimeType: "image/png",
      dataURL: size === "large" ? generateLargeImageDataUrl() : generateSampleImageDataUrl("small"),
      created: Date.now(),
      lastRetrieved: Date.now(),
    };
  }
  
  return files;
};

/**
 * Create a minimal valid Excalidraw drawing payload
 */
export const createTestDrawingPayload = (options: {
  name?: string;
  files?: Record<string, any> | null;
  elements?: any[];
  appState?: any;
} = {}) => {
  return {
    name: options.name ?? "Test Drawing",
    elements: options.elements ?? [
      {
        id: "element-1",
        type: "rectangle",
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        angle: 0,
        strokeColor: "#000000",
        backgroundColor: "transparent",
        fillStyle: "hachure",
        strokeWidth: 1,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        groupIds: [],
        frameId: null,
        roundness: null,
        seed: 12345,
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false,
      },
    ],
    appState: options.appState ?? {
      viewBackgroundColor: "#ffffff",
      gridSize: null,
    },
    files: options.files ?? null,
    preview: null,
    collectionId: null,
  };
};

/**
 * Compare two files objects to check if image data was preserved
 */
export const compareFilesObjects = (original: Record<string, any>, received: Record<string, any>): {
  isEqual: boolean;
  differences: string[];
} => {
  const differences: string[] = [];
  
  const originalKeys = Object.keys(original);
  const receivedKeys = Object.keys(received);
  
  if (originalKeys.length !== receivedKeys.length) {
    differences.push(`Key count mismatch: original=${originalKeys.length}, received=${receivedKeys.length}`);
  }
  
  for (const key of originalKeys) {
    if (!(key in received)) {
      differences.push(`Missing key: ${key}`);
      continue;
    }
    
    const origFile = original[key];
    const recvFile = received[key];
    
    if (origFile.dataURL !== recvFile.dataURL) {
      differences.push(
        `DataURL mismatch for ${key}: ` +
        `original length=${origFile.dataURL?.length ?? 0}, ` +
        `received length=${recvFile.dataURL?.length ?? 0}`
      );
      
      if (recvFile.dataURL && origFile.dataURL?.startsWith(recvFile.dataURL.substring(0, 100))) {
        differences.push(`TRUNCATION DETECTED: dataURL was cut short`);
      }
    }
  }
  
  return {
    isEqual: differences.length === 0,
    differences,
  };
};
