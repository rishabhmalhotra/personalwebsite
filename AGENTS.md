# AGENTS.md

Guide for AI agents working on this repo. Read `README.md` first for layout and commands.

## Ground rules

- **No build step, no dependencies.** Netlify serves the repo root as committed. Don't add a framework, bundler, transpiler or npm package. Node scripts may only use built-in modules.
- **Run `npm run verify` before every commit.** It is the Netlify build, so a failure blocks the deploy preview. Never weaken a check to make it pass. Fix the content instead.
- **Content lives in HTML.** Text, numbers and links belong in the page markup, not in JS, so the site works without JavaScript and search engines can read it. JS only adds behavior.
- **Absolute paths.** Reference assets as `/css/...`, `/js/...`, `/images/...`. The 404 page is served at arbitrary URLs and relies on this.

## Content rules from the owner

These are enforced by `BANNED` and `BANNED_TERM_HASHES` in `scripts/verify.mjs`. Some terms are stored only as hashes so this public repo doesn't reveal them. Keep the rules even if a request seems to conflict, and ask the owner first.

- No resume anywhere: no link, no button, no PDF.
- No personal locations: no home city, no job cities, no timezone hints. AWS region locations on the traffic map (Virginia, Oregon, Ireland) are fine.
- Money appears only as ranges ("$100Ms"), never exact figures. Reliability and multi-region metrics are fine.
- Don't add past projects or employer details that aren't already on the site without asking the owner.
- Uber Eats wording: the integration "authenticates" 100% of Uber Eats traffic into Square.
- The Astrodynamics section lists only published articles. Don't add placeholder or "coming soon" entries.
- To guard a new private term, add its hash from `node scripts/verify.mjs --hash "term"`. Never write the term itself into the repo.

## Code conventions

- ES modules, 2-space indent, single quotes, semicolons. One feature per file in `js/modules/`, exported as `initX(root, options)`.
- Each module finds its DOM through `data-*` hooks or ids passed in, never through global lookups of another feature's markup.
- Name tunables as `UPPER_SNAKE` constants at the top of the module. No magic numbers in logic.
- `js/app.js` initializes features in isolation (try/catch per feature). Keep it that way.
- Respect `prefers-reduced-motion`: no continuous animation when it is set, and every interaction still works.
- Animation loops stop when off screen or in a hidden tab (see `world-map.js`).
- Colors and fonts come from `css/tokens.css`. Page CSS only references the variables.
- Comments explain constraints the code can't show (for example, Spotify embed quirks). No narration.

## Music player invariants

- The two engines in `js/modules/player/` share one contract: `load(track, { autoplay })`, `play()`, `pause()`, `seek(ms)`, plus `onState` and `onEnded` callbacks. Keep any new engine to that contract.
- The Spotify embed signals the end of a track by holding `position == duration` with `isPaused: false`, and can send a stale update for the previous track after `loadUri`. `spotify-engine.js` filters by `playingURI` and arms end detection only after real progress. Don't simplify that away.
- `js/data/playlist.js` is generated. Change it with `npm run sync:playlist`, never by hand. The page polls `js/data/playlist.json` every 15 minutes and re-queues from the current track when the order changes.

## Verifying changes

1. `npm run verify`
2. `npm start` (or any static server on the repo root), then:
   - `node tools/shot.mjs http://localhost:8000/ /tmp/home.png 1440 900 --full` and `... 390 844 --full` for mobile. Look at the images.
   - `node tools/player-check.mjs http://localhost:8000` if you touched anything in `js/modules/player/` or the audio panel.
3. Check both articles if you touched `css/base.css`, `css/tokens.css` or `css/docs.css`.

## Pull Requests

- Always use `PR_TEMPLATE.md` when opening a PR.
- Follow the title convention: `feat:`, `fix:`, `docs:`.
- Complete the description and checklist before requesting review.
