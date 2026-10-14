// Bubble Pop: tap the bubbles before they float away.
// Coin bubbles are worth 3. Grumpy purple bubbles cost a heart if you pop them,
// and so does every normal bubble that escapes off the top.
window.BW = window.BW || {};
BW.games = BW.games || {};

BW.games.bubble = (() => {
  const K = BW.kit, W = K.W, H = K.H, INK = K.INK, TAU = K.TAU;
  const LIVES = 3;
  const COLORS = ['#BFE3FF', '#FFD1E3', '#E3CCF2', '#C9F0E1', '#FFF0B8'];

  function start(canvas, options) {
    let state, bubbles, spawnIn, score, lives, shake, t = 0;
    const fx = K.sparkles();

    function reset() {
      state = 'ready';
      bubbles = [];
      spawnIn = 0.3;
      score = 0;
      lives = LIVES;
      shake = 0;
      fx.clear();
    }

    function spawn() {
      const r = 22 + Math.random() * 14;
      const roll = Math.random();
      const grumpChance = 0.12 + Math.min(score * 0.002, 0.12);
      const type = roll < grumpChance ? 'grump' : roll > 0.92 ? 'gold' : 'plain';
      const speed = Math.min(70 + score * 1.6, 220) * (0.8 + Math.random() * 0.4);
      bubbles.push({
        type, r,
        baseX: r + 12 + Math.random() * (W - 2 * r - 24),
        x: 0, y: H + r, vy: -speed,
        phase: Math.random() * TAU,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      });
    }

    function ouch(x, y) {
      lives--;
      shake = 0.35;
      fx.add(x, y, '#7F77DD', 12);
    }

    function pop(x, y) {
      if (state === 'over') return;
      if (state === 'ready') { state = 'play'; return; }
      // newest bubbles are drawn on top, so check them first
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        if ((x - b.x) ** 2 + (y - b.y) ** 2 > (b.r + 8) ** 2) continue;
        bubbles.splice(i, 1);
        if (b.type === 'grump') { ouch(b.x, b.y); }
        else {
          const pts = b.type === 'gold' ? 3 : 1;
          score += pts;
          fx.add(b.x, b.y, b.type === 'gold' ? '#F7C548' : b.color, 12, 200);
          fx.add(b.x, b.y, '#FFFFFF', 6, 120);
          fx.label(b.x, b.y - b.r, '+' + pts);
        }
        break;
      }
      if (lives <= 0) { state = 'over'; options.onGameOver(score); }
    }

    function update(dt) {
      t += dt;
      fx.update(dt);
      shake = Math.max(0, shake - dt);
      if (state !== 'play') {
        // a few slow bubbles drift past on the start screen
        if (state === 'ready' && bubbles.length < 5 && Math.random() < dt) spawn();
        bubbles.forEach(b => { b.y += b.vy * 0.4 * dt; b.x = b.baseX + Math.sin(t * 2 + b.phase) * 10; });
        bubbles = bubbles.filter(b => b.y > -b.r);
        return;
      }
      spawnIn -= dt;
      if (spawnIn <= 0) {
        spawn();
        spawnIn = Math.max(0.3, 0.95 - score * 0.01) * (0.7 + Math.random() * 0.6);
      }
      for (const b of bubbles) {
        b.y += b.vy * dt;
        b.x = b.baseX + Math.sin(t * 2 + b.phase) * 10;
        if (b.y < -b.r) {
          b.gone = true;
          if (b.type === 'plain') ouch(b.x, 8);
        }
      }
      bubbles = bubbles.filter(b => !b.gone);
      if (lives <= 0) { state = 'over'; options.onGameOver(score); }
    }

    function drawBubble(ctx, b) {
      ctx.save();
      ctx.translate(b.x, b.y);
      const squish = 1 + Math.sin(t * 5 + b.phase) * 0.04;
      ctx.scale(squish, 2 - squish);
      ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU);
      ctx.fillStyle = b.type === 'grump' ? 'rgba(127,119,221,.85)' : b.type === 'gold' ? 'rgba(255,240,184,.75)' : b.color + 'B0';
      ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, b.r * 0.7, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(b.r * 0.45, -b.r * 0.5, 2.5, 0, TAU); ctx.fill();
      if (b.type === 'gold') K.coin(ctx, 0, 2, b.r * 0.45);
      if (b.type === 'grump') {
        ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(-10, -8); ctx.lineTo(-3, -5); ctx.moveTo(10, -8); ctx.lineTo(3, -5); ctx.stroke();
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-6, -1, 2.2, 0, TAU); ctx.arc(6, -1, 2.2, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-5, 9); ctx.quadraticCurveTo(0, 5, 5, 9); ctx.stroke();
      }
      ctx.restore();
    }

    function draw(ctx) {
      ctx.save();
      if (shake > 0) ctx.translate(Math.sin(t * 60) * shake * 12, 0);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#FFE3EE'); g.addColorStop(1, '#E9E1FA');
      ctx.fillStyle = g; ctx.fillRect(-20, 0, W + 40, H);
      // fluffy cloud with your friend sitting on it
      ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = 'rgba(59,47,74,.15)'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(40, 628, 40, 0, TAU); ctx.arc(100, 616, 46, 0, TAU); ctx.arc(170, 630, 38, 0, TAU);
      ctx.arc(250, 624, 44, 0, TAU); ctx.arc(320, 630, 42, 0, TAU);
      ctx.fill();
      ctx.save(); ctx.translate(96, 562 + Math.sin(t * 3) * 3); ctx.scale(1.3, 1.3);
      BW.characters.draw(ctx, options.character, { flap: Math.sin(t * 6) * 0.15, dead: shake > 0 });
      ctx.restore();
      bubbles.forEach(b => drawBubble(ctx, b));
      fx.draw(ctx);
      ctx.restore();
      if (state === 'ready') {
        K.title(ctx, 'Bubble Pop', 'Tap to start', options.getBest());
        K.text(ctx, 'Pop them all, but not the grumpy ones!', W / 2, 240, 17);
      } else {
        K.text(ctx, String(score), W / 2, 36, 40);
        K.hearts(ctx, lives, LIVES);
      }
    }

    reset();
    const engine = K.run(canvas, {
      update, draw,
      down: pop,
      keydown(e) {
        if (state === 'ready' && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); state = 'play'; }
      }
    });
    return { restart: reset, stop: engine.stop };
  }

  return { start };
})();
