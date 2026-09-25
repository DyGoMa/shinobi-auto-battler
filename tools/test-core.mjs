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
import { FirebaseBackend, REDIRECT_FLAG, POPUP_UNAVAILABLE, POPUP_CANCELLED, EMPTY_REDIRECT_ERROR, EARLY_CANCEL_MS } from '../js/save/FirebaseBackend.js';
import { isStandalone, isIOS, installModel, updateAvailable, shouldCheckForUpdate, UPDATE_CHECK_MIN_MS, signInFallback } from '../js/core/Pwa.js';
import { formatBuild, loadBuildInfo, DEV_LABEL } from '../js/core/Version.js';
import { SaveManager, tutorialRewardClaimed } from '../js/core/SaveManager.js';
import { recommendedPower, teamPower } from '../js/core/Power.js';
import { planToRecommended, planSmartSpend, applyPlan, ryoReserve } from '../js/core/AutoLevel.js';
import { canSkip, skipBattle, SKIP_BOT } from '../js/core/Skip.js';
import { tabBadges, dailyWaiting } from '../js/core/Badges.js';
import { PRESETS, savePreset, loadPreset, counterLabel, rosterList, ROSTER_VIEW_DEFAULT } from '../js/core/Teams.js';
import { pullCost } from '../js/core/GachaSystem.js';
import { levelCostFor } from '../js/core/Progression.js';
import { autoPickTeam } from '../js/core/TeamPicker.js';
import { DEFAULT_BOT } from './common.mjs';
import { localDateKey, nodeRewards } from '../js/core/formulas.js';

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
// Google sign-in is popup first on every device; the redirect is only a fallback.
{
  const realWarn = console.warn; console.warn = () => {};   // the error paths below warn on purpose
  const store = new Map(), session = new Map();
  const fakeStorage = (m) => ({ getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) });
  globalThis.localStorage = fakeStorage(store);
  globalThis.sessionStorage = fakeStorage(session);
  const authError = (code) => { const e = new Error(code); e.code = code; return e; };
  // A fake Firebase SDK: records what the backend asks it to do. popup / linkPopup: what
  // signInWithPopup / linkWithPopup do ('ok' or an auth error code); redirect: what
  // getRedirectResult returns after a round trip ('user', 'empty' or an error code).
  const fakeSdk = ({ user = null, popup = 'ok', linkPopup = 'ok', redirect = 'empty' } = {}) => {
    const auth = { currentUser: user }; const calls = [];
    const google = { uid: 'g1', isAnonymous: false, email: 'ninja@leaf.example', displayName: 'Naruto' };
    const sdk = {
      initializeApp: () => ({}), getAuth: () => auth, getFirestore: () => ({}),
      onAuthStateChanged: (a, cb) => { queueMicrotask(() => cb(a.currentUser)); return () => {}; },
      getRedirectResult: async (a) => {
        calls.push('redirectResult');
        if (redirect === 'user') { a.currentUser = google; return { user: google }; }
        if (redirect === 'empty') return null;
        throw authError(redirect);
      },
      signInAnonymously: async (a) => { calls.push('anonymous'); a.currentUser = { uid: 'guest1', isAnonymous: true }; return { user: a.currentUser }; },
      signInWithPopup: async (a) => { calls.push('popup'); if (popup !== 'ok') throw authError(popup); a.currentUser = google; return { user: google }; },
      linkWithPopup: async (u) => { calls.push('linkPopup'); if (linkPopup !== 'ok') throw authError(linkPopup); const linked = { ...u, isAnonymous: false, email: google.email }; auth.currentUser = linked; return { user: linked }; },
      signInWithRedirect: async () => { calls.push('redirect'); },
      linkWithRedirect: async () => { calls.push('linkRedirect'); },
      signInWithCredential: async (a) => { calls.push('credential'); a.currentUser = google; return { user: google }; },
      signOut: async (a) => { a.currentUser = null; },
      GoogleAuthProvider: class { static credentialFromError() { return { providerId: 'google.com' }; } },
    };
    return { calls, sdk, auth };
  };
  const cfg = { apiKey: 'k', authDomain: 'a', projectId: 'p', storageBucket: 's', messagingSenderId: 'm', appId: 'i' };
  const backend = async (opts, { init = true } = {}) => { const f = fakeSdk(opts); const b = new FirebaseBackend(cfg, { sdk: f.sdk }); if (init) await b.init(); return { f, b }; };
  const guestUser = { uid: 'guest1', isAnonymous: true };

  // sessions: nothing is created on load
  const { f: f1, b: fb } = await backend();
  ok(fb.phase === 'signedOut' && !f1.calls.includes('anonymous'), 'loading the game restores a session but never creates a guest account');
  const g = await fb.continueAsGuest();
  ok(g.ok && fb.ready && fb.isAnonymous && f1.calls.filter(c => c === 'anonymous').length === 1, '"Continue as guest" is what creates the anonymous session');
  const { f: f2, b: fb2 } = await backend({ user: { uid: 'u2', isAnonymous: false, email: 'ninja@leaf.example', displayName: 'Naruto' } });
  ok(fb2.ready && !fb2.isAnonymous && fb2.displayName === 'Naruto' && !f2.calls.includes('anonymous'), 'a returning player\'s session is restored as it is');
  ok(!f1.calls.includes('redirectResult') && fb.redirectResult === null, 'a normal load (no redirect started here) never reads or reports a redirect result');

  // sign in: popup first on every device, phones included (no user-agent decision)
  const realNav = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 8a) Chrome/140 Mobile' }, configurable: true });
  globalThis.window = { matchMedia: () => ({ matches: true }) };   // a touch screen
  const { f: p1, b: pb1 } = await backend();
  const s1 = await pb1.signInWithGoogle();
  ok(s1.ok && !s1.redirecting && pb1.ready && !pb1.isAnonymous && p1.calls.includes('popup') && !p1.calls.includes('redirect') && !session.size, 'Google sign-in opens a popup first, even on an Android phone');
  delete globalThis.window;
  if (realNav) Object.defineProperty(globalThis, 'navigator', realNav); else delete globalThis.navigator;
  for (const code of POPUP_UNAVAILABLE) {
    const { f, b } = await backend({ popup: code });
    const r = await b.signInWithGoogle();
    ok(r.ok && r.redirecting && f.calls.join() === 'popup,redirect' && session.get(REDIRECT_FLAG) === 'signIn', `sign-in falls back to the redirect on ${code} (and flags it in sessionStorage)`);
    session.clear();
  }
  for (const code of POPUP_CANCELLED) {
    const { f, b } = await backend({ popup: code });
    const r = await b.signInWithGoogle();
    ok(!r.ok && r.cancelled && !r.error && !f.calls.includes('redirect') && !b.ready && !session.size, `${code} is a quiet cancel: no error, no redirect, still no session`);
  }
  const { f: pN, b: bN } = await backend({ popup: 'auth/network-request-failed' });
  const sN1 = await bN.signInWithGoogle();
  ok(!sN1.ok && !sN1.cancelled && /connection/i.test(sN1.error) && !pN.calls.includes('redirect'), 'any other popup error is shown, and does not fall back to the redirect');

  // link a guest: the same popup-first rule, through the existing link paths
  const { f: l1, b: lb1 } = await backend({ user: guestUser });
  const k1 = await lb1.linkGoogle();
  ok(k1.ok && !k1.switched && !lb1.isAnonymous && lb1.user.uid === 'guest1' && l1.calls.includes('linkPopup') && !l1.calls.includes('linkRedirect'), 'linking a guest save uses linkWithPopup and keeps the same account');
  const { f: l2, b: lb2 } = await backend({ user: guestUser, linkPopup: 'auth/credential-already-in-use' });
  const k2 = await lb2.linkGoogle();
  ok(k2.ok && k2.switched && lb2.user.uid === 'g1' && l2.calls.join().endsWith('linkPopup,credential'), 'a Google account that already has a save: the popup signs into it instead (switched, so the newer cloud save is offered)');
  const { f: l3, b: lb3 } = await backend({ user: guestUser, linkPopup: 'auth/popup-blocked' });
  const k3 = await lb3.linkGoogle();
  ok(k3.redirecting && l3.calls.join().endsWith('linkPopup,linkRedirect') && session.get(REDIRECT_FLAG) === 'link', 'a blocked link popup falls back to linkWithRedirect');
  session.clear();
  const { f: l4, b: lb4 } = await backend({ user: guestUser, linkPopup: 'auth/popup-closed-by-user' });
  const k4 = await lb4.linkGoogle();
  ok(k4.cancelled && !k4.error && lb4.isAnonymous && !l4.calls.includes('linkRedirect'), 'closing the link popup is a quiet cancel; the guest save stays as it was');

  // inside the installed app (standalone): a popup "closed" faster than a human could have
  // closed it means the window never opened → redirect; a real close is still a quiet cancel
  {
    let t = 1000; const now = () => t;
    const f5 = fakeSdk({ user: guestUser, linkPopup: 'auth/popup-closed-by-user' });
    const sb = new FirebaseBackend(cfg, { sdk: f5.sdk, standalone: true, now }); await sb.init();
    const k5 = await sb.linkGoogle();
    ok(k5.redirecting && f5.calls.join().endsWith('linkPopup,linkRedirect') && session.get(REDIRECT_FLAG) === 'link', 'standalone: a popup closed at once falls back to linkWithRedirect');
    session.clear();
    const f6 = fakeSdk({ user: guestUser, linkPopup: 'auth/popup-closed-by-user' });
    f6.sdk.linkWithPopup = async () => { f6.calls.push('linkPopup'); t += EARLY_CANCEL_MS + 1; throw authError('auth/popup-closed-by-user'); };
    const sb2 = new FirebaseBackend(cfg, { sdk: f6.sdk, standalone: true, now }); await sb2.init();
    const k6 = await sb2.linkGoogle();
    ok(k6.cancelled && !k6.error && !f6.calls.includes('linkRedirect') && !session.has(REDIRECT_FLAG), 'standalone: a popup closed after a while is still a quiet cancel');
    const f7 = fakeSdk({ popup: 'auth/popup-closed-by-user' });
    const sb3 = new FirebaseBackend(cfg, { sdk: f7.sdk, standalone: true, now }); await sb3.init();
    const k7 = await sb3.signInWithGoogle();
    ok(k7.redirecting && f7.calls.join().endsWith('popup,redirect') && session.get(REDIRECT_FLAG) === 'signIn', 'standalone: the same for signInWithGoogle');
    session.clear();
    const f8 = fakeSdk({ popup: 'auth/popup-closed-by-user' });
    const sb4 = new FirebaseBackend(cfg, { sdk: f8.sdk, standalone: false, now }); await sb4.init();
    const k8 = await sb4.signInWithGoogle();
    ok(k8.cancelled && !f8.calls.includes('redirect'), 'in a browser tab an instant close is still a cancel (no redirect)');
  }

  // back from a redirect this page started: every outcome is reported, and the flag is cleared
  const back = async (kind, opts) => { session.set(REDIRECT_FLAG, kind); const r = await backend(opts); return r; };
  const { b: r1 } = await back('signIn', { redirect: 'user' });
  ok(r1.ready && r1.redirectResult?.ok && r1.redirectResult.kind === 'signIn' && !session.has(REDIRECT_FLAG), 'back from the redirect with a user: signed in, flag cleared');
  const { b: r2 } = await back('link', { user: guestUser, redirect: 'empty' });
  ok(r2.redirectResult?.ok === false && r2.redirectResult.empty && r2.redirectResult.error === EMPTY_REDIRECT_ERROR && /third-party cookies/.test(r2.redirectResult.error) && r2.isAnonymous && !session.has(REDIRECT_FLAG), 'back from the redirect with NO user (third-party storage blocked): an error, not a silent guest menu; flag cleared');
  const { b: r3 } = await back('link', { user: guestUser, redirect: 'auth/credential-already-in-use' });
  ok(r3.redirectResult?.ok && r3.redirectResult.switched && r3.user.uid === 'g1' && !session.has(REDIRECT_FLAG), 'a redirect link to an account that already has a save signs into it (switched); flag cleared');
  const { b: r4 } = await back('signIn', { redirect: 'auth/network-request-failed' });
  ok(r4.redirectResult?.ok === false && /connection/i.test(r4.redirectResult.error) && !session.has(REDIRECT_FLAG), 'a redirect that fails with an error reports it; flag cleared');
  session.set(REDIRECT_FLAG, 'signIn');
  const broken = new FirebaseBackend(cfg, { sdk: { initializeApp: () => { throw new Error('SDK failed to load'); } } });
  ok(await broken.init() === false && broken.phase === 'error' && !session.has(REDIRECT_FLAG), 'the flag is cleared even if the SDK fails to load');
  store.set('shinobi-auto-battler:pref:authRedirect', '"link"');
  await backend();
  ok(!store.has('shinobi-auto-battler:pref:authRedirect'), 'the old localStorage redirect marker (0.10.0) is removed');

  // what the menu shows for each cloud state
  const sOut = menuModel({ kind: 'signedOut' });
  ok(sOut.guest && sOut.google === 'signIn' && !sOut.primary && !sOut.retryGoogle, 'no session: the menu offers guest and Google, and no Continue');
  const sG = menuModel({ kind: 'guest', account: 'Guest (anonymous)' });
  ok(sG.primary?.sub === 'Guest save' && sG.google === 'link' && !sG.guest, 'a guest gets Continue and can still sign in with Google to link');
  const sN = menuModel({ kind: 'google', account: 'ninja@leaf.example', name: 'Naruto' });
  ok(sN.primary?.sub === 'Signed in as Naruto' && !sN.google && !sN.guest, 'a Google player gets one Continue button');
  ok(menuModel({ kind: 'off' }, { hasProgress: true }).primary?.label === '▶ Continue' && menuModel({ kind: 'off' }).primary?.label === '▶ Play', 'without cloud save the menu goes straight to the game');
  const sE = menuModel({ kind: 'error' });
  ok(sE.primary?.label === '▶ Play offline' && sE.retry && sE.message && sE.warn, 'when cloud save is unreachable the menu says so and offers to play offline');
  ok(menuModel({ kind: 'connecting' }).busy && !menuModel({ kind: 'connecting' }).primary, 'while the session is being checked the menu waits');
  const sR = menuModel({ kind: 'guest' }, { redirectError: EMPTY_REDIRECT_ERROR });
  ok(sR.message === EMPTY_REDIRECT_ERROR && sR.warn && sR.retryGoogle && sR.google === 'link' && sR.primary, 'an empty redirect return: the menu shows the third-party-cookie message with a Try again button');
  ok(menuModel({ kind: 'signedOut' }, { redirectError: 'nope' }).retryGoogle && menuModel({ kind: 'signedOut' }, { redirectError: 'nope' }).guest, 'a failed sign-in redirect keeps "Continue as guest" next to Try again');
  delete globalThis.localStorage;
  delete globalThis.sessionStorage;
  console.warn = realWarn;
}

