// BattleScreen.js — runs a BattleSim in real time: canvas, ult portraits,
// Jutsu Clash previews, pause/speed/auto, onboarding tips, results and the
// Boss Rush round loop. requestAnimationFrame with delta clamped to 50 ms;
// pauses automatically while the tab is hidden.
import { h, btn, fmt, avatar, objectiveText } from './dom.js';
import { BattleSim } from '../core/BattleSim.js';
import { Renderer } from '../render/Renderer.js';
import { Effects } from '../render/Effects.js';
import { nodeBattleConfig, completeNode, completeBossRushRound, bossRushRound, resolveTeam, buildTeamUnits, isNodeUnlocked } from '../core/Progression.js';
import { hashString } from '../core/formulas.js';

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
    this._onVis = this._onVis.bind(this);
    this._loop = this._loop.bind(this);
    this._onKey = this._onKey.bind(this);
  }

  // ---------------------------------------------------------------- setup
  open() {
    const { C } = this.game;
    this.isRush = !!this.opts.bossRush;
    this.node = this.opts.node || null;
    const theme = this.isRush ? { sky: ['#3b2a3f', '#b98a8a'], ground: '#5b3a3a', far: '#3a2430', accent: '#ff4d4d' } : C.arc[this.node.arcId].theme;

    this.objEl = h('div.obj');
    this.timerEl = h('div.timer', '0:00');
    this.speedBtn = h('button.icon-btn', { type: 'button', title: 'Battle speed', onclick: () => { this.speed = this.speed === 1 ? 2 : 1; this.speedBtn.textContent = `${this.speed}×`; } }, `${this.speed}×`);
    this.autoBtn = h('button.icon-btn', { type: 'button', title: 'Auto-fire Ultimates', onclick: () => { const s = this.game.state.settings; s.autoUlt = !s.autoUlt; this._syncAuto(); this.game.commit('settings'); } });
    this.pauseBtn = h('button.icon-btn', { type: 'button', title: 'Pause', onclick: () => this.togglePause() }, '⏸');
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
    if (this.node?.onboarding && !this.game.state.settings.onboardingDone) this._tip('start');
  }

  _syncAuto() { const on = !!this.game.state.settings.autoUlt; this.autoBtn.textContent = on ? '🤖' : '👆'; this.autoBtn.title = on ? 'Auto ults ON (tap to control them yourself)' : 'Auto ults OFF (you tap portraits)'; this.autoBtn.style.borderColor = on ? 'var(--accent)' : ''; }

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
    } else {
      cfg = nodeBattleConfig(state, this.node, C, B, { seed: this._seed() });
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
    } else {
      this.objEl.replaceChildren(h('div', this.node.name), h('div.sub', '🎯 ' + objectiveText(this.node.objective, C)));
    }
  }

  // ---------------------------------------------------------------- input
  _tapUlt(uid) {
    if (this.paused || this.ended) return;
    const res = this.sim.fireUlt(uid);
    if (res.ok) { this.game.audio.ultFire(); if (this.tips.shown.has('ult') && !this.tips.shown.has('ultDone')) { this.tips.shown.add('ultDone'); } }
    else {
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
      const veil = h('div.pause-veil', h('div.card.center', { style: { minWidth: '260px' } },
        h('h2', 'Paused'),
        h('p.small', 'Tip: when an enemy shows a ⚠ wind-up bar, tap a ready portrait to Jutsu Clash. The badge on each portrait predicts the result.'),
        h('div.col', btn('▶ Resume', () => this.togglePause(false), 'primary block'), btn(this.isRush ? '🏳️ End the run' : '🏳️ Retreat (counts as a loss)', () => this._forfeit(), 'danger block'))));
      this.stage.appendChild(veil);
    }
  }

  _forfeit() { this.paused = false; this.stage.querySelector('.pause-veil')?.remove(); this.sim.state = 'lost'; this.sim.endReason = 'retreat'; }

  // ---------------------------------------------------------------- loop
  _loop(ts) {
    this.raf = requestAnimationFrame(this._loop);
    const rawDt = Math.min(50, Math.max(0, ts - this.last)) / 1000; // clamp to 50 ms
    this.last = ts;
    const running = !this.paused && !this.hiddenPause && !this.tipPause && !this.ended;
    if (running) {
      if (this.game.state.settings.autoUlt) {
        const before = this.sim.stats.ults;
        this.sim.botUlts('smart'); // clash-aware: holds ults that would be Overwhelmed
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
    if (!this.isRush && surv && (this.node.objective.type === 'survive' || this.node.objective.type === 'protect')) {
      this.timerEl.textContent = `⏳ ${Math.max(0, Math.ceil(surv - t))}s`;
    } else {
      this.timerEl.textContent = `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    }
  }

  // ---------------------------------------------------------------- onboarding
  _tip(id) {
    if (this.tips.shown.has(id) || this.game.state.settings.onboardingDone || !this.node?.onboarding || this.ended) return;
    this.tips.shown.add(id);
    // One tip at a time: queue the rest until "Got it".
    if (this.tipPause) { (this.tips.queue ||= []).push(id); return; }
    this._showTip(id);
  }
  _showTip(id) {
    const text = {
      start: [h('b', 'Welcome to the Survival Test!'), ' Your ninja walk and fight on their own. ', h('b', 'Survive 45 seconds'), ' — or defeat Kakashi outright.'],
      ult: [h('b', 'Chakra full!'), ' A glowing portrait (below the battlefield) means that ninja\'s ', h('b', 'Ultimate'), ' is ready — tap it to fire. (Keys 1–4 work too.)'],
      clash: [h('b', 'Kakashi is winding up a jutsu'), ' (see the ⚠ bar). Fire an Ultimate ', h('b', 'now'), ' to ', h('b', 'JUTSU CLASH'), '. The badge on each portrait predicts it: ▲ your nature beats his (Lightning beats Earth), = standoff, ▼ weak.'],
    }[id];
    if (!text || this.ended) return;
    this.tipPause = true;
    const box = h('div.onboard', ...text, h('div.row', btn('Got it', () => {
      box.remove(); this.tipPause = false; this.last = performance.now();
      const next = this.tips.queue?.shift(); if (next) this._showTip(next);
    })));
    Object.assign(box.style, { left: '0', right: '0', margin: '0 auto', width: 'min(360px, 86vw)' });
    box.style.top = id === 'start' ? '12%' : '6%';
    this.stage.appendChild(box);
  }
  _clearTips() { this.stage.querySelectorAll('.onboard').forEach(el => el.remove()); this.tipPause = false; if (this.tips.queue) this.tips.queue.length = 0; }
  _tipsFromEvents(events) {
    if (!this.node?.onboarding || this.game.state.settings.onboardingDone) return;
    for (const e of events) {
      if (e.type === 'ultReady') this._tip('ult');
      if (e.type === 'telegraph' && this.tips.shown.has('ult')) this._tip('clash');
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
        this.rushRewards.scrolls += rw.scrolls; this.rushRewards.ryo += rw.ryo;
        game.commit('bossrush');
        game.audio.victory();
        this._intermission(rw);
        return;
      }
      this.ended = true;
      state.bossRush.runs = (state.bossRush.runs || 0) + 1;
      game.commit('bossrush');
      game.audio.defeat();
      setTimeout(() => this._rushResults(), 700);
      return;
    }
    this.ended = true;
    const firstNode = this.node.onboarding;
    const result = completeNode(state, this.node, won, C, B, { time: this.sim.time });
    if (firstNode) state.settings.onboardingDone = true;
    game.commit('battle');
    won ? game.audio.victory() : game.audio.defeat();
    setTimeout(() => this._results(won, result), 650);
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

  _results(won, result) {
    const { game, ui, node } = this; const { C, state } = game;
    const next = C.nodes[node.globalIndex + 1];
    const nextOpen = next && !next.placeholder && isNodeUnlocked(state, next, C);
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
    if (won && nextOpen) actions.append(btn('🗺️ Map', () => leave({ id: 'story', params: { arcId: next.arcId, nodeId: next.id } }), 'ghost'), btn('↻ Replay', () => { close(); this.restart(); }), btn(`Next: ${next.name} ▶`, () => { close(); this.close(null, true); ui.startBattle({ node: next }); }, 'primary'));
    else if (won) actions.append(btn('🗺️ Map', () => leave({ id: 'story', params: { arcId: node.arcId, nodeId: node.id } }), 'ghost'), btn('↻ Replay', () => { close(); this.restart(); }, 'primary'));
    else actions.append(btn('🗺️ Map', () => leave({ id: 'story', params: { arcId: node.arcId, nodeId: node.id } }), 'ghost'), btn('👥 Team', () => leave({ id: 'team', params: { nodeId: node.id } })), btn('↻ Retry', () => { close(); this.restart(); }, 'primary'));
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

  restart() { this.ended = false; this.paused = false; this.pauseBtn.textContent = '⏸'; this.effects = new Effects(this.renderer); this._buildSim(); }

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
