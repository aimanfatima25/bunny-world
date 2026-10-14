// My Aquarium: every fish made in the Fish Maker swims here with its name.
// Tap a fish to make it do a happy flip.
// scene() is the underwater background, also used by Fishy Merge.
window.BW = window.BW || {};

BW.aquarium = (() => {
  const K = BW.kit, W = K.W, H = K.H, INK = K.INK, TAU = K.TAU;
  const SAND = 560;

  // Underwater background: sunlight, bubbles, seaweed, sand, starfish and a shell
  function scene() {
    const bubbles = Array.from({ length: 14 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 2 + Math.random() * 5, s: 15 + Math.random() * 30 }));
    let t = 0;
    return {
      update(dt) {
        t += dt;
        bubbles.forEach(b => { b.y -= b.s * dt; if (b.y < -10) { b.y = SAND; b.x = Math.random() * W; } });
      },
      draw(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#CBEFF6'); g.addColorStop(0.55, '#7CCFD9'); g.addColorStop(1, '#3F9FB3');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,.12)';
        [[40, 50], [150, 40], [260, 60]].forEach(([x, w], i) => {
          const sway = Math.sin(t * 0.5 + i) * 15;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w + 60 + sway, SAND); ctx.lineTo(x + 20 + sway, SAND); ctx.fill();
        });
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5;
        bubbles.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.stroke(); });
        ctx.strokeStyle = '#4FA35A'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        [[24, 0, 90], [44, 1.3, 60], [300, 2.4, 110], [322, 3.1, 70], [190, 4, 50]].forEach(([x, p, h]) => {
          ctx.beginPath(); ctx.moveTo(x, SAND + 6);
          ctx.quadraticCurveTo(x + Math.sin(t * 1.4 + p) * 14, SAND - h / 2, x + Math.sin(t * 1.4 + p + 1) * 8, SAND - h);
          ctx.stroke();
        });
        ctx.fillStyle = '#F3DDB3';
        ctx.beginPath(); ctx.moveTo(0, SAND);
        for (let x = 0; x <= W; x += 45) ctx.quadraticCurveTo(x + 22, SAND - 10, x + 45, SAND);
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
        K.star(ctx, 110, SAND + 34, 13, '#F28C28');
        ctx.fillStyle = '#FFC2D6'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(250, SAND + 40, 11, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(250, SAND + 40); ctx.lineTo(244, SAND + 31); ctx.moveTo(250, SAND + 40); ctx.lineTo(250, SAND + 29); ctx.moveTo(250, SAND + 40); ctx.lineTo(256, SAND + 31); ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(312, SAND + 52, 4, 0, TAU); ctx.arc(60, SAND + 58, 3, 0, TAU); ctx.fill();
      }
    };
  }

  function start(canvas) {
    const list = BW.store.data.myFish || [];
    const size = list.length > 12 ? 20 : list.length > 6 ? 24 : 30;
    const fish = list.map((design, i) => ({
      design,
      x: 40 + Math.random() * (W - 80),
      y: 150 + (i * 97) % (SAND - 200) + Math.random() * 20,
      speed: 20 + Math.random() * 25,
      dir: Math.random() < 0.5 ? 1 : -1,
      phase: Math.random() * TAU,
      flip: 0
    }));
    const bg = scene();
    const fx = K.sparkles();
    let t = 0;

    function update(dt) {
      t += dt;
      fx.update(dt);
      bg.update(dt);
      fish.forEach(f => {
        f.x += f.dir * f.speed * dt * (f.flip > 0 ? 2.5 : 1);
        if (f.x > W - 30) f.dir = -1;
        if (f.x < 30) f.dir = 1;
        f.flip = Math.max(0, f.flip - dt * 1.6);
      });
    }

    function draw(ctx) {
      bg.draw(ctx);
      ctx.textAlign = 'center';
      fish.forEach(f => {
        const y = f.y + Math.sin(t * 1.6 + f.phase) * 10;
        ctx.save();
        ctx.translate(f.x, y);
        ctx.scale(f.dir, 1);
        if (f.flip > 0) ctx.rotate(-(1 - f.flip) * TAU);
        BW.fishMaker.draw(ctx, f.design, size, t + f.phase);
        ctx.restore();
        ctx.font = "800 13px 'Baloo 2', 'Trebuchet MS', sans-serif";
        ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(59,47,74,.75)';
        ctx.strokeText(f.design.name, f.x, y + size + 14);
        ctx.fillStyle = '#FFF8F1'; ctx.fillText(f.design.name, f.x, y + size + 14);
      });
      fx.draw(ctx);
      K.text(ctx, 'My Aquarium', W / 2, 36, 30);
      if (!fish.length) {
        K.text(ctx, 'No fish yet!', W / 2, 250, 30);
        K.text(ctx, 'Make a jellyfish in Fishy Merge', W / 2, 300, 18);
        K.text(ctx, 'to win the Fish Maker gift', W / 2, 326, 18);
      } else {
        K.text(ctx, fish.length + (fish.length === 1 ? ' fish' : ' fish friends'), W / 2, 72, 16);
      }
    }

    function tap(x, y) {
      let best = null, bestD = 40 * 40;
      fish.forEach(f => {
        const fy = f.y + Math.sin(t * 1.6 + f.phase) * 10;
        const d = (f.x - x) ** 2 + (fy - y) ** 2;
        if (d < bestD) { bestD = d; best = f; }
      });
      if (!best) return;
      best.flip = 1;
      fx.add(best.x, best.y, '#FF7FAF', 10, 140);
      fx.add(best.x, best.y, '#FFFFFF', 6, 100);
    }

    return K.run(canvas, { update, draw, down: tap });
  }

  return { start, scene };
})();
