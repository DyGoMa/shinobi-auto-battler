# ART_BIBLE.md — the look of Shinobi Auto-Battler

*Phase 2 of the polish pass. Decided with the user in Phase 1 (every recommended pick); shown in `/mockup.html`. Phase 3 builds to this document. Nothing here changes a rule, a number or a battle.*

## 1. The one-paragraph brief

A fan-made game that looks like a late-2000s shonen TV anime on a phone: stylised, big-headed ninja on a hand-drawn field, full-proportion anime busts wherever a face matters, clean cel shading behind a medium-thick ink line, flat saturated colour, and effects built from a small shape language per chakra nature. Part I is warm daylight, paper, wood and the headband plate; Shippuden is cooler and harder, black cloth, dark steel and crimson. Everything must read at 412 px wide with a thumb over it, and everything must still work when an image is missing, because the code-drawn fallback is part of the style, not a placeholder.

## 2. Decisions locked in Phase 1

| Topic | Decision |
|---|---|
| Proportions | Every battlefield figure has the same head size, Part I Naruto's (he is 3.6 heads tall), and stands at its canon height per era (`js/content/heights.js`, from the databooks), so a taller character has a longer body, not a bigger head; giants have one fixed size. Portraits and dialogue busts at full anime proportion |
| Portrait pose | Bust, three-quarter view, the whole head and all of the hair inside the frame with a margin, the head about 38 % of the height for everyone, down to mid-chest so the top's design shows, determined expression, transparent background |
| Outfits per era | Two portraits for the ~25 characters who fight in both parts (Part I outfit and Shippuden outfit, chosen by the arc being played); one for everyone else |
| Sprites | One full-body still per look, animated in code as a cut-out; frame-animated sheets are out |
| Line and render | Medium-thick line, two-tone cel shading, flat colours; era carried by palette |
| UI skin | Palette plus a frame motif per era: paper, wood and the headband plate for Part I; black cloth, dark steel and the red cloud for Shippuden |
| Stages | 27 landmark stages drawn in code (25 arcs, the Academy, the Boss Rush), with parallax and a weather layer where the episode has one |
| Motion | Medium: breathing idle, run cycle, anticipation and smear, hit shake and knockback, cast pose, KO fall, camera shake, hit-stop; two cinematic beats only (clash slow-motion, boss push-in) |
| VFX | Per-nature defaults for every hit, cast and mechanic, plus about 35 signature families; a name card and portrait slide on Ultimates |
| Gacha | New ceremony: hand seal, summoning circle, smoke, portrait rising in tier light; Kage white-out with the full portrait and a name plate |
| Boss intro | Name card, portrait cut-in, camera push, a pre-fight line; about 1.5 s, skippable, 0.8 s on replays |
| Icons | About 40 inline SVG icons replace every emoji; emoji stay only in the data as the last fallback |
| Fonts | Anton (display) and Yuji Syuku (brush accent), both SIL Open Font License, self-hosted subsets under 120 KB; body stays the system font |
| Backgrounds from Gemini | Flat magenta (#FF00FF) requested; the ingest tool keys whatever flat colour it finds at the border by flood fill (so a white background still works, but magenta is safer because white appears inside the art), and flags a file for a manual cut-out when the key is poor |
| Facing | Player characters face right, enemies left; the ingest checklist records the facing of each file and a `flip` flag mirrors one that came out the wrong way (Gemini gets this wrong about one time in four) |
| Village symbols | Headband plates carry the village symbol as the anime shows it (Leaf spiral, Mist lines, Sand hourglass, Sound note, Rain dashes, Cloud, Stone, Jiraiya's 油), in the prompts and in the code-drawn fallback |
| Budget | ≤ 12 ms of main-thread work per frame on a Pixel 8a at 1×, ≤ 2.5 MB first install, ≤ 300 KB per lazy arc pack, ≤ 12 MB of assets, ≤ 150 MB memory |

**Canon priority (the user's rule, after the Phase 3 review):** every detail follows the anime first (the English dub's wording, which the game uses), then the manga, and only where neither has anything an invention that fits the Naruto universe and the situation. It governs boss epithets, technique names, looks in the image prompts, dialogue and flavour text. Inventions are marked as such in HANDOFF.md so they can be replaced.

## 3. Characters

### 3.1 The battlefield figure (`mockup/figure.js`, the fallback that ships)

Unit space: the feet at (0, 0), +x forward, one unit = one logical canvas pixel at unit scale 1. Every unit is scaled by its canon height over Part I Naruto's (`js/core/stature.js`: 147.5 cm is ×1, Kakashi's 181 cm is ×1.23, a giant ×2.5); bosses and adds get no extra size. A sprite's soles-to-skull span (from its head marks) is 86 units at ×1, whatever the hair adds; the code-drawn figure is 96 units at ×1. On phone portrait the whole figure is drawn up to 2.6× so a head stays about 30 CSS px wide (the game's existing rule, `Renderer.unitScale`, with the new head size).