// ---- Session 5: the build stamp ---------------------------------------------------
{
  ok(formatBuild(null).label === DEV_LABEL && formatBuild({}).dev && formatBuild({ shortSha: 'abc1234' }).dev, 'no version.json (or an unusable one) shows "dev"');
  const b = formatBuild({ sha: '1234567890abcdef', shortSha: '1234567', builtAt: '2026-09-24T14:03:09Z' });
  ok(b.label === 'v1234567 · 2026-09-24 14:03 UTC' && !b.dev && b.sha === '1234567890abcdef', 'a deploy shows "v<short sha> · <UTC build date>"');
  ok(formatBuild({ sha: 'fedcba9876543210', builtAt: '2026-01-02T03:04:05Z' }).label === 'vfedcba9 · 2026-01-02 03:04 UTC', 'the short sha is cut from the full one when missing');
  ok((await loadBuildInfo({ fetchImpl: async () => ({ ok: false, status: 404 }) })).label === DEV_LABEL, 'a 404 for version.json (local dev) falls back to "dev"');
  ok((await loadBuildInfo({ fetchImpl: async () => { throw new TypeError('Failed to fetch'); } })).label === DEV_LABEL, 'a failed fetch (file://, offline) falls back to "dev"');
  ok((await loadBuildInfo({ fetchImpl: undefined })).label === DEV_LABEL, 'no fetch at all falls back to "dev"');
  let askedUrl = '';
  const live = await loadBuildInfo({ fetchImpl: async (u) => { askedUrl = u; return { ok: true, json: async () => ({ sha: 'abcdef0123456789', shortSha: 'abcdef0', builtAt: '2026-09-24T09:30:00Z' }) }; } });
  ok(live.label === 'vabcdef0 · 2026-09-24 09:30 UTC' && /^version\.json\?t=\d+$/.test(askedUrl), 'version.json is fetched with a cache-buster and shown');
}


