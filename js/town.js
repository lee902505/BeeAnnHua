//=======================================
// TownManager v0.9
// 城鎮 / NPC / 商店 / 轉職 NPC 架構
//=======================================

let currentCity = null;
let currentShopId = null;
let currentShopSelectedItem = null;
let currentShopBuyQty = 1;
let currentPurchaseItem = null;

function normalizeTownData() {
  if (!player) return;
  player.currentCity = player.currentCity || null;
  player.lastFieldMap = player.lastFieldMap || player.map || "prontera_south";
}

function getCityData(cityId) {
  return (cities || []).find(city => city.id === cityId) || null;
}

function getNpcData(npcId) {
  return (npcs || []).find(npc => npc.id === npcId) || null;
}

function getCityNpcs(cityId) {
  return (npcs || []).filter(npc => npc.cityId === cityId);
}

function updateTownUI() {
  if (!player) return;
  normalizeTownData();

  currentCity = player.currentCity ? getCityData(player.currentCity) : null;

  const currentCityNameEl = document.getElementById("current-city-name");
  const cityListEl = document.getElementById("city-list");
  const npcPanelEl = document.getElementById("npc-panel");

  if (currentCityNameEl) {
    currentCityNameEl.textContent = currentCity
      ? `目前城鎮：${currentCity.name}｜${currentCity.role || "城鎮"}`
      : "目前城鎮：野外";
  }

  if (cityListEl) {
    cityListEl.innerHTML = "";
    (cities || []).forEach(city => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "city-card" + (currentCity?.id === city.id ? " is-current" : "");
      card.onclick = function () { enterCity(city.id); };

      const title = document.createElement("div");
      title.className = "city-card-name";
      title.textContent = city.displayName || city.name;

      const role = document.createElement("div");
      role.className = "city-card-role";
      role.textContent = city.role || "城鎮";

      card.appendChild(title);
      card.appendChild(role);
      cityListEl.appendChild(card);
    });
  }

  if (npcPanelEl) {
    renderNpcPanel(npcPanelEl);
  }

  renderShopPanel(null);
}

function enterCity(cityId) {
  const city = getCityData(cityId);
  if (!city) {
    addBattleLog("找不到城鎮資料：" + cityId);
    return;
  }

  stopAutoBattle({ silent: true });
  if (typeof clearBattleTimersAndMonster === "function") {
    clearBattleTimersAndMonster({ clearMonster: true });
  }
  currentMonster = null;
  currentMap = null;
  currentShopId = null;

  player.currentCity = city.id;
  player.state = "Town";
  if (player.map) player.lastFieldMap = player.map;
  player.map = null;

  updateTownUI();
  updateMapUI();
  updateMonsterUI();
  updateTownBackground(city);
  saveGame();

  addBattleLog("進入城鎮：「" + city.name + "」。");
}

function leaveTownToLastField() {
  const targetMapId = player?.lastFieldMap || "prontera_south";
  changeMap(targetMapId);
}

function renderNpcPanel(panel) {
  panel.innerHTML = "";

  if (!currentCity) {
    panel.innerHTML = '<div class="town-empty">目前在野外。請選擇城鎮進入。</div>';
    return;
  }

  const title = document.createElement("div");
  title.className = "npc-title";
  title.textContent = "NPC";
  panel.appendChild(title);

  const cityNpcList = getCityNpcs(currentCity.id);
  if (!cityNpcList.length) {
    panel.innerHTML += '<div class="town-empty">這座城鎮暫無 NPC。</div>';
    return;
  }

  cityNpcList.forEach(npc => {
    const row = document.createElement("div");
    row.className = "npc-row";

    const info = document.createElement("div");
    info.className = "npc-info";
    info.innerHTML = `<b>${npc.name}</b><small>${npc.description || getNpcTypeText(npc.type)}</small>`;

    const action = document.createElement("button");
    action.textContent = getNpcActionText(npc);
    action.onclick = function () { interactNpc(npc.id); };

    row.appendChild(info);
    row.appendChild(action);
    panel.appendChild(row);
  });

  const leaveButton = document.createElement("button");
  leaveButton.className = "town-leave-button";
  leaveButton.textContent = "返回上一張練功地圖";
  leaveButton.onclick = leaveTownToLastField;
  panel.appendChild(leaveButton);
}

