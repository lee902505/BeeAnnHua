(() => {
  const panels = document.querySelectorAll('.home-main .home-panel');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  panels.forEach(panel => {
    let origin = null;
    let animationTimer = 0;

    panel.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      origin = {id: event.pointerId, x: event.clientX, y: event.clientY};
    });

    panel.addEventListener('pointerup', event => {
      if (!origin || origin.id !== event.pointerId) return;
      const distance = Math.hypot(event.clientX - origin.x, event.clientY - origin.y);
      origin = null;
      if (distance > 12 || reducedMotion.matches) return;

      panel.classList.remove('is-reacting');
      // Repeated taps should start a fresh response instead of waiting for the old one.
      void panel.offsetWidth;
      panel.classList.add('is-reacting');
      window.clearTimeout(animationTimer);
      animationTimer = window.setTimeout(() => panel.classList.remove('is-reacting'), 700);
    });

    panel.addEventListener('pointercancel', () => { origin = null; });
    panel.addEventListener('lostpointercapture', () => { origin = null; });
  });
})();
