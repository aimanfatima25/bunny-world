// Saving your progress to your Google account (Settings → "Save my progress").
// Sign in with Google once: from then on everything in store.data (stars, friends, stickers,
// scores, ID card…) is saved on the Kawaii Corner server a few seconds after it changes.
// On a new phone or after reinstalling, signing in with the same Google account brings it
// all back. Uses Google's own "Sign in with Google" button (accounts.google.com/gsi/client);
// the server checks the sign-in with Google and keeps the save (server.js /api/google, /api/save).
// In the Android app Google doesn't allow that button, so it uses the phone's own Google
// sign-in instead (the @capgo/capacitor-social-login plugin), which gives the same kind of
// token, so the server treats both the same.
window.BW = window.BW || {};

BW.cloud = (() => {
  const $ = id => document.getElementById(id);
  const store = BW.store;
  const API = () => BW.account.API;
  let clientId = null, gisLoaded = null, saveTimer = 0;

  const linked = () => !!store.data.cloud && !!store.data.cloud.email;
  // inside the Android app (Capacitor) rather than a browser
  const inApp = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const nativeLogin = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SocialLogin;
  let nativeReady = null;

  async function post(path, body) {
    try {
      const res = await fetch(API() + path, {
        method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ player: store.playerId() }, body))
      });
      const data = await res.json().catch(() => ({}));
      return res.ok ? data : { error: data.error || 'Something went wrong' };
    } catch (e) { return null; }
  }

  // ---------- saving ----------

  // what goes to the cloud: everything except things that only make sense on this phone
  function snapshot() {
    const copy = JSON.parse(JSON.stringify(store.data));
    delete copy.cloud;
    delete copy.knownSocial;
    return copy;
  }

  async function saveNow() {
    clearTimeout(saveTimer);
    if (!linked()) return null;
    const r = await post('/api/save', { data: snapshot() });
    if (r && r.ok) { store.data.cloud.savedAt = r.savedAt; writeLocal(); render(); }
    return r;
  }

  // the store calls this after every change: save a little later, not on every tap
  function changed() {
    if (!linked()) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 8000);
  }

  function writeLocal() { try { localStorage.setItem('bunny-world-save', JSON.stringify(store.data)); } catch (e) {} }

  // ---------- signing in ----------

  async function config() {
    if (clientId !== null) return clientId;
    try {
      const r = await fetch(API() + '/api/config', { cache: 'no-store' }).then(r => r.json());
      clientId = r.googleClientId || '';
    } catch (e) { clientId = ''; }
    return clientId;
  }

  function loadGis() {
    if (!gisLoaded) {
      gisLoaded = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.onload = resolve;
        s.onerror = () => reject(new Error("Can't load Google sign-in"));
        document.head.appendChild(s);
      });
    }
    return gisLoaded;
  }

  async function onCredential(resp) {
    setStatus('Signing in…');
    const r = await post('/api/google', { credential: resp.credential });
    if (!r) { setStatus("Can't reach the Kawaii Corner server right now"); return; }
    if (r.error) { setStatus(r.error); return; }
    if (r.player !== store.playerId() && r.save) {
      // this Google account already has a game: bring it back to this phone
      const save = Object.assign({}, r.save, { playerId: r.player, cloud: { email: r.email, savedAt: r.savedAt } });
      try { localStorage.setItem('bunny-world-save', JSON.stringify(save)); } catch (e) {}
      setStatus('Welcome back! Loading your game…');
      BW.sound.play('sparkle');
      setTimeout(() => location.reload(), 900);
      return;
    }
    if (r.player !== store.playerId()) {
      // linked account but nothing saved yet: use its player id from now on
      store.data.playerId = r.player;
    }
    store.data.cloud = { email: r.email, savedAt: 0 };
    writeLocal();
    await saveNow();
    BW.sound.play('coin');
    BW.app.toast('Your game is saved to ' + r.email + ' ♥');
    if (BW.mail) BW.mail.add('☁️', 'Progress saved', `Your game is now saved to ${r.email}. Sign in with it on any phone to get it back.`);
    render();
  }

  // the phone's own Google account picker (Android app)
  async function signInOnPhone(id) {
    const SL = nativeLogin();
    if (!SL) { setStatus('Google sign-in needs the newest app'); return; }
    try {
      nativeReady = nativeReady || SL.initialize({ google: { webClientId: id } });
      await nativeReady;
      const res = await SL.login({ provider: 'google', options: { scopes: ['email', 'profile'] } });
      const token = res && res.result && res.result.idToken;
      if (!token) { setStatus('Google sign-in failed, try again'); return; }
      await onCredential({ credential: token });
    } catch (e) {
      nativeReady = null;
      const msg = String((e && e.message) || e);
      setStatus(/cancel/i.test(msg) ? '' : 'Google sign-in failed, try again');
    }
  }

  function setStatus(text) { const el = $('cloudStatus'); if (el) el.textContent = text; }

  function ago(t) {
    if (!t) return 'not yet';
    const s = (Date.now() - t) / 1000;
    return s < 60 ? 'just now' : s < 3600 ? `${Math.floor(s / 60)} min ago` : s < 86400 ? `${Math.floor(s / 3600)} h ago` : `${Math.floor(s / 86400)} days ago`;
  }

  async function render() {
    const box = $('cloudBox');
    if (!box) return;
    if (linked()) {
      box.innerHTML = `<p class="cloud-who">☁️ Saved to <b>${store.data.cloud.email.replace(/[<>&]/g, '')}</b></p>
        <p class="cloud-status" id="cloudStatus">Last saved: ${ago(store.data.cloud.savedAt)}</p>
        <div class="cloud-btns"><button type="button" class="cloud-btn" id="cloudSave">Save now</button>
        <button type="button" class="cloud-btn ghost" id="cloudOut">Sign out</button></div>`;
      $('cloudSave').addEventListener('click', async () => { setStatus('Saving…'); const r = await saveNow(); if (!r || r.error) setStatus((r && r.error) || "Can't reach the server right now"); });
      $('cloudOut').addEventListener('click', signOut);
      return;
    }
    box.innerHTML = `<p class="cloud-why">Save your game to your Gmail, so you never lose it, even on a new phone.</p>
      <div id="googleBtn" class="google-btn"></div><p class="cloud-status" id="cloudStatus"></p>`;
    const id = await config();
    if (!id) { setStatus(clientId === '' ? 'Google sign-in is coming soon!' : "Can't reach the server right now"); return; }
    if (inApp()) {
      $('googleBtn').innerHTML = '<button type="button" class="g-native"><span class="g-logo">G</span>Continue with Google</button>';
      $('googleBtn').firstChild.addEventListener('click', () => { setStatus('Opening Google…'); signInOnPhone(id); });
      return;
    }
    try {
      await loadGis();
      google.accounts.id.initialize({ client_id: id, callback: onCredential, ux_mode: 'popup', auto_select: false });
      google.accounts.id.renderButton($('googleBtn'), { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 240 });
    } catch (e) { setStatus(e.message); }
  }

  async function signOut() {
    if (!confirm('Sign out on this phone? Your game stays saved to your Google account.')) return;
    await saveNow();
    // in the app, forget the Google account too, so next time it asks which one
    if (inApp() && nativeLogin()) nativeLogin().logout({ provider: 'google' }).catch(() => {});
    delete store.data.cloud;
    writeLocal();
    render();
  }

  // Settings → Delete my account: everything about you on the server goes (username, friends,
  // Top 10 scores, Google save). What's saved on this phone (stars, stickers…) stays.
  async function deleteAccount() {
    if (!confirm('Delete your Kawaii Corner account? Your username, friends, Top 10 scores and Google save will be deleted from our server. This can\'t be undone.')) return;
    clearTimeout(saveTimer);
    const r = await post('/api/account/delete', {});
    if (!r || r.error) { BW.app.toast((r && r.error) || "Can't reach the server right now"); return; }
    if (inApp() && nativeLogin()) nativeLogin().logout({ provider: 'google' }).catch(() => {});
    delete store.data.cloud;
    delete store.data.username;
    delete store.data.knownSocial;
    writeLocal();
    render();
    BW.app.toast('Your account was deleted');
  }
  document.addEventListener('click', e => { if (e.target && e.target.id === 'deleteAccount') deleteAccount(); });

  // save when leaving the app too
  document.addEventListener('visibilitychange', () => { if (document.hidden && linked()) saveNow(); });

  return { render, changed, saveNow, get linked() { return linked(); }, _onCredential: onCredential };
})();
