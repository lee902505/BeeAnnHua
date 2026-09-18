(() => {
  const STORAGE_KEY = 'xingchen-player-profile-v1';
  let pendingAction = null;

  const TEXT = {
    'zh-CN': {
      title:'先设置你的星辰称呼', titleExisting:'我的星辰资料',
      intro:'第一次使用个人功能前，先留下一个简单称呼。资料会优先保存在本机，临时云端身份就绪后会同步基本资料。', introExisting:'查看或修改你的玩家资料、云端身份与同步状态。',
      name:'名称', namePlaceholder:'例如：弈弈',
      nameHint:'请输入 2～5 个全形文字。',
      gender:'性别', male:'男', female:'女',
      save:'保存并继续', edit:'修改资料',
      invalidName:'名称需要 2～5 个全形文字，例如「弈弈」。',
      chooseGender:'请选择性别。',
      cloudTitle:'云端身份', cloudPreparing:'正在准备临时云端身份…', cloudTemp:'临时云端身份', cloudBound:'正式云端账号', cloudLocal:'本机模式', cloudError:'云端身份暂不可用', cloudTempNote:'目前尚未绑定邮箱；清除浏览器资料或换装置前，请先完成账号绑定。', cloudBoundNote:'账号已绑定，后续可用于跨设备同步。', cloudLocalNote:'目前只使用本机资料，网站其他功能仍可正常使用。', cloudSyncTitle:'资料同步', cloudSyncWaiting:'等待云端身份', cloudSyncing:'正在同步…', cloudSyncReady:'云端同步已开启', cloudSyncPartial:'部分资料待重试', cloudSyncOffline:'离线 · 本机资料已保留', cloudSyncNote:'本命盘、合盘、每日签与塔罗记录会与云端合并，本机仍保留副本。', bindAccount:'绑定邮箱账号', manageAccount:'管理云端账号', guestLabel:'游客：', memberLabel:'正式会员：', profileCue:'查看资料', profileAria:'点击查看玩家资料'
    },
    'zh-TW': {
      title:'先設定你的星辰稱呼', titleExisting:'我的星辰資料',
      intro:'第一次使用個人功能前，先留下一個簡單稱呼。資料會優先保存在本機，臨時雲端身分就緒後會同步基本資料。', introExisting:'查看或修改你的玩家資料、雲端身分與同步狀態。',
      name:'名稱', namePlaceholder:'例如：弈弈',
      nameHint:'請輸入 2～5 個全形文字。',
      gender:'性別', male:'男', female:'女',
      save:'儲存並繼續', edit:'修改資料',
      invalidName:'名稱需要 2～5 個全形文字，例如「弈弈」。',
      chooseGender:'請選擇性別。',
      cloudTitle:'雲端身分', cloudPreparing:'正在準備臨時雲端身分…', cloudTemp:'臨時雲端身分', cloudBound:'正式雲端帳號', cloudLocal:'本機模式', cloudError:'雲端身分暫不可用', cloudTempNote:'目前尚未綁定信箱；清除瀏覽器資料或換裝置前，請先完成帳號綁定。', cloudBoundNote:'帳號已綁定，後續可用於跨裝置同步。', cloudLocalNote:'目前只使用本機資料，網站其他功能仍可正常使用。', cloudSyncTitle:'資料同步', cloudSyncWaiting:'等待雲端身分', cloudSyncing:'正在同步…', cloudSyncReady:'雲端同步已開啟', cloudSyncPartial:'部分資料待重試', cloudSyncOffline:'離線 · 本機資料已保留', cloudSyncNote:'本命盤、合盤、每日籤與塔羅紀錄會與雲端合併，本機仍保留副本。', bindAccount:'綁定信箱帳號', manageAccount:'管理雲端帳號', guestLabel:'遊客：', memberLabel:'正式會員：', profileCue:'查看資料', profileAria:'點擊查看玩家資料'
    },
    'en': {
      title:'Set your display name', titleExisting:'My stellar profile',
      intro:'Before using personal features, create a short display name. Data stays local first, and basic profile fields sync when a temporary cloud identity is ready.', introExisting:'View or edit your player profile, cloud identity and sync status.',
      name:'Name', namePlaceholder:'2–5 full-width characters',
      nameHint:'Use 2–5 full-width characters.',
      gender:'Gender', male:'Male', female:'Female',
      save:'Save & continue', edit:'Edit profile',
      invalidName:'Please use 2–5 full-width characters.',
      chooseGender:'Please select a gender.',
      cloudTitle:'Cloud identity', cloudPreparing:'Preparing temporary cloud identity…', cloudTemp:'Temporary cloud identity', cloudBound:'Bound cloud account', cloudLocal:'Local-only mode', cloudError:'Cloud identity unavailable', cloudTempNote:'No recovery method is linked yet. Bind an account before clearing browser data or changing devices.', cloudBoundNote:'This account is linked and can support cross-device sync later.', cloudLocalNote:'Local features remain available even without cloud identity.', cloudSyncTitle:'Data sync', cloudSyncWaiting:'Waiting for cloud identity', cloudSyncing:'Syncing…', cloudSyncReady:'Cloud sync is on', cloudSyncPartial:'Some data will retry', cloudSyncOffline:'Offline · local copy kept', cloudSyncNote:'Natal charts, synastry, daily fortunes and tarot history merge with the cloud while keeping a local copy.', bindAccount:'Bind email account', manageAccount:'Manage cloud account', guestLabel:'Guest:', memberLabel:'Member:', profileCue:'Profile', profileAria:'Click to view player profile'
    }
  };

  function lang() {
    const v = localStorage.getItem('xingchen-language');
    return ['zh-CN','zh-TW','en'].includes(v) ? v : 'zh-CN';
  }
  function t(k) { return TEXT[lang()]?.[k] ?? TEXT['zh-CN'][k] ?? k; }

  function validName(name) {
    const chars = Array.from(String(name || '').trim());
    if (chars.length < 2 || chars.length > 5) return false;
    return chars.every(ch => ch.codePointAt(0) > 0xFF && !/\s/u.test(ch));
  }

  function read() {
    try {
      const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!p || !validName(p.name) || !['male','female'].includes(p.gender)) return null;
      return p;
    } catch {
      return null;
    }
  }

  function symbol(gender) { return gender === 'male' ? '♂' : '♀'; }
  function label(p = read()) { return p ? `${p.name}${symbol(p.gender)}` : ''; }

  function genderIcon(gender, className='player-gender-svg') {
    if (gender === 'male') {
      return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="9" cy="15" r="5"></circle>
        <path d="M12.5 11.5 19 5"></path>
        <path d="M14.5 5H19v4.5"></path>
      </svg>`;
    }
    return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8.5" r="5"></circle>
      <path d="M12 13.5V21"></path>
      <path d="M8.7 18h6.6"></path>
    </svg>`;
  }

  function render() {
    const p = read();
    document.querySelectorAll('[data-player-profile]').forEach(el => {
      if (!p) {
        el.hidden = true;
        el.replaceChildren();
        el.classList.remove('is-male','is-female');
        return;
      }

      const auth = window.XingchenAuth?.status?.() || {};
      const isMember = Boolean(auth.signedIn && !auth.isAnonymous);

      const membership = document.createElement('span');
      membership.className = 'player-membership-label';
      membership.textContent = isMember ? t('memberLabel') : t('guestLabel');

      const name = document.createElement('span');
      name.className = 'player-name';
      name.textContent = p.name;

      const icon = document.createElement('span');
      icon.className = 'player-gender-icon';
      icon.innerHTML = genderIcon(p.gender);

      const cue = document.createElement('span');
      cue.className = 'player-profile-cue';
      cue.setAttribute('aria-hidden', 'true');
      cue.innerHTML = '<span class="player-profile-cue-text">' + t('profileCue') + '</span><span class="player-profile-chevron">›</span>';

      el.hidden = false;
      el.replaceChildren(membership, name, icon, cue);
      el.classList.toggle('is-male', p.gender === 'male');
      el.classList.toggle('is-female', p.gender === 'female');
      el.classList.toggle('is-member', isMember);
      el.classList.toggle('is-guest', !isMember);
      el.title = t('profileAria');
      el.setAttribute('aria-label', `${isMember ? t('memberLabel') : t('guestLabel')}${p.name}，${t('profileAria')}`);
    });
  }

  function modal() { return document.getElementById('xingchenProfileModal'); }

  function injectModal() {
    if (modal()) return;
    const host = document.createElement('div');
    host.innerHTML = `
      <div class="player-profile-modal" id="xingchenProfileModal" hidden>
        <div class="player-profile-backdrop"></div>
        <section class="player-profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profileModalTitle">
          <button class="profile-modal-close" id="profileModalClose" type="button" aria-label="Close">×</button>
          <span class="profile-modal-star">✦</span>
          <h2 id="profileModalTitle"></h2>
          <p id="profileModalIntro"></p>

          <label class="profile-modal-field">
            <span id="profileNameLabel"></span>
            <input id="profileName" type="text" maxlength="10" autocomplete="off" />
            <small id="profileNameHint"></small>
          </label>

          <div class="profile-modal-gender">
            <span id="profileGenderLabel"></span>
            <div>
              <label class="profile-gender-option male-option">
                <input type="radio" name="xingchenGender" value="male" />
                <span>${genderIcon('male','profile-gender-svg')}<b id="profileMaleText"></b></span>
              </label>
              <label class="profile-gender-option female-option">
                <input type="radio" name="xingchenGender" value="female" />
                <span>${genderIcon('female','profile-gender-svg')}<b id="profileFemaleText"></b></span>
              </label>
            </div>
          </div>

          <section class="profile-cloud-identity" id="profileCloudIdentity" aria-live="polite">
            <div class="profile-cloud-head">
              <span class="profile-cloud-dot" aria-hidden="true"></span>
              <strong id="profileCloudTitle"></strong>
            </div>
            <b id="profileCloudStatus"></b>
            <small id="profileCloudNote"></small>
            <div class="profile-cloud-sync" id="profileCloudSync">
              <span id="profileCloudSyncTitle"></span>
              <b id="profileCloudSyncStatus"></b>
              <small id="profileCloudSyncNote"></small>
            </div>
            <a class="profile-account-btn" id="profileAccountBtn" href="#"></a>
          </section>

          <p class="profile-modal-error" id="profileError"></p>
          <button class="profile-save-btn" id="profileSaveBtn" type="button"></button>
        </section>
      </div>`;
    document.body.appendChild(host.firstElementChild);

    document.getElementById('profileSaveBtn').addEventListener('click', save);
    document.getElementById('profileModalClose').addEventListener('click', () => {
      pendingAction = null;
      close();
    });
    document.getElementById('profileName').addEventListener('keydown', e => {
      if (e.key === 'Enter') save();
    });
  }

  function applyText() {
    const existing = Boolean(read());
    document.getElementById('profileModalTitle').textContent = existing ? t('titleExisting') : t('title');
    document.getElementById('profileModalIntro').textContent = existing ? t('introExisting') : t('intro');
    document.getElementById('profileNameLabel').textContent = t('name');
    document.getElementById('profileName').placeholder = t('namePlaceholder');
    document.getElementById('profileNameHint').textContent = t('nameHint');
    document.getElementById('profileGenderLabel').textContent = t('gender');
    document.getElementById('profileMaleText').textContent = t('male');
    document.getElementById('profileFemaleText').textContent = t('female');
    document.getElementById('profileSaveBtn').textContent = t('save');
    document.getElementById('profileCloudTitle').textContent = t('cloudTitle');
    document.getElementById('profileCloudSyncTitle').textContent = t('cloudSyncTitle');
    const accountBtn = document.getElementById('profileAccountBtn');
    if (accountBtn) accountBtn.href = location.pathname.includes('/pages/') ? '../account.html' : 'account.html';
    renderCloudIdentity();
    renderCloudSync();
  }

  function renderCloudIdentity(state = window.XingchenAuth?.status?.() || {}) {
    const box = document.getElementById('profileCloudIdentity');
    const statusEl = document.getElementById('profileCloudStatus');
    const noteEl = document.getElementById('profileCloudNote');
    if (!box || !statusEl || !noteEl) return;

    box.classList.remove('is-ready','is-bound','is-local','is-error','is-loading');

    const accountBtn = document.getElementById('profileAccountBtn');
    if (accountBtn) accountBtn.hidden = !state.signedIn;

    if (state.signedIn) {
      if (state.isAnonymous) {
        box.classList.add('is-ready');
        statusEl.textContent = t('cloudTemp');
        noteEl.textContent = t('cloudTempNote');
        if (accountBtn) accountBtn.textContent = t('bindAccount');
      } else {
        box.classList.add('is-bound');
        statusEl.textContent = t('cloudBound');
        noteEl.textContent = state.email ? `${t('cloudBoundNote')} · ${state.email}` : t('cloudBoundNote');
        if (accountBtn) accountBtn.textContent = t('manageAccount');
      }
      return;
    }

    if (state.error) {
      box.classList.add('is-error');
      statusEl.textContent = t('cloudError');
      noteEl.textContent = state.error;
      return;
    }

    if (['restoring','creating-anonymous','idle'].includes(state.phase)) {
      box.classList.add('is-loading');
      statusEl.textContent = t('cloudPreparing');
      noteEl.textContent = '';
      return;
    }

    box.classList.add('is-local');
    statusEl.textContent = t('cloudLocal');
    noteEl.textContent = t('cloudLocalNote');
  }

  function renderCloudSync(state = window.XingchenCloudSync?.status?.() || {}) {
    const box = document.getElementById('profileCloudSync');
    const statusEl = document.getElementById('profileCloudSyncStatus');
    const noteEl = document.getElementById('profileCloudSyncNote');
    if (!box || !statusEl || !noteEl) return;

    box.classList.remove('is-syncing','is-ready','is-partial','is-offline');
    if (state.phase === 'syncing') {
      box.classList.add('is-syncing');
      statusEl.textContent = t('cloudSyncing');
    } else if (state.phase === 'ready') {
      box.classList.add('is-ready');
      statusEl.textContent = t('cloudSyncReady');
    } else if (state.phase === 'partial') {
      box.classList.add('is-partial');
      statusEl.textContent = t('cloudSyncPartial');
    } else if (state.phase === 'offline') {
      box.classList.add('is-offline');
      statusEl.textContent = t('cloudSyncOffline');
    } else {
      statusEl.textContent = t('cloudSyncWaiting');
    }
    noteEl.textContent = t('cloudSyncNote');
  }

  function open(callback = null) {
    pendingAction = typeof callback === 'function' ? callback : null;
    const p = read();
    applyText();
    document.getElementById('profileName').value = p?.name || '';
    document.querySelectorAll('input[name="xingchenGender"]').forEach(input => {
      input.checked = input.value === p?.gender;
    });
    document.getElementById('profileError').textContent = '';
    modal().hidden = false;
    document.body.classList.add('profile-modal-open');
    requestAnimationFrame(() => {
      document.getElementById('profileName')?.focus();
      document.getElementById('profileName')?.select();
    });
  }

  function close() {
    if (modal()) modal().hidden = true;
    document.body.classList.remove('profile-modal-open');
  }

  function save() {
    const name = document.getElementById('profileName').value.trim();
    const gender = document.querySelector('input[name="xingchenGender"]:checked')?.value;
    const err = document.getElementById('profileError');

    if (!validName(name)) {
      err.textContent = t('invalidName');
      return;
    }
    if (!['male','female'].includes(gender)) {
      err.textContent = t('chooseGender');
      return;
    }

    const savedProfile = {
      name, gender, updatedAt:new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProfile));
    try {
      window.dispatchEvent(new CustomEvent('stellar:player-profile-saved', {detail:savedProfile}));
    } catch (_) {}
    render();
    close();

    const action = pendingAction;
    pendingAction = null;
    if (action) setTimeout(action, 0);
  }

  function ensure(callback) {
    if (read()) return true;
    open(callback);
    return false;
  }

  function guardLinks() {
    // Use one capture-phase delegated listener instead of relying only on
    // individual anchor listeners. This is more robust on mobile Safari
    // and also covers links inserted or changed after initialization.
    document.addEventListener('click', event => {
      const link = event.target.closest?.('[data-profile-required]');
      if (!link) return;
      if (read()) return;

      event.preventDefault();
      event.stopPropagation();

      const href = link.getAttribute('href');
      open(() => {
        if (href) window.location.assign(href);
      });
    }, true);
  }

  let initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;

    injectModal();
    render();
    guardLinks();

    document.addEventListener('click', event => {
      const badge = event.target.closest?.('[data-player-profile]');
      if (!badge) return;
      event.preventDefault();
      open();
    }, true);

    window.addEventListener('stellar:auth-state', event => {
      render();
      renderCloudIdentity(event.detail || {});
    });
    window.addEventListener('stellar:cloud-sync-state', event => {
      renderCloudSync(event.detail || {});
    });
    renderCloudIdentity();
    renderCloudSync();
  }

  window.XingchenPlayer = {
    getProfile:read,
    hasProfile:() => Boolean(read()),
    ensure, open, label, render
  };

  // On cached/mobile navigation this script may execute after DOMContentLoaded.
  // Initialize immediately in that case instead of waiting for an event that
  // has already happened.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }
})();