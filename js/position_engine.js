//=======================================
// Position Combat Engine v0.2
// 目標：在不推翻現有平面戰鬥畫面的前提下，加入玩家/怪物座標、射程、追擊、手動移動與蒼蠅翅膀。
// 參考 RA mob_db 概念欄位：AttackRange / SkillRange / ChaseRange / WalkSpeed / Ai / Modes。
//=======================================

const POSITION_ENGINE_VERSION = "0.9.72j";
const FLY_WING_ITEM_ID = 601;

//=======================================
// Movement Engine v0.1
// 參考 rAthena src/common/mmo.hpp：
// DEFAULT_WALK_SPEED = 150, MIN_WALK_SPEED = 20, MAX_WALK_SPEED = 1000。
// RA WalkSpeed 數值越小越快；RO_WEB 統一使用 walkSpeed 表示速度狀態，
// 再轉換成畫面上的 px/sec。
//=======================================
const RA_WALK_SPEED = {
  FASTEST: 20,
  DEFAULT: 150,
  SLOWEST: 1000
};

const ROWEB_MOVEMENT = {
  defaultPixelsPerSecond: 115,
  minPixelsPerSecond: 18,
  maxPixelsPerSecond: 420
};

function clampRaWalkSpeed(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return RA_WALK_SPEED.DEFAULT;
  return Math.max(RA_WALK_SPEED.FASTEST, Math.min(RA_WALK_SPEED.SLOWEST, Math.round(v)));
}

function raWalkSpeedToPixelsPerSecond(walkSpeed) {
  const ws = clampRaWalkSpeed(walkSpeed);
  const px = ROWEB_MOVEMENT.defaultPixelsPerSecond * (RA_WALK_SPEED.DEFAULT / ws);
  return Math.max(ROWEB_MOVEMENT.minPixelsPerSecond, Math.min(ROWEB_MOVEMENT.maxPixelsPerSecond, px));
}

function getPlayerEffectiveWalkSpeed() {
  // 不在這裡呼叫 recalculatePlayerStats，避免狀態計算與移動速度互相遞迴。
  return clampRaWalkSpeed(player?.walkSpeed ?? RA_WALK_SPEED.DEFAULT);
}

function getPlayerMovePixelsPerSecond() {
  return raWalkSpeedToPixelsPerSecond(getPlayerEffectiveWalkSpeed());
}

function getMonsterEffectiveWalkSpeed(monster = currentMonster) {
  const raw = Number(monster?.WalkSpeed ?? monster?.walkSpeed ?? 400);
  return clampRaWalkSpeed(raw);
}

function getMonsterMovePixelsPerSecond(monster = currentMonster) {
  return raWalkSpeedToPixelsPerSecond(getMonsterEffectiveWalkSpeed(monster));
}

const POSITION_FIELD = {
  minX: 330,
  maxX: 930,
  minY: 135,
  maxY: 500,
  playerDefaultX: 470,
  playerDefaultY: 338,
  monsterDefaultX: 760,
  monsterDefaultY: 330,
  spriteAnchorOffsetX: 0,
  spriteAnchorOffsetY: 0
};

// V0.9.72b：手機直式版改採動態可行走區。
// 桌機仍保留原本 1280x720 的穩定手感；手機則依實際 battle-field 尺寸、
// 底部戰鬥紀錄/快捷欄與右側按鈕區計算邊界，避免角色跑出框外或躲到 UI 後面。
const POSITION_SAFE = {
  // V0.9.72d：PC / Mobile 共用動態可走區。
  // 目標：盡量使用整張戰鬥畫面，只避開左上人物欄與下方對話欄/快捷欄。
  left: 10,
  right: 10,
  topGap: 8,
  bottomGap: 14,
  playerW: 62,
  monsterW: 70
};

function getBattleFieldElement() {
  return document.getElementById("battle-field");
}

function isMobileBattleLayout() {
  const field = getBattleFieldElement();
  const width = field?.offsetWidth || window.innerWidth || 1280;
  return width <= 900 || window.matchMedia?.("(pointer: coarse)")?.matches;
}

function isPortraitBattleLayout() {
  const field = getBattleFieldElement();
  const width = field?.offsetWidth || window.innerWidth || 1280;
  const height = field?.offsetHeight || window.innerHeight || 720;
  return height > width;
}

function getFieldLogicalSize() {
  const field = getBattleFieldElement();
  return {
    width: Math.max(1, Number(field?.offsetWidth || 1280)),
    height: Math.max(1, Number(field?.offsetHeight || 720))
  };
}

function getUiTopInField(elementId) {
  const field = getBattleFieldElement();
  const el = document.getElementById(elementId);
  if (!field || !el) return null;
  const fr = field.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  if (!Number.isFinite(er.top) || er.height <= 0) return null;
  return er.top - fr.top;
}

