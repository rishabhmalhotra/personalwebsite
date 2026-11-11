import { PLAYLIST } from '../../data/playlist.js';
import { $, $$, escapeHtml, formatTime, prefersReducedMotion } from '../dom.js';
import { createSpotifyEngine } from './spotify-engine.js';
import { createPreviewEngine } from './preview-engine.js';

// The audio panel and the status-bar chips. Owns the queue: Spotify's controller has no
// next/previous, so this module loads each track itself and advances when one ends.

const CONNECT_IDLE_TIMEOUT_MS = 2500;
const PLAY_STALL_MS = 5000;
const RESTART_THRESHOLD_MS = 3000;
const SEEK_STEP_MS = 5000;
const PREVIEW_LENGTH_MS = 30000;
const PREVIEW_MAX_MS = 31000;
const METER_BARS = 28;
const METER_TICK_MS = 110;
const MOBILE_QUERY = '(max-width: 760px)';
// Poll js/data/playlist.json for edits made on Spotify. The IFrame embed has no playlist
// concept, so this is the only way the order can drift from the live playlist. Well under
// Spotify's rate limits (no minimum interval, ~10 req/sec): one request per poll.
const SYNC_INTERVAL_MS = 15 * 60 * 1000;

const HINTS = {
  spotifyPreview: '30-second preview. Log in to Spotify in this browser to hear full tracks.',
  fallbackPreview: 'Spotify\u2019s player didn\u2019t load, so these are 30-second previews.',
  stalled: 'Playback didn\u2019t start. Press play again, or open the playlist in Spotify.',
  blocked: 'Your browser blocked audio. Press play again to start it.',
  offline: 'Audio isn\u2019t available right now. Open the playlist in Spotify instead.',
};

