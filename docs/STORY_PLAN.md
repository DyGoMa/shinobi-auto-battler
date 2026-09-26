# STORY_PLAN.md — dialogue and narration for Shinobi Auto-Battler

*Phase 2 of the polish pass. Decided with the user in Phase 1 (every recommended pick). Phase 5 writes to this plan. Names follow the English dub (NAMING.md); events follow the anime, with the manga for gaps; every new name goes into `tools/naming-sources.mjs` and is checked against Narutopedia as the existing names were.*

## 1. Decisions locked in Phase 1

| Topic | Decision |
|---|---|
| Voice | Both: a one-line narrator caption for time and place at arc openers and transitions; characters for everything else |
| Tone | Faithful to the anime: earnest and dramatic with the show's own humour; Part I lighter, Shippuden heavier; no fourth-wall jokes outside the tutorial |
| Length | Node intro 3 lines, node outro 2, arc opener 4–5, arc closer 4, boss pre-fight 3–4, system explanations up to 5; every line under 90 characters |
| Coverage | Every node gets an intro; outros on all 37 boss battles, every arc-final node and a handful of key moments; every arc gets an opener and a closer |
| Teachers | Iruka (team, roles, Leader), Kakashi (chakra, Ultimates, the Nature Wheel, Jutsu Clash with Naruto demonstrating, Hard mode), Shikamaru (Auto-ult, presets, Auto team, Skip), Jiraiya (summoning, banners, pity, tickets, the Boss Rush), Tsunade (Ryo, levelling, Smart spend), Might Guy (the Daily challenge), Konohamaru (achievements) |
| Filler | Framed as side missions: a "Side mission" tag on the arc card and in the opener caption, lighter tone, the main plot resumes in the next opener |
| Spoilers | Characters only know what they know at that episode; enemy names already follow that rule |
| Skip and auto | Tap advances, Skip skips the scene, Auto advances every 2.5 s; scenes play once per save and are skipped on replays and ⏭ Skip; Settings "Story scenes: first time / always / never"; a Wiki story log |
| Box | Anime style: portrait left (enemies right), name plate, typewriter text, over the dimmed stage; the same box on the map and in battle |
| Placement | Node intros over the battle stage before the fight; outros over the results background; arc openers when the arc is first opened on the map; boss pre-fights as the boss intro's last beat |
| Tutorial | The three lessons stay; their teaching moves into Iruka's and Kakashi's mouths; character-taught first-visit scenes replace the UI tip cards on Summon, Roster, Team and the Story map |
| Catchphrases | Original lines only, but the iconic catchphrases stay ("Believe it!", "Dynamic Entry!", Guy's youth, Shikamaru's "what a drag") |

## 2. Writing rules

