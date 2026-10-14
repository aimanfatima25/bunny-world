// Memory Match: flip two cards at a time to find the pairs before time runs out.
// Clearing the whole board deals a new one and adds bonus seconds.
// Score = number of pairs found.
window.BW = window.BW || {};
BW.games = BW.games || {};

BW.games.memory = (() => {
  const K = BW.kit, W = K.W, H = K.H, INK = K.INK, TAU = K.TAU;
  const COLS = 4, CW = 74, CH = 84, GAP = 8;
  const X0 = (W - (COLS * CW + (COLS - 1) * GAP)) / 2, Y0 = 170;
  const START_TIME = 60, CLEAR_BONUS = 10, PEEK = 0.75;

  // The card fronts: 8 sweet little animal faces drawn in the soft style of the Memory card
  const LINE = '#8B5A5E';
  const FACES = ['bunny', 'kitty', 'bear', 'chick', 'panda', 'frog', 'piggy', 'fox'];
  function pickFaces() { return FACES.slice(); }

  function head(ctx, fill) {
    ctx.fillStyle = fill; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 4, 19, 16, 0, 0, TAU); ctx.fill(); ctx.stroke();
  }
  function ear(ctx, x, y, rx, ry, rot, fill, inner) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = fill; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill(); ctx.stroke();
    if (inner) { ctx.fillStyle = inner; ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.5, ry * 0.6, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function pointyEars(ctx, fill, tall) {
    ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.fillStyle = fill;
    [[-11, -1], [11, 1]].forEach(([x, d]) => {
      ctx.beginPath(); ctx.moveTo(x - 7 * d, -5); ctx.lineTo(x + 2 * d, -5 - tall); ctx.lineTo(x + 7 * d, -3); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
  }
  function eyes(ctx, y) {
    ctx.fillStyle = '#4A3438';
    ctx.beginPath(); ctx.arc(-7, y, 2.3, 0, TAU); ctx.arc(7, y, 2.3, 0, TAU); ctx.fill();
  }
  function blush(ctx, y) {
    ctx.fillStyle = 'rgba(255,140,165,.55)';
    ctx.beginPath(); ctx.ellipse(-12, y, 3.6, 2.2, 0, 0, TAU); ctx.ellipse(12, y, 3.6, 2.2, 0, 0, TAU); ctx.fill();
  }
  function smile(ctx) {
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-3, 8); ctx.quadraticCurveTo(-1.5, 10, 0, 8); ctx.quadraticCurveTo(1.5, 10, 3, 8); ctx.stroke();
  }

  const DRAW = {
    bunny(ctx) {
      ear(ctx, -7, -16, 5, 12, -0.15, '#FFFFFF', '#F7B8C8'); ear(ctx, 7, -16, 5, 12, 0.15, '#FFFFFF', '#F7B8C8');
      head(ctx, '#FFFFFF'); eyes(ctx, 3); blush(ctx, 9); smile(ctx);
    },
    kitty(ctx) {
      pointyEars(ctx, '#FFFFFF', 13);
      head(ctx, '#FFFFFF');
      ctx.fillStyle = '#F2C49B'; ctx.beginPath(); ctx.ellipse(-9, -4, 6, 5, 0.3, 0, TAU); ctx.fill();
      eyes(ctx, 3); blush(ctx, 9); smile(ctx);
    },
    bear(ctx) {
      ear(ctx, -13, -9, 6, 6, 0, '#D9A97E', '#F2D3B4'); ear(ctx, 13, -9, 6, 6, 0, '#D9A97E', '#F2D3B4');
      head(ctx, '#D9A97E');
      ctx.fillStyle = '#F2D3B4'; ctx.beginPath(); ctx.ellipse(0, 9, 7, 5, 0, 0, TAU); ctx.fill();
      eyes(ctx, 3); blush(ctx, 9); smile(ctx);
    },
    chick(ctx) {
      ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-1, -11); ctx.quadraticCurveTo(-4, -18, 1, -18); ctx.moveTo(1, -11); ctx.quadraticCurveTo(3, -19, 7, -15); ctx.stroke();
      head(ctx, '#FCE28C'); eyes(ctx, 3); blush(ctx, 9);
      ctx.fillStyle = '#F5A35B'; ctx.beginPath(); ctx.moveTo(-3, 7); ctx.lineTo(3, 7); ctx.lineTo(0, 11); ctx.closePath(); ctx.fill();
    },
    panda(ctx) {
      ear(ctx, -13, -9, 6, 6, 0, '#4A3438'); ear(ctx, 13, -9, 6, 6, 0, '#4A3438');
      head(ctx, '#FFFFFF');
      ctx.fillStyle = '#4A3438'; ctx.beginPath(); ctx.ellipse(-7, 3, 4.5, 5.5, -0.4, 0, TAU); ctx.ellipse(7, 3, 4.5, 5.5, 0.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(-7, 3, 1.4, 0, TAU); ctx.arc(7, 3, 1.4, 0, TAU); ctx.fill();
      blush(ctx, 10);
      ctx.fillStyle = '#4A3438'; ctx.beginPath(); ctx.ellipse(0, 8, 2, 1.4, 0, 0, TAU); ctx.fill();
    },
    frog(ctx) {
      ear(ctx, -9, -10, 6.5, 6.5, 0, '#A8D98A'); ear(ctx, 9, -10, 6.5, 6.5, 0, '#A8D98A');
      head(ctx, '#A8D98A');
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(-9, -10, 3.6, 0, TAU); ctx.arc(9, -10, 3.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#4A3438'; ctx.beginPath(); ctx.arc(-9, -10, 2, 0, TAU); ctx.arc(9, -10, 2, 0, TAU); ctx.fill();
      blush(ctx, 7);
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-6, 6); ctx.quadraticCurveTo(0, 11, 6, 6); ctx.stroke();
    },
    piggy(ctx) {
      pointyEars(ctx, '#F9C3CF', 10);
      head(ctx, '#F9C3CF');
      ctx.fillStyle = '#F5A3B6'; ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(0, 9, 6, 4.4, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = LINE; ctx.beginPath(); ctx.arc(-2, 9, 1, 0, TAU); ctx.arc(2, 9, 1, 0, TAU); ctx.fill();
      eyes(ctx, 2);
    },
    fox(ctx) {
      pointyEars(ctx, '#F4A86B', 15);
      head(ctx, '#F4A86B');
      ctx.fillStyle = '#FFF6EE'; ctx.beginPath(); ctx.ellipse(0, 11, 10, 7, 0, 0, TAU); ctx.fill();
      eyes(ctx, 3); blush(ctx, 9); smile(ctx);
    }
  };

  // The front of a card: cream with a little animal face
  function drawFace(ctx, face) {
    ctx.save();
    ctx.scale(1.15, 1.15);
    (DRAW[face] || DRAW.bunny)(ctx);
    ctx.restore();
  }

  // A faint bow on the back of each card, like the picture
  function bowMark(ctx) {
    ctx.strokeStyle = 'rgba(214,120,140,.6)'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.bezierCurveTo(-6, -12, -20, -10, -16, 0); ctx.bezierCurveTo(-20, 10, -6, 12, 0, 0);
    ctx.bezierCurveTo(6, -12, 20, -10, 16, 0); ctx.bezierCurveTo(20, 10, 6, 12, 0, 0);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.stroke();
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
      // cream frame with a soft shadow
      ctx.fillStyle = 'rgba(160,90,90,.18)';
      K.roundRect(ctx, -CW / 2 + 1, -CH / 2 + 4, CW, CH, 12); ctx.fill();
      ctx.fillStyle = '#FFF5EE';
      K.roundRect(ctx, -CW / 2, -CH / 2, CW, CH, 12); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = c.matched ? '#9CCB86' : '#E7C3BC'; ctx.stroke();
      // the pink (back) or cream (front) panel inside
      const g = ctx.createLinearGradient(0, -CH / 2, 0, CH / 2);
      if (front) { g.addColorStop(0, '#FFF8F3'); g.addColorStop(1, '#FCE9E1'); }
      else { g.addColorStop(0, '#F8B6C0'); g.addColorStop(1, '#F29CAB'); }
      ctx.fillStyle = g;
      K.roundRect(ctx, -CW / 2 + 6, -CH / 2 + 6, CW - 12, CH - 12, 8); ctx.fill();
      ctx.strokeStyle = front ? '#F1D5CC' : '#E58E9D'; ctx.lineWidth = 1.2; ctx.stroke();
      // little corner dots
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => {
        ctx.beginPath(); ctx.arc(dx * (CW / 2 - 11), dy * (CH / 2 - 11), 1.4, 0, TAU); ctx.fill();
      });
      if (front) drawFace(ctx, c.face); else bowMark(ctx);
      ctx.restore();
    }

    function draw(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#F9E3DA'); g.addColorStop(1, '#F4D2C8');
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
      ctx.fillStyle = timeLeft < 10 ? '#EE8A8A' : '#F5A7B3';
      if (timeLeft > 0) { K.roundRect(ctx, 30, 104, Math.max(18, (W - 60) * timeLeft / maxT), 18, 9); ctx.fill(); }
      ctx.lineWidth = 2; ctx.strokeStyle = '#D9A9A2';
      K.roundRect(ctx, 30, 104, W - 60, 18, 9); ctx.stroke();

      fx.draw(ctx);
      if (state === 'ready') {
        ctx.fillStyle = 'rgba(120,70,70,.25)'; ctx.fillRect(0, 0, W, H);
        K.title(ctx, 'Memory', 'Tap to start', options.getBest());
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
