// SettingsScreen.js — sound, cloud save, export/import, reset.
import { h, btn, toggle } from './dom.js';
import { SAVE_VERSION } from '../core/SaveManager.js';
import { FIREBASE_SDK_VERSION } from '../save/FirebaseBackend.js';

export function render(game, ui) {
  const { state, save, cloud } = game;
  const s = state.settings;
  const exportBox = h('textarea', { readonly: true, placeholder: 'Press “Export” to generate your save string.', 'aria-label': 'Exported save' });
  const importBox = h('textarea', { placeholder: 'Paste a save string here, then press “Import”.', 'aria-label': 'Save to import' });

  const cloudStatus = !cloud || !cloud.configured ? 'Cloud save: not configured' : `Cloud save: ${save.cloudStatus || cloud.status}`;
  const lastSync = save.lastCloudSave ? `Last upload ${new Date(save.lastCloudSave).toLocaleTimeString()}` : '';

  return h('div.screen',
    h('h1', 'Settings'),
    h('div.card',
      h('h2', 'Game'),
      h('div.setting', h('div', h('b', 'Sound'), h('div.tiny.muted', 'Synth sound effects (saved)')), toggle(!s.muted, (on) => { s.muted = !on; game.audio.setMuted(s.muted); game.commit('settings'); ui.refreshTop(); }, 'Sound')),
      h('div.setting', h('div', h('b', 'Auto-fire Ultimates'), h('div.tiny.muted', 'Fires ults when ready, holding any that would lose a Jutsu Clash')), toggle(!!s.autoUlt, (on) => { s.autoUlt = on; game.commit('settings'); }, 'Auto ults')),
      h('div.setting', h('div', h('b', 'Battle speed'), h('div.tiny.muted', 'Default speed for new battles')),
        h('div.seg', ...[1, 2].map(v => h('button' + ((s.speed || 1) === v ? '.on' : ''), { type: 'button', onclick: () => { s.speed = v; game.commit('settings'); ui.refresh(); } }, `${v}×`)))),
      h('div.setting', h('div', h('b', 'Replay the tutorial tips')), btn('Reset tips', () => { s.onboardingDone = false; game.commit('settings'); ui.toast('Tips will show in your next battle.'); }, 'small')),
    ),
    h('div.card', { style: { marginTop: '12px' } },
      h('h2', 'Cloud save'),
      h('p', { style: { color: cloud?.ready ? 'var(--good)' : 'var(--muted)' } }, cloudStatus, lastSync ? h('span.tiny.dim', ` · ${lastSync}`) : null),
      cloud?.ready ? h('div.row',
        h('span.small.muted', `Signed in as ${cloud.accountLabel}.`),
        cloud.isAnonymous ? btn('🔗 Link Google account', async () => {
          try {
            const r = await cloud.linkGoogle();
            if (r.ok) {
              ui.toast(r.switched ? 'Signed in to your existing Google save.' : 'Google account linked — your save now follows you.', 'good');
              if (r.switched) await save.checkCloudNewer();
              await save.saveCloudNow();
            } else ui.toast(`Could not link: ${r.error}`, 'bad');
          } catch (e) { ui.toast('Could not link Google account.', 'bad'); }
          ui.refresh();
        }, 'primary') : null,
        btn('☁️ Sync now', async () => { try { await save.saveCloudNow(); ui.toast('Uploaded to the cloud.', 'good'); } catch { ui.toast('Upload failed.', 'bad'); } ui.refresh(); }, ''),
      ) : h('p.small', 'Saves are kept in this browser. To sync across devices, follow FIREBASE_SETUP.md in the repository and paste your Firebase config into js/save/firebase-config.js.'),
    ),
    h('div.card', { style: { marginTop: '12px' } },
      h('h2', 'Export / import'),
      h('p.small', 'Your save as a text string — keep it somewhere safe or move it to another browser.'),
      exportBox,
      h('div.row', { style: { margin: '8px 0 14px' } },
        btn('📤 Export', () => { exportBox.value = save.exportString(); exportBox.select(); }),
        btn('📋 Copy', async () => { if (!exportBox.value) exportBox.value = save.exportString(); try { await navigator.clipboard.writeText(exportBox.value); ui.toast('Copied!', 'good'); } catch { exportBox.select(); ui.toast('Select the text and copy it manually.'); } })),
      importBox,
      h('div.row', { style: { marginTop: '8px' } }, btn('📥 Import', async () => {
        if (!importBox.value.trim()) { ui.toast('Paste a save string first.'); return; }
        const ok = await ui.confirm('Import save?', 'This replaces your current progress on this device.', { okText: 'Import', danger: true });
        if (!ok) return;
        const r = save.importString(importBox.value);
        if (r.ok) { ui.toast('Save imported.', 'good'); ui.go('home'); } else ui.toast(r.error, 'bad');
      })),
    ),
    h('div.card', { style: { marginTop: '12px' } },
      h('h2', 'Danger zone'),
      h('p.small', 'Start over from the Survival Test with the starter team. This cannot be undone (export first if unsure).'),
      btn('🗑️ Reset progress', async () => {
        const ok = await ui.confirm('Reset all progress?', 'Your ninja, currencies and story progress will be wiped. This cannot be undone.', { okText: 'Reset everything', danger: true });
        if (!ok) return;
        save.reset(); game.audio.setMuted(game.state.settings.muted); ui.toast('Progress reset.'); ui.go('home');
      }, 'danger'),
    ),
    h('p.tiny.dim', { style: { marginTop: '16px' } }, `Save version ${SAVE_VERSION} · Firebase SDK ${FIREBASE_SDK_VERSION} · Add ?debug=1 to the URL for the balance debug panel.`),
    h('p.tiny.dim', 'Fan-made, non-commercial. Naruto © Masashi Kishimoto / Shueisha / Studio Pierrot. Names follow the English dub; no official artwork is used.'),
  );
}
