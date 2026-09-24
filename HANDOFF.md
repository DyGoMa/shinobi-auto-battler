# HANDOFF.md — Session 3b → Session 4 (sim/game bot mismatch and counter-gap fix)

> **Standing rule (Session 4 onwards):** any session that changes a system must update the matching Wiki guide in `wiki/guides/` (and "What's new" for anything a player will notice) before committing. `npm run validate` checks the guides' links and config placeholders; see CONTENT_GUIDE.md §9.

Session 3b was a short, focused balance session: fix the sim-vs-game bot
mismatch Session 3 left open, and properly resolve the nature-counter gap
(Session 3 changed the refund but never reached the target bands). No new
content, no UI. Every check passes: `npm test` runs validate, syntax, **48
core tests**, **31/31 battle scenarios**, and **10/10 free-to-play players**
clearing Parts I–II with no node above 1 replay.

## What changed

| Step | Summary |
|---|---|
| 1. Sim/game bot mismatch | The game's 🤖 Auto-ult has used the clash-aware bot (`botUlts('smart')`) since Session 3, but `npm run sim`, `npm run autotune` and `npm run campaign` still defaulted every scenario to the fire-when-ready bot. Real (clash-aware) boss win rates had drifted to 13–98%. `tools/common.mjs` now exports `DEFAULT_BOT` (clash-aware unless `SIM_BOT=asap`), and `runNode`/`runBossRush` default to it — every tool picks it up with no per-tool changes. Fire-when-ready stays available for comparison (`SIM_BOT=asap`, or an explicit `ultMode: 'asap'`) and the sim prints both bots for every boss and the counter-gap scenario. |
| 2. Counter-gap scenario | Session 3 measured the counter/countered gap at the Land of Waves boss with **no level offset**, where even a neutral team only won 24–35% — so the 25–30%/10–15% target bands were asking a countered team to match a neutral one. `targets.counterGapNode` (`n_waves_5`) + `targets.counterGapLevelOffset` (**+1.6**) is a dedicated fight where a **neutral** re-typed team wins **~60%**, the same neighborhood as the boss-win target. `npm run sim` now measures every counter-gap number there, prints counter / 3-of-4 / fully-countered / neutral rates every run (both bots), and checks the two bands as PASS/FAIL rows (`targets.counterGap3of4Range`, `counterGapFullyRange`). The bands are narrow (5 pts), so this scenario runs at `max(N, 600)` battles to stay stable. |
| 3. The fix — two levers | (a) **Overwhelmed now also blocks the enemy jutsu**, same as Standoff/Cancelled — before, an Overwhelmed ult dealt no damage *and* the enemy jutsu still landed weakened, a double punishment. The three outcomes stay distinct (see BALANCE.md §6); a core test (`test-core.mjs`) covers each one. (b) `natureWheel.advantage/disadvantage` **1.3/0.8 → 1.12/0.95** and `jutsuClash.overwhelmedChakraRefund` **0.5 → 0.85** (both now plain config, already were). Together: 3 of 4 countered **26%** (target 25–30%), fully countered **14%** (target 10–15%), counter team still **~98%**. Full trade-off table in BALANCE.md §6. |
| 4. Autotune + campaign | `npm run autotune -- --write` re-ran with the clash-aware default bot and the new wheel; every boss's `nodeMult` moved (some by a lot — e.g. `n_countdown_4` 1.20 → 0.67). All 25 arc bosses now land in 50–70% **as actually played** (clash-aware). Campaign sim, 10 players: still clears Parts I–II, no node above 1/10 stuck, median final team Lv 96.3 vs enemy 94 (unchanged from Session 3 within noise). |

## Final counter-gap numbers (counter-gap scenario: Land of Waves boss, Water, on-curve +1.6 levels — neutral ~60% baseline; clash-aware bot, 800–2000 battles per cell)

| `advantage / disadvantage` | `overwhelmedChakraRefund` | Counter | 3 of 4 countered (target 25–30%) | Fully countered (target 10–15%) |
|---|---|---|---|---|
| 1.30 / 0.80 (old) | 0.5 (old) | ~100% | 4% | 0% |
| **1.12 / 0.95 (final)** | **0.85 (final)** | **~98%** | **26%** ✅ | **14%** ✅ |

See BALANCE.md §6 for the full search table and why the counter team's win rate couldn't be pulled down toward 70–80% at this scenario (its ~60% neutral baseline leaves no room: any wheel setting that still separates counter from neutral keeps counter near 95–98%). The brief's stop condition (report the closest result if the bands can't be met with counter ≥ 65%) never triggered.

## Boss win-rate spread before/after (clash-aware bot, as actually played)

Before Session 3b's autotune re-run: 13%–98% across the 25 arc bosses (target 50–70%). After: every boss lands in 50–65%. `npm run sim`'s "Jutsu Clash" info block shows each boss's clash-aware vs fire-when-ready rate; the swings are large in both directions (e.g. Kakashi: Shadow of the ANBU Black Ops 62% clash-aware vs 21% fire-when-ready; Fourth Great Ninja War: Countdown 56% clash-aware vs 83% fire-when-ready), which is why the sim needed to match the bot the game actually uses.

## Still open
1. **Counter team stays near 98%** at the counter-gap scenario (see above) — by design, given the scenario's ~60% neutral baseline; not considered a problem, but worth knowing if a future session wants a softer counter ceiling.
2. **Nagato's Earth:** Narutopedia lists Earth-Style Wall as "Nagato (Anime only)" with no episode. Add Earth if a scene is found. *(carried over from Session 3)*
3. **Boss Rush Pain** (`e_br_pain`) still has all five natures from Session 1's infobox-list reading. *(carried over)*
4. **Part II dub titles** still come mainly from Wikipedia's season lists. *(carried over)*
5. **Non-boss nodes are easy at level** (by design); a "real fight" target for non-boss nodes could be added to `npm run sim`. *(carried over)*
