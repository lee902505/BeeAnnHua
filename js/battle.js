//=======================================
// 戰鬥系統 battle.js
//=======================================

let currentMonster = null;
let autoBattleTimer = null;
let spawnTimer = null;

const AUTO_ATTACK_INTERVAL = 250; // v0.9.30：用較短 tick 檢查，實際攻擊間隔由 ASPD 控制
const RESPAWN_DELAY = 1500;        // 怪物死亡後 1.5 秒生下一隻
let lastPlayerAttackAt = 0;

function getPlayerAttackDelayMs() {
  if (typeof recalculatePlayerStats === "function") recalculatePlayerStats();
  const aspd = Math.max(1, Math.min(190, Number(player?.aspd || 150)));
  // RO_WEB 初版近似：150 ASPD 約 2 秒一擊，190 ASPD 約 0.2 秒一擊。
  return Math.max(200, Math.round(2000 - (aspd - 150) * 45));
}

function canPlayerAttackNow() {
  return Date.now() - lastPlayerAttackAt >= getPlayerAttackDelayMs();
}

function markPlayerAttackUsed() {
  lastPlayerAttackAt = Date.now();
}

function getMonsterHit(monster) {
  return Number(monster?.hit ?? (175 + Number(monster?.level || 1)));
}

function getMonsterFlee(monster) {
  return Number(monster?.flee ?? (95 + Number(monster?.level || 1)));
}

function rollHit(attackerHit, defenderFlee) {
  const chance = Math.max(5, Math.min(95, 80 + Number(attackerHit || 0) - Number(defenderFlee || 0)));
  return Math.random() * 100 < chance;
}

function playerHitsMonster() {
  if (typeof recalculatePlayerStats === "function") recalculatePlayerStats();
  return rollHit(Number(player?.hit || 0), getMonsterFlee(currentMonster));
}

function monsterHitsPlayer(monster) {
  if (typeof recalculatePlayerStats === "function") recalculatePlayerStats();
  return rollHit(getMonsterHit(monster), Number(player?.flee || 0));
}

function clearBattleTimersAndMonster(options = {}) {
  if (autoBattleTimer) {
    clearInterval(autoBattleTimer);
    autoBattleTimer = null;
  }
  if (spawnTimer) {
    clearTimeout(spawnTimer);
    spawnTimer = null;
  }
  if (options.clearMonster !== false) {
    currentMonster = null;
  }
  if (player) player.state = "Idle";
}

// 開始自動戰鬥
function startAutoBattle() {
  if (autoBattleTimer) {
    addBattleLog("自動戰鬥已經在進行中。");
    return;
  }

  if (player?.currentCity) {
    addBattleLog("目前位於城鎮，請先前往練功地圖再開始戰鬥。");
    return;
  }

  if (!currentMap) {
    addBattleLog("目前沒有地圖資料，無法開始戰鬥。");
    return;
  }

  if (player.hp <= 0) {
    player.hp = player.maxHp;
    updatePlayerUI();
    saveGame();
    addBattleLog("HP 已恢復。");
  }

  // 開始戰鬥前先同步一次 v0.6 自動戰鬥設定
  if (typeof syncAutoCombatSettingsFromUI === "function") {
    syncAutoCombatSettingsFromUI({
      silent: true,
      save: true
    });
  }

  player.state = "Searching";
  addBattleLog("開始自動戰鬥。");

  spawnMonsterFromCurrentMap();

  autoBattleTimer = setInterval(() => {
    if (typeof maybeAutoTeleportWhenNoTarget === "function") maybeAutoTeleportWhenNoTarget();
    autoAttackMonster();
  }, AUTO_ATTACK_INTERVAL);
}

// 停止自動戰鬥
function stopAutoBattle(options = {}) {
  const wasRunning = Boolean(autoBattleTimer || spawnTimer);

  if (autoBattleTimer) {
    clearInterval(autoBattleTimer);
    autoBattleTimer = null;
  }

  if (spawnTimer) {
    clearTimeout(spawnTimer);
    spawnTimer = null;
  }

  if (player) player.state = "Idle";

  if (wasRunning && !options.silent) {
    addBattleLog("已停止自動戰鬥。");
  }
}

