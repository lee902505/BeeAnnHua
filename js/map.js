//=======================================
// MapManager v0.8
// 地圖 / 傳送 / 探索紀錄
//=======================================

function initMap() {
  if (!maps || maps.length === 0) {
    addBattleLog("沒有地圖資料。");
    return;
  }

  if (!currentMap) {
    currentMap = maps[0];
  }

  discoverCurrentMap({ silent: true });
  updateMapUI();
  addBattleLog("目前地圖：" + currentMap.name);
}

function normalizeMapExplorationData() {
  if (!player) return;

  player.discoveredMaps = player.discoveredMaps || {};
  player.monsterBook = player.monsterBook || {};
  player.mapExploration = player.mapExploration || {};

  maps.forEach(map => {
    if (!player.mapExploration[map.id]) {
      player.mapExploration[map.id] = {
        discovered: false,
        discoveredAt: null,
        monsters: {},
        visits: 0
      };
    }
  });
}

function discoverCurrentMap(options = {}) {
  if (!player || !currentMap) return;
  normalizeMapExplorationData();

  const mapRecord = player.mapExploration[currentMap.id];
  const isFirstDiscovery = !mapRecord.discovered;

  mapRecord.discovered = true;
  mapRecord.discoveredAt = mapRecord.discoveredAt || new Date().toISOString();
  mapRecord.visits = Number(mapRecord.visits || 0) + 1;
  player.discoveredMaps[currentMap.id] = true;

  if (isFirstDiscovery && !options.silent) {
    addBattleLog("🗺️ 已發現新地圖：「" + currentMap.name + "」。");
  }
}

function recordMapMonsterDiscovery(monster) {
  if (!player || !currentMap || !monster) return;
  normalizeMapExplorationData();

  const mapRecord = player.mapExploration[currentMap.id];
  const monsterId = String(monster.id);
  const monsterRecord = mapRecord.monsters[monsterId] || {
    id: monster.id,
    name: monster.name,
    discovered: false,
    kills: 0,
    firstSeenAt: null
  };

  const firstSeen = !monsterRecord.discovered;
  monsterRecord.name = monster.name;
  monsterRecord.discovered = true;
  monsterRecord.kills = Number(monsterRecord.kills || 0) + 1;
  monsterRecord.firstSeenAt = monsterRecord.firstSeenAt || new Date().toISOString();
  monsterRecord.lastKilledAt = new Date().toISOString();
  mapRecord.monsters[monsterId] = monsterRecord;

  const bookRecord = player.monsterBook[monsterId] || {
    id: monster.id,
    name: monster.name,
    discovered: false,
    totalKills: 0,
    firstSeenAt: null
  };
  bookRecord.name = monster.name;
  bookRecord.discovered = true;
  bookRecord.totalKills = Number(bookRecord.totalKills || 0) + 1;
  bookRecord.firstSeenAt = bookRecord.firstSeenAt || monsterRecord.firstSeenAt;
  bookRecord.lastKilledAt = monsterRecord.lastKilledAt;
  player.monsterBook[monsterId] = bookRecord;

  if (firstSeen) {
    addBattleLog("🔎 在「" + currentMap.name + "」發現新的魔物。");
  }

  updateMapUI();
}

function getMapExplorationProgress(map) {
  if (!player || !map) {
    return { discovered: 0, total: map?.monsters?.length || 0, percent: 0 };
  }

  normalizeMapExplorationData();
  const mapRecord = player.mapExploration[map.id] || { monsters: {} };
  const total = Array.isArray(map.monsters) ? map.monsters.length : 0;
  const discovered = Object.keys(mapRecord.monsters || {}).filter(monsterId => {
    return mapRecord.monsters[monsterId]?.discovered;
  }).length;

  return {
    discovered,
    total,
    percent: total > 0 ? Math.round((discovered / total) * 100) : 0
  };
}

