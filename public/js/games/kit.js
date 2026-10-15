// Shared toolkit for the mini-games: game loop, touch/mouse/keyboard input,
// sharp canvas sizing, and little drawing helpers (outlined text, hearts, sparkles).
// Every game draws in a 360 x 640 world, whatever the real screen size is.
window.BW = window.BW || {};

BW.kit = (() => {
  const W = 360, H = 640;
  const INK = '#3B2F4A', CREAM = '#FFF8F1';
  const TAU = Math.PI * 2;

  // Runs a game on a canvas. handlers: update(dt), draw(ctx), and optional
  // down(x, y), move(x, y), up(x, y), keydown(e), keyup(e).
  // Returns { stop } which removes every listener.
  // While BW.kit.paused is true the game is frozen: no moving, no taps, just the last picture.
  function run(canvas, handlers) {
    const ctx = canvas.getContext('2d');
    let raf = 0, last = performance.now();

    function resize() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    }
    function pos(e) {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
    }
    function down(e) {
      e.preventDefault();
      if (api.paused) return;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      const p = pos(e);
      if (handlers.down) handlers.down(p.x, p.y);
    }
    function move(e) { if (api.paused) return; const p = pos(e); if (handlers.move) handlers.move(p.x, p.y); }
    function up(e) { if (api.paused) return; const p = pos(e); if (handlers.up) handlers.up(p.x, p.y); }
    function keydown(e) { if (!api.paused && handlers.keydown) handlers.keydown(e); }
    function keyup(e) { if (!api.paused && handlers.keyup) handlers.keyup(e); }
    function frame(now) {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (!api.paused) handlers.update(dt);
      handlers.draw(ctx);
      raf = requestAnimationFrame(frame);
    }

    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('resize', resize);
    resize();
    raf = requestAnimationFrame(frame);

    return {
      stop() {
        cancelAnimationFrame(raf);
        canvas.removeEventListener('pointerdown', down);
        canvas.removeEventListener('pointermove', move);
        canvas.removeEventListener('pointerup', up);
        canvas.removeEventListener('pointercancel', up);
        window.removeEventListener('keydown', keydown);
        window.removeEventListener('keyup', keyup);
        window.removeEventListener('resize', resize);
      }
    };
  }

  // Cream text with a thick dark outline, like the Flappy Bunny score
  function text(ctx, str, x, y, size, align) {
    ctx.font = `800 ${size}px 'Baloo 2', 'Trebuchet MS', sans-serif`;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size / 6;
    ctx.strokeStyle = INK;
    ctx.strokeText(str, x, y);
    ctx.fillStyle = CREAM;
    ctx.fillText(str, x, y);
  }

  // The "tap to start" screen every game shows first
  function title(ctx, name, line, best) {
    text(ctx, name, W / 2, 190, 44);
    text(ctx, line, W / 2, 400, 24);
    text(ctx, 'Best ' + best, W / 2, 440, 20);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function heart(ctx, x, y, size, full) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(size / 20, size / 20);
    ctx.beginPath();
    ctx.moveTo(0, 8); ctx.bezierCurveTo(-15, -2, -9, -14, 0, -6); ctx.bezierCurveTo(9, -14, 15, -2, 0, 8); ctx.closePath();
    ctx.fillStyle = full ? '#FF7FAF' : 'rgba(255,255,255,.55)'; ctx.fill();
    ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }

  // Lives in the top-right corner
  function hearts(ctx, lives, max) {
    for (let i = 0; i < max; i++) heart(ctx, W - 30 - (max - 1 - i) * 30, 36, 24, i < lives);
  }

  function carrot(ctx, x, y, size, rot, color) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(size / 20, size / 20);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = '#4FA35A'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-2, -10); ctx.lineTo(-6, -18); ctx.moveTo(0, -10); ctx.lineTo(0, -20); ctx.moveTo(2, -10); ctx.lineTo(6, -18); ctx.stroke();
    ctx.fillStyle = color || '#F28C28'; ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-7, -10); ctx.quadraticCurveTo(0, -13, 7, -10); ctx.lineTo(0, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(122,62,12,.45)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(0, -3); ctx.moveTo(1, 3); ctx.lineTo(4, 2); ctx.stroke();
    ctx.restore();
  }

  function coin(ctx, x, y, r) {
    ctx.fillStyle = '#F7C548'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#B88A12'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(x, y, r * 0.48, 0, TAU); ctx.stroke();
  }

  function star(ctx, x, y, r, color) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.48 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = color || '#F7C548'; ctx.fill();
    ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.stroke();
  }

  // Little bursts of dots and floating "+1" labels
  function sparkles() {
    let list = [];
    return {
      add(x, y, color, n, speed) {
        n = n || 8; speed = speed || 160;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * TAU, s = speed * (0.5 + Math.random() * 0.7);
          list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.55, color, r: 2 + Math.random() * 3 });
        }
      },
      label(x, y, str) { list.push({ x, y, vx: 0, vy: -60, life: 0.9, str }); },
      update(dt) {
        list.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; if (!p.str) p.vy += 300 * dt; p.life -= dt; });
        list = list.filter(p => p.life > 0);
      },
      draw(ctx) {
        list.forEach(p => {
          ctx.globalAlpha = Math.min(1, p.life * 2);
          if (p.str) text(ctx, p.str, p.x, p.y, 22);
          else { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); }
        });
        ctx.globalAlpha = 1;
      },
      clear() { list = []; }
    };
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // the toolkit itself; app.js sets BW.kit.paused when the pause card is open
  const api = { paused: false };

  return Object.assign(api, { W, H, INK, CREAM, TAU, run, text, title, roundRect, heart, hearts, carrot, coin, star, sparkles, shuffle });
})();
