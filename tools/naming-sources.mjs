// tools/naming-sources.mjs — where every in-game name was checked.
// Used by tools/naming.mjs to regenerate NAMING.md and by validate.mjs to warn
// about names that have no recorded source. SESSION 2/3: add an entry for every
// new name (character, jutsu, mechanic, arc, node, banner).
//
// status: 'V' verified on Narutopedia (English TV / dub field or article),
//         'P' partly verified, 'D' descriptive label (not presented as canon),
//         'N' NOT VERIFIED (never ship silently — flag it here).
const S = {};
const set = (name, page, status = 'V', note = '') => { S[name] = { page, status, note }; };

// ---- characters (article titles; the dub spelling drops macrons) -------------
for (const [n, p] of Object.entries({
  'Sakura Haruno': 'Sakura Haruno', 'Ino Yamanaka': 'Ino Yamanaka', 'Choji Akimichi': 'Chōji Akimichi', 'Kiba Inuzuka': 'Kiba Inuzuka', 'Shino Aburame': 'Shino Aburame',
  'Hinata Hyuga': 'Hinata Hyūga', 'Tenten': 'Tenten', 'Iruka Umino': 'Iruka Umino', 'Jirobo': 'Jirōbō', 'Naruto Uzumaki': 'Naruto Uzumaki', 'Sasuke Uchiha': 'Sasuke Uchiha',
  'Rock Lee': 'Rock Lee', 'Neji Hyuga': 'Neji Hyūga', 'Shikamaru Nara': 'Shikamaru Nara', 'Temari': 'Temari', 'Kankuro': 'Kankurō', 'Haku': 'Haku', 'Shizune': 'Shizune',
  'Tayuya': 'Tayuya', 'Kidomaru': 'Kidōmaru', 'Sakon and Ukon': 'Sakon and Ukon', 'Kakashi Hatake': 'Kakashi Hatake', 'Might Guy': 'Might Guy', 'Asuma Sarutobi': 'Asuma Sarutobi',
  'Kurenai Yuhi': 'Kurenai Yūhi', 'Zabuza Momochi': 'Zabuza Momochi', 'Gaara': 'Gaara', 'Kabuto Yakushi': 'Kabuto Yakushi', 'Kimimaro': 'Kimimaro', 'Hiruzen Sarutobi': 'Hiruzen Sarutobi',
  'Jiraiya': 'Jiraiya', 'Tsunade': 'Tsunade', 'Orochimaru': 'Orochimaru', 'Gozu': 'Gōzu', 'Meizu': 'Meizu', 'Zori': 'Zōri', 'Waraji': 'Waraji', 'Dosu Kinuta': 'Dosu Kinuta',
  'Zaku Abumi': 'Zaku Abumi', 'Kin Tsuchi': 'Kin Tsuchi', 'Oboro': 'Oboro', 'Mubi': 'Mubi', 'Kagari': 'Kagari', 'Yoroi Akado': 'Yoroi Akadō', 'Misumi Tsurugi': 'Misumi Tsurugi',
  'Kisame Hoshigaki': 'Kisame Hoshigaki', 'Itachi Uchiha': 'Itachi Uchiha', 'Manda': 'Manda', 'Aoi Rokusho': 'Aoi Rokushō', 'Ukon': 'Sakon and Ukon', 'Doki': 'Doki',
  'Raiga Kurosuki': 'Raiga Kurosuki', 'Ranmaru': 'Ranmaru', 'Tazuna': 'Tazuna', 'Tsunami': 'Tsunami', 'Idate Morino': 'Idate Morino', 'Rokusuke': 'Rokusuke',
  'Deidara': 'Deidara', 'Sasori': 'Sasori', 'Hidan': 'Hidan', 'Kakuzu': 'Kakuzu',
})) set(n, p, 'V', 'Article title; the dub spelling drops macrons (romanization convention, not a separate dub field).');
set('Pain', 'Nagato', 'V', 'Narutopedia redirects "Pain" to Nagato; "Pain" is the name the dub uses for him in battle.');
set('Naruto Uzumaki (Nine-Tails Chakra)', 'Jinchūriki Forms', 'D', 'RE-CHECKED (Session 2): descriptive form label, kept. Narutopedia\'s name for this form is "Initial Jinchūriki Form" (Jinchūriki Forms article), with no English TV / dub name for the form itself. "Nine-Tails" is the dub term (dub titles of ep 40 "The Nine-Tails Unleashed" and Shippuden ep 165 "Nine-Tails, Captured!"). Not the Part II "Nine-Tails Chakra Mode".');
set("Sasuke Uchiha (Heavens' Curse Mark)", 'Cursed Seal of Heaven', 'V', 'Form label; "Heavens\' Curse Mark" is the English TV name.');
set('Hashirama Senju (Reanimated)', 'Summoning: Impure World Reincarnation', 'V', '"Hashirama Senju" + "(Reanimated)" from the dub "Summoning Jutsu: Reanimation".');
set('Tobirama Senju (Reanimated)', 'Summoning: Impure World Reincarnation', 'V', '"Tobirama Senju" + "(Reanimated)" (see above).');

