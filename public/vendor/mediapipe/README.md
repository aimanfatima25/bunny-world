# MediaPipe Tasks Vision (for Flappy Bunny's hand control)

- `vision_bundle.mjs` and `wasm/vision_wasm_internal.*` come from the npm package
  `@mediapipe/tasks-vision@0.10.14` (Apache License 2.0, Google).
- `models/hand_landmarker.task` is Google's MediaPipe hand model from
  storage.googleapis.com/mediapipe-models (Apache License 2.0).

They live here (not on a CDN) so the game works on networks that block those sites and
inside the Android app. Only the SIMD build of the wasm is kept (every recent browser has it).
Loaded by `public/js/motion.js` only when a player picks Hand wave.
