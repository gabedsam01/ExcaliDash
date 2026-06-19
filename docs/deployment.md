# Deployment

The user-facing deployment is a single `docker-compose.yml` with separate
containers:

- PostgreSQL 17
- Redis 7 (optional speed layer; enabled by default in the quickstart)
- ExcaliDash V2 backend
- ExcaliDash V2 frontend/Nginx

PostgreSQL is not bundled into either application image, and remains the source
of truth. Redis is only a cache and can be disabled with `REDIS_ENABLED=false`.
The topology remains suitable for advanced deployments where database, cache,
backend, and frontend are managed independently.

## Default deployment

Follow [quickstart.md](quickstart.md), then access:

```txt
http://localhost:6767
```

Only the frontend port is published. Nginx proxies `/api`, `/socket.io`, and
`/mcp` to the backend over the Compose network.

## Production controls

- Pin `EXCALIDASH_BACKEND_TAG` and `EXCALIDASH_FRONTEND_TAG` to matching
  version or SHA tags.
- Keep `.env` readable only by the deployment account.
- Set `FRONTEND_URL` and `APP_URL` to the browser origin.
- Set `TRUST_PROXY` to the number of trusted proxy hops for advanced proxy
  deployments; the quickstart uses `true` because Nginx is the application
  ingress.
- Back up PostgreSQL and `backend_data`.
- Keep one backend replica unless collaboration state is moved to a shared
  Socket.IO adapter. When running multiple replicas, enable Redis
  (`REDIS_ENABLED=true`) so the listing cache and the advisory save lock /
  snapshot coalescing are shared across replicas. PostgreSQL stays the source of
  truth and the app degrades gracefully if Redis is unavailable. See
  [redis.md](redis.md).
- Persist the `redis_data` volume if you want the Redis append-only file to
  survive restarts (cache contents are non-authoritative either way).
- Run database migrations once when operating multiple backend replicas.
- ExcaliDash keeps only the latest `MAX_SNAPSHOTS_PER_DRAWING` (default 15)
  snapshots per drawing to bound `DrawingSnapshot` growth. To reclaim space on
  an existing large table, run `node scripts/prune-snapshots.cjs --keep 15
  --confirm` then `VACUUM (FULL, ANALYZE) "DrawingSnapshot";`. See
  [postgres.md](postgres.md).

## Health and logs

```bash
curl -i http://localhost:6767/api/health
docker compose ps
docker compose logs backend --tail=200
docker compose logs frontend --tail=200
```

The backend entrypoint runs `prisma migrate deploy` by default. Set
`RUN_MIGRATIONS=false` only when an external migration job is responsible for
the schema.

## Advanced separated deployment

The same images can run independently:

- backend listens on port `8000`;
- frontend listens on port `80`;
- frontend `BACKEND_URL` uses `host:port` format;
- backend requires a PostgreSQL `DATABASE_URL`;
- `/app/data` must be persistent if fallback-generated secrets or library
  caches must survive restarts.

See [backend.md](backend.md), [frontend.md](frontend.md), and
[postgres.md](postgres.md).

## Contributor source build

The end-user Compose file remains image-only. Repository contributors can apply
the source-build override:

```bash
./quickstart.sh --yes
docker compose -f docker-compose.yml -f docker-compose.source.yml up -d --build
```

The equivalent helpers are `make docker-build` and
`make docker-run-detached`.