// ---- jutsu (Narutopedia "English TV" field = anime dub name) ------------------
const J = {
  'Healing Jutsu': 'Mystical Palm Technique', 'Ninja Art: Mind Transfer Jutsu': 'Mind Body Switch Technique', 'Human Boulder': 'Human Bullet Tank',
  'Man-Beast Ultimate Taijutsu: Fang Over Fang': 'Fang Passing Fang', 'Parasitic Insects Jutsu': 'Parasitic Destruction Insect Technique',
  'Protective Eight Trigrams Sixty-Four Palms': 'Protecting Eight Trigrams Sixty-Four Palms', 'Rising Twin Dragons': 'Twin Rising Dragons',
  'Demonic Illusion: Death Mirage Jutsu': 'Demonic Illusion: Hell Viewing Technique', 'Earth Style Barrier: Earth Dome Prison': 'Earth Release Barrier: Earth Prison Dome of Magnificent Nothingness',
  'Primary Lotus': 'Front Lotus', 'Gentle Fist Art: Eight Trigrams Sixty-Four Palms': 'Eight Trigrams Sixty-Four Palms', 'Shadow Possession Jutsu': 'Shadow Imitation Technique',
  'Ninja Art: Wind Scythe Jutsu': 'Sickle Weasel Technique', 'Puppet Master Jutsu': 'Puppet Technique', 'Secret Jutsu: Crystal Ice Mirrors': 'Demonic Mirroring Ice Crystals',
  'Ninja Art: Poison Fog': 'Poison Mist', 'Demon Flute: Chains of Fantasia': 'Demonic Flute: Phantom Sound Chains', 'Spider Bow: Fierce Rip': 'Spider War Bow: Terrible Split',
  'Multiple Fists Barrage': 'Multiple Connected Fists', 'Lightning Blade': 'Lightning Cutter', 'Tree Bind Death': 'Demonic Illusion: Tree Binding Death',
  'Water Style: Water Dragon Jutsu': 'Water Release: Water Dragon Bullet Technique', 'Sand Shield': 'Shield of Sand', 'Bracken Dance': 'Dance of the Seedling Fern',
  'Sealing Jutsu: Reaper Death Seal': 'Dead Demon Consuming Seal', 'Summoning Jutsu': 'Summoning Technique', 'Ninja Art: Mitotic Regeneration': 'Creation Rebirth',
  'Striking Shadow Snakes': 'Hidden Shadow Snake Hands', 'Earth Style: Headhunter Jutsu': 'Earth Release: Double Suicide Decapitation Technique',
  'Leaf Village Secret Finger Jutsu: One Thousand Years of Death': 'One Thousand Years of Death', 'Substitution Jutsu': 'Body Replacement Technique',
  'Water Prison Jutsu': 'Water Prison Technique', 'Water Clone Jutsu': 'Water Clone Technique', 'Ninja Art: Hidden Mist Jutsu': 'Hiding in Mist Technique',
  'Wind Style: Great Breakthrough': 'Wind Release: Great Breakthrough', 'Supersonic Slicing Wave': 'Extreme Decapitating Airwaves', 'Misty Follower Jutsu': 'Mist Servant Technique',
  'Earth Style: Underground Move Jutsu': 'Earth Release: Underground Projection Fish Technique', 'Eight Trigrams: Palm Rotation': 'Eight Trigrams Palms Revolving Heaven',
  'Gentle Fist': 'Gentle Fist', 'Wood Style: Deep Forest Emergence': 'Wood Release Secret Technique: Nativity of a World of Trees', 'Water Style: Water Wall': 'Water Release: Water Formation Wall',
  'Sand Coffin': 'Sand Binding Coffin', 'Wind Style: Air Bullet': 'Wind Release: Drilling Air Bullet', 'Play Possum Jutsu': 'Feigning Sleep Technique',
  'Water Style: Water Shark Bomb Jutsu': 'Water Release: Water Shark Bullet Technique', 'Shark Skin': 'Samehada', 'Heaven Kick of Pain': 'Heavenly Foot of Pain',
  'Water Style: Black Rain Jutsu': 'Water Release: Black Rain Technique', 'Ninja Art: Senbon Rainstorm': 'Senbon Shower', 'Blade of the Thunder Spirit': 'Sword of the Thunder God',
  'Demon Twin Jutsu': 'Attack of the Twin Demons', 'Summoning Jutsu: Rashomon': 'Summoning: Rashōmon', 'Demon Flute: Trio Requiem': 'Demonic Flute: Illusionary Warriors Manipulating Melody',
  'Clematis Dance: Flower': 'Dance of the Clematis: Flower', 'Larch Dance': 'Dance of the Larch', "Heavens' Curse Mark": 'Cursed Seal of Heaven',
  'Fire Style: Phoenix Flower Jutsu': 'Fire Release: Phoenix Sage Fire Technique', 'Ninja Art: Black Tornado': 'Black Tornado', 'Ninja Art: Lightning Fangs': 'Fangs of Lightning',
  'Ninja Art: Lightning Ball': 'Lightning Ball', 'Thunder Funeral: Feast of Lightning': 'Lightning Burial: Banquet of Lightning', 'Ninja Art: Thunder Armour': 'Lightning Strike Armour',
  'Iron Sand: World Order': 'Iron Sand World Method', 'Secret Red Move: Performance of a Hundred Puppets': 'Red Secret Technique: Performance of a Hundred Puppets',
  'Curse Jutsu': 'Curse Technique: Death Controlling Possessed Blood', 'Fire Style: Searing Migraine': 'Fire Release: Intelligent Hard Work', 'Earth Grudge': 'Earth Grudge Fear',
  'Shadow Clone Jutsu': 'Shadow Clone Technique', 'Almighty Push': 'Shinra Tensei', 'Ice Style': 'Ice Release', 'Explosion Style': 'Explosion Release',
};
for (const [n, p] of Object.entries(J)) set(n, p, 'V', 'Narutopedia "English TV" (dub) field.');
S['Healing Jutsu'].note = 'Narutopedia "English TV" field. Sakura is a listed user but first uses it in Part II; used for her Part 1 form because she has no Part 1 signature technique. Kabuto uses it in Part 1 (debut ep 36).';
S['Demonic Illusion: Death Mirage Jutsu'].note = 'Narutopedia "English TV" field; Kakashi uses it in ep 5, Iruka in ep 21 (per the Iruka Umino article).';
S['Demon Flute: Trio Requiem'].note = 'English TV name of "Demonic Flute: Illusionary Warriors Manipulating Melody" (Doki control, anime ep 120). A separate game-only jutsu shares the name.';
S['Puppet Master Jutsu'].note = 'Narutopedia "English TV" field (Kankuro, ep 41). Used as his Tank ult (the puppet draws attacks).';
for (const n of ['Rasengan', 'Chidori', 'Dynamic Entry', 'Flying Swallow', 'Chakra Scalpel', 'Resonating Echo Drill', 'Soft Physique Modification', 'Tsukuyomi', 'Coiling Around', 'C3', 'Amaterasu', 'Shadow Senbon'])
  set(n, n, 'V', 'Article has no separate English TV name — the dub keeps this name.');
set('Iaido', 'Iaidō', 'V', 'No separate English TV name; macron dropped.');
set('Six Paths of Pain', 'Six Paths of Pain', 'V', 'RE-CHECKED (Session 2): confirmed. No English TV field on the article, and the dub uses the same phrasing: Shippuden ep 132 dub title "In Attendance, the Six Paths of Pain" (Wikipedia, season 6).');

// ---- descriptive labels (never presented as canon technique names) -----------
for (const n of ['Water Clone', "Gato's Thug", 'Misty Follower', 'Sand Ninja', 'Sound Ninja', 'Puppet', 'Itachi (Shadow Clone)', 'Kurosuki Family Member', 'Chakra absorption', 'Immortality', "Ranmaru's eyes guide Raiga", 'Kurosuki Family ambush'])
  set(n, null, 'D', 'Descriptive in-game label, not a canon technique name.');
S['Chakra absorption'].page = 'Yoroi Akadō'; S['Chakra absorption'].note = 'Descriptive: Yoroi\'s Part 1 chakra drain is unnamed on Narutopedia.';
S['Immortality'].page = 'Hidan'; S['Kurosuki Family Member'].page = 'Kurosuki Family'; S["Gato's Thug"].page = 'Gatō';
set('Demon of the Hidden Mist', 'Zabuza Momochi', 'V', 'Zabuza\'s epithet, from the article\'s English name field.');
set('Thunder of the Hidden Mist', 'Raiga Kurosuki', 'V', 'Raiga\'s epithet, from the article.');

