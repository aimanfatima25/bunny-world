// Drawn sea friends for the fish games, in the soft style of the Merge the Fish card:
// chubby pastel bodies with gentle shading, thin dark outlines, dot eyes and rosy cheeks.
// BW.sea.draw(ctx, id, r, t) draws one centred on (0, 0), facing right; r is its size
// (about the body's half-length) and t the time, which makes fins and tails wiggle.
window.BW = window.BW || {};

BW.sea = (() => {
  const TAU = Math.PI * 2;
  const LINE = '#5B4650';

  function shade(ctx, light, base, r) {
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.45, r * 0.1, 0, 0, r * 1.2);
    g.addColorStop(0, light); g.addColorStop(1, base);
    return g;
  }

  function face(ctx, x, y, s) {
    s = s || 1;
    ctx.fillStyle = '#3A2E36';
    ctx.beginPath(); ctx.arc(x, y, 2.6 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(x + 0.9 * s, y - 0.9 * s, 0.9 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,140,170,.55)';
    ctx.beginPath(); ctx.ellipse(x - 1 * s, y + 6 * s, 3.4 * s, 2 * s, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.2 * s; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 3 * s, y + 5 * s); ctx.quadraticCurveTo(x + 4.5 * s, y + 6.6 * s, x + 6 * s, y + 5 * s);
    ctx.quadraticCurveTo(x + 7.5 * s, y + 6.6 * s, x + 9 * s, y + 5 * s);
    ctx.stroke();
  }

  // A cute fish: body w x h, a wiggling tail, top fin and side fin
  function fish(ctx, t, o) {
    const w = o.w || 17, h = o.h || 13, wag = Math.sin(t * 8) * 0.25;
    ctx.lineWidth = 1.6; ctx.strokeStyle = LINE; ctx.lineJoin = 'round';
    // tail
    ctx.save(); ctx.translate(-w + 3, 0); ctx.rotate(wag);
    ctx.fillStyle = o.fin;
    const tl = o.tail || 11;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.quadraticCurveTo(-tl * 0.4, -tl * 1.1, -tl, -tl * 0.9);
    ctx.quadraticCurveTo(-tl * 0.6, 0, -tl, tl * 0.9);
    ctx.quadraticCurveTo(-tl * 0.4, tl * 1.1, 2, 0);
    ctx.fill(); ctx.stroke();
    ctx.restore();
    // top fin
    ctx.fillStyle = o.fin;
    ctx.beginPath();
    ctx.moveTo(-w * 0.45, -h * 0.75);
    ctx.quadraticCurveTo(-w * 0.1, -h - (o.topFin || 6), w * 0.35, -h * 0.8);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (o.bottomFin) {
      ctx.beginPath();
      ctx.moveTo(-w * 0.4, h * 0.75);
      ctx.quadraticCurveTo(-w * 0.1, h + o.bottomFin, w * 0.25, h * 0.8);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // body
    ctx.fillStyle = shade(ctx, o.light, o.body, w);
    ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, TAU); ctx.fill();
    if (o.pattern) { ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, TAU); ctx.clip(); o.pattern(ctx, w, h); ctx.restore(); }
    ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, TAU); ctx.stroke();
    // belly glow and side fin
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.beginPath(); ctx.ellipse(1, h * 0.45, w * 0.6, h * 0.35, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(-1, h * 0.25); ctx.rotate(0.5 + Math.sin(t * 6) * 0.25);
    ctx.fillStyle = o.fin; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.ellipse(-3, 0, 5, 2.8, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
    face(ctx, w * 0.5, -h * 0.15, Math.min(1.1, h / 13));
  }

  const kinds = {
    goldie(ctx, t) { fish(ctx, t, { body: '#F6C94E', light: '#FFF2B8', fin: '#FBE7A6' }); },
    goldfish(ctx, t) { fish(ctx, t, { body: '#F59A55', light: '#FFD6A8', fin: '#FBC48A', tail: 15, topFin: 8 }); },
    bluefish(ctx, t) { fish(ctx, t, { body: '#7FB8EA', light: '#D7ECFF', fin: '#B9DBF6' }); },
    blackfish(ctx, t) { fish(ctx, t, { body: '#5E5A6E', light: '#9A96A8', fin: '#8A8594', w: 15, h: 12 }); },
    clownfish(ctx, t) {
      fish(ctx, t, {
        body: '#F48A3E', light: '#FFC08A', fin: '#F7A867',
        pattern(c, w, h) {
          c.fillStyle = '#FFFFFF'; c.strokeStyle = LINE; c.lineWidth = 1.2;
          [-w * 0.35, w * 0.25].forEach(x => {
            c.beginPath(); c.ellipse(x, 0, 3.4, h + 2, 0, 0, TAU); c.fill(); c.stroke();
          });
        }
      });
    },
    betta(ctx, t) {
      const flow = Math.sin(t * 4) * 0.12;
      ctx.lineWidth = 1.4; ctx.strokeStyle = LINE;
      ctx.fillStyle = 'rgba(150,165,240,.9)';
      // big flowing fins and fan tail
      ctx.save(); ctx.translate(-12, 0); ctx.rotate(flow);
      ctx.beginPath(); ctx.moveTo(4, -6);
      ctx.bezierCurveTo(-14, -26, -30, -12, -26, 0); ctx.bezierCurveTo(-30, 14, -14, 26, 4, 6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(-8, -9); ctx.quadraticCurveTo(-2, -26 - flow * 20, 8, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-10, 8); ctx.quadraticCurveTo(-6, 26 + flow * 20, 6, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
      fish(ctx, t, { body: '#6F84DE', light: '#C7D2FF', fin: '#A9B6F2', w: 15, h: 11, tail: 4 });
    },
    koi(ctx, t) {
      fish(ctx, t, {
        body: '#FFF6EE', light: '#FFFFFF', fin: '#FBD5C0', w: 21, h: 11, tail: 13,
        pattern(c, w) {
          c.fillStyle = '#F59A62';
          c.beginPath(); c.ellipse(-w * 0.2, -4, 7, 5, 0.3, 0, TAU); c.fill();
          c.beginPath(); c.ellipse(w * 0.45, -6, 5, 4, 0, 0, TAU); c.fill();
          c.beginPath(); c.ellipse(-w * 0.65, 3, 4, 3, 0, 0, TAU); c.fill();
        }
      });
    },
    angelfish(ctx, t) {
      fish(ctx, t, {
        body: '#F8DA6E', light: '#FFF4C4', fin: '#F9E7A4', w: 14, h: 15, topFin: 14, bottomFin: 12,
        pattern(c, w, h) {
          c.fillStyle = 'rgba(78,68,80,.85)';
          [-w * 0.45, w * 0.2].forEach(x => { c.beginPath(); c.ellipse(x, 0, 3, h + 2, 0, 0, TAU); c.fill(); });
        }
      });
    },
    puffer(ctx, t) {
      const r = 16, puff = 1 + Math.sin(t * 3) * 0.04;
      ctx.lineWidth = 1.5; ctx.strokeStyle = LINE; ctx.lineJoin = 'round';
      ctx.save(); ctx.scale(puff, puff);
      ctx.fillStyle = '#D9B275';
      for (let i = 0; i < 14; i++) {
        const a = i * TAU / 14;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a - 0.12) * r, Math.sin(a - 0.12) * r);
        ctx.lineTo(Math.cos(a) * (r + 5), Math.sin(a) * (r + 5));
        ctx.lineTo(Math.cos(a + 0.12) * r, Math.sin(a + 0.12) * r);
        ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = shade(ctx, '#FFF0CC', '#EBC88E', r);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FFF8E8';
      ctx.beginPath(); ctx.ellipse(1, 7, 11, 7, 0, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#F2D29A';
      ctx.save(); ctx.translate(-r, 0); ctx.rotate(Math.sin(t * 8) * 0.3);
      ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(-7, -6); ctx.lineTo(-7, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      face(ctx, 6, -3, 1);
    },
    axolotl(ctx, t) {
      const pink = '#F7BFD6', deep = '#EE8FB7', wag = Math.sin(t * 5) * 0.2;
      ctx.lineWidth = 1.5; ctx.strokeStyle = LINE; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      // tail fin
      ctx.save(); ctx.translate(-12, 4); ctx.rotate(wag);
      ctx.fillStyle = '#FBD6E5';
      ctx.beginPath(); ctx.moveTo(4, -5); ctx.bezierCurveTo(-8, -10, -18, -2, -20, 2); ctx.bezierCurveTo(-14, 8, -4, 8, 4, 5); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
      // little legs
      ctx.fillStyle = pink;
      [[-8, 11], [4, 12]].forEach(([x, y], i) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 6 + i * 2) * 0.3);
        ctx.beginPath(); ctx.ellipse(0, 2, 3, 4.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      // body and big round head
      ctx.fillStyle = shade(ctx, '#FFE6F0', pink, 16);
      ctx.beginPath(); ctx.ellipse(-4, 5, 13, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
      // feathery gills
      [[-10, -10, -0.9], [-12, -2, -0.2], [-10, 6, 0.5], [16, -10, 0.9], [18, -2, 0.2]].forEach(([x, y, a], i) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.sin(t * 4 + i) * 0.12);
        ctx.fillStyle = deep;
        ctx.beginPath(); ctx.ellipse(0, -5, 3, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.5)';
        ctx.beginPath(); ctx.ellipse(0, -6, 1, 4, 0, 0, TAU); ctx.fill();
        ctx.restore();
      });
      ctx.fillStyle = shade(ctx, '#FFF0F6', pink, 15);
      ctx.beginPath(); ctx.ellipse(4, -2, 15, 12, 0, 0, TAU); ctx.fill(); ctx.stroke();
      // face looking at you
      ctx.fillStyle = '#3A2E36';
      ctx.beginPath(); ctx.arc(-1, -3, 2.4, 0, TAU); ctx.arc(10, -3, 2.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(-0.2, -3.8, 0.8, 0, TAU); ctx.arc(10.8, -3.8, 0.8, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,120,160,.55)';
      ctx.beginPath(); ctx.ellipse(-4, 2, 3, 1.8, 0, 0, TAU); ctx.ellipse(13, 2, 3, 1.8, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(2.5, 1.5); ctx.quadraticCurveTo(4.5, 3.5, 6.5, 1.5); ctx.stroke();
    },
    // a chubby baby shark: soft blue-grey with a cream belly and a cheeky toothy grin
    shark(ctx, t) {
      const wag = Math.sin(t * 7) * 0.22;
      ctx.lineWidth = 1.6; ctx.strokeStyle = LINE; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      // crescent tail
      ctx.save(); ctx.translate(-20, -1); ctx.rotate(wag);
      ctx.fillStyle = '#8FAAC4';
      ctx.beginPath(); ctx.moveTo(3, 0);
      ctx.quadraticCurveTo(-6, -6, -12, -16); ctx.quadraticCurveTo(-7, -2, -12, 12); ctx.quadraticCurveTo(-5, 4, 3, 0);
      ctx.fill(); ctx.stroke();
      ctx.restore();
      // back fin
      ctx.fillStyle = '#8FAAC4';
      ctx.beginPath(); ctx.moveTo(-8, -11); ctx.quadraticCurveTo(-4, -26, 6, -24); ctx.quadraticCurveTo(0, -18, 4, -11);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // body
      ctx.fillStyle = shade(ctx, '#E4EEF7', '#A8C0D6', 22);
      ctx.beginPath(); ctx.ellipse(0, 0, 23, 13, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 23, 13, 0, 0, TAU); ctx.clip();
      ctx.fillStyle = '#FFF8EE';
      ctx.beginPath(); ctx.ellipse(4, 9, 20, 9, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(91,70,80,.35)'; ctx.lineWidth = 1;
      [-4, -1, 2].forEach(x => { ctx.beginPath(); ctx.moveTo(x, -4); ctx.quadraticCurveTo(x - 1.5, 0, x, 4); ctx.stroke(); });
      ctx.restore();
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(0, 0, 23, 13, 0, 0, TAU); ctx.stroke();
      // side fin
      ctx.save(); ctx.translate(-1, 7); ctx.rotate(0.7 + Math.sin(t * 6) * 0.25);
      ctx.fillStyle = '#B3C8DC'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(-3, 0, 5, 2.4, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
      // eye, blush and a grin with little teeth
      ctx.fillStyle = '#3A2E36'; ctx.beginPath(); ctx.arc(12, -3, 2.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(12.9, -3.9, 0.9, 0, TAU); ctx.fill();
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(9, -7.5); ctx.lineTo(14.5, -6); ctx.stroke();
      ctx.fillStyle = 'rgba(255,140,170,.55)'; ctx.beginPath(); ctx.ellipse(10, 2.5, 3.2, 1.8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#7A4A5A';
      ctx.beginPath(); ctx.moveTo(10, 4); ctx.quadraticCurveTo(16, 11, 22.5, 2.5); ctx.quadraticCurveTo(16, 5.5, 10, 4); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      [[12.8, 4.9], [16, 5.3], [19.2, 4.6]].forEach(([x, y]) => {
        ctx.beginPath(); ctx.moveTo(x - 1.5, y - 0.5); ctx.lineTo(x + 1.5, y - 0.6); ctx.lineTo(x, y + 2.4); ctx.closePath(); ctx.fill();
      });
      ctx.beginPath(); ctx.moveTo(10, 4); ctx.quadraticCurveTo(16, 11, 22.5, 2.5); ctx.stroke();
    },
    // a round little crocodile paddling along: sage green, bumpy back, long smiley snout
    croc(ctx, t) {
      const kick = Math.sin(t * 7);
      ctx.lineWidth = 1.6; ctx.strokeStyle = LINE; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const green = '#8DBF7A', dark = '#6FA35E';
      // swishing tail
      ctx.save(); ctx.translate(-16, 2); ctx.rotate(kick * 0.18);
      ctx.fillStyle = green;
      ctx.beginPath(); ctx.moveTo(2, -7); ctx.quadraticCurveTo(-14, -6, -24, 2); ctx.quadraticCurveTo(-12, 5, 2, 7); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = dark;
      [-6, -12, -18].forEach(x => { ctx.beginPath(); ctx.moveTo(x - 2, -4.5 - x * 0.12); ctx.lineTo(x, -8 - x * 0.12); ctx.lineTo(x + 2, -4.5 - x * 0.12); ctx.fill(); });
      ctx.restore();
      // paddling legs
      ctx.fillStyle = green;
      [[-10, 9, 0], [8, 10, 2]].forEach(([x, y, p]) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 7 + p) * 0.45);
        ctx.beginPath(); ctx.ellipse(0, 3, 3.4, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      // back bumps
      ctx.fillStyle = dark;
      [-11, -4, 3].forEach(x => { ctx.beginPath(); ctx.arc(x, -10, 3.4, Math.PI, 0); ctx.fill(); ctx.stroke(); });
      // body
      ctx.fillStyle = shade(ctx, '#D8EFC8', green, 18);
      ctx.beginPath(); ctx.ellipse(-3, 1, 17, 11, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#F4EBC8';
      ctx.beginPath(); ctx.ellipse(-2, 7, 12, 4, 0, 0, TAU); ctx.fill();
      // long snout with a row of little teeth
      ctx.fillStyle = shade(ctx, '#D8EFC8', green, 14);
      ctx.beginPath(); ctx.moveTo(8, -6); ctx.quadraticCurveTo(28, -7, 31, -1); ctx.quadraticCurveTo(31, 5, 24, 5);
      ctx.lineTo(9, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      for (let x = 13; x <= 25; x += 4) {
        ctx.beginPath(); ctx.moveTo(x - 1.4, 5.2); ctx.lineTo(x + 1.4, 5.2); ctx.lineTo(x, 7.6); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(11, 2.5); ctx.quadraticCurveTo(20, 4.5, 28, 1); ctx.stroke();
      ctx.fillStyle = '#5B4650';
      ctx.beginPath(); ctx.arc(28, -3, 0.9, 0, TAU); ctx.fill();
      // big eye on a bump
      ctx.fillStyle = green; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(9, -8, 5, Math.PI * 0.95, Math.PI * 2.05); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3A2E36'; ctx.beginPath(); ctx.arc(9.5, -7.5, 2.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(10.3, -8.3, 0.8, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,140,170,.55)'; ctx.beginPath(); ctx.ellipse(6, -0.5, 3, 1.7, 0, 0, TAU); ctx.fill();
    }
  };
  kinds['happy-axolotl'] = kinds.axolotl;
  kinds['sleepy-axolotl'] = kinds.axolotl;

  return {
    has(id) { return !!kinds[id]; },
    draw(ctx, id, r, t) {
      ctx.save();
      ctx.scale(r / 18, r / 18);
      (kinds[id] || kinds.goldie)(ctx, t || 0);
      ctx.restore();
    }
  };
})();
