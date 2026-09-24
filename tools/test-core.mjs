// tools/test-core.mjs — fast regression checks for saves, gacha and objectives.
// `npm run test:core` (also part of `npm test`).
import { C, B } from './common.mjs';
import { migrate, defaultState, encodeSave, decodeSave, SAVE_VERSION, BATTLE_TIP_IDS } from '../js/core/SaveManager.js';
import { startTutorial, completeLesson, skipTutorial } from '../js/core/Tutorial.js';
import { pull, ticketPull, bannerPool } from '../js/core/GachaSystem.js';
import { checkAchievements, claimAchievement, recordBattle, recordDayPlayed } from '../js/core/Achievements.js';
import { makeRng, curve, enemyLevelForNode, beatenBy } from '../js/core/formulas.js';
import { completeNode, resolveTeam, levelUp, canLevelUp, nodeBattleConfig, ownedOrLoaner, isHardUnlocked, isHardNodeUnlocked, isArcHardCleared, isArcCleared, nodeEnemyLevel, buildNodeEnemies, hardNodeRewards, currentNode } from '../js/core/Progression.js';
import { dailyFor, dailyRecord, attemptsLeft, startDailyAttempt, completeDaily, dailyReward, dailyBattleConfig, dailyEnemyNature, dailyContent } from '../js/core/Daily.js';
import { BattleSim } from '../js/core/BattleSim.js';
import { INTRO, introPlan, introSeen, setIntroSeen, menuModel } from '../js/core/StartFlow.js';
import { FirebaseBackend } from '../js/save/FirebaseBackend.js';

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
  // ---- Session 4: achievements, tickets and the exclusive form ----
  {
    const s = defaultState(C, B);
    ok(checkAchievements(s, C, B).length === 0, 'a fresh save has no achievements unlocked');
    s.currencies.scrolls = 1e6;
    pull(s, 'standard', 1, C, makeRng(3), B);
    const fresh = checkAchievements(s, C, B).map(a => a.id);
    ok(fresh.includes('ach_first_summon'), 'the first summon unlocks "First Summon"');
    const before = s.currencies.tickets;
    const c1 = claimAchievement(s, 'ach_first_summon', C, B);
    ok(c1.ok && s.currencies.tickets === before + B.achievements.list.ach_first_summon.reward.tickets, 'claiming pays the reward from balance.js');
    ok(!claimAchievement(s, 'ach_first_summon', C, B).ok && s.currencies.tickets === before + B.achievements.list.ach_first_summon.reward.tickets, 'a reward is paid only once');
    ok(!claimAchievement(s, 'ach_part1', C, B).ok, 'a locked achievement cannot be claimed');
    const pulls0 = s.gacha.totalPulls, sc0 = s.currencies.scrolls;
    const tp = ticketPull(s, 'standard', 'tickets', C, makeRng(4), B);
    ok(tp.ok && s.currencies.tickets === before && s.gacha.totalPulls === pulls0 + 1 && s.currencies.scrolls === sc0, 'a summon ticket is one free summon');
    ok(!ticketPull(s, 'standard', 'tickets', C, makeRng(4), B).ok, 'no ticket, no ticket summon');
    const r = defaultState(C, B); r.currencies.rareTickets = 400;
    const rng = makeRng(9); let low = 0;
    for (let i = 0; i < 400; i++) for (const x of ticketPull(r, 'standard', 'rareTickets', C, rng, B).results) if (x.tier === 'genin') low++;
    ok(low === 0 && r.currencies.rareTickets === 0, `Rare+ tickets never give below ${B.achievements.rareTicketMinTier} (${low} Genin in 400)`);
    // retroactive: an old save that already cleared Part I and owns 10 ninja
    const done = Object.fromEntries(C.nodes.filter(n => n.part === 1).map(n => [n.id, { clears: 1, best: null }]));
    const roster = Object.fromEntries(C.roster.filter(c => !c.notPullable).slice(0, 10).map(c => [c.id, { level: 30, stars: 1 }]));
    const old = migrate({ saveVersion: 1, currencies: { scrolls: 0, ryo: 0 }, roster, progress: { cleared: done } }, C, B);
    const retro = checkAchievements(old, C, B).map(a => a.id);
    ok(retro.includes('ach_part1') && retro.includes('ach_own_10') && !retro.includes('ach_story'), 'existing saves unlock what they already qualify for');
    // retroactive: a current save from before "Part II on Hard" existed, with Part II cleared on Hard
    const h2 = defaultState(C, B);
    for (const n of C.nodes) h2.progress.cleared[n.id] = { clears: 1, best: null };
    for (const n of C.nodes.filter(n => n.part === 2)) h2.progress.hard[n.id] = { clears: 1, best: null };
    const h2retro = checkAchievements(migrate(JSON.parse(JSON.stringify(h2)), C, B), C, B).map(a => a.id);
    ok(h2retro.includes('ach_hard_part2') && !h2retro.includes('ach_hard_part1'), 'a save with Part II cleared on Hard unlocks "Part II on Hard" on load (and not Part I on Hard)');
    // the achievement-exclusive form
    const ex = C.roster.filter(c => c.notPullable);
    ok(ex.length >= 1 && ex.every(c => C.achievements.some(a => a.rewardCharacter === c.id)), 'every non-summonable ninja is an achievement reward');
    const all = defaultState(C, B); for (const n of C.nodes) all.progress.cleared[n.id] = { clears: 1, best: null };
    ok(C.banners.every(b => Object.values(bannerPool(b, all, C).byTier).every(ids => ex.every(c => !ids.includes(c.id)))), 'the exclusive form is in no banner pool, even at the end of the story');
    all.roster.naruto_sage = { level: 77, stars: 2 };
    checkAchievements(all, C, B);
    const got = claimAchievement(all, 'ach_story', C, B);
    ok(got.ok && got.character === 'naruto_chakramode' && all.roster.naruto_chakramode.level === 77 && all.roster.naruto_chakramode.stars === 1, 'completing Part I and Part II gives the exclusive form at the best Naruto form\'s level');
    // combat records
    const fake = (alive, bossLvl, teamLvl, overpower) => ({ stats: { clashes: { overpower } }, units: [
      ...[0, 1, 2].map(i => ({ side: 'player', protected: false, alive: alive || i > 0, level: teamLvl })),
      { side: 'enemy', isBoss: true, alive: false, level: bossLvl }] });
    const cs = defaultState(C, B);
    recordBattle(cs, { won: true, mode: 'story', sim: fake(true, 20, 20, 3), matchup: { label: 'Neutral' } }, B);
    ok(cs.stats.flawlessWins === 1 && cs.stats.clashWins === 3 && cs.stats.counteredWins === 0 && cs.stats.underdogBossWins === 0, 'a flawless win is recorded, with its Overpowers');
    recordBattle(cs, { won: true, mode: 'story', sim: fake(false, 20, 20 - B.achievements.underdogLevels, 0), matchup: { label: 'Poor' } }, B);
    ok(cs.stats.flawlessWins === 1 && cs.stats.counteredWins === 1 && cs.stats.underdogBossWins === 1, 'countered and under-levelled boss wins are recorded');
    recordBattle(cs, { won: true, mode: 'tutorial', sim: fake(true, 20, 1, 5), matchup: { label: 'Bad' } }, B);
    ok(cs.stats.clashWins === 3 && cs.stats.counteredWins === 1, 'tutorial battles never count toward achievements');
    ok(recordDayPlayed(cs, '2026-01-01') && !recordDayPlayed(cs, '2026-01-01') && recordDayPlayed(cs, '2026-01-02') && cs.stats.daysPlayed === 2, 'days played count each calendar day once');
  }
  // ---- Session 4: Hard mode ----
  {
    const s = defaultState(C, B);
    const p1 = C.nodes.filter(n => n.part === 1);
    const [h1, h2] = p1;
    ok(!isHardUnlocked(s, 1, C) && !isHardNodeUnlocked(s, h1, C), 'Hard mode is locked on a fresh save');
    for (const n of p1.slice(0, -1)) s.progress.cleared[n.id] = { clears: 1, best: null };
    ok(!isHardUnlocked(s, 1, C), 'Hard mode stays locked until every battle of the part is cleared');
    s.progress.cleared[p1[p1.length - 1].id] = { clears: 1, best: null };
    ok(isHardUnlocked(s, 1, C) && isHardNodeUnlocked(s, h1, C) && !isHardNodeUnlocked(s, h2, C) && !isHardUnlocked(s, 2, C), 'clearing Part I opens its first Hard battle, and only that');
    ok(p1.every(n => nodeEnemyLevel(n, B, { hard: true }) === Math.min(B.stats.levelCap, nodeEnemyLevel(n, B) + B.hardMode.levelOffset)), 'Hard enemies are hardMode.levelOffset levels higher, up to the level cap');
    // bosses: × hardMode.bossMult on top of the story's scaling at the same level
    const flat = { ...B, hardMode: { ...B.hardMode, nodeMult: {} }, enemyScaling: { ...B.enemyScaling, nodeMult: {} } };
    const bossNode = C.nodes.find(n => n.isBossNode);
    const hardBoss = buildNodeEnemies(bossNode, C, flat, { hard: true }).enemies.find(e => e.spec.isBoss).spec;
    const storyBoss = buildNodeEnemies(bossNode, C, flat, { level: nodeEnemyLevel(bossNode, B, { hard: true }) }).enemies.find(e => e.spec.isBoss).spec;
    ok(Math.abs(hardBoss.maxHp - storyBoss.maxHp * B.hardMode.bossMult) <= 1 && Math.abs(hardBoss.atk - storyBoss.atk * B.hardMode.bossMult) <= 1, 'Hard bosses get hardMode.bossMult more HP and ATK');
    // rewards and records
    const sc = s.currencies.scrolls, ry = s.currencies.ryo, storyRec = JSON.stringify(s.progress.cleared);
    const r1 = completeNode(s, h1, true, C, B, { time: 42 }, { hard: true });
    const fr = hardNodeRewards(h1, true, B);
    ok(r1.firstClear && r1.hard && s.currencies.scrolls === sc + fr.scrolls && s.currencies.ryo === ry + fr.ryo, 'a first Hard clear pays hardMode.rewards.firstClear × the story reward');
    ok(s.progress.hard[h1.id].clears === 1 && JSON.stringify(s.progress.cleared) === storyRec, 'Hard clears are recorded apart from the story');
    ok(isHardNodeUnlocked(s, h2, C), 'a Hard clear opens the next Hard battle');
    const sc2 = s.currencies.scrolls; const r2 = completeNode(s, h1, true, C, B, {}, { hard: true });
    ok(!r2.firstClear && s.currencies.scrolls === sc2 + hardNodeRewards(h1, false, B).scrolls && s.progress.hard[h1.id].clears === 2, 'Hard replays pay the replay reward');
    const sc3 = s.currencies.scrolls; const lost = completeNode(s, h2, false, C, B, {}, { hard: true });
    ok(!lost.won && s.currencies.scrolls === sc3 && !s.progress.hard[h2.id], 'a Hard loss pays and records nothing');
    const arc0 = C.arcs[0];
    let last = null;
    for (const n of arc0.nodes) last = completeNode(s, n, true, C, B, {}, { hard: true });
    ok(last.arcCleared === arc0.id && isArcHardCleared(s, arc0), 'clearing a whole arc on Hard pays the Hard arc bonus once');
    const cfgA = nodeBattleConfig(s, bossNode, C, B, { seed: 7, hard: true });
    const cfgB = nodeBattleConfig(s, bossNode, C, B, { seed: 7, hard: true });
    const simA = new BattleSim({ ...cfgA, recordEvents: false }), simB = new BattleSim({ ...cfgB, recordEvents: false });
    ok(simA.runToEnd({ ultMode: 'smart' }) === simB.runToEnd({ ultMode: 'smart' }) && simA.time === simB.time, 'Hard battles are deterministic for a seed');
  }
  // ---- Session 4: the Daily challenge ----
  {
    const s = defaultState(C, B);
    ok(dailyFor(s, C, B, '2026-03-01') === null, 'the Daily is locked on a fresh save');
    const unlock = C.arc[B.daily.unlockArc];
    for (const n of C.nodes.filter(n => n.arcIndex <= unlock.arcIndex)) s.progress.cleared[n.id] = { clears: 1, best: null };
    const key = (d) => JSON.stringify([d.twist.id, d.rounds.map(n => n.id), d.nature, d.level]);
    const d1 = dailyFor(s, C, B, '2026-03-01');
    ok(d1 && key(d1) === key(dailyFor(s, C, B, '2026-03-01')), 'same date and same progress: same challenge');
    const month = Array.from({ length: 60 }, (_, k) => dailyFor(s, C, B, new Date(Date.UTC(2026, 0, 1 + k)).toISOString().slice(0, 10)));
    ok(B.daily.twists.every(t => month.some(d => d.twist.id === t.id)), 'every twist in balance.daily.twists comes up within 60 days');
    ok(month.every(d => d.rounds.every(n => isArcCleared(s, C.arc[n.arcId]) && n === C.arc[n.arcId].nodes[C.arc[n.arcId].nodes.length - 1])), 'Daily bosses are final battles of arcs the player has cleared');
    ok(month.every(d => d.level === enemyLevelForNode(currentNode(s, C).globalIndex, B)), 'the Daily is fought at the player\'s story level');
    // attempts and the reward
    const rec = dailyRecord(s, d1.dateKey);
    ok(rec.attempts === 0 && attemptsLeft(s, B, d1.dateKey) === B.daily.attemptsPerDay, 'a new day starts with daily.attemptsPerDay attempts');
    for (let i = 0; i < B.daily.attemptsPerDay; i++) startDailyAttempt(s, d1, B);
    ok(!startDailyAttempt(s, d1, B).ok && attemptsLeft(s, B, d1.dateKey) === 0, 'no attempts beyond daily.attemptsPerDay');
    const sc = s.currencies.scrolls, ry = s.currencies.ryo, want = dailyReward(s, C, B);
    const paid = completeDaily(s, d1, C, B);
    ok(paid && s.currencies.scrolls === sc + B.daily.rewards.scrolls && s.currencies.ryo === ry + want.ryo && s.daily.totalCleared === 1, 'the first clear pays daily.rewards');
    ok(completeDaily(s, d1, C, B) === null && s.currencies.scrolls === sc + B.daily.rewards.scrolls, 'a second clear the same day pays nothing');
    const d2 = dailyFor(s, C, B, '2026-03-02');
    ok(attemptsLeft(s, B, d2.dateKey) === B.daily.attemptsPerDay && !dailyRecord(s, d2.dateKey).cleared && s.daily.totalCleared === 1, 'a new date resets attempts and the clear, not the lifetime count');
    ok(startDailyAttempt(s, d2, B).ok, 'the new day\'s challenge can be fought');
    // twists
    const dayWith = (id) => month.find(d => d.twist.id === id);
    const team = resolveTeam(s, null, C);
    const powerOf = (d) => d.twist.power ?? 1;
    const lock = dayWith('lockedNature'); const lc = dailyBattleConfig(s, lock, 0, C, B, { seed: 1 });
    ok(lc.enemies.every(e => e.spec.natures.length === 1 && e.spec.natures[0] === lock.nature) && lc.ultsEnabled, 'Locked nature: every enemy takes the day\'s nature');
    const plain = buildNodeEnemies(lock.node, dailyContent(lock, [], C, B), B, { level: lock.level }).enemies;
    ok(lc.enemies.every((e, i) => Math.abs(e.spec.maxHp - plain[i].spec.maxHp * powerOf(lock)) <= 1 && Math.abs(e.spec.atk - plain[i].spec.atk * powerOf(lock)) <= 1), 'each twist\'s power multiplies the enemies\' HP and ATK');
    const nu = dailyBattleConfig(s, dayWith('noUlts'), 0, C, B, { seed: 1 });
    ok(nu.ultsEnabled === false, 'No Ultimates: the team\'s Ultimates are sealed');
    const co = dayWith('counteredOnly'); const cc = dailyBattleConfig(s, co, 0, C, B, { seed: 1 });
    const want2 = dailyEnemyNature(co, team.members.map(id => C.char[id]), B);
    ok(cc.enemies.every(e => e.spec.natures[0] === want2) && team.members.some(id => beatenBy(C.char[id].natures?.[0], B) === want2), 'Countered: enemies take the nature that beats the team\'s main nature');
    const all = defaultState(C, B); for (const n of C.nodes) all.progress.cleared[n.id] = { clears: 1, best: null };
    const rush = Array.from({ length: 60 }, (_, k) => dailyFor(all, C, B, new Date(Date.UTC(2026, 0, 1 + k)).toISOString().slice(0, 10))).find(d => d.twist.id === 'bossRush');
    const rc = dailyBattleConfig(all, rush, 1, C, B, { seed: 1 });
    ok(rush.rounds.length === B.daily.twists.find(t => t.id === 'bossRush').rounds && rc.objective.type === 'defeatBoss' && rc.enemies.every(e => e.spec.isBoss) && rc.node === rush.rounds[1], 'Boss gauntlet: several bosses, one per round, bosses only');
  }
  // curves
  ok(curve({ type: 'step', base: 1, table: [[10, 2], [20, 3]] }, 15) === 2, 'step curve');
  ok(curve({ type: 'exp', base: 2, growth: 2 }, 3) === 16, 'exp curve');
  ok(curve({ type: 'poly', base: 3, growth: 2 }, 4) === 48, 'poly curve');
  ok(curve({ type: 'linear', base: 1, growth: 2, cap: 5 }, 10) === 5, 'curve cap');
}

