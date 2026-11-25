import { mountKurbExplorer } from './kurb-explorer.js';
import { mountWorksheetStack } from './worksheet-stack.js';

const tabList = document.querySelector('[data-project-tabs]');
const tabs = [...document.querySelectorAll('[data-project-tab]')];
const panels = [...document.querySelectorAll('[data-project-panel]')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const compact = matchMedia('(max-width: 1024px)');
const animations = new Map();

function revealImage(node, animate = true) {
  animations.get(node)?.cancel();
  if (!animate || reduced.matches || !node?.animate) return;
  const animation = node.animate([
    {clipPath:'inset(0 3% 0 0 round 8px)',transform:'translateX(5px)'},
    {clipPath:'inset(0 0 0 0 round 8px)',transform:'translateX(0)'}
  ], {duration:260,easing:'cubic-bezier(.16,1,.3,1)'});
  animations.set(node, animation);
  animation.finished.catch(() => {}).finally(() => {
    if (animations.get(node) === animation) animations.delete(node);
  });
}

function revealProject(panel, direction, animate) {
  for (const item of panels) animations.get(item)?.cancel();
  if (!animate || reduced.matches || !panel.animate) return;
  const offset = compact.matches
    ? `translateX(${direction * 12}px)`
    : `translateY(${direction * 10}px)`;
  const animation = panel.animate([
    { opacity: .58, transform: offset },
    { opacity: 1, transform: 'translate(0, 0)' }
  ], { duration: 260, easing: 'cubic-bezier(.22,.78,.25,1)' });
  animations.set(panel, animation);
  animation.finished.catch(() => {}).finally(() => {
    if (animations.get(panel) === animation) animations.delete(panel);
  });
}

function selectProject(id, {animate = true, updateHash = false} = {}) {
  const next = panels.find(panel => panel.id === id);
  if (!next) return;
  const previous = panels.find(panel => !panel.hidden);
  const changed = next.hidden;
  const direction = panels.indexOf(next) > panels.indexOf(previous) ? 1 : -1;
  for (const panel of panels) panel.hidden = panel !== next;
  for (const tab of tabs) {
    const selected = tab.dataset.projectTab === id;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }
  document.dispatchEvent(new CustomEvent('projectchange', {detail:{id}}));
  if (changed) revealProject(next, direction, animate);
  if (updateHash) history.replaceState(null, '', `#${id}`);
}

if (tabList && tabs.length === panels.length && tabs.length) {
  tabList.setAttribute('role','tablist');
  tabList.setAttribute('aria-label','Selected projects');
  const orient = () => tabList.setAttribute('aria-orientation', compact.matches ? 'horizontal' : 'vertical');
  orient();
  compact.addEventListener('change', orient);
  for (const tab of tabs) {
    const id = tab.dataset.projectTab;
    tab.id = `tab-${id}`;
    tab.setAttribute('role','tab');
    tab.setAttribute('aria-controls',id);
    const panel = panels.find(panel => panel.id === id);
    panel.setAttribute('role','tabpanel');
    panel.setAttribute('aria-labelledby',tab.id);
    tab.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      selectProject(id, {animate:event.detail !== 0,updateHash:true});
    });
    tab.addEventListener('keydown', event => {
      const previous = compact.matches ? 'ArrowLeft' : 'ArrowUp';
      const next = compact.matches ? 'ArrowRight' : 'ArrowDown';
      if (![previous,next,'Home','End'].includes(event.key)) return;
      event.preventDefault();
      let index = tabs.indexOf(tab);
      if (event.key === previous) index = (index + tabs.length - 1) % tabs.length;
      if (event.key === next) index = (index + 1) % tabs.length;
      if (event.key === 'Home') index = 0;
      if (event.key === 'End') index = tabs.length - 1;
      selectProject(tabs[index].dataset.projectTab, {animate:false,updateHash:true});
      tabs[index].focus({preventScroll:true});
    });
  }
  for (const panel of panels) {
    const views = [...panel.querySelectorAll('[data-media]')];
    const buttons = [...panel.querySelectorAll('[data-media-view]')];
    if (!views.length || !buttons.length) continue;
    const caption = panel.querySelector('[data-media-caption]');
    const selectView = (name, animate = true) => {
      const next = views.find(view => view.dataset.media === name);
      if (!next) return;
      const changed = next.hidden;
      for (const view of views) view.hidden = view !== next;
      for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.mediaView === name));
      if (caption) caption.textContent = caption.getAttribute(`data-caption-${name}`) || caption.dataset.captionDefault;
      document.dispatchEvent(new CustomEvent('mediaviewchange', {detail:{id:panel.id,name}}));
      if (changed) revealImage(next, animate);
    };
    buttons.forEach(button => button.addEventListener('click', event => selectView(button.dataset.mediaView,event.detail !== 0)));
    selectView(views[0].dataset.media, false);
  }
  document.body.classList.add('project-browser-ready');
  const initial = panels.some(panel => panel.id === location.hash.slice(1)) ? location.hash.slice(1) : panels[0].id;
  selectProject(initial,{animate:false});
  mountKurbExplorer(document.getElementById('kurb'));
  mountWorksheetStack(document.getElementById('creaitor'));
  addEventListener('hashchange', () => selectProject(location.hash.slice(1),{animate:false}));
  reduced.addEventListener('change', () => {
    if (reduced.matches) animations.forEach(animation => animation.cancel());
  });
}
