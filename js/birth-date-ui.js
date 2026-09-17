(() => {
  const widgets = new Map();

  const TEXT = {
    'zh-CN': {
      solar:'阳历', lunar:'农历',
      year:'年份', month:'月份', day:'日期',
      converted:'换算阳历', leap:'闰',
      lunarPrefix:'农历', solarPrefix:'阳历',
      loading:'正在读取农历资料…',
      invalid:'这个农历日期不存在，请重新选择。',
      loadError:'农历转换模块未载入，请检查网络后重新整理。'
    },
    'zh-TW': {
      solar:'陽曆', lunar:'農曆',
      year:'年份', month:'月份', day:'日期',
      converted:'換算陽曆', leap:'閏',
      lunarPrefix:'農曆', solarPrefix:'陽曆',
      loading:'正在讀取農曆資料…',
      invalid:'這個農曆日期不存在，請重新選擇。',
      loadError:'農曆轉換模組未載入，請檢查網路後重新整理。'
    },
    'en': {
      solar:'Solar', lunar:'Lunar',
      year:'Year', month:'Month', day:'Day',
      converted:'Solar date', leap:'Leap ',
      lunarPrefix:'Lunar', solarPrefix:'Solar',
      loading:'Loading lunar calendar…',
      invalid:'This lunar date does not exist. Please choose again.',
      loadError:'The lunar conversion module is unavailable. Please check your connection and reload.'
    }
  };

  const MONTH_CN = ['','正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'];
  const MONTH_TW = ['','正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','臘月'];
  const DAY_CN = [
    '',
    '初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
    '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
    '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'
  ];

  function lang() {
    const value = localStorage.getItem('xingchen-language');
    return ['zh-CN','zh-TW','en'].includes(value) ? value : 'zh-CN';
  }

  function t(key) {
    return TEXT[lang()]?.[key] ?? TEXT['zh-CN'][key] ?? key;
  }

  function pad(n) {
    return String(n).padStart(2,'0');
  }

  function lib() {
    return window.solarLunar || window.SolarLunar || null;
  }

  function monthLabel(month, isLeap=false) {
    let base;
    if (lang() === 'en') base = `Month ${month}`;
    else base = (lang() === 'zh-TW' ? MONTH_TW : MONTH_CN)[month] || `${month}月`;
    return isLeap ? `${t('leap')}${base}` : base;
  }

  function dayLabel(day) {
    return lang() === 'en' ? `Day ${day}` : (DAY_CN[day] || String(day));
  }

  function sameLunar(back, year, month, day, isLeap) {
    if (!back) return false;
    return Number(back.lYear) === Number(year)
      && Number(back.lMonth) === Number(month)
      && Number(back.lDay) === Number(day)
      && Boolean(back.isLeap) === Boolean(isLeap);
  }

  /*
    Only use the public conversion API guaranteed by solarlunar 3.x.
    A candidate lunar date is valid only if:
    lunar -> solar -> lunar returns exactly the same Y/M/D + leap flag.
  */
  function convertVerified(year, month, day, isLeap=false) {
    const engine = lib();
    if (!engine?.lunar2solar || !engine?.solar2lunar) return null;

    try {
      const solar = engine.lunar2solar(Number(year),Number(month),Number(day),Boolean(isLeap));
      if (!solar?.cYear || !solar?.cMonth || !solar?.cDay) return null;

      const back = engine.solar2lunar(
        Number(solar.cYear),
        Number(solar.cMonth),
        Number(solar.cDay)
      );

      if (!sameLunar(back,year,month,day,isLeap)) return null;

      return {
        cYear:Number(solar.cYear),
        cMonth:Number(solar.cMonth),
        cDay:Number(solar.cDay),
        back
      };
    } catch {
      return null;
    }
  }

  function leapMonthOfYear(year) {
    for (let month=1; month<=12; month++) {
      if (convertVerified(year,month,1,true)) return month;
    }
    return 0;
  }

  function lunarMonthDays(year, month, isLeap=false) {
    if (convertVerified(year,month,30,isLeap)) return 30;
    if (convertVerified(year,month,29,isLeap)) return 29;
    return 0;
  }

  function setMode(widget, mode, sync=true) {
    widget.mode = mode === 'lunar' ? 'lunar' : 'solar';

    const solarPanel = widget.el.querySelector('[data-birth-solar-panel]');
    const lunarPanel = widget.el.querySelector('[data-birth-lunar-panel]');
    solarPanel.hidden = widget.mode !== 'solar';
    lunarPanel.hidden = widget.mode !== 'lunar';

    widget.el.querySelectorAll('[data-birth-mode]').forEach(btn => {
      const active = btn.dataset.birthMode === widget.mode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    if (!sync) return;

    if (widget.mode === 'lunar') {
      prefillLunarFromSolar(widget);
      updatePreview(widget);
    } else {
      const info = lunarInfo(widget);
      if (info?.date) widget.solarInput.value = info.date;
    }
  }

  function populateYears(widget) {
    const current = new Date().getFullYear();
    widget.year.innerHTML = `<option value="">${t('year')}</option>`;
    for (let year=current; year>=1900; year--) {
      widget.year.insertAdjacentHTML('beforeend', `<option value="${year}">${year}</option>`);
    }
  }

  function populateMonths(widget, preferred='') {
    const year = Number(widget.year.value);
    widget.month.innerHTML = `<option value="">${t('month')}</option>`;
    widget.day.innerHTML = `<option value="">${t('day')}</option>`;

    if (!year) return;

    if (!lib()) {
      widget.preview.hidden = false;
      widget.preview.textContent = t('loadError');
      widget.preview.classList.add('is-error');
      return;
    }

    const leapMonth = leapMonthOfYear(year);

    for (let month=1; month<=12; month++) {
      widget.month.insertAdjacentHTML(
        'beforeend',
        `<option value="${month}">${monthLabel(month,false)}</option>`
      );

      if (leapMonth === month) {
        widget.month.insertAdjacentHTML(
          'beforeend',
          `<option value="L${month}">${monthLabel(month,true)}</option>`
        );
      }
    }

    if (preferred && [...widget.month.options].some(o => o.value === preferred)) {
      widget.month.value = preferred;
      populateDays(widget);
    }
  }

  function populateDays(widget, preferred='') {
    const year = Number(widget.year.value);
    const rawMonth = widget.month.value;

    widget.day.innerHTML = `<option value="">${t('day')}</option>`;
    if (!year || !rawMonth) {
      updatePreview(widget);
      return;
    }

    const isLeap = rawMonth.startsWith('L');
    const month = Number(rawMonth.replace('L',''));
    const count = lunarMonthDays(year,month,isLeap);

    if (!count) {
      widget.preview.hidden = false;
      widget.preview.textContent = t('invalid');
      widget.preview.classList.add('is-error');
      return;
    }

    for (let day=1; day<=count; day++) {
      widget.day.insertAdjacentHTML(
        'beforeend',
        `<option value="${day}">${dayLabel(day)}</option>`
      );
    }

    if (preferred && [...widget.day.options].some(o => o.value === String(preferred))) {
      widget.day.value = String(preferred);
    }

    updatePreview(widget);
  }

  function lunarInfo(widget) {
    if (widget.mode !== 'lunar') return null;

    const year = Number(widget.year.value);
    const rawMonth = widget.month.value;
    const day = Number(widget.day.value);

    if (!year || !rawMonth || !day) return null;

    const isLeap = rawMonth.startsWith('L');
    const month = Number(rawMonth.replace('L',''));
    const verified = convertVerified(year,month,day,isLeap);
    if (!verified) return null;

    const date = `${verified.cYear}-${pad(verified.cMonth)}-${pad(verified.cDay)}`;
    const originalLabel =
      `${t('lunarPrefix')} ${year} ${monthLabel(month,isLeap)}${dayLabel(day)}`;

    return {
      mode:'lunar',
      year, month, day, isLeap,
      date,
      originalLabel,
      convertedLabel:`${t('converted')}：${verified.cYear}/${pad(verified.cMonth)}/${pad(verified.cDay)}`
    };
  }

  function updatePreview(widget) {
    widget.preview.classList.remove('is-error');

    if (!lib()) {
      widget.preview.hidden = false;
      widget.preview.textContent = t('loadError');
      widget.preview.classList.add('is-error');
      return;
    }

    const year = Number(widget.year.value);
    const rawMonth = widget.month.value;
    const day = Number(widget.day.value);

    if (!year || !rawMonth || !day) {
      widget.preview.hidden = true;
      widget.preview.textContent = '';
      return;
    }

    const info = lunarInfo(widget);
    if (!info) {
      widget.preview.hidden = false;
      widget.preview.textContent = t('invalid');
      widget.preview.classList.add('is-error');
      return;
    }

    widget.preview.hidden = false;
    widget.preview.textContent = info.convertedLabel;
  }

  function prefillLunarFromSolar(widget) {
    const engine = lib();
    if (!engine?.solar2lunar || !widget.solarInput.value) return;

    const [year,month,day] = widget.solarInput.value.split('-').map(Number);
    if (!year || !month || !day) return;

    try {
      const lunar = engine.solar2lunar(year,month,day);
      if (!lunar?.lYear || !lunar?.lMonth || !lunar?.lDay) return;

      widget.year.value = String(lunar.lYear);
      const monthValue = `${lunar.isLeap ? 'L' : ''}${lunar.lMonth}`;
      populateMonths(widget,monthValue);
      populateDays(widget,lunar.lDay);
    } catch {}
  }

  function getInfo(id) {
    const widget = widgets.get(id);
    if (!widget) return null;

    if (widget.mode === 'lunar') return lunarInfo(widget);

    const date = widget.solarInput.value;
    return {
      mode:'solar',
      date,
      originalLabel: date ? `${t('solarPrefix')} ${date.replaceAll('-','/')}` : '',
      convertedLabel:''
    };
  }

  function refreshText(widget) {
    widget.el.querySelectorAll('[data-birth-mode]').forEach(btn => {
      btn.textContent = btn.dataset.birthMode === 'lunar' ? t('lunar') : t('solar');
    });
  }

  function initWidget(el) {
    const id = el.dataset.birthDateWidget;
    const solarInput = document.getElementById(el.dataset.solarInput);
    if (!id || !solarInput) return;

    const widget = {
      id,
      el,
      solarInput,
      year:el.querySelector('[data-lunar-year]'),
      month:el.querySelector('[data-lunar-month]'),
      day:el.querySelector('[data-lunar-day]'),
      preview:el.querySelector('[data-lunar-preview]'),
      mode:'solar'
    };

    widgets.set(id,widget);
    refreshText(widget);
    populateYears(widget);

    el.querySelectorAll('[data-birth-mode]').forEach(btn => {
      btn.addEventListener('click', () => setMode(widget,btn.dataset.birthMode));
    });

    widget.year.addEventListener('change', () => {
      populateMonths(widget);
      updatePreview(widget);
    });

    widget.month.addEventListener('change', () => {
      populateDays(widget);
    });

    widget.day.addEventListener('change', () => {
      updatePreview(widget);
    });

    setMode(widget,'solar',false);
  }

  function init() {
    document.querySelectorAll('[data-birth-date-widget]').forEach(initWidget);
  }

  window.XingchenBirthDate = {
    getInfo,
    getDate:id => getInfo(id)?.date || '',
    setMode:(id,mode) => {
      const widget = widgets.get(id);
      if (widget) setMode(widget,mode);
    },
    _debug:{
      convertVerified,
      leapMonthOfYear,
      lunarMonthDays
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',init,{once:true});
  } else {
    init();
  }
})();