# Fix: Music player stops after every song when the site is in the background

## Problem

The music player auto-advances to the next track when the current track ends (`onEnded` → `go()` → `engine.load()` → `controller.play()`). When the document is hidden (user switches tabs or minimizes the browser on mobile), playback stops after each song and does not resume. The user wants subsequent songs to keep playing until the playlist is over or the user stops playback.

## Root cause

Browser autoplay policy blocks programmatic `play()` calls when `document.hidden` is true. Three flaws:

1. **`player-ui.js` `go()`** calls `engine.load(current(), { autoplay: true })` while hidden → `controller.play()` blocked → `started` set to `true` incorrectly → subsequent `play()` uses `controller.resume()` for a track that never began.
2. **`player-ui.js` `connect()`** calls `startPlayback()` when `wantPlay` is true, even if `document.hidden`.
3. **`player-ui.js` `onError()`** clears `state.awaitingPlay = false` on blocked errors, so `handleVisibility()` has nothing to retry.

## Files affected

- `js/modules/player/player-ui.js` — don't autoplay while hidden, resume on visibility change, fix stall timer + error handling
- `js/modules/player/spotify-engine.js` — stalledAtEnd fallback + `!userPaused` guard

## Changes

### 1. `js/modules/player/player-ui.js`

**State init:** `hidden: document.hidden` (already done).

**`go(i, { autoplay })`:** Add early return when `document.hidden && autoplay` — load track paused (`autoplay: false`), set `awaitingPlay = true`, return without `armStallTimer()` or blocked `play()`.

**`connect()`:** Guard `startPlayback()` with `!document.hidden`.

**`armStallTimer()`:** Don't clear `awaitingPlay` / set `stalled` when `document.hidden` — the stall timer would otherwise defeat resume-on-show by clearing `awaitingPlay` after 5s while hidden.

```javascript
function armStallTimer() {
  clearTimeout(stallTimer);
  stallTimer = setTimeout(() => {
    if (state.playing) return;
    if (document.hidden) return;
    state.awaitingPlay = false;
    state.hint = 'stalled';
    render();
  }, PLAY_STALL_MS);
}
```

**`handleVisibility()`:** Already resumes when `awaitingPlay && !playing && !offline && engine` on hidden→visible. Also arm stall timer after successful play (already done).

**`onError()`:** Don't clear `awaitingPlay` when `NotAllowedError` AND `document.hidden` (already done).

### 2. `js/modules/player/spotify-engine.js`

**`stalledAtEnd`:** Add `!userPaused` guard so a manually paused track isn't skipped:

```javascript
const stalledAtEnd = !ended && armed && !userPaused && last.durationMs > 0
  && last.positionMs >= last.durationMs - END_EPSILON_MS
  && sinceLastUpdate > END_DETECTION_TIMEOUT_MS;
```

## Verification

1. `npm run verify` — must pass.
2. `node --check` on both modified files — syntax OK.
3. Manual background-tab checks:
   - Play, hide tab, wait >5s, return — next track should auto-play (stall timer didn't defeat it)
   - Pause near end of track, hide tab, wait >8s — track should NOT auto-advance (`!userPaused` guard)
   - Play, hide tab, track ends naturally → next track queued → return to tab → next track auto-plays
4. No changes to HTML, CSS, or playlist data files.

## Constraints

- Do not weaken any check in `scripts/verify.mjs`.
- Do not hand-edit `js/data/playlist.js` or `js/data/playlist.json`.
- Keep the engine contract: `load(track, { autoplay }), play(), pause(), seek(ms), onState, onEnded`.
- No build step, no dependencies, ES modules, 2-space indent, single quotes, semicolons.
