# Redis (optional speed layer)

Redis is **optional but recommended** for faster self-hosted deployments.
**PostgreSQL remains the source of truth.** Redis only caches hot drawings,
listing metadata, and save-coordination state. If Redis is disabled or
unavailable, ExcaliDash transparently falls back to PostgreSQL.

## What Redis is used for

| Concern | With Redis | Without Redis (fallback) |
| --- | --- | --- |
| Hot drawing reads (`GET /drawings/:id`) | Served from cache after auth | Read from PostgreSQL |
| Dashboard listings / collections | Cached per user (L2, shared across replicas) | In-process cache + PostgreSQL |
| Concurrent saves of the same drawing | Advisory lock + snapshot coalescing | Optimistic version lock only |
| Save coordination state | `payloadHash`, `saveAt`, `snapshotAt` kept in Redis | Computed from PostgreSQL each save |

Redis **never** stores secrets, and never stores a value larger than
`REDIS_MAX_VALUE_BYTES` (large image-heavy drawings simply skip the cache).

## Enabling Redis

The docker-compose quickstart already ships a `redis` service and enables it by
default. To run without Redis, set `REDIS_ENABLED=false`.

```env
REDIS_ENABLED=true
REDIS_URL=redis://redis:6379
REDIS_PREFIX=excalidash:
REDIS_CACHE_TTL_SECONDS=300
REDIS_DRAWING_CACHE_TTL_SECONDS=600
REDIS_METADATA_CACHE_TTL_SECONDS=300
REDIS_SAVE_LOCK_TTL_SECONDS=30
REDIS_SAVE_QUEUE_ENABLED=true
REDIS_MAX_VALUE_BYTES=10485760
```

The bundled compose service:

```yaml
redis:
  image: redis:7-alpine
  restart: unless-stopped
  command: ["redis-server", "--appendonly", "yes"]
  volumes:
    - redis_data:/data
```

## Behavior and guarantees

- **Disabled (`REDIS_ENABLED=false`)** — no client is created; pure PostgreSQL.
- **Enabled + reachable** — caching and save coordination are active.
- **Enabled + unreachable** — a single warning is logged
  (`[redis] unavailable, using PostgreSQL only`) and every request falls back to
  PostgreSQL. The app never crashes because Redis is down.
- **Cache invalidation** — a drawing save/delete/permission change invalidates the
  drawing cache (`DEL`) and bumps a per-user listing generation counter (O(1)),
  so stale listings are never served.

## Architecture

```
Client ── REST ──> Backend ──> PostgreSQL  (source of truth)
                      │
                      └──> Redis           (optional cache + save coordination)
```

All Redis access goes through a single cache service
(`backend/src/cache/cacheService.ts`); routes and the MCP server never issue raw
Redis commands. Key layout (prefix defaults to `excalidash:`):

```
excalidash:drawing:{drawingId}:current        cached raw drawing row
excalidash:drawing:{drawingId}:save-lock       advisory save lock
excalidash:drawing:{drawingId}:save-state       light save coordination state
excalidash:user:{userId}:drawings:list:{gen}:{queryHash}   cached listing
excalidash:user:{userId}:collections:list       cached collections metadata
```

## No object storage

ExcaliDash is self-hosted by design. It does **not** use S3, R2, MinIO, or any
external object storage. PostgreSQL holds drawing data; Redis is only a cache.
An optional local (on-volume) file store for large images is scaffolded behind
`LOCAL_FILE_STORAGE_ENABLED` / `LOCAL_FILE_STORAGE_DIR` and is **off by default**
(see [backend.md](./backend.md)).

## Troubleshooting

- `redis://redis:6379` is the in-compose hostname. Outside compose, point
  `REDIS_URL` at your Redis instance.
- Set `REDIS_DEBUG=true` to log cache hit/miss and save-lock events at debug level
  (no payload content is ever logged).
