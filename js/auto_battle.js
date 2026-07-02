//=======================================
// AutoBattleEngine v0.6
// 自動喝水 / 治癒 / Buff / 攻擊技能
//=======================================

function createDefaultAutoCombat() {
  return {
    hpPotion: { enabled: true, hpPercent: 50, itemId: null },
    spPotion: { enabled: false, spPercent: 30, itemId: null },
    heal: { enabled: false, skillId: null, hpPercent: 60, spPercent: 20, level: 1 },
    attack: { enabled: true, skillId: null, spPercent: 50, level: 1 },
    buffs: {}
  };
}

function normalizeAutoCombatSettings() {
  if (!player) return;
  const defaults = createDefaultAutoCombat();
  player.autoCombat = {
    ...defaults,
    ...(player.autoCombat || {})
  };
  player.autoCombat.hpPotion = { ...defaults.hpPotion, ...(player.autoCombat.hpPotion || {}) };
  player.autoCombat.spPotion = { ...defaults.spPotion, ...(player.autoCombat.spPotion || {}) };
  player.autoCombat.heal = { ...defaults.heal, ...(player.autoCombat.heal || {}) };
  player.autoCombat.attack = { ...defaults.attack, ...(player.autoCombat.attack || {}) };
  player.autoCombat.buffs = { ...(player.autoCombat.buffs || {}) };

  // 兼容 v0.5 autoPotion
  if (player.autoPotion) {
    player.autoCombat.hpPotion.enabled = player.autoPotion.hpEnabled ?? player.autoCombat.hpPotion.enabled;
    player.autoCombat.hpPotion.hpPercent = player.autoPotion.hpPercent ?? player.autoCombat.hpPotion.hpPercent;
    player.autoCombat.hpPotion.itemId = normalizeItemId(player.autoPotion.hpItemId) || player.autoCombat.hpPotion.itemId;
    player.autoCombat.spPotion.enabled = player.autoPotion.spEnabled ?? player.autoCombat.spPotion.enabled;
    player.autoCombat.spPotion.spPercent = player.autoPotion.spPercent ?? player.autoCombat.spPotion.spPercent;
    player.autoCombat.spPotion.itemId = normalizeItemId(player.autoPotion.spItemId) || player.autoCombat.spPotion.itemId;
  }
}

function getPercent(current, max) {
  if (!max || max <= 0) return 0;
  return Math.floor(Number(current || 0) * 100 / Number(max));
}

function findBestRecoveryItem(kind) {
  if (!player?.inventory) return null;
  const key = kind === "sp" ? "sp" : "hp";
  const missing = key === "hp" ? (player.maxHp - player.hp) : (player.maxSp - player.sp);

  const candidates = player.inventory
    .map(inv => ({ inv, item: getItemData(inv.id) }))
    .filter(row => row.item && Number(row.item[key] || 0) > 0 && Number(row.inv.count || 0) > 0)
    .sort((a, b) => {
      const av = Number(a.item[key] || 0);
      const bv = Number(b.item[key] || 0);
      const aWaste = Math.max(0, av - missing);
      const bWaste = Math.max(0, bv - missing);
      if (aWaste !== bWaste) return aWaste - bWaste;
      return av - bv;
    });

  return candidates[0] || null;
}

function useRecoveryItem(kind, preferredItemId = null) {
  const key = kind === "sp" ? "sp" : "hp";
  let inventoryItem = null;
  let itemData = null;

  if (preferredItemId) {
    inventoryItem = findInventoryItemById(preferredItemId);
    itemData = inventoryItem ? getItemData(inventoryItem.id) : null;
    if (!itemData || Number(itemData[key] || 0) <= 0) {
      inventoryItem = null;
      itemData = null;
    }
  }

  if (!inventoryItem || !itemData) {
    const best = findBestRecoveryItem(kind);
    if (!best) return false;
    inventoryItem = best.inv;
    itemData = best.item;
  }

  if (key === "hp") {
    player.hp = Math.min(player.maxHp, Number(player.hp || 0) + Number(itemData.hp || 0));
  } else {
    player.sp = Math.min(player.maxSp, Number(player.sp || 0) + Number(itemData.sp || 0));
  }

  inventoryItem.count -= 1;
  if (inventoryItem.count <= 0) {
    player.inventory = player.inventory.filter(item => String(item.id) !== String(inventoryItem.id));
  }

  addBattleLog(`自動使用 ${itemData.name}，${key.toUpperCase()} 恢復 ${itemData[key]}。`);
  updatePlayerUI();
  updateInventoryUI();
  saveGame();
  return true;
}

