(() => {
  'use strict';

  const FARM_BUILD = '0.13.16';
  const STORAGE_KEY = 'xingchen-farm-v1';
  const VERSION = 1;
  const PLOT_COUNT = 20;
  const INITIAL_COINS = 100;
  const CLOUD_TABLE = 'farm_saves';
  const CLOUD_SYNC_DELAY = 700;
  const CLOUD_REVISION_POLL_MS = 60000;
  const CLOUD_VISIBILITY_CHECK_MS = 15000;
  const SYNC_META_KEY = 'xingchen-farm-v1-sync-meta';
  const PENDING_OPS_KEY = 'xingchen-farm-v1-pending-ops';

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

  const MYSTERY_CROP = {
    id:'mystery', name:'蔬果盲盒', icon:'🎁', seedPrice:5, growMinutes:240,
    yieldMin:1, yieldMax:1, sellPrice:0, exp:12, unlockLevel:1, isMystery:true,
    note:'只要 5 金币。种下后固定等待 4 小时，成熟时随机揭晓一种蔬果；每盒收成 1 个，稀有作物也有机会出现。'
  };
  const PLANTABLES = [...CROPS, MYSTERY_CROP];

  // V0.13.16 — ROWEB-style crop atlas metadata. The source stays as one
  // transparent 4×4 sprite sheet; the browser only exposes the required cell.
  // Rows select the crop, columns select the visible growth phase. Anchor/tune
  // values keep each crop rooted to the same point on the farm plot.
  const CROP_ATLAS = Object.freeze({
    cols:4, rows:4, anchorX:50, anchorY:82,
    crops:Object.freeze({
      carrot:Object.freeze({row:0, scale:1.00, lift:0}),
      wheat:Object.freeze({row:1, scale:.96, lift:1}),
      corn:Object.freeze({row:2, scale:.90, lift:2}),
      tomato:Object.freeze({row:3, scale:.94, lift:1})
    })
  });

  const MYSTERY_POOL = [
    {id:'carrot', weight:26}, {id:'wheat', weight:22}, {id:'corn', weight:18},
    {id:'tomato', weight:14}, {id:'strawberry', weight:9}, {id:'pumpkin', weight:6},
    {id:'grape', weight:4}, {id:'starfruit', weight:1}
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


  const TITLES = [
    {id:'newbie', name:'新手', icon:'🌱', desc:'刚踏进星辰农场时就拥有的第一枚称号。'},
    {id:'novice_farmer', name:'新手农夫', icon:'🥕', desc:'完成第一次成熟作物收成。'},
    {id:'farmer', name:'农夫', icon:'🌾', desc:'累计收成 10 格成熟作物。'},
    {id:'skilled_farmer', name:'熟练农夫', icon:'🧺', desc:'累计收成 50 格成熟作物。'},
    {id:'harvest_master', name:'丰收达人', icon:'🌻', desc:'累计收成 100 格成熟作物。'},
    {id:'farm_master', name:'农场达人', icon:'🏡', desc:'累计收成 500 格成熟作物。'},
    {id:'legendary_farmer', name:'传奇农夫', icon:'⭐', desc:'累计收成 1000 格成熟作物。'},
    {id:'small_landlord', name:'小地主', icon:'🪙', desc:'农场曾经持有 1000 金币。'},
    {id:'ten_thousand', name:'万元户', icon:'💰', desc:'农场曾经持有 10000 金币。'},
    {id:'farm_tycoon', name:'农场富翁', icon:'👑', desc:'农场曾经持有 50000 金币。'},
    {id:'stellar_landlord', name:'星辰地主', icon:'✨', desc:'农场曾经持有 100000 金币。'},
    {id:'sowing_hand', name:'播种好手', icon:'🌱', desc:'累计播种 100 格农地。'},
    {id:'blindbox_fan', name:'盲盒爱好者', icon:'🎁', desc:'累计种下 10 个蔬果盲盒。'},
    {id:'blindbox_master', name:'盲盒达人', icon:'🎀', desc:'累计种下 100 个蔬果盲盒。'},
    {id:'steal_rookie', name:'路过摘一颗', icon:'🥷', desc:'第一次成功从好友农场偷到作物。'},
    {id:'steal_shadow', name:'神出鬼没', icon:'🌙', desc:'累计成功偷菜 10 次。'},
    {id:'steal_master', name:'偷菜高手', icon:'🕶️', desc:'累计成功偷菜 50 次。'},
    {id:'senior_farmer', name:'资深农夫', icon:'🌿', desc:'农场达到 Lv.10。'},
    {id:'stellar_host', name:'星辰农场主', icon:'🌟', desc:'农场达到 Lv.25。'},
    {id:'social_farmer', name:'农场社交家', icon:'🤝', desc:'拥有 20 位农场好友。'},
    {id:'popular_host', name:'人气农场主', icon:'🎉', desc:'拥有 50 位农场好友。'}
  ];

  const ACHIEVEMENT_GROUPS = [
    {id:'wealth', label:'财富之路', icon:'🪙'},
    {id:'harvest', label:'丰收之路', icon:'🧺'},
    {id:'plant', label:'播种之路', icon:'🌱'},
    {id:'blind', label:'盲盒之路', icon:'🎁'},
    {id:'steal', label:'偷菜之路', icon:'🥷'},
    {id:'growth', label:'成长之路', icon:'⭐'},
    {id:'social', label:'好友之路', icon:'🤝'}
  ];

  const ACHIEVEMENTS = [
    {id:'wealth100', group:'wealth', title:'第一桶金', desc:'农场最高持有金币达到 100。', metric:'maxCoins', target:100, reward:{exp:10}, rewardText:'EXP +10'},
    {id:'wealth200', group:'wealth', title:'小有积蓄', desc:'农场最高持有金币达到 200。', metric:'maxCoins', target:200, reward:{seeds:{carrot:3}}, rewardText:'红萝卜种子 ×3'},
    {id:'wealth500', group:'wealth', title:'农场存钱筒', desc:'农场最高持有金币达到 500。', metric:'maxCoins', target:500, reward:{exp:30}, rewardText:'EXP +30'},
    {id:'wealth1000', group:'wealth', title:'千元农户', desc:'农场最高持有金币达到 1000。', metric:'maxCoins', target:1000, reward:{seeds:{mystery:2}, title:'small_landlord'}, rewardText:'蔬果盲盒 ×2 · 称号【小地主】'},
    {id:'wealth5000', group:'wealth', title:'家底渐厚', desc:'农场最高持有金币达到 5000。', metric:'maxCoins', target:5000, reward:{exp:100}, rewardText:'EXP +100'},
    {id:'wealth10000', group:'wealth', title:'万元农户', desc:'农场最高持有金币达到 10000。', metric:'maxCoins', target:10000, reward:{seeds:{mystery:5}, title:'ten_thousand'}, rewardText:'蔬果盲盒 ×5 · 称号【万元户】'},
    {id:'wealth50000', group:'wealth', title:'农场富豪', desc:'农场最高持有金币达到 50000。', metric:'maxCoins', target:50000, reward:{exp:300, title:'farm_tycoon'}, rewardText:'EXP +300 · 称号【农场富翁】'},
    {id:'wealth100000', group:'wealth', title:'星辰大地主', desc:'农场最高持有金币达到 100000。', metric:'maxCoins', target:100000, reward:{seeds:{mystery:10}, title:'stellar_landlord'}, rewardText:'蔬果盲盒 ×10 · 称号【星辰地主】'},

    {id:'harvestA1', group:'harvest', title:'第一次丰收', desc:'累计收成 1 格成熟作物。', metric:'harvest', target:1, reward:{seeds:{carrot:2}, title:'novice_farmer'}, rewardText:'红萝卜种子 ×2 · 称号【新手农夫】'},
    {id:'harvestA5', group:'harvest', title:'渐入佳境', desc:'累计收成 5 格成熟作物。', metric:'harvest', target:5, reward:{exp:15}, rewardText:'EXP +15'},
    {id:'harvestA10', group:'harvest', title:'熟悉农务', desc:'累计收成 10 格成熟作物。', metric:'harvest', target:10, reward:{seeds:{wheat:3}, title:'farmer'}, rewardText:'小麦种子 ×3 · 称号【农夫】'},
    {id:'harvestA25', group:'harvest', title:'小有成果', desc:'累计收成 25 格成熟作物。', metric:'harvest', target:25, reward:{exp:40}, rewardText:'EXP +40'},
    {id:'harvestA50', group:'harvest', title:'农田老手', desc:'累计收成 50 格成熟作物。', metric:'harvest', target:50, reward:{seeds:{mystery:2}, title:'skilled_farmer'}, rewardText:'蔬果盲盒 ×2 · 称号【熟练农夫】'},
    {id:'harvestA100', group:'harvest', title:'百次丰收', desc:'累计收成 100 格成熟作物。', metric:'harvest', target:100, reward:{exp:120, title:'harvest_master'}, rewardText:'EXP +120 · 称号【丰收达人】'},
    {id:'harvestA500', group:'harvest', title:'五百次收成', desc:'累计收成 500 格成熟作物。', metric:'harvest', target:500, reward:{seeds:{mystery:5}, title:'farm_master'}, rewardText:'蔬果盲盒 ×5 · 称号【农场达人】'},
    {id:'harvestA1000', group:'harvest', title:'千次丰收', desc:'累计收成 1000 格成熟作物。', metric:'harvest', target:1000, reward:{exp:500, title:'legendary_farmer'}, rewardText:'EXP +500 · 称号【传奇农夫】'},

    {id:'plantA10', group:'plant', title:'十次播种', desc:'累计播种 10 格农地。', metric:'plant', target:10, reward:{seeds:{carrot:3}}, rewardText:'红萝卜种子 ×3'},
    {id:'plantA50', group:'plant', title:'田里总有新芽', desc:'累计播种 50 格农地。', metric:'plant', target:50, reward:{exp:50}, rewardText:'EXP +50'},
    {id:'plantA100', group:'plant', title:'百次播种', desc:'累计播种 100 格农地。', metric:'plant', target:100, reward:{seeds:{mystery:2}, title:'sowing_hand'}, rewardText:'蔬果盲盒 ×2 · 称号【播种好手】'},
    {id:'plantA500', group:'plant', title:'辛勤耕作', desc:'累计播种 500 格农地。', metric:'plant', target:500, reward:{exp:200}, rewardText:'EXP +200'},
    {id:'plantA1000', group:'plant', title:'千次播种', desc:'累计播种 1000 格农地。', metric:'plant', target:1000, reward:{seeds:{mystery:5}}, rewardText:'蔬果盲盒 ×5'},

    {id:'blindA1', group:'blind', title:'第一次试手气', desc:'累计种下 1 个蔬果盲盒。', metric:'blindBoxPlant', target:1, reward:{exp:10}, rewardText:'EXP +10'},
    {id:'blindA10', group:'blind', title:'盲盒爱好者', desc:'累计种下 10 个蔬果盲盒。', metric:'blindBoxPlant', target:10, reward:{exp:50, title:'blindbox_fan'}, rewardText:'EXP +50 · 称号【盲盒爱好者】'},
    {id:'blindA50', group:'blind', title:'拆盒不停手', desc:'累计种下 50 个蔬果盲盒。', metric:'blindBoxPlant', target:50, reward:{seeds:{mystery:5}}, rewardText:'蔬果盲盒 ×5'},
    {id:'blindA100', group:'blind', title:'百盒收藏', desc:'累计种下 100 个蔬果盲盒。', metric:'blindBoxPlant', target:100, reward:{exp:250, title:'blindbox_master'}, rewardText:'EXP +250 · 称号【盲盒达人】'},

    {id:'stealA1', group:'steal', title:'路过摘一颗', desc:'累计成功偷菜 1 次。', metric:'steals', target:1, reward:{exp:10, title:'steal_rookie'}, rewardText:'EXP +10 · 称号【路过摘一颗】'},
    {id:'stealA10', group:'steal', title:'神出鬼没', desc:'累计成功偷菜 10 次。', metric:'steals', target:10, reward:{exp:50, title:'steal_shadow'}, rewardText:'EXP +50 · 称号【神出鬼没】'},
    {id:'stealA50', group:'steal', title:'偷菜高手', desc:'累计成功偷菜 50 次。', metric:'steals', target:50, reward:{seeds:{mystery:3}, title:'steal_master'}, rewardText:'蔬果盲盒 ×3 · 称号【偷菜高手】'},
    {id:'stealA100', group:'steal', title:'来无影去无踪', desc:'累计成功偷菜 100 次。', metric:'steals', target:100, reward:{exp:200}, rewardText:'EXP +200'},

    {id:'level5', group:'growth', title:'农场渐渐成形', desc:'农场达到 Lv.5。', metric:'level', target:5, reward:{seeds:{mystery:1}}, rewardText:'蔬果盲盒 ×1'},
    {id:'level10', group:'growth', title:'十级农场', desc:'农场达到 Lv.10。', metric:'level', target:10, reward:{exp:80, title:'senior_farmer'}, rewardText:'EXP +80 · 称号【资深农夫】'},
    {id:'level20', group:'growth', title:'成熟农场', desc:'农场达到 Lv.20。', metric:'level', target:20, reward:{seeds:{mystery:5}}, rewardText:'蔬果盲盒 ×5'},
    {id:'level25', group:'growth', title:'完整星辰农场', desc:'农场达到 Lv.25，并解锁完整 20 格农地。', metric:'level', target:25, reward:{exp:300, title:'stellar_host'}, rewardText:'EXP +300 · 称号【星辰农场主】'},

    {id:'friend20', group:'social', title:'农场社交家', desc:'好友达到 20 人。', metric:'friend', target:20, reward:{seeds:{mystery:3}, title:'social_farmer'}, rewardText:'蔬果盲盒 ×3 · 称号【农场社交家】'},
    {id:'friend50', group:'social', title:'人气农场', desc:'好友达到 50 人。', metric:'friend', target:50, reward:{exp:300, title:'popular_host'}, rewardText:'EXP +300 · 称号【人气农场主】'}
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
  let cloudPushQueued = false;
  let cloudLastSyncedAt = 0;
  let cloudLastRevisionCheckAt = 0;
  let cloudRevisionCheckBusy = false;
  let cloudRevision = 0;

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
  let activeTaskTab = 'newbie';
  let activeAchievementGroup = 'wealth';

  const $ = (id) => document.getElementById(id);
  const cropById = (id) => id === MYSTERY_CROP.id ? MYSTERY_CROP : CROPS.find(c => c.id === id);
  const seedItems = () => PLANTABLES;
  const titleById = (id) => TITLES.find(item => item.id === id) || TITLES[0];
  const achievementById = (id) => ACHIEVEMENTS.find(item => item.id === id) || null;

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
      stats: { visit:1, plant:0, harvest:0, sell:0, friend:0, blindBoxPlant:0, steals:0, maxCoins:INITIAL_COINS },
      claimedTasks: [],
      claimedAchievements: [],
      titles: { unlocked:['newbie'], equipped:'newbie' },
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
      const harvestYield = Number(old?.harvestYield);
      const stolenCount = Number(old?.stolenCount);
      const resultCropId = CROPS.some(c => c.id === old?.resultCropId) ? old.resultCropId : null;
      return {
        id:i,
        cropId:cropById(old?.cropId) ? old.cropId : null,
        plantedAt:Number(old?.plantedAt) || null,
        resultCropId,
        harvestYield:Number.isFinite(harvestYield) && harvestYield > 0 ? Math.floor(harvestYield) : null,
        stolenCount:Number.isFinite(stolenCount) && stolenCount > 0 ? Math.floor(stolenCount) : 0
      };
    });
    merged.seeds = {...base.seeds, ...(raw?.seeds || {})};
    merged.produce = {...(raw?.produce || {})};
    merged.stats = {...base.stats, ...(raw?.stats || {})};
    merged.claimedTasks = Array.isArray(raw?.claimedTasks) ? raw.claimedTasks : [];
    merged.claimedAchievements = Array.isArray(raw?.claimedAchievements) ? raw.claimedAchievements : [];
    merged.history = Array.isArray(raw?.history) ? raw.history.slice(-30) : [];
    merged.coins = Math.max(0, Number(merged.coins) || 0);
    merged.level = Math.max(1, Number(merged.level) || 1);
    merged.exp = Math.max(0, Number(merged.exp) || 0);
    for (const key of ['visit','plant','harvest','sell','friend','blindBoxPlant','steals']) {
      merged.stats[key] = Math.max(0, Number(merged.stats[key]) || 0);
    }
    merged.stats.maxCoins = Math.max(merged.coins, Number(merged.stats.maxCoins) || 0, INITIAL_COINS);
    const validTitleIds = new Set(TITLES.map(item => item.id));
    const rawUnlocked = Array.isArray(raw?.titles?.unlocked) ? raw.titles.unlocked : [];
    const unlocked = [...new Set(['newbie', ...rawUnlocked.filter(id => validTitleIds.has(id))])];
    const equipped = validTitleIds.has(raw?.titles?.equipped) && unlocked.includes(raw.titles.equipped)
      ? raw.titles.equipped : 'newbie';
    merged.titles = {unlocked, equipped};
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

  function readSyncMeta() {
    try {
      const raw = JSON.parse(localStorage.getItem(SYNC_META_KEY) || 'null');
      return raw && typeof raw === 'object' ? raw : {dirty:false, userId:'', changedAt:0, baseRevision:0};
    } catch (_) {
      return {dirty:false, userId:'', changedAt:0, baseRevision:0};
    }
  }

  function writeSyncMeta(meta) {
    try { localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta)); } catch (_) {}
  }

  function readPendingOps() {
    try {
      const raw = JSON.parse(localStorage.getItem(PENDING_OPS_KEY) || '[]');
      return Array.isArray(raw) ? raw.filter(op => op && typeof op === 'object' && op.id && op.type) : [];
    } catch (_) {
      return [];
    }
  }

  function writePendingOps(ops) {
    try { localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(Array.isArray(ops) ? ops : [])); } catch (_) {}
  }

  function mutationUserId() {
    return cloudAuthUser()?.id || state.ownerUserId || '';
  }

  function pendingOpsForUser(userId = mutationUserId()) {
    return readPendingOps().filter(op => !op.userId || !userId || op.userId === userId);
  }

  function newMutationId(prefix = 'farm') {
    const random = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    return `${prefix}-${Date.now()}-${random}`;
  }

  function queuePendingOp(op) {
    const ops = readPendingOps();
    const next = {
      ...op,
      id: op.id || newMutationId(op.type || 'farm'),
      userId: op.userId ?? mutationUserId(),
      createdAt: Number(op.createdAt) || Date.now()
    };
    ops.push(next);
    writePendingOps(ops.slice(-80));
    markLocalDirty();
    return next;
  }

  function taskById(id) {
    return TASKS.find(task => task.id === id) || null;
  }

  function updateHighWatermarks() {
    state.stats = {...createDefaultState().stats, ...(state.stats || {})};
    state.stats.maxCoins = Math.max(INITIAL_COINS, Number(state.stats.maxCoins) || 0, Number(state.coins) || 0);
  }

  function unlockTitle(titleId) {
    if (!TITLES.some(item => item.id === titleId)) return false;
    if (!state.titles || typeof state.titles !== 'object') state.titles = {unlocked:['newbie'], equipped:'newbie'};
    if (!Array.isArray(state.titles.unlocked)) state.titles.unlocked = ['newbie'];
    if (state.titles.unlocked.includes(titleId)) return false;
    state.titles.unlocked.push(titleId);
    return true;
  }

  function applyTaskReward(task, {silent=false} = {}) {
    if (!task || state.claimedTasks.includes(task.id)) return false;
    state.claimedTasks.push(task.id);
    if (task.reward.coins) state.coins += task.reward.coins;
    if (task.reward.exp) addExp(task.reward.exp, {silent});
    if (task.reward.seeds) {
      Object.entries(task.reward.seeds).forEach(([cropId, qty]) => {
        state.seeds[cropId] = (state.seeds[cropId] || 0) + qty;
      });
    }
    updateHighWatermarks();
    return true;
  }

  function applyAchievementReward(achievement, {silent=false} = {}) {
    if (!achievement || state.claimedAchievements.includes(achievement.id)) return false;
    state.claimedAchievements.push(achievement.id);
    const reward = achievement.reward || {};
    if (reward.coins) state.coins += reward.coins;
    if (reward.exp) addExp(reward.exp, {silent});
    if (reward.seeds) {
      Object.entries(reward.seeds).forEach(([cropId, qty]) => {
        state.seeds[cropId] = (state.seeds[cropId] || 0) + qty;
      });
    }
    if (reward.title) unlockTitle(reward.title);
    updateHighWatermarks();
    return true;
  }

  function plantMutationApplied(targetState, op) {
    if (!Array.isArray(op?.plots) || !op.plots.length) return true;
    return op.plots.every(item => {
      const plot = targetState?.plots?.[Number(item.index)];
      return plot && plot.cropId === op.cropId && Number(plot.plantedAt) === Number(item.plantedAt);
    });
  }

  function pendingOpApplied(targetState, op) {
    if (!op || !targetState) return false;
    if (op.type === 'claim-task') return Array.isArray(targetState.claimedTasks) && targetState.claimedTasks.includes(op.taskId);
    if (op.type === 'claim-achievement') return Array.isArray(targetState.claimedAchievements) && targetState.claimedAchievements.includes(op.achievementId);
    if (op.type === 'equip-title') return targetState?.titles?.equipped === op.titleId;
    if (op.type === 'plant') return plantMutationApplied(targetState, op);
    return false;
  }

  function clearConfirmedPendingOps(remoteState, userId) {
    const ops = readPendingOps();
    const remaining = ops.filter(op => {
      if (op.userId && userId && op.userId !== userId) return true;
      return !pendingOpApplied(remoteState, op);
    });
    if (remaining.length !== ops.length) writePendingOps(remaining);
    return remaining;
  }

  function replayPendingOps(userId = mutationUserId()) {
    const ops = pendingOpsForUser(userId);
    if (!ops.length) return false;
    let changed = false;

    for (const op of ops) {
      if (op.type === 'claim-task') {
        const task = taskById(op.taskId);
        if (task && applyTaskReward(task, {silent:true})) changed = true;
        continue;
      }

      if (op.type === 'claim-achievement') {
        const achievement = achievementById(op.achievementId);
        if (achievement && applyAchievementReward(achievement, {silent:true})) changed = true;
        continue;
      }

      if (op.type === 'equip-title') {
        if (state.titles?.unlocked?.includes(op.titleId) && state.titles.equipped !== op.titleId) {
          state.titles.equipped = op.titleId;
          changed = true;
        }
        continue;
      }

      if (op.type === 'plant' && Array.isArray(op.plots)) {
        for (const item of op.plots) {
          const index = Number(item.index);
          const plot = state.plots[index];
          if (!plot) continue;
          if (plot.cropId === op.cropId && Number(plot.plantedAt) === Number(item.plantedAt)) continue;
          if (plot.cropId || (state.seeds[op.cropId] || 0) <= 0) continue;
          state.seeds[op.cropId] -= 1;
          plot.cropId = op.cropId;
          plot.plantedAt = Number(item.plantedAt) || Date.now();
          plot.resultCropId = item.resultCropId || null;
          plot.harvestYield = Number(item.harvestYield) || 1;
          plot.stolenCount = 0;
          state.stats.plant += 1;
          if (op.cropId === 'mystery') state.stats.blindBoxPlant += 1;
          state.history.push({type:'plant', cropId:op.cropId, plotId:index, at:plot.plantedAt, recovered:true, mutationId:op.id});
          changed = true;
        }
      }
    }

    if (changed) {
      const previous = Number(state.updatedAt) || 0;
      state.updatedAt = Math.max(Date.now(), previous + 1);
      state.ownerUserId = userId || state.ownerUserId || '';
      writeLocalState();
      markLocalDirty();
    }
    return changed;
  }

  function markLocalDirty() {
    const userId = cloudAuthUser()?.id || state.ownerUserId || '';
    writeSyncMeta({dirty:true, userId, changedAt:Date.now(), baseRevision:Math.max(0, Number(cloudRevision) || 0)});
  }

  function markLocalClean(userId = cloudAuthUser()?.id || state.ownerUserId || '') {
    writeSyncMeta({dirty:false, userId, changedAt:Date.now(), baseRevision:Math.max(0, Number(cloudRevision) || 0)});
  }

  function hasUnsyncedLocalChanges(userId) {
    const meta = readSyncMeta();
    if (!meta.dirty) return false;
    if (meta.userId && userId && meta.userId !== userId) return false;
    return true;
  }

  function saveState({touch=true, sync=true} = {}) {
    updateHighWatermarks();
    if (touch) {
      // Keep the local revision strictly monotonic. Several farm actions can
      // happen inside the same millisecond (batch planting / task rewards), so
      // Date.now() alone is not enough to tell an in-flight cloud snapshot
      // from a newer local edit.
      const previous = Number(state.updatedAt) || 0;
      state.updatedAt = Math.max(Date.now(), previous + 1);
    }
    writeLocalState();
    if (sync) {
      markLocalDirty();
      scheduleCloudPush();
    }
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
      /get_farm_rankings_v2|get_farm_friends_v2|get_friend_farm_v2|steal_friend_crop_v2|get_farm_rankings|get_farm_friends|get_friend_farm|steal_friend_crop|request_farm_friend|farm_friendships|farm_steals|schema cache|does not exist|could not find/i.test(text);
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
    if (!cloudReady && !force) return {ok:false, skipped:true};
    const sb = cloudClient();
    const user = cloudAuthUser();
    if (!sb || !user?.id) return {ok:false, skipped:true};

    if (cloudBusy) {
      cloudPushQueued = true;
      return {ok:false, queued:true};
    }

    cloudUserId = user.id;
    cloudBusy = true;
    cloudPushQueued = false;
    setCloudStatus('syncing', '☁ 正在同步');

    let uploadSucceeded = false;
    try {
      state.ownerUserId = user.id;
      writeLocalState();

      const snapshotStamp = Number(state.updatedAt) || Date.now();
      const snapshot = typeof structuredClone === 'function'
        ? structuredClone(state)
        : JSON.parse(JSON.stringify(state));
      const expectedRevision = Math.max(0, Number(cloudRevision) || 0);

      const {data:savedRows, error:saveError} = await sb.rpc('save_farm_state_v3', {
        p_state:snapshot,
        p_client_updated_at:snapshotStamp,
        p_expected_revision:expectedRevision
      });
      if (saveError) throw saveError;

      const saved = Array.isArray(savedRows) ? savedRows[0] : savedRows;
      if (!saved || saved.revision == null) throw new Error('save_farm_state_v3 did not return save metadata');

      const serverRevision = Math.max(0, Number(saved.revision) || 0);
      const verifiedStamp = Number(saved.client_updated_at) || snapshotStamp;
      cloudReady = true;
      cloudLastSyncedAt = Date.now();
      cloudLastRevisionCheckAt = cloudLastSyncedAt;
      uploadSucceeded = true;

      if (saved.applied === false) {
        // Only a revision conflict returns the authoritative full state. Successful
        // saves return metadata only, which keeps normal farm writes lightweight.
        const authoritativeState = saved.conflict_state;
        if (!authoritativeState || typeof authoritativeState !== 'object') {
          throw new Error('save_farm_state_v3 conflict did not return the authoritative state');
        }
        cloudRevision = serverRevision;
        clearConfirmedPendingOps(authoritativeState, user.id);
        state = normalizeState(authoritativeState);
        state.updatedAt = Math.max(verifiedStamp, Number(state.updatedAt) || 0);
        state.ownerUserId = user.id;
        writeLocalState();
        markLocalClean(user.id);

        const replayed = replayPendingOps(user.id);
        renderAll();
        if (replayed || pendingOpsForUser(user.id).length) {
          markLocalDirty();
          cloudPushQueued = true;
          setCloudStatus('syncing', '☁ 合并云端更新');
        } else {
          setCloudStatus('ready', '☁ 云端已同步');
        }
        return {ok:false, conflict:true, revision:serverRevision};
      }

      cloudRevision = serverRevision;
      // The server stored this exact frozen snapshot, so pending idempotent
      // operations can be confirmed locally without downloading that JSON again.
      clearConfirmedPendingOps(snapshot, user.id);

      const currentStamp = Number(state.updatedAt) || 0;
      const stillPending = pendingOpsForUser(user.id).length > 0;
      if (currentStamp === snapshotStamp && !cloudPushQueued && !stillPending) {
        markLocalClean(user.id);
        setCloudStatus('ready', '☁ 云端已同步');
      } else {
        markLocalDirty();
        cloudPushQueued = true;
        setCloudStatus('syncing', '☁ 正在同步');
      }
      return {ok:true, snapshotStamp, verifiedStamp, revision:serverRevision};
    } catch (error) {
      markLocalDirty();
      cloudReady = false;
      console.error('[Stellar Farm] cloud save failed', error);
      const text = String(error?.message || error || '');
      if (relationMissing(error) || /save_farm_state_v3|PGRST202|function .* does not exist/i.test(text)) {
        setCloudStatus('setup', '☁ 请执行 009 流量优化 SQL');
      } else if (/permission denied|42501/i.test(text)) {
        setCloudStatus('setup', '☁ 请更新至 V0.13.14 并执行 009 SQL');
      } else {
        setCloudStatus('error', '☁ 云端暂不可用');
      }
      return {ok:false, error};
    } finally {
      cloudBusy = false;
      if (uploadSucceeded && cloudPushQueued && cloudReady) {
        cloudPushQueued = false;
        clearTimeout(cloudSyncTimer);
        cloudSyncTimer = setTimeout(() => pushCloudState(true), 0);
      }
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
        .select('state,client_updated_at,updated_at,revision')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;

      if (!data?.state) {
        cloudRevision = 0;
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
      const remoteRevision = Math.max(1, Number(data.revision) || 1);
      const belongsToDifferentUser = Boolean(state.ownerUserId && state.ownerUserId !== user.id);
      const pending = !belongsToDifferentUser ? pendingOpsForUser(user.id) : [];
      const localDirty = !belongsToDifferentUser && hasUnsyncedLocalChanges(user.id);
      const meta = readSyncMeta();
      const baseRevision = Math.max(0, Number(meta.baseRevision) || 0);

      cloudReady = true;
      cloudRevision = remoteRevision;

      if (belongsToDifferentUser) {
        state = normalizeState(data.state);
        state.updatedAt = Math.max(remoteStamp, Number(state.updatedAt) || 0);
        state.ownerUserId = user.id;
        writeLocalState();
        markLocalClean(user.id);
        renderAll();
      } else if (localDirty && baseRevision === remoteRevision) {
        // These local edits were made from exactly the current server revision,
        // so they are safe to submit with compare-and-swap protection.
        await pushCloudState(true);
        renderAll();
      } else if (localDirty || pending.length) {
        // The server changed since this local copy was based on it. Server wins;
        // only explicitly journaled idempotent operations are replayed.
        clearConfirmedPendingOps(data.state, user.id);
        state = normalizeState(data.state);
        state.updatedAt = Math.max(remoteStamp, Number(state.updatedAt) || 0);
        state.ownerUserId = user.id;
        writeLocalState();
        markLocalClean(user.id);
        const replayed = replayPendingOps(user.id);
        renderAll();
        if (replayed || pendingOpsForUser(user.id).length) await pushCloudState(true);
      } else {
        // A clean browser copy never pushes merely because its client clock is
        // newer. The database row is authoritative on every normal reload.
        state = normalizeState(data.state);
        state.updatedAt = Math.max(remoteStamp, Number(state.updatedAt) || 0);
        state.ownerUserId = user.id;
        writeLocalState();
        markLocalClean(user.id);
        renderAll();
      }

      cloudLastSyncedAt = Date.now();
      cloudLastRevisionCheckAt = cloudLastSyncedAt;
      setCloudStatus('ready', '☁ 云端已同步');
      return {ok:true, source:'cloud', revision:cloudRevision};
    } catch (error) {
      cloudReady = false;
      const text = String(error?.message || error || '');
      if (/revision|save_farm_state_v3|PGRST202/i.test(text)) setCloudStatus('setup', '☁ 请执行 009 流量优化 SQL');
      else if (relationMissing(error)) setCloudStatus('setup', '☁ 云端待启用');
      else setCloudStatus('error', '☁ 使用本机存档');
      return {ok:false, error};
    }
  }

  async function checkCloudRevision({force=false} = {}) {
    if (!cloudReady || cloudBusy || cloudRevisionCheckBusy) return {ok:false, skipped:true};
    const sb = cloudClient();
    const user = cloudAuthUser();
    if (!sb || !user?.id) return {ok:false, skipped:true};

    const now = Date.now();
    if (!force && now - cloudLastRevisionCheckAt < CLOUD_REVISION_POLL_MS) {
      return {ok:true, skipped:true, revision:cloudRevision};
    }

    cloudRevisionCheckBusy = true;
    try {
      // Poll only the 8-byte server revision. The full JSON save is fetched only
      // when another device, tab, or a friend steal actually changed the farm.
      const {data, error} = await sb
        .from(CLOUD_TABLE)
        .select('revision')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;

      cloudLastRevisionCheckAt = Date.now();
      if (!data) return await pullCloudState();

      const remoteRevision = Math.max(1, Number(data.revision) || 1);
      if (remoteRevision !== Math.max(0, Number(cloudRevision) || 0)) {
        return await pullCloudState();
      }
      return {ok:true, changed:false, revision:remoteRevision};
    } catch (error) {
      console.warn('[Stellar Farm] revision check failed', error);
      return {ok:false, error};
    } finally {
      cloudRevisionCheckBusy = false;
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
    // Rankings/friends only need the public profile. Never force a full farm
    // save merely because a panel is opened; that used to create unnecessary
    // write races with an older in-memory farm state.
    try { await window.XingchenAuth?.syncProfile?.(true); } catch (_) {}
  }

  function syncFriendStat(rows = friendRows) {
    const count = rows.filter(row => row.relation_state === 'friend').length;
    if ((Number(state.stats.friend) || 0) === count) return;
    state.stats.friend = count;
    // Friend count is derived from the server relationship table. Keep the UI
    // cache local, but do not turn it into a full farm save write.
    writeLocalState();
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
      const {data, error} = await sb.rpc('get_farm_rankings_v2', {p_sort:rankingSort, p_limit:50});
      if (error) throw error;
      rankingRows = Array.isArray(data) ? data : [];
      rankingLoadedAt = Date.now();
    } catch (error) {
      rankingRows = [];
      rankingError = multiplayerMissing(error)
        ? '多人农场尚未启用：请先在 Supabase SQL Editor 执行 20260924_010_farm_achievements_titles.sql。'
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
      const {data, error} = await sb.rpc('get_farm_friends_v2');
      if (error) throw error;
      friendRows = Array.isArray(data) ? data : [];
      friendsLoadedAt = Date.now();
      syncFriendStat(friendRows);
    } catch (error) {
      friendRows = [];
      friendsError = multiplayerMissing(error)
        ? '好友系统尚未启用：请先在 Supabase SQL Editor 执行 20260924_010_farm_achievements_titles.sql。'
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
    const friendId = String(payload?.user_id || '');
    const rawPlots = Array.isArray(payload?.plots) ? payload.plots : [];
    const plots = Array.from({length:PLOT_COUNT}, (_, index) => {
      const raw = rawPlots[index] || {};
      return {
        id:index,
        cropId:cropById(raw?.cropId) ? raw.cropId : null,
        plantedAt:Number(raw?.plantedAt) || null,
        resultCropId:CROPS.some(c => c.id === raw?.resultCropId) ? raw.resultCropId : null,
        harvestYield:Number(raw?.harvestYield) || null,
        stolenCount:Math.max(0, Number(raw?.stolenCount) || 0),
        stolenByMe:Boolean(raw?.stolenByMe)
      };
    });
    let matureCount = 0;
    let stealableCount = 0;
    const tiles = [];

    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        const index = row * 5 + col;
        const plot = plots[index];
        let cls = 'farm-plot farm-visit-plot';
        let content = '';
        let attrs = '';

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
          const remainingMs = Math.max(0, crop.growMinutes * 60 * 1000 - (Date.now() - plot.plantedAt));
          const shown = displayCropForPlot(plot, crop, progress);
          cls += ` has-crop stage-${stage.key}`;
          if (crop.isMystery) cls += ' is-mystery-crop';
          if (progress >= 1) {
            cls += ' is-mature';
            matureCount += 1;
          }

          let stealTag = '';
          if (progress >= 1) {
            const total = crop.isMystery ? 1 : Math.max(crop.yieldMin, Math.min(crop.yieldMax, Number(plot.harvestYield) || crop.yieldMin));
            const remain = Math.max(1, total - plot.stolenCount);
            if (crop.isMystery || remain <= 1) {
              stealTag = '<span class="farm-steal-tag is-protected">保底 1</span>';
            } else if (plot.stolenByMe) {
              stealTag = '<span class="farm-steal-tag is-done">已偷过</span>';
            } else {
              cls += ' can-steal';
              stealableCount += 1;
              attrs = ` data-steal-friend="${escapeHtml(friendId)}" data-steal-plot="${index}" aria-label="偷取 ${escapeHtml(shown.name)}"`;
              stealTag = '<span class="farm-steal-tag">偷菜 1–3</span>';
            }
          }

          content = `<span class="farm-soil"><small class="farm-crop-time">${progress >= 1 ? '已成熟' : formatDuration(remainingMs)}</small>${cropVisualMarkup(shown, progress)}<span class="farm-crop-name">${shown.name}</span>${stealTag}</span>`;
        }

        tiles.push(`<button type="button" class="${cls}" style="--farm-row:${row};--farm-col:${col};--farm-depth:${(row * 10) + col}"${attrs}>${content}</button>`);
      }
    }

    const name = escapeHtml(payload?.display_name || '星辰农友');
    const sex = genderSymbol(payload?.sex);
    const friendTitle = titleById(payload?.title_id || 'newbie');
    return `
      <section class="farm-visit-summary">
        <div><b>${name}${sex ? ` <i>${sex}</i>` : ''}</b><small>Lv.${formatNumber(friendLevel)} · <span class="farm-public-title">${friendTitle.icon}【${escapeHtml(friendTitle.name)}】</span></small></div>
        <span>${coinInline(payload?.coins || 0, {label:true})}</span>
        <em>成熟 ${matureCount} 格 · 可偷 ${stealableCount} 格</em>
      </section>
      <div class="farm-steal-rule">🥷 成熟作物可以偷取 1～3 个；同一位好友对同一轮作物只能偷一次，地主永远至少保留 1 个。</div>
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
      const {data, error} = await sb.rpc('get_friend_farm_v2', {p_friend:friendId});
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
        subtitle:'看看好友最近种了什么；成熟作物可以直接点击偷菜。',
        body:renderFriendFarmVisit(payload)
      });
    } catch (error) {
      const detail = multiplayerMissing(error)
        ? '请先执行 20260924_010_farm_achievements_titles.sql。'
        : '好友农场暂时读取失败，请稍后再试。';
      openModal({icon:'🏡', eyebrow:'FARM VISIT', title:'拜访失败', subtitle:detail, body:'<div class="farm-visit-actions"><button type="button" class="farm-friend-action" data-open-panel="friends">返回好友列表</button></div>'});
    }
  }


  async function stealFriendCrop(friendId, plotId) {
    const sb = cloudClient();
    const user = cloudAuthUser();
    if (!sb || !user?.id || !friendId || !Number.isInteger(Number(plotId))) return;

    const tile = document.querySelector(`[data-steal-friend="${CSS.escape(friendId)}"][data-steal-plot="${Number(plotId)}"]`);
    if (tile) {
      tile.disabled = true;
      tile.classList.add('is-stealing');
    }

    try {
      const {data, error} = await sb.rpc('steal_friend_crop_v2', {p_friend:friendId, p_plot:Number(plotId)});
      if (error) throw error;
      const payload = data && typeof data === 'object' ? data : {};
      if (!payload.ok) {
        const messages = {
          already_stolen:['🥷 这一轮已经偷过了','等好友重新种下一轮作物后再来看看。'],
          protected:['🌱 这格不能再偷了','地主至少会保留 1 个作物。'],
          not_mature:['⏳ 还没成熟','等它成熟后再回来。'],
          no_crop:['🌿 这格已经没有可偷的作物','好友可能刚刚已经收成了。'],
          not_friend:['👥 无法偷菜','只有已经确认的农场好友才能偷菜。'],
          no_own_farm:['☁ 请先建立自己的云端农场','建立云端农场后才能把偷到的作物放进背包。']
        };
        const [title, detail] = messages[payload.reason] || ['🥷 偷菜没有成功','请刷新好友农场后再试。'];
        toast(title, detail);
        await visitFriend(friendId);
        return;
      }

      const crop = CROPS.find(c => c.id === payload.crop_id) || CROPS[0];
      if (payload.thief_state && typeof payload.thief_state === 'object') {
        state = normalizeState(payload.thief_state);
        state.ownerUserId = user.id;
        writeLocalState();
        renderAll();
        // steal_friend_crop mutates farm_saves on the server and migration 008
        // bumps its revision. Pull once so this tab learns that new revision
        // before its next local mutation.
        await pullCloudState({preferRemote:true});
      }
      toast(`🥷 偷到 ${crop.icon}${crop.name} ×${Number(payload.amount) || 1}`, `好友这格至少还保留 ${Number(payload.owner_remaining) || 1} 个。`, 'harvest');
      await new Promise(resolve => setTimeout(resolve, 260));
      await visitFriend(friendId);
    } catch (error) {
      toast('🥷 偷菜失败', multiplayerMissing(error) ? '请先执行 20260924_010_farm_achievements_titles.sql。' : '网络暂时不稳定，请稍后再试。');
      if (tile) {
        tile.disabled = false;
        tile.classList.remove('is-stealing');
      }
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

  function addExp(amount, {silent=false} = {}) {
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
      if (!silent) {
        toast('🌟 农场升级！', extra, 'level');
        pulseExp();
      }
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

  function cropSpriteStage(progress) {
    // Visual stages deliberately change at 30 / 60 / 90%. The fourth frame
    // can be visible shortly before harvest, but the crop is only collectible
    // after progress reaches 100%.
    if (progress >= .90) return 3;
    if (progress >= .60) return 2;
    if (progress >= .30) return 1;
    return 0;
  }

  function cropSpritePosition(cropId, progress) {
    const meta = CROP_ATLAS.crops[cropId];
    if (!meta) return null;
    const col = cropSpriteStage(progress);
    const xStep = 100 / (CROP_ATLAS.cols - 1);
    const yStep = 100 / (CROP_ATLAS.rows - 1);
    return {
      row:meta.row, col,
      x:col * xStep, y:meta.row * yStep,
      scale:meta.scale, lift:meta.lift,
      anchorX:CROP_ATLAS.anchorX, anchorY:CROP_ATLAS.anchorY
    };
  }

  function cropVisualMarkup(shown, progress) {
    const sprite = cropSpritePosition(shown?.id, progress);
    if (sprite) {
      return `<span class="farm-crop-visual is-sprite" aria-hidden="true" data-crop-sprite="${escapeHtml(shown.id)}" style="--crop-x:${sprite.x}%;--crop-y:${sprite.y}%;--crop-scale:${sprite.scale};--crop-lift:${sprite.lift}px;--crop-anchor-x:${sprite.anchorX}%;--crop-anchor-y:${sprite.anchorY}%"></span>`;
    }
    return `<span class="farm-crop-visual" aria-hidden="true">${escapeHtml(shown?.icon || '🌱')}</span>`;
  }

  function applyCropVisual(el, shown, progress) {
    if (!el) return;
    const sprite = cropSpritePosition(shown?.id, progress);
    if (sprite) {
      el.classList.add('is-sprite');
      el.dataset.cropSprite = shown.id;
      el.textContent = '';
      el.style.setProperty('--crop-x', `${sprite.x}%`);
      el.style.setProperty('--crop-y', `${sprite.y}%`);
      el.style.setProperty('--crop-scale', String(sprite.scale));
      el.style.setProperty('--crop-lift', `${sprite.lift}px`);
      el.style.setProperty('--crop-anchor-x', `${sprite.anchorX}%`);
      el.style.setProperty('--crop-anchor-y', `${sprite.anchorY}%`);
      return;
    }
    el.classList.remove('is-sprite');
    delete el.dataset.cropSprite;
    el.style.removeProperty('--crop-x');
    el.style.removeProperty('--crop-y');
    el.style.removeProperty('--crop-scale');
    el.style.removeProperty('--crop-lift');
    el.style.removeProperty('--crop-anchor-x');
    el.style.removeProperty('--crop-anchor-y');
    el.textContent = shown?.icon || '🌱';
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
    const badge = $('farmEquippedTitle');
    if (badge) {
      const title = titleById(state.titles?.equipped || 'newbie');
      badge.innerHTML = `<span>${title.icon}</span><b>【${escapeHtml(title.name)}】</b>`;
      badge.setAttribute('aria-label', `目前称号：${title.name}，点击管理称号`);
    }
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
          const shown = displayCropForPlot(plot, crop, progress);
          btn.classList.add('has-crop', `stage-${stage.key}`);
          if (crop?.isMystery) btn.classList.add('is-mystery-crop');
          if (progress >= 1) btn.classList.add('is-mature');
          btn.setAttribute('aria-label', `${shown.name}，${progress >= 1 ? '已成熟，点击收成' : `${stage.label}，剩余 ${formatDuration(remaining)}`}`);
          btn.innerHTML = `
            <span class="farm-soil">
              <small class="farm-crop-time">${progress >= 1 ? '可以收成' : formatDuration(remaining)}</small>
              ${cropVisualMarkup(shown, progress)}
              <span class="farm-crop-name">${shown.name}</span>
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
    const options = seedItems().map(crop => {
      const owned = Number(state.seeds[crop.id]) || 0;
      const levelLocked = state.level < crop.unlockLevel;
      const unavailable = levelLocked || owned <= 0;
      return `
        <button class="farm-seed-choice ${unavailable ? 'is-disabled' : ''}" type="button"
          data-plant-crop="${crop.id}" data-plant-plot="${index}" ${unavailable ? 'disabled' : ''}>
          <span class="farm-seed-icon">${crop.icon}</span>
          <span><b>${crop.name}${crop.isMystery ? '' : ''}</b><small>${levelLocked ? `Lv.${crop.unlockLevel} 解锁` : `拥有 ${owned} 包 · ${crop.isMystery ? '固定 4 小时 · 随机蔬果' : `${crop.growMinutes} 分钟成熟`}`}</small></span>
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

  function growDurationLabel(crop) {
    const minutes = Math.max(0, Number(crop?.growMinutes) || 0);
    if (minutes > 0 && minutes % 60 === 0) {
      const hours = minutes / 60;
      return `${hours} 小时后`;
    }
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const rest = minutes % 60;
      return `${hours} 小时 ${rest} 分钟后`;
    }
    return `${minutes} 分钟后`;
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
      subtitle:`${fieldLabel} ${crop.isMystery ? '固定 4 小时后随机揭晓一种蔬果。' : `成熟时间约 ${crop.growMinutes} 分钟。`}`,
      body:`
        <section class="farm-plant-quantity" data-plant-quantity-root
          data-crop-id="${crop.id}" data-preferred-plot="${Number.isInteger(preferredIndex) ? preferredIndex : ''}" data-origin="${origin}">
          <div class="farm-plant-summary">
            <div><span>持有种子</span><b>${owned} 包</b></div>
            <div><span>可用空地</span><b>${emptyCount} 格</b></div>
            <div><span>本次最多</span><b>${maxQty} 格</b></div>
            <div class="farm-maturity-summary"><span>${crop.isMystery ? '盲盒揭晓' : '预计成熟'}</span><b>${growDurationLabel(crop)}</b><small>约 ${maturityClock(crop)} 成熟</small></div>
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
    const basePlantedAt = Date.now();
    const mutation = queuePendingOp({
      type:'plant',
      cropId,
      plots:chosen.map((index, offset) => ({
        index,
        plantedAt:basePlantedAt + offset,
        resultCropId:crop.isMystery ? randomMysteryCropId() : null,
        harvestYield:crop.isMystery ? 1 : randomInt(crop.yieldMin, crop.yieldMax)
      }))
    });
    closeModal();

    for (let i = 0; i < mutation.plots.length; i += 1) {
      const item = mutation.plots[i];
      const index = Number(item.index);
      const plot = state.plots[index];
      if (!plot || plot.cropId || (state.seeds[cropId] || 0) <= 0) continue;

      state.seeds[cropId] -= 1;
      plot.cropId = cropId;
      plot.plantedAt = Number(item.plantedAt);
      plot.resultCropId = item.resultCropId || null;
      plot.harvestYield = Number(item.harvestYield) || 1;
      plot.stolenCount = 0;
      state.stats.plant += 1;
      if (crop.isMystery) state.stats.blindBoxPlant += 1;
      state.history.push({type:'plant', cropId, plotId:index, at:plot.plantedAt, mutationId:mutation.id});
      saveState();
      renderField();
      renderStats();
      renderTaskDot();

      const planted = document.querySelector(`.farm-plot[data-plot="${index}"] .farm-soil`);
      if (planted) planted.classList.add('is-just-planted');
      await new Promise(resolve => setTimeout(resolve, 85));
    }

    saveState();
    if (cloudReady) await pushCloudState(true);
    renderAll();
    toast(`${crop.icon} 已种下 ${crop.name} ×${chosen.length} 格`, crop.isMystery ? '4 小时后揭晓随机蔬果。' : `${crop.growMinutes} 分钟后回来看看。`);
  }

  function openCropStatus(index) {
    const plot = state.plots[index];
    const crop = cropById(plot.cropId);
    const progress = progressFor(plot, crop);
    const stage = stageFor(progress);
    const shown = displayCropForPlot(plot, crop, progress);
    const totalMs = crop.growMinutes * 60 * 1000;
    const remaining = Math.max(0, totalMs - (Date.now() - plot.plantedAt));
    const mysteryNote = crop.isMystery
      ? '蔬果盲盒固定成长 4 小时，成熟前不会揭晓结果；成熟后会随机变成一种蔬果，每盒收成 1 个。'
      : `这格作物正在成长，成熟后预计可收成 ${crop.yieldMin}～${crop.yieldMax} 个。`;
    openModal({
      icon:shown.icon, eyebrow:`FIELD ${String(index + 1).padStart(2,'0')}`, title:`${shown.name} · ${stage.label}`,
      subtitle:mysteryNote,
      body:`
        <div class="farm-crop-detail">
          <div class="farm-crop-detail-icon">${shown.icon}</div>
          <div class="farm-crop-detail-info">
            <b>剩余 ${formatDuration(remaining)}</b>
            <div class="farm-detail-progress"><i style="width:${Math.round(progress*100)}%"></i></div>
            <small>${crop.isMystery ? '固定 4 小时 · 成熟时揭晓' : `成熟时间 ${crop.growMinutes} 分钟`} · 收成 EXP +${crop.exp}</small>
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

      const result = harvestResultForPlot(plot, crop);
      if (!result) continue;
      state.produce[result.crop.id] = (state.produce[result.crop.id] || 0) + result.amount;
      totals[result.crop.id] = (totals[result.crop.id] || 0) + result.amount;
      totalExp += crop.exp;
      state.stats.harvest += 1;
      state.history.push({type:'harvest', cropId:result.crop.id, sourceCropId:crop.id, amount:result.amount, at:Date.now(), batch:true});
      clearPlot(plot);
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
    const result = harvestResultForPlot(plot, crop);
    if (!result) return;
    state.produce[result.crop.id] = (state.produce[result.crop.id] || 0) + result.amount;
    state.stats.harvest += 1;
    state.history.push({type:'harvest', cropId:result.crop.id, sourceCropId:crop.id, amount:result.amount, at:Date.now()});
    clearPlot(plot);
    addExp(crop.exp);
    saveState();
    renderAll();
    const reveal = crop.isMystery ? ` · 盲盒开出 ${result.crop.name}` : '';
    toast(`${result.crop.icon} 收成 ${result.crop.name} ×${result.amount}`, `农场经验 +${crop.exp} EXP${reveal}`, 'harvest');
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomMysteryCropId() {
    const total = MYSTERY_POOL.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of MYSTERY_POOL) {
      roll -= item.weight;
      if (roll < 0) return item.id;
    }
    return 'carrot';
  }

  function displayCropForPlot(plot, crop, progress = progressFor(plot, crop)) {
    if (!crop?.isMystery) return crop || MYSTERY_CROP;
    if (progress < 1) return {id:'mystery', name:'蔬果盲盒', icon:'🎁'};
    const result = CROPS.find(c => c.id === plot?.resultCropId) || CROPS[0];
    return {id:result.id, name:`盲盒·${result.name}`, icon:result.icon};
  }

  function harvestResultForPlot(plot, crop) {
    if (!plot || !crop) return null;
    if (crop.isMystery) {
      const result = CROPS.find(c => c.id === plot.resultCropId) || CROPS[0];
      return {crop:result, amount:1};
    }
    const total = Math.max(crop.yieldMin, Math.min(crop.yieldMax, Number(plot.harvestYield) || randomInt(crop.yieldMin, crop.yieldMax)));
    const stolen = Math.max(0, Math.min(total - 1, Number(plot.stolenCount) || 0));
    return {crop, amount:Math.max(1, total - stolen)};
  }

  function clearPlot(plot) {
    plot.cropId = null;
    plot.plantedAt = null;
    plot.resultCropId = null;
    plot.harvestYield = null;
    plot.stolenCount = 0;
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
    toast(`${crop.icon} 买到了 ${crop.isMystery ? crop.name : `${crop.name}种子`} ×${qty}`, `花费 ${cost} 金币。`);
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

  function achievementProgress(achievement) {
    if (!achievement) return 0;
    if (achievement.metric === 'level') return Math.min(achievement.target, Number(state.level) || 1);
    return Math.min(achievement.target, Number(state.stats?.[achievement.metric]) || 0);
  }

  function isAchievementComplete(achievement) {
    return achievementProgress(achievement) >= achievement.target;
  }

  function isAchievementClaimed(achievement) {
    return state.claimedAchievements.includes(achievement.id);
  }

  async function claimAchievement(id) {
    const achievement = achievementById(id);
    if (!achievement || !isAchievementComplete(achievement) || isAchievementClaimed(achievement)) return;
    queuePendingOp({type:'claim-achievement', achievementId:id});
    applyAchievementReward(achievement);
    saveState();
    if (cloudReady) await pushCloudState(true);
    renderAll();
    toast('🏅 成就奖励已领取', `${achievement.title} · ${achievement.rewardText}`, 'task');
  }

  async function equipTitle(titleId) {
    const title = titleById(titleId);
    if (!state.titles?.unlocked?.includes(title.id) || state.titles.equipped === title.id) return;
    queuePendingOp({type:'equip-title', titleId:title.id});
    state.titles.equipped = title.id;
    saveState();
    if (cloudReady) await pushCloudState(true);
    renderAll();
    toast(`${title.icon} 称号已装备`, `现在显示为【${title.name}】。`, 'task');
  }

  async function claimTask(id) {
    const task = TASKS.find(t => t.id === id);
    if (!task || task.future || !isTaskComplete(task) || isTaskClaimed(task)) return;

    // Journal the idempotent claim before touching coins/EXP. If the user hits
    // F5 immediately, this record survives and will be replayed exactly once
    // after cloud restore instead of resurrecting the old unclaimed task.
    queuePendingOp({type:'claim-task', taskId:id});
    applyTaskReward(task);
    saveState();
    if (cloudReady) await pushCloudState(true);
    renderAll();
    toast('📜 任务奖励已领取', `${task.title} · ${task.rewardText}`, 'task');
  }

  function renderTaskDot() {
    const taskClaimable = TASKS.some(task => !task.future && isTaskComplete(task) && !isTaskClaimed(task));
    const achievementClaimable = ACHIEVEMENTS.some(item => isAchievementComplete(item) && !isAchievementClaimed(item));
    $('farmTaskDot').hidden = !(taskClaimable || achievementClaimable);
  }

  function openPanel(panel) {
    activePanel = panel;
    const meta = {
      shop:{icon:'🛒', eyebrow:'FARM SHOP', title:'种子商店', subtitle:'购买普通种子，也可以试试 5 金币一个、固定 4 小时的蔬果盲盒。'},
      bag:{icon:'🎒', eyebrow:'INVENTORY', title:'我的背包', subtitle:'种子用于播种；成熟作物可以在这里出售换取金币。'},
      tasks:{icon:'📜', eyebrow:'FARM QUEST', title:'任务与成就', subtitle:'新手任务教你经营农场；长期成就会解锁奖励与可以展示的专属称号。'},
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
      body.innerHTML = `<div class="farm-shop-grid">${seedItems().map(crop => {
        const locked = state.level < crop.unlockLevel;
        return `<article class="farm-shop-item ${locked ? 'is-locked' : ''}">
          <div class="farm-shop-crop"><span>${crop.icon}</span><div><b>${crop.isMystery ? crop.name : `${crop.name}种子`}</b><small>${crop.isMystery ? '固定 4 小时 · 随机蔬果 ×1' : `${crop.growMinutes} 分钟成熟 · 产量 ${crop.yieldMin}～${crop.yieldMax}`}</small></div></div>
          <p>${crop.note}</p>
          <div class="farm-shop-meta"><span>🪙 ${crop.seedPrice} / ${crop.isMystery ? '个' : '包'}</span>${crop.isMystery ? '<span>随机 8 种蔬果</span>' : `<span>出售 ${crop.sellPrice} / 个</span>`}<span>EXP +${crop.exp}</span></div>
          ${locked
            ? `<button disabled>🔒 Lv.${crop.unlockLevel} 解锁</button>`
            : `<div class="farm-shop-buy"><button type="button" data-buy-seed="${crop.id}" data-qty="1">买 1</button><button type="button" data-buy-seed="${crop.id}" data-qty="5">买 5</button><em>背包 ×${state.seeds[crop.id] || 0}</em></div>`}
        </article>`;
      }).join('')}</div>`;
      return;
    }

    if (activePanel === 'bag') {
      const seedItemsInBag = seedItems().filter(c => (state.seeds[c.id] || 0) > 0);
      const produceItems = CROPS.filter(c => (state.produce[c.id] || 0) > 0);
      body.innerHTML = `
        <section class="farm-bag-section">
          <header><b>🌱 种子</b><span>${seedItemsInBag.reduce((s,c)=>s+(state.seeds[c.id]||0),0)} 包</span></header>
          <div class="farm-bag-list">${seedItemsInBag.length ? seedItemsInBag.map(c => {
            const levelLocked = state.level < c.unlockLevel;
            const canPlant = !levelLocked && maxPlantQuantity(c.id) > 0;
            const plantLabel = levelLocked ? `Lv.${c.unlockLevel} 解锁` : (canPlant ? '种植' : '暂无空地');
            return `<div class="farm-bag-row farm-seed-bag-row"><span>${c.icon}</span><div><b>${c.isMystery ? c.name : `${c.name}种子`}</b><small>${c.isMystery ? '固定 4 小时 · 随机蔬果' : `${c.growMinutes} 分钟成熟`}</small></div><em>×${state.seeds[c.id]}</em><button type="button" data-plant-from-bag="${c.id}" ${canPlant ? '' : 'disabled'}>${plantLabel}</button></div>`;
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
      const tabs = `<div class="farm-task-tabs">
        <button type="button" data-task-tab="newbie" class="${activeTaskTab === 'newbie' ? 'is-active' : ''}">📜 新手任务</button>
        <button type="button" data-task-tab="achievements" class="${activeTaskTab === 'achievements' ? 'is-active' : ''}">🏅 成就</button>
        <button type="button" data-task-tab="titles" class="${activeTaskTab === 'titles' ? 'is-active' : ''}">🏷️ 称号</button>
      </div>`;

      if (activeTaskTab === 'newbie') {
        body.innerHTML = `${tabs}<div class="farm-task-list">${TASKS.map(task => {
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

      if (activeTaskTab === 'achievements') {
        const groups = ACHIEVEMENT_GROUPS.map(group => `<button type="button" data-achievement-group="${group.id}" class="${activeAchievementGroup === group.id ? 'is-active' : ''}">${group.icon} ${group.label}</button>`).join('');
        const items = ACHIEVEMENTS.filter(item => item.group === activeAchievementGroup);
        body.innerHTML = `${tabs}<div class="farm-achievement-groups">${groups}</div><div class="farm-task-list">${items.map(item => {
          const progress = achievementProgress(item);
          const complete = isAchievementComplete(item);
          const claimed = isAchievementClaimed(item);
          const pct = Math.min(100, Math.round((progress / item.target) * 100));
          const action = claimed
            ? '<span class="farm-task-claimed">✓ 已领取</span>'
            : complete
              ? `<button type="button" data-claim-achievement="${item.id}">领取奖励</button>`
              : `<span class="farm-task-progress-text">${formatNumber(progress)} / ${formatNumber(item.target)}</span>`;
          return `<article class="farm-task-item farm-achievement-item ${complete ? 'is-complete' : ''} ${claimed ? 'is-claimed' : ''}">
            <div class="farm-task-copy"><b>${item.title}</b><p>${item.desc}</p><small>奖励：${item.rewardText}</small></div>
            <div class="farm-task-side">${action}</div>
            <div class="farm-task-bar"><i style="width:${pct}%"></i></div>
          </article>`;
        }).join('')}</div>`;
        return;
      }

      const equippedTitle = titleById(state.titles?.equipped || 'newbie');
      body.innerHTML = `${tabs}
        <section class="farm-title-current">
          <span>${equippedTitle.icon}</span><div><small>目前展示称号</small><b>【${escapeHtml(equippedTitle.name)}】</b><p>${escapeHtml(equippedTitle.desc)}</p></div>
        </section>
        <div class="farm-title-grid">${TITLES.map(title => {
          const unlocked = state.titles?.unlocked?.includes(title.id);
          const equipped = state.titles?.equipped === title.id;
          return `<article class="farm-title-card ${unlocked ? 'is-unlocked' : 'is-locked'} ${equipped ? 'is-equipped' : ''}">
            <span>${unlocked ? title.icon : '🔒'}</span>
            <div><b>【${escapeHtml(title.name)}】</b><p>${unlocked ? escapeHtml(title.desc) : '完成对应农场成就后解锁。'}</p></div>
            ${equipped ? '<em>使用中</em>' : unlocked ? `<button type="button" data-equip-title="${title.id}">装备</button>` : '<em>未解锁</em>'}
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
        const publicTitle = titleById(row.title_id || 'newbie');
        return `<article class="farm-ranking-row ${relation === 'self' ? 'is-self' : ''}">
          <div class="farm-rank-no">${medal}</div>
          <div class="farm-rank-player"><b>${escapeHtml(row.display_name)} <i>${genderSymbol(row.sex)}</i></b><small>Lv.${formatNumber(row.farm_level)} · <span class="farm-public-title">${publicTitle.icon}【${escapeHtml(publicTitle.name)}】</span></small></div>
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
        const publicTitle = titleById(row.title_id || 'newbie');
        const base = `<div class="farm-friend-avatar">${row.sex === 'male' ? '♂' : row.sex === 'female' ? '♀' : '🌱'}</div>
          <div class="farm-friend-copy"><b>${escapeHtml(row.display_name)}</b><small>Lv.${formatNumber(row.farm_level)} · ${coinInline(row.coins)} · <span class="farm-public-title">${publicTitle.icon}【${escapeHtml(publicTitle.name)}】</span></small></div>`;
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

      const shown = displayCropForPlot(plot, crop, progress);
      const time = btn.querySelector('.farm-crop-time');
      const visual = btn.querySelector('.farm-crop-visual');
      const name = btn.querySelector('.farm-crop-name');
      if (time) time.textContent = progress >= 1 ? '可以收成' : formatDuration(remaining);
      applyCropVisual(visual, shown, progress);
      if (name) name.textContent = shown.name;
      btn.setAttribute('aria-label', `${shown.name}，${progress >= 1 ? '已成熟，点击收成' : `${stage.label}，剩余 ${formatDuration(remaining)}`}`);
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
    // Friend steals / another device advance the server revision. Poll only the
    // tiny revision field once per minute; download the full farm JSON only if it changed.
    if (cloudReady && !cloudBusy && !document.hidden && Date.now() - cloudLastRevisionCheckAt >= CLOUD_REVISION_POLL_MS) {
      checkCloudRevision().catch(() => {});
    }
  }

  function handleClick(event) {
    const openTitles = event.target.closest('[data-open-titles]');
    if (openTitles) {
      activeTaskTab = 'titles';
      openPanel('tasks');
      return;
    }

    const taskTab = event.target.closest('[data-task-tab]');
    if (taskTab) {
      activeTaskTab = ['newbie','achievements','titles'].includes(taskTab.dataset.taskTab) ? taskTab.dataset.taskTab : 'newbie';
      renderActivePanel();
      return;
    }

    const achievementGroup = event.target.closest('[data-achievement-group]');
    if (achievementGroup) {
      activeAchievementGroup = ACHIEVEMENT_GROUPS.some(group => group.id === achievementGroup.dataset.achievementGroup) ? achievementGroup.dataset.achievementGroup : 'wealth';
      renderActivePanel();
      return;
    }

    const achievementClaim = event.target.closest('[data-claim-achievement]');
    if (achievementClaim) {
      claimAchievement(achievementClaim.dataset.claimAchievement);
      return;
    }

    const titleEquip = event.target.closest('[data-equip-title]');
    if (titleEquip) {
      equipTitle(titleEquip.dataset.equipTitle);
      return;
    }

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

    const stealPlot = event.target.closest('[data-steal-friend][data-steal-plot]');
    if (stealPlot) { stealFriendCrop(stealPlot.dataset.stealFriend, Number(stealPlot.dataset.stealPlot)); return; }

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
    try { console.info(`[Stellar Farm] build ${FARM_BUILD}`); } catch (_) {}
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
      if (!document.hidden && cloudReady && Date.now() - cloudLastRevisionCheckAt > CLOUD_VISIBILITY_CHECK_MS) {
        checkCloudRevision({force:true}).catch(() => {});
      }
    });
    window.addEventListener('pagehide', () => {
      if (cloudReady && hasUnsyncedLocalChanges(cloudUserId)) {
        // Best effort only; the persistent dirty flag is the real F5 safety net.
        pushCloudState(true).catch(() => {});
      }
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
