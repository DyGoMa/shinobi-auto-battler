// tools/test-core.mjs — fast regression checks for saves, gacha and objectives.
// `npm run test:core` (also part of `npm test`).
import { C, B } from './common.mjs';
import { migrate, defaultState, encodeSave, decodeSave, SAVE_VERSION, BATTLE_TIP_IDS } from '../js/core/SaveManager.js';
import { startTutorial, completeLesson, skipTutorial } from '../js/core/Tutorial.js';
import { pull } from '../js/core/GachaSystem.js';
import { makeRng, curve, enemyLevelForNode } from '../js/core/formulas.js';
import { completeNode, resolveTeam, levelUp, canLevelUp, nodeBattleConfig, ownedOrLoaner } from '../js/core/Progression.js';
import { BattleSim } from '../js/core/BattleSim.js';

let fails = 0, passes = 0;
const ok = (cond, name) => { if (cond) passes++; else { fails++; console.log('  ✗ ' + name); } };

// ---- saves -----------------------------------------------------------------
const fresh = defaultState(C, B);
ok(fresh.saveVersion === SAVE_VERSION, 'fresh save has current version');
ok(fresh.currencies.scrolls === B.economy.start.scrolls && fresh.currencies.ryo === B.economy.start.ryo, 'starting currencies from balance.js');
ok(['naruto', 'sakura', 'sasuke', 'kakashi'].every(id => fresh.roster[id]), 'starter roster: Naruto, Sakura, Sasuke, Kakashi');
ok(fresh.team.leader === 'kakashi' && fresh.team.members.length === 3, 'Kakashi starts as Leader');
ok(migrate(null, C, B).saveVersion === SAVE_VERSION, 'missing save -> fresh');
ok(migrate('garbage', C, B).currencies.scrolls === B.economy.start.scrolls, 'corrupted (string) save -> fresh');
ok(migrate([1, 2, 3], C, B).roster.naruto, 'corrupted (array) save -> fresh');
const old = migrate({ currencies: { scrolls: '12x', ryo: -5 }, roster: { naruto: { level: 999, stars: 9 }, bogus: 3 }, team: { members: ['nope'] } }, C, B);
ok(old.saveVersion === SAVE_VERSION, 'v0 save migrated to current version');
ok(old.currencies.scrolls === B.economy.start.scrolls && old.currencies.ryo === 0, 'bad currency values sanitized');
ok(old.roster.naruto.level === B.stats.levelCap && old.roster.naruto.stars === B.stats.starCap, 'levels/stars clamped');
ok(!old.roster.bogus && old.roster.sakura, 'junk roster entries dropped, starters restored');
ok(old.team.members.length > 0, 'invalid team replaced with starter team');
const round = decodeSave(encodeSave(fresh));
ok(JSON.stringify(round) === JSON.stringify(fresh), 'export/import base64 round-trip');
const uni = defaultState(C, B); uni.note = '忍者 ⚡ ü';
ok(decodeSave(encodeSave(uni)).note === uni.note, 'unicode survives export/import');

// ---- gacha -----------------------------------------------------------------
{
  const s = defaultState(C, B); s.currencies.scrolls = 1e9;
  const rng = makeRng(42);
  let sinceKage = 0, maxGap = 0, tenOk = true, kages = 0;
  for (let i = 0; i < 300; i++) {
    const r = pull(s, 'standard', 10, C, rng, B);
    if (!r.results.some(x => ['jonin', 'kage'].includes(x.tier))) tenOk = false;
    for (const x of r.results) { if (x.tier === 'kage') { kages++; maxGap = Math.max(maxGap, sinceKage + 1); sinceKage = 0; } else sinceKage++; }
  }
  ok(tenOk, 'every 10-pull has a Jonin or better');
  ok(maxGap <= B.gacha.pity, `pity: Kage at least every ${B.gacha.pity} pulls (max gap ${maxGap})`);
  const rate = kages / 3000;
  ok(rate > 0.02 && rate < 0.06, `Kage rate incl. pity is sane (${(rate * 100).toFixed(1)}%)`);
  const poor = defaultState(C, B); poor.currencies.scrolls = 50;
  ok(!pull(poor, 'standard', 1, C, rng, B).ok && poor.currencies.scrolls === 50, 'cannot pull without scrolls');
  const locked = pull(defaultState(C, B), 'banner_sasuke', 1, C, rng, B);
  ok(!locked.ok, 'locked arc banner refuses pulls');
  const s2 = defaultState(C, B); s2.currencies.scrolls = 1e7;
  for (let i = 0; i < 400; i++) pull(s2, 'standard', 10, C, rng, B);
  ok(Object.values(s2.roster).every(o => o.stars <= B.stats.starCap), 'stars never exceed the cap');
  ok(s2.currencies.ryo > B.economy.start.ryo, 'duplicates past 5★ refund Ryo');
  ok(!s2.roster.zabuza, 'villains do not drop before their arc is cleared');
}

