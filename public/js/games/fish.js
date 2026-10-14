// Fishy Merge: sea friends swim freely around the tank. Tap a fish, then tap its
// twin, and they merge into the next one: tiny fish → clownfish → pufferfish →
// seahorse → turtle → jellyfish. New fish keep swimming in, faster and faster;
// when the tank is full, the game ends.
// Making a jellyfish opens a gift: the Fish Maker (fishmaker.js), where players
// design their own fish for their Aquarium.
window.BW = window.BW || {};
BW.games = BW.games || {};

BW.games.fish = (() => {
  const K = BW.kit, W = K.W, H = K.H, INK = K.INK, TAU = K.TAU;
  // where fish can swim
  const LEFT = 34, RIGHT = W - 34, TOP = 140, BOTTOM = 520;
  const START_FISH = 12, MAX_FISH = 24;

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
        // the jellyfish floats happily up and away, making room
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

      // your friend cheering from the sand
      ctx.save(); ctx.translate(156, 590 - Math.abs(Math.sin(t * 3)) * 4); ctx.scale(1.1, 1.1);
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
        K.text(ctx, 'You made a jellyfish!', W / 2, 200, 28);
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
