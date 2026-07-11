//=======================================
// SkillEngine v0.9.82 - RA common CombatDamagePipeline
// V0.9.80ZP：新增十字軍信任、盾擊、聖十字攻擊、長矛加速與通用攻擊狀態 Runtime。
// Skill Core 僅保存官方中繼資料；缺少 Runtime Profile 的技能會明確標示 pending，不再回退舊公式。
//=======================================

function clampSkillLevel(skill, requestedLevel) {
  if (!skill) return 0;
  const learned = getSkillLevel(skill.id);
  const max = Number(skill.maxLevel || 1);
  const requested = Number(requestedLevel || learned || 1);
  return Math.max(0, Math.min(learned, max, requested));
}

function getLevelValue(value, level, fallback = 0) {
  if (value === "level") return Number(level || fallback);
  if (Array.isArray(value)) {
    const index = Math.max(0, Number(level || 1) - 1);
    return Number(value[index] ?? value[value.length - 1] ?? fallback);
  }
  if (value && typeof value === "object") {
    const direct = value[level] ?? value[String(level)];
    if (direct !== undefined) return Number(direct ?? fallback);
  }
  return Number(value ?? fallback);
}

function getSkillRuntimeProfile(skillOrId) {
  const id = String(typeof skillOrId === "object" ? (skillOrId.officialId ?? skillOrId.id) : skillOrId);
  return skillsData?.runtimeProfiles?.[id] || null;
}

function isSkillRuntimeReady(skillOrId) {
  const profile = getSkillRuntimeProfile(skillOrId);
  return !!(profile && profile.handler && profile.handler !== "pending");
}

function getSkillRuntimeStatusText(skillOrId) {
  const profile = getSkillRuntimeProfile(skillOrId);
  if (!profile) return "尚未建立 Runtime Profile";
  if (!profile.handler || profile.handler === "pending") return "Runtime Profile 尚未完成";
  return "Runtime 已完成";
}

function getRaLevelValue(value, level, fallback = 0, field = null) {
  if (Array.isArray(value)) {
    const row = value.find(v => Number(v?.Level) === Number(level)) || value[Math.max(0, Number(level)-1)] || value[value.length-1];
    if (row && typeof row === "object") {
      const keys = field ? [field] : ["Amount","Time","Count","Area","Value"];
      for (const k of keys) if (row[k] !== undefined) return Number(row[k] || fallback);
    }
  }
  return getLevelValue(value, level, fallback);
}

function getRuntimeSkillSpCost(skill, level) {
  const profile = getSkillRuntimeProfile(skill);
  let baseCost = 0;
  if (profile?.spCost !== undefined) baseCost = Math.max(0, Math.floor(getLevelValue(profile.spCost, level, 0)));
  else if (skill?.requires?.SpCost !== undefined) baseCost = Math.max(0, Math.floor(getRaLevelValue(skill.requires.SpCost, level, 0, "Amount")));
  else baseCost = Math.max(0, Math.floor(getLevelValue(skill?.spCost, level, 0)));
  const passive = typeof getPassiveSkillBonusTotals === "function" ? getPassiveSkillBonusTotals() : {};
  const reduction = Math.max(0, Math.min(100, Number(passive.spCostReductionRate || 0)));
  return Math.max(0, Math.floor(baseCost * (100 - reduction) / 100));
}

function getRuntimeHitCount(skill, level) {
  const profile = getSkillRuntimeProfile(skill);
  if (!profile) return null;
  if (profile.hitCount !== undefined) return Math.max(1, getLevelValue(profile.hitCount, level, 1));
  return Math.max(1, getRaLevelValue(skill?.hitCount, level, 1, "Count"));
}

function getRuntimeDuration(skill, level) {
  const profile = getSkillRuntimeProfile(skill);
  if (!profile) return 0;
  if (profile.duration !== undefined) return Math.max(0, Math.floor(getLevelValue(profile.duration, level, 0)));
  if (profile.durationFromSkill === true) return Math.max(0, Math.floor(getLevelValue(skill?.duration, level, 0)));
  return 0;
}


