// tools/prompt-builder.mjs — the image prompts, one per generator, built the way the prompting guides
// recommend (docs/ART_BIBLE.md §11; research: OpenAI image prompting, Google's Nano Banana guide, Luma,
// Runway, Adept): the deliverable first, then what each attached reference controls (numbered), then a
// style block, the character, pose and framing, background and constraints. The style, framing and
// background blocks are word-for-word the same in every prompt; only the character block changes.
//
// The reference set: Part I Naruto's sprite is the ruler for every sprite (head size, proportions, line
// weight); his portrait is the ruler for every portrait (framing, head size in the frame). Everyone else's
// sprite attaches Naruto's sprite of the same era; everyone else's portrait attaches Naruto's portrait of the
// same era AND the character's own sprite (so face, outfit and expression match).
// Pure: no file system here.
import { statureOf, REF_HEADS } from '../js/core/stature.js';

export const KEY = { magenta: '#FF00FF', green: '#00FF00', cyan: '#00FFFF', yellow: '#FFFF00' };
const KEY_NAME = { magenta: 'magenta', green: 'bright green', cyan: 'bright cyan', yellow: 'bright yellow' };
/**
 * The background (key) colours in order of preference, each with the colours in a character that would
 * clash with it (a character colour near the key would be keyed out with the background, or tinted by it).
 * A character gets the first key none of their colours clash with; magenta when every one clashes.
 */
export const KEY_ORDER = [
  ['magenta', /\b(pink|magenta|purple|violet|lavender|lilac|fuchsia|mauve|plum)\b/i],
  ['green', /\b(green|lime|olive|emerald|chartreuse|jade|mint)\b/i],
  ['cyan', /\b(cyan|teal|turquoise|aqua|sky[- ]blue|light blue|pale blue|ice[- ]blue)\b/i],
  ['yellow', /\b(yellow|blond|blonde|golden|gold|lemon|amber)\b/i],
];
export function keyColourFor(desc) {
  const d = String(desc || '');
  for (const [key, clash] of KEY_ORDER) if (!clash.test(d)) return key;
  return 'magenta';
}

// ---- fixed blocks (identical in every prompt of a kind)
const STYLE = `STYLE: a frame from the Naruto TV anime of the late 2000s (Studio Pierrot's cel look). Flat saturated colours with two-tone cel shading: one flat shadow tone per colour with a hard edge, no gradients, no airbrush, no painterly texture, no 3D render, no photo realism. Line work: clean near-black lines (#1A1410) at the anime's own weight for everything inside the figure (face, hair strands, clothing folds, hands). The outer outline, every edge where the figure meets the background (including the gaps between the arms and the body and between the legs), is slightly bolder, about 1.25 times the inner lines: firm, but not an obvious thick sticker outline. All lines near-black, never brown, red or purple, and never tinted by the background.`;
const SPRITE_FRAMING = `POSE AND FRAMING: full body, standing in a relaxed ready stance: feet apart, weight balanced, arms held slightly away from the body with loosely closed fists, so there is a clear gap between each arm and the hip. Three-quarter front view: the chest and shoulders face the viewer, the head and body turned toward the viewer's RIGHT (the visible ear on the left side of the face, the nose pointing right). Eye-level camera. The whole figure in frame from the top of the hair to the soles, centred, with a small even margin; feet at the bottom centre. Anything described as being on the back of the outfit is not visible from this angle: do not turn the character to show it.`;
const PORTRAIT_FRAMING = `POSE AND FRAMING: a head-and-chest portrait bust. Three-quarter view with the head turned toward the viewer's RIGHT (the visible ear on the left side of the face) and the eyes looking at the viewer. The torso is turned mostly toward the viewer so the top, jacket or shirt and its design are clearly shown. The WHOLE head and ALL of the hair fit inside the frame with a clear empty margin above the highest point and on both sides (no spike, ponytail or headband tail cut off). A medium close-up with the camera pulled back, not a tight face shot: the highest point of the hair about 6% below the top edge, the chin a little below the middle of the image (about 58% down), and the crop at the lower chest, so the shoulders and the top's design fill the lower part of the image. The head, chin to top of the skull, fills about one third of the image height, the same in every portrait.`;
const CONSTRAINTS = `CONSTRAINTS: one character only. Square 1:1 image (1024 x 1024). No text, no logo, no watermark, no border, no frame, no ground shadow, no floor line, no props unless described.`;
const bgKey = (colour) => `BACKGROUND: a plain, perfectly flat, solid ${KEY_NAME[colour]} background (${KEY[colour]}), one uniform colour from edge to edge, behind the whole character. No gradient, no shading, no scenery, no glow, no shadow. Keep ${KEY_NAME[colour]} out of the character.`;
const BG_TRANSPARENT = `BACKGROUND: transparent. Output a PNG with a real alpha channel (RGBA): a fully transparent background, a crisp silhouette with no halo and no fringe, and NO checkerboard pattern drawn in. Nothing behind the character.`;

