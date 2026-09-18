(() => {
  const LANG_KEY = 'xingchen-language';
  const T = {
    'zh-CN': {
      eyebrow:'V0.10.7.6 · ACCOUNT BINDING', title:'绑定云端账号',
      lead:'把当前临时云端身份绑定到邮箱。原本的玩家资料、每日签、塔罗、星盘与合盘都会继续保留在同一个 UUID 下。',
      identity:'当前身份', temporary:'临时云端身份', bound:'正式云端账号', local:'本机模式', uuid:'User UUID', email:'绑定邮箱', none:'尚未绑定',
      support:'支持 QQ邮箱、Foxmail、163、126、Outlook、iCloud、Gmail 等常用邮箱，不限制邮箱域名。',
      emailLabel:'要绑定的邮箱', emailPlaceholder:'例如 123456@qq.com', send:'发送绑定邮件', resend:'重新发送',
      sent:'绑定邮件已发送。请打开邮件中的确认链接；如果邮件模板提供 6 位验证码，也可以直接在下方输入。',
      otpLabel:'6 位验证码（可选）', otpPlaceholder:'000000', verify:'验证并完成绑定',
      sync:'同步全部资料', back:'返回首页', testing:'处理中…',
      success:'邮箱绑定完成。当前 UUID 已升级为正式云端账号，原有资料不会迁移到新 UUID。',
      pending:'待确认邮箱', pendingHint:'如果没有收到邮件，请稍后重发。正式上线前建议配置 Custom SMTP，以提高 QQ / 163 / 126 等邮箱的投递稳定性。',
      boundHint:'这个账号已经绑定邮箱。下一阶段会加入“换设备登录／恢复账号”流程。',
      needAnon:'当前不是临时云端身份，无法使用匿名账号绑定流程。',
      manual:'测试前请在 Supabase Authentication 设置中开启 Allow manual linking。',
      noCloud:'尚未建立云端身份，请先返回首页等待匿名身份建立。'
    },
    'zh-TW': {
      eyebrow:'V0.10.7.6 · ACCOUNT BINDING', title:'綁定雲端帳號',
      lead:'把目前的臨時雲端身分綁定到信箱。原本的玩家資料、每日籤、塔羅、星盤與合盤都會繼續保留在同一個 UUID 下。',
      identity:'目前身分', temporary:'臨時雲端身分', bound:'正式雲端帳號', local:'本機模式', uuid:'User UUID', email:'綁定信箱', none:'尚未綁定',
      support:'支援 QQ信箱、Foxmail、163、126、Outlook、iCloud、Gmail 等常用信箱，不限制信箱網域。',
      emailLabel:'要綁定的信箱', emailPlaceholder:'例如 123456@qq.com', send:'傳送綁定郵件', resend:'重新傳送',
      sent:'綁定郵件已傳送。請開啟郵件中的確認連結；如果郵件範本提供 6 位驗證碼，也可以直接在下方輸入。',
      otpLabel:'6 位驗證碼（選填）', otpPlaceholder:'000000', verify:'驗證並完成綁定',
      sync:'同步全部資料', back:'返回首頁', testing:'處理中…',
      success:'信箱綁定完成。目前 UUID 已升級為正式雲端帳號，原有資料不會搬到新的 UUID。',
      pending:'待確認信箱', pendingHint:'如果沒有收到郵件，請稍後重傳。正式上線前建議設定 Custom SMTP，以提高 QQ / 163 / 126 等信箱的投遞穩定性。',
      boundHint:'這個帳號已經綁定信箱。下一階段會加入「換裝置登入／恢復帳號」流程。',
      needAnon:'目前不是臨時雲端身分，無法使用匿名帳號綁定流程。',
      manual:'測試前請在 Supabase Authentication 設定中開啟 Allow manual linking。',
      noCloud:'尚未建立雲端身分，請先返回首頁等待匿名身分建立。'
    },
    en: {
      eyebrow:'V0.10.7.6 · ACCOUNT BINDING', title:'Bind cloud account',
      lead:'Link the current temporary cloud identity to an email address. Existing profile, fortune, tarot, natal and synastry data stays under the same user UUID.',
      identity:'Current identity', temporary:'Temporary cloud identity', bound:'Bound cloud account', local:'Local-only mode', uuid:'User UUID', email:'Bound email', none:'Not bound yet',
      support:'Works with standard email providers including QQ Mail, Foxmail, 163, 126, Outlook, iCloud and Gmail. No domain allowlist is used.',
      emailLabel:'Email to bind', emailPlaceholder:'name@example.com', send:'Send binding email', resend:'Resend',
      sent:'Binding email sent. Open the confirmation link in the email. If your template includes a 6-digit code, you can enter it below instead.',
      otpLabel:'6-digit code (optional)', otpPlaceholder:'000000', verify:'Verify & finish binding',
      sync:'Sync all data', back:'Back home', testing:'Working…',
      success:'Email binding is complete. The current UUID is now a permanent cloud account and existing data remains under the same UUID.',
      pending:'Pending email', pendingHint:'If the email does not arrive, resend later. For production, configure Custom SMTP for better delivery reliability.',
      boundHint:'This account is already bound. Cross-device sign-in and recovery will be added in the next phase.',
      needAnon:'The current identity is not anonymous, so the anonymous-account binding flow does not apply.',
      manual:'Before testing, enable Allow manual linking in Supabase Authentication settings.',
      noCloud:'No cloud identity is available yet. Return home and let the anonymous identity initialize first.'
    }
  };

  function lang() {
    try {
      const v = localStorage.getItem(LANG_KEY);
      return T[v] ? v : 'zh-CN';
    } catch (_) { return 'zh-CN'; }
  }
  function t(k) { return T[lang()][k] || T['zh-CN'][k] || k; }
  function $(id) { return document.getElementById(id); }

  function applyText() {
    document.documentElement.lang = lang();
    $('eyebrow').textContent = t('eyebrow');
    $('title').textContent = t('title');
    $('lead').textContent = t('lead');
    $('identityLabel').textContent = t('identity');
    $('uuidLabel').textContent = t('uuid');
    $('emailStatusLabel').textContent = t('email');
    $('supportText').textContent = t('support');
    $('emailLabel').textContent = t('emailLabel');
    $('emailInput').placeholder = t('emailPlaceholder');
    $('sendBtn').textContent = t('send');
    $('resendBtn').textContent = t('resend');
    $('otpLabel').textContent = t('otpLabel');
    $('otpInput').placeholder = t('otpPlaceholder');
    $('verifyBtn').textContent = t('verify');
    $('syncBtn').textContent = t('sync');
    $('backBtn').textContent = t('back');
    $('manualNote').textContent = t('manual');
  }

  function setMessage(message, kind='') {
    const el = $('message');
    el.className = `account-message ${kind}`.trim();
    el.textContent = message || '';
    el.hidden = !message;
  }

  function setBusy(busy) {
    ['sendBtn','resendBtn','verifyBtn','syncBtn'].forEach(id => { const el=$(id); if (el) el.disabled=busy; });
  }

  function render(state = window.XingchenAuth?.status?.() || {}) {
    const pending = window.XingchenAccountBinding?.readPendingEmail?.() || '';
    $('uuidValue').textContent = state.userId || '—';
    $('emailValue').textContent = state.email || pending || t('none');

    if (!state.signedIn) {
      $('identityValue').textContent = state.phase === 'local-only' ? t('local') : t('noCloud');
      $('bindForm').hidden = true;
      $('boundBox').hidden = true;
      return;
    }

    if (state.isAnonymous) {
      $('identityValue').textContent = t('temporary');
      $('bindForm').hidden = false;
      $('boundBox').hidden = true;
      if (pending && !$('emailInput').value) $('emailInput').value = pending;
      $('pendingRow').hidden = !pending;
      $('pendingValue').textContent = pending || '—';
      $('pendingHint').textContent = t('pendingHint');
      return;
    }

    $('identityValue').textContent = t('bound');
    $('bindForm').hidden = true;
    $('boundBox').hidden = false;
    $('boundHint').textContent = t('boundHint');
    if (state.email) $('emailValue').textContent = state.email;
    window.XingchenAccountBinding?.clearPending?.();
  }

  async function waitAuth() {
    const state = await window.XingchenAuth?.init?.();
    render(state || window.XingchenAuth?.status?.() || {});
  }

  async function sendBinding() {
    const email = $('emailInput').value.trim();
    setBusy(true); setMessage(t('testing'));
    const result = await window.XingchenAccountBinding.start(email);
    setBusy(false);
    if (!result.ok) { setMessage(result.error, 'bad'); return; }
    $('pendingRow').hidden = false;
    $('pendingValue').textContent = result.email;
    $('pendingHint').textContent = t('pendingHint');
    setMessage(t('sent'), 'ok');
    render();
  }

  async function resend() {
    const email = $('emailInput').value.trim() || window.XingchenAccountBinding.readPendingEmail();
    setBusy(true); setMessage(t('testing'));
    const result = await window.XingchenAccountBinding.resend(email);
    setBusy(false);
    setMessage(result.ok ? t('sent') : result.error, result.ok ? 'ok' : 'bad');
  }

  async function verify() {
    const email = $('emailInput').value.trim() || window.XingchenAccountBinding.readPendingEmail();
    const code = $('otpInput').value.trim();
    setBusy(true); setMessage(t('testing'));
    const result = await window.XingchenAccountBinding.verify(email, code);
    setBusy(false);
    if (!result.ok) { setMessage(result.error, 'bad'); return; }
    await window.XingchenAuth.refreshUser();
    await window.XingchenCloudSync?.syncAll?.('account-bound');
    render();
    setMessage(t('success'), 'ok');
  }

  async function sync() {
    setBusy(true); setMessage(t('testing'));
    const result = await window.XingchenCloudSync?.syncAll?.('account-page');
    setBusy(false);
    if (result?.phase === 'ready') setMessage('✓ ' + t('sync'), 'ok');
    else setMessage(result?.error || result?.phase || 'Sync unavailable', 'bad');
  }

  function init() {
    applyText();
    $('sendBtn').addEventListener('click', sendBinding);
    $('resendBtn').addEventListener('click', resend);
    $('verifyBtn').addEventListener('click', verify);
    $('syncBtn').addEventListener('click', sync);
    window.addEventListener('stellar:auth-state', e => render(e.detail || {}));
    waitAuth();

    const q = new URLSearchParams(location.search);
    if (q.get('binding') === 'confirmed') {
      setTimeout(async () => {
        await window.XingchenAuth?.refreshUser?.();
        const st = window.XingchenAuth?.status?.() || {};
        render(st);
        if (st.signedIn && !st.isAnonymous) {
          await window.XingchenCloudSync?.syncAll?.('email-link-confirmed');
          setMessage(t('success'), 'ok');
        }
        history.replaceState({}, document.title, location.pathname);
      }, 400);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
