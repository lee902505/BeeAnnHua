//=======================================
// JobManager v0.4
// 職業系統 / 冒險者修練 / 轉職架構
//=======================================

let jobs = {};
let skillsData = null;
let serverConfig = null;

async function loadServerConfig() {
  try {
    serverConfig = await loadJson("./data/server_config.json");
    console.log("伺服器設定載入完成：", serverConfig);
  } catch (error) {
    console.warn("伺服器設定載入失敗，使用 1 倍預設值。", error);
    serverConfig = {
      server: {
        rateScale: 100,
        rates: {
          baseExp: 100,
          jobExp: 100,
          drop: 100,
          zeny: 100
        }
      }
    };
  }
}

async function loadJobData() {
  try {
    jobs = await loadJson("./data/jobs.json", {});
    console.log("職業資料載入完成：", jobs);
  } catch (error) {
    console.warn("職業資料載入失敗。", error);
    jobs = {};
  }
}

async function loadSkillData() {
  try {
    const manifest = await loadJson("./data/skill_manifest.json", null);
    if (!manifest?.cores?.length) throw new Error("Skill Core V3 manifest missing");

    const skillIndex = {};
    for (const corePath of manifest.cores) {
      const core = await loadJson(`./${corePath}`, { skills: {} });
      Object.entries(core?.skills || {}).forEach(([id, skill]) => {
        if (skillIndex[id]) throw new Error(`Duplicate official Skill ID: ${id}`);
        skillIndex[id] = skill;
      });
    }

    const jobsMap = {};
    for (const treePath of manifest.trees || []) {
      const tree = await loadJson(`./${treePath}`, null);
      if (!tree?.job) continue;
      jobsMap[tree.job] = (tree.skills || []).map(node => {
        const body = skillIndex[String(node.skillId)];
        if (!body) throw new Error(`Orphan skill tree reference: ${tree.job} -> ${node.skillId}`);
        const skill = { ...body, maxLevel: node.maxLevel ?? body.maxLevel };
        if (node.requiredJobLevel !== undefined) skill.requiredJobLevel = node.requiredJobLevel;
        if (Array.isArray(node.requires)) skill.requires = node.requires.map(req => ({ id: req.skillId, officialId: req.skillId, level: req.level }));
        return skill;
      });
    }

    const runtimeProfiles = {};
    for (const runtimePath of manifest.runtimeProfiles || []) {
      const pack = await loadJson(`./${runtimePath}`, { skills: {} });
      Object.entries(pack?.skills || {}).forEach(([id, profile]) => { runtimeProfiles[String(id)] = profile; });
    }

    const trainingData = await loadJson("./data/adventurer_training.json", { adventurer_training: [] });
    skillsData = {
      meta: { version: "0.9.80ZP", schema: "Skill Core V3 + Runtime Profile Only", manifest },
      adventurer_training: trainingData?.adventurer_training || [],
      skillIndex,
      runtimeProfiles,
      jobs: jobsMap
    };
    console.log("Skill Core V3 loaded:", Object.keys(skillIndex).length, "unique skills /", Object.keys(jobsMap).length, "job trees");
  } catch (error) {
    console.error("Skill Core V3 load failed. Legacy skills.json fallback has been retired.", error);
    skillsData = { meta: { version: "0.9.80ZP", loadError: String(error) }, adventurer_training: [], skillIndex: {}, runtimeProfiles: {}, jobs: {} };
  }
}

function getRate(rateKey) {
  const scale = Number(serverConfig?.server?.rateScale || 100);
  const raw = Number(serverConfig?.server?.rates?.[rateKey] ?? scale);
  return raw / scale;
}

function applyRate(value, rateKey) {
  return Math.max(0, Math.floor(Number(value || 0) * getRate(rateKey)));
}

function getJobData(jobKey = player?.jobKey) {
  if (!jobKey) return null;
  return jobs?.[jobKey] || null;
}

function getCurrentJobData() {
  return getJobData(player?.jobKey);
}

function getJobDisplayName(jobKey) {
  return getJobData(jobKey)?.name || jobKey || "未知職業";
}

function getAdventurerTrainingList() {
  return skillsData?.adventurer_training || [];
}

function getUnlockedAdventurerTraining() {
  if (!player || player.jobKey !== "novice") {
    return player?.completedAdventurerTraining || [];
  }

  const basicLevel = typeof getSkillLevel === "function" ? getSkillLevel("NV_BASIC") : 0;
  const unlockedTrainingLevel = Math.min(10, Number(basicLevel || 0) + (basicLevel > 0 ? 1 : 0));
  return getAdventurerTrainingList()
    .filter(training => Number(training.jobLevel || 0) <= unlockedTrainingLevel);
}

function getTrainingBonusTotals() {
  const totals = {
    maxHpRate: 0,
    maxSpRate: 0,
    atkRate: 0,
    defRate: 0,
    damageRate: 0,
    baseExpRate: 0,
    jobExpRate: 0,
    dropRate: 0,
    zenyRate: 0,
    atkFlat: 0,
    defFlat: 0
  };

  // V0.9.43：初心者知識改為 RO_WEB 專屬倍率效果。
  // 每 1 級：Base EXP / Job EXP / 掉寶率 / Zeny 各 +2%。
  // 舊版 adventurer_training（Max HP / Max SP 等）暫時不再套用，避免提示與實際效果不一致。
  const basicLevel = typeof getSkillLevel === "function" ? Number(getSkillLevel("NV_BASIC") || 0) : 0;
  const noviceBonus = Math.max(0, basicLevel) * 2;
  totals.baseExpRate += noviceBonus;
  totals.jobExpRate += noviceBonus;
  totals.dropRate += noviceBonus;
  totals.zenyRate += noviceBonus;

  return totals;
}

function getRewardBonusRate(rateKey) {
  const totals = getTrainingBonusTotals();
  if (rateKey === "baseExp") return totals.baseExpRate || 0;
  if (rateKey === "jobExp") return totals.jobExpRate || 0;
  if (rateKey === "drop") return totals.dropRate || 0;
  if (rateKey === "zeny") return totals.zenyRate || 0;
  return 0;
}

function applyTrainingRewardBonus(value, rateKey) {
  const bonus = getRewardBonusRate(rateKey);
  return Math.max(0, Math.floor(Number(value || 0) * (100 + bonus) / 100));
}

