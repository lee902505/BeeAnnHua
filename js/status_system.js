//=======================================
// StatusSystem v0.9.5
// 素質點 / rAthena statpoint + job bonus 輕量接入，素質欄改用 UI 圖模板定位
//=======================================
let statPointData = { points: {} };
let jobStatBonuses = {};
let jobBasePoints = {};

async function loadStatusData() {
  try {
    const [statData, bonusData, baseData] = await Promise.all([
      loadJson("./data/statpoints.json", { points: { "1": 48 } }),
      loadJson("./data/job_stat_bonuses.json", {}),
      loadJson("./data/job_basepoints.json", {})
    ]);
    statPointData = statData;
    jobStatBonuses = bonusData;
    jobBasePoints = baseData;
    console.log("素質資料載入完成：", { statPointData, jobStatBonuses, jobBasePoints });
  } catch (error) {
    console.warn("素質資料載入失敗，使用 fallback。", error);
    statPointData = { points: { "1": 48 } };
    jobStatBonuses = {};
    jobBasePoints = {};
  }
}

const STATUS_KEYS = ["str", "agi", "vit", "int", "dex", "luk"];
const STATUS_LABELS = {
  str: "STR",
  agi: "AGI",
  vit: "VIT",
  int: "INT",
  dex: "DEX",
  luk: "LUK"
};
const STATUS_DESCRIPTIONS = {
  str: "增加近戰 ATK。",
  agi: "增加 FLEE 迴避與 ASPD 攻擊速度。",
  vit: "增加 Max HP、DEF 與 HP 回復。",
  int: "增加 MATK、Max SP、MDEF 與 SP 回復。",
  dex: "增加 HIT 命中、少量 ATK，之後也會影響詠唱。",
  luk: "增加 CRI，並少量影響 ATK、MATK、HIT、FLEE。"
};

function normalizeStatusData() {
  if (!player) return;
  player.stats = { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1, ...(player.stats || {}) };
  STATUS_KEYS.forEach(key => {
    player.stats[key] = Math.max(1, Math.floor(Number(player.stats[key] || 1)));
  });
  player.usedStatusPoints = Math.max(0, Math.floor(Number(player.usedStatusPoints || 0)));
  player.statusPointBaseOffset = getTotalStatusPointsForLevel(1);
  syncStatusPointCache();
}

function getTotalStatusPointsForLevel(level) {
  const points = statPointData?.points || {};
  const lv = Math.max(1, Math.floor(Number(level || 1)));
  if (Number.isFinite(Number(points[lv]))) return Number(points[lv]);
  if (Number.isFinite(Number(points[String(lv)]))) return Number(points[String(lv)]);

  // fallback：Lv1 48，之後約每級 +3~12，避免資料載入失敗就卡住
  let total = Number(points["1"] || 48);
  for (let i = 2; i <= lv; i += 1) {
    total += Math.max(3, Math.floor((i + 7) / 5));
  }
  return total;
}

function getAvailableStatusPoints() {
  if (!player) return 0;
  const total = getTotalStatusPointsForLevel(player.baseLevel);
  const baseOffset = Number(player.statusPointBaseOffset ?? getTotalStatusPointsForLevel(1));
  return Math.max(0, total - baseOffset - Number(player.usedStatusPoints || 0));
}

function syncStatusPointCache() {
  if (!player) return;
  player.statusPoints = getAvailableStatusPoints();
}

function getJobBonusEntry(jobKey = player?.jobKey) {
  return jobStatBonuses?.[jobKey] || jobStatBonuses?.novice || { bonusStats: [] };
}

function getJobStatBonus(jobKey = player?.jobKey, jobLevel = player?.jobLevel) {
  const result = { str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0 };
  const entry = getJobBonusEntry(jobKey);
  const lv = Number(jobLevel || 1);
  (entry.bonusStats || []).forEach(row => {
    if (Number(row.level || 0) > lv) return;
    STATUS_KEYS.forEach(key => {
      result[key] += Number(row[key] || 0);
    });
  });
  return result;
}

function getPlayerTotalBasicStats() {
  normalizeStatusData();
  const jobBonus = getJobStatBonus();
  const total = {};
  STATUS_KEYS.forEach(key => {
    total[key] = Number(player.stats[key] || 1) + Number(jobBonus[key] || 0);
  });
  return total;
}

