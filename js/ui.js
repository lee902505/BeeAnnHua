//=======================================
// UI Skeleton v0.1：視窗開關 / 拖曳 / 位置記憶
//=======================================
const UI_POS_KEY = "ro_web_ui_positions_v0_9_72c";
let topZIndex = 40;

document.addEventListener("DOMContentLoaded", () => {
  initToggleButtons();
  initDraggableWindows();
  initCloseButtons();
  initGameTooltips();
  initCurrencyDetailPopup();
});

window.addEventListener("resize", () => {
  if (!isMobileViewport()) return;
  document.querySelectorAll(".draggable-window:not(.hidden-window)").forEach(centerWindowForMobile);
});
window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    if (!isMobileViewport()) return;
    document.querySelectorAll(".draggable-window:not(.hidden-window)").forEach(centerWindowForMobile);
  }, 250);
});


function initToggleButtons() {
  document.querySelectorAll(".ui-toggle").forEach(button => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.target;
      toggleWindow(targetId);
      updateToggleButtonStates();
    });
  });
  updateToggleButtonStates();
}

function initCloseButtons() {
  document.querySelectorAll(".window-close").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      if (typeof hideGameTooltip === "function") hideGameTooltip();
      const targetId = button.dataset.target;
      const target = document.getElementById(targetId);
      if (target) target.classList.add("hidden-window");
      if (targetId === "skill-window" && typeof clearPendingSkillAdds === "function") {
        clearPendingSkillAdds();
        if (typeof updateSkillUI === "function") updateSkillUI();
      }
      updateToggleButtonStates();
    });
  });
}

function isMobileViewport() {
  return window.matchMedia?.("(max-width: 900px)")?.matches || window.innerWidth <= 900;
}

function centerWindowForMobile(win) {
  if (!win || !isMobileViewport()) return;
  const root = document.getElementById("battle-field");
  const rootWidth = root?.clientWidth || window.innerWidth;
  const rootHeight = root?.clientHeight || window.innerHeight;
  const width = Math.min(win.offsetWidth || 360, rootWidth - 16);
  const height = Math.min(win.offsetHeight || 420, rootHeight - 16);
  const x = Math.max(8, Math.round((rootWidth - width) / 2));
  const y = Math.max(8, Math.round((rootHeight - height) / 2));
  win.style.setProperty("left", `${x}px`, "important");
  win.style.setProperty("top", `${y}px`, "important");
  win.style.setProperty("right", "auto", "important");
  win.style.setProperty("transform", "none", "important");
}

function toggleWindow(id) {
  if (typeof hideGameTooltip === "function") hideGameTooltip();
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.toggle("hidden-window");
  if (!win.classList.contains("hidden-window")) centerWindowForMobile(win);
  bringWindowToFront(win);
}

function initDraggableWindows() {
  const saved = getSavedWindowPositions();
  document.querySelectorAll(".draggable-window").forEach(win => {
    const defaultX = Number(win.dataset.defaultX || 40);
    const defaultY = Number(win.dataset.defaultY || 40);
    const pos = saved[win.id] || { x: defaultX, y: defaultY };
    win.style.left = `${pos.x}px`;
    win.style.top = `${pos.y}px`;
    if (isMobileViewport()) centerWindowForMobile(win);
    if (win.id === "basic-skill-info-window") {
      win.style.setProperty("--basic-info-left", `${pos.x}px`);
      win.style.setProperty("--basic-info-top", `${pos.y}px`);
    }

    const handle = win.querySelector(".drag-handle") || win;
    handle.addEventListener("pointerdown", event => startDrag(event, win));
    win.addEventListener("pointerdown", () => bringWindowToFront(win));
  });
}