function getAvailableJobChanges() {
  if (!player) return [];

  const currentJob = getCurrentJobData();
  if (!currentJob) return [];

  const ruleList = Array.isArray(jobChangeRules)
    ? jobChangeRules.filter(rule => rule.fromJob === player.jobKey && rule.enabled !== false)
    : [];

  if (ruleList.length > 0) {
    return ruleList
      .map(rule => {
        const job = getJobData(rule.toJob);
        if (!job) return null;
        const check = typeof validateJobConstitution === "function"
          ? validateJobConstitution(rule, rule.toJob)
          : { ok: true, message: "" };
        return check.ok ? job : null;
      })
      .filter(Boolean);
  }

  if (!Array.isArray(currentJob.nextJobs)) return [];
  return currentJob.nextJobs
    .map(jobKey => getJobData(jobKey))
    .filter(Boolean)
    .filter(job => {
      const rule = { fromJob: player.jobKey, toJob: job.id, enabled: true };
      const check = typeof validateJobConstitution === "function"
        ? validateJobConstitution(rule, job.id)
        : { ok: Number(player.jobLevel || 1) >= Number(currentJob.jobMaxLevel || 0) };
      return check.ok;
    });
}


function meetsJobChangeSkillRequirements(rule = null) {
  if (typeof describeJobConstitutionRequirement === "function") {
    const requirement = describeJobConstitutionRequirement(rule || {});
    return validateRequiredSkills(requirement.requiredSkills || []);
  }
  return { ok: true, message: "" };
}

function changeJob(targetJobKey, rule = null) {
  if (!player) return;

  const targetJob = getJobData(targetJobKey);
  const currentJob = getCurrentJobData();

  if (!targetJob || !currentJob) {
    addBattleLog("找不到轉職資料。");
    return;
  }

  const effectiveRule = rule || (jobChangeRules || []).find(item => item.fromJob === player.jobKey && item.toJob === targetJobKey) || {
    fromJob: player.jobKey,
    toJob: targetJobKey,
    enabled: true
  };

  const constitutionCheck = typeof validateJobConstitution === "function"
    ? validateJobConstitution(effectiveRule, targetJobKey)
    : { ok: true, message: "" };
  if (!constitutionCheck.ok) {
    addBattleLog(constitutionCheck.message);
    return;
  }

  if (player.jobKey === "novice") {
    // 初學者修練永久保留，轉職後繼續吃被動加成。
    player.completedAdventurerTraining = getAdventurerTrainingList().filter(training => Number(training.jobLevel || 0) <= 10);
  }

  const oldJobName = player.job;
  const isRebirthChange = typeof isRebirthJobChange === "function" ? isRebirthJobChange(effectiveRule, targetJob) : false;

  player.jobKey = targetJob.id;
  if (typeof syncROStudioCharacterFromPlayer === "function") syncROStudioCharacterFromPlayer();
  player.job = targetJob.name;
  player.jobLevel = 1;
  player.jobExp = 0;
  player.jobExpToNext = getExpToNext("job", 1);
  player.skillPoints = targetJob.id === "novice" || targetJob.id === "high_novice" ? 0 : 1;
  player.learnedSkills = player.learnedSkills || {};

  // 憲法規則：轉生後素質固定重置，不繼承轉生前剩餘素質點，避免 125 + 舊點數。
  if (isRebirthChange && typeof applyRebirthConstitutionReset === "function") {
    applyRebirthConstitutionReset();
  }

  // 轉職後給一點基礎差異，先做輕量版，之後再接 jobs.json 成長表。
  if (targetJob.id === "swordman") {
    player.baseAtk += 3;
    player.baseMaxHp += 30;
    recalculatePlayerStats();
    player.hp = player.maxHp;
  }

  if (targetJob.id === "knight") {
    player.baseAtk += 8;
    player.baseMaxHp += 80;
    recalculatePlayerStats();
    player.hp = player.maxHp;
  }

  recalculatePlayerStats();
  updatePlayerUI();
  updateJobUI();
  updateSkillUI();
  if (typeof updateQuickSlotUI === "function") updateQuickSlotUI();
  saveGame();

  addBattleLog(`${oldJobName} 轉職成 ${targetJob.name}！`);
}

function updateJobUI() {
  const jobPanel = document.getElementById("job-panel");
  if (!jobPanel || !player) return;

  const jobData = getCurrentJobData();
  const maxJob = getMaxLevel("job");
  const availableChanges = getAvailableJobChanges();

  const trainingList = getAdventurerTrainingList();
  const unlockedTrainings = getUnlockedAdventurerTraining();
  const unlockedIds = new Set(unlockedTrainings.map(item => item.id));

  let html = `
    <div class="job-current">
      <div class="job-name">${player.job}</div>
      <div>Base Lv ${player.baseLevel} / 99</div>
      <div>Job Lv ${player.jobLevel} / ${maxJob}</div>
      <div>Skill Point ${Number(player.skillPoints || 0)}</div>
    </div>
  `;

  if (player.jobKey === "novice") {
    html += `<div class="job-section-title">🌱 冒險者修練</div>`;
    html += `<div class="training-list">`;
    trainingList.forEach(training => {
      const unlocked = unlockedIds.has(training.id);
      html += `
        <div class="training-row ${unlocked ? "unlocked" : "locked"}">
          <span>Job ${training.jobLevel} ${training.name}</span>
          <b>${unlocked ? "✓" : "未開啟"}</b>
          <small>${training.effect}</small>
        </div>
      `;
    });
    html += `</div>`;
  } else if (player.completedAdventurerTraining && player.completedAdventurerTraining.length > 0) {
    html += `<div class="job-section-title">永久修練</div>`;
    html += `<div class="training-summary">冒險者修練已完成，永久被動生效中。</div>`;
  }

  html += `<div class="job-section-title">轉職</div>`;

  if (availableChanges.length === 0) {
    if (player.jobLevel >= maxJob && jobData?.nextJobs?.length === 0) {
      html += `<div class="job-hint">目前已達此階段上限。後續職業之後再開放。</div>`;
    } else {
      html += `<div class="job-hint">Job Lv 達到 ${maxJob} 後，請前往對應城鎮尋找轉職 NPC。</div>`;
    }
  } else {
    html += `<div class="job-change-list">`;
    html += `<div class="job-hint">你已符合轉職條件，請前往對應城鎮尋找轉職 NPC。</div>`;
    availableChanges.forEach(job => {
      const cityHint = job.changeCity ? `｜${job.changeCity}` : "";
      const lockedText = job.locked ? "（未開放）" : "";
      html += `<div class="job-hint">可轉職：${job.name}${lockedText}${cityHint}</div>`;
    });
    html += `</div>`;
  }

  jobPanel.innerHTML = html;
}

