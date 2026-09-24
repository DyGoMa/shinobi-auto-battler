// firebase-config.js — paste your Firebase web app config here (see FIREBASE_SETUP.md).
//
// While these are placeholders ("PASTE_..."), cloud save stays OFF and the game
// shows "Cloud save: not configured" in Settings. Local saves still work.
//
// Where to find these values: Firebase console -> Project settings (gear icon)
// -> "Your apps" -> your web app -> "SDK setup and configuration" -> Config.
// Copy each value between the quotes. Example of what a filled line looks like:
//   apiKey: "AIzaSyB-EXAMPLE-EXAMPLE-EXAMPLE",
//
// It is safe to commit these to a public repo: a Firebase web API key only
// identifies the project; access is controlled by firestore.rules + Auth.
export const firebaseConfig = {
  apiKey: "AIzaSyDkzA8fHB-F1QQLDAxOX_GMNeoCDLOwEOY",
  authDomain: "inbox-zero-480418.firebaseapp.com",
  projectId: "inbox-zero-480418",
  storageBucket: "inbox-zero-480418.firebasestorage.app",
  messagingSenderId: "617837842966",
  appId: "1:617837842966:web:51b57ae5570c9f183b5b37",
};

/** True only when every field has been replaced with a real value. */
export function isFirebaseConfigured(cfg = firebaseConfig) {
  return Object.values(cfg).every(v => typeof v === 'string' && v.length > 0 && !v.includes('PASTE_'));
}
