// The mailbox (the envelope button at the top of the home page): a note for everything nice
// that happens — a new sticker, a friend request, a new friend, your login streak, a daily
// reward, a win against a friend, getting into a Top 10. Unread mail puts a red dot on the button.
//   BW.mail.add(icon, title, text)   e.g. BW.mail.add('🎀', 'New sticker!', 'You earned Hidden Gem')
// Notes live in store.data.mail (newest first, the last 60 kept).
window.BW = window.BW || {};

BW.mail = (() => {
  const $ = id => document.getElementById(id);
  const store = BW.store;
  const MAX = 60;
  const list = () => (store.data.mail = store.data.mail || []);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  function add(icon, title, text) {
    list().unshift({ icon, title, text, at: Date.now(), read: false });
    list().length = Math.min(list().length, MAX);
    store.save();
    showDot();
  }

  function showDot() {
    const btn = $('mailBtn');
    if (btn) btn.classList.toggle('has-mail', list().some(m => !m.read));
  }

  function when(at) {
    const s = (Date.now() - at) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
    const d = Math.floor(s / 86400);
    return d === 1 ? 'yesterday' : `${d} days ago`;
  }

  function render() {
    const box = $('mailList');
    box.innerHTML = list().length ? '' : '<p class="mail-empty">No messages yet ♥<br>Play, make friends and collect stickers!</p>';
    list().forEach(m => {
      const el = document.createElement('div');
      el.className = 'mail-item' + (m.read ? '' : ' unread');
      el.innerHTML = `<span class="mail-icon">${esc(m.icon)}</span><div><b>${esc(m.title)}</b><p>${esc(m.text)}</p><small>${when(m.at)}</small></div>`;
      box.appendChild(el);
    });
  }

  function open() {
    render();
    $('mailPopup').hidden = false;
    BW.sound.play('click');
    // opening marks everything read (the unread ones stay pink until it closes)
    list().forEach(m => { m.read = true; });
    store.save();
    showDot();
  }
  function close() { $('mailPopup').hidden = true; }
  function clearAll() { store.data.mail = []; store.save(); render(); showDot(); }

  // ---------- friends: compare with what we knew last time ----------
  let lastCheck = 0;
  async function checkFriends(force) {
    if (!BW.account.username || (!force && Date.now() - lastCheck < 30000)) return;
    lastCheck = Date.now();
    const f = await BW.account.friends();
    if (!f || f.error) return;
    const known = store.data.knownSocial = store.data.knownSocial || { friends: null, incoming: [] };
    const friends = f.friends.map(p => p.username), incoming = f.incoming.map(p => p.username);
    if (known.friends) {
      f.incoming.filter(p => !known.incoming.includes(p.username))
        .forEach(p => add('💌', 'Friend request', `${p.name || p.username} (@${p.username}) wants to be your friend`));
      f.friends.filter(p => !known.friends.includes(p.username))
        .forEach(p => add('🐾', 'New friend!', `You and ${p.name || p.username} (@${p.username}) are friends now`));
    }
    known.friends = friends; known.incoming = incoming;
    store.save();
  }

  function wire() {
    $('mailBtn').addEventListener('click', open);
    $('mailClose').addEventListener('click', close);
    $('mailClear').addEventListener('click', clearAll);
    $('mailPopup').addEventListener('click', e => { if (e.target === $('mailPopup')) close(); });
    showDot();
  }

  return { wire, add, open, close, checkFriends, showDot };
})();
