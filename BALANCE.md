# BALANCE.md: how to rebalance the game (no programming needed)

**Everything that is a number lives in one file: `js/config/balance.js`.**
You can make the game harder, easier, faster, richer or stingier by changing
numbers there and nowhere else. Every value has a comment saying what it does
and a sensible range.

## 0. The 60-second version

1. Open `js/config/balance.js` in any text editor.
2. Change a number, for example `statMult: { hp: 3.2, atk: 2.5, def: 1.0 }` → `hp: 3.5`.
3. Save the file, then run the checks:
   ```bash
   npm run validate
   ```
   ```bash
   npm run sim
   ```
   ```bash
   npm run campaign
   ```
   Each prints PASS or FAIL for its targets.
4. Refresh the game in your browser to feel the change.
5. **Faster:** open the game with `?debug=1` at the end of the address (for example `https://…/shinobi-auto-battler/?debug=1`). The **🛠 Debug** button lets you edit every value live, with no saving or reloading. When you're happy, press **Export balance.js** and paste the result over the old file. (The export has no comments. Keep the original file's comments by copying only the numbers you changed.)

## 1. Reading the file

Most values are plain numbers. Values that *scale* (with level, node number,
round number…) are **curves**, written like this:

| Curve | Formula | Example | Reads as |
|---|---|---|---|
| `{ type: 'linear', base: 60, growth: 34 }` | base + growth × x | level-up cost | "60 Ryo, plus 34 more for every level" |
| `{ type: 'poly', base: 1.25, growth: -0.75 }` | base × x^growth | group scaling | "shrinks as x grows" |
| `{ type: 'exp', base: 2, growth: 1.1 }` | base × growth^x | (not used yet) | "grows 10% per step" |
| `{ type: 'step', base: 1, table: [[10, 1.2], [20, 1.5]] }` | table lookup | (not used yet) | "1 until x=10, then 1.2, from 20 on 1.5" |

Any curve can also have `cap:` (a maximum), `min:` and `round: true`.
**x** is explained in each comment: a level, a node number (counted from 0
across the whole campaign), an arc number, or a Boss Rush round.

## 2. The knobs that matter most

| I want to… | Change | From → To (example) | What happens |
|---|---|---|---|
| **Make Part 1 20% harder** | `enemyScaling.partMult` | `1: 1.0` → `1: 1.2` | Every Part 1 enemy gets +20% HP **and** +20% ATK (Part 2 untouched). That is steep: see the worked example below. |
| Make *every* enemy tougher | `enemyScaling.statMult.hp` | `3.2` → `3.6` | +12.5% enemy HP everywhere. Fights get longer. |
| Make enemies hit harder | `enemyScaling.statMult.atk` | `2.5` → `2.8` | +12% enemy damage. Fights get shorter and riskier. |
| Make **one** boss easier | `enemyScaling.nodeMult.n_tea_3` | `1.48` → `1.35` | Only the Land of Tea boss changes. (Node ids are in `js/content/arcs/part1.js`.) |
| Make all bosses easier | `enemyScaling.bossMult.hp.base` | `2.4` → `2.1` | Every boss has ~12% less HP. |
| Enemies level up faster through the story | `enemyScaling.levelByNode.growth` | `0.95` → `1.1` | Node 32 goes from level 30 to level ~35. The player needs more Ryo. |
| Level-ups cost less | `economy.levelUpCost.growth` | `34` → `28` | Each level is ~17% cheaper at level 30. |
| More Ryo from the story | `economy.nodeFirstClear.ryo.base` | `520` → `700` | Every first clear pays 180 more Ryo. |
| Farming pays more | `economy.nodeReplay.ryo.growth` | `130` → `160` | Replays of later nodes pay a lot more. |
| More summons | `economy.nodeFirstClear.scrolls.base` | `160` → `200` | +40 scrolls per first clear (~15 extra pulls over Part 1). |
| Cheaper summons | `economy.pullCost` | `single: 100, ten: 900` → `80, 720` | 20% cheaper pulls. |
| Luckier summons | `gacha.rates` | Kage `0.02` → `0.03` (take 0.01 from `genin`) | The rates **must add up to 1**. `npm run validate` checks this. |
| Kage pity sooner | `gacha.pity` | `50` → `40` | A Kage is guaranteed by pull 40. |
| Stars matter more | `stats.starBonus` | `0.10` → `0.15` | +15% stats per star. A 5★ Genin then outclasses a 1★ Kage. |
| Ultimates come faster | `combat.chakra.perAttackSecond` | `7.5` → `9` | Roughly one ult every ~10 s instead of ~12 s. |
| Ultimates hit harder | `combat.ult.single` / `.aoe` | `4.2 / 2.3` → `5 / 2.8` | Bigger burst. Boss fights get shorter. |
| Nature Wheel matters more | `natureWheel.advantage` / `.disadvantage` | `1.3 / 0.8` → `1.5 / 0.7` | Countering becomes decisive. Wrong teams get punished harder. |
| Nature Wheel matters less | same | → `1.15 / 0.9` | The team's nature barely matters. |
| **Turn off Jutsu Clash** | `jutsuClash.enabled` | `true` → `false` | Ults ignore enemy wind-ups (they still telegraph). |
| Clashes are more rewarding | `jutsuClash.overpowerUltMult` | `1.35` → `1.6` | Overpowered clashes hit 60% harder. |
| Longer wind-ups (easier to clash) | `enemyScaling.enemyJutsu.windup`, `bossMechanics.telegraphAoE.windup` | `2 / 3` → `3 / 4` | More time to react. |
| A shorter "survive" in the Survival Test | `objectives.surviveTimeMult` | `1.0` → `0.8` | Every "survive X s" objective drops to 80% of X. |
| A tougher Boss Rush | `bossRush.statMultByRound.base` | `0.39` → `0.45` | Every round's boss is ~15% stronger. |
| Loops ramp harder | `bossRush.loopMult` | `1.4` → `1.6` | After Pain, each loop is +60%. |