function getUiBottomInField(elementId) {
  const field = getBattleFieldElement();
  const el = document.getElementById(elementId);
  if (!field || !el) return null;
  const fr = field.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  if (!Number.isFinite(er.bottom) || er.height <= 0) return null;
  return er.bottom - fr.top;
}

function getDynamicPositionBounds(kind = "player") {
  const { width, height } = getFieldLogicalSize();

  // V0.9.72f：真正全背景可走。
  // Position 座標只代表「腳底中心點 / 1 Cell」，不再用角色圖片寬高、UI 安全區、
  // 右側按鈕、下方聊天欄或等待怪物狀態縮小可走範圍。
  // 注意：可視背景邊框就是唯一硬邊界；角色圖片本體可以壓在 UI 或接近畫面邊緣。
  const minX = 0;
  const maxX = Math.max(minX, width);
  const minY = 0;
  const maxY = Math.max(minY, height);

  return {
    minX,
    maxX,
    minY,
    maxY,
    playerDefaultX: clampPositionValue(width * 0.38, minX, maxX),
    playerDefaultY: clampPositionValue(height * 0.66, minY, maxY),
    monsterDefaultX: clampPositionValue(width * 0.68, minX, maxX),
    monsterDefaultY: clampPositionValue(height * 0.58, minY, maxY)
  };
}

function clampPositionToBounds(pos, kind = "player") {
  const bounds = getDynamicPositionBounds(kind);
  return {
    x: clampPositionValue(pos?.x, bounds.minX, bounds.maxX),
    y: clampPositionValue(pos?.y, bounds.minY, bounds.maxY)
  };
}

// V0.9.72b：正式採用 RO Cell 概念作為射程單位。
// 目前 1 Cell 先換算為 36px，之後可依畫面手感集中調整，不散落於戰鬥公式。
const POSITION_CELL_SIZE_PX = 36;

const DEFAULT_WEAPON_RANGE_CELLS = {
  fist: 1,
  dagger: 1,
  sword: 1,
  oneHandSword: 1,
  twoHandSword: 1,
  axe: 1,
  mace: 1,
  staff: 1,
  katar: 1,
  spear: 2,
  bow: 4
};

let weaponRangeConfigCache = null;

let positionEngineTimer = null;
let positionAutoSaveTimer = null;
let positionBeforeUnloadBound = false;
let lastSavedPositionSnapshot = "";
let autoNoTargetSince = null;
let lastMoveInputSignature = "";
let lastMoveInputAt = 0;
let lastPositionDebug = null;

const POSITION_DEBUG_ENABLED = true;
const POSITION_AUTO_SAVE_MS = 60 * 1000;

