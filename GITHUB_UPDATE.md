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
