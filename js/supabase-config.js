(() => {
  const STORAGE_KEY = 'stellar-diary-supabase-publishable-key-v1';

  // Public browser configuration only. V0.10.7.10 prefers the checked-in
  // js/supabase-public-config.js so every new phone/browser can connect without
  // manually pasting a key. localStorage remains as a developer fallback.
  // NEVER put sb_secret_ / service_role / DB password in public frontend files.
  const DEFAULTS = {
    appVersion: '0.10.7.10',
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
      keySource: isPublishableKey(configuredKey) ? 'public-file' : (localKey ? 'localStorage' : 'missing'),
      publicFileReady: isPublishableKey(configuredKey),
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
