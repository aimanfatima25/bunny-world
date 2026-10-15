// The cooking games (Sushi Shop, Ramen Shop, Cake & Sweets). shops.js says where everything
// is in Aiman's shop designs.
//  - Front screen: her whole shop picture. START COOKING opens the kitchen, Recipes the book.
//  - Kitchen: her shop's wall at the top with a framed menu board; girls and guys stand in
//    front of it and order from it. Below is your counter: the cooking station (her rice
//    cooker / stove / mixer), the ingredient boxes, your tray, and the recipe bar on the right.
//    Some things cook first (rice, noodles, every treat): they go on the station, and once
//    they're ready you tap them onto your plate. Leave them too long and they burn!
//    Everything you add goes onto the plate (a ramen bowl, a gift box for treats) one by one;
//    tap the plate to serve. A shift lasts 90 seconds, and ends early if 3 customers give up.
// Score = orders served; app.js gives 2 stars for every 3.
window.BW = window.BW || {};
BW.games = BW.games || {};

BW.cook = (() => {
  const K = BW.kit, W = K.W, H = K.H, TAU = K.TAU;
  const S = W / 941;                  // design pixels → game pixels (front screen and top bar)
  const TIME = 90, LIVES = 3, MAX_TRAY = 6;
  const COOK_TIME = 2.5, BURN_TIME = 7;
  const BROWN = '#5C3B2A', CREAM = '#FFF6EA', EDGE = '#8B5E4A', PINK = '#D2607A';
  const FONT = "'Baloo 2', 'Trebuchet MS', sans-serif";

  // the kitchen view, in game pixels
  const TOP = 120 * S;                // the design's top bar (pills and ≡ button)
  const WALL = [0, TOP, W, 238];      // her shop's wall behind the customers
  const FRAME = [10, 50, 340, 68];    // the menu board hanging on the wall
  const COUNTER = 284;                // customers stand behind the counter's edge
  const SLOTS = [78, 210];            // where the two customers stand
  const STATION = [4, 304, 100, 96];  // the cooking station picture
  const PANS = [[106, 308, 56, 88], [162, 308, 56, 88]];   // two cooking spots
  const BINS = [4, 404, 214, 144];    // ingredient boxes
  const CLEAR = [24, 604, 20];        // circle: x, y, r
  const TRAY = [48, 550, 172, 88];    // the plate / bowl / box you build the order on
  const BAR = [222, 304, 134, 330];   // the recipe bar

  const cache = {};
  function picture(src) {
    if (!cache[src]) { cache[src] = new Image(); cache[src].src = src; }
    return cache[src];
  }

  const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));
  const g = r => r.map(v => v * S);   // a design box in game pixels (front screen)
  const within = (r, x, y) => x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3];
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function make(shop) {
    const dishIds = Object.keys(shop.dishes);
    const orderable = shop.boxed ? dishIds : dishIds.filter(id => shop.dishes[id].needs);
    // what goes in the boxes on your counter: ingredients, or every treat at Cake & Sweets
    const binIds = shop.boxed ? dishIds : Object.keys(shop.ingredients);
    const needsCooking = id => shop.cook === '*' || shop.cook.includes(id);

    // lay the boxes out in a grid on the counter
    const binCols = binIds.length > 8 ? 5 : 4, binRows = Math.ceil(binIds.length / binCols);
    const binW = BINS[2] / binCols, binH = BINS[3] / binRows;
    const binBox = i => [BINS[0] + (i % binCols) * binW, BINS[1] + Math.floor(i / binCols) * binH, binW, binH];

    function start(canvas, options) {
      const bg = picture(`img/shops/${shop.id}.webp`);
      let ctx = canvas.getContext('2d');
      let mode, book, customers, tray, trayAt, pans, served, lives, timeLeft, spawnIn, shake, tip, t = 0;
      const fx = K.sparkles();

      function reset() {
        mode = 'menu';
        book = false;
        customers = [];
        tray = []; trayAt = [];
        pans = [null, null];
        served = 0;
        lives = LIVES;
        timeLeft = TIME;
        spawnIn = 0.4;
        shake = 0;
        tip = null;
        fx.clear();
      }

      const say = (text, x, y) => fx.label(x, y, text);
      const picOf = id => (shop.ingredients[id] || shop.dishes[id]).pic;
      const nameOf = id => (shop.ingredients[id] || shop.dishes[id]).name;

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
        const who = pick(BW.friends.people().filter(p => !here.includes(p.id))).id;
        const order = newOrder();
        const wait = Math.max(15, 30 - served * 0.6) + (order.length - 1) * 6;
        customers.push({ slot: free, who, img: picture(`img/standing/${who}.webp`), order, wait, left: wait, enter: 0, leaving: 0, happy: false });
      }

      const wants = c => (shop.boxed ? c.order : shop.dishes[c.order[0]].needs);
      const ordered = () => customers.filter(c => !c.leaving && c.enter >= 1);

      function serve() {
        if (!tray.length) { say(`Your ${shop.plate} is empty`, TRAY[0] + TRAY[2] / 2, TRAY[1] - 8); return; }
        const c = ordered().find(c => sameSet(tray, wants(c)));
        if (!c) {
          shake = 0.35;
          say('Oops! Check the recipe', TRAY[0] + TRAY[2] / 2, TRAY[1] - 8);
          tray = []; trayAt = [];
          return;
        }
        served++;
        c.leaving = 0.01;
        c.happy = true;
        tray = []; trayAt = [];
        const x = SLOTS[c.slot];
        fx.add(x, COUNTER - 90, '#FF9FB2', 16, 170);
        fx.add(x, COUNTER - 90, '#F9D77E', 10, 140);
        say('Thank you! ♥', x, COUNTER - 140);
        spawnIn = 1 + Math.random() * 1.2;
      }

      // ---------- your counter ----------

      function addToTray(id) {
        if (tray.length >= MAX_TRAY) { say(`Your ${shop.plate} is full`, TRAY[0] + TRAY[2] / 2, TRAY[1] - 8); return false; }
        tray.push(id);
        trayAt.push(t);                           // when it landed, for the little drop
        return true;
      }

      function tapBin(id) {
        if (needsCooking(id)) {
          const free = pans.indexOf(null);
          if (free < 0) { say(`The ${shop.station.name.toLowerCase()} is full`, 120, STATION[1] - 6); return; }
          pans[free] = { id, time: 0 };
          return;
        }
        const i = tray.indexOf(id);
        if (i >= 0) { tray.splice(i, 1); trayAt.splice(i, 1); }   // tap again to take it off
        else addToTray(id);
      }

      function tapPan(i) {
        const p = pans[i];
        if (!p) return;
        const box = PANS[i];
        if (p.time >= COOK_TIME + BURN_TIME) {     // burnt: throw it away
          pans[i] = null;
          say('Into the bin!', box[0] + box[2] / 2, box[1]);
        } else if (p.time >= COOK_TIME) {
          if (tray.includes(p.id) && !shop.boxed) { say(`Already in your ${shop.plate}`, box[0] + box[2] / 2, box[1]); return; }
          if (addToTray(p.id)) pans[i] = null;
        } else {
          say('Not ready yet!', box[0] + box[2] / 2, box[1]);
        }
      }

      // ---------- tapping ----------

      function tapFront(x, y) {
        const ui = shop.ui, at = r => within(g(r), x, y);
        if (at(ui.recipes)) { book = true; return; }
        if (at(ui.start)) { mode = 'play'; spawnIn = 0.3; return; }
        for (const k of ['upgrade', 'shop', 'trophies', 'decor', 'stats', 'map']) {
          if (at(ui[k])) {
            const r = g(ui[k]);
            say('Coming soon!', Math.min(W - 50, Math.max(50, r[0] + r[2] / 2)), r[1] - 4);
            return;
          }
        }
        for (const id in shop.dishes) if (!shop.boxed && at(shop.dishes[id].tap)) { tip = { id, life: 2.6 }; return; }
      }

      function tapKitchen(x, y) {
        if (within(TRAY, x, y)) { serve(); return; }
        if (Math.hypot(x - CLEAR[0], y - CLEAR[1]) < CLEAR[2] + 4) { tray = []; trayAt = []; return; }
        for (let i = 0; i < PANS.length; i++) if (within(PANS[i], x, y)) { tapPan(i); return; }
        for (let i = 0; i < binIds.length; i++) if (within(binBox(i), x, y)) { tapBin(binIds[i]); return; }
      }

      function tap(x, y) {
        if (mode === 'over') return;
        if (book) { book = false; return; }
        if (within(g(shop.ui.menu), x, y)) { if (options.pause) options.pause(); return; }
        if (mode === 'menu') tapFront(x, y);
        else tapKitchen(x, y);
      }

      // ---------- update ----------

      function update(dt) {
        t += dt;
        fx.update(dt);
        shake = Math.max(0, shake - dt);
        if (tip) { tip.life -= dt; if (tip.life <= 0) tip = null; }
        if (mode !== 'play' || book) return;

        pans.forEach((p, i) => {
          if (!p) return;
          const before = p.time;
          p.time += dt;
          const box = PANS[i];
          if (before < COOK_TIME && p.time >= COOK_TIME) fx.add(box[0] + box[2] / 2, box[1] + 34, '#FFFFFF', 8, 90);
          if (before < COOK_TIME + BURN_TIME && p.time >= COOK_TIME + BURN_TIME) { say('Burnt!', box[0] + box[2] / 2, box[1]); shake = 0.2; }
        });

        customers.forEach(c => {
          if (c.leaving) { c.leaving += dt * 1.6; return; }
          if (!c.img.complete || !c.img.naturalWidth) return;
          c.enter = Math.min(1, c.enter + dt * 2.5);
          c.left -= dt;
          if (c.left <= 0) {
            c.leaving = 0.01;
            lives--;
            shake = 0.3;
            say('Too slow...', SLOTS[c.slot], COUNTER - 140);
            spawnIn = 1.2;
          }
        });
        customers = customers.filter(c => c.leaving < 1);

        spawnIn -= dt;
        if (spawnIn <= 0 && customers.length < SLOTS.length) {
          spawn();
          spawnIn = 3 + Math.random() * 2;
        }

        timeLeft -= dt;
        if (timeLeft <= 0 || lives <= 0) {
          timeLeft = Math.max(0, timeLeft);
          mode = 'over';
          options.onGameOver(served, { served });
        }
      }

      // ---------- drawing helpers ----------

      function label(str, x, y, size, color, align, weight) {
        ctx.font = `${weight || 800} ${size}px ${FONT}`;
        ctx.textAlign = align || 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color || BROWN;
        ctx.fillText(str, x, y);
      }

      // a picture from the design, fitted into a box
      function food(r, x, y, w, h) {
        if (!bg.complete || !bg.naturalWidth) return;
        const k = Math.min(w / r[2], h / r[3]);
        const dw = r[2] * k, dh = r[3] * k;
        ctx.drawImage(bg, r[0], r[1], r[2], r[3], x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      }

      function panel(x, y, w, h, r, fill) {
        ctx.fillStyle = fill || CREAM;
        K.roundRect(ctx, x, y, w, h, r || 12); ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = EDGE;
        K.roundRect(ctx, x, y, w, h, r || 12); ctx.stroke();
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
        ctx.strokeStyle = EDGE; ctx.lineWidth = 1.2; K.roundRect(ctx, x, y, w, 7, 3.5); ctx.stroke();
        ctx.fillStyle = color; K.roundRect(ctx, x + 1, y + 1, Math.max(5, (w - 2) * f), 5, 2.5); ctx.fill();
      }

      // ---------- front screen ----------

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

      function drawFront() {
        ctx.drawImage(bg, 0, 0, W, 1671 * S);
        drawPills();
        // a soft glow around START COOKING
        const r = g(shop.ui.start);
        ctx.strokeStyle = `rgba(255,255,255,${0.35 + Math.sin(t * 4) * 0.25})`; ctx.lineWidth = 4;
        K.roundRect(ctx, r[0] + 4, r[1] + r[3] * 0.12, r[2] - 8, r[3] * 0.76, 40); ctx.stroke();
        drawTip();
      }

      // the full recipe book (a picture menu at Cake & Sweets), from the front screen
      function drawBook() {
        ctx.fillStyle = 'rgba(40, 25, 20, .55)'; ctx.fillRect(0, 0, W, H);
        const x = 16, y = 60, w = W - 32, h = 530;
        panel(x, y, w, h, 18);
        label(shop.boxed ? 'Sweets Menu' : `${shop.title} Recipes`, W / 2, y + 22, 20);
        if (shop.boxed) {
          const cw = (w - 16) / 4, ch = 88;
          dishIds.forEach((id, i) => {
            const cx = x + 8 + (i % 4) * cw, cy = y + 44 + Math.floor(i / 4) * ch;
            food(shop.dishes[id].pic, cx + 4, cy, cw - 8, 58);
            label(shop.dishes[id].name, cx + cw / 2, cy + 68, 10.5, BROWN, 'center', 700);
          });
          label('Bake each treat at the mixer, then box them', W / 2, y + h - 34, 11.5, '#9B7B6A', 'center', 700);
          label('on the tray and tap it to serve!', W / 2, y + h - 18, 11.5, '#9B7B6A', 'center', 700);
        } else {
          const rows = orderable.length, rh = Math.min(64, (h - 70) / rows);
          orderable.forEach((id, i) => {
            const d = shop.dishes[id], ry = y + 42 + i * rh;
            if (i) { ctx.strokeStyle = '#EAD9C6'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 12, ry); ctx.lineTo(x + w - 12, ry); ctx.stroke(); }
            food(d.pic, x + 8, ry + 4, 66, rh - 8);
            label(d.name, x + 82, ry + 11, 12.5, BROWN, 'left');
            const step = Math.min(58, (w - 92) / d.needs.length);
            d.needs.forEach((n, j) => {
              const ix = x + 82 + j * step;
              food(shop.ingredients[n].pic, ix, ry + 20, step - 6, rh - 34);
              label(shortName(n), ix + (step - 6) / 2, ry + rh - 8, 9, '#7A5A48', 'center', 700);
            });
          });
        }
        label('Tap anywhere to close', W / 2, y + h + 12, 12, CREAM, 'center', 700);
      }
      const shortName = id => nameOf(id).replace(' Shoots', '').replace('Green ', '');

      // ---------- kitchen ----------

      // warm wooden counter, in the cottage colours
      function drawCounter() {
        const y0 = COUNTER - 4;
        const grad = ctx.createLinearGradient(0, y0, 0, H);
        grad.addColorStop(0, '#B98559'); grad.addColorStop(1, '#8E6040');
        ctx.fillStyle = grad; ctx.fillRect(0, y0, W, H - y0);
        ctx.strokeStyle = 'rgba(80, 45, 25, .25)'; ctx.lineWidth = 1;
        for (let y = y0 + 26; y < H; y += 34) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        // the counter top's front edge
        ctx.fillStyle = '#D6A777'; ctx.fillRect(0, y0, W, 8);
        ctx.fillStyle = '#7A5038'; ctx.fillRect(0, y0 + 8, W, 3);
      }

      // the menu board: every dish in a wooden picture frame on the wall
      function drawFrame() {
        const [x, y, w, h] = FRAME;
        ctx.fillStyle = 'rgba(60, 35, 20, .35)'; K.roundRect(ctx, x + 2, y + 3, w, h, 8); ctx.fill();
        ctx.fillStyle = '#8B5E4A'; K.roundRect(ctx, x, y, w, h, 8); ctx.fill();
        ctx.fillStyle = '#A9785D'; K.roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 6); ctx.fill();
        ctx.fillStyle = CREAM; K.roundRect(ctx, x + 7, y + 7, w - 14, h - 14, 4); ctx.fill();
        const cols = dishIds.length > 10 ? 10 : dishIds.length, rows = Math.ceil(dishIds.length / cols);
        const cw = (w - 18) / cols, ch = (h - 18) / rows;
        const wanted = ordered().flatMap(c => c.order);
        dishIds.forEach((id, i) => {
          const cx = x + 9 + (i % cols) * cw, cy = y + 9 + Math.floor(i / cols) * ch;
          if (wanted.includes(id)) {
            ctx.fillStyle = 'rgba(255, 159, 178, .45)'; K.roundRect(ctx, cx, cy, cw - 1, ch - 1, 4); ctx.fill();
          }
          food(shop.dishes[id].pic, cx + 1, cy + 1, cw - 3, ch - 3);
        });
      }

      function drawCustomer(c) {
        const im = c.img;
        if (!im.complete || !im.naturalWidth) return;
        const h = 200, w = h * im.naturalWidth / im.naturalHeight;
        const out = c.leaving ? Math.min(1, c.leaving) : 0;
        const x = SLOTS[c.slot], top = COUNTER - 118 + (1 - c.enter) * 40 - out * 20;
        ctx.save();
        ctx.globalAlpha = Math.min(c.enter, 1 - out);
        if (c.leaving && !c.happy) ctx.filter = 'grayscale(.7)';
        ctx.drawImage(im, x - w / 2, top, w, h);
        ctx.restore();
      }

      function drawBubble(c) {
        if (c.leaving || c.enter < 1) return;
        const x = SLOTS[c.slot], head = COUNTER - 118;
        const n = c.order.length, cell = shop.boxed ? 32 : 44;
        const bw = Math.max(60, n * cell + 14), bh = 50;
        const bx = Math.max(4, Math.min(W - 4 - bw, x + 30)), by = head - 4;
        // bubble beside their head, with a little tail pointing at them
        ctx.fillStyle = CREAM; ctx.strokeStyle = EDGE; ctx.lineWidth = 2;
        K.roundRect(ctx, bx, by, bw, bh, 12); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + 1, by + 18); ctx.lineTo(bx - 9, by + 28); ctx.lineTo(bx + 1, by + 30); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = CREAM; ctx.fillRect(bx, by + 19, 3, 10);
        c.order.forEach((id, i) => food(shop.dishes[id].pic, bx + 7 + i * cell, by + 5, cell - 4, bh - 18));
        const p = Math.max(0, c.left / c.wait);
        ctx.fillStyle = '#EAD9C6'; K.roundRect(ctx, bx + 7, by + bh - 10, bw - 14, 5, 2.5); ctx.fill();
        ctx.fillStyle = p > 0.5 ? '#8CC77A' : p > 0.25 ? '#F2C35B' : '#F28C8C';
        K.roundRect(ctx, bx + 7, by + bh - 10, Math.max(5, (bw - 14) * p), 5, 2.5); ctx.fill();
      }

      // the cooking station from her design, and the two cooking spots beside it
      function drawStation() {
        panel(STATION[0], STATION[1], STATION[2], STATION[3], 10, '#F3E2CC');
        food(shop.station.pic, STATION[0] + 4, STATION[1] + 4, STATION[2] - 8, STATION[3] - 18);
        label(shop.station.name, STATION[0] + STATION[2] / 2, STATION[1] + STATION[3] - 8, 10, BROWN, 'center', 800);
        PANS.forEach((box, i) => {
          const [x, y, w, h] = box, p = pans[i];
          const cx = x + w / 2, cy = y + 36;
          ctx.fillStyle = 'rgba(60, 35, 20, .25)';
          ctx.beginPath(); ctx.ellipse(cx, cy + 4, 23, 23, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = '#FFFDF8'; ctx.strokeStyle = EDGE; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(cx, cy, 23, 0, TAU); ctx.fill(); ctx.stroke();
          if (!p) {
            label('empty', cx, cy, 10, '#C2A48E', 'center', 700);
            return;
          }
          const ready = p.time >= COOK_TIME, burnt = p.time >= COOK_TIME + BURN_TIME;
          ctx.save();
          if (burnt) ctx.filter = 'brightness(.35) sepia(.6)';
          else if (!ready) ctx.globalAlpha = 0.65;
          const bob = ready && !burnt ? Math.sin(t * 8) * 2 : 0;
          food(picOf(p.id), cx - 18, cy - 14 + bob, 36, 28);
          ctx.restore();
          // progress ring while cooking, then a shrinking "hurry" ring before it burns
          const f = ready ? 1 - (p.time - COOK_TIME) / BURN_TIME : p.time / COOK_TIME;
          ctx.lineWidth = 4; ctx.lineCap = 'round';
          ctx.strokeStyle = !ready ? '#F2C35B' : f > 0.35 ? '#8CC77A' : '#F28C8C';
          if (!burnt) { ctx.beginPath(); ctx.arc(cx, cy, 26, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0, f)); ctx.stroke(); }
          if (!ready) {
            // little steam puffs
            ctx.fillStyle = 'rgba(255,255,255,.7)';
            for (let k = 0; k < 3; k++) {
              const s = (t * 0.8 + k / 3) % 1;
              ctx.beginPath(); ctx.arc(cx - 8 + k * 8, cy - 22 - s * 14, 3 + s * 3, 0, TAU); ctx.fill();
            }
          }
          label(burnt ? 'Burnt! Tap' : ready ? 'Ready! Tap' : shop.station.verb, cx, y + h - 10, 10, burnt ? '#8A3B3B' : ready ? '#3F7A3A' : BROWN);
        });
      }

      function drawBins() {
        const wanted = new Set(ordered().flatMap(c => wants(c)));
        binIds.forEach((id, i) => {
          const [x, y, w, h] = binBox(i);
          ctx.fillStyle = wanted.has(id) ? 'rgba(255, 220, 228, .9)' : 'rgba(255, 246, 234, .85)';
          K.roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 7); ctx.fill();
          ctx.strokeStyle = EDGE; ctx.lineWidth = 1.5; K.roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 7); ctx.stroke();
          const named = h > 50;
          food(picOf(id), x + 5, y + 5, w - 10, h - (named ? 22 : 10));
          if (named) label(shortName(id), x + w / 2, y + h - 10, 9.5, BROWN, 'center', 800);
          if (needsCooking(id) && !shop.boxed) {
            ctx.fillStyle = '#F2C35B'; ctx.beginPath(); ctx.arc(x + w - 9, y + 9, 6, 0, TAU); ctx.fill();
            label('♨', x + w - 9, y + 9.5, 9, BROWN);
          }
        });
      }

      // where the i-th thing sits on the plate: the first one in the middle, the rest
      // around it, each a little higher so it piles up
      function spot(i, n, cx, cy, spread) {
        if (n === 1) return [cx, cy];
        const a = (i / n) * TAU - Math.PI / 2;
        return [cx + Math.cos(a) * spread, cy + Math.sin(a) * spread * 0.35 - i * 1.5];
      }
      function drawLayers(cx, cy, size, spread) {
        tray.forEach((id, i) => {
          const drop = Math.min(1, (t - trayAt[i]) * 6);
          const [px, py] = spot(i, tray.length, cx, cy, spread);
          food(picOf(id), px - size / 2, py - size * 0.4 - (1 - drop) * 18, size, size * 0.8);
        });
      }

      function drawTray() {
        const [x, y, w, h] = TRAY;
        const cx = x + w / 2;
        if (shop.plate === 'bowl') {
          // a cream ramen bowl with a red band, the toppings floating in the soup
          const top = y + 30;
          ctx.fillStyle = 'rgba(60, 35, 20, .3)'; ctx.beginPath(); ctx.ellipse(cx, y + h - 6, 56, 8, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = '#FFF4E6'; ctx.strokeStyle = EDGE; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(cx - 72, top); ctx.bezierCurveTo(cx - 70, y + h + 4, cx + 70, y + h + 4, cx + 72, top); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.save(); ctx.beginPath(); ctx.moveTo(cx - 72, top); ctx.bezierCurveTo(cx - 70, y + h + 4, cx + 70, y + h + 4, cx + 72, top); ctx.closePath(); ctx.clip();
          ctx.fillStyle = '#C9473F'; ctx.fillRect(cx - 80, top + 14, 160, 9);
          ctx.fillStyle = '#FFF4E6';
          for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.arc(cx + k * 18, top + 18.5, 2.2, 0, TAU); ctx.fill(); }
          ctx.restore();
          ctx.fillStyle = tray.length ? '#E9B877' : '#F3E2CC';
          ctx.beginPath(); ctx.ellipse(cx, top, 70, 13, 0, 0, TAU); ctx.fill(); ctx.stroke();
          drawLayers(cx, top - 2, 40, 34);
        } else if (shop.plate === 'box') {
          // an open pink gift box with a ribbon
          const bx = cx - 66, by = y + 30, bw = 132, bh = 50;
          ctx.fillStyle = 'rgba(60, 35, 20, .3)'; ctx.beginPath(); ctx.ellipse(cx, by + bh + 2, 68, 6, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = '#F7C6D0'; ctx.strokeStyle = EDGE; ctx.lineWidth = 2.5;
          K.roundRect(ctx, bx, by, bw, bh, 6); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#FBE3E8'; K.roundRect(ctx, bx + 6, by + 5, bw - 12, 12, 4); ctx.fill();
          drawLayers(cx, by + 8, 38, 40);
          ctx.fillStyle = '#F7C6D0'; K.roundRect(ctx, bx, by + 18, bw, bh - 18, 6); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#E8879C'; ctx.fillRect(cx - 5, by + 18, 10, bh - 18);
          ctx.beginPath(); ctx.ellipse(cx - 9, by + 20, 9, 5, -0.4, 0, TAU); ctx.ellipse(cx + 9, by + 20, 9, 5, 0.4, 0, TAU); ctx.fill();
        } else {
          // a round cream plate with a brown rim
          const py = y + 58;
          ctx.fillStyle = 'rgba(60, 35, 20, .3)'; ctx.beginPath(); ctx.ellipse(cx, py + 6, 78, 22, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = '#FFFDF8'; ctx.strokeStyle = EDGE; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.ellipse(cx, py, 78, 22, 0, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = '#E3CDB4'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.ellipse(cx, py, 62, 15, 0, 0, TAU); ctx.stroke();
          drawLayers(cx, py - 2, 40, 40);
        }
        if (!tray.length) label(shop.boxed ? 'Bake treats, box them here' : 'Add ingredients here', cx, y + 12, 11.5, CREAM, 'center', 800);
        else label('Tap to serve ♥', cx, y + 10, 12.5, '#FFE3EA', 'center', 800);
        // the Clear button beside it
        const [kx, ky, r] = CLEAR;
        ctx.fillStyle = CREAM; ctx.strokeStyle = EDGE; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(kx, ky, r, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = PINK; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(kx - 6, ky - 10); ctx.lineTo(kx + 6, ky + 2); ctx.moveTo(kx + 6, ky - 10); ctx.lineTo(kx - 6, ky + 2); ctx.stroke();
        label('Clear', kx, ky + 11, 9);
      }

      // the recipe bar on the right: every recipe, the ones being ordered glow pink.
      // At Cake & Sweets there's nothing to mix, so it lists each customer's order instead.
      function drawBar() {
        const [x, y, w, h] = BAR;
        panel(x, y, w, h, 12);
        if (shop.boxed) { drawOrders(x, y, w, h); return; }
        label('Recipes', x + w / 2, y + 11, 12);
        const wanted = ordered().map(c => c.order[0]);
        const rh = (h - 22) / orderable.length;
        orderable.forEach((id, i) => {
          const d = shop.dishes[id], ry = y + 20 + i * rh;
          if (wanted.includes(id)) {
            ctx.fillStyle = 'rgba(255, 159, 178, .4)'; K.roundRect(ctx, x + 3, ry, w - 6, rh - 1, 6); ctx.fill();
          } else if (i) {
            ctx.strokeStyle = '#EAD9C6'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 6, ry); ctx.lineTo(x + w - 6, ry); ctx.stroke();
          }
          const big = rh > 45;
          food(d.pic, x + 4, ry + 2, 34, rh - 4);
          label(d.name.replace(' Ramen', '').replace(' Sushi', ''), x + 41, ry + (big ? 9 : 7), big ? 10.5 : 9, BROWN, 'left', 800);
          const step = (w - 44) / d.needs.length;
          d.needs.forEach((n, j) => food(shop.ingredients[n].pic, x + 41 + j * step, ry + (big ? 17 : 13), step - 2, rh - (big ? 19 : 14)));
        });
      }

      function drawOrders(x, y, w, h) {
        label('Orders', x + w / 2, y + 11, 12);
        const list = ordered();
        if (!list.length) { label('Waiting for', x + w / 2, y + h / 2 - 8, 10.5, '#9B7B6A', 'center', 700); label('customers...', x + w / 2, y + h / 2 + 8, 10.5, '#9B7B6A', 'center', 700); return; }
        const box = (h - 24) / 2;
        list.sort((a, b) => a.slot - b.slot).forEach((c, k) => {
          const oy = y + 22 + k * box;
          // their face
          const im = c.img, face = im.naturalWidth * 0.62;
          ctx.save();
          ctx.beginPath(); ctx.arc(x + 20, oy + 18, 14, 0, TAU); ctx.closePath();
          ctx.fillStyle = '#F6E3CF'; ctx.fill(); ctx.clip();
          ctx.drawImage(im, (im.naturalWidth - face) / 2, im.naturalHeight * 0.02, face, face, x + 6, oy + 4, 28, 28);
          ctx.restore();
          ctx.strokeStyle = EDGE; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + 20, oy + 18, 14, 0, TAU); ctx.stroke();
          label(BW.friends.get(c.who).name, x + 40, oy + 18, 11, BROWN, 'left');
          // what they want, ticked off when it's on the tray
          c.order.forEach((id, i) => {
            const iy = oy + 38 + i * 36, done = tray.includes(id);
            food(shop.dishes[id].pic, x + 6, iy, 38, 32);
            label(shop.dishes[id].name.replace(' Cake', ''), x + 47, iy + 16, 9, BROWN, 'left', 700);
            if (done) label('✓', x + w - 10, iy + 6, 14, '#3F7A3A');
          });
        });
      }

      function drawKitchen() {
        ctx.fillStyle = '#8F604A'; ctx.fillRect(0, 0, W, H);
        food(shop.wall, WALL[0], WALL[1], WALL[2], WALL[3]);
        ctx.drawImage(bg, 0, 0, 941, 120, 0, 0, W, TOP);
        drawFrame();
        customers.forEach(drawCustomer);
        drawCounter();
        drawStation();
        drawBins();
        drawTray();
        drawBar();
        drawPills();
        customers.forEach(drawBubble);
      }

      function draw(c) {
        ctx = c;
        ctx.save();
        if (shake > 0) ctx.translate(Math.sin(t * 60) * shake * 10, 0);
        if (!bg.complete || !bg.naturalWidth) { ctx.fillStyle = '#8F604A'; ctx.fillRect(0, 0, W, H); }
        else if (mode === 'menu') drawFront();
        else drawKitchen();
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
