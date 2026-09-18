// Stellar Diary public Supabase browser configuration.
//
// IMPORTANT:
// - `sb_publishable_...` keys are intentionally public browser keys.
// - NEVER put `sb_secret_...`, service_role, database passwords, Gmail app
//   passwords, Bark secrets, or any other server-side secret in this file.
//
// Public browser configuration is enabled for production deployment.
window.STELLAR_DIARY_SUPABASE_CONFIG = {
  projectUrl: 'https://zbiiasduaypykhwvuxye.supabase.co',
  publishableKey: 'sb_publishable_nKj9QPPKTVfsBsSoSwHVVw_yC_8i6Tu',
  schema: 'public',
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
};
