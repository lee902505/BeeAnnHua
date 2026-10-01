(() => {
  'use strict';

  const BUILD = '0.19.2';
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
  let gmHistoryRows = [];

  const TEXT = {
    'zh-CN': {
      mailbox:'星辰信箱', gm:'GM 管理', all:'全部', unread:'未读', attachments:'有附件', empty:'目前没有信件。', loading:'正在读取信件…',
      announcement:'更新公告', reward:'系统奖励', unreadMark:'未读', claimed:'已领取', expired:'已过期', permanent:'永久', claim:'领取附件', claimAll:'一键领取全部',
      memberOnly:'请先绑定正式邮箱账号后再领取附件。', claimOk:'附件已领取', claimFail:'领取失败', close:'关闭', published:'已发布', gmTitle:'GM 管理台',
      sendMail:'发布系统信件', mailTitle:'标题', mailBody:'内容', mailType:'信件类型', audience:'发送对象', allPlayers:'全体玩家', onePlayer:'指定 UID', targetUid:'目标玩家 UID', expiry:'有效期限', forever:'永久', days7:'D+7', days14:'D+14', days30:'D+30',
      rewards:'附件奖励', coins:'金币', exp:'EXP', blind:'蔬果盲盒', carrot:'红萝卜种子', wheat:'小麦种子', corn:'玉米种子', tomato:'番茄种子', strawberry:'草莓种子', pumpkin:'南瓜种子', grape:'葡萄种子', starfruit:'星辰果种子', fertLow:'低级肥料', fertMid:'中级肥料', fertHigh:'高级肥料', trainResetTicket:'火车重置券', noCatalogItems:'目前没有已开放的可发放物品。',
      publish:'确认发布', preview:'发送后玩家会立即在信箱看到这封信。奖励附件每个正式账号只能领取一次。', recent:'最近发布', noHistory:'尚无发布记录。', confirmSend:'确定发布这封系统信件吗？', sent:'系统信件已发布', invalidTarget:'请输入正确的玩家 UID。', bind:'绑定账号', setup:'系统信箱目前尚未启用。', itemCategory:'物品分类', itemSelect:'选择物品', itemQty:'数量', addAttachment:'加入附件', noAttachments:'尚未加入附件。', remove:'移除', itemId:'物品 ID', categoryAll:'全部分类', categoryCurrency:'货币', categorySeed:'种子', categoryBox:'盲盒', categorySupply:'农资', categoryOutfit:'时装', categoryDecoration:'装饰', categoryPet:'宠物', verifyUid:'验证 UID', playerVerified:'玩家已确认', playerNotFound:'找不到这个玩家 UID。', run019:'物品附件目录目前尚未启用。', claimedTab:'已领取', deleteMail:'删除邮件', deleteConfirm:'确定删除这封邮件吗？删除只会影响你的信箱。', deleteWithRewardsConfirm:'这封邮件还有未领取附件。确定删除吗？删除后将无法再领取附件。', deleteOk:'邮件已删除', deleteFail:'删除失败', expiresOn:'到期', claimSummary:'领取成功', mailsClaimed:'封邮件附件已领取', run020:'邮件附件与到期功能目前尚未启用。', clearClaimed:'清理已领取', clearClaimedConfirm:'确定从你的信箱移除所有已领取附件的邮件吗？未领取附件与普通公告不会被删除。', clearClaimedOk:'已清理已领取邮件', run021:'邮件批量清理功能目前尚未启用。', gmPreview:'预览邮件', previewTitle:'玩家视角预览', previewAudience:'发送对象', previewClose:'返回编辑', guestNotice:'游客可以阅读系统公告；绑定正式账号后即可领取邮件附件。', bindToClaim:'绑定账号后领取', guestAttachment:'绑定后可领取', allFuturePlayers:'全体玩家（包含未来）', currentPlayers:'目前全体玩家（发送后新玩家不收）', status:'状态', statusPublished:'已发布', statusWithdrawn:'已撤回', statusExpired:'已到期', withdrawMail:'撤回邮件', withdrawConfirm:'确定撤回这封系统邮件吗？撤回后所有玩家会立即看不到，但 GM 稽核记录会保留；已经领取的奖励不会自动回收。', withdrawOk:'邮件已撤回', copyMail:'复制此邮件', copyOk:'已复制到编辑区', run022:'系统信箱完整功能目前尚未启用。', confirmTitle:'请确认', confirmAction:'确定', cancel:'取消', currentOnlyHint:'仅发送当下已经存在的玩家可以收到。', unavailable:'邮件已撤回、过期或不在你的收件范围。'
    },
    'zh-TW': {
      mailbox:'星辰信箱', gm:'GM 管理', all:'全部', unread:'未讀', attachments:'有附件', empty:'目前沒有信件。', loading:'正在讀取信件…',
      announcement:'更新公告', reward:'系統獎勵', unreadMark:'未讀', claimed:'已領取', expired:'已過期', permanent:'永久', claim:'領取附件', claimAll:'一鍵領取全部',
      memberOnly:'請先綁定正式信箱帳號後再領取附件。', claimOk:'附件已領取', claimFail:'領取失敗', close:'關閉', published:'已發布', gmTitle:'GM 管理台',
      sendMail:'發布系統信件', mailTitle:'標題', mailBody:'內容', mailType:'信件類型', audience:'發送對象', allPlayers:'全體玩家', onePlayer:'指定 UID', targetUid:'目標玩家 UID', expiry:'有效期限', forever:'永久', days7:'D+7', days14:'D+14', days30:'D+30',
      rewards:'附件獎勵', coins:'金幣', exp:'EXP', blind:'蔬果盲盒', carrot:'紅蘿蔔種子', wheat:'小麥種子', corn:'玉米種子', tomato:'番茄種子', strawberry:'草莓種子', pumpkin:'南瓜種子', grape:'葡萄種子', starfruit:'星辰果種子', fertLow:'低級肥料', fertMid:'中級肥料', fertHigh:'高級肥料', trainResetTicket:'火車重置券', noCatalogItems:'目前沒有已開放的可發放物品。',
      publish:'確認發布', preview:'發送後玩家會立即在信箱看到這封信。獎勵附件每個正式帳號只能領取一次。', recent:'最近發布', noHistory:'尚無發布紀錄。', confirmSend:'確定發布這封系統信件嗎？', sent:'系統信件已發布', invalidTarget:'請輸入正確的玩家 UID。', bind:'綁定帳號', setup:'系統信箱目前尚未啟用。', itemCategory:'物品分類', itemSelect:'選擇物品', itemQty:'數量', addAttachment:'加入附件', noAttachments:'尚未加入附件。', remove:'移除', itemId:'物品 ID', categoryAll:'全部分類', categoryCurrency:'貨幣', categorySeed:'種子', categoryBox:'盲盒', categorySupply:'農資', categoryOutfit:'時裝', categoryDecoration:'裝飾', categoryPet:'寵物', verifyUid:'驗證 UID', playerVerified:'玩家已確認', playerNotFound:'找不到這個玩家 UID。', run019:'物品附件目錄目前尚未啟用。', claimedTab:'已領取', deleteMail:'刪除郵件', deleteConfirm:'確定刪除這封郵件嗎？刪除只會影響你的信箱。', deleteWithRewardsConfirm:'這封郵件還有未領取附件。確定刪除嗎？刪除後將無法再領取附件。', deleteOk:'郵件已刪除', deleteFail:'刪除失敗', expiresOn:'到期', claimSummary:'領取成功', mailsClaimed:'封郵件附件已領取', run020:'郵件附件與到期功能目前尚未啟用。', clearClaimed:'清理已領取', clearClaimedConfirm:'確定從你的信箱移除所有已領取附件的郵件嗎？未領取附件與普通公告不會被刪除。', clearClaimedOk:'已清理已領取郵件', run021:'郵件批次清理功能目前尚未啟用。', gmPreview:'預覽郵件', previewTitle:'玩家視角預覽', previewAudience:'發送對象', previewClose:'返回編輯', guestNotice:'遊客可以閱讀系統公告；綁定正式帳號後即可領取郵件附件。', bindToClaim:'綁定帳號後領取', guestAttachment:'綁定後可領取', allFuturePlayers:'全體玩家（包含未來）', currentPlayers:'目前全體玩家（發送後新玩家不收）', status:'狀態', statusPublished:'已發布', statusWithdrawn:'已撤回', statusExpired:'已到期', withdrawMail:'撤回郵件', withdrawConfirm:'確定撤回這封系統郵件嗎？撤回後所有玩家會立即看不到，但 GM 稽核紀錄會保留；已經領取的獎勵不會自動回收。', withdrawOk:'郵件已撤回', copyMail:'複製此郵件', copyOk:'已複製到編輯區', run022:'系統信箱完整功能目前尚未啟用。', confirmTitle:'請確認', confirmAction:'確定', cancel:'取消', currentOnlyHint:'僅發送當下已經存在的玩家可以收到。', unavailable:'郵件已撤回、過期或不在你的收件範圍。'
    },
    en: {
      mailbox:'Stellar Mail', gm:'GM Console', all:'All', unread:'Unread', attachments:'Attachments', empty:'No mail yet.', loading:'Loading mail…',
      announcement:'Update', reward:'Reward', unreadMark:'Unread', claimed:'Claimed', expired:'Expired', permanent:'Permanent', claim:'Claim attachments', claimAll:'Claim all',
      memberOnly:'Bind a permanent email account before claiming rewards.', claimOk:'Attachments claimed', claimFail:'Claim failed', close:'Close', published:'Published', gmTitle:'GM Console',
      sendMail:'Publish system mail', mailTitle:'Title', mailBody:'Content', mailType:'Mail type', audience:'Audience', allPlayers:'All players', onePlayer:'Specific UID', targetUid:'Target player UID', expiry:'Expiry', forever:'Permanent', days7:'D+7', days14:'D+14', days30:'D+30',
      rewards:'Attachments', coins:'Coins', exp:'EXP', blind:'Produce mystery box', carrot:'Carrot seeds', wheat:'Wheat seeds', corn:'Corn seeds', tomato:'Tomato seeds', strawberry:'Strawberry seeds', pumpkin:'Pumpkin seeds', grape:'Grape seeds', starfruit:'Starfruit seeds', fertLow:'Basic fertilizer', fertMid:'Medium fertilizer', fertHigh:'Advanced fertilizer', trainResetTicket:'Train reset ticket', noCatalogItems:'No released sendable items in this category yet.',
      publish:'Publish', preview:'Players will see this mail immediately. Each permanent account can claim each attachment only once.', recent:'Recent mail', noHistory:'No published mail yet.', confirmSend:'Publish this system mail?', sent:'System mail published', invalidTarget:'Enter a valid player UID.', bind:'Bind account', setup:'The mailbox is currently unavailable.', itemCategory:'Item category', itemSelect:'Choose item', itemQty:'Quantity', addAttachment:'Add attachment', noAttachments:'No attachments added.', remove:'Remove', itemId:'Item ID', categoryAll:'All categories', categoryCurrency:'Currency', categorySeed:'Seeds', categoryBox:'Boxes', categorySupply:'Supplies', categoryOutfit:'Outfits', categoryDecoration:'Decorations', categoryPet:'Pets', verifyUid:'Verify UID', playerVerified:'Player verified', playerNotFound:'Player UID not found.', run019:'The item attachment catalog is currently unavailable.', claimedTab:'Claimed', deleteMail:'Delete mail', deleteConfirm:'Delete this mail? This only removes it from your mailbox.', deleteWithRewardsConfirm:'This mail still has unclaimed attachments. Delete it anyway? You will not be able to claim them later.', deleteOk:'Mail deleted', deleteFail:'Delete failed', expiresOn:'Expires', claimSummary:'Claimed', mailsClaimed:'mail rewards claimed', run020:'Mail attachment and expiry features are currently unavailable.', clearClaimed:'Clear claimed', clearClaimedConfirm:'Remove all claimed reward mails from your mailbox? Unclaimed reward mail and normal announcements will be kept.', clearClaimedOk:'Claimed mail cleared', run021:'Bulk mail cleanup is currently unavailable.', gmPreview:'Preview mail', previewTitle:'Player preview', previewAudience:'Audience', previewClose:'Back to edit', guestNotice:'Guests can read system mail. Bind a permanent account to claim attachments.', bindToClaim:'Bind account to claim', guestAttachment:'Bind to claim', allFuturePlayers:'All players (including future)', currentPlayers:'Current players only', status:'Status', statusPublished:'Published', statusWithdrawn:'Withdrawn', statusExpired:'Expired', withdrawMail:'Withdraw mail', withdrawConfirm:'Withdraw this system mail? Players will lose access immediately and the GM audit record is retained. Rewards already claimed are not clawed back.', withdrawOk:'Mail withdrawn', copyMail:'Copy mail', copyOk:'Copied to editor', run022:'Full mailbox features are currently unavailable.', confirmTitle:'Confirm', confirmAction:'Confirm', cancel:'Cancel', currentOnlyHint:'Only accounts that already exist when this mail is published can receive it.', unavailable:'This mail was withdrawn, expired, or is outside your recipient scope.'
    }
  };

  const FARM_ICONS = Object.freeze({coin:1,exp:2,'reward-box':6,refresh:17,outfit:27,'seed-carrot':36,'seed-wheat':37,'seed-corn':38,'seed-tomato':39,'seed-strawberry':40,'seed-pumpkin':41,'seed-grape':42,'seed-starfruit':43,mailbox:44,announcement:45,attachment:46,'claim-all':47,mail:48});
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
  function signedInUser() { const a=auth(); return Boolean(a.signedIn && a.userId); }
  function accountUrl() { return location.pathname.includes('/pages/') ? '../account.html' : 'account.html'; }
  function rpcMissing(error) { return /PGRST202|could not find|function .* does not exist|schema cache/i.test(String(error?.message || error || '')); }


  function ensureFeedbackUi() {
    if(!document.getElementById('stellarMailToastHost')){
      const host=document.createElement('div'); host.id='stellarMailToastHost'; host.className='stellar-mail-toast-host'; host.setAttribute('aria-live','polite'); document.body.appendChild(host);
    }
  }
  function showToast(message,type='success',duration=3200) {
    ensureFeedbackUi(); const host=document.getElementById('stellarMailToastHost'); if(!host)return;
    const toast=document.createElement('div'); toast.className=`stellar-mail-toast is-${type}`;
    toast.innerHTML=`<span>${type==='error'?'!':'✓'}</span><div>${esc(message).replace(/\n/g,'<br>')}</div>`;
    host.appendChild(toast); requestAnimationFrame(()=>toast.classList.add('is-show'));
    setTimeout(()=>{toast.classList.remove('is-show');setTimeout(()=>toast.remove(),220);},duration);
  }
  function askConfirm(message,{title=t('confirmTitle'),confirmText=t('confirmAction'),danger=false}={}) {
    return new Promise(resolve=>{
      let modal=document.getElementById('stellarMailConfirmModal');
      if(modal)modal.remove();
      modal=document.createElement('div'); modal.id='stellarMailConfirmModal'; modal.className='stellar-mail-modal stellar-mail-confirm-modal';
      modal.innerHTML=`<div class="stellar-mail-backdrop" data-mail-confirm-cancel></div><section class="stellar-mail-confirm-card" role="alertdialog" aria-modal="true"><h3>${esc(title)}</h3><p>${esc(message).replace(/\n/g,'<br>')}</p><div><button type="button" data-mail-confirm-cancel>${esc(t('cancel'))}</button><button type="button" class="${danger?'is-danger':''}" data-mail-confirm-ok>${esc(confirmText)}</button></div></section>`;
      document.body.appendChild(modal);
      const finish=value=>{modal.remove();resolve(value);};
      modal.querySelector('[data-mail-confirm-ok]')?.addEventListener('click',()=>finish(true),{once:true});
      modal.querySelectorAll('[data-mail-confirm-cancel]').forEach(el=>el.addEventListener('click',()=>finish(false),{once:true}));
    });
  }

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
    const key = category==='currency' ? 'categoryCurrency'
      : category==='seed' ? 'categorySeed'
      : category==='box' ? 'categoryBox'
      : category==='outfit' ? 'categoryOutfit'
      : category==='decoration' ? 'categoryDecoration'
      : category==='pet' ? 'categoryPet'
      : 'categorySupply';
    return t(key);
  }
  function farmItemIcon(cell,className='') {
    const index=Math.max(1,Number(cell)||1), col=(index-1)%4,row=Math.floor((index-1)/4);
    return `<span class="mail-farm-item-icon ${className}" style="--mail-item-x:${(col/3)*100}%;--mail-item-y:${(row/3)*100}%" aria-hidden="true"></span>`;
  }
  function farmCatalogIcon(cell,className='') {
    const index=Math.max(1,Number(cell)||1), col=(index-1)%4,row=Math.floor((index-1)/4);
    return `<span class="mail-farm-catalog-icon ${className}" style="--mail-catalog-x:${(col/3)*100}%;--mail-catalog-y:${(row/3)*100}%" aria-hidden="true"></span>`;
  }
  function farmPetIcon(key='ya_ya',className='') {
    const files={ya_ya:'ya-ya-icon.png',shiba:'shiba-icon.png',orange_cat:'orange-cat-icon.png',moon_rabbit:'moon-rabbit-icon.png'};
    const file=files[key] || files.ya_ya;
    return `<span class="mail-farm-pet-icon ${className}" style="--mail-pet-image:url('../images/farm/pet/${file}?v=0.19.2')" aria-hidden="true"></span>`;
  }
  function catalogIcon(item,className='') {
    if (!item) return farmIcon('reward-box',className);
    if (item.icon_source==='farm_catalog' && Number(item.icon_cell)>0) return farmCatalogIcon(item.icon_cell,className);
    if (item.icon_source==='farm_pet') return farmPetIcon(item.icon_key || 'ya_ya',className);
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
    if(Number(supplies.trainResetTicket)>0)items.push({icon:'refresh',label:t('trainResetTicket'),qty:Number(supplies.trainResetTicket)});
    return items;
  }
  function rewardMarkup(rewards,compact=false) {
    const items=rewardItems(rewards); if(!items.length)return '';
    return `<div class="mail-reward-list ${compact?'is-compact':''}">${items.map(item=>`<span>${item.catalog?catalogIcon(item.catalog,'is-reward-icon'):item.farmItemCell?farmItemIcon(item.farmItemCell,'is-reward-icon'):farmIcon(item.icon,'is-reward-icon')}<b>${esc(item.label)}</b><em>×${item.qty}</em></span>`).join('')}</div>`;
  }

  function rewardSummaryText(rewards={}) {
    const items=rewardItems(rewards);
    return items.map(item=>`${item.label} ×${item.qty}`).join('、');
  }

  function formatDate(value) {
    if (!value) return '';
    const d=new Date(value); if (!Number.isFinite(d.getTime())) return '';
    return d.toLocaleString(locale()==='en'?'en-US':locale()==='zh-TW'?'zh-TW':'zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  }

  function formatExpiryDate(value) {
    if (!value) return '';
    const d=new Date(value); if (!Number.isFinite(d.getTime())) return '';
    return d.toLocaleDateString(locale()==='en'?'en-US':locale()==='zh-TW'?'zh-TW':'zh-CN',{month:'2-digit',day:'2-digit'});
  }
  function expiryMeta(row) {
    if (!row?.expires_at) return {permanent:true,days:0,label:t('permanent'),date:''};
    const start=new Date(row.starts_at||row.created_at||Date.now());
    const end=new Date(row.expires_at);
    const diff=(end.getTime()-start.getTime())/86400000;
    const days=Math.max(1,Math.round(diff));
    const date=formatExpiryDate(row.expires_at);
    const suffix=locale()==='en'?`${t('expiresOn')} ${date}`:`${date} ${t('expiresOn')}`;
    return {permanent:false,days,label:`D+${days} · ${suffix}`,date};
  }
  function expiryBadgeMarkup(row,className='') {
    const meta=expiryMeta(row);
    return `<span class="stellar-mail-expiry-badge ${meta.permanent?'is-permanent':''} ${className}">${esc(meta.label)}</span>`;
  }

  function recipientScopeLabel(scope,target='') {
    if(scope==='user') return `${t('onePlayer')}${target?` · ${target}`:''}`;
    if(scope==='current_all') return t('currentPlayers');
    return t('allFuturePlayers');
  }
  function gmRowStatus(row) {
    if(row?.withdrawn_at) return {key:'withdrawn',label:t('statusWithdrawn')};
    if(row?.expires_at && new Date(row.expires_at).getTime()<=Date.now()) return {key:'expired',label:t('statusExpired')};
    return {key:'published',label:t('statusPublished')};
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
    if (!a.signedIn) { document.querySelectorAll('[data-stellar-mail-entry],[data-stellar-gm-entry]').forEach(el=>el.remove()); return; }
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
    const sb=client(); if (!sb || !signedInUser()) return;
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
    return mailRows.filter(row => activeFilter==='all' || (activeFilter==='unread' && !row.read_at) || (activeFilter==='attachments' && hasRewards(row)) || (activeFilter==='claimed' && Boolean(row.claimed_at)));
  }

  function renderMailbox() {
    const body=document.getElementById('stellarMailboxBody'); if(!body)return;
    const rows=filteredRows();
    const selected=mailRows.find(row=>Number(row.id)===Number(selectedMailId)) || rows[0] || null;
    if(selected && !selectedMailId) selectedMailId=selected.id;
    const member=formalMember();
    body.innerHTML=`${member?'':`<div class="stellar-mail-guest-notice">${siteIcon(24,'is-guest-lock-icon')}<span>${esc(t('guestNotice'))}</span><button type="button" data-mail-bind>${esc(t('bind'))}</button></div>`}<div class="stellar-mail-toolbar"><div class="stellar-mail-tabs"><button data-mail-filter="all" class="${activeFilter==='all'?'is-active':''}">${esc(t('all'))}</button><button data-mail-filter="unread" class="${activeFilter==='unread'?'is-active':''}">${esc(t('unread'))}</button><button data-mail-filter="attachments" class="${activeFilter==='attachments'?'is-active':''}">${esc(t('attachments'))}</button>${member?`<button data-mail-filter="claimed" class="${activeFilter==='claimed'?'is-active':''}">${esc(t('claimedTab'))}</button>`:''}</div><div class="stellar-mail-toolbar-actions">${member?`<button type="button" class="stellar-claim-all" data-mail-claim-all ${mailRows.some(r=>hasRewards(r)&&!r.claimed_at)?'':'disabled'}>${farmIcon('claim-all')}${esc(t('claimAll'))}</button><button type="button" class="stellar-clear-claimed" data-mail-clear-claimed ${mailRows.some(r=>Boolean(r.claimed_at))?'':'disabled'}>${siteIcon(13,'is-clear-claimed-icon')}${esc(t('clearClaimed'))}</button>`:`<button type="button" class="stellar-bind-to-claim" data-mail-bind>${siteIcon(24,'is-bind-lock-icon')}${esc(t('bindToClaim'))}</button>`}</div></div>
      <div class="stellar-mail-layout"><div class="stellar-mail-list">${rows.length?rows.map(mailRowMarkup).join(''):`<div class="stellar-mail-empty">${esc(t('empty'))}</div>`}</div><div class="stellar-mail-detail">${selected?mailDetailMarkup(selected):`<div class="stellar-mail-empty">${esc(t('empty'))}</div>`}</div></div>`;
    if(selected && !selected.read_at) markRead(selected.id);
  }

  function mailRowMarkup(row) {
    const icon=row.mail_type==='reward'?'attachment':'announcement';
    const active=Number(row.id)===Number(selectedMailId);
    return `<button type="button" class="stellar-mail-row ${active?'is-active':''} ${row.read_at?'':'is-unread'}" data-mail-id="${row.id}">${farmIcon(icon,'is-list-icon')}<span><b>${esc(row.title)}</b><small><span>${esc(row.mail_type==='reward'?t('reward'):t('announcement'))}</span>${expiryBadgeMarkup(row)}<span>· ${esc(formatDate(row.created_at))}</span></small></span><em>${!row.read_at?`<i>${esc(t('unreadMark'))}</i>`:''}${hasRewards(row)?row.claimed_at?`<strong>✓ ${esc(t('claimed'))}</strong>`:`<strong>${esc(formalMember()?t('attachments'):t('guestAttachment'))}</strong>`:''}</em></button>`;
  }

  function mailDetailMarkup(row) {
    const canClaim=hasRewards(row)&&!row.claimed_at;
    return `<article class="stellar-mail-letter"><header><div>${farmIcon(row.mail_type==='reward'?'attachment':'announcement','is-letter-icon')}<span><small><span>${esc(row.mail_type==='reward'?t('reward'):t('announcement'))}</span>${expiryBadgeMarkup(row,'is-detail-expiry')}</small><h3>${esc(row.title)}</h3></span></div><time>${esc(formatDate(row.created_at))}</time></header><div class="stellar-mail-copy">${esc(row.body||'').replace(/\n/g,'<br>')}</div>${hasRewards(row)?`<section class="stellar-mail-attachments"><b>${esc(t('attachments'))}</b>${rewardMarkup(row.rewards)}</section>`:''}<footer><small>${esc(t('expiry'))}: ${esc(expiryMeta(row).label)}</small><div class="stellar-mail-actions">${hasRewards(row)?row.claimed_at?`<span class="stellar-mail-claimed">✓ ${esc(t('claimed'))}</span>`:formalMember()?`<button type="button" class="stellar-mail-claim" data-mail-claim="${row.id}">${farmIcon('attachment')}${esc(t('claim'))}</button>`:`<button type="button" class="stellar-mail-bind" data-mail-bind>${siteIcon(24,'is-bind-lock-icon')}${esc(t('bindToClaim'))}</button>`:''}<button type="button" class="stellar-mail-delete" data-mail-delete="${row.id}">${siteIcon(13,'is-delete-mail-icon')}${esc(t('deleteMail'))}</button></div></footer></article>`;
  }

  async function markRead(id) {
    const row=mailRows.find(x=>Number(x.id)===Number(id)); if(!row||row.read_at)return;
    row.read_at=new Date().toISOString(); refreshUnread();
    try { await client()?.rpc('mark_system_mail_read_v1',{p_mail_id:Number(id)}); } catch(_){}
  }

  async function claimMail(id,{quiet=false}={}) {
    if(busy)return false; const sb=client(); if(!sb)return false;
    if(!formalMember()){ if(!quiet) showToast(t('memberOnly'),'error'); return false; }
    busy=true;
    try {
      const {data,error}=await sb.rpc('claim_system_mail_v2',{p_mail_id:Number(id)}); if(error)throw error;
      const result=Array.isArray(data)?data[0]:data;
      if(!result?.ok){ if(!quiet) showToast(result?.reason==='already_claimed'?t('claimed'):result?.reason==='member_required'?t('memberOnly'):result?.reason==='mail_deleted'?t('deleteOk'):result?.reason==='mail_unavailable'?t('unavailable'):t('claimFail'),'error'); return false; }
      const row=mailRows.find(x=>Number(x.id)===Number(id)); if(row){row.claimed_at=new Date().toISOString();row.read_at=row.read_at||new Date().toISOString();}
      window.dispatchEvent(new CustomEvent('stellar:mail-reward-claimed',{detail:{mailId:Number(id),rewards:result.rewards||{},farmState:result.farm_state||null,revision:Number(result.revision)||0}}));
      if(!quiet){const summary=rewardSummaryText(result.rewards||{});showToast(`${t('claimSummary')}${summary?`\n${summary}`:''}`,'success',4200);}
      return result;
    } catch(error) { if(!quiet) showToast(`${t('claimFail')}：${rpcMissing(error)?t('run022'):String(error?.message||error)}`,'error',4600); return false; }
    finally { busy=false; renderMailbox(); refreshUnread(); }
  }

  async function claimAll() {
    const list=mailRows.filter(r=>hasRewards(r)&&!r.claimed_at); if(!list.length)return;
    const totals=new Map(); let count=0;
    for(const row of list){
      const result=await claimMail(row.id,{quiet:true});
      if(!result?.ok)continue; count+=1;
      rewardItems(result.rewards||{}).forEach(item=>totals.set(item.label,(totals.get(item.label)||0)+item.qty));
    }
    const summary=[...totals.entries()].map(([label,qty])=>`${label} ×${qty}`).join('、');
    showToast(`${count} ${t('mailsClaimed')}${summary?`\n${summary}`:''}`,'success',4600); await loadMailbox(true);
  }

  async function deleteMail(id) {
    if(busy)return; const row=mailRows.find(x=>Number(x.id)===Number(id)); if(!row)return;
    const warning=hasRewards(row)&&!row.claimed_at?t('deleteWithRewardsConfirm'):t('deleteConfirm');
    if(!await askConfirm(warning,{danger:hasRewards(row)&&!row.claimed_at}))return;
    const visibleBefore=filteredRows();
    const visibleIndex=visibleBefore.findIndex(x=>Number(x.id)===Number(id));
    const nextCandidate=visibleBefore[visibleIndex+1] || visibleBefore[visibleIndex-1] || null;
    const sb=client(); if(!sb)return; busy=true;
    try {
      const {data,error}=await sb.rpc('delete_system_mail_v1',{p_mail_id:Number(id)}); if(error)throw error;
      if(!data)throw new Error(t('deleteFail'));
      mailRows=mailRows.filter(x=>Number(x.id)!==Number(id));
      selectedMailId=nextCandidate && mailRows.some(x=>Number(x.id)===Number(nextCandidate.id)) ? Number(nextCandidate.id) : null;
      showToast(t('deleteOk')); renderMailbox(); refreshUnread();
    } catch(error) { showToast(`${t('deleteFail')}：${rpcMissing(error)?t('run020'):String(error?.message||error)}`,'error'); }
    finally { busy=false; }
  }

  async function clearClaimedMails() {
    if(busy || !mailRows.some(row=>Boolean(row.claimed_at))) return;
    if(!await askConfirm(t('clearClaimedConfirm'),{danger:true})) return;
    const sb=client(); if(!sb)return; busy=true;
    try {
      const {data,error}=await sb.rpc('clear_claimed_system_mail_v1'); if(error)throw error;
      const count=Math.max(0,Number(data)||0);
      showToast(`${t('clearClaimedOk')}：${count}`);
      const selectedRow=mailRows.find(row=>Number(row.id)===Number(selectedMailId));
      if(selectedRow?.claimed_at) selectedMailId=null;
      await loadMailbox(true);
    } catch(error) {
      showToast(`${t('deleteFail')}：${rpcMissing(error)?t('run021'):String(error?.message||error)}`,'error');
    } finally { busy=false; }
  }

  async function openMailbox() { ensureShell(); await loadItemCatalog(); const modal=document.getElementById('stellarMailboxModal'); modal.hidden=false; document.body.classList.add('stellar-mail-open'); selectedMailId=null; loadMailbox(true); }
  function closeMailbox() { const modal=document.getElementById('stellarMailboxModal'); if(modal)modal.hidden=true; document.body.classList.remove('stellar-mail-open'); }

  function gmCategoryOptions() {
    return [['all','categoryAll'],['currency','categoryCurrency'],['seed','categorySeed'],['box','categoryBox'],['supply','categorySupply'],['outfit','categoryOutfit'],['decoration','categoryDecoration'],['pet','categoryPet']]
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
    const options=gmItemOptions(category);
    select.innerHTML=options||`<option value="">${esc(itemCatalogLoaded ? t('noCatalogItems') : t('run019'))}</option>`;
    if([...select.options].some(o=>o.value===current))select.value=current;
    renderGmItemMeta();
  }
  function renderGmItemMeta() {
    const host=document.getElementById('gmItemMeta'); if(!host)return;
    const item=catalogById(document.getElementById('gmItemSelect')?.value);
    host.innerHTML=item?`${catalogIcon(item,'is-gm-item-icon')}<span><b>${esc(catalogName(item))}</b><small>#${item.item_id} · ${esc(item.item_code)} · ${esc(categoryName(item.category))}</small></span>`:'';
    const qty=document.getElementById('gmItemQty');
    if(qty && item){
      const max=Math.max(1,Number(item.max_quantity)||1);
      qty.max=String(max);
      if(item.category==='outfit'||item.category==='pet'){qty.value='1';qty.disabled=true;} else {qty.disabled=false;qty.value=String(Math.max(1,Math.min(max,Math.floor(Number(qty.value)||1))));}
    }
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

  function attachmentsFromRewards(rewards={}) {
    const direct=Array.isArray(rewards?.items)?rewards.items.map(x=>({item_id:Number(x.item_id),quantity:Number(x.quantity)})).filter(x=>x.item_id>0&&x.quantity>0):[];
    if(direct.length)return direct;
    const out=[]; const add=(item_id,quantity)=>{quantity=Math.floor(Number(quantity)||0);if(quantity>0)out.push({item_id,quantity});};
    add(1001,rewards?.coins); add(1002,rewards?.exp);
    const seedIds={mystery:2001,carrot:3001,wheat:3002,corn:3003,tomato:3004,strawberry:3005,pumpkin:3006,grape:3007,starfruit:3008};
    Object.entries(rewards?.seeds||{}).forEach(([key,qty])=>{if(seedIds[key])add(seedIds[key],qty);});
    const supplyIds={fertilizerLow:4001,fertilizerMid:4002,fertilizerHigh:4003,trainResetTicket:4004};
    Object.entries(rewards?.supplies||{}).forEach(([key,qty])=>{if(supplyIds[key])add(supplyIds[key],qty);});
    return out;
  }

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

  function updateGmExpiryHint() {
    const host=document.getElementById('gmExpiryHint'); if(!host)return;
    const days=Number(document.getElementById('gmExpiry')?.value)||0;
    if(!days){host.textContent=t('permanent');return;}
    const end=new Date(Date.now()+days*86400000);
    const date=end.toLocaleDateString(locale()==='en'?'en-US':locale()==='zh-TW'?'zh-TW':'zh-CN',{month:'2-digit',day:'2-digit'});
    host.textContent=locale()==='en'?`D+${days} · ${t('expiresOn')} ${date}`:`D+${days} · ${date} ${t('expiresOn')}`;
  }

  function ensureGmModal() {
    if(document.getElementById('stellarGmModal'))return;
    const modal=document.createElement('div'); modal.id='stellarGmModal'; modal.className='stellar-mail-modal stellar-gm-modal'; modal.hidden=true;
    modal.innerHTML=`<div class="stellar-mail-backdrop" data-gm-close></div><section class="stellar-mail-dialog stellar-gm-dialog" role="dialog" aria-modal="true"><header><div>${farmIcon('announcement','is-mail-title-icon')}<span><small>STELLAR DIARY</small><b>${esc(t('gmTitle'))}</b></span></div><button type="button" data-gm-close>${siteIcon(11,'is-close-icon')}</button></header><div class="stellar-gm-body"><section class="stellar-gm-form"><h3>${esc(t('sendMail'))}</h3><label class="is-wide"><span>${esc(t('mailTitle'))}</span><input type="text" maxlength="120" id="gmMailTitle"></label><label class="is-wide"><span>${esc(t('mailBody'))}</span><textarea maxlength="6000" rows="7" id="gmMailBody"></textarea></label><div class="stellar-gm-grid"><label><span>${esc(t('mailType'))}</span><select id="gmMailType"><option value="announcement">${esc(t('announcement'))}</option><option value="reward">${esc(t('reward'))}</option></select></label><label><span>${esc(t('audience'))}</span><select id="gmMailAudience"><option value="all_future">${esc(t('allFuturePlayers'))}</option><option value="current_all">${esc(t('currentPlayers'))}</option><option value="user">${esc(t('onePlayer'))}</option></select></label><label id="gmTargetWrap" class="stellar-gm-target-wrap" hidden><span>${esc(t('targetUid'))}</span><span class="stellar-gm-uid-line"><input type="text" id="gmTargetUid" placeholder="00000000-0000-0000-0000-000000000000"><button type="button" data-gm-verify-uid>${esc(t('verifyUid'))}</button></span><small id="gmTargetStatus" class="stellar-gm-target-status"></small></label><label class="stellar-gm-expiry"><span>${esc(t('expiry'))}</span><select id="gmExpiry"><option value="0">${esc(t('forever'))}</option><option value="7">${esc(t('days7'))}</option><option value="14">${esc(t('days14'))}</option><option value="30">${esc(t('days30'))}</option></select><small id="gmExpiryHint" class="stellar-gm-expiry-hint"></small></label></div><h4>${esc(t('rewards'))}</h4><section class="stellar-gm-item-builder"><div class="stellar-gm-item-controls"><label><span>${esc(t('itemCategory'))}</span><select id="gmItemCategory">${gmCategoryOptions()}</select></label><label class="is-item-select"><span>${esc(t('itemSelect'))}</span><select id="gmItemSelect"></select></label><label class="is-qty"><span>${esc(t('itemQty'))}</span><input id="gmItemQty" type="number" min="1" step="1" value="1"></label><button type="button" class="stellar-gm-add-item" data-gm-add-item>${siteIcon(22,'is-add-item-icon')}${esc(t('addAttachment'))}</button></div><div id="gmItemMeta" class="stellar-gm-item-meta"></div><div id="gmAttachmentList" class="stellar-gm-attachment-list"></div></section><p class="stellar-gm-note">${esc(t('preview'))}</p><div class="stellar-gm-publish-actions"><button type="button" class="stellar-gm-preview-button" data-gm-preview>${siteIcon(10,'is-gm-preview-icon')}${esc(t('gmPreview'))}</button><button type="button" class="stellar-gm-publish" data-gm-publish>${farmIcon('announcement')}${esc(t('publish'))}</button></div></section><section class="stellar-gm-history"><h3>${esc(t('recent'))}</h3><div id="gmMailHistory"></div></section></div></section>`;
    document.body.appendChild(modal);
    renderGmItemSelect(); renderGmAttachments(); updateGmExpiryHint();
  }

  async function loadGmHistory() {
    const host=document.getElementById('gmMailHistory'); if(!host)return; host.innerHTML=`<div class="stellar-mail-loading">${esc(t('loading'))}</div>`;
    try{
      const {data,error}=await client().rpc('gm_list_system_mail_v2',{p_limit:30}); if(error)throw error;
      gmHistoryRows=Array.isArray(data)?data:[];
      host.innerHTML=gmHistoryRows.length?gmHistoryRows.map(r=>{
        const summary=rewardSummaryText(r.rewards||{}); const status=gmRowStatus(r); const scope=r.recipient_scope||(r.audience_type==='user'?'user':r.recipient_cutoff_at?'current_all':'all_future');
        const canWithdraw=status.key==='published';
        return `<article class="stellar-gm-history-row is-${status.key}">${farmIcon(r.mail_type==='reward'?'attachment':'announcement')}<span><b>#${r.id} · ${esc(r.title)}</b><small>${esc(recipientScopeLabel(scope,r.target_user_id||''))} · ${esc(formatDate(r.created_at))} ${expiryBadgeMarkup(r,'is-gm-history-expiry')}</small><span class="stellar-gm-history-status is-${status.key}">${esc(status.label)}</span>${summary?`<em class="stellar-gm-history-summary">${esc(summary)}</em>`:''}${rewardMarkup(r.rewards,true)}<div class="stellar-gm-history-actions"><button type="button" data-gm-copy-mail="${r.id}">${siteIcon(14,'is-history-action-icon')}${esc(t('copyMail'))}</button>${canWithdraw?`<button type="button" class="is-withdraw" data-gm-withdraw-mail="${r.id}">${siteIcon(13,'is-history-action-icon')}${esc(t('withdrawMail'))}</button>`:''}</div></span></article>`;
      }).join(''):`<div class="stellar-mail-empty">${esc(t('noHistory'))}</div>`;
    }catch(error){gmHistoryRows=[];host.innerHTML=`<div class="stellar-mail-empty">${esc(rpcMissing(error)?t('run022'):String(error?.message||error))}</div>`;}
  }

  function gmDraft() {
    const title=document.getElementById('gmMailTitle')?.value.trim()||'';
    const body=document.getElementById('gmMailBody')?.value||'';
    const mailType=document.getElementById('gmMailType')?.value||'announcement';
    const scope=document.getElementById('gmMailAudience')?.value||'all_future';
    const target=(document.getElementById('gmTargetUid')?.value||'').trim().toLowerCase();
    const days=Number(document.getElementById('gmExpiry')?.value)||0;
    const startsAt=new Date();
    const expiresAt=days?new Date(startsAt.getTime()+days*86400000).toISOString():null;
    return {title,body,mail_type:mailType,recipient_scope:scope,audience_type:scope==='user'?'user':'all',target_user_id:scope==='user'?target:null,rewards:readGmRewards(),starts_at:startsAt.toISOString(),created_at:startsAt.toISOString(),expires_at:expiresAt,recipient_cutoff_at:scope==='current_all'?startsAt.toISOString():null};
  }

  function closeGmPreview() {
    const modal=document.getElementById('stellarGmPreviewModal'); if(modal)modal.hidden=true;
  }

  function previewGmMail() {
    if(!isGm)return;
    const draft=gmDraft();
    if(!draft.title){document.getElementById('gmMailTitle')?.focus();return;}
    let modal=document.getElementById('stellarGmPreviewModal');
    if(!modal){
      modal=document.createElement('div'); modal.id='stellarGmPreviewModal'; modal.className='stellar-mail-modal stellar-gm-preview-modal';
      document.body.appendChild(modal);
    }
    const audienceLabel=recipientScopeLabel(draft.recipient_scope,draft.target_user_id||'');
    modal.innerHTML=`<div class="stellar-mail-backdrop" data-gm-preview-close></div><section class="stellar-mail-dialog stellar-gm-preview-dialog" role="dialog" aria-modal="true"><header><div>${farmIcon('mail','is-mail-title-icon')}<span><small>STELLAR MAIL</small><b>${esc(t('previewTitle'))}</b></span></div><button type="button" data-gm-preview-close>${siteIcon(11,'is-close-icon')}</button></header><div class="stellar-gm-preview-body"><article class="stellar-mail-letter is-gm-preview-letter"><header><div>${farmIcon(draft.mail_type==='reward'?'attachment':'announcement','is-letter-icon')}<span><small><span>${esc(draft.mail_type==='reward'?t('reward'):t('announcement'))}</span>${expiryBadgeMarkup(draft,'is-detail-expiry')}</small><h3>${esc(draft.title)}</h3></span></div><time>${esc(formatDate(draft.created_at))}</time></header><div class="stellar-mail-copy">${esc(draft.body).replace(/\n/g,'<br>')}</div>${hasRewards(draft)?`<section class="stellar-mail-attachments"><b>${esc(t('attachments'))}</b>${rewardMarkup(draft.rewards)}</section>`:''}<footer><small>${esc(t('previewAudience'))}: ${esc(audienceLabel)} · ${esc(t('expiry'))}: ${esc(expiryMeta(draft).label)}</small></footer></article><button type="button" class="stellar-gm-preview-close-button" data-gm-preview-close>${esc(t('previewClose'))}</button></div></section>`;
    modal.hidden=false;
  }

  async function publishGmMail() {
    if(!isGm||busy)return; const title=document.getElementById('gmMailTitle')?.value.trim()||''; if(!title)return;
    const body=document.getElementById('gmMailBody')?.value||''; const mailType=document.getElementById('gmMailType')?.value||'announcement'; const scope=document.getElementById('gmMailAudience')?.value||'all_future';
    const target=(document.getElementById('gmTargetUid')?.value||'').trim().toLowerCase();
    if(scope==='user'&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(target)){showToast(t('invalidTarget'),'error');return;}
    if(scope==='user'&&gmTargetVerified!==target){await verifyGmTarget();if(gmTargetVerified!==target)return;}
    const days=Number(document.getElementById('gmExpiry')?.value)||0; const start=new Date(); const expires=days?new Date(start.getTime()+days*86400000).toISOString():null; const rewards=readGmRewards();
    const audienceLine=recipientScopeLabel(scope,target);
    if(!await askConfirm(`${t('confirmSend')}\n${audienceLine} · ${days?`D+${days}`:t('permanent')}`))return;
    busy=true;
    try{
      const {data,error}=await client().rpc('gm_send_system_mail_v2',{p_title:title,p_body:body,p_mail_type:mailType,p_recipient_scope:scope,p_target_user_id:scope==='user'?target:null,p_rewards:rewards,p_starts_at:start.toISOString(),p_expires_at:expires}); if(error)throw error;
      showToast(`${t('sent')} #${data}`); document.getElementById('gmMailTitle').value=''; document.getElementById('gmMailBody').value=''; gmAttachments=[]; renderGmAttachments(); await loadGmHistory(); await refreshUnread();
      if(!document.getElementById('stellarMailboxModal')?.hidden) await loadMailbox(true);
    }catch(error){showToast(rpcMissing(error)?t('run022'):String(error?.message||error),'error',4600);}finally{busy=false;}
  }

  function copyGmMail(id) {
    const row=gmHistoryRows.find(x=>Number(x.id)===Number(id)); if(!row)return;
    const scope=row.recipient_scope||(row.audience_type==='user'?'user':row.recipient_cutoff_at?'current_all':'all_future');
    const title=document.getElementById('gmMailTitle'), body=document.getElementById('gmMailBody'), type=document.getElementById('gmMailType'), audience=document.getElementById('gmMailAudience'), target=document.getElementById('gmTargetUid'), expiry=document.getElementById('gmExpiry');
    if(title)title.value=row.title||''; if(body)body.value=row.body||''; if(type)type.value=row.mail_type||'announcement'; if(audience)audience.value=scope;
    const targetWrap=document.getElementById('gmTargetWrap'); if(targetWrap)targetWrap.hidden=scope!=='user'; if(target)target.value=scope==='user'?(row.target_user_id||''):''; gmTargetVerified=null;
    let days=0; if(row.expires_at){const diff=Math.round((new Date(row.expires_at)-new Date(row.starts_at||row.created_at))/86400000); if([7,14,30].includes(diff))days=diff;} if(expiry)expiry.value=String(days); updateGmExpiryHint();
    gmAttachments=attachmentsFromRewards(row.rewards||{}); renderGmAttachments();
    document.querySelector('.stellar-gm-form')?.scrollTo?.({top:0,behavior:'smooth'}); title?.focus(); showToast(t('copyOk'));
  }

  async function withdrawGmMail(id) {
    if(busy)return; const row=gmHistoryRows.find(x=>Number(x.id)===Number(id)); if(!row||row.withdrawn_at)return;
    if(!await askConfirm(`${t('withdrawConfirm')}\n#${row.id} · ${row.title}`,{danger:true,confirmText:t('withdrawMail')}))return;
    busy=true;
    try{
      const {data,error}=await client().rpc('gm_withdraw_system_mail_v1',{p_mail_id:Number(id)}); if(error)throw error; if(!data)throw new Error(t('unavailable'));
      showToast(t('withdrawOk')); await loadGmHistory(); await refreshUnread(); if(!document.getElementById('stellarMailboxModal')?.hidden) await loadMailbox(true);
    }catch(error){showToast(rpcMissing(error)?t('run022'):String(error?.message||error),'error',4600);}finally{busy=false;}
  }

  async function openGm() { if(!isGm)return; await loadItemCatalog(); ensureGmModal(); renderGmItemSelect(); renderGmAttachments(); updateGmExpiryHint(); document.getElementById('stellarGmModal').hidden=false; document.body.classList.add('stellar-mail-open'); loadGmHistory(); }
  function closeGm() { const m=document.getElementById('stellarGmModal'); if(m)m.hidden=true; document.body.classList.remove('stellar-mail-open'); }

  function handleClick(event) {
    if(event.target.closest('[data-stellar-mail-entry]')){openMailbox();return;}
    if(event.target.closest('[data-stellar-gm-entry]')){openGm();return;}
    if(event.target.closest('[data-mail-close]')){closeMailbox();return;}
    if(event.target.closest('[data-gm-close]')){closeGm();return;}
    const filter=event.target.closest('[data-mail-filter]'); if(filter){activeFilter=filter.dataset.mailFilter;selectedMailId=null;renderMailbox();return;}
    const row=event.target.closest('[data-mail-id]'); if(row){selectedMailId=Number(row.dataset.mailId);renderMailbox();return;}
    if(event.target.closest('[data-mail-bind]')){location.href=accountUrl();return;}
    const claim=event.target.closest('[data-mail-claim]'); if(claim){claimMail(Number(claim.dataset.mailClaim));return;}
    const del=event.target.closest('[data-mail-delete]'); if(del){deleteMail(Number(del.dataset.mailDelete));return;}
    if(event.target.closest('[data-mail-claim-all]')){claimAll();return;}
    if(event.target.closest('[data-mail-clear-claimed]')){clearClaimedMails();return;}
    if(event.target.closest('[data-gm-verify-uid]')){verifyGmTarget();return;}
    if(event.target.closest('[data-gm-add-item]')){addGmAttachment();return;}
    const removeItem=event.target.closest('[data-gm-remove-item]'); if(removeItem){removeGmAttachment(Number(removeItem.dataset.gmRemoveItem));return;}
    if(event.target.closest('[data-gm-preview-close]')){closeGmPreview();return;}
    if(event.target.closest('[data-gm-preview]')){previewGmMail();return;}
    const copyMail=event.target.closest('[data-gm-copy-mail]'); if(copyMail){copyGmMail(Number(copyMail.dataset.gmCopyMail));return;}
    const withdrawMail=event.target.closest('[data-gm-withdraw-mail]'); if(withdrawMail){withdrawGmMail(Number(withdrawMail.dataset.gmWithdrawMail));return;}
    if(event.target.closest('[data-gm-publish]')){publishGmMail();return;}
  }

  function handleChange(event) {
    if(event.target.matches('#gmMailAudience')){const wrap=document.getElementById('gmTargetWrap');if(wrap)wrap.hidden=event.target.value!=='user';gmTargetVerified=null;if(event.target.value==='current_all')showToast(t('currentOnlyHint'),'success',2800);}
    if(event.target.matches('#gmTargetUid')){gmTargetVerified=null;const host=document.getElementById('gmTargetStatus');if(host){host.textContent='';host.className='stellar-gm-target-status';}}
    if(event.target.matches('#gmItemCategory')){renderGmItemSelect();}
    if(event.target.matches('#gmItemSelect')){renderGmItemMeta();}
    if(event.target.matches('#gmExpiry')){updateGmExpiryHint();}
  }

  async function refreshIdentity() {
    ensureShell(); await checkGm(); ensureHeaderButtons(); await loadItemCatalog(); await refreshUnread();
  }

  function init() {
    console.info(`[Stellar Mail] build ${BUILD}`);
    ensureShell(); ensureFeedbackUi(); document.addEventListener('click',handleClick); document.addEventListener('change',handleChange);
    window.addEventListener('stellar:auth-state',()=>setTimeout(refreshIdentity,60));
    window.addEventListener('stellar:language-changed',()=>{ensureHeaderButtons(); if(document.getElementById('stellarGmModal')){renderGmItemSelect();renderGmAttachments();updateGmExpiryHint();}});
    refreshIdentity();
    pollTimer=setInterval(()=>{if(!document.hidden)refreshUnread();},POLL_MS);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
