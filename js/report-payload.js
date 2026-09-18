(() => {
  const APP_VERSION = '0.10.7.11';
  const SCHEMA = 'stellar-diary.report-input';
  const SCHEMA_VERSION = '1.0.0';
  const PLANETS = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  const scriptUrl = document.currentScript?.src || location.href;
  const signsUrl = new URL('../data/astrology/signs.json', scriptUrl).href;
  const deepUrl = new URL('../data/astrology/deep-interpretations.json', scriptUrl).href;
  let dataPromise = null;

  function locale() {
    const saved = localStorage.getItem('xingchen-language');
    return ['zh-CN','zh-TW','en'].includes(saved) ? saved : 'zh-CN';
  }

  function cleanNumber(value, digits=8) {
    if (!Number.isFinite(Number(value))) return null;
    return Number(Number(value).toFixed(digits));
  }

  function plain(value) {
    if (value == null) return null;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(plain);
    if (typeof value === 'object') {
      const out = {};
      Object.entries(value).forEach(([key,val]) => {
        if (typeof val !== 'function' && val !== undefined) out[key] = plain(val);
      });
      return out;
    }
    return value;
  }

  function loadData() {
    if (!dataPromise) {
      dataPromise = Promise.all([
        fetch(signsUrl,{cache:'no-store'}).then(r => { if (!r.ok) throw new Error('signs load failed'); return r.json(); }),
        fetch(deepUrl,{cache:'no-store'}).then(r => { if (!r.ok) throw new Error('deep load failed'); return r.json(); })
      ]).then(([signs,deep]) => ({signs:signs.signs,deep}));
    }
    return dataPromise;
  }

  function signRef(index, signs) {
    const sign = signs?.[index];
    if (!sign) return {index:index ?? null, key:null};
    return {index:sign.index, key:sign.key};
  }

  function normalizePosition(position, signs, key=null) {
    if (!position) return null;
    return {
      body:key || position.key || null,
      sign:signRef(position.index,signs),
      degree:cleanNumber(position.degree,6),
      longitude:cleanNumber(position.longitude,6),
      house:Number.isFinite(Number(position.house)) ? Number(position.house) : null,
      retrograde:Boolean(position.retrograde),
      speedDegPerDay:cleanNumber(position.speedDegPerDay,8),
      signUncertain:Boolean(position.signUncertain),
      possibleSignIndexes:Array.isArray(position.possibleSignIndexes) ? [...position.possibleSignIndexes] : []
    };
  }

  function normalizeCity(city) {
    if (!city) return null;
    return {
      id:city.id || null,
      name:plain(city.name || null),
      country:plain(city.country || null),
      admin1:city.admin1 || null,
      admin2:city.admin2 || null,
      lat:cleanNumber(city.lat,6),
      lon:cleanNumber(city.lon,6),
      timezone:city.timezone || null,
      source:city.source || null
    };
  }

  function normalizeAspects(aspects=[]) {
    return aspects.map(a => ({
      type:a.key,
      body1:a.body1 || a.bodyA || null,
      body2:a.body2 || a.bodyB || null,
      angle:cleanNumber(a.angle,4),
      separation:cleanNumber(a.separation,6),
      orb:cleanNumber(a.orb,6),
      limit:cleanNumber(a.limit,4)
    }));
  }

  function distributions(result, signs) {
    const elements = {fire:0,earth:0,air:0,water:0};
    const modalities = {cardinal:0,fixed:0,mutable:0};
    const houseModes = {angular:0,succedent:0,cadent:0};
    const angular = new Set([1,4,7,10]);
    const succedent = new Set([2,5,8,11]);
    PLANETS.forEach(key => {
      const p = result.planets?.[key];
      const s = p ? signs[p.index] : null;
      if (s?.element in elements) elements[s.element]++;
      if (s?.modality in modalities) modalities[s.modality]++;
      if (angular.has(p?.house)) houseModes.angular++;
      else if (succedent.has(p?.house)) houseModes.succedent++;
      else if (p?.house) houseModes.cadent++;
    });
    return {elements,modalities,houseModes:result.houses ? houseModes : null};
  }

  function normalizeHouses(result, signs) {
    if (!result.houses) return null;
    return {
      system:result.houses.system,
      fallback:Boolean(result.houses.fallback),
      fallbackReason:result.houses.fallbackReason || null,
      cusps:(result.houses.cusps || []).map((cusp,index) => ({
        house:index+1,
        sign:signRef(cusp.index,signs),
        degree:cleanNumber(cusp.degree,6),
        longitude:cleanNumber(cusp.longitude,6)
      }))
    };
  }

  function normalizeChart(result, signs, deep) {
    const planets = {};
    PLANETS.forEach(key => planets[key] = normalizePosition(result.planets?.[key],signs,key));
    const angles = {};
    ['ascendant','descendant','mc','ic'].forEach(key => {
      const p = result.angles?.[key] || (key === 'ascendant' ? result.ascendant : null);
      angles[key] = normalizePosition(p,signs,key);
    });

    let synthesis = {patterns:[],chartRulers:null};
    try {
      if (window.XingchenNatalSynthesis?.analyze) {
        synthesis = plain(window.XingchenNatalSynthesis.analyze(result, signs, deep?.signs || {}));
      }
    } catch (error) {
      console.warn('[星辰日记] report synthesis fallback:', error);
    }

    return {
      mode:result.mode,
      utc:result.utc instanceof Date ? result.utc.toISOString() : String(result.utc || ''),
      planets,
      angles,
      houses:normalizeHouses(result,signs),
      aspects:normalizeAspects(result.aspects || []),
      uncertainty:{
        moonSignUncertain:Boolean(result.moonSignUncertain),
        uncertainPlanets:plain(result.uncertainPlanets || {})
      },
      distributions:distributions(result,signs),
      synthesis
    };
  }

  function playerSubject() {
    const profile = window.XingchenPlayer?.getProfile?.();
    return profile ? {name:profile.name || null, gender:profile.gender || null} : null;
  }

  function basePayload(type) {
    return {
      schema:SCHEMA,
      schemaVersion:SCHEMA_VERSION,
      reportType:type,
      meta:{
        app:'stellar-diary',
        appVersion:APP_VERSION,
        protocolVersion:window.XingchenBackendConfig?.protocolVersion || '1.0.0',
        locale:locale(),
        generatedAt:new Date().toISOString(),
        fingerprint:null
      },
      method:{
        zodiac:'tropical',
        deterministicChart:true,
        astronomyEngine:'astronomy-engine@2.1.19',
        interpretationMode:'symbolic-traditional',
        disclaimer:'Astrology is used as a symbolic/traditional interpretive framework, not scientific diagnosis or deterministic prediction.'
      }
    };
  }

  async function finalize(payload) {
    const copy = plain(payload);
    copy.meta.fingerprint = null;
    // generatedAt should not change the identity of the same deterministic chart.
    const hashable = plain(copy);
    hashable.meta.generatedAt = null;
    const fingerprint = await window.XingchenApi.hashPayload(hashable);
    copy.meta.fingerprint = fingerprint;
    return copy;
  }

  async function buildNatal({result,birth={},subject=null}={}) {
    if (!result?.planets) throw new Error('Natal report payload requires a calculated chart result.');
    const {signs,deep} = await loadData();
    const payload = {
      ...basePayload('natal'),
      subject:subject || playerSubject(),
      birth:{
        calendarMode:birth.calendarMode || birth.dateInfo?.mode || 'solar',
        originalLabel:birth.originalLabel || birth.dateInfo?.originalLabel || null,
        solarDate:birth.solarDate || birth.dateInfo?.date || birth.date || null,
        localTime:birth.unknownTime ? null : (birth.time || null),
        unknownTime:Boolean(birth.unknownTime),
        location:normalizeCity(birth.city || result.city)
      },
      chart:normalizeChart(result,signs,deep),
      reportRequest:{
        sections:['core-personality','emotion-security','communication','love-intimacy','action-pressure','career-direction','money-security','relationships','subconscious-lessons','talents','blocks','life-theme','integration-advice']
      }
    };
    return finalize(payload);
  }

  function normalizeCompatibility(comp) {
    if (!comp) return null;
    const dimensions = {};
    Object.entries(comp.dimensions || {}).forEach(([key,value]) => {
      dimensions[key] = {
        score:Number(value.score),
        positive:cleanNumber(value.positive,8),
        negative:cleanNumber(value.negative,8),
        evidence:cleanNumber(value.evidence,8)
      };
    });
    return {score:Number(comp.score),dimensions,weights:plain(comp.weights || {})};
  }

  async function buildSynastry({personA,personB,relationshipType,crossAspects=[],compatibility=null}={}) {
    if (!personA?.result?.planets || !personB?.result?.planets) {
      throw new Error('Synastry payload requires both calculated natal charts.');
    }
    const {signs,deep} = await loadData();
    const normalizePerson = person => ({
      name:person.name || null,
      birth:{
        calendarMode:person.dateInfo?.mode || person.calendarMode || 'solar',
        originalLabel:person.dateInfo?.originalLabel || null,
        solarDate:person.dateInfo?.date || person.date || null,
        localTime:person.unknown ? null : (person.time || null),
        unknownTime:Boolean(person.unknown),
        location:normalizeCity(person.city || person.result.city)
      },
      chart:normalizeChart(person.result,signs,deep)
    });

    const aspects = crossAspects.map(a => ({
      type:a.key,
      bodyA:a.bodyA,
      bodyB:a.bodyB,
      angle:cleanNumber(a.angle,4),
      separation:cleanNumber(a.separation,6),
      orb:cleanNumber(a.orb,6),
      limit:cleanNumber(a.limit,4)
    }));
    const supportive = aspects.filter(a => ['trine','sextile'].includes(a.type)).length;
    const challenging = aspects.filter(a => ['square','opposition'].includes(a.type)).length;
    const tight = aspects.filter(a => Number(a.orb) <= 2).length;

    const payload = {
      ...basePayload('synastry'),
      relationship:{type:relationshipType || 'couple'},
      people:{A:normalizePerson(personA),B:normalizePerson(personB)},
      crossChart:{
        aspects,
        summary:{total:aspects.length,supportive,challenging,mixed:aspects.length-supportive-challenging,tight}
      },
      compatibility:normalizeCompatibility(compatibility),
      reportRequest:{
        sections:['relationship-overview','core-attraction','emotion-security','communication','intimacy-attraction','long-term-stability','growth-lessons','challenge-repair','practical-advice']
      }
    };
    return finalize(payload);
  }

  function validate(payload) {
    const errors = [];
    if (payload?.schema !== SCHEMA) errors.push('schema');
    if (payload?.schemaVersion !== SCHEMA_VERSION) errors.push('schemaVersion');
    if (!['natal','synastry'].includes(payload?.reportType)) errors.push('reportType');
    if (!payload?.meta?.fingerprint) errors.push('meta.fingerprint');
    if (payload?.reportType === 'natal' && !payload?.chart?.planets) errors.push('chart.planets');
    if (payload?.reportType === 'synastry' && (!payload?.people?.A?.chart || !payload?.people?.B?.chart)) errors.push('people charts');
    return {valid:errors.length === 0,errors};
  }

  async function persist(type, payload) {
    const check = validate(payload);
    if (!check.valid) throw new Error(`Report payload validation failed: ${check.errors.join(', ')}`);
    window.XingchenReportStore?.savePayload?.(type,payload);
    document.dispatchEvent(new CustomEvent('xingchen:report-payload-ready',{detail:{type,payload}}));
    return payload;
  }

  window.XingchenReportPayload = {
    SCHEMA,
    SCHEMA_VERSION,
    buildNatal,
    buildSynastry,
    validate,
    persist
  };
})();
