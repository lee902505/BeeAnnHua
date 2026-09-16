(() => {
  const state = { fortunes: [], current: null };
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
    localStorage.setItem(FORTUNE_CONFIG.storageKey, JSON.stringify(history));
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

    byId("drawAgainBtn").hidden = FORTUNE_CONFIG.dailyLockEnabled;
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

  function drawDaily() {
    const today = localDateKey();
    const history = readHistory();

    if (history[today]) {
      const existing = state.fortunes.find((item) => item.id === history[today].id);
      if (existing) {
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
      repeatText
    };
    writeHistory(history);
    render(fortune, { repeat: repeated, repeatText });
  }

  function draw() {
    if (!state.fortunes.length) return;
    if (FORTUNE_CONFIG.dailyLockEnabled) drawDaily();
    else drawFree();
  }

  async function init() {
    try {
      const response = await fetch("../data/fortune/fortunes.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      state.fortunes = await response.json();
      byId("drawFortuneBtn").disabled = false;

      if (FORTUNE_CONFIG.dailyLockEnabled) {
        const saved = readHistory()[localDateKey()];
        if (saved) {
          const existing = state.fortunes.find((item) => item.id === saved.id);
          if (existing) {
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
    byId("drawAgainBtn")?.addEventListener("click", draw);
    init();
  });
})();
