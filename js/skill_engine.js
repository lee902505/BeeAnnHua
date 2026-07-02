//=======================================
// SkillEngine v0.6
// 技能資料化：程式只讀 skillType，不判斷技能名稱
//=======================================

function clampSkillLevel(skill, requestedLevel) {
  if (!skill) return 0;
  const learned = getSkillLevel(skill.id);
  const max = Number(skill.maxLevel || 1);
  const requested = Number(requestedLevel || learned || 1);
  return Math.max(0, Math.min(learned, max, requested));
}

function getLevelValue(value, level, fallback = 0) {
  if (Array.isArray(value)) {
    const index = Math.max(0, Number(level || 1) - 1);
    return Number(value[index] ?? value[value.length - 1] ?? fallback);
  }
  if (value && typeof value === "object") {
    const direct = value[level] ?? value[String(level)];
    if (direct !== undefined) return Number(direct || fallback);
  }
  return Number(value ?? fallback);
}

function getSkillSpCost(skill, level) {
  return Math.max(0, Math.floor(getLevelValue(skill?.spCost, level, 0)));
}

function getSkillPower(skill, level) {
  return Math.max(100, Math.floor(getLevelValue(skill?.power, level, 100)));
}

function getSkillDuration(skill, level) {
  return Math.max(0, Math.floor(getLevelValue(skill?.duration, level, 0)));
}

function canCastSkill(skill, requestedLevel = null) {
  if (!player || !skill) return { ok: false, reason: "找不到技能" };

  const level = clampSkillLevel(skill, requestedLevel);
  if (level <= 0) return { ok: false, reason: "尚未學會技能" };

  const spCost = getSkillSpCost(skill, level);
  if (Number(player.sp || 0) < spCost) {
    return { ok: false, reason: "SP 不足" };
  }

  return { ok: true, level, spCost };
}

function paySkillCost(skill, level) {
  const spCost = getSkillSpCost(skill, level);
  player.sp = Math.max(0, Number(player.sp || 0) - spCost);
  return spCost;
}

function getSkillsByType(skillType) {
  return getCurrentJobSkills().filter(skill => skill.skillType === skillType);
}

function getLearnedSkillsByType(skillType) {
  return getSkillsByType(skillType).filter(skill => getSkillLevel(skill.id) > 0);
}

function getPassiveSkillBonusTotals() {
  const totals = {};
  if (!player || !player.learnedSkills) return totals;

  getCurrentJobSkills().forEach(skill => {
    if (skill.skillType !== "passive") return;
    if ((typeof isSkillBasic === "function" && isSkillBasic(skill)) || Number(skill.officialId ?? skill.id) === 1) return; // V0.9.43：初心者知識倍率由 getTrainingBonusTotals 統一處理，不再套 HP/SP 被動。
    const level = getSkillLevel(skill.id);
    if (level <= 0) return;

    const bonuses = skill.passiveBonuses || {};
    Object.keys(bonuses).forEach(key => {
      totals[key] = Number(totals[key] || 0) + getLevelValue(bonuses[key], level, 0);
    });
  });

  return totals;
}

function normalizeActiveBuffs() {
  if (!player) return;
  player.activeBuffs = player.activeBuffs || {};

  const now = Date.now();
  Object.keys(player.activeBuffs).forEach(skillId => {
    const buff = player.activeBuffs[skillId];
    if (!buff || Number(buff.expiresAt || 0) <= now) {
      delete player.activeBuffs[skillId];
    }
  });
}

function getActiveBuffBonusTotals() {
  const totals = {};
  if (!player) return totals;
  normalizeActiveBuffs();

  Object.values(player.activeBuffs || {}).forEach(buff => {
    const effects = buff.effects || {};
    Object.keys(effects).forEach(key => {
      totals[key] = Number(totals[key] || 0) + Number(effects[key] || 0);
    });
  });

  return totals;
}

function collectSkillEffects(skill, level) {
  const result = {};
  const effects = skill?.effects || {};
  Object.keys(effects).forEach(key => {
    result[key] = getLevelValue(effects[key], level, 0);
  });
  return result;
}

function castBuffSkill(skill, requestedLevel = null, options = {}) {
  const check = canCastSkill(skill, requestedLevel);
  if (!check.ok) return false;

  const level = check.level;
  const duration = getSkillDuration(skill, level);
  if (duration <= 0) return false;

  paySkillCost(skill, level);
  player.activeBuffs = player.activeBuffs || {};
  player.activeBuffs[skill.id] = {
    id: skill.id,
    name: skill.name,
    level,
    effects: collectSkillEffects(skill, level),
    expiresAt: Date.now() + duration
  };

  recalculatePlayerStats();
  updatePlayerUI();
  saveGame();

  if (!options.silent) {
    addBattleLog(`施放 ${skill.name} Lv${level}。`);
  }
  return true;
}

function castHealSkill(skill, requestedLevel = null) {
  const check = canCastSkill(skill, requestedLevel);
  if (!check.ok) return false;

  const level = check.level;
  paySkillCost(skill, level);

  // 先用資料表 healPower，之後可改成正式 MATK / BaseLv 公式。
  const healAmount = Math.max(1, Math.floor(getLevelValue(skill.healPower, level, 100)));
  player.hp = Math.min(player.maxHp, Number(player.hp || 0) + healAmount);

  updatePlayerUI();
  saveGame();
  addBattleLog(`施放 ${skill.name} Lv${level}，HP 恢復 ${healAmount}。`);
  return true;
}

function calculateSkillAttackDamage(skill, requestedLevel = null) {
  if (!currentMonster || !skill) return 0;
  const level = clampSkillLevel(skill, requestedLevel);
  if (level <= 0) return 0;

  const baseDamage = calculatePlayerDamage();
  const power = getSkillPower(skill, level);
  const hitCount = Math.max(1, Number(skill.hitCount || 1));
  return Math.max(1, Math.floor(baseDamage * power / 100 * hitCount));
}

function castAttackSkill(skill, requestedLevel = null) {
  const check = canCastSkill(skill, requestedLevel);
  if (!check.ok || !currentMonster) return false;

  const level = check.level;
  const damage = calculateSkillAttackDamage(skill, level);
  paySkillCost(skill, level);

  currentMonster.currentHp = Math.max(0, Number(currentMonster.currentHp || 0) - damage);
  addBattleLog(`施放 ${skill.name} Lv${level}，對 ${currentMonster.name} 造成 ${damage} 點傷害。`);

  playPlayerAttackAnimation();
  updateMonsterUI();
  playMonsterHitAnimation(currentMonster);
  showDamageNumber(damage);
  showSlashEffect();
  updatePlayerUI();
  saveGame();

  return true;
}

function getSkillTypeText(skill) {
  const map = {
    passive: "被動",
    attack: "攻擊",
    buff: "Buff",
    heal: "治癒",
    support: "支援"
  };
  return map[skill?.skillType] || "技能";
}
