(() => {
  'use strict';

  const BUILD = '0.16.0';
  const MAX_MAIL = 60;
  const POLL_MS = 90 * 1000;
  let mailRows = [];
  let gmRole = '';
  let isGm = false;
  let activeFilter = 'all';
  let selectedMailId = null;
  let busy = false;
  let pollTimer = null;

  const TEXT = {
    'zh-CN': {
      mailbox:'星辰信箱', gm:'GM 管理', all:'全部', unread:'未读', attachments:'有附件', empty:'目前没有信件。', loading:'正在读取信件…',
      announcement:'更新公告', reward:'系统奖励', unreadMark:'未读', claimed:'已领取', expired:'已过期', permanent:'永久', claim:'领取附件', claimAll:'一键领取全部',
      memberOnly:'请先绑定正式邮箱账号后再领取附件。', claimOk:'附件已领取', claimFail:'领取失败', close:'关闭', published:'已发布', gmTitle:'GM 管理台',
      sendMail:'发布系统信件', mailTitle:'标题', mailBody:'内容', mailType:'信件类型', audience:'发送对象', allPlayers:'全体玩家', onePlayer:'指定 UID', targetUid:'目标玩家 UID', expiry:'有效期限', forever:'永久', days7:'7 天', days14:'14 天', days30:'30 天',
      rewards:'附件奖励', coins:'金币', exp:'EXP', blind:'蔬果盲盒', carrot:'红萝卜种子', wheat:'小麦种子', corn:'玉米种子', tomato:'番茄种子', strawberry:'草莓种子', pumpkin:'南瓜种子', grape:'葡萄种子', starfruit:'星辰果种子', fertLow:'低级肥料', fertMid:'中级肥料', fertHigh:'高级肥料',
      publish:'确认发布', preview:'发送后玩家会立即在信箱看到这封信。奖励附件每个正式账号只能领取一次。', recent:'最近发布', noHistory:'尚无发布记录。', confirmSend:'确定发布这封系统信件吗？', sent:'系统信件已发布', invalidTarget:'请输入正确的玩家 UID。', bind:'绑定账号', setup:'系统信箱尚未启用，请先执行 018_system_mail_gm.sql。'
    },
    'zh-TW': {
      mailbox:'星辰信箱', gm:'GM 管理', all:'全部', unread:'未讀', attachments:'有附件', empty:'目前沒有信件。', loading:'正在讀取信件…',
      announcement:'更新公告', reward:'系統獎勵', unreadMark:'未讀', claimed:'已領取', expired:'已過期', permanent:'永久', claim:'領取附件', claimAll:'一鍵領取全部',
      memberOnly:'請先綁定正式信箱帳號後再領取附件。', claimOk:'附件已領取', claimFail:'領取失敗', close:'關閉', published:'已發布', gmTitle:'GM 管理台',
      sendMail:'發布系統信件', mailTitle:'標題', mailBody:'內容', mailType:'信件類型', audience:'發送對象', allPlayers:'全體玩家', onePlayer:'指定 UID', targetUid:'目標玩家 UID', expiry:'有效期限', forever:'永久', days7:'7 天', days14:'14 天', days30:'30 天',
      rewards:'附件獎勵', coins:'金幣', exp:'EXP', blind:'蔬果盲盒', carrot:'紅蘿蔔種子', wheat:'小麥種子', corn:'玉米種子', tomato:'番茄種子', strawberry:'草莓種子', pumpkin:'南瓜種子', grape:'葡萄種子', starfruit:'星辰果種子', fertLow:'低級肥料', fertMid:'中級肥料', fertHigh:'高級肥料',
      publish:'確認發布', preview:'發送後玩家會立即在信箱看到這封信。獎勵附件每個正式帳號只能領取一次。', recent:'最近發布', noHistory:'尚無發布紀錄。', confirmSend:'確定發布這封系統信件嗎？', sent:'系統信件已發布', invalidTarget:'請輸入正確的玩家 UID。', bind:'綁定帳號', setup:'系統信箱尚未啟用，請先執行 018_system_mail_gm.sql。'
    },
    en: {
      mailbox:'Stellar Mail', gm:'GM Console', all:'All', unread:'Unread', attachments:'Attachments', empty:'No mail yet.', loading:'Loading mail…',
      announcement:'Update', reward:'Reward', unreadMark:'Unread', claimed:'Claimed', expired:'Expired', permanent:'Permanent', claim:'Claim attachments', claimAll:'Claim all',
      memberOnly:'Bind a permanent email account before claiming rewards.', claimOk:'Attachments claimed', claimFail:'Claim failed', close:'Close', published:'Published', gmTitle:'GM Console',
      sendMail:'Publish system mail', mailTitle:'Title', mailBody:'Content', mailType:'Mail type', audience:'Audience', allPlayers:'All players', onePlayer:'Specific UID', targetUid:'Target player UID', expiry:'Expiry', forever:'Permanent', days7:'7 days', days14:'14 days', days30:'30 days',
      rewards:'Attachments', coins:'Coins', exp:'EXP', blind:'Produce mystery box', carrot:'Carrot seeds', wheat:'Wheat seeds', corn:'Corn seeds', tomato:'Tomato seeds', strawberry:'Strawberry seeds', pumpkin:'Pumpkin seeds', grape:'Grape seeds', starfruit:'Starfruit seeds', fertLow:'Basic fertilizer', fertMid:'Medium fertilizer', fertHigh:'Advanced fertilizer',
      publish:'Publish', preview:'Players will see this mail immediately. Each permanent account can claim each attachment only once.', recent:'Recent mail', noHistory:'No published mail yet.', confirmSend:'Publish this system mail?', sent:'System mail published', invalidTarget:'Enter a valid player UID.', bind:'Bind account', setup:'Mailbox is not enabled yet. Run 018_system_mail_gm.sql first.'
    }
  };

  const FARM_ICONS = Object.freeze({coin:1,exp:2,'reward-box':6,'seed-carrot':36,'seed-wheat':37,'seed-corn':38,'seed-tomato':39,'seed-strawberry':40,'seed-pumpkin':41,'seed-grape':42,'seed-starfruit':43,mailbox:44,announcement:45,attachment:46,'claim-all':47,mail:48});
  const REWARD_LABELS = Object.freeze({
    coins:['coin','coins'], exp:['exp','exp'], mystery:['reward-box','blind'], carrot:['seed-carrot','carrot'], wheat:['seed-wheat','wheat'], corn:['seed-corn','corn'], tomato:['seed-tomato','tomato'], strawberry:['seed-strawberry','strawberry'], pumpkin:['seed-pumpkin','pumpkin'], grape:['seed-grape','grape'], starfruit:['seed-starfruit','starfruit']
  });

  function locale() {
    try { return ['zh-CN','zh-TW','en'].includes(localStorage.getItem('xingchen-language')) ? localStorage.getItem('xingchen-language') : 'zh-CN'; } catch (_) { return 'zh-CN'; }
  }
  function t(key) { return TEXT[locale()]?.[key] || TEXT['zh-CN'][key] || key; }
  function esc(value='') { return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }
  function client() { return window.XingchenSupabase?.getClient?.() || null; }
  function auth() { return window.XingchenAuth?.status?.() || {}; }
  function formalMember() { const a=auth(); return Boolean(a.signedIn && !a.isAnonymous && a.userId); }
  function rpcMissing(error) { return /PGRST202|could not find|function .* does not exist|schema cache/i.test(String(error?.message || error || '')); }

  function farmIcon(key, className='') {
    const index = FARM_ICONS[key] || 6;
    const col = (index - 1) % 8, row = Math.floor((index - 1) / 8);
    return `<span class="mail-farm-icon ${className}" style="--mail-farm-x:${(col/7)*100}%;--mail-farm-y:${(row/5)*100}%" aria-hidden="true"></span>`;
  }
  function siteIcon(cell, className='') {
    const col = (cell - 1) % 6, row = Math.floor((cell - 1) / 6);
    return `<span class="mail-site-icon ${className}" style="--mail-site-x:${(col/5)*100}%;--mail-site-y:${(row/3)*100}%" aria-hidden="true"></span>`;
  }

  function hasRewards(row) {
    const r = row?.rewards;
    if (!r || typeof r !== 'object') return false;
    if ((Number(r.coins)||0) > 0 || (Number(r.exp)||0) > 0) return true;
    return Object.values(r.seeds || {}).some(v => Number(v)>0) || Object.values(r.supplies || {}).some(v => Number(v)>0);
  }

  function rewardItems(rewards={}) {
    const items=[];
    const add=(icon,labelKey,qty)=>{qty=Number(qty)||0;if(qty>0)items.push({icon,label:t(labelKey),qty});};
    add('coin','coins',rewards.coins); add('exp','exp',rewards.exp);
    const seeds=rewards.seeds||{};
    add('seed-carrot','carrot',seeds.carrot); add('seed-wheat','wheat',seeds.wheat); add('seed-corn','corn',seeds.corn); add('seed-tomato','tomato',seeds.tomato);
    add('seed-strawberry','strawberry',seeds.strawberry); add('seed-pumpkin','pumpkin',seeds.pumpkin); add('seed-grape','grape',seeds.grape); add('seed-starfruit','starfruit',seeds.starfruit); add('reward-box','blind',seeds.mystery);
    const supplies=rewards.supplies||{};
    if (Number(supplies.fertilizerLow)>0) items.push({siteCell:22,label:t('fertLow'),qty:Number(supplies.fertilizerLow)});
    if (Number(supplies.fertilizerMid)>0) items.push({siteCell:22,label:t('fertMid'),qty:Number(supplies.fertilizerMid)});
    if (Number(supplies.fertilizerHigh)>0) items.push({siteCell:22,label:t('fertHigh'),qty:Number(supplies.fertilizerHigh)});
    return items;
  }
  function rewardMarkup(rewards, compact=false) {
    const items=rewardItems(rewards);
    if (!items.length) return '';
    return `<div class="mail-reward-list ${compact?'is-compact':''}">${items.map(item=>`<span>${item.siteCell?siteIcon(item.siteCell,'is-reward-icon'):farmIcon(item.icon,'is-reward-icon')}<b>${esc(item.label)}</b><em>×${item.qty}</em></span>`).join('')}</div>`;
  }

  function formatDate(value) {
    if (!value) return '';
    const d=new Date(value); if (!Number.isFinite(d.getTime())) return '';
    return d.toLocaleString(locale()==='en'?'en-US':locale()==='zh-TW'?'zh-TW':'zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  }

  function ensureShell() {
    if (!document.getElementById('stellarMailboxModal')) {
      const modal=document.createElement('div');
      modal.id='stellarMailboxModal'; modal.className='stellar-mail-modal'; modal.hidden=true;
      modal.innerHTML=`<div class="stellar-mail-backdrop" data-mail-close></div><section class="stellar-mail-dialog" role="dialog" aria-modal="true" aria-label="${esc(t('mailbox'))}"><header><div>${farmIcon('mailbox','is-mail-title-icon')}<span><small>STELLAR MAIL</small><b data-mail-title>${esc(t('mailbox'))}</b></span></div><button type="button" data-mail-close aria-label="${esc(t('close'))}">${siteIcon(11,'is-close-icon')}</button></header><div class="stellar-mail-body" id="stellarMailboxBody"></div></section>`;
      document.body.appendChild(modal);
    }
  }

  function ensureHeaderButtons() {
    const a=auth();
    if (!a.signedIn || a.isAnonymous) { document.querySelectorAll('[data-stellar-mail-entry],[data-stellar-gm-entry]').forEach(el=>el.remove()); return; }
    const badge=document.querySelector('[data-player-profile]');
    let accountTools=document.querySelector('.stellar-account-tools');
    if (badge && !accountTools) {
      accountTools=document.createElement('span'); accountTools.className='stellar-account-tools';
      badge.parentNode.insertBefore(accountTools,badge); accountTools.appendChild(badge);
    }
    if (!document.querySelector('[data-stellar-mail-entry]')) {
      const btn=document.createElement('button'); btn.type='button'; btn.className='stellar-mail-entry'; btn.dataset.stellarMailEntry=''; btn.innerHTML=`${farmIcon('mailbox')}<span class="stellar-mail-count" hidden></span>`; btn.title=t('mailbox'); btn.setAttribute('aria-label',t('mailbox'));
      if (accountTools) accountTools.appendChild(btn);
      else {
        const topbar=document.querySelector('.topbar'); const home=topbar?.querySelector('.home-link');
        if (home) home.insertAdjacentElement('beforebegin',btn); else topbar?.appendChild(btn);
      }
    }
    if (isGm && !document.querySelector('[data-stellar-gm-entry]')) {
      const btn=document.createElement('button'); btn.type='button'; btn.className='stellar-gm-entry'; btn.dataset.stellarGmEntry=''; btn.textContent='GM'; btn.title=t('gm');
      const mail=document.querySelector('[data-stellar-mail-entry]');
      if (accountTools) accountTools.appendChild(btn); else mail?.insertAdjacentElement('afterend',btn);
    }
    if (!isGm) document.querySelector('[data-stellar-gm-entry]')?.remove();
  }

  async function checkGm() {
    const sb=client(); if (!sb || !formalMember()) { isGm=false;gmRole='';ensureHeaderButtons();return; }
    try {
      const {data,error}=await sb.rpc('is_gm_v1'); if(error) throw error;
      const row=Array.isArray(data)?data[0]:data;
      isGm=Boolean(row?.is_gm); gmRole=row?.role||'';
    } catch (_) { isGm=false; gmRole=''; }
    ensureHeaderButtons();
  }

  async function refreshUnread() {
    const sb=client(); if (!sb || !formalMember()) return;
    try {
      const {data,error}=await sb.rpc('get_mailbox_unread_v1'); if(error) throw error;
      const n=Math.max(0,Number(data)||0); const badge=document.querySelector('.stellar-mail-count');
      if (badge) { badge.hidden=n<=0; badge.textContent=n>99?'99+':String(n); }
    } catch (_) {}
  }

  async function loadMailbox(force=false) {
    if (busy && !force) return;
    const body=document.getElementById('stellarMailboxBody'); if(body) body.innerHTML=`<div class="stellar-mail-loading">${esc(t('loading'))}</div>`;
    const sb=client(); if(!sb){ if(body)body.innerHTML=`<div class="stellar-mail-empty">${esc(t('setup'))}</div>`; return; }
    try {
      const {data,error}=await sb.rpc('get_mailbox_v1',{p_limit:MAX_MAIL}); if(error) throw error;
      mailRows=Array.isArray(data)?data:[];
      if(selectedMailId && !mailRows.some(x=>Number(x.id)===Number(selectedMailId))) selectedMailId=null;
      renderMailbox(); refreshUnread();
    } catch(error) {
      if(body) body.innerHTML=`<div class="stellar-mail-empty">${esc(rpcMissing(error)?t('setup'):String(error?.message||error))}</div>`;
    }
  }

  function filteredRows() {
    return mailRows.filter(row => activeFilter==='all' || (activeFilter==='unread' && !row.read_at) || (activeFilter==='attachments' && hasRewards(row)));
  }

  function renderMailbox() {
    const body=document.getElementById('stellarMailboxBody'); if(!body)return;
    const rows=filteredRows();
    const selected=mailRows.find(row=>Number(row.id)===Number(selectedMailId)) || rows[0] || null;
    if(selected && !selectedMailId) selectedMailId=selected.id;
    body.innerHTML=`<div class="stellar-mail-toolbar"><div class="stellar-mail-tabs"><button data-mail-filter="all" class="${activeFilter==='all'?'is-active':''}">${esc(t('all'))}</button><button data-mail-filter="unread" class="${activeFilter==='unread'?'is-active':''}">${esc(t('unread'))}</button><button data-mail-filter="attachments" class="${activeFilter==='attachments'?'is-active':''}">${esc(t('attachments'))}</button></div><button type="button" class="stellar-claim-all" data-mail-claim-all ${mailRows.some(r=>hasRewards(r)&&!r.claimed_at)?'':'disabled'}>${farmIcon('claim-all')}${esc(t('claimAll'))}</button></div>
      <div class="stellar-mail-layout"><div class="stellar-mail-list">${rows.length?rows.map(mailRowMarkup).join(''):`<div class="stellar-mail-empty">${esc(t('empty'))}</div>`}</div><div class="stellar-mail-detail">${selected?mailDetailMarkup(selected):`<div class="stellar-mail-empty">${esc(t('empty'))}</div>`}</div></div>`;
    if(selected && !selected.read_at) markRead(selected.id);
  }

  function mailRowMarkup(row) {
    const icon=row.mail_type==='reward'?'attachment':'announcement';
    const active=Number(row.id)===Number(selectedMailId);
    return `<button type="button" class="stellar-mail-row ${active?'is-active':''} ${row.read_at?'':'is-unread'}" data-mail-id="${row.id}">${farmIcon(icon,'is-list-icon')}<span><b>${esc(row.title)}</b><small>${esc(row.mail_type==='reward'?t('reward'):t('announcement'))} · ${esc(formatDate(row.created_at))}</small></span><em>${!row.read_at?`<i>${esc(t('unreadMark'))}</i>`:''}${hasRewards(row)?row.claimed_at?`<strong>✓ ${esc(t('claimed'))}</strong>`:`<strong>${esc(t('attachments'))}</strong>`:''}</em></button>`;
  }

  function mailDetailMarkup(row) {
    const expiry=row.expires_at?formatDate(row.expires_at):t('permanent');
    const canClaim=hasRewards(row)&&!row.claimed_at;
    return `<article class="stellar-mail-letter"><header><div>${farmIcon(row.mail_type==='reward'?'attachment':'announcement','is-letter-icon')}<span><small>${esc(row.mail_type==='reward'?t('reward'):t('announcement'))}</small><h3>${esc(row.title)}</h3></span></div><time>${esc(formatDate(row.created_at))}</time></header><div class="stellar-mail-copy">${esc(row.body||'').replace(/\n/g,'<br>')}</div>${hasRewards(row)?`<section class="stellar-mail-attachments"><b>${esc(t('attachments'))}</b>${rewardMarkup(row.rewards)}</section>`:''}<footer><small>${esc(t('expiry'))}: ${esc(expiry)}</small>${hasRewards(row)?row.claimed_at?`<span class="stellar-mail-claimed">✓ ${esc(t('claimed'))}</span>`:`<button type="button" data-mail-claim="${row.id}" ${formalMember()?'':'disabled'}>${farmIcon('attachment')}${esc(formalMember()?t('claim'):t('bind'))}</button>`:''}</footer></article>`;
  }

  async function markRead(id) {
    const row=mailRows.find(x=>Number(x.id)===Number(id)); if(!row||row.read_at)return;
    row.read_at=new Date().toISOString(); refreshUnread();
    try { await client()?.rpc('mark_system_mail_read_v1',{p_mail_id:Number(id)}); } catch(_){}
  }

  async function claimMail(id,{quiet=false}={}) {
    if(busy)return false; const sb=client(); if(!sb)return false;
    if(!formalMember()){ if(!quiet) alert(t('memberOnly')); return false; }
    busy=true;
    try {
      const {data,error}=await sb.rpc('claim_system_mail_v1',{p_mail_id:Number(id)}); if(error)throw error;
      const result=Array.isArray(data)?data[0]:data;
      if(!result?.ok){ if(!quiet) alert(result?.reason==='already_claimed'?t('claimed'):result?.reason==='member_required'?t('memberOnly'):t('claimFail')); return false; }
      const row=mailRows.find(x=>Number(x.id)===Number(id)); if(row){row.claimed_at=new Date().toISOString();row.read_at=row.read_at||new Date().toISOString();}
      window.dispatchEvent(new CustomEvent('stellar:mail-reward-claimed',{detail:{mailId:Number(id),rewards:result.rewards||{},farmState:result.farm_state||null,revision:Number(result.revision)||0}}));
      if(!quiet) alert(t('claimOk'));
      return true;
    } catch(error) { if(!quiet) alert(`${t('claimFail')}：${String(error?.message||error)}`); return false; }
    finally { busy=false; renderMailbox(); refreshUnread(); }
  }

  async function claimAll() {
    const list=mailRows.filter(r=>hasRewards(r)&&!r.claimed_at); if(!list.length)return;
    for(const row of list) await claimMail(row.id,{quiet:true});
    alert(t('claimOk')); await loadMailbox(true);
  }

  function openMailbox() { ensureShell(); const modal=document.getElementById('stellarMailboxModal'); modal.hidden=false; document.body.classList.add('stellar-mail-open'); selectedMailId=null; loadMailbox(true); }
  function closeMailbox() { const modal=document.getElementById('stellarMailboxModal'); if(modal)modal.hidden=true; document.body.classList.remove('stellar-mail-open'); }

  function gmRewardInputs() {
    const fields=[['coins','coins'],['exp','exp'],['mystery','blind'],['carrot','carrot'],['wheat','wheat'],['corn','corn'],['tomato','tomato'],['strawberry','strawberry'],['pumpkin','pumpkin'],['grape','grape'],['starfruit','starfruit'],['fertilizerLow','fertLow'],['fertilizerMid','fertMid'],['fertilizerHigh','fertHigh']];
    return fields.map(([key,label])=>`<label><span>${esc(t(label))}</span><input type="number" min="0" step="1" value="0" data-gm-reward="${key}"></label>`).join('');
  }

  function ensureGmModal() {
    if(document.getElementById('stellarGmModal'))return;
    const modal=document.createElement('div'); modal.id='stellarGmModal'; modal.className='stellar-mail-modal stellar-gm-modal'; modal.hidden=true;
    modal.innerHTML=`<div class="stellar-mail-backdrop" data-gm-close></div><section class="stellar-mail-dialog stellar-gm-dialog" role="dialog" aria-modal="true"><header><div>${farmIcon('announcement','is-mail-title-icon')}<span><small>STELLAR DIARY</small><b>${esc(t('gmTitle'))}</b></span></div><button type="button" data-gm-close>${siteIcon(11,'is-close-icon')}</button></header><div class="stellar-gm-body"><section class="stellar-gm-form"><h3>${esc(t('sendMail'))}</h3><label class="is-wide"><span>${esc(t('mailTitle'))}</span><input type="text" maxlength="120" id="gmMailTitle"></label><label class="is-wide"><span>${esc(t('mailBody'))}</span><textarea maxlength="6000" rows="7" id="gmMailBody"></textarea></label><div class="stellar-gm-grid"><label><span>${esc(t('mailType'))}</span><select id="gmMailType"><option value="announcement">${esc(t('announcement'))}</option><option value="reward">${esc(t('reward'))}</option></select></label><label><span>${esc(t('audience'))}</span><select id="gmMailAudience"><option value="all">${esc(t('allPlayers'))}</option><option value="user">${esc(t('onePlayer'))}</option></select></label><label id="gmTargetWrap" hidden><span>${esc(t('targetUid'))}</span><input type="text" id="gmTargetUid" placeholder="00000000-0000-0000-0000-000000000000"></label><label><span>${esc(t('expiry'))}</span><select id="gmExpiry"><option value="0">${esc(t('forever'))}</option><option value="7">${esc(t('days7'))}</option><option value="14">${esc(t('days14'))}</option><option value="30">${esc(t('days30'))}</option></select></label></div><h4>${esc(t('rewards'))}</h4><div class="stellar-gm-rewards">${gmRewardInputs()}</div><p class="stellar-gm-note">${esc(t('preview'))}</p><button type="button" class="stellar-gm-publish" data-gm-publish>${farmIcon('announcement')}${esc(t('publish'))}</button></section><section class="stellar-gm-history"><h3>${esc(t('recent'))}</h3><div id="gmMailHistory"></div></section></div></section>`;
    document.body.appendChild(modal);
  }

  function readGmRewards() {
    const out={}; const seeds={},supplies={};
    document.querySelectorAll('[data-gm-reward]').forEach(input=>{
      const n=Math.max(0,Math.floor(Number(input.value)||0)); if(!n)return; const key=input.dataset.gmReward;
      if(key==='coins'||key==='exp')out[key]=n;
      else if(key.startsWith('fertilizer')) supplies[key]=n;
      else seeds[key]=n;
    });
    if(Object.keys(seeds).length)out.seeds=seeds; if(Object.keys(supplies).length)out.supplies=supplies; return out;
  }

  async function loadGmHistory() {
    const host=document.getElementById('gmMailHistory'); if(!host)return; host.innerHTML=`<div class="stellar-mail-loading">${esc(t('loading'))}</div>`;
    try{
      const {data,error}=await client().rpc('gm_list_system_mail_v1',{p_limit:30}); if(error)throw error;
      const rows=Array.isArray(data)?data:[]; host.innerHTML=rows.length?rows.map(r=>`<article class="stellar-gm-history-row">${farmIcon(r.mail_type==='reward'?'attachment':'announcement')}<span><b>#${r.id} · ${esc(r.title)}</b><small>${esc(r.audience_type==='all'?t('allPlayers'):`${t('onePlayer')} ${r.target_user_id||''}`)} · ${esc(formatDate(r.created_at))}</small>${rewardMarkup(r.rewards,true)}</span></article>`).join(''):`<div class="stellar-mail-empty">${esc(t('noHistory'))}</div>`;
    }catch(error){host.innerHTML=`<div class="stellar-mail-empty">${esc(String(error?.message||error))}</div>`;}
  }

  async function publishGmMail() {
    if(!isGm||busy)return; const title=document.getElementById('gmMailTitle')?.value.trim()||''; if(!title)return;
    const body=document.getElementById('gmMailBody')?.value||''; const mailType=document.getElementById('gmMailType')?.value||'announcement'; const audience=document.getElementById('gmMailAudience')?.value||'all';
    const target=(document.getElementById('gmTargetUid')?.value||'').trim(); if(audience==='user'&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(target)){alert(t('invalidTarget'));return;}
    const days=Number(document.getElementById('gmExpiry')?.value)||0; const start=new Date(); const expires=days?new Date(start.getTime()+days*86400000).toISOString():null; const rewards=readGmRewards();
    if(!confirm(t('confirmSend')))return; busy=true;
    try{
      const {data,error}=await client().rpc('gm_send_system_mail_v1',{p_title:title,p_body:body,p_mail_type:mailType,p_audience_type:audience,p_target_user_id:audience==='user'?target:null,p_rewards:rewards,p_starts_at:start.toISOString(),p_expires_at:expires}); if(error)throw error;
      alert(`${t('sent')} #${data}`); document.getElementById('gmMailTitle').value=''; document.getElementById('gmMailBody').value=''; document.querySelectorAll('[data-gm-reward]').forEach(i=>i.value='0'); await loadGmHistory(); await refreshUnread();
    }catch(error){alert(String(error?.message||error));}finally{busy=false;}
  }

  function openGm() { if(!isGm)return; ensureGmModal(); document.getElementById('stellarGmModal').hidden=false; document.body.classList.add('stellar-mail-open'); loadGmHistory(); }
  function closeGm() { const m=document.getElementById('stellarGmModal'); if(m)m.hidden=true; document.body.classList.remove('stellar-mail-open'); }

  function handleClick(event) {
    if(event.target.closest('[data-stellar-mail-entry]')){openMailbox();return;}
    if(event.target.closest('[data-stellar-gm-entry]')){openGm();return;}
    if(event.target.closest('[data-mail-close]')){closeMailbox();return;}
    if(event.target.closest('[data-gm-close]')){closeGm();return;}
    const filter=event.target.closest('[data-mail-filter]'); if(filter){activeFilter=filter.dataset.mailFilter;selectedMailId=null;renderMailbox();return;}
    const row=event.target.closest('[data-mail-id]'); if(row){selectedMailId=Number(row.dataset.mailId);renderMailbox();return;}
    const claim=event.target.closest('[data-mail-claim]'); if(claim){claimMail(Number(claim.dataset.mailClaim));return;}
    if(event.target.closest('[data-mail-claim-all]')){claimAll();return;}
    if(event.target.closest('[data-gm-publish]')){publishGmMail();return;}
  }

  function handleChange(event) {
    if(event.target.matches('#gmMailAudience')){const wrap=document.getElementById('gmTargetWrap');if(wrap)wrap.hidden=event.target.value!=='user';}
  }

  async function refreshIdentity() {
    ensureShell(); await checkGm(); ensureHeaderButtons(); await refreshUnread();
  }

  function init() {
    console.info(`[Stellar Mail] build ${BUILD}`);
    ensureShell(); document.addEventListener('click',handleClick); document.addEventListener('change',handleChange);
    window.addEventListener('stellar:auth-state',()=>setTimeout(refreshIdentity,60));
    window.addEventListener('stellar:language-changed',()=>{ensureHeaderButtons();});
    refreshIdentity();
    pollTimer=setInterval(()=>{if(!document.hidden)refreshUnread();},POLL_MS);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
