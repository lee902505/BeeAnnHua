window.XingchenStellarInterpretation = (() => {
  const state = {
    signs: [],
    elements: {},
    modalities: {},
    meta: null,
    deep: null,
    synthesis: null,
    framework: null,
    result: null,
    report: null,
    ready: null
  };

  const $ = id => document.getElementById(id);
  const PLANETS = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  const HARD = new Set(['square','opposition']);
  const SOFT = new Set(['trine','sextile']);
  const ANGULAR_HOUSES = new Set([1,4,7,10]);
  const SUCCEDENT_HOUSES = new Set([2,5,8,11]);

  const UI = {
    'zh-CN': {
      eyebrow:'STELLAR INTERPRETATION ENGINE · LOCAL',
      title:'完整星辰深度报告',
      intro:'把整张本命盘放在一起看，而不是逐项堆叠解释。系统会先找出最强主题、矛盾点与重复讯号，再组合成一篇连续的长篇解读。',
      generate:'生成完整星辰报告',
      generating:'正在整理命盘主轴…',
      regenerate:'重新整理报告',
      localBadge:'0 API · 本地生成',
      deterministicBadge:'同一命盘 · 逻辑稳定',
      themeTitle:'这张盘最突出的主题',
      themeHint:'分数代表这张命盘里该主题的相对强调程度，不是好坏评分。',
      evidence:'主要依据',
      overview:'先说结论',
      identity:'核心人格与外在方式',
      emotion:'情绪与安全感',
      mind:'思考、学习与表达',
      relationship:'感情、吸引与亲密关系',
      drive:'行动、压力与隐藏驱力',
      career:'事业、价值感与人生方向',
      tension:'命盘里最明显的拉扯',
      strength:'最值得发挥的优势',
      growth:'长期成长方向',
      closing:'给这张命盘的一句话',
      unknownTime:'出生时间未知，因此本报告不会把上升、宫位、MC 或命主星当成确定依据；相关章节会自动降权。',
      symbolic:'这份报告使用传统西洋占星的象征语言进行整合，不是科学人格诊断，也不是未来预测。',
      emptyHard:'这张盘在目前采用的五大主要相位范围内，没有特别突出的四分或对分。成长重点更偏向主动开发被低估的能力，而不是被强烈冲突推着改变。',
      noSoft:'没有特别紧密的三分或六分可单独主导，因此优势更像是由整体配置慢慢累积出来。',
      chartRuler:'命主星',
      tight:'紧密相位',
      house:'第{n}宫',
      retro:'逆行',
      pattern:'大型格局',
      topPlanet:'重点星体',
      dominantElement:'主导元素',
      dominantMode:'主导模式',
      reportVersion:'报告引擎 V1.0'
    },
    'zh-TW': {
      eyebrow:'STELLAR INTERPRETATION ENGINE · LOCAL',
      title:'完整星辰深度報告',
      intro:'把整張本命盤放在一起看，而不是逐項堆疊解釋。系統會先找出最強主題、矛盾點與重複訊號，再組合成一篇連續的長篇解讀。',
      generate:'生成完整星辰報告',
      generating:'正在整理命盤主軸…',
      regenerate:'重新整理報告',
      localBadge:'0 API · 本地生成',
      deterministicBadge:'同一命盤 · 邏輯穩定',
      themeTitle:'這張盤最突出的主題',
      themeHint:'分數代表這張命盤裡該主題的相對強調程度，不是好壞評分。',
      evidence:'主要依據',
      overview:'先說結論',
      identity:'核心人格與外在方式',
      emotion:'情緒與安全感',
      mind:'思考、學習與表達',
      relationship:'感情、吸引與親密關係',
      drive:'行動、壓力與隱藏驅力',
      career:'事業、價值感與人生方向',
      tension:'命盤裡最明顯的拉扯',
      strength:'最值得發揮的優勢',
      growth:'長期成長方向',
      closing:'給這張命盤的一句話',
      unknownTime:'出生時間未知，因此本報告不會把上升、宮位、MC 或命主星當成確定依據；相關章節會自動降權。',
      symbolic:'這份報告使用傳統西洋占星的象徵語言進行整合，不是科學人格診斷，也不是未來預測。',
      emptyHard:'這張盤在目前採用的五大主要相位範圍內，沒有特別突出的四分或對分。成長重點更偏向主動開發被低估的能力，而不是被強烈衝突推著改變。',
      noSoft:'沒有特別緊密的三分或六分可單獨主導，因此優勢更像是由整體配置慢慢累積出來。',
      chartRuler:'命主星',
      tight:'緊密相位',
      house:'第{n}宮',
      retro:'逆行',
      pattern:'大型格局',
      topPlanet:'重點星體',
      dominantElement:'主導元素',
      dominantMode:'主導模式',
      reportVersion:'報告引擎 V1.0'
    },
    'en': {
      eyebrow:'STELLAR INTERPRETATION ENGINE · LOCAL',
      title:'Full Stellar Interpretation',
      intro:'A whole-chart reading rather than a stack of isolated placements. The engine ranks repeated themes, tensions and reinforcing signals before composing a connected report.',
      generate:'Generate full stellar report',
      generating:'Synthesizing chart themes…',
      regenerate:'Rebuild report',
      localBadge:'0 API · Local generation',
      deterministicBadge:'Same chart · Stable logic',
      themeTitle:'Strongest themes in this chart',
      themeHint:'Scores indicate relative emphasis inside this chart, not a good/bad rating.',
      evidence:'Primary evidence',
      overview:'Bottom line',
      identity:'Core identity & outward style',
      emotion:'Emotion & security',
      mind:'Thinking, learning & expression',
      relationship:'Love, attraction & intimacy',
      drive:'Action, pressure & hidden drive',
      career:'Career, values & direction',
      tension:'Most visible inner tension',
      strength:'Most usable strength',
      growth:'Long-term growth direction',
      closing:'One line for this chart',
      unknownTime:'Birth time is unknown, so Ascendant, houses, MC and chart ruler are not treated as certain evidence. Those themes are automatically down-weighted.',
      symbolic:'This report uses the symbolic language of traditional Western astrology. It is not a scientific personality diagnosis or a prediction of the future.',
      emptyHard:'No square or opposition clearly dominates the current major-aspect set. Growth is therefore more about developing underused capacities than being forced by one central conflict.',
      noSoft:'No particularly tight trine or sextile dominates, so strengths are more distributed across the whole chart.',
      chartRuler:'Chart ruler',
      tight:'Tight aspect',
      house:'House {n}',
      retro:'Retrograde',
      pattern:'Major pattern',
      topPlanet:'Key planet',
      dominantElement:'Dominant element',
      dominantMode:'Dominant modality',
      reportVersion:'Report engine V1.0'
    }
  };

  function lang() {
    const saved = localStorage.getItem('xingchen-language');
    return ['zh-CN','zh-TW','en'].includes(saved) ? saved : 'zh-CN';
  }
  function ui(key){ return UI[lang()]?.[key] ?? UI['zh-CN'][key] ?? key; }
  function loc(obj){ return obj?.[lang()] ?? obj?.['zh-CN'] ?? obj?.en ?? ''; }
  function esc(value){ return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
  function tpl(text, values){ return Object.entries(values).reduce((s,[k,v]) => s.replaceAll(`{${k}}`,v), text); }
  function zh(cn,tw){ return lang()==='zh-TW' ? tw : cn; }

  function ensureReady(){
    if (state.ready) return state.ready;
    state.ready = Promise.all([
      fetch('../data/astrology/signs.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('signs load failed'); return r.json();}),
      fetch('../data/astrology/chart-interpretations.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('chart interpretations load failed'); return r.json();}),
      fetch('../data/astrology/deep-interpretations.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('deep interpretations load failed'); return r.json();}),
      fetch('../data/astrology/natal-synthesis.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('natal synthesis load failed'); return r.json();}),
      fetch('../data/astrology/stellar-interpretation-engine.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('stellar framework load failed'); return r.json();})
    ]).then(([signs,meta,deep,synthesis,framework])=>{
      state.signs = signs.signs || [];
      state.elements = signs.elements || {};
      state.modalities = signs.modalities || {};
      state.meta = meta;
      state.deep = deep;
      state.synthesis = synthesis;
      state.framework = framework;
      return true;
    }).catch(error=>{
      console.error('[StellarInterpretation]',error);
      state.ready = null;
      throw error;
    });
    return state.ready;
  }

  function sign(index){ return state.signs[index] || null; }
  function signName(index){ return loc(sign(index)?.name); }
  function planetMeta(key){ return state.meta?.planets?.[key] || null; }
  function planetName(key){ return loc(planetMeta(key)?.name) || key; }
  function planetGlyph(key){ return planetMeta(key)?.glyph || '✦'; }
  function deepSign(index){ const key=sign(index)?.key; return key ? state.deep?.signs?.[key] : null; }
  function deepHouse(number){ return state.deep?.houses?.[String(number)] || null; }
  function deepPlanet(key){ return state.deep?.planets?.[key] || null; }
  function aspectMeta(key){ return state.meta?.aspects?.[key] || null; }

  function formatDegree(position){
    if (!position || position.signUncertain) return '';
    let d=Math.floor(position.degree || 0);
    let m=Math.round(((position.degree || 0)-d)*60);
    if(m===60){d+=1;m=0;} if(d===30)d=0;
    return `${d}°${String(m).padStart(2,'0')}′`;
  }
  function formatOrb(orb){
    const d=Math.floor(orb || 0);
    const m=Math.round(((orb || 0)-d)*60);
    return `${d}°${String(m).padStart(2,'0')}′`;
  }
  function houseLabel(n){ return n ? tpl(ui('house'),{n:String(n)}) : ''; }
  function houseArea(n){ return n ? loc(deepHouse(n)?.lifeArea || deepHouse(n)?.name || {}) : ''; }
  function positionSignLabel(position){
    if(!position)return '';
    const possible=position.possibleSignIndexes || [];
    if(position.signUncertain && possible.length){ return possible.map(signName).join(' / '); }
    return signName(position.index);
  }
  function moonSignLabel(result){
    if(result.moonSignUncertain && result.moonDayStart && result.moonDayEnd){
      return `${signName(result.moonDayStart.index)} / ${signName(result.moonDayEnd.index)}`;
    }
    return positionSignLabel(result.moon);
  }

  function countBy(items,getter){
    const out={};
    items.forEach(item=>{const key=getter(item); if(key!==undefined && key!==null) out[key]=(out[key]||0)+1;});
    return out;
  }
  function maxKeys(counts){
    const values=Object.values(counts);
    if(!values.length)return [];
    const max=Math.max(...values);
    return Object.keys(counts).filter(k=>counts[k]===max);
  }
  function topAspectFor(result,key,predicate=()=>true){
    return (result.aspects||[])
      .filter(a=>(a.body1===key||a.body2===key)&&predicate(a))
      .sort((a,b)=>a.orb-b.orb)[0] || null;
  }
  function otherBody(aspect,key){ return aspect?.body1===key ? aspect.body2 : aspect?.body1; }
  function exactness(aspect){
    if(!aspect)return '';
    const ratio=aspect.limit ? aspect.orb/aspect.limit : 1;
    if(aspect.orb<=0.5 || ratio<=0.1)return 'very';
    if(aspect.orb<=1 || ratio<=0.2)return 'tight';
    if(aspect.orb<=2 || ratio<=0.4)return 'clear';
    return 'standard';
  }

  function structure(result){
    if(window.XingchenNatalSynthesis?.analyze){
      return window.XingchenNatalSynthesis.analyze(result,state.signs,state.deep?.signs||{});
    }
    return {patterns:[],chartRulers:null};
  }

  function planetImportance(result,struct){
    const scores={};
    PLANETS.forEach(key=>scores[key]=0);
    const base={sun:8,moon:8,mercury:5,venus:5,mars:5,jupiter:3,saturn:4,uranus:2,neptune:2,pluto:2};
    PLANETS.forEach(key=>{
      const p=result.planets?.[key];
      if(!p)return;
      scores[key]+=base[key]||1;
      if(ANGULAR_HOUSES.has(p.house))scores[key]+=4;
      else if(SUCCEDENT_HOUSES.has(p.house))scores[key]+=1;
      const aspects=(result.aspects||[]).filter(a=>a.body1===key||a.body2===key);
      aspects.forEach(a=>scores[key]+=a.orb<=1?2:a.orb<=2?1:0.5);
      if(p.retrograde)scores[key]+=0.5;
    });
    const ruler=struct.chartRulers?.modern?.key;
    if(ruler&&scores[ruler]!==undefined)scores[ruler]+=7;
    const traditional=struct.chartRulers?.traditional?.key;
    if(traditional&&traditional!==ruler&&scores[traditional]!==undefined)scores[traditional]+=3;
    (struct.patterns||[]).forEach(pattern=>(pattern.bodies||[]).forEach(key=>{if(scores[key]!==undefined)scores[key]+=2;}));
    return Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  }

  function themeScores(result,struct){
    const defs=state.framework?.themeWeights || {};
    const raw={};
    const importance=Object.fromEntries(planetImportance(result,struct));
    Object.entries(defs).forEach(([theme,def])=>{
      let score=0;
      Object.entries(def.planets||{}).forEach(([key,w])=>{
        const p=result.planets?.[key];
        if(!p)return;
        const emphasis=0.6 + Math.min(1.5,(importance[key]||0)/12);
        score += w*emphasis;
        if(ANGULAR_HOUSES.has(p.house))score += (def.angular||0);
        const related=(result.aspects||[]).filter(a=>a.body1===key||a.body2===key);
        related.forEach(a=>{ score += a.orb<=1 ? 1.8 : a.orb<=2 ? 1 : 0.25; });
        if(p.retrograde) score += 0.35;
      });
      Object.entries(def.houses||{}).forEach(([h,w])=>{
        const count=PLANETS.filter(k=>result.planets?.[k]?.house===Number(h)).length;
        score += count*w;
      });
      const ruler=struct.chartRulers?.modern?.key;
      if(def.asc&&result.ascendant)score += def.asc;
      if(def.chartRuler&&ruler)score += def.chartRuler;
      if(def.chartRulerMercury&&ruler==='mercury')score += def.chartRulerMercury;
      if(def.mc&&result.angles?.mc)score += def.mc;
      if(def.hardAspect)score += (result.aspects||[]).filter(a=>HARD.has(a.key)&&a.orb<=2).length*def.hardAspect;
      if(def.pattern)score += (struct.patterns||[]).length*def.pattern;
      raw[theme]=score;
    });
    const vals=Object.values(raw);
    const min=vals.length?Math.min(...vals):0;
    const max=vals.length?Math.max(...vals):1;
    const scale=state.framework?.scoreScale || {base:48,max:97};
    const span=Math.max(1,max-min);
    const out={};
    Object.entries(raw).forEach(([k,v])=>{
      const normalized=Math.round(scale.base + ((v-min)/span)*(scale.max-scale.base));
      out[k]={raw:v,score:Math.min(scale.max,Math.max(scale.base,normalized))};
    });
    return out;
  }

  function evidenceForTheme(theme,result,struct){
    const evidence=[];
    const add=(text,weight)=>{if(text)evidence.push({text,weight});};
    const p=result.planets||{};
    const placement=(key,weight=5)=>{
      if(!p[key])return;
      add(`${planetGlyph(key)} ${planetName(key)} · ${positionSignLabel(p[key])}${p[key].house?` · ${houseLabel(p[key].house)}`:''}`,weight+(ANGULAR_HOUSES.has(p[key].house)?2:0));
    };
    if(theme==='identity'){
      placement('sun',10); if(result.ascendant)add(`ASC · ${signName(result.ascendant.index)}`,9);
      if(struct.chartRulers?.modern?.key)placement(struct.chartRulers.modern.key,8);
    } else if(theme==='emotion'){
      placement('moon',11); placement('neptune',5); placement('pluto',5);
    } else if(theme==='mind'){
      placement('mercury',11); placement('jupiter',5); placement('uranus',5);
    } else if(theme==='relationship'){
      placement('venus',10); placement('mars',8); placement('moon',7);
      if(result.houses){ add(`${houseLabel(7)} · ${signName(result.houses.cusps[6].index)}`,8); add(`${houseLabel(8)} · ${signName(result.houses.cusps[7].index)}`,6); }
    } else if(theme==='drive'){
      placement('mars',11); placement('saturn',7); placement('sun',6);
    } else if(theme==='career'){
      placement('sun',8); placement('saturn',8); placement('jupiter',6);
      if(result.angles?.mc)add(`MC · ${signName(result.angles.mc.index)}`,11);
    } else if(theme==='growth'){
      placement('saturn',10); placement('jupiter',7); placement('pluto',7);
    }
    const relevantPlanetKeys=evidence.map(e=>{
      const found=PLANETS.find(k=>e.text.includes(planetName(k))); return found;
    }).filter(Boolean);
    (result.aspects||[]).filter(a=>a.orb<=2 && (relevantPlanetKeys.includes(a.body1)||relevantPlanetKeys.includes(a.body2))).slice(0,3).forEach(a=>{
      add(`${planetName(a.body1)} ${loc(aspectMeta(a.key)?.name)} ${planetName(a.body2)} · ${formatOrb(a.orb)}`,7-(a.orb||0));
    });
    return evidence.sort((a,b)=>b.weight-a.weight).slice(0,4).map(x=>x.text);
  }

  function signTrait(index,type){ return loc(deepSign(index)?.[type] || {}); }
  function planetHouseSentence(result,key){
    const p=result.planets?.[key];
    if(!p?.house)return '';
    const area=houseArea(p.house);
    if(lang()==='en')return `Because it falls in ${houseLabel(p.house)}, the theme becomes especially concentrated in ${area}.`;
    return zh(`它落在${houseLabel(p.house)}，所以这股力量特别容易在「${area}」这个领域被看见。`,`它落在${houseLabel(p.house)}，所以這股力量特別容易在「${area}」這個領域被看見。`);
  }

  function aspectNarrative(result,key){
    const a=topAspectFor(result,key);
    if(!a)return '';
    const other=otherBody(a,key);
    const pair=state.synthesis?.pairThemes?.[[key,other].sort((x,y)=>PLANETS.indexOf(x)-PLANETS.indexOf(y)).join('|')];
    const dynamic=state.synthesis?.aspectDynamics?.[a.key];
    if(!pair||!dynamic)return '';
    const tight=exactness(a);
    if(lang()==='en'){
      return `A ${tight==='very'||tight==='tight'?'tight ':''}${loc(aspectMeta(a.key)?.name)} to ${planetName(other)} makes ${loc(pair.theme)} especially noticeable. ${loc(dynamic.core)} ${HARD.has(a.key)?loc(pair.challenge):loc(pair.gift)}`;
    }
    const exact=tight==='very'||tight==='tight' ? zh('而且这个相位很紧密，','而且這個相位很緊密，') : '';
    const tail=HARD.has(a.key)?loc(pair.challenge):loc(pair.gift);
    return zh(`同时，${planetName(key)}与${planetName(other)}形成${loc(aspectMeta(a.key)?.name)}，${exact}会把「${loc(pair.theme)}」拉到更前面。${loc(dynamic.core)} ${tail}。`,`同時，${planetName(key)}與${planetName(other)}形成${loc(aspectMeta(a.key)?.name)}，${exact}會把「${loc(pair.theme)}」拉到更前面。${loc(dynamic.core)} ${tail}。`);
  }

  function dominantSummary(result){
    const planets=PLANETS.map(k=>result.planets?.[k]).filter(Boolean);
    const elementCounts=countBy(planets,p=>sign(p.index)?.element);
    const modeCounts=countBy(planets,p=>sign(p.index)?.modality);
    const e=maxKeys(elementCounts);
    const m=maxKeys(modeCounts);
    return {
      elementKeys:e,
      modalityKeys:m,
      elementGift:e.map(k=>loc(state.deep?.elements?.[k]?.gift||{})).filter(Boolean),
      elementShadow:e.map(k=>loc(state.deep?.elements?.[k]?.shadow||{})).filter(Boolean),
      modalityGift:m.map(k=>loc(state.deep?.modalities?.[k]?.gift||{})).filter(Boolean),
      modalityShadow:m.map(k=>loc(state.deep?.modalities?.[k]?.shadow||{})).filter(Boolean)
    };
  }

  function strongestAspects(result){
    const sorted=[...(result.aspects||[])].sort((a,b)=>a.orb-b.orb);
    const personal=new Set(['sun','moon','mercury','venus','mars','jupiter','saturn']);
    const ranked=list=>[...list].sort((a,b)=>{
      const pa=personal.has(a.body1)||personal.has(a.body2) ? 0 : 3;
      const pb=personal.has(b.body1)||personal.has(b.body2) ? 0 : 3;
      return (a.orb+pa)-(b.orb+pb);
    });
    return {
      hard:ranked(sorted.filter(a=>HARD.has(a.key)))[0]||null,
      soft:ranked(sorted.filter(a=>SOFT.has(a.key)))[0]||null,
      conjunction:ranked(sorted.filter(a=>a.key==='conjunction'))[0]||null,
      tight:sorted.filter(a=>a.orb<=2).slice(0,5)
    };
  }

  function coreOverview(result,analysis){
    const sun=result.sun, moon=result.moon, asc=result.ascendant;
    const sunStyle=signTrait(sun.index,'approach');
    const moonStyle=result.moonSignUncertain ? '' : signTrait(moon.index,'approach');
    const top=analysis.topPlanets.slice(0,3).map(([k])=>planetName(k));
    const themeTop=analysis.themeRanking.slice(0,3).map(([k])=>state.framework?.labels?.[lang()]?.[k] || state.framework?.labels?.['zh-CN']?.[k] || k);

    if(lang()==='en'){
      let p1=`This chart is not best understood as “just ${signName(sun.index)}.” The Sun operates ${sunStyle}`;
      p1 += result.moonSignUncertain ? `, while the Moon changes sign during the birth date (${moonSignLabel(result)}), so its emotional style cannot be fixed without a birth time` : `, while the Moon seeks security ${moonStyle}`;
      if(asc)p1+=`, and ${signName(asc.index)} rising edits the first outward response before either is obvious`;
      p1+='.';
      const p2=`The most emphasized planetary channels are ${top.join(', ')}. The strongest life themes are ${themeTop.join(', ')}, which is why the report gives those areas more space than weaker chart themes.`;
      return [p1,p2];
    }

    const moonCore=result.moonSignUncertain
      ? zh(`月亮在这一天跨越${moonSignLabel(result)}，没有出生时间时不能把其中一个月亮星座当成确定结论`, `月亮在這一天跨越${moonSignLabel(result)}，沒有出生時間時不能把其中一個月亮星座當成確定結論`)
      : zh(`月亮${signName(moon.index)}又让情绪安全感更倾向${moonStyle}`, `月亮${signName(moon.index)}又讓情緒安全感更傾向${moonStyle}`);
    const p1=asc
      ? zh(`这张盘不能只用“太阳${signName(sun.index)}”一句话概括。太阳让你的核心自我习惯${sunStyle}，${moonCore}；而上升${signName(asc.index)}会先替这些内在反应加上一层对外界的筛选。`, `這張盤不能只用「太陽${signName(sun.index)}」一句話概括。太陽讓你的核心自我習慣${sunStyle}，${moonCore}；而上升${signName(asc.index)}會先替這些內在反應加上一層對外界的篩選。`)
      : zh(`这张盘不能只用“太阳${signName(sun.index)}”一句话概括。太阳让核心自我习惯${sunStyle}，${moonCore}。由于出生时间未知，本报告不会把上升与宫位当成确定依据。`,`這張盤不能只用「太陽${signName(sun.index)}」一句話概括。太陽讓核心自我習慣${sunStyle}，${moonCore}。由於出生時間未知，本報告不會把上升與宮位當成確定依據。`);

    const p2=zh(`整张盘最有存在感的星体通道是${top.join('、')}；主题排序则把${themeTop.join('、')}推到前面。也就是说，后面的解读不会平均分配篇幅，而会把重复出现、彼此呼应的讯号当成主轴。`,`整張盤最有存在感的星體通道是${top.join('、')}；主題排序則把${themeTop.join('、')}推到前面。也就是說，後面的解讀不會平均分配篇幅，而會把重複出現、彼此呼應的訊號當成主軸。`);
    return [p1,p2];
  }

  function identitySection(result,analysis){
    const sun=result.sun, asc=result.ascendant;
    const sDeep=deepSign(sun.index);
    let p1,p2;
    if(lang()==='en'){
      p1=`Sun in ${signName(sun.index)} builds identity through ${loc(sDeep?.approach||{})}. Its natural strength is ${loc(sDeep?.strength||{})}, while its recurring blind spot can be ${loc(sDeep?.challenge||{})}. ${planetHouseSentence(result,'sun')}`;
      p2=asc ? `${signName(asc.index)} rising makes the first response to the world more ${loc(deepSign(asc.index)?.approach||{})}. This can make the visible surface look more controlled or selective than the inner Sun actually feels.` : ui('unknownTime');
    } else {
      p1=zh(`太阳落在${signName(sun.index)}，说明你建立“我是谁”的方式，很依赖「${loc(sDeep?.approach||{})}」。这会带来${loc(sDeep?.strength||{})}，但也容易在压力下滑向${loc(sDeep?.challenge||{})}。${planetHouseSentence(result,'sun')}`,`太陽落在${signName(sun.index)}，說明你建立「我是誰」的方式，很依賴「${loc(sDeep?.approach||{})}」。這會帶來${loc(sDeep?.strength||{})}，但也容易在壓力下滑向${loc(sDeep?.challenge||{})}。${planetHouseSentence(result,'sun')}`);
      p2=asc
        ? zh(`但你真正面对外界时，并不会把太阳的样子原封不动地拿出来。上升${signName(asc.index)}让第一反应更倾向「${signTrait(asc.index,'approach')}」。所以别人刚认识你时看到的，往往是比较${signTrait(asc.index,'strength')}的一层；熟悉之后，太阳${signName(sun.index)}的节奏才会更明显。`,`但你真正面對外界時，並不會把太陽的樣子原封不動地拿出來。上升${signName(asc.index)}讓第一反應更傾向「${signTrait(asc.index,'approach')}」。所以別人剛認識你時看到的，往往是比較${signTrait(asc.index,'strength')}的一層；熟悉之後，太陽${signName(sun.index)}的節奏才會更明顯。`)
        : ui('unknownTime');
    }
    const ruler=analysis.struct.chartRulers?.modern;
    if(ruler?.position){
      const key=ruler.key,p=ruler.position;
      const extra=lang()==='en'
        ? `${ui('chartRuler')} ${planetName(key)} falls in ${signName(p.index)}${p.house?` / ${houseLabel(p.house)}`:''}. That placement acts like an outlet for the whole chart: when in doubt, the chart tends to route agency through ${loc(deepSign(p.index)?.approach||{})}.`
        : zh(`${ui('chartRuler')}${planetName(key)}落在${signName(p.index)}${p.house?`、${houseLabel(p.house)}`:''}。这像整张盘的“总出口”：遇到事情时，你最后往往还是会回到「${loc(deepSign(p.index)?.approach||{})}」这套方式来处理。`,`${ui('chartRuler')}${planetName(key)}落在${signName(p.index)}${p.house?`、${houseLabel(p.house)}`:''}。這像整張盤的「總出口」：遇到事情時，你最後往往還是會回到「${loc(deepSign(p.index)?.approach||{})}」這套方式來處理。`);
      p2 += ` ${extra}`;
    }
    return [p1,p2,aspectNarrative(result,'sun')].filter(Boolean);
  }

  function emotionSection(result){
    const moon=result.moon, d=deepSign(moon.index);
    if(result.moonSignUncertain){
      const a=result.moonDayStart?.index ?? moon.possibleSignIndexes?.[0];
      const b=result.moonDayEnd?.index ?? moon.possibleSignIndexes?.[1];
      const ad=deepSign(a), bd=deepSign(b);
      if(lang()==='en') return [
        `The Moon changes signs during this birth date (${signName(a)} / ${signName(b)}). Without a birth time, the emotional style cannot be assigned to only one sign.`,
        `${signName(a)} would seek security ${loc(ad?.approach||{})}; ${signName(b)} would seek it ${loc(bd?.approach||{})}. Treat these as two possible emotional modes rather than choosing the one that simply sounds more familiar.`
      ];
      return [
        zh(`月亮在这一天发生跨星座：${signName(a)} / ${signName(b)}。没有出生时间时，不能为了“听起来比较像”就选其中一个，因此这里不会把月亮性格写成确定结论。`,`月亮在這一天發生跨星座：${signName(a)} / ${signName(b)}。沒有出生時間時，不能為了「聽起來比較像」就選其中一個，因此這裡不會把月亮性格寫成確定結論。`),
        zh(`如果月亮仍在${signName(a)}，安全感会更偏向「${loc(ad?.approach||{})}」；如果已经进入${signName(b)}，则会更偏向「${loc(bd?.approach||{})}」。这两条只作为可能范围，等有更准确出生时间再收窄。`,`如果月亮仍在${signName(a)}，安全感會更偏向「${loc(ad?.approach||{})}」；如果已經進入${signName(b)}，則會更偏向「${loc(bd?.approach||{})}」。這兩條只作為可能範圍，等有更準確出生時間再收窄。`)
      ];
    }
    let p1,p2;
    if(lang()==='en'){
      p1=`Moon in ${signName(moon.index)} seeks security through ${loc(d?.approach||{})}. Emotionally, ${loc(d?.strength||{})} is a resource, while ${loc(d?.challenge||{})} can become the automatic defense pattern. ${planetHouseSentence(result,'moon')}`;
      p2=`The useful growth direction is ${loc(d?.growth||{})}. This matters because the Moon describes what happens before deliberate reasoning catches up.`;
    } else {
      p1=zh(`月亮${signName(moon.index)}不是“你看起来像什么”，而是你在没有时间思考时，情绪会自动往哪里走。你会比较需要透过「${loc(d?.approach||{})}」来获得安全感；优势是${loc(d?.strength||{})}，但不安时也容易变成${loc(d?.challenge||{})}。${planetHouseSentence(result,'moon')}`,`月亮${signName(moon.index)}不是「你看起來像什麼」，而是你在沒有時間思考時，情緒會自動往哪裡走。你會比較需要透過「${loc(d?.approach||{})}」來獲得安全感；優勢是${loc(d?.strength||{})}，但不安時也容易變成${loc(d?.challenge||{})}。${planetHouseSentence(result,'moon')}`);
      p2=zh(`这也代表你真正需要的安定，不一定等同于你嘴上说“没关系”的部分。月亮的长期整合方向是「${loc(d?.growth||{})}」：先承认真实的情绪需求，再决定要不要回应它，而不是直接用理性或习惯把它盖过去。`,`這也代表你真正需要的安定，不一定等同於你嘴上說「沒關係」的部分。月亮的長期整合方向是「${loc(d?.growth||{})}」：先承認真實的情緒需求，再決定要不要回應它，而不是直接用理性或習慣把它蓋過去。`);
    }
    return [p1,p2,aspectNarrative(result,'moon')].filter(Boolean);
  }

  function mindSection(result){
    const p=result.planets.mercury,d=deepSign(p.index),dp=deepPlanet('mercury');
    let p1,p2;
    if(lang()==='en'){
      p1=`Mercury in ${signName(p.index)} processes information ${loc(d?.approach||{})}. This supports ${loc(d?.strength||{})}, but can also produce ${loc(d?.challenge||{})}. ${planetHouseSentence(result,'mercury')}`;
      p2=`The maturation task is ${loc(d?.growth||{})}. ${p.retrograde?'Mercury is retrograde, so thought and wording may be revised internally several times before they feel settled.':''}`;
    } else {
      p1=zh(`水星落在${signName(p.index)}，让你的脑内处理方式偏向「${loc(d?.approach||{})}」。这通常带来${loc(d?.strength||{})}，也会出现${loc(d?.challenge||{})}的副作用。${planetHouseSentence(result,'mercury')}`,`水星落在${signName(p.index)}，讓你的腦內處理方式偏向「${loc(d?.approach||{})}」。這通常帶來${loc(d?.strength||{})}，也會出現${loc(d?.challenge||{})}的副作用。${planetHouseSentence(result,'mercury')}`);
      p2=zh(`所以你思考时真正要练的，不只是“想更多”，而是${loc(d?.growth||{})}。${p.retrograde?'水星逆行会让这套思考流程更常先回到内在重审，容易出现想过一次、又回来改版本的情况。':''}`,`所以你思考時真正要練的，不只是「想更多」，而是${loc(d?.growth||{})}。${p.retrograde?'水星逆行會讓這套思考流程更常先回到內在重審，容易出現想過一次、又回來改版本的情況。':''}`);
    }
    const asp=aspectNarrative(result,'mercury');
    if(!p2 && dp)p2=loc(dp.growth||{});
    return [p1,p2,asp].filter(Boolean);
  }

  function relationshipSection(result){
    const v=result.planets.venus,m=result.planets.mars,moon=result.moon;
    const vd=deepSign(v.index),md=deepSign(m.index);
    let p1,p2,p3='';
    if(lang()==='en'){
      p1=`Venus in ${signName(v.index)} wants attraction and affection to move ${loc(vd?.approach||{})}; Mars in ${signName(m.index)} pursues desire and boundaries ${loc(md?.approach||{})}. When those two styles differ, liking someone and acting on that liking may run at different speeds.`;
      p2=result.moonSignUncertain ? `The Moon changes sign during the birth date (${moonSignLabel(result)}), so long-term emotional security is intentionally left as a range rather than a fixed sign conclusion. ${planetHouseSentence(result,'venus')} ${planetHouseSentence(result,'mars')}` : `The Moon adds the emotional requirement: ${signName(moon.index)} still needs security through ${signTrait(moon.index,'approach')}. ${planetHouseSentence(result,'venus')} ${planetHouseSentence(result,'mars')}`;
    } else {
      p1=zh(`感情里要分开看“喜欢什么”与“真的怎么行动”。金星${signName(v.index)}让你在吸引、审美与关系偏好上更需要「${loc(vd?.approach||{})}」；火星${signName(m.index)}则决定靠近、争取、表达欲望与设界线时，更习惯「${loc(md?.approach||{})}」。如果两者节奏不同，就很容易出现心里有感觉，但行动方式不是同一个速度。`,`感情裡要分開看「喜歡什麼」與「真的怎麼行動」。金星${signName(v.index)}讓你在吸引、審美與關係偏好上更需要「${loc(vd?.approach||{})}」；火星${signName(m.index)}則決定靠近、爭取、表達慾望與設界線時，更習慣「${loc(md?.approach||{})}」。如果兩者節奏不同，就很容易出現心裡有感覺，但行動方式不是同一個速度。`);
      p2=result.moonSignUncertain
        ? zh(`但真正决定一段关系能不能让你待得久的，还要看月亮。由于月亮当天跨越${moonSignLabel(result)}，这里暂时只确认“心动条件、行动冲动、长期安全感必须同时有位置”，不把安全感写死成单一星座。`,`但真正決定一段關係能不能讓你待得久的，還要看月亮。由於月亮當天跨越${moonSignLabel(result)}，這裡暫時只確認「心動條件、行動衝動、長期安全感必須同時有位置」，不把安全感寫死成單一星座。`)
        : zh(`但真正决定一段关系能不能让你待得久的，还要看月亮。你的月亮${signName(moon.index)}仍然需要「${signTrait(moon.index,'approach')}」才会觉得安全。换句话说，心动条件、行动冲动、长期安全感三件事必须同时有位置，关系才不容易在某个阶段突然失衡。`,`但真正決定一段關係能不能讓你待得久的，還要看月亮。你的月亮${signName(moon.index)}仍然需要「${signTrait(moon.index,'approach')}」才會覺得安全。換句話說，心動條件、行動衝動、長期安全感三件事必須同時有位置，關係才不容易在某個階段突然失衡。`);
    }
    if(result.houses){
      const h5=result.houses.cusps[4],h7=result.houses.cusps[6],h8=result.houses.cusps[7];
      p3=lang()==='en'
        ? `House 5 begins in ${signName(h5.index)}, House 7 in ${signName(h7.index)}, and House 8 in ${signName(h8.index)}. Read together, these distinguish romance, partnership and deep sharing instead of treating them as one need.`
        : zh(`宫位再把关系拆得更细：第5宫${signName(h5.index)}描述你怎么进入心动与表达喜欢；第7宫${signName(h7.index)}描述真正的一对一关系；第8宫${signName(h8.index)}则关系到深层信任、共享与脆弱感。这三层不一定用同一种方式运作。`,`宮位再把關係拆得更細：第5宮${signName(h5.index)}描述你怎麼進入心動與表達喜歡；第7宮${signName(h7.index)}描述真正的一對一關係；第8宮${signName(h8.index)}則關係到深層信任、共享與脆弱感。這三層不一定用同一種方式運作。`);
    }
    const av=aspectNarrative(result,'venus');
    return [p1,p2,p3,av].filter(Boolean);
  }

  function driveSection(result){
    const m=result.planets.mars,md=deepSign(m.index),s=result.planets.saturn;
    let p1,p2;
    if(lang()==='en'){
      p1=`Mars in ${signName(m.index)} acts through ${loc(md?.approach||{})}. Its best expression is ${loc(md?.strength||{})}; under pressure it can become ${loc(md?.challenge||{})}. ${planetHouseSentence(result,'mars')}`;
      p2=`Saturn in ${signName(s.index)} adds the part of the chart that asks for pacing, structure and consequence. ${planetHouseSentence(result,'saturn')}`;
    } else {
      p1=zh(`火星${signName(m.index)}说明你真正要“动起来”时，最自然的方式是「${loc(md?.approach||{})}」。发挥得好时是${loc(md?.strength||{})}；被逼急时则比较容易出现${loc(md?.challenge||{})}。${planetHouseSentence(result,'mars')}`,`火星${signName(m.index)}說明你真正要「動起來」時，最自然的方式是「${loc(md?.approach||{})}」。發揮得好時是${loc(md?.strength||{})}；被逼急時則比較容易出現${loc(md?.challenge||{})}。${planetHouseSentence(result,'mars')}`);
      p2=zh(`土星${signName(s.index)}则像刹车与长期结构：它不一定让你不行动，而是会要求“这样做之后要承担什么”。${planetHouseSentence(result,'saturn')} 因此真正成熟的行动力，不是只看冲得快不快，而是火星的推进与土星的节奏能不能互相配合。`,`土星${signName(s.index)}則像煞車與長期結構：它不一定讓你不行動，而是會要求「這樣做之後要承擔什麼」。${planetHouseSentence(result,'saturn')} 因此真正成熟的行動力，不是只看衝得快不快，而是火星的推進與土星的節奏能不能互相配合。`);
    }
    return [p1,p2,aspectNarrative(result,'mars')].filter(Boolean);
  }

  function careerSection(result,analysis){
    const sun=result.sun,sat=result.planets.saturn,jup=result.planets.jupiter;
    if(!result.houses||!result.angles?.mc){
      if(lang()==='en') return [`Without an exact birth time, MC and houses are unavailable, so career interpretation stays with Sun, Jupiter and Saturn rather than pretending to know the public axis. Sun in ${signName(sun.index)}, Jupiter in ${signName(jup.index)} and Saturn in ${signName(sat.index)} describe how growth and responsibility are negotiated.`];
      return [zh(`由于出生时间未知，MC 与宫位没有被计算，所以这里不会假装知道你的事业轴。报告只保留太阳、木星与土星能确定的部分：太阳${signName(sun.index)}看你想建立什么样的自我认同，木星${signName(jup.index)}看扩张与机会，土星${signName(sat.index)}看长期建设与责任。`,`由於出生時間未知，MC 與宮位沒有被計算，所以這裡不會假裝知道你的事業軸。報告只保留太陽、木星與土星能確定的部分：太陽${signName(sun.index)}看你想建立什麼樣的自我認同，木星${signName(jup.index)}看擴張與機會，土星${signName(sat.index)}看長期建設與責任。`)];
    }
    const mc=result.angles.mc,tenth=result.houses.cusps[9];
    let p1,p2;
    if(lang()==='en'){
      p1=`MC in ${signName(mc.index)} gives the public direction a ${signTrait(mc.index,'approach')} quality. The 10th-house cusp also begins in ${signName(tenth.index)}, so credibility grows through ${signTrait(tenth.index,'strength')}.`;
      p2=`Sun in ${houseLabel(sun.house)} and Saturn in ${houseLabel(sat.house)} show where identity and long-term responsibility are actually carried. ${planetHouseSentence(result,'sun')} ${planetHouseSentence(result,'saturn')}`;
    } else {
      p1=zh(`MC 落在${signName(mc.index)}，说明你在公众角色、职业方向与“想被怎样记住”这件事上，更适合以「${signTrait(mc.index,'approach')}」这套方式来发展。第10宫宫头同样从${signName(tenth.index)}开始，因此真正能累积专业感的，不只是做得多，而是把${signTrait(tenth.index,'strength')}变成稳定可见的能力。`,`MC 落在${signName(mc.index)}，說明你在公眾角色、職業方向與「想被怎樣記住」這件事上，更適合以「${signTrait(mc.index,'approach')}」這套方式來發展。第10宮宮頭同樣從${signName(tenth.index)}開始，因此真正能累積專業感的，不只是做得多，而是把${signTrait(tenth.index,'strength')}變成穩定可見的能力。`);
      const sunArea=sun.house?houseArea(sun.house):'';
      const satArea=sat.house?houseArea(sat.house):'';
      p2=zh(`再看太阳与土星，会知道“想做什么”和“能长期扛什么”落在哪里。太阳${sun.house?`落在${houseLabel(sun.house)}，把自我认同集中到「${sunArea}」；`:''}土星${sat.house?`落在${houseLabel(sat.house)}，要求你在「${satArea}」里建立可长期维持的结构。`:''}木星${signName(jup.index)}则补充你比较容易通过什么方式放大机会：${signTrait(jup.index,'approach')}。`,`再看太陽與土星，會知道「想做什麼」和「能長期扛什麼」落在哪裡。太陽${sun.house?`落在${houseLabel(sun.house)}，把自我認同集中到「${sunArea}」；`:''}土星${sat.house?`落在${houseLabel(sat.house)}，要求你在「${satArea}」裡建立可長期維持的結構。`:''}木星${signName(jup.index)}則補充你比較容易透過什麼方式放大機會：${signTrait(jup.index,'approach')}。`);
    }
    const ruler=analysis.struct.chartRulers?.modern;
    if(ruler?.position){
      p2 += lang()==='en'
        ? ` Because ${planetName(ruler.key)} is the chart ruler, its placement in ${signName(ruler.position.index)}${ruler.position.house?` / ${houseLabel(ruler.position.house)}`:''} also describes where personal agency most often gets routed.`
        : zh(` 另外${planetName(ruler.key)}是命主星，它落在${signName(ruler.position.index)}${ruler.position.house?`、${houseLabel(ruler.position.house)}`:''}，所以你真正会主动投入、反复回到的领域，也会明显影响事业选择。`,` 另外${planetName(ruler.key)}是命主星，它落在${signName(ruler.position.index)}${ruler.position.house?`、${houseLabel(ruler.position.house)}`:''}，所以你真正會主動投入、反覆回到的領域，也會明顯影響事業選擇。`);
    }
    return [p1,p2].filter(Boolean);
  }

  function tensionSection(result,analysis){
    const hard=analysis.aspects.hard;
    if(!hard)return [ui('emptyHard')];
    const pairKey=[hard.body1,hard.body2].sort((a,b)=>PLANETS.indexOf(a)-PLANETS.indexOf(b)).join('|');
    const pair=state.synthesis?.pairThemes?.[pairKey];
    const dyn=state.synthesis?.aspectDynamics?.[hard.key];
    const p1=lang()==='en'
      ? `The clearest friction is ${planetName(hard.body1)} ${loc(aspectMeta(hard.key)?.name)} ${planetName(hard.body2)} (orb ${formatOrb(hard.orb)}). This makes ${loc(pair?.theme||{})} difficult to ignore. ${loc(dyn?.challenge||{})}`
      : zh(`这张盘最值得正视的拉扯，是${planetName(hard.body1)}${loc(aspectMeta(hard.key)?.name)}${planetName(hard.body2)}（容许度 ${formatOrb(hard.orb)}）。它会反复把「${loc(pair?.theme||{})}」带到生活里。${loc(dyn?.challenge||{})}`,`這張盤最值得正視的拉扯，是${planetName(hard.body1)}${loc(aspectMeta(hard.key)?.name)}${planetName(hard.body2)}（容許度 ${formatOrb(hard.orb)}）。它會反覆把「${loc(pair?.theme||{})}」帶到生活裡。${loc(dyn?.challenge||{})}`);
    const p2=lang()==='en'
      ? `${loc(pair?.integration||{})} ${loc(dyn?.growth||{})}`
      : zh(`真正的整合不是选一边、压掉另一边，而是「${loc(pair?.integration||{})}」。${loc(dyn?.growth||{})}`,`真正的整合不是選一邊、壓掉另一邊，而是「${loc(pair?.integration||{})}」。${loc(dyn?.growth||{})}`);
    return [p1,p2];
  }

  function strengthSection(result,analysis){
    const soft=analysis.aspects.soft;
    const dom=analysis.dominant;
    let p1,p2;
    if(soft){
      const pairKey=[soft.body1,soft.body2].sort((a,b)=>PLANETS.indexOf(a)-PLANETS.indexOf(b)).join('|');
      const pair=state.synthesis?.pairThemes?.[pairKey];
      const dyn=state.synthesis?.aspectDynamics?.[soft.key];
      p1=lang()==='en'
        ? `${planetName(soft.body1)} ${loc(aspectMeta(soft.key)?.name)} ${planetName(soft.body2)} (orb ${formatOrb(soft.orb)}) is the clearest easy-flow channel. ${loc(pair?.gift||{})} ${loc(dyn?.strength||{})}`
        : zh(`${planetName(soft.body1)}${loc(aspectMeta(soft.key)?.name)}${planetName(soft.body2)}（容许度 ${formatOrb(soft.orb)}）是目前最清楚的顺流通道。${loc(pair?.gift||{})}；${loc(dyn?.strength||{})}`,`${planetName(soft.body1)}${loc(aspectMeta(soft.key)?.name)}${planetName(soft.body2)}（容許度 ${formatOrb(soft.orb)}）是目前最清楚的順流通道。${loc(pair?.gift||{})}；${loc(dyn?.strength||{})}`);
    } else p1=ui('noSoft');
    const eg=dom.elementGift.join(lang()==='en'?', ':'、');
    const mg=dom.modalityGift.join(lang()==='en'?', ':'、');
    p2=lang()==='en'
      ? `The dominant elemental resource is ${eg}; the dominant modality adds ${mg}. These are often so natural that they are easy to underestimate.`
      : zh(`元素与模式分布也提供另一种稳定优势：最突出的元素资源是「${eg}」，模式资源是「${mg}」。这类能力通常因为太自然，反而容易被自己低估。`,`元素與模式分布也提供另一種穩定優勢：最突出的元素資源是「${eg}」，模式資源是「${mg}」。這類能力通常因為太自然，反而容易被自己低估。`);
    return [p1,p2];
  }

  function growthSection(result,analysis){
    const sat=result.planets.saturn,sd=deepSign(sat.index),sp=deepPlanet('saturn');
    const hard=analysis.aspects.hard;
    const pattern=analysis.struct.patterns?.[0];
    let p1,p2;
    if(lang()==='en'){
      p1=`Saturn in ${signName(sat.index)} is the long-term maturity marker. Its useful direction is ${loc(sd?.growth||{})}; the Saturn function itself grows through ${loc(sp?.growth||{})}. ${planetHouseSentence(result,'saturn')}`;
      p2=hard ? `Because the chart also contains a clear hard aspect, growth is not about eliminating tension but building a response that can hold both needs at once.` : `With no single hard aspect dominating, deliberate practice matters more than waiting for crisis to force change.`;
    } else {
      p1=zh(`长期成长最值得看土星。土星${signName(sat.index)}不是单纯代表“限制”，而是你需要慢慢练成稳定能力的地方。它要求的方向是「${loc(sd?.growth||{})}」，而土星本身的成熟课题是「${loc(sp?.growth||{})}」。${planetHouseSentence(result,'saturn')}`,`長期成長最值得看土星。土星${signName(sat.index)}不是單純代表「限制」，而是你需要慢慢練成穩定能力的地方。它要求的方向是「${loc(sd?.growth||{})}」，而土星本身的成熟課題是「${loc(sp?.growth||{})}」。${planetHouseSentence(result,'saturn')}`);
      p2=hard
        ? zh(`因为盘里还有明显的困难相位，所以成长不是把矛盾“修掉”，而是让两个需求同时有成熟的位置。真正有效的改变通常不是一次顿悟，而是把新的反应方式练到足够稳定。`,`因為盤裡還有明顯的困難相位，所以成長不是把矛盾「修掉」，而是讓兩個需求同時有成熟的位置。真正有效的改變通常不是一次頓悟，而是把新的反應方式練到足夠穩定。`)
        : zh(`盘里没有单一困难相位压倒其他讯号，因此你的成长更依赖主动练习，而不是等外界压力逼你改变。`,`盤裡沒有單一困難相位壓倒其他訊號，因此你的成長更依賴主動練習，而不是等外界壓力逼你改變。`);
    }
    if(pattern){
      const pm=state.synthesis?.patterns?.[pattern.type];
      if(pm){
        p2 += lang()==='en' ? ` The chart also contains ${loc(pm.name)}, whose integration task is ${loc(pm.growth)}.` : zh(` 命盘同时出现${loc(pm.name)}，它把长期整合进一步指向「${loc(pm.growth)}」。`,` 命盤同時出現${loc(pm.name)}，它把長期整合進一步指向「${loc(pm.growth)}」。`);
      }
    }
    return [p1,p2];
  }

  function closingLine(result,analysis){
    const sun=signName(result.sun.index),moon=result.moonSignUncertain?moonSignLabel(result):signName(result.moon.index),top=analysis.topPlanets[0]?.[0];
    const dom=analysis.dominant;
    const gift=[...dom.elementGift,...dom.modalityGift].filter(Boolean)[0] || signTrait(result.sun.index,'strength');
    if(lang()==='en') return `This chart works best when ${sun} curiosity/purpose and ${moon} emotional needs are not forced to compete. Let ${planetName(top)} become a conscious tool, and turn ${gift} from an automatic habit into a chosen strength.`;
    return zh(`这张盘真正要做的，不是把自己变成“更像某一个星座”，而是让太阳${sun}的方向、月亮${moon}的需要与${planetName(top)}这条强势通道彼此合作；当「${gift}」从自动反应变成你主动选择的能力，整张盘会更顺。`,`這張盤真正要做的，不是把自己變成「更像某一個星座」，而是讓太陽${sun}的方向、月亮${moon}的需要與${planetName(top)}這條強勢通道彼此合作；當「${gift}」從自動反應變成你主動選擇的能力，整張盤會更順。`);
  }

  function analyze(result){
    const struct=structure(result);
    const topPlanets=planetImportance(result,struct);
    const themes=themeScores(result,struct);
    const themeRanking=Object.entries(themes).sort((a,b)=>b[1].score-a[1].score);
    const dominant=dominantSummary(result);
    const aspects=strongestAspects(result);
    return {struct,topPlanets,themes,themeRanking,dominant,aspects};
  }

  function buildReport(result){
    const analysis=analyze(result);
    const sections=[
      {key:'overview',title:ui('overview'),paragraphs:coreOverview(result,analysis)},
      {key:'identity',title:ui('identity'),paragraphs:identitySection(result,analysis)},
      {key:'emotion',title:ui('emotion'),paragraphs:emotionSection(result,analysis)},
      {key:'mind',title:ui('mind'),paragraphs:mindSection(result,analysis)},
      {key:'relationship',title:ui('relationship'),paragraphs:relationshipSection(result,analysis)},
      {key:'drive',title:ui('drive'),paragraphs:driveSection(result,analysis)},
      {key:'career',title:ui('career'),paragraphs:careerSection(result,analysis)},
      {key:'tension',title:ui('tension'),paragraphs:tensionSection(result,analysis)},
      {key:'strength',title:ui('strength'),paragraphs:strengthSection(result,analysis)},
      {key:'growth',title:ui('growth'),paragraphs:growthSection(result,analysis)}
    ];
    return {
      engineVersion:state.framework?.version||'1.0.0',
      generatedAt:new Date().toISOString(),
      unknownTime:result.mode==='unknown-time',
      analysis,
      themeCards:analysis.themeRanking.map(([key,data])=>({
        key,
        label:state.framework?.labels?.[lang()]?.[key] || key,
        score:data.score,
        evidence:evidenceForTheme(key,result,analysis.struct)
      })),
      sections,
      closing:closingLine(result,analysis)
    };
  }

  function evidenceChip(text){ return `<span class="stellar-report-evidence-chip">${esc(text)}</span>`; }

  function renderThemeCards(report){
    const host=$('stellarThemeGrid');
    if(!host)return;
    host.innerHTML=report.themeCards.slice(0,5).map((card,index)=>`
      <article class="stellar-theme-card ${index===0?'is-primary':''}">
        <div class="stellar-theme-rank">0${index+1}</div>
        <div class="stellar-theme-head">
          <h4>${esc(card.label)}</h4>
          <strong>${card.score}</strong>
        </div>
        <div class="stellar-theme-meter"><span style="width:${card.score}%"></span></div>
        <p>${esc(ui('evidence'))}</p>
        <div class="stellar-theme-evidence">${card.evidence.slice(0,3).map(evidenceChip).join('')}</div>
      </article>`).join('');
  }

  function renderReport(report){
    const host=$('stellarReportContent');
    if(!host)return;
    const unknown=report.unknownTime ? `<div class="stellar-report-warning">${esc(ui('unknownTime'))}</div>` : '';
    const sections=report.sections.map((section,index)=>`
      <section class="stellar-report-section" data-report-section="${esc(section.key)}">
        <div class="stellar-report-section-index">${String(index+1).padStart(2,'0')}</div>
        <div class="stellar-report-section-body">
          <h3>${esc(section.title)}</h3>
          ${section.paragraphs.filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('')}
        </div>
      </section>`).join('');

    host.innerHTML=`
      ${unknown}
      <section class="stellar-report-themes">
        <div class="stellar-report-minihead">
          <div>
            <p class="panel-en">THEME PRIORITY</p>
            <h3>${esc(ui('themeTitle'))}</h3>
          </div>
          <p>${esc(ui('themeHint'))}</p>
        </div>
        <div class="stellar-theme-grid" id="stellarThemeGrid"></div>
      </section>
      <div class="stellar-report-essay">${sections}</div>
      <section class="stellar-report-closing">
        <span>✦</span>
        <div><small>${esc(ui('closing'))}</small><p>${esc(report.closing)}</p></div>
      </section>
      <footer class="stellar-report-footer">
        <span>${esc(ui('reportVersion'))}</span>
        <p>${esc(ui('symbolic'))}</p>
      </footer>`;
    renderThemeCards(report);
    $('stellarReportPanel').hidden=false;
  }

  function updatePreview(result){
    const wrap=$('stellarReportGenerator');
    if(!wrap)return;
    wrap.hidden=false;
    $('stellarReportEyebrow').textContent=ui('eyebrow');
    $('stellarReportTitle').textContent=ui('title');
    $('stellarReportIntro').textContent=ui('intro');
    $('stellarReportLocalBadge').textContent=ui('localBadge');
    $('stellarReportStableBadge').textContent=ui('deterministicBadge');
    const btn=$('generateStellarReportBtn');
    btn.querySelector('[data-label]').textContent=state.report?ui('regenerate'):ui('generate');
    const mini=$('stellarReportPreviewSignals');
    if(mini){
      const struct=structure(result);
      const top=planetImportance(result,struct).slice(0,3).map(([k])=>`${planetGlyph(k)} ${planetName(k)}`);
      mini.innerHTML=top.map(t=>`<span>${esc(t)}</span>`).join('');
    }
  }

  async function generate(){
    if(!state.result)return null;
    await ensureReady();
    const btn=$('generateStellarReportBtn');
    const label=btn?.querySelector('[data-label]');
    if(btn){btn.disabled=true; btn.classList.add('is-loading');}
    if(label)label.textContent=ui('generating');
    await new Promise(resolve=>setTimeout(resolve,280));
    const report=buildReport(state.result);
    state.report=report;
    renderReport(report);
    if(btn){btn.disabled=false; btn.classList.remove('is-loading');}
    if(label)label.textContent=ui('regenerate');
    $('stellarReportPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
    return report;
  }

  async function prepare(result){
    bind();
    state.result=result;
    state.report=null;
    const panel=$('stellarReportPanel');
    if(panel)panel.hidden=true;
    await ensureReady();
    updatePreview(result);
    return true;
  }

  function bind(){
    const btn=$('generateStellarReportBtn');
    if(btn && !btn.dataset.bound){
      btn.dataset.bound='1';
      btn.addEventListener('click',()=>generate().catch(error=>{
        console.error('[StellarInterpretation generate]',error);
        btn.disabled=false;
        btn.classList.remove('is-loading');
        const label=btn.querySelector('[data-label]');
        if(label)label.textContent=ui('generate');
      }));
    }
  }

  document.addEventListener('DOMContentLoaded',bind,{once:true});

  return {prepare,generate,buildReport,analyze};
})();
