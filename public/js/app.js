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
    { id: 'fish', name: 'Merge the Fish', icon: 'ic-fish', overTitle: 'Tank full!', medal: 'shell', medals: [300, 900, 1800], coinRate: 0.05,
      hint: 'Tap a fish, then tap its twin to merge' },
    { id: 'catch', name: 'Catch the Fish', icon: 'ic-fish', overTitle: "Time's up!", medal: 'shell', medals: [15, 35, 60], coinRate: 1,
      hint: 'Tap a fish to scoop it up with your net' },
    { id: 'memory', name: 'Memory', icon: 'ic-memory', overTitle: "Time's up!", medal: 'star', medals: [8, 16, 28], coinRate: 1,
      hint: 'Tap two cards to find a pair' },
    { id: 'bubble', name: 'Bubble Pop', icon: 'ic-bubble', overTitle: 'Pop!', medal: 'bubble', medals: [200, 600, 1500], coinRate: 0.05,
      hint: 'Aim, then let go to shoot. Match 3 to pop!' }
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

  // The chosen girl is the profile picture; she and the chosen animal sit on the cottage ledge
  function showGirl() {
    $('avatarBtn').querySelector('img').src = BW.friends.img(store.data.girl);
    $('sceneGirl').src = `img/cutouts/girls/${store.data.girl}.webp`;
    $('scenePet').src = `img/cutouts/friends/${store.data.character}.webp`;
  }

  // ---------- games menu ----------
  // The 12 cards from the design. game: starts that game, open: opens a page, neither: coming soon

  const TILES = [
    { label: 'Flappy Bunny', img: 'flappy', game: 'flappy' },
    { label: 'Catch the Fish', img: 'catch', game: 'catch' },
    { label: 'Merge the Fish', img: 'merge', game: 'fish' },
    { label: 'Match 3', img: 'match3' },
    { label: 'Adventure', img: 'adventure' },
    { label: 'Bubble Pop', img: 'bubble', game: 'bubble' },
    { label: 'Memory', img: 'memory', game: 'memory' },
    { label: 'Decorate Room', img: 'room' },
    { label: 'Dress Up', img: 'dressup' },
    { label: 'Garden', img: 'garden' },
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

  // ---------- Choose Your Girl / Choose Your Friend ----------

  const CHOOSE = {
    girls: {
      title: 'Choose Your Girl', header: 'header-girl', groups: ['girls'],
      tabs: [['all', 'All'], ['casual', 'Casual'], ['cozy', 'Cozy'], ['elegant', 'Elegant'], ['school', 'School'], ['fantasy', 'Fantasy']]
    },
    animals: {
      title: 'Choose Your Friend', header: 'header-friend', groups: ['animals', 'sea'],
      tabs: [['all', 'All'], ['mammals', 'Mammals'], ['birds', 'Birds'], ['reptiles', 'Reptiles'], ['sea', 'Sea Friends'], ['others', 'Others']]
    }
  };
  let chooseMode = 'girls', chooseTab = 'all', picked = null;

  function openShop(mode) {
    chooseMode = mode || 'animals';
    chooseTab = 'all';
    const c = CHOOSE[chooseMode];
    $('chooseHeader').src = `img/choose/${c.header}.webp`;
    $('chooseTitle').textContent = c.title;
    document.querySelectorAll('.choose-switch button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === chooseMode)));
    cancelAnimationFrame(heroRaf);
    hub.hidden = true;
    $('shop').hidden = false;
    $('hint').textContent = 'Tap a cubby to pick or unlock';
    renderTabs();
    renderShop();
    $('shopGrid').scrollTop = 0;
  }

  function closeShop() {
    closePick();
    $('shop').hidden = true;
    hub.hidden = false;
    $('hint').textContent = HUB_HINT;
    showCoins();
    heroRaf = requestAnimationFrame(heroLoop);
  }

  function chooseList() {
    return BW.friends.list.filter(f => CHOOSE[chooseMode].groups.includes(f.group));
  }

  function isChosen(f) {
    return f.group === 'girls' ? store.data.girl === f.id : store.data.character === f.id;
  }

  function renderTabs() {
    const box = $('chooseTabs');
    box.innerHTML = '';
    CHOOSE[chooseMode].tabs.forEach(([id, label]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(id === chooseTab));
      b.innerHTML = `<img src="img/choose/tab-${id}.webp" alt=""><span>${label}</span>`;
      b.addEventListener('click', () => { chooseTab = id; renderTabs(); renderShop(); $('shopGrid').scrollTop = 0; });
      box.appendChild(b);
    });
  }

  function renderShop() {
    const all = chooseList();
    $('chooseCount').textContent = `${all.filter(f => store.owns(f.id)).length}/${all.length}`;
    const grid = $('shopGrid');
    grid.innerHTML = '';
    all.filter(f => chooseTab === 'all' || f.cat === chooseTab).forEach(f => {
      const owned = store.owns(f.id);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cubby' + (owned ? '' : ' locked') + (isChosen(f) ? ' chosen' : '') + (f.group === 'girls' ? ' girl' : '');
      b.setAttribute('aria-label', f.name + (isChosen(f) ? ', chosen' : owned ? '' : `, ${f.price} stars`));
      b.innerHTML = `<img src="${BW.friends.img(f.id)}" alt="">`
        + (owned ? '' : `<span class="price">${icon('i-coin')}${f.price}</span>`)
        + (isChosen(f) ? '<span class="heart">♥</span>' : '');
      b.addEventListener('click', () => openPick(f));
      grid.appendChild(b);
    });
  }

  // The card that pops up for one character: choose them, or unlock them with stars
  function openPick(f) {
    picked = f;
    const owned = store.owns(f.id), stars = store.data.coins;
    $('pickImg').src = BW.friends.img(f.id);
    $('pickName').textContent = f.name;
    const main = $('pickMain');
    main.className = 'pick-main';
    if (isChosen(f)) {
      $('pickNote').textContent = f.group === 'girls' ? 'This is you!' : 'Already playing with you';
      main.textContent = 'Chosen ♥';
      main.classList.add('done');
    } else if (owned) {
      $('pickNote').textContent = f.group === 'girls' ? 'Be this girl?' : 'Take this friend along?';
      main.textContent = 'Choose';
    } else {
      $('pickNote').innerHTML = `You have ${icon('i-coin')} ${stars.toLocaleString('en-US')}`;
      main.innerHTML = `Unlock for ${icon('i-coin')} ${f.price}`;
      if (stars < f.price) main.classList.add('short');
    }
    $('pickSheet').hidden = false;
    main.focus();
  }

  function closePick() {
    picked = null;
    $('pickSheet').hidden = true;
  }

  function pickMain() {
    const f = picked;
    if (!f || isChosen(f)) { closePick(); return; }
    if (!store.owns(f.id)) {
      if (store.data.coins < f.price) {
        toast(`You need ${(f.price - store.data.coins).toLocaleString('en-US')} more stars`);
        return;
      }
      store.buyFriend(f.id, f.price);
      toast(`${f.name} unlocked!`);
    } else {
      toast(f.group === 'girls' ? `Hi ${f.name}!` : `${f.name} is with you now!`);
    }
    pickFriend(f.id);
    closePick();
    renderShop();
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
    if (!$('shop').hidden) { if (e.code === 'Escape') { if (picked) closePick(); else closeShop(); } return; }
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
  $('shopNav').addEventListener('click', () => openShop('girls'));
  document.querySelectorAll('.choose-switch button').forEach(b => b.addEventListener('click', () => openShop(b.dataset.mode)));
  $('shopBack').addEventListener('click', closeShop);
  $('pickMain').addEventListener('click', pickMain);
  $('pickClose').addEventListener('click', closePick);
  $('pickSheet').addEventListener('click', e => { if (e.target === $('pickSheet')) closePick(); });
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
  $('friendsNav').addEventListener('click', () => toast('Playing with your friends is coming soon!'));
  $('avatarBtn').addEventListener('click', () => toast('Your account page is coming soon!'));
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
