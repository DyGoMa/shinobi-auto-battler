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
| **412×915** (Pixel 8a, Session 5) | ✅ clean | ✅ clean | ✅ start menu in every cloud state, Settings and Wiki from the menu |
| **915×412** (Pixel 8a sideways, Session 5) | ✅ clean | ✅ clean | ✅ two-column start menu, footer on one line |

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

## Session 5: the start flow

`auditScreen` runs on the start menu too (the menu is up while `window.__game.ui.startPending` is true; `ui.refresh()` after changing `__game.cloud.phase / ready / user` shows the other states without touching Firebase). Checked at 412×915 and 915×412: the guest, Google, no-session, connecting, error and cloud-off menus, Settings and the Wiki opened from the menu (tab bar hidden, "‹ Menu" back button), the intro overlay (Skip is 54×44 in the safe corner, five runners along the ground line, the title inside the frame). Screenshots in the desktop preview pane time out often at these sizes; the geometry was read from the DOM instead. Nothing on the existing screens needed a fix at 412×915 or 915×412.

## 0.11: shortcuts and the tab bar

`auditAll` and `auditFlows` (which now include the Story map's mode tabs, the pre-fight panel, the Roster's auto-level card and sort chips, the Team Builder's presets and counter pills, the Summon skip toggle, Settings' shortcuts and the shared results dialog) are clean at **412×915**, **360×780**, **915×412** and **1280×800**. A 20×20 test button was caught by the target check, to prove the audit still bites.

**The tab bar** (412×915, Android user agent): 55 px tall (54 px of tabs and the 1 px border) and flush with the bottom edge; none of the seven labels is clipped at 412 or 360 px. The desktop preview reports a 0 px safe area, so the inset was simulated by setting `--safe-b`: with 48 px (3-button navigation) the bar is 103 px and the tabs end exactly 48 px above the edge; with 34 px (iPhone home indicator) 89 px and 34 px. The inset is added once. The screen ends where the bar starts, and Home's last row ends 31 px above the bar when scrolled to the bottom.

**Live check:** see HANDOFF.md ("Live check (0.11.0)").

## 0.11.1: the installable app

