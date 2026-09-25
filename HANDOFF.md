# HANDOFF.md — 0.11.1 → the art, audio and VFX pass

> **Standing rule (Session 4 onwards):** any session that changes a system must update the matching Wiki guide in `wiki/guides/` (and "What's new" for anything a player will notice) before committing. `npm run validate` checks the guides' links and config placeholders; see CONTENT_GUIDE.md §9.

## 0.11.1: the installable app (PWA)

The game installs from the browser and, launched from the Android home screen, runs **standalone** with no Chrome UI, which removes the Chrome "chin" strip under the tab bar that 0.11.0 could not fix in the browser. Nothing here touches a cost, a reward, a curve or a battle: `npm run sim` and `npm run campaign` print the 0.11.0 numbers.

| Piece | Where | What it does |
|---|---|---|
| Manifest | `manifest.webmanifest`, linked from `index.html` with `theme-color`, `apple-touch-icon` and the `apple-mobile-web-app-*` tags | name "Shinobi Auto Battler", short_name "Shinobi", `display: standalone`, no orientation lock, dark `theme_color` / `background_color` (#0d1117, the app shell: no white flash), `start_url` and `scope` **relative** (`./`) so they resolve to `/shinobi-auto-battler/` on Pages and `/` locally |
| Icons | `icons/icon-192.png`, `icon-512.png` (the 忍 badge on the app's dark background), `icon-512-maskable.png` (full orange, glyph in the 80 % safe zone), `apple-touch-icon.png` (180) | Rendered by `tools/make-icons.ps1` (System.Drawing, Yu Gothic Bold); placeholder art, see §7 |
| Service worker | `sw.js` (root, so its scope is the game's path), registered by `js/ui/pwa.js` with `updateViaCache: 'none'` | **Network first for every same-origin GET** (index.html, version.json, JS, CSS, icons), cached as it passes through, cache **only when the network fails**. Every fetch revalidates with the server (`cache: 'no-cache'`; Pages sends `max-age=600` and answers unchanged files with a 304), so a reload after a deploy never mixes old and new files, and a new deploy is used on the next launch by itself. `skipWaiting` + `clients.claim`, old caches deleted on activate: an update can never get stuck. Cross-origin (Firebase SDK, Google, Firestore) untouched. Offline with nothing cached: a 503 "Offline" response; a navigation falls back to the cached `index.html` |
| Update check | `js/ui/pwa.js` `checkForUpdate`, `js/core/Pwa.js` `updateAvailable` | Every return to the front (`visibilitychange`, at most once a minute) and Settings → App → **↻ Check for updates** re-read `version.json`; a different commit shows a **sticky** toast **"Update ready — tap to reload"** (`ui.toast(…, { sticky: true })`, one per text). Never compares against "dev" |
| Install | Settings → **App** card (`SettingsScreen.appCard`, model from `Pwa.installModel`) | `beforeinstallprompt` saved in `game.pwa.prompt` → **📲 Install app**; iOS: "Share → Add to Home Screen"; no prompt: the browser's menu; standalone: "Installed as an app", no button |
| Back button | `UIManager.go` pushes a history entry per screen change in the game (the menu keeps its held entry; the first screen after the menu **replaces** it); `UIManager._onPop` | Back → the previous screen. A battle pauses, a dismissable dialog closes (`ui._modals`), and the entry is put back so the screen stays. Wiki/Settings opened from the menu → back to the menu. From Home, back leaves the page (an installed app closes); it can take **two presses**, the first eats the intro's leftover entry |
| Safe areas | `css/style.css` `--safe-t`, `--safe-b` | The top inset is the top bar's padding (its grid row grows by the same amount, once); the bottom inset stays the tab bar's padding, once. `[hidden] { display: none !important }` added |
| Google sign-in in the app | `FirebaseBackend` `{ standalone }`, `EARLY_CANCEL_MS` | Popup first as before. In standalone, `auth/popup-closed-by-user` **within 1.5 s** (the window never opened) falls back to the redirect; a real close is still a quiet cancel. A failed sign-in in standalone also offers **🌐 Open in the browser to sign in** (menu and Settings; Android only, `Pwa.signInFallback`): Chrome-installed apps share Chrome's storage, so a sign-in there signs the app in too. Not offered on iOS (separate storage) |

**Decisions**
* **No precache list.** The shell is cached as it loads (every module is a static import, so one online launch caches the whole game); a list would be one more thing to keep in step and would not make updates safer. On the **very first** load the files are fetched before the worker exists, so when it takes control (`controllerchange`) `js/ui/pwa.js` `warmCache` re-fetches every same-origin file the page loaded (`performance.getEntriesByType('resource')`) plus the shell, manifest and icons, once: the first online launch already fills the cache (65 files locally; a live first load had cached 0 before this).
* **The build check reads `version.json`, not the service worker.** `sw.js` is committed and only changes when it is edited; the deploy changes `version.json`. Comparing commits is the honest "a new build is live" signal, and the network-first worker makes the reload pick it up.
* **The Pages workflow is unchanged.** `version.json` is still written at build time; `sw.js`, the manifest and `icons/` are ordinary static files in the artifact.
* **`.claude/launch.json`** gained a second server entry on port 8090 (another session was using 8080).

**Checks:** `npm test` passes: validate (now also the manifest, the icons' PNG headers and sizes, `index.html`'s tags and `sw.js`), syntax on 73 files, **222 core tests** (14 new: standalone detection, iOS detection, the install model per platform, the update comparison and its once-a-minute rule, the sign-in fallback, and the standalone early-cancel → redirect path of `FirebaseBackend`, with a real close still a cancel and a browser tab unchanged), **61/61 sim scenarios**, **10/10** campaign players. The layout audit is clean at 412×915 and 360×780 (QA.md, "0.11.1"). In the desktop browser pane at http://localhost:8090: the worker registers, activates and controls the first page load; 63 files cached after boot; with the server **stopped**, cached files answer 200, an unrequested file and `version.json` answer 503 "Offline", and a full reload boots the game to the start menu from the cache.

**Not verifiable here** (the real-phone checklist in the summary and QA.md): the install prompt itself (the pane never fires `beforeinstallprompt`), standalone mode, the real gesture-bar inset, the Google popup inside the installed app, and the system back button closing the app.

## 0.11.0: quality of life

A convenience release: nothing here changes a cost, a reward, an XP curve or a battle. `npm run sim` and `npm run campaign` print exactly the numbers they printed before (diffed line by line against the 0.10.1 run). DESIGN.md §14 has the rules.

| Step | Commit | What it added |
|---|---|---|
| 1. Layout | `b515767` | The bottom tab bar is the tabs (54 px) plus `env(safe-area-inset-bottom)` once, as its padding, in an `auto` grid row (it was a 64 px row with the tabs centred in it). Labels have their own class (the red dot used to take the ellipsis rule) and scale with the width; none clips at 360 px. The screen keeps 28 px of bottom padding. Home drops its intro blurb once the tutorial is done |
| 2. Core | `f7f976d` | `Power.js` (recommended power from the on-curve team config), `AutoLevel.js` (Level to recommended, Smart spend with a reserve), `Skip.js` (the real BattleSim, headless, clash-aware), `Badges.js`, `Teams.js` (presets, counter hints, Roster sort), save v3 with `account.tutorialRewarded`; 56 core tests |
| 3. Screens | `d93d932` | Story map mode tabs (Story · Hard · Daily · Boss Rush), folded cleared arcs, node states and "Clear <battle> first", ⚡ recommended power, auto-scroll, pre-fight power check, ✨ Auto team and ⏭ Skip; shared results (Map · Change team · Retry · Next fight); 1× / 2× / 5×; Roster sort, filters and auto-level dialogs; Team presets and counter pills; Summon "Skip animation"; Settings shortcuts; tab dots; "Rewards already claimed" |
| 4. Docs | this commit | Wiki guides (how to play, team composition, levelling, summoning, endgame, achievements) and What's new 0.11.0, DESIGN §14, QA, README, this file; version 0.11.0 |

**Decisions**
* **The 10-pull stays at 900 scrolls with a Jonin+ guarantee.** The brief asked for exactly 10× the single cost with a Rare+ guarantee; the existing 10-pull is better for the player on both counts, and changing it would move the campaign's economy. Confirmed with the user in-session. It counts 10 toward Kage pity (now tested).
* **Smart spend reserve default: 500 Ryo** (`balance.qol.ryoReserve` = the starting Ryo), editable per save.
* **Recommended power** is the on-curve team's power (the team every boss is tuned against), so it means "a boss at this power is a fair fight". Early on it sits above the starter team (the Survival Test shows ⚡1.2k against the starters' ~840, because the on-curve team is a Jonin, two Chunin and a starred Genin); that is intended, since the Survival Test is tuned for the starters with no Ultimates.
* **Skip always uses the clash-aware bot** (`SKIP_BOT = 'smart'`, the sims' `DEFAULT_BOT`), whatever the player's Auto-ult mode, so a skip is the same fight the sims measure.
* **The Summon tab's dot now means a free summon** (a ticket). It used to show whenever a single summon was affordable, which is almost always mid-game.
* **Claim all** already existed on the Achievements screen (0.9); it was kept and documented.

**Checks:** `npm test` passes: validate (509 Wiki pages, every placeholder resolves), syntax on 70 files, **208 core tests**, **61/61 sim scenarios**, **10/10** campaign players. The layout audit is clean at 412×915, 360×780, 915×412 and 1280×800 (QA.md, "0.11").

**The tab bar strip on Android.** Before 0.11 the bar was a 64 px row with ~35 px of tabs centred in it, plus the safe-area inset; the dead space under the labels is gone. Chrome for Android 135+ can also draw its own bottom bar ("the chin") over the navigation area, and it only slides away when the page itself scrolls; this game scrolls inside the screen, not the page. If a strip is still there on the Pixel 8a, it is the chin, and the next step would be to let the document scroll (a bigger change to the app shell). The browser pane reports a 0 px inset, so the inset was checked by simulation (QA.md).

Session 5 added the start flow (below). The game is finished in every way except art, audio and visual effects. Everything a
player sees is drawn in code (canvas shapes, CSS, emoji) and every sound is a tiny Web
Audio synth: **the only image files in the repo are the four app icons in `icons/` (0.11.1)**, and there are no audio files. This document lists every
placeholder, where it's drawn, its size, and what's still open.

## Session 5 in one table

| Step | Commit | What it added |
|---|---|---|
| 1. Splash + intro | `1ba5fa5` | A fixed overlay while the game loads: 0.8 s splash, five CSS ninja silhouettes run across a dusk band, the title slams in with a shake and a flash (2.8 s in all); tap, Skip or back skips; seen once (device pref) → 0.5 s splash; Settings → Replay the intro; reduced motion → fades. `js/ui/Intro.js`, `js/core/StartFlow.js` |
| 2. Start menu + sign-in | `94db10a` | The first screen. **No cloud session until the player picks** Continue as guest (anonymous) or Sign in with Google (the existing link/sign-in and "cloud save is newer" paths; popup first on every device since 0.10.1, see below). Returning: one Continue ("Signed in as <name>" / "Guest save"), guests keep Sign in with Google to link. Errors on the menu. Wiki and Settings from the menu ("‹ Menu"). Android back stays on the menu. `js/ui/StartScreen.js`, `StartFlow.menuModel`, `FirebaseBackend` (injectable SDK) |
| 3. Build stamp + deploy | `5caae86` | "v<short sha> · <UTC build date>" bottom-right of the menu and Settings › About (`js/core/Version.js`). `.github/workflows/pages.yml` writes `version.json` and deploys through the Pages artifact action; the file is gitignored; missing → "dev". Pages source switched to **GitHub Actions** (done in-session, with permission) |
| 4. Pixel 8a layout | (in 2–3) | 412×915 and 915×412: `auditAll` and `auditFlows` clean on every existing screen (nothing to fix); the menu is a two-column layout sideways; 100dvh on the intro, safe-area padding on the menu, 44 px targets |
| 5. Docs | this commit | HANDOFF (this), FIREBASE_SETUP §8–9 and troubleshooting, README, DESIGN §11b, QA.md, the how-to-play and What's new guides |

**Checks:** `npm test` passes: validate, syntax on 63 files, **137 core tests** (20 new: intro timing, the intro-seen flag, menu gating of the anonymous session with a fake SDK, redirect sign-in, the menu per cloud state, the build stamp and its "dev" fallback), **61/61 sim scenarios**, **10/10** campaign players.

### How the start flow fits together

```
boot (js/main.js)
  playIntro(introPlan(seen, reducedMotion))   overlay up at once; setIntroSeen()
  save.init()                                  local save
  save.connectCloud()  ──► FirebaseBackend.init(): load SDK, getRedirectResult, restore the session. Never creates one.
  ui.init(): startPending = true, go('start')  the menu renders behind the intro; deep link kept for later
  intro.done                                    the menu is visible

start menu (js/ui/StartScreen.js, StartFlow.menuModel(save.cloudState()))
  off        ▶ Play / ▶ Continue                          → game.enterGame()
  connecting "Checking your account…"                     (buttons wait; the menu re-renders on save.onChange)
  error      ▶ Play offline, ↻ Try again, a message       → enterGame() / save.connectCloud()
  signedOut  Continue as guest → cloud.continueAsGuest()  (signInAnonymously: the ONLY place a guest account is made)
             Sign in with Google → cloud.signInWithGoogle()  popup; redirect only if the popup can't open ({ redirecting })
  guest      ▶ Continue (Guest save), Sign in with Google → cloud.linkGoogle() (link, or sign into the existing account)
  google     ▶ Continue (Signed in as <displayName>)
  + 📚 Wiki, ⚙️ Settings (body.start-sub: no tab bar, "‹ Menu" back)

game.enterGame({ signedIn, switched })         ui.enterGame() → Home or the deep link, welcome prompt, retro toasts,
                                               then save.afterSignIn(): the "cloud save is newer" prompt, upload
redirect return (fallback only)                  sessionStorage flag set → init(): getRedirectResult; a user → main.js skips the intro
                                               and enters; no user → cloud.redirectResult { empty } → the menu shows the
                                               third-party-cookie message with "↻ Try again". The flag is cleared either way.
popup closed                                    { cancelled: true } → the menu stays, no message
```

Settings keeps its Account card (sign in / use as a guest / link / sign out) with the same backend calls; sign-out no longer stores a preference (the menu simply offers guest or Google again).

## After Session 5: Google sign-in is popup first (0.10.1)

**Verified on real devices by the user (2026-09-24):** in a private and a regular browser window, on a PC and on the Pixel 8a, guest → Sign in with Google (link) → the "cloud save is newer" prompt all worked.

**Bug (live `6130d94`, a real Pixel 8a, Chrome for Android with third-party cookies blocked, Chrome's default):** "Sign in with Google" on the start menu went to the Firebase `authDomain` and back, and the menu reloaded as "Continue · Guest save" with no message. 0.10.0 chose the redirect flow on phones by user agent; the redirect result lives in the `authDomain`'s storage, which Chrome blocks as third-party, so `getRedirectResult()` came back with no user, and `_finishRedirect` only reported a result when a user came back.

**Fix** (`js/save/FirebaseBackend.js`, `js/ui/StartScreen.js`, `StartFlow.menuModel`):
1. `signInWithPopup` / `linkWithPopup` first on every device; the user-agent check (`prefersRedirect`) is gone. The redirect is a fallback only for `auth/popup-blocked` and `auth/operation-not-supported-in-this-environment` (`POPUP_UNAVAILABLE`). `auth/popup-closed-by-user` and `auth/cancelled-popup-request` (`POPUP_CANCELLED`) are cancels: `{ ok: false, cancelled: true }`, the menu (and Settings) stay quiet.
2. Before a redirect the page sets a `sessionStorage` flag (`REDIRECT_FLAG`, 'signIn' or 'link'); `init()` reads and clears it first (so it is cleared even if the SDK fails to load), and only then calls `getRedirectResult`. No user back → `redirectResult = { ok: false, empty: true, error: EMPTY_REDIRECT_ERROR }` → the menu shows the message in the warning colour and the Google button becomes **↻ Try again**. The old `localStorage` marker from 0.10.0 is removed on load.
3. Linking a guest keeps the one link path: `linkWithPopup`, and on `auth/credential-already-in-use` the same `_signInWithCredentialFromError` → `switched: true` → `game.enterGame({ switched })` → `save.afterSignIn()` → "cloud save is newer" prompt, exactly as the redirect result did.
4. Tests (core, fake SDK): popup first even with an Android user agent and a touch screen, each fallback code, each cancel code, another popup error, link by popup / credential-already-in-use / blocked / cancelled, redirect return with a user / with no user / with credential-already-in-use / with an error, the flag cleared in every case (and when the SDK fails), the legacy marker removed, the menu's retry state. **152 core tests.**

## Session 4 in one table

| Step | Commit | What it added |
|---|---|---|
| 1. Tutorial | `124b048` | The Academy: three skippable lessons before the Survival Test (same reward either way), one-time screen tips with "Show tips again", save v2 |
| 2. Wiki | `9de174e` | Wiki tab and a ? button on every screen; generated pages for all content; 9 hand-written guides; `npm run validate` checks pages, links and config placeholders |
| 3. Achievements | `c692a6a` | 20 achievements (retroactive, toasts, claim screen), summon tickets and Rare+ tickets, the achievement-exclusive Naruto (Nine-Tails Chakra Mode) |
| 4. Settings | `965e2cc` | Battle speed, Auto-ult mode, tips, replay tutorial, account states, typed reset, version + What's new; audio/VFX placeholder toggles |
| 5. Endgame | `e940bc8` | Hard mode (per part, autotuned, counter-gap bands hold), the Daily challenge (4 twists, sim-checked), Hard economy check |
| 6. UX and copy QA | `a57500a` | `tools/ui-audit.mjs` + QA.md; 44 px targets, two dead ends fixed, landscape side rail, loading/error states, empty states, copy fixes |
| 7. Docs | `ac69643` | README, DESIGN (§9–13 new), BALANCE (§2–4, §6 Hard rows), CONTENT_GUIDE (§10–12 new), NAMING, this file |
| 4b. Cleanup | `2a3d020` | Hard `n_summit_3` retuned 0.33 → 0.325 (78%, its mid-arc goal); `autotune` takes per-node search overrides |
| | `e4df7ab` | "Part II on Hard" achievement (21 in all), retroactive on load, with a core test |
| | `bb4132b` | The no-tutorial `n_birth_4` case closed as noise (100-player runs, BALANCE.md §4) |

**Checks:** `npm test` passes: validate (content, balance, names, Wiki), syntax on 59 files, **110 core tests**, **61/61 sim scenarios** (Story and Hard bosses, counter-gap bands in both modes, Boss Rush) plus the Daily info check, and **10/10** free-to-play campaign players clearing Parts I–II. The layout audit is clean at 390×844, 360×780, 844×390 and 1280×800 (QA.md).

**Live:** https://dygoma.github.io/shinobi-auto-battler/, deployed by the workflow since `5caae86` (see "Live check" at the end).

**Deploys** now go through `.github/workflows/pages.yml` on every push to `main` (Actions tab → "Deploy to GitHub Pages", about a minute). It writes `version.json` and uploads the repo as the Pages artifact. If a deploy ever needs the old way back: Settings → Pages → Build and deployment → Source → "Deploy from a branch".

---

## The art, audio and VFX pass

### Ground rules
* **No official artwork, audio or logos.** The README and the About screen say so; keep it true. Original fan art, or assets with a licence that allows it (list them in a CREDITS file with their licences).
* **Keep the game working without assets.** Load images and sounds with a fallback to today's code-drawn shapes and synth, so a failed download never breaks a battle. There is no asset loader yet: add one that preloads a battle's assets before the battle starts.
* **Budget for phones and GitHub Pages.** Everything ships as static files from GitHub Pages (no CDN, no build step). Prefer WebP/AVIF sprite sheets and short Ogg/MP3 loops; lazy-load per arc.
* **Respect the settings:** `settings.muted` today, and `settings.music`, `settings.sfx`, `settings.vfx` (already in the save, default on; see "Settings wiring").
* **Re-run QA.md's audit** at all four sizes after the swap, and keep tap targets at 44×44.
* Keep dub names on anything with text (NAMING.md).

### 1. Battle units (canvas) — `js/render/Renderer.js` `_drawUnit()`

The battle is a **1280×720 logical canvas**, scaled by `devicePixelRatio` (up to 3) and letterboxed. Every unit (your ninja, enemies, bosses, summoned adds, escorts) is the same token:

| Part | Drawn as | Logical size (normal unit) |
|---|---|---|
| Shadow | dark ellipse at the feet | 56×16 |
| Body | tunic trapezoid in a darker shade of the unit's `color` | 36 wide at the feet, 24 at the shoulders, 34 tall |
| Sash | bar in the unit's active nature colour (white for taijutsu) | 26×5 |
| Head | circle in `color`, white outline (yours) or dark (enemies) | 48 diameter |
| Headband | plain grey plate, no village symbol | 46×7 |
| Initials | `initials`, 900-weight system font | 15 px |

* **Whole unit:** about **56×82** logical px; bosses ×1.3 (about **73×107**), summoned adds ×0.85. On phone portrait the lane renders at ~0.3×, so units are drawn up to **2.4× bigger** (`unitScale`, head kept ~30 CSS px) and allies alternate between two rows.
* **Anchor:** bottom centre at (`u.x`, `GROUND_Y` 560 + depth). Depth is −7/0/+7 px per unit (±24×unitScale rows on phone portrait).
* **Facing:** your ninja face right, enemies face left (mirror one sheet).
* **Motion (all in code, reuse for sprites):** walk bob (|sin|, 5 px), idle bob (1.2 px), a 12 px lunge on each attack (0.16 s), a white hit flash (0.12 s), death fade (~0.6 s) while sinking 20 px, blinking while invulnerable (revive).
* **Status overlays:** enrage or ATK-buff aura (ellipse 84×112), stun stars (3 orbiting), taunt ring (r 40), reflect hexagon (r 50), absorb-shield bubble (r 46), a dashed green ring on escorts you protect.
* **Data:** each character in `js/content/roster.js` and each enemy in `js/content/enemies.js` has `color`, `initials` and `emoji` (70/70 characters, 156/156 enemies). Characters: **60 base ninja + 10 alternate forms**. Enemies: **156 entries, 71 of them `basedOn` a character** (their sprite can reuse or recolour the character's), so **85 distinct enemy looks**, 37 of which are bosses.
* **Suggested sprite spec:** transparent sheets per unit with idle, walk, attack, hit, cast (Ultimate or jutsu wind-up) and KO frames, authored at 3× (about **170×250 px** per frame for a normal unit, **220×320** for a boss), feet at the bottom centre.

**HUD over units** (`_drawHud`, `_drawTelegraphBars`, `_drawZones`) can stay code-drawn, but restyle to match:
* HP bar 60×7 (bosses 120×9) with a nature pip (r 5); your chakra bar (3 px) under it; boss name or "Protect: …" label (15 px).
* Wind-up banner above the caster: rounded box ≥140×34 with "⚠ jutsu name", a nature-coloured border and a progress line.
* Ground target rings under the jutsu's targets: pulsing ellipses 88×28 in the nature colour.

### 2. Battle backgrounds — `Renderer._buildBackground()`

* Built once per battle into an offscreen 1280×720 canvas from the arc's `theme` (`sky: [top, bottom]`, `far`, `ground`, `accent`), then drawn at **1320×760 from (−20, −20)** so screen shake never shows an edge.
* Contents: sky gradient, a sun/moon disc at (1030, 120) r 54, two hill layers, 26 triangle trees, ground gradient from y 540, a lane stripe at y 578.
* **Slots:** one per arc (**25**, themes in `js/content/arcs/part1.js` and `shippuden.js`), the Academy (`js/content/tutorial.js`), and the Boss Rush (its theme is hard-coded in `BattleScreen.open()`). The Daily challenge and Hard mode reuse the boss's arc.
* **Spec:** 1320×760 logical (2640×1520 for DPR 2; 3960×2280 if you want DPR 3 crisp), or parallax layers (sky, far, near, ground). Keep the ground line at y ≈ 560 (units stand on y 520–600), keep the area behind units low-contrast, and keep the top 58–108 px readable: the announcer banner sits there.

### 3. Battle effects (VFX) — `js/render/Effects.js`

Driven by sim events (`onEvents`), capped at 260 live items, drawn after units:

| Event | Today |
|---|---|
| ranged auto-attack (range > 150) | 5 px glowing dot arcing to the target (0.22 s) |
| damage | floating number (20 px; crits 27 px with ✦; Ultimates and specials 30 px) tinted by matchup; "EFFECTIVE!" / "resisted" tags (throttled 0.7 s per unit); sparks on crits, Ultimates and specials; "(N absorbed)" |
| heal, miss, stun, immune | "+N" (green), "miss", "STUNNED", "immune" |
| Ultimate fired | two rings (nature colour r 150, white r 90), 18 sparks, announcer "Short: Ultimate name!", screen shake |
| AoE | white ring of the AoE radius at the ground |
| **Jutsu Clash** | two-colour beam between clasher and caster, a big ring, 32 sparks, announcer "JUTSU CLASH — OVERPOWER! / STANDOFF / OVERWHELMED", shake 12 |
| enemy jutsu lands | sparks on each target, shake 6 |
| boss specials and mechanics | announcer lines plus rings: telegraph, revive (gold ring), shield (blue ring) and shield break ("SHIELD BROKEN"), enrage (red ring, shake), element swap (ring in the new nature, "→ X Style"), reflect warning and reflect, summon, rally |
| KO | grey sparks and a ground ring |

* **Announcer banner:** top centre, dark box 50 px tall (×up to 1.8 on phones) with a coloured underline, 1.4–1.8 s.
* **What the pass should add:** per-nature impact styles (Fire, Wind, Lightning, Earth, Water, and taijutsu), signature Ultimates (every character's `ult.name` is a canon dub jutsu name: Rasengan, Chidori, Sand Coffin…), clash visuals worthy of the system, boss mechanic visuals, and KO. Honour `settings.vfx` (detail level) and `prefers-reduced-motion` (CSS already respects it; the canvas shake does not yet).

### 4. Battle screen (DOM) — `js/ui/BattleScreen.js`

* **Ultimate bar:** a portrait button per ninja (avatar **46 px**, **34 px** on narrow phones), name, Ultimate name, chakra fill, a glowing "ready" state, and the clash prediction badge (▲ OVERPOWER / = STANDOFF / ▼ WEAK).
* **HUD:** objective, timer, 🤖/👆 Auto-ult, 1×/2× speed, ⏸ pause (44 px icon buttons).
* **Phone portrait info panel** (`_buildInfo`): Nature Wheel chips and a foe list.
* Pause menu, round-clear boxes (Boss Rush, Daily gauntlet), results dialogs, coach tips.

### 5. Portraits and tokens (DOM) — `js/ui/dom.js` `avatar()`, `StoryMapScreen.js` `enemyToken()`

* `avatar()`: a circle in the character's `color` with `initials`, a tier-coloured ring, and the `emoji` as a badge bottom-right (24 px, 18 px on small). Sizes: **56 px** (default), **40 px** (`sm`), **84 px** (`lg`, Kage reveals), **46 / 34 px** (battle bar). "?" silhouette for unrecruited ninja.
* Used on Home, Team, Roster and the character dialog, Summon (featured and reveal), every Wiki character list and page, Daily, Achievements (the exclusive reward) and the battle bar.
* `enemyToken()`: a **40 px** circle with a red ring: node panel, Daily, Boss Rush, Wiki enemy lists.
* **Spec:** a square portrait per character and form (**256×256** covers 84 px at DPR 3), shown in a circle; boss portraits at least, ideally every enemy look (85).

### 6. Summon animation — `js/ui/SummonScreen.js` `playAnimation()` + CSS

* Dark radial overlay (scrolls when the cards don't fit).
* A CSS scroll: 96 px paper band reading "SUMMONING JUTSU" between two rods, unrolling over 0.8 s.
* A full-screen flash in the best tier's colour (bigger for Kage), and a particle burst (24 for Jonin, 60 for Kage) in its own fixed layer.
* **Reveal cards:** 3:4, 5 per row up to 900 px (3 on phones), tier border (Kage glows), a NEW! / ★ / +Ryo tag, portrait, name, tier, Rate-up pill; then Continue.
* Sounds: `scroll()` then `pullReveal(tier)` per card.
* **Slots:** scroll art, per-tier card frames, reveal and flash VFX, Kage fanfare.

### 7. UI chrome, icons and fonts

| Slot | Today | Where |
|---|---|---|
| Brand mark | 30 px orange circle with 忍 | top bar, `index.html` + `.brand-mark` |
| Favicon | inline SVG (orange circle, 忍) | `index.html` `<link rel="icon">` |
| App icons (0.11.1) | `icons/icon-192.png`, `icons/icon-512.png`: the same orange disc (r 30/64) with 忍 (Yu Gothic Bold, 56 % of the side) on the app background #0d1117; `icons/icon-512-maskable.png`: full orange #f0691f, the glyph inside the 80 % safe zone; `icons/apple-touch-icon.png` 180×180 like the 192 | `manifest.webmanifest`, `index.html`; regenerate with `tools/make-icons.ps1` (Windows, System.Drawing). Final art: 192, 512 and a maskable 512, plus 180 for iOS |
| Home hero decoration | 200 px 忍 at 3.5% white | `HomeScreen.js` `.hero .kanji` |
| Tab icons | emoji 🏯 🗺️ 👥 📖 📜 📚 ⚙️ (20 px) | `UIManager.js` `TABS` |
| Currencies | 📜 scrolls, 🪙 Ryo, 🎟️ summon ticket, 🎫 Rare+ ticket | top bar, rewards, Summon, Achievements |
| Challenge and twist icons | 📅 Daily, 💀 Hard, ☁️ Boss Rush; 🎯 🚫 ⚔️ ⬇️ twists | `HomeScreen.js`, `Daily.js` `TWIST_TEXT` |
| Achievement categories | 🗺️ 📖 ⚔️ 👤 | `js/content/achievements.js` |
| Tip icons | emoji per tip | `js/ui/tips.js` |
| Nature chips | coloured CSS pills ("Fire Style"…) | `.nat.*` in `css/style.css`; the same colours are in `Renderer.NATURE_COLORS` (keep both in sync) |
| Tier colours | CSS `--r-genin` … `--r-kage`; `Renderer.TIER_COLORS` | everywhere |
| Story map | node dots (58 px, bosses 72 px, 50 px on phones) joined by an SVG polyline; arc cards | `StoryMapScreen.js` |
| Nature Wheel chart | SVG built in code | `WikiScreen.js` (the nature-wheel page) |
| Fonts | system UI stack (`--font`) | `css/style.css` |

A display font for titles and a nature icon set (to sit in the chips and on the canvas pips) are the obvious additions.

### 8. Audio — `js/audio/AudioManager.js`

A synth (oscillators and filtered noise, no files). The context unlocks on the first tap; master gain 0.5; mute is `settings.muted` (top-bar 🔊 and Settings → Sound).

| Sound | When | Called from |
|---|---|---|
| `hit`, `crit`, `effective`, `resisted` | every damage event (throttled) | `BattleScreen._sounds` |
| `ultReady` | a portrait fills | `BattleScreen._sounds` |
| `ultFire` | an Ultimate fires (tap or Auto-ult) | `BattleScreen` |
| `clash(outcome)` | a Jutsu Clash resolves | `BattleScreen._sounds` |
| `telegraph` | an enemy wind-up starts | `BattleScreen._sounds` |
| `victory`, `defeat` | battle end, Boss Rush and Daily round clears | `BattleScreen` |
| `scroll`, `pullReveal(tier)` | summon animation | `SummonScreen` |
| `click` | tab bar, 🏆 button | `UIManager` |
| `levelUp` | a level-up | `RosterScreen` |
| `achievement` | an achievement toast or claim | `UIManager`, `AchievementsScreen` |

**Missing entirely: music.** Suggested set: title/Home, Story map, battle (per part or per arc mood), boss battle, Boss Rush, victory and defeat stingers, summon. Plus per-nature impact sounds, signature Ultimate sounds, and UI sounds for dialogs and claims. No voices (no official audio).

### 9. Settings wiring

Settings → Audio and visuals already shows three **disabled** switches bound to save keys that exist, default to on, and survive migrations:
* **Music** → `settings.music`
* **Sound effects** (a separate switch from Sound) → `settings.sfx`
* **Visual effects** (effect detail) → `settings.vfx`

When the pass lands: drop `{ disabled: true }` in `SettingsScreen.js`, read the keys in `AudioManager` (a music bus and an effects bus under the master gain) and `Effects` (detail level), and update the Wiki guides and What's new (standing rule).

---

## Still open

**Balance and content**
1. **The counter-gap depends on the team more than the mode.** A Tsunade-led (HP buff, healer) team fights long, steady battles where being countered costs far more (3 of 4 countered: 7% instead of 26%), in the story as much as on Hard. The Hard scenario uses the story's team to measure the mode; see BALANCE.md §6. Worth knowing if the wheel is touched again.
2. **Daily difficulty is bimodal.** Tuned so every sampled player clears every twist within 3 tries at least half the time, which leaves most days comfortable (median win per attempt ~100%). A per-boss adjustment would make typical days harder without making the worst ones impossible (BALANCE.md §4).
3. **Nagato's Earth**, **Boss Rush Pain's five natures**, **Part II dub titles from Wikipedia's season lists**, **non-boss nodes are easy at level**: carried over from Session 3 (see the Session 3b handoff in git history, `025bf7f`).

**Platform**
4. **Real-device checks** before a release: notch/home-bar safe areas on iPhone in both orientations, iOS Safari's collapsing address bar, the Android back button, a Kage 10-summon on a low-end phone (QA.md). **Session 5 adds:** the intro at full speed (the preview pane throttles animations, so it was checked frame by frame), the back button on the intro (skips) and on the menu (stays), and the build stamp clear of the gesture bar. ~~Google sign-in end to end on the Pixel 8a with 0.10.1~~: **done**, verified by the user on a PC and the Pixel 8a (private and regular windows: guest → Google link → cloud-save prompt).
5. **The redirect fallback can't be made reliable on GitHub Pages.** It only runs when a popup can't open (blocked pop-ups, some in-app browsers), and then needs the `authDomain`'s storage as third-party storage, which Chrome blocks by default. The game now reports that case instead of looping silently. **The only full fix is a custom domain** with Firebase's auth helper (`/__/auth/`) served from the game's own origin; Pages can't proxy it (FIREBASE_SETUP.md §9).
6. **Firebase:** the cloud save runs on the free Spark plan (FIREBASE_SETUP.md). QA used the local preview's existing anonymous account with cloud writes switched off (`offline()` in `tools/ui-audit.mjs`) and created no accounts; the live check below created one guest account.

**0.11 (new)**
7. **The tab bar on real phones:** check the Pixel 8a with 3-button and with gesture navigation, and an iPhone's home indicator in both orientations. If a strip remains under the tabs on Android, it is Chrome's chin (see "The tab bar strip on Android" above). **0.11.1:** installed from Chrome and launched from the home screen the game is standalone, so the chin is gone; the gesture bar's inset is then real and the tab bar pads by it once.
12. **The installed app on a real phone (0.11.1):** install it, launch from the home screen, check there is no strip, sign in with Google inside it, force an update and see the toast, and try the back button (the checklist is in QA.md). If the Google window fails inside the app, the menu now offers the browser; if that is what happens on the Pixel 8a, note it here.
8. **5× speed on a low-end phone:** the sim runs up to ~8 fixed ticks per frame at 5×; fine on a desktop and the Pixel 8a class, unmeasured on slow phones.
9. **Presets don't check a battle's rules:** a preset can hold a ninja a battle benches or two ninja the battle forces anyway; the battle's own rules still apply when it starts (as with any team).
10. **Recommended power for Hard** assumes the Hard on-curve team (everyone unlocked by the end of the part, starred up), so it reads high for a player who only just opened Hard. That is what the Hard bosses are tuned for.
11. **Skip after a loss** keeps the node cleared (a win once is enough); a skipped loss costs nothing but time, like a normal loss.

## Live check (0.11.0)

`1f64363` deployed by the workflow (`version.json` = `1f64363`, built 2026-09-25 00:28 UTC), https://dygoma.github.io/shinobi-auto-battler/ in the Claude desktop browser at 412×915 with its Android user agent. The pane was hidden, so everything was driven and measured from JavaScript (no screenshots or coordinate clicks). The profile's existing guest session was restored by the menu (**no Firebase account was created**), cloud writes were stubbed (`offline()`) before entering, and the test saves were built on a copy; the real save was put back afterwards with `skipCloud`.

| Check | Result |
|---|---|
| Load | Start menu, stamp **v1f64363 · 2026-09-25 00:28 UTC**, ▶ Continue (Guest save). No console messages all session. |
| Existing save | The guest save migrated to v3 on load: tutorial done, so `account.tutorialRewarded` = true; 3 empty presets; speed 1×. |
| Tab bar | 860–915 px: 55 px, flush with the bottom edge (inset 0 px in this browser), no clipped label. Home's last row ends at 829 px, 31 px above the bar; the "Kage pity" tile is fully visible. The intro blurb is gone (tutorial done). |
| Dots | Home ("rewards to claim, Daily challenge waiting, Boss Rush open") and Summon ("free summon available") on the QA save. |
| Story map | Tabs 🗺️ Story (on) · 🔒 Hard (Part II not cleared) · 📅 Daily · ☁️ Boss Rush. The next battle (The Tenchi Bridge) pulses, shows ⚡5.6k, and was scrolled to the middle of the screen (402–514 px). The first locked battle is grey with 🔒 and "Clear The Tenchi Bridge first". Cleared battles show ✓. Pre-fight: recommended 5,598 vs team 7,468, "✓ Ready". |
| Skip | On a cleared battle (Traps Activate! Team Guy's Enemy): no battle screen opened, "VICTORY · 18.4 s · ⏭ skipped", +5,020 Ryo (its replay reward), clears +1, buttons Map · Change team · ⏭ Retry · Next fight ▶. No Skip on the next (unwon) battle or on the Daily screen. |
| 5× | The speed button went 1× → 2× → 5× and saved 5; 20 frames of 40 ms (0.8 s) advanced the battle 4.0 s; the next battle opened at 5×. |
| 10-pull | "Skip animation" on: all 10 cards shown at once with no scroll; 900 scrolls; the last card a Jonin (the guarantee); pity 0 → 10. |

Not verifiable here: the real safe-area inset on a phone (this browser reports 0 px; simulated in QA.md), and animations at full frame rate (the hidden pane pauses them).

## Live check (0.10.1, popup first)

`4a9ff3c` deployed by the workflow (`version.json` = `4a9ff3c`, 2026-09-24 15:13 UTC), https://dygoma.github.io/shinobi-auto-battler/ in the Claude desktop browser at 412×915 with its Android user agent and a coarse pointer, on the profile's existing guest session (no account created):

| Check | Result |
|---|---|
| Load | Start menu, stamp **v4a9ff3c · 2026-09-24 15:13 UTC**, no console messages. |
| Tap "Sign in with Google" (a real click) | The in-app browser can't open popup windows, so the popup failed and the **redirect fallback** ran: the same tab went to `accounts.google.com` (redirect_uri the authDomain's `/__/auth/handler`, no `window.opener`). Nothing was entered there. |
| Back to the game in the same tab, sign-in not completed | The flag came back as `kind: "link"` (so the link popup had been tried first), `getRedirectResult` gave no user, and the menu showed **"Google sign-in didn't complete. Chrome may be blocking third-party cookies…"** in the warning colour with **↻ Try again**. Flag cleared. The one console line is the matching `[FirebaseBackend]` warning. This is the Pixel 8a's old silent loop, now reported. |
| Popup closed (the deployed SDK's `linkWithPopup` spied, rejecting with `auth/popup-closed-by-user`; the button pressed from JavaScript) | Calls: `linkWithPopup` only (no redirect, no `signInAnonymously`). Still on the menu, guest session unchanged, no message, buttons enabled, no flag. |

Not verifiable here: a real popup window opening (this browser has none) and completing a Google sign-in (needs a Google account).

## Live check (Session 5)

After `5caae86` deployed through the workflow (run "Deploy to GitHub Pages", success; `version.json` = `5caae86`, built 2026-09-24 14:50:06 UTC), https://dygoma.github.io/shinobi-auto-battler/ in the Claude desktop browser at 412×915 (mobile user agent), the same profile as the Session 4 checks (it already had a guest account for this origin):

| Check | Result |
|---|---|
| Load | Short splash (seen before), then the start menu: **▶ Continue — Guest save**, **Sign in with Google — Link this guest save…**, 📚 Wiki, ⚙️ Settings; stamp **v5caae86 · 2026-09-24 14:50 UTC** bottom-right. No console messages; `version.json?t=…` 200. |
| Back button on the menu | Stays on the menu. |
| ▶ Continue | Home with the tab bar, cloud "synced — Guest (anonymous)", the save uploaded. No console messages. |
| First visit (intro-seen cleared, reload) | The full intro plays (scene, five runners, Skip), then the menu. |
| Accounts | **No new Firebase account** was created: the menu restored the profile's existing guest session, and "Continue as guest" / "Sign in with Google" were not pressed on the live site. |

Not verifiable here: a real Google sign-in (needs a Google account; prohibited for the assistant), the redirect return on a phone, the intro's motion at full frame rate (the pane throttles it).

## Live check (Session 4)

After the push (`ac69643`, GitHub Pages build "built"), https://dygoma.github.io/shinobi-auto-battler/ in the Claude desktop browser (Chromium), 2026-09-24:

| Save | Result |
|---|---|
| **New** (first visit, empty storage) | Loads with no console messages at all. Fresh v2 save, the Academy welcome and tutorial offered, cloud save on as a guest. The Wiki's "Hard mode and Daily challenge" guide loads (`.md` served raw thanks to `.nojekyll`) with this session's copy. No failed requests. |
| **Existing** (a Session 3-format v1 save with Part I cleared, written to `localStorage`, then reloaded) | No console messages. Migrated to v2 with all 32 Part I battles kept; the tutorial skipped itself and paid its reward (+300 scrolls, +450 Ryo); Part I Complete and First Summon unlocked retroactively; Home shows the Daily challenge, "Next on Hard: Pass or Fail: Survival Test" and "Best: round 3" for the Boss Rush. |

**Cleanup check** (`5d2291c`, build "built"), same browser, a fresh profile: a v2 save with the whole story cleared, every Part II battle cleared on Hard (none of Part I) and the seven achievements it already had unlocked and claimed, written to `localStorage`, then reloaded. No console messages. "Part II on Hard" unlocked on load and waits on the Achievements screen with its 🎫 Rare+ ×1 reward (8 / 21 unlocked); "Part I on Hard" correctly stays locked.

The new-save visit signed in anonymously, as every new visitor does, so the Firebase project has one guest account from that check, holding that synthetic test save, and probably a second from the cleanup check (a fresh browser profile also signs in anonymously). Delete it in the Firebase console (Authentication → Users) if you like; anonymous accounts are also cleaned up automatically if that option is on (FIREBASE_SETUP.md).
