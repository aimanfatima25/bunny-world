// All the girls and animal friends players can collect, using Aiman's own pictures
// (img/girls/girl-<n>.webp, img/animals/<id>.webp full-body animals, img/friends/<id>.webp cards).
// Players pick one girl and one animal.
//   group:  'girls', 'animals' or 'sea'
//   price:  stars to unlock (0 = a starter friend everyone has)
//   cat:    the category tab on the Choose pages (set below)
window.BW = window.BW || {};

BW.friends = (() => {
  const GIRL_NAMES = ['Mia', 'Luna', 'Clover', 'Honey', 'Skye', 'Melody', 'Nora', 'Rosie', 'Mochi', 'Sunny', 'Raven',
    'Lily', 'Coco', 'Ruby', 'Bella', 'Latte', 'Peach', 'Bree', 'Jasmine', 'Zoe', 'Hana', 'Mocha'];
  const GIRL_PRICES = [0, 0, 150, 0, 200, 250, 200, 250, 300, 250, 300, 350, 300, 400, 350, 400, 450, 400, 450, 500, 500, 600];

  // [id, name, stars, tab] in the sheet's order; bunny, kitty, panda and chick are free
  const ANIMALS = [
    ['bunny', 'Bunny', 0], ['puppy', 'Puppy', 150], ['cat', 'Kitty', 0], ['bear', 'Teddy Bear', 200],
    ['chick', 'Chick', 0, 'birds'], ['panda', 'Panda', 0], ['duck', 'Duckling', 150, 'birds'],
    ['penguin', 'Penguin', 200, 'birds'], ['sheep', 'Sheep', 200], ['squirrel', 'Squirrel', 200],
    ['fox', 'Fox', 300], ['raccoon', 'Raccoon', 250], ['deer', 'Deer', 300], ['hedgehog', 'Hedgehog', 200],
    ['alpaca', 'Alpaca', 300], ['goat', 'Goat', 200], ['cow', 'Cow', 250], ['piggy', 'Piggy', 200],
    ['otter', 'Otter', 250], ['seal', 'Grey Otter', 200], ['capybara', 'Capybara', 250],
    ['shihtzu', 'Shih Tzu', 300], ['husky', 'Husky', 300], ['ginger', 'Ginger Kitty', 200], ['fluffy', 'Fluffy Kitty', 250],
    ['tuxedo', 'Tuxedo Kitty', 250], ['lop', 'Lop Bunny', 200], ['cocoa-lop', 'Cocoa Bunny', 200], ['snow-bunny', 'Snow Bunny', 200],
    ['chinchilla', 'Chinchilla', 300], ['hamster', 'Hamster', 150], ['flower-capy', 'Flower Capy', 350],
    ['turtle', 'Turtle', 150, 'reptiles'], ['lizard', 'Lizard', 250, 'reptiles'], ['chipmunk', 'Chipmunk', 200],
    ['red-panda', 'Red Panda', 400], ['ferret', 'Ferret', 250], ['skunk', 'Skunk', 300], ['fennec', 'Fennec Fox', 350],
    ['lamb', 'Lamb', 250], ['sloth', 'Sloth', 350], ['berry-hog', 'Berry Hedgehog', 300], ['chick-capy', 'Capy & Chick', 400],
    ['owl', 'Owl', 300, 'birds'], ['snowbird', 'Snowbird', 150, 'birds'], ['crow', 'Crow', 200, 'birds'],
    ['bow-chick', 'Bow Chick', 150, 'birds'], ['sparrow', 'Sparrow', 150, 'birds'], ['dove', 'Dove', 200, 'birds'],
    ['pigeon', 'Pigeon', 150, 'birds'], ['flamingo', 'Flamingo', 400, 'birds'], ['cockatoo', 'Cockatoo', 350, 'birds'],
    ['budgie', 'Budgie', 250, 'birds'], ['java', 'Java Sparrow', 250, 'birds'], ['king-capy', 'King Capy', 500],
    ['leaf-capy', 'Leafy Capy', 300], ['scarf-capy', 'Cozy Capy', 350], ['yuzu-capy', 'Yuzu Capy', 350],
    ['sleepy-capy', 'Sleepy Capy', 350], ['crown-capy', 'Flower Crown Capy', 400], ['bunny-capy', 'Bunny Hood Capy', 450],
    ['frog-capy', 'Froggy Capy', 450], ['duck-capy', 'Ducky Capy', 450], ['sunny-capy', 'Sunflower Capy', 400],
    ['queen-capy', 'Queen Capy', 500]
  ];

  const list = [
    // girls (one is "you"; Mia, Luna and Honey are free)
    ...GIRL_NAMES.map((name, i) => ({ id: `girl-${i + 1}`, name, group: 'girls', price: GIRL_PRICES[i] })),
    // animals: Aiman's full-body animal sheet (img/animals/<id>.webp, cut by assets/cut-animals.mjs)
    ...ANIMALS.map(([id, name, price, cat]) => ({ id, name, group: 'animals', price, cat, body: true })),
    // older card-only animals, until they get full-body pictures too
    { id: 'octopus', name: 'Octopus', group: 'animals', price: 350 },
    { id: 'croc', name: 'Croc & Duckie', group: 'animals', price: 350 },
    { id: 'lion', name: 'Lion', group: 'animals', price: 400 },
    { id: 'tiger', name: 'Tiger', group: 'animals', price: 400 },
    { id: 'shark', name: 'Shark', group: 'animals', price: 450 },
    // sea friends
    { id: 'clownfish', name: 'Clownfish', group: 'sea', price: 100 },
    { id: 'goldie', name: 'Goldie', group: 'sea', price: 100 },
    { id: 'bluefish', name: 'Blue Fish', group: 'sea', price: 100 },
    { id: 'goldfish', name: 'Goldfish', group: 'sea', price: 150 },
    { id: 'puffer', name: 'Pufferfish', group: 'sea', price: 150 },
    { id: 'blackfish', name: 'Little Molly', group: 'sea', price: 150 },
    { id: 'angelfish', name: 'Angelfish', group: 'sea', price: 200 },
    { id: 'betta', name: 'Betta', group: 'sea', price: 250 },
    { id: 'koi', name: 'Koi', group: 'sea', price: 300 },
    { id: 'axolotl', name: 'Axolotl', group: 'sea', price: 300 },
    { id: 'happy-axolotl', name: 'Happy Axolotl', group: 'sea', price: 350 },
    { id: 'sleepy-axolotl', name: 'Sleepy Axolotl', group: 'sea', price: 350 }
  ];

  // Categories for the tabs on the Choose pages
  const GIRL_CATS = ['cozy', 'elegant', 'casual', 'cozy', 'casual', 'casual', 'school', 'elegant', 'cozy', 'casual', 'fantasy',
    'elegant', 'cozy', 'fantasy', 'school', 'cozy', 'fantasy', 'school', 'elegant', 'casual', 'cozy', 'casual'];
  const ANIMAL_CATS = {
    croc: 'reptiles', shark: 'sea', octopus: 'sea',
    axolotl: 'others', 'happy-axolotl': 'others', 'sleepy-axolotl': 'others'
  };
  list.forEach(f => {
    if (f.group === 'girls') f.cat = GIRL_CATS[Number(f.id.slice(5)) - 1];
    else f.cat = f.cat || ANIMAL_CATS[f.id] || (f.group === 'sea' ? 'sea' : 'mammals');
  });

  const byId = Object.fromEntries(list.map(f => [f.id, f]));
  const images = {};

  return {
    list,
    get(id) { return byId[id]; },
    img(id) {
      if (id.startsWith('girl-')) return `img/girls/${id}.webp`;
      return byId[id] && byId[id].body ? `img/animals/${id}.webp` : `img/friends/${id}.webp`;
    },
    // true for animals with a clean full-body picture (shown whole, never cropped)
    hasBody(id) { return !!(byId[id] && byId[id].body); },
    // The picture as an <img>, loaded once and reused (for drawing on canvases)
    image(id) {
      if (!images[id]) { images[id] = new Image(); images[id].src = this.img(id); }
      return images[id];
    },
    // The animal without any background, for home and the games: the full-body picture,
    // or for older card-only friends the card with its background removed (assets/cutout.mjs)
    cutout(id) {
      if (this.hasBody(id)) return this.image(id);
      const key = 'cut:' + id;
      if (!images[key]) {
        images[key] = new Image();
        images[key].src = (id.startsWith('girl-') ? 'img/cutouts/girls/' : 'img/cutouts/friends/') + id + '.webp';
      }
      return images[key];
    }
  };
})();
