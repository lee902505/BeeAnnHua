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

const RO_WEB_VERSION = "0.9.81C";

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
  if (window.CombatFormulaRuntime?.load) await window.CombatFormulaRuntime.load();
  await loadMonsterData();
  await loadMapData();
  await loadTownData();
  await loadItemData();
  await loadExpData();
  await loadPlayerData();
  if (typeof migrateSkillStorageToOfficialIds === "function") migrateSkillStorageToOfficialIds();

  setInitialMap();
  if (typeof initPositionEngine === "function") initPositionEngine();
  if (typeof initROStudioPlayerAtlasRuntime === "function") await initROStudioPlayerAtlasRuntime();
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
  addBattleLog("歡迎來到 RO_WEB Alpha 0.9.81A！");
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


function normalizeItemRecord(item, fallbackId = 0) {
  const normalized = { ...(item || {}) };
  const id = Number(normalized.Id ?? normalized.id ?? normalized.officialId ?? fallbackId);
  const buy = Number(normalized.Buy ?? normalized.buyPrice ?? 20);
  const officialSell = normalized.Sell;
  const sell = Number(officialSell ?? normalized.sellPrice ?? Math.floor(buy / 2));

  normalized.Id = id;
  normalized.id = id;
  normalized.officialId = id;
  normalized.Name = normalized.Name ?? normalized.name ?? String(id);
  normalized.name = normalized.Name;
  normalized.Buy = Number.isFinite(buy) ? buy : 20;
  normalized.buyPrice = normalized.Buy;
  normalized.sellPrice = Number.isFinite(sell) ? sell : Math.floor(normalized.Buy / 2);

  const aliases = {
    AegisName: "aegisName", Type: "dbType", SubType: "dbSubType",
    Attack: "atk", MagicAttack: "matk", Defense: "def", Range: "range",
    Slots: "slots", Jobs: "equipJobs", Locations: "locations",
    WeaponLevel: "weaponLevel", ArmorLevel: "armorLevel",
    EquipLevelMin: "equipLevelMin", Refineable: "refineable",
    Gradable: "gradable", View: "viewId", Script: "scriptRaw"
  };
  Object.entries(aliases).forEach(([canonical, alias]) => {
    const value = normalized[canonical] ?? normalized[alias];
    if (value !== undefined && value !== null) {
      normalized[canonical] = value;
      normalized[alias] = value;
    }
  });
  if (normalized.EquipLevelMin !== undefined) normalized.requiredLevel = normalized.EquipLevelMin;
  delete normalized.Weight;
  delete normalized.weight;
  delete normalized.Gender;
  delete normalized.gender;
  return normalized;
}

async function loadItemData() {
  // V0.9.80V Item DB V2 loader fix:
  // - database_manifest.json / allDataPaths is the authoritative split-file list.
  // - item_index.json may be either legacy id->path OR compact id->item records.
  // - file:// mode uses bundled RO_WEB_DATA first, so inventory icons/data still work when double-clicked.
  const index = await loadJson("./data/items/item_index.json", {});
  const manifest = await loadJson("./data/items/database_manifest.json", {});
  const merged = {};
  const pathSet = new Set();

  function addPath(path) {
    if (typeof path !== "string") return;
    const clean = path.replace(/^\.\//, "");
    if (!clean || !clean.endsWith(".json")) return;
    if (clean.endsWith("item_index.json") || clean.endsWith("database_manifest.json")) return;
    pathSet.add(clean);
  }

  // New manifest path list.
  (manifest.allDataPaths || []).forEach(addPath);

  // Legacy manifest support.
  Object.values(manifest.itemPaths || {}).forEach(addPath);
  Object.values(manifest.equipmentFilePaths || {}).forEach(addPath);

  // Legacy index support: id -> path.
  Object.values(index || {}).forEach(value => {
    if (typeof value === "string") addPath(value);
  });

  // Compact index support: id -> item summary. Use as fallback / quick lookup.
  Object.entries(index || {}).forEach(([id, item]) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return;
    const key = String(item.id || id);
    merged[key] = normalizeItemRecord(item, id);
  });

  // file:// bundled mode can discover split files from RO_WEB_DATA keys.
  if (window.RO_WEB_DATA) {
    Object.keys(window.RO_WEB_DATA).forEach(key => {
      if ((key.startsWith("data/items/") || key.startsWith("data/equipment/")) && key.endsWith(".json")) {
        addPath(key);
      }
    });
  }

  const uniquePaths = Array.from(pathSet).sort();
  await Promise.all(uniquePaths.map(async path => {
    const data = await loadJson("./" + path, {});
    Object.entries(data || {}).forEach(([id, item]) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return;
      const key = String(item.id || id);
      // Full split JSON overrides compact index summary.
      merged[key] = normalizeItemRecord({ ...merged[key], ...item }, id);
    });
  }));

  items = merged;
  window.ItemManager = {
    items,
    getItemById: getItemData,
    getItemName
  };
  console.log("物品資料載入完成（Item DB V2）：", { count: Object.keys(items).length, sources: uniquePaths.length, paths: uniquePaths });
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

  let savedFieldMapId = player?.map || player?.lastFieldMap || "mjolnir_3x3_region_camera";
  // v0.9.78b：舊 Camera/單格 MVP 存檔會強制導到單格3倍64px測試圖。
  const wasOldMapMvp = ["mjolnir_chunk_mvp", "mjolnir_camera_3x3", "mjolnir_mountains", "mjolnir_camera_scale3_single", "mjolnir_camera_zoom05_single512"].includes(savedFieldMapId);
  if (wasOldMapMvp) savedFieldMapId = "mjolnir_3x3_region_camera";
  currentMap = maps.find(map => map.id === savedFieldMapId) || maps.find(map => map.id === "mjolnir_3x3_region_camera") || maps.find(map => map.id === "prontera_south") || maps[0];

  if (player && currentMap) {
    // v0.9.49：即使人在城鎮，也保留 lastFieldMap，讓開局可直接傳送南門。
    player.lastFieldMap = player.lastFieldMap || currentMap.id;
    if (!player.currentCity) player.map = currentMap.id;
    if (wasOldMapMvp && currentMap.spawnPoint) {
      player.position = player.position || {};
      player.position.x = Number(currentMap.spawnPoint.x || 0);
      player.position.y = Number(currentMap.spawnPoint.y || 0);
      player.position.targetX = player.position.x;
      player.position.targetY = player.position.y;
    }
  }
}
