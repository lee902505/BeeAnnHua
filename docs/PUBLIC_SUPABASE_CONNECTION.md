# V0.10.7.10 — Public Supabase Connection

Goal: every new phone/browser should automatically connect to Stellar Diary's
Supabase project without visiting `supabase-test.html` to paste a Publishable Key.

## Public browser config

Edit only:

`js/supabase-public-config.js`

Replace:

`js/supabase-public-config.js` now contains the project Publishable Key

using the public browser key from Supabase Dashboard → Connect. It is already configured in this build.

A Supabase Publishable Key is designed for browser/mobile public clients. It is
not a secret. Data access is protected by Supabase Auth + RLS.

## Never put these in GitHub Pages

- `sb_secret_...`
- service_role key
- database password
- Gmail App Password / SMTP password
- Bark secret

## Behavior

When the public Publishable Key is present:

1. Any new device can initialize `supabase-js`.
2. If there is no saved session, `signInAnonymously()` creates a temporary cloud identity.
3. `profiles` is created by the existing database trigger.
4. Existing local-first Cloud Sync can merge user data.
5. Users may later bind an email from the Cloud Account Center.

The previous localStorage key remains only as a development fallback.
