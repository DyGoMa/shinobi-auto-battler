# AUDIO_PLAN.md — music and sound for Shinobi Auto-Battler

*Phase 2 of the polish pass. Decided with the user in Phase 1 (every recommended pick). Phase 4 builds to this document. All audio is original and synthesised in code with Web Audio: no files, no samples, no copyrighted or ripped material, no voices. "In the spirit of the anime's score" means the instrumentation and the mood, never its melodies.*

## 1. Decisions locked in Phase 1

| Topic | Decision |
|---|---|
| Tracks | 12 loops and 6 stingers (§4); Daily and Hard reuse the battle loops with an extra percussion layer |
| Instrumentation | Part I: taiko, shakuhachi, shamisen and koto, with electric guitar and a drum kit on Part I boss themes; Shippuden: rock guitar, bass and drums with orchestral strings, brass and choir pads |
| Loops | 16 bars (about 30 s) built from a phrase pool, so no two passes are identical |
| Dynamics | Intensity layers added on a boss appearing, an enrage and low team HP; a drum-only layer for Hard and Daily |
| SFX | Medium density: every sim event type and the UI, mixed by priority and throttled, with a distinct impact and cast sound per nature |
| UI | Every button, toggle, tab, back and dialog gets a quiet tick with an era flavour (paper and wood in Part I, metal in Shippuden) |
| Ducking | Music drops about 9 dB under dialogue, the pause menu, Ultimate name cards and the clash slow-motion, recovering over 300 ms |
| Volumes | Master 80 %, music 60 %, SFX 80 % by default; three sliders plus mute in Settings; stored in the save (v4) |
| Voices | None; a short per-era text blip as dialogue advances |
| First tap | The splash becomes a "Tap to begin" gate so the intro plays with music |
| Engine | Hand-rolled: scheduler, synth voices, a generated-impulse reverb and delay, 0 KB of dependencies |
| CPU | Under 2 ms per audio callback on a phone; the scheduler plans a beat ahead, never per frame |

## 2. The engine (`js/audio/`)

```
AudioManager (unchanged public surface, plus buses and music)
  ctx ── master gain ──┬── music bus ── ducker ── reverb send/dry
                       ├── sfx bus   ── limiter
                       └── ui bus
  Scheduler   lookahead 120 ms, tick 25 ms (setTimeout), tempo per track, bar/beat callbacks
  Voices      pluck (Karplus–Strong: shamisen, koto, bass), flute (breathy noise + sine, vibrato: shakuhachi, fue),
              taiko (sine pitch-drop + noise burst), kit (kick, snare, hat, tom from noise and sines),
              guitar (detuned saws → waveshaper → band-pass: distorted lead and power chords),
              strings (four detuned saws → low-pass with slow attack), brass (two-operator FM),
              choir (saw → two formant band-passes), bell (FM with inharmonic ratio: stingers)
  Effects     reverb (convolver with a generated exponential-decay noise impulse, two sizes),
              delay (quarter-note feedback), a soft limiter (waveshaper) on the SFX bus
  Music       Track = { tempo, key, bars, layers[], phrasePool[] }; play(trackId, { layers }), crossfade(600 ms),
              setLayer(name, on), duck(on), stinger(id)
  Sfx         cue(name, params) with a priority table and per-cue throttles (kept from today)
```

