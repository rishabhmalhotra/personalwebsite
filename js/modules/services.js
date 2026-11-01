import { $, $$ } from './dom.js';

// Disclosure rows: each .svc-row button toggles the detail panel named by aria-controls.
export function initServices(root) {
  if (!root) return;
  for (const btn of $$('.svc-row', root)) {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      btn.closest('.svc').classList.toggle('open', open);
      $(`#${btn.getAttribute('aria-controls')}`).hidden = !open;
    });
  }
}
