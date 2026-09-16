(() => {
  const state = { signs:[], cities:[], meta:null, scoreConfig:null, cityA:null, cityB:null, timerA:null, timerB:null, abortA:null, abortB:null, resultA:null, resultB:null };
  const $ = id => document.getElementById(id);
  const PLANETS = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  const PLANET_NAMES = {
    sun:{'zh-CN':'太阳','zh-TW':'太陽','en':'Sun'}, moon:{'zh-CN':'月亮','zh-TW':'月亮','en':'Moon'}, mercury:{'zh-CN':'水星','zh-TW':'水星','en':'Mercury'}, venus:{'zh-CN':'金星','zh-TW':'金星','en':'Venus'}, mars:{'zh-CN':'火星','zh-TW':'火星','en':'Mars'}, jupiter:{'zh-CN':'木星','zh-TW':'木星','en':'Jupiter'}, saturn:{'zh-CN':'土星','zh-TW':'土星','en':'Saturn'}, uranus:{'zh-CN':'天王星','zh-TW':'天王星','en':'Uranus'}, neptune:{'zh-CN':'海王星','zh-TW':'海王星','en':'Neptune'}, pluto:{'zh-CN':'冥王星','zh-TW':'冥王星','en':'Pluto'}, ascendant:{'zh-CN':'上升','zh-TW':'上升','en':'Ascendant'}
  };
  const GLYPHS = {sun:'☉',moon:'☽',mercury:'☿',venus:'♀',mars:'♂',jupiter:'♃',saturn:'♄',uranus:'♅',neptune:'♆',pluto:'♇',ascendant:'ASC'};
  const ASPECTS = [
    {key:'conjunction',angle:0,symbol:'☌',normal:6,luminary:8,angleOrb:5},
    {key:'sextile',angle:60,symbol:'⚹',normal:5,luminary:6,angleOrb:4},
    {key:'square',angle:90,symbol:'□',normal:6,luminary:7,angleOrb:5},
    {key:'trine',angle:120,symbol:'△',normal:6,luminary:7,angleOrb:5},
    {key:'opposition',angle:180,symbol:'☍',normal:6,luminary:8,angleOrb:5}
  ];
  const UI = {
    'zh-CN':{brand:'星辰日记',back:'← 返回星座测算',title:'两人合盘',intro:'输入两个人的出生资料，比较彼此的太阳、月亮、上升、金星、火星与跨盘主要相位。这里不是简单的星座配对分数，而是观察两套本命盘如何互相作用。',aTitle:'A 的资料',bTitle:'B 的资料',aHint:'第一个人的出生资料',bHint:'第二个人的出生资料',name:'称呼',date:'出生日期',time:'出生时间',city:'出生城市',unknown:'不知道出生时间',unknownHint:'不知道时间仍可比较行星，但不会使用上升相关相位。',relation:'关系类型',relationHint:'同一组相位在恋爱、朋友和工作关系里，重点会不同。',calc:'开始合盘',calculating:'正在比较两张星图…',result:'你们的合盘',resultIntro:'先看两个人的核心位置，再看真正发生在两张盘之间的跨盘相位。',core:'核心吸引',coreHint:'太阳、月亮、金星、火星与上升之间的主要连结',emotion:'情绪相处',emotionHint:'月亮与太阳、金星、火星、土星等带来的情绪互动',comm:'沟通方式',commHint:'水星与思考、情绪、行动之间的跨盘连接',love:'亲密与吸引',loveHint:'金星、火星、太阳、月亮与上升相关的吸引模式',stable:'长期稳定',stableHint:'土星、木星与核心星体带来的承诺、现实与成长结构',challenge:'挑战与磨合',challengeHint:'四分、对分及较紧密的摩擦相位，不等于不适合',summary:'整体合盘摘要',summaryHint:'把支持、张力、紧密相位与关系类型一起看',method:'解读说明',methodText:'合盘使用两人的热带黄道出生盘，计算 A 星体对 B 星体以及上升点的主要跨盘相位，并依实际 orb 排序。',note:'合盘描述的是互动倾向，不是关系成败的保证；有挑战不等于不适合，和谐也不等于一定长久。',cityError:'请为两个人都选择有效城市。',dateError:'请填写两个人的出生日期。',timeError:'请填写出生时间，或勾选不知道出生时间。',engineError:'天文计算引擎未载入。',noItems:'这一类别没有落入当前主要相位容许度的跨盘相位。',support:'较流畅',tension:'需要磨合',mixed:'强烈／复合',tight:'紧密相位',all:'主要跨盘相位',unknownAsc:'出生时间未知，因此不纳入上升相位。',pair:'关系类型',corePositions:'核心五位置',supportText:'和谐相位较多，代表某些互动方式比较自然，但仍需要实际沟通与经营。',tensionText:'摩擦相位较多，关系容易互相触发；重点不是避开冲突，而是学习怎样处理差异。',balancedText:'支持与张力同时存在，关系既有自然连结，也有需要双方主动理解的部分。',tightText:'紧密相位会更有存在感，尤其 orb 小于 2° 的连接通常更容易在相处中被感受到。'},
    'zh-TW':{brand:'星辰日記',back:'← 返回星座測算',title:'兩人合盤',intro:'輸入兩個人的出生資料，比較彼此的太陽、月亮、上升、金星、火星與跨盤主要相位。這裡不是簡單的星座配對分數，而是觀察兩套本命盤如何互相作用。',aTitle:'A 的資料',bTitle:'B 的資料',aHint:'第一個人的出生資料',bHint:'第二個人的出生資料',name:'稱呼',date:'出生日期',time:'出生時間',city:'出生城市',unknown:'不知道出生時間',unknownHint:'不知道時間仍可比較行星，但不會使用上升相關相位。',relation:'關係類型',relationHint:'同一組相位在戀愛、朋友和工作關係裡，重點會不同。',calc:'開始合盤',calculating:'正在比較兩張星圖…',result:'你們的合盤',resultIntro:'先看兩個人的核心位置，再看真正發生在兩張盤之間的跨盤相位。',core:'核心吸引',coreHint:'太陽、月亮、金星、火星與上升之間的主要連結',emotion:'情緒相處',emotionHint:'月亮與太陽、金星、火星、土星等帶來的情緒互動',comm:'溝通方式',commHint:'水星與思考、情緒、行動之間的跨盤連接',love:'親密與吸引',loveHint:'金星、火星、太陽、月亮與上升相關的吸引模式',stable:'長期穩定',stableHint:'土星、木星與核心星體帶來的承諾、現實與成長結構',challenge:'挑戰與磨合',challengeHint:'四分、對分及較緊密的摩擦相位，不等於不適合',summary:'整體合盤摘要',summaryHint:'把支持、張力、緊密相位與關係類型一起看',method:'解讀說明',methodText:'合盤使用兩人的熱帶黃道出生盤，計算 A 星體對 B 星體以及上升點的主要跨盤相位，並依實際 orb 排序。',note:'合盤描述的是互動傾向，不是關係成敗的保證；有挑戰不等於不適合，和諧也不等於一定長久。',cityError:'請為兩個人都選擇有效城市。',dateError:'請填寫兩個人的出生日期。',timeError:'請填寫出生時間，或勾選不知道出生時間。',engineError:'天文計算引擎未載入。',noItems:'這一類別沒有落入目前主要相位容許度的跨盤相位。',support:'較流暢',tension:'需要磨合',mixed:'強烈／複合',tight:'緊密相位',all:'主要跨盤相位',unknownAsc:'出生時間未知，因此不納入上升相位。',pair:'關係類型',corePositions:'核心五位置',supportText:'和諧相位較多，代表某些互動方式比較自然，但仍需要實際溝通與經營。',tensionText:'摩擦相位較多，關係容易互相觸發；重點不是避開衝突，而是學習怎樣處理差異。',balancedText:'支持與張力同時存在，關係既有自然連結，也有需要雙方主動理解的部分。',tightText:'緊密相位會更有存在感，尤其 orb 小於 2° 的連結通常更容易在相處中被感受到。'},
    'en':{brand:'Stellar Diary',back:'← Back to Astrology',title:'Synastry',intro:'Enter two birth charts to compare Sun, Moon, Ascendant, Venus, Mars and the major aspects formed between the charts. This is not a simple compatibility score; it examines how two natal charts interact.',aTitle:"Person A",bTitle:"Person B",aHint:"First person's birth data",bHint:"Second person's birth data",name:'Name',date:'Birth date',time:'Birth time',city:'Birth city',unknown:'Birth time unknown',unknownHint:'Planet comparisons still work without time, but Ascendant aspects are omitted.',relation:'Relationship type',relationHint:'The same aspect can matter differently in romance, friendship or work.',calc:'Calculate synastry',calculating:'Comparing the two charts…',result:'Your synastry',resultIntro:'Start with each person’s core positions, then examine the actual cross-chart aspects between the two natal charts.',core:'Core attraction',coreHint:'Major connections among Sun, Moon, Venus, Mars and Ascendant',emotion:'Emotional dynamics',emotionHint:'Moon contacts with Sun, Venus, Mars, Saturn and related functions',comm:'Communication',commHint:'Mercury contacts with thinking, emotion and action',love:'Intimacy & attraction',loveHint:'Venus, Mars, Sun, Moon and Ascendant attraction patterns',stable:'Long-term stability',stableHint:'Saturn, Jupiter and core-planet contacts involving commitment, reality and growth',challenge:'Challenges & adjustment',challengeHint:'Squares, oppositions and tight friction aspects do not mean incompatibility',summary:'Overall synastry summary',summaryHint:'Read support, tension, tight aspects and relationship context together',method:'Reading notes',methodText:'Synastry uses both tropical natal charts and calculates major cross-chart aspects from A to B planets and available Ascendants, ranked by actual orb.',note:'Synastry describes interaction tendencies, not a guarantee of relationship success. Challenge does not mean “bad,” and harmony does not guarantee longevity.',cityError:'Choose a valid city for both people.',dateError:'Enter both birth dates.',timeError:'Enter each birth time or mark it unknown.',engineError:'The astronomy engine did not load.',noItems:'No cross-chart aspects in this category fall within the current major-aspect orbs.',support:'Supportive',tension:'Adjustment',mixed:'Strong / mixed',tight:'Tight aspects',all:'Major cross aspects',unknownAsc:'Birth time unknown, so Ascendant aspects are omitted.',pair:'Relationship type',corePositions:'Core five positions',supportText:'Supportive aspects are more numerous, suggesting some interaction patterns come naturally, though real communication and care still matter.',tensionText:'Friction aspects are more numerous, so the relationship may trigger both people more often. The task is not to avoid difference, but to learn how to handle it.',balancedText:'Support and tension coexist: there is natural connection alongside areas that require active understanding.',tightText:'Tight aspects carry more weight; contacts within about 2° are often especially noticeable in day-to-day interaction.'}
  };
  function lang(){const s=localStorage.getItem('xingchen-language');return ['zh-CN','zh-TW','en'].includes(s)?s:'zh-CN';}
  function ui(k){return UI[lang()]?.[k]??UI['zh-CN'][k]??k;}
  function loc(o){return o?.[lang()]??o?.['zh-CN']??'';}
  function esc(s){return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
  function normalize(s){return String(s||'').trim().toLowerCase();}
  function signName(i){return loc(state.signs[i].name);}
  function planetName(k){return loc(PLANET_NAMES[k]);}
  function signedDiff(a,b){return ((a-b+540)%360)-180;}
  function separation(a,b){return Math.abs(signedDiff(a,b));}
  function fmtOrb(orb){let d=Math.floor(orb),m=Math.round((orb-d)*60);if(m===60){d++;m=0;}return `${d}° ${String(m).padStart(2,'0')}′`;}
  function fmtDegree(p){let d=Math.floor(p.degree),m=Math.round((p.degree-d)*60);if(m===60){d++;m=0;}if(d===30)d=0;return `${d}° ${String(m).padStart(2,'0')}′`;}

  function updateText(){
    document.documentElement.lang=lang(); $('synBrandTitle').textContent=ui('brand');$('synBackLink').textContent=ui('back');$('synTitle').textContent=ui('title');$('synIntro').textContent=ui('intro');
    $('personATitle').textContent=ui('aTitle');$('personBTitle').textContent=ui('bTitle');$('personAHint').textContent=ui('aHint');$('personBHint').textContent=ui('bHint');
    ['A','B'].forEach(x=>{$(`name${x}Label`).textContent=ui('name');$(`date${x}Label`).textContent=ui('date');$(`time${x}Label`).textContent=ui('time');$(`city${x}Label`).textContent=ui('city');$(`unknown${x}Label`).textContent=ui('unknown');$(`unknown${x}Hint`).textContent=ui('unknownHint');$(`city${x}`).placeholder=ui('city');});
    $('relationLabel').textContent=ui('relation');$('relationHint').textContent=ui('relationHint');$('calculateSynText').textContent=ui('calc');$('synResultTitle').textContent=ui('result');$('synResultIntro').textContent=ui('resultIntro');
    const defs=[['Core','core','coreHint'],['Emotion','emotion','emotionHint'],['Comm','comm','commHint'],['Love','love','loveHint'],['Stable','stable','stableHint'],['Challenge','challenge','challengeHint'],['Summary','summary','summaryHint']];
    defs.forEach(([id,t,h])=>{$(`sec${id}Title`).textContent=ui(t);$(`sec${id}Hint`).textContent=ui(h);});
    $('synMethodTitle').textContent=ui('method');$('synMethodText').textContent=ui('methodText');$('synNote').textContent=ui('note');
    const select=$('relationshipType'); const current=select.value; select.innerHTML=Object.entries(state.meta?.relationshipLenses||{}).map(([k,v])=>`<option value="${k}">${esc(loc(v))}</option>`).join(''); if(current&&select.querySelector(`option[value="${current}"]`))select.value=current;
  }

  function cityDisplay(c){const n=c.name?.[lang()]||c.name?.en||c.name||'';const country=c.country?.[lang()]||c.country?.en||c.country||'';const parts=[n];if(c.source==='china-locations'){if(c.admin2&&normalize(c.admin2)!==normalize(n))parts.push(c.admin2);if(c.admin1&&normalize(c.admin1)!==normalize(n)&&normalize(c.admin1)!==normalize(c.admin2))parts.push(c.admin1);}else if(c.admin2||c.admin1){const a=c.admin2||c.admin1;if(normalize(a)!==normalize(n))parts.push(a);}if(country)parts.push(country);return parts.filter(Boolean).join(' · ');}
  function localMatches(q){q=normalize(q);if(q.length<2)return[];return state.cities.filter(c=>[c.id,...c.aliases,c.name['zh-CN'],c.name['zh-TW'],c.name.en].some(v=>normalize(v).includes(q))).slice(0,6);}
  function mapRemote(i){return{id:`geo-${i.id}`,name:{'zh-CN':i.name,'zh-TW':i.name,'en':i.name},country:{'zh-CN':i.country||'','zh-TW':i.country||'','en':i.country||''},admin1:i.admin1||'',lat:+i.latitude,lon:+i.longitude,timezone:i.timezone,aliases:[i.name,i.admin1||'',i.country||''].filter(Boolean)};}
  function renderCityResults(person,items){const box=$(`cityResults${person}`);if(!items.length){box.hidden=true;box.innerHTML='';return;}box.innerHTML=items.map((c,i)=>`<button type="button" class="astro-city-result" data-i="${i}"><strong>${esc(cityDisplay(c))}</strong><small>${c.lat.toFixed(4)}°, ${c.lon.toFixed(4)}° · ${esc(c.timezone)}</small></button>`).join('');box.hidden=false;box.querySelectorAll('[data-i]').forEach(b=>b.addEventListener('mousedown',e=>{e.preventDefault();selectCity(person,items[+b.dataset.i]);}));}
  function selectCity(person,c){state[`city${person}`]=c;$(`city${person}`).value=cityDisplay(c);$(`cityResults${person}`).hidden=true;$(`cityMeta${person}`).hidden=false;$(`cityMeta${person}`).textContent=`${c.lat.toFixed(4)}°, ${c.lon.toFixed(4)}° · ${c.timezone}`;}
  async function searchCity(person,q){
    const local=localMatches(q);
    let china=[],chinaExact=false;
    try{
      if(window.XingchenChinaLocation){
        [china,chinaExact]=await Promise.all([
          window.XingchenChinaLocation.search(q,20),
          window.XingchenChinaLocation.hasExactAdministrativeMatch(q)
        ]);
      }
    }catch(e){console.warn('[星辰日记] 中国出生地搜索暂不可用',e);}
    const merge=(...groups)=>{const seen=new Set(),out=[];groups.flat().forEach(c=>{const k=`${c.lat.toFixed(4)},${c.lon.toFixed(4)},${c.timezone},${normalize(cityDisplay(c))}`;if(!seen.has(k)){seen.add(k);out.push(c);}});return out;};
    let merged=merge(china,local);
    renderCityResults(person,merged.slice(0,20));
    if(chinaExact||normalize(q).length<2||!navigator.onLine)return;
    const abortKey=`abort${person}`;
    if(state[abortKey])state[abortKey].abort();
    state[abortKey]=new AbortController();
    try{
      const u=new URL('https://geocoding-api.open-meteo.com/v1/search');
      u.searchParams.set('name',q.trim());
      u.searchParams.set('count','8');
      u.searchParams.set('language',lang()==='en'?'en':'zh');
      u.searchParams.set('format','json');
      const r=await fetch(u,{signal:state[abortKey].signal});
      const d=await r.json();
      const remote=(d.results||[]).filter(i=>i.timezone).map(mapRemote);
      merged=merge(china,local,remote);
      renderCityResults(person,merged.slice(0,20));
    }catch(e){if(e.name!=='AbortError')console.warn(e);}
  }
  function setupCity(person){const input=$(`city${person}`);input.addEventListener('focus',e=>{e.target.select();if(e.target.value.trim().length>=2)searchCity(person,e.target.value);});input.addEventListener('input',e=>{state[`city${person}`]=null;$(`cityMeta${person}`).hidden=true;clearTimeout(state[`timer${person}`]);state[`timer${person}`]=setTimeout(()=>searchCity(person,e.target.value),250);});input.addEventListener('blur',()=>setTimeout(()=>$(`cityResults${person}`).hidden=true,120));input.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=$(`cityResults${person}`).querySelector('[data-i="0"]');if(first){e.preventDefault();first.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));}}});}
  function exactBuiltIn(q){q=normalize(q);return state.cities.find(c=>[c.id,...c.aliases,c.name['zh-CN'],c.name['zh-TW'],c.name.en].some(v=>normalize(v)===q))||null;}
  function personData(person){const dateInfo=window.XingchenBirthDate?.getInfo?.(`birth-${person}`)||{mode:'solar',date:$(`date${person}`).value,originalLabel:$(`date${person}`).value};const date=dateInfo?.date||'';const unknown=$(`unknown${person}`).checked,time=$(`time${person}`).value;let city=state[`city${person}`]||exactBuiltIn($(`city${person}`).value);if(!date)throw new Error(ui('dateError'));if(!unknown&&!time)throw new Error(ui('timeError'));if(!city)throw new Error(ui('cityError'));const name=$(`name${person}`).value.trim()||person;return{name,date,dateInfo,time:unknown?'12:00':time,unknown,city};}
  function anglePoint(result){return result.ascendant?{key:'ascendant',longitude:result.ascendant.longitude,index:result.ascendant.index,degree:result.ascendant.degree}:null;}
  function aspectFor(bodyA,pA,bodyB,pB){const sep=separation(pA.longitude,pB.longitude);const lum=['sun','moon'].includes(bodyA)||['sun','moon'].includes(bodyB);const angle=bodyA==='ascendant'||bodyB==='ascendant';let best=null;ASPECTS.forEach(def=>{const orb=Math.abs(sep-def.angle),limit=angle?def.angleOrb:(lum?def.luminary:def.normal);if(orb<=limit&&(!best||orb<best.orb))best={...def,orb,limit,separation:sep,bodyA,bodyB};});return best;}
  function crossAspects(a,b){const aPoints={...a.planets},bPoints={...b.planets};const aa=anglePoint(a),bb=anglePoint(b);if(aa)aPoints.ascendant=aa;if(bb)bPoints.ascendant=bb;const out=[];Object.entries(aPoints).forEach(([ka,pa])=>Object.entries(bPoints).forEach(([kb,pb])=>{const asp=aspectFor(ka,pa,kb,pb);if(asp)out.push(asp);}));return out.sort((x,y)=>x.orb-y.orb);}
  function supportive(a){return ['trine','sextile'].includes(a.key);}
  function challenging(a){return ['square','opposition'].includes(a.key);}
  function relevant(a,setA,setB){return (setA.includes(a.bodyA)&&setB.includes(a.bodyB))||(setA.includes(a.bodyB)&&setB.includes(a.bodyA));}
  function categories(aspects){const coreBodies=['sun','moon','venus','mars','ascendant'];return{
    core:aspects.filter(a=>coreBodies.includes(a.bodyA)&&coreBodies.includes(a.bodyB)),
    emotion:aspects.filter(a=>relevant(a,['moon'],['sun','moon','venus','mars','saturn','neptune','pluto'])),
    comm:aspects.filter(a=>relevant(a,['mercury'],['sun','moon','mercury','mars','saturn','uranus','neptune'])),
    love:aspects.filter(a=>relevant(a,['venus','mars'],['sun','moon','venus','mars','ascendant'])),
    stable:aspects.filter(a=>relevant(a,['saturn','jupiter'],['sun','moon','venus','mars','saturn','ascendant'])),
    challenge:aspects.filter(a=>challenging(a)||(a.key==='conjunction'&&[a.bodyA,a.bodyB].some(x=>['saturn','mars','pluto','uranus'].includes(x))))
  };}
  function lensText(type){const l=lang();const map={dating:{'zh-CN':'在恋爱／暧昧里，这更容易表现为吸引、试探、靠近速度与彼此回应。','zh-TW':'在戀愛／曖昧裡，這更容易表現為吸引、試探、靠近速度與彼此回應。','en':'In dating, this tends to show through attraction, pacing, testing the waters and responsiveness.'},couple:{'zh-CN':'在情侣关系里，这会更明显地进入日常互动、亲密感与彼此期待。','zh-TW':'在情侶關係裡，這會更明顯地進入日常互動、親密感與彼此期待。','en':'In a couple relationship, this becomes more visible through everyday interaction, intimacy and mutual expectations.'},married:{'zh-CN':'在长期伴侣关系里，重点会落到持续经营、责任分配、现实生活与共同成长。','zh-TW':'在長期伴侶關係裡，重點會落到持續經營、責任分配、現實生活與共同成長。','en':'In a long-term partnership, the emphasis shifts toward sustainability, shared responsibility, practical life and growth.'},friend:{'zh-CN':'在朋友关系里，重点更偏向信任、理解、交流方式与彼此能不能做自己。','zh-TW':'在朋友關係裡，重點更偏向信任、理解、交流方式與彼此能不能做自己。','en':'In friendship, the focus is more on trust, understanding, communication and whether both people can be themselves.'},work:{'zh-CN':'在工作关系里，重点会转向沟通效率、角色分工、决策节奏与权责边界。','zh-TW':'在工作關係裡，重點會轉向溝通效率、角色分工、決策節奏與權責界線。','en':'In work, the focus shifts toward communication efficiency, role division, decision pace and responsibility boundaries.'}};return map[type]?.[l]||map[type]?.['zh-CN']||'';}
  function aspectText(a,nA,nB,type){const themeA=loc(state.meta.bodyThemes[a.bodyA]),themeB=loc(state.meta.bodyThemes[a.bodyB]),dyn=loc(state.meta.aspectDynamics[a.key]);const pA=`${nA} 的${planetName(a.bodyA)}`,pB=`${nB} 的${planetName(a.bodyB)}`;if(lang()==='en')return `${pA} (${themeA}) and ${pB} (${themeB}) form a ${a.key}. ${dyn} ${lensText(type)}`;return `${pA}（${themeA}）与 ${pB}（${themeB}）形成${aspectName(a)}。${dyn}${lensText(type)}`;}
  function aspectName(a){const names={conjunction:{'zh-CN':'合相','zh-TW':'合相','en':'Conjunction'},sextile:{'zh-CN':'六分相','zh-TW':'六分相','en':'Sextile'},square:{'zh-CN':'四分相','zh-TW':'四分相','en':'Square'},trine:{'zh-CN':'三分相','zh-TW':'三分相','en':'Trine'},opposition:{'zh-CN':'对分相','zh-TW':'對分相','en':'Opposition'}};return loc(names[a.key]);}
  function aspectCard(a,nA,nB,type){const tone=supportive(a)?'support':challenging(a)?'tension':'mixed';return `<details class="synastry-aspect-card ${tone}"><summary><span class="syn-aspect-side"><b>${esc(nA)}</b> ${GLYPHS[a.bodyA]} ${esc(planetName(a.bodyA))}</span><span class="syn-aspect-symbol">${a.symbol}</span><span class="syn-aspect-side"><b>${esc(nB)}</b> ${GLYPHS[a.bodyB]} ${esc(planetName(a.bodyB))}</span><span class="syn-aspect-orb">${esc(aspectName(a))} · ${fmtOrb(a.orb)}</span></summary><div class="syn-aspect-body"><p>${esc(aspectText(a,nA,nB,type))}</p>${a.orb<=2?`<small>✦ ${esc(ui('tight'))}</small>`:''}</div></details>`;}
  function renderSection(id,items,nA,nB,type){$(id).innerHTML=items.length?items.map(a=>aspectCard(a,nA,nB,type)).join(''):`<p class="astro-section-unavailable">${esc(ui('noItems'))}</p>`;}
  function corePositionHtml(result){const keys=['sun','moon','venus','mars'];const rows=keys.map(k=>`<div class="syn-core-row"><span>${GLYPHS[k]} ${esc(planetName(k))}</span><strong>${esc(signName(result.planets[k].index))}</strong><small>${fmtDegree(result.planets[k])}</small></div>`);if(result.ascendant)rows.push(`<div class="syn-core-row"><span>ASC ${esc(planetName('ascendant'))}</span><strong>${esc(signName(result.ascendant.index))}</strong><small>${fmtDegree(result.ascendant)}</small></div>`);else rows.push(`<div class="syn-core-row is-muted"><span>ASC ${esc(planetName('ascendant'))}</span><strong>—</strong><small>${esc(ui('unknownAsc'))}</small></div>`);return rows.join('');}
  function renderSummary(aspects,nA,nB,type){const support=aspects.filter(supportive).length,tension=aspects.filter(challenging).length,tight=aspects.filter(a=>a.orb<=2).length;let main=support>tension+2?ui('supportText'):tension>support+2?ui('tensionText'):ui('balancedText');const tightSentence=tight?` ${ui('tightText')}`:'';const top=aspects.slice(0,5).map(a=>`${GLYPHS[a.bodyA]}${a.symbol}${GLYPHS[a.bodyB]} ${fmtOrb(a.orb)}`).join(' · ');$('synSummary').innerHTML=`<div class="syn-summary-stats"><span>${ui('support')} <b>${support}</b></span><span>${ui('tension')} <b>${tension}</b></span><span>${ui('tight')} <b>${tight}</b></span><span>${ui('all')} <b>${aspects.length}</b></span></div><p>${esc(main+tightSentence)}</p><p>${esc(lensText(type))}</p>${top?`<div class="syn-tight-line"><strong>${esc(ui('tight'))}</strong><span>${esc(top)}</span></div>`:''}`;}
  function renderOverview(aspects,type){const support=aspects.filter(supportive).length,tension=aspects.filter(challenging).length,mixed=aspects.length-support-tension,tight=aspects.filter(a=>a.orb<=2).length;$('synOverview').innerHTML=`<div><span>${esc(ui('pair'))}</span><strong>${esc(loc(state.meta.relationshipLenses[type]))}</strong></div><div><span>${esc(ui('support'))}</span><strong>${support}</strong></div><div><span>${esc(ui('tension'))}</span><strong>${tension}</strong></div><div><span>${esc(ui('mixed'))}</span><strong>${mixed}</strong></div><div><span>${esc(ui('tight'))}</span><strong>${tight}</strong></div>`;}

  function sortedPairKey(a,b){
    return [a,b].sort().join('|');
  }

  function pairImportance(a,b){
    return state.scoreConfig.pairWeights[sortedPairKey(a,b)] || 0.72;
  }

  function orbStrength(aspect){
    const ratio=Math.max(0,Math.min(1,aspect.orb/aspect.limit));
    const floor=state.scoreConfig.orbModel.floor;
    const exponent=state.scoreConfig.orbModel.exponent;
    return floor+(1-floor)*Math.pow(1-ratio,exponent);
  }

  function conjunctionValence(bodyA,bodyB,dimension){
    const pair=sortedPairKey(bodyA,bodyB);
    const positive=new Set([
      'moon|sun','moon|moon','sun|venus','moon|venus','mars|venus',
      'mercury|mercury','jupiter|sun','jupiter|moon','jupiter|venus',
      'ascendant|venus','ascendant|sun'
    ]);
    const intense=new Set([
      'mars|moon','mars|saturn','moon|pluto','pluto|venus',
      'mars|pluto','saturn|sun','moon|saturn','saturn|venus',
      'mars|uranus','moon|uranus'
    ]);

    if(positive.has(pair)){
      if(dimension==='attraction' && ['mars|venus','ascendant|venus'].includes(pair)) return 0.92;
      return 0.78;
    }

    if(intense.has(pair)){
      if(dimension==='attraction' && ['mars|moon','pluto|venus','mars|pluto'].includes(pair)) return 0.45;
      if(dimension==='stability' && ['saturn|sun','moon|saturn','saturn|venus'].includes(pair)) return 0.22;
      if(dimension==='growth') return 0.12;
      return -0.32;
    }

    if(bodyA==='jupiter'||bodyB==='jupiter') return 0.62;
    if(bodyA==='saturn'||bodyB==='saturn') return dimension==='stability'?0.18:-0.12;
    if(bodyA==='neptune'||bodyB==='neptune') return dimension==='attraction'?0.28:-0.08;
    if(bodyA==='uranus'||bodyB==='uranus') return dimension==='growth'?0.34:-0.06;
    if(bodyA==='pluto'||bodyB==='pluto') return dimension==='growth'?0.28:-0.18;
    return 0.20;
  }

  function aspectValence(aspect,dimension){
    if(aspect.key==='conjunction') return conjunctionValence(aspect.bodyA,aspect.bodyB,dimension);

    let base=state.scoreConfig.aspectBase[aspect.key] || 0;

    // Some tension aspects are highly activating rather than purely negative in attraction/growth.
    const pair=sortedPairKey(aspect.bodyA,aspect.bodyB);
    if(dimension==='attraction' && ['mars|venus','mars|moon','pluto|venus','ascendant|mars','ascendant|venus'].includes(pair)){
      if(['square','opposition'].includes(aspect.key)) base=Math.max(base,-0.28);
    }
    if(dimension==='growth' && ['square','opposition'].includes(aspect.key)){
      base=Math.max(base,-0.42);
    }
    if(dimension==='stability' && (aspect.bodyA==='saturn'||aspect.bodyB==='saturn')){
      if(['trine','sextile'].includes(aspect.key)) base=Math.min(1,base+0.10);
    }
    return base;
  }

  function dimensionMembership(dimension,aspect){
    const a=aspect.bodyA,b=aspect.bodyB;
    const pair=[a,b];

    const has=(x)=>pair.includes(x);
    const hasAny=(arr)=>arr.some(has);

    if(dimension==='emotion'){
      return has('moon') && hasAny(['sun','moon','venus','mars','saturn','neptune','pluto']);
    }
    if(dimension==='communication'){
      return has('mercury') && hasAny(['sun','moon','mercury','venus','mars','saturn','uranus','neptune']);
    }
    if(dimension==='attraction'){
      return (hasAny(['venus','mars']) && hasAny(['sun','moon','venus','mars','ascendant','pluto']))
        || (has('ascendant') && hasAny(['sun','moon','venus','mars']));
    }
    if(dimension==='stability'){
      return hasAny(['saturn','jupiter']) && hasAny(['sun','moon','venus','mars','saturn','ascendant']);
    }
    if(dimension==='growth'){
      return hasAny(['jupiter','saturn','uranus','pluto']) && hasAny(['sun','moon','mercury','venus','mars','ascendant']);
    }
    return false;
  }

  function scoreDimension(dimension,aspects){
    const relevant=aspects.filter(a=>dimensionMembership(dimension,a));
    if(!relevant.length) return {score:50,positive:0,negative:0,evidence:0,items:[]};

    let signed=0,totalWeight=0,positive=0,negative=0;
    const items=[];

    relevant.forEach(a=>{
      const importance=pairImportance(a.bodyA,a.bodyB);
      const strength=orbStrength(a);
      const valence=aspectValence(a,dimension);
      const weight=importance*strength;
      const contribution=valence*weight;

      signed+=contribution;
      totalWeight+=weight;
      if(contribution>0) positive+=contribution;
      if(contribution<0) negative+=Math.abs(contribution);
      items.push({...a,importance,strength,valence,contribution});
    });

    const buffer=state.scoreConfig.scoreModel.confidenceBuffer;
    const normalized=signed/(totalWeight+buffer);
    const raw=state.scoreConfig.scoreModel.neutralBaseline
      + state.scoreConfig.scoreModel.scale*normalized;
    const score=Math.max(0,Math.min(100,Math.round(raw)));

    return {score,positive,negative,evidence:totalWeight,items};
  }

  function calculateCompatibility(aspects,relationshipType){
    const dimensions=['emotion','communication','attraction','stability','growth'];
    const results={};
    dimensions.forEach(d=>results[d]=scoreDimension(d,aspects));

    const weights=state.scoreConfig.relationshipWeights[relationshipType]
      || state.scoreConfig.relationshipWeights.couple;

    const total=dimensions.reduce((sum,d)=>sum+results[d].score*weights[d],0)/100;
    return {
      score:Math.max(0,Math.min(100,Math.round(total))),
      dimensions:results,
      weights
    };
  }

  function scoreBand(score){
    const l=lang();
    const bands=[
      {min:90,cn:'高度合拍',tw:'高度合拍',en:'Highly compatible'},
      {min:75,cn:'很有默契',tw:'很有默契',en:'Strong natural fit'},
      {min:60,cn:'有吸引，也有磨合',tw:'有吸引，也有磨合',en:'Connection with adjustment'},
      {min:45,cn:'互补型关系',tw:'互補型關係',en:'Complementary / mixed'},
      {min:30,cn:'磨合度较高',tw:'磨合度較高',en:'High adjustment required'},
      {min:0, cn:'高度挑战型',tw:'高度挑戰型',en:'Highly challenging'}
    ];
    const band=bands.find(b=>score>=b.min) || bands[bands.length-1];
    return l==='en'?band.en:(l==='zh-TW'?band.tw:band.cn);
  }

  function scoreSummaryText(comp){
    const vals=Object.entries(comp.dimensions).sort((a,b)=>b[1].score-a[1].score);
    const high=vals[0], low=vals[vals.length-1];
    const name=d=>loc(state.scoreConfig.dimensions[d]);
    if(lang()==='en'){
      return `${name(high[0])} is the strongest natural area (${high[1].score}), while ${name(low[0])} asks for more adjustment (${low[1].score}). Read the number as an interaction index, not a prediction of relationship success.`;
    }
    const trad=lang()==='zh-TW';
    return `${name(high[0])}是目前最自然的區域（${high[1].score}），而${name(low[0])}需要較多磨合（${low[1].score}）。這個數字代表互動順暢度，不是${trad?'關係成功率':'关系成功率'}。`;
  }

  function renderCompatibility(comp,relationshipType){
    $('compatibilityScore').textContent=String(comp.score);
    $('compatibilityRing').style.setProperty('--score',String(comp.score));
    $('compatibilityBand').textContent=scoreBand(comp.score);
    $('compatibilitySummary').textContent=scoreSummaryText(comp);
    $('compatibilityDisclaimer').textContent=loc(state.scoreConfig.note);

    const dims=['emotion','communication','attraction','stability','growth'];
    $('dimensionScores').innerHTML=dims.map(d=>{
      const item=comp.dimensions[d];
      return `<div class="syn-dimension-card">
        <div><span>${esc(loc(state.scoreConfig.dimensions[d]))}</span><strong>${item.score}</strong></div>
        <div class="syn-dimension-track"><i style="width:${item.score}%"></i></div>
        <small>${lang()==='en'?'Weight':'权重'} ${comp.weights[d]}%</small>
      </div>`;
    }).join('');

    const relName=loc(state.meta.relationshipLenses[relationshipType]);
    $('compatibilityLabel').textContent=lang()==='en'?'Compatibility Index':(lang()==='zh-TW'?'合拍指數':'合拍指数');
    $('scoreMethodTitle').textContent=lang()==='en'?'How the score is calculated':(lang()==='zh-TW'?'計分依據':'计分依据');
    $('scoreMethodIntro').textContent=lang()==='en'
      ? `The ${relName} profile uses five dimensions. Each accepted cross-chart aspect is weighted by planet pair importance, aspect type and orb strength.`
      : `${relName}模式会使用五个维度。每一个成立的跨盘相位都会依「行星组合重要度 × 相位性质 × orb 紧密度」计算影响。`;

    $('relationshipWeightGrid').innerHTML=dims.map(d=>`<span><b>${esc(loc(state.scoreConfig.dimensions[d]))}</b>${comp.weights[d]}%</span>`).join('');

    $('scoreOrbNote').textContent=lang()==='en'
      ? 'Orb rule: the closer an aspect is to exact (0° orb), the stronger its contribution. As it approaches the accepted orb limit, its influence gradually weakens.'
      : 'Orb 规则：越接近精确相位（0° orb），影响越强；越接近容许度上限，影响会逐步下降。';

    $('scoreConjunctionNote').textContent=lang()==='en'
      ? 'Conjunctions are not automatically positive. Venus–Mars, Sun–Moon and similar contacts can add ease or attraction, while Saturn, Pluto, Mars or Uranus conjunctions may add intensity, responsibility or friction depending on the scoring dimension.'
      : '合相不会一律加分：金星－火星、太阳－月亮等可增加亲密或协调；土星、冥王星、火星、天王星的合相则会依不同维度加入责任、强度或磨合压力。';
  }

  async function calculate(){
    $('synError').hidden=true;try{if(!window.Astronomy||!window.XingchenAstrologyEngine)throw new Error(ui('engineError'));const A=personData('A'),B=personData('B'),type=$('relationshipType').value;$('calculateSynBtn').disabled=true;$('calculateSynText').textContent=ui('calculating');state.resultA=XingchenAstrologyEngine.calculate({date:A.date,time:A.time,city:A.city,unknownTime:A.unknown});state.resultB=XingchenAstrologyEngine.calculate({date:B.date,time:B.time,city:B.city,unknownTime:B.unknown});const aspects=crossAspects(state.resultA,state.resultB),cats=categories(aspects),compatibility=calculateCompatibility(aspects,type);renderCompatibility(compatibility,type);$('coreAName').textContent=A.name;$('coreBName').textContent=B.name;$('coreA').innerHTML=corePositionHtml(state.resultA);$('coreB').innerHTML=corePositionHtml(state.resultB);$('pairChip').textContent=`${A.name} × ${B.name} · ${loc(state.meta.relationshipLenses[type])}`;renderOverview(aspects,type);renderSection('secCore',cats.core,A.name,B.name,type);renderSection('secEmotion',cats.emotion,A.name,B.name,type);renderSection('secComm',cats.comm,A.name,B.name,type);renderSection('secLove',cats.love,A.name,B.name,type);renderSection('secStable',cats.stable,A.name,B.name,type);renderSection('secChallenge',cats.challenge,A.name,B.name,type);renderSummary(aspects,A.name,B.name,type);$('synResult').hidden=false;requestAnimationFrame(()=>$('synResult').scrollIntoView({behavior:'smooth',block:'start'}));}catch(e){console.error(e);$('synError').textContent=e.message||String(e);$('synError').hidden=false;}finally{$('calculateSynBtn').disabled=false;$('calculateSynText').textContent=ui('calc');}}
  async function init(){
    const max=new Date().toISOString().slice(0,10);$('dateA').max=max;$('dateB').max=max;try{const[sr,cr,mr,scoreR]=await Promise.all([fetch('../data/astrology/signs.json',{cache:'no-store'}),fetch('../data/astrology/cities.json',{cache:'no-store'}),fetch('../data/astrology/synastry-interpretations.json',{cache:'no-store'}),fetch('../data/astrology/compatibility-score.json',{cache:'no-store'})]);const s=await sr.json(),c=await cr.json(),m=await mr.json(),score=await scoreR.json();state.signs=s.signs;state.cities=c.cities;state.meta=m;state.scoreConfig=score;updateText();}catch(e){console.error(e);$('synError').textContent='Synastry data could not be loaded.';$('synError').hidden=false;}setupCity('A');setupCity('B');['A','B'].forEach(x=>$(`unknown${x}`).addEventListener('change',()=>{$(`time${x}`).disabled=$(`unknown${x}`).checked;}));$('calculateSynBtn').addEventListener('click',calculate);
  }
  document.addEventListener('DOMContentLoaded',init);
})();