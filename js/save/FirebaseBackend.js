// FirebaseBackend.js — Firestore cloud save with Anonymous Auth (+ optional
// Google account linking for cross-device sync).
// The Firebase modular SDK is loaded as ES modules from gstatic, pinned to an
// exact version. If firebase-config.js still has placeholders this backend is
// a no-op and Settings says cloud save isn't available.
//
// Save location: users/{uid}/save/main  (see firestore.rules)
//
// phase: 'off' (not configured) | 'connecting' | 'ready' | 'signedOut' | 'error'
//
// Nothing here creates an account on its own: init() only restores a session
// the browser already has (and finishes a Google sign-in that came back by
// redirect). The start menu is the one place that creates one, through
// continueAsGuest() or signInWithGoogle(); Settings offers the same two after a
// sign-out. Tests inject a fake SDK ({ sdk }) to check that (tools/test-core.mjs).
//
// Google sign-in is POPUP FIRST on every device, phones included. The redirect
// flow is only a fallback for when a popup can't open (auth/popup-blocked,
// auth/operation-not-supported-in-this-environment): on GitHub Pages it needs
// third-party storage for the authDomain, which Chrome blocks by default, and
// then it comes back with no user (FIREBASE_SETUP.md §9). That empty return is
// reported on the menu, never silent. Closing the popup is a cancel, not an error.
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

export const FIREBASE_SDK_VERSION = '12.19.0';
const SDK = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;

// sessionStorage flag set just before this page calls signInWithRedirect /
// linkWithRedirect ('signIn' or 'link'). It survives the round trip in the same
// tab and tells init() that a redirect result is expected. Cleared in all cases.
export const REDIRECT_FLAG = 'shinobi-auto-battler:authRedirect';
const LEGACY_REDIRECT_PREF = 'shinobi-auto-battler:pref:authRedirect';   // 0.10.0 kept it in localStorage
const redirectFlag = {
  get() { try { return globalThis.sessionStorage?.getItem(REDIRECT_FLAG) || null; } catch { return null; } },
  set(kind) { try { globalThis.sessionStorage?.setItem(REDIRECT_FLAG, kind); } catch { /* storage blocked */ } },
  clear() {
    try { globalThis.sessionStorage?.removeItem(REDIRECT_FLAG); } catch { /* ignore */ }
    try { globalThis.localStorage?.removeItem(LEGACY_REDIRECT_PREF); } catch { /* ignore */ }
  },
};

// Popup errors that mean "a popup can't work here": fall back to the redirect.
export const POPUP_UNAVAILABLE = ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'];
// Popup errors that mean the player closed it (or tapped twice): back to the menu, no message.
export const POPUP_CANCELLED = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
// Inside the installed app (standalone) the sign-in window opens outside the app, and some
// Android versions report it closed at once (auth/popup-closed-by-user well before anyone could
// have tapped anything). A cancel that fast is treated as "a popup can't open here": redirect.
export const EARLY_CANCEL_MS = 1500;

/** Shown when this page started a redirect and it came back with no user (third-party storage blocked). */
export const EMPTY_REDIRECT_ERROR = 'Google sign-in didn’t complete. Chrome may be blocking third-party cookies for this site — allow them for dygoma.github.io or try again.';

export class FirebaseBackend {
  /** opts.sdk: a preloaded (or fake) SDK, for tests. opts.standalone: running as an installed app (js/core/Pwa.js). */
  constructor(config = firebaseConfig, { sdk = null, standalone = false, now = () => Date.now() } = {}) {
    this.name = 'firebase';
    this.config = config;
    this.ready = false;
    this.phase = isFirebaseConfigured(config) ? 'connecting' : 'off';
    this.status = isFirebaseConfigured(config) ? 'connecting…' : 'not configured';
    this.error = null;
    this.user = null;
    this.m = null;
    this._sdk = sdk;
    this.standalone = !!standalone;
    this._now = now;
    // Set by init() when this page started a Google redirect and came back:
    // { ok: true, switched, kind } or { ok: false, error, kind, empty? } (empty: no user came back).
    this.redirectResult = null;
  }

  get configured() { return isFirebaseConfigured(this.config); }
  get isAnonymous() { return !!this.user?.isAnonymous; }
  get accountLabel() { return this.user ? (this.user.isAnonymous ? 'Guest (anonymous)' : (this.user.email || 'Google account')) : 'signed out'; }
  /** The name to greet a Google player with. */
  get displayName() { return this.user && !this.user.isAnonymous ? (this.user.displayName || this.user.email || 'Google account') : null; }

