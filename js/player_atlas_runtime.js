//=======================================
// RO Studio Export Schema v1.0 Player Atlas Runtime
// V0.9.80ZA：修正攻擊 Atlas 圖名與 F5 後裝備武器同步。
//=======================================

const RO_STUDIO_PLAYER_ATLAS = {
  manifestPath: "./data/character_atlas_manifest.json",
  manifest: null,
  characterKey: "novice_male",
  loadingCharacter: false,
  weaponType: "fist",
  assets: {},
  images: {},
  ready: false,
  canvas: null,
  ctx: null,
  lastTime: 0,
  frameIndex: 0,
  frameTimer: 0,
  fpsMs: {
    idle: 220,
    walk: 140,
    attack: 90,
    hurt: 120,
    dead: 160,
    cast: 95
  },
  directionId: 0,
  overrideMotion: null,
  overrideUntil: 0,
  overrideHoldLast: false,
  overrideLockUntil: 0,
  queuedMotion: null,
  lastAutoMotion: "idle"
};


function normalizeROStudioGender(rawGender) {
  const raw = String(rawGender || "").trim().toLowerCase();
  if (["female", "f", "女", "woman", "girl"].includes(raw)) return "female";
  return "male";
}

function getROStudioCurrentJobKey() {
  return String(player?.jobKey || player?.job || "novice").trim() || "novice";
}

function getROStudioCurrentGender() {
  return normalizeROStudioGender(player?.gender || player?.sex || player?.bodyGender || "male");
}

function buildROStudioCharacterKey(jobKey = getROStudioCurrentJobKey(), gender = getROStudioCurrentGender()) {
  return `${String(jobKey || "novice").trim()}_${normalizeROStudioGender(gender)}`;
}

function getROStudioFallbackManifest() {
  return {
    schema: "ro_web_character_manifest",
    schema_version: "2.0",
    exporter: "RO_WEB V0.9.80ZA Character System V2 fallback",
    default_job: "novice",
    default_gender: "male",
    default_character: "novice_male",
    asset_root: "assets/characters",
    characters: {
      novice_male: {
        display_name: "初學者（男）",
        job: "novice",
        gender: "male",
        base_path: "assets/characters/novice/male",
        idle_image: "assets/characters/novice/male/idle.png",
        motions_json: "assets/characters/novice/male/motions.json",
        weapon_type_default: "fist",
        motions: {
          idle: "assets/characters/novice/male/idle/body_hair.json",
          walk: "assets/characters/novice/male/walk/body_hair.json",
          hurt: "assets/characters/novice/male/hurt/body_hair.json",
          dead: "assets/characters/novice/male/dead/body_hair.json",
          cast: "assets/characters/novice/male/cast/body_hair.json",
          attack: {
            fist: "assets/characters/novice/male/attack/fist/body_hair.json",
            dagger: "assets/characters/novice/male/attack/dagger/body_hair.json",
            sword: "assets/characters/novice/male/attack/sword/body_hair.json",
            oneHandSword: "assets/characters/novice/male/attack/sword/body_hair.json",
            axe: "assets/characters/novice/male/attack/axe/body_hair.json",
            mace: "assets/characters/novice/male/attack/mace/body_hair.json",
            staff: "assets/characters/novice/male/attack/staff/body_hair.json"
          }
        }
      },
      novice_female: {
        display_name: "初學者（女）",
        job: "novice",
        gender: "female",
        base_path: "assets/characters/novice/female",
        idle_image: "assets/characters/novice/female/idle.png",
        motions_json: "assets/characters/novice/female/motions.json",
        weapon_type_default: "fist",
        motions: {
          idle: "assets/characters/novice/female/idle/body_hair.json",
          walk: "assets/characters/novice/female/walk/body_hair.json",
          hurt: "assets/characters/novice/female/hurt/body_hair.json",
          dead: "assets/characters/novice/female/dead/body_hair.json",
          cast: "assets/characters/novice/female/cast/body_hair.json",
          attack: {
            fist: "assets/characters/novice/female/attack/fist/body_hair.json",
            dagger: "assets/characters/novice/female/attack/dagger/body_hair.json",
            sword: "assets/characters/novice/female/attack/sword/body_hair.json",
            oneHandSword: "assets/characters/novice/female/attack/sword/body_hair.json",
            axe: "assets/characters/novice/female/attack/axe/body_hair.json",
            mace: "assets/characters/novice/female/attack/mace/body_hair.json",
            staff: "assets/characters/novice/female/attack/staff/body_hair.json"
          }
        }
      }
    }
  };
}

