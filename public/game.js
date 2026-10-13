(() => {
  const W = 360, H = 640, GROUND = 588;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const overEl = document.getElementById('over');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const badgeEl = document.getElementById('badge');

  let best = 0;
  try { best = Number(localStorage.getItem('flappy-bunny-best')) || 0; } catch (e) {}

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  }
  window.addEventListener('resize', resize);

  const PILLAR_W = 66, SPACING = 215;
  let state, bunny, pillars, score, groundX, clouds, t, flash;

  function reset() {
    state = 'ready';
    bunny = { x: 110, y: 300, vy: 0, r: 13 };
    pillars = [];
    score = 0;
    groundX = 0;
    flash = 0;
    clouds = clouds || Array.from({ length: 5 }, (_, i) => ({ x: i * 90 + Math.random() * 40, y: 60 + Math.random() * 220, s: 0.6 + Math.random() * 0.6 }));
    overEl.hidden = true;
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
    if (score > best) { best = score; try { localStorage.setItem('flappy-bunny-best', String(best)); } catch (e) {} }
    scoreEl.textContent = score;
    bestEl.textContent = best;
    badgeEl.textContent = score >= 30 ? 'Golden carrot!' : score >= 15 ? 'Silver carrot!' : score >= 5 ? 'Bronze carrot!' : score > 0 && score === best ? 'New best!' : '';
    setTimeout(() => { overEl.hidden = false; document.getElementById('again').focus(); }, 450);
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

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, '#9FC9F2'); g.addColorStop(0.65, '#CFE3F6'); g.addColorStop(1, '#FBE3D2');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 16 * c.s, 0, 7); ctx.arc(c.x + 18 * c.s, c.y - 8 * c.s, 20 * c.s, 0, 7); ctx.arc(c.x + 40 * c.s, c.y, 15 * c.s, 0, 7);
      ctx.fill();
    });
    ctx.fillStyle = '#B9DDB0';
    ctx.beginPath(); ctx.moveTo(0, GROUND);
    for (let x = 0; x <= W; x += 30) ctx.quadraticCurveTo(x + 15, GROUND - 46 - 14 * Math.sin(x * 0.03), x + 30, GROUND - 30);
    ctx.lineTo(W, GROUND); ctx.fill();
  }

  function drawPillar(p) {
    const x = p.x, w = PILLAR_W;
    const stroke = '#7A3E0C';
    ctx.lineWidth = 3; ctx.strokeStyle = stroke;
    // top carrot, tip pointing down into the gap
    ctx.fillStyle = '#F28C28';
    roundRect(x, -30, w, p.top + 30, 18); ctx.fill(); ctx.stroke();
    // bottom carrot, leafy crown at the gap
    roundRect(x, p.top + p.g, w, GROUND - p.top - p.g + 30, 18); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(122,62,12,.45)'; ctx.lineWidth = 2;
    for (let y = p.top - 28; y > 0; y -= 34) { ctx.beginPath(); ctx.moveTo(x + 10, y); ctx.lineTo(x + 26, y + 4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + w - 10, y - 14); ctx.lineTo(x + w - 24, y - 10); ctx.stroke(); }
    for (let y = p.top + p.g + 30; y < GROUND; y += 34) { ctx.beginPath(); ctx.moveTo(x + 10, y); ctx.lineTo(x + 26, y - 4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + w - 10, y + 14); ctx.lineTo(x + w - 24, y + 10); ctx.stroke(); }
    ctx.fillStyle = '#4FA35A'; ctx.strokeStyle = '#2E6B37'; ctx.lineWidth = 2.5;
    const by = p.top + p.g;
    [[-14, -16], [0, -22], [14, -16]].forEach(([dx, dy]) => {
      ctx.beginPath(); ctx.ellipse(x + w / 2 + dx, by + dy / 2 + 2, 6, 12, dx * 0.04, 0, 7); ctx.fill(); ctx.stroke();
    });
    ctx.fillStyle = 'rgba(255,255,255,.28)';
    ctx.fillRect(x + 8, -30, 8, p.top + 14);
    ctx.fillRect(x + 8, by + 14, 8, GROUND - by - 14);
  }

  function drawGround() {
    ctx.fillStyle = '#7CC36B'; ctx.fillRect(0, GROUND, W, 14);
    ctx.fillStyle = '#C98F5A'; ctx.fillRect(0, GROUND + 14, W, H - GROUND - 14);
    ctx.fillStyle = '#5FA94F';
    for (let x = groundX; x < W + 24; x += 24) { ctx.beginPath(); ctx.moveTo(x, GROUND + 14); ctx.lineTo(x + 12, GROUND + 4); ctx.lineTo(x + 24, GROUND + 14); ctx.fill(); }
    ctx.fillStyle = 'rgba(122,62,12,.25)';
    for (let x = groundX * 1.5; x < W; x += 36) ctx.fillRect(x + 6, GROUND + 28, 10, 4);
  }

  function drawBunny() {
    const tilt = state === 'ready' ? 0 : Math.max(-0.45, Math.min(bunny.vy / 700, 1.2));
    ctx.save(); ctx.translate(bunny.x, bunny.y); ctx.rotate(tilt);
    const ink = '#3B2F4A';
    ctx.lineWidth = 2.5; ctx.strokeStyle = ink;
    const flap = state === 'play' && bunny.vy < 0 ? -0.35 : 0;
    // ears
    [[-6, -0.35 + flap], [5, -0.05 + flap]].forEach(([ex, a]) => {
      ctx.save(); ctx.translate(ex, -10); ctx.rotate(a - 0.25);
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(0, -14, 5.5, 14, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FFC2D6'; ctx.beginPath(); ctx.ellipse(0, -14, 2.5, 9, 0, 0, 7); ctx.fill();
      ctx.restore();
    });
    // tail
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(-15, 4, 5, 0, 7); ctx.fill(); ctx.stroke();
    // body
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.fill(); ctx.stroke();
    // bow
    ctx.save(); ctx.translate(-4, -15); ctx.rotate(-0.3);
    ctx.fillStyle = '#FF7FAF'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -6); ctx.lineTo(-10, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, -6); ctx.lineTo(10, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, 7); ctx.fill(); ctx.stroke();
    ctx.restore();
    // face
    const dead = state === 'over';
    ctx.fillStyle = ink; ctx.strokeStyle = ink; ctx.lineWidth = 2;
    if (dead) { ctx.beginPath(); ctx.moveTo(4, -5); ctx.lineTo(10, 1); ctx.moveTo(10, -5); ctx.lineTo(4, 1); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(8, -2, 2.6, 0, 7); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(8.8, -2.8, 0.9, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#FFB3CB'; ctx.beginPath(); ctx.ellipse(7, 5, 3.5, 2.2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#FF7FAF'; ctx.beginPath(); ctx.arc(15, 2, 2, 0, 7); ctx.fill();
    ctx.restore();
  }

  function text(str, x, y, size, align) {
    ctx.font = `800 ${size}px 'Baloo 2', 'Trebuchet MS', sans-serif`;
    ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = size / 6; ctx.strokeStyle = '#3B2F4A'; ctx.strokeText(str, x, y);
    ctx.fillStyle = '#FFF8F1'; ctx.fillText(str, x, y);
  }

  function draw() {
    drawSky();
    pillars.forEach(drawPillar);
    drawGround();
    drawBunny();
    if (state === 'ready') {
      text('Flappy Bunny', W / 2, 150, 46);
      text('Tap to hop', W / 2, 400, 26);
      text('Best ' + best, W / 2, 440, 20);
    } else if (state === 'play') {
      text(String(score), W / 2, 70, 56);
    }
    if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.7})`; ctx.fillRect(0, 0, W, H); }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    update(dt); draw();
    requestAnimationFrame(frame);
  }

  canvas.addEventListener('pointerdown', e => { e.preventDefault(); hop(); });
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      if (state === 'over' && !overEl.hidden) { reset(); return; }
      hop();
    }
  });
  document.getElementById('again').addEventListener('click', reset);

  t = 0;
  reset();
  resize();
  requestAnimationFrame(frame);
})();
