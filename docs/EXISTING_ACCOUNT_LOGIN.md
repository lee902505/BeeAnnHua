# V0.10.7.13 Existing Account Login & Restore

This release adds existing-account login for a device that currently has a temporary anonymous Supabase identity.

Flow:

1. New device automatically receives an anonymous UUID.
2. User opens Cloud Account Center and chooses “已有账号？登录 / 恢复”.
3. `signInWithOtp({ shouldCreateUser: false })` sends a Stellar Diary email.
4. User may click the email link or enter the OTP.
5. Supabase switches the session to the existing permanent member UUID.
6. Automatic cloud sync is paused before guest-local data can be uploaded to the member account.
7. User chooses:
   - Use original cloud data (recommended), or
   - Merge this device's guest data.
8. Normal cloud sync resumes after the choice is completed.

The temporary device's local data is never silently merged into the existing member account before the user chooses.
