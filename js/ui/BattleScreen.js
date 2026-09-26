// BattleScreen.js — runs a BattleSim in real time: canvas, ult portraits,
// Jutsu Clash previews, pause/speed/auto, onboarding tips, results and the
// Boss Rush round loop. requestAnimationFrame with delta clamped to 50 ms;
// pauses automatically while the tab is hidden.
import { h, btn, fmt, avatar, objectiveText } from './dom.js';
import { BattleSim } from '../core/BattleSim.js';
import { Renderer } from '../render/Renderer.js';
import { Effects } from '../render/Effects.js';
import { nodeBattleConfig, completeNode, completeBossRushRound, bossRushRound, resolveTeam, buildTeamUnits, isNodeCleared } from '../core/Progression.js';
import { NATURE } from '../render/Effects.js';
import { battleTrack } from '../audio/Music.js';
import { icon } from '../render/icons.js';
import { stageDefFor } from '../render/Stage.js';
import * as Assets from '../render/Assets.js';
import { prefersReducedMotion } from './Intro.js';
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
import { showStoryResults, statsTable } from './Results.js';

const CLASH_LABEL = { overpower: '▲ OVERPOWER', standoff: '= STANDOFF', overwhelmed: '▼ WEAK' };

export class BattleScreen {
  constructor(game, ui, opts) {
    this.game = game; this.ui = ui; this.opts = opts;
    this.root = document.getElementById('battle');
    this.paused = false; this.hiddenPause = false; this.tipPause = false;
    const speeds = game.B.qol.battleSpeeds;
    this.speed = speeds.includes(game.state.settings.speed) ? game.state.settings.speed : speeds[0];
    this.raf = 0; this.last = 0; this.portraitT = 0;
    this.ended = false;
    this.round = 1; this.rushRewards = { scrolls: 0, ryo: 0 };
    this.tips = { shown: new Set() };
    // Tutorial lesson battles: { index, replay }. Their coach tips always show.
    this.tutorial = opts.tutorial || null;
    this.lessonType = this.tutorial ? opts.node?.lesson : null;
    this.autoRevealed = !this.tutorial;
    // Slow motion (a clash, a hit-stop) scales the sim's time for a few wall-clock ms; the
    // boss intro pauses the sim while its cards play; timers here are cleared on close.
    this.timeScale = 1; this.slowUntil = 0; this.introPause = false; this.introSeen = false; this._timers = [];
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
    // The arc's drawn stage (js/render/Stage.js), the era's outfits, and the effect settings.
    const stage = stageDefFor({ node: this.node, arcId: this.node?.arcId, rush: this.isRush }, theme);
    this.era = this.isRush ? 'p2' : Assets.eraOfPart(this.node?.part || 1);
    this.reduced = prefersReducedMotion();
    const vfx = this.game.state.settings.vfx;
    this.level = this.reduced ? 'low' : (['low', 'medium', 'high'].includes(vfx) ? vfx : 'medium');

    this.objEl = h('div.obj');
    this.timerEl = h('div.timer', { 'aria-label': 'Battle time' }, '0:00');
    // The speed button cycles 1× → 2× → 5× (balance.qol.battleSpeeds); the pick is saved (and syncs) for the next battle.
    this.speedBtn = h('button.icon-btn.speed-btn', { type: 'button', onclick: () => this._cycleSpeed() }, `${this.speed}×`);
    this._labelSpeed();
    this.autoBtn = h('button.icon-btn', { type: 'button', onclick: () => { const s = this.game.state.settings; s.autoUlt = !s.autoUlt; this._syncAuto(); this.game.commit('settings'); } });
    this.pauseBtn = h('button.icon-btn', { type: 'button', 'aria-label': 'Pause', title: 'Pause', onclick: () => this.togglePause() }, icon('pause'));
    const hud = h('div.bhud', this.objEl, this.timerEl, this.autoBtn, this.speedBtn, this.pauseBtn);
    this.canvas = h('canvas', { 'aria-label': 'Battlefield' });
    // The DOM overlays over the canvas (css/style.css "Battle chrome"): the Ultimate cut-in,
    // the clash readout, the boss intro pieces and the victory/defeat card. None takes taps.
    this.overlay = h('div.overlay', { 'aria-hidden': 'true' },
      this.nameCardEl = h('div.namecard', this.ncSlot = h('div.avatar'), h('div.txt', this.ncWho = h('div.who'), this.ncWhat = h('div.what'))),
      this.readoutEl = h('div.readout', this.roL1 = h('div.l1'), this.roL2 = h('div.l2')),
      this.barsEl = h('div.bars'), this.speedEl = h('div.speedlines'),
      this.bossCardEl = h('div.bosscard', this.bcSlot = h('div.avatar'), h('div.txt', this.bcTag = h('div.tag'), this.bcName = h('div.name'), this.bcTitle = h('div.title'))),
      this.endEl = h('div.endcard', this.endBig = h('div.big')));
    this.stage = h('div.stage', this.canvas, this.overlay);
    this.stage.addEventListener('pointerdown', (e) => { if (this.introPause && !e.target.closest('button')) this._skipIntro(); });
    this.ultbar = h('div.ultbar');
    this.info = h('div.binfo');
    this.root.replaceChildren(hud, this.stage, this.info, this.ultbar);
    this.root.classList.remove('hidden');
    this._syncAuto();

    this.renderer = new Renderer(this.canvas);
    this.renderer.setup({ stage, theme, C, era: this.era, level: this.level, reduced: this.reduced });
    this.effects = new Effects(this.renderer, { level: this.level, reduced: this.reduced });
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

  _cycleSpeed() {
    const speeds = this.game.B.qol.battleSpeeds;
    this.speed = speeds[(speeds.indexOf(this.speed) + 1) % speeds.length];
    this.speedBtn.textContent = `${this.speed}×`;
    this.game.audio.setSpeed(this.speed);
    this._labelSpeed();
    this.game.state.settings.speed = this.speed;
    this.game.commit('settings');
  }
  _labelSpeed() {
    const l = `Battle speed ${this.speed}×. Tap for ${this.game.B.qol.battleSpeeds.map(v => v + '×').join(' / ')}.`;
    this.speedBtn.title = l; this.speedBtn.setAttribute('aria-label', l);
  }

  /** Auto-ult is hidden in the tutorial until Lesson 3 introduces it. */
  _autoOn() { return this.autoRevealed && !!this.game.state.settings.autoUlt; }
  _syncAuto() {
    const on = this._autoOn();
    this.autoBtn.classList.toggle('hidden', !this.autoRevealed);
    this.autoBtn.replaceChildren(icon(on ? 'auto' : 'tap'));
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
    this.renderer.reset();
    this.effects = new Effects(this.renderer, { level: this.level, reduced: this.reduced });
    this.endEl.classList.remove('show');
    // The battle's portraits and sprites, if any exist (a missing file leaves the code-drawn art).
    Assets.preload(Assets.pathsFor(this.sim.units.map(u => u.key), this.era));
    this._buildPortraits();
    this._updateObjective();
    this._buildInfo();
    this._music();
    this._intro();
  }

  // ---------------------------------------------------------------- music (docs/AUDIO_PLAN.md §5)
  /** The loop this fight starts with: calm or tense by boss and part, the Academy for lessons, the Akatsuki loop for the rush. */
  _music() {
    const boss = this.sim.units.some(u => u.side === 'enemy' && u.isBoss);
    const t = battleTrack({ kind: this.tutorial ? 'lesson' : this.isRush ? 'rush' : this.daily ? 'daily' : 'story', part: this.era === 'p2' ? 2 : 1, boss, hard: this.hard });
    if (this.isRush && this.round < 3) t.layers = t.layers.filter(l => l !== 'kit');   // the kit joins from round 3
    this.game.audio.setSpeed(this.speed);
    this.game.audio.playMusic(t.id, { layers: t.layers });
    this._bossTheme = false;
  }
  /** The boss under 40 % or enraged: the relentless theme (a choir for the great names). */
  _bossMusic() {
    if (this._bossTheme) return; this._bossTheme = true;
    const boss = this.sim.units.find(x => x.side === 'enemy' && x.isBoss);
    const great = boss && /kage|hokage|madara|kaguya|pain|nagato|obito|itachi|orochimaru|nine_tails|ten_tails/i.test(boss.key);
    this.game.audio.playMusic('boss', { layers: ['brass', ...(great ? ['choir'] : [])] });
  }
  /** The end: the loop stops, the stinger plays, the village comes back under the results. */
  _endMusic(won) {
    const a = this.game.audio; a.stopMusic(0.4);
    if (won) a.victory(); else if (this.sim.endReason === 'retreat') a.stinger('retreat'); else a.defeat();
    this._later(2.8, () => { if (this.ended && this.ui.battle === this) a.playMusic(this.ui.storyEra() === 'p2' ? 'village2' : 'village'); });
  }
  /** A short duck under a cut-in or a clash (counted, so closing the battle releases what is still held). */
  _duckFor(seconds) { this._ducks = (this._ducks || 0) + 1; this.game.audio.duckMusic(true); this._later(seconds, () => { if (this._ducks > 0) { this._ducks--; this.game.audio.duckMusic(false); } }); }
  _releaseDucks() {
    const a = this.game.audio;
    while ((this._ducks || 0) > 0) { this._ducks--; a.duckMusic(false); }
    if (this._duckPause) { this._duckPause = false; a.duckMusic(false); }
    if (this._duckTip) { this._duckTip = false; a.duckMusic(false); }
  }

  // ---------------------------------------------------------------- overlays and the boss intro
  _later(seconds, fn) { const id = setTimeout(fn, seconds * 1000); this._timers.push(id); return id; }
  _clearTimers() { for (const id of this._timers) clearTimeout(id); this._timers = []; }
  /** Replay a CSS overlay animation; under reduced motion the element simply shows for `hold` seconds. */
  _show(el, hold = 1.2) { el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); if (this.reduced) this._later(hold, () => el.classList.remove('show')); }
  /** Slow motion for a few wall-clock ms (a clash, a hit-stop); off under reduced motion and Low. */
  _slow(scale, wallSeconds) { if (this.reduced || this.level === 'low') return; this.timeScale = scale; this.slowUntil = performance.now() + wallSeconds * 1000; }
  _nameCard(def, who, what) {
    const a = def ? avatar(def, { size: 'lg', era: this.era }) : h('div.avatar', h('span.q', '?'));
    this.nameCardEl.replaceChild(a, this.ncSlot); this.ncSlot = a;
    this.ncWho.textContent = who; this.ncWhat.textContent = what;
    this._show(this.nameCardEl, 1.1);
  }
  _readout(l1, l2, cls = '') { this.readoutEl.className = 'readout ' + cls; this.roL1.textContent = l1; this.roL2.textContent = l2; this._show(this.readoutEl, 1.6); }
  /** The DOM readouts and the camera, from the sim's events (the canvas effects are js/render/Effects.js). */
  _overlays(events) {
    const { C } = this.game;
    for (const e of events) {
      const u = e.uid != null ? this.sim.unit(e.uid) : null;
      switch (e.type) {
        case 'ult': if (u) this._nameCard(C.char[u.key] || null, u.name, e.name); break;
        case 'clash': {
          const label = { overpower: 'OVERPOWER!', standoff: 'STANDOFF', overwhelmed: 'OVERWHELMED' }[e.outcome];
          this._readout('JUTSU CLASH', label, e.outcome);
          this._slow(0.35, 0.5);
          if (!this.reduced) { this.renderer.camPush(1.08, 0); this._later(0.8, () => { if (!this.introPause) this.renderer.camPush(1, 0); }); }
          break;
        }
        case 'damage': if ((e.kind === 'ult' || e.kind === 'special') && !this.slowUntil) this._slow(0, 0.07); break;   // hit-stop
        default: break;
      }
    }
  }
  /** The boss intro (docs/ART_BIBLE.md §9.3): bars, a push-in with speed lines, the boss card with its
   *  epithet, its bar filling, then FIGHT!. About 2 s; 1.2 s when the battle has been played before; a tap skips it. */
  _intro() {
    this._clearTimers();
    const boss = this.sim.units.find(u => u.side === 'enemy' && u.isBoss);
    if (!boss) return;
    const { C, state } = this.game;
    const def = C.enemy[boss.key] || null;
    const quick = this.introSeen || !!(this.node && !this.isRush && !this.daily && isNodeCleared(state, this.node.id));
    this.introSeen = true;
    this.introPause = true;
    const v = this.renderer._vis(boss); v.hidden = true; v.hpReveal = 0;
    this.barsEl.classList.add('in');
    if (!this.reduced) { this._show(this.speedEl, 0.9); this.renderer.camPush(1.07, 120); }
    const T = quick ? 0.6 : 1;
    this._later(0.3 * T, () => {
      if (!this.introPause) return;
      v.hidden = false;
      this.effects.smoke(boss.x, this.renderer.unitY(boss) - 30, 12, '#dfe7ec', 0.6);
      this.effects.ring(boss.x, this.renderer.chestOf(boss).y, (NATURE[boss.activeNature] || NATURE.None).color, { r1: 160, width: 8, dur: 0.6 });
      this.effects.shake(6, 0.3);
      const a = def ? avatar(def, { size: 'xl', facing: -1, era: this.era, ring: 'boss', expression: 'menace' }) : h('div.avatar');
      this.bossCardEl.replaceChild(a, this.bcSlot); this.bcSlot = a;
      this.bcTag.textContent = this.isRush ? `BOSS RUSH · ROUND ${this.round}` : this.daily ? 'DAILY BOSS' : this.hard ? 'HARD MODE BOSS' : 'BOSS';
      this.bcName.textContent = boss.name; this.bcTitle.textContent = def?.title || '';
      this.bossCardEl.classList.toggle('quick', quick);
      this._show(this.bossCardEl, quick ? 0.9 : 1.6);
      this.game.audio.stinger('bossIntro');
      const fill = (k) => { if (!this.introPause) return; v.hpReveal = k; if (k < 1) this._later(0.03, () => fill(Math.min(1, k + 0.05))); else v.hpReveal = null; };
      fill(0);
    });
    this._later(quick ? 1.2 : 2.1, () => this._introEnd(boss));
  }
  _introEnd(boss) {
    if (!this.introPause) return;
    this.introPause = false; this.last = performance.now();
    this.barsEl.classList.remove('in');
    this.renderer.camPush(1, 0);
    const v = this.renderer._vis(boss); v.hidden = false; v.hpReveal = null;
    this._readout((this.node?.name || 'Boss Rush').toUpperCase(), 'FIGHT!', 'fight');
    this.effects.flash('#ffffff', 0.35, 0.15);
    this.game.audio.cue('fight');
  }
  _skipIntro() { const boss = this.sim.units.find(u => u.side === 'enemy' && u.isBoss); this._clearTimers(); if (boss) this._introEnd(boss); else this.introPause = false; }
  /** The victory or defeat card over the stage, before the results dialog. */
  _endBeat(won) {
    this.endEl.className = 'endcard ' + (won ? 'win' : 'lose'); this.endBig.textContent = won ? 'VICTORY' : 'DEFEAT';
    this._show(this.endEl, 1.3);
    if (won) { this.effects.flash('#fff6d8', 0.4, 0.3); if (!this.reduced) this.renderer.camPush(1.06, 0); }
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
    this.pauseBtn.replaceChildren(icon(this.paused ? 'play' : 'pause'));
    if (this.paused !== !!this._duckPause) { this._duckPause = this.paused; this.game.audio.duckMusic(this.paused); }
    const pl = this.paused ? 'Resume' : 'Pause'; this.pauseBtn.title = pl; this.pauseBtn.setAttribute('aria-label', pl);
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

  _forfeit() { this.paused = false; if (this._duckPause) { this._duckPause = false; this.game.audio.duckMusic(false); } this.stage.querySelector('.pause-veil')?.remove(); this.sim.state = 'lost'; this.sim.endReason = 'retreat'; }

  // ---------------------------------------------------------------- loop
  _loop(ts) {
    this.raf = requestAnimationFrame(this._loop);
    const rawDt = Math.min(50, Math.max(0, ts - this.last)) / 1000; // clamp to 50 ms
    this.last = ts;
    if (this.slowUntil && performance.now() > this.slowUntil) { this.timeScale = 1; this.slowUntil = 0; }
    // The stage, the effects and the cards keep moving through the intro and after the end;
    // the sim itself steps only while the battle is on (not paused, not behind a tip or the intro).
    const animating = !this.paused && !this.hiddenPause;
    const running = animating && !this.tipPause && !this.introPause && !this.ended;
    const dt = running ? rawDt * this.speed * this.timeScale : animating ? rawDt : 0;
    if (running) {
      if (this._autoOn()) {
        const before = this.sim.stats.ults;
        // Default 'smart' = clash-aware: fires counter-nature ninja into wind-ups and
        // holds ults that would be Overwhelmed (Settings → Auto-ult mode).
        this.sim.botUlts(this.game.state.settings.autoUltMode === 'asap' ? 'asap' : 'smart');
        void before;
      }
      this.sim.step(dt);
      const events = this.sim.drainEvents();
      this.effects.onEvents(events, this.sim);
      this._overlays(events);
      this._sounds(events);
      this._tipsFromEvents(events);
    }
    this.effects.update(dt);
    try { this.renderer.draw(this.sim, this.effects, dt, { dim: this.dim || 0 }); } catch (e) { console.error('[render]', e); }
    this.portraitT -= rawDt;
    if (this.portraitT <= 0) { this.portraitT = 0.08; this._updatePortraits(); this._updateTimer(); }
    if (!this.ended && this.sim.state !== 'running') this._onEnd();
  }

  /** The sound of every sim event (docs/AUDIO_PLAN.md §6): the nature's cast and impact, the signature techniques by name, the mechanics, the KOs. */
  _sounds(events) {
    const a = this.game.audio;
    for (const e of events) {
      const u = e.uid != null ? this.sim.unit(e.uid) : null;
      switch (e.type) {
        case 'damage': {
          const src = this.sim.unit(e.src);
          const nature = e.nature || src?.activeNature || null;
          const power = e.kind === 'ult' ? 1.5 : e.kind === 'special' ? 1.1 : e.crit ? 0.9 : 0.5;
          const name = e.kind === 'ult' ? this._lastUltName : e.kind === 'special' ? this._lastSpecialName : null;
          a.impact(nature, power, name);
          if (e.relation > 0) a.effective(); else if (e.relation < 0) a.resisted(); else if (e.crit) a.crit();
          if (u?.isBoss && u.alive && u.hp / u.maxHp < 0.4) this._bossMusic();
          break;
        }
        case 'ultReady': a.ultReady(); break;
        case 'ult': this._lastUltName = e.name; a.ultFire(e.nature, e.name); this._duckFor(1.1); break;
        case 'clash': a.clash(e.outcome); this._duckFor(1.6); break;
        case 'telegraph': this._lastSpecialName = e.name; a.telegraph(e.nature, e.name, e.windup, !!e.special); break;
        case 'jutsuLand': a.impact(e.nature, 1.1, e.name); break;
        case 'death':
          if (!u) break;
          a.ko(u.isBoss ? 'boss' : u.protected ? 'escort' : u.side === 'player' ? 'ally' : 'enemy');
          if (u.side === 'player' && this.sim.units.filter(x => x.side === 'player' && x.alive && !x.protected).length <= 1) a.setLayer('lead', false);
          break;
        case 'heal': a.mechanic('heal'); break;
        case 'enrage': a.mechanic('enrage'); this._bossMusic(); break;
        case 'shield': case 'shieldBreak': case 'revive': case 'swap': case 'summon': case 'rally': case 'stun': case 'immune': case 'reflectWarn': case 'reflect': case 'buff':
          a.mechanic(e.type); break;
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
      const left = Math.max(0, Math.ceil(surv - t));
      this.timerEl.textContent = `⏳ ${left}s`;
      if (left <= 5 && left > 0 && !this.ended) this.game.audio.cue('timerTick');
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
    if (!this._duckTip) { this._duckTip = true; this.game.audio.duckMusic(true); this.game.audio.ui('paper'); }
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
    if (this._duckTip) { this._duckTip = false; this.game.audio.duckMusic(false); }
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
        return { top: '12%', body: [b(`Welcome to ${this.node.name}!`), ' Your ninja walk and fight on their own. Goal: ', b(objectiveText(this.node.objective, C)), '. The 1× button (top right) speeds the battle up.'] };
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
        game.audio.stinger('roundClear');
        this._intermission(rw);
        return;
      }
      this.ended = true;
      state.bossRush.runs = (state.bossRush.runs || 0) + 1;
      recordBattle(state, { won: false, mode: 'rush', sim: this.sim }, B);
      game.commit('bossrush');
      this._endMusic(false);
      this._endBeat(false);
      this._later(1.3, () => this._rushResults());
      return;
    }
    this.ended = true;
    if (this.tutorial) {
      // Lesson battles pay nothing themselves: the tutorial reward is paid once, when
      // the last lesson is won (or the tutorial is skipped).
      const res = won ? completeLesson(state, this.tutorial.index, C, B, { replay: this.tutorial.replay }) : null;
      game.commit('tutorial');
      this._endMusic(won);
      this._endBeat(won);
      this._later(1.3, () => this._tutorialResults(won, res));
      return;
    }
    if (this.daily) { this._dailyEnd(won); return; }
    const result = completeNode(state, this.node, won, C, B, { time: this.sim.time }, { hard: this.hard });
    recordBattle(state, { won, mode: this.hard ? 'hard' : 'story', sim: this.sim, matchup: this.matchup }, B);
    game.commit('battle');
    this._endMusic(won);
    this._endBeat(won);
    this._later(1.3, () => this._results(won, result));
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
      finished && !res.reward ? h('p.center.muted', '✓ Rewards already claimed on this account.') : null,
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

  _statsTable() { return statsTable(this.sim); }

  /** A daily battle ended. Boss gauntlet dailies go round by round, carrying HP and chakra. */
  _dailyEnd(won) {
    const { game } = this; const { C, B, state } = game;
    recordBattle(state, { won, mode: 'daily', sim: this.sim, matchup: this.matchup }, B);
    if (won && this.round < this.daily.rounds.length) {
      game.commit('daily');
      game.audio.stinger('roundClear');
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
    this._endMusic(won);
    this._endBeat(won);
    this._later(1.3, () => this._dailyResults(won, reward));
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
    const { ui, node, hard } = this;
    showStoryResults(this.game, ui, {
      node, hard, won, result, sim: this.sim,
      onMap: () => this.close({ id: 'story', params: { arcId: node.arcId, nodeId: node.id, hard } }),
      onTeam: () => this.close({ id: 'team', params: { nodeId: node.id, hard } }),
      onRetry: () => this.restart(),
      onNext: (next) => { this.close(null, true); ui.startBattle({ node: next, hard }); },
    });
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
    this.ended = false; this.paused = false; this.pauseBtn.replaceChildren(icon('pause'));
    this.timeScale = 1; this.slowUntil = 0; this.introPause = false;
    this._clearTimers(); this._releaseDucks();
    this._buildSim();
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
    this._clearTimers();
    this._releaseDucks();
    document.removeEventListener('visibilitychange', this._onVis);
    document.removeEventListener('keydown', this._onKey);
    try { this.ro.disconnect(); } catch { /* ignore */ }
    this.root.classList.add('hidden');
    this.root.replaceChildren();
    if (!silent) this.ui.battleClosed(goTo);
    else this.ui.battle = null;
  }
}
