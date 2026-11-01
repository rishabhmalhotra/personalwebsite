import { $ } from '../modules/dom.js';

// Mass ratio m0/mf = e^(Δv/ve), plotted for Δv in 0..15 km/s and mass ratio 0..100.
const DV_MAX = 15000;
const MR_MAX = 100;
const MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const C = {
  grid: '#1E232B',
  axis: '#7D8590',
  label: '#7D8590',
  curve: '#9DB7FF',
  text: '#E6EAEE',
  tagBg: '#141820',
  tagBorder: '#2A313B',
  panel: '#0F1216',
};

const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function initRocketEquationChart(root = document) {
  const canvas = $('#exponentialCanvas', root);
  const veSlider = $('#veSlider', root);
  const dvSlider = $('#dvSlider', root);
  if (!canvas || !veSlider || !dvSlider) return;
  const ctx = canvas.getContext('2d');
  const out = {
    ve: $('#veValue', root),
    dv: $('#dvValue', root),
    ratio: $('#massRatio', root),
    frac: $('#propFraction', root),
    launch: $('#launchMass', root),
  };

  let w = 0;
  let h = 0;
  let dpr = 1;
  let queued = false;

  function resize() {
    dpr = Math.max(1, window.devicePixelRatio || 1);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  // 1px lines land on whole device pixels.
  const crisp = (v) => (Math.round(v * dpr) + (dpr % 2 === 1 ? 0.5 : 0)) / dpr;

  function fill(slider) {
    const min = Number(slider.min);
    const max = Number(slider.max);
    slider.style.setProperty('--fill', `${((Number(slider.value) - min) / (max - min)) * 100}%`);
  }

  function draw() {
    queued = false;
    if (!w || !h) return;
    const ve = parseFloat(veSlider.value);
    const targetDv = parseFloat(dvSlider.value) * 1000;
    const targetMassRatio = Math.exp(targetDv / ve);

    const compact = w < 480;
    const pad = { l: compact ? 34 : 50, r: compact ? 10 : 18, t: 14, b: compact ? 38 : 44 };
    const pw = w - pad.l - pad.r;
    const ph = h - pad.t - pad.b;
    const X = (dv) => pad.l + (dv / DV_MAX) * pw;
    const Y = (mr) => pad.t + ph - (mr / MR_MAX) * ph;
    const font = `${compact ? 10 : 11}px ${MONO}`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.font = font;
    ctx.lineWidth = 1;

    // Grid
    ctx.strokeStyle = C.grid;
    ctx.beginPath();
    for (let mr = 20; mr <= MR_MAX; mr += 20) {
      const y = crisp(Y(mr));
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + pw, y);
    }
    for (let dv = 3000; dv <= DV_MAX; dv += 3000) {
      const x = crisp(X(dv));
      ctx.moveTo(x, pad.t);
      ctx.lineTo(x, pad.t + ph);
    }
    ctx.stroke();

    // Tick labels
    ctx.fillStyle = C.label;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let mr = 0; mr <= MR_MAX; mr += 20) ctx.fillText(String(mr), pad.l - 8, Y(mr));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let dv = 0; dv <= DV_MAX; dv += 3000) ctx.fillText(String(dv / 1000), X(dv), pad.t + ph + 8);

    // Axis titles
    ctx.fillText('Δv (km/s)', pad.l + pw / 2, pad.t + ph + (compact ? 22 : 25));
    ctx.save();
    ctx.translate(compact ? 8 : 11, pad.t + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'middle';
    ctx.fillText('Mass Ratio', 0, 0);
    ctx.restore();

    // Curve, clipped to the plot so it leaves through the top edge.
    const pts = [];
    const exitDv = Math.min(DV_MAX, ve * Math.log(MR_MAX));
    const steps = Math.max(60, Math.round(pw / 2));
    for (let i = 0; i <= steps; i++) {
      const dv = (i / steps) * exitDv;
      pts.push([X(dv), Y(Math.exp(dv / ve))]);
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.l, pad.t, pw + 1, ph);
    ctx.clip();
    const area = ctx.createLinearGradient(0, pad.t, 0, pad.t + ph);
    area.addColorStop(0, 'rgba(157, 183, 255, 0.16)');
    area.addColorStop(1, 'rgba(157, 183, 255, 0.01)');
    ctx.beginPath();
    ctx.moveTo(pts[0][0], Y(0));
    for (const [x, y] of pts) ctx.lineTo(x, y);
    ctx.lineTo(pts[pts.length - 1][0], Y(0));
    ctx.closePath();
    ctx.fillStyle = area;
    ctx.fill();
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = C.curve;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // Axes
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(crisp(pad.l), pad.t);
    ctx.lineTo(crisp(pad.l), crisp(pad.t + ph));
    ctx.lineTo(pad.l + pw, crisp(pad.t + ph));
    ctx.stroke();

    // Current mission point. Off the top of the scale it pins to the edge with a caret.
    const off = targetMassRatio > MR_MAX;
    const mx = X(targetDv);
    const my = off ? pad.t : Y(targetMassRatio);
    ctx.save();
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(157, 183, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(crisp(mx), pad.t + ph);
    ctx.lineTo(crisp(mx), my);
    if (!off) {
      ctx.moveTo(pad.l, crisp(my));
      ctx.lineTo(mx, crisp(my));
    }
    ctx.stroke();
    ctx.restore();

    if (off) {
      ctx.fillStyle = C.curve;
      ctx.beginPath();
      ctx.moveTo(mx, pad.t);
      ctx.lineTo(mx - 5, pad.t + 8);
      ctx.lineTo(mx + 5, pad.t + 8);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(157, 183, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(mx, my, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.curve;
      ctx.strokeStyle = C.panel;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mx, my, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Readout tag next to the point
    const label = `${off ? '↑ ' : ''}${fmt(targetMassRatio)} : 1`;
    ctx.font = `500 ${compact ? 11 : 12}px ${MONO}`;
    const tw = ctx.measureText(label).width + 16;
    const th = compact ? 22 : 24;
    let tx = mx + 12;
    if (tx + tw > pad.l + pw) tx = mx - 12 - tw;
    let ty = my - th - 8;
    if (ty < pad.t + 2) ty = my + 12;
    ctx.fillStyle = C.tagBg;
    ctx.strokeStyle = C.tagBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(crisp(tx), crisp(ty), Math.round(tw), th, 4);
    else ctx.rect(crisp(tx), crisp(ty), Math.round(tw), th);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.text;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, tx + 8, ty + th / 2 + 0.5);

    // Readouts (same formulas as the original page)
    out.ve.textContent = String(ve);
    out.dv.textContent = (targetDv / 1000).toFixed(1);
    out.ratio.textContent = fmt(targetMassRatio);
    out.frac.textContent = `${((1 - 1 / targetMassRatio) * 100).toFixed(1)}%`;
    out.launch.textContent = `${fmt(targetMassRatio)} kg`;
    veSlider.setAttribute('aria-valuetext', `${ve} metres per second`);
    dvSlider.setAttribute('aria-valuetext', `${(targetDv / 1000).toFixed(1)} kilometres per second`);
    canvas.setAttribute(
      'aria-label',
      `Mass ratio against mission delta-v for an exhaust velocity of ${ve} m/s. At ${(targetDv / 1000).toFixed(1)} km/s the required mass ratio is ${fmt(targetMassRatio)} to 1.`,
    );
  }

  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(draw);
  };

  for (const s of [veSlider, dvSlider]) {
    fill(s);
    s.addEventListener('input', () => {
      fill(s);
      queue();
    });
  }

  new ResizeObserver(() => {
    resize();
    draw();
  }).observe(canvas);

  // Pinch-zoom and moving between displays change the pixel ratio without resizing the canvas box.
  const watchDpr = () => {
    matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`).addEventListener(
      'change',
      () => {
        resize();
        draw();
        watchDpr();
      },
      { once: true },
    );
  };
  watchDpr();

  resize();
  draw();
  if (document.fonts) document.fonts.load(`11px ${MONO}`).then(queue, () => {});
}
