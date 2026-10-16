// Your Kawaii Corner account: a unique username others can find you by, friends, and
// sharing your ID card. Talks to the server (server/server.js) at api.aimanfatima.com.
// Your secret player id (store.playerId) proves it's you; it's never shown to anyone.
// Every call returns null instead of throwing when the server can't be reached.
window.BW = window.BW || {};

BW.account = (() => {
  const store = BW.store;
  // While testing on this computer (port 8765) use a local server; everywhere else the real one
  const API = location.port === '8765' ? 'http://localhost:3000' : 'https://api.aimanfatima.com';
  const SITE = 'https://kawaiicorner.aimanfatima.com';
  const USERNAME = /^[a-z0-9](?:[a-z0-9_.]{1,13})[a-z0-9]$/;

  async function call(path, body) {
    try {
      const res = await fetch(API + path, body ? {
        method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ player: store.playerId() }, body))
      } : { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      return res.ok ? data : Object.assign({ error: data.error || 'Something went wrong' }, { status: res.status });
    } catch (e) {
      return null;
    }
  }
  const q = s => encodeURIComponent(s);
  const pid = () => q(store.playerId());

  // what others see about you
  function profile() {
    const d = store.data;
    return {
      name: d.playerName || (BW.friends.get(d.girl) || {}).name || '',
      girl: d.girl, pet: d.character, stars: d.coins, hearts: d.hearts == null ? 5 : d.hearts, motto: d.skill || ''
    };
  }

  let pingTimer = 0, onIncoming = () => {};
  async function ping() {
    if (!store.data.username || document.hidden) return;
    const r = await call('/api/ping', profile());
    if (r && r.status === 404) await call('/api/account', Object.assign({ username: store.data.username }, profile()));
    if (r && r.ok) {
      onIncoming(r.incoming || 0);
      if (BW.duo) BW.duo.onInvites(r.invites);
      if (BW.stickers) BW.stickers.richRank(r.rich);
    }
  }
  function startPinging() {
    clearInterval(pingTimer);
    ping();
    // every 8 seconds, so game invites pop up quickly
    pingTimer = setInterval(ping, 8000);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ping(); });

  // ---------- QR codes (public/vendor/qrcode/qrcode.js) ----------

  // draws a QR code of text into a canvas, dark modules in the given colour
  function drawQR(canvas, text, color) {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount(), quiet = 2, size = canvas.width, cell = size / (n + quiet * 2);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = color || '#3A2E36';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) ctx.fillRect(Math.floor((c + quiet) * cell), Math.floor((r + quiet) * cell), Math.ceil(cell), Math.ceil(cell));
    }
    return canvas;
  }

  // ---------- sharing your card ----------

  const loadImg = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // A pretty picture of your ID card for social apps (1080 x 1350, like an Instagram post)
  async function cardImage() {
    const d = store.data, p = profile(), user = d.username;
    const W = 1080, H = 1350, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#FBE1E8'); bg.addColorStop(1, '#F3E6FB');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // sparkles
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    [[90, 120, 10], [980, 160, 14], [140, 1240, 12], [960, 1200, 9], [520, 70, 7]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); });
    const font = (w, s) => `${w} ${s}px 'Baloo 2', 'Trebuchet MS', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#D2607A'; ctx.font = font(800, 84);
    ctx.fillText('Kawaii Corner', W / 2, 150);
    ctx.fillStyle = '#9B7B6A'; ctx.font = font(700, 40);
    ctx.fillText('♥ add me as a friend ♥', W / 2, 215);
    // the card
    rr(ctx, 70, 270, W - 140, 820, 48); ctx.fillStyle = '#FFFDFB'; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = '#E7C3BC'; ctx.stroke();
    const girl = await loadImg(`img/standing/${d.girl}.webp`);
    if (girl) {
      const h = 700, w = h * girl.naturalWidth / girl.naturalHeight;
      ctx.drawImage(girl, 300 - w / 2, 330, w, h);
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = '#5C3B2A'; ctx.font = font(800, 76);
    ctx.fillText(p.name || user, 540, 420);
    rr(ctx, 540, 450, 400, 70, 35); ctx.fillStyle = '#F6CAD6'; ctx.fill();
    ctx.fillStyle = '#5C3B2A'; ctx.font = font(800, 44);
    ctx.fillText('@' + user, 565, 500);
    ctx.font = font(700, 44);
    const starText = `⭐ ${p.stars.toLocaleString('en-US')}`;
    ctx.fillText(starText, 545, 590);
    const hx = 545 + ctx.measureText(starText).width + 40;
    ctx.fillStyle = '#F2607D'; ctx.fillText('♥', hx, 590);
    ctx.fillStyle = '#5C3B2A'; ctx.fillText(String(p.hearts), hx + 42, 590);
    if (p.motto) { ctx.fillStyle = '#9B7B6A'; ctx.font = font(600, 36); ctx.fillText('“' + p.motto + '”', 545, 650); }
    const qrc = drawQR(Object.assign(document.createElement('canvas'), { width: 330, height: 330 }), link(user));
    ctx.drawImage(qrc, 580, 700);
    ctx.fillStyle = '#9B7B6A'; ctx.font = font(700, 30); ctx.textAlign = 'center';
    ctx.fillText('scan to add me', 745, 1065);
    ctx.fillStyle = '#5C3B2A'; ctx.font = font(700, 40);
    ctx.fillText(SITE.replace('https://', ''), W / 2, 1180);
    ctx.fillStyle = '#B49383'; ctx.font = font(600, 32);
    ctx.fillText('dress up · cook · play · make friends', W / 2, 1240);
    return new Promise(res => c.toBlob(res, 'image/png'));
  }

  const link = user => `${SITE}/?add=${encodeURIComponent(user)}`;
  const shareText = () => `Add me on Kawaii Corner! I'm @${store.data.username} ♥`;

  // the phone's own share sheet (WhatsApp, Instagram, YouTube, Facebook… whatever is installed)
  async function shareNative(withImage) {
    const url = link(store.data.username), text = shareText();
    // inside the Android app: Capacitor's Share plugin
    const cap = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.Capacitor.Plugins;
    if (cap && cap.Share) {
      try { await cap.Share.share({ title: 'Kawaii Corner', text, url, dialogTitle: 'Share your ID card' }); return true; } catch (e) { return false; }
    }
    if (!navigator.share) return false;
    try {
      if (withImage) {
        const blob = await cardImage();
        const file = new File([blob], `kawaii-corner-${store.data.username}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Kawaii Corner', text: `${text}\n${url}` });
          return true;
        }
      }
      await navigator.share({ title: 'Kawaii Corner', text, url });
      return true;
    } catch (e) {
      return e && e.name === 'AbortError';   // they closed the sheet: that's fine
    }
  }

  // ready-made links for apps that accept them
  function appLinks() {
    const url = q(link(store.data.username)), text = q(shareText());
    return {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`
    };
  }

  async function copyLink() {
    const url = link(store.data.username);
    try { await navigator.clipboard.writeText(url); return true; } catch (e) {}
    const t = Object.assign(document.createElement('textarea'), { value: url });
    document.body.appendChild(t); t.select();
    const ok = document.execCommand('copy'); t.remove();
    return ok;
  }

  async function savePicture() {
    const blob = await cardImage();
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `kawaii-corner-${store.data.username}.png` });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  return {
    API, SITE, link, drawQR,
    valid: u => USERNAME.test(u),
    clean: u => String(u || '').trim().replace(/^@/, '').toLowerCase(),
    get username() { return store.data.username || ''; },
    profile,
    onIncoming(fn) { onIncoming = fn; },
    startPinging,
    async available(u) { return call(`/api/username/${q(u)}?player=${pid()}`); },
    async claim(u) {
      const r = await call('/api/account', Object.assign({ username: u }, profile()));
      if (r && r.ok) { store.data.username = r.me.username; store.save(); startPinging(); }
      return r;
    },
    // send your latest name, picture and stars (after saving the ID card)
    async sync() { return store.data.username ? call('/api/account', Object.assign({ username: store.data.username }, profile())) : null; },
    user: u => call(`/api/users/${q(u)}?player=${pid()}`),
    search: s => call(`/api/search?q=${q(s)}&player=${pid()}`),
    suggest: () => call(`/api/suggest?player=${pid()}`),
    friends: () => call(`/api/friends?player=${pid()}`),
    add: u => call('/api/friends/add', { username: u }),
    accept: u => call('/api/friends/accept', { username: u }),
    remove: u => call('/api/friends/remove', { username: u }),
    shareNative, appLinks, copyLink, savePicture, cardImage
  };
})();