function getCurrentJobSkills() {
  if (!player || !skillsData?.jobs) return [];

  const result = [];

  // 初心者基本技能會保留在技能欄中；轉職後仍可看到與使用已開放的初心者技能。
  result.push(...(skillsData.jobs.novice || []));

  if (player.jobKey === "swordman") {
    result.push(...(skillsData.jobs.swordman || []));
  } else if (player.jobKey === "knight" || player.jobKey === "crusader") {
    // 二轉繼承一轉技能欄，符合 RO 2-1 / 2-2 技能樹概念。
    result.push(...(skillsData.jobs.swordman || []));
    result.push(...(skillsData.jobs[player.jobKey] || []));
  } else if (player.jobKey && player.jobKey !== "novice") {
    result.push(...(skillsData.jobs[player.jobKey] || []));
  }

  return result;
}


function getSkillPrimaryId(skillOrId) {
  if (skillOrId && typeof skillOrId === "object") {
    return skillOrId.officialId ?? skillOrId.id;
  }
  const skill = getSkillDataById(skillOrId, true);
  return skill ? (skill.officialId ?? skill.id) : skillOrId;
}

function getSkillStorageKey(skillOrId) {
  const primary = getSkillPrimaryId(skillOrId);
  return String(primary);
}

function isSkillBasic(skill) {
  return String(skill?.code || "") === "NV_BASIC" || Number(skill?.officialId ?? skill?.id) === 1;
}

function getSkillDataById(skillId, skipNormalize = false) {
  const raw = skillId && typeof skillId === "object" ? (skillId.officialId ?? skillId.id) : skillId;
  return getCurrentJobSkills().find(skill => {
    const official = skill.officialId ?? skill.id;
    return String(skill.id) === String(raw) ||
      String(official) === String(raw) ||
      String(skill.code || "") === String(raw);
  }) || null;
}

function getSkillLevel(skillId) {
  const skill = getSkillDataById(skillId);
  if (skill?.autoUnlocked) {
    return 1;
  }
  if (!player || !player.learnedSkills) return 0;
  const key = getSkillStorageKey(skill || skillId);
  const legacyKey = skill?.code ? String(skill.code) : null;
  return Number(player.learnedSkills[key] ?? (legacyKey ? player.learnedSkills[legacyKey] : 0) ?? 0);
}

function getPendingSkillAdds() {
  if (!player) return {};
  player.pendingSkillAdds = player.pendingSkillAdds && typeof player.pendingSkillAdds === "object" ? player.pendingSkillAdds : {};
  return player.pendingSkillAdds;
}

function getPendingSkillAdd(skillId) {
  const key = getSkillStorageKey(skillId);
  return Number(getPendingSkillAdds()[key] || 0);
}

function getPreviewSkillLevel(skillId) {
  return getSkillLevel(skillId) + getPendingSkillAdd(skillId);
}

function getPendingSkillPointCost() {
  return Object.values(getPendingSkillAdds()).reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0);
}

function getAvailableSkillPointsForPreview() {
  return Math.max(0, Number(player?.skillPoints || 0) - getPendingSkillPointCost());
}


function forceSkillFooterVisible() {
  const footer = document.getElementById("skill-point-footer");
  const skillWindow = document.getElementById("skill-window");
  const body = skillWindow?.querySelector(".skill-window-body");
  if (!footer || !skillWindow || !body) return;

  // v0.9.46：footer 固定掛在 #skill-window 最外層。
  // 這樣不會被 skill-panel 的 scroll 區或 .window-body overflow 裁切。
  if (footer.parentElement !== skillWindow) {
    skillWindow.appendChild(footer);
  }

  Object.assign(skillWindow.style, {
    position: "absolute",
    overflow: "visible"
  });

  Object.assign(footer.style, {
    position: "absolute",
    left: "88px",
    right: "14px",
    bottom: "12px",
    height: "38px",
    minHeight: "38px",
    maxHeight: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxSizing: "border-box",
    zIndex: "9000",
    visibility: "visible",
    opacity: "1",
    pointerEvents: "auto",
    overflow: "visible"
  });
}


function clearPendingSkillAdds() {
  if (player) player.pendingSkillAdds = {};
}


function migrateSkillStorageToOfficialIds() {
  if (!player || typeof getCurrentJobSkills !== "function") return;
  const allSkills = [];
  Object.values(skillsData?.jobs || {}).forEach(list => {
    if (Array.isArray(list)) allSkills.push(...list);
  });

  const normalizeMapValue = (value) => {
    const skill = allSkills.find(item =>
      String(item.id) === String(value) ||
      String(item.officialId ?? item.id) === String(value) ||
      String(item.code || "") === String(value)
    );
    return skill ? String(skill.officialId ?? skill.id) : String(value);
  };

  if (player.learnedSkills && typeof player.learnedSkills === "object") {
    const next = {};
    Object.entries(player.learnedSkills).forEach(([key, value]) => {
      const normalized = normalizeMapValue(key);
      next[normalized] = Math.max(Number(next[normalized] || 0), Number(value || 0));
    });
    player.learnedSkills = next;
  }

  if (player.pendingSkillAdds && typeof player.pendingSkillAdds === "object") {
    const next = {};
    Object.entries(player.pendingSkillAdds).forEach(([key, value]) => {
      const normalized = normalizeMapValue(key);
      next[normalized] = Math.max(Number(next[normalized] || 0), Number(value || 0));
    });
    player.pendingSkillAdds = next;
  }

  if (Array.isArray(player.quickSlots)) {
    player.quickSlots.forEach(slot => {
      if (slot && slot.type === "skill" && slot.id !== undefined) {
        slot.id = normalizeMapValue(slot.id);
      }
    });
  }

  if (player.autoCombat) {
    if (player.autoCombat.heal?.skillId) player.autoCombat.heal.skillId = normalizeMapValue(player.autoCombat.heal.skillId);
    if (player.autoCombat.attack?.skillId) player.autoCombat.attack.skillId = normalizeMapValue(player.autoCombat.attack.skillId);
    if (player.autoCombat.buffs && typeof player.autoCombat.buffs === "object") {
      const nextBuffs = {};
      Object.entries(player.autoCombat.buffs).forEach(([key, value]) => {
        nextBuffs[normalizeMapValue(key)] = value;
      });
      player.autoCombat.buffs = nextBuffs;
    }
  }
}

function getSkillRequirementText(skill) {
  const parts = [];
  if (Number(skill.requiredJobLevel || 1) > 1) {
    parts.push(`Job ${skill.requiredJobLevel}`);
  }

  (skill.requires || []).forEach(req => {
    const reqSkill = getSkillDataById(req.id);
    parts.push(`${reqSkill?.name || req.id} Lv ${req.level}`);
  });

  return parts.length ? parts.join(" / ") : "無前置";
}