function updateMapUI() {
  const currentMapNameEl = document.getElementById("current-map-name");
  const mapListEl = document.getElementById("map-list");

  const currentCityData = player?.currentCity && typeof getCityData === "function" ? getCityData(player.currentCity) : null;
  const locationData = currentCityData || currentMap || null;
  const locationName = currentCityData ? currentCityData.name : (currentMap?.name || "尚未選擇");

  if (currentMapNameEl) {
    currentMapNameEl.textContent = currentCityData
      ? `目前城鎮：${locationName}`
      : `野外地圖：${locationName}`;
  }

  if (!mapListEl) return;
  mapListEl.innerHTML = "";

  const info = document.createElement("div");
  info.className = "map-current-card";

  const thumb = document.createElement("img");
  thumb.className = "map-current-thumb";
  thumb.src = locationData?.thumb || currentMap?.thumb || "images/maps/thumbs/prontera_south_small.webp";
  thumb.alt = locationName;
  thumb.onerror = function () { thumb.style.display = "none"; };

  const title = document.createElement("div");
  title.className = "map-current-title";
  title.textContent = locationName;

  const desc = document.createElement("div");
  desc.className = "map-current-desc";
  if (currentCityData) {
    desc.textContent = currentCityData.description || currentCityData.role || "城鎮據點";
  } else if (currentMap) {
    desc.textContent = `推薦 Lv.${currentMap.recommendedLevel || "1~10"}｜${currentMap.environment || "野外地圖"}`;
  } else {
    desc.textContent = "選擇右側傳送點前往目的地。";
  }

  const progress = document.createElement("div");
  progress.className = "map-current-progress";
  if (currentMap) {
    const p = getMapExplorationProgress(currentMap);
    progress.textContent = `探索 ${p.discovered}/${p.total}`;
  } else {
    progress.textContent = currentCityData ? "城鎮中" : "野外地圖";
  }

  info.appendChild(thumb);
  info.appendChild(title);
  info.appendChild(desc);
  info.appendChild(progress);

  const warpPanel = document.createElement("div");
  warpPanel.className = "map-warp-panel";

  const warpTitle = document.createElement("div");
  warpTitle.className = "map-warp-title";
  warpTitle.textContent = "傳送點";
  warpPanel.appendChild(warpTitle);

  const destinations = [];
  (maps || []).forEach(map => destinations.push({ kind: "field", id: map.id, name: map.displayName || map.name, note: map.environment || "練功地圖", data: map }));
  (cities || []).forEach(city => destinations.push({ kind: "city", id: city.id, name: city.displayName || city.name, note: city.role || "城鎮", data: city }));

  destinations.forEach(dest => {
    const btn = document.createElement("button");
    btn.type = "button";
    const isCurrent = dest.kind === "field"
      ? Boolean(!currentCityData && currentMap && currentMap.id === dest.id)
      : Boolean(currentCityData && currentCityData.id === dest.id);
    btn.className = "map-warp-button" + (isCurrent ? " is-current" : "");
    btn.disabled = isCurrent;
    btn.innerHTML = `<b>${dest.name}</b><small>${dest.note}</small>`;
    btn.onclick = function () {
      if (dest.kind === "field") changeMap(dest.id);
      else if (typeof enterCity === "function") enterCity(dest.id);
    };
    warpPanel.appendChild(btn);
  });

  mapListEl.appendChild(info);
  mapListEl.appendChild(warpPanel);
}

function changeMap(mapId) {
  const selectedMap = maps.find(map => map.id === mapId);

  if (!selectedMap) {
    addBattleLog("找不到地圖：" + mapId);
    return;
  }

  stopAutoBattle({ silent: true });
  if (typeof clearBattleTimersAndMonster === "function") {
    clearBattleTimersAndMonster({ clearMonster: true });
  }

  currentMap = selectedMap;
  currentMonster = null;
  if (player) {
    player.map = currentMap.id;
    player.lastFieldMap = currentMap.id;
    player.currentCity = null;
  }

  discoverCurrentMap({ silent: false });
  updateMapUI();
  if (typeof updateTownUI === "function") updateTownUI();
  updateBattleBackground(currentMap);
  updateMonsterUI();

  saveGame();
  addBattleLog("移動到：" + currentMap.name);
}

function updateBattleBackground(mapData) {
  const battleField = document.getElementById("battle-field") || document.getElementById("battle-area");
  if (!battleField) return;

  if (mapData && mapData.background) {
    battleField.style.backgroundImage = `linear-gradient(rgba(20, 20, 20, 0.25), rgba(20, 20, 20, 0.25)), url("${mapData.background}")`;
  } else {
    battleField.style.backgroundImage = "none";
  }
}
