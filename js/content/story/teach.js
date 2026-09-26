// story/teach.js — the teaching scenes (docs/STORY_PLAN.md §4): a character explains a system in
// five lines or fewer, once, where the system first appears; and the Boss Rush barks. The
// numbers are read from balance.js by the screen (placeholders {{...}} are filled by
// js/core/Story.js fill()), so a line can never go stale.
const N = (caption) => ({ caption });
const L = (who, text, side = null) => (side ? { who, text, side } : { who, text });

export const TEACH = {
  // the first visit to Summon, after the tutorial
  summonFirst: [
    L('jiraiya', 'Scrolls, kid. Every ninja worth the name is hiding on one.'),
    L('jiraiya', '{{single}} scrolls calls one. {{ten}} calls ten, one of them {{tenTier}} or better.'),
    L('jiraiya', 'Keep calling and a Kage answers by the {{pity}}th. The count carries across banners.'),
    L('jiraiya', 'The top banner follows the story. Its people show up more often. Villains once beaten.'),
    L('naruto', 'So… I just need scrolls. Lots of scrolls.'),
  ],
  // the first visit to the Roster after the first summon
  rosterFirst: [
    L('tsunade', 'Ryo. That\'s what levels a ninja. Not speeches. Ryo.'),
    L('tsunade', '"Level to recommended" spends until your team matches the next fight, then stops.'),
    L('tsunade', '"Smart spend" puts it where it adds the most and keeps {{reserve}} back. My rule.'),
    L('tsunade', 'Anyone {{gap}} levels behind your best levels up cheaper. Catch-up. Don\'t abuse it.'),
    L('naruto', 'Grandma Tsunade, I don\'t HAVE any Ryo.'),
  ],
  // the first visit to the Story map
  storyFirst: [
    L('shikamaru', 'The map. Each arc ends with a boss. The glowing battle is the next one.'),
    L('shikamaru', 'The lightning number is the power the fight expects. Below it, expect to lose.'),
    L('shikamaru', 'Tap a battle, read the enemy natures, bring the counters. That\'s the whole game, honestly.'),
    L('shikamaru', 'Battles you\'ve won pay Ryo again. Replay them when a boss is a wall.'),
  ],
  // the first time a cleared battle is selected
  storySkip: [
    L('shikamaru', 'Won it already? Then Skip it. The game plays it for you, same rewards. Still a real fight.'),
    L('shikamaru', 'It can lose. Auto-ult isn\'t me. Nothing is me.'),
  ],
  // the first visit to the Team Builder outside the tutorial
  teamFirst: [
    L('shikamaru', 'Three members, one Leader. The Leader fights too, and everyone gets their buff.'),
    L('shikamaru', 'The little arrows: up counters the fight, down gets countered, dot is neutral.'),
    L('shikamaru', '"Auto" builds the best team you own for this fight. The presets swap whole teams.'),
    L('shikamaru', 'Or think it through yourself. I hear it builds character. What a drag.'),
  ],
  // the first arc banner opening (Land of Waves)
  bannerFirst: [
    L('jiraiya', 'A new banner, kid. Every arc gets one, and the people in it show up more often.'),
    L('jiraiya', 'Beat a villain in the story and he joins the pool. Enemies today, teammates tomorrow.'),
    L('jiraiya', 'The Kage count carries over. So call from whichever banner you like.'),
  ],
  // the Boss Rush unlocking (the Sasuke Retrieval closer) and its lobby's first visit
  rushFirst: [
    L('jiraiya', 'The Akatsuki. {{rushCount}} of them, back to back, and nobody heals between rounds.'),
    L('jiraiya', 'HP and chakra carry over. Bring a healer. Save your Ultimates for their wind-ups.'),
    L('jiraiya', 'Each round pays. Quit while you\'re ahead and keep it. Or don\'t, and learn something.'),
    L('naruto', 'Seven Akatsuki. In a row. Pervy Sage, that\'s the best thing I\'ve ever heard.'),
  ],
  // Hard mode opening (Part I's closer)
  hardFirst: [
    L('kakashi', 'Hard mode. The same battles, enemies {{hardOffset}} levels higher, bosses meaner.'),
    L('kakashi', 'First clears pay scrolls again. Replays pay more than the story\'s.'),
    L('kakashi', 'It opens for a part once you\'ve cleared it, one battle after another. Take your time.'),
  ],
  // the Daily challenge unlocking (the Land of Waves closer) and its lobby's first visit
  dailyFirst: [
    L('guy', 'The Daily challenge! A boss you\'ve beaten, back with a TWIST, every single day!'),
    L('guy', '{{dailyAttempts}} attempts a day. The reward is paid on your first clear. Then you rest!'),
    L('guy', 'You will NOT rest. You will come back tomorrow. That is the power of youth!'),
    L('lee', 'Guy-sensei, I have already set an alarm for tomorrow\'s challenge.'),
  ],
  // the first visit to Achievements
  achievementsFirst: [
    L('konohamaru', 'Achievements! They unlock by themselves while you play. Even the stuff you already did!'),
    L('konohamaru', 'Come here to claim them: Ryo, summon tickets, and Rare-or-better summons.'),
    L('konohamaru', 'One of them is a Naruto you can\'t get any other way. I want it. I want it so bad.'),
  ],
  // the first duplicate summon's Continue
  dupeFirst: [
    L('tsunade', 'A duplicate. Don\'t sulk. Each one adds a star: +{{starBonus}} to everything.'),
    L('tsunade', 'Up to {{starCap}} stars. Past that, the copy turns into Ryo. Nothing here goes to waste.'),
    L('tsunade', 'Alternate forms of the same ninja can\'t share a team. One Naruto is plenty.'),
  ],
};

/** One bark per Akatsuki round of the Boss Rush, in rotation order. */
export const RUSH_BARKS = {
  e_br_kisame: [L('e_br_kisame', 'Round one. Samehada is hungry, and you look full of chakra.')],
  e_br_deidara: [L('e_br_deidara', 'Round two. My art is a bang, hm! Try to keep both feet.')],
  e_br_sasori: [L('e_br_sasori', 'Round three. I don\'t like to be kept waiting. Neither do my puppets.')],
  e_br_hidan: [L('e_br_hidan', 'Round four! Lord Jashin, look at these fools lining up for me!')],
  e_br_kakuzu: [L('e_br_kakuzu', 'Round five. Every one of you has a heart I could use.')],
  e_br_itachi: [L('e_br_itachi', 'Round six. You\'ve come far. Now look into my eyes.')],
  e_br_pain: [L('e_br_pain', 'Round seven. Know pain. This is where your run ends.')],
};