function syncAutoCombatSettingsFromUI(options = {}) {
  if (!player) return false;
  normalizeAutoCombatSettings();

  const hpEnabled = document.getElementById("autoCombatHpPotionEnabled");
  const hpPercent = document.getElementById("autoCombatHpPotionPercent");
  const hpItem = document.getElementById("autoCombatHpPotionSelect");
  const spEnabled = document.getElementById("autoCombatSpPotionEnabled");
  const spPercent = document.getElementById("autoCombatSpPotionPercent");
  const spItem = document.getElementById("autoCombatSpPotionSelect");
  const healEnabled = document.getElementById("autoCombatHealEnabled");
  const healSkill = document.getElementById("autoCombatHealSkill");
  const healLevel = document.getElementById("autoCombatHealLevel");
  const healHpPercent = document.getElementById("autoCombatHealHpPercent");
  const healSpPercent = document.getElementById("autoCombatHealSpPercent");
  const attackEnabled = document.getElementById("autoCombatAttackEnabled");
  const attackSkill = document.getElementById("autoCombatAttackSkill");
  const attackLevel = document.getElementById("autoCombatAttackLevel");
  const attackSpPercent = document.getElementById("autoCombatAttackSpPercent");

  if (hpEnabled) player.autoCombat.hpPotion.enabled = hpEnabled.checked;
  if (hpPercent) player.autoCombat.hpPotion.hpPercent = Number(hpPercent.value) || 50;
  if (hpItem) player.autoCombat.hpPotion.itemId = normalizeItemId(hpItem.value) || null;

  if (spEnabled) player.autoCombat.spPotion.enabled = spEnabled.checked;
  if (spPercent) player.autoCombat.spPotion.spPercent = Number(spPercent.value) || 30;
  if (spItem) player.autoCombat.spPotion.itemId = normalizeItemId(spItem.value) || null;

  if (healEnabled) player.autoCombat.heal.enabled = healEnabled.checked;
  if (healSkill) player.autoCombat.heal.skillId = healSkill.value || null;
  if (healLevel) player.autoCombat.heal.level = Number(healLevel.value) || 1;
  if (healHpPercent) player.autoCombat.heal.hpPercent = Number(healHpPercent.value) || 60;
  if (healSpPercent) player.autoCombat.heal.spPercent = Number(healSpPercent.value) || 20;

  if (attackEnabled) player.autoCombat.attack.enabled = attackEnabled.checked;
  if (attackSkill) player.autoCombat.attack.skillId = attackSkill.value || null;
  if (attackLevel) player.autoCombat.attack.level = Number(attackLevel.value) || 1;
  if (attackSpPercent) player.autoCombat.attack.spPercent = Number(attackSpPercent.value) || 50;

  document.querySelectorAll("[data-auto-buff-skill]").forEach(input => {
    player.autoCombat.buffs[input.dataset.autoBuffSkill] = input.checked;
  });

  if (options.save) saveGame();
  return true;
}