function getSkillLevelValueForUI(value, level, fallback = 0) {
  if (typeof getLevelValue === "function") return getLevelValue(value, level, fallback);
  if (Array.isArray(value)) {
    const index = Math.max(0, Number(level || 1) - 1);
    return Number(value[index] ?? value[value.length - 1] ?? fallback);
  }
  if (value && typeof value === "object") {
    return Number(value[level] ?? value[String(level)] ?? fallback);
  }
  return Number(value ?? fallback);
}

function formatSkillDurationForUI(ms) {
  const value = Number(ms || 0);
  if (value <= 0) return "無";
  if (value >= 1000) return `${Math.round(value / 1000)} 秒`;
  return `${value} ms`;
}

function getSkillEffectLabel(key) {
  const labels = {
    maxHpRate: "Max HP",
    maxSpRate: "Max SP",
    atkRate: "ATK",
    defRate: "DEF",
    damageRate: "最終傷害",
    baseExpRate: "Base EXP",
    jobExpRate: "Job EXP",
    dropRate: "掉寶率",
    zenyRate: "Zeny",
    atkFlat: "ATK",
    defFlat: "DEF",
    matAtkFlat: "MATK",
    matkFlat: "MATK",
    hitFlat: "HIT",
    fleeFlat: "FLEE",
    criFlat: "CRI",
    aspdFlat: "ASPD",
    avoidRate: "受擊迴避機率",
    attackRangeCells: "普攻射程",
    hpRecoverySkillLevel: "HP 自然恢復技能等級",
    spRecoverySkillLevel: "SP 自然恢復技能等級"
  };
  return labels[key] || key;
}

function isPercentSkillEffect(key) {
  return /Rate$/.test(key) || ["avoidRate", "damageRate", "dropRate", "zenyRate", "baseExpRate", "jobExpRate"].includes(key);
}

function formatSkillEffectForUI(key, value) {
  const number = Number(value || 0);
  const sign = number >= 0 ? "+" : "";
  const suffix = isPercentSkillEffect(key) ? "%" : "";
  return `${getSkillEffectLabel(key)} ${sign}${number}${suffix}`;
}


function buildSkillTooltipText(skill, currentLevel, check, maxed) {
  if (!skill) return "";
  if (isSkillBasic(skill)) {
    const bonus = Number(currentLevel || 0) * 2;
    return [
      `${skill.name} Lv.${currentLevel} / ${skill.maxLevel}`,
      "類型：被動 / 初心者知識",
      "前置：無前置",
      "消耗 SP：0",
      `效果：Base EXP +${bonus}% / Job EXP +${bonus}% / 掉寶率 +${bonus}% / Zeny +${bonus}%`,
      "說明：RO_WEB 初心者知識。點擊左鍵可查看目前修練倍率與轉職資訊；技能等級需由玩家自行配點。",
      "操作：點擊可查看初心者修練與轉職資訊。",
      maxed ? "狀態：已達上限" : `狀態：${check?.ok ? "可升級" : (check?.reason || "不可升級")}`
    ].join("\n");
  }
  const nextLevel = Math.min(Number(skill.maxLevel || 1), Math.max(1, currentLevel + 1));
  const previewLevel = currentLevel > 0 ? currentLevel : nextLevel;
  const typeText = typeof getSkillTypeText === "function" ? getSkillTypeText(skill) : (skill.skillType || "技能");
  const lines = [
    `${skill.name} Lv.${currentLevel} / ${skill.maxLevel}`,
    `類型：${typeText}`,
    `前置：${getSkillRequirementText(skill)}`
  ];

  if (skill.spCost !== undefined) {
    lines.push(`消耗 SP：${getSkillLevelValueForUI(skill.spCost, previewLevel, 0)}`);
  }
  const runtimeProfile = typeof getSkillRuntimeProfile === "function" ? getSkillRuntimeProfile(skill) : null;
  if (runtimeProfile) {
    if (runtimeProfile.ratio !== undefined) lines.push(`傷害倍率：${getSkillLevelValueForUI(runtimeProfile.ratio, previewLevel, 100)}%`);
    if (runtimeProfile.heal !== undefined) lines.push(`恢復量：${getSkillLevelValueForUI(runtimeProfile.heal, previewLevel, 0)} HP`);
    const runtimeDuration = runtimeProfile.duration !== undefined
      ? getSkillLevelValueForUI(runtimeProfile.duration, previewLevel, 0)
      : (runtimeProfile.durationFromSkill ? getSkillLevelValueForUI(skill.duration, previewLevel, 0) : 0);
    if (runtimeDuration > 0) lines.push(`持續時間：${formatSkillDurationForUI(runtimeDuration)}`);
    if (runtimeProfile.passiveBonuses) {
      const bonusParts = Object.keys(runtimeProfile.passiveBonuses).map(key => formatSkillEffectForUI(key, getSkillLevelValueForUI(runtimeProfile.passiveBonuses[key], previewLevel, 0)));
      if (bonusParts.length) lines.push(`被動效果：${bonusParts.join(" / ")}`);
    }
    if (runtimeProfile.effects) {
      const effectParts = Object.keys(runtimeProfile.effects).map(key => formatSkillEffectForUI(key, runtimeProfile.effects[key] === "level" ? previewLevel : getSkillLevelValueForUI(runtimeProfile.effects[key], previewLevel, 0)));
      if (effectParts.length) lines.push(`效果：${effectParts.join(" / ")}`);
    }
  } else {
    lines.push("Runtime：尚未完成（不會使用舊傷害或效果公式）");
  }

  lines.push(`說明：${skill.description || skill.name}`);

  if (isSkillBasic(skill)) {
    lines.push("操作：點擊可查看初心者修練與轉職資訊。");
  }
  if (skill.autoUnlocked || skill.autoLevelByJobLevel) {
    lines.push("狀態：初心者技能，已開放。");
  } else {
    lines.push(maxed ? "狀態：已達上限" : `狀態：${check?.ok ? "可升級" : (check?.reason || "不可升級")}`);
  }
  if (currentLevel > 0 && ["attack", "buff", "heal", "support"].includes(skill.skillType)) {
    lines.push("快捷欄：已學會後會自動列入候選。 ");
  }
  return lines.join("\n");
}

