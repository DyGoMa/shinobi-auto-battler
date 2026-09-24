// banners.js — summon banners. Pure data; rates/costs live in balance.js (gacha.*).
//   type 'standard' — always available; pool = every unlocked character.
//   type 'arc'      — opens when the player REACHES `arc`; same pool, but `featured`
//                     characters share balance.gacha.rateUpShare of their tier's rate.
//                     Featured villains only drop once their unlock arc is cleared
//                     (their roster `unlock`), and show as "joins after …" until then.
export const BANNERS = [
  {
    id: 'standard', type: 'standard', name: 'Standard Summon',
    blurb: 'Every ninja you have unlocked, at base rates.', featured: [],
  },
  {
    id: 'banner_belltest', type: 'arc', arc: 'arc_belltest', name: 'Team 7 Assembles',
    blurb: 'Rate-up: Team 7 and their sensei.', featured: ['kakashi', 'naruto', 'sasuke', 'sakura'],
  },
  {
    id: 'banner_waves', type: 'arc', arc: 'arc_waves', name: 'Demon of the Hidden Mist',
    blurb: 'Rate-up: Zabuza and Haku (join after the Land of Waves), Kakashi.', featured: ['zabuza', 'haku', 'kakashi'],
  },
  {
    id: 'banner_chunin', type: 'arc', arc: 'arc_chunin', name: 'Chunin Exams',
    blurb: 'Rate-up: the rookies and Jiraiya (joins after the Chunin Exams).', featured: ['neji', 'lee', 'shikamaru', 'hinata', 'kiba', 'jiraiya'],
  },
  {
    id: 'banner_konoha', type: 'arc', arc: 'arc_konoha_crush', name: 'Destruction of the Hidden Leaf',
    blurb: 'Rate-up: Gaara, Temari and Kankuro (join after the arc) and the Third Hokage.', featured: ['gaara', 'temari', 'kankuro', 'hiruzen'],
  },
  {
    id: 'banner_tsunade', type: 'arc', arc: 'arc_tsunade', name: 'The Legendary Sannin',
    blurb: 'Rate-up: Tsunade, Orochimaru, Shizune, Kabuto (join after the arc) and Jiraiya.', featured: ['tsunade', 'orochimaru', 'jiraiya', 'shizune', 'kabuto'],
  },
  {
    id: 'banner_tea', type: 'arc', arc: 'arc_tea', name: 'Land of Tea',
    blurb: 'Rate-up: Team 7 on their own.', featured: ['naruto', 'sasuke', 'sakura'],
  },
  {
    id: 'banner_sasuke', type: 'arc', arc: 'arc_sasuke_recovery', name: 'Sasuke Retrieval Squad',
    blurb: 'Rate-up: the Sound Ninja Four, Kimimaro and the Final Valley forms (join after the arc), plus the squad.',
    featured: ['kimimaro', 'sakon', 'tayuya', 'kidomaru', 'jirobo', 'naruto_ninetails', 'sasuke_cursemark', 'shikamaru', 'neji', 'choji'],
  },
  {
    id: 'banner_kurosuki', type: 'arc', arc: 'arc_kurosuki', name: 'Thunder of the Hidden Mist',
    blurb: 'Rate-up: Naruto and Team Guy.', featured: ['naruto', 'neji', 'lee', 'tenten', 'guy'],
  },

  // ---- Part II. Names follow the English DVD/season sub-titles where one fits (NAMING.md).
  {
    id: 'banner_kazekage', type: 'arc', arc: 'arc_kazekage', name: 'Kazekage Rescue',
    blurb: "Rate-up: Chiyo, Deidara, Sasori, the Fifth Kazekage and Kakashi's Mangekyo Sharingan (join after the arc), plus Kankuro.",
    featured: ['chiyo', 'deidara', 'sasori', 'gaara_kazekage', 'kakashi_mangekyo', 'kankuro'],
  },
  {
    id: 'banner_tenchi', type: 'arc', arc: 'arc_tenchi', name: 'New Team Kakashi',
    blurb: 'Rate-up: Sai and Yamato (join after the arc), Sakura and the Nine-Tails Naruto.', featured: ['sai', 'yamato', 'sakura', 'naruto_ninetails'],
  },
  {
    id: 'banner_twelve', type: 'arc', arc: 'arc_twelve', name: 'Twelve Guardian Ninja',
    blurb: 'Rate-up: Asuma, Naruto and Shikamaru.', featured: ['asuma', 'naruto', 'shikamaru'],
  },
  {
    id: 'banner_hidan', type: 'arc', arc: 'arc_hidan', name: 'Immortal Devastators',
    blurb: 'Rate-up: Hidan and Kakuzu (join after the arc), Asuma, Shikamaru and Kakashi.', featured: ['hidan', 'kakuzu', 'asuma', 'shikamaru', 'kakashi'],
  },
  {
    id: 'banner_threetails', type: 'arc', arc: 'arc_threetails', name: 'The Three-Tailed Demon Turtle',
    blurb: 'Rate-up: Team 8 and Kurenai.', featured: ['hinata', 'kiba', 'shino', 'kurenai'],
  },
  {
    id: 'banner_itachi', type: 'arc', arc: 'arc_itachi', name: 'Taka',
    blurb: "Rate-up: Suigetsu, Karin and Jugo (join after the arc), and Sasuke.", featured: ['suigetsu', 'karin', 'jugo', 'sasuke'],
  },
  {
    id: 'banner_jiraiya', type: 'arc', arc: 'arc_jiraiya', name: 'Tales of a Gutsy Ninja',
    blurb: "Rate-up: Jiraiya, with Pain and Konan (join after Pain's Assault).", featured: ['jiraiya', 'pain', 'konan'],
  },
  {
    id: 'banner_brothers', type: 'arc', arc: 'arc_brothers', name: "Master's Prophecy and Vengeance",
    blurb: 'Rate-up: Itachi and Killer Bee (join after the arc), Sasuke and Kisame.', featured: ['itachi', 'killer_bee', 'sasuke', 'kisame'],
  },
  {
    id: 'banner_sixtails', type: 'arc', arc: 'arc_sixtails', name: 'The Six-Tailed Demon Slug',
    blurb: 'Rate-up: Naruto, Sakura, Sai and Yamato.', featured: ['naruto', 'sakura', 'sai', 'yamato'],
  },
  {
    id: 'banner_pain', type: 'arc', arc: 'arc_pain', name: 'Two Saviors',
    blurb: 'Rate-up: Sage Mode Naruto, Konohamaru, Pain and Konan (join after the arc), and Hinata.', featured: ['naruto_sage', 'konohamaru', 'pain', 'konan', 'hinata'],
  },
  {
    id: 'banner_summit', type: 'arc', arc: 'arc_summit', name: 'The Gathering of the Five Kage',
    blurb: 'Rate-up: Ay, Onoki, Mei, Darui, Kurotsuchi, Chojuro and Omoi (join after the arc), and the Fifth Kazekage.',
    featured: ['ay', 'onoki', 'mei', 'darui', 'kurotsuchi', 'chojuro', 'omoi', 'gaara_kazekage'],
  },
  {
    id: 'banner_countdown', type: 'arc', arc: 'arc_countdown', name: 'Nine-Tails Taming and Karmic Encounters',
    blurb: 'Rate-up: Kisame (joins after the arc), Killer Bee, Konan and Might Guy.', featured: ['kisame', 'killer_bee', 'konan', 'guy'],
  },
  {
    id: 'banner_confront', type: 'arc', arc: 'arc_confront', name: 'Assailants From Afar',
    blurb: 'Rate-up: Darui, Omoi, Zabuza, Haku and Team 10.', featured: ['darui', 'omoi', 'zabuza', 'haku', 'ino', 'shikamaru', 'choji'],
  },
  {
    id: 'banner_climax', type: 'arc', arc: 'arc_climax', name: 'The Return of Team 7',
    blurb: "Rate-up: Sasuke's Eternal Mangekyo Sharingan, Sakura's Hundred Healings, Minato and Hashirama (join after the arc), and Kabuto.",
    featured: ['sasuke_ems', 'sakura_hundred', 'minato', 'hashirama', 'kabuto'],
  },
  {
    id: 'banner_anbu', type: 'arc', arc: 'arc_anbu', name: 'Shadow of the ANBU Black Ops',
    blurb: 'Rate-up: Kakashi, Yamato, Itachi and Might Guy.', featured: ['kakashi', 'yamato', 'itachi', 'guy'],
  },
  {
    id: 'banner_birth', type: 'arc', arc: 'arc_birth', name: 'Obito Uchiha',
    blurb: 'Rate-up: Obito, Madara, the Eight Inner Gates and Six Paths Sage Mode (join after the arc), and Minato.',
    featured: ['obito', 'madara', 'guy_eightgates', 'naruto_sixpaths', 'minato'],
  },
  {
    id: 'banner_kaguya', type: 'arc', arc: 'arc_kaguya', name: 'The Chapter of Naruto and Sasuke',
    blurb: 'Rate-up: the final forms of Team 7.', featured: ['naruto_sixpaths', 'sasuke_ems', 'sakura_hundred', 'kakashi_mangekyo'],
  },
];

export default BANNERS;
