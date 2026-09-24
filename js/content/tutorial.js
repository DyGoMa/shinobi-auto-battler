// tutorial.js — the Academy tutorial: three very easy practice battles that run
// before "Prologue: Survival Test" for new saves. Pure data; see CONTENT_GUIDE.md.
//
// Same node schema as arcs/part1.js, plus:
//   lesson     'team' | 'nature' | 'clash' — what the lesson battle teaches (the
//              lesson cards and in-battle coach tips key off it)
//   learn      one line shown on the lesson card ("You'll learn: …")
//   startChakra  optional: the player's team starts at this much chakra
//              (a key into balance.tutorial, so the number stays in balance.js)
// Tutorial nodes are NOT story nodes: they have no global index, and every
// enemy fights at balance.tutorial.enemyLevel. Names are dub names (NAMING.md).
export const TUTORIAL_ARC = {
  id: 'arc_tutorial', name: 'Tutorial: The Academy', episodes: '1',
  blurb: 'Graduation night at the Academy. Naruto has just failed his exam, and Mizuki has a secret "make-up test" in mind. Three short lessons teach you the basics before the Survival Test.',
  theme: { sky: ['#1d2a4d', '#44588a'], ground: '#34533a', far: '#233a2b', accent: '#fbbf24' },
  nodes: [
    {
      id: 'n_tut_1', lesson: 'team', name: 'Enter: Naruto Uzumaki!', episodes: '1',
      learn: 'Team building: three members, a Leader, and where each role fights.',
      blurb: 'Mizuki tricked Naruto into stealing the Scroll of Sealing. Now he wants it for himself. Build your team and stop him.',
      enemies: [{ id: 'e_mizuki' }],
      objective: { type: 'defeatAll' },
    },
    {
      id: 'n_tut_2', lesson: 'nature', name: 'Transformation Jutsu', episodes: '1',
      learn: 'The Nature Wheel: bring the ninja whose nature beats the enemy.',
      blurb: 'Mizuki uses the Transformation Jutsu to pose as Iruka, but his Earth Style gives him away. Team 7 fights together for this lesson.',
      enemies: [{ id: 'e_mizuki' }],
      objective: { type: 'defeatAll' },
      team: { forced: ['naruto', 'sasuke', 'sakura'], leader: 'kakashi' },
    },
    {
      id: 'n_tut_3', lesson: 'clash', name: 'Multi Shadow Clone Jutsu', episodes: '1',
      learn: 'Ultimates, Jutsu Clash and Auto-ult: meet an enemy jutsu head-on.',
      blurb: "Naruto's Multi Shadow Clone Jutsu ends the night. Time your Ultimates and meet Mizuki's jutsu head-on.",
      enemies: [{ id: 'e_mizuki_clash' }],
      objective: { type: 'defeatAll' },
      team: { forced: ['naruto', 'sasuke', 'sakura'], leader: 'kakashi' },
      startChakra: 'clashLessonStartChakra',
    },
  ],
};

export default TUTORIAL_ARC;