// ---- arcs, nodes, banners ------------------------------------------------------
set('Prologue: Survival Test', 'Bell Test', 'V', 'RE-CHECKED (Session 2): renamed from "Prologue: Bell Test" (dub-first). Dub titles of eps 4–5: "Pass or Fail: Survival Test" and "You Failed! Kakashi\'s Final Decision" (Wikipedia, Naruto season 1). Alternate: "Bell Test" is the Narutopedia article name. Internal ids (arc_belltest, banner_belltest, targets.bellTestMinWin) are unchanged.');
set('Land of Waves', 'Land of Waves', 'V');
set('Chunin Exams', 'Chūnin Exams (Arc)', 'V', 'Dub spelling "Chunin".');
set('Destruction of the Hidden Leaf Village', 'Zero Hour! The Konoha Crush Begins!', 'V', 'RESOLVED (Session 3): the ep 68 dub title is "Zero Hour! The Destruction of the Hidden Leaf Village Begins!", as Session 1 recorded. Sources: Narutopedia episode article, "Other names" field; Tubi\'s listing of the English-dubbed episode (S02:E68, which misspells "Destuction"). Wikipedia\'s Naruto season 2 list gives the shorter "Zero Hour! The Destruction of Leaf Begins!" and is the outlier. The arc name is that title\'s wording; "Konoha Crush" is the Viz/official name.');
set('Search for Tsunade', 'Search for Tsunade', 'V');
set('Land of Tea Escort Mission', 'Land of Tea Escort Mission', 'V', 'Anime-only (filler) arc name on Narutopedia.');
set('Sasuke Retrieval Squad', 'Sasuke Recovery Mission', 'V', 'Dub title of ep 110 ("Formation! The Sasuke Retrieval Squad"). Narutopedia arc: "Sasuke Recovery Mission" — the brief used that name; changed per the dub rule. Internal id stays arc_sasuke_recovery.');
set('Kurosuki Family Removal Mission', 'Kurosuki Family Removal Mission', 'V', 'Anime-only (filler) arc name on Narutopedia.');
const nodes = {
  'Pass or Fail: Survival Test': ['Pass or Fail: Survival Test', 'V', 'Dub title of ep 4.'],
  'One Thousand Years of Death': ['One Thousand Years of Death', 'V', 'Short form of the dub jutsu name.'],
  'The Final Bell': [null, 'D'], 'The Demon Brothers': ['Demon Brothers', 'V'], 'Zori and Waraji': ['Zōri', 'V'], 'Showdown on the Bridge': [null, 'D'],
  'Forest of Death: The Grass Ninja': ['Forest of Death', 'D', 'Descriptive; "Forest of Death" has no separate dub name.'],
  'Forest of Death: Sound Ninja Ambush': ['Forest of Death', 'D', 'Descriptive.'], 'Forest of Death: Team Oboro': ['Team Oboro', 'V'],
  'Preliminaries: Yoroi and Misumi': [null, 'D'], 'Finals: Naruto vs. Neji': [null, 'D'], 'Zero Hour': ['Zero Hour! The Konoha Crush Begins!', 'V', 'From the ep 68 dub title.'],
  'Shino vs. Kankuro': [null, 'D'], "The Third Hokage's Last Stand": [null, 'D'], 'Naruto vs. Gaara': [null, 'D'], 'Itachi and Kisame': [null, 'D'], "Tsunade's Bet": [null, 'D'],
  'Kabuto in Tanzaku Town': ['Tanzaku Town', 'D', 'Descriptive; "Tanzaku Town" is the dub name.'],
  'Deadlock! Sannin Showdown!': ['Deadlock! Sannin Showdown!', 'V', 'RE-CHECKED (Session 2): confirmed. Dub title of ep 96 (Wikipedia, Naruto season 4) matches the Narutopedia episode article.'],
  'Ambush at Sea': [null, 'D'], 'Reinforcements from the Sand': [null, 'D'], 'Final Valley': ['Valley of the End', 'V', 'English TV name of the Valley of the End.'],
  'Funeral March for the Living': ['Funeral March for the Living', 'V', 'Episode article title (ep 152).'], 'Raiga and Ranmaru': [null, 'D'],
  'Standard Summon': [null, 'D'], 'Team 7 Assembles': [null, 'D'], 'Destruction of the Hidden Leaf': ['Zero Hour! The Konoha Crush Begins!', 'V', 'Short form of the arc name.'],
  'The Legendary Sannin': ['Sannin', 'V'], 'Land of Tea': ['Land of Tea', 'V'],
};
for (const [n, [p, st, note]] of Object.entries(nodes)) set(n, p, st, note || (st === 'D' ? 'Descriptive node/banner title.' : ''));

// ---- Session 2 re-checks of group and village names ---------------------------
// Recorded even where the name is no longer shown, so the decision is traceable.
set('Sound Ninja Four', 'Sound Four', 'V', 'RE-CHECKED (Session 2): corrected from "Sound Four". The article\'s English TV name is "Sound Ninja Four" (and "Sound Ninja Five" with Kimimaro). Used in two blurbs.');
set('Sound Four', 'Sound Four', 'P', 'RE-CHECKED (Session 2): Narutopedia/Viz name, not the dub. Replaced in game by "Sound Ninja Four".');
set('Sand Siblings', 'Three Sand Siblings', 'P', 'RE-CHECKED (Session 2): not confirmable as a dub name. Narutopedia: "Three Sand Siblings" (other: "Three Hidden Sand Siblings"), no English TV field, and no dub episode title uses it. Removed from the game: the two blurbs name Gaara, Temari and Kankuro, and the leader-scope label is now "Hidden Sand ninja".');
for (const [n, p, note] of [
  ['Leaf', 'Konohagakure', 'English TV "Village Hidden in the Leaves" / "Hidden Leaf Village"; short form in dub titles ("Hero of the Leaf", ep 175; "Sound vs. Leaf", Part I ep 111).'],
  ['Sand', 'Sunagakure', 'English TV "The Village Hidden in the Sand"; short form in dub titles ("User of the Scorch Style: Pakura of the Sand!", ep 285; "The Sand Shinobi: Allies of the Leaf", Part I ep 125).'],
  ['Mist', 'Kirigakure', 'English TV "The Village Hidden in the Mist"; short form in dub titles ("The Assassin of the Mist!", Part I ep 7).'],
  ['Cloud', 'Kumogakure', 'English TV "The Village Hidden in the Clouds" / "Hidden Cloud Village" (singular "Cloud" in the short form).'],
  ['Stone', 'Iwagakure', 'English TV "The Village Hidden in the Stones" / "Hidden Stone Village" ("Stone", never "Rock").'],
  ['Sound', 'Otogakure', 'English TV "The Village Hidden in the Sound"; short form in dub titles ("An Invitation from the Sound", "Sound vs. Leaf", Part I eps 109, 111).'],
  ['Rain', 'Amegakure', 'English TV "The Village Hidden in the Rain"; dub title of ep 129 "Infiltrate! The Village Hidden in the Rain".'],
]) set(n, p, 'V', 'RE-CHECKED (Session 2) village short form. ' + note + ' In game: places as "Hidden Leaf Village" / "Village Hidden in the Rain", groups as "Hidden X ninja" (leader-scope labels), generic units as "X Ninja". No Japanese village names are used.');