function normalizeRuntimeCombatState() {
  if (!player) return;
  player.runtimeState = player.runtimeState || {};
  player.mountState = player.mountState || { mounted: false, type: null };
  const now = Date.now();
  Object.keys(player.runtimeState).forEach(key => {
    const state = player.runtimeState[key];
    if (state && Number(state.expiresAt || 0) > 0 && Number(state.expiresAt) <= now) delete player.runtimeState[key];
  });
}

function isPlayerMounted() {
  normalizeRuntimeCombatState();
  return !!player?.mountState?.mounted;
}

function canPlayerUseMount() {
  return Number(typeof getSkillLevel === "function" ? getSkillLevel(63) : 0) > 0;
}

function setPlayerMounted(mounted, mountType = "peco") {
  if (!player) return false;
  normalizeRuntimeCombatState();
  if (mounted && !canPlayerUseMount()) {
    if (typeof addBattleLog === "function") addBattleLog("尚未學會騎乘術。");
    return false;
  }
  player.mountState = { mounted: !!mounted, type: mounted ? mountType : null };
  if (typeof recalculatePlayerStats === "function") recalculatePlayerStats();
  if (typeof updatePlayerUI === "function") updatePlayerUI();
  if (typeof saveGame === "function") saveGame();
  // 未來坐騎圖加入後，只需在這個單一入口切換 Character Atlas / Body。
  if (typeof window.onROWebMountStateChanged === "function") window.onROWebMountStateChanged(player.mountState);
  if (typeof addBattleLog === "function") addBattleLog(mounted ? "已進入騎乘狀態。" : "已解除騎乘狀態。");
  return true;
}

function togglePlayerMount(mountType = "peco") {
  return setPlayerMounted(!isPlayerMounted(), mountType);
}

function getMonsterRuntimeState(monster = currentMonster) {
  if (!monster) return null;
  monster.runtimeState = monster.runtimeState || {};
  const now = Date.now();
  Object.keys(monster.runtimeState).forEach(key => {
    const state = monster.runtimeState[key];
    if (state && Number(state.expiresAt || 0) > 0 && Number(state.expiresAt) <= now) delete monster.runtimeState[key];
  });
  return monster.runtimeState;
}

function getMonsterRuntimeBonuses(monster = currentMonster) {
  const totals = {};
  const states = getMonsterRuntimeState(monster) || {};
  Object.values(states).forEach(state => {
    Object.entries(state.effects || {}).forEach(([key,value]) => totals[key] = Number(totals[key] || 0) + Number(value || 0));
  });
  return totals;
}

function castMonsterDebuffSkill(skill, requestedLevel = null) {
  const check = canCastSkill(skill, requestedLevel, ["monster_debuff"]);
  if (!check.ok) return reportPendingRuntime(skill, check.reason);
  if (!currentMonster) return false;
  const { level, profile } = check;
  const targetBaseLv = Number(currentMonster.level || currentMonster.baseLevel || 1);
  const casterBaseLv = Number(player.baseLevel || 1);
  const chance = Math.max(0, Math.min(100, 70 + 3 * level + casterBaseLv - targetBaseLv));
  paySkillCost(skill, level);
  if (Math.random() * 100 >= chance) {
    addBattleLog(`${skill.name} 失敗。`);
    updatePlayerUI(); saveGame();
    return true;
  }
  const state = getMonsterRuntimeState(currentMonster);
  state[skill.id] = {
    id: skill.id, name: skill.name, level,
    effects: collectRuntimeEffects(profile, level),
    expiresAt: Date.now() + getRuntimeDuration(skill, level)
  };
  if (profile.forceAggro) currentMonster.aiState = "CHASE";
  addBattleLog(`施放 ${skill.name} Lv${level} 成功。`);
  updateMonsterUI(); updatePlayerUI(); saveGame();
  return true;
}