  async _loadSdk() {
    if (this.m) return;
    if (this._sdk) this.m = this._sdk;
    else {
      const [appMod, authMod, fsMod] = await Promise.all([
        import(`${SDK}/firebase-app.js`),
        import(`${SDK}/firebase-auth.js`),
        import(`${SDK}/firebase-firestore.js`),
      ]);
      this.m = { ...appMod, ...authMod, ...fsMod };
    }
    this.app = this.m.initializeApp(this.config);
    this.auth = this.m.getAuth(this.app);
    this.db = this.m.getFirestore(this.app);
  }

  _setUser(u) {
    this.user = u || null;
    this.ready = !!this.user;
    this.phase = this.ready ? 'ready' : 'signedOut';
    this.status = this.ready ? `connected — ${this.accountLabel}` : 'not signed in';
  }

  _fail(e, what) {
    console.warn(`[FirebaseBackend] ${what} failed`, e);
    this.error = e?.code || e?.message || 'unknown';
    this.status = `error: ${this.error}`;
  }

  /**
   * Load the SDK, finish a Google redirect if this page started one, and restore the
   * session this browser already has. Never creates an account and never throws.
   * Resolves true when a session is ready.
   */
  async init() {
    if (!this.configured) { this.phase = 'off'; this.status = 'not configured'; return false; }
    this.phase = 'connecting'; this.error = null;
    // Read and clear the redirect flag first, so it is cleared even if the SDK fails to load.
    const redirectKind = redirectFlag.get();
    redirectFlag.clear();
    try {
      await this._loadSdk();
      if (redirectKind) await this._finishRedirect(redirectKind);
      const existing = await new Promise((resolve) => {
        const unsub = this.m.onAuthStateChanged(this.auth, (u) => { unsub(); resolve(u); }, () => resolve(null));
      });
      this._setUser(existing || this.auth.currentUser);
      return this.ready;
    } catch (e) {
      this._fail(e, 'init');
      this.phase = 'error'; this.ready = false;
      return false;
    }
  }

  /**
   * This page started signInWithRedirect / linkWithRedirect (kind) and is back:
   * collect the result. No user back means the round trip lost its state (third-party
   * storage blocked for the authDomain): say so instead of silently showing the menu.
   */
  async _finishRedirect(kind) {
    try {
      const res = await this.m.getRedirectResult(this.auth);
      this.redirectResult = res?.user
        ? { ok: true, switched: false, kind }
        : { ok: false, empty: true, error: EMPTY_REDIRECT_ERROR, kind };
    } catch (e) {
      // Linking a guest to a Google account that already has a save: sign into that account instead.
      const r = await this._signInWithCredentialFromError(e);
      this.redirectResult = r.ok ? { ...r, kind } : { ok: false, error: r.error, kind };
    }
    if (!this.redirectResult.ok) console.warn('[FirebaseBackend] Google redirect sign-in did not complete', this.redirectResult);
  }

  async _signInWithCredentialFromError(e) {
    if (e?.code === 'auth/credential-already-in-use' || e?.code === 'auth/email-already-in-use') {
      try {
        const cred = this.m.GoogleAuthProvider.credentialFromError(e);
        if (!cred) throw e;
        const res = await this.m.signInWithCredential(this.auth, cred);
        this._setUser(res.user);
        return { ok: true, switched: true };
      } catch (e2) {
        console.warn('[FirebaseBackend] sign-in with existing Google account failed', e2);
        return { ok: false, error: friendlyAuthError(e2) };
      }
    }
    console.warn('[FirebaseBackend] Google sign-in failed', e);
    return { ok: false, error: friendlyAuthError(e) };
  }

  /** Leaves the page for Google's sign-in; the result arrives in init() after the redirect. */
  async _redirect(kind, fn) {
    redirectFlag.set(kind);
    try { await fn(); return { ok: true, redirecting: true }; }
    catch (e) { redirectFlag.clear(); console.warn('[FirebaseBackend] redirect failed', e); return { ok: false, error: friendlyAuthError(e) }; }
  }

