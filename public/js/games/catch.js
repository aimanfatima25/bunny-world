// Catch the Fish: like its card picture. Sea friends swim across the water; tap one to
// scoop it up with your net. Koi are worth 5, prickly pufferfish cost 3 if you catch them.
// You have 45 seconds; it gets busier as you go.
window.BW = window.BW || {};
BW.games = BW.games || {};

BW.games.catch = (() => {
  const K = BW.kit, W = K.W, H = K.H, TAU = K.TAU;
  const TIME = 45;
  const FISH = ['clownfish', 'goldie', 'bluefish', 'goldfish', 'angelfish', 'betta', 'blackfish'];

  function start(canvas, options) {
    let state, fish, spawnIn, score, timeLeft, net, shake, t = 0;
    const fx = K.sparkles();
    const bg = BW.aquarium.scene();

    function reset() {
      state = 'ready';
      fish = [];
      spawnIn = 0.3;
      score = 0;
      timeLeft = TIME;
      net = null;
      shake = 0;
      fx.clear();
    }

    function spawn() {
      const roll = Math.random();
      const id = roll < 0.12 ? 'puffer' : roll < 0.2 ? 'koi' : FISH[Math.floor(Math.random() * FISH.length)];
      const fromLeft = Math.random() < 0.5;
      const busy = 1 - timeLeft / TIME;
      fish.push({
        id,
        x: fromLeft ? -40 : W + 40,
        y: 140 + Math.random() * 360,
        dir: fromLeft ? 1 : -1,
        speed: (55 + Math.random() * 50) * (1 + busy * 0.9) * (id === 'koi' ? 1.4 : 1),
        phase: Math.random() * TAU,
        size: id === 'koi' ? 34 : 28
      });
    }

    const fishY = f => f.y + Math.sin(t * 2.5 + f.phase) * 10;

    function tap(x, y) {
      if (state === 'over') return;
      if (state === 'ready') { state = 'play'; return; }
      net = { x, y, life: 0.35 };
      // the closest fish under the net gets caught
      let best = null, bestD = 40 * 40;
      fish.forEach(f => {
        const d = (f.x - x) ** 2 + (fishY(f) - y) ** 2;
        if (!f.caught && d < bestD) { bestD = d; best = f; }
      });
      if (!best) return;
      best.caught = 0.01;
      if (best.id === 'puffer') {
        score = Math.max(0, score - 3);
        shake = 0.35;
        fx.label(best.x, fishY(best) - 30, '-3');
        fx.add(best.x, fishY(best), '#E2B36B', 10, 160);
      } else {
        const pts = best.id === 'koi' ? 5 : 1;
        score += pts;
        fx.label(best.x, fishY(best) - 30, '+' + pts);
        fx.add(best.x, fishY(best), '#FFFFFF', 10, 150);
        if (pts > 1) fx.add(best.x, fishY(best), '#F9D77E', 14, 200);
      }
    }

    function update(dt) {
      t += dt;
      bg.update(dt);
      fx.update(dt);
      shake = Math.max(0, shake - dt);
      if (net) { net.life -= dt; if (net.life <= 0) net = null; }
      fish.forEach(f => {
        if (f.caught) f.caught += dt * 3;
        else f.x += f.dir * f.speed * dt;
      });
      fish = fish.filter(f => (f.caught ? f.caught < 1 : f.x > -60 && f.x < W + 60));
      if (state !== 'play') {
        if (state === 'ready' && fish.length < 4 && Math.random() < dt * 2) spawn();
        return;
      }
      spawnIn -= dt;
      if (spawnIn <= 0) {
        spawn();
        spawnIn = Math.max(0.28, 0.9 - (1 - timeLeft / TIME) * 0.6) * (0.6 + Math.random() * 0.8);
      }
      timeLeft -= dt;
      if (timeLeft <= 0) { timeLeft = 0; state = 'over'; options.onGameOver(score); }
    }

    function drawFish(f) {
      const img = BW.friends.cutout(f.id);
      if (!img.complete || !img.naturalWidth) return;
      ctx.save();
      ctx.translate(f.x, fishY(f));
      const s = f.caught ? 1 - f.caught : 1;
      ctx.scale(-f.dir * s, s);
      ctx.rotate(Math.sin(t * 6 + f.phase) * 0.08);
      const w = f.size * 2.4, h = w * img.naturalHeight / img.naturalWidth;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    // a little fishing net on a wooden handle, swooping where you tapped
    function drawNet() {
      if (!net) return;
      const swoop = 1 - net.life / 0.35;
      const x = net.x, y = net.y + Math.sin(swoop * Math.PI) * 8;
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
      drawNet();
      fx.draw(ctx);
      ctx.restore();
      if (state === 'ready') {
        ctx.fillStyle = 'rgba(40,70,90,.3)'; ctx.fillRect(0, 0, W, H);
        K.title(ctx, 'Catch the Fish', 'Tap to start', options.getBest());
        K.text(ctx, 'Tap fish to scoop them up!', W / 2, 240, 18);
        K.text(ctx, 'Koi = 5   Pufferfish = -3', W / 2, 270, 16);
      } else {
        K.text(ctx, String(score), W / 2, 40, 38);
        // time bar
        ctx.fillStyle = 'rgba(255,255,255,.6)'; K.roundRect(ctx, 70, 70, 220, 12, 6); ctx.fill();
        ctx.fillStyle = timeLeft < 10 ? '#F28C8C' : '#F9D77E';
        K.roundRect(ctx, 70, 70, Math.max(12, 220 * timeLeft / TIME), 12, 6); ctx.fill();
        ctx.strokeStyle = '#6E4A3A'; ctx.lineWidth = 2; K.roundRect(ctx, 70, 70, 220, 12, 6); ctx.stroke();
        K.text(ctx, Math.ceil(timeLeft) + 's', 316, 76, 15);
      }
    }

    reset();
    const engine = K.run(canvas, {
      update, draw,
      down: tap,
      keydown(e) {
        if (state === 'ready' && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); state = 'play'; }
      }
    });
    return { restart: reset, stop: engine.stop };
  }

  return { start };
})();