function setSkillPointFooterText() {
  const footer = document.getElementById("skill-point-footer");
  if (!footer) return;
  const available = getAvailableSkillPointsForPreview();
  footer.innerHTML = `
    <span>剩餘點數：<b>${available}</b></span>
    <span class="skill-footer-actions">
      <button type="button" id="confirmSkillPointsBtn">確認配點</button>
      <button type="button" id="resetSkillPointsBtn" title="需要：技能重置棒">初始化</button>
    </span>
  `;
  footer.querySelector("#confirmSkillPointsBtn")?.addEventListener("click", confirmPendingSkillPoints);
  footer.querySelector("#resetSkillPointsBtn")?.addEventListener("click", resetPendingSkillPoints);
  forceSkillFooterVisible();
}

function canLearnSkill(skill) {
  if (!player || !skill) {
    return { ok: false, reason: "找不到技能資料" };
  }

  if (skill.autoUnlocked) {
    return { ok: false, reason: "技能已開放" };
  }

  const currentLevel = getPreviewSkillLevel(skill.id);
  if (currentLevel >= Number(skill.maxLevel || 0)) {
    return { ok: false, reason: "已達上限" };
  }

  if (getAvailableSkillPointsForPreview() <= 0) {
    return { ok: false, reason: "技能點不足" };
  }

  if (Number(player.jobLevel || 1) < Number(skill.requiredJobLevel || 1)) {
    return { ok: false, reason: `需要 Job Lv ${skill.requiredJobLevel}` };
  }

  const requirements = skill.requires || [];
  for (const req of requirements) {
    if (getPreviewSkillLevel(req.id) < Number(req.level || 0)) {
      const reqSkill = getSkillDataById(req.id);
      return { ok: false, reason: `需要 ${reqSkill?.name || req.id} Lv ${req.level}` };
    }
  }

  return { ok: true, reason: "可以學習" };
}

function learnSkill(skillId) {
  const skill = getSkillDataById(skillId);
  const check = canLearnSkill(skill);

  if (!check.ok) {
    addBattleLog(`無法暫存技能配點：${check.reason}`);
    updateSkillUI();
    return;
  }

  const pending = getPendingSkillAdds();
  const key = getSkillStorageKey(skill);
  pending[key] = Number(pending[key] || 0) + 1;
  addBattleLog(`${skill.name} Lv ${getPreviewSkillLevel(skill)} 已加入待確認配點，請按「確認配點」套用。`);
  updateSkillUI();
}

function confirmPendingSkillPoints() {
  const pending = getPendingSkillAdds();
  const entries = Object.entries(pending).filter(([, value]) => Number(value || 0) > 0);
  if (!entries.length) {
    addBattleLog("目前沒有暫存技能配點。");
    return;
  }
  const totalCost = entries.reduce((sum, [, value]) => sum + Number(value || 0), 0);
  if (totalCost > Number(player.skillPoints || 0)) {
    addBattleLog("技能點不足，請重新配點。");
    updateSkillUI();
    return;
  }
  const lines = entries.map(([skillId, add]) => {
    const skill = getSkillDataById(skillId);
    return `${skill?.name || skillId} +${add} → Lv ${getSkillLevel(skillId) + Number(add || 0)}`;
  });
  if (!confirm(`是否確認配點？\n${lines.join("\n")}\n將消耗 ${totalCost} 點技能點。`)) return;

  player.learnedSkills = player.learnedSkills || {};
  entries.forEach(([skillId, add]) => {
    const skill = getSkillDataById(skillId);
    const key = getSkillStorageKey(skill || skillId);
    player.learnedSkills[key] = getSkillLevel(skill || skillId) + Number(add || 0);
  });
  player.skillPoints = Math.max(0, Number(player.skillPoints || 0) - totalCost);
  clearPendingSkillAdds();

  addBattleLog(`已確認技能配點，消耗 ${totalCost} 點。`);
  recalculatePlayerStats();
  updateSkillUI();
  updateJobUI();
  updatePlayerUI();
  if (typeof updateAutoCombatUI === "function") updateAutoCombatUI();
  if (typeof updateQuickSlotUI === "function") updateQuickSlotUI();
  saveGame();
}

function resetPendingSkillPoints() {
  if (getPendingSkillPointCost() > 0) {
    clearPendingSkillAdds();
    addBattleLog("已取消尚未確認的技能配點。");
  } else {
    const resetItemId = 12213;
    const resetItem = (player.inventory || []).find(item => String(item.id) === String(resetItemId) && Number(item.count || 0) > 0);
    if (!resetItem) {
      addBattleLog("技能初始化需要：技能重置棒。");
      return;
    }
    if (!confirm("是否使用技能重置棒，重置目前職業技能？")) return;
    resetItem.count = Number(resetItem.count || 0) - 1;
    if (resetItem.count <= 0) player.inventory = (player.inventory || []).filter(item => item !== resetItem);
    player.learnedSkills = {};
    player.skillPoints = Math.max(0, Number(player.jobLevel || 1) - 1);
    clearPendingSkillAdds();
    addBattleLog("已使用技能重置棒，技能點數已初始化。");
    recalculatePlayerStats();
    updatePlayerUI();
    saveGame();
  }
  updateSkillUI();
}


function formatRateMultiplierForBasicInfo(rawValue) {
  const rateScale = Number(serverConfig?.server?.rateScale || 100);
  const value = Number(rawValue || rateScale);
  return `${Math.round((value / rateScale) * 100) / 100} 倍`;
}

