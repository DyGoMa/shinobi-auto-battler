# BALANCE_PASS.md — the 0.12.1 balancing pass (the proposal; applied in 0.12.1, see BALANCE.md §4 for what was measured on the way and what landed)

The user's brief, before shipping 0.12.0: Sakura's heal feels weak; check the other ninja's kits so
they are all balanced; replays should pay enough scrolls to be worth doing; Ryo comes a little too
easily; more than one Daily challenge a day; more achievements that help with scrolls. Everything
below was measured with the game's own sims (`npm run sim`, `npm run campaign`, and the new
`npm run audit`, `tools/roster-audit.mjs`). The numbers are proposals to confirm and then apply,
in a fresh session if the current one is too long: this file is the whole brief.

## 1. What the numbers say

### 1a. Healing is not weak, it is spread thin

The heal ult heals **every** ally for `2.4 × caster ATK + 10 % of the ally's max HP`. That is a
constant **15–19 % of each ally's bar** at every level (both parts scale with level), so one cast
looks like a small top-up and never saves a ninja who is about to fall.

But in the sim a healer is by far the strongest thing a team can add. The roster audit (a fixed
quartet Kakashi + Gaara + Shikamaru + Naruto against six bosses across the game, each ninja taking
its role's slot, natures neutralised, 60 battles a boss):

| 4th member | win rate |
|---|---|
| the quartet as it is (Naruto in the slot) | 45 % |
| Sakura (genin) | **93 %** |
| Karin (genin) | 90 % |
| Tsunade (kage) | 98 % |
| Sakura, the Hundred Healings (jonin) | 98 % |
| Chiyo (buff, jonin) | 70 % |
| Jiraiya (buff, kage) | 76 % |
| genin median (all roles) | 23 % |

And raising the heal numbers is explosive: with `healPower 3.0 / healPctMaxHp 0.18` an on-curve
team with Sakura at the Kazekage Rescue boss goes from 51 % to 97 %; at `2.4 / 0.30` every healer
team wins nearly every boss. So the fix is the **shape** of the heal, not its size:

**Proposal (heal):** the ult heals the **most injured ally** for `healFocusPct` of their max HP plus
`healFocusPower × ATK` (35 % + 3 × ATK), and every other ally for `healSpreadPct` + `healSpreadPower × ATK`
(6 % + 1 × ATK). About the same total as today, but a ninja at 20 % jumps to 60 %: the cast is
visibly a rescue. Sakura (Mystical Palm) and Karin (Heal Bite) read as "the medic runs to the
wounded"; Tsunade and the Hundred Healings keep the same rule with their bigger ATK. Tune the four
numbers with the audit so the Support rows land around **70–80 %** (still the best role, no longer
98 %). This is a small change in `js/core/BattleSim.js` `_executeUlt` (`case 'heal'`), four numbers in
`balance.combat.ult`, and the wiki text in `js/wiki/text.js` (`ultEffectText`).

### 1b. Area Ultimates are weak against bosses; stun Ultimates are the strongest

Same audit, the rest of the roster (win rate against the tier's median; ▲ ▼ = 8 points or more):

| Kit | Examples | vs tier |
|---|---|---|
| single target + stun | Neji +17, Kurotsuchi +16, Ay +16, Shikamaru +13, Kakashi Mangekyo +12, Iruka +12, Kurenai +11 | far above |
| taijutsu single | Guy +12, Lee +12, Guy Eight Gates +11 | above |
| plain single | Naruto +3, Kakashi 0, Minato 0, Onoki −18, Orochimaru −18 (Ranged kage, see 1c) | at the median for Strikers |
| **area (aoe)** | Tenten −6, Shino −7, Temari −11, Haku −11, Sai −13, Shizune −13, Asuma −10, Zabuza −14, Deidara −16, Sasori / Konan / Darui −18, Pain −9, Sasuke EMS −10, Naruto Sage −7, Madara −8, **Mei / Obito / Naruto Chakra Mode −32** | below, every one |

An area ult does `2.3 × ATK` to everyone near the target against a single's `4.2 × ATK`: against a
boss (the fights that matter) it is 55 % of a single. A 2.2 s stun interrupts a boss's cast and
freezes it: worth about 14 points on its own.

**Proposal (ults):**
* Area ults hit their **target** for `aoeMain × ATK` (3.4) and everyone else near it for `aoe × ATK`
  (2.4): the jutsu is centred on the target, as the show draws them. One line in `_executeUlt`
  (`case 'aoe'`), two numbers, and the wiki text.
* `stunDuration` 2.2 → 1.8 s (the stun kits stay the control picks, a little less dominant).
* Re-run the audit: every kit should sit within ±8 of its tier median except the Supports.

### 1c. Ranged ninja fall as often as Strikers and deal less

Ranged base stats: HP 1650, ATK 104 every 1.4 s (74 damage a second) against a Striker's 2050 HP,
112 every 1.0 s (112 a second). In the audit a Ranged ninja fell in 55–74 % of the fights, a Striker
of the same tier in 57–78 %: the back row is not safer, and plain-single Ranged kage (Onoki,
Orochimaru: 46 %) sit where a jonin Striker does (Kakashi 45 %; Minato, the kage Striker: 64 %).

**Proposal (Ranged):** `attackInterval` 1.4 → 1.3 and `def` 26 → 30 in `stats.roles.Ranged`; then the
audit again (Onoki and Orochimaru should reach the mid-50s, Tenten and Shino the genin median).
Hinata (a genin Tank with an HP weight of 0.95, the lowest of the Tanks, −7): `hp` 0.95 → 1.05.

### 1d. Ryo: a little too much

`npm run campaign` (ten free-to-play players, every achievement claimed): end of Part I at team level
**37.0 vs enemy 30**, end of Part II at **98.0 vs 94**, with 11,143 / 23,855 Ryo unspent.
The three Ryo curves scaled together (`nodeFirstClear.ryo`, `nodeReplay.ryo`, `arcClearBonus.ryo`,
base, growth and cap):

| Ryo × | End of Part I (team Lv vs 30) | End of Part II (vs 94) | Stuck points | Result |
|---|---|---|---|---|
| 1.00 (today) | 37.0, 11,143 Ryo | 98.0, 23,855 Ryo | n_kaguya_4 1/10 | 10/10 pass |
| **0.85** | **34.8, 9,801** | **90.5, 19,945** | four nodes 1/10 each, worst 2 replays | 10/10 pass |
| 0.75 | 33.0, 8,629 | 86.3, 17,981 | n_birth_4 2/10, four more 1/10 | 10/10 pass |

**Proposal (Ryo):** × 0.85: first clear `520 + 110x, cap 8,500` → `442 + 94x, cap 7,225`; replay
`600 + 130x, cap 10,000` → `510 + 111x, cap 8,500`; arc bonus `1,500 + 450x, cap 9,000` →
`1,275 + 383x, cap 7,650`. Teams end each part a few levels above the curve instead of seven, and
Part II ends just under it, where the stars and the counters carry (the bot still clears 10/10).

### 1e. Scrolls: replays pay nothing, the Daily is easy and rare

Replaying a cleared battle pays `15 + 0.5x` scrolls (x = the battle's number): 15 early, 31 at the
end of Part I, 64 at the end of the story, i.e. **14 to 60 replays for one 10× summon**. The story's
first clears pay 30,393 scrolls plus 15,000 in arc bonuses (about 504 summons over the whole game),
so the only scrolls after the story are Hard mode's first clears, the Daily (150 a day, a 10× every
six days), the Boss Rush and achievements.

| replay scrolls curve | at battle 1 / 32 / 74 / 99 | on Hard (×1.5) | replays per 10× (late) |
|---|---|---|---|
| `15 + 0.5x` (today) | 15 / 31 / 52 / 64 | 23 / 46 / 77 / 96 | 14 |
| `30 + 1.0x` | 30 / 61 / 103 / 128 | 45 / 92 / 155 / 192 | 7 |
| **`40 + 1.2x`** | **40 / 77 / 128 / 158** | **60 / 116 / 191 / 236** | **6** |
| `50 + 1.5x` | 50 / 97 / 160 / 197 | 75 / 145 / 239 / 296 | 5 |

**Proposal (replays):** `nodeReplay.scrolls` → `40 + 1.2x`. Note that ⏭ Skip makes a replay
instant, so this is "a 10× summon per six taps" late in the game; that is the intent (scrolls easier
for a solo player), and the campaign sim is unaffected (its bot only replays when stuck).

**The Daily.** The sim's Daily check now clears every twist within its three attempts **100 %** of
the time (worst single day 66 %): the twists are soft, and there is one a day.

**Proposal (Daily):** `daily.challengesPerDay: 3`: three challenges a day, each its own boss and
twist from the date (seed `daily:<date>:<slot>`), each with its own attempts and its own first-clear
reward (150 scrolls + Ryo → up to 450 a day, a 10× every two days). Firm the twists up a little
since they are all at 100 %: `noUlts` 0.5 → 0.6, `bossRush` 0.45 → 0.55, `counteredOnly` 0.65 → 0.75
(`lockedNature` stays 0.9: its worst day is already 66 %). Code: `js/core/Daily.js` (`dailyFor`
takes a slot; `state.daily` becomes `{ date, slots: [{ attempts, cleared }], totalCleared }` with
the old shape migrated in `SaveManager`), `DailyScreen` lists the three cards, `TeamBuilder` and
`BattleScreen` carry the slot, `Badges.dailyWaiting` checks any slot, the sim's Daily info loops
the slots, the endgame guide gets `{{num:daily.challengesPerDay}}` (add it to `GUARDED` in
`tools/wiki-check.mjs`).

### 1f. Achievements that pay scrolls

Fifteen more (21 → 36), in the existing shape (`js/content/achievements.js` + `balance.achievements.list`);
a summon ticket is one summon (100 scrolls), a Rare+ ticket a summon of Rare or better:

| id | name | goal | reward | needs |
|---|---|---|---|---|
| ach_side_missions | Off the Beaten Path | clear the five side missions | 2 tickets | new type `arcsClear` (arcs: the five filler arcs) |
| ach_replays_25 | Back for More | win 25 replays of cleared story battles | 2 tickets | new stat `replayWins` (recordBattle gets `replay: true` from BattleScreen and Skip) |
| ach_replays_100 | Old Battlegrounds | win 100 replays | 1 Rare+ | same |
| ach_own_60 | Everyone's Here | recruit 60 ninja | 2 Rare+ | ownCount |
| ach_five_star | Five Stars | raise any ninja to 5★ | 3 tickets | new type `stars` |
| ach_kage_3 | Kage Council | recruit 3 Kage-tier ninja | 1 Rare+ | new type `ownTier` (tier, target) |
| ach_level_50 | Halfway There | raise any ninja to level 50 | 2 tickets | new type `levelReach` (target) |
| ach_clash_50 | Clash Legend | overpower 50 jutsu | 1 Rare+ | stat clashWins |
| ach_flawless_10 | Untouchable | 10 flawless story wins | 2 tickets | stat flawlessWins |
| ach_rush_14 | Akatsuki Nemesis | clear Boss Rush round 14 | 1 Rare+ | rushRound |
| ach_hard_25 | Hard Habit | clear 25 Hard battles | 3 tickets | hardClears |
| ach_days_30 | A Month of Training | play on 30 days | 1 Rare+ | stat daysPlayed |
| ach_dailies_25 | Daily Regular | clear 25 Daily challenges | 1 Rare+ | dailies |
| ach_dailies_100 | Daily Legend | clear 100 Daily challenges | 2 Rare+ | dailies |
| ach_summons_100 | Summoner | summon 100 times | 2 tickets | summons |

Then `npm run campaign` again (it claims achievements as they unlock; the end-of-part lines show
what they are worth), and the achievements guide's counts.

## 2. The order of work

1. Balance numbers and the two ult rules (heal focus, aoe main target), stun 1.8, Ranged 1.3 / 30, Hinata 1.05.
2. `npm run audit` until the Support rows sit at 70–80 % and every other kit is within ±8 of its tier median; adjust the heal and aoe numbers, not the roster weights, first.
3. `npm run autotune -- --write` and `npm run autotune -- --mode=hard --write` (a global combat change re-tunes every boss), then `npm run sim` (61/61) and `npm run campaign` (10/10).
4. The economy: replay scrolls, Ryo × 0.85, the three Dailies and the twist powers, the fifteen achievements; `npm run sim` (the Daily info: every twist still ≥ 50 % within its attempts) and `npm run campaign` once more.
5. Docs in the same commit: BALANCE.md §4 (a "0.12.1" entry with the tables above), the guides that mention the changed numbers (they use placeholders; `npm run validate` catches a typed number), What's new, CONTENT_GUIDE §11 for the new achievement types, HANDOFF.
6. Version 0.12.1; `npm test`; commit; then ship (the push that 0.12.0 is waiting for covers both).

## 3. Decisions to confirm before applying

1. The heal becomes a focus heal (one big heal on the most injured ally, a small one on the rest) rather than a bigger spread heal. Yes / no.
2. Area ults hit their target harder (3.4×) and splash the rest (2.4×); stuns 1.8 s; Ranged a touch faster and sturdier. Yes / no, or only some.
3. Replay scrolls `40 + 1.2x` (the middle option); Ryo × 0.85.
4. Three Daily challenges a day with the twists firmed up.
5. The fifteen achievements as listed (names and rewards are open).
