// The cooking games (Sushi Shop, Ramen Shop, Cake & Sweets), played right on Aiman's shop
// designs (shops.js says where everything is). Girls and guys come to the counter and order;
// tap the ingredients onto your tray (or, at Cake & Sweets, the treats they want), then tap
// the tray to serve. The Recipes button opens the recipe book. A shift lasts 90 seconds,
// and it ends early if 3 customers get tired of waiting.
// Score = orders served; app.js gives 2 stars for every 3.
window.BW = window.BW || {};
BW.games = BW.games || {};

BW.cook = (() => {
  const K = BW.kit, W = K.W, H = K.H, TAU = K.TAU;
  const S = W / 941;                 // design pixels → game pixels
  const TIME = 90, LIVES = 3, MAX_TRAY = 6;
  const SLOTS = [110, 250];          // where the two customers stand
  const BROWN = '#5C3B2A', CREAM = '#FFF6EA';
  const FONT = "'Baloo 2', 'Trebuchet MS', sans-serif";

  const cache = {};
  function picture(src) {
    if (!cache[src]) { cache[src] = new Image(); cache[src].src = src; }
    return cache[src];
  }

  const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));
  const g = r => r.map(v => v * S);  // a design box in game pixels
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function make(shop) {
    const dishIds = Object.keys(shop.dishes);
    // sushi and ramen dishes all need a recipe; treats at Cake & Sweets are ready to go
    const orderable = shop.boxed ? dishIds : dishIds.filter(id => shop.dishes[id].needs);

    function start(canvas, options) {
      const bg = picture(`img/shops/${shop.id}.webp`);
      const counterY = shop.counter * S;
      let ctx = canvas.getContext('2d');
      let mode, book, customers, tray, served, lives, timeLeft, spawnIn, shake, tip, t = 0;
      const fx = K.sparkles();

      function reset() {
        mode = 'menu';
        book = false;
        customers = [];
        tray = [];
        served = 0;
        lives = LIVES;
        timeLeft = TIME;
        spawnIn = 0.4;
        shake = 0;
        tip = null;
        fx.clear();
      }

      function say(text, x, y) { fx.label(x, y, text); }

      // ---------- customers ----------

      function newOrder() {
        if (!shop.boxed) return [pick(orderable)];
        // a box of treats: just one at first, up to three later
        const most = served < 3 ? 1 : Math.min(3, 1 + Math.floor(served / 3));
        const n = 1 + Math.floor(Math.random() * most);
        return K.shuffle(orderable.slice()).slice(0, n);
      }

      function spawn() {
        const free = SLOTS.findIndex((x, i) => !customers.some(c => c.slot === i));
        if (free < 0) return;
        const here = customers.map(c => c.who);
        const people = BW.friends.people().filter(p => !here.includes(p.id));
        const who = pick(people).id;
        const order = newOrder();
        const wait = Math.max(12, 25 - served * 0.6) + (order.length - 1) * 4;
        customers.push({ slot: free, who, img: picture(`img/standing/${who}.webp`), order, wait, left: wait, enter: 0, leaving: 0, happy: false });
      }

      function wants(c) { return shop.boxed ? c.order : shop.dishes[c.order[0]].needs; }

      function serve() {
        if (!tray.length) { say('Your tray is empty', W / 2, g(shop.ui.start)[1] - 6); return; }
        const c = customers.find(c => !c.leaving && c.enter >= 1 && sameSet(tray, wants(c)));
        const tx = g(shop.ui.start), mid = tx[0] + tx[2] / 2;
        if (!c) {
          shake = 0.35;
          say('Oops! Check the recipe', mid, tx[1] - 6);
          tray = [];
          return;
        }
        served++;
        c.leaving = 0.01;
        c.happy = true;
        tray = [];
        const x = SLOTS[c.slot];
        fx.add(x, counterY - 120, '#FF9FB2', 16, 170);
        fx.add(x, counterY - 120, '#F9D77E', 10, 140);
        say('Thank you! ♥', x, counterY - 175);
        spawnIn = 1 + Math.random() * 1.2;
      }

      // ---------- tapping ----------

      const inside = (r, x, y) => x >= r[0] * S && x <= (r[0] + r[2]) * S && y >= r[1] * S && y <= (r[1] + r[3]) * S;

      function addToTray(id) {
        const i = tray.indexOf(id);
        if (i >= 0) { tray.splice(i, 1); return; }      // tap again to take it off
        if (tray.length >= MAX_TRAY) { say('The tray is full', W / 2, g(shop.ui.start)[1] - 6); return; }
        tray.push(id);
      }

      function tap(x, y) {
        if (mode === 'over') return;
        if (book) { book = false; return; }
        const ui = shop.ui;
        if (inside(ui.menu, x, y)) { if (options.pause) options.pause(); return; }
        if (inside(ui.recipes, x, y)) { book = true; return; }
        if (mode === 'menu') {
          if (inside(ui.start, x, y)) { mode = 'play'; spawnIn = 0.3; return; }
        } else {
          if (inside(ui.start, x, y)) { serve(); return; }
          if (inside(ui.map, x, y)) { tray = []; return; }   // the Clear button
          for (const id in shop.ingredients) if (inside(shop.ingredients[id].tap, x, y)) { addToTray(id); return; }
          for (const id in shop.dishes) {
            if (!inside(shop.dishes[id].tap, x, y)) continue;
            if (shop.boxed) addToTray(id);
            else tip = { id, life: 2.6 };                  // show how to make it
            return;
          }
        }
        for (const k of ['upgrade', 'shop', 'trophies', 'decor', 'stats', 'map']) {
          if (inside(ui[k], x, y)) {
            const r = g(ui[k]);
            say('Coming soon!', Math.min(W - 50, Math.max(50, r[0] + r[2] / 2)), r[1] - 4);
            return;
          }
        }
      }

      // ---------- update ----------

      function update(dt) {
        t += dt;
        fx.update(dt);
        shake = Math.max(0, shake - dt);
        if (tip) { tip.life -= dt; if (tip.life <= 0) tip = null; }
        if (mode !== 'play' || book) return;

        customers.forEach(c => {
          if (c.leaving) { c.leaving += dt * 1.6; return; }
          if (!c.img.complete || !c.img.naturalWidth) return;
          c.enter = Math.min(1, c.enter + dt * 2.5);
          c.left -= dt;
          if (c.left <= 0) {
            c.leaving = 0.01;
            lives--;
            shake = 0.3;
            say('Too slow...', SLOTS[c.slot], counterY - 175);
            spawnIn = 1.2;
          }
        });
        customers = customers.filter(c => c.leaving < 1);

        spawnIn -= dt;
        if (spawnIn <= 0 && customers.length < SLOTS.length) {
          spawn();
          spawnIn = 2.5 + Math.random() * 2;
        }

        timeLeft -= dt;
        if (timeLeft <= 0 || lives <= 0) {
          timeLeft = Math.max(0, timeLeft);
          mode = 'over';
          options.onGameOver(served, { served });
        }
      }

      // ---------- drawing ----------

      function label(str, x, y, size, color, align, weight) {
        ctx.font = `${weight || 800} ${size}px ${FONT}`;
        ctx.textAlign = align || 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color || BROWN;
        ctx.fillText(str, x, y);
      }

      // a food picture from the design, fitted into a box
      function food(r, x, y, w, h) {
        if (!bg.complete || !bg.naturalWidth) return;
        const k = Math.min(w / r[2], h / r[3]);
        const dw = r[2] * k, dh = r[3] * k;
        ctx.drawImage(bg, r[0], r[1], r[2], r[3], x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      }
      const picOf = id => (shop.ingredients[id] || shop.dishes[id]).pic;

      function panel(x, y, w, h, r) {
        ctx.fillStyle = CREAM;
        K.roundRect(ctx, x, y, w, h, r || 12); ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#8B5E4A';
        K.roundRect(ctx, x, y, w, h, r || 12); ctx.stroke();
      }

      function drawCustomer(c) {
        const im = c.img;
        if (!im.complete || !im.naturalWidth) return;
        const h = 230, w = h * im.naturalWidth / im.naturalHeight;
        const out = c.leaving ? Math.min(1, c.leaving) : 0;
        const x = SLOTS[c.slot], top = counterY - 150 + (1 - c.enter) * 40 - out * 20;
        ctx.save();
        ctx.globalAlpha = Math.min(c.enter, 1 - out);
        if (c.leaving && !c.happy) ctx.filter = 'grayscale(.7)';
        ctx.drawImage(im, x - w / 2, top, w, h);
        ctx.restore();
      }

      function drawBubble(c) {
        if (c.leaving || c.enter < 1) return;
        const x = SLOTS[c.slot], top = counterY - 150;
        const n = c.order.length, cell = shop.boxed ? 34 : 46;
        const bw = Math.max(64, n * cell + 16), bh = shop.boxed ? 52 : 58;
        const bx = Math.max(52, Math.min(W - 52 - bw, x - bw / 2)), by = top - bh - 12;
        // bubble with a little tail pointing at the customer
        ctx.fillStyle = CREAM; ctx.strokeStyle = '#8B5E4A'; ctx.lineWidth = 2;
        K.roundRect(ctx, bx, by, bw, bh, 12); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 7, by + bh - 1); ctx.lineTo(x, by + bh + 9); ctx.lineTo(x + 7, by + bh - 1); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = CREAM; ctx.fillRect(x - 6, by + bh - 3, 12, 3);
        c.order.forEach((id, i) => food(shop.dishes[id].pic, bx + 8 + i * cell, by + 5, cell - 4, bh - 18));
        // patience bar
        const p = Math.max(0, c.left / c.wait);
        ctx.fillStyle = '#EAD9C6'; K.roundRect(ctx, bx + 8, by + bh - 10, bw - 16, 5, 2.5); ctx.fill();
        ctx.fillStyle = p > 0.5 ? '#8CC77A' : p > 0.25 ? '#F2C35B' : '#F28C8C';
        K.roundRect(ctx, bx + 8, by + bh - 10, Math.max(5, (bw - 16) * p), 5, 2.5); ctx.fill();
      }

      // the two pills at the top show this game's numbers instead of the painted ones
      function drawPills() {
        const s = g(shop.ui.stars), l = g(shop.ui.level);
        ctx.fillStyle = shop.pill;
        K.roundRect(ctx, s[0], s[1], s[2], s[3], 8); ctx.fill();
        K.roundRect(ctx, l[0], l[1], l[2], l[3], 8); ctx.fill();
        const cy = s[1] + s[3] / 2;
        if (mode === 'menu') {
          K.star(ctx, s[0] + 9, cy, 8, '#F9D77E');
          label(BW.store.data.coins.toLocaleString('en-US'), s[0] + 20, cy + 1, 17, BROWN, 'left');
          label(`Best ${options.getBest()}`, l[0] + 2, l[1] + 9, 13, BROWN, 'left');
          bar(l, Math.min(1, options.getBest() / 15), '#8CC77A');
        } else {
          label(String(served), s[0] + 2, cy + 1, 17, BROWN, 'left');
          const nw = ctx.measureText(String(served)).width;
          label('served', s[0] + 6 + nw, cy + 2, 10, '#9B7B6A', 'left', 700);
          label(`${Math.ceil(timeLeft)}s`, l[0] + 2, l[1] + 9, 13, BROWN, 'left');
          for (let i = 0; i < LIVES; i++) K.heart(ctx, l[0] + l[2] - 8 - (LIVES - 1 - i) * 15, l[1] + 9, 12, i < lives);
          bar(l, timeLeft / TIME, timeLeft < 15 ? '#F28C8C' : '#8CC77A');
        }
      }
      function bar(l, f, color) {
        const x = l[0] + 2, y = l[1] + l[3] - 9, w = l[2] - 6;
        ctx.fillStyle = '#FFFDF8'; K.roundRect(ctx, x, y, w, 7, 3.5); ctx.fill();
        ctx.strokeStyle = '#8B5E4A'; ctx.lineWidth = 1.2; K.roundRect(ctx, x, y, w, 7, 3.5); ctx.stroke();
        ctx.fillStyle = color; K.roundRect(ctx, x + 1, y + 1, Math.max(5, (w - 2) * f), 5, 2.5); ctx.fill();
      }

      // in a shift the START COOKING button becomes your tray, and Map becomes Clear
      function drawTray() {
        const r = g(shop.ui.start);
        const x = r[0] + 4, y = r[1] + r[3] / 2 - 34, w = r[2] - 8, h = 68;
        panel(x, y, w, h, 16);
        if (!tray.length) {
          label(shop.boxed ? 'Tap treats to box them' : 'Tap ingredients', x + w / 2, y + h / 2 - 9, 13);
          label('then tap to serve', x + w / 2, y + h / 2 + 9, 12, '#9B7B6A', 'center', 700);
        } else {
          const cell = Math.min(36, (w - 12) / tray.length);
          const x0 = x + (w - cell * tray.length) / 2;
          tray.forEach((id, i) => food(picOf(id), x0 + i * cell + 1, y + 6, cell - 2, 34));
          label('Tap to serve ♥', x + w / 2, y + h - 13, 13, '#D2607A');
        }
        const m = g(shop.ui.map);
        const cx = m[0] + m[2] / 2, cy = m[1] + m[3] / 2;
        ctx.fillStyle = CREAM; ctx.strokeStyle = '#8B5E4A'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(cx, cy, 22, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#D2607A'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx - 7, cy - 10); ctx.lineTo(cx + 7, cy + 4); ctx.moveTo(cx + 7, cy - 10); ctx.lineTo(cx - 7, cy + 4); ctx.stroke();
        label('Clear', cx, cy + 12, 10);
      }

      // tapping a sushi or bowl on display shows how it's made
      function drawTip() {
        if (!tip) return;
        const d = shop.dishes[tip.id], r = g(d.tap);
        const needs = d.needs, w = Math.max(150, needs.length * 34 + 20), h = 62;
        const x = Math.max(8, Math.min(W - 8 - w, r[0] + r[2] / 2 - w / 2)), y = r[1] - h - 4;
        ctx.save(); ctx.globalAlpha = Math.min(1, tip.life * 3);
        panel(x, y, w, h, 10);
        label(d.name, x + w / 2, y + 12, 12);
        const x0 = x + (w - needs.length * 34) / 2;
        needs.forEach((id, i) => food(shop.ingredients[id].pic, x0 + i * 34 + 2, y + 22, 30, 32));
        ctx.restore();
      }

      // the recipe book (a picture menu at Cake & Sweets)
      function drawBook() {
        ctx.fillStyle = 'rgba(40, 25, 20, .55)'; ctx.fillRect(0, 0, W, H);
        const x = 16, y = 60, w = W - 32, h = 530;
        panel(x, y, w, h, 18);
        label(shop.boxed ? 'Sweets Menu' : `${shop.title} Recipes`, W / 2, y + 22, 20);
        if (shop.boxed) {
          // 4 x 5 picture grid with names
          const cw = (w - 16) / 4, ch = 88;
          dishIds.forEach((id, i) => {
            const cx = x + 8 + (i % 4) * cw, cy = y + 44 + Math.floor(i / 4) * ch;
            food(shop.dishes[id].pic, cx + 4, cy, cw - 8, 58);
            label(shop.dishes[id].name, cx + cw / 2, cy + 68, 10.5, BROWN, 'center', 700);
          });
          label('Customers show what they want in their bubble.', W / 2, y + h - 34, 11.5, '#9B7B6A', 'center', 700);
          label('Tap those treats, then tap the tray!', W / 2, y + h - 18, 11.5, '#9B7B6A', 'center', 700);
        } else {
          const rows = orderable.length, rh = Math.min(64, (h - 70) / rows);
          orderable.forEach((id, i) => {
            const d = shop.dishes[id], ry = y + 42 + i * rh;
            if (i) { ctx.strokeStyle = '#EAD9C6'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 12, ry); ctx.lineTo(x + w - 12, ry); ctx.stroke(); }
            food(d.pic, x + 8, ry + 4, 66, rh - 8);
            label(d.name, x + 82, ry + 11, 12.5, BROWN, 'left');
            // each ingredient: its picture with its name underneath
            const step = Math.min(58, (w - 92) / d.needs.length);
            d.needs.forEach((n, j) => {
              const ix = x + 82 + j * step;
              food(shop.ingredients[n].pic, ix, ry + 20, step - 6, rh - 34);
              label(shop.ingredients[n].name.replace(' Shoots', '').replace('Green ', ''), ix + (step - 6) / 2, ry + rh - 8, 9, '#7A5A48', 'center', 700);
            });
          });
        }
        label('Tap anywhere to close', W / 2, y + h - 2 + 14, 12, CREAM, 'center', 700);
      }

      function draw(c) {
        ctx = c;
        ctx.save();
        if (shake > 0) ctx.translate(Math.sin(t * 60) * shake * 10, 0);
        if (bg.complete && bg.naturalWidth) {
          ctx.drawImage(bg, 0, 0, W, 1671 * S);
          customers.forEach(drawCustomer);
          // the counter and everything in front of it covers the customers' legs
          ctx.drawImage(bg, 0, shop.counter, 941, 1671 - shop.counter, 0, counterY, W, (1671 - shop.counter) * S);
        } else {
          ctx.fillStyle = '#8F604A'; ctx.fillRect(0, 0, W, H);
        }
        drawPills();
        if (mode === 'menu') {
          // a soft glow around START COOKING
          const r = g(shop.ui.start);
          ctx.strokeStyle = `rgba(255,255,255,${0.35 + Math.sin(t * 4) * 0.25})`; ctx.lineWidth = 4;
          K.roundRect(ctx, r[0] + 4, r[1] + r[3] * 0.12, r[2] - 8, r[3] * 0.76, 40); ctx.stroke();
        } else {
          drawTray();
          customers.forEach(drawBubble);
        }
        drawTip();
        fx.draw(ctx);
        ctx.restore();
        if (book) drawBook();
      }

      reset();
      const engine = K.run(canvas, {
        update, draw,
        down: tap,
        keydown(e) {
          if (mode === 'menu' && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); mode = 'play'; }
        }
      });
      return {
        restart() { reset(); mode = 'play'; },
        stop: engine.stop
      };
    }

    return { start };
  }

  return { make };
})();

['sushi', 'ramen', 'cake'].forEach(id => { BW.games[id] = BW.cook.make(BW.shops[id]); });
