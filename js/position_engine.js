//=======================================
// Position Combat Engine v0.2
// 目標：在不推翻現有平面戰鬥畫面的前提下，加入玩家/怪物座標、射程、追擊、手動移動與蒼蠅翅膀。
// 參考 RA mob_db 概念欄位：AttackRange / SkillRange / ChaseRange / WalkSpeed / Ai / Modes。
//=======================================

const POSITION_ENGINE_VERSION = "0.9.72a";
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

// V0.9.72a：正式採用 RO Cell 概念作為射程單位。
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
let autoNoTargetSince = null;

function clampPositionValue(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function randomPositionInBattleField() {
  return {
    x: randomInt(POSITION_FIELD.minX, POSITION_FIELD.maxX),
    y: randomInt(POSITION_FIELD.minY, POSITION_FIELD.maxY)
  };
}

function normalizePositionData() {
  if (!player) return;

  player.position = {
    x: clampPositionValue(player.position?.x ?? POSITION_FIELD.playerDefaultX, POSITION_FIELD.minX, POSITION_FIELD.maxX),
    y: clampPositionValue(player.position?.y ?? POSITION_FIELD.playerDefaultY, POSITION_FIELD.minY, POSITION_FIELD.maxY),
    targetX: player.position?.targetX ?? null,
    targetY: player.position?.targetY ?? null,
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

  if (!positionEngineTimer) {
    positionEngineTimer = setInterval(() => {
      updatePositionMovement(0.05);
      updateMonsterMovement(0.05);
      renderPositionSprites();
    }, 50);
  }
}

function isPointerOnBlockedUi(target) {
  return Boolean(target?.closest?.("button, input, select, textarea, .game-window, .fixed-panel, #quick-buttons, #top-bar, #quick-slot-bar"));
}

function getEventClientPoint(event) {
  const touch = event.touches?.[0] || event.changedTouches?.[0];
  const clientX = event.clientX ?? touch?.clientX;
  const clientY = event.clientY ?? touch?.clientY;
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
  return { clientX, clientY };
}

function getBattleFieldLocalPosition(event, field) {
  const rect = field.getBoundingClientRect();
  const point = getEventClientPoint(event);
  if (!point || rect.width <= 0 || rect.height <= 0) return null;

  // rect 是實際畫面尺寸；offsetWidth/offsetHeight 是邏輯尺寸。
  // iPhone Safari 上若 CSS zoom / viewport 造成 offset 異常，退回 1280x720 內部座標。
  const logicalWidth = field.offsetWidth || 1280;
  const logicalHeight = field.offsetHeight || 720;
  const x = ((point.clientX - rect.left) / rect.width) * logicalWidth;
  const y = ((point.clientY - rect.top) / rect.height) * logicalHeight;
  return { x, y };
}

function bindBattleFieldMovement() {
  const field = document.getElementById("battle-field");
  if (!field || field.dataset.positionBound === "1") return;
  field.dataset.positionBound = "1";

  let lastTouchMoveRequestAt = 0;
  const handlePointerMoveRequest = event => {
    if (isPointerOnBlockedUi(event.target)) return;
    if (!player || player.currentCity) return;

    // iPhone Safari 可能同時派發 touchstart + synthetic click，避免重複下達移動指令。
    const now = Date.now();
    if (event.type === "click" && now - lastTouchMoveRequestAt < 450) return;
    if (event.type === "touchstart") lastTouchMoveRequestAt = now;

    const pos = getBattleFieldLocalPosition(event, field);
    if (!pos) return;

    if (event.cancelable) event.preventDefault();
    event.stopPropagation?.();
    setPlayerMoveTarget(pos.x, pos.y);
    addBattleLog(`移動到座標 (${Math.round(player.position.targetX)}, ${Math.round(player.position.targetY)})。`);
  };

  // V0.9.72a：iPhone Safari 修正。即使支援 PointerEvent，也額外綁 touchstart 作保險。
  field.addEventListener("pointerdown", handlePointerMoveRequest, { passive: false, capture: true });
  field.addEventListener("touchstart", handlePointerMoveRequest, { passive: false, capture: true });
  field.addEventListener("click", handlePointerMoveRequest, { passive: false, capture: true });
}

function setPlayerMoveTarget(x, y) {
  normalizePositionData();
  player.position.targetX = clampPositionValue(x, POSITION_FIELD.minX, POSITION_FIELD.maxX);
  player.position.targetY = clampPositionValue(y, POSITION_FIELD.minY, POSITION_FIELD.maxY);
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
  player.position.x += dx * ratio;
  player.position.y += dy * ratio;
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
  pos.x = clampPositionValue(pos.x + dx * ratio, POSITION_FIELD.minX, POSITION_FIELD.maxX);
  pos.y = clampPositionValue(pos.y + dy * ratio, POSITION_FIELD.minY, POSITION_FIELD.maxY);
}

function assignMonsterSpawnPosition(monster) {
  const pos = randomPositionInBattleField();
  // 避免貼臉出生，盡量讓玩家先看到靠近/遠距差異。
  if (player?.position && distanceBetween(player.position, pos) < 180) {
    pos.x = clampPositionValue(pos.x + 220, POSITION_FIELD.minX, POSITION_FIELD.maxX);
  }
  monster.position = pos;
  monster.spawnPosition = { ...pos };
  monster.aiState = "IDLE";
}

function renderPositionSprites() {
  if (player?.position) {
    const playerEl = document.getElementById("player-sprite");
    if (playerEl) {
      // V0.9.72a：手機 CSS 曾用 !important 固定角色位置，會蓋掉 JS 座標。
      // 這裡用 inline important，確保 PC / iPhone 都由 Position Engine 控制。
      playerEl.style.setProperty("left", `${Math.round(player.position.x)}px`, "important");
      playerEl.style.setProperty("top", `${Math.round(player.position.y)}px`, "important");
    }
  }

  const monsterEl = document.getElementById("monster-sprite");
  if (monsterEl && currentMonster?.position) {
    monsterEl.style.setProperty("left", `${Math.round(currentMonster.position.x)}px`, "important");
    monsterEl.style.setProperty("top", `${Math.round(currentMonster.position.y)}px`, "important");
    monsterEl.dataset.aiState = currentMonster.aiState || "IDLE";
  }
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
  const pos = randomPositionInBattleField();
  normalizePositionData();
  player.position.x = pos.x;
  player.position.y = pos.y;
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
