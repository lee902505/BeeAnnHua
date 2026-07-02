//=======================================
// 遊戲主程式 game.js
//=======================================

let monsters = [];
let maps = [];
let cities = [];
let npcs = [];
let shops = {};
let jobChangeRules = [];
let items = {};
let expTables = null;
let currentMap = null;

const RO_WEB_VERSION = "0.9.72";

function normalizeDataPath(path) {
  return String(path || "")
    .split("?")[0]
    .replace(/^\.\//, "")
    .replace(/^\//, "");
}

function getBundledJsonKey(path) {
  const normalized = normalizeDataPath(path);
  if (window.RO_WEB_DATA && Object.prototype.hasOwnProperty.call(window.RO_WEB_DATA, normalized)) {
    return normalized;
  }
  return normalized
    .split("/")
    .pop()
    .replace(/\.json$/i, "");
}

function cloneJsonData(data) {
  if (data === undefined || data === null) return data;
  return JSON.parse(JSON.stringify(data));
}

async function loadJson(path, fallback = null) {
  const key = getBundledJsonKey(path);
  if (window.RO_WEB_DATA && Object.prototype.hasOwnProperty.call(window.RO_WEB_DATA, key)) {
    return cloneJsonData(window.RO_WEB_DATA[key]);
  }

  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
    return await response.json();
  } catch (error) {
    console.warn(`資料載入失敗，使用 fallback：${path}`, error);
    return cloneJsonData(fallback);
  }
}

window.onload = initGame;

async function initGame() {
  addBattleLog("遊戲啟動中...");

  await loadServerConfig();
  await loadJobData();
  await loadSkillData();
  if (typeof loadJobConstitutionData === "function") await loadJobConstitutionData();
  if (typeof loadStatusData === "function") await loadStatusData();
  await loadMonsterData();
  await loadMapData();
  await loadTownData();
  await loadItemData();
  await loadExpData();
  await loadPlayerData();
  if (typeof migrateSkillStorageToOfficialIds === "function") migrateSkillStorageToOfficialIds();

  setInitialMap();
  if (typeof initPositionEngine === "function") initPositionEngine();
  if (player?.currentCity && typeof getCityData === "function" && typeof updateTownBackground === "function") {
    updateTownBackground(getCityData(player.currentCity));
  } else if (typeof updateBattleBackground === "function") {
    updateBattleBackground(currentMap);
  }

  if (typeof startPlayerRecoveryLoop === "function") startPlayerRecoveryLoop();

  updatePlayerUI();
  updateInventoryUI();
  updateHuntingStatsUI();
  updateMonsterUI();
  updateMapUI();
  if (typeof updateTownUI === "function") updateTownUI();
  updateJobUI();
  updateSkillUI();
  if (typeof updateQuickSlotUI === "function") updateQuickSlotUI();
  if (typeof updateAutoCombatUI === "function") updateAutoCombatUI();

  addBattleLog("玩家資料載入完成！");
  addBattleLog("歡迎來到 RO_WEB Alpha 0.9.72！");
}

async function loadMonsterData() {
  monsters = await loadJson("./data/monsters.json", []);
  console.log("怪物資料載入完成：", monsters);
}

async function loadMapData() {
  maps = await loadJson("./data/maps.json", []);
  console.log("地圖資料載入完成：", maps);
}

async function loadTownData() {
  try {
    const [citiesData, npcsData, shopsData, jobChangeData] = await Promise.all([
      loadJson("./data/cities.json", []),
      loadJson("./data/npcs.json", []),
      loadJson("./data/shops.json", {}),
      loadJson("./data/job_change.json", [])
    ]);

    cities = citiesData;
    npcs = npcsData;
    shops = shopsData;
    jobChangeRules = jobChangeData;
    console.log("城鎮 / NPC / 商店資料載入完成：", { cities, npcs, shops, jobChangeRules });
  } catch (error) {
    console.warn("城鎮資料載入失敗，使用空資料。", error);
    cities = [];
    npcs = [];
    shops = {};
    jobChangeRules = [];
  }
}

async function loadItemData() {
  // V0.9.54 Item DB V2：data/items.json 正式退役。
  // Runtime 僅讀 data/items/ 與 data/equipment/ 細分 JSON，並合併到 ItemManager/getItemById()。
  const index = await loadJson("./data/items/item_index.json", {});
  const uniquePaths = Array.from(new Set(Object.values(index || {}))).filter(Boolean);
  const merged = {};

  await Promise.all(uniquePaths.map(async path => {
    const data = await loadJson("./" + path, {});
    Object.entries(data || {}).forEach(([id, item]) => {
      if (!item) return;
      const key = String(item.id || id);
      merged[key] = { ...item, id: Number(item.id || id), officialId: Number(item.officialId || item.id || id) };
    });
  }));

  items = merged;
  window.ItemManager = {
    items,
    getItemById: getItemData,
    getItemName
  };
  console.log("物品資料載入完成（Item DB V2）：", { count: Object.keys(items).length, sources: uniquePaths });
}

async function loadExpData() {
  try {
    expTables = await loadJson("./data/exp_tables.json", null);
    console.log("EXP 表載入完成：", expTables);
  } catch (error) {
    console.warn("EXP 表載入失敗，使用簡易公式。", error);
    expTables = null;
  }
}

function getItemName(itemId) {
  if (!itemId) {
    return "無";
  }

  if (!items) {
    return itemId;
  }

  // 如果 items.json 是陣列格式
  if (Array.isArray(items)) {
    const item = items.find(item => String(item.id) === String(itemId));

    if (item) {
      return item.name;
    }
  }

  // 如果 items.json 是物件格式
  if (items[itemId]) {
    return items[itemId].name;
  }

  return itemId;
}

function setInitialMap() {
  if (!maps || maps.length === 0) {
    currentMap = null;
    return;
  }

  const savedFieldMapId = player?.map || player?.lastFieldMap || "prontera_south";
  currentMap = maps.find(map => map.id === savedFieldMapId) || maps.find(map => map.id === "prontera_south") || maps[0];

  if (player && currentMap) {
    // v0.9.49：即使人在城鎮，也保留 lastFieldMap，讓開局可直接傳送南門。
    player.lastFieldMap = player.lastFieldMap || currentMap.id;
    if (!player.currentCity) player.map = currentMap.id;
  }
}
