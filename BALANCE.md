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
| Ultimates hit harder | `combat.ult.single` / `.aoeMain` / `.aoe` | `4.2 / 3.7 / 2.7` → `5 / 4.4 / 3.2` | Bigger burst. Boss fights get shorter. |
| Nature Wheel matters more | `natureWheel.advantage` / `.disadvantage` | `1.12 / 0.95` → `1.3 / 0.8` | Countering becomes decisive, but re-run autotune and check the counter-gap scenario (§6) — a steeper wheel over-punishes countered teams. |
| Nature Wheel matters less | same | → `1.05 / 0.98` | The team's nature barely matters. |
| **Turn off Jutsu Clash** | `jutsuClash.enabled` | `true` → `false` | Ults ignore enemy wind-ups (they still telegraph). |
| Clashes are more rewarding | `jutsuClash.overpowerUltMult` | `1.35` → `1.6` | Overpowered clashes hit 60% harder. |
| Losing a clash hurts less | `jutsuClash.overwhelmedChakraRefund` | `0.85` → `0.9` | An Overwhelmed ult gives back more chakra. Keep it below 1. |
| Longer wind-ups (easier to clash) | `enemyScaling.enemyJutsu.windup`, `bossMechanics.telegraphAoE.windup` | `2 / 3` → `3 / 4` | More time to react. |
| A shorter "survive" in the Survival Test | `objectives.surviveTimeMult` | `1.0` → `0.8` | Every "survive X s" objective drops to 80% of X. |
| A tougher Boss Rush | `bossRush.statMultByRound.base` | `0.39` → `0.45` | Every round's boss is ~15% stronger. |
| Loops ramp harder | `bossRush.loopMult` | `1.4` → `1.6` | After Pain, each loop is +60%. |
| **Hard mode** bosses tougher or softer | `hardMode.bossMult` | `1.5` → `1.3` | Every boss on Hard gets less extra HP and ATK. Then run `npm run autotune -- --mode=hard --write`, which re-tunes each Hard boss (`hardMode.nodeMult`). |
| Hard enemies further above the story | `hardMode.levelOffset` | `12` → `15` | Every Hard battle is 3 levels higher. Re-run the Hard autotune. |
| Hard mode pays more | `hardMode.rewards.firstClear` / `.replay` / `.arcClear` | first clear `ryo: 0.15` → `0.25` | Multipliers on the story's rewards for the same battle. Check with `CAMPAIGN_HARD=1 npm run campaign` that Part II doesn't start far ahead of the curve (§4). |
| A Daily twist is too hard or too easy | `daily.twists[].power` | No Ultimates `0.5` → `0.45` | Enemies on that twist get less HP and ATK. `npm run sim` prints each twist's chance to be cleared (Info, "Daily challenge"). |
| More Daily attempts | `daily.attemptsPerDay` | `3` → `5` | More tries per day; the reward is still paid once. |
| Achievements pay more | `achievements.list.<id>.reward` | `ach_part1: { rareTickets: 1 }` → `2` | Re-run `npm run campaign`: it claims achievements as they unlock (§4). |

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
| Counter-gap scenario: the same team re-typed neutral (the baseline) | win 55–65% (`counterGapNeutralRange`) |
| Counter-gap scenario: 3 of 4 units countered | win 25–30% (`counterGap3of4Range`) |
| Counter-gap scenario: all 4 units countered | win 10–15% (`counterGapFullyRange`) |
| Boss fight length | median 30–60 s (`fightLengthRange`) |
| Each arc boss **on Hard**, Hard on-curve team | win 50–70% (`bossWinRange`) |
| Hard nature check and Hard counter-gap scenario (neutral, 3 of 4, fully) | the same targets as the story's (§6) |
| Daily challenge, every twist (info only, not PASS/FAIL) | cleared within `daily.attemptsPerDay` tries at least `dailyMinClearChance` (50%) of the time; ⚠ flags a twist that isn't |

**"On-curve" team** (`targets.onCurve`):
* Level = that node's enemy level.
* Stars: Genin 3★, Chunin 2★, Jonin 1★, Kage 1★.
* The strongest lineup of one Jonin, two Chunin and one Genin available at that point in the story, chosen **without** looking at natures, so bosses are tuned for a typical team, not a perfect counter.
* A node's forced ninja always play. If one is outside that tier mix (a forced Kage such as Jiraiya), they take the Genin slot.

**Hard on-curve team** (`targets.hardMode.onCurve`): a player who cleared the part and brings their collection. Level = the Hard enemy level; stars Genin 4★, Chunin 3★, Jonin 2★, Kage 2★; the strongest Kage, two Jonin and a Chunin among everyone unlocked by the end of that part.

