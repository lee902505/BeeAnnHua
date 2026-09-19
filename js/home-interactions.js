(() => {
  const panels = document.querySelectorAll('.home-main .home-panel');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const interactiveSelector = 'a, button, input, select, textarea, [role="button"]';

  panels.forEach(panel => {
    let origin = null;
    let animationTimer = 0;
    let touchTimer = 0;

    const playTouchResponse = () => {
      panel.classList.remove('is-touching');
      // Restart the micro-response even when the previous one just finished.
      void panel.offsetWidth;
      panel.classList.add('is-touching');
      window.clearTimeout(touchTimer);
      touchTimer = window.setTimeout(() => panel.classList.remove('is-touching'), 360);
    };

    panel.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      origin = {id: event.pointerId, x: event.clientX, y: event.clientY};

      // On touch devices, touching any non-control area gives an immediate,
      // subtle response. Do not preventDefault: vertical page scrolling stays native.
      const interactive = event.target.closest(interactiveSelector);
      if (event.pointerType !== 'mouse' && !interactive && !reducedMotion.matches) {
        playTouchResponse();
      }
    });

    panel.addEventListener('pointerup', event => {
      if (!origin || origin.id !== event.pointerId) return;
      const distance = Math.hypot(event.clientX - origin.x, event.clientY - origin.y);
      origin = null;
      if (distance > 12 || reducedMotion.matches) return;

      // A true tap keeps the original, fuller response. Remove the touch micro-
      // animation first so the two transforms never fight each other.
      panel.classList.remove('is-touching');
      window.clearTimeout(touchTimer);
      panel.classList.remove('is-reacting');
      void panel.offsetWidth;
      panel.classList.add('is-reacting');
      window.clearTimeout(animationTimer);
      animationTimer = window.setTimeout(() => panel.classList.remove('is-reacting'), 700);
    });

    panel.addEventListener('pointercancel', () => { origin = null; });
    panel.addEventListener('lostpointercapture', () => { origin = null; });
  });
})();
