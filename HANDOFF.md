# HANDOFF.md — Session 3 → Session 4 (balance and audit pass)

Session 3 was a balance and audit pass on the finished Part I + Shippuden game. Every check passes: `npm test` runs validate, syntax, **41 core tests**, **29/29 battle scenarios**, and **10/10 free-to-play players** clearing Parts I–II with no node above 1 replay.

## What changed

| Step | Commit | Summary |
|---|---|---|
| 1. Counter gap | `16abb18` | `jutsuClash.overwhelmedChakraRefund` **0.5**: an Overwhelmed ult is still cancelled (no damage) and the enemy jutsu still lands at ×0.55, but 50 chakra comes back. In-game 🤖 Auto-ult now uses `botUlts('smart')` (clash-aware); the sim keeps `'asap'` for boss targets. `npm run sim` prints the 3-of-4 countered case. Autotune re-run (9 bosses moved 0.01–0.06). **The bands were not reached** (see below). |
| 2. Late Part II economy | `a291299` | Caps on `nodeFirstClear.ryo` (8,500, from node 73), `nodeReplay.ryo` (10,000) and `arcClearBonus.ryo` (9,000, from arc 17 = Pain's Assault). Earlier rewards are unchanged. `npm run campaign` now prints median level and Ryo at the end of each part. |
| 3. "Traps Activate!" | `0044e31` | **Cause:** players own Team Guy but never level them (Lv 11–13 vs enemy Lv 33), while non-owners got Lv 33 loaners. The node itself is fine (a 1★ Team Guy at Lv 33 wins 100% in 28 s; still 91% at Lv 24). **Fix:** `ownedOrLoaner` raises an owned forced ninja (or fixed Leader) to the loaner level for that battle, keeping their stars. The Team Builder says so. |
| 4. Forced-team Leader bug | `1baa1ba` | `resolveTeam`: forced ninja always play. If four are forced, the Leader slot yields; the player's Leader leads only if they are one of the four, otherwise the first forced ninja does. The same rule is in `autoPickTeam` and the sims' `teamForNode`. The `n_kaz_3` `leader: 'guy'` workaround is removed. A core test covers it (fails on the old code). |
| 5. Summon screen | `d617615` | Standard + the newest open arc banner sit side by side at the top (one tap on phone portrait). The rest are under a collapsible "Past banners" row with a Part I / Part II switch and a wrapping grid. Checked at 375×812 with no console errors. UI only. |
| 6. Name and nature audit | `c325d95` | Ep 68 resolved (below). Pain/Nagato → **Water, Wind**; Kaguya's base nature → **Fire**; Minato, Konohamaru and Guren kept. Verdicts are in NAMING.md, "Session 3 nature review". |

## Final counter-gap numbers (Land of Waves boss, Water, Lv 8; same on-curve team re-typed; 200 battles per cell)

| Bot | Counter (Earth) | Neutral (Lightning) | **3 of 4 countered** (target 25–30%) | **Fully countered** (target 10–15%) |
|---|---|---|---|---|
| Fire when ready | 98% | 24% | **1%** | **0%** |
| Clash-aware (in-game Auto) | 98% | 25% | **0%** | **0%** |

* Sweeping the refund from 0 to 0.9 gave 0–3% for 3 of 4 countered and 0% for fully countered. So the refund is set to 0.5, and nothing else was forced.
* Why: the clash-aware bot never fires into a losing clash, so it never gets the refund. And at this node a neutral team only wins 24–35%, so the bands ask a mostly countered team to match a neutral one.
* **What a second lever would have to be** (BALANCE.md §6 has the full table):
  * A much flatter wheel (~1.1 / 0.93) **plus** Overwhelmed also blocking the enemy jutsu (`overwhelmedJutsuMult` 0) gets 3 of 4 countered to 24% and fully countered to 8% (fire-when-ready). The counter team drops to 79%.
  * Or redefine the reference: measure where a neutral team wins ~60%. At +3 levels, 3 of 4 countered gets 38% / 26% (fire-when-ready / clash-aware), but fully countered stays at 3–4%.

## Economy before / after (campaign sim, 10 players, medians)

| | Before | After |
|---|---|---|
| End of Part I (enemy Lv 30) | team Lv 35.5, 11,255 Ryo | team Lv 35.5, 11,255 Ryo (unchanged) |
| End of Part II (enemy Lv 94) | team Lv 99.0, 32,326 Ryo (range up to 71,697 when stuck at the level cap) | team Lv **96.3**, **23,580** Ryo (range 22,073–24,816) |

The 95.5 measured in step 2 became 96.3 after step 3 (fewer replays wasted on Team Guy). Most of the leftover Ryo is the final boss's first-clear reward plus the arc bonus, which arrive after the last battle.

Stuck points: before, `n_kaz_3` 7/10; after, nothing above 1/10 (`n_sixtails_3`, `n_bell_3`, `n_countdown_1`, `n_chunin_5`, `n_kaguya_2`).

## Name and nature verdicts
* **Ep 68:** the dub title is "Zero Hour! The Destruction of the Hidden Leaf Village Begins!", as Session 1 recorded. Sources: Narutopedia's episode article ("Other names") and Tubi's listing of the dubbed episode. Wikipedia's season 2 list ("…Destruction of Leaf Begins!") is the outlier. The arc name "Destruction of the Hidden Leaf Village" is now Verified (`tools/naming-sources.mjs`).
* **Pain/Nagato:** the rule was misapplied. Wind Style: Gale Palm is on screen in the same ep 128 flashback as Raging Waves, and Air Bullets appears in ep 253. Enemy Pains fight with their first (active) nature, so the boss fights are unchanged; the pullable Pain also hits with Wind.
* **Kaguya:** she uses no Release jutsu on screen, so her base nature is Fire (first listed). Her lava/ice/desert dimensions stay as the Amenominaka element swap (a design mapping). The fight is unchanged.
* **Minato, Konohamaru** (Fire, first listed) and **Guren** (Earth, Narutopedia "presumed") are kept.

## Still open
1. **Counter-gap design decision** (above): a second lever (flatter wheel + Overwhelmed blocks the jutsu) or a new reference point. Either one needs a rule or target change, not a number.
2. **Nagato's Earth:** Narutopedia lists Earth-Style Wall as "Nagato (Anime only)" with no episode. Add Earth if a scene is found.
3. **Boss Rush Pain** (`e_br_pain`) still has all five natures from Session 1's infobox-list reading. The Boss Rush is still the Part I Akatsuki set.
4. **Part II dub titles** still come mainly from Wikipedia's season lists; ep 68 showed they can differ from the dub. A second source for the others would help.
5. **Balance texture** (unchanged): long fights in places (Kinoe median ~83 s); the sim's boss targets still use the fire-when-ready bot, while in-game Auto is clash-aware. With the clash-aware bot, boss win rates range from 36% (Countdown) to 94% (Final Valley) instead of 50–70% (the sim's info block shows both).
6. **Non-boss nodes are easy at level** (e.g. `n_kaz_3` 100% for a level-matched team). That's by design, but a "real fight" target for non-boss nodes could be added to `npm run sim`.
