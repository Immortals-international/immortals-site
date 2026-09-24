// Decorative water motion starts only when visible. The still is always the fallback.
document.querySelectorAll('[data-scene-media]').forEach(media => {
  const video = media.querySelector('video');
  if (!video) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let failed = false;
  let blocked = false;
  let pending = false;
  const available = () => media.dataset.room === 'main-entrance' && !media.closest('[inert]') && !failed;
  const shouldPlay = () => available() && !reducedMotion.matches && !blocked && visible && !document.hidden;
  const showState = () => media.toggleAttribute('data-playing', !video.paused && shouldPlay());
  const sync = () => {
    if (!shouldPlay()) {
      video.pause();
      showState();
      return;
    }
    if (!video.paused || pending) return;
    pending = true;
    video.muted = true;
    video.play().catch(error => {
      // Switching rooms can cancel an outstanding play request without disabling motion.
      if (error.name !== 'AbortError') blocked = true;
    }).finally(() => {
      pending = false;
      if (!shouldPlay()) video.pause();
      showState();
      if (shouldPlay() && video.paused) sync();
    });
  };
  video.addEventListener('playing', () => {
    if (!shouldPlay()) video.pause();
    showState();
  });
  video.addEventListener('pause', showState);
  video.addEventListener('error', () => { failed = true; sync(); });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .25;
    sync();
  }, { threshold: [0, .25] }).observe(media);
  const observer = new MutationObserver(sync);
  observer.observe(media, { attributes:true, attributeFilter:['data-room'] });
  const slide = media.closest('.carousel-slide');
  if (slide) observer.observe(slide, { attributes:true, attributeFilter:['inert'] });
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  sync();
});
