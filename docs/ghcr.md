# GitHub Container Registry

`.github/workflows/ghcr.yml` builds and pushes backend and frontend images to
one GHCR package:

```txt
ghcr.io/gabedsam01/excalidash-v2
```

The workflow runs on pushes to `main`, Git tags matching `v*`, and manual
dispatch. It uses Buildx for `linux/amd64` and `linux/arm64`, logs in with
`GITHUB_TOKEN`, and uses the GitHub Actions BuildKit cache.

## Tags

On `main`:

```txt
backend-latest
backend-main
frontend-latest
frontend-main
```

Every workflow run:

```txt
backend-sha-<12-character-short-sha>
frontend-sha-<12-character-short-sha>
```

On a Git tag such as `v1.2.3`:

```txt
backend-v1.2.3
frontend-v1.2.3
```

Images do not exist merely because the workflow file is present. The first
successful workflow run must build and push them.

## Package visibility

After the first publish, configure the package as public in the repository or
organization package settings if anonymous `docker compose pull` access is
required. Private packages require a GHCR login with package read permission.

## Pin a version

Set matching tags in `.env`:

```env
EXCALIDASH_BACKEND_TAG=backend-v1.2.3
EXCALIDASH_FRONTEND_TAG=frontend-v1.2.3
```

Then:

```bash
docker compose pull
docker compose up -d
```

## Pin an exact commit build

Use the matching SHA tags produced by the same workflow run:

```env
EXCALIDASH_BACKEND_TAG=backend-sha-0123456789ab
EXCALIDASH_FRONTEND_TAG=frontend-sha-0123456789ab
```

Do not mix backend and frontend tags from unrelated commits unless that
combination has been tested.
