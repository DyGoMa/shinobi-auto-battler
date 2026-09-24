// tools/wiki-check.mjs — the Wiki's validate check (run by `npm run validate`).
//   * every character, jutsu, enemy, arc, banner and achievement has a generated page
//     (and no two jutsu names collapse onto one page);
//   * every guide in js/wiki/WikiData.js GUIDES exists, and every .md in wiki/guides is listed;
//   * every guide link resolves (wiki:<page>[#anchor], action:<name> or https://);
//   * every {{fmt:path}} placeholder resolves to a config value;
//   * no guide types a config value by hand (GUARDED below): it must use a placeholder.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CONTENT as C } from '../js/content/index.js';
import { BALANCE as B } from '../js/config/balance.js';
import { buildWikiIndex, GUIDES, HELP_PAGES, WIKI_ACTIONS, jutsuCatalog, guideSources } from '../js/wiki/WikiData.js';
import { parseMarkdown, collectLinks, fillPlaceholders, headingIds, getPath, slugify } from '../js/wiki/markdown.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * Config values the guides talk about. A guide must show them through a {{fmt:path}}
 * placeholder, never as a typed number. fmt: how the number would appear in prose
 * ('pct' = 60%, 'x' = ×1.12, default = a plain number); ctx: for plain numbers, a word
 * that must be nearby for the match to count (keeps "3 members" from tripping it).
 * SESSION 5+: add every new player-facing config value a guide mentions.
 */
export const GUARDED = [
  { path: 'gacha.pity', ctx: /summon|pull|kage|guarantee/i },
  { path: 'gacha.rates.genin', fmt: 'pct' }, { path: 'gacha.rates.chunin', fmt: 'pct' },
  { path: 'gacha.rates.jonin', fmt: 'pct' }, { path: 'gacha.rates.kage', fmt: 'pct' },
  { path: 'gacha.rateUpShare', fmt: 'pct' },
  { path: 'economy.pullCost.single', ctx: /scroll|summon/i }, { path: 'economy.pullCost.ten', ctx: /scroll|summon/i },
  { path: 'economy.start.scrolls', ctx: /scroll/i }, { path: 'economy.start.ryo', ctx: /ryo/i },
  { path: 'economy.levelUpCost.base', ctx: /ryo|level/i }, { path: 'economy.levelUpCost.growth', ctx: /ryo|level/i },
  { path: 'economy.catchUp.gap', ctx: /behind|catch/i }, { path: 'economy.catchUp.discount', fmt: 'pct' },
  { path: 'economy.bossNodeBonusMult', fmt: 'x' },
  { path: 'stats.levelCap', ctx: /level|cap/i }, { path: 'stats.starCap', ctx: /★|star/i },
  { path: 'stats.starBonus', fmt: 'pct' }, { path: 'stats.levelMult.growth', fmt: 'pct' },
  { path: 'natureWheel.advantage', fmt: 'x' }, { path: 'natureWheel.disadvantage', fmt: 'x' },
  { path: 'jutsuClash.overpowerUltMult', fmt: 'x' }, { path: 'jutsuClash.standoffUltMult', fmt: 'x' },
  { path: 'jutsuClash.overwhelmedChakraRefund', fmt: 'pct' }, { path: 'jutsuClash.tankGuardDR', fmt: 'pct' },
  { path: 'jutsuClash.overpowerChakraRefund', ctx: /chakra/i }, { path: 'jutsuClash.overpowerStun', ctx: /second|stun/i },
  { path: 'enemyScaling.enemyJutsu.windup', ctx: /second|wind/i }, { path: 'bossMechanics.telegraphAoE.windup', ctx: /second|wind/i },
  { path: 'combat.taijutsuDefIgnore', fmt: 'pct' },
  { path: 'leader.scopedMult', fmt: 'x' }, { path: 'leader.tierMult.kage', fmt: 'x' },
  { path: 'bossRush.loopMult', fmt: 'x' },
  { path: 'tutorial.rewards.scrolls', ctx: /scroll|tutorial/i }, { path: 'tutorial.rewards.ryo', ctx: /ryo|tutorial/i },
];

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const trim0 = (n) => String(Math.round(n * 1000) / 1000);

/** Patterns a guarded value would show up as when typed by hand. */
function patternsFor(g) {
  const v = getPath(B, g.path);
  if (typeof v !== 'number') return [];
  if (g.fmt === 'pct') return [new RegExp(`(?<![\\d.])${esc(trim0(v * 100))}\\s?%`, 'g')];
  if (g.fmt === 'x') return [new RegExp(`(?<![\\d.])[×x]?\\s?${esc(trim0(v))}(?![\\d])`, 'g')];
  const forms = [...new Set([String(v), v.toLocaleString('en-US')])].map(esc).join('|');
  return [new RegExp(`(?<![\\d.,])(?:${forms})(?![\\d]|[.,]\\d)`, 'g')];
}

