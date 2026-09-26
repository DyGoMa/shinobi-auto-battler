# Shinobi Auto-Battler

A fan-made, Naruto-universe **2D lane auto-battler** for the web.

* Build a team of 3 plus a Leader, read the **Nature Wheel**, and time your Ultimates.
* Fire an Ultimate into an enemy's wind-up to trigger a **Jutsu Clash**.
* Part I and Part II (Shippuden) are complete: 25 arcs in anime order (99 battles, from the Survival Test to the final battle at the Valley of the End), 69 summonable ninja and alternate forms, and an achievement-exclusive Naruto.
* A skippable **Academy tutorial**, an in-game **Wiki**, 21 **achievements**, **Hard mode**, a **Daily challenge** and an Akatsuki **Boss Rush**.
* A **start menu** (continue as a guest, or sign in with Google before any save exists) after a short **intro**, and a **build stamp** (commit and UTC build time) on the menu and in Settings.
* **Installable (0.11.1):** a web app manifest, icons and a minimal network-first service worker; Settings → App installs it on the home screen (standalone, no browser bars), checks for updates ("Update ready — tap to reload") and the back button moves between screens. **0.11.2** suggests it to phone players: a start-menu notice, a one-time popup after the tutorial, two spaced reminders, and one-tap install where the browser allows it (illustrated steps elsewhere).
* **Everyday shortcuts (0.11):** ⏭ Skip for battles already won (the real battle, instantly), 1× / 2× / 5× speed, ⚡ recommended power on every battle, Level to recommended and Smart spend on the Roster, ✨ Auto team, counter hints and three team presets, Roster sorting, red dots on the tabs, and a Story map with Story · Hard · Daily · Boss Rush tabs.

