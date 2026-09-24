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
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';
import { LocalBackend } from './LocalBackend.js';

export const FIREBASE_SDK_VERSION = '12.19.0';
const SDK = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
// Set before a Google redirect ('signIn' or 'link') so the page knows, when it
// comes back, that the player was in the middle of signing in.
const REDIRECT_PREF = 'authRedirect';

/** Phones and tablets: sign in with Google by redirect (popups are unreliable on mobile browsers). */
export function prefersRedirect() {
  try {
    if (window.matchMedia('(pointer: coarse)').matches) return true;
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  } catch { return false; }
}

export class FirebaseBackend {
  /** opts.sdk: a preloaded (or fake) SDK; opts.useRedirect: force the redirect or popup flow (default: prefersRedirect()). */
  constructor(config = firebaseConfig, { sdk = null, useRedirect = null } = {}) {
    this.name = 'firebase';
    this.config = config;
    this.ready = false;
    this.phase = isFirebaseConfigured(config) ? 'connecting' : 'off';
    this.status = isFirebaseConfigured(config) ? 'connecting…' : 'not configured';
    this.error = null;
    this.user = null;
    this.m = null;
    this._sdk = sdk;
    this._useRedirect = useRedirect;
    // Set by init() when the page came back from a Google redirect: { ok, switched, error, kind }.
    this.redirectResult = null;
  }

  get configured() { return isFirebaseConfigured(this.config); }
  get isAnonymous() { return !!this.user?.isAnonymous; }
  get accountLabel() { return this.user ? (this.user.isAnonymous ? 'Guest (anonymous)' : (this.user.email || 'Google account')) : 'signed out'; }
  /** The name to greet a Google player with. */
  get displayName() { return this.user && !this.user.isAnonymous ? (this.user.displayName || this.user.email || 'Google account') : null; }
  get useRedirect() { return this._useRedirect ?? prefersRedirect(); }

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
   * Load the SDK, finish a Google redirect if one is pending, and restore the
   * session this browser already has. Never creates an account and never throws.
   * Resolves true when a session is ready.
   */
  async init() {
    if (!this.configured) { this.phase = 'off'; this.status = 'not configured'; return false; }
    this.phase = 'connecting'; this.error = null;
    try {
      await this._loadSdk();
      await this._finishRedirect();
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

  /** The page came back from signInWithRedirect / linkWithRedirect: collect the result. */
  async _finishRedirect() {
    const kind = LocalBackend.getPref(REDIRECT_PREF, null);
    if (!kind || !this.m.getRedirectResult) return;
    LocalBackend.setPref(REDIRECT_PREF, null);
    try {
      const res = await this.m.getRedirectResult(this.auth);
      if (res?.user) this.redirectResult = { ok: true, switched: false, kind };
    } catch (e) {
      // Linking a guest to a Google account that already has a save: sign into that account instead.
      const r = await this._signInWithCredentialFromError(e);
      this.redirectResult = r.ok ? { ...r, kind } : { ok: false, error: r.error, kind };
    }
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
    LocalBackend.setPref(REDIRECT_PREF, kind);
    try { await fn(); return { ok: true, redirecting: true }; }
    catch (e) { LocalBackend.setPref(REDIRECT_PREF, null); console.warn('[FirebaseBackend] redirect failed', e); return { ok: false, error: friendlyAuthError(e) }; }
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
   * Link the guest account to Google. If that Google account is already linked
   * elsewhere (another device), sign into it instead so both devices share one
   * save. Popup on desktop; redirect on phones (and when the popup is blocked).
   * Returns { ok, switched, error } or { ok: true, redirecting: true }.
   */
  async linkGoogle() {
    if (!this.ready) return { ok: false, error: 'Cloud save is not connected.' };
    const provider = new this.m.GoogleAuthProvider();
    if (this.useRedirect) return this._redirect('link', () => this.m.linkWithRedirect(this.auth.currentUser, provider));
    try {
      const res = await this.m.linkWithPopup(this.auth.currentUser, provider);
      this._setUser(res.user);
      return { ok: true, switched: false };
    } catch (e) {
      if (String(e?.code).includes('popup-blocked')) return this._redirect('link', () => this.m.linkWithRedirect(this.auth.currentUser, provider));
      return this._signInWithCredentialFromError(e);
    }
  }

  /** No session: sign in with Google. Returns { ok, error } or { ok: true, redirecting: true }. */
  async signInWithGoogle() {
    try {
      await this._loadSdk();
      const provider = new this.m.GoogleAuthProvider();
      if (this.useRedirect) return this._redirect('signIn', () => this.m.signInWithRedirect(this.auth, provider));
      try {
        const res = await this.m.signInWithPopup(this.auth, provider);
        this._setUser(res.user);
        return { ok: true };
      } catch (e) {
        if (String(e?.code).includes('popup-blocked')) return this._redirect('signIn', () => this.m.signInWithRedirect(this.auth, provider));
        throw e;
      }
    } catch (e) {
      console.warn('[FirebaseBackend] Google sign-in failed', e);
      return { ok: false, error: friendlyAuthError(e) };
    }
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

/** Plain-English auth errors for toasts and the start menu. */
export function friendlyAuthError(e) {
  const code = e?.code || '';
  if (code.includes('popup-closed') || code.includes('cancelled-popup')) return 'The sign-in window was closed before finishing.';
  if (code.includes('popup-blocked')) return 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.';
  if (code.includes('network')) return 'No connection. Check your internet and try again.';
  if (code.includes('unauthorized-domain')) return 'Sign-in is not enabled for this web address yet.';
  if (code.includes('operation-not-allowed')) return 'Google sign-in is not turned on for this game yet.';
  return 'Something went wrong. Please try again.';
}