1. **Short and spoken.** One thought per line, under 90 characters, no stage directions in the text; the portrait and the name plate carry who and how.
2. **Everyone sounds like themselves.** Naruto: loud, simple, "believe it" sparingly (once per arc at most). Sasuke: clipped, no exclamation marks. Sakura: sharp, warm underneath, "Cha!" only in her head. Kakashi: dry, late, kind when it counts. Guy: capital letters in spirit. Shikamaru: "what a drag", then the plan. Jiraiya: theatrical, then wise. Tsunade: blunt. Gaara (Part I): flat menace; (Part II): quiet. Orochimaru: silky. Zabuza: contempt. Itachi: still. Pain: sermons. Killer Bee: rhymes, badly, on purpose.
3. **The game explains itself in fiction, in five lines or fewer, once.** A teacher says what the system is and what to do; the UI's tip card copy is retired where a scene replaces it (the Wiki keeps the reference).
4. **Never restate the blurb.** The blurb is what the node is; the scene is what someone says about it.
5. **Villains get the last word before a boss fight**, and the winner gets the outro.
6. **No fourth wall** outside the Academy, where "this screen" and "tap the glowing portrait" are allowed because the teacher is also the game.
7. **Spoiler discipline:** Tobi is "Tobi" until the Confrontation arc; Pain is "Pain" until Nagato is met; Itachi's motives stay unspoken until Fated Battle; Obito's identity is never said before Climax; Kaguya is not named before her arc; nothing about the ending anywhere.
8. **Dub names and dub jutsu names only**; "Nine-Tails", "Hidden Leaf", "Fire Style", "jinchuriki" (the dub's own term). New names are added to `tools/naming-sources.mjs` with the page checked.

## 3. Data format (Phase 5)

One file per arc under `js/content/story/`, keyed by id, validated by `npm run validate` (every node has an intro; every boss node has a boss line and an outro; every speaker id exists in the roster or enemy list or the `NARRATOR`; every line is under 90 characters; every referenced portrait resolves to a roster or enemy id).

```js
export const ARC_WAVES_STORY = {
  opener: [ { caption: 'The Land of Waves. Three days from the Hidden Leaf.' }, { who: 'kakashi', text: '…' }, … ],
  closer: [ … ],
  nodes: {
    n_waves_1: { intro: [ { who: 'tazuna', side: 'right', text: '…' }, … ] },
    n_waves_5: { intro: [ … ], boss: [ { who: 'e_zabuza_boss', text: '…' } ], outro: [ … ] },
  },
  teach: { summonFirst: [ … ] },   // the first-visit scenes an arc unlocks
};
```

A line is `{ who, text, side?, mood? }`; `who` is a roster id, an enemy id or `narrator`; `side` defaults to left for the player's side and right for enemies; `mood` picks an expression once portraits have variants (out of scope for the first pass). Scenes carry a `music` hint (`duck`, `stinger:boss`, `theme:sad`) read by the audio state machine. Seen scenes are stored in the save (`story.seen`, v4) so they follow the cloud save.

## 4. Who teaches what, and where it fires

| System | Teacher | Where | Lines |
|---|---|---|---|
| Team building, roles, the Leader slot | Iruka | Lesson 1 (the Team Builder coach box becomes Iruka) | 5 |
| Chakra and Ultimates | Kakashi | Lesson 3 start | 3 |
| The Nature Wheel | Kakashi | Lesson 2 start, the quiz reframed as his question | 5 |
| Jutsu Clash and the badges | Kakashi, Naruto demonstrating | Lesson 3, the wind-up | 4 |
| Auto-ult | Shikamaru | Lesson 3, after the first clash ("let the lazy way do it") | 3 |
| Summoning, banners, pity, tickets | Jiraiya | first visit to Summon, after the tutorial | 5 |
| Ryo, levelling, catch-up, Smart spend | Tsunade | first visit to the Roster after the first summon | 5 |
| The Story map, recommended power, replay rewards, ⏭ Skip | Shikamaru | first visit to the Story map; Skip explained the first time a cleared node is selected | 4 + 2 |
| Presets, counter hints, Auto team | Shikamaru | first visit to the Team Builder outside the tutorial | 4 |
| Arc banners and "villains join" | Jiraiya | the first time an arc banner opens (Land of Waves) | 3 |
| Boss Rush | Jiraiya | the Boss Rush unlocking (Sasuke Retrieval Squad closer) and the lobby's first visit | 4 |
| Hard mode | Kakashi | Part I's closer, when Hard opens | 3 |
| The Daily challenge | Might Guy | the Daily unlocking (Land of Waves closer) and the lobby's first visit | 4 |
| Achievements | Konohamaru | the first achievement toast tapped, or the screen's first visit | 3 |
| Stars, duplicates, alternate forms | Tsunade | the first duplicate summon's Continue | 3 |
| Cloud save and install | (stays UI copy) | — | — |

## 5. Arc-by-arc outline

Format: **Opener** (the caption and the beat) · node intros as one line each (what the scene establishes; `+outro` where one exists) · **Closer** · teaching moments. Filler arcs are marked *side mission*.

### The Academy (tutorial)
**Opener:** caption "The Hidden Leaf Village. Graduation night." Iruka finds Naruto with the Scroll of Sealing; Mizuki's trick is out in the open. · T1 Iruka: a squad is three ninja and a leader; roles and where each fights (teaches). · T2 Kakashi drops in ("consider this an early look at your new sensei"): natures, the wheel, the quiz (teaches). · T3 Kakashi: chakra fills, a glowing portrait is an Ultimate; Mizuki winds up; "meet it head-on" (teaches); Shikamaru, passing by, explains Auto-ult. +outro: Iruka gives Naruto his headband. **Closer:** Iruka: "The Survival Test is tomorrow. Get some sleep. You won't." Jiraiya's summoning scene fires on the first Summon visit.

### Part I · 1 · Prologue: Survival Test
**Opener:** caption "Training Ground 3. The morning of the Survival Test." Kakashi lays out the bells (the mockup's dialogue scene). · 1 Sakura and Sasuke plan to hide; Naruto charges. · 2 One Thousand Years of Death: the log, the finger jab, Naruto in the river (comedy; sample §6). · 3 The Final Bell: Sakura's fright, Sasuke buried to the neck, Naruto tied to the post; boss line from Kakashi. +outro: Kakashi: "Those who break the rules are scum. Those who abandon their friends are worse." They pass. **Closer:** Team 7 is a team; caption: "Mission after mission. D-rank, every one."

### 2 · Land of Waves
**Opener:** caption "The Land of Waves. A C-rank escort that isn't." Tazuna's drunken hiring, Kakashi's suspicion. · 1 the Demon Brothers strike; Kakashi's "death". · 2 Zabuza's mist and the Water Prison; Naruto's shadow-clone rescue plan. · 3 Inari's house, Tsunami and the thugs; Naruto: "I'll protect them." · 4 the ice mirrors; Haku's question about precious people; Sasuke stands between. · 5 boss line from Zabuza (the mockup's boss intro); +outro: Zabuza's tears for Haku, the bridge named. **Closer:** the Great Naruto Bridge; two graves in the snow. Teaching: Guy's Daily challenge scene on the closer (the Daily unlocks here); Jiraiya's first arc banner line.

### 3 · Chunin Exams
**Opener:** caption "The Chunin Exams." Kakashi's nomination; the rookies size each other up. · 1 the Grass Ninja's tongue and killing intent; "run, and survive" (dread; sample §6). · 2 Sakura cuts her hair; Lee's Leaf Hurricane; Ino-Shika-Cho arrive. · 3 Oboro's fakes; Naruto's clones find the real ones. · 4 Yoroi's chakra drain, Misumi's rubber body; Kabuto watching. · 5 Neji's fate speech vs Naruto's promise; +outro: "when I'm Hokage, I'll change the Hyuga." **Closer:** the finals are interrupted; feathers fall.

### 4 · Destruction of the Hidden Leaf Village
**Opener:** caption "Zero hour." Sand and Sound pour over the walls; the genjutsu sleep. · 1 Shikamaru complains, then fights. · 2 Shino's insects vs Kankuro's puppet. · 3 flashback frame: the Third faces his student; boss line from Orochimaru; +outro: the Reaper Death Seal, "I still believe in the next generation." · 4 Gaara's sand, "I fight for myself"; Naruto's "I know your loneliness"; +outro: "I'm sorry," Gaara says to his siblings. **Closer:** the Third's funeral in the rain.

### 5 · Search for Tsunade
**Opener:** caption "Two men in black cloaks at the gate." Itachi and Kisame; Jiraiya takes Naruto on the road. · 1 Asuma and Kurenai buy time; Guy's Dynamic Entry. · 2 Tsunade's bet: one week for the Rasengan, one finger. · 3 Kabuto's scalpel and Shizune's needles. · 4 boss line from Orochimaru (Manda); +outro: Tsunade's necklace, "Naruto, you'll be Hokage." **Closer:** the Fifth Hokage takes the hat.

### 6 · Land of Tea Escort Mission *(side mission)*
**Opener:** caption "Side mission. The Land of Tea, race day." Idate's rudeness, Kakashi absent. · 1 Team Oboro at sea; Mubi tunnels. · 2 Aoi's umbrella. · 3 boss line from Aoi with the Raijin sword; +outro: Idate crosses the line; Sasuke's frustration. **Closer:** "Next time, Naruto…" The main plot resumes: Sasuke's night.

### 7 · Sasuke Retrieval Squad
**Opener:** caption "The Sound Ninja Four came for Sasuke. He went." Shikamaru's first mission as a chunin; the squad forms. · 1 Choji stays behind; "eat the pill." · 2 Neji finds Kidomaru's blind spot. · 3 Kiba, Sakon and Ukon; the Sand arrives; Temari's fan. · 4 Lee's lotus, Gaara's sand, Kimimaro's bones and his loyalty. · 5 the Final Valley: boss line from Sasuke; the exchange (sample §6); +outro: the scratched headband, Naruto's promise to Sakura. **Closer:** Jiraiya at the gate: "Two and a half years." Teaching: Jiraiya's Boss Rush scene (it unlocks here); Kakashi's Hard mode line when Part I closes.

### 8 · Kurosuki Family Removal Mission *(side mission)*
**Opener:** caption "Side mission. The Katabami Gold Mine." Team Guy and Naruto; the funerals. · 1 Rokusuke's living funeral. · 2 Ranmaru's eyes, Raiga's thunder. · 3 boss line from Raiga in the storm; +outro: the curry of life. **Closer:** "Youth!" and the road home.

### Part II · 9 · Kazekage Rescue Mission
**Opener:** caption "Two and a half years later." Naruto at the gate, taller; Gaara taken by Deidara. · 1 the bells again; Kakashi's new respect. · 2 Gaara over the Sand, the clay bird, C3. · 3 the barrier tags; Team Guy vs themselves; Guy: "no holding back on ourselves!" · 4 Sakura and Chiyo against Sasori: boss line from Sasori (Hiruko), +outro: Chiyo's grandson. · 5 Naruto and Kakashi over the forest: boss line from Deidara; +outro: Chiyo's last jutsu, Gaara wakes. **Closer:** the Sand bows to its Kazekage; Naruto: "I'll come back a jonin, or a Hokage." Teaching: Tsunade's levelling scene at the Roster if not yet seen.

### 10 · Tenchi Bridge Reconnaissance Mission
**Opener:** caption "A new Team Kakashi." Yamato, Sai, and a smile that isn't. · 1 the mock meeting, Naruto vs Sai's mouth. · 2 the bridge: Kabuto, then Orochimaru. · 3 the Nine-Tails' chakra loose; Yamato's wood; Sakura hurt. · 4 the hideout: boss line from Sasuke ("I have no reason to kill you yet"); +outro: Sasuke walks away with Orochimaru; "we'll bring him back together." **Closer:** Sai's real smile.

### 11 · Twelve Guardian Ninja *(side mission)*
**Opener:** caption "Side mission. The Fire Temple." Sora the monk; Asuma's old life. · 1 Fuka's kiss, Fudo's rock. · 2 Sora's chakra breaks loose; hold on. · 3 boss line from Kazuma, Asuma's old comrade; +outro: Sora leaves to find himself. **Closer:** Asuma: "Chiriku and I… another time."

### 12 · Akatsuki Suppression Mission
**Opener:** caption "Two Akatsuki, one bounty station." Hidan's ritual; Kakuzu's hearts. · 1 Asuma's squad: survive the ritual (intro carries the dread; the anime's loss happens between nodes: outro states it plainly). · 2 Kakashi joins Team 10; Kakuzu's masks. · 3 Shikamaru alone in the Nara forest: boss line from Hidan; +outro: "this is my king's move"; the lighter. · 4 Naruto's new jutsu: boss line from Kakuzu; +outro: Rasen Shuriken lands; Kakashi carries him. **Closer:** Asuma's grave; Kurenai; Shikamaru's cigarette.

