//=======================================
// Position Combat Engine v0.1
// 目標：在不推翻現有平面戰鬥畫面的前提下，加入玩家/怪物座標、射程、追擊、手動移動與蒼蠅翅膀。
// 參考 RA mob_db 概念欄位：AttackRange / SkillRange / ChaseRange / WalkSpeed / Ai / Modes。
//=======================================

const POSITION_ENGINE_VERSION = "0.9.70";
const FLY_WING_ITEM_ID = 601;

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
    moveSpeed: Number(player.position?.moveSpeed || 115)
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

function bindBattleFieldMovement() {
  const field = document.getElementById("battle-field");
  if (!field || field.dataset.positionBound === "1") return;
  field.dataset.positionBound = "1";

  field.addEventListener("click", event => {
    if (event.target.closest("button, input, select, textarea, .game-window, .fixed-panel, #quick-buttons, #top-bar, #quick-slot-bar")) return;
    if (!player || player.currentCity) return;

    const rect = field.getBoundingClientRect();
    const scaleX = field.offsetWidth ? rect.width / field.offsetWidth : 1;
    const scaleY = field.offsetHeight ? rect.height / field.offsetHeight : 1;
    const x = (event.clientX - rect.left) / scaleX;
    const y = (event.clientY - rect.top) / scaleY;
    setPlayerMoveTarget(x, y);
    addBattleLog(`移動到座標 (${Math.round(player.position.targetX)}, ${Math.round(player.position.targetY)})。`);
  });
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

  const step = Math.max(1, Number(player.position.moveSpeed || 115) * dt);
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

function getPlayerNormalAttackRange() {
  const weapon = getEquippedWeaponData();
  const weaponType = String(weapon?.weaponType || weapon?.subCategory || weapon?.category || "").toLowerCase();
  const name = String(weapon?.name || "");

  // 目前先用資料特徵判斷弓類；未來改由 weaponRange JSON 欄位管理。
  if (weaponType.includes("bow") || name.includes("弓")) return 245;
  if (weaponType.includes("staff") || name.includes("杖")) return 95;
  return 68;
}

function getSkillRangePx(skill) {
  if (!skill) return getPlayerNormalAttackRange();
  const raw = skill.range ?? skill.attackRange ?? skill.skillRange ?? skill.ai?.range;
  if (raw !== undefined && raw !== null) return Number(raw) * 36;
  return getPlayerNormalAttackRange();
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
  const raw = Number(monster?.WalkSpeed ?? monster?.walkSpeed ?? 400);
  // RA WalkSpeed 是每格移動間隔概念，數字越小越快；這裡轉成 RO_WEB 像素速度。
  return Math.max(40, Math.min(180, Math.round(24000 / Math.max(120, raw))));
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
      playerEl.style.left = `${Math.round(player.position.x)}px`;
      playerEl.style.top = `${Math.round(player.position.y)}px`;
    }
  }

  const monsterEl = document.getElementById("monster-sprite");
  if (monsterEl && currentMonster?.position) {
    monsterEl.style.left = `${Math.round(currentMonster.position.x)}px`;
    monsterEl.style.top = `${Math.round(currentMonster.position.y)}px`;
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
