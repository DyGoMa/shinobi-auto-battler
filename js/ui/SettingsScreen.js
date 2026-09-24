// SettingsScreen.js — battle options, help, audio and visuals, account and cloud
// save, the save itself (export, import, reset) and version info.
import { h, btn, toggle } from './dom.js';
import { SAVE_VERSION } from '../core/SaveManager.js';
import { FIREBASE_SDK_VERSION } from '../save/FirebaseBackend.js';
import { GAME_VERSION } from '../config/version.js';
import { tipCard, tipsEnabled, resetTips } from './tips.js';
import { screenHead } from './chrome.js';

const row = (title, sub, control, id) => h('div.setting', { id },
  h('div.setting-text', h('b', title), sub ? h('div.tiny.muted', sub) : null), control);

export function render(game, ui) {
  const { state, save, cloud } = game;
  const s = state.settings;
  const seg = (label, options, value, onPick) => h('div.seg', { role: 'group', 'aria-label': label },
    ...options.map(([v, text]) => h('button' + (value === v ? '.on' : ''), { type: 'button', 'aria-pressed': String(value === v), onclick: () => onPick(v) }, text)));
  const set = (k, v) => { s[k] = v; game.commit('settings'); ui.refresh(); };

  return h('div.screen',
    screenHead(ui, { title: 'Settings', help: 'guide/how-to-play', back: ui.startPending ? { label: 'Menu', id: 'start' } : null }),
    tipCard(game, 'settings'),

    h('div.card',
      h('h2', 'Battle'),
      row('Battle speed', 'The speed new battles start at. You can switch in battle too.',
        seg('Battle speed', [[1, '1×'], [2, '2×']], s.speed || 1, (v) => set('speed', v))),
      row('Start battles with Auto-ult on', 'The 🤖 button in battle fires Ultimates for you. You can turn it off mid-battle.',
        toggle(!!s.autoUlt, (on) => { s.autoUlt = on; game.commit('settings'); }, 'Start battles with Auto-ult on')),
      row('Auto-ult mode', s.autoUltMode === 'asap' ? 'Fire when ready: every Ultimate goes off the moment it is ready.' : 'Clash-aware (recommended): fires counter-nature ninja into enemy wind-ups and holds anyone who would be Overwhelmed.',
        seg('Auto-ult mode', [['smart', 'Clash-aware'], ['asap', 'Fire when ready']], s.autoUltMode === 'asap' ? 'asap' : 'smart', (v) => set('autoUltMode', v))),
    ),

    h('div.card.gap',
      h('h2', 'Help'),
      row('Show tips again', 'One-time tips on each screen and in your first battle. Switching this on shows every tip once more.',
        toggle(tipsEnabled(state), (on) => { if (on) { resetTips(game); ui.toast('Tips are back on: each screen shows its tip once more.', 'good'); } else { s.tips = false; game.commit('settings'); } }, 'Show tips again')),
      row('Replay the tutorial', 'The three Academy lessons again (no extra reward).', btn('🎓 Replay', () => ui.openTutorial({ replay: true }), 'small')),
      row('Replay the intro', 'The splash and the opening scene from when you first started the game.', btn('🎬 Replay', () => ui.playIntro(), 'small')),
      row('The Wiki', 'Guides and every ninja, jutsu, enemy and battle.', btn('📚 Open', () => ui.openWiki('home'), 'small')),
    ),

    h('div.card.gap',
      h('h2', 'Audio and visuals'),
      row('Sound', 'Turns every game sound on or off.', toggle(!s.muted, (on) => { s.muted = !on; game.audio.setMuted(s.muted); game.commit('settings'); ui.refreshTop(); }, 'Sound')),
      row('Music', 'Arrives with the soundtrack update.', toggle(s.music !== false, () => {}, 'Music (coming soon)', { disabled: true }), 'set-music'),
      row('Sound effects', 'A separate switch for effects arrives with the audio update.', toggle(s.sfx !== false, () => {}, 'Sound effects (coming soon)', { disabled: true }), 'set-sfx'),
      row('Visual effects', 'Effect detail options arrive with the visual effects update.', toggle(s.vfx !== false, () => {}, 'Visual effects (coming soon)', { disabled: true }), 'set-vfx'),
    ),

    accountCard(game, ui),

    saveCard(game, ui),

    h('div.card.gap',
      h('h2', 'About'),
      row(`Version ${GAME_VERSION}`, 'See what changed in each version.', btn("✨ What's new", () => ui.openWiki('guide/whats-new'), 'small')),
      h('p.tiny.dim', { style: { marginTop: '10px' } }, `Save format ${SAVE_VERSION} · Firebase SDK ${FIREBASE_SDK_VERSION}${game.debug ? ' · balance debug panel on' : ''}`),
      h('p.tiny.dim', 'Fan-made, non-commercial. Naruto © Masashi Kishimoto / Shueisha / Studio Pierrot. Names follow the English dub; no official artwork is used.'),
      h('p.build-stamp.about-stamp', { title: 'Build: the deployed commit and its UTC build time ("dev" on a local copy)' }, game.build?.label || 'dev'),
    ),
  );
}

