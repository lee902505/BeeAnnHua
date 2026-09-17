(() => {
  const state = { fortunes: [], current: null, drawing: false };
  const byId = (id) => document.getElementById(id);

  function localDateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function yesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return localDateKey(d);
  }

  function readHistory() {
    try {
      return JSON.parse(localStorage.getItem(FORTUNE_CONFIG.storageKey) || "{}");
    } catch {
      return {};
    }
  }

  function writeHistory(history) {
    // Keep recent local records bounded so this daily feature never grows forever.
    const entries = Object.entries(history || {})
      .filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key))
      .sort((a,b) => b[0].localeCompare(a[0]))
      .slice(0, 60);

    localStorage.setItem(FORTUNE_CONFIG.storageKey, JSON.stringify(Object.fromEntries(entries)));
  }

  function savedFortune(record) {
    if (record?.fortune && typeof record.fortune === 'object') return record.fortune;
    return state.fortunes.find((item) => item.id === record?.id) || null;
  }

  function upgradeSavedFortune(history, dateKey, record, fortune) {
    if (!record || record.fortune || !fortune) return;
    history[dateKey] = {
      ...record,
      snapshotVersion:1,
      fortune
    };
    writeHistory(history);
  }

  function secureRandomInt(maxExclusive) {
    const maxUint = 0x100000000;
    const limit = maxUint - (maxUint % maxExclusive);
    const arr = new Uint32Array(1);
    do {
      crypto.getRandomValues(arr);
    } while (arr[0] >= limit);
    return arr[0] % maxExclusive;
  }

  function pickRandomFortune() {
    return state.fortunes[secureRandomInt(state.fortunes.length)];
  }

  function stars(n) {
    return `${"★".repeat(n)}${"☆".repeat(5 - n)}`;
  }

  function levelKey(level) {
    return ({
      "上上": "best",
      "上吉": "great",
      "中吉": "good",
      "小吉": "mild",
      "平": "neutral",
      "中下": "low",
      "慎行": "caution"
    })[level] || "neutral";
  }

  function render(fortune, extra = {}) {
    state.current = fortune;
    byId("resultEmpty").hidden = true;
    byId("fortuneResult").hidden = false;

    byId("fortuneNo").textContent = `第 ${String(fortune.id).padStart(2, "0")} 签 · ${fortune.jiazi}`;
    const level = byId("fortuneLevel");
    level.textContent = fortune.level;
    level.dataset.level = levelKey(fortune.level);
    byId("fortuneKeyword").textContent = fortune.keyword;
    byId("fortuneScore").textContent = String(fortune.score);
    byId("fortunePoem").innerHTML = fortune.poem.map((line) => `<span>${line}</span>`).join("");
    byId("fortuneSummary").textContent = fortune.summary;
    byId("loveText").textContent = fortune.love;
    byId("careerText").textContent = fortune.career;
    byId("wealthText").textContent = fortune.wealth;
    byId("socialText").textContent = fortune.social;
    byId("adviceText").textContent = fortune.advice;
    byId("luckyColor").textContent = fortune.luckyColor;
    byId("luckyNumber").textContent = fortune.luckyNumber;
    byId("luckyTime").textContent = fortune.luckyTime;
    byId("overallStars").textContent = stars(fortune.ratings.overall);
    byId("loveStars").textContent = stars(fortune.ratings.love);
    byId("careerStars").textContent = stars(fortune.ratings.career);
    byId("wealthStars").textContent = stars(fortune.ratings.wealth);

    const easter = byId("easterEgg");
    easter.hidden = !extra.repeat;
    if (extra.repeat) easter.textContent = extra.repeatText;

    byId("fortuneResult").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function drawFree() {
    const fortune = pickRandomFortune();
    const previous = Number(localStorage.getItem(FORTUNE_CONFIG.lastDrawKey));
    localStorage.setItem(FORTUNE_CONFIG.lastDrawKey, String(fortune.id));
    render(fortune, {
      repeat: previous === fortune.id,
      repeatText: "又是同一支？六十分之一的回响，被你撞见了。星辰今天似乎特别坚持。"
    });
  }

  function sendFortuneBark(fortune, repeated) {
    if (!window.XingchenBark?.send) return;
    const player = window.XingchenPlayer?.label?.() || '未命名玩家';
    const body = [
      `玩家：${player}`,
      `日期：${localDateKey()}`,
      `第 ${String(fortune.id).padStart(2,'0')} 签 · ${fortune.jiazi}`,
      `${fortune.level}｜${fortune.keyword}｜${fortune.score}/100`,
      '',
      `总览：${fortune.summary}`,
      `感情：${fortune.love}`,
      `事业／学业：${fortune.career}`,
      `财运：${fortune.wealth}`,
      `人际：${fortune.social}`,
      `建议：${fortune.advice}`,
      `幸运色：${fortune.luckyColor}｜幸运数字：${fortune.luckyNumber}｜幸运时间：${fortune.luckyTime}`,
      repeated ? '彩蛋：连续两天抽到同一支签。' : ''
    ].filter(Boolean).join('\n');

    window.XingchenBark.send({
      title:'🌟 星辰日记｜每日运势',
      subtitle:player,
      body,
      group:'星辰日记·每日运势'
    });
  }

  function drawDaily() {
    const today = localDateKey();
    const history = readHistory();

    if (history[today]) {
      const existing = savedFortune(history[today]);
      if (existing) {
        upgradeSavedFortune(history, today, history[today], existing);
        render(existing, {
          repeat: history[today].repeat === true,
          repeatText: history[today].repeatText || ""
        });
        return;
      }
    }

    const fortune = pickRandomFortune();
    const yesterday = history[yesterdayKey()];
    const repeated = Boolean(yesterday && yesterday.id === fortune.id);
    const repeatText = repeated
      ? "连续两天都是同一支签。星辰这么坚持，今天可要认真看一眼了——至于乐透，就当我们之间的小玩笑。"
      : "";

    history[today] = {
      id: fortune.id,
      drawnAt: new Date().toISOString(),
      repeat: repeated,
      repeatText,
      snapshotVersion:1,
      fortune
    };
    writeHistory(history);
    render(fortune, { repeat: repeated, repeatText });
    sendFortuneBark(fortune, repeated);
  }

  function finishDraw() {
    if (FORTUNE_CONFIG.dailyLockEnabled) drawDaily();
    else drawFree();
  }

  function draw() {
    if (!window.XingchenPlayer?.hasProfile?.()) {
      window.XingchenPlayer?.ensure?.(() => draw());
      return;
    }
    if (!state.fortunes.length || state.drawing) return;

    const button = byId("drawFortuneBtn");
    const stage = byId("resultEmpty");
    state.drawing = true;
    button?.classList.add("is-drawing");
    stage?.classList.add("is-drawing");
    if (button) button.disabled = true;

    const ritualDelay = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? 80 : 1180;
    window.setTimeout(() => {
      finishDraw();
      state.drawing = false;
      button?.classList.remove("is-drawing");
      stage?.classList.remove("is-drawing");
      if (button && !byId("resultEmpty")?.hidden) button.disabled = false;
    }, ritualDelay);
  }

  function nextLocalMidnight(now = new Date()) {
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return next;
  }

  function resetCountdownText() {
    const target = nextLocalMidnight();
    const remaining = Math.max(0, target.getTime() - Date.now());
    const totalSeconds = Math.floor(remaining / 1000);
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    const el = byId("fortuneResetCountdown");
    if (el) el.textContent = `当地时间 · ${h}:${m}:${s}`;
  }

  function resetForNewDay() {
    state.current = null;
    state.drawing = false;
    byId("fortuneResult").hidden = true;
    byId("resultEmpty").hidden = false;
    byId("easterEgg").hidden = true;
    byId("drawFortuneBtn").disabled = !state.fortunes.length;
  }

  function scheduleLocalMidnightReset() {
    resetCountdownText();
    setInterval(resetCountdownText, 1000);

    const delay = nextLocalMidnight().getTime() - Date.now() + 80;
    setTimeout(() => {
      resetForNewDay();
      scheduleLocalMidnightReset();
    }, delay);
  }

  async function init() {
    try {
      const response = await fetch("../data/fortune/fortunes.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      state.fortunes = await response.json();
      byId("drawFortuneBtn").disabled = false;
      scheduleLocalMidnightReset();

      if (FORTUNE_CONFIG.dailyLockEnabled) {
        const saved = readHistory()[localDateKey()];
        if (saved) {
          const existing = savedFortune(saved);
          if (existing) {
            const history = readHistory();
            upgradeSavedFortune(history, localDateKey(), saved, existing);
            render(existing, {
              repeat: saved.repeat === true,
              repeatText: saved.repeatText || ""
            });
          }
        }
      }
    } catch (error) {
      console.error(error);
      byId("loadError").hidden = false;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    byId("drawFortuneBtn")?.addEventListener("click", draw);
    byId("fortuneTopBtn")?.addEventListener("click", () => window.scrollTo({top:0,behavior:"smooth"}));
    init();
  });
})();
