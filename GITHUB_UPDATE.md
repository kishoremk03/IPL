# How to update your GitHub repo with this version

Your repo has `server.js`, `index.html`, `package.json`, `README.md` in the top folder. This zip has the same layout plus a few new files. Render redeploys by itself when the repo changes.

## A. From a phone or any browser (no software needed)
1. Unzip `ipl-auction-v3.zip` on your phone/computer (you get a folder `ipl-auction`).
2. Open your repo on github.com. Tap **Add file > Upload files**.
3. Select **all files from inside the folder** (not the folder itself): `server.js`, `index.html`, `package.json`, `README.md`, `FEATURES.md`, `GITHUB_UPDATE.md`, `render.yaml`, `.gitignore`.
   Files with the same name replace the old ones.
4. For the test folder: tap **Add file > Create new file**, type `test/smoke.js` as the name, paste the file contents, and commit. Repeat for `test/ui.js`. (Optional: the app runs without the tests.)
5. Write a commit message such as `v3: undo, auto-bid, RTM, simulator` and tap **Commit changes**.
6. Open render.com > your service > **Events**. A new deploy starts (1-3 minutes). When it says **Live**, open your link and hard-refresh (close and reopen the tab).

## B. From a computer with git
```
git clone https://github.com/YOUR-NAME/ipl-auction.git
cd ipl-auction
# copy everything from the unzipped ipl-auction folder into this folder, overwriting
git add -A
git commit -m "v3: undo, auto-bid, RTM, simulator, backup"
git push
```

## C. Check it worked
- Open `https://YOUR-SERVICE.onrender.com/healthz`: it must say `ok`.
- In the app, tap **☰**: you should see Menu, Settings, History.
- If the page looks old, close the tab and reopen it, or clear the site data once.

## If something breaks
- On Render: **Events > Rollback** to the previous deploy, or on GitHub open the commit and tap **Revert**.
- Old running auctions: take a **💾 Backup** first if an auction is in progress. A deploy restarts the server, and on the free plan the saved rooms are erased. Restore the backup afterwards from the home page.
- Do not upload `rooms.json` or `history.json` (they are in `.gitignore`).

## v4.1 fixes (lag / glitch pass)
- Page sent gzip-compressed (about 5x smaller first load).
- Team logos no longer re-parsed on every update (big phone lag fix).
- UI blocks only redraw when they change (no flicker, fewer repaints).
- Heavy blur effects and endless shimmer animations removed; animations pause in background tabs.
- Duplicate render per bid removed; failed bids re-enable the button.
- Saving is async and slower-debounced, so it no longer stalls the auction clock.
- "Host left, become host" button now actually appears; reconnect fallback works.
- Server survives stray socket errors instead of crashing.

## v4.2 player photos
- Added real photos for 36 players: all 18 MI and all 18 CSK (cropped from the squad posters).
- Everyone else still uses the illustrated avatar. To add more teams, add entries to the `PH` object in index.html (key = exact player name).

## v4.3 more player photos
- Added DC (17) and RCB (18): now 71 photos total (MI, CSK, DC, RCB).
- Rehan Ahmed is on the DC poster but is not in the game's player list, so he has no photo yet.

## v4.4 more player photos
- Added PBKS (18) and SRH (18): 107 photos total (MI, CSK, DC, RCB, PBKS, SRH).

## v4.5 more player photos
- Added LSG (18) and GT (18): 143 photos total (MI, CSK, DC, RCB, PBKS, SRH, LSG, GT). KKR and RR still use illustrated avatars.

## v4.6 all ten teams have photos
- Added RR (18) and KKR (18): 179 photos total, every team covered.
- The poster says "Tejasvi Singh" for KKR; the game lists him as Tejasvi Dahiya (same player).
