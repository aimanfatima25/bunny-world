// Dress Up: dress the doll from Aiman's Pastel Kawaii Dress-Up Room design in its outfits and
// accessories (all cut by assets/cut-dressup.mjs into img/dressup/), add makeup, and pick a
// background. Some things are free, the rest cost stars. "Done" saves the look and she stands
// at home wearing it; "My girl's own look" puts your chosen girl back at home in her own clothes.
// (Dressing the doll, who only wears a camisole and shorts, looks natural; the other girls
// can become dolls too once the hair sheet gives the doll their hairstyles.)
//
// A look: { dress: 1..18 | null, acc: ['bow', ...], makeup: { blush, lips, shadow, freckles, sparkle }, bg }
// Everything is placed in the doll's own picture (img/dressup/doll.webp, 348 x 710):
// the dress from her shoulders to her knees, her arm coming out of each sleeve.
window.BW = window.BW || {};

BW.dressup = (() => {
  const $ = id => document.getElementById(id);
  const store = BW.store;

  // ---------- what there is ----------

  const DRESS_NAMES = ['Pink Frill Dress', 'Cream Ribbon Dress', 'Black Sailor Dress', 'Blue Sailor Set', 'Pink Hoodie Set',
    'Sage Pinafore', 'Brown Plaid Dress', 'Black Bow Dress', 'Sky Smock Dress', 'Cozy Cardigan Set', 'Red Uniform',
    'Denim Overall Set', 'Cream Overall Set', 'Strawberry Frill Dress', 'Black Coat Set', 'Butter Bow Dress',
    'Navy Pinafore', 'Lilac Collar Set'];
  const FREE_DRESSES = [1, 2, 6, 9, 14, 16];
  const DRESS_PRICES = [0, 0, 150, 150, 120, 0, 180, 200, 0, 160, 200, 180, 160, 0, 250, 0, 180, 220];
  const DRESSES = DRESS_NAMES.map((name, i) => ({ id: 'dress-' + (i + 1), n: i + 1, name, price: FREE_DRESSES.includes(i + 1) ? 0 : DRESS_PRICES[i] }));

  // the doll: her picture's size, the middle of her body and of her face (doll pixels)
  const DOLL = { w: 348, h: 710, body: 178, face: 172 };
  // accessories: where their middle sits, in doll pixels from the middle of her face (x) and
  // from the top (y), and how wide (w)
  const ACCS = [
    { id: 'bow', n: 1, name: 'Ribbon Bow', price: 0, x: 86, y: 52, w: 66, rot: 0.3 },
    { id: 'pins', n: 2, name: 'Hair Pins', price: 60, x: -88, y: 150, w: 54, rot: -0.6 },
    { id: 'headband', n: 3, name: 'Headband', price: 80, x: 4, y: 62, w: 214, sy: 0.45 },
    { id: 'beret', n: 4, name: 'Beret', price: 120, x: 10, y: 52, w: 220, rot: 0.08 },
    { id: 'glasses', n: 5, name: 'Round Glasses', price: 0, x: 8, y: 192, w: 132 },
    { id: 'bag', n: 6, name: 'Shoulder Bag', price: 100, x: 104, y: 450, w: 84 },
    { id: 'bunny', n: 7, name: 'Bunny Plush', price: 150, x: -96, y: 470, w: 80 }
  ];
  // only one thing on top of the head at a time
  const ON_HEAD = ['headband', 'beret'];

  const MAKEUP = {
    blush: { name: 'Blush', options: [['none', 'None', 0], ['#FF9FB2', 'Pink', 0], ['#FFB38A', 'Peach', 0], ['#E8768C', 'Rose', 60]] },
    lips: { name: 'Lips', options: [['none', 'None', 0], ['#F27C97', 'Pink', 0], ['#F59A7A', 'Peach', 0], ['#D9455F', 'Red', 60]] },
    shadow: { name: 'Eyeshadow', options: [['none', 'None', 0], ['#F6A9BC', 'Pink', 40], ['#C99A7A', 'Brown', 40], ['#B9A3E8', 'Lilac', 60]] },
    freckles: { name: 'Freckles', options: [['none', 'None', 0], ['on', 'Freckles', 50]] },
    sparkle: { name: 'Sparkles', options: [['none', 'None', 0], ['on', 'Sparkles', 100]] }
  };

  const BACKGROUNDS = [
    { id: 'cottage', name: 'Cottage', src: 'img/ui/scene-wall.webp' },
    { id: 'sakura', name: 'Sakura', src: 'img/shops/sushi.webp', crop: [130, 120, 680, 760] },
    { id: 'ramen', name: 'Ramen Shop', src: 'img/shops/ramen.webp', crop: [130, 150, 680, 700] },
    { id: 'bakery', name: 'Bakery', src: 'img/shops/cake.webp', crop: [130, 140, 680, 640] }
  ];

  const empty = () => ({ dress: null, acc: [], makeup: { blush: 'none', lips: 'none', shadow: 'none', freckles: 'none', sparkle: 'none' }, bg: 'cottage' });
  const looks = () => (store.data.looks = store.data.looks || {});
  const owned = () => (store.data.wardrobe = store.data.wardrobe || []);
  const isFree = id => priceOf(id) === 0;
  const has = id => isFree(id) || owned().includes(id);
  function priceOf(id) {
    const d = DRESSES.find(x => x.id === id) || ACCS.find(x => x.id === id);
    if (d) return d.price;
    const [kind, value] = id.split(':');
    const opt = MAKEUP[kind] && MAKEUP[kind].options.find(o => o[0] === value);
    return opt ? opt[2] : 0;
  }

  // ---------- pictures ----------

  const cache = {};
  function pic(src) {
    if (!cache[src]) {
      const im = new Image();
      cache[src] = new Promise(res => { im.onload = () => res(im); im.onerror = () => res(null); });
      im.src = src;
    }
    return cache[src];
  }
  let sleeves = null;
  async function sleeveData() {
    if (!sleeves) sleeves = await fetch('img/dressup/sleeves.json').then(r => r.json()).catch(() => []);
    return sleeves;
  }

  // The doll wearing a look, drawn onto a new canvas (a bit wider than her picture so wide
  // sleeves fit). Resolves to null if her picture can't load.
  async function render(look) {
    const body = await pic('img/dressup/doll.webp');
    if (!body) return null;
    const { h } = DOLL, W = Math.round(DOLL.w * 1.2), ox = W / 2 - DOLL.body;
    const c = document.createElement('canvas');
    c.width = W; c.height = h;
    const ctx = c.getContext('2d');
    ctx.drawImage(body, ox, 0);
    if (look && look.dress) {
      const [dress, arm, sl, hair] = await Promise.all([pic(`img/dressup/dress/${look.dress}.webp`), pic('img/dressup/arm.webp'), sleeveData(), pic('img/dressup/hair-front.webp')]);
      if (dress) {
        const dh = h * 0.4225, dw = dh * dress.naturalWidth / dress.naturalHeight, dx = W / 2 - dw / 2, dy = h * 0.352;
        const s = sl[look.dress - 1];
        // her arms coming out of each sleeve (mirrored for the left one). belowSleeve draws the
        // arm again from the sleeve's hem down, over the dress and her hair, so the whole arm
        // and hand always show
        const arms = belowSleeve => {
          if (!arm || !s) return;
          const ah = h * 0.26, aw = ah * arm.naturalWidth / arm.naturalHeight;
          [[s.left, -1], [s.right, 1]].forEach(([p, flip]) => {
            const top = dy + p[1] * dh - ah * 0.45;
            ctx.save();
            if (belowSleeve) { ctx.beginPath(); ctx.rect(0, dy + p[1] * dh + 2, W, h); ctx.clip(); }
            ctx.translate(dx + p[0] * dw, top);
            ctx.scale(flip, 1);
            ctx.drawImage(arm, -aw / 2, 0, aw, ah);
            ctx.restore();
          });
        };
        arms(false);
        // skin over her camisole's top, so an open neckline shows her neck and chest, not the camisole
        const fx = ox + DOLL.face, top = 252;
        const g = ctx.createLinearGradient(0, top - 8, 0, top + 6);
        g.addColorStop(0, 'rgba(251, 214, 203, 0)'); g.addColorStop(1, '#FBD6CB');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(fx + 4, top + 40, 56, 48, 0, Math.PI, 0); ctx.lineTo(fx + 60, top + 90); ctx.lineTo(fx - 52, top + 90); ctx.closePath(); ctx.fill();
        ctx.drawImage(dress, dx, dy, dw, dh);
        // her long hair falls in front of the dress's shoulders
        if (hair) ctx.drawImage(hair, ox, 0);
        arms(true);
      }
    }
    if (look) {
      const fx = ox + DOLL.face;
      drawMakeup(ctx, fx, look.makeup || {});
      for (const id of look.acc || []) {
        const a = ACCS.find(x => x.id === id);
        const im = a && await pic(`img/dressup/acc/${a.n}.webp`);
        if (!im) continue;
        const aw = a.w, ah = aw * im.naturalHeight / im.naturalWidth * (a.sy || 1);
        ctx.save();
        ctx.translate(fx + a.x, a.y);
        if (a.rot) ctx.rotate(a.rot);
        ctx.drawImage(im, -aw / 2, -ah / 2, aw, ah);
        ctx.restore();
      }
    }
    return c;
  }

  // soft makeup on her face (doll pixels: eyes at 190, cheeks at 228, mouth at 213)
  function drawMakeup(ctx, fx, m) {
    ctx.save();
    if (m.shadow && m.shadow !== 'none') {
      ctx.globalAlpha = 0.35; ctx.fillStyle = m.shadow;
      [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(fx + s * 38, 172, 20, 9, 0, Math.PI, 0); ctx.fill(); });
    }
    if (m.blush && m.blush !== 'none') {
      [-1, 1].forEach(s => {
        const x = fx + s * 56, y = 228, r = 20;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, m.blush); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = 0.6; ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      });
    }
    if (m.lips && m.lips !== 'none') {
      ctx.globalAlpha = 0.85; ctx.fillStyle = m.lips;
      ctx.beginPath(); ctx.ellipse(fx + 2, 214, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (m.freckles === 'on') {
      ctx.globalAlpha = 0.55; ctx.fillStyle = '#B9805F';
      [-1, 1].forEach(s => [[44, 218], [54, 214], [50, 224], [62, 220]].forEach(([dx, y]) => {
        ctx.beginPath(); ctx.arc(fx + s * dx, y, 1.8, 0, Math.PI * 2); ctx.fill();
      }));
    }
    if (m.sparkle === 'on') {
      ctx.globalAlpha = 0.95; ctx.fillStyle = '#FFFFFF';
      [[-62, 196, 9], [64, 182, 7], [58, 244, 5]].forEach(([dx, y, r]) => star(ctx, fx + dx, y, r));
    }
    ctx.restore();
  }
  function star(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.3 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  }

  // Who stands at home: the dressed doll after "Done", or your chosen girl in her own clothes.
  // Resolves to { src, dressed }.
  const urls = {};
  async function homePicture(girl) {
    const look = looks().doll;
    if (!store.data.dollAtHome || !look) return { src: `img/standing/${girl}.webp`, dressed: false };
    const key = JSON.stringify(look);
    if (!urls[key]) {
      const c = await render(look);
      urls[key] = c ? c.toDataURL('image/png') : null;
    }
    return urls[key] ? { src: urls[key], dressed: true } : { src: `img/standing/${girl}.webp`, dressed: false };
  }

  // ---------- the screen ----------

  let girl = null, look = null, tab = 'dress', onClose = null;

  function open(done) {
    onClose = done;
    girl = BW.friends.get(store.data.girl) ? store.data.girl : 'girl-1';
    look = JSON.parse(JSON.stringify(looks().doll || empty()));
    look.acc = [];
    $('dressup').hidden = false;
    $('dressName').textContent = 'My Girl';
    tab = 'dress';
    BW.sound.music('dress');
    showStars();
    renderTabs();
    renderItems();
    redraw();
  }

  function close() {
    $('dressup').hidden = true;
    BW.sound.music('home');
    if (onClose) onClose();
  }

  function showStars() { $('dressStars').textContent = store.data.coins.toLocaleString('en-US'); }

  let drawing = 0;
  async function redraw() {
    const mine = ++drawing;
    const bg = BACKGROUNDS.find(b => b.id === look.bg) || BACKGROUNDS[0];
    const stage = $('dressStage');
    stage.style.backgroundImage = `url(${bg.src})`;
    stage.className = 'dress-stage bg-' + bg.id;
    const c = await render(look);
    if (mine !== drawing || !c) return;
    const box = $('dressDoll');
    box.innerHTML = '';
    c.className = 'dress-doll';
    box.appendChild(c);
  }

  // (Accessories and Hair were taken out at Aiman's request; ACCS stays for later)
  const TABS = [['dress', 'Dress'], ['makeup', 'Makeup'], ['background', 'Background']];
  function renderTabs() {
    document.querySelectorAll('.dress-side button[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    $('dressPanelTitle').textContent = TABS.find(t => t[0] === tab)[1];
  }

  // one card in the right-hand panel
  function card(opts) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dress-item' + (opts.on ? ' on' : '') + (opts.locked ? ' locked' : '') + (opts.wide ? ' wide' : '');
    b.innerHTML = (opts.img ? `<img src="${opts.img}" alt="">` : '') + (opts.swatch ? `<i class="swatch" style="${opts.swatch}"></i>` : '')
      + `<span>${opts.name}</span>` + (opts.locked ? `<em><img src="img/ui/star.webp" alt="">${opts.price}</em>` : '');
    b.setAttribute('aria-label', opts.name + (opts.locked ? `, ${opts.price} stars` : '') + (opts.on ? ', wearing' : ''));
    b.addEventListener('click', opts.tap);
    return b;
  }

  // tapping something you don't have yet buys it (if you have the stars)
  function tryWear(id, wear) {
    if (!has(id)) {
      const price = priceOf(id);
      if (store.data.coins < price) { BW.app.toast(`You need ${price - store.data.coins} more stars`); BW.sound.play('wrong'); return; }
      store.addCoins(-price);
      owned().push(id);
      store.save();
      BW.sound.play('coin');
      BW.app.toast('Unlocked! ♥');
      showStars();
    } else BW.sound.play('swipe');
    wear();
    renderItems();
    redraw();
  }

  function renderItems() {
    const box = $('dressItems');
    box.innerHTML = '';
    box.className = 'dress-items';
    if (tab === 'dress') {
      // your chosen girl back at home in her own clothes
      box.appendChild(card({ name: `${BW.friends.get(girl).name}'s own look`, img: `img/standing/${girl}.webp`, on: !store.data.dollAtHome,
        tap: () => {
          BW.sound.play('swipe');
          store.data.dollAtHome = false; store.save();
          BW.app.toast(`${BW.friends.get(girl).name} is wearing her own outfit at home ♥`);
          close();
        } }));
      box.appendChild(card({ name: 'No dress', img: 'img/dressup/doll.webp', on: !look.dress,
        tap: () => { BW.sound.play('swipe'); look.dress = null; renderItems(); redraw(); } }));
      DRESSES.forEach(d => box.appendChild(card({
        name: d.name, img: `img/dressup/dress/${d.n}.webp`, on: look.dress === d.n, locked: !has(d.id), price: d.price,
        tap: () => tryWear(d.id, () => { look.dress = look.dress === d.n ? null : d.n; })
      })));
    } else if (tab === 'accessories') {
      ACCS.forEach(a => box.appendChild(card({
        name: a.name, img: `img/dressup/acc/${a.n}.webp`, on: look.acc.includes(a.id), locked: !has(a.id), price: a.price,
        tap: () => tryWear(a.id, () => {
          if (look.acc.includes(a.id)) look.acc = look.acc.filter(x => x !== a.id);
          else {
            if (ON_HEAD.includes(a.id)) look.acc = look.acc.filter(x => !ON_HEAD.includes(x));
            look.acc.push(a.id);
          }
        })
      })));
    } else if (tab === 'makeup') {
      box.className = 'dress-items list';
      Object.entries(MAKEUP).forEach(([kind, m]) => {
        const h = document.createElement('h4'); h.textContent = m.name; box.appendChild(h);
        m.options.forEach(([value, name, price]) => {
          const id = `${kind}:${value}`;
          const swatch = value === 'none' ? 'background:#FFF;border:1.5px dashed #C9B3A4'
            : value === 'on' ? (kind === 'sparkle' ? 'background:radial-gradient(#FFF 30%, #F9D77E)' : 'background:radial-gradient(circle at 30% 40%, #B9805F 2px, transparent 3px), radial-gradient(circle at 65% 60%, #B9805F 2px, transparent 3px), #FFE5D6')
            : `background:${value}`;
          box.appendChild(card({ name, swatch, on: look.makeup[kind] === value, locked: !has(id), price,
            tap: () => tryWear(id, () => { look.makeup[kind] = value; }) }));
        });
      });
    } else if (tab === 'background') {
      BACKGROUNDS.forEach(b => box.appendChild(card({ name: b.name, img: b.src, on: look.bg === b.id,
        tap: () => { BW.sound.play('swipe'); look.bg = b.id; renderItems(); redraw(); } })));
    } else if (tab === 'hair') {
      box.innerHTML = `<p class="dress-note">Every girl keeps her own lovely hair for now.<br><br>New hairstyles come with the hair sheet ♥</p>`;
    }
    box.scrollTop = 0;
  }

  function save() {
    const blank = !look.dress && !look.acc.length && Object.values(look.makeup).every(v => v === 'none') && look.bg === 'cottage';
    if (blank) delete looks().doll; else looks().doll = JSON.parse(JSON.stringify(look));
    store.save();
  }

  function wire() {
    document.querySelectorAll('.dress-side button[data-tab]').forEach(b => b.addEventListener('click', () => {
      BW.sound.play('click'); tab = b.dataset.tab; renderTabs(); renderItems();
    }));
    $('dressSave').addEventListener('click', () => { save(); BW.sound.play('sparkle'); BW.app.toast('Look saved ♥'); });
    $('dressDone').addEventListener('click', () => {
      save();
      BW.sound.play('sparkle');
      // she stands at home wearing her new look
      store.data.dollAtHome = !!looks().doll;
      store.save();
      close();
    });
    $('dressReset').addEventListener('click', () => { BW.sound.play('swipe'); look = empty(); renderItems(); redraw(); });
    $('dressBack').addEventListener('click', close);
  }

  return { open, wire, homePicture, render };
})();
