(() => {
  const LANG_KEY = 'xingchen-language';
  const PROFILE_KEY = 'xingchen-player-profile-v1';
  const OTP_LENGTH = 8;
  let bindOpen = false;
  let loginOpen = false;
  let latestAuth = {};

  const T = {
    'zh-CN': {
      brand:'星辰日记', home:'返回首页', eyebrow:'V0.11.0 · ACCOUNT LOGIN & OTP',
      titleGuest:'云端账号', titleMember:'云端账号',
      leadGuest:'先以游客身份轻松使用；可以绑定新邮箱，也可以登录已有账号并恢复原本的云端资料。',
      leadMember:'管理你的正式会员身份、邮箱安全与云端资料。',
      guest:'游客', member:'正式会员', traveler:'星辰旅人', tempIdentity:'临时云端身份', noEmail:'尚未绑定邮箱',
      syncReady:'云端同步已开启', syncWorking:'正在同步资料…', syncOffline:'目前离线 · 本机副本仍保留', syncWaiting:'等待云端身份', syncPartial:'部分资料等待重试', syncRestore:'等待选择资料恢复方式',
      securityTitle:'账号与安全', securityDesc:'绑定新邮箱、登录已有账号，或管理目前的会员邮箱。',
      bindEmail:'绑定新邮箱', changeEmail:'更换绑定邮箱',
      bindEmailDesc:'第一次建立正式账号时使用；当前游客资料会继续保留在同一个 UUID 下。',
      changeEmailDesc:'更换验证邮箱，原有云端资料与 UUID 不会改变。',
      restoreTitleGuest:'已有账号？登录 / 恢复', restoreDescGuest:'已绑定邮箱的会员，可在这台设备登录并取回原本的云端资料。',
      restoreTitleMember:'换设备登录 / 恢复账号', restoreDescMember:'请在新的手机或浏览器打开这里，再选择「已有账号登录」。',
      syncTitle:'云端同步', syncDesc:'资料采用 local-first；云端与本机合并，本机副本不会因为同步成功而删除。', syncNow:'立即同步资料', syncHintReady:'你的资料会持续与云端合并。', syncHintWait:'云端身份准备完成后即可同步。', lastSync:'最后同步：', never:'尚未同步',
      dataTitle:'云端资料', dataDesc:'快速查看目前保存在这个云端身份下的资料概况。', fortune:'每日签', tarot:'塔罗记录', natal:'本命星盘', synastry:'两人合盘',
      bindTitle:'绑定邮箱保护账号', changeTitle:'更换绑定邮箱', support:'支持 QQ邮箱、Foxmail、163、126、Outlook、iCloud、Gmail 等常用邮箱。',
      emailLabel:'邮箱地址', emailPlaceholder:'例如 123456@qq.com', send:'发送验证邮件', resend:'重新发送',
      sent:'验证邮件已发送。你可以直接点击邮件里的验证按钮，也可以输入邮件中的 8 位验证码。',
      pending:'待确认邮箱', pendingHint:'如果没有收到邮件，请等待至少 60 秒后再重新发送。',
      verifyTitle:'选择一种验证方式', mailTitle:'方式一 · 前往验证邮件', mailDesc:'打开「星辰日记」发来的邮件，点击确认按钮。完成后回到这里即可。', mailCheck:'我已完成邮件验证',
      otpTitle:'方式二 · 输入 8 位验证码', otpDesc:'邮件内会同时显示 8 位验证码，可直接在这里输入完成验证。', or:'或', verify:'验证并完成', testing:'处理中…',
      successBind:'邮箱绑定完成。当前 UUID 已升级为正式云端账号，原有资料仍在同一个账号下。', successChange:'邮箱更换完成。原有云端资料与 UUID 保持不变。',
      loginTitle:'登录已有云端账号', loginSupport:'输入之前绑定过的邮箱。我们会发送登录邮件，你可以点邮件按钮或输入 8 位验证码。', loginSend:'发送登录邮件', loginPending:'登录邮箱',
      loginSent:'登录邮件已发送。请选择「打开邮件验证」或直接输入 8 位验证码。', loginMailTitle:'方式一 · 打开登录邮件', loginMailDesc:'点击邮件里的「登录星辰日记」按钮，会切换回原本的正式会员账号。', loginMailCheck:'我已完成邮件登录',
      loginOtpTitle:'方式二 · 输入 8 位登录码', loginOtpDesc:'登录邮件会同时显示 8 位验证码，可直接输入，不必离开当前页面。', loginVerify:'登录并恢复', loginMemberInfo:'当前已经是正式会员。要恢复账号，请在另一台新设备使用这个入口。',
      restoreChoiceTitle:'检测到这台设备有游客资料', restoreChoiceDesc:'你已经登录原本的正式会员账号。先比较这台设备的游客资料与原账号云端资料，再选择恢复方式。', guestDataTitle:'这台设备的游客资料', cloudDataTitle:'原账号云端资料',
      useCloud:'使用原账号云端资料（推荐）', mergeGuest:'合并这台设备的游客资料', restoreWorking:'正在恢复云端资料…', restoreDone:'账号恢复完成，已经切换回原本的正式会员资料。', mergeDone:'账号恢复完成，这台设备的游客资料已与原账号合并。',
      logoutTitle:'退出当前账号 / 切换账号', logoutDesc:'先同步当前会员资料，再仅退出这台设备，并切换为新的游客身份。', logoutConfirmTitle:'确认退出当前会员账号？', logoutConfirmDesc:'系统会先同步云端资料，再清除这台设备上的会员本机副本。其他设备不会被登出；之后你可以登录另一个账号。', logoutCancel:'取消', logoutConfirm:'退出并切换账号', logoutWorking:'正在同步并切换账号…', logoutDone:'已退出当前会员账号，这台设备已切换为新的游客身份。你可以登录其他账号，或关闭登录区继续以游客使用。',
      techTitle:'账号技术信息', identity:'云端身份', temporary:'临时云端身份', bound:'正式云端账号', local:'本机模式', email:'绑定邮箱', uuid:'User UUID', techLastSync:'最后同步', copy:'复制', copied:'已复制',
      back:'返回首页', noCloud:'尚未建立云端身份。', syncOk:'全部资料同步完成，本机副本仍会保留。'
    },
    'zh-TW': {
      brand:'星辰日記', home:'返回首頁', eyebrow:'V0.11.0 · ACCOUNT LOGIN & OTP',
      titleGuest:'雲端帳號', titleMember:'雲端帳號', leadGuest:'先以遊客身分輕鬆使用；可以綁定新信箱，也可以登入既有帳號並恢復原本的雲端資料。', leadMember:'管理你的正式會員身分、信箱安全與雲端資料。',
      guest:'遊客', member:'正式會員', traveler:'星辰旅人', tempIdentity:'臨時雲端身分', noEmail:'尚未綁定信箱', syncReady:'雲端同步已開啟', syncWorking:'正在同步資料…', syncOffline:'目前離線 · 本機副本仍保留', syncWaiting:'等待雲端身分', syncPartial:'部分資料等待重試', syncRestore:'等待選擇資料恢復方式',
      securityTitle:'帳號與安全', securityDesc:'綁定新信箱、登入既有帳號，或管理目前的會員信箱。', bindEmail:'綁定新信箱', changeEmail:'更換綁定信箱', bindEmailDesc:'第一次建立正式帳號時使用；目前遊客資料會繼續保留在同一個 UUID 下。', changeEmailDesc:'更換驗證信箱，原有雲端資料與 UUID 不會改變。', restoreTitleGuest:'已有帳號？登入 / 恢復', restoreDescGuest:'已綁定信箱的會員，可在這台裝置登入並取回原本的雲端資料。', restoreTitleMember:'換裝置登入 / 恢復帳號', restoreDescMember:'請在新的手機或瀏覽器打開這裡，再選擇「已有帳號登入」。',
      syncTitle:'雲端同步', syncDesc:'資料採 local-first；雲端與本機合併，本機副本不會因為同步成功而刪除。', syncNow:'立即同步資料', syncHintReady:'你的資料會持續與雲端合併。', syncHintWait:'雲端身分準備完成後即可同步。', lastSync:'最後同步：', never:'尚未同步', dataTitle:'雲端資料', dataDesc:'快速查看目前保存在這個雲端身分下的資料概況。', fortune:'每日籤', tarot:'塔羅紀錄', natal:'本命星盤', synastry:'兩人合盤',
      bindTitle:'綁定信箱保護帳號', changeTitle:'更換綁定信箱', support:'支援 QQ信箱、Foxmail、163、126、Outlook、iCloud、Gmail 等常用信箱。', emailLabel:'信箱地址', emailPlaceholder:'例如 123456@qq.com', send:'傳送驗證郵件', resend:'重新傳送', sent:'驗證郵件已傳送。你可以直接點擊郵件裡的驗證按鈕，也可以輸入郵件中的 8 位驗證碼。', pending:'待確認信箱', pendingHint:'如果沒有收到郵件，請等待至少 60 秒後再重新傳送。', verifyTitle:'選擇一種驗證方式', mailTitle:'方式一 · 前往驗證郵件', mailDesc:'打開「星辰日記」寄來的郵件，點擊確認按鈕。完成後回到這裡即可。', mailCheck:'我已完成郵件驗證', otpTitle:'方式二 · 輸入 8 位驗證碼', otpDesc:'郵件內會同時顯示 8 位驗證碼，可直接在這裡輸入完成驗證。', or:'或', verify:'驗證並完成', testing:'處理中…', successBind:'信箱綁定完成。目前 UUID 已升級為正式雲端帳號，原有資料仍在同一個帳號下。', successChange:'信箱更換完成。原有雲端資料與 UUID 保持不變。',
      loginTitle:'登入既有雲端帳號', loginSupport:'輸入之前綁定過的信箱。我們會傳送登入郵件，你可以點郵件按鈕或輸入 8 位驗證碼。', loginSend:'傳送登入郵件', loginPending:'登入信箱', loginSent:'登入郵件已傳送。請選擇「打開郵件驗證」或直接輸入 8 位驗證碼。', loginMailTitle:'方式一 · 打開登入郵件', loginMailDesc:'點擊郵件裡的「登入星辰日記」按鈕，會切換回原本的正式會員帳號。', loginMailCheck:'我已完成郵件登入', loginOtpTitle:'方式二 · 輸入 8 位登入碼', loginOtpDesc:'登入郵件會同時顯示 8 位驗證碼，可直接輸入，不必離開目前頁面。', loginVerify:'登入並恢復', loginMemberInfo:'目前已經是正式會員。要恢復帳號，請在另一台新裝置使用這個入口。',
      restoreChoiceTitle:'偵測到這台裝置有遊客資料', restoreChoiceDesc:'你已經登入原本的正式會員帳號。先比較這台裝置的遊客資料與原帳號雲端資料，再選擇恢復方式。', guestDataTitle:'這台裝置的遊客資料', cloudDataTitle:'原帳號雲端資料', useCloud:'使用原帳號雲端資料（推薦）', mergeGuest:'合併這台裝置的遊客資料', restoreWorking:'正在恢復雲端資料…', restoreDone:'帳號恢復完成，已經切換回原本的正式會員資料。', mergeDone:'帳號恢復完成，這台裝置的遊客資料已與原帳號合併。',
      logoutTitle:'登出目前帳號 / 切換帳號', logoutDesc:'先同步目前會員資料，再只登出這台裝置，並切換為新的遊客身份。', logoutConfirmTitle:'確認登出目前會員帳號？', logoutConfirmDesc:'系統會先同步雲端資料，再清除這台裝置上的會員本機副本。其他裝置不會被登出；之後你可以登入另一個帳號。', logoutCancel:'取消', logoutConfirm:'登出並切換帳號', logoutWorking:'正在同步並切換帳號…', logoutDone:'已登出目前會員帳號，這台裝置已切換為新的遊客身份。你可以登入其他帳號，或關閉登入區繼續以遊客使用。',
      techTitle:'帳號技術資訊', identity:'雲端身分', temporary:'臨時雲端身分', bound:'正式雲端帳號', local:'本機模式', email:'綁定信箱', uuid:'User UUID', techLastSync:'最後同步', copy:'複製', copied:'已複製', back:'返回首頁', noCloud:'尚未建立雲端身分。', syncOk:'全部資料同步完成，本機副本仍會保留。'
    },
    en: {
      brand:'Stellar Diary', home:'Back home', eyebrow:'V0.11.0 · ACCOUNT LOGIN & OTP', titleGuest:'Cloud account', titleMember:'Cloud account', leadGuest:'Start as a guest, bind a new email, or sign in to an existing account and restore your cloud data.', leadMember:'Manage your member identity, email security and cloud data.', guest:'Guest', member:'Member', traveler:'Stellar traveler', tempIdentity:'Temporary cloud identity', noEmail:'No email linked', syncReady:'Cloud sync is on', syncWorking:'Syncing data…', syncOffline:'Offline · local copy kept', syncWaiting:'Waiting for cloud identity', syncPartial:'Some data will retry', syncRestore:'Waiting for restore choice', securityTitle:'Account & security', securityDesc:'Bind a new email, sign in to an existing account, or manage your current member email.', bindEmail:'Bind new email', changeEmail:'Change linked email', bindEmailDesc:'Use this for your first permanent account; guest data stays on the same UUID.', changeEmailDesc:'Verify a new email without changing your UUID or cloud data.', restoreTitleGuest:'Already a member? Sign in / restore', restoreDescGuest:'Use a previously linked email to restore your original cloud account on this device.', restoreTitleMember:'Sign in on another device / restore', restoreDescMember:'On a new phone or browser, open this page and choose existing-account sign in.', syncTitle:'Cloud sync', syncDesc:'Local-first data merges with the cloud and local copies are retained.', syncNow:'Sync now', syncHintReady:'Your data continues merging with the cloud.', syncHintWait:'Cloud identity must be ready first.', lastSync:'Last sync:', never:'Never', dataTitle:'Cloud data', dataDesc:'A quick view of data stored under this cloud identity.', fortune:'Daily fortunes', tarot:'Tarot history', natal:'Natal charts', synastry:'Synastry', bindTitle:'Bind email to protect account', changeTitle:'Change linked email', support:'Supports QQ Mail, Foxmail, 163, 126, Outlook, iCloud, Gmail and other common email services.', emailLabel:'Email', emailPlaceholder:'you@example.com', send:'Send verification email', resend:'Resend', sent:'Verification email sent. Click the verification button in the email, or enter the 8-digit code shown in the email.', pending:'Pending email', pendingHint:'Wait at least 60 seconds before resending.', verifyTitle:'Choose a verification method', mailTitle:'Method 1 · Open verification email', mailDesc:'Open the Stellar Diary email and click its confirmation button, then return here.', mailCheck:'I completed email verification', otpTitle:'Method 2 · Enter 8-digit code', otpDesc:'The email also shows an 8-digit code. Enter it here to finish without leaving this page.', or:'OR', verify:'Verify & finish', testing:'Working…', successBind:'Email binding complete. The same UUID is now a permanent cloud account.', successChange:'Email change complete. Cloud data and UUID are unchanged.', loginTitle:'Sign in to an existing cloud account', loginSupport:'Enter an email you linked before. Use the email button or an 8-digit login code.', loginSend:'Send sign-in email', loginPending:'Sign-in email', loginSent:'Sign-in email sent. Open the email or enter its 8-digit code.', loginMailTitle:'Method 1 · Open sign-in email', loginMailDesc:'Click the Stellar Diary sign-in button to switch back to your original member account.', loginMailCheck:'I completed email sign-in', loginOtpTitle:'Method 2 · Enter 8-digit login code', loginOtpDesc:'The sign-in email also shows an 8-digit code. Enter it here without leaving this page.', loginVerify:'Sign in & restore', loginMemberInfo:'You are already a member. Use this option from the new device you want to restore.', restoreChoiceTitle:'Guest data found on this device', restoreChoiceDesc:'You are now signed in to your original member account. Compare this device’s guest data with the original cloud account, then choose how to restore.', guestDataTitle:'Guest data on this device', cloudDataTitle:'Original account cloud data', useCloud:'Use original cloud data (recommended)', mergeGuest:'Merge this device’s guest data', restoreWorking:'Restoring cloud data…', restoreDone:'Account restored. This device now uses your original member cloud data.', mergeDone:'Account restored and guest data from this device has been merged.', logoutTitle:'Sign out / switch account', logoutDesc:'Sync this member first, sign out only on this device, then switch to a fresh guest identity.', logoutConfirmTitle:'Sign out of this member account?', logoutConfirmDesc:'We will sync first, clear this device’s member-local copy, and sign out only on this device. Other devices stay signed in. You can then sign in to another account.', logoutCancel:'Cancel', logoutConfirm:'Sign out & switch', logoutWorking:'Syncing and switching account…', logoutDone:'Signed out on this device and switched to a fresh guest identity. You can sign in to another account or keep using guest mode.', techTitle:'Account technical details', identity:'Cloud identity', temporary:'Temporary cloud identity', bound:'Bound cloud account', local:'Local-only mode', email:'Linked email', uuid:'User UUID', techLastSync:'Last sync', copy:'Copy', copied:'Copied', back:'Back home', noCloud:'No cloud identity available.', syncOk:'All data synced. Local copies are still kept.'
    }
  };

  function lang(){try{const v=localStorage.getItem(LANG_KEY);return T[v]?v:'zh-CN'}catch(_){return'zh-CN'}}
  function t(k){return T[lang()]?.[k] ?? T['zh-CN'][k] ?? k}
  function $(id){return document.getElementById(id)}
  function readProfile(){try{const p=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null');return p&&p.name?{name:String(p.name),gender:String(p.gender||'')}:null}catch(_){return null}}
  function genderSymbol(g){return g==='male'?'♂':g==='female'?'♀':''}
  function formatDate(value){if(!value)return t('never');const d=new Date(value);if(Number.isNaN(d.getTime()))return value;try{return new Intl.DateTimeFormat(lang(),{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(d)}catch(_){return d.toLocaleString()}}
  function maskUuid(v){const s=String(v||'');return s.length>16?`${s.slice(0,8)}…${s.slice(-4)}`:s||'—'}

  function createOtpBoxes(containerId){
    const host=$(containerId); if(!host || host.children.length) return;
    for(let i=0;i<OTP_LENGTH;i++){
      const input=document.createElement('input'); input.className='otp-box'; input.type='text'; input.inputMode='numeric'; input.maxLength=1; input.autocomplete=i===0?'one-time-code':'off'; input.setAttribute('aria-label',`OTP ${i+1}`); input.dataset.index=String(i);
      input.addEventListener('input',()=>{input.value=input.value.replace(/\D/g,'').slice(-1); if(input.value&&i<OTP_LENGTH-1) host.children[i+1].focus();});
      input.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!input.value&&i>0) host.children[i-1].focus();});
      input.addEventListener('paste',e=>{const code=(e.clipboardData?.getData('text')||'').replace(/\D/g,'').slice(0,OTP_LENGTH);if(code.length){e.preventDefault();[...host.children].forEach((el,j)=>el.value=code[j]||'');host.children[Math.min(code.length,OTP_LENGTH)-1].focus();}});
      host.appendChild(input);
    }
  }
  function otpValue(containerId){return [...($(containerId)?.querySelectorAll('.otp-box')||[])].map(el=>el.value).join('')}
  function clearOtp(containerId){[...($(containerId)?.querySelectorAll('.otp-box')||[])].forEach(el=>el.value='')}

  function applyText(){
    document.documentElement.lang=lang();
    $('brandText').textContent=t('brand'); $('topHome').textContent=t('home'); $('eyebrow').textContent=t('eyebrow');
    $('securityTitle').textContent=t('securityTitle'); $('securityDesc').textContent=t('securityDesc');
    $('syncTitle').textContent=t('syncTitle'); $('syncDesc').textContent=t('syncDesc'); $('syncBtn').textContent=t('syncNow'); $('lastSyncLabel').textContent=t('lastSync');
    $('dataTitle').textContent=t('dataTitle'); $('dataDesc').textContent=t('dataDesc'); $('fortuneLabel').textContent=t('fortune'); $('tarotLabel').textContent=t('tarot'); $('natalLabel').textContent=t('natal'); $('synastryLabel').textContent=t('synastry');
    $('supportText').textContent=t('support'); $('emailLabel').textContent=t('emailLabel'); $('emailInput').placeholder=t('emailPlaceholder'); $('sendBtn').textContent=t('send'); $('resendBtn').textContent=t('resend'); $('pendingTitle').textContent=t('pending'); $('pendingHint').textContent=t('pendingHint');
    $('bindVerifyTitle').textContent=t('verifyTitle'); $('bindMailTitle').textContent=t('mailTitle'); $('bindMailDesc').textContent=t('mailDesc'); $('bindCheckLinkBtn').textContent=t('mailCheck'); $('bindOtpTitle').textContent=t('otpTitle'); $('bindOtpDesc').textContent=t('otpDesc'); $('bindOr').textContent=t('or'); $('verifyBtn').textContent=t('verify');
    $('loginTitle').textContent=t('loginTitle'); $('loginSupport').textContent=t('loginSupport'); $('loginEmailLabel').textContent=t('emailLabel'); $('loginEmailInput').placeholder=t('emailPlaceholder'); $('loginSendBtn').textContent=t('loginSend'); $('loginResendBtn').textContent=t('resend'); $('loginPendingTitle').textContent=t('loginPending'); $('loginPendingHint').textContent=t('pendingHint'); $('loginVerifyTitle').textContent=t('verifyTitle'); $('loginMailTitle').textContent=t('loginMailTitle'); $('loginMailDesc').textContent=t('loginMailDesc'); $('loginCheckLinkBtn').textContent=t('loginMailCheck'); $('loginOtpTitle').textContent=t('loginOtpTitle'); $('loginOtpDesc').textContent=t('loginOtpDesc'); $('loginOr').textContent=t('or'); $('loginVerifyBtn').textContent=t('loginVerify');
    $('restoreChoiceTitle').textContent=t('restoreChoiceTitle'); $('restoreChoiceDesc').textContent=t('restoreChoiceDesc'); $('guestDataTitle').textContent=t('guestDataTitle'); $('cloudDataTitle').textContent=t('cloudDataTitle'); $('restoreCloudBtn').textContent=t('useCloud'); $('restoreMergeBtn').textContent=t('mergeGuest'); $('restoreFortuneLabel').textContent=t('fortune'); $('restoreTarotLabel').textContent=t('tarot'); $('restoreNatalLabel').textContent=t('natal'); $('restoreSynastryLabel').textContent=t('synastry'); $('cloudFortuneLabel').textContent=t('fortune'); $('cloudTarotLabel').textContent=t('tarot'); $('cloudNatalLabel').textContent=t('natal'); $('cloudSynastryLabel').textContent=t('synastry');
    $('logoutTitle').textContent=t('logoutTitle'); $('logoutDesc').textContent=t('logoutDesc'); $('logoutConfirmTitle').textContent=t('logoutConfirmTitle'); $('logoutConfirmDesc').textContent=t('logoutConfirmDesc'); $('logoutCancelBtn').textContent=t('logoutCancel'); $('logoutConfirmBtn').textContent=t('logoutConfirm');
    $('techTitle').textContent=t('techTitle'); $('identityLabel').textContent=t('identity'); $('emailStatusLabel').textContent=t('email'); $('uuidLabel').textContent=t('uuid'); $('techLastSyncLabel').textContent=t('techLastSync'); $('copyUuid').textContent=t('copy'); $('backBtn').textContent=t('back');
  }

  function setMessage(message,kind=''){const el=$('message');el.className=`account-message ${kind}`.trim();el.textContent=message||'';el.hidden=!message}
  function setBusy(b){['sendBtn','resendBtn','verifyBtn','syncBtn','emailAction','loginAction','loginSendBtn','loginResendBtn','loginVerifyBtn','bindCheckLinkBtn','loginCheckLinkBtn','restoreCloudBtn','restoreMergeBtn','logoutAction','logoutCancelBtn','logoutConfirmBtn'].forEach(id=>{const el=$(id);if(el)el.disabled=b})}

  function renderSync(sync=window.XingchenCloudSync?.status?.()||{}){
    const c=sync.counts||{}; $('fortuneCount').textContent=Number(c.fortune||0); $('tarotCount').textContent=Number(c.tarot||0); $('natalCount').textContent=Number(c.natal||0); $('synastryCount').textContent=Number(c.synastry||0);
    $('lastSyncValue').textContent=formatDate(sync.lastSyncAt); $('techLastSyncValue').textContent=formatDate(sync.lastSyncAt);
    let state=t('syncWaiting'),hint=t('syncHintWait');
    if(sync.phase==='syncing'){state=t('syncWorking');hint=t('syncHintReady')}
    else if(sync.phase==='ready'){state=t('syncReady');hint=t('syncHintReady')}
    else if(sync.phase==='partial'){state=t('syncPartial');hint=sync.error||t('syncHintReady')}
    else if(sync.phase==='offline'){state=t('syncOffline');hint=t('syncHintWait')}
    else if(sync.phase==='restore-choice'){state=t('syncRestore');hint=t('restoreChoiceDesc')}
    $('syncState').textContent=state; $('syncHint').textContent=hint; $('memberSyncText').textContent=state;
  }

  function renderRestore(){
    const pending=window.XingchenAccountLogin?.readRestorePending?.();
    const state=window.XingchenAuth?.status?.()||{};
    const active=Boolean(pending && pending.fromUserId && state.userId && pending.fromUserId!==state.userId);
    $('restorePanel').hidden=!active;
    if(!active)return;
    const c=pending.localCounts||{};
    $('restoreFortune').textContent=Number(c.fortune||0); $('restoreTarot').textContent=Number(c.tarot||0); $('restoreNatal').textContent=Number(c.natal||0); $('restoreSynastry').textContent=Number(c.synastry||0);
    const cloud=pending.cloudCounts||null;
    const cloudValue=(key)=>cloud ? Number(cloud[key]||0) : '…';
    $('cloudFortune').textContent=cloudValue('fortune'); $('cloudTarot').textContent=cloudValue('tarot'); $('cloudNatal').textContent=cloudValue('natal'); $('cloudSynastry').textContent=cloudValue('synastry');
    setTimeout(()=>$('restorePanel').scrollIntoView({behavior:'smooth',block:'center'}),100);
  }

  function render(state=window.XingchenAuth?.status?.()||{}){
    latestAuth=state||{};
    const member=Boolean(state.signedIn&&!state.isAnonymous); const bindPending=window.XingchenAccountBinding?.readPendingEmail?.()||''; const loginPending=window.XingchenAccountLogin?.readPendingLogin?.(); const profile=readProfile();
    $('title').textContent=member?t('titleMember'):t('titleGuest'); $('lead').textContent=member?t('leadMember'):t('leadGuest');
    $('memberCard').classList.toggle('is-guest',!member); $('memberCard').classList.toggle('is-member',member); $('memberStatus').textContent=member?t('member'):t('guest'); $('memberName').textContent=profile?.name||t('traveler'); $('memberGender').textContent=genderSymbol(profile?.gender); $('memberEmail').textContent=state.email||bindPending||(state.signedIn?t('tempIdentity'):t('noCloud'));
    $('emailActionTitle').textContent=member?t('changeEmail'):t('bindEmail'); $('emailActionDesc').textContent=member?t('changeEmailDesc'):t('bindEmailDesc'); $('bindTitle').textContent=member?t('changeTitle'):t('bindTitle');
    $('restoreTitle').textContent=member?t('restoreTitleMember'):t('restoreTitleGuest'); $('restoreDesc').textContent=member?t('restoreDescMember'):t('restoreDescGuest');
    $('logoutAction').hidden=!member; if(!member)$('logoutConfirmBox').hidden=true;
    $('identityValue').textContent=!state.signedIn?(state.phase==='local-only'?t('local'):t('noCloud')):(state.isAnonymous?t('temporary'):t('bound')); $('emailValue').textContent=state.email||bindPending||t('noEmail'); $('uuidValue').textContent=maskUuid(state.userId); $('uuidValue').dataset.full=state.userId||'';
    if(bindPending){$('pendingRow').hidden=false;$('pendingValue').textContent=bindPending;$('bindVerifyChoice').hidden=false;if(!$('emailInput').value)$('emailInput').value=bindPending;bindOpen=true}else{$('pendingRow').hidden=true;$('bindVerifyChoice').hidden=true}
    $('bindPanel').hidden=!bindOpen;
    if(loginPending?.email && state.isAnonymous){$('loginPendingRow').hidden=false;$('loginPendingValue').textContent=loginPending.email;$('loginVerifyChoice').hidden=false;if(!$('loginEmailInput').value)$('loginEmailInput').value=loginPending.email;loginOpen=true}else{$('loginPendingRow').hidden=true;$('loginVerifyChoice').hidden=true;if(member)loginOpen=false}
    $('loginPanel').hidden=!loginOpen;
    $('emailAction').disabled=!state.signedIn;
    renderSync(); renderRestore();
  }

  function openBind(){bindOpen=true;loginOpen=false;$('bindPanel').hidden=false;$('loginPanel').hidden=true;setMessage('');$('bindPanel').scrollIntoView({behavior:'smooth',block:'center'})}
  function closeBind(){bindOpen=false;$('bindPanel').hidden=true;setMessage('')}
  function openLogin(){
    if(latestAuth.signedIn&&!latestAuth.isAnonymous){setMessage(t('loginMemberInfo'),'ok');return}
    loginOpen=true;bindOpen=false;$('loginPanel').hidden=false;$('bindPanel').hidden=true;setMessage('');$('loginPanel').scrollIntoView({behavior:'smooth',block:'center'});
  }
  function closeLogin(){loginOpen=false;$('loginPanel').hidden=true;setMessage('')}

  async function waitAuth(){const state=await window.XingchenAuth?.init?.();render(state||window.XingchenAuth?.status?.()||{}); await handleReturnFromEmail()}

  async function sendBinding(){const email=$('emailInput').value.trim();setBusy(true);setMessage(t('testing'));const result=await window.XingchenAccountBinding.start(email);setBusy(false);if(!result.ok){setMessage(result.error,'bad');return}$('pendingRow').hidden=false;$('pendingValue').textContent=result.email;$('bindVerifyChoice').hidden=false;setMessage(t('sent'),'ok');bindOpen=true;render()}
  async function resendBinding(){const email=$('emailInput').value.trim()||window.XingchenAccountBinding.readPendingEmail();setBusy(true);setMessage(t('testing'));const result=await window.XingchenAccountBinding.resend(email);setBusy(false);if(result.ok){$('bindVerifyChoice').hidden=false;setMessage(t('sent'),'ok')}else setMessage(result.error,'bad')}
  async function verifyBinding(){const pendingMode=window.XingchenAccountBinding?.readPendingMode?.()||'';const email=$('emailInput').value.trim()||window.XingchenAccountBinding.readPendingEmail();const code=otpValue('bindOtpBoxes');setBusy(true);setMessage(t('testing'));const result=await window.XingchenAccountBinding.verify(email,code);setBusy(false);if(!result.ok){setMessage(result.error,'bad');return}await window.XingchenAuth.refreshUser();await window.XingchenCloudSync?.syncAll?.('account-email-confirmed');window.XingchenAccountBinding?.clearPending?.();bindOpen=false;clearOtp('bindOtpBoxes');render();setMessage((result.mode||pendingMode)==='change'?t('successChange'):t('successBind'),'ok')}
  async function checkBindingLink(){setBusy(true);setMessage(t('testing'));await window.XingchenAuth?.refreshUser?.();const st=window.XingchenAuth?.status?.()||{};setBusy(false);if(st.signedIn&&!st.isAnonymous&&st.email){const mode=window.XingchenAccountBinding?.readPendingMode?.()||'';window.XingchenAccountBinding?.clearPending?.();bindOpen=false;await window.XingchenCloudSync?.syncAll?.('email-link-confirmed');render(st);setMessage(mode==='change'?t('successChange'):t('successBind'),'ok')}else setMessage(t('mailDesc'),'bad')}

  async function sendLogin(){const email=$('loginEmailInput').value.trim();setBusy(true);setMessage(t('testing'));const result=await window.XingchenAccountLogin.start(email);setBusy(false);if(!result.ok){setMessage(result.error,'bad');return}$('loginPendingRow').hidden=false;$('loginPendingValue').textContent=result.email;$('loginVerifyChoice').hidden=false;loginOpen=true;setMessage(t('loginSent'),'ok');render()}
  async function resendLogin(){const email=$('loginEmailInput').value.trim()||window.XingchenAccountLogin?.readPendingLogin?.()?.email;setBusy(true);setMessage(t('testing'));const result=await window.XingchenAccountLogin.resend(email);setBusy(false);if(result.ok){$('loginVerifyChoice').hidden=false;setMessage(t('loginSent'),'ok')}else setMessage(result.error,'bad')}
  async function verifyLogin(){const pending=window.XingchenAccountLogin?.readPendingLogin?.();const email=$('loginEmailInput').value.trim()||pending?.email||'';const code=otpValue('loginOtpBoxes');setBusy(true);setMessage(t('testing'));const result=await window.XingchenAccountLogin.verify(email,code);setBusy(false);if(!result.ok){setMessage(result.error,'bad');return}await window.XingchenAuth?.refreshUser?.();loginOpen=false;clearOtp('loginOtpBoxes');render();renderRestore();setMessage(t('restoreChoiceDesc'),'ok')}
  async function checkLoginLink(){setBusy(true);setMessage(t('testing'));const result=await window.XingchenAccountLogin.checkLinkResult();setBusy(false);if(!result.ok){setMessage(result.error,'bad');return}loginOpen=false;render();renderRestore();setMessage(t('restoreChoiceDesc'),'ok')}

  async function finishRestore(choice){setBusy(true);setMessage(t('restoreWorking'));const result=await window.XingchenAccountLogin.finishRestore(choice);setBusy(false);if(!result.ok){setMessage(result.error,'bad');return}applyText();render(window.XingchenAuth?.status?.()||{});setMessage(choice==='cloud'?t('restoreDone'):t('mergeDone'),'ok')}

  function openLogoutConfirm(){ if(!(latestAuth.signedIn&&!latestAuth.isAnonymous))return; $('logoutConfirmBox').hidden=false; setMessage(''); $('logoutConfirmBox').scrollIntoView({behavior:'smooth',block:'center'}); }
  function closeLogoutConfirm(){ $('logoutConfirmBox').hidden=true; }
  async function logoutAndSwitch(){
    setBusy(true); setMessage(t('logoutWorking'));
    const result=await window.XingchenAuth?.signOutToGuest?.();
    setBusy(false);
    if(!result?.ok){ setMessage(result?.error||'Sign out failed.','bad'); return; }
    $('logoutConfirmBox').hidden=true; bindOpen=false; loginOpen=true; clearOtp('bindOtpBoxes'); clearOtp('loginOtpBoxes');
    applyText(); render(window.XingchenAuth?.status?.()||{}); $('loginPanel').hidden=false;
    setMessage(t('logoutDone'),'ok');
    setTimeout(()=>$('loginPanel').scrollIntoView({behavior:'smooth',block:'center'}),120);
  }

  async function sync(){setBusy(true);setMessage(t('testing'));const result=await window.XingchenCloudSync?.syncAll?.('account-center');setBusy(false);renderSync(result||{});if(result?.phase==='ready')setMessage(t('syncOk'),'ok');else if(result?.phase==='restore-choice')setMessage(t('restoreChoiceDesc'),'bad');else setMessage(result?.error||result?.phase||'Sync unavailable','bad')}
  async function copyUuid(){const full=$('uuidValue').dataset.full||'';if(!full)return;try{await navigator.clipboard.writeText(full)}catch(_){const ta=document.createElement('textarea');ta.value=full;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}const btn=$('copyUuid');const old=btn.textContent;btn.textContent=t('copied');setTimeout(()=>btn.textContent=old,1200)}

  async function handleReturnFromEmail(){
    const q=new URLSearchParams(location.search);
    if(q.get('binding')==='confirmed'){
      const mode=window.XingchenAccountBinding?.readPendingMode?.()||'';await window.XingchenAuth?.refreshUser?.();const st=window.XingchenAuth?.status?.()||{};
      if(st.signedIn&&!st.isAnonymous){window.XingchenAccountBinding?.clearPending?.();bindOpen=false;await window.XingchenCloudSync?.syncAll?.('email-link-confirmed');render(st);setMessage(mode==='change'?t('successChange'):t('successBind'),'ok')}
      history.replaceState({},document.title,location.pathname);
    }
    if(q.get('login')==='confirmed'){
      const result=await window.XingchenAccountLogin?.checkLinkResult?.();
      if(result?.ok){loginOpen=false;render();renderRestore();setMessage(t('restoreChoiceDesc'),'ok')}
      history.replaceState({},document.title,location.pathname);
    } else {
      const pending=window.XingchenAccountLogin?.readRestorePending?.();const st=window.XingchenAuth?.status?.()||{};
      if(pending?.fromUserId&&st.userId&&pending.fromUserId!==st.userId&&!st.isAnonymous){window.XingchenAccountLogin?.markAuthenticated?.(window.XingchenAuth?.getUser?.());renderRestore()}
    }
  }

  function init(){
    createOtpBoxes('bindOtpBoxes');createOtpBoxes('loginOtpBoxes');applyText();
    $('emailAction').addEventListener('click',openBind); $('loginAction').addEventListener('click',openLogin); $('closeBind').addEventListener('click',closeBind); $('closeLogin').addEventListener('click',closeLogin);
    $('sendBtn').addEventListener('click',sendBinding); $('resendBtn').addEventListener('click',resendBinding); $('verifyBtn').addEventListener('click',verifyBinding); $('bindCheckLinkBtn').addEventListener('click',checkBindingLink);
    $('loginSendBtn').addEventListener('click',sendLogin); $('loginResendBtn').addEventListener('click',resendLogin); $('loginVerifyBtn').addEventListener('click',verifyLogin); $('loginCheckLinkBtn').addEventListener('click',checkLoginLink);
    $('restoreCloudBtn').addEventListener('click',()=>finishRestore('cloud')); $('restoreMergeBtn').addEventListener('click',()=>finishRestore('merge')); $('syncBtn').addEventListener('click',sync); $('copyUuid').addEventListener('click',copyUuid);
    $('logoutAction').addEventListener('click',openLogoutConfirm); $('logoutCancelBtn').addEventListener('click',closeLogoutConfirm); $('logoutConfirmBtn').addEventListener('click',logoutAndSwitch);
    window.addEventListener('stellar:auth-state',e=>{render(e.detail||{});renderRestore()}); window.addEventListener('stellar:cloud-sync-state',e=>renderSync(e.detail||{})); window.addEventListener('stellar:cloud-sync-complete',e=>renderSync(e.detail||{})); window.addEventListener('stellar:account-restore-pending',()=>renderRestore());
    waitAuth();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
