(() => {
  const PENDING_LOGIN_KEY = 'stellar-diary-pending-login-v1';
  const RESTORE_PENDING_KEY = 'stellar-diary-account-restore-pending-v1';
  const GUEST_BACKUP_KEY = 'stellar-diary-guest-local-backup-v1';
  const DATA_KEYS = [
    'xingchen-player-profile-v1',
    'xingchen-report-payload-natal-v1',
    'xingchen-report-payload-synastry-v1',
    'xingchen-fortune-history',
    'xingchen-tarot-history-v1',
    'xingchen-farm-v1',
    'xingchen-farm-v1-sync-meta',
    'xingchen-farm-v1-pending-ops'
  ];

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

  function readJson(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (_) { return fallback; }
  }

  function writeJson(key, value) {
    try {
      if (value == null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) { return false; }
  }

  function countLocal() {
    const natal = readJson('xingchen-report-payload-natal-v1', []);
    const synastry = readJson('xingchen-report-payload-synastry-v1', []);
    const fortune = readJson('xingchen-fortune-history', {});
    const tarot = readJson('xingchen-tarot-history-v1', []);
    return {
      natal: Array.isArray(natal) ? natal.length : 0,
      synastry: Array.isArray(synastry) ? synastry.length : 0,
      fortune: fortune && typeof fortune === 'object' && !Array.isArray(fortune) ? Object.keys(fortune).length : 0,
      tarot: Array.isArray(tarot) ? tarot.length : 0
    };
  }

  async function countCloud(userId) {
    const sb = client();
    if (!sb || !userId) return {fortune:0, tarot:0, natal:0, synastry:0, ready:false};

    const tables = [
      ['fortune', 'fortune_history'],
      ['tarot', 'tarot_history'],
      ['natal', 'natal_charts'],
      ['synastry', 'synastry_reports']
    ];

    const out = {fortune:0, tarot:0, natal:0, synastry:0, ready:true};
    const results = await Promise.all(tables.map(async ([key, table]) => {
      try {
        const {count, error} = await sb
          .from(table)
          .select('id', {count:'exact', head:true})
          .eq('user_id', userId);
        if (error) throw error;
        return [key, Number(count || 0), null];
      } catch (error) {
        return [key, 0, error];
      }
    }));

    const errors = [];
    results.forEach(([key, count, error]) => {
      out[key] = count;
      if (error) errors.push(String(error?.message || error));
    });
    if (errors.length) {
      out.ready = false;
      out.error = errors[0];
    }
    return out;
  }

  async function hydrateRemoteCounts(user) {
    const pending = readRestorePending() || readPendingLogin();
    if (!pending || !user?.id || (pending.fromUserId && pending.fromUserId === user.id)) return null;
    const remoteCounts = await countCloud(user.id);
    const latest = readRestorePending() || pending;
    const next = {
      ...latest,
      toUserId: user.id,
      toEmail: user.email || latest.email || '',
      cloudCounts: remoteCounts,
      cloudCountsAt: new Date().toISOString()
    };
    saveRestorePending(next);
    savePendingLogin({...next});
    try { window.dispatchEvent(new CustomEvent('stellar:account-restore-pending',{detail:next})); } catch (_) {}
    return next;
  }

  function backupGuestLocal(fromUserId) {
    const values = {};
    DATA_KEYS.forEach(key => {
      try { values[key] = localStorage.getItem(key); } catch (_) { values[key] = null; }
    });
    writeJson(GUEST_BACKUP_KEY, {
      version: '0.11.0',
      createdAt: new Date().toISOString(),
      fromUserId: fromUserId || '',
      counts: countLocal(),
      values
    });
  }

  function readPendingLogin() {
    return readJson(PENDING_LOGIN_KEY, null);
  }

  function savePendingLogin(value) {
    writeJson(PENDING_LOGIN_KEY, value || null);
  }

  function readRestorePending() {
    return readJson(RESTORE_PENDING_KEY, null);
  }

  function saveRestorePending(value) {
    writeJson(RESTORE_PENDING_KEY, value || null);
  }

  function redirectUrl() {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('login', 'confirmed');
    return url.toString();
  }

  function friendly(error) {
    const raw = String(error?.message || error || '').trim();
    if (!raw) return '未知错误。';
    if (/signups?.*disabled|user not found|no user/i.test(raw)) {
      return '找不到这个已绑定账号，请确认邮箱是否正确。';
    }
    if (/rate limit|too many requests|email.*rate/i.test(raw)) {
      return '邮件发送过于频繁，请稍后再试。';
    }
    if (/invalid.*email/i.test(raw)) return '邮箱格式不正确。';
    if (/token.*expired|otp.*expired|expired/i.test(raw)) return '验证码已经过期，请重新发送登录邮件。';
    if (/token.*invalid|invalid.*token|otp.*invalid/i.test(raw)) return '验证码不正确，请检查后再试。';
    if (/failed to fetch|network/i.test(raw)) return '无法连接 Supabase，请检查网络。';
    return raw;
  }

  function beginPending(email, fromUserId) {
    const pending = {
      version: '0.11.0',
      mode: 'existing-login',
      email: normalizeEmail(email),
      fromUserId: fromUserId || '',
      startedAt: new Date().toISOString(),
      localCounts: countLocal(),
      stage: 'email-sent'
    };
    savePendingLogin(pending);
    saveRestorePending({...pending});
    backupGuestLocal(fromUserId);
    return pending;
  }

  async function start(email) {
    const normalized = normalizeEmail(email);
    if (!validEmail(normalized)) return {ok:false, error:'请输入有效邮箱地址。'};

    const state = auth()?.status?.() || {};
    if (!state.signedIn) return {ok:false, error:'尚未建立云端身份。'};
    if (!state.isAnonymous) return {ok:false, error:'当前已经是正式会员，无需重复登录。'};

    const sb = client();
    if (!sb) return {ok:false, error:'Supabase client 尚未就绪。'};

    const pending = beginPending(normalized, state.userId);
    try {
      const {data, error} = await sb.auth.signInWithOtp({
        email: normalized,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: redirectUrl()
        }
      });
      if (error) throw error;
      return {ok:true, email:normalized, pending, data};
    } catch (error) {
      savePendingLogin(null);
      saveRestorePending(null);
      return {ok:false, error:friendly(error), raw:error};
    }
  }

  async function resend(email) {
    const pending = readPendingLogin();
    const normalized = normalizeEmail(email || pending?.email);
    if (!validEmail(normalized)) return {ok:false, error:'请输入有效邮箱地址。'};
    const sb = client();
    if (!sb) return {ok:false, error:'Supabase client 尚未就绪。'};
    try {
      const {data, error} = await sb.auth.signInWithOtp({
        email: normalized,
        options: {shouldCreateUser:false, emailRedirectTo:redirectUrl()}
      });
      if (error) throw error;
      const next = {...(pending || {}), email:normalized, startedAt:new Date().toISOString(), stage:'email-sent'};
      savePendingLogin(next);
      saveRestorePending({...next});
      return {ok:true, email:normalized, data};
    } catch (error) {
      return {ok:false, error:friendly(error), raw:error};
    }
  }

  function markAuthenticated(user) {
    const pending = readRestorePending() || readPendingLogin();
    if (!pending || !user?.id) return null;
    if (pending.fromUserId && pending.fromUserId === user.id) return null;
    const next = {
      ...pending,
      toUserId: user.id,
      toEmail: user.email || pending.email || '',
      authenticatedAt: new Date().toISOString(),
      stage: 'restore-choice'
    };
    saveRestorePending(next);
    savePendingLogin({...next});
    try { window.dispatchEvent(new CustomEvent('stellar:account-restore-pending',{detail:next})); } catch (_) {}
    setTimeout(() => hydrateRemoteCounts(user).catch(() => {}), 0);
    return next;
  }

  async function verify(email, token) {
    const pending = readPendingLogin();
    const normalized = normalizeEmail(email || pending?.email);
    const code = String(token || '').replace(/\D+/g, '');
    if (!validEmail(normalized)) return {ok:false, error:'找不到待登录邮箱，请重新发送登录邮件。'};
    if (!/^\d{8}$/.test(code)) return {ok:false, error:'请输入邮件中的 8 位验证码。'};

    const sb = client();
    if (!sb) return {ok:false, error:'Supabase client 尚未就绪。'};
    try {
      const {data, error} = await sb.auth.verifyOtp({email:normalized, token:code, type:'email'});
      if (error) throw error;
      const user = data?.user || data?.session?.user || null;
      if (!user?.id) throw new Error('登录成功但未取得账号资料。');
      markAuthenticated(user);
      await auth()?.refreshUser?.();
      return {ok:true, user, data, restore:readRestorePending()};
    } catch (error) {
      return {ok:false, error:friendly(error), raw:error};
    }
  }

  async function checkLinkResult() {
    await auth()?.refreshUser?.();
    const state = auth()?.status?.() || {};
    const pending = readRestorePending() || readPendingLogin();
    if (state.signedIn && !state.isAnonymous && pending?.fromUserId && pending.fromUserId !== state.userId) {
      const restore = markAuthenticated(auth()?.getUser?.());
      return {ok:true, state, restore};
    }
    return {ok:false, state, error:'尚未检测到登录完成。请确认已经点击邮件中的登录按钮，或改用验证码。'};
  }

  async function finishRestore(choice) {
    const pending = readRestorePending();
    if (!pending) return {ok:false, error:'没有等待处理的跨设备登录。'};
    if (choice !== 'cloud' && choice !== 'merge') return {ok:false, error:'请选择资料处理方式。'};

    try {
      saveRestorePending({...pending, choice, stage:'restoring'});
      let result;
      if (choice === 'cloud') {
        result = await window.XingchenCloudSync?.restoreFromCloud?.('existing-account-login');
      } else {
        result = await window.XingchenCloudSync?.syncAll?.('restore-merge');
      }
      if (!result || result.phase === 'partial' || result.phase === 'offline' || result.error) {
        const msg = result?.error || '资料恢复未完成，请检查网络后重试。';
        return {ok:false, error:String(msg), result};
      }
      saveRestorePending(null);
      savePendingLogin(null);
      try { localStorage.removeItem(GUEST_BACKUP_KEY); } catch (_) {}
      try { window.dispatchEvent(new CustomEvent('stellar:account-restore-complete',{detail:{choice,result}})); } catch (_) {}
      return {ok:true, choice, result};
    } catch (error) {
      return {ok:false, error:friendly(error), raw:error};
    }
  }

  function clearPending() {
    savePendingLogin(null);
    saveRestorePending(null);
  }

  window.XingchenAccountLogin = Object.freeze({
    start,
    resend,
    verify,
    checkLinkResult,
    finishRestore,
    markAuthenticated,
    validEmail,
    normalizeEmail,
    readPendingLogin,
    readRestorePending,
    countCloud,
    hydrateRemoteCounts,
    clearPending,
    redirectUrl
  });
})();
