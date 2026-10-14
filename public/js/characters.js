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
    },

    // ---------- friends from the shop ----------

    frog(ctx, flap, dead) {
      const skin = '#97C459';
      ctx.lineWidth = 2.5; ctx.strokeStyle = INK;
      // eye bumps on top of the head
      ctx.fillStyle = skin;
      circle(ctx, 0, -13, 6.5); ctx.fill(); ctx.stroke();
      circle(ctx, 11, -12, 6.5); ctx.fill(); ctx.stroke();
      circle(ctx, 0, 0, 16); ctx.fill(); ctx.stroke();
      // cover the seams so the bumps look joined to the head
      circle(ctx, 0, -9, 5); ctx.fill(); circle(ctx, 11, -8, 5); ctx.fill();
      ctx.fillStyle = '#C0DD97'; oval(ctx, 2, 8, 10, 6); ctx.fill();
      if (dead) {
        ctx.save(); ctx.translate(-1, -11); eyes(ctx, true); ctx.restore();
      } else {
        ctx.fillStyle = '#FFFFFF'; circle(ctx, 0, -13, 4); ctx.fill(); circle(ctx, 11, -12, 4); ctx.fill();
        ctx.fillStyle = INK; circle(ctx, 1, -13, 2.2); ctx.fill(); circle(ctx, 12, -12, 2.2); ctx.fill();
      }
      cheeks(ctx);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(1, 3); ctx.quadraticCurveTo(7, 8, 13, 2); ctx.stroke();
    },

    dog(ctx, flap, dead) {
      ctx.lineWidth = 2.5; ctx.strokeStyle = INK;
      ctx.fillStyle = '#FFF0D9'; circle(ctx, 0, 0, 16); ctx.fill(); ctx.stroke();
      // brown patch over one eye
      ctx.save(); circle(ctx, 0, 0, 16); ctx.clip();
      ctx.fillStyle = '#E3B98F'; oval(ctx, 11, -4, 7, 6.5); ctx.fill();
      ctx.restore();
      // floppy ears that swing when hopping
      ctx.fillStyle = '#A9714B';
      [[-9, 0.3], [5, -0.15]].forEach(([x, rot]) => {
        ctx.save(); ctx.translate(x, -12); ctx.rotate(rot - flap * 0.8);
        oval(ctx, -3, 7, 5, 10); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      eyes(ctx, dead);
      cheeks(ctx, true);
      ctx.fillStyle = INK; oval(ctx, 14, 2, 3, 2.2); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(14, 4); ctx.quadraticCurveTo(12, 7, 9, 6); ctx.stroke();
      if (!dead) { ctx.fillStyle = '#FF7FAF'; oval(ctx, 11, 8.5, 2, 2.6); ctx.fill(); }
    },

    parrot(ctx, flap, dead) {
      ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
      // red crest feathers
      ctx.fillStyle = '#E24B4A';
      [[-4, -0.5], [0, -0.15], [4, 0.2]].forEach(([x, rot]) => {
        ctx.save(); ctx.translate(x, -14); ctx.rotate(rot);
        oval(ctx, 0, -5, 2.6, 6); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      ctx.lineWidth = 2.5;
      ctx.fillStyle = '#5DCAA5'; circle(ctx, 0, 0, 16); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FFF0B8'; oval(ctx, 6, 0, 8, 9); ctx.fill();
      ctx.save(); ctx.translate(-5, 5); ctx.rotate(-0.2 + flap * 1.2);
      ctx.fillStyle = '#378ADD'; ctx.lineWidth = 2; oval(ctx, 0, 0, 8, 5); ctx.fill(); ctx.stroke();
      ctx.restore();
      eyes(ctx, dead);
      cheeks(ctx, true);
      // hooked beak
      ctx.fillStyle = '#F7C548'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(12, -1); ctx.quadraticCurveTo(22, -1, 20, 7); ctx.quadraticCurveTo(17, 4, 12, 5); ctx.closePath();
      ctx.fill(); ctx.stroke();
    },

    capybara(ctx, flap, dead) {
      ctx.lineWidth = 2.5; ctx.strokeStyle = INK;
      ctx.fillStyle = '#B07A4A';
      circle(ctx, -9, -12, 3.5); ctx.fill(); ctx.stroke();
      circle(ctx, 5, -14, 3.5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#C8925E'; oval(ctx, 0, 0, 17, 15); ctx.fill(); ctx.stroke();
      // big friendly nose
      ctx.fillStyle = '#B5814F'; oval(ctx, 11, 3, 7, 6); ctx.fill();
      ctx.fillStyle = INK; oval(ctx, 13, 0.5, 1.4, 1); ctx.fill(); oval(ctx, 16, 1, 1.2, 0.9); ctx.fill();
      // always a little sleepy
      if (dead) eyes(ctx, true);
      else {
        ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-1, -4); ctx.quadraticCurveTo(1.5, -2, 4, -4); ctx.moveTo(6, -5); ctx.quadraticCurveTo(8.5, -3, 11, -5); ctx.stroke();
      }
      cheeks(ctx, true);
      // a yuzu on its head
      ctx.lineWidth = 2;
      ctx.fillStyle = '#F7A23B'; circle(ctx, -2, -17, 4.5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4FA35A'; oval(ctx, 1.5, -21.5, 3, 1.6, -0.5); ctx.fill(); ctx.stroke();
    },

    wolf(ctx, flap, dead) {
      const fur = '#A59BB3';
      ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
      // fluffy tail
      ctx.save(); ctx.translate(-14, 4); ctx.rotate(-0.5 + flap);
      ctx.fillStyle = fur; oval(ctx, -6, 0, 9, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FFFFFF'; oval(ctx, -12, 0, 3.5, 3); ctx.fill();
      ctx.restore();
      [[-8, -0.3], [7, 0.15]].forEach(([x, rot]) => {
        ctx.save(); ctx.translate(x, -11); ctx.rotate(rot + flap * 0.3);
        ctx.fillStyle = '#857A96';
        ctx.beginPath(); ctx.moveTo(-6, 4); ctx.lineTo(0, -11); ctx.lineTo(6, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFC2D6';
        ctx.beginPath(); ctx.moveTo(-3, 2); ctx.lineTo(0, -6); ctx.lineTo(3, 2); ctx.closePath(); ctx.fill();
        ctx.restore();
      });
      ctx.fillStyle = fur; circle(ctx, 0, 0, 16); ctx.fill(); ctx.stroke();
      ctx.save(); circle(ctx, 0, 0, 16); ctx.clip();
      ctx.fillStyle = '#FFFFFF'; oval(ctx, 9, 7, 9, 7); ctx.fill();
      ctx.restore();
      eyes(ctx, dead);
      cheeks(ctx, true);
      ctx.fillStyle = INK; oval(ctx, 14, 2, 2.6, 2); ctx.fill();
      smile(ctx, 6);
    },

    lion(ctx, flap, dead) {
      ctx.lineWidth = 2.5; ctx.strokeStyle = INK;
      ctx.fillStyle = '#D9792B';
      for (let i = 0; i < 10; i++) {
        const a = i * TAU / 10 + flap * 0.3;
        circle(ctx, Math.cos(a) * 15, Math.sin(a) * 15, 6.5); ctx.fill(); ctx.stroke();
      }
      circle(ctx, 0, 0, 16); ctx.fill();
      ctx.fillStyle = '#F7C548';
      circle(ctx, -7, -10, 3.5); ctx.fill(); ctx.stroke();
      circle(ctx, 8, -11, 3.5); ctx.fill(); ctx.stroke();
      circle(ctx, 1, 0, 13); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FFE7A8'; oval(ctx, 8, 5, 6, 4.5); ctx.fill();
      eyes(ctx, dead);
      cheeks(ctx);
      ctx.fillStyle = INK; oval(ctx, 9, 2, 2.2, 1.6); ctx.fill();
      smile(ctx, 5.5);
    },

    mimi(ctx, flap, dead) { drawMouse(ctx, flap, dead, '#D3D1C7', 'bow'); },
    momo(ctx, flap, dead) { drawMouse(ctx, flap, dead, '#B4B2A9', 'tie'); },

    unicorn(ctx, flap, dead) {
      ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
      // pastel mane flowing back
      ['#FFB3CB', '#AFA9EC', '#9FC9F2'].forEach((c, i) => {
        ctx.save(); ctx.translate(-6 - i * 3, -8 + i * 5); ctx.rotate(-0.6 + flap * 0.6);
        ctx.fillStyle = c; ctx.lineWidth = 2; oval(ctx, -4, 0, 8, 4.5); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      ctx.lineWidth = 2.5;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.moveTo(-2, -12); ctx.lineTo(1, -21); ctx.lineTo(5, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
      circle(ctx, 0, 0, 16); ctx.fill(); ctx.stroke();
      // golden horn
      ctx.fillStyle = '#F7C548';
      ctx.beginPath(); ctx.moveTo(5, -13); ctx.lineTo(12, -28); ctx.lineTo(11, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(7, -17); ctx.lineTo(11, -17.5); ctx.moveTo(8.5, -21.5); ctx.lineTo(11.5, -22); ctx.stroke();
      eyes(ctx, dead);
      cheeks(ctx);
      ctx.fillStyle = '#FF7FAF'; circle(ctx, 6, 2.5, 1.4); ctx.fill();
      smile(ctx, 4.5);
    }
  };

  // A friend in the games: a round badge of their picture with a soft brown ring, about the
  // size of the old drawn characters. It squishes a little when hopping and goes grey after a bonk.
  function drawBadge(ctx, id, flap, dead, r) {
    r = r || 19;
    const img = BW.friends.image(id);
    ctx.scale(1 + flap * 0.15, 1 - flap * 0.15);
    ctx.fillStyle = 'rgba(80, 45, 30, .18)';
    ctx.beginPath(); ctx.ellipse(0, r * 0.9, r * 0.8, r * 0.22, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
    ctx.fillStyle = '#FFF7EE'; ctx.fill();
    if (img.complete && img.naturalWidth) {
      ctx.save();
      ctx.clip();
      if (dead) ctx.filter = 'grayscale(1)';
      // the animal's face sits a little above the middle of each card
      const w = r * 2.5, h = w * img.naturalHeight / img.naturalWidth;
      ctx.drawImage(img, -w / 2, -h * 0.47, w, h);
      ctx.restore();
    }
    ctx.lineWidth = r * 0.14; ctx.strokeStyle = '#FFF7EE';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.lineWidth = r * 0.07; ctx.strokeStyle = '#8B5E4A';
    ctx.beginPath(); ctx.arc(0, 0, r + r * 0.09, 0, TAU); ctx.stroke();
  }

  // Mimi and Momo: two little mice with round ears and a curly tail
  function drawMouse(ctx, flap, dead, fur, extra) {
    ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-14, 6); ctx.quadraticCurveTo(-26, 10 + flap * 10, -24, -2); ctx.quadraticCurveTo(-23, -8, -18, -6);
    ctx.lineWidth = 5; ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#FFB3CB'; ctx.stroke(); ctx.strokeStyle = INK;
    ctx.fillStyle = fur;
    [[-8, -12], [7, -14]].forEach(([x, y]) => {
      circle(ctx, x, y, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FFC2D6'; circle(ctx, x, y, 4.5); ctx.fill(); ctx.fillStyle = fur;
    });
    circle(ctx, 0, 0, 16); ctx.fill(); ctx.stroke();
    eyes(ctx, dead);
    cheeks(ctx, true);
    ctx.fillStyle = '#FF7FAF'; circle(ctx, 15, 2, 2.2); ctx.fill();
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(13, 3); ctx.lineTo(20, 1); ctx.moveTo(13, 4.5); ctx.lineTo(20, 6); ctx.stroke();
    if (extra === 'bow') {
      // pink polka-dot bow between the ears
      ctx.save(); ctx.translate(0, -16); ctx.rotate(-0.15);
      ctx.fillStyle = '#FF7FAF'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, -5); ctx.lineTo(-8, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(8, -5); ctx.lineTo(8, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FFFFFF'; circle(ctx, -5, -1, 1); ctx.fill(); circle(ctx, 5, 1, 1); ctx.fill();
      ctx.fillStyle = '#FF7FAF'; circle(ctx, 0, 0, 2.5); ctx.fill(); ctx.stroke();
      ctx.restore();
    } else {
      // little blue bow tie under the chin
      ctx.save(); ctx.translate(3, 15);
      ctx.fillStyle = '#378ADD'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-6, -4); ctx.lineTo(-6, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(6, -4); ctx.lineTo(6, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      circle(ctx, 0, 0, 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  return {
    // price: coins to unlock in the shop (0 = a starter friend)
    list: [
      { id: 'bunny', name: 'Bow Bunny', price: 0 },
      { id: 'kitty', name: 'Ginger Kitty', price: 0 },
      { id: 'panda', name: 'Bao Panda', price: 0 },
      { id: 'chick', name: 'Peep Chick', price: 0 },
      { id: 'frog', name: 'Hoppy Frog', price: 100 },
      { id: 'dog', name: 'Biscuit Pup', price: 150 },
      { id: 'parrot', name: 'Kiwi Parrot', price: 200 },
      { id: 'capybara', name: 'Chill Capybara', price: 250 },
      { id: 'wolf', name: 'Misty Wolf', price: 300 },
      { id: 'lion', name: 'Sunny Lion', price: 400 },
      { id: 'mimi', name: 'Mimi Mouse', price: 500 },
      { id: 'momo', name: 'Momo Mouse', price: 500 },
      { id: 'unicorn', name: 'Star Unicorn', price: 800 }
    ],
    // id can be a drawn character ('kitty') or a friend from friends.js ('cat', 'otter');
    // opts.r sets the size of a friend's picture badge
    draw(ctx, id, opts) {
      opts = opts || {};
      const friend = BW.friends && BW.friends.get(id);
      const key = friend ? friend.sprite : id;
      ctx.save();
      if (drawers[key]) drawers[key](ctx, opts.flap || 0, !!opts.dead);
      else if (friend) drawBadge(ctx, friend.id, opts.flap || 0, !!opts.dead, opts.r);
      else drawers.bunny(ctx, opts.flap || 0, !!opts.dead);
      ctx.restore();
    }
  };
})();
