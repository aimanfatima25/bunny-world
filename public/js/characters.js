// The friends players can pick. Each one is drawn on a canvas, centred on (0, 0),
// with a round body of radius 16 and the face looking slightly to the right.
//   flap: extra tilt for ears/wings while hopping
//   dead: show X eyes after a bonk
window.BW = window.BW || {};

BW.characters = (() => {
  const INK = '#3B2F4A';
  const TAU = Math.PI * 2;

  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
  function oval(ctx, x, y, rx, ry, rot) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); }

  function eyes(ctx, dead, color) {
    color = color || INK;
    ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (const x of [2, 10]) {
      if (dead) {
        ctx.beginPath(); ctx.moveTo(x - 2.5, -4.5); ctx.lineTo(x + 2.5, 0.5); ctx.moveTo(x + 2.5, -4.5); ctx.lineTo(x - 2.5, 0.5); ctx.stroke();
      } else {
        circle(ctx, x, -2, 2.4); ctx.fill();
        if (color === INK) { ctx.fillStyle = '#FFFFFF'; circle(ctx, x + 0.8, -2.8, 0.8); ctx.fill(); ctx.fillStyle = color; }
      }
    }
  }

  function cheeks(ctx, leftOnly) {
    ctx.fillStyle = '#FFB3CB';
    oval(ctx, -3, 4.5, 3, 1.8); ctx.fill();
    if (!leftOnly) { oval(ctx, 13, 4.5, 2.4, 1.8); ctx.fill(); }
  }

  function smile(ctx, y) {
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(4.5, y); ctx.quadraticCurveTo(6, y + 2, 7.5, y); ctx.stroke();
  }

  const drawers = {
    bunny(ctx, flap, dead) {
      ctx.lineWidth = 2.5; ctx.strokeStyle = INK;
      [[-6, -0.35], [5, -0.05]].forEach(([ex, a]) => {
        ctx.save(); ctx.translate(ex, -10); ctx.rotate(a + flap - 0.25);
        ctx.fillStyle = '#FFFFFF'; oval(ctx, 0, -14, 5.5, 14); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFC2D6'; oval(ctx, 0, -14, 2.5, 9); ctx.fill();
        ctx.restore();
      });
      ctx.fillStyle = '#FFFFFF';
      circle(ctx, -15, 4, 5); ctx.fill(); ctx.stroke();
      circle(ctx, 0, 0, 16); ctx.fill(); ctx.stroke();
      // bow
      ctx.save(); ctx.translate(-4, -15); ctx.rotate(-0.3);
      ctx.fillStyle = '#FF7FAF'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -6); ctx.lineTo(-10, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, -6); ctx.lineTo(10, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      circle(ctx, 0, 0, 3); ctx.fill(); ctx.stroke();
      ctx.restore();
      eyes(ctx, dead);
      cheeks(ctx);
      ctx.fillStyle = '#FF7FAF'; circle(ctx, 6, 2.5, 1.6); ctx.fill();
      smile(ctx, 4.5);
    },

    kitty(ctx, flap, dead) {
      const fur = '#F6B26B';
      ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
      // tail: dark outline first, then fur on top
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-13, 7); ctx.quadraticCurveTo(-27, 4, -23, -10);
      ctx.lineWidth = 8; ctx.stroke(); ctx.lineWidth = 3.5; ctx.strokeStyle = fur; ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = INK;
      [[-8, -0.35], [6, 0.2]].forEach(([x, rot]) => {
        ctx.save(); ctx.translate(x, -11); ctx.rotate(rot + flap * 0.4);
        ctx.fillStyle = fur;
        ctx.beginPath(); ctx.moveTo(-6, 4); ctx.lineTo(0, -10); ctx.lineTo(6, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFC2D6';
        ctx.beginPath(); ctx.moveTo(-3, 2); ctx.lineTo(0, -5); ctx.lineTo(3, 2); ctx.closePath(); ctx.fill();
        ctx.restore();
      });
      ctx.fillStyle = fur; circle(ctx, 0, 0, 16); ctx.fill(); ctx.stroke();
      // forehead stripes
      ctx.strokeStyle = '#C9752A'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-2, -15); ctx.lineTo(-1, -10); ctx.moveTo(3.5, -15.5); ctx.lineTo(3.5, -10.5); ctx.moveTo(9, -14); ctx.lineTo(7.5, -9.5); ctx.stroke();
      eyes(ctx, dead);
      cheeks(ctx);
      ctx.fillStyle = '#FF7FAF';
      ctx.beginPath(); ctx.moveTo(4.5, 1.5); ctx.lineTo(7.5, 1.5); ctx.lineTo(6, 3.2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(6, 3.2); ctx.quadraticCurveTo(5, 5.5, 3.5, 4.5); ctx.moveTo(6, 3.2); ctx.quadraticCurveTo(7, 5.5, 8.5, 4.5); ctx.stroke();
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(13, 1.5); ctx.lineTo(20, -0.5); ctx.moveTo(13, 3.5); ctx.lineTo(20, 4.5); ctx.stroke();
    },

    panda(ctx, flap, dead) {
      ctx.lineWidth = 2.5; ctx.strokeStyle = INK;
      ctx.fillStyle = INK;
      circle(ctx, -10, -12, 5.5); ctx.fill();
      circle(ctx, 8, -13, 5.5); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; circle(ctx, 0, 0, 16); ctx.fill(); ctx.stroke();
      // eye patches with white eyes inside
      ctx.fillStyle = INK;
      oval(ctx, 1.5, -1.5, 3.8, 4.8, -0.35); ctx.fill();
      oval(ctx, 10.5, -1.5, 3.8, 4.8, 0.35); ctx.fill();
      if (dead) eyes(ctx, true, '#FFFFFF');
      else { ctx.fillStyle = '#FFFFFF'; circle(ctx, 2, -2.5, 1.5); ctx.fill(); circle(ctx, 10, -2.5, 1.5); ctx.fill(); }
      ctx.fillStyle = '#FFB3CB';
      oval(ctx, -4.5, 6, 2.6, 1.6); ctx.fill(); oval(ctx, 14, 6, 2, 1.6); ctx.fill();
      ctx.fillStyle = INK; oval(ctx, 6, 4, 2, 1.3); ctx.fill();
      smile(ctx, 6);
      // little arm that waves while hopping
      ctx.save(); ctx.translate(-5, 10); ctx.rotate(0.6 + flap * 1.5);
      ctx.fillStyle = INK; oval(ctx, 0, 0, 4, 6.5); ctx.fill();
      ctx.restore();
    },

    chick(ctx, flap, dead) {
      ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-1, -15); ctx.quadraticCurveTo(-5, -22, 0, -22); ctx.moveTo(2, -15); ctx.quadraticCurveTo(3, -24, 8, -20); ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.fillStyle = '#F7C548'; circle(ctx, 0, 0, 16); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.translate(-5, 5); ctx.rotate(-0.2 + flap * 1.2);
      ctx.fillStyle = '#EDB12F'; ctx.lineWidth = 2; oval(ctx, 0, 0, 7.5, 4.8); ctx.fill(); ctx.stroke();
      ctx.restore();
      eyes(ctx, dead);
      cheeks(ctx, true);
      ctx.fillStyle = '#F28C28'; ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(13, 0.5); ctx.lineTo(21, 3); ctx.lineTo(13, 5.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  };

  return {
    list: [
      { id: 'bunny', name: 'Bow Bunny' },
      { id: 'kitty', name: 'Ginger Kitty' },
      { id: 'panda', name: 'Bao Panda' },
      { id: 'chick', name: 'Peep Chick' }
    ],
    draw(ctx, id, opts) {
      opts = opts || {};
      ctx.save();
      (drawers[id] || drawers.bunny)(ctx, opts.flap || 0, !!opts.dead);
      ctx.restore();
    }
  };
})();
