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
    nextRevealIndex: 0,
    currentDrawId: '',
    history: []
  };

  const byId = (id) => document.getElementById(id);

  const UI = {
    'zh-CN': {
      brand: '星辰日记',
      back: '返回首页',
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
      directAnswerHeading: '先给你一句话答案',
      storyHeading: '为什么会得到这个答案',
      structureHeading: '读牌重点',
      finalAdviceHeading: '把答案带回生活',
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
      placeholderStudy: '例如：这次考试／学习计划该怎么调整？',
      historyButton:'历史记录', historyTitle:'最近的塔罗记录',
      historyHint:'结果保存在当前浏览器，最多保留最近 10 则。',
      historyEmpty:'还没有完成的塔罗记录。全部牌翻开后，会自动保存在这里。',
      historyClear:'清空记录', historyClearConfirm:'确定要清空这台浏览器里的塔罗历史记录吗？',
      historyGeneral:'一般指引', historyCards:'牌面', historyAnswer:'直接回答', historyStory:'牌面故事',
      historyStructure:'结构重点', historyAdvice:'最终建议'
    },
    'zh-TW': {
      brand: '星辰日記',
      back: '返回首頁',
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
      directAnswerHeading: '先給你一句話答案',
      storyHeading: '為什麼會得到這個答案',
      structureHeading: '讀牌重點',
      finalAdviceHeading: '把答案帶回生活',
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
      placeholderStudy: '例如：這次考試／學習計畫該怎麼調整？',
      historyButton:'歷史紀錄', historyTitle:'最近的塔羅紀錄',
      historyHint:'結果保存在目前瀏覽器，最多保留最近 10 則。',
      historyEmpty:'還沒有完成的塔羅紀錄。全部牌翻開後，會自動保存在這裡。',
      historyClear:'清空紀錄', historyClearConfirm:'確定要清空這台瀏覽器裡的塔羅歷史紀錄嗎？',
      historyGeneral:'一般指引', historyCards:'牌面', historyAnswer:'直接回答', historyStory:'牌面故事',
      historyStructure:'結構重點', historyAdvice:'最終建議'
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
      directAnswerHeading: 'Direct answer',
      storyHeading: 'Why the reading says this',
      structureHeading: 'How to read the signals',
      finalAdviceHeading: 'Bring the answer into real life',
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
      historyButton:'History', historyTitle:'Recent tarot readings',
      historyHint:'Saved in this browser, up to the latest 10 readings.',
      historyEmpty:'No completed tarot readings yet. A reading is saved after every card is revealed.',
      historyClear:'Clear history', historyClearConfirm:'Clear tarot history stored in this browser?',
      historyGeneral:'General guidance', historyCards:'Cards', historyAnswer:'Direct answer', historyStory:'Narrative',
      historyStructure:'Structural signals', historyAdvice:'Final advice',
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
    byId('directAnswerHeading').textContent = ui('directAnswerHeading');
    byId('storyHeading').textContent = ui('storyHeading');
    byId('structureHeading').textContent = ui('structureHeading');
    byId('finalAdviceHeading').textContent = ui('finalAdviceHeading');
    byId('tarotLoadError').textContent = ui('loadError');
    byId('optionALabel').textContent = ui('optionA');
    byId('optionBLabel').textContent = ui('optionB');
    byId('optionAInput').placeholder = ui('optionAPlaceholder');
    byId('optionBInput').placeholder = ui('optionBPlaceholder');
    byId('questionInput').placeholder = questionPlaceholder();
    byId('tarotHistoryButtonText').textContent = ui('historyButton');
    byId('tarotHistoryTitle').textContent = ui('historyTitle');
    byId('tarotHistoryHint').textContent = ui('historyHint');
    byId('tarotHistoryClear').textContent = ui('historyClear');
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
          <img src="../images/tarot/cards/CardBacks.webp" alt="" />
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

  function tarotHistoryKey() {
    return window.XingchenRecords?.KEYS?.tarotHistory || 'xingchen-tarot-history-v1';
  }

  function readTarotHistory() {
    if (window.XingchenRecords?.read) {
      const value = window.XingchenRecords.read(tarotHistoryKey(),[]);
      return Array.isArray(value) ? value.slice(0,10) : [];
    }
    try {
      const value = JSON.parse(localStorage.getItem(tarotHistoryKey()) || '[]');
      return Array.isArray(value) ? value.slice(0,10) : [];
    } catch {
      return [];
    }
  }

  function writeTarotHistory(records) {
    const next = Array.isArray(records) ? records.slice(0,10) : [];
    if (window.XingchenRecords?.write) {
      window.XingchenRecords.write(tarotHistoryKey(),next);
    } else {
      try { localStorage.setItem(tarotHistoryKey(),JSON.stringify(next)); } catch {}
    }
    state.history = next;
    return next;
  }

  function pushTarotHistory(record) {
    if (window.XingchenRecords?.pushCapped) {
      state.history = window.XingchenRecords.pushCapped(tarotHistoryKey(),record,10);
    } else {
      const existing = readTarotHistory().filter(item => item?.id !== record.id);
      state.history = writeTarotHistory([record,...existing].slice(0,10));
    }
    return state.history;
  }

  function historyTopicName(record) {
    const source = state.topics.find(item => item.key === record.topicKey);
    return source ? localized(source.name) : (record.topicName || record.topicKey || '');
  }

  function historySpreadName(record) {
    const source = state.spreads.find(item => item.key === record.spreadKey);
    return source ? localized(source.name) : (record.spreadName || record.spreadKey || '');
  }

  function historyCardName(item) {
    const card = state.cards.find(card => card.key === item.key);
    return card ? cardName(card) : (item.name || item.key || '');
  }

  function historyDateLabel(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || '';
    const locale = currentLanguage() === 'en'
      ? 'en-US'
      : (currentLanguage() === 'zh-TW' ? 'zh-TW' : 'zh-CN');
    return new Intl.DateTimeFormat(locale,{
      year:'numeric',month:'2-digit',day:'2-digit',
      hour:'2-digit',minute:'2-digit',hour12:false
    }).format(date);
  }

  function renderTarotHistory() {
    state.history = readTarotHistory();
    const list = byId('tarotHistoryList');
    const count = byId('tarotHistoryCount');
    if (count) count.textContent = String(state.history.length);
    if (!list) return;

    if (!state.history.length) {
      list.innerHTML = `<p class="tarot-history-empty">${escapeHtml(ui('historyEmpty'))}</p>`;
      return;
    }

    list.innerHTML = state.history.map(record => {
      const question = record.question || ui('historyGeneral');
      const cards = (record.cards || []).map((item,index) =>
        `<li>
          <span>${index+1}. ${escapeHtml(item.positionName || '')}</span>
          <strong>${escapeHtml(historyCardName(item))}</strong>
          <small class="${item.reversed ? 'is-reversed' : ''}">${escapeHtml(item.reversed ? ui('reversed') : ui('upright'))}</small>
        </li>`
      ).join('');

      return `
        <details class="tarot-history-item">
          <summary>
            <span class="tarot-history-date">${escapeHtml(historyDateLabel(record.createdAt))}</span>
            <strong>${escapeHtml(historyTopicName(record))} · ${escapeHtml(historySpreadName(record))}</strong>
            <small>${escapeHtml(question)}</small>
          </summary>
          <div class="tarot-history-detail">
            <section>
              <h3>${escapeHtml(ui('historyCards'))}</h3>
              <ol class="tarot-history-cards">${cards}</ol>
            </section>
            ${record.directAnswer ? `<section class="tarot-history-answer">
              <h3>${escapeHtml(ui('historyAnswer') || ui('directAnswerHeading'))}</h3>
              <p>${escapeHtml(record.directAnswer)}</p>
            </section>` : ''}
            <section>
              <h3>${escapeHtml(ui('historyStory'))}</h3>
              <p>${escapeHtml(record.story || '')}</p>
            </section>
            <section>
              <h3>${escapeHtml(ui('historyStructure'))}</h3>
              <p>${escapeHtml(record.structure || '')}</p>
            </section>
            <section class="tarot-history-advice">
              <h3>${escapeHtml(ui('historyAdvice'))}</h3>
              <p>${escapeHtml(record.finalAdvice || '')}</p>
            </section>
          </div>
        </details>`;
    }).join('');
  }

  function saveCompletedTarotHistory(analysis, texts) {
    if (!state.currentDrawId || !state.currentDraw.length) return;

    const topic = selectedTopic();
    const spread = selectedSpread();

    const record = {
      version:1,
      id:state.currentDrawId,
      createdAt:new Date().toISOString(),
      topicKey:state.selectedTopic,
      topicName:localized(topic?.name),
      spreadKey:state.selectedSpread,
      spreadName:localized(spread?.name),
      question:state.question,
      optionA:state.optionA,
      optionB:state.optionB,
      cards:state.currentDraw.map(item => ({
        key:item.card.key,
        name:cardName(item.card),
        reversed:Boolean(item.reversed),
        positionKey:item.position?.key || '',
        positionName:positionName(item.position)
      })),
      signals:signalChips(analysis),
      directAnswer:texts.directAnswer || '',
      story:texts.story,
      structure:texts.structure,
      finalAdvice:texts.finalAdvice
    };

    pushTarotHistory(record);
    renderTarotHistory();
  }

  function readInputs() {
    state.question = byId('questionInput').value.trim();
    state.optionA = byId('optionAInput').value.trim();
    state.optionB = byId('optionBInput').value.trim();
  }

  function draw() {
    if (!window.XingchenPlayer?.hasProfile?.()) {
      window.XingchenPlayer?.ensure?.(() => draw());
      return;
    }
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
    state.currentDrawId = globalThis.crypto?.randomUUID?.()
      || `tarot-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
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
              <img src="../images/tarot/cards/CardBacks.webp" alt="" />
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

  function truncateUtf8(text, maxBytes) {
    const value = String(text || '');
    const encoder = new TextEncoder();
    if (encoder.encode(value).length <= maxBytes) return value;
    let out = '';
    for (const char of value) {
      if (encoder.encode(out + char + '…').length > maxBytes) break;
      out += char;
    }
    return out.trimEnd() + '…';
  }

  function sendTarotBark(analysis, texts) {
    if (!window.XingchenBark?.send) return;

    const player = window.XingchenPlayer?.label?.() || '未命名玩家';
    const topicText = localized(selectedTopic()?.name) || state.selectedTopic;
    const spreadText = localized(selectedSpread()?.name) || state.selectedSpread;

    const cards = state.currentDraw.map((item,index) =>
      `${index+1}. ${positionName(item.position)}｜${cardName(item.card)}｜${orientationText(item.reversed)}`
    );

    const fullBody = [
      `玩家：${player}`,
      `问题方向：${topicText}`,
      `牌阵：${spreadText}`,
      state.question ? `问题：${state.question}` : '问题：一般指引',
      state.selectedSpread === 'choice5'
        ? `选项 A：${state.optionA || '未填写'}\n选项 B：${state.optionB || '未填写'}`
        : '',
      '',
      '牌面：',
      ...cards,
      '',
      `直接回答：${texts?.directAnswer || buildDirectAnswer(state.currentDraw, analysis, analyseQuestion())}`,
      '',
      `生活指引：${texts?.finalAdvice || buildFinalAdvice(state.currentDraw, analysis)}`
    ].filter(Boolean).join('\n');

    // The website keeps the full teacher-style analysis. Bark gets a compact
    // summary so richer local text never exceeds the Edge Function body limit.
    const body = truncateUtf8(fullBody, 2650);

    window.XingchenBark.send({
      title:'🔮 星辰日记｜塔罗结果',
      subtitle:player,
      body,
      group:'星辰日记·塔罗牌'
    });
  }

  function revealCombination() {
    const analysis = analyseStructure(state.currentDraw);
    const questionProfile = analyseQuestion();
    const texts = {
      directAnswer:buildDirectAnswer(state.currentDraw, analysis, questionProfile),
      story:buildStory(state.currentDraw, analysis, questionProfile),
      structure:buildStructure(analysis, questionProfile, state.currentDraw),
      finalAdvice:buildFinalAdvice(state.currentDraw, analysis, questionProfile)
    };

    byId('signalChips').innerHTML =
      signalChips(analysis).map(x => `<span>${escapeHtml(x)}</span>`).join('');
    byId('directAnswerText').textContent = texts.directAnswer;
    byId('storyText').textContent = texts.story;
    byId('structureText').textContent = texts.structure;
    byId('finalAdviceText').textContent = texts.finalAdvice;
    byId('combinationReading').hidden = false;
    byId('revealGuideTitle').textContent = ui('allRevealed');
    byId('revealGuideText').textContent = '';

    requestAnimationFrame(() => {
      byId('combinationReading').classList.add('is-visible');
    });

    saveCompletedTarotHistory(analysis,texts);
    sendTarotBark(analysis,texts);
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

  // V0.11.1.7 · Teacher-style question-aware local interpretation engine.
  // This deliberately stays deterministic and local: no question text is sent to an AI service.
  function analyseQuestion() {
    const q = (state.question || '').trim();
    const spreadKey = selectedSpread()?.key || '';
    const lower = q.toLowerCase();
    const has = (pattern) => pattern.test(q) || pattern.test(lower);

    let intent = 'general';
    if (spreadKey === 'choice5') intent = 'choice';
    else if (has(/什么时候|什麼時候|何时|幾時|何時|多久|哪一天|幾天|几天|when|how long|what time/i)) intent = 'timing';
    else if (has(/为什么|為什麼|因为|因為|原因|怎么会|怎麼會|为何|為何|why/i)) intent = 'reason';
    else if (state.selectedTopic === 'love' && has(/复合|復合|和好|重新在一起|重来|重來|回到一起|reconcil/i)) intent = 'reconcile';
    else if (state.selectedTopic === 'love' && has(/喜欢我|喜歡我|爱我|愛我|在意我|想我|对我.*感觉|對我.*感覺|心里.*我|心裡.*我|怎么看我|怎麼看我|feel.*about me|like me|love me/i)) intent = 'feelings';
    else if (has(/主动|主動|联系|聯絡|找我|回我|消息|行动|行動|表白|告白|约我|約我|开口|開口|会来|會來|will.*contact|will.*message|reach out/i)) intent = 'action';
    else if (has(/应不应该|應不應該|该不该|該不該|要不要|值不值得|值得吗|值得嗎|怎么选|怎麼選|should i|which should|worth it/i)) intent = 'decision';
    else if (has(/会不会|會不會|能不能|是不是|是否|有没有|有沒有|will it|can i|yes or no/i)) intent = 'binary';
    else if (has(/发展|發展|走向|结果|結果|未来|未來|接下来|接下來|最后|最後|会怎样|會怎樣|如何发展|如何發展|outcome|future|develop/i)) intent = 'development';
    else if (has(/怎么办|怎麼辦|怎么做|怎麼做|建议|建議|如何处理|如何處理|what should|advice/i)) intent = 'advice';

    return {
      raw:q,
      intent,
      hasQuestion:Boolean(q),
      topic:state.selectedTopic,
      spread:spreadKey
    };
  }

  const positiveToneTerms = [
    '新开始','新開始','自由','信任','行动','行動','资源','資源','创造','創造','直觉','直覺','成长','成長','丰盛','豐盛','稳定','穩定','成功','希望','疗愈','療癒','喜悦','喜悅','庆祝','慶祝','合作','和谐','和諧','吸引','热情','熱情','勇气','勇氣','平衡','清晰','沟通','溝通','前进','前進','机会','機會','收获','收穫','满足','滿足','成就','承诺','承諾','支持','安全','成熟','恢复','恢復','完成','智慧','掌控','突破','好运','好運','幸福','连接','連結','亲密','親密','互惠','坚定','堅定'
  ];
  const challengingToneTerms = [
    '鲁莽','魯莽','逃避','准备不足','準備不足','分心','操控','混乱','混亂','秘密','阻碍','阻礙','拖延','冲突','衝突','失落','焦虑','焦慮','恐惧','恐懼','欺骗','欺騙','控制','停滞','停滯','孤立','不安','破裂','危机','危機','压力','壓力','争执','爭執','犹豫','猶豫','依赖','依賴','嫉妒','固执','固執','背叛','痛苦','悲伤','悲傷','耗损','耗損','匮乏','匱乏','束缚','束縛','执念','執念','幻觉','幻覺','隐藏','隱藏','防御','防禦','冷淡','延迟','延遲','过度','過度','未完成','受阻','结束','結束','崩塌','牺牲','犧牲','压抑','壓抑','怀疑','懷疑'
  ];

  function cardTone(item) {
    const text = `${item?.meaning?.keywords?.join(' ') || ''} ${item?.meaning?.meaning || ''}`;
    let positive = 0;
    let challenging = 0;
    positiveToneTerms.forEach(term => { if (text.includes(term)) positive += 1; });
    challengingToneTerms.forEach(term => { if (text.includes(term)) challenging += 1; });

    let score = (positive - challenging) * 0.32;
    if (!positive && !challenging) score += item?.reversed ? -0.18 : 0.12;
    if (item?.reversed) score -= 0.14;
    return Math.max(-1, Math.min(1, score));
  }

  function positionWeight(item) {
    const spread = selectedSpread()?.key;
    const key = item?.position?.key || '';
    const weights = {
      single:{guidance:1.2},
      weekly3:{current:0.75,trend:1.25,advice:0.8},
      monthly5:{early:0.5,mid1:0.65,mid2:0.8,late:1.2,advice:0.75},
      relationship5:{self:0.55,other:0.9,core:1.2,obstacle:1.0,direction:1.35},
      choice5:{current:0.45,optionA:0.9,optionAOutcome:1.25,optionB:0.9,optionBOutcome:1.25}
    };
    return weights[spread]?.[key] || 1;
  }

  function spreadTendency(draw) {
    let weighted = 0;
    let totalWeight = 0;
    draw.forEach(item => {
      const weight = positionWeight(item);
      weighted += cardTone(item) * weight;
      totalWeight += weight;
    });
    return totalWeight ? weighted / totalWeight : 0;
  }

  function branchTendency(items) {
    if (!items?.length) return 0;
    return items.reduce((sum,item,index) => sum + cardTone(item) * (index === items.length - 1 ? 1.35 : 1),0)
      / items.reduce((sum,_,index) => sum + (index === items.length - 1 ? 1.35 : 1),0);
  }

  function tendencyBand(score) {
    if (score >= 0.42) return 'supportive';
    if (score >= 0.12) return 'leaning-supportive';
    if (score <= -0.42) return 'challenging';
    if (score <= -0.12) return 'leaning-challenging';
    return 'mixed';
  }

  function keyThemes(items, limit = 3) {
    const seen = new Set();
    const result = [];
    (items || []).forEach(item => {
      (item?.meaning?.keywords || []).forEach(keyword => {
        const value = String(keyword || '').trim();
        if (!value || seen.has(value)) return;
        seen.add(value);
        result.push(value);
      });
    });
    return result.slice(0, limit);
  }

  function mostRelevantItems(draw, profile) {
    const byKey = (key) => draw.find(item => item.position?.key === key);
    if (profile.intent === 'reason' && profile.spread === 'relationship5') {
      return [byKey('obstacle'),byKey('other'),byKey('core')].filter(Boolean);
    }
    if ((profile.intent === 'feelings' || profile.intent === 'action' || profile.intent === 'reconcile') && profile.spread === 'relationship5') {
      return [byKey('other'),byKey('core'),byKey('direction'),byKey('obstacle')].filter(Boolean);
    }
    if (profile.intent === 'timing') return draw.slice(-Math.min(3,draw.length));
    return [...draw].sort((a,b) => positionWeight(b) - positionWeight(a)).slice(0,Math.min(3,draw.length));
  }

  function buildDirectAnswer(draw, analysis, profile = analyseQuestion()) {
    const lang = currentLanguage();
    const score = spreadTendency(draw);
    const band = tendencyBand(score);
    const relevant = mostRelevantItems(draw, profile);
    const themes = keyThemes(relevant,3);
    const themeText = themes.length ? themes.join(lang === 'en' ? ', ' : '、') : '';
    const q = profile.raw;
    const zh = lang !== 'en';
    const trad = lang === 'zh-TW';

    if (profile.intent === 'choice' && draw.length >= 5) {
      const A = state.optionA || ui('optionA');
      const B = state.optionB || ui('optionB');
      const aScore = branchTendency([draw[1],draw[2]]);
      const bScore = branchTendency([draw[3],draw[4]]);
      const diff = aScore - bScore;
      if (lang === 'en') {
        if (Math.abs(diff) < 0.18) return `The two paths are close. ${A} and ${B} carry different trade-offs rather than a clear winner; compare which cost you are more willing to carry.`;
        const better = diff > 0 ? A : B;
        return `${better} currently reads as the smoother path, but the cards still describe conditions rather than a guaranteed outcome.`;
      }
      if (Math.abs(diff) < 0.18) return `${trad ? '兩條路目前差距不大' : '两条路目前差距不大'}；「${A}」與「${B}」比較像各有代價，重點不是硬選一個絕對正確答案，而是看你更願意承擔哪一種成本。`;
      const better = diff > 0 ? A : B;
      return `${trad ? '目前牌面較偏向' : '目前牌面较偏向'}「${better}」這條路較順，但這是條件式傾向，不代表結果已經被固定。`;
    }

    if (!profile.hasQuestion) {
      if (lang === 'en') return band.includes('supportive') ? 'The overall flow is constructive: move forward, but keep the advice card as your practical checkpoint.' : band.includes('challenging') ? 'The spread is asking for adjustment before acceleration; resolve the blocked part first.' : 'The spread is mixed: there is room to move, but the next step matters more than forcing a final verdict.';
      return band.includes('supportive')
        ? (trad ? '整體牌勢偏順，現在可以往前走，但要把建議位當成行動前的檢查點。' : '整体牌势偏顺，现在可以往前走，但要把建议位当成行动前的检查点。')
        : band.includes('challenging')
          ? (trad ? '整體阻力偏高，現在不是硬推的時候；先處理卡住的環節，後面的路會比較清楚。' : '整体阻力偏高，现在不是硬推的时候；先处理卡住的环节，后面的路会比较清楚。')
          : (trad ? '牌面訊號有好有壞，事情不是不能走，而是暫時不適合急著下最終結論。' : '牌面讯号有好有坏，事情不是不能走，而是暂时不适合急着下最终结论。');
    }

    if (profile.intent === 'reason') {
      if (lang === 'en') return `The core cause looks less like one isolated event and more like a mix of ${themeText || 'the pressures shown in the key positions'}. Read the obstacle and counterpart cards together before blaming a single factor.`;
      return `${trad ? '核心原因比較不像單一事件' : '核心原因比较不像单一事件'}，而是「${themeText || (trad ? '牌面中的幾股壓力' : '牌面中的几股压力')}」疊在一起。尤其要把阻礙位與對方／環境位一起看，不宜只抓一個原因下結論。`;
    }

    if (profile.intent === 'feelings') {
      if (lang === 'en') {
        if (score >= 0.28) return `The relationship energy suggests genuine interest or emotional connection, but it still needs consistent behavior to become something reliable.`;
        if (score <= -0.28) return `The cards do not show enough stable emotional investment right now; distance, hesitation or self-protection is stronger than clear pursuit.`;
        return `There are emotional signals, but they are mixed. Interest may exist, yet the current pattern is not stable enough to treat as a clear declaration.`;
      }
      if (score >= 0.28) return `${trad ? '這組牌偏向「有感受／有在意」' : '这组牌偏向“有感受／有在意”'}，但能不能變成穩定關係，要看對方是否有持續而一致的實際行動。`;
      if (score <= -0.28) return `${trad ? '目前牌面看不到足夠穩定的情感投入' : '目前牌面看不到足够稳定的情感投入'}；退縮、顧慮或自我保護的能量，比明確追求更強。`;
      return `${trad ? '牌面裡有感情訊號，但彼此矛盾' : '牌面里有感情讯号，但彼此矛盾'}；可以說「不是完全沒感覺」，但現在還不足以把它當成明確承諾。`;
    }

    if (profile.intent === 'action') {
      if (lang === 'en') return score >= 0.3 ? 'There is a reasonable chance of action or contact, though the pace still depends on whether the current hesitation is resolved.' : score <= -0.3 ? 'Short-term initiative looks weak. Waiting for a clear action is more realistic than assuming contact is imminent.' : 'Contact is possible, but the signal is inconsistent; watch actual follow-through rather than reading too much into small signs.';
      if (score >= 0.3) return `${trad ? '偏向有機會出現主動或聯絡' : '偏向有机会出现主动或联系'}，但速度仍取決於目前的猶豫或阻力能不能被處理。`;
      if (score <= -0.3) return `${trad ? '短期主動性偏弱' : '短期主动性偏弱'}；與其預設對方很快會行動，不如先觀察是否真的出現明確而持續的動作。`;
      return `${trad ? '有聯絡／行動的可能，但訊號不穩定' : '有联系／行动的可能，但讯号不稳定'}；真正值得判斷的是後續有沒有持續，而不是單次訊息或一時熱度。`;
    }

    if (profile.intent === 'reconcile') {
      if (lang === 'en') return score >= 0.3 ? 'Reconnection is possible, but only if the old obstacle is handled differently this time.' : score <= -0.3 ? 'The cards lean away from a smooth reconciliation in the near term; unresolved issues are still stronger than reunion energy.' : 'Reconciliation is not ruled out, but the conditions are not mature enough for a confident yes.';
      if (score >= 0.3) return `${trad ? '有重新靠近的可能' : '有重新靠近的可能'}，但前提是舊問題要用不同方式處理；如果互動模式不變，復合也容易回到原本的卡點。`;
      if (score <= -0.3) return `${trad ? '短期不太像能順利復合' : '短期不太像能顺利复合'}，未處理的阻礙仍比重新連結的力量更強。`;
      return `${trad ? '復合並非完全沒有可能，但條件還沒成熟' : '复合并非完全没有可能，但条件还没成熟'}；目前更適合看阻礙能否被真正處理，而不是急著追一個「會／不會」。`;
    }

    if (profile.intent === 'timing') {
      if (lang === 'en') return analysis.orientationFlow === 'clearing' && score > -0.1 ? 'Timing looks closer once the current blockage begins to clear. The cards show sequence and readiness, not a reliable calendar date.' : analysis.orientationFlow === 'tightening' || score < -0.25 ? 'The conditions do not look fully ready yet. More delay or adjustment is likely before the event can move naturally.' : 'The timing is still fluid. Watch for the conditions described by the later cards rather than forcing an exact date.';
      if (analysis.orientationFlow === 'clearing' && score > -0.1) return `${trad ? '時間點正在接近，但要先等目前的卡點鬆開' : '时间点正在接近，但要先等目前的卡点松开'}。牌面比較能看出「條件成熟的順序」，不適合硬換算成某一天。`;
      if (analysis.orientationFlow === 'tightening' || score < -0.25) return `${trad ? '目前條件還沒完全到位，時間上偏向需要再等' : '目前条件还没完全到位，时间上偏向需要再等'}；後段阻力仍在增加，先看事情是否開始出現實際鬆動。`;
      return `${trad ? '時間仍有變動性' : '时间仍有变动性'}；與其猜固定日期，更適合觀察後段牌所代表的條件何時真正出現。`;
    }

    if (profile.intent === 'decision') {
      if (lang === 'en') return score >= 0.28 ? 'The cards lean toward taking the step, provided you can meet the practical conditions shown in the spread.' : score <= -0.28 ? 'The cards lean toward slowing down or reconsidering before committing; the current friction is meaningful.' : 'This is not a clean yes/no decision. Clarify the trade-off first, then choose the path whose cost you can actually accept.';
      if (score >= 0.28) return `${trad ? '牌面偏向可以往前做' : '牌面偏向可以往前做'}，但不是無條件的「可以」；先確認現實條件與風險都有被照顧。`;
      if (score <= -0.28) return `${trad ? '目前更適合先停一下、重整條件再決定' : '目前更适合先停一下、重整条件再决定'}；眼前的阻力不是小雜音，而是需要納入判斷的重要訊號。`;
      return `${trad ? '這不是很乾脆的「要／不要」' : '这不是很干脆的“要／不要”'}；先把你願意承擔的代價說清楚，答案會比硬問吉凶更實際。`;
    }

    if (profile.intent === 'binary') {
      if (lang === 'en') return score >= 0.35 ? 'The spread leans yes, but conditionally rather than absolutely.' : score <= -0.35 ? 'The spread currently leans no / not yet, with meaningful resistance still present.' : 'The spread is too mixed for a clean yes/no; the conditions matter more than the binary verdict.';
      if (score >= 0.35) return `${trad ? '整體偏向「可以／有機會」' : '整体偏向“可以／有机会”'}，但屬於有條件成立，不是百分之百保證。`;
      if (score <= -0.35) return `${trad ? '目前偏向「不容易／還不是時候」' : '目前偏向“不容易／还不是时候”'}，主要阻力仍然存在。`;
      return `${trad ? '牌面不足以乾脆回答「是」或「否」' : '牌面不足以干脆回答“是”或“否”'}；真正決定結果的是接下來條件有沒有改變。`;
    }

    if (profile.intent === 'development') {
      if (lang === 'en') return score >= 0.28 ? 'The direction is constructive, but the spread still asks for steady follow-through rather than assuming the outcome is secured.' : score <= -0.28 ? 'The near-term development is bumpy; without adjustment, the current pattern is more likely to stall or create distance.' : 'The development is still open. The later cards show both opportunity and correction, so the outcome depends heavily on what happens next.';
      if (score >= 0.28) return `${trad ? '後續走勢偏正向' : '后续走势偏正向'}，但需要持續投入，不能把目前的好訊號直接當成結果已經確定。`;
      if (score <= -0.28) return `${trad ? '短期走勢比較顛簸' : '短期走势比较颠簸'}；如果互動或做法不調整，事情比較容易停住、延遲或拉開距離。`;
      return `${trad ? '後續仍是開放局面' : '后续仍是开放局面'}；有機會，也有需要修正的地方，下一步怎麼做會明顯影響結果。`;
    }

    if (profile.intent === 'advice') {
      const guide = draw.find(item => ['advice','direction','guidance'].includes(item.position?.key)) || draw[draw.length - 1];
      const themes = keyThemes([guide],2).join(lang === 'en' ? ', ' : '、');
      if (lang === 'en') return `${cardName(guide.card)} (${orientationText(guide.reversed)}) puts the lesson on ${themes || 'the way you respond next'}: ${guide?.meaning?.advice || 'work with the clearest issue before adding more pressure.'}`;
      return `${trad ? '如果只抓一個重點' : '如果只抓一个重点'}，「${cardName(guide.card)}・${orientationText(guide.reversed)}」${trad ? '把課題放在' : '把课题放在'}「${themes || (trad ? '你接下來的回應方式' : '你接下来的回应方式')}」：${guide?.meaning?.advice || (trad ? '先看清楚最明顯的卡點，再決定怎麼回應。' : '先看清楚最明显的卡点，再决定怎么回应。')}`;
    }

    if (lang === 'en') return band.includes('supportive') ? `The spread leans constructive. ${themeText ? `The key themes are ${themeText}.` : ''}` : band.includes('challenging') ? `The spread highlights meaningful resistance. ${themeText ? `Watch ${themeText}.` : ''}` : `The message is mixed, so keep the situation open and judge it by what actually develops next.`;
    return band.includes('supportive')
      ? `${trad ? '整體傾向偏正向' : '整体倾向偏正向'}${themeText ? `，關鍵在「${themeText}」` : ''}。`
      : band.includes('challenging')
        ? `${trad ? '目前阻力比順勢更明顯' : '目前阻力比顺势更明显'}${themeText ? `，尤其要留意「${themeText}」` : ''}。`
        : `${trad ? '目前訊號偏混合，先保留彈性' : '目前讯号偏混合，先保留弹性'}；真正答案要看接下來實際發展。`;
  }

  function tarotText(cn, tw, en) {
    const lang = currentLanguage();
    return lang === 'en' ? en : (lang === 'zh-TW' ? tw : cn);
  }

  function guidanceItem(draw) {
    return (draw || []).find(item => ['advice','direction','guidance'].includes(item?.position?.key))
      || draw?.[draw.length - 1];
  }

  function challengeItem(draw) {
    return (draw || []).reduce((worst, item) => {
      if (!worst) return item;
      return cardTone(item) < cardTone(worst) ? item : worst;
    }, null);
  }

  function teachingCaution(profile = analyseQuestion()) {
    const map = {
      feelings: {
        'zh-CN':'这里最容易误会的是：有感觉，不等于愿意承担一段关系。真正能把感情坐实的，是持续、投入和清楚表达。',
        'zh-TW':'這裡最容易誤會的是：有感覺，不等於願意承擔一段關係。真正能把感情坐實的，是持續、投入和清楚表達。',
        en:'The common mistake is treating feelings as commitment. Reliable interest shows up through consistency, effort and clarity.'
      },
      action: {
        'zh-CN':'这里要分清楚三件事：想法、冲动和行动不是同一层级；一次联系，也不等于持续主动。',
        'zh-TW':'這裡要分清楚三件事：想法、衝動和行動不是同一層級；一次聯絡，也不等於持續主動。',
        en:'Separate thought, impulse and action. One message is not the same as sustained initiative.'
      },
      reason: {
        'zh-CN':'原因题最怕把一张牌当成“唯一真相”。牌更适合指出压力结构，你仍要用现实行为去验证。',
        'zh-TW':'原因題最怕把一張牌當成「唯一真相」。牌更適合指出壓力結構，你仍要用現實行為去驗證。',
        en:'Cause questions become misleading when one card is treated as the only truth. Use the spread as a pressure map, then verify it with behavior.'
      },
      reconcile: {
        'zh-CN':'还有感情，不等于适合复合；复合真正要看的，是旧问题能不能被用新的方式处理。',
        'zh-TW':'還有感情，不等於適合復合；復合真正要看的，是舊問題能不能被用新的方式處理。',
        en:'Remaining feelings do not automatically make reconciliation healthy. The key is whether the old problem can be handled differently.'
      },
      timing: {
        'zh-CN':'时间题不要把牌硬换算成日期。更可靠的读法，是先找出“条件成熟时会出现什么讯号”。',
        'zh-TW':'時間題不要把牌硬換算成日期。更可靠的讀法，是先找出「條件成熟時會出現什麼訊號」。',
        en:'Do not force timing cards into a date. A better reading asks what signs will appear when the conditions are ready.'
      },
      decision: {
        'zh-CN':'好牌不代表零成本，逆位也不等于绝对不能做。决定题要把收益、代价和自己能承受的最坏情况一起看。',
        'zh-TW':'好牌不代表零成本，逆位也不等於絕對不能做。決定題要把收益、代價和自己能承受的最壞情況一起看。',
        en:'A supportive card does not mean zero cost, and a reversal does not mean “never.” Include benefit, cost and the worst case you can carry.'
      },
      binary: {
        'zh-CN':'是非题真正有用的地方，不是替你盖章，而是看“什么条件下更像会、什么条件下更像不会”。',
        'zh-TW':'是非題真正有用的地方，不是替你蓋章，而是看「什麼條件下更像會、什麼條件下更像不會」。',
        en:'A yes/no spread is most useful when it shows the conditions that make “yes” more or less likely, rather than stamping a verdict.'
      },
      development: {
        'zh-CN':'走势是趋势，不是命定。后续牌告诉你的，是当前模式继续下去会走向哪里，以及哪里还有修正空间。',
        'zh-TW':'走勢是趨勢，不是命定。後續牌告訴你的，是目前模式繼續下去會走向哪裡，以及哪裡還有修正空間。',
        en:'A trend is not fate. Later cards show where the current pattern leads and where there is still room to change it.'
      },
      advice: {
        'zh-CN':'建议牌不是命令，而是一种练习方向。好的建议应该能放进现实，而不是让你为了“照牌做”忽略自己的界线。',
        'zh-TW':'建議牌不是命令，而是一種練習方向。好的建議應該能放進現實，而不是讓你為了「照牌做」忽略自己的界線。',
        en:'Advice cards are practice directions, not commands. A useful suggestion should fit real life without asking you to ignore your boundaries.'
      },
      choice: {
        'zh-CN':'二选一不是找“完美答案”，而是比较两条路各自会要求你付出什么、得到什么。',
        'zh-TW':'二選一不是找「完美答案」，而是比較兩條路各自會要求你付出什麼、得到什麼。',
        en:'A two-path reading is not about finding a perfect answer; it compares what each path asks you to give and what it may return.'
      }
    };
    if (map[profile.intent]) return localized(map[profile.intent]);
    if (profile.topic === 'love') return tarotText(
      '感情牌最值得学的是：把“感受”和“关系事实”分开看，前者可以很强，后者仍要靠双方行动建立。',
      '感情牌最值得學的是：把「感受」和「關係事實」分開看，前者可以很強，後者仍要靠雙方行動建立。',
      'In relationship readings, separate emotional intensity from relationship facts; feelings can be strong while the bond still needs mutual action.'
    );
    if (profile.topic === 'money') return tarotText(
      '财务牌要把象征落回数字：现金流、风险、期限与资源，至少要有一项能被具体检查。',
      '財務牌要把象徵落回數字：現金流、風險、期限與資源，至少要有一項能被具體檢查。',
      'Money readings should come back to numbers: cash flow, risk, timing and resources should be checked concretely.'
    );
    return tarotText(
      '把牌当成整理局势的方法，而不是拿来取代事实、界线与你的判断。',
      '把牌當成整理局勢的方法，而不是拿來取代事實、界線與你的判斷。',
      'Treat the cards as a way to organize the situation, not as a replacement for facts, boundaries or judgment.'
    );
  }

  function realityCheckpoint(profile = analyseQuestion(), draw = state.currentDraw) {
    const guide = guidanceItem(draw);
    const lang = currentLanguage();
    const guideThemes = keyThemes([guide],2).join(lang === 'en' ? ', ' : '、');
    const map = {
      feelings: {
        'zh-CN':'接下来不要只看他说了什么，观察三件事：会不会主动靠近、愿不愿意稳定投入时间、遇到关键问题时会不会说清楚。',
        'zh-TW':'接下來不要只看他說了什麼，觀察三件事：會不會主動靠近、願不願意穩定投入時間、遇到關鍵問題時會不會說清楚。',
        en:'Watch three things next: initiative, consistent time investment, and whether important issues are addressed clearly.'
      },
      action: {
        'zh-CN':'真正的验证标准是“连续性”：不是有没有一次动作，而是之后是否还有第二次、第三次，并且前后态度一致。',
        'zh-TW':'真正的驗證標準是「連續性」：不是有沒有一次動作，而是之後是否還有第二次、第三次，並且前後態度一致。',
        en:'Use continuity as the test: not whether one action happens, but whether it repeats and stays consistent.'
      },
      reason: {
        'zh-CN':'如果后续行为持续呈现牌面指出的卡点，这个解释才更有参考价值；如果现实不吻合，就要允许自己修正判断。',
        'zh-TW':'如果後續行為持續呈現牌面指出的卡點，這個解釋才更有參考價值；如果現實不吻合，就要允許自己修正判斷。',
        en:'If later behavior repeatedly matches the blockage shown here, the interpretation gains weight. If reality does not match, revise it.'
      },
      reconcile: {
        'zh-CN':'先看旧矛盾有没有出现新的处理方式；只有“重新联系”却没有“新的相处方法”，还不算真正进入复合条件。',
        'zh-TW':'先看舊矛盾有沒有出現新的處理方式；只有「重新聯絡」卻沒有「新的相處方法」，還不算真正進入復合條件。',
        en:'Look for a new way of handling the old conflict. Reconnection without a changed pattern is not yet a mature reconciliation condition.'
      },
      timing: {
        'zh-CN':'把后段牌的关键词当成时间讯号；当这些条件开始在现实里出现，才代表时机真的在靠近。',
        'zh-TW':'把後段牌的關鍵詞當成時間訊號；當這些條件開始在現實裡出現，才代表時機真的在靠近。',
        en:'Use the later-card themes as timing signals. When those conditions begin to appear in real life, the timing is genuinely getting closer.'
      },
      decision: {
        'zh-CN':'做决定前写下三个标准：你最想得到什么、最不能失去什么、最坏情况能不能承受。牌面应该帮助你比较，而不是替你承担后果。',
        'zh-TW':'做決定前寫下三個標準：你最想得到什麼、最不能失去什麼、最壞情況能不能承受。牌面應該幫助你比較，而不是替你承擔後果。',
        en:'Before deciding, write down three criteria: what you most want, what you cannot afford to lose, and whether you can carry the worst case.'
      },
      binary: {
        'zh-CN':'把“会不会”改成两个观察题：什么条件正在支持它发生？什么阻力仍在阻止它发生？这样答案会比单纯押是或否更有用。',
        'zh-TW':'把「會不會」改成兩個觀察題：什麼條件正在支持它發生？什麼阻力仍在阻止它發生？這樣答案會比單純押是或否更有用。',
        en:'Turn “will it?” into two checks: what supports it happening, and what still blocks it? That is more useful than betting on yes or no.'
      },
      development: {
        'zh-CN':'后续若持续出现与后段牌相同的讯号，就说明趋势在成形；如果关键条件改变，结果也应重新评估。',
        'zh-TW':'後續若持續出現與後段牌相同的訊號，就說明趨勢在成形；如果關鍵條件改變，結果也應重新評估。',
        en:'If later events repeat the themes of the later cards, the trend is forming. If key conditions change, reassess the outcome.'
      }
    };
    if (map[profile.intent]) return localized(map[profile.intent]);
    return tarotText(
      `把“${guideThemes || cardName(guide.card)}”当成检查点：接下来找一个现实中的行为或条件，确认这个主题是不是真的出现。`,
      `把「${guideThemes || cardName(guide.card)}」當成檢查點：接下來找一個現實中的行為或條件，確認這個主題是不是真的出現。`,
      `Use “${guideThemes || cardName(guide.card)}” as the checkpoint: look for one real-world behavior or condition that proves this theme is actually present.`
    );
  }

  function topicPractice(item) {
    if (!item) return '';
    const base = item?.meaning?.advice || '';
    if (item.card?.arcana === 'major') {
      return base + tarotText(
        ' 这是一张大阿尔克那，所以更适合把它当成一段时间要练习的原则，而不是只做一次的小技巧。',
        ' 這是一張大阿爾克那，所以更適合把它當成一段時間要練習的原則，而不是只做一次的小技巧。',
        ' Because this is Major Arcana, treat it as a principle to practice rather than a one-off trick.'
      );
    }
    const lenses = {
      cups: tarotText('练习把感受说清楚，也分辨“我希望如此”和“现实真的如此”。','練習把感受說清楚，也分辨「我希望如此」和「現實真的如此」。','Practice naming feelings clearly while separating what you hope is true from what is actually happening.'),
      wands: tarotText('把热度转成有节奏的行动；能持续的小步，比一时很用力更有价值。','把熱度轉成有節奏的行動；能持續的小步，比一時很用力更有價值。','Turn energy into paced action. A repeatable small step is more useful than one burst of force.'),
      swords: tarotText('先厘清事实、界线和真正需要说的话；不要让反复猜测代替沟通与判断。','先釐清事實、界線和真正需要說的話；不要讓反覆猜測代替溝通與判斷。','Clarify facts, boundaries and what truly needs to be said; do not let repeated guessing replace communication and judgment.'),
      pentacles: tarotText('回到可衡量的现实：时间、资源、投入、承诺与稳定度，至少抓一项具体检查。','回到可衡量的現實：時間、資源、投入、承諾與穩定度，至少抓一項具體檢查。','Return to measurable reality: time, resources, effort, commitment and stability. Check at least one concretely.')
    };
    return [base,lenses[item.card?.suit] || ''].filter(Boolean).join(' ');
  }

  function buildStory(draw, analysis, profile = analyseQuestion()) {
    const lang = currentLanguage();
    const spread = selectedSpread();

    if (spread.key === 'single') {
      const item = draw[0];
      const themes = keyThemes([item],2).join(lang === 'en' ? ', ' : '、');
      return tarotText(
        `${state.question ? `放回你问的“${state.question}”，` : ''}先看牌本身：“${cardName(item.card)}・${orientationText(item.reversed)}”把重点放在“${themes || '目前最核心的课题'}”。${item.meaning.meaning} 这里要学会的一件事是：单张牌不是判决书，它更像一盏灯，照出你现在最需要看清楚的模式。`,
        `${state.question ? `放回你問的「${state.question}」，` : ''}先看牌本身：「${cardName(item.card)}・${orientationText(item.reversed)}」把重點放在「${themes || '目前最核心的課題'}」。${item.meaning.meaning} 這裡要學會的一件事是：單張牌不是判決書，它更像一盞燈，照出你現在最需要看清楚的模式。`,
        `Start with the card itself: ${cardName(item.card)} (${orientationText(item.reversed)}) speaks about ${themes || 'the core issue'}. ${item.meaning.meaning} The teaching point is not to turn one card into a verdict; use it to identify the pattern that deserves attention.`
      );
    }

    if (spread.key === 'relationship5') {
      const [self, other, core, obstacle, direction] = draw;
      const counterpart = counterpartLabel();
      const selfTheme = keyThemes([self],2).join(lang === 'en' ? ', ' : '、');
      const otherTheme = keyThemes([other],2).join(lang === 'en' ? ', ' : '、');
      const coreTheme = keyThemes([core],2).join(lang === 'en' ? ', ' : '、');
      const obstacleTheme = keyThemes([obstacle],2).join(lang === 'en' ? ', ' : '、');
      const directionTheme = keyThemes([direction],2).join(lang === 'en' ? ', ' : '、');
      return tarotText(
        `${state.question ? `针对你问的“${state.question}”，` : ''}这个牌阵要分三层读。第一层是“你”和“${counterpart}”各自的状态：你这一侧偏向“${selfTheme || cardName(self.card)}”，${counterpart}则偏向“${otherTheme || cardName(other.card)}”；这两张牌都不能单独当成“关系答案”。第二层看互动核心“${coreTheme || cardName(core.card)}”，它才是在说两边碰在一起后形成了什么。第三层再看阻碍“${obstacleTheme || cardName(obstacle.card)}”与方向“${directionTheme || cardName(direction.card)}”——前者告诉你卡在哪里，后者告诉你要用什么方式才有机会改变模式。所以这组牌真正教你的，是把“个人感受、两人互动、现实行为”分开看。`,
        `${state.question ? `針對你問的「${state.question}」，` : ''}這個牌陣要分三層讀。第一層是「你」和「${counterpart}」各自的狀態：你這一側偏向「${selfTheme || cardName(self.card)}」，${counterpart}則偏向「${otherTheme || cardName(other.card)}」；這兩張牌都不能單獨當成「關係答案」。第二層看互動核心「${coreTheme || cardName(core.card)}」，它才是在說兩邊碰在一起後形成了什麼。第三層再看阻礙「${obstacleTheme || cardName(obstacle.card)}」與方向「${directionTheme || cardName(direction.card)}」——前者告訴你卡在哪裡，後者告訴你要用什麼方式才有機會改變模式。所以這組牌真正教你的，是把「個人感受、兩人互動、現實行為」分開看。`,
        `Read this spread in three layers. Your side (${cardName(self.card)}) and ${counterpart} (${cardName(other.card)}) are two different states; neither alone equals “the relationship.” ${cardName(core.card)} shows what is actually being created between the two sides. ${cardName(obstacle.card)} shows where it gets stuck, while ${cardName(direction.card)} shows the skill or direction that can change the pattern. Keep personal feeling, shared dynamic and real-world behavior separate.`
      );
    }

    if (spread.key === 'choice5') {
      const [current, a, aOut, b, bOut] = draw;
      const A = state.optionA || ui('optionA');
      const B = state.optionB || ui('optionB');
      return tarotText(
        `二选一最容易犯的错，是先找哪一边的牌“比较漂亮”。其实“${cardName(current.card)}”先说明了你是站在什么状态做选择；A“${A}”从“${cardName(a.card)}”走向“${cardName(aOut.card)}”，B“${B}”则从“${cardName(b.card)}”走向“${cardName(bOut.card)}”。真正要比较的不是哪条路完全没阻力，而是：哪条路要求你的代价你承受得起、哪个结果更符合你的优先顺序。`,
        `二選一最容易犯的錯，是先找哪一邊的牌「比較漂亮」。其實「${cardName(current.card)}」先說明了你是站在什麼狀態做選擇；A「${A}」從「${cardName(a.card)}」走向「${cardName(aOut.card)}」，B「${B}」則從「${cardName(b.card)}」走向「${cardName(bOut.card)}」。真正要比較的不是哪條路完全沒阻力，而是：哪條路要求你的代價你承受得起、哪個結果更符合你的優先順序。`,
        `Do not start by asking which path has the “prettier” cards. ${cardName(current.card)} describes the state from which you are choosing. Path A (${A}) begins with ${cardName(a.card)} and develops toward ${cardName(aOut.card)}; Path B (${B}) begins with ${cardName(b.card)} and develops toward ${cardName(bOut.card)}. Compare what each route asks from you, what friction it contains, and whether its outcome matches your priorities.`
      );
    }

    const parts = draw.map(itemShort);
    const firstThemes = keyThemes(draw.slice(0,Math.ceil(draw.length/2)),2).join(lang === 'en' ? ', ' : '、');
    const lastThemes = keyThemes(draw.slice(Math.floor(draw.length/2)),2).join(lang === 'en' ? ', ' : '、');
    const flow = analysis.orientationFlow === 'clearing'
      ? tarotText('后段比前段更松，表示这不是一路卡到底，而是有“先难、后面逐渐打开”的可能。','後段比前段更鬆，表示這不是一路卡到底，而是有「先難、後面逐漸打開」的可能。','The later positions become more open, so the spread reads like a difficult beginning that can loosen with adjustment.')
      : analysis.orientationFlow === 'tightening'
        ? tarotText('后段阻力增加，所以前面就算顺，也不能太早把它当成结果已经稳了。','後段阻力增加，所以前面就算順，也不能太早把它當成結果已經穩了。','The later positions carry more resistance, so early ease should not be mistaken for a secured outcome.')
        : tarotText('前后讯号交错，代表事情不同部分的速度不一样，不能只挑最好或最坏的一张来下结论。','前後訊號交錯，代表事情不同部分的速度不一樣，不能只挑最好或最壞的一張來下結論。','The flow is mixed, which means different parts of the situation are moving at different speeds.');

    return tarotText(
      `${state.question ? `放回你问的“${state.question}”，` : ''}先不要急着逐张下结论，先看整条发展线：${parts.join(' → ')}。前半段主要在说“${firstThemes || '目前怎么形成'}”，后半段则把问题推向“${lastThemes || '接下来怎么调整'}”。${flow} 这也是为什么同一张牌放在“现在”和放在“结果／建议”位置，意思会不一样；牌位是在教你看因果与顺序。`,
      `${state.question ? `放回你問的「${state.question}」，` : ''}先不要急著逐張下結論，先看整條發展線：${parts.join(' → ')}。前半段主要在說「${firstThemes || '目前怎麼形成'}」，後半段則把問題推向「${lastThemes || '接下來怎麼調整'}」。${flow} 這也是為什麼同一張牌放在「現在」和放在「結果／建議」位置，意思會不一樣；牌位是在教你看因果與順序。`,
      `Read the spread as a lesson in sequence: ${parts.join(' → ')}. The first half is mostly about ${firstThemes || 'the current condition'}, while the later half shifts toward ${lastThemes || 'what needs to happen next'}. ${flow} This is why the answer comes from the relationship between positions, not from any single card.`
    );
  }

  function buildStructure(a, profile = analyseQuestion(), draw = state.currentDraw) {
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

    const lesson = teachingCaution(profile);
    if (lesson) {
      notes.push((lang === 'en' ? 'Reading lesson: ' : (lang === 'zh-TW' ? '讀牌提醒：' : '读牌提醒：')) + lesson);
    }

    return notes.join('\n\n');
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

    const isTiming = /(什么时候|什麼時候|何时|多久|幾時|何時|when|how long)/i.test(q);
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

  function buildFinalAdvice(draw, analysis, profile = analyseQuestion()) {
    const lang = currentLanguage();
    const spread = selectedSpread();
    const topic = localized(selectedTopic().name);
    const qPrefix = state.question
      ? tarotText(`针对你问的“${state.question}”，`,`針對你問的「${state.question}」，`,`For “${state.question}”, `)
      : tarotText(`针对“${topic}”，`,`針對「${topic}」，`,`For ${topic}, `);

    const guide = guidanceItem(draw);
    const blocker = challengeItem(draw);
    const caution = teachingCaution(profile);
    const checkpoint = realityCheckpoint(profile,draw);

    if (spread.key === 'choice5') {
      const A = state.optionA || ui('optionA');
      const B = state.optionB || ui('optionB');
      const aScore = branchTendency([draw[1],draw[2]]);
      const bScore = branchTendency([draw[3],draw[4]]);
      const close = Math.abs(aScore - bScore) < 0.18;
      const better = aScore > bScore ? A : B;
      const first = close
        ? tarotText(
            `${qPrefix}两条路的差距没有大到可以直接替你做决定；这组牌更像在要求你比较代价，而不是找一个“完美答案”。`,
            `${qPrefix}兩條路的差距沒有大到可以直接替你做決定；這組牌更像在要求你比較代價，而不是找一個「完美答案」。`,
            `${qPrefix}the two paths are close enough that the cards are asking you to compare trade-offs, not chase a winner.`)
        : tarotText(
            `${qPrefix}目前较顺的路线是“${better}”，但“较顺”不等于“没有代价”；你仍要确认它是不是你真正想承担的方向。`,
            `${qPrefix}目前較順的路線是「${better}」，但「較順」不等於「沒有代價」；你仍要確認它是不是你真正想承擔的方向。`,
            `${qPrefix}${better} currently reads as the smoother route, but “smoother” is not the same as “cost-free.”`);
      const homework = tarotText(
        '把它当成一份作业：分别写下 A、B 会得到什么、失去什么，以及半年后你比较能接受哪一种代价。',
        '把它當成一份作業：分別寫下 A、B 會得到什麼、失去什麼，以及半年後你比較能接受哪一種代價。',
        'Use this as homework: write down what each path gives you, what it asks you to sacrifice, and which cost you can live with six months from now.'
      );
      return [first,`${homework} ${checkpoint}`].filter(Boolean).join('\n\n');
    }

    if (spread.key === 'relationship5') {
      const obstacle = draw.find(x => x.position?.key === 'obstacle') || blocker;
      const direction = draw.find(x => x.position?.key === 'direction') || guide;
      const first = tarotText(
        `${qPrefix}先不要急着追结果；这组牌要你先处理“${cardName(obstacle.card)}・${orientationText(obstacle.reversed)}”代表的卡点，再去练习“${cardName(direction.card)}・${orientationText(direction.reversed)}”带来的方向。换句话说，阻碍牌是在教你“问题在哪”，方向牌是在教你“新的做法是什么”。`,
        `${qPrefix}先不要急著追結果；這組牌要你先處理「${cardName(obstacle.card)}・${orientationText(obstacle.reversed)}」代表的卡點，再去練習「${cardName(direction.card)}・${orientationText(direction.reversed)}」帶來的方向。換句話說，阻礙牌是在教你「問題在哪」，方向牌是在教你「新的做法是什麼」。`,
        `${qPrefix}the spread asks you to work with ${cardName(obstacle.card)} before expecting the relationship to behave like ${cardName(direction.card)}. The obstacle is the lesson, and the direction card is the skill to practice.`
      );
      return [first,`${topicPractice(direction)} ${checkpoint}`].filter(Boolean).join('\n\n') + questionFraming();
    }

    const guideLead = tarotText(
      `${qPrefix}真正适合带回生活练习的，是“${cardName(guide.card)}・${orientationText(guide.reversed)}”。${topicPractice(guide)}`,
      `${qPrefix}真正適合帶回生活練習的，是「${cardName(guide.card)}・${orientationText(guide.reversed)}」。${topicPractice(guide)}`,
      `${qPrefix}the practical teaching card is ${cardName(guide.card)} (${orientationText(guide.reversed)}). ${topicPractice(guide)}`
    );

    const blockerText = blocker && blocker !== guide
      ? tarotText(
          `这组牌里最需要留意的是“${cardName(blocker.card)}・${orientationText(blocker.reversed)}”。它比较像你容易被绊住的地方，不是要你害怕，而是提醒你别用旧方法重复同一个问题。`,
          `這組牌裡最需要留意的是「${cardName(blocker.card)}・${orientationText(blocker.reversed)}」。它比較像你容易被絆住的地方，不是要你害怕，而是提醒你別用舊方法重複同一個問題。`,
          `The card that deserves the most caution is ${cardName(blocker.card)} (${orientationText(blocker.reversed)}); it shows where your usual pattern may trip you up.`)
      : '';

    return [guideLead,blockerText,checkpoint]
      .filter(Boolean)
      .join('\n\n') + questionFraming();
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
      renderTarotHistory();
      byId('drawTarotBtn').disabled = false;
    } catch (error) {
      console.error(error);
      byId('tarotLoadError').hidden = false;
    }
  }

  window.addEventListener('stellar:cloud-data-updated', event => {
    if (event.detail?.type !== 'tarot') return;
    renderTarotHistory();
  });

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

    byId('tarotHistoryToggle')?.addEventListener('click', () => {
      const panel = byId('tarotHistoryPanel');
      const opening = panel.hidden;
      panel.hidden = !opening;
      byId('tarotHistoryToggle').setAttribute('aria-expanded', opening ? 'true' : 'false');
      if (opening) renderTarotHistory();
    });

    byId('tarotHistoryClear')?.addEventListener('click', async () => {
      if (!window.confirm(ui('historyClearConfirm'))) return;
      writeTarotHistory([]);
      renderTarotHistory();
      if (window.XingchenCloudSync?.clearTarotCloud) {
        const result = await window.XingchenCloudSync.clearTarotCloud();
        if (!result?.ok && result?.error) console.warn('[星辰日记] 云端塔罗记录清除失败：', result.error);
      }
    });

    byId('scrollTopBtn')?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    init();
  });
})();
