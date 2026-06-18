/* eslint-disable no-console */
const { execSync } = require("child_process");
const path = require("path");

const backendRoot = path.resolve(__dirname, "..");

// ExcaliDash is PostgreSQL-only. Fail fast (with a clear message) instead of
// silently defaulting to a local SQLite file like older versions did.
const resolveDatabaseUrl = (rawUrl) => {
  const trimmed = rawUrl ? String(rawUrl).trim() : "";

  if (!trimmed) {
    console.error(
      "[predev] Missing DATABASE_URL. ExcaliDash requires a PostgreSQL connection string, e.g.\n" +
        "  DATABASE_URL=postgresql://excalidash:change_me@localhost:5432/excalidash?schema=public\n" +
        "Start a local database with: docker compose up -d postgres",
    );
    process.exit(1);
  }

  if (/^file:/i.test(trimmed) || /^sqlite:/i.test(trimmed)) {
    console.error(
      "[predev] SQLite is no longer supported. DATABASE_URL must point at PostgreSQL " +
        "(postgresql://...). Update your backend/.env or environment.",
    );
    process.exit(1);
  }

  if (!/^postgres(ql)?:\/\//i.test(trimmed)) {
    console.error(
      "[predev] Invalid DATABASE_URL. ExcaliDash requires a PostgreSQL connection string " +
        "starting with postgresql:// (or postgres://).",
    );
    process.exit(1);
  }

  return trimmed;
};

const databaseUrl = resolveDatabaseUrl(process.env.DATABASE_URL);
process.env.DATABASE_URL = databaseUrl;

const nodeEnv = process.env.NODE_ENV || "development";
const isNonProd = nodeEnv !== "production";

const runCapture = (cmd) => {
  try {
    const stdout = execSync(cmd, {
      cwd: backendRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
    return { ok: true, stdout: stdout || "", stderr: "" };
  } catch (error) {
    const err = error;
    const stderr =
      err && err.stderr
        ? Buffer.isBuffer(err.stderr)
          ? err.stderr.toString("utf8")
          : String(err.stderr)
        : "";
    const stdout =
      err && err.stdout
        ? Buffer.isBuffer(err.stdout)
          ? err.stdout.toString("utf8")
          : String(err.stdout)
        : "";
    return { ok: false, stdout, stderr, error: err };
  }
};

const run = (cmd) => {
  execSync(cmd, {
    cwd: backendRoot,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
};

const shouldForceSingleUserDev =
  isNonProd &&
  process.env.AUTH_MODE !== "hybrid" &&
  process.env.AUTH_MODE !== "oidc_enforced" &&
  /^(1|true|yes)$/i.test(process.env.EXCALIDASH_DEV_SINGLE_USER || "");

const forceSingleUserDevMode = async () => {
  const { PrismaClient } = require("../src/generated/client");
  const prisma = new PrismaClient();

  try {
    await prisma.systemConfig.upsert({
      where: { id: "default" },
      update: {
        authEnabled: false,
        authOnboardingCompleted: true,
      },
      create: {
        id: "default",
        authEnabled: false,
        authOnboardingCompleted: true,
        registrationEnabled: false,
        authLoginRateLimitEnabled: true,
        authLoginRateLimitWindowMs: 15 * 60 * 1000,
        authLoginRateLimitMax: 20,
      },
    });

    console.log("[predev] Forced local development into single-user mode (no login required).");
  } finally {
    await prisma.$disconnect();
  }
};

const main = async () => {
  const deploy = runCapture("npx prisma migrate deploy");
  if (deploy.ok) {
    if (deploy.stdout) process.stdout.write(deploy.stdout);
  } else {
    if (deploy.stdout) process.stdout.write(deploy.stdout);
    if (deploy.stderr) process.stderr.write(deploy.stderr);

    const stderr = deploy.stderr || "";
    // P3005: the database schema is not empty but has no migration history.
    // In local development it is safe to reset; never do this in production.
    const isP3005 = stderr.includes("P3005");

    if (isNonProd && isP3005) {
      console.warn(
        "[predev] Prisma migrate baseline required (P3005). Resetting local development database.\n" +
          `  DATABASE_URL=${databaseUrl}\n` +
          "  This DROPS all data in the target database. Use a dedicated local PostgreSQL database for development.",
      );

      run("npx prisma migrate reset --force --skip-seed");
    } else {
      throw deploy.error;
    }
  }

  if (shouldForceSingleUserDev) {
    await forceSingleUserDevMode();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
