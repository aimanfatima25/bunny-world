// Motion controls for Flappy Bunny: follow your hand with the front camera, or the tilt of
// your phone. Each control gives a number from 0 (top of the screen) to 1
// (bottom), which the bunny flies towards.
//   const c = await BW.motion.start('hand' | 'tilt')
//   c.value  where to fly, 0..1      c.seen  true while the hand is found
//   c.video  the camera picture (hand), c.point the tracked spot in it, c.stop()
//   c.gesture  the hand's shape: 'open', 'fist', 'scissors' (✌️) or 'other'
// BW.motion.pad(c) turns hand moves into game buttons (the cooking shops use it):
//   move your hand left / right / up / down, make a fist ✊ (pick), make scissors ✌️ (serve).
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

  // Hand moves as game buttons, like a joystick. Call pad.update(dt) every frame; it returns
  // one of 'left' 'right' 'up' 'down' 'fist' 'scissors', or null.
  //  - Where you first hold your hand still is the middle (pad.center). Move it a little to the
  //    left / right / up / down of there and the pink box steps that way once; keep it there and
  //    it steps again every 0.7 s; come back to the middle to stop. (Fast swipes blur the hand
  //    and the tracker loses it, so moving and holding works much better.)
  //  - a fist or scissors counts once you've held it a moment, and again only after
  //    your hand changes shape (so one fist = one pick)
  //  - pad.offset is where the hand is from the middle (for drawing), pad.zone the way it points
  const OUT = 0.13, BACK = 0.08, REPEAT = 0.7;
  function pad(c) {
    let held = null, heldFor = 0, used = false, lost = 9, still = 0, last = null, again = 0;
    const p = { center: null, offset: null, zone: null };
    p.update = dt => {
      if (!c.seen || !c.point) {
        lost += dt; held = null; heldFor = 0; p.offset = null; p.zone = null;
        if (lost > 1.5) p.center = null;           // hand gone a while: find the middle again
        return null;
      }
      lost = 0;
      const g = c.gesture, pt = c.point;
      if (g === 'fist' || g === 'scissors') {
        p.zone = null;
        if (g !== held) { held = g; heldFor = 0; used = false; }
        heldFor += dt;
        if (!used && heldFor > 0.18) { used = true; return g; }
        return null;
      }
      held = null;
      // the middle: where the hand first rests for a moment
      if (!p.center) {
        still = last && Math.hypot(pt.x - last.x, pt.y - last.y) < 0.02 ? still + dt : 0;
        last = { x: pt.x, y: pt.y };
        if (still > 0.3) p.center = { x: Math.min(0.7, Math.max(0.3, pt.x)), y: Math.min(0.7, Math.max(0.3, pt.y)) };
        return null;
      }
      const dx = pt.x - p.center.x, dy = pt.y - p.center.y;
      p.offset = { x: dx, y: dy };
      const far = Math.max(Math.abs(dx), Math.abs(dy));
      if (far < BACK) { p.zone = null; return null; }          // back in the middle
      if (far < OUT && !p.zone) return null;                   // not far enough yet
      const zone = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      if (zone !== p.zone) { p.zone = zone; again = REPEAT; return zone; }
      again -= dt;
      if (again <= 0) { again = REPEAT; return zone; }
      return null;
    };
    return p;
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
