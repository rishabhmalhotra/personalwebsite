import { WORLD, MAP_COLS } from '../data/world-bitmap.js';
import { $, svg, prefersReducedMotion } from './dom.js';
import { setStatus } from './status-bar.js';

// Illustrates an active-passive multi-region setup: every client routes to the primary,
// and the outage simulation fails over to one standby, then restores the primary.

const VIEW_W = 1200;
const VIEW_H = 460;
const VIEWBOX_FULL = [0, 0, VIEW_W, VIEW_H];
const VIEWBOX_SMALL = [0, 30, 820, 390];
const SMALL_BREAKPOINT_PX = 560;

const FAILOVER_MIN_MS = 500;
const FAILOVER_MAX_MS = 790;
const STATUS_RECOVERY_DELAY_MS = 1300;
const RESTORE_AFTER_MS = 5200;
const PACKET_RATE = 0.1;
const PACKET_DROP_MS = 500;

const PRIMARY = 'use';
const FAILOVER_TARGET = 'usw';

const REGIONS = {
  use: { id: 'us-east-1', lon: -77.5, lat: 39.0, labelOffset: ['14px', '-10%'], labelOffsetSmall: ['10px', '12%'] },
  usw: { id: 'us-west-2', lon: -119.7, lat: 45.6, labelOffset: ['-50%', 'calc(-100% - 14px)'], labelOffsetSmall: ['8px', '-130%'] },
  euw: { id: 'eu-west-1', lon: -6.3, lat: 53.3, labelOffset: ['14px', '-120%'], labelOffsetSmall: ['10px', '-125%'] },
};

// [name, lon, lat, relative traffic weight]
const CITIES = [
  ['Los Angeles', -118.2, 34.1, 9], ['Mexico City', -99.1, 19.4, 5], ['Chicago', -87.6, 41.9, 8],
  ['Bogotá', -74.1, 4.7, 3], ['São Paulo', -46.6, -23.5, 7], ['London', -0.13, 51.5, 9],
  ['Frankfurt', 8.7, 50.1, 7], ['Lagos', 3.4, 6.5, 3], ['Johannesburg', 28.0, -26.2, 3],
  ['Mumbai', 72.9, 19.1, 6], ['Singapore', 103.8, 1.35, 5], ['Tokyo', 139.7, 35.7, 8], ['Sydney', 151.2, -33.9, 4],
].map(([name, lon, lat, weight]) => ({ name, lon, lat, weight }));

const ROLE_TEXT = {
  normal: { use: 'active · primary', usw: 'standby', euw: 'standby' },
  detecting: { use: 'down', usw: 'promoting', euw: 'standby' },
  failedover: { use: 'down', usw: 'active · promoted', euw: 'standby' },
};
const ROLE_STATE = {
  normal: { use: 'active', usw: 'standby', euw: 'standby' },
  detecting: { use: 'down', usw: 'promoting', euw: 'standby' },
  failedover: { use: 'down', usw: 'active', euw: 'standby' },
};
const DOT_CLASS = { active: 'ok', standby: 'hollow', down: 'down', promoting: 'warn' };

const project = (lon, lat) => [((lon + 168) / 360) * VIEW_W, ((82 - lat) / 138) * VIEW_H];
const circlePath = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

function quadCurve(x0, y0, x1, y1, bend) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  if (ny > 0) { nx = -nx; ny = -ny; }
  const k = Math.min(len * bend, 120);
  return { x0, y0, x1, y1, cx: (x0 + x1) / 2 + nx * k, cy: (y0 + y1) / 2 + ny * k, len };
}
const pointOn = (c, t) => {
  const u = 1 - t;
  return [u * u * c.x0 + 2 * u * t * c.cx + t * t * c.x1, u * u * c.y0 + 2 * u * t * c.cy + t * t * c.y1];
};
const curvePath = (c, dx = 0) => `M${c.x0 + dx} ${c.y0}Q${c.cx + dx} ${c.cy} ${c.x1 + dx} ${c.y1}`;

