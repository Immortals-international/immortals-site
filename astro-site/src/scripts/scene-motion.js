// The approved still remains visible until video playback actually starts.
document.querySelectorAll('[data-scene-media]').forEach(media => {
  const video = media.querySelector('video');
  const control = media.querySelector('[data-water-toggle]');
  if (!video || !control) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let requested = !reducedMotion.matches;
  let visible = false;
  let failed = false;
  let pending = false;
  const available = () => media.dataset.room === 'main-entrance' && !media.closest('[inert]') && !failed;
  const shouldPlay = () => available() && requested && visible && !document.hidden;
  const label = () => {
    const playing = !video.paused;
    control.textContent = playing ? 'Pause water' : 'Play water';
    control.setAttribute('aria-label', playing ? 'Pause water animation' : 'Play water animation');
    media.toggleAttribute('data-playing', playing);
  };
  const sync = () => {
    control.hidden = !available();
    if (!shouldPlay()) {
      video.pause();
      label();
      return;
    }
    if (!video.paused || pending) return;
    pending = true;
    video.muted = true;
    video.play().catch(error => {
      // Switching rooms can cancel an outstanding play request.
      if (error.name !== 'AbortError') requested = false;
    }).finally(() => {
      pending = false;
      if (!shouldPlay()) video.pause();
      label();
      if (shouldPlay() && video.paused) sync();
    });
  };
  control.addEventListener('click', () => {
    requested = video.paused;
    sync();
  });
  video.addEventListener('playing', () => {
    if (!shouldPlay()) video.pause();
    label();
  });
  video.addEventListener('pause', label);
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
  reducedMotion.addEventListener('change', () => { requested = !reducedMotion.matches; sync(); });
  sync();
});