async function initROStudioPlayerAtlasRuntime() {
  const state = RO_STUDIO_PLAYER_ATLAS;
  setupROStudioPlayerCanvas();

  try {
    state.manifest = await loadJson(state.manifestPath, getROStudioFallbackManifest());
    if (!state.manifest) throw new Error("character_atlas_manifest.json missing");

    const characterKey = resolveROStudioCharacterKey();
    await setROStudioPlayerCharacter(characterKey, { initial: true });

    activateROStudioPlayerCanvas();
    state.ready = true;
    requestAnimationFrame(tickROStudioPlayerAtlasRuntime);
    console.log("RO Studio Player Atlas Runtime ready", state);
    if (typeof addBattleLog === "function") addBattleLog("RO Studio 角色動畫載入完成（V0.9.80ZA Character V2）。");
  } catch (error) {
    console.warn("RO Studio Player Atlas Runtime init failed", error);
    restoreLegacyPlayerImage();
    if (typeof addBattleLog === "function") addBattleLog("RO Studio 角色動畫載入失敗，改用目前職業 idle 圖。");
  }
}

function resolveROStudioCharacterKey() {
  const state = RO_STUDIO_PLAYER_ATLAS;
  // V2：角色 key 由目前職業 + 性別即時計算。
  // 不優先採用存檔裡的 characterAtlas，避免轉職/F5 後仍卡在舊職業圖。
  const desired = buildROStudioCharacterKey(getROStudioCurrentJobKey(), getROStudioCurrentGender());
  if (state.manifest?.characters?.[desired]) return desired;
  const sameGenderNovice = `novice_${getROStudioCurrentGender()}`;
  if (state.manifest?.characters?.[sameGenderNovice]) return sameGenderNovice;
  return state.manifest?.default_character || "novice_male";
}


function resolveROStudioWeaponTypeFromEquipment(fallback = "fist") {
  try {
    if (typeof normalizeWeaponTypeName === "function" && typeof getEquippedWeaponData === "function") {
      const weapon = getEquippedWeaponData();
      const type = normalizeWeaponTypeName(weapon?.weaponType || weapon?.dbSubType || weapon?.subCategory || weapon?.category, weapon);
      return type || fallback || "fist";
    }
  } catch (error) {
    console.warn("resolveROStudioWeaponTypeFromEquipment failed", error);
  }
  return fallback || player?.weaponType || "fist";
}

async function loadROStudioCharacterAssets(characterKey) {
  const state = RO_STUDIO_PLAYER_ATLAS;
  const character = state.manifest?.characters?.[characterKey] || getROStudioFallbackManifest().characters?.novice_male;
  if (!character) throw new Error(`Character atlas not found: ${characterKey}`);

  state.assets = {};
  state.images = {};
  state.weaponType = resolveROStudioWeaponTypeFromEquipment(character.weapon_type_default || "fist");

  await Promise.all([
    loadROStudioAtlasMotion("idle", character.motions.idle),
    loadROStudioAtlasMotion("walk", character.motions.walk),
    loadROStudioAtlasMotion("hurt", character.motions.hurt),
    loadROStudioAtlasMotion("dead", character.motions.dead),
    loadROStudioAtlasMotion("cast", character.motions.cast),
    loadROStudioAtlasMotion("attack", character.motions.attack?.[state.weaponType] || character.motions.attack?.fist)
  ]);
  return character;
}

