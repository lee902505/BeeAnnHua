(() => {
  const widgets = new Map();

  const TEXT = {
    'zh-CN': {
      solar:'阳历', lunar:'农历',
      year:'年份', month:'月份', day:'日期',
      converted:'换算阳历', leap:'闰',
      lunarPrefix:'农历', solarPrefix:'阳历',
      invalid:'这个农历日期不存在，请重新选择。'
    },
    'zh-TW': {
      solar:'陽曆', lunar:'農曆',
      year:'年份', month:'月份', day:'日期',
      converted:'換算陽曆', leap:'閏',
      lunarPrefix:'農曆', solarPrefix:'陽曆',
      invalid:'這個農曆日期不存在，請重新選擇。'
    },
    'en': {
      solar:'Solar', lunar:'Lunar',
      year:'Year', month:'Month', day:'Day',
      converted:'Solar date', leap:'Leap ',
      lunarPrefix:'Lunar', solarPrefix:'Solar',
      invalid:'This lunar date does not exist. Please choose again.'
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

  function monthLabel(month,isLeap=false) {
    let base;
    if (lang() === 'en') base = `Month ${month}`;
    else base = (lang()==='zh-TW' ? MONTH_TW : MONTH_CN)[month] || `${month}月`;
    return isLeap ? `${t('leap')}${base}` : base;
  }

  function dayLabel(day) {
    return lang()==='en' ? `Day ${day}` : (DAY_CN[day] || String(day));
  }

  function setMode(widget,mode,sync=true) {
    widget.mode = mode === 'lunar' ? 'lunar' : 'solar';

    widget.solarPanel.hidden = widget.mode !== 'solar';
    widget.lunarPanel.hidden = widget.mode !== 'lunar';

    widget.el.querySelectorAll('[data-birth-mode]').forEach(btn => {
      const active = btn.dataset.birthMode === widget.mode;
      btn.classList.toggle('is-active',active);
      btn.setAttribute('aria-pressed',active?'true':'false');
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
    const max = Math.min(new Date().getFullYear(), window.XingchenLunar.MAX_YEAR);
    widget.year.innerHTML = `<option value="">${t('year')}</option>`;

    for (let year=max; year>=window.XingchenLunar.MIN_YEAR; year--) {
      widget.year.insertAdjacentHTML('beforeend',`<option value="${year}">${year}</option>`);
    }
  }

  function populateMonths(widget,preferred='') {
    const year = Number(widget.year.value);

    widget.month.innerHTML = `<option value="">${t('month')}</option>`;
    widget.day.innerHTML = `<option value="">${t('day')}</option>`;
    widget.preview.hidden = true;
    widget.preview.textContent = '';
    widget.preview.classList.remove('is-error');

    if (!year) return;

    const leap = window.XingchenLunar.leapMonth(year);

    for (let month=1; month<=12; month++) {
      widget.month.insertAdjacentHTML(
        'beforeend',
        `<option value="${month}">${monthLabel(month,false)}</option>`
      );

      if (leap === month) {
        widget.month.insertAdjacentHTML(
          'beforeend',
          `<option value="L${month}">${monthLabel(month,true)}</option>`
        );
      }
    }

    if (preferred && [...widget.month.options].some(o => o.value===preferred)) {
      widget.month.value = preferred;
      populateDays(widget);
    }
  }

  function populateDays(widget,preferred='') {
    const year = Number(widget.year.value);
    const rawMonth = widget.month.value;

    widget.day.innerHTML = `<option value="">${t('day')}</option>`;
    widget.preview.hidden = true;
    widget.preview.textContent = '';
    widget.preview.classList.remove('is-error');

    if (!year || !rawMonth) return;

    const isLeap = rawMonth.startsWith('L');
    const month = Number(rawMonth.replace('L',''));

    const count = isLeap
      ? window.XingchenLunar.leapDays(year)
      : window.XingchenLunar.monthDays(year,month);

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

    if (preferred && [...widget.day.options].some(o => o.value===String(preferred))) {
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
    const solar = window.XingchenLunar.lunarToSolar(year,month,day,isLeap);

    if (!solar) return null;

    return {
      mode:'lunar',
      year,
      month,
      day,
      isLeap,
      date:solar.date,
      originalLabel:`${t('lunarPrefix')} ${year} ${monthLabel(month,isLeap)}${dayLabel(day)}`,
      convertedLabel:`${t('converted')}：${solar.cYear}/${String(solar.cMonth).padStart(2,'0')}/${String(solar.cDay).padStart(2,'0')}`
    };
  }

  function updatePreview(widget) {
    widget.preview.classList.remove('is-error');

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
    if (!widget.solarInput.value) return;

    const [year,month,day] = widget.solarInput.value.split('-').map(Number);
    if (!year || !month || !day) return;

    const lunar = window.XingchenLunar.solarToLunar(year,month,day);
    if (!lunar) return;

    widget.year.value = String(lunar.lYear);
    const monthValue = `${lunar.isLeap?'L':''}${lunar.lMonth}`;

    populateMonths(widget,monthValue);
    populateDays(widget,lunar.lDay);
  }

  function getInfo(id) {
    const widget = widgets.get(id);
    if (!widget) return null;

    if (widget.mode === 'lunar') return lunarInfo(widget);

    const date = widget.solarInput.value;

    return {
      mode:'solar',
      date,
      originalLabel:date ? `${t('solarPrefix')} ${date.replaceAll('-','/')}` : '',
      convertedLabel:''
    };
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
      solarPanel:el.querySelector('[data-birth-solar-panel]'),
      lunarPanel:el.querySelector('[data-birth-lunar-panel]'),
      mode:'solar'
    };

    widgets.set(id,widget);

    el.querySelectorAll('[data-birth-mode]').forEach(btn => {
      btn.textContent = btn.dataset.birthMode==='lunar' ? t('lunar') : t('solar');
      btn.addEventListener('click',() => setMode(widget,btn.dataset.birthMode));
    });

    populateYears(widget);

    widget.year.addEventListener('change',() => populateMonths(widget));
    widget.month.addEventListener('change',() => populateDays(widget));
    widget.day.addEventListener('change',() => updatePreview(widget));

    setMode(widget,'solar',false);
  }

  function init() {
    document.querySelectorAll('[data-birth-date-widget]').forEach(initWidget);
  }

  window.XingchenBirthDate = {
    getInfo,
    getDate:id => getInfo(id)?.date || '',
    setMode:(id,mode) => {
      const widget=widgets.get(id);
      if (widget) setMode(widget,mode);
    }
  };

  if (document.readyState==='loading') {
    document.addEventListener('DOMContentLoaded',init,{once:true});
  } else {
    init();
  }
})();