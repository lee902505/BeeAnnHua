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
    if (currentMap.spawnPoint) {
      player.position = player.position || {};
      player.position.x = Number(currentMap.spawnPoint.x || 0);
      player.position.y = Number(currentMap.spawnPoint.y || 0);
      player.position.targetX = null;
      player.position.targetY = null;
    }
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

  // V0.9.77b：讓 CSS 可以依照目前地圖套用世界地圖比例規則。
  // 0.9.77a 只有設定 background，沒有同步 data-map-id，導致 24px 測試角色規則沒有吃到。
  if (mapData && mapData.id) {
    battleField.dataset.mapId = mapData.id;
  } else {
    delete battleField.dataset.mapId;
  }

  // V0.9.78c：世界 Camera 模式不再綁死舊測試 map id；
  // 地圖資料只要標記 worldCamera，就套用 512×3 / 64px 世界角色規則。
  const isWorldCameraMap = Boolean(mapData?.worldCamera || mapData?.id === "mjolnir_3x3_region_camera");
  battleField.classList.remove("city-mode");
  battleField.dataset.worldCamera = isWorldCameraMap ? "true" : "false";
  battleField.classList.toggle("world-camera-mode", isWorldCameraMap);

  // V0.9.78e：World Camera 尺寸與世界尺寸集中由 map 資料提供。
  // CSS 使用這些變數，避免之後測 Scale 2 / Scale 3 時到處改 hardcode。
  if (isWorldCameraMap) {
    const cameraWidth = Number(mapData?.cameraWidth || 1280);
    const cameraHeight = Number(mapData?.cameraHeight || 720);
    const worldWidth = Number(mapData?.worldWidth || cameraWidth);
    const worldHeight = Number(mapData?.worldHeight || cameraHeight);
    const playerHeight = Number(mapData?.playerWorldHeight || 64);
    const playerWidth = Number(mapData?.playerWorldWidth || Math.round(playerHeight * 0.47));
    battleField.style.setProperty("--world-camera-width", `${cameraWidth}px`);
    battleField.style.setProperty("--world-camera-height", `${cameraHeight}px`);
    battleField.style.setProperty("--world-width", `${worldWidth}px`);
    battleField.style.setProperty("--world-height", `${worldHeight}px`);
    battleField.style.setProperty("--world-player-height", `${playerHeight}px`);
    battleField.style.setProperty("--world-player-width", `${playerWidth}px`);
  }

  if (mapData && mapData.background) {
    const bgImage = `linear-gradient(rgba(20, 20, 20, 0.18), rgba(20, 20, 20, 0.18)), url("${mapData.background}")`;
    // V0.9.78W：世界地圖背景交給專用 world-camera-layer，避免手機版 background-position 沒有套到真正顯示層。
    battleField.dataset.worldBackgroundImage = bgImage;
    battleField.style.backgroundImage = isWorldCameraMap ? "none" : bgImage;
  } else {
    battleField.dataset.worldBackgroundImage = "none";
    battleField.style.backgroundImage = "none";
  }

  // 單格地圖 MVP 強制使用小地圖角色；離開測試地圖後還原高解析角色。
  const playerImage = document.getElementById("playerImage");
  if (playerImage) {
    playerImage.src = isWorldCameraMap
      ? "images/player/world/novice_male_world_tight_64.png"
      : "images/player/male/idle/0001.png";
  }

  if (typeof applyLargeMapCamera === "function") {
    applyLargeMapCamera();
  }
}
