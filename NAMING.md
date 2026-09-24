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

## Places and terms

| Term | Status | Source / note |
|---|---|---|
| Fire Style, Wind Style, Lightning Style, Earth Style, Water Style | Verified | English TV names of the five Releases |
| Ice Style, Explosion Style, Wood Style | Verified | English TV fields of Ice/Explosion/Wood Release |
| Hidden Leaf Village | Verified | Konohagakure: English TV lists "Village Hidden in the Leaves" and "Hidden Leaf Village" |
| Hidden Sand / Mist / Sound / Rain (short forms) | Partly verified | Narutopedia lists the long forms ("Village Hidden in the Sand"…). The game only uses "Sand"/"Sound"/"Mist" in descriptive labels |
| Land of Waves, Land of Tea, Tanzaku Town, Forest of Death | Verified | Articles (no separate dub names) |
| Final Valley | Verified | English TV name of the Valley of the End |
| Chunin Exams, Genin, Chunin, Jonin, Kage, Hokage | Verified | dub spellings |
| Nine-Tails | Verified (style guide) | Narutopedia's English TV name is "Nine-Tailed Fox"; the brief asks for "Nine-Tails", which the dub also uses |
| Heavens' Curse Mark | Verified | English TV name of the Cursed Seal of Heaven |
| Legendary Sannin / Sannin | Verified | Sannin article |
| Sound Four | Partly verified | Narutopedia article name, used in blurbs; the dub wording was not separately confirmed |
| Sand Siblings | Partly verified | Narutopedia: "Three Sand Siblings" (used as a leader-buff scope label) |
| Team 7, Team 8, Team 10, Team Guy, Team Oboro | Verified | articles |
| Akatsuki | Verified | article |
| Jutsu Clash, Nature Wheel | Game terms | invented for this game (see DESIGN.md) |

## All names used in the game

<!-- NAMES:START -->
_Generated by `node tools/naming.mjs --write` from the content files — 212 distinct names._

**Not verified:** none.  
**Partly verified:** Naruto Uzumaki (Nine-Tails Chakra); Six Paths of Pain; Prologue: Bell Test; Deadlock! Sannin Showdown!.

### Characters, enemies and protect targets

