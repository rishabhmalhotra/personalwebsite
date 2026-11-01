import { $, $$ } from '../modules/dom.js';

// Article pages: reading progress (status bar readout + thin bar) and the table of contents highlight.
export function initArticle() {
  const prose = $('.prose');
  if (!prose) return;
  const topbar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 44;
  initProgress(prose, topbar);
  initToc(topbar);
}

function initProgress(prose, topbar) {
  const bar = $('#read-bar i');
  const pct = $('#read-pct');
  let queued = false;
  let last = -1;

  const update = () => {
    queued = false;
    const r = prose.getBoundingClientRect();
    const span = r.height - (window.innerHeight - topbar);
    const p = span <= 0 ? 1 : Math.min(1, Math.max(0, (topbar - r.top) / span));
    if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
    const n = Math.round(p * 100);
    if (pct && n !== last) {
      pct.textContent = `${n}% read`;
      last = n;
    }
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  // MathJax typesetting and web fonts change the article height after load.
  new ResizeObserver(queue).observe(prose);
  update();
}

function initToc(topbar) {
  const links = $$('.toc ol a[href^="#"]');
  if (!links.length) return;
  const entries = links
    .map((a) => ({ a, h: document.getElementById(decodeURIComponent(a.hash.slice(1))) }))
    .filter((e) => e.h);
  if (!entries.length) return;
  let current = null;

  const pick = () => {
    const line = topbar + window.innerHeight * 0.28;
    let active = null;
    for (const e of entries) {
      if (e.h.getBoundingClientRect().top <= line) active = e;
      else break;
    }
    const doc = document.documentElement;
    if (window.scrollY > 0 && window.innerHeight + window.scrollY >= doc.scrollHeight - 4) active = entries[entries.length - 1];
    if (active === current) return;
    current?.a.removeAttribute('aria-current');
    active?.a.setAttribute('aria-current', 'location');
    current = active;
  };

  // A fast scroll or anchor jump can carry a heading straight past an IntersectionObserver
  // band without firing it, so positions are read on every (throttled) scroll instead.
  let queued = false;
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      pick();
    });
  };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  pick();
}
