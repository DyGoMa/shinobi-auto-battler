// UIManager.js — screen routing, top bar, tab bar, modals, toasts.
import { h, fmt, btn } from './dom.js';
import * as Home from './HomeScreen.js';
import * as Story from './StoryMapScreen.js';
import * as Team from './TeamBuilderScreen.js';
import * as Roster from './RosterScreen.js';
import * as Summon from './SummonScreen.js';
import * as Rush from './BossRushScreen.js';
import * as Settings from './SettingsScreen.js';
import * as Tutorial from './TutorialScreen.js';
import * as Wiki from './WikiScreen.js';
import * as Achievements from './AchievementsScreen.js';
import * as Daily from './DailyScreen.js';
import * as Start from './StartScreen.js';
import { BattleScreen } from './BattleScreen.js';
import { tabBadges } from '../core/Badges.js';
import { skipBattle } from '../core/Skip.js';
import { hashString } from '../core/formulas.js';
import { showStoryResults } from './Results.js';
import { tutorialPending, skipTutorial, startTutorial, nextLessonIndex } from '../core/Tutorial.js';
import { tutorialRewardClaimed } from '../core/SaveManager.js';
import { claimableAchievements } from '../core/Achievements.js';
import { startDailyAttempt } from '../core/Daily.js';
import { playIntro, prefersReducedMotion } from './Intro.js';
import { introPlan } from '../core/StartFlow.js';

const TABS = [
  { id: 'home', label: 'Home', icon: '🏯', mod: Home },
  { id: 'story', label: 'Story', icon: '🗺️', mod: Story },
  { id: 'team', label: 'Team', icon: '👥', mod: Team },
  { id: 'roster', label: 'Roster', icon: '📖', mod: Roster },
  { id: 'summon', label: 'Summon', icon: '📜', mod: Summon },
  { id: 'wiki', label: 'Wiki', icon: '📚', mod: Wiki },
  { id: 'settings', label: 'Settings', icon: '⚙️', mod: Settings },
];
// Screens that are not tabs. `tab` = the tab highlighted while they are open.
const SCREENS = {
  ...Object.fromEntries(TABS.map(t => [t.id, { mod: t.mod, tab: t.id }])),
  tutorial: { mod: Tutorial, tab: 'home' },
  rush: { mod: Rush, tab: 'home' },
  achievements: { mod: Achievements, tab: 'home' },
  daily: { mod: Daily, tab: 'home' },
  start: { mod: Start, tab: null },   // the start menu (no tab bar while it is up)
};
// Screens the start menu can open before the player enters the game.
const START_SCREENS = ['start', 'wiki', 'settings'];

export class UIManager {
  constructor(game) {
    this.game = game;
    this.screenEl = document.getElementById('screen');
    this.tabbar = document.getElementById('tabbar');
    this.modalRoot = document.getElementById('modal-root');
    this.toastRoot = document.getElementById('toast-root');
    this.current = 'home';
    this.params = {};
    this.battle = null;
    // True until the player leaves the start menu (Continue, guest or Google): only
    // START_SCREENS are reachable, the tab bar is hidden, and a deep link waits.
    this.startPending = false;
    this._startTarget = null;
    this._held = false;
  }

  init() {
    for (const t of TABS) {
      const b = h('button.tab', { type: 'button', dataset: { tab: t.id }, onclick: () => { this.game.audio.click(); this.go(t.id); } },
        h('span.ti', { 'aria-hidden': 'true' }, t.icon), h('span.tl', t.label));
      this.tabbar.appendChild(b);
    }
    document.getElementById('brand').addEventListener('click', () => this.go('home'));
    document.getElementById('ach-btn').addEventListener('click', () => { this.game.audio.click(); this.go('achievements'); });
    const mute = document.getElementById('mute-btn');
    mute.addEventListener('click', () => {
      const s = this.game.state.settings; s.muted = !s.muted;
      this.game.audio.setMuted(s.muted); this.game.commit('mute'); this.refreshTop();
    });
    this.refreshTop();
    const fromHash = () => {
      const raw = decodeURIComponent((location.hash || '').replace('#', ''));
      if (raw.startsWith('wiki/')) return { id: 'wiki', params: { page: raw.slice(5) } };
      return SCREENS[raw] && raw !== 'tutorial' ? { id: raw, params: {} } : { id: 'home', params: {} };
    };
    // The start menu comes first; a deep link (#wiki/…) opens once the player enters the game.
    this.startPending = true;
    this._startTarget = fromHash();
    this.go('start');
    // Android back on the menu does nothing (the menu re-arms its history entry); on the intro it skips (Intro.js).
    window.addEventListener('popstate', () => { this._held = false; if (this.startPending && this.current === 'start') this._holdHistory(); });
    window.addEventListener('hashchange', () => {
      const t = fromHash();
      const now = this.current === 'wiki' ? `wiki/${this.params.page || 'home'}` : this.current;
      const want = t.id === 'wiki' ? `wiki/${t.params.page || 'home'}` : t.id;
      if (want !== now && !this.battle) this.go(t.id, t.params);
    });
  }

