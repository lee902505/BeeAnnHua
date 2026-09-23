(() => {
  'use strict';

  const STORAGE_KEY = 'xingchen-farm-v1';
  const VERSION = 1;
  const PLOT_COUNT = 20;
  const INITIAL_COINS = 100;

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
    { id:'friend1', title:'第一位农友', desc:'加入 1 位好友。多人好友系统将在下一阶段开放。', type:'friend', target:1, reward:{seeds:{corn:3}}, rewardText:'玉米种子 ×3', future:true },
    { id:'friend5', title:'热闹小农场', desc:'好友达到 5 人。', type:'friend', target:5, reward:{seeds:{strawberry:3}}, rewardText:'草莓种子 ×3', future:true },
    { id:'friend10', title:'农场交友达人', desc:'好友达到 10 人。', type:'friend', target:10, reward:{seeds:{pumpkin:3}}, rewardText:'南瓜种子 ×3', future:true }
  ];

  let state = loadState();
  let activePanel = null;
  let tickTimer = null;
  let lastLevel = state.level;

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
      history: []
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

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
      subtitle:'种下后会按照真实时间成长，关闭网页也会继续计时。',
      body:`<div class="farm-seed-list">${options}</div><button class="farm-inline-link" type="button" data-open-panel="shop">种子不够？前往商店 →</button>`
    });
  }

  function plant(index, cropId) {
    const crop = cropById(cropId);
    if (!crop || state.level < crop.unlockLevel) return;
    if ((state.seeds[cropId] || 0) <= 0) return;
    const plot = state.plots[index];
    if (!plot || plot.cropId) return;

    state.seeds[cropId] -= 1;
    plot.cropId = cropId;
    plot.plantedAt = Date.now();
    state.stats.plant += 1;
    state.history.push({type:'plant', cropId, at:Date.now()});
    saveState();
    closeModal();
    renderAll();
    toast(`${crop.icon} 已经种下 ${crop.name}`, `${crop.growMinutes} 分钟后回来看看。`);
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
      ranking:{icon:'🏆', eyebrow:'RANKING', title:'农场排行榜', subtitle:'等级榜与金币榜将在多人云端农场接入后启用。'},
      friends:{icon:'👥', eyebrow:'FRIENDS', title:'农场好友', subtitle:'好友、拜访与偷菜会在多人云端阶段一起开放。'}
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
          <div class="farm-bag-list">${seedItems.length ? seedItems.map(c => `<div class="farm-bag-row"><span>${c.icon}</span><div><b>${c.name}种子</b><small>${c.growMinutes} 分钟成熟</small></div><em>×${state.seeds[c.id]}</em></div>`).join('') : '<p class="farm-empty-state">目前没有种子，可以到商店补货。</p>'}</div>
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
      body.innerHTML = `
        <div class="farm-coming-soon">
          <div class="farm-coming-mark">🏆</div>
          <h3>先把自己的农场种起来</h3>
          <p>排行榜会读取真实云端玩家资料，分成「等级榜」与「金币榜」。为了不显示假的玩家与假的名次，这一版先不伪造排行榜数据。</p>
          <div class="farm-coming-preview"><span>等级榜</span><b>Lv. 1 → Lv. 25+</b><span>金币榜</span><b>真实玩家资产排行</b></div>
          <small>下一阶段接入 Supabase 农场资料后，会从排行榜直接加好友、拜访农场。</small>
        </div>`;
      return;
    }

    if (activePanel === 'friends') {
      body.innerHTML = `
        <div class="farm-coming-soon">
          <div class="farm-coming-mark">👥</div>
          <h3>好友系统正在准备土地</h3>
          <p>好友会使用星辰日记现有的玩家身分。未来可以拜访好友农场、查看成熟作物，并随机偷取 1～3 个；地主无论如何至少保留 1 个。</p>
          <div class="farm-coming-preview"><span>好友拜访</span><b>查看好友 20 格农田</b><span>偷菜规则</span><b>1～3 个 · 保底剩 1</b></div>
          <small>这一部分需要 Supabase 做服务器验证，避免玩家自行修改金钱或重复偷取。</small>
        </div>`;
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
      plant(Number(plantBtn.dataset.plantPlot), plantBtn.dataset.plantCrop);
      return;
    }

    const open = event.target.closest('[data-open-panel]');
    if (open) {
      openPanel(open.dataset.openPanel);
    }
  }

  function init() {
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !$('farmModal').hidden) closeModal();
    });
    $('farmScrollTop')?.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
    window.addEventListener('stellar:player-profile-saved', renderOwner);
    window.addEventListener('stellar:profile-updated', renderOwner);

    // The first visit task is intentionally ready immediately.
    state.stats.visit = Math.max(1, Number(state.stats.visit) || 0);
    saveState();
    renderAll();

    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(tick, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
