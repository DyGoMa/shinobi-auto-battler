// tools/story-script.mjs — the whole story as a readable script, in play order.
//   node tools/story-script.mjs                 # writes docs/STORY_SCRIPT.md
//   node tools/story-script.mjs --html out.html # also an HTML page (for reading in a browser pane)
// Re-run after editing js/content/story/*.js. The teaching lines show their numbers filled from
// balance.js, exactly as the game shows them.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CONTENT as C } from '../js/content/index.js';
import { BALANCE as B } from '../js/config/balance.js';
import { STORY, TEACH, RUSH_BARKS } from '../js/content/story/index.js';
import { speakerOf, lineSide, fill, teachValues, countLines } from '../js/core/Story.js';

const values = teachValues(C, B, null);
const TEACH_WHERE = {
  summonFirst: 'the first visit to Summon', rosterFirst: 'the first visit to the Roster after a summon', storyFirst: 'the first visit to the Story map',
  storySkip: 'the first time a won battle is selected', teamFirst: 'the first visit to the Team Builder', bannerFirst: 'the first arc banner',
  rushFirst: 'the Boss Rush opening', hardFirst: 'Hard mode opening', dailyFirst: 'the Daily challenge opening', achievementsFirst: 'the first visit to Achievements',
  dupeFirst: 'the first duplicate summon',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const md = [], html = [];
const h = (level, text) => { md.push(`${'#'.repeat(level)} ${text}\n`); html.push(`<h${level}>${esc(text)}</h${level}>`); };
const p = (text) => { md.push(`${text}\n`); html.push(`<p class="note">${esc(text)}</p>`); };
const scene = (title, lines, { filled = false } = {}) => {
  if (!lines?.length) return;
  md.push(`**${title}**\n`); html.push(`<div class="scene"><div class="t">${esc(title)}</div>`);
  for (const l of lines) {
    const text = filled ? fill(l.caption ?? l.text, values) : (l.caption ?? l.text);
    if (l.caption != null) { md.push(`*${text}*  `); html.push(`<p class="cap">${esc(text)}</p>`); continue; }
    const sp = speakerOf(l.who, C); const side = lineSide(l, C);
    md.push(`**${sp.name}${side === 'right' ? ' ›' : ''}:** ${text}  `);
    html.push(`<p class="line ${side}"><b>${esc(sp.name)}</b> ${esc(text)}</p>`);
  }
  md.push(''); html.push('</div>');
};

h(1, 'Shinobi Auto-Battler — the story script');
p(`Every scene in play order (${countLines()} lines), generated from js/content/story/ by tools/story-script.mjs. A › after a name marks an enemy (they stand on the right). Captions are the narrator.`);
for (const arc of [C.tutorial, ...C.arcs]) {
  const s = STORY[arc.id]; if (!s) continue;
  h(2, `${arc === C.tutorial ? '' : `${arc.part === 1 ? 'Part I' : 'Part II'} · `}${arc.name}${arc.filler ? ' (side mission)' : ''}`);
  scene('Opening', s.opener);
  arc.nodes.forEach((n, i) => {
    const ns = s.nodes?.[n.id]; if (!ns) return;
    h(3, `${i + 1}. ${n.isBossNode ? '👑 ' : ''}${n.name}`);
    scene('Before the battle', ns.intro);
    scene('The boss, before FIGHT!', ns.boss);
    scene('Afterwards', ns.outro);
  });
  for (const [k, lines] of Object.entries(s.teach || {})) scene(`Teaching: ${k}`, lines, { filled: true });
  scene('Ending', s.closer);
}
h(2, 'The teachers (once each, where a system first appears)');
for (const [k, lines] of Object.entries(TEACH)) scene(TEACH_WHERE[k] || k, lines, { filled: true });
h(2, 'The Boss Rush');
for (const id of C.bossRush.order) scene(C.enemy[id].name, RUSH_BARKS[id]);

const root = new URL('../', import.meta.url);
writeFileSync(fileURLToPath(new URL('docs/STORY_SCRIPT.md', root)), md.join('\n'));
console.log(`docs/STORY_SCRIPT.md written (${countLines()} lines).`);
const i = process.argv.indexOf('--html');
if (i > 0 && process.argv[i + 1]) {
  const css = `body{font:16px/1.5 Georgia,serif;max-width:820px;margin:24px auto;padding:0 16px;color:#2a1d0f;background:#f6efdf}h1,h2,h3{font-family:Arial,sans-serif;line-height:1.2}h2{margin-top:2.2em;border-bottom:2px solid #c9b48a;padding-bottom:4px}h3{margin:1.6em 0 .4em;color:#7a5230}.note{color:#6b5a44}.scene{margin:8px 0 14px;padding:8px 14px;border-left:4px solid #c9b48a;background:#fbf6ea}.scene .t{font:bold 12px Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#7a5230;margin-bottom:4px}.line{margin:3px 0}.line b{font-family:Arial,sans-serif;font-size:13px;letter-spacing:.04em;text-transform:uppercase;margin-right:6px;color:#b34a00}.line.right b{color:#7a1f1f}.line.right{text-align:right}.cap{font-style:italic;color:#6b5a44;text-align:center;margin:4px 0}`;
  writeFileSync(process.argv[i + 1], `<!doctype html><html><head><meta charset="utf-8"><title>The story script</title><style>${css}</style></head><body>${html.join('\n')}</body></html>`);
  console.log(`${process.argv[i + 1]} written.`);
}
