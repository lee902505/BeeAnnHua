window.XingchenAstrologyFull = (() => {
  const state = {
    signs:[],
    elements:{},
    modalities:{},
    meta:null
  };

  const $ = id => document.getElementById(id);

  const UI = {
    'zh-CN':{
      planets:'行星位置', planetsHint:'十颗主要星体的星座、度数、宫位与逆行状态',
      houses:'四轴与十二宫', housesHint:'ASC / DSC / MC / IC、12 宫宫头与行星落宫',
      aspects:'主要相位', aspectsHint:'合相、六分、四分、三分与对分，以及实际容许度',
      overview:'完整摘要', overviewHint:'元素、模式、宫位重点、逆行与紧密相位的整体观察',
      interpretation:'展开解读', retrograde:'逆行', house:'第 {n} 宫', unknownHouse:'宫位需准确出生时间',
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
      overview:'完整摘要', overviewHint:'元素、模式、宮位重點、逆行與緊密相位的整體觀察',
      interpretation:'展開解讀', retrograde:'逆行', house:'第 {n} 宮', unknownHouse:'宮位需準確出生時間',
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
      overview:'Full Summary', overviewHint:'Elements, modalities, house emphasis, retrogrades and tight aspects',
      interpretation:'Open interpretation', retrograde:'Retrograde', house:'House {n}', unknownHouse:'House requires an accurate birth time',
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
    })
  ]).then(([signs, meta]) => {
    state.signs = signs.signs;
    state.elements = signs.elements;
    state.modalities = signs.modalities;
    state.meta = meta;
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
    if (!houseNumber) return '';
    const planet = planetMeta(key);
    const house = state.meta.houses[String(houseNumber)];
    return tpl(ui('planetHouseIntro'), {
      planet:loc(planet.name),
      house:String(houseNumber),
      theme:loc(house.name)
    }) + ' ' + loc(house.theme) + '。';
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
      const house = state.meta.houses[String(n)];
      const occupants = housePlanets(result,n);
      const occupantHtml = occupants.length
        ? occupants.map(key => `<span class="astro-house-planet-chip">${planetMeta(key).glyph} ${esc(loc(planetMeta(key).name))}</span>`).join('')
        : `<span class="astro-house-empty">—</span>`;

      return `
        <details class="astro-house-row">
          <summary>
            <span class="astro-house-number">${String(n).padStart(2,'0')}</span>
            <span class="astro-house-cusp">
              <strong>${esc(loc(house.name))}</strong>
              <small>${esc(signName(cusp.index))} · ${esc(formatDegree(cusp))}</small>
            </span>
            <span class="astro-house-occupants">${occupantHtml}</span>
          </summary>
          <div class="astro-house-description">
            <p>${esc(loc(house.theme))}</p>
            ${occupants.map(key => `<p><b>${planetMeta(key).glyph} ${esc(loc(planetMeta(key).name))}</b>：${esc(planetHouseText(key,n))}</p>`).join('')}
          </div>
        </details>
      `;
    }).join('');
  }

  function aspectInterpretation(aspect) {
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
      return `
        <details class="astro-aspect-row">
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
          <div class="astro-aspect-body">
            <p>${esc(aspectInterpretation(aspect))}</p>
            <small>${aspect.separation.toFixed(2)}° / ${meta.angle}°</small>
          </div>
        </details>
      `;
    }).join('');
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
      <p class="astro-overview-source">${esc(ui('sourceNote'))}</p>
    `;
  }

  async function render(result) {
    await ready;
    setStaticText();
    renderPlanets(result);
    renderHouses(result);
    renderAspects(result);
    renderOverview(result);
  }

  return {render};
})();