// achievements.js — every achievement. Pure data: the targets and rewards (every
// number) live in balance.js → achievements.list[id]. See CONTENT_GUIDE.md.
//
//   id          unique, "ach_…"
//   name        shown on the Achievements screen (plain words, dub names only)
//   category    'story' | 'collection' | 'combat' | 'account'
//   description one line; {target} is replaced by the balance.js target
//   type        how progress is measured (js/core/Achievements.js PROGRESS):
//     tutorial        win all three tutorial lessons
//     partClear       clear every story battle of `parts`
//     hardClears      clear `target` battles on Hard mode (any)
//     hardPartClear   clear every Hard mode battle of `parts`
//     ownCount        recruit `target` ninja
//     natures         recruit a ninja of every nature (by their main nature)
//     forms           recruit every pullable form of any one ninja
//     levelMax        raise any ninja to the level cap
//     stat            reach `target` on state.stats[`stat`] (combat records)
//     rushRound       clear Boss Rush round `target`
//     summons         summon `target` times
//     googleLinked    link a Google account
//     dailies         clear `target` Daily challenges
//     arcsClear       clear every battle of the arcs in `arcs` (0.12.1)
//     stars           raise any ninja to `target` stars (0.12.1)
//     ownTier         recruit `target` ninja of `tier` (0.12.1)
//     levelReach      raise any ninja to level `target` (0.12.1)
//   rewardCharacter  optional: a ninja given on claim (achievement-exclusive forms)
export const ACHIEVEMENT_CATEGORIES = [
  { id: 'story', name: 'Story', icon: '🗺️' },
  { id: 'collection', name: 'Collection', icon: '📖' },
  { id: 'combat', name: 'Combat', icon: '⚔️' },
  { id: 'account', name: 'Account', icon: '👤' },
];

