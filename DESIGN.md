# DESIGN.md — Shinobi Auto-Battler

A Naruto-universe 2D lane auto-battler for the web. Your ninja walk and fight
on their own; **you** decide the team, read the Nature Wheel, and choose when
to fire each Ultimate, especially whether to spend it on a **Jutsu Clash**.

All numbers in this document come from `js/config/balance.js` and can change
there. Names follow the English dub (see NAMING.md).

---

## 1. Core loop

0. **The Academy** (new players): three short lessons before the story teach team building, the Nature Wheel and Jutsu Clash (§9). Skippable, same reward either way.
1. **Story**: fight through Part I and Part II (Shippuden) in anime episode order (25 arcs, 99 nodes). Each arc ends with a boss that has data-defined mechanics.
2. **Rewards**: first clears pay scrolls and Ryo, replays pay Ryo (and a few scrolls), and clearing a whole arc pays a bonus.
3. **Summon**: scrolls buy pulls on the Standard banner or the current arc's banner (rate-up). Villains join the pools after their arc is cleared.
4. **Upgrade**: Ryo buys levels. Duplicate pulls add stars (+10% stats each, up to 5★), and duplicates past 5★ refund Ryo.
5. **Team**: 3 members + 1 Leader, chosen per node by nature matchup and lane reach.
6. **Boss Rush**: after clearing the Sasuke Retrieval Squad arc, fight the Akatsuki back to back with no healing between rounds.
7. **Endgame**: Hard mode for each cleared part and a Daily challenge (§12), with achievements across everything (§11).

Target session: a 30–60 s battle, a reward screen, then a decision (next node, summon, level up or re-team).

---

## 2. Combat

### 2.1 The lane
* One horizontal lane on a 1280×720 logical canvas. The player spawns on the left and enemies on the right; both walk toward each other.
* **No stacking:** units queue `lane.allySpacing` (58 px) apart and can't pass their allies. Each side lines up melee first, then mid, then long range.
* **Reach:** each unit attacks from its range.
  * `melee` (Tanks) must be in contact.
  * `reach` (Strikers) can also hit from directly behind a Tank.
  * `mid` (Supports) and `long` (Ranged) fire over the line.
  * So a third melee body mostly waits in line. The Team Builder warns about this, and the Auto picker understands it.
* Melee-type units always close to contact; ranged units stop at their range.
* **Divers** (enemies with `targeting: 'protected'`) slip past your line toward an escort, which is what makes "protect" objectives tense.

### 2.2 Stats and damage
`HP, ATK, DEF, attackInterval, range, role (Tank / Striker / Ranged / Support), nature(s)`

```
final stat = role base × character weight × rarity mult × level mult × star mult (× leader buff)
damage     = ATK × power × K/(K+DEF) × variance × crit × nature multiplier
K          = defenseK curve at the attacker's level (keeps DEF relevant at every level)
```
* Variance is ±15%, crits deal ×1.7, and there is a 5% dodge chance (auto-attacks only).
* HP floors at 0. Dead units fade out and are removed.