function clampPositionValue(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function randomPositionInBattleField(kind = "monster") {
  const bounds = getDynamicPositionBounds(kind);
  return {
    x: randomInt(Math.round(bounds.minX), Math.round(bounds.maxX)),
    y: randomInt(Math.round(bounds.minY), Math.round(bounds.maxY))
  };
}

function normalizePositionData() {
  if (!player) return;

  const bounds = getDynamicPositionBounds("player");
  const currentPos = clampPositionToBounds({
    x: player.position?.x ?? bounds.playerDefaultX,
    y: player.position?.y ?? bounds.playerDefaultY
  }, "player");
  const targetPos = (player.position?.targetX !== null && player.position?.targetX !== undefined && player.position?.targetY !== null && player.position?.targetY !== undefined)
    ? clampPositionToBounds({ x: player.position.targetX, y: player.position.targetY }, "player")
    : { x: null, y: null };

  player.position = {
    x: currentPos.x,
    y: currentPos.y,
    targetX: targetPos.x,
    targetY: targetPos.y,
    moveSpeed: getPlayerMovePixelsPerSecond()
  };

  if (!player.autoCombat) player.autoCombat = {};
  player.autoCombat.teleport = {
    enabled: player.autoCombat.teleport?.enabled ?? false,
    noTargetSeconds: Number(player.autoCombat.teleport?.noTargetSeconds || 3)
  };
}

function initPositionEngine() {
  normalizePositionData();
  bindBattleFieldMovement();
  renderPositionSprites();
  bindPositionAutoSave();

  if (!window.__roWebPositionResizeBound) {
    window.__roWebPositionResizeBound = true;
    const recalcPositionBounds = () => {
      normalizePositionData();
      if (currentMonster?.position) {
        const safeMonsterPos = clampPositionToBounds(currentMonster.position, "monster");
        currentMonster.position.x = safeMonsterPos.x;
        currentMonster.position.y = safeMonsterPos.y;
      }
      renderPositionSprites();
    };
    window.addEventListener("resize", recalcPositionBounds, { passive: true });
    window.addEventListener("orientationchange", () => setTimeout(recalcPositionBounds, 250), { passive: true });
    window.visualViewport?.addEventListener?.("resize", recalcPositionBounds, { passive: true });
    window.visualViewport?.addEventListener?.("scroll", recalcPositionBounds, { passive: true });
  }

  if (!positionEngineTimer) {
    positionEngineTimer = setInterval(() => {
      updatePositionMovement(0.05);
      updateMonsterMovement(0.05);
      renderPositionSprites();
    }, 50);
  }
}

function getPositionSaveSnapshot() {
  if (!player?.position) return "";
  return JSON.stringify({
    map: player.map || currentMap?.id || "",
    x: Math.round(Number(player.position.x || 0)),
    y: Math.round(Number(player.position.y || 0)),
    city: player.currentCity || null
  });
}

function savePositionIfChanged(options = {}) {
  if (!player || typeof saveGame !== "function") return;
  normalizePositionData();
  const snapshot = getPositionSaveSnapshot();
  if (!options.force && snapshot && snapshot === lastSavedPositionSnapshot) return;
  saveGame();
  lastSavedPositionSnapshot = snapshot;
}

function bindPositionAutoSave() {
  if (!positionAutoSaveTimer) {
    lastSavedPositionSnapshot = getPositionSaveSnapshot();
    positionAutoSaveTimer = setInterval(() => {
      savePositionIfChanged();
    }, POSITION_AUTO_SAVE_MS);
  }

  if (!positionBeforeUnloadBound) {
    positionBeforeUnloadBound = true;
    window.addEventListener("beforeunload", () => {
      savePositionIfChanged({ force: true });
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") savePositionIfChanged({ force: true });
    });
  }
}


function isPrimaryMoveInput(event) {
  if (!event) return false;
  if (event.type === "pointerdown") {
    // 只接受主要指標；避免 iPhone / Chrome 同時送 mouse-like pointer 造成兩筆 log。
    if (event.isPrimary === false) return false;
    if (event.button !== undefined && event.button !== 0) return false;
    return ["touch", "mouse", "pen", ""].includes(event.pointerType || "");
  }
  if (event.type === "touchstart") return true;
  if (event.type === "click") return true;
  return false;
}

function shouldAcceptMoveInput(event, pos) {
  const now = Date.now();
  const x = Math.round(Number(pos?.x || 0));
  const y = Math.round(Number(pos?.y || 0));
  const family = event?.pointerType || (event?.type?.startsWith?.("touch") ? "touch" : event?.type || "unknown");
  const signature = `${family}:${x}:${y}`;

  // 同一次手機點擊可能產生 pointerdown + touchstart/click，或因 capture/bubble 被重進。
  // 只要 650ms 內座標幾乎相同，就視為同一次移動命令。
  if (now - lastMoveInputAt < 650) {
    const prev = String(lastMoveInputSignature || "").split(":");
    const px = Number(prev[1]);
    const py = Number(prev[2]);
    if (Number.isFinite(px) && Number.isFinite(py) && Math.hypot(px - x, py - y) <= 8) {
      return false;
    }
  }

  lastMoveInputSignature = signature;
  lastMoveInputAt = now;
  return true;
}

function ensurePositionDebugOverlay() {
  if (!POSITION_DEBUG_ENABLED) return null;
  const field = getBattleFieldElement();
  if (!field) return null;
  let el = document.getElementById("position-debug-overlay");
  if (!el) {
    el = document.createElement("div");
    el.id = "position-debug-overlay";
    el.className = "position-debug-overlay";
    field.appendChild(el);
  }
  return el;
}

function updatePositionDebugOverlay(extra = {}) {
  if (!POSITION_DEBUG_ENABLED) return;
  const el = ensurePositionDebugOverlay();
  const field = getBattleFieldElement();
  if (!el || !field) return;
  const rect = field.getBoundingClientRect();
  const p = player?.position || {};
  const playerEl = document.getElementById("player-sprite");
  const pr = playerEl?.getBoundingClientRect?.();
  const vv = getVisualViewportRectFallback();
  const logical = getFieldLogicalSize();
  const clientPoint = getLogicalPointClientPosition(p);
  lastPositionDebug = { ...lastPositionDebug, ...extra };
  el.textContent = [
    `P ${Math.round(p.x || 0)},${Math.round(p.y || 0)} → T ${Math.round(p.targetX ?? -1)},${Math.round(p.targetY ?? -1)}`,
    `Field L ${Math.round(logical.width)}x${Math.round(logical.height)} / R ${Math.round(rect.width)}x${Math.round(rect.height)}`,
    `Client ${Math.round(clientPoint?.x ?? -1)},${Math.round(clientPoint?.y ?? -1)} Sprite ${Math.round(pr?.left ?? -1)},${Math.round(pr?.top ?? -1)}`,
    lastPositionDebug?.tap ? `Tap ${lastPositionDebug.tap}` : ""
  ].filter(Boolean).join("\n");
}

function updatePositionDebugCross(pos = player?.position) {
  if (!POSITION_DEBUG_ENABLED) return;
  const field = getBattleFieldElement();
  if (!field || !pos) return;
  let cross = document.getElementById("position-debug-cross");
  if (!cross) {
    cross = document.createElement("div");
    cross.id = "position-debug-cross";
    cross.className = "position-debug-cross";
    field.appendChild(cross);
  }
  const point = getLogicalPointClientPosition(pos);
  const fieldRect = field.getBoundingClientRect();
  if (!point) return;
  cross.style.left = `${Math.round(point.x - fieldRect.left)}px`;
  cross.style.top = `${Math.round(point.y - fieldRect.top)}px`;
}

function isPointerOnBlockedUi(target) {
  // V0.9.72j：右側走不到的主因之一，是手機 UI 容器本身（top-bar / quick-buttons）
  // 佔住了右側可點擊區。全背景可走後，只阻擋真正可互動的按鈕、輸入框、彈窗、快捷格。
  // 金幣列、透明對話框、快捷按鈕容器空白處不再整片吃掉地圖點擊。
  return Boolean(target?.closest?.("button, input, select, textarea, .game-window, .fixed-panel, .quick-slot, .quick-slot-item, .dev-buttons"));
}

function getEventClientPoint(event) {
  const touch = event.touches?.[0] || event.changedTouches?.[0];
  const clientX = event.clientX ?? touch?.clientX;
  const clientY = event.clientY ?? touch?.clientY;
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
  return { clientX, clientY };
}

function getVisualViewportRectFallback() {
  const vv = window.visualViewport;
  if (vv && Number.isFinite(vv.width) && Number.isFinite(vv.height)) {
    return {
      left: Number(vv.offsetLeft || 0),
      top: Number(vv.offsetTop || 0),
      right: Number(vv.offsetLeft || 0) + Number(vv.width || 0),
      bottom: Number(vv.offsetTop || 0) + Number(vv.height || 0),
      width: Number(vv.width || 0),
      height: Number(vv.height || 0)
    };
  }
  return {
    left: 0,
    top: 0,
    right: window.innerWidth || document.documentElement.clientWidth || 1280,
    bottom: window.innerHeight || document.documentElement.clientHeight || 720,
    width: window.innerWidth || document.documentElement.clientWidth || 1280,
    height: window.innerHeight || document.documentElement.clientHeight || 720
  };
}

function getBattleFieldVisibleRect(field) {
  const rect = field.getBoundingClientRect();
  const vv = getVisualViewportRectFallback();

  // V0.9.72j：iPhone Safari 底部網址列會讓 100vh / rect.height 大於實際可觸控高度。
  // 如果直接用完整 rect.height 換算，手指點到可視畫面最下方也只會換算到邏輯中下段，
  // 造成「下方走不到、越往下點偶爾反而往上」。因此手機觸控採用 battle-field 與
  // visualViewport 的交集作為實際可點擊矩形。
  const left = Math.max(rect.left, vv.left);
  const top = Math.max(rect.top, vv.top);
  const right = Math.min(rect.right, vv.right);
  const bottom = Math.min(rect.bottom, vv.bottom);
  const width = Math.max(1, right - left);
  const height = Math.max(1, bottom - top);

  return { left, top, right, bottom, width, height };
}

function clampClientPointToRect(point, rect) {
  return {
    clientX: clampPositionValue(point.clientX, rect.left, rect.right),
    clientY: clampPositionValue(point.clientY, rect.top, rect.bottom)
  };
}

function getBattleFieldLocalPosition(event, field) {
  const point = getEventClientPoint(event);
  if (!point) return null;

  const fieldRect = field.getBoundingClientRect();
  const visibleRect = getBattleFieldVisibleRect(field);
  if (fieldRect.width <= 0 || fieldRect.height <= 0 || visibleRect.width <= 0 || visibleRect.height <= 0) return null;

  const logicalWidth = field.offsetWidth || 1280;
  const logicalHeight = field.offsetHeight || 720;

  // V0.9.72j：X 軸改回使用 battle-field 完整 rect，避免 visualViewport / 右側網址列縮放
  // 或右側 UI 容器造成可點寬度被誤縮，導致右邊角落永遠換算不到 maxX。
  // Y 軸仍使用可視交集，保留 0.9.72j 對 iPhone Safari 底部網址列的修正。
  const safeX = clampPositionValue(point.clientX, fieldRect.left, fieldRect.right);
  const safeY = clampPositionValue(point.clientY, visibleRect.top, visibleRect.bottom);
  const raw = {
    x: ((safeX - fieldRect.left) / fieldRect.width) * logicalWidth,
    y: ((safeY - visibleRect.top) / visibleRect.height) * logicalHeight
  };
  return clampPositionToBounds(raw, "player");
}

function bindBattleFieldMovement() {
  const field = document.getElementById("battle-field");
  if (!field || field.dataset.positionBound === "1") return;
  field.dataset.positionBound = "1";

  let lastTouchMoveRequestAt = 0;
  const handlePointerMoveRequest = event => {
    if (!isPrimaryMoveInput(event)) return;
    if (isPointerOnBlockedUi(event.target)) return;
    if (!player || player.currentCity) return;

    const now = Date.now();
    if (event.type === "click" && now - lastTouchMoveRequestAt < 700) return;
    if (event.type === "touchstart" || event.pointerType === "touch") lastTouchMoveRequestAt = now;

    const pos = getBattleFieldLocalPosition(event, field);
    if (!pos) return;
    if (!shouldAcceptMoveInput(event, pos)) return;

    if (event.cancelable) event.preventDefault();
    event.stopImmediatePropagation?.();
    event.stopPropagation?.();
    setPlayerMoveTarget(pos.x, pos.y);
    updatePositionDebugOverlay({ tap: `${event.type}/${event.pointerType || ""} → ${Math.round(pos.x)},${Math.round(pos.y)}` });
    addBattleLog(`移動到座標 (${Math.round(player.position.targetX)}, ${Math.round(player.position.targetY)})。`);
  };
  // V0.9.72j：同一個點擊只綁一種主要事件，避免 pointerdown + click / touchstart + click
  // 同時下達移動指令，造成戰鬥紀錄出現兩次座標。
  if (window.PointerEvent) {
    field.addEventListener("pointerdown", handlePointerMoveRequest, { passive: false, capture: true });
  } else {
    field.addEventListener("touchstart", handlePointerMoveRequest, { passive: false, capture: true });
    field.addEventListener("click", handlePointerMoveRequest, { passive: false, capture: true });
  }
}

function setPlayerMoveTarget(x, y) {
  normalizePositionData();
  const target = clampPositionToBounds({ x, y }, "player");
  player.position.targetX = target.x;
  player.position.targetY = target.y;
  player.state = autoBattleTimer ? "Moving" : "Move";
}

function updatePositionMovement(dt) {
  if (!player?.position) return;
  const tx = player.position.targetX;
  const ty = player.position.targetY;
  if (tx === null || ty === null || tx === undefined || ty === undefined) return;

  const dx = tx - player.position.x;
  const dy = ty - player.position.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= 2) {
    player.position.x = tx;
    player.position.y = ty;
    player.position.targetX = null;
    player.position.targetY = null;
    if (!autoBattleTimer) player.state = "Idle";
    return;
  }

  player.position.moveSpeed = getPlayerMovePixelsPerSecond();
  const step = Math.max(1, Number(player.position.moveSpeed || ROWEB_MOVEMENT.defaultPixelsPerSecond) * dt);
  const ratio = Math.min(1, step / dist);
  const next = clampPositionToBounds({
    x: player.position.x + dx * ratio,
    y: player.position.y + dy * ratio
  }, "player");
  player.position.x = next.x;
  player.position.y = next.y;
}

