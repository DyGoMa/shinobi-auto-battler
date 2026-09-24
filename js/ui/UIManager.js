// UIManager.js — screen routing, top bar, tab bar, modals, toasts.
import { h, fmt, btn } from './dom.js';
import * as Home from './HomeScreen.js';
import * as Story from './StoryMapScreen.js';
import * as Team from './TeamBuilderScreen.js';
import * as Roster from './RosterScreen.js';
import * as Summon from './SummonScreen.js';
import * as Rush from './BossRushScreen.js';
import * as Settings from './SettingsScreen.js';
import { BattleScreen } from './BattleScreen.js';
import { canAfford } from '../core/GachaSystem.js';
import { isBossRushUnlocked } from '../core/Progression.js';

const TABS = [
  { id: 'home', label: 'Home', icon: '🏯', mod: Home },
  { id: 'story', label: 'Story', icon: '🗺️', mod: Story },
  { id: 'team', label: 'Team', icon: '👥', mod: Team },
  { id: 'roster', label: 'Roster', icon: '📖', mod: Roster },
  { id: 'summon', label: 'Summon', icon: '📜', mod: Summon },
  { id: 'rush', label: 'Boss Rush', icon: '☁️', mod: Rush },
  { id: 'settings', label: 'Settings', icon: '⚙️', mod: Settings },
];

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
        h('span.ti', t.icon), h('span', t.label));
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
    this.go(TABS.some(t => t.id === hash) ? hash : 'home');
    window.addEventListener('hashchange', () => {
      const id = (location.hash || '').replace('#', '');
      if (TABS.some(t => t.id === id) && id !== this.current && !this.battle) this.go(id);
    });
  }

  go(id, params = {}) {
    this.current = id; this.params = params;
    try { if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id); } catch { /* file:// */ }
    this.render();
    this.screenEl.scrollTop = 0;
  }

  render() {
    const tab = TABS.find(t => t.id === this.current) || TABS[0];
    let el;
    try { el = tab.mod.render(this.game, this, this.params || {}); }
    catch (e) {
      console.error(e);
      el = h('div.screen', h('div.card', h('h2', 'Something went wrong'), h('p', String(e?.message || e)), btn('Back to Home', () => this.go('home'), 'primary')));
    }
    this.screenEl.replaceChildren(el);
    for (const b of this.tabbar.children) b.classList.toggle('active', b.dataset.tab === tab.id);
    this.refreshTop();
  }

  /** Re-render the current screen (keeps scroll position). */
  refresh() { const y = this.screenEl.scrollTop; this.render(); this.screenEl.scrollTop = y; }

  refreshTop() {
    const s = this.game.state; if (!s) return;
    document.getElementById('cur-scrolls').textContent = fmt(s.currencies.scrolls);
    document.getElementById('cur-ryo').textContent = fmt(s.currencies.ryo);
    document.getElementById('mute-btn').textContent = s.settings.muted ? '🔇' : '🔊';
    for (const b of this.tabbar.children) {
      b.querySelector('.dot')?.remove();
      const id = b.dataset.tab;
      const show = (id === 'summon' && canAfford(s, 1, this.game.B)) || (id === 'rush' && isBossRushUnlocked(s, this.game.C) && !s.bossRush.runs);
      if (show) b.appendChild(h('span.dot'));
    }
  }

  // ------------------------------------------------------------- modals
  modal(content, { wide = false, dismissable = true, onClose = null } = {}) {
    const veil = h('div.veil');
    const box = h('div.modal' + (wide ? '.wide' : ''), { role: 'dialog', 'aria-modal': 'true' }, content);
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
    const t = h('div.toast' + (kind ? '.' + kind : ''), text);
    this.toastRoot.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, 2600);
    while (this.toastRoot.children.length > 4) this.toastRoot.firstChild.remove();
  }

  // ------------------------------------------------------------- battle
  /** opts: { node } for story, or { bossRush: true } */
  startBattle(opts) {
    if (this.battle) return;
    this.battle = new BattleScreen(this.game, this, opts);
    this.battle.open();
  }
  battleClosed(goTo = null) {
    this.battle = null;
    if (goTo) this.go(goTo.id, goTo.params || {}); else this.refresh();
  }
}