### 2.3 Chakra and Ultimates
* Chakra runs 0–100. It fills from attacking (`7.5 × attackInterval` per hit, so slow hitters aren't punished), from taking damage (0.55 per 1% max HP lost), and passively (2.2/s, so queued units still get their ult).
* The sim median is **one ult every ~12 s per unit** (target 10–15 s).
* At 100 the portrait glows and pulses. Tap it (or press keys 1–4) to fire the character's Ultimate, which uses the canon dub jutsu name.

| Role | Ult type | Effect (balance.js `combat.ult`) |
|---|---|---|
| Striker / Ranged | `single` | 4.2 × ATK to one target (optional `stun` rider, 2.2 s) |
| Striker / Ranged | `aoe` | 2.3 × ATK to every enemy within 300 px of the target (not a screen wipe) |
| Tank | `taunt` | 5 s taunt + 50% damage reduction, plus a 1.4 × ATK hit |
| Support | `heal` | 2.4 × caster ATK + 10% max HP to every ally |
| Support | `buff` | +30% team ATK for 8 s |

* Ults are jutsu: they reach any enemy.
* In "defeat the boss" nodes, player units and single-target ults focus the boss.

### 2.4 Leader
* The 4th slot is the **Leader**. Its passive buff is defined per character as a stat (`atk, hp, def, speed, crit, chakra, startChakra, nature`) plus an optional scope (a team tag, a nature, a role, or a tier).
* Scoped buffs are ×1.8 stronger than whole-team buffs, and Kage leaders give ×1.45.
* Example: Kakashi, the starter Leader, gives +21.6% ATK to Team 7.
* Some nodes remove the Leader (Survival Test) or force one (the Third Hokage's Last Stand).
* Forced ninja always play. If a node forces four, the Leader slot yields: your Leader leads only if they are one of the four, otherwise the first forced ninja does (Traps Activate! → Might Guy).

### 2.5 Nature Wheel (canon)
`Fire › Wind › Lightning › Earth › Water › Fire`
* **Effective** = ×1.12 and **resisted** = ×0.95 (`natureWheel`). Damage numbers are tinted with the element and pop "EFFECTIVE!" or "resisted".
* **Multi-nature characters** attack with whichever of their natures is best against the current target. Their *first* nature is the one they defend with.
* **Taijutsu specialists** (Rock Lee, Might Guy) are neutral. They are never resisted and ignore 15% of enemy DEF.
* **Where the wheel shows up in the UI:**
  * **Before a node:** the node panel lists every enemy nature, including boss specials and element swaps.
  * **Team Builder:** a live matchup rating (1–5 ★, from "Bad" to "Great"), and ▲/▼ markers on each ninja.
* Natures follow canon (NAMING.md explains the rule for each character).
* The multiplier applies to both offense and defense, and the wheel also decides every Jutsu Clash, so matchups decide close fights without making a countered team hopeless. `npm run sim` checks it: in the counter-gap fight, a team that wins 60% neutral wins ~98% countering, 26% with 3 of 4 countered and 12% fully countered ("Nature check" and the counter-gap rows; BALANCE.md §6 has the history, and the same bands hold on Hard).

---

## 3. Standout system: **Jutsu Clash**

> **Pitch.** Every enemy jutsu comes with a visible wind-up, and your Ultimates can meet it head-on. Fire one into the wind-up and the Nature Wheel decides the clash: **Overpower** it (your nature beats theirs), **Standoff** (neutral), or get **Overwhelmed**. Holding an ult for the right moment, and bringing the ninja whose nature answers the boss's signature jutsu, turns every fight into a readable tactical duel.

### Rules
1. **Enemies telegraph.** Regular enemies build chakra and cast their `jutsu` after a 2 s wind-up. Boss specials (`telegraphAoE`) wind up for 3 s. A ⚠ bar shows the jutsu name and a nature colour, and coloured rings mark the targets on the ground.
2. **Clash window.** Firing *any* Ultimate while a wind-up is active meets the wind-up that will land first.
3. **Outcome** (your unit's best nature vs the jutsu's nature):

| Outcome | When | Effect (balance.js `jutsuClash`) |
|---|---|---|
| **OVERPOWER** | your nature beats theirs | Their jutsu is cancelled, your ult resolves at ×1.35, the caster is stunned for 2 s, and you get 25 chakra back |
| **STANDOFF** (also called "Cancelled") | neutral / no nature | Both jutsu fizzle; your ult still resolves at ×0.5; no chakra comes back |
| **OVERWHELMED** | their nature beats yours | Your ult is cancelled (no damage), but their jutsu is ALSO cancelled — same as Standoff — and you get 85 chakra back (`overwhelmedChakraRefund`), so a countered team isn't locked out of its next ult |

4. **Roles:**
   * **Taijutsu** specialists can never be Overwhelmed (their worst case is Standoff).
   * A **Tank** that clashes always pulls the jutsu onto itself with +50% damage reduction. That's a "guard" play: it takes a boss's team-wide special alone.
5. **Readable:** while a wind-up is active, every ready portrait shows a badge (▲ OVERPOWER / = STANDOFF / ▼ WEAK) predicting the result. The Academy's third lesson teaches it (and 🤖 Auto-ult) with a clash set up to win, and the Wiki's "Jutsu Clash explained" guide covers it in full.
6. **🤖 Auto-ult** (the battle HUD button; its default is set in Settings) fires ults for you. Its mode is a Setting: **clash-aware** (the default: fires counter-nature ninja into wind-ups and holds anyone who would be Overwhelmed) or **fire when ready**.

### Why it meets the brief
* **Naruto theme:** jutsu clashes are the series' iconic moments (Chidori vs Rasengan, Fire vs Water).
* **Real decision:** fire now for damage and chakra tempo, or hold for a clash? And *which* ninja takes it: the counter-nature striker, or the tank to guard?
  * The clash-aware bot (`botUlts('smart')`) is what the in-game 🤖 Auto-ult uses, and `npm run sim` now plays every scenario with it too (Session 3b), so the boss targets mean the same thing in the sim and in the game. The sim also prints the fire-when-ready bot for comparison: clashing on purpose is worth a lot — Final Valley 60% → 29%, Kakashi: Shadow of the ANBU Black Ops 62% → 21%, Fourth Great Ninja War: Climax 56% → 24%, Land of Waves 60% → 42% (ASAP bot).
  * A few bosses go the other way (e.g. Fourth Great Ninja War: Countdown 56% → 83% ASAP): a boss whose specials are rarely worth clashing into can make holding ults a net loss of tempo, which is also a real decision.
* **Taps only:** one tap on a portrait. There are no combos and no gestures.
* **Nature wheel and team composition:** the outcome *is* the wheel, and it rewards bringing counters and a Tank.
* **Tunable, with an on/off flag:** `balance.jutsuClash` has `enabled` plus every multiplier. The enemy wind-up time is `enemyScaling.enemyJutsu.windup`, and the boss wind-up is `bossMechanics.telegraphAoE.windup`.
* **Scales to new characters:** it reads only data that every character already has (natures, role, taijutsu flag) and every enemy jutsu/special, with no per-character code. The 34 Part II characters and 24 Part II bosses got clashes with no code changes.

---

## 4. Enemies, bosses and objectives (all data-defined)

**Enemy power:**
* Content gives each enemy relative stat weights only.
* Power comes from `enemyScaling`:
  * `levelByNode`: enemy level by *global* node index, shared by every part.
  * `statMult`.
  * `partMult` (per part).
  * `bossMult` (for units flagged `boss`).
  * `groupMult`: shrinks each enemy as the node gets more crowded, so 1-enemy and 4-enemy nodes stay comparable.
  * `nodeMult`: a per-node fine-tuning map written by `tools/autotune.mjs`.

**Boss mechanic types** (any enemy can use them; numbers are defaults in `bossMechanics`, and content may scale them with relative `power`/`interval`/`windup` weights):

| Type | What it does | Example |
|---|---|---|
| `telegraphAoE` | wind-up, then hits all/front/back/random (can stun); clashable | Zabuza: Water Style: Water Dragon Jutsu |
| `summonAdds` | spawns adds on a timer or at HP thresholds | Orochimaru: Summoning Jutsu (Manda) |
| `shieldPhase` | absorb shield at HP thresholds | Gaara: Sand Shield |
| `enrage` | ATK/speed up at an HP threshold or after a timer | Gaara: Play Possum Jutsu |
| `elementSwap` | changes its active nature | Aoi: Blade of the Thunder Spirit (Water → Lightning) |
| `reflect` | telegraphed stance that reflects damage | Neji: Eight Trigrams: Palm Rotation |
| `lifesteal` | heals from damage dealt | Kisame: Shark Skin |
| `reviveOnce` | comes back once at X% HP | Sasuke: Heavens' Curse Mark |
| `regen` | heals a % of max HP per second | Kabuto: Healing Jutsu |
| `rally` | periodic ATK buff for allies | Ranmaru |

**Objectives:**
* `defeatAll`
* `survive` (X seconds, or defeat everyone)
* `protect` (an escort that must live; divers go for it)
* `defeatBoss` (only `boss:true` units matter)

**Team rules per node:**
* `forced` (unowned forced ninja join as level-matched loaners; owned ones below the node's enemy level are raised to it for that battle, keeping their stars)
* `leader` (`'none'` or a fixed Leader)
* `banned`
* `recommended` (small Auto-pick bonus)

Example: the Survival Test forces Naruto, Sakura and Sasuke with no Leader and benches Kakashi, since he is the examiner. "The Third Hokage's Last Stand" is a flashback-style node where you fight as Hiruzen.

---

## 5. Gacha

* **Rates:** Genin (Common) 60%, Chunin (Rare) 28%, Jonin (Epic) 10%, Kage (Legendary) 2%.
* **Guarantees:** every 10-pull has at least one Jonin or better, and pity guarantees a Kage by pull 50 (counter shown on the Summon screen, shared across banners).
* **Cost:** 100 scrolls for a single, 900 for a 10-pull. Buttons are disabled, with a message, when you can't afford them.
* **Tickets** (achievement rewards): a summon ticket is one free summon on any open banner; a Rare+ ticket is a summon that gives at least a Chunin (Rare). Tickets count toward pity like any summon.
* **Banners:**
  * Standard (always open).
  * One arc banner per story arc. It opens when you reach the arc and gives its featured ninja 50% of their tier's rate.
  * Featured villains show "joins after …" until their arc is cleared.
* **Animation:** a scroll unrolls, then a flash in the rarity colour. Kage pulls get a bigger flash, particle burst and glow. Tap to skip.
* **Tiers reflect canon power**, not just rank. The Sannin and the Third Hokage are Kage; Sakura, Ino and the other rookie genin are Genin.
  * To keep every tier viable, rarity multipliers are small (1.0 / 1.12 / 1.25 / 1.4), so a 5★ Genin (×1.4) matches a 1★ Kage.
  * Late-game power growth comes from **alternate forms**: two Part I forms, plus seven Part II forms (Sage Mode and Six Paths Sage Mode Naruto, Eternal Mangekyo Sharingan Sasuke, Hundred Healings Sakura, Mangekyo Sharingan Kakashi, Eight Inner Gates Guy, Fifth Kazekage Gaara).
  * One form is never in any banner: **Naruto Uzumaki (Nine-Tails Chakra Mode)**, the reward for completing Part I and Part II (§11). It is a sidegrade, not an upgrade over Six Paths Sage Mode Naruto, and joins at the level of your best Naruto form.

## 6. Progression and economy

* **Levels** cost Ryo on a linear curve (`60 + 34 × level`); the level cap is 100.
* **Catch-up discount:** a ninja 5 or more levels behind your best one levels up 60% cheaper, so bringing a nature counter off the bench is affordable.
* **Starting save:** Naruto, Sakura, Sasuke, with Kakashi as Leader, plus 1,500 scrolls and 500 Ryo, and the Academy's 300 scrolls and 450 Ryo (paid whether you finish it or skip it).
* **Pacing:** free-to-play bots (`npm run campaign`: the tutorial first, achievements claimed as they unlock) finish Part I at median team level 37 vs enemy level 30, and Part II at median 98 vs enemy level 94, with about 24k Ryo left (mostly the final boss and arc-clear payout). Late Part II Ryo rewards are capped (first clears from node 73, arc bonuses from Pain's Assault) so teams stop short of the level cap. Achievements add about 2 levels by the end of Part II (BALANCE.md §4).

| Arc | Enemy level at the end |
|---|---|
| Prologue: Survival Test | 3 |
| Land of Waves | 8 |
| Chunin Exams | 12 |
| Destruction of the Hidden Leaf Village | 16 |
| Search for Tsunade | 20 |
| Land of Tea Escort Mission | 23 |
| Sasuke Retrieval Squad | 28 |
| Kurosuki Family Removal Mission | 30 |
| Kazekage Rescue Mission | 35 |
| Tenchi Bridge Reconnaissance Mission | 39 |
| Twelve Guardian Ninja | 42 |
| Akatsuki Suppression Mission | 46 |
| Three-Tails' Appearance | 49 |
| Itachi Pursuit Mission | 51 |
| Tale of Jiraiya the Gallant | 55 |
| Fated Battle Between Brothers | 59 |
| Six-Tails Unleashed | 62 |
| Pain's Assault | 67 |
| Five Kage Summit | 70 |
| Fourth Great Ninja War: Countdown | 74 |
| Fourth Great Ninja War: Confrontation | 79 |
| Fourth Great Ninja War: Climax | 84 |
| Kakashi: Shadow of the ANBU Black Ops | 87 |
| Birth of the Ten-Tails' Jinchuriki | 90 |
| Kaguya Otsutsuki Strikes | 94 |

## 7. Boss Rush

* **Order:** Kisame → Deidara → Sasori → Hidan → Kakuzu → Itachi → Pain. This is the order of each member's main-fight arc in the anime (not debut order: Itachi debuts alongside Kisame). The rotation then loops, with each loop ×1.4 stats.
* **Rules:** HP and chakra carry over and nobody heals. Each boss has one telegraphed special (clashable), plus one passive twist.
* **Rewards:** per round from `economy.bossRush` curves. "Highest Round Reached" is saved.
* **Target:** a level-appropriate Jonin-heavy team reaches about round 4–5 (sim: median 5).

## 8. Presentation

* **Art:** coloured tokens with initials and emoji only; no official designs. Units are a round head with a plain headband plate, and a sash in the unit's nature colour.
* **Effects:**
  * Element-coloured bursts and rings, projectiles for ranged hits, clash beams, a top "announcer" line for jutsu and mechanics, and screen shake on ults.
  * Floating damage numbers: tinted when effective, grey when resisted, larger for crits.
* **Audio:** a Web Audio synth (hit, crit, effective, ult ready, ult fire, clash, pull reveal pitched by rarity, victory, defeat). The context unlocks on the first tap, and mute is saved.
* **Layout:**
  * Portrait: canvas on top, a nature-wheel/foe panel, and a thumb-reach ult grid.
  * Phone portrait (portrait viewport, canvas under 700 CSS px): the whole lane stays visible at ~0.3×, so units are drawn bigger instead. A unit's head is kept ~30 CSS px wide (up to 2.4× size), its bars, labels and wind-up banner scale with it (floating text half as much), and each side alternates between two rows so neighbours don't cover each other. The front row's bars sit under its feet. Desktop, landscape and tablets are unchanged.
  * Landscape: a large canvas with a portrait strip. Outside battle, wide screens and phones held sideways get a side tab rail instead of the bottom tab bar.
  * Tap targets are at least 44 px, transitions are 0.2 s, and reduced motion is respected. QA.md has the layout checklist and `tools/ui-audit.mjs`.
* **Game loop:** rAF with delta clamped to 50 ms and a fixed 1/30 s sim tick. It pauses when the tab is hidden.

## 9. New players: the Academy and screen tips

* **The Academy** (`js/content/tutorial.js`, `js/core/Tutorial.js`): three very easy battles on the night of Naruto's graduation, before the Survival Test, with the starter team.
  1. "Enter: Naruto Uzumaki!": team building, the Leader slot and roles (against Mizuki).
  2. "Transformation Jutsu": the Nature Wheel. The foe's nature is one the team is set up to counter.
  3. "Multi Shadow Clone Jutsu": Ultimates, Jutsu Clash and 🤖 Auto-ult. The team starts with full chakra and the foe winds up a jutsu to clash into.
* Lessons sit outside the story: no node index, never in the sims, autotune or economy curves, and not counted in the campaign sim's difficulty stats (its "new player" run does play them).
* **Skip tutorial** is on the welcome box, on every tutorial screen and in the pause menu during a lesson, and pays the same 300 scrolls and 450 Ryo as finishing. Existing saves that had cleared the Prologue skip it automatically and get the reward. Anyone can replay it from Settings or the Wiki (no reward).
* **Screen tips:** a one-time, dismissable card on the first visit to the Story map, Summon, Team, Character, Settings, Wiki, Achievements, Hard mode and the Daily challenge (seen tips are in the save). Settings → "Show tips again" brings them back.

## 10. The Wiki

* A Wiki tab on the main menu, and a **?** button on every screen that opens that screen's page.
* **Generated pages** (`js/wiki/WikiData.js`), built from the same data the game plays with, so they can't go stale: every ninja (stats, Ultimate, Leader buff, how to get them), every jutsu, the Nature Wheel as an interactive chart, every enemy and boss with its natures and techniques, every arc and battle, every banner with its rates, the Boss Rush, and every achievement. Search covers all of them.
* **Guides** (`wiki/guides/*.md`, rendered in game): How to play, Team composition (with sample teams), Nature Wheel and counters, Jutsu Clash explained, Summoning and pity, Levelling and economy, Hard mode and Daily challenge, Achievements, and What's new. Guides show config values through `{{fmt:path}}` placeholders, never typed numbers.
* `npm run validate` fails if any content has no page, a guide link doesn't resolve, or a guide types a guarded config value by hand (`tools/wiki-check.mjs`). Standing rule (CONTENT_GUIDE.md): a change to a system updates its guide in the same commit.

## 11. Achievements

* 21 achievements in four groups (`js/content/achievements.js`; targets and rewards in `balance.achievements`):
  * **Story:** Academy Graduate, Part I Complete, Believe It! (Part I and Part II), No Holding Back (a Hard clear), Part I on Hard, Part II on Hard.
  * **Collection:** Growing Squad, Village Roster, A Village of Legends (own 10 / 25 / 45 ninja), Five Natures, Every Form, Peak Condition.
  * **Combat:** Not a Scratch (a win with nobody down), Against the Odds (a win with a Poor or Bad matchup), Clash Master, Giant Killer (a boss 5+ levels above you), Akatsuki Hunter (Boss Rush round 7).
  * **Account:** First Summon, Linked Up (Google), Daily Training (7 days played), Challenger (5 Daily clears).
* None depend on luck alone. Rewards are mostly Ryo and summon tickets, with a few Rare+ tickets; the top one (Part I and Part II complete) also gives the exclusive Naruto form (§5).
* They unlock by themselves, including retroactively for old saves, with a toast. Rewards are claimed on the Achievements screen (🏆 in the top bar). Everything is stored in the save.

## 11b. The start flow (Session 5)

* **Splash and intro** (`js/ui/Intro.js`, timings in `js/core/StartFlow.js` `INTRO`): a fixed overlay above the app while it loads. First visit: a 0.8 s splash, then five ninja silhouettes (the battle token in CSS) run across a dusk band and the title slams in with a shake and a flash, 2.8 s in all. Tap, Skip or the back button ends it. Seen once (a device preference, not the save), later loads get a 0.5 s splash; Settings → Replay the intro. `prefers-reduced-motion`: fades only.
* **Start menu** (`js/ui/StartScreen.js`, `StartFlow.menuModel`): the first screen. No cloud session exists until the player picks **Continue as guest** (the anonymous account) or **Sign in with Google**; the Wiki and Settings open from the menu without either (tab bar hidden, "‹ Menu" back). A browser with a session gets one **Continue** ("Signed in as <name>" or "Guest save"); guests keep **Sign in with Google** to link. Cloud off: **Play**. Unreachable: **Play offline** and **Try again**. A deep link (`#wiki/…`) opens once the player enters. The Android back button skips the intro and stays on the menu.
* **Sign-in** reuses the Session 3 paths (`FirebaseBackend.signInWithGoogle` / `linkGoogle`, the "cloud save is newer" prompt after entering). Phones use the redirect flow; the page comes back, `init()` picks the result up (`getRedirectResult`) and the game enters by itself.
* **Build stamp** (`js/core/Version.js`): "v<short sha> · <UTC build date>" bottom-right of the menu and of Settings › About, from `version.json`, which the Pages deploy workflow writes (never committed); "dev" locally.

## 12. Endgame: Hard mode and the Daily challenge

**Hard mode** (`balance.hardMode`):
* Opens for each part once every battle of it is cleared. The Story map gets a Story / 💀 Hard switch, and Hard battles unlock one after another.
* Same battles, enemies `levelOffset` (12) levels higher (up to the level cap), bosses ×`bossMult` (1.5) HP and ATK, then per-boss `hardMode.nodeMult` from `npm run autotune -- --mode=hard`.
* Rewards are the story's for the same battle × `hardMode.rewards`: a first clear pays the story's first-clear scrolls again and a little Ryo; replays pay 1.5× the scrolls and 1.25× the Ryo of a story replay; clearing an arc on Hard pays a bonus. Tuned so finishing Part I on Hard before Part II doesn't break Part II's curve (BALANCE.md §4).
* Tuned for the **Hard on-curve team** (everyone unlocked by the end of the part, starred up): every Hard arc boss lands at 50–70% in `npm run sim`, and the counter-gap bands hold on Hard.

**Daily challenge** (`balance.daily`, `js/core/Daily.js`):
* Opens after the Land of Waves. Each day picks a boss from an arc you have cleared, fought at your story level, with a **twist**: Locked nature (every enemy takes the day's nature), No Ultimates, Boss gauntlet (3 bosses back to back, no healing), or Countered (enemies take the nature that beats your team's main one). Twists that take something away from you come with weaker enemies (`twists[].power`).
* Picked from the date alone (no server): the same date and the same story progress give the same challenge.
* 3 attempts a day. The first clear pays 150 scrolls plus Ryo that grows with your story progress. A new challenge arrives at local midnight.
* The Team screen can build for the Daily, so matchups and ✨ Auto use the day's natures.
* `npm run sim` checks (info only) that every twist is clearable within the day's attempts.

## 13. Settings and saves

* **Battle:** battle speed (1× / 2×), start battles with Auto-ult on, and the Auto-ult mode (clash-aware or fire when ready).
* **Help:** show tips again, replay the tutorial.
* **Audio and visuals:** sound on/off. Music, a separate effects switch and effect detail are disabled placeholders until the audio and VFX pass.
* **Account and cloud save:** link or sign in with Google, use cloud save as a guest, sign out, sync now, and the save's status (connecting, couldn't connect with Try again, last synced, last upload failed). The game never waits for the cloud: it plays from the local save and reconnects when the browser comes back online.
* **Your save:** export and import as a text code, and reset (you type RESET to confirm).
* **About:** the version number (`js/config/version.js`) and a link to the Wiki's "What's new".

## 14. Notes for later sessions

* Shippuden content is **data only** (`arcs/shippuden.js`, roster, enemies, banners); no engine code changed for it. See CONTENT_GUIDE.md.
* **The enemy level curve continues by global node index.** Part II ends at node 99 (level 94); the level cap is 100, reached around node 105.
* Run `npm run autotune -- --write` and `npm run autotune -- --mode=hard --write` after adding bosses. They tune only `balance.enemyScaling.nodeMult` and `balance.hardMode.nodeMult`.
* Every new name needs a source in `tools/naming-sources.mjs` (NAMING.md). `npm run validate` warns otherwise.
