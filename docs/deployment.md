# Deployment

The user-facing deployment is a single `docker-compose.yml` with three
separate containers:

- PostgreSQL 17
- ExcaliDash V2 backend
- ExcaliDash V2 frontend/Nginx

PostgreSQL is not bundled into either application image. The topology remains
suitable for advanced deployments where database, backend, and frontend are
managed independently.

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
  Socket.IO adapter.
- Run database migrations once when operating multiple backend replicas.

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
