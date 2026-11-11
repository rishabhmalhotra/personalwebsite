# Fix: Music player stops after every song when the site is in the background

## Problem

The music player auto-advances to the next track when the current track ends (`onEnded` → `go()` → `engine.load()` → `controller.play()`). When the document is hidden (user switches tabs or minimizes the browser on mobile), playback stops after each song and does not resume. The user wants subsequent songs to keep playing until the playlist is over or the user stops playback.

## Root cause

**Browser autoplay policy blocks programmatic `play()` calls when `document.hidden` is true.** Three flaws in the current implementation:

1. **`player-ui.js` `go()` (line 202)** calls `engine.load(current(), { autoplay: true })` while hidden. Inside `spotify-engine.js.load()`, this calls `this.play()` → `controller.play()`, which is blocked. Worse, `spotify-engine.js.play()` sets `started = true` even when play is blocked, so subsequent `play()` calls use `controller.resume()` instead of `controller.play()` — which won't start a track that never began.

2. **`player-ui.js` `connect()` (line 126)** calls `startPlayback()` when `wantPlay` is true, even if `document.hidden` — same blocked-play problem plus incorrect `started` flag.

3. **`player-ui.js` `onError()` (line 97-102)** clears `state.awaitingPlay = false`. If the blocked play triggers an error, `awaitingPlay` becomes `false`, so the visibility-change handler never retries when the tab becomes visible.

**Constraint:** Browser autoplay policy makes *initiating* playback while hidden fundamentally impossible. The correct approach: don't attempt blocked `play()` while hidden; load the next track paused, set `awaitingPlay = true`, and start it immediately when the tab becomes visible.

## Files affected

- `js/modules/player/player-ui.js` — don't autoplay while hidden, resume on visibility change
- `js/modules/player/spotify-engine.js` — keep the `stalledAtEnd` fallback (already added)

## Plan

### 1. `js/modules/player/player-ui.js`

**State:** Keep `hidden: false` already added to state. Also set `state.hidden = document.hidden` at init time so the initial hidden state is correct.

**`go(i, { autoplay })`:** Add early return when `document.hidden && autoplay`:
- Load the track with `autoplay: false` (queued but paused) — this does NOT call `controller.play()`, so `started` stays `false`
- Set `state.awaitingPlay = true`
- Set `loadedUri = current().uri`
- Render and return early — do NOT call `engine.load()` with `autoplay: true`, do NOT arm stall timer

```javascript
if (document.hidden && autoplay) {
  loadedUri = current().uri;
  await engine.load(current(), { autoplay: false });
  state.awaitingPlay = true;
  render();
  return;
}
```

Place this after the `if (!engine)` check and before the `try` block.

**`connect()`:** In the `.then(async (e) => { ... })` callback (line 119-128), guard `startPlayback()`:
- Change `if (wantPlay) startPlayback();` to `if (wantPlay && !document.hidden) startPlayback();`
- When hidden and `wantPlay`, leave `state.awaitingPlay = true` for `handleVisibility` to handle.

**`handleVisibility()`:** Already added. When transitioning hidden→visible:
- If `state.awaitingPlay && !state.playing && !state.offline && engine`, call `play()`
- The track is already loaded (paused) from `go()` or `connect()`, so `play()` → `controller.play()` works since document is now visible
- Add `armStallTimer()` after successful play

**`onError()`:** Don't clear `state.awaitingPlay` when the error is `blocked` (NotAllowedError) AND `document.hidden`:
```javascript
onError(err) {
  clearTimeout(stallTimer);
  const isBlocked = err?.name === 'NotAllowedError';
  state.hint = isBlocked ? 'blocked' : 'stalled';
  if (!(isBlocked && document.hidden)) state.awaitingPlay = false;
  render();
},
```

### 2. `js/modules/player/spotify-engine.js`

Keep the `stalledAtEnd` fallback already added:
- `END_DETECTION_TIMEOUT_MS` constant
- `lastUpdateMs` tracking
- `stalledAtEnd` condition in `playback_update` listener
- Reset `lastUpdateMs` in `load()`

No changes needed here — the `load()` method's internal `this.play()` won't be triggered while hidden because `go()` won't pass `autoplay: true` when `document.hidden`.

## Verification

1. `npm run verify` — must pass (links, banned content, Uber Eats wording).
2. `node --check js/modules/player/player-ui.js` and `spotify-engine.js` — syntax OK.
3. Manual background-tab check: start playback, switch tabs/minimize, verify:
   - When track ends while hidden, next track is queued (UI shows new track index)
   - When tab returns to foreground, next track starts playing automatically
   - No console errors related to blocked autoplay
4. `npm start` then `node tools/player-check.mjs http://localhost:8000` — if Chrome is available.
5. No changes to HTML, CSS, or playlist data files.

## Constraints

- Do not weaken any check in `scripts/verify.mjs`.
- Do not hand-edit `js/data/playlist.js` or `js/data/playlist.json`.
- Keep the engine contract: `load(track, { autoplay }), play(), pause(), seek(ms), onState, onEnded`.
- Do not simplify away the Spotify engine's existing `armed` / `playingURI` filtering (per AGENTS.md music player invariants).
- No build step, no dependencies, ES modules, 2-space indent, single quotes, semicolons.

## Rollout

No migration needed. Client-side JS fix; takes effect on next page load.