  /** Settings → Replay intro: the full splash and scene again. */
  playIntro() { return playIntro(introPlan({ full: true, reducedMotion: prefersReducedMotion() })); }

  go(id, params = {}) {
    if (!SCREENS[id]) id = 'home';
    if (this.startPending && !START_SCREENS.includes(id)) id = 'start';
    if (!this.startPending && id === 'start') id = 'home';
    this.current = id; this.params = params;
    document.body.classList.toggle('start-mode', this.startPending && id === 'start');
    document.body.classList.toggle('start-sub', this.startPending && id !== 'start');
    if (this.startPending && id === 'start') this._holdHistory();
    const hash = '#' + (id === 'wiki' && params.page && params.page !== 'home' ? `wiki/${params.page}` : id);
    try { if (location.hash !== hash) history.replaceState(null, '', hash); } catch { /* file:// */ }
    this.render(true);
    this.screenEl.scrollTop = 0;
  }

  /** Draw the current screen. `enter` plays the fade-in (navigation only, not refreshes). */
  render(enter = false) {
    const scr = SCREENS[this.current] || SCREENS.home;
    let el;
    try { el = scr.mod.render(this.game, this, this.params || {}); }
    catch (e) {
      console.error(e);
      el = h('div.screen', h('div.card', h('h2', 'Something went wrong'), h('p', 'This screen could not be shown. Your progress is safe.'), h('p.tiny.dim', String(e?.message || e)), btn('Back to Home', () => this.go('home'), 'primary')));
    }
    if (enter) el.classList.add('enter');
    this.screenEl.replaceChildren(el);
    // A screen can act once it is on the page (the Story map scrolls to the current battle).
    if (enter && scr.mod.afterRender) setTimeout(() => { if (this.screenEl.contains(el)) scr.mod.afterRender(el, this.game, this, this.params || {}); }, 0);
    for (const b of this.tabbar.children) {
      const on = b.dataset.tab === scr.tab;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    }
    this.refreshTop();
  }

  /** One extra history entry while the menu is up, so the back button stays on the menu. */
  _holdHistory() {
    if (this._held) return;
    this._held = true;
    try { history.pushState({ menu: true }, ''); } catch { /* file:// */ }
  }

  /** The start menu is done: show the game (a deep link, or Home) and the first-boot prompt. */
  enterGame() {
    this.startPending = false;
    document.body.classList.remove('start-mode', 'start-sub');
    const t = this._startTarget && !['start', 'home'].includes(this._startTarget.id) ? this._startTarget : { id: 'home', params: {} };
    this._startTarget = null;
    this.go(t.id, t.params);
    this.welcome();
  }

  /** Re-render the current screen (keeps scroll position). */
  refresh() { const y = this.screenEl.scrollTop; this.render(); this.screenEl.scrollTop = y; }

  refreshTop() {
    const s = this.game.state; if (!s) return;
    document.getElementById('cur-scrolls').textContent = fmt(s.currencies.scrolls);
    document.getElementById('cur-ryo').textContent = fmt(s.currencies.ryo);
    const mute = document.getElementById('mute-btn');
    mute.textContent = s.settings.muted ? '🔇' : '🔊';
    mute.setAttribute('aria-label', s.settings.muted ? 'Sound is off — turn it on' : 'Sound is on — mute');
    const ach = document.getElementById('ach-btn');
    const ready = claimableAchievements(s, this.game.C).length;
    ach.querySelector('.dot')?.remove();
    if (ready) ach.appendChild(h('span.dot', { 'aria-hidden': 'true' }));
    ach.setAttribute('aria-label', ready ? `Achievements: ${ready} reward${ready === 1 ? '' : 's'} to claim` : 'Achievements');
    ach.classList.toggle('active', this.current === 'achievements');
    // Red dots (js/core/Badges.js): Home = a reward to claim, today's Daily or a new Boss
    // Rush; Summon = a free summon (ticket). The tab's label says why, for screen readers.
    const badges = tabBadges(s, this.game.C, this.game.B);
    const why = { home: [badges.reasons.claimable && 'rewards to claim', badges.reasons.daily && 'Daily challenge waiting', badges.reasons.rushNew && 'Boss Rush open'].filter(Boolean).join(', '), summon: badges.reasons.freePull ? 'free summon available' : '' };
    for (const b of this.tabbar.children) {
      b.querySelector('.dot')?.remove();
      const id = b.dataset.tab;
      const label = TABS.find(t => t.id === id)?.label || id;
      if (badges[id]) { b.appendChild(h('span.dot', { 'aria-hidden': 'true' })); b.setAttribute('aria-label', `${label}: ${why[id]}`); }
      else b.removeAttribute('aria-label');
    }
  }

