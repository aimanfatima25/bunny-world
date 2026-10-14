// Fishy Merge: sea friends swim freely around the tank. Tap a fish, then tap its
// twin, and they merge into the next one: goldie → clownfish → pufferfish →
// betta → koi → axolotl (Aiman's sea friends). New fish keep swimming in, faster and faster;
// when the tank is full, the game ends.
// Making an axolotl opens a gift: the Fish Maker (fishmaker.js), where players
// design their own fish for their Aquarium.
window.BW = window.BW || {};
BW.games = BW.games || {};

BW.games.fish = (() => {
  const K = BW.kit, W = K.W, H = K.H, INK = K.INK, TAU = K.TAU;
  // where fish can swim
  const LEFT = 34, RIGHT = W - 34, TOP = 140, BOTTOM = 520;
  const START_FISH = 12, MAX_FISH = 24;

  //              goldie clown puffer betta koi axolotl
  const POINTS = [0, 2, 6, 15, 35, 80];
  const LAST = POINTS.length - 1;
  // The merge chain uses Aiman's sea friends pictures (friends.js), smallest to biggest
  const CHAIN = ['goldie', 'clownfish', 'puffer', 'betta', 'koi', 'axolotl'];
  const NAMES = ['Goldie', 'Clownfish', 'Pufferfish', 'Betta', 'Koi', 'Axolotl'];

  function sizeOf(type) { return 17 + type * 2.6; }

  function randomType() {
    const r = Math.random();
    return r < 0.65 ? 0 : r < 0.95 ? 1 : 2;
  }

  // Each sea friend is their cut-out picture (like the Merge the Fish card), wiggling as it swims
  function drawCreature(ctx, type, r, t) {
    const img = BW.friends.cutout(CHAIN[type]);
    ctx.save();
    ctx.rotate(Math.sin((t || 0) * 3 + type) * 0.06);
    if (img.complete && img.naturalWidth) {
      const w = r * 2.7, h = w * img.naturalHeight / img.naturalWidth;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    } else {
      BW.characters.draw(ctx, CHAIN[type], { r });
    }
    ctx.restore();
  }

  function start(canvas, options) {
    let state, fish, selected, spawnIn, interval, merges, score, ghosts, gift, t = 0;
    const fx = K.sparkles();
    const bg = BW.aquarium.scene();

    function makeFish(type, entering) {
      const fromLeft = Math.random() < 0.5;
      return {
        type,
        x: entering ? (fromLeft ? -30 : W + 30) : LEFT + Math.random() * (RIGHT - LEFT),
        y: TOP + Math.random() * (BOTTOM - TOP),
        dir: entering ? (fromLeft ? 1 : -1) : (Math.random() < 0.5 ? 1 : -1),
        face: 1,
        speed: (24 + Math.random() * 22) * (type === LAST ? 0.6 : 1),
        targetY: TOP + Math.random() * (BOTTOM - TOP),
        turnIn: 1 + Math.random() * 4,
        phase: Math.random() * TAU,
        entering,
        grow: entering ? 1 : 0,
        pop: 0
      };
    }

    function reset() {
      state = 'ready';
      fish = [];
      for (let i = 0; i < START_FISH; i++) fish.push(makeFish(i < 4 ? 0 : randomType(), false));
      fish.forEach(f => { f.face = f.dir; f.grow = 1; });
      selected = null;
      merges = 0;
      score = 0;
      ghosts = [];
      gift = null;
      interval = spawnIn = 2.2;
      fx.clear();
    }

    function drawY(f) { return f.y + Math.sin(t * 2 + f.phase) * 5; }

    // The fish under the finger. With a fish already picked, its twins win ties.
    function fishAt(x, y) {
      let best = null, bestScore = Infinity;
      for (const f of fish) {
        const reach = sizeOf(f.type) + 14;
        const d = Math.hypot(f.x - x, drawY(f) - y);
        if (d > reach) continue;
        const prefer = selected && f !== selected && f.type === selected.type ? -100 : 0;
        if (d + prefer < bestScore) { bestScore = d + prefer; best = f; }
      }
      return best;
    }

    function tap(x, y) {
      if (state === 'over' || state === 'maker') return;
      if (state === 'ready') { state = 'play'; return; }
      if (state === 'gift') { if (gift.t > 0.6) openGift(); return; }
      const f = fishAt(x, y);
      if (!f) { selected = null; return; }
      if (!selected || selected === f) {
        selected = selected === f ? null : f;
        f.pop = 0.5;
        return;
      }
      if (selected.type !== f.type || f.type === LAST) { selected = f; f.pop = 0.5; return; }

      // merge: the picked fish swims into its twin, which grows into the next kind
      const s = selected;
      ghosts.push({ x0: s.x, y0: drawY(s), x1: f.x, y1: drawY(f), type: s.type, face: s.face, t: 0, speed: 6, shrink: true });
      fish.splice(fish.indexOf(s), 1);
      selected = null;
      f.type++;
      f.pop = 1;
      if (f.type === LAST) f.speed *= 0.6;
      merges++;
      score += POINTS[f.type];
      fx.add(f.x, drawY(f), '#FFFFFF', 10, 150);
      fx.label(f.x, drawY(f) - 34, '+' + POINTS[f.type]);
      if (f.type === LAST) {
        fx.add(f.x, drawY(f), '#E3CCF2', 24, 260);
        fx.add(f.x, drawY(f), '#F7C548', 16, 200);
        state = 'gift';
        gift = { fish: f, t: 0 };
      }
    }

    function openGift() {
      state = 'maker';
      BW.fishMaker.open(() => {
        // the axolotl floats happily up and away, making room
        const j = gift.fish;
        ghosts.push({ x0: j.x, y0: drawY(j), x1: j.x, y1: -80, type: LAST, face: j.face, t: 0, speed: 0.8, shrink: false });
        fish.splice(fish.indexOf(j), 1);
        gift = null;
        state = 'play';
      });
    }

    function swim(f, dt) {
      const slow = f === selected ? 0.25 : 1;
      f.x += f.dir * f.speed * slow * dt;
      f.y += (f.targetY - f.y) * Math.min(1, dt * 0.6);
      if (f.entering) {
        if (f.x > LEFT && f.x < RIGHT) f.entering = false;
      } else {
        if (f.x < LEFT) f.dir = 1;
        if (f.x > RIGHT) f.dir = -1;
        f.turnIn -= dt;
        if (f.turnIn <= 0) {
          f.turnIn = 2 + Math.random() * 4;
          if (Math.random() < 0.35) f.dir *= -1;
          f.targetY = TOP + Math.random() * (BOTTOM - TOP);
        }
      }
      // turn around smoothly instead of snapping
      f.face += (f.dir - f.face) * Math.min(1, dt * 6);
      f.grow = Math.min(1, f.grow + dt * 4);
      f.pop = Math.max(0, f.pop - dt * 3);
    }

    function update(dt) {
      t += dt;
      fx.update(dt);
      bg.update(dt);
      ghosts.forEach(g => { g.t += dt * g.speed; });
      ghosts = ghosts.filter(g => g.t < 1);
      if (gift) gift.t += dt;
      if (state === 'over') return;
      fish.forEach(f => swim(f, dt));
      if (state !== 'play') return;
      spawnIn -= dt;
      if (spawnIn <= 0) {
        if (fish.length >= MAX_FISH) {
          state = 'over';
          selected = null;
          options.onGameOver(score);
          return;
        }
        fish.push(makeFish(randomType(), true));
        interval = Math.max(0.45, 2.2 - merges * 0.02);
        spawnIn = interval;
      }
    }

    function drawGift(ctx, x, y) {
      const bob = Math.sin(t * 5) * 5, wob = Math.sin(t * 9) * 0.06;
      ctx.save(); ctx.translate(x, y + bob); ctx.rotate(wob);
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
      ctx.fillStyle = '#F7C548';
      ctx.beginPath(); ctx.ellipse(-14, -46, 14, 9, -0.5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(14, -46, 14, 9, 0.5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FF7FAF';
      K.roundRect(ctx, -44, -20, 88, 66, 8); ctx.fill(); ctx.stroke();
      K.roundRect(ctx, -50, -40, 100, 24, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#F7C548';
      ctx.fillRect(-9, -39, 18, 22); ctx.fillRect(-9, -19, 18, 64);
      ctx.strokeRect(-9, -40, 18, 24); ctx.strokeRect(-9, -20, 18, 66);
      ctx.beginPath(); ctx.arc(0, -42, 7, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
      K.star(ctx, x - 64, y - 30 + bob, 8 + Math.sin(t * 7) * 2, '#FFFFFF');
      K.star(ctx, x + 66, y + 10 - bob, 6 + Math.cos(t * 7) * 2, '#FFFFFF');
    }

    function draw(ctx) {
      bg.draw(ctx);

      // a picked fish glows; its twins get a sparkly ring
      const pickedType = selected ? selected.type : -1;
      for (const f of fish) {
        const x = f.x, y = drawY(f), r = sizeOf(f.type);
        if (f === selected) {
          ctx.beginPath(); ctx.arc(x, y, r + 9, 0, TAU);
          ctx.fillStyle = 'rgba(247,197,72,.35)'; ctx.fill();
          ctx.lineWidth = 4; ctx.strokeStyle = '#F7C548'; ctx.stroke();
        } else if (f.type === pickedType && f.type !== LAST) {
          ctx.setLineDash([5, 5]); ctx.lineDashOffset = -t * 20;
          ctx.beginPath(); ctx.arc(x, y, r + 8, 0, TAU);
          ctx.lineWidth = 2.5; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.save();
        ctx.translate(x, y);
        const s = f.grow * (1 + Math.sin(f.pop * Math.PI) * 0.3);
        ctx.scale(s * f.face, s);
        drawCreature(ctx, f.type, r, t + f.phase);
        ctx.restore();
      }

      ghosts.forEach(g => {
        const e = g.t * g.t * (3 - 2 * g.t);
        ctx.save();
        ctx.translate(g.x0 + (g.x1 - g.x0) * e, g.y0 + (g.y1 - g.y0) * e);
        const s = g.shrink ? 1 - g.t * 0.5 : 1;
        ctx.scale(s * g.face, s);
        drawCreature(ctx, g.type, sizeOf(g.type), t);
        ctx.restore();
      });

      fx.draw(ctx);

      if (state === 'ready') {
        ctx.fillStyle = 'rgba(36,27,51,.35)'; ctx.fillRect(0, 0, W, H);
        K.title(ctx, 'Merge the Fish', 'Tap to start', options.getBest());
        K.text(ctx, 'Tap a fish, then tap its twin!', W / 2, 240, 18);
        K.text(ctx, 'Make an axolotl to win a gift', W / 2, 270, 16);
      } else {
        K.text(ctx, String(score), W / 2, 36, 40);
        // how full the tank is
        const full = fish.length / MAX_FISH;
        const crowded = state === 'play' && fish.length >= MAX_FISH - 4;
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        K.roundRect(ctx, 80, 80, 180, 14, 7); ctx.fill();
        ctx.fillStyle = crowded ? `rgba(226,75,74,${0.6 + 0.4 * Math.sin(t * 12)})` : '#9FC9F2';
        K.roundRect(ctx, 80, 80, Math.max(14, 180 * Math.min(1, full)), 14, 7); ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = INK;
        K.roundRect(ctx, 80, 80, 180, 14, 7); ctx.stroke();
        ctx.save(); ctx.translate(62, 87); drawCreature(ctx, 0, 11, t); ctx.restore();
        K.text(ctx, fish.length + '/' + MAX_FISH, 298, 87, 16);
      }

      if (state === 'gift') {
        ctx.fillStyle = 'rgba(36,27,51,.55)'; ctx.fillRect(0, 0, W, H);
        K.text(ctx, 'You made an axolotl!', W / 2, 200, 28);
        drawGift(ctx, W / 2, 340);
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
