(() => {
  const state = {
    signs: [],
    elements: {},
    modalities: {},
    cities: [],
    interpretations: {},
    selectedCity: null,
    citySearchTimer: null,
    citySearchAbort: null,
    lastResult: null,
    lastReportPayload: null
  };
  const $ = id => document.getElementById(id);

  const UI = {
    'zh-CN': {
      brand:'星辰日记', back:'返回首页', title:'本命星盘', synastryEntry:'两人合盘',
      intro:'输入出生年月日、出生时间与出生地，计算你的太阳、月亮与上升星座。这里不是用生日查表，而是根据出生瞬间的天体位置与当地地平线计算。',
      date:'出生日期', time:'出生时间', city:'出生城市', cityPlaceholder:'省份／城市／区县',
      unknown:'不知道出生时间', unknownNote:'不知道时间时仍可计算太阳；月亮会检查当天是否跨星座，上升则无法精确计算。',
      cityHint:'可输入省份、城市或区县，例如：福建、泉州、晋江、长沙、Hamburg；中国地区会优先使用完整市／区县资料。',
      manual:'找不到城市？手动输入坐标', lat:'纬度', lon:'经度', timezone:'IANA 时区',
      calc:'开始测算', calculating:'正在读取星辰位置…',
      resultTitle:'你的核心三要素', resultIntro:'太阳看核心认同与创造意志；月亮看情绪需要与安全感；上升看你面对世界的自然方式与第一反应。',
      sun:'太阳', moon:'月亮', asc:'上升',
      sunRole:'核心自我', moonRole:'情绪与安全感', ascRole:'外在方式与第一反应',
      unavailable:'无法计算', unknownAsc:'需要准确出生时间才能计算上升。',
      approximate:'出生时间未知，度数以当地中午作为近似值。',
      moonUncertain:'月亮在这一天发生跨星座；没有出生时间时无法确认最终月亮星座。',
      moonSame:'月亮当天没有跨星座；星座可作为较可靠参考，但度数仍为中午近似。',
      exact:'依出生时间与地点精确计算',
      summary:'三要素摘要', elementHarmony:'元素呼应', elementMix:'元素组合',
      method:'计算说明', methodText:'采用热带黄道。太阳与月亮位置由 Astronomy Engine 计算；上升由当地恆星时、纬度与黄赤交角计算。',
      interpretiveNote:'占星解读属于传统／象征性解释，不是科学的人格诊断或未来预测。',
      cityError:'请输入城市并从搜索结果中选择，或启用手动坐标。',
      dateError:'请填写出生日期。',
      timeError:'请填写出生时间，或勾选「不知道出生时间」。',
      manualError:'请填写有效纬度、经度与 IANA 时区。',
      engineError:'天文计算引擎未载入，请确认网络可访问后重新整理页面。',
      degreeApprox:'约', localBirth:'当地出生时间', timezoneLabel:'时区',
      fire:'火象', earth:'土象', air:'风象', water:'水象',
      sameSunMoon:'太阳与月亮落在同一星座，核心意志与情绪需要较容易朝同一个方向运作。',
      sameElement:'太阳、月亮、上升里有明显的同元素呼应，某种反应方式会特别自然。',
      mixedElements:'三个位置落在不同元素，代表你会在核心、情绪与外在应对之间切换不同模式；这通常带来更丰富的适应性，也需要学会整合彼此不同的需求。'
    },
    'zh-TW': {
      brand:'星辰日記', back:'返回首頁', title:'本命星盤', synastryEntry:'兩人合盤',
      intro:'輸入出生年月日、出生時間與出生地，計算你的太陽、月亮與上升星座。這裡不是用生日查表，而是根據出生瞬間的天體位置與當地地平線計算。',
      date:'出生日期', time:'出生時間', city:'出生城市', cityPlaceholder:'省份／城市／區縣',
      unknown:'不知道出生時間', unknownNote:'不知道時間時仍可計算太陽；月亮會檢查當天是否跨星座，上升則無法精確計算。',
      cityHint:'可輸入省份、城市或區縣，例如：福建、泉州、晉江、長沙、Hamburg；中國地區會優先使用完整市／區縣資料。',
      manual:'找不到城市？手動輸入座標', lat:'緯度', lon:'經度', timezone:'IANA 時區',
      calc:'開始測算', calculating:'正在讀取星辰位置…',
      resultTitle:'你的核心三要素', resultIntro:'太陽看核心認同與創造意志；月亮看情緒需要與安全感；上升看你面對世界的自然方式與第一反應。',
      sun:'太陽', moon:'月亮', asc:'上升',
      sunRole:'核心自我', moonRole:'情緒與安全感', ascRole:'外在方式與第一反應',
      unavailable:'無法計算', unknownAsc:'需要準確出生時間才能計算上升。',
      approximate:'出生時間未知，度數以當地中午作為近似值。',
      moonUncertain:'月亮在這一天發生跨星座；沒有出生時間時無法確認最終月亮星座。',
      moonSame:'月亮當天沒有跨星座；星座可作為較可靠參考，但度數仍為中午近似。',
      exact:'依出生時間與地點精確計算',
      summary:'三要素摘要', elementHarmony:'元素呼應', elementMix:'元素組合',
      method:'計算說明', methodText:'採用熱帶黃道。太陽與月亮位置由 Astronomy Engine 計算；上升由當地恆星時、緯度與黃赤交角計算。',
      interpretiveNote:'占星解讀屬於傳統／象徵性解釋，不是科學的人格診斷或未來預測。',
      cityError:'請輸入城市並從搜尋結果中選擇，或啟用手動座標。',
      dateError:'請填寫出生日期。',
      timeError:'請填寫出生時間，或勾選「不知道出生時間」。',
      manualError:'請填寫有效緯度、經度與 IANA 時區。',
      engineError:'天文計算引擎未載入，請確認網路可存取後重新整理頁面。',
      degreeApprox:'約', localBirth:'當地出生時間', timezoneLabel:'時區',
      fire:'火象', earth:'土象', air:'風象', water:'水象',
      sameSunMoon:'太陽與月亮落在同一星座，核心意志與情緒需要較容易朝同一個方向運作。',
      sameElement:'太陽、月亮、上升裡有明顯的同元素呼應，某種反應方式會特別自然。',
      mixedElements:'三個位置落在不同元素，代表你會在核心、情緒與外在應對之間切換不同模式；這通常帶來更豐富的適應性，也需要學會整合彼此不同的需求。'
    },
    'en': {
      brand:'Stellar Diary', back:'Home', title:'Natal Chart', synastryEntry:'Synastry',
      intro:'Enter birth date, time and place to calculate your Sun, Moon and Ascendant. This is not a birthday lookup: it uses astronomical positions for the birth moment and the local horizon.',
      date:'Birth date', time:'Birth time', city:'Birth city', cityPlaceholder:'Province / city / district',
      unknown:'I do not know the birth time', unknownNote:'Without a birth time, the Sun can still be calculated; the Moon is checked for a sign change during the day, while the Ascendant cannot be calculated precisely.',
      cityHint:'Type a city such as Hamburg, Changsha or Beijing; the site will find its coordinates and time zone automatically.',
      manual:'City not listed? Enter coordinates manually', lat:'Latitude', lon:'Longitude', timezone:'IANA time zone',
      calc:'Calculate', calculating:'Reading the sky…',
      resultTitle:'Your Core Three', resultIntro:'The Sun describes central identity and creative will; the Moon describes emotional needs and security; the Ascendant describes your natural approach to the world and first reactions.',
      sun:'Sun', moon:'Moon', asc:'Ascendant',
      sunRole:'Core self', moonRole:'Emotion & security', ascRole:'Outer approach & first reaction',
      unavailable:'Unavailable', unknownAsc:'An accurate birth time is required for the Ascendant.',
      approximate:'Birth time unknown; degree shown is an approximate local-noon position.',
      moonUncertain:'The Moon changed signs during this civil day. Without a birth time, the Moon sign cannot be determined.',
      moonSame:'The Moon stayed in the same sign throughout the day; the sign is a useful reference, though the degree is still a noon approximation.',
      exact:'Calculated from birth time and location',
      summary:'Core-three summary', elementHarmony:'Element echo', elementMix:'Element mix',
      method:'Calculation notes', methodText:'Uses the tropical zodiac. Sun and Moon positions are calculated by Astronomy Engine; the Ascendant uses local sidereal time, latitude and the obliquity of the ecliptic.',
      interpretiveNote:'Astrological interpretations are traditional/symbolic and are not scientific personality diagnosis or future prediction.',
      cityError:'Type a city and choose a search result, or enable manual coordinates.',
      dateError:'Enter a birth date.',
      timeError:'Enter a birth time, or select “I do not know the birth time”.',
      manualError:'Enter a valid latitude, longitude and IANA time zone.',
      engineError:'The astronomy engine did not load. Check your internet connection and reload.',
      degreeApprox:'approx.', localBirth:'Local birth time', timezoneLabel:'Time zone',
      fire:'Fire', earth:'Earth', air:'Air', water:'Water',
      sameSunMoon:'Sun and Moon share the same sign, so core will and emotional needs can more easily move in the same direction.',
      sameElement:'Two or more of the core three share an element, making that style of response especially natural.',
      mixedElements:'The three positions use different elemental styles. This can increase adaptability, while also asking you to integrate different needs between identity, emotion and outward response.'
    }
  };

  function lang() {
    const saved = localStorage.getItem('xingchen-language');
    return ['zh-CN','zh-TW','en'].includes(saved) ? saved : 'zh-CN';
  }
  function ui(k){ return UI[lang()]?.[k] ?? UI['zh-CN'][k] ?? k; }
  function loc(obj){ return obj?.[lang()] ?? obj?.['zh-CN'] ?? ''; }
  function esc(s){ return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;"); }

  function signMeta(index){ return state.signs[index]; }
  function signName(index){ return loc(signMeta(index).name); }
  function interpretation(index, role){ return state.interpretations[signMeta(index).key]?.[role]?.[lang()] ?? ''; }

  function formatDegree(position, approximate=false) {
    let deg = Math.floor(position.degree);
    let min = Math.round((position.degree - deg) * 60);
    if (min === 60) { deg += 1; min = 0; }
    if (deg === 30) deg = 0;
    return `${approximate ? ui('degreeApprox') + ' ' : ''}${deg}° ${String(min).padStart(2,'0')}′`;
  }

  function cityLabel(city) {
    return `${loc(city.name)} · ${city.name.en}`;
  }

  function normalize(s){ return String(s||'').trim().toLowerCase(); }

  function findCity(input) {
    const q = normalize(input);
    if (!q) return null;
    return state.cities.find(city => {
      const values = [city.id, ...city.aliases, city.name['zh-CN'], city.name['zh-TW'], city.name.en, cityLabel(city)];
      return values.some(v => normalize(v) === q);
    }) || null;
  }

  function displayCityName(city) {
    const name = city.name?.[lang()] || city.name?.en || city.name || '';
    const country = city.country?.[lang()] || city.country?.en || city.country || '';
    const pieces = [name];

    if (city.source === 'china-locations') {
      if (city.admin2 && normalize(city.admin2) !== normalize(name)) pieces.push(city.admin2);
      if (city.admin1 && normalize(city.admin1) !== normalize(name) && normalize(city.admin1) !== normalize(city.admin2)) pieces.push(city.admin1);
    } else {
      const admin = city.admin2 || city.admin1 || '';
      if (admin && normalize(admin) !== normalize(name)) pieces.push(admin);
    }

    if (country) pieces.push(country);
    return pieces.filter(Boolean).join(' · ');
  }

  function builtInMatches(query, limit=6) {
    const q = normalize(query);
    if (q.length < 2) return [];
    return state.cities.filter(city => {
      const values = [
        city.id, ...city.aliases,
        city.name['zh-CN'], city.name['zh-TW'], city.name.en,
        city.country['zh-CN'], city.country.en
      ];
      return values.some(v => normalize(v).includes(q));
    }).slice(0, limit);
  }

  function geocodingLanguage() {
    return lang() === 'en' ? 'en' : 'zh';
  }

  function mapRemoteCity(item) {
    const nativeName = item.name || '';
    const country = item.country || '';
    return {
      id: `geo-${item.id}`,
      name: {'zh-CN':nativeName, 'zh-TW':nativeName, 'en':nativeName},
      country: {'zh-CN':country, 'zh-TW':country, 'en':country},
      admin1: item.admin1 || '',
      admin2: item.admin2 || '',
      lat: Number(item.latitude),
      lon: Number(item.longitude),
      timezone: item.timezone,
      aliases: [nativeName, item.admin1 || '', country].filter(Boolean),
      source: 'open-meteo'
    };
  }

  function mobileCityPicker() {
    return window.matchMedia?.('(max-width: 760px)').matches ?? false;
  }

  function cityFieldElement() {
    return $('birthCity')?.closest('.astro-city-field');
  }

  function ensureCityPickerClose() {
    const field = cityFieldElement();
    if (!field || field.querySelector('[data-city-picker-close]')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'city-picker-close';
    button.dataset.cityPickerClose = '';
    button.textContent = lang() === 'en' ? 'Close' : (lang() === 'zh-TW' ? '關閉' : '关闭');
    button.addEventListener('click', () => closeCityPicker(true));
    field.insertBefore(button, field.querySelector('.astro-city-search'));
  }

  function openCityPicker() {
    if (!mobileCityPicker()) return;
    ensureCityPickerClose();
    const field = cityFieldElement();
    if (!field) return;
    field.classList.add('is-picker-open');
    document.body.classList.add('city-picker-active');
  }

  function closeCityPicker(hideResults=false) {
    const field = cityFieldElement();
    field?.classList.remove('is-picker-open');
    document.body.classList.remove('city-picker-active');

    if (hideResults) {
      $('cityResults').hidden = true;
      $('cityResults').innerHTML = '';
    }
    $('birthCity')?.blur();
  }

  function renderCityResults(results, preserveScroll=false) {
    const box = $('cityResults');
    const previousScrollTop = preserveScroll ? box.scrollTop : 0;

    if (!results.length) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }

    box.innerHTML = results.map((city, index) => `
      <button type="button" class="astro-city-result" data-city-result="${index}">
        <strong>${esc(displayCityName(city))}</strong>
        <small>${city.lat.toFixed(4)}°, ${city.lon.toFixed(4)}° · ${esc(city.timezone)}</small>
      </button>
    `).join('');
    box.hidden = false;

    if (preserveScroll && previousScrollTop > 0) {
      requestAnimationFrame(() => { box.scrollTop = previousScrollTop; });
    }

    box.querySelectorAll('[data-city-result]').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        selectCity(results[Number(button.dataset.cityResult)]);
      });
    });
  }

  function selectCity(city) {
    state.selectedCity = city;
    $('birthCity').value = displayCityName(city);
    $('cityResults').hidden = true;
    $('cityResults').innerHTML = '';
    $('citySelectedMeta').hidden = false;
    $('citySelectedMeta').textContent =
      `${city.lat.toFixed(4)}°, ${city.lon.toFixed(4)}° · ${city.timezone}`;
    closeCityPicker(true);
  }

  async function searchCities(query) {
    const rawQuery = String(query || '').trim();
    const normalizedQuery = normalize(rawQuery);

    if (normalizedQuery.length < 2) {
      renderCityResults([]);
      return;
    }

    const seq = (state.citySearchSeq || 0) + 1;
    state.citySearchSeq = seq;

    const exactLocal = findCity(rawQuery);
    const local = builtInMatches(rawQuery, 8);

    if (exactLocal) {
      const ordered = [exactLocal, ...local.filter(city => city.id !== exactLocal.id)];
      if (seq === state.citySearchSeq &&
          normalize($('birthCity').value) === normalizedQuery) {
        renderCityResults(ordered.slice(0,8));
      }
      return;
    }

    let china = [];
    let chinaExact = false;

    try {
      if (window.XingchenChinaLocation) {
        [china, chinaExact] = await Promise.all([
          window.XingchenChinaLocation.search(rawQuery, 20),
          window.XingchenChinaLocation.hasExactAdministrativeMatch(rawQuery)
        ]);
      }
    } catch (error) {
      console.warn('[星辰日记] 中国出生地搜索暂不可用', error);
    }

    if (seq !== state.citySearchSeq ||
        normalize($('birthCity').value) !== normalizedQuery) return;

    const mergeUnique = (...groups) => {
      const out = [];
      const seen = new Set();
      groups.flat().forEach(city => {
        const key = `${city.lat.toFixed(4)},${city.lon.toFixed(4)},${city.timezone},${normalize(displayCityName(city))}`;
        if (!seen.has(key)) {
          seen.add(key);
          out.push(city);
        }
      });
      return out;
    };

    let merged = mergeUnique(china,local);
    renderCityResults(merged.slice(0,20), true);

    if (chinaExact || !navigator.onLine) return;

    if (state.citySearchAbort) state.citySearchAbort.abort();
    state.citySearchAbort = new AbortController();

    try {
      const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
      url.searchParams.set('name', rawQuery);
      url.searchParams.set('count', '8');
      url.searchParams.set('language', geocodingLanguage());
      url.searchParams.set('format', 'json');

      const response = await fetch(url, {signal:state.citySearchAbort.signal});
      if (!response.ok) throw new Error(`Geocoding HTTP ${response.status}`);
      const data = await response.json();

      if (seq !== state.citySearchSeq ||
          normalize($('birthCity').value) !== normalizedQuery) return;

      const remote = (data.results || [])
        .filter(item => item.latitude != null && item.longitude != null && item.timezone)
        .map(mapRemoteCity);

      merged = mergeUnique(china,local,remote);
      renderCityResults(merged.slice(0,20), true);
    } catch(error) {
      if (error.name !== 'AbortError') console.warn(error);
    }
  }

  function scheduleCitySearch(query) {
    clearTimeout(state.citySearchTimer);
    state.citySearchTimer = setTimeout(() => searchCities(query), 260);
  }

  function updateStaticText() {
    document.documentElement.lang = lang();
    $('astroBrandTitle').textContent = ui('brand');
    $('astroBackLink').textContent = ui('back');
    $('astroTitle').textContent = ui('title');
    $('synastryEntryText').textContent = ui('synastryEntry');
    $('astroIntro').textContent = ui('intro');
    $('dateLabel').textContent = ui('date');
    $('timeLabel').textContent = ui('time');
    $('cityLabelText').textContent = ui('city');
    $('birthCity').placeholder = ui('cityPlaceholder');
    $('unknownLabel').textContent = ui('unknown');
    $('unknownNote').textContent = ui('unknownNote');
    $('cityHint').textContent = ui('cityHint');
    $('manualLabel').textContent = ui('manual');
    $('latLabel').textContent = ui('lat');
    $('lonLabel').textContent = ui('lon');
    $('timezoneLabelText').textContent = ui('timezone');
    $('calculateBtnText').textContent = ui('calc');
    $('resultTitle').textContent = ui('resultTitle');
    $('resultIntro').textContent = ui('resultIntro');
    $('summaryHeading').textContent = ui('summary');
    $('methodHeading').textContent = ui('method');
    $('methodText').textContent = ui('methodText');
    $('interpretiveNote').textContent = ui('interpretiveNote');
    $('sunTitle').textContent = ui('sun');
    $('moonTitle').textContent = ui('moon');
    $('ascTitle').textContent = ui('asc');
    $('sunRole').textContent = ui('sunRole');
    $('moonRole').textContent = ui('moonRole');
    $('ascRole').textContent = ui('ascRole');
  }

  function manualMode() {
    return $('manualToggle').checked;
  }

  function resolveLocation() {
    if (!manualMode()) {
      if (state.selectedCity) return state.selectedCity;

      // Fallback: allow an exact built-in city even if the user typed it
      // without clicking a suggestion.
      const city = findCity($('birthCity').value);
      if (city) {
        state.selectedCity = city;
        return city;
      }
      throw new Error(ui('cityError'));
    }

    const lat = Number($('manualLat').value);
    const lon = Number($('manualLon').value);
    const timezone = $('manualTimezone').value.trim();
    if (!Number.isFinite(lat) || lat < -89.9 || lat > 89.9 ||
        !Number.isFinite(lon) || lon < -180 || lon > 180 || !timezone) {
      throw new Error(ui('manualError'));
    }
    try {
      new Intl.DateTimeFormat('en-US', {timeZone:timezone}).format(new Date());
    } catch {
      throw new Error(ui('manualError'));
    }
    return {
      id:'manual',
      name:{'zh-CN':$('birthCity').value.trim() || '手动地点','zh-TW':$('birthCity').value.trim() || '手動地點','en':$('birthCity').value.trim() || 'Manual location'},
      country:{'zh-CN':'','zh-TW':'','en':''},
      lat, lon, timezone
    };
  }

  function astrologyRecordKey() {
    return window.XingchenRecords?.KEYS?.astrologyLastInput || 'xingchen-astrology-last-input-v1';
  }

  function saveLastAstrologyInput(city, unknown, dateInfo) {
    const record = {
      version:1,
      savedAt:new Date().toISOString(),
      calendarMode:dateInfo?.mode === 'lunar' ? 'lunar' : 'solar',
      solarDate:dateInfo?.date || $('birthDate').value,
      birthTime:$('birthTime').value || '',
      unknownTime:Boolean(unknown),
      cityInput:$('birthCity').value.trim(),
      city:manualMode() ? null : city,
      manual:{
        enabled:manualMode(),
        lat:$('manualLat').value,
        lon:$('manualLon').value,
        timezone:$('manualTimezone').value.trim()
      }
    };

    if (window.XingchenRecords?.write) {
      window.XingchenRecords.write(astrologyRecordKey(),record);
    } else {
      try { localStorage.setItem(astrologyRecordKey(),JSON.stringify(record)); } catch {}
    }
  }

  function readLastAstrologyInput() {
    if (window.XingchenRecords?.read) {
      return window.XingchenRecords.read(astrologyRecordKey(),null);
    }
    try {
      return JSON.parse(localStorage.getItem(astrologyRecordKey()) || 'null');
    } catch {
      return null;
    }
  }

  function restoreLastAstrologyInput() {
    const saved = readLastAstrologyInput();
    if (!saved?.solarDate) return;

    // Birth-date widget reconstructs the original lunar date, including leap month,
    // by converting the saved Gregorian calculation date back to lunar.
    const restored = window.XingchenBirthDate?.restore?.('birth-main',{
      mode:saved.calendarMode,
      date:saved.solarDate
    });
    if (!restored) {
      $('birthDate').value = saved.solarDate;
      window.XingchenBirthDate?.setMode?.(
        'birth-main',
        saved.calendarMode === 'lunar' ? 'lunar' : 'solar'
      );
    }

    $('birthTime').value = saved.birthTime || '';
    $('unknownTime').checked = Boolean(saved.unknownTime);
    $('birthTime').disabled = $('unknownTime').checked;
    $('birthTime').closest('.astro-field')
      .classList.toggle('is-disabled',$('unknownTime').checked);

    const manual = Boolean(saved.manual?.enabled);
    $('manualToggle').checked = manual;
    $('manualLocation').hidden = !manual;

    if (manual) {
      state.selectedCity = null;
      $('birthCity').value = saved.cityInput || '';
      $('manualLat').value = saved.manual?.lat ?? '';
      $('manualLon').value = saved.manual?.lon ?? '';
      $('manualTimezone').value = saved.manual?.timezone || '';
      $('citySelectedMeta').hidden = true;
      $('citySelectedMeta').textContent = '';
      return;
    }

    if (saved.city && Number.isFinite(Number(saved.city.lat)) &&
        Number.isFinite(Number(saved.city.lon)) && saved.city.timezone) {
      state.selectedCity = saved.city;
      $('birthCity').value = displayCityName(saved.city);
      $('citySelectedMeta').hidden = false;
      $('citySelectedMeta').textContent =
        `${Number(saved.city.lat).toFixed(4)}°, ${Number(saved.city.lon).toFixed(4)}° · ${saved.city.timezone}`;
      return;
    }

    // Older / partial local records can still restore the typed city label.
    state.selectedCity = null;
    $('birthCity').value = saved.cityInput || '';
  }

  function validate() {
    const dateInfo = window.XingchenBirthDate?.getInfo?.('birth-main') || {mode:'solar',date:$('birthDate').value,originalLabel:$('birthDate').value};
    if (!dateInfo?.date) throw new Error(ui('dateError'));
    const unknown = $('unknownTime').checked;
    if (!unknown && !$('birthTime').value) throw new Error(ui('timeError'));
    if (!window.Astronomy || !window.XingchenAstrologyEngine) throw new Error(ui('engineError'));
    const city = resolveLocation();
    return {city, unknown, dateInfo};
  }

  function renderPosition(cardId, role, position, note='') {
    const meta = signMeta(position.index);
    const card = $(cardId);
    card.classList.remove('is-unavailable','is-uncertain');
    card.querySelector('.astro-result-glyph').textContent = meta.glyph;
    card.querySelector('.astro-result-sign').textContent = signName(position.index);
    card.querySelector('.astro-result-degree').textContent = formatDegree(position, state.lastResult.mode === 'unknown-time');
    card.querySelector('.astro-result-meta').textContent = `${loc(state.elements[meta.element])} · ${loc(state.modalities[meta.modality])}`;
    card.querySelector('.astro-result-interpretation').textContent = interpretation(position.index, role);
    card.querySelector('.astro-result-note').textContent = note;
  }

  function renderUnavailableAsc() {
    const card = $('ascCard');
    card.classList.add('is-unavailable');
    card.querySelector('.astro-result-glyph').textContent = 'ASC';
    card.querySelector('.astro-result-sign').textContent = ui('unavailable');
    card.querySelector('.astro-result-degree').textContent = '—';
    card.querySelector('.astro-result-meta').textContent = '';
    card.querySelector('.astro-result-interpretation').textContent = ui('unknownAsc');
    card.querySelector('.astro-result-note').textContent = '';
  }

  function elementSummary(result) {
    const positions = [result.sun, result.moon, result.ascendant].filter(Boolean);
    const elems = positions.map(p => signMeta(p.index).element);
    const counts = elems.reduce((a,e)=>(a[e]=(a[e]||0)+1,a),{});
    const max = Math.max(...Object.values(counts));
    const dominant = Object.keys(counts).filter(e=>counts[e]===max && max>=2);

    const parts = [];
    if (result.sun.index === result.moon.index) parts.push(ui('sameSunMoon'));
    if (dominant.length) {
      parts.push(`${ui('sameElement')} ${dominant.map(e=>loc(state.elements[e])).join('、')}。`);
    } else if (positions.length === 3) {
      parts.push(ui('mixedElements'));
    }
    if (!parts.length) {
      const names = elems.map(e=>loc(state.elements[e])).join(' · ');
      parts.push(`${ui('elementMix')}：${names}。`);
    }
    return parts.join(' ');
  }

  function renderResult(result, city) {
    state.lastResult = result;

    const exactNote = result.mode === 'exact' ? ui('exact') : ui('approximate');
    renderPosition('sunCard','sun',result.sun, exactNote);

    if (result.mode === 'unknown-time') {
      if (result.moonSignUncertain) {
        const a = signName(result.moonDayStart.index);
        const b = signName(result.moonDayEnd.index);
        renderPosition('moonCard','moon',result.moon, `${ui('moonUncertain')} ${a} / ${b}`);
        $('moonCard').classList.add('is-uncertain');
        $('moonCard').querySelector('.astro-result-sign').textContent = `${a} / ${b}`;
        $('moonCard').querySelector('.astro-result-degree').textContent = '—';
      } else {
        renderPosition('moonCard','moon',result.moon, ui('moonSame'));
      }
      renderUnavailableAsc();
    } else {
      renderPosition('moonCard','moon',result.moon, ui('exact'));
      renderPosition('ascCard','ascendant',result.ascendant, ui('exact'));
    }

    $('resultLocation').textContent = `${displayCityName(city)} · ${city.lat.toFixed(4)}°, ${city.lon.toFixed(4)}°`;
    $('resultTimezone').textContent = `${ui('timezoneLabel')}：${city.timezone}`;
    $('summaryText').textContent = elementSummary(result);

    if (window.XingchenAstrologyFull?.render) {
      window.XingchenAstrologyFull.render(result);
    }

    $('astroResult').hidden = false;
    requestAnimationFrame(() => $('astroResult').scrollIntoView({behavior:'smooth',block:'start'}));
  }

  function sendAstrologyBark(result, city, dateInfo) {
    if (!window.XingchenBark?.send) return;

    const player = window.XingchenPlayer?.label?.() || '未命名玩家';
    const unknown = $('unknownTime').checked;
    const birthTime = unknown ? '未知（当地中午近似）' : $('birthTime').value;

    const planets = [
      ['sun','太阳'],['moon','月亮'],['mercury','水星'],['venus','金星'],['mars','火星'],
      ['jupiter','木星'],['saturn','土星'],['uranus','天王星'],['neptune','海王星'],['pluto','冥王星']
    ].map(([key,label]) => {
      const p = result.planets?.[key];
      if (!p) return '';
      const sign = p.signUncertain && p.possibleSignIndexes?.length
        ? p.possibleSignIndexes.map(signName).join(' / ')
        : signName(p.index);
      const degree = p.signUncertain ? '度数不确定' : formatDegree(p, result.mode === 'unknown-time');
      const retro = p.retrograde ? ' R' : '';
      const house = p.house ? `｜第${p.house}宫` : '';
      return `${label}：${sign} ${degree}${retro}${house}`;
    }).filter(Boolean);

    const angles = [];
    if (result.angles) {
      [
        ['ascendant','ASC 上升'],['mc','MC 天顶'],
        ['descendant','DSC 下降'],['ic','IC 天底']
      ].forEach(([key,label]) => {
        const p = result.angles[key];
        if (p) angles.push(`${label}：${signName(p.index)} ${formatDegree(p)}`);
      });
    }

    const tight = (result.aspects || [])
      .filter(a => a.orb <= 2)
      .slice(0,8)
      .map(a => `${a.body1} ${a.key} ${a.body2}｜orb ${a.orb.toFixed(2)}°`);

    const moonLine = result.moonSignUncertain
      ? `${signName(result.moonDayStart.index)} / ${signName(result.moonDayEnd.index)}`
      : `${signName(result.moon.index)} ${formatDegree(result.moon, result.mode === 'unknown-time')}`;

    const birthLines = dateInfo?.mode === 'lunar'
      ? [`出生：${dateInfo.originalLabel} ${birthTime}`, `换算阳历：${dateInfo.date}`]
      : [`出生：${dateInfo?.date || $('birthDate').value} ${birthTime}`];

    const body = [
      `玩家：${player}`,
      ...birthLines,
      `城市：${displayCityName(city)}｜${city.lat.toFixed(4)}°, ${city.lon.toFixed(4)}°`,
      `时区：${city.timezone}`,
      '',
      '核心三要素：',
      `太阳：${signName(result.sun.index)} ${formatDegree(result.sun, result.mode === 'unknown-time')}`,
      `月亮：${moonLine}`,
      result.ascendant
        ? `上升：${signName(result.ascendant.index)} ${formatDegree(result.ascendant)}`
        : '上升：出生时间未知，无法计算',
      '',
      '十颗主要星体：',
      ...planets,
      ...(angles.length ? ['', '四轴：', ...angles] : []),
      ...(tight.length ? ['', '紧密相位（orb ≤ 2°）：', ...tight] : []),
      '',
      `摘要：${elementSummary(result)}`
    ].join('\n');

    window.XingchenBark.send({
      title:'✨ 星辰日记｜本命星盘',
      subtitle:player,
      body,
      group:'星辰日记·星盘'
    });
  }

  async function prepareNatalReportPayload(result, city, unknown, dateInfo) {
    if (!window.XingchenReportPayload?.buildNatal) return null;
    try {
      const payload = await window.XingchenReportPayload.buildNatal({
        result,
        subject:window.XingchenPlayer?.getProfile?.() || null,
        birth:{
          dateInfo,
          solarDate:dateInfo?.date,
          calendarMode:dateInfo?.mode,
          originalLabel:dateInfo?.originalLabel,
          time:unknown ? null : $('birthTime').value,
          unknownTime:unknown,
          city
        }
      });
      await window.XingchenReportPayload.persist('natal', payload);
      state.lastReportPayload = payload;
      return payload;
    } catch (error) {
      console.warn('[星辰日记] 本命盘报告资料准备失败：', error);
      return null;
    }
  }

  async function calculate() {
    if (!window.XingchenPlayer?.hasProfile?.()) {
      window.XingchenPlayer?.ensure?.(() => calculate());
      return;
    }
    $('astroError').hidden = true;
    try {
      const {city, unknown, dateInfo} = validate();
      $('calculateBtn').disabled = true;
      $('calculateBtnText').textContent = ui('calculating');

      const result = XingchenAstrologyEngine.calculate({
        date:dateInfo.date,
        time: unknown ? '12:00' : $('birthTime').value,
        city,
        unknownTime:unknown
      });

      renderResult(result, city);
      saveLastAstrologyInput(city, unknown, dateInfo);
      await prepareNatalReportPayload(result, city, unknown, dateInfo);
      sendAstrologyBark(result, city, dateInfo);
    } catch(err) {
      console.error(err);
      $('astroError').textContent = err.message || String(err);
      $('astroError').hidden = false;
    } finally {
      $('calculateBtn').disabled = false;
      $('calculateBtnText').textContent = ui('calc');
    }
  }

  async function init() {
    updateStaticText();
    $('birthDate').max = new Date().toISOString().slice(0,10);

    try {
      const [signRes, cityRes, interpRes] = await Promise.all([
        fetch('../data/astrology/signs.json',{cache:'no-store'}),
        fetch('../data/astrology/cities.json',{cache:'no-store'}),
        fetch('../data/astrology/interpretations.json',{cache:'no-store'})
      ]);
      if (!signRes.ok || !cityRes.ok || !interpRes.ok) throw new Error('Astrology data load failed.');
      const s = await signRes.json();
      const c = await cityRes.json();
      const i = await interpRes.json();

      state.signs = s.signs;
      state.elements = s.elements;
      state.modalities = s.modalities;
      state.cities = c.cities;
      state.interpretations = i.interpretations;
      restoreLastAstrologyInput();
      } catch(err) {
      console.error(err);
      $('astroError').textContent = 'Astrology data could not be loaded. Please use Go Live / GitHub Pages.';
      $('astroError').hidden = false;
    }

    $('birthCity').addEventListener('focus', (event) => {
      if (mobileCityPicker()) openCityPicker();
      event.target.select();
      if (!state.selectedCity && event.target.value.trim().length >= 2) {
        scheduleCitySearch(event.target.value);
      }
    });

    $('birthCity').addEventListener('input', (event) => {
      state.selectedCity = null;
      state.citySearchSeq = (state.citySearchSeq || 0) + 1;
      if (state.citySearchAbort) state.citySearchAbort.abort();

      $('citySelectedMeta').hidden = true;
      $('citySelectedMeta').textContent = '';
      $('cityResults').hidden = true;
      $('cityResults').innerHTML = '';

      scheduleCitySearch(event.target.value);
    });

    $('birthCity').addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !$('cityResults').hidden) {
        const first = $('cityResults').querySelector('[data-city-result="0"]');
        if (first) {
          event.preventDefault();
          first.click();
        }
      }
      if (event.key === 'Escape') {
        $('cityResults').hidden = true;
      }
    });

    $('birthCity').addEventListener('blur', () => {
      if (mobileCityPicker() && cityFieldElement()?.classList.contains('is-picker-open')) return;
      setTimeout(() => { $('cityResults').hidden = true; }, 120);
    });

    $('unknownTime').addEventListener('change', () => {
      $('birthTime').disabled = $('unknownTime').checked;
      $('birthTime').closest('.astro-field').classList.toggle('is-disabled',$('unknownTime').checked);
    });

    $('manualToggle').addEventListener('change', () => {
      $('manualLocation').hidden = !manualMode();
    });

    $('calculateBtn').addEventListener('click', calculate);
  }

  document.addEventListener('DOMContentLoaded', init);
})();