function distanceBetween(a, b) {
  if (!a || !b) return Infinity;
  return Math.hypot(Number(a.x || 0) - Number(b.x || 0), Number(a.y || 0) - Number(b.y || 0));
}

function getPlayerPosition() {
  normalizePositionData();
  return { x: player.position.x, y: player.position.y };
}

function getMonsterPosition(monster = currentMonster) {
  if (!monster) return null;
  if (!monster.position) {
    monster.position = randomPositionInBattleField();
    monster.spawnPosition = { ...monster.position };
  }
  return monster.position;
}

function getCurrentDistanceToMonster(monster = currentMonster) {
  if (!player || !monster) return Infinity;
  return distanceBetween(getPlayerPosition(), getMonsterPosition(monster));
}

function getEquippedWeaponData() {
  const weaponId = player?.equipment?.weapon;
  return weaponId ? getItemData(weaponId) : null;
}

function getWeaponRangeConfig() {
  if (weaponRangeConfigCache) return weaponRangeConfigCache;
  const bundled = window.RO_WEB_DATA?.["data/weapon_types.json"] || window.RO_WEB_DATA?.weapon_types;
  weaponRangeConfigCache = bundled || { cellSizePx: POSITION_CELL_SIZE_PX, types: DEFAULT_WEAPON_RANGE_CELLS };
  if (!weaponRangeConfigCache.types) weaponRangeConfigCache.types = DEFAULT_WEAPON_RANGE_CELLS;
  return weaponRangeConfigCache;
}

