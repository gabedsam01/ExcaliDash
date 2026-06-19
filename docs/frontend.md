# Frontend

The frontend is a React/Vite application in `frontend/src`. API access is
centralized in `frontend/src/api/index.ts`. Production routing is defined by
`frontend/nginx.conf.template`.

## Production container

The container listens on port `80`. `BACKEND_URL` must use `host:port` format;
the quickstart sets it to `backend:8000`.

Nginx proxies:

- `/api` to the backend API;
- `/socket.io` to live collaboration;
- `/mcp` to the authenticated MCP transport.

The quickstart publishes the frontend at:

```txt
http://localhost:6767
```

## Internationalization (i18n)

The interface ships in English (default) and Brazilian Portuguese via `i18next` +
`react-i18next`. A language button on the login, dashboard (sidebar), and
settings screens switches language; the choice is persisted to `localStorage`
(key `excalidash-ui-lang`). This is separate from the Excalidraw canvas language.
Catalogs live in `frontend/src/i18n/locales/{en,pt-BR}.json`. See
[i18n.md](i18n.md).

## Local development

Start the backend, then:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open:

```txt
http://localhost:6767
```

## Tests

```bash
cd frontend
npm test
```
