(() => {
  const widgets = new Map();
  const TEXT = {
    'zh-CN': {
      solar:'阳历', lunar:'农历',
      year:'年份', month:'月份', day:'日期',
      converted:'换算阳历', leap:'闰',
      lunarPrefix:'农历', solarPrefix:'阳历',
      loadError:'农历转换模块未载入，请检查网络后重新整理。'
    },
    'zh-TW': {
      solar:'陽曆', lunar:'農曆',
      year:'年份', month:'月份', day:'日期',
      converted:'換算陽曆', leap:'閏',
      lunarPrefix:'農曆', solarPrefix:'陽曆',
      loadError:'農曆轉換模組未載入，請檢查網路後重新整理。'
    },
    'en': {
      solar:'Solar', lunar:'Lunar',
      year:'Year', month:'Month', day:'Day',
      converted:'Solar date', leap:'Leap ',
      lunarPrefix:'Lunar', solarPrefix:'Solar',
      loadError:'Lunar calendar module is unavailable. Please check your connection and reload.'
    }
  };

  function lang() {
    const value = localStorage.getItem('xingchen-language');
    return ['zh-CN','zh-TW','en'].includes(value) ? value : 'zh-CN';
  }
  function t(key) { return TEXT[lang()]?.[key] ?? TEXT['zh-CN'][key] ?? key; }
  function pad(n) { return String(n).padStart(2,'0'); }

  function safeSolarLunar() {
    return window.solarLunar || window.SolarLunar || null;
  }

  function monthLabel(month, isLeap=false) {
    const lib = safeSolarLunar();
    let label = lib?.toChinaMonth ? lib.toChinaMonth(month) : `${month}月`;
    if (isLeap) label = `${t('leap')}${label}`;
    return label;
  }

  function dayLabel(day) {
    const lib = safeSolarLunar();
    return lib?.toChinaDay ? lib.toChinaDay(day) : String(day);
  }

  function setMode(widget, mode, sync=true) {
    const solarPanel = widget.el.querySelector('[data-birth-solar-panel]');
    const lunarPanel = widget.el.querySelector('[data-birth-lunar-panel]');
    widget.mode = mode === 'lunar' ? 'lunar' : 'solar';
    solarPanel.hidden = widget.mode !== 'solar';
    lunarPanel.hidden = widget.mode !== 'lunar';

    widget.el.querySelectorAll('[data-birth-mode]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.birthMode === widget.mode);
      btn.setAttribute('aria-pressed', btn.dataset.birthMode === widget.mode ? 'true' : 'false');
    });

    if (!sync) return;

    if (widget.mode === 'lunar') {
      prefillLunarFromSolar(widget);
      updateLunarPreview(widget);
    } else {
      const info = lunarInfo(widget);
      if (info?.date) widget.solarInput.value = info.date;
    }
  }

  function populateYears(widget) {
    const yearSelect = widget.year;
    const current = new Date().getFullYear();
    yearSelect.innerHTML = `<option value="">${t('year')}</option>`;
    for (let year=current; year>=1900; year--) {
      yearSelect.insertAdjacentHTML('beforeend', `<option value="${year}">${year}</option>`);
    }
  }

  function populateMonths(widget, preferred='') {
    const year = Number(widget.year.value);
    const lib = safeSolarLunar();
    widget.month.innerHTML = `<option value="">${t('month')}</option>`;
    if (!year || !lib) {
      widget.day.innerHTML = `<option value="">${t('day')}</option>`;
      return;
    }

    const leapMonth = Number(lib.leapMonth(year) || 0);
    for (let month=1; month<=12; month++) {
      widget.month.insertAdjacentHTML('beforeend',
        `<option value="${month}">${monthLabel(month,false)}</option>`);
      if (leapMonth === month) {
        widget.month.insertAdjacentHTML('beforeend',
          `<option value="L${month}">${monthLabel(month,true)}</option>`);
      }
    }

    if (preferred && [...widget.month.options].some(o => o.value === preferred)) {
      widget.month.value = preferred;
    }
    populateDays(widget);
  }

  function populateDays(widget, preferred='') {
    const lib = safeSolarLunar();
    const year = Number(widget.year.value);
    const rawMonth = widget.month.value;
    widget.day.innerHTML = `<option value="">${t('day')}</option>`;
    if (!lib || !year || !rawMonth) return;

    const isLeap = rawMonth.startsWith('L');
    const month = Number(rawMonth.replace('L',''));
    const count = isLeap ? Number(lib.leapDays(year)) : Number(lib.monthDays(year,month));
    if (!Number.isFinite(count) || count < 29) return;

    for (let day=1; day<=count; day++) {
      widget.day.insertAdjacentHTML('beforeend',
        `<option value="${day}">${dayLabel(day)}</option>`);
    }
    if (preferred && [...widget.day.options].some(o => o.value === String(preferred))) {
      widget.day.value = String(preferred);
    }
    updateLunarPreview(widget);
  }

  function lunarInfo(widget) {
    if (widget.mode !== 'lunar') return null;
    const lib = safeSolarLunar();
    const year = Number(widget.year.value);
    const rawMonth = widget.month.value;
    const day = Number(widget.day.value);
    if (!lib || !year || !rawMonth || !day) return null;

    const isLeap = rawMonth.startsWith('L');
    const month = Number(rawMonth.replace('L',''));
    try {
      const result = lib.lunar2solar(year,month,day,isLeap);
      if (!result || !result.cYear || !result.cMonth || !result.cDay) return null;
      const date = `${result.cYear}-${pad(result.cMonth)}-${pad(result.cDay)}`;
      const originalLabel = `${t('lunarPrefix')} ${year} ${monthLabel(month,isLeap)}${dayLabel(day)}`;
      return {
        mode:'lunar', year, month, day, isLeap,
        date,
        originalLabel,
        convertedLabel:`${t('converted')}：${result.cYear}/${pad(result.cMonth)}/${pad(result.cDay)}`
      };
    } catch {
      return null;
    }
  }

  function updateLunarPreview(widget) {
    const preview = widget.preview;
    if (!safeSolarLunar()) {
      preview.hidden = false;
      preview.textContent = t('loadError');
      preview.classList.add('is-error');
      return;
    }
    const info = lunarInfo(widget);
    preview.classList.remove('is-error');
    if (!info) {
      preview.hidden = true;
      preview.textContent = '';
      return;
    }
    preview.hidden = false;
    preview.textContent = info.convertedLabel;
  }

  function prefillLunarFromSolar(widget) {
    const lib = safeSolarLunar();
    if (!lib || !widget.solarInput.value) return;
    const [y,m,d] = widget.solarInput.value.split('-').map(Number);
    if (!y || !m || !d) return;
    try {
      const lunar = lib.solar2lunar(y,m,d);
      if (!lunar?.lYear) return;
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

  function initWidget(el) {
    const id = el.dataset.birthDateWidget;
    const solarInput = document.getElementById(el.dataset.solarInput);
    if (!id || !solarInput) return;

    const widget = {
      id, el, solarInput,
      year:el.querySelector('[data-lunar-year]'),
      month:el.querySelector('[data-lunar-month]'),
      day:el.querySelector('[data-lunar-day]'),
      preview:el.querySelector('[data-lunar-preview]'),
      mode:'solar'
    };
    widgets.set(id,widget);

    el.querySelectorAll('[data-birth-mode]').forEach(btn => {
      btn.textContent = btn.dataset.birthMode === 'lunar' ? t('lunar') : t('solar');
      btn.addEventListener('click', () => setMode(widget,btn.dataset.birthMode));
    });

    populateYears(widget);
    widget.year.addEventListener('change', () => {
      populateMonths(widget);
      updateLunarPreview(widget);
    });
    widget.month.addEventListener('change', () => {
      populateDays(widget);
      updateLunarPreview(widget);
    });
    widget.day.addEventListener('change', () => updateLunarPreview(widget));

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
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',init,{once:true});
  } else {
    init();
  }
})();