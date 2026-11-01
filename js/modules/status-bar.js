import { $, $$ } from './dom.js';

// Every page has the same status bar: a UTC clock, a status pill and a mobile menu.
export function initStatusBar() {
  initClock();
  initMenu();
  for (const y of $$('[data-year]')) y.textContent = String(new Date().getFullYear());
}

function initClock() {
  const clocks = $$('[data-clock]');
  if (!clocks.length) return;
  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    const d = new Date();
    const text = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
    for (const c of clocks) {
      c.textContent = text;
      if (c.tagName === 'TIME') c.dateTime = d.toISOString();
    }
  };
  tick();
  setInterval(tick, 1000);
}

function initMenu() {
  const btn = $('#menu-btn');
  const nav = $('#mnav');
  if (!btn || !nav) return;
  const set = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) set(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') set(false);
  });
}

export function setStatus(state, text) {
  const pill = $('#pill');
  if (!pill) return;
  pill.dataset.state = state;
  $('.ptxt', pill).textContent = text;
  $('.dot', pill).className = `dot ${state === 'ok' ? 'ok' : 'warn'}`;
}