function openJobTrainingFromBasicSkill(event) {
  if (event) event.stopPropagation();
  let infoWindow = document.getElementById("basic-skill-info-window");
  if (!infoWindow) {
    infoWindow = document.createElement("section");
    infoWindow.id = "basic-skill-info-window";
    infoWindow.className = "game-window draggable-window basic-skill-info-window";
    infoWindow.dataset.defaultX = "40";
    infoWindow.dataset.defaultY = "190";
    infoWindow.style.left = "40px";
    infoWindow.style.top = "190px";
    infoWindow.style.setProperty("--basic-info-left", "40px");
    infoWindow.style.setProperty("--basic-info-top", "190px");
    infoWindow.innerHTML = `
      <div class="window-title drag-handle">初心者知識 <button class="window-close" data-target="basic-skill-info-window">×</button></div>
      <div class="window-body basic-skill-info-body"></div>
    `;
    (document.getElementById("battle-field") || document.getElementById("game-root"))?.appendChild(infoWindow);
    const closeButton = infoWindow.querySelector(".window-close");
    if (closeButton) {
      closeButton.addEventListener("click", event => {
        event.stopPropagation();
        infoWindow.classList.add("hidden-window");
        if (typeof updateToggleButtonStates === "function") updateToggleButtonStates();
      });
    }
    if (typeof initDraggableWindows === "function") initDraggableWindows();
  }

  // v0.9.42：只在第一次開啟時給安全預設座標；之後讓玩家拖曳位置生效。
  infoWindow.classList.remove("hidden-window");
  if (!infoWindow.dataset.positionInitialized) {
    infoWindow.style.left = "40px";
    infoWindow.style.top = "190px";
    infoWindow.style.setProperty("--basic-info-left", "40px");
    infoWindow.style.setProperty("--basic-info-top", "190px");
    infoWindow.dataset.positionInitialized = "1";
  }
  infoWindow.style.right = "auto";
  infoWindow.style.bottom = "auto";

  const basicLevel = getSkillLevel("NV_BASIC");
  const bonusPerLevel = 2;
  const bonus = basicLevel * bonusPerLevel;
  const body = infoWindow.querySelector(".basic-skill-info-body");
  if (body) {
    body.innerHTML = `
      <div class="basic-info-title">RO_WEB 初心者知識</div>
      <div class="basic-info-grid">
        <span>基本技能</span><b>Lv ${basicLevel} / 9</b>
        <span>Base EXP</span><b>+${bonus}%</b>
        <span>Job EXP</span><b>+${bonus}%</b>
        <span>掉寶率</span><b>+${bonus}%</b>
        <span>Zeny</span><b>+${bonus}%</b>
        <span>死亡懲罰</span><b>目前不掉經驗</b>
      </div>
      <div class="basic-info-note">每提升 1 級：Base EXP / Job EXP / 掉寶率 / Zeny 各 +2%。</div>
      <div class="basic-info-note">Job Lv 10、基本技能 Lv9，且技能點全部點完後，即可前往城鎮轉職。</div>
    `;
  }
  infoWindow.classList.remove("hidden-window");
  const bf = document.getElementById("battle-field");
  const maxX = bf ? Math.max(0, bf.clientWidth - infoWindow.offsetWidth - 12) : 140;
  const maxY = bf ? Math.max(0, bf.clientHeight - infoWindow.offsetHeight - 12) : 90;
  const curX = parseInt(infoWindow.style.getPropertyValue("--basic-info-left") || infoWindow.style.left, 10);
  const curY = parseInt(infoWindow.style.getPropertyValue("--basic-info-top") || infoWindow.style.top, 10);
  if (!Number.isFinite(curX) || curX < 0 || curX > maxX) {
    const x = Math.min(40, maxX);
    infoWindow.style.left = `${x}px`;
    infoWindow.style.setProperty("--basic-info-left", `${x}px`);
  }
  if (!Number.isFinite(curY) || curY < 0 || curY > maxY) {
    const y = Math.min(190, maxY);
    infoWindow.style.top = `${y}px`;
    infoWindow.style.setProperty("--basic-info-top", `${y}px`);
  }
  if (typeof bringWindowToFront === "function") bringWindowToFront(infoWindow);
}

let currentSkillTier = "first";

function isSuperNoviceFamilyJob(jobKey = player?.jobKey) {
  return ["super_novice", "expanded_super_novice", "hyper_novice"].includes(String(jobKey || ""));
}

function getSkillIdSet(list = []) {
  return new Set((Array.isArray(list) ? list : []).map(skill => String(skill?.officialId ?? skill?.id ?? skill?.code ?? "")));
}

function getSkillDifference(fullList = [], inheritedList = []) {
  const inheritedIds = getSkillIdSet(inheritedList);
  return (Array.isArray(fullList) ? fullList : []).filter(skill => {
    const id = String(skill?.officialId ?? skill?.id ?? skill?.code ?? "");
    return id && !inheritedIds.has(id);
  });
}

function getSkillTierList(tier) {
  if (!skillsData?.jobs) return [];
  const jobKey = String(player?.jobKey || "novice");
  if (tier === "novice") return skillsData.jobs.novice || [];

  // V0.9.80ZH：超初系列不得再套用劍士技能樹。
  // 一般超初顯示超初技能；界限解放與終初只在後續分頁顯示新增技能，避免重複。
  if (isSuperNoviceFamilyJob(jobKey)) {
    const superSkills = skillsData.jobs.super_novice || [];
    const expandedSkills = skillsData.jobs.expanded_super_novice || [];
    const hyperSkills = skillsData.jobs.hyper_novice || [];
    if (tier === "first") return superSkills;
    if (tier === "second") {
      return ["expanded_super_novice", "hyper_novice"].includes(jobKey)
        ? getSkillDifference(expandedSkills, superSkills)
        : [];
    }
    if (tier === "fourth") {
      return jobKey === "hyper_novice"
        ? getSkillDifference(hyperSkills, expandedSkills)
        : [];
    }
    return [];
  }

  if (tier === "first") return jobKey === "novice" ? [] : (skillsData.jobs.swordman || []);
  if (tier === "second") {
    if (jobKey === "knight" || jobKey === "crusader") return skillsData.jobs[jobKey] || [];
    return [];
  }
  return [];
}

function getVisibleSkillTier() {
  if (currentSkillTier === "novice") currentSkillTier = "first";
  return currentSkillTier || "first";
}

function refreshSkillTabs() {
  const superFamily = isSuperNoviceFamilyJob();
  const superLabels = { first: "超初", second: "界限解放", third: "—", fourth: "終初" };
  const normalLabels = { first: "一轉", second: "二轉", third: "三轉", fourth: "四轉" };
  document.querySelectorAll("#skill-window .skill-tab[data-skill-tier]").forEach(tab => {
    const tier = tab.dataset.skillTier;
    tab.textContent = (superFamily ? superLabels : normalLabels)[tier] || tab.textContent;
    const disabled = getSkillTierList(tier).length === 0;
    tab.classList.toggle("is-active", tier === getVisibleSkillTier());
    tab.classList.toggle("is-disabled", disabled);
    tab.disabled = disabled;
  });

  if (getSkillTierList(getVisibleSkillTier()).length === 0) {
    currentSkillTier = ["first", "second", "third", "fourth"].find(tier => getSkillTierList(tier).length > 0) || "first";
    document.querySelectorAll("#skill-window .skill-tab[data-skill-tier]").forEach(tab => {
      tab.classList.toggle("is-active", tab.dataset.skillTier === currentSkillTier);
    });
  }
}

function initSkillTabs() {
  document.querySelectorAll("#skill-window .skill-tab[data-skill-tier]").forEach(tab => {
    if (tab.dataset.skillBound === "1") return;
    tab.dataset.skillBound = "1";
    tab.addEventListener("click", () => {
      const tier = tab.dataset.skillTier;
      currentSkillTier = tier;
      clearPendingSkillAdds();
      updateSkillUI();
    });
  });
}


