// Cute sounds and cozy music, made right in the browser with Web Audio (no sound files).
//   BW.sound.play('pop')        a short sound effect (see SFX below)
//   BW.sound.music('home')      start a music loop ('home', 'bubble', 'cook', 'dress'), null = stop
//   BW.sound.loop('boil', on)   a sound that keeps going while something is happening
//   BW.sound.setOn(sfx, music)  the switches in Settings (saved)
// Browsers only allow sound after the first tap, so nothing plays until then.
window.BW = window.BW || {};

BW.sound = (() => {
  let ac = null, master, sfxBus, musicBus;
  const prefs = (BW.store && BW.store.data.sound) || { sfx: true, music: true };
  let wanted = null, playing = null, nextAt = 0, step = 0, timer = 0;
  const loops = {};

  function ctx() {
    if (ac) return ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = prefs.sfx ? 0.55 : 0; sfxBus.connect(master);
    musicBus = ac.createGain(); musicBus.gain.value = prefs.music ? 0.22 : 0; musicBus.connect(master);
    return ac;
  }

  // ---------- building blocks ----------

  // one soft note: a sine (or other wave) with a quick attack and gentle fade
  function tone(freq, at, dur, o) {
    o = o || {};
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, at);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, at + dur);
    const vol = o.vol == null ? 0.5 : o.vol;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + (o.attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g); g.connect(o.bus || sfxBus);
    osc.start(at); osc.stop(at + dur + 0.05);
  }

  // a music-box / bell note: a sine plus a quieter one an octave up, ringing out
  function bell(freq, at, dur, vol, bus) {
    tone(freq, at, dur, { vol, bus, attack: 0.004 });
    tone(freq * 2, at, dur * 0.5, { vol: vol * 0.3, bus, attack: 0.004 });
  }

  let noiseBuf = null;
  function noise(at, dur, o) {
    o = o || {};
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf; src.loop = true;
    f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 1500, at);
    if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, at + dur);
    f.Q.value = o.q || 1;
    const vol = o.vol == null ? 0.3 : o.vol;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + (o.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
    src.start(at); src.stop(at + dur + 0.05);
  }

  // ---------- sound effects ----------

  const SFX = {
    tap(t) { tone(880, t, 0.07, { vol: 0.25, type: 'triangle' }); },
    click(t) { tone(1320, t, 0.05, { vol: 0.2 }); tone(1760, t + 0.03, 0.06, { vol: 0.15 }); },
    // Flappy Bunny: a cute rising beep with a little whoosh of wings
    hop(t) { tone(620, t, 0.12, { vol: 0.28, type: 'triangle', slide: 980 }); noise(t, 0.14, { freq: 900, sweep: 2600, vol: 0.08 }); },
    score(t) { bell(1318, t, 0.25, 0.3); bell(1760, t + 0.08, 0.35, 0.28); },
    bonk(t) { tone(330, t, 0.28, { vol: 0.35, type: 'triangle', slide: 110 }); noise(t, 0.12, { freq: 400, vol: 0.15 }); },
    // bubbles
    pop(t) { tone(500 + Math.random() * 200, t, 0.09, { vol: 0.35, slide: 1500 }); noise(t, 0.04, { freq: 3000, vol: 0.06 }); },
    shoot(t) { noise(t, 0.12, { freq: 1200, sweep: 3500, vol: 0.12 }); tone(700, t, 0.08, { vol: 0.12, slide: 1100 }); },
    // fish
    splash(t) { noise(t, 0.3, { freq: 1800, sweep: 500, vol: 0.22, q: 0.7 }); tone(900, t + 0.02, 0.08, { vol: 0.12, slide: 1400 }); },
    catch(t) { SFX.splash(t); bell(1046, t + 0.08, 0.2, 0.22); bell(1568, t + 0.16, 0.3, 0.2); },
    wrong(t) { tone(260, t, 0.16, { vol: 0.3, type: 'square', slide: 200 }); tone(200, t + 0.16, 0.22, { vol: 0.25, type: 'square', slide: 150 }); },
    merge(t) { [784, 988, 1318].forEach((f, i) => bell(f, t + i * 0.06, 0.25, 0.22)); },
    // cooking
    chop(t) { noise(t, 0.05, { freq: 2500, vol: 0.25, q: 2 }); tone(240, t, 0.05, { vol: 0.15, type: 'triangle' }); },
    plop(t) { tone(380, t, 0.12, { vol: 0.3, slide: 180 }); },
    // food landing on a plate or in a bowl: a soft plop and a little ceramic clink
    plate(t) { tone(300, t, 0.1, { vol: 0.35, slide: 150 }); noise(t, 0.05, { freq: 1200, vol: 0.12 }); bell(2637, t + 0.03, 0.18, 0.12); bell(3520, t + 0.05, 0.12, 0.06); },
    // dropping noodles or rice into the hot pot: a splash and a hiss
    drop(t) { noise(t, 0.35, { freq: 2200, sweep: 900, vol: 0.28, q: 0.8 }); noise(t + 0.05, 0.6, { freq: 5000, filter: 'highpass', vol: 0.06 }); tone(240, t, 0.15, { vol: 0.25, slide: 120 }); },
    mix(t) { for (let i = 0; i < 3; i++) noise(t + i * 0.13, 0.12, { freq: 1400, sweep: 3200, vol: 0.14, q: 1.5 }); },
    ding(t) { bell(1568, t, 0.6, 0.3); bell(2093, t + 0.05, 0.6, 0.15); },
    burn(t) { noise(t, 0.5, { freq: 3000, filter: 'highpass', vol: 0.12 }); tone(220, t, 0.3, { vol: 0.2, type: 'square', slide: 140 }); },
    serve(t) { [1046, 1318, 1568, 2093].forEach((f, i) => bell(f, t + i * 0.07, 0.35, 0.22)); },
    // stars, unlocking, dressing up
    coin(t) { bell(1568, t, 0.2, 0.28); bell(2093, t + 0.07, 0.35, 0.26); },
    swipe(t) { noise(t, 0.16, { freq: 800, sweep: 4000, vol: 0.12, filter: 'bandpass', q: 0.8 }); },
    sparkle(t) { [1760, 2349, 2637, 3136].forEach((f, i) => bell(f, t + i * 0.05, 0.25, 0.12)); },
    over(t) { [784, 659, 523].forEach((f, i) => bell(f, t + i * 0.14, 0.4, 0.25)); }
  };

  // ---------- sounds that keep going ----------

  const LOOPS = {
    // a pot bubbling away: a steady watery rumble and lots of little bubbles popping
    boil(t) {
      noise(t, 0.5, { freq: 520, vol: 0.2, q: 0.6, attack: 0.08 });
      noise(t, 0.5, { freq: 160, filter: 'lowpass', vol: 0.16, attack: 0.08 });
      for (let i = 0; i < 7; i++) {
        const at = t + Math.random() * 0.4, f = 260 + Math.random() * 380;
        tone(f, at, 0.05 + Math.random() * 0.04, { vol: 0.16 + Math.random() * 0.12, slide: f * 2.4 });
      }
    },
    // the oven humming warmly
    bake(t) { tone(110, t, 0.45, { vol: 0.04, type: 'triangle' }); if (Math.random() < 0.3) tone(1800, t + 0.2, 0.05, { vol: 0.03 }); }
  };
  function loopTick() {
    if (!ac) return;
    Object.keys(loops).forEach(k => { if (loops[k]) LOOPS[k](ac.currentTime + 0.02); });
  }
  setInterval(loopTick, 400);

  // ---------- music ----------
  // little 8-bar tunes on a pentatonic scale, so every note sounds happy together

  const N = n => 440 * Math.pow(2, (n - 69) / 12);   // MIDI note → Hz
  const SONGS = {
    // a cozy music box: slow, twinkly, soft chords underneath
    home: { bpm: 84, melody: [72, 76, 79, 76, 74, 72, 74, 76, 72, 76, 79, 81, 79, 76, 74, -1, 69, 72, 76, 74, 72, 69, 67, 69, 72, 74, 76, 79, 76, 74, 72, -1],
      chords: [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]] },
    // Bubble Pop: bouncy with a soft beat
    bubble: { bpm: 112, beat: true, melody: [76, -1, 79, 76, 81, -1, 79, 76, 74, 76, 72, -1, 74, 76, 79, -1, 76, -1, 79, 81, 84, 81, 79, 76, 74, 72, 74, 76, 72, -1, -1, -1],
      chords: [[48, 55, 64], [41, 48, 57], [45, 52, 60], [43, 50, 59]] },
    // the cooking shops: a gentle kalimba-like tune
    cook: { bpm: 96, melody: [67, 72, 74, 76, 74, 72, 67, -1, 69, 72, 74, 76, 79, 76, 74, -1, 76, 79, 81, 79, 76, 74, 72, -1, 74, 72, 69, 67, 69, 72, -1, -1],
      chords: [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]] },
    // dressing up: light and sparkly
    dress: { bpm: 100, melody: [79, 76, 79, 84, 81, 79, 76, -1, 77, 74, 77, 81, 79, 76, 72, -1, 79, 76, 79, 84, 86, 84, 81, 79, 77, 76, 74, 72, 74, 76, 72, -1],
      chords: [[48, 55, 64], [43, 50, 59], [45, 52, 60], [41, 48, 57]] }
  };

  function schedule() {
    if (!ac || !playing) return;
    const song = SONGS[playing], beat = 60 / song.bpm / 2;   // eighth notes
    while (nextAt < ac.currentTime + 0.3) {
      const i = step % song.melody.length, n = song.melody[i];
      if (n > 0) bell(N(n), nextAt, beat * 3, 0.32, musicBus);
      if (i % 8 === 0) {
        const ch = song.chords[(i / 8) % song.chords.length];
        ch.forEach(c => tone(N(c), nextAt, beat * 8, { vol: 0.07, type: 'triangle', attack: 0.15, bus: musicBus }));
      }
      if (song.beat) {
        if (i % 4 === 0) tone(110, nextAt, 0.15, { vol: 0.35, slide: 45, bus: musicBus });          // soft kick
        if (i % 4 === 2) noise(nextAt, 0.05, { freq: 7000, filter: 'highpass', vol: 0.08, bus: musicBus });   // hat
      }
      nextAt += beat;
      step++;
    }
  }

  // Aiman's music files (public/audio/): these songs play the file instead of a made-up tune
  const FILES = { home: 'audio/home.mp3', caramel: 'audio/caramel.mp3', avocado: 'audio/avocado.mp3' };
  const tracks = {};
  function track(src, vol) {
    if (!tracks[src]) { const a = new Audio(src); a.loop = true; a.preload = 'auto'; tracks[src] = a; }
    tracks[src].volume = vol;
    return tracks[src];
  }
  function stopFiles(except) {
    Object.entries(tracks).forEach(([src, a]) => { if (src !== except && !a.paused) a.pause(); });
  }
  // the noodle / rice pot boiling, while something is cooking (Ramen and Sushi)
  let boilOn = false;
  function boilFile() {
    const a = track('audio/boiling.mp3', 0.7);
    const want = boilOn && prefs.sfx && !document.hidden;
    if (want && a.paused) a.play().catch(() => {});
    if (!want && !a.paused) a.pause();
  }

  function startMusic() {
    clearInterval(timer);
    playing = wanted;
    const file = FILES[playing];
    stopFiles(file);
    if (file) {
      const a = track(file, 0.45);
      if (prefs.music && !document.hidden) a.play().catch(() => {});
      return;
    }
    if (!ac || !playing) return;
    step = 0; nextAt = ac.currentTime + 0.1;
    timer = setInterval(schedule, 100);
    schedule();
  }

  // the first tap anywhere wakes the sound up
  function unlock() {
    if (!ctx()) return;
    if (ac.state === 'suspended') ac.resume();
    if (wanted !== playing) startMusic();
  }
  ['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, unlock, { capture: true }));
  // quiet while the app is in the background
  document.addEventListener('visibilitychange', () => {
    const f = FILES[playing] && tracks[FILES[playing]];
    if (f) { if (document.hidden) f.pause(); else if (prefs.music) f.play().catch(() => {}); }
    boilFile();
    if (!ac) return;
    if (document.hidden) ac.suspend(); else ac.resume();
  });

  return {
    play(name) {
      if (!ac || !prefs.sfx || !SFX[name] || ac.state !== 'running') return;
      SFX[name](ac.currentTime + 0.01);
    },
    music(name) {
      if (wanted === name) return;
      wanted = name;
      if (ac) startMusic();
    },
    loop(name, on) {
      if (name === 'boil') { if (boilOn !== !!on) { boilOn = !!on; boilFile(); } return; }
      loops[name] = !!on;
    },
    get on() { return { sfx: prefs.sfx, music: prefs.music }; },
    setOn(sfx, music) {
      prefs.sfx = sfx; prefs.music = music;
      if (BW.store) BW.store.setSound(prefs);
      const f = FILES[playing] && tracks[FILES[playing]];
      if (f) { if (music) f.play().catch(() => {}); else f.pause(); }
      boilFile();
      if (ac) {
        sfxBus.gain.setTargetAtTime(sfx ? 0.55 : 0, ac.currentTime, 0.05);
        musicBus.gain.setTargetAtTime(music ? 0.22 : 0, ac.currentTime, 0.05);
      }
    }
  };
})();
