# Flappy Bunny 🐰🥕

A Flappy Bird–style game: a bunny with a pink bow hops through carrot pillars.
Plain HTML + CSS + JavaScript (canvas), no framework.

## Play it

Open `public/index.html` in a browser. That's it.

Controls: tap, click, Space, ↑ or W to hop.

## Project layout

```
flappy-bunny/
├── public/          ← the game (this folder is what gets served / packaged)
│   ├── index.html   ← page structure
│   ├── style.css    ← look of the page and the game-over card
│   └── game.js      ← game loop, physics, drawing
└── README.md
```

## Roadmap

1. ✅ Web game
2. ⬜ Global leaderboard backend (server + database)
3. ⬜ Android app (Capacitor wrapping `public/`, built into an APK)