function castCounterStanceSkill(skill, requestedLevel = null) {
  const check = canCastSkill(skill, requestedLevel, ["counter_stance"]);
  if (!check.ok) return reportPendingRuntime(skill, check.reason);
  const { level, profile } = check;
  paySkillCost(skill, level);
  normalizeRuntimeCombatState();
  player.runtimeState.counterStance = {
    skillId: skill.id, level,
    ratio: Number(profile.counterRatio || 100),
    critical: profile.critical === true,
    expiresAt: Date.now() + getRuntimeDuration(skill, level)
  };
  addBattleLog(`進入 ${skill.name} 等待狀態。`);
  updatePlayerUI(); saveGame();
  return true;
}

function consumeCounterStance(monster = currentMonster) {
  normalizeRuntimeCombatState();
  const state = player?.runtimeState?.counterStance;
  if (!state || Number(state.expiresAt || 0) <= Date.now() || !monster) return false;
  delete player.runtimeState.counterStance;
  const base = Math.max(1, Number(typeof calculatePlayerDamage === "function" ? calculatePlayerDamage() : player.atk || 1));
  const damage = Math.max(1, Math.floor(base * Number(state.ratio || 100) / 100 * (state.critical ? 1.4 : 1)));
  monster.currentHp = Math.max(0, Number(monster.currentHp || 0) - damage);
  addBattleLog(`反擊成功，對 ${monster.name} 造成 ${damage} 點傷害。`);
  if (typeof playROStudioPlayerMotion === "function") playROStudioPlayerMotion("attack");
  if (typeof updateMonsterUI === "function") updateMonsterUI();
  if (typeof showDamageNumber === "function") showDamageNumber(damage);
  return true;
}

function getEquippedWeaponTypeRuntime() {
  const weaponId = player?.equipment?.weapon;
  if (!weaponId) return "fist";
  const item = typeof getItemData === "function" ? getItemData(weaponId) : null;
  return String(item?.weaponType || item?.subType || "other");
}

function hasEquippedShieldRuntime() {
  return !!player?.equipment?.shield;
}

function applyAttackRuntimeStatus(profile, level, monster = currentMonster) {
  if (!profile?.status || !monster) return false;
  const chance = Math.max(0, Math.min(100, getLevelValue(profile.statusChancePercent, level, 0)));
  const duration = Math.max(0, Number(getLevelValue(profile.statusDuration, level, 0)));
  if (window.StatusManager) {
    const result = window.StatusManager.apply(monster, profile.status, { chancePercent: chance, durationMs: duration, level, allowBoss: profile.statusAffectsBoss === true });
    if (result.applied) addBattleLog(`${monster.name} 陷入 ${profile.status} 狀態。`);
    return result.applied;
  }
  return false;
}

function canCastSkill(skill, requestedLevel = null, expectedHandlers = null) {
  if (!player || !skill) return { ok: false, reason: "找不到技能" };
  const level = clampSkillLevel(skill, requestedLevel);
  if (level <= 0) return { ok: false, reason: "尚未學會技能" };
  const profile = getSkillRuntimeProfile(skill);
  if (!profile?.handler || profile.handler === "pending") return { ok: false, reason: "此技能 Runtime 尚未完成" };
  if (Array.isArray(expectedHandlers) && !expectedHandlers.includes(profile.handler)) {
    return { ok: false, reason: `Runtime 類型不符：${profile.handler}` };
  }
  if (profile.requiresMounted === true && !isPlayerMounted()) return { ok: false, reason: "必須在騎乘狀態使用" };
  if (profile.requiresShield === true && !hasEquippedShieldRuntime()) return { ok: false, reason: "必須裝備盾牌" };
  // RO_WEB: ignore Hiding/combo/stance activation prerequisites; preserve combat result only.
  if (Array.isArray(profile.weaponTypes) && profile.weaponTypes.length > 0) {
    const wt = getEquippedWeaponTypeRuntime().toLowerCase();
    const allowed = profile.weaponTypes.map(v => String(v).toLowerCase());
    if (!allowed.some(v => wt.includes(v) || v.includes(wt))) return { ok: false, reason: "目前武器類型不符合技能需求" };
  }
  const spCost = getRuntimeSkillSpCost(skill, level);
  if (Number(player.sp || 0) < spCost) return { ok: false, reason: "SP 不足" };
  return { ok: true, level, spCost, profile };
}

