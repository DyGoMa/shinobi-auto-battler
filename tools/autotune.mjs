// tools/autotune.mjs — suggests per-boss difficulty multipliers
// (balance.enemyScaling.nodeMult) so every boss node hits its target win rate
// for the "on-curve" team used by `npm run sim`.
//
//   node tools/autotune.mjs            # print suggestions
//   node tools/autotune.mjs --write    # also rewrite the nodeMult block in balance.js
//   TUNE_N=200 TUNE_ITERS=7 node tools/autotune.mjs
//
// Targets: arc-final bosses -> middle of targets.bossWinRange; mid-arc boss
// nodes -> 0.78. Non-boss node entries already in nodeMult are kept as-is.
// It only ever edits js/config/balance.js (the one place tuning belongs).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { C, B, runNode, onCurveTeam, seedFor } from './common.mjs';

const N = Number(process.env.TUNE_N) || B.targets.battlesPerScenario;
const ITERS = Number(process.env.TUNE_ITERS) || 7;
const WRITE = process.argv.includes('--write');
const only = process.argv.find(a => a.startsWith('--only='))?.slice(7).split(',');

const [lo0, hi0] = B.targets.bossWinRange;
const finalGoal = (lo0 + hi0) / 2;
const midGoal = 0.78;
const result = { ...B.enemyScaling.nodeMult };

for (const node of C.nodes.filter(n => n.isBossNode && (!only || only.includes(n.id)))) {
  const arc = C.arc[node.arcId];
  const goal = arc.nodes[arc.nodes.length - 1] === node ? finalGoal : midGoal;
  const { team, owned } = onCurveTeam(node);
  const rate = (m) => {
    B.enemyScaling.nodeMult[node.id] = { hp: m, atk: m };
    let w = 0;
    for (let i = 0; i < N; i++) if (runNode(node, team, owned, seedFor(node.id, i)).state === 'won') w++;
    return w / N;
  };
  const cur = B.enemyScaling.nodeMult[node.id]?.hp ?? 1;
  let lo = Math.log(cur * 0.5), hi = Math.log(cur * 2);
  let best = cur, bestErr = Infinity, bestRate = 0;
  for (let it = 0; it < ITERS; it++) {
    const m = Math.round(Math.exp((lo + hi) / 2) * 100) / 100;
    const r = rate(m);
    if (Math.abs(r - goal) < bestErr) { bestErr = Math.abs(r - goal); best = m; bestRate = r; }
    if (r > goal) lo = Math.log(m); else hi = Math.log(m);
  }
  result[node.id] = { hp: best, atk: best };
  B.enemyScaling.nodeMult[node.id] = result[node.id];
  console.log(`${node.id.padEnd(14)} goal ${goal.toFixed(2)}  ->  nodeMult ${best.toFixed(2)}  (win ${(bestRate * 100).toFixed(0)}%)`);
}

const lines = Object.entries(result).map(([id, v]) => `      ${(id + ':').padEnd(13)}{ hp: ${v.hp.toFixed(2)}, atk: ${v.atk.toFixed(2)} },`);
const block = `nodeMult: {\n${lines.join('\n')}\n    },`;
console.log('\n    ' + block);
if (WRITE) {
  const path = fileURLToPath(new URL('../js/config/balance.js', import.meta.url));
  const src = readFileSync(path, 'utf8');
  const next = src.replace(/nodeMult: \{[\s\S]*?\n {4}\},/, block);
  if (next === src) { console.error('Could not find the nodeMult block in balance.js'); process.exit(1); }
  writeFileSync(path, next);
  console.log('\nWrote nodeMult to js/config/balance.js');
}
