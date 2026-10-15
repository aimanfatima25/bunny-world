# Kawaii Corner 🐰🎀 (formerly Bunny World)

A cute world of mini-games. Pick a friend, earn coins, and play.
Plain HTML + CSS + JavaScript (canvas), no framework.

## Play it

Open `public/index.html` in a browser. That's it.

- Pick a friend (bunny, kitty, panda or chick), then tap a game icon. Esc goes back home
- The gift button gives 50 free coins once a day

| Game | How to play | Medals (bronze / silver / gold) |
|---|---|---|
| Flappy Bunny | Tap, Space, ↑ or W to hop through the carrots | 5 / 15 / 30 |
| Fishy Merge | Fish swim freely. Tap a fish, then tap its twin: tiny fish → clownfish → pufferfish → seahorse → turtle → jellyfish. New fish keep arriving; at 24 fish the tank is full and it's over. Each jellyfish = a gift: the Fish Maker, where you design and name your own fish for your Aquarium | 300 / 900 / 1800 |
| Memory Match | Flip two cards to find pairs. Clear the board for +10 seconds | 8 / 16 / 28 |
| Bubble Pop | Tap bubbles before they float away. Coin bubbles = 3. Grumpy purple ones cost a heart | 25 / 60 / 120 |

Coins after each game = score × the game's coin rate (in `app.js`) + 10 / 25 / 50 for a medal.

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
│       ├── fishmaker.js     ← Fish Maker gift: design, draw and save your own fish
│       ├── app.js           ← home screen: friends, gift, game menu, game-over card
│       └── games/
│           ├── kit.js       ← shared game loop, input and drawing helpers
│           ├── flappy.js    ← Flappy Bunny
│           ├── fish.js      ← Fishy Merge
│           ├── memory.js    ← Memory Match
│           └── bubble.js    ← Bubble Pop
└── README.md
```

### Adding a new game

1. Make `public/js/games/<name>.js` with `BW.games.<name> = { start(canvas, options) }`
   returning `{ restart, stop }`. `BW.kit.run()` does the loop and input for you (see `bubble.js`, the simplest one)
2. Add a `<script>` tag for it in `index.html`
3. Draw its icon as a `<symbol>` in `index.html` and add it to `GAMES` in `app.js`

## Roadmap

1. ✅ Flappy Bunny
2. ✅ Home screen: coins, daily gift, 4 friends, game menu
3. ✅ Fishy Merge, Carrot Catch, Memory Match, Bubble Pop
4. ⬜ Leaderboard backend (Node.js server + SQLite), top 10 per game
5. ⬜ Shop (9 more friends), wardrobe, stickers
6. ⬜ Power-ups, themes and seasons, more games
7. ⬜ Android app (Capacitor wrapping `public/`)

## Deploying

The same code goes live in two places, like the portfolio:

- **Vercel**: import the GitHub repo. `vercel.json` tells Vercel the site is the `public/` folder (no build step)
- **Coolify**: new resource from the GitHub repo, build pack **Dockerfile**, port **80**. The `Dockerfile` copies `public/` into a small nginx server (`nginx.conf`)

Every push to `main` redeploys both.

## Android app

The app is the same `public/` folder wrapped with [Capacitor](https://capacitorjs.com) (`capacitor.config.json`, app id `com.aimanfatima.bunnyworld`). The native project lives in `android/`.

- `npm install` once
- After changing the game: `npm run sync` (copies `public/` into the Android project)
- `npm run android` opens it in Android Studio → **Build → Build App Bundle(s) / APK(s) → Build APK(s)**
- Icon and splash: edit `assets/make-images.mjs`, then `node assets/make-images.mjs` and `npx capacitor-assets generate --android`

## Leaderboard server

`server/` is a tiny Node.js server (no packages: built-in `http` and `node:sqlite`) that keeps each player's best score per game.

- Run locally: `cd server && node server.js` (port 3000; the game on `localhost:8765` uses it automatically)
- `GET /api/scores/<game>?player=<id>` → top 10, `POST /api/scores` `{ game, name, score, player }`
- Live at `https://api.aimanfatima.com`: a second Coolify app from this repo with base directory `/server`, Dockerfile build, port 3000 and a persistent volume mounted at `/data`
