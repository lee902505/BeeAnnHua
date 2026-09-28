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


## V0.16 系统信箱 / GM

执行 `migrations/20260927_018_system_mail_gm.sql`，然后参阅 `../docs/SYSTEM_MAIL_GM.md`。

## V0.17.0.1 farm stability / traffic optimization

Run `migrations/20260928_024_farm_stability_traffic.sql` after migration 023.
It converts one-click friend watering / pest care into true batch writes, fixes care EXP leveling, hardens malformed JSON handling, marks all opened activity as seen, and adds deterministic pair locking for two-player farm mutations.

## V0.17.1 friend / task final pass

Run `migrations/20260928_025_farm_friend_task_final.sql` after migration 024.
It adds the UTC+8 daily social EXP pool (50 max), +2 EXP first-visit rewards, +5 EXP per successful friend-watering plot, cumulative friend-care statistics, and `get_friend_farm_v7`. Pest-help random rewards stay outside the social EXP cap.

## V0.17.2 daily quest 2.0

Run `migrations/20260928_026_farm_daily_quest_v2.sql` after migration 025.
It keeps the server-authoritative friend interaction helper aligned with the expanded V0.17.2 daily-state shape, including daily friend-water / pest-care counters used by the random quest pool. No new table is created; quest selection, mastery claims, the free reroll flag and train reset tickets remain inside the existing `farm_saves.state` JSON.

## V0.18.1 farm item IDs / wardrobe ownership

Run `migrations/20260928_027_farm_item_wardrobe.sql` after migration 026.
It registers `#4004` train reset tickets in the stable item catalog, reserves `#5001–#5004` outfit IDs, adds the `outfit` reward type, and stores permanent cosmetic ownership in `farm_saves.state.wardrobe.outfits`. Seasonal outfits remain mail-disabled until their male/female Sprite Sheets are released.

## V0.18.3 Mid-Autumn outfit

Run `migrations/20260928_028_mid_autumn_outfit.sql` after migration 027.
It enables the already-reserved `#5002 outfit.mid_autumn` item for GM/system-mail delivery now that both male and female Sprite Sheets are shipped. Claiming the attachment unlocks permanent wardrobe ownership and does not auto-equip the outfit.

## V0.19.0 seasonal decorations

After migration 029, run `migrations/20260928_030_seasonal_decorations.sql` once.
It adds Item IDs 6001–6012 (6008 reserved), the `decoration` mail reward kind, GM test delivery, and friend-farm visibility for seasonal decorations.
