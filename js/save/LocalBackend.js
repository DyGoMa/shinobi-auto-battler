// LocalBackend.js — localStorage save backend. Every call is wrapped in try/catch
// (private mode, quota errors and disabled storage must never crash the game).
export const LOCAL_KEY = 'shinobi-auto-battler:save';

export class LocalBackend {
  constructor(key = LOCAL_KEY) { this.key = key; this.name = 'local'; }

  isAvailable() {
    try { const k = this.key + ':probe'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; }
    catch { return false; }
  }

  async load() {
    try {
      const txt = localStorage.getItem(this.key);
      if (!txt) return null;
      const data = JSON.parse(txt);
      return { data, updatedAt: Number(data?.updatedAt) || 0 };
    } catch (e) {
      console.warn('[LocalBackend] corrupted save ignored', e);
      try { localStorage.setItem(this.key + ':corrupt-backup', localStorage.getItem(this.key) || ''); } catch { /* ignore */ }
      return null;
    }
  }

  save(data) {
    try { localStorage.setItem(this.key, JSON.stringify(data)); return true; }
    catch (e) { console.warn('[LocalBackend] save failed', e); return false; }
  }

  clear() { try { localStorage.removeItem(this.key); } catch { /* ignore */ } }

  // Small per-device preferences that don't belong in the synced save.
  static getPref(k, fallback = null) { try { const v = localStorage.getItem('shinobi-auto-battler:pref:' + k); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } }
  static setPref(k, v) { try { localStorage.setItem('shinobi-auto-battler:pref:' + k, JSON.stringify(v)); } catch { /* ignore */ } }
}