// ---- 0.11: convenience features ----------------------------------------------------
{
  // Recommended power comes from the on-curve team config, never a typed number.
  const n10 = C.nodes[10];
  const rec = recommendedPower(n10, C, B), recHard = recommendedPower(n10, C, B, { hard: true });
  ok(rec > 0 && recHard > rec, 'recommended power is positive and higher on Hard');
  ok(recommendedPower(C.nodes[40], C, B) > rec, 'recommended power grows along the story');
  const B2 = structuredClone(B); B2.targets.onCurve.levelOffset += 5;
  ok(recommendedPower(n10, C, B2) > rec, 'recommended power follows balance.targets.onCurve');

  // Level to recommended: stops as soon as the team reaches it, costs exactly what +1 costs.
  const s = defaultState(C, B); s.currencies.ryo = 1e6;
  for (const n of C.nodes.slice(0, 10)) s.progress.cleared[n.id] = { clears: 1, best: 30 };
  const plan = planToRecommended(s, n10, C, B);
  ok(plan.reached && plan.power >= plan.target && plan.target === rec, 'Level to recommended reaches the recommended power');
  const beforeLast = structuredClone(s); applyPlan(beforeLast, { steps: plan.steps.slice(0, -1) }, B);
  ok(teamPower(beforeLast, n10, C, B) < plan.target, 'Level to recommended stops right after reaching it (one level fewer is short)');
  const ryo0 = s.currencies.ryo;
  let manual = 0; { const m = structuredClone(s); for (const st of plan.steps) { manual += levelCostFor(m, st.id, B).cost; m.roster[st.id].level++; } }
  const done = applyPlan(s, plan, B);
  ok(done.cost === plan.cost && ryo0 - s.currencies.ryo === plan.cost && manual === plan.cost, 'the shown cost is exactly what the level-ups charge (economy unchanged)');
  ok(teamPower(s, n10, C, B) >= plan.target && planToRecommended(s, n10, C, B).steps.length === 0, 'after levelling, the team is at the recommended power and nothing more is planned');
  // Not enough Ryo: buy what's affordable, report what's missing.
  const poor = defaultState(C, B); poor.currencies.ryo = 300;
  const pp = planToRecommended(poor, C.nodes[30], C, B);
  ok(!pp.reached && !pp.affordable && pp.cost <= 300 && pp.full.cost > 300, 'short of Ryo: the plan stays within the Ryo you have and shows the full cost');

  // Smart spend keeps the reserve.
  const sp = defaultState(C, B); sp.currencies.ryo = 20000; sp.settings.ryoReserve = 5000;
  ok(ryoReserve(sp, B) === 5000 && ryoReserve(defaultState(C, B), B) === B.qol.ryoReserve, 'the reserve is the saved setting (default balance.qol.ryoReserve)');
  const smart = planSmartSpend(sp, null, C, B);
  applyPlan(sp, smart, B);
  const minNext = Math.min(...resolveTeam(sp, null, C).members.filter(id => sp.roster[id]).map(id => levelCostFor(sp, id, B).cost));
  ok(sp.currencies.ryo >= 5000 && sp.currencies.ryo - 5000 < minNext && smart.steps.length > 0, 'Smart spend spends down to the reserve and never below it');
  const broke = defaultState(C, B); broke.currencies.ryo = 400; broke.settings.ryoReserve = 500;
  ok(planSmartSpend(broke, null, C, B).steps.length === 0, 'Smart spend does nothing when Ryo is at or under the reserve');
  // Greedy by power per Ryo: a catch-up-discounted ninja is picked first.
  const cu = defaultState(C, B); cu.currencies.ryo = 1e6; cu.roster.naruto.level = 30; cu.roster.sakura.level = 30; cu.roster.kakashi.level = 30;
  ok(planSmartSpend(cu, null, C, B, { reserve: cu.currencies.ryo - 5000 }).steps[0]?.id === 'sasuke', 'Smart spend buys the most power per Ryo first (the catch-up discount counts)');

  // Skip: the real engine, headless, clash-aware; blocked on the Daily and on unwon battles.
  ok(SKIP_BOT === DEFAULT_BOT && SKIP_BOT === 'smart', 'Skip plays with the clash-aware bot the sims use');
  const k = defaultState(C, B);
  for (const id of Object.keys(k.roster)) k.roster[id].level = 15;   // well above the Survival Test
  const nb = C.nodes[1];
  ok(!canSkip(k, nb, C).ok, 'Skip is blocked on a battle never won');
  completeNode(k, C.nodes[0], true, C, B); completeNode(k, nb, true, C, B);
  ok(canSkip(k, nb, C).ok && !canSkip(k, nb, C, { daily: true }).ok && !skipBattle(k, nb, C, B, { daily: true }).ok, 'Skip is open on a won battle and blocked on the Daily');
  ok(!canSkip(k, C.tutorial.nodes[0], C).ok, 'tutorial lessons cannot be skipped');
  const ref = new BattleSim({ ...nodeBattleConfig(structuredClone(k), nb, C, B, { seed: 77 }), recordEvents: false });
  const refEnd = ref.runToEnd({ ultMode: 'smart' });
  const before = structuredClone(k);
  const sk = skipBattle(k, nb, C, B, { seed: 77 });
  ok(sk.ok && (sk.won ? 'won' : 'lost') === refEnd && sk.sim.time === ref.time, 'Skip runs the same BattleSim battle as Fight! (same seed, same result and time)');
  const exp = nodeRewards(nb.globalIndex, { firstClear: false, isBossNode: nb.isBossNode }, B);
  ok(sk.won && sk.result.ryo === exp.ryo && sk.result.scrolls === exp.scrolls && k.currencies.ryo - before.currencies.ryo === exp.ryo && k.progress.cleared[nb.id].clears === 2 && k.stats.battles === before.stats.battles + 1, 'a won Skip pays and records exactly what a normal replay does');
  // A loss is possible: a boss far above the team.
  const late = C.nodes.find(n => n.isBossNode && n.part === 2);
  const L = defaultState(C, B); for (const n of C.nodes.slice(0, late.globalIndex + 1)) L.progress.cleared[n.id] = { clears: 1, best: 60 };
  const lost = skipBattle(L, late, C, B, { seed: 5 });
  ok(lost.ok && !lost.won && lost.result.ryo === 0 && L.stats.losses === 1, 'a skipped battle can be lost (no rewards, counted as a loss)');
  // Hard: needs a Hard win of that battle.
  const H = defaultState(C, B); for (const n of C.nodes.filter(n => n.part === 1)) H.progress.cleared[n.id] = { clears: 1, best: 30 };
  const h0 = C.nodes[0];
  ok(!canSkip(H, h0, C, { hard: true }).ok, 'Skip on Hard needs a Hard win (a story win is not enough)');
  H.progress.hard[h0.id] = { clears: 1, best: 30 };
  ok(canSkip(H, h0, C, { hard: true }).ok && skipBattle(H, h0, C, B, { hard: true, seed: 2 }).result.hard, 'Skip works on Hard once the Hard battle is won');

  // Summons: the 10-pull (900 scrolls, a Jonin or better, 10 toward Kage pity).
  const g = defaultState(C, B); g.currencies.scrolls = 1e6;
  ok(pullCost(10, B) === B.economy.pullCost.ten && pullCost(10, B) <= 10 * pullCost(1, B), 'a 10-pull costs balance.economy.pullCost.ten, at most 10 singles');
  const grng = makeRng(9); let pityOk = true, guarOk = true;
  for (let i = 0; i < 200; i++) {
    const p0 = g.gacha.pity, t0 = g.gacha.totalPulls, sc0 = g.currencies.scrolls;
    const r = pull(g, 'standard', 10, C, grng, B);
    const lastKage = r.results.map(x => x.tier).lastIndexOf('kage');
    const expPity = lastKage < 0 ? p0 + 10 : 9 - lastKage;
    if (g.gacha.pity !== expPity || g.gacha.totalPulls !== t0 + 10 || sc0 - g.currencies.scrolls !== pullCost(10, B)) pityOk = false;
    if (!r.results.some(x => ['jonin', 'kage'].includes(x.tier))) guarOk = false;
  }
  ok(pityOk, 'a 10-pull counts 10 toward Kage pity (and resets on a Kage)');
  ok(guarOk, 'every 10-pull has at least one Jonin or better (more than Rare+)');

  // The tutorial reward: once per account, through reset, import and migration.
  const mem = { data: null };
  const local = { name: 'mem', isAvailable: () => true, load: async () => (mem.data ? { data: structuredClone(mem.data), updatedAt: 0 } : null), save: (d) => { mem.data = structuredClone(d); } };
  const sm = new SaveManager({ local, content: C, balance: B });
  await sm.init();
  ok(!tutorialRewardClaimed(sm.state) && skipTutorial(sm.state, B)?.scrolls === B.tutorial.rewards.scrolls && sm.state.account.tutorialRewarded, 'the first tutorial reward pays and sets the account flag');
  sm.save('t');
  sm.reset();
  ok(sm.state.account.tutorialRewarded && sm.state.tutorial.status === 'new' && sm.state.currencies.scrolls === B.economy.start.scrolls, 'Reset save keeps the account flag (and starts over otherwise)');
  startTutorial(sm.state);
  let replayPaid = null; for (let i = 0; i < C.tutorial.nodes.length; i++) { const r = completeLesson(sm.state, i, C, B); if (r.reward) replayPaid = r.reward; }
  ok(!replayPaid && sm.state.currencies.scrolls === B.economy.start.scrolls && sm.state.tutorial.completed, 'finishing the tutorial again after a reset pays nothing');
  ok(skipTutorial(sm.state, B) === null, 'skipping after a reset pays nothing');
  ok(completeLesson(sm.state, C.tutorial.nodes.length - 1, C, B, { replay: true }).reward === null, 'a replay pays nothing ("Rewards already claimed")');
  const noFlag = defaultState(C, B);
  ok(sm.importString(encodeSave(noFlag)).ok && sm.state.account.tutorialRewarded, 'importing a save keeps the account flag');
  ok(mem.data.account.tutorialRewarded === true, 'the flag is written with the save (the same data the cloud save uploads)');
  const v2done = migrate({ saveVersion: 2, currencies: { scrolls: 1, ryo: 1 }, tutorial: { status: 'done', lesson: 0, completed: false, rewarded: true } }, C, B);
  const v2new = migrate({ saveVersion: 2, currencies: { scrolls: 1, ryo: 1 }, tutorial: { status: 'new', lesson: 0, completed: false, rewarded: false } }, C, B);
  ok(v2done.saveVersion === 3 && v2done.account.tutorialRewarded && !v2new.account.tutorialRewarded, 'migration: saves with the tutorial done get the flag; new ones do not');
  ok(migrate({ saveVersion: 1, currencies: { scrolls: 1, ryo: 1 }, progress: { cleared: Object.fromEntries(C.arcs[0].nodes.map(n => [n.id, { clears: 1 }])) } }, C, B).account.tutorialRewarded, 'migration: a v1 save past the Prologue gets the reward once and the flag');

  // Speed, presets and the Roster view persist through a save round trip.
  const ps = defaultState(C, B);
  ps.settings.speed = 5; ps.settings.rosterView = { show: 'owned', role: 'Tank', tier: 'All', nature: 'Fire', sort: 'level' };
  ps.team = { members: ['naruto', 'sasuke'], leader: 'kakashi' }; savePreset(ps, 'boss');
  ps.team = { members: ['sakura'], leader: null };
  const back = migrate(decodeSave(encodeSave(ps)), C, B);
  ok(back.settings.speed === 5 && B.qol.battleSpeeds.includes(5), 'battle speed 5× is saved');
  ok(migrate({ ...ps, settings: { ...ps.settings, speed: 3 } }, C, B).settings.speed === 1, 'an unknown speed falls back to 1×');
  ok(back.teamPresets.length === PRESETS.length && back.teamPresets[1].members.join() === 'naruto,sasuke' && back.teamPresets[1].leader === 'kakashi', 'team presets are saved');
  ok(loadPreset(back, 'boss', C).ok && back.team.leader === 'kakashi' && back.team.members.join() === 'naruto,sasuke', 'loading a preset swaps the team in one step');
  ok(!loadPreset(back, 'daily', C).ok, 'an empty preset does not replace the team');
  const withSage = { ...ps, roster: { ...ps.roster, naruto_sage: { level: 1, stars: 1 } } };
  const junk = migrate({ ...withSage, teamPresets: [{ id: 'story', members: ['nobody', 'naruto', 'naruto_sage'], leader: 'zzz' }, 7] }, C, B);
  ok(junk.teamPresets[0].members.join() === 'naruto' && junk.teamPresets[0].leader === null && junk.teamPresets.length === 3, 'presets drop unknown and duplicate-form ninja');
  ok(JSON.stringify(back.settings.rosterView) === JSON.stringify(ps.settings.rosterView), 'the Roster sort and filters are saved');
  ok(JSON.stringify(migrate({ ...ps, settings: { ...ps.settings, rosterView: { sort: 'nope', nature: 'Ice' } } }, C, B).settings.rosterView) === JSON.stringify(ROSTER_VIEW_DEFAULT), 'bad Roster view values fall back to the defaults');
  const lvl = rosterList(back, C, B, { ...ROSTER_VIEW_DEFAULT, show: 'owned', sort: 'level' });
  back.roster.sakura.level = 50;
  ok(rosterList(back, C, B, { ...ROSTER_VIEW_DEFAULT, show: 'owned', sort: 'level' })[0].id === 'sakura' && lvl.length === Object.keys(back.roster).length, 'Roster sort by level puts the highest first');
  ok(rosterList(back, C, B, { ...ROSTER_VIEW_DEFAULT, nature: 'Lightning' }).every(d => d.natures.includes('Lightning') && !d.taijutsu), 'Roster nature filter');

  // Counter hints: the same wheel as the matchup rating.
  ok(counterLabel(C.char.sasuke, ['Water'], B) === 'countered' && counterLabel(C.char.lee, ['Water'], B) !== 'countered', 'counter hints: Fire is countered by Water; taijutsu is never countered');
  ok(counterLabel(C.char.sasuke, ['Wind'], B) === 'counters', 'counter hints: Fire counters Wind');
  ok(counterLabel(C.char.naruto, [], B) === 'neutral', 'no enemy natures: every ninja is neutral');
  // Auto-build: a heuristic (no battles simulated), fast on a full roster.
  const full = defaultState(C, B); for (const c of C.roster) full.roster[c.id] = { level: 50, stars: 3 };
  const t0 = performance.now();
  const pick = autoPickTeam(Object.entries(full.roster).map(([id, o]) => ({ id, ...o })), C.nodes[60], C, B);
  const ms = Math.round(performance.now() - t0);
  ok(pick.all.length === 4 && ms < 500, `Auto-build picks a full team from every ninja quickly (${ms} ms)`);

  // Tab badges.
  const bs = defaultState(C, B);
  const day = localDateKey();
  ok(!tabBadges(bs, C, B, day).home && !tabBadges(bs, C, B, day).summon, 'no dots on a new save');
  bs.currencies.tickets = 1;
  ok(tabBadges(bs, C, B, day).summon && tabBadges(bs, C, B, day).reasons.freePull, 'a summon ticket (a free summon) puts a dot on Summon');
  bs.currencies.tickets = 0; bs.currencies.rareTickets = 1;
  ok(tabBadges(bs, C, B, day).summon, 'a Rare+ ticket does too');
  bs.achievements.unlocked.ach_first_summon = 1;
  ok(tabBadges(bs, C, B, day).home && tabBadges(bs, C, B, day).reasons.claimable, 'an achievement reward to claim puts a dot on Home');
  bs.achievements.claimed.ach_first_summon = 1;
  ok(!tabBadges(bs, C, B, day).home, 'claimed: the dot goes');
  const firstDaily = C.arc[B.daily.unlockArc].nodes[0].globalIndex;
  for (const n of C.nodes.slice(0, firstDaily)) bs.progress.cleared[n.id] = { clears: 1 };
  for (const n of C.arc[B.daily.unlockArc].nodes) completeNode(bs, n, true, C, B);
  ok(dailyWaiting(bs, C, B, day) && tabBadges(bs, C, B, day).home, "today's Daily challenge not done: a dot on Home");
  bs.daily = { ...bs.daily, date: day, attempts: B.daily.attemptsPerDay, cleared: false };
  ok(!dailyWaiting(bs, C, B, day), 'no attempts left: no Daily dot');
  bs.daily = { ...bs.daily, date: day, attempts: 1, cleared: true };
  ok(!dailyWaiting(bs, C, B, day) && dailyWaiting(bs, C, B, '2999-01-01'), 'cleared today: no dot, and it comes back the next day');
  ok(bs.daily.date === day, 'checking the dots never changes the save');
}