function getJobBaseValue(type, level, jobKey = player?.jobKey) {
  const table = jobBasePoints?.[jobKey]?.[type] || jobBasePoints?.novice?.[type] || {};
  const lv = Math.max(1, Math.floor(Number(level || 1)));
  if (Number.isFinite(Number(table[lv]))) return Number(table[lv]);
  if (Number.isFinite(Number(table[String(lv)]))) return Number(table[String(lv)]);
  return type === "baseHp" ? (40 + (lv - 1) * 5) : (11 + Math.floor((lv - 1) * 0.7));
}

function getEquipmentStatTotals() {
  const totals = { atk: 0, def: 0, matk: 0, hit: 0, flee: 0, cri: 0, maxHp: 0, maxSp: 0 };
  if (!player?.equipment) return totals;
  Object.values(player.equipment).forEach(itemId => {
    if (!itemId) return;
    const itemData = typeof getItemData === "function" ? getItemData(itemId) : null;
    if (!itemData) return;
    Object.keys(totals).forEach(key => {
      totals[key] += Number(itemData[key] || 0);
    });
  });
  return totals;
}

function collectPercentAndFlatBonuses() {
  const trainingBonuses = typeof getTrainingBonusTotals === "function" ? getTrainingBonusTotals() : {};
  const passiveBonuses = typeof getPassiveSkillBonusTotals === "function" ? getPassiveSkillBonusTotals() : {};
  const buffBonuses = typeof getActiveBuffBonusTotals === "function" ? getActiveBuffBonusTotals() : {};
  const bonuses = {};
  [trainingBonuses, passiveBonuses, buffBonuses].forEach(source => {
    Object.keys(source || {}).forEach(key => {
      bonuses[key] = Number(bonuses[key] || 0) + Number(source[key] || 0);
    });
  });
  return bonuses;
}

function calculateDerivedPlayerStats() {
  if (!player) return null;
  normalizeStatusData();

  const s = getPlayerTotalBasicStats();
  const baseLevel = Math.max(1, Number(player.baseLevel || 1));
  const equip = getEquipmentStatTotals();
  const bonuses = collectPercentAndFlatBonuses();

  let atk = Math.floor(baseLevel / 4) + s.str + Math.floor(s.dex / 5) + Math.floor(s.luk / 3) + equip.atk;
  let matk = s.int + Math.floor(s.int / 2) + Math.floor(s.dex / 5) + Math.floor(s.luk / 3) + Math.floor(baseLevel / 4) + equip.matk;
  let def = Math.floor((baseLevel + s.vit) / 2) + Math.floor(s.agi / 5) + equip.def;
  let mdef = s.int + Math.floor(baseLevel / 4) + Math.floor((s.dex + s.vit) / 5);
  let hit = 175 + baseLevel + s.dex + Math.floor(s.luk / 3) + equip.hit;
  let flee = 100 + baseLevel + s.agi + Math.floor(s.luk / 5) + equip.flee;
  let cri = 1 + Math.floor(s.luk / 3) + equip.cri;
  let aspd = Math.min(190, 150 + Math.floor(s.agi / 5) + Math.floor(s.dex / 10));

  atk = Math.floor(atk * (100 + Number(bonuses.atkRate || 0)) / 100) + Number(bonuses.atkFlat || 0);
  def = Math.floor(def * (100 + Number(bonuses.defRate || 0)) / 100) + Number(bonuses.defFlat || 0);
  matk = Math.floor(matk * (100 + Number(bonuses.matkRate || 0)) / 100) + Number(bonuses.matkFlat || 0);

  const baseHp = getJobBaseValue("baseHp", baseLevel);
  const baseSp = getJobBaseValue("baseSp", baseLevel);
  let maxHp = Math.floor(baseHp * (1 + s.vit / 100)) + equip.maxHp;
  let maxSp = Math.floor(baseSp * (1 + s.int / 100)) + equip.maxSp;
  maxHp = Math.floor(maxHp * (100 + Number(bonuses.maxHpRate || 0)) / 100);
  maxSp = Math.floor(maxSp * (100 + Number(bonuses.maxSpRate || 0)) / 100);


  return {
    stats: s,
    jobBonus: getJobStatBonus(),
    atk: Math.max(1, atk),
    matk: Math.max(0, matk),
    def: Math.max(0, def),
    mdef: Math.max(0, mdef),
    hit: Math.max(0, hit),
    flee: Math.max(0, flee),
    cri: Math.max(0, cri),
    aspd,
    maxHp: Math.max(1, maxHp),
    maxSp: Math.max(0, maxSp)
  };
}