/** The reference files an entry attaches, in order (Image 1, Image 2), with what each one controls. */
export function referencesFor({ kind, id, era }) {
  const e = era === 'p2' ? 'p2' : 'p1';
  const naruSprite = { file: `assets/sprites/naruto_${e}.webp`, label: `${e === 'p1' ? 'Part I' : 'Shippuden'} Naruto's sprite` };
  const naruPortrait = { file: `assets/portraits/naruto_${e}.webp`, label: `${e === 'p1' ? 'Part I' : 'Shippuden'} Naruto's portrait` };
  if (kind === 'sprite') {
    if (id === 'naruto_p1') return [];
    if (id === 'naruto_p2') return [{ file: 'assets/sprites/naruto_p1.webp', label: 'Part I Naruto\'s sprite', role: 'the style and line reference: match its art style, cel shading, line weight and head size exactly. The character is the same person three years older and taller, so the body is longer, but the head stays the same size' }];
    return [{ ...naruSprite, role: 'the style and proportion reference ONLY: match its head size, line weight, cel shading and art style exactly. Do NOT copy its face, hair, outfit, colours or pose details; the character below is a different person' }];
  }
  // portraits
  // his own current portrait carries the framing worked out for the set (a remake keeps it); the sprite carries the face
  if (id === 'naruto_p1') return [
    { file: 'assets/portraits/naruto_p1.webp', label: 'Part I Naruto\'s current portrait', role: 'the framing reference ONLY: match its crop, head size in the frame, angle and margins exactly. Do NOT copy its face or headband knot; they come from Image 2' },
    { file: 'assets/sprites/naruto_p1.webp', label: 'Part I Naruto\'s sprite', role: 'the same character: match his face shape, eyes, hair, headband and its knot, outfit, colours and grin exactly, drawn as a close portrait' },
  ];
  if (id === 'naruto_p2') return [
    { file: 'assets/portraits/naruto_p1.webp', label: 'Part I Naruto\'s portrait', role: 'the framing and style reference: match its crop, head size in the frame, angle, line weight and cel shading exactly' },
    { file: 'assets/sprites/naruto_p2.webp', label: 'Shippuden Naruto\'s sprite', role: 'the same character: match his face, hair, headband, outfit, colours and expression exactly' },
  ];
  return [
    { ...naruPortrait, role: 'the framing and style reference ONLY: match its crop, head size in the frame, angle, line weight and cel shading exactly. Do NOT copy its face, hair, outfit or colours' },
    { file: `assets/sprites/${id}.webp`, label: 'this character\'s own sprite', role: 'the same character: match the face, hair, outfit, colours and expression exactly, drawn as a close portrait' },
  ];
}

/** The proportions line for a sprite: the height and the head count (every head the same size). */
function proportions(plainName, id, era, opts) {
  const s = statureOf(id, era, opts);
  if (s.kind === 'giant') return 'PROPORTIONS: a giant creature drawn with its natural anatomy; fill most of the frame, standing on the bottom edge, the whole silhouette visible.';
  if (s.kind === 'beast') return `PROPORTIONS: an animal or creature about ${Math.round(s.cm)} cm tall at the top of its silhouette, drawn with its natural anatomy, the whole silhouette visible.`;
  const heads = s.heads.toFixed(1);
  // the figure fills about 90% of the square (a small margin top and bottom), so the head is 90/heads % of the
  // image height: a number the generators follow better than a head count (Part I Naruto: 20%)
  const pct = Math.round(90 / s.heads);
  const size = ` On the square image the head, chin to the top of the skull, is about ${pct}% of the image height.`;
  if (id === 'naruto_p1') return `PROPORTIONS: ${plainName} is ${Math.round(s.cm)} cm tall and drawn ${heads} heads tall (the head, chin to the top of the skull, not counting hair that sticks up, is 1/${heads} of the height from the soles to the top of the skull): a slim, natural build close to the anime's, with long legs; not chibi, not stocky, not a big head.${size}`;
  return `PROPORTIONS: ${plainName} is ${Math.round(s.cm)} cm tall and drawn ${heads} heads tall (the head, chin to the top of the skull, not counting hair that sticks up, is 1/${heads} of the height from the soles to the top of the skull). The head is the same real size as the head in Image 1, so a taller character has a longer body and legs, not a bigger head (a taller figure filling the same square makes the head a smaller share of the image).${size} The build follows the anime (slim, broad, stocky or tall as the character is drawn there).`;
}

