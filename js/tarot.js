(() => {
  const state = {
    cards: [],
    meanings: new Map(),
    topics: [],
    spreads: [],
    selectedTopic: 'general',
    selectedSpread: 'single',
    currentDraw: [],
    question: '',
    optionA: '',
    optionB: '',
    nextRevealIndex: 0
  };

  const byId = (id) => document.getElementById(id);

  const UI = {
    'zh-CN': {
      brand: '星辰日记',
      back: '← 返回首页',
      title: '塔罗牌占卜',
      intro: '写下想问的事情，再选择问题方向与占卜类型。多张牌会结合牌位、正逆位、花色、元素、数字与牌面发展关系一起解读。',
      questionHeading: '输入问题',
      questionHint: '把真正想知道的事情写下来，会更容易专注在同一个问题上。',
      questionNote: '问题可以留空；留空时会以你选择的方向进行一般指引。',
      topicHeading: '选择问题',
      topicHint: '先选择你想询问的方向，同一张牌在不同问题里会强调不同面向。',
      spreadHeading: '选择类型',
      spreadHint: '单张看核心；本周、本月、关系与二选一会读取更多牌面结构。',
      draw: '开始抽盘',
      drawHint: '在心里确认问题，默念三次，然后点击牌堆',
      redraw: '重新抽盘 ↻',
      resultTitle: '你的牌阵',
      questionPrefix: '你问的是',
      revealGuideTitle: '依序翻开牌面',
      revealGuideText: '从第一张开始点击牌背。全部翻开后，才会显示完整的组合解读。',
      revealNext: '点击翻开',
      waiting: '请先翻开前一张',
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
      optionA: '选项 A',
      optionB: '选项 B',
      optionAPlaceholder: '例如：留在现在的工作',
      optionBPlaceholder: '例如：接受新的工作机会',
      choiceMissing: '二选一牌阵建议填写 A、B 两个选项，方便结果对应。',
      allRevealed: '牌面已全部翻开，完整组合解读已经出现。',
      loadError: '牌库暂时无法读取，请确认你正在使用 Go Live 或 GitHub Pages 开启网站。',
      scrollTop: '回到顶部',
      bottomHome: '返回首页',
      placeholderGeneral: '例如：我目前最需要关注什么？',
      placeholderLove: '例如：我和对方接下来会如何发展？',
      placeholderCareer: '例如：目前这份工作接下来适合怎么走？',
      placeholderMoney: '例如：我最近的财务方向需要注意什么？',
      placeholderStudy: '例如：这次考试／学习计划该怎么调整？'
    },
    'zh-TW': {
      brand: '星辰日記',
      back: '← 返回首頁',
      title: '塔羅牌占卜',
      intro: '寫下想問的事情，再選擇問題方向與占卜類型。多張牌會結合牌位、正逆位、花色、元素、數字與牌面發展關係一起解讀。',
      questionHeading: '輸入問題',
      questionHint: '把真正想知道的事情寫下來，會更容易專注在同一個問題上。',
      questionNote: '問題可以留空；留空時會以你選擇的方向進行一般指引。',
      topicHeading: '選擇問題',
      topicHint: '先選擇你想詢問的方向，同一張牌在不同問題裡會強調不同面向。',
      spreadHeading: '選擇類型',
      spreadHint: '單張看核心；本週、本月、關係與二選一會讀取更多牌面結構。',
      draw: '開始抽盤',
      drawHint: '在心裡確認問題，默念三次，然後點擊牌堆',
      redraw: '重新抽盤 ↻',
      resultTitle: '你的牌陣',
      questionPrefix: '你問的是',
      revealGuideTitle: '依序翻開牌面',
      revealGuideText: '從第一張開始點擊牌背。全部翻開後，才會顯示完整的組合解讀。',
      revealNext: '點擊翻開',
      waiting: '請先翻開前一張',
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
      optionA: '選項 A',
      optionB: '選項 B',
      optionAPlaceholder: '例如：留在現在的工作',
      optionBPlaceholder: '例如：接受新的工作機會',
      choiceMissing: '二選一牌陣建議填寫 A、B 兩個選項，方便結果對應。',
      allRevealed: '牌面已全部翻開，完整組合解讀已經出現。',
      loadError: '牌庫暫時無法讀取，請確認你正在使用 Go Live 或 GitHub Pages 開啟網站。',
      scrollTop: '回到頂部',
      bottomHome: '返回首頁',
      placeholderGeneral: '例如：我目前最需要關注什麼？',
      placeholderLove: '例如：我和對方接下來會如何發展？',
      placeholderCareer: '例如：目前這份工作接下來適合怎麼走？',
      placeholderMoney: '例如：我最近的財務方向需要注意什麼？',
      placeholderStudy: '例如：這次考試／學習計畫該怎麼調整？'
    },
    'en': {
      brand: 'Stellar Diary',
      back: '← Home',
      title: 'Tarot Reading',
      intro: 'Write down what you want to ask, then choose a question area and reading type. Multi-card readings combine position, orientation, suits, elements, numbers and the way the spread develops.',
      questionHeading: 'Enter your question',
      questionHint: 'Writing the real question helps keep the reading focused on one issue.',
      questionNote: 'You may leave this blank; the reading will then use the selected area as a general guide.',
      topicHeading: 'Choose a question area',
      topicHint: 'Choose the area you want to ask about. The same card can emphasize different facets in different questions.',
      spreadHeading: 'Choose a reading type',
      spreadHint: 'One card for the core; weekly, monthly, relationship and two-path readings use more structural signals.',
      draw: 'Start reading',
      drawHint: 'Confirm your question in your mind, repeat it three times, then click the deck',
      redraw: 'Draw again ↻',
      resultTitle: 'Your spread',
      questionPrefix: 'Your question',
      revealGuideTitle: 'Reveal the cards in order',
      revealGuideText: 'Start with the first card. The combined interpretation appears after every card has been revealed.',
      revealNext: 'Tap to reveal',
      waiting: 'Reveal the previous card first',
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
      optionA: 'Option A',
      optionB: 'Option B',
      optionAPlaceholder: 'e.g. Stay in my current job',
      optionBPlaceholder: 'e.g. Accept the new opportunity',
      choiceMissing: 'For a two-path reading, entering both A and B makes the result easier to follow.',
      allRevealed: 'All cards are revealed. The complete combined reading is now available.',
      loadError: 'The tarot data could not be loaded. Please open the site through Go Live or GitHub Pages.',
      scrollTop: 'Back to top',
      bottomHome: 'Back home',
      placeholderGeneral: 'e.g. What deserves my attention right now?',
      placeholderLove: 'e.g. How may this relationship develop from here?',
      placeholderCareer: 'e.g. What direction should I take with my current work?',
      placeholderMoney: 'e.g. What should I pay attention to financially?',
      placeholderStudy: 'e.g. How should I adjust my study plan?'
    }
  };

  const suitMeta = {
    cups: { names: {'zh-CN':'圣杯','zh-TW':'聖杯','en':'Cups'}, element: 'water', elementNames: {'zh-CN':'水','zh-TW':'水','en':'Water'} },
    pentacles: { names: {'zh-CN':'星币','zh-TW':'星幣','en':'Pentacles'}, element: 'earth', elementNames: {'zh-CN':'土','zh-TW':'土','en':'Earth'} },
    swords: { names: {'zh-CN':'宝剑','zh-TW':'寶劍','en':'Swords'}, element: 'air', elementNames: {'zh-CN':'风','zh-TW':'風','en':'Air'} },
    wands: { names: {'zh-CN':'权杖','zh-TW':'權杖','en':'Wands'}, element: 'fire', elementNames: {'zh-CN':'火','zh-TW':'火','en':'Fire'} }
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
      major: {'zh-CN':'在财务问题里，这张大牌提醒你先看长期方向与价值判断，不要只盯着眼前数字。','zh-TW':'在財務問題裡，這張大牌提醒你先看長期方向與價值判斷，不要只盯著眼前數字。','en':'In money matters, this Major Arcana card asks you to consider long-term direction and values, not only immediate numbers.'},
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
    return UI[lang]?.[key] ?? UI['zh-CN'][key] ?? key;
  }

  function localized(obj) {
    const lang = currentLanguage();
    return obj?.[lang] ?? obj?.['zh-CN'] ?? '';
  }

  function escapeHtml(text) {
    return String(text ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
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

  function selectedTopic() {
    return state.topics.find(x => x.key === state.selectedTopic) || state.topics[0];
  }

  function selectedSpread() {
    return state.spreads.find(x => x.key === state.selectedSpread) || state.spreads[0];
  }

  function orientationText(reversed) {
    return reversed ? ui('reversed') : ui('upright');
  }

  function cardName(card) {
    return card.name[currentLanguage()] || card.name['zh-CN'];
  }

  function arcanaText(card) {
    if (card.arcana === 'major') return ui('major');
    return `${ui('minor')} · ${localized(suitMeta[card.suit].names)}`;
  }

  function questionPlaceholder() {
    const map = {
      general: 'placeholderGeneral',
      love: 'placeholderLove',
      career: 'placeholderCareer',
      money: 'placeholderMoney',
      study: 'placeholderStudy'
    };
    return ui(map[state.selectedTopic] || 'placeholderGeneral');
  }

  function renderStaticLanguage() {
    document.documentElement.lang = currentLanguage();
    byId('tarotBrandTitle').textContent = ui('brand');
    byId('tarotBackLink').textContent = ui('back');
    byId('tarotPageTitle').textContent = ui('title');
    byId('tarotIntro').textContent = ui('intro');
    byId('questionHeading').textContent = ui('questionHeading');
    byId('questionHint').textContent = ui('questionHint');
    byId('questionNote').textContent = ui('questionNote');
    byId('topicHeading').textContent = ui('topicHeading');
    byId('topicHint').textContent = ui('topicHint');
    byId('spreadHeading').textContent = ui('spreadHeading');
    byId('spreadHint').textContent = ui('spreadHint');
    byId('drawButtonText').textContent = ui('draw');
    byId('drawButtonHint').textContent = ui('drawHint');
    byId('drawTarotAgainBtn').textContent = ui('redraw');
    byId('resultTitle').textContent = ui('resultTitle');
    byId('revealGuideTitle').textContent = ui('revealGuideTitle');
    byId('revealGuideText').textContent = ui('revealGuideText');
    byId('combinationLabel').textContent = ui('combinationLabel');
    byId('combinationTitle').textContent = ui('combinationTitle');
    byId('storyHeading').textContent = ui('storyHeading');
    byId('structureHeading').textContent = ui('structureHeading');
    byId('finalAdviceHeading').textContent = ui('finalAdviceHeading');
    byId('tarotLoadError').textContent = ui('loadError');
    byId('scrollTopText').textContent = ui('scrollTop');
    byId('bottomHomeText').textContent = ui('bottomHome');
    byId('optionALabel').textContent = ui('optionA');
    byId('optionBLabel').textContent = ui('optionB');
    byId('optionAInput').placeholder = ui('optionAPlaceholder');
    byId('optionBInput').placeholder = ui('optionBPlaceholder');
    byId('questionInput').placeholder = questionPlaceholder();
  }

  function positionName(position) {
    const spread = selectedSpread();
    const base = localized(position.name);

    if (spread.key !== 'choice5') return base;

    const A = state.optionA.trim();
    const B = state.optionB.trim();
    if (position.key === 'optionA' && A) return `${ui('optionA')} · ${A}`;
    if (position.key === 'optionAOutcome' && A) {
      return currentLanguage() === 'en' ? `${A} · Outcome` : `${A} · ${currentLanguage() === 'zh-TW' ? '發展' : '发展'}`;
    }
    if (position.key === 'optionB' && B) return `${ui('optionB')} · ${B}`;
    if (position.key === 'optionBOutcome' && B) {
      return currentLanguage() === 'en' ? `${B} · Outcome` : `${B} · ${currentLanguage() === 'zh-TW' ? '發展' : '发展'}`;
    }
    return base;
  }

  function renderControls() {
    const lang = currentLanguage();

    byId('topicOptions').innerHTML = state.topics.map(topic => `
      <button class="tarot-choice-pill ${topic.key === state.selectedTopic ? 'active' : ''}"
              type="button" data-topic="${topic.key}">
        ${escapeHtml(topic.name[lang] || topic.name['zh-CN'])}
      </button>
    `).join('');

    byId('topicDescription').textContent = localized(selectedTopic().description);
    byId('questionInput').placeholder = questionPlaceholder();

    byId('spreadOptions').innerHTML = state.spreads.map(spread => `
      <button class="tarot-spread-choice ${spread.key === state.selectedSpread ? 'active' : ''}"
              type="button" data-spread="${spread.key}">
        <span class="tarot-spread-icon" aria-hidden="true">
          <img src="../images/tarot/cards/CardBacks.jpg" alt="" />
        </span>
        <span>
          <strong>${escapeHtml(localized(spread.name))}</strong>
          <small>${escapeHtml(localized(spread.subtitle))}</small>
        </span>
      </button>
    `).join('');

    byId('choiceFields').hidden = state.selectedSpread !== 'choice5';

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

    const tails = {
      'zh-CN': ' 逆位出现时，更适合先检查这股能量是否受阻、过度，或被压住没有真正表达。',
      'zh-TW': ' 逆位出現時，更適合先檢查這股能量是否受阻、過度，或被壓住沒有真正表達。',
      'en': ' Reversed, first check whether this energy is blocked, excessive, delayed, or not being expressed clearly.'
    };
    return base + tails[lang];
  }

  function readInputs() {
    state.question = byId('questionInput').value.trim();
    state.optionA = byId('optionAInput').value.trim();
    state.optionB = byId('optionBInput').value.trim();
  }

  function draw() {
    readInputs();
    const spread = selectedSpread();
    if (!spread || !state.cards.length) return;

    if (spread.key === 'choice5' && (!state.optionA || !state.optionB)) {
      byId('questionNote').textContent = ui('choiceMissing');
      byId('choiceFields').classList.add('needs-attention');
      setTimeout(() => byId('choiceFields').classList.remove('needs-attention'), 900);
    } else {
      byId('questionNote').textContent = ui('questionNote');
    }

    const cards = shuffledUniqueCards(spread.count);
    state.currentDraw = cards.map((card, index) => {
      const reversed = secureRandomInt(2) === 1;
      const meaningSet = state.meanings.get(card.key);
      const meaning = meaningSet?.[reversed ? 'reversed' : 'upright'];
      return {
        card,
        reversed,
        meaning,
        position: spread.positions[index],
        revealed: false
      };
    }).filter(item => item.meaning);

    state.nextRevealIndex = 0;
    renderResult();
  }

  function flipCardHtml(item, index) {
    const {card, reversed, meaning, position} = item;
    const name = cardName(card);
    const pos = positionName(position);
    const isFirst = index === 0;

    return `
      <article class="tarot-spread-card tarot-reveal-item" data-card-index="${index}">
        <div class="tarot-position-badge">
          <span>${String(index + 1).padStart(2,'0')}</span>
          <strong>${escapeHtml(pos)}</strong>
        </div>

        <button class="tarot-flip-card ${isFirst ? 'is-ready' : 'is-waiting'}"
                type="button"
                data-reveal-index="${index}"
                ${isFirst ? '' : 'disabled'}
                aria-label="${escapeHtml(pos)} · ${ui('revealNext')}">
          <span class="tarot-flip-inner">
            <span class="tarot-flip-face tarot-flip-back">
              <img src="../images/tarot/cards/CardBacks.jpg" alt="" />
              <span class="tarot-flip-prompt">${isFirst ? ui('revealNext') : ui('waiting')}</span>
            </span>
            <span class="tarot-flip-face tarot-flip-front ${reversed ? 'is-reversed' : ''}">
              <img src="${imageFromRoot(card.image)}" alt="${escapeHtml(name)} · ${orientationText(reversed)}" />
            </span>
          </span>
        </button>

        <div class="tarot-card-reveal-caption" hidden>
          <span class="tarot-orientation ${reversed ? 'is-reversed' : ''}">${orientationText(reversed)}</span>
        </div>

        <div class="tarot-spread-card-reading" hidden>
          <p class="tarot-card-index">${String(card.id + 1).padStart(2,'0')} / 78 · ${escapeHtml(arcanaText(card))}</p>
          <h3>${escapeHtml(name)}</h3>
          <p class="tarot-card-en">${escapeHtml(card.name.en)}</p>
          <div class="tarot-keywords">${meaning.keywords.map(k => `<span>${escapeHtml(k)}</span>`).join('')}</div>

          <section class="tarot-reading-block">
            <span class="tarot-reading-label">${ui('cardMeaning')}</span>
            <p>${escapeHtml(meaning.meaning)}</p>
          </section>

          <section class="tarot-reading-block tarot-topic-lens">
            <span class="tarot-reading-label">${ui('topicLens')} · ${escapeHtml(localized(selectedTopic().name))}</span>
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

  function renderResult() {
    const spread = selectedSpread();
    const topic = selectedTopic();

    byId('resultSubtitle').textContent =
      `${localized(topic.name)} · ${localized(spread.name)} · ${localized(spread.subtitle)}`;

    if (state.question) {
      byId('questionSummary').hidden = false;
      byId('questionSummary').textContent = `${ui('questionPrefix')}：「${state.question}」`;
    } else {
      byId('questionSummary').hidden = true;
      byId('questionSummary').textContent = '';
    }

    byId('tarotSpreadGrid').dataset.count = String(spread.count);
    byId('tarotSpreadGrid').dataset.spread = spread.key;
    byId('tarotSpreadGrid').innerHTML = state.currentDraw.map(flipCardHtml).join('');

    byId('combinationReading').hidden = true;
    byId('revealGuideTitle').textContent = ui('revealGuideTitle');
    byId('revealGuideText').textContent = ui('revealGuideText');
    byId('tarotResult').hidden = false;

    document.querySelectorAll('[data-reveal-index]').forEach(btn => {
      btn.addEventListener('click', handleReveal);
    });

    requestAnimationFrame(() => {
      byId('tarotResult').scrollIntoView({behavior:'smooth', block:'start'});
    });
  }

  function handleReveal(event) {
    const button = event.currentTarget;
    const index = Number(button.dataset.revealIndex);
    if (index !== state.nextRevealIndex || state.currentDraw[index]?.revealed) return;

    state.currentDraw[index].revealed = true;
    button.classList.remove('is-ready');
    button.classList.add('is-flipped');
    button.disabled = true;

    const article = button.closest('.tarot-reveal-item');
    const caption = article.querySelector('.tarot-card-reveal-caption');
    const reading = article.querySelector('.tarot-spread-card-reading');

    window.setTimeout(() => {
      caption.hidden = false;
      reading.hidden = false;
      article.classList.add('is-revealed');

      state.nextRevealIndex += 1;

      if (state.nextRevealIndex < state.currentDraw.length) {
        const next = document.querySelector(`[data-reveal-index="${state.nextRevealIndex}"]`);
        next.disabled = false;
        next.classList.remove('is-waiting');
        next.classList.add('is-ready');
        const prompt = next.querySelector('.tarot-flip-prompt');
        if (prompt) prompt.textContent = ui('revealNext');
      } else {
        revealCombination();
      }
    }, 440);
  }

  function revealCombination() {
    const analysis = analyseStructure(state.currentDraw);

    byId('signalChips').innerHTML =
      signalChips(analysis).map(x => `<span>${escapeHtml(x)}</span>`).join('');
    byId('storyText').textContent = buildStory(state.currentDraw, analysis);
    byId('structureText').textContent = buildStructure(analysis);
    byId('finalAdviceText').textContent = buildFinalAdvice(state.currentDraw, analysis);
    byId('combinationReading').hidden = false;
    byId('revealGuideTitle').textContent = ui('allRevealed');
    byId('revealGuideText').textContent = '';

    requestAnimationFrame(() => {
      byId('combinationReading').classList.add('is-visible');
    });
  }

  function analyseStructure(draw) {
    const total = draw.length;
    const majorCount = draw.filter(x => x.card.arcana === 'major').length;
    const reversedCount = draw.filter(x => x.reversed).length;
    const uprightCount = total - reversedCount;

    const suitCounts = {cups:0, wands:0, swords:0, pentacles:0};
    const elementCounts = {water:0, fire:0, air:0, earth:0};
    const rankCounts = {};
    let courtCount = 0;
    let aceCount = 0;
    let tenCount = 0;

    draw.forEach(x => {
      const c = x.card;
      if (c.arcana === 'minor') {
        suitCounts[c.suit] += 1;
        elementCounts[suitMeta[c.suit].element] += 1;
        if (c.rank >= 1 && c.rank <= 10) {
          rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
        }
        if (c.rank >= 11 && c.rank <= 14) courtCount += 1;
        if (c.rank === 1) aceCount += 1;
        if (c.rank === 10) tenCount += 1;
      }
    });

    const suitEntries = Object.entries(suitCounts).sort((a,b) => b[1]-a[1]);
    const maxSuit = suitEntries[0]?.[1] || 0;
    const dominantSuits = maxSuit >= 2
      ? suitEntries.filter(([,v]) => v === maxSuit).map(([k]) => k)
      : [];

    const repeatedRanks = Object.entries(rankCounts)
      .filter(([, count]) => count >= 2)
      .map(([rank, count]) => ({rank: Number(rank), count}));

    const uniqueRanks = Object.keys(rankCounts).map(Number).sort((a,b) => a-b);
    const sequences = [];
    let current = [];
    uniqueRanks.forEach(rank => {
      if (!current.length || rank === current[current.length - 1] + 1) {
        current.push(rank);
      } else {
        if (current.length >= 2) sequences.push([...current]);
        current = [rank];
      }
    });
    if (current.length >= 2) sequences.push([...current]);

    const majorRuns = [];
    let run = [];
    draw.forEach((item, index) => {
      if (item.card.arcana === 'major') {
        run.push(index);
      } else {
        if (run.length >= 2) majorRuns.push([...run]);
        run = [];
      }
    });
    if (run.length >= 2) majorRuns.push([...run]);

    const minorCount = total - majorCount;
    const missingElements = minorCount >= 3
      ? Object.entries(elementCounts).filter(([,v]) => v === 0).map(([k]) => k)
      : [];

    const firstHalf = draw.slice(0, Math.ceil(total / 2));
    const secondHalf = draw.slice(Math.floor(total / 2));
    const firstRev = firstHalf.filter(x => x.reversed).length;
    const secondRev = secondHalf.filter(x => x.reversed).length;
    const orientationFlow =
      secondRev < firstRev ? 'clearing' :
      secondRev > firstRev ? 'tightening' : 'steady';

    return {
      total, majorCount, reversedCount, uprightCount,
      suitCounts, elementCounts, dominantSuits,
      courtCount, aceCount, tenCount,
      repeatedRanks, sequences, majorRuns,
      missingElements, orientationFlow
    };
  }

  function numberLabel(rank) {
    const zh = ['','一','二','三','四','五','六','七','八','九','十'];
    return currentLanguage() === 'en' ? String(rank) : zh[rank] || String(rank);
  }

  function elementName(key) {
    const lookup = {
      water: {'zh-CN':'水','zh-TW':'水','en':'Water'},
      fire: {'zh-CN':'火','zh-TW':'火','en':'Fire'},
      air: {'zh-CN':'风','zh-TW':'風','en':'Air'},
      earth: {'zh-CN':'土','zh-TW':'土','en':'Earth'}
    };
    return localized(lookup[key]);
  }

  function signalChips(a) {
    const lang = currentLanguage();
    const chips = [];

    if (lang === 'en') {
      chips.push(`Major ${a.majorCount}/${a.total}`);
      chips.push(`Reversed ${a.reversedCount}/${a.total}`);
      if (a.courtCount >= 2) chips.push(`Court cards ×${a.courtCount}`);
      if (a.aceCount >= 2) chips.push(`Aces ×${a.aceCount}`);
      if (a.tenCount >= 2) chips.push(`Tens ×${a.tenCount}`);
      a.dominantSuits.forEach(s => chips.push(`Focus · ${suitMeta[s].names.en}`));
      a.repeatedRanks.forEach(r => chips.push(`Repeated ${r.rank} ×${r.count}`));
    } else {
      chips.push(`大牌 ${a.majorCount}/${a.total}`);
      chips.push(`逆位 ${a.reversedCount}/${a.total}`);
      if (a.courtCount >= 2) chips.push(`宫廷牌 ×${a.courtCount}`);
      if (a.aceCount >= 2) chips.push(`Ace ×${a.aceCount}`);
      if (a.tenCount >= 2) chips.push(`十号牌 ×${a.tenCount}`);
      a.dominantSuits.forEach(s => chips.push(`集中 · ${localized(suitMeta[s].names)}`));
      a.repeatedRanks.forEach(r => chips.push(`数字${numberLabel(r.rank)} ×${r.count}`));
    }
    return chips;
  }

  function itemShort(item) {
    const kw = item.meaning.keywords.slice(0,2).join('、');
    return `${positionName(item.position)}「${cardName(item.card)}・${orientationText(item.reversed)}」〔${kw}〕`;
  }

  function counterpartLabel() {
    const labels = {
      general: {
        'zh-CN': '外在环境',
        'zh-TW': '外在環境',
        'en': 'the outside environment'
      },
      love: {
        'zh-CN': '对方',
        'zh-TW': '對方',
        'en': 'the other person'
      },
      career: {
        'zh-CN': '合作方／工作环境',
        'zh-TW': '合作方／工作環境',
        'en': 'the other side / work environment'
      },
      money: {
        'zh-CN': '外在资源／市场环境',
        'zh-TW': '外在資源／市場環境',
        'en': 'external resources / market conditions'
      },
      study: {
        'zh-CN': '学习环境／外在条件',
        'zh-TW': '學習環境／外在條件',
        'en': 'the learning environment / external conditions'
      }
    };
    return labels[state.selectedTopic]?.[currentLanguage()]
      || labels.general[currentLanguage()];
  }

  function buildStory(draw) {
    const lang = currentLanguage();
    const spread = selectedSpread();

    if (spread.key === 'single') {
      const item = draw[0];
      if (lang === 'en') {
        return `${positionName(item.position)} is represented by ${cardName(item.card)} (${orientationText(item.reversed)}). ${item.meaning.meaning}`;
      }
      return `${positionName(item.position)}抽到「${cardName(item.card)}・${orientationText(item.reversed)}」。${item.meaning.meaning}`;
    }

    if (spread.key === 'relationship5') {
      const [self, other, core, obstacle, direction] = draw;
      const counterpart = counterpartLabel();

      if (lang === 'en') {
        return `Your side is represented by ${cardName(self.card)} (${orientationText(self.reversed)}), while ${counterpart} is represented by ${cardName(other.card)} (${orientationText(other.reversed)}). The core interaction is ${cardName(core.card)}, the main obstacle is ${cardName(obstacle.card)}, and ${cardName(direction.card)} shows the most useful direction to work with next. This spread separates your own state, the external side, and the interaction itself so they are not mistaken for the same thing.`;
      }

      const trad = lang === 'zh-TW';
      return `${trad ? '你自身這一側' : '你自身这一侧'}是「${cardName(self.card)}・${orientationText(self.reversed)}」，${counterpart}是「${cardName(other.card)}・${orientationText(other.reversed)}」；${trad ? '互動核心' : '互动核心'}落在「${cardName(core.card)}」，主要${trad ? '阻礙' : '阻碍'}是「${cardName(obstacle.card)}」。最後的「${cardName(direction.card)}」代表目前最值得採取的發展方向。這五張牌會把「自己、外在一側、彼此互動」拆開來看，避免把單一位置直接當成全部答案。`;
    }

    if (spread.key === 'choice5') {
      const [current, a, aOut, b, bOut] = draw;
      const A = state.optionA || ui('optionA');
      const B = state.optionB || ui('optionB');
      if (lang === 'en') {
        return `The current state is ${cardName(current.card)}. Path A (${A}) is represented by ${cardName(a.card)}, developing toward ${cardName(aOut.card)}. Path B (${B}) is represented by ${cardName(b.card)}, developing toward ${cardName(bOut.card)}. This spread is best read as two different energy paths, not as a fixed verdict about which option is universally “right.”`;
      }
      const trad = lang === 'zh-TW';
      return `目前狀態是「${cardName(current.card)}」。A 路線「${A}」由「${cardName(a.card)}」起步，發展到「${cardName(aOut.card)}」；B 路線「${B}」由「${cardName(b.card)}」起步，發展到「${cardName(bOut.card)}」。這個牌陣更適合比較兩條路各自的代價、阻力與發展方式，而不是把結果簡化成一個絕對的「哪個一定比較好」。`;
    }

    const parts = draw.map(itemShort);
    if (lang === 'en') {
      return `Read as a sequence, the spread moves through ${parts.join(' → ')}. Later positions show how earlier energy develops, is challenged or can be handled, so the cards should not be read as isolated verdicts.`;
    }
    const trad = lang === 'zh-TW';
    return `${trad ? '把牌連成一條線看' : '把牌连成一条线看'}，${trad ? '這組牌依序走過' : '这组牌依序走过'}：${parts.join(' → ')}。${trad ? '越後面的牌，越是在說前面的能量會怎麼發展、被修正，或應該怎麼處理；不要把每張牌當成互不相關的結論。' : '越后面的牌，越是在说前面的能量会怎么发展、被修正，或应该怎么处理；不要把每张牌当成互不相关的结论。'}`;
  }

  function buildStructure(a) {
    const lang = currentLanguage();
    const notes = [];
    const t = (cn, tw, en) => lang === 'en' ? en : (lang === 'zh-TW' ? tw : cn);

    if (a.majorCount >= Math.ceil(a.total * 0.5)) {
      notes.push(t(
        '大阿尔克那占比偏高，这组牌更像在谈一个有分量的转折、选择或长期课题。',
        '大阿爾克那占比偏高，這組牌更像在談一個有份量的轉折、選擇或長期課題。',
        'Major Arcana are prominent, pointing to a meaningful turning point, choice or longer-term lesson.'
      ));
    } else if (a.majorCount > 0) {
      notes.push(t(
        '牌面有大阿尔克那介入，但现实中的日常选择与具体做法仍然很重要。',
        '牌面有大阿爾克那介入，但現實中的日常選擇與具體做法仍然很重要。',
        'Major Arcana are present, but practical day-to-day choices still matter strongly.'
      ));
    } else {
      notes.push(t(
        '没有大牌主导，事情比较偏向可以透过沟通、习惯与具体选择去调整。',
        '沒有大牌主導，事情比較偏向可以透過溝通、習慣與具體選擇去調整。',
        'No Major Arcana dominate; concrete choices, habits and communication remain highly adjustable.'
      ));
    }

    if (a.reversedCount === 0) {
      notes.push(t('全数正位，整体能量表达直接。','全數正位，整體能量表達直接。','All cards are upright, giving the spread relatively direct momentum.'));
    } else if (a.reversedCount > a.total / 2) {
      notes.push(t(
        '逆位过半，比起急着推进，更需要先处理延迟、内在阻力、过度反应或尚未完成的问题。',
        '逆位過半，比起急著推進，更需要先處理延遲、內在阻力、過度反應或尚未完成的問題。',
        'Reversed cards are the majority; address delays, resistance, overcorrection or unfinished issues before pushing harder.'
      ));
    } else {
      notes.push(t(
        '正逆位交错，表示事情可以推进，但不同环节的速度并不一致。',
        '正逆位交錯，表示事情可以推進，但不同環節的速度並不一致。',
        'Upright and reversed cards are mixed, so progress is possible but different parts move at different speeds.'
      ));
    }

    if (a.orientationFlow === 'clearing' && a.total >= 3) {
      notes.push(t(
        '从前段到后段，逆位比例下降，牌面有「先卡、后松」的趋势。',
        '從前段到後段，逆位比例下降，牌面有「先卡、後鬆」的趨勢。',
        'Reversals decrease toward the later positions, suggesting a blocked beginning that gradually clears.'
      ));
    } else if (a.orientationFlow === 'tightening' && a.total >= 3) {
      notes.push(t(
        '后段逆位增加，表示越往后越需要谨慎处理细节，不适合只靠前期顺势一路推进。',
        '後段逆位增加，表示越往後越需要謹慎處理細節，不適合只靠前期順勢一路推進。',
        'Reversals increase later in the spread, so details and resistance become more important as the situation develops.'
      ));
    }

    if (a.dominantSuits.length) {
      const suitNames = a.dominantSuits.map(s => localized(suitMeta[s].names)).join('、');
      const elements = a.dominantSuits.map(s => localized(suitMeta[s].elementNames)).join('、');
      notes.push(t(
        `${suitNames}重复出现，整组解读明显向「${elements}元素」及其对应议题集中。`,
        `${suitNames}重複出現，整組解讀明顯向「${elements}元素」及其對應議題集中。`,
        `${suitNames} repeats, concentrating the reading around the ${elements} element and its related themes.`
      ));
    }

    if (a.courtCount >= 2) {
      notes.push(t(
        `宫廷牌出现 ${a.courtCount} 张，人际互动、角色立场或「谁在以什么方式行动」会比抽象情绪更重要。`,
        `宮廷牌出現 ${a.courtCount} 張，人際互動、角色立場或「誰在以什麼方式行動」會比抽象情緒更重要。`,
        `${a.courtCount} court cards appear, increasing the importance of people, roles and how each person acts.`
      ));
    }

    if (a.aceCount >= 2) {
      notes.push(t(
        `出现 ${a.aceCount} 张 Ace，新机会、新起点或尚在萌芽的可能性被明显放大。`,
        `出現 ${a.aceCount} 張 Ace，新機會、新起點或尚在萌芽的可能性被明顯放大。`,
        `${a.aceCount} Aces amplify new opportunities, beginnings or potential that is still taking shape.`
      ));
    }

    if (a.tenCount >= 2) {
      notes.push(t(
        `出现 ${a.tenCount} 张十号牌，某个阶段接近完成、结算或需要决定是否进入下一轮。`,
        `出現 ${a.tenCount} 張十號牌，某個階段接近完成、結算或需要決定是否進入下一輪。`,
        `${a.tenCount} Tens emphasize completion, culmination or a decision about what comes after this cycle.`
      ));
    }

    a.repeatedRanks.forEach(r => {
      notes.push(t(
        `数字「${numberLabel(r.rank)}」重复 ${r.count} 次，同一种成长阶段正在不同领域重复出现。`,
        `數字「${numberLabel(r.rank)}」重複 ${r.count} 次，同一種成長階段正在不同領域重複出現。`,
        `The number ${r.rank} repeats ${r.count} times, echoing the same developmental stage across different areas.`
      ));
    });

    a.sequences.forEach(seq => {
      const label = seq.map(numberLabel).join(' → ');
      notes.push(t(
        `出现连续数字 ${label}，牌面带有明显的阶段推进感。`,
        `出現連續數字 ${label}，牌面帶有明顯的階段推進感。`,
        `A consecutive number sequence (${label}) adds a clear sense of progression.`
      ));
    });

    if (a.majorRuns.length) {
      notes.push(t(
        '相邻位置连续出现大阿尔克那，表示这些阶段彼此紧密相连，不适合完全拆开解释。',
        '相鄰位置連續出現大阿爾克那，表示這些階段彼此緊密相連，不適合完全拆開解釋。',
        'Adjacent Major Arcana form a run, linking those positions into one larger turning point rather than separate events.'
      ));
    }

    if (a.missingElements.length >= 2 && a.total >= 5) {
      const missing = a.missingElements.map(elementName).join('、');
      notes.push(t(
        `小阿尔克那的元素分布不平均，${missing}能量没有出现；这通常提醒你检查自己是否忽略了对应的思考方式或行动资源。`,
        `小阿爾克那的元素分布不平均，${missing}能量沒有出現；這通常提醒你檢查自己是否忽略了對應的思考方式或行動資源。`,
        `The elemental mix is uneven and ${missing} is absent among the Minor Arcana. Check whether a corresponding resource or way of responding is being overlooked.`
      ));
    }

    return notes.join(lang === 'en' ? ' ' : '');
  }

  function choiceBranchText(items, label) {
    const lang = currentLanguage();
    const reversed = items.filter(x => x.reversed).length;
    const majors = items.filter(x => x.card.arcana === 'major').length;
    const outcome = items[items.length - 1];

    if (lang === 'en') {
      const pace = reversed === 0
        ? 'currently reads as the more direct path'
        : reversed === items.length
          ? 'currently carries more friction or unfinished conditions'
          : 'contains both momentum and points that need adjustment';
      const weight = majors ? ` It also contains ${majors} Major Arcana signal${majors > 1 ? 's' : ''}, giving this path extra long-term weight.` : '';
      return `${label} ${pace}; its outcome card is ${cardName(outcome.card)} (${orientationText(outcome.reversed)}).${weight}`;
    }

    const trad = lang === 'zh-TW';
    const pace = reversed === 0
      ? (trad ? '目前看起來較直接、阻力較少' : '目前看起来较直接、阻力较少')
      : reversed === items.length
        ? (trad ? '目前帶著較多阻力、延遲或尚未完成的條件' : '目前带着较多阻力、延迟或尚未完成的条件')
        : (trad ? '同時有推進力與需要修正的地方' : '同时有推进力与需要修正的地方');
    const weight = majors
      ? `${trad ? '這條路另外出現' : '这条路另外出现'} ${majors} ${trad ? '張大牌，代表它對長期方向的影響較有份量。' : '张大牌，代表它对长期方向的影响较有分量。'}`
      : '';
    return `${label}${pace}；${trad ? '結果位' : '结果位'}是「${cardName(outcome.card)}・${orientationText(outcome.reversed)}」。${weight}`;
  }

  function questionFraming() {
    const q = state.question;
    const lang = currentLanguage();
    if (!q) return '';

    const isTiming = /(什么时候|何时|多久|幾時|何時|多久|when|how long)/i.test(q);
    const isBinary = /(会不会|能不能|是不是|是否|會不會|能不能|是不是|是否|will it|should i|yes or no)/i.test(q);

    if (isTiming) {
      return lang === 'en'
        ? ' Because your question asks about timing, treat the cards as showing readiness and sequence rather than a guaranteed calendar date.'
        : (lang === 'zh-TW'
            ? ' 你的問題包含時間性，這組牌比較適合看「何時具備條件、事情如何推進」，不把牌面當成保證發生的固定日期。'
            : ' 你的问题包含时间性，这组牌比较适合看「何时具备条件、事情如何推进」，不把牌面当成保证发生的固定日期。');
    }

    if (isBinary) {
      return lang === 'en'
        ? ' Because your question is close to yes/no, use the spread to understand conditions and consequences rather than forcing the cards into a binary verdict.'
        : (lang === 'zh-TW'
            ? ' 你的問題接近「是／否」，這組牌更適合拿來看成立條件、阻力與後果，而不是硬把牌壓成單一二元答案。'
            : ' 你的问题接近「是／否」，这组牌更适合拿来看成立条件、阻力与后果，而不是硬把牌压成单一二元答案。');
    }
    return '';
  }

  function buildFinalAdvice(draw, analysis) {
    const lang = currentLanguage();
    const spread = selectedSpread();
    const topic = localized(selectedTopic().name);
    const qPrefix = state.question
      ? (lang === 'en' ? `For “${state.question}”: ` : `针对「${state.question}」：`)
      : (lang === 'en' ? `For ${topic}: ` : `针对「${topic}」：`);

    let core = '';

    if (spread.key === 'choice5') {
      const A = state.optionA || ui('optionA');
      const B = state.optionB || ui('optionB');
      const aItems = [draw[1], draw[2]];
      const bItems = [draw[3], draw[4]];
      core = `${choiceBranchText(aItems, A)} ${choiceBranchText(bItems, B)} `;
      core += lang === 'en'
        ? 'Compare which path matches your priorities and what cost you are genuinely willing to carry; do not choose only by whichever branch looks easier.'
        : (lang === 'zh-TW'
            ? '最後請比較的是：哪一條路更符合你的優先順序，以及你真正願意承擔哪一種代價，而不是只選看起來比較輕鬆的那條。'
            : '最后请比较的是：哪一条路更符合你的优先顺序，以及你真正愿意承担哪一种代价，而不是只选看起来比较轻松的那条。');
    } else if (spread.key === 'relationship5') {
      const direction = draw[4];
      const obstacle = draw[3];
      const counterpart = counterpartLabel();

      core = lang === 'en'
        ? `Do not treat your card, ${counterpart}'s card, or the environment card as proof of a fixed outcome. Work first with the obstacle shown by ${cardName(obstacle.card)}, then use ${cardName(direction.card)} as the most practical direction for the interaction.`
        : (lang === 'zh-TW'
            ? `不要把「自己」或「${counterpart}」的牌直接當成固定結果的證明。先處理「${cardName(obstacle.card)}」所代表的阻礙，再把「${cardName(direction.card)}」當成目前這段互動最值得實踐的方向。`
            : `不要把「自己」或「${counterpart}」的牌直接当成固定结果的证明。先处理「${cardName(obstacle.card)}」所代表的阻碍，再把「${cardName(direction.card)}」当成目前这段互动最值得实践的方向。`);
    } else {
      const last = draw[draw.length - 1];
      const lead = last?.meaning?.advice || '';
      const tone = analysis.reversedCount > analysis.total / 2
        ? (lang === 'en'
            ? ' Slow down enough to resolve the blocked part before expanding the plan.'
            : (lang === 'zh-TW'
                ? ' 先整理阻力，再談加速；把卡住的環節處理好，會比硬推更有效。'
                : ' 先整理阻力，再谈加速；把卡住的环节处理好，会比硬推更有效。'))
        : (lang === 'en'
            ? ' Choose the next concrete step you can actually carry out, then adjust after seeing the result.'
            : (lang === 'zh-TW'
                ? ' 把焦點放在下一個真正做得到的行動，做完再根據結果調整，不必一次把所有答案想完。'
                : ' 把焦点放在下一个真正做得到的行动，做完再根据结果调整，不必一次把所有答案想完。'));
      core = `${lead}${tone}`;
    }

    return qPrefix + core + questionFraming();
  }

  async function init() {
    renderStaticLanguage();

    try {
      const [cardsResponse, meaningsResponse, spreadsResponse] = await Promise.all([
        fetch('../data/tarot/cards.json', { cache: 'no-store' }),
        fetch('../data/tarot/meanings.json', { cache: 'no-store' }),
        fetch('../data/tarot/spreads.json', { cache: 'no-store' })
      ]);

      if (!cardsResponse.ok || !meaningsResponse.ok || !spreadsResponse.ok) {
        throw new Error('Tarot data load failed');
      }

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
      if (state.spreads.length < 5) throw new Error('V0.7 spread definitions missing');

      renderControls();
      byId('drawTarotBtn').disabled = false;
    } catch (error) {
      console.error(error);
      byId('tarotLoadError').hidden = false;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    byId('questionInput')?.addEventListener('input', (event) => {
      byId('questionCount').textContent = String(event.target.value.length);
    });

    byId('optionAInput')?.addEventListener('input', (event) => {
      state.optionA = event.target.value.trim();
    });
    byId('optionBInput')?.addEventListener('input', (event) => {
      state.optionB = event.target.value.trim();
    });

    byId('drawTarotBtn')?.addEventListener('click', draw);
    byId('drawTarotAgainBtn')?.addEventListener('click', draw);
    byId('scrollTopBtn')?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    init();
  });
})();
