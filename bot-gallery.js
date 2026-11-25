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

  const reactions = new Map();
  const highlights = new Map();
  const keyframes = {
    hop: [
      {transform:'translateY(0)'}, {transform:'translateY(-7px)',offset:.38},
      {transform:'translateY(0)'}
    ],
    lift: [
      {transform:'translateY(0) scale(1)'}, {transform:'translateY(-4px) scale(1.06)',offset:.45},
      {transform:'translateY(0) scale(1)'}
    ],
    wiggle: [
      {transform:'rotate(0)'}, {transform:'rotate(-7deg)',offset:.28},
      {transform:'rotate(6deg)',offset:.56}, {transform:'rotate(0)'}
    ]
  };
  function react(button) {
    const sprite = button.querySelector('img');
    if (!sprite) return;
    reactions.get(button)?.cancel();
    clearTimeout(highlights.get(button));
    button.classList.add('bot-reacting');
    highlights.set(button, setTimeout(() => {
      button.classList.remove('bot-reacting');
      highlights.delete(button);
    }, 500));
    if (preference.matches || !sprite.animate) return;
    const motion = keyframes[button.dataset.botMotion] || keyframes.hop;
    const animation = sprite.animate(motion, {duration:420,easing:'cubic-bezier(.22,.78,.25,1)'});
    reactions.set(button, animation);
    animation.finished.catch(() => {}).finally(() => {
      if (reactions.get(button) === animation) reactions.delete(button);
    });
  }
  for (const button of gallery.querySelectorAll('.bot-trigger')) {
    button.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') react(button);
    });
    button.addEventListener('click', () => react(button));
  }

  preference.addEventListener('change', () => {
    wantsMotion = !preference.matches;
    if (preference.matches) reactions.forEach(animation => animation.cancel());
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