function startDrag(event, win) {
  if (typeof hideGameTooltip === "function") hideGameTooltip();
  if (event.button !== undefined && event.button !== 0) return;
  if (event.target.closest("button, input, select, textarea, a, [data-no-drag]")) return;
  event.preventDefault();
  bringWindowToFront(win);

  const root = document.getElementById("battle-field");
  if (!root) return;
  const rootRect = root.getBoundingClientRect();
  const winRect = win.getBoundingClientRect();

  // V0.9.64b：修正 CSS zoom / --ui-scale 下第一次拖曳會往左上角跳一下。
  // getBoundingClientRect() 取得的是縮放後尺寸；style.left/top 使用的是未縮放座標，兩者必須換算。
  const visualScale = win.offsetWidth ? (winRect.width / win.offsetWidth) : 1;
  const scale = Number.isFinite(visualScale) && visualScale > 0 ? visualScale : 1;
  const offsetX = (event.clientX - winRect.left) / scale;
  const offsetY = (event.clientY - winRect.top) / scale;

  if (event.pointerId !== undefined && win.setPointerCapture) {
    try { win.setPointerCapture(event.pointerId); } catch (error) {}
  }

  function onMove(moveEvent) {
    let x = (moveEvent.clientX - rootRect.left) / scale - offsetX;
    let y = (moveEvent.clientY - rootRect.top) / scale - offsetY;

    // 至少保留一小段標題區在畫面內，避免面板被拖到找不回來。
    const keepVisible = 48;
    const maxX = (root.clientWidth / scale) - keepVisible;
    const maxY = (root.clientHeight / scale) - keepVisible;
    x = Math.max(-(win.offsetWidth - keepVisible), Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));

    const px = Math.round(x);
    const py = Math.round(y);
    win.style.left = `${px}px`;
    win.style.top = `${py}px`;
    if (win.id === "basic-skill-info-window") {
      win.style.setProperty("--basic-info-left", `${px}px`);
      win.style.setProperty("--basic-info-top", `${py}px`);
    }
  }

  function onUp(upEvent) {
    if (upEvent?.pointerId !== undefined && win.releasePointerCapture) {
      try { win.releasePointerCapture(upEvent.pointerId); } catch (error) {}
    }
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    document.removeEventListener("pointercancel", onUp);
    saveWindowPosition(win);
  }

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", onUp);
}

function bringWindowToFront(win) {
  topZIndex += 1;
  win.style.zIndex = topZIndex;
}

function getSavedWindowPositions() {
  try {
    return JSON.parse(localStorage.getItem(UI_POS_KEY)) || {};
  } catch (error) {
    return {};
  }
}

function saveWindowPosition(win) {
  const saved = getSavedWindowPositions();
  const cssLeft = parseInt(win.style.getPropertyValue("--basic-info-left"), 10);
  const cssTop = parseInt(win.style.getPropertyValue("--basic-info-top"), 10);
  saved[win.id] = {
    x: Number.isFinite(cssLeft) ? cssLeft : (parseInt(win.style.left, 10) || 0),
    y: Number.isFinite(cssTop) ? cssTop : (parseInt(win.style.top, 10) || 0)
  };
  localStorage.setItem(UI_POS_KEY, JSON.stringify(saved));
}


function updateToggleButtonStates() {
  document.querySelectorAll(".ui-toggle").forEach(button => {
    const target = document.getElementById(button.dataset.target);
    button.classList.toggle("is-open", Boolean(target && !target.classList.contains("hidden-window")));
  });
}

//=======================================
// v0.9.4：技能 / 素質 tooltip
//=======================================
let activeTooltipTarget = null;

function getTooltipElement() {
  let tooltip = document.getElementById("game-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "game-tooltip";
    tooltip.className = "game-tooltip";
    document.body.appendChild(tooltip);
  }
  return tooltip;
}

