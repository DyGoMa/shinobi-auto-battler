// tools/autotune.mjs — suggests per-boss difficulty multipliers so every boss node
// hits its target win rate for the "on-curve" team used by `npm run sim`:
// the story's bosses (balance.enemyScaling.nodeMult) and Hard mode's bosses
// (balance.hardMode.nodeMult, tuned for Hard mode's on-curve team).
//
//   node tools/autotune.mjs                  # print suggestions (story and Hard)
//   node tools/autotune.mjs --write          # also rewrite both nodeMult blocks in balance.js
//   node tools/autotune.mjs --mode=hard      # only Hard mode (or --mode=story)
//   node tools/autotune.mjs --only=n_tea_3   # only these nodes
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
const mode = process.argv.find(a => a.startsWith('--mode='))?.slice(7) || 'all';

const [lo0, hi0] = B.targets.bossWinRange;
const finalGoal = (lo0 + hi0) / 2;
const midGoal = 0.78;

function tune(hard) {
  const table = hard ? B.hardMode.nodeMult : B.enemyScaling.nodeMult;
  const result = { ...table };
  console.log(`\n${hard ? 'Hard mode' : 'Story'} bosses (${N} battles per step, ${ITERS} steps):`);
  for (const node of C.nodes.filter(n => n.isBossNode && (!only || only.includes(n.id)))) {
    const arc = C.arc[node.arcId];
    const goal = arc.nodes[arc.nodes.length - 1] === node ? finalGoal : midGoal;
    const { team, owned } = onCurveTeam(node, { hard });
    const rate = (m) => {
      table[node.id] = { hp: m, atk: m };
      let w = 0;
      for (let i = 0; i < N; i++) if (runNode(node, team, owned, seedFor(node.id, i), { hard }).state === 'won') w++;
      return w / N;
    };
    // Hard falls back to the story's value, and starts from a wider search window.
    const cur = table[node.id]?.hp ?? (hard ? B.enemyScaling.nodeMult[node.id]?.hp : null) ?? 1;
    const span = hard ? 3 : 2;
    let lo = Math.log(cur / span), hi = Math.log(cur * span);
    let best = cur, bestErr = Infinity, bestRate = 0;
    for (let it = 0; it < ITERS + (hard ? 2 : 0); it++) {
      const m = Math.round(Math.exp((lo + hi) / 2) * 100) / 100;
      const r = rate(m);
      if (Math.abs(r - goal) < bestErr) { bestErr = Math.abs(r - goal); best = m; bestRate = r; }
      if (r > goal) lo = Math.log(m); else hi = Math.log(m);
    }
    result[node.id] = { hp: best, atk: best };
    table[node.id] = result[node.id];
    console.log(`${node.id.padEnd(14)} goal ${goal.toFixed(2)}  ->  nodeMult ${best.toFixed(2)}  (win ${(bestRate * 100).toFixed(0)}%)`);
  }
  return result;
}

const blockOf = (result, indent) => {
  const lines = Object.entries(result).map(([id, v]) => `${indent}  ${(id + ':').padEnd(13)}{ hp: ${v.hp.toFixed(2)}, atk: ${v.atk.toFixed(2)} },`);
  return `nodeMult: {\n${lines.join('\n')}\n${indent}},`;
};

const story = mode === 'hard' ? null : tune(false);
const hard = mode === 'story' ? null : tune(true);
if (story) console.log('\n    ' + blockOf(story, '    '));
if (hard) console.log('\n    ' + blockOf(hard, '    '));
if (WRITE) {
  const path = fileURLToPath(new URL('../js/config/balance.js', import.meta.url));
  let src = readFileSync(path, 'utf8');
  if (story) {
    const next = src.replace(/(enemyScaling: \{[\s\S]*?)nodeMult: \{[\s\S]*?\n {4}\},/, (m, pre) => pre + blockOf(story, '    '));
    if (next === src) { console.error('Could not find enemyScaling.nodeMult in balance.js'); process.exit(1); }
    src = next;
  }
  if (hard) {
    const next = src.replace(/(hardMode: \{[\s\S]*?)nodeMult: \{[\s\S]*?\n {4}\},/, (m, pre) => pre + blockOf(hard, '    '));
    if (next === src) { console.error('Could not find hardMode.nodeMult in balance.js'); process.exit(1); }
    src = next;
  }
  writeFileSync(path, src);
  console.log('\nWrote nodeMult to js/config/balance.js');
}
