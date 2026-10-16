// Flappy Bunny: hop through the carrot pillars.
// When it opens it asks how you want to play: tap to hop, or (motion.js) let the bunny
// follow your hand on the front camera, or the tilt of your phone. With a
// motion control there's no gravity: the bunny flies to where you point it.
// Together with a friend (options.duo): both fly through the very same pillars (same seed,
// same speed by the clock), each pillar has two gaps, and the friend's animal flies along
// as a see-through ghost with their name. Whoever passes more pillars wins.
// Every game has the same shape: start(canvas, options) returns { restart, stop }.
//   options.character   which friend to draw
//   options.getBest()   best score so far (shown on the start screen)
//   options.onGameOver(score)   called once when the player bonks
window.BW = window.BW || {};
BW.games = BW.games || {};

BW.games.flappy = (() => {
  const W = 360, H = 640, GROUND = 588, TAU = Math.PI * 2;
  const K = BW.kit;
  const PILLAR_W = 66, SPACING = 215;

  function start(canvas, options) {
    const ctx = canvas.getContext('2d');
    let state, bunny, pillars, score, groundX, clouds, flash;
    let t = 0, raf = 0, last = performance.now();
    // how you play: null (not picked yet), 'tap', 'hand' or 'tilt'
    let control = null, motion = null, message = '', seenFor = 0, lostFor = 0, aim = 0.5;
    const duo = options.duo;
    let rng = Math.random, pillarCount = 0;
    if (duo) control = 'tap';
    const TOP_Y = 40, LOW_Y = GROUND - 30;     // where a motion-controlled bunny can fly

    // the choices on the first screen: [control, label, little picture]
    const CHOICES = [['tap', 'Tap to hop', '👆']];
    if (BW.motion && BW.motion.can.camera) CHOICES.push(['hand', 'Hand wave', '✋']);
    // chicks already have little wings of their own
    const OWN_WINGS = ['chick', 'bow-chick'];
    if (BW.motion && BW.motion.can.tilt) CHOICES.push(['tilt', 'Tilt phone', '📱']);
    const choiceBox = i => [50, 236 + i * 64, 260, 52];

    function resize() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    }

    function reset() {
      state = control ? 'ready' : 'choose';
      seenFor = 0;
      if (duo) { rng = K.seeded(duo.seed); pillarCount = 0; }
      bunny = { x: 110, y: 300, vy: 0, r: 13 };
      pillars = [];
      score = 0;
      groundX = 0;
      flash = 0;
      clouds = clouds || Array.from({ length: 5 }, (_, i) => ({ x: i * 90 + Math.random() * 40, y: 60 + Math.random() * 220, s: 0.6 + Math.random() * 0.6 }));
    }

    // together, the speed comes from the shared clock so both worlds stay the same
    function speed() {
      if (duo) return Math.min(150 + Math.max(0, Date.now() - duo.startAt) / 1000 * 2, 230);
      return Math.min(150 + score * 4, 230);
    }
    function gapSize() { return Math.max(165 - score * 1.5, 128); }

    function addPillar(x) {
      if (duo) {
        // two gaps in every pillar, from the shared random numbers
        const g = Math.max(150 - pillarCount * 1.2, 118);
        pillarCount++;
        const top = 70 + rng() * (GROUND - 70 - 2 * g - 60 - 40);
        const top2 = top + g + 60 + rng() * (GROUND - 40 - (top + 2 * g + 60));
        pillars.push({ x, top, g, top2, passed: false });
        return;
      }
      const g = gapSize();
      const top = 90 + Math.random() * (GROUND - 90 - g - 70);
      pillars.push({ x, top, g, passed: false });
    }

    function begin() { state = 'play'; addPillar(W + 40); }

    function hop() {
      if (state === 'over') return;
      if (state === 'ready') begin();
      bunny.vy = -420;
      BW.sound.play('hop');
    }

    // picking how to play; camera and tilt ask for permission first
    async function choose(kind) {
      BW.sound.play('click');
      if (kind === 'tap') { control = 'tap'; state = 'ready'; return; }
      state = 'loading';
      message = kind === 'tilt' ? 'Getting the tilt sensor...' : 'Starting the camera...';
      try {
        const m = await BW.motion.start(kind);
        if (stopped) { m.stop(); return; }
        motion = m;
        control = kind;
        state = 'ready';
        seenFor = 0;
      } catch (e) {
        if (stopped) return;
        control = 'tap';
        state = 'ready';
        message = `${e.message}. Playing with taps!`;
      }
    }
    let stopped = false;

    function end() {
      state = 'over';
      if (duo) duo.set({ score, y: Math.round(bunny.y), alive: false });
      BW.sound.play('bonk');
      flash = 1;
      options.onGameOver(score);
    }

    function update(dt) {
      t += dt;
      clouds.forEach(c => { c.x -= 12 * c.s * dt; if (c.x < -80) { c.x = W + 40; c.y = 60 + Math.random() * 220; } });
      if (state === 'choose' || state === 'loading') { bunny.y = 200 + Math.sin(t * 4) * 8; groundX = (groundX - 90 * dt) % 24; return; }
      if (state === 'ready' && duo) {
        bunny.y = 300 + Math.sin(t * 4) * 8; groundX = (groundX - 90 * dt) % 24;
        if (Date.now() >= duo.startAt) { begin(); bunny.vy = -420; }
        return;
      }
      if (state === 'ready') {
        bunny.y = 300 + Math.sin(t * 4) * 8; groundX = (groundX - 90 * dt) % 24;
        // hand: start once it's been seen for a moment
        if (motion && control === 'hand') {
          seenFor = motion.seen ? seenFor + dt : 0;
          if (seenFor > 0.8) { aim = 0.5; begin(); }
        }
        return;
      }
      if (state === 'over') {
        if (bunny.y < GROUND - bunny.r) { bunny.vy += 1500 * dt; bunny.y = Math.min(bunny.y + bunny.vy * dt, GROUND - bunny.r); }
        flash = Math.max(0, flash - dt * 3);
        return;
      }
      const v = speed();
      if (motion) {
        // fly smoothly to where your hand / eyes / phone point
        lostFor = motion.seen ? 0 : lostFor + dt;
        if (motion.seen) aim += (motion.value - aim) * Math.min(1, dt * 12);
        const target = TOP_Y + aim * (LOW_Y - TOP_Y);
        const step = (target - bunny.y) * Math.min(1, dt * 9);
        bunny.vy = step / dt;
        bunny.y += step;
      } else {
        bunny.vy = Math.min(bunny.vy + 1450 * dt, 620);
        bunny.y += bunny.vy * dt;
      }
      groundX = (groundX - v * dt) % 24;
      far += v * 0.25 * dt;
      pillars.forEach(p => {
        p.x -= v * dt;
        if (!p.passed && p.x + PILLAR_W < bunny.x) { p.passed = true; score++; BW.sound.play('score'); }
      });
      if (pillars.length && pillars[pillars.length - 1].x < W - SPACING) addPillar(W + 10);
      pillars = pillars.filter(p => p.x > -PILLAR_W - 20);

      if (duo) duo.set({ score, y: Math.round(bunny.y), alive: true });
      if (bunny.y + bunny.r >= GROUND || bunny.y - bunny.r < -40) return end();
      for (const p of pillars) {
        const cx = Math.max(p.x, Math.min(bunny.x, p.x + PILLAR_W));
        const blocks = p.top2 != null ? [[-100, p.top], [p.top + p.g, p.top2], [p.top2 + p.g, GROUND]] : [[-100, p.top], [p.top + p.g, GROUND]];
        for (const [y1, y2] of blocks) {
          const cy = Math.max(y1, Math.min(bunny.y, y2));
          if ((bunny.x - cx) ** 2 + (bunny.y - cy) ** 2 < bunny.r ** 2) return end();
        }
      }
    }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }

    // ---------- the look from the Flappy Bunny card: soft sky, puffy clouds,
    // round trees, grassy dirt blocks, and the chosen animal flying with little wings ----------

    const OUTLINE = '#6E4A3A';
    let far = 0; // how far the background trees have drifted

    function puff(x, y, s) {
      ctx.beginPath();
      ctx.arc(x, y, 18 * s, 0, 7); ctx.arc(x + 20 * s, y - 10 * s, 22 * s, 0, 7);
      ctx.arc(x + 44 * s, y - 2 * s, 18 * s, 0, 7); ctx.arc(x + 24 * s, y + 6 * s, 18 * s, 0, 7);
      ctx.fill();
    }

    function tree(x, base, s) {
      ctx.fillStyle = '#A8835F';
      ctx.fillRect(x - 4 * s, base - 40 * s, 8 * s, 40 * s);
      ctx.fillStyle = '#9CC77A';
      [[0, -58, 24], [-20, -44, 18], [20, -46, 19]].forEach(([dx, dy, r]) => {
        ctx.beginPath(); ctx.arc(x + dx * s, base + dy * s, r * s, 0, TAU); ctx.fill();
      });
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.beginPath(); ctx.arc(x - 8 * s, base - 66 * s, 9 * s, 0, 7); ctx.fill();
    }

    function drawSky() {
      const g = ctx.createLinearGradient(0, 0, 0, GROUND);
      g.addColorStop(0, '#A9D3F2'); g.addColorStop(0.7, '#D9EEF9'); g.addColorStop(1, '#EEF7F0');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // clouds with a soft blue shadow underneath
      clouds.forEach(c => {
        ctx.fillStyle = 'rgba(170,200,230,.5)'; puff(c.x + 3, c.y + 5, c.s);
        ctx.fillStyle = '#FFFFFF'; puff(c.x, c.y, c.s);
      });
      // far hills and drifting trees
      ctx.fillStyle = '#CDE6BE';
      ctx.beginPath(); ctx.moveTo(0, GROUND);
      for (let x = 0; x <= W; x += 60) ctx.quadraticCurveTo(x + 30, GROUND - 70 - 20 * Math.sin(x * 0.02), x + 60, GROUND - 40);
      ctx.lineTo(W, GROUND); ctx.fill();
      for (let i = 0; i < 4; i++) {
        const x = ((i * 130 - far) % 520 + 520) % 520 - 60;
        tree(x, GROUND - 6, 1 + (i % 2) * 0.25);
      }
    }

    // a block of earth with a cushion of grass on the side that faces the gap
    function grassBlock(x, y, w, h, grassOnTop) {
      ctx.lineWidth = 2.5; ctx.strokeStyle = OUTLINE; ctx.lineJoin = 'round';
      ctx.fillStyle = '#B98A5E';
      roundRect(x, y, w, h, 8); ctx.fill(); ctx.stroke();
      // little stones and texture
      ctx.fillStyle = 'rgba(110,74,58,.25)';
      for (let yy = y + 26; yy < y + h - 10; yy += 30) {
        ctx.beginPath(); ctx.ellipse(x + 16, yy, 6, 4, 0, 0, 7); ctx.ellipse(x + w - 18, yy + 14, 5, 3.5, 0, 0, 7); ctx.fill();
      }
      const gy = grassOnTop ? y - 4 : y + h - 14;
      ctx.fillStyle = '#8EC25E';
      roundRect(x - 5, gy, w + 10, 18, 9); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#B5DA7E';
      roundRect(x - 1, gy + 3, w + 2, 6, 3); ctx.fill();
      // grass tufts
      ctx.strokeStyle = '#6FA448'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      const ty = grassOnTop ? gy : gy + 18, dir = grassOnTop ? -1 : 1;
      ctx.beginPath();
      for (let tx = x + 8; tx < x + w - 4; tx += 16) { ctx.moveTo(tx, ty); ctx.lineTo(tx - 3, ty + dir * 7); ctx.moveTo(tx, ty); ctx.lineTo(tx + 3, ty + dir * 8); }
      ctx.stroke();
    }

    function drawPillar(p) {
      grassBlock(p.x, -20, PILLAR_W, p.top + 20, false);
      if (p.top2 != null) {
        // the middle block between the two gaps has grass on both sides
        const y = p.top + p.g, h = p.top2 - y;
        grassBlock(p.x, y, PILLAR_W, h, true);
        grassBlock(p.x, y + h - 22, PILLAR_W, 22, false);
        grassBlock(p.x, p.top2 + p.g, PILLAR_W, GROUND - p.top2 - p.g + 20, true);
        return;
      }
      grassBlock(p.x, p.top + p.g, PILLAR_W, GROUND - p.top - p.g + 20, true);
    }

    function drawGround() {
      ctx.fillStyle = '#B98A5E'; ctx.fillRect(0, GROUND + 10, W, H - GROUND);
      ctx.fillStyle = '#8EC25E'; ctx.fillRect(0, GROUND - 2, W, 16);
      ctx.fillStyle = '#B5DA7E'; ctx.fillRect(0, GROUND + 1, W, 4);
      ctx.strokeStyle = '#6FA448'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let x = groundX; x < W + 24; x += 24) { ctx.moveTo(x, GROUND - 2); ctx.lineTo(x - 3, GROUND - 9); ctx.moveTo(x + 6, GROUND - 2); ctx.lineTo(x + 9, GROUND - 10); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(110,74,58,.22)';
      for (let x = groundX * 1.5; x < W; x += 40) { ctx.beginPath(); ctx.ellipse(x + 10, GROUND + 30, 6, 4, 0, 0, 7); ctx.fill(); }
    }

    function wing(flapAngle) {
      ctx.save();
      ctx.rotate(flapAngle);
      ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#7FA6D8'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-10, -22, -34, -26, -40, -14);
      ctx.bezierCurveTo(-32, -12, -36, -4, -28, -2);
      ctx.bezierCurveTo(-24, 4, -12, 4, 0, 0);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#B9D3F2';
      ctx.beginPath(); ctx.moveTo(-6, -2); ctx.bezierCurveTo(-14, -10, -26, -14, -34, -12); ctx.bezierCurveTo(-26, -6, -16, -2, -6, -2); ctx.fill();
      ctx.restore();
    }

    // The flying bunny from the Flappy Bunny card: plump, pink-white, ears streaming back,
    // fluffy tail, and little wings on her back
    function flyingBunny(beat, dead) {
      const LINE = '#5B4650';
      ctx.lineWidth = 2; ctx.strokeStyle = LINE; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const fur = ctx.createRadialGradient(4, -10, 2, 0, 0, 26);
      fur.addColorStop(0, '#FFFFFF'); fur.addColorStop(1, '#FBDCE5');
      // far wing and far ear, behind everything
      ctx.save(); ctx.translate(-6, -11); wing(beat - 0.35); ctx.restore();
      ctx.save(); ctx.translate(9, -16); ctx.rotate(-1.2 + beat * 0.15);
      ctx.fillStyle = '#F6D3DD'; ctx.beginPath(); ctx.ellipse(0, -10, 5, 12, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
      // tail, feet, body
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(-20, -2, 6, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = fur;
      ctx.beginPath(); ctx.ellipse(-12, 12, 8, 4, 0.3, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0, 20, 14, -0.1, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(13, 10, 5, 3.5, -0.4, 0, TAU); ctx.fill(); ctx.stroke();
      // head
      ctx.beginPath(); ctx.arc(14, -8, 13, 0, TAU); ctx.fill(); ctx.stroke();
      // near ear streaming back
      ctx.save(); ctx.translate(12, -18); ctx.rotate(-0.95 + beat * 0.2);
      ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(0, -11, 5.5, 13, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#F7B8C8'; ctx.beginPath(); ctx.ellipse(0, -11, 2.4, 8.5, 0, 0, TAU); ctx.fill();
      ctx.restore();
      // face
      if (dead) {
        ctx.beginPath(); ctx.moveTo(17, -12); ctx.lineTo(22, -7); ctx.moveTo(22, -12); ctx.lineTo(17, -7); ctx.stroke();
      } else {
        ctx.fillStyle = '#3A2E36'; ctx.beginPath(); ctx.arc(19.5, -9.5, 2.5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(20.4, -10.4, 0.9, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,140,170,.55)'; ctx.beginPath(); ctx.ellipse(16, -3, 4, 2.4, 0, 0, TAU); ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(23, -5); ctx.quadraticCurveTo(24.5, -3.5, 26, -5); ctx.stroke();
      // near wing on her back, in front of the body
      ctx.save(); ctx.translate(-4, -9); ctx.scale(0.9, 0.9); wing(beat); ctx.restore();
    }

    function drawPlayer() {
      const tilt = state !== 'play' && state !== 'over' ? 0 : Math.max(-0.45, Math.min(bunny.vy / 700, 1.2));
      const flapping = state === 'play' && bunny.vy < 0;
      const beat = state === 'over' ? 0.4 : Math.sin(t * (flapping ? 30 : 10)) * 0.45;
      ctx.save(); ctx.translate(bunny.x, bunny.y); ctx.rotate(tilt);
      if (!(BW.friends && BW.friends.get(options.character))) {
        ctx.scale(1.3, 1.3);
        flyingBunny(beat, state === 'over');
      } else {
        // your animal's own picture, looking the way it flies (right), with the wings on its
        // back: low on the left side, behind the body, away from the face
        const img = BW.friends.cutout(options.character);
        const wings = !OWN_WINGS.includes(options.character);
        if (wings) { ctx.save(); ctx.translate(-12, 8); ctx.scale(0.85, 0.85); wing(beat - 0.3); ctx.restore(); }
        if (img.complete && img.naturalWidth) {
          // fit the picture in a 54 x 54 box, whatever its shape
          const k = 54 / Math.max(img.naturalWidth, img.naturalHeight);
          const w = img.naturalWidth * k, h = img.naturalHeight * k;
          if (state === 'over') ctx.filter = 'grayscale(.6)';
          ctx.save();
          if (BW.friends.facesLeft(options.character)) ctx.scale(-1, 1);
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();
          ctx.filter = 'none';
        }
        if (wings) { ctx.save(); ctx.translate(-14, 12); ctx.scale(0.72, 0.72); wing(beat); ctx.restore(); }
      }
      ctx.restore();
    }

    function text(str, x, y, size) {
      ctx.font = `800 ${size}px 'Baloo 2', 'Trebuchet MS', sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = size / 6; ctx.strokeStyle = OUTLINE; ctx.strokeText(str, x, y);
      ctx.fillStyle = '#FFF8F1'; ctx.fillText(str, x, y);
    }

    // the first screen: big cream buttons, one for each way to play
    function drawChooser() {
      ctx.fillStyle = 'rgba(60, 40, 30, .25)'; ctx.fillRect(0, 0, W, H);
      text('Flappy Bunny', W / 2, 120, 44);
      text('How do you want to play?', W / 2, 200, 20);
      CHOICES.forEach(([id, label, icon], i) => {
        const [x, y, w, h] = choiceBox(i);
        ctx.fillStyle = 'rgba(110,74,58,.35)'; roundRect(x + 2, y + 4, w, h, 18); ctx.fill();
        ctx.fillStyle = '#FFF6EA'; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3;
        roundRect(x, y, w, h, 18); ctx.fill(); ctx.stroke();
        ctx.font = `28px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(icon, x + 36, y + h / 2 + 1);
        ctx.font = `800 21px 'Baloo 2', 'Trebuchet MS', sans-serif`; ctx.textAlign = 'left';
        ctx.fillStyle = OUTLINE; ctx.fillText(label, x + 70, y + h / 2 + 2);
      });
    }

    // the little camera picture (mirrored, like a mirror) with a dot on what it's following
    function drawCamera() {
      if (!motion || !motion.video) return;
      const v = motion.video, x = W - 98, y = 14, w = 84, h = 63;
      ctx.save();
      roundRect(x, y, w, h, 10); ctx.clip();
      ctx.translate(x + w, y); ctx.scale(-1, 1);
      if (v.readyState >= 2) ctx.drawImage(v, 0, 0, w, h);
      ctx.restore();
      ctx.lineWidth = 3; ctx.strokeStyle = motion.seen ? '#8EC25E' : '#F28C8C';
      roundRect(x, y, w, h, 10); ctx.stroke();
      if (motion.seen && motion.point) {
        ctx.fillStyle = '#FF7FAF'; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x + motion.point.x * w, y + motion.point.y * h, 5, 0, TAU); ctx.fill(); ctx.stroke();
      }
    }

    // the friend's animal, see-through, flying where they are, with their name
    let friendY = 300;
    function drawFriend() {
      const o = duo.other();
      if (o.y == null) return;
      friendY += (o.y - friendY) * 0.3;
      const pic = BW.friends && BW.friends.cutout(duo.them.pet || 'bunny');
      ctx.save();
      ctx.globalAlpha = o.alive === false ? 0.3 : 0.55;
      ctx.translate(bunny.x - 26, friendY);
      if (pic && pic.complete && pic.naturalWidth) {
        const k = 44 / Math.max(pic.naturalWidth, pic.naturalHeight);
        if (BW.friends.facesLeft(duo.them.pet)) ctx.scale(-1, 1);
        ctx.drawImage(pic, -pic.naturalWidth * k / 2, -pic.naturalHeight * k / 2, pic.naturalWidth * k, pic.naturalHeight * k);
      } else { ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill(); }
      ctx.restore();
      ctx.save();
      ctx.font = `800 11px 'Baloo 2', 'Trebuchet MS', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(62, 111, 168, .85)';
      ctx.fillText(duo.them.name || duo.them.username, bunny.x - 26, friendY - 30);
      ctx.restore();
    }

    function draw() {
      drawSky();
      pillars.forEach(drawPillar);
      drawGround();
      if (duo) drawFriend();
      if (state !== 'choose') drawPlayer();
      if (state === 'choose') drawChooser();
      else if (state === 'loading') {
        text('Flappy Bunny', W / 2, 150, 46);
        text(message, W / 2, 400, 20);
        text('Allow it when your phone asks', W / 2, 432, 16);
      } else if (state === 'ready' && duo) {
        // the 3-2-1 is drawn below
      } else if (state === 'ready') {
        text('Flappy Bunny', W / 2, 150, 46);
        const how = {
          tap: ['Tap to hop', ''],
          hand: [motion && motion.seen ? 'Keep your hand up...' : 'Show your hand', 'Move it up and down to fly'],
          tilt: ['Tap to start', 'Tilt your phone to fly']
        }[control];
        text(how[0], W / 2, 400, 26);
        if (how[1]) text(how[1], W / 2, 434, 17);
        if (message && control === 'tap') text(message, W / 2, 470, 15);
        text('Best ' + options.getBest(), W / 2, how[1] ? 470 + (message && control === 'tap' ? 30 : 0) : 440, 20);
      } else if (state === 'play' && duo) {
        text(String(score), 110, 70, 50);
      } else if (state === 'play') {
        text(String(score), W / 2, 70, 56);
        if (motion && lostFor > 0.4) text(control === 'hand' ? "Can't see your hand!" : 'Tilt sensor lost', W / 2, 130, 20);
      }
      drawCamera();
      if (duo) {
        K.duoPanel(ctx, duo, score, Number(duo.other().score) || 0, 'Pillars');
        if (state === 'ready') K.countdown(ctx, duo, 'Flappy Bunny');
        if (state === 'over') text(`Waiting for ${duo.them.name || duo.them.username}…`, W / 2, 300, 18);
      }
      if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.7})`; ctx.fillRect(0, 0, W, H); }
    }

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (!BW.kit.paused) update(dt);
      draw();
      raf = requestAnimationFrame(frame);
    }

    function onPointer(e) {
      e.preventDefault();
      if (BW.kit.paused || state === 'loading') return;
      if (state === 'choose') {
        const r = canvas.getBoundingClientRect();
        const x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
        CHOICES.forEach(([id], i) => {
          const [bx, by, bw, bh] = choiceBox(i);
          if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) choose(id);
        });
        return;
      }
      if (control === 'tilt' && state === 'ready') { motion.calibrate(); aim = 0.5; begin(); return; }
      if (control === 'tap') hop();
    }
    function onKey(e) {
      if (state === 'over' || BW.kit.paused) return;
      if (state === 'choose' && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); choose('tap'); return; }
      if (control === 'tap' && (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW')) { e.preventDefault(); hop(); }
    }

    canvas.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', resize);
    reset();
    resize();
    raf = requestAnimationFrame(frame);

    return {
      restart: reset,
      stop() {
        stopped = true;
        if (motion) motion.stop();
        cancelAnimationFrame(raf);
        canvas.removeEventListener('pointerdown', onPointer);
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', resize);
      }
    };
  }

  return { start };
})();