// ---- the installable app (js/core/Pwa.js) ------------------------------------
{
  ok(isStandalone({ matchMedia: () => ({ matches: true }), navigator: {} }) && !isStandalone({ matchMedia: () => ({ matches: false }), navigator: {} }), 'standalone: display-mode media query');
  ok(isStandalone({ matchMedia: undefined, navigator: { standalone: true } }) && !isStandalone({ matchMedia: undefined, navigator: {} }), 'standalone: iOS navigator.standalone, false with nothing');
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
  const pixel = 'Mozilla/5.0 (Linux; Android 15; Pixel 8a) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36';
  ok(isIOS(iphone) && !isIOS(pixel) && isIOS('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5) && !isIOS('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0), 'iOS detection (iPhone, iPad as Macintosh with touch, not Android or a Mac)');
  ok(installModel({ standalone: true, canPrompt: true }).kind === 'installed', 'installed: no install button, even with a prompt');
  const p = installModel({ standalone: false, canPrompt: true, ua: pixel });
  ok(p.kind === 'prompt' && /Install app/.test(p.button), 'Android Chrome with beforeinstallprompt: the Install button');
  const i = installModel({ standalone: false, canPrompt: false, ua: iphone });
  ok(i.kind === 'ios' && /Share/.test(i.text) && /Add to Home Screen/.test(i.text) && !i.button, 'iPhone: Share > Add to Home Screen, no button');
  const m = installModel({ standalone: false, canPrompt: false, ua: pixel });
  ok(m.kind === 'manual' && /Add to Home screen/.test(m.text) && !m.button, 'no prompt yet: the browser menu');
  const a = { sha: 'aaaaaaa', dev: false }, b = { sha: 'bbbbbbb', dev: false }, dev = { dev: true };
  ok(updateAvailable(a, b) && !updateAvailable(a, a) && !updateAvailable(dev, b) && !updateAvailable(a, dev) && !updateAvailable(null, b), 'update: a different live commit, never against "dev"');
  ok(shouldCheckForUpdate(0, 5000) && !shouldCheckForUpdate(5000, 5000 + UPDATE_CHECK_MIN_MS - 1) && shouldCheckForUpdate(5000, 5000 + UPDATE_CHECK_MIN_MS), 'update checks are at most one a minute');
  ok(signInFallback({ standalone: true, ua: pixel })?.label && !signInFallback({ standalone: false, ua: pixel }) && !signInFallback({ standalone: true, ua: iphone }), 'sign-in fallback: the browser on Android only inside the installed app, never on iOS');
}

console.log(`${fails ? 'FAIL' : 'PASS'} — core tests: ${passes} passed, ${fails} failed.`);
process.exit(fails ? 1 : 0);
