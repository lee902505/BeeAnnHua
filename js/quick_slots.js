//=======================================
// QuickSlotManager v0.9.35
// 玩家手動拖曳制：技能 / 補品 / 普通攻擊都由玩家放到 1~0。
//=======================================

const QUICK_SLOT_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const QUICK_SLOT_MAX = 10;

function normalizeQuickSlotData() {
  if (!player) return;
  player.quickSlots = Array.isArray(player.quickSlots) ? player.quickSlots.slice(0, QUICK_SLOT_MAX) : [];
  while (player.quickSlots.length < QUICK_SLOT_MAX) player.quickSlots.push({ type: "empty" });
}

function getQuickSlotIconForBasicAttack() {
  const weaponId = player?.equipment?.weapon || 1101;
  const weapon = typeof getItemData === "function" ? getItemData(weaponId) : null;
  return weapon?.icon || "images/items/1101.webp";
}

function sanitizeQuickSlot(slot) {
  if (!slot || slot.type === "empty") return { type: "empty" };

  if (slot.type === "basic") {
    return { type: "basic", name: "普攻", icon: getQuickSlotIconForBasicAttack(), hint: "普通攻擊" };
  }

  if (slot.type === "skill") {
    const skill = typeof getSkillDataById === "function" ? getSkillDataById(slot.id) : null;
    const level = skill && typeof getSkillLevel === "function" ? getSkillLevel(skill.id) : 0;
    if (!skill || level <= 0 || !["attack", "buff", "heal", "support"].includes(skill.skillType)) return { type: "empty" };
    return {
      type: "skill",
      id: skill.id,
      name: skill.name,
      icon: skill.icon || (skill.officialId ? `images/skills/${skill.officialId}.png` : ""),
      level,
      skillType: skill.skillType,
      hint: `${skill.name} Lv${level}`
    };
  }

  if (slot.type === "item") {
    const item = typeof getItemData === "function" ? getItemData(slot.id) : null;
    const inv = typeof findInventoryItemById === "function" ? findInventoryItemById(slot.id) : null;
    if (!item || !inv || Number(inv.count || 0) <= 0) return { type: "empty" };
    if (item.type !== "consume") return { type: "empty" };
    return {
      type: "item",
      id: item.id,
      name: item.name,
      icon: item.icon || `images/items/${item.officialId || item.id}.webp`,
      count: Number(inv.count || 0),
      className: "potion",
      hint: `${item.name} x${Number(inv.count || 0)}`
    };
  }

  return { type: "empty" };
}

function getManualQuickSlots() {
  normalizeQuickSlotData();
  player.quickSlots = player.quickSlots.map(sanitizeQuickSlot);
  return player.quickSlots;
}