async function setROStudioPlayerCharacter(characterKey = resolveROStudioCharacterKey(), options = {}) {
  const state = RO_STUDIO_PLAYER_ATLAS;
  if (state.loadingCharacter) return false;
  if (!options.force && state.characterKey === characterKey && state.assets?.idle) return true;
  state.loadingCharacter = true;
  try {
    const character = await loadROStudioCharacterAssets(characterKey);
    state.characterKey = characterKey;
    if (player) player.characterAtlas = characterKey;
    setROStudioIdleImagesForCurrentCharacter(character);
    state.frameIndex = 0;
    state.frameTimer = 0;
    state.lastAutoMotion = "idle";
    if (!options.initial) activateROStudioPlayerCanvas();
    return true;
  } catch (error) {
    console.warn("setROStudioPlayerCharacter failed", characterKey, error);
    return false;
  } finally {
    state.loadingCharacter = false;
  }
}
window.setROStudioPlayerCharacter = setROStudioPlayerCharacter;

function syncROStudioCharacterFromPlayer() {
  const desired = resolveROStudioCharacterKey();
  if (desired !== RO_STUDIO_PLAYER_ATLAS.characterKey && !RO_STUDIO_PLAYER_ATLAS.loadingCharacter) {
    setROStudioPlayerCharacter(desired);
  } else {
    setROStudioIdleImagesForCurrentCharacter();
  }
}
window.syncROStudioCharacterFromPlayer = syncROStudioCharacterFromPlayer;

function getROStudioCharacterIdleImage(character = null) {
  const state = RO_STUDIO_PLAYER_ATLAS;
  const entry = character || state.manifest?.characters?.[state.characterKey] || getROStudioFallbackManifest().characters?.novice_male;
  return entry?.idle_image || "assets/characters/novice/male/idle.png";
}
window.getROStudioCharacterIdleImage = getROStudioCharacterIdleImage;

function setROStudioIdleImagesForCurrentCharacter(character = null) {
  const idleSrc = `${getROStudioCharacterIdleImage(character)}?v=0.9.80ZA`;
  const portrait = document.getElementById("playerPortrait");
  if (portrait && portrait.getAttribute("src") !== idleSrc) {
    portrait.src = idleSrc;
    portrait.removeAttribute("srcset");
  }
  const field = document.getElementById("battle-field");
  const inTown = Boolean(field?.classList?.contains("city-mode") && !(field?.classList?.contains("world-camera-mode") || field?.dataset?.worldCamera === "true"));
  const playerImage = document.getElementById("playerImage");
  if (playerImage && inTown && playerImage.getAttribute("src") !== idleSrc) {
    playerImage.src = idleSrc;
    playerImage.removeAttribute("srcset");
    playerImage.dataset.roPortraitLock = "town";
  }
}
window.setROStudioIdleImagesForCurrentCharacter = setROStudioIdleImagesForCurrentCharacter;

function activateROStudioPlayerCanvas() {
  const img = document.getElementById("playerImage");
  const canvas = RO_STUDIO_PLAYER_ATLAS.canvas;
  const playerSprite = document.getElementById("player-sprite");
  const field = document.getElementById("battle-field");
  if (!img || !canvas) return;
  // V0.9.80L：只用 battle-field 的實際模式判斷 Town。
  // 不再用 player.currentCity，避免切到南門/世界圖時舊存檔 currentCity 殘留把 atlas 關掉。
  const isWorld = Boolean(field?.classList?.contains("world-camera-mode") || field?.dataset?.worldCamera === "true");
  const inTown = Boolean(field?.classList?.contains("city-mode") && !isWorld);
  if (inTown) {
    if (playerSprite) playerSprite.dataset.atlasActive = "false";
    if (field) field.dataset.atlasActive = "false";
    canvas.style.setProperty("display", "none", "important");
    canvas.style.setProperty("visibility", "hidden", "important");
    canvas.style.setProperty("opacity", "0", "important");
    img.style.setProperty("visibility", "visible", "important");
    img.style.setProperty("opacity", "1", "important");
    return;
  }
  if (playerSprite) playerSprite.dataset.atlasActive = "true";
  if (field) field.dataset.atlasActive = "true";
  canvas.style.setProperty("display", "block", "important");
  canvas.style.setProperty("visibility", "visible", "important");
  canvas.style.setProperty("opacity", "1", "important");
  canvas.style.setProperty("z-index", "3", "important");
  img.style.setProperty("visibility", "hidden", "important");
  img.style.setProperty("opacity", "0", "important");
}


