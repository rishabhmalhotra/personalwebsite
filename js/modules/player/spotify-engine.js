// Plays tracks through Spotify's IFrame API embed, kept invisible inside `host`.
// Visitors logged into Spotify in this browser hear full tracks; everyone else gets 30-second previews.
// Engine contract (shared with preview-engine.js):
//   load(track, { autoplay }), play(), pause(), seek(ms), kind
//   callbacks.onState({ playing, positionMs, durationMs, buffering }), callbacks.onEnded()

const API_SRC = 'https://open.spotify.com/embed/iframe-api/v1';
const API_TIMEOUT_MS = 12000;
const LOAD_READY_FALLBACK_MS = 1500;
// When a track finishes, the embed keeps reporting isPaused: false with position pinned at
// duration, so "reached the end" is the signal. Some versions pause just short of the end instead.
const END_EPSILON_MS = 300;
const PAUSED_NEAR_END_MS = 1500;
// If playback_update stops arriving while armed near the end of a track (for
// example when the tab is hidden), assume the track finished after this long
// with no update.
const END_DETECTION_TIMEOUT_MS = 8000;

let apiPromise = null;

function loadIframeApi() {
  apiPromise ??= new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Spotify IFrame API timed out')), API_TIMEOUT_MS);
    window.onSpotifyIframeApiReady = (api) => {
      clearTimeout(timer);
      resolve(api);
    };
    const script = document.createElement('script');
    script.src = API_SRC;
    script.async = true;
    script.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Spotify IFrame API failed to load'));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

export async function createSpotifyEngine(host, initialTrack, callbacks) {
  const api = await loadIframeApi();
  const mount = document.createElement('div');
  host.appendChild(mount);

  let readyWaiters = [];
  const controller = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Spotify embed did not become ready')), API_TIMEOUT_MS);
    api.createController(mount, { uri: initialTrack.uri, width: '100%', height: 80 }, (c) => {
      let first = true;
      c.addListener('ready', () => {
        if (first) {
          first = false;
          clearTimeout(timer);
          resolve(c);
        }
        const waiters = readyWaiters;
        readyWaiters = [];
        waiters.forEach((fn) => fn());
      });
    });
  });

  const iframe = host.querySelector('iframe');
  if (iframe) {
    iframe.tabIndex = -1;
    iframe.setAttribute('aria-hidden', 'true');
    iframe.title = 'Spotify player (controlled by the audio panel)';
  }

  let currentUri = initialTrack.uri;
  let started = false;
  let userPaused = false;
  let ended = false;
  // End detection arms only after the current track reports progress short of its end, so a
  // late update from the previous track (still pinned at its end) cannot skip the new one.
  let armed = false;
  let last = { playing: false, positionMs: 0, durationMs: 0 };
  let lastUpdateMs = 0;
  let stalledTimer = 0;

  function clearStalledTimer() {
    clearTimeout(stalledTimer);
    stalledTimer = 0;
  }

  function armStalledTimer() {
    clearStalledTimer();
    stalledTimer = setTimeout(() => {
      if (!ended && armed && !userPaused && last.durationMs > 0
        && last.positionMs >= last.durationMs - END_EPSILON_MS) {
        ended = true;
        const state = { ...last, playing: false };
        callbacks.onState(state);
        callbacks.onEnded();
      }
    }, END_DETECTION_TIMEOUT_MS);
  }

  controller.addListener('playback_update', ({ data }) => {
    if (!data) return;
    if (data.playingURI && data.playingURI !== currentUri) return;
    const now = performance.now();
    const sinceLastUpdate = now - lastUpdateMs;
    lastUpdateMs = now;
    const state = {
      playing: !data.isPaused,
      positionMs: data.position ?? 0,
      durationMs: data.duration ?? 0,
      buffering: !!data.isBuffering,
    };
    if (state.durationMs > 0 && state.positionMs < state.durationMs - END_EPSILON_MS) armed = true;
    const reachedEnd = armed && state.durationMs > 0 && state.positionMs >= state.durationMs - END_EPSILON_MS;
    const pausedNearEnd = armed && last.playing && !state.playing && !userPaused && last.durationMs > 0
      && last.positionMs >= last.durationMs - PAUSED_NEAR_END_MS;
    const finished = !ended && (reachedEnd || pausedNearEnd);
    if (finished) {
      ended = true;
      state.playing = false;
    }
    if (state.playing) userPaused = false;
    last = state;
    callbacks.onState(state);
    if (finished) callbacks.onEnded();

    // If progress is short of the end, clear any stalled timer (track still mid-playback).
    // If near the end, arm a timer so we detect completion even if updates stop (e.g. tab hidden).
    if (state.durationMs > 0 && state.positionMs < state.durationMs - END_EPSILON_MS) {
      clearStalledTimer();
    } else if (state.durationMs > 0 && state.positionMs >= state.durationMs - END_EPSILON_MS) {
      armStalledTimer();
    }
  });

  const whenLoaded = () => new Promise((resolve) => {
    const timer = setTimeout(resolve, LOAD_READY_FALLBACK_MS);
    readyWaiters.push(() => { clearTimeout(timer); resolve(); });
  });

  return {
    kind: 'spotify',
    async load(track, { autoplay = false } = {}) {
      currentUri = track.uri;
      started = false;
      userPaused = false;
      ended = false;
      armed = false;
      last = { playing: false, positionMs: 0, durationMs: 0 };
      lastUpdateMs = 0;
      clearStalledTimer();
      controller.loadUri(track.uri);
      await whenLoaded();
      if (autoplay) this.play();
    },
    play() {
      userPaused = false;
      if (started) controller.resume();
      else controller.play();
      started = true;
    },
    pause() {
      userPaused = true;
      controller.pause();
    },
    seek(ms) {
      controller.seek(Math.max(0, ms) / 1000);
    },
  };
}
