// Fishy Merge: drop sea friends into the tank. When two of the same kind touch,
// they merge into the next one: tiny fish → clownfish → pufferfish → seahorse
// → turtle → jellyfish. The jellyfish is the final, biggest friend and doesn't merge.
// The game ends when the tank stays filled past the dashed line.
window.BW = window.BW || {};
BW.games = BW.games || {};

BW.games.fish = (() => {
  const K = BW.kit, W = K.W, INK = K.INK, TAU = K.TAU;
  const LEFT = 16, RIGHT = 344, FLOOR = 600, DANGER = 165, HOLD_Y = 128;
  const GRAVITY = 1200, BOUNCE = 0.1, SUBSTEPS = 4;

  //            tiny   clown  puffer seahorse turtle jelly
  const RADIUS = [14, 20, 26, 33, 41, 50];
  const POINTS = [0, 2, 6, 15, 35, 80];
  const LAST = RADIUS.length - 1;
  const NAMES = ['Tiny fish', 'Clownfish', 'Pufferfish', 'Seahorse', 'Turtle', 'Jellyfish'];

  function randomDrop() {
    const r = Math.random();
    return r < 0.5 ? 0 : r < 0.85 ? 1 : 2;
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
    let state, fishes, aim, keyDir, held, next, cooldown, score, danger, armed, t = 0;
    const fx = K.sparkles();
    const bubbles = Array.from({ length: 10 }, () => ({ x: Math.random() * W, y: Math.random() * 640, r: 2 + Math.random() * 4, s: 20 + Math.random() * 30 }));

    function reset() {
      state = 'ready';
      fishes = [];
      aim = W / 2;
      keyDir = 0;
      held = randomDrop();
      next = randomDrop();
      cooldown = 0;
      score = 0;
      danger = 0;
      armed = false;
      fx.clear();
    }

    function clampAim(x) { return Math.max(LEFT + RADIUS[held] + 2, Math.min(RIGHT - RADIUS[held] - 2, x)); }

    function drop() {
      if (state !== 'play' || cooldown > 0) return;
      const r = RADIUS[held];
      fishes.push({ type: held, x: clampAim(aim), y: HOLD_Y, vx: 0, vy: 0, r, age: 0, pop: 0, tilt: 0 });
      held = next;
      next = randomDrop();
      cooldown = 0.5;
    }

    function physics(h) {
      for (const f of fishes) {
        f.vy += GRAVITY * h;
        f.vx *= 0.995;
        f.x += f.vx * h;
        f.y += f.vy * h;
        if (f.x - f.r < LEFT) { f.x = LEFT + f.r; f.vx = Math.abs(f.vx) * BOUNCE; }
        if (f.x + f.r > RIGHT) { f.x = RIGHT - f.r; f.vx = -Math.abs(f.vx) * BOUNCE; }
        if (f.y + f.r > FLOOR) { f.y = FLOOR - f.r; f.vy = -Math.abs(f.vy) * BOUNCE; f.vx *= 0.97; }
      }
      const born = [];
      for (let i = 0; i < fishes.length; i++) {
        const a = fishes[i];
        if (a.gone) continue;
        for (let j = i + 1; j < fishes.length; j++) {
          const b = fishes[j];
          if (b.gone) continue;
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 0.01, overlap = a.r + b.r - d;
          if (overlap <= 0) continue;
          if (a.type === b.type && a.type < LAST) { merge(a, b, born); break; }
          const nx = dx / d, ny = dy / d;
          const ma = a.r * a.r, mb = b.r * b.r, total = ma + mb;
          a.x -= nx * overlap * mb / total; a.y -= ny * overlap * mb / total;
          b.x += nx * overlap * ma / total; b.y += ny * overlap * ma / total;
          const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (vn < 0) {
            const j2 = -(1 + BOUNCE) * vn / (1 / ma + 1 / mb);
            a.vx -= j2 / ma * nx; a.vy -= j2 / ma * ny;
            b.vx += j2 / mb * nx; b.vy += j2 / mb * ny;
          }
        }
      }
      fishes = fishes.filter(f => !f.gone).concat(born);
    }

    function merge(a, b, born) {
      a.gone = b.gone = true;
      const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
      const type = a.type + 1;
      score += POINTS[type];
      born.push({ type, x, y, vx: (a.vx + b.vx) / 2, vy: Math.min(a.vy, b.vy) / 2, r: RADIUS[type], age: 0.5, pop: 1, tilt: 0 });
      fx.add(x, y, '#FFFFFF', 10, 150);
      if (type === LAST) { fx.add(x, y, '#E3CCF2', 24, 260); fx.add(x, y, '#F7C548', 16, 200); }
      fx.label(x, y - RADIUS[type] - 6, '+' + POINTS[type]);
    }

    function update(dt) {
      t += dt;
      fx.update(dt);
      bubbles.forEach(b => { b.y -= b.s * dt; if (b.y < -10) { b.y = 650; b.x = Math.random() * W; } });
      if (state === 'over') return;
      if (keyDir) aim += keyDir * 260 * dt;
      aim = clampAim(aim);
      if (state === 'ready') return;
      cooldown = Math.max(0, cooldown - dt);
      const h = dt / SUBSTEPS;
      for (let i = 0; i < SUBSTEPS; i++) physics(h);
      let over = false;
      for (const f of fishes) {
        f.age += dt;
        f.pop = Math.max(0, f.pop - dt * 5);
        f.tilt += (Math.max(-0.5, Math.min(0.5, f.vx / 300)) - f.tilt) * 0.1;
        if (f.age > 1 && f.y - f.r < DANGER) over = true;
      }
      danger = over ? danger + dt : Math.max(0, danger - dt * 2);
      if (danger > 2) { state = 'over'; options.onGameOver(score); }
    }

    function drawBackground(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 640);
      g.addColorStop(0, '#BDE8F2'); g.addColorStop(0.5, '#7CCFD9'); g.addColorStop(1, '#4FB3C4');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, 640);
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5;
      bubbles.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.stroke(); });
      // sand and seaweed
      ctx.fillStyle = '#F3DDB3';
      ctx.beginPath(); ctx.moveTo(0, FLOOR);
      for (let x = 0; x <= W; x += 40) ctx.quadraticCurveTo(x + 20, FLOOR - 6, x + 40, FLOOR);
      ctx.lineTo(W, 640); ctx.lineTo(0, 640); ctx.fill();
      ctx.strokeStyle = '#4FA35A'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      [[30, 0], [52, 1.5], [312, 3], [330, 4.2]].forEach(([x, p]) => {
        ctx.beginPath(); ctx.moveTo(x, FLOOR + 4);
        ctx.quadraticCurveTo(x + Math.sin(t * 1.5 + p) * 10, FLOOR - 30, x + Math.sin(t * 1.5 + p + 1) * 6, FLOOR - 56);
        ctx.stroke();
      });
      // tank walls
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(LEFT - 2, DANGER - 20); ctx.lineTo(LEFT - 2, FLOOR); ctx.moveTo(RIGHT + 2, DANGER - 20); ctx.lineTo(RIGHT + 2, FLOOR); ctx.stroke();
      // danger line
      const warn = danger > 0;
      ctx.strokeStyle = warn ? `rgba(226,75,74,${0.5 + 0.5 * Math.sin(t * 14)})` : 'rgba(255,255,255,.6)';
      ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(LEFT, DANGER); ctx.lineTo(RIGHT, DANGER); ctx.stroke();
      ctx.setLineDash([]);
    }

    function draw(ctx) {
      drawBackground(ctx);
      for (const f of fishes) {
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.tilt);
        const s = 1 + f.pop * 0.25;
        ctx.scale(s, s);
        drawCreature(ctx, f.type, f.r, t);
        ctx.restore();
      }
      // the friend holding the next fish
      if (state !== 'over') {
        const x = clampAim(aim);
        if (state === 'play') {
          ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.setLineDash([4, 8]);
          ctx.beginPath(); ctx.moveTo(x, HOLD_Y + RADIUS[held]); ctx.lineTo(x, FLOOR); ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.save(); ctx.translate(x, 86); ctx.scale(0.85, 0.85);
        BW.characters.draw(ctx, options.character, { flap: Math.sin(t * 4) * 0.1 });
        ctx.restore();
        if (cooldown <= 0) { ctx.save(); ctx.translate(x, HOLD_Y); drawCreature(ctx, held, RADIUS[held], t); ctx.restore(); }
      }
      fx.draw(ctx);
      if (state === 'ready') {
        K.title(ctx, 'Fishy Merge', 'Tap to start', options.getBest());
        K.text(ctx, 'Match two to grow them!', W / 2, 240, 18);
      } else {
        K.text(ctx, String(score), W / 2, 36, 40);
        K.text(ctx, 'Next', W - 34, 20, 14);
        ctx.save(); ctx.translate(W - 34, 44); drawCreature(ctx, next, 14, t); ctx.restore();
      }
    }

    reset();
    const engine = K.run(canvas, {
      update, draw,
      down(x) {
        if (state === 'over') return;
        if (state === 'ready') { state = 'play'; armed = false; return; }
        aim = x; armed = true;
      },
      move(x) { if (state !== 'over') aim = x; },
      up(x) {
        if (!armed) return;
        armed = false; aim = x; drop();
      },
      keydown(e) {
        if (state === 'over') return;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keyDir = -1;
        else if (e.code === 'ArrowRight' || e.code === 'KeyD') keyDir = 1;
        else if (e.code === 'Space' || e.code === 'ArrowDown') {
          e.preventDefault();
          if (e.repeat) return;
          if (state === 'ready') state = 'play'; else drop();
        }
      },
      keyup(e) {
        if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && keyDir < 0) keyDir = 0;
        if ((e.code === 'ArrowRight' || e.code === 'KeyD') && keyDir > 0) keyDir = 0;
      }
    });
    return { restart: reset, stop: engine.stop };
  }

  return { start, drawCreature, NAMES };
})();