// Part I Naruto's full outfit, head to feet (the reference sprite is described completely).
const NARUTO_P1_BODY = 'Outfit head to feet: an orange tracksuit jacket with navy-blue shoulders and upper sleeves, a white fluffy collar, zipped up the front with a small white zipper pull; orange trousers rolled up at the calves; a dark kunai holster strapped to his right thigh over a white bandage wrap; blue open-toed ninja sandals; a blue cloth forehead protector with a metal plate engraved with the Hidden Leaf Village symbol, its long tails behind his head. Expression: his wide, cheeky, confident grin showing his teeth.';

// Shippuden Naruto's full outfit (checked against the official Part I / Part II art the user supplied)
const NARUTO_P2_BODY = 'Outfit head to feet: the orange and black jacket described above (black sleeves all the way to the wrists, a black collar, shoulders and front panel, orange side panels), orange trousers ending just below the knees, not rolled; a dark kunai holster strapped to his right thigh over a white and black bandage wrap; tall dark charcoal open-toed ninja sandals; the black cloth forehead protector with the metal Hidden Leaf plate, its long black tails hanging behind his head. Expression: his wide confident grin.';

/**
 * The prompts for one manifest entry: { gemini, chatgpt, chatgptTransparent, refs, keyColour }.
 * info: { kind, id, era, name (plain), desc, reuse? }
 */
export function buildPrompts({ kind, id, era, name, desc, reuse = null }) {
  const refs = referencesFor({ kind, id, era });
  const keyColour = keyColourFor(desc);
  const what = kind === 'sprite' ? 'a full-body sprite' : 'a head-and-chest portrait bust';
  const refBlock = refs.length ? 'REFERENCES:\n' + refs.map((r, i) => `Image ${i + 1} (${r.label}): ${r.role}.`).join('\n') : '';
  const body = kind === 'sprite'
    ? (id === 'naruto_p1' ? NARUTO_P1_BODY : id === 'naruto_p2' ? NARUTO_P2_BODY : 'Show the complete outfit exactly as the anime draws this character in this era, head to feet, including trousers or skirt and footwear. Expression: their typical expression in the anime, as described above.')
    : 'Expression: their typical expression in the anime, as described above, the same as in their sprite.';
  // the descriptions join the headband phrase after a colour ('a blue ' + 'a cloth forehead protector'): drop the doubled article
  // (and "a a forehead protector" where a description puts its own article before a phrase that has one)
  const clean = String(desc).replace(/\b(a|an) ([A-Za-z-]+) a cloth forehead protector/gi, (m, art, colour) => `${art} ${colour} cloth forehead protector`)
    .replace(/\b(a|an) (a|an) /gi, '$2 ');
  const character = `CHARACTER: ${clean}\n${body}`;
  const prop = kind === 'sprite' ? proportions(name, id, era, { reuse }) : '';
  const framing = kind === 'sprite' ? SPRITE_FRAMING : PORTRAIT_FRAMING;
  const blocks = (lead, bg) => [lead, refBlock, STYLE, character, prop, framing, bg, CONSTRAINTS].filter(Boolean).join('\n\n');
  const gemini = blocks(`Draw ${what} of ${name} for a 2D game, as a square 1:1 image.`, bgKey(keyColour));
  const leadGpt = `Create a square 1:1 image (1024x1024): ${what} of ${name} for a 2D game. Intended use: a cut-out ${kind} whose background is removed, so the edges must be clean.`;
  const chatgpt = blocks(leadGpt, bgKey(keyColour));
  const chatgptTransparent = blocks(leadGpt, BG_TRANSPARENT);
  return { gemini, chatgpt, chatgptTransparent, refs, keyColour };
}
export { REF_HEADS };
