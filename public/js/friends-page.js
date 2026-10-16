// The Friends page (like Aiman's Friends design), picking your username, and the share menu
// for your ID card. Uses BW.account for everything that talks to the server.
//   BW.social.openFriends({ add })   the Friends page; add = a username from an invite link
//   BW.social.needUsername(then)     asks for a username first if you don't have one yet
//   BW.social.openShare()            the share menu (system sheet, WhatsApp, Facebook, X, copy, save)
window.BW = window.BW || {};

BW.social = (() => {
  const $ = id => document.getElementById(id);
  const acc = BW.account;
  const toast = msg => BW.app.toast(msg);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const OFFLINE = "Can't reach the friends server right now. Try again in a bit!";

  // ---------- picking a username ----------

  let afterUsername = null, checkTimer = 0, lastOk = '';

  function needUsername(then) {
    if (acc.username) { then(); return; }
    afterUsername = then;
    $('unInput').value = (BW.store.data.playerName || '').toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 15);
    $('unPopup').hidden = false;
    check();
    setTimeout(() => $('unInput').focus(), 50);
  }

  function setStatus(text, kind) {
    $('unStatus').textContent = text;
    $('unStatus').className = 'un-status ' + (kind || '');
  }

  function check() {
    clearTimeout(checkTimer);
    const u = acc.clean($('unInput').value);
    $('unInput').value = u;
    lastOk = '';
    $('unSave').disabled = true;
    if (!u) { setStatus('3–15 letters, numbers, _ or .'); return; }
    if (!acc.valid(u)) { setStatus(u.length < 3 ? 'At least 3 characters' : 'Only a–z, 0–9, _ and . (not at the start or end)', 'bad'); return; }
    setStatus('Checking…');
    checkTimer = setTimeout(async () => {
      const r = await acc.available(u);
      if (acc.clean($('unInput').value) !== u) return;
      if (!r) { setStatus(OFFLINE, 'bad'); return; }
      if (r.available) { setStatus(`@${u} is free ✓`, 'good'); lastOk = u; $('unSave').disabled = false; }
      else setStatus(`@${u} is taken, try another`, 'bad');
    }, 350);
  }

  async function saveUsername(e) {
    e.preventDefault();
    if (!lastOk) return;
    $('unSave').disabled = true;
    const r = await acc.claim(lastOk);
    if (!r) { setStatus(OFFLINE, 'bad'); return; }
    if (r.error) { setStatus(r.error, 'bad'); return; }
    BW.sound.play('sparkle');
    $('unPopup').hidden = true;
    toast(`You're @${r.me.username} ♥`);
    const then = afterUsername; afterUsername = null;
    if (then) then();
  }

  // ---------- share menu ----------

  function openShare() {
    needUsername(() => {
      const links = acc.appLinks();
      $('shWhatsapp').href = links.whatsapp;
      $('shFacebook').href = links.facebook;
      $('shX').href = links.x;
      $('shTelegram').href = links.telegram;
      $('shLink').textContent = acc.link(acc.username).replace('https://', '');
      $('sharePopup').hidden = false;
    });
  }

  // ---------- the Friends page ----------

  let incomingCount = 0, searchTimer = 0, current = null;

  const avatar = pet => BW.friends.cutout(BW.friends.get(pet) ? pet : 'bunny').src;
  const picture = girl => BW.friends.img(BW.friends.get(girl) ? girl : 'girl-1');

  // one row like the design: QR, round avatar, name, ID, stars, hearts, motto, picture, button
  function row(p, opts) {
    opts = opts || {};
    const el = document.createElement('div');
    el.className = 'fr-row' + (opts.mine ? ' mine' : '');
    const action = opts.mine ? '' :
      p.relation === 'friends' || opts.friend ? `<button class="fr-btn play" data-act="play">▶ Play</button><button class="fr-btn ghost" data-act="remove">Friends ✓</button>` :
      p.relation === 'incoming' || opts.incoming ? `<button class="fr-btn" data-act="accept">Accept</button><button class="fr-btn ghost" data-act="remove">Decline</button>` :
      p.relation === 'requested' || opts.outgoing ? `<button class="fr-btn ghost" data-act="remove">Requested</button>` :
      `<button class="fr-btn" data-act="add">Add Friend</button>`;
    el.innerHTML = `
      ${opts.mine ? '<span class="fr-my">MY ID</span>' : ''}
      <canvas class="fr-qr" width="120" height="120"></canvas>
      <div class="fr-info">
        <div class="fr-name"><img class="fr-ava" src="${esc(avatar(p.pet))}" alt=""><b>${esc(p.name || p.username)}</b></div>
        <div class="fr-id"><i>ID</i>@${esc(p.username)}</div>
        <div class="fr-stats"><span><img src="img/ui/star.webp" alt="">${esc(Number(p.stars || 0).toLocaleString('en-US'))}</span><span><img src="img/ui/heart.webp" alt="">${esc(p.hearts)}</span></div>
        ${p.motto ? `<div class="fr-motto">${esc(p.motto)}</div>` : ''}
      </div>
      <div class="fr-side">
        <img class="fr-pic${String(p.girl).startsWith('guy-') ? ' guy' : ''}" src="${esc(picture(p.girl))}" alt="">
        ${opts.mine ? '' : `<span class="fr-online ${p.online ? 'on' : ''}">${p.online ? 'Online' : 'Offline'}</span>`}
        ${action}
      </div>`;
    acc.drawQR(el.querySelector('.fr-qr'), acc.link(p.username));
    el.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => act(b.dataset.act, p, b)));
    return el;
  }

  async function act(what, p, btn) {
    if (what === 'play') { BW.duo.pickGame(p.username); return; }
    if (what === 'remove' && (p.relation === 'friends' || btn.textContent === 'Friends ✓')) {
      if (!confirm(`Remove @${p.username} from your friends?`)) return;
    }
    btn.disabled = true;
    const r = await acc[what](p.username);
    if (!r) { toast(OFFLINE); btn.disabled = false; return; }
    if (r.error) { toast(r.error); btn.disabled = false; return; }
    BW.sound.play(what === 'remove' ? 'swipe' : 'coin');
    toast(what === 'add' ? (r.relation === 'friends' ? `You and @${p.username} are friends now ♥` : `Friend request sent to @${p.username}`)
      : what === 'accept' ? `You and @${p.username} are friends now ♥` : 'Done');
    refresh();
  }

  function section(title, list, opts, empty) {
    const box = $('frList');
    const h = document.createElement('h4');
    h.className = 'fr-title';
    h.textContent = title;
    box.appendChild(h);
    if (!list.length) {
      if (empty) { const e = document.createElement('p'); e.className = 'fr-empty'; e.textContent = empty; box.appendChild(e); }
      return;
    }
    list.forEach(p => box.appendChild(row(p, opts)));
  }

  async function refresh() {
    const box = $('frList');
    const query = $('frSearch').value.trim();
    const mine = Object.assign({ username: acc.username }, acc.profile());
    const status = document.createElement('p');
    status.className = 'fr-empty';
    status.textContent = 'Loading…';
    box.innerHTML = '';
    box.appendChild(row(mine, { mine: true }));
    box.appendChild(status);

    if (query.length >= 2) {
      const r = await acc.search(query);
      if ($('frSearch').value.trim() !== query) return;
      status.remove();
      if (!r) { section('Search', [], {}, OFFLINE); return; }
      section(`Players matching “${query}”`, r.users, {}, 'Nobody with that name or ID yet');
      return;
    }

    const [f, s, found] = await Promise.all([acc.friends(), acc.suggest(), current ? acc.user(current) : null]);
    status.remove();
    if (!f) { section('Friends', [], {}, OFFLINE); return; }
    if (found && !found.error && found.username !== acc.username) section('Invited you to be friends', [found], {});
    else if (found && found.error) toast(found.error);
    current = null;
    if (f.incoming.length) section('Friend requests', f.incoming, { incoming: true });
    section('My friends', f.friends, { friend: true }, 'No friends yet. Search for a username or tap Invite Friend!');
    if (f.outgoing.length) section('Waiting for them to accept', f.outgoing, { outgoing: true });
    const known = new Set([...f.friends, ...f.incoming, ...f.outgoing].map(p => p.username));
    const people = (s && s.users || []).filter(p => !known.has(p.username));
    if (people.length) section('People to meet', people, {});
    setIncoming(f.incoming.length);
  }

  function setIncoming(n) {
    incomingCount = n;
    $('friendsNav').classList.toggle('has-dot', n > 0);
  }

  function openFriends(opts) {
    opts = opts || {};
    needUsername(() => {
      current = opts.add ? acc.clean(opts.add) : null;
      $('frSearch').value = '';
      BW.app.showScreen('friendsPage');
      refresh();
    });
  }

  function wire() {
    $('unInput').addEventListener('input', check);
    $('unForm').addEventListener('submit', saveUsername);
    $('unCancel').addEventListener('click', () => { $('unPopup').hidden = true; afterUsername = null; });
    $('shareClose').addEventListener('click', () => { $('sharePopup').hidden = true; });
    $('sharePopup').addEventListener('click', e => { if (e.target === $('sharePopup')) $('sharePopup').hidden = true; });
    $('shNative').addEventListener('click', async () => {
      const ok = await acc.shareNative(true);
      if (!ok) toast('Sharing isn\'t available here: use the buttons below or Copy link');
    });
    $('shCopy').addEventListener('click', async () => { toast((await acc.copyLink()) ? 'Link copied ♥' : 'Couldn\'t copy'); });
    $('shSave').addEventListener('click', async () => { await acc.savePicture(); toast('Picture saved ♥'); });
    ['shWhatsapp', 'shFacebook', 'shX', 'shTelegram'].forEach(id => $(id).addEventListener('click', () => BW.sound.play('click')));
    $('frSearch').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(refresh, 400); });
    $('frInvite').addEventListener('click', openShare);
    acc.onIncoming(setIncoming);
    if (acc.username) acc.startPinging();
    // invite links: ?add=username opens the Friends page with them
    const add = new URLSearchParams(location.search).get('add');
    if (add) {
      history.replaceState(null, '', location.pathname);
      setTimeout(() => openFriends({ add }), 600);
    }
  }

  return { wire, openFriends, needUsername, openShare, refresh, get incoming() { return incomingCount; } };
})();