function normalizeWeaponTypeName(rawType, weapon = null) {
  const raw = String(rawType || "").trim();
  const lower = raw.toLowerCase();
  const name = String(weapon?.name || "");

  if (lower.includes("bow") || name.includes("弓")) return "bow";
  if (lower.includes("spear") || name.includes("矛") || name.includes("槍")) return "spear";
  if (lower.includes("dagger") || name.includes("短劍") || name.includes("匕首")) return "dagger";
  if (lower.includes("katar") || name.includes("拳刃")) return "katar";
  if (lower.includes("staff") || name.includes("杖")) return "staff";
  if (lower.includes("axe") || name.includes("斧")) return "axe";
  if (lower.includes("mace") || name.includes("鈍器") || name.includes("錘")) return "mace";
  if (lower.includes("two") && lower.includes("sword")) return "twoHandSword";
  if (lower.includes("sword") || name.includes("劍")) return "sword";
  return raw || "fist";
}

function cellsToPixels(cells) {
  const config = getWeaponRangeConfig();
  const cellSize = Number(config.cellSizePx || POSITION_CELL_SIZE_PX);
  return Math.max(1, Number(cells || 1) * cellSize);
}

function getPlayerNormalAttackRangeCells() {
  const weapon = getEquippedWeaponData();
  const config = getWeaponRangeConfig();
  const type = normalizeWeaponTypeName(weapon?.weaponType || weapon?.subCategory || weapon?.category, weapon);
  const data = config.types?.[type] ?? config.types?.fist ?? DEFAULT_WEAPON_RANGE_CELLS.fist;
  const cells = typeof data === "object" ? data.attackRangeCells : data;
  return Math.max(1, Number(cells || 1));
}