// =============================================================================
// PART II (Session 2). Same method: Narutopedia MediaWiki API (article titles,
// `english tv` infobox field = dub name). English dub EPISODE titles come from
// Wikipedia's "Naruto: Shippuden season N" episode lists (Narutopedia's episode
// articles use the official English titles, which differ from the dub in places,
// e.g. "Wind Release: Rasenshuriken!" vs the dub "Wind Style: Rasen Shuriken!").
// =============================================================================

// ---- characters -------------------------------------------------------------
for (const [n, p] of Object.entries({
  'Konohamaru Sarutobi': 'Konohamaru Sarutobi', 'Karin': 'Karin', 'Jugo': 'Jūgo', 'Omoi': 'Omoi', 'Chojuro': 'Chōjūrō', 'Sai': 'Sai',
  'Suigetsu Hozuki': 'Suigetsu Hōzuki', 'Kurotsuchi': 'Kurotsuchi', 'Yamato': 'Yamato', 'Chiyo': 'Chiyo', 'Konan': 'Konan', 'Darui': 'Darui',
  'Onoki': 'Ōnoki', 'Mei Terumi': 'Mei Terumī', 'Minato Namikaze': 'Minato Namikaze', 'Hashirama Senju': 'Hashirama Senju', 'Madara Uchiha': 'Madara Uchiha',
  'Fuka': 'Fūka', 'Fudo': 'Fudō', 'Sora': 'Sora', 'Kazuma': 'Kazuma', 'Kigiri': 'Kigiri', 'Nurari': 'Nurari', 'Guren': 'Guren', 'Shiranami': 'Shiranami',
  'Kinkaku': 'Kinkaku', 'Ginkaku': 'Ginkaku', 'Gotta': 'Gotta', 'Giant Squid': 'Giant Squid', 'Hotaru': 'Hotaru', 'Motoi': 'Motoi', 'Kaguya Otsutsuki': 'Kaguya Ōtsutsuki',
})) set(n, p, 'V', 'Article title; the dub spelling drops macrons.');
set('Killer Bee', 'Killer B', 'V', 'Dub spelling. Narutopedia\'s article is "Killer B"; the English dub titles use "Killer Bee" (ep 244 "Killer Bee and Motoi", eps 429–430 "Killer Bee Rappūden").');
set('Ay', 'A (Fourth Raikage)', 'V', 'English TV name "Ay" (article lead: A, engtv=Ay; Raikage article). Narutopedia/Viz: "A".');
set('Obito Uchiha', 'Obito Uchiha', 'V', 'Article title. Also the dub title of ep 385 (Wikipedia, season 18), used as a node and a banner name.');
set('Danzo Shimura', 'Danzō Shimura', 'V', 'Article title (macron dropped). Also the dub title of ep 211 (Wikipedia, season 10), used as a node name.');
set('Tobi', 'Obito Uchiha', 'V', 'Obito\'s masked alias "Tobi" (listed in his other names); the dub uses it until his reveal.');
set('Kinoe', 'Yamato', 'V', 'Yamato\'s Anbu codename; Narutopedia redirects "Kinoe" to Yamato. Used in the dub\'s Anbu arc (eps 351–355).');
set('Three-Tails', 'Isobu', 'V', 'Other name "Three-Tails" (Isobu infobox); the dub calls it the Three-Tails.');
set('Four-Tails', 'Son Gokū', 'V', 'Other name "Four-Tails" (Son Gokū infobox). The ep 326 dub title writes "Four Tails"; the game hyphenates like "Nine-Tails".');
set('Eight-Tails', 'Gyūki', 'V', 'Other name "Eight-Tails" (Gyūki infobox); dub title of ep 143 "The Eight-Tails vs. Sasuke".');
set('Nine-Tails', 'Kurama', 'V', '"Nine-Tails" as in the dub titles of eps 40 and 165; English TV of the fox is "Nine-Tailed Fox". Also Kinkaku\'s transformation (he became a pseudo-Nine-Tails, ep 270).');
set('Ten-Tails Clone', 'Ten-Tails Clones', 'V', 'Article "Ten-Tails Clones" (singular unit name).');
for (const [n, p, note] of [
  ['Pain (Tendo)', 'Deva Path', 'English TV name of the Deva Path is "Tendo".'],
  ['Pain (Shurado)', 'Asura Path', 'English TV name of the Asura Path is "Shurado".'],
  ['Pain (Chikushodo)', 'Animal Path', 'English TV name of the Animal Path is "Chikushodo".'],
  ['Pain (Gakido)', 'Preta Path', 'English TV name of the Preta Path is "Gakido".'],
  ['Pain (Jigokudo)', 'Naraka Path', 'English TV name of the Naraka Path is "Jigokudo".'],
]) set(n, p, 'V', note);
for (const n of ['Zabuza Momochi (Reanimated)', 'Haku (Reanimated)', 'Asuma Sarutobi (Reanimated)', 'Nagato (Reanimated)', 'Mu (Reanimated)', 'Madara Uchiha (Reanimated)'])
  set(n, 'Summoning: Impure World Reincarnation', 'V', 'Character + "(Reanimated)" from the dub "Summoning Jutsu: Reanimation" (as in Part I). Mu = Mū, macron dropped.');
