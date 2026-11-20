# IPL Auction 3D - Multiplayer

Live IPL-style auction for friends. One person creates a room, everyone else joins with the 4-letter code on their own phone.

Files: `server.js`, `index.html`, `package.json`, `README.md` (all in the top folder of the repo, no sub-folders).

## Put it online free, from a phone

1. On github.com make a free account, tap **+ > New repository**, name it `ipl-auction`, set it **Public**, tap **Create repository**.
2. Tap **uploading an existing file**, add all 4 files, tap **Commit changes**.
3. On render.com tap **Get Started**, **Sign in with GitHub**, then **New > Web Service** and pick `ipl-auction`.
4. Set: Runtime **Node**, Build Command `npm install`, Start Command `npm start`, Instance type **Free**. Tap **Deploy Web Service**.
5. When it says Live, open the `https://....onrender.com` link and share it. Everyone opens the same link.

## Good to know

- Free Render sleeps after about 15 minutes with no visits. Open the link a minute before the game to wake it (first load can take up to a minute).
- Rooms are kept in memory. If the server restarts or sleeps, rooms are lost; just create a new one.
- Updates are pushed live, so keep the page open during the auction.
- Test on a computer: `node server.js` then open http://localhost:3000
