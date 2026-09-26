// story/index.js — every scene in one place (docs/STORY_PLAN.md §3). STORY is keyed by arc id
// (the tutorial arc included); TEACH and RUSH_BARKS are the teaching scenes and the Boss Rush
// round barks. STORY_NAMES lists the proper nouns the dialogue introduces that no content
// file names (tools/naming.mjs records their sources in NAMING.md).
import { PART1_STORY } from './part1.js';
import { SHIPPUDEN_A_STORY } from './shippuden-a.js';
import { SHIPPUDEN_B_STORY } from './shippuden-b.js';
export { TEACH, RUSH_BARKS } from './teach.js';

export const STORY = { ...PART1_STORY, ...SHIPPUDEN_A_STORY, ...SHIPPUDEN_B_STORY };

/** The teaching scenes' placeholders and the balance value each one shows (js/core/Story.js teachValues). */
export const TEACH_PLACEHOLDERS = ['single', 'ten', 'tenTier', 'pity', 'reserve', 'gap', 'rushCount', 'hardOffset', 'dailyAttempts', 'dailyCount', 'starBonus', 'starCap'];

/** Names the dialogue uses that are not a roster, enemy, arc, node, banner or jutsu name. */
export const STORY_NAMES = [
  'Akamaru', 'Inari', 'Gato', 'Chiriku', 'Pa', 'Ma', 'Gamabunta', 'Katsuyu', 'Yukimaru', 'Utakata',
  'Jashin', 'Samehada', 'Rin', 'Tenzo', 'Taka', 'Ino-Shika-Cho', 'Son Goku', 'Unraikyo', 'Tanzaku Town', 'Katabami Gold Mine',
  'Black Zetsu', 'Pervy Sage', 'Bushy Brow', 'Grandma Tsunade', 'Indra\'s Arrow', 'Daytime Tiger',
  'Sand Burial', 'Leaf Hurricane', 'Multi Shadow Clone Jutsu', 'Transformation Jutsu', 'Summoning Jutsu',
  'Sage Mode', 'Curry of Life', 'Kirin',
];
