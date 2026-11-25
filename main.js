const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const ease = 'cubic-bezier(.16,1,.3,1)';

// Roll each digit independently while preserving the final text and layout.
const kurbFacts = document.querySelector('.kurb-facts');
function rollCounter(node, index) {
  const finalValue = new Intl.NumberFormat('en').format(Number(node.dataset.countTo));
  if (reducedMotion.matches || typeof node.animate !== 'function') return;
  const reels = document.createDocumentFragment();
  const animations = [];
  const strips = [];
  let digitIndex = 0;
  for (const char of finalValue) {
    if (!/^[0-9]$/.test(char)) {
      const separator = document.createElement('span');
      separator.textContent = char;
      reels.append(separator);
      continue;
    }
    const digit = Number(char);
    const steps = 10 + digit;
    const reel = document.createElement('span');
    reel.className = 'counter-reel';
    const strip = document.createElement('span');
    strip.className = 'counter-reel__strip';
    for (let n = 0; n <= steps; n++) {
      const cell = document.createElement('span');
      cell.textContent = String(n % 10);
      strip.append(cell);
    }
    reel.append(strip);
    reels.append(reel);
    strips.push({strip, steps, digitIndex: digitIndex++});
  }
  node.classList.add('counter-rolling');
  node.replaceChildren(reels);
  for (const {strip, steps, digitIndex} of strips) {
    // Every reel stops on the exact final digit, without changing its width.
    animations.push(strip.animate([
      {transform:'translateY(0)'},
      {transform:`translateY(-${steps * 1.12}em)`}
    ], {
      duration: 820 + digitIndex * 75,
      delay: index * 65 + digitIndex * 25,
      easing: 'cubic-bezier(.12,.66,.14,1)',
      fill: 'both'
    }));
  }
  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    reducedMotion.removeEventListener('change', onMotionChange);
    animations.forEach(animation => animation.cancel());
    node.classList.remove('counter-rolling');
    node.textContent = finalValue;
  }
  function onMotionChange(event) {
    if (event.matches) finish();
  }
  reducedMotion.addEventListener('change', onMotionChange);
  Promise.allSettled(animations.map(animation => animation.finished)).then(finish);
}

if (kurbFacts && !reducedMotion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    if (reducedMotion.matches) return;
    [...kurbFacts.querySelectorAll('[data-count-to]')].forEach(rollCounter);
  }, {threshold:.25});
  observer.observe(kurbFacts);
}

function imageRect(img) {
  const rect = img.getBoundingClientRect();
  if (getComputedStyle(img).objectFit !== 'contain' || !img.naturalWidth) return rect;
  const scale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
  const width = img.naturalWidth * scale;
  const height = img.naturalHeight * scale;
  return {left:rect.left + (rect.width-width)/2, top:rect.top+(rect.height-height)/2, width, height};
}

function makeGhost(img, rect, parent = document.body) {
  const ghost = new Image();
  ghost.src = img.currentSrc || img.src;
  ghost.alt = '';
  ghost.setAttribute('aria-hidden', 'true');
  ghost.className = 'transition-image';
  Object.assign(ghost.style, {left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`});
  parent.append(ghost);
  return ghost;
}

function flyImage(ghost, from, to, duration = 260) {
  if (!from.width || !to.width || typeof ghost.animate !== 'function') return Promise.resolve();
  return ghost.animate([
    {transform:'translate3d(0,0,0) scale(1)',borderRadius:'5px'},
    {transform:`translate3d(${to.left-from.left}px,${to.top-from.top}px,0) scale(${to.width/from.width},${to.height/from.height})`,borderRadius:'3px'}
  ], {duration,easing:ease,fill:'forwards'}).finished.catch(() => {});
}

const dialog = document.getElementById('image-dialog');
const dialogImage = document.getElementById('dialog-image');
const dialogCaption = document.getElementById('dialog-caption');
const closeButton = document.getElementById('close-dialog');
let lastImageLink;
let closingDialog = false;
let openingGhost;

async function closeImage() {
  if (closingDialog || !dialog.open) return;
  closingDialog = true;
  openingGhost?.remove();
  openingGhost = null;
  dialogImage.style.opacity = '';
  const destination = lastImageLink?.querySelector('img');
  const to = destination ? imageRect(destination) : null;
  if (!reducedMotion.matches && to && getComputedStyle(destination).objectFit !== 'cover' && to.top < innerHeight && to.top+to.height > 0) {
    const from = imageRect(dialogImage);
    const ghost = makeGhost(dialogImage, from, dialog);
    dialogImage.style.opacity = '0';
    await flyImage(ghost, from, to, 200);
    ghost.remove();
  }
  dialog.close();
  dialogImage.style.opacity = '';
  closingDialog = false;
}

if (dialog && typeof dialog.showModal === 'function') {
  document.querySelectorAll('[data-lightbox]').forEach((link) => {
    link.addEventListener('click', async (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (dialog.open) return;
      lastImageLink = link;
      const source = link.querySelector('img');
      const from = source ? imageRect(source) : null;
      dialogImage.src = link.href;
      dialogImage.alt = source?.alt || link.dataset.caption;
      dialogCaption.textContent = link.dataset.caption;
      dialog.showModal();
      document.body.classList.add('dialog-open');
      if (source && !reducedMotion.matches && getComputedStyle(source).objectFit !== 'cover') {
        dialogImage.style.opacity = '0';
        const ghost = makeGhost(source, from, dialog);
        openingGhost = ghost;
        await dialogImage.decode().catch(() => {});
        if (!dialog.open || closingDialog) {ghost.remove();return;}
        const to = imageRect(dialogImage);
        await flyImage(ghost, from, to, 260);
        ghost.remove();
        if (openingGhost === ghost) openingGhost = null;
        dialogImage.style.opacity = '';
      }
    });
  });
  closeButton.addEventListener('click', closeImage);
  dialog.addEventListener('cancel', (event) => {event.preventDefault();closeImage();});
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    openingGhost?.remove();
    openingGhost = null;
    lastImageLink?.focus({preventScroll:true});
  });
}