  // ------------------------------------------------------------- wiki
  /** Open a Wiki page. From another screen, the Wiki remembers it for its back button. */
  openWiki(page = 'home', { from = null, anchor = null } = {}) {
    const origin = from || (this.current === 'wiki' ? this.params.from : { id: this.current, params: this.params });
    this.go('wiki', { page, anchor, from: origin && origin.id !== 'wiki' ? origin : null });
  }

  // ------------------------------------------------------------- tutorial
  /** First boot of a new save: offer the tutorial (or let the player skip it). */
  welcome() {
    const { state, B } = this.game;
    if (state.tutorial.autoSkipped) {
      delete state.tutorial.autoSkipped;
      this.game.commit('tutorial');
      this.toast(`You've already passed the Survival Test, so the new tutorial is skipped. Its reward is yours: 📜 +${fmt(B.tutorial.rewards.scrolls)} 🪙 +${fmt(B.tutorial.rewards.ryo)}`, 'good');
      return;
    }
    if (state.tutorial.status !== 'new' || this._welcomeClose) return;
    const R = B.tutorial.rewards;
    const close = this.modal(h('div.center',
      h('div.big-emoji', { 'aria-hidden': 'true' }, '🍥'),
      h('h2', 'Welcome to the Hidden Leaf Village!'),
      h('p', 'Your ninja fight on their own. You choose the team, read the Nature Wheel and time the Ultimates.'),
      h('p', 'Three short practice battles at the Academy teach you the basics (about three minutes).'),
      tutorialRewardClaimed(state) ? h('p.small.muted', '✓ Rewards already claimed on this account: the lessons are practice only.')
        : h('p.small.muted', `Finish or skip it: either way you get 📜 ${fmt(R.scrolls)} scrolls and 🪙 ${fmt(R.ryo)} Ryo.`),
      h('div.actions', { style: { justifyContent: 'center' } },
        btn('Skip tutorial', () => { close(); this.skipTutorial({ confirm: false }); }, 'ghost'),
        btn('🎓 Start the tutorial', () => { close(); this.openTutorial(); }, 'primary big')),
    ), { onClose: () => { this._welcomeClose = null; } });
    this._welcomeClose = close;
  }

  /** The save was replaced (cloud save loaded, import, reset): re-check the welcome prompt. */
  onStateReplaced() {
    if (this._welcomeClose) this._welcomeClose();
    if (this.startPending) { this.refresh(); return; }   // still on the menu: it re-reads the save
    if (!this.battle) this.go('home');
    this.welcome();
  }

  /** Open the tutorial at the next lesson (or replay it from the start). */
  openTutorial({ replay = false } = {}) {
    const { state } = this.game;
    if (this._welcomeClose) this._welcomeClose();
    if (!replay && state.tutorial.status === 'new') { startTutorial(state); this.game.commit('tutorial'); }
    this.go('tutorial', { replay, lesson: replay ? 0 : nextLessonIndex(state) });
  }

  /** Skip the rest of the tutorial (same reward as finishing). */
  async skipTutorial({ confirm = true, after = null } = {}) {
    const { state, B } = this.game;
    if (confirm) {
      const ok = await this.confirm('Skip the tutorial?', tutorialRewardClaimed(state) ? 'This account already has the tutorial reward. You can replay the lessons any time from the Wiki or Settings.' : 'You still get the tutorial reward, and you can replay the lessons any time from the Wiki or Settings.', { okText: 'Skip tutorial', cancelText: 'Keep learning' });
      if (!ok) return false;
    }
    if (this._welcomeClose) this._welcomeClose();
    const reward = skipTutorial(state, B);
    this.game.commit('tutorial');
    if (reward) this.toast(`Tutorial skipped. Reward: 📜 +${fmt(reward.scrolls)} 🪙 +${fmt(reward.ryo)}`, 'good');
    else this.toast('Tutorial skipped. Rewards already claimed on this account.');
    if (after) after();
    else if (!this.battle) this.go('home');
    return true;
  }