  /**
   * Popup first. A popup that can't open falls back to the redirect; a closed popup
   * is a quiet cancel ({ ok: false, cancelled: true }); any other error goes to onError.
   */
  async _popupFirst(kind, popup, redirect, onError) {
    const t0 = this._now();
    try {
      const res = await popup();
      this._setUser(res.user);
      return { ok: true, switched: false };
    } catch (e) {
      const code = String(e?.code || '');
      if (POPUP_UNAVAILABLE.includes(code)) return this._redirect(kind, redirect);
      if (POPUP_CANCELLED.includes(code)) {
        if (this.standalone && this._now() - t0 < EARLY_CANCEL_MS) return this._redirect(kind, redirect);
        return { ok: false, cancelled: true };
      }
      return onError(e);
    }
  }

  _ref() { return this.m.doc(this.db, 'users', this.user.uid, 'save', 'main'); }

  /** Returns { data, updatedAt } or null if there is no cloud save yet. */
  async loadFromCloud() {
    if (!this.ready) return null;
    try {
      const snap = await this.m.getDoc(this._ref());
      if (!snap.exists()) return null;
      const d = snap.data();
      const data = typeof d.payload === 'string' ? JSON.parse(d.payload) : null;
      return data ? { data, updatedAt: Number(d.updatedAt) || Number(data.updatedAt) || 0 } : null;
    } catch (e) {
      this._fail(e, 'load');
      return null;
    }
  }

  /** Writes the whole save as one document (payload is a JSON string). */
  async saveToCloud(state) {
    if (!this.ready) return false;
    try {
      await this.m.setDoc(this._ref(), {
        payload: JSON.stringify(state),
        saveVersion: state.saveVersion,
        updatedAt: Number(state.updatedAt) || Date.now(),
        serverUpdatedAt: this.m.serverTimestamp(),
      });
      this.error = null;
      this.status = `synced — ${this.accountLabel}`;
      return true;
    } catch (e) {
      this._fail(e, 'save');
      throw e;
    }
  }

  // Backend interface used by SaveManager
  load() { return this.loadFromCloud(); }
  save(state) { return this.saveToCloud(state); }

  /**
   * Link the guest account to Google (popup first, redirect fallback). If that Google
   * account is already linked elsewhere (another device), sign into it instead so both
   * devices share one save (switched: true; the caller then offers the newer cloud save).
   * Returns { ok, switched } | { ok: false, error } | { ok: false, cancelled: true } | { ok: true, redirecting: true }.
   */
  async linkGoogle() {
    if (!this.ready) return { ok: false, error: 'Cloud save is not connected.' };
    const provider = new this.m.GoogleAuthProvider();
    return this._popupFirst('link',
      () => this.m.linkWithPopup(this.auth.currentUser, provider),
      () => this.m.linkWithRedirect(this.auth.currentUser, provider),
      (e) => this._signInWithCredentialFromError(e));
  }

  /** No session: sign in with Google (popup first, redirect fallback). Same results as linkGoogle(). */
  async signInWithGoogle() {
    try { await this._loadSdk(); }
    catch (e) { this._fail(e, 'Google sign-in'); return { ok: false, error: friendlyAuthError(e) }; }
    const provider = new this.m.GoogleAuthProvider();
    return this._popupFirst('signIn',
      () => this.m.signInWithPopup(this.auth, provider),
      () => this.m.signInWithRedirect(this.auth, provider),
      (e) => { console.warn('[FirebaseBackend] Google sign-in failed', e); return { ok: false, error: friendlyAuthError(e) }; });
  }

  /** No session: start (or go back to) an anonymous guest cloud save. */
  async continueAsGuest() {
    try {
      await this._loadSdk();
      const res = await this.m.signInAnonymously(this.auth);
      this._setUser(res.user);
      return { ok: true };
    } catch (e) {
      this._fail(e, 'guest sign-in');
      return { ok: false, error: friendlyAuthError(e) };
    }
  }

  /** Sign out on this device (the local save stays). The start menu then offers guest or Google again. */
  async signOut() {
    try {
      if (this.m && this.auth) await this.m.signOut(this.auth);
      this._setUser(null);
      return { ok: true };
    } catch (e) {
      this._fail(e, 'sign-out');
      return { ok: false, error: friendlyAuthError(e) };
    }
  }
}

/** Plain-English auth errors for toasts and the start menu (a closed popup is a cancel, never shown). */
export function friendlyAuthError(e) {
  const code = e?.code || '';
  if (code.includes('popup-blocked')) return 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.';
  if (code.includes('network')) return 'No connection. Check your internet and try again.';
  if (code.includes('unauthorized-domain')) return 'Sign-in is not enabled for this web address yet.';
  if (code.includes('operation-not-allowed')) return 'Google sign-in is not turned on for this game yet.';
  return 'Something went wrong. Please try again.';
}
