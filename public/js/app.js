// The home screen: coins, daily gift, picking a friend, and starting games.
(() => {
  const store = BW.store;
  const chars = BW.characters;
  const $ = id => document.getElementById(id);

  const GAMES = [
    { id: 'flappy', name: 'Flappy Bunny', icon: 'ic-flappy', hint: 'Tap, click or press Space to hop' },
    { id: 'fish', name: 'Fishy Merge', icon: 'ic-fish', soon: true },
    { id: 'carrot', name: 'Carrot Catch', icon: 'ic-carrot', soon: true },
    { id: 'memory', name: 'Memory Match', icon: 'ic-memory', soon: true },
    { id: 'bubble', name: 'Bubble Pop', icon: 'ic-bubble', soon: true }
  ];
  const GIFT_COINS = 50;
  const HUB_HINT = 'Pick a friend, then tap a game';
  const LOCKED_FRIENDS = 9;

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
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'friend locked';
    more.setAttribute('aria-label', `${LOCKED_FRIENDS} more friends, coming to the shop`);
    more.innerHTML = icon('i-lock') + '+' + LOCKED_FRIENDS;
    more.addEventListener('click', () => toast('More friends are coming to the shop!'));
    box.appendChild(more);
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

  // Coins: 1 per point, plus a bonus for each carrot medal.
  function onGameOver(score) {
    const id = current.id;
    const isBest = score > store.best(id);
    if (isBest) store.setBest(id, score);
    const medal = score >= 30 ? ['Golden carrot!', 50] : score >= 15 ? ['Silver carrot!', 25] : score >= 5 ? ['Bronze carrot!', 10] : null;
    const earned = score + (medal ? medal[1] : 0);
    store.addCoins(earned);

    $('score').textContent = score;
    $('best').textContent = store.best(id);
    $('badge').textContent = medal ? medal[0] : (isBest && score > 0 ? 'New best!' : '');
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