**Daily check** (`npm run sim`, Info): one player per arc from the Land of Waves on, with everything before that arc cleared and every ninja available by then at their story level (on-curve stars and tier mix). For each twist, two dates that roll it give the fights, and the team is auto-picked for the day's fight the way the Team screen's ✨ Auto does it. The clear chance is 1 − (1 − win rate)^`attemptsPerDay`.

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
* **Session 4, achievements and the tutorial.** `npm run campaign` now plays the Academy tutorial first (its three lessons never count toward the difficulty stats) and claims achievements as they unlock (Ryo on levels, tickets on summons). 10 players: end of Part I **37.0** vs enemy 30, median Ryo 11,143; end of Part II **98.0** vs 94, median Ryo 23,855. With `CAMPAIGN_ACHIEVEMENTS=0`: 36.5 / 11,137 and 96.0 / 23,103. Achievements are worth about 0.5 level by the end of Part I and 2 levels by the end of Part II. `CAMPAIGN_TUTORIAL=0` (no tutorial) had one player of ten needing 5 replays at `n_birth_4` (a different pull history; the default run passes 10/10).
* **Session 4 follow-up: `n_birth_4` without the tutorial is noise, closed.** 100 players per variant (`CAMPAIGN_PLAYERS=100`):

  | Variant | Players passing | Stuck at `n_birth_4` | Over 3 replays there |
  |---|---|---|---|
  | Tutorial played (default) | 100/100 | 4 | 0 |
  | Tutorial skipped (reward paid, lessons not played; a scratch variant) | 100/100 | 7 | 0 |
  | `CAMPAIGN_TUTORIAL=0` (no tutorial, no reward) | 98/100 | 7 | 2 (5 and 4 replays; player 8 is the Session 4 case) |

  `n_birth_4` is the most common late stuck point in every variant, so it is the steepest late boss for the bot, but it only goes past 3 replays in the no-tutorial run, and 2 of 100 against 0 of 100 is within noise. The missing reward (+300 scrolls, +450 Ryo) shows up earlier instead: `n_bell_3` is stuck for 5/100 without it and 0–1/100 with it. A real player always gets the reward, played or skipped (existing saves get it on migration), so the no-tutorial run models no one. `n_birth_4` stays as it is.
* **Session 4, Hard mode.** `hardMode.bossMult` 1.5 (at 1.4 the un-tuned Hard bosses spread from 0% to 100%), then `npm run autotune -- --mode=hard --write` set `hardMode.nodeMult` for every Hard boss (arc finals aim for 60%, other boss battles for 78%, as in the story). Every Hard arc boss lands at 56–65% in `npm run sim`. The one outlier was `n_summit_3` (Danzo Shimura, a mid-arc boss, so its goal is 78%; `npm run sim` checks arc finals only), stuck at 0.33 and 70–72%.
* **Session 4 follow-up: Hard `n_summit_3` retuned, 0.33 → 0.325.** It forces base Sasuke and Karin (a two-ninja team), so it needs far less than its story value (1.01): the first Hard autotune searched down from 1.01 only to 1.01 ÷ 3 ≈ 0.34. Near the goal its win rate is very steep (0.30: 99%, 0.32: 85%, 0.325: 78%, 0.33: 70%, 0.40: 2%), so the goal sits between two 0.01 steps. `tools/autotune.mjs` now takes per-node overrides (`OVERRIDES`: a search lower bound and a finer resolution). This node uses `{ min: 0.1, round: 0.005 }`, and `npm run autotune -- --mode=hard --only=n_summit_3 --write` lands on **0.325: 80% over 200 battles, 78.2% over 600**. Every other Hard boss is unchanged (61/61 sim scenarios, Hard arc bosses 56–65%).
* **Session 4 follow-up: "Part II on Hard"** (`ach_hard_part2`, 1 Rare+ ticket like the other part milestones). The campaign sim numbers above are unchanged (end of Part I 37.0 / 11,143 Ryo, end of Part II 98.0 / 23,855), because the bot never plays Part II on Hard.
* **Session 4, Hard rewards** (`CAMPAIGN_HARD=1 npm run campaign`: each player clears as much of Part I on Hard as they can before starting Part II; the bot clears all 32 Hard battles first try, since it is level 37 and Part I Hard enemies are level 13–42):

  | `hardMode.rewards` first clear / arc bonus (scrolls, Ryo) | Hard Part I pays | Team Lv at Kazekage Rescue (no Hard: 39.5) | Twelve Guardian (48.0) | Pain's Assault (72.3) | End of Part II (98.0) |
  |---|---|---|---|---|---|
  | 1.5, 0.5 / 1.5, 0.5 (first draft) | 16,181 scrolls, 54,180 Ryo | 50.3 (+10.8) | 57.0 | 77.5 | 100 (cap), Ryo 66,576 |
  | 1.0, 0.25 / 1.0, 0.25 | 10,782 scrolls, 27,098 Ryo | 44.5 (+5.0) | 50.3 | 74.3 | 100 |
  | 0.75, 0.15 / 0.75, 0.15 | 8,092 scrolls, 16,260 Ryo | 42.8 (+3.3) | 48.5 | 73.3 | 100 |
  | **1.0, 0.15 / 0.5, 0.15 (final)** | **9,234 scrolls, 16,260 Ryo** | **43.0 (+3.5)** | **48.8** | **73.8** | **100** |

  Finishing Part I on Hard first now starts Part II about 3.5 levels ahead, and that lead is below 2 levels by the Tenchi Bridge. A first clear on Hard pays the story's first-clear scrolls again but far less Ryo than a story replay of the same battle, so Hard is the place for scrolls, not for farming levels. Replays (1.5× scrolls, 1.25× Ryo of a story replay) stay a bit better than the same battle in the story; the story's latest battles still pay more Ryo per replay after early Part II.
