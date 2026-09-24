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
    blurb: 'Rate-up: the Sand Siblings (join after the arc) and the Third Hokage.', featured: ['gaara', 'temari', 'kankuro', 'hiruzen'],
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
    blurb: 'Rate-up: the Sound Four, Kimimaro and the Final Valley forms (join after the arc), plus the squad.',
    featured: ['kimimaro', 'sakon', 'tayuya', 'kidomaru', 'jirobo', 'naruto_ninetails', 'sasuke_cursemark', 'shikamaru', 'neji', 'choji'],
  },
  {
    id: 'banner_kurosuki', type: 'arc', arc: 'arc_kurosuki', name: 'Thunder of the Hidden Mist',
    blurb: 'Rate-up: Naruto and Team Guy.', featured: ['naruto', 'neji', 'lee', 'tenten', 'guy'],
  },
];

export default BANNERS;
