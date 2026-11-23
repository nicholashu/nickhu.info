const mounted = new WeakMap();
const HOLD = 1900;
const ARRIVAL = 620;
// Every original stays in the pile. Horizontal poses span the available
// container width; only the page arriving on top moves as the loop advances.
const POSES = [
  [-.76, -.28, -9, .98],
  [.44, -.42, 7, 1],
  [-.98, .28, -6, .98],
  [.88, -.22, 8, 1],
  [-.30, -.62, -4, .98],
  [.68, .56, 6, .99],
  [-.92, .42, -11, .98],
  [0, 0, 4.5, 1],
  [-.58, .62, -3, 1],
  [.98, .12, 10, .98],
  [.12, -.56, 3, 1],
  [-.86, -.48, -7, .99],
  [.72, -.60, 5, .98],
  [-.08, .34, -1, 1],
  [.38, .44, -2.5, 1]
];
const wrap = (index, count) => (index % count + count) % count;

/** Enhance the static original-image links. Accepts the stack or its project panel. */
export function mountWorksheetStack(container) {
  const root = container?.matches('[data-worksheet-stack]')
    ? container : container?.querySelector('[data-worksheet-stack]');
  if (!root) return null;
  if (mounted.has(root)) return mounted.get(root);
  const stage = root.querySelector('[data-stack-stage]');
  const cards = [...root.querySelectorAll('[data-stack-sheet]')];
  const links = cards.map(card => card.querySelector('[data-lightbox]'));
  const controls = root.querySelector('[data-stack-controls]');
  const title = root.querySelector('[data-stack-title]');
  const position = root.querySelector('[data-stack-position]');
  const announcement = root.querySelector('[data-stack-announcement]');
  if (!stage || cards.length < 2 || links.some(link => !link) || !controls) return null;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const dialog = document.getElementById('image-dialog');
  const events = new AbortController();
  const listen = (node, type, callback, options = {}) =>
    node?.addEventListener(type, callback, { ...options, signal: events.signal });
  const original = cards.map((card, i) => ({
    style: card.getAttribute('style'), className: card.className,
    hidden: card.hidden, inert: card.inert,
    ariaHidden: card.getAttribute('aria-hidden'), tabIndex: links[i].getAttribute('tabindex')
  }));
  const restoreAttribute = (node, name, value) => value === null
    ? node.removeAttribute(name) : node.setAttribute(name, value);
  let current = 0, timer = 0, deadline = 0, remaining = 1100;
  let animation = null, landingCard = null, hovered = false, pressed = false;
  let loading = false, epoch = 0, destroyed = false;

  function visible() {
    if (!root.isConnected || root.closest('[hidden]') || document.hidden) return false;
    const rect = stage.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight;
  }
  function inspecting() {
    return hovered || pressed || root.contains(document.activeElement) || Boolean(dialog?.open);
  }
  function canRun() { return !destroyed && !reduced.matches && visible() && !inspecting(); }
  function stopTimer() {
    if (!timer) return;
    remaining = Math.max(150, deadline - performance.now());
    clearTimeout(timer);
    timer = 0;
  }
  function cancelLanding() {
    const previous = animation;
    animation = null;
    previous?.cancel();
    landingCard?.classList.remove('is-landing');
    landingCard = null;
  }
  function transform(index, entering = false) {
    const [, , angle, scale] = POSES[index % POSES.length];
    return `translate(-50%, -50%) translate(var(--sheet-x, 0px), var(--sheet-y, 0px)) translate(${entering ? 14 : 0}%, ${entering ? -42 : 0}%) rotate(${angle + (entering ? 9 : 0)}deg) scale(${scale * (entering ? 1.045 : 1)})`;
  }
  function paint() {
    cards.forEach((card, index) => {
      const depth = wrap(current - index, cards.length);
      const top = depth === 0;
      card.hidden = false;
      card.inert = !top;
      card.classList.toggle('is-top', top);
      card.classList.add('is-visible');
      card.style.transform = transform(index);
      card.style.zIndex = String(cards.length - depth);
      if (top) card.removeAttribute('aria-hidden');
      else card.setAttribute('aria-hidden', 'true');
      links[index].tabIndex = top ? 0 : -1;
    });
    title.textContent = links[current].dataset.worksheetTitle;
    position.textContent = `${current + 1} / ${cards.length}`;
    root.dataset.currentWorksheet = String(current);
  }
  function warm(index) {
    const img = links[index].querySelector('img');
    if (!img) return Promise.resolve();
    img.loading = 'eager';
    return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
  }
  function schedule() {
    if (timer || animation || loading || !canRun()) return;
    deadline = performance.now() + remaining;
    timer = setTimeout(async () => {
      timer = 0;
      const ticket = ++epoch;
      const next = current + 1;
      loading = true;
      await warm(wrap(next, cards.length));
      loading = false;
      if (destroyed) return;
      if (ticket !== epoch) { reconcile(); return; }
      if (!canRun()) { remaining = 500; reconcile(); return; }
      select(next, { animate: true });
    }, remaining);
  }
  function select(index, { animate = false, announce = false, focus = false } = {}) {
    if (destroyed) return;
    epoch += 1;
    stopTimer();
    cancelLanding();
    current = wrap(index, cards.length);
    paint();
    warm(current);
    remaining = HOLD;
    if (announce) announcement.textContent = `${title.textContent}, ${current + 1} of ${cards.length}.`;
    if (focus) links[current].focus({ preventScroll: true });
    if (animate && canRun() && typeof cards[current].animate === 'function') {
      const card = cards[current];
      landingCard = card;
      card.classList.add('is-landing');
      const motion = card.animate([
        { transform: transform(current, true), opacity: 0 },
        { transform: transform(current), opacity: 1 }
      ], { duration: ARRIVAL, easing: 'cubic-bezier(.16,1,.3,1)' });
      animation = motion;
      motion.finished.then(() => {
        if (animation !== motion) return;
        animation = null;
        card.classList.remove('is-landing');
        landingCard = null;
        remaining = HOLD;
        reconcile();
      }).catch(() => {});
    }
    reconcile();
  }
  function resize() {
    const { width, height } = stage.getBoundingClientRect();
    if (width && height) {
      // Preserve each original's paper shape. Portrait pages use their own
      // width and can spread farther sideways than landscape pages.
      const narrow = width <= 520;
      const proportion = narrow ? .56 : .50;
      const heightCap = narrow ? .78 : .72;
      const edge = Math.max(8, Math.min(16, width * .025));
      cards.forEach((card, index) => {
        const image = links[index].querySelector('img');
        const ratio = Number(image?.getAttribute('width')) / Number(image?.getAttribute('height')) || 1.414;
        const [x, y, angle, scale] = POSES[index % POSES.length];
        const pageWidth = Math.min(width * proportion, height * heightCap * ratio);
        const pageHeight = pageWidth / ratio;
        const radians = Math.abs(angle) * Math.PI / 180;
        const boundsWidth = scale * (pageWidth * Math.cos(radians) + pageHeight * Math.sin(radians));
        const boundsHeight = scale * (pageHeight * Math.cos(radians) + pageWidth * Math.sin(radians));
        card.style.setProperty('--sheet-width', `${pageWidth}px`);
        card.style.setProperty('--sheet-x', `${x * Math.max(0, (width - boundsWidth) / 2 - edge)}px`);
        card.style.setProperty('--sheet-y', `${y * Math.max(0, (height - boundsHeight) / 2 - edge)}px`);
      });
    }
  }
  function reconcile() {
    if (destroyed) return;
    if (!visible() || reduced.matches) {
      stopTimer();
      cancelLanding();
      remaining = Math.max(600, remaining);
      return;
    }
    if (inspecting()) {
      stopTimer();
      if (animation?.playState === 'running') animation.pause();
      return;
    }
    if (animation?.playState === 'paused') animation.play();
    else schedule();
  }
  const refresh = () => {
    resize();
    // Leave inactive project images lazy. Decode the active page when the
    // preview becomes visible; the browser can load the surrounding pile.
    if (visible()) warm(current);
    reconcile();
  };
  const manual = delta => select(current + delta, { announce: true });
  listen(root.querySelector('[data-stack-previous]'), 'click', () => manual(-1));
  listen(root.querySelector('[data-stack-next]'), 'click', () => manual(1));
  listen(root, 'keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const focusedLink = event.target.closest('[data-lightbox]');
    const from = focusedLink ? links.indexOf(focusedLink) : current;
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : from + (event.key === 'ArrowRight' ? 1 : -1);
    select(index, { announce: true, focus: Boolean(focusedLink) });
  });
  listen(root, 'pointerenter', event => { if (event.pointerType !== 'touch') { hovered = true; reconcile(); } });
  listen(root, 'pointerleave', event => { if (event.pointerType !== 'touch') { hovered = false; reconcile(); } });
  listen(root, 'pointerdown', () => { pressed = true; reconcile(); });
  listen(document, 'pointerup', () => { pressed = false; reconcile(); });
  listen(document, 'pointercancel', () => { pressed = false; reconcile(); });
  listen(root, 'focusin', reconcile);
  listen(root, 'focusout', () => queueMicrotask(reconcile));
  // Pause synchronously before the existing lightbox reads its source geometry.
  listen(root, 'click', event => {
    if (!event.target.closest('[data-lightbox]')) return;
    stopTimer();
    animation?.pause();
    queueMicrotask(reconcile);
  }, { capture: true });
  listen(document, 'projectchange', refresh);
  listen(document, 'mediaviewchange', refresh);
  listen(document, 'visibilitychange', reconcile);
  listen(reduced, 'change', reconcile);
  listen(dialog, 'close', () => queueMicrotask(reconcile));
  const dialogObserver = dialog ? new MutationObserver(reconcile) : null;
  dialogObserver?.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  const intersection = 'IntersectionObserver' in window ? new IntersectionObserver(reconcile, { threshold: [0, .1] }) : null;
  intersection?.observe(stage);
  const sizes = 'ResizeObserver' in window ? new ResizeObserver(refresh) : null;
  sizes?.observe(stage);
  if (!intersection) listen(window, 'scroll', reconcile, { passive: true });
  if (!sizes) listen(window, 'resize', refresh, { passive: true });

  root.classList.add('worksheet-stack-ready');
  controls.hidden = false;
  paint();
  refresh();
  const api = {
    next: () => manual(1), previous: () => manual(-1),
    destroy() {
      destroyed = true;
      epoch += 1;
      stopTimer();
      cancelLanding();
      events.abort();
      intersection?.disconnect();
      sizes?.disconnect();
      dialogObserver?.disconnect();
      cards.forEach((card, index) => {
        const state = original[index];
        restoreAttribute(card, 'style', state.style);
        card.className = state.className;
        card.hidden = state.hidden;
        card.inert = state.inert;
        restoreAttribute(card, 'aria-hidden', state.ariaHidden);
        restoreAttribute(links[index], 'tabindex', state.tabIndex);
      });
      controls.hidden = true;
      root.classList.remove('worksheet-stack-ready');
      delete root.dataset.currentWorksheet;
      mounted.delete(root);
    }
  };
  mounted.set(root, api);
  return api;
}
