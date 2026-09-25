# POLISH_AUDIT.md — Phase 0 audit for the art, audio and story pass

*Version audited: 0.11.2 (commit `ab1183d`, live build v469f949). Date: 2026-09-25. Nothing in the game was changed to produce this document; it is the inventory the polish pass will work from.*

## 0. What this is, and how it was made

The game is finished as a system (99 story nodes, 70 ninja, 156 enemies, tutorial, Wiki, achievements, Hard, Daily, Boss Rush, cloud saves, installable PWA) and every visual and sound in it is a stand-in: canvas shapes, emoji, CSS gradients and a tiny Web Audio synth. There is **no image file in the repo apart from the four app icons**, no audio file, no font file, and no dialogue system. This audit lists, screen by screen and system by system, what is placeholder and what is real, so Phases 1–5 can be scoped and questioned precisely.

Sources read: HANDOFF.md (the placeholder inventory), README.md, DESIGN.md, CONTENT_GUIDE.md, QA.md, NAMING.md (rules), `js/config/version.js` (there is no `version.json` in the repo: the Pages deploy writes it), the content data (`roster.js`, `enemies.js`, `arcs/part1.js`, `arcs/shippuden.js`, `tutorial.js`, `banners.js`, `achievements.js`), every screen module in `js/ui/`, the renderer, effects and audio modules, `css/style.css`, the wiki guides, and the game running in the desktop browser pane at 412×915 (Pixel 8a size, Android user agent). The roster, enemy, node and technique tables in §2–§5 were generated from the data files by a script, so they are exact. There is no `CLAUDE.md` in the repo; the standing rules live in HANDOFF.md and CONTENT_GUIDE.md.

**Standing rules the pass inherits** (HANDOFF.md "Ground rules", CONTENT_GUIDE.md §9): no official artwork, audio or logos; the game must keep working with any asset missing; everything ships as static files from GitHub Pages; respect `settings.muted / music / sfx / vfx` and `prefers-reduced-motion`; re-run the QA.md layout audit at 412×915, 360×780, 915×412 and 1280×800 after the swap; keep 44×44 tap targets; dub names on anything with text; any system change updates its Wiki guide and "What's new" in the same commit. This pass makes **no gameplay, economy or balance change**; where a visual needs a data change it will be proposed and wait.

### The numbers

| Thing | Count | Where |
|---|---|---|
| Story arcs | 25 (8 Part I, 17 Part II) + the Academy tutorial arc | `arcs/part1.js`, `arcs/shippuden.js`, `tutorial.js` |
| Story nodes | 99 (35 Part I, 64 Part II) + 3 tutorial lessons | same |
| Boss battles (nodes with a `boss: true` unit) | 37 | same |
| Pullable ninja | 60 base + 10 alternate forms = 70 entries (69 summonable, 1 achievement-only) | `roster.js` |
| Enemies | 156 entries (71 `basedOn` a roster character → 85 distinct looks; 37 bosses; 7 escort civilians; 7 Boss Rush versions) | `enemies.js` |
| Distinct named techniques needing an effect | 269 (ultimates, enemy jutsu, boss mechanics; §5) | derived |
| Summon banners | 26 (1 standard + 25 arc banners) | `banners.js` |
| Achievements | 21 in 4 categories | `achievements.js` |
| Battle backgrounds (stage slots) | 27 (25 arcs, the Academy, the Boss Rush) | arc `theme` objects |
| Music tracks | 0 | — |
| Sound effects | 15 synth calls | `AudioManager.js` |
| Image files | 4 (app icons) | `icons/` |
| Dialogue lines | 0 (blurbs and coach tips only, §4) | — |

## 1. Every screen and UI state: placeholder vs real

Legend: **P** = placeholder (emoji, kanji disc, coloured token, CSS-only decoration, code-drawn shape), **R** = real (finished layout, text, behaviour that will ship as is), **restyle** = stays code-drawn but must be reskinned to the art bible.

### 1.1 Boot, intro and start menu

| Screen / state | What the player sees | Placeholder pieces | Real pieces | Motion today |
|---|---|---|---|---|
| Boot "Loading…" (`index.html`) | CSS spinner + "Loading…" on the dark shell | spinner is a plain CSS ring (**restyle**) | copy, layout | spinner rotates |
| Boot error ("The game couldn't start") | card, ↻ Reload, details | none | all | none |
| Splash (`Intro.js`, 0.8 s first visit / 0.5 s after) | 84 px orange disc with 忍 + "Shinobi Auto-Battler" | **P** the disc is the logo; no wordmark, no key art | timings (`StartFlow.INTRO`) | fade in/out |
| Intro scene (first visit or Settings → Replay) | dusk band, ground line, five black CSS silhouettes (head circle + tunic trapezoid) run left→right over 1.1 s, then the title slams in (scale 2.8→1), screen shake 0.4 s, white flash; Skip button top-right | **P** everything visual: silhouettes are the battle token in CSS, title is system-font text, no logo, no music, no SFX at all | Skip, tap-to-skip, back button, reduced-motion fade, 3 s cap | run, bob, slam, shake, flash |
| Start menu (`StartScreen.js`) | disc 忍 + h1 + tagline; buttons per cloud state (▶ Play / ▶ Continue "Guest save" / "Signed in as…", Continue as guest, Sign in with Google, ↻ Try again, "Checking your account…" spinner, 🌐 Open in the browser); note line; 📚 Wiki · ⚙️ Settings; install notice; footer disclaimer + build stamp | **P** the disc, emoji on the links, radial-gradient background (no key art, no character art); system font | every state and copy, layout portrait and sideways | screen fade-in only |
| Start-menu states | off / connecting / error / signedOut / guest / google / redirect-error, each with its own copy | — | all copy is final | — |

### 1.2 App shell (every screen after the menu)

| Element | Today | Placeholder pieces |
|---|---|---|
| Top bar | 30 px 忍 disc + "Shinobi Auto-Battler" (title hidden ≤ 480 px), 📜 scrolls and 🪙 Ryo pills, 🏆 achievements button (red dot when claimable), 🔊/🔇 mute | **P** disc, all three emoji, system font; **restyle** pills and buttons |
| Bottom tab bar / side rail | 7 tabs: 🏯 Home · 🗺️ Story · 👥 Team · 📖 Roster · 📜 Summon · 📚 Wiki · ⚙️ Settings, red dots on Home/Summon, active underline | **P** all seven emoji icons (a nature/UI icon set is needed); **restyle** bar |
| Screen transition | `.screen.enter` fade + 6 px rise, 0.2 s | **restyle** (era-specific transition wanted) |
| Toasts | dark pill top-centre, 3.2 s; `good`/`bad` border; sticky "Update ready — tap to reload ↻" | **P** 🏆 emoji in achievement toasts; **restyle** |
| Modals | veil (blur) + card, `popIn` 0.22 s, Escape/back closes | **restyle** frame; no sound on open/close |
| Tip cards (`tips.js`, 10 screens) | emoji icon + title + text + Got it | **P** emoji icons (🗺️ 👥 📖 🥷 📜 ☁️ 📚 🏆 💀 📅 ⚙️) |
| Install notice / popup / banner / steps (`install.js`) | notice under the menu, one-time popup with perks list, reminder banner above the tab bar, step dialogs with **inline SVG icons** (Share, Add, ⋮, phone, Safari compass) | **P** 📲 emoji; the SVG icons are the only real vector icons in the game | 
| Fonts | system UI stack only (`--font`) | **P** no display font, no body font choice |
| Colour tokens | dark "night village" theme: `--bg #0d1117`, `--accent #ff8a3d`, tier colours, nature colours (`--n-*` and `Renderer.NATURE_COLORS` must stay in sync) | **restyle** per era |

### 1.3 Home (`HomeScreen.js`)

| State | What the player sees | Placeholder pieces |
|---|---|---|
| New player (tutorial not done) | hero card with a 200 px 忍 watermark at 3.5 % white, title, intro blurb, 🎓 tutorial / ▶ Continue CTA, stat tiles | **P** kanji watermark, emoji on tiles and buttons, gradient hero (no key art) |
| Mid-game | hero (blurb dropped), ▶ Continue → next story battle; six stat tiles (Story progress, Team power, Ninja recruited, Kage pity, Boss Rush best round or 🔒, Achievements with 🎁 N to claim); three challenge cards: ☁️ Boss Rush ("Best: round N" / "New! Seven Akatsuki back to back" / locked), 📅 Daily challenge (open / cleared / locked), 💀 Hard mode ("Next on Hard: …" / locked) | **P** the card icons are emoji; the tiles are plain text boxes |
| Red-dot reasons | rewards to claim, Daily waiting, Boss Rush open | R |

### 1.4 Story map (`StoryMapScreen.js`)

| State | What the player sees | Placeholder pieces |
|---|---|---|
| Mode tabs | 🗺️ Story · 💀 Hard · 📅 Daily · ☁️ Boss Rush (locked tabs say what opens them) | **P** emoji |
| Part switch, arc cards | Part I / Part II segment; arc cards tinted by the arc's `accent` (`--a1` gradient), episodes, progress bar, 🔒 on locked, "current" border; cleared arcs fold into one green line | **P** the tint is the only art; no arc key image, no era skin |
| Node map | dots (58 px, bosses 72 px, 50/60 px on phones) with the node number or 👑, joined by an SVG polyline; states: cleared ✓ (green), current (orange pulse), locked (grey + 🔒 + "Clear X first"), selected ring; ⚡ recommended power under each; the map scrolls to the current node | **P** dots and the line are the whole map (no terrain, no landmarks); 👑 emoji |
| Node panel | name, episodes, blurb, objective line, enemy rows (40 px red-ring token with initials + emoji, name, nature chips, mechanic lines), team rules (forced/banned/recommended), rewards, pre-fight power check (⚡ recommended vs team, ✓ Ready / low), ✨ Auto team, 👥 Team, ⚔️ Fight!, ⏭ Skip (cleared nodes), replay reward | **P** enemy tokens, every emoji; the blurb is the only story text (§4) |
| Hard mode | same map with a red "Hard" tab skin (`.mode-tabs .hard`), tip card 💀 | **P** |
| Empty/locked | locked Part II ("clear Part I"), locked Hard, "Clear <battle> first" | R |

### 1.5 Team builder (`TeamBuilderScreen.js`)

| Element | Today | Placeholder pieces |
|---|---|---|
| Slots | 4 dashed slots (3 members + ★ Leader in gold), avatar token + name, forced/banned marks | **P** avatar tokens (coloured circle, initials, emoji badge, tier ring) |
| Matchup box | 1–5 ★ rating "Bad … Great", counter pills ▲ Counters / ▼ Countered / • Neutral on every ninja | R (restyle) |
| Presets | Story · Boss · Daily preset chips with 💾 save | **P** emoji |
| Filters + list | role chips, nature chips, character cards (avatar, level, stars, power) | **P** tokens |
| Warnbox | "third melee body mostly waits in line" style warnings | R |
| Empty state | "No ninja in this role — how to get one", Show all roles | R |
| Lesson mode | coach box (`.coach`) with the team lesson text | R copy, **restyle** |

### 1.6 Roster and character dialog (`RosterScreen.js`, `dom.js avatar()`)

| Element | Today | Placeholder pieces |
|---|---|---|
| Auto-level card | ⬆ Level to recommended, 💰 Smart spend, reserve | **P** emoji |
| Sort / filter chips | rarity, power, level, nature; show / role / rarity / nature | R |
| Character cards | 56 px avatar token, name, tier word, ★ stars, Lv, power; "?" silhouette for unrecruited; locked at 50 % | **P** the token is the portrait |
| Character dialog | 84 px avatar (lg), tier ring, natures, role, stats, Ultimate name, Leader buff, +1 / +5 / Max level buttons with costs, star and catch-up copy, alternate forms | **P** avatar; R everything else |
| Empty states | "No ninja match these filters" / "You have every ninja", Show everyone | R |
| Level-up moment | `audio.levelUp()` only; no visual flourish | missing VFX |

### 1.7 Summon (`SummonScreen.js`)

| Element | Today | Placeholder pieces |
|---|---|---|
| Banner picker | two "current" banner tabs + a folded archive of past arc banners | R (restyle) |
| Banner hero | gradient card (`--b1` tint), name, blurb, featured avatars (locked ones dimmed with "joins after …"), rates table, Kage pity bar, ×1 / ×10 buttons, ticket buttons 🎟️ 🎫, "Skip animation" switch | **P** avatars, emoji, gradient (no banner art) |
| Pull ceremony (`playAnimation`) | dark radial overlay → a CSS paper scroll (96 px band "SUMMONING JUTSU" between two rods) unrolls over 0.8 s → full-screen flash in the best tier's colour (bigger for Kage, 1.4 s) → particle burst (24 Jonin / 60 Kage dots) → reveal cards (3:4, tier border, Kage glow loop, NEW! / ★ / +Ryo tag, portrait token, name, tier, Rate-up pill) flip in one by one → Continue | **P** scroll art, card frames, flash, particles, tokens; sounds are `scroll()` + `pullReveal(tier)` synth blips |
| Tap to skip / Skip animation | all cards at once | R |
| Not enough scrolls | hint listing every scroll source | R |

### 1.8 Boss Rush, Daily, Achievements, Tutorial

| Screen | What the player sees | Placeholder pieces |
|---|---|---|
| Boss Rush (`BossRushScreen.js`) | ☁️ title, rules copy, the seven Akatsuki as 40 px tokens in order, best round / "No runs yet", Start; locked state names the arc that opens it | **P** tokens, emoji; no Akatsuki cloud motif, no menace |
| Daily (`DailyScreen.js`) | 📅 today's boss token + name, twist card with its emoji (🎯 Locked nature, 🚫 No Ultimates, ⚔️ Boss gauntlet, ⬇️ Countered), attempts left, reward, Fight / Team; locked before Land of Waves; "come back at midnight" when spent | **P** token, emoji |
| Achievements (`AchievementsScreen.js`) | summary (N/21, progress bar), 🎁 Claim all, category headers 🗺️ 📖 ⚔️ 👤, cards (name, description with targets, progress, reward pills, Claim; `ready` gold border; claimed dimmed), the exclusive Nine-Tails Chakra Mode Naruto shown as an avatar | **P** every icon is emoji; the reward reveal is a toast |
| Tutorial hub (`TutorialScreen.js`) | 1-2-3 lesson steps, lesson card (title, "You'll learn" box, blurb, concept sections: role list with emoji role icons, a text "lane demo", the wheel as chips, a nature quiz), Start lesson / Skip tutorial | **P** emoji role icons, chip wheel; R the teaching copy (Wiki-voice, not in-fiction: §4) |

### 1.9 Wiki (`WikiScreen.js`)

| Page type | Today | Placeholder pieces |
|---|---|---|
| Home | search box, guide cards with emoji icons, list links | **P** emoji |
| Lists (characters, jutsu, enemies, arcs, banners, achievements) | rows with 40 px tokens | **P** tokens |
| Character / enemy page | 84 px avatar hero, kv table, techniques, where to get / where fought | **P** avatar |
| Nature Wheel page | interactive SVG wheel built in code (edges win/lose, pick a nature) | R (restyle to match the nature icon set) |
| Arc / node pages, banner pages, Boss Rush, achievement pages | text + tokens | **P** tokens |
| Guides (markdown) | 9 guides rendered with callouts and config placeholders | R |

### 1.10 Settings (`SettingsScreen.js`)

Cards: Battle (speed 1×/2×/5×, Auto-ult on, Auto-ult mode), Shortcuts (skip summon animation, Smart spend reserve), Help (tips again, 🎓 replay tutorial, 🎬 replay intro, 📚 Wiki), **Audio and visuals** (Sound on/off works; **Music, Sound effects and Visual effects are disabled switches** bound to `settings.music/sfx/vfx`, default on, already saved and migrated), Account and cloud save (every state), App (install model, ↻ Check for updates), Your save (export/import/reset with typed RESET), About (version, save format, disclaimer, build stamp). Placeholder pieces: emoji on buttons; the three disabled switches are the hooks the audio and VFX phases must wire (a volume slider does not exist yet; only on/off).

### 1.11 Battle (`BattleScreen.js`, `Renderer.js`, `Effects.js`)

The battle is a fixed full-screen overlay: HUD row, a 16:9 stage (1280×720 logical canvas, DPR-scaled up to 3, letterboxed), on phone portrait an info panel, and the Ultimate bar.

| Layer | Today | Placeholder pieces |
|---|---|---|
| HUD (`.bhud`) | objective text + sub (timer for survive, "Protect: X"), timer pill, 🤖/👆 Auto-ult, 1×/2×/5×, ⏸ | **P** emoji buttons; **restyle** |
| Background (`_buildBackground`) | one procedural scene per arc from a 5-colour `theme`: sky gradient, sun/moon disc at (1030,120), two sine-wave hill layers, 26 triangle trees, ground gradient from y 540, a lane stripe; drawn at 1320×760 so shake never shows an edge | **P** the same silhouette for all 27 slots; no landmark, no parallax, no weather, no time of day beyond the palette |
| Units (`_drawUnit`) | every unit is the same token: shadow ellipse, tunic trapezoid in a darker shade of `color`, a sash in the active nature colour, a 48 px head disc with white (yours) or dark (enemy) outline, a grey headband plate with no symbol, initials in system font; bosses ×1.3, adds ×0.85; on phone portrait units are drawn up to 2.4× and allies alternate two rows | **P** the whole unit |
| Unit motion | walk bob 5 px, idle bob 1.2 px, 12 px lunge on attack (0.16 s), white head flash on hit (0.12 s), death fade 0.6 s sinking 20 px, invulnerable blink | **restyle** into sprite/rig animation: idle, walk, attack, cast, hit, KO |
| Status overlays | enrage/ATK aura ellipse, 3 orbiting stun stars, taunt ring, reflect hexagon, absorb-shield bubble, dashed green escort ring | **P** all |
| Unit HUD (`_drawHud`) | HP bar 60×7 (boss 120×9) with a nature pip, chakra bar 3 px, boss name / "Protect: X" label | **restyle** |
| Wind-up (`_drawTelegraphBars`, `_drawZones`) | dark rounded banner ≥140×34 above the caster: "⚠ Jutsu name", nature-coloured border, progress line; pulsing ground ellipses 88×28 under targets | **restyle**: must stay readable on phones; no per-nature look |
| Effects (`Effects.js`, §5.1) | rings, sparks, floating numbers, projectile dots, a two-colour clash beam, an announcer banner (top centre, dark box, coloured underline) | **P** all: no per-nature impact styles, no signature jutsu, no KO/heal/status animations beyond text |
| Info panel (phone portrait, `.binfo`) | Nature Wheel chips and a foe list with tokens | **P** chips/tokens |
| Ultimate bar (`.ultbar`) | one button per ninja: 46 px avatar (34 px sideways), name, Ultimate name, HP and chakra bars, "ready" glow loop, ▲ OVERPOWER / = STANDOFF / ▼ WEAK clash badge, dead state | **P** avatars; **restyle** |
| Coach tips (`.onboard`) | cream card with a tip and OK; pauses the battle (`tipPause`) | R copy; **restyle** |
| Pause veil + menu | blur veil, Resume / Retreat (and Skip tutorial in a lesson) | **restyle** |
| Round-clear box (Boss Rush) | "Round N cleared", Next round ▶ (auto after the intermission), 🏳️ Take the rewards | **restyle** |
| Results (`Results.js`, shared with Skip) | VICTORY / DEFEAT hero, node name · time (· ⏭ skipped), reward pills (📜 +N 🪙 +N, ↻ Replay), damage table with bars, "Ultimates fired · Jutsu Clashes · Effective hits" line, Map · Change team · Retry · Next fight ▶; Daily and Boss Rush variants ("ROUND N CLEARED", "Best ever") | **P** emoji; the results screen has no art and no ceremony |
| Boss appearance | none: a boss simply spawns on the right with a bigger token and a red HP bar; no intro, no name card, no music change | missing |

### 1.12 Dialogs and prompts

Welcome box (🍥 emoji, "Welcome to the Hidden Leaf Village!", Skip / 🎓 Start the tutorial), "The tutorial comes first", Skip the tutorial? confirm, "Cloud save is newer — load it?" (kv comparison), Sign out?, Import this save?, Reset your save? (type RESET), "Sign in from the browser instead?", the install popup and the three step dialogs, the Roster auto-level plan dialogs, the character dialog, the Summon reveal overlay. All are real in behaviour and copy; all share the one modal frame (**restyle**) and none has a sound.

### 1.13 Debug panel (`?debug=1`)

Developer-only (balance editor, install-nudge tools). Out of scope for the polish pass; it must keep working.

## 2. The roster: every playable character (dub names), natures and jutsu

70 entries: 14 Genin, 15 Chunin, 21 Jonin, 20 Kage; 60 base characters and 10 alternate forms (`formOf`). Every entry needs its **own portrait** (a form is a different look: Curse Mark Sasuke, Sage Mode Naruto, Eight Gates Guy…) and its **own battle sprite**. The "Era" column is where the character first becomes available, which is the era its default outfit should follow; Part I characters who also fight in Part II nodes (Naruto, Sakura, Kakashi, Shikamaru, Team Guy, Team 8, Team 10, Gaara, Temari, Kankuro…) are drawn once in the game today, so the pass must decide whether a Part I character gets a Shippuden outfit as well (Phase 1 question).

