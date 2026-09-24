// FirebaseBackend.js — Firestore cloud save with Anonymous Auth (+ optional
// Google account linking for cross-device sync).
// The Firebase modular SDK is loaded as ES modules from gstatic, pinned to an
// exact version. If firebase-config.js still has placeholders this backend is
// a no-op and Settings shows "Cloud save: not configured".
//
// Save location: users/{uid}/save/main  (see firestore.rules)
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

export const FIREBASE_SDK_VERSION = '12.19.0';
const SDK = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;

export class FirebaseBackend {
  constructor(config = firebaseConfig) {
    this.name = 'firebase';
    this.config = config;
    this.ready = false;
    this.status = isFirebaseConfigured(config) ? 'connecting…' : 'not configured';
    this.user = null;
    this.m = null;
  }

  get configured() { return isFirebaseConfigured(this.config); }
  get isAnonymous() { return !!this.user?.isAnonymous; }
  get accountLabel() { return this.user ? (this.user.isAnonymous ? 'Guest (anonymous)' : (this.user.email || 'Google account')) : 'signed out'; }

  /** Load the SDK and sign in anonymously. Resolves true when ready. Never throws. */
  async init() {
    if (!this.configured) { this.status = 'not configured'; return false; }
    try {
      const [appMod, authMod, fsMod] = await Promise.all([
        import(`${SDK}/firebase-app.js`),
        import(`${SDK}/firebase-auth.js`),
        import(`${SDK}/firebase-firestore.js`),
      ]);
      this.m = { ...appMod, ...authMod, ...fsMod };
      this.app = appMod.initializeApp(this.config);
      this.auth = authMod.getAuth(this.app);
      this.db = fsMod.getFirestore(this.app);
      const existing = await new Promise((resolve) => {
        const unsub = authMod.onAuthStateChanged(this.auth, (u) => { unsub(); resolve(u); }, () => resolve(null));
      });
      if (!existing) await authMod.signInAnonymously(this.auth);
      this.user = this.auth.currentUser;
      this.ready = !!this.user;
      this.status = this.ready ? `connected — ${this.accountLabel}` : 'sign-in failed';
      return this.ready;
    } catch (e) {
      console.warn('[FirebaseBackend] init failed', e);
      this.status = `error: ${e?.code || e?.message || 'unknown'}`;
      this.ready = false;
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
      console.warn('[FirebaseBackend] load failed', e);
      this.status = `error loading: ${e?.code || e?.message}`;
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
      this.status = `synced — ${this.accountLabel}`;
      return true;
    } catch (e) {
      console.warn('[FirebaseBackend] save failed', e);
      this.status = `error saving: ${e?.code || e?.message}`;
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
      this.user = res.user; this.status = `connected — ${this.accountLabel}`;
      return { ok: true, switched: false };
    } catch (e) {
      if (e?.code === 'auth/credential-already-in-use' || e?.code === 'auth/email-already-in-use') {
        try {
          const cred = GoogleAuthProvider.credentialFromError(e);
          if (!cred) throw e;
          const res = await signInWithCredential(this.auth, cred);
          this.user = res.user; this.status = `connected — ${this.accountLabel}`;
          return { ok: true, switched: true };
        } catch (e2) {
          console.warn('[FirebaseBackend] sign-in with existing Google account failed', e2);
          return { ok: false, error: e2?.code || e2?.message || 'sign-in failed' };
        }
      }
      console.warn('[FirebaseBackend] link failed', e);
      return { ok: false, error: e?.code || e?.message || 'link failed' };
    }
  }
}
