// The cooking games (Sushi Shop, Ramen Shop, Cake & Sweets). shops.js says where everything
// is in Aiman's shop designs.
//  - Front screen: her whole shop picture. START COOKING opens the kitchen, Recipes the book.
//  - Kitchen: her shop's wall at the top with a framed menu board; girls and guys stand in
//    front of it and order from it. Below is your counter: the cooking station (her rice
//    cooker / stove / mixer), the ingredient boxes, your tray, and the recipe bar on the right.
//    Rice and noodles cook first on the station; once they're ready tap them onto your plate
//    (they come out as a round fluffy mound / a noodle nest). Leave them too long and they burn!
//    Everything you add goes onto the plate (or into the ramen bowl) one by one; tap it to serve.
//  - Cake & Sweets bakes instead: put ingredients in the mixing bowl, tap it to bake the
//    cake that recipe makes in the oven, then tap the cake when it's ready to serve it. A shift lasts 90 seconds, and ends early if 3 customers give up.
// Score = orders served; app.js gives 2 stars for every 3.
// Together with a friend (options.duo): straight into the kitchen after a 3-2-1, 4 levels of
// 40 seconds, each busier with less patient customers; hearts refill each level (at 0 you wait
// for the next one). Both "customers served" show in the score box; the most wins.
window.BW = window.BW || {};
BW.games = BW.games || {};

