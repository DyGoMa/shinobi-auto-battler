# HANDOFF.md — Session 2 → Session 3 (balance and canon audit)

Session 2 added all of Part II and four follow-ups. Every sim passes: `npm test` gives validate, syntax, 35 core tests, 29/29 battle scenarios, and 10/10 free-to-play players clearing Parts I–II.

## What changed

| Step | Commit | Summary |
|---|---|---|
| 1. Shippuden | `b2b2f6a` | `js/content/arcs/shippuden.js`: 13 canon arcs + 4 fillers (Twelve Guardian Ninja, Three-Tails' Appearance, Six-Tails Unleashed, Kakashi: Shadow of the ANBU Black Ops), 67 nodes, anime order. The last node is #99 at enemy level 94 (cap 100). 34 new pullable characters and forms, 88 new enemies/bosses/protect targets, 17 banners. `SIM_PARTS` (default: every part) replaces the `part === 1` filters. Autotuned every boss. |
| 2. Name re-checks | `719ec54` | See the table below. |
| 3. Counter gap | `0d80b9f` | Measured; **no lever applied** (see below). `npm run sim` prints the extra numbers. |
| 4. Phone portrait | `99af516` | Units drawn at 2.05× (390×844) and 2.22× (360×780), in two rows, with scaled bars and labels. Render layer only. |
| 5. Firebase doc | `1417789` | Standard edition, `(default)` Database ID, project-limit tip, anonymous Auto clean-up OFF. |

## Name re-checks (recorded in `tools/naming-sources.mjs`)

| Name | Verdict | Source |
|---|---|---|
| Naruto Uzumaki (Nine-Tails Chakra) | Kept as a **descriptive** label (P→D) | Narutopedia calls the form "Initial Jinchūriki Form" (no dub name); "Nine-Tails" is the dub term (dub titles of ep 40, Shippuden ep 165) |
| Six Paths of Pain | **Confirmed** (P→V) | Shippuden ep 132 dub title "In Attendance, the Six Paths of Pain" (Wikipedia, season 6); no English TV field |
| Prologue: Bell Test | **Renamed → "Prologue: Survival Test"**; "Bell Test" kept as the alternate | Dub titles of eps 4–5 (Wikipedia, Naruto season 1); Narutopedia article "Bell Test" |
| Deadlock! Sannin Showdown! | **Confirmed** (P→V) | Ep 96 dub title (Wikipedia, Naruto season 4) |
| Sound Four | **Corrected → "Sound Ninja Four"** | Narutopedia English TV name |
| Sand Siblings | **Not confirmable; removed from the game** | Narutopedia "Three Sand Siblings", no English TV field and no dub title. Blurbs now name the three; the scope label is "Hidden Sand ninja" |
| Leaf, Sand, Mist, Cloud, Stone, Sound, Rain | **Confirmed**, used consistently | Village English TV names + dub titles ("Hero of the Leaf", "Pakura of the Sand!", "Sound vs. Leaf", "Village Hidden in the Rain"). Convention in NAMING.md |

## Counter gap: measured, not fixed
Target: at equal level and rarity, a countered team wins 25–30%. Measured: **0%** (counter 98%, neutral re-type 34%). Full table in BALANCE.md §6.
* The candidate damage levers (smaller multipliers down to 1.03/0.98, no penalty for the countered side, mixed-team bonus) leave it at 0–5%. The cause is **Jutsu Clash**: countered Ultimates are *Overwhelmed* (spent) while the boss's jutsu still lands, and neutral/counter teams cancel or overpower it.
* Best result that keeps the clash rules: **10%** (clash-aware bot, no countered damage penalty, Overwhelmed cancels the jutsu).
* The only setting that reaches the band makes Overwhelmed ults land at ~85% power, which erases that outcome. Not applied.
* The countered team needs about **+6 levels** to reach 17–33%.

## Still unresolved (names and natures)
* **"Destruction of the Hidden Leaf Village"** (P): Session 1 recorded the ep 68 dub title as "…Destruction of the Hidden Leaf Village Begins!"; Wikipedia gives "Zero Hour! The Destruction of Leaf Begins!".
* **Natures by rule, open to a canon review:** Pain/Nagato = Water (Raging Waves in an ep 128 flashback); Minato and Konohamaru = Fire (first listed, no on-screen nature); Guren = Earth (Narutopedia: "presumed"); Kaguya = Fire/Water/Earth (**design mapping** of her dimensions, not canon).
* Part II dub episode titles come from **Wikipedia's season lists** (Narutopedia's episode articles use official English titles, which differ in places). A second source would be good.
* Karui was dropped: no technique with a confirmable dub name.

## Left for Session 3 on purpose
1. **Counter-gap design decision** (BALANCE.md §6 options). Also, the in-game 🤖 Auto-ult calls `botUlts('asap')` and wastes Ultimates on Overwhelmed clashes; `'smart'` exists.
2. **Late Part II economy overshoots.** Bots reach the level cap (median 100) against enemy level 94, and finish with ~70k unspendable Ryo. Part I pacing (+5 levels) is unchanged.
3. **`n_kaz_3`** ("Traps Activate!", Team Guy forced) is the most common stuck point (7/10 bots need 1 replay), because players rarely level all four.
4. **Engine quirk (worked around in content):** `resolveTeam` drops the last forced member when four are forced and the player's Leader isn't one of them. `n_kaz_3` sets `leader: 'guy'`.
5. **Sim change:** on-curve teams now give a forced Kage the Genin slot (they used to fight alone). This moved `n_crush_3` from 0.35 to 0.69.
6. **Balance texture:** Part II adds 15 Kage-tier pulls; long fights remain (Kinoe median 83 s); three Tank bosses were softened to avoid time-outs. The Boss Rush is still the Part I Akatsuki set.
7. **UI:** the Summon screen has 26 banner tabs in one scrolling strip; consider grouping by part.
