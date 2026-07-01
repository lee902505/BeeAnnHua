//=======================================
// LootManager v0.2
// 掉寶 / Zeny / 背包獎勵統一由這裡處理
//=======================================

function grantMonsterRewards(monster) {
  if (!monster) return;

  const rawBaseExp = Number(monster.baseExp || 0);
  const rawJobExp = Number(monster.jobExp || 0);
  const rawZeny = rollZeny(monster);

  const baseExp = applyTrainingRewardBonus(applyRate(rawBaseExp, "baseExp"), "baseExp");
  const jobExp = applyTrainingRewardBonus(applyRate(rawJobExp, "jobExp"), "jobExp");
  const zeny = applyTrainingRewardBonus(applyRate(rawZeny, "zeny"), "zeny");

  if (typeof recordMonsterKill === "function") {
    recordMonsterKill(monster);
  }

  addBaseExp(baseExp);
  addJobExp(jobExp);
  addZeny(zeny);

  if (typeof recordBattleRewards === "function") {
    recordBattleRewards({ baseExp, jobExp, zeny });
  }

  addBattleLog(`獲得 Base EXP ${baseExp}`);
  addBattleLog(`獲得 Job EXP ${jobExp}`);
  addBattleLog(`獲得 Zeny ${zeny}`);

  rollMonsterDrops(monster);
}

function rollZeny(monster) {
  if (Number.isFinite(Number(monster.zeny))) {
    return Number(monster.zeny);
  }

  const min = Number(monster.zenyMin ?? 0);
  const max = Number(monster.zenyMax ?? min);

  return randomInt(Math.min(min, max), Math.max(min, max));
}

// chance 採用萬分比：10000 = 100%，1000 = 10%，1 = 0.01%
function rollMonsterDrops(monster) {
  if (!monster.drops || monster.drops.length === 0) return;

  monster.drops.forEach(drop => {
    const rawChance = Number(drop.chance || 0);
    if (rawChance <= 0) return;

    const ratedChance = applyTrainingRewardBonus(applyRate(rawChance, "drop"), "drop");
    const chance = Math.min(10000, ratedChance);
    const roll = Math.floor(Math.random() * 10000) + 1;

    if (roll <= chance) {
      const itemId = normalizeItemId(drop.itemId);
      const itemData = getItemData(itemId);
      const qty = rollDropQuantity(drop);
      const itemName = itemData?.name || drop.name || `Item ${itemId}`;

      addItem({
        id: itemId,
        name: itemName
      }, qty);

      if (typeof recordItemDrop === "function") {
        recordItemDrop(itemId, qty);
      }
    }
  });
}

function rollDropQuantity(drop) {
  if (Number.isFinite(Number(drop.qty))) {
    return Math.max(1, Number(drop.qty));
  }

  const min = Number(drop.qtyMin ?? 1);
  const max = Number(drop.qtyMax ?? min);

  return Math.max(1, randomInt(Math.min(min, max), Math.max(min, max)));
}
