// StartScreen.js — the start menu, shown after the intro and before the game.
// It is the one place a cloud session gets created: "Continue as guest"
// (anonymous) or "Sign in with Google". A browser that already has a session
// gets a single Continue button (and guests keep "Sign in with Google" so they
// can link). StartFlow.menuModel decides what to show; this file draws it.
import { h, btn } from './dom.js';
import { menuModel } from '../core/StartFlow.js';

export function render(game, ui) {
  const { save, cloud, state } = game;
  const cs = save.cloudState();
  const model = menuModel(cs, { hasProgress: (state.updatedAt || 0) > 0 || Object.keys(state.progress.cleared).length > 0, redirectError: cloud.redirectResult?.ok === false ? cloud.redirectResult.error : null });
  const note = h('p.small.start-note' + (model.warn ? '.warn-text' : ''), { role: 'status', 'aria-live': 'polite' }, model.message || '');
  const say = (text, bad = false) => { note.textContent = text; note.classList.toggle('warn-text', bad); };
  // Disable the menu while a sign-in runs, and show what is happening on the button.
  const busy = (label, fn) => async (e) => {
    const b = e.currentTarget; const old = b.firstChild.textContent;
    for (const x of buttons) x.disabled = true;
    b.firstChild.textContent = label;
    try { await fn(); } finally { if (b.isConnected) { for (const x of buttons) x.disabled = false; b.firstChild.textContent = old; } }
  };
  const item = (label, sub, onclick, cls = '') => btn([h('span', label), sub ? h('span.sub', sub) : null], onclick, ['big', 'start-item', cls].filter(Boolean).join(' '));
  const buttons = [];
  if (model.busy) buttons.push(h('div.start-busy', h('div.spinner.small-spin', { 'aria-hidden': 'true' }), h('span', model.busy)));
  if (model.primary) buttons.push(item(model.primary.label, model.primary.sub, () => game.enterGame(), 'primary'));
  if (model.guest) buttons.push(item('Continue as guest', 'Your save stays on this device and in the cloud as a guest.', busy('Connecting…', async () => {
    const r = await cloud.continueAsGuest();
    if (r.ok) await game.enterGame(); else say(r.error, true);
  }), model.primary ? '' : 'primary'));
  // Google: a popup on every device (redirect only if a popup can't open). Closing the
  // popup is a cancel: back to the menu with no message. After a redirect that came back
  // without signing in, the button reads "Try again" under the explanation.
  const googleResult = (r) => {
    cloud.redirectResult = null;   // a new attempt replaces the last redirect's message
    if (r.redirecting) { say('Taking you to Google to sign in…'); return false; }
    if (r.cancelled) { say(''); return false; }
    if (!r.ok) { say(r.error, true); return false; }
    return true;
  };
  const googleLabel = model.retryGoogle ? '↻ Try again' : 'Sign in with Google';
  if (model.google === 'signIn') buttons.push(item(googleLabel, model.retryGoogle ? 'Sign in with Google' : 'Keep your save on every device.', busy('Opening Google sign-in…', async () => {
    const r = await cloud.signInWithGoogle();
    if (googleResult(r)) { state.account.googleLinked = true; await game.enterGame(); }
  })));
  if (model.google === 'link') buttons.push(item(googleLabel, model.retryGoogle ? 'Sign in with Google to link this guest save' : 'Link this guest save to your Google account.', busy('Opening Google sign-in…', async () => {
    const r = await cloud.linkGoogle();
    if (googleResult(r)) { state.account.googleLinked = true; await game.enterGame({ switched: r.switched }); }
  })));
  if (model.retry) buttons.push(item('↻ Try again', null, busy('Connecting…', async () => { await save.connectCloud(); ui.refresh(); })));

  return h('div.start', { 'aria-label': 'Start menu' },
    h('div.start-brand',
      h('div.brand-mark.big', { 'aria-hidden': 'true' }, '忍'),
      h('h1', 'Shinobi Auto-Battler'),
      h('p', 'Your ninja fight on their own. You choose the team, read the Nature Wheel and time the Ultimates.')),
    h('div.start-menu', ...buttons, note,
      h('div.row.center-row.start-links',
        btn('📚 Wiki', () => ui.openWiki('home'), 'ghost small'),
        btn('⚙️ Settings', () => ui.go('settings'), 'ghost small'))),
    h('div.start-foot',
      h('p.tiny.dim', 'Fan-made, non-commercial. Naruto © Masashi Kishimoto / Shueisha / Studio Pierrot. No official artwork or audio.'),
      h('span.build-stamp', game.build?.label || 'dev')));
}
