# V0.10.7.13 — Account Binding

## Goal

Upgrade the current anonymous Supabase user into a recoverable email-linked account without changing the user's UUID.

## Flow

1. Site creates / restores an anonymous Supabase session.
2. User opens `account.html`.
3. User enters any normal email address (QQ Mail, Foxmail, 163, 126, Outlook, iCloud, Gmail, etc.).
4. `supabase.auth.updateUser({ email })` starts the email-linking flow.
5. User confirms through the email link, or enters a 8-digit OTP if the configured email template exposes `{{ .Token }}`.
6. After confirmation, `is_anonymous` becomes false while the same Auth user UUID is retained.
7. Cloud Sync continues to use the same `user_id`, so existing rows remain attached to the same account.

## Required Supabase dashboard settings

- Authentication → Sign In / Providers → **Allow manual linking: ON**
- Anonymous Sign-Ins: ON
- Email provider: ON
- Confirm email: ON
- URL Configuration:
  - Site URL: the deployed GitHub Pages site
  - Redirect URL: `.../account.html`

## Email delivery

The UI does not restrict email domains. For production delivery to QQ / 163 / 126 and other providers, configure a reliable Custom SMTP provider and test deliverability before launch.

## Not included yet

- Cross-device sign-in / recovery for an already-bound email account
- Google / Apple OAuth linking
- Password login
- Custom SMTP provisioning

Those belong to the next account-recovery phase.
