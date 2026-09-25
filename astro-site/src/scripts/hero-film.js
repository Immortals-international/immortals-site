const film = document.querySelector('[data-hero-film]');

if (film) {
  const hero = film.closest('.home-intro');
  const video = film.querySelector('video');
  const toggle = hero.querySelector('[data-hero-film-toggle]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData === true;
  let visible = false;
  let pausedByUser = false;
  let optedIn = false;
  let blocked = false;
  let failed = false;
  let pending = false;
  let frame = 0;

  const shouldPlay = () => visible && !document.hidden && !pausedByUser && !failed && !blocked
    && (optedIn || (!reducedMotion.matches && !saveData));

  function showControl() {
    toggle.hidden = failed;
    toggle.textContent = video.paused ? 'Play video' : 'Pause video';
  }

  async function syncPlayback() {
    if (!shouldPlay()) {
      video.pause();
      showControl();
      return;
    }
    if (!video.paused || pending) return;
    if (!video.getAttribute('src')) {
      // Delay the video download for reduced-motion and data-saving visitors.
      video.src = window.matchMedia('(max-width: 700px)').matches
        ? video.dataset.mobileSrc : video.dataset.desktopSrc;
    }
    pending = true;
    video.muted = true;
    try {
      await video.play();
    } catch (error) {
      if (error.name !== 'AbortError') blocked = true;
    } finally {
      pending = false;
      if (!shouldPlay()) video.pause();
      showControl();
      if (shouldPlay() && video.paused) syncPlayback();
    }
  }

  function updateParallax() {
    frame = 0;
    if (!visible && !reducedMotion.matches) return;
    const maxOffset = window.matchMedia('(max-width: 700px)').matches ? 32 : 64;
    const offset = reducedMotion.matches ? 0 : Math.min(maxOffset, Math.max(0, window.scrollY * .14));
    film.style.setProperty('--hero-offset', `${offset.toFixed(1)}px`);
  }

  function scheduleParallax() {
    if (!frame) frame = requestAnimationFrame(updateParallax);
  }

  video.addEventListener('playing', () => {
    film.setAttribute('data-ready', '');
    if (!shouldPlay()) video.pause();
    showControl();
  });
  video.addEventListener('pause', showControl);
  video.addEventListener('error', () => {
    failed = true;
    film.removeAttribute('data-ready');
    syncPlayback();
  });
  toggle.addEventListener('click', () => {
    pausedByUser = !video.paused;
    if (!pausedByUser) {
      optedIn = true;
      blocked = false;
    }
    syncPlayback();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio > .05;
    syncPlayback();
    scheduleParallax();
  }, { threshold: [0, .05] }).observe(hero);
  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', () => {
    optedIn = false;
    syncPlayback();
    scheduleParallax();
  });
  window.addEventListener('scroll', scheduleParallax, { passive: true });
  window.addEventListener('resize', scheduleParallax);
  showControl();
}