function initNoviceSkillRowDelegation() {
  const row = document.getElementById("novice-skill-row");
  if (!row || row.dataset.delegated === "1") return;
  row.dataset.delegated = "1";
  row.addEventListener("click", event => {
    const plus = event.target.closest(".novice-skill-chip-plus");
    if (plus) return;
    const chip = event.target.closest(".novice-skill-chip.opens-training");
    if (!chip) return;
    event.preventDefault();
    event.stopPropagation();
    openJobTrainingFromBasicSkill(event);
  }, true);
}

function removeSkillPathOverlay() {
  const overlay = document.querySelector("#skill-panel .skill-path-overlay");
  if (overlay) overlay.remove();
}

function clearSkillRequirementHighlights() {
  document.querySelectorAll("#skill-panel .skill-grid-slot").forEach(slot => {
    slot.classList.remove("skill-focus", "skill-prereq-ok", "skill-prereq-needed", "skill-path-node");
  });
  removeSkillPathOverlay();
}

function drawSkillPrereqPath(fromSlot, toSlot, ok) {
  const panel = document.getElementById("skill-panel");
  if (!panel || !fromSlot || !toSlot) return;

  let svg = panel.querySelector(".skill-path-overlay");
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("skill-path-overlay");
    svg.setAttribute("aria-hidden", "true");
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    grad.setAttribute("id", "skillPathRedGold");
    grad.setAttribute("gradientUnits", "userSpaceOnUse");
    grad.setAttribute("x1", "0");
    grad.setAttribute("y1", "0");
    grad.setAttribute("x2", "1");
    grad.setAttribute("y2", "0");
    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "#ffd86a");
    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "#ff4a2f");
    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.appendChild(defs);
    panel.prepend(svg);
  }

  const panelRect = panel.getBoundingClientRect();
  const fromRect = fromSlot.getBoundingClientRect();
  const toRect = toSlot.getBoundingClientRect();

  const x1 = fromRect.left - panelRect.left + panel.scrollLeft + fromRect.width / 2;
  const y1 = fromRect.top - panelRect.top + panel.scrollTop + fromRect.height / 2;
  const x2 = toRect.left - panelRect.left + panel.scrollLeft + toRect.width / 2;
  const y2 = toRect.top - panelRect.top + panel.scrollTop + toRect.height / 2;
  const midX = (x1 + x2) / 2;

  svg.setAttribute("width", Math.max(panel.scrollWidth, panel.clientWidth));
  svg.setAttribute("height", Math.max(panel.scrollHeight, panel.clientHeight));
  svg.setAttribute("viewBox", `0 0 ${Math.max(panel.scrollWidth, panel.clientWidth)} ${Math.max(panel.scrollHeight, panel.clientHeight)}`);

  const grad = svg.querySelector("#skillPathRedGold");
  if (grad) {
    grad.setAttribute("x1", String(x1));
    grad.setAttribute("y1", String(y1));
    grad.setAttribute("x2", String(x2));
    grad.setAttribute("y2", String(y2));
  }

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`);
  path.setAttribute("class", ok ? "skill-path-line ok" : "skill-path-line needed");
  svg.appendChild(path);

  const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
  // V0.9.64：Hover 當前技能時，紅線一路回指到「所有前置技能」。
  // fromSlot = 目前節點，toSlot = 前置節點；箭頭頭端固定放在前置技能端。
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 9;
  const ax1 = x2 - Math.cos(angle - Math.PI / 6) * size;
  const ay1 = y2 - Math.sin(angle - Math.PI / 6) * size;
  const ax2 = x2 - Math.cos(angle + Math.PI / 6) * size;
  const ay2 = y2 - Math.sin(angle + Math.PI / 6) * size;
  arrow.setAttribute("d", `M ${ax1} ${ay1} L ${x2} ${y2} L ${ax2} ${ay2}`);
  arrow.setAttribute("class", ok ? "skill-path-arrow ok" : "skill-path-arrow needed");
  svg.appendChild(arrow);
}

function getSkillSlotById(skillId) {
  if (!skillId) return null;
  const key = getSkillStorageKey(skillId);
  const safeId = (window.CSS && CSS.escape) ? CSS.escape(String(key)) : String(key).replace(/"/g, '\\"');
  return document.querySelector(`#skill-panel .skill-grid-slot[data-skill-id="${safeId}"]`);
}

function highlightSkillRequirementChain(skill, fromSlot, visited = new Set()) {
  const visitKey = getSkillStorageKey(skill);
  if (!skill || !fromSlot || visited.has(visitKey)) return;
  visited.add(visitKey);

  (skill.requires || []).forEach(req => {
    const reqSkill = getSkillDataById(req.id);
    const reqSlot = getSkillSlotById(req.id);
    if (!reqSlot) return;

    const ok = getPreviewSkillLevel(req.id) >= Number(req.level || 0);
    reqSlot.classList.add(ok ? "skill-prereq-ok" : "skill-prereq-needed", "skill-path-node");
    drawSkillPrereqPath(fromSlot, reqSlot, ok);

    // 連鎖顯示：Hover 最後技能時，會一路回亮它的所有上游前置技能。
    if (reqSkill) highlightSkillRequirementChain(reqSkill, reqSlot, visited);
  });
}

function highlightSkillRequirements(skill) {
  clearSkillRequirementHighlights();
  if (!skill) return;
  const current = getSkillSlotById(skill.id);
  if (current) current.classList.add("skill-focus", "skill-path-node");
  highlightSkillRequirementChain(skill, current);
}

function makeSkillDragPayload(skill) {
  return JSON.stringify({ type: "skill", id: getSkillStorageKey(skill) });
}

function makeBasicAttackDragPayload() {
  return JSON.stringify({ type: "basic" });
}

