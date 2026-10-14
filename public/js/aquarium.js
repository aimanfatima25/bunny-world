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

  // My Aquarium, like its card picture: a glass tank on a wooden stand in a soft blue room
  // with leafy plants and pink coral. Inside swim the fish made in the Fish Maker (with their
  // names) and the sea friends you own. Tap a fish to make it do a happy flip.
  const TANK = { x: 16, y: 120, w: 328, h: 400, r: 26 };

  function start(canvas) {
    const made = (BW.store.data.myFish || []).map(design => ({ design }));
    const owned = BW.friends.list.filter(f => f.group === 'sea' && BW.store.owns(f.id)).map(f => ({ sea: f.id }));
    const all = made.concat(owned);
    const size = all.length > 12 ? 18 : all.length > 6 ? 22 : 26;
    const fish = all.map((f, i) => Object.assign(f, {
      x: TANK.x + 40 + Math.random() * (TANK.w - 80),
      y: TANK.y + 60 + (i * 83) % (TANK.h - 150),
      speed: 18 + Math.random() * 22,
      dir: Math.random() < 0.5 ? 1 : -1,
      phase: Math.random() * TAU,
      flip: 0
    }));
    const bubbles = Array.from({ length: 10 }, () => ({ x: TANK.x + 20 + Math.random() * (TANK.w - 40), y: TANK.y + Math.random() * TANK.h, r: 1.5 + Math.random() * 3.5, s: 12 + Math.random() * 22 }));
    const fx = K.sparkles();
    let t = 0;

    function update(dt) {
      t += dt;
      fx.update(dt);
      bubbles.forEach(b => { b.y -= b.s * dt; if (b.y < TANK.y + 20) { b.y = TANK.y + TANK.h - 40; b.x = TANK.x + 20 + Math.random() * (TANK.w - 40); } });
      fish.forEach(f => {
        f.x += f.dir * f.speed * dt * (f.flip > 0 ? 2.5 : 1);
        if (f.x > TANK.x + TANK.w - 34) f.dir = -1;
        if (f.x < TANK.x + 34) f.dir = 1;
        f.flip = Math.max(0, f.flip - dt * 1.6);
      });
    }

    const tankPath = ctx => K.roundRect(ctx, TANK.x, TANK.y, TANK.w, TANK.h, TANK.r);

    function leafyPlant(ctx, x, base, h, flip) {
      ctx.strokeStyle = '#6FA05A'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + flip * 10, base - h / 2, x + flip * 4, base - h); ctx.stroke();
      for (let i = 1; i <= 5; i++) {
        const yy = base - (h / 6) * i, side = i % 2 ? 1 : -1;
        ctx.save(); ctx.translate(x + flip * 6 * (i / 5), yy); ctx.rotate(side * 0.9 + Math.sin(t * 1.2 + i) * 0.06);
        ctx.fillStyle = i % 2 ? '#8FC27A' : '#7CB466';
        ctx.beginPath(); ctx.ellipse(0, -9, 6, 12, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(70,110,60,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
      }
    }

    function coral(ctx, x, base) {
      ctx.fillStyle = '#F6A9BC'; ctx.strokeStyle = '#D9839A'; ctx.lineWidth = 1.5;
      [[-12, -16], [0, -28], [12, -18], [-5, -22], [6, -24]].forEach(([dx, dy]) => {
        ctx.beginPath(); ctx.arc(x + dx, base + dy, 7, 0, TAU); ctx.fill(); ctx.stroke();
      });
      ctx.beginPath(); ctx.ellipse(x, base - 6, 18, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
    }

    function drawRoom(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#CFE7F4'); g.addColorStop(1, '#B4DAEE');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // plants and coral standing beside the tank
      leafyPlant(ctx, 8, 560, 170, 1);
      leafyPlant(ctx, 352, 560, 190, -1);
      coral(ctx, 22, 566); coral(ctx, 340, 566);
      // wooden stand
      ctx.fillStyle = '#B98A5E'; ctx.strokeStyle = '#7A5038'; ctx.lineWidth = 2.5;
      K.roundRect(ctx, 6, TANK.y + TANK.h - 6, W - 12, 26, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#A0714F'; ctx.fillRect(10, TANK.y + TANK.h + 16, W - 20, 70);
      ctx.strokeStyle = 'rgba(70,40,25,.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W / 2, TANK.y + TANK.h + 20); ctx.lineTo(W / 2, TANK.y + TANK.h + 86); ctx.stroke();
    }

    function drawWater(ctx) {
      ctx.save();
      tankPath(ctx); ctx.clip();
      const g = ctx.createLinearGradient(0, TANK.y, 0, TANK.y + TANK.h);
      g.addColorStop(0, '#CDEFFB'); g.addColorStop(0.12, '#A6DDF4'); g.addColorStop(1, '#79C3E6');
      ctx.fillStyle = g; ctx.fillRect(TANK.x, TANK.y, TANK.w, TANK.h);
      // the water line near the top
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.fillRect(TANK.x, TANK.y + 26, TANK.w, 4);
      // sand, pebbles and plants inside
      const floor = TANK.y + TANK.h - 34;
      ctx.fillStyle = '#F3E3C3';
      ctx.beginPath(); ctx.moveTo(TANK.x, floor);
      for (let x = TANK.x; x <= TANK.x + TANK.w; x += 41) ctx.quadraticCurveTo(x + 20, floor - 8, x + 41, floor);
      ctx.lineTo(TANK.x + TANK.w, TANK.y + TANK.h); ctx.lineTo(TANK.x, TANK.y + TANK.h); ctx.fill();
      [[70, '#C9B79C'], [120, '#E6C9A8'], [235, '#BFAFA0'], [290, '#D9B8A0']].forEach(([x, c]) => {
        ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(TANK.x + x, floor + 12, 9, 6, 0, 0, TAU); ctx.fill();
      });
      leafyPlant(ctx, TANK.x + 44, floor + 10, 120, 1);
      leafyPlant(ctx, TANK.x + 200, floor + 10, 90, -1);
      leafyPlant(ctx, TANK.x + 280, floor + 10, 140, -1);
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.4;
      bubbles.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.stroke(); });
      // the fish
      ctx.textAlign = 'center';
      fish.forEach(f => {
        const y = f.y + Math.sin(t * 1.6 + f.phase) * 9;
        ctx.save();
        ctx.translate(f.x, y);
        ctx.scale(f.dir, 1);
        if (f.flip > 0) ctx.rotate(-(1 - f.flip) * TAU);
        if (f.design) BW.fishMaker.draw(ctx, f.design, size, t + f.phase);
        else BW.sea.draw(ctx, f.sea, size, t + f.phase);
        ctx.restore();
        if (f.design) {
          ctx.font = "800 12px 'Baloo 2', 'Trebuchet MS', sans-serif";
          ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(70,60,80,.6)';
          ctx.strokeText(f.design.name, f.x, y + size + 12);
          ctx.fillStyle = '#FFFFFF'; ctx.fillText(f.design.name, f.x, y + size + 12);
        }
      });
      fx.draw(ctx);
      ctx.restore();
    }

    function drawGlass(ctx) {
      // glass edges, top rim and soft reflections
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4;
      tankPath(ctx); ctx.stroke();
      ctx.strokeStyle = 'rgba(110,170,200,.6)'; ctx.lineWidth = 1.5;
      K.roundRect(ctx, TANK.x + 3, TANK.y + 3, TANK.w - 6, TANK.h - 6, TANK.r - 3); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath(); ctx.ellipse(W / 2, TANK.y + 4, TANK.w / 2 - 14, 8, 0, 0, TAU); ctx.fill();
      ctx.save(); tankPath(ctx); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      ctx.beginPath(); ctx.moveTo(TANK.x + 26, TANK.y); ctx.lineTo(TANK.x + 60, TANK.y); ctx.lineTo(TANK.x + 20, TANK.y + TANK.h); ctx.lineTo(TANK.x - 14, TANK.y + TANK.h); ctx.fill();
      ctx.beginPath(); ctx.moveTo(TANK.x + 72, TANK.y); ctx.lineTo(TANK.x + 84, TANK.y); ctx.lineTo(TANK.x + 44, TANK.y + TANK.h); ctx.lineTo(TANK.x + 32, TANK.y + TANK.h); ctx.fill();
      ctx.restore();
    }

    function draw(ctx) {
      drawRoom(ctx);
      drawWater(ctx);
      drawGlass(ctx);
      K.text(ctx, 'My Aquarium', W / 2, 46, 30);
      if (!fish.length) {
        K.text(ctx, 'No fish yet!', W / 2, 280, 28);
        K.text(ctx, 'Unlock sea friends in the Shop,', W / 2, 322, 16);
        K.text(ctx, 'or make an axolotl in Merge the Fish', W / 2, 344, 16);
      } else {
        K.text(ctx, fish.length + (fish.length === 1 ? ' fish' : ' fish friends'), W / 2, 84, 16);
      }
    }

    function tap(x, y) {
      let best = null, bestD = 40 * 40;
      fish.forEach(f => {
        const fy = f.y + Math.sin(t * 1.6 + f.phase) * 9;
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
