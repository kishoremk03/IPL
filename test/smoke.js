// End-to-end check: node test/smoke.js   (starts its own server on port 3999, uses a temp save folder)
const { spawn } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ipl-')), ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const start = (rate = 100000) => spawn('node', [path.join(__dirname, '..', 'server.js')], { env: { ...process.env, PORT: '3999', DATA_DIR: dir, RATE_MAX: String(rate) }, stdio: 'ignore' });
const call = b => fetch('http://localhost:3999/api', { method: 'POST', body: JSON.stringify(b) }).then(r => r.json());
const wait = ms => new Promise(r => setTimeout(r, ms));
let srv;
(async () => {
  srv = start(); await wait(700);
  const a = await call({ a: 'create', name: 'Asha' }), code = a.code, pa = a.you.pid;
  const b = await call({ a: 'join', name: 'Bala', code }), pb = b.you.pid;
  await call({ a: 'claim', code, pid: pa, team: 'mi' }); await call({ a: 'claim', code, pid: pb, team: 'csk' });
  let v = await call({ a: 'start', code, pid: pa }); ok(v.phase === 'auction', 'auction starts');
  v = await call({ a: 'bid', code, pid: pb, amt: v.base }); ok(v.lead === 'csk', 'bid accepted');
  v = await call({ a: 'sell', code, pid: pa }); ok(v.res && v.res.k === 'sold', 'player sold');
  // backup (host only)
  const bad = await fetch(`http://localhost:3999/export?code=${code}&pid=${pb}`); ok(bad.status === 403, 'non-host cannot download backup');
  const snap = await (await fetch(`http://localhost:3999/export?code=${code}&pid=${pa}`)).json(); ok(snap.app === 'ipl-auction' && snap.room.tm.csk.sq.length === 1, 'host backup contains the sale');
  // restart server: rooms.json must bring the room back
  srv.kill('SIGTERM'); await wait(500); srv = start(); await wait(700);
  v = await call({ a: 'join', name: 'Asha', code, pid: pa }); ok(v.code === code && v.teams.find(t => t.id === 'csk').sq.length === 1, 'room survives server restart');
  // restore the backup on a "new" room, new owner takes a team mid-auction
  const r = await call({ a: 'import', name: 'Asha', snap }); ok(r.code && r.phase === 'auction' && r.paused, 'backup restores as a paused auction');
  const c = await call({ a: 'join', name: 'Chitra', code: r.code }); const pc = c.you.pid;
  let t = await call({ a: 'claim', code: r.code, pid: pc, team: 'csk' }); ok(t.you.team === 'csk', 'new person takes over CSK mid-auction');
  t = await call({ a: 'claim', code: r.code, pid: pc, team: 'mi' }); ok(!!t.err, 'cannot take a second team');
  t = await call({ a: 'takehost', code: r.code, pid: pc }); ok(!!t.err, 'cannot take host while host is present/recent');
  t = await call({ a: 'import', name: 'X', snap: { app: 'nope' } }); ok(!!t.err, 'bad backup is rejected');
  v = await call({ a: 'resume', code: r.code, pid: r.you.pid }); ok(!v.paused, 'host resumes the restored auction');
  srv.kill('SIGTERM'); await wait(300); srv = start(); await wait(700);
  await tradeTest(); await minSquadTest(); await features(); srv.kill('SIGTERM'); await wait(400); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* temp folder, ignore */ }
})();

