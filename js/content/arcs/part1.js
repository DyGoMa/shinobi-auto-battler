// arcs/part1.js — Part I story arcs, in anime episode order (verified on
// Narutopedia, see NAMING.md). Pure data; see CONTENT_GUIDE.md.
//
// Arc:  { id, part, order, name, episodes, blurb, banner, theme, nodes: [...] }
// Node: {
//   id, name, episodes, blurb,
//   enemies:   [{ id: enemyId, boss?: true, delay?: seconds }]
//   objective: { type: 'defeatAll' }
//            | { type: 'survive', seconds }            (also wins if every enemy falls)
//            | { type: 'protect', protect: civilianId, seconds? }
//            | { type: 'defeatBoss' }                   (only units with boss:true matter)
//   team?:     { forced: [ids], leader: id|'none', banned: [ids], recommended: [ids] }
//              forced characters you don't own join as level-matched loaners.
//   onboarding?: true   shows the first-battle tooltips
// }
// The LAST node of every arc must contain a boss (validated).
// Enemy level and rewards come from the node's GLOBAL index via balance.js.

export const PART1_ARCS = [
  // ---------------------------------------------------------------------------
  {
    id: 'arc_belltest', part: 1, order: 1, name: 'Prologue: Bell Test', episodes: '4–5',
    blurb: 'Kakashi Hatake gives Team 7 until noon to take two bells from him. Pass or fail — it all comes down to teamwork.',
    banner: 'banner_belltest',
    theme: { sky: ['#9bd4ff', '#e8f6ff'], ground: '#5fa04e', far: '#3f7d3a', accent: '#f97316' },
    nodes: [
      {
        id: 'n_bell_1', name: 'Pass or Fail: Survival Test', episodes: '4',
        blurb: 'Survive 45 seconds against Kakashi — or take him down.',
        enemies: [{ id: 'e_kakashi_bell' }],
        objective: { type: 'survive', seconds: 45 },
        team: { forced: ['naruto', 'sakura', 'sasuke'], leader: 'none', banned: ['kakashi'] },
        onboarding: true,
      },
      {
        id: 'n_bell_2', name: 'One Thousand Years of Death', episodes: '4',
        blurb: 'Naruto charges in alone. Kakashi answers with a Substitution Jutsu and a very unfortunate finger jab.',
        enemies: [{ id: 'e_kakashi_bell2' }],
        objective: { type: 'defeatAll' },
        team: { forced: ['naruto'], banned: ['kakashi'], recommended: ['sakura', 'sasuke'] },
      },
      {
        id: 'n_bell_3', name: 'The Final Bell', episodes: '5',
        blurb: 'Kakashi stops holding back: Death Mirage genjutsu, Headhunter Jutsu, and a log where you expected a Jonin.',
        enemies: [{ id: 'e_kakashi_bell_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { banned: ['kakashi'], recommended: ['naruto', 'sakura', 'sasuke'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_waves', part: 1, order: 2, name: 'Land of Waves', episodes: '6–19',
    blurb: 'A simple escort mission for the bridge builder Tazuna turns into a clash with the Demon of the Hidden Mist.',
    banner: 'banner_waves',
    theme: { sky: ['#9fb4c7', '#e3edf5'], ground: '#6b8fa3', far: '#48687d', accent: '#38bdf8' },
    nodes: [
      {
        id: 'n_waves_1', name: 'The Demon Brothers', episodes: '6',
        blurb: 'Gozu and Meizu ambush the escort. Meizu goes straight for Tazuna — keep him alive!',
        enemies: [{ id: 'e_gozu' }, { id: 'e_meizu' }],
        objective: { type: 'protect', protect: 'npc_tazuna' },
        team: { recommended: ['kakashi', 'naruto', 'sasuke', 'sakura'] },
      },
      {
        id: 'n_waves_2', name: 'Water Prison Jutsu', episodes: '7–9',
        blurb: 'Zabuza Momochi traps Kakashi in a Water Prison and sends Water Clones after the genin.',
        enemies: [{ id: 'e_zabuza_1' }],
        objective: { type: 'defeatAll' },
        team: { recommended: ['kakashi', 'naruto', 'sasuke'] },
      },
      {
        id: 'n_waves_3', name: 'Zori and Waraji', episodes: '13',
        blurb: "Gato's samurai thugs come for Tsunami. Zori runs past everyone — protect her.",
        enemies: [{ id: 'e_zori' }, { id: 'e_waraji' }],
        objective: { type: 'protect', protect: 'npc_tsunami' },
        team: { recommended: ['naruto'] },
      },
      {
        id: 'n_waves_4', name: 'Secret Jutsu: Crystal Ice Mirrors', episodes: '12–17',
        blurb: 'Haku traps Naruto and Sasuke inside a dome of ice mirrors, shifting between Water and Wind.',
        enemies: [{ id: 'e_haku' }],
        objective: { type: 'defeatAll' },
        team: { forced: ['naruto', 'sasuke'] },
      },
      {
        id: 'n_waves_5', name: 'Showdown on the Bridge', episodes: '15–19',
        blurb: "Kakashi's Lightning Blade against Zabuza's Water Dragon — and Gato's thugs arrive late to the party.",
        enemies: [{ id: 'e_zabuza_boss', boss: true }, { id: 'e_gato_thug', delay: 22 }, { id: 'e_gato_thug', delay: 24 }],
        objective: { type: 'defeatBoss' },
        team: { recommended: ['kakashi', 'naruto', 'sasuke', 'sakura'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_chunin', part: 1, order: 3, name: 'Chunin Exams', episodes: '20–67',
    blurb: 'The Forest of Death, the preliminaries and the finals. Rookies from every village want that Chunin vest.',
    banner: 'banner_chunin',
    theme: { sky: ['#6a8f5a', '#c9dfb8'], ground: '#3d5e2e', far: '#2a4520', accent: '#a3e635' },
    nodes: [
      {
        id: 'n_chunin_1', name: 'Forest of Death: The Grass Ninja', episodes: '28–30',
        blurb: 'A "Grass ninja" turns out to be Orochimaru. You cannot win this — survive for 40 seconds.',
        enemies: [{ id: 'e_orochimaru_forest' }],
        objective: { type: 'survive', seconds: 40 },
        team: { recommended: ['naruto', 'sasuke', 'sakura'] },
      },
      {
        id: 'n_chunin_2', name: 'Forest of Death: Sound Ninja Ambush', episodes: '31–33',
        blurb: 'Dosu, Zaku and Kin attack the exhausted Team 7. Rock Lee and Team 10 jump in.',
        enemies: [{ id: 'e_dosu' }, { id: 'e_zaku' }, { id: 'e_kin' }],
        objective: { type: 'defeatAll' },
        team: { recommended: ['lee', 'sakura', 'ino', 'shikamaru', 'choji'] },
      },
      {
        id: 'n_chunin_3', name: 'Forest of Death: Team Oboro', episodes: '35–36',
        blurb: "Oboro's Misty Follower Jutsu fills the forest with fakes while Mubi and Kagari strike.",
        enemies: [{ id: 'e_oboro' }, { id: 'e_mubi' }, { id: 'e_kagari' }],
        objective: { type: 'defeatAll' },
        team: { recommended: ['naruto', 'sasuke', 'sakura'] },
      },
      {
        id: 'n_chunin_4', name: 'Preliminaries: Yoroi and Misumi', episodes: '38–40',
        blurb: "Kabuto's teammates: Yoroi drains chakra on contact, Misumi bends like rubber.",
        enemies: [{ id: 'e_yoroi' }, { id: 'e_misumi' }],
        objective: { type: 'defeatAll' },
        team: { recommended: ['sasuke', 'kankuro'] },
      },
      {
        id: 'n_chunin_5', name: 'Finals: Naruto vs. Neji', episodes: '60–63',
        blurb: 'Neji spins into Eight Trigrams: Palm Rotation — damage bounces back while it lasts. Watch for the Sixty-Four Palms wind-up.',
        enemies: [{ id: 'e_neji_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { banned: ['neji'], recommended: ['naruto'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_konoha_crush', part: 1, order: 4, name: 'Destruction of the Hidden Leaf Village', episodes: '68–80',
    blurb: 'Zero hour: the Sand and Sound invade during the finals, and Orochimaru faces his old teacher.',
    banner: 'banner_konoha',
    theme: { sky: ['#e59866', '#f6d7b0'], ground: '#9c6b3f', far: '#7a4f2c', accent: '#ef4444' },
    nodes: [
      {
        id: 'n_crush_1', name: 'Zero Hour', episodes: '68–70',
        blurb: 'Sand and Sound ninja pour over the walls in waves.',
        enemies: [{ id: 'e_sand_ninja' }, { id: 'e_sound_ninja' }, { id: 'e_sand_ninja', delay: 8 }, { id: 'e_sound_ninja', delay: 14 }],
        objective: { type: 'defeatAll' },
        team: { recommended: ['shikamaru', 'kakashi', 'guy'] },
      },
      {
        id: 'n_crush_2', name: 'Shino vs. Kankuro', episodes: '72–74',
        blurb: 'Kankuro stays behind to stall the pursuit, with Temari close by.',
        enemies: [{ id: 'e_kankuro' }, { id: 'e_temari' }],
        objective: { type: 'defeatAll' },
        team: { recommended: ['shino', 'sasuke'] },
      },
      {
        id: 'n_crush_3', name: "The Third Hokage's Last Stand", episodes: '69–80',
        blurb: 'Flashback-style node: fight as the Third Hokage. The reanimated First and Second guard Orochimaru — only Orochimaru has to fall.',
        enemies: [{ id: 'e_hashirama' }, { id: 'e_tobirama' }, { id: 'e_orochimaru_crush', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { forced: ['hiruzen'], leader: 'hiruzen' },
      },
      {
        id: 'n_crush_4', name: 'Naruto vs. Gaara', episodes: '75–80',
        blurb: "Gaara's Sand Shield soaks damage, Wind Style: Air Bullet hits everyone, and Play Possum Jutsu unleashes the One-Tail.",
        enemies: [{ id: 'e_gaara_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { recommended: ['naruto', 'sasuke', 'sakura'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_tsunade', part: 1, order: 5, name: 'Search for Tsunade', episodes: '81–100',
    blurb: 'Itachi and Kisame hunt Naruto while Jiraiya searches for the Legendary Sucker in Tanzaku Town.',
    banner: 'banner_tsunade',
    theme: { sky: ['#7c7aa8', '#d7d3ee'], ground: '#5b5877', far: '#3f3c58', accent: '#a78bfa' },
    nodes: [
      {
        id: 'n_tsunade_1', name: 'Itachi and Kisame', episodes: '81–82',
        blurb: 'Two Akatsuki at the village gates. Hold on for 45 seconds until Might Guy arrives.',
        enemies: [{ id: 'e_kisame' }, { id: 'e_itachi' }],
        objective: { type: 'survive', seconds: 45 },
        team: { recommended: ['asuma', 'kurenai', 'kakashi'] },
      },
      {
        id: 'n_tsunade_2', name: "Tsunade's Bet", episodes: '90–91',
        blurb: 'Tsunade fights Naruto with one finger. Last 30 seconds to win the bet.',
        enemies: [{ id: 'e_tsunade_bet' }],
        objective: { type: 'survive', seconds: 30 },
        team: { forced: ['naruto'], banned: ['tsunade'] },
      },
      {
        id: 'n_tsunade_3', name: 'Kabuto in Tanzaku Town', episodes: '93–94',
        blurb: "Kabuto's Chakra Scalpel cuts from the inside, and his Healing Jutsu keeps him standing.",
        enemies: [{ id: 'e_kabuto' }],
        objective: { type: 'defeatAll' },
        team: { banned: ['kabuto'], recommended: ['naruto', 'shizune', 'jiraiya'] },
      },
      {
        id: 'n_tsunade_4', name: 'Deadlock! Sannin Showdown!', episodes: '95–96',
        blurb: 'Orochimaru summons Manda. Two Sannin against one.',
        enemies: [{ id: 'e_orochimaru_boss', boss: true }, { id: 'e_kabuto', delay: 6 }],
        objective: { type: 'defeatBoss' },
        team: { banned: ['orochimaru', 'kabuto'], recommended: ['jiraiya', 'tsunade', 'naruto', 'shizune'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_tea', part: 1, order: 6, name: 'Land of Tea Escort Mission', episodes: '102–106',
    blurb: "Team 7 — without Kakashi — escorts the runner Idate Morino to the Todoroki Shrine race.",
    banner: 'banner_tea',
    theme: { sky: ['#86b6a0', '#dff1e7'], ground: '#4f8a6e', far: '#356b53', accent: '#34d399' },
    nodes: [
      {
        id: 'n_tea_1', name: 'Ambush at Sea', episodes: '103–104',
        blurb: "Team Oboro, hired by the Wagarashi family, goes after Idate. Mubi tunnels straight for him.",
        enemies: [{ id: 'e_oboro' }, { id: 'e_mubi' }, { id: 'e_kagari_tea' }],
        objective: { type: 'protect', protect: 'npc_idate' },
        team: { banned: ['kakashi'], recommended: ['naruto', 'sasuke', 'sakura'] },
      },
      {
        id: 'n_tea_2', name: 'Ninja Art: Senbon Rainstorm', episodes: '104',
        blurb: "Aoi Rokusho opens his umbrella and it rains poisoned needles.",
        enemies: [{ id: 'e_aoi' }, { id: 'e_kagari_tea', delay: 10 }],
        objective: { type: 'defeatAll' },
        team: { banned: ['kakashi'], recommended: ['naruto', 'sasuke', 'sakura'] },
      },
      {
        id: 'n_tea_3', name: 'Blade of the Thunder Spirit', episodes: '105–106',
        blurb: "Aoi draws the Second Hokage's sword: his attacks turn to Lightning.",
        enemies: [{ id: 'e_aoi_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { banned: ['kakashi'], recommended: ['naruto', 'sasuke'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_sasuke_recovery', part: 1, order: 7, name: 'Sasuke Retrieval Squad', episodes: '107–135',
    blurb: 'Shikamaru leads the new squad after the Sound Four and Sasuke — one fight at a time.',
    banner: 'banner_sasuke',
    theme: { sky: ['#5b6b8c', '#b9c5dc'], ground: '#465066', far: '#2f374a', accent: '#60a5fa' },
    nodes: [
      {
        id: 'n_sr_1', name: 'Earth Style Barrier: Earth Dome Prison', episodes: '111–114',
        blurb: 'Jirobo drains chakra from everything he touches. Choji stays behind.',
        enemies: [{ id: 'e_jirobo' }],
        objective: { type: 'defeatAll' },
        team: { banned: ['jirobo'], recommended: ['choji', 'shikamaru'] },
      },
      {
        id: 'n_sr_2', name: 'Spider Bow: Fierce Rip', episodes: '115–117',
        blurb: "Kidomaru snipes your back line from the trees. Neji finds the blind spot.",
        enemies: [{ id: 'e_kidomaru' }],
        objective: { type: 'defeatAll' },
        team: { banned: ['kidomaru'], recommended: ['neji'] },
      },
      {
        id: 'n_sr_3', name: 'Reinforcements from the Sand', episodes: '119–125',
        blurb: 'Sakon and Ukon, and Tayuya with her Doki — just as the Sand Siblings arrive.',
        enemies: [{ id: 'e_sakon' }, { id: 'e_tayuya' }],
        objective: { type: 'defeatAll' },
        team: { banned: ['sakon', 'tayuya'], recommended: ['kankuro', 'temari', 'kiba', 'shikamaru'] },
      },
      {
        id: 'n_sr_4', name: 'Bracken Dance', episodes: '123–127',
        blurb: 'Kimimaro, last of his clan. Larch Dance punishes reckless hits.',
        enemies: [{ id: 'e_kimimaro', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { banned: ['kimimaro'], recommended: ['lee', 'gaara'] },
      },
      {
        id: 'n_sr_5', name: 'Final Valley', episodes: '128–134',
        blurb: "Chidori against Rasengan. Sasuke's Heavens' Curse Mark brings him back once.",
        enemies: [{ id: 'e_sasuke_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { banned: ['sasuke', 'sasuke_cursemark'], recommended: ['naruto'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_kurosuki', part: 1, order: 8, name: 'Kurosuki Family Removal Mission', episodes: '152–157',
    blurb: 'Naruto and Team Guy take on Raiga Kurosuki, the Thunder of the Hidden Mist, and his funeral-obsessed family.',
    banner: 'banner_kurosuki',
    theme: { sky: ['#475569', '#94a3b8'], ground: '#334155', far: '#1e293b', accent: '#facc15' },
    nodes: [
      {
        id: 'n_kuro_1', name: 'Funeral March for the Living', episodes: '152–153',
        blurb: 'Rokusuke is about to be buried alive by the Kurosuki family. Get him out.',
        enemies: [{ id: 'e_kurosuki' }, { id: 'e_kurosuki_diver' }, { id: 'e_kurosuki', delay: 6 }],
        objective: { type: 'protect', protect: 'npc_rokusuke' },
        team: { recommended: ['naruto', 'neji', 'lee', 'tenten'] },
      },
      {
        id: 'n_kuro_2', name: 'Raiga and Ranmaru', episodes: '153–154',
        blurb: 'Ranmaru sees through the mist for Raiga. Take out the eyes, then the sword.',
        enemies: [{ id: 'e_raiga' }, { id: 'e_ranmaru' }],
        objective: { type: 'defeatAll' },
        team: { recommended: ['naruto', 'neji', 'lee', 'tenten'] },
      },
      {
        id: 'n_kuro_3', name: 'Thunder Funeral: Feast of Lightning', episodes: '156–157',
        blurb: 'Raiga returns in the storm, wrapped in Thunder Armour.',
        enemies: [{ id: 'e_raiga_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { recommended: ['naruto', 'neji', 'lee', 'tenten'] },
      },
    ],
  },
];

export default PART1_ARCS;