function parseQuickDragData(event) {
  const raw = event.dataTransfer.getData("application/json") || event.dataTransfer.getData("text/plain");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function setQuickSlotFromDrag(index, data) {
  normalizeQuickSlotData();
  if (!data) return;

  if (data.type === "basic") {
    player.quickSlots[index] = { type: "basic" };
  } else if (data.type === "skill") {
    const skill = typeof getSkillDataById === "function" ? getSkillDataById(data.id) : null;
    if (!skill || typeof getSkillLevel !== "function" || getSkillLevel(skill.id) <= 0) {
      addBattleLog("尚未學會此技能，不能放入快捷欄。");
      return;
    }
    if (!["attack", "buff", "heal", "support"].includes(skill.skillType)) {
      addBattleLog("被動技能不能拖曳到快捷欄。 ");
      return;
    }
    player.quickSlots[index] = { type: "skill", id: skill.id };
  } else if (data.type === "item") {
    const item = typeof getItemData === "function" ? getItemData(data.id) : null;
    if (!item || item.type !== "consume") {
      addBattleLog("目前只有消耗品可以放入快捷欄。");
      return;
    }
    player.quickSlots[index] = { type: "item", id: item.id };
  }

  updateQuickSlotUI();
  saveGame();
}

function clearQuickSlot(index) {
  normalizeQuickSlotData();
  player.quickSlots[index] = { type: "empty" };
  updateQuickSlotUI();
  saveGame();
}

function updateQuickSlotUI() {
  const bar = document.getElementById("quick-slot-bar");
  if (!bar || !player) return;

  const slots = getManualQuickSlots();
  bar.innerHTML = "";

  slots.forEach((slot, index) => {
    const slotEl = document.createElement("button");
    slotEl.type = "button";
    slotEl.className = `quick-slot ${slot.type || "empty"} ${slot.className || ""}`.trim();
    slotEl.title = slot.hint || slot.name || "拖曳技能或補品到這裡";
    slotEl.dataset.slotIndex = String(index);

    slotEl.addEventListener("dragover", event => {
      event.preventDefault();
      slotEl.classList.add("drag-over");
      event.dataTransfer.dropEffect = "copy";
    });
    slotEl.addEventListener("dragleave", () => slotEl.classList.remove("drag-over"));
    slotEl.addEventListener("drop", event => {
      event.preventDefault();
      slotEl.classList.remove("drag-over");
      setQuickSlotFromDrag(index, parseQuickDragData(event));
    });
    slotEl.addEventListener("contextmenu", event => {
      event.preventDefault();
      clearQuickSlot(index);
    });

    const key = document.createElement("span");
    key.className = "quick-key";
    key.textContent = QUICK_SLOT_LABELS[index] || String(index + 1);
    slotEl.appendChild(key);

    if (slot.type !== "empty") {
      const icon = document.createElement("img");
      icon.src = slot.icon || "";
      icon.alt = slot.name || "快捷";
      icon.onerror = function () { icon.style.display = "none"; };
      slotEl.appendChild(icon);

      if (slot.type === "skill" && Number(slot.level || 0) > 0) {
        const level = document.createElement("b");
        level.className = "quick-level";
        level.textContent = `Lv${slot.level}`;
        slotEl.appendChild(level);
      }

      if (slot.type === "item" && Number(slot.count || 0) > 0) {
        const count = document.createElement("b");
        count.className = "quick-count";
        count.textContent = String(slot.count);
        slotEl.appendChild(count);
      }

      slotEl.addEventListener("click", () => useQuickSlot(slot));
    } else {
      const empty = document.createElement("i");
      empty.textContent = "+";
      slotEl.appendChild(empty);
    }

    bar.appendChild(slotEl);
  });
}

function useQuickSlot(slot) {
  if (!slot || slot.type === "empty") return;

  if (slot.type === "basic") {
    quickSlotNormalAttack();
    return;
  }

  if (slot.type === "item") {
    if (typeof useItem === "function") {
      useItem(slot.id);
      updateQuickSlotUI();
    }
    return;
  }

  if (slot.type === "skill") quickSlotCastSkill(slot.id);
}

function quickSlotEnsureFieldMonster() {
  if (player?.currentCity) {
    addBattleLog("目前位於城鎮，無法攻擊怪物。");
    return false;
  }
  if (!currentMap) {
    addBattleLog("目前沒有練功地圖。");
    return false;
  }
  if (!currentMonster && typeof spawnMonsterFromCurrentMap === "function") spawnMonsterFromCurrentMap();
  return Boolean(currentMonster);
}

function quickSlotNormalAttack() {
  if (!quickSlotEnsureFieldMonster()) return;
  if (typeof canPlayerAttackNow === "function" && !canPlayerAttackNow()) return;
  if (typeof markPlayerAttackUsed === "function") markPlayerAttackUsed();

  if (typeof playerHitsMonster === "function" && !playerHitsMonster()) {
    addBattleLog("你攻擊 " + currentMonster.name + "，但是 Miss！");
    playPlayerAttackAnimation();
    updateMonsterUI();
    monsterAttackPlayer();
    return;
  }

  const playerDamage = calculatePlayerDamage();
  currentMonster.currentHp = Math.max(0, Number(currentMonster.currentHp || 0) - playerDamage);
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

function quickSlotCastSkill(skillId) {
  const skill = typeof getSkillDataById === "function" ? getSkillDataById(skillId) : null;
  if (!skill) {
    addBattleLog("找不到快捷技能。");
    updateQuickSlotUI();
    return;
  }

  if (typeof getSkillLevel === "function" && getSkillLevel(skill.id) <= 0) {
    addBattleLog(skill.name + " 尚未學會。");
    updateQuickSlotUI();
    return;
  }

  if (skill.skillType === "attack") {
    if (!quickSlotEnsureFieldMonster()) return;
    if (typeof canPlayerAttackNow === "function" && !canPlayerAttackNow()) return;
    if (typeof markPlayerAttackUsed === "function") markPlayerAttackUsed();
    if (typeof playerHitsMonster === "function" && !playerHitsMonster()) {
      addBattleLog("你施放 " + skill.name + "，但是 Miss！");
      playPlayerAttackAnimation();
      monsterAttackPlayer();
      return;
    }
    const used = castAttackSkill(skill, getSkillLevel(skill.id));
    if (!used) return;
    if (currentMonster && currentMonster.currentHp <= 0) {
      defeatMonster();
      return;
    }
    if (currentMonster) monsterAttackPlayer();
    return;
  }

  if (skill.skillType === "buff") {
    castBuffSkill(skill, getSkillLevel(skill.id));
    return;
  }
  if (skill.skillType === "heal") {
    castHealSkill(skill, getSkillLevel(skill.id));
    return;
  }
  addBattleLog(skill.name + " 目前不能放在快捷欄使用。 ");
}

document.addEventListener("keydown", event => {
  if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
  const keyMap = { "1": 0, "2": 1, "3": 2, "4": 3, "5": 4, "6": 5, "7": 6, "8": 7, "9": 8, "0": 9 };
  if (!(event.key in keyMap)) return;
  const slot = getManualQuickSlots()[keyMap[event.key]];
  if (!slot || slot.type === "empty") return;
  event.preventDefault();
  useQuickSlot(slot);
});