* **Session 4, the Daily challenge.** The first draft set each twist's difficulty with an enemy level offset (0 / −4 / −4 / −6). The sim's Daily check found No Ultimates and Boss gauntlet unclearable (median clear chance 0%, 23/23 and 22/23 players under 50%): N levels is a big gap at level 15 and a small one at level 70. Twists now multiply enemy HP and ATK (`daily.twists[].power`, 0.9 / 0.5 / 0.45 / 0.65), chosen as the strongest values where every sampled player clears every twist within 3 tries at least half the time (worst sample 66%). Win rates are steep, so most days are comfortable and the hardest (an old boss whose nature counters your roster) are real fights.
* **0.12.1, the balancing pass** (the brief and the proposal: `docs/BALANCE_PASS.md`; the tool: `npm run audit`, `tools/roster-audit.mjs`, a fixed quartet Kakashi + Gaara + Shikamaru + Naruto against six bosses, every ninja taking its role's slot, natures neutral, 60 battles a boss). What was applied, what was measured on the way, and where it landed:

  **The heal is a rescue** (`combat.ult.healFocusPct / healFocusPower / healSpreadPct / healSpreadPower`, `BattleSim._executeUlt` `case 'heal'`): the most injured ally (lowest share of HP left, the caster included) gets the focus heal, everyone else the spread heal. The proposal's 35 % + 3 × ATK / 6 % + 1 × ATK turned out *stronger* than the old spread heal in the audit (Supports 95–100 %), and the size hardly matters: any rescue on the tank wins the quartet's fights. The heal was tuned down until the genin healers sat in the 70–80 band (audit at boss + 2, Supports only):

  | focus / spread | Sakura | Karin | Hundred Healings | Tsunade | Chiyo (buff) | Jiraiya (buff) |
  |---|---|---|---|---|---|---|
  | old spread heal (2.4 × ATK + 10 % to all) | 93 % | 90 % | 98 % | 98 % | 70 % | 76 % |
  | 35 % + 3.0 / 6 % + 1.0 (the proposal) | 95 % | 95 % | 99 % | 100 % | 72 % | 79 % |
  | 25 % + 2.0 / 4 % + 0.5 | 91 % | 91 % | 98 % | 98 % | | |
  | 20 % + 1.5 / 3 % + 0.5 | 88 % | 85 % | 97 % | 97 % | | |
  | 15 % + 1.0 / 2 % + 0.3 | 82 % | 79 % | 91 % | 94 % | | |
  | 12 % + 0.8 / 1 % + 0.2 (the 70–80 band) | 74 % | 72 % | 86 % | 91 % | 72 % | 79 % |
  | 10 % + 0.6 / none | 62 % | 59 % | 80 % | 85 % | | |
  | **28 % + 0.8 / 3 % + 0.2 (final, the user's call)** | **97 %** | **97 %** | **100 %** | **100 %** | 95 % | 97 % |

  The ATK part is small next to the share of max HP (a Support's ATK is about 2 % of a Tank's HP at any level). The 70–80 band is reached only with a rescue of about 15 % of a bar, which is no more visible than the old per-ally top-up. The user chose the feel over the band, a rescue of a quarter to a third of the wounded ally's bar, and with that rescue on every cast (every ~12 s) healers won 93–98 % and the bosses re-tuned to healer teams became walls for teams without one (the Hard counter-gap team fell to 6 %, the Daily's ✨ Auto teams to 0 % against Aoi Rokusho). So the heal became **a medic's two heals** (the user's design: "a big heal once or twice a fight and a smaller one more often"): the Ultimate is the rare big rescue, **28 % + 0.8 × ATK** on the ally with the least HP left (3 % + 0.2 × ATK on the rest), charging at **`healChargeMult` 0.4** of the usual rate (about one cast per 30 s, so once or twice a fight; `_gainChakra`), and between casts the healer heals the most injured ally **`healPulsePct` 1.5 % + `healPulsePower` 0.2 × ATK every `healPulseInterval` 6 s** (`_healPulse`, a small green number in the battle). Measured on the Supports at boss + 2 against the healer-tuned bosses of the previous retune (quartet 61 %, genin median 44, jonin 62, kage 72):

  | rescue / charge / steady heal | Sakura | Karin | Hundred Healings | Tsunade |
  |---|---|---|---|---|
  | 28 % on every cast, no steady heal | 94 % | 93 % | 98 % | 98 % |
  | 28 % at 0.5 charge, 3 % every 4 s | 90 % | 88 % | 96 % | 97 % |
  | 28 % at 0.5, 2 % every 5 s | 83 % | 83 % | 93 % | 96 % |
  | 28 % at 0.4, 2 % every 4 s | 82 % | 80 % | 90 % | 96 % |
  | 28 % at 0.35, 3 % every 4 s | 90 % | 87 % | 95 % | 97 % |
  | 28 % at 0.4, 1.5 % every 5 s | 76 % | 74 % | 88 % | 94 % |
  | **28 % at 0.4, 1.5 % every 6 s (final)** | **74 %** | **74 %** | **87 %** | **94 %** |

  The steady heal sets the healers' win rate far more than the rescue does. At the final numbers a Genin healer is worth about a Jonin Striker in the fourth slot (Sakura 74 % against Guy 69 %, Kakashi 61 %), Chiyo's buff is 76 %, and Tsunade is the top Kage by about nine points over Ay: the best fourth pick, not a must. After the retune: at boss + 2 (quartet 80 %, near the ceiling) Sakura 91 %, Karin 91 %, the Hundred Healings 96 %, Tsunade 99 %, Chiyo 95 %, Jiraiya 98 %; at boss − 2 (quartet 34 %) Sakura 62 %, Karin 56 %, the Hundred Healings 77 %, Tsunade 88 %, Chiyo 57 %, Jiraiya 73 %: the healers are the best fourth pick, most of all in a hard fight, and a team without one still wins its share (the Hard counter-gap team is back at 64 %, every Daily twist clears for all 46 samples).

  **Every Kage a step up** (`stats.rarityMult.kage` 1.4 → **1.5**; the user's rule "kages should feel more powerful but not op", for the whole tier): measured on every Kage and Jonin at boss + 2, the Kage median goes from 72 to 78 against the Jonin 62 (+16, the ~15 aimed for), and no Kage sits more than 6 over the Kage median (Ay +6, Eight Gates +6, Kamui +4; Tsunade +19 as the healer). A 5★ Genin (1.4) still holds its own against a 1★ Kage. After the retune: at boss + 2 the Kage median is 96 % against the Jonin 80 % (the top of the table compresses there); at boss − 2 it is 61 % against 35 %, with Ay +16, Eight Gates +12 and Kamui +11 over the Kage median (the stun and taijutsu kits, as before the lift) and the five Ranged Kage 9–10 under it, level with Pain.

  **Area Ultimates are centred on their target** (`aoeMain` × ATK on the target, `aoe` on the rest within `aoeRadius`): the proposal's 3.4 / 2.4 lifted the kage area Strikers to the kage median (Naruto Sage −7 → −1, Madara −8 → 0, Sasuke EMS −10 → −4) and the Ranged area kits by 4–9 points, still below; the pass went to **3.7 / 2.7** (step 2 names the aoe numbers as the first knob). `stunDuration` 2.2 → **1.8 s**: Neji +17 → +8, Ay +16 → +5, Kamui +12 → +4 (audit at boss + 2, after the retune). Ranged `attackInterval` 1.4 → **1.3**, `def` 26 → **30**; Hinata `hp` 0.95 → **1.05** (−7 → −3).

  **Role stats are two-sided.** `stats.roles` also builds every enemy (`Ninja.js` `buildEnemyUnit`), so a Ranged buff also strengthens Ranged bosses (three of the audit's six). Faster or sturdier Ranged variants measured *before* the retune (1.25 s / def 32; 1.2 s / def 30; HP 1850; ATK 112) all made the Ranged ninja and the quartet worse; the two named knobs stay at 1.3 / 30 and autotune absorbs the boss side. Onoki and Orochimaru (plain-single Ranged kage) did not reach the mid-50s the proposal hoped for: at boss + 2 they sat 5–6 under the kage median, at boss − 2 about 15 under, next to the area Ranged kage (Mei, Obito, Naruto Chakra Mode). The user chose higher weights over a stun rider ("kages should feel more powerful but not op"): `roster.js` `stats` Onoki 0.95 / 1.1 → **1.07 / 1.22** (hp / atk), Orochimaru 1.0 / 1.08 → **1.12 / 1.2**, Mei 1.0 / 1.06 → **1.15 / 1.21**, Obito and Naruto Chakra Mode 1.05 / 1.06 → **1.2 / 1.21** (measured at boss − 2: +0.06 on both gave +3–5 points, +0.10 gave +7–8 for the singles and +4–5 for the area kits, hence the larger lift on the area three). After the retune the five sit 3–6 under the kage median at boss + 2 and 7–8 under at boss − 2, level with Pain and just under Itachi and Hiruzen, whose stuns they lack; with the tier lift they keep that place inside a stronger tier.

  **Autotune** (`npm run autotune -- --write`, then `--mode=hard --write`, twice: after the ult rules and again after the aoe bump) re-tuned all 37 story bosses and 37 Hard bosses; every arc boss lands in 50–70 % in `npm run sim`. Because the sim's on-curve teams often carry a healer and the heal is smaller, most bosses came down (`n_waves_5` 1.00 → 0.88, `n_kaz_5` 1.24 → 1.14, `n_pain_5` 0.97 → 0.99, the exception), which is why the **audit at boss + 2 compresses after the retune** (the healer-less quartet goes from 45 % to 80 %): the after tables are given at boss + 2 (the plan's setting) and at boss − 2 (the quartet near its old 45 %, which separates the kits).

  **The counter-gap scenario re-centred** (`targets.counterGapLevelOffset` 1.6 → **−0.57**, `targets.hardMode.counterGapLevelOffset` 9 → **4.6**): the neutral baseline (Lee, Hinata, Kurenai, Shikamaru against Zabuza at 0.88) had gone to 98 % (two Ranged stun kits and a sturdier Hinata against a softer boss). Measured at 60 battles: story +1.6 → 98 %, +0.1 → 81 %, −1.4 → 43 %; Hard +9 → 98 %, +7.5 → 94 %, +6 → 79 %, +4.5 → 62 %; then at the sim's own 600 battles per cell the curve is steep (story −0.7 → 58 / 22 / 12, −0.62 → 61 / 24 / 14, −0.55 → 65 / 27 / 14, −0.4 → 68 / 32 / 17; Hard 4.5 → 62 / 23 / 11, 4.6 → 64 / 25 / 12, 4.75 → 67 / 27 / 12), so the offsets sit where all three bands hold: **−0.57** (neutral 65 %, 3 of 4 countered 26 %, fully countered 14 %) and **4.6** (64 / 25 / 12). The bands (§6) are the same; only the calibration point moved, and the fights are seeded, so `npm run sim` reproduces these rows exactly.

  **Ryo × 0.85** on `nodeFirstClear.ryo`, `nodeReplay.ryo` and `arcClearBonus.ryo` (base, growth and cap: 442 + 94x cap 7,225; 510 + 111x cap 8,500; 1,275 + 383x cap 7,650). **Replay scrolls** `15 + 0.5x` → **`40 + 1.2x`** (40 / 77 / 128 / 158 at battles 1 / 32 / 74 / 99; a 10× summon every six late replays; the campaign bot only replays when stuck, so it is unaffected).

  | `npm run campaign` (10 players, achievements claimed) | End of Part I (vs 30) | End of Part II (vs 94) | Stuck | Result |
  |---|---|---|---|---|
  | 0.12.0 | 37.0, 11,143 Ryo, 8 achievements | 98.0, 23,855 Ryo, 12 | n_kaguya_4 1/10 | 10/10 |
  | combat pass + first retune, old economy | 37.0, 11,247 | 96.3, 23,564 | none | 10/10 |
  | + Ryo × 0.85, replay scrolls, the achievements | 34.3, 9,629, 11 achievements | 89.5, 21,021, 19 | none | 10/10 |
  | aoe 3.7 / 2.7, second retune | 34.3, 9,629, 11 | 89.5, 21,021, 19 | none | 10/10 |
  | the 28 % rescue on every cast and the Ranged Kage weights, third retune | 34.3, 9,676, 11 | 89.5, 20,678, 18 | n_kaguya_4 2/10, n_birth_4 2/10 | 10/10 |
  | **final: the medic's two heals, Kage 1.5, fourth retune** | **34.3, 9,581, 11** | **91.5, 19,747, 18** | n_bell_3 1/10 | 10/10 |

  **Three Daily challenges a day** (`daily.challengesPerDay`, `js/core/Daily.js`: each slot its own boss, twist, attempts and first-clear reward; the day's seed rotates the twists so a day never repeats one; save v5 keeps `daily.slots`). The proposal's firmer twists (0.6 / 0.55 / 0.75) were too much: No Ultimates ×0.6 had 4 of 46 sampled players under 50 % (worst 0 %, Twelve Guardian Ninja: Aoi Rokusho, Lv40), the Boss gauntlet ×0.55 had 5 (worst 0 %), Countered ×0.75 one (49 %). At 0.55 / 0.50 / 0.70 No Ultimates still had one at 7 %; at 0.52 / 0.47 / 0.68 all 46 clear every twist at least half the time (worst 81 % / 100 % / 100 %). Final: `noUlts` **0.52**, `bossRush` **0.5**, `counteredOnly` **0.7** (`lockedNature` 0.9, worst 62 %). Final Daily rows: every twist clears within its 3 attempts for all 46 sampled players; median clear chance 100 % on each; worst Locked nature 62 % (Fourth Great Ninja War: Confrontation, Aoi Rokusho, Lv75), No Ultimates 69 % (Twelve Guardian Ninja, Aoi Rokusho, Lv40), Boss gauntlet 83 % (Fated Battle Between Brothers: Deidara + Pain + Kakashi, Lv56), Countered 98 % (Tenchi Bridge, Aoi Rokusho, Lv36).

  **Fifteen achievements** (21 → 36; four new types `arcsClear`, `stars`, `ownTier`, `levelReach` and the `replayWins` record, CONTENT_GUIDE §11), as listed in `docs/BALANCE_PASS.md` §1f. The campaign bot claims 11 by the end of Part I and 19 by the end of Part II (8 and 12 before).

  **The audit, before and after** (win rate in the quartet's slot; ▲▼ = 8 points or more from the tier median):

  | | before (boss + 2) | after (boss + 2) | after (boss − 2) |
  |---|---|---|---|
  | the quartet as it is | 45 % | 80 % | 34 % |
  | tier medians genin / chunin / jonin / kage | 23 / 33 / 45 / 64 | 56 / 71 / 80 / 96 | 21 / 29 / 35 / 61 |

  | ninja | tier | kit | before (vs tier) | after, boss + 2 (vs tier) | after, boss − 2 (vs tier) |
  |---|---|---|---|---|---|
  | karin | genin Support | heal | 90 % (+68 ▲) | 91 % (+35 ▲) | 56 % (+35 ▲) |
  | sakura | genin Support | heal | 93 % (+71 ▲) | 91 % (+35 ▲) | 62 % (+41 ▲) |
  | sakura_hundred | jonin Support | heal | 98 % (+53 ▲) | 96 % (+16 ▲) | 77 % (+42 ▲) |
  | chiyo | jonin Support | buff | 70 % (+25 ▲) | 95 % (+15 ▲) | 57 % (+22 ▲) |
  | tsunade | kage Support | heal | 98 % (+34 ▲) | 99 % (+3) | 88 % (+26 ▲) |
  | jiraiya | kage Support | buff | 76 % (+12 ▲) | 98 % (+2) | 73 % (+12 ▲) |
  | kiba | genin Striker | single | 23 % (+1) | 56 % (+0) | 20 % (-1) |
  | konohamaru | genin Striker | single | 21 % (-2) | 53 % (-3) | 20 % (-1) |
  | omoi | genin Striker | single | 20 % (-2) | 53 % (-3) | 20 % (-1) |
  | chojuro | genin Striker | aoe | 16 % (-7) | 48 % (-8) | 20 % (-1) |
  | neji | chunin Striker | single+stun | 49 % (+17 ▲) | 79 % (+8 ▲) | 40 % (+11 ▲) |
  | lee | chunin Striker | single | 45 % (+12 ▲) | 73 % (+1) | 31 % (+3) |
  | sakon | chunin Striker | single | 35 % (+2) | 72 % (+1) | 29 % (+0) |
  | naruto | chunin Striker | single | 35 % (+3) | 71 % (+0) | 29 % (+0) |
  | suigetsu | chunin Striker | single | 35 % (+2) | 71 % (+0) | 29 % (+0) |
  | sasuke | chunin Striker | single | 33 % (+0) | 69 % (-2) | 28 % (-1) |
  | guy | jonin Striker | single | 57 % (+12 ▲) | 86 % (+6) | 43 % (+8) |
  | naruto_ninetails | jonin Striker | single | 51 % (+6) | 84 % (+4) | 36 % (+1) |
  | hidan | jonin Striker | single | 48 % (+2) | 83 % (+2) | 36 % (+1) |
  | killer_bee | jonin Striker | aoe | 40 % (-5) | 81 % (+1) | 37 % (+2) |
  | kisame | jonin Striker | aoe | 39 % (-6) | 80 % (+0) | 35 % (+0) |
  | kakashi | jonin Striker | single | 45 % (+0) | 80 % (+0) | 34 % (-1) |
  | sasuke_cursemark | jonin Striker | single | 48 % (+2) | 80 % (+0) | 37 % (+2) |
  | kimimaro | jonin Striker | aoe | 39 % (-6) | 79 % (-1) | 35 % (+0) |
  | kabuto | jonin Striker | single | 46 % (+1) | 79 % (-1) | 34 % (-1) |
  | asuma | jonin Striker | aoe | 35 % (-10 ▼) | 76 % (-4) | 33 % (-2) |
  | zabuza | jonin Striker | aoe | 31 % (-14 ▼) | 76 % (-4) | 30 % (-5) |
  | naruto_sixpaths | kage Striker | aoe | 60 % (-4) | 97 % (+1) | 68 % (+6) |
  | ay | kage Striker | single+stun | 79 % (+16 ▲) | 97 % (+0) | 78 % (+16 ▲) |
  | minato | kage Striker | single | 64 % (+0) | 96 % (+0) | 62 % (+1) |
  | kakashi_mangekyo | kage Striker | single+stun | 76 % (+12 ▲) | 96 % (+0) | 72 % (+11 ▲) |
  | guy_eightgates | kage Striker | single | 75 % (+11 ▲) | 96 % (+0) | 74 % (+12 ▲) |
  | naruto_sage | kage Striker | aoe | 57 % (-7) | 96 % (-1) | 61 % (+0) |
  | madara | kage Striker | aoe | 56 % (-8) | 95 % (-1) | 60 % (-1) |
  | sasuke_ems | kage Striker | aoe | 54 % (-10 ▼) | 95 % (-2) | 57 % (-4) |
  | iruka | genin Ranged | single+stun | 35 % (+12 ▲) | 71 % (+16 ▲) | 28 % (+6) |
  | ino | genin Ranged | single+stun | 29 % (+6) | 67 % (+11 ▲) | 26 % (+5) |
  | shino | genin Ranged | aoe | 16 % (-7) | 52 % (-4) | 19 % (-2) |
  | tenten | genin Ranged | aoe | 16 % (-6) | 48 % (-8 ▼) | 21 % (+0) |
  | kurotsuchi | chunin Ranged | single+stun | 49 % (+16 ▲) | 81 % (+10 ▲) | 35 % (+6) |
  | shikamaru | chunin Ranged | single+stun | 45 % (+13 ▲) | 80 % (+9 ▲) | 34 % (+5) |
  | tayuya | chunin Ranged | aoe+stun | 30 % (-3) | 72 % (+1) | 32 % (+3) |
  | kidomaru | chunin Ranged | single | 27 % (-6) | 65 % (-6) | 26 % (-2) |
  | temari | chunin Ranged | aoe | 21 % (-11 ▼) | 64 % (-7) | 24 % (-5) |
  | shizune | chunin Ranged | aoe | 19 % (-13 ▼) | 63 % (-9 ▼) | 26 % (-2) |
  | sai | chunin Ranged | aoe | 20 % (-13 ▼) | 61 % (-10 ▼) | 24 % (-4) |
  | haku | chunin Ranged | aoe | 21 % (-11 ▼) | 59 % (-12 ▼) | 22 % (-7) |
  | kurenai | jonin Ranged | single+stun | 56 % (+11 ▲) | 87 % (+7) | 43 % (+8) |
  | deidara | jonin Ranged | aoe | 29 % (-16 ▼) | 75 % (-5) | 30 % (-5) |
  | konan | jonin Ranged | aoe | 27 % (-18 ▼) | 74 % (-6) | 28 % (-7) |
  | sasori | jonin Ranged | aoe | 27 % (-18 ▼) | 72 % (-8) | 29 % (-6) |
  | darui | jonin Ranged | aoe | 27 % (-18 ▼) | 72 % (-8) | 29 % (-6) |
  | orochimaru | kage Ranged | single | 46 % (-18 ▼) | 97 % (+0) | 52 % (-10 ▼) |
  | onoki | kage Ranged | single | 46 % (-18 ▼) | 97 % (+0) | 52 % (-10 ▼) |
  | obito | kage Ranged | aoe | 31 % (-32 ▼) | 97 % (+0) | 53 % (-9 ▼) |
  | naruto_chakramode | kage Ranged | aoe | 31 % (-32 ▼) | 97 % (+0) | 53 % (-9 ▼) |
  | mei | kage Ranged | aoe | 32 % (-32 ▼) | 96 % (+0) | 51 % (-10 ▼) |
  | pain | kage Ranged | aoe+stun | 55 % (-9 ▼) | 96 % (+0) | 49 % (-13 ▼) |
  | hiruzen | kage Ranged | single+stun | 66 % (+2) | 96 % (-1) | 57 % (-4) |
  | itachi | kage Ranged | single+stun | 67 % (+3) | 95 % (-1) | 59 % (-3) |
  | jugo | genin Tank | taunt | 23 % (+0) | 57 % (+2) | 24 % (+2) |
  | jirobo | genin Tank | taunt | 23 % (+0) | 56 % (+1) | 24 % (+3) |
  | hinata | genin Tank | taunt | 16 % (-7) | 53 % (-3) | 19 % (-2) |
  | choji | genin Tank | taunt | 19 % (-4) | 53 % (-3) | 18 % (-3) |
  | kankuro | chunin Tank | taunt | 27 % (-6) | 65 % (-6) | 26 % (-3) |
  | yamato | jonin Tank | taunt | 52 % (+7) | 86 % (+6) | 35 % (+0) |
  | gaara | jonin Tank | taunt | 45 % (+0) | 80 % (+0) | 34 % (-1) |
  | kakuzu | jonin Tank | taunt | 48 % (+3) | 80 % (+0) | 33 % (-2) |
  | hashirama | kage Tank | taunt | 69 % (+5) | 95 % (-1) | 67 % (+6) |
  | gaara_kazekage | kage Tank | taunt | 65 % (+1) | 94 % (-2) | 65 % (+4) |
* If you change a global value (`statMult`, `bossMult`, `ult`, `chakra`, `natureWheel`, `jutsuClash`), re-run `npm run autotune -- --write` and `npm run autotune -- --mode=hard --write`, then `npm run sim` and `npm run campaign`; if the counter-gap baseline (§6) drifts out of 55–65 %, re-centre `targets.counterGapLevelOffset` (and the Hard one) rather than the bands.

## 5. Safety rails
* `npm run validate` fails if the gacha rates don't add up to 1, if any curve produces a non-number, or if enemy levels exceed `stats.levelCap` before node 90.
* The debug panel's edits are **not saved**. Reload the page to go back to the file's values.

## 6. Countered teams and Jutsu Clash (Session 3b: bands reached)

**Goal:** at equal level and rarity, a team with 3 of 4 units countered wins 25–30%, a fully countered team wins 10–15%, and the countering team still wins a clear majority.

**Session 3's mistake:** it measured the gap at the Land of Waves boss with no level offset, where even a *neutral* team only won 24–35%. Against that baseline, asking a mostly-countered team to win 25–30% was asking it to do as well as a neutral team — mathematically impossible without breaking the wheel entirely.

**Session 3b's fix — a dedicated counter-gap scenario:** the same fight (Land of Waves boss, `n_waves_5`, Water), but the on-curve team is levelled `targets.counterGapLevelOffset` (**+1.6** then; **−0.57** since the 0.12.1 pass, see §4) above the node, where a **neutral** re-typed team wins **~60%** — the same neighborhood as the boss-win target, so "countered" and "counters" numbers are measured against a real, contested baseline. `npm run sim` uses this fight (`targets.counterGapNode`) for every counter-gap measurement, prints counter / 3-of-4 / fully-countered / neutral win rates every run (with both bots, under "Counter-gap scenario"), and checks the two bands as PASS/FAIL rows. The bands are narrow (5 points), so the sim runs this scenario at `max(N, 600)` battles per cell to keep the check stable.

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
| **Hard mode:** 1.12 / 0.95, the story scenario's team (same members and Leader) with Hard stars, Hard level +9 | 0.85 | **~98%** | **26%** ✅ | **14%** ✅ |
| Hard mode: 1.12 / 0.95, the Hard on-curve team (Tsunade leading) at its own ~60% level | 0.85 | 100% | 7% | 3% |
| Story: 1.12 / 0.95, that same Tsunade-led team at its own ~60% level | 0.85 | 100% | 7% | 2% |

**The Hard rows (Session 4).** `npm run sim` runs the counter-gap fight on Hard (`targets.hardMode.counterGapNode`, `n_waves_5`) with the story scenario's own team starred up like a player who cleared the part (`targets.hardMode.onCurve.stars`), `targets.hardMode.counterGapLevelOffset` (**+9** then; **+4.6** since 0.12.1) levels above the Hard enemy level, where it wins **63%** neutral (story 60%). All three bands pass. The last two rows show why the Hard scenario keeps the story's team: **the counter-gap depends on the team, not the mode.** A Tsunade-led team (HP Leader buff, a healer) fights long, steady battles (71–74 s against 47 s). Its countered stat deficit is the same as the story team's (it needs ×1.09 stats to get back to 60% with 3 of 4 countered, ×1.12 fully countered), but a ±5% stat change swings its fights from 20% to 94% instead of 49% to 77%, so the same deficit costs far more, in the story as much as on Hard. The Hard boss multiplier isn't the cause (at `bossMult` 1.0 that team still gets 7% / 2%). Long fights generally steepen the curve: stretching the story fight to 71 s (both sides' HP ×1.6) gives 9% / 3%.

**Why the counter team's win rate barely moved:** the search asked to compare counter-team rates near 70% / 75% / 80%, but at this scenario's neutral baseline (~60%) even the flattest wheel tried (1.02–1.10) still won ~95–98% with the +12–30% nature bonus stacked on top of an already-winnable fight — there's no wheel setting in the useful range that both meaningfully separates counter from neutral *and* drops counter below ~95%. The chosen wheel is already close to the flattest setting that still lands the 3-of-4 and fully-countered bands, so **~98%** is what "a clear majority" looks like at this node. The stop-condition in the brief (report the closest result if the bands can't be hit with counter ≥ 65%) never triggered — the picked setting reaches both bands with counter far above that floor.
* Autotune was re-run after the wheel/refund change (every boss's `nodeMult`, since the flatter wheel and the clash-aware default bot both shift win rates); see §4.
* Campaign sim after the change: still 10/10 free-to-play players clear Parts I–II, no node above 1/10 stuck (median final team Lv 96.3 vs enemy 94, unchanged from before this session within noise).
