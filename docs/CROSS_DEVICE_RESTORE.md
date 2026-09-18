# V0.10.7.13 — Cross-device Login & Restore

## User flow

1. New device opens Stellar Diary and receives a temporary anonymous UUID.
2. User opens Cloud Account → **已有账号？登录 / 恢复**.
3. Enter the previously linked email. `signInWithOtp(..., shouldCreateUser:false)` sends the branded login email.
4. User can either click the email button or enter the 8-digit `{{ .Token }}` code.
5. After the original member session is restored, automatic Cloud Sync remains guarded.
6. The page compares:
   - guest-local counts on the current device, and
   - cloud counts owned by the original member UUID.
7. User explicitly chooses:
   - **Use original cloud data** (recommended), or
   - **Merge guest data from this device**.
8. Restore guard / pending login state is cleared only after the selected restore operation completes.

## Safety

- Existing-email login uses `shouldCreateUser:false`; mistyped emails do not create a new permanent account.
- RLS continues to scope all cloud queries to `auth.uid() = user_id`.
- Guest data is never silently merged into a restored member account.
- Browser code contains only the public `sb_publishable_...` key. Never add `sb_secret_...`, service_role, database passwords or SMTP app passwords to the repository.
