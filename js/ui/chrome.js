// chrome.js — shared screen furniture: the standard screen header with its back
// button and the ? help button that deep-links to the Wiki page for the screen.
import { h, btn } from './dom.js';

/**
 * Standard screen header.
 *   title   screen title (h1)
 *   back    { label, id, params? } — a "‹ label" button (screens that aren't tabs)
 *   help    Wiki page id for the ? button
 *   right   extra controls placed before the ? button
 */
export function screenHead(ui, { title, back = null, help = null, right = [] }) {
  return h('div.screen-head',
    back ? btn(`‹ ${back.label}`, () => ui.go(back.id, back.params || {}), 'ghost small back-btn', { 'aria-label': `Back to ${back.label}` }) : null,
    h('h1', title),
    h('div.grow'),
    ...right.filter(Boolean),
    help ? helpButton(ui, help) : null);
}

/** The ? button: opens the Wiki at `pageId`, remembering where the player came from. */
export function helpButton(ui, pageId) {
  return h('button.icon-btn.help-btn', { type: 'button', 'aria-label': 'Help: open this screen\'s Wiki page', title: 'Help (Wiki)', onclick: () => ui.openWiki(pageId) }, '?');
}
