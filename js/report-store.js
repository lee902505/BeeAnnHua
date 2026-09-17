(() => {
  const FALLBACK_KEYS = {
    natal:'xingchen-report-payload-natal-v1',
    synastry:'xingchen-report-payload-synastry-v1',
    outbox:'xingchen-api-outbox-v1'
  };

  function keyFor(type) {
    const keys = window.XingchenRecords?.KEYS || {};
    if (type === 'synastry') return keys.reportPayloadSynastry || FALLBACK_KEYS.synastry;
    return keys.reportPayloadNatal || FALLBACK_KEYS.natal;
  }

  function limit() {
    return Math.max(1, Number(window.XingchenBackendConfig?.cache?.payloadLimit) || 5);
  }

  function read(key, fallback) {
    if (window.XingchenRecords?.read) return window.XingchenRecords.read(key, fallback);
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
    catch { return fallback; }
  }

  function write(key, value) {
    if (window.XingchenRecords?.write) return window.XingchenRecords.write(key, value);
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  }

  function savePayload(type, payload) {
    if (!payload?.meta?.fingerprint) return false;
    const key = keyFor(type);
    const current = read(key, []);
    const list = Array.isArray(current) ? current : [];
    const record = {
      id:payload.meta.fingerprint,
      savedAt:new Date().toISOString(),
      schema:payload.schema,
      schemaVersion:payload.schemaVersion,
      payload
    };
    const next = [record, ...list.filter(item => item?.id !== record.id)].slice(0,limit());
    return write(key, next);
  }

  function latest(type) {
    const list = read(keyFor(type), []);
    return Array.isArray(list) && list.length ? list[0] : null;
  }

  function find(type, fingerprint) {
    const list = read(keyFor(type), []);
    return Array.isArray(list) ? list.find(item => item?.id === fingerprint) || null : null;
  }

  function clear(type) {
    if (window.XingchenRecords?.remove) return window.XingchenRecords.remove(keyFor(type));
    try { localStorage.removeItem(keyFor(type)); return true; } catch { return false; }
  }

  function queue(type, payload, reason='offline') {
    const key = window.XingchenRecords?.KEYS?.apiOutbox || FALLBACK_KEYS.outbox;
    const current = read(key, []);
    const list = Array.isArray(current) ? current : [];
    const id = `${type}:${payload?.meta?.fingerprint || Date.now()}`;
    const item = {id,type,queuedAt:new Date().toISOString(),attempts:0,reason,payload};
    const max = Math.max(1, Number(window.XingchenBackendConfig?.cache?.outboxLimit) || 20);
    const next = [item, ...list.filter(x => x?.id !== id)].slice(0,max);
    write(key,next);
    return item;
  }

  function outbox() {
    const key = window.XingchenRecords?.KEYS?.apiOutbox || FALLBACK_KEYS.outbox;
    const list = read(key, []);
    return Array.isArray(list) ? list : [];
  }

  window.XingchenReportStore = {savePayload, latest, find, clear, queue, outbox};
})();
