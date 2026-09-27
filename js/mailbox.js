(() => {
  'use strict';

  const BUILD = '0.16.1';
  const MAX_MAIL = 60;
  const POLL_MS = 90 * 1000;
  let mailRows = [];
  let gmRole = '';
  let isGm = false;
  let activeFilter = 'all';
  let selectedMailId = null;
  let busy = false;
  let pollTimer = null;
  let itemCatalog = [];
  let itemCatalogLoaded = false;
  let gmAttachments = [];
  let gmTargetVerified = null;

  const TEXT = {
    'zh-CN': {
      mailbox:'星辰信箱', gm:'GM 管理', all:'全部', unread:'未读', attachments:'有附件', empty:'目前没有信件。', loading:'正在读取信件…',
      announcement:'更新公告', reward:'系统奖励', unreadMark:'未读', claimed:'已领取', expired:'已过期', permanent:'永久', claim:'领取附件', claimAll:'一键领取全部',
      memberOnly:'请先绑定正式邮箱账号后再领取附件。', claimOk:'附件已领取', claimFail:'领取失败', close:'关闭', published:'已发布', gmTitle:'GM 管理台',
      sendMail:'发布系统信件', mailTitle:'标题', mailBody:'内容', mailType:'信件类型', audience:'发送对象', allPlayers:'全体玩家', onePlayer:'指定 UID', targetUid:'目标玩家 UID', expiry:'有效期限', forever:'永久', days7:'7 天', days14:'14 天', days30:'30 天',
      rewards:'附件奖励', coins:'金币', exp:'EXP', blind:'蔬果盲盒', carrot:'红萝卜种子', wheat:'小麦种子', corn:'玉米种子', tomato:'番茄种子', strawberry:'草莓种子', pumpkin:'南瓜种子', grape:'葡萄种子', starfruit:'星辰果种子', fertLow:'低级肥料', fertMid:'中级肥料', fertHigh:'高级肥料',
      publish:'确认发布', preview:'发送后玩家会立即在信箱看到这封信。奖励附件每个正式账号只能领取一次。', recent:'最近发布', noHistory:'尚无发布记录。', confirmSend:'确定发布这封系统信件吗？', sent:'系统信件已发布', invalidTarget:'请输入正确的玩家 UID。', bind:'绑定账号', setup:'系统信箱尚未启用，请先执行 018_system_mail_gm.sql。', itemCategory:'物品分类', itemSelect:'选择物品', itemQty:'数量', addAttachment:'加入附件', noAttachments:'尚未加入附件。', remove:'移除', itemId:'物品 ID', categoryAll:'全部分类', categoryCurrency:'货币', categorySeed:'种子', categoryBox:'盲盒', categorySupply:'农资', verifyUid:'验证 UID', playerVerified:'玩家已确认', playerNotFound:'找不到这个玩家 UID。', run019:'请先执行 019_mail_item_catalog.sql。'
    },
    'zh-TW': {
      mailbox:'星辰信箱', gm:'GM 管理', all:'全部', unread:'未讀', attachments:'有附件', empty:'目前沒有信件。', loading:'正在讀取信件…',
      announcement:'更新公告', reward:'系統獎勵', unreadMark:'未讀', claimed:'已領取', expired:'已過期', permanent:'永久', claim:'領取附件', claimAll:'一鍵領取全部',
      memberOnly:'請先綁定正式信箱帳號後再領取附件。', claimOk:'附件已領取', claimFail:'領取失敗', close:'關閉', published:'已發布', gmTitle:'GM 管理台',
      sendMail:'發布系統信件', mailTitle:'標題', mailBody:'內容', mailType:'信件類型', audience:'發送對象', allPlayers:'全體玩家', onePlayer:'指定 UID', targetUid:'目標玩家 UID', expiry:'有效期限', forever:'永久', days7:'7 天', days14:'14 天', days30:'30 天',
      rewards:'附件獎勵', coins:'金幣', exp:'EXP', blind:'蔬果盲盒', carrot:'紅蘿蔔種子', wheat:'小麥種子', corn:'玉米種子', tomato:'番茄種子', strawberry:'草莓種子', pumpkin:'南瓜種子', grape:'葡萄種子', starfruit:'星辰果種子', fertLow:'低級肥料', fertMid:'中級肥料', fertHigh:'高級肥料',
      publish:'確認發布', preview:'發送後玩家會立即在信箱看到這封信。獎勵附件每個正式帳號只能領取一次。', recent:'最近發布', noHistory:'尚無發布紀錄。', confirmSend:'確定發布這封系統信件嗎？', sent:'系統信件已發布', invalidTarget:'請輸入正確的玩家 UID。', bind:'綁定帳號', setup:'系統信箱尚未啟用，請先執行 018_system_mail_gm.sql。', itemCategory:'物品分類', itemSelect:'選擇物品', itemQty:'數量', addAttachment:'加入附件', noAttachments:'尚未加入附件。', remove:'移除', itemId:'物品 ID', categoryAll:'全部分類', categoryCurrency:'貨幣', categorySeed:'種子', categoryBox:'盲盒', categorySupply:'農資', verifyUid:'驗證 UID', playerVerified:'玩家已確認', playerNotFound:'找不到這個玩家 UID。', run019:'請先執行 019_mail_item_catalog.sql。'
    },
    en: {
      mailbox:'Stellar Mail', gm:'GM Console', all:'All', unread:'Unread', attachments:'Attachments', empty:'No mail yet.', loading:'Loading mail…',
      announcement:'Update', reward:'Reward', unreadMark:'Unread', claimed:'Claimed', expired:'Expired', permanent:'Permanent', claim:'Claim attachments', claimAll:'Claim all',
      memberOnly:'Bind a permanent email account before claiming rewards.', claimOk:'Attachments claimed', claimFail:'Claim failed', close:'Close', published:'Published', gmTitle:'GM Console',
      sendMail:'Publish system mail', mailTitle:'Title', mailBody:'Content', mailType:'Mail type', audience:'Audience', allPlayers:'All players', onePlayer:'Specific UID', targetUid:'Target player UID', expiry:'Expiry', forever:'Permanent', days7:'7 days', days14:'14 days', days30:'30 days',
      rewards:'Attachments', coins:'Coins', exp:'EXP', blind:'Produce mystery box', carrot:'Carrot seeds', wheat:'Wheat seeds', corn:'Corn seeds', tomato:'Tomato seeds', strawberry:'Strawberry seeds', pumpkin:'Pumpkin seeds', grape:'Grape seeds', starfruit:'Starfruit seeds', fertLow:'Basic fertilizer', fertMid:'Medium fertilizer', fertHigh:'Advanced fertilizer',
      publish:'Publish', preview:'Players will see this mail immediately. Each permanent account can claim each attachment only once.', recent:'Recent mail', noHistory:'No published mail yet.', confirmSend:'Publish this system mail?', sent:'System mail published', invalidTarget:'Enter a valid player UID.', bind:'Bind account', setup:'Mailbox is not enabled yet. Run 018_system_mail_gm.sql first.', itemCategory:'Item category', itemSelect:'Choose item', itemQty:'Quantity', addAttachment:'Add attachment', noAttachments:'No attachments added.', remove:'Remove', itemId:'Item ID', categoryAll:'All categories', categoryCurrency:'Currency', categorySeed:'Seeds', categoryBox:'Boxes', categorySupply:'Supplies', verifyUid:'Verify UID', playerVerified:'Player verified', playerNotFound:'Player UID not found.', run019:'Run 019_mail_item_catalog.sql first.'
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

  function catalogName(item) {
    if (!item) return '';
    return locale()==='en' ? (item.name_en || item.item_code) : locale()==='zh-TW' ? (item.name_zh_tw || item.name_zh_cn || item.item_code) : (item.name_zh_cn || item.item_code);
  }
  function categoryName(category) {
    return t(category==='currency'?'categoryCurrency':category==='seed'?'categorySeed':category==='box'?'categoryBox':'categorySupply');
  }
  function farmItemIcon(cell,className='') {
    const index=Math.max(1,Number(cell)||1), col=(index-1)%4,row=Math.floor((index-1)/4);
    return `<span class="mail-farm-item-icon ${className}" style="--mail-item-x:${(col/3)*100}%;--mail-item-y:${(row/3)*100}%" aria-hidden="true"></span>`;
  }
  function catalogIcon(item,className='') {
    if (!item) return farmIcon('reward-box',className);
    if (item.icon_source==='farm_item' && Number(item.icon_cell)>0) return farmItemIcon(item.icon_cell,className);
    if (item.icon_source==='site' && Number(item.icon_cell)>0) return siteIcon(item.icon_cell,className);
    return farmIcon(item.icon_key || 'reward-box',className);
  }
  async function loadItemCatalog(force=false) {
    if (itemCatalogLoaded && !force) return itemCatalog;
    const sb=client(); if(!sb)return itemCatalog;
    try {
      const {data,error}=await sb.rpc('get_mail_item_catalog_v1'); if(error)throw error;
      itemCatalog=Array.isArray(data)?data:[]; itemCatalogLoaded=true;
    } catch(error) {
      if (!rpcMissing(error)) console.warn('[Stellar Mail] item catalog:',error);
    }
    return itemCatalog;
  }
  function catalogById(id) { return itemCatalog.find(item=>Number(item.item_id)===Number(id)) || null; }

  function hasRewards(row) {
    const r=row?.rewards;
    if(!r||typeof r!=='object')return false;
    if(Array.isArray(r.items)&&r.items.some(x=>(Number(x?.quantity)||0)>0))return true;
    if((Number(r.coins)||0)>0||(Number(r.exp)||0)>0)return true;
    return Object.values(r.seeds||{}).some(v=>Number(v)>0)||Object.values(r.supplies||{}).some(v=>Number(v)>0);
  }

  function rewardItems(rewards={}) {
    const items=[];
    if(Array.isArray(rewards.items)){
      rewards.items.forEach(entry=>{
        const qty=Math.max(0,Number(entry?.quantity)||0); if(!qty)return;
        const item=catalogById(entry.item_id);
        items.push({catalog:item,label:item?catalogName(item):`#${entry.item_id}`,qty});
      });
    }
    const add=(icon,labelKey,qty)=>{qty=Number(qty)||0;if(qty>0)items.push({icon,label:t(labelKey),qty});};
    add('coin','coins',rewards.coins); add('exp','exp',rewards.exp);
    const seeds=rewards.seeds||{};
    add('seed-carrot','carrot',seeds.carrot); add('seed-wheat','wheat',seeds.wheat); add('seed-corn','corn',seeds.corn); add('seed-tomato','tomato',seeds.tomato);
    add('seed-strawberry','strawberry',seeds.strawberry); add('seed-pumpkin','pumpkin',seeds.pumpkin); add('seed-grape','grape',seeds.grape); add('seed-starfruit','starfruit',seeds.starfruit); add('reward-box','blind',seeds.mystery);
    const supplies=rewards.supplies||{};
    if(Number(supplies.fertilizerLow)>0)items.push({farmItemCell:5,label:t('fertLow'),qty:Number(supplies.fertilizerLow)});
    if(Number(supplies.fertilizerMid)>0)items.push({farmItemCell:6,label:t('fertMid'),qty:Number(supplies.fertilizerMid)});
    if(Number(supplies.fertilizerHigh)>0)items.push({farmItemCell:7,label:t('fertHigh'),qty:Number(supplies.fertilizerHigh)});
    return items;
  }
  function rewardMarkup(rewards,compact=false) {
    const items=rewardItems(rewards); if(!items.length)return '';
    return `<div class="mail-reward-list ${compact?'is-compact':''}">${items.map(item=>`<span>${item.catalog?catalogIcon(item.catalog,'is-reward-icon'):item.farmItemCell?farmItemIcon(item.farmItemCell,'is-reward-icon'):farmIcon(item.icon,'is-reward-icon')}<b>${esc(item.label)}</b><em>×${item.qty}</em></span>`).join('')}</div>`;
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

  async function openMailbox() { ensureShell(); await loadItemCatalog(); const modal=document.getElementById('stellarMailboxModal'); modal.hidden=false; document.body.classList.add('stellar-mail-open'); selectedMailId=null; loadMailbox(true); }
  function closeMailbox() { const modal=document.getElementById('stellarMailboxModal'); if(modal)modal.hidden=true; document.body.classList.remove('stellar-mail-open'); }

  function gmCategoryOptions() {
    return [['all','categoryAll'],['currency','categoryCurrency'],['seed','categorySeed'],['box','categoryBox'],['supply','categorySupply']]
      .map(([value,key])=>`<option value="${value}">${esc(t(key))}</option>`).join('');
  }
  function gmItemOptions(category='all') {
    const list=itemCatalog.filter(item=>category==='all'||item.category===category);
    return list.map(item=>`<option value="${item.item_id}">#${item.item_id} · ${esc(catalogName(item))} · ${esc(item.item_code)}</option>`).join('');
  }
  function renderGmItemSelect() {
    const select=document.getElementById('gmItemSelect'); if(!select)return;
    const category=document.getElementById('gmItemCategory')?.value||'all';
    const current=select.value;
    select.innerHTML=gmItemOptions(category)||`<option value="">${esc(t('run019'))}</option>`;
    if([...select.options].some(o=>o.value===current))select.value=current;
    renderGmItemMeta();
  }
  function renderGmItemMeta() {
    const host=document.getElementById('gmItemMeta'); if(!host)return;
    const item=catalogById(document.getElementById('gmItemSelect')?.value);
    host.innerHTML=item?`${catalogIcon(item,'is-gm-item-icon')}<span><b>${esc(catalogName(item))}</b><small>#${item.item_id} · ${esc(item.item_code)} · ${esc(categoryName(item.category))}</small></span>`:'';
  }
  function renderGmAttachments() {
    const host=document.getElementById('gmAttachmentList'); if(!host)return;
    if(!gmAttachments.length){host.innerHTML=`<div class="stellar-gm-no-attachments">${esc(t('noAttachments'))}</div>`;return;}
    host.innerHTML=gmAttachments.map(entry=>{
      const item=catalogById(entry.item_id);
      return `<article class="stellar-gm-attachment-row">${catalogIcon(item,'is-gm-attachment-icon')}<span><b>${esc(item?catalogName(item):`#${entry.item_id}`)}</b><small>#${entry.item_id}${item?` · ${esc(item.item_code)}`:''}</small></span><strong>×${entry.quantity}</strong><button type="button" data-gm-remove-item="${entry.item_id}" aria-label="${esc(t('remove'))}">${siteIcon(11,'is-remove-item')}</button></article>`;
    }).join('');
  }
  function addGmAttachment() {
    const itemId=Number(document.getElementById('gmItemSelect')?.value)||0;
    const item=catalogById(itemId); if(!item)return;
    const input=document.getElementById('gmItemQty');
    const qty=Math.max(1,Math.min(Number(item.max_quantity)||100000,Math.floor(Number(input?.value)||1)));
    const existing=gmAttachments.find(x=>Number(x.item_id)===itemId);
    if(existing)existing.quantity=Math.min(Number(item.max_quantity)||100000,existing.quantity+qty); else gmAttachments.push({item_id:itemId,quantity:qty});
    if(input)input.value='1'; renderGmAttachments();
  }
  function removeGmAttachment(itemId) { gmAttachments=gmAttachments.filter(x=>Number(x.item_id)!==Number(itemId)); renderGmAttachments(); }
  function readGmRewards() { return gmAttachments.length?{items:gmAttachments.map(x=>({item_id:Number(x.item_id),quantity:Number(x.quantity)}))}:{}; }

  async function verifyGmTarget() {
    const input=document.getElementById('gmTargetUid'); const host=document.getElementById('gmTargetStatus');
    const uid=(input?.value||'').trim().toLowerCase(); if(input)input.value=uid; gmTargetVerified=null;
    if(!host)return;
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uid)){host.textContent=t('invalidTarget');host.className='stellar-gm-target-status is-error';return;}
    host.textContent=t('loading');host.className='stellar-gm-target-status';
    try{
      const {data,error}=await client().rpc('gm_lookup_player_v1',{p_user_id:uid}); if(error)throw error;
      const row=Array.isArray(data)?data[0]:data;
      if(!row){host.textContent=t('playerNotFound');host.className='stellar-gm-target-status is-error';return;}
      gmTargetVerified=String(row.user_id);
      host.innerHTML=`<b>${esc(t('playerVerified'))}</b><span>${esc(row.display_name||'')} · Lv.${Number(row.farm_level)||1}${row.email?` · ${esc(row.email)}`:''}</span>`;
      host.className='stellar-gm-target-status is-ok';
    }catch(error){host.textContent=rpcMissing(error)?t('run019'):String(error?.message||error);host.className='stellar-gm-target-status is-error';}
  }

  function ensureGmModal() {
    if(document.getElementById('stellarGmModal'))return;
    const modal=document.createElement('div'); modal.id='stellarGmModal'; modal.className='stellar-mail-modal stellar-gm-modal'; modal.hidden=true;
    modal.innerHTML=`<div class="stellar-mail-backdrop" data-gm-close></div><section class="stellar-mail-dialog stellar-gm-dialog" role="dialog" aria-modal="true"><header><div>${farmIcon('announcement','is-mail-title-icon')}<span><small>STELLAR DIARY</small><b>${esc(t('gmTitle'))}</b></span></div><button type="button" data-gm-close>${siteIcon(11,'is-close-icon')}</button></header><div class="stellar-gm-body"><section class="stellar-gm-form"><h3>${esc(t('sendMail'))}</h3><label class="is-wide"><span>${esc(t('mailTitle'))}</span><input type="text" maxlength="120" id="gmMailTitle"></label><label class="is-wide"><span>${esc(t('mailBody'))}</span><textarea maxlength="6000" rows="7" id="gmMailBody"></textarea></label><div class="stellar-gm-grid"><label><span>${esc(t('mailType'))}</span><select id="gmMailType"><option value="announcement">${esc(t('announcement'))}</option><option value="reward">${esc(t('reward'))}</option></select></label><label><span>${esc(t('audience'))}</span><select id="gmMailAudience"><option value="all">${esc(t('allPlayers'))}</option><option value="user">${esc(t('onePlayer'))}</option></select></label><label id="gmTargetWrap" class="stellar-gm-target-wrap" hidden><span>${esc(t('targetUid'))}</span><span class="stellar-gm-uid-line"><input type="text" id="gmTargetUid" placeholder="00000000-0000-0000-0000-000000000000"><button type="button" data-gm-verify-uid>${esc(t('verifyUid'))}</button></span><small id="gmTargetStatus" class="stellar-gm-target-status"></small></label><label><span>${esc(t('expiry'))}</span><select id="gmExpiry"><option value="0">${esc(t('forever'))}</option><option value="7">${esc(t('days7'))}</option><option value="14">${esc(t('days14'))}</option><option value="30">${esc(t('days30'))}</option></select></label></div><h4>${esc(t('rewards'))}</h4><section class="stellar-gm-item-builder"><div class="stellar-gm-item-controls"><label><span>${esc(t('itemCategory'))}</span><select id="gmItemCategory">${gmCategoryOptions()}</select></label><label class="is-item-select"><span>${esc(t('itemSelect'))}</span><select id="gmItemSelect"></select></label><label class="is-qty"><span>${esc(t('itemQty'))}</span><input id="gmItemQty" type="number" min="1" step="1" value="1"></label><button type="button" class="stellar-gm-add-item" data-gm-add-item>${siteIcon(22,'is-add-item-icon')}${esc(t('addAttachment'))}</button></div><div id="gmItemMeta" class="stellar-gm-item-meta"></div><div id="gmAttachmentList" class="stellar-gm-attachment-list"></div></section><p class="stellar-gm-note">${esc(t('preview'))}</p><button type="button" class="stellar-gm-publish" data-gm-publish>${farmIcon('announcement')}${esc(t('publish'))}</button></section><section class="stellar-gm-history"><h3>${esc(t('recent'))}</h3><div id="gmMailHistory"></div></section></div></section>`;
    document.body.appendChild(modal);
    renderGmItemSelect(); renderGmAttachments();
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
    const target=(document.getElementById('gmTargetUid')?.value||'').trim().toLowerCase(); if(audience==='user'&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(target)){alert(t('invalidTarget'));return;} if(audience==='user'&&gmTargetVerified!==target){await verifyGmTarget();if(gmTargetVerified!==target)return;}
    const days=Number(document.getElementById('gmExpiry')?.value)||0; const start=new Date(); const expires=days?new Date(start.getTime()+days*86400000).toISOString():null; const rewards=readGmRewards();
    if(!confirm(t('confirmSend')))return; busy=true;
    try{
      const {data,error}=await client().rpc('gm_send_system_mail_v1',{p_title:title,p_body:body,p_mail_type:mailType,p_audience_type:audience,p_target_user_id:audience==='user'?target:null,p_rewards:rewards,p_starts_at:start.toISOString(),p_expires_at:expires}); if(error)throw error;
      alert(`${t('sent')} #${data}`); document.getElementById('gmMailTitle').value=''; document.getElementById('gmMailBody').value=''; gmAttachments=[]; renderGmAttachments(); await loadGmHistory(); await refreshUnread();
    }catch(error){alert(String(error?.message||error));}finally{busy=false;}
  }

  async function openGm() { if(!isGm)return; await loadItemCatalog(); ensureGmModal(); renderGmItemSelect(); renderGmAttachments(); document.getElementById('stellarGmModal').hidden=false; document.body.classList.add('stellar-mail-open'); loadGmHistory(); }
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
    if(event.target.closest('[data-gm-verify-uid]')){verifyGmTarget();return;}
    if(event.target.closest('[data-gm-add-item]')){addGmAttachment();return;}
    const removeItem=event.target.closest('[data-gm-remove-item]'); if(removeItem){removeGmAttachment(Number(removeItem.dataset.gmRemoveItem));return;}
    if(event.target.closest('[data-gm-publish]')){publishGmMail();return;}
  }

  function handleChange(event) {
    if(event.target.matches('#gmMailAudience')){const wrap=document.getElementById('gmTargetWrap');if(wrap)wrap.hidden=event.target.value!=='user';gmTargetVerified=null;}
    if(event.target.matches('#gmTargetUid')){gmTargetVerified=null;const host=document.getElementById('gmTargetStatus');if(host){host.textContent='';host.className='stellar-gm-target-status';}}
    if(event.target.matches('#gmItemCategory')){renderGmItemSelect();}
    if(event.target.matches('#gmItemSelect')){renderGmItemMeta();}
  }

  async function refreshIdentity() {
    ensureShell(); await checkGm(); ensureHeaderButtons(); await loadItemCatalog(); await refreshUnread();
  }

  function init() {
    console.info(`[Stellar Mail] build ${BUILD}`);
    ensureShell(); document.addEventListener('click',handleClick); document.addEventListener('change',handleChange);
    window.addEventListener('stellar:auth-state',()=>setTimeout(refreshIdentity,60));
    window.addEventListener('stellar:language-changed',()=>{ensureHeaderButtons(); if(document.getElementById('stellarGmModal')){renderGmItemSelect();renderGmAttachments();}});
    refreshIdentity();
    pollTimer=setInterval(()=>{if(!document.hidden)refreshUnread();},POLL_MS);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