### Worked example: "make Part 1 20% harder"
1. Find `partMult: { 1: 1.0, 2: 1.0, 3: 1.0 },` in `enemyScaling`.
2. Change it to `partMult: { 1: 1.2, 2: 1.0, 3: 1.0 },`. Every Part 1 enemy now has 20% more HP **and** 20% more ATK.
3. Know what that does, because both stats go up at once and win rates are steep. Measured with the sim (on-curve team, boss nodes):

   | `partMult[1]` | Typical boss win rate |
   |---|---|
   | 1.0 (current) | ~60% |
   | 1.05 | ~40% |
   | 1.1 | ~18% |
   | 1.2 | ~2% |

   So a flat +20% makes on-curve bosses nearly unbeatable; players need roughly 6–7 extra levels to catch up. For "noticeably harder but fair", **1.05–1.1** is usually what you want.
4. Run `npm run sim`. It will report FAIL for the 50–70% boss target, which is expected. If this is the difficulty you want, loosen `targets.bossWinRange` (for example `[0.3, 0.5]`) so the check matches your new goal.
5. Run `npm run campaign` to see whether a free-to-play player can still get through. If it reports stuck points, give more Ryo (`economy.nodeFirstClear.ryo`, `economy.nodeReplay.ryo`) or cheaper levels (`economy.levelUpCost`).

### Worked example: "one boss is a wall"
The campaign report lists "Most common stuck points".
* Lower that node's number in `enemyScaling.nodeMult` by ~0.1 at a time.
* Or run `npm run autotune -- --only=n_tea_3 --write`. It finds the value that gives about a 60% win rate for an on-curve team and writes it into `balance.js` for you.

## 3. What the checks mean

`npm run sim` plays 200 seeded battles per scenario with a bot that fires every Ultimate as soon as it's ready:

| Scenario | Target (in `targets`) |
|---|---|
| Survival Test (first node) with the starter team at level 1, **no ults** | win ≥ 80% (`bellTestMinWin`) |
| Each arc boss (Part I and Part II), "on-curve" team | win 50–70% (`bossWinRange`) |
| Boss Rush, Jonin-heavy team at level 32 | median round 4–5 (`bossRushRoundRange`) |
| Nature check: same team re-typed to counter vs be countered | gap ≥ 25% (`natureCheckMinGap`) |
| Boss fight length | median 30–60 s (`fightLengthRange`) |