// ---- Session 5: the start flow -------------------------------------------------
{
  // the intro: first visit, seen, reduced motion, replay; always under INTRO.maxMs
  const first = introPlan({ seen: false });
  ok(first.scene && first.effects && first.splashMs === INTRO.splashFirst && first.totalMs <= INTRO.maxMs, `a first visit gets the full intro (${first.totalMs} ms, under ${INTRO.maxMs})`);
  const again = introPlan({ seen: true });
  ok(!again.scene && again.splashMs === INTRO.splashAgain && again.totalMs === INTRO.splashAgain, 'once seen, later loads get only the short splash');
  const reduced = introPlan({ seen: false, reducedMotion: true });
  ok(reduced.scene && !reduced.effects && reduced.totalMs < first.totalMs, 'prefers-reduced-motion: the scene fades without run, shake or flash');
  ok(introPlan({ seen: true, full: true }).scene && introPlan({ seen: true, full: true, reducedMotion: true }).effects === false, 'Settings → Replay the intro plays the scene even when seen (still honouring reduced motion)');
  // the intro-seen flag lives in localStorage (stubbed here), never in the synced save
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  ok(introSeen() === false, 'a new device has not seen the intro');
  setIntroSeen();
  ok(introSeen() === true && store.has('shinobi-auto-battler:pref:introSeen') && !Object.keys(defaultState(C, B)).some(k => /intro/i.test(k)), 'the intro-seen flag is a device preference, not part of the save');
  setIntroSeen(false);
  ok(introSeen() === false, 'the flag can be cleared');
  delete globalThis.localStorage;
}

