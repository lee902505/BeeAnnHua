(() => {
  const PROFILE_STORAGE_KEY = 'xingchen-player-profile-v1';
  const LANGUAGE_STORAGE_KEY = 'xingchen-language';

  let phase = 'idle';
  let currentUser = null;
  let lastError = null;
  let initPromise = null;
  let authSubscription = null;
  let lastProfileSyncAt = null;

  function client() {
    return window.XingchenSupabase?.getClient?.() || null;
  }

  function configReady() {
    return Boolean(window.XingchenSupabaseConfig?.isConfigured?.());
  }

  function readLocalProfile() {
    try {
      const value = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || 'null');
      if (!value || typeof value !== 'object') return null;
      const name = String(value.name || '').trim();
      const gender = String(value.gender || '');
      if (!name || !['male', 'female'].includes(gender)) return null;
      return {name, gender};
    } catch (_) {
      return null;
    }
  }

  function currentLocale() {
    try {
      const value = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      return ['zh-CN', 'zh-TW', 'en'].includes(value) ? value : 'zh-CN';
    } catch (_) {
      return 'zh-CN';
    }
  }

  function currentTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Taipei';
    } catch (_) {
      return 'Asia/Taipei';
    }
  }


  function restoreGuardActive(user = currentUser) {
    try {
      const pending = JSON.parse(localStorage.getItem('stellar-diary-account-restore-pending-v1') || 'null');
      if (!pending || pending.mode !== 'existing-login' || pending.choice || !pending.fromUserId || !user?.id) return false;
      return pending.fromUserId !== user.id;
    } catch (_) { return false; }
  }

  function isAnonymousUser(user) {
    if (!user) return false;
    if (user.is_anonymous === true) return true;
    if (user.app_metadata?.provider === 'anonymous') return true;
    if (Array.isArray(user.identities) && user.identities.length === 0 && !user.email && !user.phone) return true;
    return false;
  }

  function friendlyError(error) {
    const raw = String(error?.message || error || '').trim();
    if (!raw) return '';
    if (/anonymous.*disabled|anonymous sign-?ins? are disabled/i.test(raw)) {
      return 'Supabase 尚未开启 Anonymous Sign-Ins。';
    }
    if (/invalid api key|api key.*invalid/i.test(raw)) {
      return 'Supabase Publishable Key 无效。';
    }
    if (/manual.*link|identity.*link.*disabled|linking.*disabled/i.test(raw)) {
      return 'Supabase 尚未开启 Allow manual linking。';
    }
    if (/failed to fetch|network/i.test(raw)) {
      return '无法连接 Supabase，请检查网络或 Project URL。';
    }
    return raw;
  }

  function snapshot() {
    return {
      phase,
      configured: configReady(),
      signedIn: Boolean(currentUser?.id),
      isAnonymous: isAnonymousUser(currentUser),
      userId: currentUser?.id || '',
      email: currentUser?.email || '',
      lastProfileSyncAt,
      error: lastError ? friendlyError(lastError) : ''
    };
  }

  function emit() {
    const detail = snapshot();
    try {
      window.dispatchEvent(new CustomEvent('stellar:auth-state', {detail}));
    } catch (_) {}
    return detail;
  }

  function setState(nextPhase, user = currentUser, error = null) {
    phase = nextPhase;
    currentUser = user || null;
    lastError = error || null;
    return emit();
  }

  async function syncProfile(force = false) {
    const instance = client();
    if (!instance || !currentUser?.id) {
      return {ok: false, skipped: 'not-signed-in', error: new Error('尚未建立云端身份。')};
    }

    if (restoreGuardActive(currentUser)) {
      return {ok:true, skipped:'restore-pending'};
    }

    const local = readLocalProfile();
    if (!local) {
      return {ok: true, skipped: 'no-local-profile'};
    }

    if (!force && lastProfileSyncAt) {
      const age = Date.now() - new Date(lastProfileSyncAt).getTime();
      if (Number.isFinite(age) && age < 15_000) {
        return {ok: true, skipped: 'recently-synced'};
      }
    }

    const payload = {
      display_name: local.name,
      sex: local.gender,
      locale: currentLocale(),
      timezone: currentTimezone()
    };

    try {
      const {data, error} = await instance
        .from('profiles')
        .update(payload)
        .eq('id', currentUser.id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data?.id) {
        throw new Error('profiles 记录尚未建立，请确认 Auth trigger 已启用。');
      }

      lastProfileSyncAt = new Date().toISOString();
      emit();
      return {ok: true, data, syncedAt: lastProfileSyncAt};
    } catch (error) {
      return {ok: false, error};
    }
  }

  async function createAnonymous(instance) {
    setState('creating-anonymous', null, null);
    try {
      const {data, error} = await instance.auth.signInAnonymously();
      if (error) throw error;
      const user = data?.user || data?.session?.user || null;
      if (!user?.id) throw new Error('Anonymous Auth 未返回有效 user UUID。');
      setState('ready', user, null);
      await syncProfile(false);
      return snapshot();
    } catch (error) {
      return setState('error', null, error);
    }
  }

  async function refresh() {
    if (!configReady()) {
      return setState('local-only', null, null);
    }

    const instance = client();
    if (!instance) {
      return setState('error', null, new Error('Supabase client 尚未就绪。'));
    }

    setState('restoring', currentUser, null);

    try {
      const {data, error} = await instance.auth.getSession();
      if (error) throw error;

      const user = data?.session?.user || null;
      if (user?.id) {
        setState('ready', user, null);
        await syncProfile(false);
        return snapshot();
      }

      return await createAnonymous(instance);
    } catch (error) {
      return setState('error', null, error);
    }
  }

  async function refreshUser() {
    const instance = client();
    if (!instance) return setState('error', currentUser, new Error('Supabase client 尚未就绪。'));
    try {
      const {data, error} = await instance.auth.getUser();
      if (error) throw error;
      const user = data?.user || null;
      if (user?.id) {
        setState('ready', user, null);
        await syncProfile(false);
        return snapshot();
      }
      return setState('signed-out', null, null);
    } catch (error) {
      return setState('error', currentUser, error);
    }
  }

  function bindAuthListener(instance) {
    if (authSubscription) return;
    try {
      const result = instance.auth.onAuthStateChange((event, session) => {
        const user = session?.user || null;
        if (user?.id) {
          setState('ready', user, null);
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
            setTimeout(() => syncProfile(false), 0);
          }
          return;
        }

        if (event === 'SIGNED_OUT') {
          setState('signed-out', null, null);
        }
      });
      authSubscription = result?.data?.subscription || null;
    } catch (_) {}
  }

  async function init() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      if (!configReady()) {
        return setState('local-only', null, null);
      }

      const instance = client();
      if (!instance) {
        return setState('error', null, new Error('Supabase client 尚未就绪。'));
      }

      bindAuthListener(instance);
      return refresh();
    })();

    return initPromise;
  }

  function status() {
    return snapshot();
  }

  window.XingchenAuth = Object.freeze({
    init,
    refresh,
    refreshUser,
    syncProfile,
    status,
    getUser: () => currentUser,
    isAnonymous: () => isAnonymousUser(currentUser)
  });

  window.addEventListener('stellar:player-profile-saved', () => {
    if (currentUser?.id) syncProfile(true);
  });

  // Start quietly. If the public key is not configured on this browser, the
  // site remains fully usable in local-only mode.
  setTimeout(init, 0);
})();
