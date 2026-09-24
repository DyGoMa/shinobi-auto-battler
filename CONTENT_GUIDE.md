# CONTENT_GUIDE.md — adding characters, enemies, bosses, arcs, nodes and banners

Adding content **never needs engine changes**: every entry is plain data in
`js/content/`. After any change:

```bash
npm run validate
```
```bash
npm run sim
```

`validate` checks every entry: required fields, valid natures, roles and types, that every
reference points at something real, and no duplicate ids anywhere.

Two more things happen outside `js/content/`:
* **Names:** add every new name to `tools/naming-sources.mjs` with the Narutopedia page you checked, then run `node tools/naming.mjs --write` to refresh NAMING.md.
* **Balance numbers** stay in `js/config/balance.js`. Content only uses *relative* weights (1 = average).

| File | Holds |
|---|---|
| `js/content/roster.js` | pullable characters and alternate forms (`ROSTER`, `TAGS`) |
| `js/content/enemies.js` | enemies, bosses, summoned adds, protect targets (`ENEMIES`), `BOSS_RUSH` |
| `js/content/arcs/part1.js` | Part I arcs and nodes |
| `js/content/arcs/part2-placeholders.js` | greyed-out Part II arcs (Session 2 replaces this) |
| `js/content/banners.js` | summon banners |
| `js/content/index.js` | merges everything, computes global node order, validates |

Shared vocabulary:
* **natures:** `Fire`, `Wind`, `Lightning`, `Earth`, `Water` (the Nature Wheel order is in balance.js).
* **tiers:** `genin` (Common), `chunin` (Rare), `jonin` (Epic), `kage` (Legendary).
* **roles:** `Tank`, `Striker`, `Ranged`, `Support` (+ `Civilian` for enemies you protect).

---

## 1. Pullable character (`roster.js`)

### Template
```js
{
  id: 'unique_id', name: 'Dub Name', short: 'Short', tier: 'chunin', role: 'Striker',
  natures: ['Fire'],               // [] = neutral. First entry = the nature it defends with.
  // taijutsu: true,               // taijutsu specialist: must have natures: []
  stats: { hp: 1.0, atk: 1.0, def: 1.0 },   // relative weights; optional: interval, speed, crit
  ult: { name: 'Dub Jutsu Name', type: 'single', nature: 'Fire' /*, stun: true */ },
  leader: { stat: 'atk', scope: { tag: 'team7' } },   // or { nature }, { role }, { tier }; omit scope = whole team
  tags: ['leaf'],                   // used by leader scopes (labels in TAGS)
  unlock: null,                     // or { arcCleared: 'arc_id' } / { arcReached: 'arc_id' }
  color: '#rrggbb', initials: 'AB', emoji: '🙂',   // unique colour; the only "art"
},
```
* **Ult types by role:**
  * Striker/Ranged: `single` | `aoe`
  * Tank: `taunt`
  * Support: `heal` | `buff`
  * `stun: true` adds a stun to `single`/`aoe`.
* **Leader stats:** `atk, hp, def, speed, crit, chakra, startChakra, nature`. The numbers come from `balance.leader`.
* **Starters:** `starter: true` (and `starterLeader: true` for the first Leader) define the first-load team.

### Worked example: Temari
```js
{
  id: 'temari', name: 'Temari', short: 'Temari', tier: 'chunin', role: 'Ranged', natures: ['Wind'],
  stats: { hp: 1.0, atk: 1.05, def: 0.95 },
  ult: { name: 'Ninja Art: Wind Scythe Jutsu', type: 'aoe', nature: 'Wind' },
  leader: { stat: 'atk', scope: { nature: 'Wind' } },
  tags: ['sand'], unlock: { arcCleared: 'arc_konoha_crush' },
  color: '#ca8a04', initials: 'TE', emoji: '🪭',
},
```

## 2. Alternate form (`roster.js`)
The same schema plus `formOf`. A team can't field a character and their form together, and each form levels separately.
Late-game strength should come from forms (a higher tier or stronger weights), not from making early characters useless.

### Worked example: Naruto (Nine-Tails Chakra)
```js
{
  id: 'naruto_ninetails', formOf: 'naruto', name: 'Naruto Uzumaki (Nine-Tails Chakra)', short: 'Naruto★',
  tier: 'jonin', role: 'Striker', natures: ['Wind'],
  stats: { hp: 1.1, atk: 1.05, def: 1.0 },
  ult: { name: 'Rasengan', type: 'single', nature: 'Wind' },
  leader: { stat: 'startChakra', scope: { tag: 'team7' } },
  tags: ['team7', 'leaf'], unlock: { arcCleared: 'arc_sasuke_recovery' },
  color: '#ea580c', initials: 'NU', emoji: '🦊',
},
```

## 3. Enemy (`enemies.js`)

