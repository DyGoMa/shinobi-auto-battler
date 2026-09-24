// BattleScreen.js — runs a BattleSim in real time: canvas, ult portraits,
// Jutsu Clash previews, pause/speed/auto, onboarding tips, results and the
// Boss Rush round loop. requestAnimationFrame with delta clamped to 50 ms;
// pauses automatically while the tab is hidden.
import { h, btn, fmt, avatar, objectiveText } from './dom.js';
import { BattleSim } from '../core/BattleSim.js';
import { Renderer } from '../render/Renderer.js';
import { Effects } from '../render/Effects.js';
import { nodeBattleConfig, completeNode, completeBossRushRound, bossRushRound, resolveTeam, buildTeamUnits, isNodeUnlocked, isHardNodeUnlocked } from '../core/Progression.js';
import { dailyBattleConfig, completeDaily, attemptsLeft, startDailyAttempt, TWIST_TEXT } from '../core/Daily.js';
import { hashString, bestNature, beatenBy, natureRelation } from '../core/formulas.js';
import { leaderBuffText } from '../core/Ninja.js';
import { arcOf } from '../content/index.js';
import { completeLesson, tutorialLessons } from '../core/Tutorial.js';
import { tipsEnabled, tipSeen, markTipSeen } from './tips.js';
import { LESSON_TITLE } from './TutorialScreen.js';
import { guideBody, whenGuideReady } from './WikiScreen.js';
import { recordBattle } from '../core/Achievements.js';
import { nodeEnemyNatures, teamMatchupRating } from '../core/TeamPicker.js';

const CLASH_LABEL = { overpower: '▲ OVERPOWER', standoff: '= STANDOFF', overwhelmed: '▼ WEAK' };

export class BattleScreen {
  constructor(game, ui, opts) {
    this.game = game; this.ui = ui; this.opts = opts;
    this.root = document.getElementById('battle');
    this.paused = false; this.hiddenPause = false; this.tipPause = false;
    this.speed = game.state.settings.speed || 1;
    this.raf = 0; this.last = 0; this.portraitT = 0;
    this.ended = false;
    this.round = 1; this.rushRewards = { scrolls: 0, ryo: 0 };
    this.tips = { shown: new Set() };
    // Tutorial lesson battles: { index, replay }. Their coach tips always show.
    this.tutorial = opts.tutorial || null;
    this.lessonType = this.tutorial ? opts.node?.lesson : null;
    this.autoRevealed = !this.tutorial;
    this._onVis = this._onVis.bind(this);
    this._loop = this._loop.bind(this);
    this._onKey = this._onKey.bind(this);
  }