async function features() {
  const meta = await (await fetch('http://localhost:3999/meta')).json(), P = meta.P;
  const a = await call({ a: 'create', name: 'Host' }), code = a.code, ph = a.you.pid;
  const mk = async n => (await call({ a: 'join', name: n, code })).you.pid;
  const pm = await mk('Mira'), pc = await mk('Chet'), pr = await mk('Rohan');
  await call({ a: 'claim', code, pid: pm, team: 'mi' }); await call({ a: 'claim', code, pid: pc, team: 'csk' }); await call({ a: 'claim', code, pid: pr, team: 'rcb' });
  let v = await call({ a: 'opt', code, pid: ph, timer: 'blitz', rtm: 1, form: 1, sponsor: 1 });
  ok(v.opts.timer === 'blitz' && v.opts.rtm === 1 && v.opts.sponsor, 'host sets timer, RTM, form, sponsor options');
  ok(!!(await call({ a: 'opt', code, pid: pm, timer: 'calm' })).err, 'non-host cannot change options');
  v = await call({ a: 'start', code, pid: ph }); ok(v.bidMs === 5000, 'blitz timer is 5 s');
  // jump bid
  const need = v.base; let x = await call({ a: 'bid', code, pid: pm, amt: need + 0.1, jump: 1 }); ok(!!x.err, 'jump with odd step is rejected');
  x = await call({ a: 'bid', code, pid: pm, amt: need + 1, jump: 1 }); ok(x.bid === need + 1 && x.lead === 'mi', 'jump bid accepted');
  // auto bid: CSK sets max, MI cannot outbid beyond it
  x = await call({ a: 'auto', code, pid: pc, max: need + 3 }); ok(x.lead === 'csk' && x.auto === need + 3, 'auto-bid takes the lead right away');
  x = await call({ a: 'bid', code, pid: pm, amt: x.bid + (x.bid < 2 ? .25 : .5) }); ok(x.lead === 'csk', 'auto-bid answers a human bid');
  const cur = x.cur; x = await call({ a: 'auto', code, pid: pc, max: 9999 }); ok(!!x.err, 'auto-bid above purse is rejected');
  // sell + undo
  x = await call({ a: 'join', name: 'Host', code, pid: ph }); x = await call({ a: 'sell', code, pid: ph }); ok(x.res.k === 'sold', 'sold to CSK');
  const csk = () => x.teams.find(t => t.id === 'csk');
  x = await call({ a: 'undo', code, pid: pc }); ok(!!x.err, 'only host can undo');
  x = await call({ a: 'undo', code, pid: ph }); ok(x.cur === cur && x.stage === 'bid' && csk().sq.length === 0 && csk().purse === 100, 'undo returns the player and refunds the purse');
  // Right to Match: find a lot whose 2026 team is MI, let CSK win it
  let rtmSeen = false;
  for (let g = 0; g < 400 && !rtmSeen; g++) {
    x = await call({ a: 'join', name: 'Host', code, pid: ph });
    if (x.phase !== 'auction') break;
    if (x.stage === 'bid' && P[x.cur].t === 'mi') {
      x = await call({ a: 'bid', code, pid: pc, amt: x.base });
      x = await call({ a: 'sell', code, pid: ph });
      if (x.stage === 'rtm') { rtmSeen = true; ok(x.rtm.t === 'mi' && x.rtm.w === 'csk', 'RTM window opens for the former team'); }
    } else if (x.stage === 'bid') x = await call({ a: 'sell', code, pid: ph });
    else await wait(60);
  }
  ok(rtmSeen, 'found a lot that triggers RTM');
  if (rtmSeen) {
    x = await call({ a: 'rtm', code, pid: pc }); ok(!!x.err, 'wrong team cannot use RTM');
    x = await call({ a: 'rtm', code, pid: pm }); ok(x.res && x.res.rtm === 1 && x.res.t === 'mi' && x.teams.find(t => t.id === 'mi').rtm === 0, 'RTM moves the player to MI and uses the card');
    x = await call({ a: 'undo', code, pid: ph }); ok(!x.err && x.teams.find(t => t.id === 'mi').rtm === 1 && x.teams.find(t => t.id === 'mi').sq.length === 0, 'undo also gives the RTM card back');
  }
  // room controls
  x = await call({ a: 'lock', code, pid: ph }); ok(x.locked, 'host locks the room');
  x = await call({ a: 'join', name: 'Newbie', code }); ok(!!x.err, 'locked room refuses new people');
  x = await call({ a: 'join', name: 'mira', code }); ok(!x.err && x.you.team === 'mi', 'rejoin by name works even when locked');
  const idx = n => x.players.findIndex(p => p.name === n); const iR = idx('Rohan'), iC = idx('Chet');
  x = await call({ a: 'givehost', code, pid: ph, n: iR }); ok(x.players.find(p => p.name === 'Rohan').host, 'host passes the crown');
  x = await call({ a: 'kick', code, pid: ph, n: iC }); ok(!!x.err, 'ex-host can no longer kick');
  x = await call({ a: 'kick', code, pid: pr, n: iC }); ok(!x.players.some(p => p.name === 'Chet'), 'new host kicks a player');
  // finish, XI, history
  x = await call({ a: 'end', code, pid: pr }); ok(x.phase === 'done' && x.form && x.xi, 'auction ends; form map and XI are sent at the end');
  const own = x.teams.find(t => t.id === 'mi');
  x = await call({ a: 'xi', code, pid: ph, ids: [] }); ok(!!x.err, 'people without a team cannot set an XI');
  const h = await (await fetch('http://localhost:3999/history')).json(); ok(h.h.length >= 1 && h.h[h.h.length - 1].code === code, 'finished auction is saved to history');
  srv.kill('SIGTERM'); await wait(300); srv = start(5); await wait(700);
  let n = 0; for (let g = 0; g < 9; g++) { const y = await call({ a: 'join', name: 'rl' + g, code: 'ZZZZ' }); if (y.err && /Too many/.test(y.err)) n++; }
  ok(n >= 3, 'rate limiter blocks request floods');
}

