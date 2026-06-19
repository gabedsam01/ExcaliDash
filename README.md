# ExcaliDash V2

ExcaliDash V2 is a self-hosted dashboard and organizer for Excalidraw drawings.
It provides collections, search, import/export, live collaboration, local or
OIDC authentication, API keys, curated libraries, and an MCP server for
AI-agent workflows.

## Credits

ExcaliDash V2 is an evolved fork of the original
[ExcaliDash](https://github.com/ZimengXiong/ExcaliDash) project by
ZimengXiong. This repository preserves the upstream attribution and license
while extending the project with PostgreSQL-only runtime storage, MCP tooling,
API keys, curated libraries, and deployment improvements.

## Database

PostgreSQL is required at runtime. SQLite was removed from the runtime and is
mentioned only for legacy migration context. PostgreSQL provides reliable
production persistence, consistent migrations, concurrent access, and
predictable deployments.

## Fast install with GHCR

The GHCR workflow in this repository publishes the required images after it
runs successfully on `main` or a `v*` tag. Once the packages are available:

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

The quickstart creates `.env`, generates 512-bit database/JWT/CSRF/API-key
secrets, and downloads the single user-facing `docker-compose.yml`. It does not
start containers unless invoked with `--up`.

Manual installation:

```bash
curl -fsSL https://raw.githubusercontent.com/gabedsam01/excalidash-v2/main/docker-compose.yml -o docker-compose.yml
curl -fsSL https://raw.githubusercontent.com/gabedsam01/excalidash-v2/main/.env.example -o .env
# Replace every generate_with_quickstart value before starting.
docker compose up -d
```

## MCP and API keys

Create a revocable API key in **Settings → MCP / API Keys**. The Compose MCP
endpoint is:

```txt
http://localhost:6767/mcp
```

Install the optional ExcaliDash V2 Agent Skills:

```bash
npx -y @gabedsam01/excalidash-v2-skills@latest --local --yes
```

## Documentation

- [Quickstart](docs/quickstart.md)
- [Deployment](docs/deployment.md)
- [GHCR images](docs/ghcr.md)
- [PostgreSQL](docs/postgres.md)
- [Backend](docs/backend.md)
- [Frontend](docs/frontend.md)
- [MCP](docs/mcp.md)
- [Agent Skills](docs/skills.md)

## Security

- Keep `.env` private and never commit generated credentials.
- The authenticated runtime-config endpoint returns only defined/source status
  and truncated SHA-256 fingerprints, never raw secrets or database URLs.
- Back up PostgreSQL and the `backend_data` volume before upgrades.
- Pin version or SHA image tags for reproducible production deployments.

## License

ExcaliDash V2 is distributed under AGPL-3.0 and preserves upstream
attribution. See [LICENSE](LICENSE).
