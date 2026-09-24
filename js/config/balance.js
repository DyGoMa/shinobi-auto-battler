// =============================================================================
// balance.js — EVERY tunable number in the game lives here, and nowhere else.
// =============================================================================
// How to read this file (see BALANCE.md for a plain-English guide):
//   * Plain numbers are constants.
//   * "Curve specs" are scaling values evaluated by curve(spec, x) in
//     js/core/formulas.js:
//       { type: 'linear', base, growth }       -> base + growth * x
//       { type: 'poly',   base, growth }       -> base * x ^ growth
//       { type: 'exp',    base, growth }       -> base * growth ^ x
//       { type: 'step',   base, table: [[x0, v0], [x1, v1], ...] }
//                                               -> v of the last row with x >= x_i
//                                                  (base if x is below every row)
//     Every curve may also carry `cap` (max value), `min`, and `round: true`.
//   * Each value has a comment: what it does, and a "sane range".
//   * The ?debug=1 panel edits this object live and can export it.
// =============================================================================

export const BALANCE = {
  // ---------------------------------------------------------------------------
  // STATS — how strong pullable characters are.
  // Final stat = role base × character weight × rarity mult × level mult × star mult
  // ---------------------------------------------------------------------------
  stats: {
    // Base stats per role at level 1, 1★, rarity mult 1.0, weight 1.0.
    // hp: 1200–5000, atk: 50–160, def: 10–90, attackInterval (s between
    // auto-attacks): 0.7–1.8, moveSpeed (px/s on the 1280px lane): 50–120,
    // critChance: 0–0.3. range is a key into `ranges` below.
    roles: {
      Tank:    { hp: 3000, atk: 74,  def: 62, attackInterval: 1.35, range: 'melee', moveSpeed: 72, critChance: 0.05 },
      Striker: { hp: 2050, atk: 112, def: 36, attackInterval: 1.0,  range: 'reach', moveSpeed: 90, critChance: 0.15 },
      Ranged:  { hp: 1650, atk: 104, def: 26, attackInterval: 1.4,  range: 'long',  moveSpeed: 76, critChance: 0.10 },
      Support: { hp: 1850, atk: 76,  def: 32, attackInterval: 1.25, range: 'mid',   moveSpeed: 76, critChance: 0.05 },
      // Non-combat escort targets for "protect" objectives (Tazuna, Idate...).
      Civilian:{ hp: 2600, atk: 0,   def: 30, attackInterval: 99,   range: 'melee', moveSpeed: 0,  critChance: 0 },
    },
    // Attack reach in lane pixels, centre to centre. Units queue without stacking
    // (lane.allySpacing apart), so only units whose range covers their queue slot
    // can hit: melee (Tanks) must be in contact; 'reach' (Strikers) can also hit
    // from directly behind a Tank; mid/long fire over the line.
    // melee 55–75, reach 100–140, mid 180–280, long 300–450.
    ranges: { melee: 64, reach: 118, mid: 230, long: 380 },
    // Stat multiplier per gacha tier. Keep genin×(1+4×starBonus) ≈ kage so every
    // tier stays viable once starred up. Range 1.0–2.0.
    rarityMult: { genin: 1.0, chunin: 1.12, jonin: 1.25, kage: 1.4 },
    // Stat multiplier by level. x = level − 1. Linear keeps "a few levels behind"
    // forgiving at any point of the campaign. growth 0.04–0.12.
    levelMult: { type: 'linear', base: 1, growth: 0.07 },
    // Highest level a ninja can reach. Part 1 (32 nodes) ends at enemy level 30 (~1/3 of the cap);
    // leaves room for ~90 story nodes. Range 60–150.
    levelCap: 100,
    // Flat bonus to all stats per star above 1★ (0.10 = +10% per star). Range 0.05–0.2.
    starBonus: 0.10,
    // Maximum stars. Range 3–10.
    starCap: 5,
    // Ryo refunded for a duplicate pulled after the character is already at starCap.
    // Range: 100–10000 per tier.
    dupeRefundRyo: { genin: 250, chunin: 600, jonin: 1500, kage: 4000 },
  },

  // ---------------------------------------------------------------------------
  // ECONOMY — currencies in and out.
  // Scrolls = summon currency. Ryo = upgrade currency.
  // ---------------------------------------------------------------------------
  economy: {
    // Currencies on a brand-new save. scrolls 0–5000, ryo 0–5000.
    start: { scrolls: 1500, ryo: 500 },
    // Ryo cost to go from level x to x+1. Sum of this curve sets how fast teams
    // level. base 20–200, growth 5–60 (linear).
    levelUpCost: { type: 'linear', base: 60, growth: 34 },
    // Catch-up discount: levelling a ninja that is at least `gap` levels below
    // your highest-level ninja costs (1 − discount) of the normal price, so
    // swapping in a nature counter mid-campaign is affordable.
    // gap 3–15, discount 0–0.8
    catchUp: { gap: 5, discount: 0.6 },
    // Rewards for the FIRST clear of a story node. x = global node index (0-based,
    // across Part 1 and later parts). scrolls base 50–300; ryo base 100–1000.
    nodeFirstClear: {
      scrolls: { type: 'linear', base: 160, growth: 3, round: true },
      ryo:     { type: 'linear', base: 520, growth: 110, round: true },
    },
    // Rewards for replaying an already-cleared node (farming). x = global node index.
    nodeReplay: {
      scrolls: { type: 'linear', base: 15, growth: 0.5, round: true },
      ryo:     { type: 'linear', base: 600, growth: 130, round: true },
    },
    // Multiplier on first-clear rewards for boss nodes. Range 1–3.
    bossNodeBonusMult: 1.5,
    // One-time bonus for clearing every node of an arc. x = arc index (0-based).
    arcClearBonus: {
      scrolls: { type: 'linear', base: 300, growth: 25, round: true },
      ryo:     { type: 'linear', base: 1500, growth: 450, round: true },
    },
    // Boss Rush rewards for clearing round x (1-based). Paid every time.
    bossRush: {
      scrolls: { type: 'linear', base: 40, growth: 20, round: true },
      ryo:     { type: 'linear', base: 800, growth: 350, round: true },
    },
    // Summon prices in scrolls. single 50–300; ten usually 9× single.
    pullCost: { single: 100, ten: 900 },
  },

  // ---------------------------------------------------------------------------
  // GACHA
  // ---------------------------------------------------------------------------
  gacha: {
    // Base tier rates. Must sum to 1.
    rates: { genin: 0.60, chunin: 0.28, jonin: 0.10, kage: 0.02 },
    // A 10-pull always contains at least one of this tier or better.
    tenPullGuaranteeTier: 'jonin',
    // Guaranteed Kage on this pull if none was pulled before it (visible counter).
    // Range 30–100.
    pity: 50,
    pityTier: 'kage',
    // On an arc banner, share of a tier's probability that goes to that tier's
    // featured (rate-up) characters when any are available. Range 0.3–0.8.
    rateUpShare: 0.5,
  },

  // ---------------------------------------------------------------------------
  // COMBAT
  // ---------------------------------------------------------------------------
  combat: {
    // Simulation tick in seconds (fixed step; smaller = more precise, slower). 1/60–1/20.
    tick: 1 / 30,
    // Hard time limit per battle in seconds; reaching it counts as a loss unless the
    // objective is "survive". Range 90–240.
    timeLimit: 150,
    // Defense constant: damage × K/(K+DEF). x = attacker level − 1. Keep its growth
    // proportional to stats.levelMult so DEF matters equally at every level.
    defenseK: { type: 'linear', base: 100, growth: 7 },
    // ±random spread on every hit. 0–0.3.
    variance: 0.15,
    // Crit damage multiplier. 1.3–2.5.
    critMult: 1.7,
    // Chance an AUTO-attack misses outright (ults and jutsu always land). 0–0.15
    dodgeChance: 0.05,
    // Random ± share applied to boss-mechanic timers and enemy starting chakra,
    // so fights aren't identical. 0–0.5
    timingJitter: 0.3,
    // Enemies start with a random 0..this chakra. 0–80
    enemyStartChakraMax: 45,
    // Taijutsu specialists (Rock Lee, Might Guy) ignore this share of enemy DEF,
    // on top of never being "resisted". 0–0.4.
    taijutsuDefIgnore: 0.15,
    // Lane geometry (logical px). Spawn x for the front unit of each side and
    // the minimum centre gap between allies (no stacking).
    lane: { playerFrontX: 250, enemyFrontX: 1030, allySpacing: 58, contactGap: 56 },
    // Chakra (0–100). Ult at 100.
    chakra: {
      max: 100,
      start: 15,            // chakra at battle start. 0–50
      perAttackSecond: 7.5, // gain per auto-attack = this × attackInterval (so slow
                            // hitters aren't punished). 4–12
      onHitPerPctHp: 0.55,  // gain per 1% of max HP lost. 0.2–1.5
      passivePerSec: 2.2,   // everyone slowly gains this per second (so queued units still get ults). 0–4
      // Target: roughly one ult per unit every 10–15 s.
    },
    // Ultimate power, by ult type (from the character's data).
    ult: {
      single: 4.2,          // × ATK to one target. 2.5–6
      aoe: 2.3,             // × ATK to every enemy within aoeRadius of the target. 1.2–3.5
      aoeRadius: 300,       // px. 150–500 (the lane is 1280 wide — no screen wipes)
      tauntDuration: 5,     // s enemies are forced to hit the tank. 2–8
      tauntDR: 0.5,         // damage reduction on the tank while taunting. 0.2–0.8
      tauntHit: 1.4,        // × ATK hit on the tank's target when taunting. 0–3
      healPower: 2.4,       // × caster ATK healed on every ally... 1–5
      healPctMaxHp: 0.10,   // ...plus this share of each ally's max HP. 0–0.3
      buffAtk: 0.30,        // team ATK bonus from a buff ult. 0.1–0.6
      buffDuration: 8,      // s. 4–15
      stunDuration: 2.2,    // s, for ults with the 'stun' rider. 0.5–4
      shakeSeconds: 0.35,   // screen shake length on ult (visual only). 0–1
    },
  },

  // ---------------------------------------------------------------------------
  // NATURE WHEEL (canon): Fire > Wind > Lightning > Earth > Water > Fire
  // ---------------------------------------------------------------------------
  natureWheel: {
    // Each nature beats the next one in this list (and the last beats the first).
    cycle: ['Fire', 'Wind', 'Lightning', 'Earth', 'Water'],
    advantage: 1.3,     // damage mult when attacker's nature beats defender's. 1.1–1.6
    disadvantage: 0.8,  // damage mult when defender's nature beats attacker's. 0.5–0.95
  },

  // ---------------------------------------------------------------------------
  // LEADER BUFFS — the 4th slot's passive team buff. Characters pick a buff
  // `stat` and optional `scope` in roster.js; the numbers live here.
  // ---------------------------------------------------------------------------
  leader: {
    // Base value per stat for an unscoped (whole-team) buff.
    values: {
      atk: 0.10,        // +ATK share. 0.05–0.25
      hp: 0.12,         // +max HP share. 0.05–0.3
      def: 0.15,        // +DEF share. 0.05–0.4
      speed: 0.10,      // attack-speed share (shorter interval). 0.05–0.25
      crit: 0.07,       // flat crit chance. 0.02–0.2
      chakra: 0.18,     // chakra gain share. 0.05–0.4
      startChakra: 22,  // flat starting chakra. 5–60
      nature: 0.12,     // extra damage share on EFFECTIVE hits. 0.05–0.3
    },
    // Buffs limited to a nature/role/tag are this much stronger. 1–3
    scopedMult: 1.8,
    // Leader strength by the leader's tier. 0.5–2
    tierMult: { genin: 0.8, chunin: 1.0, jonin: 1.2, kage: 1.45 },
  },

  // ---------------------------------------------------------------------------
  // ENEMY SCALING — content gives enemies relative weights only; power is here.
  // ---------------------------------------------------------------------------
  enemyScaling: {
    // Enemy level by GLOBAL node index (0-based across the whole campaign, Part 1
    // then Part II...). Part 1's 32 nodes end at level 30; node 90 is level 86.
    levelByNode: { type: 'linear', base: 1, growth: 0.95, round: true },
    // Enemy stat multipliers on top of the level curve (applies to every enemy).
    statMult: { hp: 3.2, atk: 2.5, def: 1.0 },
    // Per-part difficulty knob (part number → multiplier on HP and ATK). 0.5–2
    partMult: { 1: 1.0, 2: 1.0, 3: 1.0 },
    // Extra multipliers for units flagged as the node's boss. x = global node index.
    bossMult: {
      hp:  { type: 'linear', base: 2.4, growth: 0 },
      atk: { type: 'linear', base: 1.45, growth: 0 },
      def: { type: 'linear', base: 1.15, growth: 0 },
    },
    // Group scaling: every NON-boss enemy in a node gets HP and ATK × this curve,
    // x = number of non-boss enemies listed in the node. Keeps a 1-enemy node and
    // a 4-enemy node similarly hard, so new content balances itself.
    // poly growth −0.4 to −1.0.
    groupMult: { type: 'poly', base: 1.25, growth: -0.75 },
    // Per-node difficulty fine-tuning: { nodeId: { hp, atk } } multiplies every
    // enemy in that node (1 = unchanged). Use it to nudge single fights without
    // touching the global curves. 0.3–1.6. Tuned with `npm run autotune -- --write`.
    nodeMult: {
      n_bell_1:    { hp: 0.85, atk: 0.85 },
      n_bell_3:    { hp: 1.54, atk: 1.54 },
      n_waves_5:   { hp: 0.98, atk: 0.98 },
      n_chunin_5:  { hp: 1.05, atk: 1.05 },
      n_crush_3:   { hp: 0.35, atk: 0.35 },
      n_crush_4:   { hp: 0.88, atk: 0.88 },
      n_tsunade_4: { hp: 1.04, atk: 1.04 },
      n_tea_3:     { hp: 1.48, atk: 1.48 },
      n_sr_4:      { hp: 1.00, atk: 1.00 },
      n_sr_5:      { hp: 0.97, atk: 0.97 },
      n_kuro_3:    { hp: 1.06, atk: 1.06 },
    },
    // Adds summoned by boss mechanics are this fraction of a normal enemy. 0.3–1
    addMult: 0.6,
    // Enemies also build chakra and cast a telegraphed jutsu (clashable, see
    // jutsuClash). Set enabled:false to make regular enemies auto-attack only.
    enemyJutsu: {
      enabled: true,
      chakraRate: 0.8,   // × the player chakra rate. 0.3–1.5
      single: 3.2,       // × ATK. 1.5–5
      aoe: 1.7,          // × ATK to all player units in aoe radius. 0.8–3
      windup: 2.0,       // s telegraph before it lands. 1–4
    },
  },

  // ---------------------------------------------------------------------------
  // BOSS MECHANICS — defaults for each data-defined mechanic type. Content can
  // scale these with relative weights (e.g. power: 1.2 = 20% stronger).
  // ---------------------------------------------------------------------------
  bossMechanics: {
    telegraphAoE:  { power: 2.6, windup: 3.0, every: 11, firstAt: 6, stun: 1.2 }, // power × boss ATK; stun s if flagged
    summonAdds:    { every: 16, firstAt: 8, count: 2, maxAlive: 3 },
    shieldPhase:   { shieldPctMaxHp: 0.22, duration: 8 },   // absorb shield, lasts duration s or until broken
    enrage:        { after: 45, atkMult: 1.5, speedMult: 1.3 },
    elementSwap:   { every: 14 },
    reflect:       { pct: 0.45, duration: 3.0, every: 13, firstAt: 7, windup: 1.2 },
    lifesteal:     { pct: 0.25 },
    reviveOnce:    { hpPct: 0.4, invuln: 1.5 },
    regen:         { pctPerSec: 0.008 },
    rally:         { atk: 0.25, duration: 8, every: 15, firstAt: 5 },
  },

  // ---------------------------------------------------------------------------
  // BOSS RUSH — back-to-back Akatsuki, no healing between rounds.
  // ---------------------------------------------------------------------------
  bossRush: {
    // Boss level by round (x = round, 1-based). Starts near the unlock point.
    levelByRound: { type: 'linear', base: 26, growth: 1.5, round: true },
    // Boss stat multiplier by round (x = round). Uses bossMult on top.
    statMultByRound: { type: 'linear', base: 0.39, growth: 0.035 },
    // After Pain (round 7), the rotation loops; each loop multiplies stats by this. 1.1–2
    loopMult: 1.4,
    // Chakra kept between rounds (share). 0–1
    chakraCarry: 1.0,
    // Seconds before the next boss walks in. 1–5
    intermission: 2,
  },

  // ---------------------------------------------------------------------------
  // STANDOUT SYSTEM: JUTSU CLASH (see DESIGN.md)
  // When an enemy telegraphs a jutsu, firing an Ultimate during the wind-up
  // meets it head-on. The Nature Wheel decides the result.
  // ---------------------------------------------------------------------------
  jutsuClash: {
    enabled: true,
    // Your nature beats theirs: enemy jutsu cancelled, your ult hits harder and
    // the caster is stunned.
    overpowerUltMult: 1.35,  // 1–2
    overpowerStun: 2.0,      // s. 0–4
    overpowerChakraRefund: 25, // chakra given back to the clasher. 0–60
    // Neutral: both jutsu cancel; your ult still resolves at this power.
    standoffUltMult: 0.5,    // 0–1
    // Their nature beats yours: your ult is spent and theirs lands weakened.
    overwhelmedJutsuMult: 0.55, // 0–1
    // Taijutsu specialists can never be Overwhelmed (worst case = Standoff).
    taijutsuNeverOverwhelmed: true,
    // A Tank that clashes always pulls the enemy jutsu onto itself with extra DR.
    tankGuard: true,
    tankGuardDR: 0.5,        // 0–0.9
  },

  // ---------------------------------------------------------------------------
  // OBJECTIVES
  // ---------------------------------------------------------------------------
  objectives: {
    // Multiplies every "survive X seconds" requirement. 0.5–2
    surviveTimeMult: 1.0,
  },

  // ---------------------------------------------------------------------------
  // BALANCE TARGETS — checked by `npm run sim` and `npm run campaign`.
  // ---------------------------------------------------------------------------
  targets: {
    battlesPerScenario: 200,
    bellTestMinWin: 0.80,              // starter team, level 1, no ults
    bossWinRange: [0.50, 0.70],        // each arc boss, on-curve team, ult bot
    bossRushRoundRange: [4, 5],        // median highest round, Jonin-heavy team
    natureCheckMinGap: 0.25,           // win-rate gap countered vs countering team
    fightLengthRange: [30, 60],        // s, median of won boss fights (reported)
    campaignMaxReplaysPerNode: 3,
    // "On-curve" team used by the boss sims: level = node enemy level + offset,
    // stars by tier, and this tier mix (best nature matchup picked per slot).
    onCurve: {
      levelOffset: 0,
      stars: { genin: 3, chunin: 2, jonin: 1, kage: 1 },
      tierMix: ['jonin', 'chunin', 'chunin', 'genin'],
    },
    // Boss Rush team: Jonin-heavy at the unlock level.
    bossRushTeam: { level: 32, stars: 2, tierMix: ['jonin', 'jonin', 'jonin', 'chunin'] },
  },
};

export default BALANCE;