/* a finished trade must be sent to everyone (owners and spectators) so each phone can play the animation once */
async function tradeTest() {
  const a = await call({ a: 'create', name: 'Asha' }), code = a.code, pa = a.you.pid;
  const pb = (await call({ a: 'join', name: 'Bala', code })).you.pid, pw = (await call({ a: 'join', name: 'Watcher', code })).you.pid;
  await call({ a: 'claim', code, pid: pa, team: 'mi' }); await call({ a: 'claim', code, pid: pb, team: 'csk' });
  let v = await call({ a: 'start', code, pid: pa }); v = await call({ a: 'bid', code, pid: pb, amt: v.base }); v = await call({ a: 'sell', code, pid: pa });
  const csk = v.teams.find(t => t.id === 'csk'), pl = csk.sq[0][0];
  ok(v.lt === null, 'no trade animation data before any trade');
  v = await call({ a: 'tpropose', code, pid: pb, to: 'mi', gp: [pl], gc: 1, rp: [], rc: 0 }); ok(!v.err, 'CSK proposes a trade');
  const id = v.trades[0].id;
  v = await call({ a: 'taccept', code, pid: pa, id }); ok(!v.err && v.lt && v.lt.n === 1 && v.lt.from === 'csk' && v.lt.to === 'mi' && v.lt.gp[0] === pl && v.lt.gc === 1, 'accepted trade is described in the state (lt)');
  const w = await call({ a: 'join', name: 'Watcher', code, pid: pw }); ok(w.lt && w.lt.n === 1 && !w.you.team, 'a spectator receives the same trade');
  ok(w.teams.find(t => t.id === 'mi').sq.some(x => x[0] === pl), 'player moved to MI');
}

/* ending early must still leave every team with the minimum squad, and the XI keeps the batting order + captain */
async function minSquadTest() {
  const a = await call({ a: 'create', name: 'Asha' }), code = a.code, pa = a.you.pid;
  const pb = (await call({ a: 'join', name: 'Bala', code })).you.pid;
  await call({ a: 'claim', code, pid: pa, team: 'mi' }); await call({ a: 'claim', code, pid: pb, team: 'csk' });
  let v = await call({ a: 'start', code, pid: pa });
  ok(v.minsq === 18 && v.maxsq === 25, 'minimum squad is sent (18 of 25)');
  v = await call({ a: 'end', code, pid: pa });
  ok(v.phase === 'done' && v.teams.every(t => t.sq.length >= v.minsq), 'every team ends with at least the minimum squad');
  ok(v.teams.every(t => t.os <= 8 && t.purse >= 0), 'auto-buy respects the overseas limit and the purse');
  const sq = v.teams.find(t => t.id === 'mi').sq.map(x => x[0]), ids = sq.slice(0, 11).reverse();
  let x = await call({ a: 'xi', code, pid: pa, ids, cap: ids[3], vc: ids[3] }); ok(!!x.err, 'captain and vice-captain must differ');
  x = await call({ a: 'xi', code, pid: pa, ids, cap: sq[12], vc: ids[1] }); ok(!!x.err, 'captain must be inside the XI');
  x = await call({ a: 'xi', code, pid: pa, ids, cap: ids[3], vc: ids[1] });
  if (!x.err) ok(JSON.stringify(x.xi.mi) === JSON.stringify(ids) && x.xc.mi.c === ids[3] && x.xc.mi.v === ids[1], 'batting order and captain are saved exactly as given');
  else ok(/overseas/.test(x.err), 'XI rejected only for the overseas rule: ' + x.err);
  // close game: only the host, only when finished; room disappears
  x = await call({ a: 'close', code, pid: pb }); ok(!!x.err, 'non-host cannot close the game');
  x = await call({ a: 'close', code, pid: pa }); ok(x.closed === 1, 'host closes the finished game');
  x = await call({ a: 'join', name: 'Late', code }); ok(!!x.err, 'closed room can no longer be joined');
}