function escapeTooltipText(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderROColoredTooltipText(text) {
  const escaped = escapeTooltipText(text);
  const parts = escaped.split(/(\^[0-9A-Fa-f]{6})/g);
  let html = "";
  let openColor = false;

  parts.forEach(part => {
    const match = part.match(/^\^([0-9A-Fa-f]{6})$/);
    if (!match) {
      html += part;
      return;
    }

    const color = match[1].toUpperCase();
    if (openColor) {
      html += "</span>";
      openColor = false;
    }
    if (color !== "000000") {
      html += `<span class="ro-text-color" style="color:#${color}">`;
      openColor = true;
    }
  });

  if (openColor) html += "</span>";
  return html.replace(/\n/g, "<br>");
}

function showGameTooltip(text, clientX, clientY) {
  if (!text) return;
  const tooltip = getTooltipElement();
  tooltip.innerHTML = renderROColoredTooltipText(text);
  tooltip.classList.add("is-visible");
  moveGameTooltip(clientX, clientY);
}

function moveGameTooltip(clientX, clientY) {
  const tooltip = getTooltipElement();
  if (!tooltip.classList.contains("is-visible")) return;
  const margin = 14;
  const rect = tooltip.getBoundingClientRect();
  let x = Number(clientX || 0) + margin;
  let y = Number(clientY || 0) + margin;
  if (x + rect.width + 8 > window.innerWidth) x = Math.max(8, Number(clientX || 0) - rect.width - margin);
  if (y + rect.height + 8 > window.innerHeight) y = Math.max(8, Number(clientY || 0) - rect.height - margin);
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function hideGameTooltip() {
  const tooltip = getTooltipElement();
  tooltip.classList.remove("is-visible");
  activeTooltipTarget = null;
}

function initGameTooltips() {
  document.addEventListener("mouseover", event => {
    const target = event.target.closest("[data-tooltip]");
    if (!target) return;
    activeTooltipTarget = target;
    showGameTooltip(target.dataset.tooltip, event.clientX, event.clientY);
  });

  document.addEventListener("mousemove", event => {
    if (activeTooltipTarget) moveGameTooltip(event.clientX, event.clientY);
  });

  document.addEventListener("mouseout", event => {
    const target = event.target.closest("[data-tooltip]");
    if (!target) return;
    if (!event.relatedTarget || !target.contains(event.relatedTarget)) hideGameTooltip();
  });

  document.addEventListener("click", event => {
    const target = event.target.closest("[data-tooltip]");
    if (!target) {
      hideGameTooltip();
      return;
    }
    // 手機 / 平板沒有 hover，點一下文字或技能 icon 也能看說明。
    showGameTooltip(target.dataset.tooltip, event.clientX || 24, event.clientY || 24);
    activeTooltipTarget = target;
  });
}


// V0.9.72c：手機金幣列空間不足時，點擊資源列顯示完整數量。
function initCurrencyDetailPopup() {
  const topBar = document.getElementById("top-bar");
  if (!topBar || topBar.dataset.currencyDetailBound === "1") return;
  topBar.dataset.currencyDetailBound = "1";
  topBar.setAttribute("role", "button");
  topBar.setAttribute("tabindex", "0");
  topBar.title = "點擊顯示完整貨幣數量";

  const show = event => {
    const z = Number(player?.zeny || 0).toLocaleString("zh-TW");
    const b = Number(player?.blueGem || 0).toLocaleString("zh-TW");
    const r = Number(player?.redGem || 0).toLocaleString("zh-TW");
    const text = `Zeny：${z}<br>藍寶石：${b}<br>紅寶石：${r}`;
    if (typeof showGameTooltip === "function") {
      const point = event?.touches?.[0] || event;
      showGameTooltip(text, point?.clientX || window.innerWidth - 180, point?.clientY || 48);
    } else {
      alert(`Zeny：${z}\n藍寶石：${b}\n紅寶石：${r}`);
    }
  };

  topBar.addEventListener("click", show);
  topBar.addEventListener("touchstart", event => {
    if (event.cancelable) event.preventDefault();
    show(event);
  }, { passive: false });
  topBar.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") show(event);
  });
}
