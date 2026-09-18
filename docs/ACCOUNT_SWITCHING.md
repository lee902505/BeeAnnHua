# V0.10.7.11 Account Switching

Formal members can sign out from the Cloud Account Center.

Safety behavior:

1. Run a full cloud sync first.
2. If sync is not fully successful, do not sign out.
3. Sign out with Supabase `scope: local`, so other devices stay signed in.
4. Clear account-scoped local copies on this device.
5. Create a fresh anonymous guest identity.
6. Open the existing-account login panel so another member can sign in.

This prevents one member's local records from being automatically uploaded into a different guest/member identity on the same device.
