(() => {
  const STORAGE_KEY = 'stellar-diary-supabase-publishable-key-v1';

  // Public browser configuration only.
  // The publishable key is intentionally blank in this build because the
  // dashboard screenshot only exposed a truncated value. A publishable key is
  // safe for browser use, but NEVER put sb_secret_ / service_role / DB password
  // in this file or anywhere in GitHub Pages.
  const DEFAULTS = {
    appVersion: '0.10.7.4',
    projectUrl: 'https://zbiiasduaypykhwvuxye.supabase.co',
    publishableKey: '',
    schema: 'public',
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  };

  function safeReadLocalKey() {
    try {
      const value = String(localStorage.getItem(STORAGE_KEY) || '').trim();
      return value.startsWith('sb_publishable_') ? value : '';
    } catch (_) {
      return '';
    }
  }

  function normalizeUrl(value) {
    return String(value || '').trim().replace(/\/+$/, '');
  }

  function isPublishableKey(value) {
    return /^sb_publishable_[A-Za-z0-9._-]+$/.test(String(value || '').trim());
  }

  function looksLikeSecret(value) {
    const key = String(value || '').trim().toLowerCase();
    return key.startsWith('sb_secret_') || key.includes('service_role');
  }

  const override = window.STELLAR_DIARY_SUPABASE_CONFIG || {};
  const projectUrl = normalizeUrl(override.projectUrl || DEFAULTS.projectUrl);
  const configuredKey = String(override.publishableKey || DEFAULTS.publishableKey || '').trim();
  const localKey = safeReadLocalKey();
  const publishableKey = isPublishableKey(configuredKey) ? configuredKey : localKey;

  function isConfigured() {
    return Boolean(/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(projectUrl) && isPublishableKey(publishableKey));
  }

  function publicSnapshot() {
    return {
      appVersion: DEFAULTS.appVersion,
      projectUrl,
      schema: override.schema || DEFAULTS.schema,
      configured: isConfigured(),
      keySource: isPublishableKey(configuredKey) ? 'file' : (localKey ? 'localStorage' : 'missing'),
      keyPrefix: publishableKey ? `${publishableKey.slice(0, 18)}…` : ''
    };
  }

  window.XingchenSupabaseConfig = Object.freeze({
    appVersion: DEFAULTS.appVersion,
    projectUrl,
    publishableKey,
    schema: override.schema || DEFAULTS.schema,
    auth: Object.freeze({...(override.auth || DEFAULTS.auth)}),
    storageKey: STORAGE_KEY,
    isConfigured,
    isPublishableKey,
    looksLikeSecret,
    publicSnapshot
  });
})();
