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