function landPaths() {
  let fine = '';
  let coarse = '';
  WORLD.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) if (row[c] === '#') fine += circlePath(c * 10 + 5, r * 10 + 5, 2.4);
  });
  // Mobile uses a 2x2-cell grid so the dots stay visible at small sizes.
  for (let r = 0; r < WORLD.length; r += 2) {
    for (let c = 0; c < MAP_COLS; c += 2) {
      let land = 0;
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) if ((WORLD[r + a] || '')[c + b] === '#') land++;
      if (land >= 2) coarse += circlePath(c * 10 + 10, r * 10 + 10, 5.2);
    }
  }
  return { fine, coarse };
}

export function initWorldMap(root) {
  if (!root) return;
  const reduced = prefersReducedMotion();
  const mapEl = $('.map', root);
  const layers = { arcs: $('[data-layer="arcs"]', root), cities: $('[data-layer="cities"]', root), packets: $('[data-layer="packets"]', root), nodes: $('[data-layer="nodes"]', root) };
  const labelsEl = $('[data-layer="labels"]', root);
  const readout = $('[data-readout]', root);
  const readoutKey = $('[data-readout-key]', root);
  const readoutValue = $('[data-readout-value]', root);
  const readoutSub = $('[data-readout-sub]', root);
  const simBtn = $('[data-sim]', root);
  const simLabel = $('[data-sim-label]', root);

  const { fine, coarse } = landPaths();
  $('.land', root).setAttribute('d', fine);
  $('.land-c', root).setAttribute('d', coarse);

  for (const key in REGIONS) {
    const region = REGIONS[key];
    [region.x, region.y] = project(region.lon, region.lat);
    region.node = svg('g', { class: 'node' }, layers.nodes);
    svg('circle', { class: 'pulse', cx: region.x, cy: region.y, r: 7 }, region.node);
    svg('circle', { class: 'pulse p2', cx: region.x, cy: region.y, r: 7 }, region.node);
    svg('circle', { class: 'ring', cx: region.x, cy: region.y, r: 11 }, region.node);
    svg('circle', { class: 'core', cx: region.x, cy: region.y, r: 5 }, region.node);
    region.labelEl = document.createElement('div');
    region.labelEl.className = 'nlbl';
    region.labelEl.innerHTML = `<b>${region.id}</b><span></span>`;
    labelsEl.appendChild(region.labelEl);
    region.row = $(`.rrow[data-region="${key}"]`, root);
  }

  const replication = Object.keys(REGIONS)
    .filter((k) => k !== PRIMARY)
    .map((k) => svg('path', { class: 'repl', d: curvePath(quadCurve(REGIONS[PRIMARY].x, REGIONS[PRIMARY].y, REGIONS[k].x, REGIONS[k].y, 0.18)) }, layers.arcs));

  for (const city of CITIES) {
    [city.x, city.y] = project(city.lon, city.lat);
    svg('circle', { class: 'city', cx: city.x, cy: city.y, r: 2.4 }, layers.cities);
    city.routes = {};
    for (const key of [PRIMARY, FAILOVER_TARGET]) {
      const region = REGIONS[key];
      // Routes that would cross most of the map wrap around the date line instead.
      const wrap = city.x - region.x > VIEW_W / 2;
      const curve = quadCurve(city.x, city.y, wrap ? region.x + VIEW_W : region.x, region.y, wrap ? 0.16 : 0.24);
      const group = svg('g', {}, layers.arcs);
      const paths = [svg('path', { class: 'arc', d: curvePath(curve) }, group)];
      if (wrap) paths.push(svg('path', { class: 'arc', d: curvePath(curve, -VIEW_W) }, group));
      city.routes[key] = { curve, wrap, paths };
    }
  }

  let phase = 'normal';
  const activeRegion = () => ({ normal: PRIMARY, detecting: null, failedover: FAILOVER_TARGET })[phase];

  function render() {
    const target = activeRegion();
    const primaryDown = ROLE_STATE[phase][PRIMARY] === 'down';
    for (const city of CITIES) {
      for (const key in city.routes) {
        for (const p of city.routes[key].paths) {
          p.classList.toggle('on', key === target);
          p.classList.toggle('dead', key === PRIMARY && primaryDown);
        }
      }
    }
    for (const path of replication) {
      path.classList.toggle('broken', primaryDown);
      path.style.opacity = phase === 'failedover' ? '0' : '';
    }
    for (const key in REGIONS) {
      const region = REGIONS[key];
      const state = ROLE_STATE[phase][key];
      const share = key === target ? 100 : 0;
      region.node.dataset.state = state;
      region.labelEl.dataset.state = state;
      $('span', region.labelEl).textContent = ROLE_TEXT[phase][key];
      region.row.dataset.state = state;
      $('.rstate', region.row).textContent = ROLE_TEXT[phase][key];
      $('.rid .dot', region.row).className = `dot ${DOT_CLASS[state]}`;
      $('.bar i', region.row).style.width = `${share}%`;
      $('.rpct', region.row).textContent = `${share}%`;
    }
  }

  function placeLabels() {
    const small = mapEl.parentElement.clientWidth < SMALL_BREAKPOINT_PX;
    const vb = small ? VIEWBOX_SMALL : VIEWBOX_FULL;
    mapEl.setAttribute('viewBox', vb.join(' '));
    const wrapBox = mapEl.parentElement.getBoundingClientRect();
    const mapBox = mapEl.getBoundingClientRect();
    for (const key in REGIONS) {
      const region = REGIONS[key];
      const [tx, ty] = small ? region.labelOffsetSmall : region.labelOffset;
      region.labelEl.style.setProperty('--tx', tx);
      region.labelEl.style.setProperty('--ty', ty);
      region.labelEl.style.left = `${mapBox.left - wrapBox.left + ((region.x - vb[0]) / vb[2]) * mapBox.width}px`;
      region.labelEl.style.top = `${mapBox.top - wrapBox.top + ((region.y - vb[1]) / vb[3]) * mapBox.height}px`;
    }
  }

  // Packets
  const packets = [];
  const spawnBudget = new Map(CITIES.map((c) => [c, Math.random()]));

  function spawnPacket(city, regionKey, progress = 0) {
    const route = city.routes[regionKey];
    const copies = route.wrap ? [0, -VIEW_W] : [0];
    packets.push({
      regionKey,
      route,
      t: progress,
      duration: 1100 + route.curve.len * 2.6,
      drop: 0,
      els: copies.map((dx) => ({ dx, tail: svg('path', { class: 'pk-tail' }, layers.packets), head: svg('circle', { class: 'pk', r: 3 }, layers.packets) })),
    });
  }
  function drawPacket(p) {
    const c = p.route.curve;
    const t = Math.min(p.t, 1);
    const [x, y] = pointOn(c, t);
    let tail = '';
    for (let i = 0; i <= 5; i++) {
      const [tx, ty] = pointOn(c, Math.max(0, t - 0.075 * (i / 5)));
      tail += `${i ? 'L' : 'M'}${tx.toFixed(1)} ${ty.toFixed(1)}`;
    }
    const opacity = p.drop ? Math.max(0, 1 - p.drop) : Math.min(1, p.t * 8, (1 - p.t) * 10 + 0.2);
    for (const e of p.els) {
      e.head.setAttribute('cx', x + e.dx);
      e.head.setAttribute('cy', y);
      e.head.style.opacity = opacity;
      e.tail.setAttribute('d', tail);
      e.tail.setAttribute('transform', e.dx ? `translate(${e.dx} 0)` : '');
      e.tail.style.opacity = p.drop ? 0 : 0.45 * opacity;
    }
  }
  const removePacket = (p) => p.els.forEach((e) => { e.head.remove(); e.tail.remove(); });

  // Outage simulation
  let sim = null;
  const setReadout = (state, key, value, sub) => {
    readout.dataset.state = state;
    readoutKey.textContent = key;
    readoutValue.innerHTML = value;
    readoutSub.textContent = sub;
  };
  const ms = (n) => `${n}<small>ms</small>`;

  function startOutage() {
    if (sim) return;
    const failoverMs = FAILOVER_MIN_MS + Math.floor(Math.random() * (FAILOVER_MAX_MS - FAILOVER_MIN_MS + 1));
    sim = { startedAt: performance.now(), failoverMs, timers: [] };
    simBtn.disabled = true;
    phase = 'detecting';
    for (const p of packets) {
      if (p.regionKey === PRIMARY && !p.drop) {
        p.drop = 0.001;
        p.els.forEach((e) => e.head.classList.add('drop'));
      }
    }
    setStatus('warn', 'Degraded, failing over');
    setReadout('detecting', 'failover', ms(0), `${REGIONS[PRIMARY].id} health checks failing`);
    render();

    sim.timers.push(setTimeout(() => {
      phase = 'failedover';
      setReadout('done', 'failover', ms(failoverMs), `${REGIONS[PRIMARY].id} → ${REGIONS[FAILOVER_TARGET].id}`);
      render();
      if (!reduced) CITIES.forEach((c) => spawnPacket(c, FAILOVER_TARGET, Math.random() * 0.25));
    }, failoverMs));
    sim.timers.push(setTimeout(() => setStatus('ok', 'All systems operational'), failoverMs + STATUS_RECOVERY_DELAY_MS));

    const countdown = () => {
      const left = Math.max(0, Math.ceil((RESTORE_AFTER_MS - (performance.now() - sim.startedAt)) / 1000));
      simLabel.textContent = left ? `Restoring us-east in ${left}s` : 'Restoring us-east';
    };
    countdown();
    const countdownTimer = setInterval(countdown, 250);
    sim.timers.push(setTimeout(() => {
      clearInterval(countdownTimer);
      phase = 'normal';
      setReadout('idle', 'last failover', ms(failoverMs), `back on ${REGIONS[PRIMARY].id}`);
      simLabel.textContent = 'Simulate us-east outage';
      simBtn.disabled = false;
      sim = null;
      render();
    }, RESTORE_AFTER_MS));
  }

  // Animation loop runs only while the map is on screen and the tab is visible.
  let visible = true;
  let rafId = 0;
  let last = 0;
  function frame(now) {
    const dt = Math.min(64, now - last);
    last = now;
    if (sim && phase === 'detecting') readoutValue.innerHTML = ms(Math.min(sim.failoverMs, Math.round(now - sim.startedAt)));
    const target = activeRegion();
    if (target) {
      for (const city of CITIES) {
        let budget = spawnBudget.get(city) + (dt / 1000) * city.weight * PACKET_RATE;
        if (budget >= 1) { budget -= 1; spawnPacket(city, target); }
        spawnBudget.set(city, budget);
      }
    }
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      if (p.drop) p.drop += dt / PACKET_DROP_MS;
      else p.t += dt / p.duration;
      if (p.t >= 1 || p.drop >= 1) { removePacket(p); packets.splice(i, 1); continue; }
      drawPacket(p);
    }
    rafId = requestAnimationFrame(frame);
  }
  function syncLoop() {
    const shouldRun = !reduced && visible && !document.hidden;
    if (shouldRun && !rafId) {
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    } else if (!shouldRun && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  render();
  placeLabels();
  new ResizeObserver(placeLabels).observe(mapEl.parentElement);
  simBtn.addEventListener('click', startOutage);
  if (!reduced) {
    // Seed in-flight packets so the first frame already looks live.
    for (const city of CITIES) for (let i = 0; i < Math.round(city.weight / 4); i++) spawnPacket(city, PRIMARY, Math.random());
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncLoop(); }).observe(root);
    document.addEventListener('visibilitychange', syncLoop);
    syncLoop();
  }
}