function renderNoviceSkillRow() {
  const row = document.getElementById("novice-skill-row");
  if (!row) return;
  row.innerHTML = "";

  const basicAttack = document.createElement("button");
  basicAttack.type = "button";
  basicAttack.className = "novice-skill-chip draggable-skill-chip";
  basicAttack.draggable = true;
  basicAttack.dataset.tooltip = "普通攻擊：可拖曳到快捷欄。";
  basicAttack.innerHTML = `<span class="novice-skill-chip-icon">⚔</span><span>普通攻擊</span>`;
  basicAttack.addEventListener("dragstart", event => {
    event.dataTransfer.setData("application/json", makeBasicAttackDragPayload());
    event.dataTransfer.effectAllowed = "copy";
  });
  row.appendChild(basicAttack);

  (skillsData?.jobs?.novice || []).forEach(skill => {
    const level = getPreviewSkillLevel(skill.id);
    const check = canLearnSkill(skill);
    const maxed = level >= Number(skill.maxLevel || 0);
    const canDrag = ["attack", "buff", "heal", "support"].includes(skill.skillType) && level > 0;
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "novice-skill-chip" + (canDrag ? " draggable-skill-chip" : "") + (level > 0 ? " learned" : "") + (check.ok ? " learnable" : " locked") + (maxed ? " maxed" : "");
    chip.dataset.tooltip = buildSkillTooltipText(skill, level, check, maxed);
    if (canDrag) {
      chip.draggable = true;
      chip.addEventListener("dragstart", event => {
        event.dataTransfer.setData("application/json", makeSkillDragPayload(skill));
        event.dataTransfer.effectAllowed = "copy";
      });
    }
    if (isSkillBasic(skill)) {
      chip.classList.add("opens-training");
      chip.title = "左鍵查看初心者知識 / 修練資訊；按 + 加入待確認配點";
      chip.addEventListener("click", openJobTrainingFromBasicSkill);
    }

    const iconHtml = skill.icon ? `<img src="${skill.icon}" alt="${skill.name}">` : (skill.iconText || skill.name.slice(0,1));
    chip.innerHTML = `<span class="novice-skill-chip-icon">${iconHtml}</span><span class="novice-skill-chip-text">${skill.name} Lv${level}</span>`;

    if (!skill.autoUnlocked && !maxed) {
      const plus = document.createElement("span");
      plus.className = "novice-skill-chip-plus";
      plus.textContent = "+";
      plus.title = `${skill.name} +1`;
      plus.setAttribute("role", "button");
      plus.setAttribute("aria-label", `${skill.name} +1`);
      plus.classList.toggle("is-disabled", !check.ok);
      plus.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        if (check.ok) learnSkill(skill.id);
      });
      chip.appendChild(plus);
    }
    row.appendChild(chip);
  });
}

function updateSkillUI() {
  const skillPanel = document.getElementById("skill-panel");
  if (!skillPanel) return;
  setSkillPointFooterText();
  renderNoviceSkillRow();
  initNoviceSkillRowDelegation();

  initSkillTabs();
  refreshSkillTabs();
  const activeTier = getVisibleSkillTier();
  const skillList = getSkillTierList(activeTier);
  skillPanel.innerHTML = "";
  skillPanel.classList.add("skill-slot-grid");
  skillPanel.dataset.activeTier = activeTier;

  if (!skillList.length) {
    skillPanel.innerHTML = `
      <div class="skill-empty" data-tooltip="目前職業尚未建立技能資料。">目前職業尚未開放技能資料。</div>
    `;
    setSkillPointFooterText();
    forceSkillFooterVisible();
    return;
  }

  const visibleSkills = skillList;
  const skillSlotCount = Math.max(40, visibleSkills.length);

  for (let index = 0; index < skillSlotCount; index += 1) {
    const slot = document.createElement("div");
    slot.className = "skill-grid-slot";
    slot.dataset.slotIndex = String(index + 1);

    const skill = visibleSkills[index];
    if (!skill) {
      slot.classList.add("empty");
      skillPanel.appendChild(slot);
      continue;
    }

    const baseLevel = getSkillLevel(skill.id);
    const pendingAdd = getPendingSkillAdd(skill.id);
    const currentLevel = baseLevel + pendingAdd;
    slot.dataset.skillId = getSkillStorageKey(skill);
    const check = canLearnSkill(skill);
    const maxed = currentLevel >= Number(skill.maxLevel || 0);
    const tooltip = buildSkillTooltipText(skill, currentLevel, check, maxed);

    slot.classList.add(check.ok ? "learnable" : "locked");
    if (currentLevel > 0) slot.classList.add("learned");
    if (maxed) slot.classList.add("maxed");
    slot.dataset.tooltip = tooltip;
    slot.addEventListener("mouseenter", () => highlightSkillRequirements(skill));
    slot.addEventListener("mouseleave", clearSkillRequirementHighlights);
    if (isSkillBasic(skill)) {
      slot.classList.add("opens-training");
      slot.addEventListener("click", openJobTrainingFromBasicSkill);
    }

    const iconBox = document.createElement("button");
    iconBox.type = "button";
    iconBox.className = "skill-grid-icon";
    iconBox.dataset.tooltip = tooltip;
    if (["attack", "buff", "heal", "support"].includes(skill.skillType) && currentLevel > 0) {
      iconBox.draggable = true;
      iconBox.title = `${skill.name}：可拖曳到快捷欄`;
      iconBox.addEventListener("dragstart", event => {
        event.dataTransfer.setData("application/json", makeSkillDragPayload(skill));
        event.dataTransfer.effectAllowed = "copy";
      });
    }
    if (isSkillBasic(skill)) {
      iconBox.title = "查看初心者基本技能 / 修練";
      iconBox.onclick = openJobTrainingFromBasicSkill;
    }

    if (skill.icon) {
      const icon = document.createElement("img");
      icon.src = skill.icon;
      icon.alt = skill.name;
      icon.onerror = function () {
        icon.style.display = "none";
        iconBox.textContent = skill.iconText || skill.name.slice(0, 1);
      };
      iconBox.appendChild(icon);
    } else {
      iconBox.textContent = skill.iconText || skill.name.slice(0, 1);
    }

    const level = document.createElement("span");
    level.className = "skill-grid-level";
    level.textContent = currentLevel > 0 ? (pendingAdd > 0 ? `${currentLevel}*` : String(currentLevel)) : "";

    const name = document.createElement("span");
    name.className = "skill-grid-name";
    name.textContent = skill.name;
    name.dataset.tooltip = tooltip;

    const plus = document.createElement("button");
    plus.type = "button";
    plus.className = "skill-grid-plus";
    plus.textContent = "+";
    plus.title = `${skill.name} +1`;
    plus.disabled = !check.ok;
    plus.onclick = function (event) {
      event.stopPropagation();
      learnSkill(skill.id);
    };

    slot.appendChild(iconBox);
    slot.appendChild(level);
    slot.appendChild(name);
    if (!skill.autoUnlocked) {
      slot.appendChild(plus);
    }
    if (skill.requires && skill.requires.length) {
      const reqBadge = document.createElement("span");
      reqBadge.className = "skill-req-mini";
      reqBadge.textContent = skill.requires.map(req => `前置${req.level}`).join("/");
      slot.appendChild(reqBadge);
    }
    skillPanel.appendChild(slot);
  }

  setSkillPointFooterText();
  forceSkillFooterVisible();

  if (typeof updateQuickSlotUI === "function") updateQuickSlotUI();
}
