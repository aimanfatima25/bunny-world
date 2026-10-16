// Catch the Fish: like its card picture. Sea friends swim across the water. Your net is
// always there (it follows your finger or mouse) and catches any fish it touches by itself;
// the fish you catch fly into your bucket. Koi are worth 5. You have 3 hearts: touching a
// prickly pufferfish, a shark or a crocodile with the net costs one, so steer around them. 45 seconds, or until your hearts run out; it gets faster
// and busier as you go, with more sharks and crocs near the end.
// Stars: 2 for every 6 fish caught (app.js), so it reports { fish } at game over.
// Together with a friend (options.duo): 4 levels of 25 seconds, from easy (no sharks) to hard;
// hearts refill each level (at 0 you wait for the next one). Both scores show in the box at
// the top right; the higher total wins.
window.BW = window.BW || {};
BW.games = BW.games || {};

BW.games.catch = (() => {
  const K = BW.kit, W = K.W, H = K.H, TAU = K.TAU;
  const TIME = 45;
  const FISH = ['clownfish', 'goldie', 'bluefish', 'goldfish', 'angelfish', 'betta', 'blackfish'];
  const DANGER = ['shark', 'croc'];
  const LIVES = 3;
  const BUCKET = { x: 180, y: 578 };   // the middle of the bucket's top
  const LEVELS = 4, LEVEL_TIME = 25, BREAK = 3;   // playing together
  // Aiman's net picture (assets/cut-net.mjs); the hoop's middle is at (95, 70) of 300 x 361
  const netImg = new Image();
  netImg.src = 'img/ui/net.webp';

  function start(canvas, options) {
    let state, fish, spawnIn, score, caught, timeLeft, shake, lives, flying, inBucket, bump, t = 0;
    const duo = options.duo;
    let level = 1, onBreak = false, lastLevel = 0;
    // the net stays on screen where your finger or mouse last was; scoop = its swoop timer
    const net = { x: W / 2, y: 380, scoop: 0 };
    const fx = K.sparkles();
    const bg = BW.aquarium.scene();

    function reset() {
      state = 'ready';
      fish = [];
      spawnIn = 0.3;
      score = 0;
      caught = 0;
      timeLeft = TIME;
      shake = 0;
      lives = LIVES;
      flying = [];
      inBucket = [];
      bump = 0;
      net.scoop = 0;
      fx.clear();
    }

    // how busy it is, 0 (calm) to 1 (wild): through the 45 seconds, or through the 4 levels
    function busyness() {
      if (state !== 'play') return 0;
      if (!duo) return 1 - timeLeft / TIME;
      return Math.min(1, ((level - 1) + (1 - timeLeft / LEVEL_TIME) * 0.6) / (LEVELS - 1 + 0.6));
    }

    function spawn() {
      const roll = Math.random();
      const busy = busyness();
      // sharks and crocs: 1 in 10 at the start, 1 in 4 by the end (together: none in level 1)
      const danger = duo ? (level === 1 ? 0 : 0.06 + busy * 0.22) : 0.1 + busy * 0.15;
      const id = roll < danger ? DANGER[Math.floor(Math.random() * 2)]
        : roll < danger + 0.12 ? 'puffer'
        : roll < danger + 0.2 ? 'koi'
        : FISH[Math.floor(Math.random() * FISH.length)];
      const big = DANGER.includes(id);
      const fromLeft = Math.random() < 0.5;
      fish.push({
        id,
        x: fromLeft ? -40 : W + 40,
        y: 140 + Math.random() * 360,
        dir: fromLeft ? 1 : -1,
        speed: (70 + Math.random() * 60) * (1 + busy * 1.1) * (id === 'koi' ? 1.4 : big ? 0.8 : 1),
        phase: Math.random() * TAU,
        size: id === 'koi' ? 30 : big ? 28 : 24,
        danger: big
      });
    }

    const fishY = f => f.y + Math.sin(t * 2.5 + f.phase) * 10;

    function aimNet(x, y) {
      net.x = Math.max(20, Math.min(W - 20, x));
      net.y = Math.max(110, Math.min(540, y));
    }

    function tap(x, y) {
      if (state === 'over') return;
      aimNet(x, y);
      if (duo && (state === 'ready' || onBreak || lives <= 0)) return;
      if (state === 'ready') { state = 'play'; return; }
    }

    // a fish inside the net's hoop is caught straight away (no tapping)
    const REACH = 34;
    function netTouches() {
      if (state !== 'play' || (duo && (onBreak || lives <= 0 || Date.now() < duo.startAt))) return;
      let best = null, bestD = REACH * REACH;
      fish.forEach(f => {
        const d = (f.x - net.x) ** 2 + (fishY(f) - net.y) ** 2;
        if (!f.caught && d < bestD) { bestD = d; best = f; }
      });
      if (best) scoop(best);
    }

    function scoop(best) {
      net.scoop = 0.35;
      BW.sound.play('splash');
      const by = fishY(best);
      if (best.danger || best.id === 'puffer') {
        // wrong catch: it wriggles away and you lose a heart
        best.caught = 0.01;
        lives--;
        BW.sound.play('wrong');
        shake = best.danger ? 0.5 : 0.35;
        fx.label(best.x, by - 32, best.danger ? 'Ouch! -♥' : 'Prickly! -♥');
        fx.add(best.x, by, '#F28C8C', 14, 180);
        if (lives <= 0 && !duo) end();
        if (lives <= 0 && duo) fx.label(W / 2, 300, 'Wait for the next level!');
        sendState();
        return;
      }
      // a good catch flies into the bucket
      fish = fish.filter(f => f !== best);
      flying.push({ id: best.id, x: best.x, y: by, dir: best.dir, size: best.size, p: 0 });
      BW.sound.play('catch');
      const pts = best.id === 'koi' ? 5 : 1;
      score += pts;
      caught++;
      fx.label(best.x, by - 30, '+' + pts);
      fx.add(best.x, by, '#FFFFFF', 10, 150);
      if (pts > 1) fx.add(best.x, by, '#F9D77E', 14, 200);
      sendState();
    }

    function sendState() { if (duo) duo.set({ score, caught, level }); }

    function end() {
      if (state === 'over') return;
      state = 'over';
      options.onGameOver(score, { fish: caught });
    }

    function update(dt) {
      t += dt;
      bg.update(dt);
      fx.update(dt);
      shake = Math.max(0, shake - dt);
      net.scoop = Math.max(0, net.scoop - dt);
      bump = Math.max(0, bump - dt * 4);
      flying.forEach(f => {
        f.p += dt / 0.55;
        if (f.p >= 1) { inBucket.push(f.id); bump = 1; }
      });
      flying = flying.filter(f => f.p < 1);
      fish.forEach(f => {
        if (f.caught) f.caught += dt * 3;
        else f.x += f.dir * f.speed * dt;
      });
      fish = fish.filter(f => (f.caught ? f.caught < 1 : f.x > -60 && f.x < W + 60));
      netTouches();
      if (duo && state !== 'over') {
        // the levels run on the clock both phones share
        const e = (Date.now() - duo.startAt) / 1000;
        if (e < 0) { if (fish.length < 4 && Math.random() < dt * 2) spawn(); return; }
        state = 'play';
        const slot = LEVEL_TIME + BREAK, n = Math.floor(e / slot);
        if (n >= LEVELS) { timeLeft = 0; end(); return; }
        level = n + 1;
        onBreak = e - n * slot < BREAK;
        timeLeft = onBreak ? LEVEL_TIME : LEVEL_TIME - (e - n * slot - BREAK);
        if (level !== lastLevel) { lastLevel = level; lives = LIVES; fish = fish.filter(f => !f.danger); sendState(); }
        if (onBreak) return;
        spawnIn -= dt;
        if (spawnIn <= 0) {
          spawn();
          spawnIn = Math.max(0.24, 0.95 - busyness() * 0.7) * (0.6 + Math.random() * 0.8);
        }
        return;
      }
      if (state !== 'play') {
        if (state === 'ready' && fish.length < 4 && Math.random() < dt * 2) spawn();
        return;
      }
      spawnIn -= dt;
      if (spawnIn <= 0) {
        spawn();
        spawnIn = Math.max(0.22, 0.8 - (1 - timeLeft / TIME) * 0.6) * (0.6 + Math.random() * 0.8);
      }
      timeLeft -= dt;
      if (timeLeft <= 0) { timeLeft = 0; end(); }
    }

    function drawFish(f) {
      ctx.save();
      ctx.translate(f.x, fishY(f));
      const s = f.caught ? 1 - f.caught : 1;
      ctx.scale(f.dir * s, s);
      ctx.rotate(Math.sin(t * 6 + f.phase) * 0.06);
      BW.sea.draw(ctx, f.id, f.size, t + f.phase);
      ctx.restore();
    }

    // a fish on its way to the bucket: an arc up and over, getting smaller
    function drawFlying(f) {
      const e = f.p * f.p * (3 - 2 * f.p);
      const x = f.x + (BUCKET.x - f.x) * e;
      const y = f.y + (BUCKET.y - 10 - f.y) * e - Math.sin(f.p * Math.PI) * 70;
      ctx.save();
      ctx.translate(x, y);
      const s = 1 - f.p * 0.45;
      ctx.scale(f.dir * s, s);
      ctx.rotate(-0.6 * Math.sin(f.p * Math.PI));
      BW.sea.draw(ctx, f.id, f.size, t);
      ctx.restore();
    }

    // the wooden bucket on the sand, with the last few fish peeking out
    function drawBucket() {
      const { x, y } = BUCKET, sq = bump * 0.08;
      ctx.save();
      ctx.translate(x, y + 22); ctx.scale(1 + sq, 1 - sq); ctx.translate(-x, -y - 22);
      ctx.fillStyle = 'rgba(60, 40, 30, .25)';
      ctx.beginPath(); ctx.ellipse(x, y + 46, 46, 8, 0, 0, TAU); ctx.fill();
      // fish peeking out of the water
      ctx.fillStyle = '#9FD3E6';
      ctx.beginPath(); ctx.ellipse(x, y, 40, 9, 0, 0, TAU); ctx.fill();
      inBucket.slice(-4).forEach((id, i, a) => {
        ctx.save();
        ctx.translate(x + (i - (a.length - 1) / 2) * 18, y - 6 + Math.sin(t * 3 + i) * 2);
        ctx.rotate(-1.2 + i * 0.25);
        BW.sea.draw(ctx, id, 15, t + i);
        ctx.restore();
      });
      // the bucket: wooden staves with two bands
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#6E4A3A'; ctx.lineJoin = 'round';
      ctx.fillStyle = '#C99566';
      ctx.beginPath(); ctx.moveTo(x - 42, y); ctx.lineTo(x - 34, y + 44); ctx.quadraticCurveTo(x, y + 52, x + 34, y + 44);
      ctx.lineTo(x + 42, y); ctx.quadraticCurveTo(x, y + 12, x - 42, y); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(110, 74, 58, .45)'; ctx.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 16, y + 6); ctx.lineTo(x + i * 13, y + 46); ctx.stroke(); }
      ctx.strokeStyle = '#8B6D8E'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(x, y + 13, 39, 6, 0, 0.15, Math.PI - 0.15); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, y + 34, 35, 6, 0, 0.15, Math.PI - 0.15); ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#6E4A3A';
      ctx.beginPath(); ctx.ellipse(x, y, 42, 10, 0, Math.PI, TAU); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, y, 42, 10, 0, 0, Math.PI); ctx.stroke();
      ctx.restore();
      // how many are in it
      K.text(ctx, String(caught), x, y + 26, 20);
    }

    // Aiman's fishing net; it swoops down when it catches something
    function drawNet() {
      const swoop = net.scoop > 0 ? 1 - net.scoop / 0.35 : 0;
      const x = net.x, y = net.y + Math.sin(swoop * Math.PI) * 10 + (state === 'play' && !net.scoop ? Math.sin(t * 2) * 2 : 0);
      if (netImg.complete && netImg.naturalWidth) {
        const k = 105 / netImg.naturalWidth;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(swoop * Math.PI) * 0.25);
        ctx.drawImage(netImg, -95 * k * netImg.naturalWidth / 300, -70 * k * netImg.naturalWidth / 300, netImg.naturalWidth * k, netImg.naturalHeight * k);
        ctx.restore();
        return;
      }
      ctx.save();
      ctx.strokeStyle = '#B98A5E'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + 22, y + 22); ctx.lineTo(x + 90, y + 120); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.beginPath(); ctx.ellipse(x, y + 10, 26, 30, -0.4, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(x - 20 + i * 2, y - 4 + i * 8); ctx.lineTo(x + 20 + i * 2, y + 6 + i * 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + i * 9, y - 14); ctx.lineTo(x + i * 7, y + 34); ctx.stroke();
      }
      ctx.strokeStyle = '#8B5E4A'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(x, y, 27, 15, -0.4, 0, TAU); ctx.stroke();
      ctx.restore();
    }

    let ctx = canvas.getContext('2d');
    function draw(c) {
      ctx = c;
      ctx.save();
      if (shake > 0) ctx.translate(Math.sin(t * 60) * shake * 12, 0);
      bg.draw(ctx);
      fish.forEach(drawFish);
      drawBucket();
      flying.forEach(drawFlying);
      if (state !== 'ready') drawNet();
      fx.draw(ctx);
      ctx.restore();
      if (duo) { drawDuo(); return; }
      if (state === 'ready') {
        ctx.fillStyle = 'rgba(40,70,90,.3)'; ctx.fillRect(0, 0, W, H);
        K.title(ctx, 'Catch the Fish', 'Tap to start', options.getBest());
        K.text(ctx, 'Move the net over fish to catch them!', W / 2, 240, 15);
        K.text(ctx, 'Koi = 5 points', W / 2, 270, 16);
        K.text(ctx, 'Keep away from pufferfish, sharks & crocs!', W / 2, 296, 14);
        K.text(ctx, 'Every 6 fish = 2 stars', W / 2, 322, 16);
      } else {
        K.text(ctx, String(score), W / 2, 40, 38);
        K.hearts(ctx, lives, LIVES);
        // the stars your bucket is worth so far, beside it
        K.star(ctx, BUCKET.x + 62, BUCKET.y + 22, 9, '#F9D77E');
        K.text(ctx, String(Math.floor(caught / 6) * 2), BUCKET.x + 76, BUCKET.y + 23, 16, 'left');
        // time bar
        ctx.fillStyle = 'rgba(255,255,255,.6)'; K.roundRect(ctx, 70, 70, 220, 12, 6); ctx.fill();
        ctx.fillStyle = timeLeft < 10 ? '#F28C8C' : '#F9D77E';
        K.roundRect(ctx, 70, 70, Math.max(12, 220 * timeLeft / TIME), 12, 6); ctx.fill();
        ctx.strokeStyle = '#6E4A3A'; ctx.lineWidth = 2; K.roundRect(ctx, 70, 70, 220, 12, 6); ctx.stroke();
        K.text(ctx, Math.ceil(timeLeft) + 's', 316, 76, 15);
      }
    }

    // playing together: score in the middle, the level's time bar and hearts on the left,
    // and the score box (Aiman's design) at the top right
    function drawDuo() {
      const them = duo.other();
      K.duoPanel(ctx, duo, score, Number(them.score) || 0, `Level ${level}`);
      if (K.countdown(ctx, duo, 'Catch the Fish')) return;
      K.text(ctx, String(score), 152, 40, 36);
      ctx.fillStyle = 'rgba(255,255,255,.6)'; K.roundRect(ctx, 22, 70, 150, 12, 6); ctx.fill();
      ctx.fillStyle = timeLeft < 8 ? '#F28C8C' : '#F9D77E';
      K.roundRect(ctx, 22, 70, Math.max(12, 150 * timeLeft / LEVEL_TIME), 12, 6); ctx.fill();
      ctx.strokeStyle = '#6E4A3A'; ctx.lineWidth = 2; K.roundRect(ctx, 22, 70, 150, 12, 6); ctx.stroke();
      K.text(ctx, Math.ceil(timeLeft) + 's', 192, 76, 14);
      for (let i = 0; i < LIVES; i++) K.heart(ctx, 34 + i * 24, 102, 18, i < lives);
      K.star(ctx, BUCKET.x + 62, BUCKET.y + 22, 9, '#F9D77E');
      K.text(ctx, String(Math.floor(caught / 6) * 2), BUCKET.x + 76, BUCKET.y + 23, 16, 'left');
      if (onBreak && state === 'play') K.levelBanner(ctx, level, level === 1 ? 'No sharks yet!' : level === 4 ? 'The hardest one!' : 'Faster fish, more sharks');
      if (lives <= 0 && !onBreak && state === 'play') K.text(ctx, 'Wait for the next level ♥', W / 2, 300, 18);
      if (state === 'over') K.text(ctx, `Waiting for ${duo.them.name || duo.them.username}…`, W / 2, 300, 18);
    }

    reset();
    if (duo) sendState();
    const engine = K.run(canvas, {
      update, draw,
      down: tap,
      move(x, y) { if (state === 'play' || duo) aimNet(x, y); },
      keydown(e) {
        if (state === 'ready' && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); state = 'play'; }
      }
    });
    return { restart: reset, stop: engine.stop };
  }

  return { start };
})();
