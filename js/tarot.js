(() => {
  const state = {
    cards: [],
    meanings: new Map(),
    topics: [],
    spreads: [],
    selectedTopic: 'general',
    selectedSpread: 'single',
    currentDraw: []
  };

  const byId = (id) => document.getElementById(id);

  const UI = {
    'zh-CN': {
      brand: '星辰日记',
      back: '← 返回首页',
      title: '塔罗牌占卜',
      intro: '先选择你想看的主题与牌阵。每一张牌都会结合牌位、正逆位与问题主题解读；三张与五张牌还会进一步分析大阿尔克那比例、正逆位分布、花色与元素集中，以及前后牌面的发展关系。',
      topicHeading: '选择问题',
      topicHint: '先选择你想询问的方向，同一张牌在不同问题里会强调不同面向。',
      spreadHeading: '选择类型',
      spreadHint: '单张看核心；本周指引看近期走势；本月指引看整月发展。',
      draw: '开始抽盘',
      drawHint: '在心里确认问题，默念三次，然后点击牌堆',
      redraw: '重新抽牌 ↻',
      resultTitle: '你的牌阵',
      combinationLabel: '整体组合解读',
      combinationTitle: '把牌连起来看',
      storyHeading: '牌面故事',
      structureHeading: '结构重点',
      finalAdviceHeading: '这组牌给你的建议',
      upright: '正位',
      reversed: '逆位',
      cardMeaning: '牌意',
      topicLens: '主题解读',
      cardAdvice: '这张牌的提醒',
      major: '大阿尔克那',
      minor: '小阿尔克那',
      loadError: '牌库暂时无法读取，请确认你正在使用 Go Live 或 GitHub Pages 开启网站。',
      scrollTop: '回到顶部',
      bottomHome: '返回首页'
    },
    'zh-TW': {
      brand: '星辰日記',
      back: '← 返回首頁',
      title: '塔羅牌占卜',
      intro: '先選擇你想看的主題與牌陣。每一張牌都會結合牌位、正逆位與問題主題解讀；三張與五張牌還會進一步分析大阿爾克那比例、正逆位分布、花色與元素集中，以及前後牌面的發展關係。',
      topicHeading: '選擇問題',
      topicHint: '先選擇你想詢問的方向，同一張牌在不同問題裡會強調不同面向。',
      spreadHeading: '選擇類型',
      spreadHint: '單張看核心；本週指引看近期走勢；本月指引看整月發展。',
      draw: '開始抽盤',
      drawHint: '在心裡確認問題，默念三次，然後點擊牌堆',
      redraw: '重新抽牌 ↻',
      resultTitle: '你的牌陣',
      combinationLabel: '整體組合解讀',
      combinationTitle: '把牌連起來看',
      storyHeading: '牌面故事',
      structureHeading: '結構重點',
      finalAdviceHeading: '這組牌給你的建議',
      upright: '正位',
      reversed: '逆位',
      cardMeaning: '牌意',
      topicLens: '主題解讀',
      cardAdvice: '這張牌的提醒',
      major: '大阿爾克那',
      minor: '小阿爾克那',
      loadError: '牌庫暫時無法讀取，請確認你正在使用 Go Live 或 GitHub Pages 開啟網站。',
      scrollTop: '回到頂部',
      bottomHome: '返回首頁'
    },
    'en': {
      brand: 'Stellar Diary',
      back: '← Home',
      title: 'Tarot Reading',
      intro: 'Choose a topic and a spread first. Each card is read through its position, orientation and question theme. Three- and five-card spreads also examine Major Arcana concentration, upright/reversed balance, suit and element emphasis, and the narrative flow across the spread.',
      topicHeading: 'Choose a question',
      topicHint: 'Choose the area you want to ask about. The same card can emphasize different facets in different questions.',
      spreadHeading: 'Choose a reading type',
      spreadHint: 'One card for the core; weekly guidance for the near term; monthly guidance for the month ahead.',
      draw: 'Start reading',
      drawHint: 'Confirm your question in your mind, repeat it three times, then click the deck',
      redraw: 'Draw again ↻',
      resultTitle: 'Your spread',
      combinationLabel: 'Combined reading',
      combinationTitle: 'Read the cards as one story',
      storyHeading: 'Narrative',
      structureHeading: 'Structural signals',
      finalAdviceHeading: 'Advice from this spread',
      upright: 'Upright',
      reversed: 'Reversed',
      cardMeaning: 'Card meaning',
      topicLens: 'Topic lens',
      cardAdvice: 'Card advice',
      major: 'Major Arcana',
      minor: 'Minor Arcana',
      loadError: 'The tarot data could not be loaded. Please open the site through Go Live or GitHub Pages.',
      scrollTop: 'Back to top',
      bottomHome: 'Back home'
    }
  };

  const suitMeta = {
    cups: {
      names: {'zh-CN':'圣杯','zh-TW':'聖杯','en':'Cups'},
      element: 'water',
      elementNames: {'zh-CN':'水','zh-TW':'水','en':'Water'}
    },
    pentacles: {
      names: {'zh-CN':'星币','zh-TW':'星幣','en':'Pentacles'},
      element: 'earth',
      elementNames: {'zh-CN':'土','zh-TW':'土','en':'Earth'}
    },
    swords: {
      names: {'zh-CN':'宝剑','zh-TW':'寶劍','en':'Swords'},
      element: 'air',
      elementNames: {'zh-CN':'风','zh-TW':'風','en':'Air'}
    },
    wands: {
      names: {'zh-CN':'权杖','zh-TW':'權杖','en':'Wands'},
      element: 'fire',
      elementNames: {'zh-CN':'火','zh-TW':'火','en':'Fire'}
    }
  };

  const topicSuitLens = {
    general: {
      major: {
        'zh-CN':'这张大牌更像在提醒你：眼前不是单一小事件，而是一个值得认真面对的阶段性课题。',
        'zh-TW':'這張大牌更像在提醒你：眼前不是單一小事件，而是一個值得認真面對的階段性課題。',
        'en':'As a Major Arcana card, this points to a broader life theme rather than a small isolated event.'
      },
      cups: {'zh-CN':'这里更强调感受、关系与内在满足感。','zh-TW':'這裡更強調感受、關係與內在滿足感。','en':'This emphasizes feelings, relationships and inner fulfillment.'},
      wands: {'zh-CN':'这里更强调行动、动力、勇气与主动创造。','zh-TW':'這裡更強調行動、動力、勇氣與主動創造。','en':'This emphasizes action, drive, courage and initiative.'},
      swords: {'zh-CN':'这里更强调想法、沟通、判断与需要面对的矛盾。','zh-TW':'這裡更強調想法、溝通、判斷與需要面對的矛盾。','en':'This emphasizes thought, communication, judgment and tensions to address.'},
      pentacles: {'zh-CN':'这里更强调现实条件、稳定度、资源与长期累积。','zh-TW':'這裡更強調現實條件、穩定度、資源與長期累積。','en':'This emphasizes practical conditions, stability, resources and long-term building.'}
    },
    love: {
      major: {'zh-CN':'在感情里，这张大牌通常把焦点拉回关系中的关键课题、重要选择或成长阶段。','zh-TW':'在感情裡，這張大牌通常把焦點拉回關係中的關鍵課題、重要選擇或成長階段。','en':'In love, this Major Arcana card highlights a defining relationship lesson, choice or growth phase.'},
      cups: {'zh-CN':'感情面重点在情绪流动、亲密感、回应与彼此是否真的被理解。','zh-TW':'感情面重點在情緒流動、親密感、回應與彼此是否真的被理解。','en':'In love, focus on emotional flow, intimacy, responsiveness and whether both sides feel understood.'},
      wands: {'zh-CN':'感情面重点在吸引力、主动程度、热度以及双方是否愿意推动关系。','zh-TW':'感情面重點在吸引力、主動程度、熱度以及雙方是否願意推動關係。','en':'In love, focus on attraction, initiative, chemistry and willingness to move the relationship forward.'},
      swords: {'zh-CN':'感情面重点在沟通、界线、误解与那些一直没有说清楚的话。','zh-TW':'感情面重點在溝通、界線、誤解與那些一直沒有說清楚的話。','en':'In love, focus on communication, boundaries, misunderstandings and what remains unsaid.'},
      pentacles: {'zh-CN':'感情面重点在安全感、实际投入、稳定性，以及两个人能不能把关系落到生活里。','zh-TW':'感情面重點在安全感、實際投入、穩定性，以及兩個人能不能把關係落到生活裡。','en':'In love, focus on security, tangible effort, stability and how well the bond works in real life.'}
    },
    career: {
      major: {'zh-CN':'在事业里，这张大牌更像一个转折讯号：你的方向、定位或重要决定正在被放大。','zh-TW':'在事業裡，這張大牌更像一個轉折訊號：你的方向、定位或重要決定正在被放大。','en':'In career, this Major Arcana card magnifies a turning point involving direction, identity or an important decision.'},
      cups: {'zh-CN':'事业面重点在团队关系、工作满足感、合作气氛与价值认同。','zh-TW':'事業面重點在團隊關係、工作滿足感、合作氣氛與價值認同。','en':'In career, focus on teamwork, satisfaction, collaboration and alignment of values.'},
      wands: {'zh-CN':'事业面重点在机会、执行、竞争力、领导与把想法真正推起来。','zh-TW':'事業面重點在機會、執行、競爭力、領導與把想法真正推起來。','en':'In career, focus on opportunity, execution, competitiveness, leadership and momentum.'},
      swords: {'zh-CN':'事业面重点在策略、沟通、判断、压力与必须做出的清晰选择。','zh-TW':'事業面重點在策略、溝通、判斷、壓力與必須做出的清晰選擇。','en':'In career, focus on strategy, communication, judgment, pressure and clear decisions.'},
      pentacles: {'zh-CN':'事业面重点在资源、薪酬、技能累积、稳定度与长期可持续性。','zh-TW':'事業面重點在資源、薪酬、技能累積、穩定度與長期可持續性。','en':'In career, focus on resources, compensation, skill-building, stability and sustainability.'}
    },
    money: {
      major: {'zh-CN':'在财务问题里，这张大牌提醒你先看长期方向与价值判断，不要只盯着眼前数字。','zh-TW':'在財務問題裡，這張大牌提醒你先看長期方向與價值判斷，不要只盯著眼前數字。','en':'In money matters, this Major Arcana card asks you to consider long-term direction and values, not only the immediate numbers.'},
      cups: {'zh-CN':'财务面要留意情绪性消费、人情支出，以及「想要」和「真正需要」之间的差别。','zh-TW':'財務面要留意情緒性消費、人情支出，以及「想要」和「真正需要」之間的差別。','en':'For money, watch emotional spending, social expenses and the difference between wants and needs.'},
      wands: {'zh-CN':'财务面与主动开源、机会判断和风险承受有关；有冲劲，也要保留计算。','zh-TW':'財務面與主動開源、機會判斷和風險承受有關；有衝勁，也要保留計算。','en':'For money, this points to earning initiatives, opportunity judgment and risk tolerance—keep the drive, but do the math.'},
      swords: {'zh-CN':'财务面重点在数字、合约、判断与风险控制；越需要冷静，越不要凭一时情绪决定。','zh-TW':'財務面重點在數字、合約、判斷與風險控制；越需要冷靜，越不要憑一時情緒決定。','en':'For money, focus on numbers, contracts, judgment and risk control. Avoid emotional decisions.'},
      pentacles: {'zh-CN':'财务面是这组能量最直接的领域：现金流、储蓄、资产、工作收入与现实资源都值得具体检查。','zh-TW':'財務面是這組能量最直接的領域：現金流、儲蓄、資產、工作收入與現實資源都值得具體檢查。','en':'This suit speaks most directly to money: review cash flow, savings, assets, earned income and practical resources.'}
    },
    study: {
      major: {'zh-CN':'在学业里，这张大牌强调的不只是成绩，而是你正在建立怎样的学习态度、方向与自我认知。','zh-TW':'在學業裡，這張大牌強調的不只是成績，而是你正在建立怎樣的學習態度、方向與自我認知。','en':'In study, this Major Arcana card is about more than grades—it highlights learning direction, mindset and self-understanding.'},
      cups: {'zh-CN':'学业面重点在兴趣、情绪状态、同伴互动，以及能不能对学习保持真实连接。','zh-TW':'學業面重點在興趣、情緒狀態、同伴互動，以及能不能對學習保持真實連結。','en':'For study, focus on interest, emotional state, peer interaction and genuine connection with the subject.'},
      wands: {'zh-CN':'学业面重点在动力、目标感、行动速度与持续把计划做下去。','zh-TW':'學業面重點在動力、目標感、行動速度與持續把計畫做下去。','en':'For study, focus on motivation, goals, momentum and consistently following the plan.'},
      swords: {'zh-CN':'学业面重点在理解、逻辑、考试压力、时间判断与思绪是否过度紧绷。','zh-TW':'學業面重點在理解、邏輯、考試壓力、時間判斷與思緒是否過度緊繃。','en':'For study, focus on comprehension, logic, exam pressure, time judgment and mental overload.'},
      pentacles: {'zh-CN':'学业面重点在规律、练习量、基础能力与一点一点累积出来的稳定成果。','zh-TW':'學業面重點在規律、練習量、基礎能力與一點一點累積出來的穩定成果。','en':'For study, focus on routine, practice volume, fundamentals and steady accumulated results.'}
    }
  };

  function currentLanguage() {
    const saved = localStorage.getItem('xingchen-language');
    return ['zh-CN','zh-TW','en'].includes(saved) ? saved : 'zh-CN';
  }

  function ui(key) {
    const lang = currentLanguage();
    return UI[lang]?.[key] || UI['zh-CN'][key] || key;
  }

  function secureRandomInt(maxExclusive) {
    const maxUint = 0x100000000;
    const limit = maxUint - (maxUint % maxExclusive);
    const arr = new Uint32Array(1);
    do crypto.getRandomValues(arr); while (arr[0] >= limit);
    return arr[0] % maxExclusive;
  }

  function shuffledUniqueCards(count) {
    const pool = [...state.cards];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }

  function imageFromRoot(path) {
    return `../${path}`;
  }

  function localized(obj) {
    const lang = currentLanguage();
    return obj?.[lang] || obj?.['zh-CN'] || '';
  }

  function orientationText(reversed) {
    return reversed ? ui('reversed') : ui('upright');
  }

  function cardName(card) {
    return card.name[currentLanguage()] || card.name['zh-CN'];
  }

  function arcanaText(card) {
    if (card.arcana === 'major') return ui('major');
    const suit = suitMeta[card.suit];
    return `${ui('minor')} · ${localized(suit.names)}`;
  }

  function selectedTopic() {
    return state.topics.find(x => x.key === state.selectedTopic) || state.topics[0];
  }

  function selectedSpread() {
    return state.spreads.find(x => x.key === state.selectedSpread) || state.spreads[0];
  }

  function renderStaticLanguage() {
    document.documentElement.lang = currentLanguage();
    byId('tarotBrandTitle').textContent = ui('brand');
    byId('tarotBackLink').textContent = ui('back');
    byId('tarotPageTitle').textContent = ui('title');
    byId('tarotIntro').textContent = ui('intro');
    byId('topicHeading').textContent = ui('topicHeading');
    byId('topicHint').textContent = ui('topicHint');
    byId('spreadHeading').textContent = ui('spreadHeading');
    byId('spreadHint').textContent = ui('spreadHint');
    byId('drawButtonText').textContent = ui('draw');
    byId('drawButtonHint').textContent = ui('drawHint');
    byId('drawTarotAgainBtn').textContent = ui('redraw');
    byId('resultTitle').textContent = ui('resultTitle');
    byId('combinationLabel').textContent = ui('combinationLabel');
    byId('combinationTitle').textContent = ui('combinationTitle');
    byId('storyHeading').textContent = ui('storyHeading');
    byId('structureHeading').textContent = ui('structureHeading');
    byId('finalAdviceHeading').textContent = ui('finalAdviceHeading');
    byId('tarotLoadError').textContent = ui('loadError');
    byId('scrollTopText').textContent = ui('scrollTop');
    byId('bottomHomeText').textContent = ui('bottomHome');
  }

  function renderControls() {
    const lang = currentLanguage();
    byId('topicOptions').innerHTML = state.topics.map(topic => `
      <button class="tarot-choice-pill ${topic.key === state.selectedTopic ? 'active' : ''}"
              type="button" data-topic="${topic.key}">
        ${topic.name[lang] || topic.name['zh-CN']}
      </button>
    `).join('');

    const topic = selectedTopic();
    byId('topicDescription').textContent = localized(topic.description);

    byId('spreadOptions').innerHTML = state.spreads.map(spread => `
      <button class="tarot-spread-choice ${spread.key === state.selectedSpread ? 'active' : ''}"
              type="button" data-spread="${spread.key}">
        <span class="tarot-spread-count">${spread.count}</span>
        <span>
          <strong>${localized(spread.name)}</strong>
          <small>${localized(spread.subtitle)}</small>
        </span>
      </button>
    `).join('');

    document.querySelectorAll('[data-topic]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.selectedTopic = btn.dataset.topic;
        renderControls();
      });
    });

    document.querySelectorAll('[data-spread]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.selectedSpread = btn.dataset.spread;
        renderControls();
      });
    });
  }

  function topicLens(card, reversed) {
    const lang = currentLanguage();
    const sourceKey = card.arcana === 'major' ? 'major' : card.suit;
    const base = topicSuitLens[state.selectedTopic]?.[sourceKey]?.[lang]
      || topicSuitLens.general[sourceKey]?.[lang]
      || '';

    if (!reversed) return base;

    const reverseTail = {
      'zh-CN': ' 逆位出现时，更适合先检查这股能量是否受阻、过度，或被你压住没有真正表达。',
      'zh-TW': ' 逆位出現時，更適合先檢查這股能量是否受阻、過度，或被你壓住沒有真正表達。',
      'en': ' Reversed, first check whether this energy is blocked, excessive, delayed, or not being expressed clearly.'
    };
    return base + reverseTail[lang];
  }

  function draw() {
    const spread = selectedSpread();
    if (!spread || !state.cards.length) return;

    const cards = shuffledUniqueCards(spread.count);
    state.currentDraw = cards.map((card, index) => {
      const reversed = secureRandomInt(2) === 1;
      const meaningSet = state.meanings.get(card.key);
      const meaning = meaningSet?.[reversed ? 'reversed' : 'upright'];
      return {
        card,
        reversed,
        meaning,
        position: spread.positions[index]
      };
    }).filter(item => item.meaning);

    renderResult();
  }

  function cardArticle(item, index) {
    const {card, reversed, meaning, position} = item;
    const name = cardName(card);
    const pos = localized(position.name);
    return `
      <article class="tarot-spread-card">
        <div class="tarot-position-badge">
          <span>${String(index + 1).padStart(2,'0')}</span>
          <strong>${pos}</strong>
        </div>
        <div class="tarot-card-column">
          <div class="tarot-card-frame ${reversed ? 'is-reversed' : ''}">
            <img src="${imageFromRoot(card.image)}" alt="${name} · ${orientationText(reversed)}" />
          </div>
          <span class="tarot-orientation ${reversed ? 'is-reversed' : ''}">${orientationText(reversed)}</span>
        </div>
        <div class="tarot-spread-card-reading">
          <p class="tarot-card-index">${String(card.id + 1).padStart(2,'0')} / 78 · ${arcanaText(card)}</p>
          <h3>${name}</h3>
          <p class="tarot-card-en">${card.name.en}</p>
          <div class="tarot-keywords">${meaning.keywords.map(k => `<span>${escapeHtml(k)}</span>`).join('')}</div>

          <section class="tarot-reading-block">
            <span class="tarot-reading-label">${ui('cardMeaning')}</span>
            <p>${escapeHtml(meaning.meaning)}</p>
          </section>

          <section class="tarot-reading-block tarot-topic-lens">
            <span class="tarot-reading-label">${ui('topicLens')} · ${localized(selectedTopic().name)}</span>
            <p>${escapeHtml(topicLens(card, reversed))}</p>
          </section>

          <section class="tarot-advice-block">
            <span>${ui('cardAdvice')}</span>
            <strong>${escapeHtml(meaning.advice)}</strong>
          </section>
        </div>
      </article>
    `;
  }

  function escapeHtml(text) {
    return String(text ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function analyseStructure(draw) {
    const total = draw.length;
    const majorCount = draw.filter(x => x.card.arcana === 'major').length;
    const reversedCount = draw.filter(x => x.reversed).length;
    const uprightCount = total - reversedCount;
    const suitCounts = {cups:0, wands:0, swords:0, pentacles:0};
    draw.forEach(x => {
      if (x.card.arcana === 'minor' && suitCounts[x.card.suit] !== undefined) suitCounts[x.card.suit]++;
    });
    const suitEntries = Object.entries(suitCounts).sort((a,b) => b[1]-a[1]);
    const maxSuit = suitEntries[0][1];
    const dominantSuits = maxSuit > 0 ? suitEntries.filter(([,v]) => v === maxSuit && v >= 2).map(([k]) => k) : [];
    return {total, majorCount, reversedCount, uprightCount, suitCounts, dominantSuits};
  }

  function signalChips(analysis) {
    const lang = currentLanguage();
    const chips = [];
    if (lang === 'en') {
      chips.push(`Major ${analysis.majorCount}/${analysis.total}`);
      chips.push(`Reversed ${analysis.reversedCount}/${analysis.total}`);
      analysis.dominantSuits.forEach(s => chips.push(`Focus · ${suitMeta[s].names.en}`));
    } else {
      chips.push(`大牌 ${analysis.majorCount}/${analysis.total}`);
      chips.push(`逆位 ${analysis.reversedCount}/${analysis.total}`);
      analysis.dominantSuits.forEach(s => chips.push(`集中 · ${localized(suitMeta[s].names)}`));
    }
    return chips;
  }

  function buildStory(draw) {
    const lang = currentLanguage();
    if (draw.length === 1) {
      const item = draw[0];
      if (lang === 'en') return `${localized(item.position.name)} is represented by ${cardName(item.card)} (${orientationText(item.reversed)}). The core message is: ${item.meaning.meaning}`;
      if (lang === 'zh-TW') return `${localized(item.position.name)}抽到「${cardName(item.card)}・${orientationText(item.reversed)}」。這張牌的核心訊息是：${item.meaning.meaning}`;
      return `${localized(item.position.name)}抽到「${cardName(item.card)}・${orientationText(item.reversed)}」。这张牌的核心讯息是：${item.meaning.meaning}`;
    }

    const parts = draw.map(item => {
      const key = item.meaning.keywords.slice(0,2).join('、');
      return `${localized(item.position.name)}「${cardName(item.card)}・${orientationText(item.reversed)}」〔${key}〕`;
    });

    if (lang === 'en') {
      return `Read as a sequence, the spread moves through ${parts.join(' → ')}. Do not treat these as isolated verdicts: the later positions show how the earlier energy develops, is challenged, or can be handled.`;
    }
    if (lang === 'zh-TW') {
      return `把牌連成一條線看，這組牌依序走過：${parts.join(' → ')}。不要把每一張當成彼此無關的結論；越後面的牌，越是在說前面的能量會怎麼發展、被修正，或應該怎麼處理。`;
    }
    return `把牌连成一条线看，这组牌依序走过：${parts.join(' → ')}。不要把每一张当成彼此无关的结论；越后面的牌，越是在说前面的能量会怎么发展、被修正，或应该怎么处理。`;
  }

  function buildStructure(analysis) {
    const lang = currentLanguage();
    const notes = [];

    if (analysis.majorCount >= Math.ceil(analysis.total * 0.5)) {
      notes.push(lang === 'en'
        ? 'Major Arcana are prominent, so the spread leans toward a meaningful turning point or a lesson with longer-term weight.'
        : lang === 'zh-TW'
          ? '大阿爾克那占比偏高，代表這組牌比較像在談一個有份量的轉折、選擇或長期課題。'
          : '大阿尔克那占比偏高，代表这组牌比较像在谈一个有分量的转折、选择或长期课题。');
    } else if (analysis.majorCount > 0) {
      notes.push(lang === 'en'
        ? 'Major Arcana appear, but practical day-to-day factors still play an important role.'
        : lang === 'zh-TW'
          ? '牌面中有大阿爾克那介入，但日常選擇與實際做法仍然很重要。'
          : '牌面中有大阿尔克那介入，但日常选择与实际做法仍然很重要。');
    } else {
      notes.push(lang === 'en'
        ? 'No Major Arcana dominate this spread; the situation looks more adjustable through concrete choices and habits.'
        : lang === 'zh-TW'
          ? '這組沒有大牌主導，事情比較偏向可透過具體選擇、溝通與日常做法去調整。'
          : '这组没有大牌主导，事情比较偏向可透过具体选择、沟通与日常做法去调整。');
    }

    if (analysis.reversedCount === 0) {
      notes.push(lang === 'en'
        ? 'All cards are upright, giving the spread relatively direct momentum.'
        : lang === 'zh-TW'
          ? '全數正位，能量表達相對直接，事情較容易看出推進方向。'
          : '全数正位，能量表达相对直接，事情较容易看出推进方向。');
    } else if (analysis.reversedCount > analysis.total / 2) {
      notes.push(lang === 'en'
        ? 'Reversed cards are the majority, so delays, internal resistance, overcorrection or unfinished issues deserve more attention than speed.'
        : lang === 'zh-TW'
          ? '逆位過半，現在比起急著推進，更需要留意延遲、內在阻力、過度反應或尚未處理完的問題。'
          : '逆位过半，现在比起急着推进，更需要留意延迟、内在阻力、过度反应或尚未处理完的问题。');
    } else {
      notes.push(lang === 'en'
        ? 'Upright and reversed cards are mixed, suggesting progress is possible but not every part of the situation moves at the same pace.'
        : lang === 'zh-TW'
          ? '正逆位交錯，表示事情可以前進，但不同環節的速度並不一致，需要邊走邊修正。'
          : '正逆位交错，表示事情可以前进，但不同环节的速度并不一致，需要边走边修正。');
    }

    if (analysis.dominantSuits.length) {
      const suitNames = analysis.dominantSuits.map(s => localized(suitMeta[s].names)).join('、');
      const elementNames = analysis.dominantSuits.map(s => localized(suitMeta[s].elementNames)).join('、');
      notes.push(lang === 'en'
        ? `${suitNames} repeats in the spread, concentrating the reading in the ${elementNames} element and its related themes.`
        : lang === 'zh-TW'
          ? `${suitNames}在牌面重複出現，表示整組解讀明顯往「${elementNames}元素」及其對應議題集中。`
          : `${suitNames}在牌面重复出现，表示整组解读明显往「${elementNames}元素」及其对应议题集中。`);
    }

    return notes.join(lang === 'en' ? ' ' : ' ');
  }

  function buildFinalAdvice(draw, analysis) {
    const lang = currentLanguage();
    const last = draw[draw.length - 1];
    const topic = localized(selectedTopic().name);
    const lead = last?.meaning?.advice || '';
    const tone = analysis.reversedCount > analysis.total / 2
      ? (lang === 'en'
          ? 'Move more slowly than your impulse suggests, and fix the blocked part before expanding the plan.'
          : lang === 'zh-TW'
            ? '這組牌比較適合先整理阻力，再談加速；先把卡住的環節處理好，會比硬推更有效。'
            : '这组牌比较适合先整理阻力，再谈加速；先把卡住的环节处理好，会比硬推更有效。')
      : (lang === 'en'
          ? 'Choose the next concrete step you can actually carry out, then let the following result inform the next adjustment.'
          : lang === 'zh-TW'
            ? '把焦點放在下一個真正做得到的行動，做完再根據結果調整，不必一次把所有答案想完。'
            : '把焦点放在下一个真正做得到的行动，做完再根据结果调整，不必一次把所有答案想完。');

    if (lang === 'en') return `For ${topic}: ${lead} ${tone}`;
    if (lang === 'zh-TW') return `針對「${topic}」：${lead} ${tone}`;
    return `针对「${topic}」：${lead} ${tone}`;
  }

  function renderResult() {
    const spread = selectedSpread();
    const topic = selectedTopic();
    const lang = currentLanguage();

    byId('resultSubtitle').textContent = `${localized(topic.name)} · ${localized(spread.name)} · ${localized(spread.subtitle)}`;
    byId('tarotSpreadGrid').dataset.count = String(spread.count);
    byId('tarotSpreadGrid').innerHTML = state.currentDraw.map(cardArticle).join('');

    const analysis = analyseStructure(state.currentDraw);
    byId('signalChips').innerHTML = signalChips(analysis).map(x => `<span>${escapeHtml(x)}</span>`).join('');
    byId('storyText').textContent = buildStory(state.currentDraw);
    byId('structureText').textContent = buildStructure(analysis);
    byId('finalAdviceText').textContent = buildFinalAdvice(state.currentDraw, analysis);

    byId('tarotResult').hidden = false;
    requestAnimationFrame(() => byId('tarotResult').scrollIntoView({behavior:'smooth', block:'start'}));
  }

  async function init() {
    renderStaticLanguage();
    try {
      const [cardsResponse, meaningsResponse, spreadsResponse] = await Promise.all([
        fetch('../data/tarot/cards.json', { cache: 'no-store' }),
        fetch('../data/tarot/meanings.json', { cache: 'no-store' }),
        fetch('../data/tarot/spreads.json', { cache: 'no-store' })
      ]);
      if (!cardsResponse.ok || !meaningsResponse.ok || !spreadsResponse.ok) throw new Error('Tarot data load failed');

      const cardsPayload = await cardsResponse.json();
      const meaningsPayload = await meaningsResponse.json();
      const spreadsPayload = await spreadsResponse.json();

      state.cards = cardsPayload.cards;
      state.meanings = new Map(meaningsPayload.meanings.map(item => [item.key, item]));
      state.topics = spreadsPayload.topics;
      state.spreads = spreadsPayload.spreads;

      if (state.cards.length !== 78 || state.meanings.size !== 78) {
        throw new Error(`Tarot data incomplete: cards=${state.cards.length}, meanings=${state.meanings.size}`);
      }
      if (!state.topics.length || !state.spreads.length) throw new Error('Spread definitions missing');

      renderControls();
      byId('drawTarotBtn').disabled = false;
    } catch (error) {
      console.error(error);
      byId('tarotLoadError').hidden = false;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    byId('drawTarotBtn')?.addEventListener('click', draw);
    byId('drawTarotAgainBtn')?.addEventListener('click', draw);
    byId('scrollTopBtn')?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    init();
  });
})();
