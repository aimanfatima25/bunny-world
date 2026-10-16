// The home screen: coins, daily gift, picking a friend, and starting games.
(() => {
  const store = BW.store;
  const chars = BW.characters;
  const $ = id => document.getElementById(id);

  // medals: scores needed for bronze, silver and gold
  // coinRate: coins earned per point (games with big scores give less per point)
  // stars(info): a game's own star rule instead, from what it reports at game over
  const GAMES = [
    { id: 'flappy', name: 'Flappy Bunny', icon: 'ic-flappy', overTitle: 'Bonk!', medal: 'carrot', medals: [5, 15, 30], coinRate: 1,
      hint: 'Tap to hop, or fly with your hand, eyes or phone tilt' },
    { id: 'fish', name: 'Merge the Fish', icon: 'ic-fish', overTitle: 'Tank full!', medal: 'shell', medals: [300, 900, 1800], coinRate: 0.05,
      hint: 'Tap a fish, then tap its twin to merge' },
    { id: 'catch', name: 'Catch the Fish', icon: 'ic-fish', overTitle: "Time's up!", medal: 'shell', medals: [15, 35, 60],
      // 2 stars for every 6 fish caught, and no medal bonus
      stars: info => Math.floor(info.fish / 6) * 2,
      hint: 'Catch fish with your net, but not sharks or crocs!' },
    { id: 'memory', name: 'Memory', icon: 'ic-memory', overTitle: "Time's up!", medal: 'star', medals: [8, 16, 28], coinRate: 1,
      hint: 'Tap two cards to find a pair' },
    { id: 'bubble', name: 'Bubble Pop', icon: 'ic-bubble', overTitle: 'Pop!', medal: 'bubble', medals: [200, 600, 1500], coinRate: 0.05,
      hint: 'Aim, then let go to shoot. Match 3 to pop!' },
    // the cooking shops (games/cook.js): 2 stars for every 3 orders served; their own ≡ button pauses
    ...[['sushi', 'Sushi Shop', 'sushi'], ['ramen', 'Ramen Shop', 'bowl'], ['cake', 'Cake & Sweets', 'cake'], ['pancake', 'Pancake Shop', 'pancake']].map(([id, name, medal]) => ({
      id, name, overTitle: 'Shop closed!', medal, medals: [4, 9, 15], ownPause: true,
      stars: info => Math.floor(info.served / 3) * 2,
      hint: id === 'cake' ? 'Mix the recipe in the bowl, bake it, serve the cake' : 'Cook, add the toppings, then tap the plate to serve'
    }))
  ];
  const MEDAL_BONUS = [10, 25, 50];
  // background music in games (the others just have their sound effects)
  // Aiman's own music files (sound.js FILES): the home song in every game except the cooking shops
  const MUSIC = { sushi: 'caramel', ramen: 'caramel', cake: 'caramel', pancake: 'caramel', flappy: 'home', catch: 'caramel', fish: 'caramel', bubble: 'home', memory: 'home' };
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
    // choosing a girl or guy in the Shop puts them at home (instead of the dressed-up doll)
    if (BW.friends.isPerson(id)) { store.setGirl(id); store.data.dollAtHome = false; store.save(); }
    else store.setCharacter(id);
    showGirl();
  }

  // The chosen girl or guy is the profile picture; they and the chosen animal sit on the cottage ledge
  // (a girl wears the look from Dress Up, if she has one)
  function showGirl() {
    $('avatarBtn').querySelector('img').src = BW.friends.img(store.data.girl);
    $('avatarBtn').classList.toggle('guy', store.data.girl.startsWith('guy-'));
    const me = store.data.girl;
    BW.dressup.homePicture(me).then(p => {
      if (store.data.girl !== me) return;
      $('sceneGirl').src = p.src;
      $('sceneGirl').classList.toggle('dressed', p.dressed);
    });
    $('scenePet').src = BW.friends.cutout(store.data.character).src;
  }

  // ---------- games menu ----------
  // The game cards (from the designs). game: starts that game, open: opens a page, neither: coming soon

  const TILES = [
    { label: 'Flappy Bunny', img: 'flappy', game: 'flappy' },
    { label: 'Catch the Fish', img: 'catch', game: 'catch' },
    { label: 'Merge the Fish', img: 'merge', game: 'fish' },
    { label: 'Sushi Shop', img: 'sushi', game: 'sushi' },
    { label: 'Ramen Shop', img: 'ramen', game: 'ramen' },
    { label: 'Cake & Sweets', img: 'cake', game: 'cake' },
    { label: 'Pancake Shop', img: 'pancake', game: 'pancake' },
    { label: 'Adventure', img: 'adventure' },
    { label: 'Bubble Pop', img: 'bubble', game: 'bubble' },
    { label: 'Memory', img: 'match3', game: 'memory' },   // Match 3 and Memory were the same game
    { label: 'Decorate Room', img: 'room' },
    // Dress Up is hidden until it's improved (dressup.js stays; open: () => openDressUp() brings it back)
    { label: 'Dress Up', img: 'dressup' },
    { label: 'Garden', img: 'garden' }
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

  function startGame(g, duo) {
    if (g.soon) { toast(`${g.name} is coming soon!`); return; }
    if (game) { game.stop(); game = null; }
    if (aquarium) { aquarium.stop(); aquarium = null; }
    ['friendsPage', 'collectionPage', 'shop', 'aquarium'].forEach(id => { $(id).hidden = true; });
    resumeGame();
    current = g;
    currentDuo = duo || null;
    $('againBtn').textContent = duo ? 'Rematch' : 'Play again';
    cancelAnimationFrame(heroRaf);
    hub.hidden = true;
    play.hidden = false;
    over.hidden = true;
    $('hint').textContent = g.hint;
    BW.sound.play('click');
    BW.sound.music(MUSIC[g.id] || null);
    // the shops have a painted ≡ button for pausing, so the round home button stays out of the way
    $('backBtn').hidden = !!g.ownPause;
    game = BW.games[g.id].start($('gameCanvas'), {
      character: store.data.character,
      getBest: () => store.best(g.id),
      pause: pauseGame,
      duo: duo || null,
      onGameOver
    });
  }
  let currentDuo = null;
  // a game together with a friend (duo.js)
  function startDuo(id, duo) { startGame(GAMES.find(g => g.id === id), duo); }

  // The home button during a game pauses it first: Resume or go Home
  // (playing together can't pause: the friend keeps playing, so it asks to leave instead)
  function pauseGame() {
    if (!game) return;
    if (!over.hidden) { goHome(); return; }
    if (currentDuo) { if (confirm(`Leave the game with ${currentDuo.them.name || currentDuo.them.username}?`)) goHome(); return; }
    BW.kit.paused = true;
    BW.sound.loop('boil', false); BW.sound.loop('bake', false);
    $('pause').hidden = false;
    $('resumeBtn').focus();
  }

  function resumeGame() {
    BW.kit.paused = false;
    $('pause').hidden = true;
  }

  function goHome() {
    resumeGame();
    $('duoOver').hidden = true;
    if (currentDuo) { BW.duo.ended(); currentDuo = null; }
    BW.sound.music('home');
    BW.sound.loop('boil', false);
    BW.sound.loop('bake', false);
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
    guys: {
      title: 'Choose Your Guy', header: 'header-guy', sign: 'Choose Your Guy', groups: ['guys'],
      tabs: [['all', 'All'], ['casual', 'Casual'], ['cozy', 'Cozy'], ['school', 'School']]
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
    $('chooseSign').textContent = c.sign || '';
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
    return BW.friends.isPerson(f.id) ? store.data.girl === f.id : store.data.character === f.id;
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
      b.className = 'cubby' + (owned ? '' : ' locked') + (isChosen(f) ? ' chosen' : '') + (f.group === 'girls' ? ' girl' : f.group === 'guys' ? ' guy' : '') + (BW.friends.hasBody(f.id) ? ' body' : '');
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
    $('pickImg').classList.toggle('body', BW.friends.hasBody(f.id));
    $('pickImg').classList.toggle('guy', f.group === 'guys');
    $('pickName').textContent = f.name;
    const main = $('pickMain');
    main.className = 'pick-main';
    if (isChosen(f)) {
      $('pickNote').textContent = BW.friends.isPerson(f.id) ? 'This is you!' : 'Already playing with you';
      main.textContent = 'Chosen ♥';
      main.classList.add('done');
    } else if (owned) {
      $('pickNote').textContent = f.group === 'girls' ? 'Be this girl?' : f.group === 'guys' ? 'Be this guy?' : 'Take this friend along?';
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
      BW.sound.play('coin');
      toast(`${f.name} unlocked!`);
    } else {
      toast(BW.friends.isPerson(f.id) ? `Hi ${f.name}!` : `${f.name} is with you now!`);
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

  // Coins: points x the game's coinRate, plus a bonus for each medal (or the game's own stars rule).
  function onGameOver(score, info) {
    const g = current;
    const isBest = score > store.best(g.id);
    if (isBest) store.setBest(g.id, score);
    let level = -1;
    g.medals.forEach((need, i) => { if (score >= need) level = i; });
    const earned = g.stars ? g.stars(info || {}) : Math.floor(score * g.coinRate) + (level >= 0 ? MEDAL_BONUS[level] : 0);
    store.addCoins(earned);
    BW.sound.play('over');

    $('overTitle').textContent = g.overTitle;
    $('duoResult').hidden = true;
    if (currentDuo) {
      // games together count for the Top 10 too
      if (store.data.playerName && score > 0) BW.leaderboard.submit(g.id, score);
      showDuoResult(currentDuo, g, score, earned);
      return;
    }
    $('score').textContent = score;
    $('best').textContent = store.best(g.id);
    $('badge').textContent = level >= 0 ? `${['Bronze', 'Silver', 'Golden'][level]} ${g.medal}!` : (isBest && score > 0 ? 'New best!' : '');
    $('earned').textContent = earned;
    $('rankLine').textContent = '';
    $('joinTop').hidden = false;
    $('joinTop').textContent = store.data.playerName ? 'See the Top 10' : 'Join the Top 10';
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

  // ---------- the result of a game together ----------

  const VS_ICON = { catch: '🐟', fish: '🐠', flappy: '🥕', sushi: '🍣', ramen: '🍜', cake: '🍰', pancake: '🥞' };
  function vsMessage(id, diff, who) {
    const n = Math.abs(diff), me = diff > 0, x = me ? 'You' : who, y = me ? who : 'you';
    if (diff === 0) return 'The very same score! Play again to break the tie ♥';
    const s = n === 1 ? '' : 's';
    return {
      catch: `${x} caught ${n} more fish!`,
      fish: `${x} scored ${n} more point${s}!`,
      flappy: `${x} flew past ${n} more pillar${s}!`,
      sushi: `${x} served ${n} more sushi order${s} than ${y}!`,
      ramen: `${x} cooked ${n} more bowl${s} than ${y}!`,
      cake: `${x} baked ${n} more cake${s} than ${y}!`,
      pancake: `${x} served ${n} more pancake stack${s} than ${y}!`
    }[id];
  }

  function showDuoResult(duo, g, score, earned) {
    const who = duo.them.name || duo.them.username, icon = VS_ICON[g.id] || '⭐';
    $('vsTitle').textContent = 'Waiting…';
    $('vsSub').textContent = BW.duo.NAMES[g.id];
    $('vsFaceMe').src = BW.friends.img(store.data.girl);
    $('vsFaceThem').src = BW.friends.img(BW.friends.get(duo.them.girl) ? duo.them.girl : 'girl-1');
    $('vsFaceMe').classList.toggle('guy', store.data.girl.startsWith('guy-'));
    $('vsFaceThem').classList.toggle('guy', String(duo.them.girl).startsWith('guy-'));
    $('vsNameThem').textContent = who;
    $('vsIconMe').textContent = $('vsIconThem').textContent = icon;
    $('vsScoreMe').textContent = score;
    $('vsScoreThem').textContent = '…';
    $('vsCrownMe').hidden = $('vsCrownThem').hidden = true;
    $('vsMascot').src = BW.friends.cutout(store.data.character).src;
    $('vsMsgPet').src = BW.friends.cutout(store.data.character).src;
    $('vsMsg').textContent = `${who} is still playing…`;
    $('vsStars').textContent = `+${earned} stars`;
    $('vsAgain').disabled = true;
    setTimeout(() => { if (currentDuo === duo) $('duoOver').hidden = false; }, 450);
    duo.finish(score).then(r => {
      if (currentDuo !== duo) return;
      $('vsScoreThem').textContent = r.theirs;
      $('vsTitle').textContent = r.result === 'win' ? 'You Won!' : r.result === 'lose' ? `${who} Won!` : "It's a Tie!";
      $('vsCrownMe').hidden = r.result === 'lose';
      $('vsCrownThem').hidden = r.result === 'win';
      $('vsMsg').textContent = r.left ? `${who} left the game, so you win!` : vsMessage(g.id, r.mine - r.theirs, who);
      if (r.result === 'win') { store.addCoins(10); showCoins(); $('vsStars').textContent = `+${earned + 10} stars (10 for winning!)`; }
      $('vsAgain').disabled = false;
      BW.sound.play(r.result === 'lose' ? 'over' : 'sparkle');
      setTimeout(() => BW.stickers.duoResult(r.left ? 'win' : r.result), 900);
      const res = r.left ? 'win' : r.result;
      BW.mail.add(res === 'win' ? '🏆' : res === 'tie' ? '🤝' : '💪', res === 'win' ? `You beat ${who}!` : res === 'tie' ? `A tie with ${who}` : `${who} won this time`,
        `${BW.duo.NAMES[g.id]}: you ${r.mine}, ${who} ${r.theirs}${res === 'win' ? ' (+10 stars)' : ''}`);
    });
  }

  function playAgain() {
    if ((over.hidden && $('duoOver').hidden) || !game) return;
    if (currentDuo) {
      // a rematch: invite the same friend to the same game again
      const who = currentDuo.them.username, id = current.id;
      $('duoOver').hidden = true;
      goHome();
      BW.duo.invite(who, id);
      return;
    }
    over.hidden = true;
    game.restart();
  }

  // ---------- daily gift ----------

  // ---------- Daily Rewards (15-day login event, Aiman's design) ----------
  // store.data.daily = { claimed: how many days claimed in this event, last: date of the last claim }.
  // One day can be claimed each calendar day; after day 15 a new event begins.
  const EVENT_DAYS = 15;
  function daily() {
    const d = store.data.daily = store.data.daily || { claimed: 0, last: '' };
    if (d.claimed >= EVENT_DAYS && d.last !== today()) { d.claimed = 0; }
    return d;
  }
  const canClaim = () => daily().last !== today();

  function showGift() {
    $('giftBtn').classList.toggle('ready', canClaim());
  }

  function renderDaily() {
    const d = daily(), grid = $('dailyGrid');
    const todayN = canClaim() ? d.claimed + 1 : d.claimed;   // the day that is "today"
    grid.innerHTML = '';
    for (let n = 1; n <= EVENT_DAYS; n++) {
      const done = n <= d.claimed, now = n === todayN && canClaim();
      const c = document.createElement('div');
      c.className = 'day' + (done ? ' done' : '') + (now ? ' now' : '') + (!done && !now ? ' locked' : '');
      c.innerHTML = (now ? '<span class="day-tag">TODAY</span>' : '') + `<b>Day ${n}</b>`
        + `<span class="day-star"><i>⭐</i>${GIFT_COINS}</span>`
        + (now ? `<button type="button" class="day-claim">CLAIM ${GIFT_COINS} ⭐</button>` : '')
        + (done ? '<span class="day-check">✓</span>' : '') + (!done && !now ? '<span class="day-lock">🔒</span>' : '');
      if (now) c.querySelector('button').addEventListener('click', claimDaily);
      grid.appendChild(c);
    }
    $('dailyDay').textContent = `Day ${Math.max(1, todayN)} / ${EVENT_DAYS}`;
    $('dailyBar').style.width = (d.claimed / EVENT_DAYS * 100) + '%';
  }

  function claimDaily() {
    if (!canClaim()) return;
    const d = daily();
    d.claimed++;
    d.last = today();
    store.claimGift(today());
    store.addCoins(GIFT_COINS);
    BW.sound.play('coin');
    toast(`+${GIFT_COINS} stars! See you tomorrow ♥`);
    BW.mail.add('📅', `Daily reward: Day ${d.claimed}`, `You collected ${GIFT_COINS} stars. ${EVENT_DAYS - d.claimed > 0 ? `${EVENT_DAYS - d.claimed} days left in the event!` : 'You finished the 15-day event!'}`);
    renderDaily();
    showCoins();
    showGift();
  }

  function openGift() {
    renderDaily();
    $('giftPopup').hidden = false;
    BW.sound.play('sparkle');
  }

  // ---------- Dress Up ----------

  function openDressUp() {
    cancelAnimationFrame(heroRaf);
    BW.dressup.open(() => {
      hub.hidden = false;
      $('hint').textContent = HUB_HINT;
      showCoins();
      showGirl();
      heroRaf = requestAnimationFrame(heroLoop);
    });
    $('hint').textContent = 'Tap clothes to try them on';
  }

  function closeGift() {
    $('giftPopup').hidden = true;
    showCoins();
  }

  // ---------- ID card ----------
  // Your picture, name, birthday and skill on a pink ID card, with your unique @username,
  // your real stars, hearts and friends, and a QR code of your friend link. The ⋮ button
  // shares it. The name is also your Top 10 name.

  // other pages (Friends) open over the home screen and come back to it
  function showScreen(id) {
    cancelAnimationFrame(heroRaf);
    hub.hidden = true;
    $(id).hidden = false;
    $('hint').textContent = '';
  }
  function backHome(id) {
    $(id).hidden = true;
    hub.hidden = false;
    $('hint').textContent = HUB_HINT;
    showCoins();
    heroRaf = requestAnimationFrame(heroLoop);
  }

  const cleanName = v => v.replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 12);

  function openId() { BW.social.needUsername(showId); }

  function showId() {
    const d = store.data, me = BW.friends.get(d.girl);
    $('idNumber').textContent = '@' + d.username;
    $('idPhoto').src = BW.friends.img(d.girl);
    $('idPhoto').classList.toggle('guy', d.girl.startsWith('guy-'));
    $('idPet').src = BW.friends.cutout(d.character).src;
    const short = n => (n > 9999 ? Math.floor(n / 1000) + 'k' : String(n));
    $('idStars').textContent = short(d.coins);
    $('idHearts').textContent = d.hearts == null ? 5 : d.hearts;
    $('idFriends').textContent = '…';
    BW.account.user(d.username).then(r => { $('idFriends').textContent = r && !r.error ? r.friends : '–'; });
    $('idName').value = d.playerName || '';
    $('idName').placeholder = me ? me.name : 'your name';
    $('idBirth').value = d.birthday || '';
    $('idSkill').value = d.skill || '';
    // the QR code is your friend link: scanning it opens Kawaii Corner and adds you
    BW.account.drawQR($('idQr'), BW.account.link(d.username));
    $('idPopup').hidden = false;
  }

  function closeId() { $('idPopup').hidden = true; }

  function saveId(e) {
    e.preventDefault();
    const name = cleanName($('idName').value);
    const birth = $('idBirth').value.replace(/[^0-9/ .-]/g, '').trim().slice(0, 14);
    const skill = $('idSkill').value.replace(/[<>]/g, '').trim().slice(0, 16);
    if (name && name !== store.data.playerName) {
      store.setName(name);
      Promise.all(GAMES.map(g => BW.leaderboard.submit(g.id, store.best(g.id))));
    }
    store.setProfile(birth, skill);
    BW.account.sync();
    closeId();
    toast(name ? `Saved! Hi ${name} ♥` : 'Saved!');
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
    if (!$('sharePopup').hidden) { if (e.code === 'Escape') $('sharePopup').hidden = true; return; }
    if (!$('unPopup').hidden) { if (e.code === 'Escape') $('unPopup').hidden = true; return; }
    if (!$('friendsPage').hidden) { if (e.code === 'Escape') backHome('friendsPage'); return; }
    if (!$('collectionPage').hidden) { if (e.code === 'Escape') backHome('collectionPage'); return; }
    if (!$('mailPopup').hidden) { if (e.code === 'Escape') BW.mail.close(); return; }
    if (!$('idPopup').hidden) { if (e.code === 'Escape') closeId(); return; }
    if (!$('giftPopup').hidden && e.code === 'Escape') {
      e.preventDefault(); closeGift(); return;
    }
    if (!game) return;
    if (!$('pause').hidden) {
      if (e.code === 'Escape') { e.preventDefault(); resumeGame(); }
      return;
    }
    if (e.code === 'Escape') { pauseGame(); return; }
    if (!over.hidden && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); playAgain(); }
  });
  $('giftBtn').addEventListener('click', openGift);
  $('giftOk').addEventListener('click', closeGift);
  $('backBtn').addEventListener('click', pauseGame);
  // leaving the app (another tab, phone home button) pauses the game too
  document.addEventListener('visibilitychange', () => { if (document.hidden && game && $('pause').hidden) pauseGame(); });
  $('resumeBtn').addEventListener('click', resumeGame);
  $('pauseHome').addEventListener('click', goHome);
  $('homeBtn').addEventListener('click', goHome);
  $('againBtn').addEventListener('click', playAgain);
  $('vsAgain').addEventListener('click', playAgain);
  $('vsHome').addEventListener('click', goHome);
  $('shopNav').addEventListener('click', () => openShop(store.data.girl.startsWith('guy-') ? 'guys' : 'girls'));
  document.querySelectorAll('.choose-switch button').forEach(b => b.addEventListener('click', () => openShop(b.dataset.mode)));
  $('shopBack').addEventListener('click', closeShop);
  $('pickMain').addEventListener('click', pickMain);
  $('pickClose').addEventListener('click', closePick);
  $('pickSheet').addEventListener('click', e => { if (e.target === $('pickSheet')) closePick(); });
  $('aquariumNav').addEventListener('click', openAquarium);
  $('collectionNav').addEventListener('click', () => BW.stickers.open());
  $('colBack').addEventListener('click', () => backHome('collectionPage'));
  $('topBack').addEventListener('click', closeTop);
  $('nameForm').addEventListener('submit', saveName);
  $('joinTop').addEventListener('click', () => {
    const id = current.id;
    goHome();
    openTop(id);
    $('playerName').focus();
  });
  $('aquariumBack').addEventListener('click', closeAquarium);
  $('friendsNav').addEventListener('click', () => BW.social.openFriends());
  $('frBack').addEventListener('click', () => backHome('friendsPage'));
  $('idMore').addEventListener('click', () => BW.social.openShare());
  $('idNumber').addEventListener('click', () => BW.social.openShare());
  $('avatarBtn').addEventListener('click', openId);
  BW.dressup.wire();
  BW.app = { toast, showScreen, startDuo };
  BW.duo.wire();
  BW.stickers.wire();
  BW.social.wire();
  $('idClose').addEventListener('click', closeId);
  $('idForm').addEventListener('submit', saveId);
  $('idPopup').addEventListener('click', e => { if (e.target === $('idPopup')) closeId(); });
  $('starPlus').addEventListener('click', () => toast('Play games to earn more stars!'));
  $('heartPlus').addEventListener('click', () => toast('Hearts are coming soon!'));
  BW.mail.wire();
  $('settingsBtn').addEventListener('click', () => {
    $('sfxOn').checked = BW.sound.on.sfx;
    $('musicOn').checked = BW.sound.on.music;
    $('settingsPopup').hidden = false;
    BW.cloud.render();
  });
  const soundSwitch = () => BW.sound.setOn($('sfxOn').checked, $('musicOn').checked);
  $('sfxOn').addEventListener('change', () => { soundSwitch(); BW.sound.play('click'); });
  $('musicOn').addEventListener('change', soundSwitch);
  $('settingsOk').addEventListener('click', () => { $('settingsPopup').hidden = true; });
  $('settingsPopup').addEventListener('click', e => { if (e.target === $('settingsPopup')) $('settingsPopup').hidden = true; });
  BW.sound.music('home');

  resizeAll();
  renderGames();
  pickFriend(store.data.character);
  showCoins();
  showGift();
  $('hint').textContent = HUB_HINT;
  heroRaf = requestAnimationFrame(heroLoop);
})();