function getNpcTypeText(type) {
  const map = {
    shop: "商店",
    job_change: "轉職 NPC",
    storage: "倉庫"
  };
  return map[type] || type || "NPC";
}

function getNpcActionText(npc) {
  if (npc.type === "shop") return "開啟商店";
  if (npc.type === "job_change") return "轉職相談";
  return "交談";
}

function interactNpc(npcId) {
  const npc = getNpcData(npcId);
  if (!npc) return;

  if (npc.type === "shop") {
    openShop(npc.shopId);
    return;
  }

  if (npc.type === "job_change") {
    openJobChangeNpc(npc);
    return;
  }

  addBattleLog(npc.name + "：目前功能尚未開放。");
}

function openShop(shopId) {
  currentShopId = shopId;
  currentShopSelectedItem = null;
  currentShopBuyQty = 1;
  closePurchaseDialog();
  const shopWindow = document.getElementById("shop-window");
  if (shopWindow) {
    shopWindow.classList.remove("hidden-window");
    if (typeof bringWindowToFront === "function") bringWindowToFront(shopWindow);
  }
  renderShopPanel(shopId);
}

function renderShopPanel(shopId) {
  const shopPanel = document.getElementById("shop-panel");
  const list = document.getElementById("shop-item-list");
  const detail = document.getElementById("shop-detail-panel");
  const shopWindow = document.getElementById("shop-window");
  if (!shopPanel || !list) return;

  if (!shopId) {
    if (shopWindow) shopWindow.classList.remove("is-shop-list-only");
    shopPanel.classList.add("hidden-town-section");
    list.innerHTML = "";
    if (detail) detail.innerHTML = '<div class="town-empty">左鍵點選商品可查看介紹與購買數量。</div>';
    if (shopWindow) shopWindow.classList.add("hidden-window");
    return;
  }

  const shop = shops?.[shopId];
  if (!shop) {
    shopPanel.classList.remove("hidden-town-section");
    list.innerHTML = '<div class="town-empty">找不到商店資料。</div>';
    if (detail) detail.innerHTML = "";
    return;
  }

  shopPanel.classList.remove("hidden-town-section");
  if (shopWindow) shopWindow.classList.add("is-shop-list-only");
  const title = shopPanel.querySelector(".shop-title");
  if (title) title.textContent = shop.name || "商店";
  const windowTitle = document.getElementById("shop-window-title");
  if (windowTitle) windowTitle.textContent = shop.name || "商店";

  list.innerHTML = "";
  (shop.items || []).forEach(entry => {
    const itemId = normalizeItemId(entry.itemId);
    const item = getItemData(itemId);
    const price = getShopItemPrice(entry, item);

    const row = document.createElement("button");
    row.type = "button";
    row.className = "shop-item-row shop-item-button" + (String(currentShopSelectedItem?.itemId) === String(itemId) ? " is-selected" : "");
    row.onclick = function () { selectShopItem(itemId, price); };

    const iconBox = document.createElement("span");
    iconBox.className = "shop-item-icon";
    const icon = document.createElement("img");
    icon.src = item?.icon || `images/items/${item?.officialId || itemId}.webp`;
    icon.alt = item?.name || ("Item " + itemId);
    icon.onerror = function () { icon.style.display = "none"; };
    iconBox.appendChild(icon);

    const name = document.createElement("span");
    name.className = "shop-item-name";
    name.innerHTML = `<b>${item?.name || ("Item " + itemId)}</b><small>${getItemTypeText(item)}｜${price} Zeny</small>`;

    row.appendChild(iconBox);
    row.appendChild(name);
    list.appendChild(row);
  });

  if (detail) {
    detail.innerHTML = '<div class="town-empty">點選商品後會開啟獨立購買視窗。</div>';
  }
}

function getShopItemPrice(entry, item) {
  return Number(entry?.price || item?.buyPrice || Math.max(1, (item?.sellPrice || 1) * 10));
}

function selectShopItem(itemId, price) {
  currentShopSelectedItem = { itemId, price };
  currentShopBuyQty = 1;
  renderShopPanel(currentShopId);
  openPurchaseDialog(itemId, price);
}

function openPurchaseDialog(itemId, price) {
  currentPurchaseItem = { itemId, price };
  renderPurchaseDialog(itemId, price);
  const win = document.getElementById("purchase-window");
  if (win) {
    win.classList.remove("hidden-window");
    if (typeof centerWindowForMobile === "function") centerWindowForMobile(win);
    if (typeof bringWindowToFront === "function") bringWindowToFront(win);
  }
}

