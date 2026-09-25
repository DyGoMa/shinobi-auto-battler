// markdown.js — a small, safe Markdown reader for the wiki guides (wiki/guides/*.md).
// Pure (no DOM): the game renders the tree it returns, and tools/validate.mjs uses it
// to check links and config placeholders. Supports what the guides use:
//   # / ## / ### headings, paragraphs, - and 1. lists (one nesting level),
//   > tip boxes, | tables |, ---, **bold**, *italic*, `code`, [text](target)
// Link targets: `wiki:<page id>` (another wiki page, optional #anchor) or https://…
// Config values: {{fmt:path.in.balance}} — see fillPlaceholders(). Raw HTML is never
// interpreted: everything is text.

/** Resolve `a.b.c` inside an object. */
export function getPath(obj, path) {
  let v = obj;
  for (const k of String(path).split('.')) { if (v == null || typeof v !== 'object' || !(k in v)) return undefined; v = v[k]; }
  return v;
}

const trim0 = (s) => String(s).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
export const FORMATS = {
  // {{num:economy.pullCost.ten}} -> 900 (thousands separators)
  num: (v) => typeof v === 'number' ? Math.round(v * 1000) / 1000 >= 1000 ? Math.round(v).toLocaleString('en-US') : trim0(v.toFixed(3)) : String(v),
  // {{pct:gacha.rates.kage}} -> 2%
  pct: (v) => `${trim0((v * 100).toFixed(1))}%`,
  // {{x:natureWheel.advantage}} -> ×1.12
  x: (v) => `×${trim0(Number(v).toFixed(3))}`,
  // {{plus:stats.starBonus}} -> +10%
  plus: (v) => `+${trim0((v * 100).toFixed(1))}%`,
  // {{tier:gacha.pityTier}} -> Kage
  tier: (v) => String(v).charAt(0).toUpperCase() + String(v).slice(1),
  // {{cycle:natureWheel.cycle}} -> Fire › Wind › Lightning › Earth › Water › Fire
  cycle: (v) => [...v, v[0]].join(' › '),
  // {{speeds:qol.battleSpeeds}} -> 1×, 2× or 5×
  speeds: (v) => v.map(x => `${x}×`).join(', ').replace(/, ([^,]*)$/, ' or $1'),
  // {{arc:daily.unlockArc}} -> Land of Waves (the arc id in config, shown by name; needs sources.arcNames)
  arc: (v, sources) => sources.arcNames?.[v],
};
FORMATS.cfg = FORMATS.num;
const ARRAY_FORMATS = ['cycle', 'speeds'];

const PLACEHOLDER = /\{\{\s*([a-z]+)\s*:\s*([\w.]+)\s*\}\}/g;

/** Replace {{fmt:path}} with values from `sources` ({ balance, ... } — the path's first
 *  segment picks the source when it matches one, otherwise balance is used).
 *  Returns { text, errors }. */
export function fillPlaceholders(text, sources) {
  const errors = [];
  const out = String(text).replace(PLACEHOLDER, (m, fmt, path) => {
    const f = FORMATS[fmt];
    const [head, ...rest] = path.split('.');
    const v = sources[head] !== undefined && rest.length ? getPath(sources[head], rest.join('.')) : getPath(sources.balance, path);
    if (!f) { errors.push(`unknown format "${fmt}" in ${m}`); return m; }
    const ok = ARRAY_FORMATS.includes(fmt) ? Array.isArray(v) && v.length > 0
      : v !== undefined && v !== null && typeof v !== 'object' && !(typeof v === 'number' && !Number.isFinite(v));
    if (!ok) { errors.push(`${m} does not resolve to a config value`); return m; }
    const shown = f(v, sources);
    if (shown == null) { errors.push(`${m} does not name a known arc`); return m; }
    return shown;
  });
  return { text: out, errors };
}

/** Every {{…}} placeholder in a text (for validation). */
export function placeholders(text) { return [...String(text).matchAll(PLACEHOLDER)].map(m => ({ raw: m[0], fmt: m[1], path: m[2] })); }

