# Stellar Diary Backend Foundation — V0.10.7.2

This release prepares the frontend/backend boundary for future AI reports and cloud storage without changing the current user interface.

## 1. Principle

The browser remains the deterministic astrology calculator.

The future backend must **not** receive only a birthday and ask an AI model to calculate the chart. Instead, the frontend computes the astronomical chart first and sends a normalized structured payload containing planets, signs, degrees, houses, aspects, chart ruler/pattern analysis and uncertainty metadata.

AI is intended to synthesize interpretation text, not to replace the astronomical calculation engine.

## 2. New modules

- `js/backend-config.js` — public runtime backend configuration. No secrets.
- `js/api-client.js` — request IDs, timeout, retry, idempotency and payload hashing.
- `js/report-payload.js` — normalizes natal/synastry calculations into report schema v1.
- `js/report-store.js` — local payload cache and future offline outbox.
- `data/backend/report-input-schema.json` — transport JSON schema.
- `data/backend/backend-config.example.json` — deployment configuration example.

## 3. Local cache

After a successful natal calculation, the latest report-ready payloads are stored under:

- `xingchen-report-payload-natal-v1`

After a successful synastry calculation:

- `xingchen-report-payload-synastry-v1`

Up to 5 unique payloads are retained by default. Identity is based on a deterministic SHA-256 fingerprint when Web Crypto is available.

The existing local input/history keys are unchanged.

## 4. Runtime API configuration

The backend is intentionally disabled by default in V0.10.7.2. Before loading `backend-config.js`, a deployment can provide a public runtime object:

```html
<script>
window.STELLAR_DIARY_BACKEND_CONFIG = {
  enabled: true,
  baseUrl: 'https://api.example.com',
  features: { aiReports: true }
};
</script>
```

Do **not** place AI provider keys, Supabase service-role keys, Bark secrets, passwords or other private credentials here. GitHub Pages code is public to every visitor.

## 5. Planned API contract

### Health

`GET /v1/health`

### Natal report

`POST /v1/reports/natal`

Body: `stellar-diary.report-input` schema, `reportType = natal`.

### Synastry report

`POST /v1/reports/synastry`

Body: same schema, `reportType = synastry`.

Requests include:

- `X-Stellar-Request-Id`
- `X-Stellar-App-Version`
- `X-Stellar-Protocol-Version`
- `Idempotency-Key` for report creation

## 6. Retry policy

The API client retries only network errors and retryable HTTP statuses (408, 425, 429, 5xx). Client errors are not retried automatically.

Default values:

- timeout: 15 s
- retries: 2
- exponential delay with small jitter

## 7. Privacy and security

Report payloads can contain birth date/time, city coordinates, names and relationship labels. They must be treated as personal data by any future backend.

Recommended public architecture:

GitHub Pages → Cloudflare Worker / trusted Edge API → AI provider / Bark / Supabase

Provider secrets live only in Worker/Edge environment variables.

## 8. Next release

V0.11 can add a visible “Generate Full Stellar Report” action using the already prepared payload and `XingchenApi.createReport()`.
