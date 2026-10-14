// Saved progress: coins, chosen character, best scores, daily gift, custom fish.
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
    lastGift: '',
    myFish: [],
    playerName: ''
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
    claimGift(day) { data.lastGift = day; save(); },
    addCustomFish(design) { data.myFish.push(design); save(); },
    owns(id) { return data.unlocked.includes(id); },
    setName(name) { data.playerName = name; save(); },
    // A random id for this device, so the leaderboard keeps one best score per player
    playerId() {
      if (!data.playerId) {
        data.playerId = (crypto.randomUUID ? crypto.randomUUID() : 'p-' + Date.now().toString(36) + Math.random().toString(36).slice(2)).toLowerCase();
        save();
      }
      return data.playerId;
    },
    // returns false when there aren't enough coins
    buyFriend(id, price) {
      if (data.coins < price || data.unlocked.includes(id)) return false;
      data.coins -= price;
      data.unlocked.push(id);
      save();
      return true;
    }
  };
})();
