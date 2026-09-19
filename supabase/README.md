# Supabase

- `migrations/20260917_001_core_schema.sql` is the source-controlled snapshot of the V0.10.7.1 schema already applied in the Supabase dashboard.
- Do not commit database passwords, `sb_secret_...`, service-role keys, Bark secrets, or other private credentials.
- Browser configuration lives in `js/supabase-config.js` and accepts only a public `sb_publishable_...` key.
- Bark push delivery uses `functions/bark-push/index.ts` and the quota migration. See `docs/BARK_PUSH_DEPLOYMENT.md`; store `BARK_DEVICE_KEY` only in Edge Function Secrets.
