// tools/manifest-lib.mjs — builds the art manifest from the game's content (docs/ART_BIBLE.md
// §3, §11): one portrait and one sprite per character that needs its own picture, with the
// file it will be saved as, the name to drop it in /incoming under, the pixel sizes, who faces
// which way, and the full Gemini prompt (the style anchor + the character + the facing).
// Pure: no file system here (tools/manifest.mjs and tools/ingest.mjs write the files).
import { VILLAGE_PLATE, DESCRIPTIONS, ALIASES } from './prompts-data.mjs';
import { statureOf } from '../js/core/stature.js';
import { buildPrompts } from './prompt-builder.mjs';

/** The dual-era characters (ART_BIBLE §3.5): a Part I and a Shippuden file each. */
export const DUAL_ERA = ['naruto', 'sakura', 'sasuke', 'kakashi', 'shikamaru', 'choji', 'ino', 'kiba', 'shino', 'hinata', 'neji', 'lee', 'tenten', 'guy', 'asuma', 'kurenai', 'gaara', 'temari', 'kankuro', 'jiraiya', 'tsunade', 'shizune', 'orochimaru', 'kabuto', 'iruka'];
export const PORTRAIT_PX = 256, SPRITE_PX = 512, GENERATE_PX = 1024;
const PORTRAIT_USAGE = 'Roster, Team, Wiki and Summon tokens (56/40 px round, tier ring), the ult bar (46 px), the Ultimate cut-in, the boss intro card, the dialogue box, the Kage reveal';
const SPRITE_USAGE = 'the battlefield figure, drawn at the character\'s canon height (soles to the top of the skull, from the head marks set in the art studio), mirrored for the enemy side';
const VILLAGE_OF_TAG = { leaf: 'leaf', mist: 'mist', sand: 'sand', sound: 'sound', cloud: 'cloud', stone: 'stone', rain: 'rain', akatsuki: null };

/** A generic description from the data, for anything tools/prompts-data.mjs does not cover. */
function genericDescription(def, C) {
  const village = (def.tags || []).map(t => VILLAGE_OF_TAG[t]).find(Boolean) || null;
  const plate = village ? `a cloth forehead protector with ${VILLAGE_PLATE[village]}` : 'no forehead protector';
  const role = { Tank: 'a sturdy front-line fighter', Striker: 'a close-range fighter', Ranged: 'a ranged fighter', Support: 'a support ninja', Civilian: 'an unarmed civilian' }[def.role] || 'a ninja';
  const nat = def.natures?.length ? `, a ${def.natures[0]} Style user` : '';
  return `${def.name}, ${role}${nat} from the Naruto anime, drawn as the show depicts this character; ${plate}; outfit colours around ${def.color}.`;
}
const norm = (s) => String(s).replace(/\s*\((Reanimated|Clone|Shadow Clone|Crow Clone|Water Clone)\)\s*/gi, '').trim();

/** era for a roster character: the part of the arc it unlocks in (starters and achievement unlocks: Part I / Part II). */
export function eraOfChar(def, C) {
  const u = def.unlock;
  if (!u) return 'p1';
  const arcId = u.arcCleared || u.arcReached;
  if (arcId && C.arc[arcId]) return C.arc[arcId].part === 1 ? 'p1' : 'p2';
  return 'p2';
}

