# Fix: Music player stops after every song when the site is in the background

## Problem

The music player auto-advances to the next track when the current track ends (`onEnded` → `go()` → `engine.load()` → `controller.play()`). When the document is hidden (user switches tabs or minimizes the browser on mobile), playback stops after each song and does not resume. There is no `visibilitychange` handling in the player, and no fallback end-detection if Spotify's `playback_update` events stop firing while hidden.

## Root cause

1. `player-ui.js` has no `visibilitychange` listener. When `onEnded` fires while hidden, `go()` loads the next track and calls `controller.play()`, but browser autoplay policy can block programmatic playback initiation when `document.hidden` is true. When the tab later becomes visible, nothing retries `play()`, so `state.awaitingPlay` stays `true` and `state.playing` stays `false`.
2. `spotify-engine.js` detects track end solely from `playback_update` events. If those events are throttled or stop while hidden, `onEnded` never fires and `go()` is never called.

## Files affected

- `js/modules/player/player-ui.js` — add visibility handling + resume-on-show
- `js/modules/player/spotify-engine.js` — add timeout-based end-detection fallback

## Plan

### 1. `js/modules/player/player-ui.js`

**Constants:** Add `VISIBILITY_RESUME_TIMEOUT_MS` (grace period before treating a stalled background play as needing a resume on show).

**State:** Add `hidden` boolean to `state`, tracking `document.hidden`.

**`onEnded()`:** Unchanged — still calls `go(state.index + 1, { autoplay: true })`. `go()` already sets `state.awaitingPlay = true` and loads the next track even if `controller.play()` is blocked while hidden. The key is that `awaitingPlay` must persist so the visibility handler can resume later.

**New `handleVisibility()`:**
- On `visibilitychange`, update `state.hidden = document.hidden`.
- When `document.hidden` transitions from `true` to `false` (tab becomes visible):
  - If `state.awaitingPlay && !state.playing && !state.offline && engine`, call `play()` to resume the queued track.
  - This covers both the Spotify engine (blocked `controller.play()` while hidden) and the preview engine (suspended `<audio>` while hidden).

**Event registration:** Add `document.addEventListener('visibilitychange', handleVisibility)` near the existing event listeners at the bottom of `initPlayer`, alongside `armSyncTimer()`.

### 2. `js/modules/player/spotify-engine.js`

**Constants:** Add `END_DETECTION_TIMEOUT_MS` (e.g. 10000) — how long without a `playback_update` before we assume the track has ended while armed.

**State:** Add `lastUpdateMs` (timestamp of last `playback_update`).

**`playback_update` listener:** Set `lastUpdateMs = performance.now()` on every valid update.

**New end-detection fallback:** After the existing `finished` check, add a timer-based check: if `armed` is true, `!ended`, `last.durationMs > 0`, `last.positionMs >= last.durationMs - END_EPSILON_MS`, and `performance.now() - lastUpdateMs > END_DETECTION_TIMEOUT_MS`, treat as finished and call `callbacks.onEnded()`. Guard so it only fires once (`ended` flag).

This covers the case where `playback_update` events stop while hidden and `onEnded` would otherwise never fire.

## Verification

1. `npm run verify` — must pass (links, banned content, Uber Eats wording).
2. `npm start` then `node tools/player-check.mjs http://localhost:8000` — all player checks must pass (embed, play, progress, next, seek, auto-advance, pause, fallback).
3. Manual background-tab check: start playback, switch tabs/minimize, verify next track loads and resumes when tab returns to foreground.
4. No changes to HTML, CSS, or playlist data files.

## Constraints

- Do not weaken any check in `scripts/verify.mjs`.
- Do not hand-edit `js/data/playlist.js` or `js/data/playlist.json`.
- Keep the engine contract: `load(track, { autoplay }), play(), pause(), seek(ms), onState, onEnded`.
- Do not simplify away the Spotify engine's existing `armed` / `playingURI` filtering (per AGENTS.md music player invariants).
- No build step, no dependencies, ES modules, 2-space indent, single quotes, semicolons.

## Rollout

No migration needed. Client-side JS fix; takes effect on next page load.
