// Fishy Merge: the tank is a grid full of sea friends. Tap a fish, then tap its
// twin, and they merge into the next one: tiny fish → clownfish → pufferfish →
// seahorse → turtle → jellyfish. New fish keep swimming in, faster and faster;
// when there's no room left, the game ends.
// Making a jellyfish opens a gift: the Fish Maker (fishmaker.js), where players
// design their own fish. Saved fish swim around in the background.
window.BW = window.BW || {};
BW.games = BW.games || {};

BW.games.fish = (() => {
  const K = BW.kit, W = K.W, H = K.H, INK = K.INK, TAU = K.TAU;
  const COLS = 5, ROWS = 6, CELL = 66;
  const X0 = (W - COLS * CELL) / 2, Y0 = 132;
  const FLOOR = 600;
  const START_FISH = 14;

  //               tiny clown puffer seahorse turtle jelly
  const POINTS = [0, 2, 6, 15, 35, 80];
  const LAST = POINTS.length - 1;
  const NAMES = ['Tiny fish', 'Clownfish', 'Pufferfish', 'Seahorse', 'Turtle', 'Jellyfish'];

  function sizeOf(type) { return 17 + type * 2.6; }

  function randomType() {
    const r = Math.random();
    return r < 0.65 ? 0 : r < 0.95 ? 1 : 2;
  }

  // Each sea friend is drawn in a space where its body has radius 20
  const creatures = [
    function tinyFish(ctx) {
      ctx.fillStyle = '#9FC9F2';
      ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(-22, -10); ctx.lineTo(-22, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(2, 0, 17, 14, 0, 0, TAU); ctx.fill(); ctx.stroke();
      face(ctx, 9, -3, true);
    },
    function clownfish(ctx) {
      ctx.fillStyle = '#F28C28';
      ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(-22, -11); ctx.lineTo(-22, 11); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(2, 0, 18, 15, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.clip();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-7, -16, 5, 32); ctx.fillRect(6, -16, 4.5, 32);
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(2, 0, 18, 15, 0, 0, TAU); ctx.stroke();
      face(ctx, 13, -3, true);
    },
    function pufferfish(ctx) {
      ctx.fillStyle = '#F7C548';
      for (let i = 0; i < 12; i++) {
        const a = i * TAU / 12;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a - 0.12) * 16, Math.sin(a - 0.12) * 16);
        ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22);
        ctx.lineTo(Math.cos(a + 0.12) * 16, Math.sin(a + 0.12) * 16);
        ctx.fill(); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, 17, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(-6, -4, 2.6, 0, TAU); ctx.arc(6, -4, 2.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFB3CB';
      ctx.beginPath(); ctx.ellipse(-11, 3, 3, 2, 0, 0, TAU); ctx.ellipse(11, 3, 3, 2, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 5, 2.4, 0, TAU); ctx.stroke();
    },
    function seahorse(ctx) {
      ctx.fillStyle = '#ED93B1';
      // crown fin
      ctx.beginPath(); ctx.moveTo(-8, -14); ctx.lineTo(-5, -22); ctx.lineTo(-1, -16); ctx.lineTo(3, -23); ctx.lineTo(6, -15); ctx.closePath(); ctx.fill(); ctx.stroke();
      // curly tail
      ctx.lineWidth *= 1.6;
      ctx.beginPath(); ctx.arc(-11, 14, 6, -Math.PI / 2, Math.PI * 1.3); ctx.stroke();
      ctx.lineWidth /= 1.6;
      ctx.beginPath(); ctx.arc(0, 0, 17, 0, TAU); ctx.fill(); ctx.stroke();
      // snout
      ctx.beginPath(); ctx.ellipse(18, -2, 7, 4.5, 0.15, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#D4537E';
      ctx.beginPath(); ctx.moveTo(-9, 4); ctx.lineTo(-3, 5); ctx.moveTo(-8, 9); ctx.lineTo(-2, 10); ctx.stroke();
      ctx.strokeStyle = INK;
      face(ctx, 7, -5, false);
    },
    function turtle(ctx) {
      ctx.fillStyle = '#C0DD97';
      ctx.beginPath(); ctx.ellipse(-11, 12, 6, 4, 0.3, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(10, 13, 6, 4, -0.3, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(17, -2, 7, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#97C459';
      ctx.beginPath(); ctx.ellipse(-1, 0, 17, 15, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#3B6D11'; ctx.lineWidth *= 0.6;
      ctx.beginPath();
      ctx.moveTo(-6, -6); ctx.lineTo(4, -6); ctx.lineTo(8, 1); ctx.lineTo(4, 8); ctx.lineTo(-6, 8); ctx.lineTo(-10, 1); ctx.closePath();
      ctx.moveTo(-6, -6); ctx.lineTo(-9, -13); ctx.moveTo(4, -6); ctx.lineTo(7, -13); ctx.moveTo(-10, 1); ctx.lineTo(-17, 1);
      ctx.moveTo(4, 8); ctx.lineTo(7, 14); ctx.moveTo(-6, 8); ctx.lineTo(-9, 14);
      ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth /= 0.6;
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(19, -4, 1.8, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFB3CB'; ctx.beginPath(); ctx.ellipse(18, 1, 2, 1.3, 0, 0, TAU); ctx.fill();
    },
    function jellyfish(ctx, t) {
      ctx.strokeStyle = '#AFA9EC'; ctx.lineCap = 'round';
      const lw = ctx.lineWidth;
      ctx.lineWidth = lw * 1.3;
      for (let i = 0; i < 4; i++) {
        const x = -10 + i * 6.7, w = Math.sin((t || 0) * 4 + i) * 3;
        ctx.beginPath(); ctx.moveTo(x, 4); ctx.quadraticCurveTo(x + w - 3, 12, x + w, 21); ctx.stroke();
      }
      ctx.lineWidth = lw; ctx.strokeStyle = INK;
      ctx.fillStyle = '#E3CCF2';
      ctx.beginPath(); ctx.moveTo(-19, 5); ctx.bezierCurveTo(-19, -22, 19, -22, 19, 5);
      ctx.quadraticCurveTo(13, 9, 6, 5); ctx.quadraticCurveTo(0, 9, -6, 5); ctx.quadraticCurveTo(-13, 9, -19, 5); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      ctx.beginPath(); ctx.ellipse(-9, -9, 3, 5, 0.5, 0, TAU); ctx.fill();
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(-5, -3, 2.3, 0, TAU); ctx.arc(5, -3, 2.3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFB3CB';
      ctx.beginPath(); ctx.ellipse(-11, 1, 2.8, 1.7, 0, 0, TAU); ctx.ellipse(11, 1, 2.8, 1.7, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-2, 1); ctx.quadraticCurveTo(0, 3, 2, 1); ctx.stroke();
    }
  ];

  function face(ctx, ex, ey, cheek) {
    const lw = ctx.lineWidth;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex, ey, 2.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(ex + 0.8, ey - 0.8, 0.8, 0, TAU); ctx.fill();
    if (cheek) { ctx.fillStyle = '#FFB3CB'; ctx.beginPath(); ctx.ellipse(ex - 1, ey + 6, 2.6, 1.6, 0, 0, TAU); ctx.fill(); }
    ctx.lineWidth = lw * 0.7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ex + 3, ey + 6); ctx.quadraticCurveTo(ex + 5, ey + 7.5, ex + 7, ey + 5.5); ctx.stroke();
    ctx.lineWidth = lw;
  }

  // Draw sea friend `type` centred on (0, 0) with radius r. Also used by Memory Match.
  function drawCreature(ctx, type, r, t) {
    ctx.save();
    ctx.scale(r / 20, r / 20);
    ctx.lineWidth = 2.4 * 20 / r;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    creatures[type](ctx, t);
    ctx.restore();
  }

  function drawGift(ctx, x, y, t) {
    const bob = Math.sin(t * 5) * 5, wob = Math.sin(t * 9) * 0.06;
    ctx.save(); ctx.translate(x, y + bob); ctx.rotate(wob);
    ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
    // bow loops
    ctx.fillStyle = '#F7C548';
    ctx.beginPath(); ctx.ellipse(-14, -46, 14, 9, -0.5, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(14, -46, 14, 9, 0.5, 0, TAU); ctx.fill(); ctx.stroke();
    // box and lid
    ctx.fillStyle = '#FF7FAF';
    K.roundRect(ctx, -44, -20, 88, 66, 8); ctx.fill(); ctx.stroke();
    K.roundRect(ctx, -50, -40, 100, 24, 8); ctx.fill(); ctx.stroke();
    // ribbon
    ctx.fillStyle = '#F7C548';
    ctx.fillRect(-9, -39, 18, 22); ctx.fillRect(-9, -19, 18, 64);
    ctx.strokeRect(-9, -40, 18, 24); ctx.strokeRect(-9, -20, 18, 66);
    ctx.beginPath(); ctx.arc(0, -42, 7, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
    K.star(ctx, x - 64, y - 30 + bob, 8 + Math.sin(t * 7) * 2, '#FFFFFF');
    K.star(ctx, x + 66, y + 10 - bob, 6 + Math.cos(t * 7) * 2, '#FFFFFF');
  }

  function start(canvas, options) {
    let state, grid, selected, spawnIn, interval, merges, score, ghosts, gift, t = 0;
    const fx = K.sparkles();
    const swimmers = [];
    const bubbles = Array.from({ length: 10 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 2 + Math.random() * 4, s: 20 + Math.random() * 30 }));

    function addSwimmer(design) {
      swimmers.push({ design, x: Math.random() * W, y: 150 + Math.random() * 380, speed: 18 + Math.random() * 20, dir: Math.random() < 0.5 ? 1 : -1, phase: Math.random() * TAU });
      if (swimmers.length > 8) swimmers.shift();
    }
    (BW.store.data.myFish || []).slice(-8).forEach(addSwimmer);

    function cellXY(i) { return [X0 + (i % COLS) * CELL + CELL / 2, Y0 + Math.floor(i / COLS) * CELL + CELL / 2]; }
    function cellAt(x, y) {
      const c = Math.floor((x - X0) / CELL), r = Math.floor((y - Y0) / CELL);
      return c < 0 || c >= COLS || r < 0 || r >= ROWS ? -1 : r * COLS + c;
    }
    function empties() { return grid.reduce((list, f, i) => (f ? list : list.concat(i)), []); }

    function addFish(type) {
      const free = empties();
      if (!free.length) return false;
      const i = free[Math.floor(Math.random() * free.length)];
      grid[i] = { type, grow: 0, pop: 0 };
      return true;
    }

    function reset() {
      state = 'ready';
      grid = new Array(COLS * ROWS).fill(null);
      selected = -1;
      merges = 0;
      score = 0;
      ghosts = [];
      gift = null;
      interval = spawnIn = 2.2;
      fx.clear();
      for (let i = 0; i < START_FISH; i++) addFish(i < 4 ? 0 : randomType());
      grid.forEach(f => { if (f) f.grow = 1; });
    }

    function tap(x, y) {
      if (state === 'over' || state === 'maker') return;
      if (state === 'ready') { state = 'play'; return; }
      if (state === 'gift') { if (gift.t > 0.6) openGift(); return; }
      const i = cellAt(x, y);
      const f = i >= 0 ? grid[i] : null;
      if (!f) { selected = -1; return; }
      if (selected < 0 || selected === i) {
        selected = selected === i ? -1 : i;
        f.pop = 0.5;
        return;
      }
      const s = grid[selected];
      if (s.type !== f.type || f.type === LAST) { selected = i; f.pop = 0.5; return; }

      // merge: the first fish swims into the second, which grows into the next kind
      const [x0, y0] = cellXY(selected), [x1, y1] = cellXY(i);
      ghosts.push({ x0, y0, x1, y1, type: s.type, t: 0, speed: 6, shrink: true });
      grid[selected] = null;
      selected = -1;
      f.type++;
      f.pop = 1;
      merges++;
      score += POINTS[f.type];
      fx.add(x1, y1, '#FFFFFF', 10, 150);
      fx.label(x1, y1 - 30, '+' + POINTS[f.type]);
      if (f.type === LAST) {
        fx.add(x1, y1, '#E3CCF2', 24, 260);
        fx.add(x1, y1, '#F7C548', 16, 200);
        state = 'gift';
        gift = { cell: i, t: 0 };
      }
    }

    function openGift() {
      state = 'maker';
      BW.fishMaker.open(design => {
        addSwimmer(design);
        // the jellyfish floats away happily, freeing its spot
        const [x, y] = cellXY(gift.cell);
        ghosts.push({ x0: x, y0: y, x1: x, y1: -80, type: LAST, t: 0, speed: 0.8, shrink: false });
        grid[gift.cell] = null;
        gift = null;
        state = 'play';
      });
    }

    function update(dt) {
      t += dt;
      fx.update(dt);
      bubbles.forEach(b => { b.y -= b.s * dt; if (b.y < -10) { b.y = H + 10; b.x = Math.random() * W; } });
      swimmers.forEach(s => {
        s.x += s.dir * s.speed * dt;
        if (s.x > W + 40) s.dir = -1;
        if (s.x < -40) s.dir = 1;
      });
      ghosts.forEach(g => { g.t += dt * g.speed; });
      ghosts = ghosts.filter(g => g.t < 1);
      grid.forEach(f => {
        if (!f) return;
        f.grow = Math.min(1, f.grow + dt * 4);
        f.pop = Math.max(0, f.pop - dt * 3);
      });
      if (gift) gift.t += dt;
      if (state !== 'play') return;
      spawnIn -= dt;
      if (spawnIn <= 0) {
        if (!addFish(randomType())) {
          state = 'over';
          selected = -1;
          options.onGameOver(score);
          return;
        }
        interval = Math.max(0.45, 2.2 - merges * 0.02);
        spawnIn = interval;
      }
    }

    function drawBackground(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#BDE8F2'); g.addColorStop(0.5, '#7CCFD9'); g.addColorStop(1, '#4FB3C4');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5;
      bubbles.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.stroke(); });
      // your own fish swim behind the tank
      swimmers.forEach(s => {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.translate(s.x, s.y + Math.sin(t * 1.5 + s.phase) * 8);
        ctx.scale(s.dir, 1);
        BW.fishMaker.draw(ctx, s.design, 16, t + s.phase);
        ctx.restore();
      });
      ctx.fillStyle = '#F3DDB3';
      ctx.beginPath(); ctx.moveTo(0, FLOOR);
      for (let x = 0; x <= W; x += 40) ctx.quadraticCurveTo(x + 20, FLOOR - 6, x + 40, FLOOR);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      ctx.strokeStyle = '#4FA35A'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      [[312, 3], [330, 4.2]].forEach(([x, p]) => {
        ctx.beginPath(); ctx.moveTo(x, FLOOR + 4);
        ctx.quadraticCurveTo(x + Math.sin(t * 1.5 + p) * 10, FLOOR - 30, x + Math.sin(t * 1.5 + p + 1) * 6, FLOOR - 56);
        ctx.stroke();
      });
    }

    function draw(ctx) {
      drawBackground(ctx);
      const free = empties().length;
      const crowded = state === 'play' && free <= 3;

      // the grid of bubble spots
      for (let i = 0; i < grid.length; i++) {
        const [x, y] = cellXY(i);
        ctx.beginPath(); ctx.arc(x, y, 29, 0, TAU);
        ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = crowded && !grid[i] ? `rgba(226,75,74,${0.5 + 0.5 * Math.sin(t * 12)})` : 'rgba(255,255,255,.5)';
        ctx.stroke();
      }

      // hint: when a fish is picked, its twins get a sparkly ring
      const pickedType = selected >= 0 ? grid[selected].type : -1;
      for (let i = 0; i < grid.length; i++) {
        const f = grid[i];
        if (!f) continue;
        const [x, y] = cellXY(i);
        const bob = Math.sin(t * 2 + i) * 2;
        if (i === selected) {
          ctx.beginPath(); ctx.arc(x, y, 30, 0, TAU);
          ctx.fillStyle = 'rgba(247,197,72,.35)'; ctx.fill();
          ctx.lineWidth = 4; ctx.strokeStyle = '#F7C548'; ctx.stroke();
        } else if (f.type === pickedType && f.type !== LAST) {
          ctx.setLineDash([5, 5]); ctx.lineDashOffset = -t * 20;
          ctx.beginPath(); ctx.arc(x, y, 29, 0, TAU);
          ctx.lineWidth = 2.5; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.save();
        ctx.translate(x, y + bob - (i === selected ? 4 + Math.abs(Math.sin(t * 8)) * 3 : 0));
        const s = f.grow * (1 + Math.sin(f.pop * Math.PI) * 0.3);
        ctx.scale(s, s);
        drawCreature(ctx, f.type, sizeOf(f.type), t);
        ctx.restore();
      }

      ghosts.forEach(g => {
        const e = g.t * g.t * (3 - 2 * g.t);
        ctx.save();
        ctx.translate(g.x0 + (g.x1 - g.x0) * e, g.y0 + (g.y1 - g.y0) * e);
        const s = g.shrink ? 1 - g.t * 0.5 : 1;
        ctx.scale(s, s);
        drawCreature(ctx, g.type, sizeOf(g.type), t);
        ctx.restore();
      });

      // your friend cheering from the sand
      ctx.save(); ctx.translate(46, 586 + Math.abs(Math.sin(t * 3)) * -4); ctx.scale(1.1, 1.1);
      BW.characters.draw(ctx, options.character, { flap: Math.sin(t * 6) * 0.15, dead: state === 'over' });
      ctx.restore();

      fx.draw(ctx);

      if (state === 'ready') {
        ctx.fillStyle = 'rgba(36,27,51,.35)'; ctx.fillRect(0, 0, W, H);
        K.title(ctx, 'Fishy Merge', 'Tap to start', options.getBest());
        K.text(ctx, 'Tap a fish, then tap its twin!', W / 2, 240, 18);
        K.text(ctx, 'Make a jellyfish to win a gift', W / 2, 270, 16);
      } else {
        K.text(ctx, String(score), W / 2, 36, 40);
        // next-fish timer
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        K.roundRect(ctx, 80, 84, 200, 14, 7); ctx.fill();
        ctx.fillStyle = crowded ? '#E24B4A' : '#9FC9F2';
        const fill = state === 'play' ? 1 - spawnIn / interval : 0;
        if (fill > 0.05) { K.roundRect(ctx, 80, 84, 200 * fill, 14, 7); ctx.fill(); }
        ctx.lineWidth = 2.5; ctx.strokeStyle = INK;
        K.roundRect(ctx, 80, 84, 200, 14, 7); ctx.stroke();
        ctx.save(); ctx.translate(62, 91); drawCreature(ctx, 0, 11, t); ctx.restore();
        K.text(ctx, free + ' free', 316, 91, 15);
      }

      if (state === 'gift') {
        ctx.fillStyle = 'rgba(36,27,51,.55)'; ctx.fillRect(0, 0, W, H);
        K.text(ctx, 'You made a jellyfish!', W / 2, 200, 28);
        drawGift(ctx, W / 2, 340, t);
        K.text(ctx, 'Tap the gift to open it', W / 2, 450, 20);
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

  return { start, drawCreature, NAMES };
})();
