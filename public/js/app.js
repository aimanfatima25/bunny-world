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
  const HUB_HINT = 'Pick a friend, then tap a game';

  const stage = $('stage'), layer = $('layer');
  const hub = $('hub'), play = $('play'), over = $('over');
  let scale = 1, game = null, current = null, heroRaf = 0, toastTimer = 0;

  // ---------- sizing ----------

  function fitLayer() {
    scale = stage.clientWidth / 360;
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

  // ---------- friends ----------

  function drawHero(t) {
    const ctx = $('heroCanvas').getContext('2d');
    ctx.clearRect(0, 0, 170, 150);
    ctx.fillStyle = 'rgba(59, 47, 74, .12)';
    ctx.beginPath(); ctx.ellipse(82, 140, 40, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(80, 98 + Math.sin(t * 3) * 4);
    ctx.scale(2.3, 2.3);
    chars.draw(ctx, store.data.character, { flap: Math.sin(t * 3) * 0.12 });
    ctx.restore();
  }

  function heroLoop(now) {
    drawHero(now / 1000);
    heroRaf = requestAnimationFrame(heroLoop);
  }

  function renderFriends() {
    const box = $('friends');
    box.innerHTML = '';
    chars.list.filter(c => store.data.unlocked.includes(c.id)).forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'friend';
      b.dataset.id = c.id;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(c.id === store.data.character));
      b.setAttribute('aria-label', c.name);
      const canvas = document.createElement('canvas');
      b.appendChild(canvas);
      const ctx = fitCanvas(canvas, 46, 46);
      ctx.translate(21, 30); ctx.scale(0.72, 0.72);
      chars.draw(ctx, c.id);
      b.addEventListener('click', () => pickFriend(c.id));
      box.appendChild(b);
    });
    const locked = chars.list.filter(c => !store.owns(c.id)).length;
    if (locked) {
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'friend locked';
      more.setAttribute('aria-label', `${locked} more friends in the shop`);
      more.innerHTML = icon('i-shop') + '+' + locked;
      more.addEventListener('click', openShop);
      box.appendChild(more);
    }
  }

  function pickFriend(id) {
    store.setCharacter(id);
    $('heroName').textContent = chars.list.find(c => c.id === id).name;
    document.querySelectorAll('.friend[role="radio"]').forEach(b => {
      b.setAttribute('aria-checked', String(b.dataset.id === id));
    });
  }

  // ---------- games menu ----------

  function renderGames() {
    const box = $('games');
    GAMES.forEach(g => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'game';
      b.setAttribute('aria-label', g.soon ? `${g.name}, coming soon` : g.name);
      b.title = g.name;
      b.innerHTML = icon(g.icon) + (g.soon ? `<span class="soon">${icon('i-lock')}</span>` : '');
      b.addEventListener('click', () => startGame(g));
      box.appendChild(b);
    });
    const more = document.createElement('div');
    more.className = 'game more';
    more.innerHTML = icon('i-lock') + 'Soon';
    box.appendChild(more);
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
    $('hint').textContent = 'Spend coins to unlock new friends';
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

  function renderShop() {
    $('shopCoins').textContent = store.data.coins.toLocaleString('en-US');
    const grid = $('shopGrid');
    grid.innerHTML = '';
    chars.list.forEach(c => {
      const owned = store.owns(c.id);
      const card = document.createElement('div');
      card.className = 'shop-card' + (owned ? ' owned' : '');
      const canvas = document.createElement('canvas');
      card.appendChild(canvas);
      const ctx = fitCanvas(canvas, 70, 70);
      ctx.translate(33, 44); ctx.scale(1.05, 1.05);
      chars.draw(ctx, c.id);
      const name = document.createElement('div');
      name.className = 'shop-name';
      name.textContent = c.name;
      card.appendChild(name);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shop-btn';
      if (store.data.character === c.id) {
        btn.textContent = 'Playing';
        btn.classList.add('playing');
      } else if (owned) {
        btn.textContent = 'Pick';
        btn.addEventListener('click', () => { pickFriend(c.id); renderShop(); });
      } else {
        btn.innerHTML = icon('i-coin') + c.price;
        btn.setAttribute('aria-label', `Buy ${c.name} for ${c.price} coins`);
        if (store.data.coins < c.price) btn.classList.add('short');
        btn.addEventListener('click', () => buy(c));
      }
      card.appendChild(btn);
      grid.appendChild(card);
    });
  }

  // First tap asks "Buy?", second tap buys, so nobody buys by accident
  function buy(c) {
    if (store.data.coins < c.price) {
      toast(`You need ${(c.price - store.data.coins).toLocaleString('en-US')} more coins`);
      return;
    }
    if (armedBuy !== c.id) {
      armedBuy = c.id;
      renderShop();
      const again = [...$('shopGrid').querySelectorAll('.shop-btn')][chars.list.indexOf(c)];
      again.textContent = 'Buy?';
      again.classList.add('confirm');
      setTimeout(() => { if (armedBuy === c.id) { armedBuy = null; if (!$('shop').hidden) renderShop(); } }, 3000);
      return;
    }
    armedBuy = null;
    store.buyFriend(c.id, c.price);
    pickFriend(c.id);
    renderShop();
    toast(`${c.name} joined you!`);
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
    fitCanvas($('heroCanvas'), 170, 150);
    renderFriends();
  }

  window.addEventListener('resize', resizeAll);
  window.addEventListener('keydown', e => {
    if (BW.fishMaker.isOpen()) return;
    if (aquarium && e.code === 'Escape') { closeAquarium(); return; }
    if (!$('shop').hidden && e.code === 'Escape') { closeShop(); return; }
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
  $('aquariumBack').addEventListener('click', closeAquarium);
  document.querySelectorAll('.nav [data-soon]').forEach(b => {
    b.addEventListener('click', () => toast(`${b.dataset.soon} is coming soon!`));
  });

  resizeAll();
  renderGames();
  pickFriend(store.data.character);
  showCoins();
  showGift();
  $('hint').textContent = HUB_HINT;
  heroRaf = requestAnimationFrame(heroLoop);
})();
