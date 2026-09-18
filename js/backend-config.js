(() => {
  const DEFAULTS = {
    appVersion: '0.10.7.11',
    protocolVersion: '1.0.0',
    enabled: false,
    baseUrl: '',
    endpoints: {
      health: '/v1/health',
      natalReport: '/v1/reports/natal',
      synastryReport: '/v1/reports/synastry'
    },
    request: {
      timeoutMs: 15000,
      retries: 2,
      retryBaseMs: 650
    },
    cache: {
      payloadLimit: 5,
      outboxLimit: 20
    },
    features: {
      aiReports: false,
      cloudSync: false,
      barkProxy: false
    }
  };

  function isObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  function merge(base, override) {
    const out = {...base};
    Object.entries(override || {}).forEach(([key, value]) => {
      if (isObject(value) && isObject(base[key])) out[key] = merge(base[key], value);
      else if (value !== undefined) out[key] = value;
    });
    return out;
  }

  function deepFreeze(value) {
    if (!isObject(value) && !Array.isArray(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function normalizeBaseUrl(url) {
    return String(url || '').trim().replace(/\/+$/, '');
  }

  // Optional deployment-time override. Keep secrets OUT of this object because
  // everything in GitHub Pages is public to the browser.
  const override = window.STELLAR_DIARY_BACKEND_CONFIG || {};
  const config = merge(DEFAULTS, override);
  config.baseUrl = normalizeBaseUrl(config.baseUrl);
  config.enabled = Boolean(config.enabled && config.baseUrl);

  function endpoint(name) {
    const path = config.endpoints?.[name];
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    if (!config.baseUrl) return path;
    return `${config.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  function isConfigured() {
    return Boolean(config.enabled && config.baseUrl);
  }

  function publicSnapshot() {
    return {
      appVersion: config.appVersion,
      protocolVersion: config.protocolVersion,
      enabled: config.enabled,
      baseUrl: config.baseUrl,
      endpoints: {...config.endpoints},
      request: {...config.request},
      cache: {...config.cache},
      features: {...config.features}
    };
  }

  window.XingchenBackendConfig = deepFreeze({
    ...config,
    endpoint,
    isConfigured,
    publicSnapshot
  });
})();
