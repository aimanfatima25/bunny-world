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
    unlocked: ['bunny', 'cat', 'panda', 'chick'],
    best: {},
    lastGift: '',
    myFish: [],
    playerName: '',
    girl: 'girl-1'   // the person you are: a girl ('girl-3') or a guy ('guy-2')
  }, load());

  // Friends were replaced by Aiman's picture animals (friends.js). Keep the ones that still
  // exist (two were renamed) and give back the stars for the ones that are gone.
  const RENAMED = { kitty: 'cat', dog: 'puppy' };
  const GONE = { frog: 100, parrot: 200, wolf: 300, mimi: 500, momo: 500, unicorn: 800 };
  const before = JSON.stringify([data.unlocked, data.character]);
  data.unlocked = data.unlocked.map(id => RENAMED[id] || id).filter(id => {
    if (id in GONE) { data.coins += GONE[id]; return false; }
    return true;
  });
  ['bunny', 'cat', 'panda', 'chick', 'girl-1', 'girl-2', 'girl-4', 'guy-1', 'guy-2'].forEach(id => { if (!data.unlocked.includes(id)) data.unlocked.push(id); });
  data.character = RENAMED[data.character] || data.character;
  if (!data.unlocked.includes(data.character)) data.character = 'bunny';
  if (JSON.stringify([data.unlocked, data.character]) !== before) save();

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
    setGirl(id) { data.girl = id; save(); },
    claimGift(day) { data.lastGift = day; save(); },
    addCustomFish(design) { data.myFish.push(design); save(); },
    owns(id) { return data.unlocked.includes(id); },
    setName(name) { data.playerName = name; save(); },
    // the ID card's extra lines
    setProfile(birthday, skill) { data.birthday = birthday; data.skill = skill; save(); },
    // the Settings switches: { sfx, music }
    setSound(sound) { data.sound = { sfx: sound.sfx, music: sound.music }; save(); },
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