function recoverROStudioAtlasAfterTownExit() {
  const field = document.getElementById("battle-field");
  const playerSprite = document.getElementById("player-sprite");
  const img = document.getElementById("playerImage");
  const canvas = RO_STUDIO_PLAYER_ATLAS.canvas || document.getElementById("playerAtlasCanvas");

  if (player && player.currentCity) player.currentCity = null;
  if (field) {
    field.classList.remove("city-mode");
    field.dataset.atlasActive = "true";
  }
  if (playerSprite) playerSprite.dataset.atlasActive = "true";
  if (img) {
    img.style.setProperty("visibility", "hidden", "important");
    img.style.setProperty("opacity", "0", "important");
    img.removeAttribute("data-ro-portrait-lock");
  }
  if (canvas) {
    canvas.style.setProperty("display", "block", "important");
    canvas.style.setProperty("visibility", "visible", "important");
    canvas.style.setProperty("opacity", "1", "important");
  }
  resizeROStudioPlayerCanvas();
  activateROStudioPlayerCanvas();
}
window.recoverROStudioAtlasAfterTownExit = recoverROStudioAtlasAfterTownExit;

function restoreLegacyPlayerImage() {
  const img = document.getElementById("playerImage");
  const canvas = document.getElementById("playerAtlasCanvas");
  if (canvas) canvas.style.display = "none";
  if (img) {
    img.style.visibility = "visible";
    img.style.opacity = "1";
  }
}

function setupROStudioPlayerCanvas() {
  const state = RO_STUDIO_PLAYER_ATLAS;
  const playerSprite = document.getElementById("player-sprite");
  const img = document.getElementById("playerImage");
  if (!playerSprite || !img) return;

  let canvas = document.getElementById("playerAtlasCanvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "playerAtlasCanvas";
    canvas.setAttribute("aria-label", "player atlas animation");
    img.insertAdjacentElement("afterend", canvas);
  }

  canvas.style.position = "absolute";
  canvas.style.left = img.style.left || "0px";
  canvas.style.top = img.style.top || "0px";
  canvas.style.width = img.style.width || "100%";
  canvas.style.height = img.style.height || "100%";
  canvas.style.maxWidth = img.style.maxWidth || canvas.style.width;
  canvas.style.maxHeight = img.style.maxHeight || canvas.style.height;
  canvas.style.pointerEvents = "none";
  canvas.style.filter = "drop-shadow(0 8px 8px rgba(0,0,0,.6))";
  canvas.style.transformOrigin = "50% 84%";
  canvas.style.zIndex = "3";
  canvas.style.imageRendering = "pixelated";

  img.dataset.legacySrc = img.getAttribute("src") || "";
  canvas.style.display = "none";

  state.canvas = canvas;
  state.ctx = canvas.getContext("2d");
  resizeROStudioPlayerCanvas();
}

