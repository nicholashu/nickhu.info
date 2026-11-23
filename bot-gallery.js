(() => {
  const gallery = document.querySelector('[data-bot-gallery]');
  if (!gallery) return;
  const images = [...gallery.querySelectorAll('[data-bot-gif]')];
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let wantsMotion = !preference.matches;
  let isVisible = !('IntersectionObserver' in window);

  images.forEach(image => { image.dataset.botStill = image.getAttribute('src'); });

  function update() {
    const playing = wantsMotion && isVisible && !document.hidden;
    images.forEach(image => {
      const source = playing ? image.dataset.botGif : image.dataset.botStill;
      if (image.getAttribute('src') !== source) image.setAttribute('src', source);
    });
  }

  preference.addEventListener('change', () => {
    wantsMotion = !preference.matches;
    update();
  });
  document.addEventListener('visibilitychange', update);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      isVisible = entries[0].isIntersecting;
      update();
    }, { threshold: 0 }).observe(gallery);
  }
  update();
})();
