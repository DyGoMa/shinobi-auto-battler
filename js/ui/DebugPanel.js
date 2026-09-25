// DebugPanel.js — only with ?debug=1. Live-edit every balance.js value, export
// it, +10,000 scrolls, instant win, jump to node, simulate 100 battles.
import { h, btn, fmt } from './dom.js';
import { BattleSim } from '../core/BattleSim.js';
import { nodeBattleConfig, resolveTeam } from '../core/Progression.js';

export class DebugPanel {
  constructor(game, ui) { this.game = game; this.ui = ui; this.panel = null; }

  mount() {
    const fab = h('button.btn.small#debug-fab', { type: 'button', onclick: () => this.toggle() }, '🛠 Debug');
    document.body.appendChild(fab);
  }

  toggle() { if (this.panel) { this.panel.remove(); this.panel = null; } else this.open(); }

  open() {
    const { game, ui } = this; const { C, B } = game;
    const nodeSel = h('select', { 'aria-label': 'Node' }, ...C.nodes.map(n => h('option', { value: n.id }, `${n.globalIndex + 1}. ${C.arc[n.arcId].name} — ${n.name}`)));
    const out = h('div.small.muted', { style: { margin: '6px 0 10px', whiteSpace: 'pre-wrap' } });
    const tools = h('div.tools',
      btn('+10,000 scrolls', () => { game.state.currencies.scrolls += 10000; game.commit('debug'); ui.refresh(); ui.toast('+10,000 scrolls'); }, 'small'),
      btn('+100,000 Ryo', () => { game.state.currencies.ryo += 100000; game.commit('debug'); ui.refresh(); ui.toast('+100,000 Ryo'); }, 'small'),
      btn('Instant win', () => { if (ui.battle) { ui.battle.debugWin(); ui.toast('Enemies defeated.'); } else ui.toast('Start a battle first.'); }, 'small'),
      btn('Jump to node', () => this.jump(nodeSel.value), 'small'),
      btn('Simulate 100 battles', () => this.simulate(nodeSel.value, out), 'small'),
      btn('Export balance.js', () => this.export(), 'small'),
    );
    // The install suggestions (0.11.2): fake the device and the reminder timers without waiting days.
    const inst = game.install;
    const nudgeOut = h('div.tiny.muted', { style: { margin: '4px 0 8px', whiteSpace: 'pre-wrap' } });
    const when = (t) => (t ? new Date(t).toLocaleString() : '—');
    const showNudge = () => {
      const n = inst.nudge, p = inst.prompts(), f = inst.flags();
      nudgeOut.textContent = `phone ${f.phone}${inst.debugPhone ? ' (pretend)' : ''} · standalone ${f.standalone} · plan ${inst.plan()}\npopup shown ${when(n.popupAt)} · dismissals ${n.dismissals.length} (last ${when(n.dismissals[n.dismissals.length - 1])}) · installed ${n.installedAt ? 'yes' : 'no'}\nnow: notice ${p.notice} · popup ${p.popup} · banner ${p.banner}`;
    };
    const installTools = h('div.tools',
      btn('Pretend phone', () => { inst.debugPhone = !inst.debugPhone; ui.toast(inst.debugPhone ? 'Install nudges: pretending this is a phone.' : 'Install nudges: real device flags.'); showNudge(); ui.refresh(); }, 'small'),
      btn('Rewind 3 days', () => { inst.debug.rewind(3); showNudge(); ui.toast('Install timers moved back 3 days.'); }, 'small'),
      btn('Rewind 7 days', () => { inst.debug.rewind(7); showNudge(); ui.toast('Install timers moved back 7 days.'); }, 'small'),
      btn('Relaunch check', () => { inst.debug.relaunch(); showNudge(); ui.toast('Banner re-evaluated as at a launch.'); }, 'small'),
      btn('Reset install state', () => { inst.debug.reset(); showNudge(); ui.refresh(); ui.toast('Install nudge state cleared: the popup is due again on Home.'); }, 'small'),
    );
    showNudge();
    const tree = h('div');
    this.buildTree(tree, B, 'BALANCE');
    this.panel = h('div.debug-panel',
      h('header', h('b', '🛠 Debug — balance.js (live)'), h('div.grow'), btn('✕', () => this.toggle(), 'small ghost')),
      h('div.body',
        h('div.small', 'Node for jump / simulate:'), nodeSel, h('div', { style: { height: '8px' } }),
        tools, out,
        h('div.small', 'Install nudges (0.11.2):'), installTools, nudgeOut,
        h('p.tiny.dim', 'Edits apply immediately (next battle / next calculation). They are NOT saved — use Export and paste the result into js/config/balance.js.'),
        tree));
    document.body.appendChild(this.panel);
  }

