// tools/check-syntax.mjs — runs `node --check` on every JS/MJS file and
// verifies that every relative import path resolves to a real file.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    if (f === 'node_modules' || f.startsWith('.')) continue;
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(m?js)$/.test(f)) files.push(p);
  }
})(ROOT);

let bad = 0;
for (const f of files) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); }
  catch (e) { bad++; console.log(`✗ syntax: ${relative(ROOT, f)}\n${e.stderr?.toString() || e.message}`); }
  const src = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const m of src.matchAll(/(?:import|export)\s[^'"]*?from\s*['"](\.{1,2}\/[^'"]+)['"]|import\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g)) {
    const spec = m[1] || m[2];
    const target = resolve(dirname(f), spec);
    if (!existsSync(target)) { bad++; console.log(`✗ import: ${relative(ROOT, f)} -> ${spec} (missing)`); }
  }
}
console.log(`${bad ? 'FAIL' : 'PASS'} — node --check on ${files.length} files, all relative imports resolve${bad ? ` (${bad} problem(s))` : ''}.`);
process.exit(bad ? 1 : 0);
