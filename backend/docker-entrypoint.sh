#!/bin/sh
set -e

MIGRATION_LOCK_DIR="/app/prisma/.migration-lock"
MIGRATION_LOCK_TIMEOUT_SECONDS="${MIGRATION_LOCK_TIMEOUT_SECONDS:-120}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-true}"

# 1. Ensure schema and migrations are present (Running as root)
# /app/prisma holds the Prisma schema, migrations, and migration lock. Runtime
# secrets are managed by the application in /app/data/secrets.env.
if [ ! -f "/app/prisma/schema.prisma" ]; then
    echo "Mount appears empty (missing schema.prisma). Bootstrapping schema and migrations..."
else
    # Volume exists but may be missing new migrations from an upgrade.
    echo "Syncing schema and migrations from template..."
fi

mkdir -p /app/prisma/migrations
mkdir -p /app/data
cp /app/prisma_template/schema.prisma /app/prisma/schema.prisma
cp -R /app/prisma_template/migrations/. /app/prisma/migrations/

# 2. Fix permissions unconditionally (Running as root)
echo "Fixing filesystem permissions..."
chown -R nodejs:nodejs /app/uploads
chown -R nodejs:nodejs /app/prisma
chown -R nodejs:nodejs /app/data
chmod 755 /app/uploads
chmod 755 /app/data

# 3. Run Migrations (Drop privileges to nodejs)
# Multi-replica note:
# - Running migrations concurrently from several replicas can race against each other.
# - This lock serializes startup when multiple containers share the same prisma volume.
# - For multi-replica deployments, the safest pattern is still: run migrations once
#   (e.g. via a Job/init container) against the shared PostgreSQL database and set
#   RUN_MIGRATIONS=false on the remaining replicas.
if [ "${RUN_MIGRATIONS}" = "true" ] || [ "${RUN_MIGRATIONS}" = "1" ]; then
    echo "Running database migrations..."

    lock_waited=0
    while ! mkdir "${MIGRATION_LOCK_DIR}" 2>/dev/null; do
        if [ "${lock_waited}" -ge "${MIGRATION_LOCK_TIMEOUT_SECONDS}" ]; then
            echo "Timed out waiting for migration lock after ${MIGRATION_LOCK_TIMEOUT_SECONDS}s"
            exit 1
        fi
        lock_waited=$((lock_waited + 1))
        sleep 1
    done

    # Best-effort cleanup so future startups don't block forever.
    trap 'rmdir "${MIGRATION_LOCK_DIR}" 2>/dev/null || true' EXIT INT TERM

    su-exec nodejs npx prisma migrate deploy

    rmdir "${MIGRATION_LOCK_DIR}" 2>/dev/null || true
    trap - EXIT INT TERM
else
    echo "Skipping database migrations (RUN_MIGRATIONS=${RUN_MIGRATIONS})"
fi

# 4. Start Application (Drop privileges to nodejs)
echo "Starting application as nodejs..."
exec su-exec nodejs node dist/index.js
