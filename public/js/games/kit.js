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

  // ---------- playing together (duo.js) ----------

  // Their faces for the score box: the girls' card pictures, or the top of a guy's picture
  const faces = {};
  function face(id) {
    if (!faces[id]) { faces[id] = new Image(); faces[id].src = BW.friends ? BW.friends.img(BW.friends.get(id) ? id : 'girl-1') : ''; }
    return faces[id];
  }
  function roundFace(ctx, id, x, y, r, ring) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = '#FFF4F2'; ctx.fill();
    ctx.clip();
    const im = face(id);
    if (im.complete && im.naturalWidth) {
      const guy = id.startsWith('guy-'), sw = im.naturalWidth * (guy ? 0.42 : 0.62), sh = sw;
      ctx.drawImage(im, (im.naturalWidth - sw) / 2, im.naturalHeight * (guy ? 0.01 : 0.04), sw, sh, x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
    ctx.lineWidth = 2; ctx.strokeStyle = ring;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  }
  function pill(ctx, str, x, y, w, h, fill, color, size) {
    roundRect(ctx, x - w / 2, y - h / 2, w, h, h / 2);
    ctx.fillStyle = fill; ctx.fill();
    ctx.font = `800 ${size}px 'Baloo 2', 'Trebuchet MS', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
    ctx.fillText(str, x, y + 1);
  }

  // The cream score box at the top right (Aiman's design): ★ Level n ★, both faces,
  // "Me" in pink and the friend's name in blue, and both scores.
  //   duo: the session; mine / theirs: what to show; label: 'Level 2' etc.; x, y: top left
  function duoPanel(ctx, duo, mine, theirs, label, x, y) {
    x = x == null ? W - 146 : x; y = y == null ? 8 : y;
    const w = 138, h = 84;
    ctx.save();
    ctx.fillStyle = 'rgba(110, 74, 58, .18)'; roundRect(ctx, x + 2, y + 3, w, h, 12); ctx.fill();
    ctx.fillStyle = '#FFF6EF'; roundRect(ctx, x, y, w, h, 12); ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#E9B8BF'; roundRect(ctx, x, y, w, h, 12); ctx.stroke();
    ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.strokeStyle = '#F1CFD3';
    roundRect(ctx, x + 4, y + 4, w - 8, h - 8, 9); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = `800 12.5px 'Baloo 2', 'Trebuchet MS', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#5C3B2A';
    ctx.fillText(label || '', x + w / 2, y + 13);
    star(ctx, x + w / 2 - 38, y + 13, 5.5, '#F9D77E'); star(ctx, x + w / 2 + 38, y + 13, 5.5, '#F9D77E');
    const them = duo.other();
    [[duo.me, 'Me', '#F07A98', '#C9506F', mine], [duo.them, duo.them.name || duo.them.username, '#6FA3D9', '#3E6FA8', theirs]].forEach(([p, name, fill, ring, val], i) => {
      const cx = x + 36 + i * 66;
      roundFace(ctx, p.girl || 'girl-1', cx, y + 37, 13, ring);
      pill(ctx, String(name).slice(0, 8), cx, y + 56, 52, 13, fill, '#FFFFFF', 10);
      ctx.fillStyle = '#FFFFFF'; roundRect(ctx, cx - 22, y + 64, 44, 15, 7.5); ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = fill; roundRect(ctx, cx - 22, y + 64, 44, 15, 7.5); ctx.stroke();
      ctx.font = `800 12px 'Baloo 2', 'Trebuchet MS', sans-serif`; ctx.fillStyle = '#5C3B2A';
      ctx.fillText(String(val), cx, y + 72.5);
      if (i === 1 && (them.left || them.done)) {
        ctx.font = `800 8.5px 'Baloo 2', 'Trebuchet MS', sans-serif`; ctx.fillStyle = '#9B7B6A';
        ctx.fillText(them.left ? 'left' : 'done', cx + 20, y + 30);
      }
    });
    ctx.restore();
  }

  // 3, 2, 1, Go! before a game together; returns true while still counting down
  function countdown(ctx, duo, title) {
    const left = (duo.startAt - Date.now()) / 1000;
    if (left <= -0.6) return false;
    ctx.fillStyle = 'rgba(40, 30, 50, .35)'; ctx.fillRect(0, 0, W, H);
    text(ctx, title || '', W / 2, 170, 30);
    text(ctx, `you vs ${duo.them.name || duo.them.username}`, W / 2, 210, 20);
    text(ctx, left > 0 ? String(Math.ceil(left)) : 'Go!', W / 2, 320, 80);
    return left > 0;
  }

  // the big "Level 2" banner between rounds
  function levelBanner(ctx, n, sub) {
    ctx.fillStyle = 'rgba(255, 246, 239, .9)'; roundRect(ctx, 60, 250, W - 120, 96, 22); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#E9B8BF'; roundRect(ctx, 60, 250, W - 120, 96, 22); ctx.stroke();
    text(ctx, `Level ${n}`, W / 2, 288, 38);
    if (sub) text(ctx, sub, W / 2, 325, 16);
  }

  // a random number generator that gives the same numbers on both phones
  function seeded(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // the toolkit itself; app.js sets BW.kit.paused when the pause card is open
  const api = { paused: false };

  return Object.assign(api, { W, H, INK, CREAM, TAU, run, text, title, roundRect, heart, hearts, carrot, coin, star, sparkles, shuffle,
    duoPanel, countdown, levelBanner, seeded });
})();