| Part | Size (units) | Notes |
|---|---|---|
| Head | radius 17, centre 4 above the shoulders, 2 forward | the hair silhouette is the character's identity at this size |
| Body | shoulders 34 wide, hips 26 wide, 34 tall | a vest over a shirt: main colour, darker collar |
| Legs | 26 tall, 11 wide capsules | swing ±10 when walking |
| Arms | 9.5 wide capsules | hanging at rest, forward for the cast pose, thrown forward on the lunge |
| Shadow | ellipse 52×16 at the feet | never rotates with a KO |
| Sash | 24×7 at the neck | the unit's active nature colour, white for taijutsu (unchanged from today) |

Hair variants: `spiky` (Naruto, Kakashi), `sweep` (Sasuke), `long` (Sakura, Haku), `bob`, `short`, `mane` (Jiraiya), `bald`. Headgear: the headband with the character's **village symbol engraved on the plate** (`village`: `leaf`, `mist`, `sand`, `sound`, `rain`, `cloud`, `stone`, or `oil` for Jiraiya's Mount Myoboku plate; drawn by `drawVillageSymbol()` as a simplified mark), a tilted band (Zabuza), a happuri face guard (Yamato), horns (Jiraiya), a cloth mask (Kakashi), bandages (Zabuza). Faces: two eyes with a highlight, angled brows, a short mouth line; `menace` narrows the eyes for enemies and bosses. Whiskers for Naruto. The user's rule, decided at the Phase 2 gate: in-world symbols are drawn as the anime shows them; "no official artwork" means no copied assets, not no depiction of the world's own marks.

When a sprite image exists the figure is replaced by it: the image is scaled to 110 units tall (a little more than the 96-unit code figure, because the generated chibi proportions read shorter at the same height), anchored at the bottom centre, mirrored for the enemy side, and given the same lean, lunge, flash (a brightened overlay) and KO transforms.

### 3.2 Line and shading (applies to the fallback, the busts, and the brief for generated art)

* Ink: `#181310` at 92 % opacity; 3 units wide on the figure, 4 on a bust, round joins and caps. Line weight is even; no tapering.
* Shading: exactly two tones. The shadow is the base colour multiplied by 20 % black on the back half of every shape (light from the front and above). No gradients on characters. No rim light except a faint cool rim on Shippuden hair.
* Colour: flat and saturated; skin `#f2c49a` (Naruto), `#f6d6bd` (Sasuke), `#f8dcc6` (Sakura); a character's main colour is the roster `color` field today, kept as the vest colour.
* Highlights only on eyes, metal plates and blades.

### 3.3 Portraits (`assets/portraits/<id>.webp`)

* Delivered at 256×256 (generated at 1024×1024, downscaled by the ingest tool). One file serves every context.
* Framing: the whole head and all of the hair inside the frame with a margin above the highest spike, down to mid-chest so the collar and the top's design show; the head (chin to skull) about 38 % of the height for everyone; the shoulders reaching the sides at the bottom; the face centred horizontally so a circle crop of the middle 70 % keeps both eyes and the mouth.
* Facing: player characters face right, enemies face left. The same character as an enemy (Sasuke as a boss) uses the player portrait mirrored by the game; no second file.
* Era: `<id>.webp` is the era the character is unlocked in. `<id>_p1.webp` / `<id>_p2.webp` exist only for the dual-era characters (§3.5). The loader picks the era of the arc being played and falls back to the other file, then to the code-drawn bust.
* Contexts and crops: 56 and 40 px round tokens (tier ring, the enemy ring in red), 44 px square in the ult bar, 96 px framed square in the dialogue box, 80 px in the cut-in, 120 px in the boss card, full size in the Kage reveal. The frames are the era's (§7).
* Fallback: `drawBust()` in code, same hair and headgear variants as the figure.

### 3.4 Sprites (`assets/sprites/<id>.webp`)

* A full-body still, standing ready, three-quarter view facing right, feet at the bottom centre with a small margin, delivered at 512 px tall (generated at 1024 square), transparent.
* Bosses get the same file at the boss scale; adds and clones reuse their base character's file recoloured by the `basedOn` rule where one exists.
* Cut-out motion is applied by the code (§6).

