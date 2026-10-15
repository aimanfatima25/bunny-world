# Bunny World — handoff for a new chat

Paste everything below the line into a new Claude Code chat (working folder: `C:\Users\QA\Desktop\flappy-bunny`).

---

I'm Aiman (beginner developer, Pakistan; I like short plain explanations and pictures). Let's continue my game **Bunny World**. Please read `README.md`, `HANDOFF.md` and the code before changing anything.

**Where it lives**
- Project: `C:\Users\QA\Desktop\flappy-bunny` (git, branch `main`, GitHub: https://github.com/aimanfatima25/bunny-world, public)
- Website (auto-deploys on every push): https://bunny-world.vercel.app — always send me this link after changes
- Also on my Coolify server: https://games.aimanfatima.com (Coolify project "bunny-world", Dockerfile + nginx; NOT auto-deploying yet — needs a manual Deploy in https://coolify.aimanfatima.com). My server is only reachable through a locally-managed Cloudflare Tunnel "aiman-home" (`/etc/cloudflared/config.yml`); new subdomains need a tunnel route that I add myself.
- Plain HTML/CSS/JS, no framework. Everything is designed at 360 x 640 and scaled; on phones it's full screen and the layer grows taller.

**Design rules (important to me)**
- The game must look **exactly like my design pictures** (soft pastel watercolor, cream/brown cottage style). My designs are in `assets/design/` (home screen, Choose Your Girl / Choose Your Friend cabinets, game card thumbnails). Each game must look like its card picture.
- I don't like "paper cut-out" looking art. Prefer my own pictures (on plain white backgrounds) or clean drawn art in my style. Ask me for pictures when needed.
- Currency is **stars** (not coins). Only one chosen girl + one chosen animal are shown at home.
- Don't use other artists' art (e.g. Pinterest) or trademarks (girl #20's "NY" cap must be redrawn before the Play Store).

**What's built**
- Home (`public/index.html`, `public/js/app.js`, `public/style.css`): top bar (avatar = future account page, stars, hearts, daily-gift calendar, mail, settings), cottage scene in the top 60% with my chosen girl standing (`public/img/standing/`) and chosen animal, game cards below that scroll, bottom menu: Home, Aquarium, Friends (coming soon — I plan friends/invite/exchange IDs to play together), Collection (coming soon), Shop.
- Shop = my "Choose Your Girl / Choose Your Friend" cabinet designs with category tabs (girls: casual/cozy/elegant/school/fantasy; animals: mammals/birds/reptiles/sea/others). Data in `public/js/friends.js` (22 girls, 31 animals, prices), saving in `public/js/store.js` (localStorage).
- Games (`public/js/games/`): Flappy Bunny (drawn flying bunny with wings), Catch the Fish (net), Merge the Fish (merge chain → axolotl gives the Fish Maker gift), Bubble Pop (bubble shooter), Memory. Sea creatures (and the shark + croc in Catch the Fish) are drawn in `public/js/sea.js`. Catch the Fish: 2 stars per 6 fish caught (no medal bonus); sharks/crocs cost 5 points and 3 seconds, and it speeds up over 45s. The top-left home button in every game opens a Pause card (Resume / Home); leaving the app pauses too (`BW.kit.paused`). Coming-soon cards: Match 3, Adventure, Decorate Room, Dress Up, Garden.
- Flappy Bunny controls: on opening it asks Tap / Hand wave / Eye motion / Tilt phone (`public/js/motion.js`). Hand and eyes use the front camera with Google MediaPipe (hand + face landmarker), kept in `public/vendor/mediapipe/` (library, wasm, models, ~21 MB, so blocked CDNs don't matter); the bunny flies to where the hand / gaze (+ a bit of head movement, calibrated at start) / phone tilt points, no gravity. Small mirrored camera preview top-right. Camera denied → falls back to taps. Android: CAMERA permission added to AndroidManifest.
- Cooking shops (`public/js/games/cook.js` + `shops.js` + drawn food in `food-art.js`): Sushi Shop, Ramen Shop, Cake & Sweets. Front screen = my whole shop design with START COOKING and the Recipes book. Kitchen view: my shop's wall with a framed menu board; girls and guys order from it (bubble + patience bar). My counter: cooking station (my rice cooker / stove crops; a drawn pink oven for cakes) with 2 cooking spots (cook 2.5s / bake 3.5s, tap when Ready, burns after 7s), ingredient boxes, and a plate / ramen bowl / mixing bowl. Rice and noodles come out drawn round (fluffy mound / noodle nest); toppings stack on top; when the plate holds a whole recipe it turns into that dish's menu picture. Sushi/Ramen: tap the plate to serve. Cake & Sweets: drawn ingredients (flour, eggs, sugar, milk, butter, chocolate, strawberry, cream) → mixing bowl → tap to bake that recipe's cake in the oven → tap the ready cake to serve it. Recipe bar always on the right (ordered recipes glow pink). 90s shift, 3 customers lost = closed, 2 stars per 3 orders, ≡ = pause. Boxes measured in the 941 x 1671 design in `shops.js`.
- ID card: tap your picture at the top left → pink ID card (like my reference): photo, chosen animal, ID number from the player id, barcode, editable name (= Top 10 name), date of birth and skill (`store.setProfile`).
- Guys: 22 full-body guys (`assets/design/friends/guys-full.webp`) cut with the girls by `assets/cut-people.mjs` (soft clean edges) into `public/img/standing/guy-N.webp`. Shop has Girls / Guys / Animals & Sea; Kai (guy-1) and Leo (guy-2) are free. You can be a girl or a guy (`store.data.girl` holds either). The "Choose Your Guy" sign = blank plaque from `assets/make-header-guy.mjs` + text in the page. Guys 10 (NIKE), 14 (Supreme), 21 (GAP) show brands: redraw before the Play Store.
- Aquarium page (`public/js/aquarium.js`) like its card; Fish Maker (`public/js/fishmaker.js`).
- Animals: my full-body animal sheet (`assets/design/friends/animals-full.webp`, 65 animals) is cut by `assets/cut-animals.mjs` into clean transparent pictures in `public/img/animals/` (soft edges, no white rim). These are used whole everywhere: home scene, Shop cubbies, Flappy Bunny (with wings), Bubble Pop. Names, prices and tabs are the `ANIMALS` list in `public/js/friends.js` (sheet order). Octopus, croc, lion, tiger and shark still use old card pictures.
- Image tools in `assets/` (`cut-design.mjs`, `cut-friends.mjs`, `cut-animals.mjs`, `cut-girls-full.mjs`, `cut-choose.mjs`, `cutout.mjs`, `make-images.mjs` for app icon/splash) — run with `node assets/<file>`.

**Not finished / ideas**
- Next: replace the app icon / thumbnail (I'll send the new picture).
- Lion, tiger, croc, octopus and shark still need full-body pictures (white background) like the animal sheet. The standing girls' edges could get the same soft cleanup as the animals.
- Leaderboard server (`server/`, Node + built-in SQLite) is written but NOT deployed (needs Coolify app with base dir `/server`, port 3000, volume `/data`, domain `http://api.aimanfatima.com`, DNS + tunnel route). Top 10 page exists (opened from the game-over card).
- Hearts have no purpose yet. Music to add later. Dress-up design (my "Pastel Kawaii Dress-Up Room.png" in Downloads) for later.

**Android app (update at the END, after all changes)**
- Capacitor 7 project in `android/` (app id `com.aimanfatima.bunnyworld`, portrait). Icon/splash from `assets/make-images.mjs` (animal friends + castle) — may need a new icon matching the new design.
- To rebuild: `npm run sync`, then build with **Java 21** (Android Studio's own Java 25 breaks Gradle 8.11):
  `$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"; cd android; .\gradlew.bat assembleDebug`
  then copy `android/app/build/outputs/apk/debug/app-debug.apk` to `BunnyWorld.apk` and send it to me. The old APK I installed is outdated.
- Play Store later needs a signed release build and maybe "live updates" (e.g. Capgo).

**Testing tip**: run `python -m http.server 8765 --directory public` and open http://localhost:8765 (the browser caches scripts; force refresh). Commit with clear messages and push; Vercel updates in about a minute.

Here's what I want to add next: …
