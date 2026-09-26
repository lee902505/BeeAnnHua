# Supabase

- `migrations/20260917_001_core_schema.sql` is the source-controlled snapshot of the V0.10.7.1 schema already applied in the Supabase dashboard.
- Do not commit database passwords, `sb_secret_...`, service-role keys, Bark secrets, or other private credentials.
- Browser configuration lives in `js/supabase-config.js` and accepts only a public `sb_publishable_...` key.
- Bark push delivery uses `functions/bark-push/index.ts` and the quota migration. See `docs/BARK_PUSH_DEPLOYMENT.md`; store `BARK_DEVICE_KEY` only in Edge Function Secrets.

## V0.13.25 multiplayer farm update

Run `migrations/20260926_011_farm_crop_sheet2_steal_activity.sql` after migration 010.
It changes new steals to a fixed ×1 per friend / plot / growth cycle, keeps the owner's final item protected, and adds the owner-facing steal activity feed.

## V0.13.26 daily farm update

Run `migrations/20260926_012_farm_daily_tasks.sql` after migration 011.
It adds an authoritative UTC+8 farm-day RPC and `steal_friend_crop_v4`, which updates the thief's daily steal counter on the server while preserving the fixed ×1 steal rule.


## V0.13.27 farm care tools

Run `migrations/20260926_013_farm_care_tools.sql` after migration 012. It keeps server-side steal maturity checks aligned with watering (×0.92) and low / mid / high fertilizer (×0.90 / ×0.80 / ×0.70). Existing JSON farm saves remain compatible.

## V0.13.30 farm activity center

Run `migrations/20260926_014_farm_activity_center.sql` after migration 013. It creates a bounded unified activity feed for friend visits and crop steals, backfills existing steal history, logs real friend-farm visits with a 10-minute dedupe window, and adds `get_farm_activity_v1` / `get_friend_farm_v3`. Existing farm saves, friends, crops, titles and steal ledgers are preserved.