// 從目前地圖生成怪物
function spawnMonsterFromCurrentMap() {
  if (currentMonster) return;

  if (!currentMap) {
    addBattleLog("目前沒有地圖資料，無法生怪。");
    return;
  }

  if (!currentMap.monsters || currentMap.monsters.length === 0) {
    addBattleLog("這張地圖沒有怪物。");
    return;
  }

  const monsterId = getRandomFromArray(currentMap.monsters);
  const monsterData = monsters.find(monster => monster.id === monsterId);

  if (!monsterData) {
    addBattleLog("找不到怪物資料：" + monsterId);
    return;
  }

  currentMonster = {
    ...monsterData,
    currentHp: monsterData.maxHp || monsterData.hp
  };

  if (typeof assignMonsterSpawnPosition === "function") assignMonsterSpawnPosition(currentMonster);
  autoNoTargetSince = null;

  if (player) player.state = "Attacking";
  updateMonsterUI();
  addBattleLog("出現了 " + currentMonster.name + "！");
}

// 玩家自動攻擊怪物
function autoAttackMonster() {
  if (!currentMonster) return;

  // v0.9.72：先決定本 tick 要用普攻還是攻擊技能，再用對應射程判定。
  // 這樣投擲長矛 / 弓類技能不會被普攻 1 Cell 射程綁死。
  const autoAction = typeof runAutoCombatTick === "function"
    ? runAutoCombatTick(currentMonster)
    : { action: "normal" };

  if (autoAction && autoAction.action === "utility") {
    updatePlayerUI();
    return;
  }

  const intendedRange = autoAction && autoAction.action === "attackSkill"
    ? (typeof getSkillRangePx === "function" ? getSkillRangePx(autoAction.skill) : null)
    : (typeof getPlayerNormalAttackRange === "function" ? getPlayerNormalAttackRange() : null);

  if (typeof canAttackMonsterByRange === "function" && !canAttackMonsterByRange(currentMonster, intendedRange)) {
    if (typeof movePlayerTowardMonster === "function") movePlayerTowardMonster(currentMonster, intendedRange);
    updateMonsterUI();
    return;
  }

  if (!canPlayerAttackNow()) return;

  if (autoAction && autoAction.action === "attackSkill") {
    markPlayerAttackUsed();
    if (!playerHitsMonster()) {
      addBattleLog("你施放 " + autoAction.skill.name + "，但是 Miss！");
      playPlayerAttackAnimation();
      monsterAttackPlayer();
      return;
    }
    const used = castAttackSkill(autoAction.skill, autoAction.level);

    if (used) {
      if (currentMonster.currentHp <= 0) {
        defeatMonster();
        return;
      }

      monsterAttackPlayer();
      return;
    }
  }

  if (typeof canAttackMonsterByRange === "function" && !canAttackMonsterByRange(currentMonster, intendedRange)) {
    if (typeof movePlayerTowardMonster === "function") movePlayerTowardMonster(currentMonster, intendedRange);
    return;
  }

  markPlayerAttackUsed();

  if (!playerHitsMonster()) {
    addBattleLog("你攻擊 " + currentMonster.name + "，但是 Miss！");
    playPlayerAttackAnimation();
    updateMonsterUI();
    monsterAttackPlayer();
    return;
  }

  const playerDamage = calculatePlayerDamage();

  currentMonster.currentHp -= playerDamage;

  if (currentMonster.currentHp < 0) {
    currentMonster.currentHp = 0;
  }

  addBattleLog("你對 " + currentMonster.name + " 造成 " + playerDamage + " 點傷害。");

  playPlayerAttackAnimation();
  updateMonsterUI();
  playMonsterHitAnimation(currentMonster);
  showDamageNumber(playerDamage);
  showSlashEffect();

  if (currentMonster.currentHp <= 0) {
    defeatMonster();
    return;
  }

  monsterAttackPlayer();
}

// 計算玩家傷害
function calculatePlayerDamage() {
  // 每次攻擊前重新抓一次衍生能力，確保剛裝備武器/防具後傷害立即吃到 ATK。
  if (typeof recalculatePlayerStats === "function") recalculatePlayerStats();
  const derived = typeof calculateDerivedPlayerStats === "function" ? calculateDerivedPlayerStats() : null;
  const currentAtk = Number(derived?.atk ?? player.atk ?? 1);
  const baseDamage = Math.max(1, currentAtk - Number(currentMonster.def || 0));
  const minDamage = Math.max(1, baseDamage - 2);
  const maxDamage = baseDamage + 2;

  let damage = randomInt(minDamage, maxDamage);
  const critChance = Math.max(0, Math.min(100, Number(derived?.cri ?? player.cri ?? 0)));
  if (Math.random() * 100 < critChance) {
    damage = Math.max(1, Math.floor(damage * 1.4));
  }
  const trainingBonus = typeof getTrainingBonusTotals === "function" ? Number(getTrainingBonusTotals().damageRate || 0) : 0;
  const passiveBonus = typeof getPassiveSkillBonusTotals === "function" ? Number(getPassiveSkillBonusTotals().damageRate || 0) : 0;
  const buffBonus = typeof getActiveBuffBonusTotals === "function" ? Number(getActiveBuffBonusTotals().damageRate || 0) : 0;
  const bonus = trainingBonus + passiveBonus + buffBonus;
  return Math.max(1, Math.floor(damage * (100 + bonus) / 100));
}

