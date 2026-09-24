# QA checklist — layout, controls and copy

The UX and copy pass for version 0.9 (Session 4, step 6). Re-run it after any change to a
screen, and in full after the art, audio and VFX pass (new sprites, fonts and effects
change sizes).

## How to run it

The automated part is `tools/ui-audit.mjs`, a browser module (not part of the game). With
the local server running (`npm run serve`), open the game and run in the console:

```js
const a = await import('/tools/ui-audit.mjs');
a.qaSave(window.__game, 'mid');           // test save: Part I cleared, Hard + Daily open
await a.auditAll(window.__game);          // every screen, Wiki page type and a modal
a.qaSave(window.__game, 'mid');
await a.auditFlows(window.__game);        // battle, pause, results, summon, new player
```

`qaSave` (and `offline`) stop the tab from writing to the cloud save, so test saves never
reach Firestore. The first `qaSave` keeps a copy of the real save in `window.__qaBackup`;
put it back with `__game.save.replaceState(window.__qaBackup, { skipCloud: true })`, then
reload.

Run both at each size: **390×844**, **360×780**, **844×390** (phone held sideways) and
**1280×800**. An empty array means no problems. The audit reports:

| Check | Rule |
|---|---|
| Overflow | nothing sticks out past the window (no horizontal scroll); buttons in the battle, the summon reveal and dialogs are on screen or can be scrolled to |
| Tap targets | every button, link, input, chip and switch is at least 44×44 px (inline links in text are exempt) |
| Clipped text | no text cut off inside its box |
| Copy | no `TODO`, `undefined`, `NaN`, `[object …]` or unfilled `{{…}}` on screen |

The rest of this list is manual: read every screen once at 390×844, looking for the
things a script can't judge.

> Screenshots in the Claude desktop preview pane can come out scaled or stale at custom
> sizes (and CSS animations pause while the pane is hidden). Trust the audit's numbers, and
> use the pane's Mobile preset (375×812) for screenshots.

## Results (2026-09-24, version 0.9.0)

| Size | `auditAll` | `auditFlows` | Manual read |
|---|---|---|---|
| 390×844 | ✅ clean | ✅ clean | ✅ |
| 360×780 | ✅ clean | ✅ clean | ✅ |
| 844×390 (landscape) | ✅ clean | ✅ clean | ✅ |
| 932×430 (large phone, landscape) | ✅ clean | — | ✅ all tabs reachable |
| 1280×800 | ✅ clean | ✅ clean | ✅ |

Screens covered: Home (new player and mid-game), Story map (Part I, Part II, Hard, locked
Part II), Team (story, Daily, tutorial lesson), Roster and the character dialog, Summon and
the 10-summon reveal, Achievements, Daily challenge (open and locked), Boss Rush (open and
locked), Settings (every cloud-save state), Tutorial, Wiki (home, empty search, guides,
every list, and one page of each kind), battle HUD, pause menu and results (story, Hard,
Daily), the welcome box, the "cloud save is newer" prompt, and the loading and "couldn't
start" screens.

## Fixed in this pass

**Overflow and layout**
- Home's "▶ Continue" button ran 200 px off the screen with long battle names: long button labels now wrap (`.btn` no longer `nowrap`).
- The app could grow wider than the window (by 9 px at 360×780) after a battle or a summon, because a grid column sized itself to its content: `#app` and the tab bar now use `minmax(0, 1fr)` columns, and tab labels shrink with an ellipsis.
- **Dead end:** in phone landscape the summon reveal's Continue button was below the screen and the reveal didn't scroll, so players were stuck. The reveal now scrolls (particles moved to their own layer so they don't make it scroll).
- **Dead end:** on large phones held sideways (e.g. 932×430) the side tab rail used 76 px rows and pushed Wiki and Settings off screen. Rows now shrink to 44 px and the rail scrolls as a last resort.
- Phones held sideways now get the side rail too (it used to need 900 px of width), so screens keep 334 px of height instead of about 270 px at 844×390.
- The ? help button wrapped onto a line of its own next to a wide title: it now stays with the header's other controls (shared `screenHead`, also used by the Tutorial screen now).

**Tap targets (all now 44×44 or more):** small buttons (were 36 px tall), filter chips (36), the Story/Hard and Part I/II switches (38), on/off switches (30, now a 56×44 button drawing the same switch), Wiki breadcrumbs (32), icon buttons that shrank in tight headers (38–43 px wide) and clickable toasts on desktop (43).

**Loading and error states**
- The page showed nothing until the game loaded: it now shows "Loading…".
- If the game couldn't start, the error screen had no Reload button and put the raw error into the page as HTML. One plain-DOM screen ("The game couldn't start", ↻ Reload, details) now covers both a failed boot and a game file that failed to download.
- Settings promised that a save "will upload when the connection comes back", but nothing retried: the game now reconnects to cloud save when the browser comes back online.
- The "cloud save is newer" prompt showed the cloud save's progress but not this device's, and didn't say what happens to the other save: it now shows both and says the save you don't pick is replaced.
- Checked: every cloud-save state in Settings (not set up, connecting, couldn't connect with ↻ Try again, signed out, guest, Google, last upload failed).

**Empty states**
- Roster: filters that match nothing now say so ("No ninja match these filters", or "You have every ninja" on Missing), with a Show everyone button.
- Team: a role filter with no ninja now explains how to get one, with a Show all roles button.
- Checked: Wiki search with no results, locked Daily, locked Boss Rush, locked Part II, locked Hard.

**Copy**
- The Daily twist "Boss rush" sat on Home next to the separate "Akatsuki Boss Rush" mode: renamed **Boss gauntlet** (the config id is still `bossRush`).
- Boss Rush said "Best: round 0" before any run: now "No runs yet".
- Numbers typed by hand in the UI now come from config or content: the Roster's star bonus, star cap and catch-up gap (`balance.js`), and the Akatsuki count and last boss of the Boss Rush (`C.bossRush.order`, in four places and the endgame guide).
- Hard mode copy said "better rewards": it now says what they are (scrolls again on first clears, more than the story on replays).
- Summon's "not enough scrolls" hint now lists every source (Hard, Daily, Boss Rush; achievements give tickets).
- Settings: "Sound — All sound effects" read like a duplicate of the "Sound effects" switch below it; reworded.
- The pause button now reads "Resume" to screen readers while paused.
- Names: no Japanese-only terms in the UI or guides (checked for Kyuubi, Bijuu, Konoha, village -gakure names, jutsu -ton names, Jounin/Chuunin, "dattebayo" and more). "Jinchuriki" is the dub's own term. In-game names are checked against the dub by `npm run validate` (NAMING.md).

## Check on real devices before a release

The audit runs in a desktop browser. On a real phone also check:
- the notch and home-bar areas (`env(safe-area-inset-*)`) on an iPhone, both orientations;
- iOS Safari's collapsing address bar on long screens (Wiki, Settings);
- the Android back button (it moves through the `#hash` history);
- a 10-summon with a Kage (the biggest particle burst) on a low-end phone.

## For the art, audio and VFX pass

Real sprites, portraits and fonts will change sizes. Re-run both audits at all four sizes
after the swap, and keep these rules:
- anything tappable stays at least 44×44 (`.btn.small`, `.chip` and `.toggle` already guarantee it);
- keep long names wrapping (character names such as "Sasuke Uchiha (Heavens' Curse Mark)" are the longest);
- the summon reveal must still fit, or scroll, at 844×390.
