// Dress Up: pick one of your girls, then dress her in the outfits and accessories from
// Aiman's Dress-Up Room design (cut by assets/cut-dressup.mjs into img/dressup/), add makeup,
// and pick a background. Some things are free, the rest cost stars. "Done" saves the look for
// that girl, and she wears it at home too; "Her outfit" puts her own clothes back on.
//
// A look: { dress: 1..18 | null, acc: ['bow', ...], makeup: { blush, lips, shadow, freckles, sparkle }, bg }
// Everything is placed on the girl by her height (all the standing girls share one shape):
// the dress from her shoulders to her knees, the doll's arms coming out of its sleeves.
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

  // accessories: where they sit, in parts of the girl's height from the middle of her head
  // (x) and from the top of the picture (y), and how big (w)
  const ACCS = [
    { id: 'bow', n: 1, name: 'Ribbon Bow', price: 0, x: 0.12, y: 0.06, w: 0.1, rot: 0.25 },
    { id: 'pins', n: 2, name: 'Hair Pins', price: 60, x: -0.13, y: 0.15, w: 0.085, rot: -0.5 },
    { id: 'headband', n: 3, name: 'Headband', price: 80, x: 0, y: 0.068, w: 0.2, sy: 0.55 },
    { id: 'beret', n: 4, name: 'Beret', price: 120, x: 0.015, y: 0.06, w: 0.25, rot: 0.08 },
    { id: 'glasses', n: 5, name: 'Round Glasses', price: 0, x: 0, y: 0.264, w: 0.125 },
    { id: 'bag', n: 6, name: 'Shoulder Bag', price: 100, x: 0.16, y: 0.6, w: 0.13 },
    { id: 'bunny', n: 7, name: 'Bunny Plush', price: 150, x: -0.165, y: 0.65, w: 0.12 }
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

  // The girl wearing a look, drawn onto a new canvas (a bit wider than her picture so wide
  // sleeves fit). Resolves to null if her picture can't load.
  async function render(girl, look) {
    const body = await pic(`img/standing/${girl}.webp`);
    if (!body) return null;
    const h = body.naturalHeight, w = body.naturalWidth, W = Math.round(w * 1.25), cx = W / 2;
    const c = document.createElement('canvas');
    c.width = W; c.height = h;
    const ctx = c.getContext('2d');
    ctx.drawImage(body, (W - w) / 2, 0, w, h);
    if (look && look.dress) {
      const [dress, arm, sl] = await Promise.all([pic(`img/dressup/dress/${look.dress}.webp`), pic('img/dressup/arm.webp'), sleeveData()]);
      if (dress) {
        const dh = h * 0.43, dw = dh * dress.naturalWidth / dress.naturalHeight, dx = cx - dw / 2, dy = h * 0.35;
        const s = sl[look.dress - 1];
        if (arm && s) {
          // full arms: the doll's arm under each sleeve (mirrored for the left one)
          const ah = h * 0.22, aw = ah * arm.naturalWidth / arm.naturalHeight;
          [[s.left, -1], [s.right, 1]].forEach(([p, flip]) => {
            ctx.save();
            ctx.translate(dx + p[0] * dw, dy + p[1] * dh - ah * 0.45);
            ctx.scale(flip, 1);
            ctx.drawImage(arm, -aw / 2, 0, aw, ah);
            ctx.restore();
          });
        }
        ctx.drawImage(dress, dx, dy, dw, dh);
      }
    }
    if (look) {
      drawMakeup(ctx, cx, h, look.makeup || {});
      for (const id of look.acc || []) {
        const a = ACCS.find(x => x.id === id);
        const im = a && await pic(`img/dressup/acc/${a.n}.webp`);
        if (!im) continue;
        const aw = h * a.w, ah = aw * im.naturalHeight / im.naturalWidth * (a.sy || 1);
        ctx.save();
        ctx.translate(cx + a.x * h, a.y * h);
        if (a.rot) ctx.rotate(a.rot);
        ctx.drawImage(im, -aw / 2, -ah / 2, aw, ah);
        ctx.restore();
      }
    }
    return c;
  }

  // soft makeup on her face (eyes sit at about a quarter of her height)
  function drawMakeup(ctx, cx, h, m) {
    const eyeY = h * 0.264, eyeX = h * 0.039;
    ctx.save();
    if (m.shadow && m.shadow !== 'none') {
      ctx.globalAlpha = 0.35; ctx.fillStyle = m.shadow;
      [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(cx + s * eyeX, eyeY - h * 0.016, h * 0.022, h * 0.009, 0, Math.PI, 0); ctx.fill(); });
    }
    if (m.blush && m.blush !== 'none') {
      [-1, 1].forEach(s => {
        const x = cx + s * h * 0.062, y = h * 0.292, r = h * 0.024;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, m.blush); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = 0.55; ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      });
    }
    if (m.lips && m.lips !== 'none') {
      ctx.globalAlpha = 0.8; ctx.fillStyle = m.lips;
      ctx.beginPath(); ctx.ellipse(cx, h * 0.302, h * 0.007, h * 0.0045, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (m.freckles === 'on') {
      ctx.globalAlpha = 0.55; ctx.fillStyle = '#B9805F';
      [-1, 1].forEach(s => [[0.05, 0.283], [0.062, 0.279], [0.057, 0.288], [0.07, 0.285]].forEach(([fx, fy]) => {
        ctx.beginPath(); ctx.arc(cx + s * fx * h, fy * h, h * 0.0025, 0, Math.PI * 2); ctx.fill();
      }));
    }
    if (m.sparkle === 'on') {
      ctx.globalAlpha = 0.95; ctx.fillStyle = '#FFFFFF';
      [[-0.075, 0.27, 0.012], [0.08, 0.255, 0.009], [0.07, 0.3, 0.007]].forEach(([sx, sy, r]) => star(ctx, cx + sx * h, sy * h, r * h));
    }
    ctx.restore();
  }
  function star(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.3 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  }

  // the girl as a picture for <img> tags (home scene), or her plain picture with no look
  const urls = {};
  async function pictureOf(girl) {
    const look = looks()[girl];
    if (!look) return `img/standing/${girl}.webp`;
    const key = girl + JSON.stringify(look);
    if (!urls[key]) {
      const c = await render(girl, look);
      urls[key] = c ? c.toDataURL('image/png') : `img/standing/${girl}.webp`;
    }
    return urls[key];
  }

  // ---------- the screen ----------

  let girl = null, look = null, tab = 'dress', onClose = null;

  function open(done) {
    onClose = done;
    const people = BW.friends.list.filter(f => f.group === 'girls' && store.owns(f.id));
    const grid = $('dollGrid');
    grid.innerHTML = '';
    people.forEach(f => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'doll-pick';
      b.innerHTML = `<img alt=""><span>${f.name}</span>`;
      pictureOf(f.id).then(src => { b.querySelector('img').src = src; });
      b.addEventListener('click', () => { BW.sound.play('click'); start(f.id); });
      grid.appendChild(b);
    });
    $('dollPicker').hidden = false;
    BW.sound.music('dress');
  }

  function start(id) {
    girl = id;
    look = JSON.parse(JSON.stringify(looks()[id] || empty()));
    $('dollPicker').hidden = true;
    $('dressup').hidden = false;
    $('dressName').textContent = BW.friends.get(id).name;
    tab = 'dress';
    showStars();
    renderTabs();
    renderItems();
    redraw();
  }

  function close() {
    $('dressup').hidden = true;
    $('dollPicker').hidden = true;
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
    const c = await render(girl, look);
    if (mine !== drawing || !c) return;
    const box = $('dressDoll');
    box.innerHTML = '';
    c.className = 'dress-doll';
    box.appendChild(c);
  }

  const TABS = [['dress', 'Dress'], ['hair', 'Hair'], ['makeup', 'Makeup'], ['accessories', 'Accessories'], ['background', 'Background']];
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
      box.appendChild(card({ name: 'Her outfit', img: `img/standing/${girl}.webp`, on: !look.dress, wide: false,
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
    if (blank) delete looks()[girl]; else looks()[girl] = JSON.parse(JSON.stringify(look));
    store.save();
  }

  function wire() {
    document.querySelectorAll('.dress-side button[data-tab]').forEach(b => b.addEventListener('click', () => {
      BW.sound.play('click'); tab = b.dataset.tab; renderTabs(); renderItems();
    }));
    $('dressSave').addEventListener('click', () => { save(); BW.sound.play('sparkle'); BW.app.toast(`${BW.friends.get(girl).name}'s look is saved ♥`); });
    $('dressDone').addEventListener('click', () => {
      save();
      BW.sound.play('sparkle');
      // she becomes the girl at home, wearing her new look
      store.setGirl(girl);
      close();
    });
    $('dressReset').addEventListener('click', () => { BW.sound.play('swipe'); look = empty(); renderItems(); redraw(); });
    $('dressBack').addEventListener('click', close);
    $('dollBack').addEventListener('click', close);
  }

  return { open, wire, pictureOf, render };
})();