function resizeROStudioPlayerCanvas() {
  const state = RO_STUDIO_PLAYER_ATLAS;
  const canvas = state.canvas;
  const img = document.getElementById("playerImage");
  if (!canvas || !img) return;

  const rect = img.getBoundingClientRect();
  const cssW = Math.max(1, Math.round(rect.width || img.clientWidth || 220));
  const cssH = Math.max(1, Math.round(rect.height || img.clientHeight || 220));
  // V0.9.80L: 手機世界地圖模糊原因修正。
  // V80K 用 devicePixelRatio 放大 backing store 後，再被 CSS 縮回顯示尺寸，
  // 會讓手機世界地圖發生二次取樣而變成柔焦。南門清楚、世界糊正是這條路徑造成。
  // 手機/觸控裝置改用 CSS 尺寸作為 backing store，搭配 imageSmoothing=false 與 CSS pixelated，避免二次縮放。
  const isMobileLike = Boolean(window.matchMedia && window.matchMedia('(max-width: 900px), (pointer: coarse)').matches);
  const dpr = isMobileLike ? 1 : Math.max(1, Math.min(2, Number(window.devicePixelRatio || 1)));
  const pixelW = Math.max(1, Math.round(cssW * dpr));
  const pixelH = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== pixelW || canvas.height !== pixelH) {
    canvas.width = pixelW;
    canvas.height = pixelH;
  }
  canvas.dataset.cssWidth = String(cssW);
  canvas.dataset.cssHeight = String(cssH);
  canvas.style.left = img.style.left || "0px";
  canvas.style.top = img.style.top || "0px";
  canvas.style.width = img.style.width || `${cssW}px`;
  canvas.style.height = img.style.height || `${cssH}px`;
  canvas.style.maxWidth = img.style.maxWidth || canvas.style.width;
  canvas.style.maxHeight = img.style.maxHeight || canvas.style.height;
}

async function loadROStudioAtlasMotion(motionId, jsonPath) {
  if (!jsonPath) return;
  const state = RO_STUDIO_PLAYER_ATLAS;
  const data = await loadJson("./" + String(jsonPath).replace(/^\.\//, ""), null);
  if (!data) return;

  const basePath = String(jsonPath).split("/").slice(0, -1).join("/");
  const imagePath = `${basePath}/${data.image}`;
  const image = await loadROStudioAtlasImage(imagePath);
  state.assets[motionId] = data;
  state.images[motionId] = image;
}


function getROStudioCharacterManifestEntry() {
  const state = RO_STUDIO_PLAYER_ATLAS;
  return state.manifest?.characters?.[state.characterKey] || getROStudioFallbackManifest().characters?.novice_male;
}

async function setROStudioPlayerWeaponType(rawType = "fist") {
  const state = RO_STUDIO_PLAYER_ATLAS;
  const character = getROStudioCharacterManifestEntry();
  if (!character?.motions?.attack) return false;

  const type = String(rawType || "fist");
  const path = character.motions.attack?.[type] || character.motions.attack?.fist;
  if (!path) return false;

  try {
    await loadROStudioAtlasMotion("attack", path);
    state.weaponType = character.motions.attack?.[type] ? type : "fist";
    if (player) player.weaponType = state.weaponType;
    return true;
  } catch (error) {
    console.warn("Attack motion load failed, fallback fist", type, error);
    const fallbackPath = character.motions.attack?.fist;
    if (fallbackPath && path !== fallbackPath) {
      await loadROStudioAtlasMotion("attack", fallbackPath);
      state.weaponType = "fist";
      if (player) player.weaponType = "fist";
    }
    return false;
  }
}
window.setROStudioPlayerWeaponType = setROStudioPlayerWeaponType;

function syncROStudioWeaponTypeFromEquipment() {
  const type = resolveROStudioWeaponTypeFromEquipment("fist");
  if (player) player.weaponType = type;
  if (type && type !== RO_STUDIO_PLAYER_ATLAS.weaponType) {
    setROStudioPlayerWeaponType(type).catch(error => {
      console.warn("setROStudioPlayerWeaponType failed", type, error);
      setROStudioPlayerWeaponType("fist").catch(() => {});
    });
  }
}
window.syncROStudioWeaponTypeFromEquipment = syncROStudioWeaponTypeFromEquipment;


function getROStudioPlayerAnchorRatio() {
  const state = RO_STUDIO_PLAYER_ATLAS;
  const asset = state.assets?.idle || state.assets?.walk || state.assets?.attack;
  const cellW = Number(asset?.cell?.width || 256);
  const cellH = Number(asset?.cell?.height || 256);
  const anchorX = Number(asset?.anchor?.x ?? 128);
  const anchorY = Number(asset?.anchor?.y ?? 140);
  return {
    x: Math.max(0, Math.min(1, anchorX / Math.max(1, cellW))),
    y: Math.max(0, Math.min(1, anchorY / Math.max(1, cellH))),
    rawX: anchorX,
    rawY: anchorY
  };
}
window.getROStudioPlayerAnchorRatio = getROStudioPlayerAnchorRatio;

function loadROStudioAtlasImage(path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = path;
  });
}

