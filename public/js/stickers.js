// Stickers (Aiman's designs, public/img/stickers/) you earn and keep in your Collection.
//   1st Win            your first win in a game together
//   10 Win in Row      10 wins in a row in games together
//   Hidden Gem         a win after losing 3 or more in a row in games together
//   Loyal Member       opening the game 14 days in a row
//   1st … 10th         your place on the Richest Players list (most stars, from 1,000 stars);
//                      you keep each place you reach
//   Winner in Town     being in the Top 10 of 5 different games
// Earned stickers live in store.data.stickers ({ id: 'YYYY-MM-DD' }); the Collection page
// shows them in colour and the others locked with a hint.
window.BW = window.BW || {};

BW.stickers = (() => {
  const $ = id => document.getElementById(id);
  const store = BW.store;
  const TOWN_GAMES = 5, LOYAL_DAYS = 14, GEM_LOSSES = 3, WIN_ROW = 10, RICH_MIN = 1000;
  const ord = n => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');

  const LIST = [
    { id: 'first-win', name: '1st Win', hint: 'Win a game against a friend' },
    { id: 'ten-wins', name: '10 Wins in a Row', hint: `Win ${WIN_ROW} games in a row against friends` },
    { id: 'hidden-gem', name: 'Hidden Gem', hint: `Win after losing ${GEM_LOSSES} times in a row to friends` },
    { id: 'loyal-member', name: 'Loyal Member', hint: `Play ${LOYAL_DAYS} days in a row` },
    { id: 'winner-in-town', name: 'Winner in Town', hint: `Get into the Top 10 of ${TOWN_GAMES} different games` },
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `rank-${i + 1}`, name: i === 0 ? '1st in Top 10' : `${ord(i + 1)} Winner`,
      hint: `Be the ${ord(i + 1)} richest player (1,000+ stars)`
    }))
  ];

  const data = () => (store.data.stickers = store.data.stickers || {});
  const has = id => !!data()[id];
  const today = () => new Date().toISOString().slice(0, 10);

  // ---------- earning ----------

  const queue = [];
  function award(id) {
    if (has(id) || !LIST.find(s => s.id === id)) return;
    data()[id] = today();
    store.save();
    queue.push(id);
    if (queue.length === 1) showNext();
    const s = LIST.find(x => x.id === id);
    if (BW.mail) BW.mail.add('🎀', 'New sticker!', `You earned "${s.name}". Find it in your Collection.`);
    const nav = $('collectionNav');
    if (nav) nav.classList.add('has-dot');
  }

  function showNext() {
    const id = queue[0];
    if (!id) return;
    // not in the middle of a game or a pop-up: try again in a moment
    const busy = ['play', 'invitePopup', 'duoWait', 'duoPick', 'unPopup'].some(x => $(x) && !$(x).hidden);
    if (busy) { setTimeout(showNext, 2000); return; }
    const s = LIST.find(x => x.id === id);
    $('stickerImg').src = `img/stickers/${id}.webp`;
    $('stickerName').textContent = s.name;
    $('stickerPopup').hidden = false;
    if (BW.sound) BW.sound.play('sparkle');
  }
  function closePopup() {
    $('stickerPopup').hidden = true;
    queue.shift();
    if (queue.length) setTimeout(showNext, 300);
  }

  // opening the game: count the days in a row
  function visit() {
    const v = store.data.visit || { last: '', streak: 0 };
    const t = today();
    if (v.last !== t) {
      const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      v.streak = v.last === y ? v.streak + 1 : 1;
      v.last = t;
      store.data.visit = v;
      store.save();
      // a note for each streak milestone
      if ([2, 3, 5, 7, 10, 14, 21, 30].includes(v.streak) && BW.mail) {
        BW.mail.add('🔥', `${v.streak}-day streak!`, `You've played ${v.streak} days in a row. Keep it going ♥`);
      }
    }
    if (v.streak >= LOYAL_DAYS) award('loyal-member');
  }

  // after a game together: 'win', 'lose' or 'tie'
  function duoResult(result) {
    const st = store.data.duoStats = store.data.duoStats || { wins: 0, losses: 0, winStreak: 0, lossStreak: 0 };
    if (result === 'win') {
      if (st.wins === 0) award('first-win');
      if (st.lossStreak >= GEM_LOSSES) award('hidden-gem');
      st.wins++; st.winStreak++; st.lossStreak = 0;
      if (st.winStreak >= WIN_ROW) award('ten-wins');
    } else if (result === 'lose') {
      st.losses++; st.lossStreak++; st.winStreak = 0;
    }
    store.save();
  }

  // the leaderboard said where you are in a game
  function topRank(game, rank) {
    if (!rank) return;
    const t = store.data.top10 = store.data.top10 || {};
    if (rank <= 10 && (!t[game] || rank < t[game])) {
      t[game] = rank; store.save();
      const names = { flappy: 'Flappy Bunny', catch: 'Catch the Fish', fish: 'Merge the Fish', bubble: 'Bubble Pop', memory: 'Memory',
        sushi: 'Sushi Shop', ramen: 'Ramen Shop', cake: 'Cake & Sweets', pancake: 'Pancake Shop' };
      if (BW.mail) BW.mail.add('🌟', `#${rank} in the Top 10!`, `You're #${rank} in ${names[game] || game}. Amazing!`);
    }
    if (Object.keys(t).length >= TOWN_GAMES) award('winner-in-town');
  }

  // your place among the richest players (from the server)
  function richRank(rank) {
    store.data.richRank = rank || null;
    if (rank && rank <= 10 && store.data.coins >= RICH_MIN) award(`rank-${rank}`);
  }

  // ---------- the Collection page ----------

  function render() {
    const grid = $('stickerGrid');
    grid.innerHTML = '';
    const got = LIST.filter(s => has(s.id)).length;
    $('stickerCount').textContent = `${got} / ${LIST.length}`;
    const r = store.data.richRank;
    $('richLine').textContent = r ? `You're the ${ord(r)} richest player ⭐` : 'Make an account in Friends to join the Richest Players list';
    LIST.forEach(s => {
      const el = document.createElement('div');
      el.className = 'sticker' + (has(s.id) ? '' : ' locked');
      el.innerHTML = `<img src="img/stickers/${s.id}.webp" alt=""><b>${s.name}</b><small>${has(s.id) ? 'Earned ' + data()[s.id] : s.hint}</small>`
        + (has(s.id) ? '' : '<i class="lock">🔒</i>');
      grid.appendChild(el);
    });
  }

  function open() {
    $('collectionNav').classList.remove('has-dot');
    render();
    BW.app.showScreen('collectionPage');
  }

  function wire() {
    $('stickerOk').addEventListener('click', closePopup);
    visit();
  }

  return { wire, open, render, award, duoResult, topRank, richRank, LIST };
})();