function closePurchaseDialog() {
  const win = document.getElementById("purchase-window");
  if (win) win.classList.add("hidden-window");
  currentPurchaseItem = null;
}

function renderPurchaseDialog(itemId, price) {
  const content = document.getElementById("purchase-content");
  const title = document.getElementById("purchase-window-title");
  if (!content) return;

  const item = getItemData(itemId);
  if (!item) {
    content.innerHTML = '<div class="town-empty">找不到物品資料。</div>';
    return;
  }

  const qty = Math.max(1, Number(currentShopBuyQty || 1));
  const total = Number(price || 0) * qty;
  const descriptionLines = typeof cleanItemDescriptionLines === "function" ? cleanItemDescriptionLines(item) : (Array.isArray(item.description) ? item.description : []);
  const description = descriptionLines.length ? descriptionLines.join("\n") : "沒有更多說明。";
  const renderedDescription = typeof renderROColoredTooltipText === "function"
    ? renderROColoredTooltipText(description)
    : escapeShopHtml(description).replace(/\n/g, "<br>");
  if (title) title.textContent = item.name || "確認購買";

  content.innerHTML = `
    <div class="purchase-card">
      <div class="purchase-head">
        <div class="purchase-icon"><img src="${escapeShopAttr(item.icon || `images/items/${item.officialId || item.id}.webp`)}" alt=""></div>
        <div>
          <div class="purchase-name">${escapeShopHtml(item.name || getItemName(itemId))}</div>
          <div class="purchase-meta">${escapeShopHtml(getItemTypeText(item))}｜單價 ${price} Zeny</div>
        </div>
      </div>
      <div class="purchase-desc">${renderedDescription}</div>
      <div class="purchase-controls">
        <div class="shop-qty-row purchase-qty-row">
          <button type="button" data-purchase-qty="-10">-10</button>
          <button type="button" data-purchase-qty="-1">-</button>
          <input id="purchase-buy-qty" type="number" min="1" max="999" value="${qty}" data-no-drag>
          <button type="button" data-purchase-qty="1">+</button>
          <button type="button" data-purchase-qty="10">+10</button>
        </div>
        <div class="shop-total-row purchase-total-row">總價：<b>${total}</b> Zeny</div>
        <div class="shop-action-row purchase-action-row">
          <button type="button" id="purchase-buy-confirm">確認購買</button>
          <button type="button" id="purchase-buy-cancel">取消</button>
        </div>
      </div>
    </div>
  `;

  content.querySelectorAll("[data-purchase-qty]").forEach(button => {
    button.onclick = function () { changePurchaseBuyQty(Number(button.dataset.purchaseQty || 0)); };
  });
  const qtyInput = content.querySelector("#purchase-buy-qty");
  if (qtyInput) qtyInput.onchange = function () { setPurchaseBuyQty(qtyInput.value); };
  const confirm = content.querySelector("#purchase-buy-confirm");
  if (confirm) confirm.onclick = function () { buyShopItem(itemId, price, currentShopBuyQty); };
  const cancel = content.querySelector("#purchase-buy-cancel");
  if (cancel) cancel.onclick = function () { closePurchaseDialog(); };
}

function changePurchaseBuyQty(delta) {
  setPurchaseBuyQty(Number(currentShopBuyQty || 1) + Number(delta || 0));
}

function setPurchaseBuyQty(value) {
  currentShopBuyQty = Math.max(1, Math.min(999, Math.floor(Number(value || 1))));
  if (currentPurchaseItem) {
    renderPurchaseDialog(currentPurchaseItem.itemId, currentPurchaseItem.price);
  } else if (currentShopSelectedItem) {
    renderPurchaseDialog(currentShopSelectedItem.itemId, currentShopSelectedItem.price);
  }
}

