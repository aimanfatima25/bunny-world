# Bunny World 🐰🎀

A cute world of mini-games. Pick a friend, earn coins, and play.
Plain HTML + CSS + JavaScript (canvas), no framework.

## Play it

Open `public/index.html` in a browser. That's it.

- Pick a friend (bunny, kitty, panda or chick), then tap a game icon
- Flappy Bunny: tap, click, Space, ↑ or W to hop. Esc goes back home
- Each game gives 1 coin per point, plus a bonus for carrot medals (bronze 5, silver 15, gold 30)
- The gift button gives 50 free coins once a day

Progress (coins, best scores, chosen friend) is saved in the browser.

## Project layout

```
flappy-bunny/
├── public/                  ← the whole game (served by the server / packaged for Android)
│   ├── index.html           ← screens, plus the icon drawings (<symbol>s)
│   ├── style.css            ← look of every screen
│   └── js/
│       ├── store.js         ← saving coins, best scores, chosen friend
│       ├── characters.js    ← how each friend is drawn
│       ├── app.js           ← home screen: friends, gift, game menu, game-over card
│       └── games/
│           └── flappy.js    ← Flappy Bunny
└── README.md
```

### Adding a new game

Make `public/js/games/<name>.js` with `BW.games.<name> = { start(canvas, options) }`
returning `{ restart, stop }` (see `flappy.js`), add a `<script>` tag for it in
`index.html`, and remove `soon: true` from its entry in `GAMES` in `app.js`.

## Roadmap

1. ✅ Flappy Bunny
2. ✅ Home screen: coins, daily gift, 4 friends, game menu
3. ⬜ Fishy Merge (merge fish up to a jellyfish)
4. ⬜ Leaderboard backend (Node.js server + SQLite), top 10 per game
5. ⬜ Shop (9 more friends), wardrobe, stickers
6. ⬜ Carrot Catch, Memory Match, Bubble Pop, power-ups, themes
7. ⬜ Android app (Capacitor wrapping `public/`)