// ---- Session 5: the start menu never creates a cloud session by itself ----------
{
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  // A fake Firebase SDK: records what the backend asks it to do.
  const fakeSdk = (user = null) => {
    const auth = { currentUser: user }; const calls = [];
    const sdk = {
      initializeApp: () => ({}), getAuth: () => auth, getFirestore: () => ({}),
      onAuthStateChanged: (a, cb) => { queueMicrotask(() => cb(a.currentUser)); return () => {}; },
      getRedirectResult: async () => { calls.push('redirectResult'); return null; },
      signInAnonymously: async (a) => { calls.push('anonymous'); a.currentUser = { uid: 'guest1', isAnonymous: true }; return { user: a.currentUser }; },
      signInWithPopup: async () => { calls.push('popup'); const e = new Error('blocked'); e.code = 'auth/popup-blocked'; throw e; },
      signInWithRedirect: async () => { calls.push('redirect'); },
      linkWithRedirect: async () => { calls.push('linkRedirect'); },
      signOut: async (a) => { a.currentUser = null; },
      GoogleAuthProvider: class { static credentialFromError() { return null; } },
    };
    return { calls, sdk, auth };
  };
  const cfg = { apiKey: 'k', authDomain: 'a', projectId: 'p', storageBucket: 's', messagingSenderId: 'm', appId: 'i' };
  const f1 = fakeSdk(); const fb = new FirebaseBackend(cfg, { sdk: f1.sdk, useRedirect: false });
  ok(await fb.init() === false && fb.phase === 'signedOut' && !f1.calls.includes('anonymous'), 'loading the game restores a session but never creates a guest account');
  const g = await fb.continueAsGuest();
  ok(g.ok && fb.ready && fb.isAnonymous && f1.calls.filter(c => c === 'anonymous').length === 1, '"Continue as guest" is what creates the anonymous session');
  const f2 = fakeSdk({ uid: 'u2', isAnonymous: false, email: 'ninja@leaf.example', displayName: 'Naruto' }); const fb2 = new FirebaseBackend(cfg, { sdk: f2.sdk, useRedirect: false });
  ok(await fb2.init() === true && !fb2.isAnonymous && fb2.displayName === 'Naruto' && !f2.calls.includes('anonymous'), 'a returning player\'s session is restored as it is');
  // phones: Google sign-in goes by redirect and leaves a marker for the way back
  const f3 = fakeSdk(); const fb3 = new FirebaseBackend(cfg, { sdk: f3.sdk, useRedirect: true }); await fb3.init();
  const r3 = await fb3.signInWithGoogle();
  ok(r3.ok && r3.redirecting && f3.calls.includes('redirect') && !f3.calls.includes('popup') && store.get('shinobi-auto-battler:pref:authRedirect') === '"signIn"', 'on phones Google sign-in uses the redirect flow');
  // back from the redirect: the sign-in is picked up and the marker cleared
  const f5 = fakeSdk(); f5.sdk.getRedirectResult = async (a) => { a.currentUser = { uid: 'u5', isAnonymous: false, email: 'e@x' }; return { user: a.currentUser }; };
  const fb5 = new FirebaseBackend(cfg, { sdk: f5.sdk, useRedirect: true });
  ok(await fb5.init() === true && fb5.redirectResult?.ok === true && fb5.redirectResult.kind === 'signIn' && store.get('shinobi-auto-battler:pref:authRedirect') === 'null', 'back from the redirect, the sign-in is picked up and the marker cleared');
  // desktop: a blocked popup falls back to the redirect
  const f4 = fakeSdk(); const fb4 = new FirebaseBackend(cfg, { sdk: f4.sdk, useRedirect: false }); await fb4.init();
  const r4 = await fb4.signInWithGoogle();
  ok(r4.redirecting && f4.calls.includes('popup') && f4.calls.includes('redirect'), 'a blocked sign-in popup falls back to the redirect');
  // what the menu shows for each cloud state
  const sOut = menuModel({ kind: 'signedOut' });
  ok(sOut.guest && sOut.google === 'signIn' && !sOut.primary, 'no session: the menu offers guest and Google, and no Continue');
  const sG = menuModel({ kind: 'guest', account: 'Guest (anonymous)' });
  ok(sG.primary?.sub === 'Guest save' && sG.google === 'link' && !sG.guest, 'a guest gets Continue and can still sign in with Google to link');
  const sN = menuModel({ kind: 'google', account: 'ninja@leaf.example', name: 'Naruto' });
  ok(sN.primary?.sub === 'Signed in as Naruto' && !sN.google && !sN.guest, 'a Google player gets one Continue button');
  ok(menuModel({ kind: 'off' }, { hasProgress: true }).primary?.label === '▶ Continue' && menuModel({ kind: 'off' }).primary?.label === '▶ Play', 'without cloud save the menu goes straight to the game');
  const sE = menuModel({ kind: 'error' });
  ok(sE.primary?.label === '▶ Play offline' && sE.retry && sE.message, 'when cloud save is unreachable the menu says so and offers to play offline');
  ok(menuModel({ kind: 'connecting' }).busy && !menuModel({ kind: 'connecting' }).primary, 'while the session is being checked the menu waits');
  ok(menuModel({ kind: 'signedOut' }, { redirectError: 'nope' }).message === 'nope', 'a failed Google redirect is reported on the menu');
  delete globalThis.localStorage;
}

console.log(`${fails ? 'FAIL' : 'PASS'} — core tests: ${passes} passed, ${fails} failed.`);
process.exit(fails ? 1 : 0);
