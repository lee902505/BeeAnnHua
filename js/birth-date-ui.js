(() => {
  const widgets = new Map();

  const TEXT = {
    'zh-CN': {
      solar:'阳历', lunar:'阴历',
      year:'年份', month:'月份', day:'日期',
      converted:'换算阳历',
      lunarPrefix:'阴历', solarPrefix:'阳历',
      regularMonth:'普通{month}',
      leapMonth:'闰{month}',
      leapHint:'这一年有闰{month}，请选择普通月份或闰月份。',
      invalid:'这个农历日期不存在，请重新选择。'
    },
    'zh-TW': {
      solar:'陽曆', lunar:'陰曆',
      year:'年份', month:'月份', day:'日期',
      converted:'換算陽曆',
      lunarPrefix:'陰曆', solarPrefix:'陽曆',
      regularMonth:'普通{month}',
      leapMonth:'閏{month}',
      leapHint:'這一年有閏{month}，請選擇普通月份或閏月份。',
      invalid:'這個農曆日期不存在，請重新選擇。'
    },
    'en': {
      solar:'Solar', lunar:'Lunar',
      year:'Year', month:'Month', day:'Day',
      converted:'Solar date',
      lunarPrefix:'Lunar', solarPrefix:'Solar',
      regularMonth:'Regular {month}',
      leapMonth:'Leap {month}',
      leapHint:'This year has a leap {month}. Choose regular or leap month.',
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

  function monthLabel(month) {
    if (lang() === 'en') return `Month ${month}`;
    return (lang()==='zh-TW' ? MONTH_TW : MONTH_CN)[month] || `${month}月`;
  }

  function dayLabel(day) {
    return lang()==='en' ? `Day ${day}` : (DAY_CN[day] || String(day));
  }

  function formatTpl(template, values) {
    return Object.entries(values).reduce(
      (text,[key,value]) => text.replaceAll(`{${key}}`, value),
      template
    );
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
    widget.isLeap = false;
    hideLeapToggle(widget);
    clearPreview(widget);

    if (!year) return;

    for (let month=1; month<=12; month++) {
      widget.month.insertAdjacentHTML(
        'beforeend',
        `<option value="${month}">${monthLabel(month)}</option>`
      );
    }

    if (preferred && [...widget.month.options].some(o => o.value===String(preferred))) {
      widget.month.value = String(preferred);
      updateLeapToggle(widget);
      populateDays(widget);
    }
  }

  function hideLeapToggle(widget) {
    widget.leapWrap.hidden = true;
    widget.leapHint.hidden = true;
    widget.leapWrap.querySelectorAll('[data-leap-choice]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.leapChoice === 'regular');
      btn.setAttribute('aria-pressed', btn.dataset.leapChoice === 'regular' ? 'true' : 'false');
    });
  }

  function updateLeapToggle(widget) {
    const year = Number(widget.year.value);
    const month = Number(widget.month.value);
    const leapMonth = year ? window.XingchenLunar.leapMonth(year) : 0;

    widget.isLeap = false;

    if (!year || !month || leapMonth !== month) {
      hideLeapToggle(widget);
      return;
    }

    const label = monthLabel(month);
    const regularBtn = widget.leapWrap.querySelector('[data-leap-choice="regular"]');
    const leapBtn = widget.leapWrap.querySelector('[data-leap-choice="leap"]');

    regularBtn.textContent = formatTpl(t('regularMonth'), {month:label});
    leapBtn.textContent = formatTpl(t('leapMonth'), {month:label});
    widget.leapHint.textContent = formatTpl(t('leapHint'), {month:label});

    widget.leapWrap.hidden = false;
    widget.leapHint.hidden = false;

    regularBtn.classList.add('is-active');
    regularBtn.setAttribute('aria-pressed','true');
    leapBtn.classList.remove('is-active');
    leapBtn.setAttribute('aria-pressed','false');
  }

  function setLeapChoice(widget,isLeap) {
    widget.isLeap = Boolean(isLeap);

    widget.leapWrap.querySelectorAll('[data-leap-choice]').forEach(btn => {
      const active = (btn.dataset.leapChoice === 'leap') === widget.isLeap;
      btn.classList.toggle('is-active',active);
      btn.setAttribute('aria-pressed',active?'true':'false');
    });

    populateDays(widget);
  }

  function ensureDayGrid(widget) {
    if (widget.dayGrid) return widget.dayGrid;

    widget.day.hidden = true;
    widget.day.setAttribute('aria-hidden','true');

    const grid = document.createElement('div');
    grid.className = 'birth-lunar-day-grid';
    grid.dataset.lunarDayGrid = '';
    widget.day.insertAdjacentElement('afterend', grid);
    widget.dayGrid = grid;
    return grid;
  }

  function renderDayGrid(widget, count, preferred='') {
    const grid = ensureDayGrid(widget);
    const selected = preferred || widget.day.value || '';

    if (!count) {
      grid.hidden = true;
      grid.innerHTML = '';
      return;
    }

    grid.hidden = false;
    grid.innerHTML = Array.from({length:count}, (_,idx) => {
      const day = idx + 1;
      const active = String(day) === String(selected);
      return `<button type="button"
        class="birth-lunar-day-btn${active ? ' is-active' : ''}"
        data-lunar-day-value="${day}"
        aria-pressed="${active ? 'true' : 'false'}"
        title="${dayLabel(day)}">
        <span>${day}</span>
        <small>${dayLabel(day)}</small>
      </button>`;
    }).join('');

    grid.querySelectorAll('[data-lunar-day-value]').forEach(button => {
      button.addEventListener('click', () => {
        const value = button.dataset.lunarDayValue;
        widget.day.value = value;

        grid.querySelectorAll('[data-lunar-day-value]').forEach(other => {
          const active = other.dataset.lunarDayValue === value;
          other.classList.toggle('is-active',active);
          other.setAttribute('aria-pressed',active?'true':'false');
        });

        updatePreview(widget);
      });
    });
  }

  function populateDays(widget,preferred='') {
    const year = Number(widget.year.value);
    const month = Number(widget.month.value);

    widget.day.innerHTML = `<option value="">${t('day')}</option>`;
    clearPreview(widget);

    if (!year || !month) {
      renderDayGrid(widget,0);
      return;
    }

    const leapMonth = window.XingchenLunar.leapMonth(year);
    if (widget.isLeap && leapMonth !== month) {
      widget.isLeap = false;
    }

    const count = widget.isLeap
      ? window.XingchenLunar.leapDays(year)
      : window.XingchenLunar.monthDays(year,month);

    if (!count) {
      renderDayGrid(widget,0);
      showInvalid(widget);
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

    renderDayGrid(widget,count,preferred);
    updatePreview(widget);
  }

  function lunarInfo(widget) {
    if (widget.mode !== 'lunar') return null;

    const year = Number(widget.year.value);
    const month = Number(widget.month.value);
    const day = Number(widget.day.value);

    if (!year || !month || !day) return null;

    const solar = window.XingchenLunar.lunarToSolar(
      year, month, day, widget.isLeap
    );

    if (!solar) return null;

    const monthText = `${widget.isLeap ? (lang()==='zh-TW'?'閏':'闰') : ''}${monthLabel(month)}`;

    return {
      mode:'lunar',
      year,
      month,
      day,
      isLeap:widget.isLeap,
      date:solar.date,
      originalLabel:`${t('lunarPrefix')} ${year} ${monthText}${dayLabel(day)}`,
      convertedLabel:`${t('converted')}：${solar.cYear}/${String(solar.cMonth).padStart(2,'0')}/${String(solar.cDay).padStart(2,'0')}`
    };
  }

  function clearPreview(widget) {
    widget.preview.hidden = true;
    widget.preview.textContent = '';
    widget.preview.classList.remove('is-error');
  }

  function showInvalid(widget) {
    widget.preview.hidden = false;
    widget.preview.textContent = t('invalid');
    widget.preview.classList.add('is-error');
  }

  function updatePreview(widget) {
    widget.preview.classList.remove('is-error');

    const year = Number(widget.year.value);
    const month = Number(widget.month.value);
    const day = Number(widget.day.value);

    if (!year || !month || !day) {
      clearPreview(widget);
      return;
    }

    const info = lunarInfo(widget);
    if (!info) {
      showInvalid(widget);
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
    populateMonths(widget,String(lunar.lMonth));
    widget.month.value = String(lunar.lMonth);
    updateLeapToggle(widget);

    if (lunar.isLeap && !widget.leapWrap.hidden) {
      setLeapChoice(widget,true);
    } else {
      setLeapChoice(widget,false);
    }

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

  function ensureLeapUI(widget) {
    let hint = widget.lunarPanel.querySelector('[data-leap-hint]');
    let wrap = widget.lunarPanel.querySelector('[data-leap-toggle]');

    if (!hint) {
      hint = document.createElement('small');
      hint.className = 'birth-leap-hint';
      hint.dataset.leapHint = '';
      hint.hidden = true;
      widget.lunarPanel.appendChild(hint);
    }

    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'birth-leap-toggle';
      wrap.dataset.leapToggle = '';
      wrap.hidden = true;
      wrap.innerHTML = `
        <button type="button" class="birth-leap-btn is-active" data-leap-choice="regular" aria-pressed="true"></button>
        <button type="button" class="birth-leap-btn" data-leap-choice="leap" aria-pressed="false"></button>
      `;
      widget.lunarPanel.insertBefore(wrap,hint);
    }

    widget.leapWrap = wrap;
    widget.leapHint = hint;

    wrap.querySelector('[data-leap-choice="regular"]').addEventListener('click',() => {
      setLeapChoice(widget,false);
    });

    wrap.querySelector('[data-leap-choice="leap"]').addEventListener('click',() => {
      setLeapChoice(widget,true);
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
      solarPanel:el.querySelector('[data-birth-solar-panel]'),
      lunarPanel:el.querySelector('[data-birth-lunar-panel]'),
      mode:'solar',
      isLeap:false
    };

    widgets.set(id,widget);
    ensureLeapUI(widget);
    ensureDayGrid(widget);

    el.querySelectorAll('[data-birth-mode]').forEach(btn => {
      btn.textContent = btn.dataset.birthMode==='lunar' ? t('lunar') : t('solar');
      btn.addEventListener('click',() => setMode(widget,btn.dataset.birthMode));
    });

    populateYears(widget);

    widget.year.addEventListener('change',() => populateMonths(widget));

    widget.month.addEventListener('change',() => {
      updateLeapToggle(widget);
      populateDays(widget);
    });

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
      const widget = widgets.get(id);
      if (widget) setMode(widget,mode);
    }
  };

  if (document.readyState==='loading') {
    document.addEventListener('DOMContentLoaded',init,{once:true});
  } else {
    init();
  }
})();