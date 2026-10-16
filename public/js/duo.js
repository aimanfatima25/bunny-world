// Playing a game together with a friend (each on their own phone).
//   BW.duo.invite(username, gameId)   invite a friend; shows "Waiting for…" until they join
//   incoming invites arrive with the account ping and pop up "Join / No thanks"
// When both are in, app.startGame(game, { duo: session }) starts the game on both phones.
// A session (what the games use):
//   session.startAt            local time (ms) when play begins (after a 3-2-1)
//   session.seed               the same random number on both phones (same pillars etc.)
//   session.me / session.them  { username, name, girl, pet }
//   session.set(state)         your live state; sent about 4 times a second
//   session.other()            your friend's latest state ({} until it arrives)
//   session.finish(score)      you're done; resolves with { mine, theirs, result: 'win'|'lose'|'tie' }
//                              once your friend is done too (or has left, or after 40 s)
//   session.leave()
window.BW = window.BW || {};

BW.duo = (() => {
  const $ = id => document.getElementById(id);
  const acc = BW.account;
  const NAMES = { flappy: 'Flappy Bunny', catch: 'Catch the Fish', fish: 'Merge the Fish', sushi: 'Sushi Shop', ramen: 'Ramen Shop', cake: 'Cake & Sweets' };
  const GAMES = Object.keys(NAMES);

  async function post(path, body) {
    try {
      const res = await fetch(acc.API + path, {
        method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ player: BW.store.playerId() }, body))
      });
      const data = await res.json().catch(() => ({}));
      return res.ok ? data : { error: data.error || 'Something went wrong' };
    } catch (e) { return null; }
  }

  // ---------- one game together ----------

  function session(match) {
    const offset = match.now - Date.now();            // server clock minus ours
    const meKey = match.you, themKey = meKey === 'host' ? 'guest' : 'host';
    let mine = {}, theirs = {}, timer = 0, ended = false, lastSent = '';
    const s = {
      id: match.id, game: match.game, seed: match.seed,
      startAt: match.startAt - offset,
      me: match[meKey], them: match[themKey],
      set(state) { mine = Object.assign(mine, state); },
      other: () => theirs,
      leave() { ended = true; clearInterval(timer); post('/api/match/leave', { id: s.id }); }
    };
    async function sync() {
      if (ended) return;
      const body = JSON.stringify(mine);
      const r = await post('/api/match/state', { id: s.id, state: mine });
      lastSent = body;
      if (r && r.match) theirs = r.match.states[themKey] || {};
      else if (r && r.error) theirs = Object.assign({}, theirs, { left: true, done: true });
    }
    timer = setInterval(sync, 250);
    sync();
    s.finish = score => {
      s.set({ score, done: true });
      return new Promise(resolve => {
        const t0 = Date.now();
        const check = setInterval(() => {
          const o = theirs;
          if (o.done || o.left || Date.now() - t0 > 40000) {
            clearInterval(check);
            setTimeout(() => { ended = true; clearInterval(timer); }, 1500);   // a last update or two
            const them = Number(o.score) || 0;
            resolve({ mine: score, theirs: them, left: !!o.left && !o.score,
              result: score > them ? 'win' : score < them ? 'lose' : 'tie' });
          }
        }, 300);
      });
    };
    return s;
  }

  let waiting = null, waitTimer = 0, active = null;

  function begin(match) {
    stopWaiting();
    $('invitePopup').hidden = true;
    $('duoWait').hidden = true;
    active = session(match);
    BW.app.startDuo(match.game, active);
  }

  // ---------- sending an invite ----------

  async function invite(username, game) {
    const r = await post('/api/match/invite', { username, game });
    if (!r) { BW.app.toast("Can't reach the friends server right now"); return; }
    if (r.error) { BW.app.toast(r.error); return; }
    waiting = r.match;
    $('duoWaitText').textContent = `Waiting for @${username} to join ${NAMES[game]}…`;
    $('duoWait').hidden = false;
    clearInterval(waitTimer);
    waitTimer = setInterval(async () => {
      if (!waiting) return;
      const m = await post('/api/match/state', { id: waiting.id, state: {} });
      if (!m || !waiting) return;
      if (m.error || m.match.status === 'declined' || m.match.status === 'cancelled') {
        BW.app.toast(m.match && m.match.status === 'declined' ? `@${username} can't play right now` : 'The invite ended');
        stopWaiting(); $('duoWait').hidden = true; return;
      }
      if (m.match.status === 'playing') begin(m.match);
    }, 1000);
  }

  function stopWaiting() { clearInterval(waitTimer); waiting = null; }

  function cancelWaiting() {
    if (waiting) post('/api/match/leave', { id: waiting.id });
    stopWaiting();
    $('duoWait').hidden = true;
  }

  // ---------- choosing a game for a friend ----------

  let pickFor = null;
  function pickGame(username) {
    pickFor = username;
    $('duoPickTitle').textContent = `Play with @${username}`;
    const box = $('duoPickList');
    box.innerHTML = '';
    GAMES.forEach(id => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'duo-game';
      b.innerHTML = `<img src="img/games/${id === 'fish' ? 'merge' : id}.webp" alt=""><span>${NAMES[id]}</span>`;
      b.addEventListener('click', () => { $('duoPick').hidden = true; BW.sound.play('click'); invite(pickFor, id); });
      box.appendChild(b);
    });
    $('duoPick').hidden = false;
  }

  // ---------- receiving an invite ----------

  const seen = new Set();
  let shown = null;
  function onInvites(list) {
    if (active || waiting || shown || !list || !list.length) return;
    const m = list.find(x => !seen.has(x.id));
    if (!m) return;
    seen.add(m.id);
    shown = m;
    $('inviteText').innerHTML = `<b>@${m.host.username}</b> wants to play<br><b>${NAMES[m.game]}</b> with you!`;
    $('inviteImg').src = `img/games/${m.game === 'fish' ? 'merge' : m.game}.webp`;
    $('invitePopup').hidden = false;
    BW.sound.play('sparkle');
  }
  async function answer(yes) {
    const m = shown; shown = null;
    $('invitePopup').hidden = true;
    if (!m) return;
    const r = await post('/api/match/answer', { id: m.id, accept: yes });
    if (yes) {
      if (!r || r.error || !r.match) { BW.app.toast((r && r.error) || "Can't reach the friends server"); return; }
      begin(r.match);
    }
  }

  function ended() { if (active) { active.leave(); active = null; } }

  function wire() {
    $('duoCancel').addEventListener('click', cancelWaiting);
    $('duoPickClose').addEventListener('click', () => { $('duoPick').hidden = true; });
    $('inviteYes').addEventListener('click', () => answer(true));
    $('inviteNo').addEventListener('click', () => answer(false));
  }

  return { wire, invite, pickGame, onInvites, ended, NAMES, get active() { return active; } };
})();