// 怪物攻擊玩家
function monsterAttackPlayer() {
  if (!currentMonster) return;

  if (typeof getCurrentDistanceToMonster === "function" && typeof getMonsterAttackRangePx === "function") {
    if (getCurrentDistanceToMonster(currentMonster) > getMonsterAttackRangePx(currentMonster)) {
      currentMonster.aiState = "CHASE";
      return;
    }
  }

  if (!monsterHitsPlayer(currentMonster)) {
    addBattleLog(currentMonster.name + " 攻擊你，但是 Miss！");
    updatePlayerUI();
    return;
  }

  const monsterDamage = calculateMonsterDamage(currentMonster);

  player.hp -= monsterDamage;
  window.lastPlayerDamageAt = Date.now();

  if (player.hp < 0) {
    player.hp = 0;
  }

  addBattleLog(currentMonster.name + " 對你造成 " + monsterDamage + " 點傷害。");

  // 先判斷死亡，再允許自動喝水。避免 HP 歸零後靠藥水復活。
  if (player.hp <= 0) {
    updatePlayerUI();
    saveGame();
    playerDead();
    return;
  }

  // 怪物打完玩家後，自動檢查是否需要喝水
  if (typeof autoUsePotion === "function") {
    autoUsePotion();
  }

  updatePlayerUI();
  saveGame();
}
// 計算怪物傷害
function calculateMonsterDamage(monster) {
  if (typeof recalculatePlayerStats === "function") recalculatePlayerStats();
  const derived = typeof calculateDerivedPlayerStats === "function" ? calculateDerivedPlayerStats() : null;
  const currentDef = Number(derived?.def ?? player.def ?? 0);
  const baseDamage = Math.max(1, (monster.atk || 1) - currentDef);
  const minDamage = Math.max(1, baseDamage - 2);
  const maxDamage = baseDamage + 2;

  return randomInt(minDamage, maxDamage);
}

// 玩家死亡
function playerDead() {
  addBattleLog("你被 " + currentMonster.name + " 擊敗了。");

  stopAutoBattle();

  currentMonster = null;
  player.hp = player.maxHp;

  updateMonsterUI();
  updatePlayerUI();
  saveGame();

  addBattleLog("HP 已恢復，請重新開始自動戰鬥。");
}

// 怪物死亡
function defeatMonster() {
  const defeatedMonster = currentMonster;
  addBattleLog(defeatedMonster.name + " 被擊敗了！");

  if (typeof recordMapMonsterDiscovery === "function") {
    recordMapMonsterDiscovery(defeatedMonster);
  }

  grantMonsterRewards(defeatedMonster);

  playMonsterDeathAnimation();
  currentMonster = null;
  autoNoTargetSince = Date.now();
  if (player) player.state = "Searching";

  updatePlayerUI();
  updateInventoryUI();
  saveGame();

  setTimeout(() => {
    updateMonsterUI();
  }, 380);

  if (spawnTimer) {
    clearTimeout(spawnTimer);
  }

  spawnTimer = setTimeout(() => {
    spawnTimer = null;
    spawnMonsterFromCurrentMap();
  }, RESPAWN_DELAY);
}

// 掉寶判定
// chance 採用萬分比：10000 = 100%，1000 = 10%，1 = 0.01%
function checkDrops(monster) {
  if (!monster.drops || monster.drops.length === 0) return;

  monster.drops.forEach(drop => {
    const roll = Math.floor(Math.random() * 10000) + 1;

    if (roll <= drop.chance) {
      const itemId = normalizeItemId(drop.itemId);
      const itemData = getItemData(itemId);
      const itemName = itemData?.name || drop.name || `Item ${itemId}`;

      addItem({
        id: itemId,
        name: itemName
      }, drop.qty || 1);
    }
  });
}