Natures follow NAMING.md's rule (natures used on screen in the character's part, else the affinity Narutopedia lists; kekkei genkai as component natures; taijutsu specialists neutral). The first nature is the defensive one and the sash colour on the token today. The Ultimate is the character's signature dub jutsu and is what the VFX pass must make recognisable (§5).

#### Genin (Common) — 14

| # | Character (dub) | Role | Natures | Ultimate (type · nature) | Leader buff | Form of | How obtained | Era |
|---|---|---|---|---|---|---|---|---|
| 1 | **Sakura Haruno** (Sakura) | Support | Earth | Healing Jutsu (heal) | hp → undefined | — | in pools from the start | Part I |
| 2 | **Ino Yamanaka** (Ino) | Ranged | Earth | Ninja Art: Mind Transfer Jutsu (single · stun) | chakra → undefined | — | in pools from the start | Part I |
| 3 | **Choji Akimichi** (Choji) | Tank | Earth | Human Boulder (taunt) | hp → undefined | — | in pools from the start | Part I |
| 4 | **Kiba Inuzuka** (Kiba) | Striker | Earth | Man-Beast Ultimate Taijutsu: Fang Over Fang (single) | speed → undefined | — | in pools from the start | Part I |
| 5 | **Shino Aburame** (Shino) | Ranged | Earth | Parasitic Insects Jutsu (aoe) | def → undefined | — | in pools from the start | Part I |
| 6 | **Hinata Hyuga** (Hinata) | Tank | Fire | Protective Eight Trigrams Sixty-Four Palms (taunt) | crit → undefined | — | in pools from the start | Part I |
| 7 | **Tenten** (Tenten) | Ranged | None (neutral) | Rising Twin Dragons (aoe) | crit → Ranged | — | in pools from the start | Part I |
| 8 | **Iruka Umino** (Iruka) | Ranged | Fire | Demonic Illusion: Death Mirage Jutsu (single · stun) | startChakra → genin | — | in pools from the start | Part I |
| 9 | **Jirobo** (Jirobo) | Tank | Earth | Earth Style Barrier: Earth Dome Prison (taunt · Earth) | hp → undefined | — | joins after Sasuke Retrieval Squad | Part I |
| 10 | **Konohamaru Sarutobi** (Konohamaru) | Striker | Fire | Rasengan (single) | startChakra → undefined | — | joins after Pain's Assault | Shippuden |
| 11 | **Karin** (Karin) | Support | Earth | Heal Bite (heal) | chakra → undefined | — | joins after Itachi Pursuit Mission | Shippuden |
| 12 | **Jugo** (Jugo) | Tank | Wind | Sage Transformation (taunt) | hp → undefined | — | joins after Itachi Pursuit Mission | Shippuden |
| 13 | **Omoi** (Omoi) | Striker | Lightning | Cloud Style: Crescent Moon Slice (single · Lightning) | crit → undefined | — | joins after Five Kage Summit | Shippuden |
| 14 | **Chojuro** (Chojuro) | Striker | Water | Hiramekarei (aoe · Water) | def → undefined | — | joins after Five Kage Summit | Shippuden |

#### Chunin (Rare) — 15

| # | Character (dub) | Role | Natures | Ultimate (type · nature) | Leader buff | Form of | How obtained | Era |
|---|---|---|---|---|---|---|---|---|
| 1 | **Naruto Uzumaki** (Naruto) | Striker | Wind | Rasengan (single · Wind) | chakra (whole team) | — | in pools from the start | Part I |
| 2 | **Sasuke Uchiha** (Sasuke) | Striker | Fire / Lightning | Chidori (single · Lightning) | atk → Fire | — | in pools from the start | Part I |
| 3 | **Rock Lee** (Lee) | Striker | Taijutsu (neutral) | Primary Lotus (single) | speed → undefined | — | in pools from the start | Part I |
| 4 | **Neji Hyuga** (Neji) | Striker | Fire | Gentle Fist Art: Eight Trigrams Sixty-Four Palms (single · stun) | crit → undefined | — | in pools from the start | Part I |
| 5 | **Shikamaru Nara** (Shikamaru) | Ranged | Fire | Shadow Possession Jutsu (single · stun) | startChakra (whole team) | — | in pools from the start | Part I |
| 6 | **Temari** (Temari) | Ranged | Wind | Ninja Art: Wind Scythe Jutsu (aoe · Wind) | atk → Wind | — | joins after Destruction of the Hidden Leaf Village | Part I |
| 7 | **Kankuro** (Kankuro) | Tank | Wind | Puppet Master Jutsu (taunt) | def → undefined | — | joins after Destruction of the Hidden Leaf Village | Part I |
| 8 | **Haku** (Haku) | Ranged | Water / Wind | Secret Jutsu: Crystal Ice Mirrors (aoe · Water) | nature (whole team) | — | joins after Land of Waves | Part I |
| 9 | **Shizune** (Shizune) | Ranged | None (neutral) | Ninja Art: Poison Fog (aoe) | hp → undefined | — | joins after Search for Tsunade | Part I |
| 10 | **Tayuya** (Tayuya) | Ranged | None (neutral) | Demon Flute: Chains of Fantasia (aoe · stun) | chakra → undefined | — | joins after Sasuke Retrieval Squad | Part I |
| 11 | **Kidomaru** (Kidomaru) | Ranged | None (neutral) | Spider Bow: Fierce Rip (single) | crit → undefined | — | joins after Sasuke Retrieval Squad | Part I |
| 12 | **Sakon and Ukon** (Sakon) | Striker | None (neutral) | Multiple Fists Barrage (single) | atk → undefined | — | joins after Sasuke Retrieval Squad | Part I |
| 13 | **Sai** (Sai) | Ranged | Earth | Ninja Art: Super Beast Scroll (aoe) | crit → undefined | — | joins after Tenchi Bridge Reconnaissance Mission | Shippuden |
| 14 | **Suigetsu Hozuki** (Suigetsu) | Striker | Water | Water Style: Great Water Arm (single · Water) | atk → undefined | — | joins after Itachi Pursuit Mission | Shippuden |
| 15 | **Kurotsuchi** (Kurotsuchi) | Ranged | Fire / Earth | Lava Style: Quicklime Jutsu (single · Earth · stun) | def → undefined | — | joins after Five Kage Summit | Shippuden |

#### Jonin (Epic) — 21

