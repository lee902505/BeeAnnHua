(() => {
  const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  if (motionQuery?.matches) return;

  const isHome = Boolean(document.querySelector('.home-main'));
  const hostSelector = isHome
    ? '.site-header, .home-panel'
    : [
        '.fortune-hero',
        '.fortune-stage',
        '.tarot-hero',
        '.tarot-stage',
        '.astrology-hero',
        '.astrology-form-section',
        '.synastry-hero',
        '.synastry-form-section',
        '.panel-astrology'
      ].join(',');

  const hosts = [...document.querySelectorAll(hostSelector)]
    .filter(host => host.getBoundingClientRect().width > 0);
  if (!hosts.length) return;

  const fields = new Map();
  const visibleHosts = new Set();
  let timer = 0;
  let activeCount = 0;

  hosts.forEach(host => {
    host.classList.add('xingchen-meteor-host');
    const field = document.createElement('div');
    field.className = 'xingchen-meteor-field';
    field.setAttribute('aria-hidden', 'true');
    host.appendChild(field);
    fields.set(host, field);
  });

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > .08) visibleHosts.add(entry.target);
          else visibleHosts.delete(entry.target);
        });
      }, {threshold:[0,.08,.25]})
    : null;

  hosts.forEach(host => observer?.observe(host));
  if (!observer) hosts.forEach(host => visibleHosts.add(host));

  function pageIsCovered() {
    return document.hidden ||
      document.body.classList.contains('profile-modal-open') ||
      document.body.classList.contains('city-picker-active');
  }

  function pickHost() {
    const candidates = [...visibleHosts].filter(host => {
      const rect = host.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    });
    const pool = candidates.length ? candidates : hosts;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function spawnMeteor() {
    if (pageIsCovered() || activeCount >= (isHome ? 2 : 1)) return;
    const host = pickHost();
    const field = fields.get(host);
    if (!field) return;

    const rect = host.getBoundingClientRect();
    const meteor = document.createElement('span');
    const isWish = isHome && Math.random() < .12;
    const length = Math.round((isHome ? 92 : 72) + Math.random() * (isHome ? 86 : 62));
    const duration = Math.round((isWish ? 1450 : 950) + Math.random() * 520);
    const startX = -length - Math.random() * Math.max(40, rect.width * .18);
    const startY = Math.max(8, rect.height * (.08 + Math.random() * .42));
    const travelX = rect.width + length * 2 + Math.random() * rect.width * .18;
    const travelY = Math.max(80, rect.height * (.28 + Math.random() * .24));

    meteor.className = `xingchen-meteor${isWish ? ' is-wish' : ''}`;
    meteor.style.setProperty('--meteor-length', `${length}px`);
    meteor.style.setProperty('--meteor-duration', `${duration}ms`);
    meteor.style.setProperty('--meteor-start-x', `${startX}px`);
    meteor.style.setProperty('--meteor-start-y', `${startY}px`);
    meteor.style.setProperty('--meteor-travel-x', `${travelX}px`);
    meteor.style.setProperty('--meteor-travel-y', `${travelY}px`);
    meteor.style.setProperty('--meteor-angle', `${18 + Math.random() * 9}deg`);

    activeCount += 1;
    field.appendChild(meteor);
    const clear = () => {
      if (!meteor.isConnected) return;
      meteor.remove();
      activeCount = Math.max(0, activeCount - 1);
    };
    meteor.addEventListener('animationend', clear, {once:true});
    window.setTimeout(clear, duration + 350);
  }

  function nextDelay() {
    const compact = window.matchMedia?.('(max-width: 760px)').matches;
    const min = isHome ? (compact ? 6500 : 4800) : (compact ? 11000 : 8200);
    const spread = isHome ? (compact ? 6500 : 5200) : (compact ? 9000 : 7600);
    return min + Math.random() * spread;
  }

  function schedule(initial=false) {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      spawnMeteor();
      schedule(false);
    }, initial ? (isHome ? 1100 : 2200) : nextDelay());
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) schedule(true);
  });
  motionQuery?.addEventListener?.('change', event => {
    if (!event.matches) return;
    window.clearTimeout(timer);
    observer?.disconnect();
    fields.forEach(field => field.remove());
  });

  schedule(true);
})();
