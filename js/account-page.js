(() => {
  const LANG_KEY = 'xingchen-language';
  const PROFILE_KEY = 'xingchen-player-profile-v1';
  let bindOpen = false;
  let latestAuth = {};

  const T = {
    'zh-CN': {
      brand:'星辰日记', home:'返回首页', eyebrow:'V0.10.7.7 · CLOUD ACCOUNT CENTER',
      titleGuest:'云端账号', titleMember:'云端账号',
      leadGuest:'先以游客身份轻松使用；绑定邮箱后可保护当前云端身份，并为跨设备恢复做好准备。',
      leadMember:'管理你的正式会员身份、邮箱安全与云端资料。功能入口优先呈现，技术信息收纳在页面底部。',
      guest:'游客', member:'正式会员', traveler:'星辰旅人', tempIdentity:'临时云端身份', noEmail:'尚未绑定邮箱',
      syncReady:'云端同步已开启', syncWorking:'正在同步资料…', syncOffline:'目前离线 · 本机副本仍保留', syncWaiting:'等待云端身份', syncPartial:'部分资料等待重试',
      securityTitle:'账号与安全', securityDesc:'管理邮箱绑定与未来的账号恢复方式。', bindEmail:'绑定邮箱', changeEmail:'更换绑定邮箱', bindEmailDesc:'绑定后可保护当前 UUID，并为跨设备恢复做准备。', changeEmailDesc:'更换验证邮箱，原有云端资料与 UUID 不会改变。',
      restoreTitle:'换设备登录 / 恢复账号', restoreDesc:'下一阶段加入使用已绑定邮箱在新设备恢复云端资料。', soon:'下一阶段',
      syncTitle:'云端同步', syncDesc:'资料采用 local-first；云端与本机合并，本机副本不会因为同步成功而删除。', syncNow:'立即同步资料', syncHintReady:'你的资料会持续与云端合并。', syncHintWait:'云端身份准备完成后即可同步。', lastSync:'最后同步：', never:'尚未同步',
      dataTitle:'云端资料', dataDesc:'快速查看目前保存在这个云端身份下的资料概况。', fortune:'每日签', tarot:'塔罗记录', natal:'本命星盘', synastry:'两人合盘',
      bindTitle:'绑定邮箱保护账号', changeTitle:'更换绑定邮箱', support:'支持 QQ邮箱、Foxmail、163、126、Outlook、iCloud、Gmail 等常用邮箱。', emailLabel:'邮箱地址', emailPlaceholder:'例如 123456@qq.com', send:'发送验证邮件', resend:'重新发送',
      sent:'验证邮件已发送。请打开邮件中的确认链接；如果模板提供 6 位验证码，也可以在下方输入。', otpLabel:'6 位验证码（可选）', otpPlaceholder:'000000', verify:'验证并完成', testing:'处理中…',
      pending:'待确认邮箱', pendingHint:'如果没有收到邮件，请等待至少 60 秒后再重新发送。',
      successBind:'邮箱绑定完成。当前 UUID 已升级为正式云端账号，原有资料仍在同一个账号下。', successChange:'邮箱更换完成。原有云端资料与 UUID 保持不变。',
      techTitle:'账号技术信息', identity:'云端身份', temporary:'临时云端身份', bound:'正式云端账号', local:'本机模式', email:'绑定邮箱', uuid:'User UUID', techLastSync:'最后同步', copy:'复制', copied:'已复制',
      back:'返回首页', noCloud:'尚未建立云端身份。', syncOk:'全部资料同步完成，本机副本仍会保留。'
    },
    'zh-TW': {
      brand:'星辰日記', home:'返回首頁', eyebrow:'V0.10.7.7 · CLOUD ACCOUNT CENTER',
      titleGuest:'雲端帳號', titleMember:'雲端帳號', leadGuest:'先以遊客身分輕鬆使用；綁定信箱後可保護目前雲端身分，並為跨裝置恢復做好準備。', leadMember:'管理你的正式會員身分、信箱安全與雲端資料。功能入口優先呈現，技術資訊收納在頁面底部。',
      guest:'遊客', member:'正式會員', traveler:'星辰旅人', tempIdentity:'臨時雲端身分', noEmail:'尚未綁定信箱', syncReady:'雲端同步已開啟', syncWorking:'正在同步資料…', syncOffline:'目前離線 · 本機副本仍保留', syncWaiting:'等待雲端身分', syncPartial:'部分資料等待重試',
      securityTitle:'帳號與安全', securityDesc:'管理信箱綁定與未來的帳號恢復方式。', bindEmail:'綁定信箱', changeEmail:'更換綁定信箱', bindEmailDesc:'綁定後可保護目前 UUID，並為跨裝置恢復做準備。', changeEmailDesc:'更換驗證信箱，原有雲端資料與 UUID 不會改變。', restoreTitle:'換裝置登入 / 恢復帳號', restoreDesc:'下一階段加入使用已綁定信箱在新裝置恢復雲端資料。', soon:'下一階段',
      syncTitle:'雲端同步', syncDesc:'資料採 local-first；雲端與本機合併，本機副本不會因為同步成功而刪除。', syncNow:'立即同步資料', syncHintReady:'你的資料會持續與雲端合併。', syncHintWait:'雲端身分準備完成後即可同步。', lastSync:'最後同步：', never:'尚未同步',
      dataTitle:'雲端資料', dataDesc:'快速查看目前保存在這個雲端身分下的資料概況。', fortune:'每日籤', tarot:'塔羅紀錄', natal:'本命星盤', synastry:'兩人合盤',
      bindTitle:'綁定信箱保護帳號', changeTitle:'更換綁定信箱', support:'支援 QQ信箱、Foxmail、163、126、Outlook、iCloud、Gmail 等常用信箱。', emailLabel:'信箱地址', emailPlaceholder:'例如 123456@qq.com', send:'傳送驗證郵件', resend:'重新傳送', sent:'驗證郵件已傳送。請開啟郵件中的確認連結；若範本提供 6 位驗證碼，也可以在下方輸入。', otpLabel:'6 位驗證碼（選填）', otpPlaceholder:'000000', verify:'驗證並完成', testing:'處理中…', pending:'待確認信箱', pendingHint:'如果沒有收到郵件，請等待至少 60 秒後再重新傳送。', successBind:'信箱綁定完成。目前 UUID 已升級為正式雲端帳號，原有資料仍在同一個帳號下。', successChange:'信箱更換完成。原有雲端資料與 UUID 保持不變。',
      techTitle:'帳號技術資訊', identity:'雲端身分', temporary:'臨時雲端身分', bound:'正式雲端帳號', local:'本機模式', email:'綁定信箱', uuid:'User UUID', techLastSync:'最後同步', copy:'複製', copied:'已複製', back:'返回首頁', noCloud:'尚未建立雲端身分。', syncOk:'全部資料同步完成，本機副本仍會保留。'
    },
    en: {
      brand:'Stellar Diary', home:'Back home', eyebrow:'V0.10.7.7 · CLOUD ACCOUNT CENTER', titleGuest:'Cloud account', titleMember:'Cloud account', leadGuest:'Use the site instantly as a guest. Link an email to protect this cloud identity and prepare for cross-device recovery.', leadMember:'Manage your member identity, email security and cloud data. Everyday actions come first; technical details stay at the bottom.',
      guest:'Guest', member:'Member', traveler:'Stellar traveler', tempIdentity:'Temporary cloud identity', noEmail:'No email linked', syncReady:'Cloud sync is on', syncWorking:'Syncing data…', syncOffline:'Offline · local copy kept', syncWaiting:'Waiting for cloud identity', syncPartial:'Some data will retry', securityTitle:'Account & security', securityDesc:'Manage your linked email and future recovery options.', bindEmail:'Link email', changeEmail:'Change linked email', bindEmailDesc:'Protect this UUID and prepare for cross-device recovery.', changeEmailDesc:'Change the verification email without moving cloud data or changing your UUID.', restoreTitle:'Sign in on another device / recover', restoreDesc:'The next phase will restore cloud data on a new device using your linked email.', soon:'Next phase', syncTitle:'Cloud sync', syncDesc:'Local-first: cloud and local copies merge, and successful sync never deletes the local copy.', syncNow:'Sync now', syncHintReady:'Your records continue to merge with the cloud.', syncHintWait:'Sync becomes available when cloud identity is ready.', lastSync:'Last sync:', never:'Not synced yet', dataTitle:'Cloud data', dataDesc:'A quick overview of records stored under this cloud identity.', fortune:'Daily fortunes', tarot:'Tarot readings', natal:'Natal charts', synastry:'Synastry', bindTitle:'Link email to protect account', changeTitle:'Change linked email', support:'Supports QQ Mail, Foxmail, 163, 126, Outlook, iCloud, Gmail and other standard email providers.', emailLabel:'Email address', emailPlaceholder:'name@example.com', send:'Send verification email', resend:'Resend', sent:'Verification email sent. Open the confirmation link; if the template provides a 6-digit code, you may enter it below.', otpLabel:'6-digit code (optional)', otpPlaceholder:'000000', verify:'Verify & finish', testing:'Working…', pending:'Pending email', pendingHint:'If it does not arrive, wait at least 60 seconds before resending.', successBind:'Email binding complete. The same UUID is now a permanent cloud account and existing data stays in place.', successChange:'Email change complete. Existing cloud data and UUID remain unchanged.', techTitle:'Account technical details', identity:'Cloud identity', temporary:'Temporary cloud identity', bound:'Bound cloud account', local:'Local-only mode', email:'Linked email', uuid:'User UUID', techLastSync:'Last sync', copy:'Copy', copied:'Copied', back:'Back home', noCloud:'No cloud identity is available yet.', syncOk:'All data synced. Local copies are still kept.'
    }
  };

  function lang(){try{const v=localStorage.getItem(LANG_KEY);return T[v]?v:'zh-CN'}catch(_){return'zh-CN'}}
  function t(k){return T[lang()][k]??T['zh-CN'][k]??k}
  function $(id){return document.getElementById(id)}
  function readProfile(){try{const p=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null');return p&&p.name?{name:String(p.name),gender:String(p.gender||'')}:null}catch(_){return null}}
  function genderSymbol(g){return g==='male'?'♂':g==='female'?'♀':''}
  function formatDate(value){if(!value)return t('never');const d=new Date(value);if(Number.isNaN(d.getTime()))return value;try{return new Intl.DateTimeFormat(lang(),{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(d)}catch(_){return d.toLocaleString()}}
  function maskUuid(v){const s=String(v||'');return s.length>16?`${s.slice(0,8)}…${s.slice(-4)}`:s||'—'}

  function applyText(){
    document.documentElement.lang=lang();
    $('brandText').textContent=t('brand'); $('topHome').textContent=t('home'); $('eyebrow').textContent=t('eyebrow');
    $('securityTitle').textContent=t('securityTitle'); $('securityDesc').textContent=t('securityDesc'); $('restoreTitle').textContent=t('restoreTitle'); $('restoreDesc').textContent=t('restoreDesc'); $('restoreSoon').textContent=t('soon');
    $('syncTitle').textContent=t('syncTitle'); $('syncDesc').textContent=t('syncDesc'); $('syncBtn').textContent=t('syncNow'); $('lastSyncLabel').textContent=t('lastSync');
    $('dataTitle').textContent=t('dataTitle'); $('dataDesc').textContent=t('dataDesc'); $('fortuneLabel').textContent=t('fortune'); $('tarotLabel').textContent=t('tarot'); $('natalLabel').textContent=t('natal'); $('synastryLabel').textContent=t('synastry');
    $('supportText').textContent=t('support'); $('emailLabel').textContent=t('emailLabel'); $('emailInput').placeholder=t('emailPlaceholder'); $('sendBtn').textContent=t('send'); $('resendBtn').textContent=t('resend'); $('pendingTitle').textContent=t('pending'); $('otpLabel').textContent=t('otpLabel'); $('otpInput').placeholder=t('otpPlaceholder'); $('verifyBtn').textContent=t('verify');
    $('techTitle').textContent=t('techTitle'); $('identityLabel').textContent=t('identity'); $('emailStatusLabel').textContent=t('email'); $('uuidLabel').textContent=t('uuid'); $('techLastSyncLabel').textContent=t('techLastSync'); $('copyUuid').textContent=t('copy'); $('backBtn').textContent=t('back');
  }

  function setMessage(message,kind=''){const el=$('message');el.className=`account-message ${kind}`.trim();el.textContent=message||'';el.hidden=!message}
  function setBusy(b){['sendBtn','resendBtn','verifyBtn','syncBtn','emailAction'].forEach(id=>{const el=$(id);if(el)el.disabled=b})}

  function renderSync(sync=window.XingchenCloudSync?.status?.()||{}){
    const c=sync.counts||{}; $('fortuneCount').textContent=Number(c.fortune||0); $('tarotCount').textContent=Number(c.tarot||0); $('natalCount').textContent=Number(c.natal||0); $('synastryCount').textContent=Number(c.synastry||0);
    $('lastSyncValue').textContent=formatDate(sync.lastSyncAt); $('techLastSyncValue').textContent=formatDate(sync.lastSyncAt);
    let state=t('syncWaiting'),hint=t('syncHintWait');
    if(sync.phase==='syncing'){state=t('syncWorking');hint=t('syncHintReady')}
    else if(sync.phase==='ready'){state=t('syncReady');hint=t('syncHintReady')}
    else if(sync.phase==='partial'){state=t('syncPartial');hint=sync.error||t('syncHintReady')}
    else if(sync.phase==='offline'){state=t('syncOffline');hint=t('syncHintWait')}
    $('syncState').textContent=state; $('syncHint').textContent=hint; $('memberSyncText').textContent=state;
  }

  function render(state=window.XingchenAuth?.status?.()||{}){
    latestAuth=state||{};
    const member=Boolean(state.signedIn&&!state.isAnonymous); const pending=window.XingchenAccountBinding?.readPendingEmail?.()||''; const profile=readProfile();
    $('title').textContent=member?t('titleMember'):t('titleGuest'); $('lead').textContent=member?t('leadMember'):t('leadGuest');
    $('memberCard').classList.toggle('is-guest',!member); $('memberCard').classList.toggle('is-member',member); $('memberStatus').textContent=member?t('member'):t('guest');
    $('memberName').textContent=profile?.name||t('traveler'); $('memberGender').textContent=genderSymbol(profile?.gender);
    $('memberEmail').textContent=state.email||pending||(state.signedIn?t('tempIdentity'):t('noCloud'));
    $('emailActionTitle').textContent=member?t('changeEmail'):t('bindEmail'); $('emailActionDesc').textContent=member?t('changeEmailDesc'):t('bindEmailDesc');
    $('bindTitle').textContent=member?t('changeTitle'):t('bindTitle');
    $('identityValue').textContent=!state.signedIn?(state.phase==='local-only'?t('local'):t('noCloud')):(state.isAnonymous?t('temporary'):t('bound'));
    $('emailValue').textContent=state.email||pending||t('noEmail'); $('uuidValue').textContent=maskUuid(state.userId); $('uuidValue').dataset.full=state.userId||'';
    if(pending){$('pendingRow').hidden=false;$('pendingValue').textContent=pending;$('pendingHint').textContent=t('pendingHint');if(!$('emailInput').value)$('emailInput').value=pending;bindOpen=true}
    else $('pendingRow').hidden=true;
    $('bindPanel').hidden=!bindOpen;
    if(!state.signedIn) $('emailAction').disabled=true;
    else $('emailAction').disabled=false;
    renderSync();
  }

  function openBind(){bindOpen=true;$('bindPanel').hidden=false;$('bindPanel').scrollIntoView({behavior:'smooth',block:'center'})}
  function closeBind(){bindOpen=false;$('bindPanel').hidden=true;setMessage('')}

  async function waitAuth(){const state=await window.XingchenAuth?.init?.();render(state||window.XingchenAuth?.status?.()||{})}

  async function sendBinding(){const email=$('emailInput').value.trim();setBusy(true);setMessage(t('testing'));const wasMember=Boolean(latestAuth.signedIn&&!latestAuth.isAnonymous);const result=await window.XingchenAccountBinding.start(email);setBusy(false);if(!result.ok){setMessage(result.error,'bad');return}$('pendingRow').hidden=false;$('pendingValue').textContent=result.email;$('pendingHint').textContent=t('pendingHint');setMessage(t('sent'),'ok');bindOpen=true;render(); if(wasMember) $('bindTitle').textContent=t('changeTitle')}
  async function resend(){const email=$('emailInput').value.trim()||window.XingchenAccountBinding.readPendingEmail();setBusy(true);setMessage(t('testing'));const result=await window.XingchenAccountBinding.resend(email);setBusy(false);setMessage(result.ok?t('sent'):result.error,result.ok?'ok':'bad')}
  async function verify(){const pendingMode=window.XingchenAccountBinding?.readPendingMode?.()||'';const email=$('emailInput').value.trim()||window.XingchenAccountBinding.readPendingEmail();const code=$('otpInput').value.trim();setBusy(true);setMessage(t('testing'));const result=await window.XingchenAccountBinding.verify(email,code);setBusy(false);if(!result.ok){setMessage(result.error,'bad');return}await window.XingchenAuth.refreshUser();await window.XingchenCloudSync?.syncAll?.('account-email-confirmed');bindOpen=false;render();setMessage((result.mode||pendingMode)==='change'?t('successChange'):t('successBind'),'ok')}
  async function sync(){setBusy(true);setMessage(t('testing'));const result=await window.XingchenCloudSync?.syncAll?.('account-center');setBusy(false);renderSync(result||{});if(result?.phase==='ready')setMessage(t('syncOk'),'ok');else setMessage(result?.error||result?.phase||'Sync unavailable','bad')}
  async function copyUuid(){const full=$('uuidValue').dataset.full||'';if(!full)return;try{await navigator.clipboard.writeText(full)}catch(_){const ta=document.createElement('textarea');ta.value=full;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}const btn=$('copyUuid');const old=btn.textContent;btn.textContent=t('copied');setTimeout(()=>btn.textContent=old,1200)}

  function init(){
    applyText();
    $('emailAction').addEventListener('click',openBind); $('closeBind').addEventListener('click',closeBind); $('sendBtn').addEventListener('click',sendBinding); $('resendBtn').addEventListener('click',resend); $('verifyBtn').addEventListener('click',verify); $('syncBtn').addEventListener('click',sync); $('copyUuid').addEventListener('click',copyUuid);
    window.addEventListener('stellar:auth-state',e=>render(e.detail||{})); window.addEventListener('stellar:cloud-sync-state',e=>renderSync(e.detail||{})); window.addEventListener('stellar:cloud-sync-complete',e=>renderSync(e.detail||{}));
    waitAuth();
    const q=new URLSearchParams(location.search);
    if(q.get('binding')==='confirmed') setTimeout(async()=>{const pendingMode=window.XingchenAccountBinding?.readPendingMode?.()||'';await window.XingchenAuth?.refreshUser?.();const st=window.XingchenAuth?.status?.()||{};window.XingchenAccountBinding?.clearPending?.();bindOpen=false;render(st);if(st.signedIn&&!st.isAnonymous){await window.XingchenCloudSync?.syncAll?.('email-link-confirmed');renderSync();setMessage(pendingMode==='change'?t('successChange'):t('successBind'),'ok')}history.replaceState({},document.title,location.pathname)},450);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
