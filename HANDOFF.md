# HANDOFF.md — Session 4 → the art, audio and VFX pass

> **Standing rule (Session 4 onwards):** any session that changes a system must update the matching Wiki guide in `wiki/guides/` (and "What's new" for anything a player will notice) before committing. `npm run validate` checks the guides' links and config placeholders; see CONTENT_GUIDE.md §9.

The game is finished in every way except art, audio and visual effects. Everything a
player sees is drawn in code (canvas shapes, CSS, emoji) and every sound is a tiny Web
Audio synth: **there are no image or audio files in the repo**. This document lists every
placeholder, where it's drawn, its size, and what's still open.

## Session 4 in one table

| Step | Commit | What it added |
|---|---|---|
| 1. Tutorial | `124b048` | The Academy: three skippable lessons before the Survival Test (same reward either way), one-time screen tips with "Show tips again", save v2 |
| 2. Wiki | `9de174e` | Wiki tab and a ? button on every screen; generated pages for all content; 9 hand-written guides; `npm run validate` checks pages, links and config placeholders |
| 3. Achievements | `c692a6a` | 20 achievements (retroactive, toasts, claim screen), summon tickets and Rare+ tickets, the achievement-exclusive Naruto (Nine-Tails Chakra Mode) |
| 4. Settings | `965e2cc` | Battle speed, Auto-ult mode, tips, replay tutorial, account states, typed reset, version + What's new; audio/VFX placeholder toggles |
| 5. Endgame | `e940bc8` | Hard mode (per part, autotuned, counter-gap bands hold), the Daily challenge (4 twists, sim-checked), Hard economy check |
| 6. UX and copy QA | `a57500a` | `tools/ui-audit.mjs` + QA.md; 44 px targets, two dead ends fixed, landscape side rail, loading/error states, empty states, copy fixes |
| 7. Docs | this commit | README, DESIGN (§9–13 new), BALANCE (§2–4, §6 Hard rows), CONTENT_GUIDE (§10–12 new), NAMING, this file |

**Checks:** `npm test` passes: validate (content, balance, names, Wiki), syntax on 59 files, **109 core tests**, **61/61 sim scenarios** (Story and Hard bosses, counter-gap bands in both modes, Boss Rush) plus the Daily info check, and **10/10** free-to-play campaign players clearing Parts I–II. The layout audit is clean at 390×844, 360×780, 844×390 and 1280×800 (QA.md).

**Live:** https://dygoma.github.io/shinobi-auto-battler/, checked after the Session 4 push (see "Live check" at the end).

---

## The art, audio and VFX pass

### Ground rules
* **No official artwork, audio or logos.** The README and the About screen say so; keep it true. Original fan art, or assets with a licence that allows it (list them in a CREDITS file with their licences).
* **Keep the game working without assets.** Load images and sounds with a fallback to today's code-drawn shapes and synth, so a failed download never breaks a battle. There is no asset loader yet: add one that preloads a battle's assets before the battle starts.
* **Budget for phones and GitHub Pages.** Everything ships as static files from GitHub Pages (no CDN, no build step). Prefer WebP/AVIF sprite sheets and short Ogg/MP3 loops; lazy-load per arc.
* **Respect the settings:** `settings.muted` today, and `settings.music`, `settings.sfx`, `settings.vfx` (already in the save, default on; see "Settings wiring").
* **Re-run QA.md's audit** at all four sizes after the swap, and keep tap targets at 44×44.
* Keep dub names on anything with text (NAMING.md).

### 1. Battle units (canvas) — `js/render/Renderer.js` `_drawUnit()`

The battle is a **1280×720 logical canvas**, scaled by `devicePixelRatio` (up to 3) and letterboxed. Every unit (your ninja, enemies, bosses, summoned adds, escorts) is the same token:

| Part | Drawn as | Logical size (normal unit) |
|---|---|---|
| Shadow | dark ellipse at the feet | 56×16 |
| Body | tunic trapezoid in a darker shade of the unit's `color` | 36 wide at the feet, 24 at the shoulders, 34 tall |
| Sash | bar in the unit's active nature colour (white for taijutsu) | 26×5 |
| Head | circle in `color`, white outline (yours) or dark (enemies) | 48 diameter |
| Headband | plain grey plate, no village symbol | 46×7 |
| Initials | `initials`, 900-weight system font | 15 px |