export function initPlayer(panel, { host, chips = [] }) {
  if (!panel || !host || !PLAYLIST.tracks.length) return;
  let tracks = PLAYLIST.tracks;
  const reduced = prefersReducedMotion();

  const ui = {
    state: $('[data-au-state]', panel),
    stateText: $('[data-au-state] span', panel),
    cover: $('[data-au-cover]', panel),
    title: $('[data-au-title]', panel),
    artist: $('[data-au-artist]', panel),
    meter: $('[data-au-meter]', panel),
    play: $('[data-au-play]', panel),
    playIcon: $('[data-au-play-icon]', panel),
    prev: $('[data-au-prev]', panel),
    next: $('[data-au-next]', panel),
    elapsed: $('[data-au-elapsed]', panel),
    total: $('[data-au-total]', panel),
    seek: $('[data-au-seek]', panel),
    bar: $('[data-au-bar]', panel),
    hint: $('[data-au-hint]', panel),
    list: $('[data-au-tracks]', panel),
    queue: $('[data-au-queue]', panel),
    queueLabel: $('[data-au-queue-label]', panel),
  };

  const state = {
    index: 0,
    playing: false,
    awaitingPlay: false,
    positionMs: 0,
    stampedAt: 0,
    durationMs: tracks[0].durationMs,
    preview: false,
    hint: null,
    offline: false,
    hidden: document.hidden,
  };
  let engine = null;
  let connecting = null;
  let loadedUri = null;
  let stallTimer = 0;

  const current = () => tracks[state.index];

  // Engine wiring
  const callbacks = {
    onState(s) {
      state.playing = s.playing;
      state.positionMs = s.positionMs;
      state.stampedAt = performance.now();
      // Preview status carries over between tracks until the embed reports the new duration.
      if (s.durationMs > 0) {
        state.durationMs = s.durationMs;
        const shortened = s.durationMs <= PREVIEW_MAX_MS && current().durationMs > PREVIEW_MAX_MS;
        state.preview = engine?.kind === 'preview' || shortened;
      }
      if (s.playing) {
        state.awaitingPlay = false;
        clearTimeout(stallTimer);
        if (state.hint === 'stalled' || state.hint === 'blocked') state.hint = null;
      }
      render();
    },
    onEnded() {
      go(state.index + 1, { autoplay: true });
    },
    onError(err) {
      clearTimeout(stallTimer);
      const isBlocked = err?.name === 'NotAllowedError';
      state.hint = isBlocked ? 'blocked' : 'stalled';
      // Don't clear awaitingPlay when autoplay was blocked by the tab being hidden:
      // handleVisibility() will retry play() once the tab becomes visible.
      if (!(isBlocked && document.hidden)) state.awaitingPlay = false;
      render();
    },
  };

  function connect() {
    if (connecting) return connecting;
    const initial = current();
    connecting = createSpotifyEngine(host, initial, callbacks)
      .then((e) => {
        loadedUri = initial.uri;
        return e;
      })
      .catch((err) => {
        console.warn('[player] Spotify embed unavailable, falling back to previews:', err.message);
        if (!tracks.some((t) => t.preview)) throw err;
        return createPreviewEngine(callbacks);
      })
      .then(async (e) => {
        engine = e;
        const wantPlay = state.awaitingPlay;
        if (loadedUri !== current().uri) {
          await e.load(current(), { autoplay: false });
          loadedUri = current().uri;
        }
        if (wantPlay && !document.hidden) startPlayback();
        render();
        return e;
      })
      .catch((err) => {
        console.warn('[player] audio unavailable:', err.message);
        state.offline = true;
        state.awaitingPlay = false;
        render();
      });
    return connecting;
  }

  function armStallTimer() {
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => {
      if (state.playing) return;
      state.awaitingPlay = false;
      state.hint = 'stalled';
      render();
    }, PLAY_STALL_MS);
  }

  function startPlayback() {
    state.awaitingPlay = true;
    armStallTimer();
    engine.play();
  }

  function play() {
    if (state.offline) return;
    state.awaitingPlay = true;
    if (!engine) {
      connect();
      render();
      return;
    }
    startPlayback();
    render();
  }

  function pause() {
    state.awaitingPlay = false;
    clearTimeout(stallTimer);
    engine?.pause();
    render();
  }

  const toggle = () => (state.playing || state.awaitingPlay ? pause() : play());

  // When the document becomes visible again after being hidden (background tab,
  // minimized app), resume any track whose play() was blocked while hidden so the
  // playlist keeps advancing instead of stopping after each song.
  function handleVisibility() {
    const wasHidden = state.hidden;
    state.hidden = document.hidden;
    if (!state.hidden && wasHidden && state.awaitingPlay && !state.playing && !state.offline && engine) {
      play();
      armStallTimer();
    }
  }

  async function go(i, { autoplay = state.playing || state.awaitingPlay } = {}) {
    state.index = (i + tracks.length) % tracks.length;
    state.positionMs = 0;
    state.stampedAt = performance.now();
    state.durationMs = state.preview ? Math.min(PREVIEW_LENGTH_MS, current().durationMs) : current().durationMs;
    state.awaitingPlay = autoplay;
    if (state.hint !== 'offline') state.hint = null;
    render();
    revealCurrentTrack();
    if (!engine) {
      if (autoplay) connect();
      return;
    }
    // Browser autoplay policy blocks play() while the document is hidden. Queue the next
    // track paused and let handleVisibility() start it when the tab becomes visible.
    if (document.hidden && autoplay) {
      loadedUri = current().uri;
      await engine.load(current(), { autoplay: false });
      state.awaitingPlay = true;
      render();
      return;
    }
    try {
      loadedUri = current().uri;
      await engine.load(current(), { autoplay });
      if (autoplay) armStallTimer();
    } catch (err) {
      callbacks.onError(err);
    }
  }

  function seekTo(ms) {
    if (!engine) return;
    const clamped = Math.max(0, Math.min(state.durationMs - 500, ms));
    engine.seek(clamped);
    state.positionMs = clamped;
    state.stampedAt = performance.now();
    renderProgress();
  }

  // Rendering
  function positionNow() {
    const elapsed = state.playing ? performance.now() - state.stampedAt : 0;
    return Math.min(state.durationMs, state.positionMs + elapsed);
  }

  function renderProgress() {
    const pos = positionNow();
    ui.elapsed.textContent = formatTime(pos / 1000);
    ui.bar.style.width = `${state.durationMs ? (pos / state.durationMs) * 100 : 0}%`;
    ui.seek.setAttribute('aria-valuenow', String(Math.floor(pos / 1000)));
    ui.seek.setAttribute('aria-valuetext', `${formatTime(pos / 1000)} of ${formatTime(state.durationMs / 1000)}`);
  }

  function statusLabel() {
    if (state.offline) return 'offline';
    if (state.awaitingPlay && !state.playing) return 'loading';
    if (state.playing) return state.preview ? 'preview' : 'streaming';
    return 'paused';
  }

  function hintKey() {
    if (state.offline) return 'offline';
    if (state.hint) return state.hint;
    if (state.preview && (state.playing || state.positionMs > 0)) return engine?.kind === 'preview' ? 'fallbackPreview' : 'spotifyPreview';
    return null;
  }

  function render() {
    const t = current();
    const active = state.playing || state.awaitingPlay;
    const label = statusLabel();
    ui.title.textContent = t.title;
    ui.artist.textContent = t.artist;
    if (t.art && ui.cover.getAttribute('src') !== t.art) ui.cover.src = t.art;
    ui.cover.alt = `Album art for ${t.title}`;
    ui.total.textContent = formatTime(state.durationMs / 1000);
    ui.seek.setAttribute('aria-valuemax', String(Math.floor(state.durationMs / 1000)));
    ui.seek.setAttribute('aria-disabled', String(!engine));
    ui.state.dataset.state = label;
    ui.stateText.textContent = label;
    ui.playIcon.setAttribute('href', active ? '#i-pause' : '#i-play');
    ui.play.setAttribute('aria-label', active ? 'Pause' : 'Play');
    ui.play.dataset.loading = String(state.awaitingPlay && !state.playing);
    for (const btn of [ui.play, ui.prev, ui.next]) btn.disabled = state.offline;
    panel.classList.toggle('is-playing', state.playing);

    const key = hintKey();
    ui.hint.hidden = !key;
    if (key) ui.hint.innerHTML = `<i class="dot ${key === 'offline' || key === 'stalled' || key === 'blocked' ? 'warn' : 'ok'}"></i><span>${escapeHtml(HINTS[key])}</span>`;

    $$('.tr', ui.list).forEach((b, i) => b.setAttribute('aria-current', String(i === state.index)));
    for (const chip of chips) {
      chip.classList.toggle('is-playing', state.playing);
      chip.disabled = state.offline;
      chip.setAttribute('aria-label', `${active ? 'Pause' : 'Play'} ${t.title} by ${t.artist}`);
      $('[data-np-t]', chip).textContent = t.title;
      $('[data-np-a]', chip).textContent = t.artist;
    }
    renderProgress();
    syncLoop();
  }

  function renderTrackList() {
    ui.list.innerHTML = tracks.map((t, i) => `
      <li><button class="tr" type="button" data-i="${i}">
        <span class="n"><span class="nn">${String(i + 1).padStart(2, '0')}</span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span></span>
        <span class="tt">${escapeHtml(t.title)}</span><span class="ta">${escapeHtml(t.artist)}</span><span class="td">${formatTime(t.durationMs / 1000)}</span>
      </button></li>`).join('');
    ui.queueLabel.textContent = `queue · ${tracks.length} tracks`;
  }

  // Re-read the committed playlist snapshot. If the order or membership changed, re-queue
  // from the current track (or the first track if it was removed) without restarting audio.
  let syncTimer = 0;
  let syncing = false;
  async function syncPlaylist() {
    if (syncing) return;
    syncing = true;
    try {
      const res = await fetch('/js/data/playlist.json', { cache: 'no-store' });
      if (!res.ok) return;
      const fresh = await res.json();
      if (!Array.isArray(fresh.tracks) || !fresh.tracks.length) return;
      const same = fresh.tracks.length === tracks.length
        && fresh.tracks.every((t, i) => t && tracks[i] && t.uri === tracks[i].uri);
      if (same) return;

      const currentUri = current().uri;
      const nextIdx = fresh.tracks.findIndex((t) => t.uri === currentUri);
      const keepIndex = nextIdx >= 0 ? nextIdx : 0;
      const wasPlaying = state.playing || state.awaitingPlay;
      tracks = fresh.tracks;
      state.index = keepIndex;
      state.positionMs = 0;
      state.stampedAt = performance.now();
      state.durationMs = state.preview ? Math.min(PREVIEW_LENGTH_MS, tracks[keepIndex].durationMs) : tracks[keepIndex].durationMs;
      state.awaitingPlay = wasPlaying;
      renderTrackList();
      render();
      if (wasPlaying && engine) {
        loadedUri = tracks[keepIndex].uri;
        try { await engine.load(tracks[keepIndex], { autoplay: true }); armStallTimer(); }
        catch (err) { callbacks.onError(err); }
      }
    } catch (err) {
      console.warn('[player] playlist sync failed:', err.message);
    } finally {
      syncing = false;
      armSyncTimer();
    }
  }
  function armSyncTimer() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncPlaylist, SYNC_INTERVAL_MS);
  }

  // Keep the current row visible inside the scrolling list without moving the page.
  function revealCurrentTrack() {
    const row = $$('.tr', ui.list)[state.index];
    if (!row || ui.list.hidden) return;
    const top = row.offsetTop - ui.list.offsetTop;
    if (top < ui.list.scrollTop || top + row.offsetHeight > ui.list.scrollTop + ui.list.clientHeight) {
      ui.list.scrollTop = top - ui.list.clientHeight / 2 + row.offsetHeight / 2;
    }
  }

  // Level meter. Decorative: the browser cannot read audio from inside Spotify's frame.
  const bars = [];
  const rest = Array.from({ length: METER_BARS }, (_, i) => 0.08 + 0.34 * Math.exp(-(((i - 6) / 8) ** 2)) + 0.14 * Math.abs(Math.sin(i * 1.9 + 0.4)));
  const still = Array.from({ length: METER_BARS }, (_, i) => 0.25 + 0.55 * Math.exp(-(((i - 9) / 8) ** 2)) + 0.15 * Math.abs(Math.sin(i * 2.3)));
  const level = rest.slice();
  const target = rest.slice();
  for (let i = 0; i < METER_BARS; i++) {
    const b = document.createElement('i');
    b.style.transform = `scaleY(${rest[i]})`;
    ui.meter.appendChild(b);
    bars.push(b);
  }

  let rafId = 0;
  let lastFrame = 0;
  let meterClock = 0;
  function frame(now) {
    const dt = Math.min(64, now - lastFrame);
    lastFrame = now;
    renderProgress();
    let settled = true;
    if (reduced) {
      bars.forEach((b, i) => { b.style.transform = `scaleY(${state.playing ? still[i] : rest[i]})`; });
    } else {
      meterClock += dt;
      if (meterClock > METER_TICK_MS) {
        meterClock = 0;
        for (let i = 0; i < METER_BARS; i++) {
          const base = 0.22 + 0.5 * Math.exp(-(((i - 7) / 9) ** 2));
          target[i] = state.playing ? Math.min(1, Math.max(0.06, base + (Math.random() - 0.45) * 0.62)) : rest[i];
        }
      }
      const k = 1 - 0.0009 ** ((dt / 1000) * (state.playing ? 1.4 : 0.6));
      for (let i = 0; i < METER_BARS; i++) {
        level[i] += (target[i] - level[i]) * k;
        if (Math.abs(target[i] - level[i]) > 0.004) settled = false;
        bars[i].style.transform = `scaleY(${level[i].toFixed(3)})`;
      }
    }
    if (state.playing || !settled) rafId = requestAnimationFrame(frame);
    else rafId = 0;
  }
  function syncLoop() {
    if (!rafId) {
      lastFrame = performance.now();
      rafId = requestAnimationFrame(frame);
    }
  }

  // Events
  ui.play.addEventListener('click', toggle);
  ui.prev.addEventListener('click', () => (positionNow() > RESTART_THRESHOLD_MS ? seekTo(0) : go(state.index - 1)));
  ui.next.addEventListener('click', () => go(state.index + 1));
  ui.list.addEventListener('click', (e) => {
    const row = e.target.closest('.tr');
    if (!row) return;
    const i = Number(row.dataset.i);
    if (i === state.index) toggle();
    else go(i, { autoplay: true });
  });
  ui.seek.addEventListener('click', (e) => {
    const box = ui.seek.getBoundingClientRect();
    seekTo(((e.clientX - box.left) / box.width) * state.durationMs);
  });
  ui.seek.addEventListener('keydown', (e) => {
    const steps = { ArrowRight: SEEK_STEP_MS, ArrowUp: SEEK_STEP_MS, ArrowLeft: -SEEK_STEP_MS, ArrowDown: -SEEK_STEP_MS };
    if (e.key in steps) seekTo(positionNow() + steps[e.key]);
    else if (e.key === 'Home') seekTo(0);
    else if (e.key === 'End') seekTo(state.durationMs);
    else return;
    e.preventDefault();
  });
  const setQueueOpen = (open) => {
    ui.queue.setAttribute('aria-expanded', String(open));
    ui.list.hidden = !open;
    if (open) revealCurrentTrack();
  };
  ui.queue.addEventListener('click', () => setQueueOpen(ui.queue.getAttribute('aria-expanded') !== 'true'));
  for (const chip of chips) chip.addEventListener('click', toggle);

  document.addEventListener('visibilitychange', handleVisibility);

  // Warm up the embed when the browser is idle, or as soon as someone reaches for the player.
  panel.addEventListener('pointerenter', connect, { once: true });
  panel.addEventListener('focusin', connect, { once: true });
  if ('requestIdleCallback' in window) requestIdleCallback(connect, { timeout: CONNECT_IDLE_TIMEOUT_MS });
  else setTimeout(connect, CONNECT_IDLE_TIMEOUT_MS);

  renderTrackList();
  if (matchMedia(MOBILE_QUERY).matches) setQueueOpen(false);
  render();
  armSyncTimer();
}
