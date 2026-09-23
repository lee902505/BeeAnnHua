(() => {
  'use strict';

  const STORAGE_KEY = 'xingchen-farm-v1';
  const VERSION = 1;
  const PLOT_COUNT = 20;
  const INITIAL_COINS = 100;
  const CLOUD_TABLE = 'farm_saves';
  const CLOUD_SYNC_DELAY = 700;

  const CROPS = [
    { id:'carrot', name:'红萝卜', icon:'🥕', seedPrice:8, growMinutes:20, yieldMin:4, yieldMax:5, sellPrice:3, exp:4, unlockLevel:1, note:'成长快速，适合刚开始经营农场。' },
    { id:'wheat', name:'小麦', icon:'🌾', seedPrice:12, growMinutes:30, yieldMin:4, yieldMax:5, sellPrice:4, exp:6, unlockLevel:2, note:'稳定朴实，是早期累积金币的好选择。' },
    { id:'corn', name:'玉米', icon:'🌽', seedPrice:18, growMinutes:30, yieldMin:4, yieldMax:5, sellPrice:6, exp:7, unlockLevel:3, note:'同样只需 30 分钟，但收益更高。' },
    { id:'tomato', name:'番茄', icon:'🍅', seedPrice:30, growMinutes:50, yieldMin:4, yieldMax:5, sellPrice:10, exp:10, unlockLevel:5, note:'开始进入中期收益，适合稍长一点的等待。' },
    { id:'strawberry', name:'草莓', icon:'🍓', seedPrice:55, growMinutes:90, yieldMin:4, yieldMax:5, sellPrice:18, exp:15, unlockLevel:8, note:'甜美又值钱，适合离开一阵子再回来收。' },
    { id:'pumpkin', name:'南瓜', icon:'🎃', seedPrice:90, growMinutes:150, yieldMin:4, yieldMax:5, sellPrice:30, exp:22, unlockLevel:12, note:'等待更久，但每次成熟都很有份量。' },
    { id:'grape', name:'葡萄', icon:'🍇', seedPrice:150, growMinutes:240, yieldMin:4, yieldMax:5, sellPrice:50, exp:30, unlockLevel:18, note:'适合工作或外出时种下，回来就能收成。' },
    { id:'starfruit', name:'星辰果', icon:'✨', seedPrice:260, growMinutes:480, yieldMin:4, yieldMax:5, sellPrice:85, exp:45, unlockLevel:25, note:'农场后期作物，睡前种下最合适。' }
  ];

  const LEVEL_EXP = {
    1:100, 2:140, 3:190, 4:250, 5:320, 6:400, 7:500, 8:620, 9:750,
    10:900, 11:1060, 12:1230, 13:1410, 14:1600, 15:1800, 16:2010, 17:2230,
    18:2460, 19:2700, 20:2950, 21:3210, 22:3480, 23:3760, 24:4050, 25:4350
  };

  const LAND_UNLOCKS = [
    { level:1, count:6 },
    { level:3, count:8 },
    { level:5, count:10 },
    { level:8, count:12 },
    { level:12, count:15 },
    { level:16, count:17 },
    { level:20, count:18 },
    { level:25, count:20 }
  ];

  const TASKS = [
    { id:'welcome', title:'欢迎来到星辰农场', desc:'打开属于你的第一座农场。', type:'visit', target:1, reward:{coins:20}, rewardText:'金币 ×20' },
    { id:'plant1', title:'第一次播种', desc:'在任意一格农地种下作物。', type:'plant', target:1, reward:{seeds:{carrot:2}, exp:20}, rewardText:'红萝卜种子 ×2 · EXP +20' },
    { id:'plant3', title:'让农地热闹起来', desc:'累计播种 3 次。', type:'plant', target:3, reward:{seeds:{wheat:2}, exp:20}, rewardText:'小麦种子 ×2 · EXP +20' },
    { id:'harvest1', title:'第一份收成', desc:'收成任意一格成熟作物。', type:'harvest', target:1, reward:{coins:20, exp:35}, rewardText:'金币 ×20 · EXP +35' },
    { id:'sell1', title:'第一次交易', desc:'出售任意农作物。', type:'sell', target:1, reward:{seeds:{corn:2}, exp:25}, rewardText:'玉米种子 ×2 · EXP +25' },
    { id:'friend1', title:'第一位农友', desc:'加入 1 位农场好友。', type:'friend', target:1, reward:{seeds:{corn:3}}, rewardText:'玉米种子 ×3' },
    { id:'friend5', title:'热闹小农场', desc:'好友达到 5 人。', type:'friend', target:5, reward:{seeds:{strawberry:3}}, rewardText:'草莓种子 ×3' },
    { id:'friend10', title:'农场交友达人', desc:'好友达到 10 人。', type:'friend', target:10, reward:{seeds:{pumpkin:3}}, rewardText:'南瓜种子 ×3' }
  ];

  const hadLocalStateAtBoot = (() => { try { return localStorage.getItem(STORAGE_KEY) != null; } catch (_) { return false; } })();
  let state = loadState();
  let activePanel = null;
  let tickTimer = null;
  let lastLevel = state.level;
  let cloudReady = false;
  let cloudUserId = '';
  let cloudSyncTimer = null;
  let cloudBusy = false;
  let cloudLastSyncedAt = 0;

  // Multiplayer farm data is intentionally kept separate from the private
  // farm save. Rankings expose only level/coins/name; friend actions go
  // through authenticated Supabase RPCs created by migration 004.
  let rankingSort = 'level';
  let rankingRows = [];
  let rankingLoading = false;
  let rankingError = '';
  let rankingLoadedAt = 0;
  let friendRows = [];
  let friendsLoading = false;
  let friendsError = '';
  let friendsLoadedAt = 0;

  const $ = (id) => document.getElementById(id);
  const cropById = (id) => CROPS.find(c => c.id === id);

  function defaultPlots() {
    return Array.from({length:PLOT_COUNT}, (_, i) => ({ id:i, cropId:null, plantedAt:null }));
  }

  function createDefaultState() {
    return {
      version: VERSION,
      createdAt: Date.now(),
      coins: INITIAL_COINS,
      level: 1,
      exp: 0,
      plots: defaultPlots(),
      seeds: { carrot:3, wheat:2 },
      produce: {},
      stats: { visit:1, plant:0, harvest:0, sell:0, friend:0 },
      claimedTasks: [],
      history: [],
      ownerUserId: '',
      updatedAt: Date.now()
    };
  }

  function normalizeState(raw) {
    const base = createDefaultState();
    const merged = {...base, ...(raw || {})};
    merged.plots = Array.from({length:PLOT_COUNT}, (_, i) => {
      const old = Array.isArray(raw?.plots) ? raw.plots[i] : null;
      return { id:i, cropId:old?.cropId || null, plantedAt:Number(old?.plantedAt) || null };
    });
    merged.seeds = {...base.seeds, ...(raw?.seeds || {})};
    merged.produce = {...(raw?.produce || {})};
    merged.stats = {...base.stats, ...(raw?.stats || {})};
    merged.claimedTasks = Array.isArray(raw?.claimedTasks) ? raw.claimedTasks : [];
    merged.history = Array.isArray(raw?.history) ? raw.history.slice(-30) : [];
    merged.coins = Math.max(0, Number(merged.coins) || 0);
    merged.level = Math.max(1, Number(merged.level) || 1);
    merged.exp = Math.max(0, Number(merged.exp) || 0);
    merged.ownerUserId = typeof merged.ownerUserId === 'string' ? merged.ownerUserId : '';
    merged.updatedAt = Math.max(0, Number(merged.updatedAt) || Number(merged.createdAt) || Date.now());
    return merged;
  }

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return normalizeState(raw);
    } catch {
      return createDefaultState();
    }
  }

  function writeLocalState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function saveState({touch=true, sync=true} = {}) {
    if (touch) state.updatedAt = Date.now();
    writeLocalState();
    if (sync) scheduleCloudPush();
  }

  function setCloudStatus(mode, text) {
    const el = $('farmCloudStatus');
    if (!el) return;
    el.className = `farm-cloud-status is-${mode}`;
    el.textContent = text;
  }

  function cloudClient() {
    return window.XingchenSupabase?.getClient?.() || null;
  }

  function cloudAuthUser() {
    return window.XingchenAuth?.getUser?.() || null;
  }

  function relationMissing(error) {
    const text = String(error?.message || error || '');
    return error?.code === '42P01' || /farm_saves|schema cache|does not exist|could not find/i.test(text);
  }

  function multiplayerMissing(error) {
    const text = String(error?.message || error || '');
    return error?.code === '42P01' || error?.code === 'PGRST202' ||
      /get_farm_rankings|get_farm_friends|get_friend_farm|request_farm_friend|farm_friendships|schema cache|does not exist|could not find/i.test(text);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function genderSymbol(sex) {
    return sex === 'male' ? '♂' : sex === 'female' ? '♀' : '';
  }

  function coinInline(value, {label=false} = {}) {
    return `<span class="farm-coin-inline"><i class="farm-coin-mini" aria-hidden="true"></i><span>${formatNumber(value)}</span>${label ? '<small>金币</small>' : ''}</span>`;
  }

  function scheduleCloudPush() {
    if (!cloudReady || !cloudUserId) return;
    clearTimeout(cloudSyncTimer);
    cloudSyncTimer = setTimeout(() => pushCloudState(false), CLOUD_SYNC_DELAY);
  }

  async function pushCloudState(force = false) {
    if ((!cloudReady && !force) || cloudBusy) return {ok:false, skipped:true};
    const sb = cloudClient();
    const user = cloudAuthUser();
    if (!sb || !user?.id) return {ok:false, skipped:true};
    cloudUserId = user.id;
    cloudBusy = true;
    setCloudStatus('syncing', '☁ 正在同步');
    try {
      state.ownerUserId = user.id;
      writeLocalState();
      const payload = {
        user_id:user.id,
        state:state,
        client_updated_at:Number(state.updatedAt) || Date.now()
      };
      const {error} = await sb.from(CLOUD_TABLE).upsert(payload, {onConflict:'user_id'});
      if (error) throw error;
      cloudReady = true;
      cloudLastSyncedAt = Date.now();
      setCloudStatus('ready', '☁ 云端已同步');
      return {ok:true};
    } catch (error) {
      cloudReady = false;
      if (relationMissing(error)) setCloudStatus('setup', '☁ 云端待启用');
      else setCloudStatus('error', '☁ 云端暂不可用');
      return {ok:false, error};
    } finally {
      cloudBusy = false;
    }
  }

  async function pullCloudState({preferRemote=false} = {}) {
    const sb = cloudClient();
    const user = cloudAuthUser();
    if (!sb || !user?.id) return {ok:false, skipped:true};
    cloudUserId = user.id;
    setCloudStatus('connecting', '☁ 云端连接中');
    try {
      const {data, error} = await sb
        .from(CLOUD_TABLE)
        .select('state,client_updated_at,updated_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data?.state) {
        cloudReady = true;
        if (state.ownerUserId && state.ownerUserId !== user.id) {
          state = createDefaultState();
          state.ownerUserId = user.id;
          writeLocalState();
          renderAll();
        }
        return await pushCloudState(true);
      }

      const remoteStamp = Number(data.client_updated_at) || new Date(data.updated_at || 0).getTime() || 0;
      const localStamp = Number(state.updatedAt) || 0;
      const belongsToDifferentUser = Boolean(state.ownerUserId && state.ownerUserId !== user.id);
      const shouldUseRemote = preferRemote || belongsToDifferentUser || !hadLocalStateAtBoot || remoteStamp > localStamp;
      cloudReady = true;
      if (shouldUseRemote) {
        state = normalizeState(data.state);
        state.updatedAt = Math.max(remoteStamp, Number(state.updatedAt) || 0);
        state.ownerUserId = user.id;
        writeLocalState();
        renderAll();
      } else if (localStamp > remoteStamp) {
        await pushCloudState(true);
      } else {
        setCloudStatus('ready', '☁ 云端已同步');
      }
      cloudLastSyncedAt = Date.now();
      setCloudStatus('ready', '☁ 云端已同步');
      return {ok:true, source:shouldUseRemote ? 'cloud' : 'local'};
    } catch (error) {
      cloudReady = false;
      if (relationMissing(error)) setCloudStatus('setup', '☁ 云端待启用');
      else setCloudStatus('error', '☁ 使用本机存档');
      return {ok:false, error};
    }
  }

  async function bootstrapCloud(preferRemote = false) {
    try {
      const authState = await window.XingchenAuth?.init?.();
      const user = window.XingchenAuth?.getUser?.() || (authState?.userId ? {id:authState.userId} : null);
      if (!user?.id) {
        setCloudStatus('local', '☁ 本机存档');
        return;
      }
      await pullCloudState({preferRemote});
    } catch (_) {
      setCloudStatus('local', '☁ 本机存档');
    }
  }


  async function prepareMultiplayerIdentity() {
    try { await window.XingchenAuth?.syncProfile?.(true); } catch (_) {}
    if (cloudReady && !cloudBusy) {
      try { await pushCloudState(true); } catch (_) {}
    }
  }

  function syncFriendStat(rows = friendRows) {
    const count = rows.filter(row => row.relation_state === 'friend').length;
    if ((Number(state.stats.friend) || 0) === count) return;
    state.stats.friend = count;
    saveState();
    renderTaskDot();
  }

  async function loadRankings(force = false) {
    if (rankingLoading) return;
    if (!force && rankingLoadedAt && Date.now() - rankingLoadedAt < 10000) return;
    const sb = cloudClient();
    const user = cloudAuthUser();
    if (!sb || !user?.id) {
      rankingError = '请先建立云端身份后再查看排行榜。';
      renderActivePanel();
      return;
    }
    rankingLoading = true;
    rankingError = '';
    renderActivePanel();
    try {
      await prepareMultiplayerIdentity();
      const {data, error} = await sb.rpc('get_farm_rankings', {p_sort:rankingSort, p_limit:50});
      if (error) throw error;
      rankingRows = Array.isArray(data) ? data : [];
      rankingLoadedAt = Date.now();
    } catch (error) {
      rankingRows = [];
      rankingError = multiplayerMissing(error)
        ? '多人农场尚未启用：请先在 Supabase SQL Editor 执行 20260923_004_farm_rankings_friends.sql。'
        : '排行榜暂时读取失败，请稍后再试。';
    } finally {
      rankingLoading = false;
      renderActivePanel();
    }
  }

  async function loadFriends(force = false) {
    if (friendsLoading) return;
    if (!force && friendsLoadedAt && Date.now() - friendsLoadedAt < 10000) return;
    const sb = cloudClient();
    const user = cloudAuthUser();
    if (!sb || !user?.id) {
      friendsError = '请先建立云端身份后再使用好友功能。';
      renderActivePanel();
      return;
    }
    friendsLoading = true;
    friendsError = '';
    renderActivePanel();
    try {
      await prepareMultiplayerIdentity();
      const {data, error} = await sb.rpc('get_farm_friends');
      if (error) throw error;
      friendRows = Array.isArray(data) ? data : [];
      friendsLoadedAt = Date.now();
      syncFriendStat(friendRows);
    } catch (error) {
      friendRows = [];
      friendsError = multiplayerMissing(error)
        ? '好友系统尚未启用：请先在 Supabase SQL Editor 执行 20260923_004_farm_rankings_friends.sql。'
        : '好友资料暂时读取失败，请稍后再试。';
    } finally {
      friendsLoading = false;
      renderActivePanel();
    }
  }

  function invalidateMultiplayer() {
    rankingLoadedAt = 0;
    friendsLoadedAt = 0;
  }

  async function requestFriend(targetId) {
    const sb = cloudClient();
    if (!sb || !targetId) return;
    try {
      const {data, error} = await sb.rpc('request_farm_friend', {p_target:targetId});
      if (error) throw error;
      const result = String(data || '');
      const messages = {
        requested:['👥 好友申请已送出','等对方接受后就会出现在好友列表。'],
        accepted:['🤝 已成为农场好友','你们刚好互相发出了好友申请。'],
        already_friend:['👥 已经是好友','可以到好友列表查看对方。'],
        pending:['⏳ 申请已经送出','等待对方确认即可。'],
        invalid_target:['无法加入好友','不能把自己加入好友。'],
        not_found:['找不到这位农友','对方可能尚未建立农场。']
      };
      const msg = messages[result] || ['好友操作完成',''];
      toast(msg[0], msg[1], result === 'accepted' ? 'task' : 'normal');
      invalidateMultiplayer();
      await Promise.all([loadRankings(true), loadFriends(true)]);
    } catch (error) {
      toast('好友申请失败', multiplayerMissing(error) ? '请先执行多人农场 SQL。' : '请稍后再试。');
    }
  }

  async function respondFriend(otherId, accept) {
    const sb = cloudClient();
    if (!sb || !otherId) return;
    try {
      const {data, error} = await sb.rpc('respond_farm_friend', {p_other:otherId, p_accept:Boolean(accept)});
      if (error) throw error;
      const result = String(data || '');
      if (result === 'accepted') toast('🤝 好友申请已接受', '现在已经是农场好友。', 'task');
      else if (result === 'rejected') toast('已忽略好友申请', '这次不会加入好友列表。');
      else toast('好友状态已更新');
      invalidateMultiplayer();
      await Promise.all([loadFriends(true), loadRankings(true)]);
    } catch (error) {
      toast('好友操作失败', multiplayerMissing(error) ? '请先执行多人农场 SQL。' : '请稍后再试。');
    }
  }

  async function removeFriend(otherId, mode = 'friend') {
    const sb = cloudClient();
    if (!sb || !otherId) return;
    if (mode === 'friend' && !window.confirm('确定要删除这位农场好友吗？')) return;
    try {
      const {error} = await sb.rpc('remove_farm_friend', {p_other:otherId});
      if (error) throw error;
      toast(mode === 'request' ? '已取消好友申请' : '好友已删除');
      invalidateMultiplayer();
      await Promise.all([loadFriends(true), loadRankings(true)]);
    } catch (error) {
      toast('好友操作失败', multiplayerMissing(error) ? '请先执行多人农场 SQL。' : '请稍后再试。');
    }
  }


  function renderFriendFarmVisit(payload) {
    const friendLevel = Math.max(1, Number(payload?.level) || 1);
    const unlocked = unlockedLandCount(friendLevel);
    const rawPlots = Array.isArray(payload?.plots) ? payload.plots : [];
    const plots = Array.from({length:PLOT_COUNT}, (_, index) => {
      const raw = rawPlots[index] || {};
      return {id:index, cropId:raw?.cropId || null, plantedAt:Number(raw?.plantedAt) || null};
    });
    let matureCount = 0;
    const tiles = [];

    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        const index = row * 5 + col;
        const plot = plots[index];
        let cls = 'farm-plot farm-visit-plot';
        let content = '';

        if (index >= unlocked) {
          cls += ' is-locked';
          content = `<span class="farm-soil"><i>🔒</i><small>Lv.${unlockLevelForPlot(index)}</small></span>`;
        } else if (!plot.cropId || !cropById(plot.cropId)) {
          cls += ' is-empty';
          content = '<span class="farm-soil"><i>·</i><small>空地</small></span>';
        } else {
          const crop = cropById(plot.cropId);
          const progress = progressFor(plot, crop);
          const stage = stageFor(progress);
          const remaining = Math.max(0, crop.growMinutes * 60 * 1000 - (Date.now() - plot.plantedAt));
          cls += ` has-crop stage-${stage.key}`;
          if (progress >= 1) { cls += ' is-mature'; matureCount += 1; }
          content = `<span class="farm-soil"><span class="farm-crop-visual" aria-hidden="true">${crop.icon}</span><span class="farm-crop-name">${crop.name}</span><small class="farm-crop-time">${progress >= 1 ? '已成熟' : formatDuration(remaining)}</small></span>`;
        }

        tiles.push(`<div class="${cls}" style="--farm-row:${row};--farm-col:${col};--farm-depth:${(row * 10) + col}">${content}</div>`);
      }
    }

    const name = escapeHtml(payload?.display_name || '星辰农友');
    const sex = genderSymbol(payload?.sex);
    return `
      <section class="farm-visit-summary">
        <div><b>${name}${sex ? ` <i>${sex}</i>` : ''}</b><small>Lv.${formatNumber(friendLevel)}</small></div>
        <span>${coinInline(payload?.coins || 0, {label:true})}</span>
        <em>成熟 ${matureCount} 格</em>
      </section>
      <div class="farm-visit-scene">
        <div class="farm-visit-field">${tiles.join('')}</div>
      </div>
      <div class="farm-visit-actions"><button type="button" class="farm-friend-action" data-open-panel="friends">← 返回好友列表</button></div>`;
  }

  async function visitFriend(friendId) {
    const sb = cloudClient();
    const user = cloudAuthUser();
    if (!sb || !user?.id || !friendId) return;

    openModal({
      icon:'🏡', eyebrow:'FARM VISIT', title:'正在前往好友农场',
      subtitle:'正在读取好友最新的云端农场状态。',
      body:'<div class="farm-network-state"><span class="farm-spinner"></span><b>沿着小路走过去…</b></div>'
    });

    try {
      const {data, error} = await sb.rpc('get_friend_farm', {p_friend:friendId});
      if (error) throw error;
      const payload = data && typeof data === 'object' ? data : {};
      if (!payload.ok) {
        const message = payload.reason === 'not_friend' ? '只有已经互相确认的好友才能拜访农场。'
          : payload.reason === 'no_farm' ? '这位好友还没有建立云端农场。'
          : '暂时无法进入这座农场。';
        openModal({icon:'🏡', eyebrow:'FARM VISIT', title:'暂时无法拜访', subtitle:message, body:'<div class="farm-visit-actions"><button type="button" class="farm-friend-action" data-open-panel="friends">返回好友列表</button></div>'});
        return;
      }
      openModal({
        icon:'🏡', eyebrow:'FARM VISIT',
        title:`${payload.display_name || '好友'}的农场`,
        subtitle:'看看好友最近种了什么；目前拜访为查看模式。',
        body:renderFriendFarmVisit(payload)
      });
    } catch (error) {
      const detail = multiplayerMissing(error)
        ? '请先在 Supabase SQL Editor 执行 20260923_005_farm_friend_visits.sql。'
        : '好友农场暂时读取失败，请稍后再试。';
      openModal({icon:'🏡', eyebrow:'FARM VISIT', title:'拜访失败', subtitle:detail, body:'<div class="farm-visit-actions"><button type="button" class="farm-friend-action" data-open-panel="friends">返回好友列表</button></div>'});
    }
  }

  function currentExpNeed() {
    return LEVEL_EXP[state.level] || (4350 + Math.max(0, state.level - 25) * 350);
  }

  function unlockedLandCount(level = state.level) {
    let count = 6;
    for (const item of LAND_UNLOCKS) if (level >= item.level) count = item.count;
    return count;
  }

  function unlockLevelForPlot(index) {
    for (const item of LAND_UNLOCKS) if (index < item.count) return item.level;
    return 25;
  }

  function nextLandUnlock() {
    return LAND_UNLOCKS.find(item => item.level > state.level) || null;
  }

  function addExp(amount) {
    if (!amount) return;
    state.exp += amount;
    const unlockedBefore = unlockedLandCount(state.level);
    const cropsBefore = CROPS.filter(c => c.unlockLevel <= state.level).map(c => c.id);
    let levelUps = 0;

    while (state.exp >= currentExpNeed()) {
      state.exp -= currentExpNeed();
      state.level += 1;
      levelUps += 1;
    }

    if (levelUps) {
      const unlockedAfter = unlockedLandCount(state.level);
      const newlyCrops = CROPS.filter(c => c.unlockLevel <= state.level && !cropsBefore.includes(c.id));
      let extra = `升到 Lv.${state.level}`;
      if (unlockedAfter > unlockedBefore) extra += ` · 新农地 +${unlockedAfter - unlockedBefore}`;
      if (newlyCrops.length) extra += ` · 解锁 ${newlyCrops.map(c => c.name).join('、')}`;
      toast('🌟 农场升级！', extra, 'level');
      pulseExp();
    }
  }

  function formatNumber(n) {
    return Math.floor(Number(n) || 0).toLocaleString('zh-CN');
  }

  function formatDuration(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${m}:${String(s).padStart(2,'0')}`;
  }

  function progressFor(plot, crop) {
    if (!plot?.plantedAt || !crop) return 0;
    const total = crop.growMinutes * 60 * 1000;
    return Math.min(1, Math.max(0, (Date.now() - plot.plantedAt) / total));
  }

  function stageFor(progress) {
    if (progress >= 1) return {key:'mature', label:'成熟', icon:'✦'};
    if (progress >= .82) return {key:'almost', label:'快成熟', icon:'🌿'};
    if (progress >= .52) return {key:'growing', label:'成长中', icon:'🌱'};
    if (progress >= .22) return {key:'sprout', label:'发芽', icon:'·'};
    return {key:'seed', label:'刚播种', icon:'•'};
  }

  function renderAll() {
    renderOwner();
    renderStats();
    renderField();
    updateHarvestAllButton();
    renderTaskDot();
    if (activePanel) renderActivePanel();
  }

  function renderOwner() {
    const profile = window.XingchenPlayer?.getProfile?.();
    $('farmOwnerName').textContent = profile?.name ? `${profile.name}的` : '我的';
  }

  function renderStats() {
    const need = currentExpNeed();
    const pct = Math.max(0, Math.min(100, (state.exp / need) * 100));
    $('farmLevel').textContent = state.level;
    $('farmCoins').textContent = formatNumber(state.coins);
    $('farmExpCurrent').textContent = formatNumber(state.exp);
    $('farmExpNeed').textContent = formatNumber(need);
    $('farmExpFill').style.width = `${pct}%`;
    const unlocked = unlockedLandCount();
    const fieldOpen = $('farmFieldOpen');
    if (fieldOpen) fieldOpen.textContent = unlocked;
    const next = nextLandUnlock();
    $('farmUnlockTip').textContent = next
      ? `Lv.${next.level} 再解锁 ${next.count - unlocked} 格农地`
      : '20 格农地已经全部开放';
  }

  function renderField() {
    const host = $('farmField');
    if (!host) return;
    const unlocked = unlockedLandCount();
    const fragment = document.createDocumentFragment();

    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        const index = row * 5 + col;
        const plot = state.plots[index];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'farm-plot';
        btn.dataset.plot = String(index);
        btn.style.setProperty('--farm-row', row);
        btn.style.setProperty('--farm-col', col);
        btn.style.setProperty('--farm-depth', (row * 10) + col);

        if (index >= unlocked) {
          const lvl = unlockLevelForPlot(index);
          btn.classList.add('is-locked');
          btn.disabled = false;
          btn.setAttribute('aria-label', `第 ${index + 1} 格农地，Lv.${lvl} 解锁`);
          btn.innerHTML = `<span class="farm-soil"><i>🔒</i><small>Lv.${lvl}</small></span>`;
        } else if (!plot.cropId) {
          btn.classList.add('is-empty');
          btn.setAttribute('aria-label', `第 ${index + 1} 格空地，点击播种`);
          btn.innerHTML = `<span class="farm-soil"><i>＋</i><small>播种</small></span>`;
        } else {
          const crop = cropById(plot.cropId);
          const progress = progressFor(plot, crop);
          const stage = stageFor(progress);
          const remaining = Math.max(0, crop.growMinutes * 60 * 1000 - (Date.now() - plot.plantedAt));
          btn.classList.add('has-crop', `stage-${stage.key}`);
          if (progress >= 1) btn.classList.add('is-mature');
          btn.setAttribute('aria-label', `${crop.name}，${progress >= 1 ? '已成熟，点击收成' : `${stage.label}，剩余 ${formatDuration(remaining)}`}`);
          btn.innerHTML = `
            <span class="farm-soil">
              <span class="farm-crop-visual" aria-hidden="true">${crop.icon}</span>
              <span class="farm-crop-name">${crop.name}</span>
              <small class="farm-crop-time">${progress >= 1 ? '可以收成' : formatDuration(remaining)}</small>
            </span>`;
        }
        // Pointer hit area follows the diamond-shaped soil instead of the
        // plot button's large rectangular box. This prevents an overlapping
        // neighbour from swallowing clicks meant for a middle plot.
        btn.insertAdjacentHTML('beforeend', '<span class="farm-hit-area" aria-hidden="true"></span>');
        fragment.appendChild(btn);
      }
    }

    host.replaceChildren(fragment);
  }

  function onPlotClick(index) {
    const unlocked = unlockedLandCount();
    if (index >= unlocked) {
      const lvl = unlockLevelForPlot(index);
      toast('🔒 这块土地还在休养', `农场达到 Lv.${lvl} 就会自动开放。`);
      return;
    }
    const plot = state.plots[index];
    if (!plot.cropId) {
      openSeedPicker(index);
      return;
    }
    const crop = cropById(plot.cropId);
    if (progressFor(plot, crop) >= 1) harvest(index);
    else openCropStatus(index);
  }

  function openSeedPicker(index) {
    const options = CROPS.map(crop => {
      const owned = Number(state.seeds[crop.id]) || 0;
      const levelLocked = state.level < crop.unlockLevel;
      const unavailable = levelLocked || owned <= 0;
      return `
        <button class="farm-seed-choice ${unavailable ? 'is-disabled' : ''}" type="button"
          data-plant-crop="${crop.id}" data-plant-plot="${index}" ${unavailable ? 'disabled' : ''}>
          <span class="farm-seed-icon">${crop.icon}</span>
          <span><b>${crop.name}</b><small>${levelLocked ? `Lv.${crop.unlockLevel} 解锁` : `拥有 ${owned} 包 · ${crop.growMinutes} 分钟成熟`}</small></span>
          <em>${levelLocked ? '🔒' : `×${owned}`}</em>
        </button>`;
    }).join('');

    openModal({
      icon:'🌱', eyebrow:`FIELD ${String(index + 1).padStart(2,'0')}`, title:'选择要种下的种子',
      subtitle:'选好作物后可以决定种 1 格、数格，或一次种满目前可用空地。',
      body:`<div class="farm-seed-list">${options}</div><button class="farm-inline-link" type="button" data-open-panel="shop">种子不够？前往商店 →</button>`
    });
  }

  function emptyPlotIndices(preferredIndex = null) {
    const unlocked = unlockedLandCount();
    const empty = state.plots
      .slice(0, unlocked)
      .filter(plot => !plot.cropId)
      .map(plot => plot.id);

    if (Number.isInteger(preferredIndex) && empty.includes(preferredIndex)) {
      return [
        preferredIndex,
        ...empty.filter(index => index > preferredIndex),
        ...empty.filter(index => index < preferredIndex)
      ];
    }
    return empty;
  }

  function maxPlantQuantity(cropId, preferredIndex = null) {
    const crop = cropById(cropId);
    if (!crop || state.level < crop.unlockLevel) return 0;
    const owned = Math.max(0, Number(state.seeds[cropId]) || 0);
    return Math.min(owned, emptyPlotIndices(preferredIndex).length);
  }

  function maturityClock(crop) {
    const time = new Date(Date.now() + crop.growMinutes * 60 * 1000);
    return time.toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit', hour12:false});
  }

  function openPlantQuantity(preferredIndex, cropId, initialQty = 1, origin = 'field') {
    const crop = cropById(cropId);
    const maxQty = maxPlantQuantity(cropId, preferredIndex);
    if (!crop || maxQty <= 0) {
      toast('🌱 现在没有可种植的位置', '请确认种子数量与已开放空地。');
      return;
    }

    const qty = Math.max(1, Math.min(maxQty, Number(initialQty) || 1));
    const owned = Number(state.seeds[cropId]) || 0;
    const emptyCount = emptyPlotIndices(preferredIndex).length;
    const fieldLabel = Number.isInteger(preferredIndex)
      ? `从第 ${preferredIndex + 1} 格开始，之后按西北 → 东南顺序填入空地。`
      : '会按照西北 → 东南顺序，把作物种进目前可用的空地。';

    openModal({
      icon:crop.icon,
      eyebrow:'BATCH PLANT',
      title:`种植 ${crop.name}`,
      subtitle:`${fieldLabel} 成熟时间约 ${crop.growMinutes} 分钟。`,
      body:`
        <section class="farm-plant-quantity" data-plant-quantity-root
          data-crop-id="${crop.id}" data-preferred-plot="${Number.isInteger(preferredIndex) ? preferredIndex : ''}" data-origin="${origin}">
          <div class="farm-plant-summary">
            <div><span>持有种子</span><b>${owned} 包</b></div>
            <div><span>可用空地</span><b>${emptyCount} 格</b></div>
            <div><span>本次最多</span><b>${maxQty} 格</b></div>
            <div><span>预计成熟</span><b>${maturityClock(crop)}</b></div>
          </div>

          <div class="farm-qty-title">本次种植数量</div>
          <div class="farm-qty-stepper">
            <button type="button" data-plant-qty-step="-1" aria-label="减少一格">−</button>
            <strong><span id="farmPlantQtyValue">${qty}</span><small> / ${maxQty} 格</small></strong>
            <button type="button" data-plant-qty-step="1" aria-label="增加一格">＋</button>
          </div>

          <div class="farm-qty-range-wrap">
            <input id="farmPlantQtyRange" class="farm-qty-range" type="range" min="1" max="${maxQty}" step="1" value="${qty}" ${maxQty === 1 ? 'disabled' : ''} aria-label="选择种植数量" />
            <div class="farm-qty-range-labels"><span>1</span><button type="button" data-plant-all>全部 ${maxQty}</button></div>
          </div>

          <div class="farm-plant-costline">
            <span>${crop.icon} ${crop.name}</span>
            <b>需要种子 ×<span id="farmPlantSeedCost">${qty}</span></b>
          </div>

          <div class="farm-plant-actions">
            ${origin === 'field' && Number.isInteger(preferredIndex) ? `<button type="button" class="is-secondary" data-back-seed-picker="${preferredIndex}">返回选种</button>` : `<button type="button" class="is-secondary" data-open-panel="bag">返回背包</button>`}
            <button type="button" class="is-primary" data-confirm-batch-plant>开始种植 <span id="farmPlantConfirmQty">${qty}</span> 格</button>
          </div>
        </section>`
    });
    requestAnimationFrame(() => updatePlantQuantity(qty));
  }

  function updatePlantQuantity(value) {
    const root = document.querySelector('[data-plant-quantity-root]');
    const range = $('farmPlantQtyRange');
    if (!root || !range) return;
    const max = Number(range.max) || 1;
    const qty = Math.max(1, Math.min(max, Number(value) || 1));
    range.value = String(qty);
    $('farmPlantQtyValue').textContent = qty;
    $('farmPlantSeedCost').textContent = qty;
    $('farmPlantConfirmQty').textContent = qty;
    root.style.setProperty('--farm-qty-pct', `${max <= 1 ? 100 : ((qty - 1) / (max - 1)) * 100}%`);
  }

  async function plantBatch(preferredIndex, cropId, qty) {
    const crop = cropById(cropId);
    if (!crop || state.level < crop.unlockLevel) return;
    const targets = emptyPlotIndices(preferredIndex);
    const maxQty = Math.min(targets.length, Number(state.seeds[cropId]) || 0);
    qty = Math.max(1, Math.min(maxQty, Number(qty) || 1));
    if (qty <= 0) return;

    const chosen = targets.slice(0, qty);
    closeModal();

    for (let i = 0; i < chosen.length; i += 1) {
      const index = chosen[i];
      const plot = state.plots[index];
      if (!plot || plot.cropId || (state.seeds[cropId] || 0) <= 0) continue;

      state.seeds[cropId] -= 1;
      plot.cropId = cropId;
      plot.plantedAt = Date.now();
      state.stats.plant += 1;
      state.history.push({type:'plant', cropId, plotId:index, at:Date.now()});
      saveState();
      renderField();
      renderStats();
      renderTaskDot();

      const planted = document.querySelector(`.farm-plot[data-plot="${index}"] .farm-soil`);
      if (planted) planted.classList.add('is-just-planted');
      await new Promise(resolve => setTimeout(resolve, 85));
    }

    saveState();
    renderAll();
    toast(`${crop.icon} 已种下 ${crop.name} ×${chosen.length} 格`, `${crop.growMinutes} 分钟后回来看看。`);
  }

  function openCropStatus(index) {
    const plot = state.plots[index];
    const crop = cropById(plot.cropId);
    const progress = progressFor(plot, crop);
    const stage = stageFor(progress);
    const totalMs = crop.growMinutes * 60 * 1000;
    const remaining = Math.max(0, totalMs - (Date.now() - plot.plantedAt));
    openModal({
      icon:crop.icon, eyebrow:`FIELD ${String(index + 1).padStart(2,'0')}`, title:`${crop.name} · ${stage.label}`,
      subtitle:`这格作物正在成长，成熟后预计可收成 ${crop.yieldMin}～${crop.yieldMax} 个。`,
      body:`
        <div class="farm-crop-detail">
          <div class="farm-crop-detail-icon">${crop.icon}</div>
          <div class="farm-crop-detail-info">
            <b>剩余 ${formatDuration(remaining)}</b>
            <div class="farm-detail-progress"><i style="width:${Math.round(progress*100)}%"></i></div>
            <small>成熟时间 ${crop.growMinutes} 分钟 · 收成 EXP +${crop.exp}</small>
          </div>
        </div>
        <p class="farm-soft-note">不用一直停留在页面。离开后计时不会停止，回来时会依实际经过时间继续成长。</p>`
    });
  }

  function maturePlotIndices() {
    return state.plots
      .filter(plot => {
        if (!plot?.cropId) return false;
        const crop = cropById(plot.cropId);
        return crop && progressFor(plot, crop) >= 1;
      })
      .map(plot => plot.id);
  }

  function updateHarvestAllButton() {
    const button = $('farmHarvestAll');
    const count = $('farmHarvestReadyCount');
    if (!button || !count) return;
    const ready = maturePlotIndices().length;
    count.textContent = ready;
    button.disabled = ready <= 0;
    button.classList.toggle('is-ready', ready > 0);
    button.setAttribute('aria-label', ready > 0 ? `一键收获 ${ready} 格成熟作物` : '目前没有成熟作物');
  }

  async function harvestAll() {
    const ready = maturePlotIndices();
    if (!ready.length) {
      toast('🧺 还没有成熟作物', '等作物成熟后，就能在这里一次全部收成。');
      return;
    }

    const button = $('farmHarvestAll');
    if (button) button.disabled = true;
    const totals = {};
    let totalExp = 0;

    for (const index of ready) {
      const plot = state.plots[index];
      const crop = cropById(plot?.cropId);
      if (!crop || progressFor(plot, crop) < 1) continue;

      const tile = document.querySelector(`.farm-plot[data-plot="${index}"] .farm-soil`);
      if (tile) tile.classList.add('is-batch-harvesting');
      await new Promise(resolve => setTimeout(resolve, 75));

      const amount = randomInt(crop.yieldMin, crop.yieldMax);
      state.produce[crop.id] = (state.produce[crop.id] || 0) + amount;
      totals[crop.id] = (totals[crop.id] || 0) + amount;
      totalExp += crop.exp;
      state.stats.harvest += 1;
      state.history.push({type:'harvest', cropId:crop.id, amount, at:Date.now(), batch:true});
      plot.cropId = null;
      plot.plantedAt = null;
    }

    addExp(totalExp);
    saveState();
    renderAll();
    const summary = Object.entries(totals)
      .map(([cropId, amount]) => { const crop = cropById(cropId); return `${crop?.icon || ''}${crop?.name || cropId} ×${amount}`; })
      .join('、');
    toast(`🧺 一键收获完成 · ${ready.length} 格`, `${summary}${totalExp ? ` · EXP +${totalExp}` : ''}`, 'harvest');
  }

  function harvest(index) {
    const plot = state.plots[index];
    const crop = cropById(plot.cropId);
    if (!crop || progressFor(plot, crop) < 1) return;
    const amount = randomInt(crop.yieldMin, crop.yieldMax);
    state.produce[crop.id] = (state.produce[crop.id] || 0) + amount;
    state.stats.harvest += 1;
    state.history.push({type:'harvest', cropId:crop.id, amount, at:Date.now()});
    plot.cropId = null;
    plot.plantedAt = null;
    addExp(crop.exp);
    saveState();
    renderAll();
    toast(`${crop.icon} 收成 ${crop.name} ×${amount}`, `农场经验 +${crop.exp} EXP`, 'harvest');
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function buySeed(cropId, qty = 1) {
    const crop = cropById(cropId);
    qty = Math.max(1, Number(qty) || 1);
    if (!crop || state.level < crop.unlockLevel) return;
    const cost = crop.seedPrice * qty;
    if (state.coins < cost) {
      toast('🪙 金币不够', `购买 ${crop.name}种子 ×${qty} 需要 ${cost} 金币。`);
      return;
    }
    state.coins -= cost;
    state.seeds[cropId] = (state.seeds[cropId] || 0) + qty;
    saveState();
    renderAll();
    toast(`${crop.icon} 买到了 ${crop.name}种子 ×${qty}`, `花费 ${cost} 金币。`);
  }

  function sellProduce(cropId, qty) {
    const crop = cropById(cropId);
    const owned = Number(state.produce[cropId]) || 0;
    qty = qty === 'all' ? owned : Math.min(owned, Math.max(1, Number(qty) || 1));
    if (!crop || qty <= 0) return;
    const income = crop.sellPrice * qty;
    state.produce[cropId] -= qty;
    state.coins += income;
    state.stats.sell += qty;
    state.history.push({type:'sell', cropId, amount:qty, coins:income, at:Date.now()});
    saveState();
    renderAll();
    toast('🪙 出售完成', `${crop.name} ×${qty} · 获得 ${income} 金币。`);
  }

  function taskProgress(task) {
    return Math.min(task.target, Number(state.stats[task.type]) || 0);
  }

  function isTaskComplete(task) {
    return taskProgress(task) >= task.target;
  }

  function isTaskClaimed(task) {
    return state.claimedTasks.includes(task.id);
  }

  function claimTask(id) {
    const task = TASKS.find(t => t.id === id);
    if (!task || task.future || !isTaskComplete(task) || isTaskClaimed(task)) return;
    state.claimedTasks.push(id);
    if (task.reward.coins) state.coins += task.reward.coins;
    if (task.reward.exp) addExp(task.reward.exp);
    if (task.reward.seeds) {
      Object.entries(task.reward.seeds).forEach(([cropId, qty]) => {
        state.seeds[cropId] = (state.seeds[cropId] || 0) + qty;
      });
    }
    saveState();
    renderAll();
    toast('📜 任务奖励已领取', `${task.title} · ${task.rewardText}`, 'task');
  }

  function renderTaskDot() {
    const hasClaimable = TASKS.some(task => !task.future && isTaskComplete(task) && !isTaskClaimed(task));
    $('farmTaskDot').hidden = !hasClaimable;
  }

  function openPanel(panel) {
    activePanel = panel;
    const meta = {
      shop:{icon:'🛒', eyebrow:'FARM SHOP', title:'种子商店', subtitle:'不同作物会随着农场等级逐步解锁。'},
      bag:{icon:'🎒', eyebrow:'INVENTORY', title:'我的背包', subtitle:'种子用于播种；成熟作物可以在这里出售换取金币。'},
      tasks:{icon:'📜', eyebrow:'FARM QUEST', title:'农场任务', subtitle:'跟着任务认识农场，完成目标还能拿到种子、金币与经验。'},
      ranking:{icon:'🏆', eyebrow:'RANKING', title:'农场排行榜', subtitle:'查看真实云端玩家的等级榜与金币榜，也可以直接发送好友申请。'},
      friends:{icon:'👥', eyebrow:'FRIENDS', title:'农场好友', subtitle:'管理好友申请与好友列表，也可以直接拜访好友农场。'}
    }[panel];
    if (!meta) return;
    openModal({...meta, body:''});
    renderActivePanel();
  }

  function renderActivePanel() {
    const body = $('farmModalBody');
    if (!body || !activePanel || $('farmModal').hidden) return;

    if (activePanel === 'shop') {
      body.innerHTML = `<div class="farm-shop-grid">${CROPS.map(crop => {
        const locked = state.level < crop.unlockLevel;
        return `<article class="farm-shop-item ${locked ? 'is-locked' : ''}">
          <div class="farm-shop-crop"><span>${crop.icon}</span><div><b>${crop.name}种子</b><small>${crop.growMinutes} 分钟成熟 · 产量 ${crop.yieldMin}～${crop.yieldMax}</small></div></div>
          <p>${crop.note}</p>
          <div class="farm-shop-meta"><span>🪙 ${crop.seedPrice} / 包</span><span>出售 ${crop.sellPrice} / 个</span><span>EXP +${crop.exp}</span></div>
          ${locked
            ? `<button disabled>🔒 Lv.${crop.unlockLevel} 解锁</button>`
            : `<div class="farm-shop-buy"><button type="button" data-buy-seed="${crop.id}" data-qty="1">买 1</button><button type="button" data-buy-seed="${crop.id}" data-qty="5">买 5</button><em>背包 ×${state.seeds[crop.id] || 0}</em></div>`}
        </article>`;
      }).join('')}</div>`;
      return;
    }

    if (activePanel === 'bag') {
      const seedItems = CROPS.filter(c => (state.seeds[c.id] || 0) > 0);
      const produceItems = CROPS.filter(c => (state.produce[c.id] || 0) > 0);
      body.innerHTML = `
        <section class="farm-bag-section">
          <header><b>🌱 种子</b><span>${seedItems.reduce((s,c)=>s+(state.seeds[c.id]||0),0)} 包</span></header>
          <div class="farm-bag-list">${seedItems.length ? seedItems.map(c => {
            const levelLocked = state.level < c.unlockLevel;
            const canPlant = !levelLocked && maxPlantQuantity(c.id) > 0;
            const plantLabel = levelLocked ? `Lv.${c.unlockLevel} 解锁` : (canPlant ? '种植' : '暂无空地');
            return `<div class="farm-bag-row farm-seed-bag-row"><span>${c.icon}</span><div><b>${c.name}种子</b><small>${c.growMinutes} 分钟成熟</small></div><em>×${state.seeds[c.id]}</em><button type="button" data-plant-from-bag="${c.id}" ${canPlant ? '' : 'disabled'}>${plantLabel}</button></div>`;
          }).join('') : '<p class="farm-empty-state">目前没有种子，可以到商店补货。</p>'}</div>
        </section>
        <section class="farm-bag-section">
          <header><b>🧺 农作物</b><span>${produceItems.reduce((s,c)=>s+(state.produce[c.id]||0),0)} 个</span></header>
          <div class="farm-bag-list">${produceItems.length ? produceItems.map(c => {
            const qty = state.produce[c.id] || 0;
            return `<div class="farm-bag-row farm-produce-row"><span>${c.icon}</span><div><b>${c.name}</b><small>单个售价 ${c.sellPrice} 金币 · 全售可得 ${qty*c.sellPrice}</small></div><em>×${qty}</em><div class="farm-sell-actions"><button type="button" data-sell="${c.id}" data-qty="1">卖 1</button><button type="button" data-sell="${c.id}" data-qty="all">全部出售</button></div></div>`;
          }).join('') : '<p class="farm-empty-state">成熟作物收成后会放到这里。</p>'}</div>
        </section>`;
      return;
    }

    if (activePanel === 'tasks') {
      body.innerHTML = `<div class="farm-task-list">${TASKS.map(task => {
        const progress = taskProgress(task);
        const complete = isTaskComplete(task);
        const claimed = isTaskClaimed(task);
        const pct = Math.min(100, Math.round((progress / task.target) * 100));
        let action = '';
        if (task.future) action = '<span class="farm-task-future">多人阶段开放</span>';
        else if (claimed) action = '<span class="farm-task-claimed">✓ 已领取</span>';
        else if (complete) action = `<button type="button" data-claim-task="${task.id}">领取奖励</button>`;
        else action = `<span class="farm-task-progress-text">${progress} / ${task.target}</span>`;
        return `<article class="farm-task-item ${complete ? 'is-complete' : ''} ${claimed ? 'is-claimed' : ''} ${task.future ? 'is-future' : ''}">
          <div class="farm-task-copy"><b>${task.title}</b><p>${task.desc}</p><small>奖励：${task.rewardText}</small></div>
          <div class="farm-task-side">${action}</div>
          <div class="farm-task-bar"><i style="width:${task.future ? 0 : pct}%"></i></div>
        </article>`;
      }).join('')}</div>`;
      return;
    }

    if (activePanel === 'ranking') {
      if (!rankingLoading && !rankingLoadedAt && !rankingError) setTimeout(() => loadRankings(false), 0);
      const rows = rankingRows;
      const currentUserId = cloudAuthUser()?.id || '';
      const list = rows.length ? rows.map(row => {
        const rank = Number(row.rank_no) || 0;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `<span>${rank}</span>`;
        const relation = String(row.relation_state || 'none');
        let action = '';
        if (row.user_id === currentUserId || relation === 'self') action = '<span class="farm-relation-label is-self">自己</span>';
        else if (relation === 'friend') action = `<button type="button" class="farm-friend-action is-visit" data-friend-visit="${escapeHtml(row.user_id)}">拜访</button>`;
        else if (relation === 'pending_out') action = '<span class="farm-relation-label is-pending">已申请</span>';
        else if (relation === 'pending_in') action = '<button type="button" class="farm-friend-action is-notice" data-open-panel="friends">待确认</button>';
        else action = `<button type="button" class="farm-friend-action" data-friend-add="${escapeHtml(row.user_id)}">＋ 好友</button>`;
        return `<article class="farm-ranking-row ${relation === 'self' ? 'is-self' : ''}">
          <div class="farm-rank-no">${medal}</div>
          <div class="farm-rank-player"><b>${escapeHtml(row.display_name)} <i>${genderSymbol(row.sex)}</i></b><small>Lv.${formatNumber(row.farm_level)}</small></div>
          <div class="farm-rank-value"><b>${rankingSort === 'coins' ? coinInline(row.coins) : `Lv.${formatNumber(row.farm_level)}`}</b><small>${rankingSort === 'coins' ? `Lv.${formatNumber(row.farm_level)}` : coinInline(row.coins)}</small></div>
          <div class="farm-rank-action">${action}</div>
        </article>`;
      }).join('') : '';

      body.innerHTML = `
        <div class="farm-ranking-toolbar">
          <div class="farm-ranking-tabs" role="tablist" aria-label="排行榜类型">
            <button type="button" data-ranking-tab="level" class="${rankingSort === 'level' ? 'is-active' : ''}">🌿 等级榜</button>
            <button type="button" data-ranking-tab="coins" class="${rankingSort === 'coins' ? 'is-active' : ''}"><span class="farm-coin-mini" aria-hidden="true"></span> 金币榜</button>
          </div>
          <button type="button" class="farm-refresh-button" data-refresh-ranking ${rankingLoading ? 'disabled' : ''}>↻ 刷新</button>
        </div>
        ${rankingLoading ? '<div class="farm-network-state"><span class="farm-spinner"></span><b>正在读取真实农场排名…</b></div>' : ''}
        ${rankingError ? `<div class="farm-network-state is-error"><b>⚠ ${escapeHtml(rankingError)}</b></div>` : ''}
        ${!rankingLoading && !rankingError && !rows.length ? '<div class="farm-network-state"><b>目前还没有可显示的农场玩家。</b><small>玩家建立云端农场后会自动出现在这里。</small></div>' : ''}
        ${!rankingLoading && !rankingError && rows.length ? `<div class="farm-ranking-list">${list}</div>` : ''}`;
      return;
    }

    if (activePanel === 'friends') {
      if (!friendsLoading && !friendsLoadedAt && !friendsError) setTimeout(() => loadFriends(false), 0);
      const incoming = friendRows.filter(row => row.relation_state === 'pending_in');
      const accepted = friendRows.filter(row => row.relation_state === 'friend');
      const outgoing = friendRows.filter(row => row.relation_state === 'pending_out');

      const friendCard = (row, mode) => {
        const safeId = escapeHtml(row.user_id);
        const base = `<div class="farm-friend-avatar">${row.sex === 'male' ? '♂' : row.sex === 'female' ? '♀' : '🌱'}</div>
          <div class="farm-friend-copy"><b>${escapeHtml(row.display_name)}</b><small>Lv.${formatNumber(row.farm_level)} · ${coinInline(row.coins)}</small></div>`;
        let actions = '';
        if (mode === 'incoming') actions = `<div class="farm-friend-buttons"><button type="button" class="is-primary" data-friend-accept="${safeId}">接受</button><button type="button" data-friend-reject="${safeId}">忽略</button></div>`;
        else if (mode === 'outgoing') actions = `<div class="farm-friend-buttons"><span>等待对方确认</span><button type="button" data-friend-cancel="${safeId}">取消</button></div>`;
        else actions = `<div class="farm-friend-buttons"><button type="button" class="is-primary" data-friend-visit="${safeId}">拜访农场</button><button type="button" data-friend-remove="${safeId}">删除</button></div>`;
        return `<article class="farm-friend-row">${base}${actions}</article>`;
      };

      body.innerHTML = `
        <div class="farm-friends-summary"><span>👥 好友 <b>${accepted.length}</b></span><span>📩 待确认 <b>${incoming.length}</b></span><button type="button" class="farm-refresh-button" data-refresh-friends ${friendsLoading ? 'disabled' : ''}>↻ 刷新</button></div>
        ${friendsLoading ? '<div class="farm-network-state"><span class="farm-spinner"></span><b>正在读取好友资料…</b></div>' : ''}
        ${friendsError ? `<div class="farm-network-state is-error"><b>⚠ ${escapeHtml(friendsError)}</b></div>` : ''}
        ${!friendsLoading && !friendsError ? `
          ${incoming.length ? `<section class="farm-friend-section"><header><b>📩 收到的申请</b><span>${incoming.length}</span></header>${incoming.map(row => friendCard(row,'incoming')).join('')}</section>` : ''}
          <section class="farm-friend-section"><header><b>👥 我的好友</b><span>${accepted.length}</span></header>${accepted.length ? accepted.map(row => friendCard(row,'friend')).join('') : '<p class="farm-empty-state">还没有好友。可以到排行榜找到农友并点击「＋ 好友」。</p>'}</section>
          ${outgoing.length ? `<section class="farm-friend-section"><header><b>⏳ 已送出的申请</b><span>${outgoing.length}</span></header>${outgoing.map(row => friendCard(row,'outgoing')).join('')}</section>` : ''}
          ` : ''}`;
    }
  }

  function openModal({icon='🌱', eyebrow='STELLAR FARM', title='农场', subtitle='', body=''}) {
    $('farmModalIcon').textContent = icon;
    $('farmModalEyebrow').textContent = eyebrow;
    $('farmModalTitle').textContent = title;
    $('farmModalSubtitle').textContent = subtitle;
    $('farmModalBody').innerHTML = body;
    $('farmModal').hidden = false;
    document.body.classList.add('farm-modal-open');
  }

  function closeModal() {
    $('farmModal').hidden = true;
    document.body.classList.remove('farm-modal-open');
    activePanel = null;
  }

  function toast(title, detail='', type='normal') {
    const host = $('farmToastRegion');
    if (!host) return;
    const el = document.createElement('div');
    el.className = `farm-toast farm-toast-${type}`;
    el.innerHTML = `<b>${title}</b>${detail ? `<span>${detail}</span>` : ''}`;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 260);
    }, 3200);
  }

  function pulseExp() {
    const card = document.querySelector('.farm-status-card');
    if (!card) return;
    card.classList.remove('is-leveling');
    void card.offsetWidth;
    card.classList.add('is-leveling');
    setTimeout(() => card.classList.remove('is-leveling'), 1200);
  }

  function refreshFieldTimers() {
    const host = $('farmField');
    if (!host) return;

    host.querySelectorAll('.farm-plot[data-plot]').forEach(btn => {
      const index = Number(btn.dataset.plot);
      const plot = state.plots[index];
      if (!plot?.cropId) return;

      const crop = cropById(plot.cropId);
      if (!crop) return;

      const progress = progressFor(plot, crop);
      const stage = stageFor(progress);
      const remaining = Math.max(0, crop.growMinutes * 60 * 1000 - (Date.now() - plot.plantedAt));

      ['seed','sprout','growing','almost','mature'].forEach(key => btn.classList.remove(`stage-${key}`));
      btn.classList.add(`stage-${stage.key}`);
      btn.classList.toggle('is-mature', progress >= 1);

      const time = btn.querySelector('.farm-crop-time');
      if (time) time.textContent = progress >= 1 ? '可以收成' : formatDuration(remaining);
      btn.setAttribute('aria-label', `${crop.name}，${progress >= 1 ? '已成熟，点击收成' : `${stage.label}，剩余 ${formatDuration(remaining)}`}`);
    });
    updateHarvestAllButton();
  }

  function tick() {
    renderStats();
    // Do not rebuild all 20 buttons every second. Replacing the DOM while the
    // pointer is resting on a plot makes hover feel jittery; only countdowns
    // and growth-stage classes need a one-second refresh.
    refreshFieldTimers();
    if (activePanel === 'tasks') renderActivePanel();
  }

  function handleClick(event) {
    if (event.target.closest('#farmHarvestAll')) {
      harvestAll();
      return;
    }

    const rankingTab = event.target.closest('[data-ranking-tab]');
    if (rankingTab) {
      const next = rankingTab.dataset.rankingTab === 'coins' ? 'coins' : 'level';
      if (rankingSort !== next) {
        rankingSort = next;
        rankingLoadedAt = 0;
        loadRankings(true);
      }
      return;
    }

    if (event.target.closest('[data-refresh-ranking]')) { rankingLoadedAt = 0; loadRankings(true); return; }
    if (event.target.closest('[data-refresh-friends]')) { friendsLoadedAt = 0; loadFriends(true); return; }

    const friendAdd = event.target.closest('[data-friend-add]');
    if (friendAdd) { requestFriend(friendAdd.dataset.friendAdd); return; }
    const friendAccept = event.target.closest('[data-friend-accept]');
    if (friendAccept) { respondFriend(friendAccept.dataset.friendAccept, true); return; }
    const friendReject = event.target.closest('[data-friend-reject]');
    if (friendReject) { respondFriend(friendReject.dataset.friendReject, false); return; }
    const friendCancel = event.target.closest('[data-friend-cancel]');
    if (friendCancel) { removeFriend(friendCancel.dataset.friendCancel, 'request'); return; }
    const friendRemove = event.target.closest('[data-friend-remove]');
    if (friendRemove) { removeFriend(friendRemove.dataset.friendRemove, 'friend'); return; }
    const friendVisit = event.target.closest('[data-friend-visit]');
    if (friendVisit) { visitFriend(friendVisit.dataset.friendVisit); return; }

    const plot = event.target.closest('[data-plot]');
    if (plot) {
      onPlotClick(Number(plot.dataset.plot));
      return;
    }

    const panel = event.target.closest('[data-farm-panel]');
    if (panel) {
      openPanel(panel.dataset.farmPanel);
      return;
    }

    if (event.target.closest('[data-farm-close]')) {
      closeModal();
      return;
    }

    const buy = event.target.closest('[data-buy-seed]');
    if (buy) {
      buySeed(buy.dataset.buySeed, buy.dataset.qty);
      return;
    }

    const sell = event.target.closest('[data-sell]');
    if (sell) {
      sellProduce(sell.dataset.sell, sell.dataset.qty);
      return;
    }

    const claim = event.target.closest('[data-claim-task]');
    if (claim) {
      claimTask(claim.dataset.claimTask);
      return;
    }

    const plantBtn = event.target.closest('[data-plant-crop]');
    if (plantBtn) {
      openPlantQuantity(Number(plantBtn.dataset.plantPlot), plantBtn.dataset.plantCrop, 1, 'field');
      return;
    }

    const bagPlant = event.target.closest('[data-plant-from-bag]');
    if (bagPlant) {
      activePanel = null;
      openPlantQuantity(null, bagPlant.dataset.plantFromBag, 1, 'bag');
      return;
    }

    const qtyStep = event.target.closest('[data-plant-qty-step]');
    if (qtyStep) {
      const range = $('farmPlantQtyRange');
      if (range) updatePlantQuantity(Number(range.value) + Number(qtyStep.dataset.plantQtyStep));
      return;
    }

    if (event.target.closest('[data-plant-all]')) {
      const range = $('farmPlantQtyRange');
      if (range) updatePlantQuantity(range.max);
      return;
    }

    const backSeed = event.target.closest('[data-back-seed-picker]');
    if (backSeed) {
      openSeedPicker(Number(backSeed.dataset.backSeedPicker));
      return;
    }

    if (event.target.closest('[data-confirm-batch-plant]')) {
      const root = document.querySelector('[data-plant-quantity-root]');
      const range = $('farmPlantQtyRange');
      if (!root || !range) return;
      const preferred = root.dataset.preferredPlot === '' ? null : Number(root.dataset.preferredPlot);
      plantBatch(preferred, root.dataset.cropId, Number(range.value));
      return;
    }

    const open = event.target.closest('[data-open-panel]');
    if (open) {
      openPanel(open.dataset.openPanel);
    }
  }

  function init() {
    document.addEventListener('click', handleClick);
    document.addEventListener('input', event => {
      if (event.target.matches('#farmPlantQtyRange')) updatePlantQuantity(event.target.value);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !$('farmModal').hidden) closeModal();
    });
    $('farmScrollTop')?.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
    window.addEventListener('stellar:player-profile-saved', () => { renderOwner(); invalidateMultiplayer(); });
    window.addEventListener('stellar:profile-updated', () => { renderOwner(); invalidateMultiplayer(); });
    window.addEventListener('stellar:auth-state', event => {
      const nextUserId = event.detail?.userId || '';
      if (cloudUserId && nextUserId && nextUserId !== cloudUserId) bootstrapCloud(true);
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && cloudReady && Date.now() - cloudLastSyncedAt > 15000) pullCloudState();
    });

    // The first visit task is intentionally ready immediately. Do not touch the
    // local revision before the initial cloud comparison, otherwise an older
    // browser copy could incorrectly look newer than the server save.
    state.stats.visit = Math.max(1, Number(state.stats.visit) || 0);
    saveState({touch:false, sync:false});
    renderAll();
    bootstrapCloud(false).then(() => loadFriends(true)).catch(() => {});

    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(tick, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
