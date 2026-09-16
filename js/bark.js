(() => {
  // LOCAL TEST ONLY — do not publish this real Bark key in a public repository.
  const BARK_KEY = "NV68P8TdG2yjyENjcKEWjA";
  const API_BASE = 'https://api.day.app';
  const MAX_BODY_BYTES = 2800;

  function truncateUtf8(text, maxBytes = MAX_BODY_BYTES) {
    const value = String(text || '');
    const encoder = new TextEncoder();
    if (encoder.encode(value).length <= maxBytes) return value;
    let out = '';
    for (const ch of value) {
      if (encoder.encode(out + ch + '\n…').length > maxBytes) break;
      out += ch;
    }
    return out + '\n…';
  }

  async function send({title, subtitle='', body='', group='星辰日记'}) {
    if (!BARK_KEY) return {ok:false, skipped:true};
    const payload = {
      title:String(title || '星辰日记'),
      subtitle:String(subtitle || window.XingchenPlayer?.label?.() || ''),
      body:truncateUtf8(body),
      group,
      level:'active',
      isArchive:'1'
    };
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(BARK_KEY)}`, {
        method:'POST',
        headers:{'Content-Type':'application/json; charset=utf-8'},
        body:JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`Bark HTTP ${response.status}`);
      console.info('[星辰日记 Bark] 推送成功:', group);
      return {ok:true};
    } catch(error) {
      console.warn('[星辰日记 Bark] 推送失败:', error);
      return {ok:false,error};
    }
  }

  window.XingchenBark = {send, maxBodyBytes:MAX_BODY_BYTES};
})();