function renderShopItemDetail(itemId, price) {
  const detail = document.getElementById("shop-detail-panel");
  if (!detail) return;

  const item = getItemData(itemId);
  if (!item) {
    detail.innerHTML = '<div class="town-empty">找不到物品資料。</div>';
    return;
  }

  const qty = Math.max(1, Number(currentShopBuyQty || 1));
  const total = price * qty;
  const descriptionLines = typeof cleanItemDescriptionLines === "function" ? cleanItemDescriptionLines(item) : (Array.isArray(item.description) ? item.description : []);
  const description = descriptionLines.length ? descriptionLines.join("\n") : "沒有更多說明。";
  const renderedDescription = typeof renderROColoredTooltipText === "function"
    ? renderROColoredTooltipText(description)
    : escapeShopHtml(description).replace(/\n/g, "<br>");

  detail.innerHTML = `
    <div class="shop-detail-card">
      <div class="shop-detail-head">
        <div class="shop-detail-icon"><img src="${escapeShopAttr(item.icon || `images/items/${item.officialId || item.id}.webp`)}" alt=""></div>
        <div>
          <div class="shop-detail-name">${escapeShopHtml(item.name || getItemName(itemId))}</div>
          <div class="shop-detail-meta">${escapeShopHtml(getItemTypeText(item))}｜單價 ${price} Zeny</div>
        </div>
      </div>
      <div class="shop-detail-desc">${renderedDescription}</div>
      <div class="shop-qty-row">
        <button type="button" data-shop-qty="-10">-10</button>
        <button type="button" data-shop-qty="-1">-</button>
        <input id="shop-buy-qty" type="number" min="1" max="999" value="${qty}" data-no-drag>
        <button type="button" data-shop-qty="1">+</button>
        <button type="button" data-shop-qty="10">+10</button>
      </div>
      <div class="shop-total-row">總價：<b>${total}</b> Zeny</div>
      <div class="shop-action-row">
        <button type="button" id="shop-buy-confirm">確認購買</button>
        <button type="button" id="shop-buy-cancel">取消</button>
      </div>
    </div>
  `;

  detail.querySelectorAll("[data-shop-qty]").forEach(button => {
    button.onclick = function () {
      changeShopBuyQty(Number(button.dataset.shopQty || 0));
    };
  });

  const qtyInput = detail.querySelector("#shop-buy-qty");
  if (qtyInput) {
    qtyInput.onchange = function () {
      setShopBuyQty(qtyInput.value);
    };
  }

  const confirm = detail.querySelector("#shop-buy-confirm");
  if (confirm) confirm.onclick = function () { buyShopItem(itemId, price, currentShopBuyQty); };

  const cancel = detail.querySelector("#shop-buy-cancel");
  if (cancel) cancel.onclick = function () {
    currentShopSelectedItem = null;
    currentShopBuyQty = 1;
    renderShopPanel(currentShopId);
  };
}

function changeShopBuyQty(delta) {
  setShopBuyQty(Number(currentShopBuyQty || 1) + Number(delta || 0));
}

function setShopBuyQty(value) {
  currentShopBuyQty = Math.max(1, Math.min(999, Math.floor(Number(value || 1))));
  if (currentShopSelectedItem) {
    renderShopItemDetail(currentShopSelectedItem.itemId, currentShopSelectedItem.price);
  }
}

function escapeShopHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeShopAttr(text) {
  return escapeShopHtml(text).replace(/`/g, "&#096;");
}

function buyShopItem(itemId, price, qty = 1) {
  const item = getItemData(itemId);
  if (!item) {
    addBattleLog("找不到物品資料：" + itemId);
    return;
  }

  const amount = Math.max(1, Math.floor(Number(qty || 1)));
  const total = Number(price || 0) * amount;
  if (!spendZeny(total)) return;

  addItem({ id: item.id, name: item.name }, amount);
  addBattleLog("購買：「" + item.name + "」x" + amount + "。");

  updatePlayerUI();
  updateInventoryUI();
  renderShopPanel(currentShopId);
  closePurchaseDialog();
  saveGame();
}

function openJobChangeNpc(npc) {
  const rules = (jobChangeRules || []).filter(rule => rule.npcId === npc.id && rule.fromJob === player.jobKey);

  if (!rules.length) {
    addBattleLog(npc.name + "：目前沒有適合你的轉職項目。");
    return;
  }

  const panel = document.getElementById("shop-panel");
  const list = document.getElementById("shop-item-list");
  const detail = document.getElementById("shop-detail-panel");
  const shopWindow = document.getElementById("shop-window");
  if (!panel || !list) return;

  currentShopId = null;
  currentShopSelectedItem = null;
  closePurchaseDialog();
  if (shopWindow) {
    shopWindow.classList.remove("is-shop-list-only");
    shopWindow.classList.remove("hidden-window");
    if (typeof bringWindowToFront === "function") bringWindowToFront(shopWindow);
  }
  panel.classList.remove("hidden-town-section");
  const title = panel.querySelector(".shop-title");
  if (title) title.textContent = npc.name + "｜轉職";
  const windowTitle = document.getElementById("shop-window-title");
  if (windowTitle) windowTitle.textContent = npc.name + "｜轉職";
  if (detail) detail.innerHTML = '<div class="town-empty">選擇轉職項目後按下轉職。</div>';

  list.innerHTML = "";
  rules.forEach(rule => {
    const targetJob = getJobData(rule.toJob);
    const row = document.createElement("div");
    row.className = "shop-item-row job-change-row";

    const requirement = typeof describeJobConstitutionRequirement === "function"
      ? describeJobConstitutionRequirement(rule)
      : { requiredBaseLevel: rule.requiredBaseLevel || 1, requiredJobLevel: rule.requiredJobLevel || 1, skillText: "" };
    const constitutionCheck = typeof validateJobConstitution === "function"
      ? validateJobConstitution(rule, rule.toJob)
      : { ok: true, message: "" };
    const enabled = Boolean(rule.enabled) && constitutionCheck.ok && targetJob && !targetJob.locked;

    const info = document.createElement("div");
    info.className = "shop-item-name";
    const blockText = constitutionCheck.ok ? "" : `｜${constitutionCheck.message}`;
    const skillText = requirement.skillText ? `｜技能：${requirement.skillText}` : "";
    info.innerHTML = `<b>${targetJob?.name || rule.toJob}</b><small>需要 Base ${requirement.requiredBaseLevel || 1} / Job ${requirement.requiredJobLevel || 1}${skillText}${rule.enabled ? "" : "｜未開放"}${blockText}</small>`;

    const btn = document.createElement("button");
    btn.textContent = enabled ? "轉職" : "不可轉職";
    btn.disabled = !enabled;
    btn.onclick = function () { attemptTownJobChange(rule.id); };

    row.appendChild(info);
    row.appendChild(btn);
    list.appendChild(row);
  });
}

function attemptTownJobChange(ruleId) {
  const rule = (jobChangeRules || []).find(item => item.id === ruleId);
  if (!rule) return;

  if (!rule.enabled) {
    addBattleLog("這個轉職項目尚未開放。 ");
    return;
  }

  if (player.jobKey !== rule.fromJob) {
    addBattleLog("目前職業不符合轉職條件。 ");
    return;
  }

  const constitutionCheck = typeof validateJobConstitution === "function"
    ? validateJobConstitution(rule, rule.toJob)
    : { ok: true, message: "" };
  if (!constitutionCheck.ok) {
    addBattleLog(constitutionCheck.message);
    return;
  }

  changeJob(rule.toJob, rule);
  updateTownUI();
}

function resetWorldCameraForTown(battleField) {
  if (!battleField) return;

  // V0.9.78j：回城時完整退出 World Camera / Large Map 狀態。
  // 避免野外 4608×4608 background-size、camera offset、world sprite CSS 殘留，
  // 造成城鎮背景被放大成模糊巨圖。
  battleField.classList.remove("world-camera-mode", "large-map-mode");
  battleField.classList.add("city-mode");
  battleField.dataset.worldCamera = "false";
  delete battleField.dataset.mapId;

  [
    "--world-camera-width",
    "--world-camera-height",
    "--world-width",
    "--world-height",
    "--world-player-width",
    "--world-player-height"
  ].forEach(name => battleField.style.removeProperty(name));

  battleField.style.backgroundSize = "cover";
  battleField.style.backgroundPosition = "center center";
  battleField.style.backgroundRepeat = "no-repeat";
}

function updateTownBackground(city) {
  const battleField = document.getElementById("battle-field") || document.getElementById("battle-area");
  if (!battleField) return;

  resetWorldCameraForTown(battleField);

  const playerImage = document.getElementById("playerImage");
  if (playerImage) {
    playerImage.src = "images/player/male/idle/0001.png";
  }

  if (typeof renderCityPlayerSprite === "function") {
    renderCityPlayerSprite();
  }

  if (city && city.background) {
    battleField.style.backgroundImage = `linear-gradient(rgba(20, 20, 20, 0.25), rgba(20, 20, 20, 0.25)), url("${city.background}")`;
  }
}