// ---------------------------------------------------------------------------
// Account and cloud save
// ---------------------------------------------------------------------------
function accountCard(game, ui) {
  const { save, cloud } = game;
  const cs = save.cloudState();
  const busy = (label, fn) => async (e) => {
    const b = e.currentTarget; b.disabled = true; const old = b.textContent; b.textContent = label;
    try { await fn(); } finally { b.disabled = false; b.textContent = old; ui.refresh(); }
  };
  const last = cs.lastSync ? `Last synced at ${new Date(cs.lastSync).toLocaleTimeString()}.` : 'Syncs a few seconds after each change.';
  let status, actions = [];
  switch (cs.kind) {
    case 'off':
      status = [h('p', 'Cloud save isn\'t available in this version of the game. Your progress is saved in this browser.'), h('p.small.muted', 'To move it to another browser, use Export and Import below.')];
      break;
    case 'connecting':
      status = [h('div.row', h('div.spinner.small-spin', { 'aria-hidden': 'true' }), h('p', { style: { margin: 0 } }, 'Connecting to cloud save…')), h('p.small.muted', 'Your progress is already saved in this browser.')];
      break;
    case 'error':
      status = [h('p.warn-text', 'Couldn\'t reach cloud save.'), h('p.small.muted', 'Your progress is safe in this browser and will upload when the connection comes back.')];
      actions = [btn('↻ Try again', busy('Connecting…', async () => { await save.initCloud(); }), 'primary')];
      break;
    case 'signedOut':
      status = [h('p', 'Not signed in. Your progress is saved in this browser only.'), h('p.small.muted', 'Sign in with Google to load or keep your cloud save, or use cloud save as a guest on this device.')];
      actions = [
        btn('Sign in with Google', busy('Signing in…', async () => {
          const r = await cloud.signInWithGoogle();
          if (r.redirecting) { ui.toast('Taking you to Google to sign in…'); return; }
          if (r.ok) { await save.afterSignIn(); game.state.account.googleLinked = true; game.commit('account'); ui.toast('Signed in: your save syncs with your Google account.', 'good'); }
          else ui.toast(r.error, 'bad');
        }), 'primary'),
        btn('Use as a guest', busy('Connecting…', async () => {
          const r = await cloud.continueAsGuest();
          if (r.ok) { await save.afterSignIn(); ui.toast('Cloud save is on (guest).', 'good'); } else ui.toast(r.error, 'bad');
        })),
      ];
      break;
    case 'guest':
      status = [h('p.good-text', '☁️ Cloud save is on (guest).'), h('p.small.muted', `${last} Link a Google account so you don't lose your save if you clear this browser or change device.`)];
      if (cs.syncError) status.push(h('p.small.warn-text', 'The last upload failed. It will try again automatically.'));
      actions = [
        btn('🔗 Link Google account', busy('Linking…', async () => {
          const r = await cloud.linkGoogle();
          if (r.redirecting) { ui.toast('Taking you to Google to sign in…'); return; }
          if (r.ok) {
            // A Google account that already had a save elsewhere: offer to load it first.
            if (r.switched) await save.afterSignIn();
            game.state.account.googleLinked = true;
            game.commit('account');
            await save.saveCloudNow();
            ui.toast(r.switched ? 'Signed in to your existing Google save.' : 'Google account linked: your save now follows you.', 'good');
          } else ui.toast(r.error, 'bad');
        }), 'primary'),
        btn('☁️ Sync now', busy('Syncing…', async () => { (await save.saveCloudNow()) ? ui.toast('Uploaded to the cloud.', 'good') : ui.toast('Upload failed. It will try again automatically.', 'bad'); })),
      ];
      break;
    default: // google
      status = [h('p.good-text', `☁️ Cloud save is on: ${cs.account}.`), h('p.small.muted', `${last} Sign in with the same Google account on another device to continue there.`)];
      if (cs.syncError) status.push(h('p.small.warn-text', 'The last upload failed. It will try again automatically.'));
      actions = [
        btn('☁️ Sync now', busy('Syncing…', async () => { (await save.saveCloudNow()) ? ui.toast('Uploaded to the cloud.', 'good') : ui.toast('Upload failed. It will try again automatically.', 'bad'); })),
        btn('Sign out', async () => {
          const ok = await ui.confirm('Sign out?', 'Your progress stays in this browser, but it stops syncing with your Google account until you sign in again.', { okText: 'Sign out' });
          if (!ok) return;
          await save.saveCloudNow();
          const r = await cloud.signOut();
          ui.toast(r.ok ? 'Signed out. Your progress is saved in this browser.' : r.error, r.ok ? '' : 'bad');
          ui.refresh();
        }, 'ghost'),
      ];
  }
  return h('div.card.gap', { 'aria-live': 'polite' }, h('h2', 'Account and cloud save'), ...status, actions.length ? h('div.row', { style: { marginTop: '8px' } }, ...actions) : null);
}