  buildTree(parent, obj, path) {
    for (const [k, v] of Object.entries(obj)) {
      const p = `${path}.${k}`;
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const d = h('details', h('summary', k));
        if (path === 'BALANCE') d.open = false;
        this.buildTree(d, v, p);
        parent.appendChild(d);
      } else {
        const input = h('input', { type: typeof v === 'number' ? 'number' : 'text', value: Array.isArray(v) ? JSON.stringify(v) : String(v), step: 'any', 'aria-label': p });
        input.addEventListener('change', () => {
          let nv;
          try {
            if (typeof v === 'number') nv = Number(input.value);
            else if (typeof v === 'boolean') nv = input.value === 'true';
            else if (Array.isArray(v)) nv = JSON.parse(input.value);
            else nv = input.value;
            if (typeof v === 'number' && !Number.isFinite(nv)) throw new Error('not a number');
            obj[k] = nv;
            input.style.borderColor = 'var(--good)';
            this.ui.refreshTop();
          } catch (e) { input.style.borderColor = 'var(--bad)'; }
        });
        parent.appendChild(h('div.dbg-field', h('label', { title: p }, k), input));
      }
    }
  }

  jump(nodeId) {
    const { game, ui } = this; const { C } = game;
    const target = C.node[nodeId]; if (!target) return;
    for (const n of C.nodes) {
      if (n.globalIndex < target.globalIndex) { if (!game.state.progress.cleared[n.id]) game.state.progress.cleared[n.id] = { clears: 1, best: null }; }
      else delete game.state.progress.cleared[n.id];
    }
    game.commit('debug');
    ui.go('story', { arcId: target.arcId, nodeId: target.id });
    ui.toast(`Jumped to ${target.name}`);
  }

  simulate(nodeId, out) {
    const { game } = this; const { C, B, state } = game;
    const node = C.node[nodeId]; if (!node) return;
    const team = resolveTeam(state, node, C);
    const N = 100; let i = 0, wins = 0; const times = []; let clashes = 0;
    out.textContent = `Simulating ${N} battles of “${node.name}” with ${team.members.map(id => C.char[id].short).join(', ')}…`;
    const chunk = () => {
      const end = Math.min(N, i + 10);
      for (; i < end; i++) {
        const cfg = nodeBattleConfig(state, node, C, B, { seed: 1000 + i });
        const sim = new BattleSim({ ...cfg, recordEvents: false });
        if (sim.runToEnd({ ultMode: 'asap' }) === 'won') { wins++; times.push(sim.time); }
        clashes += sim.stats.clashes.overpower + sim.stats.clashes.standoff + sim.stats.clashes.overwhelmed;
      }
      if (i < N) { out.textContent = `Simulating… ${i}/${N}`; setTimeout(chunk, 0); return; }
      times.sort((a, b) => a - b);
      out.textContent = `${node.name}: ${wins}/${N} wins (${Math.round(wins)}%) · median win ${times.length ? times[Math.floor(times.length / 2)].toFixed(1) : '—'}s · ${fmt(clashes / N)} clashes/battle (ult bot = fire when ready)`;
    };
    setTimeout(chunk, 10);
  }

  export() {
    const text = `// Exported from the ?debug=1 panel on ${new Date().toISOString()}\n// Paste over the BALANCE object in js/config/balance.js (comments are not exported).\nexport const BALANCE = ${JSON.stringify(this.game.B, null, 2)};\n\nexport default BALANCE;\n`;
    const ta = h('textarea', { style: { minHeight: '320px' } }); ta.value = text;
    const close = this.ui.modal(h('div', h('h2', 'Export balance.js'), h('p.small', 'Copy this into js/config/balance.js. Comments from the original file are not included.'), ta,
      h('div.actions',
        btn('Copy', async () => { try { await navigator.clipboard.writeText(text); this.ui.toast('Copied!', 'good'); } catch { ta.select(); } }),
        btn('Download', () => { const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'text/javascript' })), download: 'balance.js' }); document.body.appendChild(a); a.click(); a.remove(); }),
        btn('Close', () => close(), 'primary'))), { wide: true });
  }
}