function tickROStudioPlayerAtlasRuntime(timestamp) {
  const state = RO_STUDIO_PLAYER_ATLAS;
  if (!state.ready) return;

  syncROStudioCharacterFromPlayer();

  const dt = Math.min(100, Math.max(0, timestamp - (state.lastTime || timestamp)));
  state.lastTime = timestamp;

  resizeROStudioPlayerCanvas();
  updateROStudioPlayerDirection();

  const motionId = getROStudioCurrentPlayerMotion(timestamp);
  const asset = state.assets[motionId] || state.assets.idle;
  const motion = asset?.motions?.[0];
  const rawFrameCount = Math.max(1, Number(motion?.frame_count || 1));
  const frameCount = motionId === "idle" ? 1 : rawFrameCount;

  if (state.lastAutoMotion !== motionId) {
    state.lastAutoMotion = motionId;
    state.frameIndex = 0;
    state.frameTimer = 0;
  }

  if (!(state.overrideHoldLast && state.overrideMotion === motionId)) {
    state.frameTimer += dt;
    const frameMs = Number(state.fpsMs[motionId] || 120);
    while (state.frameTimer >= frameMs) {
      state.frameTimer -= frameMs;
      if (motionId === "dead") {
        state.frameIndex = Math.min(frameCount - 1, state.frameIndex + 1);
      } else {
        state.frameIndex = (state.frameIndex + 1) % frameCount;
      }
    }
  }

  if (motionId === "idle") state.frameIndex = 0;
  renderROStudioPlayerAtlasFrame(motionId, state.frameIndex, state.directionId);
  requestAnimationFrame(tickROStudioPlayerAtlasRuntime);
}

function getROStudioCurrentPlayerMotion(now) {
  const state = RO_STUDIO_PLAYER_ATLAS;
  if (state.overrideMotion && now <= state.overrideUntil) {
    return state.overrideMotion;
  }
  if (state.overrideMotion && now > state.overrideUntil) {
    state.overrideMotion = null;
    state.overrideHoldLast = false;
    state.overrideLockUntil = 0;
    if (state.queuedMotion) {
      const queued = state.queuedMotion;
      state.queuedMotion = null;
      playROStudioPlayerMotion(queued.motionId, queued.options || {});
      return queued.motionId;
    }
  }

  const pState = String(player?.state || "").toLowerCase();
  if (pState.includes("move") || pState.includes("approach")) return "walk";
  return "idle";
}

function playROStudioPlayerMotion(motionId, options = {}) {
  const state = RO_STUDIO_PLAYER_ATLAS;
  if (!state.ready || !state.assets[motionId]) return false;

  const now = performance.now();
  const duration = Number(options.duration || getROStudioMotionDuration(motionId));

  // V0.9.79F：普攻一旦觸發，必須完整播完。
  // 怪物反擊造成的 hurt 不能在同一瞬間把 attack 蓋掉，否則玩家只會看到站立。
  if (state.overrideMotion === "attack" && now < state.overrideLockUntil && motionId !== "dead" && motionId !== "attack") {
    if (motionId === "hurt" || motionId === "cast") {
      state.queuedMotion = { motionId, options };
    }
    return true;
  }

  state.overrideMotion = motionId;
  state.overrideUntil = now + duration;
  state.overrideLockUntil = motionId === "attack" ? now + duration : 0;
  state.overrideHoldLast = Boolean(options.holdLast);
  state.frameIndex = 0;
  state.frameTimer = 0;
  state.lastAutoMotion = motionId;
  return true;
}

