const story = document.querySelector('.home-layout');

if (story) {
  const stage = story.querySelector('.home-layout-sticky');
  const grid = story.querySelector('.home-layout-grid');
  const preview = story.querySelector('.home-plan');
  const images = [...story.querySelectorAll('[data-plan-preview]')];
  const options = [...story.querySelectorAll('[data-plan-option]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let pinned = false;
  let frame = 0;

  function selectPlan(index) {
    if (!images[index] || active === index) return;
    active = index;
    images.forEach((image, i) => {
      image.classList.toggle('is-active', i === index);
      image.setAttribute('aria-hidden', String(i !== index));
      options[i].setAttribute('aria-pressed', String(i === index));
    });
    preview.setAttribute('aria-label', `Explore the layouts: ${images[index].dataset.planName} floor plan`);
  }

  function geometry() {
    return {
      top: story.getBoundingClientRect().top,
      header: parseFloat(getComputedStyle(story).getPropertyValue('--story-header')),
      travel: story.offsetHeight - stage.offsetHeight,
    };
  }

  function update() {
    frame = 0;
    if (!pinned) return;
    const { top, header, travel } = geometry();
    if (!Number.isFinite(header) || travel <= 0) return;
    const progress = Math.max(0, Math.min(1, (header - top) / travel));
    selectPlan(Math.min(images.length - 1, Math.floor(progress * images.length)));
  }

  function scheduleUpdate() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  function resize() {
    // Keep a normal, selectable preview when the full scene cannot fit on screen.
    pinned = !reducedMotion.matches && window.innerHeight >= 600;
    story.classList.toggle('is-scroll-story', pinned);
    if (pinned) {
      const padding = getComputedStyle(stage);
      const available = stage.clientHeight - parseFloat(padding.paddingTop) - parseFloat(padding.paddingBottom);
      if (grid.getBoundingClientRect().height > available + 1) {
        pinned = false;
        story.classList.remove('is-scroll-story');
      }
    }
    scheduleUpdate();
  }

  options.forEach((button, index) => {
    button.addEventListener('click', () => {
      selectPlan(index);
      if (!pinned) return;
      const { top, header, travel } = geometry();
      if (!Number.isFinite(header) || travel <= 0) return;
      // Move to the middle of the selected option's scroll interval.
      window.scrollTo({
        top: window.scrollY + top - header + travel * (index + 0.5) / images.length,
        behavior: 'instant',
      });
    });
  });

  story.querySelector('.home-plan-options').hidden = false;
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', resize);
  reducedMotion.addEventListener('change', resize);
  document.fonts.ready.then(resize);
  resize();
}