**"On-curve" team** (`targets.onCurve`):
* Level = that node's enemy level.
* Stars: Genin 3★, Chunin 2★, Jonin 1★, Kage 1★.
* The strongest lineup of one Jonin, two Chunin and one Genin available at that point in the story, chosen **without** looking at natures, so bosses are tuned for a typical team, not a perfect counter.
* A node's forced ninja always play. If one is outside that tier mix (a forced Kage such as Jiraiya), they take the Genin slot.

`npm run campaign` simulates free-to-play players (10 by default). Each one:
* Pulls whenever they can afford to.
* Levels their team.
* Picks teams by nature matchup.
* When they lose: farms the last cleared node (max 3 replays per stuck node), rotates in counters, and retries.

It reports team level per arc, pulls, scroll/Ryo balance and stuck points. **Target:** every player clears the whole story (Part I and Part II) with no node needing more than 3 replays. `SIM_PARTS=1` limits both sims to Part I.

## 4. Where the current numbers came from
* `nodeMult` values were set by `npm run autotune` (bisection on a 200-battle sample per boss).
* Economy values were tuned by hand until 30 simulated free-to-play players all cleared Part 1 (they finish around team level 34–39 vs enemy level 30).
* If you change a global value (`statMult`, `bossMult`, `ult`, `chakra`), re-run `npm run autotune -- --write`, then `npm run sim` and `npm run campaign`.

## 5. Safety rails
* `npm run validate` fails if the gacha rates don't add up to 1, if any curve produces a non-number, or if enemy levels exceed `stats.levelCap` before node 90.
* The debug panel's edits are **not saved**. Reload the page to go back to the file's values.

## 6. Why a countered team can't win (Session 2 measurement, open for Session 3)

**Goal that was tested:** at equal level and rarity, a fully countered team should win 25–30%, and the countering team should still clearly win most fights.

**Result: no single value reaches that band without changing the Jutsu Clash rules, so nothing was changed.** `npm run sim` now prints the numbers under "Nature check detail" on every run.

The nature check puts the same on-curve team, re-typed, against the Land of Waves boss (Water, level 8). 200 seeded battles per cell:

| What was changed | Counter (Earth) | Neutral (Lightning) | Countered (Fire) |
|---|---|---|---|
| Nothing (wheel 1.3 / 0.8, Jutsu Clash on) | 98% | 34% | **0%** |
| Wheel damage switched off (1 / 1) | 68% | 34% | 1% |
| Jutsu Clash switched off | 97% | 23% | 0% |
| Both off | 23% | 23% | 23% |
| Wheel scaled to half (1.15 / 0.9) … a tenth (1.03 / 0.98) | 85% … 72% | 34% | 0% |
| No damage penalty for the countered side, and Overwhelmed cancels the enemy jutsu (`overwhelmedJutsuMult` 0), clash-aware bot | 98% | 35% | **10%** (best that keeps the clash rules) |
| Overwhelmed ults still land at 85–90% power, plus ~10–15% of the countered side's damage penalty | 98% | 34% | 24–33% |

What drives it:
* **Jutsu Clash, more than damage.** A neutral team's Ultimates cancel the boss's telegraphed Water jutsu (Standoff), and a countering team's stun the boss (Overpower). A countered team's are simply spent (Overwhelmed) while the jutsu still lands. The fire-when-ready bot, which is also what the in-game 🤖 Auto-ult button uses, keeps firing into the same wind-up, wasting ~5 Ultimates a fight.
* **The win curve is steep.** The countered team needs about **+6 levels** to reach 17–33%, while a neutral team at +1 level already wins 54%.
* The damage-only candidates (lower the multipliers, cap the wheel's share of damage, mixed-team bonus) leave the countered team at 0–5%. A mixed-team bonus can't help an all-countered team by definition.
* The only setting that reached the band made an **Overwhelmed** Ultimate still hit at ~85% power. That erases the point of the Overwhelmed outcome (DESIGN.md §3) and only helps auto-fire play: a player reading the ▼ badge would still be at ~10%. So it was not applied.

**Options for Session 3** (each needs a design decision, not just a number):
1. Switch the in-game 🤖 Auto-ult to the existing clash-aware mode (`botUlts('smart')`), so auto players stop wasting Ultimates. It won't lift the countered team much on its own.
2. Let an Overwhelmed clash still cancel the enemy jutsu (spend your ult to block theirs). That is a rule change in `BattleSim.fireUlt`.
3. Accept a steep wheel, and measure "countered" against a mixed team instead of a mono-nature re-type.
