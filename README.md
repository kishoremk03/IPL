# IPL Auction 3D - Multiplayer (v3)

Live IPL-style auction for friends. One person creates a room, everyone else joins with the 4-letter code on their own phone. No packages to install.

Files: `server.js`, `index.html`, `package.json` (keep these in the top folder), plus `README.md`, `FEATURES.md` (what is done and what is not), `GITHUB_UPDATE.md` (how to update your repo), `render.yaml`, `.gitignore`, `test/smoke.js`, `test/ui.js`.

## Run on a computer
`node server.js` then open http://localhost:3000 (Node 18+). Run the checks with `npm test`.

## Put it online free, from a phone
1. On github.com make a free account, tap **+ > New repository**, name it `ipl-auction`, **Public**, **Create repository**.
2. Tap **uploading an existing file**, add the files (unzip first), **Commit changes**.
3. On render.com: **Sign in with GitHub**, **New > Web Service**, pick `ipl-auction`.
4. Runtime **Node**, Build `npm install`, Start `npm start`, Instance **Free**. Deploy. Share the `https://....onrender.com` link.

## Saving your room and data
- **Auto-save:** every room is written to `rooms.json` about 1.5 s after each change and reloaded on restart. On Render's free plan that disk is wiped when the service sleeps or redeploys, so it only protects against short crashes. For real persistence use a paid plan with a disk and set `DATA_DIR=/data` (see `render.yaml`).
- **Backup file (works on free hosting):** the host taps **💾 Backup** during or after the auction to download a `.json` file. Later, on the home page, tap **Restore a saved room**, choose the file, and a new room code is created. The auction starts paused; owners join, tap their team under "You are watching", and the host taps Resume.
- **Results:** the end screen has **Download results (CSV)**.

## New in v3
Undo, auto-bid and jump bids, Right to Match, timer styles, form boosts, sponsor bonus, watchlist, squad-needs meter, vibration, reconnect banner, invite link, rejoin by name, room lock/remove/make-host, big-screen mode, season simulator, playing XI, report card, share image, history and leaderboard, settings, rate limiting. See `FEATURES.md`.

## Updating your GitHub repo
See `GITHUB_UPDATE.md`.

## Earlier (v2)
- Backup and restore of a whole room (host only).
- Take over a team mid-auction if you lost your session or the room was restored.
- If the host disappears for 45 s, a team owner can become host.
- Server already includes the accelerated round for unsold players, trades, pause, chat and disk saving.

## Good to know
- Free Render sleeps after ~15 minutes idle. Open the link a minute before the game.
- Keep the page open during the auction (updates are pushed live).
- Testing: `npm test` runs 38 server checks. `npm run test:ui` (needs `playwright` and Chromium) drives three browser phones through lobby, bidding, auto-bid, jump, undo, menu, settings, simulator, XI, report card, image and history. Both passed when this zip was built. The backup file download/restore buttons, big-screen link and vibration were not clicked in the browser test; try them once on a real phone.