/** Build the manifest. Returns { portraits, sprites, reuse, missingDescriptions }. */
export function buildManifest(C, { now = new Date().toISOString(), overrides = null } = {}) {
  const portraits = [], sprites = [], reuse = [], missingDescriptions = [];
  const descOf = (key, era) => {
    const d = DESCRIPTIONS[key]; if (!d) return null;
    if (d.one) return d.one;
    return d[era] || d.p2 || d.p1 || null;
  };
  // Every picture faces the viewer's right: the game mirrors the enemy side itself (Renderer, avatar()).
  const push = ({ id, key, name, era, desc, note = '' }) => {
    const facing = 'right';
    const plain = name.replace(/\s*\((Part I|Shippuden)\)$/, '').replace(/\s+—\s+.*$/, '');
    const reuseFn = (k) => ALIASES[k] || null;
    // The prompts per generator (tools/prompt-builder.mjs): prompts.gemini, prompts.chatgpt (key colour) and
    // prompts.chatgptTransparent; refs: the files to attach, in order. `prompt` is the Gemini one (older tools read it).
    const pp = buildPrompts({ kind: 'portrait', id, era, name: plain, desc, reuse: reuseFn });
    portraits.push({ id, name, era, facing, file: `assets/portraits/${id}.webp`, incoming: id, px: PORTRAIT_PX, generate: GENERATE_PX, aspect: '1:1', usage: PORTRAIT_USAGE, flip: false, note, keyColour: pp.keyColour, refs: pp.refs, prompts: { gemini: pp.gemini, chatgpt: pp.chatgpt, chatgptTransparent: pp.chatgptTransparent }, prompt: pp.gemini });
    // The sprite's target: its canon height and its height in heads (the studio checks the head marks against it).
    const st = statureOf(id, era, { reuse: reuseFn });
    const stature = { kind: st.kind, cm: st.cm, heads: st.heads ? Math.round(st.heads * 100) / 100 : null, estimated: st.estimated, known: st.known };
    const sp = buildPrompts({ kind: 'sprite', id, era, name: plain, desc, reuse: reuseFn });
    sprites.push({ id, name, era, facing, file: `assets/sprites/${id}.webp`, incoming: `sprite_${id}`, px: SPRITE_PX, generate: GENERATE_PX, aspect: '1:1', usage: SPRITE_USAGE, flip: false, note, stature, keyColour: sp.keyColour, refs: sp.refs, prompts: { gemini: sp.gemini, chatgpt: sp.chatgpt, chatgptTransparent: sp.chatgptTransparent }, prompt: sp.gemini });
    void key;
  };
  // ---- the roster: player characters face right; the dual-era ones get a file per era
  const chars = Object.values(C.char);
  for (const d of chars) {
    if (DUAL_ERA.includes(d.id)) {
      for (const era of ['p1', 'p2']) {
        const desc = descOf(d.id, era) || genericDescription(d, C);
        if (!descOf(d.id, era)) missingDescriptions.push(`${d.id}:${era}`);
        push({ id: `${d.id}_${era}`, key: d.id, name: `${d.name} (${era === 'p1' ? 'Part I' : 'Shippuden'})`, era, desc });
      }
    } else {
      const era = eraOfChar(d, C);
      const desc = descOf(d.id, era) || genericDescription(d, C);
      if (!descOf(d.id, era)) missingDescriptions.push(d.id);
      push({ id: d.id, key: d.id, name: d.name, era, desc });
    }
  }
  // ---- enemies: one picture per distinct name; a character who is also in the roster reuses that portrait (mirrored by the game)
  const rosterByName = new Map(chars.map(d => [d.name, d.id]));
  const seenNames = new Map();   // name -> portrait id
  const firstPart = new Map();
  for (const n of C.nodes) for (const e of n.enemies || []) if (!firstPart.has(e.id)) firstPart.set(e.id, n.part);
  for (const d of Object.values(C.enemy)) {
    const own = DESCRIPTIONS[d.id] || (ALIASES[d.id] && DESCRIPTIONS[ALIASES[d.id]] && ALIASES[d.id].startsWith('e_'));
    const key = ALIASES[d.id] && !ALIASES[d.id].startsWith('e_') ? ALIASES[d.id] : (DESCRIPTIONS[d.id] ? d.id : ALIASES[d.id] || null);
    if (seenNames.has(d.name)) { reuse.push({ id: d.id, uses: seenNames.get(d.name) }); continue; }
    const rosterTwin = rosterByName.get(norm(d.name)) || (d.basedOn && C.char[d.basedOn] ? d.basedOn : null);
    if (!own && (rosterTwin || (key && !key.startsWith('e_')))) {
      const twin = rosterTwin || key;
      seenNames.set(d.name, twin);
      reuse.push({ id: d.id, uses: twin, note: 'the roster portrait, mirrored by the game' });
      continue;
    }
    const pid = key && key.startsWith('e_') ? key : d.id;
    if (seenNames.has(pid)) { reuse.push({ id: d.id, uses: pid }); continue; }
    const era = firstPart.get(d.id) === 1 ? 'p1' : firstPart.get(d.id) === 2 ? 'p2' : (d.id.startsWith('npc_') ? 'p1' : 'p2');
    const desc = descOf(pid, era) || genericDescription(d, C);
    if (!descOf(pid, era)) missingDescriptions.push(d.id);
    seenNames.set(d.name, pid); seenNames.set(pid, pid);
    push({ id: pid, key: pid, name: d.name + (d.title ? ` — ${d.title}` : ''), era, desc, note: d.role === 'Civilian' ? 'a civilian the team protects' : '' });
    if (pid !== d.id) reuse.push({ id: d.id, uses: pid, note: 'the same picture' });
  }
  // The user's own wording stays in assets/art-overrides.json (prompts: "<kind>:<id>" for the Gemini tab,
  // "<kind>:<id>@chatgpt" for the ChatGPT tab). The manifest only flags it; the art page shows theirs beside the
  // generated prompt, which follows design changes, so a change never touches their wording.
  const ov = overrides?.prompts || {};
  for (const e of portraits) if (ov[`portrait:${e.id}`] || ov[`portrait:${e.id}@chatgpt`]) e.promptOverride = true;
  for (const e of sprites) if (ov[`sprite:${e.id}`] || ov[`sprite:${e.id}@chatgpt`]) e.promptOverride = true;
  return { generated: now, version: 2, portraits, sprites, reuse, missingDescriptions };
}