function paySkillCost(skill, level) {
  const spCost = getRuntimeSkillSpCost(skill, level);
  player.sp = Math.max(0, Number(player.sp || 0) - spCost);
  return spCost;
}

function reportPendingRuntime(skill, reason = null) {
  const text = reason || getSkillRuntimeStatusText(skill);
  if (typeof addBattleLog === "function") addBattleLog(`${skill?.name || "技能"}：${text}。`);
  console.warn("[Skill Runtime Pending]", skill?.officialId ?? skill?.id, skill?.name, text);
  return false;
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
    if ((typeof isSkillBasic === "function" && isSkillBasic(skill)) || Number(skill.officialId ?? skill.id) === 1) return;
    const level = getSkillLevel(skill.id);
    if (level <= 0) return;
    const profile = getSkillRuntimeProfile(skill);
    if (profile?.handler !== "passive") return;
    if (profile.requiresMounted === true && !isPlayerMounted()) return;
    if (Array.isArray(profile.weaponTypes) && profile.weaponTypes.length) {
      const currentWeaponType = String(typeof getCurrentWeaponType === "function" ? getCurrentWeaponType() : (player?.weaponType || "fist")).toLowerCase();
      const allowedWeaponTypes = profile.weaponTypes.map(value => String(value).toLowerCase());
      if (!allowedWeaponTypes.some(value => currentWeaponType.includes(value) || value.includes(currentWeaponType))) return;
    }
    const bonuses = profile.passiveBonuses || {};
    if (profile.cartAtkRatePerLevel) totals.atkRate = Number(totals.atkRate || 0) + Math.min(10, Number(profile.cartAtkRatePerLevel) * level);
    Object.keys(bonuses).forEach(key => {
      totals[key] = Number(totals[key] || 0) + getLevelValue(bonuses[key], level, 0);
    });
    // RA TF_MISS: thief second-job branches receive 4 FLEE per level instead of 3.
    if (profile.conditionalJobBonus?.thiefSecondJobFleePerLevel) {
      const jobKey = String(player?.jobKey || "").toLowerCase();
      const thiefSecondJobTokens = ["assassin", "rogue", "stalker", "shadow_chaser", "guillotine_cross", "abyss_chaser"];
      if (thiefSecondJobTokens.some(token => jobKey.includes(token))) {
        totals.fleeFlat = Number(totals.fleeFlat || 0) + Number(profile.conditionalJobBonus.thiefSecondJobFleePerLevel) * level;
      }
    }
  });
  return totals;
}

function getPassiveTargetDamageBonus(target) {
  if (!player || !target) return 0;
  let total = 0;
  const targetRace = String(target.race || "").toLowerCase();
  const targetElement = String(target.element || target.defElement || "").toLowerCase();
  getCurrentJobSkills().forEach(skill => {
    if (skill.skillType !== "passive") return;
    const level = getSkillLevel(skill.id);
    if (level <= 0) return;
    const profile = getSkillRuntimeProfile(skill);
    if (profile?.handler !== "passive" || !profile.conditionalDamage) return;
    const rule = profile.conditionalDamage;
    const raceMatch = (rule.races || []).some(v => String(v).toLowerCase() === targetRace);
    const elementMatch = (rule.elements || []).some(v => String(v).toLowerCase() === targetElement);
    if (!raceMatch && !elementMatch) return;
    if (rule.formula === "demon_bane") total += Math.floor(level * (Number(player.baseLevel || 1) / 20 + 3));
    else total += Number(rule.flatAtkPerLevel || 0) * level;
  });
  return Math.max(0, Math.floor(total));
}

function normalizeActiveBuffs() {
  if (!player) return;
  player.activeBuffs = player.activeBuffs || {};
  const now = Date.now();
  Object.keys(player.activeBuffs).forEach(skillId => {
    const buff = player.activeBuffs[skillId];
    if (!buff || Number(buff.expiresAt || 0) <= now) delete player.activeBuffs[skillId];
  });
}