The polish pass is under way (HANDOFF.md, docs/ART_BIBLE.md): the art and effects are in — anime-style ninja figures and busts drawn in code (with generated portraits and sprites dropped in through `tools/ingest.mjs` as they are made), a drawn stage per arc, effects per nature and signature jutsu, cut-ins, clash readouts, boss intros, the summon ceremony and two era skins. The audio is in too: thirteen loops and the stingers played live from data, and a sound for every event, all synthesised in Web Audio with no files (docs/AUDIO_PLAN.md). The story is in too: dialogue before and after every battle, the bosses' last words, an opening and an ending per arc, the characters teaching each screen, and a story log in the Wiki (docs/STORY_PLAN.md). QA and the release are the last phase.

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
* **New players:** three short Academy lessons before the Survival Test (team building, the Nature Wheel, Jutsu Clash and Ultimates), skippable at any point with the same reward, plus a character who explains each screen on the first visit (Jiraiya on summoning, Tsunade on levelling, Shikamaru on the map…).
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
| `npm run validate` | Content schema check (fields, natures, references, duplicate ids), balance sanity, naming-source coverage, the Wiki (every page exists, guide links resolve, guides show config values through placeholders), and the app manifest, icons and service worker |
| `npm run check` | `node --check` on every JS file, and verifies every relative import resolves |
| `npm run test:core` | Saves and migration, gacha guarantees, objectives, the tutorial, achievements, Hard mode, the Daily challenge, the start flow (intro timing, menu gating of the cloud session, the build stamp), and the 0.11 shortcuts (recommended power, auto-level and the reserve, Skip, the 10-pull's pity count, the once-per-account tutorial reward, presets, speed and Roster view persistence, tab dots) |
| `npm run sim` | Seeded battles with a PASS/FAIL table: Survival Test, every arc boss of both parts in Story and on Hard, Boss Rush, the nature check and counter-gap scenario (Story and Hard), fight length; plus the Daily challenge's clear chance per twist |
| `npm run campaign` | Free-to-play players play the tutorial and the whole story (pull, level, pick by matchup, replay when stuck, claim achievements). `CAMPAIGN_HARD=1` also plays Part I on Hard before Part II |
| `npm run audit` | The roster audit: every ninja takes its role's slot in a fixed quartet against six bosses, natures neutralised, and the table shows each kit's win rate against its tier's median (docs/BALANCE_PASS.md) |
| `npm run autotune -- --write` | Re-tunes per-boss difficulty (`enemyScaling.nodeMult`) toward the sim targets; `--mode=hard` does the same for Hard mode |
| `npm test` | Runs all of the above except autotune |

Both sims cover every part by default; `SIM_PARTS=1 npm run sim` runs Part I only. The layout audit (`tools/ui-audit.mjs`) runs in the browser: see QA.md.

## Project layout
```
index.html, css/style.css, js/main.js
manifest.webmanifest, sw.js, icons/   the installable app (0.11.1); tools/make-icons.ps1 regenerates the icons
js/core/Pwa.js, js/ui/pwa.js         install model, update check, install-suggestion rules (pure) and the browser glue (service worker, prompt, toast)
js/ui/install.js                    0.11.2: the start-menu notice, the install popup, the reminder banner and the per-browser install steps
js/config/balance.js        every tunable number and curve (the only place to rebalance)
js/config/version.js        the game version (matches package.json)
js/content/                 roster, enemies (+ Boss Rush), arcs/part1.js, arcs/shippuden.js, tutorial,
                            achievements, banners, index.js (merge + validate)
js/core/                    formulas (curve evaluator), BattleSim (pure, seeded, no DOM), Ninja, GachaSystem,
                            Progression (story + Hard), Tutorial, Achievements, Daily, SaveManager, TeamPicker,
                            Power, AutoLevel, Skip, Teams, Badges (0.11 shortcuts)
js/save/                    LocalBackend, FirebaseBackend, firebase-config.js
js/render/                  Renderer (canvas), Effects
js/ui/                      UIManager + one file per screen (Home, StoryMap, TeamBuilder, Roster, Summon, BossRush,
                            Daily, Achievements, Tutorial, Wiki, Settings, Battle) + tips, chrome, DebugPanel, dom helpers
js/wiki/                    WikiData (page index), markdown (safe parser + config placeholders), text
js/content/story/           the dialogue (part1, shippuden-a, shippuden-b), the teaching scenes and Boss Rush barks (teach)
js/core/Story.js            the scene rules (once / always / never, the seen map, speakers, placeholders, the story log, validation)
js/ui/Dialogue.js           plays a scene: typewriter, portraits, tap / Skip / Auto, in a stage or full screen
js/audio/AudioManager.js    Web Audio synth
wiki/guides/                the Wiki's hand-written guides (markdown)
assets/                     fonts (Anton, Yuji Syuku subsets), portraits/ and sprites/ (WebP, made by tools/ingest.mjs), index.json (what exists), manifest.json (every picture wanted, with its prompt)
js/render/                  Figure.js (code-drawn ninja and busts), Stage.js (31 stages), Effects.js (nature and signature effects), Renderer.js, Assets.js (lazy images), icons.js (SVG sprite)
js/audio/                   Synth.js (voices), Scheduler.js, Music.js (13 loops as data, stingers, the state machine), Sfx.js (cues), AudioManager.js (buses, unlock, settings)
tools/                      manifest.mjs + prompts-data.mjs (the art manifest and checklist), ingest.mjs (incoming → assets), fonts.mjs (font subsets),
                            sim.mjs, campaign-sim.mjs, validate.mjs, wiki-check.mjs, autotune.mjs, test-core.mjs,
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
* **HANDOFF.md**: what the polish pass built (art, audio, story), how it is wired, and what is still open.

## Roadmap
* **Session 1:** the engine, every system, Part I, and deployment.
* **Session 2:** all Shippuden arcs (13 canon + 4 filler), 34 more characters and alternate forms, a measured Nature Wheel counter-gap study, bigger units on phone portrait.
* **Session 3:** balance and audit pass: clash-aware Auto-ult, late Part II Ryo capped, forced-ninja rules, grouped Summon banners, name and nature audit. **3b:** a dedicated counter-gap scenario, a flatter wheel and a bigger Overwhelmed refund reach both counter-gap bands (BALANCE.md §6).
* **Session 4:** the finished game minus art: the Academy tutorial and screen tips, the in-game Wiki, achievements and the exclusive Naruto, Settings, Hard mode, the Daily challenge, and a UX and copy pass (QA.md).
* **Session 5:** the start flow: splash and intro scene, a start menu that creates the cloud session only when the player picks guest or Google (Google by popup on every device, redirect only as a fallback), a build stamp fed by the GitHub Actions Pages deploy (`.github/workflows/pages.yml`, `version.json` written at build time, never committed), and a Pixel 8a layout pass.
* **0.11:** quality of life: a flush tab bar, the Story map's mode tabs and node states, ⏭ Skip, 5× speed, recommended power, auto-level, team presets and counter hints, Roster sorting, tab dots, and the tutorial reward once per account.
* **0.11.1:** the installable app: manifest, icons, a network-first service worker that never pins an old build, an update toast, an Install button in Settings, and the back button.
* **0.11.2:** the app suggested to phone players: a start-menu notice, a one-time popup after the tutorial, reminders after 3 and 7 days, one-tap install on Android Chrome/Edge and illustrated steps for every other browser (Safari's Share sheet, the Android menu, "open in Safari" with a Copy link button for in-app browsers).
* **0.12.0:** the polish pass: anime-style figures and busts drawn in code with a picture pipeline for generated art, a drawn stage per arc, effects per nature and signature jutsu, cut-ins, clash readouts and boss intros, the summon ceremony, two era skins; a synthesised soundtrack and sound effects; dialogue before and after every battle, the characters teaching each screen, and the Wiki's Story log.
* **Next:** the pictures (generate from `assets/manifest.json`, ingest with `tools/ingest.mjs`), the audio mix by ear, and the layout audit at the four sizes (HANDOFF.md, QA.md).

