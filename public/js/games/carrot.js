// Carrot Catch: carry a basket on your head and catch the falling carrots.
// Golden carrots are worth 3. Catching a rock, or letting a carrot hit the
// ground, costs a heart. Three hearts and it's over.
window.BW = window.BW || {};
BW.games = BW.games || {};

BW.games.carrot = (() => {
  const K = BW.kit, W = K.W, H = K.H, INK = K.INK, TAU = K.TAU;
  const GROUND = 592, PLAYER_Y = 566, RIM = 498, LIVES = 3;

  function start(canvas, options) {
    let state, px, target, keyDir, items, spawnIn, score, lives, hurt, t = 0;
    const fx = K.sparkles();

    function reset() {
      state = 'ready';
      px = target = W / 2;
      keyDir = 0;
      items = [];
      spawnIn = 0.5;
      score = 0;
      lives = LIVES;
      hurt = 0;
      fx.clear();
    }

    function spawn() {
      const r = Math.random();
      const rockChance = 0.2 + Math.min(score * 0.002, 0.12);
      const type = r < rockChance ? 'rock' : r > 0.93 ? 'gold' : 'carrot';
      const speed = Math.min(170 + score * 2.5, 400) * (0.85 + Math.random() * 0.3);
      items.push({ x: 30 + Math.random() * (W - 60), y: -30, vy: speed, type, rot: Math.random() * 6, spin: (Math.random() - 0.5) * 4 });
    }

    function ouch(x, y) {
      lives--;
      hurt = 0.5;
      fx.add(x, y, '#8E80A3', 10);
    }

    function update(dt) {
      t += dt;
      fx.update(dt);
      hurt = Math.max(0, hurt - dt);
      if (state === 'over') return;
      if (keyDir) target = px + keyDir * 60;
      target = Math.max(40, Math.min(W - 40, target));
      const d = target - px;
      px += Math.sign(d) * Math.min(Math.abs(d), 650 * dt);
      if (state === 'ready') return;

      spawnIn -= dt;
      if (spawnIn <= 0) {
        spawn();
        spawnIn = Math.max(0.32, 0.85 - score * 0.006) * (0.7 + Math.random() * 0.6);
      }
      for (const it of items) {
        it.y += it.vy * dt;
        it.rot += it.spin * dt;
        if (it.y > RIM - 6 && it.y < RIM + 22 && Math.abs(it.x - px) < 42) {
          it.done = true;
          if (it.type === 'rock') ouch(it.x, it.y);
          else {
            const pts = it.type === 'gold' ? 3 : 1;
            score += pts;
            fx.add(it.x, it.y, it.type === 'gold' ? '#F7C548' : '#F28C28', 8);
            fx.label(it.x, it.y - 24, '+' + pts);
          }
        } else if (it.y > GROUND) {
          it.done = true;
          if (it.type !== 'rock') ouch(it.x, GROUND);
        }
      }
      items = items.filter(it => !it.done);
      if (lives <= 0) { state = 'over'; options.onGameOver(score); }
    }

    function drawBackground(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, GROUND);
      g.addColorStop(0, '#BFE3F5'); g.addColorStop(1, '#FDE7D0');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // sun
      ctx.fillStyle = '#FFE08A';
      ctx.beginPath(); ctx.arc(300, 110, 34, 0, TAU); ctx.fill();
      // hills
      ctx.fillStyle = '#B9DDB0';
      ctx.beginPath(); ctx.moveTo(0, GROUND);
      ctx.quadraticCurveTo(90, GROUND - 90, 190, GROUND - 30); ctx.quadraticCurveTo(280, GROUND - 100, W, GROUND - 40);
      ctx.lineTo(W, GROUND); ctx.fill();
      // little fence
      ctx.strokeStyle = '#E8C9A0'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let x = 14; x < W; x += 30) { ctx.moveTo(x, GROUND - 4); ctx.lineTo(x, GROUND - 34); }
      ctx.moveTo(4, GROUND - 26); ctx.lineTo(W - 4, GROUND - 26);
      ctx.stroke();
      ctx.fillStyle = '#7CC36B'; ctx.fillRect(0, GROUND, W, 14);
      ctx.fillStyle = '#C98F5A'; ctx.fillRect(0, GROUND + 14, W, H - GROUND - 14);
    }

    function drawRock(ctx, it) {
      ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.rot * 0.3);
      ctx.fillStyle = '#A59BB3'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-14, 4); ctx.quadraticCurveTo(-15, -11, -2, -13); ctx.quadraticCurveTo(14, -13, 15, 1); ctx.quadraticCurveTo(14, 13, 0, 13); ctx.quadraticCurveTo(-13, 13, -14, 4); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // grumpy face
      ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-8, -5); ctx.lineTo(-3, -3); ctx.moveTo(8, -5); ctx.lineTo(3, -3); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-5, 0, 1.8, 0, TAU); ctx.arc(5, 0, 1.8, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-4, 7); ctx.quadraticCurveTo(0, 4, 4, 7); ctx.stroke();
      ctx.restore();
    }

    function drawPlayer(ctx) {
      const bob = state === 'play' ? Math.abs(Math.sin(t * 10)) * (Math.abs(target - px) > 4 ? 3 : 0) : 0;
      ctx.save(); ctx.translate(px, PLAYER_Y - bob); ctx.scale(1.25, 1.25);
      if (hurt > 0) ctx.rotate(Math.sin(t * 40) * 0.08);
      BW.characters.draw(ctx, options.character, { dead: hurt > 0 });
      ctx.restore();
      // basket on top of the head, hiding the ear tips
      const y = RIM - bob;
      if (score > 0) {
        for (let i = 0; i < Math.min(3, Math.ceil(score / 5)); i++) K.carrot(ctx, px - 16 + i * 16, y - 2, 16, (i - 1) * 0.4);
      }
      ctx.fillStyle = '#C98F5A'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(px - 40, y); ctx.lineTo(px + 40, y); ctx.lineTo(px + 31, y + 30); ctx.lineTo(px - 31, y + 30); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#A9560E'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px - 36, y + 10); ctx.lineTo(px + 36, y + 10); ctx.moveTo(px - 33, y + 20); ctx.lineTo(px + 33, y + 20);
      for (let i = -2; i <= 2; i++) { ctx.moveTo(px + i * 14, y); ctx.lineTo(px + i * 11, y + 30); }
      ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(px - 42, y); ctx.lineTo(px + 42, y); ctx.stroke();
    }

    function draw(ctx) {
      drawBackground(ctx);
      drawPlayer(ctx);
      for (const it of items) {
        if (it.type === 'rock') drawRock(ctx, it);
        else {
          K.carrot(ctx, it.x, it.y, 30, it.rot, it.type === 'gold' ? '#F7C548' : '#F28C28');
          if (it.type === 'gold') K.star(ctx, it.x + 14, it.y - 14, 6 + Math.sin(t * 10) * 1.5, '#FFFFFF');
        }
      }
      fx.draw(ctx);
      if (hurt > 0) { ctx.fillStyle = `rgba(255,127,175,${hurt * 0.5})`; ctx.fillRect(0, 0, W, H); }
      if (state === 'ready') {
        K.title(ctx, 'Carrot Catch', 'Tap to start', options.getBest());
        K.text(ctx, 'Catch carrots, dodge rocks!', W / 2, 240, 18);
      } else {
        K.text(ctx, String(score), W / 2, 36, 40);
        K.hearts(ctx, lives, LIVES);
      }
    }

    reset();
    const engine = K.run(canvas, {
      update, draw,
      down(x) {
        if (state === 'over') return;
        if (state === 'ready') state = 'play';
        target = x;
      },
      move(x) { if (state !== 'over') target = x; },
      keydown(e) {
        if (state === 'over') return;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keyDir = -1;
        else if (e.code === 'ArrowRight' || e.code === 'KeyD') keyDir = 1;
        else if (e.code === 'Space' && state === 'ready') { e.preventDefault(); state = 'play'; }
        else return;
        if (state === 'ready') state = 'play';
      },
      keyup(e) {
        if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && keyDir < 0) keyDir = 0;
        if ((e.code === 'ArrowRight' || e.code === 'KeyD') && keyDir > 0) keyDir = 0;
      }
    });
    return { restart: reset, stop: engine.stop };
  }

  return { start };
})();