// ---- progression / objectives ------------------------------------------------
{
  const s = defaultState(C, B);
  const r = completeNode(s, C.node.n_bell_1, true, C, B, { time: 30 });
  ok(r.firstClear && r.scrolls > 0 && r.ryo > 0, 'first clear pays scrolls + Ryo');
  const r2 = completeNode(s, C.node.n_bell_1, true, C, B, { time: 30 });
  ok(!r2.firstClear && r2.ryo > 0 && r2.scrolls < r.scrolls, 'replay pays less');
  completeNode(s, C.node.n_bell_2, true, C, B); const r3 = completeNode(s, C.node.n_bell_3, true, C, B);
  ok(r3.arcCleared === 'arc_belltest', 'arc clear bonus fires on the last node');
  const t = resolveTeam(s, C.node.n_bell_1, C);
  ok(t.leader === null && !t.members.includes('kakashi') && ['naruto', 'sakura', 'sasuke'].every(id => t.members.includes(id)), 'Survival Test: forced Team 7, no leader, Kakashi benched');
  const hz = resolveTeam(s, C.node.n_crush_3, C);
  ok(hz.members.includes('hiruzen') && hz.leader === 'hiruzen', 'forced loaner Leader (Third Hokage) joins even if not owned');
  const before = s.currencies.ryo; const lu = levelUp(s, 'naruto', B);
  ok(lu.ok && s.currencies.ryo === before - lu.cost && s.roster.naruto.level === 2, 'level-up spends Ryo');
  s.roster.kakashi.level = 30; s.currencies.ryo = 1e6;
  ok(canLevelUp(s, 'sakura', B).discounted, 'catch-up discount applies to far-behind ninja');
  // survive objective: a team that cannot win still "wins" by surviving
  const node = { ...C.node.n_bell_1, objective: { type: 'survive', seconds: 5 } };
  const cfg = nodeBattleConfig(defaultState(C, B), node, C, B, { seed: 7 });
  const sim = new BattleSim({ ...cfg, recordEvents: false });
  ok(sim.runToEnd({ ultMode: 'none' }) === 'won' && sim.endReason === 'survived', 'survive objective wins on the timer');
  // protect objective: losing the civilian loses the battle
  const pn = C.node.n_waves_1;
  const pc = nodeBattleConfig(defaultState(C, B), pn, C, B, { seed: 3 });
  const psim = new BattleSim({ ...pc, recordEvents: false });
  psim.units.find(u => u.protected).hp = 0;
  psim._tick(psim.tick);
  ok(psim.state === 'lost' && psim.endReason === 'protectFailed', 'protect objective fails when the escort falls');
  // four forced ninja and a Leader outside them: every forced ninja plays and the Leader slot yields
  {
    const gs = defaultState(C, B);
    const g = resolveTeam(gs, C.node.n_kaz_3, C);
    ok(g.members.length === 4 && ['guy', 'lee', 'neji', 'tenten'].every(id => g.members.includes(id)) && g.leader === 'guy' && !g.members.includes('kakashi'), 'four forced ninja all play; the Leader slot yields to the first forced ninja');
    gs.roster.neji = { level: 1, stars: 1 }; gs.team.leader = 'neji';
    const g2 = resolveTeam(gs, C.node.n_kaz_3, C);
    ok(g2.leader === 'neji' && g2.members.length === 4, "the player's Leader is kept when they are one of the forced four");
  }
  // forced ninja never fight below the loaner level (owning one must not be worse)
  {
    const fs = defaultState(C, B); fs.roster.lee = { level: 3, stars: 4 };
    const k3 = C.node.n_kaz_3, lvl = enemyLevelForNode(k3.globalIndex, B);
    const lee = ownedOrLoaner(fs, 'lee', k3, B);
    ok(lee.level === lvl && lee.stars === 4 && !lee.loaner, 'owned forced ninja below the node level fight at it, keeping stars');
    ok(ownedOrLoaner(fs, 'naruto', k3, B).level === fs.roster.naruto.level, 'non-forced ninja keep their own level');
  }
  // Jutsu Clash: the three outcomes stay distinct. Water beats Fire, Earth beats
  // Water, and Wind vs Water is unrelated (standoff/"Cancelled").
  {
    const freshClashSim = () => {
      const wc = nodeBattleConfig(defaultState(C, B), C.node.n_waves_5, C, B, { seed: 5 });
      const ws = new BattleSim({ ...wc, recordEvents: false });
      const u = ws.units.find(x => x.side === 'player' && !x.protected && x.role !== 'Tank');
      const boss = ws.units.find(x => x.side === 'enemy' && x.isBoss);
      const tel = { id: 9999, caster: boss.uid, side: 'enemy', name: 'Test', nature: 'Water', kind: 'jutsu', type: 'single', power: 1, powerMult: 1, startedAt: 0, endsAt: 2, target: u.uid, clashable: true, stun: 0 };
      ws.telegraphs.push(tel);
      Object.assign(u, { taijutsu: false, chakra: B.combat.chakra.max });
      return { ws, u, boss, tel };
    };
    // Overwhelmed: ult deals no damage, the boss's jutsu is ALSO blocked (cancelled,
    // not just weakened), and part of the chakra comes back.
    {
      const { ws, u, boss, tel } = freshClashSim();
      u.natures = ['Fire'];
      const hp = boss.hp;
      const res = ws.fireUlt(u.uid);
      ok(res.clash === 'overwhelmed' && boss.hp === hp, 'Overwhelmed ult deals no damage');
      ok(!ws.telegraphs.includes(tel), "Overwhelmed also cancels the boss's jutsu");
      ok(u.chakra === B.combat.chakra.max * B.jutsuClash.overwhelmedChakraRefund && B.jutsuClash.overwhelmedChakraRefund < 1, 'Overwhelmed ult refunds part (not all) of its chakra');
    }
    // Cancelled (Standoff): both jutsu fizzle, ult still resolves at a reduced
    // multiplier, and no chakra comes back.
    {
      const { ws, u, boss, tel } = freshClashSim();
      u.natures = ['Wind'];
      const hp = boss.hp;
      const res = ws.fireUlt(u.uid);
      ok(res.clash === 'standoff' && boss.hp < hp, 'Cancelled/Standoff ult still deals some damage');
      ok(!ws.telegraphs.includes(tel), 'Cancelled/Standoff cancels the boss jutsu');
      ok(u.chakra === 0, 'Cancelled/Standoff gives no chakra refund');
    }
    // Overpowered: unchanged — bonus damage, caster stunned, chakra refunded.
    {
      const { ws, u, boss, tel } = freshClashSim();
      u.natures = ['Earth'];
      const hp = boss.hp;
      const res = ws.fireUlt(u.uid);
      ok(res.clash === 'overpower' && boss.hp < hp, 'Overpowered ult deals bonus damage');
      ok(!ws.telegraphs.includes(tel), 'Overpowered cancels the boss jutsu');
      ok(u.chakra === B.jutsuClash.overpowerChakraRefund, 'Overpowered ult refunds its fixed chakra amount');
    }
  }
  // ---- Session 4: save v2 and the Academy tutorial ----
  {
    const f2 = defaultState(C, B);
    ok(f2.tutorial.status === 'new' && !f2.tutorial.rewarded && f2.settings.tips && f2.settings.autoUltMode === 'smart', 'fresh save: tutorial to do, tips on, clash-aware Auto-ult mode');
    const prologue = Object.fromEntries(C.arcs[0].nodes.map(n => [n.id, { clears: 1, best: null }]));
    const v1 = { saveVersion: 1, currencies: { scrolls: 100, ryo: 50 }, roster: { naruto: { level: 5, stars: 1 } }, progress: { cleared: prologue }, settings: { onboardingDone: true } };
    const m = migrate(v1, C, B);
    ok(m.saveVersion === SAVE_VERSION && m.tutorial.status === 'done' && m.tutorial.rewarded && !m.tutorial.completed, 'v1 save past the Prologue skips the tutorial automatically');
    ok(m.currencies.scrolls === 100 + B.tutorial.rewards.scrolls && m.currencies.ryo === 50 + B.tutorial.rewards.ryo, 'an automatically skipped tutorial pays its reward');
    ok(BATTLE_TIP_IDS.every(id => m.tips.seen[id]) && m.settings.onboardingDone === undefined, 'the old onboardingDone flag becomes seen battle tips');
    ok(migrate(m, C, B).currencies.scrolls === m.currencies.scrolls, 'loading a migrated save again pays nothing twice');
    const v1b = { saveVersion: 1, currencies: { scrolls: 100, ryo: 50 }, progress: { cleared: { n_bell_1: { clears: 1, best: null } } } };
    ok(migrate(v1b, C, B).tutorial.status === 'new', 'a v1 save that has not cleared the Prologue gets the tutorial');
    ok(migrate({ saveVersion: 2, currencies: {}, tutorial: { status: 'bogus', lesson: 99 } }, C, B).tutorial.status === 'new', 'corrupted tutorial state is repaired');
    const s = defaultState(C, B); startTutorial(s);
    completeLesson(s, 0, C, B); completeLesson(s, 1, C, B);
    ok(s.tutorial.status === 'active' && s.tutorial.lesson === 2 && !s.tutorial.rewarded, 'lessons advance in order');
    const before = s.currencies.scrolls; const r = completeLesson(s, 2, C, B);
    ok(r.finished && s.tutorial.status === 'done' && s.tutorial.completed && s.currencies.scrolls === before + B.tutorial.rewards.scrolls, 'winning the last lesson pays the tutorial reward');
    ok(completeLesson(s, 2, C, B, { replay: true }).reward === null, 'a replay pays nothing');
    const k = defaultState(C, B); const kr = skipTutorial(k, B);
    ok(kr && k.tutorial.status === 'done' && !k.tutorial.completed && k.currencies.scrolls === B.economy.start.scrolls + B.tutorial.rewards.scrolls, 'skipping pays the same reward as finishing');
    ok(skipTutorial(k, B) === null, 'skipping twice pays nothing');
    ok(C.tutorial.nodes.every(n => !C.nodes.includes(n) && !C.node[n.id] && n.globalIndex === -1), 'tutorial lessons are outside the story (no node index, sims or curves)');
    for (const node of C.tutorial.nodes) {
      let w = 0;
      for (let i = 0; i < 60; i++) {
        const cfg = nodeBattleConfig(defaultState(C, B), node, C, B, { seed: 100 + i });
        if (new BattleSim({ ...cfg, recordEvents: false, ultsEnabled: false }).runToEnd({ ultMode: 'none' }) === 'won') w++;
      }
      ok(w === 60, `tutorial ${node.id} is very easy: the starter team wins without Ultimates (${w}/60)`);
    }
    const c3 = nodeBattleConfig(defaultState(C, B), C.tutorial.nodes[2], C, B, { seed: 1 });
    ok(c3.player.every(p => p.startChakraOverride === B.tutorial.clashLessonStartChakra), 'Lesson 3 starts the team with full chakra');
  }
  // curves
  ok(curve({ type: 'step', base: 1, table: [[10, 2], [20, 3]] }, 15) === 2, 'step curve');
  ok(curve({ type: 'exp', base: 2, growth: 2 }, 3) === 16, 'exp curve');
  ok(curve({ type: 'poly', base: 3, growth: 2 }, 4) === 48, 'poly curve');
  ok(curve({ type: 'linear', base: 1, growth: 2, cap: 5 }, 10) === 5, 'curve cap');
}

console.log(`${fails ? 'FAIL' : 'PASS'} — core tests: ${passes} passed, ${fails} failed.`);
process.exit(fails ? 1 : 0);
