(() => {
  const PENDING_EMAIL_KEY = 'stellar-diary-pending-bind-email-v1';
  const PENDING_MODE_KEY = 'stellar-diary-pending-bind-mode-v1';

  function auth() { return window.XingchenAuth || null; }
  function client() { return window.XingchenSupabase?.getClient?.() || null; }

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function validEmail(value) {
    const email = normalizeEmail(value);
    if (!email || email.length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function readPendingEmail() {
    try { return normalizeEmail(localStorage.getItem(PENDING_EMAIL_KEY) || ''); }
    catch (_) { return ''; }
  }

  function savePendingEmail(email) {
    try {
      if (email) localStorage.setItem(PENDING_EMAIL_KEY, normalizeEmail(email));
      else localStorage.removeItem(PENDING_EMAIL_KEY);
    } catch (_) {}
  }

  function readPendingMode() {
    try {
      const value = localStorage.getItem(PENDING_MODE_KEY);
      return value === 'change' ? 'change' : value === 'bind' ? 'bind' : '';
    } catch (_) { return ''; }
  }

  function savePendingMode(mode) {
    try {
      if (mode === 'bind' || mode === 'change') localStorage.setItem(PENDING_MODE_KEY, mode);
      else localStorage.removeItem(PENDING_MODE_KEY);
    } catch (_) {}
  }

  function redirectUrl() {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('binding', 'confirmed');
    return url.toString();
  }

  function friendly(error) {
    const raw = String(error?.message || error || '').trim();
    if (!raw) return '未知错误。';
    if (/manual.*link|identity.*link.*disabled|linking.*disabled/i.test(raw)) {
      return 'Supabase 尚未开启 Allow manual linking。请先到 Authentication → Sign In / Providers 开启。';
    }
    if (/already.*registered|already.*exists|email.*taken|user.*exists/i.test(raw)) {
      return '这个邮箱已经属于另一个账号。当前版本不会自动覆盖；后续跨设备登录会使用已有账号登录流程。';
    }
    if (/rate limit|too many requests|email.*rate/i.test(raw)) {
      return '邮件发送过于频繁，请稍后再试。';
    }
    if (/invalid.*email/i.test(raw)) {
      return '邮箱格式不正确。';
    }
    if (/token.*expired|otp.*expired|expired/i.test(raw)) {
      return '验证码已经过期，请重新发送绑定邮件。';
    }
    if (/token.*invalid|invalid.*token|otp.*invalid/i.test(raw)) {
      return '验证码不正确，请检查后再试。';
    }
    if (/failed to fetch|network/i.test(raw)) {
      return '无法连接 Supabase，请检查网络。';
    }
    return raw;
  }

  async function start(email) {
    const normalized = normalizeEmail(email);
    if (!validEmail(normalized)) return {ok:false, error:'请输入有效邮箱地址。'};

    const a = auth();
    const state = a?.status?.() || {};
    if (!state.signedIn) return {ok:false, error:'尚未建立云端身份。'};
    if (state.email && normalizeEmail(state.email) === normalized) {
      return {ok:false, error:'这个邮箱已经是当前账号的绑定邮箱。'};
    }

    const sb = client();
    if (!sb) return {ok:false, error:'Supabase client 尚未就绪。'};

    try {
      const result = await sb.auth.updateUser(
        {email: normalized},
        {emailRedirectTo: redirectUrl()}
      );
      if (result.error) throw result.error;
      savePendingEmail(normalized);
      savePendingMode(state.isAnonymous ? 'bind' : 'change');
      await a.refreshUser?.();
      return {ok:true, email:normalized, mode:readPendingMode(), data:result.data};
    } catch (error) {
      return {ok:false, error:friendly(error), raw:error};
    }
  }

  async function verify(email, token) {
    const normalized = normalizeEmail(email || readPendingEmail());
    const code = String(token || '').replace(/\s+/g, '');
    if (!validEmail(normalized)) return {ok:false, error:'找不到待绑定邮箱，请重新发送绑定邮件。'};
    if (!/^\d{8}$/.test(code)) return {ok:false, error:'请输入邮件中的 8 位验证码。'};

    const sb = client();
    if (!sb) return {ok:false, error:'Supabase client 尚未就绪。'};

    try {
      const {data, error} = await sb.auth.verifyOtp({
        email: normalized,
        token: code,
        type: 'email_change'
      });
      if (error) throw error;
      const mode = readPendingMode();
      savePendingEmail('');
      savePendingMode('');
      await auth()?.refreshUser?.();
      return {ok:true, mode, data, user:data?.user || auth()?.getUser?.() || null};
    } catch (error) {
      return {ok:false, error:friendly(error), raw:error};
    }
  }

  async function resend(email) {
    const normalized = normalizeEmail(email || readPendingEmail());
    if (!validEmail(normalized)) return {ok:false, error:'请先输入有效邮箱地址。'};

    const sb = client();
    if (!sb) return {ok:false, error:'Supabase client 尚未就绪。'};

    try {
      const {error} = await sb.auth.resend({
        type: 'email_change',
        email: normalized,
        options: {emailRedirectTo: redirectUrl()}
      });
      if (error) throw error;
      savePendingEmail(normalized);
      return {ok:true, email:normalized};
    } catch (error) {
      return {ok:false, error:friendly(error), raw:error};
    }
  }

  window.XingchenAccountBinding = Object.freeze({
    start,
    verify,
    resend,
    validEmail,
    normalizeEmail,
    readPendingEmail,
    readPendingMode,
    clearPending: () => { savePendingEmail(''); savePendingMode(''); },
    redirectUrl
  });
})();
