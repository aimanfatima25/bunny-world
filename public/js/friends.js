// All the girls and animal friends players can collect, using Aiman's own pictures
// (img/girls/girl-<n>.webp and img/friends/<id>.webp). Players pick one girl and one animal.
//   group:  'girls', 'animals' or 'sea'
//   price:  stars to unlock (0 = a starter friend everyone has)
//   cat:    the category tab on the Choose pages (set below)
// In the games, the chosen animal appears as a round badge of their picture.
window.BW = window.BW || {};

BW.friends = (() => {
  const GIRL_NAMES = ['Mia', 'Luna', 'Clover', 'Honey', 'Skye', 'Melody', 'Nora', 'Rosie', 'Mochi', 'Sunny', 'Raven',
    'Lily', 'Coco', 'Ruby', 'Bella', 'Latte', 'Peach', 'Bree', 'Jasmine', 'Zoe', 'Hana', 'Mocha'];
  const GIRL_PRICES = [0, 0, 150, 0, 200, 250, 200, 250, 300, 250, 300, 350, 300, 400, 350, 400, 450, 400, 450, 500, 500, 600];

  const list = [
    // girls (one is "you"; Mia, Luna and Honey are free)
    ...GIRL_NAMES.map((name, i) => ({ id: `girl-${i + 1}`, name, group: 'girls', price: GIRL_PRICES[i] })),
    // animals
    { id: 'bunny', name: 'Bunny', group: 'animals', price: 0 },
    { id: 'cat', name: 'Kitty', group: 'animals', price: 0 },
    { id: 'panda', name: 'Panda', group: 'animals', price: 0 },
    { id: 'chick', name: 'Chick', group: 'animals', price: 0 },
    { id: 'puppy', name: 'Puppy', group: 'animals', price: 150 },
    { id: 'turtle', name: 'Turtle', group: 'animals', price: 150 },
    { id: 'penguin', name: 'Penguin', group: 'animals', price: 200 },
    { id: 'seal', name: 'Seal', group: 'animals', price: 200 },
    { id: 'hedgehog', name: 'Hedgehog', group: 'animals', price: 200 },
    { id: 'capybara', name: 'Capybara', group: 'animals', price: 250 },
    { id: 'otter', name: 'Otter', group: 'animals', price: 250 },
    { id: 'raccoon', name: 'Raccoon', group: 'animals', price: 250 },
    { id: 'fox', name: 'Fox', group: 'animals', price: 300 },
    { id: 'deer', name: 'Deer', group: 'animals', price: 300 },
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
    chick: 'birds', penguin: 'birds', turtle: 'reptiles', croc: 'reptiles', shark: 'sea', octopus: 'sea',
    axolotl: 'others', 'happy-axolotl': 'others', 'sleepy-axolotl': 'others'
  };
  list.forEach(f => {
    if (f.group === 'girls') f.cat = GIRL_CATS[Number(f.id.slice(5)) - 1];
    else f.cat = ANIMAL_CATS[f.id] || (f.group === 'sea' ? 'sea' : 'mammals');
  });

  const byId = Object.fromEntries(list.map(f => [f.id, f]));
  const images = {};

  return {
    list,
    get(id) { return byId[id]; },
    img(id) { return id.startsWith('girl-') ? `img/girls/${id}.webp` : `img/friends/${id}.webp`; },
    // The picture as an <img>, loaded once and reused (for drawing on canvases)
    image(id) {
      if (!images[id]) { images[id] = new Image(); images[id].src = this.img(id); }
      return images[id];
    }
  };
})();