BW.cook = (() => {
  const K = BW.kit, W = K.W, H = K.H, TAU = K.TAU;
  const S = W / 941;                  // design pixels → game pixels (front screen and top bar)
  const TIME = 90, LIVES = 3, MAX_TRAY = 6;
  const COOK_TIME = 2.5, BURN_TIME = 7, BAKE_TIME = 3.5;
  const BROWN = '#5C3B2A', CREAM = '#FFF6EA', EDGE = '#8B5E4A', PINK = '#D2607A';
  const FONT = "'Baloo 2', 'Trebuchet MS', sans-serif";

  // the kitchen view, in game pixels
  const TOP = 120 * S;                // the design's top bar (pills and ≡ button)
  const WALL = [0, TOP, W, 238];      // her shop's wall behind the customers
  let FRAME = [10, 50, 340, 68];      // the menu board hanging on the wall (narrower when playing together)
  const LEVELS = 4, LEVEL_TIME = 40, BREAK = 3;
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
    const orderable = dishIds.filter(id => shop.dishes[id].needs);
    const binIds = Object.keys(shop.ingredients);
    const needsCooking = id => shop.cook.includes(id);
    const cookTime = shop.bake ? BAKE_TIME : COOK_TIME;

    // lay the boxes out in a grid on the counter
    const binCols = binIds.length > 8 ? 5 : 4, binRows = Math.ceil(binIds.length / binCols);
    const binW = BINS[2] / binCols, binH = BINS[3] / binRows;
    const binBox = i => [BINS[0] + (i % binCols) * binW, BINS[1] + Math.floor(i / binCols) * binH, binW, binH];

    function start(canvas, options) {
      const bg = picture(`img/shops/${shop.id}.webp`);
      let ctx = canvas.getContext('2d');
      let mode, book, customers, tray, trayAt, pans, served, lives, timeLeft, spawnIn, shake, tip, t = 0;
      const duo = options.duo;
      let level = 1, lastLevel = 0, onBreak = false;
      FRAME = duo ? [10, 50, 196, 68] : [10, 50, 340, 68];
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
      // the top pills and ≡ button: where they are on the front screen, or in the kitchen's top
      // bar (the Pancake Shop's top bar is a different strip of its design, shop.kitchenUi)
      const box = k => (mode !== 'menu' && shop.kitchenUi && shop.kitchenUi[k]) || shop.ui[k];
      const nameOf = id => shop.ingredients[id].name;

      // ---------- customers ----------

      function spawn() {
        const free = SLOTS.findIndex((x, i) => !customers.some(c => c.slot === i));
        if (free < 0) return;
        const here = customers.map(c => c.who);
        const who = pick(BW.friends.people().filter(p => !here.includes(p.id))).id;
        const order = [pick(orderable)];
        const wait = (duo ? Math.max(14, 32 - (level - 1) * 5 - served * 0.3) : Math.max(15, 30 - served * 0.6)) + (shop.bake ? 6 : 0);
        customers.push({ slot: free, who, img: picture(`img/standing/${who}.webp`), order, wait, left: wait, enter: 0, leaving: 0, happy: false });
      }

      const wants = c => shop.dishes[c.order[0]].needs;
      const ordered = () => customers.filter(c => !c.leaving && c.enter >= 1);

      function serve() {
        if (!tray.length) { say(`Your ${shop.plate} is empty`, TRAY[0] + TRAY[2] / 2, TRAY[1] - 8); return; }
        if (shop.bake) { bake(); return; }
        const c = ordered().find(c => sameSet(tray, wants(c)));
        if (!c) {
          shake = 0.35;
          BW.sound.play('wrong');
          say('Oops! Check the recipe', TRAY[0] + TRAY[2] / 2, TRAY[1] - 8);
          tray = []; trayAt = [];
          return;
        }
        tray = []; trayAt = [];
        thank(c);
      }

      // Cake & Sweets: the mixing bowl goes into the oven as whatever cake its recipe makes
      function bake() {
        const id = orderable.find(d => sameSet(tray, shop.dishes[d].needs));
        if (!id) {
          shake = 0.35;
          BW.sound.play('wrong');
          say("That's not a recipe!", TRAY[0] + TRAY[2] / 2, TRAY[1] - 8);
          tray = []; trayAt = [];
          return;
        }
        const free = pans.indexOf(null);
        if (free < 0) { say('The oven is full', 120, STATION[1] - 6); return; }
        pans[free] = { id, time: 0 };
        BW.sound.play('plop');
        tray = []; trayAt = [];
        say('Into the oven!', PANS[free][0] + PANS[free][2] / 2, PANS[free][1]);
      }

      function thank(c) {
        BW.sound.play('serve');
        if (duo) setTimeout(() => duo.set({ score: served, level }), 0);
        served++;
        c.leaving = 0.01;
        c.happy = true;
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
          BW.sound.play(shop.bake ? 'plop' : 'drop');
          return;
        }
        const i = tray.indexOf(id);
        if (i >= 0) { tray.splice(i, 1); trayAt.splice(i, 1); }   // tap again to take it off
        else if (addToTray(id)) BW.sound.play(shop.bake ? 'mix' : 'plate');
      }

      function tapPan(i) {
        const p = pans[i];
        if (!p) return;
        const box = PANS[i];
        if (p.time >= cookTime + BURN_TIME) {      // burnt: throw it away
          pans[i] = null;
          say('Into the bin!', box[0] + box[2] / 2, box[1]);
        } else if (p.time >= cookTime && shop.bake) {
          // a baked cake goes straight to whoever ordered it
          const c = ordered().find(c => c.order[0] === p.id);
          if (!c) { say('Nobody ordered this yet', box[0] + box[2] / 2, box[1]); return; }
          pans[i] = null;
          thank(c);
        } else if (p.time >= cookTime) {
          if (tray.includes(p.id)) { say(`Already in your ${shop.plate}`, box[0] + box[2] / 2, box[1]); return; }
          if (addToTray(p.id)) { pans[i] = null; BW.sound.play('plate'); }
        } else {
          say('Not ready yet!', box[0] + box[2] / 2, box[1]);
        }
      }

      // ---------- tapping ----------

      function tapFront(x, y) {
        const ui = shop.ui, at = r => within(g(r), x, y);
        if (at(ui.recipes)) { book = true; return; }
        if (at(ui.start)) { mode = 'play'; spawnIn = 0.3; BW.sound.play('click'); return; }
        for (const k of ['upgrade', 'shop', 'trophies', 'decor', 'stats', 'map']) {
          if (at(ui[k])) {
            const r = g(ui[k]);
            say('Coming soon!', Math.min(W - 50, Math.max(50, r[0] + r[2] / 2)), r[1] - 4);
            return;
          }
        }
        for (const id in shop.dishes) if (shop.dishes[id].tap && at(shop.dishes[id].tap)) { tip = { id, life: 2.6 }; return; }
      }

      function tapKitchen(x, y) {
        if (within(TRAY, x, y)) { serve(); return; }
        if (Math.hypot(x - CLEAR[0], y - CLEAR[1]) < CLEAR[2] + 4) { tray = []; trayAt = []; return; }
        for (let i = 0; i < PANS.length; i++) if (within(PANS[i], x, y)) { tapPan(i); return; }
        for (let i = 0; i < binIds.length; i++) if (within(binBox(i), x, y)) { tapBin(binIds[i]); return; }
      }

      function tap(x, y) {
        if (mode === 'over') return;
        if (duo && (Date.now() < duo.startAt || onBreak || lives <= 0)) {
          if (within(g(box('menu')), x, y) && options.pause) options.pause();
          return;
        }
        if (book) { book = false; return; }
        if (within(g(box('menu')), x, y)) { if (options.pause) options.pause(); return; }
        if (mode === 'menu') tapFront(x, y);
        else tapKitchen(x, y);
      }

      // ---------- update ----------

      function update(dt) {
        t += dt;
        fx.update(dt);
        shake = Math.max(0, shake - dt);
        if (tip) { tip.life -= dt; if (tip.life <= 0) tip = null; }
        if (duo && mode !== 'over') {
          // the levels run on the clock both phones share
          const e = (Date.now() - duo.startAt) / 1000;
          if (e < 0) return;
          mode = 'play';
          const slot = LEVEL_TIME + BREAK, n = Math.floor(e / slot);
          if (n >= LEVELS) {
            timeLeft = 0; mode = 'over';
            BW.sound.loop('boil', false); BW.sound.loop('bake', false);
            options.onGameOver(served, { served });
            return;
          }
          level = n + 1;
          onBreak = e - n * slot < BREAK;
          timeLeft = onBreak ? LEVEL_TIME : LEVEL_TIME - (e - n * slot - BREAK);
          if (level !== lastLevel) { lastLevel = level; lives = LIVES; duo.set({ score: served, level }); }
          if (onBreak) return;
        }
        if (mode !== 'play' || book) return;

        BW.sound.loop(shop.bake ? 'bake' : 'boil', pans.some(p => p && p.time < cookTime));
        pans.forEach((p, i) => {
          if (!p) return;
          const before = p.time;
          p.time += dt;
          const box = PANS[i];
          if (before < cookTime && p.time >= cookTime) { fx.add(box[0] + box[2] / 2, box[1] + 34, '#FFFFFF', 8, 90); BW.sound.play('ding'); }
          if (before < cookTime + BURN_TIME && p.time >= cookTime + BURN_TIME) { say('Burnt!', box[0] + box[2] / 2, box[1]); shake = 0.2; BW.sound.play('burn'); }
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
        if (spawnIn <= 0 && customers.length < SLOTS.length && !(duo && lives <= 0)) {
          spawn();
          spawnIn = duo ? Math.max(1.2, 3.4 - level * 0.55) + Math.random() * 1.5 : 3 + Math.random() * 2;
        }
        if (duo) return;     // the clock above decides when it ends

        timeLeft -= dt;
        if (timeLeft <= 0 || lives <= 0) {
          timeLeft = Math.max(0, timeLeft);
          mode = 'over';
          BW.sound.loop('boil', false); BW.sound.loop('bake', false);
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

      // a piece of the design as a round portion (no square corners), for food on the plate
      function portion(r, x, y, w, h) {
        if (!bg.complete || !bg.naturalWidth) return;
        const cx = x + w / 2, cy = y + h / 2, rx = w / 2, ry = h / 2;
        ctx.save();
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.clip();
        // the middle of the picture, where the food is, filling the circle
        const sw = r[2] * 0.7, sh = r[3] * 0.7;
        const k = Math.max(w / sw, h / sh);
        ctx.drawImage(bg, r[0] + (r[2] - sw) / 2, r[1] + (r[3] - sh) / 2, sw, sh, cx - sw * k / 2, cy - sh * k / 2, sw * k, sh * k);
        const rim = ctx.createRadialGradient(cx, cy, Math.min(rx, ry) * 0.6, cx, cy, Math.max(rx, ry));
        rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(70, 40, 25, .28)');
        ctx.fillStyle = rim; ctx.fillRect(x, y, w, h);
        ctx.restore();
        ctx.strokeStyle = 'rgba(91, 70, 80, .55)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.stroke();
      }

      // one thing in the shop: drawn art when it has some, otherwise its piece of the design.
      // o.cooked: rice and noodles look cooked; o.round: a round portion for the plate
      function drawItem(it, x, y, w, h, o) {
        o = o || {};
        if (o.cooked && BW.food.has(o.cooked)) BW.food.draw(ctx, o.cooked, x, y, w, h, t);
        else if (it.art) BW.food.draw(ctx, it.art, x, y, w, h, t);
        else if (o.round) portion(it.pic, x, y, w, h);
        else food(it.pic, x, y, w, h);
      }
      const ing = (id, x, y, w, h, o) => drawItem(shop.ingredients[id], x, y, w, h, o);
      const dish = (id, x, y, w, h) => drawItem(shop.dishes[id], x, y, w, h);

      function panel(x, y, w, h, r, fill) {
        ctx.fillStyle = fill || CREAM;
        K.roundRect(ctx, x, y, w, h, r || 12); ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = EDGE;
        K.roundRect(ctx, x, y, w, h, r || 12); ctx.stroke();
      }

      // the two pills at the top show this game's numbers instead of the painted ones
      function drawPills() {
        const s = g(box('stars')), l = g(box('level'));
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
          bar(l, timeLeft / (duo ? LEVEL_TIME : TIME), timeLeft < 15 ? '#F28C8C' : '#8CC77A');
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
        needs.forEach((id, i) => ing(id, x0 + i * 34 + 2, y + 22, 30, 32));
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

      // the full recipe book, from the front screen
      function drawBook() {
        ctx.fillStyle = 'rgba(40, 25, 20, .55)'; ctx.fillRect(0, 0, W, H);
        const x = 16, y = 60, w = W - 32, h = 530;
        panel(x, y, w, h, 18);
        label(`${shop.title} Recipes`, W / 2, y + 22, 20);
        {
          const rows = orderable.length, rh = Math.min(64, (h - 70) / rows);
          orderable.forEach((id, i) => {
            const d = shop.dishes[id], ry = y + 42 + i * rh;
            if (i) { ctx.strokeStyle = '#EAD9C6'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 12, ry); ctx.lineTo(x + w - 12, ry); ctx.stroke(); }
            dish(id, x + 8, ry + 4, 66, rh - 8);
            label(d.name, x + 82, ry + 11, 12.5, BROWN, 'left');
            const step = Math.min(58, (w - 92) / d.needs.length);
            d.needs.forEach((n, j) => {
              const ix = x + 82 + j * step;
              ing(n, ix, ry + 20, step - 6, rh - 34);
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
          dish(id, cx + 1, cy + 1, cw - 3, ch - 3);
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
        const n = c.order.length, cell = 44;
        const bw = Math.max(60, n * cell + 14), bh = 50;
        const bx = Math.max(4, Math.min(W - 4 - bw, x + 30)), by = head - 4;
        // bubble beside their head, with a little tail pointing at them
        ctx.fillStyle = CREAM; ctx.strokeStyle = EDGE; ctx.lineWidth = 2;
        K.roundRect(ctx, bx, by, bw, bh, 12); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + 1, by + 18); ctx.lineTo(bx - 9, by + 28); ctx.lineTo(bx + 1, by + 30); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = CREAM; ctx.fillRect(bx, by + 19, 3, 10);
        c.order.forEach((id, i) => dish(id, bx + 7 + i * cell, by + 5, cell - 4, bh - 18));
        const p = Math.max(0, c.left / c.wait);
        ctx.fillStyle = '#EAD9C6'; K.roundRect(ctx, bx + 7, by + bh - 10, bw - 14, 5, 2.5); ctx.fill();
        ctx.fillStyle = p > 0.5 ? '#8CC77A' : p > 0.25 ? '#F2C35B' : '#F28C8C';
        K.roundRect(ctx, bx + 7, by + bh - 10, Math.max(5, (bw - 14) * p), 5, 2.5); ctx.fill();
      }

      // the cooking station from her design, and the two cooking spots beside it
      function drawStation() {
        panel(STATION[0], STATION[1], STATION[2], STATION[3], 10, '#F3E2CC');
        if (shop.station.art) BW.food.draw(ctx, shop.station.art, STATION[0] + 6, STATION[1] + 4, STATION[2] - 12, STATION[3] - 18, t, pans.some(p => p && p.time < cookTime));
        else food(shop.station.pic, STATION[0] + 4, STATION[1] + 4, STATION[2] - 8, STATION[3] - 18);
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
          const ready = p.time >= cookTime, burnt = p.time >= cookTime + BURN_TIME;
          ctx.save();
          if (burnt) ctx.filter = 'brightness(.35) sepia(.6)';
          else if (!ready) ctx.globalAlpha = 0.65;
          const bob = ready && !burnt ? Math.sin(t * 8) * 2 : 0;
          if (shop.bake) dish(p.id, cx - 19, cy - 15 + bob, 38, 30);
          else ing(p.id, cx - 19, cy - 15 + bob, 38, 30, { cooked: p.id });
          ctx.restore();
          // progress ring while cooking, then a shrinking "hurry" ring before it burns
          const f = ready ? 1 - (p.time - cookTime) / BURN_TIME : p.time / cookTime;
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
          label(burnt ? 'Burnt! Tap' : ready ? (shop.bake ? 'Ready! Serve' : 'Ready! Tap') : shop.station.verb, cx, y + h - 10, 10, burnt ? '#8A3B3B' : ready ? '#3F7A3A' : BROWN);
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
          ing(id, x + 5, y + 5, w - 10, h - (named ? 22 : 10));
          if (named) label(shortName(id), x + w / 2, y + h - 10, 9.5, BROWN, 'center', 800);
          if (needsCooking(id)) {
            ctx.fillStyle = '#F2C35B'; ctx.beginPath(); ctx.arc(x + w - 9, y + 9, 6, 0, TAU); ctx.fill();
            label('♨', x + w - 9, y + 9.5, 9, BROWN);
          }
        });
      }

      // Things pile up the way the dish is made: the cooked rice / noodles first, then each
      // topping laid on top of it. When the plate holds a whole recipe, it becomes that dish,
      // exactly like its picture on the menu.
      const madeDish = () => !shop.bake && orderable.find(d => sameSet(tray, shop.dishes[d].needs));
      function drawLayers(cx, cy, size, spread, made) {
        const done = madeDish();
        if (done && made) {
          const pop = Math.min(1, (t - Math.max(...trayAt)) * 5);
          const w = made[0] * (0.8 + pop * 0.2), h = made[1] * (0.8 + pop * 0.2);
          // the menu picture in a soft oval, so no square edges show
          const ox = cx - w / 2, oy = cy + made[2] - h / 2;
          ctx.save();
          ctx.beginPath(); ctx.ellipse(cx, oy + h / 2, w / 2, h / 2, 0, 0, TAU); ctx.clip();
          dish(done, ox, oy, w, h);
          ctx.restore();
          if (pop < 1) fx.add(cx, oy + h / 2, '#FFF6C8', 1, 120);
          return;
        }
        const drop = i => (1 - Math.min(1, (t - trayAt[i]) * 6)) * 18;
        const base = tray.map((id, i) => i).filter(i => needsCooking(tray[i]));
        const tops = tray.map((id, i) => i).filter(i => !needsCooking(tray[i]));
        const bs = size * 1.9;
        base.forEach(i => ing(tray[i], cx - bs / 2, cy - bs * 0.42 - drop(i), bs, bs * 0.8, { cooked: tray[i] }));
        tops.forEach((i, k) => {
          let px = cx, py = cy - bs * 0.1 - k * 5, w = size * 1.5, h = size * 0.62;
          if (shop.plate === 'bowl') {
            // toppings float side by side on the noodles
            const n = tops.length;
            px = cx + (n > 1 ? (k / (n - 1) - 0.5) * spread * 0.85 : 0);
            py = cy - 2 - (k % 2) * 4; w = size * 1.05; h = size * 0.75;
          }
          ing(tray[i], px - w / 2, py - h / 2 - drop(i), w, h, { round: true });
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
          drawLayers(cx, top - 2, 32, 58, [132, 98, 10]);
        } else if (shop.plate === 'mixing bowl') {
          // a pink mixing bowl with a whisk; the ingredients pile up inside
          const top = y + 34;
          ctx.strokeStyle = '#B9B4C2'; ctx.lineWidth = 2;
          for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.ellipse(cx + 52 + k * 3, top - 14, 6 - Math.abs(k) * 2, 15, 0.5, 0, TAU); ctx.stroke(); }
          ctx.strokeStyle = '#C98F6B'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx + 58, top - 26); ctx.lineTo(cx + 66, top - 40); ctx.stroke();
          ctx.fillStyle = 'rgba(60, 35, 20, .3)'; ctx.beginPath(); ctx.ellipse(cx, y + h - 6, 56, 8, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = '#F7C6D0'; ctx.strokeStyle = EDGE; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(cx - 70, top); ctx.bezierCurveTo(cx - 66, y + h + 4, cx + 66, y + h + 4, cx + 70, top); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(cx - 40, top + 22, 8, 14, 0.5, 0, TAU); ctx.fill();
          ctx.fillStyle = tray.length ? '#FBEBD3' : '#FBE3E8';
          ctx.beginPath(); ctx.ellipse(cx, top, 68, 13, 0, 0, TAU); ctx.fill(); ctx.stroke();
          drawLayers(cx, top - 2, 34, 50);
        } else {
          // a round cream plate with a brown rim
          const py = y + 58;
          ctx.fillStyle = 'rgba(60, 35, 20, .3)'; ctx.beginPath(); ctx.ellipse(cx, py + 6, 78, 22, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = '#FFFDF8'; ctx.strokeStyle = EDGE; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.ellipse(cx, py, 78, 22, 0, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = '#E3CDB4'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.ellipse(cx, py, 62, 15, 0, 0, TAU); ctx.stroke();
          drawLayers(cx, py - 2, 34, 64, [118, 62, -24]);
        }
        if (!tray.length) label(shop.bake ? 'Mix ingredients here' : 'Add ingredients here', cx, y + 12, 11.5, CREAM, 'center', 800);
        else label(shop.bake ? 'Tap to bake ♥' : 'Tap to serve ♥', cx, y + 10, 12.5, '#FFE3EA', 'center', 800);
        // the Clear button beside it
        const [kx, ky, r] = CLEAR;
        ctx.fillStyle = CREAM; ctx.strokeStyle = EDGE; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(kx, ky, r, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = PINK; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(kx - 6, ky - 10); ctx.lineTo(kx + 6, ky + 2); ctx.moveTo(kx + 6, ky - 10); ctx.lineTo(kx - 6, ky + 2); ctx.stroke();
        label('Clear', kx, ky + 11, 9);
      }

      // the recipe bar on the right: every recipe, the ones being ordered glow pink
      function drawBar() {
        const [x, y, w, h] = BAR;
        panel(x, y, w, h, 12);
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
          dish(id, x + 4, ry + 2, 34, rh - 4);
          label(d.name.replace(' Ramen', '').replace(' Sushi', '').replace(' Cake', ''), x + 41, ry + (big ? 9 : 7), big ? 10.5 : 9, BROWN, 'left', 800);
          const step = (w - 44) / d.needs.length;
          d.needs.forEach((n, j) => ing(n, x + 41 + j * step, ry + (big ? 17 : 13), step - 2, rh - (big ? 19 : 14)));
        });
      }

      function drawKitchen() {
        ctx.fillStyle = '#8F604A'; ctx.fillRect(0, 0, W, H);
        food(shop.wall, WALL[0], WALL[1], WALL[2], WALL[3]);
        const tb = shop.top || [0, 0, 941, 120];
        ctx.drawImage(bg, tb[0], tb[1], tb[2], tb[3], 0, 0, W, TOP);
        drawFrame();
        customers.forEach(drawCustomer);
        drawCounter();
        drawStation();
        drawBins();
        drawTray();
        drawBar();
        drawPills();
        customers.forEach(drawBubble);
        if (duo) {
          K.duoPanel(ctx, duo, served, Number(duo.other().score) || 0, `Level ${level}`, W - 148, 44);
          if (onBreak && mode === 'play') K.levelBanner(ctx, level, level === 4 ? 'The busiest one!' : level === 1 ? 'Cook as much as you can!' : 'Busier, less patient customers');
          if (lives <= 0 && !onBreak && mode === 'play') label('Wait for the next level ♥', W / 2, 250, 16, CREAM);
          if (mode === 'over') label(`Waiting for ${duo.them.name || duo.them.username}…`, W / 2, 250, 16, CREAM);
        }
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
        if (duo) K.countdown(ctx, duo, shop.title);
        if (book) drawBook();
      }

      reset();
      if (duo) { mode = 'play'; timeLeft = LEVEL_TIME; duo.set({ score: 0, level: 1 }); }
      const engine = K.run(canvas, {
        update, draw,
        down: tap,
        keydown(e) {
          if (mode === 'menu' && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); mode = 'play'; }
        }
      });
      return {
        restart() { reset(); mode = 'play'; },
        stop() { BW.sound.loop('boil', false); BW.sound.loop('bake', false); engine.stop(); }
      };
    }

    return { start };
  }

  return { make };
})();

['sushi', 'ramen', 'cake', 'pancake'].forEach(id => { BW.games[id] = BW.cook.make(BW.shops[id]); });
