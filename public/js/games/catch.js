// Catch the Fish: like its card picture. Sea friends swim across the water; tap one to
// scoop it up with your net. Koi are worth 5, prickly pufferfish cost 3 if you catch them,
// and sharks and crocodiles cost 5 points and 3 seconds. You have 45 seconds; it gets
// faster and busier as you go, with more sharks and crocs near the end.
// Stars: 2 for every 6 fish caught (app.js), so it reports { fish } at game over.
window.BW = window.BW || {};
BW.games = BW.games || {};

BW.games.catch = (() => {
  const K = BW.kit, W = K.W, H = K.H, TAU = K.TAU;
  const TIME = 45;
  const FISH = ['clownfish', 'goldie', 'bluefish', 'goldfish', 'angelfish', 'betta', 'blackfish'];
  const DANGER = ['shark', 'croc'];

  function start(canvas, options) {
    let state, fish, spawnIn, score, caught, timeLeft, net, shake, t = 0;
    const fx = K.sparkles();
    const bg = BW.aquarium.scene();

    function reset() {
      state = 'ready';
      fish = [];
      spawnIn = 0.3;
      score = 0;
      caught = 0;
      timeLeft = TIME;
      net = null;
      shake = 0;
      fx.clear();
    }

    function spawn() {
      const roll = Math.random();
      const busy = state === 'play' ? 1 - timeLeft / TIME : 0;
      // sharks and crocs: 1 in 10 at the start, 1 in 4 by the end
      const danger = 0.1 + busy * 0.15;
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
      if (best.danger) {
        // chomp! sharks and crocs cost points and time
        score = Math.max(0, score - 5);
        timeLeft = Math.max(0, timeLeft - 3);
        shake = 0.5;
        fx.label(best.x, fishY(best) - 34, '-5  -3s');
        fx.add(best.x, fishY(best), '#F28C8C', 14, 180);
      } else if (best.id === 'puffer') {
        score = Math.max(0, score - 3);
        shake = 0.35;
        fx.label(best.x, fishY(best) - 30, '-3');
        fx.add(best.x, fishY(best), '#E2B36B', 10, 160);
      } else {
        const pts = best.id === 'koi' ? 5 : 1;
        score += pts;
        caught++;
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
        spawnIn = Math.max(0.22, 0.8 - (1 - timeLeft / TIME) * 0.6) * (0.6 + Math.random() * 0.8);
      }
      timeLeft -= dt;
      if (timeLeft <= 0) { timeLeft = 0; state = 'over'; options.onGameOver(score, { fish: caught }); }
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
        K.text(ctx, 'Sharks & crocs = -5 and -3s!', W / 2, 296, 16);
        K.text(ctx, 'Every 6 fish = 2 stars', W / 2, 322, 16);
      } else {
        K.text(ctx, String(score), W / 2, 40, 38);
        // fish caught so far, and the stars they're worth
        K.text(ctx, `${caught} fish`, 340, 30, 15, 'right');
        K.star(ctx, 304, 51, 8, '#F9D77E');
        K.text(ctx, String(Math.floor(caught / 6) * 2), 340, 51, 15, 'right');
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