function getPlayerNormalAttackRange() {
  return cellsToPixels(getPlayerNormalAttackRangeCells());
}

function getSkillRangeCells(skill) {
  if (!skill) return getPlayerNormalAttackRangeCells();
  const raw = skill.rangeCells ?? skill.attackRangeCells ?? skill.skillRangeCells ?? skill.range ?? skill.attackRange ?? skill.skillRange ?? skill.ai?.range;
  if (raw !== undefined && raw !== null && raw !== "") return Math.max(1, Number(raw));
  return getPlayerNormalAttackRangeCells();
}

function getSkillRangePx(skill) {
  return cellsToPixels(getSkillRangeCells(skill));
}

function canAttackMonsterByRange(monster = currentMonster, rangePx = null) {
  if (!monster) return false;
  const attackRange = Number(rangePx ?? getPlayerNormalAttackRange());
  return getCurrentDistanceToMonster(monster) <= attackRange;
}

// 舊名稱保留給 battle.js / auto_battle.js 呼叫，但內部統一走 Position Engine。 
function isInPlayerAttackRange(monster = currentMonster, range = null) {
  return canAttackMonsterByRange(monster, range);
}

function getMonsterAttackRangePx(monster = currentMonster) {
  const raw = monster?.AttackRange ?? monster?.attackRange ?? monster?.attack_range;
  if (raw !== undefined && raw !== null) return Math.max(55, Number(raw) * 36);
  return 55;
}

function getMonsterChaseRangePx(monster = currentMonster) {
  const raw = monster?.ChaseRange ?? monster?.chaseRange ?? monster?.chase_range;
  if (raw !== undefined && raw !== null) return Math.max(160, Number(raw) * 36);
  return 360;
}

function getMonsterMoveSpeedPx(monster = currentMonster) {
  // RA WalkSpeed：數值越小越快；此函式保留舊名稱供其他模組呼叫。
  return getMonsterMovePixelsPerSecond(monster);
}

function isInPlayerAttackRange(monster = currentMonster, range = null) {
  if (!monster) return false;
  const attackRange = range ?? getPlayerNormalAttackRange();
  return getCurrentDistanceToMonster(monster) <= attackRange;
}

function movePlayerTowardMonster(monster = currentMonster, desiredRange = null) {
  if (!monster || !player?.position) return false;
  const monsterPos = getMonsterPosition(monster);
  const playerPos = getPlayerPosition();
  const range = desiredRange ?? getPlayerNormalAttackRange();
  const dist = distanceBetween(playerPos, monsterPos);
  if (dist <= range * 0.86) {
    player.position.targetX = null;
    player.position.targetY = null;
    return true;
  }

  const stopDistance = Math.max(34, range * 0.78);
  const dx = playerPos.x - monsterPos.x;
  const dy = playerPos.y - monsterPos.y;
  const safeDist = Math.max(1, Math.hypot(dx, dy));
  const targetX = monsterPos.x + (dx / safeDist) * stopDistance;
  const targetY = monsterPos.y + (dy / safeDist) * stopDistance;
  setPlayerMoveTarget(targetX, targetY);
  player.state = "Approaching";
  return false;
}

function updateMonsterMovement(dt) {
  if (!currentMonster || !currentMonster.position || !player || player.currentCity) return;
  const monster = currentMonster;
  const distance = getCurrentDistanceToMonster(monster);
  const attackRange = getMonsterAttackRangePx(monster);
  const chaseRange = getMonsterChaseRangePx(monster);

  if (distance <= attackRange) {
    monster.aiState = "ATTACK";
    return;
  }

  if (distance <= chaseRange) {
    monster.aiState = "CHASE";
    moveMonsterToward(monster, getPlayerPosition(), dt, attackRange * 0.86);
    return;
  }

  monster.aiState = "IDLE";
}

