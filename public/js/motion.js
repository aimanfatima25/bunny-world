// Motion controls for Flappy Bunny: follow your hand with the front camera, or the tilt of
// your phone. Each control gives a number from 0 (top of the screen) to 1
// (bottom), which the bunny flies towards.
//   const c = await BW.motion.start('hand' | 'tilt')
//   c.value  where to fly, 0..1      c.seen  true while the hand is found
//   c.video  the camera picture (hand), c.point the tracked spot in it, c.stop()
//   c.gesture  the hand's shape: 'open', 'fist', 'scissors' (✌️) or 'other'
// BW.motion.pad(c) turns hand moves into game buttons (the cooking shops use it):
//   swipe left / right / up / down, make a fist ✊ (pick), make scissors ✌️ (serve).
// Hand tracking uses Google's MediaPipe (public/vendor/mediapipe), loaded only when
// someone picks it. Throws an Error with a friendly message if it can't start.
window.BW = window.BW || {};

BW.motion = (() => {
  const BASE = new URL('vendor/mediapipe/', location.href).href;
  let lib = null;
  const trackers = {};

  const clamp = v => Math.max(0, Math.min(1, v));

  async function tracker(kind) {
    if (trackers[kind]) return trackers[kind];
    lib = lib || await import(BASE + 'vision_bundle.mjs');
    const fileset = { wasmLoaderPath: BASE + 'wasm/vision_wasm_internal.js', wasmBinaryPath: BASE + 'wasm/vision_wasm_internal.wasm' };
    const make = delegate => lib.HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: BASE + 'models/hand_landmarker.task', delegate },
      runningMode: 'VIDEO', numHands: 1
    });
    // the phone's graphics chip is fastest; fall back to the processor if it isn't allowed
    try { trackers[kind] = await make('GPU'); } catch (e) { trackers[kind] = await make('CPU'); }
    return trackers[kind];
  }

  async function camera(kind) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('This browser has no camera access');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } }, audio: false });
    } catch (e) {
      throw new Error(e && e.name === 'NotAllowedError' ? 'Camera not allowed' : 'No camera found');
    }
    const video = document.createElement('video');
    video.playsInline = true; video.muted = true; video.srcObject = stream;
    let lm;
    try {
      await video.play();
      lm = await tracker(kind);
    } catch (e) {
      stream.getTracks().forEach(tr => tr.stop());
      throw new Error("Couldn't start the tracker");
    }

    const c = { kind, video, value: 0.5, seen: false, point: null, stopped: false };
    let lastTime = -1, raf = 0;

    function loop() {
      if (c.stopped) return;
      if (video.readyState >= 2 && video.currentTime !== lastTime) {
        lastTime = video.currentTime;
        const r = lm.detectForVideo(video, performance.now());
        const h = r.landmarks && r.landmarks[0];
        c.seen = !!h;
        if (h) {
          // the middle of the palm; the camera's top is the screen's top
          const y = (h[0].y + h[9].y) / 2;
          c.point = { x: 1 - h[9].x, y };
          c.value = clamp((y - 0.18) / 0.62);
          c.gesture = shape(h);
        } else c.gesture = null;
      }
      raf = requestAnimationFrame(loop);
    }
    loop();

    c.stop = () => {
      c.stopped = true;
      cancelAnimationFrame(raf);
      stream.getTracks().forEach(tr => tr.stop());
    };
    return c;
  }

  // Which fingers are straight: a finger is straight when its tip is further from the wrist
  // than its middle knuckle. Thumbs are left out (they're hard to read from the front).
  function shape(h) {
    const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const up = [[8, 6], [12, 10], [16, 14], [20, 18]].map(([tip, pip]) => d(h[tip], h[0]) > d(h[pip], h[0]) * 1.15);
    const n = up.filter(Boolean).length;
    if (n === 0) return 'fist';
    if (up[0] && up[1] && !up[2] && !up[3]) return 'scissors';
    if (n >= 3) return 'open';
    return 'other';
  }

  // Hand moves as game buttons. Call pad.update(dt) every frame; it returns one of
  // 'left' 'right' 'up' 'down' 'fist' 'scissors', or null.
  //  - a swipe is the palm moving a fifth of the camera picture quickly; bringing your hand
  //    back to the middle afterwards (the opposite way, within a second) doesn't count
  //  - a fist or scissors counts once you've held it a moment, and again only after
  //    your hand changes shape (so one fist = one pick)
  function pad(c) {
    let trail = [], held = null, heldFor = 0, used = false, rest = 0, last = null, lastAt = 0;
    const opposite = { left: 'right', right: 'left', up: 'down', down: 'up' };
    return {
      update(dt) {
        rest = Math.max(0, rest - dt);
        if (!c.seen || !c.point) { trail = []; held = null; heldFor = 0; return null; }
        const now = performance.now(), g = c.gesture;
        if (g === 'fist' || g === 'scissors') {
          trail = [];
          if (g !== held) { held = g; heldFor = 0; used = false; }
          heldFor += dt;
          if (!used && heldFor > 0.18) { used = true; rest = 0.35; return g; }
          return null;
        }
        held = null;
        // swipes (closing the hand moves the palm a little, so wait a moment after a shape)
        trail.push({ t: now, x: c.point.x, y: c.point.y });
        trail = trail.filter(p => now - p.t < 350);
        if (rest > 0 || trail.length < 3) return null;
        const a = trail[0], b = trail[trail.length - 1], dx = b.x - a.x, dy = b.y - a.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 0.2) return null;
        trail = []; rest = 0.3;
        const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        const goingBack = last && dir === opposite[last] && now - lastAt < 1000;
        lastAt = now;
        if (goingBack) { last = null; return null; }
        last = dir;
        return dir;
      }
    };
  }

  // tilt: the phone's forward/back tilt, measured from how you held it at the start
  async function tilt() {
    if (!('DeviceOrientationEvent' in window)) throw new Error('No tilt sensor');
    // iPhones ask first (this must run straight from a tap)
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const ok = await DeviceOrientationEvent.requestPermission().catch(() => 'denied');
      if (ok !== 'granted') throw new Error('Motion sensor not allowed');
    }
    const c = { kind: 'tilt', value: 0.5, seen: false, angle: 0, stopped: false };
    let middle = null, beta = null;
    function onTilt(e) {
      if (e.beta == null) return;
      beta = e.beta;
      c.seen = true;
      if (middle === null) middle = beta;
      c.angle = beta - middle;
      // tip the top of the phone towards you to fly up, away from you to fly down
      c.value = clamp(0.5 - c.angle / 40);
    }
    window.addEventListener('deviceorientation', onTilt);
    c.calibrate = () => { if (beta !== null) middle = beta; };
    c.stop = () => { c.stopped = true; window.removeEventListener('deviceorientation', onTilt); };
    // no reading after a moment: this device has no tilt sensor
    await new Promise(r => setTimeout(r, 600));
    if (!c.seen) { c.stop(); throw new Error('No tilt sensor found'); }
    return c;
  }

  return {
    // which controls this device can try
    can: {
      camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      tilt: 'DeviceOrientationEvent' in window && (navigator.maxTouchPoints || 0) > 0
    },
    start(kind) { return kind === 'tilt' ? tilt() : camera(kind); },
    pad, shape
  };
})();
