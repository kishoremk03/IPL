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