// 更新怪物 UI
function updateMonsterUI() {
  const monsterSpriteEl = document.getElementById("monster-sprite");
  const nameEl = document.getElementById("monsterName");
  const levelEl = document.getElementById("monsterLevel");
  const hpEl = document.getElementById("monsterHp");
  const imageEl = document.getElementById("monsterImage");
  const placeholderEl = document.querySelector(".monster-placeholder");
  const hpBarEl = document.getElementById("monsterHpBar");

  if (!nameEl || !levelEl || !hpEl) return;

  const inTown = Boolean(player?.currentCity);
  if (monsterSpriteEl) {
    monsterSpriteEl.classList.toggle("town-mode", inTown);
  }

  if (inTown) {
    nameEl.textContent = "城鎮中";
    levelEl.textContent = "-";
    hpEl.textContent = "";
    if (imageEl) {
      imageEl.hidden = true;
      imageEl.removeAttribute("src");
    }
    if (placeholderEl) {
      placeholderEl.style.display = "none";
      placeholderEl.textContent = "?";
    }
    if (hpBarEl) hpBarEl.style.width = "0%";
    return;
  }

  if (!currentMonster) {
    nameEl.textContent = player?.state === "Searching" ? "正在搜尋怪物..." : "等待怪物出現";
    levelEl.textContent = "-";
    hpEl.textContent = "0 / 0";
    if (imageEl) imageEl.hidden = true;
    if (placeholderEl) {
      placeholderEl.textContent = "?";
      placeholderEl.style.display = "grid";
    }
    if (hpBarEl) hpBarEl.style.width = "0%";
    return;
  }

  const maxHp = currentMonster.maxHp || currentMonster.hp || 1;
  const hpPercent = Math.max(0, Math.min(100, Math.round((currentMonster.currentHp / maxHp) * 100)));

  nameEl.textContent = currentMonster.name;
  levelEl.textContent = currentMonster.level || "-";
  hpEl.textContent = `${currentMonster.currentHp} / ${maxHp}`;
  if (hpBarEl) hpBarEl.style.width = `${hpPercent}%`;

  if (imageEl && currentMonster.image) {
    imageEl.onerror = function () {
      imageEl.hidden = true;
      if (placeholderEl) placeholderEl.style.display = "grid";
    };
    imageEl.src = currentMonster.image;
    imageEl.hidden = false;
    if (placeholderEl) placeholderEl.style.display = "none";
  } else {
    if (imageEl) imageEl.hidden = true;
    if (placeholderEl) {
      placeholderEl.style.display = "grid";
      placeholderEl.textContent = currentMonster.name || "MON";
    }
  }
}


// 玩家攻擊動畫
function playPlayerAttackAnimation() {
  const playerSprite = document.getElementById("player-sprite");
  if (!playerSprite) return;

  playerSprite.classList.remove("is-attacking");
  void playerSprite.offsetWidth;
  playerSprite.classList.add("is-attacking");

  setTimeout(() => {
    playerSprite.classList.remove("is-attacking");
  }, 360);
}

// 怪物被打動畫：短暫切換 hit 圖
function playMonsterHitAnimation(monsterSnapshot) {
  const monsterSprite = document.getElementById("monster-sprite");
  const imageEl = document.getElementById("monsterImage");
  if (!monsterSprite || !monsterSnapshot) return;

  monsterSprite.classList.remove("is-hit");
  void monsterSprite.offsetWidth;
  monsterSprite.classList.add("is-hit");

  if (imageEl && monsterSnapshot.hitImage) {
    imageEl.src = monsterSnapshot.hitImage;
  }

  setTimeout(() => {
    monsterSprite.classList.remove("is-hit");
    if (imageEl && currentMonster && currentMonster.image) {
      imageEl.src = currentMonster.image;
    }
  }, 230);
}

// 怪物死亡動畫
function playMonsterDeathAnimation() {
  const monsterSprite = document.getElementById("monster-sprite");
  if (!monsterSprite) return;

  monsterSprite.classList.remove("is-hit");
  monsterSprite.classList.add("is-dying");

  setTimeout(() => {
    monsterSprite.classList.remove("is-dying");
  }, 420);
}

// 傷害數字浮起
function showDamageNumber(damage) {
  const battleField = document.getElementById("battle-field");
  if (!battleField) return;

  const number = document.createElement("div");
  number.className = "damage-number";
  number.textContent = damage;

  const randomX = randomInt(-12, 18);
  const randomY = randomInt(-8, 8);
  number.style.left = `${760 + randomX}px`;
  number.style.top = `${300 + randomY}px`;

  battleField.appendChild(number);

  setTimeout(() => {
    number.remove();
  }, 850);
}

