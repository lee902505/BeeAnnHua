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

    // IMPORTANT (new Supabase publishable keys):
    // sb_publishable_* is an opaque API key, not a user JWT. Do not send it as
    // `Authorization: Bearer ...` in this manual connectivity probe.
    //
    // We also avoid probing the exact `/rest/v1/` OpenAPI root. Instead we hit
    // a real table route using the documented browser `?apikey=` form. This is
    // a simple GET (no custom request headers / no CORS preflight). Because the
    // user is not signed in yet, our RLS/grants may correctly return 401/403;
    // that still proves the project + gateway + publishable key are reachable.
    try {
      const probeUrl = `${cfg.projectUrl}/rest/v1/profiles?select=id&limit=1&apikey=${encodeURIComponent(cfg.publishableKey)}`;
      const response = await fetch(probeUrl, {
        method: 'GET',
        headers: {Accept: 'application/json'},
        cache: 'no-store',
        credentials: 'omit'
      });

      const elapsedMs = Math.max(0, Math.round(performance.now() - startedAt));
      let bodyText = '';
      try { bodyText = await response.text(); } catch (_) {}

      const invalidKey = /invalid api key|invalid.*key|api key.*invalid|no api key/i.test(bodyText);
      if (invalidKey) {
        return {
          ok: false,
          stage: 'apikey',
          status: response.status,
          elapsedMs,
          message: 'Publishable key was rejected by Supabase.'
        };
      }

      // 200 means the endpoint is reachable and queryable. 401/403 are also an
      // expected success at this stage because anonymous users intentionally do
      // not have table access before Supabase Auth is connected.
      if (response.ok || response.status === 401 || response.status === 403) {
        return {
          ok: true,
          stage: 'connected',
          status: response.status,
          elapsedMs,
          message: response.ok
            ? 'Supabase connection is ready.'
            : 'Supabase connection is ready; anonymous table access is blocked as expected.'
        };
      }

      return {
        ok: false,
        stage: 'http',
        status: response.status,
        elapsedMs,
        message: `Unexpected Supabase response (${response.status}).`
      };
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
