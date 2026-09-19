(() => {
  // The device key is kept in the Supabase Edge Function's secret store.
  const MAX_BODY_BYTES = 2800;
  const FUNCTION_NAME = 'bark-push';

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

  async function send({title, subtitle='', body='', group='星辰日记'} = {}) {
    const client = window.XingchenSupabase?.getClient?.();
    if (!client) return {ok:false, skipped:true, reason:'cloud-unavailable'};

    try {
      await window.XingchenAuth?.init?.();
      const {data: {session} = {}, error: sessionError} = await client.auth.getSession();
      if (sessionError || !session?.access_token) {
        return {ok:false, skipped:true, reason:'cloud-session-unavailable'};
      }

      const {data, error} = await client.functions.invoke(FUNCTION_NAME, {
        body: {
          title: String(title || '星辰日记'),
          subtitle: String(subtitle || window.XingchenPlayer?.label?.() || ''),
          body: truncateUtf8(body),
          group: String(group || '星辰日记')
        }
      });
      if (error || data?.ok !== true) {
        console.warn('[星辰日记 Bark] 推播未送出。');
        return {ok:false, error:error || new Error('push-unavailable')};
      }
      return {ok:true};
    } catch (error) {
      console.warn('[星辰日记 Bark] 推播未送出。');
      return {ok:false,error};
    }
  }

  window.XingchenBark = {send, maxBodyBytes:MAX_BODY_BYTES};
})();
