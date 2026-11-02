#!/usr/bin/env node
// End-to-end check of the audio panel against a running local server.
// Usage: node tools/player-check.mjs [base-url=http://localhost:8000]
// Exercises the Spotify engine (play, progress, next, seek, auto-advance) and the preview
// fallback with the Spotify IFrame API blocked. Exits non-zero if any check fails.
import { withPage, sleep } from './lib/chrome.mjs';

const BASE = (process.argv[2] || 'http://localhost:8000').replace(/\/$/, '');
const CHROME_FLAGS = ['--autoplay-policy=no-user-gesture-required', '--mute-audio'];
const results = [];

const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

const snapshot = (page) => page.evaluate(`(() => {
  const p = document.querySelector('#audio');
  const seek = p.querySelector('[data-au-seek]');
  const hint = p.querySelector('[data-au-hint]');
  return {
    state: p.querySelector('[data-au-state]').dataset.state,
    title: p.querySelector('[data-au-title]').textContent,
    position: Number(seek.getAttribute('aria-valuenow')),
    duration: Number(seek.getAttribute('aria-valuemax')),
    hint: hint.hidden ? null : hint.textContent.trim(),
    current: [...p.querySelectorAll('.tr')].findIndex((b) => b.getAttribute('aria-current') === 'true'),
    iframe: !!document.querySelector('#spotify-host iframe'),
  };
})()`);

const clickSeekAt = (page, ratio) => page.evaluate(`(() => {
  const el = document.querySelector('[data-au-seek]');
  const r = el.getBoundingClientRect();
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + r.width * ${ratio}, clientY: r.top + r.height / 2 }));
  return true;
})()`);

async function spotifyEngine() {
  console.log('\nSpotify engine');
  await withPage({ flags: CHROME_FLAGS }, async (page) => {
    await page.navigate(`${BASE}/`);
    const embedded = await page.waitFor(`!!document.querySelector('#spotify-host iframe')`, { timeout: 15000 });
    check('embed iframe is created on idle', embedded);
    if (!embedded) return;
    await sleep(2000);

    const first = await snapshot(page);
    await page.click('[data-au-play]');
    const playing = await page.waitFor(`['streaming','preview'].includes(document.querySelector('[data-au-state]').dataset.state)`, { timeout: 12000 });
    const a = await snapshot(page);
    check('play starts playback', playing, `state=${a.state}`);
    await sleep(3000);
    const b = await snapshot(page);
    check('progress advances while playing', b.position > a.position, `${a.position}s -> ${b.position}s`);

    await page.click('[data-au-next]');
    await page.waitFor(`document.querySelector('[data-au-title]').textContent !== ${JSON.stringify(first.title)}`, { timeout: 5000 });
    const afterNextLoaded = await page.waitFor(`['streaming','preview'].includes(document.querySelector('[data-au-state]').dataset.state)`, { timeout: 12000 });
    const c = await snapshot(page);
    check('next loads and plays the next track', c.current === 1 && afterNextLoaded, `title=${c.title} state=${c.state}`);

    await sleep(1500);
    await clickSeekAt(page, 0.9);
    await sleep(2500);
    const d = await snapshot(page);
    check('seek jumps near the end', d.position >= Math.floor(d.duration * 0.8), `${d.position}s of ${d.duration}s`);

    const advanced = await page.waitFor(`[...document.querySelectorAll('#audio .tr')].findIndex((b) => b.getAttribute('aria-current') === 'true') === 2`, { timeout: Math.max(12000, (d.duration - d.position + 8) * 1000) });
    await sleep(2500);
    const e = await snapshot(page);
    check('auto-advances when a track ends', advanced && ['streaming', 'preview', 'loading'].includes(e.state), `current=${e.current} state=${e.state}`);

    await page.click('[data-au-play]');
    await sleep(1500);
    const f = await snapshot(page);
    check('pause stops playback', f.state === 'paused', `state=${f.state}`);
    if (e.state === 'preview' || c.state === 'preview') console.log('      note: not logged into Spotify, so the embed served 30-second previews');
    check('no page errors', page.errors.length === 0, page.errors.join(' | '));
  });
}

async function previewFallback() {
  console.log('\nPreview fallback (Spotify IFrame API blocked)');
  await withPage({ flags: CHROME_FLAGS }, async (page) => {
    await page.send('Network.setBlockedURLs', { urls: ['*open.spotify.com/embed/iframe-api*'] });
    await page.navigate(`${BASE}/`);
    await sleep(1500);
    await page.click('[data-au-play]');
    const playing = await page.waitFor(`document.querySelector('[data-au-state]').dataset.state === 'preview'`, { timeout: 20000 });
    const a = await snapshot(page);
    check('falls back to preview audio', playing, `state=${a.state}`);
    check('shows the fallback hint', !!a.hint && a.hint.includes('previews'), a.hint || 'no hint');
    await sleep(2500);
    const b = await snapshot(page);
    check('preview progress advances', b.position > a.position, `${a.position}s -> ${b.position}s`);
    await page.click('[data-au-next]');
    await sleep(2500);
    const c = await snapshot(page);
    check('next works in fallback mode', c.current === 1 && c.state === 'preview', `current=${c.current} state=${c.state}`);
  });
}

await spotifyEngine();
await previewFallback();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exitCode = failed ? 1 : 0;