// Alternate forms (label = the dub name of the form or its signature technique)
set('Naruto Uzumaki (Sage Mode)', 'Sage Mode', 'V', 'English TV "Sage Mode".');
set('Naruto Uzumaki (Six Paths Sage Mode)', 'Six Paths Sage Mode', 'V', 'No English TV field — the dub keeps "Six Paths Sage Mode".');
set('Kabuto Yakushi (Sage Mode)', 'Sage Mode', 'V', 'English TV "Sage Mode" (Kabuto is a listed user).');
set('Kakashi Hatake (Mangekyo Sharingan)', 'Mangekyō Sharingan', 'V', 'No English TV field; macron dropped.');
set('Sasuke Uchiha (Eternal Mangekyo Sharingan)', 'Mangekyō Sharingan', 'V', '"Eternal Mangekyō Sharingan" redirects to Mangekyō Sharingan (no English TV field); macron dropped.');
set('Sasuke Uchiha (Rinnegan)', 'Rinnegan', 'V', 'No English TV field — the dub keeps "Rinnegan".');
set('Might Guy (Eight Inner Gates)', 'Eight Gates', 'V', 'English TV "The Eight Inner Gates"; dub title of ep 420 "The Eight Inner Gates Formation".');
set('Gaara (Fifth Kazekage)', 'Gaara', 'V', 'His title in Part II (the dub keeps "Kazekage": ep 5 "The Kazekage Stands Tall").');
set('Sakura Haruno (Hundred Healings)', 'Ninja Art Creation Rebirth — Strength of a Hundred Technique', 'V', 'Form label from the English TV name "Mitotic Regeneration: The Hundred Healings".');
set('Obito Uchiha (Ten-Tails Jinchuriki)', 'Ten-Tails', 'V', '"Ten-Tails" + "Jinchuriki" as in the ep 378 dub title "The Ten Tails\' Jinchuriki".');
// Descriptive unit labels (not presented as canon names)
for (const [n, p, note] of [
  ['Might Guy (Clone)', "Traps Activate! Team Guy's Enemies!", 'Descriptive: the clones of Team Guy in ep 19.'],
  ['Rock Lee (Clone)', "Traps Activate! Team Guy's Enemies!", 'Descriptive: the clones of Team Guy in ep 19.'],
  ['Neji Hyuga (Clone)', "Traps Activate! Team Guy's Enemies!", 'Descriptive: the clones of Team Guy in ep 19.'],
  ['Tenten (Clone)', "Traps Activate! Team Guy's Enemies!", 'Descriptive: the clones of Team Guy in ep 19.'],
  ['Clay Bird', 'C1', 'Descriptive: one of Deidara\'s C1 clay birds.'],
  ['Wood Clone', 'Wood Clone Technique', 'Descriptive unit label for a Wood Style: Wood Clone.'],
  ['Revived Soul', 'Revived Souls', 'Descriptive, after the ep 66 dub title "Revived Souls".'],
  ['Masked Beast', 'Earth Grudge Fear', 'Descriptive: one of Kakuzu\'s masked hearts.'],
  ['Smoke Clone', 'Smoke Clone', 'Descriptive unit label for Kigiri\'s Smoke Clone technique.'],
  ['Rain Ninja', 'Amegakure', 'Descriptive; "Rain" short form of the dub "Village Hidden in the Rain" (ep 129 dub title).'],
  ['Summoned Beast', 'Animal Path', 'Descriptive: one of Chikushodo\'s summons.'],
  ['Itachi (Crow Clone)', 'Crow Clone Technique', 'Descriptive; English TV "Crow Clone Jutsu".'],
  ['Mist Tracker Ninja', 'Hunter-nin', 'Descriptive; English TV of hunter-nin is "tracker ninja".'],
  ['Bandit Ninja', 'Shiranami', 'Descriptive: Shiranami\'s bandits (eps 145–151).'],
  ['Leaf Villager', 'Konohagakure', 'Descriptive protect target.'],
  ['Foundation Operative', 'Root', 'Descriptive; Root\'s English TV name is "Foundation".'],
  ['Mu (Fragmentation)', 'Fission Technique', 'Descriptive; English TV "Fragmentation".'],
]) set(n, p, 'D', note);

// ---- jutsu, Ultimates and mechanic names (English TV = dub) ------------------
const J2 = {
  'Cloud Style: Crescent Moon Slice': 'Cloud-Style Crescent Moon Beheading', 'Ninja Art: Super Beast Scroll': 'Super Beast Imitating Drawing',
  'Water Style: Great Water Arm': 'Water Release: Great Water Arm Technique', 'Lava Style: Quicklime Jutsu': 'Lava Release: Quicklime Congealing Technique',
  'Wood Style: Four Pillar Prison Jutsu': 'Wood Release: Four-Pillar Prison Technique', "Secret White Move: Chikamatsu's 10 Puppets": 'White Secret Technique: The Chikamatsu Collection of Ten Puppets',
  'C4 Karura': 'C4', 'Earth Style: Iron Skin': 'Earth Release: Earth Spear', 'Water Style: Super Shark Bomb Jutsu': 'Water Release: Great Shark Bullet Technique',
  'Sacred Paper Emissary Jutsu': 'Paper Person of God Technique', 'Gale Style: Laser Circus': 'Storm Release: Laser Circus', 'Tailed Beast Bomb': 'Tailed Beast Ball',
  'Liger Bomb': 'Liger Bomb', 'Particle Style: Atomic Dismantling Jutsu': 'Dust Release: Detachment of the Primitive World Technique',
  'Lava Style: Lava Monster Jutsu': 'Lava Release: Melting Apparition Technique', 'Flying Raijin Jutsu': 'Flying Thunder God Technique',
  'Wood Style: Wood Dragon Jutsu': 'Wood Release: Wood Dragon Technique', 'Fire Style: Majestic Destroyer Flame': 'Fire Release: Great Fire Annihilation',
  'Wood Style: Cutting Sprigs Jutsu': 'Wood Release: Cutting Technique', 'Mitotic Regeneration: The Hundred Healings': 'Ninja Art Creation Rebirth — Strength of a Hundred Technique',
  "Ultimate Defence: Shukaku's Shield": 'Ultimately Hard Absolute Defence: Shield of Shukaku', 'Wind Style: Rasen Shuriken': 'Wind Release: Rasenshuriken',
  'Inferno Style: Flame Control': 'Blaze Release: Kagutsuchi', 'Sage Art: Super Tailed Beast Rasen-Shuriken': 'Sage Art: Super Tailed Beast Rasenshuriken',
  'Iron Sand: Scattered Showers': 'Iron Sand Drizzle', 'Iron Sand Gathering': 'Iron Sand Gathering Assault', 'Clay Clone': 'Clay Clone',
  'Wood Style: Wood Clone Jutsu': 'Wood Clone Technique', 'Orochimaru Style: Substitution Jutsu': 'Orochimaru-Style Body Replacement Technique',
  'Chidori Stream': 'Chidori Current', 'Reaper Kiss': 'Execution by Kiss', 'Earth Style: Earthquake Slam': 'Earth Release: Tearing Earth Turning Palm',
  'Beast Wave Gale Palm': 'Beast Tearing Gale Palm', 'Earth Style: Hidden in Stones Jutsu': 'Earth Release: Hiding in Rock Technique',
  'Earth Style Ultimate Revival Jutsu: Soil Bodies': 'Earth Release Resurrection Technique: Corpse Soil', 'Lightning Style: False Darkness': 'Lightning Release: False Darkness',
  'Wind Style: Pressure Damage': 'Wind Release: Pressure Damage', 'Multi-Smoke Clone': 'Multiple Smoke Clone', 'Sticky Water': 'Viscous Water Mass',
  'Crystal Style: Jade Crystal Mirror': 'Crystal Release: Jade Crystal Mirror', 'Crystal Style: Burst Crystal Falling Dragon': 'Crystal Release: Tearing Crystal Falling Dragon',
  'C2 Dragon': 'C2', 'Universal Pull': "Banshō Ten'in", 'Water Style: Exploding Water Shock Wave': 'Water Release: Exploding Water Colliding Wave',
  'Fire Style: Fireball Jutsu': 'Fire Release: Great Fireball Technique', 'Crow Clone Jutsu': 'Crow Clone Technique', 'Lariat': 'Lightning Release: Lariat',
  'Word Bind Jutsu': 'Character Bind Technique', 'Tsuchigumo Style: Forbidden Jutsu Release: Big Bang': 'Tsuchigumo Style: Forbidden Life Technique Release: Creation of Heaven and Earth',
  'Chameleon Jutsu': 'Hiding with Camouflage Technique', 'Fury Jutsu': 'Fury', 'Water Prison Shark Dance Jutsu': 'Water Prison Shark Dance Technique',
  'Wind Style: Vacuum Bullets': 'Wind Release: Vacuum Sphere', 'Water Style: Thousand Hungry Sharks': 'Water Release: A Thousand Feeding Sharks',
  'Silent Killing': 'Silent Killing', 'Summoning Jutsu: Reanimation': 'Summoning: Impure World Reincarnation', 'Leaf Fan': 'Bashōsen',
  'Amber Purification Jar': 'Kohaku no Jōhei', 'Fire Style: Burning Ash': 'Fire Release: Ash Pile Burning', 'Transparency Jutsu': 'Transparent Escape Technique',
  'Fragmentation': 'Fission Technique', 'Sage Art: White Extreme Attack': 'Sage Art: White Rage Technique', 'Sage Art: Inorganic Animation': 'Sage Art: Inorganic Reincarnation',
  'Wood Style: Four Pillar House Jutsu': 'Wood Release: Four-Pillar House Technique', 'Wood Style: Domed Wall Jutsu': 'Wood Release: Wood Locking Wall',
  'Six Paths Sage Jutsu': 'Six Paths Senjutsu', 'Limbo: Hengoku': 'Limbo: Border Jail',
};
for (const [n, p] of Object.entries(J2)) set(n, p, 'V', 'Narutopedia "English TV" (dub) field.');
S['Chameleon Jutsu'].note = 'Narutopedia "English TV" field lists "Chameleon Jutsu" and "Camouflage Jutsu"; the first is used.';
S['Fire Style: Fireball Jutsu'].note = 'Narutopedia "English TV" field lists "Fire Style: Fireball Jutsu" and "Fire Style: Great Fireball Jutsu"; the first is used.';
S['Earth Style: Earthquake Slam'].note = 'Narutopedia "English TV" field lists "Earth Style: Earthquake Slam" and "Earth Style: Rupturing Earth Palm"; the first is used. Fudo is an anime user.';
S['Iron Sand: Scattered Showers'].note = 'Narutopedia "English TV" field. Sasori uses it through the Third Kazekage puppet (listed user).';
S['Iron Sand Gathering'].note = S['Iron Sand: Scattered Showers'].note;
for (const n of ['Heal Bite', 'Sage Transformation', 'Hiramekarei', 'Kamui', 'Night Guy', 'C1', 'C0', 'Hiruko', 'Sword of Kusanagi', 'Rock Armour', 'Tailed Beast Chakra Arms',
  'Triple-Bladed Scythe', 'Exploding Flame Shot', 'Paper Shuriken', 'Dance of the Shikigami', 'Asura Attack', 'Susanoo', 'Ink Creation', 'King of Hell', 'Izanagi',
  'Chidori Sharp Spear', 'Tengai Shinsei', 'Truth-Seeking Ball', 'All-Killing Ash Bones', 'Amenominaka', 'Eighty Gods Vacuum Attack', 'Expansive Truth-Seeking Ball',
  'Yomotsu Hirasaka', "Indra's Arrow"])
  set(n, n, 'V', 'Article has no separate English TV name — the dub keeps this name.');