export const ACHIEVEMENTS = [
  // ------------------------------------------------------------------ Story
  { id: 'ach_tutorial', category: 'story', name: 'Academy Graduate', type: 'tutorial',
    description: 'Win all three lessons of the Academy tutorial.' },
  { id: 'ach_part1', category: 'story', name: 'Part I Complete', type: 'partClear', parts: [1],
    description: 'Clear every battle in Part I.' },
  { id: 'ach_story', category: 'story', name: 'Believe It!', type: 'partClear', parts: [1, 2],
    description: 'Complete Part I and Part II.', rewardCharacter: 'naruto_chakramode' },
  { id: 'ach_hard_first', category: 'story', name: 'No Holding Back', type: 'hardClears',
    description: 'Clear a battle on Hard mode.' },
  { id: 'ach_hard_part1', category: 'story', name: 'Part I on Hard', type: 'hardPartClear', parts: [1],
    description: 'Clear every Part I battle on Hard mode.' },
  { id: 'ach_hard_part2', category: 'story', name: 'Part II on Hard', type: 'hardPartClear', parts: [2],
    description: 'Clear every Part II battle on Hard mode.' },
  { id: 'ach_side_missions', category: 'story', name: 'Off the Beaten Path', type: 'arcsClear', arcs: ['arc_tea', 'arc_kurosuki', 'arc_twelve', 'arc_threetails', 'arc_sixtails'],
    description: 'Clear all five side missions: the Land of Tea, the Kurosuki Family, the Twelve Guardian Ninja, the Three-Tails and the Six-Tails.' },
  { id: 'ach_replays_25', category: 'story', name: 'Back for More', type: 'stat', stat: 'replayWins',
    description: 'Win {target} replays of battles you had already cleared (Story or Hard; ⏭ Skip counts).' },
  { id: 'ach_replays_100', category: 'story', name: 'Old Battlegrounds', type: 'stat', stat: 'replayWins',
    description: 'Win {target} replays of battles you had already cleared.' },
  { id: 'ach_hard_25', category: 'story', name: 'Hard Habit', type: 'hardClears',
    description: 'Clear {target} battles on Hard mode.' },

  // ------------------------------------------------------------- Collection
  { id: 'ach_own_10', category: 'collection', name: 'Growing Squad', type: 'ownCount',
    description: 'Recruit {target} ninja.' },
  { id: 'ach_own_25', category: 'collection', name: 'Village Roster', type: 'ownCount',
    description: 'Recruit {target} ninja.' },
  { id: 'ach_own_45', category: 'collection', name: 'A Village of Legends', type: 'ownCount',
    description: 'Recruit {target} ninja.' },
  { id: 'ach_natures', category: 'collection', name: 'Five Natures', type: 'natures',
    description: 'Recruit a ninja of every nature: Fire, Wind, Lightning, Earth and Water (their main nature).' },
  { id: 'ach_forms', category: 'collection', name: 'Every Form', type: 'forms',
    description: 'Recruit every summonable form of one ninja, such as Kakashi Hatake and his Mangekyo Sharingan form.' },
  { id: 'ach_level_max', category: 'collection', name: 'Peak Condition', type: 'levelMax',
    description: 'Raise a ninja to the highest level.' },
  { id: 'ach_own_60', category: 'collection', name: "Everyone's Here", type: 'ownCount',
    description: 'Recruit {target} ninja.' },
  { id: 'ach_five_star', category: 'collection', name: 'Five Stars', type: 'stars',
    description: 'Raise any ninja to {target}★ with duplicate summons.' },
  { id: 'ach_kage_3', category: 'collection', name: 'Kage Council', type: 'ownTier', tier: 'kage',
    description: 'Recruit {target} Kage-tier ninja.' },
  { id: 'ach_level_50', category: 'collection', name: 'Halfway There', type: 'levelReach',
    description: 'Raise any ninja to level {target}.' },

  // ----------------------------------------------------------------- Combat
  { id: 'ach_flawless', category: 'combat', name: 'Not a Scratch', type: 'stat', stat: 'flawlessWins',
    description: 'Win a story battle without losing a single ninja.' },
  { id: 'ach_countered', category: 'combat', name: 'Against the Odds', type: 'stat', stat: 'counteredWins',
    description: 'Win a battle while your team\'s nature matchup is Poor or Bad.' },
  { id: 'ach_clash', category: 'combat', name: 'Clash Master', type: 'stat', stat: 'clashWins',
    description: 'Overpower {target} enemy jutsu in Jutsu Clashes.' },
  { id: 'ach_underdog', category: 'combat', name: 'Giant Killer', type: 'stat', stat: 'underdogBossWins',
    description: 'Defeat a boss with a team at least {levels} levels below it.' },
  { id: 'ach_rush', category: 'combat', name: 'Akatsuki Hunter', type: 'rushRound',
    description: 'Clear round {target} of the Boss Rush.' },
  { id: 'ach_clash_50', category: 'combat', name: 'Clash Legend', type: 'stat', stat: 'clashWins',
    description: 'Overpower {target} enemy jutsu in Jutsu Clashes.' },
  { id: 'ach_flawless_10', category: 'combat', name: 'Untouchable', type: 'stat', stat: 'flawlessWins',
    description: 'Win {target} story battles without losing a single ninja.' },
  { id: 'ach_rush_14', category: 'combat', name: 'Akatsuki Nemesis', type: 'rushRound',
    description: 'Clear round {target} of the Boss Rush: the whole rotation twice over.' },

  // ---------------------------------------------------------------- Account
  { id: 'ach_first_summon', category: 'account', name: 'First Summon', type: 'summons',
    description: 'Summon a ninja for the first time.' },
  { id: 'ach_google', category: 'account', name: 'Linked Up', type: 'googleLinked',
    description: 'Link a Google account in Settings to keep your save in the cloud.' },
  { id: 'ach_days', category: 'account', name: 'Daily Training', type: 'stat', stat: 'daysPlayed',
    description: 'Play on {target} different days.' },
  { id: 'ach_dailies', category: 'account', name: 'Challenger', type: 'dailies',
    description: 'Clear {target} Daily challenges.' },
  { id: 'ach_days_30', category: 'account', name: 'A Month of Training', type: 'stat', stat: 'daysPlayed',
    description: 'Play on {target} different days.' },
  { id: 'ach_dailies_25', category: 'account', name: 'Daily Regular', type: 'dailies',
    description: 'Clear {target} Daily challenges.' },
  { id: 'ach_dailies_100', category: 'account', name: 'Daily Legend', type: 'dailies',
    description: 'Clear {target} Daily challenges.' },
  { id: 'ach_summons_100', category: 'account', name: 'Summoner', type: 'summons',
    description: 'Summon {target} times.' },
];

export default ACHIEVEMENTS;