### 3.5 The dual-era list (two portraits, two sprites)

Naruto, Sakura, Sasuke, Kakashi, Shikamaru, Choji, Ino, Kiba, Shino, Hinata, Neji, Lee, Tenten, Might Guy, Asuma, Kurenai, Gaara, Temari, Kankuro, Jiraiya, Tsunade, Shizune, Orochimaru, Kabuto, Iruka. Their `_p1` outfits are the Part I designs; their default file is the Shippuden design.

## 4. Palette

### 4.1 Era tokens (CSS custom properties on `[data-era]`)

| Token | Part I | Shippuden | Use |
|---|---|---|---|
| `--bg` | `#17120e` | `#0a0b0f` | app background |
| `--bg2` | `#1e1811` | `#0f1218` | panels behind lists |
| `--surface` | `#261e16` | `#141923` | cards |
| `--surface2` | `#33291d` | `#1b2230` | buttons, inputs |
| `--line` | `#5a4630` | `#303b4c` | hairlines |
| `--paper` / `--paper2` | `#f1e3c4` / `#dcc79a` | `#dfe4ec` / `#b7c0cc` | name plates, the objective plate, dialogue box |
| `--paper-ink` | `#2a1d0f` | `#11151c` | text on paper |
| `--wood` / `--wood2` | `#7a5230` / `#45301a` | `#2a313d` / `#171b23` | card frames, borders (Shippuden: cloth) |
| `--steel` / `--steel2` | `#b3bcc6` / `#6b7885` | `#97a6b8` / `#4d5a6b` | the tab bar plate, frame edges |
| `--text` / `--muted` / `--dim` | `#f5ecdc` / `#c7b79b` / `#8b7b63` | `#eef2f7` / `#9fb0c3` / `#67788c` | type |
| `--accent` / `--accent2` | `#ff8a3d` / `#ffb86b` | `#e63946` / `#ff6b6b` | primary buttons, the active tab, current node |
| `--good` / `--bad` / `--warn` | `#6fd68f` / `#ff5d5d` / `#ffcc4d` | same | status |

Nature and tier colours are unchanged from the game (`--n-fire #ff5a36`, `--n-wind #5fd38a`, `--n-lightning #ffd43b`, `--n-earth #c08a52`, `--n-water #3fa9f5`, `--n-none #d7dde5`; `--r-genin #a3aebb`, `--r-chunin #4dabf7`, `--r-jonin #b388ff`, `--r-kage #ffc53d`). They are the tint of every chip, pip, number and glyph, and `Renderer.NATURE_COLORS` stays in sync with the CSS.

### 4.2 Where each era shows

Home, the Story map and the battle follow the part in play; the Summon screen follows the selected banner's arc; the Wiki and Settings stay neutral in the Part I skin; the start menu follows the player's current part. The switch is one attribute (`data-era` on the app root or the screen), so there is no duplicated CSS.

## 5. Type

| Role | Face | Where | Sizes |
|---|---|---|---|
| Display | **Anton** (OFL), uppercase, letter-spacing 3–6 % | screen titles, name cards, boss names, readouts, floating numbers, timers, tier labels, primary buttons | titles 1.5–2.4 rem; readouts 1.8–2.8 rem; numbers 20–36 logical px on the canvas |
| Brush accent | **Yuji Syuku** (OFL) | the 忍 mark, boss titles ("Demon of the Hidden Mist"), narrator captions, era stamps, the summoning circle's kanji | 0.9–1.2 rem |
| Body | system UI stack (unchanged) | everything else | unchanged |

Both faces are self-hosted as subsets (Latin basic for Anton; the kanji and kana actually used for Yuji Syuku) under 120 KB combined, `font-display: swap`, with the system stack as fallback so nothing waits for a font.

## 6. Motion

