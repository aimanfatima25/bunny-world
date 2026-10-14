// Fish Maker: the gift for making a jellyfish in Fishy Merge.
// Players pick a shape, colours, pattern, eyes and an extra, give the fish a name,
// and it's saved in their progress (BW.store.data.myFish).
window.BW = window.BW || {};

BW.fishMaker = (() => {
  const INK = '#3B2F4A', TAU = Math.PI * 2;
  const COLORS = ['#FF7FAF', '#F28C28', '#F7C548', '#97C459', '#5DCAA5', '#9FC9F2', '#AFA9EC', '#FFFFFF'];
  const ROWS = [
    { key: 'shape', label: 'Shape', options: [['round', 'Round'], ['long', 'Long'], ['puffy', 'Puffy']] },
    { key: 'body', label: 'Body', colors: true },
    { key: 'fin', label: 'Fins', colors: true },
    { key: 'pattern', label: 'Pattern', options: [['plain', 'Plain'], ['stripes', 'Stripes'], ['spots', 'Spots'], ['hearts', 'Hearts']] },
    { key: 'eyes', label: 'Eyes', options: [['happy', 'Happy'], ['sleepy', 'Sleepy'], ['sparkly', 'Sparkly']] },
    { key: 'extra', label: 'Extra', options: [['none', 'None'], ['bow', 'Bow'], ['crown', 'Crown'], ['glasses', 'Glasses'], ['flower', 'Flower']] }
  ];

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  function randomDesign() {
    return {
      shape: pick(ROWS[0].options)[0],
      body: pick(COLORS),
      fin: pick(COLORS),
      pattern: pick(ROWS[3].options)[0],
      eyes: 'happy',
      extra: 'none',
      name: ''
    };
  }

  // ---------- drawing ----------

  function bodyPath(ctx, shape) {
    ctx.beginPath();
    if (shape === 'long') ctx.ellipse(2, 0, 20, 11, 0, 0, TAU);
    else if (shape === 'puffy') ctx.arc(1, 0, 16, 0, TAU);
    else ctx.ellipse(2, 0, 17, 14, 0, 0, TAU);
  }

  function miniHeart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.8);
    ctx.bezierCurveTo(x - s * 1.5, y - s * 0.2, x - s * 0.9, y - s * 1.4, x, y - s * 0.6);
    ctx.bezierCurveTo(x + s * 0.9, y - s * 1.4, x + s * 1.5, y - s * 0.2, x, y + s * 0.8);
    ctx.fill();
  }

  // Draws a custom fish centred on (0, 0) with radius r, facing right
  function draw(ctx, d, r, t) {
    t = t || 0;
    const lw = 2.4 * 20 / r;
    const wag = Math.sin(t * 6) * 0.15;
    ctx.save();
    ctx.scale(r / 20, r / 20);
    ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = INK;

    // tail
    ctx.fillStyle = d.fin;
    ctx.save(); ctx.translate(d.shape === 'long' ? -16 : -13, 0); ctx.rotate(wag);
    ctx.beginPath();
    ctx.moveTo(2, 0); ctx.lineTo(-9, -10);
    if (d.shape === 'long') ctx.lineTo(-5, 0);
    ctx.lineTo(-9, 10); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // top fin, or spikes for a puffy fish
    if (d.shape === 'puffy') {
      for (let i = 0; i < 10; i++) {
        const a = i * TAU / 10 + 0.3;
        ctx.beginPath();
        ctx.moveTo(1 + Math.cos(a - 0.15) * 15, Math.sin(a - 0.15) * 15);
        ctx.lineTo(1 + Math.cos(a) * 21, Math.sin(a) * 21);
        ctx.lineTo(1 + Math.cos(a + 0.15) * 15, Math.sin(a + 0.15) * 15);
        ctx.fill(); ctx.stroke();
      }
    } else {
      const top = d.shape === 'long' ? -10 : -13;
      ctx.beginPath(); ctx.moveTo(-7, top + 2); ctx.quadraticCurveTo(-1, top - 9, 8, top + 1); ctx.closePath();
      ctx.fill(); ctx.stroke();
    }

    // body and pattern
    ctx.fillStyle = d.body;
    bodyPath(ctx, d.shape); ctx.fill();
    ctx.save();
    bodyPath(ctx, d.shape); ctx.clip();
    ctx.fillStyle = d.body === '#FFFFFF' ? 'rgba(255,127,175,.75)' : 'rgba(255,255,255,.7)';
    if (d.pattern === 'stripes') { ctx.fillRect(-8, -20, 4.5, 40); ctx.fillRect(2, -20, 4, 40); }
    else if (d.pattern === 'spots') {
      [[-7, -5, 3], [-1, 6, 2.6], [-11, 4, 2], [4, -8, 2.2], [-3, -10, 1.6]].forEach(([x, y, s]) => { ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill(); });
    } else if (d.pattern === 'hearts') { miniHeart(ctx, -6, -3, 3.2); miniHeart(ctx, 1, 7, 2.6); miniHeart(ctx, -12, 6, 2); }
    ctx.restore();
    bodyPath(ctx, d.shape); ctx.stroke();

    // side fin
    ctx.fillStyle = d.fin; ctx.lineWidth = lw * 0.8;
    ctx.beginPath(); ctx.ellipse(-1, 5, 5.5, 3, 0.5 + wag, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.lineWidth = lw;

    // face
    const ex = 10, ey = -3;
    ctx.fillStyle = INK;
    if (d.eyes === 'sleepy') {
      ctx.beginPath(); ctx.arc(ex, ey, 2.6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    } else if (d.eyes === 'sparkly') {
      ctx.beginPath(); ctx.arc(ex, ey, 3.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(ex + 1.2, ey - 1.2, 1.3, 0, TAU); ctx.arc(ex - 1.2, ey + 1.3, 0.7, 0, TAU); ctx.fill();
      ctx.lineWidth = lw * 0.6;
      ctx.beginPath(); ctx.moveTo(ex - 2, ey - 3.6); ctx.lineTo(ex - 3.4, ey - 6); ctx.moveTo(ex + 1, ey - 4); ctx.lineTo(ex + 1.4, ey - 6.6); ctx.stroke();
      ctx.lineWidth = lw;
    } else {
      ctx.beginPath(); ctx.arc(ex, ey, 2.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(ex + 0.8, ey - 0.8, 0.8, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#FFB3CB'; ctx.beginPath(); ctx.ellipse(8, 4, 2.6, 1.6, 0, 0, TAU); ctx.fill();
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath(); ctx.moveTo(12.5, 3.5); ctx.quadraticCurveTo(14.5, 5, 16.5, 3); ctx.stroke();
    ctx.lineWidth = lw;

    // extra
    if (d.extra === 'bow') {
      ctx.save(); ctx.translate(-2, -14); ctx.rotate(-0.3);
      ctx.fillStyle = '#FF7FAF'; ctx.lineWidth = lw * 0.8;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, -5); ctx.lineTo(-8, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(8, -5); ctx.lineTo(8, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
    } else if (d.extra === 'crown') {
      ctx.fillStyle = '#F7C548';
      ctx.beginPath();
      ctx.moveTo(-5, -11); ctx.lineTo(-6, -20); ctx.lineTo(-1.5, -15.5); ctx.lineTo(2, -22); ctx.lineTo(5, -15.5); ctx.lineTo(9.5, -20); ctx.lineTo(8.5, -11); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (d.extra === 'glasses') {
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = lw * 0.9;
      ctx.beginPath(); ctx.arc(ex, ey, 4.8, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex - 4.8, ey); ctx.lineTo(-3, -4); ctx.stroke();
      ctx.lineWidth = lw;
    } else if (d.extra === 'flower') {
      ctx.save(); ctx.translate(-3, -14);
      ctx.fillStyle = '#FFC2D6'; ctx.lineWidth = lw * 0.7;
      for (let i = 0; i < 5; i++) {
        const a = i * TAU / 5;
        ctx.beginPath(); ctx.arc(Math.cos(a) * 3.6, Math.sin(a) * 3.6, 2.8, 0, TAU); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = '#F7C548'; ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- the maker screen ----------

  const $ = id => document.getElementById(id);
  let design = null, raf = 0, onDone = null;

  function fitPreview() {
    const canvas = $('makerCanvas');
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(canvas.width / 200, 0, 0, canvas.height / 130, 0, 0);
    return ctx;
  }

  function loop(now) {
    const ctx = $('makerCanvas').getContext('2d');
    const t = now / 1000;
    ctx.clearRect(0, 0, 200, 130);
    ctx.strokeStyle = 'rgba(159,201,242,.8)'; ctx.lineWidth = 1.5;
    [[30, 100, 4], [170, 30, 5], [160, 105, 3]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y - (t * 10 % 20), r, 0, TAU); ctx.stroke(); });
    ctx.save(); ctx.translate(104, 66 + Math.sin(t * 2) * 4);
    draw(ctx, design, 46, t);
    ctx.restore();
    raf = requestAnimationFrame(loop);
  }

  function renderRows() {
    const box = $('makerRows');
    box.innerHTML = '';
    ROWS.forEach(row => {
      const div = document.createElement('div');
      div.className = 'mrow';
      div.innerHTML = `<span>${row.label}</span><div class="chips" role="radiogroup" aria-label="${row.label}"></div>`;
      const chips = div.querySelector('.chips');
      const list = row.colors ? COLORS.map(c => [c, '']) : row.options;
      list.forEach(([value, label]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(design[row.key] === value));
        if (row.colors) {
          b.className = 'swatch';
          b.style.background = value;
          b.setAttribute('aria-label', `${row.label} colour ${COLORS.indexOf(value) + 1}`);
        } else {
          b.className = 'chip';
          b.textContent = label;
        }
        b.addEventListener('click', () => {
          design[row.key] = value;
          chips.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', String(x === b)));
        });
        chips.appendChild(b);
      });
      box.appendChild(div);
    });
  }

  function open(done) {
    onDone = done;
    design = randomDesign();
    $('fishName').value = '';
    $('maker').hidden = false;
    $('makerCount').textContent = (BW.store.data.myFish || []).length;
    renderRows();
    fitPreview();
    raf = requestAnimationFrame(loop);
  }

  function save() {
    design.name = $('fishName').value.trim().slice(0, 12) || 'My fish';
    BW.store.addCustomFish(design);
    cancelAnimationFrame(raf);
    $('maker').hidden = true;
    const d = design, cb = onDone;
    onDone = null;
    if (cb) cb(d);
  }

  function isOpen() { return !$('maker').hidden; }

  document.addEventListener('DOMContentLoaded', () => {
    $('makerSave').addEventListener('click', save);
    window.addEventListener('resize', () => { if (isOpen()) fitPreview(); });
  });

  return { draw, open, isOpen };
})();
