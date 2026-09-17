(() => {
  let client = null;
  let initError = null;

  function config() {
    return window.XingchenSupabaseConfig || null;
  }

  function sdkAvailable() {
    return Boolean(window.supabase && typeof window.supabase.createClient === 'function');
  }

  function init() {
    if (client) return client;
    const cfg = config();

    if (!cfg) {
      initError = new Error('Supabase config is not loaded.');
      return null;
    }
    if (!cfg.isConfigured()) {
      initError = new Error('Supabase publishable key is not configured.');
      return null;
    }
    if (!sdkAvailable()) {
      initError = new Error('Supabase browser SDK is not available.');
      return null;
    }

    try {
      client = window.supabase.createClient(cfg.projectUrl, cfg.publishableKey, {
        db: {schema: cfg.schema || 'public'},
        auth: {
          persistSession: cfg.auth?.persistSession !== false,
          autoRefreshToken: cfg.auth?.autoRefreshToken !== false,
          detectSessionInUrl: cfg.auth?.detectSessionInUrl !== false,
          storageKey: 'stellar-diary-supabase-auth-v1'
        }
      });
      initError = null;
      window.dispatchEvent(new CustomEvent('stellar:supabase-ready'));
      return client;
    } catch (error) {
      initError = error instanceof Error ? error : new Error(String(error));
      client = null;
      return null;
    }
  }

  async function testConnection() {
    const cfg = config();
    const startedAt = performance.now();

    if (!cfg) {
      return {ok: false, stage: 'config', message: 'Supabase config is not loaded.'};
    }
    if (!cfg.isConfigured()) {
      return {ok: false, stage: 'config', message: 'Publishable key is missing.'};
    }

    const instance = init();
    if (!instance) {
      return {ok: false, stage: 'sdk', message: initError?.message || 'Unable to initialize Supabase client.'};
    }

    // PostgREST root is a lightweight way to verify URL + publishable key.
    // No user data is read or written in this test.
    try {
      const response = await fetch(`${cfg.projectUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: cfg.publishableKey,
          Authorization: `Bearer ${cfg.publishableKey}`,
          Accept: 'application/openapi+json, application/json'
        },
        cache: 'no-store'
      });

      const elapsedMs = Math.max(0, Math.round(performance.now() - startedAt));
      let bodyText = '';
      try { bodyText = await response.text(); } catch (_) {}
      const invalidKey = /invalid api key|invalid.*key|api key.*invalid/i.test(bodyText);

      if (invalidKey) {
        return {ok: false, stage: 'apikey', status: response.status, elapsedMs, message: 'Publishable key was rejected by Supabase.'};
      }

      // With least-privilege Data API settings, the API root may return 200,
      // 401 or 403 depending on PostgREST exposure. A non-invalid-key response
      // still proves the project is reachable and the key was understood.
      if (response.ok || response.status === 401 || response.status === 403) {
        return {
          ok: true,
          stage: 'connected',
          status: response.status,
          elapsedMs,
          message: response.ok ? 'Supabase connection is ready.' : 'Supabase is reachable; Data API is protected as expected.'
        };
      }

      return {ok: false, stage: 'http', status: response.status, elapsedMs, message: `Unexpected Supabase response (${response.status}).`};
    } catch (error) {
      return {
        ok: false,
        stage: 'network',
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  function status() {
    const cfg = config();
    return {
      configured: Boolean(cfg?.isConfigured()),
      sdkAvailable: sdkAvailable(),
      initialized: Boolean(client),
      initError: initError?.message || '',
      config: cfg?.publicSnapshot?.() || null
    };
  }

  window.XingchenSupabase = Object.freeze({
    init,
    getClient: () => client || init(),
    testConnection,
    status
  });

  // Initialize quietly when configuration is complete. No database request is
  // made here; network testing remains explicit.
  if (config()?.isConfigured() && sdkAvailable()) init();
})();
