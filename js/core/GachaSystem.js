// GachaSystem.js — summon logic. Pure functions over (state, content, balance, rng).
import { BALANCE } from '../config/balance.js';
import { TIERS } from './formulas.js';
import { isCharacterAvailable, isBannerUnlocked } from './Progression.js';

const TIER_RANK = { genin: 0, chunin: 1, jonin: 2, kage: 3 };

/** Characters that can drop from a banner right now, grouped by tier. */
export function bannerPool(banner, state, C) {
  const byTier = { genin: [], chunin: [], jonin: [], kage: [] };
  const featuredByTier = { genin: [], chunin: [], jonin: [], kage: [] };
  const featured = new Set(banner.featured || []);
  for (const c of C.roster) {
    if (c.notPullable) continue;
    if (!isCharacterAvailable(state, c, C)) continue;
    byTier[c.tier].push(c.id);
    if (banner.type === 'arc' && featured.has(c.id)) featuredByTier[c.tier].push(c.id);
  }
  return { byTier, featuredByTier };
}

/** Effective per-tier rates for display ("Kage 2% — featured: Tsunade 1%"). */
export function bannerRates(banner, state, C, B = BALANCE) {
  const { byTier, featuredByTier } = bannerPool(banner, state, C);
  const rows = [];
  for (const t of TIERS) {
    const rate = B.gacha.rates[t];
    const f = featuredByTier[t];
    const share = f.length && byTier[t].length > f.length ? B.gacha.rateUpShare : (f.length ? 1 : 0);
    rows.push({ tier: t, rate, count: byTier[t].length, featured: f.map(id => ({ id, rate: rate * share / f.length })) });
  }
  return rows;
}

function rollTier(rng, B, minTier = 'genin') {
  const rates = B.gacha.rates;
  const allowed = TIERS.filter(t => TIER_RANK[t] >= TIER_RANK[minTier]);
  const total = allowed.reduce((s, t) => s + rates[t], 0);
  let r = rng() * total;
  for (const t of allowed) { r -= rates[t]; if (r < 0) return t; }
  return allowed[allowed.length - 1];
}

function pickCharacter(tier, pool, rng, B) {
  // Fall back to the nearest lower tier that has characters, then upward.
  let t = tier;
  const order = [...TIERS.slice(0, TIER_RANK[tier] + 1).reverse(), ...TIERS.slice(TIER_RANK[tier] + 1)];
  for (const cand of order) { if (pool.byTier[cand].length) { t = cand; break; } }
  const all = pool.byTier[t];
  if (!all.length) return null;
  const feat = pool.featuredByTier[t];
  if (feat.length) {
    const others = all.filter(id => !feat.includes(id));
    if (!others.length || rng() < B.gacha.rateUpShare) return { id: feat[Math.floor(rng() * feat.length)], tier: t, featured: true };
    return { id: others[Math.floor(rng() * others.length)], tier: t, featured: false };
  }
  return { id: all[Math.floor(rng() * all.length)], tier: t, featured: false };
}

/** Can the player afford `count` pulls (1 or 10)? */
export function pullCost(count, B = BALANCE) { return count >= 10 ? B.economy.pullCost.ten : B.economy.pullCost.single * count; }
export function canAfford(state, count, B = BALANCE) { return state.currencies.scrolls >= pullCost(count, B); }

/**
 * Perform `count` pulls (1 or 10) on `banner`. Mutates state (scrolls, roster,
 * pity, stats). Returns { ok, error?, results: [{ id, tier, featured, isNew, stars, refund, pity }] }.
 */
export function pull(state, bannerId, count, C, rng, B = BALANCE) {
  const banner = C.banner[bannerId];
  if (!banner) return { ok: false, error: 'Unknown banner' };
  if (!isBannerUnlocked(state, banner, C)) return { ok: false, error: 'Banner locked' };
  const cost = pullCost(count, B);
  if (state.currencies.scrolls < cost) return { ok: false, error: `Not enough scrolls (${cost} needed)` };
  state.currencies.scrolls -= cost;
  return { ok: true, results: doPulls(state, banner, count, C, rng, B) };
}

/**
 * One summon paid with a ticket instead of scrolls (achievement rewards).
 * kind 'tickets' = a normal summon; 'rareTickets' = guaranteed
 * balance.achievements.rareTicketMinTier or better. Pity counts as usual.
 */
export function ticketPull(state, bannerId, kind, C, rng, B = BALANCE) {
  const banner = C.banner[bannerId];
  if (!banner) return { ok: false, error: 'Unknown banner' };
  if (!isBannerUnlocked(state, banner, C)) return { ok: false, error: 'Banner locked' };
  if (!['tickets', 'rareTickets'].includes(kind)) return { ok: false, error: 'Unknown ticket' };
  if (!(state.currencies[kind] > 0)) return { ok: false, error: 'No tickets left' };
  state.currencies[kind]--;
  const minTier = kind === 'rareTickets' ? B.achievements.rareTicketMinTier : 'genin';
  return { ok: true, results: doPulls(state, banner, 1, C, rng, B, { minTier }) };
}

function doPulls(state, banner, count, C, rng, B, { minTier = 'genin' } = {}) {
  const pool = bannerPool(banner, state, C);
  const G = B.gacha;
  const picks = [];
  for (let i = 0; i < count; i++) {
    let tier;
    const pityHit = state.gacha.pity + 1 >= G.pity;
    if (pityHit) tier = G.pityTier;
    else tier = rollTier(rng, B, minTier);
    // 10-pull guarantee on the last pull
    if (count >= 10 && i === count - 1 && !picks.some(p => TIER_RANK[p.tier] >= TIER_RANK[G.tenPullGuaranteeTier]) && TIER_RANK[tier] < TIER_RANK[G.tenPullGuaranteeTier]) {
      tier = rollTier(rng, B, G.tenPullGuaranteeTier);
    }
    const pick = pickCharacter(tier, pool, rng, B);
    if (!pick) continue;
    if (pick.tier === G.pityTier) state.gacha.pity = 0; else state.gacha.pity++;
    picks.push({ ...pick, pityHit });
  }
  state.gacha.totalPulls += picks.length;
  const results = picks.map(p => ({ ...p, ...grantCharacter(state, p.id, C, B) }));
  state.gacha.history = [...results.map(r => ({ id: r.id, tier: r.tier, t: Date.now() })), ...(state.gacha.history || [])].slice(0, 60);
  return results;
}

/** Add a character (or a star / a refund for duplicates). */
export function grantCharacter(state, id, C, B = BALANCE) {
  const def = C.char[id];
  const own = state.roster[id];
  if (!own) { state.roster[id] = { level: 1, stars: 1 }; return { isNew: true, stars: 1, refund: 0 }; }
  if (own.stars < B.stats.starCap) { own.stars++; return { isNew: false, stars: own.stars, refund: 0 }; }
  const refund = B.stats.dupeRefundRyo[def.tier] || 0;
  state.currencies.ryo += refund;
  return { isNew: false, stars: own.stars, refund };
}
