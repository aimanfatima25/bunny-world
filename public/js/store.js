// Saved progress: coins, chosen character, best scores, daily gift.
// Lives in the browser's localStorage, so it stays after closing the page.
window.BW = window.BW || {};

BW.store = (() => {
  const KEY = 'bunny-world-save';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  const data = Object.assign({
    coins: 0,
    character: 'bunny',
    unlocked: ['bunny', 'kitty', 'panda', 'chick'],
    best: {},
    lastGift: ''
  }, load());

  // Carry over the best score from the old single-game version
  try {
    const old = Number(localStorage.getItem('flappy-bunny-best')) || 0;
    if (old > (data.best.flappy || 0)) data.best.flappy = old;
  } catch (e) {}

  return {
    data,
    addCoins(n) { data.coins += n; save(); },
    best(gameId) { return data.best[gameId] || 0; },
    setBest(gameId, score) { data.best[gameId] = score; save(); },
    setCharacter(id) { data.character = id; save(); },
    claimGift(day) { data.lastGift = day; save(); }
  };
})();
