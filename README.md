# Shinobi Auto-Battler

A fan-made, Naruto-universe **2D lane auto-battler** for the web.

* Build a team of 3 plus a Leader, read the **Nature Wheel**, and time your Ultimates.
* Fire an Ultimate into an enemy's wind-up to trigger a **Jutsu Clash**.
* Part I is complete: 8 arcs in anime order, 35 pullable ninja, and an Akatsuki Boss Rush.

**Play:** https://dygoma.github.io/shinobi-auto-battler/ (add `?debug=1` for the balance debug panel)
**Repo:** https://github.com/DyGoMa/shinobi-auto-battler

> Non-commercial fan project. Naruto © Masashi Kishimoto / Shueisha / Studio Pierrot. No official artwork is used: characters are coloured tokens with initials and emoji. Names follow the English dub (see NAMING.md).

## Features
* **Combat:** a seeded, deterministic sim on a 1280×720 canvas (DPR-scaled, letterboxed).
  * Units walk, queue without stacking, and fight from their range: melee, reach, mid or long.
  * Chakra fills over time; you tap a glowing portrait to fire that unit's Ultimate.
* **Nature Wheel:** Fire › Wind › Lightning › Earth › Water › Fire, using each character's canon natures.
  * Multi-nature ninja use their best nature. Taijutsu specialists are never resisted.
  * The enemy nature preview and a live Team Builder matchup rating show matchups before you fight.
* **Jutsu Clash** (the original system; see DESIGN.md §3): meet an enemy's telegraphed jutsu with an Ultimate, and the Nature Wheel decides the result (Overpower / Standoff / Overwhelmed).
* **Data-defined content:**
  * 10 boss mechanic types, 4 objective types, forced/banned/fixed-leader team rules and loaner ninja.
  * Adding content never needs engine changes (CONTENT_GUIDE.md).
* **Everything tunable in one file:** `js/config/balance.js` (BALANCE.md), with a live `?debug=1` editor.
* **Gacha:** 60 / 28 / 10 / 2% rates, a Jonin+ guarantee in every 10-pull, a Kage guaranteed by pull 50, arc banners with rate-ups, scroll-unroll animations, and stars up to 5★.
* **Saves:** versioned saves with step-by-step migration. The local backend works everywhere; an optional Firebase backend adds anonymous auth, Google linking and a "cloud save is newer" prompt. You can export and import saves as base64 strings.
* **Presentation:** Web Audio synth sound effects, onboarding tips, reward screens, and portrait/landscape layouts from phone to 4K.

## Run locally
```bash
npm run serve
```
Then open http://localhost:8080. Any static server works: there is no bundler, just plain ES modules. `package.json` only runs the Node tools, and there are no dependencies to install.

## Checks (Node ≥ 18)
| Command | What it does |
|---|---|
| `npm run validate` | Content schema check (fields, natures, references, duplicate ids) plus balance sanity and naming-source coverage |
| `npm run check` | `node --check` on every JS file, and verifies every relative import resolves |
| `npm run test:core` | Save migration, corrupted saves, gacha guarantees, objectives and curves |
| `npm run sim` | 200 seeded battles per scenario, with a PASS/FAIL table (Bell Test, every arc boss, Boss Rush, nature check, fight length) |
| `npm run campaign` | Free-to-play players play all of Part I (pull, level, pick by matchup, replay when stuck) |
| `npm run autotune -- --write` | Re-tunes per-boss difficulty (`enemyScaling.nodeMult`) toward the sim targets |
| `npm test` | Runs all of the above except autotune |

## Project layout
```
index.html, css/style.css, js/main.js
js/config/balance.js        every tunable number and curve (the only place to rebalance)
js/content/                 roster, enemies (+ Boss Rush), arcs/part1.js, part2-placeholders.js, banners, index.js (merge + validate)
js/core/                    formulas (curve evaluator), BattleSim (pure, seeded, no DOM), Ninja, GachaSystem,
                            Progression, SaveManager, TeamPicker
js/save/                    LocalBackend, FirebaseBackend, firebase-config.js (placeholder)
js/render/                  Renderer (canvas), Effects
js/ui/                      UIManager + one file per screen (Home, StoryMap, TeamBuilder, Roster, Summon,
                            BossRush, Settings, Battle) + DebugPanel + dom helpers
js/audio/AudioManager.js    Web Audio synth
tools/                      sim.mjs, campaign-sim.mjs, validate.mjs, autotune.mjs, test-core.mjs,
                            check-syntax.mjs, naming.mjs (+ naming-sources.mjs), serve.mjs
firestore.rules
```

## Docs
* **DESIGN.md**: game design, combat rules, and the Jutsu Clash system.
* **BALANCE.md**: a plain-English rebalancing guide with worked examples.
* **CONTENT_GUIDE.md**: templates and worked examples for every content type (for Session 2's Shippuden content).
* **NAMING.md**: every name in the game, the Narutopedia source checked, and its verification status.
* **FIREBASE_SETUP.md**: step-by-step cloud-save setup (free Spark plan only).

## Roadmap
* **Session 1 (this):** the engine, every system, Part I, and deployment.
* **Session 2:** Shippuden arcs, ~30 more characters and alternate forms.
* **Session 3:** full-campaign balance and canon audit.