function getActiveBuffBonusTotals() {
  const totals = {};
  if (!player) return totals;
  normalizeActiveBuffs();
  Object.values(player.activeBuffs || {}).forEach(buff => {
    const effects = buff.effects || {};
    Object.keys(effects).forEach(key => { totals[key] = Number(totals[key] || 0) + Number(effects[key] || 0); });
  });
  return totals;
}

function collectRuntimeEffects(profile, level) {
  const result = {};
  const effects = profile?.effects || {};
  Object.keys(effects).forEach(key => { result[key] = getLevelValue(effects[key], level, 0); });
  return result;
}

function castBuffSkill(skill, requestedLevel = null, options = {}) {
  const check = canCastSkill(skill, requestedLevel, ["buff"]);
  if (!check.ok) return reportPendingRuntime(skill, check.reason);
  const { level, profile } = check;
  const duration = getRuntimeDuration(skill, level);
  if (duration <= 0) return reportPendingRuntime(skill, "Runtime 缺少有效持續時間");
  paySkillCost(skill, level);
  player.activeBuffs = player.activeBuffs || {};
  player.activeBuffs[skill.id] = {
    id: skill.id, name: skill.name, level,
    effects: collectRuntimeEffects(profile, level),
    remainingHits: profile.hitLimit !== undefined ? Number(profile.hitLimit) : null,
    expiresAt: Date.now() + duration
  };
  recalculatePlayerStats(); updatePlayerUI(); saveGame();
  if (!options.silent) addBattleLog(`施放 ${skill.name} Lv${level}。`);
  return true;
}

function castHealSkill(skill, requestedLevel = null) {
  const check = canCastSkill(skill, requestedLevel, ["heal", "heal_fixed"]);
  if (!check.ok) return reportPendingRuntime(skill, check.reason);
  const { level, profile } = check;
  paySkillCost(skill, level);
  if (typeof playROStudioPlayerMotion === "function") playROStudioPlayerMotion(skill?.actionMotion || "cast");
  const derived = typeof calculateDerivedPlayerStats === "function" ? calculateDerivedPlayerStats() : null;
  let healAmount = 0;
  if (profile.handler === "heal" && profile.formula === "renewal_heal") {
    const totalInt = Number(derived?.stats?.int || player?.stats?.int || 1);
    const baseLv = Number(player?.baseLevel || 1);
    const matk = Number(derived?.matk || 0);
    healAmount = Math.max(1, Math.floor(((baseLv + totalInt) / 5) * 30 * level / 10 + matk));
  } else if (profile.handler === "heal_fixed") {
    healAmount = Math.max(1, Math.floor(getLevelValue(profile.heal, level, 1)));
  } else {
    return reportPendingRuntime(skill, "治療公式尚未實作");
  }
  player.hp = Math.min(player.maxHp, Number(player.hp || 0) + healAmount);
  updatePlayerUI(); saveGame(); addBattleLog(`施放 ${skill.name} Lv${level}，HP 恢復 ${healAmount}。`);
  return true;
}