/** Prose with placeholders, comments, link targets and code removed. */
function prose(raw) {
  return raw.replace(/<!--[\s\S]*?-->/g, ' ').replace(/\{\{[^}]*\}\}/g, ' ').replace(/\]\([^)]*\)/g, '] ').replace(/`[^`]*`/g, ' ');
}

export function checkWiki({ achievements = [] } = {}) {
  const errors = [];
  const index = buildWikiIndex(C, B, { achievements });
  // ---- 1. every content entry has its generated page
  const need = (id, title, what) => {
    const p = index.byId.get(id);
    if (!p) errors.push(`wiki: no page for ${what} (${id})`);
    else if (title && p.title !== title) errors.push(`wiki: page ${id} is titled "${p.title}", expected "${title}"`);
  };
  for (const c of C.roster) need(`character/${c.id}`, c.name, `character ${c.id}`);
  const catalog = jutsuCatalog(C);
  for (const j of catalog) {
    need(`jutsu/${j.slug}`, j.name, `jutsu "${j.name}"`);
    if (j.collisions.length) errors.push(`wiki: jutsu names ${[j.name, ...j.collisions].map(n => `"${n}"`).join(' and ')} share one page (jutsu/${j.slug}): rename one`);
  }
  const names = [...C.roster.map(c => c.ult.name), ...C.enemies.flatMap(e => [e.jutsu?.name, ...(e.mechanics || []).map(m => m.name)])].filter(Boolean);
  for (const n of new Set(names)) need(`jutsu/${slugify(n)}`, null, `jutsu "${n}"`);
  for (const e of C.enemies) need(`enemy/${e.id}`, e.name, `enemy ${e.id}`);
  for (const a of [C.tutorial, ...C.arcs].filter(Boolean)) need(`arc/${a.id}`, a.name, `arc ${a.id}`);
  for (const b of C.banners) need(`banner/${b.id}`, b.name, `banner ${b.id}`);
  for (const a of achievements) need(`achievement/${a.id}`, a.name, `achievement ${a.id}`);
  for (const [screen, pid] of Object.entries(HELP_PAGES)) if (!index.byId.has(pid)) errors.push(`wiki: the ? button on "${screen}" points at a missing page (${pid})`);

  // ---- 2. guides exist, are listed, and parse
  const dir = `${ROOT}wiki/guides`;
  const files = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.md')) : [];
  for (const f of files) if (!GUIDES.some(g => g.file === `wiki/guides/${f}`)) errors.push(`wiki: wiki/guides/${f} is not listed in GUIDES (js/wiki/WikiData.js)`);
  const parsed = new Map();
  for (const g of GUIDES) {
    const path = `${ROOT}${g.file}`;
    if (!existsSync(path)) { errors.push(`wiki: guide ${g.id} is missing its file ${g.file}`); continue; }
    const raw = readFileSync(path, 'utf8');
    const { text, errors: pe } = fillPlaceholders(raw, guideSources(B));
    for (const e of pe) errors.push(`wiki: ${g.file}: ${e}`);
    parsed.set(g.id, { raw, blocks: parseMarkdown(text) });
  }

  // ---- 3. links resolve; 4. no hand-typed config values
  let links = 0;
  for (const [gid, { raw, blocks }] of parsed) {
    for (const href of collectLinks(blocks)) {
      links++;
      if (href.startsWith('wiki:')) {
        const [pid, anchor] = href.slice(5).split('#');
        if (!index.byId.has(pid)) errors.push(`wiki: ${gid} links to a missing page: ${href}`);
        else if (anchor && parsed.has(pid) && !headingIds(parsed.get(pid).blocks).includes(anchor)) errors.push(`wiki: ${gid} links to a missing heading: ${href}`);
      } else if (href.startsWith('action:')) {
        if (!WIKI_ACTIONS.includes(href.slice(7))) errors.push(`wiki: ${gid} uses an unknown action link: ${href}`);
      } else if (!/^https:\/\/\S+$/.test(href)) errors.push(`wiki: ${gid} has a link that is not wiki:<page>, action:<name> or https://… : "${href}"`);
    }
    const text = prose(raw);
    for (const g of GUARDED) {
      for (const re of patternsFor(g)) {
        for (const m of text.matchAll(re)) {
          if (g.ctx && !g.ctx.test(text.slice(Math.max(0, m.index - 45), m.index + m[0].length + 45))) continue;
          errors.push(`wiki: ${gid} types "${m[0].trim()}" by hand (balance.${g.path}); use a placeholder such as {{${g.fmt || 'num'}:${g.path}}}`);
        }
      }
    }
  }
  return { errors, pages: index.pages.length, guides: parsed.size, links };
}