### Template
```js
{
  id: 'e_unique_id', name: 'Dub Name', role: 'Striker', natures: ['Water'],
  stats: { hp: 1.0, atk: 1.0, def: 1.0 },            // relative weights only
  jutsu: { name: 'Dub Jutsu', nature: 'Water', type: 'single' },  // optional: cast when chakra fills, always telegraphed & clashable
  // targeting: 'backline' | 'protected',            // default 'nearest'; 'protected' = dives for the escort
  // mechanics: [ ... ],                             // see §4
  // basedOn: 'roster_id',                           // for enemy versions of pullable characters
  color: '#rrggbb', initials: 'AB', emoji: '🙂',
},
```
Real stats = role template × weights × enemy level (by the node's global index) × `enemyScaling` multipliers. **Never** put absolute numbers in content.

### Worked example: Kin Tsuchi (back-line sniper)
```js
{ id: 'e_kin', name: 'Kin Tsuchi', role: 'Ranged', natures: [], targeting: 'backline',
  stats: { hp: 0.85, atk: 0.9, def: 0.9 },
  jutsu: { name: 'Shadow Senbon', type: 'single' },
  color: '#a1a1aa', initials: 'KT', emoji: '🔔' },
```

### Protect target (escort)
```js
{ id: 'npc_tazuna', name: 'Tazuna', role: 'Civilian', natures: [], stats: { hp: 1.0 }, color: '#a8a29e', initials: 'TZ', emoji: '🌉' },
```

## 4. Boss mechanics (any enemy can have them)
Every mechanic has a `type` and a `name` (shown on screen; `lifesteal`/`regen` may omit it).
`power`, `interval` and `windup` are **relative** weights (1 = the default in `balance.bossMechanics`). HP thresholds use `atHp: [0.6, 0.3]` (fractions).

| type | fields | example |
|---|---|---|
| `telegraphAoE` | `nature` (or `null` = no nature), `target: 'all' \| 'front' \| 'back' \| 'random'`, `stun?`, `power?`, `interval?`, `windup?`, `atHp?` | `{ type: 'telegraphAoE', name: 'Water Style: Water Dragon Jutsu', nature: 'Water', target: 'all' }` |
| `summonAdds` | `enemy` (enemy id), `count?`, `interval?` **or** `atHp` | `{ type: 'summonAdds', name: 'Summoning Jutsu', enemy: 'e_manda', count: 1, atHp: [0.65] }` |
| `shieldPhase` | `atHp` (required), `power?` | `{ type: 'shieldPhase', name: 'Sand Shield', atHp: [0.75, 0.45] }` |
| `enrage` | `atHp` or timer (`interval?`), `power?` | `{ type: 'enrage', name: 'Play Possum Jutsu', atHp: [0.3] }` |
| `elementSwap` | `sequence` (2+ natures), `interval?` or `atHp` | `{ type: 'elementSwap', name: 'Blade of the Thunder Spirit', sequence: ['Water', 'Lightning'], atHp: [0.7] }` |
| `reflect` | `interval?`, `power?` | `{ type: 'reflect', name: 'Eight Trigrams: Palm Rotation' }` |
| `lifesteal` | `power?` | `{ type: 'lifesteal', name: 'Shark Skin' }` |
| `reviveOnce` | `power?` (share of HP) | `{ type: 'reviveOnce', name: "Heavens' Curse Mark" }` |
| `regen` | `power?` | `{ type: 'regen', name: 'Healing Jutsu' }` |
| `rally` | `interval?`, `power?` | `{ type: 'rally', name: "Ranmaru's eyes guide Raiga" }` |

### Worked example: a full boss (Gaara, Naruto vs. Gaara)
```js
{
  id: 'e_gaara_boss', name: 'Gaara', basedOn: 'gaara', role: 'Ranged', natures: ['Wind'],
  stats: { hp: 1.05, atk: 0.9, def: 1.1 },
  jutsu: { name: 'Sand Coffin', type: 'single' },
  mechanics: [
    { type: 'telegraphAoE', name: 'Wind Style: Air Bullet', nature: 'Wind', target: 'all' },
    { type: 'shieldPhase', name: 'Sand Shield', atHp: [0.75, 0.45] },
    { type: 'enrage', name: 'Play Possum Jutsu', atHp: [0.3] },
  ],
  color: '#b91c1c', initials: 'GA', emoji: '🏺',
},
```
A unit only becomes a *boss* (boss stat multiplier, crown, boss HP bar) when a node lists it with `boss: true`.

## 5. Arc and nodes (`arcs/part1.js`, Session 2: `arcs/shippuden.js`)

### Arc template
```js
{
  id: 'arc_unique', part: 2, order: 1, name: 'Dub Arc Name', episodes: '1–32',
  blurb: 'One or two sentences.',
  banner: 'banner_unique',                     // optional arc banner id
  theme: { sky: ['#top', '#horizon'], ground: '#ground', far: '#hills', accent: '#accent' },
  nodes: [ /* 3–5 nodes; the LAST must contain an enemy with boss: true */ ],
},
```
* **Order:** arcs are sorted by `part`, then `order`.
* **Global node index:** each node's index across the whole campaign sets its enemy level and rewards (balance.js curves), so Part II just continues the curve.

### Node template
```js
{
  id: 'n_unique', name: 'Node Title', episodes: '12–17', blurb: 'What happens.',
  enemies: [{ id: 'e_enemy' }, { id: 'e_boss', boss: true }, { id: 'e_add', delay: 20 }],
  objective: { type: 'defeatAll' },
  team: { forced: [], leader: undefined, banned: [], recommended: [] },   // all optional
},
```

**Objectives:**
* `{ type: 'defeatAll' }`
* `{ type: 'survive', seconds: 45 }`: also wins if every enemy falls.
* `{ type: 'protect', protect: 'npc_id', seconds?: 40 }`: you lose if the escort falls.
* `{ type: 'defeatBoss' }`: only `boss: true` units matter, and your team focuses the boss.

**Team rules:**
* `forced`: ninja who must fight. If the player doesn't own them, they join as level-matched loaners.
* `leader: 'none'`: no Leader buff. `leader: 'id'` fixes the Leader.
* `banned`: these ninja sit out.
* `recommended`: shown to the player and nudges the Auto picker.

### Worked examples (one per objective)
```js
// survive — node 1, the Bell Test (Team 7 without their sensei)
{ id: 'n_bell_1', name: 'Pass or Fail: Survival Test', episodes: '4',
  blurb: 'Survive 45 seconds against Kakashi — or take him down.',
  enemies: [{ id: 'e_kakashi_bell' }], objective: { type: 'survive', seconds: 45 },
  team: { forced: ['naruto', 'sakura', 'sasuke'], leader: 'none', banned: ['kakashi'] }, onboarding: true },

// protect — Meizu dives for Tazuna
{ id: 'n_waves_1', name: 'The Demon Brothers', episodes: '6', blurb: '…',
  enemies: [{ id: 'e_gozu' }, { id: 'e_meizu' }], objective: { type: 'protect', protect: 'npc_tazuna' } },

// defeatBoss + flashback team — fight as the Third Hokage
{ id: 'n_crush_3', name: "The Third Hokage's Last Stand", episodes: '69–80', blurb: '…',
  enemies: [{ id: 'e_hashirama' }, { id: 'e_tobirama' }, { id: 'e_orochimaru_crush', boss: true }],
  objective: { type: 'defeatBoss' }, team: { forced: ['hiruzen'], leader: 'hiruzen' } },

// defeatAll with a delayed wave
{ id: 'n_crush_1', name: 'Zero Hour', episodes: '68–70', blurb: '…',
  enemies: [{ id: 'e_sand_ninja' }, { id: 'e_sound_ninja' }, { id: 'e_sand_ninja', delay: 8 }],
  objective: { type: 'defeatAll' } },
```

## 6. Banner (`banners.js`)
```js
{ id: 'banner_unique', type: 'arc', arc: 'arc_unique', name: 'Banner Name',
  blurb: 'Rate-up: …', featured: ['char_id', 'char_id'] },
```
* **When it opens:** a `type: 'arc'` banner opens when the player *reaches* its arc.
* **Rate-up:** featured characters share `balance.gacha.rateUpShare` of their tier's rate, but only once they're unlocked (roster `unlock`).
* **Standard banner:** there is exactly one `type: 'standard'` banner.

### Worked example
```js
{ id: 'banner_waves', type: 'arc', arc: 'arc_waves', name: 'Demon of the Hidden Mist',
  blurb: 'Rate-up: Zabuza and Haku (join after the Land of Waves), Kakashi.', featured: ['zabuza', 'haku', 'kakashi'] },
```

## 7. Boss Rush (`enemies.js` → `BOSS_RUSH`)
```js
export const BOSS_RUSH = {
  name: 'Akatsuki Boss Rush', unlockArc: 'arc_sasuke_recovery',
  order: ['e_br_kisame', 'e_br_deidara', /* … */ 'e_br_pain'],   // each needs one telegraphAoE special
};
```
Round strength comes from `balance.bossRush` (`levelByRound`, `statMultByRound`, `loopMult`).

## 8. Session 2 checklist (adding Shippuden)
1. Create `js/content/arcs/shippuden.js` exporting `SHIPPUDEN_ARCS` (the same schema, with `part: 2`).
2. In `js/content/index.js`, import it, add it to `ARC_FILES`, and remove `PART2_PLACEHOLDERS`.
3. Add characters and forms to `roster.js`, enemies and bosses to `enemies.js`, and banners to `banners.js`.
4. Add every new name to `tools/naming-sources.mjs`, then run `node tools/naming.mjs --write`.
5. Run `npm run validate`, then `npm run autotune -- --write` for the new bosses, then `npm run sim` and `npm run campaign`. Extend `campaign-sim.mjs`'s `part === 1` filter if Part II should be included.
