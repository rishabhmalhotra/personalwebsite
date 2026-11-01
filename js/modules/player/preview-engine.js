// Fallback engine: plays each track's 30-second preview MP3 with a plain <audio> element.
// Used when the Spotify embed cannot load (blocked, offline, or the API changed).
// Same contract as spotify-engine.js.

export function createPreviewEngine(callbacks) {
  const audio = new Audio();
  audio.preload = 'none';

  const emit = () => callbacks.onState({
    playing: !audio.paused && !audio.ended,
    positionMs: audio.currentTime * 1000,
    durationMs: Number.isFinite(audio.duration) ? audio.duration * 1000 : 0,
    buffering: audio.readyState < 3 && !audio.paused,
  });
  for (const type of ['play', 'pause', 'timeupdate', 'loadedmetadata', 'waiting', 'playing', 'seeked']) {
    audio.addEventListener(type, emit);
  }
  audio.addEventListener('ended', () => {
    emit();
    callbacks.onEnded();
  });
  audio.addEventListener('error', () => callbacks.onError?.(new Error('Preview audio failed to load')));

  return {
    kind: 'preview',
    async load(track, { autoplay = false } = {}) {
      if (!track.preview) throw new Error('Track has no preview');
      audio.src = track.preview;
      if (autoplay) await this.play();
    },
    play() {
      return audio.play().catch((err) => callbacks.onError?.(err));
    },
    pause() {
      audio.pause();
    },
    seek(ms) {
      if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, Math.max(0, ms / 1000));
    },
  };
}