* **Whole unit:** about **56×82** logical px; bosses ×1.3 (about **73×107**), summoned adds ×0.85. On phone portrait the lane renders at ~0.3×, so units are drawn up to **2.4× bigger** (`unitScale`, head kept ~30 CSS px) and allies alternate between two rows.
* **Anchor:** bottom centre at (`u.x`, `GROUND_Y` 560 + depth). Depth is −7/0/+7 px per unit (±24×unitScale rows on phone portrait).
* **Facing:** your ninja face right, enemies face left (mirror one sheet).
* **Motion (all in code, reuse for sprites):** walk bob (|sin|, 5 px), idle bob (1.2 px), a 12 px lunge on each attack (0.16 s), a white hit flash (0.12 s), death fade (~0.6 s) while sinking 20 px, blinking while invulnerable (revive).
* **Status overlays:** enrage or ATK-buff aura (ellipse 84×112), stun stars (3 orbiting), taunt ring (r 40), reflect hexagon (r 50), absorb-shield bubble (r 46), a dashed green ring on escorts you protect.
* **Data:** each character in `js/content/roster.js` and each enemy in `js/content/enemies.js` has `color`, `initials` and `emoji` (70/70 characters, 156/156 enemies). Characters: **60 base ninja + 10 alternate forms**. Enemies: **156 entries, 71 of them `basedOn` a character** (their sprite can reuse or recolour the character's), so **85 distinct enemy looks**, 37 of which are bosses.
* **Suggested sprite spec:** transparent sheets per unit with idle, walk, attack, hit, cast (Ultimate or jutsu wind-up) and KO frames, authored at 3× (about **170×250 px** per frame for a normal unit, **220×320** for a boss), feet at the bottom centre.

**HUD over units** (`_drawHud`, `_drawTelegraphBars`, `_drawZones`) can stay code-drawn, but restyle to match:
* HP bar 60×7 (bosses 120×9) with a nature pip (r 5); your chakra bar (3 px) under it; boss name or "Protect: …" label (15 px).
* Wind-up banner above the caster: rounded box ≥140×34 with "⚠ jutsu name", a nature-coloured border and a progress line.
* Ground target rings under the jutsu's targets: pulsing ellipses 88×28 in the nature colour.

### 2. Battle backgrounds — `Renderer._buildBackground()`

* Built once per battle into an offscreen 1280×720 canvas from the arc's `theme` (`sky: [top, bottom]`, `far`, `ground`, `accent`), then drawn at **1320×760 from (−20, −20)** so screen shake never shows an edge.
* Contents: sky gradient, a sun/moon disc at (1030, 120) r 54, two hill layers, 26 triangle trees, ground gradient from y 540, a lane stripe at y 578.
* **Slots:** one per arc (**25**, themes in `js/content/arcs/part1.js` and `shippuden.js`), the Academy (`js/content/tutorial.js`), and the Boss Rush (its theme is hard-coded in `BattleScreen.open()`). The Daily challenge and Hard mode reuse the boss's arc.
* **Spec:** 1320×760 logical (2640×1520 for DPR 2; 3960×2280 if you want DPR 3 crisp), or parallax layers (sky, far, near, ground). Keep the ground line at y ≈ 560 (units stand on y 520–600), keep the area behind units low-contrast, and keep the top 58–108 px readable: the announcer banner sits there.

### 3. Battle effects (VFX) — `js/render/Effects.js`

Driven by sim events (`onEvents`), capped at 260 live items, drawn after units:

| Event | Today |
|---|---|
| ranged auto-attack (range > 150) | 5 px glowing dot arcing to the target (0.22 s) |
| damage | floating number (20 px; crits 27 px with ✦; Ultimates and specials 30 px) tinted by matchup; "EFFECTIVE!" / "resisted" tags (throttled 0.7 s per unit); sparks on crits, Ultimates and specials; "(N absorbed)" |
| heal, miss, stun, immune | "+N" (green), "miss", "STUNNED", "immune" |
| Ultimate fired | two rings (nature colour r 150, white r 90), 18 sparks, announcer "Short: Ultimate name!", screen shake |
| AoE | white ring of the AoE radius at the ground |
| **Jutsu Clash** | two-colour beam between clasher and caster, a big ring, 32 sparks, announcer "JUTSU CLASH — OVERPOWER! / STANDOFF / OVERWHELMED", shake 12 |
| enemy jutsu lands | sparks on each target, shake 6 |
| boss specials and mechanics | announcer lines plus rings: telegraph, revive (gold ring), shield (blue ring) and shield break ("SHIELD BROKEN"), enrage (red ring, shake), element swap (ring in the new nature, "→ X Style"), reflect warning and reflect, summon, rally |
| KO | grey sparks and a ground ring |

* **Announcer banner:** top centre, dark box 50 px tall (×up to 1.8 on phones) with a coloured underline, 1.4–1.8 s.
* **What the pass should add:** per-nature impact styles (Fire, Wind, Lightning, Earth, Water, and taijutsu), signature Ultimates (every character's `ult.name` is a canon dub jutsu name: Rasengan, Chidori, Sand Coffin…), clash visuals worthy of the system, boss mechanic visuals, and KO. Honour `settings.vfx` (detail level) and `prefers-reduced-motion` (CSS already respects it; the canvas shake does not yet).

### 4. Battle screen (DOM) — `js/ui/BattleScreen.js`

* **Ultimate bar:** a portrait button per ninja (avatar **46 px**, **34 px** on narrow phones), name, Ultimate name, chakra fill, a glowing "ready" state, and the clash prediction badge (▲ OVERPOWER / = STANDOFF / ▼ WEAK).
* **HUD:** objective, timer, 🤖/👆 Auto-ult, 1×/2× speed, ⏸ pause (44 px icon buttons).
* **Phone portrait info panel** (`_buildInfo`): Nature Wheel chips and a foe list.
* Pause menu, round-clear boxes (Boss Rush, Daily gauntlet), results dialogs, coach tips.

### 5. Portraits and tokens (DOM) — `js/ui/dom.js` `avatar()`, `StoryMapScreen.js` `enemyToken()`

* `avatar()`: a circle in the character's `color` with `initials`, a tier-coloured ring, and the `emoji` as a badge bottom-right (24 px, 18 px on small). Sizes: **56 px** (default), **40 px** (`sm`), **84 px** (`lg`, Kage reveals), **46 / 34 px** (battle bar). "?" silhouette for unrecruited ninja.
* Used on Home, Team, Roster and the character dialog, Summon (featured and reveal), every Wiki character list and page, Daily, Achievements (the exclusive reward) and the battle bar.
* `enemyToken()`: a **40 px** circle with a red ring: node panel, Daily, Boss Rush, Wiki enemy lists.
* **Spec:** a square portrait per character and form (**256×256** covers 84 px at DPR 3), shown in a circle; boss portraits at least, ideally every enemy look (85).

### 6. Summon animation — `js/ui/SummonScreen.js` `playAnimation()` + CSS

* Dark radial overlay (scrolls when the cards don't fit).
* A CSS scroll: 96 px paper band reading "SUMMONING JUTSU" between two rods, unrolling over 0.8 s.
* A full-screen flash in the best tier's colour (bigger for Kage), and a particle burst (24 for Jonin, 60 for Kage) in its own fixed layer.
* **Reveal cards:** 3:4, 5 per row up to 900 px (3 on phones), tier border (Kage glows), a NEW! / ★ / +Ryo tag, portrait, name, tier, Rate-up pill; then Continue.
* Sounds: `scroll()` then `pullReveal(tier)` per card.
* **Slots:** scroll art, per-tier card frames, reveal and flash VFX, Kage fanfare.

### 7. UI chrome, icons and fonts

| Slot | Today | Where |
|---|---|---|
| Brand mark | 30 px orange circle with 忍 | top bar, `index.html` + `.brand-mark` |
| Favicon | inline SVG (orange circle, 忍) | `index.html` `<link rel="icon">` |
| Home hero decoration | 200 px 忍 at 3.5% white | `HomeScreen.js` `.hero .kanji` |
| Tab icons | emoji 🏯 🗺️ 👥 📖 📜 📚 ⚙️ (20 px) | `UIManager.js` `TABS` |
| Currencies | 📜 scrolls, 🪙 Ryo, 🎟️ summon ticket, 🎫 Rare+ ticket | top bar, rewards, Summon, Achievements |
| Challenge and twist icons | 📅 Daily, 💀 Hard, ☁️ Boss Rush; 🎯 🚫 ⚔️ ⬇️ twists | `HomeScreen.js`, `Daily.js` `TWIST_TEXT` |
| Achievement categories | 🗺️ 📖 ⚔️ 👤 | `js/content/achievements.js` |
| Tip icons | emoji per tip | `js/ui/tips.js` |
| Nature chips | coloured CSS pills ("Fire Style"…) | `.nat.*` in `css/style.css`; the same colours are in `Renderer.NATURE_COLORS` (keep both in sync) |
| Tier colours | CSS `--r-genin` … `--r-kage`; `Renderer.TIER_COLORS` | everywhere |
| Story map | node dots (58 px, bosses 72 px, 50 px on phones) joined by an SVG polyline; arc cards | `StoryMapScreen.js` |
| Nature Wheel chart | SVG built in code | `WikiScreen.js` (the nature-wheel page) |
| Fonts | system UI stack (`--font`) | `css/style.css` |

A display font for titles and a nature icon set (to sit in the chips and on the canvas pips) are the obvious additions.

### 8. Audio — `js/audio/AudioManager.js`

A synth (oscillators and filtered noise, no files). The context unlocks on the first tap; master gain 0.5; mute is `settings.muted` (top-bar 🔊 and Settings → Sound).

| Sound | When | Called from |
|---|---|---|
| `hit`, `crit`, `effective`, `resisted` | every damage event (throttled) | `BattleScreen._sounds` |
| `ultReady` | a portrait fills | `BattleScreen._sounds` |
| `ultFire` | an Ultimate fires (tap or Auto-ult) | `BattleScreen` |
| `clash(outcome)` | a Jutsu Clash resolves | `BattleScreen._sounds` |
| `telegraph` | an enemy wind-up starts | `BattleScreen._sounds` |
| `victory`, `defeat` | battle end, Boss Rush and Daily round clears | `BattleScreen` |
| `scroll`, `pullReveal(tier)` | summon animation | `SummonScreen` |
| `click` | tab bar, 🏆 button | `UIManager` |
| `levelUp` | a level-up | `RosterScreen` |
| `achievement` | an achievement toast or claim | `UIManager`, `AchievementsScreen` |

**Missing entirely: music.** Suggested set: title/Home, Story map, battle (per part or per arc mood), boss battle, Boss Rush, victory and defeat stingers, summon. Plus per-nature impact sounds, signature Ultimate sounds, and UI sounds for dialogs and claims. No voices (no official audio).

### 9. Settings wiring

Settings → Audio and visuals already shows three **disabled** switches bound to save keys that exist, default to on, and survive migrations:
* **Music** → `settings.music`
* **Sound effects** (a separate switch from Sound) → `settings.sfx`
* **Visual effects** (effect detail) → `settings.vfx`

When the pass lands: drop `{ disabled: true }` in `SettingsScreen.js`, read the keys in `AudioManager` (a music bus and an effects bus under the master gain) and `Effects` (detail level), and update the Wiki guides and What's new (standing rule).

---

## Still open

**Balance and content**
1. **The counter-gap depends on the team more than the mode.** A Tsunade-led (HP buff, healer) team fights long, steady battles where being countered costs far more (3 of 4 countered: 7% instead of 26%), in the story as much as on Hard. The Hard scenario uses the story's team to measure the mode; see BALANCE.md §6. Worth knowing if the wheel is touched again.
2. **Daily difficulty is bimodal.** Tuned so every sampled player clears every twist within 3 tries at least half the time, which leaves most days comfortable (median win per attempt ~100%). A per-boss adjustment would make typical days harder without making the worst ones impossible (BALANCE.md §4).
3. **`n_birth_4`** (Madara, Birth of the Ten-Tails' Jinchuriki): one of ten players needed 5 replays in the optional `CAMPAIGN_TUTORIAL=0` run; the default run passes 10/10.
4. **`n_summit_3` on Hard** sits at the autotune floor (0.33, 72% vs its 78% goal): a mid-arc boss, easier than intended, not a wall.
5. **Part II on Hard has no achievement** (Part I on Hard does). An `ach_hard_part2` would be data only.
6. **Nagato's Earth**, **Boss Rush Pain's five natures**, **Part II dub titles from Wikipedia's season lists**, **non-boss nodes are easy at level**: carried over from Session 3 (see the Session 3b handoff in git history, `025bf7f`).

**Platform**
7. **Real-device checks** before a release: notch/home-bar safe areas on iPhone in both orientations, iOS Safari's collapsing address bar, the Android back button, a Kage 10-summon on a low-end phone (QA.md).
8. **Firebase:** the cloud save runs on the free Spark plan (FIREBASE_SETUP.md). QA used the local preview's existing anonymous account with cloud writes switched off (`offline()` in `tools/ui-audit.mjs`) and created no accounts; the live check below created one guest account.

## Live check

After the push (`ac69643`, GitHub Pages build "built"), https://dygoma.github.io/shinobi-auto-battler/ in the Claude desktop browser (Chromium), 2026-09-24:

| Save | Result |
|---|---|
| **New** (first visit, empty storage) | Loads with no console messages at all. Fresh v2 save, the Academy welcome and tutorial offered, cloud save on as a guest. The Wiki's "Hard mode and Daily challenge" guide loads (`.md` served raw thanks to `.nojekyll`) with this session's copy. No failed requests. |
| **Existing** (a Session 3-format v1 save with Part I cleared, written to `localStorage`, then reloaded) | No console messages. Migrated to v2 with all 32 Part I battles kept; the tutorial skipped itself and paid its reward (+300 scrolls, +450 Ryo); Part I Complete and First Summon unlocked retroactively; Home shows the Daily challenge, "Next on Hard: Pass or Fail: Survival Test" and "Best: round 3" for the Boss Rush. |

The new-save visit signed in anonymously, as every new visitor does, so the Firebase project has one guest account from this check, holding that synthetic test save. Delete it in the Firebase console (Authentication → Users) if you like; anonymous accounts are also cleaned up automatically if that option is on (FIREBASE_SETUP.md).