| # | Character (dub) | Role | Natures | Ultimate (type · nature) | Leader buff | Form of | How obtained | Era |
|---|---|---|---|---|---|---|---|---|
| 1 | **Kakashi Hatake** (Kakashi) | Striker | Lightning / Earth / Water | Lightning Blade (single · Lightning) | atk → undefined | — | in pools from the start | Part I |
| 2 | **Might Guy** (Guy) | Striker | Taijutsu (neutral) | Dynamic Entry (single) | atk → undefined | — | in pools from the start | Part I |
| 3 | **Asuma Sarutobi** (Asuma) | Striker | Wind | Flying Swallow (aoe · Wind) | atk → undefined | — | in pools from the start | Part I |
| 4 | **Kurenai Yuhi** (Kurenai) | Ranged | None (neutral) | Tree Bind Death (single · stun) | atk → undefined | — | in pools from the start | Part I |
| 5 | **Zabuza Momochi** (Zabuza) | Striker | Water | Water Style: Water Dragon Jutsu (aoe · Water) | atk → Water | — | joins after Land of Waves | Part I |
| 6 | **Gaara** (Gaara) | Tank | Wind | Sand Shield (taunt) | def (whole team) | — | joins after Destruction of the Hidden Leaf Village | Part I |
| 7 | **Kabuto Yakushi** (Kabuto) | Striker | Earth | Chakra Scalpel (single) | hp → undefined | — | joins after Search for Tsunade | Part I |
| 8 | **Kimimaro** (Kimimaro) | Striker | None (neutral) | Bracken Dance (aoe) | atk → undefined | — | joins after Sasuke Retrieval Squad | Part I |
| 9 | **Naruto Uzumaki (Nine-Tails Chakra)** (Naruto★) | Striker | Wind | Rasengan (single · Wind) | startChakra → undefined | naruto | joins after Sasuke Retrieval Squad | Part I |
| 10 | **Sasuke Uchiha (Heavens' Curse Mark)** (Sasuke★) | Striker | Fire / Lightning | Chidori (single · Lightning) | atk → Lightning | sasuke | joins after Sasuke Retrieval Squad | Part I |
| 11 | **Yamato** (Yamato) | Tank | Earth / Water | Wood Style: Four Pillar Prison Jutsu (taunt · Earth) | def → undefined | — | joins after Tenchi Bridge Reconnaissance Mission | Shippuden |
| 12 | **Chiyo** (Chiyo) | Support | None (neutral) | Secret White Move: Chikamatsu's 10 Puppets (buff) | atk → undefined | — | joins after Kazekage Rescue Mission | Shippuden |
| 13 | **Deidara** (Deidara) | Ranged | Earth / Lightning | C4 Karura (aoe · Earth) | nature → undefined | — | joins after Kazekage Rescue Mission | Shippuden |
| 14 | **Sasori** (Sasori) | Ranged | None (neutral) | Secret Red Move: Performance of a Hundred Puppets (aoe) | crit → undefined | — | joins after Kazekage Rescue Mission | Shippuden |
| 15 | **Hidan** (Hidan) | Striker | None (neutral) | Curse Jutsu (single) | hp → undefined | — | joins after Akatsuki Suppression Mission | Shippuden |
| 16 | **Kakuzu** (Kakuzu) | Tank | Earth / Water / Fire / Wind / Lightning | Earth Style: Iron Skin (taunt · Earth) | def → undefined | — | joins after Akatsuki Suppression Mission | Shippuden |
| 17 | **Kisame Hoshigaki** (Kisame) | Striker | Water | Water Style: Super Shark Bomb Jutsu (aoe · Water) | chakra → Water | — | joins after Fourth Great Ninja War: Countdown | Shippuden |
| 18 | **Konan** (Konan) | Ranged | Wind | Sacred Paper Emissary Jutsu (aoe · Wind) | startChakra → undefined | — | joins after Pain's Assault | Shippuden |
| 19 | **Darui** (Darui) | Ranged | Lightning / Water | Gale Style: Laser Circus (aoe · Lightning) | atk → undefined | — | joins after Five Kage Summit | Shippuden |
| 20 | **Killer Bee** (Killer Bee) | Striker | Lightning | Tailed Beast Bomb (aoe) | speed → undefined | — | joins after Fated Battle Between Brothers | Shippuden |
| 21 | **Sakura Haruno (Hundred Healings)** (Sakura★) | Support | Earth | Mitotic Regeneration: The Hundred Healings (heal) | hp → undefined | sakura | joins after Fourth Great Ninja War: Climax | Shippuden |

#### Kage (Legendary) — 20

| # | Character (dub) | Role | Natures | Ultimate (type · nature) | Leader buff | Form of | How obtained | Era |
|---|---|---|---|---|---|---|---|---|
| 1 | **Hiruzen Sarutobi** (Hiruzen) | Ranged | Fire / Earth | Sealing Jutsu: Reaper Death Seal (single · stun) | chakra (whole team) | — | in pools from the start | Part I |
| 2 | **Jiraiya** (Jiraiya) | Support | Fire / Earth | Summoning Jutsu (buff) | startChakra (whole team) | — | joins after Chunin Exams | Part I |
| 3 | **Tsunade** (Tsunade) | Support | Lightning | Ninja Art: Mitotic Regeneration (heal) | hp (whole team) | — | joins after Search for Tsunade | Part I |
| 4 | **Orochimaru** (Orochimaru) | Ranged | Wind / Earth | Striking Shadow Snakes (single) | atk → undefined | — | joins after Search for Tsunade | Part I |
| 5 | **Itachi Uchiha** (Itachi) | Ranged | Fire / Water / Wind | Tsukuyomi (single · stun) | chakra → undefined | — | joins after Fated Battle Between Brothers | Shippuden |
| 6 | **Pain** (Pain) | Ranged | Water / Wind | Almighty Push (aoe · stun) | atk → undefined | — | joins after Pain's Assault | Shippuden |
| 7 | **Ay** (Ay) | Striker | Lightning | Liger Bomb (single · Lightning · stun) | atk → Lightning | — | joins after Five Kage Summit | Shippuden |
| 8 | **Onoki** (Onoki) | Ranged | Earth / Wind / Fire | Particle Style: Atomic Dismantling Jutsu (single · Earth) | def → undefined | — | joins after Five Kage Summit | Shippuden |
| 9 | **Mei Terumi** (Mei) | Ranged | Water / Fire / Earth | Lava Style: Lava Monster Jutsu (aoe · Fire) | nature → undefined | — | joins after Five Kage Summit | Shippuden |
| 10 | **Minato Namikaze** (Minato) | Striker | Fire | Flying Raijin Jutsu (single) | speed (whole team) | — | joins after Fourth Great Ninja War: Climax | Shippuden |
| 11 | **Hashirama Senju** (Hashirama) | Tank | Earth / Water | Wood Style: Wood Dragon Jutsu (taunt · Earth) | def → undefined | — | joins after Fourth Great Ninja War: Climax | Shippuden |
| 12 | **Madara Uchiha** (Madara) | Striker | Fire / Earth / Water | Fire Style: Majestic Destroyer Flame (aoe · Fire) | atk → Fire | — | joins after Birth of the Ten-Tails' Jinchuriki | Shippuden |
| 13 | **Obito Uchiha** (Obito) | Ranged | Fire / Earth / Water | Wood Style: Cutting Sprigs Jutsu (aoe · Earth) | crit (whole team) | — | joins after Birth of the Ten-Tails' Jinchuriki | Shippuden |
| 14 | **Gaara (Fifth Kazekage)** (Kazekage) | Tank | Wind / Earth | Ultimate Defence: Shukaku's Shield (taunt) | def → undefined | gaara | joins after Kazekage Rescue Mission | Shippuden |
| 15 | **Kakashi Hatake (Mangekyo Sharingan)** (Kakashi★) | Striker | Lightning / Earth / Water | Kamui (single · stun) | atk → undefined | kakashi | joins after Kazekage Rescue Mission | Shippuden |
| 16 | **Naruto Uzumaki (Sage Mode)** (Sage Naruto) | Striker | Wind | Wind Style: Rasen Shuriken (aoe · Wind) | chakra → undefined | naruto | joins after Pain's Assault | Shippuden |
| 17 | **Sasuke Uchiha (Eternal Mangekyo Sharingan)** (Sasuke★★) | Striker | Fire / Lightning | Inferno Style: Flame Control (aoe · Fire) | atk → undefined | sasuke | joins after Fourth Great Ninja War: Climax | Shippuden |
| 18 | **Might Guy (Eight Inner Gates)** (Guy★) | Striker | Taijutsu (neutral) | Night Guy (single) | atk → undefined | guy | joins after Birth of the Ten-Tails' Jinchuriki | Shippuden |
| 19 | **Naruto Uzumaki (Six Paths Sage Mode)** (Naruto★★) | Striker | Wind / Earth / Fire / Water | Sage Art: Super Tailed Beast Rasen-Shuriken (aoe · Wind) | atk (whole team) | naruto | joins after Birth of the Ten-Tails' Jinchuriki | Shippuden |
| 20 | **Naruto Uzumaki (Nine-Tails Chakra Mode)** (Chakra Mode) | Ranged | Wind | Planet Rasengan (aoe · Wind) | startChakra (whole team) | naruto | achievement reward (ach_story), never in a banner | Shippuden |

## 3. Enemies and bosses

156 enemy entries. 71 of them are `basedOn` a roster character, but many are a **different look** of that character (Reanimated, Clone, Ten-Tails Jinchuriki, Rinnegan, Tobi's mask vs Obito, Pain's six Paths, Kabuto in Sage Mode), so the reuse is partial: a fair estimate is **~45 enemy looks that can reuse a roster portrait/sprite with a recolour or a tag, and ~85 that need their own art** (37 of them bosses). Escort civilians (Tazuna, Tsunami, Idate, Rokusuke, Hotaru, a Leaf villager, Motoi) and adds (clones, puppets, beasts, summons) can share a small set of generic looks.

Bosses are the 37 units a node flags `boss: true`; each gets the boss multiplier, a crown on the map and the 120×9 HP bar. **None has an entrance today.** The Boss Rush uses seven dedicated Akatsuki entries (`e_br_*`) with one telegraphed special each.

### 3.1 The 37 bosses
| # | Boss (dub) | Based on | Role | Natures | Jutsu (telegraphed, clashable) | Mechanics | Battle |
|---|---|---|---|---|---|---|---|
| 1 | **Kakashi Hatake** | kakashi | Striker | Earth / Lightning / Water | Earth Style: Headhunter Jutsu (Earth, single) | telegraphAoE: Demonic Illusion: Death Mirage Jutsu @random<br>reviveOnce: Substitution Jutsu | The Final Bell (boss) |
| 2 | **Zabuza Momochi** | zabuza | Striker | Water | Water Prison Jutsu (Water, single) | telegraphAoE: Water Style: Water Dragon Jutsu [Water] @all<br>shieldPhase: Ninja Art: Hidden Mist Jutsu<br>enrage: Demon of the Hidden Mist | Showdown on the Bridge (boss) |
| 3 | **Neji Hyuga** | neji | Striker | Fire | Gentle Fist (no nature, single) | telegraphAoE: Gentle Fist Art: Eight Trigrams Sixty-Four Palms @front<br>reflect: Eight Trigrams: Palm Rotation | Finals: Naruto vs. Neji (boss) |
| 4 | **Orochimaru** | orochimaru | Ranged | Wind / Earth | Wind Style: Great Breakthrough (Wind, aoe) | telegraphAoE: Striking Shadow Snakes @front | The Third Hokage's Last Stand (boss) |
| 5 | **Gaara** | gaara | Ranged | Wind | Sand Coffin (no nature, single) | telegraphAoE: Wind Style: Air Bullet [Wind] @all<br>shieldPhase: Sand Shield<br>enrage: Play Possum Jutsu | Naruto vs. Gaara (boss) |
| 6 | **Orochimaru** | orochimaru | Ranged | Wind / Earth | Wind Style: Great Breakthrough (Wind, aoe) | telegraphAoE: Striking Shadow Snakes @front<br>summonAdds: Summoning Jutsu → e_manda | Deadlock! Sannin Showdown! (boss) |
| 7 | **Aoi Rokusho** | — | Striker | Water | Ninja Art: Senbon Rainstorm (no nature, aoe) | elementSwap: Blade of the Thunder Spirit [Water→Lightning]<br>telegraphAoE: Blade of the Thunder Spirit [Lightning] @front | Blade of the Thunder Spirit (boss) |
| 8 | **Kimimaro** | kimimaro | Striker | None (neutral) | Clematis Dance: Flower (no nature, single) | telegraphAoE: Bracken Dance @all<br>reflect: Larch Dance<br>enrage: Heavens' Curse Mark | Bracken Dance (boss) |
| 9 | **Sasuke Uchiha (Heavens' Curse Mark)** | sasuke | Striker | Fire / Lightning | Fire Style: Phoenix Flower Jutsu (Fire, aoe) | telegraphAoE: Chidori [Lightning] @front<br>reviveOnce: Heavens' Curse Mark | Final Valley (boss) |
| 10 | **Raiga Kurosuki** | — | Striker | Lightning / Water | Ninja Art: Lightning Ball (Lightning, single) | telegraphAoE: Thunder Funeral: Feast of Lightning [Lightning] @all<br>enrage: Ninja Art: Thunder Armour<br>summonAdds: Kurosuki Family ambush → e_kurosuki | Thunder Funeral: Feast of Lightning (boss) |
| 11 | **Sasori** | sasori | Ranged | None (neutral) | Iron Sand: Scattered Showers (no nature, aoe) | shieldPhase: Hiruko<br>telegraphAoE: Iron Sand Gathering @front<br>summonAdds: Secret Red Move: Performance of a Hundred Puppets → e_puppet | Puppet Fight: 10 vs. 100! (boss) |
| 12 | **Deidara** | deidara | Ranged | Earth / Lightning | C1 (Earth, single) | telegraphAoE: C1 [Earth] @random<br>summonAdds: C1 → e_clay_bird<br>reviveOnce: Clay Clone | Kakashi Enlightened! (boss) |
| 13 | **Sasuke Uchiha** | sasuke | Striker | Fire / Lightning | Chidori (Lightning, single) | telegraphAoE: Chidori Stream [Lightning] @all<br>enrage: Heavens' Curse Mark | The Power of Uchiha (boss) |
| 14 | **Kazuma** | — | Ranged | Wind / Earth | Flying Swallow (Wind, single) | telegraphAoE: Earth Style: Hidden in Stones Jutsu [Earth] @back<br>summonAdds: Earth Style Ultimate Revival Jutsu: Soil Bodies → e_revived_soul | My Friend (boss) |
| 15 | **Hidan** | hidan | Striker | None (neutral) | Triple-Bladed Scythe (no nature, single) | telegraphAoE: Curse Jutsu @random<br>reviveOnce: Immortality | Shikamaru's Genius (boss) |
| 16 | **Kakuzu** | kakuzu | Striker | Earth / Water / Fire / Wind / Lightning | Wind Style: Pressure Damage (Wind, aoe) | telegraphAoE: Fire Style: Searing Migraine [Fire] @all<br>elementSwap: Earth Grudge [Earth→Water→Fire→Wind→Lightning]<br>reviveOnce: Earth Grudge | Wind Style: Rasen Shuriken! (boss) |
| 17 | **Guren** | — | Ranged | Earth | Crystal Style: Jade Crystal Mirror (Earth, single) | telegraphAoE: Crystal Style: Burst Crystal Falling Dragon [Earth] @all<br>reflect: Crystal Style: Jade Crystal Mirror | Breaking the Crystal Style (boss) |
| 18 | **Three-Tails** | — | Tank | Water | — | telegraphAoE: Tailed Beast Bomb @all<br>enrage: The Rampaging Tailed Beast | Shattered Promise (boss) |
| 19 | **Deidara** | deidara | Ranged | Earth / Lightning | C1 (Earth, single) | telegraphAoE: C4 Karura [Earth] @all<br>reviveOnce: Clay Clone<br>enrage: C0 | Art (boss) |
| 20 | **Pain** | pain | Ranged | Water / Wind | Universal Pull (no nature, single) | telegraphAoE: Asura Attack @front<br>summonAdds: Summoning Jutsu → e_summoned_beast<br>reviveOnce: Six Paths of Pain | In Attendance, the Six Paths of Pain (boss) |
| 21 | **Itachi Uchiha** | itachi | Ranged | Fire / Water / Wind | Fire Style: Fireball Jutsu (Fire, aoe) | telegraphAoE: Amaterasu [Fire] @back<br>summonAdds: Crow Clone Jutsu → e_crow_clone<br>shieldPhase: Susanoo | Amaterasu! (boss) |
| 22 | **Eight-Tails** | killer_bee | Tank | None (neutral) | Ink Creation (no nature, aoe) | telegraphAoE: Tailed Beast Bomb @all<br>enrage: Lariat | The Eight-Tails vs. Sasuke (boss) |
| 23 | **Shiranami** | — | Ranged | None (neutral) | Word Bind Jutsu (no nature, single) | telegraphAoE: Tsuchigumo Style: Forbidden Jutsu Release: Big Bang @all<br>shieldPhase: Chameleon Jutsu<br>summonAdds: Fury Jutsu → e_bandit_ninja | Master and Student (boss) |
| 24 | **Pain (Tendo)** | pain | Ranged | Water / Wind | Universal Pull (no nature, single) | telegraphAoE: Planetary Devastation @all<br>reflect: Almighty Push | Planetary Devastation (boss) |
| 25 | **Danzo Shimura** | — | Striker | Wind / Earth / Water | — | telegraphAoE: Wind Style: Vacuum Bullets [Wind] @all<br>reviveOnce: Izanagi | Danzo Shimura (boss) |
| 26 | **Sasuke Uchiha** | sasuke | Striker | Fire / Lightning | Chidori Sharp Spear (Lightning, single) | telegraphAoE: Amaterasu [Fire] @back<br>shieldPhase: Susanoo<br>enrage: Inferno Style: Flame Control | The Burden (boss) |
| 27 | **Nine-Tails** | — | Striker | Fire / Wind | — | telegraphAoE: Tailed Beast Bomb @all<br>enrage: Tailed Beast Chakra Arms | Target: Nine Tails (boss) |
| 28 | **Tobi** | obito | Striker | Fire | Kamui (no nature, single) | telegraphAoE: Fire Style: Fireball Jutsu [Fire] @all<br>shieldPhase: Kamui<br>reviveOnce: Izanagi | The Angelic Herald of Death (boss) |
| 29 | **Nagato (Reanimated)** | pain | Ranged | Water / Wind | Universal Pull (no nature, single) | telegraphAoE: Planetary Devastation @all<br>regen: King of Hell<br>reflect: Almighty Push | The Acknowledged One (boss) |
| 30 | **Mu (Reanimated)** | — | Ranged | Earth / Wind / Fire | — | telegraphAoE: Particle Style: Atomic Dismantling Jutsu [Earth] @front<br>shieldPhase: Transparency Jutsu<br>summonAdds: Fragmentation → e_mu_fragment | Gaara and Onoki vs. Mu (boss) |
| 31 | **Kabuto Yakushi (Sage Mode)** | kabuto | Ranged | Earth / Water | Sage Art: White Extreme Attack (no nature, aoe) | telegraphAoE: Sage Art: Inorganic Animation [Earth] @all<br>summonAdds: Demon Twin Jutsu → e_ukon<br>regen: Healing Jutsu | The Izanami Activated (boss) |
| 32 | **Obito Uchiha** | obito | Striker | Fire / Earth / Water | Fire Style: Fireball Jutsu (Fire, aoe) | telegraphAoE: Wood Style: Cutting Sprigs Jutsu [Earth] @all<br>shieldPhase: Kamui | Kakashi vs. Obito (boss) |
| 33 | **Kinoe** | yamato | Tank | Earth / Water | Wood Style: Four Pillar Prison Jutsu (Earth, single) | telegraphAoE: Wood Style: Four Pillar House Jutsu [Earth] @front<br>shieldPhase: Wood Style: Domed Wall Jutsu<br>summonAdds: Wood Style: Wood Clone Jutsu → e_wood_clone | The Targeted Sharingan (boss) |
| 34 | **Obito Uchiha (Ten-Tails Jinchuriki)** | obito | Striker | Fire / Earth / Water | Truth-Seeking Ball (no nature, single) | telegraphAoE: Tailed Beast Bomb @all<br>shieldPhase: Truth-Seeking Ball<br>regen: Six Paths Sage Jutsu | Obito Uchiha (boss) |
| 35 | **Madara Uchiha** | madara | Striker | Fire / Earth / Water | Truth-Seeking Ball (no nature, single) | telegraphAoE: Limbo: Hengoku @all<br>shieldPhase: Truth-Seeking Ball<br>enrage: Six Paths Sage Jutsu | The Eight Inner Gates Formation (boss) |
| 36 | **Kaguya Otsutsuki** | — | Ranged | Fire | Eighty Gods Vacuum Attack (no nature, single) | elementSwap: Amenominaka [Fire→Water→Earth]<br>telegraphAoE: Expansive Truth-Seeking Ball @all<br>reflect: Yomotsu Hirasaka | The Sharingan Revived (boss) |
| 37 | **Sasuke Uchiha (Rinnegan)** | sasuke | Striker | Fire / Lightning | Amaterasu (Fire, single) | telegraphAoE: Indra's Arrow [Lightning] @all<br>shieldPhase: Susanoo<br>enrage: Inferno Style: Flame Control | Naruto and Sasuke (boss) |

**Boss Rush roster** (Akatsuki Boss Rush, opens after Sasuke Retrieval Squad): Kisame Hoshigaki — telegraphAoE: Water Style: Water Shark Bomb Jutsu [Water] @all; lifesteal: Shark Skin; Deidara — telegraphAoE: C3 [Earth] @all; elementSwap: Explosion Style [Earth→Lightning]; Sasori — telegraphAoE: Iron Sand: World Order @all; summonAdds: Secret Red Move: Performance of a Hundred Puppets → e_puppet; Hidan — telegraphAoE: Curse Jutsu @random; reviveOnce: Immortality; Kakuzu — telegraphAoE: Fire Style: Searing Migraine [Fire] @all; elementSwap: Earth Grudge [Earth→Water→Fire→Wind→Lightning]; reviveOnce: Earth Grudge; Itachi Uchiha — telegraphAoE: Amaterasu [Fire] @back; summonAdds: Shadow Clone Jutsu → e_itachi_clone; Pain — telegraphAoE: Almighty Push @all; reviveOnce: Six Paths of Pain.

### 3.2 Every other enemy, add, clone and escort target
| Enemy (dub) | Based on | Role | Natures | Targeting | Jutsu | Mechanics | Where |
|---|---|---|---|---|---|---|---|
| Mizuki | — | Striker | Earth | nearest | Demon Wind Shuriken: Windmill of Shadows (—) | — | Enter: Naruto Uzumaki!, Transformation Jutsu |
| Mizuki | — | Striker | Earth | nearest | — | telegraphAoE: Earth Style: Underground Move Jutsu [Earth] @random | Multi Shadow Clone Jutsu |
| Kakashi Hatake | kakashi | Striker | Earth / Lightning / Water | nearest | Earth Style: Headhunter Jutsu (Earth) | — | Pass or Fail: Survival Test |
| Kakashi Hatake | kakashi | Striker | Earth / Lightning / Water | nearest | Leaf Village Secret Finger Jutsu: One Thousand Years of Death (—) | reviveOnce: Substitution Jutsu | One Thousand Years of Death |
| Gozu | — | Striker | Water | nearest | — | — | The Demon Brothers |
| Meizu | — | Striker | Water | protected | — | — | The Demon Brothers |
| Zabuza Momochi | zabuza | Striker | Water | nearest | Water Prison Jutsu (Water) | summonAdds: Water Clone Jutsu → e_water_clone | Water Prison Jutsu |
| Water Clone | — | Striker | Water | nearest | — | — | summoned by Zabuza Momochi |
| Zori | — | Striker | None (neutral) | protected | Iaido (—) | — | Zori and Waraji |
| Waraji | — | Striker | None (neutral) | nearest | Iaido (—) | — | Zori and Waraji |
| Haku | haku | Ranged | Water / Wind | nearest | Secret Jutsu: Crystal Ice Mirrors (Water) | elementSwap: Ice Style [Water→Wind] | Secret Jutsu: Crystal Ice Mirrors |
| Gato's Thug | — | Striker | None (neutral) | nearest | — | — | Showdown on the Bridge |
| Orochimaru | orochimaru | Striker | Wind / Earth | nearest | Wind Style: Great Breakthrough (Wind) | telegraphAoE: Striking Shadow Snakes @front | Forest of Death: The Grass Ninja |
| Dosu Kinuta | — | Striker | None (neutral) | nearest | Resonating Echo Drill (—) | — | Forest of Death: Sound Ninja Ambush |
| Zaku Abumi | — | Ranged | None (neutral) | nearest | Supersonic Slicing Wave (—) | — | Forest of Death: Sound Ninja Ambush |
| Kin Tsuchi | — | Ranged | None (neutral) | backline | Shadow Senbon (—) | — | Forest of Death: Sound Ninja Ambush |
| Oboro | — | Ranged | Earth / Water | nearest | — | summonAdds: Misty Follower Jutsu → e_misty_follower | Forest of Death: Team Oboro, Ambush at Sea |
| Misty Follower | — | Striker | Earth | nearest | — | — | summoned by Oboro |
| Mubi | — | Striker | Earth / Water | protected | Earth Style: Underground Move Jutsu (Earth) | — | Forest of Death: Team Oboro, Ambush at Sea |
| Kagari | — | Striker | Water / Earth | nearest | — | — | Forest of Death: Team Oboro |
| Yoroi Akado | — | Striker | Water | nearest | — | lifesteal: Chakra absorption | Preliminaries: Yoroi and Misumi |
| Misumi Tsurugi | — | Tank | Water | nearest | Soft Physique Modification (—) | — | Preliminaries: Yoroi and Misumi |
| Sand Ninja | — | Striker | Wind | nearest | — | — | Zero Hour |
| Sound Ninja | — | Ranged | None (neutral) | nearest | — | — | Zero Hour |
| Kankuro | kankuro | Tank | Wind | nearest | Puppet Master Jutsu (—) | — | Shino vs. Kankuro |
| Temari | temari | Ranged | Wind | nearest | Ninja Art: Wind Scythe Jutsu (Wind) | — | Shino vs. Kankuro |
| Hashirama Senju (Reanimated) | — | Tank | Earth / Water | nearest | Wood Style: Deep Forest Emergence (Earth) | — | The Third Hokage's Last Stand |
| Tobirama Senju (Reanimated) | — | Striker | Water | nearest | — | shieldPhase: Water Style: Water Wall | The Third Hokage's Last Stand |
| Kisame Hoshigaki | — | Striker | Water | nearest | Water Style: Water Shark Bomb Jutsu (Water) | lifesteal: Shark Skin | Itachi and Kisame |
| Itachi Uchiha | — | Ranged | Fire / Water / Wind | nearest | — | telegraphAoE: Tsukuyomi @random | Itachi and Kisame |
| Tsunade | tsunade | Striker | Lightning | nearest | Heaven Kick of Pain (—) | — | Tsunade's Bet |
| Kabuto Yakushi | kabuto | Striker | Earth | nearest | Chakra Scalpel (—) | regen: Healing Jutsu | Kabuto in Tanzaku Town, Deadlock! Sannin Showdown!, The Tenchi Bridge |
| Manda | — | Tank | None (neutral) | nearest | Coiling Around (—) | — | summoned by Orochimaru |
| Kagari | — | Ranged | Water / Earth | nearest | Water Style: Black Rain Jutsu (Water) | — | Ambush at Sea, Ninja Art: Senbon Rainstorm |
| Aoi Rokusho | — | Ranged | Water | nearest | Ninja Art: Senbon Rainstorm (—) | — | Ninja Art: Senbon Rainstorm |
| Jirobo | jirobo | Tank | Earth | nearest | Earth Style Barrier: Earth Dome Prison (Earth) | lifesteal: Chakra absorption | Earth Style Barrier: Earth Dome Prison |
| Kidomaru | kidomaru | Ranged | None (neutral) | backline | Spider Bow: Fierce Rip (—) | — | Spider Bow: Fierce Rip |
| Sakon and Ukon | sakon | Striker | None (neutral) | nearest | Multiple Fists Barrage (—) | summonAdds: Demon Twin Jutsu → e_ukon; shieldPhase: Summoning Jutsu: Rashomon | Reinforcements from the Sand |
| Ukon | — | Striker | None (neutral) | nearest | — | — | summoned by Sakon and Ukon, Kabuto Yakushi (Sage Mode) |
| Tayuya | tayuya | Ranged | None (neutral) | nearest | Demon Flute: Chains of Fantasia (—) | summonAdds: Demon Flute: Trio Requiem → e_doki | Reinforcements from the Sand |
| Doki | — | Tank | None (neutral) | nearest | — | — | summoned by Tayuya |
| Kurosuki Family Member | — | Striker | None (neutral) | nearest | Ninja Art: Black Tornado (—) | — | Funeral March for the Living |
| Kurosuki Family Member | — | Striker | None (neutral) | protected | — | — | Funeral March for the Living |
| Raiga Kurosuki | — | Striker | Lightning / Water | nearest | Ninja Art: Lightning Fangs (Lightning) | shieldPhase: Ninja Art: Hidden Mist Jutsu | Raiga and Ranmaru |
| Ranmaru | — | Support | None (neutral) | nearest | — | rally: Ranmaru's eyes guide Raiga | Raiga and Ranmaru |
| Kakashi Hatake | kakashi | Striker | Lightning / Earth / Water | nearest | Lightning Blade (Lightning) | reviveOnce: Substitution Jutsu | The Results of Training |
| Deidara | deidara | Ranged | Earth / Lightning | nearest | C1 (Earth) | telegraphAoE: C3 [Earth] @all | The Kazekage Stands Tall |
| Might Guy (Clone) | guy | Striker | Taijutsu (neutral) | nearest | Dynamic Entry (—) | — | Traps Activate! Team Guy's Enemy |
| Rock Lee (Clone) | lee | Striker | Taijutsu (neutral) | nearest | Primary Lotus (—) | — | Traps Activate! Team Guy's Enemy |
| Neji Hyuga (Clone) | neji | Striker | Fire | nearest | Gentle Fist (—) | — | Traps Activate! Team Guy's Enemy |
| Tenten (Clone) | tenten | Ranged | None (neutral) | nearest | Rising Twin Dragons (—) | — | Traps Activate! Team Guy's Enemy |
| Clay Bird | — | Striker | Earth | nearest | — | — | summoned by Deidara |
| Yamato | yamato | Tank | Earth / Water | nearest | Wood Style: Four Pillar Prison Jutsu (Earth) | summonAdds: Wood Style: Wood Clone Jutsu → e_wood_clone | Simulation |
| Wood Clone | — | Striker | Earth / Water | nearest | — | — | summoned by Yamato, Kinoe |
| Orochimaru | orochimaru | Ranged | Wind / Earth | nearest | Sword of Kusanagi (—) | telegraphAoE: Striking Shadow Snakes @front; reviveOnce: Orochimaru Style: Substitution Jutsu | The Tenchi Bridge, Orochimaru vs. Jinchuriki |
| Fuka | — | Striker | Fire | nearest | Fire Style: Phoenix Flower Jutsu (Fire) | lifesteal: Reaper Kiss | Revived Souls |
| Fudo | — | Tank | Earth | nearest | Earth Style: Earthquake Slam (Earth) | shieldPhase: Rock Armour | Revived Souls |
| Sora | — | Striker | Wind | nearest | Beast Wave Gale Palm (Wind) | enrage: Tailed Beast Chakra Arms | Despair |
| Revived Soul | — | Striker | Earth | nearest | — | — | summoned by Kazuma |
| Hidan | hidan | Striker | None (neutral) | nearest | Triple-Bladed Scythe (—) | telegraphAoE: Curse Jutsu @random; reviveOnce: Immortality | Climbing Silver |
| Kakuzu | kakuzu | Tank | Earth / Water / Fire / Wind / Lightning | nearest | Lightning Style: False Darkness (Lightning) | summonAdds: Earth Grudge → e_masked_beast; shieldPhase: Earth Style: Iron Skin | Kakuzu's Abilities |
| Masked Beast | — | Ranged | Fire | nearest | Fire Style: Searing Migraine (Fire) | — | summoned by Kakuzu |
| Kigiri | — | Ranged | Fire | nearest | Exploding Flame Shot (Fire) | summonAdds: Multi-Smoke Clone → e_smoke_clone | The Unseeing Enemy |
| Smoke Clone | — | Striker | Fire | nearest | — | — | summoned by Kigiri |
| Nurari | — | Striker | Water | backline | Sticky Water (Water) | — | The Unseeing Enemy |
| Jugo | jugo | Striker | Wind | nearest | — | enrage: Sage Transformation | Jugo of the North Hideout, Racing Lightning |
| Deidara | deidara | Ranged | Earth / Lightning | nearest | C1 (Earth) | summonAdds: C2 Dragon → e_c2_dragon | Clash! |
| C2 Dragon | — | Ranged | Earth | nearest | — | — | summoned by Deidara |
| Tobi | obito | Striker | Fire | nearest | — | shieldPhase: Kamui | Clash! |
| Rain Ninja | — | Ranged | Water | nearest | — | — | Infiltrate! The Village Hidden in the Rain, The Man Who Became God |
| Konan | konan | Ranged | Wind | nearest | Paper Shuriken (—) | shieldPhase: Dance of the Shikigami | The Man Who Became God |
| Summoned Beast | — | Tank | None (neutral) | nearest | — | — | Honored Sage Mode!, Assault on the Leaf Village! |
| Pain (Chikushodo) | pain | Ranged | Water / Wind | nearest | — | summonAdds: Summoning Jutsu → e_summoned_beast | Honored Sage Mode!, Assault on the Leaf Village!, Explode! Sage Mode |
| Kisame Hoshigaki | kisame | Striker | Water | nearest | Water Style: Exploding Water Shock Wave (Water) | lifesteal: Shark Skin | Banquet Invitation |
| Itachi (Crow Clone) | — | Ranged | Fire | nearest | — | — | summoned by Itachi Uchiha |
| Killer Bee | killer_bee | Striker | Lightning | nearest | Lariat (Lightning) | enrage: Tailed Beast Chakra Arms | Battle of Unraikyo |
| Mist Tracker Ninja | — | Striker | Water | nearest | — | — | The Successor's Wish |
| Mist Tracker Ninja | — | Striker | Water | protected | — | — | The Successor's Wish |
| Bandit Ninja | — | Striker | None (neutral) | nearest | — | — | The Forbidden Jutsu Released |
| Pain (Shurado) | pain | Striker | Water / Wind | nearest | Asura Attack (—) | — | Pain vs. Kakashi, Explode! Sage Mode |
| Pain (Tendo) | pain | Ranged | Water / Wind | nearest | Universal Pull (—) | telegraphAoE: Almighty Push @all | Pain vs. Kakashi |
| Pain (Jigokudo) | pain | Support | Water / Wind | nearest | — | regen: King of Hell | Surname Is Sarutobi. Given Name, Konohamaru! |
| Pain (Gakido) | pain | Tank | Water / Wind | nearest | — | lifesteal: Chakra absorption | Explode! Sage Mode |
| Sasuke Uchiha | sasuke | Striker | Fire / Lightning | nearest | Amaterasu (Fire) | shieldPhase: Susanoo | Racing Lightning |
| Kisame Hoshigaki | kisame | Striker | Water | nearest | Water Prison Shark Dance Jutsu (Water) | lifesteal: Shark Skin | The Tailed Beast vs. The Tailless Tailed Beast |
| Giant Squid | — | Tank | Water | protected | — | — | Killer Bee and Motoi |
| Kisame Hoshigaki | kisame | Striker | Water | nearest | Water Style: Thousand Hungry Sharks (Water) | telegraphAoE: Water Style: Super Shark Bomb Jutsu [Water] @all; lifesteal: Shark Skin | Battle in Paradise! Odd Beast vs. The Monster! |
| Zabuza Momochi (Reanimated) | zabuza | Striker | Water | nearest | Silent Killing (—) | shieldPhase: Ninja Art: Hidden Mist Jutsu; regen: Summoning Jutsu: Reanimation | The First and Last Opponent |
| Haku (Reanimated) | haku | Ranged | Water / Wind | nearest | Secret Jutsu: Crystal Ice Mirrors (Water) | regen: Summoning Jutsu: Reanimation | The First and Last Opponent |
| Kinkaku | — | Striker | None (neutral) | nearest | Leaf Fan (—) | enrage: Nine-Tails | Golden Bonds |
| Ginkaku | — | Striker | None (neutral) | nearest | Amber Purification Jar (—) | — | Golden Bonds |
| Asuma Sarutobi (Reanimated) | asuma | Striker | Wind | nearest | Fire Style: Burning Ash (Fire) | telegraphAoE: Flying Swallow [Wind] @front; regen: Summoning Jutsu: Reanimation | The Complete Ino-Shika-Cho Formation! |
| Mu (Fragmentation) | — | Ranged | Earth | nearest | — | — | summoned by Mu (Reanimated) |
| Madara Uchiha (Reanimated) | madara | Striker | Fire / Earth / Water | nearest | Fire Style: Majestic Destroyer Flame (Fire) | telegraphAoE: Tengai Shinsei @all; regen: Summoning Jutsu: Reanimation | The Five Kage Assemble |
| Four-Tails | — | Striker | Fire / Earth | nearest | Tailed Beast Bomb (—) | — | Four Tails, the King of Sage Monkeys |
| Ten-Tails Clone | — | Striker | Earth / Water | nearest | — | — | Team 7, Assemble! |
| Foundation Operative | — | Striker | None (neutral) | nearest | — | — | Hashirama's Cells |
| Foundation Operative | — | Ranged | None (neutral) | backline | — | — | Hashirama's Cells |
| Gotta | — | Striker | None (neutral) | nearest | — | lifesteal: (unnamed) | Orochimaru's Test Subject |
| Obito Uchiha (Ten-Tails Jinchuriki) | obito | Striker | Fire / Earth / Water | nearest | Truth-Seeking Ball (—) | shieldPhase: Truth-Seeking Ball | The Ten Tails' Jinchuriki |
| Madara Uchiha | madara | Striker | Fire / Earth / Water | nearest | Truth-Seeking Ball (—) | shieldPhase: Truth-Seeking Ball | The Blue Beast vs. Six Paths Madara |
| Kaguya Otsutsuki | — | Ranged | Fire | nearest | All-Killing Ash Bones (—) | elementSwap: Amenominaka [Fire→Water→Earth] | She of the Beginning |
| Sasuke Uchiha (Rinnegan) | sasuke | Striker | Fire / Lightning | nearest | Chidori (Lightning) | shieldPhase: Susanoo | The Final Battle |
| Hotaru | — | Civilian | None (neutral) | nearest | — | — | escort target |
| Leaf Villager | — | Civilian | None (neutral) | nearest | — | — | escort target |
| Motoi | — | Civilian | None (neutral) | nearest | — | — | escort target |
| Tazuna | — | Civilian | None (neutral) | nearest | — | — | escort target |
| Tsunami | — | Civilian | None (neutral) | nearest | — | — | escort target |
| Idate Morino | — | Civilian | None (neutral) | nearest | — | — | escort target |
| Rokusuke | — | Civilian | None (neutral) | nearest | — | — | escort target |
| Kisame Hoshigaki | — | Striker | Water | nearest | — | telegraphAoE: Water Style: Water Shark Bomb Jutsu [Water] @all; lifesteal: Shark Skin | Boss Rush |
| Deidara | — | Ranged | Earth / Lightning | nearest | — | telegraphAoE: C3 [Earth] @all; elementSwap: Explosion Style [Earth→Lightning] | Boss Rush |
| Sasori | — | Ranged | None (neutral) | nearest | — | telegraphAoE: Iron Sand: World Order @all; summonAdds: Secret Red Move: Performance of a Hundred Puppets → e_puppet | Boss Rush |
| Puppet | — | Striker | None (neutral) | nearest | — | — | summoned by Sasori, Sasori |
| Hidan | — | Striker | None (neutral) | nearest | — | telegraphAoE: Curse Jutsu @random; reviveOnce: Immortality | Boss Rush |
| Kakuzu | — | Tank | Earth / Water / Fire / Wind / Lightning | nearest | — | telegraphAoE: Fire Style: Searing Migraine [Fire] @all; elementSwap: Earth Grudge [Earth→Water→Fire→Wind→Lightning]; reviveOnce: Earth Grudge | Boss Rush |
| Itachi Uchiha | — | Ranged | Fire / Water / Wind | nearest | — | telegraphAoE: Amaterasu [Fire] @back; summonAdds: Shadow Clone Jutsu → e_itachi_clone | Boss Rush |
| Itachi (Shadow Clone) | — | Ranged | Fire | nearest | — | — | summoned by Itachi Uchiha |
| Pain | — | Ranged | Fire / Wind / Lightning / Earth / Water | nearest | — | telegraphAoE: Almighty Push @all; reviveOnce: Six Paths of Pain | Boss Rush |

## 4. Story: every arc and node, and where dialogue exists, is thin, or is missing

### 4.1 What narrative text exists today

There is **no dialogue system**: no scene data, no speaker/portrait lines, no text box, and no field on any arc or node for one. The only story text a player reads is:

| Source | Voice | Where shown | Size |
|---|---|---|---|
| Arc `blurb` (26 incl. the Academy) | narrator, one or two sentences of anime synopsis | arc card, node panel header, Wiki arc page | 82–180 chars |
| Node `blurb` (99 + 3 lessons) | narrator; about half are a one-line synopsis ("Brother against brother…"), the rest are mechanical instructions ("Survive 45 seconds against Kakashi") | node panel, pre-fight, results header, Wiki node page | 49–130 chars |
| Tutorial lesson `learn` line and the lesson cards (`TutorialScreen.js`) | the game explaining itself (Wiki voice, second person), not a character | tutorial hub | 3 lessons |
| In-battle coach tips (`BattleScreen._tip`): 13 ids — `battle.start`, `battle.ult`, `battle.clash` (the first story battles) and `lesson.team.start/ult`, `lesson.nature.start/effective`, `lesson.clash.start/windup/overpower/standoff/overwhelmed/auto` (the lessons) | the game's coach voice, cream cards that pause the battle (`tipPause`) | during the lessons and the first story battles, once each (`state.tips.seen`) | one or two sentences each |
| Welcome box | UI voice ("Welcome to the Hidden Leaf Village! Your ninja fight on their own…") | first boot | 3 sentences |
| Screen tips (`tips.js`, 10) | UI voice | first visit to each screen | 1–3 sentences each |
| Announcer banner (`Effects.say`) | "Short: Ultimate name!", "JUTSU CLASH — OVERPOWER!", "X → Water Style (name)", "hold your attacks!" | battle canvas | one line |
| Results, Daily twist texts (`Daily.TWIST_TEXT`), banner blurbs, achievement descriptions, Boss Rush rules | UI voice | their screens | short |
| Intro overlay | "Shinobi Auto-Battler — A fan-made Naruto auto-battler" | intro | one line |

So the honest status for every one of the 99 nodes is the same: **a blurb, and nothing else**. There is no arc opener, no arc closer, no node intro or outro, no boss pre-fight exchange, no in-fiction explanation of any system, and no character ever speaks. The table in §4.3 records each node's blurb and whether it is *narrative* (names a character or an event a scene can grow from) or *mechanical* (only an instruction, so a scene must be written from the episode).

### 4.2 Where each system is explained today

| System | In-fiction (a character says it) | Tutorial / coach (game voice) | Screen tip | Wiki guide | Verdict |
|---|---|---|---|---|---|
| Team building, roles, reach, the Leader slot | — | Lesson 1 card + Team coach box + battle tips | Team tip | team-composition | taught, but by the UI, not by anyone |
| Nature Wheel | — | Lesson 2 (quiz on the card, the foe set up to be countered) | Story tip mentions it | nature-wheel | same |
| Chakra and Ultimates | — | Lesson 3 (full chakra at start) + `battle.start`/ult-ready tips | — | how-to-play | same |
| Jutsu Clash (the standout system) and 🤖 Auto-ult | — | Lesson 3 (a wind-up set up to win) | — | jutsu-clash | same |
| Summoning, banners, rate-ups, pity, tickets, stars | — | — | Summon tip | summoning | UI + Wiki only |
| Levelling, Ryo, catch-up discount, auto-level | — | — | Roster + Character tips | levelling | UI + Wiki only |
| Story map, ⚡ recommended power, Skip, replay rewards | — | — | Story tip | how-to-play | UI + Wiki only |
| Boss Rush | — | — | Boss Rush tip + rules copy on the screen | endgame | UI + Wiki only |
| Hard mode | — | — | Hard tip | endgame | UI + Wiki only |
| Daily challenge and twists | — | — | Daily tip + twist copy | endgame | UI + Wiki only |
| Achievements | — | — | Achievements tip | achievements | UI + Wiki only |
| Presets, counter hints, Auto team, speed | — | — | Team tip | how-to-play, whats-new | UI + Wiki only |
| Cloud save, Google link, install | — | — | Settings tip, install notice/popup | how-to-play | UI only |

The brief's Phase 5 goal ("a new player never needs the wiki") therefore means writing an in-fiction explanation for **every row**, choosing a teacher for each (Phase 1 asks who), and deciding how much of it lives in the tutorial arc (to be extended, not replaced) versus arc openers later.

### 4.3 Every arc and node

Filler arcs are marked; they are the ones the brief asks how to frame. Global node numbers are the ones the level curve uses.

#### Tutorial: Tutorial: The Academy (episodes 1)

*Arc blurb (180 chars):* "Graduation night at the Academy. Naruto has just failed his exam, and Mizuki has a secret "make-up test" in mind. Three short lessons teach you the basics before the Survival Test."  
*Stage theme today:* sky #1d2a4d → #44588a, far #233a2b, ground #34533a, accent #fbbf24 (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| T1 | Enter: Naruto Uzumaki! | 1 | defeatAll | Mizuki | — | "Mizuki tricked Naruto into stealing the Scroll of Sealing. Now he wants it for himself. Build your team and stop him." | blurb only (117 chars, narrative); no intro/outro scene |
| T2 | Transformation Jutsu | 1 | defeatAll | Mizuki | forced: naruto, sasuke, sakura; leader: kakashi | "Mizuki uses the Transformation Jutsu to pose as Iruka, but his Earth Style gives him away. Team 7 fights together for this lesson." | blurb only (130 chars, narrative); no intro/outro scene |
| T3 | Multi Shadow Clone Jutsu | 1 | defeatAll | Mizuki | forced: naruto, sasuke, sakura; leader: kakashi | "Naruto's Multi Shadow Clone Jutsu ends the night. Time your Ultimates and meet Mizuki's jutsu head-on." | blurb only (102 chars, narrative); no intro/outro scene |

#### Part I · Arc 1: Prologue: Survival Test (episodes 4–5)

*Arc blurb (112 chars):* "Kakashi Hatake gives Team 7 until noon to take two bells from him. Pass or fail — it all comes down to teamwork."  
*Stage theme today:* sky #9bd4ff → #e8f6ff, far #3f7d3a, ground #5fa04e, accent #f97316 (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 1 | Pass or Fail: Survival Test | 4 | survive 45s | Kakashi Hatake | forced: naruto, sakura, sasuke; leader: none; banned: kakashi | "Survive 45 seconds against Kakashi — or take him down." | blurb only (54 chars, narrative); no intro/outro scene |
| 2 | One Thousand Years of Death | 4 | defeatAll | Kakashi Hatake | forced: naruto; banned: kakashi; recommended: sakura, sasuke | "Naruto charges in alone. Kakashi answers with a Substitution Jutsu and a very unfortunate finger jab." | blurb only (101 chars, narrative); no intro/outro scene |
| 3 | The Final Bell | 5 | defeatBoss | Kakashi Hatake 👑 | banned: kakashi; recommended: naruto, sakura, sasuke | "Kakashi stops holding back: Death Mirage genjutsu, Headhunter Jutsu, and a log where you expected a Jonin." | blurb only (106 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part I · Arc 2: Land of Waves (episodes 6–19)

*Arc blurb (107 chars):* "A simple escort mission for the bridge builder Tazuna turns into a clash with the Demon of the Hidden Mist."  
*Stage theme today:* sky #9fb4c7 → #e3edf5, far #48687d, ground #6b8fa3, accent #38bdf8 (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 4 | The Demon Brothers | 6 | protect (npc_tazuna) | Gozu, Meizu | recommended: kakashi, naruto, sasuke, sakura | "Gozu and Meizu ambush the escort. Meizu goes straight for Tazuna — keep him alive!" | blurb only (82 chars, narrative); no intro/outro scene |
| 5 | Water Prison Jutsu | 7–9 | defeatAll | Zabuza Momochi | recommended: kakashi, naruto, sasuke | "Zabuza Momochi traps Kakashi in a Water Prison and sends Water Clones after the genin." | blurb only (86 chars, narrative); no intro/outro scene |
| 6 | Zori and Waraji | 13 | protect (npc_tsunami) | Zori, Waraji | recommended: naruto | "Gato's samurai thugs come for Tsunami. Zori runs past everyone — protect her." | blurb only (77 chars, narrative); no intro/outro scene |
| 7 | Secret Jutsu: Crystal Ice Mirrors | 12–17 | defeatAll | Haku | forced: naruto, sasuke | "Haku traps Naruto and Sasuke inside a dome of ice mirrors, shifting between Water and Wind." | blurb only (91 chars, narrative); no intro/outro scene |
| 8 | Showdown on the Bridge | 15–19 | defeatBoss | Zabuza Momochi 👑, Gato's Thug (+22s), Gato's Thug (+24s) | recommended: kakashi, naruto, sasuke, sakura | "Kakashi's Lightning Blade against Zabuza's Water Dragon — and Gato's thugs arrive late to the party." | blurb only (100 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part I · Arc 3: Chunin Exams (episodes 20–67)

*Arc blurb (104 chars):* "The Forest of Death, the preliminaries and the finals. Rookies from every village want that Chunin vest."  
*Stage theme today:* sky #6a8f5a → #c9dfb8, far #2a4520, ground #3d5e2e, accent #a3e635 (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 9 | Forest of Death: The Grass Ninja | 28–30 | survive 40s | Orochimaru | recommended: naruto, sasuke, sakura | "A "Grass ninja" turns out to be Orochimaru. You cannot win this — survive for 40 seconds." | blurb only (89 chars, narrative); no intro/outro scene |
| 10 | Forest of Death: Sound Ninja Ambush | 31–33 | defeatAll | Dosu Kinuta, Zaku Abumi, Kin Tsuchi | recommended: lee, sakura, ino, shikamaru, choji | "Dosu, Zaku and Kin attack the exhausted Team 7. Rock Lee and Team 10 jump in." | blurb only (77 chars, narrative); no intro/outro scene |
| 11 | Forest of Death: Team Oboro | 35–36 | defeatAll | Oboro, Mubi, Kagari | recommended: naruto, sasuke, sakura | "Oboro's Misty Follower Jutsu fills the forest with fakes while Mubi and Kagari strike." | blurb only (86 chars, narrative); no intro/outro scene |
| 12 | Preliminaries: Yoroi and Misumi | 38–40 | defeatAll | Yoroi Akado, Misumi Tsurugi | recommended: sasuke, kankuro | "Kabuto's teammates: Yoroi drains chakra on contact, Misumi bends like rubber." | blurb only (77 chars, narrative); no intro/outro scene |
| 13 | Finals: Naruto vs. Neji | 60–63 | defeatBoss | Neji Hyuga 👑 | banned: neji; recommended: naruto | "Neji spins into Eight Trigrams: Palm Rotation — damage bounces back while it lasts. Watch for the Sixty-Four Palms wind-up." | blurb only (123 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part I · Arc 4: Destruction of the Hidden Leaf Village (episodes 68–80)

*Arc blurb (93 chars):* "Zero hour: the Sand and Sound invade during the finals, and Orochimaru faces his old teacher."  
*Stage theme today:* sky #e59866 → #f6d7b0, far #7a4f2c, ground #9c6b3f, accent #ef4444 (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 14 | Zero Hour | 68–70 | defeatAll | Sand Ninja, Sound Ninja, Sand Ninja (+8s), Sound Ninja (+14s) | recommended: shikamaru, kakashi, guy | "Sand and Sound ninja pour over the walls in waves." | blurb only (50 chars, narrative); no intro/outro scene |
| 15 | Shino vs. Kankuro | 72–74 | defeatAll | Kankuro, Temari | recommended: shino, sasuke | "Kankuro stays behind to stall the pursuit, with Temari close by." | blurb only (64 chars, narrative); no intro/outro scene |
| 16 | The Third Hokage's Last Stand | 69–80 | defeatBoss | Hashirama Senju (Reanimated), Tobirama Senju (Reanimated), Orochimaru 👑 | forced: hiruzen; leader: hiruzen | "Flashback-style node: fight as the Third Hokage. The reanimated First and Second guard Orochimaru — only Orochimaru has to fall." | blurb only (128 chars, narrative); no intro/outro scene; no boss pre-fight exchange |
| 17 | Naruto vs. Gaara | 75–80 | defeatBoss | Gaara 👑 | recommended: naruto, sasuke, sakura | "Gaara's Sand Shield soaks damage, Wind Style: Air Bullet hits everyone, and Play Possum Jutsu unleashes the One-Tail." | blurb only (117 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part I · Arc 5: Search for Tsunade (episodes 81–100)

*Arc blurb (103 chars):* "Itachi and Kisame hunt Naruto while Jiraiya and Naruto search for Tsunade, all the way to Tanzaku Town."  
*Stage theme today:* sky #7c7aa8 → #d7d3ee, far #3f3c58, ground #5b5877, accent #a78bfa (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 18 | Itachi and Kisame | 81–82 | survive 45s | Kisame Hoshigaki, Itachi Uchiha | recommended: asuma, kurenai, kakashi | "Two Akatsuki at the village gates. Hold on for 45 seconds until Might Guy arrives." | blurb only (82 chars, narrative); no intro/outro scene |
| 19 | Tsunade's Bet | 90–91 | survive 30s | Tsunade | forced: naruto; banned: tsunade | "Tsunade fights Naruto with one finger. Last 30 seconds to win the bet." | blurb only (70 chars, narrative); no intro/outro scene |
| 20 | Kabuto in Tanzaku Town | 93–94 | defeatAll | Kabuto Yakushi | banned: kabuto; recommended: naruto, shizune, jiraiya | "Kabuto's Chakra Scalpel cuts from the inside, and his Healing Jutsu keeps him standing." | blurb only (87 chars, narrative); no intro/outro scene |
| 21 | Deadlock! Sannin Showdown! | 95–96 | defeatBoss | Orochimaru 👑, Kabuto Yakushi (+6s) | banned: orochimaru, kabuto; recommended: jiraiya, tsunade, naruto, shizune | "Orochimaru summons Manda. Two Sannin against one." | blurb only (49 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part I · Arc 6: Land of Tea Escort Mission (episodes 102–106) — *anime filler*

*Arc blurb (87 chars):* "Team 7 — without Kakashi — escorts the runner Idate Morino to the Todoroki Shrine race."  
*Stage theme today:* sky #86b6a0 → #dff1e7, far #356b53, ground #4f8a6e, accent #34d399 (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 22 | Ambush at Sea | 103–104 | protect (npc_idate) | Oboro, Mubi, Kagari | banned: kakashi; recommended: naruto, sasuke, sakura | "Team Oboro, hired by the Wagarashi family, goes after Idate. Mubi tunnels straight for him." | blurb only (91 chars, narrative); no intro/outro scene |
| 23 | Ninja Art: Senbon Rainstorm | 104 | defeatAll | Aoi Rokusho, Kagari (+10s) | banned: kakashi; recommended: naruto, sasuke, sakura | "Aoi Rokusho opens his umbrella and it rains poisoned needles." | blurb only (61 chars, narrative); no intro/outro scene |
| 24 | Blade of the Thunder Spirit | 105–106 | defeatBoss | Aoi Rokusho 👑 | banned: kakashi; recommended: naruto, sasuke | "Aoi draws the Second Hokage's sword: his attacks turn to Lightning." | blurb only (67 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part I · Arc 7: Sasuke Retrieval Squad (episodes 107–135)

*Arc blurb (90 chars):* "Shikamaru leads the new squad after the Sound Ninja Four and Sasuke — one fight at a time."  
*Stage theme today:* sky #5b6b8c → #b9c5dc, far #2f374a, ground #465066, accent #60a5fa (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 25 | Earth Style Barrier: Earth Dome Prison | 111–114 | defeatAll | Jirobo | banned: jirobo; recommended: choji, shikamaru | "Jirobo drains chakra from everything he touches. Choji stays behind." | blurb only (68 chars, narrative); no intro/outro scene |
| 26 | Spider Bow: Fierce Rip | 115–117 | defeatAll | Kidomaru | banned: kidomaru; recommended: neji | "Kidomaru snipes your back line from the trees. Neji finds the blind spot." | blurb only (73 chars, narrative); no intro/outro scene |
| 27 | Reinforcements from the Sand | 119–125 | defeatAll | Sakon and Ukon, Tayuya | banned: sakon, tayuya; recommended: kankuro, temari, kiba, shikamaru | "Sakon and Ukon, and Tayuya with her Doki — just as Gaara, Temari and Kankuro arrive from the Sand." | blurb only (98 chars, narrative); no intro/outro scene |
| 28 | Bracken Dance | 123–127 | defeatBoss | Kimimaro 👑 | banned: kimimaro; recommended: lee, gaara | "Kimimaro, last of his clan. Larch Dance punishes reckless hits." | blurb only (63 chars, narrative); no intro/outro scene; no boss pre-fight exchange |
| 29 | Final Valley | 128–134 | defeatBoss | Sasuke Uchiha (Heavens' Curse Mark) 👑 | banned: sasuke, sasuke_cursemark; recommended: naruto | "Chidori against Rasengan. Sasuke's Heavens' Curse Mark brings him back once." | blurb only (76 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part I · Arc 8: Kurosuki Family Removal Mission (episodes 152–157) — *anime filler*

*Arc blurb (108 chars):* "Naruto and Team Guy take on Raiga Kurosuki, the Thunder of the Hidden Mist, and his funeral-obsessed family."  
*Stage theme today:* sky #475569 → #94a3b8, far #1e293b, ground #334155, accent #facc15 (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 30 | Funeral March for the Living | 152–153 | protect (npc_rokusuke) | Kurosuki Family Member, Kurosuki Family Member, Kurosuki Family Member (+6s) | recommended: naruto, neji, lee, tenten | "Rokusuke is about to be buried alive by the Kurosuki family. Get him out." | blurb only (73 chars, narrative); no intro/outro scene |
| 31 | Raiga and Ranmaru | 153–154 | defeatAll | Raiga Kurosuki, Ranmaru | recommended: naruto, neji, lee, tenten | "Ranmaru sees through the mist for Raiga. Take out the eyes, then the sword." | blurb only (75 chars, narrative); no intro/outro scene |
| 32 | Thunder Funeral: Feast of Lightning | 156–157 | defeatBoss | Raiga Kurosuki 👑 | recommended: naruto, neji, lee, tenten | "Raiga returns in the storm, wrapped in Thunder Armour." | blurb only (54 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part II · Arc 1: Kazekage Rescue Mission (episodes 1–32)

*Arc blurb (150 chars):* "Two and a half years later, Naruto is back — and Akatsuki has taken Gaara, now the Fifth Kazekage. Team Kakashi and Team Guy race to the Land of Wind."  
*Stage theme today:* sky #f2b56b → #fbe7c6, far #b98a4a, ground #d4a55f, accent #f59e0b (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 33 | The Results of Training | 3 | defeatAll | Kakashi Hatake | forced: naruto, sakura; banned: kakashi, kakashi_mangekyo | "Kakashi puts the bells back on the table. Naruto and Sakura have to show him what two and a half years of training looks like." | blurb only (126 chars, narrative); no intro/outro scene |
| 34 | The Kazekage Stands Tall | 5 | survive 40s | Deidara | forced: gaara; leader: gaara; banned: gaara_kazekage | "Fight as Gaara. Deidara circles the Hidden Sand on a clay bird and drops C3 on the village — hold the sky for 40 seconds." | blurb only (121 chars, narrative); no intro/outro scene |
| 35 | Traps Activate! Team Guy's Enemy | 19 | defeatAll | Might Guy (Clone), Rock Lee (Clone), Neji Hyuga (Clone), Tenten (Clone) | forced: guy, lee, neji, tenten | "The barrier tags come off and Team Guy meets its own copies. Taijutsu against taijutsu." | blurb only (87 chars, narrative); no intro/outro scene |
| 36 | Puppet Fight: 10 vs. 100! | 20–26 | defeatBoss | Sasori 👑 | forced: sakura, chiyo; banned: sasori | "Sakura and Chiyo against Sasori. Break Hiruko, then survive the Performance of a Hundred Puppets." | blurb only (97 chars, narrative); no intro/outro scene; no boss pre-fight exchange |
| 37 | Kakashi Enlightened! | 27–30 | defeatBoss | Deidara 👑 | banned: deidara; recommended: naruto, kakashi, kakashi_mangekyo | "Naruto and Kakashi catch Deidara over the forest. His clay birds never stop coming, and his Clay Clone buys him a second chance." | blurb only (128 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part II · Arc 2: Tenchi Bridge Reconnaissance Mission (episodes 33–53)

*Arc blurb (126 chars):* "A new Team Kakashi — Yamato leading, Sai along — goes to meet Sasori's spy on the Tenchi Bridge, and finds the road to Sasuke."  
*Stage theme today:* sky #8aa7b8 → #dce8ee, far #3e5a48, ground #5b7a5e, accent #22d3ee (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 38 | Simulation | 38 | defeatAll | Yamato | forced: naruto, sai; banned: yamato | "Yamato plays the spy in a mock meeting. Naruto and Sai have to work together — whether they like it or not." | blurb only (107 chars, narrative); no intro/outro scene |
| 39 | The Tenchi Bridge | 39 | defeatAll | Kabuto Yakushi, Orochimaru (+10s) | forced: yamato; banned: kabuto, orochimaru; recommended: naruto, sakura, sai | "Yamato, disguised as Sasori, meets the spy: Kabuto. Then Orochimaru arrives, and the meeting turns into an ambush." | blurb only (114 chars, narrative); no intro/outro scene |
| 40 | Orochimaru vs. Jinchuriki | 40–42 | defeatAll | Orochimaru | forced: naruto_ninetails; banned: orochimaru | "The Nine-Tails' chakra takes over Naruto. Orochimaru keeps shedding his wounds — keep hitting until he runs out." | blurb only (112 chars, narrative); no intro/outro scene |
| 41 | The Power of Uchiha | 51–52 | defeatBoss | Sasuke Uchiha 👑 | banned: sasuke, sasuke_cursemark, sasuke_ems; recommended: naruto, sakura, sai, yamato | "Sasuke, at last. Chidori Stream electrifies everyone near him, and the Curse Mark pushes him further when he is cornered." | blurb only (121 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part II · Arc 3: Twelve Guardian Ninja (episodes 54–71) — *anime filler*

*Arc blurb (112 chars):* "Asuma, the Fire Temple monk Sora, and a plot by former Twelve Guardian Ninja to raise the dead against the Leaf."  
*Stage theme today:* sky #3b3561 → #8a82b8, far #2c2f3d, ground #4a4f5c, accent #f472b6 (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 42 | Revived Souls | 66 | defeatAll | Fuka, Fudo | recommended: naruto, yamato, sakura, asuma | "Naruto and Yamato take on Fuka and Fudo. Fuka steals chakra with a kiss; Fudo hides behind Rock Armour." | blurb only (103 chars, narrative); no intro/outro scene |
| 43 | Despair | 69 | survive 40s | Sora | recommended: choji, kiba, shikamaru, lee | "The Nine-Tails' chakra planted in Sora breaks loose. You can't beat it — hold on for 40 seconds." | blurb only (96 chars, narrative); no intro/outro scene |
| 44 | My Friend | 71 | defeatBoss | Kazuma 👑 | recommended: sai, asuma, naruto | "Sai and Asuma corner Kazuma. His Soil Bodies rise again and again until he falls." | blurb only (81 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part II · Arc 4: Akatsuki Suppression Mission (episodes 72–88)

*Arc blurb (110 chars):* "Hidan and Kakuzu come for the bounty on Asuma's old comrades. Team 10 wants them to pay for what happens next."  
*Stage theme today:* sky #5c6f7c → #c5d2d9, far #34422e, ground #4f5f45, accent #e11d48 (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 45 | Climbing Silver | 77–78 | survive 45s | Hidan | recommended: asuma, shikamaru, choji, ino | "Asuma's squad ambushes Hidan at the bounty station. He cannot die — survive 45 seconds of his ritual." | blurb only (101 chars, narrative); no intro/outro scene |
| 46 | Kakuzu's Abilities | 83–84 | defeatAll | Kakuzu | banned: kakuzu; recommended: kakashi, shikamaru, choji, ino | "Kakashi joins Team 10. Kakuzu hardens his skin and pulls masked beasts out of his own back." | blurb only (91 chars, narrative); no intro/outro scene |
| 47 | Shikamaru's Genius | 85–87 | defeatBoss | Hidan 👑 | forced: shikamaru; banned: hidan | "Shikamaru alone against Hidan in the Nara forest. Every curse he lands hurts both of you — end it fast." | blurb only (103 chars, narrative); no intro/outro scene; no boss pre-fight exchange |
| 48 | Wind Style: Rasen Shuriken! | 88 | defeatBoss | Kakuzu 👑 | banned: kakuzu; recommended: naruto, kakashi, yamato, sakura | "Naruto's new jutsu against Kakuzu's five hearts. Every heart swaps his nature — read the wheel as it turns." | blurb only (107 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part II · Arc 5: Three-Tails' Appearance (episodes 89–112) — *anime filler*

*Arc blurb (114 chars):* "The Three-Tails surfaces in a lake near the Leaf. Orochimaru's crystal user Guren wants it — and so does Akatsuki."  
*Stage theme today:* sky #6d8b9a → #d0e3ea, far #2f4d4f, ground #4a6b6b, accent #a78bfa (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 49 | The Unseeing Enemy | 96 | defeatAll | Kigiri, Nurari | recommended: hinata, kiba, shino, kurenai | "Kigiri's smoke fills the woods while Nurari slips past the front line. Team Kurenai has to see through it." | blurb only (106 chars, narrative); no intro/outro scene |
| 50 | Breaking the Crystal Style | 104 | defeatBoss | Guren 👑 | recommended: shino, kakashi, naruto, sai | "Guren's Jade Crystal Mirror throws your hits back at you. Wait out the mirror, then break through." | blurb only (98 chars, narrative); no intro/outro scene; no boss pre-fight exchange |
| 51 | Shattered Promise | 111 | defeatBoss | Three-Tails 👑 | recommended: naruto, kakashi, yamato, shino | "Yukimaru's grief sends the Three-Tails into a rage. Drive it back under the lake." | blurb only (81 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part II · Arc 6: Itachi Pursuit Mission (episodes 113–118, 121–126)

*Arc blurb (108 chars):* "Sasuke leaves Orochimaru behind and gathers his own team to hunt Itachi. Akatsuki sends Deidara to stop him."  
*Stage theme today:* sky #8c6f5a → #e3d2c3, far #4a3b31, ground #6b5647, accent #f97316 (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 52 | Jugo of the North Hideout | 117 | defeatAll | Jugo | forced: sasuke; banned: jugo; recommended: suigetsu, karin | "The last recruit is Jugo — and his other side does not want to leave the North Hideout." | blurb only (87 chars, narrative); no intro/outro scene |
| 53 | Clash! | 122–123 | defeatAll | Deidara, Tobi | forced: sasuke; banned: deidara | "Deidara and Tobi block Sasuke's way. Tobi shrugs off everything, so bring Deidara down first — before the C2 Dragon takes off." | blurb only (126 chars, narrative); no intro/outro scene |
| 54 | Art | 124 | defeatBoss | Deidara 👑 | forced: sasuke; banned: deidara | "C4 Karura, a Clay Clone, and finally C0: Deidara's last work of art." | blurb only (68 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part II · Arc 7: Tale of Jiraiya the Gallant (episodes 127–133)

*Arc blurb (106 chars):* "Jiraiya slips into the Village Hidden in the Rain to find the leader of Akatsuki: one of his own students."  
*Stage theme today:* sky #4b5563 → #9ca3af, far #1f2937, ground #374151, accent #fb923c (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 55 | Infiltrate! The Village Hidden in the Rain | 129 | defeatAll | Rain Ninja, Rain Ninja, Rain Ninja (+8s) | forced: jiraiya | "Jiraiya goes in alone. The Rain Ninja at the gate are only the start." | blurb only (69 chars, narrative); no intro/outro scene |
| 56 | The Man Who Became God | 130 | defeatAll | Konan, Rain Ninja (+12s) | forced: jiraiya; banned: konan | "Konan, another former student, meets her old teacher in a storm of paper." | blurb only (73 chars, narrative); no intro/outro scene |
| 57 | Honored Sage Mode! | 131 | defeatAll | Pain (Chikushodo), Summoned Beast | forced: jiraiya; banned: pain | "Jiraiya enters Sage Mode. Pain answers with a rhino, a bird, a bull and a dog that multiplies." | blurb only (94 chars, narrative); no intro/outro scene |
| 58 | In Attendance, the Six Paths of Pain | 132–133 | defeatBoss | Pain 👑 | forced: jiraiya; banned: pain | "Six Pains stand in front of him, including the three he already beat. The Six Paths of Pain rise once more." | blurb only (107 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part II · Arc 8: Fated Battle Between Brothers (episodes 134–143)

*Arc blurb (109 chars):* "Sasuke finally faces Itachi at the Uchiha hideout. What he learns afterwards sends him after the Eight-Tails."  
*Stage theme today:* sky #3f1d2b → #9b5c6e, far #2a1a25, ground #4a3040, accent #dc2626 (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 59 | Banquet Invitation | 134 | survive 40s | Kisame Hoshigaki | forced: suigetsu, karin, jugo; banned: sasuke, sasuke_cursemark, sasuke_ems, kisame | "Kisame lets only Sasuke through. The rest of his team is left facing Samehada — hold for 40 seconds." | blurb only (100 chars, narrative); no intro/outro scene |
| 60 | Amaterasu! | 135–138 | defeatBoss | Itachi Uchiha 👑 | forced: sasuke; banned: itachi | "Brother against brother. Watch for the black flames of Amaterasu, and for Susanoo when Itachi is nearly down." | blurb only (109 chars, narrative); no intro/outro scene; no boss pre-fight exchange |
| 61 | Battle of Unraikyo | 142 | defeatAll | Killer Bee | forced: sasuke; banned: killer_bee; recommended: suigetsu, karin, jugo | "Taka catches up with Killer Bee in the Land of Lightning. He raps, he blocks, and his Lariat hits like a train." | blurb only (111 chars, narrative); no intro/outro scene |
| 62 | The Eight-Tails vs. Sasuke | 143 | defeatBoss | Eight-Tails 👑 | forced: sasuke; banned: killer_bee; recommended: suigetsu, karin, jugo | "Bee lets the Eight-Tails out. Clash its Tailed Beast Bomb, or be ready to heal." | blurb only (79 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part II · Arc 9: Six-Tails Unleashed (episodes 144–151) — *anime filler*

*Arc blurb (135 chars):* "Team 7 guards Hotaru, heir to the Tsuchigumo clan's forbidden jutsu, while the wandering Six-Tails jinchuriki Utakata watches over her."  
*Stage theme today:* sky #6b8f71 → #d6e8d4, far #2f4a34, ground #4b6b4f, accent #34d399 (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 63 | The Successor's Wish | 146 | protect (npc_hotaru) | Mist Tracker Ninja, Mist Tracker Ninja, Mist Tracker Ninja (+6s) | recommended: naruto, sakura, sai, yamato | "Mist tracker ninja come for Utakata and take Hotaru hostage. Get her back." | blurb only (74 chars, narrative); no intro/outro scene |
| 64 | The Forbidden Jutsu Released | 150 | survive 40s | Bandit Ninja, Bandit Ninja, Bandit Ninja (+10s), Bandit Ninja (+18s) | recommended: naruto, sakura, sai, yamato | "The bandits and the turned villagers pin Team 7 down. Hold them off for 40 seconds." | blurb only (83 chars, mechanical); no intro/outro scene |
| 65 | Master and Student | 151 | defeatBoss | Shiranami 👑 | recommended: naruto, sakura, sai, yamato | "Shiranami has the forbidden jutsu and a Word Bind on Hotaru. Stop him before the Big Bang goes off." | blurb only (99 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part II · Arc 10: Pain's Assault (episodes 152–175)

*Arc blurb (120 chars):* "Pain comes to the Hidden Leaf for the Nine-Tails. While Naruto trains on Mount Myoboku, the village fights for its life."  
*Stage theme today:* sky #6b7280 → #d1d5db, far #57534e, ground #78716c, accent #fb923c (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 66 | Assault on the Leaf Village! | 157 | protect (npc_leaf_villager) | Pain (Chikushodo), Summoned Beast, Summoned Beast (+8s) | banned: pain; recommended: iruka, shizune, kakashi, hinata | "Pain's animals are loose in the streets. Keep the villager alive." | blurb only (65 chars, narrative); no intro/outro scene |
| 67 | Pain vs. Kakashi | 158–159 | defeatAll | Pain (Shurado), Pain (Tendo) (+10s) | forced: kakashi; banned: pain; recommended: choji | "Kakashi takes on two Pains at once. Tendo pushes everything away; Shurado fires missiles from its body." | blurb only (103 chars, narrative); no intro/outro scene |
| 68 | Surname Is Sarutobi. Given Name, Konohamaru! | 161 | defeatAll | Pain (Jigokudo) | forced: konohamaru; banned: pain | "Konohamaru against Jigokudo, the path that heals the others. One Rasengan, well placed." | blurb only (87 chars, narrative); no intro/outro scene |
| 69 | Explode! Sage Mode | 163–164 | defeatAll | Pain (Gakido), Pain (Chikushodo), Pain (Shurado) (+12s) | forced: naruto_sage; banned: pain | "Naruto lands in the crater in Sage Mode. Gakido drinks jutsu and Chikushodo keeps summoning — split them up." | blurb only (108 chars, narrative); no intro/outro scene |
| 70 | Planetary Devastation | 165–167 | defeatBoss | Pain (Tendo) 👑 | banned: pain, konan; recommended: naruto_sage, hinata | "The last Pain. Almighty Push throws attacks back at you, and Planetary Devastation pulls the whole field into the sky." | blurb only (118 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part II · Arc 11: Five Kage Summit (episodes 197–214)

*Arc blurb (82 chars):* "The Five Kage meet in the Land of Iron, and Sasuke walks straight into the summit."  
*Stage theme today:* sky #cbd5e1 → #f1f5f9, far #94a3b8, ground #e2e8f0, accent #38bdf8 (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 71 | Racing Lightning | 202 | defeatAll | Sasuke Uchiha, Jugo | forced: ay; leader: ay; banned: sasuke, sasuke_cursemark, sasuke_ems, jugo; recommended: darui | "Fight as the Fourth Raikage. Sasuke has cut through the samurai and Jugo is in his Sage Transformation." | blurb only (103 chars, narrative); no intro/outro scene |
| 72 | The Tailed Beast vs. The Tailless Tailed Beast | 207 | defeatAll | Kisame Hoshigaki | forced: killer_bee; banned: kisame | "Kisame fuses with Samehada to drain Killer Bee. Out-damage the drain." | blurb only (69 chars, narrative); no intro/outro scene |
| 73 | Danzo Shimura | 209–211 | defeatBoss | Danzo Shimura 👑 | forced: sasuke, karin | "Fight as Sasuke, with Karin sensing. Danzo's Izanagi rewrites one death — make him use it." | blurb only (90 chars, narrative); no intro/outro scene; no boss pre-fight exchange |
| 74 | The Burden | 212–214 | defeatBoss | Sasuke Uchiha 👑 | banned: sasuke, sasuke_cursemark, sasuke_ems; recommended: kakashi, sakura, naruto_sage | "Kakashi steps between Sakura and Sasuke. Sasuke is going blind, and he is at his most dangerous." | blurb only (96 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part II · Arc 12: Fourth Great Ninja War: Countdown (episodes 215–222, 243–256)

*Arc blurb (108 chars):* "Naruto is hidden on the Island Turtle to learn to control the Nine-Tails while the world gets ready for war."  
*Stage theme today:* sky #7dd3c0 → #e6fbf5, far #2c6b46, ground #3f8f5f, accent #fbbf24 (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 75 | Killer Bee and Motoi | 244 | protect (npc_motoi) | Giant Squid | recommended: killer_bee, naruto, yamato | "A giant squid grabs Motoi off the Island Turtle. Get him back before it drags him under." | blurb only (88 chars, narrative); no intro/outro scene |
| 76 | Target: Nine Tails | 245–247 | defeatBoss | Nine-Tails 👑 | forced: naruto; banned: naruto_ninetails, naruto_sage, naruto_sixpaths | "Tug-of-war with the Nine-Tails inside Naruto's own mind. Win it and the chakra is his." | blurb only (86 chars, narrative); no intro/outro scene; no boss pre-fight exchange |
| 77 | Battle in Paradise! Odd Beast vs. The Monster! | 250–251 | defeatAll | Kisame Hoshigaki | forced: guy; banned: kisame | "Kisame tries to escape with the jinchuriki intel. Might Guy is in the way." | blurb only (74 chars, narrative); no intro/outro scene |
| 78 | The Angelic Herald of Death | 252–253 | defeatBoss | Tobi 👑 | forced: konan; banned: obito | "Konan against Tobi above the Hidden Rain. Kamui makes him untouchable for moments at a time — and Izanagi gives him one more." | blurb only (125 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part II · Arc 13: Fourth Great Ninja War: Confrontation (episodes 261–289, 296–321)

*Arc blurb (116 chars):* "The Allied Shinobi Forces march. Kabuto's Reanimation Jutsu sends the dead against them — old enemies, old teachers."  
*Stage theme today:* sky #9a8c7a → #e6ddd0, far #5a4c3b, ground #7a6a55, accent #eab308 (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 79 | The First and Last Opponent | 265–266 | defeatAll | Zabuza Momochi (Reanimated), Haku (Reanimated) | recommended: kakashi, sakura, sai, omoi | "Kakashi's division meets Zabuza and Haku again. The reanimated bodies keep rebuilding themselves." | blurb only (97 chars, narrative); no intro/outro scene |
| 80 | Golden Bonds | 267–270 | defeatAll | Ginkaku, Kinkaku | forced: darui | "Darui faces the Gold and Silver Brothers. Kinkaku turns into a false Nine-Tails when his brother falls." | blurb only (103 chars, narrative); no intro/outro scene |
| 81 | The Complete Ino-Shika-Cho Formation! | 273–274 | defeatAll | Asuma Sarutobi (Reanimated) | forced: ino, shikamaru, choji; banned: asuma | "Team 10 against their own sensei. Asuma would want them to win." | blurb only (63 chars, narrative); no intro/outro scene |
| 82 | The Acknowledged One | 298–299 | defeatBoss | Nagato (Reanimated) 👑 | banned: pain; recommended: naruto_sage, killer_bee, itachi | "Naruto and Bee against a reanimated Nagato, with Itachi on their side. The King of Hell keeps him standing." | blurb only (107 chars, narrative); no intro/outro scene; no boss pre-fight exchange |
| 83 | Gaara and Onoki vs. Mu | 300 | defeatBoss | Mu (Reanimated) 👑 | recommended: gaara_kazekage, onoki, naruto_sage | "The Second Tsuchikage turns invisible and splits in two. Find him before Particle Style finds you." | blurb only (98 chars, mechanical); no intro/outro scene; no boss pre-fight exchange |

#### Part II · Arc 14: Fourth Great Ninja War: Climax (episodes 322–348, 362–375)

*Arc blurb (93 chars):* "The real Madara takes the field, Itachi and Sasuke stop Kabuto, and the Ten-Tails is revived."  
*Stage theme today:* sky #7f1d1d → #d6a092, far #3b2621, ground #5c3d33, accent #f43f5e (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 84 | The Five Kage Assemble | 322–323 | survive 50s | Madara Uchiha (Reanimated) | banned: madara; recommended: gaara_kazekage, onoki, mei, ay, tsunade | "A reanimated Madara drops a meteorite on the Fourth Division. Last 50 seconds until the Kage arrive." | blurb only (100 chars, narrative); no intro/outro scene |
| 85 | Four Tails, the King of Sage Monkeys | 325–326 | defeatAll | Four-Tails | recommended: naruto_sage, killer_bee | "The Four-Tails swallows Naruto whole. Naruto and Bee fight their way back out." | blurb only (78 chars, narrative); no intro/outro scene |
| 86 | The Izanami Activated | 331–338 | defeatBoss | Kabuto Yakushi (Sage Mode) 👑 | forced: itachi, sasuke; banned: kabuto | "Itachi and Sasuke against Kabuto in Sage Mode, who brings the Sound Five back as his own weapons." | blurb only (97 chars, narrative); no intro/outro scene; no boss pre-fight exchange |
| 87 | Team 7, Assemble! | 373 | defeatAll | Ten-Tails Clone, Ten-Tails Clone, Ten-Tails Clone (+6s), Ten-Tails Clone (+12s) | forced: naruto_sage, sasuke_ems, sakura_hundred | "Naruto, Sasuke and Sakura, together again, cut through the Ten-Tails clones." | blurb only (76 chars, narrative); no intro/outro scene |
| 88 | Kakashi vs. Obito | 374–375 | defeatBoss | Obito Uchiha 👑 | forced: kakashi; banned: obito | "Inside the Kamui dimension, the old teammates settle it. Obito phases out of hits — strike between." | blurb only (99 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part II · Arc 15: Kakashi: Shadow of the ANBU Black Ops (episodes 349–361) — *anime-only (canon-adjacent flashback)*

*Arc blurb (114 chars):* "Years before Team 7, Kakashi serves in the Anbu Black Ops — and Danzo sends a Wood Style user after his Sharingan."  
*Stage theme today:* sky #1e293b → #475569, far #0f172a, ground #334155, accent #94a3b8 (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 89 | Hashirama's Cells | 351 | survive 40s | Foundation Operative, Foundation Operative, Foundation Operative (+10s) | forced: kakashi; banned: kakashi_mangekyo, yamato | "Kakashi, disguised as the Third Hokage, walks into a Foundation ambush. Hold for 40 seconds." | blurb only (92 chars, narrative); no intro/outro scene |
| 90 | Orochimaru's Test Subject | 353 | defeatAll | Gotta | forced: kakashi; banned: kakashi_mangekyo, yamato | "Gotta of the Iburi clan wants Yukimi back. His smoke body heals from every hit it lands." | blurb only (88 chars, narrative); no intro/outro scene |
| 91 | The Targeted Sharingan | 355 | defeatBoss | Kinoe 👑 | forced: kakashi; banned: kakashi_mangekyo, yamato | "Kinoe has orders to take the Sharingan. Wood clones, a domed wall, and a prison of pillars." | blurb only (91 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part II · Arc 16: Birth of the Ten-Tails' Jinchuriki (episodes 378–393, 414–431)

*Arc blurb (112 chars):* "Obito seals the Ten-Tails inside himself. Then Madara is truly revived, and only one ninja can keep up with him."  
*Stage theme today:* sky #3f3f46 → #a1a1aa, far #27272a, ground #52525b, accent #e4e4e7 (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 92 | The Ten Tails' Jinchuriki | 378–379 | survive 45s | Obito Uchiha (Ten-Tails Jinchuriki) | forced: hashirama, minato; banned: obito | "Fight as the reanimated Hokage. Obito tears through their barrier — survive 45 seconds." | blurb only (87 chars, narrative); no intro/outro scene |
| 93 | Obito Uchiha | 383–385 | defeatBoss | Obito Uchiha (Ten-Tails Jinchuriki) 👑 | banned: obito; recommended: naruto_sage, sasuke_ems, minato | "Naruto and Sasuke, side by side, break Obito's Truth-Seeking Balls." | blurb only (67 chars, narrative); no intro/outro scene; no boss pre-fight exchange |
| 94 | The Blue Beast vs. Six Paths Madara | 418 | defeatAll | Madara Uchiha | forced: guy; banned: guy_eightgates, madara | "Guy opens the Seventh Gate against Madara. It is not enough." | blurb only (60 chars, narrative); no intro/outro scene |
| 95 | The Eight Inner Gates Formation | 419–420 | defeatBoss | Madara Uchiha 👑 | forced: guy_eightgates; banned: guy, madara | "The Eighth Gate: Night Guy. Madara will admit no one ever pushed him this far." | blurb only (78 chars, narrative); no intro/outro scene; no boss pre-fight exchange |

#### Part II · Arc 17: Kaguya Otsutsuki Strikes (episodes 458–479)

*Arc blurb (122 chars):* "Black Zetsu revives Kaguya, the mother of chakra. Team 7 has to seal her — and then Naruto and Sasuke have one fight left."  
*Stage theme today:* sky #312e81 → #c4b5fd, far #2e1065, ground #4c1d95, accent #e9d5ff (one generic hills-and-trees background).  
*Dialogue today:* none. The arc blurb is the only arc-level text: no opener, no closer.

| # | Node | Episodes | Objective | Enemies | Team rule | Blurb (the only text today) | Dialogue status |
|---|---|---|---|---|---|---|---|
| 96 | She of the Beginning | 459 | survive 45s | Kaguya Otsutsuki | recommended: naruto_sixpaths, sasuke_ems, sakura_hundred, kakashi_mangekyo | "Kaguya shifts Team 7 between dimensions — lava, ice, desert. Survive 45 seconds." | blurb only (80 chars, narrative); no intro/outro scene |
| 97 | The Sharingan Revived | 470–473 | defeatBoss | Kaguya Otsutsuki 👑 | recommended: naruto_sixpaths, sasuke_ems, sakura_hundred, kakashi_mangekyo | "Every dimension changes her nature. Keep a counter for each, and seal her." | blurb only (74 chars, mechanical); no intro/outro scene; no boss pre-fight exchange |
| 98 | The Final Battle | 475–476 | defeatAll | Sasuke Uchiha (Rinnegan) | banned: sasuke, sasuke_cursemark, sasuke_ems; recommended: naruto_sixpaths | "At the Valley of the End, Sasuke tells Naruto what he means to do. They start with fists." | blurb only (89 chars, narrative); no intro/outro scene |
| 99 | Naruto and Sasuke | 477–478 | defeatBoss | Sasuke Uchiha (Rinnegan) 👑 | banned: sasuke, sasuke_cursemark, sasuke_ems; recommended: naruto_sixpaths, sakura_hundred, kakashi_mangekyo | "Indra's Arrow against a Rasen Shuriken. The last fight of the story." | blurb only (68 chars, mechanical); no intro/outro scene; no boss pre-fight exchange |

## 5. Effects: every jutsu and skill that needs VFX

### 5.1 What the battle draws today, event by event (`Effects.onEvents`)

`BattleSim` emits 29 typed events (each stamped with `t`, the battle time), drained once per running frame by `BattleScreen._loop` and handed to `Effects.onEvents` and `_sounds`. `Effects` turns them into at most 260 live items of five primitive kinds (text, ring, spark, projectile, beam) plus one announcer line. Every item is a plain canvas shape; nothing depends on the nature beyond the colour. The fields each event carries (what a VFX or audio handler can key on; `sim.unit(uid)` adds `side`, `isBoss`, `isAdd`, `protected`, `role`, `natures`, `activeNature`):

| Event | Fields | Notes |
|---|---|---|
| `start` | — | delayed by the start coach tip (`tipPause`), so `BattleScreen.open` is the reliable battle-start hook |
| `spawn` | uid | initial units at t = 0 (every boss in the content spawns at t = 0), delayed waves (15 nodes), summoned adds |
| `attack` | uid, target | |
| `miss` | uid (target), src | 5 % dodge |
| `damage` | uid, src, amount, crit, relation (−1/0/1), nature, kind (`auto`/`ult`/`special`/`reflect`), absorbed | |
| `heal` | uid, amount, src | heal Ultimates and lifesteal; boss `regen` heals silently (no event) |
| `ultReady` | uid | player units only; **not emitted when a unit starts with full chakra** (lesson 3, Boss Rush carry-over) |
| `ult` | uid, name, ultType (`single`/`aoe`/`taunt`/`heal`/`buff`), nature | fires exactly once per Ultimate: the natural hook for signature effects and sounds |
| `buff`, `stun` (uid, seconds), `immune` | uid | the Overpower stun on the caster emits no `stun` event |
| `telegraph` | id, uid, name, nature, windup, special (boss) | |
| `telegraphEnd` | id, uid, reason (`landed`/`overpower`/`standoff`/`overwhelmed`/`interrupted`) | nothing drawn today |
| `jutsuLand` | uid, name, nature, targets[] | |
| `clash` | uid, caster, outcome, name, nature | |
| `aoe` | uid, x, radius | |
| `shake` | amount, seconds | |
| `death` | uid | ally / enemy / add / boss / escort must be told apart by the unit |
| `revive`, `enrage`, `rally` | uid, name | |
| `shield` (uid, name, amount), `shieldBreak`, `shieldEnd` | uid | |
| `swap` | uid, nature, name | |
| `reflectWarn` (uid, name, windup), `reflect` (uid, name, seconds) | | |
| `summon` | uid, name, count | |
| `end` | state (`won`/`lost`), reason (`defeated`/`protectFailed`/`survived`/`defeatAll`/`bossDown`/`timeout`) | Retreat and Boss Rush "Take the rewards" set `sim.state` directly and emit no `end` |

| Event | Drawn today | What the pass needs |
|---|---|---|
| `attack` (range > 150) | a 5 px glowing dot arcing to the target in 0.22 s | per-nature projectile (kunai/senbon for neutral, fire bolt, wind blade, lightning arc, rock, water shot) |
| `damage` | floating number (20 px; crit 27 px ✦; ult/special 30 px) tinted by matchup; "EFFECTIVE!" / "resisted" tags throttled 0.7 s per unit; sparks on crit/ult/special; "(N absorbed)" | per-nature impact burst at the hit point; hit-stop or flash per nature; keep numbers readable on a phone |
| `heal` | "+N" green text | healing glow (green chakra motes rising, Sakura/Tsunade style) |
| `miss` | "miss" text | a dodge blur / Substitution log for enemies with `Substitution Jutsu` |
| `ultReady` | (portrait glow in the DOM only) | a chakra flare on the unit + portrait pulse |
| `ult` | two rings (nature colour r 150, white r 90), 18 sparks, announcer "Short: Ultimate name!", shake | **a signature effect per Ultimate** (§5.3) with a nature default; a cut-in or name card |
| `buff` | nothing (an aura appears while `atkBuff` is active) | buff cast effect (Jiraiya's Summoning, Chiyo's puppets) |
| `stun` / `immune` | "STUNNED" / "immune" text, orbiting stars | proper stun state art |
| `telegraph` | the ⚠ banner + ground rings (Renderer) + announcer for boss specials | per-nature charge-up on the caster, targets highlighted in the nature's look |
| `jutsuLand` | sparks on each target, shake 6 | the enemy jutsu's own effect (§5.3 enemy jutsu) |
| `clash` | a two-colour beam between clasher and caster, a big ring, 32 sparks, announcer "JUTSU CLASH — OVERPOWER! / STANDOFF / OVERWHELMED", shake 12 | the centrepiece: a readable two-sided beam struggle with the nature colours, a slow-mo beat, and an outcome readout big enough for a phone (the brief calls this out) |
| `aoe` | a white ground ring of the AoE radius | nature-styled area effect |
| `death` | grey sparks + ground ring, the unit fades and sinks 0.6 s | KO animation (fall, dissolve, or a puff of smoke for clones) and a boss KO ceremony |
| `revive` | gold ring + announcer | a revive flash per mechanic name (Substitution log, Curse Mark, Izanagi, Six Paths of Pain) |
| `shield` / `shieldBreak` / `shieldEnd` | blue ring, bubble while active, "SHIELD BROKEN" text | shield per name (Sand Shield, Susanoo, Hidden Mist, Kamui, Truth-Seeking Ball…) and a break |
| `enrage` | red ring, red aura, announcer, shake | enrage per name (Curse Mark, Tailed Beast chakra, Thunder Armour, Play Possum) |
| `swap` | ring in the new nature + announcer "X → Water Style (name)" | element-change flourish (Kakuzu's hearts, Kaguya's dimensions, Aoi's sword) |
| `reflectWarn` / `reflect` | announcer "hold your attacks!", white hexagon, white ring | reflect stance per name (Palm Rotation, Jade Crystal Mirror, Almighty Push, Yomotsu Hirasaka) |
| `summon` | announcer | summon puff and the add's entrance |
| `rally` | announcer | a buff pulse on allies |
| `shake` | canvas shake (does **not** honour `prefers-reduced-motion` yet; CSS does) | keep, gate by the setting |
| `start` / `end` | nothing | battle start ("Ready… Fight!"), objective banner, victory/defeat moment before the results dialog |

Also missing entirely: **boss intros** (the brief's boss intro treatment), a **battle-start** sequence, a **level-up / star-up** flourish on the Roster, a **claim** flourish on Achievements, and any **era-specific** look.

### 5.2 Grouped by nature type

The 269 distinct named techniques below are every Ultimate, every telegraphed enemy jutsu and every boss mechanic in the data, grouped by the nature the effect should read as (the technique's own nature, else the caster's first nature, else neutral). The VFX system should key on **nature + kind** (ultimate single/aoe/taunt/heal/buff; enemy jutsu single/aoe; each mechanic type) so every one of these has a good default, and then take **named overrides** for the signatures in §5.3.

#### Fire — 55 distinct effects

| Kind | Technique (dub name) | Used by |
|---|---|---|
| Boss mechanic · elementSwap [Fire→Water→Earth] | Amenominaka | Kaguya Otsutsuki |
| Boss mechanic · enrage | Heavens' Curse Mark | Sasuke Uchiha |
| Boss mechanic · enrage | Inferno Style: Flame Control | Sasuke Uchiha, Sasuke Uchiha (Rinnegan) |
| Boss mechanic · enrage | Six Paths Sage Jutsu | Madara Uchiha |
| Boss mechanic · enrage | Tailed Beast Chakra Arms | Nine-Tails |
| Boss mechanic · lifesteal | Reaper Kiss | Fuka |
| Boss mechanic · reflect | Eight Trigrams: Palm Rotation | Neji Hyuga |
| Boss mechanic · reflect | Yomotsu Hirasaka | Kaguya Otsutsuki |
| Boss mechanic · regen | Six Paths Sage Jutsu | Obito Uchiha (Ten-Tails Jinchuriki) |
| Boss mechanic · regen | Summoning Jutsu: Reanimation | Madara Uchiha (Reanimated) |
| Boss mechanic · reviveOnce | Heavens' Curse Mark | Sasuke Uchiha (Heavens' Curse Mark) |
| Boss mechanic · reviveOnce | Izanagi | Tobi |
| Boss mechanic · reviveOnce | Six Paths of Pain | Pain |
| Boss mechanic · shieldPhase | Kamui | Tobi, Obito Uchiha |
| Boss mechanic · shieldPhase | Susanoo | Itachi Uchiha, Sasuke Uchiha, Sasuke Uchiha (Rinnegan) |
| Boss mechanic · shieldPhase | Truth-Seeking Ball | Obito Uchiha (Ten-Tails Jinchuriki), Madara Uchiha |
| Boss mechanic · summonAdds | Crow Clone Jutsu | Itachi Uchiha |
| Boss mechanic · summonAdds | Multi-Smoke Clone | Kigiri |
| Boss mechanic · summonAdds | Shadow Clone Jutsu | Itachi Uchiha |
| Boss mechanic · telegraphAoE @all | Almighty Push | Pain |
| Boss mechanic · telegraphAoE @all | Expansive Truth-Seeking Ball | Kaguya Otsutsuki |
| Boss mechanic · telegraphAoE @all | Fire Style: Fireball Jutsu | Tobi |
| Boss mechanic · telegraphAoE @all | Fire Style: Searing Migraine | Kakuzu |
| Boss mechanic · telegraphAoE @all | Limbo: Hengoku | Madara Uchiha |
| Boss mechanic · telegraphAoE @all | Tailed Beast Bomb | Nine-Tails, Obito Uchiha (Ten-Tails Jinchuriki) |
| Boss mechanic · telegraphAoE @all | Tengai Shinsei | Madara Uchiha (Reanimated) |
| Boss mechanic · telegraphAoE @back | Amaterasu | Itachi Uchiha, Sasuke Uchiha |
| Boss mechanic · telegraphAoE @front | Gentle Fist Art: Eight Trigrams Sixty-Four Palms | Neji Hyuga |
| Boss mechanic · telegraphAoE @random | Tsukuyomi | Itachi Uchiha |
| Enemy jutsu · aoe (telegraphed) | Exploding Flame Shot | Kigiri |
| Enemy jutsu · aoe (telegraphed) | Fire Style: Burning Ash | Asuma Sarutobi (Reanimated) |
| Enemy jutsu · aoe (telegraphed) | Fire Style: Fireball Jutsu | Itachi Uchiha, Obito Uchiha |
| Enemy jutsu · aoe (telegraphed) | Fire Style: Majestic Destroyer Flame | Madara Uchiha (Reanimated) |
| Enemy jutsu · aoe (telegraphed) | Fire Style: Phoenix Flower Jutsu | Sasuke Uchiha (Heavens' Curse Mark), Fuka |
| Enemy jutsu · aoe (telegraphed) | Fire Style: Searing Migraine | Masked Beast |
| Enemy jutsu · aoe (telegraphed) | Tailed Beast Bomb | Four-Tails |
| Enemy jutsu · aoe (telegraphed) | Truth-Seeking Ball | Madara Uchiha |
| Enemy jutsu · single (telegraphed) | All-Killing Ash Bones | Kaguya Otsutsuki |
| Enemy jutsu · single (telegraphed) | Amaterasu | Sasuke Uchiha, Sasuke Uchiha (Rinnegan) |
| Enemy jutsu · single (telegraphed) | Eighty Gods Vacuum Attack | Kaguya Otsutsuki |
| Enemy jutsu · single (telegraphed) | Gentle Fist | Neji Hyuga, Neji Hyuga (Clone) |
| Enemy jutsu · single (telegraphed) | Kamui | Tobi |
| Enemy jutsu · single (telegraphed) | Truth-Seeking Ball | Obito Uchiha (Ten-Tails Jinchuriki), Madara Uchiha |
| Ultimate · aoe | Fire Style: Majestic Destroyer Flame | Madara |
| Ultimate · aoe | Inferno Style: Flame Control | Sasuke★★ |
| Ultimate · aoe | Lava Style: Lava Monster Jutsu | Mei |
| Ultimate · buff | Summoning Jutsu | Jiraiya |
| Ultimate · single | Flying Raijin Jutsu | Minato |
| Ultimate · single | Rasengan | Konohamaru |
| Ultimate · single + stun | Demonic Illusion: Death Mirage Jutsu | Iruka |
| Ultimate · single + stun | Gentle Fist Art: Eight Trigrams Sixty-Four Palms | Neji |
| Ultimate · single + stun | Sealing Jutsu: Reaper Death Seal | Hiruzen |
| Ultimate · single + stun | Shadow Possession Jutsu | Shikamaru |
| Ultimate · single + stun | Tsukuyomi | Itachi |
| Ultimate · taunt | Protective Eight Trigrams Sixty-Four Palms | Hinata |

#### Wind — 35 distinct effects

| Kind | Technique (dub name) | Used by |
|---|---|---|
| Boss mechanic · enrage | Play Possum Jutsu | Gaara |
| Boss mechanic · enrage | Sage Transformation | Jugo |
| Boss mechanic · enrage | Tailed Beast Chakra Arms | Sora |
| Boss mechanic · regen | Summoning Jutsu: Reanimation | Asuma Sarutobi (Reanimated) |
| Boss mechanic · reviveOnce | Izanagi | Danzo Shimura |
| Boss mechanic · reviveOnce | Orochimaru Style: Substitution Jutsu | Orochimaru |
| Boss mechanic · shieldPhase | Dance of the Shikigami | Konan |
| Boss mechanic · shieldPhase | Sand Shield | Gaara |
| Boss mechanic · summonAdds | Earth Style Ultimate Revival Jutsu: Soil Bodies | Kazuma |
| Boss mechanic · summonAdds | Summoning Jutsu | Orochimaru |
| Boss mechanic · telegraphAoE @all | Wind Style: Air Bullet | Gaara |
| Boss mechanic · telegraphAoE @all | Wind Style: Vacuum Bullets | Danzo Shimura |
| Boss mechanic · telegraphAoE @front | Flying Swallow | Asuma Sarutobi (Reanimated) |
| Boss mechanic · telegraphAoE @front | Striking Shadow Snakes | Orochimaru |
| Enemy jutsu · aoe (telegraphed) | Beast Wave Gale Palm | Sora |
| Enemy jutsu · aoe (telegraphed) | Ninja Art: Wind Scythe Jutsu | Temari |
| Enemy jutsu · aoe (telegraphed) | Paper Shuriken | Konan |
| Enemy jutsu · aoe (telegraphed) | Wind Style: Great Breakthrough | Orochimaru |
| Enemy jutsu · aoe (telegraphed) | Wind Style: Pressure Damage | Kakuzu |
| Enemy jutsu · single (telegraphed) | Flying Swallow | Kazuma |
| Enemy jutsu · single (telegraphed) | Puppet Master Jutsu | Kankuro |
| Enemy jutsu · single (telegraphed) | Sand Coffin | Gaara |
| Enemy jutsu · single (telegraphed) | Sword of Kusanagi | Orochimaru |
| Ultimate · aoe | Flying Swallow | Asuma |
| Ultimate · aoe | Ninja Art: Wind Scythe Jutsu | Temari |
| Ultimate · aoe | Planet Rasengan | Chakra Mode |
| Ultimate · aoe | Sacred Paper Emissary Jutsu | Konan |
| Ultimate · aoe | Sage Art: Super Tailed Beast Rasen-Shuriken | Naruto★★ |
| Ultimate · aoe | Wind Style: Rasen Shuriken | Sage Naruto |
| Ultimate · single | Rasengan | Naruto, Naruto★ |
| Ultimate · single | Striking Shadow Snakes | Orochimaru |
| Ultimate · taunt | Puppet Master Jutsu | Kankuro |
| Ultimate · taunt | Sage Transformation | Jugo |
| Ultimate · taunt | Sand Shield | Gaara |
| Ultimate · taunt | Ultimate Defence: Shukaku's Shield | Kazekage |

#### Lightning — 26 distinct effects

| Kind | Technique (dub name) | Used by |
|---|---|---|
| Boss mechanic · enrage | Ninja Art: Thunder Armour | Raiga Kurosuki |
| Boss mechanic · enrage | Tailed Beast Chakra Arms | Killer Bee |
| Boss mechanic · reviveOnce | Substitution Jutsu | Kakashi Hatake |
| Boss mechanic · shieldPhase | Ninja Art: Hidden Mist Jutsu | Raiga Kurosuki |
| Boss mechanic · summonAdds | Kurosuki Family ambush | Raiga Kurosuki |
| Boss mechanic · telegraphAoE @all | Chidori Stream | Sasuke Uchiha |
| Boss mechanic · telegraphAoE @all | Indra's Arrow | Sasuke Uchiha (Rinnegan) |
| Boss mechanic · telegraphAoE @all | Thunder Funeral: Feast of Lightning | Raiga Kurosuki |
| Boss mechanic · telegraphAoE @front | Blade of the Thunder Spirit | Aoi Rokusho |
| Boss mechanic · telegraphAoE @front | Chidori | Sasuke Uchiha (Heavens' Curse Mark) |
| Enemy jutsu · single (telegraphed) | Chidori | Sasuke Uchiha, Sasuke Uchiha (Rinnegan) |
| Enemy jutsu · single (telegraphed) | Chidori Sharp Spear | Sasuke Uchiha |
| Enemy jutsu · single (telegraphed) | Heaven Kick of Pain | Tsunade |
| Enemy jutsu · single (telegraphed) | Lariat | Killer Bee |
| Enemy jutsu · single (telegraphed) | Lightning Blade | Kakashi Hatake |
| Enemy jutsu · single (telegraphed) | Lightning Style: False Darkness | Kakuzu |
| Enemy jutsu · single (telegraphed) | Ninja Art: Lightning Ball | Raiga Kurosuki |
| Enemy jutsu · single (telegraphed) | Ninja Art: Lightning Fangs | Raiga Kurosuki |
| Ultimate · aoe | Gale Style: Laser Circus | Darui |
| Ultimate · aoe | Tailed Beast Bomb | Killer Bee |
| Ultimate · heal | Ninja Art: Mitotic Regeneration | Tsunade |
| Ultimate · single | Chidori | Sasuke, Sasuke★ |
| Ultimate · single | Cloud Style: Crescent Moon Slice | Omoi |
| Ultimate · single | Lightning Blade | Kakashi |
| Ultimate · single + stun | Kamui | Kakashi★ |
| Ultimate · single + stun | Liger Bomb | Ay |

#### Earth — 61 distinct effects

| Kind | Technique (dub name) | Used by |
|---|---|---|
| Boss mechanic · elementSwap [Earth→Lightning] | Explosion Style | Deidara |
| Boss mechanic · elementSwap [Earth→Water→Fire→Wind→Lightning] | Earth Grudge | Kakuzu |
| Boss mechanic · enrage | C0 | Deidara |
| Boss mechanic · lifesteal | Chakra absorption | Jirobo |
| Boss mechanic · reflect | Crystal Style: Jade Crystal Mirror | Guren |
| Boss mechanic · regen | Healing Jutsu | Kabuto Yakushi, Kabuto Yakushi (Sage Mode) |
| Boss mechanic · reviveOnce | Clay Clone | Deidara |
| Boss mechanic · reviveOnce | Earth Grudge | Kakuzu |
| Boss mechanic · reviveOnce | Substitution Jutsu | Kakashi Hatake |
| Boss mechanic · shieldPhase | Earth Style: Iron Skin | Kakuzu |
| Boss mechanic · shieldPhase | Rock Armour | Fudo |
| Boss mechanic · shieldPhase | Transparency Jutsu | Mu (Reanimated) |
| Boss mechanic · shieldPhase | Wood Style: Domed Wall Jutsu | Kinoe |
| Boss mechanic · summonAdds | C1 | Deidara |
| Boss mechanic · summonAdds | C2 Dragon | Deidara |
| Boss mechanic · summonAdds | Demon Twin Jutsu | Kabuto Yakushi (Sage Mode) |
| Boss mechanic · summonAdds | Earth Grudge | Kakuzu |
| Boss mechanic · summonAdds | Fragmentation | Mu (Reanimated) |
| Boss mechanic · summonAdds | Misty Follower Jutsu | Oboro |
| Boss mechanic · summonAdds | Wood Style: Wood Clone Jutsu | Yamato, Kinoe |
| Boss mechanic · telegraphAoE @all | C3 | Deidara |
| Boss mechanic · telegraphAoE @all | C4 Karura | Deidara |
| Boss mechanic · telegraphAoE @all | Crystal Style: Burst Crystal Falling Dragon | Guren |
| Boss mechanic · telegraphAoE @all | Sage Art: Inorganic Animation | Kabuto Yakushi (Sage Mode) |
| Boss mechanic · telegraphAoE @all | Wood Style: Cutting Sprigs Jutsu | Obito Uchiha |
| Boss mechanic · telegraphAoE @back | Earth Style: Hidden in Stones Jutsu | Kazuma |
| Boss mechanic · telegraphAoE @front | Particle Style: Atomic Dismantling Jutsu | Mu (Reanimated) |
| Boss mechanic · telegraphAoE @front | Wood Style: Four Pillar House Jutsu | Kinoe |
| Boss mechanic · telegraphAoE @random | C1 | Deidara |
| Boss mechanic · telegraphAoE @random | Demonic Illusion: Death Mirage Jutsu | Kakashi Hatake |
| Boss mechanic · telegraphAoE @random | Earth Style: Underground Move Jutsu | Mizuki |
| Enemy jutsu · aoe (telegraphed) | C1 | Deidara |
| Enemy jutsu · aoe (telegraphed) | Earth Style Barrier: Earth Dome Prison | Jirobo |
| Enemy jutsu · aoe (telegraphed) | Earth Style: Earthquake Slam | Fudo |
| Enemy jutsu · aoe (telegraphed) | Sage Art: White Extreme Attack | Kabuto Yakushi (Sage Mode) |
| Enemy jutsu · aoe (telegraphed) | Wood Style: Deep Forest Emergence | Hashirama Senju (Reanimated) |
| Enemy jutsu · single (telegraphed) | C1 | Deidara |
| Enemy jutsu · single (telegraphed) | Chakra Scalpel | Kabuto Yakushi |
| Enemy jutsu · single (telegraphed) | Crystal Style: Jade Crystal Mirror | Guren |
| Enemy jutsu · single (telegraphed) | Demon Wind Shuriken: Windmill of Shadows | Mizuki |
| Enemy jutsu · single (telegraphed) | Earth Style: Headhunter Jutsu | Kakashi Hatake |
| Enemy jutsu · single (telegraphed) | Earth Style: Underground Move Jutsu | Mubi |
| Enemy jutsu · single (telegraphed) | Leaf Village Secret Finger Jutsu: One Thousand Years of Death | Kakashi Hatake |
| Enemy jutsu · single (telegraphed) | Wood Style: Four Pillar Prison Jutsu | Yamato, Kinoe |
| Ultimate · aoe | C4 Karura | Deidara |
| Ultimate · aoe | Ninja Art: Super Beast Scroll | Sai |
| Ultimate · aoe | Parasitic Insects Jutsu | Shino |
| Ultimate · aoe | Wood Style: Cutting Sprigs Jutsu | Obito |
| Ultimate · heal | Heal Bite | Karin |
| Ultimate · heal | Healing Jutsu | Sakura |
| Ultimate · heal | Mitotic Regeneration: The Hundred Healings | Sakura★ |
| Ultimate · single | Chakra Scalpel | Kabuto |
| Ultimate · single | Man-Beast Ultimate Taijutsu: Fang Over Fang | Kiba |
| Ultimate · single | Particle Style: Atomic Dismantling Jutsu | Onoki |
| Ultimate · single + stun | Lava Style: Quicklime Jutsu | Kurotsuchi |
| Ultimate · single + stun | Ninja Art: Mind Transfer Jutsu | Ino |
| Ultimate · taunt | Earth Style Barrier: Earth Dome Prison | Jirobo |
| Ultimate · taunt | Earth Style: Iron Skin | Kakuzu |
| Ultimate · taunt | Human Boulder | Choji |
| Ultimate · taunt | Wood Style: Four Pillar Prison Jutsu | Yamato |
| Ultimate · taunt | Wood Style: Wood Dragon Jutsu | Hashirama |

#### Water — 40 distinct effects

| Kind | Technique (dub name) | Used by |
|---|---|---|
| Boss mechanic · elementSwap [Water→Lightning] | Blade of the Thunder Spirit | Aoi Rokusho |
| Boss mechanic · elementSwap [Water→Wind] | Ice Style | Haku |
| Boss mechanic · enrage | Demon of the Hidden Mist | Zabuza Momochi |
| Boss mechanic · enrage | The Rampaging Tailed Beast | Three-Tails |
| Boss mechanic · lifesteal | Chakra absorption | Yoroi Akado, Pain (Gakido) |
| Boss mechanic · lifesteal | Shark Skin | Kisame Hoshigaki |
| Boss mechanic · reflect | Almighty Push | Pain (Tendo), Nagato (Reanimated) |
| Boss mechanic · regen | King of Hell | Pain (Jigokudo), Nagato (Reanimated) |
| Boss mechanic · regen | Summoning Jutsu: Reanimation | Zabuza Momochi (Reanimated), Haku (Reanimated) |
| Boss mechanic · reviveOnce | Six Paths of Pain | Pain |
| Boss mechanic · shieldPhase | Ninja Art: Hidden Mist Jutsu | Zabuza Momochi, Zabuza Momochi (Reanimated) |
| Boss mechanic · shieldPhase | Water Style: Water Wall | Tobirama Senju (Reanimated) |
| Boss mechanic · summonAdds | Summoning Jutsu | Pain (Chikushodo), Pain |
| Boss mechanic · summonAdds | Water Clone Jutsu | Zabuza Momochi |
| Boss mechanic · telegraphAoE @all | Almighty Push | Pain (Tendo) |
| Boss mechanic · telegraphAoE @all | Planetary Devastation | Pain (Tendo), Nagato (Reanimated) |
| Boss mechanic · telegraphAoE @all | Tailed Beast Bomb | Three-Tails |
| Boss mechanic · telegraphAoE @all | Water Style: Super Shark Bomb Jutsu | Kisame Hoshigaki |
| Boss mechanic · telegraphAoE @all | Water Style: Water Dragon Jutsu | Zabuza Momochi |
| Boss mechanic · telegraphAoE @all | Water Style: Water Shark Bomb Jutsu | Kisame Hoshigaki |
| Boss mechanic · telegraphAoE @front | Asura Attack | Pain |
| Enemy jutsu · aoe (telegraphed) | Asura Attack | Pain (Shurado) |
| Enemy jutsu · aoe (telegraphed) | Ninja Art: Senbon Rainstorm | Aoi Rokusho |
| Enemy jutsu · aoe (telegraphed) | Secret Jutsu: Crystal Ice Mirrors | Haku, Haku (Reanimated) |
| Enemy jutsu · aoe (telegraphed) | Water Prison Shark Dance Jutsu | Kisame Hoshigaki |
| Enemy jutsu · aoe (telegraphed) | Water Style: Black Rain Jutsu | Kagari |
| Enemy jutsu · aoe (telegraphed) | Water Style: Exploding Water Shock Wave | Kisame Hoshigaki |
| Enemy jutsu · aoe (telegraphed) | Water Style: Thousand Hungry Sharks | Kisame Hoshigaki |
| Enemy jutsu · aoe (telegraphed) | Water Style: Water Shark Bomb Jutsu | Kisame Hoshigaki |
| Enemy jutsu · single (telegraphed) | Silent Killing | Zabuza Momochi (Reanimated) |
| Enemy jutsu · single (telegraphed) | Soft Physique Modification | Misumi Tsurugi |
| Enemy jutsu · single (telegraphed) | Sticky Water | Nurari |
| Enemy jutsu · single (telegraphed) | Universal Pull | Pain, Pain (Tendo), Nagato (Reanimated) |
| Enemy jutsu · single (telegraphed) | Water Prison Jutsu | Zabuza Momochi |
| Ultimate · aoe | Hiramekarei | Chojuro |
| Ultimate · aoe | Secret Jutsu: Crystal Ice Mirrors | Haku |
| Ultimate · aoe | Water Style: Super Shark Bomb Jutsu | Kisame |
| Ultimate · aoe | Water Style: Water Dragon Jutsu | Zabuza |
| Ultimate · aoe + stun | Almighty Push | Pain |
| Ultimate · single | Water Style: Great Water Arm | Suigetsu |

#### Taijutsu — 3 distinct effects

| Kind | Technique (dub name) | Used by |
|---|---|---|
| Ultimate · single | Dynamic Entry | Guy |
| Ultimate · single | Night Guy | Guy★ |
| Ultimate · single | Primary Lotus | Lee |

#### No nature (neutral) — 49 distinct effects

| Kind | Technique (dub name) | Used by |
|---|---|---|
| Boss mechanic · enrage | Heavens' Curse Mark | Kimimaro |
| Boss mechanic · enrage | Lariat | Eight-Tails |
| Boss mechanic · enrage | Nine-Tails | Kinkaku |
| Boss mechanic · lifesteal | (unnamed) | Gotta |
| Boss mechanic · rally | Ranmaru's eyes guide Raiga | Ranmaru |
| Boss mechanic · reflect | Larch Dance | Kimimaro |
| Boss mechanic · reviveOnce | Immortality | Hidan |
| Boss mechanic · shieldPhase | Chameleon Jutsu | Shiranami |
| Boss mechanic · shieldPhase | Hiruko | Sasori |
| Boss mechanic · shieldPhase | Summoning Jutsu: Rashomon | Sakon and Ukon |
| Boss mechanic · summonAdds | Demon Flute: Trio Requiem | Tayuya |
| Boss mechanic · summonAdds | Demon Twin Jutsu | Sakon and Ukon |
| Boss mechanic · summonAdds | Fury Jutsu | Shiranami |
| Boss mechanic · summonAdds | Secret Red Move: Performance of a Hundred Puppets | Sasori |
| Boss mechanic · telegraphAoE @all | Bracken Dance | Kimimaro |
| Boss mechanic · telegraphAoE @all | Iron Sand: World Order | Sasori |
| Boss mechanic · telegraphAoE @all | Tailed Beast Bomb | Eight-Tails |
| Boss mechanic · telegraphAoE @all | Tsuchigumo Style: Forbidden Jutsu Release: Big Bang | Shiranami |
| Boss mechanic · telegraphAoE @front | Iron Sand Gathering | Sasori |
| Boss mechanic · telegraphAoE @random | Curse Jutsu | Hidan |
| Enemy jutsu · aoe (telegraphed) | Demon Flute: Chains of Fantasia | Tayuya |
| Enemy jutsu · aoe (telegraphed) | Ink Creation | Eight-Tails |
| Enemy jutsu · aoe (telegraphed) | Iron Sand: Scattered Showers | Sasori |
| Enemy jutsu · aoe (telegraphed) | Leaf Fan | Kinkaku |
| Enemy jutsu · aoe (telegraphed) | Ninja Art: Black Tornado | Kurosuki Family Member |
| Enemy jutsu · aoe (telegraphed) | Rising Twin Dragons | Tenten (Clone) |
| Enemy jutsu · aoe (telegraphed) | Supersonic Slicing Wave | Zaku Abumi |
| Enemy jutsu · single (telegraphed) | Amber Purification Jar | Ginkaku |
| Enemy jutsu · single (telegraphed) | Clematis Dance: Flower | Kimimaro |
| Enemy jutsu · single (telegraphed) | Coiling Around | Manda |
| Enemy jutsu · single (telegraphed) | Dynamic Entry | Might Guy (Clone) |
| Enemy jutsu · single (telegraphed) | Iaido | Zori, Waraji |
| Enemy jutsu · single (telegraphed) | Multiple Fists Barrage | Sakon and Ukon |
| Enemy jutsu · single (telegraphed) | Primary Lotus | Rock Lee (Clone) |
| Enemy jutsu · single (telegraphed) | Resonating Echo Drill | Dosu Kinuta |
| Enemy jutsu · single (telegraphed) | Shadow Senbon | Kin Tsuchi |
| Enemy jutsu · single (telegraphed) | Spider Bow: Fierce Rip | Kidomaru |
| Enemy jutsu · single (telegraphed) | Triple-Bladed Scythe | Hidan |
| Enemy jutsu · single (telegraphed) | Word Bind Jutsu | Shiranami |
| Ultimate · aoe | Bracken Dance | Kimimaro |
| Ultimate · aoe | Ninja Art: Poison Fog | Shizune |
| Ultimate · aoe | Rising Twin Dragons | Tenten |
| Ultimate · aoe | Secret Red Move: Performance of a Hundred Puppets | Sasori |
| Ultimate · aoe + stun | Demon Flute: Chains of Fantasia | Tayuya |
| Ultimate · buff | Secret White Move: Chikamatsu's 10 Puppets | Chiyo |
| Ultimate · single | Curse Jutsu | Hidan |
| Ultimate · single | Multiple Fists Barrage | Sakon |
| Ultimate · single | Spider Bow: Fierce Rip | Kidomaru |
| Ultimate · single + stun | Tree Bind Death | Kurenai |

### 5.3 Signature techniques that deserve their own effect

These are the techniques a Naruto viewer will recognise on sight; a nature default would undersell them. Each is a named override in the VFX system (the name is the key, so the same effect serves the player's Ultimate and the enemy's version).

| Signature | Users in the data | What it must read as |
|---|---|---|
| Rasengan / Planet Rasengan / Wind Style: Rasen Shuriken / Sage Art: Super Tailed Beast Rasen-Shuriken | Naruto (all forms), Konohamaru | a spinning blue sphere in the palm, a dash, a spiral impact; the shuriken versions thrown with a wind-blade halo |
| Chidori / Lightning Blade / Chidori Stream / Chidori Sharp Spear / Indra's Arrow | Sasuke (all forms), Kakashi | crackling lightning in the hand, a straight thrust, a white-blue flash; Stream = radial arcs; Sharp Spear = a long bolt; Indra's Arrow = a bow-shot |
| Amaterasu | Itachi, Sasuke | black flames with a purple rim that linger on the target |
| Tsukuyomi | Itachi | red-moon genjutsu wash, the target frozen |
| Susanoo | Itachi, Sasuke | a purple/blue ribcage aura as the shield |
| Kamui | Kakashi (Mangekyo), Tobi/Obito | a spiral warp that swallows the hit |
| Water Style: Water Dragon Jutsu / Water Prison / Water Shark Bomb / Super Shark Bomb / Thousand Hungry Sharks / Exploding Water Shock Wave | Zabuza, Kisame | a dragon of water, a sphere prison, shark silhouettes |
| Secret Jutsu: Crystal Ice Mirrors | Haku (and Reanimated) | mirrors of ice around the target, needles from each |
| Sand Coffin / Sand Shield / Ultimate Defence: Shukaku's Shield / Wind Style: Air Bullet | Gaara | sand grains gathering, a sand dome, a raccoon-face shield |
| Eight Trigrams Sixty-Four Palms / Palm Rotation / Protective Sixty-Four Palms / Gentle Fist | Neji, Hinata | the trigram circle on the ground, a blue chakra sphere spin |
| Shadow Possession Jutsu | Shikamaru | a shadow snaking along the ground to the target |
| Primary Lotus / Dynamic Entry / Night Guy / Eight Inner Gates | Lee, Guy | speed lines and a green/red chakra steam; Night Guy = a red fox-shaped burst |
| Striking Shadow Snakes / Sword of Kusanagi / Summoning Jutsu (Manda) | Orochimaru | snakes from the sleeve, a green blade |
| Sealing Jutsu: Reaper Death Seal | Hiruzen | the Reaper silhouette behind the caster |
| Summoning Jutsu (Gamabunta) | Jiraiya | smoke puff, a toad silhouette, the buff |
| Ninja Art: Mitotic Regeneration / The Hundred Healings | Tsunade, Sakura (Hundred Healings) | the forehead seal spreading as black lines, green light |
| C1 / C2 Dragon / C3 / C4 Karura / C0 / Clay Clone | Deidara | white clay birds, a "katsu" flash |
| Hiruko / Iron Sand / Performance of a Hundred Puppets / Chikamatsu's 10 Puppets | Sasori, Chiyo | chakra strings and puppet silhouettes, black iron sand |
| Curse Jutsu / Immortality / Triple-Bladed Scythe | Hidan | a ritual circle, a red scythe |
| Earth Grudge / Fire Style: Searing Migraine / Lightning Style: False Darkness / Earth Style: Iron Skin | Kakuzu | black threads, the masks |
| Almighty Push / Universal Pull / Planetary Devastation / Asura Attack / Six Paths of Pain | Pain, Nagato | a shockwave ring, rubble lifting into a sphere |
| Sacred Paper Emissary / Paper Shuriken / Dance of the Shikigami | Konan | sheets of paper swirling |
| Tailed Beast Bomb / Tailed Beast Chakra Arms / Lariat | Nine-Tails, Eight-Tails, Killer Bee, Three-Tails, Four-Tails, Sora | a black-purple sphere charge, chakra arms |
| Flying Raijin Jutsu | Minato | a yellow flash, the kunai |
| Wood Style: Wood Dragon / Four Pillar Prison / Deep Forest Emergence / Cutting Sprigs / Domed Wall | Hashirama, Yamato, Obito, Kinoe | wood growing from the ground |
| Fire Style: Majestic Destroyer Flame / Fireball Jutsu / Phoenix Flower / Burning Ash | Madara, Itachi, Sasuke, Fuka, Asuma | the classic fireball, a fan of small flames |
| Particle Style: Atomic Dismantling Jutsu | Onoki, Mu | a white cube beam |
| Lava Style: Lava Monster / Quicklime | Mei, Kurotsuchi | glowing lava spray |
| Liger Bomb / Cloud Style: Crescent Moon Slice / Gale Style: Laser Circus | Ay, Omoi, Darui | Raikage's lightning armour, a black-lightning fan |
| Truth-Seeking Ball / Expansive Truth-Seeking Ball / Limbo: Hengoku / Tengai Shinsei | Obito, Madara | black orbs, a meteor |
| All-Killing Ash Bones / Eighty Gods Vacuum Attack / Amenominaka / Yomotsu Hirasaka | Kaguya | bone spears, giant fists, a dimension shift |
| Heavens' Curse Mark (enrage / revive) | Sasuke, Kimimaro | the black flame pattern spreading over the body |
| Substitution Jutsu (revive) | Kakashi, Orochimaru | the log with a puff of smoke — the anime's most famous gag; cheap and instantly readable |
| Multi Shadow Clone Jutsu (tutorial lesson 3's name) | Naruto | worth a cameo effect in the lesson |

Every other technique in §5.2 takes its nature default.

## 6. Audio: every place a sound or music cue should fire

### 6.1 What exists (`js/audio/AudioManager.js`)

A 15-call oscillator/noise synth, no files. The context is created on the first `pointerdown` / `keydown` / `touchstart` (mobile autoplay unlock), master gain 0.5, `setMuted` ramps the master to 0. There is **one bus**: `settings.music` and `settings.sfx` are saved but not read. Rate limits (`_throttle`) keep 30 hits in a frame from clipping.

| Call | Sound today | Called from |
|---|---|---|
| `hit`, `crit`, `effective`, `resisted` | filtered noise + short tones (55–140 ms throttles) | `BattleScreen._sounds` on `damage` events |
| `ultReady` | two sine pings | `_sounds` on `ultReady` |
| `ultFire` | noise sweep + saw rise + sub thump | portrait tap and Auto-ult |
| `clash(outcome)` | three-note square chord (rising for Overpower, flat for Standoff, falling for Overwhelmed) + noise | `_sounds` on `clash` |
| `telegraph` | triangle rise 0.4 s | `_sounds` on `telegraph` |
| `victory`, `defeat` | 4-note arpeggios | battle end, Boss Rush and Daily round clears, ⏭ Skip results |
| `scroll`, `pullReveal(tier)` | noise swoosh; a chord pitched by tier (+0/3/7/12 semitones), Kage adds a high tone and shimmer | Summon animation |
| `click` | 40 ms sine | tab bar and 🏆 only |
| `levelUp` | triangle rise | Roster level-up |
| `achievement` | 4-note arpeggio | unlock toast and claim |

### 6.2 Music: nothing exists. Where the state must change

| Moment | Owner | Track (proposed slot; Phase 1 decides the list) |
|---|---|---|
| Intro | `Intro.js playIntro` | intro sting (no loop) |
| Start menu | `UIManager.go('start')` | title theme |
| Home / Team / Roster / Wiki / Settings / Achievements | `UIManager.go` | menu theme (one or two, by era of progress?) |
| Story map | `go('story')` | map theme per part |
| Summon screen and the pull ceremony | `go('summon')`, `SummonScreen.playAnimation` | summon theme + Kage sting |
| Battle start | `BattleScreen.open` (knows `node`, `arc`, `hard`, `daily`, `bossRush`) | battle theme per arc or per era; boss theme when the node has a boss; Akatsuki theme in the Boss Rush; Daily/Hard variants? |
| Boss appears / enrages | `spawn` of a boss unit, `enrage` event | switch or intensify |
| Victory / defeat | `BattleScreen._onEnd` | stinger, then the results dialog |
| Boss Rush round clear / intermission | `_rushRoundClear` | keep the rush theme, sting |
| Daily / tutorial lessons | `BattleScreen.open` with `daily` / `tutorial` | Academy theme for the lessons |
| Dialogue scenes (Phase 5) | new | duck the music, per-scene mood |
| Pause | `togglePause` | duck |
| Tab hidden | `visibilitychange` (`hiddenPause`) | pause music |
| Settings → Music switch | `SettingsScreen` (disabled today) | music bus gain; volume sliders do not exist yet |

### 6.3 Sound effects that a finished game plays and this one does not

| Moment | Owner today | Cue |
|---|---|---|
| Any button, chip, toggle, segment, tab (only the tab bar and 🏆 click) | `dom.js btn()`, `toggle()`, `.seg`, `.chip` | UI tap; toggle on/off; back |
| Dialog open / close, confirm / cancel | `UIManager.modal`, `confirm` | open whoosh, close |
| Toast (non-achievement), sticky update toast | `UIManager.toast` | soft ping |
| Tip card show / Got it | `tips.tipCard` | paper flip |
| Screen change | `UIManager.go` | transition swish (era-specific) |
| Story map: node select, arc open, locked tap, Fight!, Skip result | `StoryMapScreen` | select, locked thud, fight start |
| Pre-fight power check low / ready | `StoryMapScreen` | warn / ok |
| Team: slot pick, ninja pick, preset load/save, Auto team | `TeamBuilderScreen` | picks |
| Roster: level up (exists), Level to recommended, Smart spend, star-up on duplicate | `RosterScreen`, `SummonScreen` reveal | fanfare per level burst; star chime |
| Summon: banner switch, ×1 / ×10 press, ticket press, scroll unroll (exists), flash, each card flip (exists per tier), Kage reveal (bigger), Continue | `SummonScreen` | scroll paper, flash boom, Kage fanfare |
| Battle: start ("Ready… Fight!"), objective timer last 5 s, escort under attack, ally KO vs enemy KO (`death` by side), heal (`heal`), stun (`stun`), shield up / break / end, enrage, revive, element swap, reflect warn / reflect, summon adds, rally, AoE land, `jutsuLand`, boss spawn, pause / resume, speed change, Auto-ult toggle, coach tip pop | `BattleScreen._sounds` handles only four event types today (`damage`, `ultReady`, `clash`, `telegraph`); `ultFire` comes from the tap/Auto path and `victory`/`defeat` from `_onEnd` | per-nature impacts and per-nature jutsu casts, KO thud + fall, boss roar, mechanic-specific cues |
| Ultimates by nature and by signature (today one `ultFire`) | `_sounds` / `ult` event (has `name`, `nature`) | Rasengan whirl, Chidori chirp (the anime's "thousand birds"), Amaterasu crackle… |
| Jutsu Clash per outcome (exists), plus the beam sustain | `clash` event | keep three outcomes, add the struggle loop |
| Results dialog open, reward count-up, Next fight | `Results.js` | reward chime per pill |
| Boss Rush round clear, intermission countdown, "Take the rewards" | `BattleScreen._rushRoundClear` | sting, tick |
| Achievements: unlock toast (exists), claim (exists), Claim all | `AchievementsScreen` | keep |
| Settings: toggles, reset, export/import, sign-in success | `SettingsScreen` | UI |
| Wiki: navigation, search | `WikiScreen` | UI |
| Intro: runners, title slam, flash | `Intro.js` | footsteps, slam hit, flash |
| Start menu: buttons, sign-in flows | `StartScreen` | UI |
| Install notice / popup / banner / installed toast | `install.js` | UI |
| Dialogue (Phase 5): line advance, skip, speaker change | new | text blip per era? |

### 6.4 Wiring quirks found in the call-site audit (fix while wiring the buses)

1. **Jingles stack.** `game.commit()` plays `achievement()` the moment anything unlocks, and most callers commit just before their own jingle: at every battle end the achievement arpeggio and `victory`/`defeat` start together (`BattleScreen._onEnd`, `UIManager.skipBattle`); a summon commits before the overlay opens, so `achievement()` plays over `scroll()`; a claim can unlock more achievements and play the jingle twice.
2. **Skip animation loses the Kage sound.** With the switch on (or after a tap during the reveal) only the last card's `pullReveal` plays, so a Kage elsewhere in a ×10 gets no fanfare, and the last card's sound still fires at its original time, up to 1.7 s later.
3. **A manual clash plays two big sounds:** `ultFire()` on the tap, `clash()` on the next frame. Auto-ult plays one `ultFire()` per frame however many Ultimates fired.
4. **Retreat plays the full `defeat()`;** Boss Rush "Take the rewards and stop" plays nothing (it never reaches `_onEnd`).
5. **No ready ping when a unit starts with full chakra** (lesson 3, Boss Rush carry-over), because `ultReady` only fires on a below-full → full transition.
6. **Hit sounds do not tell apart** reflected damage, fully absorbed hits, effective crits, ally hits vs enemy hits, or hits on the escort.
7. **The first-visit intro can never be heard:** the AudioManager is created after `playIntro` starts, the context unlocks on the first tap, and that tap skips the intro. Music can only start after the first gesture; there is no "play once unlocked" queue.
8. **Nothing reacts to the app being hidden** except the battle pause (`_onVis`); a global `visibilitychange` handler is needed for music.
9. **Only tabs and the 🏆 button click.** `dom.js btn()` builds most buttons, but chips, segments, banner tabs, nodes, slots, cards, presets, quiz options, Wiki rows, HUD buttons and portraits are built with `h('button…')`; one delegated click listener in `UIManager.init` would cover them all. The speaker and brand buttons make no sound.
10. **Music must be keyed on the screen id, not on `go()` calls** (node select, mode tabs, the Part switch and Wiki pages all call `go()` on the same screen), the battle is an overlay (`ui.current` does not change during a fight), an achievement toast can change the screen under the overlay mid-battle, **Retry restarts the sim without `open()`** (`BattleScreen.restart`) and **Next fight skips `battleClosed`**, so battle music needs hooks in `_buildSim`/`restart`, not only in `open`.
11. **Timings to sync to:** screen fade 0.2 s; dialog pop 0.22 s; toast 0.25 s in, 3.2 s on screen; tip/coach pop 0.25 s; summon scroll 0.8 s (cards at 0.9 s), card i flips at 160 + 170·i ms over 0.35 s, flash 0.7 s (Kage 1.4 s), burst 1.1 s; intro runners 1.1 s starting at 0/110/240/380/520 ms, slam 0.5 s / shake 0.4 s / flash 0.5 s at 1.9 s, fade-out 0.3 s; announcer 1.2–2.0 s; battle end → results 650 ms (700 ms Boss Rush).

### 6.5 Constraints the audio phase inherits

All original, composed in code (Web Audio; Tone.js only if it earns its size); no copyrighted or ripped audio; mobile autoplay unlock on first tap (exists); `settings.muted` (exists), `settings.music` and `settings.sfx` (saved, unread) become a music bus and an effects bus under the master; volume sliders and persistence are new; ducking under dialogue; low CPU (a scheduler that pre-plans a bar at a time, not per-frame node creation; today `ultFire` creates 3 nodes per call and `hit` 2, fine).

## 7. Performance and size budget

### 7.1 Today's footprint (measured)

| Measure | Value | How |
|---|---|---|
| Source served | 61 JS modules, **686 KB** raw; `css/style.css` **62.6 KB**; `index.html` 3.6 KB; 9 Wiki guides 35 KB (fetched on demand); 4 icons 32 KB | `wc -c` |
| Compressed | JS + CSS ≈ **206 KB gzip** (GitHub Pages serves gzip) | `gzip -9` of the concatenation |
| First load | **70 requests**, 770 KB decoded same-origin, DOMContentLoaded at 72 ms on localhost (plus the Firebase SDK from gstatic, cross-origin, not cached by the worker) | `performance.getEntriesByType('resource')` in the pane |
| Service-worker cache | **67 entries** after boot (network-first, cache-as-you-go, WARM on first load), storage usage **0.96 MB** | `caches.open('shinobi-auto-battler-v1')`, `navigator.storage.estimate()` |
| JS heap after a battle | 7.4 MB used / 9.8 MB total | `performance.memory` |
| Battle canvas at 412×915 (Pixel 8a portrait, DPR 2) | 412×231 CSS px, 824×462 device px, `unitScale` 1.94 (units drawn ~2× so heads stay ~30 CSS px) | `Renderer.resize` |
| Battle main-thread cost per frame, 1× (Showdown on the Bridge, 5 units, Auto-ult on) | `sim.step` **0.06 ms**, `renderer.draw` **0.35 ms**, `effects.update` ~0 ms | timers wrapped around the calls in the pane |
| Same at 5× | `sim.step` 0.10 ms, `renderer.draw` 0.62 ms; 19.8 s of battle in 4 s wall | same |
| Intro | 3.0 s cap (`INTRO.maxMs`); the overlay's first frame after creation stalls ~1 s in the pane (DOM build + first layout), then runs | rAF sampling during Settings → Replay the intro |

**Caveat on frame time.** The desktop browser pane caps `requestAnimationFrame` at 30 fps while emulating a phone (every sample sat at 33.4 ms, intro and battle alike, with the game's own work under 1 ms), and it pauses rendering when hidden, so it cannot measure a Pixel 8a. HANDOFF.md reports 5× speed "fine on a desktop and the Pixel 8a class" from the user's runs, but there is no on-device number. The honest statement is: today the game's per-frame work is tiny (< 1 ms on a desktop core, so plausibly 2–4 ms on a Pixel 8a's Tensor G3 efficiency cores, where Chrome runs main-thread JS roughly 3–5× slower), and **the whole frame budget is still available to the art pass**.

### 7.2 Budget proposed for the pass (Phase 1 confirms the caps)

| Budget | Proposed cap | Why |
|---|---|---|
| Frame time on a Pixel 8a, battle at 1×, worst case (boss + 4 adds, an Ultimate and a clash on screen) | ≤ 12 ms main thread of a 16.7 ms frame (60 fps), never above 33 ms | phones drop to 30 fps otherwise, and 5× runs up to 8 sim ticks per frame |
| Intro | ≤ 3 s total (unchanged), ≤ 8 ms/frame | it plays once |
| Summon ceremony (10-pull with a Kage: 60 burst particles + 10 card flips) | ≤ 16 ms/frame in CSS/compositor only; no canvas | already the heaviest DOM animation |
| First install download (shell + code + UI skin + fonts + Part I stage 1 + starter portraits) | ≤ **2.5 MB** over the wire | GitHub Pages, no CDN, phone data; today 206 KB |
| Per-arc asset pack (stage layers, the arc's portraits and sprites, its boss) | ≤ **300 KB** each, lazy, prefetched when the arc opens on the map | 25 arcs × 300 KB = 7.5 MB worst case, never all at once |
| Total repo assets (all 27 stages, 70 + ~85 portraits, sprites, fonts) | ≤ **12 MB** in `assets/` | Pages repo size and the worker's cache-as-you-go (no precache list) |
| Image formats | WebP (AVIF only if a fallback is kept), sprite sheets; portraits 256×256 (84 px at DPR 3), sprites authored at 3× (≈170×250 per normal frame, 220×320 boss) per HANDOFF §1/§5 | phone DPR 3 |
| Audio | 0 bytes of files: synthesised; per-track CPU ≤ 2 ms per audio callback | the brief |
| Fonts | ≤ 2 files, subset, ≤ 120 KB total, `font-display: swap`, system fallback | one display face, optional body face |
| Memory | ≤ 150 MB total on the 8a with one arc pack decoded | Chrome on Android kills tabs above ~300 MB |

Everything must keep the current rule: with any asset missing, the code-drawn fallback plays (so the first playable build of Phase 3 is the current game with the art bible's colours).

## 8. What the audit surfaced (input to the Phase 1 questions)

1. **One token for 70 + 156 units.** Portraits and sprites are the biggest single job: 70 roster looks, ~85 enemy-only looks, 7 civilians, and a decision on Part I vs Shippuden outfits for the ~25 characters who fight in both eras.
2. **One background for 27 stages.** Every arc's `theme` is five colours on the same hills; the brief's stage list per arc with a landmark each is a new list to agree on (25 arcs + Academy + Boss Rush).
3. **Every effect is a ring or a spark.** 269 named techniques need a nature default and ~35 signature overrides; the Jutsu Clash, the standout system, is a beam and a banner today.
4. **No music, 15 synth blips, one bus.** `settings.music/sfx/vfx` exist in the save and in Settings (disabled) but nothing reads them; there are no volume sliders.
5. **Zero dialogue.** 99 nodes and 25 arcs have a blurb each and nothing else; the tutorial teaches in the UI's voice; no character speaks anywhere; every system is explained by tips and the Wiki.
6. **No ceremonies.** Battle start, boss appearance, KO, victory, level-up, star-up, achievement claim and arc clear all happen without a beat; the summon is the only ceremony (a CSS scroll and a flash).
7. **UI is one dark theme with emoji icons** (tabs, currencies, tiles, tips, twists, categories) and the system font. The brief's "UI skin per era" is a new layer: the Story map already knows the part, the battle knows the arc.
8. **Phone layout is solved and must stay solved**: 44 px targets, the flush tab bar, the 2× unit scale on phone portrait, the info panel, the audit script at four sizes. New art must fit the existing geometry (units anchored at y 560, announcer at y 58–108, ground line, the 1320×760 over-draw).
9. **The canvas ignores `prefers-reduced-motion`** for shake; the VFX detail setting is unwired.
10. **Everything is static and lazy-friendly**: no bundler, plain ES modules, a network-first worker with no precache list, so per-arc asset packs are the natural unit and the ingest pipeline must write plain files the worker can cache as they are fetched.
11. **Names are locked by NAMING.md** (dub names, Narutopedia-checked). Story writing must use them and add new names to `tools/naming-sources.mjs`.
12. **Tests exist for everything but presentation**: `npm test` = validate + syntax + 252 core tests + 61 sim scenarios + 10 campaign players; nothing covers assets, audio or dialogue yet (Phase 6 adds them).
