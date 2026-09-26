// Dialogue.js — plays a story scene (docs/STORY_PLAN.md §1, §4): each line typed into a paper
// box beside the speaker's portrait (captions across the top), a tap or Space to finish the
// line then advance, Skip, and Auto (the next line 2.5 s after one ends; the choice is kept
// in Settings). Over a battle or map stage the layer sits inside it; with no host it is a
// full-screen veil. The music ducks while a scene plays; lines blip as they type.
import { h, btn, avatar } from './dom.js';
import { speakerOf, lineSide, fill, AUTO_ADVANCE_SECONDS, TYPE_CPS } from '../core/Story.js';
import { prefersReducedMotion } from './Intro.js';

/**
 * playScene(game, lines, opts) → { el, done (a Promise), skip(), cancel(), active() }.
 * opts: host (the element the layer goes into; none = a full-screen veil on the body),
 *       values (placeholder values for the teaching lines), era (the portraits' outfits),
 *       onDone (after the last line or Skip; not after cancel), label (for screen readers).
 */
export function playScene(game, lines, { host = null, values = null, era = null, onDone = null, label = 'Story scene' } = {}) {
  const { C } = game; const audio = game.audio;
  const reduced = prefersReducedMotion();
  const layer = h('div.scene' + (host ? '.in-stage' : '.scene-veil'), { role: 'dialog', 'aria-label': label, 'aria-live': 'polite' });
  const cap = h('div.caption.hidden');
  const slot = h('div.avatar'); const name = h('div.name'); const text = h('div.text'); const next = h('div.next.hidden');
  const box = h('div.box', name, text, next);
  const dlg = h('div.dlg.hidden', slot, box);
  let auto = !!game.state.settings.dialogueAuto;
  const autoBtn = btn('Auto', () => setAuto(!auto), 'small', { 'aria-pressed': String(auto), title: 'Lines move on by themselves' });
  const skipBtn = btn('Skip ⏭', () => finish(), 'small', { title: 'Skip this scene' });
  const ctl = h('div.dlg-ctl', autoBtn, skipBtn);
  layer.append(cap, dlg, ctl);
  const setAuto = (on) => { auto = on; autoBtn.classList.toggle('on', on); autoBtn.setAttribute('aria-pressed', String(on)); game.state.settings.dialogueAuto = on; game.commit('settings'); if (on && !typing && !ended) armAuto(); else clearTimeout(autoTimer); };
  autoBtn.classList.toggle('on', auto);

  let i = -1, typing = false, ended = false, typeTimer = 0, autoTimer = 0, current = '', shownTarget = null, resolve;
  const done = new Promise((r) => { resolve = r; });
  let lastWho = null;

  const armAuto = () => { clearTimeout(autoTimer); if (auto) autoTimer = setTimeout(() => advance(), AUTO_ADVANCE_SECONDS * 1000); };
  const showAll = () => { clearTimeout(typeTimer); typing = false; shownTarget.textContent = current; next.classList.toggle('hidden', shownTarget !== text); armAuto(); };
  const typeOut = () => {
    let n = 0; typing = true; next.classList.add('hidden'); shownTarget.textContent = '';
    const step = () => {
      if (ended) return;
      n++; shownTarget.textContent = current.slice(0, n);
      if (n % 2 === 0 && n < current.length) audio.blip();
      if (n >= current.length) { showAll(); return; }
      typeTimer = setTimeout(step, 1000 / TYPE_CPS);
    };
    if (reduced) { showAll(); return; }
    typeTimer = setTimeout(step, 1000 / TYPE_CPS);
  };
  const show = (line) => {
    current = fill(line.caption ?? line.text, values);
    if (line.caption != null) {
      dlg.classList.add('hidden'); cap.classList.remove('hidden'); shownTarget = cap;
    } else {
      cap.classList.add('hidden'); dlg.classList.remove('hidden'); shownTarget = text;
      const sp = speakerOf(line.who, C);
      const side = lineSide(line, C);
      dlg.classList.toggle('right', side === 'right');
      if (line.who !== lastWho) {
        lastWho = line.who;
        const a = sp.def ? avatar(sp.def, { size: 'lg', facing: side === 'right' ? -1 : 1, era, expression: sp.kind === 'enemy' ? 'menace' : 'set' }) : h('div.avatar', h('span.q', '?'));
        a.setAttribute('aria-hidden', 'true');
        dlg.replaceChild(a, dlg.firstChild);
        name.textContent = sp.name;
        box.classList.add('pop'); setTimeout(() => box.classList.remove('pop'), 260);
      }
    }
    typeOut();
  };
  const advance = () => {
    if (ended) return;
    clearTimeout(autoTimer);
    if (typing) { showAll(); return; }
    i++;
    if (i >= lines.length) { finish(); return; }
    if (i > 0) audio.ui('pageTurn');
    show(lines[i]);
  };
  const cleanup = () => {
    if (ended) return false;
    ended = true;
    clearTimeout(typeTimer); clearTimeout(autoTimer); clearInterval(watch);
    document.removeEventListener('keydown', onKey, true);
    layer.remove();
    audio.duckMusic(false);
    return true;
  };
  // A host that leaves the page (a screen re-rendered, a battle closed) takes the scene with it: no stray duck or timers.
  const watch = setInterval(() => { if (!layer.isConnected) cancel(); }, 400);
  const finish = () => { if (!cleanup()) return; resolve(true); if (onDone) onDone(); };
  const cancel = () => { if (!cleanup()) return; resolve(false); };
  const onKey = (e) => {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); advance(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(); }
  };
  // Any tap on the layer advances (the buttons keep to themselves); nothing under it hears the tap.
  layer.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (!e.target.closest('button')) advance(); });
  layer.addEventListener('click', (e) => { e.stopPropagation(); });
  document.addEventListener('keydown', onKey, true);
  (host || document.body).appendChild(layer);
  audio.duckMusic(true); audio.ui('paper');
  advance();
  return { el: layer, done, skip: finish, cancel, active: () => !ended };
}