  // ---------------------------------------------------------------- setup
  open() {
    const { C } = this.game;
    this.isRush = !!this.opts.bossRush;
    this.daily = this.opts.daily || null;          // the Daily challenge (js/core/Daily.js)
    this.hard = !!this.opts.hard;                  // a story battle on Hard mode
    this.node = this.opts.node || this.daily?.node || null;
    const theme = this.isRush ? { sky: ['#3b2a3f', '#b98a8a'], ground: '#5b3a3a', far: '#3a2430', accent: '#ff4d4d' } : arcOf(this.node, C).theme;

    this.objEl = h('div.obj');
    this.timerEl = h('div.timer', { 'aria-label': 'Battle time' }, '0:00');
    this.speedBtn = h('button.icon-btn', { type: 'button', 'aria-label': 'Battle speed', title: 'Battle speed', onclick: () => { this.speed = this.speed === 1 ? 2 : 1; this.speedBtn.textContent = `${this.speed}×`; } }, `${this.speed}×`);
    this.autoBtn = h('button.icon-btn', { type: 'button', onclick: () => { const s = this.game.state.settings; s.autoUlt = !s.autoUlt; this._syncAuto(); this.game.commit('settings'); } });
    this.pauseBtn = h('button.icon-btn', { type: 'button', 'aria-label': 'Pause', title: 'Pause', onclick: () => this.togglePause() }, '⏸');
    const hud = h('div.bhud', this.objEl, this.timerEl, this.autoBtn, this.speedBtn, this.pauseBtn);
    this.canvas = h('canvas', { 'aria-label': 'Battlefield' });
    this.stage = h('div.stage', this.canvas);
    this.ultbar = h('div.ultbar');
    this.info = h('div.binfo');
    this.root.replaceChildren(hud, this.stage, this.info, this.ultbar);
    this.root.classList.remove('hidden');
    this._syncAuto();

    this.renderer = new Renderer(this.canvas);
    this.renderer.setTheme(theme);
    this.effects = new Effects(this.renderer);
    this.ro = new ResizeObserver(() => this._resize());
    this.ro.observe(this.stage);
    this._resize();

    this._buildSim();
    document.addEventListener('visibilitychange', this._onVis);
    document.addEventListener('keydown', this._onKey);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this._loop);
    if (this.lessonType) this._tip(`lesson.${this.lessonType}.start`);
    else this._tip('battle.start');
  }

  /** Auto-ult is hidden in the tutorial until Lesson 3 introduces it. */
  _autoOn() { return this.autoRevealed && !!this.game.state.settings.autoUlt; }
  _syncAuto() {
    const on = this._autoOn();
    this.autoBtn.classList.toggle('hidden', !this.autoRevealed);
    this.autoBtn.textContent = on ? '🤖' : '👆';
    const label = on ? 'Auto-ult is on: the game fires Ultimates for you. Tap to fire them yourself.' : 'Auto-ult is off: you tap portraits to fire Ultimates. Tap to let the game fire them.';
    this.autoBtn.title = label; this.autoBtn.setAttribute('aria-label', label);
    this.autoBtn.setAttribute('aria-pressed', String(on));
    this.autoBtn.style.borderColor = on ? 'var(--accent)' : '';
  }

  _resize() {
    const r = this.stage.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    this.renderer.resize(r.width, r.height);
  }

  _seed() { return (hashString(this.node?.id || 'rush') ^ Date.now()) >>> 0; }

  _buildSim(carry = null) {
    const { game } = this; const { C, B, state } = game;
    let cfg;
    if (this.isRush) {
      const R = bossRushRound(this.round, C, B);
      const team = resolveTeam(state, null, C);
      let player = buildTeamUnits(state, null, C, team, B);
      if (carry) player = player.map(p => { const c = carry.find(x => x.key === p.key); return c ? { ...p, startHp: c.alive ? c.hp : 0, startChakraOverride: c.chakra * B.bossRush.chakraCarry } : p; }).filter(p => p.startHp == null || p.startHp > 0);
      this.rushBoss = R;
      cfg = { player, enemies: [{ spec: R.spec }], enemyFactory: R.enemyFactory, objective: { type: 'defeatBoss' }, seed: this._seed() + this.round, balance: B };
    } else if (this.daily) {
      cfg = dailyBattleConfig(state, this.daily, this.round - 1, C, B, { seed: this._seed() + this.round, carry });
      this.node = cfg.node;
      const natures = cfg.enemyNature ? [cfg.enemyNature] : nodeEnemyNatures(this.node, C);
      this.matchup = teamMatchupRating(cfg.team.members.map(id => C.char[id]), natures, B);
    } else {
      cfg = nodeBattleConfig(state, this.node, C, B, { seed: this._seed(), hard: this.hard });
      // The team's nature matchup at the start ("Against the Odds" counts Poor or Bad).
      this.matchup = teamMatchupRating(cfg.team.members.map(id => C.char[id]), nodeEnemyNatures(this.node, C), B);
    }
    this.sim = new BattleSim(cfg);
    this.renderer.vis.clear();
    this.effects = new Effects(this.renderer);
    this._buildPortraits();
    this._updateObjective();
    this._buildInfo();
  }

  /** Portrait-only panel between the canvas and the ult bar: wheel + foes. */
  _buildInfo() {
    const { C } = this.game;
    const wheel = h('div.wheel', ...this.game.B.natureWheel.cycle.flatMap((n, i, a) => [h('span.nat.' + n, n), h('span.gt', '›')]).concat([h('span.nat.' + this.game.B.natureWheel.cycle[0], this.game.B.natureWheel.cycle[0])]));
    const foes = this.sim.units.filter(u => u.side === 'enemy');
    this.info.replaceChildren(
      h('div.small', h('b', 'Nature Wheel'), h('span.muted', ' — each beats the next')), wheel,
      h('div.small.muted', 'Tap a glowing portrait to fire its Ultimate. When an enemy shows a ⚠ wind-up bar, fire into it to Jutsu Clash — the badge predicts the result.'),
      h('div', { style: { marginTop: '10px' } }, ...foes.map(u => h('div.foe', h('b', u.name + (u.isBoss ? ' 👑' : '')), u.activeNature ? h('span.nat.' + u.activeNature, u.activeNature) : h('span.nat.none', 'No nature'), u.jutsu ? h('span.tiny.muted', u.jutsu.name) : null))),
    );
  }

  _buildPortraits() {
    const { C } = this.game;
    this.portraits = [];
    this.ultbar.replaceChildren();
    for (const u of this.sim.units.filter(x => x.side === 'player' && !x.protected)) {
      const def = C.char[u.key];
      const hp = h('i'), ck = h('i');
      const clash = h('span.clash.hidden');
      const el = h('button.ult', { type: 'button', 'aria-label': `${u.name} Ultimate: ${u.ult.name}`, onclick: () => this._tapUlt(u.uid) },
        avatar(def), h('div.info', h('div.nm', u.short + (u.isLeader ? ' ★' : '')), h('div.ultname', u.ult.name), h('div.hp', hp), h('div.ck', ck)), clash);
      this.ultbar.appendChild(el);
      this.portraits.push({ uid: u.uid, el, hp, ck, clash, ready: false });
    }
  }

  _updateObjective() {
    const { C } = this.game;
    if (this.isRush) {
      const d = this.rushBoss.def;
      this.objEl.replaceChildren(h('div', `☁️ Boss Rush — Round ${this.round}: ${d.name}`), h('div.sub', `Lv ${this.rushBoss.level}${this.rushBoss.loop ? ` · Loop ${this.rushBoss.loop + 1}` : ''} · no healing between rounds`));
    } else if (this.daily) {
      const tw = TWIST_TEXT[this.daily.twist.id];
      const rounds = this.daily.rounds.length;
      this.objEl.replaceChildren(h('div', `📅 Daily: ${tw.name}${rounds > 1 ? ` · round ${this.round} of ${rounds}` : ''}`), h('div.sub', `${this.node.name} · Lv ${this.daily.level} · 🎯 ${objectiveText(this.sim.objective, C)}`));
    } else {
      this.objEl.replaceChildren(h('div', (this.hard ? '💀 Hard · ' : '') + this.node.name), h('div.sub', '🎯 ' + objectiveText(this.node.objective, C)));
    }
  }

  // ---------------------------------------------------------------- input
  _tapUlt(uid) {
    if (this.paused || this.ended) return;
    const res = this.sim.fireUlt(uid);
    if (res.ok) {
      this.game.audio.ultFire();
      // A coach tip that asked for an Ultimate ("tap Sasuke now!") closes itself.
      if (this.tipBox?.untilUlt) this._closeTip();
    } else {
      const u = this.sim.unit(uid);
      if (u && u.alive && u.chakra < this.game.B.combat.chakra.max) this.effects.text(u.x, 200, 'Chakra not full', { color: '#9be3ff', size: 16, dur: 0.7 });
    }
  }
  _onKey(e) {
    if (e.key === ' ' || e.key === 'p' || e.key === 'Escape') { e.preventDefault(); this.togglePause(); }
    const n = Number(e.key); if (n >= 1 && n <= 4 && this.portraits[n - 1]) this._tapUlt(this.portraits[n - 1].uid);
  }
  _onVis() { if (document.hidden) { this.hiddenPause = true; } else { this.hiddenPause = false; this.last = performance.now(); } }

  togglePause(force = null) {
    if (this.ended) return;
    this.paused = force == null ? !this.paused : force;
    this.pauseBtn.textContent = this.paused ? '▶' : '⏸';
    this.stage.querySelector('.pause-veil')?.remove();
    if (this.paused) {
      const veil = h('div.pause-veil', h('div.card.center', { style: { minWidth: '260px' }, role: 'dialog', 'aria-label': 'Paused' },
        h('h2', 'Paused'),
        h('p.small', 'Tip: when an enemy shows a ⚠ wind-up bar, tap a ready portrait to Jutsu Clash. The badge on each portrait predicts the result.'),
        h('div.col',
          btn('▶ Resume', () => this.togglePause(false), 'primary block'),
          btn('❓ How Jutsu Clash works', () => this._help(), 'block'),
          this.tutorial && !this.tutorial.replay ? btn('Skip tutorial', () => this._skipTutorial(), 'block') : null,
          btn(this.isRush ? '🏳️ End the run' : this.tutorial ? '🏳️ Leave the lesson' : '🏳️ Retreat (counts as a loss)', () => this._forfeit(), 'danger block'))));
      this.stage.appendChild(veil);
    }
  }

  /** The battle's help: the Jutsu Clash guide in a modal over the paused battle. */
  _help() {
    const body = h('div');
    const inert = () => this.ui.toast('The Wiki opens from the Wiki tab after the battle.');
    const draw = () => body.replaceChildren(guideBody(this.game, this.ui, 'jutsu-clash', inert));
    draw();
    whenGuideReady('jutsu-clash', this.ui, draw);
    const close = this.ui.modal(h('div', body, h('div.actions', btn('Back to the battle', () => close(), 'primary'))), { wide: true, label: 'Jutsu Clash help' });
  }

  /** Skip the tutorial from inside a lesson battle: same reward as finishing it. */
  async _skipTutorial() {
    const skipped = await this.ui.skipTutorial({ after: () => {} });
    if (!skipped) return;
    this.ended = true;
    this.close({ id: 'home' });
  }

  _forfeit() { this.paused = false; this.stage.querySelector('.pause-veil')?.remove(); this.sim.state = 'lost'; this.sim.endReason = 'retreat'; }

  // ---------------------------------------------------------------- loop
  _loop(ts) {
    this.raf = requestAnimationFrame(this._loop);
    const rawDt = Math.min(50, Math.max(0, ts - this.last)) / 1000; // clamp to 50 ms
    this.last = ts;
    const running = !this.paused && !this.hiddenPause && !this.tipPause && !this.ended;
    if (running) {
      if (this._autoOn()) {
        const before = this.sim.stats.ults;
        // Default 'smart' = clash-aware: fires counter-nature ninja into wind-ups and
        // holds ults that would be Overwhelmed (Settings → Auto-ult mode).
        this.sim.botUlts(this.game.state.settings.autoUltMode === 'asap' ? 'asap' : 'smart');
        if (this.sim.stats.ults > before) this.game.audio.ultFire();
      }
      this.sim.step(rawDt * this.speed);
      const events = this.sim.drainEvents();
      this.effects.onEvents(events, this.sim);
      this._sounds(events);
      this._tipsFromEvents(events);
      this.effects.update(rawDt * this.speed);
    } else {
      this.effects.update(0);
    }
    try { this.renderer.draw(this.sim, this.effects, running ? rawDt * this.speed : 0); } catch (e) { console.error('[render]', e); }
    this.portraitT -= rawDt;
    if (this.portraitT <= 0) { this.portraitT = 0.08; this._updatePortraits(); this._updateTimer(); }
    if (!this.ended && this.sim.state !== 'running') this._onEnd();
  }

  _sounds(events) {
    const a = this.game.audio;
    for (const e of events) {
      switch (e.type) {
        case 'damage':
          if (e.relation > 0) a.effective(); else if (e.crit) a.crit(); else if (e.relation < 0) a.resisted(); else a.hit();
          break;
        case 'ultReady': a.ultReady(); break;
        case 'clash': a.clash(e.outcome); break;
        case 'telegraph': a.telegraph(); break;
        default: break;
      }
    }
  }

  _updatePortraits() {
    const max = this.game.B.combat.chakra.max;
    const tele = this.sim.clashTarget();
    for (const p of this.portraits) {
      const u = this.sim.unit(p.uid);
      if (!u) continue;
      p.hp.style.width = `${Math.max(0, (u.hp / u.maxHp) * 100)}%`;
      p.ck.style.width = `${Math.min(100, (u.chakra / max) * 100)}%`;
      const ready = u.alive && u.chakra >= max;
      p.el.classList.toggle('ready', ready);
      p.el.classList.toggle('dead', !u.alive);
      if (ready && tele) {
        const o = this.sim.clashPreview(p.uid)?.outcome;
        p.clash.className = 'clash ' + o; p.clash.textContent = CLASH_LABEL[o] || '';
      } else p.clash.className = 'clash hidden';
    }
  }

  _updateTimer() {
    const t = this.sim.time;
    const surv = this.sim.surviveSeconds();
    if (!this.isRush && surv && (this.sim.objective.type === 'survive' || this.sim.objective.type === 'protect')) {
      this.timerEl.textContent = `⏳ ${Math.max(0, Math.ceil(surv - t))}s`;
    } else {
      this.timerEl.textContent = `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    }
  }

  // ---------------------------------------------------------------- coach tips
  // Tutorial lesson battles show their coach tips ('lesson.*') every time. The first
  // story battle shows the battle tips ('battle.*') once per save, unless the player
  // finished the tutorial (it teaches the same things) or switched tips off.
  _battleTipsOn() {
    const s = this.game.state;
    return !this.tutorial && !!this.node?.onboarding && tipsEnabled(s) && !s.tutorial.completed;
  }
  _tip(id) {
    if (this.tips.shown.has(id) || this.ended) return;
    const lessonTip = id.startsWith('lesson.');
    if (!lessonTip && (!this._battleTipsOn() || tipSeen(this.game.state, id))) return;
    this.tips.shown.add(id);
    if (!lessonTip) markTipSeen(this.game, id);
    // One tip at a time: queue the rest until "Got it".
    if (this.tipPause) { (this.tips.queue ||= []).push(id); return; }
    this._showTip(id);
  }
  _showTip(id) {
    const tip = this._tipContent(id);
    if (!tip || this.ended) { this._nextTip(); return; }
    this.tipPause = true;
    const box = h('div.onboard', { role: 'dialog', 'aria-live': 'polite' }, ...tip.body, h('div.row', btn(tip.button || 'Got it', () => this._closeTip())));
    box.untilUlt = !!tip.untilUlt;
    box.style.top = tip.top || '6%';
    this.tipBox = box;
    this.stage.appendChild(box);
    if (tip.onShow) tip.onShow();
  }
  _closeTip() {
    if (this.tipBox) { this.tipBox.remove(); this.tipBox = null; }
    this.tipPause = false; this.last = performance.now();
    this._nextTip();
  }
  _nextTip() { const next = this.tips.queue?.shift(); if (next) this._showTip(next); }
  _clearTips() { this.stage.querySelectorAll('.onboard').forEach(el => el.remove()); this.tipBox = null; this.tipPause = false; if (this.tips.queue) this.tips.queue.length = 0; }

  _tipsFromEvents(events) {
    const L = this.lessonType;
    if (!L && !this._battleTipsOn()) return;
    for (const e of events) {
      const u = e.uid != null ? this.sim.unit(e.uid) : null;
      if (L === 'team' && e.type === 'ultReady') this._tip('lesson.team.ult');
      if (L === 'nature' && e.type === 'damage' && e.relation > 0 && this.sim.unit(e.src)?.side === 'player') { this.effectiveHit = e; this._tip('lesson.nature.effective'); }
      if (L === 'clash' && e.type === 'telegraph' && u?.side === 'enemy') this._tip('lesson.clash.windup');
      if (L === 'clash' && e.type === 'clash') { this.clashSeen = e; this._tip(`lesson.clash.${e.outcome}`); this._tip('lesson.clash.auto'); }
      if (!L && e.type === 'ultReady') this._tip('battle.ult');
      if (!L && e.type === 'telegraph' && this.tips.shown.has('battle.ult')) this._tip('battle.clash');
    }
  }

  /** Text for a coach tip. Names, natures and numbers come from the battle and balance.js. */
  _tipContent(id) {
    const { C, B } = this.game;
    const sim = this.sim;
    const b = (t) => h('b', t);
    const players = sim.units.filter(u => u.side === 'player' && !u.protected);
    const foe = sim.units.find(u => u.side === 'enemy' && u.alive) || sim.units.find(u => u.side === 'enemy');
    const fn = foe?.activeNature;
    const J = B.jutsuClash;
    switch (id) {
      case 'battle.start':
        return { top: '12%', body: [b(`Welcome to ${this.node.name}!`), ' Your ninja walk and fight on their own. Goal: ', b(objectiveText(this.node.objective, C)), '.'] };
      case 'battle.ult':
        return { untilUlt: true, body: [b('Chakra full!'), ' A glowing portrait (below the battlefield) means that ninja\'s ', b('Ultimate'), ' is ready: tap it to fire. Keys 1–4 work too.'] };
      case 'battle.clash':
        return { body: [b(`${foe?.name || 'An enemy'} is winding up a jutsu`), ' (see the ⚠ bar). Fire an Ultimate ', b('now'), ' to ', b('JUTSU CLASH'), '. The badge on each portrait predicts it: ▲ your nature beats theirs, = standoff, ▼ weak.'] };
      case 'lesson.team.start': {
        const leader = players.find(u => u.isLeader);
        return { top: '10%', body: [b('Lesson 1: team building. '), 'Your ninja walk and fight on their own: Tanks and Strikers close in, Ranged and Support ninja attack from behind. ',
          leader ? [b(`${leader.name} ★`), ` leads: ${leaderBuffText(C.char[leader.key], B)}.`] : 'No Leader this time.'] };
      }
      case 'lesson.team.ult':
        return { untilUlt: true, body: [b('A portrait is glowing!'), ' That ninja\'s Ultimate is ready: tap it to fire (or press 1–4). Lesson 3 shows you when to hold it.'] };
      case 'lesson.nature.start': {
        const counter = beatenBy(fn, B);
        const who = players.filter(u => bestNature(u.natures, fn, { taijutsu: u.taijutsu }, B).relation > 0).map(u => u.short);
        return { top: '10%', body: [b('Lesson 2: the Nature Wheel. '), `${foe.name} fights with ${fn} Style. `,
          who.length ? [b(who.join(' and ')), ` use${who.length === 1 ? 's' : ''} ${counter} Style, which beats ${fn}: watch for `, b('EFFECTIVE!')] : `${counter} Style beats it.`] };
      }
      case 'lesson.nature.effective': {
        const src = sim.unit(this.effectiveHit?.src);
        const resisters = players.filter(u => !u.taijutsu && natureRelation(u.natures[0], fn, B) > 0);
        return { body: [b('EFFECTIVE!'), ` ${src?.short || 'Your ninja'}'s ${this.effectiveHit?.nature} Style beats ${fn}: ×${B.natureWheel.advantage} damage.`,
          resisters.length ? ` And ${foe.name}'s hits on ${resisters.map(u => u.short).join(' and ')} are resisted (×${B.natureWheel.disadvantage}): ${resisters[0].natures[0]} Style beats ${fn} on defence too.` : ''] };
      }
      case 'lesson.clash.start':
        return { top: '10%', body: [b('Lesson 3: Ultimates. '), 'Your team starts with full chakra, so every portrait is glowing. ', b('Hold your Ultimates for now:'), ` ${foe.name} is about to use a jutsu.`] };
      case 'lesson.clash.windup': {
        const tel = sim.clashTarget();
        const ready = players.filter(u => sim.canUlt(u.uid));
        const best = ready.find(u => sim.clashPreview(u.uid)?.outcome === 'overpower');
        if (!tel) return null;
        if (!ready.length) return { body: [b('⚠ Wind-up!'), ` ${foe.name} is winding up ${tel.name}. None of your Ultimates is ready: build chakra and meet the next one.`] };
        return { untilUlt: true, button: 'Let it land', body: [b('⚠ Jutsu Clash! '), `${foe.name} is winding up ${tel.name}${tel.nature ? ` (${tel.nature} Style)` : ''}. Fire an Ultimate into it now. `,
          best ? [`The badges predict the result: `, b(`${best.short} shows ▲ OVERPOWER`), ` (${bestNature(best.natures, tel.nature, {}, B).nature} beats ${tel.nature}). `, b(`Tap ${best.short}!`)] : 'The badges predict the result: tap the best one.'] };
      }
      case 'lesson.clash.overpower': {
        const u = sim.unit(this.clashSeen?.uid);
        return { body: [b('OVERPOWER! '), `${foe.name}'s jutsu is cancelled and ${foe.name} is stunned. ${u?.short || 'Your ninja'}'s Ultimate dealt ×${J.overpowerUltMult} damage, and ${J.overpowerChakraRefund} chakra came back.`] };
      }
      case 'lesson.clash.standoff':
        return { body: [b('STANDOFF. '), `Both jutsu fizzled and your Ultimate still hit at ×${J.standoffUltMult}. A ninja with a ▲ badge would have overpowered it.`] };
      case 'lesson.clash.overwhelmed':
        return { body: [b('OVERWHELMED. '), 'The jutsu\'s nature beats your ninja\'s, so the Ultimate did no damage. It still blocked the jutsu, and most of its chakra came back.'] };
      case 'lesson.clash.auto':
        return { button: 'Got it', onShow: () => { this.autoRevealed = true; this._syncAuto(); },
          body: [b('🤖 Auto-ult '), 'is now on your battle bar (top right). Tap it and the game fires Ultimates for you: it clashes when your nature wins and holds any ninja that would be Overwhelmed. Tap again to take control back.'] };
      default: return null;
    }
  }

  // ---------------------------------------------------------------- end
  _onEnd() {
    const won = this.sim.state === 'won';
    const { game } = this; const { C, B, state } = game;
    this._clearTips();
    if (this.isRush) {
      if (won) {
        const rw = completeBossRushRound(state, this.round, B);
        recordBattle(state, { won: true, mode: 'rush', sim: this.sim }, B);
        this.rushRewards.scrolls += rw.scrolls; this.rushRewards.ryo += rw.ryo;
        game.commit('bossrush');
        game.audio.victory();
        this._intermission(rw);
        return;
      }
      this.ended = true;
      state.bossRush.runs = (state.bossRush.runs || 0) + 1;
      recordBattle(state, { won: false, mode: 'rush', sim: this.sim }, B);
      game.commit('bossrush');
      game.audio.defeat();
      setTimeout(() => this._rushResults(), 700);
      return;
    }
    this.ended = true;
    if (this.tutorial) {
      // Lesson battles pay nothing themselves: the tutorial reward is paid once, when
      // the last lesson is won (or the tutorial is skipped).
      const res = won ? completeLesson(state, this.tutorial.index, C, B, { replay: this.tutorial.replay }) : null;
      game.commit('tutorial');
      won ? game.audio.victory() : game.audio.defeat();
      setTimeout(() => this._tutorialResults(won, res), 650);
      return;
    }
    if (this.daily) { this._dailyEnd(won); return; }
    const result = completeNode(state, this.node, won, C, B, { time: this.sim.time }, { hard: this.hard });
    recordBattle(state, { won, mode: this.hard ? 'hard' : 'story', sim: this.sim, matchup: this.matchup }, B);
    game.commit('battle');
    won ? game.audio.victory() : game.audio.defeat();
    setTimeout(() => this._results(won, result), 650);
  }

  _tutorialResults(won, res) {
    const { game, ui, node } = this; const { C } = game;
    const lessons = tutorialLessons(C);
    const i = this.tutorial.index, replay = this.tutorial.replay;
    const next = lessons[i + 1];
    const cl = this.sim.stats.clashes;
    const recap = {
      team: 'Your team lined up by role on its own: fighters in front, ranged ninja behind.',
      nature: `Effective hits: ${this.sim.stats.effective}. Bringing the right nature makes every fight easier.`,
      clash: `Jutsu Clashes: ${cl.overpower} overpower, ${cl.standoff} standoff, ${cl.overwhelmed} overwhelmed.`,
    }[node.lesson];
    const finished = won && res?.finished;
    const content = h('div',
      h('div.result-hero',
        h('div.big.' + (won ? 'win' : 'lose'), finished ? 'TUTORIAL COMPLETE' : won ? 'LESSON COMPLETE' : 'DEFEAT'),
        h('div.muted', `Lesson ${i + 1} of ${lessons.length}: ${LESSON_TITLE[node.lesson]}`)),
      won ? h('p.center', recap) : h('p.center', 'Even the best ninja lose sometimes. Try the lesson again, or skip the tutorial.'),
      finished && res.reward ? h('div.reward-row', h('div.reward', `📜 +${fmt(res.reward.scrolls)}`), h('div.reward', `🪙 +${fmt(res.reward.ryo)}`), h('div.reward', '🎓 Tutorial reward')) : null,
      finished && !replay ? h('p.center', 'Next up: the Survival Test. Summon a few ninja first with your scrolls, or head straight to the story.') : null,
    );
    const actions = h('div.actions');
    const close = ui.modal(h('div', content, actions), { dismissable: false, wide: true, label: 'Lesson results' });
    const leave = (goTo) => { close(); this.close(goTo); };
    if (!won) {
      if (!replay) actions.append(btn('Skip tutorial', async () => { if (await ui.skipTutorial({ after: () => {} })) leave({ id: 'home' }); }, 'ghost'));
      actions.append(btn('↻ Try again', () => { close(); this.restart(); }, 'primary'));
    } else if (next) {
      if (!replay) actions.append(btn('Skip tutorial', async () => { if (await ui.skipTutorial({ after: () => {} })) leave({ id: 'home' }); }, 'ghost'));
      actions.append(btn(`Next lesson: ${LESSON_TITLE[next.lesson]} ▶`, () => leave({ id: 'tutorial', params: { lesson: i + 1, replay } }), 'primary'));
    } else if (replay) {
      actions.append(btn('Done', () => leave(this.tutorial.returnTo || { id: 'home' }), 'primary'));
    } else {
      actions.append(btn('📜 Summon ninja', () => leave({ id: 'summon' })),
        btn('🗺️ Survival Test ▶', () => leave({ id: 'story', params: { arcId: C.arcs[0].id, nodeId: C.nodes[0].id } }), 'primary'));
    }
  }

  _intermission(rw) {
    const { C } = this.game;
    this.ended = true;
    const carry = this.sim.playerCarry();
    const next = bossRushRound(this.round + 1, C, this.game.B);
    const special = (next.def.mechanics || []).find(m => m.type === 'telegraphAoE');
    let timer = null;
    const go = () => {
      clearTimeout(timer); box.remove();
      this.round++; this.ended = false;
      this._buildSim(carry);
      this.effects.say(`Round ${this.round}: ${next.def.name}`, '#ff6b6b', 2);
    };
    const alive = carry.filter(c => c.alive).length;
    const box = h('div.pause-veil', h('div.card.center', { style: { maxWidth: '420px' } },
      h('div.result-hero', h('div.big.win', `ROUND ${this.round} CLEAR`)),
      h('div.reward-row', h('div.reward', `📜 +${fmt(rw.scrolls)}`), h('div.reward', `🪙 +${fmt(rw.ryo)}`)),
      h('p', `Next: `, h('b', next.def.name), ` (Lv ${next.level})`, special ? h('span', ' — special: ', h('b', special.name)) : null),
      h('p.small', `${alive} ninja still standing. No healing between rounds.`),
      h('div.col', btn('Next round ▶', go, 'primary block'), btn('🏳️ Take the rewards and stop', () => { clearTimeout(timer); box.remove(); this.sim.state = 'lost'; this.ended = true; this.game.state.bossRush.runs = (this.game.state.bossRush.runs || 0) + 1; this.game.commit('bossrush'); this._rushResults(true); }, 'block'))));
    this.stage.appendChild(box);
    timer = setTimeout(go, Math.max(1, this.game.B.bossRush.intermission) * 1000 + 4000);
  }

  _statsTable() {
    const { sim } = this;
    const players = sim.units.filter(u => u.side === 'player' && !u.protected);
    const max = Math.max(1, ...players.map(u => sim.stats.damageByUnit[u.uid] || 0));
    return h('table.dmg-table', h('tbody', ...players.map(u => h('tr',
      h('td', u.short + (u.isLeader ? ' ★' : '')),
      h('td.barcell', h('div.bar', h('i', { style: { width: `${((sim.stats.damageByUnit[u.uid] || 0) / max) * 100}%` } }))),
      h('td', { style: { textAlign: 'right' } }, fmt(sim.stats.damageByUnit[u.uid] || 0)),
    ))));
  }

  /** A daily battle ended. Boss rush dailies go round by round, carrying HP and chakra. */
  _dailyEnd(won) {
    const { game } = this; const { C, B, state } = game;
    recordBattle(state, { won, mode: 'daily', sim: this.sim, matchup: this.matchup }, B);
    if (won && this.round < this.daily.rounds.length) {
      game.commit('daily');
      game.audio.victory();
      const carry = this.sim.playerCarry();
      const next = this.daily.rounds[this.round];
      const box = h('div.pause-veil', h('div.card.center', { style: { maxWidth: '380px' } },
        h('div.result-hero', h('div.big.win', `ROUND ${this.round} CLEAR`)),
        h('p', 'Next: ', h('b', next.name), ` (Lv ${this.daily.level})`),
        h('p.small', `${carry.filter(c => c.alive).length} ninja still standing. No healing between rounds.`),
        btn('Next round ▶', () => { box.remove(); this.round++; this.ended = false; this._buildSim(carry); }, 'primary block')));
      this.stage.appendChild(box);
      return;
    }
    const reward = won ? completeDaily(state, this.daily, C, B) : null;
    game.commit('daily');
    won ? game.audio.victory() : game.audio.defeat();
    setTimeout(() => this._dailyResults(won, reward), 650);
  }

  _dailyResults(won, reward) {
    const { game, ui } = this; const { B, state } = game;
    const left = attemptsLeft(state, B, this.daily.dateKey);
    const tw = TWIST_TEXT[this.daily.twist.id];
    const content = h('div',
      h('div.result-hero', h('div.big.' + (won ? 'win' : 'lose'), won ? 'CHALLENGE CLEARED' : 'DEFEAT'), h('div.muted', `📅 Daily challenge · ${tw.name}`)),
      won && reward ? h('div.reward-row', h('div.reward', `📜 +${fmt(reward.scrolls)}`), h('div.reward', `🪙 +${fmt(reward.ryo)}`)) : null,
      won ? h('p.center', 'Come back tomorrow for a new challenge.') : h('p.center', left ? `${left} attempt${left === 1 ? '' : 's'} left today. Try a team whose natures beat the enemy.` : 'No attempts left today. A new challenge arrives tomorrow.'),
      h('h3', 'Damage dealt'), this._statsTable());
    const actions = h('div.actions');
    const close = ui.modal(h('div', content, actions), { dismissable: false, wide: true, label: 'Daily challenge results' });
    const leave = (goTo) => { close(); this.close(goTo); };
    actions.append(btn('Back to the challenge', () => leave({ id: 'daily' }), won || !left ? 'primary' : 'ghost'));
    if (!won && left) actions.append(btn('👥 Team', () => leave({ id: 'team', params: { daily: true } })), btn('↻ Try again', () => {
      const r = startDailyAttempt(state, this.daily, B);
      if (!r.ok) { ui.toast(r.error, 'bad'); return; }
      game.commit('daily'); close(); this.round = 1; this.restart();
    }, 'primary'));
  }

  _results(won, result) {
    const { game, ui, node } = this; const { C, state } = game;
    const hard = this.hard;
    const next = C.nodes[node.globalIndex + 1];
    const nextOpen = next && !next.placeholder && (hard ? isHardNodeUnlocked(state, next, C) : isNodeUnlocked(state, next, C));
    const cl = this.sim.stats.clashes;
    const reasons = { defeated: 'Your team was defeated.', protectFailed: `${C.enemy[node.objective.protect]?.name || 'The escort'} fell.`, timeout: 'Time ran out.', retreat: 'You retreated.' };
    const content = h('div',
      h('div.result-hero', h('div.big.' + (won ? 'win' : 'lose'), won ? 'VICTORY' : 'DEFEAT'), h('div.muted', `${node.name} · ${this.sim.time.toFixed(1)}s`), !won ? h('p.small', reasons[this.sim.endReason] || '') : null),
      won ? h('div.reward-row',
        h('div.reward', `📜 +${fmt(result.scrolls)}`), h('div.reward', `🪙 +${fmt(result.ryo)}`),
        result.firstClear ? h('div.reward', '🏅 First clear') : h('div.reward', '↻ Replay')) : null,
      result.arcCleared ? h('div.warnbox.center', { style: { marginBottom: '10px' } }, `🎉 Arc cleared: ${C.arc[result.arcCleared].name}! Bonus included.`) : null,
      result.unlocked?.length ? h('div.warnbox.center', { style: { marginBottom: '10px' } }, '🆕 Now in the summon pools: ', h('b', result.unlocked.map(id => C.char[id].name).join(', '))) : null,
      h('h3', 'Damage dealt'), this._statsTable(),
      h('p.small', { style: { marginTop: '8px' } }, `Ultimates fired: ${this.sim.stats.ults} · Jutsu Clashes: ${cl.overpower} overpower, ${cl.standoff} standoff, ${cl.overwhelmed} overwhelmed · Effective hits: ${this.sim.stats.effective}`),
      !won ? h('p.small', '💡 Try a team whose natures beat the enemy (see the Team Builder rating), save Ultimates to clash the boss\'s ⚠ wind-ups, or replay earlier nodes for Ryo and level up.') : null,
    );
    const actions = h('div.actions');
    const close = ui.modal(h('div', content, actions), { dismissable: false, wide: true });
    const leave = (goTo) => { close(); this.close(goTo); };
    if (won && nextOpen) actions.append(btn('🗺️ Map', () => leave({ id: 'story', params: { arcId: next.arcId, nodeId: next.id, hard } }), 'ghost'), btn('↻ Replay', () => { close(); this.restart(); }), btn(`Next: ${next.name} ▶`, () => { close(); this.close(null, true); ui.startBattle({ node: next, hard }); }, 'primary'));
    else if (won) actions.append(btn('🗺️ Map', () => leave({ id: 'story', params: { arcId: node.arcId, nodeId: node.id, hard } }), 'ghost'), btn('↻ Replay', () => { close(); this.restart(); }, 'primary'));
    else actions.append(btn('🗺️ Map', () => leave({ id: 'story', params: { arcId: node.arcId, nodeId: node.id, hard } }), 'ghost'), btn('👥 Team', () => leave({ id: 'team', params: { nodeId: node.id, hard } })), btn('↻ Retry', () => { close(); this.restart(); }, 'primary'));
  }

  _rushResults(stopped = false) {
    const { game, ui } = this; const { state } = game;
    const cleared = stopped ? this.round : this.round - 1;
    const content = h('div',
      h('div.result-hero', h('div.big.' + (cleared > 0 ? 'win' : 'lose'), `ROUND ${cleared} CLEARED`), h('div.muted', `Best ever: round ${state.bossRush.highestRound || 0}`)),
      h('div.reward-row', h('div.reward', `📜 +${fmt(this.rushRewards.scrolls)}`), h('div.reward', `🪙 +${fmt(this.rushRewards.ryo)}`)),
      h('h3', 'Last round damage'), this._statsTable(),
    );
    const close = ui.modal(h('div', content, h('div.actions',
      btn('Leave', () => { close(); this.close({ id: 'rush' }); }, 'ghost'),
      btn('↻ New run', () => { close(); this.round = 1; this.rushRewards = { scrolls: 0, ryo: 0 }; this.ended = false; this._buildSim(); }, 'primary'))), { dismissable: false, wide: true });
  }

  restart() {
    this.ended = false; this.paused = false; this.pauseBtn.textContent = '⏸';
    this.effects = new Effects(this.renderer); this._buildSim();
    if (this.tutorial) {
      // A retried lesson coaches again from the start.
      this.tips = { shown: new Set() }; this.autoRevealed = false; this._syncAuto();
      this._tip(`lesson.${this.lessonType}.start`);
    }
  }

  /** Debug: defeat every enemy immediately. */
  debugWin() { for (const u of this.sim.units) if (u.side === 'enemy' && u.alive) { u.revived = true; u.hp = 0; } this.sim.pending = []; }

  close(goTo = null, silent = false) {
    cancelAnimationFrame(this.raf);
    document.removeEventListener('visibilitychange', this._onVis);
    document.removeEventListener('keydown', this._onKey);
    try { this.ro.disconnect(); } catch { /* ignore */ }
    this.root.classList.add('hidden');
    this.root.replaceChildren();
    if (!silent) this.ui.battleClosed(goTo);
    else this.ui.battle = null;
  }
}
