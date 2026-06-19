#!/usr/bin/env node
/**
 * Admin tool: prune DrawingSnapshot rows down to the newest N per drawing.
 *
 * Safe by default — DRY RUN unless --confirm is passed.
 *
 *   node scripts/prune-snapshots.cjs --keep 15 --dry-run
 *   node scripts/prune-snapshots.cjs --keep 15 --confirm
 *   node scripts/prune-snapshots.cjs --keep 15 --drawing-id <id> --confirm
 *
 * Retention ordering matches the app: version DESC, createdAt DESC, id DESC.
 * In production a single drawing accumulated thousands of multi-MB snapshots and
 * grew "DrawingSnapshot" to ~36 GB; keeping the newest 15 + VACUUM FULL brought
 * it back to ~393 MB.
 */
const path = require("path");

const backendRoot = path.resolve(__dirname, "../backend");

try {
  // Load backend/.env so DATABASE_URL resolves the same way the app does.
  require(path.join(backendRoot, "node_modules/dotenv")).config({
    path: path.join(backendRoot, ".env"),
  });
} catch {
  // dotenv is optional; rely on the ambient environment if it isn't present.
}

let PrismaClient;
try {
  ({ PrismaClient } = require(path.join(backendRoot, "src/generated/client")));
} catch (err) {
  console.error(
    "Could not load the Prisma client. Run `npm --prefix backend run build` " +
      "(or `npx prisma generate` in backend/) first.\n" +
      String(err && err.message ? err.message : err),
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const readArg = (name, fallback) => {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  const value = args[i + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
};
const hasArg = (name) => args.includes(name);

const keep = Number(readArg("--keep", "15"));
const drawingId = readArg("--drawing-id", null);
const confirm = hasArg("--confirm");
// Dry-run is the default unless an explicit destructive flag is present.
const dryRun = !confirm;

if (!Number.isInteger(keep) || keep < 1) {
  console.error("--keep must be an integer >= 1 (refusing to delete all snapshots).");
  process.exit(1);
}

const prisma = new PrismaClient();

const num = (value) => Number(value ?? 0);

async function tableSizes() {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT
         pg_size_pretty(pg_total_relation_size('"DrawingSnapshot"')) AS total_size,
         pg_size_pretty(pg_table_size('"DrawingSnapshot"'))         AS table_size,
         pg_size_pretty(pg_indexes_size('"DrawingSnapshot"'))       AS index_size`,
    );
    return rows && rows[0] ? rows[0] : null;
  } catch {
    return null; // not fatal (e.g. insufficient privileges)
  }
}

async function main() {
  console.log(
    `Snapshot prune — keep=${keep}${drawingId ? `, drawingId=${drawingId}` : " (all drawings)"}, ` +
      `mode=${dryRun ? "DRY RUN" : "CONFIRM (will delete)"}`,
  );

  const sizeBefore = await tableSizes();
  if (sizeBefore) {
    console.log(
      `Table size (before): total=${sizeBefore.total_size}, table=${sizeBefore.table_size}, indexes=${sizeBefore.index_size}`,
    );
  }

  // Per-drawing counts for drawings over the limit (so the report shows exactly
  // what would change). Capped for readability. `keep` is parameterized (not
  // interpolated) for consistent SQL-injection defense-in-depth, even though it
  // is already validated as an integer >= 1 above.
  const whereClause = drawingId ? `WHERE "drawingId" = $1` : "";
  const perDrawingParams = drawingId ? [drawingId] : [];
  const keepParam = `$${drawingId ? 2 : 1}`;
  const keepParams = drawingId ? [drawingId, keep] : [keep];
  const overLimit = await prisma.$queryRawUnsafe(
    `SELECT "drawingId" AS id, COUNT(*)::int AS cnt
       FROM "DrawingSnapshot"
       ${whereClause}
       GROUP BY "drawingId"
       HAVING COUNT(*) > ${keepParam}
       ORDER BY COUNT(*) DESC
       LIMIT 50`,
    ...keepParams,
  );

  const totalsRow = (
    await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::bigint AS total FROM "DrawingSnapshot" ${whereClause}`,
      ...perDrawingParams,
    )
  )[0];
  const totalBefore = num(totalsRow.total);

  const toDeleteRow = (
    await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM(GREATEST(cnt - ${keepParam}, 0)), 0)::bigint AS to_delete,
              COUNT(*)::int AS drawings_over
         FROM (
           SELECT "drawingId", COUNT(*)::int AS cnt
             FROM "DrawingSnapshot" ${whereClause}
             GROUP BY "drawingId"
         ) t`,
      ...keepParams,
    )
  )[0];
  const totalToDelete = num(toDeleteRow.to_delete);
  const drawingsOver = num(toDeleteRow.drawings_over);

  console.log("");
  console.log(`Drawings over the limit: ${drawingsOver}`);
  if (overLimit.length > 0) {
    console.log("  drawingId                              current  ->  toDelete  ->  final");
    for (const row of overLimit) {
      const cnt = num(row.cnt);
      const del = Math.max(0, cnt - keep);
      console.log(
        `  ${String(row.id).padEnd(38)} ${String(cnt).padStart(7)}  ->  ${String(del).padStart(8)}  ->  ${String(cnt - del).padStart(5)}`,
      );
    }
    if (drawingsOver > overLimit.length) {
      console.log(`  ... and ${drawingsOver - overLimit.length} more drawing(s) over the limit`);
    }
  }

  console.log("");
  console.log(`Total snapshots now:          ${totalBefore}`);
  console.log(`Total to delete:              ${totalToDelete}`);
  console.log(`Total snapshots after prune:  ${totalBefore - totalToDelete}`);

  if (dryRun) {
    console.log("");
    console.log("DRY RUN — nothing was deleted. Re-run with --confirm to apply.");
    return;
  }

  if (totalToDelete === 0) {
    console.log("\nNothing to delete.");
    return;
  }

  // Delete the surplus rows using the same retention ordering as the app.
  const deleteParams = drawingId ? [drawingId, keep] : [keep];
  const partitionFilter = drawingId ? `WHERE "drawingId" = $1` : "";
  const rnParam = drawingId ? "$2" : "$1";
  const deleted = await prisma.$executeRawUnsafe(
    `WITH ranked AS (
       SELECT id,
              ROW_NUMBER() OVER (
                PARTITION BY "drawingId"
                ORDER BY "version" DESC, "createdAt" DESC, id DESC
              ) AS rn
         FROM "DrawingSnapshot"
         ${partitionFilter}
     )
     DELETE FROM "DrawingSnapshot"
      WHERE id IN (SELECT id FROM ranked WHERE rn > ${rnParam})`,
    ...deleteParams,
  );

  console.log("");
  console.log(`Deleted ${deleted} snapshot(s).`);

  const sizeAfter = await tableSizes();
  if (sizeAfter) {
    console.log(
      `Table size (after): total=${sizeAfter.total_size}, table=${sizeAfter.table_size}, indexes=${sizeAfter.index_size}`,
    );
    console.log(
      "Tip: run `VACUUM (FULL, ANALYZE) \"DrawingSnapshot\";` to reclaim disk space on PostgreSQL.",
    );
  }
}

main()
  .catch((err) => {
    console.error("prune-snapshots failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