function moveMonsterToward(monster, target, dt, stopDistance = 50) {
  const pos = getMonsterPosition(monster);
  const dx = target.x - pos.x;
  const dy = target.y - pos.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= stopDistance) return;
  const step = getMonsterMoveSpeedPx(monster) * dt;
  const ratio = Math.min(1, step / Math.max(1, dist - stopDistance));
  const next = clampPositionToBounds({ x: pos.x + dx * ratio, y: pos.y + dy * ratio }, "monster");
  pos.x = next.x;
  pos.y = next.y;
}

function assignMonsterSpawnPosition(monster) {
  const pos = randomPositionInBattleField("monster");
  // 避免貼臉出生，盡量讓玩家先看到靠近/遠距差異。
  if (player?.position && distanceBetween(player.position, pos) < 180) {
    const shifted = clampPositionToBounds({ x: pos.x + 220, y: pos.y }, "monster");
    pos.x = shifted.x;
    pos.y = shifted.y;
  }
  monster.position = pos;
  monster.spawnPosition = { ...pos };
  monster.aiState = "IDLE";
}

function getSpriteAnchorOffset(element, kind = "player") {
  if (!element) return { x: 0, y: 0 };
  const width = Number(element.offsetWidth || (kind === "monster" ? 150 : 220));
  const height = Number(element.offsetHeight || (kind === "monster" ? 170 : 250));
  return {
    x: width * 0.5,
    y: height * (kind === "monster" ? 0.82 : 0.86)
  };
}

function getLogicalPointClientPosition(pos) {
  const field = getBattleFieldElement();
  if (!field || !pos) return null;
  const rect = field.getBoundingClientRect();
  const logicalWidth = field.offsetWidth || 1280;
  const logicalHeight = field.offsetHeight || 720;
  return {
    x: rect.left + (Number(pos.x || 0) / logicalWidth) * rect.width,
    y: rect.top + (Number(pos.y || 0) / logicalHeight) * rect.height
  };
}

function getUiFadeElements() {
  return [
    document.getElementById("player-info"),
    document.getElementById("top-bar"),
    document.getElementById("quick-buttons"),
    document.getElementById("battle-log"),
    document.getElementById("quick-slot-bar"),
    document.getElementById("auto-battle-area"),
    ...Array.from(document.querySelectorAll(".game-window:not(.hidden-window)"))
  ].filter(Boolean);
}

function updateUiFadeForPosition() {
  const point = getLogicalPointClientPosition(player?.position);
  const elements = getUiFadeElements();
  if (!point) {
    elements.forEach(el => el.classList.remove("ui-under-player"));
    return;
  }

  // V0.9.72f：UI Fade 改用「腳底 1 Cell 的小判定框」與 UI 實際 DOM 矩形相交。
  // 不再使用很大的放大半徑，避免右側 / 下方 UI 在角色還很遠時就透明；
  // 同時讓左側 / 上方 / 彈窗都用同一套判定，不再有方向差異。
  const halfCell = Math.max(6, POSITION_CELL_SIZE_PX * 0.33);
  const footRect = {
    left: point.x - halfCell,
    right: point.x + halfCell,
    top: point.y - halfCell,
    bottom: point.y + halfCell
  };

  elements.forEach(el => {
    const style = window.getComputedStyle?.(el);
    const rect = el.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0 &&
      style?.display !== "none" && style?.visibility !== "hidden";
    const overlaps = isVisible &&
      footRect.right >= rect.left &&
      footRect.left <= rect.right &&
      footRect.bottom >= rect.top &&
      footRect.top <= rect.bottom;
    el.classList.toggle("ui-under-player", overlaps);
  });
}

function getFieldClientScale() {
  const field = getBattleFieldElement();
  const rect = field?.getBoundingClientRect?.();
  const logicalWidth = field?.offsetWidth || 1280;
  const logicalHeight = field?.offsetHeight || 720;
  return {
    x: rect?.width ? rect.width / logicalWidth : 1,
    y: rect?.height ? rect.height / logicalHeight : 1
  };
}

function getSpriteAnchorRatio(kind = "player") {
  return {
    x: 0.5,
    y: kind === "monster" ? 0.82 : 0.86
  };
}

