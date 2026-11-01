import { $$, rng } from './dom.js';

// Decorative trend lines for the stat tiles. Only the headline numbers next to them are real.
// Each <svg class="spark" data-spark="name"> is drawn by the builder with that name.

const W = 128;
const H = 34;
const line = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');
const area = (pts) => `${line(pts)}L${W} ${H}L0 ${H}Z`;

const BUILDERS = {
  // Availability stepping up from three nines to five nines.
  availability(r) {
    const levels = [27, 16, 5];
    const pts = [];
    for (let i = 0; i <= 32; i++) {
      const x = i * 4;
      const step = i < 10 ? 0 : i < 21 ? 1 : 2;
      let y = levels[step];
      if (step === 0 && r() < 0.3) y += 3 + r() * 3;
      if (step === 1 && r() < 0.14) y += 2.5;
      pts.push([x, y]);
      if (i === 9 || i === 20) pts.push([x + 4, levels[step]]);
    }
    return `<path class="ar" d="${area(pts)}"/><path class="ln" d="${line(pts)}"/><circle class="end" cx="${W}" cy="5" r="2.2"/>`;
  },
  // Failover drills, all under the 800 ms threshold line.
  failover(r) {
    const n = 18;
    const bw = 3.5;
    const gap = (W - n * bw) / (n - 1);
    let bars = '';
    for (let i = 0; i < n; i++) {
      const h = ((520 + r() * 260) / 900) * H;
      bars += `<rect class="br${i === n - 1 ? ' hi' : ''}" x="${(i * (bw + gap)).toFixed(1)}" y="${(H - h).toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="1"/>`;
    }
    const threshold = H - (800 / 900) * H;
    return `<line class="th" x1="0" x2="${W}" y1="${threshold}" y2="${threshold}"/>${bars}`;
  },
  // Reads above writes.
  throughput(r) {
    const reads = [];
    const writes = [];
    for (let i = 0; i <= 32; i++) {
      const x = i * 4;
      const wave = Math.sin((i / 32) * Math.PI * 2.2 + 0.6);
      reads.push([x, 9 - wave * 3.2 + (r() - 0.5) * 3.2]);
      writes.push([x, 26 - wave * 1.4 + (r() - 0.5) * 1.8]);
    }
    return `<path class="ar" d="${area(reads)}"/><path class="ln" d="${line(reads)}"/><path class="ln2" d="${line(writes)}"/>`;
  },
  qps(r) {
    const pts = [];
    for (let i = 0; i <= 32; i++) {
      const wave = Math.sin((i / 32) * Math.PI * 3 - 1.2);
      pts.push([i * 4, 16 - wave * 7 + (r() - 0.5) * 3]);
    }
    return `<path class="ar" d="${area(pts)}"/><path class="ln" d="${line(pts)}"/>`;
  },
};

export function initSparklines(root = document) {
  for (const el of $$('svg.spark[data-spark]', root)) {
    const name = el.dataset.spark;
    const build = BUILDERS[name];
    if (build) el.innerHTML = build(rng(name.length * 977));
  }
}
