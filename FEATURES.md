# Feature status (v3)

## Done and tested
| # | Feature | Where |
|---|---|---|
| 1 | Undo last result (host, 20 s, also returns an RTM card) | host row: "Undo last" |
| 2 | Auto-bid (proxy bidding up to your maximum, per lot) | under the bid button |
| 2 | "+1 Cr jump" bid | under the bid button |
| 3 | Watchlist: star a player, phone buzzes + toast when he is on the block | "Watch this player" |
| 4 | Squad-needs meter (missing roles, purse to keep, overseas slots) | under the bid button |
| 5 | Vibration: outbid, watchlist, "going once"; sound mute and settings saved on the phone | Menu > Settings |
| 6 | Reconnect banner when the live connection drops | top of screen |
| 7 | Invite link `?room=CODE` (copy / share sheet) | lobby + Menu |
| 8 | Rejoin by name if your session is lost (never the host) | join screen |
| 9 | Right to Match cards (0/1/2 per team, 10 s window, returns on undo) | lobby option |
| 11 | Timer styles: Classic 10 s, Blitz 5 s, Calm 20 s | lobby option |
| 13 | Form boosts: random -3..+3 rating per player, shown on the card and used in scores | lobby option |
| 14 | Sponsor bonus: +5 Cr to the smallest squad, once, half-way | lobby option |
| 15 | Bid-war rule: after 6 bids the extension halves so wars finish | automatic |
| 16 | Season simulator: round robin + Qualifier 1, Eliminator, Qualifier 2, Final; same result on every phone | end screen |
| 17 | Choose your playing XI (11, max 4 overseas) + coach tip | end screen |
| 18 | Report card (best buy, overpay, steal, most expensive, spender) + shareable PNG image | end screen |
| 19 | History and leaderboard (all finished auctions on this server, saved in `history.json`) | Menu / end screen |
| 20 | Big-screen mode (`?tv=CODE` link, or Menu > big-screen mode) | Menu |
| 22 | Host controls: lock room, remove player, make someone host | Menu > Room controls |
| 23 | Abuse guard: request-rate limit and room-creation limit per IP | server |
| 24 | Accessibility: text size, larger tap targets, high-contrast text | Menu > Settings |
| 26 | Trade animation: when a trade is accepted, every phone and the big screen plays the same swap animation (teams, player cards fly across, purse coin, confetti). Tap to skip. | automatic |
| 27 | Player ratings re-checked: all 308 players re-rated 56 to 96 on one scale (role-neutral, recent T20/IPL form, IPL 2026 batting leaderboard for the top batters) | server.js DATA |
| 28 | Minimum squad: every team must buy at least 72% of the squad size (18 of 25). Bids that would leave too little purse for the minimum are blocked, and any team still short at the end is topped up with the best cheap unsold players at half base price (auto-buy, logged) | automatic |
| 29 | Playing XI rebuilt: batting order 1-11, every player has natural batting zone(s). Full rating in his natural slot, 94% / 86% / 78% / 70% as he moves further away. Captain (+3 max) and vice-captain (+1 max), live team rating, coach tips, Best XI / Best order buttons, tap-to-swap | My playing XI |
| - | Backup / restore room, take over a team, host takeover, auto-save | v2 |

## Not done (be honest)
- **Retentions before the auction (#10):** needs a per-team picking screen and slab rules; not built.
- **Sealed-bid mystery lots (#12):** not built.
- **QR code in the lobby:** needs a QR library; the invite link and share sheet are there instead.
- **Real database (#21):** rooms are still saved as `rooms.json` and finished auctions as `history.json`. On free hosting these files vanish when the server restarts, so use the Backup button, or a paid host with a disk (`DATA_DIR`).
- **Batting order** in the XI picker (only the 11 players are chosen).
- **Languages (#25):** English only.
- **Colour-blind patterns:** only the high-contrast text option exists.
- **Rename team owner:** not built (remove + rejoin with a new name works).
