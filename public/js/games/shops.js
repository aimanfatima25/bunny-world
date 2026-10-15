// The three cooking shops, drawn from Aiman's shop designs (img/shops/<id>.webp, 941 x 1671).
// Every place is a box [x, y, width, height] in the design picture's own pixels:
//   pic:     the food picture (used on the menu board, boxes, plate, bubbles and recipe bar)
//   tap:     where you tap it on the shop picture (the front screen)
//   wall:    the part of the shop shown behind the customers in the kitchen view
//   station: the cooking spot cut from the design (rice cooker, stove, mixer)
//   cook:    ingredients that must cook on the station first ('*' = everything)
//   plate:   what you build the order in: a sushi 'plate', a ramen 'bowl' or a 'mixing bowl'
//   art:     a drawn picture (food-art.js) instead of a piece of the design
//   bake:    Cake & Sweets: mix in the bowl, bake in the oven, then serve straight from the oven
// cook.js turns each shop into a game (BW.games.sushi / ramen / cake).
window.BW = window.BW || {};

BW.shops = (() => {
  // the painted buttons are in the same places on all three designs
  const ui = (o) => Object.assign({
    stars: [190, 50, 140, 52],        // the number in the top-left pill
    level: [520, 46, 225, 62],        // "Lv. 3" and its bar in the top-middle pill
    menu: [812, 40, 80, 74],          // ≡ button: pause
    upgrade: [16, 312, 116, 116],
    recipes: [16, 437, 116, 122],
    shop: [16, 572, 116, 122],
    trophies: [812, 322, 116, 122],
    decor: [812, 447, 116, 122],
    map: [48, 1480, 170, 136],
    start: [302, 1420, 336, 222],
    stats: [722, 1480, 170, 136]
  }, o);

  return {
    sushi: {
      id: 'sushi', title: 'Sushi Shop', pill: '#FAE3BE',
      ui: ui({}),
      wall: [130, 130, 680, 461],
      station: { name: 'Rice Cooker', pic: [158, 598, 122, 186], verb: 'Cooking' },
      cook: ['rice'],
      plate: 'plate',
      counter: 846,                    // customers stand behind the counter top
      ingredients: {
        rice: { name: 'Rice', pic: [28, 1243, 116, 72], tap: [16, 1236, 142, 112] },
        nori: { name: 'Nori', pic: [172, 1243, 104, 72], tap: [162, 1236, 120, 112] },
        salmon: { name: 'Salmon', pic: [292, 1243, 92, 72], tap: [286, 1236, 104, 112] },
        tuna: { name: 'Tuna', pic: [398, 1243, 90, 72], tap: [392, 1236, 102, 112] },
        shrimp: { name: 'Shrimp', pic: [500, 1243, 90, 72], tap: [496, 1236, 100, 112] },
        egg: { name: 'Egg', pic: [602, 1243, 90, 72], tap: [598, 1236, 100, 112] },
        avocado: { name: 'Avocado', pic: [704, 1243, 98, 72], tap: [700, 1236, 106, 112] },
        cucumber: { name: 'Cucumber', pic: [812, 1243, 106, 72], tap: [808, 1236, 120, 112] }
      },
      dishes: {
        tuna: { name: 'Tuna Sushi', pic: [52, 938, 140, 78], tap: [34, 930, 172, 124], needs: ['rice', 'tuna'] },
        salmon: { name: 'Salmon Sushi', pic: [228, 938, 140, 78], tap: [212, 930, 172, 124], needs: ['rice', 'salmon'] },
        shrimp: { name: 'Shrimp Sushi', pic: [404, 938, 140, 78], tap: [388, 930, 172, 124], needs: ['rice', 'shrimp'] },
        egg: { name: 'Egg Sushi', pic: [580, 938, 128, 78], tap: [564, 930, 160, 124], needs: ['rice', 'egg', 'nori'] },
        ikura: { name: 'Ikura Sushi', pic: [764, 932, 110, 84], tap: [736, 930, 172, 124], needs: ['rice', 'nori', 'salmon'] },
        california: { name: 'California Roll', pic: [36, 1088, 148, 76], tap: [24, 1080, 176, 128], needs: ['nori', 'rice', 'avocado', 'cucumber'] },
        spicy: { name: 'Spicy Tuna Roll', pic: [222, 1088, 148, 76], tap: [208, 1080, 176, 128], needs: ['nori', 'rice', 'tuna', 'cucumber'] },
        dragon: { name: 'Dragon Roll', pic: [408, 1088, 140, 76], tap: [394, 1080, 170, 128], needs: ['nori', 'rice', 'shrimp', 'avocado'] },
        avocado: { name: 'Avocado Roll', pic: [586, 1088, 140, 76], tap: [572, 1080, 172, 128], needs: ['nori', 'rice', 'avocado'] }
      }
    },

    ramen: {
      id: 'ramen', title: 'Ramen Shop', pill: '#F9E7C8',
      wall: [130, 160, 680, 461],
      station: { name: 'Stove', pic: [318, 600, 284, 214], verb: 'Boiling' },
      cook: ['noodles'],
      plate: 'bowl',
      ui: ui({ recipes: [16, 437, 116, 120], trophies: [812, 318, 116, 116], decor: [812, 443, 116, 118],
        map: [48, 1468, 170, 140], start: [302, 1412, 336, 216], stats: [722, 1468, 170, 140] }),
      counter: 868,
      ingredients: {
        noodles: { name: 'Noodles', pic: [26, 1176, 140, 84], tap: [12, 1166, 160, 128] },
        chashu: { name: 'Chashu', pic: [186, 1176, 144, 84], tap: [176, 1166, 160, 128] },
        egg: { name: 'Eggs', pic: [350, 1186, 98, 76], tap: [342, 1166, 112, 128] },
        naruto: { name: 'Naruto', pic: [462, 1186, 100, 76], tap: [456, 1166, 112, 128] },
        bamboo: { name: 'Bamboo Shoots', pic: [576, 1182, 102, 80], tap: [570, 1166, 114, 128] },
        onion: { name: 'Green Onions', pic: [688, 1182, 106, 80], tap: [684, 1166, 116, 128] },
        nori: { name: 'Nori', pic: [800, 1176, 116, 86], tap: [798, 1166, 132, 128] }
      },
      dishes: {
        shoyu: { name: 'Shoyu Ramen', pic: [40, 950, 172, 140], tap: [36, 944, 178, 186], needs: ['noodles', 'chashu', 'egg', 'nori'] },
        miso: { name: 'Miso Ramen', pic: [216, 950, 170, 140], tap: [212, 944, 176, 186], needs: ['noodles', 'chashu', 'bamboo', 'onion'] },
        tonkotsu: { name: 'Tonkotsu Ramen', pic: [390, 966, 170, 124], tap: [388, 944, 174, 186], needs: ['noodles', 'chashu', 'egg', 'onion'] },
        spicy: { name: 'Spicy Ramen', pic: [564, 950, 170, 140], tap: [562, 944, 174, 186], needs: ['noodles', 'chashu', 'naruto', 'onion'] },
        veggie: { name: 'Vegetarian Ramen', pic: [738, 966, 172, 124], tap: [736, 944, 178, 186], needs: ['noodles', 'egg', 'bamboo', 'onion'] }
      }
    },

    // Cake & Sweets: mix ingredients in the mixing bowl, bake it in the oven, serve the cake.
    // The ingredients, oven and cakes are drawn (food-art.js), since the design shows only
    // finished treats; the front screen is still Aiman's shop picture.
    cake: {
      id: 'cake', title: 'Cake & Sweets', pill: '#FAE4C4', bake: true,
      ui: ui({ upgrade: [16, 298, 116, 120], recipes: [16, 432, 116, 122], shop: [16, 568, 116, 124],
        trophies: [812, 312, 116, 122], decor: [812, 437, 116, 122],
        map: [32, 1476, 172, 140], start: [296, 1470, 348, 174], stats: [736, 1476, 172, 140] }),
      wall: [130, 150, 680, 461],
      station: { name: 'Oven', art: 'oven', verb: 'Baking' },
      cook: [],
      plate: 'mixing bowl',
      ingredients: {
        flour: { name: 'Flour', art: 'flour' },
        eggs: { name: 'Eggs', art: 'eggs' },
        sugar: { name: 'Sugar', art: 'sugar' },
        milk: { name: 'Milk', art: 'milk' },
        butter: { name: 'Butter', art: 'butter' },
        chocolate: { name: 'Chocolate', art: 'chocolate' },
        strawberry: { name: 'Strawberry', art: 'strawberry' },
        cream: { name: 'Cream', art: 'cream' }
      },
      dishes: {
        vanilla: { name: 'Vanilla Cake', art: 'vanilla-cake', needs: ['flour', 'eggs', 'sugar', 'milk'] },
        chocolate: { name: 'Chocolate Cake', art: 'chocolate-cake', needs: ['flour', 'eggs', 'sugar', 'chocolate'] },
        strawberry: { name: 'Strawberry Cake', art: 'strawberry-cake', needs: ['flour', 'eggs', 'cream', 'strawberry'] },
        cupcakes: { name: 'Cupcakes', art: 'cupcakes', needs: ['flour', 'eggs', 'butter', 'strawberry'] },
        cookies: { name: 'Cookies', art: 'cookies', needs: ['flour', 'butter', 'sugar', 'chocolate'] },
        brownies: { name: 'Brownies', art: 'brownies', needs: ['flour', 'eggs', 'butter', 'chocolate'] }
      }
    }
  };
})();
