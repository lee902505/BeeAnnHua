(() => {
  const SOURCES = [
    'https://cdn.jsdelivr.net/gh/public-wheels/china-cities@master/china_cities.txt',
    'https://raw.githubusercontent.com/public-wheels/china-cities/master/china_cities.txt'
  ];
  const CACHE_KEY = 'xingchen-china-locations-v1';
  let records = [];
  let loadPromise = null;

  function normalize(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/(特别行政区|自治州|自治区|地区|盟|省|市|县|區|区)$/u, '');
  }

  function parseTSV(text) {
    const lines = String(text || '').split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const out = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split('\t');
      if (parts.length < 12) continue;
      const [
        code, enName, cnName, countryCode, countryEn, countryCn,
        provinceEn, provinceCn, parentEn, parentCn, lat, lon
      ] = parts;
      const latitude = Number(lat);
      const longitude = Number(lon);
      if (!cnName || !Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

      const isCityLevel = normalize(cnName) === normalize(parentCn);
      out.push({
        id: `cn-${code}`,
        name: {'zh-CN':cnName, 'zh-TW':cnName, 'en':enName || cnName},
        country: {'zh-CN':'中国', 'zh-TW':'中國', 'en':'China'},
        admin1: provinceCn || '',
        admin2: isCityLevel ? '' : (parentCn || ''),
        provinceCn: provinceCn || '',
        provinceEn: provinceEn || '',
        parentCityCn: parentCn || '',
        parentCityEn: parentEn || '',
        lat: latitude,
        lon: longitude,
        timezone: 'Asia/Shanghai',
        aliases: [
          cnName, enName, provinceCn, provinceEn, parentCn, parentEn,
          `${cnName}${parentCn || ''}${provinceCn || ''}`,
          `${provinceCn || ''}${parentCn || ''}${cnName}`
        ].filter(Boolean),
        isCityLevel,
        source: 'china-locations'
      });
    }
    return out;
  }

  async function load() {
    if (records.length) return records;

    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 1000) {
          records = parsed;
          return records;
        }
      }
    } catch {}

    let lastError = null;
    for (const url of SOURCES) {
      try {
        const response = await fetch(url, {cache:'force-cache'});
        if (!response.ok) throw new Error(`China location HTTP ${response.status}`);
        const text = await response.text();
        const parsed = parseTSV(text);
        if (parsed.length < 1000) throw new Error('China location data incomplete');
        records = parsed;
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(records));
        } catch {}
        return records;
      } catch (error) {
        lastError = error;
      }
    }
    console.warn('[星辰日記] 中國出生地資料載入失敗，改用既有城市／線上搜尋。', lastError);
    return [];
  }

  function scoreRecord(record, query) {
    const q = normalize(query);
    const name = normalize(record.name?.['zh-CN']);
    const en = normalize(record.name?.en);
    const province = normalize(record.provinceCn);
    const provinceEn = normalize(record.provinceEn);
    const parent = normalize(record.parentCityCn);
    const parentEn = normalize(record.parentCityEn);

    let score = 0;
    if (name === q || en === q) score = 1000;
    else if (parent === q || parentEn === q) score = record.isCityLevel ? 950 : 880;
    else if (province === q || provinceEn === q) score = record.isCityLevel ? 900 : 600;
    else {
      const values = [name,en,parent,parentEn,province,provinceEn,...(record.aliases || []).map(normalize)];
      if (values.some(v => v === q)) score = 850;
      else if (values.some(v => v.startsWith(q))) score = 650;
      else if (values.some(v => v.includes(q))) score = 450;
    }

    if (record.isCityLevel) score += 80;
    return score;
  }

  async function search(query, limit=20) {
    const q = normalize(query);
    if (!q) return [];
    const list = await (loadPromise || (loadPromise = load()));
    if (!list.length) return [];

    const exactProvince = list.some(r => normalize(r.provinceCn) === q || normalize(r.provinceEn) === q);
    const scored = [];

    for (const record of list) {
      if (exactProvince && !record.isCityLevel) continue;
      const score = scoreRecord(record, query);
      if (score > 0) scored.push({record, score});
    }

    scored.sort((a,b) =>
      b.score - a.score ||
      Number(b.record.isCityLevel) - Number(a.record.isCityLevel) ||
      a.record.name['zh-CN'].localeCompare(b.record.name['zh-CN'], 'zh-Hans-CN')
    );

    const out = [];
    const seen = new Set();
    for (const {record} of scored) {
      const key = `${record.name['zh-CN']}|${record.parentCityCn}|${record.provinceCn}|${record.lat.toFixed(4)}|${record.lon.toFixed(4)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(record);
      if (out.length >= limit) break;
    }
    return out;
  }

  async function hasExactAdministrativeMatch(query) {
    const q = normalize(query);
    if (!q) return false;
    const list = await (loadPromise || (loadPromise = load()));
    return list.some(record =>
      normalize(record.name?.['zh-CN']) === q ||
      normalize(record.name?.en) === q ||
      normalize(record.parentCityCn) === q ||
      normalize(record.parentCityEn) === q ||
      normalize(record.provinceCn) === q ||
      normalize(record.provinceEn) === q
    );
  }

  window.XingchenChinaLocation = {
    ready: () => (loadPromise || (loadPromise = load())),
    search,
    hasExactAdministrativeMatch,
    count: () => records.length
  };

  // Preload quietly so the first search feels immediate.
  loadPromise = load();
})();