### 13 · Three-Tails' Appearance *(side mission)*
**Opener:** caption "Side mission. A lake in the mist." Guren's crystals; Yukimaru. · 1 Kigiri's smoke, Nurari's water; Team Kurenai's eyes. · 2 boss line from Guren; the mirror. · 3 boss line from the beast (a roar; Yukimaru's plea as the caption); +outro: the beast sinks. **Closer:** Guren and Yukimaru walk away together.

### 14 · Itachi Pursuit Mission
**Opener:** caption "Sasuke has no master now." Suigetsu, Karin, Jugo. · 1 Jugo's other side. · 2 Deidara and Tobi block the way: Tobi's clowning. · 3 boss line from Deidara ("art is an explosion"); +outro: C0, the sky white. **Closer:** Taka rides on; "Itachi."

### 15 · Tale of Jiraiya the Gallant
**Opener:** caption "The Village Hidden in the Rain. It never stops." Jiraiya slips in. · 1 the gate guards; the toad in his pocket. · 2 Konan: "sensei." · 3 Sage Mode; the animals. · 4 boss line from Pain ("you taught us, and this is what we learned"); +outro: the coded message on Fukasaku's back. **Closer:** Naruto on the bench, the popsicle, the book.

### 16 · Fated Battle Between Brothers
**Opener:** caption "The Uchiha hideout." Kisame lets only Sasuke through. · 1 Taka vs Samehada: hold. · 2 boss line from Itachi; the exchange stays about hatred and eyes, nothing more; +outro: Itachi's forehead poke; "the truth" as a caption only. · 3 Killer Bee raps and blocks. · 4 boss line from the Eight-Tails' host; +outro: the tentacle trick, Taka retreats. **Closer:** Sasuke: "I'm going to crush the Leaf." Tobi watches.

### 17 · Six-Tails Unleashed *(side mission)*
**Opener:** caption "Side mission. The Tsuchigumo village." Hotaru and the wandering Utakata. · 1 the trackers take Hotaru. · 2 the bandits; hold. · 3 boss line from Shiranami; +outro: Utakata's bubbles. **Closer:** Hotaru waves; Naruto: "master and student, huh."

### 18 · Pain's Assault
**Opener:** caption "The day Pain came to the Hidden Leaf." Six figures on the wall. · 1 the animals in the streets; keep the villager alive. · 2 Kakashi vs two Pains; +outro: Kakashi's last thought of his father (kept gentle). · 3 Konohamaru: "I'm a Sarutobi." · 4 Naruto lands in the crater in Sage Mode: "it's my turn." · 5 boss line from Pain (the sermon); +outro: Hinata's stand, Nagato's choice, "everyone is back." **Closer:** the village on its feet, Naruto lifted up; Kakashi in the crowd. Teaching: none.

### 19 · Five Kage Summit
**Opener:** caption "The Land of Iron. Five Kage, one table." Danzo wears the hat. · 1 fight as the Raikage: Sasuke crosses the samurai. · 2 Kisame and Samehada vs Bee. · 3 fight as Sasuke: boss line from Danzo (Izanagi); +outro: Karin. · 4 the bridge: Kakashi between Sakura and Sasuke; boss line from Sasuke; +outro: Naruto's arrival, "next time." **Closer:** Tobi declares war; the Kage answer.

### 20 · Fourth Great Ninja War: Countdown
**Opener:** caption "An island that moves. A war that hasn't." Bee and the turtle. · 1 the squid and Motoi. · 2 the Nine-Tails inside: boss line from the fox; +outro: a woman's red hair (the mother, unnamed until she speaks). · 3 Guy vs Kisame: "Dynamic Entry!" · 4 Konan vs Tobi over the Rain: boss line from Tobi; +outro: paper on the water. **Closer:** the alliance marches; caption "Day one."

### 21 · Fourth Great Ninja War: Confrontation
**Opener:** caption "The war. The dead walk." Kakashi's division. · 1 Zabuza and Haku again; "you've grown, kid." · 2 Darui and the brothers' tools. · 3 Team 10 vs their sensei: Asuma's "one more time." · 4 Naruto, Bee, Itachi against Nagato: boss line from Nagato; +outro: Itachi's farewell. · 5 Gaara and Onoki vs Mu: boss line from Mu; +outro: the Tsuchikage flies. **Closer:** caption "Night falls on the first day."

### 22 · Fourth Great Ninja War: Climax
**Opener:** caption "The real Madara." The Kage assemble. · 1 the meteorite: hold. · 2 inside the Four-Tails: "Son Goku." · 3 Itachi and Sasuke vs Kabuto: boss line from Kabuto; +outro: Izanami; Itachi's last words to Sasuke. · 4 Team 7 together: Naruto, Sasuke, Sakura, side by side. · 5 Kamui: boss line from Obito; +outro: the old teammates. **Closer:** the Ten-Tails looms; caption "One night left."

### 23 · Kakashi: Shadow of the ANBU Black Ops *(anime-only flashback)*
**Opener:** caption "Years before Team 7. The Anbu." A mask, a mission. · 1 disguised as the Third; hold. · 2 Gotta's smoke. · 3 boss line from Kinoe; +outro: "your Sharingan isn't yours to take." **Closer:** the Third: "come back to the light, Kakashi."

### 24 · Birth of the Ten-Tails' Jinchuriki
**Opener:** caption "The Ten-Tails has a host." Obito's power. · 1 fight as the Hokage: hold the barrier. · 2 Naruto and Sasuke break the balls: boss line from Obito; +outro: the chakra pulled back. · 3 Guy's seventh gate: "not enough." · 4 the Eighth Gate: boss line from Madara; +outro: "of all the shinobi I have fought, none pushed me further." **Closer:** Guy carried; Naruto's hand.

### 25 · Kaguya Otsutsuki Strikes
**Opener:** caption "Black Zetsu's mother." The dimensions. · 1 hold in the lava. · 2 boss line from Kaguya; +outro: the seal. · 3 the Final Valley: "what do you mean to do, Sasuke?" · 4 the last fight: boss line from Sasuke, Naruto's answer (drama, spare); +outro: two arms, one reconciliation, the ending. **Closer:** caption "The end of the story. Every battle stays open." Kakashi: "There's still Hard mode."

### The Akatsuki Boss Rush
Jiraiya's briefing: seven Akatsuki, no healing, how far can you go; a one-line bark from each boss as their round starts (Kisame, Deidara, Sasori, Hidan, Kakuzu, Itachi, Pain).

## 6. Sample dialogue

### A · One Thousand Years of Death (comedy; Part I, arc 1, node 2)

Intro, over the training ground:

| Speaker | Line |
|---|---|
| Naruto | Here I come, Kakashi-sensei! One bell for me, one for me too! |
| Kakashi | Lesson one of ninja combat: taijutsu. *(He turns a page.)* Go ahead. |
| Naruto | Are you READING? In the middle of a fight?! |

Outro, over the results:

| Speaker | Line |
|---|---|
| Kakashi | Don't let an enemy get behind you. Hidden Leaf Secret Finger Jutsu… |
| Naruto | (from the river) …THAT WASN'T A JUTSU. |

### B · Forest of Death: The Grass Ninja (dread; Part I, arc 3, node 1)

Intro:

| Speaker | Line |
|---|---|
| Narrator | *The Forest of Death. Day two.* |
| Orochimaru | You three are so much more entertaining than I hoped. |
| Sasuke | Sakura. Take Naruto and run. Don't look back. |
| Sakura | Sasuke, your hands are shaking… |

Boss line (the wind-up): "Let me see how far the Uchiha blood has come."

Outro:

| Speaker | Line |
|---|---|
| Orochimaru | A gift, Sasuke. You'll come to me for more. |
| Naruto | Sasuke? Sasuke, say something! |

### C · Final Valley (drama; Part I, arc 7, node 5)

Boss pre-fight, over the boss intro:

| Speaker | Line |
|---|---|
| Sasuke | Why do you keep chasing me, Naruto? |
| Naruto | Because you're my friend. That's the only reason I've ever needed. |
| Sasuke | Then I'll cut that bond here. |
| Naruto | Then I'll break every bone in your body to drag you home! |

Outro (the player won: Sasuke is down but leaves; the anime's outcome is kept in the caption):

| Speaker | Line |
|---|---|
| Narrator | *Rain on the valley. Two headbands. One scratched.* |
| Kakashi | You did everything you could. |
| Naruto | I made Sakura a promise. I'm not done, believe it. |

### D · Jiraiya on summoning (teaching; the first visit to Summon)

| Speaker | Line |
|---|---|
| Jiraiya | Scrolls, kid. Every ninja worth the name is hiding on one. |
| Jiraiya | A hundred scrolls calls one. Nine hundred calls ten, and one of those is jonin or better. |
| Jiraiya | Keep calling and a Kage answers by the fiftieth. The count never resets, whatever banner you use. |
| Jiraiya | The banner at the top follows the story. The people on it show up more often. Villains only after you've beaten them. |
| Naruto | So… I just need scrolls. Lots of scrolls. |

## 7. Size and verification

About 900 lines: 99 intros (≈300), 45 outros (≈90), 37 boss lines (≈120), 26 openers and closers (≈230), 15 teaching scenes (≈60), 7 Boss Rush barks, and the tutorial's rewritten coach lines (≈40). Every scene is data; `npm run validate` checks the structure (§3); a core test loads every arc's story and asserts every node has an intro, every boss node a boss line and an outro, and no line over 90 characters. Names and events are checked against Narutopedia through its API as NAMING.md describes, and each new name is recorded in `tools/naming-sources.mjs`.
