# Backend

The backend is an Express and Socket.IO TypeScript service in `backend/src`.
Environment loading and validation are in `backend/src/config.ts`; server
initialization is in `backend/src/index.ts`.

## Runtime

The container listens on port `8000` and requires PostgreSQL. Its main
persistent path is `/app/data`, used for curated library caches and
`secrets.env` when fallback secrets must be generated.

If `JWT_SECRET`, `CSRF_SECRET`, or `API_KEY_SECRET` is empty or contains a known
placeholder in production, startup generates a 512-bit value and persists it.
Logs include only a short SHA-256 fingerprint.

Health through the quickstart proxy:

```bash
curl -i http://localhost:6767/api/health
```

## Saves, snapshots and image optimization

Drawing saves are tuned for large boards (many embedded images / dataURLs):

- **Smart snapshots** — a `DrawingSnapshot` is no longer written on every
  autosave. One is created for the first save, an explicit checkpoint
  (manual save / restore), or once `SNAPSHOT_MIN_INTERVAL_SECONDS` has elapsed.
  With `SNAPSHOT_ASYNC=true` the snapshot write + prune run off the response
  path so the save responds fast and never fails because of history.
- **Retention** — only the newest `MAX_SNAPSHOTS_PER_DRAWING` (default 15) are
  kept per drawing. See [PostgreSQL → Snapshot retention](./postgres.md).
- **Image optimization + de-duplication** — embedded `image/png`, `image/jpeg`
  and `image/webp` files larger than `IMAGE_OPTIMIZATION_MIN_BYTES` are stripped
  of metadata, clamped to `IMAGE_OPTIMIZATION_MAX_WIDTH/HEIGHT`, and re-encoded
  in the same mime type (preserving Excalidraw compatibility and fileIds).
  Identical content is optimized once and reused. This uses the optional
  `sharp` dependency; if it is unavailable or optimization fails, the original
  bytes are kept and a warning is logged. SVG/GIF are never rasterized.
- **Lean list routes** — `GET /drawings`, `GET /drawings/shared` and
  `GET /drawings/:id/history` return metadata only by default; the heavy
  `elements` / `appState` / `files` are loaded only when a drawing is opened,
  restored, or exported.
- **Performance logging** — when `SAVE_PERF_LOG_ENABLED=true`, a save slower
  than `SAVE_PERF_SLOW_MS` logs one structured line of sizes/counts/timings.
  Payload content (elements, files, dataURLs, secrets) is never logged.

All of the above are configured via environment variables documented in
`backend/.env.example`.

## Redis (optional speed layer)

PostgreSQL is always the source of truth. When `REDIS_ENABLED=true`, Redis adds:

- a **hot drawing cache** for `GET /drawings/:id` (consulted only after the
  request is authenticated/authorized; oversized drawings skip the cache);
- a distributed **listing/collections cache** layered under the in-process cache
  and invalidated per user via an O(1) generation bump;
- an advisory **save lock** + cross-replica **snapshot coalescing** so concurrent
  saves of the same drawing don't pile up snapshots.

All Redis access goes through `backend/src/cache/cacheService.ts` — routes and
the MCP server never issue raw Redis commands. If Redis is disabled or
unreachable, every path falls back to PostgreSQL and a single warning is logged.
No secrets and no value above `REDIS_MAX_VALUE_BYTES` are stored. See
[redis.md](./redis.md).

### No object storage

ExcaliDash never uses S3/R2/MinIO or any external object storage. An optional
local (on-volume) file store for large embedded images is scaffolded behind
`LOCAL_FILE_STORAGE_ENABLED` / `LOCAL_FILE_STORAGE_DIR` and is **off by default**
— it is a documented next step and does not affect the current save path, import,
or export.

## Authenticated runtime status

```txt
GET http://localhost:6767/api/system/runtime-config
```

The route uses the existing authentication middleware and returns redacted
metadata only. It never returns `DATABASE_URL`, `DIRECT_URL`, passwords,
application secrets, API keys, bearer tokens, or cookies.

## Local development

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Before running migrations, set `DATABASE_URL` in `backend/.env` to a dedicated
PostgreSQL database reachable at `localhost`. The example file intentionally
contains placeholders and is not a production credential.

Direct development health endpoint:

```txt
http://localhost:8000/health
```

## Tests

```bash
cd backend
npm test
```

Integration tests require a dedicated PostgreSQL test database. Never use
production credentials or production data.
