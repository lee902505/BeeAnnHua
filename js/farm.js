(() => {
  'use strict';

  const FARM_BUILD = '0.13.31';
  const STORAGE_KEY = 'xingchen-farm-v1';
  const VERSION = 1;
  const PLOT_COUNT = 20;
  const INITIAL_COINS = 100;
  const CLOUD_TABLE = 'farm_saves';
  const CLOUD_SYNC_DELAY = 700;
  const CLOUD_REVISION_POLL_MS = 60000;
  const CLOUD_VISIBILITY_CHECK_MS = 15000;
  const FARM_DAY_SYNC_MS = 30 * 60 * 1000;
  const FARM_ACTIVITY_UNREAD_POLL_MS = 60 * 1000;
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

  // V0.13.30 — care items use the same 4×4 atlas approach as crops.
  // Cell numbers are 1-based so they match the artwork brief.
  const ITEM_ATLAS = Object.freeze({cols:4, rows:4});
  const EVENT_ATLAS = Object.freeze({cols:4, rows:4});
  const BASE_PEST_CHANCE = 0.10;
  const DAILY_EVENTS = Object.freeze([
    Object.freeze({id:'sunny', icon:'☀️', name:'晴朗日', note:'今天阳光充足，所有普通作物成长时间缩短 5%。', growFactor:0.95, pestChance:0.10}),
    Object.freeze({id:'harvest', icon:'🌾', name:'丰收日', note:'今天收成普通作物时获得的 EXP 提升 10%。', expFactor:1.10, pestChance:0.10}),
    Object.freeze({id:'rainy', icon:'🌧️', name:'多雨日', note:'湿润天气让虫害更活跃，播种时长虫机率由 10% 提升到 20%。', pestChance:0.20}),
    Object.freeze({id:'storm', icon:'⛈️', name:'雷雨日', note:'雷雨会影响果实品质，今天收成每格普通作物少 1 个，最低仍保留 1 个。', yieldPenalty:1, pestChance:0.10}),
    Object.freeze({id:'merchant', icon:'🛒', name:'种子商人来访', note:'旅行商人今天停在农舍旁，随机两种已解锁种子 9 折。', merchant:true, pestChance:0.10})
  ]);
  const WATER_FACTOR = 0.92;
  const FERTILIZERS = Object.freeze([
    Object.freeze({id:'fertilizerLow', name:'低级肥料', price:12, factor:0.90, reduction:10, itemCell:5, statusCell:11, note:'缩短本轮作物约 10% 成长时间。'}),
    Object.freeze({id:'fertilizerMid', name:'中级肥料', price:28, factor:0.80, reduction:20, itemCell:6, statusCell:12, note:'缩短本轮作物约 20% 成长时间。'}),
    Object.freeze({id:'fertilizerHigh', name:'高级肥料', price:55, factor:0.70, reduction:30, itemCell:7, statusCell:13, note:'缩短本轮作物约 30% 成长时间。'})
  ]);

  // V0.13.30 — two ROWEB-style 4×4 crop atlases. Each crop points to a
  // sheet + row, while the growth percentage selects the column. The artwork
  // stays as two large transparent images; nothing is split into 32 files.
  const CROP_ATLAS = Object.freeze({
    cols:4, rows:4, anchorX:50, anchorY:82, shiftX:8, shiftY:-7,
    crops:Object.freeze({
      carrot:Object.freeze({sheet:1, row:0, scale:1.00, lift:18}),
      wheat:Object.freeze({sheet:1, row:1, scale:.96, lift:17}),
      corn:Object.freeze({sheet:1, row:2, scale:.90, lift:18}),
      tomato:Object.freeze({sheet:1, row:3, scale:.94, lift:18}),
      strawberry:Object.freeze({sheet:2, row:0, scale:.96, lift:17}),
      pumpkin:Object.freeze({sheet:2, row:1, scale:.88, lift:16}),
      grape:Object.freeze({sheet:2, row:2, scale:.90, lift:16}),
      starfruit:Object.freeze({sheet:2, row:3, scale:.88, lift:16})
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

  const DAILY_TASKS = [
    { id:'dailyPlant5', title:'今日播种', desc:'今天播种 5 格农地。', metric:'plant', target:5, reward:{coins:15}, rewardText:'金币 ×15' },
    { id:'dailyHarvest5', title:'今日丰收', desc:'今天收成 5 格成熟作物。', metric:'harvest', target:5, reward:{exp:20}, rewardText:'EXP +20' },
    { id:'dailySell10', title:'今日交易', desc:'今天出售 10 个农作物。', metric:'sell', target:10, reward:{coins:20}, rewardText:'金币 ×20' },
    { id:'dailyVisit2', title:'串门子', desc:'今天拜访 2 位不同的农场好友。', metric:'visit', target:2, reward:{exp:15}, rewardText:'EXP +15' },
    { id:'dailySteal1', title:'今天也偷一下', desc:'今天成功偷菜 1 次。', metric:'steal', target:1, reward:{coins:10}, rewardText:'金币 ×10' }
  ];
  const DAILY_BONUS = { id:'dailyBonus', title:'今日农场全勤', desc:'完成今天全部 5 项每日任务。', reward:{seeds:{mystery:1}, exp:30}, rewardText:'蔬果盲盒 ×1 · EXP +30' };


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
  let farmActivityRows = [];
  let farmActivityLoading = false;
  let farmActivityError = '';
  let farmActivityLoadedAt = 0;
  let farmActivityUnreadCount = 0;
  let farmActivityUnreadCheckedAt = 0;
  let farmDay = localFarmDay();
  let farmDaySyncAt = 0;
  let activeTaskTab = 'daily';
  let activeAchievementGroup = 'wealth';
  let activeFriendTab = 'activity';
  let levelUpQueue = [];
  let levelUpPlaying = false;
  // Persist the horizontal achievement-category position across rerenders.
  // On iOS, tapping a category rebuilds the task panel; without this value the
  // newly-created scroller starts at scrollLeft=0 and looks like it snaps back
  // to the first category even though the selected category changed correctly.
  let achievementGroupScrollLeft = 0;

  const $ = (id) => document.getElementById(id);
  const cropById = (id) => id === MYSTERY_CROP.id ? MYSTERY_CROP : CROPS.find(c => c.id === id);
  const fertilizerById = (id) => FERTILIZERS.find(item => item.id === id) || null;

  function itemSpritePosition(cell) {
    const index = Math.max(0, Math.min(15, Number(cell || 1) - 1));
    const col = index % ITEM_ATLAS.cols;
    const row = Math.floor(index / ITEM_ATLAS.cols);
    const xStep = 100 / (ITEM_ATLAS.cols - 1);
    const yStep = 100 / (ITEM_ATLAS.rows - 1);
    return {x:col * xStep, y:row * yStep};
  }

  function itemSpriteMarkup(cell, extraClass = '', label = '') {
    const pos = itemSpritePosition(cell);
    return `<span class="farm-item-sprite ${extraClass}" aria-hidden="true"${label ? ` title="${escapeHtml(label)}"` : ''} style="--item-x:${pos.x}%;--item-y:${pos.y}%"></span>`;
  }

  function eventSpritePosition(cell) {
    const index = Math.max(0, Math.min(15, Number(cell || 1) - 1));
    const col = index % EVENT_ATLAS.cols;
    const row = Math.floor(index / EVENT_ATLAS.cols);
    const xStep = 100 / (EVENT_ATLAS.cols - 1);
    const yStep = 100 / (EVENT_ATLAS.rows - 1);
    return {x:col*xStep, y:row*yStep};
  }

  function eventSpriteMarkup(cell, extraClass = '', label = '') {
    const pos = eventSpritePosition(cell);
    return `<span class="farm-event-sprite ${extraClass}" aria-hidden="true"${label ? ` title="${escapeHtml(label)}"` : ''} style="--event-x:${pos.x}%;--event-y:${pos.y}%"></span>`;
  }

  function stableHash(value='') {
    let h=2166136261;
    for (const ch of String(value)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function currentFarmEvent(day = farmDay || localFarmDay()) {
    return DAILY_EVENTS[stableHash(`stellar-event:${day}`) % DAILY_EVENTS.length];
  }

  function merchantDiscountCrops() {
    const unlocked = CROPS.filter(crop => state.level >= crop.unlockLevel);
    if (!unlocked.length) return [];
    const first = stableHash(`merchant-a:${farmDay}`) % unlocked.length;
    const second = unlocked.length > 1 ? (first + 1 + (stableHash(`merchant-b:${farmDay}`) % (unlocked.length - 1))) % unlocked.length : first;
    return [...new Set([unlocked[first]?.id, unlocked[second]?.id])].filter(Boolean);
  }

  function currentPestChance() { return Number(currentFarmEvent()?.pestChance ?? BASE_PEST_CHANCE); }

  function seedIconMarkup(crop) {
    return crop?.isMystery ? itemSpriteMarkup(3, 'is-seed-icon', '蔬果盲盒') : `<span class="farm-seed-emoji">${escapeHtml(crop?.icon || '🌱')}</span>`;
  }
  const seedItems = () => PLANTABLES;
  const titleById = (id) => TITLES.find(item => item.id === id) || TITLES[0];
  const achievementById = (id) => ACHIEVEMENTS.find(item => item.id === id) || null;
  const dailyTaskById = (id) => DAILY_TASKS.find(item => item.id === id) || null;

  function localFarmDay(date = new Date()) {
    try {
      const parts = new Intl.DateTimeFormat('en', {
        timeZone:'Asia/Taipei', year:'numeric', month:'2-digit', day:'2-digit'
      }).formatToParts(date);
      const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
      if (map.year && map.month && map.day) return `${map.year}-${map.month}-${map.day}`;
    } catch (_) {}
    const utc8 = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    return `${utc8.getUTCFullYear()}-${String(utc8.getUTCMonth()+1).padStart(2,'0')}-${String(utc8.getUTCDate()).padStart(2,'0')}`;
  }

  function createDailyState(day = localFarmDay()) {
    return {date:day, plant:0, harvest:0, sell:0, steal:0, visitedFriends:[], claimed:[], bonusClaimed:false};
  }

  function ensureDailyState(day = farmDay || localFarmDay(), {persist=false} = {}) {
    const normalizedDay = typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : localFarmDay();
    farmDay = normalizedDay;
    renderDailyEventScene?.();
    if (!state.daily || state.daily.date !== normalizedDay) {
      state.daily = createDailyState(normalizedDay);
      if (persist) saveState();
      else writeLocalState();
      return true;
    }
    return false;
  }

  function bumpDaily(metric, amount = 1, uniqueFriendId = '') {
    ensureDailyState(farmDay);
    if (metric === 'visit') {
      if (!uniqueFriendId) return false;
      const id = String(uniqueFriendId);
      if (state.daily.visitedFriends.includes(id)) return false;
      state.daily.visitedFriends.push(id);
      state.daily.visitedFriends = state.daily.visitedFriends.slice(-50);
      return true;
    }
    if (!['plant','harvest','sell','steal'].includes(metric)) return false;
    state.daily[metric] = Math.max(0, Number(state.daily[metric]) || 0) + Math.max(0, Number(amount) || 0);
    return true;
  }

  function dailyProgress(task) {
    ensureDailyState(farmDay);
    if (!task) return 0;
    if (task.metric === 'visit') return Math.min(task.target, state.daily.visitedFriends.length);
    return Math.min(task.target, Math.max(0, Number(state.daily[task.metric]) || 0));
  }

  function isDailyComplete(task) { return dailyProgress(task) >= task.target; }
  function isDailyClaimed(task) { return Boolean(state.daily?.claimed?.includes(task.id)); }
  function isDailyBonusReady() { return DAILY_TASKS.every(isDailyComplete); }

  function defaultPlots() {
    return Array.from({length:PLOT_COUNT}, (_, i) => ({ id:i, cropId:null, plantedAt:null, watered:false, fertilizerId:null, hasPest:false }));
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
      supplies: { fertilizerLow:0, fertilizerMid:0, fertilizerHigh:0 },
      stats: { visit:1, plant:0, harvest:0, sell:0, friend:0, blindBoxPlant:0, steals:0, maxCoins:INITIAL_COINS },
      claimedTasks: [],
      claimedAchievements: [],
      titles: { unlocked:['newbie'], equipped:'newbie' },
      daily: createDailyState(localFarmDay()),
      notices: { titles:[] },
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
        stolenCount:Number.isFinite(stolenCount) && stolenCount > 0 ? Math.floor(stolenCount) : 0,
        watered:Boolean(old?.watered),
        fertilizerId:FERTILIZERS.some(item => item.id === old?.fertilizerId) ? old.fertilizerId : null,
        hasPest:Boolean(old?.hasPest)
      };
    });
    merged.seeds = {...base.seeds, ...(raw?.seeds || {})};
    merged.produce = {...(raw?.produce || {})};
    merged.supplies = {...base.supplies, ...(raw?.supplies || {})};
    for (const fertilizer of FERTILIZERS) merged.supplies[fertilizer.id] = Math.max(0, Number(merged.supplies[fertilizer.id]) || 0);
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

    const dailyRaw = raw?.daily && typeof raw.daily === 'object' ? raw.daily : {};
    merged.daily = {
      date: typeof dailyRaw.date === 'string' ? dailyRaw.date : localFarmDay(),
      plant: Math.max(0, Number(dailyRaw.plant) || 0),
      harvest: Math.max(0, Number(dailyRaw.harvest) || 0),
      sell: Math.max(0, Number(dailyRaw.sell) || 0),
      steal: Math.max(0, Number(dailyRaw.steal) || 0),
      visitedFriends: Array.isArray(dailyRaw.visitedFriends) ? [...new Set(dailyRaw.visitedFriends.filter(Boolean).map(String))].slice(-50) : [],
      claimed: Array.isArray(dailyRaw.claimed) ? [...new Set(dailyRaw.claimed.filter(id => DAILY_TASKS.some(task => task.id === id)))] : [],
      bonusClaimed: Boolean(dailyRaw.bonusClaimed)
    };
    const noticeRaw = raw?.notices && typeof raw.notices === 'object' ? raw.notices : {};
    merged.notices = {
      titles: Array.isArray(noticeRaw.titles) ? [...new Set(noticeRaw.titles.filter(id => validTitleIds.has(id)))] : []
    };

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
    if (!state.notices || typeof state.notices !== 'object') state.notices = {titles:[]};
    if (!Array.isArray(state.notices.titles)) state.notices.titles = [];
    if (!state.notices.titles.includes(titleId)) state.notices.titles.push(titleId);
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

  function applyGenericReward(reward = {}, {silent=false} = {}) {
    if (reward.coins) state.coins += Number(reward.coins) || 0;
    if (reward.exp) addExp(Number(reward.exp) || 0, {silent});
    if (reward.seeds) {
      Object.entries(reward.seeds).forEach(([cropId, qty]) => {
        state.seeds[cropId] = (state.seeds[cropId] || 0) + Math.max(0, Number(qty) || 0);
      });
    }
    if (reward.title) unlockTitle(reward.title);
    updateHighWatermarks();
  }

  function applyDailyTaskReward(task, day = farmDay, {silent=false} = {}) {
    ensureDailyState(day);
    if (!task || state.daily.date !== day || state.daily.claimed.includes(task.id)) return false;
    if (!isDailyComplete(task)) return false;
    state.daily.claimed.push(task.id);
    applyGenericReward(task.reward || {}, {silent});
    return true;
  }

  function applyDailyBonusReward(day = farmDay, {silent=false} = {}) {
    ensureDailyState(day);
    if (state.daily.date !== day || state.daily.bonusClaimed || !isDailyBonusReady()) return false;
    state.daily.bonusClaimed = true;
    applyGenericReward(DAILY_BONUS.reward || {}, {silent});
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
    if (op.type === 'claim-daily') {
      if (targetState?.daily?.date && targetState.daily.date !== op.day) return true;
      return targetState?.daily?.date === op.day && Array.isArray(targetState.daily.claimed) && targetState.daily.claimed.includes(op.dailyTaskId);
    }
    if (op.type === 'claim-daily-bonus') {
      if (targetState?.daily?.date && targetState.daily.date !== op.day) return true;
      return targetState?.daily?.date === op.day && Boolean(targetState.daily.bonusClaimed);
    }
    if (op.type === 'equip-title') return targetState?.titles?.equipped === op.titleId;
    if (op.type === 'plant') return plantMutationApplied(targetState, op);
    if (op.type === 'water') {
      return Array.isArray(op.plots) && op.plots.every(item => {
        const plot = targetState?.plots?.[Number(item.index)];
        return plot && Number(plot.plantedAt) === Number(item.plantedAt) && Boolean(plot.watered);
      });
    }
    if (op.type === 'fertilize') {
      const plot = targetState?.plots?.[Number(op.plotIndex)];
      return Boolean(plot && Number(plot.plantedAt) === Number(op.plantedAt) && plot.fertilizerId === op.fertilizerId);
    }
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

      if (op.type === 'claim-daily') {
        const task = dailyTaskById(op.dailyTaskId);
        if (task && op.day === farmDay && applyDailyTaskReward(task, op.day, {silent:true})) changed = true;
        continue;
      }

      if (op.type === 'claim-daily-bonus') {
        if (op.day === farmDay && applyDailyBonusReward(op.day, {silent:true})) changed = true;
        continue;
      }

      if (op.type === 'equip-title') {
        if (state.titles?.unlocked?.includes(op.titleId) && state.titles.equipped !== op.titleId) {
          state.titles.equipped = op.titleId;
          changed = true;
        }
        continue;
      }

      if (op.type === 'water' && Array.isArray(op.plots)) {
        for (const item of op.plots) {
          const plot = state.plots[Number(item.index)];
          if (!plot || !plot.cropId || Number(plot.plantedAt) !== Number(item.plantedAt) || plot.watered) continue;
          plot.watered = true;
          changed = true;
        }
        continue;
      }

      if (op.type === 'fertilize') {
        const plot = state.plots[Number(op.plotIndex)];
        const fertilizer = fertilizerById(op.fertilizerId);
        if (plot && fertilizer && plot.cropId && Number(plot.plantedAt) === Number(op.plantedAt) && !plot.fertilizerId && (state.supplies[fertilizer.id] || 0) > 0) {
          state.supplies[fertilizer.id] -= 1;
          plot.fertilizerId = fertilizer.id;
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
          plot.watered = false;
          plot.fertilizerId = null;
          plot.hasPest = Boolean(item.hasPest);
          state.stats.plant += 1;
          bumpDaily('plant', 1);
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
      /get_farm_day_v1|get_farm_rankings_v2|get_farm_friends_v2|get_friend_farm_v4|get_friend_farm_v3|get_friend_farm_v2|help_friend_bug_v1|get_farm_activity_v1|get_farm_activity_unread_v1|farm_activity|steal_friend_crop_v4|steal_friend_crop_v3|steal_friend_crop_v2|get_farm_steal_activity_v1|get_farm_rankings|get_farm_friends|get_friend_farm|steal_friend_crop|request_farm_friend|farm_friendships|farm_steals|schema cache|does not exist|could not find/i.test(text);
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

  async function syncFarmDay(force = false) {
    const sb = cloudClient();
    const user = cloudAuthUser();
    const now = Date.now();
    if (!sb || !user?.id || (!force && farmDaySyncAt && now - farmDaySyncAt < FARM_DAY_SYNC_MS)) {
      const fallback = localFarmDay();
      if (fallback !== farmDay) {
        ensureDailyState(fallback, {persist:true});
        renderAll();
      }
      return farmDay;
    }
    try {
      const {data, error} = await sb.rpc('get_farm_day_v1');
      if (error) throw error;
      const day = typeof data === 'string' ? data : localFarmDay();
      farmDaySyncAt = Date.now();
      if (day !== farmDay || state.daily?.date !== day) {
        ensureDailyState(day, {persist:true});
        renderAll();
      } else {
        farmDay = day;
      }
      return farmDay;
    } catch (error) {
      const fallback = localFarmDay();
      if (fallback !== farmDay) {
        ensureDailyState(fallback, {persist:true});
        renderAll();
      }
      return farmDay;
    }
  }

  async function bootstrapCloud(preferRemote = false) {
    try {
      const authState = await window.XingchenAuth?.init?.();
      const user = window.XingchenAuth?.getUser?.() || (authState?.userId ? {id:authState.userId} : null);
      if (!user?.id) {
        setCloudStatus('local', '☁ 本机存档');
        ensureDailyState(localFarmDay(), {persist:false});
        return;
      }
      const result = await pullCloudState({preferRemote});
      await syncFarmDay(true);
      return result;
    } catch (_) {
      setCloudStatus('local', '☁ 本机存档');
      ensureDailyState(localFarmDay(), {persist:false});
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
      renderFriendDot();
    } catch (error) {
      friendRows = [];
      renderFriendDot();
      friendsError = multiplayerMissing(error)
        ? '好友系统尚未启用：请先在 Supabase SQL Editor 执行 20260924_010_farm_achievements_titles.sql。'
        : '好友资料暂时读取失败，请稍后再试。';
    } finally {
      friendsLoading = false;
      renderActivePanel();
    }
  }

  async function loadFarmActivity(force = false, markSeen = false) {
    if (farmActivityLoading) return;
    if (!force && farmActivityLoadedAt && Date.now() - farmActivityLoadedAt < 10000) return;
    const sb = cloudClient();
    const user = cloudAuthUser();
    if (!sb || !user?.id) {
      farmActivityError = '请先建立云端身份后再查看农场动态。';
      renderActivePanel();
      return;
    }
    farmActivityLoading = true;
    farmActivityError = '';
    renderActivePanel();
    try {
      await prepareMultiplayerIdentity();
      const {data, error} = await sb.rpc('get_farm_activity_v1', {p_limit:50, p_mark_seen:Boolean(markSeen)});
      if (error) throw error;
      farmActivityRows = Array.isArray(data) ? data : [];
      const returnedUnread = farmActivityRows.filter(row => row.is_unread).length;
      farmActivityUnreadCount = markSeen ? 0 : returnedUnread;
      farmActivityLoadedAt = Date.now();
      farmActivityUnreadCheckedAt = Date.now();
      renderFriendDot();
    } catch (error) {
      farmActivityRows = [];
      farmActivityUnreadCount = 0;
      renderFriendDot();
      farmActivityError = multiplayerMissing(error)
        ? '农场动态尚未启用：请先执行 20260926_014_farm_activity_center.sql。'
        : '农场动态暂时读取失败，请稍后再试。';
    } finally {
      farmActivityLoading = false;
      renderActivePanel();
    }
  }

  async function refreshFarmActivityUnread(force = false) {
    const now = Date.now();
    if (!force && farmActivityUnreadCheckedAt && now - farmActivityUnreadCheckedAt < FARM_ACTIVITY_UNREAD_POLL_MS) return;
    const sb = cloudClient();
    const user = cloudAuthUser();
    if (!sb || !user?.id) return;
    try {
      const {data, error} = await sb.rpc('get_farm_activity_unread_v1');
      if (error) throw error;
      farmActivityUnreadCount = Math.max(0, Number(data) || 0);
      farmActivityUnreadCheckedAt = Date.now();
      renderFriendDot();
      if (activePanel === 'friends') renderActivePanel();
    } catch (error) {
      if (!multiplayerMissing(error)) console.warn('[Farm activity unread]', error);
    }
  }

  function invalidateMultiplayer() {
    rankingLoadedAt = 0;
    friendsLoadedAt = 0;
    farmActivityLoadedAt = 0;
    farmActivityUnreadCheckedAt = 0;
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
        stolenByMe:Boolean(raw?.stolenByMe),
        watered:Boolean(raw?.watered),
        fertilizerId:FERTILIZERS.some(item => item.id === raw?.fertilizerId) ? raw.fertilizerId : null,
        hasPest:Boolean(raw?.hasPest)
      };
    });
    let matureCount = 0;
    let stealableCount = 0;
    let pestCount = 0;
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
          const remainingMs = remainingFor(plot, crop);
          const shown = displayCropForPlot(plot, crop, progress);
          if (plot.hasPest) pestCount += 1;
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
              stealTag = '<span class="farm-steal-tag">偷菜 ×1</span>'; 
            }
          }

          const helpBug = plot.hasPest ? `<span role="button" tabindex="0" class="farm-help-bug" data-help-bug-friend="${escapeHtml(friendId)}" data-help-bug-plot="${index}" aria-label="帮好友除虫">${eventSpriteMarkup(6,'is-help-net')}<span>帮忙除虫</span></span>` : '';
          content = `<span class="farm-soil"><small class="farm-crop-time">${progress >= 1 ? '已成熟' : formatDuration(remainingMs)}</small>${cropVisualMarkup(shown, progress)}<span class="farm-crop-name">${shown.name}</span>${plot.hasPest ? eventSpriteMarkup(5,'farm-pest-mark','虫害') : ''}${careStatusMarkup(plot)}${stealTag}${helpBug}</span>`;
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
        <em>成熟 ${matureCount} 格 · 可偷 ${stealableCount} 格 · 虫害 ${pestCount} 格</em>
      </section>
      <div class="farm-steal-rule">🥷 成熟作物每位好友每轮可偷 1 个；发现 🐛 虫害时，也可以帮好友免费除虫并有机会获得小奖励。</div>
      <div class="farm-visit-scene">
        <div class="farm-visit-field">${tiles.join('')}</div>
      </div>
      <div class="farm-visit-actions"><button type="button" class="farm-friend-action" data-open-panel="friends">← 返回好友列表</button></div>`;
  }

  async function visitFriend(friendId, {logVisit=true} = {}) {
    const sb = cloudClient();
    const user = cloudAuthUser();
    if (!sb || !user?.id || !friendId) return;

    openModal({
      icon:'🏡', eyebrow:'FARM VISIT', title:'正在前往好友农场',
      subtitle:'正在读取好友最新的云端农场状态。',
      body:'<div class="farm-network-state"><span class="farm-spinner"></span><b>沿着小路走过去…</b></div>'
    });

    try {
      const {data, error} = await sb.rpc('get_friend_farm_v4', {p_friend:friendId, p_log_visit:Boolean(logVisit)});
      if (error) throw error;
      const payload = data && typeof data === 'object' ? data : {};
      if (!payload.ok) {
        const message = payload.reason === 'not_friend' ? '只有已经互相确认的好友才能拜访农场。'
          : payload.reason === 'no_farm' ? '这位好友还没有建立云端农场。'
          : '暂时无法进入这座农场。';
        openModal({icon:'🏡', eyebrow:'FARM VISIT', title:'暂时无法拜访', subtitle:message, body:'<div class="farm-visit-actions"><button type="button" class="farm-friend-action" data-open-panel="friends">返回好友列表</button></div>'});
        return;
      }
      if (bumpDaily('visit', 1, friendId)) {
        saveState();
        renderTaskDot();
      }
      openModal({
        icon:'🏡', eyebrow:'FARM VISIT',
        title:`${payload.display_name || '好友'}的农场`,
        subtitle:'看看好友最近种了什么；成熟作物可以偷菜，长虫的作物也能帮忙处理。',
        body:renderFriendFarmVisit(payload)
      });
    } catch (error) {
      const detail = multiplayerMissing(error)
        ? '请先执行 20260926_015_farm_weather_merchant_pests.sql。'
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
      const {data, error} = await sb.rpc('steal_friend_crop_v4', {p_friend:friendId, p_plot:Number(plotId)});
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
        await visitFriend(friendId, {logVisit:false});
        return;
      }

      const crop = CROPS.find(c => c.id === payload.crop_id) || CROPS[0];
      if (typeof payload.farm_day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(payload.farm_day)) farmDay = payload.farm_day;
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
      toast(`🥷 偷到 ${crop.icon}${crop.name} ×1`, `好友这格至少还保留 ${Number(payload.owner_remaining) || 1} 个。`, 'harvest');
      await new Promise(resolve => setTimeout(resolve, 260));
      await visitFriend(friendId, {logVisit:false});
    } catch (error) {
      toast('🥷 偷菜失败', multiplayerMissing(error) ? '请先执行 20260926_012_farm_daily_tasks.sql。' : '网络暂时不稳定，请稍后再试。');
      if (tile) {
        tile.disabled = false;
        tile.classList.remove('is-stealing');
      }
    }
  }

  async function helpFriendBug(friendId, plotId) {
    const sb = cloudClient();
    const user = cloudAuthUser();
    if (!sb || !user?.id || !friendId) return;
    const btn = document.querySelector(`[data-help-bug-friend="${CSS.escape(friendId)}"][data-help-bug-plot="${Number(plotId)}"]`);
    if (btn) btn.disabled = true;
    try {
      const {data,error} = await sb.rpc('help_friend_bug_v1',{p_friend:friendId,p_plot:Number(plotId)});
      if (error) throw error;
      const payload = data && typeof data==='object' ? data : {};
      if (!payload.ok) {
        const msg = payload.reason === 'no_pest' ? ['🌿 已经很健康','这格作物现在没有虫害。'] : payload.reason === 'not_friend' ? ['👥 无法帮忙','只有好友才能帮忙除虫。'] : ['🐛 除虫没有成功','请刷新好友农场后再试。'];
        toast(msg[0],msg[1]);
        await visitFriend(friendId,{logVisit:false});
        return;
      }
      if (payload.helper_state && typeof payload.helper_state==='object') {
        state = normalizeState(payload.helper_state); state.ownerUserId=user.id; writeLocalState(); renderAll(); await pullCloudState({preferRemote:true});
      }
      const reward = payload.reward_type === 'coins' ? `金币 +${payload.reward_amount}` : payload.reward_type === 'exp' ? `EXP +${payload.reward_amount}` : payload.reward_type === 'mystery' ? '蔬果盲盒 ×1' : '这次没有额外奖励';
      toast('🪲 帮好友除虫成功', reward, 'care');
      await visitFriend(friendId,{logVisit:false});
    } catch (error) {
      toast('🐛 帮忙除虫失败', multiplayerMissing(error) ? '请先执行 V0.13.30 的 015 SQL。' : '网络暂时不稳定，请稍后再试。');
      if (btn) btn.disabled=false;
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

  function queueLevelUpCelebrations(items = []) {
    if (!Array.isArray(items) || !items.length) return;
    levelUpQueue.push(...items);
  }

  function animateUnlockedPlots(indices = []) {
    if (!indices.length) return;
    requestAnimationFrame(() => {
      indices.forEach((index, order) => {
        const plot = document.querySelector(`.farm-plot[data-plot="${index}"]`);
        if (!plot) return;
        setTimeout(() => {
          plot.classList.remove('is-land-unlocking');
          void plot.offsetWidth;
          plot.classList.add('is-land-unlocking');
          setTimeout(() => plot.classList.remove('is-land-unlocking'), 1500);
        }, order * 160);
      });
    });
  }

  function playNextLevelUpCelebration() {
    if (levelUpPlaying || !levelUpQueue.length) return;
    levelUpPlaying = true;
    const item = levelUpQueue.shift();
    const old = document.getElementById('farmLevelUpOverlay');
    if (old) old.remove();
    const overlay = document.createElement('div');
    overlay.id = 'farmLevelUpOverlay';
    overlay.className = 'farm-level-up-overlay';
    const landText = item.newPlots?.length ? `<span>🌱 新农地 ×${item.newPlots.length}</span>` : '';
    const cropText = item.crops?.length ? `<span>🌾 解锁 ${item.crops.map(c => escapeHtml(c.name)).join('、')}</span>` : '';
    overlay.innerHTML = `<div class="farm-level-up-card"><small>STELLAR FARM</small><b>LEVEL UP!</b><strong>Lv.${item.from} <i>→</i> Lv.${item.to}</strong><div>${landText}${cropText || '<span>✨ 农场能力提升</span>'}</div></div><i class="farm-level-star s1">✦</i><i class="farm-level-star s2">✦</i><i class="farm-level-star s3">✧</i><i class="farm-level-leaf l1">🍃</i><i class="farm-level-leaf l2">🍃</i>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
    pulseExp();
    setTimeout(() => animateUnlockedPlots(item.newPlots || []), 620);
    setTimeout(() => overlay.classList.add('is-leaving'), 1850);
    setTimeout(() => {
      overlay.remove();
      levelUpPlaying = false;
      playNextLevelUpCelebration();
    }, 2300);
  }

  function addExp(amount, {silent=false} = {}) {
    if (!amount) return;
    state.exp += amount;
    const celebrations = [];

    while (state.exp >= currentExpNeed()) {
      const from = state.level;
      const beforeLand = unlockedLandCount(from);
      state.exp -= currentExpNeed();
      state.level += 1;
      const afterLand = unlockedLandCount(state.level);
      const newPlots = Array.from({length:Math.max(0, afterLand - beforeLand)}, (_, offset) => beforeLand + offset);
      const crops = CROPS.filter(c => c.unlockLevel === state.level);
      celebrations.push({from, to:state.level, newPlots, crops});
    }

    if (celebrations.length && !silent) {
      queueLevelUpCelebrations(celebrations);
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

  function growFactorForPlot(plot, crop = null) {
    if (crop?.isMystery) return 1;
    let factor = plot?.watered ? WATER_FACTOR : 1;
    const fertilizer = fertilizerById(plot?.fertilizerId);
    if (fertilizer) factor *= fertilizer.factor;
    const event = currentFarmEvent();
    if (event?.growFactor) factor *= event.growFactor;
    return Math.max(0.45, Math.min(1, factor));
  }

  function growDurationMs(plot, crop) {
    if (!crop) return 0;
    return Math.round(crop.growMinutes * 60 * 1000 * growFactorForPlot(plot, crop));
  }

  function progressFor(plot, crop) {
    if (!plot?.plantedAt || !crop) return 0;
    const total = growDurationMs(plot, crop);
    return total > 0 ? Math.min(1, Math.max(0, (Date.now() - plot.plantedAt) / total)) : 0;
  }

  function remainingFor(plot, crop) {
    return Math.max(0, growDurationMs(plot, crop) - (Date.now() - Number(plot?.plantedAt || 0)));
  }

  function careStatusMarkup(plot) {
    // V0.13.30 — field stays visually clean after watering/fertilizing.
    // Status is still shown in the crop detail panel, so gameplay data remains intact.
    return '';
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
      sheet:meta.sheet || 1, row:meta.row, col,
      x:col * xStep, y:meta.row * yStep,
      scale:meta.scale, lift:meta.lift,
      shiftX:CROP_ATLAS.shiftX, shiftY:CROP_ATLAS.shiftY,
      anchorX:CROP_ATLAS.anchorX, anchorY:CROP_ATLAS.anchorY
    };
  }

  function cropVisualMarkup(shown, progress) {
    if (shown?.id === 'mystery') return itemSpriteMarkup(3, 'farm-crop-visual farm-mystery-visual', '蔬果盲盒');
    const sprite = cropSpritePosition(shown?.id, progress);
    if (sprite) {
      return `<span class="farm-crop-visual is-sprite" aria-hidden="true" data-crop-sprite="${escapeHtml(shown.id)}" data-crop-sheet="${sprite.sheet}" style="--crop-x:${sprite.x}%;--crop-y:${sprite.y}%;--crop-scale:${sprite.scale};--crop-lift:${sprite.lift}px;--crop-shift-x:${sprite.shiftX}px;--crop-shift-y:${sprite.shiftY}px;--crop-anchor-x:${sprite.anchorX}%;--crop-anchor-y:${sprite.anchorY}%"></span>`;
    }
    return `<span class="farm-crop-visual" aria-hidden="true">${escapeHtml(shown?.icon || '🌱')}</span>`;
  }

  function applyCropVisual(el, shown, progress) {
    if (!el) return;
    if (shown?.id === 'mystery') {
      const pos = itemSpritePosition(3);
      el.className = 'farm-item-sprite farm-crop-visual farm-mystery-visual';
      el.textContent = '';
      el.style.setProperty('--item-x', `${pos.x}%`);
      el.style.setProperty('--item-y', `${pos.y}%`);
      return;
    }
    el.classList.remove('farm-item-sprite','farm-mystery-visual');
    el.style.removeProperty('--item-x');
    el.style.removeProperty('--item-y');
    const sprite = cropSpritePosition(shown?.id, progress);
    if (sprite) {
      el.classList.add('is-sprite');
      el.dataset.cropSprite = shown.id;
      el.dataset.cropSheet = String(sprite.sheet);
      el.textContent = '';
      el.style.setProperty('--crop-x', `${sprite.x}%`);
      el.style.setProperty('--crop-y', `${sprite.y}%`);
      el.style.setProperty('--crop-scale', String(sprite.scale));
      el.style.setProperty('--crop-lift', `${sprite.lift}px`);
      el.style.setProperty('--crop-shift-x', `${sprite.shiftX}px`);
      el.style.setProperty('--crop-shift-y', `${sprite.shiftY}px`);
      el.style.setProperty('--crop-anchor-x', `${sprite.anchorX}%`);
      el.style.setProperty('--crop-anchor-y', `${sprite.anchorY}%`);
      return;
    }
    el.classList.remove('is-sprite');
    delete el.dataset.cropSprite;
    delete el.dataset.cropSheet;
    el.style.removeProperty('--crop-x');
    el.style.removeProperty('--crop-y');
    el.style.removeProperty('--crop-scale');
    el.style.removeProperty('--crop-lift');
    el.style.removeProperty('--crop-shift-x');
    el.style.removeProperty('--crop-shift-y');
    el.style.removeProperty('--crop-anchor-x');
    el.style.removeProperty('--crop-anchor-y');
    el.textContent = shown?.icon || '🌱';
  }

  function renderDailyEventScene() {
    const event = currentFarmEvent();
    const badge = $('farmDailyEvent');
    if (badge) {
      badge.className = `farm-daily-event is-${event.id}`;
      badge.innerHTML = `<b>${event.icon} ${escapeHtml(event.name)}</b><small>${escapeHtml(event.note)}</small>`;
    }
    const merchant = $('farmMerchantNpc');
    if (merchant) {
      merchant.hidden = !event.merchant;
      merchant.setAttribute('aria-label', event.merchant ? '种子商人来访，点击查看今日折扣' : '');
    }
    const scene = document.querySelector('.farm-scene');
    if (scene) {
      scene.classList.toggle('is-sunny', event.id === 'sunny');
      scene.classList.toggle('is-harvest', event.id === 'harvest');
      scene.classList.toggle('is-rainy', event.id === 'rainy');
      scene.classList.toggle('is-storm', event.id === 'storm');
      scene.dataset.weather = ['sunny','harvest','rainy','storm'].includes(event.id) ? event.id : 'none';
    }
  }

  function openMerchantShop() {
    const event = currentFarmEvent();
    if (!event.merchant) { toast('🛒 商人今天不在', '种子商人只会在来访日停在农舍旁。'); return; }
    const discountIds = merchantDiscountCrops();
    const cards = discountIds.map(id => {
      const crop = cropById(id);
      const price = Math.max(1, Math.floor(crop.seedPrice * .9));
      return `<article class="farm-merchant-card"><span class="farm-seed-emoji">${escapeHtml(crop.icon)}</span><div><b>${escapeHtml(crop.name)}种子</b><small>原价 ${crop.seedPrice} · 今日 9 折</small></div><strong>${price} 金币/包</strong><button type="button" data-merchant-buy="${escapeHtml(crop.id)}" data-qty="1">买 1</button><button type="button" data-merchant-buy="${escapeHtml(crop.id)}" data-qty="5">买 5</button></article>`;
    }).join('');
    openModal({icon:'🛒', eyebrow:'TRAVELING MERCHANT', title:'种子商人来访', subtitle:'今天随机两种已解锁种子 9 折，午夜后商人会继续旅行。', body:`<div class="farm-merchant-intro">${eventSpriteMarkup(3,'is-merchant-face')}<p>“今天路过星辰农场，带了两种便宜种子。要不要补一点库存？”</p></div><div class="farm-merchant-grid">${cards || '<p class="farm-empty-state">目前还没有可购买的折扣种子。</p>'}</div>`});
  }

  function buyMerchantSeed(cropId, qty=1) {
    if (!currentFarmEvent().merchant || !merchantDiscountCrops().includes(cropId)) return;
    const crop = cropById(cropId);
    qty = Math.max(1, Number(qty)||1);
    const unit = Math.max(1, Math.floor(crop.seedPrice*.9));
    const cost = unit*qty;
    if (state.coins < cost) { toast('🪙 金币不够', `购买 ${crop.name}种子 ×${qty} 需要 ${cost} 金币。`); return; }
    state.coins -= cost;
    state.seeds[cropId] = (state.seeds[cropId]||0)+qty;
    saveState(); renderAll(); openMerchantShop();
    toast('🛒 商人交易完成', `${crop.name}种子 ×${qty} · 花费 ${cost} 金币。`);
  }

  function renderAll() {
    renderOwner();
    renderStats();
    renderField();
    updateHarvestAllButton();
    updateWaterAllButton();
    updateDebugAllButton();
    renderDailyEventScene();
    renderTaskDot();
    renderFriendDot();
    if (activePanel) renderActivePanel();
    if (levelUpQueue.length && !levelUpPlaying) requestAnimationFrame(playNextLevelUpCelebration);
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
          const remaining = remainingFor(plot, crop);
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
              ${plot.hasPest ? `${eventSpriteMarkup(5, 'farm-pest-mark', '虫害')}` : ''}
              ${careStatusMarkup(plot)}
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
          <span class="farm-seed-icon">${seedIconMarkup(crop)}</span>
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
        harvestYield:crop.isMystery ? 1 : randomInt(crop.yieldMin, crop.yieldMax),
        hasPest:!crop.isMystery && Math.random() < currentPestChance()
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
      plot.watered = false;
      plot.fertilizerId = null;
      plot.hasPest = Boolean(item.hasPest);
      state.stats.plant += 1;
      bumpDaily('plant', 1);
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
    const totalMs = growDurationMs(plot, crop);
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
        ${crop.isMystery ? `<div class="farm-care-panel is-locked-care"><div class="farm-care-panel-head"><b>🎁 盲盒固定成长</b><span>固定 4 小时</span></div><p class="farm-soft-note">蔬果盲盒不受浇水与肥料加速影响，保持固定 4 小时后揭晓。</p></div>` : `<div class="farm-care-panel">
          <div class="farm-care-panel-head"><b>🌿 农田照料</b><span>每轮作物可浇水 1 次、使用 1 包肥料</span></div>
          <div class="farm-care-current">
            <span>${plot.watered ? `${itemSpriteMarkup(10, 'is-inline-item')} 已浇水 · 时间 ×92%` : `${itemSpriteMarkup(9, 'is-inline-item')} 尚未浇水`}</span>
            <span>${plot.fertilizerId ? `${itemSpriteMarkup(fertilizerById(plot.fertilizerId)?.statusCell || 11, 'is-inline-item')} ${escapeHtml(fertilizerById(plot.fertilizerId)?.name || '已施肥')}` : '🌱 尚未施肥'}</span>
          </div>
          ${plot.hasPest ? `<div class="farm-pest-alert">${eventSpriteMarkup(5, 'is-inline-event')}<span><b>发现虫害</b><small>成熟前不处理会让这格收成少 1 个。</small></span><button type="button" data-debug-plot="${index}">${eventSpriteMarkup(6, 'is-inline-event')} 除虫</button></div>` : ''}
          <div class="farm-care-actions">
            <button type="button" data-water-plot="${index}" ${plot.watered ? 'disabled' : ''}>${itemSpriteMarkup(2, 'is-action-item')}<span><b>${plot.watered ? '已浇水' : '浇水一次'}</b><small>本轮成长时间再 ×92%</small></span></button>
            ${FERTILIZERS.map(item => `<button type="button" data-fertilize-plot="${index}" data-fertilizer="${item.id}" ${(plot.fertilizerId || (state.supplies[item.id] || 0) <= 0) ? 'disabled' : ''}>${itemSpriteMarkup(item.itemCell, 'is-action-item')}<span><b>${escapeHtml(item.name)} ×${state.supplies[item.id] || 0}</b><small>成长时间 -${item.reduction}%</small></span></button>`).join('')}
          </div>
        </div>
        <p class="farm-soft-note">浇水与肥料可以叠加，但同一轮作物只能各使用一次；离开页面后计时仍会继续。</p>`}`
    });
  }

  function waterablePlotIndices() {
    const unlocked = unlockedLandCount();
    return state.plots.filter(plot => {
      if (!plot?.cropId || plot.id >= unlocked || plot.watered) return false;
      const crop = cropById(plot.cropId);
      return crop && !crop.isMystery && progressFor(plot, crop) < 1;
    }).map(plot => plot.id);
  }

  function updateWaterAllButton() {
    const button = $('farmWaterAll');
    const count = $('farmWaterReadyCount');
    if (!button || !count) return;
    const ready = waterablePlotIndices().length;
    count.textContent = ready;
    button.disabled = ready <= 0;
    button.classList.toggle('is-ready', ready > 0);
    button.setAttribute('aria-label', ready > 0 ? `一键浇水 ${ready} 格作物` : '目前没有需要浇水的作物');
  }

  function playCareEffect(index, cell, kind = 'water') {
    const soil = document.querySelector(`.farm-plot[data-plot="${index}"] .farm-soil`);
    if (!soil) return;
    const burst = document.createElement('span');
    const pos = itemSpritePosition(cell);
    burst.className = `farm-care-burst is-${kind}`;
    burst.style.setProperty('--item-x', `${pos.x}%`);
    burst.style.setProperty('--item-y', `${pos.y}%`);
    soil.appendChild(burst);
    setTimeout(() => burst.remove(), 900);
  }

  async function waterPlots(indices, {single=false} = {}) {
    const allowed = new Set(waterablePlotIndices());
    const eligible = [...new Set(indices.map(Number))].filter(index => allowed.has(index));
    if (!eligible.length) {
      toast('💧 暂时不用浇水', '已经浇过、已经成熟或空着的农地不会重复浇水。');
      return;
    }
    const op = queuePendingOp({type:'water', plots:eligible.map(index => ({index, plantedAt:state.plots[index].plantedAt}))});
    if (single) closeModal();
    let watered = 0;
    for (const item of op.plots) {
      const plot = state.plots[Number(item.index)];
      if (!plot?.cropId || plot.watered || Number(plot.plantedAt) !== Number(item.plantedAt)) continue;
      plot.watered = true;
      watered += 1;
      saveState();
      renderField();
      updateWaterAllButton();
      playCareEffect(plot.id, 10, 'water');
      if (!single) await new Promise(resolve => setTimeout(resolve, 70));
    }
    if (cloudReady) await pushCloudState(true);
    renderAll();
    toast('💧 浇水完成', `${watered} 格作物本轮成长时间缩短约 8%。`, 'care');
  }

  async function waterAll() {
    await waterPlots(waterablePlotIndices());
  }

  function infestedPlotIndices() {
    const unlocked = unlockedLandCount();
    return state.plots.filter(plot => plot?.cropId && plot.id < unlocked && plot.hasPest).map(plot => plot.id);
  }

  function updateDebugAllButton() {
    const button = $('farmDebugAll');
    const count = $('farmPestReadyCount');
    if (!button || !count) return;
    const ready = infestedPlotIndices().length;
    count.textContent = ready;
    button.disabled = ready <= 0;
    button.classList.toggle('is-ready', ready > 0);
    button.setAttribute('aria-label', ready > 0 ? `一键除虫 ${ready} 格作物` : '目前没有虫害');
  }

  function playPestEffect(index) {
    const soil = document.querySelector(`.farm-plot[data-plot="${index}"] .farm-soil`);
    if (!soil) return;
    const burst = document.createElement('span');
    const pos = eventSpritePosition(6);
    burst.className = 'farm-event-burst is-debug';
    burst.style.setProperty('--event-x', `${pos.x}%`);
    burst.style.setProperty('--event-y', `${pos.y}%`);
    soil.appendChild(burst);
    setTimeout(() => burst.remove(), 850);
  }

  async function debugPlots(indices, {single=false} = {}) {
    const allowed = new Set(infestedPlotIndices());
    const eligible = [...new Set(indices.map(Number))].filter(index => allowed.has(index));
    if (!eligible.length) { toast('🐛 暂时没有虫害', '目前农田很健康，不需要除虫。'); return; }
    if (single) closeModal();
    for (const index of eligible) {
      const plot = state.plots[index];
      if (!plot?.hasPest) continue;
      plot.hasPest = false;
      playPestEffect(index);
      saveState();
      renderField();
      if (!single) await new Promise(resolve => setTimeout(resolve, 80));
    }
    if (cloudReady) await pushCloudState(true);
    renderAll();
    toast('🪲 除虫完成', `${eligible.length} 格作物恢复健康。`, 'care');
  }

  async function debugAll() { await debugPlots(infestedPlotIndices()); }

  async function applyFertilizer(index, fertilizerId) {
    const plot = state.plots[Number(index)];
    const fertilizer = fertilizerById(fertilizerId);
    const crop = cropById(plot?.cropId);
    if (!plot || !crop || crop.isMystery || !fertilizer || progressFor(plot, crop) >= 1) return;
    if (plot.fertilizerId) {
      toast('🌿 这株已经施过肥', '同一轮作物最多使用一包肥料。');
      return;
    }
    if ((state.supplies[fertilizer.id] || 0) <= 0) {
      toast('🌿 肥料不足', `先到商店购买${fertilizer.name}。`);
      return;
    }
    queuePendingOp({type:'fertilize', plotIndex:Number(index), plantedAt:plot.plantedAt, fertilizerId:fertilizer.id});
    state.supplies[fertilizer.id] -= 1;
    plot.fertilizerId = fertilizer.id;
    state.history.push({type:'fertilize', fertilizerId:fertilizer.id, plotId:Number(index), at:Date.now()});
    saveState();
    closeModal();
    renderAll();
    playCareEffect(Number(index), 8, 'fertilizer');
    if (cloudReady) await pushCloudState(true);
    toast('🌿 施肥完成', `${fertilizer.name}让这株作物本轮成长时间缩短 ${fertilizer.reduction}%。`, 'care');
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
      totalExp += Math.max(1, Math.round(crop.exp * (Number(currentFarmEvent()?.expFactor) || 1)));
      state.stats.harvest += 1;
      bumpDaily('harvest', 1);
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
    bumpDaily('harvest', 1);
    state.history.push({type:'harvest', cropId:result.crop.id, sourceCropId:crop.id, amount:result.amount, at:Date.now()});
    clearPlot(plot);
    const earnedExp = Math.max(1, Math.round(crop.exp * (Number(currentFarmEvent()?.expFactor) || 1)));
    addExp(earnedExp);
    saveState();
    renderAll();
    const reveal = crop.isMystery ? ` · 盲盒开出 ${result.crop.name}` : '';
    toast(`${result.crop.icon} 收成 ${result.crop.name} ×${result.amount}`, `农场经验 +${earnedExp} EXP${reveal}`, 'harvest');
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
    const eventPenalty = Math.max(0, Number(currentFarmEvent()?.yieldPenalty) || 0);
    const pestPenalty = plot.hasPest ? 1 : 0;
    return {crop, amount:Math.max(1, total - stolen - eventPenalty - pestPenalty), pestPenalty, eventPenalty};
  }

  function clearPlot(plot) {
    plot.cropId = null;
    plot.plantedAt = null;
    plot.resultCropId = null;
    plot.harvestYield = null;
    plot.stolenCount = 0;
    plot.watered = false;
    plot.fertilizerId = null;
    plot.hasPest = false;
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

  function buySupply(itemId, qty = 1) {
    const item = fertilizerById(itemId);
    qty = Math.max(1, Number(qty) || 1);
    if (!item) return;
    const cost = item.price * qty;
    if (state.coins < cost) {
      toast('🪙 金币不够', `购买 ${item.name} ×${qty} 需要 ${cost} 金币。`);
      return;
    }
    state.coins -= cost;
    state.supplies[item.id] = (state.supplies[item.id] || 0) + qty;
    saveState();
    renderAll();
    toast('🌿 农资已购买', `${item.name} ×${qty} · 花费 ${cost} 金币。`);
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
    bumpDaily('sell', qty);
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

  async function claimDailyTask(id) {
    await syncFarmDay(true);
    const task = dailyTaskById(id);
    if (!task || !isDailyComplete(task) || isDailyClaimed(task)) return;
    queuePendingOp({type:'claim-daily', dailyTaskId:id, day:farmDay});
    applyDailyTaskReward(task, farmDay);
    saveState();
    if (cloudReady) await pushCloudState(true);
    renderAll();
    toast('☀️ 每日任务奖励已领取', `${task.title} · ${task.rewardText}`, 'task');
  }

  async function claimDailyBonus() {
    await syncFarmDay(true);
    if (!isDailyBonusReady() || state.daily.bonusClaimed) return;
    queuePendingOp({type:'claim-daily-bonus', day:farmDay});
    applyDailyBonusReward(farmDay);
    saveState();
    if (cloudReady) await pushCloudState(true);
    renderAll();
    toast('🎁 今日农场全勤！', DAILY_BONUS.rewardText, 'task');
  }

  function taskNoticeCounts() {
    ensureDailyState(farmDay);
    const daily = DAILY_TASKS.filter(task => isDailyComplete(task) && !isDailyClaimed(task)).length + (isDailyBonusReady() && !state.daily.bonusClaimed ? 1 : 0);
    const newbie = TASKS.filter(task => !task.future && isTaskComplete(task) && !isTaskClaimed(task)).length;
    const achievementByGroup = Object.fromEntries(ACHIEVEMENT_GROUPS.map(group => [group.id, 0]));
    ACHIEVEMENTS.forEach(item => {
      if (isAchievementComplete(item) && !isAchievementClaimed(item)) achievementByGroup[item.group] = (achievementByGroup[item.group] || 0) + 1;
    });
    const achievements = Object.values(achievementByGroup).reduce((sum, value) => sum + value, 0);
    const titles = Array.isArray(state.notices?.titles) ? state.notices.titles.length : 0;
    return {daily, newbie, achievements, titles, achievementByGroup, total:daily + newbie + achievements + titles};
  }

  function setNoticeBadge(el, count) {
    if (!el) return;
    const value = Math.max(0, Number(count) || 0);
    el.hidden = value <= 0;
    el.textContent = value > 9 ? '9+' : String(value);
    el.setAttribute('aria-label', value ? `${value} 个新提醒` : '');
  }

  function renderTaskDot() {
    const counts = taskNoticeCounts();
    setNoticeBadge($('farmTaskDot'), counts.total);
  }

  function renderFriendDot() {
    const incoming = friendRows.filter(row => row.relation_state === 'pending_in').length;
    setNoticeBadge($('farmFriendDot'), incoming + Math.max(0, farmActivityUnreadCount));
  }

  function openPanel(panel) {
    activePanel = panel;
    const meta = {
      shop:{icon:'🛒', eyebrow:'FARM SHOP', title:'农场商店', subtitle:'购买种子、蔬果盲盒与三级肥料，让农场经营更顺手。'},
      bag:{icon:'🎒', eyebrow:'INVENTORY', title:'我的背包', subtitle:'管理种子、肥料与收成蔬果；成熟作物可以在这里出售换取金币。'},
      tasks:{icon:'📜', eyebrow:'FARM QUEST', title:'任务与成就', subtitle:'完成每日农务、新手任务与长期成就，领取奖励并解锁专属称号。'},
      ranking:{icon:'🏆', eyebrow:'RANKING', title:'农场排行榜', subtitle:'查看真实云端玩家的等级榜与金币榜，也可以直接发送好友申请。'},
      friends:{icon:'👥', eyebrow:'FRIENDS', title:'农场好友', subtitle:'查看农场动态、好友申请与好友列表；有人拜访或偷菜时都会留下记录。'}
    }[panel];
    if (!meta) return;
    if (panel === 'friends') activeFriendTab = 'activity';
    openModal({...meta, body:''});
    renderActivePanel();
    if (panel === 'tasks') syncFarmDay(true).then(() => renderActivePanel()).catch(() => {});
    if (panel === 'friends') {
      farmActivityLoadedAt = 0;
      loadFarmActivity(true, true).catch(() => {});
    }
  }

  function formatFarmActivityTime(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '';
    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - date.getTime());
    if (diffMs < 60000) return '刚刚';
    if (diffMs < 3600000) return `${Math.max(1, Math.floor(diffMs / 60000))} 分钟前`;
    const hhmm = date.toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit', hour12:false});
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const diffDays = Math.round((today - day) / 86400000);
    if (diffDays === 0 && diffMs < 21600000) return `${Math.max(1, Math.floor(diffMs / 3600000))} 小时前`;
    if (diffDays === 0) return `今天 ${hhmm}`;
    if (diffDays === 1) return `昨天 ${hhmm}`;
    return `${date.getMonth() + 1}/${date.getDate()} ${hhmm}`;
  }

  function renderActivePanel() {
    const body = $('farmModalBody');
    if (!body || !activePanel || $('farmModal').hidden) return;

    if (activePanel === 'shop') {
      const seedShop = `<div class="farm-shop-grid">${seedItems().map(crop => {
        const locked = state.level < crop.unlockLevel;
        return `<article class="farm-shop-item ${locked ? 'is-locked' : ''}">
          <div class="farm-shop-crop"><span class="farm-shop-crop-icon">${seedIconMarkup(crop)}</span><div><b>${crop.isMystery ? crop.name : `${crop.name}种子`}</b><small>${crop.isMystery ? '固定 4 小时 · 随机蔬果 ×1' : `${crop.growMinutes} 分钟成熟 · 产量 ${crop.yieldMin}～${crop.yieldMax}`}</small></div></div>
          <p>${crop.note}</p>
          <div class="farm-shop-meta"><span>🪙 ${crop.seedPrice} / ${crop.isMystery ? '个' : '包'}</span>${crop.isMystery ? '<span>随机 8 种蔬果</span>' : `<span>出售 ${crop.sellPrice} / 个</span>`}<span>EXP +${crop.exp}</span></div>
          ${locked
            ? `<button disabled>🔒 Lv.${crop.unlockLevel} 解锁</button>`
            : `<div class="farm-shop-buy"><button type="button" data-buy-seed="${crop.id}" data-qty="1">买 1</button><button type="button" data-buy-seed="${crop.id}" data-qty="5">买 5</button><em>背包 ×${state.seeds[crop.id] || 0}</em></div>`}
        </article>`;
      }).join('')}</div>`;
      const careShop = `<section class="farm-shop-care"><header><div><b>🌿 农田照料</b><small>每株每轮最多使用一包肥料；浇水免费。</small></div>${itemSpriteMarkup(2, 'is-shop-header-item')}</header><div class="farm-fertilizer-grid">${FERTILIZERS.map(item => `<article class="farm-fertilizer-card">${itemSpriteMarkup(item.itemCell, 'is-fertilizer-art')}<div class="farm-fertilizer-copy"><b>${item.name}</b><p>${item.note}</p></div><div class="farm-shop-meta farm-fertilizer-meta"><span>🪙 ${item.price} / 包</span><span>背包 ×${state.supplies[item.id] || 0}</span></div><div class="farm-shop-buy"><button type="button" data-buy-supply="${item.id}" data-qty="1">买 1</button><button type="button" data-buy-supply="${item.id}" data-qty="5">买 5</button></div></article>`).join('')}</div></section>`;
      body.innerHTML = seedShop + careShop;
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
            return `<div class="farm-bag-row farm-seed-bag-row"><span class="farm-bag-icon">${seedIconMarkup(c)}</span><div><b>${c.isMystery ? c.name : `${c.name}种子`}</b><small>${c.isMystery ? '固定 4 小时 · 随机蔬果' : `${c.growMinutes} 分钟成熟`}</small></div><em>×${state.seeds[c.id]}</em><button type="button" data-plant-from-bag="${c.id}" ${canPlant ? '' : 'disabled'}>${plantLabel}</button></div>`;
          }).join('') : '<p class="farm-empty-state">目前没有种子，可以到商店补货。</p>'}</div>
        </section>
        <section class="farm-bag-section">
          <header><b>🧺 农作物</b><span>${produceItems.reduce((s,c)=>s+(state.produce[c.id]||0),0)} 个</span></header>
          <div class="farm-bag-list">${produceItems.length ? produceItems.map(c => {
            const qty = state.produce[c.id] || 0;
            return `<div class="farm-bag-row farm-produce-row"><span>${c.icon}</span><div><b>${c.name}</b><small>单个售价 ${c.sellPrice} 金币 · 全售可得 ${qty*c.sellPrice}</small></div><em>×${qty}</em><div class="farm-sell-actions"><button type="button" data-sell="${c.id}" data-qty="1">卖 1</button><button type="button" data-sell="${c.id}" data-qty="all">全部出售</button></div></div>`;
          }).join('') : '<p class="farm-empty-state">成熟作物收成后会放到这里。</p>'}</div>
        </section>
        <section class="farm-bag-section">
          <header><b>🌿 肥料</b><span>${FERTILIZERS.reduce((sum,item)=>sum+(state.supplies[item.id]||0),0)} 包</span></header>
          <div class="farm-bag-list">${FERTILIZERS.map(item => `<div class="farm-bag-row farm-supply-row">${itemSpriteMarkup(item.itemCell, 'is-bag-item')}<div><b>${item.name}</b><small>${item.note} · 点正在成长的农田即可使用</small></div><em>×${state.supplies[item.id] || 0}</em></div>`).join('')}</div>
        </section>`;
      return;
    }

    if (activePanel === 'tasks') {
      const noticeCounts = taskNoticeCounts();
      const tabBadge = count => count > 0 ? `<i class="farm-tab-notice">${count > 9 ? '9+' : count}</i>` : '';
      const tabs = `<div class="farm-task-tabs">
        <button type="button" data-task-tab="daily" class="${activeTaskTab === 'daily' ? 'is-active' : ''}">☀️ 每日${tabBadge(noticeCounts.daily)}</button>
        <button type="button" data-task-tab="newbie" class="${activeTaskTab === 'newbie' ? 'is-active' : ''}">📜 新手${tabBadge(noticeCounts.newbie)}</button>
        <button type="button" data-task-tab="achievements" class="${activeTaskTab === 'achievements' ? 'is-active' : ''}">🏅 成就${tabBadge(noticeCounts.achievements)}</button>
        <button type="button" data-task-tab="titles" class="${activeTaskTab === 'titles' ? 'is-active' : ''}">🏷️ 称号${tabBadge(noticeCounts.titles)}</button>
      </div>`;

      if (activeTaskTab === 'daily') {
        const dayLabel = escapeHtml(state.daily?.date || farmDay);
        const dailyItems = DAILY_TASKS.map(task => {
          const progress = dailyProgress(task);
          const complete = isDailyComplete(task);
          const claimed = isDailyClaimed(task);
          const pct = Math.min(100, Math.round((progress / task.target) * 100));
          const action = claimed
            ? '<span class="farm-task-claimed">✓ 已领取</span>'
            : complete
              ? `<button type="button" data-claim-daily="${task.id}">领取奖励</button>`
              : `<span class="farm-task-progress-text">${progress} / ${task.target}</span>`;
          return `<article class="farm-task-item farm-daily-item ${complete ? 'is-complete' : ''} ${claimed ? 'is-claimed' : ''}">
            <div class="farm-task-copy"><b>${task.title}</b><p>${task.desc}</p><small>奖励：${task.rewardText}</small></div>
            <div class="farm-task-side">${action}</div>
            <div class="farm-task-bar"><i style="width:${pct}%"></i></div>
          </article>`;
        }).join('');
        const bonusReady = isDailyBonusReady();
        const bonusAction = state.daily.bonusClaimed
          ? '<span class="farm-task-claimed">✓ 今日已领取</span>'
          : bonusReady
            ? '<button type="button" data-claim-daily-bonus>领取全勤</button>'
            : `<span class="farm-task-progress-text">${DAILY_TASKS.filter(isDailyComplete).length} / ${DAILY_TASKS.length}</span>`;
        body.innerHTML = `${tabs}<section class="farm-daily-head"><div><small>UTC+8 每日 00:00 重置</small><b>${dayLabel}</b></div><span>☀️ 今日农务</span></section><div class="farm-task-list">${dailyItems}<article class="farm-task-item farm-daily-bonus ${bonusReady ? 'is-complete' : ''} ${state.daily.bonusClaimed ? 'is-claimed' : ''}"><div class="farm-task-copy"><b>🎁 ${DAILY_BONUS.title}</b><p>${DAILY_BONUS.desc}</p><small>奖励：${DAILY_BONUS.rewardText}</small></div><div class="farm-task-side">${bonusAction}</div><div class="farm-task-bar"><i style="width:${Math.min(100, DAILY_TASKS.filter(isDailyComplete).length / DAILY_TASKS.length * 100)}%"></i></div></article></div>`;
        return;
      }

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
        const groups = ACHIEVEMENT_GROUPS.map(group => {
          const count = noticeCounts.achievementByGroup[group.id] || 0;
          return `<button type="button" data-achievement-group="${group.id}" class="${activeAchievementGroup === group.id ? 'is-active' : ''}">${group.icon} ${group.label}${count ? `<i class="farm-chip-notice">${count > 9 ? '9+' : count}</i>` : ''}</button>`;
        }).join('');
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
        // The category row itself is recreated when a category is tapped. Restore
        // its previous horizontal position on the next frame so the selected
        // category stays where the user left it instead of jumping back to the
        // first chip.
        requestAnimationFrame(() => {
          const scroller = body.querySelector('.farm-achievement-groups');
          if (!scroller) return;
          const maxLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
          scroller.scrollLeft = Math.min(Math.max(0, achievementGroupScrollLeft), maxLeft);
        });
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
      if (!farmActivityLoading && !farmActivityLoadedAt && !farmActivityError) setTimeout(() => loadFarmActivity(false, false), 0);
      const incoming = friendRows.filter(row => row.relation_state === 'pending_in');
      const accepted = friendRows.filter(row => row.relation_state === 'friend');
      const outgoing = friendRows.filter(row => row.relation_state === 'pending_out');
      const unreadActivities = Math.max(0, Number(farmActivityUnreadCount) || 0);

      const activityHtml = farmActivityRows.map(row => {
        const type = String(row.activity_type || 'steal');
        const crop = CROPS.find(c => c.id === row.crop_id) || {name:'作物', icon:'🌿'};
        const safeId = escapeHtml(row.actor_id || '');
        const who = escapeHtml(row.display_name || '农场好友');
        const sex = row.sex === 'male' ? '♂' : row.sex === 'female' ? '♀' : '';
        const when = escapeHtml(formatFarmActivityTime(row.activity_at));
        let icon = '🌿';
        let title = `${who}${sex ? ` ${sex}` : ''} 来过你的农场`;
        let detail = when;
        if (type === 'visit') {
          icon = '👣';
          title = `${who}${sex ? ` ${sex}` : ''} 拜访了你的农场`;
        } else if (type === 'steal') {
          icon = crop.icon || '🥷';
          title = `${who}${sex ? ` ${sex}` : ''} 偷走了 ${escapeHtml(crop.name)} ×${Math.max(1, Number(row.amount) || 1)}`;
          if (Number.isInteger(Number(row.plot_id))) detail += ` · 第 ${Number(row.plot_id) + 1} 格`;
        } else if (type === 'help_bug') {
          icon = '🪲';
          title = `${who}${sex ? ` ${sex}` : ''} 帮你的作物除虫了`;
          if (Number.isInteger(Number(row.plot_id))) detail += ` · 第 ${Number(row.plot_id) + 1} 格`;
        }
        return `<article class="farm-activity-row is-${escapeHtml(type)} ${row.is_unread ? 'is-unread' : ''}">
          <div class="farm-activity-icon">${icon}</div>
          <div class="farm-activity-copy"><b>${title}</b><small>${detail}</small></div>
          ${row.is_unread ? '<span class="farm-activity-new">NEW</span>' : ''}
          ${safeId ? `<button type="button" class="farm-friend-action is-visit" data-friend-visit="${safeId}">回访</button>` : ''}
        </article>`;
      }).join('');

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

      const tabBadge = count => count > 0 ? `<i class="farm-friend-tab-badge">${count > 9 ? '9+' : count}</i>` : '';
      let tabContent = '';
      if (activeFriendTab === 'activity') {
        tabContent = `<section class="farm-friend-section farm-activity-section">
          <header><b>🌿 最近动态</b><span>${farmActivityRows.length}</span></header>
          ${farmActivityLoading ? '<div class="farm-network-state"><span class="farm-spinner"></span><b>正在读取农场动态…</b></div>' : activityHtml || '<p class="farm-empty-state">还没有农场动态。好友拜访或偷菜后，会在这里留下记录。</p>'}
        </section>`;
      } else if (activeFriendTab === 'friends') {
        tabContent = `<section class="farm-friend-section"><header><b>👥 我的好友</b><span>${accepted.length}</span></header>${accepted.length ? accepted.map(row => friendCard(row,'friend')).join('') : '<p class="farm-empty-state">还没有好友。可以到排行榜找到农友并点击「＋ 好友」。</p>'}</section>`;
      } else {
        tabContent = `${incoming.length ? `<section class="farm-friend-section"><header><b>📩 收到的申请</b><span>${incoming.length}</span></header>${incoming.map(row => friendCard(row,'incoming')).join('')}</section>` : '<section class="farm-friend-section"><header><b>📩 收到的申请</b><span>0</span></header><p class="farm-empty-state">目前没有待确认的好友申请。</p></section>'}
          ${outgoing.length ? `<section class="farm-friend-section"><header><b>⏳ 已送出的申请</b><span>${outgoing.length}</span></header>${outgoing.map(row => friendCard(row,'outgoing')).join('')}</section>` : ''}`;
      }

      body.innerHTML = `
        <div class="farm-friends-summary"><span>👥 好友 <b>${accepted.length}</b></span><span>📩 待确认 <b>${incoming.length}</b></span><span>🌿 未读动态 <b>${unreadActivities}</b></span><button type="button" class="farm-refresh-button" data-refresh-friends ${(friendsLoading || farmActivityLoading) ? 'disabled' : ''}>↻ 刷新</button></div>
        <div class="farm-friend-tabs" role="tablist" aria-label="好友功能">
          <button type="button" data-friend-tab="activity" class="${activeFriendTab === 'activity' ? 'is-active' : ''}">🌿 动态 ${tabBadge(unreadActivities)}</button>
          <button type="button" data-friend-tab="friends" class="${activeFriendTab === 'friends' ? 'is-active' : ''}">👥 好友 <small>${accepted.length}</small></button>
          <button type="button" data-friend-tab="requests" class="${activeFriendTab === 'requests' ? 'is-active' : ''}">📩 申请 ${tabBadge(incoming.length)}</button>
        </div>
        ${(friendsLoading && !friendRows.length) ? '<div class="farm-network-state"><span class="farm-spinner"></span><b>正在读取好友资料…</b></div>' : ''}
        ${friendsError ? `<div class="farm-network-state is-error"><b>⚠ ${escapeHtml(friendsError)}</b></div>` : ''}
        ${farmActivityError && activeFriendTab === 'activity' ? `<div class="farm-network-state is-error"><b>⚠ ${escapeHtml(farmActivityError)}</b></div>` : ''}
        ${!friendsLoading && !friendsError ? tabContent : ''}`;
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
      const remaining = remainingFor(plot, crop);

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
    updateWaterAllButton();
  }

  function tick() {
    const today = localFarmDay();
    if (today !== farmDay) {
      ensureDailyState(today, {persist:true});
      renderAll();
      if (cloudReady) syncFarmDay(true).catch(() => {});
    } else if (cloudReady && Date.now() - farmDaySyncAt >= FARM_DAY_SYNC_MS) {
      syncFarmDay(false).catch(() => {});
    }
    renderStats();
    // Do not rebuild all 20 buttons every second. Replacing the DOM while the
    // pointer is resting on a plot makes hover feel jittery; only countdowns
    // and growth-stage classes need a one-second refresh.
    refreshFieldTimers();
    // Task/achievement panels must NOT be rebuilt every second. On iOS, replacing
    // the horizontal achievement-group scroller resets scrollLeft to 0 while the
    // finger is dragging, which feels like a rubber-band snap-back. Task UI is
    // rerendered by actual state-changing actions instead.
    if (activePanel !== 'tasks') renderTaskDot();
    // Friend steals / another device advance the server revision. Poll only the
    // tiny revision field once per minute; download the full farm JSON only if it changed.
    if (cloudReady && !cloudBusy && !document.hidden && Date.now() - cloudLastRevisionCheckAt >= CLOUD_REVISION_POLL_MS) {
      checkCloudRevision().catch(() => {});
    }
    if (cloudReady && !document.hidden && Date.now() - farmActivityUnreadCheckedAt >= FARM_ACTIVITY_UNREAD_POLL_MS) {
      refreshFarmActivityUnread(false).catch(() => {});
    }
  }

  function handleClick(event) {
    const openTitles = event.target.closest('[data-open-titles]');
    if (openTitles) {
      activeTaskTab = 'titles';
      if (state.notices?.titles?.length) {
        state.notices.titles = [];
        saveState();
      }
      openPanel('tasks');
      return;
    }

    const taskTab = event.target.closest('[data-task-tab]');
    if (taskTab) {
      activeTaskTab = ['daily','newbie','achievements','titles'].includes(taskTab.dataset.taskTab) ? taskTab.dataset.taskTab : 'daily';
      if (activeTaskTab === 'daily') syncFarmDay(true).then(() => renderActivePanel()).catch(() => {});
      if (activeTaskTab === 'titles' && state.notices?.titles?.length) {
        state.notices.titles = [];
        saveState();
      }
      renderActivePanel();
      return;
    }

    const achievementGroup = event.target.closest('[data-achievement-group]');
    if (achievementGroup) {
      const scroller = achievementGroup.closest('.farm-achievement-groups');
      if (scroller) achievementGroupScrollLeft = scroller.scrollLeft;
      activeAchievementGroup = ACHIEVEMENT_GROUPS.some(group => group.id === achievementGroup.dataset.achievementGroup) ? achievementGroup.dataset.achievementGroup : 'wealth';
      renderActivePanel();
      return;
    }

    const dailyClaim = event.target.closest('[data-claim-daily]');
    if (dailyClaim) {
      claimDailyTask(dailyClaim.dataset.claimDaily);
      return;
    }

    if (event.target.closest('[data-claim-daily-bonus]')) {
      claimDailyBonus();
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

    if (event.target.closest('#farmWaterAll')) {
      waterAll();
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
    if (event.target.closest('[data-refresh-friends]')) { friendsLoadedAt = 0; farmActivityLoadedAt = 0; Promise.all([loadFriends(true), loadFarmActivity(true, activeFriendTab === 'activity')]); return; }

    const friendTab = event.target.closest('[data-friend-tab]');
    if (friendTab) {
      const nextTab = ['activity','friends','requests'].includes(friendTab.dataset.friendTab) ? friendTab.dataset.friendTab : 'activity';
      activeFriendTab = nextTab;
      if (nextTab === 'activity') { farmActivityLoadedAt = 0; loadFarmActivity(true, true).catch(() => {}); }
      else renderActivePanel();
      return;
    }

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

    const helpBug = event.target.closest('[data-help-bug-friend][data-help-bug-plot]');
    if (helpBug) { helpFriendBug(helpBug.dataset.helpBugFriend, Number(helpBug.dataset.helpBugPlot)); return; }

    const debugPlot = event.target.closest('[data-debug-plot]');
    if (debugPlot) { debugPlots([Number(debugPlot.dataset.debugPlot)], {single:true}); return; }

    const merchantBuy = event.target.closest('[data-merchant-buy]');
    if (merchantBuy) { buyMerchantSeed(merchantBuy.dataset.merchantBuy, merchantBuy.dataset.qty); return; }

    const waterPlot = event.target.closest('[data-water-plot]');
    if (waterPlot) { waterPlots([Number(waterPlot.dataset.waterPlot)], {single:true}); return; }

    const fertilizePlot = event.target.closest('[data-fertilize-plot][data-fertilizer]');
    if (fertilizePlot) { applyFertilizer(Number(fertilizePlot.dataset.fertilizePlot), fertilizePlot.dataset.fertilizer); return; }

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

    const buySupplyBtn = event.target.closest('[data-buy-supply]');
    if (buySupplyBtn) {
      buySupply(buySupplyBtn.dataset.buySupply, buySupplyBtn.dataset.qty);
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
    // `scroll` does not bubble, so listen in capture phase. This continuously
    // remembers the achievement chip row position while the user swipes it.
    document.addEventListener('scroll', event => {
      const target = event.target;
      if (target instanceof Element && target.classList.contains('farm-achievement-groups')) {
        achievementGroupScrollLeft = target.scrollLeft;
      }
    }, true);
    document.addEventListener('input', event => {
      if (event.target.matches('#farmPlantQtyRange')) updatePlantQuantity(event.target.value);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !$('farmModal').hidden) closeModal();
    });
    $('farmScrollTop')?.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
    $('farmDebugAll')?.addEventListener('click', debugAll);
    $('farmMerchantNpc')?.addEventListener('click', openMerchantShop);
    window.addEventListener('stellar:player-profile-saved', () => { renderOwner(); invalidateMultiplayer(); });
    window.addEventListener('stellar:profile-updated', () => { renderOwner(); invalidateMultiplayer(); });
    window.addEventListener('stellar:auth-state', event => {
      const nextUserId = event.detail?.userId || '';
      if (cloudUserId && nextUserId && nextUserId !== cloudUserId) bootstrapCloud(true);
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && cloudReady && Date.now() - cloudLastRevisionCheckAt > CLOUD_VISIBILITY_CHECK_MS) {
        checkCloudRevision({force:true}).catch(() => {});
        syncFarmDay(true).catch(() => {});
        refreshFarmActivityUnread(true).catch(() => {});
        if (activePanel === 'friends' && activeFriendTab === 'activity') {
          farmActivityLoadedAt = 0;
          loadFarmActivity(true, false).catch(() => {});
        }
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
    ensureDailyState(localFarmDay(), {persist:false});
    saveState({touch:false, sync:false});
    renderAll();
    bootstrapCloud(false).then(() => Promise.all([loadFriends(true), refreshFarmActivityUnread(true)])).catch(() => {});

    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(tick, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
