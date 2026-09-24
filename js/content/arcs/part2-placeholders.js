// arcs/part2-placeholders.js — greyed-out "Coming in Part II" arcs for the map.
// SESSION 2: delete this file's import from content/index.js and add
// arcs/shippuden.js with real arcs (same schema as part1.js, part: 2).
// Names = canon Shippuden arcs in anime order (Narutopedia; dub wording per NAMING.md).
export const PART2_PLACEHOLDERS = [
  'Kazekage Rescue Mission',
  'Tenchi Bridge Reconnaissance Mission',
  'Akatsuki Suppression Mission',
  'Itachi Pursuit Mission',
  'Tale of Jiraiya the Gallant',
  'Fated Battle Between Brothers',
  "Pain's Assault",
  'Five Kage Summit',
  'Fourth Great Ninja War',
].map((name, i) => ({
  id: `arc_p2_placeholder_${i + 1}`, part: 2, order: i + 1, name, placeholder: true, nodes: [],
  blurb: 'Coming in Part II.',
}));

export default PART2_PLACEHOLDERS;