  // ------------------------------------------------------------- modals
  modal(content, { wide = false, dismissable = true, onClose = null, label = null } = {}) {
    const veil = h('div.veil');
    const box = h('div.modal' + (wide ? '.wide' : ''), { role: 'dialog', 'aria-modal': 'true', 'aria-label': label || undefined }, content);
    veil.appendChild(box);
    const close = () => { veil.remove(); document.removeEventListener('keydown', onKey); if (onClose) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape' && dismissable) close(); };
    if (dismissable) veil.addEventListener('click', (e) => { if (e.target === veil) close(); });
    document.addEventListener('keydown', onKey);
    this.modalRoot.appendChild(veil);
    const focusable = box.querySelector('button, [href], input, textarea, select');
    if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 30);
    return close;
  }

  confirm(title, text, { okText = 'OK', cancelText = 'Cancel', danger = false } = {}) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => { if (done) return; done = true; close(); resolve(v); };
      const close = this.modal(h('div',
        h('h2', title), typeof text === 'string' ? h('p', text) : text,
        h('div.actions', btn(cancelText, () => finish(false), 'ghost'), btn(okText, () => finish(true), danger ? 'danger' : 'primary')),
      ), { onClose: () => finish(false) });
    });
  }

  /** Toast newly unlocked achievements (one line each, or a summary when there are many). */
  achievementsUnlocked(list, { summary = false } = {}) {
    if (!list.length) return;
    this.game.audio.achievement?.();
    const open = () => this.go('achievements');
    if (summary || list.length > 2) this.toast(`🏆 ${list.length} achievement${list.length === 1 ? '' : 's'} unlocked. Tap to claim the rewards.`, 'good', open);
    else for (const a of list) this.toast(`🏆 Achievement unlocked: ${a.name}. Tap to claim.`, 'good', open);
  }

  toast(text, kind = '', onclick = null) {
    const t = h(onclick ? 'button.toast' : 'div.toast', { role: 'status', type: onclick ? 'button' : null, onclick: onclick ? () => { t.remove(); onclick(); } : null }, text);
    if (kind) t.classList.add(kind);
    this.toastRoot.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, 3200);
    while (this.toastRoot.children.length > 4) this.toastRoot.firstChild.remove();
  }

  // ------------------------------------------------------------- battle
  /** opts: { node, hard? } for story, { node, tutorial: { index, replay } } for a lesson, { daily } or { bossRush: true } */
  startBattle(opts) {
    if (this.battle) return;
    // The tutorial runs before the Survival Test: gate the first story battle.
    const { C, state } = this.game;
    if (opts.node && !opts.node.tutorial && opts.node === C.nodes[0] && tutorialPending(state)) {
      const close = this.modal(h('div',
        h('h2', 'The tutorial comes first'),
        h('p', 'Three short lessons at the Academy teach team building, the Nature Wheel and Jutsu Clash before the Survival Test.'),
        h('div.actions',
          btn('Skip tutorial', () => { close(); this.skipTutorial({ after: () => this.startBattle(opts) }); }, 'ghost'),
          btn('🎓 Go to the tutorial', () => { close(); this.openTutorial(); }, 'primary'))));
      return;
    }
    // A Daily challenge battle spends one of the day's attempts when it starts.
    if (opts.daily) {
      const r = startDailyAttempt(state, opts.daily, this.game.B);
      if (!r.ok) { this.toast(r.error, 'bad'); return; }
      this.game.commit('daily');
    }
    this.battle = new BattleScreen(this.game, this, opts);
    this.battle.open();
  }
  /** ⏭ Skip a story or Hard battle already won: the real battle, headless, results at once. */
  skipBattle({ node, hard = false }) {
    if (this.battle || !node) return;
    const { game } = this; const { C, B, state } = game;
    const r = skipBattle(state, node, C, B, { hard, seed: (hashString(node.id) ^ Date.now()) >>> 0 });
    if (!r.ok) { this.toast(r.reason); return; }
    game.commit('battle');
    r.won ? game.audio.victory() : game.audio.defeat();
    this.refresh();
    showStoryResults(game, this, {
      node, hard, won: r.won, result: r.result, sim: r.sim, skipped: true,
      onMap: () => this.go('story', { arcId: node.arcId, nodeId: node.id, hard }),
      onTeam: () => this.go('team', { nodeId: node.id, hard }),
      onRetry: () => this.skipBattle({ node, hard }),
      onNext: (next) => this.startBattle({ node: next, hard }),
    });
  }

  battleClosed(goTo = null) {
    this.battle = null;
    if (goTo) this.go(goTo.id, goTo.params || {}); else this.refresh();
  }
}
