// tools/manifest.mjs — writes assets/manifest.json (every image the art pass wants, with its
// Gemini prompt) and docs/ASSET_CHECKLIST.md from the game's content. `node tools/manifest.mjs`
// Re-run it after adding a character; tools/ingest.mjs refreshes the checklist's ✓ marks.
import { writeFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { CONTENT } from '../js/content/index.js';
import { buildManifest, checklistMarkdown } from './manifest-lib.mjs';

const overrides = existsSync('assets/art-overrides.json') ? JSON.parse(readFileSync('assets/art-overrides.json', 'utf8')) : null;   // the art page's prompt edits
const m = buildManifest(CONTENT, { overrides });
const present = new Set();
for (const dir of ['assets/portraits', 'assets/sprites']) if (existsSync(dir)) for (const f of readdirSync(dir)) if (f.endsWith('.webp')) present.add(`${dir}/${f}`);
writeFileSync('assets/manifest.json', JSON.stringify(m, null, 2) + '\n');
writeFileSync('docs/ASSET_CHECKLIST.md', checklistMarkdown(m, present));
console.log(`manifest: ${m.portraits.length} portraits, ${m.sprites.length} sprites, ${m.reuse.length} reuses; ${present.size} files present`);
if (m.missingDescriptions.length) console.log(`  generic descriptions (add them to tools/prompts-data.mjs): ${m.missingDescriptions.join(', ')}`);