function allocateStatusPoint(statKey) {
  if (!player || !STATUS_KEYS.includes(statKey)) return;
  normalizeStatusData();
  const available = getAvailableStatusPoints();
  if (available <= 0) {
    addBattleLog("素質點不足。Base Lv 提升後會獲得更多素質點。");
    updateStatusUI();
    return;
  }

  player.stats[statKey] += 1;
  player.usedStatusPoints += 1;
  syncStatusPointCache();
  recalculatePlayerStats();
  updatePlayerUI();
  updateStatusUI();
  saveGame();
  addBattleLog(`${STATUS_LABELS[statKey]} +1，目前 ${player.stats[statKey]}。`);
}

function updateStatusUI() {
  const panel = document.getElementById("status-panel");
  if (!panel || !player) return;
  normalizeStatusData();
  const derived = calculateDerivedPlayerStats();
  const jobBonus = derived?.jobBonus || getJobStatBonus();
  const remaining = getAvailableStatusPoints();

  panel.innerHTML = "";

  const left = document.createElement("div");
  left.className = "status-css-left";
  const leftTitle = document.createElement("div");
  leftTitle.className = "status-css-title";
  leftTitle.textContent = "能力值";
  left.appendChild(leftTitle);

  STATUS_KEYS.forEach(key => {
    const base = Number(player.stats[key] || 1);
    const bonus = Number(jobBonus[key] || 0);
    const label = STATUS_LABELS[key];
    const tooltip = `${label}：${STATUS_DESCRIPTIONS[key]}`;

    const row = document.createElement("div");
    row.className = "status-css-row";

    const name = document.createElement("button");
    name.type = "button";
    name.className = "status-css-label";
    name.textContent = label;
    name.dataset.tooltip = tooltip;
    name.setAttribute("aria-label", tooltip);

    const value = document.createElement("div");
    value.className = "status-css-value";
    value.textContent = bonus ? `${base}+${bonus}` : `${base}`;
    value.dataset.tooltip = tooltip;

    const plus = document.createElement("button");
    plus.className = "status-css-plus";
    plus.type = "button";
    plus.textContent = "+";
    plus.title = `${label} +1`;
    plus.disabled = remaining <= 0;
    plus.onclick = function (event) {
      event.stopPropagation();
      allocateStatusPoint(key);
    };

    row.appendChild(name);
    row.appendChild(value);
    row.appendChild(plus);
    left.appendChild(row);
  });

  const right = document.createElement("div");
  right.className = "status-css-right";
  const rightTitle = document.createElement("div");
  rightTitle.className = "status-css-title";
  rightTitle.textContent = "戰鬥能力";
  right.appendChild(rightTitle);

  const battleRows = [
    { label: "攻擊力", value: derived.atk, tip: "攻擊力：目前物理攻擊數值。" },
    { label: "防禦力", value: derived.def, tip: "防禦力：降低受到的物理傷害。" },
    { label: "魔法攻擊", value: derived.matk, tip: "魔法攻擊：目前魔法攻擊數值。" },
    { label: "魔法防禦", value: derived.mdef, tip: "魔法防禦：降低受到的魔法傷害。" },
    { label: "命中率", value: derived.hit, tip: "命中率：影響攻擊命中。" },
    { label: "迴避率", value: derived.flee, tip: "迴避率：影響閃避攻擊。" },
    { label: "暴擊率", value: derived.cri, tip: "暴擊率：影響暴擊機率。" },
    { label: "攻擊速度", value: derived.aspd, tip: "攻擊速度：之後會影響攻擊間隔。" },
    { label: "剩餘點數", value: remaining, tip: "剩餘點數：目前可以分配的素質點。" }
  ];

  battleRows.forEach(rowData => {
    const row = document.createElement("div");
    row.className = "status-css-battle-row";
    row.dataset.tooltip = rowData.tip;

    const label = document.createElement("span");
    label.textContent = rowData.label;
    const value = document.createElement("b");
    value.textContent = rowData.value;

    row.appendChild(label);
    row.appendChild(value);
    right.appendChild(row);
  });

  panel.appendChild(left);
  panel.appendChild(right);
}