function updatePotionSelectOptions(select, kind, selectedId) {
  if (!select) return;
  const label = kind === "sp" ? "自動選擇 SP 藥水" : "自動選擇 HP 藥水";
  select.innerHTML = `<option value="">${label}</option>`;

  (player?.inventory || []).forEach(inv => {
    const item = getItemData(inv.id);
    if (!item) return;
    const value = kind === "sp" ? item.sp : item.hp;
    if (!value || value <= 0) return;
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.name} x${inv.count}`;
    select.appendChild(option);
  });

  if (selectedId) select.value = selectedId;
}

function fillSkillLevelSelect(select, skill, selectedLevel) {
  if (!select) return;
  select.innerHTML = "";
  if (!skill) {
    select.innerHTML = '<option value="1">Lv 1</option>';
    return;
  }
  const learned = Math.max(1, getSkillLevel(skill.id));
  for (let lv = 1; lv <= learned; lv++) {
    const option = document.createElement("option");
    option.value = lv;
    option.textContent = `Lv ${lv}`;
    select.appendChild(option);
  }
  select.value = Math.min(Number(selectedLevel || learned), learned);
}

function updateAutoCombatUI() {
  if (!player) return;
  normalizeAutoCombatSettings();

  const cfg = player.autoCombat;
  const hpEnabled = document.getElementById("autoCombatHpPotionEnabled");
  const hpPercent = document.getElementById("autoCombatHpPotionPercent");
  const hpItem = document.getElementById("autoCombatHpPotionSelect");
  const spEnabled = document.getElementById("autoCombatSpPotionEnabled");
  const spPercent = document.getElementById("autoCombatSpPotionPercent");
  const spItem = document.getElementById("autoCombatSpPotionSelect");

  if (hpEnabled) hpEnabled.checked = !!cfg.hpPotion.enabled;
  if (hpPercent) hpPercent.value = cfg.hpPotion.hpPercent;
  if (spEnabled) spEnabled.checked = !!cfg.spPotion.enabled;
  if (spPercent) spPercent.value = cfg.spPotion.spPercent;
  updatePotionSelectOptions(hpItem, "hp", cfg.hpPotion.itemId);
  updatePotionSelectOptions(spItem, "sp", cfg.spPotion.itemId);

  const healSkills = getLearnedSkillsByType("heal");
  const attackSkills = getLearnedSkillsByType("attack");
  const buffSkills = getLearnedSkillsByType("buff");

  if (cfg.heal.skillId && !healSkills.some(skill => String(typeof getSkillStorageKey === "function" ? getSkillStorageKey(skill) : skill.id) === String(cfg.heal.skillId))) cfg.heal.skillId = null;
  if (cfg.attack.skillId && !attackSkills.some(skill => String(typeof getSkillStorageKey === "function" ? getSkillStorageKey(skill) : skill.id) === String(cfg.attack.skillId))) cfg.attack.skillId = null;

  const healEnabled = document.getElementById("autoCombatHealEnabled");
  const healSkill = document.getElementById("autoCombatHealSkill");
  const healLevel = document.getElementById("autoCombatHealLevel");
  const healHpPercent = document.getElementById("autoCombatHealHpPercent");
  const healSpPercent = document.getElementById("autoCombatHealSpPercent");

  if (healEnabled) healEnabled.checked = !!cfg.heal.enabled;
  if (healHpPercent) healHpPercent.value = cfg.heal.hpPercent;
  if (healSpPercent) healSpPercent.value = cfg.heal.spPercent;
  if (healSkill) {
    healSkill.innerHTML = healSkills.length ? "" : '<option value="">尚未學會治癒技能</option>';
    healSkills.forEach(skill => {
      const option = document.createElement("option");
      option.value = (typeof getSkillStorageKey === "function" ? getSkillStorageKey(skill) : String(skill.id));
      option.textContent = skill.name;
      healSkill.appendChild(option);
    });
    if (cfg.heal.skillId) healSkill.value = cfg.heal.skillId;
  }
  const selectedHeal = getSkillDataById(healSkill?.value || cfg.heal.skillId);
  fillSkillLevelSelect(healLevel, selectedHeal, cfg.heal.level);

  const attackEnabled = document.getElementById("autoCombatAttackEnabled");
  const attackSkill = document.getElementById("autoCombatAttackSkill");
  const attackLevel = document.getElementById("autoCombatAttackLevel");
  const attackSpPercent = document.getElementById("autoCombatAttackSpPercent");

  if (attackEnabled) attackEnabled.checked = !!cfg.attack.enabled;
  if (attackSpPercent) attackSpPercent.value = cfg.attack.spPercent;
  if (attackSkill) {
    attackSkill.innerHTML = attackSkills.length ? "" : '<option value="">尚未學會攻擊技能</option>';
    attackSkills.forEach(skill => {
      const option = document.createElement("option");
      option.value = (typeof getSkillStorageKey === "function" ? getSkillStorageKey(skill) : String(skill.id));
      option.textContent = skill.name;
      attackSkill.appendChild(option);
    });
    if (cfg.attack.skillId) attackSkill.value = cfg.attack.skillId;
  }
  const selectedAttack = getSkillDataById(attackSkill?.value || cfg.attack.skillId);
  fillSkillLevelSelect(attackLevel, selectedAttack, cfg.attack.level);

  const buffBox = document.getElementById("autoCombatBuffList");
  if (buffBox) {
    buffBox.innerHTML = "";
    if (!buffSkills.length) {
      buffBox.innerHTML = '<div class="auto-empty">尚未學會 Buff 技能</div>';
    } else {
      buffSkills.forEach(skill => {
        if (cfg.buffs[(typeof getSkillStorageKey === "function" ? getSkillStorageKey(skill) : String(skill.id))] === undefined) {
          cfg.buffs[(typeof getSkillStorageKey === "function" ? getSkillStorageKey(skill) : String(skill.id))] = !!skill.ai?.defaultMaintain;
        }
        const label = document.createElement("label");
        label.className = "auto-buff-row";
        label.innerHTML = `<input type="checkbox" data-auto-buff-skill="${typeof getSkillStorageKey === "function" ? getSkillStorageKey(skill) : String(skill.id)}" ${cfg.buffs[(typeof getSkillStorageKey === "function" ? getSkillStorageKey(skill) : String(skill.id))] ? "checked" : ""}> ${skill.name} Lv${getSkillLevel(skill.id)}`;
        buffBox.appendChild(label);
      });
    }
  }
}

function saveAutoCombatSettings() {
  syncAutoCombatSettingsFromUI({ save: true });
  updateAutoCombatUI();
  addBattleLog("自動戰鬥設定已更新。");
}

function autoUsePotion() {
  syncAutoCombatSettingsFromUI({ save: false });
  normalizeAutoCombatSettings();
  const cfg = player.autoCombat;

  if (cfg.hpPotion.enabled && getPercent(player.hp, player.maxHp) <= Number(cfg.hpPotion.hpPercent || 50)) {
    useRecoveryItem("hp", cfg.hpPotion.itemId);
  }

  if (cfg.spPotion.enabled && getPercent(player.sp, player.maxSp) <= Number(cfg.spPotion.spPercent || 30)) {
    useRecoveryItem("sp", cfg.spPotion.itemId);
  }
}

function shouldCastBySp(minPercent) {
  return getPercent(player.sp, player.maxSp) >= Number(minPercent || 0);
}

function tryAutoHeal() {
  const cfg = player.autoCombat?.heal;
  if (!cfg?.enabled || !cfg.skillId) return false;
  if (getPercent(player.hp, player.maxHp) > Number(cfg.hpPercent || 60)) return false;
  if (!shouldCastBySp(cfg.spPercent || 20)) return false;

  const skill = getSkillDataById(cfg.skillId);
  if (!skill || skill.skillType !== "heal") return false;
  return castHealSkill(skill, cfg.level);
}

function tryAutoBuffs() {
  const cfg = player.autoCombat?.buffs || {};
  let casted = false;
  normalizeActiveBuffs();

  getLearnedSkillsByType("buff").forEach(skill => {
    if (!cfg[skill.id]) return;
    const current = player.activeBuffs?.[skill.id];
    const remaining = current ? Number(current.expiresAt || 0) - Date.now() : 0;
    if (remaining > 3000) return;
    if (castBuffSkill(skill, getSkillLevel(skill.id), { silent: false })) {
      casted = true;
    }
  });

  return casted;
}

function getAutoAttackSkill() {
  const cfg = player.autoCombat?.attack;
  if (!cfg?.enabled || !cfg.skillId) return null;
  if (!shouldCastBySp(cfg.spPercent || 50)) return null;

  const skill = getSkillDataById(cfg.skillId);
  if (!skill || skill.skillType !== "attack") return null;

  const check = canCastSkill(skill, cfg.level);
  if (!check.ok) return null;
  return { skill, level: check.level };
}

function runAutoCombatTick(monster) {
  if (!player || !monster) return { action: "normal" };
  syncAutoCombatSettingsFromUI({ save: false });
  normalizeAutoCombatSettings();

  autoUsePotion();
  if (tryAutoHeal()) return { action: "utility" };
  tryAutoBuffs();

  const attack = getAutoAttackSkill();
  if (attack) return { action: "attackSkill", ...attack };
  return { action: "normal" };
}