function placeSpriteByFootPosition(element, pos, kind = "player") {
  if (!element || !pos) return;

  // 初始定位：用目前 DOM 尺寸計算腳底中心。
  const anchor = getSpriteAnchorOffset(element, kind);
  element.style.setProperty("left", `${Math.round(Number(pos.x || 0) - anchor.x)}px`, "important");
  element.style.setProperty("top", `${Math.round(Number(pos.y || 0) - anchor.y)}px`, "important");

  // V0.9.72g：手機版 UI Scale / CSS zoom 會讓視覺腳底與邏輯座標不同步。
  // 用實際 getBoundingClientRect() 反校正一次，確保點擊下方邊界時角色真的能走到底。
  const targetClient = getLogicalPointClientPosition(pos);
  const rect = element.getBoundingClientRect?.();
  if (!targetClient || !rect || rect.width <= 0 || rect.height <= 0) return;

  const ratio = getSpriteAnchorRatio(kind);
  const actualClient = {
    x: rect.left + rect.width * ratio.x,
    y: rect.top + rect.height * ratio.y
  };
  const fieldScale = getFieldClientScale();
  const dx = (targetClient.x - actualClient.x) / Math.max(0.01, fieldScale.x);
  const dy = (targetClient.y - actualClient.y) / Math.max(0.01, fieldScale.y);

  if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
    const currentLeft = parseFloat(element.style.left) || 0;
    const currentTop = parseFloat(element.style.top) || 0;
    element.style.setProperty("left", `${Math.round(currentLeft + dx)}px`, "important");
    element.style.setProperty("top", `${Math.round(currentTop + dy)}px`, "important");
  }
}

function renderPositionSprites() {
  if (player?.position) {
    const safePlayerPos = clampPositionToBounds(player.position, "player");
    player.position.x = safePlayerPos.x;
    player.position.y = safePlayerPos.y;
    const playerEl = document.getElementById("player-sprite");
    if (playerEl) {
      // Position 座標為腳底中心；圖片本體可覆蓋 UI，但不再縮小可走範圍。
      placeSpriteByFootPosition(playerEl, player.position, "player");
    }
  }

  const monsterEl = document.getElementById("monster-sprite");
  if (monsterEl && currentMonster?.position) {
    const safeMonsterPos = clampPositionToBounds(currentMonster.position, "monster");
    currentMonster.position.x = safeMonsterPos.x;
    currentMonster.position.y = safeMonsterPos.y;
    placeSpriteByFootPosition(monsterEl, currentMonster.position, "monster");
    monsterEl.dataset.aiState = currentMonster.aiState || "IDLE";
  }
  updateUiFadeForPosition();
  updatePositionDebugCross(player?.position);
  updatePositionDebugOverlay();
}

function countInventoryItem(itemId) {
  const inv = findInventoryItemById(itemId);
  return Number(inv?.count || 0);
}

function addInventoryItemCount(itemId, count) {
  if (!player) return;
  const normalized = normalizeItemId(itemId);
  const existing = findInventoryItemById(normalized);
  if (existing) {
    existing.count = Number(existing.count || 0) + Number(count || 0);
  } else {
    player.inventory.push({ id: normalized, count: Number(count || 0) });
  }
}

function consumeInventoryItemCount(itemId, count = 1) {
  const inv = findInventoryItemById(itemId);
  if (!inv || Number(inv.count || 0) < count) return false;
  inv.count = Number(inv.count || 0) - count;
  if (inv.count <= 0) player.inventory = player.inventory.filter(item => String(item.id) !== String(itemId));
  return true;
}

function useFlyWing(options = {}) {
  if (!player) return false;
  if (player.currentCity) {
    if (!options.silent) addBattleLog("城鎮內暫不使用蒼蠅翅膀。");
    return false;
  }
  if (countInventoryItem(FLY_WING_ITEM_ID) <= 0) {
    if (!options.silent) addBattleLog("沒有蒼蠅翅膀，無法瞬移。");
    return false;
  }

  consumeInventoryItemCount(FLY_WING_ITEM_ID, 1);
  const pos = randomPositionInBattleField("player");
  normalizePositionData();
  const safePos = clampPositionToBounds(pos, "player");
  player.position.x = safePos.x;
  player.position.y = safePos.y;
  player.position.targetX = null;
  player.position.targetY = null;
  if (currentMonster) currentMonster.aiState = "IDLE";
  renderPositionSprites();
  updateInventoryUI();
  saveGame();
  addBattleLog(`使用蒼蠅翅膀，瞬移到 (${Math.round(pos.x)}, ${Math.round(pos.y)})。剩餘 ${countInventoryItem(FLY_WING_ITEM_ID)} 個。`);
  return true;
}

function maybeAutoTeleportWhenNoTarget() {
  if (!player?.autoCombat?.teleport?.enabled) return false;
  if (currentMonster) {
    autoNoTargetSince = null;
    return false;
  }
  const waitSeconds = Number(player.autoCombat.teleport.noTargetSeconds || 3);
  if (!autoNoTargetSince) autoNoTargetSince = Date.now();
  if (Date.now() - autoNoTargetSince < waitSeconds * 1000) return false;
  autoNoTargetSince = Date.now();
  return useFlyWing({ silent: false });
}