* **Unlock:** the existing first-gesture unlock stays; the splash adds the "Tap to begin" gate so the first sound is the intro sting. A "play once unlocked" queue holds one pending music start.
* **Visibility:** a global `visibilitychange` handler suspends the music bus when hidden and resumes it (the battle's own pause stays).
* **Settings:** `settings.muted` (existing) mutes the master; `settings.music` and `settings.sfx` remain the on/off booleans; save v4 adds `musicVol`, `sfxVol` (0–1). The three disabled switches in Settings become two switches with sliders.
* **Reduced motion** does not touch audio; Low VFX does not either.

## 3. Instrument palettes

### 3.1 Part I (traditional, warm)

| Voice | Synthesis | Used for |
|---|---|---|
| Taiko | sine 90→40 Hz pitch drop over 120 ms + noise burst through a 400 Hz low-pass, room reverb | pulse of every Part I loop; hits on boss intros |
| Shakuhachi | breathy noise band-passed at the note, mixed with a sine one octave up, slow vibrato, portamento between notes | melody of the map and Academy themes, the sad stingers |
| Shamisen | Karplus–Strong pluck, short decay, slight pitch bend on the attack | rhythm of the title and map themes |
| Koto | Karplus–Strong pluck, longer decay, arpeggios | menu theme, victory |
| Fue (bamboo flute) | sine + triangle with a quick attack | bright lines in the Academy theme |
| Hand percussion | short noise ticks and a woodblock (sine 900 Hz, 30 ms) | UI ticks in the Part I skin, the map theme |
| Guitar and kit | as in §3.2, only on Part I boss themes | boss I, Boss Rush not applicable |

### 3.2 Shippuden (orchestral rock, cool)

| Voice | Synthesis | Used for |
|---|---|---|
| Distorted guitar | two saws detuned 6 cents → tanh waveshaper (drive 4) → band-pass 1.2 kHz → delay | riffs on battle II and boss II |
| Bass | Karplus–Strong with a long decay, low-pass 300 Hz | every Shippuden loop |
| Drum kit | kick (sine 120→45 Hz), snare (noise + 180 Hz tone), hats (high-passed noise, 20/60 ms) | battle II, boss II, Akatsuki rush |
| Strings | four saws detuned ±8 cents, low-pass sweep, 400 ms attack | pads under map II and the war arcs |
| Brass | FM (carrier:modulator 1:1, index 3→0.5 over the note) | boss II stabs |
| Choir | saw → formant band-passes at 700 and 1100 Hz, slow attack | Akatsuki rush, the Kage stinger |
| Taiko | as Part I | under the rock kit on boss II |
| Metal ticks | short high sine (2.4 kHz) with a noise click | UI ticks in the Shippuden skin |

## 4. The tracks

Every loop is 16 bars. Each track owns a phrase pool: 4–6 two-bar phrases per part (melody, bass, percussion), and the scheduler picks a phrase per slot with a seeded sequence so a loop pass is never the same twice but always resolves on the last bar. Layers are separate gain nodes the game can switch.

| # | Track | Tempo, key, mood | Palette | Layers | Plays on |
|---|---|---|---|---|---|
| 1 | Title | 84 bpm, D minor, expectant | shakuhachi, koto, taiko | base | start menu (and the intro's tail) |
| 2 | Village (hub) | 96 bpm, G major, easy | koto, hand percussion, fue | base | Home, Team, Roster, Wiki, Settings, Achievements (Part I skin) |
| 3 | Village II | 96 bpm, G major, warmer strings | strings, bass, koto | base | the same screens once Part II has started |
| 4 | Map I | 100 bpm, A minor, travelling | shamisen, taiko, shakuhachi | base + percussion | Story map, Part I |
| 5 | Map II | 100 bpm, A minor, harder | bass, kit, strings, shamisen | base + percussion | Story map, Part II; Hard adds the drum layer |
| 6 | Academy | 110 bpm, C major, playful | fue, koto, woodblock | base | the tutorial hub and lessons |
| 7 | Battle I calm | 128 bpm, E minor, driving | taiko, shamisen, fue | base + taiko + lead | Part I nodes without a boss |
| 8 | Battle I tense | 140 bpm, E minor | + guitar | base + kit + guitar | Part I boss nodes before the boss's first special; Daily on Part I bosses |
| 9 | Battle II calm | 132 bpm, B minor, driving | bass, kit, strings | base + kit + lead | Part II nodes without a boss |
| 10 | Battle II tense | 144 bpm, B minor | + guitar, brass | base + guitar + brass | Part II boss nodes; Daily on Part II bosses |
| 11 | Boss theme | 150 bpm, F# minor, relentless | full kit, guitar, taiko, brass (choir on Kage bosses) | base + brass + choir | the last 40 % of every boss's HP, and every Hard boss from the start |
| 12 | Akatsuki rush | 120 bpm, C minor, ominous | choir, taiko, bass, low strings | base + kit + choir | the Boss Rush (all rounds; the kit layer from round 3) |
| 13 | Summon | 76 bpm, E major, ceremonial | koto, bell, strings | base + shimmer | the Summon screen; the shimmer layer during the ceremony |

Stingers (no loop): **Intro** (a taiko roll into a shakuhachi call, 4 s), **Victory** (koto and bell, 3 s), **Defeat** (shakuhachi fall, 3 s), **Kage** (choir and bell swell, 2.5 s), **Arc clear** (fue fanfare, 3 s), **Boss intro** (a taiko hit and a brass stab, 1.5 s). Retreat plays a shorter, quieter defeat stinger.

## 5. The music state machine

| Moment | Owner (from the audit) | Change |
|---|---|---|
| "Tap to begin" | `Intro.js` | Intro stinger, then Title as the menu appears |
| Start menu, Wiki and Settings from the menu | `UIManager.go('start')` | Title (kept while the menu's sub-screens are up) |
| Enter the game | `UIManager.enterGame` | crossfade to Village (or Village II once Part II is reached) |
| Hub screens | `UIManager.go` keyed on the screen id | Village; Summon → Summon theme; tutorial → Academy; Boss Rush lobby → Akatsuki rush base layer; Daily lobby → Map of the boss's part |
| Story map | `go('story')` | Map I or Map II by the part shown; Hard turns the drum layer on |
| Battle start | `BattleScreen.open` and `_buildSim` (Retry and Next fight never pass `open`) | Battle calm or tense by boss presence and part; Academy for lessons; Akatsuki rush for the rush; the Daily takes its boss's part |
| Boss intro | the intro sequence | Boss intro stinger over the tense loop |
| Boss under 40 % HP, or enrage | polled in `_sounds` on `damage`/`enrage` | crossfade to Boss theme |
| Ally down to the last ninja | `death` of a player unit | the lead layer drops, the percussion stays |
| Pause, coach tip, help | `togglePause`, `_showTip` | duck |
| Clash slow-motion, Ultimate name card, dialogue | `clash`/`ult` handlers, the dialogue box | duck |
| Battle end | `_onEnd` | stop the loop, play Victory or Defeat, then Village under the results |
| Boss Rush round clear | `_intermission` | the loop keeps running; a short bell sting |
| Skip | `UIManager.skipBattle` | the stinger over the map loop |
| App hidden | global | suspend the music bus; resume on return |
| Settings → Music off | `SettingsScreen` | music bus to 0 with a 200 ms ramp |

Crossfades are 600 ms; a stinger ducks the loop under it.

## 6. Sound effects

Priority (high wins when the mixer is busy): dialogue blip < UI < hit < effective/crit < heal/status < telegraph < mechanic < KO < Ultimate < clash < boss intro < stinger. Throttles stay per cue (55–400 ms as today) and are widened at 5× speed.

### 6.1 Battle, per nature

| Nature | Cast (during a wind-up or an Ultimate charge) | Impact |
|---|---|---|
| Fire | a low roar building (noise through a rising low-pass, 0.6 s) | a whump and a crackle (noise burst, 80 ms, plus sparse ticks) |
| Wind | a rising whistle (band-passed noise sweeping up, 0.5 s) | a slicing swish (noise sweep down, 120 ms, stereo) |
| Lightning | crackling chirps (short saw bursts at random pitches, the "thousand birds" feel) | a snap and a thunder tail (click + low noise, 250 ms) |
| Earth | rumble (sine 40 Hz + noise low-passed at 120 Hz) | a rock thud with debris ticks (sine 70→35 Hz, 90 ms, plus clicks) |
| Water | a bubbling swell (filtered noise with an LFO) | a splash (noise burst high-passed then falling, 200 ms) |
| Neutral / taijutsu | a whoosh (noise sweep) | the current hit family (kept), a heavier thud on Ultimates |

### 6.2 Signature sounds (over the nature default)

Rasengan (a spinning whirl: two detuned sines with a fast tremolo, rising as it charges; a drill-and-boom on impact), Rasen Shuriken (the whirl plus a shrill saw as it flies; a wide dome boom), Chidori and Lightning Blade (the chirp cluster; a white-noise crack on impact), Water Dragon (a sustained rushing sweep along the flight; a big splash), Amaterasu (a low sizzle that lingers), Susanoo (a deep choir pad while the shield holds), Kamui (a rising sine spiral), Sand (granular ticks rising to a hiss), Eight Trigrams (rapid paired taps), Shadow Possession (a slow low sweep), Summoning (a poof: noise burst with a pitch drop), Tailed Beast Bomb (a sub-bass charge, then a boom), Almighty Push (a pressure whoomp with a long tail), Flying Raijin (a bright flash tone), Substitution (a comic pop with a woodblock), the Curse Mark (a strained rising drone).

### 6.3 Mechanics and states

Telegraph start (kept, plus the nature cast), boss special telegraph (a louder two-tone warning), reflect warning (a distinct shimmer, since the player should stop firing), shield up (a glassy swell) and shield break (a shatter), enrage (a roar: distorted saw + kit crash), revive (a bell rise), element swap (a whoosh into the new nature's cast sound), summon adds (poof), rally (a taiko hit), stun (three quick sparkles), heal (a soft rising chime), immune (a tink), KO (a fall thud; an enemy KO adds a puff; an ally KO a low bell; a boss KO a long crash; an escort KO a sharp alarm before the defeat stinger), the survive timer's last five seconds (a tick per second), battle start (a taiko hit under FIGHT!).

### 6.4 Interface

Tap (era tick), toggle on/off (two pitches), back (a lower tick), tab change (tick plus a paper or metal slide), dialog open (a short whoosh) and close, confirm and cancel, an error or locked action (a dull knock), toast (a soft ping; the achievement toast keeps its arpeggio), tip card (a paper flip), the reward count-up (ticks that speed up), claim (the existing arpeggio plus a coin cascade), level up (kept, plus a two-note rise; a longer rise for +5 and Max; a fanfare at the level cap), star up (a chime), node select (a pin tap), Fight! (a taiko hit), summon: banner switch (paper), the pull press (a drum hit), the scroll and circle (a rising koto arpeggio), the smoke (a poof), each card flip (the tier-pitched chord, kept), the Kage reveal (the Kage stinger), Continue (a tick); dialogue: a text blip per two characters in the era's voice, a page turn on advance, a whoosh on skip; the intro's slam (a taiko hit and a flash tone); install prompts and sign-in use the UI family.

## 7. Mixing and settings

* Defaults: master 0.8, music 0.6, SFX 0.8. The existing mute button mutes the master.
* Ducking: the music bus drops 9 dB over 80 ms and recovers over 300 ms; stingers duck the loop by 6 dB.
* A soft limiter on the SFX bus (tanh at 0.9) so 30 hits in a frame never clip (the throttles stay).
* Settings → Audio: Music switch + slider, Sound effects switch + slider, and the existing Sound (mute) switch; sliders are 44 px tall; values persist in the save and sync.
* Save v4 migration: `musicVol` and `sfxVol` default to 0.6 and 0.8; the booleans keep their meaning.

## 8. Tests (Phase 6)

Core tests with a fake AudioContext: the unlock gate creates one context and one pending music start; the buses apply `music`/`sfx`/volumes and mute; the scheduler never schedules a note in the past; a track's phrase sequence is deterministic for a seed and always ends on the final bar; the state machine picks the right track for every screen and battle kind, ducks and recovers, and never stacks the achievement jingle on a stinger (the audit's quirk); the visibility handler suspends and resumes.