`auditAll` and `auditFlows` (now with the Settings **App** card) are clean at **412×915** and **360×780** (http://localhost:8090 in the desktop browser pane, Android user agent). No tab label clips at 360 px.

**Insets, simulated** (the pane reports 0 px): with `--safe-b` 48 px and `--safe-t` 24 px at 412×915 the tab bar is 812–915 px (103 px: 54 px of tabs, the 1 px border and the 48 px inset once) and the tabs end exactly 48 px above the edge; the top bar is 0–80 px (56 + 24), the brand sits at 37 px, the screen starts at 80 px and the toasts at 90 px. Without insets: tab bar 860–915 px, top bar 0–56 px, as in 0.11.

**Back button** (`history.back()` from the console): Summon → Roster → Story → Home, one screen per press; an open dialog closes and the screen stays (a non-dismissable one stays open); a battle pauses and the screen stays; a leftover entry with the current screen's hash is skipped. Wiki/Settings opened from the menu go back to the menu.

**Service worker and offline:** registered at scope `/` (locally; `/shinobi-auto-battler/` on Pages), active and controlling the first page load; 63 files cached after boot. With the server stopped: `js/main.js` and `css/style.css` answer 200 from the cache, an unrequested file and `version.json` answer 503 "Offline", and a full reload boots to the start menu.

**Update toast:** with `version.json` stubbed to a different commit, `checkForUpdate()` shows the sticky **"Update ready — tap to reload"** toast (a button, `.toast.good.sticky`), a second check does not stack another, and with the same commit **↻ Check for updates** toasts "You're on the latest build (…)".

**Settings → App:** "Install the app" with the browser-menu text here (the pane never fires `beforeinstallprompt`); with `__game.pwa.standalone = true` the card reads "Installed as an app" with no button. The start menu's **🌐 Open in the browser to sign in** button appears in standalone after a failed Google sign-in and is hidden otherwise.

Not testable in the pane: the install prompt, standalone mode itself, and the Google popup inside the installed app.

## 0.11.2: suggesting the install

`auditInstall` (new in `tools/ui-audit.mjs`: forces the device flags, then the start-menu notice, the popup on Home, the reminder banner on Home and the Story map, and the Android, iOS and "open in Safari" step dialogs), `auditAll` and `auditFlows` are clean at **412×915** and **360×780** (http://localhost:8091, `?debug=1`). One fix on the way: the banner's ✕ was 34 px wide (now 44).

**The start menu at 360×780** with the notice: Continue as guest 243–322 px, Sign in with Google 332–395, Wiki/Settings 435–479, the notice 564–629 in the spacer row under the menu, the footer 714–768, and the screen does not scroll (a first version put the notice inside the menu column, which made the page 14 px taller than the window because the two `1fr` rows of the start grid stay equal). Sideways (780×360) the notice takes its own row under the menu column (`grid-template-areas` "brand menu" / "brand notice" / "foot foot"), no scroll.

**The banner** at 412×915 sits in its own grid row between the screen and the tab bar (803–860 px, tab bar 860–915, the screen ends at 803): it never covers content. Hidden on the start menu and in a battle (the battle overlay is above it).

**Installed:** `__game.pwa.standalone = true` → `prompts()` is all false and the start menu has no notice; `window.dispatchEvent(new Event('appinstalled'))` hides the banner, records `installedAt` and toasts "Installed! Open it from your home screen."; `beforeinstallprompt` clears `installedAt` (the browser says it is not installed).

**Faking the reminder timers:** with `?debug=1`, the 🛠 Debug panel has an "Install nudges" row: **Pretend phone** (a desktop browser counts as a phone), **Rewind 3 days** / **Rewind 7 days** (moves the popup and dismissal timestamps back), **Relaunch check** (re-evaluates the banner as at a launch and mounts it), **Reset install state** (clears the record: the popup is due again on Home). It also prints the record and what would show now. Without the panel, the record is `localStorage["shinobi-auto-battler:pref:installNudge"]` = `{"popupAt":<ms>,"dismissals":[<ms>,…],"installedAt":0}`; set a dismissal to `Date.now() - 4*864e5` and reload. Nothing is in the cloud save.

## Check on real devices before a release

The audit runs in a desktop browser. On a real phone also check:
- the notch and home-bar areas (`env(safe-area-inset-*)`) on an iPhone, both orientations;
- iOS Safari's collapsing address bar on long screens (Wiki, Settings);
- the Android back button (it moves through the `#hash` history);
- a 10-summon with a Kage (the biggest particle burst) on a low-end phone;
- **0.11:** the tab bar on the Pixel 8a with 3-button and with gesture navigation (no empty strip under the tabs; Chrome's own bottom bar, "the chin", can still appear on some pages: see HANDOFF.md), an iPhone's home indicator in both orientations, 5× speed on a low-end phone, and the Story map's scroll to the current battle;
- **0.11.2 (the install suggestions):** in Chrome on the Pixel 8a, **not installed** (uninstall the 0.11.1 app first, or use a fresh Chrome profile): the start menu shows the "Play full screen" notice and the buttons stay on screen; enter the game with the tutorial done (or finish/skip it) and the popup appears once on Home, not over the welcome or "cloud save is newer" prompts; **Not now** closes it and it never returns; **Install** on the notice/popup/Settings opens Chrome's install dialog in one tap (accepting shows "Installed! Open it from your home screen." and every suggestion disappears, cancelling toasts "Install cancelled"); with `?debug=1` → 🛠 Debug → **Rewind 3 days** → **Relaunch check**: the banner appears above the tab bar (✕ dismisses it; Rewind 7 days → Relaunch check brings the second, then never again); in Samsung Internet or Firefox the Install button shows the menu steps; on an iPhone, Safari shows the Share steps and a link opened from Instagram shows "Open in Safari" with Copy link; **inside the installed app** nothing shows: no notice, no popup, no banner, Settings → App reads "Installed as an app";
- **0.11.1 (the installed app):** install from Chrome (Settings → App → Install app, or ⋮ → Add to Home screen), launch from the home screen: no browser bars and no strip under the tab bar with gesture navigation and with 3-button navigation; Sign in with Google inside the app (guest → link); push a build and, with the app open, switch away and back: "Update ready — tap to reload" appears and the reload shows the new stamp; the back button moves between screens, pauses a battle, closes a dialog, and leaves the app from Home;
- **Session 5:** the intro's motion at 60 fps (the preview pane throttles animations, so the run and the slam were checked frame by frame, not live); the Android back button on the intro (skips) and on the start menu (stays); **Sign in with Google** on the start menu in Chrome for Android with its default cookie settings (0.10.1: a popup opens; signing in enters the game; closing it returns to the menu with no message; FIREBASE_SETUP.md step 9); the build stamp clear of the gesture bar in both orientations.

## For the art, audio and VFX pass

Real sprites, portraits and fonts will change sizes. Re-run both audits at all four sizes
after the swap, and keep these rules:
- anything tappable stays at least 44×44 (`.btn.small`, `.chip` and `.toggle` already guarantee it);
- keep long names wrapping (character names such as "Sasuke Uchiha (Heavens' Curse Mark)" are the longest);
- the summon reveal must still fit, or scroll, at 844×390.
