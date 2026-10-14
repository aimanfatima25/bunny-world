// The home screen: coins, daily gift, picking a friend, and starting games.
(() => {
  const store = BW.store;
  const chars = BW.characters;
  const $ = id => document.getElementById(id);

  // medals: scores needed for bronze, silver and gold
  // coinRate: coins earned per point (games with big scores give less per point)
  const GAMES = [
    { id: 'flappy', name: 'Flappy Bunny', icon: 'ic-flappy', overTitle: 'Bonk!', medal: 'carrot', medals: [5, 15, 30], coinRate: 1,
      hint: 'Tap, click or press Space to hop' },
    { id: 'fish', name: 'Fishy Merge', icon: 'ic-fish', overTitle: 'Tank full!', medal: 'shell', medals: [300, 900, 1800], coinRate: 0.05,
      hint: 'Tap a fish, then tap its twin to merge' },
    { id: 'carrot', name: 'Carrot Catch', icon: 'ic-carrot', overTitle: 'Oops!', medal: 'carrot', medals: [15, 40, 80], coinRate: 0.5,
      hint: 'Drag, move the mouse or use ← → to catch' },
    { id: 'memory', name: 'Memory Match', icon: 'ic-memory', overTitle: "Time's up!", medal: 'star', medals: [8, 16, 28], coinRate: 1,
      hint: 'Tap two cards to find a pair' },
    { id: 'bubble', name: 'Bubble Pop', icon: 'ic-bubble', overTitle: 'Pop!', medal: 'bubble', medals: [25, 60, 120], coinRate: 0.4,
      hint: 'Tap bubbles. Skip the grumpy purple ones!' }
  ];
  const MEDAL_BONUS = [10, 25, 50];
  const GIFT_COINS = 50;
  const HUB_HINT = 'Tap a game to play';

  const stage = $('stage'), layer = $('layer');
  const hub = $('hub'), play = $('play'), over = $('over');
  let scale = 1, game = null, current = null, heroRaf = 0, toastTimer = 0;

  // ---------- sizing ----------

  // Everything is designed 360 wide. On a phone that's taller than 9:16 the layer
  // simply gets taller (the home scene stretches); on a wider screen it's centred.
  function fitLayer() {
    const w = stage.clientWidth, h = stage.clientHeight;
    scale = Math.min(w / 360, h / 640);
    layer.style.height = (h / scale) + 'px';
    layer.style.left = ((w - 360 * scale) / 2) + 'px';
    layer.style.transform = `scale(${scale})`;
  }

  // Make a canvas sharp at its on-screen size; afterwards draw in w x h units.
  function fitCanvas(canvas, w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * scale * dpr);
    canvas.height = Math.round(h * scale * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    return ctx;
  }

  // ---------- little helpers ----------

  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 1800);
  }

  function icon(id) {
    return `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
  }

  function today() { return new Date().toLocaleDateString('en-CA'); }

  function showCoins() { $('coinCount').textContent = store.data.coins.toLocaleString('en-US'); }

  // ---------- the cottage scene ----------
  // For now the scene is the picture from the design. When the separate girl and
  // animal pictures arrive, the chosen girl and chosen animal will sit on the ledge here.

  function heroLoop() {}
  function renderFriends() {}

  // Picks a girl (shown as your profile picture) or an animal (plays with you in the games)
  function pickFriend(id) {
    if (id.startsWith('girl-')) store.setGirl(id);
    else store.setCharacter(id);
    showGirl();
  }

  function showGirl() {
    $('avatarBtn').querySelector('img').src = BW.friends.img(store.data.girl);
  }

  // ---------- games menu ----------
  // The 12 cards from the design. game: starts that game, open: opens a page, neither: coming soon

  const TILES = [
    { label: 'Flappy Bunny', img: 'flappy', game: 'flappy' },
    { label: 'Catch the Fish', img: 'catch', game: 'carrot' },
    { label: 'Merge the Fish', img: 'merge', game: 'fish' },
    { label: 'Match 3', img: 'match3' },
    { label: 'Adventure', img: 'adventure' },
    { label: 'Bubble Pop', img: 'bubble', game: 'bubble' },
    { label: 'Memory', img: 'memory', game: 'memory' },
    { label: 'Decorate Room', img: 'room' },
    { label: 'Dress Up', img: 'dressup' },
    { label: 'Garden', img: 'garden' },
    { label: 'Collect Friends', img: 'friends', open: () => openShop() },
    { label: 'My Aquarium', img: 'aquarium', open: () => openAquarium() }
  ];

  function renderGames() {
    const box = $('games');
    TILES.forEach(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tile';
      const ready = t.game || t.open;
      b.setAttribute('aria-label', ready ? t.label : `${t.label}, coming soon`);
      b.innerHTML = `<img src="img/games/${t.img}.webp" alt=""><span>${t.label}</span>`
        + (ready ? '' : `<em class="soon-tag">Soon</em>`);
      b.addEventListener('click', () => {
        if (t.game) startGame(GAMES.find(g => g.id === t.game));
        else if (t.open) t.open();
        else toast(`${t.label} is coming soon!`);
      });
      box.appendChild(b);
    });
  }

  function startGame(g) {
    if (g.soon) { toast(`${g.name} is coming soon!`); return; }
    current = g;
    cancelAnimationFrame(heroRaf);
    hub.hidden = true;
    play.hidden = false;
    over.hidden = true;
    $('hint').textContent = g.hint;
    game = BW.games[g.id].start($('gameCanvas'), {
      character: store.data.character,
      getBest: () => store.best(g.id),
      onGameOver
    });
  }

  function goHome() {
    if (game) game.stop();
    game = null;
    current = null;
    over.hidden = true;
    play.hidden = true;
    hub.hidden = false;
    $('hint').textContent = HUB_HINT;
    showCoins();
    heroRaf = requestAnimationFrame(heroLoop);
  }

  // ---------- shop ----------

  let armedBuy = null;

  function openShop() {
    cancelAnimationFrame(heroRaf);
    hub.hidden = true;
    $('shop').hidden = false;
    $('hint').textContent = 'Spend stars to unlock new friends';
    renderShop();
  }

  function closeShop() {
    armedBuy = null;
    $('shop').hidden = true;
    hub.hidden = false;
    $('hint').textContent = HUB_HINT;
    showCoins();
    renderFriends();
    heroRaf = requestAnimationFrame(heroLoop);
  }

  let shopTab = 'girls';

  function renderShop() {
    const friends = BW.friends;
    $('shopCoins').textContent = store.data.coins.toLocaleString('en-US');
    document.querySelectorAll('.shop-tabs button').forEach(t => {
      t.setAttribute('aria-selected', String(t.dataset.tab === shopTab));
    });
    const grid = $('shopGrid');
    grid.innerHTML = '';
    friends.list.filter(f => f.group === shopTab).forEach(f => {
      const owned = store.owns(f.id);
      const card = document.createElement('div');
      card.className = 'shop-card' + (owned ? ' owned' : '');
      card.innerHTML = `<img src="${friends.img(f.id)}" alt=""><div class="shop-name"></div>`;
      card.querySelector('.shop-name').textContent = f.name;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shop-btn';
      btn.dataset.id = f.id;
      if (store.data.character === f.id || store.data.girl === f.id) {
        btn.textContent = 'With you';
        btn.classList.add('playing');
      } else if (owned) {
        btn.textContent = 'Pick';
        btn.addEventListener('click', () => { pickFriend(f.id); renderShop(); toast(`${f.name} is with you now!`); });
      } else {
        btn.innerHTML = icon('i-coin') + f.price;
        btn.setAttribute('aria-label', `Buy ${f.name} for ${f.price} stars`);
        if (store.data.coins < f.price) btn.classList.add('short');
        if (armedBuy === f.id) { btn.textContent = 'Buy?'; btn.classList.add('confirm'); }
        btn.addEventListener('click', () => buy(f));
      }
      card.appendChild(btn);
      grid.appendChild(card);
    });
  }

  // First tap asks "Buy?", second tap buys, so nobody buys by accident
  function buy(f) {
    if (store.data.coins < f.price) {
      toast(`You need ${(f.price - store.data.coins).toLocaleString('en-US')} more stars`);
      return;
    }
    if (armedBuy !== f.id) {
      armedBuy = f.id;
      renderShop();
      setTimeout(() => { if (armedBuy === f.id) { armedBuy = null; if (!$('shop').hidden) renderShop(); } }, 3000);
      return;
    }
    armedBuy = null;
    store.buyFriend(f.id, f.price);
    pickFriend(f.id);
    renderShop();
    toast(`${f.name} joined you!`);
  }

  // ---------- top 10 ----------

  let topGame = GAMES[0].id;

  function openTop(gameId) {
    if (gameId) topGame = gameId;
    cancelAnimationFrame(heroRaf);
    hub.hidden = true;
    $('top').hidden = false;
    $('hint').textContent = 'The best players of each game';
    $('playerName').value = store.data.playerName || '';
    renderTopTabs();
    loadTop();
  }

  function closeTop() {
    $('top').hidden = true;
    hub.hidden = false;
    $('hint').textContent = HUB_HINT;
    heroRaf = requestAnimationFrame(heroLoop);
  }

  function renderTopTabs() {
    const box = $('topTabs');
    box.innerHTML = '';
    GAMES.forEach(g => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'top-tab';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(g.id === topGame));
      b.setAttribute('aria-label', g.name);
      b.title = g.name;
      b.innerHTML = icon(g.icon);
      b.addEventListener('click', () => { topGame = g.id; renderTopTabs(); loadTop(); });
      box.appendChild(b);
    });
  }

  async function loadTop() {
    const list = $('topList');
    const asked = topGame;
    const g = GAMES.find(x => x.id === asked);
    list.innerHTML = `<li class="top-msg">Loading ${g.name}…</li>`;
    const rows = await BW.leaderboard.top(asked);
    if (asked !== topGame || $('top').hidden) return;
    if (!rows) { list.innerHTML = '<li class="top-msg">Can\'t reach the Top 10 right now. Check your internet.</li>'; return; }
    if (!rows.length) { list.innerHTML = `<li class="top-msg">No scores yet. Be the first!</li>`; return; }
    list.innerHTML = '';
    rows.forEach((r, i) => {
      const li = document.createElement('li');
      li.className = 'top-row' + (r.you ? ' you' : '') + (i < 3 ? ' medal-' + (i + 1) : '');
      const place = document.createElement('span');
      place.className = 'top-place';
      place.textContent = i + 1;
      const name = document.createElement('span');
      name.className = 'top-player';
      name.textContent = r.name + (r.you ? ' (you)' : '');
      const score = document.createElement('b');
      score.textContent = r.score.toLocaleString('en-US');
      li.append(place, name, score);
      list.appendChild(li);
    });
  }

  // Saving a name also sends every best score you already have
  async function saveName(e) {
    e.preventDefault();
    const name = $('playerName').value.replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 12);
    if (!name) { toast('Type a name first'); return; }
    $('playerName').value = name;
    $('playerName').blur();
    store.setName(name);
    toast(`Hi ${name}!`);
    await Promise.all(GAMES.map(g => BW.leaderboard.submit(g.id, store.best(g.id))));
    loadTop();
  }

  // ---------- aquarium ----------

  let aquarium = null;

  function openAquarium() {
    cancelAnimationFrame(heroRaf);
    hub.hidden = true;
    $('aquarium').hidden = false;
    $('hint').textContent = 'Tap a fish to make it flip';
    aquarium = BW.aquarium.start($('aquariumCanvas'));
  }

  function closeAquarium() {
    if (aquarium) aquarium.stop();
    aquarium = null;
    $('aquarium').hidden = true;
    hub.hidden = false;
    $('hint').textContent = HUB_HINT;
    heroRaf = requestAnimationFrame(heroLoop);
  }

  // Coins: points x the game's coinRate, plus a bonus for each medal.
  function onGameOver(score) {
    const g = current;
    const isBest = score > store.best(g.id);
    if (isBest) store.setBest(g.id, score);
    let level = -1;
    g.medals.forEach((need, i) => { if (score >= need) level = i; });
    const earned = Math.floor(score * g.coinRate) + (level >= 0 ? MEDAL_BONUS[level] : 0);
    store.addCoins(earned);

    $('overTitle').textContent = g.overTitle;
    $('score').textContent = score;
    $('best').textContent = store.best(g.id);
    $('badge').textContent = level >= 0 ? `${['Bronze', 'Silver', 'Golden'][level]} ${g.medal}!` : (isBest && score > 0 ? 'New best!' : '');
    $('earned').textContent = earned;
    $('rankLine').textContent = '';
    $('joinTop').hidden = !!store.data.playerName || score < 1;
    if (store.data.playerName && score > 0) {
      BW.leaderboard.submit(g.id, score).then(r => {
        if (!r || current !== g) return;
        $('rankLine').textContent = r.rank <= 10 ? `#${r.rank} in the Top 10!` : `You're #${r.rank} on the leaderboard`;
      });
    }
    setTimeout(() => {
      if (!game) return;
      over.hidden = false;
      $('againBtn').focus();
    }, 450);
  }

  function playAgain() {
    if (over.hidden || !game) return;
    over.hidden = true;
    game.restart();
  }

  // ---------- daily gift ----------

  function showGift() {
    $('giftBtn').classList.toggle('ready', store.data.lastGift !== today());
  }

  function openGift() {
    if (store.data.lastGift === today()) { toast('Come back tomorrow for another gift!'); return; }
    store.claimGift(today());
    store.addCoins(GIFT_COINS);
    $('giftAmount').textContent = GIFT_COINS;
    $('giftPopup').hidden = false;
    $('giftOk').focus();
    showGift();
  }

  function closeGift() {
    $('giftPopup').hidden = true;
    showCoins();
  }

  // ---------- wiring ----------

  function resizeAll() {
    fitLayer();
    renderFriends();
  }

  window.addEventListener('resize', resizeAll);
  window.addEventListener('keydown', e => {
    if (BW.fishMaker.isOpen()) return;
    if (aquarium && e.code === 'Escape') { closeAquarium(); return; }
    if (!$('shop').hidden && e.code === 'Escape') { closeShop(); return; }
    if (!$('top').hidden) { if (e.code === 'Escape') closeTop(); return; }
    if (!$('giftPopup').hidden && (e.code === 'Escape' || e.code === 'Enter' || e.code === 'Space')) {
      e.preventDefault(); closeGift(); return;
    }
    if (!game) return;
    if (e.code === 'Escape') { goHome(); return; }
    if (!over.hidden && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); playAgain(); }
  });
  $('giftBtn').addEventListener('click', openGift);
  $('giftOk').addEventListener('click', closeGift);
  $('backBtn').addEventListener('click', goHome);
  $('homeBtn').addEventListener('click', goHome);
  $('againBtn').addEventListener('click', playAgain);
  $('aquariumBtn').addEventListener('click', openAquarium);
  $('shopNav').addEventListener('click', openShop);
  $('shopBack').addEventListener('click', closeShop);
  document.querySelectorAll('.shop-tabs button').forEach(t => {
    t.addEventListener('click', () => { shopTab = t.dataset.tab; armedBuy = null; renderShop(); $('shopGrid').scrollTop = 0; });
  });
  $('topNav').addEventListener('click', () => openTop());
  $('topBack').addEventListener('click', closeTop);
  $('nameForm').addEventListener('submit', saveName);
  $('joinTop').addEventListener('click', () => {
    const id = current.id;
    goHome();
    openTop(id);
    $('playerName').focus();
  });
  $('aquariumBack').addEventListener('click', closeAquarium);
  $('friendsNav').addEventListener('click', openShop);
  $('avatarBtn').addEventListener('click', () => { shopTab = 'girls'; openShop(); });
  $('starPlus').addEventListener('click', () => toast('Play games to earn more stars!'));
  $('heartPlus').addEventListener('click', () => toast('Hearts are coming soon!'));
  $('mailBtn').addEventListener('click', () => toast('No new messages'));
  $('settingsBtn').addEventListener('click', () => toast('Settings are coming soon!'));

  resizeAll();
  renderGames();
  pickFriend(store.data.character);
  showCoins();
  showGift();
  $('hint').textContent = HUB_HINT;
  heroRaf = requestAnimationFrame(heroLoop);
})();
