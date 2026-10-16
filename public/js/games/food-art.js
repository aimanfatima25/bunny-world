// Drawn food for the cooking shops, in the soft pastel style of the sea friends:
// round shapes, gentle shading, thin dark outlines.
//   cooked rice and noodles (they come out of the rice cooker / pot looking cooked),
//   the bakery's ingredients (eggs, flour, sugar, milk, butter, chocolate, strawberries, cream),
//   its oven, and the cakes and treats that come out of it; the Pancake Shop's batter and pancakes.
// BW.food.draw(ctx, key, x, y, w, h, t) fits one into a box; each is drawn in a 100 x 80 space.
window.BW = window.BW || {};

BW.food = (() => {
  const TAU = Math.PI * 2;
  const LINE = '#5B4650';

  function shade(ctx, x, y, r, light, base) {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r * 1.2);
    g.addColorStop(0, light); g.addColorStop(1, base);
    return g;
  }
  function ell(ctx, x, y, rx, ry, fill, stroke) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke !== false) ctx.stroke();
  }
  function shadow(ctx, x, y, rx) {
    ctx.fillStyle = 'rgba(60, 35, 20, .18)';
    ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.22, 0, 0, TAU); ctx.fill();
  }
  function shine(ctx, x, y, rx, ry) {
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, -0.4, 0, TAU); ctx.fill();
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  const kinds = {
    // a fluffy white mound of cooked rice, with little grains
    rice(ctx) {
      shadow(ctx, 50, 66, 36);
      ctx.beginPath(); ctx.moveTo(14, 62);
      ctx.bezierCurveTo(14, 24, 86, 24, 86, 62); ctx.quadraticCurveTo(50, 70, 14, 62); ctx.closePath();
      ctx.fillStyle = shade(ctx, 46, 40, 34, '#FFFFFF', '#EDE6DA'); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(190, 175, 160, .8)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      [[30, 46, .4], [42, 38, -.3], [56, 40, .6], [68, 48, -.5], [38, 55, .1], [52, 52, -.7], [64, 58, .3], [26, 58, -.2], [48, 31, .2], [75, 56, .8]]
        .forEach(([x, y, a]) => { ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * 3, y - Math.sin(a) * 3); ctx.lineTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3); ctx.stroke(); });
      ctx.strokeStyle = LINE;
      shine(ctx, 38, 36, 9, 4);
    },
    // a round golden nest of cooked noodles
    noodles(ctx) {
      shadow(ctx, 50, 66, 38);
      ell(ctx, 50, 46, 38, 22, shade(ctx, 46, 40, 36, '#FFF0B8', '#E9C163'));
      ctx.save(); ctx.beginPath(); ctx.ellipse(50, 46, 37, 21, 0, 0, TAU); ctx.clip();
      ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (let i = 0; i < 9; i++) {
        ctx.strokeStyle = i % 2 ? 'rgba(201, 150, 60, .75)' : 'rgba(255, 246, 200, .9)';
        ctx.beginPath();
        ctx.ellipse(50 + Math.sin(i * 2.1) * 8, 46 + Math.cos(i * 1.7) * 4, 30 - i * 2.6, 15 - i * 1.3, i * 0.35, 0.3, TAU - 0.5);
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ell(ctx, 50, 46, 38, 22, null);
    },
    eggs(ctx) {
      shadow(ctx, 50, 68, 36);
      ctx.fillStyle = '#E9D2B4'; rr(ctx, 16, 46, 68, 22, 6); ctx.fill(); ctx.stroke();
      [[34, 40], [58, 38]].forEach(([x, y]) => {
        ctx.beginPath(); ctx.ellipse(x, y, 13, 17, 0, 0, TAU);
        ctx.fillStyle = shade(ctx, x, y, 15, '#FFFFFF', '#F3E6D6'); ctx.fill(); ctx.stroke();
        shine(ctx, x - 4, y - 7, 3.5, 5);
      });
      ctx.fillStyle = '#F1DDC0'; rr(ctx, 16, 52, 68, 16, 5); ctx.fill(); ctx.stroke();
    },
    flour(ctx) {
      shadow(ctx, 50, 70, 30);
      ctx.beginPath(); ctx.moveTo(26, 22); ctx.quadraticCurveTo(22, 46, 24, 68); ctx.lineTo(76, 68); ctx.quadraticCurveTo(78, 46, 74, 22);
      ctx.quadraticCurveTo(50, 28, 26, 22); ctx.closePath();
      ctx.fillStyle = shade(ctx, 46, 44, 30, '#FFFDF6', '#EADCC4'); ctx.fill(); ctx.stroke();
      // the tied-up top
      ctx.beginPath(); ctx.moveTo(30, 22); ctx.lineTo(38, 10); ctx.lineTo(50, 18); ctx.lineTo(62, 10); ctx.lineTo(70, 22); ctx.closePath();
      ctx.fillStyle = '#F6EBD8'; ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#C98F6B'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(33, 21); ctx.quadraticCurveTo(50, 26, 67, 21); ctx.stroke();
      // a little wheat on the front
      ctx.strokeStyle = '#D9A84E'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(50, 62); ctx.lineTo(50, 38); ctx.stroke();
      ctx.fillStyle = '#E8BE5E';
      [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]].forEach(([s, k]) => {
        ctx.beginPath(); ctx.ellipse(50 + (s ? 4 : -4), 42 + k * 6, 3, 5, s ? 0.6 : -0.6, 0, TAU); ctx.fill();
      });
      ctx.strokeStyle = LINE;
    },
    sugar(ctx) {
      shadow(ctx, 50, 70, 26);
      ctx.fillStyle = 'rgba(225, 240, 250, .9)'; rr(ctx, 30, 26, 40, 42, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      [[38, 56], [50, 58], [62, 56], [44, 47], [56, 47], [50, 38]].forEach(([x, y]) => { rr(ctx, x - 5, y - 5, 10, 10, 2); ctx.fill(); ctx.lineWidth = 1.2; ctx.stroke(); });
      ctx.lineWidth = 2;
      ctx.fillStyle = '#F6A9BC'; rr(ctx, 27, 16, 46, 12, 5); ctx.fill(); ctx.stroke();
      shine(ctx, 36, 40, 3, 9);
    },
    milk(ctx) {
      shadow(ctx, 50, 71, 22);
      ctx.beginPath(); ctx.moveTo(40, 20); ctx.lineTo(40, 28); ctx.quadraticCurveTo(30, 34, 30, 44); ctx.lineTo(30, 66); ctx.quadraticCurveTo(50, 72, 70, 66);
      ctx.lineTo(70, 44); ctx.quadraticCurveTo(70, 34, 60, 28); ctx.lineTo(60, 20); ctx.closePath();
      ctx.fillStyle = shade(ctx, 46, 44, 26, '#FFFFFF', '#EEF1F6'); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8FC1EA'; rr(ctx, 38, 12, 24, 10, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#BFE0F8'; rr(ctx, 33, 44, 34, 16, 5); ctx.fill(); ctx.lineWidth = 1.4; ctx.stroke(); ctx.lineWidth = 2;
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(50, 52, 4, 0, TAU); ctx.fill();
      shine(ctx, 38, 38, 3, 6);
    },
    butter(ctx) {
      shadow(ctx, 50, 68, 36);
      ell(ctx, 50, 60, 38, 10, '#FFFDF8');
      ctx.beginPath(); ctx.moveTo(24, 56); ctx.lineTo(24, 40); ctx.lineTo(34, 30); ctx.lineTo(78, 30); ctx.lineTo(78, 48); ctx.lineTo(68, 56); ctx.closePath();
      ctx.fillStyle = '#FBE08A'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(24, 40); ctx.lineTo(68, 40); ctx.lineTo(78, 30); ctx.moveTo(68, 40); ctx.lineTo(68, 56); ctx.stroke();
      ctx.fillStyle = '#FFF1B8'; ctx.beginPath(); ctx.moveTo(25, 40); ctx.lineTo(35, 31); ctx.lineTo(77, 31); ctx.lineTo(67, 40); ctx.closePath(); ctx.fill();
    },
    chocolate(ctx) {
      shadow(ctx, 50, 68, 36);
      ctx.save(); ctx.translate(50, 42); ctx.rotate(-0.12);
      ctx.fillStyle = '#7A4A33'; rr(ctx, -34, -20, 68, 40, 6); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#5E3524'; ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 17 + 8.5, -18); ctx.lineTo(i * 17 + 8.5, 18); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-32, 0); ctx.lineTo(32, 0); ctx.stroke();
      ctx.fillStyle = 'rgba(255, 220, 190, .25)'; rr(ctx, -30, -16, 12, 12, 2); ctx.fill();
      // pink wrapper on one end
      ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.fillStyle = '#F6A9BC'; rr(ctx, 10, -22, 26, 44, 5); ctx.fill(); ctx.stroke();
      ctx.restore();
    },
    strawberry(ctx) {
      shadow(ctx, 50, 68, 34);
      [[36, 44, -0.3], [62, 46, 0.3]].forEach(([x, y, a]) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(a);
        ctx.beginPath(); ctx.moveTo(0, 20); ctx.bezierCurveTo(-20, 6, -16, -14, 0, -12); ctx.bezierCurveTo(16, -14, 20, 6, 0, 20); ctx.closePath();
        ctx.fillStyle = shade(ctx, -3, -2, 16, '#FF9A9A', '#E8455A'); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFE9A8';
        [[-6, -2], [5, -3], [-2, 6], [7, 6], [-8, 7], [1, 13]].forEach(([sx, sy]) => { ctx.beginPath(); ctx.ellipse(sx, sy, 1.2, 1.8, 0, 0, TAU); ctx.fill(); });
        ctx.fillStyle = '#7CC36A';
        for (let k = 0; k < 5; k++) {
          const ang = -Math.PI / 2 + (k - 2) * 0.55;
          ctx.beginPath(); ctx.ellipse(Math.cos(ang) * 6, -12 + Math.sin(ang) * 3, 6, 2.6, ang, 0, TAU); ctx.fill(); ctx.lineWidth = 1.2; ctx.stroke();
        }
        ctx.restore(); ctx.lineWidth = 2;
      });
    },
    cream(ctx) {
      shadow(ctx, 50, 69, 30);
      ctx.beginPath(); ctx.moveTo(24, 48); ctx.quadraticCurveTo(26, 68, 50, 68); ctx.quadraticCurveTo(74, 68, 76, 48); ctx.closePath();
      ctx.fillStyle = '#F8D7DF'; ctx.fill(); ctx.stroke();
      // a whipped swirl
      ctx.fillStyle = '#FFFDF8';
      [[50, 44, 24, 8], [50, 34, 17, 7], [50, 25, 10, 6]].forEach(([x, y, rx, ry]) => ell(ctx, x, y, rx, ry, shade(ctx, x, y, rx, '#FFFFFF', '#F1E9E0')));
      ctx.beginPath(); ctx.moveTo(50, 19); ctx.quadraticCurveTo(54, 12, 58, 14); ctx.stroke();
    },
    // the oven: soft pink, a warm window that glows while baking
    oven(ctx, t, on) {
      shadow(ctx, 50, 78, 42);
      ctx.fillStyle = shade(ctx, 40, 30, 50, '#FFE3EA', '#F4B8C7'); rr(ctx, 10, 6, 80, 70, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FBD3DD'; rr(ctx, 10, 6, 80, 14, 8); ctx.fill(); ctx.stroke();
      [26, 40, 54].forEach(x => { ctx.fillStyle = '#FFFDF8'; ctx.beginPath(); ctx.arc(x, 13, 3.6, 0, TAU); ctx.fill(); ctx.stroke(); });
      ctx.fillStyle = '#8CC77A'; ctx.beginPath(); ctx.arc(76, 13, 3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#C9A08A'; rr(ctx, 24, 25, 52, 5, 2.5); ctx.fill(); ctx.stroke();
      const glow = on ? 0.55 + Math.sin(t * 6) * 0.15 : 0;
      ctx.fillStyle = on ? `rgba(255, 170, 90, ${glow + 0.3})` : '#6E5560';
      rr(ctx, 20, 34, 60, 34, 7); ctx.fill(); ctx.stroke();
      shine(ctx, 32, 42, 8, 3);
    },
    // the mixing bowl, with a whisk leaning in it
    bowl(ctx) {
      ctx.strokeStyle = '#B9B4C2'; ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.ellipse(70 + i * 2, 18, 6 - Math.abs(i) * 2, 14, 0.5, 0, TAU); ctx.stroke(); }
      ctx.strokeStyle = '#C98F6B'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(76, 6); ctx.lineTo(84, -6); ctx.stroke();
    },
    'vanilla-cake'(ctx) { layerCake(ctx, '#FFF4DC', '#F6E2BC', '#FFFDF8', cake => { berry(ctx, 50, 18); }); },
    'chocolate-cake'(ctx) {
      layerCake(ctx, '#9A6447', '#7A4A33', '#6B3D2A', () => {
        ctx.fillStyle = '#5E3524';
        [[38, 20], [50, 17], [62, 20]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 4, 3, 0.4, 0, TAU); ctx.fill(); ctx.stroke(); });
      }, true);
    },
    'strawberry-cake'(ctx) {
      layerCake(ctx, '#FFFDF8', '#F5E7DA', '#FFFDF8', () => {
        [[36, 20], [50, 17], [64, 20]].forEach(([x, y]) => berry(ctx, x, y));
      }, false, '#F7A9BC');
    },
    cupcakes(ctx) {
      [[32, 1], [66, 0]].forEach(([x, k]) => {
        ctx.fillStyle = k ? '#F6A9BC' : '#BFE0F8';
        ctx.beginPath(); ctx.moveTo(x - 15, 46); ctx.lineTo(x - 11, 68); ctx.lineTo(x + 11, 68); ctx.lineTo(x + 15, 46); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(91,70,80,.4)'; ctx.lineWidth = 1.2;
        for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 5, 47); ctx.lineTo(x + i * 4, 67); ctx.stroke(); }
        ctx.strokeStyle = LINE; ctx.lineWidth = 2;
        const top = k ? '#FFE3EA' : '#FFF6E6';
        [[x, 42, 17, 8], [x, 34, 12, 7], [x, 27, 7, 5]].forEach(([cx, cy, rx, ry]) => ell(ctx, cx, cy, rx, ry, shade(ctx, cx, cy, rx, '#FFFFFF', top)));
        berry(ctx, x, 20, 0.6);
      });
    },
    cookies(ctx) {
      shadow(ctx, 50, 70, 36);
      [[36, 52], [64, 54], [50, 38]].forEach(([x, y]) => {
        ell(ctx, x, y, 18, 12, shade(ctx, x, y, 18, '#F3CF96', '#D9A464'));
        ctx.fillStyle = '#5E3524';
        [[-7, -3], [5, -4], [0, 3], [8, 4], [-6, 5]].forEach(([cx, cy]) => { ctx.beginPath(); ctx.ellipse(x + cx, y + cy, 2, 1.6, 0, 0, TAU); ctx.fill(); });
      });
    },
    brownies(ctx) {
      shadow(ctx, 50, 70, 36);
      [[30, 40], [54, 46]].forEach(([x, y]) => {
        ctx.fillStyle = '#6B3D2A'; rr(ctx, x, y, 26, 22, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#8A5A40'; rr(ctx, x, y, 26, 8, 4); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,230,210,.35)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x + 5, y + 4); ctx.lineTo(x + 12, y + 3); ctx.moveTo(x + 15, y + 5); ctx.lineTo(x + 21, y + 4); ctx.stroke();
        ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      });
    }
  };

  // ---------- pancakes ----------

  // a stack of golden pancakes on a plate with syrup; top(ctx) adds the toppings
  function stack(ctx, n, top, syrup) {
    shadow(ctx, 50, 72, 40);
    ell(ctx, 50, 66, 42, 10, '#FFFDF8');
    for (let i = 0; i < n; i++) {
      const y = 58 - i * 9;
      ctx.beginPath(); ctx.ellipse(50, y, 32, 9, 0, 0, TAU);
      const g = ctx.createLinearGradient(0, y - 9, 0, y + 9);
      g.addColorStop(0, '#F7D08A'); g.addColorStop(1, '#D9954A');
      ctx.fillStyle = g; ctx.fill(); ctx.stroke();
    }
    const ty = 58 - (n - 1) * 9;
    ell(ctx, 50, ty - 2, 30, 7, '#F9DC9C');
    if (syrup !== false) {
      ctx.fillStyle = 'rgba(214, 133, 40, .85)';
      ctx.beginPath(); ctx.ellipse(50, ty - 2, 22, 5, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(30, ty); ctx.quadraticCurveTo(28, ty + 12, 31, ty + 14); ctx.quadraticCurveTo(34, ty + 10, 35, ty + 3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(66, ty + 1); ctx.quadraticCurveTo(67, ty + 16, 70, ty + 18); ctx.quadraticCurveTo(72, ty + 12, 71, ty + 2); ctx.fill();
    }
    if (top) top(ty - 4);
  }
  const blue = (ctx, x, y) => { ctx.fillStyle = '#5B6FC9'; ctx.beginPath(); ctx.arc(x, y, 3.6, 0, TAU); ctx.fill(); ctx.lineWidth = 1; ctx.stroke(); ctx.lineWidth = 2; };
  const butterPat = (ctx, y) => { ctx.fillStyle = '#FBE08A'; rr(ctx, 42, y - 7, 16, 10, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#FFF1B8'; rr(ctx, 43, y - 7, 14, 4, 2); ctx.fill(); };
  Object.assign(kinds, {
    // the batter bowl in the ingredient box
    'batter-bowl'(ctx) {
      shadow(ctx, 50, 70, 34);
      ctx.beginPath(); ctx.moveTo(18, 42); ctx.quadraticCurveTo(22, 70, 50, 70); ctx.quadraticCurveTo(78, 70, 82, 42); ctx.closePath();
      ctx.fillStyle = '#C98F6B'; ctx.fill(); ctx.stroke();
      ell(ctx, 50, 42, 32, 9, '#FBE7B5');
      ctx.strokeStyle = 'rgba(201, 150, 80, .6)'; ctx.beginPath(); ctx.ellipse(50, 42, 18, 4, 0, 0.3, 4); ctx.stroke(); ctx.strokeStyle = LINE;
      ctx.lineWidth = 3.5; ctx.strokeStyle = '#B98A5E'; ctx.beginPath(); ctx.moveTo(60, 40); ctx.lineTo(78, 14); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = LINE; ell(ctx, 59, 41, 6, 3, '#E9E2D6');
    },
    // cooked batter: a soft golden pancake stack
    batter(ctx) { stack(ctx, 3, null, false); },
    'pancake-butter'(ctx) { stack(ctx, 3, y => butterPat(ctx, y)); },
    'pancake-berry'(ctx) {
      stack(ctx, 3, y => {
        [[40, y], [56, y - 2], [48, y - 6]].forEach(([x, yy]) => berry(ctx, x, yy, 0.9));
        [[34, y + 2], [62, y + 1], [52, y + 3], [45, y - 2]].forEach(([x, yy]) => blue(ctx, x, yy));
      });
    },
    'pancake-choco'(ctx) {
      stack(ctx, 3, y => {
        ctx.fillStyle = '#5E3524';
        ctx.beginPath(); ctx.ellipse(50, y + 2, 24, 6, 0, 0, TAU); ctx.fill();
        [[34, y + 4, 12], [48, y + 6, 16], [63, y + 4, 11]].forEach(([x, yy, d]) => { ctx.beginPath(); ctx.ellipse(x, yy + d / 2, 2.5, d / 2, 0, 0, TAU); ctx.fill(); });
        ctx.fillStyle = '#C99566';
        [[40, y - 2], [52, y - 4], [59, y]].forEach(([x, yy]) => { ctx.beginPath(); ctx.ellipse(x, yy, 4, 3, 0.4, 0, TAU); ctx.fill(); ctx.lineWidth = 1; ctx.stroke(); ctx.lineWidth = 2; });
      }, false);
    },
    'pancake-cream'(ctx) {
      stack(ctx, 3, y => {
        [[50, y - 2, 14, 6], [50, y - 9, 9, 5], [50, y - 15, 5, 4]].forEach(([x, yy, rx, ry]) => ell(ctx, x, yy, rx, ry, '#FFFDF8'));
        berry(ctx, 50, y - 20, 0.8);
        berry(ctx, 33, y + 2, 0.7); berry(ctx, 67, y + 2, 0.7);
      });
    },
    'pancake-banana'(ctx) {
      stack(ctx, 3, y => {
        [[36, y + 1], [46, y - 1], [56, y + 1], [64, y - 2]].forEach(([x, yy]) => { ell(ctx, x, yy, 5, 3.5, '#FFF3C4'); ctx.fillStyle = '#E9D58A'; ctx.beginPath(); ctx.arc(x, yy, 1.2, 0, TAU); ctx.fill(); });
        butterPat(ctx, y - 5);
      });
    }
  });

  function berry(ctx, x, y, s) {
    s = s || 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 7); ctx.bezierCurveTo(-8, 2, -6, -6, 0, -5); ctx.bezierCurveTo(6, -6, 8, 2, 0, 7); ctx.closePath();
    ctx.fillStyle = '#E8455A'; ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#7CC36A'; ctx.beginPath(); ctx.ellipse(0, -5, 4, 1.6, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // a round two-layer cake seen from the side
  function layerCake(ctx, side, sideDark, top, decorate, drip, filling) {
    shadow(ctx, 50, 72, 40);
    ell(ctx, 50, 68, 40, 8, '#FFFDF8');                     // the plate
    ctx.beginPath(); ctx.moveTo(18, 30); ctx.lineTo(18, 60); ctx.ellipse(50, 60, 32, 8, 0, Math.PI, 0, true); ctx.lineTo(82, 30); ctx.closePath();
    const g = ctx.createLinearGradient(18, 0, 82, 0); g.addColorStop(0, side); g.addColorStop(1, sideDark);
    ctx.fillStyle = g; ctx.fill(); ctx.stroke();
    // the filling between the layers
    ctx.strokeStyle = filling || (drip ? '#4E2B1E' : '#F6C6D2'); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(50, 46, 32, 8, 0, 0.1, Math.PI - 0.1); ctx.stroke();
    ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ell(ctx, 50, 30, 32, 9, top);
    if (drip) {
      ctx.fillStyle = '#5E3524';
      ctx.beginPath(); ctx.ellipse(50, 30, 32, 9, 0, 0, Math.PI); ctx.lineTo(18, 30);
      [24, 34, 46, 58, 70, 78].forEach((x, i) => { ctx.lineTo(x - 3, 36); ctx.quadraticCurveTo(x, 44 + (i % 2) * 6, x + 3, 36); });
      ctx.fill();
    }
    decorate();
  }

  return {
    has(key) { return !!kinds[key]; },
    draw(ctx, key, x, y, w, h, t, on) {
      const k = Math.min(w / 100, h / 80);
      ctx.save();
      ctx.translate(x + (w - 100 * k) / 2, y + (h - 80 * k) / 2);
      ctx.scale(k, k);
      ctx.lineWidth = 2; ctx.strokeStyle = LINE; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      kinds[key](ctx, t || 0, on);
      ctx.restore();
    }
  };
})();
