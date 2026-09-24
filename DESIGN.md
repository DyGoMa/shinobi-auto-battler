# DESIGN.md — Shinobi Auto-Battler

A Naruto-universe 2D lane auto-battler for the web. Your ninja walk and fight
on their own; **you** decide the team, read the Nature Wheel, and choose when
to fire each Ultimate, especially whether to spend it on a **Jutsu Clash**.

All numbers in this document come from `js/config/balance.js` and can change
there. Names follow the English dub (see NAMING.md).

---

## 1. Core loop

1. **Story**: fight through Part I in anime episode order (8 arcs, 32 nodes). Each arc ends with a boss that has data-defined mechanics.
2. **Rewards**: first clears pay scrolls and Ryo, replays pay Ryo (and a few scrolls), and clearing a whole arc pays a bonus.
3. **Summon**: scrolls buy pulls on the Standard banner or the current arc's banner (rate-up). Villains join the pools after their arc is cleared.
4. **Upgrade**: Ryo buys levels. Duplicate pulls add stars (+10% stats each, up to 5★), and duplicates past 5★ refund Ryo.
5. **Team**: 3 members + 1 Leader, chosen per node by nature matchup and lane reach.
6. **Boss Rush**: after clearing the Sasuke Retrieval Squad arc, fight the Akatsuki back to back with no healing between rounds.

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
* Some nodes remove the Leader (Bell Test) or force one (the Third Hokage's Last Stand).

### 2.5 Nature Wheel (canon)
`Fire › Wind › Lightning › Earth › Water › Fire`
* **Effective** = ×1.3 and **resisted** = ×0.8. Damage numbers are tinted with the element and pop "EFFECTIVE!" or "resisted".
* **Multi-nature characters** attack with whichever of their natures is best against the current target. Their *first* nature is the one they defend with.
* **Taijutsu specialists** (Rock Lee, Might Guy) are neutral. They are never resisted and ignore 15% of enemy DEF.
* **Where the wheel shows up in the UI:**
  * **Before a node:** the node panel lists every enemy nature, including boss specials and element swaps.
  * **Team Builder:** a live matchup rating (1–5 ★, from "Bad" to "Great"), and ▲/▼ markers on each ninja.
* Natures follow canon (NAMING.md explains the rule for each character).
* Because the multiplier applies to both offense and defense, a counter team is roughly 2.6× stronger than a countered one. That's by design: `npm run sim` checks it ("Nature check": 98% vs 0%).

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
| **STANDOFF** | neutral / no nature | Both cancel; your ult still resolves at ×0.5 |
| **OVERWHELMED** | their nature beats yours | Your ult is spent; their jutsu lands at ×0.55 (blunted) |

4. **Roles:**
   * **Taijutsu** specialists can never be Overwhelmed (their worst case is Standoff).
   * A **Tank** that clashes always pulls the jutsu onto itself with +50% damage reduction. That's a "guard" play: it takes a boss's team-wide special alone.
5. **Readable:** while a wind-up is active, every ready portrait shows a badge (▲ OVERPOWER / = STANDOFF / ▼ WEAK) predicting the result. The first battle teaches it with an onboarding tip.

### Why it meets the brief
* **Naruto theme:** jutsu clashes are the series' iconic moments (Chidori vs Rasengan, Fire vs Water).
* **Real decision:** fire now for damage and chakra tempo, or hold for a clash? And *which* ninja takes it: the counter-nature striker, or the tank to guard?
  * The sim measures the payoff (`npm run sim`, same teams and seeds). A bot that clashes on purpose beats the fire-when-ready bot on 7 of 8 Part 1 bosses: Final Valley 58% → 93%, Kurosuki 65% → 90%, Land of Tea 66% → 85%, Chunin Exams 62% → 71%, Land of Waves 60% → 70%.
  * The exception is the Bell Test boss (66% → 61%). Kakashi's special has no nature, so holding ults for it is rarely worth it: the decision cuts both ways.
* **Taps only:** one tap on a portrait. There are no combos and no gestures.
* **Nature wheel and team composition:** the outcome *is* the wheel, and it rewards bringing counters and a Tank.
* **Tunable, with an on/off flag:** `balance.jutsuClash` has `enabled` plus every multiplier. The enemy wind-up time is `enemyScaling.enemyJutsu.windup`, and the boss wind-up is `bossMechanics.telegraphAoE.windup`.
* **Scales to ~30 new characters:** it reads only data that every character already has (natures, role, taijutsu flag) and every enemy jutsu/special, with no per-character code. Session 2 content gets clashes for free.

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
* `forced` (unowned forced ninja join as level-matched loaners)
* `leader` (`'none'` or a fixed Leader)
* `banned`
* `recommended` (small Auto-pick bonus)

Example: the Bell Test forces Naruto, Sakura and Sasuke with no Leader and benches Kakashi, since he is the examiner. "The Third Hokage's Last Stand" is a flashback-style node where you fight as Hiruzen.

---

## 5. Gacha

* **Rates:** Genin (Common) 60%, Chunin (Rare) 28%, Jonin (Epic) 10%, Kage (Legendary) 2%.
* **Guarantees:** every 10-pull has at least one Jonin or better, and pity guarantees a Kage by pull 50 (counter shown on the Summon screen, shared across banners).
* **Cost:** 100 scrolls for a single, 900 for a 10-pull. Buttons are disabled, with a message, when you can't afford them.
* **Banners:**
  * Standard (always open).
  * One arc banner per story arc. It opens when you reach the arc and gives its featured ninja 50% of their tier's rate.
  * Featured villains show "joins after …" until their arc is cleared.
* **Animation:** a scroll unrolls, then a flash in the rarity colour. Kage pulls get a bigger flash, particle burst and glow. Tap to skip.
* **Tiers reflect canon power**, not just rank. The Sannin and the Third Hokage are Kage; Sakura, Ino and the other rookie genin are Genin.
  * To keep every tier viable, rarity multipliers are small (1.0 / 1.12 / 1.25 / 1.4), so a 5★ Genin (×1.4) matches a 1★ Kage.
  * Late-game power growth is meant to come from **alternate forms** (two Part 1 examples ship now; Session 2 adds Shippuden forms).

## 6. Progression and economy

* **Levels** cost Ryo on a linear curve (`60 + 34 × level`); the level cap is 100.
* **Catch-up discount:** a ninja 5 or more levels behind your best one levels up 60% cheaper, so bringing a nature counter off the bench is affordable.
* **Starting save:** Naruto, Sakura, Sasuke, with Kakashi as Leader, plus 1,500 scrolls and 500 Ryo.
* **Pacing** (free-to-play bots finish Part 1 at team level ~34–39, median 35.5, vs enemy level 30):

| Arc | Enemy level at the end |
|---|---|
| Bell Test | 3 |
| Land of Waves | 8 |
| Chunin Exams | 12 |
| Destruction of the Hidden Leaf Village | 16 |
| Search for Tsunade | 20 |
| Land of Tea Escort Mission | 23 |
| Sasuke Retrieval Squad | 28 |
| Kurosuki Family Removal Mission | 30 |

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
  * Landscape: a large canvas with a portrait strip.
  * Tap targets are at least 44 px, transitions are 0.2 s, and reduced motion is respected.
* **Game loop:** rAF with delta clamped to 50 ms and a fixed 1/30 s sim tick. It pauses when the tab is hidden.

## 9. Notes for Sessions 2 and 3

* Add Shippuden content as **data only**: `arcs/shippuden.js` (part 2), new roster entries (alternate forms use `formOf`), enemies with mechanic lists, and banners. Then swap the placeholder import in `content/index.js`. See CONTENT_GUIDE.md.
* **The enemy level curve continues by global node index.** Node 90 is level 86, and the level cap is 100.
* Run `npm run autotune -- --write` after adding bosses. It tunes only `balance.enemyScaling.nodeMult`.
* Every new name needs a source in `tools/naming-sources.mjs` (NAMING.md). `npm run validate` warns otherwise.