set('Planetary Devastation', 'Chibaku Tensei', 'V', 'English TV name of Chibaku Tensei; also the dub title of ep 167 (Wikipedia, season 8; Narutopedia episode article "Chibaku Tensei").');
set('The Rampaging Tailed Beast', 'Raging Tailed Beast', 'V', 'Mechanic named after the dub title of ep 99 (Wikipedia, season 5); Narutopedia: "Raging Tailed Beast".');

// ---- arcs (Narutopedia arc names, dub terms applied) --------------------------
for (const [n, p, note] of [
  ['Kazekage Rescue Mission', 'Kazekage Rescue Mission', 'Narutopedia arc name (the anime shortens it to "Kazekage Rescue").'],
  ['Tenchi Bridge Reconnaissance Mission', 'Tenchi Bridge Reconnaissance Mission', ''],
  ['Twelve Guardian Ninja', 'Twelve Guardian Ninja (Arc)', 'Anime-only (filler) arc; also the English season sub-title (Wikipedia, season 3).'],
  ['Akatsuki Suppression Mission', 'Akatsuki Suppression Mission', ''],
  ["Three-Tails' Appearance", "Three-Tails' Appearance", 'Anime-only (filler) arc.'],
  ['Itachi Pursuit Mission', 'Itachi Pursuit Mission', ''],
  ['Tale of Jiraiya the Gallant', 'Tale of Jiraiya the Gallant', 'Also the dub title of ep 133.'],
  ['Fated Battle Between Brothers', 'Fated Battle Between Brothers', ''],
  ['Six-Tails Unleashed', 'Six-Tails Unleashed', 'Anime-only (filler) arc.'],
  ["Pain's Assault", "Pain's Assault (Arc)", ''],
  ['Five Kage Summit', 'Five Kage Summit (Arc)', ''],
  ['Fourth Great Ninja War: Countdown', 'Fourth Shinobi World War: Countdown', '"Fourth Great Ninja War" is the English TV name of the Fourth Shinobi World War.'],
  ['Fourth Great Ninja War: Confrontation', 'Fourth Shinobi World War: Confrontation', '"Fourth Great Ninja War" is the English TV name of the Fourth Shinobi World War.'],
  ['Fourth Great Ninja War: Climax', 'Fourth Shinobi World War: Climax', '"Fourth Great Ninja War" is the English TV name of the Fourth Shinobi World War.'],
  ['Kakashi: Shadow of the ANBU Black Ops', "Kakashi's Anbu Arc: The Shinobi That Lives in the Darkness", 'Anime-only arc. English season sub-title (Wikipedia, season 16); Anbu\'s English TV name is "Anbu Black Ops".'],
  ["Birth of the Ten-Tails' Jinchuriki", "Birth of the Ten-Tails' Jinchūriki", 'Macron dropped.'],
  ['Kaguya Otsutsuki Strikes', 'Kaguya Ōtsutsuki Strikes', 'Macron dropped.'],
]) set(n, p, 'V', note);

