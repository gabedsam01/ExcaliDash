# Quickstart

## Prerequisites

- Docker Engine
- Docker Compose plugin (`docker compose version`)
- `curl`

The GHCR packages must have been published by a successful run of
`.github/workflows/ghcr.yml`.

## Fast install

```bash
mkdir excalidash-v2
cd excalidash-v2
curl -fsSL https://raw.githubusercontent.com/gabedsam01/excalidash-v2/main/quickstart.sh | bash
docker compose up -d
```

Open:

```txt
http://localhost:6767
```

To prepare files and start immediately:

```bash
curl -fsSL https://raw.githubusercontent.com/gabedsam01/excalidash-v2/main/quickstart.sh | bash -s -- --yes --up
```

The script:

- downloads `docker-compose.yml` when missing;
- creates `.env` when missing;
- replaces only empty or documented placeholder secret values;
- generates 512-bit lowercase hexadecimal secrets;
- never prints complete secret values;
- leaves existing non-placeholder values unchanged.

## Manual install

```bash
curl -fsSL https://raw.githubusercontent.com/gabedsam01/excalidash-v2/main/docker-compose.yml -o docker-compose.yml
curl -fsSL https://raw.githubusercontent.com/gabedsam01/excalidash-v2/main/.env.example -o .env
```

Replace all four `generate_with_quickstart` placeholders with 128-character
hexadecimal values. To fill only those placeholders automatically:

```bash
curl -fsSL https://raw.githubusercontent.com/gabedsam01/excalidash-v2/main/quickstart.sh -o quickstart.sh
sh quickstart.sh --yes
```

Validate and start:

```bash
docker compose config
docker compose up -d
```

## Operations

Status and logs:

```bash
docker compose ps
docker compose logs backend --tail=200
docker compose logs -f backend
```

Stop:

```bash
docker compose down
```

Update:

```bash
docker compose pull
docker compose up -d
```

## Rotate secrets

Generate a new 512-bit value with:

```bash
openssl rand -hex 64
```

Replace the relevant value in `.env`, then recreate the services:

```bash
docker compose up -d --force-recreate backend frontend
```

Changing `JWT_SECRET` signs users out. Changing `API_KEY_SECRET` invalidates
existing API keys. To rotate `POSTGRES_PASSWORD`, first change the PostgreSQL
role password with `psql`, then update `.env` and recreate `postgres` and
`backend`; changing only `.env` does not alter an existing database role.

```bash
docker compose up -d --force-recreate postgres backend
```

## Backups

Database:

```bash
docker compose exec -T postgres pg_dump \
  -U excalidash -d excalidash > excalidash.sql
```

Persistent backend data, including fallback-generated secrets and cached
libraries:

```bash
docker run --rm \
  --volume excalidash-v2_backend_data:/source:ro \
  --volume "$PWD":/backup \
  alpine tar -czf /backup/backend_data.tgz -C /source .
```

Store both files outside the Docker host.

## Snapshot retention

ExcaliDash V2 keeps only the latest `MAX_SNAPSHOTS_PER_DRAWING` (default 15)
snapshots per drawing so large Excalidraw files with embedded images don't
balloon the `DrawingSnapshot` table. Saves are optimized to avoid creating large
snapshots on every autosave. The relevant `.env` variables are documented in
`.env.example`; to clean up an existing large table see
[postgres.md](postgres.md) and `scripts/prune-snapshots.cjs`.

## Redis (optional, recommended)

Redis is optional but recommended for faster self-hosted deployments. PostgreSQL
remains the source of truth; Redis caches hot drawings, metadata, and save
coordination state. The quickstart `docker-compose.yml` ships a `redis` service
and enables it by default (`REDIS_ENABLED=true`). To run without Redis, set
`REDIS_ENABLED=false` in `.env` — the backend then uses PostgreSQL alone. If
Redis is enabled but unreachable, the backend logs a warning and falls back to
PostgreSQL automatically. See [redis.md](redis.md).

## Language (i18n)

The interface is available in English (default) and Brazilian Portuguese. Use the
language button on the login, dashboard, and settings screens; the choice is
saved in your browser. See [i18n.md](i18n.md).

## Runtime configuration status

After authentication, the UI/API session can request:

```txt
GET http://localhost:6767/api/system/runtime-config
```

The response contains only status, source labels, limits, and truncated
SHA-256 fingerprints. It never returns raw credentials or connection strings.