* **Idle:** breathe 1.3 units over 2.6 s; the head follows at 40 %.
* **Walk:** legs swing ±10 units at 15 rad/s; a 5-unit bob.
* **Attack:** 80 ms anticipation lean back, 120 ms lunge (12 units forward, arm thrown), 160 ms recover. Speed lines behind a dash.
* **Hit:** 60 ms white flash over head and body, 6–10 units knockback, camera shake 6. Ultimates and specials add 70 ms of hit-stop and shake 9–12.
* **Cast:** the front arm comes forward and holds for the wind-up; the nature's cast particles orbit the hand.
* **KO:** rotate 80° around the feet and fade over 0.5 s; clones and summons dissolve in smoke instead.
* **Stun:** three orbiting stars above the head (kept from today).
* **Camera:** ±8 px idle drift; the boss intro pushes in to 1.07× over 1.2 s with speed lines; the clash pushes to 1.08×.
* **Clash:** 0.35× slow motion for about 0.5 s of wall time from the moment the two jutsu meet; the meeting point drifts toward the loser; shake 14 on resolution.
* **UI:** screens slide 6 px and fade over 0.2 s; the cut-in wipes in over 130 ms, holds 0.75 s, wipes out; readouts pop from 1.6× to 1× in 160 ms; dialogue text types at 32 characters per second.
* **Low VFX / reduced motion:** no particles, shake, slow motion or push-in; flashes become 40 ms fades; the canvas honours the setting (it does not today).

## 7. UI skin

### 7.1 Shared rules

Tap targets stay 44×44; the layout geometry from QA.md stays (the flush tab bar, the safe-area insets, the 16:9 stage on portrait, the two-column ult bar under 520 px). Every emoji becomes an icon from the set; every icon is `currentColor`, so it takes the era's ink.

### 7.2 Part I components

* **Top bar:** dark wood with a 2 px wood rule; currencies on paper pills; the 忍 mark in the brush face on the orange disc.
* **Tab bar:** a brushed-steel headband plate (light to dark vertical gradient) with dark ink icons; the active tab in burnt orange with a 3 px accent bar.
* **Cards:** dark surface, 2 px wood frame, an inset paper highlight; paper panels (`.paper`) for plates and readouts.
* **Buttons:** primary = the orange gradient with dark ink in the display face; others = surface with a wood border.
* **Battle HUD:** a wood band; the objective on a paper plate with an orange edge; the timer in the display face on black.
* **Ult bar:** paper-framed portraits on wood plates; the ready state glows orange.
* **Dialogue box:** paper with a 3 px wood frame; the name plate a wood tag with paper text; the enemy side mirrors the layout.
* **Map:** the arc's stage behind the path; pins are paper discs with wood rims (numbered; the boss pin larger with the crown icon); cleared pins green, the current pin pulsing orange, locked pins grey.
* **Summon:** the ceremony frame in wood; rarity cards with the tier colour, the Kage card with a rotating ray and a gold plate.

### 7.3 Shippuden components

