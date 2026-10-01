(() => {
  'use strict';

  const FARM_BUILD = '0.19.2';
  const STORAGE_KEY = 'xingchen-farm-v1';
  const VERSION = 1;
  const PLOT_COUNT = 20;
  const INITIAL_COINS = 100;
  const CLOUD_TABLE = 'farm_saves';
  const CLOUD_SYNC_DELAY = 700;
  const CLOUD_REVISION_POLL_MS = 120000;
  const CLOUD_VISIBILITY_CHECK_MS = 15000;
  const FARM_DAY_SYNC_MS = 30 * 60 * 1000;
  const FARM_ACTIVITY_UNREAD_POLL_MS = 120 * 1000;
  const SYNC_META_KEY = 'xingchen-farm-v1-sync-meta';
  const PENDING_OPS_KEY = 'xingchen-farm-v1-pending-ops';


  // V0.19.2 — seasonal wardrobe release. Outfit ownership remains permanent,
  // while avatar.outfit only records the currently equipped look. #5002 Mid-Autumn,
  // #5003 Halloween and #5004 Christmas now ship with male/female Sprite Sheets.
  const FARM_ITEM_IDS = Object.freeze({
    TRAIN_RESET_TICKET:4004,
    OUTFIT_DEFAULT:5001,
    OUTFIT_MID_AUTUMN:5002,
    OUTFIT_HALLOWEEN:5003,
    OUTFIT_CHRISTMAS:5004,
    PET_YA_YA:7001,
    PET_SHIBA:7002,
    PET_ORANGE_CAT:7003,
    PET_MOON_RABBIT:7004,
    DECOR_MID_LANTERN:6001,
    DECOR_MID_RABBIT:6002,
    DECOR_MID_OSMANTHUS:6003,
    DECOR_MID_MOON_LAMP:6004,
    DECOR_HALLOWEEN_PUMPKIN:6005,
    DECOR_HALLOWEEN_GHOST:6006,
    DECOR_HALLOWEEN_CANDLE:6007,
    DECOR_CHRISTMAS_TREE:6009,
    DECOR_CHRISTMAS_GIFTS:6010,
    DECOR_CHRISTMAS_SNOWMAN:6011,
    DECOR_CHRISTMAS_LAMP:6012
  });
  const AVATAR_GENDERS = Object.freeze(['male','female']);
  const AVATAR_OUTFITS = Object.freeze([
    Object.freeze({id:'default', itemId:FARM_ITEM_IDS.OUTFIT_DEFAULT, name:'星辰农夫', note:'温暖朴实的基础农夫造型。', icon:'🌾', released:true, male:true, female:true, maleAsset:'default-male.png', femaleAsset:'default-female.png', maleFrames:8, femaleFrames:8}),
    Object.freeze({id:'mid_autumn', itemId:FARM_ITEM_IDS.OUTFIT_MID_AUTUMN, name:'中秋节造型', note:'月白与淡紫／冰蓝配色的中秋限定古风服装。', icon:'🌕', released:true, male:true, female:true, maleAsset:'mid-autumn-male.png', femaleAsset:'mid-autumn-female.png', maleFrames:8, femaleFrames:8}),
    Object.freeze({id:'halloween', itemId:FARM_ITEM_IDS.OUTFIT_HALLOWEEN, name:'万圣节造型', note:'黑红吸血鬼绅士／暗黑哥德礼服的万圣节限定造型。', icon:'🎃', released:true, male:true, female:true, maleAsset:'halloween-male.png', femaleAsset:'halloween-female.png', maleFrames:6, femaleFrames:8}),
    Object.freeze({id:'christmas', itemId:FARM_ITEM_IDS.OUTFIT_CHRISTMAS, name:'圣诞造型', note:'圣诞红冬装／红色毛绒斗篷的节日限定造型。', icon:'🎄', released:true, male:true, female:true, maleAsset:'christmas-male.png', femaleAsset:'christmas-female.png', maleFrames:6, femaleFrames:8})
  ]);

  // V0.19.2 — direct-unlock pet collection. Ownership is permanent under
  // state.pets.owned; state.pets.active stores only the currently following pet.
  const PETS = Object.freeze([
    Object.freeze({id:'ya_ya', itemId:FARM_ITEM_IDS.PET_YA_YA, name:'牙牙', note:'圆滚滚的奶白牙齿娃娃精灵，喜欢安静地陪在农场主人身边。', released:true, asset:'ya-ya.png', iconAsset:'ya-ya-icon.png', frames:6}),
    Object.freeze({id:'shiba', itemId:FARM_ITEM_IDS.PET_SHIBA, name:'小柴犬', note:'活泼亲人的小柴犬，戴着绿色农场领巾，总喜欢跟着主人巡田。', released:true, asset:'shiba.png', iconAsset:'shiba-icon.png', frames:6}),
    Object.freeze({id:'orange_cat', itemId:FARM_ITEM_IDS.PET_ORANGE_CAT, name:'橘猫', note:'暖橘色的小猫咪，脖子上的小铃铛会陪着它一起在农场散步。', released:true, asset:'orange-cat.png', iconAsset:'orange-cat-icon.png', frames:6}),
    Object.freeze({id:'moon_rabbit', itemId:FARM_ITEM_IDS.PET_MOON_RABBIT, name:'月桂兔', note:'带着桂花与弯月饰品的中秋小白兔，安静又温柔。', released:true, asset:'moon-rabbit.png', iconAsset:'moon-rabbit-icon.png', frames:6})
  ]);

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
  const CATALOG_ATLAS = Object.freeze({cols:4, rows:4});
  const SEASONAL_DECOR_ATLAS = Object.freeze({cols:4, rows:4});
  const BASE_PEST_CHANCE = 0.10;
  const DAILY_EVENTS = Object.freeze([
    Object.freeze({id:'sunny', icon:'☀️', name:'晴朗', note:'本时段播种的普通作物成长时间缩短 5%。', growFactor:0.95, pestChance:0.10}),
    Object.freeze({id:'harvest', icon:'🌾', name:'丰收祝福', note:'本时段收成普通作物时获得的 EXP 提升 10%。', expFactor:1.10, pestChance:0.10}),
    Object.freeze({id:'rainy', icon:'🌧️', name:'多雨', note:'本时段播种时虫害机率由 10% 提升到 20%。', pestChance:0.20}),
    Object.freeze({id:'storm', icon:'⛈️', name:'雷雨', note:'本时段收成每格普通作物少 1 个，最低仍保留 1 个。', yieldPenalty:1, pestChance:0.10}),
    Object.freeze({id:'merchant', icon:'🛒', name:'种子商人来访', note:'旅行商人在本时段停在农舍旁，随机两种已解锁种子 9 折。', merchant:true, pestChance:0.10})
  ]);
  const WATER_FACTOR = 0.92;
  const FRIEND_WATER_FACTOR = 0.95;
  const FERTILIZERS = Object.freeze([
    Object.freeze({id:'fertilizerLow', name:'低级肥料', price:12, factor:0.90, reduction:10, itemCell:5, statusCell:11, note:'缩短本轮作物约 10% 成长时间。'}),
    Object.freeze({id:'fertilizerMid', name:'中级肥料', price:28, factor:0.80, reduction:20, itemCell:6, statusCell:12, note:'缩短本轮作物约 20% 成长时间。'}),
    Object.freeze({id:'fertilizerHigh', name:'高级肥料', price:55, factor:0.70, reduction:30, itemCell:7, statusCell:13, note:'缩短本轮作物约 30% 成长时间。'})
  ]);


  // V0.19.2 — fixed-slot decoration catalog now includes seasonal scenery.
  // Existing farm decor keeps using the event atlas. Seasonal decor uses its own
  // 4×4 scene atlas plus Item IDs / item-icon cells for GM mail and backpack UI.
  const DECORATION_SLOT_COUNT = 8;
  // V0.19.2: slot 5 overlaps the farm owner avatar, so keep the save-array
  // shape stable but retire that visual placement. Old saves are migrated below.
  const DISABLED_DECORATION_SLOT_INDEXES = new Set([4]);
  const DECORATIONS = Object.freeze([
    Object.freeze({id:'hay', name:'稻草堆', eventCell:13, price:100, unlockLevel:3, scale:.86, note:'朴实温暖的小型稻草装饰。'}),
    Object.freeze({id:'barrels', name:'木桶与木箱', eventCell:12, price:150, unlockLevel:5, scale:.88, note:'适合摆在农舍旁的经典农场杂物。'}),
    Object.freeze({id:'flowerbed', name:'小花圃', eventCell:8, price:200, unlockLevel:5, scale:.90, note:'白花、黄花与粉色小花组成的温柔花圃。'}),
    Object.freeze({id:'wheel', name:'木制车轮', eventCell:14, price:250, unlockLevel:5, scale:.82, note:'带藤叶与小花的复古木车轮。'}),
    Object.freeze({id:'birdhouse', name:'木制鸟屋', eventCell:9, price:300, unlockLevel:8, scale:.86, note:'给农场增添一点生活气息的小鸟屋。'}),
    Object.freeze({id:'bench', name:'木制长椅', eventCell:10, price:400, unlockLevel:8, scale:.92, note:'适合放在草地边休息的农场长椅。'}),
    Object.freeze({id:'scarecrow', name:'稻草人', eventCell:7, price:500, unlockLevel:10, scale:.96, note:'经典农场守护者，远远就能看到。'}),
    Object.freeze({id:'lamp', name:'农场路灯', eventCell:11, price:700, unlockLevel:12, scale:.88, note:'带暖黄色灯光的复古农场路灯。'}),
    Object.freeze({id:'windmill', name:'小型风车', eventCell:15, price:1000, unlockLevel:15, scale:.96, note:'庭院里的小型景观风车。'}),
    Object.freeze({id:'sign', name:'星辰农场木牌', eventCell:16, price:1500, unlockLevel:10, scale:1.02, note:'会自动显示农场主人名称与当前称号。'}),

    Object.freeze({id:'mid_lantern', itemId:FARM_ITEM_IDS.DECOR_MID_LANTERN, name:'中秋宫灯', decorCell:1, itemIconCell:6, price:600, unlockLevel:1, scale:1.02, seasonal:'mid_autumn', shopVisible:true, note:'月色与桂花相伴的古典宫灯，中秋限定装饰。'}),
    Object.freeze({id:'mid_rabbit', itemId:FARM_ITEM_IDS.DECOR_MID_RABBIT, name:'玉兔摆饰', decorCell:2, itemIconCell:7, price:800, unlockLevel:1, scale:1.04, seasonal:'mid_autumn', shopVisible:true, note:'抱着月饼的可爱玉兔，为农场添上一点团圆气息。'}),
    Object.freeze({id:'mid_osmanthus', itemId:FARM_ITEM_IDS.DECOR_MID_OSMANTHUS, name:'桂花盆栽', decorCell:3, itemIconCell:8, price:650, unlockLevel:1, scale:1.03, seasonal:'mid_autumn', shopVisible:true, note:'金桂盛开的古典盆景，中秋限定装饰。'}),
    Object.freeze({id:'mid_moon_lamp', itemId:FARM_ITEM_IDS.DECOR_MID_MOON_LAMP, name:'月亮景观灯', decorCell:4, itemIconCell:9, price:1200, unlockLevel:1, scale:1.08, seasonal:'mid_autumn', shopVisible:true, note:'柔和发光的满月景观灯，适合放在草地边赏月。'}),

    Object.freeze({id:'halloween_pumpkin', itemId:FARM_ITEM_IDS.DECOR_HALLOWEEN_PUMPKIN, name:'万圣南瓜灯', decorCell:5, itemIconCell:10, price:900, unlockLevel:1, scale:1.00, seasonal:'halloween', shopVisible:false, note:'微笑发光的南瓜灯。'}),
    Object.freeze({id:'halloween_ghost', itemId:FARM_ITEM_IDS.DECOR_HALLOWEEN_GHOST, name:'幽灵墓碑', decorCell:6, itemIconCell:11, price:1100, unlockLevel:1, scale:1.02, seasonal:'halloween', shopVisible:false, note:'调皮小幽灵躲在墓碑旁。'}),
    Object.freeze({id:'halloween_candle', itemId:FARM_ITEM_IDS.DECOR_HALLOWEEN_CANDLE, name:'万圣烛台', decorCell:7, itemIconCell:12, price:1000, unlockLevel:1, scale:.94, seasonal:'halloween', shopVisible:false, note:'黑金烛台与紫色烛火。'}),

    Object.freeze({id:'christmas_tree', itemId:FARM_ITEM_IDS.DECOR_CHRISTMAS_TREE, name:'圣诞树', decorCell:9, itemIconCell:13, price:1200, unlockLevel:1, scale:1.08, seasonal:'christmas', shopVisible:false, note:'挂满灯饰的节日圣诞树。'}),
    Object.freeze({id:'christmas_gifts', itemId:FARM_ITEM_IDS.DECOR_CHRISTMAS_GIFTS, name:'圣诞礼物堆', decorCell:10, itemIconCell:14, price:900, unlockLevel:1, scale:1.02, seasonal:'christmas', shopVisible:false, note:'红绿金色礼物盒堆。'}),
    Object.freeze({id:'christmas_snowman', itemId:FARM_ITEM_IDS.DECOR_CHRISTMAS_SNOWMAN, name:'雪人', decorCell:11, itemIconCell:15, price:1000, unlockLevel:1, scale:1.04, seasonal:'christmas', shopVisible:false, note:'戴着围巾与冬帽的温暖雪人。'}),
    Object.freeze({id:'christmas_lamp', itemId:FARM_ITEM_IDS.DECOR_CHRISTMAS_LAMP, name:'圣诞路灯', decorCell:12, itemIconCell:16, price:1050, unlockLevel:1, scale:.96, seasonal:'christmas', shopVisible:false, note:'冬青、蝴蝶结与金铃点缀的节日路灯。'})
  ]);

  // V0.14.2 — lightweight NPC farmers. NPC farms are lazily simulated from
  // the current clock, so they do not need background browser sessions, cron
  // jobs, or per-NPC Supabase polling. NPCs never enter the real leaderboard.
  const NPC_HELP_CHECK_MS = 45 * 60 * 1000;
  const NPC_VISIT_CHECK_MS = 90 * 60 * 1000;
  const NPC_CYCLE_SEQUENCE_LENGTH = 32;
  const NPC_CYCLE_EPOCH_MS = Date.UTC(2026, 0, 1);
  const NPC_ACTIVITY_LIMIT = 30;
  // NPC thefts stay inside the player's existing farm save. No extra polling or
  // server-side NPC jobs are needed. A deterministic crop cycle id + a short
  // capped history prevents F5 / revisit from creating unlimited produce.
  const NPC_STEAL_RECORD_LIMIT = 160;
  const NPC_STEAL_CAP_PER_WINDOW = 2;
  const NPC_FARMERS = Object.freeze([
    Object.freeze({id:'npc_xiaohe', name:'小禾', sex:'female', icon:'🌾', level:8,  coins:680,  titleId:'farmer',          outfit:'mid_autumn', decorTheme:'mid_autumn', trait:'麦田守望者', note:'喜欢小麦和玉米，看到虫害时常会顺手帮忙。', favorites:['wheat','corn'], helpRate:.62, visitRate:.34}),
    Object.freeze({id:'npc_meimei', name:'莓莓', sex:'female', icon:'🍓', level:10, coins:1280, titleId:'skilled_farmer', outfit:'christmas', decorTheme:'christmas', trait:'甜果农友',   note:'偏爱草莓和番茄，农田总是整理得很可爱。', favorites:['strawberry','tomato'], helpRate:.48, visitRate:.38}),
    Object.freeze({id:'npc_amu', name:'阿牧', sex:'male', icon:'🌽', level:12, coins:1750, titleId:'senior_farmer', outfit:'halloween', decorTheme:'halloween', trait:'慢活农夫', note:'收菜不赶时间，但很喜欢到朋友的农场串门。', favorites:['corn','pumpkin','wheat'], helpRate:.44, visitRate:.62}),
    Object.freeze({id:'npc_xiaonuan', name:'小暖', sex:'female', icon:'🌻', level:6, coins:520, titleId:'novice_farmer', outfit:'default', decorTheme:'christmas', trait:'热心邻居', note:'等级不高，却是最爱帮忙处理虫害的邻居。', favorites:['carrot','tomato'], helpRate:.72, visitRate:.42}),
    Object.freeze({id:'npc_xingzai', name:'星仔', sex:'male', icon:'✨', level:18, coins:4660, titleId:'farm_master', outfit:'halloween', decorTheme:'halloween', trait:'夜班农友', note:'常在晚一点的时候上线，偶尔会种比较稀有的作物。', favorites:['grape','strawberry','pumpkin'], helpRate:.40, visitRate:.30}),
    Object.freeze({id:'npc_nanfeng', name:'南风', sex:'male', icon:'🍇', level:15, coins:3380, titleId:'harvest_master', outfit:'christmas', decorTheme:'christmas', trait:'果园派', note:'喜欢葡萄、南瓜与长时间作物，农场变化比较慢。', favorites:['grape','pumpkin','strawberry'], helpRate:.46, visitRate:.28}),
    Object.freeze({id:'npc_mili', name:'米粒', sex:'female', icon:'🥕', level:5, coins:360, titleId:'novice_farmer', outfit:'mid_autumn', decorTheme:'mid_autumn', trait:'新手伙伴', note:'和新玩家差不多的成长节奏，最常种红萝卜。', favorites:['carrot','wheat','tomato'], helpRate:.55, visitRate:.46}),
    Object.freeze({id:'npc_qinghe', name:'青禾', sex:'male', icon:'🌿', level:20, coins:7250, titleId:'farm_master', outfit:'default', decorTheme:'halloween', trait:'资深农友', note:'经营很久的老农友，农田里经常同时种着不同作物。', favorites:['grape','pumpkin','corn','strawberry'], helpRate:.50, visitRate:.36})
  ]);

  // V0.15.0 — Stellar Station now has two independent platforms. Both trains are
  // available after the 00:00 daily reset, so players may freely choose the better
  // multiplier first. A dispatched train pays immediately; its platform returns
  // after a deterministic 4–6 hour cooldown. Up to three extra trains may arrive
  // per farm day, keeping the economy bounded while rewarding active players.
  const TRAIN_BASE_PRICE_FACTOR = 1.20;
  const TRAIN_APPLIED_OP_LIMIT = 120;
  const TRAIN_SLOT_COUNT = 2;
  const TRAIN_DAILY_BONUS_CAP = 3;
  const TRAIN_CAR_ASSETS = Object.freeze(['wood','green','blue']);
  const TRAIN_MULTIPLIERS = Object.freeze([
    Object.freeze({value:1.1, weight:28, tier:'normal'}),
    Object.freeze({value:1.2, weight:24, tier:'normal'}),
    Object.freeze({value:1.3, weight:18, tier:'normal'}),
    Object.freeze({value:1.4, weight:12, tier:'normal'}),
    Object.freeze({value:1.5, weight:12, tier:'red'}),
    Object.freeze({value:2.0, weight:6, tier:'gold'})
  ]);
  const TRAIN_QTY_RANGES = Object.freeze({
    carrot:[8,15], wheat:[8,14], corn:[6,12], tomato:[5,10],
    strawberry:[4,8], pumpkin:[3,6], grape:[2,5], starfruit:[1,3]
  });

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
    { id:'visitFriend1', title:'第一次串门', desc:'第一次拜访已经加入的真人或 NPC 农友。', type:'friendVisits', target:1, reward:{exp:10}, rewardText:'EXP +10' },
    { id:'helpWater1', title:'第一份助力', desc:'第一次帮农友的作物完成好友助力浇水。', type:'helpWater', target:1, reward:{exp:15}, rewardText:'EXP +15' },
    { id:'helpBug1', title:'守护好友农田', desc:'第一次帮真人好友清除虫害。', type:'helpBug', target:1, reward:{coins:15, exp:15}, rewardText:'金币 ×15 · EXP +15' },
    { id:'friend5', title:'热闹小农场', desc:'好友达到 5 人。', type:'friend', target:5, reward:{seeds:{strawberry:3}}, rewardText:'草莓种子 ×3' },
    { id:'friend10', title:'农场交友达人', desc:'好友达到 10 人。', type:'friend', target:10, reward:{seeds:{pumpkin:3}}, rewardText:'南瓜种子 ×3' }
  ];

  // V0.18.1 — Daily Quest 2.0. Five quests are selected once per UTC+8 farm day
  // from a level-aware pool. The selected ids live inside the existing farm save,
  // so F5 / mobile / desktop all see the same plan without an extra database table.
  const DAILY_TASK_COUNT = 5;
  const DAILY_MASTERY_PER_TASK = 20;
  const TRAIN_RESET_TICKET_ID = 'trainResetTicket';
  const TRAIN_RESET_TICKET_ITEM_ID = FARM_ITEM_IDS.TRAIN_RESET_TICKET;
  const DAILY_TASK_POOL = Object.freeze([
    // Farm work — two slots are reserved for this category every day.
    Object.freeze({id:'dailyPlant5', category:'farm', family:'plant', title:'今日播种', desc:'今天播种 5 格农地。', metric:'plant', target:5, minLevel:1, reward:{coins:15}, rewardText:'金币 ×15'}),
    Object.freeze({id:'dailyPlant8', category:'farm', family:'plant', title:'播种不停手', desc:'今天播种 8 格农地。', metric:'plant', target:8, minLevel:4, reward:{coins:20}, rewardText:'金币 ×20'}),
    Object.freeze({id:'dailyPlant12', category:'farm', family:'plant', title:'满田新芽', desc:'今天播种 12 格农地。', metric:'plant', target:12, minLevel:10, reward:{exp:25}, rewardText:'EXP +25'}),
    Object.freeze({id:'dailyHarvest5', category:'farm', family:'harvest', title:'今日丰收', desc:'今天收成 5 格成熟作物。', metric:'harvest', target:5, minLevel:1, reward:{exp:20}, rewardText:'EXP +20'}),
    Object.freeze({id:'dailyHarvest8', category:'farm', family:'harvest', title:'收成好时光', desc:'今天收成 8 格成熟作物。', metric:'harvest', target:8, minLevel:4, reward:{exp:25}, rewardText:'EXP +25'}),
    Object.freeze({id:'dailyHarvest12', category:'farm', family:'harvest', title:'丰收一整轮', desc:'今天收成 12 格成熟作物。', metric:'harvest', target:12, minLevel:10, reward:{coins:25}, rewardText:'金币 ×25'}),
    Object.freeze({id:'dailyCarrotPlant3', category:'farm', family:'crop-carrot-plant', title:'红萝卜小田', desc:'今天种下 3 格红萝卜。', metric:'plantCrop', cropId:'carrot', target:3, minLevel:1, reward:{coins:12}, rewardText:'金币 ×12'}),
    Object.freeze({id:'dailyCarrotHarvest3', category:'farm', family:'crop-carrot-harvest', title:'红萝卜收成', desc:'今天收成 3 格红萝卜。', metric:'harvestCrop', cropId:'carrot', target:3, minLevel:1, reward:{exp:15}, rewardText:'EXP +15'}),
    Object.freeze({id:'dailyWheatPlant3', category:'farm', family:'crop-wheat-plant', title:'麦浪准备中', desc:'今天种下 3 格小麦。', metric:'plantCrop', cropId:'wheat', target:3, minLevel:2, reward:{coins:15}, rewardText:'金币 ×15'}),
    Object.freeze({id:'dailyWheatHarvest3', category:'farm', family:'crop-wheat-harvest', title:'收一篮小麦', desc:'今天收成 3 格小麦。', metric:'harvestCrop', cropId:'wheat', target:3, minLevel:2, reward:{exp:18}, rewardText:'EXP +18'}),
    Object.freeze({id:'dailyCornPlant3', category:'farm', family:'crop-corn-plant', title:'玉米苗圃', desc:'今天种下 3 格玉米。', metric:'plantCrop', cropId:'corn', target:3, minLevel:3, reward:{coins:18}, rewardText:'金币 ×18'}),
    Object.freeze({id:'dailyCornHarvest3', category:'farm', family:'crop-corn-harvest', title:'金黄玉米', desc:'今天收成 3 格玉米。', metric:'harvestCrop', cropId:'corn', target:3, minLevel:3, reward:{exp:20}, rewardText:'EXP +20'}),
    Object.freeze({id:'dailyTomatoPlant3', category:'farm', family:'crop-tomato-plant', title:'番茄小队', desc:'今天种下 3 格番茄。', metric:'plantCrop', cropId:'tomato', target:3, minLevel:5, reward:{coins:20}, rewardText:'金币 ×20'}),
    Object.freeze({id:'dailyFertilize1', category:'farm', family:'fertilize', title:'给作物加点营养', desc:'今天为 1 格成长中的作物使用肥料。', metric:'fertilize', target:1, minLevel:3, reward:{exp:15}, rewardText:'EXP +15'}),
    Object.freeze({id:'dailyMystery1', category:'farm', family:'mystery', title:'种下一个惊喜', desc:'今天种下 1 个蔬果盲盒。', metric:'mysteryPlant', target:1, minLevel:1, reward:{coins:12}, rewardText:'金币 ×12'}),

    // Social — only enters the plan when the player already has a real or NPC friend.
    Object.freeze({id:'dailyVisit2', category:'social', family:'visit', title:'串门子', desc:'今天拜访 2 位不同的农场好友。', metric:'visit', target:2, minLevel:1, requiresFriend:true, reward:{exp:15}, rewardText:'EXP +15'}),
    Object.freeze({id:'dailyVisit3', category:'social', family:'visit', title:'邻里走一圈', desc:'今天拜访 3 位不同的农场好友。', metric:'visit', target:3, minLevel:5, requiresFriend:true, reward:{exp:20}, rewardText:'EXP +20'}),
    Object.freeze({id:'dailyHelpWater2', category:'social', family:'help-water', title:'递上一壶水', desc:'今天帮农友助力浇水 2 格。', metric:'helpWater', target:2, minLevel:1, requiresFriend:true, reward:{coins:15}, rewardText:'金币 ×15'}),
    Object.freeze({id:'dailyHelpWater3', category:'social', family:'help-water', title:'甘霖互助', desc:'今天帮农友助力浇水 3 格。', metric:'helpWater', target:3, minLevel:4, requiresFriend:true, reward:{exp:20}, rewardText:'EXP +20'}),
    Object.freeze({id:'dailyHelpWater5', category:'social', family:'help-water', title:'热心浇灌', desc:'今天帮农友助力浇水 5 格。', metric:'helpWater', target:5, minLevel:10, requiresFriend:true, reward:{coins:25}, rewardText:'金币 ×25'}),
    Object.freeze({id:'dailySteal1', category:'social', family:'steal', title:'今天也偷一下', desc:'今天成功偷菜 1 次。', metric:'steal', target:1, minLevel:1, requiresFriend:true, reward:{coins:10}, rewardText:'金币 ×10'}),
    Object.freeze({id:'dailySteal2', category:'social', family:'steal', title:'夜行小手', desc:'今天成功偷菜 2 次。', metric:'steal', target:2, minLevel:8, requiresFriend:true, reward:{coins:18}, rewardText:'金币 ×18'}),
    Object.freeze({id:'dailyFriendCare3', category:'social', family:'friend-care', title:'农友互助', desc:'今天完成 3 格好友照料（助力浇水或帮忙除虫都算）。', metric:'friendCare', target:3, minLevel:3, requiresFriend:true, reward:{exp:20}, rewardText:'EXP +20'}),

    // Economy / station. Train quests enter after Lv.3 so a brand-new farm is not overloaded.
    Object.freeze({id:'dailySell10', category:'economy', family:'sell', title:'今日交易', desc:'今天出售 10 个农作物。', metric:'sell', target:10, minLevel:1, reward:{coins:20}, rewardText:'金币 ×20'}),
    Object.freeze({id:'dailySell20', category:'economy', family:'sell', title:'小小批发商', desc:'今天出售 20 个农作物。', metric:'sell', target:20, minLevel:5, reward:{coins:25}, rewardText:'金币 ×25'}),
    Object.freeze({id:'dailySell30', category:'economy', family:'sell', title:'农产交易日', desc:'今天出售 30 个农作物。', metric:'sell', target:30, minLevel:12, reward:{exp:25}, rewardText:'EXP +25'}),
    Object.freeze({id:'dailyTrainCar1', category:'train', family:'train-car', title:'装好一节车厢', desc:'今天完整装满 1 节火车车厢。', metric:'trainCars', target:1, minLevel:3, reward:{coins:20}, rewardText:'金币 ×20'}),
    Object.freeze({id:'dailyTrainCar2', category:'train', family:'train-car', title:'货运装箱', desc:'今天完整装满 2 节火车车厢。', metric:'trainCars', target:2, minLevel:5, reward:{coins:25}, rewardText:'金币 ×25'}),
    Object.freeze({id:'dailyTrainCar3', category:'train', family:'train-car', title:'月台装货手', desc:'今天完整装满 3 节火车车厢。', metric:'trainCars', target:3, minLevel:10, reward:{exp:30}, rewardText:'EXP +30'}),
    Object.freeze({id:'dailyTrainDepart1', category:'train', family:'train-depart', title:'送走一班列车', desc:'今天完成并发出 1 班星辰货运列车。', metric:'trainDepart', target:1, minLevel:5, reward:{coins:30}, rewardText:'金币 ×30'})
  ]);
  // Compatibility only: pending V0.17.1 full-attendance claims are still honored
  // during conflict replay, but V0.18.1 no longer renders this old bonus card.
  const DAILY_BONUS = { id:'dailyBonus', title:'今日农场全勤', desc:'完成今天全部 5 项每日任务。', reward:{seeds:{mystery:1}, exp:30}, rewardText:'蔬果盲盒 ×1 · EXP +30' };
  const DAILY_MASTERY_REWARDS = Object.freeze([
    Object.freeze({points:40, title:'今日熟练 I', reward:{coins:20}, rewardText:'金币 ×20'}),
    Object.freeze({points:80, title:'今日熟练 II', reward:{exp:30}, rewardText:'EXP +30'}),
    Object.freeze({points:100, title:'今日熟练 MAX', reward:{supplies:{[TRAIN_RESET_TICKET_ID]:1}}, rewardText:'火车重置券 ×1'})
  ]);
  const DAILY_SOCIAL_EXP_CAP = 50;
  const DAILY_SOCIAL_WATER_EXP = 5;
  const DAILY_SOCIAL_VISIT_EXP = 2;

  const TITLES = [
    {id:'newbie', name:'新手', icon:'🌱', desc:'刚踏进星辰农场时就拥有的第一枚称号。'},
    {id:'novice_farmer', name:'新手农夫', icon:'🥕', desc:'完成第一次成熟作物收成。'},
    {id:'farmer', name:'农夫', icon:'🌾', desc:'累计收成 10 格成熟作物。'},
    {id:'skilled_farmer', name:'熟练农夫', icon:'🧺', desc:'累计收成 50 格成熟作物。'},
    {id:'harvest_master', name:'丰收达人', icon:'🌻', desc:'累计收成 100 格成熟作物。'},
    {id:'farm_master', name:'农场达人', icon:'farm-expert', desc:'累计收成 500 格成熟作物。'},
    {id:'legendary_farmer', name:'传奇农夫', icon:'⭐', desc:'累计收成 1000 格成熟作物。'},
    {id:'harvest_grandmaster', name:'丰收宗师', icon:'🏆', desc:'累计收成 5000 格成熟作物。'},
    {id:'small_landlord', name:'小地主', icon:'🪙', desc:'农场曾经持有 1000 金币。'},
    {id:'ten_thousand', name:'万元户', icon:'💰', desc:'农场曾经持有 10000 金币。'},
    {id:'farm_tycoon', name:'农场富翁', icon:'👑', desc:'农场曾经持有 50000 金币。'},
    {id:'stellar_landlord', name:'星辰地主', icon:'✨', desc:'农场曾经持有 100000 金币。'},
    {id:'farm_magnate', name:'星辰大亨', icon:'👑', desc:'农场曾经持有 1000000 金币。'},
    {id:'sowing_hand', name:'播种好手', icon:'🌱', desc:'累计播种 100 格农地。'},
    {id:'sowing_master', name:'播种大师', icon:'🌿', desc:'累计播种 5000 格农地。'},
    {id:'blindbox_fan', name:'盲盒爱好者', icon:'🎁', desc:'累计种下 10 个蔬果盲盒。'},
    {id:'blindbox_master', name:'盲盒达人', icon:'🎀', desc:'累计种下 100 个蔬果盲盒。'},
    {id:'blindbox_collector', name:'盲盒收藏家', icon:'🎁', desc:'累计种下 500 个蔬果盲盒。'},
    {id:'steal_rookie', name:'路过摘一颗', icon:'🥷', desc:'第一次成功从好友农场偷到作物。'},
    {id:'steal_shadow', name:'神出鬼没', icon:'🌙', desc:'累计成功偷菜 10 次。'},
    {id:'steal_master', name:'偷菜高手', icon:'🕶️', desc:'累计成功偷菜 50 次。'},
    {id:'steal_legend', name:'夜行摘星客', icon:'🌙', desc:'累计成功偷菜 500 次。'},
    {id:'senior_farmer', name:'资深农夫', icon:'🌿', desc:'农场达到 Lv.10。'},
    {id:'stellar_host', name:'星辰农场主', icon:'🌟', desc:'农场达到 Lv.25。'},
    {id:'stellar_estate_owner', name:'星辰庄园主', icon:'🏡', desc:'农场达到 Lv.50。'},
    {id:'stellar_legend', name:'百级星辰庄主', icon:'🌟', desc:'农场达到 Lv.100。'},
    {id:'social_farmer', name:'农场社交家', icon:'🤝', desc:'拥有 20 位农场好友。'},
    {id:'popular_host', name:'人气农场主', icon:'🎉', desc:'拥有 50 位农场好友。'},
    {id:'visiting_star', name:'串门达人', icon:'👣', desc:'累计完成 200 次每日首次农友拜访。'},
    {id:'visiting_legend', name:'千家足迹', icon:'👣', desc:'累计完成 1000 次每日首次农友拜访。'},
    {id:'water_helper', name:'甘霖好手', icon:'💧', desc:'累计帮农友助力浇水 100 格。'},
    {id:'water_guardian', name:'甘霖使者', icon:'💧', desc:'累计帮农友助力浇水 500 格。'},
    {id:'water_legend', name:'星雨守望者', icon:'💧', desc:'累计帮农友助力浇水 2000 格。'},
    {id:'bug_guardian', name:'护田卫士', icon:'🪲', desc:'累计帮真人好友清除 100 格虫害。'},
    {id:'bug_legend', name:'虫害克星', icon:'🪲', desc:'累计帮真人好友清除 500 格虫害。'}
  ];

  const ACHIEVEMENT_GROUPS = [
    {id:'wealth', label:'财富之路', icon:'🪙'},
    {id:'harvest', label:'丰收之路', icon:'🧺'},
    {id:'plant', label:'播种之路', icon:'🌱'},
    {id:'blind', label:'盲盒之路', icon:'🎁'},
    {id:'steal', label:'偷菜之路', icon:'🥷'},
    {id:'growth', label:'成长之路', icon:'⭐'},
    {id:'social', label:'农友互助', icon:'🤝'}
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
    {id:'wealth500000', group:'wealth', title:'半百万家底', desc:'农场最高持有金币达到 500000。', metric:'maxCoins', target:500000, reward:{exp:800}, rewardText:'EXP +800'},
    {id:'wealth1000000', group:'wealth', title:'百万星辰农场', desc:'农场最高持有金币达到 1000000。', metric:'maxCoins', target:1000000, reward:{seeds:{mystery:20}, title:'farm_magnate'}, rewardText:'蔬果盲盒 ×20 · 称号【星辰大亨】'},

    {id:'harvestA1', group:'harvest', title:'第一次丰收', desc:'累计收成 1 格成熟作物。', metric:'harvest', target:1, reward:{seeds:{carrot:2}, title:'novice_farmer'}, rewardText:'红萝卜种子 ×2 · 称号【新手农夫】'},
    {id:'harvestA5', group:'harvest', title:'渐入佳境', desc:'累计收成 5 格成熟作物。', metric:'harvest', target:5, reward:{exp:15}, rewardText:'EXP +15'},
    {id:'harvestA10', group:'harvest', title:'熟悉农务', desc:'累计收成 10 格成熟作物。', metric:'harvest', target:10, reward:{seeds:{wheat:3}, title:'farmer'}, rewardText:'小麦种子 ×3 · 称号【农夫】'},
    {id:'harvestA25', group:'harvest', title:'小有成果', desc:'累计收成 25 格成熟作物。', metric:'harvest', target:25, reward:{exp:40}, rewardText:'EXP +40'},
    {id:'harvestA50', group:'harvest', title:'农田老手', desc:'累计收成 50 格成熟作物。', metric:'harvest', target:50, reward:{seeds:{mystery:2}, title:'skilled_farmer'}, rewardText:'蔬果盲盒 ×2 · 称号【熟练农夫】'},
    {id:'harvestA100', group:'harvest', title:'百次丰收', desc:'累计收成 100 格成熟作物。', metric:'harvest', target:100, reward:{exp:120, title:'harvest_master'}, rewardText:'EXP +120 · 称号【丰收达人】'},
    {id:'harvestA500', group:'harvest', title:'五百次收成', desc:'累计收成 500 格成熟作物。', metric:'harvest', target:500, reward:{seeds:{mystery:5}, title:'farm_master'}, rewardText:'蔬果盲盒 ×5 · 称号【农场达人】'},
    {id:'harvestA1000', group:'harvest', title:'千次丰收', desc:'累计收成 1000 格成熟作物。', metric:'harvest', target:1000, reward:{exp:500, title:'legendary_farmer'}, rewardText:'EXP +500 · 称号【传奇农夫】'},
    {id:'harvestA2500', group:'harvest', title:'两千五百次丰收', desc:'累计收成 2500 格成熟作物。', metric:'harvest', target:2500, reward:{seeds:{mystery:12}, exp:600}, rewardText:'蔬果盲盒 ×12 · EXP +600'},
    {id:'harvestA5000', group:'harvest', title:'五千次丰收', desc:'累计收成 5000 格成熟作物。', metric:'harvest', target:5000, reward:{seeds:{mystery:20}, exp:1000, title:'harvest_grandmaster'}, rewardText:'蔬果盲盒 ×20 · EXP +1000 · 称号【丰收宗师】'},

    {id:'plantA10', group:'plant', title:'十次播种', desc:'累计播种 10 格农地。', metric:'plant', target:10, reward:{seeds:{carrot:3}}, rewardText:'红萝卜种子 ×3'},
    {id:'plantA50', group:'plant', title:'田里总有新芽', desc:'累计播种 50 格农地。', metric:'plant', target:50, reward:{exp:50}, rewardText:'EXP +50'},
    {id:'plantA100', group:'plant', title:'百次播种', desc:'累计播种 100 格农地。', metric:'plant', target:100, reward:{seeds:{mystery:2}, title:'sowing_hand'}, rewardText:'蔬果盲盒 ×2 · 称号【播种好手】'},
    {id:'plantA500', group:'plant', title:'辛勤耕作', desc:'累计播种 500 格农地。', metric:'plant', target:500, reward:{exp:200}, rewardText:'EXP +200'},
    {id:'plantA1000', group:'plant', title:'千次播种', desc:'累计播种 1000 格农地。', metric:'plant', target:1000, reward:{seeds:{mystery:5}}, rewardText:'蔬果盲盒 ×5'},
    {id:'plantA2500', group:'plant', title:'两千五百次播种', desc:'累计播种 2500 格农地。', metric:'plant', target:2500, reward:{exp:500, seeds:{mystery:8}}, rewardText:'EXP +500 · 蔬果盲盒 ×8'},
    {id:'plantA5000', group:'plant', title:'五千次播种', desc:'累计播种 5000 格农地。', metric:'plant', target:5000, reward:{exp:900, seeds:{mystery:15}, title:'sowing_master'}, rewardText:'EXP +900 · 蔬果盲盒 ×15 · 称号【播种大师】'},

    {id:'blindA1', group:'blind', title:'第一次试手气', desc:'累计种下 1 个蔬果盲盒。', metric:'blindBoxPlant', target:1, reward:{exp:10}, rewardText:'EXP +10'},
    {id:'blindA10', group:'blind', title:'盲盒爱好者', desc:'累计种下 10 个蔬果盲盒。', metric:'blindBoxPlant', target:10, reward:{exp:50, title:'blindbox_fan'}, rewardText:'EXP +50 · 称号【盲盒爱好者】'},
    {id:'blindA50', group:'blind', title:'拆盒不停手', desc:'累计种下 50 个蔬果盲盒。', metric:'blindBoxPlant', target:50, reward:{seeds:{mystery:5}}, rewardText:'蔬果盲盒 ×5'},
    {id:'blindA100', group:'blind', title:'百盒收藏', desc:'累计种下 100 个蔬果盲盒。', metric:'blindBoxPlant', target:100, reward:{exp:250, title:'blindbox_master'}, rewardText:'EXP +250 · 称号【盲盒达人】'},
    {id:'blindA250', group:'blind', title:'盲盒仓库', desc:'累计种下 250 个蔬果盲盒。', metric:'blindBoxPlant', target:250, reward:{exp:450, seeds:{mystery:8}}, rewardText:'EXP +450 · 蔬果盲盒 ×8'},
    {id:'blindA500', group:'blind', title:'五百盒收藏', desc:'累计种下 500 个蔬果盲盒。', metric:'blindBoxPlant', target:500, reward:{exp:800, title:'blindbox_collector'}, rewardText:'EXP +800 · 称号【盲盒收藏家】'},

    {id:'stealA1', group:'steal', title:'路过摘一颗', desc:'累计成功偷菜 1 次。', metric:'steals', target:1, reward:{exp:10, title:'steal_rookie'}, rewardText:'EXP +10 · 称号【路过摘一颗】'},
    {id:'stealA10', group:'steal', title:'神出鬼没', desc:'累计成功偷菜 10 次。', metric:'steals', target:10, reward:{exp:50, title:'steal_shadow'}, rewardText:'EXP +50 · 称号【神出鬼没】'},
    {id:'stealA50', group:'steal', title:'偷菜高手', desc:'累计成功偷菜 50 次。', metric:'steals', target:50, reward:{seeds:{mystery:3}, title:'steal_master'}, rewardText:'蔬果盲盒 ×3 · 称号【偷菜高手】'},
    {id:'stealA100', group:'steal', title:'来无影去无踪', desc:'累计成功偷菜 100 次。', metric:'steals', target:100, reward:{exp:200}, rewardText:'EXP +200'},
    {id:'stealA250', group:'steal', title:'夜色熟客', desc:'累计成功偷菜 250 次。', metric:'steals', target:250, reward:{exp:400, seeds:{mystery:6}}, rewardText:'EXP +400 · 蔬果盲盒 ×6'},
    {id:'stealA500', group:'steal', title:'摘星无痕', desc:'累计成功偷菜 500 次。', metric:'steals', target:500, reward:{exp:700, title:'steal_legend'}, rewardText:'EXP +700 · 称号【夜行摘星客】'},

    {id:'level5', group:'growth', title:'农场渐渐成形', desc:'农场达到 Lv.5。', metric:'level', target:5, reward:{seeds:{mystery:1}}, rewardText:'蔬果盲盒 ×1'},
    {id:'level10', group:'growth', title:'十级农场', desc:'农场达到 Lv.10。', metric:'level', target:10, reward:{exp:80, title:'senior_farmer'}, rewardText:'EXP +80 · 称号【资深农夫】'},
    {id:'level20', group:'growth', title:'成熟农场', desc:'农场达到 Lv.20。', metric:'level', target:20, reward:{seeds:{mystery:5}}, rewardText:'蔬果盲盒 ×5'},
    {id:'level25', group:'growth', title:'完整星辰农场', desc:'农场达到 Lv.25，并解锁完整 20 格农地。', metric:'level', target:25, reward:{exp:300, title:'stellar_host'}, rewardText:'EXP +300 · 称号【星辰农场主】'},
    {id:'level50', group:'growth', title:'五十级庄园', desc:'农场达到 Lv.50。', metric:'level', target:50, reward:{exp:700, seeds:{mystery:10}, title:'stellar_estate_owner'}, rewardText:'EXP +700 · 蔬果盲盒 ×10 · 称号【星辰庄园主】'},
    {id:'level100', group:'growth', title:'百级长青农场', desc:'农场达到 Lv.100。', metric:'level', target:100, reward:{exp:1500, seeds:{mystery:20}, title:'stellar_legend'}, rewardText:'EXP +1500 · 蔬果盲盒 ×20 · 称号【百级星辰庄主】'},

    {id:'friend20', group:'social', title:'农场社交家', desc:'好友达到 20 人。', metric:'friend', target:20, reward:{seeds:{mystery:3}, title:'social_farmer'}, rewardText:'蔬果盲盒 ×3 · 称号【农场社交家】'},
    {id:'friend50', group:'social', title:'人气农场', desc:'好友达到 50 人。', metric:'friend', target:50, reward:{exp:300, title:'popular_host'}, rewardText:'EXP +300 · 称号【人气农场主】'},
    {id:'visitA10', group:'social', title:'常去串门', desc:'累计完成 10 次每日首次农友拜访。', metric:'friendVisits', target:10, reward:{exp:40}, rewardText:'EXP +40'},
    {id:'visitA50', group:'social', title:'熟门熟路', desc:'累计完成 50 次每日首次农友拜访。', metric:'friendVisits', target:50, reward:{exp:120, seeds:{mystery:2}}, rewardText:'EXP +120 · 蔬果盲盒 ×2'},
    {id:'visitA200', group:'social', title:'串门达人', desc:'累计完成 200 次每日首次农友拜访。', metric:'friendVisits', target:200, reward:{exp:350, title:'visiting_star'}, rewardText:'EXP +350 · 称号【串门达人】'},
    {id:'visitA1000', group:'social', title:'千次农友足迹', desc:'累计完成 1000 次每日首次农友拜访。', metric:'friendVisits', target:1000, reward:{exp:1000, seeds:{mystery:12}, title:'visiting_legend'}, rewardText:'EXP +1000 · 蔬果盲盒 ×12 · 称号【千家足迹】'},
    {id:'waterA10', group:'social', title:'递上一壶水', desc:'累计帮农友助力浇水 10 格。', metric:'helpWater', target:10, reward:{exp:50}, rewardText:'EXP +50'},
    {id:'waterA50', group:'social', title:'邻里甘霖', desc:'累计帮农友助力浇水 50 格。', metric:'helpWater', target:50, reward:{exp:120, seeds:{mystery:2}}, rewardText:'EXP +120 · 蔬果盲盒 ×2'},
    {id:'waterA100', group:'social', title:'百格助力', desc:'累计帮农友助力浇水 100 格。', metric:'helpWater', target:100, reward:{exp:250, title:'water_helper'}, rewardText:'EXP +250 · 称号【甘霖好手】'},
    {id:'waterA500', group:'social', title:'五百格甘霖', desc:'累计帮农友助力浇水 500 格。', metric:'helpWater', target:500, reward:{exp:600, seeds:{mystery:8}, title:'water_guardian'}, rewardText:'EXP +600 · 蔬果盲盒 ×8 · 称号【甘霖使者】'},
    {id:'waterA2000', group:'social', title:'两千格守望', desc:'累计帮农友助力浇水 2000 格。', metric:'helpWater', target:2000, reward:{exp:1500, seeds:{mystery:20}, title:'water_legend'}, rewardText:'EXP +1500 · 蔬果盲盒 ×20 · 称号【星雨守望者】'},
    {id:'bugA10', group:'social', title:'热心除虫', desc:'累计帮真人好友清除 10 格虫害。', metric:'helpBug', target:10, reward:{exp:60}, rewardText:'EXP +60'},
    {id:'bugA50', group:'social', title:'护田邻里', desc:'累计帮真人好友清除 50 格虫害。', metric:'helpBug', target:50, reward:{exp:180, seeds:{mystery:3}}, rewardText:'EXP +180 · 蔬果盲盒 ×3'},
    {id:'bugA100', group:'social', title:'百格护田', desc:'累计帮真人好友清除 100 格虫害。', metric:'helpBug', target:100, reward:{exp:320, title:'bug_guardian'}, rewardText:'EXP +320 · 称号【护田卫士】'},
    {id:'bugA500', group:'social', title:'虫害克星', desc:'累计帮真人好友清除 500 格虫害。', metric:'helpBug', target:500, reward:{exp:900, seeds:{mystery:10}, title:'bug_legend'}, rewardText:'EXP +900 · 蔬果盲盒 ×10 · 称号【虫害克星】'}
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
  let npcRuntimeCheckedAt = 0;
  let farmDay = localFarmDay();
  let farmEventSlotKey = localFarmEventSlot().key;
  let farmDaySyncAt = 0;
  let activeTaskTab = 'daily';
  let activeAchievementGroup = 'wealth';
  let activeFriendTab = 'activity';
  let activeActivityDirection = 'received';
  let activeShopTab = 'seeds';
  let activeCharacterTab = 'avatar';
  // Ephemeral wardrobe/pet previews. Never saved or synced; the farm scene keeps the equipped look/follower.
  let previewOutfitId = '';
  let previewPetId = '';
  // V0.17.2.1 — friend farm patrol UX. Keep the list position and current
  // visit locally; no extra Supabase table/read is needed for navigation.
  let friendListScrollTop = 0;
  let friendListFocusId = '';
  let friendListFocusNpc = false;
  let friendListRestorePending = false;
  let currentPatrolId = '';
  let currentPatrolNpc = false;
  let friendPatrolBusy = false;
  let decorationMode = false;
  let levelUpQueue = [];
  let levelUpPlaying = false;
  // Persist the horizontal achievement-category position across rerenders.
  // On iOS, tapping a category rebuilds the task panel; without this value the
  // newly-created scroller starts at scrollLeft=0 and looks like it snaps back
  // to the first category even though the selected category changed correctly.
  let achievementGroupScrollLeft = 0;

  const $ = (id) => document.getElementById(id);
  function avatarOutfitById(id) { return AVATAR_OUTFITS.find(item => item.id === id) || AVATAR_OUTFITS[0]; }
  function outfitOwned(id) {
    if (id === 'default') return true;
    return state.wardrobe?.outfits?.[id] === true;
  }
  function outfitSupportsGender(outfit, gender) {
    if (!outfit) return false;
    return gender === 'female' ? Boolean(outfit.female && outfit.femaleAsset) : Boolean(outfit.male && outfit.maleAsset);
  }
  function renderedAvatarGender(outfitId = state.avatar?.outfit || 'default') {
    const requested = AVATAR_GENDERS.includes(state.avatar?.gender) ? state.avatar.gender : 'male';
    const outfit = avatarOutfitById(outfitId);
    if (requested === 'female' && !outfitSupportsGender(outfit,'female') && outfitSupportsGender(outfit,'male')) return 'male';
    if (requested === 'male' && !outfitSupportsGender(outfit,'male') && outfitSupportsGender(outfit,'female')) return 'female';
    return requested;
  }
  function avatarSpriteAsset(outfitId = state.avatar?.outfit || 'default', gender = renderedAvatarGender(outfitId)) {
    const outfit = avatarOutfitById(outfitId);
    const asset = gender === 'female' ? outfit.femaleAsset : outfit.maleAsset;
    if (asset) return asset;
    const fallback = AVATAR_OUTFITS[0];
    return gender === 'female' ? fallback.femaleAsset : fallback.maleAsset;
  }
  function avatarSpriteUrl(outfitId = state.avatar?.outfit || 'default', gender = renderedAvatarGender(outfitId)) {
    return `../images/farm/avatar/${avatarSpriteAsset(outfitId,gender)}?v=${FARM_BUILD}`;
  }
  function avatarSpriteFrameCount(outfitId = state.avatar?.outfit || 'default', gender = renderedAvatarGender(outfitId)) {
    const outfit = avatarOutfitById(outfitId);
    const raw = gender === 'female' ? outfit.femaleFrames : outfit.maleFrames;
    return Number(raw) === 6 ? 6 : 8;
  }
  function avatarSpriteMarkup(extraClass = '', label = '', outfitId = state.avatar?.outfit || 'default') {
    const outfit = avatarOutfitById(outfitId);
    const gender = renderedAvatarGender(outfit.id);
    return `<span class="farm-avatar-sprite ${extraClass}" data-avatar-gender="${gender}" data-avatar-outfit="${escapeHtml(outfit.id)}" data-avatar-frames="${avatarSpriteFrameCount(outfit.id,gender)}" style="--avatar-sprite-image:url('${avatarSpriteUrl(outfit.id,gender)}')" ${label ? `role="img" aria-label="${escapeHtml(label)}"` : 'aria-hidden="true"'}></span>`;
  }
  function avatarSpriteMarkupFor(gender = 'male', outfitId = 'default', extraClass = '', label = '') {
    const outfit = avatarOutfitById(outfitId);
    const requested = gender === 'female' ? 'female' : 'male';
    const resolved = outfitSupportsGender(outfit, requested)
      ? requested
      : (outfitSupportsGender(outfit, requested === 'female' ? 'male' : 'female') ? (requested === 'female' ? 'male' : 'female') : 'male');
    return `<span class="farm-avatar-sprite ${extraClass}" data-avatar-gender="${resolved}" data-avatar-outfit="${escapeHtml(outfit.id)}" data-avatar-frames="${avatarSpriteFrameCount(outfit.id,resolved)}" style="--avatar-sprite-image:url('${avatarSpriteUrl(outfit.id,resolved)}')" ${label ? `role="img" aria-label="${escapeHtml(label)}"` : 'aria-hidden="true"'}></span>`;
  }
  function previewableOutfitId() {
    const requestedGender = AVATAR_GENDERS.includes(state.avatar?.gender) ? state.avatar.gender : 'male';
    const preview = previewOutfitId ? avatarOutfitById(previewOutfitId) : null;
    if (preview && preview.id === previewOutfitId && preview.released && outfitSupportsGender(preview, requestedGender)) return preview.id;
    return state.avatar?.outfit || 'default';
  }
  function outfitCardMarkup(outfit) {
    const active = state.avatar?.outfit === outfit.id;
    const owned = outfitOwned(outfit.id);
    const requestedGender = AVATAR_GENDERS.includes(state.avatar?.gender) ? state.avatar.gender : 'male';
    const ready = Boolean(outfit.released && outfitSupportsGender(outfit,requestedGender));
    const previewing = ready && previewOutfitId === outfit.id && !active;
    const visual = ready
      ? `<span class="farm-outfit-thumb">${avatarSpriteMarkup('is-outfit-thumb','',outfit.id)}</span>`
      : `<span class="farm-outfit-placeholder-art" aria-hidden="true">${outfit.icon || '👕'}</span>`;
    const note = outfit.id === 'default'
      ? '基础造型 · 永久拥有'
      : ready
        ? (owned ? '节日限定 · 已拥有' : (previewing ? '节日限定 · 未拥有 · 预览中' : '节日限定 · 未拥有'))
        : '节日限定 · 尚未开放';
    const previewingAnother = Boolean(previewOutfitId && previewOutfitId !== outfit.id);
    const action = active
      ? (previewingAnother
          ? `<button type="button" class="farm-outfit-apply is-current" data-preview-outfit="${escapeHtml(outfit.id)}">返回当前</button>`
          : `<button type="button" class="farm-outfit-apply is-current" disabled>✓ 使用中</button>`)
      : ready && owned
        ? `<button type="button" class="farm-outfit-apply" data-apply-outfit="${escapeHtml(outfit.id)}">套用</button>`
        : ready
          ? (previewing
              ? `<button type="button" class="farm-outfit-apply is-preview" disabled>👁 预览中</button>`
              : `<button type="button" class="farm-outfit-apply is-preview" data-preview-outfit="${escapeHtml(outfit.id)}">预览</button>`)
          : `<button type="button" class="farm-outfit-apply is-locked" disabled>尚未开放</button>`;
    return `<article class="farm-outfit-card ${active ? 'is-active' : ''} ${previewing ? 'is-previewing' : ''} ${owned ? 'is-owned' : 'is-locked'} ${ready ? '' : 'is-coming-soon'}">${visual}<span class="farm-outfit-copy"><b>${escapeHtml(outfit.name)}</b><small>${escapeHtml(note)}</small></span>${action}</article>`;
  }
  function petById(id) { return PETS.find(item => item.id === id) || null; }
  function petOwned(id) { return state.pets?.owned?.[id] === true; }
  function activePet() {
    const pet = petById(state.pets?.active || '');
    return pet && pet.released && petOwned(pet.id) ? pet : null;
  }
  function petSpriteUrl(petId='ya_ya') {
    const pet = petById(petId) || PETS[0];
    return `../images/farm/pet/${pet.asset}?v=${FARM_BUILD}`;
  }
  function petSpriteMarkup(extraClass='', label='', petId='ya_ya') {
    const pet = petById(petId) || PETS[0];
    return `<span class="farm-pet-sprite ${extraClass}" data-pet-id="${escapeHtml(pet.id)}" data-pet-frames="${Number(pet.frames) || 6}" style="--pet-sprite-image:url('${petSpriteUrl(pet.id)}')" ${label ? `role="img" aria-label="${escapeHtml(label)}"` : 'aria-hidden="true"'}></span>`;
  }
  function previewablePet() {
    const preview = previewPetId ? petById(previewPetId) : null;
    if (preview && preview.released) return preview;
    return activePet() || PETS.find(item => item.released) || null;
  }
  function petCardMarkup(pet) {
    const active = state.pets?.active === pet.id && petOwned(pet.id);
    const owned = petOwned(pet.id);
    const ready = Boolean(pet.released);
    const previewing = ready && previewPetId === pet.id && !active;
    const visual = ready
      ? `<span class="farm-pet-thumb">${petSpriteMarkup('is-pet-thumb','',pet.id)}</span>`
      : '<span class="farm-pet-placeholder-art" aria-hidden="true">🥚</span>';
    const note = ready ? (active ? '目前跟随 · 已拥有' : owned ? '永久收藏 · 已拥有' : (previewing ? '永久宠物 · 未拥有 · 预览中' : '永久宠物 · 未拥有')) : '尚未开放';
    const previewingAnother = Boolean(previewPetId && previewPetId !== pet.id);
    const action = active
      ? (previewingAnother
          ? `<button type="button" class="farm-pet-action is-current" data-preview-pet="${escapeHtml(pet.id)}">返回当前</button>`
          : `<button type="button" class="farm-pet-action is-current" data-unfollow-pet="${escapeHtml(pet.id)}">取消跟随</button>`)
      : ready && owned
        ? `<button type="button" class="farm-pet-action" data-follow-pet="${escapeHtml(pet.id)}">跟随</button>`
        : ready
          ? (previewing
              ? '<button type="button" class="farm-pet-action is-preview" disabled>👁 预览中</button>'
              : `<button type="button" class="farm-pet-action is-preview" data-preview-pet="${escapeHtml(pet.id)}">预览</button>`)
          : '<button type="button" class="farm-pet-action is-locked" disabled>尚未开放</button>';
    return `<article class="farm-pet-card ${active ? 'is-active' : ''} ${previewing ? 'is-previewing' : ''} ${owned ? 'is-owned' : 'is-locked'}">${visual}<span class="farm-pet-copy"><b>${escapeHtml(pet.name)}</b><small>${escapeHtml(note)}</small></span>${action}</article>`;
  }

  function cropById(id) { return id === MYSTERY_CROP.id ? MYSTERY_CROP : CROPS.find(c => c.id === id); }
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

  function atlasPosition(cell, atlas) {
    const count = atlas.cols * atlas.rows;
    const index = Math.max(0, Math.min(count - 1, Number(cell || 1) - 1));
    const col = index % atlas.cols;
    const row = Math.floor(index / atlas.cols);
    return {x:col * (100 / (atlas.cols - 1)), y:row * (100 / (atlas.rows - 1))};
  }

  function catalogSpriteMarkup(cell, extraClass = '', label = '') {
    const pos = atlasPosition(cell, CATALOG_ATLAS);
    return `<span class="farm-catalog-sprite ${extraClass}" aria-hidden="true"${label ? ` title="${escapeHtml(label)}"` : ''} style="--catalog-x:${pos.x}%;--catalog-y:${pos.y}%"></span>`;
  }

  function seasonalDecorSpriteMarkup(cell, extraClass = '', label = '', scale = 1) {
    const pos = atlasPosition(cell, SEASONAL_DECOR_ATLAS);
    return `<span class="farm-seasonal-decor-sprite ${extraClass}" aria-hidden="true"${label ? ` title="${escapeHtml(label)}"` : ''} style="--seasonal-decor-x:${pos.x}%;--seasonal-decor-y:${pos.y}%;--decor-scale:${Number(scale) || 1}"></span>`;
  }

  function decorationIconMarkup(item, extraClass = '', label = '') {
    if (!item) return '';
    if (item.itemIconCell) return catalogSpriteMarkup(item.itemIconCell, extraClass, label || item.name);
    return eventSpriteMarkup(item.eventCell, extraClass, label || item.name);
  }


  const decorationById = (id) => DECORATIONS.find(item => item.id === id) || null;
  function placedDecorationCount(id, decorations = state?.decorations) {
    return Array.isArray(decorations?.slots) ? decorations.slots.filter(slotId => slotId === id).length : 0;
  }
  function availableDecorationCount(id) {
    const owned = Math.max(0, Number(state?.decorations?.owned?.[id]) || 0);
    return Math.max(0, owned - placedDecorationCount(id));
  }
  function decorationSceneMarkup(item, {friendName='', titleId='newbie'} = {}) {
    if (!item) return '';
    const signCopy = item.id === 'sign'
      ? `<span class="farm-decor-sign-copy"><b>${escapeHtml(friendName || (window.XingchenPlayer?.getProfile?.()?.name || '我的'))}的农场</b><small>${uiIconMarkup(titleUiIconKey(titleById(titleId || state?.titles?.equipped || 'newbie').id),'is-sign-title-ui')}【${escapeHtml(titleById(titleId || state?.titles?.equipped || 'newbie').name)}】</small></span>`
      : '';
    if (item.decorCell) return `${seasonalDecorSpriteMarkup(item.decorCell,'farm-decoration-art',item.name,item.scale)}${signCopy}`;
    const pos = eventSpritePosition(item.eventCell);
    return `<span class="farm-decoration-art farm-event-sprite" aria-hidden="true" style="--event-x:${pos.x}%;--event-y:${pos.y}%;--decor-scale:${Number(item.scale) || 1}"></span>${signCopy}`;
  }

  function stableHash(value='') {
    let h=2166136261;
    for (const ch of String(value)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function trainHash(day, salt='', seedCreatedAt=0) {
    return stableHash(`train:${day}:${Number(seedCreatedAt) || 0}:${salt}`);
  }

  function trainMultiplierFor(day, token='', seedCreatedAt=0) {
    const total = TRAIN_MULTIPLIERS.reduce((sum,item) => sum + item.weight, 0);
    let roll = trainHash(day, `${token}:multiplier`, seedCreatedAt) % total;
    for (const item of TRAIN_MULTIPLIERS) {
      roll -= item.weight;
      if (roll < 0) return item;
    }
    return TRAIN_MULTIPLIERS[0];
  }

  function trainQuantityFor(crop, day, carIndex, token='', seedCreatedAt=0) {
    const range = TRAIN_QTY_RANGES[crop.id] || [4,8];
    const span = Math.max(1, range[1] - range[0] + 1);
    return range[0] + (trainHash(day, `${token}:qty:${carIndex}:${crop.id}`, seedCreatedAt) % span);
  }

  function trainCooldownMs(train) {
    const halfHours = 8 + (stableHash(`cooldown:${train?.id || ''}`) % 5); // 4h, 4.5h ... 6h
    return halfHours * 30 * 60 * 1000;
  }

  function createTrainManifest(day = farmDay || localFarmDay(), slotIndex=0, generation=0, context={}) {
    const safeDay = /^\d{4}-\d{2}-\d{2}$/.test(String(day)) ? String(day) : localFarmDay();
    const token = `slot:${slotIndex}:gen:${generation}`;
    const level = Math.max(1, Number(context.level) || 1);
    const seedCreatedAt = Math.max(0, Number(context.createdAt) || 0);
    const unlocked = CROPS.filter(crop => level >= crop.unlockLevel && !crop.isMystery);
    const pool = unlocked.length ? unlocked : [CROPS[0]];
    const carCount = (trainHash(safeDay, `${token}:cars`, seedCreatedAt) % 100) < 42 ? 5 : 4;
    const multiplier = trainMultiplierFor(safeDay, token, seedCreatedAt);
    const used = new Set();
    const cars = [];
    for (let i = 0; i < carCount; i += 1) {
      let pick = trainHash(safeDay, `${token}:crop:${i}`, seedCreatedAt) % pool.length;
      if (pool.length >= carCount) {
        for (let n = 0; n < pool.length && used.has(pool[pick].id); n += 1) pick = (pick + 1) % pool.length;
      }
      const crop = pool[pick];
      used.add(crop.id);
      cars.push({
        cropId:crop.id,
        required:trainQuantityFor(crop, safeDay, i, token, seedCreatedAt),
        loaded:0,
        style:TRAIN_CAR_ASSETS[i % TRAIN_CAR_ASSETS.length]
      });
    }
    return {
      id:`${safeDay}:${slotIndex}:${generation}`,
      date:safeDay,
      slotIndex:Number(slotIndex) || 0,
      generation:Math.max(0, Number(generation) || 0),
      levelSnapshot:level,
      multiplier:multiplier.value,
      tier:multiplier.tier,
      cars,
      departed:false,
      departedAt:0,
      appliedOps:[]
    };
  }

  function createTrainState(day = farmDay || localFarmDay(), context={}) {
    const safeDay = /^\d{4}-\d{2}-\d{2}$/.test(String(day)) ? String(day) : localFarmDay();
    return {
      date:safeDay,
      bonusGenerated:0,
      appliedOps:[],
      slots:Array.from({length:TRAIN_SLOT_COUNT}, (_, index) => ({
        index,
        generation:0,
        status:'ready',
        availableAt:0,
        train:createTrainManifest(safeDay, index, 0, context)
      }))
    };
  }

  function normalizeTrainManifest(rawTrain, slotIndex=0, generation=0, day=localFarmDay()) {
    if (!rawTrain || typeof rawTrain !== 'object') return null;
    const safeDay = /^\d{4}-\d{2}-\d{2}$/.test(String(rawTrain.date || day)) ? String(rawTrain.date || day) : day;
    const cars = Array.isArray(rawTrain.cars) ? rawTrain.cars.map((car,index) => {
      const crop = cropById(car?.cropId);
      if (!crop || crop.isMystery) return null;
      const required = Math.max(1, Math.floor(Number(car.required) || 1));
      return {
        cropId:crop.id,
        required,
        loaded:Math.max(0, Math.min(required, Math.floor(Number(car.loaded) || 0))),
        style:TRAIN_CAR_ASSETS.includes(car.style) ? car.style : TRAIN_CAR_ASSETS[index % TRAIN_CAR_ASSETS.length]
      };
    }).filter(Boolean).slice(0,5) : [];
    if (cars.length < 4) return null;
    const multiplier = [1.1,1.2,1.3,1.4,1.5,2].includes(Number(rawTrain.multiplier)) ? Number(rawTrain.multiplier) : 1.1;
    const gen = Math.max(0, Number(rawTrain.generation ?? generation) || 0);
    return {
      id:String(rawTrain.id || `${safeDay}:${slotIndex}:${gen}`),
      date:safeDay,
      slotIndex:Number(rawTrain.slotIndex ?? slotIndex) || 0,
      generation:gen,
      levelSnapshot:Math.max(1, Number(rawTrain.levelSnapshot) || 1),
      multiplier,
      tier:multiplier >= 2 ? 'gold' : multiplier >= 1.5 ? 'red' : 'normal',
      cars,
      departed:Boolean(rawTrain.departed),
      departedAt:Math.max(0, Number(rawTrain.departedAt) || 0),
      appliedOps:Array.isArray(rawTrain.appliedOps) ? [...new Set(rawTrain.appliedOps.filter(Boolean).map(String))].slice(-TRAIN_APPLIED_OP_LIMIT) : []
    };
  }

  function normalizeTrainState(rawTrain, day = localFarmDay(), context={}) {
    if (!rawTrain || typeof rawTrain !== 'object') return null;
    // V0.14.4 migration: a single legacy train becomes platform 1; platform 2 is
    // freshly generated. If the old train had already departed, preserve its
    // return cooldown instead of granting an immediate duplicate reward train.
    if (!Array.isArray(rawTrain.slots) && Array.isArray(rawTrain.cars)) {
      const legacy = normalizeTrainManifest(rawTrain, 0, 0, String(rawTrain.date || day));
      if (!legacy) return null;
      const hub = createTrainState(legacy.date, context);
      hub.slots[0].train = legacy;
      if (legacy.departed) {
        hub.slots[0].status = 'cooldown';
        hub.slots[0].availableAt = legacy.departedAt + trainCooldownMs(legacy);
      }
      return hub;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(rawTrain.date || ''))) return null;
    const safeDay = String(rawTrain.date);
    const hub = {
      date:safeDay,
      bonusGenerated:Math.max(0, Math.min(TRAIN_DAILY_BONUS_CAP, Math.floor(Number(rawTrain.bonusGenerated) || 0))),
      appliedOps:Array.isArray(rawTrain.appliedOps) ? [...new Set(rawTrain.appliedOps.filter(Boolean).map(String))].slice(-TRAIN_APPLIED_OP_LIMIT) : [],
      slots:[]
    };
    for (let index=0; index<TRAIN_SLOT_COUNT; index += 1) {
      const rawSlot = rawTrain.slots[index];
      if (!rawSlot || typeof rawSlot !== 'object') {
        hub.slots.push({index,generation:0,status:'ready',availableAt:0,train:createTrainManifest(safeDay,index,0,context)});
        continue;
      }
      const generation = Math.max(0, Math.floor(Number(rawSlot.generation) || 0));
      const status = ['ready','cooldown','done'].includes(rawSlot.status) ? rawSlot.status : 'ready';
      const train = normalizeTrainManifest(rawSlot.train, index, generation, safeDay) || createTrainManifest(safeDay,index,generation,context);
      hub.slots.push({
        index,
        generation,
        status,
        availableAt:Math.max(0, Number(rawSlot.availableAt) || 0),
        train
      });
    }
    return hub;
  }

  function refundTrainCargo(hub) {
    if (!hub?.slots) return;
    hub.slots.forEach(slot => {
      if (slot?.status !== 'ready' || !slot.train || slot.train.departed) return;
      slot.train.cars.forEach(car => {
        const crop = cropById(car?.cropId);
        const loaded = Math.max(0, Math.floor(Number(car?.loaded) || 0));
        if (crop && loaded) state.produce[crop.id] = (state.produce[crop.id] || 0) + loaded;
      });
    });
  }


  function trainCargoSignature(train) {
    return (train?.cars || []).map(car => `${car.cropId}:${Number(car.required) || 0}`).join('|');
  }

  function trainManifestSignature(train) {
    return `${Number(train?.multiplier) || 0}|${trainCargoSignature(train)}`;
  }

  function refundSingleTrainCargo(train) {
    let count = 0;
    (train?.cars || []).forEach(car => {
      const crop = cropById(car?.cropId);
      const loaded = Math.max(0, Math.floor(Number(car?.loaded) || 0));
      if (!crop || loaded <= 0) return;
      state.produce[crop.id] = Math.max(0, Number(state.produce[crop.id]) || 0) + loaded;
      count += loaded;
    });
    return count;
  }

  function createTrainRerollPlan(slot, hub = ensureTrainState()) {
    if (!slot || slot.status !== 'ready' || !slot.train || slot.train.departed) return null;
    const oldSignature = trainManifestSignature(slot.train);
    const oldCargoSignature = trainCargoSignature(slot.train);
    const oldMultiplier = Number(slot.train.multiplier) || 0;
    let generation = Math.max(0, Number(slot.generation) || 0) + 1;
    let replacement = null;
    let fallback = null;
    // Prefer an order where BOTH the multiplier and cargo manifest change. At
    // very low levels the crop pool is intentionally small, so keep a safe
    // fallback that still guarantees the overall order is different.
    for (let attempt = 0; attempt < 36; attempt += 1, generation += 1) {
      const candidate = createTrainManifest(hub.date, slot.index, generation, {level:state.level, createdAt:state.createdAt});
      if (trainManifestSignature(candidate) === oldSignature) continue;
      if (!fallback) fallback = candidate;
      if ((Number(candidate.multiplier) || 0) !== oldMultiplier && trainCargoSignature(candidate) !== oldCargoSignature) {
        replacement = candidate;
        break;
      }
    }
    replacement ||= fallback;
    if (!replacement) return null;
    return {generation:Math.max(0, Number(replacement.generation) || 0), replacement};
  }

  function refreshTrainSlots(hub, now=Date.now(), context={}) {
    if (!hub?.slots) return false;
    let changed = false;
    for (const slot of hub.slots) {
      if (slot.status !== 'cooldown' || !slot.availableAt || slot.availableAt > now) continue;
      if (hub.bonusGenerated >= TRAIN_DAILY_BONUS_CAP) {
        slot.status = 'done';
        slot.availableAt = 0;
        changed = true;
        continue;
      }
      slot.generation = Math.max(0, Number(slot.generation) || 0) + 1;
      slot.train = createTrainManifest(hub.date, slot.index, slot.generation, context);
      slot.status = 'ready';
      slot.availableAt = 0;
      hub.bonusGenerated += 1;
      changed = true;
    }
    return changed;
  }

  function ensureTrainState(day = farmDay || localFarmDay(), {persist=false} = {}) {
    const safeDay = /^\d{4}-\d{2}-\d{2}$/.test(String(day)) ? String(day) : localFarmDay();
    let changed = false;
    if (!state.train || state.train.date !== safeDay || !Array.isArray(state.train.slots)) {
      if (state.train && state.train.date !== safeDay) refundTrainCargo(state.train);
      state.train = createTrainState(safeDay, {level:state.level, createdAt:state.createdAt});
      changed = true;
    }
    if (refreshTrainSlots(state.train, Date.now(), {level:state.level, createdAt:state.createdAt})) changed = true;
    if (persist && changed) saveState();
    return state.train;
  }

  function trainSlot(slotIndex, hub=ensureTrainState()) {
    return hub?.slots?.find(slot => Number(slot.index) === Number(slotIndex)) || null;
  }

  function trainReward(train) {
    const baseValue = (train?.cars || []).reduce((sum, car) => {
      const crop = cropById(car.cropId);
      return sum + ((crop?.sellPrice || 0) * Math.max(0, Number(car.required) || 0));
    }, 0);
    const baseCoins = Math.max(1, Math.round(baseValue * TRAIN_BASE_PRICE_FACTOR));
    const coins = Math.max(1, Math.round(baseCoins * (Number(train?.multiplier) || 1.1)));
    const expSeed = (train?.cars || []).reduce((sum, car) => {
      const crop = cropById(car.cropId);
      return sum + Math.max(0, Number(crop?.exp) || 0) * Math.max(1, Number(car.required) || 1);
    }, 0);
    const exp = Math.max(20, Math.round(Math.sqrt(expSeed) * 9 + (train?.cars?.length || 4) * 4));
    return {baseValue, baseCoins, coins, exp};
  }

  function trainAllLoaded(train) {
    return Boolean(train?.cars?.length) && train.cars.every(car => Number(car.loaded) >= Number(car.required));
  }

  function trainLoadedCount(train) {
    return (train?.cars || []).filter(car => Number(car.loaded) >= Number(car.required)).length;
  }

  function trainReadySlots(hub=ensureTrainState()) {
    return (hub?.slots || []).filter(slot => slot.status === 'ready' && slot.train && !slot.train.departed);
  }

  function trainNextResetText() {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return formatTrainWait(next.getTime() - now.getTime());
  }

  function formatTrainWait(ms) {
    ms = Math.max(0, Number(ms) || 0);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h <= 0) return `${Math.max(1,m)}分钟`;
    return `${h}小时${String(m).padStart(2,'0')}分`;
  }

  const npcById = (id) => NPC_FARMERS.find(item => item.id === id) || null;
  const npcFriendIds = () => Array.isArray(state?.npcSocial?.friends) ? state.npcSocial.friends : [];
  const isNpcFriend = (id) => npcFriendIds().includes(id);
  const npcUnreadCount = () => (state?.npcSocial?.activities || []).filter(item => !item.seen).length;
  const npcStealRecords = () => Array.isArray(state?.npcSocial?.steals) ? state.npcSocial.steals : [];

  function npcCropCycleId(npcId, plotId, cropId, plantedAt) {
    const minuteStamp = Math.floor((Number(plantedAt) || 0) / 60000);
    return `${npcId}:${Number(plotId)}:${cropId}:${minuteStamp}`;
  }

  function npcStealRecordKey(npcId, plotId, cycleId) {
    return `${npcId}:${Number(plotId)}:${cycleId}`;
  }

  function npcStealWindowKey(date = new Date()) {
    return localFarmEventSlot(date).key;
  }

  function hasNpcStolenCycle(npcId, plotId, cycleId) {
    const key = npcStealRecordKey(npcId, plotId, cycleId);
    return npcStealRecords().some(item => item.key === key);
  }

  function npcStealsInWindow(npcId, windowKey = npcStealWindowKey()) {
    return npcStealRecords().filter(item => item.npcId === npcId && item.windowKey === windowKey).length;
  }

  function pruneNpcStealRecords(records = npcStealRecords()) {
    const cutoff = Date.now() - (8 * 24 * 60 * 60 * 1000);
    return records
      .filter(item => Number(item.at) >= cutoff)
      .sort((a,b) => Number(b.at) - Number(a.at))
      .slice(0, NPC_STEAL_RECORD_LIMIT);
  }

  const npcWaterHelpRecords = () => Array.isArray(state?.npcSocial?.waterHelps) ? state.npcSocial.waterHelps : [];
  const npcFootprints = () => Array.isArray(state?.npcSocial?.footprints) ? state.npcSocial.footprints : [];

  function npcWaterHelpKey(npcId, plotId, cycleId) {
    return `${npcId}:${Number(plotId)}:${String(cycleId || '')}`;
  }

  function hasNpcWaterHelp(npcId, plotId, cycleId) {
    const key = npcWaterHelpKey(npcId, plotId, cycleId);
    return npcWaterHelpRecords().some(item => item.key === key);
  }

  function pruneNpcWaterHelps(records = npcWaterHelpRecords()) {
    const cutoff = Date.now() - (8 * 24 * 60 * 60 * 1000);
    return records
      .filter(item => Number(item.at) >= cutoff)
      .sort((a,b) => Number(b.at) - Number(a.at))
      .slice(0, 160);
  }

  function pushNpcFootprint(npcId, type, {plotId=null, cropId='', at=Date.now(), id=''} = {}) {
    const npc = npcById(npcId);
    if (!npc || !['visit','steal','help_water'].includes(type)) return false;
    if (!state.npcSocial || typeof state.npcSocial !== 'object') state.npcSocial = {friends:[], activities:[], steals:[], waterHelps:[], footprints:[], lastHelpCheckAt:0, lastVisitCheckAt:0};
    if (!Array.isArray(state.npcSocial.footprints)) state.npcSocial.footprints = [];
    const entryId = String(id || `${npcId}:${type}:${at}:${plotId ?? ''}`);
    if (state.npcSocial.footprints.some(item => item.id === entryId)) return false;
    state.npcSocial.footprints = [{
      id:entryId, npcId, type, at,
      plotId:Number.isInteger(Number(plotId)) ? Number(plotId) : null,
      cropId:cropById(cropId) ? cropId : ''
    }, ...state.npcSocial.footprints]
      .sort((a,b) => Number(b.at) - Number(a.at))
      .slice(0,80);
    return true;
  }

  function npcFootprintRows() {
    return npcFootprints().map(item => {
      const npc = npcById(item.npcId);
      if (!npc) return null;
      return {
        direction:'sent', is_npc:true,
        activity_type:item.type,
        peer_id:npc.id,
        display_name:npc.name,
        sex:npc.sex,
        crop_id:item.cropId || null,
        plot_id:item.plotId,
        activity_at:new Date(item.at || Date.now()).toISOString(),
        is_unread:false
      };
    }).filter(Boolean);
  }

  function npcActivityRows() {
    return (state?.npcSocial?.activities || []).map(item => {
      const npc = npcById(item.npcId);
      if (!npc) return null;
      return {
        direction:'received',
        is_npc:true,
        activity_type:item.type === 'help_bug' ? 'npc_help_bug' : 'npc_visit',
        actor_id:npc.id,
        peer_id:npc.id,
        display_name:npc.name,
        sex:npc.sex,
        activity_at:new Date(item.at || Date.now()).toISOString(),
        plot_id:item.plotId,
        is_unread:!item.seen
      };
    }).filter(Boolean);
  }

  function markNpcActivitiesSeen() {
    if (!state?.npcSocial?.activities?.some(item => !item.seen)) return false;
    state.npcSocial.activities = state.npcSocial.activities.map(item => ({...item, seen:true}));
    saveState();
    renderFriendDot();
    return true;
  }

  function pushNpcActivity(npcId, type, {plotId=null, at=Date.now(), id=''} = {}) {
    const npc = npcById(npcId);
    if (!npc) return false;
    const activityId = String(id || `${npcId}:${type}:${at}:${plotId ?? ''}`);
    if ((state.npcSocial.activities || []).some(item => item.id === activityId)) return false;
    const entry = {
      id:activityId,
      npcId, type, at,
      plotId:Number.isInteger(Number(plotId)) ? Number(plotId) : null,
      seen:false
    };
    state.npcSocial.activities = [entry, ...(state.npcSocial.activities || [])]
      .sort((a,b) => b.at - a.at)
      .slice(0, NPC_ACTIVITY_LIMIT);
    return true;
  }

  function replacePendingNpcFriendOp(npcId, shouldFriend) {
    if (!mutationUserId()) return null;
    const ops = readPendingOps().filter(op => !(op?.type === 'npc-friend-set' && op.npcId === npcId));
    writePendingOps(ops);
    return queuePendingOp({type:'npc-friend-set', npcId, shouldFriend:Boolean(shouldFriend)});
  }

  function applyNpcFriendSetMutation(op) {
    const npc = npcById(op?.npcId);
    if (!npc) return false;
    if (!state.npcSocial || typeof state.npcSocial !== 'object') state.npcSocial = {friends:[], activities:[], steals:[], waterHelps:[], footprints:[], lastHelpCheckAt:0, lastVisitCheckAt:0};
    const ids = new Set(npcFriendIds());
    const before = ids.has(npc.id);
    if (op.shouldFriend) ids.add(npc.id);
    else ids.delete(npc.id);
    state.npcSocial.friends = [...ids].filter(id => npcById(id));
    return before !== Boolean(op.shouldFriend);
  }

  function setNpcFriend(npcId, shouldFriend) {
    const npc = npcById(npcId);
    if (!npc) return;
    applyNpcFriendSetMutation({npcId:npc.id, shouldFriend:Boolean(shouldFriend)});
    replacePendingNpcFriendOp(npc.id, shouldFriend);
    saveState();
    toast(
      shouldFriend ? `🌿 已和 ${npc.name} 成为农友` : `👋 已将 ${npc.name} 移出农友`,
      shouldFriend ? 'NPC 农友不会参加排行榜，也不会偷你的菜；成熟作物可以限量偷取。' : '之后仍可在 NPC 农友推荐里重新加入。'
    );
    renderFriendDot();
    if (activePanel === 'friends') renderActivePanel();
  }

  function npcCropForPlot(npc, plotIndex, cycleIndex=0) {
    const unlockedCrops = CROPS.filter(crop => crop.unlockLevel <= npc.level);
    const favorites = (npc.favorites || []).map(cropById).filter(crop => crop && crop.unlockLevel <= npc.level);
    const preferFavorites = favorites.length && (stableHash(`${npc.id}:fav:${plotIndex}:${cycleIndex}`) % 100) < 72;
    const pool = preferFavorites ? favorites : unlockedCrops;
    return pool[stableHash(`${npc.id}:crop:${plotIndex}:${cycleIndex}`) % Math.max(1, pool.length)] || CROPS[0];
  }

  function npcCycleSchedule(npc, plotIndex) {
    const cycles = [];
    let totalMs = 0;
    for (let cycleIndex=0; cycleIndex<NPC_CYCLE_SEQUENCE_LENGTH; cycleIndex+=1) {
      const crop = npcCropForPlot(npc, plotIndex, cycleIndex);
      const idleMs = (12 + (stableHash(`${npc.id}:idle:${plotIndex}:${cycleIndex}`) % 42)) * 60 * 1000;
      const matureHoldMs = (10 + (stableHash(`${npc.id}:mature:${plotIndex}:${cycleIndex}`) % 31)) * 60 * 1000;
      const growMs = crop.growMinutes * 60 * 1000;
      const durationMs = idleMs + growMs + matureHoldMs;
      cycles.push({cycleIndex, crop, idleMs, matureHoldMs, growMs, durationMs, startMs:totalMs});
      totalMs += durationMs;
    }
    return {cycles, totalMs};
  }

  function buildNpcFarmPayload(npcId) {
    const npc = npcById(npcId);
    if (!npc) return null;
    const now = Date.now();
    const unlocked = unlockedLandCount(npc.level);
    const plots = [];

    for (let index=0; index<PLOT_COUNT; index+=1) {
      if (index >= unlocked) {
        plots.push({id:index, cropId:null, plantedAt:null});
        continue;
      }

      // V0.14.3: each plot follows one deterministic repeating sequence whose
      // cycle lengths are calculated from the crop that actually grows in that
      // cycle. This avoids the old seed-crop/real-crop mismatch that could make
      // a long crop disappear or change species before its own cycle finished.
      const schedule = npcCycleSchedule(npc, index);
      const sequenceOffset = stableHash(`${npc.id}:sequence-offset:${index}`) % Math.max(1, schedule.totalMs);
      const elapsed = Math.max(0, now - NPC_CYCLE_EPOCH_MS + sequenceOffset);
      const sequenceRound = Math.floor(elapsed / schedule.totalMs);
      const sequencePhase = elapsed % schedule.totalMs;
      let active = schedule.cycles[schedule.cycles.length - 1];
      for (const item of schedule.cycles) {
        if (sequencePhase < item.startMs + item.durationMs) { active = item; break; }
      }

      const phase = sequencePhase - active.startMs;
      if (phase < active.idleMs) {
        plots.push({id:index, cropId:null, plantedAt:null});
        continue;
      }

      const crop = active.crop;
      const plantedAt = now - (phase - active.idleMs);
      const absoluteCycleIndex = sequenceRound * NPC_CYCLE_SEQUENCE_LENGTH + active.cycleIndex;
      const cycleId = npcCropCycleId(npc.id, index, crop.id, plantedAt);
      const stolenByMe = hasNpcStolenCycle(npc.id, index, cycleId);
      const friendWatered = hasNpcWaterHelp(npc.id, index, cycleId);
      const yieldRange = Math.max(1, crop.yieldMax - crop.yieldMin + 1);
      const harvestYield = crop.yieldMin + (stableHash(`${npc.id}:yield:${index}:${absoluteCycleIndex}`) % yieldRange);
      plots.push({
        id:index,
        cropId:crop.id,
        plantedAt,
        cycleId,
        harvestYield,
        stolenCount:stolenByMe ? 1 : 0,
        stolenByMe,
        watered:(stableHash(`${npc.id}:water:${index}:${absoluteCycleIndex}`) % 100) < 55,
        friendWatered,
        friendWateredBy:friendWatered ? (cloudAuthUser()?.id || state.ownerUserId || 'player') : '',
        friendWateredByName:friendWatered ? '你' : '',
        friendWateredAt:friendWatered ? (npcWaterHelpRecords().find(item => item.key === npcWaterHelpKey(npc.id,index,cycleId))?.at || null) : null,
        fertilizerId:null,
        hasPest:false,
        eventGrowFactor:1
      });
    }

    // V0.19.2: NPC farms may wear seasonal outfits and intentionally use
    // matching seasonal scenery, including Halloween / Christmas assets that are
    // still hidden from the normal player shop. This remains deterministic and
    // local-only, so it adds no background Supabase traffic.
    const genericDecor = DECORATIONS.filter(item => item.unlockLevel <= npc.level && !item.seasonal);
    const themedDecor = DECORATIONS.filter(item => item.unlockLevel <= npc.level && item.seasonal === npc.decorTheme);
    const decorPool = [...themedDecor, ...genericDecor];
    const slots = Array(DECORATION_SLOT_COUNT).fill(null);
    const enabledSlots = Array.from({length:DECORATION_SLOT_COUNT}, (_, index) => index)
      .filter(index => !DISABLED_DECORATION_SLOT_INDEXES.has(index));
    const decorCount = Math.min(4, 2 + (stableHash(`${npc.id}:decor-count`) % 3), enabledSlots.length);
    const usedDecor = new Set();
    for (let i=0; i<decorCount && decorPool.length; i+=1) {
      const sourcePool = i < Math.min(2,themedDecor.length) ? themedDecor : decorPool;
      let item = sourcePool[stableHash(`${npc.id}:decor:${i}`) % sourcePool.length];
      for (let tries=0; tries<sourcePool.length && usedDecor.has(item.id); tries+=1) {
        item = sourcePool[(stableHash(`${npc.id}:decor:${i}`) + tries + 1) % sourcePool.length];
      }
      usedDecor.add(item.id);
      let slotCursor = stableHash(`${npc.id}:slot:${i}`) % enabledSlots.length;
      for (let tries=0; tries<enabledSlots.length && slots[enabledSlots[slotCursor]]; tries+=1) slotCursor = (slotCursor + 1) % enabledSlots.length;
      const slot = enabledSlots[slotCursor];
      if (!slots[slot]) slots[slot] = item.id;
    }

    return {
      ok:true,
      is_npc:true,
      user_id:npc.id,
      display_name:npc.name,
      sex:npc.sex,
      level:npc.level,
      coins:npc.coins,
      title_id:npc.titleId,
      avatar:{outfit:avatarOutfitById(npc.outfit || 'default').id},
      pet:{active:null},
      plots,
      decorations:{slots}
    };
  }

  function applyNpcHelpMutation(op, {silent=false} = {}) {
    const npc = npcById(op?.npcId);
    const plotId = Number(op?.plotId);
    if (!npc || !Number.isInteger(plotId) || plotId < 0 || plotId >= PLOT_COUNT) return false;
    const plot = state.plots?.[plotId];
    if (!plot || !plot.cropId) return false;
    if (Number(op.plantedAt) && Number(plot.plantedAt) !== Number(op.plantedAt)) return false;

    let changed = false;
    if (plot.hasPest) {
      plot.hasPest = false;
      changed = true;
    }
    if (pushNpcActivity(npc.id, 'help_bug', {plotId, at:Number(op.at) || Date.now(), id:op.activityId || ''})) changed = true;
    const historyKey = String(op.historyKey || `npc-help:${npc.id}:${plotId}:${Number(op.plantedAt) || 0}`);
    if (!state.history.some(item => item?.historyKey === historyKey)) {
      state.history.push({type:'npc-help-bug', npcId:npc.id, plotId, at:Number(op.at) || Date.now(), historyKey});
      state.history = state.history.slice(-30);
      changed = true;
    }
    if (changed && !silent) renderFriendDot();
    return changed;
  }

  function maybeNpcHelpPest() {
    const now = Date.now();
    const npcFriends = npcFriendIds().map(npcById).filter(Boolean);
    if (!npcFriends.length) return false;

    const last = Number(state?.npcSocial?.lastHelpCheckAt) || 0;
    if (now - last < NPC_HELP_CHECK_MS) return false;
    state.npcSocial.lastHelpCheckAt = now;

    const pestPlots = state.plots
      .map((plot,index) => ({plot,index}))
      .filter(({plot,index}) => index < unlockedLandCount() && plot?.cropId && plot.hasPest);

    if (!pestPlots.length) {
      writeLocalState();
      return false;
    }

    const bucket = Math.floor(now / NPC_HELP_CHECK_MS);
    const seed = stableHash(`${cloudUserId || state.ownerUserId || 'local'}:${bucket}:${pestPlots.length}:${npcFriends.length}`);
    const npc = npcFriends[seed % npcFriends.length];
    const roll = (stableHash(`${npc.id}:help:${bucket}`) % 1000) / 1000;

    if (roll > Number(npc.helpRate || .5)) {
      writeLocalState();
      return false;
    }

    const target = pestPlots[stableHash(`${npc.id}:plot:${bucket}`) % pestPlots.length];
    const op = {
      type:'npc-help-bug',
      npcId:npc.id,
      plotId:target.index,
      plantedAt:Number(target.plot.plantedAt) || 0,
      activityId:`${npc.id}:help_bug:${bucket}:${target.index}:${Number(target.plot.plantedAt) || 0}`,
      historyKey:`npc-help:${npc.id}:${target.index}:${Number(target.plot.plantedAt) || 0}`,
      at:now
    };
    if (!applyNpcHelpMutation(op)) {
      writeLocalState();
      return false;
    }
    if (mutationUserId()) queuePendingOp(op);
    saveState();
    toast(`🌿 ${npc.name} NPC 来帮忙了`, `帮你清除了第 ${target.index + 1} 格作物的虫害。`, 'care');
    renderAll();
    return true;
  }

  function applyNpcVisitMutation(op) {
    const npc = npcById(op?.npcId);
    if (!npc || !isNpcFriend(npc.id)) return false;
    return pushNpcActivity(npc.id, 'visit', {at:Number(op.at) || Date.now(), id:op.activityId || ''});
  }

  function maybeNpcVisitPlayer() {
    const now = Date.now();
    const npcFriends = npcFriendIds().map(npcById).filter(Boolean);
    if (!npcFriends.length) return false;
    const last = Number(state?.npcSocial?.lastVisitCheckAt) || 0;
    if (now - last < NPC_VISIT_CHECK_MS) return false;
    state.npcSocial.lastVisitCheckAt = now;

    const bucket = Math.floor(now / NPC_VISIT_CHECK_MS);
    const seedBase = `${cloudUserId || state.ownerUserId || 'local'}:visit:${bucket}:${npcFriends.length}`;
    const npc = npcFriends[stableHash(seedBase) % npcFriends.length];
    const roll = (stableHash(`${npc.id}:visit:${bucket}`) % 1000) / 1000;
    if (roll > Number(npc.visitRate || .35)) {
      writeLocalState();
      return false;
    }

    const op = {
      type:'npc-visit',
      npcId:npc.id,
      activityId:`${npc.id}:visit:${bucket}`,
      at:now
    };
    if (!applyNpcVisitMutation(op)) {
      writeLocalState();
      return false;
    }
    if (mutationUserId()) queuePendingOp(op);
    saveState();
    toast(`👣 ${npc.name} NPC 来串门了`, `${npc.trait} 刚刚来你的农场逛了一圈。`);
    renderFriendDot();
    if (activePanel === 'friends' && activeFriendTab === 'activity') renderActivePanel();
    return true;
  }

  function applyNpcPlayerVisitMutation(op, {silent=false} = {}) {
    const npc = npcById(op?.npcId);
    const day = typeof op?.day === 'string' ? op.day : farmDay;
    if (!npc) return false;
    ensureDailyState(day);
    if (state.daily.visitedFriends.includes(npc.id)) return false;
    state.daily.visitedFriends.push(npc.id);
    state.daily.visitedFriends = [...new Set(state.daily.visitedFriends.map(String))].slice(-100);
    state.stats.friendVisits = Math.max(0, Number(state.stats.friendVisits) || 0) + 1;
    pushNpcFootprint(npc.id, 'visit', {at:Math.max(0, Number(op.at) || Date.now()), id:`npc-player-visit:${npc.id}:${day}`});
    const awarded = grantDailySocialExp(DAILY_SOCIAL_VISIT_EXP, {silent:true});
    op.socialExpAwarded = awarded;
    if (!silent) renderTaskDot();
    return true;
  }

  function visitNpcFarm(npcId, {logVisit=true} = {}) {
    const npc = npcById(npcId);
    if (!npc) return;
    if (!isNpcFriend(npc.id)) {
      toast('🌿 还不是农友', '先在 NPC 农友推荐中加入对方，再去拜访吧。');
      return;
    }
    const payload = buildNpcFarmPayload(npc.id);
    if (!payload) return;
    const socialOp = {type:'npc-player-visit', npcId:npc.id, day:farmDay, at:Date.now()};
    const dailyChanged = logVisit ? applyNpcPlayerVisitMutation(socialOp) : false;
    const socialAward = Math.max(0, Number(socialOp.socialExpAwarded) || 0);
    if (dailyChanged && mutationUserId()) queuePendingOp(socialOp);
    if (dailyChanged) saveState();
    currentPatrolId = String(npc.id);
    currentPatrolNpc = true;
    friendListFocusId = String(npc.id);
    friendListFocusNpc = true;
    openModal({
      icon:'farm-expert',
      eyebrow:'NPC FARM VISIT',
      title:`${npc.name}的农场`,
      subtitle:`${npc.trait} · NPC 会自己经营农场；成熟作物每个周期可限量偷取，也可能来帮你除虫。`,
      body:renderFriendFarmVisit(payload, {npc:true})
    });
    if (socialAward > 0) {
      toast('👣 今日拜访奖励', `EXP +${socialAward} · 农友互助 ${Math.min(DAILY_SOCIAL_EXP_CAP, Number(state.daily?.socialExp) || 0)}/${DAILY_SOCIAL_EXP_CAP}`, 'care');
    }
  }

  function applyNpcStealMutation(op, {silent=false} = {}) {
    const npc = npcById(op?.npcId);
    const crop = cropById(op?.cropId);
    const plotId = Number(op?.plotId);
    const cycleId = String(op?.cycleId || '');
    if (!npc || !crop || !Number.isInteger(plotId) || plotId < 0 || plotId >= PLOT_COUNT || !cycleId) return false;

    if (!state.npcSocial || typeof state.npcSocial !== 'object') state.npcSocial = {friends:[], activities:[], steals:[], waterHelps:[], footprints:[], lastHelpCheckAt:0, lastVisitCheckAt:0};
    if (!Array.isArray(state.npcSocial.steals)) state.npcSocial.steals = [];

    const recordKey = String(op.recordKey || npcStealRecordKey(npc.id, plotId, cycleId));
    if (state.npcSocial.steals.some(item => item.key === recordKey)) return false;

    const record = {
      key:recordKey,
      npcId:npc.id,
      plotId,
      cycleId,
      cropId:crop.id,
      windowKey:String(op.windowKey || npcStealWindowKey()),
      at:Math.max(0, Number(op.at) || Date.now())
    };
    state.npcSocial.steals = pruneNpcStealRecords([record, ...state.npcSocial.steals]);
    state.produce[crop.id] = Math.max(0, Number(state.produce[crop.id]) || 0) + 1;
    state.stats.steals = Math.max(0, Number(state.stats.steals) || 0) + 1;
    if (!op.day || op.day === farmDay) bumpDaily('steal', 1);
    state.history.push({type:'npc-steal', npcId:npc.id, plotId, cropId:crop.id, cycleId, at:record.at});
    state.history = state.history.slice(-30);
    pushNpcFootprint(npc.id, 'steal', {plotId, cropId:crop.id, at:record.at, id:`npc-steal:${recordKey}`});
    if (!silent) renderTaskDot();
    return true;
  }

  async function stealNpcCrop(npcId, plotId, cycleId) {
    const npc = npcById(npcId);
    const safePlotId = Number(plotId);
    if (!npc || !isNpcFriend(npc.id) || !Number.isInteger(safePlotId)) {
      toast('🥷 无法偷菜', '只有已经加入的 NPC 农友才能拜访并偷取成熟作物。');
      return;
    }

    const payload = buildNpcFarmPayload(npc.id);
    const plot = payload?.plots?.[safePlotId];
    const crop = cropById(plot?.cropId);
    const currentCycleId = String(plot?.cycleId || '');
    if (!plot || !crop || !currentCycleId || currentCycleId !== String(cycleId || '')) {
      toast('🌱 这轮作物已经变化', 'NPC 可能刚刚收成并重新播种，已帮你刷新农场。');
      visitNpcFarm(npc.id, {logVisit:false});
      return;
    }

    const progress = progressFor(plot, crop);
    const total = crop.isMystery ? 1 : Math.max(crop.yieldMin, Math.min(crop.yieldMax, Number(plot.harvestYield) || crop.yieldMin));
    if (progress < 1) {
      toast('⏳ 还没成熟', '等这格作物成熟后再来看看。');
      visitNpcFarm(npc.id, {logVisit:false});
      return;
    }
    if (crop.isMystery || total <= 1) {
      toast('🌱 这格不能再偷了', 'NPC 农友也会至少保留 1 个作物。');
      return;
    }
    if (hasNpcStolenCycle(npc.id, safePlotId, currentCycleId)) {
      toast('🥷 这一轮已经偷过了', '等 NPC 收成并种下下一轮作物后再来看看。');
      visitNpcFarm(npc.id, {logVisit:false});
      return;
    }

    const windowKey = npcStealWindowKey();
    const used = npcStealsInWindow(npc.id, windowKey);
    if (used >= NPC_STEAL_CAP_PER_WINDOW) {
      toast('🥷 本时段已经偷满了', `每位 NPC 每 4 小时最多偷 ${NPC_STEAL_CAP_PER_WINDOW} 格，下一时段再来看看。`);
      return;
    }

    const recordKey = npcStealRecordKey(npc.id, safePlotId, currentCycleId);
    const op = {
      type:'npc-steal',
      npcId:npc.id,
      plotId:safePlotId,
      cycleId:currentCycleId,
      cropId:crop.id,
      windowKey,
      recordKey,
      day:farmDay,
      at:Date.now()
    };
    if (!applyNpcStealMutation(op)) {
      toast('🥷 这一轮已经偷过了', '等 NPC 重新种下一轮作物后再来看看。');
      return;
    }
    if (mutationUserId()) queuePendingOp(op);
    saveState();
    renderAll();
    toast(`🥷 偷到 ${crop.name} ×1`, `${npc.name} NPC 这格仍至少保留 1 个；本时段已偷 ${Math.min(NPC_STEAL_CAP_PER_WINDOW, used + 1)}/${NPC_STEAL_CAP_PER_WINDOW} 格。`, 'harvest');
    await new Promise(resolve => setTimeout(resolve, 220));
    visitNpcFarm(npc.id, {logVisit:false});
  }

  function applyNpcWaterHelpMutation(op, {silent=false} = {}) {
    const npc = npcById(op?.npcId);
    const targets = Array.isArray(op?.targets) ? op.targets : [];
    if (!npc || !targets.length) return false;
    if (!state.npcSocial || typeof state.npcSocial !== 'object') state.npcSocial = {friends:[], activities:[], steals:[], waterHelps:[], footprints:[], lastHelpCheckAt:0, lastVisitCheckAt:0};
    if (!Array.isArray(state.npcSocial.waterHelps)) state.npcSocial.waterHelps = [];
    let changed = false;
    let addedCount = 0;
    const now = Math.max(0, Number(op.at) || Date.now());
    const payload = buildNpcFarmPayload(npc.id);

    for (const target of targets) {
      const plotId = Number(target?.plotId);
      const cycleId = String(target?.cycleId || '');
      if (!Number.isInteger(plotId) || plotId < 0 || plotId >= PLOT_COUNT || !cycleId) continue;
      const current = payload?.plots?.[plotId];
      const crop = cropById(current?.cropId);
      if (!current || !crop || crop.isMystery || String(current.cycleId || '') !== cycleId) continue;
      if (progressFor(current,crop) >= 1 || hasNpcWaterHelp(npc.id,plotId,cycleId)) continue;
      const key = npcWaterHelpKey(npc.id,plotId,cycleId);
      state.npcSocial.waterHelps = pruneNpcWaterHelps([{key,npcId:npc.id,plotId,cycleId,at:now}, ...state.npcSocial.waterHelps]);
      pushNpcFootprint(npc.id,'help_water',{plotId,cropId:crop.id,at:now,id:`npc-water:${key}`});
      addedCount += 1;
      changed = true;
    }
    if (addedCount > 0) {
      state.stats.helpWater = Math.max(0, Number(state.stats.helpWater) || 0) + addedCount;
      if (!op.day || op.day === farmDay) {
        bumpDaily('helpWater', addedCount);
        op.socialExpAwarded = grantDailySocialExp(addedCount * DAILY_SOCIAL_WATER_EXP, {silent:true});
      } else op.socialExpAwarded = 0;
      op.appliedCount = addedCount;
    }
    if (changed && !silent) {
      renderFriendDot();
      renderTaskDot();
    }
    return changed;
  }

  async function helpNpcWater(npcId, plotId = null) {
    const npc = npcById(npcId);
    if (!npc || !isNpcFriend(npc.id)) {
      toast('💧 无法帮忙浇水','只有已经加入的 NPC 农友才能互动。');
      return;
    }
    const payload = buildNpcFarmPayload(npc.id);
    const wanted = plotId === null || plotId === undefined || plotId === '' ? null : (Number.isInteger(Number(plotId)) ? Number(plotId) : null);
    const targets = (payload?.plots || []).map((plot,index) => ({plot,index,crop:cropById(plot?.cropId)})).filter(({plot,index,crop}) => {
      if (wanted !== null && index !== wanted) return false;
      if (!plot || !crop || crop.isMystery || plot.friendWatered) return false;
      return progressFor(plot,crop) < 1;
    }).map(({plot,index,crop}) => ({plotId:index,cycleId:String(plot.cycleId || ''),cropId:crop.id})).filter(item => item.cycleId);

    if (!targets.length) {
      toast('💧 暂时没有可助力的作物','已成熟、盲盒或已经接受过好友助力的作物不会重复浇水。');
      visitNpcFarm(npc.id,{logVisit:false});
      return;
    }

    const op = {type:'npc-help-water',npcId:npc.id,targets,day:farmDay,at:Date.now()};
    if (!applyNpcWaterHelpMutation(op)) {
      toast('💧 这轮已经帮过了','等 NPC 种下下一轮作物后再来看看。');
      visitNpcFarm(npc.id,{logVisit:false});
      return;
    }
    if (mutationUserId()) queuePendingOp(op);
    saveState();
    renderAll();
    const socialAward = Math.max(0, Number(op.socialExpAwarded) || 0);
    const socialText = socialAward > 0 ? ` · EXP +${socialAward}（今日互助 ${Math.min(DAILY_SOCIAL_EXP_CAP, Number(state.daily?.socialExp) || 0)}/${DAILY_SOCIAL_EXP_CAP}）` : ' · 今日互助 EXP 已达上限';
    toast('💧 好友助力完成',`帮 ${npc.name} 的 ${Math.max(1,Number(op.appliedCount)||targets.length)} 格作物额外缩短 5% 收获时间${socialText}`,'care');
    await new Promise(resolve => setTimeout(resolve,180));
    visitNpcFarm(npc.id,{logVisit:false});
  }

  function currentFarmEvent(slotKey = farmEventSlotKey || localFarmEventSlot().key) {
    return DAILY_EVENTS[stableHash(`stellar-event:${slotKey}`) % DAILY_EVENTS.length];
  }

  function merchantDiscountCrops() {
    const unlocked = CROPS.filter(crop => state.level >= crop.unlockLevel);
    if (!unlocked.length) return [];
    const first = stableHash(`merchant-a:${farmEventSlotKey}`) % unlocked.length;
    const second = unlocked.length > 1 ? (first + 1 + (stableHash(`merchant-b:${farmEventSlotKey}`) % (unlocked.length - 1))) % unlocked.length : first;
    return [...new Set([unlocked[first]?.id, unlocked[second]?.id])].filter(Boolean);
  }

  function currentPestChance() { return Number(currentFarmEvent()?.pestChance ?? BASE_PEST_CHANCE); }

  // V0.15.0 — unified 8×6 farm UI icon atlas.  One image is shared by
  // desktop and mobile; CSS controls only display size, so the artwork never
  // diverges between breakpoints.
  const UI_ICON_INDEX = Object.freeze({
    coin:1, exp:2, cloud:3, lock:4, cooldown:5, 'reward-box':6,
    ranking:7, shop:8, bag:9, friends:10, task:11, achievement:12,
    title:13, 'daily-task':14, success:15, warning:16, refresh:17, claim:18,
    cooperate:19, visit:20, steal:21, 'add-friend':22, notification:23,
    sunny:24, rainy:25, storm:26, 'newbie-farmer':27, 'farm-expert':28,
    'harvest-expert':29, wealth:30, 'farm-rich':31, 'mystery-master':32,
    rank1:33, rank2:34, rank3:35,
    'seed-carrot':36, 'seed-wheat':37, 'seed-corn':38, 'seed-tomato':39,
    'seed-strawberry':40, 'seed-pumpkin':41, 'seed-grape':42, 'seed-starfruit':43,
    mailbox:44, announcement:45, attachment:46, 'claim-all':47, mail:48
  });
  const SEED_UI_ICON = Object.freeze({
    carrot:'seed-carrot', wheat:'seed-wheat', corn:'seed-corn', tomato:'seed-tomato',
    strawberry:'seed-strawberry', pumpkin:'seed-pumpkin', grape:'seed-grape', starfruit:'seed-starfruit'
  });
  const TITLE_UI_ICON = Object.freeze({
    newbie:'newbie-farmer', novice_farmer:'newbie-farmer', farmer:'harvest-expert',
    skilled_farmer:'harvest-expert', harvest_master:'harvest-expert', farm_master:'farm-expert',
    legendary_farmer:'exp', harvest_grandmaster:'ranking', small_landlord:'coin', ten_thousand:'wealth', farm_tycoon:'farm-rich',
    stellar_landlord:'exp', farm_magnate:'farm-rich', sowing_hand:'newbie-farmer', sowing_master:'harvest-expert', blindbox_fan:'reward-box',
    blindbox_master:'mystery-master', blindbox_collector:'reward-box', steal_rookie:'steal', steal_shadow:'steal', steal_master:'steal', steal_legend:'steal',
    senior_farmer:'farm-expert', stellar_host:'exp', stellar_estate_owner:'farm-expert', stellar_legend:'exp', social_farmer:'cooperate', popular_host:'cooperate',
    visiting_star:'visit', visiting_legend:'visit', water_helper:'rainy', water_guardian:'rainy', water_legend:'rainy', bug_guardian:'warning', bug_legend:'warning'
  });
  const GROUP_UI_ICON = Object.freeze({wealth:'coin',harvest:'harvest-expert',plant:'newbie-farmer',blind:'mystery-master',steal:'steal',growth:'exp',social:'cooperate'});
  const EVENT_UI_ICON = Object.freeze({sunny:'sunny',harvest:'harvest-expert',rainy:'rainy',storm:'storm',merchant:'shop'});
  const UI_EMOJI_ICON = Object.freeze({
    '🪙':'coin','⭐':'exp','🌟':'exp','☁':'cloud','☁️':'cloud','🔒':'lock','⏳':'cooldown',
    '🎁':'reward-box','🏆':'ranking','🛒':'shop','🎒':'bag','👥':'friends','📜':'task',
    '🏅':'achievement','🏷️':'title','✅':'success','⚠️':'warning','🔄':'refresh','🤝':'cooperate',
    '👣':'visit','🥷':'steal','🔔':'notification','🌧️':'rainy','⛈️':'storm','👑':'farm-rich',
    '🎀':'mystery-master','🥇':'rank1','🥈':'rank2','🥉':'rank3','🏡':'farm-expert','💰':'wealth',
    '☀️':'sunny','✓':'success','👋':'friends','🌿':'harvest-expert','🌱':'newbie-farmer','🧺':'harvest-expert','🐛':'warning','🪲':'warning','💧':'rainy','✨':'exp','🎉':'reward-box'
  });

  function uiIconKeyForIndex(index) {
    return Object.keys(UI_ICON_INDEX).find(key => UI_ICON_INDEX[key] === Number(index)) || '';
  }
  function uiIconMarkup(key, className='', label='') {
    const safeKey = UI_ICON_INDEX[key] ? key : 'newbie-farmer';
    const aria = label ? ` role="img" aria-label="${escapeHtml(label)}"` : ' aria-hidden="true"';
    return `<span class="farm-ui-icon ${escapeHtml(className)}" data-ui-icon="${safeKey}"${aria}></span>`;
  }
  function trainIconMarkup(className='') {
    return `<img class="farm-inline-train-icon ${escapeHtml(className)}" src="../images/farm/train-engine.png?v=0.19.2" alt="" aria-hidden="true">`;
  }
  function uiTextMarkup(value) {
    let text = escapeHtml(value ?? '');
    for (const [emoji,key] of Object.entries(UI_EMOJI_ICON).sort((a,b) => b[0].length - a[0].length)) {
      text = text.split(emoji).join(uiIconMarkup(key,'is-inline-ui'));
    }
    text = text.split('🚂').join(trainIconMarkup('is-inline-train'));
    text = text.split('🚃').join(trainIconMarkup('is-inline-train'));
    text = text.split('🚉').join(trainIconMarkup('is-inline-train'));
    return text;
  }
  function titleUiIconKey(titleId) { return TITLE_UI_ICON[titleId] || 'title'; }
  function groupUiIconKey(groupId) { return GROUP_UI_ICON[groupId] || 'achievement'; }
  function eventUiIconKey(eventId) { return EVENT_UI_ICON[eventId] || 'sunny'; }

  function rewardTextMarkup(value) {
    let text = escapeHtml(value ?? '');
    const seedNames = {
      '红萝卜种子':'seed-carrot','小麦种子':'seed-wheat','玉米种子':'seed-corn','番茄种子':'seed-tomato',
      '草莓种子':'seed-strawberry','南瓜种子':'seed-pumpkin','葡萄种子':'seed-grape','星辰果种子':'seed-starfruit'
    };
    for (const [name,key] of Object.entries(seedNames)) text = text.split(name).join(`${uiIconMarkup(key,'is-reward-ui')}<span>${name}</span>`);
    text = text.split('金币').join(`${uiIconMarkup('coin','is-reward-ui')}<span>金币</span>`);
    text = text.split('EXP').join(`${uiIconMarkup('exp','is-reward-ui')}<span>EXP</span>`);
    text = text.split('蔬果盲盒').join(`${uiIconMarkup('reward-box','is-reward-ui')}<span>蔬果盲盒</span>`);
    text = text.split('火车重置券').join(`${catalogSpriteMarkup(1,'is-reward-ticket','火车重置券')}<span>火车重置券</span>`);
    text = text.replace(/称号【/g, `${uiIconMarkup('title','is-reward-ui')}称号【`);
    return `<span class="farm-reward-inline">${text}</span>`;
  }

  function produceIconMarkup(crop, className='') {
    if (!crop) return uiIconMarkup('harvest-expert', className);
    if (crop.isMystery || crop.id === 'mystery') return uiIconMarkup('reward-box', className, '蔬果盲盒');
    const sprite = cropSpritePosition(crop.id, 1);
    if (!sprite) return uiIconMarkup('harvest-expert', className);
    return `<span class="farm-produce-ui ${escapeHtml(className)}" data-crop-sheet="${sprite.sheet}" style="--produce-x:${sprite.x}%;--produce-y:${sprite.y}%;--produce-scale:${sprite.scale};--produce-shift-x:${sprite.shiftX}px;--produce-shift-y:${sprite.shiftY}px;--produce-lift:${sprite.lift}px"></span>`;
  }

  function seedIconMarkup(crop) {
    return crop?.isMystery ? itemSpriteMarkup(3, 'is-seed-icon', '蔬果盲盒') : uiIconMarkup(SEED_UI_ICON[crop?.id] || 'newbie-farmer', 'is-seed-ui', `${crop?.name || '作物'}种子`);
  }
  const seedItems = () => PLANTABLES;
  const titleById = (id) => TITLES.find(item => item.id === id) || TITLES[0];
  const achievementById = (id) => ACHIEVEMENTS.find(item => item.id === id) || null;
  const dailyTaskById = (id) => DAILY_TASK_POOL.find(item => item.id === id) || null;

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


  function localFarmEventSlot(date = new Date()) {
    try {
      const parts = new Intl.DateTimeFormat('en', {
        timeZone:'Asia/Taipei', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', hourCycle:'h23'
      }).formatToParts(date);
      const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
      const hour = Math.max(0, Math.min(23, Number(map.hour) || 0));
      const slotIndex = Math.floor(hour / 4);
      const day = `${map.year}-${map.month}-${map.day}`;
      return {day, slotIndex, key:`${day}-${slotIndex}`, startHour:slotIndex*4, endHour:(slotIndex+1)*4};
    } catch (_) {}
    const utc8 = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    const hour = utc8.getUTCHours();
    const slotIndex = Math.floor(hour / 4);
    const day = `${utc8.getUTCFullYear()}-${String(utc8.getUTCMonth()+1).padStart(2,'0')}-${String(utc8.getUTCDate()).padStart(2,'0')}`;
    return {day, slotIndex, key:`${day}-${slotIndex}`, startHour:slotIndex*4, endHour:(slotIndex+1)*4};
  }

  function farmEventSlotWindow(slotKey = farmEventSlotKey) {
    const match = String(slotKey || '').match(/^(\d{4}-\d{2}-\d{2})-([0-5])$/);
    const slotIndex = match ? Number(match[2]) : localFarmEventSlot().slotIndex;
    const start = slotIndex * 4;
    const end = (slotIndex + 1) * 4;
    return `${String(start).padStart(2,'0')}:00–${end === 24 ? '24:00' : `${String(end).padStart(2,'0')}:00`}`;
  }


  function farmEventRemainingMs(date = new Date()) {
    // The farm clock is fixed to UTC+8. Calculate the next 4-hour boundary from
    // epoch time so the countdown is independent of the computer's local timezone.
    const utc8 = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    const seconds = utc8.getUTCHours() * 3600 + utc8.getUTCMinutes() * 60 + utc8.getUTCSeconds();
    const nextBoundary = (Math.floor(seconds / (4 * 3600)) + 1) * 4 * 3600;
    return Math.max(0, (nextBoundary - seconds) * 1000 - utc8.getUTCMilliseconds());
  }

  function formatFarmEventCountdown(ms = farmEventRemainingMs()) {
    const total = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
  }

  function updateFarmEventRuntimeLabels() {
    const remaining = formatFarmEventCountdown();
    document.querySelectorAll('[data-farm-event-countdown]').forEach(el => {
      el.textContent = `剩 ${remaining}`;
    });
  }

  function announceFarmEventChange(previousKey, nextKey) {
    if (!previousKey || !nextKey || previousKey === nextKey) return;
    const event = currentFarmEvent(nextKey);
    const eventLead = event.id === 'sunny' ? '☀️' : event.id === 'harvest' ? '🌿' : event.id === 'rainy' ? '🌧️' : event.id === 'storm' ? '⛈️' : '🛒';
    toast(`${eventLead} ${event.name}来临`, `${farmEventSlotWindow(nextKey)} · ${event.note}`);
    if (activePanel === 'merchant') {
      closeModal();
      toast('🛒 商人时段已更新', '折扣内容已经刷新，请重新点击商人查看。');
    }
  }

  function createDailyState(day = localFarmDay()) {
    return {
      date:day,
      plant:0, harvest:0, sell:0, steal:0,
      helpWater:0, helpBug:0, trainCars:0, trainDepart:0, fertilize:0, mysteryPlant:0,
      plantByCrop:{}, harvestByCrop:{},
      visitedFriends:[], socialExp:0,
      taskIds:[], levelSnapshot:0, rerollUsed:false, rerollSlot:null,
      claimed:[], masteryClaimed:[], bonusClaimed:false
    };
  }

  function dailySeedIdentity() {
    return String(state?.ownerUserId || cloudAuthUser()?.id || `local-${Number(state?.createdAt) || 0}`);
  }

  function hasDailyFriendContext() {
    return npcFriendIds().length > 0 || Math.max(0, Number(state?.stats?.friend) || 0) > 0;
  }

  function dailyEligibleTasks(levelSnapshot = state?.level || 1) {
    const level = Math.max(1, Number(levelSnapshot) || 1);
    const hasFriend = hasDailyFriendContext();
    return DAILY_TASK_POOL.filter(task => level >= Math.max(1, Number(task.minLevel) || 1) && (!task.requiresFriend || hasFriend));
  }

  function pickDailyTask(candidates, seed, usedIds, usedFamilies, {allowFamilyRepeat=false} = {}) {
    let pool = candidates.filter(task => !usedIds.has(task.id) && (allowFamilyRepeat || !usedFamilies.has(task.family || task.id)));
    if (!pool.length) pool = candidates.filter(task => !usedIds.has(task.id));
    if (!pool.length) return null;
    const task = pool[stableHash(seed) % pool.length];
    usedIds.add(task.id);
    usedFamilies.add(task.family || task.id);
    return task;
  }

  function generateDailyTaskIds(day, levelSnapshot) {
    const eligible = dailyEligibleTasks(levelSnapshot);
    const usedIds = new Set();
    const usedFamilies = new Set();
    const picked = [];
    const identity = dailySeedIdentity();
    const hasSocial = eligible.some(task => task.category === 'social');
    const slots = ['farm','farm',hasSocial ? 'social' : 'economy','logistics','any'];
    slots.forEach((slotType, index) => {
      let pool = eligible;
      if (slotType === 'farm') pool = eligible.filter(task => task.category === 'farm');
      else if (slotType === 'social') pool = eligible.filter(task => task.category === 'social');
      else if (slotType === 'economy') pool = eligible.filter(task => task.category === 'economy');
      else if (slotType === 'logistics') pool = eligible.filter(task => ['train','economy'].includes(task.category));
      const task = pickDailyTask(pool, `daily:${day}:${identity}:${levelSnapshot}:${slotType}:${index}`, usedIds, usedFamilies)
        || pickDailyTask(eligible, `daily:${day}:${identity}:${levelSnapshot}:fallback:${index}`, usedIds, usedFamilies, {allowFamilyRepeat:true});
      if (task) picked.push(task.id);
    });
    return picked.slice(0, DAILY_TASK_COUNT);
  }

  function ensureDailyTaskPlan() {
    if (!state?.daily) return false;
    const validIds = Array.isArray(state.daily.taskIds)
      ? state.daily.taskIds.filter(id => DAILY_TASK_POOL.some(task => task.id === id)).slice(0, DAILY_TASK_COUNT)
      : [];
    if (!Number.isFinite(Number(state.daily.levelSnapshot)) || Number(state.daily.levelSnapshot) <= 0) {
      state.daily.levelSnapshot = Math.max(1, Number(state.level) || 1);
    }
    if (validIds.length === DAILY_TASK_COUNT && new Set(validIds).size === DAILY_TASK_COUNT) {
      const normalizedChanged = validIds.join('|') !== (state.daily.taskIds || []).join('|');
      if (normalizedChanged) state.daily.taskIds = validIds;
      return normalizedChanged;
    }
    state.daily.taskIds = generateDailyTaskIds(state.daily.date || farmDay || localFarmDay(), state.daily.levelSnapshot);
    return true;
  }

  function ensureDailyState(day = farmDay || localFarmDay(), {persist=false} = {}) {
    const normalizedDay = typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : localFarmDay();
    farmDay = normalizedDay;
    renderDailyEventScene?.();
    let changed = false;
    if (!state.daily || state.daily.date !== normalizedDay) {
      state.daily = createDailyState(normalizedDay);
      state.daily.levelSnapshot = Math.max(1, Number(state.level) || 1);
      changed = true;
    }
    if (ensureDailyTaskPlan()) changed = true;
    if (changed) {
      if (persist) saveState();
      else writeLocalState();
    }
    return changed;
  }

  function dailyTasks() {
    ensureDailyState(farmDay);
    return (state.daily?.taskIds || []).map(dailyTaskById).filter(Boolean).slice(0, DAILY_TASK_COUNT);
  }

  function bumpDaily(metric, amount = 1, uniqueFriendId = '') {
    ensureDailyState(farmDay);
    if (metric === 'visit') {
      if (!uniqueFriendId) return false;
      const id = String(uniqueFriendId);
      if (state.daily.visitedFriends.includes(id)) return false;
      state.daily.visitedFriends.push(id);
      state.daily.visitedFriends = state.daily.visitedFriends.slice(-100);
      return true;
    }
    const numericMetrics = ['plant','harvest','sell','steal','helpWater','helpBug','trainCars','trainDepart','fertilize','mysteryPlant'];
    if (!numericMetrics.includes(metric)) return false;
    state.daily[metric] = Math.max(0, Number(state.daily[metric]) || 0) + Math.max(0, Number(amount) || 0);
    return true;
  }

  function bumpDailyCrop(kind, cropId, amount = 1) {
    ensureDailyState(farmDay);
    if (!['plantByCrop','harvestByCrop'].includes(kind) || !CROPS.some(crop => crop.id === cropId)) return false;
    if (!state.daily[kind] || typeof state.daily[kind] !== 'object' || Array.isArray(state.daily[kind])) state.daily[kind] = {};
    state.daily[kind][cropId] = Math.max(0, Number(state.daily[kind][cropId]) || 0) + Math.max(0, Number(amount) || 0);
    return true;
  }

  function dailyProgress(task) {
    ensureDailyState(farmDay);
    if (!task) return 0;
    let value = 0;
    if (task.metric === 'visit') value = state.daily.visitedFriends.length;
    else if (task.metric === 'plantCrop') value = Number(state.daily?.plantByCrop?.[task.cropId]) || 0;
    else if (task.metric === 'harvestCrop') value = Number(state.daily?.harvestByCrop?.[task.cropId]) || 0;
    else if (task.metric === 'friendCare') value = (Number(state.daily?.helpWater) || 0) + (Number(state.daily?.helpBug) || 0);
    else value = Math.max(0, Number(state.daily?.[task.metric]) || 0);
    return Math.min(task.target, Math.max(0, value));
  }

  function isDailyComplete(task) { return dailyProgress(task) >= task.target; }
  function isDailyClaimed(task) { return Boolean(state.daily?.claimed?.includes(task.id)); }
  function isDailyBonusReady() { const tasks = dailyTasks(); return tasks.length === DAILY_TASK_COUNT && tasks.every(isDailyComplete); }
  function dailyMasteryPoints() { return Math.min(100, dailyTasks().filter(isDailyComplete).length * DAILY_MASTERY_PER_TASK); }
  function isDailyMasteryClaimed(points) { return Boolean(state.daily?.masteryClaimed?.includes(Number(points))); }

  function defaultPlots() {
    return Array.from({length:PLOT_COUNT}, (_, i) => ({ id:i, cropId:null, plantedAt:null, watered:false, friendWatered:false, friendWateredBy:'', friendWateredByName:'', friendWateredAt:null, fertilizerId:null, hasPest:false, eventGrowFactor:1 }));
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
      supplies: { fertilizerLow:0, fertilizerMid:0, fertilizerHigh:0, [TRAIN_RESET_TICKET_ID]:0 },
      decorations: { owned:{}, slots:Array(DECORATION_SLOT_COUNT).fill(null) },
      wardrobe: { outfits:{ default:true } },
      avatar: { gender:'male', outfit:'default' },
      pets: { owned:{}, active:null },
      npcSocial: { friends:[], activities:[], steals:[], waterHelps:[], footprints:[], lastHelpCheckAt:0, lastVisitCheckAt:0 },
      train: null,
      stats: { visit:1, plant:0, harvest:0, sell:0, friend:0, blindBoxPlant:0, steals:0, friendVisits:0, helpWater:0, helpBug:0, maxCoins:INITIAL_COINS },
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
        friendWatered:Boolean(old?.friendWatered),
        friendWateredBy:typeof old?.friendWateredBy === 'string' ? old.friendWateredBy.slice(0,80) : '',
        friendWateredByName:typeof old?.friendWateredByName === 'string' ? old.friendWateredByName.slice(0,80) : '',
        friendWateredAt:Math.max(0, Number(old?.friendWateredAt) || 0) || null,
        fertilizerId:FERTILIZERS.some(item => item.id === old?.fertilizerId) ? old.fertilizerId : null,
        hasPest:Boolean(old?.hasPest),
        eventGrowFactor:Math.max(0.90, Math.min(1, Number(old?.eventGrowFactor) || 1))
      };
    });
    merged.seeds = {...base.seeds, ...(raw?.seeds || {})};
    merged.produce = {...(raw?.produce || {})};
    merged.supplies = {...base.supplies, ...(raw?.supplies || {})};
    for (const fertilizer of FERTILIZERS) merged.supplies[fertilizer.id] = Math.max(0, Number(merged.supplies[fertilizer.id]) || 0);
    merged.supplies[TRAIN_RESET_TICKET_ID] = Math.max(0, Math.floor(Number(merged.supplies[TRAIN_RESET_TICKET_ID]) || 0));
    const decorRaw = raw?.decorations && typeof raw.decorations === 'object' ? raw.decorations : {};
    const decorOwned = {};
    for (const item of DECORATIONS) decorOwned[item.id] = Math.max(0, Math.floor(Number(decorRaw?.owned?.[item.id]) || 0));
    const validDecorIds = new Set(DECORATIONS.map(item => item.id));
    const decorSlots = Array.from({length:DECORATION_SLOT_COUNT}, (_, index) => {
      const id = Array.isArray(decorRaw?.slots) ? decorRaw.slots[index] : null;
      return validDecorIds.has(id) ? id : null;
    });
    // Slot 5 used to sit directly over the owner's head. Preserve the eight-slot
    // data shape for cloud/backward compatibility, but migrate any existing item
    // out of the retired visual slot so it is never lost or silently consumed.
    for (const disabledIndex of DISABLED_DECORATION_SLOT_INDEXES) {
      const retiredDecorId = decorSlots[disabledIndex];
      if (!retiredDecorId) continue;
      const destination = decorSlots.findIndex((value, index) => !value && !DISABLED_DECORATION_SLOT_INDEXES.has(index));
      if (destination >= 0) decorSlots[destination] = retiredDecorId;
      decorSlots[disabledIndex] = null;
    }
    merged.decorations = {owned:decorOwned, slots:decorSlots};

    const wardrobeRaw = raw?.wardrobe && typeof raw.wardrobe === 'object' ? raw.wardrobe : {};
    const ownedRaw = wardrobeRaw.outfits && typeof wardrobeRaw.outfits === 'object' && !Array.isArray(wardrobeRaw.outfits) ? wardrobeRaw.outfits : {};
    // Preserve unknown future outfit keys so an older client never erases a
    // server-granted cosmetic from a newer catalog version.
    const ownedOutfits = {};
    Object.entries(ownedRaw).forEach(([id,value]) => {
      if (/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(id) && value === true) ownedOutfits[id] = true;
    });
    ownedOutfits.default = true;
    merged.wardrobe = {outfits:ownedOutfits};

    const avatarRaw = raw?.avatar && typeof raw.avatar === 'object' ? raw.avatar : {};
    const requestedAvatarGender = AVATAR_GENDERS.includes(avatarRaw.gender) ? avatarRaw.gender : 'male';
    const avatarOutfitEntry = avatarOutfitById(avatarRaw.outfit);
    const avatarGender = requestedAvatarGender;
    const normalizedOutfit = (avatarOutfitEntry.id === 'default' || ownedOutfits[avatarOutfitEntry.id] === true) && avatarOutfitEntry.released && outfitSupportsGender(avatarOutfitEntry,avatarGender)
      ? avatarOutfitEntry.id : 'default';
    merged.avatar = {gender:avatarGender, outfit:normalizedOutfit};

    const petsRaw = raw?.pets && typeof raw.pets === 'object' ? raw.pets : {};
    const petOwnedRaw = petsRaw.owned && typeof petsRaw.owned === 'object' && !Array.isArray(petsRaw.owned) ? petsRaw.owned : {};
    const ownedPets = {};
    Object.entries(petOwnedRaw).forEach(([id,value]) => {
      if (/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(id) && value === true) ownedPets[id] = true;
    });
    const requestedPet = petById(petsRaw.active);
    const normalizedPet = requestedPet && requestedPet.released && ownedPets[requestedPet.id] === true ? requestedPet.id : null;
    merged.pets = {owned:ownedPets, active:normalizedPet};

    const validNpcIds = new Set(NPC_FARMERS.map(item => item.id));
    const npcRaw = raw?.npcSocial && typeof raw.npcSocial === 'object' ? raw.npcSocial : {};
    const npcFriends = Array.isArray(npcRaw.friends)
      ? [...new Set(npcRaw.friends.filter(id => validNpcIds.has(id)))].slice(0, NPC_FARMERS.length)
      : [];
    const npcActivities = Array.isArray(npcRaw.activities) ? npcRaw.activities
      .filter(item => item && validNpcIds.has(item.npcId) && ['help_bug','visit'].includes(item.type))
      .map(item => ({
        id:String(item.id || `${item.npcId}-${Number(item.at) || 0}`),
        npcId:item.npcId,
        type:item.type,
        at:Math.max(0, Number(item.at) || 0),
        plotId:Number.isInteger(Number(item.plotId)) ? Number(item.plotId) : null,
        seen:Boolean(item.seen)
      }))
      .sort((a,b) => b.at - a.at)
      .slice(0, NPC_ACTIVITY_LIMIT) : [];
    const npcSteals = Array.isArray(npcRaw.steals) ? npcRaw.steals
      .filter(item => item && validNpcIds.has(item.npcId) && Number.isInteger(Number(item.plotId)) && item.cycleId)
      .map(item => ({
        key:String(item.key || npcStealRecordKey(item.npcId, Number(item.plotId), String(item.cycleId))),
        npcId:String(item.npcId),
        plotId:Number(item.plotId),
        cycleId:String(item.cycleId),
        cropId:cropById(item.cropId) ? item.cropId : '',
        windowKey:typeof item.windowKey === 'string' ? item.windowKey : '',
        at:Math.max(0, Number(item.at) || 0)
      })) : [];
    const npcWaterHelps = Array.isArray(npcRaw.waterHelps) ? npcRaw.waterHelps
      .filter(item => item && validNpcIds.has(item.npcId) && Number.isInteger(Number(item.plotId)) && item.cycleId)
      .map(item => ({
        key:String(item.key || `${item.npcId}:${Number(item.plotId)}:${String(item.cycleId)}`),
        npcId:String(item.npcId), plotId:Number(item.plotId), cycleId:String(item.cycleId),
        at:Math.max(0, Number(item.at) || 0)
      }))
      .sort((a,b) => b.at - a.at).slice(0,160) : [];
    const npcFootprints = Array.isArray(npcRaw.footprints) ? npcRaw.footprints
      .filter(item => item && validNpcIds.has(item.npcId) && ['visit','steal','help_water'].includes(item.type))
      .map(item => ({
        id:String(item.id || `${item.npcId}:${item.type}:${Number(item.at) || 0}`),
        npcId:String(item.npcId), type:String(item.type), at:Math.max(0, Number(item.at) || 0),
        plotId:Number.isInteger(Number(item.plotId)) ? Number(item.plotId) : null,
        cropId:cropById(item.cropId) ? item.cropId : ''
      }))
      .sort((a,b) => b.at - a.at).slice(0,80) : [];
    merged.npcSocial = {
      friends:npcFriends,
      activities:npcActivities,
      steals:pruneNpcStealRecords(npcSteals),
      waterHelps:npcWaterHelps,
      footprints:npcFootprints,
      lastHelpCheckAt:Math.max(0, Number(npcRaw.lastHelpCheckAt) || 0),
      lastVisitCheckAt:Math.max(0, Number(npcRaw.lastVisitCheckAt) || 0)
    };
    merged.train = normalizeTrainState(raw?.train, localFarmDay(), {level:Math.max(1, Number(merged.level) || 1), createdAt:Math.max(0, Number(merged.createdAt) || 0)});

    merged.stats = {...base.stats, ...(raw?.stats || {})};
    merged.claimedTasks = Array.isArray(raw?.claimedTasks) ? raw.claimedTasks : [];
    merged.claimedAchievements = Array.isArray(raw?.claimedAchievements) ? raw.claimedAchievements : [];
    merged.history = Array.isArray(raw?.history) ? raw.history.slice(-30) : [];
    merged.coins = Math.max(0, Number(merged.coins) || 0);
    merged.level = Math.max(1, Number(merged.level) || 1);
    merged.exp = Math.max(0, Number(merged.exp) || 0);
    for (const key of ['visit','plant','harvest','sell','friend','blindBoxPlant','steals','friendVisits','helpWater','helpBug']) {
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
    const normalizeDailyCropMap = value => {
      const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
      return Object.fromEntries(CROPS.map(crop => [crop.id, Math.max(0, Number(source[crop.id]) || 0)]));
    };
    merged.daily = {
      date: typeof dailyRaw.date === 'string' ? dailyRaw.date : localFarmDay(),
      plant: Math.max(0, Number(dailyRaw.plant) || 0),
      harvest: Math.max(0, Number(dailyRaw.harvest) || 0),
      sell: Math.max(0, Number(dailyRaw.sell) || 0),
      steal: Math.max(0, Number(dailyRaw.steal) || 0),
      helpWater: Math.max(0, Number(dailyRaw.helpWater) || 0),
      helpBug: Math.max(0, Number(dailyRaw.helpBug) || 0),
      trainCars: Math.max(0, Number(dailyRaw.trainCars) || 0),
      trainDepart: Math.max(0, Number(dailyRaw.trainDepart) || 0),
      fertilize: Math.max(0, Number(dailyRaw.fertilize) || 0),
      mysteryPlant: Math.max(0, Number(dailyRaw.mysteryPlant) || 0),
      plantByCrop: normalizeDailyCropMap(dailyRaw.plantByCrop),
      harvestByCrop: normalizeDailyCropMap(dailyRaw.harvestByCrop),
      visitedFriends: Array.isArray(dailyRaw.visitedFriends) ? [...new Set(dailyRaw.visitedFriends.filter(Boolean).map(String))].slice(-100) : [],
      socialExp: Math.min(DAILY_SOCIAL_EXP_CAP, Math.max(0, Number(dailyRaw.socialExp) || 0)),
      taskIds: Array.isArray(dailyRaw.taskIds) ? [...new Set(dailyRaw.taskIds.filter(id => DAILY_TASK_POOL.some(task => task.id === id)))].slice(0, DAILY_TASK_COUNT) : [],
      levelSnapshot: Math.max(0, Number(dailyRaw.levelSnapshot) || 0),
      rerollUsed: Boolean(dailyRaw.rerollUsed),
      rerollSlot: dailyRaw.rerollSlot !== null && dailyRaw.rerollSlot !== '' && Number.isInteger(Number(dailyRaw.rerollSlot)) ? Math.max(0, Math.min(DAILY_TASK_COUNT - 1, Number(dailyRaw.rerollSlot))) : null,
      claimed: Array.isArray(dailyRaw.claimed) ? [...new Set(dailyRaw.claimed.filter(id => DAILY_TASK_POOL.some(task => task.id === id)))] : [],
      masteryClaimed: Array.isArray(dailyRaw.masteryClaimed) ? [...new Set(dailyRaw.masteryClaimed.map(Number).filter(points => DAILY_MASTERY_REWARDS.some(item => item.points === points)))] : [],
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
    if (reward.supplies) {
      Object.entries(reward.supplies).forEach(([itemId, qty]) => {
        if (itemId === TRAIN_RESET_TICKET_ID || FERTILIZERS.some(item => item.id === itemId)) {
          state.supplies[itemId] = Math.max(0, Number(state.supplies[itemId]) || 0) + Math.max(0, Math.floor(Number(qty) || 0));
        }
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


  function dailyMasteryRewardByPoints(points) {
    return DAILY_MASTERY_REWARDS.find(item => item.points === Number(points)) || null;
  }

  function applyDailyMasteryReward(points, day = farmDay, {silent=false} = {}) {
    ensureDailyState(day);
    const milestone = dailyMasteryRewardByPoints(points);
    if (!milestone || state.daily.date !== day || dailyMasteryPoints() < milestone.points || isDailyMasteryClaimed(milestone.points)) return false;
    if (!Array.isArray(state.daily.masteryClaimed)) state.daily.masteryClaimed = [];
    state.daily.masteryClaimed.push(milestone.points);
    state.daily.masteryClaimed = [...new Set(state.daily.masteryClaimed.map(Number))];
    applyGenericReward(milestone.reward || {}, {silent});
    return true;
  }

  function dailyReplacementTask(slotIndex, currentIds = state.daily?.taskIds || []) {
    ensureDailyState(farmDay);
    const index = Math.max(0, Math.min(DAILY_TASK_COUNT - 1, Number(slotIndex) || 0));
    const currentId = String(currentIds[index] || '');
    const current = dailyTaskById(currentId);
    if (!current) return null;
    const used = new Set(currentIds.map(String));
    const eligible = dailyEligibleTasks(state.daily.levelSnapshot || state.level).filter(task => task.id !== currentId && !used.has(task.id));
    let pool = eligible.filter(task => task.category === current.category && (task.family || task.id) !== (current.family || current.id));
    if (!pool.length) pool = eligible.filter(task => task.category === current.category);
    if (!pool.length) pool = eligible;
    if (!pool.length) return null;
    return pool[stableHash(`daily-reroll:${state.daily.date}:${dailySeedIdentity()}:${index}:${currentId}`) % pool.length];
  }

  function applyDailyRerollMutation(op) {
    ensureDailyState(op?.day || farmDay);
    if (!op || state.daily.date !== op.day) return false;
    if (state.daily.rerollUsed) return false;
    const index = Math.max(0, Math.min(DAILY_TASK_COUNT - 1, Number(op.slotIndex) || 0));
    const current = state.daily.taskIds?.[index];
    if (String(current || '') !== String(op.oldTaskId || '')) return false;
    if (!dailyTaskById(op.newTaskId) || state.daily.taskIds.includes(op.newTaskId)) return false;
    state.daily.taskIds[index] = op.newTaskId;
    state.daily.rerollUsed = true;
    state.daily.rerollSlot = index;
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
    if (op.type === 'claim-daily-mastery') {
      if (targetState?.daily?.date && targetState.daily.date !== op.day) return true;
      const claimed = Array.isArray(targetState?.daily?.masteryClaimed) ? targetState.daily.masteryClaimed.map(Number) : [];
      return targetState?.daily?.date === op.day && claimed.includes(Number(op.points));
    }
    if (op.type === 'daily-reroll') {
      if (targetState?.daily?.date && targetState.daily.date !== op.day) return true;
      if (targetState?.daily?.date !== op.day) return false;
      if (Boolean(targetState?.daily?.rerollUsed)) return true;
      return Array.isArray(targetState?.daily?.taskIds) && targetState.daily.taskIds[Number(op.slotIndex)] === op.newTaskId;
    }
    if (op.type === 'npc-player-visit') {
      if (targetState?.daily?.date && targetState.daily.date !== op.day) return true;
      const visited = Array.isArray(targetState?.daily?.visitedFriends) ? targetState.daily.visitedFriends.map(String) : [];
      return targetState?.daily?.date === op.day && visited.includes(String(op.npcId || ''));
    }
    if (op.type === 'npc-steal') {
      const records = Array.isArray(targetState?.npcSocial?.steals) ? targetState.npcSocial.steals : [];
      return records.some(item => item?.key === op.recordKey);
    }
    if (op.type === 'npc-friend-set') {
      const friends = Array.isArray(targetState?.npcSocial?.friends) ? targetState.npcSocial.friends : [];
      return friends.includes(op.npcId) === Boolean(op.shouldFriend);
    }
    if (op.type === 'npc-help-bug') {
      const activities = Array.isArray(targetState?.npcSocial?.activities) ? targetState.npcSocial.activities : [];
      if (activities.some(item => item?.id === op.activityId)) return true;
      const plot = targetState?.plots?.[Number(op.plotId)];
      if (!plot || !plot.cropId || Number(plot.plantedAt) !== Number(op.plantedAt)) return true;
      return !plot.hasPest;
    }
    if (op.type === 'npc-help-water') {
      const records = Array.isArray(targetState?.npcSocial?.waterHelps) ? targetState.npcSocial.waterHelps : [];
      const targets = Array.isArray(op.targets) ? op.targets : [];
      return targets.length > 0 && targets.every(item => records.some(record => record?.key === npcWaterHelpKey(op.npcId,Number(item.plotId),String(item.cycleId || ''))));
    }
    if (op.type === 'npc-visit') {
      const activities = Array.isArray(targetState?.npcSocial?.activities) ? targetState.npcSocial.activities : [];
      return activities.some(item => item?.id === op.activityId);
    }
    if (op.type === 'train-reroll') {
      const hub = targetState?.train;
      if (!hub || hub.date !== op.day) return true;
      if (Array.isArray(hub.appliedOps) && hub.appliedOps.includes(op.id)) return true;
      const slot = Array.isArray(hub.slots) ? hub.slots.find(item => Number(item?.index) === Number(op.slotIndex)) : null;
      if (!slot) return false;
      if (slot.train?.id === op.replacementTrain?.id) return true;
      return Math.max(0, Number(slot.generation) || 0) > Math.max(0, Number(op.oldGeneration) || 0);
    }
    if (op.type === 'train-load' || op.type === 'train-depart') {
      const hub = targetState?.train;
      if (!hub || hub.date !== op.day) return true;
      if (Array.isArray(hub.appliedOps) && hub.appliedOps.includes(op.id)) return true;
      const slot = Array.isArray(hub.slots) ? hub.slots.find(item => Number(item?.index) === Number(op.slotIndex)) : null;
      if (!slot) return false;
      const remoteGeneration = Math.max(0, Number(slot.generation) || 0);
      const opGeneration = Math.max(0, Number(op.generation) || 0);
      if (remoteGeneration > opGeneration) return true;
      if (remoteGeneration < opGeneration || slot.train?.id !== op.trainId) return false;
      if (op.type === 'train-depart') return Boolean(slot.train?.departed);
      return Array.isArray(slot.train?.appliedOps) && slot.train.appliedOps.includes(op.id);
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

      if (op.type === 'claim-daily-mastery') {
        if (op.day === farmDay && applyDailyMasteryReward(op.points, op.day, {silent:true})) changed = true;
        continue;
      }

      if (op.type === 'daily-reroll') {
        if (op.day === farmDay && applyDailyRerollMutation(op)) changed = true;
        continue;
      }

      if (op.type === 'npc-player-visit') {
        if (applyNpcPlayerVisitMutation(op, {silent:true})) changed = true;
        continue;
      }

      if (op.type === 'npc-steal') {
        if (applyNpcStealMutation(op, {silent:true})) changed = true;
        continue;
      }

      if (op.type === 'npc-friend-set') {
        if (applyNpcFriendSetMutation(op)) changed = true;
        continue;
      }

      if (op.type === 'npc-help-bug') {
        if (applyNpcHelpMutation(op, {silent:true})) changed = true;
        continue;
      }

      if (op.type === 'npc-help-water') {
        if (applyNpcWaterHelpMutation(op, {silent:true})) changed = true;
        continue;
      }

      if (op.type === 'npc-visit') {
        if (applyNpcVisitMutation(op)) changed = true;
        continue;
      }

      if (op.type === 'train-reroll') {
        if (applyTrainRerollMutation(op, {silent:true})) changed = true;
        continue;
      }

      if (op.type === 'train-load') {
        if (applyTrainLoadMutation(op, {silent:true})) changed = true;
        continue;
      }

      if (op.type === 'train-depart') {
        if (applyTrainDepartMutation(op, {silent:true})) changed = true;
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
          bumpDaily('fertilize', 1);
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
          plot.friendWatered = false;
          plot.friendWateredBy = '';
          plot.friendWateredByName = '';
          plot.friendWateredAt = null;
          plot.fertilizerId = null;
          plot.hasPest = Boolean(item.hasPest);
          plot.eventGrowFactor = Math.max(0.90, Math.min(1, Number(item.eventGrowFactor) || 1));
          state.stats.plant += 1;
          bumpDaily('plant', 1);
          if (op.cropId === 'mystery') {
            state.stats.blindBoxPlant += 1;
            bumpDaily('mysteryPlant', 1);
          } else bumpDailyCrop('plantByCrop', op.cropId, 1);
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
    el.innerHTML = `${uiIconMarkup('cloud','is-cloud-ui')}${escapeHtml(String(text).replace(/^☁️?\s*/,''))}`;
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
      /get_farm_clock_v1|get_farm_day_v1|get_farm_rankings_v2|get_farm_friends_v3|get_farm_friends_v2|get_friend_farm_v6|get_friend_farm_v5|get_friend_farm_v4|get_friend_farm_v3|get_friend_farm_v2|help_friend_water_v1|help_friend_bug_all_v1|help_friend_bug_v1|get_farm_activity_v2|get_farm_activity_v1|get_farm_activity_unread_v1|farm_activity|steal_friend_crop_v4|steal_friend_crop_v3|steal_friend_crop_v2|get_farm_steal_activity_v1|get_farm_rankings|get_farm_friends|get_friend_farm|steal_friend_crop|request_farm_friend|farm_friendships|farm_steals|schema cache|does not exist|could not find/i.test(text);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function genderSymbol(sex) {
    return sex === 'male' ? '♂' : sex === 'female' ? '♀' : '';
  }

  function coinInline(value, {label=false} = {}) {
    return `<span class="farm-coin-inline">${uiIconMarkup('coin','farm-coin-mini')}<span>${formatNumber(value)}</span>${label ? '<small>金币</small>' : ''}</span>`;
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
        setCloudStatus('setup', '☁ 云端同步暂不可用');
      } else if (/permission denied|42501/i.test(text)) {
        setCloudStatus('setup', '☁ 云端同步需要更新');
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
      if (/revision|save_farm_state_v3|PGRST202/i.test(text)) setCloudStatus('setup', '☁ 云端同步暂不可用');
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
    const fallbackClock = localFarmEventSlot();

    const applyClock = (day, slotKey) => {
      let changed = false;
      const safeDay = typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : fallbackClock.day;
      const safeSlot = typeof slotKey === 'string' && /^\d{4}-\d{2}-\d{2}-[0-5]$/.test(slotKey) ? slotKey : fallbackClock.key;
      if (safeDay !== farmDay || state.daily?.date !== safeDay) {
        ensureDailyState(safeDay, {persist:true});
        changed = true;
      } else {
        farmDay = safeDay;
      }
      if (safeSlot !== farmEventSlotKey) {
        farmEventSlotKey = safeSlot;
        renderDailyEventScene();
        changed = true;
      }
      return changed;
    };

    if (!sb || !user?.id || (!force && farmDaySyncAt && now - farmDaySyncAt < FARM_DAY_SYNC_MS)) {
      if (applyClock(fallbackClock.day, fallbackClock.key)) renderAll();
      return farmDay;
    }

    try {
      let day = fallbackClock.day;
      let slotKey = fallbackClock.key;
      const clockResult = await sb.rpc('get_farm_clock_v1');
      if (!clockResult.error && clockResult.data && typeof clockResult.data === 'object') {
        day = String(clockResult.data.day || day);
        slotKey = String(clockResult.data.slot_key || slotKey);
      } else {
        const legacyResult = await sb.rpc('get_farm_day_v1');
        if (!legacyResult.error && typeof legacyResult.data === 'string') day = legacyResult.data;
      }
      farmDaySyncAt = Date.now();
      if (applyClock(day, slotKey)) renderAll();
      return farmDay;
    } catch (error) {
      if (applyClock(fallbackClock.day, fallbackClock.key)) renderAll();
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
    try { await window.XingchenAuth?.syncProfile?.(false); } catch (_) {}
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
        ? '多人农场暂时不可用，请稍后再试。'
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
      let {data, error} = await sb.rpc('get_farm_friends_v3');
      if (error && /get_farm_friends_v3|PGRST202|function .* does not exist/i.test(String(error?.message || error))) {
        ({data, error} = await sb.rpc('get_farm_friends_v2'));
      }
      if (error) throw error;
      friendRows = (Array.isArray(data) ? data : []).map(row => ({
        ...row,
        mature_count:Math.max(0,Number(row?.mature_count) || 0),
        stealable_count:Math.max(0,Number(row?.stealable_count) || 0),
        pest_count:Math.max(0,Number(row?.pest_count) || 0),
        help_water_count:Math.max(0,Number(row?.help_water_count) || 0),
        interaction_score:Math.max(0,Number(row?.interaction_score) || 0)
      }));
      friendsLoadedAt = Date.now();
      syncFriendStat(friendRows);
      renderFriendDot();
    } catch (error) {
      friendRows = [];
      renderFriendDot();
      friendsError = multiplayerMissing(error)
        ? '好友系统暂时不可用，请稍后再试。'
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
      let {data, error} = await sb.rpc('get_farm_activity_v2', {p_limit:50, p_mark_seen:Boolean(markSeen)});
      if (error && /get_farm_activity_v2|PGRST202|function .* does not exist/i.test(String(error?.message || error))) {
        ({data, error} = await sb.rpc('get_farm_activity_v1', {p_limit:50, p_mark_seen:Boolean(markSeen)}));
        if (!error) data = (Array.isArray(data) ? data : []).map(row => ({...row,direction:'received',peer_id:row.actor_id}));
      }
      if (error) throw error;
      farmActivityRows = Array.isArray(data) ? data : [];
      const returnedUnread = farmActivityRows.filter(row => (row.direction || 'received') === 'received' && row.is_unread).length;
      farmActivityUnreadCount = markSeen ? 0 : returnedUnread;
      farmActivityLoadedAt = Date.now();
      farmActivityUnreadCheckedAt = Date.now();
      renderFriendDot();
    } catch (error) {
      farmActivityRows = [];
      farmActivityUnreadCount = 0;
      renderFriendDot();
      farmActivityError = multiplayerMissing(error)
        ? '农场动态暂时不可用，请稍后再试。'
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
      toast('好友申请失败', multiplayerMissing(error) ? '好友功能暂时不可用，请稍后再试。' : '请稍后再试。');
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
      toast('好友操作失败', multiplayerMissing(error) ? '好友功能暂时不可用，请稍后再试。' : '请稍后再试。');
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
      toast('好友操作失败', multiplayerMissing(error) ? '好友功能暂时不可用，请稍后再试。' : '请稍后再试。');
    }
  }


  function friendInteractionSummaryFromPayload(payload, {npc=false} = {}) {
    const level = Math.max(1,Number(payload?.level) || 1);
    const unlocked = unlockedLandCount(level);
    const friendId = String(payload?.user_id || '');
    const plots = Array.isArray(payload?.plots) ? payload.plots : [];
    const summary = {mature:0,stealable:0,pest:0,water:0,score:0};
    for (let index=0; index<Math.min(PLOT_COUNT,plots.length); index+=1) {
      if (index >= unlocked) break;
      const plot = plots[index] || {};
      const crop = cropById(plot.cropId);
      if (!crop) continue;
      const normalized = {
        ...plot,
        plantedAt:Number(plot.plantedAt) || null,
        watered:Boolean(plot.watered),
        friendWatered:Boolean(plot.friendWatered),
        fertilizerId:FERTILIZERS.some(item => item.id === plot.fertilizerId) ? plot.fertilizerId : null,
        eventGrowFactor:Math.max(.90,Math.min(1,Number(plot.eventGrowFactor) || 1))
      };
      const progress = progressFor(normalized,crop);
      if (normalized.hasPest) summary.pest += 1;
      if (!crop.isMystery && progress < 1 && !normalized.friendWatered) summary.water += 1;
      if (progress >= 1) {
        summary.mature += 1;
        const total = crop.isMystery ? 1 : Math.max(crop.yieldMin,Math.min(crop.yieldMax,Number(plot.harvestYield) || crop.yieldMin));
        const remain = Math.max(1,total - Math.max(0,Number(plot.stolenCount) || 0));
        if (!crop.isMystery && remain > 1) {
          if (npc) {
            const cycleId = String(plot.cycleId || npcCropCycleId(friendId,index,crop.id,plot.plantedAt));
            if (!plot.stolenByMe && !hasNpcStolenCycle(friendId,index,cycleId) && npcStealsInWindow(friendId) < NPC_STEAL_CAP_PER_WINDOW) summary.stealable += 1;
          } else if (!plot.stolenByMe) summary.stealable += 1;
        }
      }
    }
    summary.score = summary.stealable*100 + summary.pest*40 + summary.water*10;
    return summary;
  }

  function dailyVisitedFriendSet() {
    ensureDailyState(farmDay, {persist:false});
    return new Set((Array.isArray(state?.daily?.visitedFriends) ? state.daily.visitedFriends : []).map(String));
  }

  function friendPatrolRoster() {
    const real = friendRows.filter(row => row.relation_state === 'friend')
      .slice()
      .sort((a,b) => (Number(b.interaction_score)||0) - (Number(a.interaction_score)||0) || String(a.display_name||'').localeCompare(String(b.display_name||''),'zh-Hans-CN'))
      .map(row => ({
        id:String(row.user_id || ''), npc:false, name:String(row.display_name || '农场好友'),
        score:Math.max(0,Number(row.interaction_score)||0)
      }))
      .filter(item => item.id);
    const npcs = npcFriendIds().map(npcById).filter(Boolean).map(npc => {
      const summary = friendInteractionSummaryFromPayload(buildNpcFarmPayload(npc.id), {npc:true});
      return {id:npc.id, npc:true, name:npc.name, score:Math.max(0,Number(summary?.score)||0)};
    }).sort((a,b) => b.score - a.score || a.name.localeCompare(b.name,'zh-Hans-CN'));
    return [...real, ...npcs];
  }

  function patrolKey(id, npc=false) { return `${npc ? 'npc' : 'friend'}:${String(id || '')}`; }

  function rememberFriendListPosition(id='', npc=false) {
    if (activePanel === 'friends' && activeFriendTab === 'friends' && $('farmModalBody')?.querySelector('.farm-friend-tabs')) {
      const dialog = document.querySelector('.farm-modal-dialog');
      if (dialog) friendListScrollTop = Math.max(0, Number(dialog.scrollTop) || 0);
    }
    friendListFocusId = String(id || friendListFocusId || '');
    friendListFocusNpc = Boolean(npc);
  }

  function restoreFriendListPositionSoon() {
    if (!friendListRestorePending || activePanel !== 'friends' || activeFriendTab !== 'friends') return;
    requestAnimationFrame(() => {
      if (activePanel !== 'friends' || activeFriendTab !== 'friends') return;
      const dialog = document.querySelector('.farm-modal-dialog');
      const body = $('farmModalBody');
      if (!dialog || !body) return;
      let target = null;
      if (friendListFocusId) {
        const selector = `[data-friend-card-id="${CSS.escape(friendListFocusId)}"][data-friend-card-kind="${friendListFocusNpc ? 'npc' : 'friend'}"]`;
        target = body.querySelector(selector);
      }
      if (target) {
        const dRect = dialog.getBoundingClientRect();
        const tRect = target.getBoundingClientRect();
        const desired = dialog.scrollTop + (tRect.top - dRect.top) - Math.max(72,(dialog.clientHeight - tRect.height) * .34);
        dialog.scrollTop = Math.max(0, desired);
        target.classList.add('is-return-target');
        setTimeout(() => target?.classList.remove('is-return-target'), 1200);
      } else {
        dialog.scrollTop = friendListScrollTop;
      }
      if (!friendsLoading && friendsLoadedAt) friendListRestorePending = false;
    });
  }

  function returnToFriendList() {
    activeFriendTab = 'friends';
    friendListRestorePending = true;
    openPanel('friends', {friendTab:'friends'});
  }

  function patrolNavMarkup(friendId, npc=false) {
    const roster = friendPatrolRoster();
    const key = patrolKey(friendId,npc);
    const index = roster.findIndex(item => patrolKey(item.id,item.npc) === key);
    const position = index >= 0 ? index + 1 : 1;
    const total = Math.max(1, roster.length);
    const prev = index > 0 ? roster[index - 1] : null;
    const next = index >= 0 && index < roster.length - 1 ? roster[index + 1] : null;
    const hasNextInteractive = roster.some((item, i) => i !== index && item.score > 0);
    const visited = dailyVisitedFriendSet();
    const visitCount = roster.filter(item => visited.has(String(item.id))).length;
    const button = (item, dir, label) => `<button type="button" class="farm-patrol-button" data-patrol-step="${dir}" ${item ? '' : 'disabled'} title="${item ? escapeHtml(item.name) : ''}">${label}</button>`;
    return `<nav class="farm-patrol-bar" aria-label="农友巡田快速导航">
      <div class="farm-patrol-progress"><b>巡田 ${position} / ${total}</b><small>今日已访 ${visitCount} / ${total}</small></div>
      <div class="farm-patrol-controls">
        ${button(prev,-1,'‹ 上一位')}
        <button type="button" class="farm-patrol-button is-list" data-return-friend-list>${uiIconMarkup('friends','is-patrol-ui')} 好友列表</button>
        ${button(next,1,'下一位 ›')}
        <button type="button" class="farm-patrol-button is-hot" data-patrol-interactable ${hasNextInteractive ? '' : 'disabled'}>🔥 下一个可互动</button>
      </div>
    </nav>`;
  }

  async function navigateFriendPatrol(mode) {
    if (friendPatrolBusy) return;
    const roster = friendPatrolRoster();
    if (!roster.length) { toast('👥 暂无可巡农友','返回好友列表看看吧。'); return; }
    let index = roster.findIndex(item => patrolKey(item.id,item.npc) === patrolKey(currentPatrolId,currentPatrolNpc));
    if (index < 0) index = 0;
    let target = null;
    if (mode === 'interactive') {
      for (let offset=1; offset<roster.length; offset += 1) {
        const candidate = roster[(index + offset) % roster.length];
        if (candidate?.score > 0) { target = candidate; break; }
      }
      if (!target) { toast('🌱 暂无其他可互动农友','目前没有成熟可偷、虫害或可助力的其他农田。'); return; }
    } else {
      const nextIndex = index + Number(mode || 0);
      if (nextIndex < 0 || nextIndex >= roster.length) return;
      target = roster[nextIndex];
    }
    if (!target) return;
    friendPatrolBusy = true;
    rememberFriendListPosition(target.id,target.npc);
    try {
      if (target.npc) visitNpcFarm(target.id, {logVisit:true});
      else await visitFriend(target.id, {logVisit:true});
    } finally {
      friendPatrolBusy = false;
    }
  }

  function syncFriendOverviewFromPayload(friendId, payload) {
    const row = friendRows.find(item => item.relation_state === 'friend' && String(item.user_id) === String(friendId));
    if (!row) return;
    const summary = friendInteractionSummaryFromPayload(payload,{npc:false});
    row.mature_count = summary.mature;
    row.stealable_count = summary.stealable;
    row.pest_count = summary.pest;
    row.help_water_count = summary.water;
    row.interaction_score = summary.score;
  }

  function renderFriendFarmVisit(payload, {npc=false} = {}) {
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
        cycleId:typeof raw?.cycleId === 'string' ? raw.cycleId : '',
        resultCropId:CROPS.some(c => c.id === raw?.resultCropId) ? raw.resultCropId : null,
        harvestYield:Number(raw?.harvestYield) || null,
        stolenCount:Math.max(0, Number(raw?.stolenCount) || 0),
        stolenByMe:Boolean(raw?.stolenByMe),
        watered:Boolean(raw?.watered),
        friendWatered:Boolean(raw?.friendWatered),
        friendWateredByName:typeof raw?.friendWateredByName === 'string' ? raw.friendWateredByName.slice(0,80) : '',
        friendWateredAt:Math.max(0,Number(raw?.friendWateredAt) || 0) || null,
        fertilizerId:FERTILIZERS.some(item => item.id === raw?.fertilizerId) ? raw.fertilizerId : null,
        hasPest:Boolean(raw?.hasPest),
        eventGrowFactor:Math.max(0.90, Math.min(1, Number(raw?.eventGrowFactor) || 1))
      };
    });
    let matureCount = 0;
    let stealableCount = 0;
    let pestCount = 0;
    let waterHelpCount = 0;
    const tiles = [];

    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        const index = row * 5 + col;
        const plot = plots[index];
        let cls = 'farm-plot farm-visit-plot';
        let content = '';

        if (index >= unlocked) {
          cls += ' is-locked';
          content = `<span class="farm-soil">${uiIconMarkup('lock','is-plot-lock-ui')}<small>Lv.${unlockLevelForPlot(index)}</small></span>`;
        } else if (!plot.cropId || !cropById(plot.cropId)) {
          cls += ' is-empty';
          content = '<span class="farm-soil"><i>·</i><small>空地</small></span>';
        } else {
          const crop = cropById(plot.cropId);
          const progress = progressFor(plot, crop);
          const stage = stageFor(progress);
          const remainingMs = remainingFor(plot, crop);
          const shown = displayCropForPlot(plot, crop, progress);
          const canHelpWater = !crop.isMystery && progress < 1 && !plot.friendWatered;
          if (plot.hasPest) pestCount += 1;
          if (canHelpWater) waterHelpCount += 1;
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
            if (npc) {
              const cycleId = plot.cycleId || npcCropCycleId(friendId, index, crop.id, plot.plantedAt);
              const used = npcStealsInWindow(friendId);
              if (crop.isMystery || remain <= 1) {
                stealTag = '<span class="farm-steal-tag is-protected">保底 1</span>';
              } else if (plot.stolenByMe || hasNpcStolenCycle(friendId, index, cycleId)) {
                stealTag = '<span class="farm-steal-tag is-done">已偷过</span>';
              } else if (used >= NPC_STEAL_CAP_PER_WINDOW) {
                stealTag = '<span class="farm-steal-tag is-protected">本时段已达上限</span>';
              } else {
                cls += ' can-steal';
                stealableCount += 1;
                stealTag = `<button type="button" class="farm-steal-hitbox" data-steal-npc="${escapeHtml(friendId)}" data-steal-plot="${index}" data-steal-cycle="${escapeHtml(cycleId)}" aria-label="偷取 ${escapeHtml(shown.name)}"></button><span class="farm-steal-tag">偷菜 ×1</span>`;
              }
            } else if (crop.isMystery || remain <= 1) {
              stealTag = '<span class="farm-steal-tag is-protected">保底 1</span>';
            } else if (plot.stolenByMe) {
              stealTag = '<span class="farm-steal-tag is-done">已偷过</span>';
            } else {
              cls += ' can-steal';
              stealableCount += 1;
              stealTag = `<button type="button" class="farm-steal-hitbox" data-steal-friend="${escapeHtml(friendId)}" data-steal-plot="${index}" aria-label="偷取 ${escapeHtml(shown.name)}"></button><span class="farm-steal-tag">偷菜 ×1</span>`;
            }
          }

          const bugAction = !npc && plot.hasPest
            ? `<button type="button" class="farm-friend-care-chip is-bug" data-help-bug-friend="${escapeHtml(friendId)}" data-help-bug-plot="${index}" aria-label="帮好友除虫">${eventSpriteMarkup(6,'is-help-net')}<span>除虫</span></button>` : '';
          const waterAction = canHelpWater
            ? npc
              ? `<button type="button" class="farm-friend-care-chip is-water" data-help-water-npc="${escapeHtml(friendId)}" data-help-water-plot="${index}" aria-label="帮 NPC 农友助力浇水">${itemSpriteMarkup(10,'is-help-water')}<span>助力 -5%</span></button>`
              : `<button type="button" class="farm-friend-care-chip is-water" data-help-water-friend="${escapeHtml(friendId)}" data-help-water-plot="${index}" aria-label="帮好友助力浇水">${itemSpriteMarkup(10,'is-help-water')}<span>助力 -5%</span></button>`
            : '';
          const careActions = bugAction || waterAction ? `<span class="farm-friend-care-actions">${bugAction}${waterAction}</span>` : '';
          const helpedTag = plot.friendWatered
            ? `<span class="farm-friend-watered-tag" title="本轮已接受好友助力">💙 ${escapeHtml(plot.friendWateredByName || (npc ? '你' : '好友'))}助力 -5%</span>` : '';
          content = `<span class="farm-soil"><small class="farm-crop-time">${progress >= 1 ? '已成熟' : formatDuration(remainingMs)}</small>${cropVisualMarkup(shown, progress)}<span class="farm-crop-name">${shown.name}</span>${plot.hasPest ? eventSpriteMarkup(5,'farm-pest-mark','虫害') : ''}${careStatusMarkup(plot)}${helpedTag}${stealTag}${careActions}</span>`;
        }

        tiles.push(`<div class="${cls}" style="--farm-row:${row};--farm-col:${col};--farm-depth:${(row * 10) + col}">${content}</div>`);
      }
    }

    const rawName = String(payload?.display_name || '星辰农友');
    const name = escapeHtml(rawName);
    const sex = genderSymbol(payload?.sex);
    const friendTitle = titleById(payload?.title_id || 'newbie');
    const friendOutfit = avatarOutfitById(payload?.avatar?.outfit || 'default');
    const friendGender = payload?.sex === 'female' ? 'female' : 'male';
    const friendAvatar = `<div class="farm-visit-owner-avatar" title="${escapeHtml(`${rawName} · ${friendOutfit.name}`)}">${avatarSpriteMarkupFor(friendGender, friendOutfit.id, 'is-visit-avatar', `${rawName} · ${friendOutfit.name}`)}</div>`;
    const friendPetEntry = petById(payload?.pet?.active || '');
    const friendPet = friendPetEntry && friendPetEntry.released
      ? `<div class="farm-visit-owner-pet" title="${escapeHtml(`${rawName}的宠物 · ${friendPetEntry.name}`)}">${petSpriteMarkup('is-visit-pet', `${rawName}的宠物 ${friendPetEntry.name}`, friendPetEntry.id)}</div>`
      : '';
    const bugAllButton = npc
      ? `<button type="button" class="farm-visit-care-button" disabled>${eventSpriteMarkup(6,'is-care-toolbar-icon')} 一键帮忙除虫 <b>0</b></button>`
      : `<button type="button" class="farm-visit-care-button" data-help-bug-all="${escapeHtml(friendId)}" ${pestCount ? '' : 'disabled'}>${eventSpriteMarkup(6,'is-care-toolbar-icon')} 一键帮忙除虫 <b>${pestCount}</b></button>`;
    const waterAllButton = npc
      ? `<button type="button" class="farm-visit-care-button is-water" data-help-water-all-npc="${escapeHtml(friendId)}" ${waterHelpCount ? '' : 'disabled'}>${itemSpriteMarkup(10,'is-care-toolbar-icon')} 一键帮忙浇水 <b>${waterHelpCount}</b></button>`
      : `<button type="button" class="farm-visit-care-button is-water" data-help-water-all="${escapeHtml(friendId)}" ${waterHelpCount ? '' : 'disabled'}>${itemSpriteMarkup(10,'is-care-toolbar-icon')} 一键帮忙浇水 <b>${waterHelpCount}</b></button>`;

    return `
      <section class="farm-visit-summary ${npc ? 'is-npc-farm' : ''}">
        <div><b>${name}${sex ? ` <i>${sex}</i>` : ''}${npc ? ' <span class="farm-npc-badge">NPC</span>' : ''}</b><small>Lv.${formatNumber(friendLevel)} · <span class="farm-public-title">${uiIconMarkup(titleUiIconKey(friendTitle.id),'is-public-title-ui')}【${escapeHtml(friendTitle.name)}】</span></small></div>
        <span>${coinInline(payload?.coins || 0, {label:true})}</span>
        <em>成熟 ${matureCount} · 可偷 ${stealableCount} · 虫害 ${pestCount} · 可助力 ${waterHelpCount}</em>
      </section>
      <div class="farm-steal-rule">${npc ? `${uiIconMarkup('steal','is-inline-ui')} NPC 农友不参加排行榜、也不会偷你的菜；成熟作物每个生长周期只能偷 1 次，每位 NPC 每 4 小时最多偷 2 格。成长中的普通作物也可以接受一次好友助力 -5%。` : `${uiIconMarkup('cooperate','is-inline-ui')} 好友成熟作物每轮可偷 1 个；有虫害可以帮忙除虫，成长中的普通作物每轮还能接受一次好友助力浇水，额外缩短 5% 收获时间。`}</div>
      <div class="farm-visit-care-toolbar">${bugAllButton}${waterAllButton}</div>
      <div class="farm-visit-scene">
        ${renderFriendDecorations(payload)}
        ${friendAvatar}
        ${friendPet}
        <div class="farm-visit-field">${tiles.join('')}</div>
      </div>
      ${patrolNavMarkup(friendId,npc)}`;
  }

  async function visitFriend(friendId, {logVisit=true} = {}) {
    const sb = cloudClient();
    const user = cloudAuthUser();
    if (!sb || !user?.id || !friendId) return;

    openModal({
      icon:'farm-expert', eyebrow:'FARM VISIT', title:'正在前往好友农场',
      subtitle:'正在读取好友最新的云端农场状态。',
      body:'<div class="farm-network-state"><span class="farm-spinner"></span><b>沿着小路走过去…</b></div>'
    });

    try {
      let usedFriendFarmV7 = true;
      let {data, error} = await sb.rpc('get_friend_farm_v7', {p_friend:friendId, p_log_visit:Boolean(logVisit)});
      if (error && /get_friend_farm_v7|PGRST202|function .* does not exist/i.test(String(error?.message || error))) {
        usedFriendFarmV7 = false;
        ({data, error} = await sb.rpc('get_friend_farm_v6', {p_friend:friendId, p_log_visit:Boolean(logVisit)}));
      }
      if (error && /get_friend_farm_v6|PGRST202|function .* does not exist/i.test(String(error?.message || error))) {
        ({data, error} = await sb.rpc('get_friend_farm_v5', {p_friend:friendId, p_log_visit:Boolean(logVisit)}));
      }
      if (error && /get_friend_farm_v5|PGRST202|function .* does not exist/i.test(String(error?.message || error))) {
        ({data, error} = await sb.rpc('get_friend_farm_v4', {p_friend:friendId, p_log_visit:Boolean(logVisit)}));
      }
      if (error) throw error;
      const payload = data && typeof data === 'object' ? data : {};
      if (!payload.ok) {
        const message = payload.reason === 'not_friend' ? '只有已经互相确认的好友才能拜访农场。'
          : payload.reason === 'no_farm' ? '这位好友还没有建立云端农场。'
          : '暂时无法进入这座农场。';
        openModal({icon:'farm-expert', eyebrow:'FARM VISIT', title:'暂时无法拜访', subtitle:message, body:'<div class="farm-visit-actions"><button type="button" class="farm-friend-action" data-return-friend-list>返回好友列表</button></div>'});
        return;
      }
      let socialAward = 0;
      if (typeof payload.farm_day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(payload.farm_day)) farmDay = payload.farm_day;
      if (payload.helper_state && typeof payload.helper_state === 'object') {
        state = normalizeState(payload.helper_state);
        state.ownerUserId = user.id;
        writeLocalState();
        socialAward = Math.max(0, Number(payload.social_exp_awarded) || 0);
        await pullCloudState({preferRemote:true});
        renderTaskDot();
      } else if (usedFriendFarmV7 && Object.prototype.hasOwnProperty.call(payload, 'new_daily_visit')) {
        // V7 is authoritative across devices. A repeated visit may have been
        // recorded by another device, in which case the server intentionally
        // omits helper_state to avoid an unnecessary farm_saves write. Never
        // award a second local +2 EXP in that case; refresh only if this tab's
        // daily snapshot is stale.
        const visited = Array.isArray(state.daily?.visitedFriends) ? state.daily.visitedFriends.map(String) : [];
        const serverSocial = Math.min(DAILY_SOCIAL_EXP_CAP, Math.max(0, Number(payload.social_exp_today) || 0));
        if (logVisit && (!visited.includes(String(friendId)) || Math.max(0, Number(state.daily?.socialExp) || 0) !== serverSocial)) {
          await pullCloudState({preferRemote:true});
          renderTaskDot();
        }
      } else if (!usedFriendFarmV7 && logVisit && bumpDaily('visit', 1, friendId)) {
        // Compatibility path for sites that have not applied migration 025 yet.
        state.stats.friendVisits = Math.max(0, Number(state.stats.friendVisits) || 0) + 1;
        socialAward = grantDailySocialExp(DAILY_SOCIAL_VISIT_EXP, {silent:true});
        saveState();
        renderTaskDot();
      }
      currentPatrolId = String(friendId);
      currentPatrolNpc = false;
      friendListFocusId = String(friendId);
      friendListFocusNpc = false;
      syncFriendOverviewFromPayload(friendId,payload);
      openModal({
        icon:'farm-expert', eyebrow:'FARM VISIT',
        title:`${payload.display_name || '好友'}的农场`,
        subtitle:'看看好友最近种了什么；成熟可偷、虫害可除，成长中的普通作物还能助力浇水 -5%。',
        body:renderFriendFarmVisit(payload)
      });
      if (socialAward > 0) {
        toast('👣 今日拜访奖励', `EXP +${socialAward} · 农友互助 ${Math.min(DAILY_SOCIAL_EXP_CAP, Number(state.daily?.socialExp) || 0)}/${DAILY_SOCIAL_EXP_CAP}`, 'care');
      }
    } catch (error) {
      const detail = multiplayerMissing(error)
        ? '好友互动暂时不可用，请稍后再试。'
        : '好友农场暂时读取失败，请稍后再试。';
      openModal({icon:'farm-expert', eyebrow:'FARM VISIT', title:'拜访失败', subtitle:detail, body:'<div class="farm-visit-actions"><button type="button" class="farm-friend-action" data-return-friend-list>返回好友列表</button></div>'});
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
      tile.closest('.farm-plot')?.classList.add('is-stealing');
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
      toast(`🥷 偷到 ${crop.name} ×1`, `好友这格至少还保留 ${Number(payload.owner_remaining) || 1} 个。`, 'harvest');
      friendsLoadedAt = 0;
      farmActivityLoadedAt = 0;
      // Defer the heavier all-friends overview until the list is actually reopened.
      await new Promise(resolve => setTimeout(resolve, 260));
      await visitFriend(friendId, {logVisit:false});
    } catch (error) {
      toast('🥷 偷菜失败', multiplayerMissing(error) ? '偷菜功能暂时不可用，请稍后再试。' : '网络暂时不稳定，请稍后再试。');
      if (tile) {
        tile.disabled = false;
        tile.classList.remove('is-stealing');
        tile.closest('.farm-plot')?.classList.remove('is-stealing');
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
      friendsLoadedAt = 0;
      farmActivityLoadedAt = 0;
      // Defer the heavier all-friends overview until the list is actually reopened.
      await visitFriend(friendId,{logVisit:false});
    } catch (error) {
      toast('🐛 帮忙除虫失败', multiplayerMissing(error) ? '好友互动暂时不可用，请稍后再试。' : '网络暂时不稳定，请稍后再试。');
      if (btn) btn.disabled=false;
    }
  }

  async function helpFriendBugAll(friendId) {
    const sb = cloudClient();
    const user = cloudAuthUser();
    if (!sb || !user?.id || !friendId) return;
    const button = document.querySelector(`[data-help-bug-all="${CSS.escape(friendId)}"]`);
    if (button) button.disabled = true;
    try {
      const {data,error} = await sb.rpc('help_friend_bug_all_v1',{p_friend:friendId});
      if (error) throw error;
      const payload = data && typeof data === 'object' ? data : {};
      if (!payload.ok) {
        toast(payload.reason === 'no_pest' ? '🌿 暂时没有虫害' : '🐛 一键除虫没有完成', payload.reason === 'no_pest' ? '好友农田目前很健康。' : '请刷新好友农场后再试。');
        await visitFriend(friendId,{logVisit:false});
        return;
      }
      if (payload.helper_state && typeof payload.helper_state === 'object') {
        state = normalizeState(payload.helper_state); state.ownerUserId=user.id; writeLocalState(); renderAll(); await pullCloudState({preferRemote:true});
      }
      const rewardBits = [];
      const rewardPayload = payload.rewards && typeof payload.rewards === 'object' ? payload.rewards : {};
      if (Number(rewardPayload.coins) > 0) rewardBits.push(`金币 +${Math.floor(Number(rewardPayload.coins))}`);
      if (Number(rewardPayload.exp) > 0) rewardBits.push(`EXP +${Math.floor(Number(rewardPayload.exp))}`);
      if (Number(rewardPayload.mystery) > 0) rewardBits.push(`蔬果盲盒 ×${Math.floor(Number(rewardPayload.mystery))}`);
      toast('🪲 一键帮忙除虫完成',`一次处理了 ${Math.max(1,Number(payload.count)||1)} 格虫害。${rewardBits.length ? ` · ${rewardBits.join(' · ')}` : ''}`,'care');
      friendsLoadedAt = 0;
      farmActivityLoadedAt = 0;
      // Defer the heavier all-friends overview until the list is actually reopened.
      await visitFriend(friendId,{logVisit:false});
    } catch (error) {
      toast('🐛 一键除虫失败', multiplayerMissing(error) ? '好友互动暂时不可用，请稍后再试。' : '网络暂时不稳定，请稍后再试。');
      if (button) button.disabled=false;
    }
  }

  async function helpFriendWater(friendId, plotId = null) {
    const sb = cloudClient();
    const user = cloudAuthUser();
    if (!sb || !user?.id || !friendId) return;
    const safePlot = plotId === null || plotId === undefined || plotId === '' ? null : (Number.isInteger(Number(plotId)) ? Number(plotId) : null);
    const selector = safePlot === null
      ? `[data-help-water-all="${CSS.escape(friendId)}"]`
      : `[data-help-water-friend="${CSS.escape(friendId)}"][data-help-water-plot="${safePlot}"]`;
    const button = document.querySelector(selector);
    if (button) button.disabled = true;
    try {
      const {data,error} = await sb.rpc('help_friend_water_v1',{p_friend:friendId,p_plot:safePlot});
      if (error) throw error;
      const payload = data && typeof data === 'object' ? data : {};
      if (!payload.ok) {
        const msg = payload.reason === 'no_eligible'
          ? ['💧 暂时没有可助力的作物','已成熟、盲盒或已经接受过好友助力的作物不会重复浇水。']
          : payload.reason === 'not_friend'
            ? ['👥 无法帮忙','只有已经确认的农场好友才能助力浇水。']
            : ['💧 助力浇水没有完成','请刷新好友农场后再试。'];
        toast(msg[0],msg[1]);
        await visitFriend(friendId,{logVisit:false});
        return;
      }
      const count = Math.max(1,Number(payload.count)||1);
      let socialAward = Math.max(0, Number(payload.social_exp_awarded) || 0);
      if (typeof payload.farm_day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(payload.farm_day)) farmDay = payload.farm_day;
      if (payload.helper_state && typeof payload.helper_state === 'object') {
        state = normalizeState(payload.helper_state);
        state.ownerUserId = user.id;
        writeLocalState();
        await pullCloudState({preferRemote:true});
        renderTaskDot();
      } else {
        // Compatibility fallback before migration 025: keep the UI usable and
        // grant the social EXP locally until the server migration is applied.
        state.stats.helpWater = Math.max(0, Number(state.stats.helpWater) || 0) + count;
        bumpDaily('helpWater', count);
        socialAward = grantDailySocialExp(count * DAILY_SOCIAL_WATER_EXP, {silent:true});
        saveState();
      }
      const socialText = socialAward > 0
        ? ` · EXP +${socialAward}（今日互助 ${Math.min(DAILY_SOCIAL_EXP_CAP, Number(state.daily?.socialExp) || 0)}/${DAILY_SOCIAL_EXP_CAP}）`
        : ` · 今日互助 EXP ${Math.min(DAILY_SOCIAL_EXP_CAP, Number(state.daily?.socialExp) || 0)}/${DAILY_SOCIAL_EXP_CAP}`;
      toast('💧 好友助力完成',`帮好友 ${count} 格作物额外缩短 5% 收获时间${socialText}`,'care');
      friendsLoadedAt = 0;
      farmActivityLoadedAt = 0;
      // Defer the heavier all-friends overview until the list is actually reopened.
      await visitFriend(friendId,{logVisit:false});
    } catch (error) {
      toast('💧 助力浇水失败', multiplayerMissing(error) ? '好友助力暂时不可用，请稍后再试。' : '网络暂时不稳定，请稍后再试。');
      if (button) button.disabled=false;
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
    const landText = item.newPlots?.length ? `<span>${uiIconMarkup('newbie-farmer','is-inline-ui')} 新农地 ×${item.newPlots.length}</span>` : '';
    const cropText = item.crops?.length ? `<span>${uiIconMarkup('harvest-expert','is-inline-ui')} 解锁 ${item.crops.map(c => escapeHtml(c.name)).join('、')}</span>` : '';
    overlay.innerHTML = `<div class="farm-level-up-card"><small>STELLAR FARM</small><b>LEVEL UP!</b><strong>Lv.${item.from} <i>→</i> Lv.${item.to}</strong><div>${landText}${cropText || `<span>${uiIconMarkup('exp','is-inline-ui')} 农场能力提升</span>`}</div></div><i class="farm-level-star s1">✦</i><i class="farm-level-star s2">✦</i><i class="farm-level-star s3">✧</i><i class="farm-level-leaf l1">🍃</i><i class="farm-level-leaf l2">🍃</i>`;
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

  function grantDailySocialExp(requested, {silent=true} = {}) {
    ensureDailyState(farmDay);
    const current = Math.min(DAILY_SOCIAL_EXP_CAP, Math.max(0, Number(state.daily?.socialExp) || 0));
    const award = Math.min(Math.max(0, Number(requested) || 0), Math.max(0, DAILY_SOCIAL_EXP_CAP - current));
    if (award <= 0) return 0;
    state.daily.socialExp = current + award;
    addExp(award, {silent});
    return award;
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
    factor *= Math.max(0.90, Math.min(1, Number(plot?.eventGrowFactor) || 1));
    if (plot?.friendWatered) factor *= FRIEND_WATER_FACTOR;
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
    return uiIconMarkup('newbie-farmer','farm-crop-visual is-fallback-crop-ui');
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
    el.className = 'farm-ui-icon farm-crop-visual is-fallback-crop-ui';
    el.dataset.uiIcon = 'newbie-farmer';
    el.textContent = '';
  }

  function renderDailyEventScene() {
    const event = currentFarmEvent();
    const badge = $('farmDailyEvent');
    if (badge) {
      badge.className = `farm-daily-event is-${event.id}`;
      badge.innerHTML = `<b>${uiIconMarkup(eventUiIconKey(event.id),'is-event-ui')} ${escapeHtml(event.name)}<span class="farm-event-badge-countdown" data-farm-event-countdown>剩 ${formatFarmEventCountdown()}</span></b><small>${escapeHtml(event.note)}<span class="farm-event-window">本时段 ${escapeHtml(farmEventSlotWindow())} · <span data-farm-event-countdown>剩 ${formatFarmEventCountdown()}</span></span></small>`;
    }
    const merchant = $('farmMerchantNpc');
    if (merchant) {
      merchant.hidden = !event.merchant;
      merchant.setAttribute('aria-label', event.merchant ? `种子商人来访，折扣剩余 ${formatFarmEventCountdown()}` : '');
      const label = merchant.querySelector('em');
      if (label) label.innerHTML = `<span>本时段 9 折</span><small data-farm-event-countdown>剩 ${formatFarmEventCountdown()}</small>`;
    }
    const scene = document.querySelector('.farm-scene');
    if (scene) {
      scene.classList.toggle('is-sunny', event.id === 'sunny');
      scene.classList.toggle('is-harvest', event.id === 'harvest');
      scene.classList.toggle('is-rainy', event.id === 'rainy');
      scene.classList.toggle('is-storm', event.id === 'storm');
      scene.dataset.weather = ['sunny','harvest','rainy','storm'].includes(event.id) ? event.id : 'none';
    }
    const weatherLayer = $('farmWeatherLayer');
    if (weatherLayer) {
      weatherLayer.className = `farm-weather-layer ${['sunny','harvest','rainy','storm'].includes(event.id) ? `is-${event.id}` : 'is-none'}`;
    }
    updateFarmEventRuntimeLabels();
  }

  function openMerchantShop() {
    const event = currentFarmEvent();
    if (!event.merchant) { toast('🛒 商人现在不在', '种子商人只会在来访时段停在农舍旁。'); return; }
    activePanel = 'merchant';
    const discountIds = merchantDiscountCrops();
    const cards = discountIds.map(id => {
      const crop = cropById(id);
      const price = Math.max(1, Math.floor(crop.seedPrice * .9));
      return `<article class="farm-merchant-card"><span class="farm-seed-icon">${seedIconMarkup(crop)}</span><div><b>${escapeHtml(crop.name)}种子</b><small>原价 ${crop.seedPrice} · 本时段 9 折</small></div><strong>${uiIconMarkup('coin','is-meta-ui')} ${price} /包</strong><button type="button" data-merchant-buy="${escapeHtml(crop.id)}" data-qty="1">买 1</button><button type="button" data-merchant-buy="${escapeHtml(crop.id)}" data-qty="5">买 5</button></article>`;
    }).join('');
    openModal({icon:'shop', eyebrow:'TRAVELING MERCHANT', title:'种子商人来访', subtitle:`本时段 ${farmEventSlotWindow()} · 随机两种已解锁种子 9 折`, body:`<div class="farm-merchant-intro">${eventSpriteMarkup(3,'is-merchant-face')}<p>“今天路过星辰农场，带了两种便宜种子。要不要补一点库存？”<span class="farm-merchant-remaining" data-farm-event-countdown>剩 ${formatFarmEventCountdown()}</span></p></div><div class="farm-merchant-grid">${cards || '<p class="farm-empty-state">目前还没有可购买的折扣种子。</p>'}</div>`});
    updateFarmEventRuntimeLabels();
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
    renderFarmAvatar();
    renderFarmPet();
    renderStats();
    renderField();
    renderDecorations();
    updateHarvestAllButton();
    updateWaterAllButton();
    updateDebugAllButton();
    renderDailyEventScene();
    renderTrainStation();
    renderTaskDot();
    renderFriendDot();
    if (activePanel) renderActivePanel();
    if (levelUpQueue.length && !levelUpPlaying) requestAnimationFrame(playNextLevelUpCelebration);
  }

  function renderTrainStation() {
    const station = $('farmTrainStation');
    const status = $('farmTrainStationStatus');
    if (!station || !status) return;
    const hub = ensureTrainState(farmDay, {persist:true});
    const ready = trainReadySlots(hub);
    const readyTrains = ready.map(slot => slot.train);
    station.classList.toggle('is-complete', ready.length === 0 && hub.slots.every(slot => slot.status === 'done'));
    station.classList.toggle('is-gold', readyTrains.some(train => train.tier === 'gold'));
    station.classList.toggle('is-red', !readyTrains.some(train => train.tier === 'gold') && readyTrains.some(train => train.tier === 'red'));
    if (ready.length) {
      status.textContent = `${ready.length}班可选`;
      station.setAttribute('aria-label', `打开星辰车站，目前有 ${ready.length} 班列车可自由选择`);
    } else {
      const cooldowns = hub.slots.filter(slot => slot.status === 'cooldown' && slot.availableAt > Date.now());
      if (cooldowns.length) {
        const nextAt = Math.min(...cooldowns.map(slot => slot.availableAt));
        status.textContent = `返程 ${formatTrainWait(nextAt - Date.now())}`;
        station.setAttribute('aria-label', '打开星辰车站，列车返程中');
      } else {
        status.innerHTML = `${uiIconMarkup('success','is-station-status-ui')}<span>今日加班已满</span>`;
        station.setAttribute('aria-label', '打开星辰车站，今日额外班次已完成');
      }
    }
  }

  function renderOwner() {
    const profile = window.XingchenPlayer?.getProfile?.();
    $('farmOwnerName').textContent = profile?.name ? `${profile.name}的` : '我的';
    const badge = $('farmEquippedTitle');
    if (badge) {
      const title = titleById(state.titles?.equipped || 'newbie');
      badge.innerHTML = `${uiIconMarkup(titleUiIconKey(title.id),'is-title-badge-ui')}<b>【${escapeHtml(title.name)}】</b>`;
      badge.setAttribute('aria-label', `目前称号：${title.name}，点击管理称号`);
    }
  }

  function renderFarmAvatar() {
    const host = $('farmOwnerAvatar');
    if (!host) return;
    const profile = window.XingchenPlayer?.getProfile?.();
    const outfit = avatarOutfitById(state.avatar?.outfit || 'default');
    const renderedGender = renderedAvatarGender();
    host.dataset.avatarGender = renderedGender;
    host.dataset.avatarOutfit = outfit.id;
    // The scene avatar is static HTML (unlike the character modal, which is
    // rebuilt with avatarSpriteMarkup). Mirror the resolved gender onto the
    // actual sprite node so its gender-specific background image updates too.
    const sprite = host.querySelector('.farm-avatar-sprite');
    if (sprite) {
      sprite.dataset.avatarGender = renderedGender;
      sprite.dataset.avatarOutfit = outfit.id;
      // Keep the static farm-scene sprite in sync with each outfit's real
      // sheet geometry. Six-frame outfits use a 2x3 sheet; without this
      // attribute they fall back to the legacy 2x4 CSS and a single frame
      // gets sliced across two rows (body/head appear separated vertically).
      sprite.dataset.avatarFrames = String(avatarSpriteFrameCount(outfit.id, renderedGender));
      sprite.style.setProperty('--avatar-sprite-image', `url('${avatarSpriteUrl(outfit.id,renderedGender)}')`);
    }
    const label = profile?.name ? `${profile.name} · ${outfit.name}` : `农场主人 · ${outfit.name}`;
    host.setAttribute('aria-label', `${label}，点击打开角色管理`);
    const labelEl = $('farmOwnerAvatarLabel');
    if (labelEl) labelEl.textContent = profile?.name || '农场主人';
  }

  function renderFarmPet() {
    const host = $('farmOwnerPet');
    if (!host) return;
    const pet = activePet();
    if (!pet) {
      host.hidden = true;
      host.innerHTML = '';
      host.removeAttribute('data-pet-id');
      return;
    }
    host.hidden = false;
    host.dataset.petId = pet.id;
    host.innerHTML = petSpriteMarkup('is-scene-pet', pet.name, pet.id);
    host.setAttribute('aria-label', `${pet.name}，点击打开宠物管理`);
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
          btn.innerHTML = `<span class="farm-soil">${uiIconMarkup('lock','is-plot-lock-ui')}<small>Lv.${lvl}</small></span>`;
        } else if (!plot.cropId) {
          btn.classList.add('is-empty');
          btn.setAttribute('aria-label', `第 ${index + 1} 格空地，点击播种`);
          btn.innerHTML = `<span class="farm-soil"><i><span class="stellar-ui-icon is-empty-plot-plus" data-site-icon="plus" aria-hidden="true"></span></i><small>播种</small></span>`;
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


  function renderDecorations() {
    const host = $('farmDecorationLayer');
    if (!host) return;
    const slots = Array.isArray(state.decorations?.slots) ? state.decorations.slots : [];
    const titleId = state.titles?.equipped || 'newbie';
    const profile = window.XingchenPlayer?.getProfile?.();
    const ownerName = profile?.name || '我的';
    const parts = [];
    for (let index = 0; index < DECORATION_SLOT_COUNT; index += 1) {
      if (DISABLED_DECORATION_SLOT_INDEXES.has(index)) continue;
      const decorId = slots[index] || null;
      const item = decorationById(decorId);
      if (!item && !decorationMode) continue;
      parts.push(`<button type="button" class="farm-decoration-slot slot-${index + 1} ${item ? 'has-decoration' : 'is-empty'} ${decorationMode ? 'is-editing' : ''}" data-decor-slot="${index}" ${decorationMode ? '' : 'tabindex="-1" aria-hidden="true"'} aria-label="${item ? `装饰位置 ${index + 1}：${escapeHtml(item.name)}` : `空装饰位置 ${index + 1}`}">
        ${item ? decorationSceneMarkup(item, {friendName:ownerName, titleId}) : '<span class="farm-decoration-plus"><span class="stellar-ui-icon is-decoration-plus-icon" data-site-icon="plus" aria-hidden="true"></span></span>'}
      </button>`);
    }
    if (decorationMode) {
      parts.push(`<div class="farm-decor-toolbar"><b>${uiIconMarkup('farm-expert','is-heading-ui')} 布置模式</b><span>点选发光位置来放置、替换或收回装饰</span><button type="button" data-decor-exit>完成</button></div>`);
    }
    host.innerHTML = parts.join('');
    host.classList.toggle('is-editing', decorationMode);
  }

  function renderFriendDecorations(payload) {
    const slots = Array.isArray(payload?.decorations?.slots) ? payload.decorations.slots : [];
    const ownerName = String(payload?.display_name || '农友');
    const titleId = payload?.title_id || 'newbie';
    return `<div class="farm-decoration-layer farm-visit-decoration-layer">${slots.slice(0, DECORATION_SLOT_COUNT).map((decorId, index) => {
      if (DISABLED_DECORATION_SLOT_INDEXES.has(index)) return '';
      const item = decorationById(decorId);
      if (!item) return '';
      return `<span class="farm-decoration-slot slot-${index + 1} has-decoration">${decorationSceneMarkup(item, {friendName:ownerName, titleId})}</span>`;
    }).join('')}</div>`;
  }

  function enterDecorationMode() {
    if (!DECORATIONS.some(item => availableDecorationCount(item.id) > 0) && !state.decorations.slots.some(Boolean)) {
      toast('🏡 还没有装饰品', '先到商店的「装饰」分页购买一件喜欢的装饰。');
      activeShopTab = 'decor';
      openPanel('shop');
      return;
    }
    closeModal();
    decorationMode = true;
    renderDecorations();
    toast('🏡 已进入布置模式', '点选农场周围发光的位置即可放置或调整装饰。');
  }

  function exitDecorationMode() {
    decorationMode = false;
    renderDecorations();
  }

  function openDecorationSlot(slotIndex) {
    const index = Math.max(0, Math.min(DECORATION_SLOT_COUNT - 1, Number(slotIndex) || 0));
    if (DISABLED_DECORATION_SLOT_INDEXES.has(index)) return;
    const currentId = state.decorations?.slots?.[index] || null;
    const current = decorationById(currentId);
    const choices = DECORATIONS.filter(item => state.level >= item.unlockLevel && (availableDecorationCount(item.id) > 0 || item.id === currentId));
    const choiceMarkup = choices.length ? choices.map(item => {
      const available = availableDecorationCount(item.id) + (item.id === currentId ? 1 : 0);
      return `<button type="button" class="farm-decor-choice ${item.id === currentId ? 'is-current' : ''}" data-place-decor="${item.id}" data-decor-target-slot="${index}">
        ${decorationIconMarkup(item, 'is-decor-choice-art', item.name)}
        <span><b>${escapeHtml(item.name)}</b><small>${item.id === currentId ? '目前放在这个位置' : `可放置 ×${available}`}</small></span>
        <em>${item.id === currentId ? `${uiIconMarkup('success','is-button-ui')}<span>当前</span>` : '放置'}</em>
      </button>`;
    }).join('') : '<p class="farm-empty-state">目前没有可放置的装饰。可以先到商店购买。</p>';
    openModal({
      icon:'farm-expert', eyebrow:`DECOR SLOT ${index + 1}`, title:current ? `调整「${current.name}」` : '选择装饰',
      subtitle:'固定装饰位置能让电脑与手机版都维持稳定构图。',
      body:`<div class="farm-decor-choice-list">${choiceMarkup}</div><div class="farm-decor-slot-actions">${current ? `<button type="button" data-remove-decor="${index}">收回背包</button>` : ''}<button type="button" data-open-panel="shop" data-open-decor-shop>前往装饰商店</button></div>`
    });
  }

  async function buyDecoration(id) {
    const item = decorationById(id);
    if (!item || item.shopVisible === false || state.level < item.unlockLevel) return;
    if (state.coins < item.price) {
      toast('🪙 金币不够', `购买 ${item.name} 需要 ${item.price} 金币。`);
      return;
    }
    state.coins -= item.price;
    state.decorations.owned[item.id] = (state.decorations.owned[item.id] || 0) + 1;
    state.history.push({type:'buy-decor', decorId:item.id, coins:item.price, at:Date.now()});
    saveState(); renderAll();
    toast('🏡 装饰已购买', `${item.name} 已放进装饰背包。`);
  }

  async function placeDecoration(slotIndex, decorId) {
    const index = Math.max(0, Math.min(DECORATION_SLOT_COUNT - 1, Number(slotIndex) || 0));
    if (DISABLED_DECORATION_SLOT_INDEXES.has(index)) return;
    const item = decorationById(decorId);
    if (!item || state.level < item.unlockLevel) return;
    const currentId = state.decorations.slots[index] || null;
    if (currentId !== item.id && availableDecorationCount(item.id) <= 0) {
      toast('🏡 没有可用的这件装饰', '先从其他位置收回，或到商店再购买一件。');
      return;
    }
    state.decorations.slots[index] = item.id;
    state.history.push({type:'place-decor', decorId:item.id, slot:index, at:Date.now()});
    saveState(); renderAll(); closeModal();
    toast('🏡 布置完成', `${item.name} 已放到装饰位置 ${index + 1}。`);
  }

  async function removeDecoration(slotIndex) {
    const index = Math.max(0, Math.min(DECORATION_SLOT_COUNT - 1, Number(slotIndex) || 0));
    if (DISABLED_DECORATION_SLOT_INDEXES.has(index)) return;
    const currentId = state.decorations.slots[index] || null;
    const item = decorationById(currentId);
    if (!item) return;
    state.decorations.slots[index] = null;
    state.history.push({type:'remove-decor', decorId:item.id, slot:index, at:Date.now()});
    saveState(); renderAll(); closeModal();
    toast('🎒 已收回装饰', `${item.name} 回到装饰背包，可以放到其他位置。`);
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
          <em>${levelLocked ? uiIconMarkup('lock','is-button-ui') : `×${owned}`}</em>
        </button>`;
    }).join('');

    openModal({
      icon:'🌱', eyebrow:`FIELD ${String(index + 1).padStart(2,'0')}`, title:'选择要种下的种子',
      subtitle:'选好作物后可以决定种 1 格、数格，或一次种满目前可用空地。',
      body:`<div class="farm-seed-list">${options}</div><button class="farm-inline-link" type="button" data-open-panel="shop">种子不够？前往商店 <span class="stellar-ui-icon is-inline-site-icon" data-site-icon="right" aria-hidden="true"></span></button>`
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
      icon:crop.isMystery ? 'reward-box' : (SEED_UI_ICON[crop.id] || 'newbie-farmer'),
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
            <button type="button" data-plant-qty-step="-1" aria-label="减少一格"><span class="stellar-ui-icon is-qty-site-icon" data-site-icon="minus" aria-hidden="true"></span></button>
            <strong><span id="farmPlantQtyValue">${qty}</span><small> / ${maxQty} 格</small></strong>
            <button type="button" data-plant-qty-step="1" aria-label="增加一格"><span class="stellar-ui-icon is-qty-site-icon" data-site-icon="plus" aria-hidden="true"></span></button>
          </div>

          <div class="farm-qty-range-wrap">
            <input id="farmPlantQtyRange" class="farm-qty-range" type="range" min="1" max="${maxQty}" step="1" value="${qty}" ${maxQty === 1 ? 'disabled' : ''} aria-label="选择种植数量" />
            <div class="farm-qty-range-labels"><span>1</span><button type="button" data-plant-all>全部 ${maxQty}</button></div>
          </div>

          <div class="farm-plant-costline">
            <span>${seedIconMarkup(crop)} ${crop.name}</span>
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
        hasPest:!crop.isMystery && Math.random() < currentPestChance(),
        eventGrowFactor:crop.isMystery ? 1 : (Number(currentFarmEvent()?.growFactor) || 1)
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
      plot.friendWatered = false;
      plot.friendWateredBy = '';
      plot.friendWateredByName = '';
      plot.friendWateredAt = null;
      plot.fertilizerId = null;
      plot.hasPest = Boolean(item.hasPest);
      plot.eventGrowFactor = Math.max(0.90, Math.min(1, Number(item.eventGrowFactor) || 1));
      state.stats.plant += 1;
      bumpDaily('plant', 1);
      if (crop.isMystery) {
        state.stats.blindBoxPlant += 1;
        bumpDaily('mysteryPlant', 1);
      } else bumpDailyCrop('plantByCrop', cropId, 1);
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
    toast(`🌱 已种下 ${crop.name} ×${chosen.length} 格`, crop.isMystery ? '4 小时后揭晓随机蔬果。' : `${crop.growMinutes} 分钟后回来看看。`);
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
      iconHtml:produceIconMarkup(shown,'is-modal-produce-ui'), eyebrow:`FIELD ${String(index + 1).padStart(2,'0')}`, title:`${shown.name} · ${stage.label}`,
      subtitle:mysteryNote,
      body:`
        <div class="farm-crop-detail">
          <div class="farm-crop-detail-icon">${produceIconMarkup(shown,'is-crop-detail-produce-ui')}</div>
          <div class="farm-crop-detail-info">
            <b>剩余 ${formatDuration(remaining)}</b>
            <div class="farm-detail-progress"><i style="width:${Math.round(progress*100)}%"></i></div>
            <small>${crop.isMystery ? '固定 4 小时 · 成熟时揭晓' : `成熟时间 ${crop.growMinutes} 分钟`} · 收成 EXP +${crop.exp}</small>
          </div>
        </div>
        ${crop.isMystery ? `<div class="farm-care-panel is-locked-care"><div class="farm-care-panel-head"><b>${uiIconMarkup('reward-box','is-heading-ui')} 盲盒固定成长</b><span>固定 4 小时</span></div><p class="farm-soft-note">蔬果盲盒不受浇水与肥料加速影响，保持固定 4 小时后揭晓。</p></div>` : `<div class="farm-care-panel">
          <div class="farm-care-panel-head"><b>${uiIconMarkup('harvest-expert','is-heading-ui')} 农田照料</b><span>自己照料可叠加 1 次好友助力 -5%</span></div>
          <div class="farm-care-current">
            <span>${plot.watered ? `${itemSpriteMarkup(10, 'is-inline-item')} 已浇水 · 时间 ×92%` : `${itemSpriteMarkup(9, 'is-inline-item')} 尚未浇水`}</span>
            <span>${plot.fertilizerId ? `${itemSpriteMarkup(fertilizerById(plot.fertilizerId)?.statusCell || 11, 'is-inline-item')} ${escapeHtml(fertilizerById(plot.fertilizerId)?.name || '已施肥')}` : `${uiIconMarkup('newbie-farmer','is-inline-ui')} 尚未施肥`}</span>
            ${plot.friendWatered ? `<span class="is-friend-helped">💙 ${escapeHtml(plot.friendWateredByName || '农场好友')} 已助力 · 额外 -5%</span>` : '<span>💧 尚未接受好友助力</span>'}
          </div>
          ${plot.hasPest ? `<div class="farm-pest-alert">${eventSpriteMarkup(5, 'is-inline-event')}<span><b>发现虫害</b><small>成熟前不处理会让这格收成少 1 个。</small></span><button type="button" data-debug-plot="${index}">${eventSpriteMarkup(6, 'is-inline-event')} 除虫</button></div>` : ''}
          <div class="farm-care-actions">
            <button type="button" data-water-plot="${index}" ${plot.watered ? 'disabled' : ''}>${itemSpriteMarkup(2, 'is-action-item')}<span><b>${plot.watered ? '已浇水' : '浇水一次'}</b><small>本轮成长时间再 ×92%</small></span></button>
            ${FERTILIZERS.map(item => `<button type="button" data-fertilize-plot="${index}" data-fertilizer="${item.id}" ${(plot.fertilizerId || (state.supplies[item.id] || 0) <= 0) ? 'disabled' : ''}>${itemSpriteMarkup(item.itemCell, 'is-action-item')}<span><b>${escapeHtml(item.name)} ×${state.supplies[item.id] || 0}</b><small>成长时间 -${item.reduction}%</small></span></button>`).join('')}
          </div>
        </div>
        <p class="farm-soft-note">自己的浇水、肥料与好友助力可以叠加；同一轮作物只接受一次好友助力，离开页面后计时仍会继续。</p>`}`
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
    bumpDaily('fertilize', 1);
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
      if (!crop.isMystery) bumpDailyCrop('harvestByCrop', crop.id, 1);
      state.history.push({type:'harvest', cropId:result.crop.id, sourceCropId:crop.id, amount:result.amount, at:Date.now(), batch:true});
      clearPlot(plot);
    }

    addExp(totalExp);
    saveState();
    renderAll();
    const summary = Object.entries(totals)
      .map(([cropId, amount]) => { const crop = cropById(cropId); return `${crop?.name || cropId} ×${amount}`; })
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
    if (!crop.isMystery) bumpDailyCrop('harvestByCrop', crop.id, 1);
    state.history.push({type:'harvest', cropId:result.crop.id, sourceCropId:crop.id, amount:result.amount, at:Date.now()});
    clearPlot(plot);
    const earnedExp = Math.max(1, Math.round(crop.exp * (Number(currentFarmEvent()?.expFactor) || 1)));
    addExp(earnedExp);
    saveState();
    renderAll();
    const reveal = crop.isMystery ? ` · 盲盒开出 ${result.crop.name}` : '';
    toast(`🧺 收成 ${result.crop.name} ×${result.amount}`, `农场经验 +${earnedExp} EXP${reveal}`, 'harvest');
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
    plot.friendWatered = false;
    plot.friendWateredBy = '';
    plot.friendWateredByName = '';
    plot.friendWateredAt = null;
    plot.fertilizerId = null;
    plot.hasPest = false;
    plot.eventGrowFactor = 1;
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
    toast(`🛒 买到了 ${crop.isMystery ? crop.name : `${crop.name}种子`} ×${qty}`, `花费 ${cost} 金币。`);
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

  function markTrainOpApplied(hub, train, opId) {
    if (!Array.isArray(hub.appliedOps)) hub.appliedOps = [];
    if (!Array.isArray(train.appliedOps)) train.appliedOps = [];
    if (!hub.appliedOps.includes(opId)) hub.appliedOps.push(opId);
    if (!train.appliedOps.includes(opId)) train.appliedOps.push(opId);
    hub.appliedOps = hub.appliedOps.slice(-TRAIN_APPLIED_OP_LIMIT);
    train.appliedOps = train.appliedOps.slice(-TRAIN_APPLIED_OP_LIMIT);
  }

  function applyTrainLoadMutation(op, {silent=false} = {}) {
    const hub = ensureTrainState(farmDay);
    if (!hub || hub.date !== op.day) return false;
    if (Array.isArray(hub.appliedOps) && hub.appliedOps.includes(op.id)) return false;
    const slot = trainSlot(op.slotIndex, hub);
    if (!slot) return false;
    const slotGeneration = Math.max(0, Number(slot.generation) || 0);
    const opGeneration = Math.max(0, Number(op.generation) || 0);
    if (slotGeneration < opGeneration) return false;
    if (slotGeneration > opGeneration || slot.status !== 'ready' || !slot.train || slot.train.id !== op.trainId || slot.train.departed) {
      if (slot?.train) markTrainOpApplied(hub, slot.train, op.id);
      else hub.appliedOps = [...new Set([...(hub.appliedOps || []), op.id])].slice(-TRAIN_APPLIED_OP_LIMIT);
      return true;
    }
    const train = slot.train;
    const index = Number(op.carIndex);
    const car = train.cars[index];
    if (!car || car.cropId !== op.cropId) { markTrainOpApplied(hub, train, op.id); return true; }
    const crop = cropById(car.cropId);
    const wasComplete = Number(car.loaded) >= Number(car.required);
    const remaining = Math.max(0, car.required - car.loaded);
    const owned = Math.max(0, Number(state.produce[car.cropId]) || 0);
    const amount = Math.min(remaining, owned, Math.max(0, Math.floor(Number(op.amount) || 0)));
    if (!crop) return false;
    if (amount <= 0) { markTrainOpApplied(hub, train, op.id); return true; }
    state.produce[car.cropId] = owned - amount;
    car.loaded += amount;
    if (!wasComplete && car.loaded >= car.required) bumpDaily('trainCars', 1);
    markTrainOpApplied(hub, train, op.id);
    state.history.push({type:'train_load', cropId:car.cropId, amount, slotIndex:Number(slot.index), carIndex:index, trainDay:train.date, trainId:train.id, at:Date.now(), mutationId:op.id});
    if (!silent) toast(`🚃 ${crop.name}装货 +${amount}`, car.loaded >= car.required ? '这节车厢已经装满 ✓' : `还差 ${car.required - car.loaded} 个。`, 'harvest');
    return true;
  }

  function applyTrainRerollMutation(op, {silent=false} = {}) {
    const hub = ensureTrainState(farmDay);
    if (!op || !hub || hub.date !== op.day) return false;
    if (Array.isArray(hub.appliedOps) && hub.appliedOps.includes(op.id)) return false;
    const slot = trainSlot(op.slotIndex, hub);
    if (!slot) return false;
    const oldGeneration = Math.max(0, Number(op.oldGeneration) || 0);
    const currentGeneration = Math.max(0, Number(slot.generation) || 0);
    if (currentGeneration > oldGeneration) return false;
    if (currentGeneration < oldGeneration || slot.status !== 'ready' || !slot.train || slot.train.departed || slot.train.id !== op.oldTrainId) return false;
    if (Math.max(0, Number(state.supplies?.[TRAIN_RESET_TICKET_ID]) || 0) <= 0) return false;
    const replacement = normalizeTrainManifest(op.replacementTrain, slot.index, op.newGeneration, hub.date);
    if (!replacement) return false;
    const refunded = refundSingleTrainCargo(slot.train);
    state.supplies[TRAIN_RESET_TICKET_ID] = Math.max(0, Math.floor(Number(state.supplies[TRAIN_RESET_TICKET_ID]) || 0) - 1);
    slot.generation = Math.max(currentGeneration + 1, Number(op.newGeneration) || currentGeneration + 1);
    slot.train = replacement;
    slot.status = 'ready';
    slot.availableAt = 0;
    markTrainOpApplied(hub, slot.train, op.id);
    state.history.push({type:'train_reroll', trainDay:hub.date, oldTrainId:op.oldTrainId, trainId:slot.train.id, slotIndex:Number(slot.index), refunded, at:Date.now(), mutationId:op.id});
    state.history = state.history.slice(-30);
    if (!silent) toast('🎟️ 火车订单已刷新', `第 ${Number(slot.index)+1} 月台已重新抽取倍率与货物需求${refunded ? ` · 已退回 ${refunded} 个已装货物` : ''}。`, 'task');
    return true;
  }

  async function rerollTrain(slotIndex) {
    const hub = ensureTrainState(farmDay, {persist:true});
    const slot = trainSlot(slotIndex, hub);
    if (!slot || slot.status !== 'ready' || !slot.train || slot.train.departed) return;
    const tickets = Math.max(0, Math.floor(Number(state.supplies?.[TRAIN_RESET_TICKET_ID]) || 0));
    if (tickets <= 0) { toast('🎟️ 没有火车重置券', '完成每日任务并达到 100 熟练度，可以领取 1 张火车重置券。'); return; }
    const plan = createTrainRerollPlan(slot, hub);
    if (!plan) return;
    const op = queuePendingOp({
      type:'train-reroll', day:hub.date, slotIndex:Number(slot.index), oldGeneration:Math.max(0, Number(slot.generation) || 0),
      oldTrainId:slot.train.id, newGeneration:plan.generation, replacementTrain:plan.replacement
    });
    if (!applyTrainRerollMutation(op)) return;
    saveState();
    if (cloudReady) await pushCloudState(true);
    renderAll();
    if (activePanel === 'train') renderActivePanel();
  }

  function closeTrainLoadConfirm() {
    document.querySelector('.farm-train-load-confirm')?.remove();
  }


  function showTrainRerollConfirm(slotIndex) {
    closeTrainLoadConfirm();
    const hub = ensureTrainState(farmDay, {persist:true});
    const slot = trainSlot(slotIndex, hub);
    if (!slot || slot.status !== 'ready' || !slot.train || slot.train.departed) return;
    const tickets = Math.max(0, Math.floor(Number(state.supplies?.[TRAIN_RESET_TICKET_ID]) || 0));
    if (tickets <= 0) { toast('🎟️ 没有火车重置券', '今日熟练度达到 100 后可以领取 1 张。'); return; }
    const loaded = (slot.train.cars || []).reduce((sum,car) => sum + Math.max(0, Number(car.loaded) || 0), 0);
    const overlay = document.createElement('div');
    overlay.className = 'farm-train-load-confirm';
    overlay.innerHTML = `<div class="farm-train-load-card" role="dialog" aria-modal="true" aria-label="确认刷新火车订单">
      <span class="farm-train-load-icon">${uiIconMarkup('refresh','is-train-load-produce-ui')}</span>
      <div class="farm-train-load-copy"><small>第 ${Number(slot.index)+1} 月台 · 火车重置券</small><b>重新抽取倍率与货物需求</b><p>目前拥有 <strong>${tickets}</strong> 张重置券。本次会消耗 <strong>1</strong> 张。</p><em>${loaded > 0 ? `已经装入的 ${loaded} 个货物会完整退回背包，再生成全新订单。` : '当前倍率、作物种类与需求数量都会重新抽取。'}</em></div>
      <div class="farm-train-load-buttons"><button type="button" data-train-reroll-cancel>取消</button><button type="button" class="is-confirm" data-confirm-train-reroll data-train-slot-index="${Number(slot.index)}">确认刷新</button></div>
    </div>`;
    document.body.appendChild(overlay);
  }

  function showTrainLoadConfirm(slotIndex, carIndex) {
    closeTrainLoadConfirm();
    const hub = ensureTrainState(farmDay, {persist:true});
    const slot = trainSlot(slotIndex, hub);
    if (!slot || slot.status !== 'ready' || !slot.train || slot.train.departed) return;
    const car = slot.train.cars[Number(carIndex)];
    const crop = cropById(car?.cropId);
    if (!car || !crop) return;
    const remaining = Math.max(0, car.required - car.loaded);
    if (remaining <= 0) return;
    const owned = Math.max(0, Number(state.produce[crop.id]) || 0);
    const amount = Math.min(remaining, owned);
    const canConfirm = amount > 0;
    const overlay = document.createElement('div');
    overlay.className = 'farm-train-load-confirm';
    overlay.innerHTML = `<div class="farm-train-load-card" role="dialog" aria-modal="true" aria-label="确认装箱">
      <span class="farm-train-load-icon">${produceIconMarkup(crop,'is-train-load-produce-ui')}</span>
      <div class="farm-train-load-copy"><small>第 ${Number(slot.index)+1} 月台 · 装箱确认</small><b>${escapeHtml(crop.name)} ${car.loaded} / ${car.required}</b><p>背包目前拥有 <strong>${owned}</strong> 个 · 本节还需要 <strong>${remaining}</strong> 个 · 本次可装 <strong>${amount}</strong> 个</p><em>${canConfirm ? '确认后会立即从背包扣除并装入车厢。' : `目前没有${escapeHtml(crop.name)}可装箱，先去农田收成后再回来。`}</em></div>
      <div class="farm-train-load-buttons"><button type="button" data-train-load-cancel>取消</button><button type="button" class="is-confirm" data-confirm-train-load data-train-slot-index="${Number(slot.index)}" data-train-load-index="${Number(carIndex)}" ${canConfirm ? '' : 'disabled'}>${canConfirm ? `确认装箱 ×${amount}` : '背包数量不足'}</button></div>
    </div>`;
    document.body.appendChild(overlay);
  }

  async function loadTrainCar(slotIndex, index) {
    const hub = ensureTrainState(farmDay, {persist:true});
    const slot = trainSlot(slotIndex, hub);
    if (!slot || slot.status !== 'ready' || !slot.train || slot.train.departed) return;
    const train = slot.train;
    const car = train.cars[Number(index)];
    const crop = cropById(car?.cropId);
    if (!car || !crop) return;
    const remaining = Math.max(0, car.required - car.loaded);
    if (remaining <= 0) return;
    const owned = Math.max(0, Number(state.produce[crop.id]) || 0);
    if (owned <= 0) { toast(`🚃 缺少${crop.name}`, `背包目前没有${crop.name}，先去农田收成吧。`); return; }
    const amount = Math.min(remaining, owned);
    const op = queuePendingOp({type:'train-load', day:hub.date, slotIndex:Number(slot.index), generation:Number(slot.generation)||0, trainId:train.id, carIndex:Number(index), cropId:crop.id, amount});
    if (!applyTrainLoadMutation(op)) return;
    saveState();
    if (cloudReady) await pushCloudState(true);
    renderAll();
  }

  function applyTrainDepartMutation(op, {silent=false} = {}) {
    const hub = ensureTrainState(farmDay);
    if (!hub || hub.date !== op.day) return false;
    if (Array.isArray(hub.appliedOps) && hub.appliedOps.includes(op.id)) return false;
    const slot = trainSlot(op.slotIndex, hub);
    if (!slot) return false;
    const slotGeneration = Math.max(0, Number(slot.generation) || 0);
    const opGeneration = Math.max(0, Number(op.generation) || 0);
    if (slotGeneration < opGeneration) return false;
    if (!slot.train || slotGeneration > opGeneration || slot.train.id !== op.trainId) {
      hub.appliedOps = [...new Set([...(hub.appliedOps || []), op.id])].slice(-TRAIN_APPLIED_OP_LIMIT);
      return true;
    }
    const train = slot.train;
    if (train.departed || slot.status !== 'ready') { markTrainOpApplied(hub, train, op.id); return true; }
    if (!trainAllLoaded(train)) { markTrainOpApplied(hub, train, op.id); return true; }
    const reward = trainReward(train);
    markTrainOpApplied(hub, train, op.id);
    train.departed = true;
    train.departedAt = Math.max(Date.now(), Number(op.departedAt) || 0);
    train.departureOpId = op.id;
    state.coins += reward.coins;
    const cargoCount = train.cars.reduce((sum, car) => sum + Math.max(0, Number(car.required) || 0), 0);
    state.stats.sell = Math.max(0, Number(state.stats.sell) || 0) + cargoCount;
    bumpDaily('sell', cargoCount);
    bumpDaily('trainDepart', 1);
    addExp(reward.exp, {silent});
    updateHighWatermarks();
    const reservedReturns = hub.slots.filter(item => item !== slot && item.status === 'cooldown').length;
    if (hub.bonusGenerated + reservedReturns < TRAIN_DAILY_BONUS_CAP) {
      slot.status = 'cooldown';
      slot.availableAt = Math.max(train.departedAt + trainCooldownMs(train), Number(op.availableAt) || 0);
    } else {
      slot.status = 'done';
      slot.availableAt = 0;
    }
    state.history.push({type:'train_depart', trainDay:train.date, trainId:train.id, slotIndex:Number(slot.index), multiplier:train.multiplier, cargoCount, coins:reward.coins, exp:reward.exp, at:train.departedAt, mutationId:op.id});
    if (!silent) toast('🚂 货运发车成功！', `金币 +${formatNumber(reward.coins)} · EXP +${formatNumber(reward.exp)} 已立即入账`, 'harvest');
    return true;
  }

  async function departTrain(slotIndex) {
    const hub = ensureTrainState(farmDay, {persist:true});
    const slot = trainSlot(slotIndex, hub);
    const train = slot?.train;
    if (!slot || slot.status !== 'ready' || !train || train.departed || !trainAllLoaded(train)) {
      toast('🚂 还不能发车', '请先把这班列车的所有车厢装满。');
      return;
    }
    const consist = document.querySelector(`.farm-train-consist[data-train-slot-index="${Number(slot.index)}"]`);
    const departButton = document.querySelector(`[data-train-depart][data-train-slot-index="${Number(slot.index)}"]`);
    if (departButton) departButton.disabled = true;
    if (consist) consist.classList.add('is-departing');
    const departedAt = Date.now();
    const availableAt = departedAt + trainCooldownMs(train);
    const op = queuePendingOp({type:'train-depart', day:hub.date, slotIndex:Number(slot.index), generation:Number(slot.generation)||0, trainId:train.id, departedAt, availableAt});
    if (!applyTrainDepartMutation(op)) return;
    saveState();
    if (cloudReady) pushCloudState(true).catch(() => {});
    setTimeout(() => {
      renderAll();
      if (activePanel === 'train') renderActivePanel();
    }, 2350);
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
    toast(`🏷️ 称号已装备`, `现在显示为【${title.name}】。`, 'task');
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


  async function claimDailyMastery(points) {
    await syncFarmDay(true);
    const milestone = dailyMasteryRewardByPoints(points);
    if (!milestone || dailyMasteryPoints() < milestone.points || isDailyMasteryClaimed(milestone.points)) return;
    queuePendingOp({type:'claim-daily-mastery', points:milestone.points, day:farmDay});
    if (!applyDailyMasteryReward(milestone.points, farmDay)) return;
    saveState();
    if (cloudReady) await pushCloudState(true);
    renderAll();
    toast(milestone.points >= 100 ? '🎟️ 今日熟练度达成！' : '⭐ 熟练度奖励已领取', `${milestone.points} 熟练度 · ${milestone.rewardText}`, 'task');
  }

  async function rerollDailyTask(slotIndex) {
    await syncFarmDay(true);
    ensureDailyState(farmDay);
    if (state.daily.rerollUsed) { toast('🔄 今日已经换过任务', '每天只有 1 次免费更换机会，明天 00:00 会重置。'); return; }
    const tasks = dailyTasks();
    const index = Math.max(0, Math.min(tasks.length - 1, Number(slotIndex) || 0));
    const current = tasks[index];
    if (!current) return;
    if (isDailyComplete(current)) { toast('✅ 已完成的任务不能更换', '请选择一项尚未完成的每日任务。'); return; }
    const replacement = dailyReplacementTask(index, state.daily.taskIds);
    if (!replacement) { toast('🔄 暂时没有其他合适任务', '今天的任务池已经没有可替换项目了。'); return; }
    const op = queuePendingOp({type:'daily-reroll', day:farmDay, slotIndex:index, oldTaskId:current.id, newTaskId:replacement.id});
    if (!applyDailyRerollMutation(op)) return;
    saveState();
    if (cloudReady) await pushCloudState(true);
    renderAll();
    toast('🔄 每日任务已更换', `${current.title} → ${replacement.title} · 今日免费次数已使用`, 'task');
  }

  function taskNoticeCounts() {
    ensureDailyState(farmDay);
    const mastery = dailyMasteryPoints();
    const masteryReady = DAILY_MASTERY_REWARDS.filter(item => mastery >= item.points && !isDailyMasteryClaimed(item.points)).length;
    const daily = dailyTasks().filter(task => isDailyComplete(task) && !isDailyClaimed(task)).length + masteryReady;
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
    setNoticeBadge($('farmFriendDot'), incoming + Math.max(0, farmActivityUnreadCount) + npcUnreadCount());
  }

  function openPanel(panel, options = {}) {
    activePanel = panel;
    if (panel === 'character') { previewOutfitId = ''; previewPetId = ''; }
    const meta = {
      shop:{icon:'shop', eyebrow:'FARM SHOP', title:'农场商店', subtitle:'购买种子、农资与装饰品，让农场越来越有自己的样子。'},
      bag:{icon:'bag', eyebrow:'INVENTORY', title:'我的背包', subtitle:'管理种子、肥料、装饰与收成蔬果；也可以从这里进入农场布置模式。'},
      tasks:{icon:'task', eyebrow:'FARM QUEST', title:'任务与成就', subtitle:'完成每日农务、新手任务与长期成就，领取奖励并解锁专属称号。'},
      ranking:{icon:'ranking', eyebrow:'RANKING', title:'农场排行榜', subtitle:'查看真实云端玩家的等级榜与金币榜，也可以直接发送好友申请。'},
      friends:{icon:'friends', eyebrow:'FRIENDS', title:'农场好友', subtitle:'真人好友与 NPC 农友都在这里；NPC 不参加排行榜、不会偷你的菜，但你可以限量偷 NPC 的成熟作物。'},
      character:{iconHtml:'<span class="stellar-ui-icon is-character-modal-site-icon" data-site-icon="account" aria-hidden="true"></span>', eyebrow:'MY CHARACTER', title:'我的角色', subtitle:'管理农场主人造型，也可以查看宠物收藏与跟随状态。'},
      train:{icon:'train', eyebrow:'STELLAR STATION', title:'星辰车站', subtitle:'每天 00:00 两个月台同时刷新，可自由挑选倍率；发车奖励立即入账，4～6 小时后还可能有加班列车返程。'}
    }[panel];
    if (!meta) return;
    if (panel === 'train') ensureTrainState(farmDay, {persist:true});
    $('farmModal')?.classList.toggle('is-train-modal', panel === 'train');
    if (panel === 'friends') activeFriendTab = ['activity','friends','requests'].includes(options.friendTab) ? options.friendTab : 'activity';
    if (panel === 'shop' && !['seeds','care','decor'].includes(activeShopTab)) activeShopTab = 'seeds';
    openModal({...meta, body:''});
    renderActivePanel();
    if (panel === 'tasks') syncFarmDay(true).then(() => renderActivePanel()).catch(() => {});
    if (panel === 'friends' && activeFriendTab === 'activity') {
      markNpcActivitiesSeen();
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

    if (activePanel === 'character') {
      const profile = window.XingchenPlayer?.getProfile?.();
      const equippedOutfit = avatarOutfitById(state.avatar?.outfit || 'default');
      const previewId = previewableOutfitId();
      const outfit = avatarOutfitById(previewId);
      const isPreviewing = outfit.id !== equippedOutfit.id;
      const tabs = `<div class="farm-character-tabs">
        <button type="button" data-character-tab="avatar" class="${activeCharacterTab === 'avatar' ? 'is-active' : ''}"><span class="stellar-ui-icon" data-site-icon="account" aria-hidden="true"></span> 人物</button>
        <button type="button" data-character-tab="pet" class="${activeCharacterTab === 'pet' ? 'is-active' : ''}">🐾 宠物</button>
      </div>`;
      if (activeCharacterTab === 'pet') {
        const pet = previewablePet();
        const equippedPet = activePet();
        const isPetPreview = Boolean(pet && (!equippedPet || pet.id !== equippedPet.id));
        body.innerHTML = tabs + `<section class="farm-character-layout farm-pet-layout">
          <div class="farm-character-preview-card farm-pet-preview-card ${isPetPreview ? 'is-preview-mode' : ''}">
            <div class="farm-character-preview-stage farm-pet-preview-stage">${pet ? petSpriteMarkup('is-pet-preview', pet.name, pet.id) : '<span class="farm-pet-empty-hero">🐾</span>'}</div>
            <div class="farm-character-preview-copy"><small>${isPetPreview ? '宠物预览' : (equippedPet ? '目前跟随' : '宠物收藏')}</small><b>${pet ? escapeHtml(pet.name) : '尚未选择宠物'}</b><span>${pet ? `${escapeHtml(pet.note)}${isPetPreview && !petOwned(pet.id) ? ' · 仅预览，尚未拥有' : ''}` : '取得宠物后可以让它陪你一起经营农场。'}</span></div>
          </div>
          <div class="farm-character-controls">
            <section class="farm-character-control-section">
              <header><div><small>STELLAR PET</small><b>我的宠物</b></div></header>
              <div class="farm-pet-list">${PETS.map(petCardMarkup).join('')}</div>
            </section>
          </div>
        </section>`;
        return;
      }
      body.innerHTML = tabs + `<section class="farm-character-layout">
        <div class="farm-character-preview-card ${isPreviewing ? 'is-preview-mode' : ''}">
          <div class="farm-character-preview-stage">${avatarSpriteMarkup('is-character-preview', `${profile?.name || '农场主人'}的角色`, outfit.id)}</div>
          <div class="farm-character-preview-copy"><small>${isPreviewing ? '造型预览' : '当前角色'}</small><b>${escapeHtml(profile?.name || '农场主人')}</b><span>${escapeHtml(outfit.name)}${isPreviewing ? ' · 仅预览，尚未拥有／套用' : ''}</span></div>
        </div>
        <div class="farm-character-controls">
          <section class="farm-character-control-section">
            <header><div><small>OUTFIT</small><b>我的衣橱</b></div></header>
            <div class="farm-outfit-list">${AVATAR_OUTFITS.map(outfitCardMarkup).join('')}</div>
          </section>
        </div>
      </section>`;
      return;
    }

    if (activePanel === 'train') {
      const hub = ensureTrainState(farmDay, {persist:true});
      const slotMarkup = hub.slots.map(slot => {
        if (slot.status === 'cooldown') {
          return `<section class="farm-train-slot is-cooldown" data-train-slot="${slot.index}">
            <header class="farm-train-slot-head"><div><small>第 ${slot.index + 1} 月台</small><b>${uiIconMarkup('cooldown','is-heading-ui')} 列车返程中</b></div><span>约 <strong data-train-cooldown-until="${slot.availableAt}">${formatTrainWait(slot.availableAt - Date.now())}</strong> 后抵达</span></header>
            <div class="farm-train-empty-station"><img src="../images/farm/train-station.png?v=0.19.2" alt="星辰车站"></div>
            <p class="farm-train-slot-note">奖励已在上一班发车时立即入账。返程后这里会自动出现一班全新的订单。</p>
          </section>`;
        }
        if (slot.status === 'done') {
          return `<section class="farm-train-slot is-done" data-train-slot="${slot.index}">
            <header class="farm-train-slot-head"><div><small>第 ${slot.index + 1} 月台</small><b>${uiIconMarkup('success','is-heading-ui')} 今日加班班次已满</b></div><span>00:00 统一刷新</span></header>
            <div class="farm-train-empty-station"><img src="../images/farm/train-station.png?v=0.19.2" alt="星辰车站"></div>
          </section>`;
        }
        const train = slot.train;
        const reward = trainReward(train);
        const loadedCars = trainLoadedCount(train);
        const complete = trainAllLoaded(train);
        const tierLabel = train.tier === 'gold' ? '黄金列车' : train.tier === 'red' ? '幸运列车' : '普通货运';
        const tierIcon = train.tier === 'gold' ? uiIconMarkup('exp','is-train-tier-ui') : train.tier === 'red' ? uiIconMarkup('reward-box','is-train-tier-ui') : uiIconMarkup('success','is-train-tier-ui');
        const cars = train.cars.map((car,index) => {
          const crop = cropById(car.cropId);
          const done = car.loaded >= car.required;
          const owned = Math.max(0, Number(state.produce[car.cropId]) || 0);
          const remaining = Math.max(0, car.required - car.loaded);
          return `<button type="button" class="farm-train-car is-${car.style} ${done ? 'is-complete' : ''} ${!done && owned <= 0 ? 'is-empty-bag' : ''}" data-train-slot-index="${slot.index}" data-train-load-index="${index}" ${done ? 'disabled' : ''} aria-label="${done ? `${crop.name}车厢已装满` : `查看${crop.name}装箱需求，还差${remaining}个，背包${owned}个`}">
            <img src="../images/farm/train-car-${car.style}.png?v=0.19.2" alt="" aria-hidden="true">
            <span class="farm-train-car-ui"><i>${done ? uiIconMarkup('success','is-train-check-ui') : produceIconMarkup(crop,'is-train-produce-ui')}</i><b>${escapeHtml(crop.name)}</b><strong>${car.loaded} / ${car.required}</strong><small>${done ? '装载完成' : `背包 ${owned}`}</small></span>
          </button>`;
        }).join('');
        return `<section class="farm-train-slot farm-train-panel is-${train.tier}" data-train-slot="${slot.index}">
          <header class="farm-train-slot-head"><div><small>第 ${slot.index + 1} 月台</small><b>${tierIcon} ${tierLabel} ×${train.multiplier.toFixed(1)}</b></div><span>可自由选择是否装货</span></header>
          <div class="farm-train-summary">
            <div class="farm-train-rate"><span>${tierIcon}</span><div><small>本班货运加成</small><b>×${train.multiplier.toFixed(1)}</b><em>${tierLabel}</em></div></div>
            <div class="farm-train-reward"><small>本班发车预计获得</small><b>${uiIconMarkup('coin','is-reward-ui')} ${formatNumber(reward.coins)} <i>${uiIconMarkup('exp','is-reward-ui')} +${formatNumber(reward.exp)}</i></b><em>发车后立即入账；基础货价为直接出售的 120% 再乘倍率。</em></div>
            <div class="farm-train-reset"><small>火车重置券</small><b>${uiIconMarkup('refresh','is-inline-ui')} ×${Math.max(0,Math.floor(Number(state.supplies?.[TRAIN_RESET_TICKET_ID])||0))}</b></div>
          </div>
          <div class="farm-train-yard">
            <img class="farm-train-yard-station" src="../images/farm/train-station.png?v=0.19.2" alt="" aria-hidden="true">
            <div class="farm-train-consist ${complete ? 'is-ready' : ''}" data-train-slot-index="${slot.index}">
              ${cars}
              <div class="farm-train-engine is-${train.tier}"><img src="../images/farm/train-engine.png?v=0.19.2" alt="" aria-hidden="true"><span class="farm-train-engine-rate">×${train.multiplier.toFixed(1)}</span><span class="farm-train-smoke" aria-hidden="true"></span></div>
            </div>
          </div>
          <div class="farm-train-progress"><span><b>${loadedCars}</b> / ${train.cars.length} 节车厢已完成</span><div><i style="width:${Math.round((loadedCars/train.cars.length)*100)}%"></i></div></div>
          <div class="farm-train-actions"><p>点车厢后会先显示背包数量并询问是否装箱。火车重置券可重新抽取倍率与货物需求，已装货物会先退回背包。</p><div class="farm-train-action-buttons"><button type="button" class="is-reroll" data-train-reroll data-train-slot-index="${slot.index}" ${Math.max(0,Number(state.supplies?.[TRAIN_RESET_TICKET_ID])||0)>0 ? '' : 'disabled'}>${uiIconMarkup('refresh','is-button-ui')} 刷新订单</button><button type="button" data-train-depart data-train-slot-index="${slot.index}" ${complete ? '' : 'disabled'}>${complete ? `${trainIconMarkup('is-button-train')} 发车！` : `还差 ${train.cars.length - loadedCars} 节车厢`}</button></div></div>
        </section>`;
      }).join('');
      body.innerHTML = `<section class="farm-train-hub-head"><div><b>${uiIconMarkup('farm-expert','is-heading-ui')} 今日双月台货运</b><p>每日 00:00 两班基础列车同时刷新；每班发车后 4～6 小时返程，全日最多再补 ${TRAIN_DAILY_BONUS_CAP} 班加班列车。</p></div><span><small>距离 00:00 刷新</small><b data-train-midnight>${escapeHtml(trainNextResetText())}</b><em>额外列车 ${hub.bonusGenerated}/${TRAIN_DAILY_BONUS_CAP}</em></span></section><div class="farm-train-slots">${slotMarkup}</div>`;
      return;
    }

    if (activePanel === 'shop') {
      const shopTabs = `<div class="farm-shop-tabs">
        <button type="button" data-shop-tab="seeds" class="${activeShopTab === 'seeds' ? 'is-active' : ''}">${uiIconMarkup('newbie-farmer','is-tab-ui')} 种子</button>
        <button type="button" data-shop-tab="care" class="${activeShopTab === 'care' ? 'is-active' : ''}">${uiIconMarkup('harvest-expert','is-tab-ui')} 农资</button>
        <button type="button" data-shop-tab="decor" class="${activeShopTab === 'decor' ? 'is-active' : ''}">${uiIconMarkup('farm-expert','is-tab-ui')} 装饰</button>
      </div>`;
      if (activeShopTab === 'seeds') {
        const seedShop = `<div class="farm-shop-grid">${seedItems().map(crop => {
          const locked = state.level < crop.unlockLevel;
          return `<article class="farm-shop-item ${locked ? 'is-locked' : ''}">
            <div class="farm-shop-crop"><span class="farm-shop-crop-icon">${seedIconMarkup(crop)}</span><div><b>${crop.isMystery ? crop.name : `${crop.name}种子`}</b><small>${crop.isMystery ? '固定 4 小时 · 随机蔬果 ×1' : `${crop.growMinutes} 分钟成熟 · 产量 ${crop.yieldMin}～${crop.yieldMax}`}</small></div></div>
            <p>${crop.note}</p>
            <div class="farm-shop-meta"><span>${uiIconMarkup('coin','is-meta-ui')} ${crop.seedPrice} / ${crop.isMystery ? '个' : '包'}</span>${crop.isMystery ? '<span>随机 8 种蔬果</span>' : `<span>出售 ${crop.sellPrice} / 个</span>`}<span>${uiIconMarkup('exp','is-meta-ui')} +${crop.exp}</span></div>
            ${locked ? `<button disabled>${uiIconMarkup('lock','is-button-ui')} Lv.${crop.unlockLevel} 解锁</button>` : `<div class="farm-shop-buy"><button type="button" data-buy-seed="${crop.id}" data-qty="1">买 1</button><button type="button" data-buy-seed="${crop.id}" data-qty="5">买 5</button><em>背包 ×${state.seeds[crop.id] || 0}</em></div>`}
          </article>`;
        }).join('')}</div>`;
        body.innerHTML = shopTabs + seedShop;
        return;
      }
      if (activeShopTab === 'care') {
        body.innerHTML = shopTabs + `<section class="farm-shop-care is-tab-body"><header><div><b>${uiIconMarkup('harvest-expert','is-heading-ui')} 农田照料</b><small>每株每轮最多使用一包肥料；浇水免费。</small></div>${itemSpriteMarkup(2, 'is-shop-header-item')}</header><div class="farm-fertilizer-grid">${FERTILIZERS.map(item => `<article class="farm-fertilizer-card">${itemSpriteMarkup(item.itemCell, 'is-fertilizer-art')}<div class="farm-fertilizer-copy"><b>${item.name}</b><p>${item.note}</p></div><div class="farm-shop-meta farm-fertilizer-meta"><span>${uiIconMarkup('coin','is-meta-ui')} ${item.price} / 包</span><span>背包 ×${state.supplies[item.id] || 0}</span></div><div class="farm-shop-buy"><button type="button" data-buy-supply="${item.id}" data-qty="1">买 1</button><button type="button" data-buy-supply="${item.id}" data-qty="5">买 5</button></div></article>`).join('')}</div></section>`;
        return;
      }
      const decorCards = DECORATIONS.filter(item => item.shopVisible !== false).map(item => {
        const locked = state.level < item.unlockLevel;
        const owned = Number(state.decorations?.owned?.[item.id]) || 0;
        const placed = placedDecorationCount(item.id);
        return `<article class="farm-decor-shop-card ${locked ? 'is-locked' : ''}">
          ${decorationIconMarkup(item, 'is-decor-shop-art', item.name)}
          <div class="farm-decor-shop-copy"><b>${escapeHtml(item.name)}</b><p>${escapeHtml(item.note)}</p></div>
          <div class="farm-shop-meta"><span>${uiIconMarkup('coin','is-meta-ui')} ${formatNumber(item.price)} / 个</span><span>拥有 ${owned}</span><span>已摆 ${placed}</span></div>
          ${locked ? `<button type="button" disabled>${uiIconMarkup('lock','is-button-ui')} Lv.${item.unlockLevel} 解锁</button>` : `<button type="button" data-buy-decor="${item.id}">购买</button>`}
        </article>`;
      }).join('');
      body.innerHTML = `${shopTabs}<section class="farm-decor-shop-head"><div><b>${uiIconMarkup('farm-expert','is-heading-ui')} 农场装饰</b><small>买下后永久拥有；可在 7 个固定位置自由更换与收回。</small></div><button type="button" data-decor-enter>布置农场</button></section><div class="farm-decor-shop-grid">${decorCards}</div>`;
      return;
    }

    if (activePanel === 'bag') {
      const seedItemsInBag = seedItems().filter(c => (state.seeds[c.id] || 0) > 0);
      const produceItems = CROPS.filter(c => (state.produce[c.id] || 0) > 0);
      const decorOwnedTotal = DECORATIONS.reduce((sum,item)=>sum+(state.decorations?.owned?.[item.id]||0),0);
      const decorRows = DECORATIONS.filter(item => (state.decorations?.owned?.[item.id] || 0) > 0).map(item => {
        const owned = Number(state.decorations.owned[item.id]) || 0;
        const placed = placedDecorationCount(item.id);
        const available = Math.max(0, owned - placed);
        return `<div class="farm-bag-row farm-decor-bag-row">${decorationIconMarkup(item, 'is-bag-decor', item.name)}<div><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.note)} · 可用 ${available} / ${owned}</small></div><em>×${owned}</em></div>`;
      }).join('');
      body.innerHTML = `
        <section class="farm-bag-section">
          <header><b>${uiIconMarkup('newbie-farmer','is-heading-ui')} 种子</b><span>${seedItemsInBag.reduce((s,c)=>s+(state.seeds[c.id]||0),0)} 包</span></header>
          <div class="farm-bag-list">${seedItemsInBag.length ? seedItemsInBag.map(c => {
            const levelLocked = state.level < c.unlockLevel;
            const canPlant = !levelLocked && maxPlantQuantity(c.id) > 0;
            const plantLabel = levelLocked ? `Lv.${c.unlockLevel} 解锁` : (canPlant ? '种植' : '暂无空地');
            return `<div class="farm-bag-row farm-seed-bag-row"><span class="farm-bag-icon">${seedIconMarkup(c)}</span><div><b>${c.isMystery ? c.name : `${c.name}种子`}</b><small>${c.isMystery ? '固定 4 小时 · 随机蔬果' : `${c.growMinutes} 分钟成熟`}</small></div><em>×${state.seeds[c.id]}</em><button type="button" data-plant-from-bag="${c.id}" ${canPlant ? '' : 'disabled'}>${plantLabel}</button></div>`;
          }).join('') : '<p class="farm-empty-state">目前没有种子，可以到商店补货。</p>'}</div>
        </section>
        <section class="farm-bag-section">
          <header><b>${uiIconMarkup('harvest-expert','is-heading-ui')} 农作物</b><span>${produceItems.reduce((s,c)=>s+(state.produce[c.id]||0),0)} 个</span></header>
          <div class="farm-bag-list">${produceItems.length ? produceItems.map(c => {
            const qty = state.produce[c.id] || 0;
            return `<div class="farm-bag-row farm-produce-row"><span class="farm-bag-icon">${produceIconMarkup(c,'is-bag-produce-ui')}</span><div><b>${c.name}</b><small>单个售价 ${uiIconMarkup('coin','is-meta-ui')} ${c.sellPrice} · 全售可得 ${uiIconMarkup('coin','is-meta-ui')} ${qty*c.sellPrice}</small></div><em>×${qty}</em><div class="farm-sell-actions"><button type="button" data-sell="${c.id}" data-qty="1">卖 1</button><button type="button" data-sell="${c.id}" data-qty="all">全部出售</button></div></div>`;
          }).join('') : '<p class="farm-empty-state">成熟作物收成后会放到这里。</p>'}</div>
        </section>
        <section class="farm-bag-section">
          <header><b>${uiIconMarkup('harvest-expert','is-heading-ui')} 肥料</b><span>${FERTILIZERS.reduce((sum,item)=>sum+(state.supplies[item.id]||0),0)} 包</span></header>
          <div class="farm-bag-list">${FERTILIZERS.map(item => `<div class="farm-bag-row farm-supply-row">${itemSpriteMarkup(item.itemCell, 'is-bag-item')}<div><b>${item.name}</b><small>${item.note} · 点正在成长的农田即可使用</small></div><em>×${state.supplies[item.id] || 0}</em></div>`).join('')}</div>
        </section>
        <section class="farm-bag-section farm-station-item-section">
          <header><b>${uiIconMarkup('refresh','is-heading-ui')} 车站道具</b><span>${Math.max(0,Math.floor(Number(state.supplies?.[TRAIN_RESET_TICKET_ID])||0))} 张</span></header>
          <div class="farm-bag-list"><div class="farm-bag-row farm-supply-row"><span class="farm-ticket-icon">${catalogSpriteMarkup(1,'is-bag-ticket','火车重置券')}</span><div><b>火车重置券</b><small>在星辰车站刷新一班尚未发车的订单：倍率、作物种类与需求数量都会重新抽取，已装货物会退回背包。</small></div><em>×${Math.max(0,Math.floor(Number(state.supplies?.[TRAIN_RESET_TICKET_ID])||0))}</em></div></div>
        </section>
        <section class="farm-bag-section farm-decor-bag-section">
          <header><b>${uiIconMarkup('farm-expert','is-heading-ui')} 装饰</b><span>${decorOwnedTotal} 件</span></header>
          <div class="farm-decor-bag-toolbar"><span>已购买的装饰不会消耗，摆放或收回都不收费。</span><button type="button" data-decor-enter>布置农场</button></div>
          <div class="farm-bag-list">${decorRows || '<p class="farm-empty-state">还没有装饰品。到商店的「装饰」分页挑一件喜欢的吧。</p>'}</div>
        </section>`;
      return;
    }

    if (activePanel === 'tasks') {
      const noticeCounts = taskNoticeCounts();
      const tabBadge = count => count > 0 ? `<i class="farm-tab-notice">${count > 9 ? '9+' : count}</i>` : '';
      const tabs = `<div class="farm-task-tabs">
        <button type="button" data-task-tab="daily" class="${activeTaskTab === 'daily' ? 'is-active' : ''}">${uiIconMarkup('daily-task','is-tab-ui')} 每日${tabBadge(noticeCounts.daily)}</button>
        <button type="button" data-task-tab="newbie" class="${activeTaskTab === 'newbie' ? 'is-active' : ''}">${uiIconMarkup('task','is-tab-ui')} 新手${tabBadge(noticeCounts.newbie)}</button>
        <button type="button" data-task-tab="achievements" class="${activeTaskTab === 'achievements' ? 'is-active' : ''}">${uiIconMarkup('achievement','is-tab-ui')} 成就${tabBadge(noticeCounts.achievements)}</button>
        <button type="button" data-task-tab="titles" class="${activeTaskTab === 'titles' ? 'is-active' : ''}">${uiIconMarkup('title','is-tab-ui')} 称号${tabBadge(noticeCounts.titles)}</button>
      </div>`;

      if (activeTaskTab === 'daily') {
        ensureDailyState(farmDay);
        const tasks = dailyTasks();
        const dayLabel = escapeHtml(state.daily?.date || farmDay);
        const socialExp = Math.min(DAILY_SOCIAL_EXP_CAP, Math.max(0, Number(state.daily?.socialExp) || 0));
        const socialPct = Math.min(100, Math.round((socialExp / DAILY_SOCIAL_EXP_CAP) * 100));
        const socialCard = `<section class="farm-social-exp-card ${socialExp >= DAILY_SOCIAL_EXP_CAP ? 'is-complete' : ''}">
          <div class="farm-social-exp-copy"><span>${uiIconMarkup('cooperate','is-section-ui')}</span><div><b>今日农友互助 EXP</b><small>助力浇水 +${DAILY_SOCIAL_WATER_EXP}/格 · 每日首次拜访不同农友 +${DAILY_SOCIAL_VISIT_EXP}/人 · 每日上限 ${DAILY_SOCIAL_EXP_CAP} EXP · 除虫随机奖励另计</small></div></div>
          <strong>${socialExp} / ${DAILY_SOCIAL_EXP_CAP}</strong>
          <div class="farm-social-exp-bar"><i style="width:${socialPct}%"></i></div>
        </section>`;

        const mastery = dailyMasteryPoints();
        const masteryRewards = DAILY_MASTERY_REWARDS.map(item => {
          const claimed = isDailyMasteryClaimed(item.points);
          const ready = mastery >= item.points;
          const action = claimed
            ? `<span class="farm-mastery-claimed">${uiIconMarkup('success','is-inline-ui')} 已领取</span>`
            : ready
              ? `<button type="button" data-claim-daily-mastery="${item.points}">${uiIconMarkup('claim','is-button-ui')}领取</button>`
              : `<span class="farm-mastery-locked">${mastery} / ${item.points}</span>`;
          return `<article class="farm-mastery-reward ${ready ? 'is-ready' : ''} ${claimed ? 'is-claimed' : ''}"><div><b>${item.points}</b><small>熟练度</small></div><p>${rewardTextMarkup(item.rewardText)}</p>${action}</article>`;
        }).join('');
        const masteryCard = `<section class="farm-daily-mastery ${mastery >= 100 ? 'is-complete' : ''}">
          <header><div><span>${uiIconMarkup('daily-task','is-section-ui')}</span><div><b>今日熟练度</b><small>每完成 1 项每日任务 +${DAILY_MASTERY_PER_TASK} · 完成 5 项即可达到 100</small></div></div><strong>${mastery} / 100</strong></header>
          <div class="farm-mastery-bar"><i style="width:${mastery}%"></i><span style="left:40%"></span><span style="left:80%"></span></div>
          <div class="farm-mastery-rewards">${masteryRewards}</div>
          <footer><span>${state.daily.rerollUsed ? `${uiIconMarkup('success','is-inline-ui')} 今日免费换任务已使用` : `${uiIconMarkup('refresh','is-inline-ui')} 今日可免费更换 1 项未完成任务`}</span><em>100 熟练度奖励：火车重置券可刷新倍率与货物需求</em></footer>
        </section>`;

        const dailyItems = tasks.map((task,index) => {
          const progress = dailyProgress(task);
          const complete = isDailyComplete(task);
          const claimed = isDailyClaimed(task);
          const pct = Math.min(100, Math.round((progress / task.target) * 100));
          let action = '';
          if (claimed) action = `<span class="farm-task-claimed">${uiIconMarkup('success','is-inline-ui')} 已领取</span>`;
          else if (complete) action = `<button type="button" data-claim-daily="${task.id}">${uiIconMarkup('claim','is-button-ui')}领取奖励</button>`;
          else action = `<div class="farm-daily-task-actions"><span class="farm-task-progress-text">${progress} / ${task.target}</span>${state.daily.rerollUsed ? '' : `<button type="button" class="farm-task-reroll" data-reroll-daily-task="${index}">${uiIconMarkup('refresh','is-button-ui')}换任务</button>`}</div>`;
          return `<article class="farm-task-item farm-daily-item ${complete ? 'is-complete' : ''} ${claimed ? 'is-claimed' : ''}" data-daily-task-slot="${index}">
            <div class="farm-task-copy"><b>${uiIconMarkup(task.category === 'social' ? 'cooperate' : task.category === 'train' ? 'refresh' : 'task','is-heading-ui')}${task.title}</b><p>${task.desc}</p><small>奖励：${rewardTextMarkup(task.rewardText)} · 完成 +${DAILY_MASTERY_PER_TASK} 熟练度</small></div>
            <div class="farm-task-side">${action}</div>
            <div class="farm-task-bar"><i style="width:${pct}%"></i></div>
          </article>`;
        }).join('');

        body.innerHTML = `${tabs}<section class="farm-daily-head"><div><small>UTC+8 每日 00:00 重置</small><b>${dayLabel}</b></div><span>${uiIconMarkup('daily-task','is-section-ui')} 随机 5 项 · Lv.${Math.max(1,Number(state.daily.levelSnapshot)||1)} 任务池</span></section>${socialCard}${masteryCard}<div class="farm-task-list">${dailyItems}</div>`;
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
          else if (claimed) action = `<span class="farm-task-claimed">${uiIconMarkup('success','is-inline-ui')} 已领取</span>`;
          else if (complete) action = `<button type="button" data-claim-task="${task.id}">${uiIconMarkup('claim','is-button-ui')}领取奖励</button>`;
          else action = `<span class="farm-task-progress-text">${progress} / ${task.target}</span>`;
          return `<article class="farm-task-item ${complete ? 'is-complete' : ''} ${claimed ? 'is-claimed' : ''} ${task.future ? 'is-future' : ''}">
            <div class="farm-task-copy"><b>${uiIconMarkup('task','is-heading-ui')}${task.title}</b><p>${task.desc}</p><small>奖励：${rewardTextMarkup(task.rewardText)}</small></div>
            <div class="farm-task-side">${action}</div>
            <div class="farm-task-bar"><i style="width:${task.future ? 0 : pct}%"></i></div>
          </article>`;
        }).join('')}</div>`;
        return;
      }

      if (activeTaskTab === 'achievements') {
        const groups = ACHIEVEMENT_GROUPS.map(group => {
          const count = noticeCounts.achievementByGroup[group.id] || 0;
          return `<button type="button" data-achievement-group="${group.id}" class="${activeAchievementGroup === group.id ? 'is-active' : ''}">${uiIconMarkup(groupUiIconKey(group.id),'is-tab-ui')} ${group.label}${count ? `<i class="farm-chip-notice">${count > 9 ? '9+' : count}</i>` : ''}</button>`;
        }).join('');
        const items = ACHIEVEMENTS.filter(item => item.group === activeAchievementGroup);
        body.innerHTML = `${tabs}<div class="farm-achievement-groups">${groups}</div><div class="farm-task-list">${items.map(item => {
          const progress = achievementProgress(item);
          const complete = isAchievementComplete(item);
          const claimed = isAchievementClaimed(item);
          const pct = Math.min(100, Math.round((progress / item.target) * 100));
          const action = claimed
            ? `<span class="farm-task-claimed">${uiIconMarkup('success','is-inline-ui')} 已领取</span>`
            : complete
              ? `<button type="button" data-claim-achievement="${item.id}">${uiIconMarkup('claim','is-button-ui')}领取奖励</button>`
              : `<span class="farm-task-progress-text">${formatNumber(progress)} / ${formatNumber(item.target)}</span>`;
          return `<article class="farm-task-item farm-achievement-item ${complete ? 'is-complete' : ''} ${claimed ? 'is-claimed' : ''}">
            <div class="farm-task-copy"><b>${uiIconMarkup(groupUiIconKey(item.group),'is-heading-ui')}${item.title}</b><p>${item.desc}</p><small>奖励：${rewardTextMarkup(item.rewardText)}</small></div>
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
          <span>${uiIconMarkup(titleUiIconKey(equippedTitle.id),'is-title-current-ui')}</span><div><small>目前展示称号</small><b>【${escapeHtml(equippedTitle.name)}】</b><p>${escapeHtml(equippedTitle.desc)}</p></div>
        </section>
        <div class="farm-title-grid">${TITLES.map(title => {
          const unlocked = state.titles?.unlocked?.includes(title.id);
          const equipped = state.titles?.equipped === title.id;
          return `<article class="farm-title-card ${unlocked ? 'is-unlocked' : 'is-locked'} ${equipped ? 'is-equipped' : ''}">
            <span>${unlocked ? uiIconMarkup(titleUiIconKey(title.id),'is-title-card-ui') : uiIconMarkup('lock','is-title-card-ui')}</span>
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
        const medal = rank === 1 ? uiIconMarkup('rank1','is-rank-medal-ui') : rank === 2 ? uiIconMarkup('rank2','is-rank-medal-ui') : rank === 3 ? uiIconMarkup('rank3','is-rank-medal-ui') : `<span>${rank}</span>`;
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
          <div class="farm-rank-player"><b>${escapeHtml(row.display_name)} <i>${genderSymbol(row.sex)}</i></b><small>Lv.${formatNumber(row.farm_level)} · <span class="farm-public-title">${uiIconMarkup(titleUiIconKey(publicTitle.id),'is-public-title-ui')}【${escapeHtml(publicTitle.name)}】</span></small></div>
          <div class="farm-rank-value"><b>${rankingSort === 'coins' ? coinInline(row.coins) : `Lv.${formatNumber(row.farm_level)}`}</b><small>${rankingSort === 'coins' ? `Lv.${formatNumber(row.farm_level)}` : coinInline(row.coins)}</small></div>
          <div class="farm-rank-action">${action}</div>
        </article>`;
      }).join('') : '';

      body.innerHTML = `
        <div class="farm-ranking-toolbar">
          <div class="farm-ranking-tabs" role="tablist" aria-label="排行榜类型">
            <button type="button" data-ranking-tab="level" class="${rankingSort === 'level' ? 'is-active' : ''}">${uiIconMarkup('farm-expert','is-tab-ui')} 等级榜</button>
            <button type="button" data-ranking-tab="coins" class="${rankingSort === 'coins' ? 'is-active' : ''}">${uiIconMarkup('coin','is-tab-ui')} 金币榜</button>
          </div>
          <button type="button" class="farm-refresh-button" data-refresh-ranking ${rankingLoading ? 'disabled' : ''}>${uiIconMarkup('refresh','is-button-ui')} 刷新</button>
        </div>
        ${rankingLoading ? '<div class="farm-network-state"><span class="farm-spinner"></span><b>正在读取真实农场排名…</b></div>' : ''}
        ${rankingError ? `<div class="farm-network-state is-error"><b>${uiIconMarkup('warning','is-heading-ui')} ${escapeHtml(rankingError)}</b></div>` : ''}
        ${!rankingLoading && !rankingError && !rows.length ? '<div class="farm-network-state"><b>目前还没有可显示的农场玩家。</b><small>玩家建立云端农场后会自动出现在这里。</small></div>' : ''}
        ${!rankingLoading && !rankingError && rows.length ? `<div class="farm-ranking-list">${list}</div>` : ''}`;
      return;
    }

    if (activePanel === 'friends') {
      if (!friendsLoading && !friendsLoadedAt && !friendsError) setTimeout(() => loadFriends(false), 0);
      if (!farmActivityLoading && !farmActivityLoadedAt && !farmActivityError) setTimeout(() => loadFarmActivity(false, false), 0);

      const incoming = friendRows.filter(row => row.relation_state === 'pending_in');
      const accepted = friendRows.filter(row => row.relation_state === 'friend')
        .sort((a,b) => (Number(b.interaction_score)||0) - (Number(a.interaction_score)||0) || String(a.display_name||'').localeCompare(String(b.display_name||''),'zh-Hans-CN'));
      const outgoing = friendRows.filter(row => row.relation_state === 'pending_out');
      const npcFriendsDetailed = npcFriendIds().map(npcById).filter(Boolean).map(npc => ({
        npc,
        summary:friendInteractionSummaryFromPayload(buildNpcFarmPayload(npc.id),{npc:true})
      })).sort((a,b) => b.summary.score - a.summary.score || a.npc.name.localeCompare(b.npc.name,'zh-Hans-CN'));
      const npcFriends = npcFriendsDetailed.map(item => item.npc);
      const npcSuggestions = NPC_FARMERS.filter(npc => !isNpcFriend(npc.id));
      const unreadActivities = Math.max(0, Number(farmActivityUnreadCount) || 0) + npcUnreadCount();
      const receivedActivityRows = [
        ...farmActivityRows.filter(row => (row.direction || 'received') === 'received'),
        ...npcActivityRows()
      ].sort((a,b) => new Date(b.activity_at).getTime() - new Date(a.activity_at).getTime()).slice(0,50);
      const sentActivityRows = [
        ...farmActivityRows.filter(row => row.direction === 'sent'),
        ...npcFootprintRows()
      ].sort((a,b) => new Date(b.activity_at).getTime() - new Date(a.activity_at).getTime()).slice(0,50);
      const activeActivityRows = activeActivityDirection === 'sent' ? sentActivityRows : receivedActivityRows;
      const interactableCount = accepted.filter(row => Number(row.interaction_score) > 0).length + npcFriendsDetailed.filter(item => item.summary.score > 0).length;
      const visitedToday = dailyVisitedFriendSet();

      const activityHtml = activeActivityRows.map(row => {
        const type = String(row.activity_type || 'visit');
        const direction = row.direction || 'received';
        const crop = CROPS.find(c => c.id === row.crop_id) || {name:'作物', icon:'🌿'};
        const isNpc = Boolean(row.is_npc);
        const safeId = escapeHtml(row.peer_id || row.actor_id || '');
        const who = escapeHtml(row.display_name || '农场好友');
        const sex = row.sex === 'male' ? '♂' : row.sex === 'female' ? '♀' : '';
        const when = escapeHtml(formatFarmActivityTime(row.activity_at));
        let icon = uiIconMarkup('notification','is-activity-ui');
        let title = direction === 'sent' ? `你和 ${who} 有一次农场互动` : `${who}${sex ? ` ${sex}` : ''} 来过你的农场`;
        let detail = when;

        if (direction === 'sent') {
          if (type === 'visit') {
            icon = isNpc ? uiIconMarkup('farm-expert','is-activity-ui') : uiIconMarkup('visit','is-activity-ui');
            title = `你拜访了 ${who}${isNpc ? ' NPC' : ''} 的农场`;
          } else if (type === 'steal') {
            icon = produceIconMarkup(crop,'is-activity-produce-ui');
            title = `你从 ${who}${isNpc ? ' NPC' : ''} 的农场取得了 ${escapeHtml(crop.name)} ×${Math.max(1,Number(row.amount)||1)}`;
            if (Number.isInteger(Number(row.plot_id))) detail += ` · 第 ${Number(row.plot_id)+1} 格`;
          } else if (type === 'help_bug') {
            icon = uiIconMarkup('harvest-expert','is-activity-ui');
            const batchCount = !Number.isInteger(Number(row.plot_id)) ? Math.max(1,Number(row.amount)||1) : 1;
            title = batchCount > 1 ? `你帮 ${who} 一键除虫 ×${batchCount} 格` : `你帮 ${who} 的作物除虫了`;
            if (Number.isInteger(Number(row.plot_id))) detail += ` · 第 ${Number(row.plot_id)+1} 格`;
          } else if (type === 'help_water') {
            icon = uiIconMarkup('rainy','is-activity-ui');
            const batchCount = !Number.isInteger(Number(row.plot_id)) ? Math.max(1,Number(row.amount)||1) : 1;
            title = batchCount > 1 ? `你帮 ${who}${isNpc ? ' NPC' : ''} 一键助力浇水 ×${batchCount} 格` : `你帮 ${who}${isNpc ? ' NPC' : ''} 的作物助力浇水了`;
            detail += ' · 收获时间 -5%';
            if (Number.isInteger(Number(row.plot_id))) detail += ` · 第 ${Number(row.plot_id)+1} 格`;
          }
        } else if (type === 'visit' || type === 'npc_visit') {
          icon = isNpc ? uiIconMarkup('farm-expert','is-activity-ui') : uiIconMarkup('visit','is-activity-ui');
          title = `${who}${sex ? ` ${sex}` : ''}${isNpc ? ' NPC' : ''} 拜访了你的农场`;
        } else if (type === 'steal') {
          icon = produceIconMarkup(crop,'is-activity-produce-ui');
          title = `${who}${sex ? ` ${sex}` : ''} 偷走了 ${escapeHtml(crop.name)} ×${Math.max(1, Number(row.amount) || 1)}`;
          if (Number.isInteger(Number(row.plot_id))) detail += ` · 第 ${Number(row.plot_id) + 1} 格`;
        } else if (type === 'help_bug' || type === 'npc_help_bug') {
          icon = uiIconMarkup('harvest-expert','is-activity-ui');
          const batchCount = !Number.isInteger(Number(row.plot_id)) ? Math.max(1,Number(row.amount)||1) : 1;
          title = batchCount > 1
            ? `${who}${sex ? ` ${sex}` : ''}${isNpc ? ' NPC' : ''} 帮你一键除虫 ×${batchCount} 格`
            : `${who}${sex ? ` ${sex}` : ''}${isNpc ? ' NPC' : ''} 帮你的作物除虫了`;
          if (Number.isInteger(Number(row.plot_id))) detail += ` · 第 ${Number(row.plot_id) + 1} 格`;
        } else if (type === 'help_water') {
          icon = uiIconMarkup('rainy','is-activity-ui');
          const batchCount = !Number.isInteger(Number(row.plot_id)) ? Math.max(1,Number(row.amount)||1) : 1;
          title = batchCount > 1
            ? `${who}${sex ? ` ${sex}` : ''} 帮你一键助力浇水 ×${batchCount} 格`
            : `${who}${sex ? ` ${sex}` : ''} 帮你的作物助力浇水了`;
          detail += ' · 收获时间 -5%';
          if (Number.isInteger(Number(row.plot_id))) detail += ` · 第 ${Number(row.plot_id)+1} 格`;
        }

        const visitAction = safeId
          ? isNpc
            ? `<button type="button" class="farm-friend-action is-visit" data-npc-visit="${safeId}">${direction === 'sent' ? '再访' : '回访'}</button>`
            : `<button type="button" class="farm-friend-action is-visit" data-friend-visit="${safeId}">${direction === 'sent' ? '再访' : '回访'}</button>`
          : '';

        return `<article class="farm-activity-row is-${escapeHtml(type)} ${direction === 'received' && row.is_unread ? 'is-unread' : ''} ${isNpc ? 'is-npc-activity' : ''}">
          <div class="farm-activity-icon">${icon}</div>
          <div class="farm-activity-copy"><b>${title}</b><small>${detail}</small></div>
          ${direction === 'received' && row.is_unread ? '<span class="farm-activity-new">NEW</span>' : ''}
          ${visitAction}
        </article>`;
      }).join('');

      const overviewMarkup = ({mature=0,stealable=0,pest=0,water=0,score=0} = {}) => `
        <div class="farm-friend-overview ${score > 0 ? 'is-active' : ''}">
          ${score > 0 ? '<strong>🔥 可互动</strong>' : '<strong class="is-idle">🌱 成长中</strong>'}
          <span>🌾 成熟 <b>${mature}</b></span>
          <span>🥷 可偷 <b>${stealable}</b></span>
          <span>🐛 虫害 <b>${pest}</b></span>
          <span>💧 可助力 <b>${water}</b></span>
        </div>`;

      const friendCard = (row, mode) => {
        const safeId = escapeHtml(row.user_id);
        const publicTitle = titleById(row.title_id || 'newbie');
        const summary = {
          mature:Math.max(0,Number(row.mature_count)||0),
          stealable:Math.max(0,Number(row.stealable_count)||0),
          pest:Math.max(0,Number(row.pest_count)||0),
          water:Math.max(0,Number(row.help_water_count)||0),
          score:Math.max(0,Number(row.interaction_score)||0)
        };
        const wasVisited = mode === 'friend' && visitedToday.has(String(row.user_id));
        const visitedTag = wasVisited ? '<span class="farm-friend-visited-badge">✓ 今日已拜访</span>' : '';
        const base = `<div class="farm-friend-avatar">${uiIconMarkup('friends','is-friend-avatar-ui')}<small>${row.sex === 'male' ? '♂' : row.sex === 'female' ? '♀' : ''}</small></div>
          <div class="farm-friend-copy"><b>${escapeHtml(row.display_name)} ${visitedTag}</b><small>Lv.${formatNumber(row.farm_level)} · ${coinInline(row.coins)} · <span class="farm-public-title">${uiIconMarkup(titleUiIconKey(publicTitle.id),'is-public-title-ui')}【${escapeHtml(publicTitle.name)}】</span></small>${mode === 'friend' ? overviewMarkup(summary) : ''}</div>`;
        let actions = '';
        if (mode === 'incoming') actions = `<div class="farm-friend-buttons"><button type="button" class="is-primary" data-friend-accept="${safeId}">接受</button><button type="button" data-friend-reject="${safeId}">忽略</button></div>`;
        else if (mode === 'outgoing') actions = `<div class="farm-friend-buttons"><span>等待对方确认</span><button type="button" data-friend-cancel="${safeId}">取消</button></div>`;
        else actions = `<div class="farm-friend-buttons"><button type="button" class="is-primary" data-friend-visit="${safeId}">拜访农场</button><button type="button" data-friend-remove="${safeId}">删除</button></div>`;
        return `<article class="farm-friend-row ${mode === 'friend' && summary.score > 0 ? 'is-interactable' : ''} ${wasVisited ? 'is-visited-today' : ''}" data-friend-card-id="${safeId}" data-friend-card-kind="friend">${base}${actions}</article>`;
      };

      const npcCard = (npc, isFriend, summary=null) => {
        const publicTitle = titleById(npc.titleId || 'newbie');
        const safeId = escapeHtml(npc.id);
        const liveSummary = summary || (isFriend ? friendInteractionSummaryFromPayload(buildNpcFarmPayload(npc.id),{npc:true}) : null);
        const wasVisited = isFriend && visitedToday.has(String(npc.id));
        const visitedTag = wasVisited ? '<span class="farm-friend-visited-badge">✓ 今日已拜访</span>' : '';
        const actions = isFriend
          ? `<div class="farm-friend-buttons"><button type="button" class="is-primary" data-npc-visit="${safeId}">拜访农场</button><button type="button" data-npc-remove="${safeId}">移出农友</button></div>`
          : `<div class="farm-friend-buttons"><button type="button" class="is-primary" data-npc-add="${safeId}">＋ 加为农友</button></div>`;
        return `<article class="farm-friend-row farm-npc-row ${liveSummary?.score > 0 ? 'is-interactable' : ''} ${wasVisited ? 'is-visited-today' : ''}" data-friend-card-id="${safeId}" data-friend-card-kind="npc">
          <div class="farm-friend-avatar farm-npc-avatar">${produceIconMarkup(cropById(npc.favorites?.[0]),'is-npc-avatar-ui')}</div>
          <div class="farm-friend-copy"><b>${escapeHtml(npc.name)} <span class="farm-npc-badge">NPC</span> ${visitedTag}</b><small>Lv.${formatNumber(npc.level)} · ${escapeHtml(npc.trait)} · <span class="farm-public-title">${uiIconMarkup(titleUiIconKey(publicTitle.id),'is-public-title-ui')}【${escapeHtml(publicTitle.name)}】</span></small>${isFriend && liveSummary ? overviewMarkup(liveSummary) : `<p>${escapeHtml(npc.note)}</p>`}</div>
          ${actions}
        </article>`;
      };

      const tabBadge = count => count > 0 ? `<i class="farm-friend-tab-badge">${count > 9 ? '9+' : count}</i>` : '';
      let tabContent = '';

      if (activeFriendTab === 'activity') {
        tabContent = `<section class="farm-friend-section farm-activity-section">
          <header><b>${uiIconMarkup('notification','is-heading-ui')} 农场动态</b><span>${activeActivityRows.length}</span></header>
          <div class="farm-activity-direction-tabs" role="tablist" aria-label="农场动态方向">
            <button type="button" data-activity-direction="received" class="${activeActivityDirection === 'received' ? 'is-active' : ''}">收到的互动 ${tabBadge(unreadActivities)}</button>
            <button type="button" data-activity-direction="sent" class="${activeActivityDirection === 'sent' ? 'is-active' : ''}">我的足迹 <small>${sentActivityRows.length}</small></button>
          </div>
          ${farmActivityLoading && !activeActivityRows.length ? '<div class="farm-network-state"><span class="farm-spinner"></span><b>正在读取农场动态…</b></div>' : activityHtml || `<p class="farm-empty-state">${activeActivityDirection === 'sent' ? '今天还没有留下足迹。去好友农场拜访、偷菜、除虫或助力浇水吧。' : '还没有收到互动。好友拜访、偷菜、除虫或助力浇水后，会在这里留下记录。'}</p>`}
        </section>`;
      } else if (activeFriendTab === 'friends') {
        tabContent = `
          <div class="farm-friend-sort-note">🔥 有成熟可偷、虫害或可助力浇水的农友会自动排在前面。</div>
          <section class="farm-friend-section"><header><b>${uiIconMarkup('friends','is-heading-ui')} 真人好友</b><span>${accepted.length}</span></header>${accepted.length ? accepted.map(row => friendCard(row,'friend')).join('') : '<p class="farm-empty-state">还没有真人好友。可以到排行榜找到农友并点击「＋ 好友」。</p>'}</section>
          <section class="farm-friend-section farm-npc-section"><header><b>${uiIconMarkup('farm-expert','is-heading-ui')} NPC 农友</b><span>${npcFriends.length}</span></header>${npcFriendsDetailed.length ? npcFriendsDetailed.map(item => npcCard(item.npc,true,item.summary)).join('') : '<p class="farm-empty-state">还没有 NPC 农友。下面可以挑几位加入，让农场世界更热闹。</p>'}</section>
          ${npcSuggestions.length ? `<section class="farm-friend-section farm-npc-section is-suggestions"><header><b>${uiIconMarkup('exp','is-heading-ui')} NPC 农友推荐</b><span>${npcSuggestions.length}</span></header><div class="farm-npc-note">NPC 会自己种菜、收菜，也可能帮你除虫；不会偷你的菜、不参加真人排行榜。加入后可以偷成熟作物，也能帮成长中的作物助力 -5%。</div>${npcSuggestions.map(npc => npcCard(npc,false)).join('')}</section>` : ''}
        `;
      } else {
        tabContent = `${incoming.length ? `<section class="farm-friend-section"><header><b>${uiIconMarkup('add-friend','is-heading-ui')} 收到的申请</b><span>${incoming.length}</span></header>${incoming.map(row => friendCard(row,'incoming')).join('')}</section>` : `<section class="farm-friend-section"><header><b>${uiIconMarkup('add-friend','is-heading-ui')} 收到的申请</b><span>0</span></header><p class="farm-empty-state">目前没有待确认的好友申请。</p></section>`}
          ${outgoing.length ? `<section class="farm-friend-section"><header><b>${uiIconMarkup('cooldown','is-heading-ui')} 已送出的申请</b><span>${outgoing.length}</span></header>${outgoing.map(row => friendCard(row,'outgoing')).join('')}</section>` : ''}`;
      }

      body.innerHTML = `
        <div class="farm-friends-summary"><span>${uiIconMarkup('friends','is-summary-ui')} 真人 <b>${accepted.length}</b></span><span>${uiIconMarkup('farm-expert','is-summary-ui')} NPC <b>${npcFriends.length}</b></span><span>🔥 可互动 <b>${interactableCount}</b></span><span>${uiIconMarkup('notification','is-summary-ui')} 未读 <b>${unreadActivities}</b></span><button type="button" class="farm-refresh-button" data-refresh-friends ${(friendsLoading || farmActivityLoading) ? 'disabled' : ''}>${uiIconMarkup('refresh','is-button-ui')} 刷新</button></div>
        <div class="farm-friend-tabs" role="tablist" aria-label="好友功能">
          <button type="button" data-friend-tab="activity" class="${activeFriendTab === 'activity' ? 'is-active' : ''}">${uiIconMarkup('notification','is-tab-ui')} 动态 ${tabBadge(unreadActivities)}</button>
          <button type="button" data-friend-tab="friends" class="${activeFriendTab === 'friends' ? 'is-active' : ''}">${uiIconMarkup('friends','is-tab-ui')} 好友 <small>${accepted.length + npcFriends.length}</small></button>
          <button type="button" data-friend-tab="requests" class="${activeFriendTab === 'requests' ? 'is-active' : ''}">${uiIconMarkup('add-friend','is-tab-ui')} 申请 ${tabBadge(incoming.length)}</button>
        </div>
        ${(friendsLoading && !friendRows.length && activeFriendTab !== 'friends') ? '<div class="farm-network-state"><span class="farm-spinner"></span><b>正在读取真人好友资料…</b></div>' : ''}
        ${friendsError ? `<div class="farm-network-state is-error"><b>${uiIconMarkup('warning','is-heading-ui')} 真人好友暂时无法读取：${escapeHtml(friendsError)}</b><small>NPC 农友仍可正常使用。</small></div>` : ''}
        ${farmActivityError && activeFriendTab === 'activity' ? `<div class="farm-network-state is-error"><b>${uiIconMarkup('warning','is-heading-ui')} 真人农场动态暂时无法读取：${escapeHtml(farmActivityError)}</b></div>` : ''}
        ${tabContent}`;
      if (activeFriendTab === 'friends') restoreFriendListPositionSoon();
    }
  }

  function openModal({icon='newbie-farmer', iconHtml='', eyebrow='STELLAR FARM', title='农场', subtitle='', body=''}) {
    const modalIcon = $('farmModalIcon');
    if (modalIcon) {
      if (iconHtml) modalIcon.innerHTML = iconHtml;
      else if (icon === 'train') modalIcon.innerHTML = '<img class="farm-modal-asset-icon" src="../images/farm/train-engine.png?v=0.19.2" alt="">';
      else {
        const mapped = UI_ICON_INDEX[icon] ? icon : (UI_EMOJI_ICON[icon] || (icon === '🌱' ? 'newbie-farmer' : ''));
        modalIcon.innerHTML = mapped ? uiIconMarkup(mapped,'is-modal-ui') : escapeHtml(icon || '');
      }
    }
    $('farmModalEyebrow').textContent = eyebrow;
    $('farmModalTitle').textContent = title;
    $('farmModalSubtitle').textContent = subtitle;
    $('farmModalBody').innerHTML = body;
    $('farmModal').hidden = false;
    document.body.classList.add('farm-modal-open');
  }

  function closeModal() {
    closeTrainLoadConfirm();
    $('farmModal').hidden = true;
    document.body.classList.remove('farm-modal-open');
    activePanel = null;
    previewOutfitId = '';
    previewPetId = '';
    $('farmModal')?.classList.remove('is-train-modal');
  }

  function toast(title, detail='', type='normal') {
    const host = $('farmToastRegion');
    if (!host) return;
    const el = document.createElement('div');
    el.className = `farm-toast farm-toast-${type}`;
    el.innerHTML = `<b>${uiTextMarkup(title)}</b>${detail ? `<span>${uiTextMarkup(detail)}</span>` : ''}`;
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
    const localClock = localFarmEventSlot();
    if (localClock.day !== farmDay) {
      const previousSlot = farmEventSlotKey;
      ensureDailyState(localClock.day, {persist:true});
      ensureTrainState(localClock.day, {persist:true});
      farmEventSlotKey = localClock.key;
      renderAll();
      announceFarmEventChange(previousSlot, farmEventSlotKey);
      if (cloudReady) syncFarmDay(true).catch(() => {});
    } else {
      if (localClock.key !== farmEventSlotKey) {
        const previousSlot = farmEventSlotKey;
        farmEventSlotKey = localClock.key;
        renderDailyEventScene();
        announceFarmEventChange(previousSlot, farmEventSlotKey);
      }
      if (cloudReady && Date.now() - farmDaySyncAt >= FARM_DAY_SYNC_MS) {
        syncFarmDay(false).catch(() => {});
      }
    }
    const readyBefore = trainReadySlots(state.train).length;
    const hubNow = ensureTrainState(farmDay, {persist:true});
    const readyAfter = trainReadySlots(hubNow).length;
    renderTrainStation();
    if (activePanel === 'train') {
      const expiredCard = document.querySelector('.farm-train-slot.is-cooldown [data-train-cooldown-until]');
      if (readyBefore !== readyAfter || (expiredCard && Number(expiredCard.dataset.trainCooldownUntil) <= Date.now())) renderActivePanel();
      document.querySelectorAll('[data-train-cooldown-until]').forEach(el => { el.textContent = formatTrainWait(Number(el.dataset.trainCooldownUntil) - Date.now()); });
      const midnight = document.querySelector('[data-train-midnight]');
      if (midnight) midnight.textContent = trainNextResetText();
    }
    renderStats();
    updateFarmEventRuntimeLabels();
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
    // tiny revision field about once every two minutes; download the full farm JSON only if it changed.
    if (cloudReady && !cloudBusy && !document.hidden && Date.now() - cloudLastRevisionCheckAt >= CLOUD_REVISION_POLL_MS) {
      checkCloudRevision().catch(() => {});
    }
    if (cloudReady && !document.hidden && Date.now() - farmActivityUnreadCheckedAt >= FARM_ACTIVITY_UNREAD_POLL_MS) {
      refreshFarmActivityUnread(false).catch(() => {});
    }
    // NPCs are lazy-simulated: only one inexpensive local check per minute.
    // An actual help action can occur at most once per 45-minute bucket and
    // then uses the existing farm save path, so there is no NPC polling traffic.
    if (!document.hidden && Date.now() - npcRuntimeCheckedAt >= 60 * 1000) {
      npcRuntimeCheckedAt = Date.now();
      maybeNpcHelpPest();
      maybeNpcVisitPlayer();
    }
  }

  function handleClick(event) {
    if (event.target.classList?.contains('farm-train-load-confirm')) { closeTrainLoadConfirm(); return; }
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

    const characterTab = event.target.closest('[data-character-tab]');
    if (characterTab) {
      activeCharacterTab = characterTab.dataset.characterTab === 'pet' ? 'pet' : 'avatar';
      renderActivePanel();
      return;
    }


    const petEntry = event.target.closest('[data-open-pet-tab]');
    if (petEntry) {
      activeCharacterTab = 'pet';
      openPanel('character');
      return;
    }

    const petPreview = event.target.closest('[data-preview-pet]');
    if (petPreview) {
      const pet = petById(petPreview.dataset.previewPet);
      if (!pet?.released) return;
      previewPetId = state.pets?.active === pet.id ? '' : (previewPetId === pet.id ? '' : pet.id);
      renderActivePanel();
      return;
    }

    const petFollow = event.target.closest('[data-follow-pet]');
    if (petFollow) {
      const pet = petById(petFollow.dataset.followPet);
      if (!pet?.released || !petOwned(pet.id)) return;
      state.pets.active = pet.id;
      previewPetId = '';
      saveState();
      renderFarmPet();
      renderActivePanel();
      return;
    }

    const petUnfollow = event.target.closest('[data-unfollow-pet]');
    if (petUnfollow) {
      const pet = petById(petUnfollow.dataset.unfollowPet);
      if (!pet || state.pets?.active !== pet.id) return;
      state.pets.active = null;
      previewPetId = '';
      saveState();
      renderFarmPet();
      renderActivePanel();
      return;
    }

    const outfitPreview = event.target.closest('[data-preview-outfit]');
    if (outfitPreview) {
      const outfit = avatarOutfitById(outfitPreview.dataset.previewOutfit);
      const gender = AVATAR_GENDERS.includes(state.avatar?.gender) ? state.avatar.gender : 'male';
      if (!outfit.released || !outfitSupportsGender(outfit,gender)) return;
      previewOutfitId = state.avatar?.outfit === outfit.id ? '' : outfit.id;
      renderActivePanel();
      return;
    }

    const outfitApply = event.target.closest('[data-apply-outfit]');
    if (outfitApply) {
      const outfit = avatarOutfitById(outfitApply.dataset.applyOutfit);
      const gender = AVATAR_GENDERS.includes(state.avatar?.gender) ? state.avatar.gender : 'male';
      if (!outfitOwned(outfit.id) || !outfit.released || !outfitSupportsGender(outfit,gender)) return;
      state.avatar.outfit = outfit.id;
      previewOutfitId = '';
      saveState();
      renderFarmAvatar();
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

    const dailyMasteryClaim = event.target.closest('[data-claim-daily-mastery]');
    if (dailyMasteryClaim) {
      claimDailyMastery(Number(dailyMasteryClaim.dataset.claimDailyMastery));
      return;
    }

    const dailyReroll = event.target.closest('[data-reroll-daily-task]');
    if (dailyReroll) {
      rerollDailyTask(Number(dailyReroll.dataset.rerollDailyTask));
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

    const shopTab = event.target.closest('[data-shop-tab]');
    if (shopTab) {
      activeShopTab = ['seeds','care','decor'].includes(shopTab.dataset.shopTab) ? shopTab.dataset.shopTab : 'seeds';
      renderActivePanel();
      return;
    }

    if (event.target.closest('[data-decor-enter]')) { enterDecorationMode(); return; }
    if (event.target.closest('[data-decor-exit]')) { exitDecorationMode(); return; }

    const decorSlot = event.target.closest('[data-decor-slot]');
    if (decorSlot && decorationMode) { openDecorationSlot(Number(decorSlot.dataset.decorSlot)); return; }

    const buyDecor = event.target.closest('[data-buy-decor]');
    if (buyDecor) { buyDecoration(buyDecor.dataset.buyDecor); return; }

    const placeDecor = event.target.closest('[data-place-decor][data-decor-target-slot]');
    if (placeDecor) { placeDecoration(Number(placeDecor.dataset.decorTargetSlot), placeDecor.dataset.placeDecor); return; }

    const removeDecor = event.target.closest('[data-remove-decor]');
    if (removeDecor) { removeDecoration(Number(removeDecor.dataset.removeDecor)); return; }

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
      if (nextTab === 'activity') {
        markNpcActivitiesSeen();
        farmActivityLoadedAt = 0;
        loadFarmActivity(true, true).catch(() => {});
      } else renderActivePanel();
      return;
    }

    const activityDirection = event.target.closest('[data-activity-direction]');
    if (activityDirection) {
      activeActivityDirection = activityDirection.dataset.activityDirection === 'sent' ? 'sent' : 'received';
      if (activeActivityDirection === 'received') {
        markNpcActivitiesSeen();
        farmActivityLoadedAt = 0;
        loadFarmActivity(true, true).catch(() => {});
      } else renderActivePanel();
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
    const returnFriendList = event.target.closest('[data-return-friend-list]');
    if (returnFriendList) { returnToFriendList(); return; }
    const patrolStep = event.target.closest('[data-patrol-step]');
    if (patrolStep) { navigateFriendPatrol(Number(patrolStep.dataset.patrolStep)); return; }
    if (event.target.closest('[data-patrol-interactable]')) { navigateFriendPatrol('interactive'); return; }

    const friendVisit = event.target.closest('[data-friend-visit]');
    if (friendVisit) {
      rememberFriendListPosition(friendVisit.dataset.friendVisit,false);
      visitFriend(friendVisit.dataset.friendVisit);
      return;
    }

    const npcAdd = event.target.closest('[data-npc-add]');
    if (npcAdd) { setNpcFriend(npcAdd.dataset.npcAdd, true); return; }
    const npcRemove = event.target.closest('[data-npc-remove]');
    if (npcRemove) {
      const npc = npcById(npcRemove.dataset.npcRemove);
      if (!npc || window.confirm(`确定要把 ${npc.name} NPC 移出农友吗？`)) setNpcFriend(npcRemove.dataset.npcRemove, false);
      return;
    }
    const npcVisit = event.target.closest('[data-npc-visit]');
    if (npcVisit) {
      rememberFriendListPosition(npcVisit.dataset.npcVisit,true);
      visitNpcFarm(npcVisit.dataset.npcVisit);
      return;
    }

    // Care controls must win before steal controls. This also protects older cached
    // V0.17.0 visit markup where a care chip could still sit inside a stealable tile.
    const helpBug = event.target.closest('[data-help-bug-friend][data-help-bug-plot]');
    if (helpBug) { helpFriendBug(helpBug.dataset.helpBugFriend, Number(helpBug.dataset.helpBugPlot)); return; }

    const helpBugAll = event.target.closest('[data-help-bug-all]');
    if (helpBugAll) { helpFriendBugAll(helpBugAll.dataset.helpBugAll); return; }

    const helpWaterFriend = event.target.closest('[data-help-water-friend][data-help-water-plot]');
    if (helpWaterFriend) { helpFriendWater(helpWaterFriend.dataset.helpWaterFriend, Number(helpWaterFriend.dataset.helpWaterPlot)); return; }

    const helpWaterAll = event.target.closest('[data-help-water-all]');
    if (helpWaterAll) { helpFriendWater(helpWaterAll.dataset.helpWaterAll, null); return; }

    const helpWaterNpc = event.target.closest('[data-help-water-npc][data-help-water-plot]');
    if (helpWaterNpc) { helpNpcWater(helpWaterNpc.dataset.helpWaterNpc, Number(helpWaterNpc.dataset.helpWaterPlot)); return; }

    const helpWaterAllNpc = event.target.closest('[data-help-water-all-npc]');
    if (helpWaterAllNpc) { helpNpcWater(helpWaterAllNpc.dataset.helpWaterAllNpc, null); return; }

    const npcStealPlot = event.target.closest('[data-steal-npc][data-steal-plot][data-steal-cycle]');
    if (npcStealPlot) { stealNpcCrop(npcStealPlot.dataset.stealNpc, Number(npcStealPlot.dataset.stealPlot), npcStealPlot.dataset.stealCycle); return; }
    const stealPlot = event.target.closest('[data-steal-friend][data-steal-plot]');
    if (stealPlot) { stealFriendCrop(stealPlot.dataset.stealFriend, Number(stealPlot.dataset.stealPlot)); return; }

    const debugPlot = event.target.closest('[data-debug-plot]');
    if (debugPlot) { debugPlots([Number(debugPlot.dataset.debugPlot)], {single:true}); return; }

    const merchantBuy = event.target.closest('[data-merchant-buy]');
    if (merchantBuy) { buyMerchantSeed(merchantBuy.dataset.merchantBuy, merchantBuy.dataset.qty); return; }

    const waterPlot = event.target.closest('[data-water-plot]');
    if (waterPlot) { waterPlots([Number(waterPlot.dataset.waterPlot)], {single:true}); return; }

    const fertilizePlot = event.target.closest('[data-fertilize-plot][data-fertilizer]');
    if (fertilizePlot) { applyFertilizer(Number(fertilizePlot.dataset.fertilizePlot), fertilizePlot.dataset.fertilizer); return; }

    if (event.target.closest('[data-train-reroll-cancel]')) { closeTrainLoadConfirm(); return; }
    const trainRerollConfirm = event.target.closest('[data-confirm-train-reroll]');
    if (trainRerollConfirm) {
      const slotIndex = Number(trainRerollConfirm.dataset.trainSlotIndex);
      closeTrainLoadConfirm();
      rerollTrain(slotIndex);
      return;
    }
    const trainReroll = event.target.closest('[data-train-reroll]');
    if (trainReroll) { showTrainRerollConfirm(Number(trainReroll.dataset.trainSlotIndex)); return; }

    if (event.target.closest('[data-train-load-cancel]')) { closeTrainLoadConfirm(); return; }
    const trainConfirm = event.target.closest('[data-confirm-train-load]');
    if (trainConfirm) {
      const slotIndex = Number(trainConfirm.dataset.trainSlotIndex);
      const carIndex = Number(trainConfirm.dataset.trainLoadIndex);
      closeTrainLoadConfirm();
      loadTrainCar(slotIndex, carIndex);
      return;
    }
    const trainLoad = event.target.closest('[data-train-load-index]');
    if (trainLoad) { showTrainLoadConfirm(Number(trainLoad.dataset.trainSlotIndex), Number(trainLoad.dataset.trainLoadIndex)); return; }

    const trainDepart = event.target.closest('[data-train-depart]');
    if (trainDepart) { departTrain(Number(trainDepart.dataset.trainSlotIndex)); return; }

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
      if (open.hasAttribute('data-open-decor-shop')) activeShopTab = 'decor';
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
    const syncAvatarFromProfile = () => {
      const profile = window.XingchenPlayer?.getProfile?.();
      const nextGender = AVATAR_GENDERS.includes(profile?.gender) ? profile.gender : null;
      if (nextGender) {
        state.avatar = state.avatar && typeof state.avatar === 'object' ? state.avatar : {gender:'male', outfit:'default'};
        if (state.avatar.gender !== nextGender) {
          state.avatar.gender = nextGender;
          saveState();
        }
      }
      renderOwner();
      renderFarmAvatar();
      renderFarmPet();
      if (activePanel === 'character') renderActivePanel();
      invalidateMultiplayer();
    };
    window.addEventListener('stellar:player-profile-saved', syncAvatarFromProfile);
    window.addEventListener('stellar:profile-updated', syncAvatarFromProfile);
    // V0.17.1 — mailbox rewards are granted atomically on the server. Pull the
    // authoritative farm save immediately so coins/EXP/seeds are visible without
    // waiting for the normal revision poll. Existing pending farm operations are
    // still rebased by pullCloudState's revision-conflict path.
    window.addEventListener('stellar:mail-reward-claimed', () => {
      if (cloudReady) pullCloudState({preferRemote:true}).catch(() => {});
      else bootstrapCloud(true).catch(() => {});
    });
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
    const bootProfileGender = window.XingchenPlayer?.getProfile?.()?.gender;
    if (AVATAR_GENDERS.includes(bootProfileGender)) {
      state.avatar = state.avatar && typeof state.avatar === 'object' ? state.avatar : {gender:'male', outfit:'default'};
      state.avatar.gender = bootProfileGender;
    }
    ensureDailyState(localFarmDay(), {persist:false});
    ensureTrainState(localFarmDay(), {persist:false});
    saveState({touch:false, sync:false});
    renderAll();
    setTimeout(() => { npcRuntimeCheckedAt = Date.now(); maybeNpcHelpPest(); maybeNpcVisitPlayer(); }, 1200);
    bootstrapCloud(false).then(() => refreshFarmActivityUnread(true)).catch(() => {});

    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(tick, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