// ---- nodes: English dub episode titles (generated from the Wikipedia/Narutopedia episode lists)
const nodes2 = {
  'The Results of Training': ['The Results of Training', 'V', 'Dub title of ep 3 (Wikipedia, Naruto: Shippuden season 1).'],
  'The Kazekage Stands Tall': ['The Kazekage Stands Tall', 'V', 'Dub title of ep 5 (Wikipedia, Naruto: Shippuden season 1).'],
  'Traps Activate! Team Guy\'s Enemy': ['Traps Activate! Team Guy\'s Enemies!', 'V', 'Dub title of ep 19 (Wikipedia, Naruto: Shippuden season 1); Narutopedia: "Traps Activate! Team Guy\'s Enemies!".'],
  'Puppet Fight: 10 vs. 100!': ['Puppet Fight: 10 vs 100!', 'V', 'Dub title of ep 26 (Wikipedia, Naruto: Shippuden season 1); Narutopedia: "Puppet Fight: 10 vs 100!".'],
  'Kakashi Enlightened!': ['Kakashi Enlightened!', 'V', 'Dub title of ep 29 (Wikipedia, Naruto: Shippuden season 1).'],
  'Simulation': ['Simulation', 'V', 'Dub title of ep 38 (Wikipedia, Naruto: Shippuden season 2).'],
  'The Tenchi Bridge': ['The Tenchi Bridge (episode)', 'V', 'Dub title of ep 39 (Wikipedia, Naruto: Shippuden season 2).'],
  'Orochimaru vs. Jinchuriki': ['Orochimaru vs. Jinchūriki', 'V', 'Dub title of ep 42 (Wikipedia, Naruto: Shippuden season 2); Narutopedia: "Orochimaru vs. Jinchūriki".'],
  'The Power of Uchiha': ['The Power of the Uchiha', 'V', 'Dub title of ep 52 (Wikipedia, Naruto: Shippuden season 2); Narutopedia: "The Power of the Uchiha".'],
  'Revived Souls': ['Revived Souls', 'V', 'Dub title of ep 66 (Wikipedia, Naruto: Shippuden season 3).'],
  'Despair': ['Despair', 'V', 'Dub title of ep 69 (Wikipedia, Naruto: Shippuden season 3).'],
  'My Friend': ['My Friend', 'V', 'Dub title of ep 71 (Wikipedia, Naruto: Shippuden season 3).'],
  'Climbing Silver': ['Climbing Silver', 'V', 'Dub title of ep 77 (Wikipedia, Naruto: Shippuden season 4).'],
  'Kakuzu\'s Abilities': ['Kakuzu\'s Abilities', 'V', 'Dub title of ep 84 (Wikipedia, Naruto: Shippuden season 4).'],
  'Shikamaru\'s Genius': ['Shikamaru\'s Genius', 'V', 'Dub title of ep 86 (Wikipedia, Naruto: Shippuden season 4).'],
  'Wind Style: Rasen Shuriken!': ['Wind Release: Rasenshuriken!', 'V', 'Dub title of ep 88 (Wikipedia, Naruto: Shippuden season 4); Narutopedia: "Wind Release: Rasenshuriken!".'],
  'The Unseeing Enemy': ['The Unseeing Enemy', 'V', 'Dub title of ep 96 (Wikipedia, Naruto: Shippuden season 5).'],
  'Breaking the Crystal Style': ['Breaking the Crystal Release', 'V', 'Dub title of ep 104 (Wikipedia, Naruto: Shippuden season 5); Narutopedia: "Breaking the Crystal Release".'],
  'Shattered Promise': ['Shattered Promise', 'V', 'Dub title of ep 111 (Wikipedia, Naruto: Shippuden season 5).'],
  'Jugo of the North Hideout': ['Jūgo of the Northern Hideout', 'V', 'Dub title of ep 117 (Wikipedia, Naruto: Shippuden season 6); Narutopedia: "Jūgo of the Northern Hideout".'],
  'Clash!': ['Clash!', 'V', 'Dub title of ep 123 (Wikipedia, Naruto: Shippuden season 6).'],
  'Art': ['Art', 'V', 'Dub title of ep 124 (Wikipedia, Naruto: Shippuden season 6).'],
  'Infiltrate! The Village Hidden in the Rain': ['Infiltrate! The Village Hidden in the Rain', 'V', 'Dub title of ep 129 (Wikipedia, Naruto: Shippuden season 6).'],
  'The Man Who Became God': ['The Man Who Became God', 'V', 'Dub title of ep 130 (Wikipedia, Naruto: Shippuden season 6).'],
  'Honored Sage Mode!': ['Honoured Sage Mode!', 'V', 'Dub title of ep 131 (Wikipedia, Naruto: Shippuden season 6); Narutopedia: "Honoured Sage Mode!".'],
  'In Attendance, the Six Paths of Pain': ['In Attendance, the Six Paths of Pain', 'V', 'Dub title of ep 132 (Wikipedia, Naruto: Shippuden season 6).'],
  'Banquet Invitation': ['Banquet Invitation', 'V', 'Dub title of ep 134 (Wikipedia, Naruto: Shippuden season 6).'],
  'Amaterasu!': ['Amaterasu!', 'V', 'Dub title of ep 137 (Wikipedia, Naruto: Shippuden season 6).'],
  'Battle of Unraikyo': ['Battle of Valley of Clouds and Lightning', 'V', 'Dub title of ep 142 (Wikipedia, Naruto: Shippuden season 6); Narutopedia: "Battle of Valley of Clouds and Lightning".'],
  'The Eight-Tails vs. Sasuke': ['The Eight-Tails vs. Sasuke', 'V', 'Dub title of ep 143 (Wikipedia, Naruto: Shippuden season 6).'],
  'The Successor\'s Wish': ['The Successor\'s Wish', 'V', 'Dub title of ep 146 (Wikipedia, Naruto: Shippuden season 7).'],
  'The Forbidden Jutsu Released': ['The Forbidden Jutsu Released', 'V', 'Dub title of ep 150 (Wikipedia, Naruto: Shippuden season 7).'],
  'Master and Student': ['Master and Student', 'V', 'Dub title of ep 151 (Wikipedia, Naruto: Shippuden season 7).'],
  'Assault on the Leaf Village!': ['Assault on the Leaf Village!', 'V', 'Dub title of ep 157 (Wikipedia, Naruto: Shippuden season 8).'],
  'Pain vs. Kakashi': ['Pain vs. Kakashi', 'V', 'Dub title of ep 159 (Wikipedia, Naruto: Shippuden season 8).'],
  'Surname Is Sarutobi. Given Name, Konohamaru!': ['Surname is Sarutobi, Given Name, Konohamaru', 'V', 'Dub title of ep 161 (Wikipedia, Naruto: Shippuden season 8); Narutopedia: "Surname is Sarutobi, Given Name, Konohamaru".'],
  'Explode! Sage Mode': ['Explode! Sage Mode', 'V', 'Dub title of ep 163 (Wikipedia, Naruto: Shippuden season 8).'],
  'Racing Lightning': ['Racing Lightning', 'V', 'Dub title of ep 202 (Wikipedia, Naruto: Shippuden season 10).'],
  'The Tailed Beast vs. The Tailless Tailed Beast': ['The Tailed Beast vs. The Tailless Tailed Beast', 'V', 'Dub title of ep 207 (Wikipedia, Naruto: Shippuden season 10).'],
  'The Burden': ['The Burden', 'V', 'Dub title of ep 214 (Wikipedia, Naruto: Shippuden season 10).'],
  'Killer Bee and Motoi': ['Killer B and Motoi (episode)', 'V', 'Dub title of ep 244 (Wikipedia, Naruto: Shippuden season 12); Narutopedia: "Killer B and Motoi".'],
  'Target: Nine Tails': ['Target: Nine-Tails', 'V', 'Dub title of ep 247 (Wikipedia, Naruto: Shippuden season 12); Narutopedia: "Target: Nine-Tails".'],
  'Battle in Paradise! Odd Beast vs. The Monster!': ['Battle in Paradise! Odd Beast vs. The Monster!', 'V', 'Dub title of ep 250 (Wikipedia, Naruto: Shippuden season 12).'],
  'The Angelic Herald of Death': ['The Angelic Herald of Death', 'V', 'Dub title of ep 252 (Wikipedia, Naruto: Shippuden season 12).'],
  'The First and Last Opponent': ['The First and Last Opponent', 'V', 'Dub title of ep 266 (Wikipedia, Naruto: Shippuden season 12).'],
  'Golden Bonds': ['Golden Bonds (episode)', 'V', 'Dub title of ep 270 (Wikipedia, Naruto: Shippuden season 12).'],
  'The Complete Ino-Shika-Cho Formation!': ['The Complete Ino-Shika-Chō Formation', 'V', 'Dub title of ep 274 (Wikipedia, Naruto: Shippuden season 12); Narutopedia: "The Complete Ino-Shika-Chō Formation".'],
  'The Acknowledged One': ['The Acknowledged One', 'V', 'Dub title of ep 299 (Wikipedia, Naruto: Shippuden season 14).'],
  'Gaara and Onoki vs. Mu': ['The Mizukage, the Giant Clam, and the Mirage', 'D', 'Descriptive; the fight is in ep 300 (dub title "The Mizukage, the Giant Clam, and the Mirage", which names a different fight).'],
  'The Five Kage Assemble': ['The Five Kage Assemble', 'V', 'Dub title of ep 323 (Wikipedia, Naruto: Shippuden season 15).'],
  'Four Tails, the King of Sage Monkeys': ['Four-Tails, the King of Sage Monkeys', 'V', 'Dub title of ep 326 (Wikipedia, Naruto: Shippuden season 15); Narutopedia: "Four-Tails, the King of Sage Monkeys".'],
  'The Izanami Activated': ['The Izanami Activated', 'V', 'Dub title of ep 337 (Wikipedia, Naruto: Shippuden season 15).'],
  'Team 7, Assemble!': ['Team 7, Assemble!', 'V', 'Dub title of ep 373 (Wikipedia, Naruto: Shippuden season 18).'],
  'Kakashi vs. Obito': ['Kakashi vs. Obito', 'V', 'Dub title of ep 375 (Wikipedia, Naruto: Shippuden season 18).'],
  'Hashirama\'s Cells': ['Hashirama\'s Cells', 'V', 'Dub title of ep 351 (Wikipedia, Naruto: Shippuden season 16).'],
  'Orochimaru\'s Test Subject': ['Orochimaru\'s Test Subject', 'V', 'Dub title of ep 353 (Wikipedia, Naruto: Shippuden season 16).'],
  'The Targeted Sharingan': ['The Targeted Sharingan', 'V', 'Dub title of ep 355 (Wikipedia, Naruto: Shippuden season 16).'],
  'The Ten Tails\' Jinchuriki': ['The Ten-Tails\' Jinchūriki (episode)', 'V', 'Dub title of ep 378 (Wikipedia, Naruto: Shippuden season 18); Narutopedia: "The Ten-Tails\' Jinchūriki".'],
  'The Blue Beast vs. Six Paths Madara': ['The Blue Beast vs. Six Paths Madara', 'V', 'Dub title of ep 418 (Wikipedia, Naruto: Shippuden season 20).'],
  'The Eight Inner Gates Formation': ['Eight Gates Released Formation (episode)', 'V', 'Dub title of ep 420 (Wikipedia, Naruto: Shippuden season 20); Narutopedia: "Eight Gates Released Formation".'],
  'She of the Beginning': ['She of the Beginning', 'V', 'Dub title of ep 459 (Wikipedia, Naruto: Shippuden season 21).'],
  'The Sharingan Revived': ['The Sharingan Revived', 'V', 'Dub title of ep 473 (Wikipedia, Naruto: Shippuden season 21).'],
  'The Final Battle': ['The Final Battle', 'V', 'Dub title of ep 476 (Wikipedia, Naruto: Shippuden season 21).'],
  'Naruto and Sasuke': ['Naruto and Sasuke', 'V', 'Dub title of ep 477 (Wikipedia, Naruto: Shippuden season 21).'],
  // banners: English DVD/season sub-titles (Wikipedia "Naruto: Shippuden season N" episode tables)
  'Kazekage Rescue': ['Kazekage Rescue Mission', 'V', 'English season sub-title (season 1); also the anime\'s short arc name.'],
  'New Team Kakashi': ['Formation! New Team Kakashi!', 'V', 'From the ep 34 dub title "Formation! New Team Kakashi!".'],
  'Immortal Devastators': ['Akatsuki Suppression Mission', 'V', 'English season sub-title "Immortal Devastators — Hidan and Kakuzu" (season 4), shortened.'],
  'The Three-Tailed Demon Turtle': ["Three-Tails' Appearance", 'V', 'English season sub-title (season 5).'],
  'Taka': ['Taka', 'V', 'Team article; English name field "Taka".'],
  'Tales of a Gutsy Ninja': ['Tale of Jiraiya the Gallant', 'V', 'English season sub-title "Tales of a Gutsy Ninja ~Jiraiya Ninja Scroll~" (season 6), shortened.'],
  "Master's Prophecy and Vengeance": ['Fated Battle Between Brothers', 'V', 'English season sub-title (season 6).'],
  'The Six-Tailed Demon Slug': ['Six-Tails Unleashed', 'V', 'English season sub-title (season 7).'],
  'Two Saviors': ["Pain's Assault (Arc)", 'V', 'English season sub-title (season 8).'],
  'The Gathering of the Five Kage': ['Five Kage Summit (Arc)', 'V', 'English season sub-title (season 10).'],
  'Nine-Tails Taming and Karmic Encounters': ['Fourth Shinobi World War: Countdown', 'V', 'English season sub-title (season 12).'],
  'Assailants From Afar': ['Fourth Shinobi World War: Confrontation', 'V', 'English season sub-title "The Fourth Great Ninja War: Assailants From Afar" (season 14), shortened.'],
  'The Return of Team 7': ['Fourth Shinobi World War: Climax', 'V', 'English season sub-title "The Fourth Great Ninja War: The Return of Team 7" (season 17), shortened.'],
  'Shadow of the ANBU Black Ops': ["Kakashi's Anbu Arc: The Shinobi That Lives in the Darkness", 'V', 'English season sub-title "Kakashi: Shadow of the ANBU Black Ops" (season 16), shortened.'],
  'The Chapter of Naruto and Sasuke': ['Kaguya Ōtsutsuki Strikes', 'V', 'English season sub-title (season 21).'],
};
for (const [n, [p, st, note]] of Object.entries(nodes2)) set(n, p, st, note);
// Names that are both a node and a character/jutsu keep the combined notes set above.
S['Obito Uchiha'] = { page: 'Obito Uchiha', status: 'V', note: 'Article title. Also the dub title of ep 385 (Wikipedia, season 18), used as a node and as the Obito banner name ("The Fourth Great Ninja War: Obito Uchiha", season 18).' };

export const NAME_SOURCES = S;
export const wikiUrl = (t) => `https://naruto.fandom.com/wiki/${encodeURI(t.replace(/ /g, '_'))}`;
