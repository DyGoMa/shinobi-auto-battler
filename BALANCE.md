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
| Nature Wheel matters more | `natureWheel.advantage` / `.disadvantage` | `1.12 / 0.95` → `1.3 / 0.8` | Countering becomes decisive, but re-run autotune and check the counter-gap scenario (§6) — a steeper wheel over-punishes countered teams. |
| Nature Wheel matters less | same | → `1.05 / 0.98` | The team's nature barely matters. |
| **Turn off Jutsu Clash** | `jutsuClash.enabled` | `true` → `false` | Ults ignore enemy wind-ups (they still telegraph). |
| Clashes are more rewarding | `jutsuClash.overpowerUltMult` | `1.35` → `1.6` | Overpowered clashes hit 60% harder. |
| Losing a clash hurts less | `jutsuClash.overwhelmedChakraRefund` | `0.85` → `0.9` | An Overwhelmed ult gives back more chakra. Keep it below 1. |
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

`npm run sim` plays 200 seeded battles per scenario (more for the counter-gap scenario, see below) with the **clash-aware bot** — the same one the in-game 🤖 Auto-ult uses (`botUlts('smart')`): it fires counter-nature units into enemy wind-ups and holds units that would be Overwhelmed. `SIM_BOT=asap` switches every scenario to the fire-when-ready bot instead, for comparison; the sim also prints both bots' numbers for the boss and counter-gap scenarios.

| Scenario | Target (in `targets`) |
|---|---|
| Survival Test (first node) with the starter team at level 1, **no ults** | win ≥ 80% (`bellTestMinWin`) |
| Each arc boss (Part I and Part II), "on-curve" team | win 50–70% (`bossWinRange`) |
| Boss Rush, Jonin-heavy team at level 32 | median round 4–5 (`bossRushRoundRange`) |
| Nature check: same team re-typed to counter vs be countered | gap ≥ 25% (`natureCheckMinGap`) |
| Counter-gap scenario: 3 of 4 units countered | win 25–30% (`counterGap3of4Range`) |
| Counter-gap scenario: all 4 units countered | win 10–15% (`counterGapFullyRange`) |
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
* `nodeMult` values were set by `npm run autotune` (bisection on a 200-battle sample per boss, clash-aware bot since Session 3b).
* Economy values were tuned by hand until 30 simulated free-to-play players all cleared Part 1 (they finish around team level 34–39 vs enemy level 30).
* Session 3 capped the late Part II Ryo curves (`cap` on `nodeFirstClear.ryo` 8,500, `nodeReplay.ryo` 10,000, `arcClearBonus.ryo` 9,000). Part I and early Part II rewards are unchanged. Campaign sim, 10 players: end of Part I 35.5 / 11,255 Ryo (unchanged); end of Part II **99.0 → 95.5** vs enemy level 94, median Ryo **32,326 → 24,122** (the old range reached 71,697 for players stuck at the level cap). The end-of-part lines at the bottom of `npm run campaign` print these numbers.
* Session 3b re-tuned every `nodeMult` for the clash-aware bot (§6) and re-ran the campaign sim: end of Part II **95.5 → 96.3**, median Ryo 24,122 → 23,580 (10 players, no node above 1/10 stuck).
* If you change a global value (`statMult`, `bossMult`, `ult`, `chakra`, `natureWheel`, `jutsuClash`), re-run `npm run autotune -- --write`, then `npm run sim` and `npm run campaign`.

## 5. Safety rails
* `npm run validate` fails if the gacha rates don't add up to 1, if any curve produces a non-number, or if enemy levels exceed `stats.levelCap` before node 90.
* The debug panel's edits are **not saved**. Reload the page to go back to the file's values.

## 6. Countered teams and Jutsu Clash (Session 3b: bands reached)

**Goal:** at equal level and rarity, a team with 3 of 4 units countered wins 25–30%, a fully countered team wins 10–15%, and the countering team still wins a clear majority.

**Session 3's mistake:** it measured the gap at the Land of Waves boss with no level offset, where even a *neutral* team only won 24–35%. Against that baseline, asking a mostly-countered team to win 25–30% was asking it to do as well as a neutral team — mathematically impossible without breaking the wheel entirely.

