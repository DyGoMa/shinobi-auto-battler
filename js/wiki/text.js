// text.js — plain-English effect lines for jutsu and ninja, built from balance.js
// (pure; used by the Wiki and the Roster). Numbers never live in copy.
const n = (v) => String(Math.round(v * 100) / 100);
const pct = (v) => `${Math.round(v * 1000) / 10}%`;

/** What an Ultimate does, e.g. "×4.2 ATK to one enemy, and stuns it for 2.2 s". */
export function ultEffectText(ult, B) {
  const U = B.combat.ult;
  const stun = ult.stun ? (ult.type === 'aoe' ? `, and stuns them for ${n(U.stunDuration * 0.6)} s` : `, and stuns it for ${n(U.stunDuration)} s`) : '';
  switch (ult.type) {
    case 'single': return `Hits one enemy for ×${n(U.single)} ATK${stun}.`;
    case 'aoe': return `Hits every enemy near the target for ×${n(U.aoe)} ATK${stun}.`;
    case 'taunt': return `Taunts: enemies must attack this ninja for ${n(U.tauntDuration)} s, who takes ${pct(U.tauntDR)} less damage, plus a ×${n(U.tauntHit)} ATK hit.`;
    case 'heal': return `Heals every ally for ×${n(U.healPower)} of this ninja's ATK plus ${pct(U.healPctMaxHp)} of their max HP.`;
    case 'buff': return `Raises the whole team's ATK by ${pct(U.buffAtk)} for ${n(U.buffDuration)} s.`;
    default: return '';
  }
}

/** What an enemy's own jutsu does (always telegraphed, so it can be clashed). */
export function enemyJutsuText(j, B) {
  const EJ = B.enemyScaling.enemyJutsu;
  const hit = (j.type || 'single') === 'aoe' ? `×${n(EJ.aoe)} ATK to every ninja near its target` : `×${n(EJ.single)} ATK to one ninja`;
  return `Winds up for ${n(EJ.windup)} s (⚠ bar), then deals ${hit}. Fire an Ultimate during the wind-up to Jutsu Clash it.`;
}

export const ROLE_TEXT = {
  Tank: 'Front line. Holds enemies in place and soaks hits; its Ultimate taunts.',
  Striker: 'Close range. Hits hard from the front, or from right behind a Tank.',
  Ranged: 'Back row. Attacks from long range over the front line.',
  Support: 'Back row. Heals or powers up the whole team with its Ultimate.',
  Civilian: 'An escort you must protect. It never attacks.',
};

export const RANGE_TEXT = { melee: 'Melee (front line)', reach: 'Reach (can hit from behind a Tank)', mid: 'Mid range', long: 'Long range' };
