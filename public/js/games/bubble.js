// Bubble Pop: a bubble shooter, like its card picture. Glossy pastel bubbles hang in rows at
// the top; your animal friend at the bottom aims with a star wand and shoots. Three or more
// of the same colour pop, and any bubbles left hanging by nothing fall off too.
// Every few shots a new row slides in; if the bubbles reach the dashed line, it's over.
window.BW = window.BW || {};
BW.games = BW.games || {};

BW.games.bubble = (() => {
  const K = BW.kit, W = K.W, H = K.H, TAU = K.TAU;
  const OUTLINE = '#6E4A3A';
  const R = 17, COLS = 10, ROW_H = R * Math.sqrt(3);
  const LEFT = 10 + R, TOP = 96;              // centre of the first bubble
  const DEAD_Y = 500;                          // bubbles below this line end the game
  const SHOOT_X = 180, SHOOT_Y = 566, SPEED = 900;
  const SHOTS_PER_ROW = 6;
  const COLORS = [
    ['#F7A8C4', '#FFE1EC'], // pink
    ['#8EC8F2', '#DDF0FF'], // blue
    ['#BBA3EC', '#ECE3FF'], // purple
    ['#F9D77E', '#FFF4CF'], // yellow
    ['#9EDDCB', '#E2F8F1']  // mint
  ];

  function start(canvas, options) {
    let state, grid, shift, shot, next, aim, armed, shotsLeft, score, colorsInPlay, falling, t = 0;
    const fx = K.sparkles();

    // ---------- the hexagon grid ----------
    // Rows alternate between sitting left and shifted half a bubble right.
    const offset = r => (r + shift) % 2;
    const cellX = (r, c) => LEFT + c * 2 * R + offset(r) * R;
    const cellY = r => TOP + r * ROW_H;
    const inGrid = (r, c) => r >= 0 && c >= 0 && c < COLS - offset(r);
    const at = (r, c) => (grid[r] && inGrid(r, c) ? grid[r][c] : null);

    function neighbours(r, c) {
      const o = offset(r);
      const list = [[r, c - 1], [r, c + 1], [r - 1, c - 1 + o], [r - 1, c + o], [r + 1, c - 1 + o], [r + 1, c + o]];
      return list.filter(([a, b]) => inGrid(a, b));
    }

    function randomColor() { return Math.floor(Math.random() * colorsInPlay); }

    function newRow() {
      return Array.from({ length: COLS }, () => randomColor());
    }

    function reset() {
      state = 'ready';
      shift = 0;
      colorsInPlay = 4;
      grid = [];
      for (let r = 0; r < 5; r++) grid.push(newRow());
      grid.forEach((row, r) => { if (offset(r)) row[COLS - 1] = null; });
      shot = null;
      falling = [];
      aim = -Math.PI / 2;
      armed = false;
      shotsLeft = SHOTS_PER_ROW;
      score = 0;
      next = [nextColor(), nextColor()];
      fx.clear();
    }

    // Only shoot colours that are still on the board
    function nextColor() {
      const left = new Set();
      grid.forEach(row => row.forEach(v => { if (v !== null && v !== undefined) left.add(v); }));
      const list = [...left];
      return list.length ? list[Math.floor(Math.random() * list.length)] : randomColor();
    }

    function pushRow() {
      shift = 1 - shift;
      const row = newRow();
      if (offset(0)) row[COLS - 1] = null;
      grid.unshift(row);
      grid.forEach((rw, r) => { if (offset(r)) rw[COLS - 1] = null; });
    }

    // ---------- shooting ----------
    function setAim(x, y) {
      let a = Math.atan2(y - SHOOT_Y, x - SHOOT_X);
      a = Math.max(-Math.PI + 0.18, Math.min(-0.18, a));
      aim = a;
    }

    function fire() {
      if (state !== 'play' || shot) return;
      shot = { x: SHOOT_X, y: SHOOT_Y, vx: Math.cos(aim) * SPEED, vy: Math.sin(aim) * SPEED, color: next[0] };
      BW.sound.play('shoot');
      next = [next[1], nextColor()];
    }

    function snap(b) {
      // nearest empty cell next to the bubble's position
      let best = null, bestD = Infinity;
      const r0 = Math.max(0, Math.round((b.y - TOP) / ROW_H));
      for (let r = Math.max(0, r0 - 1); r <= r0 + 1; r++) {
        for (let c = 0; c < COLS; c++) {
          if (!inGrid(r, c) || at(r, c) !== null && at(r, c) !== undefined) continue;
          const touching = r === 0 || neighbours(r, c).some(([a, d]) => at(a, d) !== null && at(a, d) !== undefined);
          if (!touching) continue;
          const d = (cellX(r, c) - b.x) ** 2 + (cellY(r) - b.y) ** 2;
          if (d < bestD) { bestD = d; best = [r, c]; }
        }
      }
      if (!best) return;
      const [r, c] = best;
      while (grid.length <= r) grid.push(Array(COLS).fill(null));
      grid[r][c] = b.color;
      settle(r, c);
    }

    function settle(r, c) {
      const color = grid[r][c];
      // same-colour group
      const group = [[r, c]], seen = new Set([r + ',' + c]);
      for (let i = 0; i < group.length; i++) {
        for (const [a, d] of neighbours(...group[i])) {
          const k = a + ',' + d;
          if (!seen.has(k) && at(a, d) === color) { seen.add(k); group.push([a, d]); }
        }
      }
      if (group.length >= 3) {
        group.forEach(([a, d]) => {
          grid[a][d] = null;
          fx.add(cellX(a, d), cellY(a), COLORS[color][0], 7, 150);
          fx.add(cellX(a, d), cellY(a), '#FFFFFF', 3, 90);
        });
        score += group.length * 10;
        // a little run of pops, one after another
        group.slice(0, 6).forEach((g, i) => setTimeout(() => BW.sound.play('pop'), i * 55));
        fx.label(cellX(r, c), cellY(r) - 20, '+' + group.length * 10);
        dropLoose();
      } else {
        shotsLeft--;
        if (shotsLeft <= 0) { pushRow(); shotsLeft = SHOTS_PER_ROW; }
      }
      // tidy empty rows at the bottom
      while (grid.length && grid[grid.length - 1].every(v => v === null || v === undefined)) grid.pop();
      if (!grid.length) {
        // cleared the board: bonus, and a fresh one with one more colour
        score += 200;
        fx.label(W / 2, 260, 'Clear! +200');
        colorsInPlay = Math.min(COLORS.length, colorsInPlay + 1);
        for (let i = 0; i < 4; i++) pushRow();
      }
      next = next.map(v => (grid.some(row => row.includes(v)) ? v : nextColor()));
      checkLost();
    }

    // Anything no longer hanging from the top falls off
    function dropLoose() {
      const keep = new Set(), queue = [];
      (grid[0] || []).forEach((v, c) => { if (v !== null && v !== undefined) { keep.add('0,' + c); queue.push([0, c]); } });
      for (let i = 0; i < queue.length; i++) {
        for (const [a, d] of neighbours(...queue[i])) {
          const k = a + ',' + d;
          if (!keep.has(k) && at(a, d) !== null && at(a, d) !== undefined) { keep.add(k); queue.push([a, d]); }
        }
      }
      let dropped = 0;
      grid.forEach((row, r) => row.forEach((v, c) => {
        if (v === null || v === undefined || keep.has(r + ',' + c)) return;
        falling.push({ x: cellX(r, c), y: cellY(r), vy: -60, color: v });
        row[c] = null;
        dropped++;
      }));
      if (dropped) { score += dropped * 20; fx.label(W / 2, 300, `+${dropped * 20}`); }
    }

    function checkLost() {
      grid.forEach((row, r) => {
        if (state === 'play' && row.some(v => v !== null && v !== undefined) && cellY(r) + R > DEAD_Y) {
          state = 'over';
          options.onGameOver(score);
        }
      });
    }

    function update(dt) {
      t += dt;
      fx.update(dt);
      falling.forEach(f => { f.vy += 1400 * dt; f.y += f.vy * dt; });
      falling = falling.filter(f => f.y < H + R);
      if (!shot) return;
      // move in small steps so fast bubbles can't skip past others
      const steps = 4;
      for (let i = 0; i < steps && shot; i++) {
        shot.x += shot.vx * dt / steps;
        shot.y += shot.vy * dt / steps;
        if (shot.x < 10 + R) { shot.x = 10 + R; shot.vx = Math.abs(shot.vx); }
        if (shot.x > W - 10 - R) { shot.x = W - 10 - R; shot.vx = -Math.abs(shot.vx); }
        let hit = shot.y - R <= TOP - R;
        for (let r = 0; r < grid.length && !hit; r++) {
          for (let c = 0; c < COLS; c++) {
            if (at(r, c) === null || at(r, c) === undefined) continue;
            if ((cellX(r, c) - shot.x) ** 2 + (cellY(r) - shot.y) ** 2 < (R * 1.8) ** 2) { hit = true; break; }
          }
        }
        if (hit) { snap(shot); shot = null; }
      }
    }

    // ---------- drawing (pastel garden like the card) ----------
    function bubble(x, y, color, r) {
      r = r || R;
      const [base, light] = COLORS[color];
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      g.addColorStop(0, light); g.addColorStop(0.55, base); g.addColorStop(1, base);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(110,74,58,.35)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.28, r * 0.16, -0.6, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(x + r * 0.42, y + r * 0.38, r * 0.08, 0, TAU); ctx.fill();
    }

    function drawBackground() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#F4D9EC'); g.addColorStop(0.45, '#DCE9F7'); g.addColorStop(1, '#E6F2DA');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // soft garden: bushes and leafy plants at the sides
      ctx.fillStyle = '#C6E2B0';
      ctx.beginPath(); ctx.moveTo(0, 520);
      for (let x = 0; x <= W; x += 45) ctx.quadraticCurveTo(x + 22, 470 + 18 * Math.sin(x), x + 45, 500);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      ctx.fillStyle = '#A9D18E';
      ctx.beginPath(); ctx.moveTo(0, 560);
      for (let x = 0; x <= W; x += 60) ctx.quadraticCurveTo(x + 30, 530, x + 60, 556);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      ctx.strokeStyle = '#8FBF73'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      [[20, 0], [340, 1.7]].forEach(([x, p]) => {
        ctx.beginPath(); ctx.moveTo(x, 600);
        ctx.quadraticCurveTo(x + Math.sin(t + p) * 8, 420, x + Math.sin(t + p + 1) * 6, 300);
        ctx.stroke();
      });
      // top bar where the bubbles hang
      ctx.fillStyle = 'rgba(255,247,238,.85)';
      ctx.fillRect(0, 0, W, TOP - R - 2);
      ctx.fillStyle = '#E9CDBB'; ctx.fillRect(0, TOP - R - 4, W, 3);
      // the line not to cross
      ctx.strokeStyle = 'rgba(232,120,140,.55)'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(0, DEAD_Y); ctx.lineTo(W, DEAD_Y); ctx.stroke();
      ctx.setLineDash([]);
    }

    function drawAim() {
      if (state !== 'play') return;
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      let x = SHOOT_X, y = SHOOT_Y, dx = Math.cos(aim), dy = Math.sin(aim);
      for (let i = 0; i < 26 && y > TOP; i++) {
        x += dx * 16; y += dy * 16;
        if (x < 10 + R || x > W - 10 - R) dx = -dx;
        ctx.beginPath(); ctx.arc(x, y, 2.6 - i * 0.06, 0, TAU); ctx.fill();
      }
    }

    function drawShooter() {
      // the wand with a star at its tip, pointing where you aim
      ctx.save();
      ctx.translate(SHOOT_X, SHOOT_Y);
      ctx.rotate(aim + Math.PI / 2);
      ctx.strokeStyle = '#E8B969'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 26); ctx.lineTo(0, -28); ctx.stroke();
      K.star(ctx, 0, -32, 9 + Math.sin(t * 6), '#FFE08A');
      ctx.restore();
      bubble(SHOOT_X, SHOOT_Y + 6, next[0]);
      // your animal friend beside the wand, holding the next bubble
      const img = BW.friends && BW.friends.get(options.character) ? BW.friends.cutout(options.character) : null;
      if (img && img.complete && img.naturalWidth) {
        const k = 100 / Math.max(img.naturalWidth, img.naturalHeight);
        const w = img.naturalWidth * k, h = img.naturalHeight * k;
        const y = H - 40 - h * 0.92 + Math.sin(t * 2.5) * 2;
        // looking right, towards the wand
        if (BW.friends.facesLeft(options.character)) {
          ctx.save(); ctx.translate(18 + w, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, w, h); ctx.restore();
        } else ctx.drawImage(img, 18, y, w, h);
      } else {
        ctx.save(); ctx.translate(70, 560); ctx.scale(1.6, 1.6); BW.characters.draw(ctx, options.character); ctx.restore();
      }
      bubble(112, 588, next[1], R * 0.85);
      K.text(ctx, 'Next', 112, 616, 13);
    }

    function draw(c) {
      ctx = c;
      drawBackground();
      grid.forEach((row, r) => row.forEach((v, cc) => { if (v !== null && v !== undefined) bubble(cellX(r, cc), cellY(r), v); }));
      falling.forEach(f => bubble(f.x, f.y, f.color));
      drawAim();
      if (shot) bubble(shot.x, shot.y, shot.color);
      drawShooter();
      fx.draw(ctx);
      if (state === 'ready') {
        ctx.fillStyle = 'rgba(110,74,58,.25)'; ctx.fillRect(0, 0, W, H);
        K.title(ctx, 'Bubble Pop', 'Tap to start', options.getBest());
        K.text(ctx, 'Aim, let go, match 3 to pop!', W / 2, 240, 18);
      } else {
        K.text(ctx, String(score), W / 2, 40, 34);
        K.text(ctx, `New row in ${shotsLeft}`, W - 70, 40, 13);
      }
    }

    let ctx = canvas.getContext('2d');
    reset();
    const engine = K.run(canvas, {
      update, draw,
      down(x, y) {
        if (state === 'over') return;
        if (state === 'ready') { state = 'play'; return; }
        armed = true; setAim(x, y);
      },
      move(x, y) { if (state === 'play') setAim(x, y); },
      up(x, y) {
        if (!armed) return;
        armed = false; setAim(x, y); fire();
      },
      keydown(e) {
        if (state === 'over') return;
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp') {
          e.preventDefault();
          if (e.repeat) return;
          if (state === 'ready') state = 'play'; else fire();
        } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { aim = Math.max(-Math.PI + 0.18, aim - 0.08); }
        else if (e.code === 'ArrowRight' || e.code === 'KeyD') { aim = Math.min(-0.18, aim + 0.08); }
      }
    });
    return { restart: reset, stop: engine.stop };
  }

  return { start };
})();
