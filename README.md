# Shinobi Auto-Battler

A fan-made, Naruto-universe **2D lane auto-battler** for the web.

* Build a team of 3 plus a Leader, read the **Nature Wheel**, and time your Ultimates.
* Fire an Ultimate into an enemy's wind-up to trigger a **Jutsu Clash**.
* Part I and Part II (Shippuden) are complete: 25 arcs in anime order (99 battles, from the Survival Test to the final battle at the Valley of the End), 69 summonable ninja and alternate forms, and an achievement-exclusive Naruto.
* A skippable **Academy tutorial**, an in-game **Wiki**, 21 **achievements**, **Hard mode**, a **Daily challenge** and an Akatsuki **Boss Rush**.
* A **start menu** (continue as a guest, or sign in with Google before any save exists) after a short **intro**, and a **build stamp** (commit and UTC build time) on the menu and in Settings.

The game is complete except for art, music and visual effects: characters are coloured tokens with initials and emoji, and sound is a small synth. HANDOFF.md lists every placeholder for that pass.

**Play:** https://dygoma.github.io/shinobi-auto-battler/ (add `?debug=1` for the balance debug panel)
**Repo:** https://github.com/DyGoMa/shinobi-auto-battler

> Non-commercial fan project. Naruto © Masashi Kishimoto / Shueisha / Studio Pierrot. No official artwork is used. Names follow the English dub (see NAMING.md).

## Features
* **Combat:** a seeded, deterministic sim on a 1280×720 canvas (DPR-scaled, letterboxed).
  * Units walk, queue without stacking, and fight from their range: melee, reach, mid or long.
  * Chakra fills over time; you tap a glowing portrait to fire that unit's Ultimate, or let 🤖 Auto-ult do it (clash-aware by default).
* **Nature Wheel:** Fire › Wind › Lightning › Earth › Water › Fire, using each character's canon natures.
  * Multi-nature ninja use their best nature. Taijutsu specialists are never resisted.
  * The enemy nature preview and a live Team Builder matchup rating show matchups before you fight.
* **Jutsu Clash** (the original system; see DESIGN.md §3): meet an enemy's telegraphed jutsu with an Ultimate, and the Nature Wheel decides the result (Overpower / Standoff / Overwhelmed).
* **New players:** three short Academy lessons before the Survival Test (team building, the Nature Wheel, Jutsu Clash and Ultimates), skippable at any point with the same reward, plus a one-time tip on the first visit to each screen.
* **Wiki:** a page for every ninja, jutsu, enemy, arc, banner and achievement, generated from the game data, plus hand-written guides (`wiki/guides/`). Every screen has a **?** button that opens its page.
* **Endgame:** Hard mode for each cleared part (enemies 12 levels higher, tougher bosses, scrolls again on first clears), a Daily challenge picked from the date (a beaten boss with a twist, 3 attempts), the Boss Rush, and achievements that pay Ryo, summon tickets and Rare+ summons.
* **Data-defined content:**
  * 10 boss mechanic types, 4 objective types, forced/banned/fixed-leader team rules and loaner ninja.
  * Adding content never needs engine changes (CONTENT_GUIDE.md).
* **Everything tunable in one file:** `js/config/balance.js` (BALANCE.md), with a live `?debug=1` editor.
* **Gacha:** 60 / 28 / 10 / 2% rates, a Jonin+ guarantee in every 10-pull, a Kage guaranteed by pull 50, arc banners with rate-ups, summon tickets, scroll-unroll animations, and stars up to 5★.
* **Saves:** versioned saves with step-by-step migration. The local backend works everywhere; an optional Firebase backend adds anonymous auth, Google linking, sign-out, and a "cloud save is newer" prompt. Saves export and import as text codes.
* **Presentation:** Web Audio synth sound effects, reward screens, and layouts from a 360 px phone (portrait or landscape) to 4K, with 44 px tap targets throughout (QA.md).

## Run locally
```bash
npm run serve
```
Then open http://localhost:8080. Any static server works: there is no bundler, just plain ES modules. `package.json` only runs the Node tools, and there are no dependencies to install.