function calculateSkillAttackDamage(skill, requestedLevel = null, target = currentMonster, combatOptions = {}) {
  if (!target || !skill) return null;
  const level = clampSkillLevel(skill, requestedLevel);
  if (level <= 0) return null;
  const profile = getSkillRuntimeProfile(skill);
  if (!profile || !["physical_attack", "physical_attack_size_hits", "physical_attack_formula", "physical_charge", "magic_multihit"].includes(profile.handler)) return null;
  const derived = typeof calculateDerivedPlayerStats === "function" ? calculateDerivedPlayerStats() : null;
  const hitMeta = window.MultiHitResolver ? window.MultiHitResolver.normalize(profile, level) : null;
  let hitCount = hitMeta ? hitMeta.damageHitCount : getRuntimeHitCount(skill, level);
  if (profile.formula === "renewal_chain_combo" && getEquippedWeaponTypeRuntime().toLowerCase().includes("knuckle")) hitCount = 6;
  if (profile.handler === "physical_attack_size_hits") {
    const rawSize = String(target?.size || target?.Size || "medium").toLowerCase();
    const sizeKey = rawSize.includes("small") || rawSize === "0" ? "small" : (rawSize.includes("large") || rawSize === "2" ? "large" : "medium");
    hitCount = Math.max(1, Number(profile.sizeHitCount?.[sizeKey] || 1));
  }
  if (!hitCount) return null;
  if (profile.handler === "magic_multihit") {
    const result = window.CombatDamagePipeline?.resolveMagicSkill(profile, level, target, { ratio: Number(profile.matkRatioPerHit || 100), hits: hitCount, skipHitCheck: true, criticalResult: combatOptions.criticalResult });
    return result ? Math.max(1, result.damage) : null;
  }
  let ratio = profile.ratio === undefined ? null : Math.max(1, getLevelValue(profile.ratio, level, 100));
  if (profile.formula === "renewal_brandish_spear") {
    const totalStr = Number(derived?.stats?.str || player?.stats?.str || 1);
    ratio = 400 + 100 * level + totalStr * 3;
  }
  if (profile.formula === "renewal_holy_cross") {
    const wt = getEquippedWeaponTypeRuntime().toLowerCase();
    const twoHandSpear = wt.includes("twohandspear") || wt.includes("2hspear");
    ratio = 100 + (twoHandSpear ? 70 : 35) * level;
  }
  if (profile.formula === "renewal_chain_combo") {
    const wt = getEquippedWeaponTypeRuntime().toLowerCase();
    ratio = 250 + 50 * level;
    if (wt.includes("knuckle")) ratio *= 2;
  }
  if (profile.formula === "renewal_combo_finish") {
    const totalStr = Number(derived?.stats?.str || player?.stats?.str || 1);
    ratio = 550 + 50 * level + totalStr;
  }
  if (ratio === null) return null;
  const totalRatio = ratio * Math.max(1, hitCount);
  const result = window.CombatDamagePipeline?.resolvePhysicalSkill(profile, level, target, { ratio: totalRatio, skipHitCheck: true, criticalResult: combatOptions.criticalResult });
  return result ? Math.max(1, result.damage) : null;
}

function getRuntimeCombatCandidates() {
  if (Array.isArray(window.activeMonsters)) return window.activeMonsters.filter(Boolean);
  if (Array.isArray(window.mapMonsters)) return window.mapMonsters.filter(Boolean);
  return currentMonster ? [currentMonster] : [];
}

function resolveRuntimeSkillTargets(profile, primaryTarget) {
  const targeting = profile?.targeting || profile?.area || null;
  if (!targeting || !window.TargetingResolver) return primaryTarget ? [primaryTarget] : [];
  const origin = (targeting.origin === "self") ? player : primaryTarget;
  const options = {
    shape: targeting.shape || "circle",
    rangeCells: Number(targeting.radius ?? targeting.rangeCells ?? profile.splashRange ?? 1),
    maxTargets: Number(targeting.maxTargets || 999),
    widthCells: Number(targeting.widthCells || 1),
    halfAngleRadians: Number(targeting.halfAngleRadians || Math.PI / 4)
  };
  const targets = window.TargetingResolver.collect(origin, getRuntimeCombatCandidates(), options);
  if (primaryTarget && !targets.includes(primaryTarget)) targets.unshift(primaryTarget);
  return targets;
}

