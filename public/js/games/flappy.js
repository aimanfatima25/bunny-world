// Flappy Bunny: hop through the carrot pillars.
// Every game has the same shape: start(canvas, options) returns { restart, stop }.
//   options.character   which friend to draw
//   options.getBest()   best score so far (shown on the start screen)
//   options.onGameOver(score)   called once when the player bonks
window.BW = window.BW || {};
BW.games = BW.games || {};

BW.games.flappy = (() => {
  const W = 360, H = 640, GROUND = 588, TAU = Math.PI * 2;
  const PILLAR_W = 66, SPACING = 215;

  function start(canvas, options) {
    const ctx = canvas.getContext('2d');
    let state, bunny, pillars, score, groundX, clouds, flash;
    let t = 0, raf = 0, last = performance.now();

    function resize() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    }

    function reset() {
      state = 'ready';
      bunny = { x: 110, y: 300, vy: 0, r: 13 };
      pillars = [];
      score = 0;
      groundX = 0;
      flash = 0;
      clouds = clouds || Array.from({ length: 5 }, (_, i) => ({ x: i * 90 + Math.random() * 40, y: 60 + Math.random() * 220, s: 0.6 + Math.random() * 0.6 }));
    }

    function speed() { return Math.min(150 + score * 4, 230); }
    function gapSize() { return Math.max(165 - score * 1.5, 128); }

    function addPillar(x) {
      const g = gapSize();
      const top = 90 + Math.random() * (GROUND - 90 - g - 70);
      pillars.push({ x, top, g, passed: false });
    }

    function hop() {
      if (state === 'over') return;
      if (state === 'ready') { state = 'play'; addPillar(W + 40); }
      bunny.vy = -420;
    }

    function end() {
      state = 'over';
      flash = 1;
      options.onGameOver(score);
    }

    function update(dt) {
      t += dt;
      clouds.forEach(c => { c.x -= 12 * c.s * dt; if (c.x < -80) { c.x = W + 40; c.y = 60 + Math.random() * 220; } });
      if (state === 'ready') { bunny.y = 300 + Math.sin(t * 4) * 8; groundX = (groundX - 90 * dt) % 24; return; }
      if (state === 'over') {
        if (bunny.y < GROUND - bunny.r) { bunny.vy += 1500 * dt; bunny.y = Math.min(bunny.y + bunny.vy * dt, GROUND - bunny.r); }
        flash = Math.max(0, flash - dt * 3);
        return;
      }
      const v = speed();
      bunny.vy = Math.min(bunny.vy + 1450 * dt, 620);
      bunny.y += bunny.vy * dt;
      groundX = (groundX - v * dt) % 24;
      far += v * 0.25 * dt;
      pillars.forEach(p => {
        p.x -= v * dt;
        if (!p.passed && p.x + PILLAR_W < bunny.x) { p.passed = true; score++; }
      });
      if (pillars.length && pillars[pillars.length - 1].x < W - SPACING) addPillar(W + 10);
      pillars = pillars.filter(p => p.x > -PILLAR_W - 20);

      if (bunny.y + bunny.r >= GROUND || bunny.y - bunny.r < -40) return end();
      for (const p of pillars) {
        const cx = Math.max(p.x, Math.min(bunny.x, p.x + PILLAR_W));
        for (const [y1, y2] of [[-100, p.top], [p.top + p.g, GROUND]]) {
          const cy = Math.max(y1, Math.min(bunny.y, y2));
          if ((bunny.x - cx) ** 2 + (bunny.y - cy) ** 2 < bunny.r ** 2) return end();
        }
      }
    }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }

    // ---------- the look from the Flappy Bunny card: soft sky, puffy clouds,
    // round trees, grassy dirt blocks, and the chosen animal flying with little wings ----------

    const OUTLINE = '#6E4A3A';
    let far = 0; // how far the background trees have drifted

    function puff(x, y, s) {
      ctx.beginPath();
      ctx.arc(x, y, 18 * s, 0, 7); ctx.arc(x + 20 * s, y - 10 * s, 22 * s, 0, 7);
      ctx.arc(x + 44 * s, y - 2 * s, 18 * s, 0, 7); ctx.arc(x + 24 * s, y + 6 * s, 18 * s, 0, 7);
      ctx.fill();
    }

    function tree(x, base, s) {
      ctx.fillStyle = '#A8835F';
      ctx.fillRect(x - 4 * s, base - 40 * s, 8 * s, 40 * s);
      ctx.fillStyle = '#9CC77A';
      [[0, -58, 24], [-20, -44, 18], [20, -46, 19]].forEach(([dx, dy, r]) => {
        ctx.beginPath(); ctx.arc(x + dx * s, base + dy * s, r * s, 0, TAU); ctx.fill();
      });
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.beginPath(); ctx.arc(x - 8 * s, base - 66 * s, 9 * s, 0, 7); ctx.fill();
    }

    function drawSky() {
      const g = ctx.createLinearGradient(0, 0, 0, GROUND);
      g.addColorStop(0, '#A9D3F2'); g.addColorStop(0.7, '#D9EEF9'); g.addColorStop(1, '#EEF7F0');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // clouds with a soft blue shadow underneath
      clouds.forEach(c => {
        ctx.fillStyle = 'rgba(170,200,230,.5)'; puff(c.x + 3, c.y + 5, c.s);
        ctx.fillStyle = '#FFFFFF'; puff(c.x, c.y, c.s);
      });
      // far hills and drifting trees
      ctx.fillStyle = '#CDE6BE';
      ctx.beginPath(); ctx.moveTo(0, GROUND);
      for (let x = 0; x <= W; x += 60) ctx.quadraticCurveTo(x + 30, GROUND - 70 - 20 * Math.sin(x * 0.02), x + 60, GROUND - 40);
      ctx.lineTo(W, GROUND); ctx.fill();
      for (let i = 0; i < 4; i++) {
        const x = ((i * 130 - far) % 520 + 520) % 520 - 60;
        tree(x, GROUND - 6, 1 + (i % 2) * 0.25);
      }
    }

    // a block of earth with a cushion of grass on the side that faces the gap
    function grassBlock(x, y, w, h, grassOnTop) {
      ctx.lineWidth = 2.5; ctx.strokeStyle = OUTLINE; ctx.lineJoin = 'round';
      ctx.fillStyle = '#B98A5E';
      roundRect(x, y, w, h, 8); ctx.fill(); ctx.stroke();
      // little stones and texture
      ctx.fillStyle = 'rgba(110,74,58,.25)';
      for (let yy = y + 26; yy < y + h - 10; yy += 30) {
        ctx.beginPath(); ctx.ellipse(x + 16, yy, 6, 4, 0, 0, 7); ctx.ellipse(x + w - 18, yy + 14, 5, 3.5, 0, 0, 7); ctx.fill();
      }
      const gy = grassOnTop ? y - 4 : y + h - 14;
      ctx.fillStyle = '#8EC25E';
      roundRect(x - 5, gy, w + 10, 18, 9); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#B5DA7E';
      roundRect(x - 1, gy + 3, w + 2, 6, 3); ctx.fill();
      // grass tufts
      ctx.strokeStyle = '#6FA448'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      const ty = grassOnTop ? gy : gy + 18, dir = grassOnTop ? -1 : 1;
      ctx.beginPath();
      for (let tx = x + 8; tx < x + w - 4; tx += 16) { ctx.moveTo(tx, ty); ctx.lineTo(tx - 3, ty + dir * 7); ctx.moveTo(tx, ty); ctx.lineTo(tx + 3, ty + dir * 8); }
      ctx.stroke();
    }

    function drawPillar(p) {
      grassBlock(p.x, -20, PILLAR_W, p.top + 20, false);
      grassBlock(p.x, p.top + p.g, PILLAR_W, GROUND - p.top - p.g + 20, true);
    }

    function drawGround() {
      ctx.fillStyle = '#B98A5E'; ctx.fillRect(0, GROUND + 10, W, H - GROUND);
      ctx.fillStyle = '#8EC25E'; ctx.fillRect(0, GROUND - 2, W, 16);
      ctx.fillStyle = '#B5DA7E'; ctx.fillRect(0, GROUND + 1, W, 4);
      ctx.strokeStyle = '#6FA448'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let x = groundX; x < W + 24; x += 24) { ctx.moveTo(x, GROUND - 2); ctx.lineTo(x - 3, GROUND - 9); ctx.moveTo(x + 6, GROUND - 2); ctx.lineTo(x + 9, GROUND - 10); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(110,74,58,.22)';
      for (let x = groundX * 1.5; x < W; x += 40) { ctx.beginPath(); ctx.ellipse(x + 10, GROUND + 30, 6, 4, 0, 0, 7); ctx.fill(); }
    }

    function wing(flapAngle) {
      ctx.save();
      ctx.rotate(flapAngle);
      ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#7FA6D8'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-10, -22, -34, -26, -40, -14);
      ctx.bezierCurveTo(-32, -12, -36, -4, -28, -2);
      ctx.bezierCurveTo(-24, 4, -12, 4, 0, 0);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#B9D3F2';
      ctx.beginPath(); ctx.moveTo(-6, -2); ctx.bezierCurveTo(-14, -10, -26, -14, -34, -12); ctx.bezierCurveTo(-26, -6, -16, -2, -6, -2); ctx.fill();
      ctx.restore();
    }

    // The flying bunny from the Flappy Bunny card: plump, pink-white, ears streaming back,
    // fluffy tail, and little wings on her back
    function flyingBunny(beat, dead) {
      const LINE = '#5B4650';
      ctx.lineWidth = 2; ctx.strokeStyle = LINE; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const fur = ctx.createRadialGradient(4, -10, 2, 0, 0, 26);
      fur.addColorStop(0, '#FFFFFF'); fur.addColorStop(1, '#FBDCE5');
      // far wing and far ear, behind everything
      ctx.save(); ctx.translate(-6, -11); wing(beat - 0.35); ctx.restore();
      ctx.save(); ctx.translate(9, -16); ctx.rotate(-1.2 + beat * 0.15);
      ctx.fillStyle = '#F6D3DD'; ctx.beginPath(); ctx.ellipse(0, -10, 5, 12, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
      // tail, feet, body
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(-20, -2, 6, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = fur;
      ctx.beginPath(); ctx.ellipse(-12, 12, 8, 4, 0.3, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0, 20, 14, -0.1, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(13, 10, 5, 3.5, -0.4, 0, TAU); ctx.fill(); ctx.stroke();
      // head
      ctx.beginPath(); ctx.arc(14, -8, 13, 0, TAU); ctx.fill(); ctx.stroke();
      // near ear streaming back
      ctx.save(); ctx.translate(12, -18); ctx.rotate(-0.95 + beat * 0.2);
      ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(0, -11, 5.5, 13, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#F7B8C8'; ctx.beginPath(); ctx.ellipse(0, -11, 2.4, 8.5, 0, 0, TAU); ctx.fill();
      ctx.restore();
      // face
      if (dead) {
        ctx.beginPath(); ctx.moveTo(17, -12); ctx.lineTo(22, -7); ctx.moveTo(22, -12); ctx.lineTo(17, -7); ctx.stroke();
      } else {
        ctx.fillStyle = '#3A2E36'; ctx.beginPath(); ctx.arc(19.5, -9.5, 2.5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(20.4, -10.4, 0.9, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,140,170,.55)'; ctx.beginPath(); ctx.ellipse(16, -3, 4, 2.4, 0, 0, TAU); ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(23, -5); ctx.quadraticCurveTo(24.5, -3.5, 26, -5); ctx.stroke();
      // near wing on her back, in front of the body
      ctx.save(); ctx.translate(-4, -9); ctx.scale(0.9, 0.9); wing(beat); ctx.restore();
    }

    function drawPlayer() {
      const tilt = state === 'ready' ? 0 : Math.max(-0.45, Math.min(bunny.vy / 700, 1.2));
      const flapping = state === 'play' && bunny.vy < 0;
      const beat = state === 'over' ? 0.4 : Math.sin(t * (flapping ? 30 : 10)) * 0.45;
      ctx.save(); ctx.translate(bunny.x, bunny.y); ctx.rotate(tilt);
      if (!(BW.friends && BW.friends.get(options.character))) {
        ctx.scale(1.3, 1.3);
        flyingBunny(beat, state === 'over');
      } else {
        // your animal's own picture, with the wings on their back
        const img = BW.friends.cutout(options.character);
        ctx.save(); ctx.translate(-14, -2); wing(beat - 0.3); ctx.restore();
        if (img.complete && img.naturalWidth) {
          // fit the picture in a 54 x 54 box, whatever its shape
          const k = 54 / Math.max(img.naturalWidth, img.naturalHeight);
          const w = img.naturalWidth * k, h = img.naturalHeight * k;
          if (state === 'over') ctx.filter = 'grayscale(.6)';
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.filter = 'none';
        }
        ctx.save(); ctx.translate(-12, 2); ctx.scale(0.85, 0.85); wing(beat); ctx.restore();
      }
      ctx.restore();
    }

    function text(str, x, y, size) {
      ctx.font = `800 ${size}px 'Baloo 2', 'Trebuchet MS', sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = size / 6; ctx.strokeStyle = OUTLINE; ctx.strokeText(str, x, y);
      ctx.fillStyle = '#FFF8F1'; ctx.fillText(str, x, y);
    }

    function draw() {
      drawSky();
      pillars.forEach(drawPillar);
      drawGround();
      drawPlayer();
      if (state === 'ready') {
        text('Flappy Bunny', W / 2, 150, 46);
        text('Tap to hop', W / 2, 400, 26);
        text('Best ' + options.getBest(), W / 2, 440, 20);
      } else if (state === 'play') {
        text(String(score), W / 2, 70, 56);
      }
      if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.7})`; ctx.fillRect(0, 0, W, H); }
    }

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (!BW.kit.paused) update(dt);
      draw();
      raf = requestAnimationFrame(frame);
    }

    function onPointer(e) { e.preventDefault(); if (!BW.kit.paused) hop(); }
    function onKey(e) {
      if (state === 'over' || BW.kit.paused) return;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); hop(); }
    }

    canvas.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', resize);
    reset();
    resize();
    raf = requestAnimationFrame(frame);

    return {
      restart: reset,
      stop() {
        cancelAnimationFrame(raf);
        canvas.removeEventListener('pointerdown', onPointer);
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', resize);
      }
    };
  }

  return { start };
})();
