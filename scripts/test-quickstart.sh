#!/bin/sh
set -eu

REPOSITORY_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TEMPORARY_ROOT=$(mktemp -d)
trap 'rm -rf "$TEMPORARY_ROOT"' EXIT HUP INT TERM

fail() {
    echo "quickstart test failed: $1" >&2
    exit 1
}

assert_hex_secret() {
    file="$1"
    key="$2"
    value=$(sed -n "s/^${key}=//p" "$file" | tail -n 1)
    [ "${#value}" -eq 128 ] || fail "${key} is not 128 characters"
    case "$value" in
        *[!0-9a-f]*)
            fail "${key} is not lowercase hexadecimal"
            ;;
    esac
}

case_one="${TEMPORARY_ROOT}/missing-env"
mkdir -p "$case_one"
cp "${REPOSITORY_ROOT}/quickstart.sh" "${REPOSITORY_ROOT}/.env.example" "${REPOSITORY_ROOT}/docker-compose.yml" "$case_one/"
(
    cd "$case_one"
    sh ./quickstart.sh --yes > quickstart.out
)

[ -f "${case_one}/.env" ] || fail ".env was not created"
for key in POSTGRES_PASSWORD JWT_SECRET CSRF_SECRET API_KEY_SECRET; do
    assert_hex_secret "${case_one}/.env" "$key"
done

case_two="${TEMPORARY_ROOT}/existing-env"
mkdir -p "$case_two"
cp "${REPOSITORY_ROOT}/quickstart.sh" "${REPOSITORY_ROOT}/docker-compose.yml" "$case_two/"
cat > "${case_two}/.env" <<'EOF'
HTTP_PORT=6767
POSTGRES_PASSWORD=keep_this_database_password
JWT_SECRET=preserve_existing_jwt_value
CSRF_SECRET=change_me
API_KEY_SECRET=generate_with_quickstart
EOF

(
    cd "$case_two"
    sh ./quickstart.sh --yes > quickstart.out
)

grep -qx 'POSTGRES_PASSWORD=keep_this_database_password' "${case_two}/.env" ||
    fail "existing POSTGRES_PASSWORD was overwritten"
grep -qx 'JWT_SECRET=preserve_existing_jwt_value' "${case_two}/.env" ||
    fail "existing JWT_SECRET was overwritten"
assert_hex_secret "${case_two}/.env" CSRF_SECRET
assert_hex_secret "${case_two}/.env" API_KEY_SECRET

if grep -q 'preserve_existing_jwt_value' "${case_two}/quickstart.out"; then
    fail "a complete secret was printed"
fi

echo "quickstart tests passed"
