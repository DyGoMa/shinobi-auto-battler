// Version.js — the build stamp ("v<short sha> · <UTC build date>") shown on the
// start menu and in Settings. GitHub Actions writes version.json next to
// index.html on every deploy (.github/workflows/pages.yml). The file is never
// committed, so a local checkout (npm run serve, file://) has none and the stamp
// reads "dev". Pure, apart from the fetch, which tests inject.
export const DEV_LABEL = 'dev';

/** { label, dev, sha?, shortSha?, builtAt? } for a version.json object; "dev" for anything unusable. */
export function formatBuild(info) {
  if (!info || typeof info !== 'object') return { label: DEV_LABEL, dev: true };
  const sha = String(info.shortSha || info.sha || '').slice(0, 7);
  const d = new Date(info.builtAt);
  if (!sha || Number.isNaN(d.getTime())) return { label: DEV_LABEL, dev: true };
  const pad = (n) => String(n).padStart(2, '0');
  const when = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
  return { label: `v${sha} · ${when}`, dev: false, sha: String(info.sha || sha), shortSha: sha, builtAt: d.toISOString() };
}

/** Fetches version.json with a cache-buster. Missing, unreadable or offline: "dev". Never throws. */
export async function loadBuildInfo({ fetchImpl = globalThis.fetch, url = 'version.json' } = {}) {
  try {
    if (typeof fetchImpl !== 'function') return formatBuild(null);
    const res = await fetchImpl(`${url}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res || !res.ok) return formatBuild(null);
    return formatBuild(await res.json());
  } catch { return formatBuild(null); }
}
