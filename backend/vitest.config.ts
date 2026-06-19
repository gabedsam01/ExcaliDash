import { defineConfig } from "vitest/config";

// ExcaliDash is PostgreSQL-only. Integration tests need a real PostgreSQL test
// database. Provide it via DATABASE_URL_TEST or DATABASE_URL; otherwise fall back
// to a conventional local test database (see README "Running tests").
const testDatabaseUrl =
  process.env.DATABASE_URL_TEST ||
  process.env.DATABASE_URL ||
  "postgresql://excalidash:excalidash@localhost:5432/excalidash_test?schema=public";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.integration.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {
      DATABASE_URL: testDatabaseUrl,
      NODE_ENV: "test",
      AUTH_MODE: "local",
      API_KEY_SECRET: "test-api-key-secret-at-least-32-characters",
    },
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