## Checks (Node ≥ 18)
| Command | What it does |
|---|---|
| `npm run validate` | Content schema check (fields, natures, references, duplicate ids), balance sanity, naming-source coverage, and the Wiki (every page exists, guide links resolve, guides show config values through placeholders) |
| `npm run check` | `node --check` on every JS file, and verifies every relative import resolves |
| `npm run test:core` | Saves and migration, gacha guarantees, objectives, the tutorial, achievements, Hard mode, the Daily challenge, the start flow (intro timing, menu gating of the cloud session, the build stamp) |
| `npm run sim` | Seeded battles with a PASS/FAIL table: Survival Test, every arc boss of both parts in Story and on Hard, Boss Rush, the nature check and counter-gap scenario (Story and Hard), fight length; plus the Daily challenge's clear chance per twist |
| `npm run campaign` | Free-to-play players play the tutorial and the whole story (pull, level, pick by matchup, replay when stuck, claim achievements). `CAMPAIGN_HARD=1` also plays Part I on Hard before Part II |
| `npm run autotune -- --write` | Re-tunes per-boss difficulty (`enemyScaling.nodeMult`) toward the sim targets; `--mode=hard` does the same for Hard mode |
| `npm test` | Runs all of the above except autotune |

Both sims cover every part by default; `SIM_PARTS=1 npm run sim` runs Part I only. The layout audit (`tools/ui-audit.mjs`) runs in the browser: see QA.md.

## Project layout
```
index.html, css/style.css, js/main.js
js/config/balance.js        every tunable number and curve (the only place to rebalance)
js/config/version.js        the game version (matches package.json)
js/content/                 roster, enemies (+ Boss Rush), arcs/part1.js, arcs/shippuden.js, tutorial,
                            achievements, banners, index.js (merge + validate)
js/core/                    formulas (curve evaluator), BattleSim (pure, seeded, no DOM), Ninja, GachaSystem,
                            Progression (story + Hard), Tutorial, Achievements, Daily, SaveManager, TeamPicker
js/save/                    LocalBackend, FirebaseBackend, firebase-config.js
js/render/                  Renderer (canvas), Effects
js/ui/                      UIManager + one file per screen (Home, StoryMap, TeamBuilder, Roster, Summon, BossRush,
                            Daily, Achievements, Tutorial, Wiki, Settings, Battle) + tips, chrome, DebugPanel, dom helpers
js/wiki/                    WikiData (page index), markdown (safe parser + config placeholders), text
js/audio/AudioManager.js    Web Audio synth
wiki/guides/                the Wiki's hand-written guides (markdown)
tools/                      sim.mjs, campaign-sim.mjs, validate.mjs, wiki-check.mjs, autotune.mjs, test-core.mjs,
                            check-syntax.mjs, naming.mjs (+ naming-sources.mjs), ui-audit.mjs (browser), serve.mjs
firestore.rules, firebase.json
```

## Docs
* **DESIGN.md**: game design, combat rules, and the Jutsu Clash system.
* **BALANCE.md**: a plain-English rebalancing guide with worked examples and where every number came from.
* **CONTENT_GUIDE.md**: templates and worked examples for every content type, including tutorial lessons, achievements and Wiki guides.
* **NAMING.md**: every name in the game, the Narutopedia source checked, and its verification status.
* **QA.md**: the layout and copy checklist, how to run the audit, and the latest results.
* **FIREBASE_SETUP.md**: step-by-step cloud-save setup (free Spark plan only).
* **HANDOFF.md**: notes for the art, audio and VFX pass (every placeholder asset, its size and where it's drawn).

## Roadmap
* **Session 1:** the engine, every system, Part I, and deployment.
* **Session 2:** all Shippuden arcs (13 canon + 4 filler), 34 more characters and alternate forms, a measured Nature Wheel counter-gap study, bigger units on phone portrait.
* **Session 3:** balance and audit pass: clash-aware Auto-ult, late Part II Ryo capped, forced-ninja rules, grouped Summon banners, name and nature audit. **3b:** a dedicated counter-gap scenario, a flatter wheel and a bigger Overwhelmed refund reach both counter-gap bands (BALANCE.md §6).
* **Session 4:** the finished game minus art: the Academy tutorial and screen tips, the in-game Wiki, achievements and the exclusive Naruto, Settings, Hard mode, the Daily challenge, and a UX and copy pass (QA.md).
* **Session 5:** the start flow: splash and intro scene, a start menu that creates the cloud session only when the player picks guest or Google (Google by popup on every device, redirect only as a fallback), a build stamp fed by the GitHub Actions Pages deploy (`.github/workflows/pages.yml`, `version.json` written at build time, never committed), and a Pixel 8a layout pass.
* **Next:** the art, audio and VFX pass (HANDOFF.md).
