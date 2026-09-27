// stature.js — how tall each ninja stands. Every battle figure is drawn at its canon height
// (the Naruto databooks, per era; js/content/heights.js), measured from the soles to the top of
// the skull, not the hair. Every head is the same size: Part I Naruto sets it, and a character's
// height in heads is their height over that head. Giants (tailed beasts, Manda, giant summons)
// get one fixed size that fits the battlefield.
import { HEIGHTS } from '../content/heights.js';

export const REF_CM = HEIGHTS.naruto?.p1 ?? 147.5;   // Naruto, end of Part I (databook): the reference figure
export const REF_HEADS = 5.42;               // his height in heads, measured from his sprite's marks (assets/index.json figures): (feet - top) / (chin - top)
export const HEAD_CM = REF_CM / REF_HEADS;   // one head, in canon centimetres (about 41 cm)
export const GIANT_SCALE = 2.5;              // a giant stands 2.5× Part I Naruto (about twice Kakashi)
export const DEFAULT_CM = 165;               // anyone the table misses (flagged by tools/validate.mjs)

/** The table row for an id: its own, else the art it reuses, else the roster ninja it is based on. */
export function heightRow(id, { reuse = null, basedOn = null } = {}) {
  const base = String(id).replace(/_p[12]$/, '');
  const tries = [id, base, reuse ? reuse(id) : null, reuse ? reuse(base) : null, basedOn];
  for (const k of tries) if (k && HEIGHTS[k]) return { key: k, ...HEIGHTS[k] };
  return null;
}

/** Height in cm for an era ('p1' | 'p2'): the era's own value, else the other one. */
function cmOf(row, era) { return row[era] ?? row.p2 ?? row.p1 ?? DEFAULT_CM; }

/**
 * { cm, scale, heads, kind, estimated, known } for a unit key in an era. scale is relative to
 * Part I Naruto (1.0); a giant has cm null and scale GIANT_SCALE.
 */
export function statureOf(id, era = 'p1', opts = {}) {
  const row = heightRow(id, opts);
  if (!row) return { cm: DEFAULT_CM, scale: DEFAULT_CM / REF_CM, heads: DEFAULT_CM / HEAD_CM, kind: 'human', estimated: true, known: false };
  if (row.kind === 'giant') return { cm: null, scale: GIANT_SCALE, heads: null, kind: 'giant', estimated: row.source !== 'databook', known: true };
  const cm = cmOf(row, era);
  return { cm, scale: cm / REF_CM, heads: row.kind === 'human' ? cm / HEAD_CM : null, kind: row.kind || 'human', estimated: row.source !== 'databook', known: true };
}

/** The proportions line for a sprite prompt (tools/manifest-lib.mjs). */
export function proportionsLine(name, id, era, opts = {}) {
  const s = statureOf(id, era, opts);
  if (s.kind === 'giant') return 'PROPORTIONS: a giant creature, drawn with its natural anatomy (not humanoid proportions); fill most of the frame, standing on the bottom edge, whole silhouette visible.';
  if (s.kind === 'beast') return `PROPORTIONS: an animal or creature about ${Math.round(s.cm)} cm tall at the top of its silhouette, drawn with its natural anatomy; the whole silhouette visible, standing on the bottom edge.`;
  const heads = s.heads.toFixed(1);
  return `PROPORTIONS: ${name} is ${Math.round(s.cm * 10) / 10} cm tall. Draw the figure ${heads} heads tall: the head, from the chin to the top of the skull (not counting hair that sticks up), is exactly 1/${heads} of the height from the soles to the top of the skull. Every character in this set has the same head size; Naruto Uzumaki in Part I (${Math.round(REF_CM)} cm) is ${REF_HEADS} heads tall, so a taller character has a longer body and legs, not a bigger head. If a reference image of Part I Naruto's sprite is attached, match its head size and line weight exactly, but not his outfit, pose or colours, and not its line colour: the lines here are near-black.`;
}
