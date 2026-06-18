# Security & Redaction

Diagrams are shared, exported, embedded, and logged. They must never carry live
secrets. Redaction is mandatory and applies before anything leaves memory.

## Secret Types to Redact
Detect and redact any of the following, in any field (node label, note, edge label,
metadata, prompt echo, error message):
- **JWT secret** — signing keys / `JWT_SECRET` values.
- **API keys** — generic `*_API_KEY`, `sk-...`, `pk_...`, etc.
- **Provider keys** — cloud/vendor credentials (AWS access/secret keys, GCP, Azure, OpenAI, Anthropic, Stripe, etc.).
- **service-role** — Supabase/service-role keys and other elevated-privilege tokens.
- **database URLs** — connection strings with embedded credentials (`postgres://user:<password>@host/db`).
- **tokens** — OAuth access/refresh tokens, session tokens, personal access tokens.
- **bearer values** — anything after `Bearer ` in auth headers.
- **webhook secrets** — signing secrets for inbound/outbound webhooks.
- **proxy secrets** — proxy auth credentials, tunnel tokens.

When uncertain whether a string is a secret (high-entropy, key-like prefix, credential
context), treat it as a secret and redact.

## Replacement Format
Replace the secret value with a typed placeholder:

```
[REDACTED_SECRET_TYPE]
```

where `SECRET_TYPE` names the kind, e.g.:
- `[REDACTED_JWT_SECRET]`
- `[REDACTED_API_KEY]`
- `[REDACTED_PROVIDER_KEY]`
- `[REDACTED_SERVICE_ROLE]`
- `[REDACTED_DATABASE_URL]`
- `[REDACTED_TOKEN]`
- `[REDACTED_BEARER]`
- `[REDACTED_WEBHOOK_SECRET]`
- `[REDACTED_PROXY_SECRET]`

Keep the surrounding structure so the diagram still communicates intent
(e.g. `postgres://app:[REDACTED_DATABASE_URL]@db/main` becomes
`postgres://app:[REDACTED_DATABASE_URL]@db/main` — show the shape, not the secret).
Show the *concept* of a credential (an "API key" label, a key icon) rather than the value.

## Hard Rules — Never Put Raw Secrets In:
- **drawings** — no secret in any element label, note, or shape text.
- **exports** — PNG/SVG/JSON exports must contain only redacted placeholders.
- **responses** — never echo a detected secret back to the user.
- **logs** — redact before any log/telemetry write; logs are not exempt.
- **snapshots** — saved scene snapshots/checkpoints store redacted values only.

## Operating Procedure
1. **Scan on input** — when a secret could appear in user-provided content, scan before
   it enters the scene model.
2. **Redact in place** — replace with the typed placeholder; keep type for context.
3. **Re-scan on output** — before export, response, log, or snapshot, scan the
   serialized form once more as a backstop.
4. **Fail closed** — if a secret would otherwise be emitted, redact it; never emit on
   uncertainty.