**Session 3b's fix — a dedicated counter-gap scenario:** the same fight (Land of Waves boss, `n_waves_5`, Water), but the on-curve team is levelled `targets.counterGapLevelOffset` (**+1.6**) above the node, where a **neutral** re-typed team wins **~60%** — the same neighborhood as the boss-win target, so "countered" and "counters" numbers are measured against a real, contested baseline. `npm run sim` uses this fight (`targets.counterGapNode`) for every counter-gap measurement, prints counter / 3-of-4 / fully-countered / neutral win rates every run (with both bots, under "Counter-gap scenario"), and checks the two bands as PASS/FAIL rows. The bands are narrow (5 points), so the sim runs this scenario at `max(N, 600)` battles per cell to keep the check stable.

**What Session 3b changed:**
1. **Overwhelmed now also blocks the enemy jutsu**, same as a Standoff/Cancelled clash (`BattleSim._cancelTelegraph`, tested in `test-core.mjs`). Before, an Overwhelmed ult dealt no damage *and* the enemy jutsu still landed at ×0.55 (weakened but not blocked) — a double punishment for a team that clashed with the wrong nature. Now the three outcomes stay distinct: **Overpowered** (bonus damage, caster stunned, chakra back), **Cancelled/Standoff** (both jutsu fizzle, ult still hits at ×0.5, no chakra back), **Overwhelmed** (both jutsu fizzle, ult deals no damage, chakra back). This mainly helps a **Tank that guards** a losing clash — previously it ate a weakened hit anyway; now it takes nothing.
2. `natureWheel.advantage` / `.disadvantage`: **1.3 / 0.8 → 1.12 / 0.95** (config, was already tunable). A flatter wheel is required because the wheel multiplies attacker-favoured damage in *both* directions: a countered team's attacks are reduced (`disadvantage`) *and* the boss's attacks on them are amplified (`advantage`, since the boss's nature now beats theirs) — so 3.3× total swing between a countered and countering matchup at the old 1.3/0.8, before Jutsu Clash even applies.
3. `jutsuClash.overwhelmedChakraRefund`: **0.5 → 0.85**. The wheel alone could hit the 3-of-4 band but left "fully countered" a few points under its band (a fully countered team has no counter-nature unit to fall back on, so only the chakra economy helps it recover); a bigger refund was needed on top of the flatter wheel.

**The trade-off table** (counter-gap scenario, clash-aware bot, 800–2000 battles per cell; counter/neutral rounded):

| `natureWheel.advantage / disadvantage` | `overwhelmedChakraRefund` | Counter | 3 of 4 countered (target 25–30%) | Fully countered (target 10–15%) |
|---|---|---|---|---|
| 1.30 / 0.80 (old) | 0.5 (old) | ~100% | 4% | 0% |
| 1.10 / 0.95 | 0.50 | ~98% | 33% | 10% |
| 1.10 / 0.95 | 0.60 | ~98% | 33–34% | 10–11% |
| 1.12 / 0.95 | 0.50 | ~98% | 30–32% | 7–8% |
| 1.12 / 0.95 | 0.70 | ~98% | 27% | 7% |
| **1.12 / 0.95 (final)** | **0.85 (final)** | **~98%** | **26%** ✅ | **14%** ✅ |
| 1.11 / 0.96 | 0.85 | ~98% | 28% ✅ | 16% (over) |

**Why the counter team's win rate barely moved:** the search asked to compare counter-team rates near 70% / 75% / 80%, but at this scenario's neutral baseline (~60%) even the flattest wheel tried (1.02–1.10) still won ~95–98% with the +12–30% nature bonus stacked on top of an already-winnable fight — there's no wheel setting in the useful range that both meaningfully separates counter from neutral *and* drops counter below ~95%. The chosen wheel is already close to the flattest setting that still lands the 3-of-4 and fully-countered bands, so **~98%** is what "a clear majority" looks like at this node. The stop-condition in the brief (report the closest result if the bands can't be hit with counter ≥ 65%) never triggered — the picked setting reaches both bands with counter far above that floor.
* Autotune was re-run after the wheel/refund change (every boss's `nodeMult`, since the flatter wheel and the clash-aware default bot both shift win rates); see §4.
* Campaign sim after the change: still 10/10 free-to-play players clear Parts I–II, no node above 1/10 stuck (median final team Lv 96.3 vs enemy 94, unchanged from before this session within noise).
