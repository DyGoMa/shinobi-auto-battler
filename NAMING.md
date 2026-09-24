# NAMING.md — every name in the game, where it was checked

**Rules used everywhere**

1. **English dub names win.** When the anime dub and the Viz manga differ, the dub is used ("Fire Style", not "Fire Release"; "Hidden Leaf Village", not "Konohagakure"; "Lightning Blade", not "Raikiri").
2. **Source priority:** the anime (events, matchups, arc order), then the manga and official databooks (natures and other details the anime doesn't show).
3. **How names were checked:** Narutopedia (naruto.fandom.com). Normal page fetches were blocked (HTTP 402), so pages were read through Narutopedia's own MediaWiki API (`naruto.fandom.com/api.php`), which serves the same article source. For techniques, the **"English TV" infobox field** is the dub name. When an article has no English TV field, the dub keeps the article's name (Narutopedia notes this, e.g. on "Chidori").
4. **Character spellings** are Narutopedia article titles with macrons removed (Chōji → Choji, Kankurō → Kankuro). Narutopedia has no separate dub-spelling field for people, so this is a convention, not a per-name check.
5. **Status:** **Verified** = confirmed in the dub/English TV field or the article. **Partly verified** = confirmed in part, or inferred. **Descriptive** = an in-game label that is not presented as a canon name (e.g. "Sand Ninja"). **NOT VERIFIED** = not confirmed, and flagged instead of guessed.
6. `node tools/naming.mjs` lists any name in the content files that has no recorded source. `npm run validate` prints a warning for the same thing. **Session 2/3:** add every new name to `tools/naming-sources.mjs`, then run `node tools/naming.mjs --write`.

## Changes from the design brief (dub rule)

| Brief said | Game uses | Why |
|---|---|---|
| Konoha Crush | **Destruction of the Hidden Leaf Village** | "Konoha Crush" is the Narutopedia/Viz name. The dub title of ep 68 is "Zero Hour! The Destruction of the Hidden Leaf Village Begins!" |
| Sasuke Recovery Mission | **Sasuke Retrieval Squad** | The dub title of ep 110 is "Formation! The Sasuke Retrieval Squad". Internal id `arc_sasuke_recovery` is unchanged. |
| Valley of the End | **Final Valley** | Narutopedia's English TV name. |
| Demonic Ice Mirrors | **Secret Jutsu: Crystal Ice Mirrors** | English TV field. |
| Morning Peacock (Might Guy) | **Dynamic Entry** | Asakujaku is a Part II technique. Guy's Part 1 finisher on screen is Dynamic Entry (ep 85). |
| Palm Rotation / "Heavenly Spin" | **Eight Trigrams: Palm Rotation** | English TV field. |
| Mystical Palm / Creation Rebirth / Poison Mist | **Healing Jutsu / Ninja Art: Mitotic Regeneration / Ninja Art: Poison Fog** | English TV fields. |
| Prologue: Bell Test | **Prologue: Survival Test** (Session 2) | Dub titles of eps 4–5: "Pass or Fail: Survival Test". "Bell Test" is the Narutopedia article name, kept as the alternate. Internal ids unchanged. |
| Sound Four | **Sound Ninja Four** (Session 2) | English TV name on the Sound Four article. |
| Sand Siblings | **(removed)** (Session 2) | Not a confirmable dub name (Narutopedia: "Three Sand Siblings", no English TV field, not in any dub title). Blurbs name Gaara, Temari and Kankuro; the leader-scope label is "Hidden Sand ninja". |

## Natures (how each character's natures were chosen)

Rule: a Part 1 character uses **the natures they used on screen in Part 1**. If they used none, they get **the first nature Narutopedia lists** (only one, so the wheel stays meaningful). Kekkei genkai count as their component natures (Ice = Wind + Water, Wood = Earth + Water, Explosion = Earth + Lightning). **Taijutsu specialists** (Rock Lee, Might Guy) are neutral by design. Natures learned later in the story (for example Naruto's Six Paths natures) are saved for Session 2 alternate forms.

| Character | Narutopedia natures (infobox) | Used in game | Basis |
|---|---|---|---|
| Naruto Uzumaki | Wind, Earth, Fire, Water, Lightning (+KG, all later) | Wind | none used in Part 1 → first listed |
| Sakura Haruno | Earth, Water, Fire (later) | Earth | first listed |
| Sasuke Uchiha | Lightning, Fire (Part 1); Earth, Water, Wind later | Fire, Lightning | used in Part 1 |
| Kakashi Hatake | Lightning, Earth, Water (Part 1); Fire (anime-only, **not verified** for Part 1); Wind later | Lightning, Earth, Water | used in Part 1 |
| Hinata Hyuga | Fire, Lightning (later) | Fire | first listed |
| Kiba Inuzuka | Earth (later) | Earth | first listed |
| Shino Aburame | Earth, Fire (later) | Earth | first listed |
| Kurenai Yuhi | none (Yin only) | none | — |
| Shikamaru Nara | Fire, Earth (later) | Fire | first listed |
| Ino Yamanaka | Earth, Water, Fire (later) | Earth | first listed |
| Choji Akimichi | Earth, Fire (later) | Earth | first listed |
| Asuma Sarutobi | Wind, Fire (Part II) | Wind | first listed |
| Rock Lee | none | neutral (taijutsu) | taijutsu specialist |
| Neji Hyuga | Fire, Earth, Water (later) | Fire | first listed |
| Tenten | none | none | — |
| Might Guy | Fire, Lightning (later) | neutral (taijutsu) | taijutsu specialist |
| Gaara | Wind (Part 1); Earth, Lightning later; Magnet | Wind | used in Part 1 |
| Temari | Wind | Wind | used in Part 1 |
| Kankuro | Wind, Lightning, Earth, Water (later) | Wind | first listed |
| Iruka Umino | Fire, Water (later) | Fire | first listed |
| Shizune | none | none | — |
| Jiraiya | Fire, Earth (Part 1); Wind, Water later | Fire, Earth | used in Part 1 |
| Tsunade | Lightning, Earth, Water, Fire (later) | Lightning | first listed |
| Orochimaru | Wind, Earth (Part 1); more later | Wind, Earth | used in Part 1 |
| Hiruzen Sarutobi | Fire, Earth (Part 1); more later | Fire, Earth | used in Part 1 |
| Zabuza Momochi | Water | Water | used in Part 1 |
| Haku | Ice (Wind + Water) | Water, Wind | kekkei genkai components |
| Kabuto Yakushi | Earth, Water, Wind, Fire (mostly later) | Earth | first listed |
| Kimimaro, Kidomaru, Tayuya, Sakon and Ukon | none | none | — |
| Jirobo | Earth | Earth | used in Part 1 |
| Enemies | Gozu/Meizu Water · Team Oboro Earth, Water · Yoroi, Misumi, Tobirama, Aoi Water · Hashirama Wood (Earth + Water) · Kisame Water · Itachi Fire, Water, Wind · Raiga Lightning, Water · Deidara Explosion (Earth + Lightning) · Kakuzu and Pain all five · Sasori, Hidan, Dosu, Zaku, Kin none | as listed | Narutopedia infoboxes |
| Generic "Sand Ninja" | — | Wind | **Design choice, not canon** (generic unit) |

## Part II (Session 2)

**How Part II names were checked.** Same Narutopedia API method. Narutopedia's *episode* articles use the official English titles, which are not always the dub's, so **English dub episode titles come from Wikipedia's "Naruto: Shippuden season N" episode tables** (the "Title" column), with the Narutopedia article recorded as the source page. Every Part II node name is a dub episode title except one descriptive node ("Gaara and Onoki vs. Mu").

**Dub differences that decided a name:**

| Narutopedia / official English | Game uses (dub) | Source |
|---|---|---|
| Killer B | **Killer Bee** | Dub episode titles 244, 429–430 |
| A (Fourth Raikage) | **Ay** | English TV name in the article lead |
| Chidori Current | **Chidori Stream** | English TV field |
| Wind Release: Rasenshuriken | **Wind Style: Rasen Shuriken** | English TV field; dub title of ep 88 |
| Chibaku Tensei | **Planetary Devastation** | English TV field; dub title of ep 167 |
| Tailed Beast Ball | **Tailed Beast Bomb** | English TV field |
| Deva / Asura / Human / Animal / Preta / Naraka Path | **Tendo / Shurado / Ningendo / Chikushodo / Gakido / Jigokudo** | English TV fields (the dub keeps the Japanese path names) |
| Dust Release | **Particle Style** | English TV field ("Particle Style: Atomic Dismantling Jutsu") |
| Storm Release / Blaze Release | **Gale Style / Inferno Style** | English TV fields |
| Root | **Foundation** | English TV field |
| Hunter-nin | **tracker ninja** | English TV field |
| Impure World Reincarnation | **Reanimation** ("… (Reanimated)") | English TV "Summoning Jutsu: Reanimation" (as in Part I) |
| Fourth Shinobi World War | **Fourth Great Ninja War** | English TV name (arc names keep the rest of the Narutopedia arc title) |
| Kakashi's Anbu Arc: The Shinobi That Lives in the Darkness | **Kakashi: Shadow of the ANBU Black Ops** | English season sub-title (Wikipedia, season 16) |

**Natures (Part II).** Same rule: natures used on screen in Part II; if none, the nature Narutopedia's infobox marks as the character's **affinity** (else the first listed; the `Infobox:` data pages give the article's own order); kekkei genkai → component natures; taijutsu specialists neutral.

| Character | Used in game | Basis |
|---|---|---|
| Sai, Karin, Konan | Earth · Earth · Wind | none used on screen → first listed |
| Konohamaru, Minato | Fire | none used on screen (Rasengan, Flying Raijin) → first listed. **Session 3 review: kept** (see below) |
| Jugo | Wind | first listed |
| Suigetsu, Chojuro, Kisame, Nurari | Water | used on screen |
| Omoi, Killer Bee, Ay | Lightning | used on screen |
| Yamato, Hashirama (and Kinoe, Wood clones) | Earth, Water | Wood Style components |
| Kurotsuchi | Fire, Earth | Lava Style components |
| Darui | Lightning, Water | Lightning + Storm (Gale) Style components |
| Mei Terumi | Water, Fire, Earth | Water + Lava + Boil Style components |
| Onoki, Mu | Earth, Wind, Fire | Dust (Particle) Style components |
| Deidara | Earth, Lightning | Explosion Style components (as Part I) |
| Kakuzu | all five | all used on screen (as Part I) |
| Itachi | Fire, Water, Wind | used on screen (as Part I) |
| Pain / Nagato (all six paths) | Water, Wind | **Session 3: Wind added.** Water Style: Raging Waves and Wind Style: Gale Palm, both on screen in the ep 128 flashback; Wind Release: Air Bullets as reanimated Nagato (ep 253). The paths themselves use no nature |
| Madara, Obito | Fire, Earth, Water | Fire Style + Wood Style components |
| Danzo | Wind, Earth, Water | Wind Style + Wood Style components |
| Gaara (Fifth Kazekage) | Wind, Earth | Part II adds Earth (first two listed; Magnet is novel-only) |
| Naruto (Six Paths Sage Mode) | Wind, Earth, Fire, Water | the natures of his Sage Art: Super Tailed Beast Rasen-Shuriken (Magnet, Fire, Water, Lava, Boil, Wind → components) |
| Chiyo, Sasori, Hidan, Kinkaku, Ginkaku, Gotta, Shiranami, Eight-Tails | none | none listed |
| Fuka, Kigiri | Fire | first listed / used |
| Fudo, Guren | Earth | used (Guren: Crystal Style, Earth "presumed" on Narutopedia). **Session 3 review: kept** (see below) |
| Sora, Kazuma | Wind · Wind, Earth | used on screen |
| Three-Tails | Water | listed |
| Four-Tails | Fire, Earth | Lava Style (Roshi's) components |
| Nine-Tails | Fire, Wind | listed (anime-only) |
| Kaguya | Fire (base); swaps Fire → Water → Earth | **Session 3: base nature now follows the rule** (no Release jutsu on screen → first listed, Fire). The lava, ice and desert dimensions stay as the Amenominaka element swap: a **design mapping, not canon natures** |
| Generic "Rain Ninja", "Mist Tracker Ninja" | Water | **Design choice, not canon** (generic units) |

**Session 3 nature review.** The four natures flagged in Session 2 were re-checked against the rule (on-screen use in the anime, else the infobox's marked affinity, else the first listed; kekkei genkai → components). A nature changes only where the rule was misapplied. Sources: Narutopedia character infoboxes and the jutsu articles' "Debut" and "Users" fields (checked 2026-09-24).

| Character | Session 2 | Verdict | Why |
|---|---|---|---|
| Pain / Nagato | Water | **Changed → Water, Wind** (misapplied) | Wild Water Wave (dub "Water Style: Raging Waves") and Wind Release: Gale Palm both debut in the anime in Shippuden ep 128, the Jiraiya training flashback, and both list Nagato as a canon user. Wind Release: Air Bullets (anime, ep 253) is reanimated Nagato's. Session 2 counted only the Water jutsu from that episode. Earth-Style Wall is listed as "Nagato (Anime only)" with no episode given, so Earth was **not** added (open). Enemy Pains attack and defend with their active (first) nature, so the boss fights don't change; the pullable Pain now also hits with Wind. |
| Minato | Fire | **Kept** (rule applied correctly) | Infobox: Fire, Wind, Lightning, Yin, Yang, with no affinity marked. His on-screen techniques (Rasengan, Flying Raijin, Eight Trigrams Sealing Style) have no nature. So he gets the first listed, Fire. |
| Konohamaru | Fire | **Kept** (rule applied correctly) | Infobox: Fire, Wind, Lightning (anime only), Earth (anime only), Yang, with no affinity marked. His Part II on-screen technique is the Rasengan (no nature). His Release jutsu are Boruto-era, anime-only, or debut in other characters' episodes. Fire Release: Great Flame Technique (anime ep 363) lists only him as a user, but the article gives no Part II scene, so it isn't counted. Either way the result is Fire. |
| Guren | Earth | **Kept** (rule applied correctly; partly verified) | Infobox: Crystal Release, Earth Release **(Presumed)**. Crystal Release has no canon components, so the rule falls back to the listed nature. Earth is Narutopedia's own presumption, not a confirmed canon nature. |
| Kaguya | Fire, Water, Earth (design mapping) | **Changed → Fire** base nature (the rule wasn't applied) | Infobox: all five natures plus Yin, Yang and Yin–Yang, with no affinity marked. On screen she uses no Release jutsu (All-Killing Ash Bones, Expansive Truth-Seeking Ball, Amenominaka), so the rule gives the first listed, Fire. The lava/ice/desert mapping stays only as the Amenominaka `elementSwap` sequence, which is a mechanic, not a nature claim. She starts in Fire either way, so the fight is unchanged. |

Also noted (not changed): the Part I Boss Rush Pain (`e_br_pain`) keeps "all five" from Session 1's enemy table, which reads the infobox list rather than on-screen use. That's a Session 1 design choice for a non-story boss; it's left for a later review.

## Places and terms

| Term | Status | Source / note |
|---|---|---|
| Fire Style, Wind Style, Lightning Style, Earth Style, Water Style | Verified | English TV names of the five Releases |
| Ice Style, Explosion Style, Wood Style | Verified | English TV fields of Ice/Explosion/Wood Release |
| Hidden Leaf Village | Verified | Konohagakure: English TV lists "Village Hidden in the Leaves" and "Hidden Leaf Village" |
| Leaf, Sand, Mist, Cloud, Stone, Sound, Rain (short forms) | Verified (Session 2) | Each village's English TV name is "The Village Hidden in the …" (Cloud: "Hidden Cloud Village", Stone: "Hidden Stone Village"). The short forms appear in dub titles ("Hero of the Leaf", "Pakura of the Sand!", "The Assassin of the Mist!", "Sound vs. Leaf", "Village Hidden in the Rain"). **Convention:** places "Hidden Leaf Village" / "Village Hidden in the Rain"; groups "Hidden X ninja" (leader-scope labels); generic units "X Ninja". Singular "Cloud", "Stone" never "Rock", no Japanese village names. |
| Land of Waves, Land of Tea, Tanzaku Town, Forest of Death | Verified | Articles (no separate dub names) |
| Final Valley | Verified | English TV name of the Valley of the End |
| Chunin Exams, Genin, Chunin, Jonin, Kage, Hokage | Verified | dub spellings |
| Nine-Tails | Verified | Narutopedia's English TV name is "Nine-Tailed Fox"; the dub also says "Nine-Tails" (dub titles of ep 40 "The Nine-Tails Unleashed" and Shippuden ep 165 "Nine-Tails, Captured!"). Naruto's Part I form label "(Nine-Tails Chakra)" is descriptive: Narutopedia calls the form "Initial Jinchūriki Form" and it has no dub name |
| Heavens' Curse Mark | Verified | English TV name of the Cursed Seal of Heaven |
| Legendary Sannin / Sannin | Verified | Sannin article |
| Sound Ninja Four | Verified (Session 2) | English TV name of the Sound Four ("Sound Ninja Five" with Kimimaro); used in blurbs |
| Sand Siblings | Not used (Session 2) | Narutopedia: "Three Sand Siblings", no English TV field and no dub title: removed from the game (see the changes table) |
| Team 7, Team 8, Team 10, Team Guy, Team Oboro | Verified | articles |
| Akatsuki | Verified | article |
| Jutsu Clash, Nature Wheel | Game terms | invented for this game (see DESIGN.md) |

## All names used in the game

<!-- NAMES:START -->
_Generated by `node tools/naming.mjs --write` from the content files — 484 distinct names._

**Not verified:** none.  
**Partly verified:** none.

### Characters, enemies and protect targets

| Name in game | Used as | Source checked | Status | Notes |
|---|---|---|---|---|
| Aoi Rokusho | Enemy | [Aoi Rokushō](https://naruto.fandom.com/wiki/Aoi_Rokush%C5%8D) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Asuma Sarutobi | Pullable (jonin) | [Asuma Sarutobi](https://naruto.fandom.com/wiki/Asuma_Sarutobi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Asuma Sarutobi (Reanimated) | Enemy | [Summoning: Impure World Reincarnation](https://naruto.fandom.com/wiki/Summoning:_Impure_World_Reincarnation) | Verified | Character + "(Reanimated)" from the dub "Summoning Jutsu: Reanimation" (as in Part I). Mu = Mū, macron dropped. |
| Ay | Pullable (kage) | [A (Fourth Raikage)](https://naruto.fandom.com/wiki/A_(Fourth_Raikage)) | Verified | English TV name "Ay" (article lead: A, engtv=Ay; Raikage article). Narutopedia/Viz: "A". |
| Bandit Ninja | Enemy | [Shiranami](https://naruto.fandom.com/wiki/Shiranami) | Descriptive | Descriptive: Shiranami's bandits (eps 145–151). |
| C2 Dragon | summonAdds: Deidara; Enemy | [C2](https://naruto.fandom.com/wiki/C2) | Verified | Narutopedia "English TV" (dub) field. |
| Chiyo | Pullable (jonin) | [Chiyo](https://naruto.fandom.com/wiki/Chiyo) | Verified | Article title; the dub spelling drops macrons. |
| Choji Akimichi | Pullable (genin) | [Chōji Akimichi](https://naruto.fandom.com/wiki/Ch%C5%8Dji_Akimichi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Chojuro | Pullable (genin) | [Chōjūrō](https://naruto.fandom.com/wiki/Ch%C5%8Dj%C5%ABr%C5%8D) | Verified | Article title; the dub spelling drops macrons. |
| Clay Bird | Enemy | [C1](https://naruto.fandom.com/wiki/C1) | Descriptive | Descriptive: one of Deidara's C1 clay birds. |
| Danzo Shimura | Enemy; Node | [Danzō Shimura](https://naruto.fandom.com/wiki/Danz%C5%8D_Shimura) | Verified | Article title (macron dropped). Also the dub title of ep 211 (Wikipedia, season 10), used as a node name. |
| Darui | Pullable (jonin) | [Darui](https://naruto.fandom.com/wiki/Darui) | Verified | Article title; the dub spelling drops macrons. |
| Deidara | Pullable (jonin); Enemy | [Deidara](https://naruto.fandom.com/wiki/Deidara) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Doki | Enemy | [Doki](https://naruto.fandom.com/wiki/Doki) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Dosu Kinuta | Enemy | [Dosu Kinuta](https://naruto.fandom.com/wiki/Dosu_Kinuta) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Eight-Tails | Enemy | [Gyūki](https://naruto.fandom.com/wiki/Gy%C5%ABki) | Verified | Other name "Eight-Tails" (Gyūki infobox); dub title of ep 143 "The Eight-Tails vs. Sasuke". |
| Foundation Operative | Enemy | [Root](https://naruto.fandom.com/wiki/Root) | Descriptive | Descriptive; Root's English TV name is "Foundation". |
| Four-Tails | Enemy | [Son Gokū](https://naruto.fandom.com/wiki/Son_Gok%C5%AB) | Verified | Other name "Four-Tails" (Son Gokū infobox). The ep 326 dub title writes "Four Tails"; the game hyphenates like "Nine-Tails". |
| Fudo | Enemy | [Fudō](https://naruto.fandom.com/wiki/Fud%C5%8D) | Verified | Article title; the dub spelling drops macrons. |
| Fuka | Enemy | [Fūka](https://naruto.fandom.com/wiki/F%C5%ABka) | Verified | Article title; the dub spelling drops macrons. |
| Gaara | Pullable (jonin); Enemy | [Gaara](https://naruto.fandom.com/wiki/Gaara) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Gaara (Fifth Kazekage) | Pullable (kage) | [Gaara](https://naruto.fandom.com/wiki/Gaara) | Verified | His title in Part II (the dub keeps "Kazekage": ep 5 "The Kazekage Stands Tall"). |
| Gato's Thug | Enemy | [Gatō](https://naruto.fandom.com/wiki/Gat%C5%8D) | Descriptive | Descriptive in-game label, not a canon technique name. |
| Giant Squid | Enemy | [Giant Squid](https://naruto.fandom.com/wiki/Giant_Squid) | Verified | Article title; the dub spelling drops macrons. |
| Ginkaku | Enemy | [Ginkaku](https://naruto.fandom.com/wiki/Ginkaku) | Verified | Article title; the dub spelling drops macrons. |
| Gotta | Enemy | [Gotta](https://naruto.fandom.com/wiki/Gotta) | Verified | Article title; the dub spelling drops macrons. |
| Gozu | Enemy | [Gōzu](https://naruto.fandom.com/wiki/G%C5%8Dzu) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Guren | Enemy | [Guren](https://naruto.fandom.com/wiki/Guren) | Verified | Article title; the dub spelling drops macrons. |
| Haku | Pullable (chunin); Enemy | [Haku](https://naruto.fandom.com/wiki/Haku) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Haku (Reanimated) | Enemy | [Summoning: Impure World Reincarnation](https://naruto.fandom.com/wiki/Summoning:_Impure_World_Reincarnation) | Verified | Character + "(Reanimated)" from the dub "Summoning Jutsu: Reanimation" (as in Part I). Mu = Mū, macron dropped. |
| Hashirama Senju | Pullable (kage) | [Hashirama Senju](https://naruto.fandom.com/wiki/Hashirama_Senju) | Verified | Article title; the dub spelling drops macrons. |
| Hashirama Senju (Reanimated) | Enemy | [Summoning: Impure World Reincarnation](https://naruto.fandom.com/wiki/Summoning:_Impure_World_Reincarnation) | Verified | "Hashirama Senju" + "(Reanimated)" from the dub "Summoning Jutsu: Reanimation". |
| Hidan | Pullable (jonin); Enemy | [Hidan](https://naruto.fandom.com/wiki/Hidan) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Hinata Hyuga | Pullable (genin) | [Hinata Hyūga](https://naruto.fandom.com/wiki/Hinata_Hy%C5%ABga) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Hiruzen Sarutobi | Pullable (kage) | [Hiruzen Sarutobi](https://naruto.fandom.com/wiki/Hiruzen_Sarutobi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Hotaru | Protect target | [Hotaru](https://naruto.fandom.com/wiki/Hotaru) | Verified | Article title; the dub spelling drops macrons. |
| Idate Morino | Protect target | [Idate Morino](https://naruto.fandom.com/wiki/Idate_Morino) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Ino Yamanaka | Pullable (genin) | [Ino Yamanaka](https://naruto.fandom.com/wiki/Ino_Yamanaka) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Iruka Umino | Pullable (genin) | [Iruka Umino](https://naruto.fandom.com/wiki/Iruka_Umino) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Itachi (Crow Clone) | Enemy | [Crow Clone Technique](https://naruto.fandom.com/wiki/Crow_Clone_Technique) | Descriptive | Descriptive; English TV "Crow Clone Jutsu". |
| Itachi (Shadow Clone) | Enemy | — | Descriptive | Descriptive in-game label, not a canon technique name. |
| Itachi Uchiha | Pullable (kage); Enemy | [Itachi Uchiha](https://naruto.fandom.com/wiki/Itachi_Uchiha) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Jiraiya | Pullable (kage) | [Jiraiya](https://naruto.fandom.com/wiki/Jiraiya) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Jirobo | Pullable (genin); Enemy | [Jirōbō](https://naruto.fandom.com/wiki/Jir%C5%8Db%C5%8D) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Jugo | Pullable (genin); Enemy | [Jūgo](https://naruto.fandom.com/wiki/J%C5%ABgo) | Verified | Article title; the dub spelling drops macrons. |
| Kabuto Yakushi | Pullable (jonin); Enemy | [Kabuto Yakushi](https://naruto.fandom.com/wiki/Kabuto_Yakushi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kabuto Yakushi (Sage Mode) | Enemy | [Sage Mode](https://naruto.fandom.com/wiki/Sage_Mode) | Verified | English TV "Sage Mode" (Kabuto is a listed user). |
| Kagari | Enemy | [Kagari](https://naruto.fandom.com/wiki/Kagari) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kaguya Otsutsuki | Enemy | [Kaguya Ōtsutsuki](https://naruto.fandom.com/wiki/Kaguya_%C5%8Ctsutsuki) | Verified | Article title; the dub spelling drops macrons. |
| Kakashi Hatake | Pullable (jonin); Enemy | [Kakashi Hatake](https://naruto.fandom.com/wiki/Kakashi_Hatake) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kakashi Hatake (Mangekyo Sharingan) | Pullable (kage) | [Mangekyō Sharingan](https://naruto.fandom.com/wiki/Mangeky%C5%8D_Sharingan) | Verified | No English TV field; macron dropped. |
| Kakuzu | Pullable (jonin); Enemy | [Kakuzu](https://naruto.fandom.com/wiki/Kakuzu) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kankuro | Pullable (chunin); Enemy | [Kankurō](https://naruto.fandom.com/wiki/Kankur%C5%8D) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Karin | Pullable (genin) | [Karin](https://naruto.fandom.com/wiki/Karin) | Verified | Article title; the dub spelling drops macrons. |
| Kazuma | Enemy | [Kazuma](https://naruto.fandom.com/wiki/Kazuma) | Verified | Article title; the dub spelling drops macrons. |
| Kiba Inuzuka | Pullable (genin) | [Kiba Inuzuka](https://naruto.fandom.com/wiki/Kiba_Inuzuka) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kidomaru | Pullable (chunin); Enemy | [Kidōmaru](https://naruto.fandom.com/wiki/Kid%C5%8Dmaru) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kigiri | Enemy | [Kigiri](https://naruto.fandom.com/wiki/Kigiri) | Verified | Article title; the dub spelling drops macrons. |
| Killer Bee | Pullable (jonin); Enemy | [Killer B](https://naruto.fandom.com/wiki/Killer_B) | Verified | Dub spelling. Narutopedia's article is "Killer B"; the English dub titles use "Killer Bee" (ep 244 "Killer Bee and Motoi", eps 429–430 "Killer Bee Rappūden"). |
| Kimimaro | Pullable (jonin); Enemy | [Kimimaro](https://naruto.fandom.com/wiki/Kimimaro) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kin Tsuchi | Enemy | [Kin Tsuchi](https://naruto.fandom.com/wiki/Kin_Tsuchi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kinkaku | Enemy | [Kinkaku](https://naruto.fandom.com/wiki/Kinkaku) | Verified | Article title; the dub spelling drops macrons. |
| Kinoe | Enemy | [Yamato](https://naruto.fandom.com/wiki/Yamato) | Verified | Yamato's Anbu codename; Narutopedia redirects "Kinoe" to Yamato. Used in the dub's Anbu arc (eps 351–355). |
| Kisame Hoshigaki | Pullable (jonin); Enemy | [Kisame Hoshigaki](https://naruto.fandom.com/wiki/Kisame_Hoshigaki) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Konan | Pullable (jonin); Enemy | [Konan](https://naruto.fandom.com/wiki/Konan) | Verified | Article title; the dub spelling drops macrons. |
| Konohamaru Sarutobi | Pullable (genin) | [Konohamaru Sarutobi](https://naruto.fandom.com/wiki/Konohamaru_Sarutobi) | Verified | Article title; the dub spelling drops macrons. |
| Kurenai Yuhi | Pullable (jonin) | [Kurenai Yūhi](https://naruto.fandom.com/wiki/Kurenai_Y%C5%ABhi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kurosuki Family Member | Enemy | [Kurosuki Family](https://naruto.fandom.com/wiki/Kurosuki_Family) | Descriptive | Descriptive in-game label, not a canon technique name. |
| Kurotsuchi | Pullable (chunin) | [Kurotsuchi](https://naruto.fandom.com/wiki/Kurotsuchi) | Verified | Article title; the dub spelling drops macrons. |
| Leaf Villager | Protect target | [Konohagakure](https://naruto.fandom.com/wiki/Konohagakure) | Descriptive | Descriptive protect target. |
| Madara Uchiha | Pullable (kage); Enemy | [Madara Uchiha](https://naruto.fandom.com/wiki/Madara_Uchiha) | Verified | Article title; the dub spelling drops macrons. |
| Madara Uchiha (Reanimated) | Enemy | [Summoning: Impure World Reincarnation](https://naruto.fandom.com/wiki/Summoning:_Impure_World_Reincarnation) | Verified | Character + "(Reanimated)" from the dub "Summoning Jutsu: Reanimation" (as in Part I). Mu = Mū, macron dropped. |
| Manda | Enemy | [Manda](https://naruto.fandom.com/wiki/Manda) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Masked Beast | Enemy | [Earth Grudge Fear](https://naruto.fandom.com/wiki/Earth_Grudge_Fear) | Descriptive | Descriptive: one of Kakuzu's masked hearts. |
| Mei Terumi | Pullable (kage) | [Mei Terumī](https://naruto.fandom.com/wiki/Mei_Terum%C4%AB) | Verified | Article title; the dub spelling drops macrons. |
| Meizu | Enemy | [Meizu](https://naruto.fandom.com/wiki/Meizu) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Might Guy | Pullable (jonin) | [Might Guy](https://naruto.fandom.com/wiki/Might_Guy) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Might Guy (Clone) | Enemy | [Traps Activate! Team Guy's Enemies!](https://naruto.fandom.com/wiki/Traps_Activate!_Team_Guy's_Enemies!) | Descriptive | Descriptive: the clones of Team Guy in ep 19. |
| Might Guy (Eight Inner Gates) | Pullable (kage) | [Eight Gates](https://naruto.fandom.com/wiki/Eight_Gates) | Verified | English TV "The Eight Inner Gates"; dub title of ep 420 "The Eight Inner Gates Formation". |
| Minato Namikaze | Pullable (kage) | [Minato Namikaze](https://naruto.fandom.com/wiki/Minato_Namikaze) | Verified | Article title; the dub spelling drops macrons. |
| Mist Tracker Ninja | Enemy | [Hunter-nin](https://naruto.fandom.com/wiki/Hunter-nin) | Descriptive | Descriptive; English TV of hunter-nin is "tracker ninja". |
| Misty Follower | Enemy | — | Descriptive | Descriptive in-game label, not a canon technique name. |
| Misumi Tsurugi | Enemy | [Misumi Tsurugi](https://naruto.fandom.com/wiki/Misumi_Tsurugi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Mizuki | Enemy | [Mizuki](https://naruto.fandom.com/wiki/Mizuki) | Verified | Article title (no separate dub field). Natures: the infobox (Infobox:Mizuki) lists Earth Release and Yin Release, both anime only; his Earth Style jutsu is on screen in Part I (ep 144), so the game uses Earth. |
| Motoi | Protect target | [Motoi](https://naruto.fandom.com/wiki/Motoi) | Verified | Article title; the dub spelling drops macrons. |
| Mu (Fragmentation) | Enemy | [Fission Technique](https://naruto.fandom.com/wiki/Fission_Technique) | Descriptive | Descriptive; English TV "Fragmentation". |
| Mu (Reanimated) | Enemy | [Summoning: Impure World Reincarnation](https://naruto.fandom.com/wiki/Summoning:_Impure_World_Reincarnation) | Verified | Character + "(Reanimated)" from the dub "Summoning Jutsu: Reanimation" (as in Part I). Mu = Mū, macron dropped. |
| Mubi | Enemy | [Mubi](https://naruto.fandom.com/wiki/Mubi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Nagato (Reanimated) | Enemy | [Summoning: Impure World Reincarnation](https://naruto.fandom.com/wiki/Summoning:_Impure_World_Reincarnation) | Verified | Character + "(Reanimated)" from the dub "Summoning Jutsu: Reanimation" (as in Part I). Mu = Mū, macron dropped. |
| Naruto Uzumaki | Pullable (chunin) | [Naruto Uzumaki](https://naruto.fandom.com/wiki/Naruto_Uzumaki) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Naruto Uzumaki (Nine-Tails Chakra) | Pullable (jonin) | [Jinchūriki Forms](https://naruto.fandom.com/wiki/Jinch%C5%ABriki_Forms) | Descriptive | RE-CHECKED (Session 2): descriptive form label, kept. Narutopedia's name for this form is "Initial Jinchūriki Form" (Jinchūriki Forms article), with no English TV / dub name for the form itself. "Nine-Tails" is the dub term (dub titles of ep 40 "The Nine-Tails Unleashed" and Shippuden ep 165 "Nine-Tails, Captured!"). Not the Part II "Nine-Tails Chakra Mode". |
| Naruto Uzumaki (Sage Mode) | Pullable (kage) | [Sage Mode](https://naruto.fandom.com/wiki/Sage_Mode) | Verified | English TV "Sage Mode". |
| Naruto Uzumaki (Six Paths Sage Mode) | Pullable (kage) | [Six Paths Sage Mode](https://naruto.fandom.com/wiki/Six_Paths_Sage_Mode) | Verified | No English TV field — the dub keeps "Six Paths Sage Mode". |
| Neji Hyuga | Pullable (chunin); Enemy | [Neji Hyūga](https://naruto.fandom.com/wiki/Neji_Hy%C5%ABga) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Neji Hyuga (Clone) | Enemy | [Traps Activate! Team Guy's Enemies!](https://naruto.fandom.com/wiki/Traps_Activate!_Team_Guy's_Enemies!) | Descriptive | Descriptive: the clones of Team Guy in ep 19. |
| Nine-Tails | Enemy; enrage: Kinkaku | [Kurama](https://naruto.fandom.com/wiki/Kurama) | Verified | "Nine-Tails" as in the dub titles of eps 40 and 165; English TV of the fox is "Nine-Tailed Fox". Also Kinkaku's transformation (he became a pseudo-Nine-Tails, ep 270). |
| Nurari | Enemy | [Nurari](https://naruto.fandom.com/wiki/Nurari) | Verified | Article title; the dub spelling drops macrons. |
| Obito Uchiha | Pullable (kage); Enemy; Node; Banner | [Obito Uchiha](https://naruto.fandom.com/wiki/Obito_Uchiha) | Verified | Article title. Also the dub title of ep 385 (Wikipedia, season 18), used as a node and as the Obito banner name ("The Fourth Great Ninja War: Obito Uchiha", season 18). |
| Obito Uchiha (Ten-Tails Jinchuriki) | Enemy | [Ten-Tails](https://naruto.fandom.com/wiki/Ten-Tails) | Verified | "Ten-Tails" + "Jinchuriki" as in the ep 378 dub title "The Ten Tails' Jinchuriki". |
| Oboro | Enemy | [Oboro](https://naruto.fandom.com/wiki/Oboro) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Omoi | Pullable (genin) | [Omoi](https://naruto.fandom.com/wiki/Omoi) | Verified | Article title; the dub spelling drops macrons. |
| Onoki | Pullable (kage) | [Ōnoki](https://naruto.fandom.com/wiki/%C5%8Cnoki) | Verified | Article title; the dub spelling drops macrons. |
| Orochimaru | Pullable (kage); Enemy | [Orochimaru](https://naruto.fandom.com/wiki/Orochimaru) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Pain | Pullable (kage); Enemy | [Nagato](https://naruto.fandom.com/wiki/Nagato) | Verified | Narutopedia redirects "Pain" to Nagato; "Pain" is the name the dub uses for him in battle. |
| Pain (Chikushodo) | Enemy | [Animal Path](https://naruto.fandom.com/wiki/Animal_Path) | Verified | English TV name of the Animal Path is "Chikushodo". |
| Pain (Gakido) | Enemy | [Preta Path](https://naruto.fandom.com/wiki/Preta_Path) | Verified | English TV name of the Preta Path is "Gakido". |
| Pain (Jigokudo) | Enemy | [Naraka Path](https://naruto.fandom.com/wiki/Naraka_Path) | Verified | English TV name of the Naraka Path is "Jigokudo". |
| Pain (Shurado) | Enemy | [Asura Path](https://naruto.fandom.com/wiki/Asura_Path) | Verified | English TV name of the Asura Path is "Shurado". |
| Pain (Tendo) | Enemy | [Deva Path](https://naruto.fandom.com/wiki/Deva_Path) | Verified | English TV name of the Deva Path is "Tendo". |
| Puppet | Enemy | — | Descriptive | Descriptive in-game label, not a canon technique name. |
| Raiga Kurosuki | Enemy | [Raiga Kurosuki](https://naruto.fandom.com/wiki/Raiga_Kurosuki) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Rain Ninja | Enemy | [Amegakure](https://naruto.fandom.com/wiki/Amegakure) | Descriptive | Descriptive; "Rain" short form of the dub "Village Hidden in the Rain" (ep 129 dub title). |
| Ranmaru | Enemy | [Ranmaru](https://naruto.fandom.com/wiki/Ranmaru) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Revived Soul | Enemy | [Revived Souls](https://naruto.fandom.com/wiki/Revived_Souls) | Descriptive | Descriptive, after the ep 66 dub title "Revived Souls". |
| Rock Lee | Pullable (chunin) | [Rock Lee](https://naruto.fandom.com/wiki/Rock_Lee) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Rock Lee (Clone) | Enemy | [Traps Activate! Team Guy's Enemies!](https://naruto.fandom.com/wiki/Traps_Activate!_Team_Guy's_Enemies!) | Descriptive | Descriptive: the clones of Team Guy in ep 19. |
| Rokusuke | Protect target | [Rokusuke](https://naruto.fandom.com/wiki/Rokusuke) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Sai | Pullable (chunin) | [Sai](https://naruto.fandom.com/wiki/Sai) | Verified | Article title; the dub spelling drops macrons. |
| Sakon and Ukon | Pullable (chunin); Enemy | [Sakon and Ukon](https://naruto.fandom.com/wiki/Sakon_and_Ukon) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Sakura Haruno | Pullable (genin) | [Sakura Haruno](https://naruto.fandom.com/wiki/Sakura_Haruno) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Sakura Haruno (Hundred Healings) | Pullable (jonin) | [Ninja Art Creation Rebirth — Strength of a Hundred Technique](https://naruto.fandom.com/wiki/Ninja_Art_Creation_Rebirth_%E2%80%94_Strength_of_a_Hundred_Technique) | Verified | Form label from the English TV name "Mitotic Regeneration: The Hundred Healings". |
| Sand Ninja | Enemy | — | Descriptive | Descriptive in-game label, not a canon technique name. |
| Sasori | Pullable (jonin); Enemy | [Sasori](https://naruto.fandom.com/wiki/Sasori) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Sasuke Uchiha | Pullable (chunin); Enemy | [Sasuke Uchiha](https://naruto.fandom.com/wiki/Sasuke_Uchiha) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Sasuke Uchiha (Eternal Mangekyo Sharingan) | Pullable (kage) | [Mangekyō Sharingan](https://naruto.fandom.com/wiki/Mangeky%C5%8D_Sharingan) | Verified | "Eternal Mangekyō Sharingan" redirects to Mangekyō Sharingan (no English TV field); macron dropped. |
| Sasuke Uchiha (Heavens' Curse Mark) | Pullable (jonin); Enemy | [Cursed Seal of Heaven](https://naruto.fandom.com/wiki/Cursed_Seal_of_Heaven) | Verified | Form label; "Heavens' Curse Mark" is the English TV name. |
| Sasuke Uchiha (Rinnegan) | Enemy | [Rinnegan](https://naruto.fandom.com/wiki/Rinnegan) | Verified | No English TV field — the dub keeps "Rinnegan". |
| Shikamaru Nara | Pullable (chunin) | [Shikamaru Nara](https://naruto.fandom.com/wiki/Shikamaru_Nara) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Shino Aburame | Pullable (genin) | [Shino Aburame](https://naruto.fandom.com/wiki/Shino_Aburame) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Shiranami | Enemy | [Shiranami](https://naruto.fandom.com/wiki/Shiranami) | Verified | Article title; the dub spelling drops macrons. |
| Shizune | Pullable (chunin) | [Shizune](https://naruto.fandom.com/wiki/Shizune) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Smoke Clone | Enemy | [Smoke Clone](https://naruto.fandom.com/wiki/Smoke_Clone) | Descriptive | Descriptive unit label for Kigiri's Smoke Clone technique. |
| Sora | Enemy | [Sora](https://naruto.fandom.com/wiki/Sora) | Verified | Article title; the dub spelling drops macrons. |
| Sound Ninja | Enemy | — | Descriptive | Descriptive in-game label, not a canon technique name. |
| Suigetsu Hozuki | Pullable (chunin) | [Suigetsu Hōzuki](https://naruto.fandom.com/wiki/Suigetsu_H%C5%8Dzuki) | Verified | Article title; the dub spelling drops macrons. |
| Summoned Beast | Enemy | [Animal Path](https://naruto.fandom.com/wiki/Animal_Path) | Descriptive | Descriptive: one of Chikushodo's summons. |
| Tayuya | Pullable (chunin); Enemy | [Tayuya](https://naruto.fandom.com/wiki/Tayuya) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Tazuna | Protect target | [Tazuna](https://naruto.fandom.com/wiki/Tazuna) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Temari | Pullable (chunin); Enemy | [Temari](https://naruto.fandom.com/wiki/Temari) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Ten-Tails Clone | Enemy | [Ten-Tails Clones](https://naruto.fandom.com/wiki/Ten-Tails_Clones) | Verified | Article "Ten-Tails Clones" (singular unit name). |
| Tenten | Pullable (genin) | [Tenten](https://naruto.fandom.com/wiki/Tenten) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Tenten (Clone) | Enemy | [Traps Activate! Team Guy's Enemies!](https://naruto.fandom.com/wiki/Traps_Activate!_Team_Guy's_Enemies!) | Descriptive | Descriptive: the clones of Team Guy in ep 19. |
| Three-Tails | Enemy | [Isobu](https://naruto.fandom.com/wiki/Isobu) | Verified | Other name "Three-Tails" (Isobu infobox); the dub calls it the Three-Tails. |
| Tobi | Enemy | [Obito Uchiha](https://naruto.fandom.com/wiki/Obito_Uchiha) | Verified | Obito's masked alias "Tobi" (listed in his other names); the dub uses it until his reveal. |
| Tobirama Senju (Reanimated) | Enemy | [Summoning: Impure World Reincarnation](https://naruto.fandom.com/wiki/Summoning:_Impure_World_Reincarnation) | Verified | "Tobirama Senju" + "(Reanimated)" (see above). |
| Tsunade | Pullable (kage); Enemy | [Tsunade](https://naruto.fandom.com/wiki/Tsunade) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Tsunami | Protect target | [Tsunami](https://naruto.fandom.com/wiki/Tsunami) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Ukon | Enemy | [Sakon and Ukon](https://naruto.fandom.com/wiki/Sakon_and_Ukon) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Waraji | Enemy | [Waraji](https://naruto.fandom.com/wiki/Waraji) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Water Clone | Enemy | — | Descriptive | Descriptive in-game label, not a canon technique name. |
| Wood Clone | Enemy | [Wood Clone Technique](https://naruto.fandom.com/wiki/Wood_Clone_Technique) | Descriptive | Descriptive unit label for a Wood Style: Wood Clone. |
| Yamato | Pullable (jonin); Enemy | [Yamato](https://naruto.fandom.com/wiki/Yamato) | Verified | Article title; the dub spelling drops macrons. |
| Yoroi Akado | Enemy | [Yoroi Akadō](https://naruto.fandom.com/wiki/Yoroi_Akad%C5%8D) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Zabuza Momochi | Pullable (jonin); Enemy | [Zabuza Momochi](https://naruto.fandom.com/wiki/Zabuza_Momochi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Zabuza Momochi (Reanimated) | Enemy | [Summoning: Impure World Reincarnation](https://naruto.fandom.com/wiki/Summoning:_Impure_World_Reincarnation) | Verified | Character + "(Reanimated)" from the dub "Summoning Jutsu: Reanimation" (as in Part I). Mu = Mū, macron dropped. |
| Zaku Abumi | Enemy | [Zaku Abumi](https://naruto.fandom.com/wiki/Zaku_Abumi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Zori | Enemy | [Zōri](https://naruto.fandom.com/wiki/Z%C5%8Dri) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |


### Jutsu, Ultimates and boss-mechanic names

| Name in game | Used as | Source checked | Status | Notes |
|---|---|---|---|---|
| All-Killing Ash Bones | Jutsu: Kaguya Otsutsuki | [All-Killing Ash Bones](https://naruto.fandom.com/wiki/All-Killing_Ash_Bones) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Almighty Push | Ult: Pain; telegraphAoE: Pain (Tendo); reflect: Pain (Tendo); reflect: Nagato (Reanimated); telegraphAoE: Pain | [Shinra Tensei](https://naruto.fandom.com/wiki/Shinra_Tensei) | Verified | Narutopedia "English TV" (dub) field. |
| Amaterasu | telegraphAoE: Itachi Uchiha; Jutsu: Sasuke Uchiha; telegraphAoE: Sasuke Uchiha; Jutsu: Sasuke Uchiha (Rinnegan) | [Amaterasu](https://naruto.fandom.com/wiki/Amaterasu) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Amber Purification Jar | Jutsu: Ginkaku | [Kohaku no Jōhei](https://naruto.fandom.com/wiki/Kohaku_no_J%C5%8Dhei) | Verified | Narutopedia "English TV" (dub) field. |
| Amenominaka | elementSwap: Kaguya Otsutsuki | [Amenominaka](https://naruto.fandom.com/wiki/Amenominaka) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Asura Attack | telegraphAoE: Pain; Jutsu: Pain (Shurado) | [Asura Attack](https://naruto.fandom.com/wiki/Asura_Attack) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Beast Wave Gale Palm | Jutsu: Sora | [Beast Tearing Gale Palm](https://naruto.fandom.com/wiki/Beast_Tearing_Gale_Palm) | Verified | Narutopedia "English TV" (dub) field. |
| Blade of the Thunder Spirit | elementSwap: Aoi Rokusho; telegraphAoE: Aoi Rokusho; Node | [Sword of the Thunder God](https://naruto.fandom.com/wiki/Sword_of_the_Thunder_God) | Verified | Narutopedia "English TV" (dub) field. |
| Bracken Dance | Ult: Kimimaro; telegraphAoE: Kimimaro; Node | [Dance of the Seedling Fern](https://naruto.fandom.com/wiki/Dance_of_the_Seedling_Fern) | Verified | Narutopedia "English TV" (dub) field. |
| C0 | enrage: Deidara | [C0](https://naruto.fandom.com/wiki/C0) | Verified | Article has no separate English TV name — the dub keeps this name. |
| C1 | Jutsu: Deidara; telegraphAoE: Deidara; summonAdds: Deidara | [C1](https://naruto.fandom.com/wiki/C1) | Verified | Article has no separate English TV name — the dub keeps this name. |
| C3 | telegraphAoE: Deidara | [C3](https://naruto.fandom.com/wiki/C3) | Verified | Article has no separate English TV name — the dub keeps this name. |
| C4 Karura | Ult: Deidara; telegraphAoE: Deidara | [C4](https://naruto.fandom.com/wiki/C4) | Verified | Narutopedia "English TV" (dub) field. |
| Chakra absorption | lifesteal: Yoroi Akado; lifesteal: Jirobo; lifesteal: Pain (Gakido) | [Yoroi Akadō](https://naruto.fandom.com/wiki/Yoroi_Akad%C5%8D) | Descriptive | Descriptive: Yoroi's Part 1 chakra drain is unnamed on Narutopedia. |
| Chakra Scalpel | Ult: Kabuto; Jutsu: Kabuto Yakushi | [Chakra Scalpel](https://naruto.fandom.com/wiki/Chakra_Scalpel) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Chameleon Jutsu | shieldPhase: Shiranami | [Hiding with Camouflage Technique](https://naruto.fandom.com/wiki/Hiding_with_Camouflage_Technique) | Verified | Narutopedia "English TV" field lists "Chameleon Jutsu" and "Camouflage Jutsu"; the first is used. |
| Chidori | Ult: Sasuke; Ult: Sasuke★; telegraphAoE: Sasuke Uchiha (Heavens' Curse Mark); Jutsu: Sasuke Uchiha; Jutsu: Sasuke Uchiha (Rinnegan) | [Chidori](https://naruto.fandom.com/wiki/Chidori) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Chidori Sharp Spear | Jutsu: Sasuke Uchiha | [Chidori Sharp Spear](https://naruto.fandom.com/wiki/Chidori_Sharp_Spear) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Chidori Stream | telegraphAoE: Sasuke Uchiha | [Chidori Current](https://naruto.fandom.com/wiki/Chidori_Current) | Verified | Narutopedia "English TV" (dub) field. |
| Clay Clone | reviveOnce: Deidara | [Clay Clone](https://naruto.fandom.com/wiki/Clay_Clone) | Verified | Narutopedia "English TV" (dub) field. |
| Clematis Dance: Flower | Jutsu: Kimimaro | [Dance of the Clematis: Flower](https://naruto.fandom.com/wiki/Dance_of_the_Clematis:_Flower) | Verified | Narutopedia "English TV" (dub) field. |
| Cloud Style: Crescent Moon Slice | Ult: Omoi | [Cloud-Style Crescent Moon Beheading](https://naruto.fandom.com/wiki/Cloud-Style_Crescent_Moon_Beheading) | Verified | Narutopedia "English TV" (dub) field. |
| Coiling Around | Jutsu: Manda | [Coiling Around](https://naruto.fandom.com/wiki/Coiling_Around) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Crow Clone Jutsu | summonAdds: Itachi Uchiha | [Crow Clone Technique](https://naruto.fandom.com/wiki/Crow_Clone_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Crystal Style: Burst Crystal Falling Dragon | telegraphAoE: Guren | [Crystal Release: Tearing Crystal Falling Dragon](https://naruto.fandom.com/wiki/Crystal_Release:_Tearing_Crystal_Falling_Dragon) | Verified | Narutopedia "English TV" (dub) field. |
| Crystal Style: Jade Crystal Mirror | Jutsu: Guren; reflect: Guren | [Crystal Release: Jade Crystal Mirror](https://naruto.fandom.com/wiki/Crystal_Release:_Jade_Crystal_Mirror) | Verified | Narutopedia "English TV" (dub) field. |
| Curse Jutsu | Ult: Hidan; telegraphAoE: Hidan | [Curse Technique: Death Controlling Possessed Blood](https://naruto.fandom.com/wiki/Curse_Technique:_Death_Controlling_Possessed_Blood) | Verified | Narutopedia "English TV" (dub) field. |
| Dance of the Shikigami | shieldPhase: Konan | [Dance of the Shikigami](https://naruto.fandom.com/wiki/Dance_of_the_Shikigami) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Demon Flute: Chains of Fantasia | Ult: Tayuya; Jutsu: Tayuya | [Demonic Flute: Phantom Sound Chains](https://naruto.fandom.com/wiki/Demonic_Flute:_Phantom_Sound_Chains) | Verified | Narutopedia "English TV" (dub) field. |
| Demon Flute: Trio Requiem | summonAdds: Tayuya | [Demonic Flute: Illusionary Warriors Manipulating Melody](https://naruto.fandom.com/wiki/Demonic_Flute:_Illusionary_Warriors_Manipulating_Melody) | Verified | English TV name of "Demonic Flute: Illusionary Warriors Manipulating Melody" (Doki control, anime ep 120). A separate game-only jutsu shares the name. |
| Demon of the Hidden Mist | enrage: Zabuza Momochi; Banner | [Zabuza Momochi](https://naruto.fandom.com/wiki/Zabuza_Momochi) | Verified | Zabuza's epithet, from the article's English name field. |
| Demon Twin Jutsu | summonAdds: Sakon and Ukon; summonAdds: Kabuto Yakushi (Sage Mode) | [Attack of the Twin Demons](https://naruto.fandom.com/wiki/Attack_of_the_Twin_Demons) | Verified | Narutopedia "English TV" (dub) field. |
| Demon Wind Shuriken: Windmill of Shadows | Jutsu: Mizuki | [Fūma Shuriken](https://naruto.fandom.com/wiki/F%C5%ABma_Shuriken) | Verified | Narutopedia "English TV" (dub) field of the Fūma Shuriken; Mizuki is a listed user (ep 1: the giant shuriken he throws at Naruto). |
| Demonic Illusion: Death Mirage Jutsu | Ult: Iruka; telegraphAoE: Kakashi Hatake | [Demonic Illusion: Hell Viewing Technique](https://naruto.fandom.com/wiki/Demonic_Illusion:_Hell_Viewing_Technique) | Verified | Narutopedia "English TV" field; Kakashi uses it in ep 5, Iruka in ep 21 (per the Iruka Umino article). |
| Dynamic Entry | Ult: Guy; Jutsu: Might Guy (Clone) | [Dynamic Entry](https://naruto.fandom.com/wiki/Dynamic_Entry) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Earth Grudge | summonAdds: Kakuzu; elementSwap: Kakuzu; reviveOnce: Kakuzu | [Earth Grudge Fear](https://naruto.fandom.com/wiki/Earth_Grudge_Fear) | Verified | Narutopedia "English TV" (dub) field. |
| Earth Style Barrier: Earth Dome Prison | Ult: Jirobo; Jutsu: Jirobo; Node | [Earth Release Barrier: Earth Prison Dome of Magnificent Nothingness](https://naruto.fandom.com/wiki/Earth_Release_Barrier:_Earth_Prison_Dome_of_Magnificent_Nothingness) | Verified | Narutopedia "English TV" (dub) field. |
| Earth Style Ultimate Revival Jutsu: Soil Bodies | summonAdds: Kazuma | [Earth Release Resurrection Technique: Corpse Soil](https://naruto.fandom.com/wiki/Earth_Release_Resurrection_Technique:_Corpse_Soil) | Verified | Narutopedia "English TV" (dub) field. |
| Earth Style: Earthquake Slam | Jutsu: Fudo | [Earth Release: Tearing Earth Turning Palm](https://naruto.fandom.com/wiki/Earth_Release:_Tearing_Earth_Turning_Palm) | Verified | Narutopedia "English TV" field lists "Earth Style: Earthquake Slam" and "Earth Style: Rupturing Earth Palm"; the first is used. Fudo is an anime user. |
| Earth Style: Headhunter Jutsu | Jutsu: Kakashi Hatake | [Earth Release: Double Suicide Decapitation Technique](https://naruto.fandom.com/wiki/Earth_Release:_Double_Suicide_Decapitation_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Earth Style: Hidden in Stones Jutsu | telegraphAoE: Kazuma | [Earth Release: Hiding in Rock Technique](https://naruto.fandom.com/wiki/Earth_Release:_Hiding_in_Rock_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Earth Style: Iron Skin | Ult: Kakuzu; shieldPhase: Kakuzu | [Earth Release: Earth Spear](https://naruto.fandom.com/wiki/Earth_Release:_Earth_Spear) | Verified | Narutopedia "English TV" (dub) field. |
| Earth Style: Underground Move Jutsu | telegraphAoE: Mizuki; Jutsu: Mubi | [Earth Release: Underground Projection Fish Technique](https://naruto.fandom.com/wiki/Earth_Release:_Underground_Projection_Fish_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Eight Trigrams: Palm Rotation | reflect: Neji Hyuga | [Eight Trigrams Palms Revolving Heaven](https://naruto.fandom.com/wiki/Eight_Trigrams_Palms_Revolving_Heaven) | Verified | Narutopedia "English TV" (dub) field. |
| Eighty Gods Vacuum Attack | Jutsu: Kaguya Otsutsuki | [Eighty Gods Vacuum Attack](https://naruto.fandom.com/wiki/Eighty_Gods_Vacuum_Attack) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Expansive Truth-Seeking Ball | telegraphAoE: Kaguya Otsutsuki | [Expansive Truth-Seeking Ball](https://naruto.fandom.com/wiki/Expansive_Truth-Seeking_Ball) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Exploding Flame Shot | Jutsu: Kigiri | [Exploding Flame Shot](https://naruto.fandom.com/wiki/Exploding_Flame_Shot) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Explosion Style | elementSwap: Deidara | [Explosion Release](https://naruto.fandom.com/wiki/Explosion_Release) | Verified | Narutopedia "English TV" (dub) field. |
| Fire Style: Burning Ash | Jutsu: Asuma Sarutobi (Reanimated) | [Fire Release: Ash Pile Burning](https://naruto.fandom.com/wiki/Fire_Release:_Ash_Pile_Burning) | Verified | Narutopedia "English TV" (dub) field. |
| Fire Style: Fireball Jutsu | Jutsu: Itachi Uchiha; telegraphAoE: Tobi; Jutsu: Obito Uchiha | [Fire Release: Great Fireball Technique](https://naruto.fandom.com/wiki/Fire_Release:_Great_Fireball_Technique) | Verified | Narutopedia "English TV" field lists "Fire Style: Fireball Jutsu" and "Fire Style: Great Fireball Jutsu"; the first is used. |
| Fire Style: Majestic Destroyer Flame | Ult: Madara; Jutsu: Madara Uchiha (Reanimated) | [Fire Release: Great Fire Annihilation](https://naruto.fandom.com/wiki/Fire_Release:_Great_Fire_Annihilation) | Verified | Narutopedia "English TV" (dub) field. |
| Fire Style: Phoenix Flower Jutsu | Jutsu: Sasuke Uchiha (Heavens' Curse Mark); Jutsu: Fuka | [Fire Release: Phoenix Sage Fire Technique](https://naruto.fandom.com/wiki/Fire_Release:_Phoenix_Sage_Fire_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Fire Style: Searing Migraine | Jutsu: Masked Beast; telegraphAoE: Kakuzu | [Fire Release: Intelligent Hard Work](https://naruto.fandom.com/wiki/Fire_Release:_Intelligent_Hard_Work) | Verified | Narutopedia "English TV" (dub) field. |
| Flying Raijin Jutsu | Ult: Minato | [Flying Thunder God Technique](https://naruto.fandom.com/wiki/Flying_Thunder_God_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Flying Swallow | Ult: Asuma; Jutsu: Kazuma; telegraphAoE: Asuma Sarutobi (Reanimated) | [Flying Swallow](https://naruto.fandom.com/wiki/Flying_Swallow) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Fragmentation | summonAdds: Mu (Reanimated) | [Fission Technique](https://naruto.fandom.com/wiki/Fission_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Fury Jutsu | summonAdds: Shiranami | [Fury](https://naruto.fandom.com/wiki/Fury) | Verified | Narutopedia "English TV" (dub) field. |
| Gale Style: Laser Circus | Ult: Darui | [Storm Release: Laser Circus](https://naruto.fandom.com/wiki/Storm_Release:_Laser_Circus) | Verified | Narutopedia "English TV" (dub) field. |
| Gentle Fist | Jutsu: Neji Hyuga; Jutsu: Neji Hyuga (Clone) | [Gentle Fist](https://naruto.fandom.com/wiki/Gentle_Fist) | Verified | Narutopedia "English TV" (dub) field. |
| Gentle Fist Art: Eight Trigrams Sixty-Four Palms | Ult: Neji; telegraphAoE: Neji Hyuga | [Eight Trigrams Sixty-Four Palms](https://naruto.fandom.com/wiki/Eight_Trigrams_Sixty-Four_Palms) | Verified | Narutopedia "English TV" (dub) field. |
| Heal Bite | Ult: Karin | [Heal Bite](https://naruto.fandom.com/wiki/Heal_Bite) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Healing Jutsu | Ult: Sakura; regen: Kabuto Yakushi; regen: Kabuto Yakushi (Sage Mode) | [Mystical Palm Technique](https://naruto.fandom.com/wiki/Mystical_Palm_Technique) | Verified | Narutopedia "English TV" field. Sakura is a listed user but first uses it in Part II; used for her Part 1 form because she has no Part 1 signature technique. Kabuto uses it in Part 1 (debut ep 36). |
| Heaven Kick of Pain | Jutsu: Tsunade | [Heavenly Foot of Pain](https://naruto.fandom.com/wiki/Heavenly_Foot_of_Pain) | Verified | Narutopedia "English TV" (dub) field. |
| Heavens' Curse Mark | enrage: Kimimaro; reviveOnce: Sasuke Uchiha (Heavens' Curse Mark); enrage: Sasuke Uchiha | [Cursed Seal of Heaven](https://naruto.fandom.com/wiki/Cursed_Seal_of_Heaven) | Verified | Narutopedia "English TV" (dub) field. |
| Hiramekarei | Ult: Chojuro | [Hiramekarei](https://naruto.fandom.com/wiki/Hiramekarei) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Hiruko | shieldPhase: Sasori | [Hiruko](https://naruto.fandom.com/wiki/Hiruko) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Human Boulder | Ult: Choji | [Human Bullet Tank](https://naruto.fandom.com/wiki/Human_Bullet_Tank) | Verified | Narutopedia "English TV" (dub) field. |
| Iaido | Jutsu: Zori; Jutsu: Waraji | [Iaidō](https://naruto.fandom.com/wiki/Iaid%C5%8D) | Verified | No separate English TV name; macron dropped. |
| Ice Style | elementSwap: Haku | [Ice Release](https://naruto.fandom.com/wiki/Ice_Release) | Verified | Narutopedia "English TV" (dub) field. |
| Immortality | reviveOnce: Hidan | [Hidan](https://naruto.fandom.com/wiki/Hidan) | Descriptive | Descriptive in-game label, not a canon technique name. |
| Indra's Arrow | telegraphAoE: Sasuke Uchiha (Rinnegan) | [Indra's Arrow](https://naruto.fandom.com/wiki/Indra's_Arrow) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Inferno Style: Flame Control | Ult: Sasuke★★; enrage: Sasuke Uchiha; enrage: Sasuke Uchiha (Rinnegan) | [Blaze Release: Kagutsuchi](https://naruto.fandom.com/wiki/Blaze_Release:_Kagutsuchi) | Verified | Narutopedia "English TV" (dub) field. |
| Ink Creation | Jutsu: Eight-Tails | [Ink Creation](https://naruto.fandom.com/wiki/Ink_Creation) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Iron Sand Gathering | telegraphAoE: Sasori | [Iron Sand Gathering Assault](https://naruto.fandom.com/wiki/Iron_Sand_Gathering_Assault) | Verified | Narutopedia "English TV" field. Sasori uses it through the Third Kazekage puppet (listed user). |
| Iron Sand: Scattered Showers | Jutsu: Sasori | [Iron Sand Drizzle](https://naruto.fandom.com/wiki/Iron_Sand_Drizzle) | Verified | Narutopedia "English TV" field. Sasori uses it through the Third Kazekage puppet (listed user). |
| Iron Sand: World Order | telegraphAoE: Sasori | [Iron Sand World Method](https://naruto.fandom.com/wiki/Iron_Sand_World_Method) | Verified | Narutopedia "English TV" (dub) field. |
| Izanagi | reviveOnce: Danzo Shimura; reviveOnce: Tobi | [Izanagi](https://naruto.fandom.com/wiki/Izanagi) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Kamui | Ult: Kakashi★; shieldPhase: Tobi; Jutsu: Tobi; shieldPhase: Obito Uchiha | [Kamui](https://naruto.fandom.com/wiki/Kamui) | Verified | Article has no separate English TV name — the dub keeps this name. |
| King of Hell | regen: Pain (Jigokudo); regen: Nagato (Reanimated) | [King of Hell](https://naruto.fandom.com/wiki/King_of_Hell) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Kurosuki Family ambush | summonAdds: Raiga Kurosuki | — | Descriptive | Descriptive in-game label, not a canon technique name. |
| Larch Dance | reflect: Kimimaro | [Dance of the Larch](https://naruto.fandom.com/wiki/Dance_of_the_Larch) | Verified | Narutopedia "English TV" (dub) field. |
| Lariat | Jutsu: Killer Bee; enrage: Eight-Tails | [Lightning Release: Lariat](https://naruto.fandom.com/wiki/Lightning_Release:_Lariat) | Verified | Narutopedia "English TV" (dub) field. |
| Lava Style: Lava Monster Jutsu | Ult: Mei | [Lava Release: Melting Apparition Technique](https://naruto.fandom.com/wiki/Lava_Release:_Melting_Apparition_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Lava Style: Quicklime Jutsu | Ult: Kurotsuchi | [Lava Release: Quicklime Congealing Technique](https://naruto.fandom.com/wiki/Lava_Release:_Quicklime_Congealing_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Leaf Fan | Jutsu: Kinkaku | [Bashōsen](https://naruto.fandom.com/wiki/Bash%C5%8Dsen) | Verified | Narutopedia "English TV" (dub) field. |
| Leaf Village Secret Finger Jutsu: One Thousand Years of Death | Jutsu: Kakashi Hatake | [One Thousand Years of Death](https://naruto.fandom.com/wiki/One_Thousand_Years_of_Death) | Verified | Narutopedia "English TV" (dub) field. |
| Liger Bomb | Ult: Ay | [Liger Bomb](https://naruto.fandom.com/wiki/Liger_Bomb) | Verified | Narutopedia "English TV" (dub) field. |
| Lightning Blade | Ult: Kakashi; Jutsu: Kakashi Hatake | [Lightning Cutter](https://naruto.fandom.com/wiki/Lightning_Cutter) | Verified | Narutopedia "English TV" (dub) field. |
| Lightning Style: False Darkness | Jutsu: Kakuzu | [Lightning Release: False Darkness](https://naruto.fandom.com/wiki/Lightning_Release:_False_Darkness) | Verified | Narutopedia "English TV" (dub) field. |
| Limbo: Hengoku | telegraphAoE: Madara Uchiha | [Limbo: Border Jail](https://naruto.fandom.com/wiki/Limbo:_Border_Jail) | Verified | Narutopedia "English TV" (dub) field. |
| Man-Beast Ultimate Taijutsu: Fang Over Fang | Ult: Kiba | [Fang Passing Fang](https://naruto.fandom.com/wiki/Fang_Passing_Fang) | Verified | Narutopedia "English TV" (dub) field. |
| Misty Follower Jutsu | summonAdds: Oboro | [Mist Servant Technique](https://naruto.fandom.com/wiki/Mist_Servant_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Mitotic Regeneration: The Hundred Healings | Ult: Sakura★ | [Ninja Art Creation Rebirth — Strength of a Hundred Technique](https://naruto.fandom.com/wiki/Ninja_Art_Creation_Rebirth_%E2%80%94_Strength_of_a_Hundred_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Multi-Smoke Clone | summonAdds: Kigiri | [Multiple Smoke Clone](https://naruto.fandom.com/wiki/Multiple_Smoke_Clone) | Verified | Narutopedia "English TV" (dub) field. |
| Multiple Fists Barrage | Ult: Sakon; Jutsu: Sakon and Ukon | [Multiple Connected Fists](https://naruto.fandom.com/wiki/Multiple_Connected_Fists) | Verified | Narutopedia "English TV" (dub) field. |
| Night Guy | Ult: Guy★ | [Night Guy](https://naruto.fandom.com/wiki/Night_Guy) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Ninja Art: Black Tornado | Jutsu: Kurosuki Family Member | [Black Tornado](https://naruto.fandom.com/wiki/Black_Tornado) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Hidden Mist Jutsu | shieldPhase: Zabuza Momochi; shieldPhase: Raiga Kurosuki; shieldPhase: Zabuza Momochi (Reanimated) | [Hiding in Mist Technique](https://naruto.fandom.com/wiki/Hiding_in_Mist_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Lightning Ball | Jutsu: Raiga Kurosuki | [Lightning Ball](https://naruto.fandom.com/wiki/Lightning_Ball) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Lightning Fangs | Jutsu: Raiga Kurosuki | [Fangs of Lightning](https://naruto.fandom.com/wiki/Fangs_of_Lightning) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Mind Transfer Jutsu | Ult: Ino | [Mind Body Switch Technique](https://naruto.fandom.com/wiki/Mind_Body_Switch_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Mitotic Regeneration | Ult: Tsunade | [Creation Rebirth](https://naruto.fandom.com/wiki/Creation_Rebirth) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Poison Fog | Ult: Shizune | [Poison Mist](https://naruto.fandom.com/wiki/Poison_Mist) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Senbon Rainstorm | Jutsu: Aoi Rokusho; Node | [Senbon Shower](https://naruto.fandom.com/wiki/Senbon_Shower) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Super Beast Scroll | Ult: Sai | [Super Beast Imitating Drawing](https://naruto.fandom.com/wiki/Super_Beast_Imitating_Drawing) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Thunder Armour | enrage: Raiga Kurosuki | [Lightning Strike Armour](https://naruto.fandom.com/wiki/Lightning_Strike_Armour) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Wind Scythe Jutsu | Ult: Temari; Jutsu: Temari | [Sickle Weasel Technique](https://naruto.fandom.com/wiki/Sickle_Weasel_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Orochimaru Style: Substitution Jutsu | reviveOnce: Orochimaru | [Orochimaru-Style Body Replacement Technique](https://naruto.fandom.com/wiki/Orochimaru-Style_Body_Replacement_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Paper Shuriken | Jutsu: Konan | [Paper Shuriken](https://naruto.fandom.com/wiki/Paper_Shuriken) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Parasitic Insects Jutsu | Ult: Shino | [Parasitic Destruction Insect Technique](https://naruto.fandom.com/wiki/Parasitic_Destruction_Insect_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Particle Style: Atomic Dismantling Jutsu | Ult: Onoki; telegraphAoE: Mu (Reanimated) | [Dust Release: Detachment of the Primitive World Technique](https://naruto.fandom.com/wiki/Dust_Release:_Detachment_of_the_Primitive_World_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Planetary Devastation | telegraphAoE: Pain (Tendo); telegraphAoE: Nagato (Reanimated); Node | [Chibaku Tensei](https://naruto.fandom.com/wiki/Chibaku_Tensei) | Verified | English TV name of Chibaku Tensei; also the dub title of ep 167 (Wikipedia, season 8; Narutopedia episode article "Chibaku Tensei"). |
| Play Possum Jutsu | enrage: Gaara | [Feigning Sleep Technique](https://naruto.fandom.com/wiki/Feigning_Sleep_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Primary Lotus | Ult: Lee; Jutsu: Rock Lee (Clone) | [Front Lotus](https://naruto.fandom.com/wiki/Front_Lotus) | Verified | Narutopedia "English TV" (dub) field. |
| Protective Eight Trigrams Sixty-Four Palms | Ult: Hinata | [Protecting Eight Trigrams Sixty-Four Palms](https://naruto.fandom.com/wiki/Protecting_Eight_Trigrams_Sixty-Four_Palms) | Verified | Narutopedia "English TV" (dub) field. |
| Puppet Master Jutsu | Ult: Kankuro; Jutsu: Kankuro | [Puppet Technique](https://naruto.fandom.com/wiki/Puppet_Technique) | Verified | Narutopedia "English TV" field (Kankuro, ep 41). Used as his Tank ult (the puppet draws attacks). |
| Ranmaru's eyes guide Raiga | rally: Ranmaru | — | Descriptive | Descriptive in-game label, not a canon technique name. |
| Rasengan | Ult: Naruto; Ult: Naruto★; Ult: Konohamaru | [Rasengan](https://naruto.fandom.com/wiki/Rasengan) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Reaper Kiss | lifesteal: Fuka | [Execution by Kiss](https://naruto.fandom.com/wiki/Execution_by_Kiss) | Verified | Narutopedia "English TV" (dub) field. |
| Resonating Echo Drill | Jutsu: Dosu Kinuta | [Resonating Echo Drill](https://naruto.fandom.com/wiki/Resonating_Echo_Drill) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Rising Twin Dragons | Ult: Tenten; Jutsu: Tenten (Clone) | [Twin Rising Dragons](https://naruto.fandom.com/wiki/Twin_Rising_Dragons) | Verified | Narutopedia "English TV" (dub) field. |
| Rock Armour | shieldPhase: Fudo | [Rock Armour](https://naruto.fandom.com/wiki/Rock_Armour) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Sacred Paper Emissary Jutsu | Ult: Konan | [Paper Person of God Technique](https://naruto.fandom.com/wiki/Paper_Person_of_God_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Sage Art: Inorganic Animation | telegraphAoE: Kabuto Yakushi (Sage Mode) | [Sage Art: Inorganic Reincarnation](https://naruto.fandom.com/wiki/Sage_Art:_Inorganic_Reincarnation) | Verified | Narutopedia "English TV" (dub) field. |
| Sage Art: Super Tailed Beast Rasen-Shuriken | Ult: Naruto★★ | [Sage Art: Super Tailed Beast Rasenshuriken](https://naruto.fandom.com/wiki/Sage_Art:_Super_Tailed_Beast_Rasenshuriken) | Verified | Narutopedia "English TV" (dub) field. |
| Sage Art: White Extreme Attack | Jutsu: Kabuto Yakushi (Sage Mode) | [Sage Art: White Rage Technique](https://naruto.fandom.com/wiki/Sage_Art:_White_Rage_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Sage Transformation | Ult: Jugo; enrage: Jugo | [Sage Transformation](https://naruto.fandom.com/wiki/Sage_Transformation) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Sand Coffin | Jutsu: Gaara | [Sand Binding Coffin](https://naruto.fandom.com/wiki/Sand_Binding_Coffin) | Verified | Narutopedia "English TV" (dub) field. |
| Sand Shield | Ult: Gaara; shieldPhase: Gaara | [Shield of Sand](https://naruto.fandom.com/wiki/Shield_of_Sand) | Verified | Narutopedia "English TV" (dub) field. |
| Sealing Jutsu: Reaper Death Seal | Ult: Hiruzen | [Dead Demon Consuming Seal](https://naruto.fandom.com/wiki/Dead_Demon_Consuming_Seal) | Verified | Narutopedia "English TV" (dub) field. |
| Secret Jutsu: Crystal Ice Mirrors | Ult: Haku; Jutsu: Haku; Jutsu: Haku (Reanimated); Node | [Demonic Mirroring Ice Crystals](https://naruto.fandom.com/wiki/Demonic_Mirroring_Ice_Crystals) | Verified | Narutopedia "English TV" (dub) field. |
| Secret Red Move: Performance of a Hundred Puppets | Ult: Sasori; summonAdds: Sasori | [Red Secret Technique: Performance of a Hundred Puppets](https://naruto.fandom.com/wiki/Red_Secret_Technique:_Performance_of_a_Hundred_Puppets) | Verified | Narutopedia "English TV" (dub) field. |
| Secret White Move: Chikamatsu's 10 Puppets | Ult: Chiyo | [White Secret Technique: The Chikamatsu Collection of Ten Puppets](https://naruto.fandom.com/wiki/White_Secret_Technique:_The_Chikamatsu_Collection_of_Ten_Puppets) | Verified | Narutopedia "English TV" (dub) field. |
| Shadow Clone Jutsu | summonAdds: Itachi Uchiha | [Shadow Clone Technique](https://naruto.fandom.com/wiki/Shadow_Clone_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Shadow Possession Jutsu | Ult: Shikamaru | [Shadow Imitation Technique](https://naruto.fandom.com/wiki/Shadow_Imitation_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Shadow Senbon | Jutsu: Kin Tsuchi | [Shadow Senbon](https://naruto.fandom.com/wiki/Shadow_Senbon) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Shark Skin | lifesteal: Kisame Hoshigaki | [Samehada](https://naruto.fandom.com/wiki/Samehada) | Verified | Narutopedia "English TV" (dub) field. |
| Silent Killing | Jutsu: Zabuza Momochi (Reanimated) | [Silent Killing](https://naruto.fandom.com/wiki/Silent_Killing) | Verified | Narutopedia "English TV" (dub) field. |
| Six Paths of Pain | reviveOnce: Pain | [Six Paths of Pain](https://naruto.fandom.com/wiki/Six_Paths_of_Pain) | Verified | RE-CHECKED (Session 2): confirmed. No English TV field on the article, and the dub uses the same phrasing: Shippuden ep 132 dub title "In Attendance, the Six Paths of Pain" (Wikipedia, season 6). |
| Six Paths Sage Jutsu | regen: Obito Uchiha (Ten-Tails Jinchuriki); enrage: Madara Uchiha | [Six Paths Senjutsu](https://naruto.fandom.com/wiki/Six_Paths_Senjutsu) | Verified | Narutopedia "English TV" (dub) field. |
| Soft Physique Modification | Jutsu: Misumi Tsurugi | [Soft Physique Modification](https://naruto.fandom.com/wiki/Soft_Physique_Modification) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Spider Bow: Fierce Rip | Ult: Kidomaru; Jutsu: Kidomaru; Node | [Spider War Bow: Terrible Split](https://naruto.fandom.com/wiki/Spider_War_Bow:_Terrible_Split) | Verified | Narutopedia "English TV" (dub) field. |
| Sticky Water | Jutsu: Nurari | [Viscous Water Mass](https://naruto.fandom.com/wiki/Viscous_Water_Mass) | Verified | Narutopedia "English TV" (dub) field. |
| Striking Shadow Snakes | Ult: Orochimaru; telegraphAoE: Orochimaru | [Hidden Shadow Snake Hands](https://naruto.fandom.com/wiki/Hidden_Shadow_Snake_Hands) | Verified | Narutopedia "English TV" (dub) field. |
| Substitution Jutsu | reviveOnce: Kakashi Hatake | [Body Replacement Technique](https://naruto.fandom.com/wiki/Body_Replacement_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Summoning Jutsu | Ult: Jiraiya; summonAdds: Orochimaru; summonAdds: Pain (Chikushodo); summonAdds: Pain | [Summoning Technique](https://naruto.fandom.com/wiki/Summoning_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Summoning Jutsu: Rashomon | shieldPhase: Sakon and Ukon | [Summoning: Rashōmon](https://naruto.fandom.com/wiki/Summoning:_Rash%C5%8Dmon) | Verified | Narutopedia "English TV" (dub) field. |
| Summoning Jutsu: Reanimation | regen: Zabuza Momochi (Reanimated); regen: Haku (Reanimated); regen: Asuma Sarutobi (Reanimated); regen: Madara Uchiha (Reanimated) | [Summoning: Impure World Reincarnation](https://naruto.fandom.com/wiki/Summoning:_Impure_World_Reincarnation) | Verified | Narutopedia "English TV" (dub) field. |
| Supersonic Slicing Wave | Jutsu: Zaku Abumi | [Extreme Decapitating Airwaves](https://naruto.fandom.com/wiki/Extreme_Decapitating_Airwaves) | Verified | Narutopedia "English TV" (dub) field. |
| Susanoo | shieldPhase: Itachi Uchiha; shieldPhase: Sasuke Uchiha; shieldPhase: Sasuke Uchiha (Rinnegan) | [Susanoo](https://naruto.fandom.com/wiki/Susanoo) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Sword of Kusanagi | Jutsu: Orochimaru | [Sword of Kusanagi](https://naruto.fandom.com/wiki/Sword_of_Kusanagi) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Tailed Beast Bomb | Ult: Killer Bee; telegraphAoE: Three-Tails; telegraphAoE: Eight-Tails; telegraphAoE: Nine-Tails; Jutsu: Four-Tails; telegraphAoE: Obito Uchiha (Ten-Tails Jinchuriki) | [Tailed Beast Ball](https://naruto.fandom.com/wiki/Tailed_Beast_Ball) | Verified | Narutopedia "English TV" (dub) field. |
| Tailed Beast Chakra Arms | enrage: Sora; enrage: Killer Bee; enrage: Nine-Tails | [Tailed Beast Chakra Arms](https://naruto.fandom.com/wiki/Tailed_Beast_Chakra_Arms) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Tengai Shinsei | telegraphAoE: Madara Uchiha (Reanimated) | [Tengai Shinsei](https://naruto.fandom.com/wiki/Tengai_Shinsei) | Verified | Article has no separate English TV name — the dub keeps this name. |
| The Rampaging Tailed Beast | enrage: Three-Tails | [Raging Tailed Beast](https://naruto.fandom.com/wiki/Raging_Tailed_Beast) | Verified | Mechanic named after the dub title of ep 99 (Wikipedia, season 5); Narutopedia: "Raging Tailed Beast". |
| Thunder Funeral: Feast of Lightning | telegraphAoE: Raiga Kurosuki; Node | [Lightning Burial: Banquet of Lightning](https://naruto.fandom.com/wiki/Lightning_Burial:_Banquet_of_Lightning) | Verified | Narutopedia "English TV" (dub) field. |
| Transparency Jutsu | shieldPhase: Mu (Reanimated) | [Transparent Escape Technique](https://naruto.fandom.com/wiki/Transparent_Escape_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Tree Bind Death | Ult: Kurenai | [Demonic Illusion: Tree Binding Death](https://naruto.fandom.com/wiki/Demonic_Illusion:_Tree_Binding_Death) | Verified | Narutopedia "English TV" (dub) field. |
| Triple-Bladed Scythe | Jutsu: Hidan | [Triple-Bladed Scythe](https://naruto.fandom.com/wiki/Triple-Bladed_Scythe) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Truth-Seeking Ball | Jutsu: Obito Uchiha (Ten-Tails Jinchuriki); shieldPhase: Obito Uchiha (Ten-Tails Jinchuriki); Jutsu: Madara Uchiha; shieldPhase: Madara Uchiha | [Truth-Seeking Ball](https://naruto.fandom.com/wiki/Truth-Seeking_Ball) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Tsuchigumo Style: Forbidden Jutsu Release: Big Bang | telegraphAoE: Shiranami | [Tsuchigumo Style: Forbidden Life Technique Release: Creation of Heaven and Earth](https://naruto.fandom.com/wiki/Tsuchigumo_Style:_Forbidden_Life_Technique_Release:_Creation_of_Heaven_and_Earth) | Verified | Narutopedia "English TV" (dub) field. |
| Tsukuyomi | Ult: Itachi; telegraphAoE: Itachi Uchiha | [Tsukuyomi](https://naruto.fandom.com/wiki/Tsukuyomi) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Ultimate Defence: Shukaku's Shield | Ult: Kazekage | [Ultimately Hard Absolute Defence: Shield of Shukaku](https://naruto.fandom.com/wiki/Ultimately_Hard_Absolute_Defence:_Shield_of_Shukaku) | Verified | Narutopedia "English TV" (dub) field. |
| Universal Pull | Jutsu: Pain; Jutsu: Pain (Tendo); Jutsu: Nagato (Reanimated) | [Banshō Ten'in](https://naruto.fandom.com/wiki/Bansh%C5%8D_Ten'in) | Verified | Narutopedia "English TV" (dub) field. |
| Water Clone Jutsu | summonAdds: Zabuza Momochi | [Water Clone Technique](https://naruto.fandom.com/wiki/Water_Clone_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Water Prison Jutsu | Jutsu: Zabuza Momochi; Node | [Water Prison Technique](https://naruto.fandom.com/wiki/Water_Prison_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Water Prison Shark Dance Jutsu | Jutsu: Kisame Hoshigaki | [Water Prison Shark Dance Technique](https://naruto.fandom.com/wiki/Water_Prison_Shark_Dance_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Water Style: Black Rain Jutsu | Jutsu: Kagari | [Water Release: Black Rain Technique](https://naruto.fandom.com/wiki/Water_Release:_Black_Rain_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Water Style: Exploding Water Shock Wave | Jutsu: Kisame Hoshigaki | [Water Release: Exploding Water Colliding Wave](https://naruto.fandom.com/wiki/Water_Release:_Exploding_Water_Colliding_Wave) | Verified | Narutopedia "English TV" (dub) field. |
| Water Style: Great Water Arm | Ult: Suigetsu | [Water Release: Great Water Arm Technique](https://naruto.fandom.com/wiki/Water_Release:_Great_Water_Arm_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Water Style: Super Shark Bomb Jutsu | Ult: Kisame; telegraphAoE: Kisame Hoshigaki | [Water Release: Great Shark Bullet Technique](https://naruto.fandom.com/wiki/Water_Release:_Great_Shark_Bullet_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Water Style: Thousand Hungry Sharks | Jutsu: Kisame Hoshigaki | [Water Release: A Thousand Feeding Sharks](https://naruto.fandom.com/wiki/Water_Release:_A_Thousand_Feeding_Sharks) | Verified | Narutopedia "English TV" (dub) field. |
| Water Style: Water Dragon Jutsu | Ult: Zabuza; telegraphAoE: Zabuza Momochi | [Water Release: Water Dragon Bullet Technique](https://naruto.fandom.com/wiki/Water_Release:_Water_Dragon_Bullet_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Water Style: Water Shark Bomb Jutsu | Jutsu: Kisame Hoshigaki; telegraphAoE: Kisame Hoshigaki | [Water Release: Water Shark Bullet Technique](https://naruto.fandom.com/wiki/Water_Release:_Water_Shark_Bullet_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Water Style: Water Wall | shieldPhase: Tobirama Senju (Reanimated) | [Water Release: Water Formation Wall](https://naruto.fandom.com/wiki/Water_Release:_Water_Formation_Wall) | Verified | Narutopedia "English TV" (dub) field. |
| Wind Style: Air Bullet | telegraphAoE: Gaara | [Wind Release: Drilling Air Bullet](https://naruto.fandom.com/wiki/Wind_Release:_Drilling_Air_Bullet) | Verified | Narutopedia "English TV" (dub) field. |
| Wind Style: Great Breakthrough | Jutsu: Orochimaru | [Wind Release: Great Breakthrough](https://naruto.fandom.com/wiki/Wind_Release:_Great_Breakthrough) | Verified | Narutopedia "English TV" (dub) field. |
| Wind Style: Pressure Damage | Jutsu: Kakuzu | [Wind Release: Pressure Damage](https://naruto.fandom.com/wiki/Wind_Release:_Pressure_Damage) | Verified | Narutopedia "English TV" (dub) field. |
| Wind Style: Rasen Shuriken | Ult: Sage Naruto | [Wind Release: Rasenshuriken](https://naruto.fandom.com/wiki/Wind_Release:_Rasenshuriken) | Verified | Narutopedia "English TV" (dub) field. |
| Wind Style: Vacuum Bullets | telegraphAoE: Danzo Shimura | [Wind Release: Vacuum Sphere](https://naruto.fandom.com/wiki/Wind_Release:_Vacuum_Sphere) | Verified | Narutopedia "English TV" (dub) field. |
| Wood Style: Cutting Sprigs Jutsu | Ult: Obito; telegraphAoE: Obito Uchiha | [Wood Release: Cutting Technique](https://naruto.fandom.com/wiki/Wood_Release:_Cutting_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Wood Style: Deep Forest Emergence | Jutsu: Hashirama Senju (Reanimated) | [Wood Release Secret Technique: Nativity of a World of Trees](https://naruto.fandom.com/wiki/Wood_Release_Secret_Technique:_Nativity_of_a_World_of_Trees) | Verified | Narutopedia "English TV" (dub) field. |
| Wood Style: Domed Wall Jutsu | shieldPhase: Kinoe | [Wood Release: Wood Locking Wall](https://naruto.fandom.com/wiki/Wood_Release:_Wood_Locking_Wall) | Verified | Narutopedia "English TV" (dub) field. |
| Wood Style: Four Pillar House Jutsu | telegraphAoE: Kinoe | [Wood Release: Four-Pillar House Technique](https://naruto.fandom.com/wiki/Wood_Release:_Four-Pillar_House_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Wood Style: Four Pillar Prison Jutsu | Ult: Yamato; Jutsu: Yamato; Jutsu: Kinoe | [Wood Release: Four-Pillar Prison Technique](https://naruto.fandom.com/wiki/Wood_Release:_Four-Pillar_Prison_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Wood Style: Wood Clone Jutsu | summonAdds: Yamato; summonAdds: Kinoe | [Wood Clone Technique](https://naruto.fandom.com/wiki/Wood_Clone_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Wood Style: Wood Dragon Jutsu | Ult: Hashirama | [Wood Release: Wood Dragon Technique](https://naruto.fandom.com/wiki/Wood_Release:_Wood_Dragon_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Word Bind Jutsu | Jutsu: Shiranami | [Character Bind Technique](https://naruto.fandom.com/wiki/Character_Bind_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Yomotsu Hirasaka | reflect: Kaguya Otsutsuki | [Yomotsu Hirasaka](https://naruto.fandom.com/wiki/Yomotsu_Hirasaka) | Verified | Article has no separate English TV name — the dub keeps this name. |


### Arcs, nodes and banners

| Name in game | Used as | Source checked | Status | Notes |
|---|---|---|---|---|
| Akatsuki Suppression Mission | Arc | [Akatsuki Suppression Mission](https://naruto.fandom.com/wiki/Akatsuki_Suppression_Mission) | Verified |  |
| Amaterasu! | Node | [Amaterasu!](https://naruto.fandom.com/wiki/Amaterasu!) | Verified | Dub title of ep 137 (Wikipedia, Naruto: Shippuden season 6). |
| Ambush at Sea | Node | — | Descriptive | Descriptive node/banner title. |
| Art | Node | [Art](https://naruto.fandom.com/wiki/Art) | Verified | Dub title of ep 124 (Wikipedia, Naruto: Shippuden season 6). |
| Assailants From Afar | Banner | [Fourth Shinobi World War: Confrontation](https://naruto.fandom.com/wiki/Fourth_Shinobi_World_War:_Confrontation) | Verified | English season sub-title "The Fourth Great Ninja War: Assailants From Afar" (season 14), shortened. |
| Assault on the Leaf Village! | Node | [Assault on the Leaf Village!](https://naruto.fandom.com/wiki/Assault_on_the_Leaf_Village!) | Verified | Dub title of ep 157 (Wikipedia, Naruto: Shippuden season 8). |
| Banquet Invitation | Node | [Banquet Invitation](https://naruto.fandom.com/wiki/Banquet_Invitation) | Verified | Dub title of ep 134 (Wikipedia, Naruto: Shippuden season 6). |
| Battle in Paradise! Odd Beast vs. The Monster! | Node | [Battle in Paradise! Odd Beast vs. The Monster!](https://naruto.fandom.com/wiki/Battle_in_Paradise!_Odd_Beast_vs._The_Monster!) | Verified | Dub title of ep 250 (Wikipedia, Naruto: Shippuden season 12). |
| Battle of Unraikyo | Node | [Battle of Valley of Clouds and Lightning](https://naruto.fandom.com/wiki/Battle_of_Valley_of_Clouds_and_Lightning) | Verified | Dub title of ep 142 (Wikipedia, Naruto: Shippuden season 6); Narutopedia: "Battle of Valley of Clouds and Lightning". |
| Birth of the Ten-Tails' Jinchuriki | Arc | [Birth of the Ten-Tails' Jinchūriki](https://naruto.fandom.com/wiki/Birth_of_the_Ten-Tails'_Jinch%C5%ABriki) | Verified | Macron dropped. |
| Breaking the Crystal Style | Node | [Breaking the Crystal Release](https://naruto.fandom.com/wiki/Breaking_the_Crystal_Release) | Verified | Dub title of ep 104 (Wikipedia, Naruto: Shippuden season 5); Narutopedia: "Breaking the Crystal Release". |
| Chunin Exams | Arc; Banner | [Chūnin Exams (Arc)](https://naruto.fandom.com/wiki/Ch%C5%ABnin_Exams_(Arc)) | Verified | Dub spelling "Chunin". |
| Clash! | Node | [Clash!](https://naruto.fandom.com/wiki/Clash!) | Verified | Dub title of ep 123 (Wikipedia, Naruto: Shippuden season 6). |
| Climbing Silver | Node | [Climbing Silver](https://naruto.fandom.com/wiki/Climbing_Silver) | Verified | Dub title of ep 77 (Wikipedia, Naruto: Shippuden season 4). |
| Deadlock! Sannin Showdown! | Node | [Deadlock! Sannin Showdown!](https://naruto.fandom.com/wiki/Deadlock!_Sannin_Showdown!) | Verified | RE-CHECKED (Session 2): confirmed. Dub title of ep 96 (Wikipedia, Naruto season 4) matches the Narutopedia episode article. |
| Despair | Node | [Despair](https://naruto.fandom.com/wiki/Despair) | Verified | Dub title of ep 69 (Wikipedia, Naruto: Shippuden season 3). |
| Destruction of the Hidden Leaf | Banner | [Zero Hour! The Konoha Crush Begins!](https://naruto.fandom.com/wiki/Zero_Hour!_The_Konoha_Crush_Begins!) | Verified | Short form of the arc name. |
| Destruction of the Hidden Leaf Village | Arc | [Zero Hour! The Konoha Crush Begins!](https://naruto.fandom.com/wiki/Zero_Hour!_The_Konoha_Crush_Begins!) | Verified | RESOLVED (Session 3): the ep 68 dub title is "Zero Hour! The Destruction of the Hidden Leaf Village Begins!", as Session 1 recorded. Sources: Narutopedia episode article, "Other names" field; Tubi's listing of the English-dubbed episode (S02:E68, which misspells "Destuction"). Wikipedia's Naruto season 2 list gives the shorter "Zero Hour! The Destruction of Leaf Begins!" and is the outlier. The arc name is that title's wording; "Konoha Crush" is the Viz/official name. |
| Enter: Naruto Uzumaki! | Tutorial lesson | [Enter: Naruto Uzumaki!](https://naruto.fandom.com/wiki/Enter:_Naruto_Uzumaki!) | Verified | Dub title of ep 1 (Narutopedia episode article, "english" field). |
| Explode! Sage Mode | Node | [Explode! Sage Mode](https://naruto.fandom.com/wiki/Explode!_Sage_Mode) | Verified | Dub title of ep 163 (Wikipedia, Naruto: Shippuden season 8). |
| Fated Battle Between Brothers | Arc | [Fated Battle Between Brothers](https://naruto.fandom.com/wiki/Fated_Battle_Between_Brothers) | Verified |  |
| Final Valley | Node | [Valley of the End](https://naruto.fandom.com/wiki/Valley_of_the_End) | Verified | English TV name of the Valley of the End. |
| Finals: Naruto vs. Neji | Node | — | Descriptive | Descriptive node/banner title. |
| Five Kage Summit | Arc | [Five Kage Summit (Arc)](https://naruto.fandom.com/wiki/Five_Kage_Summit_(Arc)) | Verified |  |
| Forest of Death: Sound Ninja Ambush | Node | [Forest of Death](https://naruto.fandom.com/wiki/Forest_of_Death) | Descriptive | Descriptive. |
| Forest of Death: Team Oboro | Node | [Team Oboro](https://naruto.fandom.com/wiki/Team_Oboro) | Verified |  |
| Forest of Death: The Grass Ninja | Node | [Forest of Death](https://naruto.fandom.com/wiki/Forest_of_Death) | Descriptive | Descriptive; "Forest of Death" has no separate dub name. |
| Four Tails, the King of Sage Monkeys | Node | [Four-Tails, the King of Sage Monkeys](https://naruto.fandom.com/wiki/Four-Tails,_the_King_of_Sage_Monkeys) | Verified | Dub title of ep 326 (Wikipedia, Naruto: Shippuden season 15); Narutopedia: "Four-Tails, the King of Sage Monkeys". |
| Fourth Great Ninja War: Climax | Arc | [Fourth Shinobi World War: Climax](https://naruto.fandom.com/wiki/Fourth_Shinobi_World_War:_Climax) | Verified | "Fourth Great Ninja War" is the English TV name of the Fourth Shinobi World War. |
| Fourth Great Ninja War: Confrontation | Arc | [Fourth Shinobi World War: Confrontation](https://naruto.fandom.com/wiki/Fourth_Shinobi_World_War:_Confrontation) | Verified | "Fourth Great Ninja War" is the English TV name of the Fourth Shinobi World War. |
| Fourth Great Ninja War: Countdown | Arc | [Fourth Shinobi World War: Countdown](https://naruto.fandom.com/wiki/Fourth_Shinobi_World_War:_Countdown) | Verified | "Fourth Great Ninja War" is the English TV name of the Fourth Shinobi World War. |
| Funeral March for the Living | Node | [Funeral March for the Living](https://naruto.fandom.com/wiki/Funeral_March_for_the_Living) | Verified | Episode article title (ep 152). |
| Gaara and Onoki vs. Mu | Node | [The Mizukage, the Giant Clam, and the Mirage](https://naruto.fandom.com/wiki/The_Mizukage,_the_Giant_Clam,_and_the_Mirage) | Descriptive | Descriptive; the fight is in ep 300 (dub title "The Mizukage, the Giant Clam, and the Mirage", which names a different fight). |
| Golden Bonds | Node | [Golden Bonds (episode)](https://naruto.fandom.com/wiki/Golden_Bonds_(episode)) | Verified | Dub title of ep 270 (Wikipedia, Naruto: Shippuden season 12). |
| Hashirama's Cells | Node | [Hashirama's Cells](https://naruto.fandom.com/wiki/Hashirama's_Cells) | Verified | Dub title of ep 351 (Wikipedia, Naruto: Shippuden season 16). |
| Honored Sage Mode! | Node | [Honoured Sage Mode!](https://naruto.fandom.com/wiki/Honoured_Sage_Mode!) | Verified | Dub title of ep 131 (Wikipedia, Naruto: Shippuden season 6); Narutopedia: "Honoured Sage Mode!". |
| Immortal Devastators | Banner | [Akatsuki Suppression Mission](https://naruto.fandom.com/wiki/Akatsuki_Suppression_Mission) | Verified | English season sub-title "Immortal Devastators — Hidan and Kakuzu" (season 4), shortened. |
| In Attendance, the Six Paths of Pain | Node | [In Attendance, the Six Paths of Pain](https://naruto.fandom.com/wiki/In_Attendance,_the_Six_Paths_of_Pain) | Verified | Dub title of ep 132 (Wikipedia, Naruto: Shippuden season 6). |
| Infiltrate! The Village Hidden in the Rain | Node | [Infiltrate! The Village Hidden in the Rain](https://naruto.fandom.com/wiki/Infiltrate!_The_Village_Hidden_in_the_Rain) | Verified | Dub title of ep 129 (Wikipedia, Naruto: Shippuden season 6). |
| Itachi and Kisame | Node | — | Descriptive | Descriptive node/banner title. |
| Itachi Pursuit Mission | Arc | [Itachi Pursuit Mission](https://naruto.fandom.com/wiki/Itachi_Pursuit_Mission) | Verified |  |
| Jugo of the North Hideout | Node | [Jūgo of the Northern Hideout](https://naruto.fandom.com/wiki/J%C5%ABgo_of_the_Northern_Hideout) | Verified | Dub title of ep 117 (Wikipedia, Naruto: Shippuden season 6); Narutopedia: "Jūgo of the Northern Hideout". |
| Kabuto in Tanzaku Town | Node | [Tanzaku Town](https://naruto.fandom.com/wiki/Tanzaku_Town) | Descriptive | Descriptive; "Tanzaku Town" is the dub name. |
| Kaguya Otsutsuki Strikes | Arc | [Kaguya Ōtsutsuki Strikes](https://naruto.fandom.com/wiki/Kaguya_%C5%8Ctsutsuki_Strikes) | Verified | Macron dropped. |
| Kakashi Enlightened! | Node | [Kakashi Enlightened!](https://naruto.fandom.com/wiki/Kakashi_Enlightened!) | Verified | Dub title of ep 29 (Wikipedia, Naruto: Shippuden season 1). |
| Kakashi vs. Obito | Node | [Kakashi vs. Obito](https://naruto.fandom.com/wiki/Kakashi_vs._Obito) | Verified | Dub title of ep 375 (Wikipedia, Naruto: Shippuden season 18). |
| Kakashi: Shadow of the ANBU Black Ops | Arc | [Kakashi's Anbu Arc: The Shinobi That Lives in the Darkness](https://naruto.fandom.com/wiki/Kakashi's_Anbu_Arc:_The_Shinobi_That_Lives_in_the_Darkness) | Verified | Anime-only arc. English season sub-title (Wikipedia, season 16); Anbu's English TV name is "Anbu Black Ops". |
| Kakuzu's Abilities | Node | [Kakuzu's Abilities](https://naruto.fandom.com/wiki/Kakuzu's_Abilities) | Verified | Dub title of ep 84 (Wikipedia, Naruto: Shippuden season 4). |
| Kazekage Rescue | Banner | [Kazekage Rescue Mission](https://naruto.fandom.com/wiki/Kazekage_Rescue_Mission) | Verified | English season sub-title (season 1); also the anime's short arc name. |
| Kazekage Rescue Mission | Arc | [Kazekage Rescue Mission](https://naruto.fandom.com/wiki/Kazekage_Rescue_Mission) | Verified | Narutopedia arc name (the anime shortens it to "Kazekage Rescue"). |
| Killer Bee and Motoi | Node | [Killer B and Motoi (episode)](https://naruto.fandom.com/wiki/Killer_B_and_Motoi_(episode)) | Verified | Dub title of ep 244 (Wikipedia, Naruto: Shippuden season 12); Narutopedia: "Killer B and Motoi". |
| Kurosuki Family Removal Mission | Arc | [Kurosuki Family Removal Mission](https://naruto.fandom.com/wiki/Kurosuki_Family_Removal_Mission) | Verified | Anime-only (filler) arc name on Narutopedia. |
| Land of Tea | Banner | [Land of Tea](https://naruto.fandom.com/wiki/Land_of_Tea) | Verified |  |
| Land of Tea Escort Mission | Arc | [Land of Tea Escort Mission](https://naruto.fandom.com/wiki/Land_of_Tea_Escort_Mission) | Verified | Anime-only (filler) arc name on Narutopedia. |
| Land of Waves | Arc | [Land of Waves](https://naruto.fandom.com/wiki/Land_of_Waves) | Verified |  |
| Master and Student | Node | [Master and Student](https://naruto.fandom.com/wiki/Master_and_Student) | Verified | Dub title of ep 151 (Wikipedia, Naruto: Shippuden season 7). |
| Master's Prophecy and Vengeance | Banner | [Fated Battle Between Brothers](https://naruto.fandom.com/wiki/Fated_Battle_Between_Brothers) | Verified | English season sub-title (season 6). |
| Multi Shadow Clone Jutsu | Tutorial lesson | [Multiple Shadow Clone Technique](https://naruto.fandom.com/wiki/Multiple_Shadow_Clone_Technique) | Verified | Narutopedia "English TV" (dub) field; debut ep 1. Tutorial lesson 3. |
| My Friend | Node | [My Friend](https://naruto.fandom.com/wiki/My_Friend) | Verified | Dub title of ep 71 (Wikipedia, Naruto: Shippuden season 3). |
| Naruto and Sasuke | Node | [Naruto and Sasuke](https://naruto.fandom.com/wiki/Naruto_and_Sasuke) | Verified | Dub title of ep 477 (Wikipedia, Naruto: Shippuden season 21). |
| Naruto vs. Gaara | Node | — | Descriptive | Descriptive node/banner title. |
| New Team Kakashi | Banner | [Formation! New Team Kakashi!](https://naruto.fandom.com/wiki/Formation!_New_Team_Kakashi!) | Verified | From the ep 34 dub title "Formation! New Team Kakashi!". |
| Nine-Tails Taming and Karmic Encounters | Banner | [Fourth Shinobi World War: Countdown](https://naruto.fandom.com/wiki/Fourth_Shinobi_World_War:_Countdown) | Verified | English season sub-title (season 12). |
| One Thousand Years of Death | Node | [One Thousand Years of Death](https://naruto.fandom.com/wiki/One_Thousand_Years_of_Death) | Verified | Short form of the dub jutsu name. |
| Orochimaru vs. Jinchuriki | Node | [Orochimaru vs. Jinchūriki](https://naruto.fandom.com/wiki/Orochimaru_vs._Jinch%C5%ABriki) | Verified | Dub title of ep 42 (Wikipedia, Naruto: Shippuden season 2); Narutopedia: "Orochimaru vs. Jinchūriki". |
| Orochimaru's Test Subject | Node | [Orochimaru's Test Subject](https://naruto.fandom.com/wiki/Orochimaru's_Test_Subject) | Verified | Dub title of ep 353 (Wikipedia, Naruto: Shippuden season 16). |
| Pain vs. Kakashi | Node | [Pain vs. Kakashi](https://naruto.fandom.com/wiki/Pain_vs._Kakashi) | Verified | Dub title of ep 159 (Wikipedia, Naruto: Shippuden season 8). |
| Pain's Assault | Arc | [Pain's Assault (Arc)](https://naruto.fandom.com/wiki/Pain's_Assault_(Arc)) | Verified |  |
| Pass or Fail: Survival Test | Node | [Pass or Fail: Survival Test](https://naruto.fandom.com/wiki/Pass_or_Fail:_Survival_Test) | Verified | Dub title of ep 4. |
| Preliminaries: Yoroi and Misumi | Node | — | Descriptive | Descriptive node/banner title. |
| Prologue: Survival Test | Arc | [Bell Test](https://naruto.fandom.com/wiki/Bell_Test) | Verified | RE-CHECKED (Session 2): renamed from "Prologue: Bell Test" (dub-first). Dub titles of eps 4–5: "Pass or Fail: Survival Test" and "You Failed! Kakashi's Final Decision" (Wikipedia, Naruto season 1). Alternate: "Bell Test" is the Narutopedia article name. Internal ids (arc_belltest, banner_belltest, targets.bellTestMinWin) are unchanged. |
| Puppet Fight: 10 vs. 100! | Node | [Puppet Fight: 10 vs 100!](https://naruto.fandom.com/wiki/Puppet_Fight:_10_vs_100!) | Verified | Dub title of ep 26 (Wikipedia, Naruto: Shippuden season 1); Narutopedia: "Puppet Fight: 10 vs 100!". |
| Racing Lightning | Node | [Racing Lightning](https://naruto.fandom.com/wiki/Racing_Lightning) | Verified | Dub title of ep 202 (Wikipedia, Naruto: Shippuden season 10). |
| Raiga and Ranmaru | Node | — | Descriptive | Descriptive node/banner title. |
| Reinforcements from the Sand | Node | — | Descriptive | Descriptive node/banner title. |
| Revived Souls | Node | [Revived Souls](https://naruto.fandom.com/wiki/Revived_Souls) | Verified | Dub title of ep 66 (Wikipedia, Naruto: Shippuden season 3). |
| Sasuke Retrieval Squad | Arc; Banner | [Sasuke Recovery Mission](https://naruto.fandom.com/wiki/Sasuke_Recovery_Mission) | Verified | Dub title of ep 110 ("Formation! The Sasuke Retrieval Squad"). Narutopedia arc: "Sasuke Recovery Mission" — the brief used that name; changed per the dub rule. Internal id stays arc_sasuke_recovery. |
| Search for Tsunade | Arc | [Search for Tsunade](https://naruto.fandom.com/wiki/Search_for_Tsunade) | Verified |  |
| Shadow of the ANBU Black Ops | Banner | [Kakashi's Anbu Arc: The Shinobi That Lives in the Darkness](https://naruto.fandom.com/wiki/Kakashi's_Anbu_Arc:_The_Shinobi_That_Lives_in_the_Darkness) | Verified | English season sub-title "Kakashi: Shadow of the ANBU Black Ops" (season 16), shortened. |
| Shattered Promise | Node | [Shattered Promise](https://naruto.fandom.com/wiki/Shattered_Promise) | Verified | Dub title of ep 111 (Wikipedia, Naruto: Shippuden season 5). |
| She of the Beginning | Node | [She of the Beginning](https://naruto.fandom.com/wiki/She_of_the_Beginning) | Verified | Dub title of ep 459 (Wikipedia, Naruto: Shippuden season 21). |
| Shikamaru's Genius | Node | [Shikamaru's Genius](https://naruto.fandom.com/wiki/Shikamaru's_Genius) | Verified | Dub title of ep 86 (Wikipedia, Naruto: Shippuden season 4). |
| Shino vs. Kankuro | Node | — | Descriptive | Descriptive node/banner title. |
| Showdown on the Bridge | Node | — | Descriptive | Descriptive node/banner title. |
| Simulation | Node | [Simulation](https://naruto.fandom.com/wiki/Simulation) | Verified | Dub title of ep 38 (Wikipedia, Naruto: Shippuden season 2). |
| Six-Tails Unleashed | Arc | [Six-Tails Unleashed](https://naruto.fandom.com/wiki/Six-Tails_Unleashed) | Verified | Anime-only (filler) arc. |
| Standard Summon | Banner | — | Descriptive | Descriptive node/banner title. |
| Surname Is Sarutobi. Given Name, Konohamaru! | Node | [Surname is Sarutobi, Given Name, Konohamaru](https://naruto.fandom.com/wiki/Surname_is_Sarutobi,_Given_Name,_Konohamaru) | Verified | Dub title of ep 161 (Wikipedia, Naruto: Shippuden season 8); Narutopedia: "Surname is Sarutobi, Given Name, Konohamaru". |
| Taka | Banner | [Taka](https://naruto.fandom.com/wiki/Taka) | Verified | Team article; English name field "Taka". |
| Tale of Jiraiya the Gallant | Arc | [Tale of Jiraiya the Gallant](https://naruto.fandom.com/wiki/Tale_of_Jiraiya_the_Gallant) | Verified | Also the dub title of ep 133. |
| Tales of a Gutsy Ninja | Banner | [Tale of Jiraiya the Gallant](https://naruto.fandom.com/wiki/Tale_of_Jiraiya_the_Gallant) | Verified | English season sub-title "Tales of a Gutsy Ninja ~Jiraiya Ninja Scroll~" (season 6), shortened. |
| Target: Nine Tails | Node | [Target: Nine-Tails](https://naruto.fandom.com/wiki/Target:_Nine-Tails) | Verified | Dub title of ep 247 (Wikipedia, Naruto: Shippuden season 12); Narutopedia: "Target: Nine-Tails". |
| Team 7 Assembles | Banner | — | Descriptive | Descriptive node/banner title. |
| Team 7, Assemble! | Node | [Team 7, Assemble!](https://naruto.fandom.com/wiki/Team_7,_Assemble!) | Verified | Dub title of ep 373 (Wikipedia, Naruto: Shippuden season 18). |
| Tenchi Bridge Reconnaissance Mission | Arc | [Tenchi Bridge Reconnaissance Mission](https://naruto.fandom.com/wiki/Tenchi_Bridge_Reconnaissance_Mission) | Verified |  |
| The Acknowledged One | Node | [The Acknowledged One](https://naruto.fandom.com/wiki/The_Acknowledged_One) | Verified | Dub title of ep 299 (Wikipedia, Naruto: Shippuden season 14). |
| The Angelic Herald of Death | Node | [The Angelic Herald of Death](https://naruto.fandom.com/wiki/The_Angelic_Herald_of_Death) | Verified | Dub title of ep 252 (Wikipedia, Naruto: Shippuden season 12). |
| The Blue Beast vs. Six Paths Madara | Node | [The Blue Beast vs. Six Paths Madara](https://naruto.fandom.com/wiki/The_Blue_Beast_vs._Six_Paths_Madara) | Verified | Dub title of ep 418 (Wikipedia, Naruto: Shippuden season 20). |
| The Burden | Node | [The Burden](https://naruto.fandom.com/wiki/The_Burden) | Verified | Dub title of ep 214 (Wikipedia, Naruto: Shippuden season 10). |
| The Chapter of Naruto and Sasuke | Banner | [Kaguya Ōtsutsuki Strikes](https://naruto.fandom.com/wiki/Kaguya_%C5%8Ctsutsuki_Strikes) | Verified | English season sub-title (season 21). |
| The Complete Ino-Shika-Cho Formation! | Node | [The Complete Ino-Shika-Chō Formation](https://naruto.fandom.com/wiki/The_Complete_Ino-Shika-Ch%C5%8D_Formation) | Verified | Dub title of ep 274 (Wikipedia, Naruto: Shippuden season 12); Narutopedia: "The Complete Ino-Shika-Chō Formation". |
| The Demon Brothers | Node | [Demon Brothers](https://naruto.fandom.com/wiki/Demon_Brothers) | Verified |  |
| The Eight Inner Gates Formation | Node | [Eight Gates Released Formation (episode)](https://naruto.fandom.com/wiki/Eight_Gates_Released_Formation_(episode)) | Verified | Dub title of ep 420 (Wikipedia, Naruto: Shippuden season 20); Narutopedia: "Eight Gates Released Formation". |
| The Eight-Tails vs. Sasuke | Node | [The Eight-Tails vs. Sasuke](https://naruto.fandom.com/wiki/The_Eight-Tails_vs._Sasuke) | Verified | Dub title of ep 143 (Wikipedia, Naruto: Shippuden season 6). |
| The Final Battle | Node | [The Final Battle](https://naruto.fandom.com/wiki/The_Final_Battle) | Verified | Dub title of ep 476 (Wikipedia, Naruto: Shippuden season 21). |
| The Final Bell | Node | — | Descriptive | Descriptive node/banner title. |
| The First and Last Opponent | Node | [The First and Last Opponent](https://naruto.fandom.com/wiki/The_First_and_Last_Opponent) | Verified | Dub title of ep 266 (Wikipedia, Naruto: Shippuden season 12). |
| The Five Kage Assemble | Node | [The Five Kage Assemble](https://naruto.fandom.com/wiki/The_Five_Kage_Assemble) | Verified | Dub title of ep 323 (Wikipedia, Naruto: Shippuden season 15). |
| The Forbidden Jutsu Released | Node | [The Forbidden Jutsu Released](https://naruto.fandom.com/wiki/The_Forbidden_Jutsu_Released) | Verified | Dub title of ep 150 (Wikipedia, Naruto: Shippuden season 7). |
| The Gathering of the Five Kage | Banner | [Five Kage Summit (Arc)](https://naruto.fandom.com/wiki/Five_Kage_Summit_(Arc)) | Verified | English season sub-title (season 10). |
| The Izanami Activated | Node | [The Izanami Activated](https://naruto.fandom.com/wiki/The_Izanami_Activated) | Verified | Dub title of ep 337 (Wikipedia, Naruto: Shippuden season 15). |
| The Kazekage Stands Tall | Node | [The Kazekage Stands Tall](https://naruto.fandom.com/wiki/The_Kazekage_Stands_Tall) | Verified | Dub title of ep 5 (Wikipedia, Naruto: Shippuden season 1). |
| The Legendary Sannin | Banner | [Sannin](https://naruto.fandom.com/wiki/Sannin) | Verified |  |
| The Man Who Became God | Node | [The Man Who Became God](https://naruto.fandom.com/wiki/The_Man_Who_Became_God) | Verified | Dub title of ep 130 (Wikipedia, Naruto: Shippuden season 6). |
| The Power of Uchiha | Node | [The Power of the Uchiha](https://naruto.fandom.com/wiki/The_Power_of_the_Uchiha) | Verified | Dub title of ep 52 (Wikipedia, Naruto: Shippuden season 2); Narutopedia: "The Power of the Uchiha". |
| The Results of Training | Node | [The Results of Training](https://naruto.fandom.com/wiki/The_Results_of_Training) | Verified | Dub title of ep 3 (Wikipedia, Naruto: Shippuden season 1). |
| The Return of Team 7 | Banner | [Fourth Shinobi World War: Climax](https://naruto.fandom.com/wiki/Fourth_Shinobi_World_War:_Climax) | Verified | English season sub-title "The Fourth Great Ninja War: The Return of Team 7" (season 17), shortened. |
| The Sharingan Revived | Node | [The Sharingan Revived](https://naruto.fandom.com/wiki/The_Sharingan_Revived) | Verified | Dub title of ep 473 (Wikipedia, Naruto: Shippuden season 21). |
| The Six-Tailed Demon Slug | Banner | [Six-Tails Unleashed](https://naruto.fandom.com/wiki/Six-Tails_Unleashed) | Verified | English season sub-title (season 7). |
| The Successor's Wish | Node | [The Successor's Wish](https://naruto.fandom.com/wiki/The_Successor's_Wish) | Verified | Dub title of ep 146 (Wikipedia, Naruto: Shippuden season 7). |
| The Tailed Beast vs. The Tailless Tailed Beast | Node | [The Tailed Beast vs. The Tailless Tailed Beast](https://naruto.fandom.com/wiki/The_Tailed_Beast_vs._The_Tailless_Tailed_Beast) | Verified | Dub title of ep 207 (Wikipedia, Naruto: Shippuden season 10). |
| The Targeted Sharingan | Node | [The Targeted Sharingan](https://naruto.fandom.com/wiki/The_Targeted_Sharingan) | Verified | Dub title of ep 355 (Wikipedia, Naruto: Shippuden season 16). |
| The Ten Tails' Jinchuriki | Node | [The Ten-Tails' Jinchūriki (episode)](https://naruto.fandom.com/wiki/The_Ten-Tails'_Jinch%C5%ABriki_(episode)) | Verified | Dub title of ep 378 (Wikipedia, Naruto: Shippuden season 18); Narutopedia: "The Ten-Tails' Jinchūriki". |
| The Tenchi Bridge | Node | [The Tenchi Bridge (episode)](https://naruto.fandom.com/wiki/The_Tenchi_Bridge_(episode)) | Verified | Dub title of ep 39 (Wikipedia, Naruto: Shippuden season 2). |
| The Third Hokage's Last Stand | Node | — | Descriptive | Descriptive node/banner title. |
| The Three-Tailed Demon Turtle | Banner | [Three-Tails' Appearance](https://naruto.fandom.com/wiki/Three-Tails'_Appearance) | Verified | English season sub-title (season 5). |
| The Unseeing Enemy | Node | [The Unseeing Enemy](https://naruto.fandom.com/wiki/The_Unseeing_Enemy) | Verified | Dub title of ep 96 (Wikipedia, Naruto: Shippuden season 5). |
| Three-Tails' Appearance | Arc | [Three-Tails' Appearance](https://naruto.fandom.com/wiki/Three-Tails'_Appearance) | Verified | Anime-only (filler) arc. |
| Thunder of the Hidden Mist | Banner | [Raiga Kurosuki](https://naruto.fandom.com/wiki/Raiga_Kurosuki) | Verified | Raiga's epithet, from the article. |
| Transformation Jutsu | Tutorial lesson | [Transformation Technique](https://naruto.fandom.com/wiki/Transformation_Technique) | Verified | Narutopedia "English TV" (dub) field. Tutorial lesson 2: Mizuki transforms into Iruka in ep 1. |
| Traps Activate! Team Guy's Enemy | Node | [Traps Activate! Team Guy's Enemies!](https://naruto.fandom.com/wiki/Traps_Activate!_Team_Guy's_Enemies!) | Verified | Dub title of ep 19 (Wikipedia, Naruto: Shippuden season 1); Narutopedia: "Traps Activate! Team Guy's Enemies!". |
| Tsunade's Bet | Node | — | Descriptive | Descriptive node/banner title. |
| Tutorial: The Academy | Tutorial arc | [Academy](https://naruto.fandom.com/wiki/Academy) | Descriptive | Descriptive tutorial arc label. "Academy" is the article title with no separate English TV field (the dub keeps it: "the Academy"). |
| Twelve Guardian Ninja | Arc; Banner | [Twelve Guardian Ninja (Arc)](https://naruto.fandom.com/wiki/Twelve_Guardian_Ninja_(Arc)) | Verified | Anime-only (filler) arc; also the English season sub-title (Wikipedia, season 3). |
| Two Saviors | Banner | [Pain's Assault (Arc)](https://naruto.fandom.com/wiki/Pain's_Assault_(Arc)) | Verified | English season sub-title (season 8). |
| Wind Style: Rasen Shuriken! | Node | [Wind Release: Rasenshuriken!](https://naruto.fandom.com/wiki/Wind_Release:_Rasenshuriken!) | Verified | Dub title of ep 88 (Wikipedia, Naruto: Shippuden season 4); Narutopedia: "Wind Release: Rasenshuriken!". |
| Zero Hour | Node | [Zero Hour! The Konoha Crush Begins!](https://naruto.fandom.com/wiki/Zero_Hour!_The_Konoha_Crush_Begins!) | Verified | From the ep 68 dub title. |
| Zori and Waraji | Node | [Zōri](https://naruto.fandom.com/wiki/Z%C5%8Dri) | Verified |  |

<!-- NAMES:END -->
