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
set('Naruto Uzumaki (Nine-Tails Chakra)', 'Kurama', 'P', 'Alternate-form label. "Nine-Tails" per the style guide; Narutopedia\'s English TV name for the fox is "Nine-Tailed Fox" — both are dub-acceptable.');
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
set('Six Paths of Pain', 'Six Paths of Pain', 'P', 'Narutopedia article title; no English TV field found — assumed unchanged in the dub.');

// ---- descriptive labels (never presented as canon technique names) -----------
for (const n of ['Water Clone', "Gato's Thug", 'Misty Follower', 'Sand Ninja', 'Sound Ninja', 'Puppet', 'Itachi (Shadow Clone)', 'Kurosuki Family Member', 'Chakra absorption', 'Immortality', "Ranmaru's eyes guide Raiga", 'Kurosuki Family ambush'])
  set(n, null, 'D', 'Descriptive in-game label, not a canon technique name.');
S['Chakra absorption'].page = 'Yoroi Akadō'; S['Chakra absorption'].note = 'Descriptive: Yoroi\'s Part 1 chakra drain is unnamed on Narutopedia.';
S['Immortality'].page = 'Hidan'; S['Kurosuki Family Member'].page = 'Kurosuki Family'; S["Gato's Thug"].page = 'Gatō';
set('Demon of the Hidden Mist', 'Zabuza Momochi', 'V', 'Zabuza\'s epithet, from the article\'s English name field.');
set('Thunder of the Hidden Mist', 'Raiga Kurosuki', 'V', 'Raiga\'s epithet, from the article.');

// ---- arcs, nodes, banners ------------------------------------------------------
set('Prologue: Bell Test', 'Bell Test', 'P', 'Narutopedia article "Bell Test" (inside "Prologue — Land of Waves", eps 4–5). The ep 4 dub title calls it the "Survival Test"; the name is kept from the design brief.');
set('Land of Waves', 'Land of Waves', 'V');
set('Chunin Exams', 'Chūnin Exams (Arc)', 'V', 'Dub spelling "Chunin".');
set('Destruction of the Hidden Leaf Village', 'Zero Hour! The Konoha Crush Begins!', 'V', 'Dub title of ep 68 ("Zero Hour! The Destruction of the Hidden Leaf Village Begins!"). Narutopedia/Viz call the arc "Konoha Crush"; the brief used that name — changed per the dub rule.');
set('Search for Tsunade', 'Search for Tsunade', 'V');
set('Land of Tea Escort Mission', 'Land of Tea Escort Mission', 'V', 'Anime-only (filler) arc name on Narutopedia.');
set('Sasuke Retrieval Squad', 'Sasuke Recovery Mission', 'V', 'Dub title of ep 110 ("Formation! The Sasuke Retrieval Squad"). Narutopedia arc: "Sasuke Recovery Mission" — the brief used that name; changed per the dub rule. Internal id stays arc_sasuke_recovery.');
set('Kurosuki Family Removal Mission', 'Kurosuki Family Removal Mission', 'V', 'Anime-only (filler) arc name on Narutopedia.');
for (const n of ['Kazekage Rescue Mission', 'Tenchi Bridge Reconnaissance Mission', 'Akatsuki Suppression Mission', 'Itachi Pursuit Mission', 'Tale of Jiraiya the Gallant', 'Fated Battle Between Brothers', "Pain's Assault", 'Five Kage Summit'])
  set(n, 'Plot of Naruto', 'V', 'Part II placeholder — Narutopedia arc name, anime order.');
set('Fourth Great Ninja War', 'Fourth Shinobi World War', 'V', 'English TV name of the Fourth Shinobi World War (one placeholder for its arcs).');
const nodes = {
  'Pass or Fail: Survival Test': ['Pass or Fail: Survival Test', 'V', 'Dub title of ep 4.'],
  'One Thousand Years of Death': ['One Thousand Years of Death', 'V', 'Short form of the dub jutsu name.'],
  'The Final Bell': [null, 'D'], 'The Demon Brothers': ['Demon Brothers', 'V'], 'Zori and Waraji': ['Zōri', 'V'], 'Showdown on the Bridge': [null, 'D'],
  'Forest of Death: The Grass Ninja': ['Forest of Death', 'D', 'Descriptive; "Forest of Death" has no separate dub name.'],
  'Forest of Death: Sound Ninja Ambush': ['Forest of Death', 'D', 'Descriptive.'], 'Forest of Death: Team Oboro': ['Team Oboro', 'V'],
  'Preliminaries: Yoroi and Misumi': [null, 'D'], 'Finals: Naruto vs. Neji': [null, 'D'], 'Zero Hour': ['Zero Hour! The Konoha Crush Begins!', 'V', 'From the ep 68 dub title.'],
  'Shino vs. Kankuro': [null, 'D'], "The Third Hokage's Last Stand": [null, 'D'], 'Naruto vs. Gaara': [null, 'D'], 'Itachi and Kisame': [null, 'D'], "Tsunade's Bet": [null, 'D'],
  'Kabuto in Tanzaku Town': ['Tanzaku Town', 'D', 'Descriptive; "Tanzaku Town" is the dub name.'],
  'Deadlock! Sannin Showdown!': ['Deadlock! Sannin Showdown!', 'P', 'Episode article title (ep 96); the dub title was not separately confirmed.'],
  'Ambush at Sea': [null, 'D'], 'Reinforcements from the Sand': [null, 'D'], 'Final Valley': ['Valley of the End', 'V', 'English TV name of the Valley of the End.'],
  'Funeral March for the Living': ['Funeral March for the Living', 'V', 'Episode article title (ep 152).'], 'Raiga and Ranmaru': [null, 'D'],
  'Standard Summon': [null, 'D'], 'Team 7 Assembles': [null, 'D'], 'Destruction of the Hidden Leaf': ['Zero Hour! The Konoha Crush Begins!', 'V', 'Short form of the arc name.'],
  'The Legendary Sannin': ['Sannin', 'V'], 'Land of Tea': ['Land of Tea', 'V'],
};
for (const [n, [p, st, note]] of Object.entries(nodes)) set(n, p, st, note || (st === 'D' ? 'Descriptive node/banner title.' : ''));

export const NAME_SOURCES = S;
export const wikiUrl = (t) => `https://naruto.fandom.com/wiki/${encodeURI(t.replace(/ /g, '_'))}`;
