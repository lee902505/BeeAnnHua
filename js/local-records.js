(() => {
  const KEYS = Object.freeze({
    astrologyLastInput: 'xingchen-astrology-last-input-v1',
    tarotHistory: 'xingchen-tarot-history-v1',
    fortuneHistory: 'xingchen-fortune-history',
    reportPayloadNatal: 'xingchen-report-payload-natal-v1',
    reportPayloadSynastry: 'xingchen-report-payload-synastry-v1',
    apiOutbox: 'xingchen-api-outbox-v1'
  });

  function cloneFallback(value) {
    try { return JSON.parse(JSON.stringify(value)); }
    catch { return value; }
  }

  function read(key, fallback=null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return cloneFallback(fallback);
      return JSON.parse(raw);
    } catch (error) {
      console.warn('[星辰日记] 本机纪录读取失败：', key, error);
      return cloneFallback(fallback);
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      try { window.dispatchEvent(new CustomEvent('stellar:local-record-write',{detail:{key,value}})); } catch (_) {}
      return true;
    } catch (error) {
      console.warn('[星辰日记] 本机纪录写入失败：', key, error);
      return false;
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
      try { window.dispatchEvent(new CustomEvent('stellar:local-record-remove',{detail:{key}})); } catch (_) {}
      return true;
    } catch {
      return false;
    }
  }

  function pushCapped(key, item, limit=10) {
    const current = read(key, []);
    const list = Array.isArray(current) ? current : [];
    const filtered = item?.id
      ? list.filter(entry => entry?.id !== item.id)
      : list;
    const next = [item, ...filtered].slice(0, Math.max(1, Number(limit) || 10));
    write(key, next);
    return next;
  }

  window.XingchenRecords = {
    KEYS,
    read,
    write,
    remove,
    pushCapped
  };
})();