// ---------------------------------------------------------------------------
// Inline: **bold**, *italic*, `code`, [text](target)
// ---------------------------------------------------------------------------
export function parseInline(src) {
  const out = [];
  let buf = '';
  const flush = () => { if (buf) { out.push({ t: 'text', v: buf }); buf = ''; } };
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '\\' && i + 1 < src.length) { buf += src[i + 1]; i += 2; continue; }
    if (c === '`') {
      const j = src.indexOf('`', i + 1);
      if (j > i) { flush(); out.push({ t: 'code', v: src.slice(i + 1, j) }); i = j + 1; continue; }
    }
    if (c === '*' && src[i + 1] === '*') {
      const j = src.indexOf('**', i + 2);
      if (j > i + 1) { flush(); out.push({ t: 'b', c: parseInline(src.slice(i + 2, j)) }); i = j + 2; continue; }
    }
    if (c === '*' && src[i + 1] !== ' ') {
      const j = src.indexOf('*', i + 1);
      if (j > i + 1 && src[j - 1] !== ' ') { flush(); out.push({ t: 'i', c: parseInline(src.slice(i + 1, j)) }); i = j + 1; continue; }
    }
    if (c === '[') {
      const close = src.indexOf('](', i);
      const end = close > i ? src.indexOf(')', close + 2) : -1;
      if (close > i && end > close) { flush(); out.push({ t: 'a', href: src.slice(close + 2, end).trim(), c: parseInline(src.slice(i + 1, close)) }); i = end + 1; continue; }
    }
    buf += c; i++;
  }
  flush();
  return out;
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------
export function slugify(s) {
  return String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const inlineText = (nodes) => nodes.map(n => n.t === 'text' || n.t === 'code' ? n.v : inlineText(n.c || [])).join('');

/** Parse markdown into a block tree. */
export function parseMarkdown(text) {
  const lines = String(text).replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, '').split('\n');
  const blocks = [];
  let i = 0;
  const isBlank = (l) => !l || !l.trim();
  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) { i++; continue; }
    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      const inline = parseInline(m[2].trim());
      blocks.push({ t: 'h', level: m[1].length, c: inline, id: slugify(inlineText(inline)) }); i++; continue;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { blocks.push({ t: 'hr' }); i++; continue; }
    if (/^\s*>/.test(line)) {
      const body = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { body.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
      blocks.push({ t: 'quote', c: parseMarkdown(body.join('\n')) }); continue;
    }
    if (/^\s*\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = (r) => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(x => parseInline(x.trim()));
      const sep = rows[1] && /^\s*\|?\s*:?-{2,}/.test(rows[1]);
      blocks.push({ t: 'table', head: sep ? cells(rows[0]) : null, rows: (sep ? rows.slice(2) : rows).map(cells) });
      continue;
    }
    if ((m = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/))) {
      const ordered = /\d/.test(m[2]);
      const items = [];
      while (i < lines.length) {
        const l = lines[i];
        const top = l.match(/^([-*]|\d+\.)\s+(.*)$/);
        const sub = l.match(/^\s{2,}([-*]|\d+\.)\s+(.*)$/);
        if (top) { items.push({ c: parseInline(top[2]), sub: [] }); i++; continue; }
        if (sub && items.length) { items[items.length - 1].sub.push(parseInline(sub[2])); i++; continue; }
        if (!isBlank(l) && /^\s{2,}\S/.test(l) && items.length) { const it = items[items.length - 1]; it.c = it.c.concat({ t: 'text', v: ' ' }, parseInline(l.trim())); i++; continue; }
        break;
      }
      if (items.length) { blocks.push({ t: ordered ? 'ol' : 'ul', items }); continue; }
      // Not a list after all (e.g. deeper indentation): fall through as a paragraph.
    }
    const para = [];
    while (i < lines.length && !isBlank(lines[i]) && !/^(#{1,3}\s|\s*>|\s*\||\s*([-*]|\d+\.)\s|\s*(-{3,}|\*{3,})\s*$)/.test(lines[i])) { para.push(lines[i].trim()); i++; }
    if (!para.length) { para.push(lines[i].trim()); i++; } // always make progress
    blocks.push({ t: 'p', c: parseInline(para.join(' ')) });
  }
  return blocks;
}

/** Every link target in a block tree (for validation). */
export function collectLinks(blocks) {
  const out = [];
  const walkInline = (nodes) => { for (const n of nodes || []) { if (n.t === 'a') out.push(n.href); if (n.c) walkInline(n.c); } };
  const walk = (bs) => {
    for (const b of bs) {
      if (b.t === 'quote') walk(b.c);
      else if (b.t === 'ul' || b.t === 'ol') for (const it of b.items) { walkInline(it.c); for (const s of it.sub) walkInline(s); }
      else if (b.t === 'table') { for (const r of [b.head || [], ...b.rows]) for (const cell of r) walkInline(cell); }
      else if (b.c) walkInline(b.c);
    }
  };
  walk(blocks);
  return out;
}

/** Heading anchors of a block tree. */
export function headingIds(blocks) { return blocks.filter(b => b.t === 'h').map(b => b.id); }

/** Plain text of a block tree (for search). */
export function plainText(blocks) {
  const parts = [];
  const walk = (bs) => {
    for (const b of bs) {
      if (b.t === 'quote') walk(b.c);
      else if (b.t === 'ul' || b.t === 'ol') for (const it of b.items) { parts.push(inlineText(it.c)); for (const s of it.sub) parts.push(inlineText(s)); }
      else if (b.t === 'table') { for (const r of [b.head || [], ...b.rows]) parts.push(r.map(inlineText).join(' ')); }
      else if (b.c) parts.push(inlineText(b.c));
    }
  };
  walk(blocks);
  return parts.join(' ');
}
