// tools/fonts.mjs — downloads the two open-licence faces the art bible picked and writes
// the subsets the game ships (assets/fonts/*.woff2): Anton for display type (Latin only)
// and Yuji Syuku for the brush accents (the few kanji and kana the game shows, plus
// Latin). Run once after changing the glyph list; the output files are committed.
//   node tools/fonts.mjs
// Sources: the google/fonts repository (SIL Open Font License 1.1 for both).
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const OUT = fileURLToPath(new URL('../assets/fonts/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const LATIN = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~' +
  '¡¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝßàáâãäåæçèéêëìíîïñòóôõöøùúûüýÿ' + '–—‘’“”…·×•←→▲▼★☆✓';
// The brush face: the marks and stamps the game draws (忍, 油, the summoning circle, natures,
// tiers, villages, victory / defeat), plus Latin for boss titles and captions.
const ASCII = LATIN.slice(0, 95) + '–—’…·';
const KANJI = '忍者術油口寄せの勝敗影上中下火風雷土水木霧砂音雨雲岩葉隠里鬼人蛇狐狸暁戦闘技乱舞印';
const FONTS = [
  { file: 'anton.woff2', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf', text: LATIN },
  { file: 'yuji-syuku.woff2', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/yujisyuku/YujiSyuku-Regular.ttf', text: ASCII + KANJI },
];

for (const f of FONTS) {
  const res = await fetch(f.url);
  if (!res.ok) throw new Error(`${f.url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const sub = await subsetFont(buf, f.text, { targetFormat: 'woff2' });
  writeFileSync(OUT + f.file, sub);
  console.log(`${f.file}: ${Math.round(buf.length / 1024)} KB source → ${Math.round(statSync(OUT + f.file).size / 1024)} KB subset (${[...new Set(f.text)].length} glyphs)`);
}
