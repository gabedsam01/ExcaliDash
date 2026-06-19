#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"

PUBLIC_PATHS="README.md docs docker-compose.yml .env.example quickstart.sh backend/.env.example .github/workflows/ghcr.yml"
FORBIDDEN_ENV_PATTERN="$(printf '%s%s' 'mvp' 'builders')|31[.]97|147[.]15|$(printf '%s%s' 'lel' '98')"

if rg -n -e "$FORBIDDEN_ENV_PATTERN" $PUBLIC_PATHS; then
    echo "Forbidden environment-specific value found" >&2
    exit 1
fi

if rg -n -e 'http://localhost:(3000|5173)' $PUBLIC_PATHS; then
    echo "Outdated public application port found" >&2
    exit 1
fi

if rg -n -e 'image:[[:space:]]+gabedsam01/excalidash-v2' $PUBLIC_PATHS; then
    echo "Docker Hub image reference found; GHCR is required" >&2
    exit 1
fi

if rg -n -e '^(POSTGRES_PASSWORD|JWT_SECRET|CSRF_SECRET|API_KEY_SECRET)=[0-9A-Fa-f]{64,}$' \
    .env.example backend/.env.example; then
    echo "Hard-coded secret found in an environment example" >&2
    exit 1
fi

echo "quickstart security checks passed"