function getROStudioMotionDuration(motionId) {
  const state = RO_STUDIO_PLAYER_ATLAS;
  const asset = state.assets[motionId];
  const frameCount = Math.max(1, Number(asset?.motions?.[0]?.frame_count || 1));
  return frameCount * Number(state.fpsMs[motionId] || 120);
}

function renderROStudioPlayerAtlasFrame(motionId, frameIndex, directionId) {
  const state = RO_STUDIO_PLAYER_ATLAS;
  const canvas = state.canvas;
  const ctx = state.ctx;
  const asset = state.assets[motionId] || state.assets.idle;
  const image = state.images[motionId] || state.images.idle;
  const motion = asset?.motions?.[0];
  if (!canvas || !ctx || !asset || !image || !motion) return;

  const cellW = Number(asset.cell?.width || 256);
  const cellH = Number(asset.cell?.height || 256);
  const columns = Number(asset.atlas?.columns || 8);
  const dir = Math.max(0, Math.min(columns - 1, Number(directionId || 0)));
  const row = Number(motion.row_start || 0) + Math.max(0, Number(frameIndex || 0));
  const sx = dir * cellW;
  const sy = row * cellH;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  ctx.drawImage(image, sx, sy, cellW, cellH, 0, 0, canvas.width, canvas.height);
}

function updateROStudioPlayerDirection() {
  const state = RO_STUDIO_PLAYER_ATLAS;
  let dx = 0;
  let dy = 0;

  if (player?.position) {
    const pState = String(player.state || "").toLowerCase();

    // V0.9.79E：戰鬥中以怪物方向為優先。
    // 之前 targetX / targetY 仍殘留時，攻擊會偶爾沿用走路目標方向。
    if (currentMonster?.position && (pState.includes("attack") || pState.includes("approach"))) {
      dx = Number(currentMonster.position.x || 0) - Number(player.position.x || 0);
      dy = Number(currentMonster.position.y || 0) - Number(player.position.y || 0);
    } else if (player.position.targetX !== null && player.position.targetX !== undefined && player.position.targetY !== null && player.position.targetY !== undefined) {
      dx = Number(player.position.targetX) - Number(player.position.x || 0);
      dy = Number(player.position.targetY) - Number(player.position.y || 0);
    }
  }

  if (Math.hypot(dx, dy) < 0.5) return;
  state.directionId = vectorToRODirectionId(dx, dy);
}

function vectorToRODirectionId(dx, dy) {
  // RO Studio V59 atlas 實測：上下正常，但左右欄位與 RO_WEB 畫面座標相反。
  // 因此 Runtime 在這裡做一次水平翻轉：
  // left/west -> column 6, right/east -> column 2；斜向同樣左右互換。
  // Atlas rows remain: 0 south, 4 north.
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  if (angle >= 67.5 && angle < 112.5) return 0;      // down / south
  if (angle >= 112.5 && angle < 157.5) return 7;     // down-left -> atlas front_right
  if (angle >= 157.5 || angle < -157.5) return 6;    // left -> atlas right
  if (angle >= -157.5 && angle < -112.5) return 5;   // up-left -> atlas back_right
  if (angle >= -112.5 && angle < -67.5) return 4;    // up / north
  if (angle >= -67.5 && angle < -22.5) return 3;     // up-right -> atlas back_left
  if (angle >= -22.5 && angle < 22.5) return 2;      // right -> atlas left
  return 1;                                          // down-right -> atlas front_left
}