// 斬擊特效
function showSlashEffect() {
  const slash = document.getElementById("slashEffect");
  if (!slash) return;

  slash.classList.remove("play");
  void slash.offsetWidth;
  slash.classList.add("play");

  setTimeout(() => {
    slash.classList.remove("play");
  }, 320);
}

// 戰鬥紀錄，最多保留 100 行；玩家往上查看時暫停自動追蹤最新訊息
const RO_WEB_MAX_BATTLE_LOG_LINES = 100;

function isBattleLogAtBottom(logBox) {
  if (!logBox) return true;
  const threshold = 8;
  return (logBox.scrollHeight - logBox.scrollTop - logBox.clientHeight) <= threshold;
}

function getBattleLogNotice() {
  let notice = document.getElementById("battle-log-new-notice");
  const panel = document.getElementById("battle-log");
  if (!notice && panel) {
    notice = document.createElement("button");
    notice.id = "battle-log-new-notice";
    notice.type = "button";
    notice.textContent = "▼ 新訊息";
    notice.onclick = () => {
      const logBox = document.getElementById("battle-log-list");
      if (!logBox) return;
      logBox.dataset.autoScroll = "1";
      logBox.scrollTop = logBox.scrollHeight;
      notice.classList.remove("show");
      notice.dataset.count = "0";
      notice.textContent = "▼ 新訊息";
    };
    panel.appendChild(notice);
  }
  return notice;
}

function setupBattleLogScrollState(logBox) {
  if (!logBox || logBox.dataset.scrollStateReady === "1") return;
  logBox.dataset.scrollStateReady = "1";
  logBox.dataset.autoScroll = "1";

  logBox.addEventListener("scroll", () => {
    const atBottom = isBattleLogAtBottom(logBox);
    logBox.dataset.autoScroll = atBottom ? "1" : "0";
    if (atBottom) {
      const notice = getBattleLogNotice();
      if (notice) {
        notice.classList.remove("show");
        notice.dataset.count = "0";
        notice.textContent = "▼ 新訊息";
      }
    }
  });
}

function getBattleLogType(text) {
  const msg = String(text || "");
  if (/死亡|陣亡|倒下|死/.test(msg)) return "death";
  if (/稀有|★★★★|卡片|裝備掉落/.test(msg)) return "rare";
  if (/獲得道具|獲得：|取得道具|掉落|x\s*\d+|×\s*\d+/.test(msg)) return "item";
  if (/Zeny|zeny|金錢|金幣/.test(msg)) return "zeny";
  if (/Base EXP|Base經驗|Base 經驗/.test(msg)) return "base-exp";
  if (/Job EXP|Job經驗|Job 經驗/.test(msg)) return "job-exp";
  if (/對你造成|攻擊你|受到.*傷害/.test(msg)) return "monster-damage";
  if (/你對|造成\s*\d+\s*點傷害|造成.*傷害/.test(msg)) return "player-damage";
  if (/技能|配點|施放|確認配點|初始化|重置/.test(msg)) return "skill";
  return "system";
}

function addBattleLog(text, type = null) {
  const logBox = document.getElementById("battle-log-list");

  if (!logBox) {
    console.log(text);
    return;
  }

  setupBattleLogScrollState(logBox);

  const shouldAutoScroll = logBox.dataset.autoScroll !== "0" || isBattleLogAtBottom(logBox);

  const line = document.createElement("div");
  const logType = type || getBattleLogType(text);
  line.className = `log-line log-${logType}`;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  const time = document.createElement("span");
  time.className = "log-time";
  time.textContent = `[${hh}:${mm}:${ss}]`;

  const body = document.createElement("span");
  body.className = "log-text";
  body.textContent = ` ${text}`;

  line.appendChild(time);
  line.appendChild(body);
  logBox.appendChild(line);

  while (logBox.children.length > RO_WEB_MAX_BATTLE_LOG_LINES) {
    logBox.removeChild(logBox.firstChild);
  }

  if (shouldAutoScroll) {
    logBox.dataset.autoScroll = "1";
    requestAnimationFrame(() => {
      logBox.scrollTop = logBox.scrollHeight;
    });
  } else {
    const notice = getBattleLogNotice();
    if (notice) {
      const count = Number(notice.dataset.count || "0") + 1;
      notice.dataset.count = String(count);
      notice.textContent = `▼ 新訊息(${count})`;
      notice.classList.add("show");
    }
  }
}

// 陣列隨機取一個
function getRandomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// 隨機整數
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
