import { $, $$, prefersReducedMotion } from './modules/dom.js';
import { initStatusBar } from './modules/status-bar.js';
import { initWorldMap } from './modules/world-map.js';
import { initSparklines } from './modules/sparklines.js';
import { initServices } from './modules/services.js';
import { initPlayer } from './modules/player/player-ui.js';

// Homepage entry. Each feature initializes independently so one failure can't blank the page.

const features = {
  statusBar: () => initStatusBar(),
  worldMap: () => initWorldMap($('#traffic')),
  sparklines: () => initSparklines(),
  services: () => initServices($('#svcs')),
  player: () => initPlayer($('#audio'), { host: $('#spotify-host'), chips: $$('[data-np]') }),
};

document.documentElement.classList.toggle('rm', prefersReducedMotion());
for (const [name, init] of Object.entries(features)) {
  try {
    init();
  } catch (err) {
    console.error(`[app] ${name} failed to initialize`, err);
  }
}
