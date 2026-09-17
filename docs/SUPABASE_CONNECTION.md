# V0.10.7.2.2 — Supabase Connection

## Purpose
This version adds the browser-side Supabase connection layer only. It does **not** sync user records yet and does **not** write data automatically.

## Project
- Project URL: `https://zbiiasduaypykhwvuxye.supabase.co`
- Browser SDK: `@supabase/supabase-js@2` via jsDelivr
- Public schema: `public`

## Files
- `js/supabase-config.js` — public browser configuration and key validation.
- `js/supabase-client.js` — singleton Supabase client + explicit connectivity test.
- `supabase-test.html` — development-only connection checker.

## Publishable Key
The dashboard screenshot provided for this build showed only a truncated publishable key, so the repository version intentionally leaves `publishableKey` blank.

For development, open `supabase-test.html`, paste the full `sb_publishable_...` key, and choose **保存到这台设备**. It is stored only in this browser under:

`stellar-diary-supabase-publishable-key-v1`

For production, put the full publishable key into the public configuration (or a deployment-time `window.STELLAR_DIARY_SUPABASE_CONFIG` override). Publishable keys are intended for browser use; RLS remains the real data boundary.

## Never put these in GitHub Pages
- `sb_secret_...`
- service role key
- database password
- Bark private secret

## Security boundary
V0.10.7.1 already enabled RLS and least-privilege table grants. V0.10.7.2.2 does not weaken those policies.

## Next
V0.10.7.4 will add Supabase Auth (email OTP / magic-link flow). Only after Auth exists will cloud data sync be enabled.