Same layout, different skin: black cloth surfaces with a steel top edge on cards and a faint red cloud watermark on Akatsuki surfaces only (a generic cloud shape, not the show's), crimson primary buttons with white type, a dark steel tab bar with the active tab in light red, the objective plate on black with a red edge, portraits in dark steel frames with a red top edge, the dialogue box on cloth with a steel frame and a red name tag.

### 7.4 The icon set (inline SVG, 24×24)

home, map (pin), team, roster (book), scroll, wiki (open book), settings (gear), ryo (coin), trophy, sound, fire, wind, bolt, earth, water, shield, sword, target, plus, crown, skull, calendar, cloud, ticket, star, lock, check, skip, play, pause, auto, back, kunai; plus the nature glyphs drawn on the canvas by `drawGlyph()` in the same shapes.

## 8. Stages (`mockup/stage.js` → `js/render/Stage.js`)

### 8.1 How a stage is built

A stage is data: a sky (three stops), an optional sun or moon, a palette (far, mid, near, ground, accent), three to four layers each with a depth and a draw function using the shape helpers (`ridge`, `tree`, `canopy`, `cloudShape`, `rock`, `crack`, `poly`), a ground function, and a weather kind. Each layer is drawn once into an offscreen canvas 96 px wider than the screen on each side; every frame the sky gradient is filled, the layers are blitted shifted by `cam.x × depth` (parallax), the ground by `cam.x`, then the live weather. Push-in is a scale about the point (640, 430). Cost: five `drawImage` calls and up to 90 weather particles per frame.

Rules: the ground line stays at y = 560 and units stand on y 520–600; the band behind the units (y 380–600) stays low-contrast; the top 58–108 px stays clear for the announcer; the accent colour appears once in the scene (a lantern, a flag, a flame) so the arc's colour reads on the map card too.

### 8.2 The 27 stages

| # | Arc | Stage | Landmark | Time / weather | Era |
|---|---|---|---|---|---|
| T | The Academy (tutorial) | `academy_night` | the Academy building and its big tree, paper lanterns | night, fireflies | I |
| 1 | Prologue: Survival Test | `training_ground` | the three posts and the memorial stone | early morning, leaves | I |
| 2 | Land of Waves | `waves_bridge` | the unfinished bridge, pylons, the sea | overcast, mist | I |
| 3 | Chunin Exams | `forest_of_death` / `exam_arena` | giant trees and the tower; the arena stands for the finals | day; day | I |
| 4 | Destruction of the Hidden Leaf | `leaf_invasion` | rooftops, the monument cliff behind, smoke columns | afternoon, embers | I |
| 5 | Search for Tsunade | `tanzaku_town` | the castle wall and a giant snake silhouette | dusk | I |
| 6 | Land of Tea | `tea_coast` | a shrine gate on a cliff over the sea | bright day, spray | I |
| 7 | Sasuke Retrieval Squad | `final_valley` | the two great statues and the waterfall | grey day, rain (final node) | I |
| 8 | Kurosuki Family | `katabami_graveyard` | grave markers and the mine mouth | storm, rain and lightning | I |
| 9 | Kazekage Rescue | `sand_canyon` | the Hidden Sand's canyon walls and rounded roofs | noon, sand | II |
| 10 | Tenchi Bridge | `hideout_crater` | the collapsed roof of Orochimaru's hideout (mockup) | overcast, ash | II |
| 11 | Twelve Guardian Ninja | `fire_temple` | the temple gate and stone lanterns | dusk, embers | II |
| 12 | Akatsuki Suppression | `nara_forest` | the bounty station shack and the deer forest | evening | II |
| 13 | Three-Tails' Appearance | `three_tails_lake` | the lake, the crystal spires | mist over water | II |
| 14 | Itachi Pursuit | `uchiha_hideout` | ruined halls, the fan crest carved out (not shown) | grey day | II |
| 15 | Tale of Jiraiya | `rain_village` | pipe-and-tower skyline | rain | II |
| 16 | Fated Battle Between Brothers | `unraikyo` | cliffs and lightning-scarred ground | storm | II |
| 17 | Six-Tails Unleashed | `tsuchigumo_village` | terraced village and the well | day, leaves | II |
| 18 | Pain's Assault | `leaf_crater` | the crater, the monument cliff, ruins | overcast, ash | II |
| 19 | Five Kage Summit | `iron_summit` | the summit hall on a snowfield | snow | II |
| 20 | War: Countdown | `island_turtle` | the giant turtle's back, a waterfall | bright day | II |
| 21 | War: Confrontation | `war_front` | broken ground, banners, the reanimated | dust | II |
| 22 | War: Climax | `kamui_dimension` | floating cubes in the void | none | II |
| 23 | Kakashi: Shadow of the ANBU | `anbu_forest` | a moonlit forest, a stone altar | night, mist | II |
| 24 | Birth of the Ten-Tails' Jinchuriki | `dead_tree_field` | the great dead tree and the battlefield | ash | II |
| 25 | Kaguya Otsutsuki Strikes | `lava_dimension` → `final_valley_night` | lava fields, then the statues at night for the last two nodes | embers; night | II |
| R | Boss Rush | `akatsuki_cave` | the cave, the great statue's hands (no faces) | torchlight, embers | II |

Three of these are built in the mockup (`training_ground`, `waves_bridge`, `hideout_crater`); the rest follow the same recipe in Phase 3.

## 9. Effects (`mockup/vfx.js` → `js/render/Effects.js`)

### 9.1 The particle language per nature

| Nature | Impact | Cast | Colours |
|---|---|---|---|
| Fire | 18 flame tongues fanning up, 10 embers, 5 smoke puffs, an orange ring | embers spiralling up around the hand | `#ff5a36`, `#ff8a3d`, `#ffd166`, core `#fff3b0` |
| Wind | 14 crescent blades outward, 6 leaves, a pale ring | crescents orbiting the hand | `#5fd38a`, `#c7ffd8`, white |
| Lightning | a 35 % flash, 7 branching bolts, 18 fast sparks, a white star | bolts flickering at the hand, sparks | `#ffd43b`, `#fff5b8`, white |
| Earth | 16 rock chunks under gravity, 7 low dust puffs, a flat brown ring | pebbles rising from the ground | `#c08a52`, `#8a5a2b`, `#5a3a1a` |
| Water | 22 drops under gravity, 5 mist puffs, a flat splash ring | drops orbiting the hand | `#3fa9f5`, `#9ed8ff`, white |
| Neutral / taijutsu | 10 speed lines, a white star, dust | short white lines | white, `#d7dde5` |

Counts are the Medium setting; High doubles them, Low draws only the rings and the star. Additive blending on Fire, Wind, Lightning and Neutral.

### 9.2 Signature overrides (the same parts, named)

Rasengan (a spinning blue sphere with three bands and a glow at the hand; on impact a three-arm spiral and a wind burst), Rasen Shuriken (a four-blade halo thrown along the lane, a wind dome on impact), Chidori and Lightning Blade (crackling bolts at the hand, a dash with speed lines, a white flash on impact), Chidori Stream (bolts radiating over the ground), Water Dragon (a serpent of water along an arc with a foam core and a head, a splash on landing), Water Prison and the Shark Bombs (spheres and shark silhouettes from the same water strokes), Amaterasu (black flames with a violet rim that linger), Susanoo (a ribcage aura as the shield), Kamui (a spiral warp), Sand jutsu (grain particles gathering, a dome, the shield), Eight Trigrams (the trigram circle on the ground, a blue sphere spin), Shadow Possession (a shadow snaking along the ground), Lotus and Night Guy (speed lines with green or red steam), Snakes and Kusanagi, Reaper Death Seal (a silhouette behind the caster), Summoning (smoke and a silhouette), Mitotic Regeneration (black seal lines spreading, green light), Deidara's clay (white birds, a flash), Sasori's puppets (strings and silhouettes, black iron sand), Hidan's ritual circle, Kakuzu's threads and masks, Almighty Push and Planetary Devastation (shockwave rings, rubble lifting), Konan's paper, Tailed Beast Bombs (a black-violet sphere charge), Flying Raijin (a yellow flash), Wood Style (growth from the ground), the Fire Style family (the classic fireball, a fan of small flames), Particle Style (a white cube beam), Lava Style, the Raikage family (lightning armour), Truth-Seeking Balls, Kaguya's bones and dimension shifts, the Curse Mark (black flame pattern spreading), and Substitution (the log in a puff of smoke). The full technique list by nature is in POLISH_AUDIT.md §5.

### 9.3 Readouts on the canvas

* **Floating numbers:** Anton, 20–36 logical px, a 6 px dark stroke, tinted by the matchup (nature light colour for effective, grey for resisted, white or pale red otherwise), scaled by half the unit scale on phones; the EFFECTIVE! / resisted tag above at 55 % size.
* **Wind-up plate:** a dark plate above the caster with a 6 px nature edge, the nature glyph, the jutsu name in Anton, a progress line, and a CLASH tag on the right when the jutsu can be clashed. Width fits the text up to the canvas width.
* **Target zones:** a dashed ellipse in the nature colour at each threatened unit's feet, pulsing and tightening as the wind-up completes.
* **Unit bars:** a dark plate, the HP fill with a light top edge, a nature glyph in a disc at the left, the chakra line under it, boss names in Anton.
* **Cut-in name card (DOM):** a slanted paper (or black) band across the top-left with the portrait, the character's name small and the technique large.
* **Clash readout (DOM):** JUTSU CLASH small above, the outcome large in the outcome colour with a dark stroke, popping in and drifting up.
* **Boss intro (DOM + canvas):** letterbox bars, a push-in with radial speed lines, the boss card (portrait, tag line, name in Anton, title in the brush face), the boss's health bar filling, then the pre-fight line in the dialogue box, then a FIGHT! readout.

## 10. The gacha ceremony

Under 3 s for one, under 6 s for ten, tap to skip. Beats: the summoner's silhouette forms the seal (0–0.9 s, chakra motes rising) → the summoning circle draws on the ground with a rotating kanji ring (0.9–1.6 s) → light rises from the circle (1.6–2.3 s) → a smoke burst and a flash (1.9–2.3 s) → the portrait rises in tier-tinted light; a Kage whites out the screen and lands on the full portrait with a gold plate (2.3 s on). Ten cards fan from the one circle. Rarity frames: Genin grey-blue, Chunin blue with a soft glow, Jonin violet with a stronger glow, Kage gold with a rotating ray and a pulsing glow.

## 11. Assets and fallbacks

* **The reference set and the prompts** (`tools/prompt-builder.mjs`). Four pictures come first, in order: Part I Naruto's sprite (the ruler for every sprite: head size, proportions 5.42 heads, anime-true, measured from his marks, outline weight), his portrait (made with that sprite attached; the ruler for every portrait's framing), Shippuden Naruto's sprite (the Part I sprite attached), his portrait (the Part I portrait and the Shippuden sprite attached). Then every character: a sprite with Naruto's sprite of the same era attached, and a portrait with Naruto's portrait of the era and their own sprite attached. Each prompt is built the way the prompting guides recommend (OpenAI, Google's Nano Banana guide, Luma, Runway, Adept): the deliverable, what each numbered reference controls, a word-for-word style block (Naruto anime cel look; near-black anime-weight inner lines; the outer outline, every edge that meets the background including gaps, about 1.25 times the inner lines), the character, proportions (sprites), pose and framing (relaxed ready stance, loose fists, a clear gap at the hips; portraits: three-quarter view, eyes on the viewer, whole hair in frame, cropped at the lower chest with the torso turned toward the viewer), background (a flat key colour: the first of magenta, green, cyan and yellow that none of the character's described colours clash with, `KEY_ORDER` in prompt-builder; ChatGPT can also ask for a real transparent PNG) and constraints. Every picture faces the viewer's right; the game mirrors the enemy side. The studio has a Gemini tab and a ChatGPT tab, each with its app's checklist for reaching its best image model (Gemini: Pro, Create images, then Redo with Pro for Nano Banana Pro; ChatGPT: a Thinking model for Images 2.5), the files to attach with download buttons, and the prompt; your own wording is kept per tab (`<kind>:<id>` and `<kind>:<id>@chatgpt` in `art-overrides.json`). Match outline takes its target from the saved reference sprite's own outline weight, covers enclosed gaps wide enough to take it (narrower gaps stay as drawn), and leaves Part I Naruto himself as drawn. A painted checkerboard (fake transparency) is flagged.

* `assets/manifest.json` (Phase 3) lists every image: id, file, pixel size, aspect, usage, era, and the Gemini prompt built from the style anchor in `mockup.html` §7.
* `tools/ingest.mjs` reads `/incoming`, validates size and aspect, keys the flat background (`tools/key-lib.mjs`: the colour is the median of the border; a flood fill from the border removes what it can reach, then every enclosed patch of the same flat colour at least 0.2 % of the picture goes too, the white pockets between a headband's tails and the neck that the border fill cannot reach; a soft edge and a fringe pass leave no halo; on a vivid background like magenta, any enclosed pocket of about 0.004 % of the picture or more goes too, the background is cut hard (no soft fade and no fringe pass, which pulled thin outlines toward grey and repainted them with the hair beside them) and the background's colour is un-mixed from the picture (spill): the share t of each pixel is how far its strong background channels (red and blue for magenta) rise above the weak ones, over the background's own; the pixel becomes (P − t·bg)/(1 − t) and t comes off its alpha. It runs on any pixel within three steps of a keyed one with t ≥ 10 %, on any pixel with t ≥ 50 %, and grows from those through touching pixels with t ≥ 20 %, so the outlines keep no magenta and narrow wedges between strands come clean, while a purple detail surrounded by skin (Sakura's seal) is untouched; a `strength` factor, the studio's **Key strength** slider from 30 to 200 %, with − and + (1 % a click) and a number box; a picture that is not square (Gemini sometimes answers 1024 × 559) is flagged, and saving crops a portrait to a square around the character or pads a sprite, scales every tolerance, and moving it keys again from the original picture; a picture that arrives already transparent is not keyed again; then **black lines** (`inkLines`, the studio's Black lines box, on by default; `--keep-line-colour` skips it in the ingest) recolours the outlines to the ink #181310 when the generator drew them dark red or brown or tinted the outer ones toward the background: a line is a dark pixel with something clearly lighter within six steps on both sides along some direction, so a thin stroke qualifies and a wide shadow of the same colour does not; the line colour is the median of those, and each pixel near a line moves by its line share times ink minus line colour, so anti-aliased edges stay smooth. Then, for a sprite, **Match outline** (`matchOutline`, the studio box beside Black lines, on by default; `--keep-outline` skips it in the ingest) thickens the outer outline to Part I Naruto's weight for the figure's height (`OUTLINE_RATIO` 0.0093: his outer outline is about 9 px on a figure about 1,000 px tall; ChatGPT draws about half that): an ink stroke is added outside the silhouette with a soft last pixel, the drawing inside and the inner lines untouched. The sprite prompts ask for that weight too (the outer outline about 1 % of the figure's height, inner lines a little thinner). The prompts ask for near-black #1A1410 outlines, never brown, red, purple or tinted, and say to copy the reference sprite's line weight but not its colour), mirrors files marked `flip`, crops to the frame rules, resizes, writes WebP to `assets/`, and updates `docs/ASSET_CHECKLIST.md`. `--only <id> --kind portrait|sprite --file <name>` limits a run to one file (the art studio's save).
* **The art studio** (`art.html`, `art/art.js`, `art/art.css`; served by `npm run serve` at `/art.html`, never deployed): every portrait and sprite, grouped by the arc it is first needed in, with done / missing / flagged marks and a search. For each image: the prompt in a box (Copy, or edit it and **Save prompt**: your wording is kept per image in `assets/art-overrides.json`, which `tools/manifest.mjs` applies, so a regeneration uses yours); a drop zone that keys the picture in the browser with the same `key-lib` code; **Flip**, **Key again**, a **wand** that removes the patch under a click (Undo), and a warning that counts and outlines the opaque patches still coloured like the background (smaller ones are only flagged, because the whites of the eyes look the same on a white background); the picture over black, white, red and a checkerboard; and the picture where it will be used, through the game's own `avatar()`, the Roster card, a Team slot, the dialogue box and the boss card (a sprite: the battlefield at canon height beside Part I Naruto, the code-drawn figure and mirrored). A sprite also gets **head marks**: drag the cyan line to the top of the skull and the yellow one to the chin (with tall hair, a hat or anything on the head, the skull line goes where the skull would be without it: a little above the headband, below where the hair starts to rise); the soles are found. The studio shows the height in heads against the target (canon height over the shared head size; within 10 % passes) and says by how much the head is too big or small; **Save head marks** stores them for a file already in the game (`/api/art/marks`, `ingest --index-only --mark id:top,chin`), and a new picture's marks go with its save (`--head top,chin`). The index keeps them per sprite as `figures` (fractions of the square; an unmarked sprite gets a guess, `auto: true`). For a new sprite, attach Part I Naruto's sprite to the Gemini prompt as the head-size reference; every sprite prompt carries a PROPORTIONS line with the height and the head count. Under the prompt: **Made with** (Gemini, ChatGPT or other, kept per image in `art-overrides.json` `meta`), and the picture **side by side with the reference** (a sprite: both at canon height, feet on one line, Naruto's skull and chin with a ±10 % band; a portrait: Naruto's portrait beside it). A prompt you edit is kept apart from the generated one: the manifest keeps `generatedPrompt` beside yours, the save records the generated prompt it was made from (`base`), and when a design change alters the generated prompt the page highlights what changed, word by word, for you to carry over. Previews draw at their shown size in real screen pixels, and sprites everywhere (the game too) are shrunk by halving before drawing, so they stay sharp. **Save to the game** posts the keyed PNG to the local server (`tools/serve.mjs` `/api/art/save`), which writes `/incoming/<name>.png`, runs the ingest for that file and records the save (and any leftover pixels) in `art-overrides.json`; the previews then show the WebP the game will load. `Reprocess the original` re-runs the keyer on a file in `/incoming` or `/incoming/done`.
* The first four test images (Phase 2 gate): three came back as asked; the Shippuden Naruto came back on white and facing left, which the flood-fill keying and the flip flag handle without a regeneration. The prompts now spell out the facing (which ear is visible, where the nose points) and forbid white explicitly.
* Loading: per-arc packs (the arc's stage is code, so a pack is its portraits and sprites), fetched when the arc opens on the map and cached by the network-first worker as they pass. A missing file never throws: the loader resolves to null and the renderer draws the figure or the bust.
* **Two sizes.** Every save writes a standard file (portraits 256², sprites 512²) and an hd copy beside it in `hd/` (portraits 768², sprites 1024²), both from the same square, so the head marks are shared; the hd copy is only made when the picture has the detail for it (no upscaling). Settings > **Image quality**: Auto (default: high when the screen's short side is at least 700 CSS px, so PCs and big tablets; standard on phones and small tablets; decided each time an image is picked, falling back to the window size when the screen reports none), High or Standard. `js/render/Assets.js` picks the set, and falls back to the other size when an image exists in one only (everything saved before the two sizes, until it is re-saved). A device only loads its own set; the art studio always shows the hd copy.
* Budget (measured on the first saves, WebP quality 82): standard portraits ≈ 13 KB, sprites ≈ 28 KB, so a phone downloads ≈ 7 MB for all 168 + 168 over the whole game; hd portraits ≈ 50 KB, sprites ≈ 63 KB, ≈ 19 MB on a PC. Memory is the real reason for two sets: a busy battle holds ≈ 12 MB of decoded images at standard and ≈ 50 MB at hd. Icons and stages are code; fonts ≤ 120 KB; the first install (shell, code, fonts, the tutorial and Part I arc 1 pack) ≈ 0.6 MB.