function castAttackSkill(skill, requestedLevel = null, options = {}) {
  const check = canCastSkill(skill, requestedLevel, ["physical_attack", "physical_attack_size_hits", "physical_attack_formula", "physical_charge", "magic_multihit"]);
  if (!check.ok) return reportPendingRuntime(skill, check.reason);
  if (!currentMonster) return false;
  const skillRange = typeof getSkillRangePx === "function" ? getSkillRangePx(skill) : null;
  if (typeof canAttackMonsterByRange === "function" && !canAttackMonsterByRange(currentMonster, skillRange)) {
    if (typeof movePlayerTowardMonster === "function") movePlayerTowardMonster(currentMonster, skillRange);
    addBattleLog(`${skill.name} 距離不足，正在靠近目標。`); return false;
  }
  const level = check.level, profile = check.profile;
  const hitMeta = window.MultiHitResolver ? window.MultiHitResolver.normalize(profile, level) : {damageHitCount:1,visualHitCount:1,statusProcMode:"once",hitCheckMode:"once",criticalCheckMode:"once"};
  const isMagic = profile.handler === "magic_multihit";
  const targets = resolveRuntimeSkillTargets(profile, currentMonster);
  if (!targets.length) return false;
  paySkillCost(skill, level);
  if (profile.handler === "physical_charge" && profile.moveAdjacentToTarget && typeof movePlayerAdjacentToMonster === "function") movePlayerAdjacentToMonster(currentMonster);
  let totalDamage = 0, hitTargets = 0, missedTargets = 0;
  for (const target of targets) {
    if (!target || Number(target.currentHp || 0) <= 0) continue;
    const canPerfectDodge = !isMagic && profile.canPerfectDodge === true;
    if (!options.skipHitCheck && canPerfectDodge && window.PerfectDodgeResolver?.resolve(target).dodged) { missedTargets++; continue; }
    const hitMode = profile.hitMode || (profile.alwaysHit ? "always_hit" : "normal");
    if (!options.skipHitCheck && !isMagic && window.HitResolver && !window.HitResolver.resolve(player,target,{hitMode,alwaysHit:profile.alwaysHit,perfectHit:profile.perfectHit,ignoreFlee:profile.ignoreFlee}).hit) { missedTargets++; continue; }
    const critMode = profile.criticalMode || "never";
    const crit = !isMagic && window.CriticalResolver ? window.CriticalResolver.resolve(player,target,{criticalMode:critMode,criticalRateBonus:profile.criticalRateBonus,criticalRateMultiplier:profile.criticalRateMultiplier,criticalMultiplier:profile.criticalMultiplier}) : {critical:false,multiplier:1};
    let damage = calculateSkillAttackDamage(skill, level, target, { criticalResult: crit });
    if (damage === null) return reportPendingRuntime(skill, "攻擊公式尚未實作");
    const parts = window.MultiHitResolver ? window.MultiHitResolver.split(damage,hitMeta.damageHitCount) : [damage];
    let dealt = 0;
    for (let i=0;i<parts.length;i++) {
      const part = Math.min(Number(target.currentHp||0),Math.max(0,parts[i]));
      target.currentHp = Math.max(0,Number(target.currentHp||0)-part); dealt += part;
      if (hitMeta.statusProcMode === "per_hit") applyAttackRuntimeStatus(profile,level,target);
      if (target.currentHp <= 0) break;
    }
    if (hitMeta.statusProcMode !== "per_hit") applyAttackRuntimeStatus(profile,level,target);
    if (Number(profile.knockbackCells||0)>0) window.MovementEffectResolver?.knockback(target,player,Number(profile.knockbackCells));
    totalDamage += dealt; hitTargets++;
    if (typeof playMonsterHitAnimation === "function") playMonsterHitAnimation(target);
    if (typeof showDamageNumber === "function") showDamageNumber(dealt);
  }
  if (!hitTargets) addBattleLog(`施放 ${skill.name} Lv${level}，但是 Miss！`);
  else addBattleLog(`施放 ${skill.name} Lv${level}，命中 ${hitTargets} 個目標，共造成 ${totalDamage} 點傷害${missedTargets?`，${missedTargets} 個目標閃避`:""}。`);
  if (typeof playROStudioPlayerMotion === "function") playROStudioPlayerMotion("cast"); else playPlayerAttackAnimation();
  updateMonsterUI(); if(hitTargets&&typeof showSlashEffect==='function')showSlashEffect(); updatePlayerUI(); saveGame();
  return true;
}

function getSkillTypeText(skill) {
  const map = { passive:"被動", attack:"攻擊", buff:"Buff", heal:"治癒", support:"支援" };
  return map[skill?.skillType] || "技能";
}