/**
 * The reuse map the game reads from assets/index.json: enemy id → the id whose art it wears,
 * with chains followed to the end (e_mizuki_clash → e_mizuki, e_kakashi_bell2 → kakashi).
 * A roster character's art is keyed by era (kakashi_p1 / kakashi_p2); the game picks the era.
 */
export function reuseMap(manifest) {
  const direct = new Map((manifest.reuse || []).map(r => [r.id, r.uses]));
  const out = {};
  for (const id of [...direct.keys()].sort()) {
    let to = direct.get(id); const seen = new Set([id]);
    while (direct.has(to) && !seen.has(to)) { seen.add(to); to = direct.get(to); }
    out[id] = to;
  }
  return out;
}

/** The checklist markdown: every file, who it is, and whether it exists (present: a Set of manifest file paths). */
export function checklistMarkdown(manifest, present, { now = new Date().toISOString() } = {}) {
  const row = (e) => `| \`${e.file.split('/').pop()}\` | ${e.name} | ${e.era === 'p1' ? 'Part I' : 'Shippuden'} | ${e.facing} | ${present.has(e.file) ? '✓' : '—'} |`;
  const count = (list) => `${list.filter(e => present.has(e.file)).length} / ${list.length}`;
  const lines = [
    '# Asset checklist', '',
    `Generated by \`node tools/manifest.mjs\` and updated by \`node tools/ingest.mjs\` (${now.slice(0, 10)}). ✓ = the file is in \`assets/\`; — = still to make. The game draws its code fallback for every missing file.`, '',
    '## How to make one', '',
    '1. Open `assets/manifest.json`, find the entry, copy its `prompt` into Gemini (image generation, 1024 × 1024).',
    '2. Save the result in `/incoming` under the entry\'s `incoming` name (`naruto_p1.png`, `sprite_naruto_p1.png`). Save as **PNG**: a JPEG blurs the edge against the magenta and can leave a faint pale fringe after keying (the ingest tool cleans the edge, but a PNG needs no cleaning).',
    '3. `node tools/ingest.mjs` — keys the flat background out (magenta or white, by flood fill from the border), mirrors anything listed with `--flip id`, crops, resizes, writes the WebP and refreshes `assets/index.json` and this file.',
    '4. Reload the game: the portrait or sprite appears wherever that character shows.', '',
    `## Portraits (${count(manifest.portraits)})`, '',
    '| File | Who | Era | Faces | Have |', '|---|---|---|---|---|',
    ...manifest.portraits.map(row), '',
    `## Sprites (${count(manifest.sprites)})`, '',
    '| File | Who | Era | Faces | Have |', '|---|---|---|---|---|',
    ...manifest.sprites.map(row), '',
    '## Reused portraits', '',
    'These enemies use another entry\'s picture (the same character, mirrored by the game, or a variant that shares the look):', '',
    ...manifest.reuse.map(r => `- \`${r.id}\` → \`${r.uses}\`${r.note ? ` (${r.note})` : ''}`), '',
  ];
  return lines.join('\n');
}