// ---------------------------------------------------------------------------
// The save: export, import, reset
// ---------------------------------------------------------------------------
function saveCard(game, ui) {
  const { save, cloud } = game;
  const exportBox = h('textarea', { readonly: true, placeholder: 'Press Export to create your save code.', 'aria-label': 'Your save code' });
  const importBox = h('textarea', { placeholder: 'Paste a save code here, then press Import.', 'aria-label': 'Save code to import' });
  return h('div.card.gap',
    h('h2', 'Your save'),
    h('p.small', 'Your save as a text code. Keep it somewhere safe, or paste it into another browser to continue there.'),
    exportBox,
    h('div.row', { style: { margin: '8px 0 14px' } },
      btn('📤 Export', () => { exportBox.value = save.exportString(); exportBox.select(); }),
      btn('📋 Copy', async () => {
        if (!exportBox.value) exportBox.value = save.exportString();
        try { await navigator.clipboard.writeText(exportBox.value); ui.toast('Save code copied.', 'good'); }
        catch { exportBox.select(); ui.toast('Select the code and copy it yourself.'); }
      })),
    importBox,
    h('div.row', { style: { marginTop: '8px' } }, btn('📥 Import', async () => {
      if (!importBox.value.trim()) { ui.toast('Paste a save code first.'); return; }
      const ok = await ui.confirm('Import this save?', 'It replaces your current progress on this device.', { okText: 'Import', danger: true });
      if (!ok) return;
      const r = save.importString(importBox.value);
      if (r.ok) ui.toast('Save imported.', 'good'); else ui.toast(r.error, 'bad');
    })),
    h('div.divider'),
    h('h3', 'Reset'),
    h('p.small', `Start over from the beginning with the starter team. This can't be undone${cloud?.ready ? ', and your cloud save is replaced too' : ''}. Export your save first if you're not sure.`),
    btn('🗑️ Reset save…', () => confirmReset(game, ui), 'danger'),
  );
}

const RESET_WORD = 'RESET';
function confirmReset(game, ui) {
  const input = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': `Type ${RESET_WORD} to confirm` });
  const go = btn('Reset everything', () => {
    if (input.value.trim().toUpperCase() !== RESET_WORD) return;
    close();
    game.save.reset();
    game.audio.setMuted(game.state.settings.muted);
    ui.toast('Your save was reset.');
  }, 'danger', { disabled: true });
  input.addEventListener('input', () => { go.disabled = input.value.trim().toUpperCase() !== RESET_WORD; });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !go.disabled) go.click(); });
  const close = ui.modal(h('div',
    h('h2', 'Reset your save?'),
    h('p', 'Your ninja, currencies, story progress and achievements will be wiped. This can\'t be undone.'),
    h('label.small', { style: { display: 'block', margin: '10px 0 6px' } }, 'Type ', h('b', RESET_WORD), ' to confirm:'),
    input,
    h('div.actions', btn('Cancel', () => close(), 'ghost'), go)), { label: 'Reset save' });
  setTimeout(() => input.focus(), 40);
}
