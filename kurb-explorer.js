// Optional KURB explanations. Routes and embedding positions are illustrative;
// the images remain unchanged crops from the real product capture.
const clamp = value => Math.min(1, Math.max(0, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const between = (value, from, to) => smooth((value - from) / (to - from));
const lerp = (from, to, t) => from + (to - from) * t;
const opacity = (node, value) => { if (node) node.style.opacity = clamp(value).toFixed(3); };
const views = {
  product: 'Search second-hand fashion across vendors. Live product capture, November 2026.',
  collection: 'Listings from different vendors are collected and normalised into one searchable catalogue. Illustrative flow.',
  similarity: 'Image embeddings connect a query garment to visually similar listings across vendors. Illustrative flow.'
};
// Staggered routes keep two or three garments in flight without moving as one batch.
const deliveries = [
  { source: 0, x: 314, y: 85, cx: 428, cy: 85, angle: -8 },
  { source: 6, x: 786, y: 85, cx: 672, cy: 85, angle: 8 },
  { source: 4, x: 314, y: 389, cx: 422, cy: 405, angle: 7 },
  { source: 11, x: 786, y: 465, cx: 670, cy: 453, angle: -7 }
];
const DELIVERY_INTERVAL = 850;
const DELIVERY_DURATION = 2250;
const DELIVERY_CYCLE = DELIVERY_INTERVAL * deliveries.length;
const SIMILARITY_CYCLE = 4800;
const FRAME_INTERVAL = 1000 / 30;

export function mountKurbExplorer(root, { resize = update => update() } = {}) {
  if (!root) return null;
  const diagram = root.querySelector('.kurb-diagram');
  const result = root.querySelector('.kurb-result');
  const collection = root.querySelector('.kurb-collection');
  const vectors = root.querySelector('.kurb-vectors');
  if (!diagram || !result || !collection || !vectors) return null;

  const stage = root.querySelector('.kurb-visual') || diagram;
  const buttons = [...root.querySelectorAll('[data-kurb-view]')];
  const captions = [...root.querySelectorAll('[data-kurb-caption]')];
  const paths = [...root.querySelectorAll('[data-flow-path]')];
  const garments = [...root.querySelectorAll('[data-garment]')];
  const vectorPaths = [...root.querySelectorAll('[data-vector-path]')];
  const neighbours = root.querySelector('.kurb-neighbour-links');
  const neighbourDots = [...vectors.querySelectorAll('.kurb-neighbour')];
  const matches = [...root.querySelectorAll('[data-match]')];
  const resultLink = result.querySelector('a');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 520px)');
  const mobileCollection = root.querySelector('.kurb-mobile-collection');
  const mobileVectors = root.querySelector('.kurb-mobile-vectors');
  const mobilePaths = [...root.querySelectorAll('[data-mobile-flow]')];
  const mobileGarments = [...root.querySelectorAll('[data-mobile-garment]')];
  const mobileVectorPaths = [...root.querySelectorAll('[data-mobile-vector]')];
  const mobileNeighbours = root.querySelector('[data-mobile-neighbour-links]');
  const mobileDots = [...root.querySelectorAll('.kurb-mobile-vectors .kurb-neighbour')];
  const mobileMatches = [...root.querySelectorAll('[data-mobile-match]')];
  let selected = 'product';
  let frame = 0;
  let elapsed = 0;
  let lastTime = null;
  let lastPaint = 0;
  let onscreen = false;
  let observer;
  let resultInteractive;

  const panelHidden = () => Boolean(root.closest('[hidden], [aria-hidden="true"]'));
  function inViewport() {
    if (observer) return onscreen;
    const rect = stage.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
  }
  const canRun = () => selected !== 'product' && !document.hidden && !reduced.matches && !panelHidden() && inViewport();

  function updateResultInteraction() {
    const interactive = selected === 'product' && !document.hidden && !panelHidden();
    if (interactive === resultInteractive) return;
    result.inert = !interactive;
    result.setAttribute('aria-hidden', String(!interactive));
    result.style.pointerEvents = interactive ? 'auto' : 'none';
    if (resultLink) resultLink.tabIndex = interactive ? 0 : -1;
    resultInteractive = interactive;
  }

  function placeGarment(node, x, y, angle, scale) {
    node.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle.toFixed(2)}) scale(${scale.toFixed(3)}) translate(-67 -89)`);
  }

  function renderCollection(time, still) {
    opacity(collection, 1);
    opacity(vectors, 0);
    const phases = deliveries.map((route, index) => {
      const age = ((time - index * DELIVERY_INTERVAL) % DELIVERY_CYCLE + DELIVERY_CYCLE) % DELIVERY_CYCLE;
      const local = age / DELIVERY_DURATION;
      return { active: age < DELIVERY_DURATION, travel: between(local, .04, .88), alpha: between(local, 0, .06) * (1 - between(local, .84, 1)) };
    });
    paths.forEach((path, index) => {
      const routeIndex = deliveries.findIndex(route => route.source === index);
      const phase = phases[routeIndex];
      path.style.strokeDashoffset = still ? '0' : (1 - (phase?.travel || 0)).toFixed(3);
      opacity(path, still ? .35 : phase?.active ? .9 * phase.alpha : 0);
    });
    garments.forEach((node, index) => {
      const route = deliveries[index];
      if (!route) { opacity(node, 0); return; }
      if (still) {
        placeGarment(node, route.x, route.y, route.angle, .54);
        opacity(node, 1);
        return;
      }
      const phase = phases[index];
      if (!phase.active) { opacity(node, 0); return; }
      const t = phase.travel;
      const inverse = 1 - t;
      const x = inverse * inverse * route.x + 2 * inverse * t * route.cx + t * t * 550;
      const y = inverse * inverse * route.y + 2 * inverse * t * route.cy + t * t * 310;
      placeGarment(node, x, y, lerp(route.angle, 0, t), lerp(.66, .27, t));
      opacity(node, phase.alpha);
    });
  }

  function renderSimilarity(time, still) {
    opacity(collection, 0);
    opacity(vectors, 1);
    const phase = (time % SIMILARITY_CYCLE) / SIMILARITY_CYCLE;
    const finish = still ? 1 : 1 - between(phase, .89, 1);
    const routeStarts = [.035, .29, .47];
    const routeEnds = [.23, .41, .59];
    vectorPaths.forEach((path, index) => {
      const reveal = still ? 1 : between(phase, routeStarts[index], routeEnds[index]);
      path.style.strokeDashoffset = (1 - reveal).toFixed(3);
      opacity(path, finish);
    });
    const neighbourhood = still ? 1 : between(phase, .19, .32) * finish;
    if (neighbours) {
      neighbours.style.strokeDashoffset = (1 - neighbourhood).toFixed(3);
      opacity(neighbours, neighbourhood);
    }
    neighbourDots.forEach(node => { node.style.opacity = (.35 + .65 * neighbourhood).toFixed(3); });
    matches.forEach((node, index) => {
      const reveal = still ? 1 : between(phase, index === 0 ? .35 : .53, index === 0 ? .46 : .64);
      const x = 873 + (1 - reveal) * 20;
      const y = index === 0 ? 96 : 341;
      node.setAttribute('transform', `translate(${x.toFixed(2)} ${y}) rotate(${index === 0 ? 5 : -5} 67 89)`);
      opacity(node, reveal * finish);
    });
  }

  function renderMobileCollection(time, still) {
    const starts = [80,190,290,400];
    mobilePaths.forEach((path, i) => {
      const age = ((time - i * DELIVERY_INTERVAL) % DELIVERY_CYCLE + DELIVERY_CYCLE) % DELIVERY_CYCLE;
      const local = age / DELIVERY_DURATION;
      const active = age < DELIVERY_DURATION;
      const travel = still ? .36 : between(local, .04, .88);
      const alpha = still ? 1 : between(local, 0, .06) * (1 - between(local, .84, 1));
      path.style.strokeDashoffset = still ? '0' : (1 - travel).toFixed(3);
      opacity(path, still ? .55 : active ? alpha : 0);
      const garment = mobileGarments[i];
      if (!garment) return;
      const x = lerp(starts[i], 240, travel * travel);
      const y = lerp(245, 415, travel);
      placeGarment(garment, x, y, lerp(i % 2 ? 8 : -8, 0, travel), lerp(.63, .35, travel));
      opacity(garment, still || active ? alpha : 0);
    });
  }

  function renderMobileSimilarity(time, still) {
    const phase = (time % SIMILARITY_CYCLE) / SIMILARITY_CYCLE;
    const finish = still ? 1 : 1 - between(phase, .89, 1);
    const starts = [.035, .29, .47];
    const ends = [.23, .41, .59];
    mobileVectorPaths.forEach((path, i) => {
      const reveal = still ? 1 : between(phase, starts[i], ends[i]);
      path.style.strokeDashoffset = (1 - reveal).toFixed(3);
      opacity(path, finish);
    });
    const neighbourhood = still ? 1 : between(phase, .19, .32) * finish;
    if (mobileNeighbours) {
      mobileNeighbours.style.strokeDashoffset = (1 - neighbourhood).toFixed(3);
      opacity(mobileNeighbours, neighbourhood);
    }
    mobileDots.forEach(node => opacity(node, .35 + .65 * neighbourhood));
    mobileMatches.forEach((node, i) => {
      const reveal = still ? 1 : between(phase, i === 0 ? .35 : .53, i === 0 ? .46 : .64);
      node.setAttribute('transform', `translate(${i === 0 ? 63 : 283} ${(335 + (1-reveal)*12).toFixed(2)}) scale(1.02)`);
      opacity(node, reveal * finish);
    });
  }

  function updateLayout() {
    const mobile = compact.matches && mobileCollection && mobileVectors;
    diagram.dataset.layout = mobile ? 'mobile' : 'desktop';
    diagram.setAttribute('viewBox', mobile ? '0 0 480 600' : '0 0 1100 720');
  }

  function onLayoutChange() {
    updateLayout();
    render(reduced.matches || !inViewport());
    reconcile();
  }

  function render(still = false) {
    const product = selected === 'product';
    opacity(diagram, product ? 0 : 1);
    opacity(result, product ? 1 : 0);
    result.style.transform = 'none';
    const mobile = diagram.dataset.layout === 'mobile';
    opacity(mobileCollection, selected === 'collection' ? 1 : 0);
    opacity(mobileVectors, selected === 'similarity' ? 1 : 0);
    if (selected === 'collection') {
      if (mobile) renderMobileCollection(elapsed, still);
      else renderCollection(elapsed, still);
    }
    if (selected === 'similarity') {
      if (mobile) renderMobileSimilarity(elapsed, still);
      else renderSimilarity(elapsed, still);
    }
    updateResultInteraction();
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = null;
    root.dataset.kurbAnimating = 'false';
  }

  function tick(now) {
    frame = 0;
    if (!canRun()) { stop(); return; }
    if (lastTime !== null) elapsed += now - lastTime;
    lastTime = now;
    if (now - lastPaint >= FRAME_INTERVAL) {
      render();
      lastPaint = now;
    }
    frame = requestAnimationFrame(tick);
  }

  function reconcile() {
    updateResultInteraction();
    if (reduced.matches) {
      stop();
      render(true);
    } else if (canRun()) {
      if (!frame) {
        lastTime = null;
        lastPaint = 0;
        root.dataset.kurbAnimating = 'true';
        frame = requestAnimationFrame(tick);
      }
    } else stop();
  }

  function select(view) {
    if (!Object.hasOwn(views, view)) return;
    const changed = selected !== view;
    stop();
    resize(() => {
      selected = view;
      elapsed = 0;
      root.dataset.kurbView = view;
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.kurbView === view)));
      captions.forEach(caption => { caption.textContent = views[view]; });
      render(reduced.matches || !inViewport());
      reconcile();
    }, changed && !panelHidden());
  }
  function onClick(event) { select(event.currentTarget.dataset.kurbView); }

  [...paths, ...vectorPaths, neighbours, ...mobilePaths, ...mobileVectorPaths, mobileNeighbours].filter(Boolean).forEach(path => { path.style.strokeDasharray = '1'; });
  updateLayout();
  compact.addEventListener('change', onLayoutChange);
  root.classList.add('scene-enhanced');
  buttons.forEach(button => button.addEventListener('click', onClick));
  document.addEventListener('projectchange', reconcile);
  document.addEventListener('visibilitychange', reconcile);
  reduced.addEventListener('change', reconcile);
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      onscreen = entries[0].isIntersecting;
      reconcile();
    }, { threshold: 0 });
    observer.observe(stage);
  } else {
    addEventListener('scroll', reconcile, { passive: true });
    addEventListener('resize', reconcile, { passive: true });
  }
  select('product');

  return {
    select,
    destroy() {
      stop();
      observer?.disconnect();
      buttons.forEach(button => button.removeEventListener('click', onClick));
      document.removeEventListener('projectchange', reconcile);
      document.removeEventListener('visibilitychange', reconcile);
      reduced.removeEventListener('change', reconcile);
      compact.removeEventListener('change', onLayoutChange);
      removeEventListener('scroll', reconcile);
      removeEventListener('resize', reconcile);
    }
  };
}
