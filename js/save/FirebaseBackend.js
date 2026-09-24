// FirebaseBackend.js — Firestore cloud save with Anonymous Auth (+ optional
// Google account linking for cross-device sync).
// The Firebase modular SDK is loaded as ES modules from gstatic, pinned to an
// exact version. If firebase-config.js still has placeholders this backend is
// a no-op and Settings says cloud save isn't available.
//
// Save location: users/{uid}/save/main  (see firestore.rules)
//
// phase: 'off' (not configured) | 'connecting' | 'ready' | 'signedOut' | 'error'
// A player who signs out stays signed out on this device (a local preference)
// until they sign in with Google or choose to continue as a guest.
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';
import { LocalBackend } from './LocalBackend.js';

export const FIREBASE_SDK_VERSION = '12.19.0';
const SDK = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
const SIGNED_OUT_PREF = 'cloudSignedOut';

export class FirebaseBackend {
  constructor(config = firebaseConfig) {
    this.name = 'firebase';
    this.config = config;
    this.ready = false;
    this.phase = isFirebaseConfigured(config) ? 'connecting' : 'off';
    this.status = isFirebaseConfigured(config) ? 'connecting…' : 'not configured';
    this.error = null;
    this.user = null;
    this.m = null;
  }

  get configured() { return isFirebaseConfigured(this.config); }
  get isAnonymous() { return !!this.user?.isAnonymous; }
  get accountLabel() { return this.user ? (this.user.isAnonymous ? 'Guest (anonymous)' : (this.user.email || 'Google account')) : 'signed out'; }

  async _loadSdk() {
    if (this.m) return;
    const [appMod, authMod, fsMod] = await Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-auth.js`),
      import(`${SDK}/firebase-firestore.js`),
    ]);
    this.m = { ...appMod, ...authMod, ...fsMod };
    this.app = appMod.initializeApp(this.config);
    this.auth = authMod.getAuth(this.app);
    this.db = fsMod.getFirestore(this.app);
  }

  _setUser(u) {
    this.user = u || null;
    this.ready = !!this.user;
    this.phase = this.ready ? 'ready' : 'signedOut';
    this.status = this.ready ? `connected — ${this.accountLabel}` : 'signed out';
  }

  _fail(e, what) {
    console.warn(`[FirebaseBackend] ${what} failed`, e);
    this.error = e?.code || e?.message || 'unknown';
    this.status = `error: ${this.error}`;
  }

  /** Load the SDK and sign in (anonymously unless the player signed out). Resolves true when ready. Never throws. */
  async init() {
    if (!this.configured) { this.phase = 'off'; this.status = 'not configured'; return false; }
    this.phase = 'connecting'; this.error = null;
    try {
      await this._loadSdk();
      const existing = await new Promise((resolve) => {
        const unsub = this.m.onAuthStateChanged(this.auth, (u) => { unsub(); resolve(u); }, () => resolve(null));
      });
      if (!existing && !LocalBackend.getPref(SIGNED_OUT_PREF, false)) await this.m.signInAnonymously(this.auth);
      this._setUser(this.auth.currentUser);
      return this.ready;
    } catch (e) {
      this._fail(e, 'init');
      this.phase = 'error'; this.ready = false;
      return false;
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
   * Link the anonymous account to Google (popup). If that Google account is
   * already linked elsewhere (another device), sign into it instead so both
   * devices share one save. Returns { ok, switched, error }.
   */
  async linkGoogle() {
    if (!this.ready) return { ok: false, error: 'Cloud save is not connected.' };
    const { GoogleAuthProvider, linkWithPopup, signInWithCredential } = this.m;
    const provider = new GoogleAuthProvider();
    try {
      const res = await linkWithPopup(this.auth.currentUser, provider);
      this._setUser(res.user);
      return { ok: true, switched: false };
    } catch (e) {
      if (e?.code === 'auth/credential-already-in-use' || e?.code === 'auth/email-already-in-use') {
        try {
          const cred = GoogleAuthProvider.credentialFromError(e);
          if (!cred) throw e;
          const res = await signInWithCredential(this.auth, cred);
          this._setUser(res.user);
          return { ok: true, switched: true };
        } catch (e2) {
          console.warn('[FirebaseBackend] sign-in with existing Google account failed', e2);
          return { ok: false, error: friendlyAuthError(e2) };
        }
      }
      console.warn('[FirebaseBackend] link failed', e);
      return { ok: false, error: friendlyAuthError(e) };
    }
  }

  /** Signed out: sign in with Google (popup). Returns { ok, error }. */
  async signInWithGoogle() {
    try {
      await this._loadSdk();
      const res = await this.m.signInWithPopup(this.auth, new this.m.GoogleAuthProvider());
      LocalBackend.setPref(SIGNED_OUT_PREF, false);
      this._setUser(res.user);
      return { ok: true };
    } catch (e) {
      console.warn('[FirebaseBackend] Google sign-in failed', e);
      return { ok: false, error: friendlyAuthError(e) };
    }
  }

  /** Signed out: go back to an anonymous guest cloud save. */
  async continueAsGuest() {
    try {
      await this._loadSdk();
      const res = await this.m.signInAnonymously(this.auth);
      LocalBackend.setPref(SIGNED_OUT_PREF, false);
      this._setUser(res.user);
      return { ok: true };
    } catch (e) {
      this._fail(e, 'guest sign-in');
      return { ok: false, error: friendlyAuthError(e) };
    }
  }

  /** Sign out of the Google account on this device (the local save stays). */
  async signOut() {
    try {
      if (this.m && this.auth) await this.m.signOut(this.auth);
      LocalBackend.setPref(SIGNED_OUT_PREF, true);
      this._setUser(null);
      return { ok: true };
    } catch (e) {
      this._fail(e, 'sign-out');
      return { ok: false, error: friendlyAuthError(e) };
    }
  }
}

/** Plain-English auth errors for toasts. */
export function friendlyAuthError(e) {
  const code = e?.code || '';
  if (code.includes('popup-closed') || code.includes('cancelled-popup')) return 'The sign-in window was closed before finishing.';
  if (code.includes('popup-blocked')) return 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.';
  if (code.includes('network')) return 'No connection. Check your internet and try again.';
  if (code.includes('unauthorized-domain')) return 'Sign-in is not enabled for this web address yet.';
  if (code.includes('operation-not-allowed')) return 'Google sign-in is not turned on for this game yet.';
  return 'Something went wrong. Please try again.';
}
