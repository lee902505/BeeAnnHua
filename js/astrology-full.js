window.XingchenAstrologyFull = (() => {
  const state = {
    signs:[],
    elements:{},
    modalities:{},
    meta:null,
    deep:null,
    synthesis:null
  };

  const $ = id => document.getElementById(id);

  const UI = {
    'zh-CN':{
      planets:'行星位置', planetsHint:'十颗主要星体的星座、度数、宫位与逆行状态',
      houses:'四轴与十二宫', housesHint:'ASC / DSC / MC / IC、12 宫宫头与行星落宫',
      aspects:'主要相位', aspectsHint:'合相、六分、四分、三分与对分，以及实际容许度',
      structure:'命盘结构', structureHint:'命主星、群星与大三角 / T三角 / 大十字等主要格局',
      overview:'完整摘要', overviewHint:'把核心性格、情绪、沟通、关系、行动与事业方向整合起来',
      interpretation:'展开解读', deepCore:'这一宫在看什么', cuspStyle:'宫头星座', rulerLabel:'宫主星', planetsHere:'宫内行星',
      strengths:'优势', challenges:'容易卡住', growthDirection:'成长方向', emptyHouse:'空宫说明',
      integratedPersonality:'性格整合', corePersonality:'核心人格骨架', dominantPattern:'主要能量模式', practicalAdvice:'整合建议',
      aspectCore:'核心互动', aspectStrength:'可发挥优势', aspectChallenge:'容易卡住', aspectGrowth:'整合方向',
      chartRuler:'命主星', modernRuler:'现代命主星', traditionalRuler:'传统主星参考', rulerAspects:'命主星主要相位',
      majorPatterns:'大型格局', noMajorPatterns:'目前五大主要相位范围内，没有检测到大型格局。', patternBodies:'参与星体', patternFocus:'焦点星体',
      emotionalProfile:'情绪与安全感', thinkingProfile:'思考与沟通', relationshipProfile:'关系与亲密', actionProfile:'行动与压力', directionProfile:'事业与人生方向', growthProfile:'主要成长课题',
      retrograde:'逆行', house:'第 {n} 宫', unknownHouse:'宫位需准确出生时间',
      unknownTimeHouses:'出生时间未知，因此不计算 ASC、MC 与十二宫。行星和相位仍以当地中午作为近似参考。',
      placidus:'Placidus 宫制', whole:'Whole Sign 整宫制',
      fallback:'由于出生纬度较高，Placidus 在此位置可能失去数学定义，因此自动改用 Whole Sign。',
      orb:'容许度', noAspects:'在目前设定的主要相位容许度内，没有找到主要相位。',
      planetSignIntro:'{planet}代表{focus}。落在{sign}时，这股功能倾向以{style}的方式表达。',
      planetHouseIntro:'落在第 {house} 宫后，{planet}的主题会特别集中在「{theme}」。',
      retroText:'逆行表示这股功能更常先在内在被重新审视、反复消化，再形成外在行动；它不是好坏判断。',
      exactnessStrong:'这个相位非常紧密，因此在整体盘里通常更有存在感。',
      exactnessNormal:'这个相位在常用容许度内成立。',
      aspectIntro:'{p1}与{p2}形成{aspect}。{effect}',
      signConcentration:'星座集中', element:'元素分布', modality:'模式分布', houseEmphasis:'宫位重点',
      retroSummary:'逆行星体', tightAspects:'紧密相位', none:'无',
      angular:'角宫', succedent:'续宫', cadent:'果宫',
      concentrationText:'{sign}有 {count} 颗主要星体，形成明显的星座集中。',
      angularText:'角宫行星较多，人生议题更容易透过主动行动、关系事件、家庭根基或公众角色直接被看见。',
      succedentText:'续宫行星较多，资源累积、价值稳定、持续经营与长期成果较重要。',
      cadentText:'果宫行星较多，学习、调整、观察、服务与内在整合的比重较高。',
      balancedHouses:'行星在角宫、续宫与果宫之间分布较平均，没有单一宫位类型绝对主导。',
      approx:'出生时间未知：行星度数与相位以当地中午近似，快速星体若当天跨星座会另外标示。',
      possible:'可能为',
      noRetro:'没有主要行星显示逆行。',
      sourceNote:'解读为本项目依据传统西洋本命占星结构重新整理的组合式文案。'
    },
    'zh-TW':{
      planets:'行星位置', planetsHint:'十顆主要星體的星座、度數、宮位與逆行狀態',
      houses:'四軸與十二宮', housesHint:'ASC / DSC / MC / IC、12 宮宮頭與行星落宮',
      aspects:'主要相位', aspectsHint:'合相、六分、四分、三分與對分，以及實際容許度',
      structure:'命盤結構', structureHint:'命主星、群星與大三角 / T三角 / 大十字等主要格局',
      overview:'完整摘要', overviewHint:'把核心性格、情緒、溝通、關係、行動與事業方向整合起來',
      interpretation:'展開解讀', deepCore:'這一宮在看什麼', cuspStyle:'宮頭星座', rulerLabel:'宮主星', planetsHere:'宮內行星',
      strengths:'優勢', challenges:'容易卡住', growthDirection:'成長方向', emptyHouse:'空宮說明',
      integratedPersonality:'性格整合', corePersonality:'核心人格骨架', dominantPattern:'主要能量模式', practicalAdvice:'整合建議',
      aspectCore:'核心互動', aspectStrength:'可發揮優勢', aspectChallenge:'容易卡住', aspectGrowth:'整合方向',
      chartRuler:'命主星', modernRuler:'現代命主星', traditionalRuler:'傳統主星參考', rulerAspects:'命主星主要相位',
      majorPatterns:'大型格局', noMajorPatterns:'目前五大主要相位範圍內，沒有檢測到大型格局。', patternBodies:'參與星體', patternFocus:'焦點星體',
      emotionalProfile:'情緒與安全感', thinkingProfile:'思考與溝通', relationshipProfile:'關係與親密', actionProfile:'行動與壓力', directionProfile:'事業與人生方向', growthProfile:'主要成長課題',
      retrograde:'逆行', house:'第 {n} 宮', unknownHouse:'宮位需準確出生時間',
      unknownTimeHouses:'出生時間未知，因此不計算 ASC、MC 與十二宮。行星和相位仍以當地中午作為近似參考。',
      placidus:'Placidus 宮制', whole:'Whole Sign 整宮制',
      fallback:'由於出生緯度較高，Placidus 在此位置可能失去數學定義，因此自動改用 Whole Sign。',
      orb:'容許度', noAspects:'在目前設定的主要相位容許度內，沒有找到主要相位。',
      planetSignIntro:'{planet}代表{focus}。落在{sign}時，這股功能傾向以{style}的方式表達。',
      planetHouseIntro:'落在第 {house} 宮後，{planet}的主題會特別集中在「{theme}」。',
      retroText:'逆行表示這股功能更常先在內在被重新審視、反覆消化，再形成外在行動；它不是好壞判斷。',
      exactnessStrong:'這個相位非常緊密，因此在整體盤裡通常更有存在感。',
      exactnessNormal:'這個相位在常用容許度內成立。',
      aspectIntro:'{p1}與{p2}形成{aspect}。{effect}',
      signConcentration:'星座集中', element:'元素分布', modality:'模式分布', houseEmphasis:'宮位重點',
      retroSummary:'逆行星體', tightAspects:'緊密相位', none:'無',
      angular:'角宮', succedent:'續宮', cadent:'果宮',
      concentrationText:'{sign}有 {count} 顆主要星體，形成明顯的星座集中。',
      angularText:'角宮行星較多，人生議題更容易透過主動行動、關係事件、家庭根基或公眾角色直接被看見。',
      succedentText:'續宮行星較多，資源累積、價值穩定、持續經營與長期成果較重要。',
      cadentText:'果宮行星較多，學習、調整、觀察、服務與內在整合的比重較高。',
      balancedHouses:'行星在角宮、續宮與果宮之間分布較平均，沒有單一宮位類型絕對主導。',
      approx:'出生時間未知：行星度數與相位以當地中午近似，快速星體若當天跨星座會另外標示。',
      possible:'可能為',
      noRetro:'沒有主要行星顯示逆行。',
      sourceNote:'解讀為本專案依據傳統西洋本命占星結構重新整理的組合式文案。'
    },
    'en':{
      planets:'Planet Positions', planetsHint:'Ten major bodies with sign, degree, house and retrograde status',
      houses:'Angles & 12 Houses', housesHint:'ASC / DSC / MC / IC, twelve cusps and planets by house',
      aspects:'Major Aspects', aspectsHint:'Conjunction, sextile, square, trine and opposition with actual orb',
      structure:'Chart Structure', structureHint:'Chart ruler, stelliums and major patterns such as Grand Trine, T-Square and Grand Cross',
      overview:'Full Summary', overviewHint:'Integrated core, emotion, communication, relationships, action and life direction',
      interpretation:'Open interpretation', deepCore:'What this house describes', cuspStyle:'Cusp sign', rulerLabel:'House ruler', planetsHere:'Planets in this house',
      strengths:'Strengths', challenges:'Potential friction', growthDirection:'Growth direction', emptyHouse:'Empty house',
      integratedPersonality:'Personality integration', corePersonality:'Core personality pattern', dominantPattern:'Dominant pattern', practicalAdvice:'Integration advice',
      aspectCore:'Core interaction', aspectStrength:'Available strength', aspectChallenge:'Potential friction', aspectGrowth:'Integration direction',
      chartRuler:'Chart ruler', modernRuler:'Modern chart ruler', traditionalRuler:'Traditional ruler reference', rulerAspects:'Chart-ruler aspects',
      majorPatterns:'Major patterns', noMajorPatterns:'No major configuration was detected within the current five-major-aspect network.', patternBodies:'Bodies involved', patternFocus:'Focal body',
      emotionalProfile:'Emotion & security', thinkingProfile:'Thinking & communication', relationshipProfile:'Relationships & intimacy', actionProfile:'Action & pressure', directionProfile:'Career & life direction', growthProfile:'Primary growth theme',
      retrograde:'Retrograde', house:'House {n}', unknownHouse:'House requires an accurate birth time',
      unknownTimeHouses:'Birth time is unknown, so ASC, MC and houses are not calculated. Planets and aspects use local noon as an approximate reference.',
      placidus:'Placidus houses', whole:'Whole Sign houses',
      fallback:'At this high latitude Placidus can become mathematically undefined, so Whole Sign is used automatically.',
      orb:'Orb', noAspects:'No major aspects were found within the current major-aspect orb settings.',
      planetSignIntro:'{planet} represents {focus}. In {sign}, this function tends to express {style}.',
      planetHouseIntro:'In House {house}, {planet} becomes especially focused on “{theme}”.',
      retroText:'Retrograde suggests this function is often reviewed and processed internally before becoming outward action; it is not a good/bad judgment.',
      exactnessStrong:'This aspect is very tight and is therefore likely to be especially noticeable in the chart.',
      exactnessNormal:'This aspect falls within the standard orb used here.',
      aspectIntro:'{p1} and {p2} form a {aspect}. {effect}',
      signConcentration:'Sign concentration', element:'Element distribution', modality:'Modality distribution', houseEmphasis:'House emphasis',
      retroSummary:'Retrograde planets', tightAspects:'Tight aspects', none:'None',
      angular:'Angular', succedent:'Succedent', cadent:'Cadent',
      concentrationText:'{count} major bodies fall in {sign}, creating a clear sign concentration.',
      angularText:'Angular houses are emphasized: life themes tend to become visible through direct action, relationships, roots or public direction.',
      succedentText:'Succedent houses are emphasized: resource-building, stability, value and sustained development matter strongly.',
      cadentText:'Cadent houses are emphasized: learning, adaptation, observation, service and inner integration carry more weight.',
      balancedHouses:'Planets are distributed fairly evenly across angular, succedent and cadent houses, with no single mode strongly dominating.',
      approx:'Birth time unknown: planetary degrees and aspects use local noon as an approximation; fast bodies that change sign that day are marked.',
      possible:'Possible',
      noRetro:'No major planets are shown retrograde.',
      sourceNote:'Interpretations are original compositional text based on conventional Western natal astrology structure.'
    }
  };

  function lang() {
    const saved = localStorage.getItem('xingchen-language');
    return ['zh-CN','zh-TW','en'].includes(saved) ? saved : 'zh-CN';
  }
  function ui(k){ return UI[lang()]?.[k] ?? UI['zh-CN'][k] ?? k; }
  function zh(cn,tw){ return lang()==='zh-TW' ? tw : cn; }
  function loc(obj){ return obj?.[lang()] ?? obj?.['zh-CN'] ?? ''; }
  function esc(s){ return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;"); }
  function tpl(text, values) {
    return Object.entries(values).reduce((s,[k,v]) => s.replaceAll(`{${k}}`, v), text);
  }

  const ready = Promise.all([
    fetch('../data/astrology/signs.json',{cache:'no-store'}).then(r => {
      if (!r.ok) throw new Error('signs load failed');
      return r.json();
    }),
    fetch('../data/astrology/chart-interpretations.json',{cache:'no-store'}).then(r => {
      if (!r.ok) throw new Error('chart interpretations load failed');
      return r.json();
    }),
    fetch('../data/astrology/deep-interpretations.json',{cache:'no-store'}).then(r => {
      if (!r.ok) throw new Error('deep interpretations load failed');
      return r.json();
    }),
    fetch('../data/astrology/natal-synthesis.json',{cache:'no-store'}).then(r => {
      if (!r.ok) throw new Error('natal synthesis load failed');
      return r.json();
    })
  ]).then(([signs, meta, deep, synthesis]) => {
    state.signs = signs.signs;
    state.elements = signs.elements;
    state.modalities = signs.modalities;
    state.meta = meta;
    state.deep = deep;
    state.synthesis = synthesis;
    setStaticText();
  }).catch(error => console.error(error));

  function setStaticText() {
    if (!$('planetSectionTitle')) return;
    $('planetSectionTitle').textContent = ui('planets');
    $('planetSectionHint').textContent = ui('planetsHint');
    $('houseSectionTitle').textContent = ui('houses');
    $('houseSectionHint').textContent = ui('housesHint');
    $('aspectSectionTitle').textContent = ui('aspects');
    $('aspectSectionHint').textContent = ui('aspectsHint');
    if ($('structureSectionTitle')) $('structureSectionTitle').textContent = ui('structure');
    if ($('structureSectionHint')) $('structureSectionHint').textContent = ui('structureHint');
    $('overviewSectionTitle').textContent = ui('overview');
    $('overviewSectionHint').textContent = ui('overviewHint');
  }

  function signMeta(index){ return state.signs[index]; }
  function signName(index){ return loc(signMeta(index).name); }

  function formatDegree(position) {
    let deg = Math.floor(position.degree);
    let min = Math.round((position.degree - deg) * 60);
    if (min === 60) { deg += 1; min = 0; }
    if (deg === 30) deg = 0;
    return `${deg}° ${String(min).padStart(2,'0')}′`;
  }

  function formatOrb(orb) {
    let deg = Math.floor(orb);
    let min = Math.round((orb - deg) * 60);
    if (min === 60) { deg += 1; min = 0; }
    return `${deg}° ${String(min).padStart(2,'0')}′`;
  }

  function planetMeta(key){ return state.meta.planets[key]; }

  function deepHouse(number){ return state.deep?.houses?.[String(number)] || null; }
  function deepSignByIndex(index){
    const key = signMeta(index)?.key;
    return key ? state.deep?.signs?.[key] : null;
  }
  function deepPlanet(key){ return state.deep?.planets?.[key] || null; }

  function planetHouseTextLegacy(key, houseNumber) {
    if (!houseNumber) return '';
    const planet = planetMeta(key);
    const house = state.meta.houses[String(houseNumber)];
    return tpl(ui('planetHouseIntro'), {
      planet:loc(planet.name),
      house:String(houseNumber),
      theme:loc(house.name)
    }) + ' ' + loc(house.theme) + '。';
  }

  function deepPlanetHouseText(key, houseNumber) {
    const p = deepPlanet(key);
    const h = deepHouse(houseNumber);
    if (!p || !h) return planetHouseTextLegacy(key, houseNumber);
    const pattern = loc(p.pattern)
      .replaceAll('{house}', String(houseNumber))
      .replaceAll('{area}', loc(h.lifeArea));
    const sep = lang()==='en' ? ' ' : ' ';
    return `${pattern}${sep}${ui('strengths')}：${loc(p.strength)} ${ui('challenges')}：${loc(p.challenge)} ${ui('growthDirection')}：${loc(p.growth)}`;
  }

  function cuspInterpretation(houseNumber, cusp) {
    const h = deepHouse(houseNumber);
    const s = deepSignByIndex(cusp.index);
    if (!h || !s) return '';
    if (lang()==='en') {
      return `With ${signName(cusp.index)} on the cusp of House ${houseNumber}, you tend to approach ${loc(h.lifeArea)} ${loc(s.approach)}. Strength: ${loc(s.strength)}. Watch for: ${loc(s.challenge)}. Growth: ${loc(s.growth)}.`;
    }
    if (lang()==='zh-TW') {
      return `${signName(cusp.index)}落在第${houseNumber}宮宮頭，代表你面對「${loc(h.lifeArea)}」時，傾向${loc(s.approach)}。${ui('strengths')}：${loc(s.strength)}。${ui('challenges')}：${loc(s.challenge)}。${ui('growthDirection')}：${loc(s.growth)}。`;
    }
    return `${signName(cusp.index)}落在第${houseNumber}宫宫头，代表你面对「${loc(h.lifeArea)}」时，倾向${loc(s.approach)}。${ui('strengths')}：${loc(s.strength)}。${ui('challenges')}：${loc(s.challenge)}。${ui('growthDirection')}：${loc(s.growth)}。`;
  }

  function rulerInterpretation(result, houseNumber, cusp) {
    const s = deepSignByIndex(cusp.index);
    if (!s) return '';
    const modernKey = s.ruler;
    const traditionalKey = s.traditional;
    const modern = result.planets?.[modernKey];
    if (!modern) return '';

    const modernName = loc(planetMeta(modernKey)?.name);
    const traditionalName = traditionalKey && traditionalKey !== modernKey
      ? loc(planetMeta(traditionalKey)?.name) : '';
    const rulerHouse = modern.house;
    const target = rulerHouse ? deepHouse(rulerHouse) : null;

    if (lang()==='en') {
      const label = traditionalName ? `${modernName} (traditional co-ruler: ${traditionalName})` : modernName;
      return rulerHouse
        ? `The cusp ruler is ${label}. ${modernName} falls in House ${rulerHouse} (${loc(target.name)}), so themes of House ${houseNumber} are often carried into ${loc(target.lifeArea)}.`
        : `The cusp ruler is ${label}. Its house position requires an accurate birth time.`;
    }

    if (lang()==='zh-TW') {
      const label = traditionalName ? `${modernName}（傳統主星：${traditionalName}）` : modernName;
      return rulerHouse
        ? `這一宮的主星是${label}。${modernName}落在第${rulerHouse}宮「${loc(target.name)}」，因此第${houseNumber}宮的主題常會透過「${loc(target.lifeArea)}」被帶出來。`
        : `這一宮的主星是${label}。宮主星落宮需要準確出生時間才能判斷。`;
    }

    const label = traditionalName ? `${modernName}（传统主星：${traditionalName}）` : modernName;
    return rulerHouse
      ? `这一宫的主星是${label}。${modernName}落在第${rulerHouse}宫「${loc(target.name)}」，因此第${houseNumber}宫的主题常会透过「${loc(target.lifeArea)}」被带出来。`
      : `这一宫的主星是${label}。宫主星落宫需要准确出生时间才能判断。`;
  }

  function houseIntegrationText(result, houseNumber, cusp, occupants) {
    const signPart = cuspInterpretation(houseNumber,cusp);
    const rulerPart = rulerInterpretation(result,houseNumber,cusp);
    if (!occupants.length) return `${signPart} ${rulerPart} ${loc(state.deep.emptyHouseNote)}`;
    const names = occupants.map(k=>loc(planetMeta(k).name)).join(lang()==='en'?', ':'、');
    if (lang()==='en') {
      return `${signPart} ${rulerPart} With ${names} in this house, this life area carries direct planetary emphasis and tends to be experienced more consciously.`;
    }
    return lang()==='zh-TW'
      ? `${signPart} ${rulerPart} 這一宮同時有${names}，表示這個人生領域不只是背景設定，而是更容易被你直接感受到、反覆經歷與主動發展的重點。`
      : `${signPart} ${rulerPart} 这一宫同时有${names}，表示这个人生领域不只是背景设定，而是更容易被你直接感受到、反复经历与主动发展的重点。`;
  }

  function planetSignText(key, position) {
    const planet = planetMeta(key);
    const sign = signMeta(position.index);
    return tpl(ui('planetSignIntro'), {
      planet:loc(planet.name),
      focus:loc(planet.focus),
      sign:loc(sign.name),
      style:loc(state.meta.signStyles[sign.key])
    });
  }

  function planetHouseText(key, houseNumber) {
    return deepPlanetHouseText(key, houseNumber);
  }

  function positionDisplay(p) {
    if (p.signUncertain && p.possibleSignIndexes?.length) {
      return {
        sign:p.possibleSignIndexes.map(signName).join(' / '),
        degree:'—'
      };
    }
    return {sign:signName(p.index), degree:formatDegree(p)};
  }

  function planetRow(key, p, result) {
    const meta = planetMeta(key);
    const display = positionDisplay(p);
    const sign = signMeta(p.index);
    const houseText = p.house
      ? ui('house').replace('{n}', String(p.house))
      : ui('unknownHouse');

    let interpretation = planetSignText(key,p);
    if (p.house) interpretation += ' ' + planetHouseText(key,p.house);
    if (p.retrograde) interpretation += ' ' + ui('retroText');

    const uncertainty = p.signUncertain
      ? `<p class="astro-detail-warning">${ui('possible')}：${esc(display.sign)}</p>`
      : '';

    return `
      <details class="astro-line-detail">
        <summary>
          <span class="astro-line-glyph">${meta.glyph}</span>
          <span class="astro-line-main">
            <strong>${esc(loc(meta.name))}</strong>
            <small>${esc(display.sign)} · ${esc(display.degree)}${p.retrograde ? ` · <b>R</b>` : ''}</small>
          </span>
          <span class="astro-line-house">${esc(houseText)}</span>
          <span class="astro-line-open">${esc(ui('interpretation'))}</span>
        </summary>
        <div class="astro-line-body">
          ${uncertainty}
          <p>${esc(interpretation)}</p>
          ${result.mode === 'unknown-time' ? `<p class="astro-detail-note">${esc(ui('approx'))}</p>` : ''}
        </div>
      </details>
    `;
  }

  function renderPlanets(result) {
    const order = XingchenAstrologyEngine.PLANET_ORDER;
    $('planetList').innerHTML = order
      .map(key => planetRow(key,result.planets[key],result))
      .join('');
  }

  function angleCard(label, key, pos) {
    const glyphs = {ascendant:'ASC',descendant:'DSC',mc:'MC',ic:'IC'};
    return `
      <article class="astro-angle-card">
        <span>${glyphs[key]}</span>
        <strong>${esc(label)}</strong>
        <b>${esc(signName(pos.index))}</b>
        <small>${esc(formatDegree(pos))}</small>
      </article>
    `;
  }

  function housePlanets(result, houseNumber) {
    return XingchenAstrologyEngine.PLANET_ORDER
      .filter(key => result.planets[key].house === houseNumber)
      .map(key => key);
  }

  function renderHouses(result) {
    const unavailable = $('houseUnavailable');
    const content = $('houseContent');

    if (!result.houses) {
      unavailable.hidden = false;
      unavailable.textContent = ui('unknownTimeHouses');
      content.hidden = true;
      return;
    }

    unavailable.hidden = true;
    content.hidden = false;

    const h = result.houses;
    $('houseSystemLabel').innerHTML = `
      <strong>${esc(h.system === 'placidus' ? ui('placidus') : ui('whole'))}</strong>
      ${h.fallback ? `<span>${esc(ui('fallback'))}</span>` : ''}
    `;

    const angleNames = {
      ascendant:{'zh-CN':'上升','zh-TW':'上升','en':'Ascendant'},
      descendant:{'zh-CN':'下降','zh-TW':'下降','en':'Descendant'},
      mc:{'zh-CN':'天顶','zh-TW':'天頂','en':'Midheaven'},
      ic:{'zh-CN':'天底','zh-TW':'天底','en':'Imum Coeli'}
    };

    $('angleGrid').innerHTML = ['ascendant','descendant','mc','ic']
      .map(key => angleCard(loc(angleNames[key]),key,h.angles[key]))
      .join('');

    $('houseList').innerHTML = h.cusps.map((cusp,index) => {
      const n = index + 1;
      const legacy = state.meta.houses[String(n)];
      const profile = deepHouse(n);
      const occupants = housePlanets(result,n);

      const occupantHtml = occupants.length
        ? occupants.map(key => `<span class="astro-house-planet-chip">${planetMeta(key).glyph} ${esc(loc(planetMeta(key).name))}</span>`).join('')
        : `<span class="astro-house-empty">—</span>`;

      const planetSections = occupants.length
        ? occupants.map(key => {
            const meta = planetMeta(key);
            return `
              <section class="astro-deep-subsection astro-deep-planet">
                <h5>${meta.glyph} ${esc(loc(meta.name))} · ${esc(ui('house').replace('{n}',String(n)))}</h5>
                <p>${esc(planetHouseText(key,n))}</p>
              </section>`;
          }).join('')
        : `
          <section class="astro-deep-subsection astro-empty-house-note">
            <h5>${esc(ui('emptyHouse'))}</h5>
            <p>${esc(loc(state.deep.emptyHouseNote))}</p>
          </section>`;

      return `
        <details class="astro-house-row astro-house-row-deep">
          <summary>
            <span class="astro-house-number">${String(n).padStart(2,'0')}</span>
            <span class="astro-house-cusp">
              <strong>${esc(profile ? loc(profile.name) : loc(legacy.name))}</strong>
              <small>${esc(signName(cusp.index))} · ${esc(formatDegree(cusp))}</small>
            </span>
            <span class="astro-house-occupants">${occupantHtml}</span>
          </summary>

          <div class="astro-house-description astro-house-description-deep">
            <div class="astro-house-keywords">${esc(profile ? loc(profile.keywords) : loc(legacy.theme))}</div>

            ${profile ? `
            <section class="astro-deep-subsection">
              <h5>${esc(ui('deepCore'))}</h5>
              <p>${esc(loc(profile.core))}</p>
              <p>${esc(loc(profile.personality))}</p>
            </section>

            <div class="astro-deep-three">
              <section><h5>${esc(ui('strengths'))}</h5><p>${esc(loc(profile.strength))}</p></section>
              <section><h5>${esc(ui('challenges'))}</h5><p>${esc(loc(profile.challenge))}</p></section>
              <section><h5>${esc(ui('growthDirection'))}</h5><p>${esc(loc(profile.growth))}</p></section>
            </div>` : ''}

            <section class="astro-deep-subsection">
              <h5>${esc(ui('cuspStyle'))} · ${esc(signName(cusp.index))}</h5>
              <p>${esc(cuspInterpretation(n,cusp))}</p>
            </section>

            <section class="astro-deep-subsection">
              <h5>${esc(ui('rulerLabel'))}</h5>
              <p>${esc(rulerInterpretation(result,n,cusp))}</p>
            </section>

            <section class="astro-deep-subsection">
              <h5>${esc(ui('planetsHere'))}</h5>
              ${planetSections}
            </section>

            <section class="astro-house-integration">
              <strong>${esc(ui('integratedPersonality'))}</strong>
              <p>${esc(houseIntegrationText(result,n,cusp,occupants))}</p>
            </section>
          </div>
        </details>
      `;
    }).join('');
  }

  function aspectExactness(aspect) {
    const ratio = aspect.limit ? aspect.orb / aspect.limit : 1;
    if (aspect.orb <= 0.5 || ratio <= 0.10) return loc(state.synthesis.exactness.veryTight);
    if (aspect.orb <= 1 || ratio <= 0.20) return loc(state.synthesis.exactness.tight);
    if (aspect.orb <= 2 || ratio <= 0.40) return loc(state.synthesis.exactness.clear);
    return loc(state.synthesis.exactness.standard);
  }

  function aspectPairData(aspect) {
    const key = window.XingchenNatalSynthesis?.pairKey?.(aspect.body1,aspect.body2)
      || [aspect.body1,aspect.body2].sort().join('|');
    return state.synthesis?.pairThemes?.[key] || null;
  }

  function aspectDepth(aspect) {
    const p1 = planetMeta(aspect.body1);
    const p2 = planetMeta(aspect.body2);
    const aspectMeta = state.meta.aspects[aspect.key];
    const dynamic = state.synthesis?.aspectDynamics?.[aspect.key];
    const pair = aspectPairData(aspect);

    if (!dynamic || !pair) {
      return {
        intro:aspectInterpretationLegacy(aspect),
        core:aspectInterpretationLegacy(aspect),
        strength:loc(aspectMeta.effect),
        challenge:ui('exactnessNormal'),
        growth:aspectExactness(aspect)
      };
    }

    let intro;
    if (lang()==='en') {
      intro = `${loc(p1.name)} represents ${loc(p1.focus)}; ${loc(p2.name)} represents ${loc(p2.focus)}. Their ${loc(aspectMeta.name)} links ${loc(pair.theme)}.`;
    } else if (lang()==='zh-TW') {
      intro = `${loc(p1.name)}代表${loc(p1.focus)}；${loc(p2.name)}代表${loc(p2.focus)}。兩者形成${loc(aspectMeta.name)}，核心主題是「${loc(pair.theme)}」。`;
    } else {
      intro = `${loc(p1.name)}代表${loc(p1.focus)}；${loc(p2.name)}代表${loc(p2.focus)}。两者形成${loc(aspectMeta.name)}，核心主题是「${loc(pair.theme)}」。`;
    }

    return {
      intro,
      core:`${loc(pair.theme)}。${loc(dynamic.core)} ${aspectExactness(aspect)}`,
      strength:`${loc(pair.gift)}；${loc(dynamic.strength)}`,
      challenge:`${loc(pair.challenge)}；${loc(dynamic.challenge)}`,
      growth:`${loc(pair.integration)}；${loc(dynamic.growth)}`
    };
  }

  function aspectInterpretationLegacy(aspect) {
    const p1 = planetMeta(aspect.body1);
    const p2 = planetMeta(aspect.body2);
    const meta = state.meta.aspects[aspect.key];
    return tpl(ui('aspectIntro'),{
      p1:loc(p1.name),
      p2:loc(p2.name),
      aspect:loc(meta.name),
      effect:loc(meta.effect)
    }) + ' ' + (aspect.orb <= 1 ? ui('exactnessStrong') : ui('exactnessNormal'));
  }

  function renderAspects(result) {
    const list = $('aspectList');
    if (!result.aspects?.length) {
      list.innerHTML = `<p class="astro-section-unavailable">${esc(ui('noAspects'))}</p>`;
      return;
    }

    list.innerHTML = result.aspects.map(aspect => {
      const p1 = planetMeta(aspect.body1);
      const p2 = planetMeta(aspect.body2);
      const meta = state.meta.aspects[aspect.key];
      const depth = aspectDepth(aspect);

      return `
        <details class="astro-aspect-row astro-aspect-row-deep">
          <summary>
            <span class="astro-aspect-bodies">
              <b>${p1.glyph}</b>
              <strong>${esc(loc(p1.name))}</strong>
              <span class="astro-aspect-symbol">${meta.symbol}</span>
              <b>${p2.glyph}</b>
              <strong>${esc(loc(p2.name))}</strong>
            </span>
            <span class="astro-aspect-name">${esc(loc(meta.name))}</span>
            <span class="astro-aspect-orb">${esc(ui('orb'))} ${esc(formatOrb(aspect.orb))}</span>
          </summary>

          <div class="astro-aspect-body astro-aspect-body-deep">
            <p class="astro-aspect-intro">${esc(depth.intro)}</p>

            <section class="astro-aspect-core">
              <h5>${esc(ui('aspectCore'))}</h5>
              <p>${esc(depth.core)}</p>
            </section>

            <div class="astro-aspect-three">
              <section>
                <h5>${esc(ui('aspectStrength'))}</h5>
                <p>${esc(depth.strength)}</p>
              </section>
              <section>
                <h5>${esc(ui('aspectChallenge'))}</h5>
                <p>${esc(depth.challenge)}</p>
              </section>
              <section>
                <h5>${esc(ui('aspectGrowth'))}</h5>
                <p>${esc(depth.growth)}</p>
              </section>
            </div>

            <small class="astro-aspect-technical">
              ${aspect.separation.toFixed(2)}° / ${meta.angle}° · ${esc(ui('orb'))} ${esc(formatOrb(aspect.orb))}
            </small>
          </div>
        </details>
      `;
    }).join('');
  }


  function structureAnalysis(result) {
    if (!window.XingchenNatalSynthesis) return {patterns:[],chartRulers:null};
    return window.XingchenNatalSynthesis.analyze(result,state.signs,state.deep?.signs || {});
  }

  function planetPositionLabel(key,position) {
    if (!position) return '';
    const parts = [`${planetMeta(key).glyph} ${loc(planetMeta(key).name)}`, `${signName(position.index)} ${formatDegree(position)}`];
    if (position.house) parts.push(ui('house').replace('{n}',String(position.house)));
    if (position.retrograde) parts.push(ui('retrograde'));
    return parts.join(' · ');
  }

  function aspectsForBody(result,key,limit=4) {
    return (result.aspects || [])
      .filter(a => a.body1===key || a.body2===key)
      .sort((a,b)=>a.orb-b.orb)
      .slice(0,limit);
  }

  function aspectShortLabel(aspect) {
    const other = aspect.body1 === aspect._focusKey ? aspect.body2 : aspect.body1;
    const meta = state.meta.aspects[aspect.key];
    return `${planetMeta(other).glyph}${esc(loc(planetMeta(other).name))} ${meta.symbol} ${esc(formatOrb(aspect.orb))}`;
  }

  function chartRulerCard(result,ruler,label) {
    if (!ruler?.position) return '';
    const key=ruler.key;
    const p=ruler.position;
    const aspects=aspectsForBody(result,key,4);
    const aspectHtml=aspects.length
      ? aspects.map(a => {
          const other=a.body1===key ? a.body2 : a.body1;
          const meta=state.meta.aspects[a.key];
          return `<span>${planetMeta(other).glyph} ${esc(loc(planetMeta(other).name))} ${meta.symbol} ${esc(formatOrb(a.orb))}</span>`;
        }).join('')
      : `<span>${esc(ui('none'))}</span>`;

    const houseText = p.house
      ? (lang()==='en'
          ? `House ${p.house} · ${esc(loc(deepHouse(p.house)?.name || {}))}`
          : `${esc(ui('house').replace('{n}',String(p.house)))} · ${esc(loc(deepHouse(p.house)?.name || {}))}`)
      : esc(ui('unknownHouse'));

    const signDeep=deepSignByIndex(p.index);
    let interpretation;
    if (lang()==='en') {
      interpretation=`As ${label.toLowerCase()}, ${loc(planetMeta(key).name)} carries the Ascendant's style into ${signName(p.index)} and ${houseText}. This makes ${loc(signDeep?.approach || {})} an important route through which the whole chart is expressed.`;
    } else if (lang()==='zh-TW') {
      interpretation=`作為${label}，${loc(planetMeta(key).name)}把上升星座的運作方式帶到${signName(p.index)}與${houseText}。因此「${loc(signDeep?.approach || {})}」會成為整張命盤很重要的實際出口。`;
    } else {
      interpretation=`作为${label}，${loc(planetMeta(key).name)}把上升星座的运作方式带到${signName(p.index)}与${houseText}。因此「${loc(signDeep?.approach || {})}」会成为整张命盘很重要的实际出口。`;
    }

    return `
      <article class="astro-ruler-card">
        <div class="astro-ruler-kicker">${esc(label)}</div>
        <h4>${esc(planetPositionLabel(key,p))}</h4>
        <p>${interpretation}</p>
        <div class="astro-ruler-aspects">
          <strong>${esc(ui('rulerAspects'))}</strong>
          <div>${aspectHtml}</div>
        </div>
      </article>
    `;
  }

  function patternBodyNames(pattern) {
    return pattern.bodies.map(key => `${planetMeta(key).glyph} ${loc(planetMeta(key).name)}`).join(lang()==='en' ? ' · ' : '、');
  }

  function patternContext(pattern,result) {
    if (pattern.type==='stellium-sign') {
      const sd=deepSignByIndex(pattern.signIndex);
      if (lang()==='en') {
        return `${signName(pattern.signIndex)} is strongly emphasized. This reinforces ${loc(sd?.strength || {})}, while the balancing task is ${loc(sd?.growth || {})}.`;
      }
      if (lang()==='zh-TW') {
        return `${signName(pattern.signIndex)}形成明顯集中，會放大「${loc(sd?.strength || {})}」；平衡方向是「${loc(sd?.growth || {})}」。`;
      }
      return `${signName(pattern.signIndex)}形成明显集中，会放大「${loc(sd?.strength || {})}」；平衡方向是「${loc(sd?.growth || {})}」。`;
    }

    if (pattern.type==='stellium-house') {
      const hd=deepHouse(pattern.house);
      if (lang()==='en') {
        return `House ${pattern.house} (${loc(hd?.name || {})}) becomes a high-frequency life arena: ${loc(hd?.lifeArea || {})}.`;
      }
      const suffix=lang()==='zh-TW'?'宮':'宫';
      return zh(`第${pattern.house}${suffix}「${loc(hd?.name || {})}」成为高频人生领域，重点集中在「${loc(hd?.lifeArea || {})}」。`,`第${pattern.house}${suffix}「${loc(hd?.name || {})}」成為高頻人生領域，重點集中在「${loc(hd?.lifeArea || {})}」。`);
    }

    if (pattern.type==='grand-trine') {
      const elems=[...new Set(pattern.bodies.map(k => signMeta(result.planets[k].index).element))];
      if (elems.length===1) {
        const e=state.deep?.elements?.[elems[0]];
        if (lang()==='en') return `The triangle is concentrated in the ${loc(state.elements[elems[0]])} element, emphasizing ${loc(e?.gift || {})}.`;
        return zh(`这个大三角集中在${loc(state.elements[elems[0]])}元素，会特别放大「${loc(e?.gift || {})}」。`,`這個大三角集中在${loc(state.elements[elems[0]])}元素，會特別放大「${loc(e?.gift || {})}」。`);
      }
    }

    if (pattern.type==='t-square' && pattern.apex) {
      const p=result.planets[pattern.apex];
      if (lang()==='en') return `${loc(planetMeta(pattern.apex).name)} in ${signName(p.index)} is the apex and the main outlet for the tension.`;
      return zh(`${loc(planetMeta(pattern.apex).name)}落在${signName(p.index)}，是这个 T 三角的焦点与主要压力出口。`,`${loc(planetMeta(pattern.apex).name)}落在${signName(p.index)}，是這個 T 三角的焦點與主要壓力出口。`);
    }

    if (pattern.type==='kite' && pattern.focus) {
      const p=result.planets[pattern.focus];
      if (lang()==='en') return `${loc(planetMeta(pattern.focus).name)} in ${signName(p.index)} is the focal point that activates the Grand Trine.`;
      return zh(`${loc(planetMeta(pattern.focus).name)}落在${signName(p.index)}，是启动大三角潜力的焦点星体。`,`${loc(planetMeta(pattern.focus).name)}落在${signName(p.index)}，是啟動大三角潛力的焦點星體。`);
    }

    if (pattern.type==='grand-cross') {
      const modes=[...new Set(pattern.bodies.map(k => signMeta(result.planets[k].index).modality))];
      if (modes.length===1) {
        if (lang()==='en') return `All four points share the ${loc(state.modalities[modes[0]])} modality, intensifying that mode of responding to pressure.`;
        return zh(`四个端点集中在${loc(state.modalities[modes[0]])}模式，会放大这种面对压力与推动事情的方式。`,`四個端點集中在${loc(state.modalities[modes[0]])}模式，會放大這種面對壓力與推動事情的方式。`);
      }
    }

    return '';
  }

  function patternCard(pattern,result) {
    const meta=state.synthesis?.patterns?.[pattern.type];
    if (!meta) return '';
    const context=patternContext(pattern,result);
    const focus = pattern.apex || pattern.focus;

    return `
      <article class="astro-pattern-card">
        <header>
          <div>
            <span class="astro-pattern-mark">✦</span>
            <h4>${esc(loc(meta.name))}</h4>
          </div>
          ${focus ? `<span class="astro-pattern-focus">${esc(ui('patternFocus'))} · ${planetMeta(focus).glyph} ${esc(loc(planetMeta(focus).name))}</span>` : ''}
        </header>

        <p class="astro-pattern-bodies"><strong>${esc(ui('patternBodies'))}</strong> · ${esc(patternBodyNames(pattern))}</p>
        <p class="astro-pattern-core">${esc(loc(meta.core))}${context ? ` ${esc(context)}` : ''}</p>

        <div class="astro-pattern-three">
          <section><h5>${esc(ui('strengths'))}</h5><p>${esc(loc(meta.strength))}</p></section>
          <section><h5>${esc(ui('challenges'))}</h5><p>${esc(loc(meta.challenge))}</p></section>
          <section><h5>${esc(ui('growthDirection'))}</h5><p>${esc(loc(meta.growth))}</p></section>
        </div>
      </article>
    `;
  }

  function renderStructure(result) {
    const host=$('chartStructure');
    if (!host) return;

    const analysis=structureAnalysis(result);
    const rulers=analysis.chartRulers;

    let rulerHtml;
    if (!rulers) {
      rulerHtml=`<p class="astro-section-unavailable">${esc(ui('unknownTimeHouses'))}</p>`;
    } else {
      const modernLabel=ui('modernRuler');
      const traditionalLabel=ui('traditionalRuler');
      rulerHtml=`
        <section class="astro-structure-block">
          <div class="astro-structure-heading">
            <h3>${esc(ui('chartRuler'))}</h3>
            <p>${esc(loc(state.synthesis.chartRulerNote))}</p>
          </div>
          <div class="astro-ruler-grid">
            ${chartRulerCard(result,rulers.modern,modernLabel)}
            ${rulers.traditional ? chartRulerCard(result,rulers.traditional,traditionalLabel) : ''}
          </div>
        </section>`;
    }

    const patternHtml=analysis.patterns.length
      ? analysis.patterns.map(pattern => patternCard(pattern,result)).join('')
      : `<p class="astro-section-unavailable">${esc(ui('noMajorPatterns'))}</p>`;

    host.innerHTML=`
      ${rulerHtml}
      <section class="astro-structure-block">
        <div class="astro-structure-heading">
          <h3>${esc(ui('majorPatterns'))}</h3>
          <p>${esc(loc(state.synthesis.patternRule))}</p>
        </div>
        <div class="astro-pattern-list">${patternHtml}</div>
      </section>
    `;
  }

  function countBy(items, getter) {
    const out = {};
    items.forEach(item => {
      const key = getter(item);
      out[key] = (out[key] || 0) + 1;
    });
    return out;
  }

  function renderCountChips(counts, labels) {
    return Object.entries(counts)
      .sort((a,b) => b[1]-a[1])
      .map(([key,count]) => `<span>${esc(loc(labels[key]))} <b>${count}</b></span>`)
      .join('');
  }

  function dominantKeys(counts) {
    const vals = Object.values(counts);
    if (!vals.length) return [];
    const max = Math.max(...vals);
    return Object.keys(counts).filter(k => counts[k] === max);
  }

  function bodyHousePhrase(result,key) {
    const p=result.planets?.[key];
    if (!p?.house) return '';
    const h=deepHouse(p.house);
    if (lang()==='en') return ` House ${p.house} places this especially in ${loc(h?.lifeArea || {})}.`;
    const suffix=lang()==='zh-TW'?'宮':'宫';
    return zh(` 落在第${p.house}${suffix}后，这股力量更集中于「${loc(h?.lifeArea || {})}」。`,` 落在第${p.house}${suffix}後，這股力量更集中於「${loc(h?.lifeArea || {})}」。`);
  }

  function bodyAspectPhrase(result,key,hardOnly=false) {
    const aspects=(result.aspects || [])
      .filter(a => (a.body1===key || a.body2===key) && (!hardOnly || ['square','opposition'].includes(a.key)))
      .sort((a,b)=>a.orb-b.orb);

    if (!aspects.length) return '';

    const a=aspects[0];
    const other=a.body1===key ? a.body2 : a.body1;
    const meta=state.meta.aspects[a.key];

    if (lang()==='en') {
      return ` A notable modifier is ${loc(planetMeta(key).name)} ${loc(meta.name)} ${loc(planetMeta(other).name)} (orb ${formatOrb(a.orb)}).`;
    }
    return zh(` 其中较明显的修饰是${loc(planetMeta(key).name)}${loc(meta.name)}${loc(planetMeta(other).name)}（${ui('orb')} ${formatOrb(a.orb)}）。`,` 其中較明顯的修飾是${loc(planetMeta(key).name)}${loc(meta.name)}${loc(planetMeta(other).name)}（${ui('orb')} ${formatOrb(a.orb)}）。`);
  }

  function planetIntegratedSentence(result,key) {
    const p=result.planets[key];
    const signDeep=deepSignByIndex(p.index);
    const planet=planetMeta(key);

    if (lang()==='en') {
      return `${loc(planet.name)} in ${signName(p.index)} tends to express ${loc(planet.focus)} ${loc(signDeep?.approach || {})}.${bodyHousePhrase(result,key)}${bodyAspectPhrase(result,key)}`;
    }

    const prefix=lang()==='zh-TW'?'傾向':'倾向';
    const expr=lang()==='zh-TW'?'表達':'表达';
    return `${loc(planet.name)}落在${signName(p.index)}，讓「${loc(planet.focus)}」${prefix}以「${loc(signDeep?.approach || {})}」的方式${expr}。${bodyHousePhrase(result,key)}${bodyAspectPhrase(result,key)}`;
  }

  function relationshipHouseContext(result) {
    if (!result.houses) return '';
    const h5=result.houses.cusps[4];
    const h7=result.houses.cusps[6];
    const h8=result.houses.cusps[7];

    if (lang()==='en') {
      return ` Romance begins through a ${signName(h5.index)} style, partnership through ${signName(h7.index)}, and deeper sharing through ${signName(h8.index)}.`;
    }
    const suffix=lang()==='zh-TW'?'宮':'宫';
    return zh(` 第5${suffix}${signName(h5.index)}描述心动与表达喜欢的入口；第7${suffix}${signName(h7.index)}描述重要伴侣关系；第8${suffix}${signName(h8.index)}则补充深层信任与共享的方式。`,` 第5${suffix}${signName(h5.index)}描述心動與表達喜歡的入口；第7${suffix}${signName(h7.index)}描述重要伴侶關係；第8${suffix}${signName(h8.index)}則補充深層信任與共享的方式。`);
  }

  function careerContext(result) {
    if (!result.houses?.angles?.mc) return '';
    const mc=result.houses.angles.mc;
    const tenth=result.houses.cusps[9];
    const rulerInfo=structureAnalysis(result).chartRulers;

    let rulerPart='';
    if (rulerInfo?.modern?.position) {
      const key=rulerInfo.modern.key;
      const p=rulerInfo.modern.position;
      rulerPart = lang()==='en'
        ? ` The chart ruler, ${loc(planetMeta(key).name)}, is in ${signName(p.index)}${p.house ? ` / House ${p.house}` : ''}, showing where personal agency is most directly routed.`
        : zh(
            ` 命主星${loc(planetMeta(key).name)}落在${signName(p.index)}${p.house ? `第${p.house}宫` : ''}，显示整张盘最常把主动性导向哪里。`,
            ` 命主星${loc(planetMeta(key).name)}落在${signName(p.index)}${p.house ? `第${p.house}宮` : ''}，顯示整張盤最常把主動性導向哪裡。`
          );
    }

    if (lang()==='en') {
      return `MC in ${signName(mc.index)} and the 10th-house cusp in ${signName(tenth.index)} describe a public path that develops through that sign's style.${rulerPart}`;
    }
    return zh(`MC 与第10宫都把事业／公众方向带向${signName(tenth.index)}式的运作方式。${rulerPart}`,`MC 與第10宮都把事業／公眾方向帶向${signName(tenth.index)}式的運作方式。${rulerPart}`);
  }

  function strongestHardAspect(result) {
    return (result.aspects || [])
      .filter(a => ['square','opposition'].includes(a.key))
      .sort((a,b)=>a.orb-b.orb)[0] || null;
  }

  function personalitySynthesis(result,elements,modalities,signCounts) {
    const sun=result.sun;
    const moon=result.moon;
    const asc=result.ascendant;
    const sunDeep=deepSignByIndex(sun.index);
    const moonDeep=deepSignByIndex(moon.index);
    const ascDeep=asc ? deepSignByIndex(asc.index) : null;

    let core;
    if (lang()==='en') {
      core=`Sun in ${signName(sun.index)} gives identity a style that works ${loc(sunDeep?.approach || {})}; Moon in ${signName(moon.index)} processes security ${loc(moonDeep?.approach || {})}.`;
      if (asc) core+=` ${signName(asc.index)} rising shapes the first outward response ${loc(ascDeep?.approach || {})}.`;
      core+=bodyAspectPhrase(result,'sun');
    } else if (lang()==='zh-TW') {
      core=`太陽${signName(sun.index)}讓核心自我傾向${loc(sunDeep?.approach || {})}；月亮${signName(moon.index)}讓情緒安全感更常透過「${loc(moonDeep?.approach || {})}」被處理。`;
      if (asc) core+=` 上升${signName(asc.index)}則讓你面對外界時，第一反應更傾向${loc(ascDeep?.approach || {})}。`;
      core+=bodyAspectPhrase(result,'sun');
    } else {
      core=`太阳${signName(sun.index)}让核心自我倾向${loc(sunDeep?.approach || {})}；月亮${signName(moon.index)}让情绪安全感更常透过「${loc(moonDeep?.approach || {})}」被处理。`;
      if (asc) core+=` 上升${signName(asc.index)}则让你面对外界时，第一反应更倾向${loc(ascDeep?.approach || {})}。`;
      core+=bodyAspectPhrase(result,'sun');
    }

    const emotion=planetIntegratedSentence(result,'moon');
    const thinking=planetIntegratedSentence(result,'mercury');

    let relationship;
    if (lang()==='en') {
      relationship=`${planetIntegratedSentence(result,'venus')} ${planetIntegratedSentence(result,'mars')}${relationshipHouseContext(result)}`;
    } else {
      relationship=`${planetIntegratedSentence(result,'venus')} ${planetIntegratedSentence(result,'mars')}${relationshipHouseContext(result)}`;
    }

    let action=planetIntegratedSentence(result,'mars');
    const saturnLink=(result.aspects || [])
      .filter(a => (a.body1==='mars' && a.body2==='saturn') || (a.body1==='saturn' && a.body2==='mars'))
      .sort((a,b)=>a.orb-b.orb)[0];
    if (saturnLink) {
      action += lang()==='en'
        ? ' The Mars–Saturn link is especially relevant to pacing: action and restraint need to learn to cooperate.'
        : (lang()==='zh-TW'
          ? ' 火星與土星的連結特別關係到節奏：推進與克制需要學會合作。'
          : ' 火星与土星的连接特别关系到节奏：推进与克制需要学会合作。');
    }

    const direction=careerContext(result) || planetIntegratedSentence(result,'sun');

    const eKeys=dominantKeys(elements);
    const mKeys=dominantKeys(modalities);
    const eGift=eKeys.map(k=>loc(state.deep.elements[k]?.gift)).filter(Boolean).join(lang()==='en'?', ':'、');
    const eShadow=eKeys.map(k=>loc(state.deep.elements[k]?.shadow)).filter(Boolean).join(lang()==='en'?', ':'；');
    const mGift=mKeys.map(k=>loc(state.deep.modalities[k]?.gift)).filter(Boolean).join(lang()==='en'?', ':'、');
    const mShadow=mKeys.map(k=>loc(state.deep.modalities[k]?.shadow)).filter(Boolean).join(lang()==='en'?', ':'；');

    const pattern = lang()==='en'
      ? `The strongest element pattern emphasizes ${eGift}; its balancing task is ${eShadow}. The dominant modality emphasizes ${mGift}; watch for ${mShadow}.`
      : zh(
          `元素分布最突出的倾向是「${eGift}」；相对需要留意「${eShadow}」。模式分布则强调「${mGift}」，另一面可能是「${mShadow}」。`,
          `元素分布最突出的傾向是「${eGift}」；相對需要留意「${eShadow}」。模式分布則強調「${mGift}」，另一面可能是「${mShadow}」。`
        );

    const structural=structureAnalysis(result);
    const hard=strongestHardAspect(result);
    let growth;

    if (hard) {
      const p1=planetMeta(hard.body1),p2=planetMeta(hard.body2),meta=state.meta.aspects[hard.key];
      const depth=aspectDepth(hard);
      growth=lang()==='en'
        ? `The tightest major adjustment aspect is ${loc(p1.name)} ${loc(meta.name)} ${loc(p2.name)} (orb ${formatOrb(hard.orb)}). ${depth.growth}`
        : zh(`目前最紧密的主要调整相位是${loc(p1.name)}${loc(meta.name)}${loc(p2.name)}（${ui('orb')} ${formatOrb(hard.orb)}）。${depth.growth}`,`目前最緊密的主要調整相位是${loc(p1.name)}${loc(meta.name)}${loc(p2.name)}（${ui('orb')} ${formatOrb(hard.orb)}）。${depth.growth}`);
    } else {
      growth=lang()==='en'
        ? 'No square or opposition dominates the current major-aspect set; growth is more likely to come from deliberately developing underused strengths.'
        : zh('目前五大主要相位里没有明显由四分或对分主导的压力点，因此成长更需要主动开发那些太自然、容易被忽略的能力。','目前五大主要相位裡沒有明顯由四分或對分主導的壓力點，因此成長更需要主動開發那些太自然、容易被忽略的能力。');
    }

    if (structural.patterns.length) {
      const first=structural.patterns[0];
      const meta=state.synthesis.patterns[first.type];
      growth += lang()==='en'
        ? ` The chart also contains ${loc(meta.name)}, so its integration task is part of the broader personality pattern.`
        : zh(` 命盘同时出现${loc(meta.name)}，因此这个格局的整合方式也会成为长期人格主题。`,` 命盤同時出現${loc(meta.name)}，因此這個格局的整合方式也會成為長期人格主題。`);
    }

    const concentration=Object.entries(signCounts).filter(([,c])=>c>=3).sort((a,b)=>b[1]-a[1])[0];
    let advice;
    if (concentration) {
      const sign=state.signs.find(s=>s.key===concentration[0]);
      const sd=state.deep.signs[concentration[0]];
      advice=lang()==='en'
        ? `${concentration[1]} major bodies in ${loc(sign.name)} create a clear concentration. This strengthens ${loc(sd.strength)}; growth comes from ${loc(sd.growth)}.`
        : zh(`${loc(sign.name)}聚集了${concentration[1]}颗主要星体，是明显集中点。它会放大「${loc(sd.strength)}」的优势，同时也更需要练习「${loc(sd.growth)}」。`,`${loc(sign.name)}聚集了${concentration[1]}顆主要星體，是明顯集中點。它會放大「${loc(sd.strength)}」的優勢，同時也更需要練習「${loc(sd.growth)}」。`);
    } else {
      advice=lang()==='en'
        ? 'No single sign dominates strongly, so personality is more likely to change gears between several modes depending on context.'
        : zh('没有单一星座形成特别强的集中，因此你的性格更容易依情境切换不同模式，而不是只被一种气质主导。','沒有單一星座形成特別強的集中，因此你的性格更容易依情境切換不同模式，而不是只被一種氣質主導。');
    }

    return {
      core,
      emotion,
      thinking,
      relationship,
      action,
      direction,
      growth,
      pattern,
      advice
    };
  }

  function renderOverview(result) {
    const planets = XingchenAstrologyEngine.PLANET_ORDER.map(k => result.planets[k]);
    const elements = countBy(planets,p => signMeta(p.index).element);
    const modalities = countBy(planets,p => signMeta(p.index).modality);
    const signCounts = countBy(planets,p => signMeta(p.index).key);
    const retro = XingchenAstrologyEngine.PLANET_ORDER
      .filter(k => result.planets[k].retrograde);

    const concentrations = Object.entries(signCounts)
      .filter(([,count]) => count >= 3)
      .sort((a,b) => b[1]-a[1]);

    let houseModeText = '';
    let houseModeChips = '';
    if (result.houses) {
      const modes = {angular:0,succedent:0,cadent:0};
      const angular = new Set([1,4,7,10]);
      const succedent = new Set([2,5,8,11]);
      planets.forEach(p => {
        if (angular.has(p.house)) modes.angular++;
        else if (succedent.has(p.house)) modes.succedent++;
        else if (p.house) modes.cadent++;
      });

      houseModeChips = `
        <span>${ui('angular')} <b>${modes.angular}</b></span>
        <span>${ui('succedent')} <b>${modes.succedent}</b></span>
        <span>${ui('cadent')} <b>${modes.cadent}</b></span>`;

      const max = Math.max(modes.angular,modes.succedent,modes.cadent);
      const winners = Object.keys(modes).filter(k => modes[k] === max);
      houseModeText = winners.length !== 1
        ? ui('balancedHouses')
        : ui(winners[0] + 'Text');
    }

    const tight = (result.aspects || []).filter(a => a.orb <= 2).slice(0,5);
    const tightHtml = tight.length
      ? tight.map(a => {
          const p1 = planetMeta(a.body1);
          const p2 = planetMeta(a.body2);
          const asp = state.meta.aspects[a.key];
          return `<span>${p1.glyph}${asp.symbol}${p2.glyph} ${formatOrb(a.orb)}</span>`;
        }).join('')
      : `<span>${esc(ui('none'))}</span>`;

    const concentrationHtml = concentrations.length
      ? concentrations.map(([key,count]) => {
          const sign = state.signs.find(s => s.key === key);
          return `<p>${esc(tpl(ui('concentrationText'),{sign:loc(sign.name),count:String(count)}))}</p>`;
        }).join('')
      : '';

    const retroHtml = retro.length
      ? retro.map(k => `<span>${planetMeta(k).glyph} ${esc(loc(planetMeta(k).name))}</span>`).join('')
      : `<span>${esc(ui('none'))}</span>`;

    $('chartOverview').innerHTML = `
      ${result.mode === 'unknown-time' ? `<p class="astro-overview-warning">${esc(ui('approx'))}</p>` : ''}

      <div class="astro-overview-grid">
        <section>
          <h4>${esc(ui('element'))}</h4>
          <div class="astro-stat-chips">${renderCountChips(elements,state.elements)}</div>
        </section>
        <section>
          <h4>${esc(ui('modality'))}</h4>
          <div class="astro-stat-chips">${renderCountChips(modalities,state.modalities)}</div>
        </section>
        ${result.houses ? `<section>
          <h4>${esc(ui('houseEmphasis'))}</h4>
          <div class="astro-stat-chips">${houseModeChips}</div>
        </section>` : ''}
        <section>
          <h4>${esc(ui('retroSummary'))}</h4>
          <div class="astro-stat-chips">${retroHtml}</div>
        </section>
        <section>
          <h4>${esc(ui('tightAspects'))}</h4>
          <div class="astro-stat-chips">${tightHtml}</div>
        </section>
      </div>

      ${concentrations.length ? `<div class="astro-overview-text"><h4>${esc(ui('signConcentration'))}</h4>${concentrationHtml}</div>` : ''}
      ${houseModeText ? `<div class="astro-overview-text"><h4>${esc(ui('houseEmphasis'))}</h4><p>${esc(houseModeText)}</p></div>` : ''}
      ${(() => {
        const synthesis = personalitySynthesis(result,elements,modalities,signCounts);
        return `<section class="astro-personality-synthesis astro-personality-synthesis-full">
          <h3>${esc(ui('integratedPersonality'))}</h3>
          <div>
            <article><h4>${esc(ui('corePersonality'))}</h4><p>${esc(synthesis.core)}</p></article>
            <article><h4>${esc(ui('emotionalProfile'))}</h4><p>${esc(synthesis.emotion)}</p></article>
            <article><h4>${esc(ui('thinkingProfile'))}</h4><p>${esc(synthesis.thinking)}</p></article>
            <article><h4>${esc(ui('relationshipProfile'))}</h4><p>${esc(synthesis.relationship)}</p></article>
            <article><h4>${esc(ui('actionProfile'))}</h4><p>${esc(synthesis.action)}</p></article>
            <article><h4>${esc(ui('directionProfile'))}</h4><p>${esc(synthesis.direction)}</p></article>
            <article><h4>${esc(ui('dominantPattern'))}</h4><p>${esc(synthesis.pattern)}</p></article>
            <article><h4>${esc(ui('growthProfile'))}</h4><p>${esc(synthesis.growth)}</p></article>
            <article><h4>${esc(ui('practicalAdvice'))}</h4><p>${esc(synthesis.advice)}</p></article>
          </div>
        </section>`;
      })()}
      <p class="astro-overview-source">${esc(ui('sourceNote'))}</p>
    `;
  }

  async function render(result) {
    await ready;
    setStaticText();
    renderPlanets(result);
    renderHouses(result);
    renderAspects(result);
    renderStructure(result);
    renderOverview(result);
  }

  return {render};
})();