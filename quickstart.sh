#!/bin/sh
set -eu

BASE_URL="${EXCALIDASH_QUICKSTART_BASE_URL:-https://raw.githubusercontent.com/gabedsam01/excalidash-v2/main}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" 2>/dev/null && pwd || pwd)
ASSUME_YES=false
START_CONTAINERS=false
SHOW_SUMMARY=false

usage() {
    cat <<'EOF'
Usage: quickstart.sh [--yes] [--up] [--summary|--print]

  --yes      Accept safe placeholder replacements without prompting.
  --up       Run docker compose up -d after preparing the files.
  --summary  Show the redacted configuration summary.
  --print    Alias for --summary; secret values are never printed.
EOF
}

while [ "$#" -gt 0 ]; do
    case "$1" in
        --yes)
            ASSUME_YES=true
            ;;
        --up)
            START_CONTAINERS=true
            ;;
        --summary|--print)
            SHOW_SUMMARY=true
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 2
            ;;
    esac
    shift
done

echo "ExcaliDash V2 quickstart"

download_file() {
    source_url="$1"
    destination="$2"
    if ! command -v curl >/dev/null 2>&1; then
        echo "curl is required to download ${source_url}" >&2
        exit 1
    fi
    curl -fsSL "$source_url" -o "$destination"
}

if [ -f docker-compose.yml ]; then
    echo "docker-compose.yml already exists; left unchanged"
else
    download_file "${BASE_URL}/docker-compose.yml" docker-compose.yml
    echo "Created docker-compose.yml"
fi

env_created=false
if [ -f .env ]; then
    echo "Using existing .env"
else
    if [ -f "${SCRIPT_DIR}/.env.example" ]; then
        cp "${SCRIPT_DIR}/.env.example" .env
    elif [ -f .env.example ]; then
        cp .env.example .env
    else
        temporary_example=".env.example.quickstart.$$"
        trap 'rm -f "$temporary_example"' EXIT HUP INT TERM
        download_file "${BASE_URL}/.env.example" "$temporary_example"
        cp "$temporary_example" .env
        rm -f "$temporary_example"
        trap - EXIT HUP INT TERM
    fi
    chmod 600 .env
    env_created=true
    echo "Created .env"
fi

read_env_value() {
    key="$1"
    sed -n "s/^${key}=//p" .env | tail -n 1
}

is_placeholder() {
    normalized=$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]')
    case "$normalized" in
        ""|change_me|change-me|change_me_*|change-me-*|generate_with_quickstart|generate_with_*)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

write_env_value() {
    key="$1"
    value="$2"
    temporary_file=".env.quickstart.$$"
    awk -v key="$key" -v value="$value" '
        BEGIN { found = 0 }
        index($0, key "=") == 1 {
            print key "=" value
            found = 1
            next
        }
        { print }
        END {
            if (!found) print key "=" value
        }
    ' .env > "$temporary_file"
    chmod 600 "$temporary_file"
    mv "$temporary_file" .env
}

generate_secret() {
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -hex 64
        return
    fi

    if [ -r /dev/urandom ] && command -v od >/dev/null 2>&1; then
        od -An -N64 -tx1 /dev/urandom | tr -d ' \n'
        return
    fi

    echo "Unable to generate a secure secret: install openssl or provide /dev/urandom and od." >&2
    exit 1
}

fingerprint() {
    value="$1"
    if command -v openssl >/dev/null 2>&1; then
        digest=$(printf '%s' "$value" | openssl dgst -sha256 | sed 's/^.*= //')
    elif command -v sha256sum >/dev/null 2>&1; then
        digest=$(printf '%s' "$value" | sha256sum | awk '{print $1}')
    else
        echo "sha256:unavailable"
        return
    fi
    printf 'sha256:%s\n' "$(printf '%s' "$digest" | cut -c1-12)"
}

needs_confirmation=false
if [ "$env_created" = false ] && [ "$ASSUME_YES" = false ]; then
    for key in POSTGRES_PASSWORD JWT_SECRET CSRF_SECRET API_KEY_SECRET; do
        if is_placeholder "$(read_env_value "$key")"; then
            needs_confirmation=true
            break
        fi
    done
fi

if [ "$needs_confirmation" = true ] && [ -t 0 ]; then
    printf 'Replace only insecure placeholder secrets in the existing .env? [y/N] '
    read -r answer
    case "$answer" in
        y|Y|yes|YES)
            ;;
        *)
            echo "No changes made to .env"
            exit 1
            ;;
    esac
fi

for key in POSTGRES_PASSWORD JWT_SECRET CSRF_SECRET API_KEY_SECRET; do
    current_value=$(read_env_value "$key")
    if is_placeholder "$current_value"; then
        generated_value=$(generate_secret)
        if [ "${#generated_value}" -ne 128 ]; then
            echo "Generated ${key} has an unexpected length" >&2
            exit 1
        fi
        write_env_value "$key" "$generated_value"
        echo "Generated 512-bit ${key} -> saved in .env"
        echo "${key} fingerprint: $(fingerprint "$generated_value")"
    fi
done

chmod 600 .env

if [ "$SHOW_SUMMARY" = true ]; then
    echo
    echo "Configuration summary:"
    for key in POSTGRES_PASSWORD JWT_SECRET CSRF_SECRET API_KEY_SECRET; do
        value=$(read_env_value "$key")
        if is_placeholder "$value"; then
            echo "${key}: placeholder"
        else
            echo "${key}: defined ($(fingerprint "$value"))"
        fi
    done
fi

echo
echo "Open after startup:"
echo "http://localhost:6767"
echo

if [ "$START_CONTAINERS" = true ]; then
    if ! command -v docker >/dev/null 2>&1; then
        echo "docker is required for --up" >&2
        exit 1
    fi
    echo "Starting:"
    echo "docker compose up -d"
    docker compose up -d
else
    echo "Start:"
    echo "docker compose up -d"
fi
