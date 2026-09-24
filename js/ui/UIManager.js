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
import { BattleScreen } from './BattleScreen.js';
import { canAfford } from '../core/GachaSystem.js';
import { isBossRushUnlocked } from '../core/Progression.js';
import { tutorialPending, skipTutorial, startTutorial, nextLessonIndex } from '../core/Tutorial.js';

const TABS = [
  { id: 'home', label: 'Home', icon: '🏯', mod: Home },
  { id: 'story', label: 'Story', icon: '🗺️', mod: Story },
  { id: 'team', label: 'Team', icon: '👥', mod: Team },
  { id: 'roster', label: 'Roster', icon: '📖', mod: Roster },
  { id: 'summon', label: 'Summon', icon: '📜', mod: Summon },
  { id: 'rush', label: 'Boss Rush', icon: '☁️', mod: Rush },
  { id: 'settings', label: 'Settings', icon: '⚙️', mod: Settings },
];
// Screens that are not tabs. `tab` = the tab highlighted while they are open.
const SCREENS = {
  ...Object.fromEntries(TABS.map(t => [t.id, { mod: t.mod, tab: t.id }])),
  tutorial: { mod: Tutorial, tab: 'home' },
};

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
  }

  init() {
    for (const t of TABS) {
      const b = h('button.tab', { type: 'button', dataset: { tab: t.id }, onclick: () => { this.game.audio.click(); this.go(t.id); } },
        h('span.ti', { 'aria-hidden': 'true' }, t.icon), h('span', t.label));
      this.tabbar.appendChild(b);
    }
    document.getElementById('brand').addEventListener('click', () => this.go('home'));
    const mute = document.getElementById('mute-btn');
    mute.addEventListener('click', () => {
      const s = this.game.state.settings; s.muted = !s.muted;
      this.game.audio.setMuted(s.muted); this.game.commit('mute'); this.refreshTop();
    });
    this.refreshTop();
    const hash = (location.hash || '').replace('#', '');
    this.go(SCREENS[hash] && hash !== 'tutorial' ? hash : 'home');
    window.addEventListener('hashchange', () => {
      const id = (location.hash || '').replace('#', '');
      if (SCREENS[id] && id !== this.current && !this.battle) this.go(id);
    });
    this.welcome();
  }

  go(id, params = {}) {
    if (!SCREENS[id]) id = 'home';
    this.current = id; this.params = params;
    try { if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id); } catch { /* file:// */ }
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
    for (const b of this.tabbar.children) {
      const on = b.dataset.tab === scr.tab;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    }
    this.refreshTop();
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
    for (const b of this.tabbar.children) {
      b.querySelector('.dot')?.remove();
      const id = b.dataset.tab;
      const show = (id === 'summon' && canAfford(s, 1, this.game.B)) || (id === 'rush' && isBossRushUnlocked(s, this.game.C) && !s.bossRush.runs);
      if (show) b.appendChild(h('span.dot', { 'aria-hidden': 'true' }));
    }
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
      h('p.small.muted', `Finish or skip it: either way you get 📜 ${fmt(R.scrolls)} scrolls and 🪙 ${fmt(R.ryo)} Ryo.`),
      h('div.actions', { style: { justifyContent: 'center' } },
        btn('Skip tutorial', () => { close(); this.skipTutorial({ confirm: false }); }, 'ghost'),
        btn('🎓 Start the tutorial', () => { close(); this.openTutorial(); }, 'primary big')),
    ), { onClose: () => { this._welcomeClose = null; } });
    this._welcomeClose = close;
  }

  /** The save was replaced (cloud save loaded, import, reset): re-check the welcome prompt. */
  onStateReplaced() {
    if (this._welcomeClose) this._welcomeClose();
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
      const ok = await this.confirm('Skip the tutorial?', 'You still get the tutorial reward, and you can replay the lessons any time from the Wiki or Settings.', { okText: 'Skip tutorial', cancelText: 'Keep learning' });
      if (!ok) return false;
    }
    if (this._welcomeClose) this._welcomeClose();
    const reward = skipTutorial(state, B);
    this.game.commit('tutorial');
    if (reward) this.toast(`Tutorial skipped. Reward: 📜 +${fmt(reward.scrolls)} 🪙 +${fmt(reward.ryo)}`, 'good');
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

  toast(text, kind = '') {
    const t = h('div.toast' + (kind ? '.' + kind : ''), { role: 'status' }, text);
    this.toastRoot.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, 3200);
    while (this.toastRoot.children.length > 4) this.toastRoot.firstChild.remove();
  }

  // ------------------------------------------------------------- battle
  /** opts: { node } for story, { node, tutorial: { index, replay } } for a lesson, or { bossRush: true } */
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
    this.battle = new BattleScreen(this.game, this, opts);
    this.battle.open();
  }
  battleClosed(goTo = null) {
    this.battle = null;
    if (goTo) this.go(goTo.id, goTo.params || {}); else this.refresh();
  }
}
