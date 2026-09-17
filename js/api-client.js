(() => {
  class XingchenApiError extends Error {
    constructor(message, {code='API_ERROR', status=0, requestId='', retryable=false, cause=null}={}) {
      super(message);
      this.name = 'XingchenApiError';
      this.code = code;
      this.status = status;
      this.requestId = requestId;
      this.retryable = retryable;
      this.cause = cause || undefined;
    }
  }

  const cfg = () => window.XingchenBackendConfig;

  function createRequestId(prefix='req') {
    if (window.crypto?.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
    const random = Math.random().toString(36).slice(2, 12);
    return `${prefix}_${Date.now().toString(36)}_${random}`;
  }

  function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }

  async function hashPayload(value) {
    const text = stableStringify(value);
    if (window.crypto?.subtle && typeof TextEncoder !== 'undefined') {
      const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(digest)).map(v => v.toString(16).padStart(2,'0')).join('');
    }
    // Deterministic fallback for older browsers. Not cryptographic, but suitable
    // for local cache identity when SubtleCrypto is unavailable.
    let h1 = 0x811c9dc5;
    for (let i=0; i<text.length; i++) {
      h1 ^= text.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
    }
    return `fnv1a_${(h1 >>> 0).toString(16).padStart(8,'0')}`;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function retryableStatus(status) {
    return status === 408 || status === 425 || status === 429 || status >= 500;
  }

  function urlFor(pathOrEndpoint) {
    const config = cfg();
    if (!pathOrEndpoint) return '';
    if (/^https?:\/\//i.test(pathOrEndpoint)) return pathOrEndpoint;
    if (!config?.baseUrl) return pathOrEndpoint;
    return `${config.baseUrl}${pathOrEndpoint.startsWith('/') ? '' : '/'}${pathOrEndpoint}`;
  }

  async function readResponse(response) {
    const type = response.headers.get('content-type') || '';
    if (type.includes('application/json')) {
      try { return await response.json(); } catch { return null; }
    }
    const text = await response.text();
    return text ? {message:text} : null;
  }

  async function request(pathOrEndpoint, options={}) {
    const config = cfg();
    if (!config?.isConfigured?.()) {
      throw new XingchenApiError('Backend API is not configured.', {code:'API_NOT_CONFIGURED'});
    }

    const method = String(options.method || 'GET').toUpperCase();
    const timeoutMs = Number(options.timeoutMs ?? config.request.timeoutMs) || 15000;
    const retries = Math.max(0, Number(options.retries ?? config.request.retries) || 0);
    const retryBaseMs = Math.max(100, Number(config.request.retryBaseMs) || 650);
    const requestId = options.requestId || createRequestId('api');
    const url = urlFor(pathOrEndpoint);
    let lastError = null;

    for (let attempt=0; attempt<=retries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort('timeout'), timeoutMs);
      const external = options.signal;
      const abortExternal = () => controller.abort(external?.reason || 'aborted');
      if (external) {
        if (external.aborted) abortExternal();
        else external.addEventListener('abort', abortExternal, {once:true});
      }

      try {
        const headers = {
          'Accept':'application/json',
          'X-Stellar-Request-Id':requestId,
          'X-Stellar-App-Version':config.appVersion,
          'X-Stellar-Protocol-Version':config.protocolVersion,
          ...(options.headers || {})
        };
        let body = options.body;
        if (body != null && typeof body !== 'string' && !(body instanceof FormData)) {
          headers['Content-Type'] = headers['Content-Type'] || 'application/json';
          body = JSON.stringify(body);
        }
        if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

        const response = await fetch(url, {
          method,
          headers,
          body,
          signal:controller.signal,
          credentials:options.credentials || 'omit',
          cache:'no-store'
        });
        const data = await readResponse(response);
        if (!response.ok) {
          const retryable = retryableStatus(response.status);
          const message = data?.message || data?.error || `HTTP ${response.status}`;
          throw new XingchenApiError(message, {
            code:'HTTP_ERROR', status:response.status, requestId, retryable
          });
        }
        return {requestId, status:response.status, data};
      } catch (error) {
        const aborted = controller.signal.aborted;
        const apiError = error instanceof XingchenApiError
          ? error
          : new XingchenApiError(
              aborted ? 'Request timed out or was aborted.' : (error?.message || 'Network request failed.'),
              {
                code:aborted ? 'REQUEST_ABORTED' : 'NETWORK_ERROR',
                requestId,
                retryable:!aborted,
                cause:error
              }
            );
        lastError = apiError;
        const canRetry = attempt < retries && apiError.retryable && !external?.aborted;
        if (!canRetry) throw apiError;
        const jitter = Math.floor(Math.random()*180);
        await sleep(retryBaseMs * Math.pow(2,attempt) + jitter);
      } finally {
        clearTimeout(timeout);
        if (external) external.removeEventListener('abort', abortExternal);
      }
    }
    throw lastError || new XingchenApiError('Request failed.');
  }

  function health() {
    return request(cfg()?.endpoint?.('health') || '/v1/health', {retries:0});
  }

  async function createReport(type, payload, options={}) {
    const endpointName = type === 'synastry' ? 'synastryReport' : 'natalReport';
    const fingerprint = payload?.meta?.fingerprint || await hashPayload(payload);
    return request(cfg()?.endpoint?.(endpointName), {
      method:'POST',
      body:payload,
      idempotencyKey:`${type}:${fingerprint}`,
      ...options
    });
  }

  window.XingchenApi = {
    Error:XingchenApiError,
    createRequestId,
    stableStringify,
    hashPayload,
    request,
    health,
    createReport,
    isConfigured:() => Boolean(cfg()?.isConfigured?.())
  };
})();
