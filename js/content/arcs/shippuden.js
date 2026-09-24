// arcs/shippuden.js — Part II (Naruto: Shippuden) story arcs, in anime episode
// order (verified on Narutopedia, see NAMING.md). Pure data; see CONTENT_GUIDE.md.
//
// Same schema as arcs/part1.js (part: 2). Node names are English dub episode
// titles where a node follows one episode, otherwise descriptive (NAMING.md).
// The LAST node of every arc must contain a boss (validated).
// Enemy level and rewards come from the node's GLOBAL index via balance.js, so
// Part II simply continues Part I's curve.

export const SHIPPUDEN_ARCS = [
  // ---------------------------------------------------------------------------
  {
    id: 'arc_kazekage', part: 2, order: 1, name: 'Kazekage Rescue Mission', episodes: '1–32',
    blurb: 'Two and a half years later, Naruto is back — and Akatsuki has taken Gaara, now the Fifth Kazekage. Team Kakashi and Team Guy race to the Land of Wind.',
    banner: 'banner_kazekage',
    theme: { sky: ['#f2b56b', '#fbe7c6'], ground: '#d4a55f', far: '#b98a4a', accent: '#f59e0b' },
    nodes: [
      {
        id: 'n_kaz_1', name: 'The Results of Training', episodes: '3',
        blurb: 'Kakashi puts the bells back on the table. Naruto and Sakura have to show him what two and a half years of training looks like.',
        enemies: [{ id: 'e_kakashi_kaz' }],
        objective: { type: 'defeatAll' },
        team: { forced: ['naruto', 'sakura'], banned: ['kakashi', 'kakashi_mangekyo'] },
      },
      {
        id: 'n_kaz_2', name: 'The Kazekage Stands Tall', episodes: '5',
        blurb: 'Fight as Gaara. Deidara circles the Hidden Sand on a clay bird and drops C3 on the village — hold the sky for 40 seconds.',
        enemies: [{ id: 'e_deidara_sand' }],
        objective: { type: 'survive', seconds: 40 },
        team: { forced: ['gaara'], leader: 'gaara', banned: ['gaara_kazekage'] },
      },
      {
        id: 'n_kaz_3', name: "Traps Activate! Team Guy's Enemy", episodes: '19',
        blurb: 'The barrier tags come off and Team Guy meets its own copies. Taijutsu against taijutsu.',
        enemies: [{ id: 'e_clone_guy' }, { id: 'e_clone_lee' }, { id: 'e_clone_neji' }, { id: 'e_clone_tenten' }],
        objective: { type: 'defeatAll' },
        team: { forced: ['guy', 'lee', 'neji', 'tenten'] },
      },
      {
        id: 'n_kaz_4', name: 'Puppet Fight: 10 vs. 100!', episodes: '20–26',
        blurb: "Sakura and Chiyo against Sasori. Break Hiruko, then survive the Performance of a Hundred Puppets.",
        enemies: [{ id: 'e_sasori_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { forced: ['sakura', 'chiyo'], banned: ['sasori'] },
      },
      {
        id: 'n_kaz_5', name: 'Kakashi Enlightened!', episodes: '27–30',
        blurb: 'Naruto and Kakashi catch Deidara over the forest. His clay birds never stop coming, and his Clay Clone buys him a second chance.',
        enemies: [{ id: 'e_deidara_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { banned: ['deidara'], recommended: ['naruto', 'kakashi', 'kakashi_mangekyo'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_tenchi', part: 2, order: 2, name: 'Tenchi Bridge Reconnaissance Mission', episodes: '33–53',
    blurb: "A new Team Kakashi — Yamato leading, Sai along — goes to meet Sasori's spy on the Tenchi Bridge, and finds the road to Sasuke.",
    banner: 'banner_tenchi',
    theme: { sky: ['#8aa7b8', '#dce8ee'], ground: '#5b7a5e', far: '#3e5a48', accent: '#22d3ee' },
    nodes: [
      {
        id: 'n_tenchi_1', name: 'Simulation', episodes: '38',
        blurb: "Yamato plays the spy in a mock meeting. Naruto and Sai have to work together — whether they like it or not.",
        enemies: [{ id: 'e_yamato_sim' }],
        objective: { type: 'defeatAll' },
        team: { forced: ['naruto', 'sai'], banned: ['yamato'] },
      },
      {
        id: 'n_tenchi_2', name: 'The Tenchi Bridge', episodes: '39',
        blurb: "Yamato, disguised as Sasori, meets the spy: Kabuto. Then Orochimaru arrives, and the meeting turns into an ambush.",
        enemies: [{ id: 'e_kabuto' }, { id: 'e_orochimaru_p2', delay: 10 }],
        objective: { type: 'defeatAll' },
        team: { forced: ['yamato'], banned: ['kabuto', 'orochimaru'], recommended: ['naruto', 'sakura', 'sai'] },
      },
      {
        id: 'n_tenchi_3', name: 'Orochimaru vs. Jinchuriki', episodes: '40–42',
        blurb: "The Nine-Tails' chakra takes over Naruto. Orochimaru keeps shedding his wounds — keep hitting until he runs out.",
        enemies: [{ id: 'e_orochimaru_p2' }],
        objective: { type: 'defeatAll' },
        team: { forced: ['naruto_ninetails'], banned: ['orochimaru'] },
      },
      {
        id: 'n_tenchi_4', name: 'The Power of Uchiha', episodes: '51–52',
        blurb: 'Sasuke, at last. Chidori Stream electrifies everyone near him, and the Curse Mark pushes him further when he is cornered.',
        enemies: [{ id: 'e_sasuke_tenchi', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { banned: ['sasuke', 'sasuke_cursemark', 'sasuke_ems'], recommended: ['naruto', 'sakura', 'sai', 'yamato'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_twelve', part: 2, order: 3, name: 'Twelve Guardian Ninja', episodes: '54–71',
    blurb: 'Asuma, the Fire Temple monk Sora, and a plot by former Twelve Guardian Ninja to raise the dead against the Leaf.',
    banner: 'banner_twelve',
    theme: { sky: ['#3b3561', '#8a82b8'], ground: '#4a4f5c', far: '#2c2f3d', accent: '#f472b6' },
    nodes: [
      {
        id: 'n_twelve_1', name: 'Revived Souls', episodes: '66',
        blurb: 'Naruto and Yamato take on Fuka and Fudo. Fuka steals chakra with a kiss; Fudo hides behind Rock Armour.',
        enemies: [{ id: 'e_fuka' }, { id: 'e_fudo' }],
        objective: { type: 'defeatAll' },
        team: { recommended: ['naruto', 'yamato', 'sakura', 'asuma'] },
      },
      {
        id: 'n_twelve_2', name: 'Despair', episodes: '69',
        blurb: "The Nine-Tails' chakra planted in Sora breaks loose. You can't beat it — hold on for 40 seconds.",
        enemies: [{ id: 'e_sora' }],
        objective: { type: 'survive', seconds: 40 },
        team: { recommended: ['choji', 'kiba', 'shikamaru', 'lee'] },
      },
      {
        id: 'n_twelve_3', name: 'My Friend', episodes: '71',
        blurb: 'Sai and Asuma corner Kazuma. His Soil Bodies rise again and again until he falls.',
        enemies: [{ id: 'e_kazuma_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { recommended: ['sai', 'asuma', 'naruto'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_hidan', part: 2, order: 4, name: 'Akatsuki Suppression Mission', episodes: '72–88',
    blurb: "Hidan and Kakuzu come for the bounty on Asuma's old comrades. Team 10 wants them to pay for what happens next.",
    banner: 'banner_hidan',
    theme: { sky: ['#5c6f7c', '#c5d2d9'], ground: '#4f5f45', far: '#34422e', accent: '#e11d48' },
    nodes: [
      {
        id: 'n_hidan_1', name: 'Climbing Silver', episodes: '77–78',
        blurb: "Asuma's squad ambushes Hidan at the bounty station. He cannot die — survive 45 seconds of his ritual.",
        enemies: [{ id: 'e_hidan' }],
        objective: { type: 'survive', seconds: 45 },
        team: { recommended: ['asuma', 'shikamaru', 'choji', 'ino'] },
      },
      {
        id: 'n_hidan_2', name: "Kakuzu's Abilities", episodes: '83–84',
        blurb: 'Kakashi joins Team 10. Kakuzu hardens his skin and pulls masked beasts out of his own back.',
        enemies: [{ id: 'e_kakuzu' }],
        objective: { type: 'defeatAll' },
        team: { banned: ['kakuzu'], recommended: ['kakashi', 'shikamaru', 'choji', 'ino'] },
      },
      {
        id: 'n_hidan_3', name: "Shikamaru's Genius", episodes: '85–87',
        blurb: 'Shikamaru alone against Hidan in the Nara forest. Every curse he lands hurts both of you — end it fast.',
        enemies: [{ id: 'e_hidan_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { forced: ['shikamaru'], banned: ['hidan'] },
      },
      {
        id: 'n_hidan_4', name: 'Wind Style: Rasen Shuriken!', episodes: '88',
        blurb: "Naruto's new jutsu against Kakuzu's five hearts. Every heart swaps his nature — read the wheel as it turns.",
        enemies: [{ id: 'e_kakuzu_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { banned: ['kakuzu'], recommended: ['naruto', 'kakashi', 'yamato', 'sakura'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_threetails', part: 2, order: 5, name: "Three-Tails' Appearance", episodes: '89–112',
    blurb: "The Three-Tails surfaces in a lake near the Leaf. Orochimaru's crystal user Guren wants it — and so does Akatsuki.",
    banner: 'banner_threetails',
    theme: { sky: ['#6d8b9a', '#d0e3ea'], ground: '#4a6b6b', far: '#2f4d4f', accent: '#a78bfa' },
    nodes: [
      {
        id: 'n_three_1', name: 'The Unseeing Enemy', episodes: '96',
        blurb: "Kigiri's smoke fills the woods while Nurari slips past the front line. Team Kurenai has to see through it.",
        enemies: [{ id: 'e_kigiri' }, { id: 'e_nurari' }],
        objective: { type: 'defeatAll' },
        team: { recommended: ['hinata', 'kiba', 'shino', 'kurenai'] },
      },
      {
        id: 'n_three_2', name: 'Breaking the Crystal Style', episodes: '104',
        blurb: "Guren's Jade Crystal Mirror throws your hits back at you. Wait out the mirror, then break through.",
        enemies: [{ id: 'e_guren_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { recommended: ['shino', 'kakashi', 'naruto', 'sai'] },
      },
      {
        id: 'n_three_3', name: 'Shattered Promise', episodes: '111',
        blurb: "Yukimaru's grief sends the Three-Tails into a rage. Drive it back under the lake.",
        enemies: [{ id: 'e_three_tails', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { recommended: ['naruto', 'kakashi', 'yamato', 'shino'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_itachi', part: 2, order: 6, name: 'Itachi Pursuit Mission', episodes: '113–118, 121–126',
    blurb: 'Sasuke leaves Orochimaru behind and gathers his own team to hunt Itachi. Akatsuki sends Deidara to stop him.',
    banner: 'banner_itachi',
    theme: { sky: ['#8c6f5a', '#e3d2c3'], ground: '#6b5647', far: '#4a3b31', accent: '#f97316' },
    nodes: [
      {
        id: 'n_itachi_1', name: 'Jugo of the North Hideout', episodes: '117',
        blurb: "The last recruit is Jugo — and his other side does not want to leave the North Hideout.",
        enemies: [{ id: 'e_jugo' }],
        objective: { type: 'defeatAll' },
        team: { forced: ['sasuke'], banned: ['jugo'], recommended: ['suigetsu', 'karin'] },
      },
      {
        id: 'n_itachi_2', name: 'Clash!', episodes: '122–123',
        blurb: "Deidara and Tobi block Sasuke's way. Tobi shrugs off everything, so bring Deidara down first — before the C2 Dragon takes off.",
        enemies: [{ id: 'e_deidara_clash' }, { id: 'e_tobi' }],
        objective: { type: 'defeatAll' },
        team: { forced: ['sasuke'], banned: ['deidara'] },
      },
      {
        id: 'n_itachi_3', name: 'Art', episodes: '124',
        blurb: "C4 Karura, a Clay Clone, and finally C0: Deidara's last work of art.",
        enemies: [{ id: 'e_deidara_art', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { forced: ['sasuke'], banned: ['deidara'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_jiraiya', part: 2, order: 7, name: 'Tale of Jiraiya the Gallant', episodes: '127–133',
    blurb: 'Jiraiya slips into the Village Hidden in the Rain to find the leader of Akatsuki: one of his own students.',
    banner: 'banner_jiraiya',
    theme: { sky: ['#4b5563', '#9ca3af'], ground: '#374151', far: '#1f2937', accent: '#fb923c' },
    nodes: [
      {
        id: 'n_jiraiya_1', name: 'Infiltrate! The Village Hidden in the Rain', episodes: '129',
        blurb: 'Jiraiya goes in alone. The Rain Ninja at the gate are only the start.',
        enemies: [{ id: 'e_rain_ninja' }, { id: 'e_rain_ninja' }, { id: 'e_rain_ninja', delay: 8 }],
        objective: { type: 'defeatAll' },
        team: { forced: ['jiraiya'] },
      },
      {
        id: 'n_jiraiya_2', name: 'The Man Who Became God', episodes: '130',
        blurb: 'Konan, another former student, meets her old teacher in a storm of paper.',
        enemies: [{ id: 'e_konan' }, { id: 'e_rain_ninja', delay: 12 }],
        objective: { type: 'defeatAll' },
        team: { forced: ['jiraiya'], banned: ['konan'] },
      },
      {
        id: 'n_jiraiya_3', name: 'Honored Sage Mode!', episodes: '131',
        blurb: 'Jiraiya enters Sage Mode. Pain answers with a rhino, a bird, a bull and a dog that multiplies.',
        enemies: [{ id: 'e_pain_animal' }, { id: 'e_summoned_beast' }],
        objective: { type: 'defeatAll' },
        team: { forced: ['jiraiya'], banned: ['pain'] },
      },
      {
        id: 'n_jiraiya_4', name: 'In Attendance, the Six Paths of Pain', episodes: '132–133',
        blurb: 'Six Pains stand in front of him, including the three he already beat. The Six Paths of Pain rise once more.',
        enemies: [{ id: 'e_pain_sixpaths', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { forced: ['jiraiya'], banned: ['pain'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_brothers', part: 2, order: 8, name: 'Fated Battle Between Brothers', episodes: '134–143',
    blurb: 'Sasuke finally faces Itachi at the Uchiha hideout. What he learns afterwards sends him after the Eight-Tails.',
    banner: 'banner_brothers',
    theme: { sky: ['#3f1d2b', '#9b5c6e'], ground: '#4a3040', far: '#2a1a25', accent: '#dc2626' },
    nodes: [
      {
        id: 'n_brothers_1', name: 'Banquet Invitation', episodes: '134',
        blurb: 'Kisame lets only Sasuke through. The rest of his team is left facing Samehada — hold for 40 seconds.',
        enemies: [{ id: 'e_kisame_p2' }],
        objective: { type: 'survive', seconds: 40 },
        team: { forced: ['suigetsu', 'karin', 'jugo'], banned: ['sasuke', 'sasuke_cursemark', 'sasuke_ems', 'kisame'] },
      },
      {
        id: 'n_brothers_2', name: 'Amaterasu!', episodes: '135–138',
        blurb: 'Brother against brother. Watch for the black flames of Amaterasu, and for Susanoo when Itachi is nearly down.',
        enemies: [{ id: 'e_itachi_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { forced: ['sasuke'], banned: ['itachi'] },
      },
      {
        id: 'n_brothers_3', name: 'Battle of Unraikyo', episodes: '142',
        blurb: "Taka catches up with Killer Bee in the Land of Lightning. He raps, he blocks, and his Lariat hits like a train.",
        enemies: [{ id: 'e_bee' }],
        objective: { type: 'defeatAll' },
        team: { forced: ['sasuke'], banned: ['killer_bee'], recommended: ['suigetsu', 'karin', 'jugo'] },
      },
      {
        id: 'n_brothers_4', name: 'The Eight-Tails vs. Sasuke', episodes: '143',
        blurb: 'Bee lets the Eight-Tails out. Clash its Tailed Beast Bomb, or be ready to heal.',
        enemies: [{ id: 'e_eight_tails', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { forced: ['sasuke'], banned: ['killer_bee'], recommended: ['suigetsu', 'karin', 'jugo'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_sixtails', part: 2, order: 9, name: 'Six-Tails Unleashed', episodes: '144–151',
    blurb: "Team 7 guards Hotaru, heir to the Tsuchigumo clan's forbidden jutsu, while the wandering Six-Tails jinchuriki Utakata watches over her.",
    banner: 'banner_sixtails',
    theme: { sky: ['#6b8f71', '#d6e8d4'], ground: '#4b6b4f', far: '#2f4a34', accent: '#34d399' },
    nodes: [
      {
        id: 'n_sixtails_1', name: "The Successor's Wish", episodes: '146',
        blurb: 'Mist tracker ninja come for Utakata and take Hotaru hostage. Get her back.',
        enemies: [{ id: 'e_tracker_ninja' }, { id: 'e_tracker_diver' }, { id: 'e_tracker_ninja', delay: 6 }],
        objective: { type: 'protect', protect: 'npc_hotaru' },
        team: { recommended: ['naruto', 'sakura', 'sai', 'yamato'] },
      },
      {
        id: 'n_sixtails_2', name: 'The Forbidden Jutsu Released', episodes: '150',
        blurb: "The bandits and the turned villagers pin Team 7 down. Hold them off for 40 seconds.",
        enemies: [{ id: 'e_bandit_ninja' }, { id: 'e_bandit_ninja' }, { id: 'e_bandit_ninja', delay: 10 }, { id: 'e_bandit_ninja', delay: 18 }],
        objective: { type: 'survive', seconds: 40 },
        team: { recommended: ['naruto', 'sakura', 'sai', 'yamato'] },
      },
      {
        id: 'n_sixtails_3', name: 'Master and Student', episodes: '151',
        blurb: "Shiranami has the forbidden jutsu and a Word Bind on Hotaru. Stop him before the Big Bang goes off.",
        enemies: [{ id: 'e_shiranami_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { recommended: ['naruto', 'sakura', 'sai', 'yamato'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_pain', part: 2, order: 10, name: "Pain's Assault", episodes: '152–175',
    blurb: 'Pain comes to the Hidden Leaf for the Nine-Tails. While Naruto trains on Mount Myoboku, the village fights for its life.',
    banner: 'banner_pain',
    theme: { sky: ['#6b7280', '#d1d5db'], ground: '#78716c', far: '#57534e', accent: '#fb923c' },
    nodes: [
      {
        id: 'n_pain_1', name: 'Assault on the Leaf Village!', episodes: '157',
        blurb: "Pain's animals are loose in the streets. Keep the villager alive.",
        enemies: [{ id: 'e_pain_animal' }, { id: 'e_summoned_beast' }, { id: 'e_summoned_beast', delay: 8 }],
        objective: { type: 'protect', protect: 'npc_leaf_villager' },
        team: { banned: ['pain'], recommended: ['iruka', 'shizune', 'kakashi', 'hinata'] },
      },
      {
        id: 'n_pain_2', name: 'Pain vs. Kakashi', episodes: '158–159',
        blurb: 'Kakashi takes on two Pains at once. Tendo pushes everything away; Shurado fires missiles from its body.',
        enemies: [{ id: 'e_pain_asura' }, { id: 'e_pain_deva', delay: 10 }],
        objective: { type: 'defeatAll' },
        team: { forced: ['kakashi'], banned: ['pain'], recommended: ['choji'] },
      },
      {
        id: 'n_pain_3', name: 'Surname Is Sarutobi. Given Name, Konohamaru!', episodes: '161',
        blurb: 'Konohamaru against Jigokudo, the path that heals the others. One Rasengan, well placed.',
        enemies: [{ id: 'e_pain_naraka' }],
        objective: { type: 'defeatAll' },
        team: { forced: ['konohamaru'], banned: ['pain'] },
      },
      {
        id: 'n_pain_4', name: 'Explode! Sage Mode', episodes: '163–164',
        blurb: 'Naruto lands in the crater in Sage Mode. Gakido drinks jutsu and Chikushodo keeps summoning — split them up.',
        enemies: [{ id: 'e_pain_preta' }, { id: 'e_pain_animal' }, { id: 'e_pain_asura', delay: 12 }],
        objective: { type: 'defeatAll' },
        team: { forced: ['naruto_sage'], banned: ['pain'] },
      },
      {
        id: 'n_pain_5', name: 'Planetary Devastation', episodes: '165–167',
        blurb: 'The last Pain. Almighty Push throws attacks back at you, and Planetary Devastation pulls the whole field into the sky.',
        enemies: [{ id: 'e_pain_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { banned: ['pain', 'konan'], recommended: ['naruto_sage', 'hinata'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_summit', part: 2, order: 11, name: 'Five Kage Summit', episodes: '197–214',
    blurb: 'The Five Kage meet in the Land of Iron, and Sasuke walks straight into the summit.',
    banner: 'banner_summit',
    theme: { sky: ['#cbd5e1', '#f1f5f9'], ground: '#e2e8f0', far: '#94a3b8', accent: '#38bdf8' },
    nodes: [
      {
        id: 'n_summit_1', name: 'Racing Lightning', episodes: '202',
        blurb: 'Fight as the Fourth Raikage. Sasuke has cut through the samurai and Jugo is in his Sage Transformation.',
        enemies: [{ id: 'e_sasuke_summit' }, { id: 'e_jugo' }],
        objective: { type: 'defeatAll' },
        team: { forced: ['ay'], leader: 'ay', banned: ['sasuke', 'sasuke_cursemark', 'sasuke_ems', 'jugo'], recommended: ['darui'] },
      },
      {
        id: 'n_summit_2', name: 'The Tailed Beast vs. The Tailless Tailed Beast', episodes: '207',
        blurb: 'Kisame fuses with Samehada to drain Killer Bee. Out-damage the drain.',
        enemies: [{ id: 'e_kisame_fused' }],
        objective: { type: 'defeatAll' },
        team: { forced: ['killer_bee'], banned: ['kisame'] },
      },
      {
        id: 'n_summit_3', name: 'Danzo Shimura', episodes: '209–211',
        blurb: "Fight as Sasuke, with Karin sensing. Danzo's Izanagi rewrites one death — make him use it.",
        enemies: [{ id: 'e_danzo_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { forced: ['sasuke', 'karin'] },
      },
      {
        id: 'n_summit_4', name: 'The Burden', episodes: '212–214',
        blurb: 'Kakashi steps between Sakura and Sasuke. Sasuke is going blind, and he is at his most dangerous.',
        enemies: [{ id: 'e_sasuke_summit_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { banned: ['sasuke', 'sasuke_cursemark', 'sasuke_ems'], recommended: ['kakashi', 'sakura', 'naruto_sage'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_countdown', part: 2, order: 12, name: 'Fourth Great Ninja War: Countdown', episodes: '215–222, 243–256',
    blurb: 'Naruto is hidden on the Island Turtle to learn to control the Nine-Tails while the world gets ready for war.',
    banner: 'banner_countdown',
    theme: { sky: ['#7dd3c0', '#e6fbf5'], ground: '#3f8f5f', far: '#2c6b46', accent: '#fbbf24' },
    nodes: [
      {
        id: 'n_countdown_1', name: 'Killer Bee and Motoi', episodes: '244',
        blurb: 'A giant squid grabs Motoi off the Island Turtle. Get him back before it drags him under.',
        enemies: [{ id: 'e_giant_squid' }],
        objective: { type: 'protect', protect: 'npc_motoi' },
        team: { recommended: ['killer_bee', 'naruto', 'yamato'] },
      },
      {
        id: 'n_countdown_2', name: 'Target: Nine Tails', episodes: '245–247',
        blurb: "Tug-of-war with the Nine-Tails inside Naruto's own mind. Win it and the chakra is his.",
        enemies: [{ id: 'e_nine_tails', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { forced: ['naruto'], banned: ['naruto_ninetails', 'naruto_sage', 'naruto_sixpaths'] },
      },
      {
        id: 'n_countdown_3', name: 'Battle in Paradise! Odd Beast vs. The Monster!', episodes: '250–251',
        blurb: 'Kisame tries to escape with the jinchuriki intel. Might Guy is in the way.',
        enemies: [{ id: 'e_kisame_island' }],
        objective: { type: 'defeatAll' },
        team: { forced: ['guy'], banned: ['kisame'] },
      },
      {
        id: 'n_countdown_4', name: 'The Angelic Herald of Death', episodes: '252–253',
        blurb: 'Konan against Tobi above the Hidden Rain. Kamui makes him untouchable for moments at a time — and Izanagi gives him one more.',
        enemies: [{ id: 'e_tobi_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { forced: ['konan'], banned: ['obito'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_confront', part: 2, order: 13, name: 'Fourth Great Ninja War: Confrontation', episodes: '261–289, 296–321',
    blurb: "The Allied Shinobi Forces march. Kabuto's Reanimation Jutsu sends the dead against them — old enemies, old teachers.",
    banner: 'banner_confront',
    theme: { sky: ['#9a8c7a', '#e6ddd0'], ground: '#7a6a55', far: '#5a4c3b', accent: '#eab308' },
    nodes: [
      {
        id: 'n_confront_1', name: 'The First and Last Opponent', episodes: '265–266',
        blurb: "Kakashi's division meets Zabuza and Haku again. The reanimated bodies keep rebuilding themselves.",
        enemies: [{ id: 'e_zabuza_re' }, { id: 'e_haku_re' }],
        objective: { type: 'defeatAll' },
        team: { recommended: ['kakashi', 'sakura', 'sai', 'omoi'] },
      },
      {
        id: 'n_confront_2', name: 'Golden Bonds', episodes: '267–270',
        blurb: 'Darui faces the Gold and Silver Brothers. Kinkaku turns into a false Nine-Tails when his brother falls.',
        enemies: [{ id: 'e_ginkaku' }, { id: 'e_kinkaku' }],
        objective: { type: 'defeatAll' },
        team: { forced: ['darui'] },
      },
      {
        id: 'n_confront_3', name: 'The Complete Ino-Shika-Cho Formation!', episodes: '273–274',
        blurb: 'Team 10 against their own sensei. Asuma would want them to win.',
        enemies: [{ id: 'e_asuma_re' }],
        objective: { type: 'defeatAll' },
        team: { forced: ['ino', 'shikamaru', 'choji'], banned: ['asuma'] },
      },
      {
        id: 'n_confront_4', name: 'The Acknowledged One', episodes: '298–299',
        blurb: 'Naruto and Bee against a reanimated Nagato, with Itachi on their side. The King of Hell keeps him standing.',
        enemies: [{ id: 'e_nagato_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { banned: ['pain'], recommended: ['naruto_sage', 'killer_bee', 'itachi'] },
      },
      {
        id: 'n_confront_5', name: 'Gaara and Onoki vs. Mu', episodes: '300',
        blurb: 'The Second Tsuchikage turns invisible and splits in two. Find him before Particle Style finds you.',
        enemies: [{ id: 'e_mu_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { recommended: ['gaara_kazekage', 'onoki', 'naruto_sage'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_climax', part: 2, order: 14, name: 'Fourth Great Ninja War: Climax', episodes: '322–348, 362–375',
    blurb: 'The real Madara takes the field, Itachi and Sasuke stop Kabuto, and the Ten-Tails is revived.',
    banner: 'banner_climax',
    theme: { sky: ['#7f1d1d', '#d6a092'], ground: '#5c3d33', far: '#3b2621', accent: '#f43f5e' },
    nodes: [
      {
        id: 'n_climax_1', name: 'The Five Kage Assemble', episodes: '322–323',
        blurb: 'A reanimated Madara drops a meteorite on the Fourth Division. Last 50 seconds until the Kage arrive.',
        enemies: [{ id: 'e_madara_re' }],
        objective: { type: 'survive', seconds: 50 },
        team: { banned: ['madara'], recommended: ['gaara_kazekage', 'onoki', 'mei', 'ay', 'tsunade'] },
      },
      {
        id: 'n_climax_2', name: 'Four Tails, the King of Sage Monkeys', episodes: '325–326',
        blurb: "The Four-Tails swallows Naruto whole. Naruto and Bee fight their way back out.",
        enemies: [{ id: 'e_four_tails' }],
        objective: { type: 'defeatAll' },
        team: { recommended: ['naruto_sage', 'killer_bee'] },
      },
      {
        id: 'n_climax_3', name: 'The Izanami Activated', episodes: '331–338',
        blurb: 'Itachi and Sasuke against Kabuto in Sage Mode, who brings the Sound Five back as his own weapons.',
        enemies: [{ id: 'e_kabuto_sage_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { forced: ['itachi', 'sasuke'], banned: ['kabuto'] },
      },
      {
        id: 'n_climax_4', name: 'Team 7, Assemble!', episodes: '373',
        blurb: 'Naruto, Sasuke and Sakura, together again, cut through the Ten-Tails clones.',
        enemies: [{ id: 'e_ten_tails_clone' }, { id: 'e_ten_tails_clone' }, { id: 'e_ten_tails_clone', delay: 6 }, { id: 'e_ten_tails_clone', delay: 12 }],
        objective: { type: 'defeatAll' },
        team: { forced: ['naruto_sage', 'sasuke_ems', 'sakura_hundred'] },
      },
      {
        id: 'n_climax_5', name: 'Kakashi vs. Obito', episodes: '374–375',
        blurb: 'Inside the Kamui dimension, the old teammates settle it. Obito phases out of hits — strike between.',
        enemies: [{ id: 'e_obito_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { forced: ['kakashi'], banned: ['obito'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_anbu', part: 2, order: 15, name: 'Kakashi: Shadow of the ANBU Black Ops', episodes: '349–361',
    blurb: 'Years before Team 7, Kakashi serves in the Anbu Black Ops — and Danzo sends a Wood Style user after his Sharingan.',
    banner: 'banner_anbu',
    theme: { sky: ['#1e293b', '#475569'], ground: '#334155', far: '#0f172a', accent: '#94a3b8' },
    nodes: [
      {
        id: 'n_anbu_1', name: "Hashirama's Cells", episodes: '351',
        blurb: 'Kakashi, disguised as the Third Hokage, walks into a Foundation ambush. Hold for 40 seconds.',
        enemies: [{ id: 'e_foundation_op' }, { id: 'e_foundation_sniper' }, { id: 'e_foundation_op', delay: 10 }],
        objective: { type: 'survive', seconds: 40 },
        team: { forced: ['kakashi'], banned: ['kakashi_mangekyo', 'yamato'] },
      },
      {
        id: 'n_anbu_2', name: "Orochimaru's Test Subject", episodes: '353',
        blurb: "Gotta of the Iburi clan wants Yukimi back. His smoke body heals from every hit it lands.",
        enemies: [{ id: 'e_gotta' }],
        objective: { type: 'defeatAll' },
        team: { forced: ['kakashi'], banned: ['kakashi_mangekyo', 'yamato'] },
      },
      {
        id: 'n_anbu_3', name: 'The Targeted Sharingan', episodes: '355',
        blurb: 'Kinoe has orders to take the Sharingan. Wood clones, a domed wall, and a prison of pillars.',
        enemies: [{ id: 'e_kinoe_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { forced: ['kakashi'], banned: ['kakashi_mangekyo', 'yamato'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_birth', part: 2, order: 16, name: "Birth of the Ten-Tails' Jinchuriki", episodes: '378–393, 414–431',
    blurb: 'Obito seals the Ten-Tails inside himself. Then Madara is truly revived, and only one ninja can keep up with him.',
    banner: 'banner_birth',
    theme: { sky: ['#3f3f46', '#a1a1aa'], ground: '#52525b', far: '#27272a', accent: '#e4e4e7' },
    nodes: [
      {
        id: 'n_birth_1', name: "The Ten Tails' Jinchuriki", episodes: '378–379',
        blurb: 'Fight as the reanimated Hokage. Obito tears through their barrier — survive 45 seconds.',
        enemies: [{ id: 'e_obito_jinchuriki' }],
        objective: { type: 'survive', seconds: 45 },
        team: { forced: ['hashirama', 'minato'], banned: ['obito'] },
      },
      {
        id: 'n_birth_2', name: 'Obito Uchiha', episodes: '383–385',
        blurb: "Naruto and Sasuke, side by side, break Obito's Truth-Seeking Balls.",
        enemies: [{ id: 'e_obito_jin_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { banned: ['obito'], recommended: ['naruto_sage', 'sasuke_ems', 'minato'] },
      },
      {
        id: 'n_birth_3', name: 'The Blue Beast vs. Six Paths Madara', episodes: '418',
        blurb: 'Guy opens the Seventh Gate against Madara. It is not enough.',
        enemies: [{ id: 'e_madara_sixpaths' }],
        objective: { type: 'defeatAll' },
        team: { forced: ['guy'], banned: ['guy_eightgates', 'madara'] },
      },
      {
        id: 'n_birth_4', name: 'The Eight Inner Gates Formation', episodes: '419–420',
        blurb: 'The Eighth Gate: Night Guy. Madara will admit no one ever pushed him this far.',
        enemies: [{ id: 'e_madara_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { forced: ['guy_eightgates'], banned: ['guy', 'madara'] },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'arc_kaguya', part: 2, order: 17, name: 'Kaguya Otsutsuki Strikes', episodes: '458–479',
    blurb: 'Black Zetsu revives Kaguya, the mother of chakra. Team 7 has to seal her — and then Naruto and Sasuke have one fight left.',
    banner: 'banner_kaguya',
    theme: { sky: ['#312e81', '#c4b5fd'], ground: '#4c1d95', far: '#2e1065', accent: '#e9d5ff' },
    nodes: [
      {
        id: 'n_kaguya_1', name: 'She of the Beginning', episodes: '459',
        blurb: 'Kaguya shifts Team 7 between dimensions — lava, ice, desert. Survive 45 seconds.',
        enemies: [{ id: 'e_kaguya' }],
        objective: { type: 'survive', seconds: 45 },
        team: { recommended: ['naruto_sixpaths', 'sasuke_ems', 'sakura_hundred', 'kakashi_mangekyo'] },
      },
      {
        id: 'n_kaguya_2', name: 'The Sharingan Revived', episodes: '470–473',
        blurb: 'Every dimension changes her nature. Keep a counter for each, and seal her.',
        enemies: [{ id: 'e_kaguya_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { recommended: ['naruto_sixpaths', 'sasuke_ems', 'sakura_hundred', 'kakashi_mangekyo'] },
      },
      {
        id: 'n_kaguya_3', name: 'The Final Battle', episodes: '475–476',
        blurb: 'At the Valley of the End, Sasuke tells Naruto what he means to do. They start with fists.',
        enemies: [{ id: 'e_sasuke_final' }],
        objective: { type: 'defeatAll' },
        team: { banned: ['sasuke', 'sasuke_cursemark', 'sasuke_ems'], recommended: ['naruto_sixpaths'] },
      },
      {
        id: 'n_kaguya_4', name: 'Naruto and Sasuke', episodes: '477–478',
        blurb: "Indra's Arrow against a Rasen Shuriken. The last fight of the story.",
        enemies: [{ id: 'e_sasuke_final_boss', boss: true }],
        objective: { type: 'defeatBoss' },
        team: { banned: ['sasuke', 'sasuke_cursemark', 'sasuke_ems'], recommended: ['naruto_sixpaths', 'sakura_hundred', 'kakashi_mangekyo'] },
      },
    ],
  },
];

export default SHIPPUDEN_ARCS;