| Name in game | Used as | Source checked | Status | Notes |
|---|---|---|---|---|
| Aoi Rokusho | Enemy | [Aoi Rokushō](https://naruto.fandom.com/wiki/Aoi_Rokush%C5%8D) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Asuma Sarutobi | Pullable (jonin) | [Asuma Sarutobi](https://naruto.fandom.com/wiki/Asuma_Sarutobi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Choji Akimichi | Pullable (genin) | [Chōji Akimichi](https://naruto.fandom.com/wiki/Ch%C5%8Dji_Akimichi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Deidara | Enemy | [Deidara](https://naruto.fandom.com/wiki/Deidara) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Doki | Enemy | [Doki](https://naruto.fandom.com/wiki/Doki) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Dosu Kinuta | Enemy | [Dosu Kinuta](https://naruto.fandom.com/wiki/Dosu_Kinuta) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Gaara | Pullable (jonin); Enemy | [Gaara](https://naruto.fandom.com/wiki/Gaara) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Gato's Thug | Enemy | [Gatō](https://naruto.fandom.com/wiki/Gat%C5%8D) | Descriptive | Descriptive in-game label, not a canon technique name. |
| Gozu | Enemy | [Gōzu](https://naruto.fandom.com/wiki/G%C5%8Dzu) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Haku | Pullable (chunin); Enemy | [Haku](https://naruto.fandom.com/wiki/Haku) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Hashirama Senju (Reanimated) | Enemy | [Summoning: Impure World Reincarnation](https://naruto.fandom.com/wiki/Summoning:_Impure_World_Reincarnation) | Verified | "Hashirama Senju" + "(Reanimated)" from the dub "Summoning Jutsu: Reanimation". |
| Hidan | Enemy | [Hidan](https://naruto.fandom.com/wiki/Hidan) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Hinata Hyuga | Pullable (genin) | [Hinata Hyūga](https://naruto.fandom.com/wiki/Hinata_Hy%C5%ABga) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Hiruzen Sarutobi | Pullable (kage) | [Hiruzen Sarutobi](https://naruto.fandom.com/wiki/Hiruzen_Sarutobi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Idate Morino | Protect target | [Idate Morino](https://naruto.fandom.com/wiki/Idate_Morino) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Ino Yamanaka | Pullable (genin) | [Ino Yamanaka](https://naruto.fandom.com/wiki/Ino_Yamanaka) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Iruka Umino | Pullable (genin) | [Iruka Umino](https://naruto.fandom.com/wiki/Iruka_Umino) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Itachi (Shadow Clone) | Enemy | — | Descriptive | Descriptive in-game label, not a canon technique name. |
| Itachi Uchiha | Enemy | [Itachi Uchiha](https://naruto.fandom.com/wiki/Itachi_Uchiha) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Jiraiya | Pullable (kage) | [Jiraiya](https://naruto.fandom.com/wiki/Jiraiya) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Jirobo | Pullable (genin); Enemy | [Jirōbō](https://naruto.fandom.com/wiki/Jir%C5%8Db%C5%8D) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kabuto Yakushi | Pullable (jonin); Enemy | [Kabuto Yakushi](https://naruto.fandom.com/wiki/Kabuto_Yakushi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kagari | Enemy | [Kagari](https://naruto.fandom.com/wiki/Kagari) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kakashi Hatake | Pullable (jonin); Enemy | [Kakashi Hatake](https://naruto.fandom.com/wiki/Kakashi_Hatake) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kakuzu | Enemy | [Kakuzu](https://naruto.fandom.com/wiki/Kakuzu) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kankuro | Pullable (chunin); Enemy | [Kankurō](https://naruto.fandom.com/wiki/Kankur%C5%8D) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kiba Inuzuka | Pullable (genin) | [Kiba Inuzuka](https://naruto.fandom.com/wiki/Kiba_Inuzuka) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kidomaru | Pullable (chunin); Enemy | [Kidōmaru](https://naruto.fandom.com/wiki/Kid%C5%8Dmaru) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kimimaro | Pullable (jonin); Enemy | [Kimimaro](https://naruto.fandom.com/wiki/Kimimaro) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kin Tsuchi | Enemy | [Kin Tsuchi](https://naruto.fandom.com/wiki/Kin_Tsuchi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kisame Hoshigaki | Enemy | [Kisame Hoshigaki](https://naruto.fandom.com/wiki/Kisame_Hoshigaki) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kurenai Yuhi | Pullable (jonin) | [Kurenai Yūhi](https://naruto.fandom.com/wiki/Kurenai_Y%C5%ABhi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Kurosuki Family Member | Enemy | [Kurosuki Family](https://naruto.fandom.com/wiki/Kurosuki_Family) | Descriptive | Descriptive in-game label, not a canon technique name. |
| Manda | Enemy | [Manda](https://naruto.fandom.com/wiki/Manda) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Meizu | Enemy | [Meizu](https://naruto.fandom.com/wiki/Meizu) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Might Guy | Pullable (jonin) | [Might Guy](https://naruto.fandom.com/wiki/Might_Guy) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Misty Follower | Enemy | — | Descriptive | Descriptive in-game label, not a canon technique name. |
| Misumi Tsurugi | Enemy | [Misumi Tsurugi](https://naruto.fandom.com/wiki/Misumi_Tsurugi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Mubi | Enemy | [Mubi](https://naruto.fandom.com/wiki/Mubi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Naruto Uzumaki | Pullable (chunin) | [Naruto Uzumaki](https://naruto.fandom.com/wiki/Naruto_Uzumaki) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Naruto Uzumaki (Nine-Tails Chakra) | Pullable (jonin) | [Kurama](https://naruto.fandom.com/wiki/Kurama) | Partly verified | Alternate-form label. "Nine-Tails" per the style guide; Narutopedia's English TV name for the fox is "Nine-Tailed Fox" — both are dub-acceptable. |
| Neji Hyuga | Pullable (chunin); Enemy | [Neji Hyūga](https://naruto.fandom.com/wiki/Neji_Hy%C5%ABga) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Oboro | Enemy | [Oboro](https://naruto.fandom.com/wiki/Oboro) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Orochimaru | Pullable (kage); Enemy | [Orochimaru](https://naruto.fandom.com/wiki/Orochimaru) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Pain | Enemy | [Nagato](https://naruto.fandom.com/wiki/Nagato) | Verified | Narutopedia redirects "Pain" to Nagato; "Pain" is the name the dub uses for him in battle. |
| Puppet | Enemy | — | Descriptive | Descriptive in-game label, not a canon technique name. |
| Raiga Kurosuki | Enemy | [Raiga Kurosuki](https://naruto.fandom.com/wiki/Raiga_Kurosuki) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Ranmaru | Enemy | [Ranmaru](https://naruto.fandom.com/wiki/Ranmaru) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Rock Lee | Pullable (chunin) | [Rock Lee](https://naruto.fandom.com/wiki/Rock_Lee) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Rokusuke | Protect target | [Rokusuke](https://naruto.fandom.com/wiki/Rokusuke) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Sakon and Ukon | Pullable (chunin); Enemy | [Sakon and Ukon](https://naruto.fandom.com/wiki/Sakon_and_Ukon) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Sakura Haruno | Pullable (genin) | [Sakura Haruno](https://naruto.fandom.com/wiki/Sakura_Haruno) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Sand Ninja | Enemy | — | Descriptive | Descriptive in-game label, not a canon technique name. |
| Sasori | Enemy | [Sasori](https://naruto.fandom.com/wiki/Sasori) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Sasuke Uchiha | Pullable (chunin) | [Sasuke Uchiha](https://naruto.fandom.com/wiki/Sasuke_Uchiha) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Sasuke Uchiha (Heavens' Curse Mark) | Pullable (jonin); Enemy | [Cursed Seal of Heaven](https://naruto.fandom.com/wiki/Cursed_Seal_of_Heaven) | Verified | Form label; "Heavens' Curse Mark" is the English TV name. |
| Shikamaru Nara | Pullable (chunin) | [Shikamaru Nara](https://naruto.fandom.com/wiki/Shikamaru_Nara) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Shino Aburame | Pullable (genin) | [Shino Aburame](https://naruto.fandom.com/wiki/Shino_Aburame) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Shizune | Pullable (chunin) | [Shizune](https://naruto.fandom.com/wiki/Shizune) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Sound Ninja | Enemy | — | Descriptive | Descriptive in-game label, not a canon technique name. |
| Tayuya | Pullable (chunin); Enemy | [Tayuya](https://naruto.fandom.com/wiki/Tayuya) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Tazuna | Protect target | [Tazuna](https://naruto.fandom.com/wiki/Tazuna) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Temari | Pullable (chunin); Enemy | [Temari](https://naruto.fandom.com/wiki/Temari) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Tenten | Pullable (genin) | [Tenten](https://naruto.fandom.com/wiki/Tenten) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Tobirama Senju (Reanimated) | Enemy | [Summoning: Impure World Reincarnation](https://naruto.fandom.com/wiki/Summoning:_Impure_World_Reincarnation) | Verified | "Tobirama Senju" + "(Reanimated)" (see above). |
| Tsunade | Pullable (kage); Enemy | [Tsunade](https://naruto.fandom.com/wiki/Tsunade) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Tsunami | Protect target | [Tsunami](https://naruto.fandom.com/wiki/Tsunami) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Ukon | Enemy | [Sakon and Ukon](https://naruto.fandom.com/wiki/Sakon_and_Ukon) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Waraji | Enemy | [Waraji](https://naruto.fandom.com/wiki/Waraji) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Water Clone | Enemy | — | Descriptive | Descriptive in-game label, not a canon technique name. |
| Yoroi Akado | Enemy | [Yoroi Akadō](https://naruto.fandom.com/wiki/Yoroi_Akad%C5%8D) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Zabuza Momochi | Pullable (jonin); Enemy | [Zabuza Momochi](https://naruto.fandom.com/wiki/Zabuza_Momochi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Zaku Abumi | Enemy | [Zaku Abumi](https://naruto.fandom.com/wiki/Zaku_Abumi) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |
| Zori | Enemy | [Zōri](https://naruto.fandom.com/wiki/Z%C5%8Dri) | Verified | Article title; the dub spelling drops macrons (romanization convention, not a separate dub field). |


### Jutsu, Ultimates and boss-mechanic names

| Name in game | Used as | Source checked | Status | Notes |
|---|---|---|---|---|
| Almighty Push | telegraphAoE: Pain | [Shinra Tensei](https://naruto.fandom.com/wiki/Shinra_Tensei) | Verified | Narutopedia "English TV" (dub) field. |
| Amaterasu | telegraphAoE: Itachi Uchiha | [Amaterasu](https://naruto.fandom.com/wiki/Amaterasu) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Blade of the Thunder Spirit | elementSwap: Aoi Rokusho; telegraphAoE: Aoi Rokusho; Node | [Sword of the Thunder God](https://naruto.fandom.com/wiki/Sword_of_the_Thunder_God) | Verified | Narutopedia "English TV" (dub) field. |
| Bracken Dance | Ult: Kimimaro; telegraphAoE: Kimimaro; Node | [Dance of the Seedling Fern](https://naruto.fandom.com/wiki/Dance_of_the_Seedling_Fern) | Verified | Narutopedia "English TV" (dub) field. |
| C3 | telegraphAoE: Deidara | [C3](https://naruto.fandom.com/wiki/C3) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Chakra absorption | lifesteal: Yoroi Akado; lifesteal: Jirobo | [Yoroi Akadō](https://naruto.fandom.com/wiki/Yoroi_Akad%C5%8D) | Descriptive | Descriptive: Yoroi's Part 1 chakra drain is unnamed on Narutopedia. |
| Chakra Scalpel | Ult: Kabuto; Jutsu: Kabuto Yakushi | [Chakra Scalpel](https://naruto.fandom.com/wiki/Chakra_Scalpel) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Chidori | Ult: Sasuke; Ult: Sasuke★; telegraphAoE: Sasuke Uchiha (Heavens' Curse Mark) | [Chidori](https://naruto.fandom.com/wiki/Chidori) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Clematis Dance: Flower | Jutsu: Kimimaro | [Dance of the Clematis: Flower](https://naruto.fandom.com/wiki/Dance_of_the_Clematis:_Flower) | Verified | Narutopedia "English TV" (dub) field. |
| Coiling Around | Jutsu: Manda | [Coiling Around](https://naruto.fandom.com/wiki/Coiling_Around) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Curse Jutsu | telegraphAoE: Hidan | [Curse Technique: Death Controlling Possessed Blood](https://naruto.fandom.com/wiki/Curse_Technique:_Death_Controlling_Possessed_Blood) | Verified | Narutopedia "English TV" (dub) field. |
| Demon Flute: Chains of Fantasia | Ult: Tayuya; Jutsu: Tayuya | [Demonic Flute: Phantom Sound Chains](https://naruto.fandom.com/wiki/Demonic_Flute:_Phantom_Sound_Chains) | Verified | Narutopedia "English TV" (dub) field. |
| Demon Flute: Trio Requiem | summonAdds: Tayuya | [Demonic Flute: Illusionary Warriors Manipulating Melody](https://naruto.fandom.com/wiki/Demonic_Flute:_Illusionary_Warriors_Manipulating_Melody) | Verified | English TV name of "Demonic Flute: Illusionary Warriors Manipulating Melody" (Doki control, anime ep 120). A separate game-only jutsu shares the name. |
| Demon of the Hidden Mist | enrage: Zabuza Momochi; Banner | [Zabuza Momochi](https://naruto.fandom.com/wiki/Zabuza_Momochi) | Verified | Zabuza's epithet, from the article's English name field. |
| Demon Twin Jutsu | summonAdds: Sakon and Ukon | [Attack of the Twin Demons](https://naruto.fandom.com/wiki/Attack_of_the_Twin_Demons) | Verified | Narutopedia "English TV" (dub) field. |
| Demonic Illusion: Death Mirage Jutsu | Ult: Iruka; telegraphAoE: Kakashi Hatake | [Demonic Illusion: Hell Viewing Technique](https://naruto.fandom.com/wiki/Demonic_Illusion:_Hell_Viewing_Technique) | Verified | Narutopedia "English TV" field; Kakashi uses it in ep 5, Iruka in ep 21 (per the Iruka Umino article). |
| Dynamic Entry | Ult: Guy | [Dynamic Entry](https://naruto.fandom.com/wiki/Dynamic_Entry) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Earth Grudge | elementSwap: Kakuzu; reviveOnce: Kakuzu | [Earth Grudge Fear](https://naruto.fandom.com/wiki/Earth_Grudge_Fear) | Verified | Narutopedia "English TV" (dub) field. |
| Earth Style Barrier: Earth Dome Prison | Ult: Jirobo; Jutsu: Jirobo; Node | [Earth Release Barrier: Earth Prison Dome of Magnificent Nothingness](https://naruto.fandom.com/wiki/Earth_Release_Barrier:_Earth_Prison_Dome_of_Magnificent_Nothingness) | Verified | Narutopedia "English TV" (dub) field. |
| Earth Style: Headhunter Jutsu | Jutsu: Kakashi Hatake | [Earth Release: Double Suicide Decapitation Technique](https://naruto.fandom.com/wiki/Earth_Release:_Double_Suicide_Decapitation_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Earth Style: Underground Move Jutsu | Jutsu: Mubi | [Earth Release: Underground Projection Fish Technique](https://naruto.fandom.com/wiki/Earth_Release:_Underground_Projection_Fish_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Eight Trigrams: Palm Rotation | reflect: Neji Hyuga | [Eight Trigrams Palms Revolving Heaven](https://naruto.fandom.com/wiki/Eight_Trigrams_Palms_Revolving_Heaven) | Verified | Narutopedia "English TV" (dub) field. |
| Explosion Style | elementSwap: Deidara | [Explosion Release](https://naruto.fandom.com/wiki/Explosion_Release) | Verified | Narutopedia "English TV" (dub) field. |
| Fire Style: Phoenix Flower Jutsu | Jutsu: Sasuke Uchiha (Heavens' Curse Mark) | [Fire Release: Phoenix Sage Fire Technique](https://naruto.fandom.com/wiki/Fire_Release:_Phoenix_Sage_Fire_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Fire Style: Searing Migraine | telegraphAoE: Kakuzu | [Fire Release: Intelligent Hard Work](https://naruto.fandom.com/wiki/Fire_Release:_Intelligent_Hard_Work) | Verified | Narutopedia "English TV" (dub) field. |
| Flying Swallow | Ult: Asuma | [Flying Swallow](https://naruto.fandom.com/wiki/Flying_Swallow) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Gentle Fist | Jutsu: Neji Hyuga | [Gentle Fist](https://naruto.fandom.com/wiki/Gentle_Fist) | Verified | Narutopedia "English TV" (dub) field. |
| Gentle Fist Art: Eight Trigrams Sixty-Four Palms | Ult: Neji; telegraphAoE: Neji Hyuga | [Eight Trigrams Sixty-Four Palms](https://naruto.fandom.com/wiki/Eight_Trigrams_Sixty-Four_Palms) | Verified | Narutopedia "English TV" (dub) field. |
| Healing Jutsu | Ult: Sakura; regen: Kabuto Yakushi | [Mystical Palm Technique](https://naruto.fandom.com/wiki/Mystical_Palm_Technique) | Verified | Narutopedia "English TV" field. Sakura is a listed user but first uses it in Part II; used for her Part 1 form because she has no Part 1 signature technique. Kabuto uses it in Part 1 (debut ep 36). |
| Heaven Kick of Pain | Jutsu: Tsunade | [Heavenly Foot of Pain](https://naruto.fandom.com/wiki/Heavenly_Foot_of_Pain) | Verified | Narutopedia "English TV" (dub) field. |
| Heavens' Curse Mark | enrage: Kimimaro; reviveOnce: Sasuke Uchiha (Heavens' Curse Mark) | [Cursed Seal of Heaven](https://naruto.fandom.com/wiki/Cursed_Seal_of_Heaven) | Verified | Narutopedia "English TV" (dub) field. |
| Human Boulder | Ult: Choji | [Human Bullet Tank](https://naruto.fandom.com/wiki/Human_Bullet_Tank) | Verified | Narutopedia "English TV" (dub) field. |
| Iaido | Jutsu: Zori; Jutsu: Waraji | [Iaidō](https://naruto.fandom.com/wiki/Iaid%C5%8D) | Verified | No separate English TV name; macron dropped. |
| Ice Style | elementSwap: Haku | [Ice Release](https://naruto.fandom.com/wiki/Ice_Release) | Verified | Narutopedia "English TV" (dub) field. |
| Immortality | reviveOnce: Hidan | [Hidan](https://naruto.fandom.com/wiki/Hidan) | Descriptive | Descriptive in-game label, not a canon technique name. |
| Iron Sand: World Order | telegraphAoE: Sasori | [Iron Sand World Method](https://naruto.fandom.com/wiki/Iron_Sand_World_Method) | Verified | Narutopedia "English TV" (dub) field. |
| Kurosuki Family ambush | summonAdds: Raiga Kurosuki | — | Descriptive | Descriptive in-game label, not a canon technique name. |
| Larch Dance | reflect: Kimimaro | [Dance of the Larch](https://naruto.fandom.com/wiki/Dance_of_the_Larch) | Verified | Narutopedia "English TV" (dub) field. |
| Leaf Village Secret Finger Jutsu: One Thousand Years of Death | Jutsu: Kakashi Hatake | [One Thousand Years of Death](https://naruto.fandom.com/wiki/One_Thousand_Years_of_Death) | Verified | Narutopedia "English TV" (dub) field. |
| Lightning Blade | Ult: Kakashi | [Lightning Cutter](https://naruto.fandom.com/wiki/Lightning_Cutter) | Verified | Narutopedia "English TV" (dub) field. |
| Man-Beast Ultimate Taijutsu: Fang Over Fang | Ult: Kiba | [Fang Passing Fang](https://naruto.fandom.com/wiki/Fang_Passing_Fang) | Verified | Narutopedia "English TV" (dub) field. |
| Misty Follower Jutsu | summonAdds: Oboro | [Mist Servant Technique](https://naruto.fandom.com/wiki/Mist_Servant_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Multiple Fists Barrage | Ult: Sakon; Jutsu: Sakon and Ukon | [Multiple Connected Fists](https://naruto.fandom.com/wiki/Multiple_Connected_Fists) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Black Tornado | Jutsu: Kurosuki Family Member | [Black Tornado](https://naruto.fandom.com/wiki/Black_Tornado) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Hidden Mist Jutsu | shieldPhase: Zabuza Momochi; shieldPhase: Raiga Kurosuki | [Hiding in Mist Technique](https://naruto.fandom.com/wiki/Hiding_in_Mist_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Lightning Ball | Jutsu: Raiga Kurosuki | [Lightning Ball](https://naruto.fandom.com/wiki/Lightning_Ball) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Lightning Fangs | Jutsu: Raiga Kurosuki | [Fangs of Lightning](https://naruto.fandom.com/wiki/Fangs_of_Lightning) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Mind Transfer Jutsu | Ult: Ino | [Mind Body Switch Technique](https://naruto.fandom.com/wiki/Mind_Body_Switch_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Mitotic Regeneration | Ult: Tsunade | [Creation Rebirth](https://naruto.fandom.com/wiki/Creation_Rebirth) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Poison Fog | Ult: Shizune | [Poison Mist](https://naruto.fandom.com/wiki/Poison_Mist) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Senbon Rainstorm | Jutsu: Aoi Rokusho; Node | [Senbon Shower](https://naruto.fandom.com/wiki/Senbon_Shower) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Thunder Armour | enrage: Raiga Kurosuki | [Lightning Strike Armour](https://naruto.fandom.com/wiki/Lightning_Strike_Armour) | Verified | Narutopedia "English TV" (dub) field. |
| Ninja Art: Wind Scythe Jutsu | Ult: Temari; Jutsu: Temari | [Sickle Weasel Technique](https://naruto.fandom.com/wiki/Sickle_Weasel_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Parasitic Insects Jutsu | Ult: Shino | [Parasitic Destruction Insect Technique](https://naruto.fandom.com/wiki/Parasitic_Destruction_Insect_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Play Possum Jutsu | enrage: Gaara | [Feigning Sleep Technique](https://naruto.fandom.com/wiki/Feigning_Sleep_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Primary Lotus | Ult: Lee | [Front Lotus](https://naruto.fandom.com/wiki/Front_Lotus) | Verified | Narutopedia "English TV" (dub) field. |
| Protective Eight Trigrams Sixty-Four Palms | Ult: Hinata | [Protecting Eight Trigrams Sixty-Four Palms](https://naruto.fandom.com/wiki/Protecting_Eight_Trigrams_Sixty-Four_Palms) | Verified | Narutopedia "English TV" (dub) field. |
| Puppet Master Jutsu | Ult: Kankuro; Jutsu: Kankuro | [Puppet Technique](https://naruto.fandom.com/wiki/Puppet_Technique) | Verified | Narutopedia "English TV" field (Kankuro, ep 41). Used as his Tank ult (the puppet draws attacks). |
| Ranmaru's eyes guide Raiga | rally: Ranmaru | — | Descriptive | Descriptive in-game label, not a canon technique name. |
| Rasengan | Ult: Naruto; Ult: Naruto★ | [Rasengan](https://naruto.fandom.com/wiki/Rasengan) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Resonating Echo Drill | Jutsu: Dosu Kinuta | [Resonating Echo Drill](https://naruto.fandom.com/wiki/Resonating_Echo_Drill) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Rising Twin Dragons | Ult: Tenten | [Twin Rising Dragons](https://naruto.fandom.com/wiki/Twin_Rising_Dragons) | Verified | Narutopedia "English TV" (dub) field. |
| Sand Coffin | Jutsu: Gaara | [Sand Binding Coffin](https://naruto.fandom.com/wiki/Sand_Binding_Coffin) | Verified | Narutopedia "English TV" (dub) field. |
| Sand Shield | Ult: Gaara; shieldPhase: Gaara | [Shield of Sand](https://naruto.fandom.com/wiki/Shield_of_Sand) | Verified | Narutopedia "English TV" (dub) field. |
| Sealing Jutsu: Reaper Death Seal | Ult: Hiruzen | [Dead Demon Consuming Seal](https://naruto.fandom.com/wiki/Dead_Demon_Consuming_Seal) | Verified | Narutopedia "English TV" (dub) field. |
| Secret Jutsu: Crystal Ice Mirrors | Ult: Haku; Jutsu: Haku; Node | [Demonic Mirroring Ice Crystals](https://naruto.fandom.com/wiki/Demonic_Mirroring_Ice_Crystals) | Verified | Narutopedia "English TV" (dub) field. |
| Secret Red Move: Performance of a Hundred Puppets | summonAdds: Sasori | [Red Secret Technique: Performance of a Hundred Puppets](https://naruto.fandom.com/wiki/Red_Secret_Technique:_Performance_of_a_Hundred_Puppets) | Verified | Narutopedia "English TV" (dub) field. |
| Shadow Clone Jutsu | summonAdds: Itachi Uchiha | [Shadow Clone Technique](https://naruto.fandom.com/wiki/Shadow_Clone_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Shadow Possession Jutsu | Ult: Shikamaru | [Shadow Imitation Technique](https://naruto.fandom.com/wiki/Shadow_Imitation_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Shadow Senbon | Jutsu: Kin Tsuchi | [Shadow Senbon](https://naruto.fandom.com/wiki/Shadow_Senbon) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Shark Skin | lifesteal: Kisame Hoshigaki | [Samehada](https://naruto.fandom.com/wiki/Samehada) | Verified | Narutopedia "English TV" (dub) field. |
| Six Paths of Pain | reviveOnce: Pain | [Six Paths of Pain](https://naruto.fandom.com/wiki/Six_Paths_of_Pain) | Partly verified | Narutopedia article title; no English TV field found — assumed unchanged in the dub. |
| Soft Physique Modification | Jutsu: Misumi Tsurugi | [Soft Physique Modification](https://naruto.fandom.com/wiki/Soft_Physique_Modification) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Spider Bow: Fierce Rip | Ult: Kidomaru; Jutsu: Kidomaru; Node | [Spider War Bow: Terrible Split](https://naruto.fandom.com/wiki/Spider_War_Bow:_Terrible_Split) | Verified | Narutopedia "English TV" (dub) field. |
| Striking Shadow Snakes | Ult: Orochimaru; telegraphAoE: Orochimaru | [Hidden Shadow Snake Hands](https://naruto.fandom.com/wiki/Hidden_Shadow_Snake_Hands) | Verified | Narutopedia "English TV" (dub) field. |
| Substitution Jutsu | reviveOnce: Kakashi Hatake | [Body Replacement Technique](https://naruto.fandom.com/wiki/Body_Replacement_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Summoning Jutsu | Ult: Jiraiya; summonAdds: Orochimaru | [Summoning Technique](https://naruto.fandom.com/wiki/Summoning_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Summoning Jutsu: Rashomon | shieldPhase: Sakon and Ukon | [Summoning: Rashōmon](https://naruto.fandom.com/wiki/Summoning:_Rash%C5%8Dmon) | Verified | Narutopedia "English TV" (dub) field. |
| Supersonic Slicing Wave | Jutsu: Zaku Abumi | [Extreme Decapitating Airwaves](https://naruto.fandom.com/wiki/Extreme_Decapitating_Airwaves) | Verified | Narutopedia "English TV" (dub) field. |
| Thunder Funeral: Feast of Lightning | telegraphAoE: Raiga Kurosuki; Node | [Lightning Burial: Banquet of Lightning](https://naruto.fandom.com/wiki/Lightning_Burial:_Banquet_of_Lightning) | Verified | Narutopedia "English TV" (dub) field. |
| Tree Bind Death | Ult: Kurenai | [Demonic Illusion: Tree Binding Death](https://naruto.fandom.com/wiki/Demonic_Illusion:_Tree_Binding_Death) | Verified | Narutopedia "English TV" (dub) field. |
| Tsukuyomi | telegraphAoE: Itachi Uchiha | [Tsukuyomi](https://naruto.fandom.com/wiki/Tsukuyomi) | Verified | Article has no separate English TV name — the dub keeps this name. |
| Water Clone Jutsu | summonAdds: Zabuza Momochi | [Water Clone Technique](https://naruto.fandom.com/wiki/Water_Clone_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Water Prison Jutsu | Jutsu: Zabuza Momochi; Node | [Water Prison Technique](https://naruto.fandom.com/wiki/Water_Prison_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Water Style: Black Rain Jutsu | Jutsu: Kagari | [Water Release: Black Rain Technique](https://naruto.fandom.com/wiki/Water_Release:_Black_Rain_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Water Style: Water Dragon Jutsu | Ult: Zabuza; telegraphAoE: Zabuza Momochi | [Water Release: Water Dragon Bullet Technique](https://naruto.fandom.com/wiki/Water_Release:_Water_Dragon_Bullet_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Water Style: Water Shark Bomb Jutsu | Jutsu: Kisame Hoshigaki; telegraphAoE: Kisame Hoshigaki | [Water Release: Water Shark Bullet Technique](https://naruto.fandom.com/wiki/Water_Release:_Water_Shark_Bullet_Technique) | Verified | Narutopedia "English TV" (dub) field. |
| Water Style: Water Wall | shieldPhase: Tobirama Senju (Reanimated) | [Water Release: Water Formation Wall](https://naruto.fandom.com/wiki/Water_Release:_Water_Formation_Wall) | Verified | Narutopedia "English TV" (dub) field. |
| Wind Style: Air Bullet | telegraphAoE: Gaara | [Wind Release: Drilling Air Bullet](https://naruto.fandom.com/wiki/Wind_Release:_Drilling_Air_Bullet) | Verified | Narutopedia "English TV" (dub) field. |
| Wind Style: Great Breakthrough | Jutsu: Orochimaru | [Wind Release: Great Breakthrough](https://naruto.fandom.com/wiki/Wind_Release:_Great_Breakthrough) | Verified | Narutopedia "English TV" (dub) field. |
| Wood Style: Deep Forest Emergence | Jutsu: Hashirama Senju (Reanimated) | [Wood Release Secret Technique: Nativity of a World of Trees](https://naruto.fandom.com/wiki/Wood_Release_Secret_Technique:_Nativity_of_a_World_of_Trees) | Verified | Narutopedia "English TV" (dub) field. |


### Arcs, nodes and banners

| Name in game | Used as | Source checked | Status | Notes |
|---|---|---|---|---|
| Akatsuki Suppression Mission | Part II placeholder | [Plot of Naruto](https://naruto.fandom.com/wiki/Plot_of_Naruto) | Verified | Part II placeholder — Narutopedia arc name, anime order. |
| Ambush at Sea | Node | — | Descriptive | Descriptive node/banner title. |
| Chunin Exams | Arc; Banner | [Chūnin Exams (Arc)](https://naruto.fandom.com/wiki/Ch%C5%ABnin_Exams_(Arc)) | Verified | Dub spelling "Chunin". |
| Deadlock! Sannin Showdown! | Node | [Deadlock! Sannin Showdown!](https://naruto.fandom.com/wiki/Deadlock!_Sannin_Showdown!) | Partly verified | Episode article title (ep 96); the dub title was not separately confirmed. |
| Destruction of the Hidden Leaf | Banner | [Zero Hour! The Konoha Crush Begins!](https://naruto.fandom.com/wiki/Zero_Hour!_The_Konoha_Crush_Begins!) | Verified | Short form of the arc name. |
| Destruction of the Hidden Leaf Village | Arc | [Zero Hour! The Konoha Crush Begins!](https://naruto.fandom.com/wiki/Zero_Hour!_The_Konoha_Crush_Begins!) | Verified | Dub title of ep 68 ("Zero Hour! The Destruction of the Hidden Leaf Village Begins!"). Narutopedia/Viz call the arc "Konoha Crush"; the brief used that name — changed per the dub rule. |
| Fated Battle Between Brothers | Part II placeholder | [Plot of Naruto](https://naruto.fandom.com/wiki/Plot_of_Naruto) | Verified | Part II placeholder — Narutopedia arc name, anime order. |
| Final Valley | Node | [Valley of the End](https://naruto.fandom.com/wiki/Valley_of_the_End) | Verified | English TV name of the Valley of the End. |
| Finals: Naruto vs. Neji | Node | — | Descriptive | Descriptive node/banner title. |
| Five Kage Summit | Part II placeholder | [Plot of Naruto](https://naruto.fandom.com/wiki/Plot_of_Naruto) | Verified | Part II placeholder — Narutopedia arc name, anime order. |
| Forest of Death: Sound Ninja Ambush | Node | [Forest of Death](https://naruto.fandom.com/wiki/Forest_of_Death) | Descriptive | Descriptive. |
| Forest of Death: Team Oboro | Node | [Team Oboro](https://naruto.fandom.com/wiki/Team_Oboro) | Verified |  |
| Forest of Death: The Grass Ninja | Node | [Forest of Death](https://naruto.fandom.com/wiki/Forest_of_Death) | Descriptive | Descriptive; "Forest of Death" has no separate dub name. |
| Fourth Great Ninja War | Part II placeholder | [Fourth Shinobi World War](https://naruto.fandom.com/wiki/Fourth_Shinobi_World_War) | Verified | English TV name of the Fourth Shinobi World War (one placeholder for its arcs). |
| Funeral March for the Living | Node | [Funeral March for the Living](https://naruto.fandom.com/wiki/Funeral_March_for_the_Living) | Verified | Episode article title (ep 152). |
| Itachi and Kisame | Node | — | Descriptive | Descriptive node/banner title. |
| Itachi Pursuit Mission | Part II placeholder | [Plot of Naruto](https://naruto.fandom.com/wiki/Plot_of_Naruto) | Verified | Part II placeholder — Narutopedia arc name, anime order. |
| Kabuto in Tanzaku Town | Node | [Tanzaku Town](https://naruto.fandom.com/wiki/Tanzaku_Town) | Descriptive | Descriptive; "Tanzaku Town" is the dub name. |
| Kazekage Rescue Mission | Part II placeholder | [Plot of Naruto](https://naruto.fandom.com/wiki/Plot_of_Naruto) | Verified | Part II placeholder — Narutopedia arc name, anime order. |
| Kurosuki Family Removal Mission | Arc | [Kurosuki Family Removal Mission](https://naruto.fandom.com/wiki/Kurosuki_Family_Removal_Mission) | Verified | Anime-only (filler) arc name on Narutopedia. |
| Land of Tea | Banner | [Land of Tea](https://naruto.fandom.com/wiki/Land_of_Tea) | Verified |  |
| Land of Tea Escort Mission | Arc | [Land of Tea Escort Mission](https://naruto.fandom.com/wiki/Land_of_Tea_Escort_Mission) | Verified | Anime-only (filler) arc name on Narutopedia. |
| Land of Waves | Arc | [Land of Waves](https://naruto.fandom.com/wiki/Land_of_Waves) | Verified |  |
| Naruto vs. Gaara | Node | — | Descriptive | Descriptive node/banner title. |
| One Thousand Years of Death | Node | [One Thousand Years of Death](https://naruto.fandom.com/wiki/One_Thousand_Years_of_Death) | Verified | Short form of the dub jutsu name. |
| Pain's Assault | Part II placeholder | [Plot of Naruto](https://naruto.fandom.com/wiki/Plot_of_Naruto) | Verified | Part II placeholder — Narutopedia arc name, anime order. |
| Pass or Fail: Survival Test | Node | [Pass or Fail: Survival Test](https://naruto.fandom.com/wiki/Pass_or_Fail:_Survival_Test) | Verified | Dub title of ep 4. |
| Preliminaries: Yoroi and Misumi | Node | — | Descriptive | Descriptive node/banner title. |
| Prologue: Bell Test | Arc | [Bell Test](https://naruto.fandom.com/wiki/Bell_Test) | Partly verified | Narutopedia article "Bell Test" (inside "Prologue — Land of Waves", eps 4–5). The ep 4 dub title calls it the "Survival Test"; the name is kept from the design brief. |
| Raiga and Ranmaru | Node | — | Descriptive | Descriptive node/banner title. |
| Reinforcements from the Sand | Node | — | Descriptive | Descriptive node/banner title. |
| Sasuke Retrieval Squad | Arc; Banner | [Sasuke Recovery Mission](https://naruto.fandom.com/wiki/Sasuke_Recovery_Mission) | Verified | Dub title of ep 110 ("Formation! The Sasuke Retrieval Squad"). Narutopedia arc: "Sasuke Recovery Mission" — the brief used that name; changed per the dub rule. Internal id stays arc_sasuke_recovery. |
| Search for Tsunade | Arc | [Search for Tsunade](https://naruto.fandom.com/wiki/Search_for_Tsunade) | Verified |  |
| Shino vs. Kankuro | Node | — | Descriptive | Descriptive node/banner title. |
| Showdown on the Bridge | Node | — | Descriptive | Descriptive node/banner title. |
| Standard Summon | Banner | — | Descriptive | Descriptive node/banner title. |
| Tale of Jiraiya the Gallant | Part II placeholder | [Plot of Naruto](https://naruto.fandom.com/wiki/Plot_of_Naruto) | Verified | Part II placeholder — Narutopedia arc name, anime order. |
| Team 7 Assembles | Banner | — | Descriptive | Descriptive node/banner title. |
| Tenchi Bridge Reconnaissance Mission | Part II placeholder | [Plot of Naruto](https://naruto.fandom.com/wiki/Plot_of_Naruto) | Verified | Part II placeholder — Narutopedia arc name, anime order. |
| The Demon Brothers | Node | [Demon Brothers](https://naruto.fandom.com/wiki/Demon_Brothers) | Verified |  |
| The Final Bell | Node | — | Descriptive | Descriptive node/banner title. |
| The Legendary Sannin | Banner | [Sannin](https://naruto.fandom.com/wiki/Sannin) | Verified |  |
| The Third Hokage's Last Stand | Node | — | Descriptive | Descriptive node/banner title. |
| Thunder of the Hidden Mist | Banner | [Raiga Kurosuki](https://naruto.fandom.com/wiki/Raiga_Kurosuki) | Verified | Raiga's epithet, from the article. |
| Tsunade's Bet | Node | — | Descriptive | Descriptive node/banner title. |
| Zero Hour | Node | [Zero Hour! The Konoha Crush Begins!](https://naruto.fandom.com/wiki/Zero_Hour!_The_Konoha_Crush_Begins!) | Verified | From the ep 68 dub title. |
| Zori and Waraji | Node | [Zōri](https://naruto.fandom.com/wiki/Z%C5%8Dri) | Verified |  |

<!-- NAMES:END -->
