// Memory Match: flip two cards at a time to find the pairs before time runs out.
// Clearing the whole board deals a new one and adds bonus seconds.
// Score = number of pairs found.
window.BW = window.BW || {};
BW.games = BW.games || {};

BW.games.memory = (() => {
  const K = BW.kit, W = K.W, H = K.H, INK = K.INK, TAU = K.TAU;
  const COLS = 4, CW = 72, CH = 92, GAP = 10;
  const X0 = (W - (COLS * CW + (COLS - 1) * GAP)) / 2, Y0 = 158;
  const START_TIME = 60, CLEAR_BONUS = 10, PEEK = 0.75;

  // Each board uses 8 random animal friends (Aiman's pictures from friends.js)
  function pickFaces() {
    const animals = BW.friends.list.filter(f => f.group !== 'girls').map(f => f.id);
    return K.shuffle(animals).slice(0, 8);
  }

  // The friend's picture fills the front of the card
  function drawFace(ctx, face) {
    const img = BW.friends.image(face);
    if (!img.complete || !img.naturalWidth) return;
    ctx.save();
    K.roundRect(ctx, -CW / 2 + 4, -CH / 2 + 4, CW - 8, CH - 8, 9);
    ctx.clip();
    const w = CW - 8, h = w * img.naturalHeight / img.naturalWidth;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function start(canvas, options) {
    let state, cards, open, timeLeft, score, peek, dealIn, board, t = 0;
    const fx = K.sparkles();

    function deal() {
      const chosen = pickFaces();
      const faces = K.shuffle(chosen.concat(chosen));
      cards = faces.map((face, i) => ({
        face,
        x: X0 + (i % COLS) * (CW + GAP),
        y: Y0 + Math.floor(i / COLS) * (CH + GAP),
        up: false, matched: false, flip: 0, pop: 0
      }));
      open = [];
    }

    function reset() {
      state = 'ready';
      score = 0;
      timeLeft = START_TIME;
      peek = 0;
      dealIn = 0;
      board = 1;
      fx.clear();
      deal();
    }

    function cardAt(x, y) {
      return cards.find(c => x >= c.x && x <= c.x + CW && y >= c.y && y <= c.y + CH);
    }

    function tap(x, y) {
      if (state === 'over') return;
      if (state === 'ready') { state = 'play'; return; }
      if (peek > 0 || dealIn > 0) return;
      const c = cardAt(x, y);
      if (!c || c.up || c.matched) return;
      c.up = true;
      open.push(c);
      if (open.length < 2) return;
      const [a, b] = open;
      if (a.face !== b.face) { peek = PEEK; return; }
      a.matched = b.matched = true;
      a.pop = b.pop = 1;
      open = [];
      score++;
      [a, b].forEach(c2 => fx.add(c2.x + CW / 2, c2.y + CH / 2, '#FF7FAF', 8));
      fx.label(b.x + CW / 2, b.y + 10, '+1');
      if (cards.every(c2 => c2.matched)) {
        timeLeft += CLEAR_BONUS;
        board++;
        dealIn = 0.9;
        fx.label(W / 2, 120, `+${CLEAR_BONUS}s`);
      }
    }

    function update(dt) {
      t += dt;
      fx.update(dt);
      for (const c of cards) {
        c.flip = Math.max(0, Math.min(1, c.flip + (c.up ? 1 : -1) * dt * 7));
        c.pop = Math.max(0, c.pop - dt * 3);
      }
      if (state !== 'play') return;
      if (peek > 0) {
        peek -= dt;
        if (peek <= 0) { open.forEach(c => { c.up = false; }); open = []; }
      }
      if (dealIn > 0) {
        dealIn -= dt;
        if (dealIn <= 0) deal();
      }
      timeLeft -= dt;
      if (timeLeft <= 0) { timeLeft = 0; state = 'over'; options.onGameOver(score); }
    }

    function drawCard(ctx, c) {
      // flip goes 0 → 1; the card squashes flat in the middle, then shows its face
      const squash = Math.abs(1 - c.flip * 2);
      const front = c.flip >= 0.5;
      const s = 1 + Math.sin(c.pop * Math.PI) * 0.1;
      ctx.save();
      ctx.translate(c.x + CW / 2, c.y + CH / 2);
      ctx.scale(Math.max(squash, 0.03) * s, s);
      K.roundRect(ctx, -CW / 2, -CH / 2, CW, CH, 12);
      ctx.fillStyle = front ? '#FFF8F1' : '#FF7FAF';
      ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = c.matched ? '#4FA35A' : INK; ctx.stroke();
      if (front) {
        drawFace(ctx, c.face);
      } else {
        ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,.8)';
        K.roundRect(ctx, -CW / 2 + 8, -CH / 2 + 8, CW - 16, CH - 16, 7); ctx.stroke();
        ctx.setLineDash([]);
        K.text(ctx, '?', 0, 2, 34);
      }
      ctx.restore();
    }

    function draw(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#E9DDF7'); g.addColorStop(1, '#FBEAF0');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      for (let i = 0; i < 14; i++) {
        const x = (i * 73) % W, y = 80 + ((i * 131) % 540);
        ctx.beginPath(); ctx.arc(x, y + Math.sin(t + i) * 4, 2.5, 0, TAU); ctx.fill();
      }
      cards.forEach(c => drawCard(ctx, c));

      // timer bar
      const maxT = Math.max(START_TIME, timeLeft);
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      K.roundRect(ctx, 30, 104, W - 60, 18, 9); ctx.fill();
      ctx.fillStyle = timeLeft < 10 ? '#E24B4A' : '#FF7FAF';
      if (timeLeft > 0) { K.roundRect(ctx, 30, 104, Math.max(18, (W - 60) * timeLeft / maxT), 18, 9); ctx.fill(); }
      ctx.lineWidth = 2.5; ctx.strokeStyle = INK;
      K.roundRect(ctx, 30, 104, W - 60, 18, 9); ctx.stroke();

      fx.draw(ctx);
      if (state === 'ready') {
        ctx.fillStyle = 'rgba(36,27,51,.35)'; ctx.fillRect(0, 0, W, H);
        K.title(ctx, 'Memory Match', 'Tap to start', options.getBest());
        K.text(ctx, `Find pairs before time runs out`, W / 2, 240, 18);
      } else {
        K.text(ctx, String(score), W / 2, 40, 40);
        K.text(ctx, Math.ceil(timeLeft) + 's', W - 40, 40, 22);
        K.text(ctx, 'Board ' + board, W / 2, 610, 18);
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
