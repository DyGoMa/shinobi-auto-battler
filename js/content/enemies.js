// enemies.js — NON-pullable enemies, bosses, summoned adds and protect targets.
// Pure data: relative stat weights only. Real power = balance.js curves
// (enemy level by global node index × boss multiplier × part multiplier).
// See CONTENT_GUIDE.md for the full schema.
//
//   role       Tank | Striker | Ranged | Support | Civilian (Civilian = protect target, never attacks)
//   natures    active nature = first entry (elementSwap mechanics change it in battle)
//   stats      relative weights vs the role template (hp, atk, def, interval, speed, crit)
//   jutsu      { name, nature?, type: 'single'|'aoe' } — cast when the enemy's chakra fills;
//              always telegraphed, so it can be met with a Jutsu Clash
//   targeting  'nearest' (default) | 'backline' (farthest in range) | 'protected' (dives past
//              your line for the protect target)
//   mechanics  list of data-defined mechanics, any enemy may have them, bosses usually do:
//     telegraphAoE { name, nature?, target: all|front|back|random, stun?, power?, interval?, windup?, atHp? }
//     summonAdds   { name, enemy: enemyId, count?, interval? | atHp: [..] }
//     shieldPhase  { name, atHp: [..], power? }            absorb shield at HP thresholds
//     enrage       { name, atHp: [..] | (timer), power? }  ATK/speed up
//     elementSwap  { name, sequence: [natures], interval? | atHp: [..] }
//     reflect      { name, interval?, power? }             telegraphed stance that reflects damage
//     lifesteal    { name?, power? }                       heals from damage dealt
//     reviveOnce   { name, power? }                        returns once at X% HP
//     regen        { name?, power? }                       heals a % of max HP per second
//     rally        { name, interval?, power? }             ATK buff to its allies
//   power / interval / windup are RELATIVE weights (1 = balance.js default).
//   basedOn    optional roster id (for colour/initials reuse and the NAMING audit)

export const ENEMIES = [
  // =========================== Prologue: Bell Test ===========================
  {
    id: 'e_kakashi_bell', name: 'Kakashi Hatake', basedOn: 'kakashi', role: 'Striker', natures: ['Earth', 'Lightning', 'Water'],
    stats: { hp: 1.35, atk: 0.62, def: 1.0 },
    jutsu: { name: 'Earth Style: Headhunter Jutsu', nature: 'Earth', type: 'single' },
    color: '#cbd5e1', initials: 'KH', emoji: '🔔',
  },
  {
    id: 'e_kakashi_bell2', name: 'Kakashi Hatake', basedOn: 'kakashi', role: 'Striker', natures: ['Earth', 'Lightning', 'Water'],
    stats: { hp: 1.05, atk: 0.8, def: 1.0 },
    jutsu: { name: 'Leaf Village Secret Finger Jutsu: One Thousand Years of Death', type: 'single' },
    mechanics: [{ type: 'reviveOnce', name: 'Substitution Jutsu', power: 0.8 }],
    color: '#cbd5e1', initials: 'KH', emoji: '🔔',
  },
  {
    id: 'e_kakashi_bell_boss', name: 'Kakashi Hatake', basedOn: 'kakashi', role: 'Striker', natures: ['Earth', 'Lightning', 'Water'],
    stats: { hp: 0.8, atk: 0.62, def: 1.0 },
    jutsu: { name: 'Earth Style: Headhunter Jutsu', nature: 'Earth', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Demonic Illusion: Death Mirage Jutsu', nature: null, target: 'random', stun: true, power: 0.7 },
      { type: 'reviveOnce', name: 'Substitution Jutsu', power: 0.6 },
    ],
    color: '#cbd5e1', initials: 'KH', emoji: '🔔',
  },

  // ============================== Land of Waves ==============================
  {
    id: 'e_gozu', name: 'Gozu', role: 'Striker', natures: ['Water'],
    stats: { hp: 0.9, atk: 0.9, def: 0.9 },
    color: '#1d4ed8', initials: 'GO', emoji: '⛓️',
  },
  {
    id: 'e_meizu', name: 'Meizu', role: 'Striker', natures: ['Water'], targeting: 'protected',
    stats: { hp: 0.85, atk: 0.9, def: 0.9, speed: 1.2 },
    color: '#1e40af', initials: 'ME', emoji: '⛓️',
  },
  {
    id: 'e_zabuza_1', name: 'Zabuza Momochi', basedOn: 'zabuza', role: 'Striker', natures: ['Water'],
    stats: { hp: 1.45, atk: 0.95, def: 1.0, interval: 1.1 },
    jutsu: { name: 'Water Prison Jutsu', nature: 'Water', type: 'single' },
    mechanics: [{ type: 'summonAdds', name: 'Water Clone Jutsu', enemy: 'e_water_clone', count: 2, atHp: [0.6] }],
    color: '#475569', initials: 'ZM', emoji: '🌫️',
  },
  {
    id: 'e_water_clone', name: 'Water Clone', role: 'Striker', natures: ['Water'],
    stats: { hp: 0.55, atk: 0.7, def: 0.8 },
    color: '#64748b', initials: 'WC', emoji: '💧',
  },
  {
    id: 'e_zori', name: 'Zori', role: 'Striker', natures: [], targeting: 'protected',
    stats: { hp: 0.8, atk: 0.9, def: 0.85, speed: 1.15 },
    jutsu: { name: 'Iaido', type: 'single' },
    color: '#57534e', initials: 'ZO', emoji: '⚔️',
  },
  {
    id: 'e_waraji', name: 'Waraji', role: 'Striker', natures: [],
    stats: { hp: 0.95, atk: 0.9, def: 0.9 },
    jutsu: { name: 'Iaido', type: 'single' },
    color: '#44403c', initials: 'WA', emoji: '⚔️',
  },
  {
    id: 'e_haku', name: 'Haku', basedOn: 'haku', role: 'Ranged', natures: ['Water', 'Wind'],
    stats: { hp: 1.5, atk: 0.95, def: 1.0, interval: 0.9 },
    jutsu: { name: 'Secret Jutsu: Crystal Ice Mirrors', nature: 'Water', type: 'aoe' },
    mechanics: [{ type: 'elementSwap', name: 'Ice Style', sequence: ['Water', 'Wind'] }],
    color: '#7dd3fc', initials: 'HA', emoji: '❄️',
  },
  {
    id: 'e_zabuza_boss', name: 'Zabuza Momochi', basedOn: 'zabuza', role: 'Striker', natures: ['Water'],
    stats: { hp: 1.0, atk: 0.85, def: 1.0, interval: 1.1 },
    jutsu: { name: 'Water Prison Jutsu', nature: 'Water', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Water Style: Water Dragon Jutsu', nature: 'Water', target: 'all' },
      { type: 'shieldPhase', name: 'Ninja Art: Hidden Mist Jutsu', atHp: [0.6] },
      { type: 'enrage', name: 'Demon of the Hidden Mist', atHp: [0.3], power: 0.8 },
    ],
    color: '#475569', initials: 'ZM', emoji: '🌫️',
  },
  {
    id: 'e_gato_thug', name: "Gato's Thug", role: 'Striker', natures: [],
    stats: { hp: 0.55, atk: 0.6, def: 0.7 },
    color: '#78716c', initials: 'GT', emoji: '🪓',
  },

  // =============================== Chunin Exams ==============================
  {
    id: 'e_orochimaru_forest', name: 'Orochimaru', basedOn: 'orochimaru', role: 'Striker', natures: ['Wind', 'Earth'],
    stats: { hp: 3.2, atk: 0.9, def: 1.2 },
    jutsu: { name: 'Wind Style: Great Breakthrough', nature: 'Wind', type: 'aoe' },
    mechanics: [{ type: 'telegraphAoE', name: 'Striking Shadow Snakes', nature: null, target: 'front', stun: true, power: 0.6 }],
    color: '#6b7280', initials: 'OR', emoji: '🐍',
  },
  {
    id: 'e_dosu', name: 'Dosu Kinuta', role: 'Striker', natures: [],
    stats: { hp: 1.0, atk: 0.95, def: 1.0 },
    jutsu: { name: 'Resonating Echo Drill', type: 'single' },
    color: '#9ca3af', initials: 'DK', emoji: '🔊',
  },
  {
    id: 'e_zaku', name: 'Zaku Abumi', role: 'Ranged', natures: [],
    stats: { hp: 0.9, atk: 0.95, def: 0.9 },
    jutsu: { name: 'Supersonic Slicing Wave', type: 'aoe' },
    color: '#71717a', initials: 'ZA', emoji: '💨',
  },
  {
    id: 'e_kin', name: 'Kin Tsuchi', role: 'Ranged', natures: [], targeting: 'backline',
    stats: { hp: 0.85, atk: 0.9, def: 0.9 },
    jutsu: { name: 'Shadow Senbon', type: 'single' },
    color: '#a1a1aa', initials: 'KT', emoji: '🔔',
  },
  {
    id: 'e_oboro', name: 'Oboro', role: 'Ranged', natures: ['Earth', 'Water'],
    stats: { hp: 1.0, atk: 0.85, def: 0.95 },
    mechanics: [{ type: 'summonAdds', name: 'Misty Follower Jutsu', enemy: 'e_misty_follower', count: 2, interval: 1.2 }],
    color: '#0369a1', initials: 'OB', emoji: '🌧️',
  },
  {
    id: 'e_misty_follower', name: 'Misty Follower', role: 'Striker', natures: ['Earth'],
    stats: { hp: 0.45, atk: 0.55, def: 0.6 },
    color: '#38bdf8', initials: 'MF', emoji: '👤',
  },
  {
    id: 'e_mubi', name: 'Mubi', role: 'Striker', natures: ['Earth', 'Water'], targeting: 'protected',
    stats: { hp: 0.95, atk: 0.9, def: 0.95 },
    jutsu: { name: 'Earth Style: Underground Move Jutsu', nature: 'Earth', type: 'single' },
    color: '#075985', initials: 'MU', emoji: '🌧️',
  },
  {
    id: 'e_kagari', name: 'Kagari', role: 'Striker', natures: ['Water', 'Earth'],
    stats: { hp: 0.95, atk: 0.9, def: 0.95 },
    color: '#0c4a6e', initials: 'KG', emoji: '🌧️',
  },
  {
    id: 'e_yoroi', name: 'Yoroi Akado', role: 'Striker', natures: ['Water'],
    stats: { hp: 1.15, atk: 0.95, def: 1.0 },
    mechanics: [{ type: 'lifesteal', name: 'Chakra absorption', power: 1.2 }],
    color: '#334155', initials: 'YA', emoji: '🩸',
  },
  {
    id: 'e_misumi', name: 'Misumi Tsurugi', role: 'Tank', natures: ['Water'],
    stats: { hp: 1.05, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Soft Physique Modification', type: 'single' },
    color: '#1f2937', initials: 'MT', emoji: '🪢',
  },
  {
    id: 'e_neji_boss', name: 'Neji Hyuga', basedOn: 'neji', role: 'Striker', natures: ['Fire'],
    stats: { hp: 1.0, atk: 0.9, def: 1.05 },
    jutsu: { name: 'Gentle Fist', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Gentle Fist Art: Eight Trigrams Sixty-Four Palms', nature: null, target: 'front', stun: true, power: 1.1 },
      { type: 'reflect', name: 'Eight Trigrams: Palm Rotation' },
    ],
    color: '#94a3b8', initials: 'NH', emoji: '👁️',
  },

  // ================= Destruction of the Hidden Leaf Village ==================
  {
    id: 'e_sand_ninja', name: 'Sand Ninja', role: 'Striker', natures: ['Wind'],
    stats: { hp: 0.85, atk: 0.85, def: 0.9 },
    color: '#d97706', initials: 'SN', emoji: '🏜️',
  },
  {
    id: 'e_sound_ninja', name: 'Sound Ninja', role: 'Ranged', natures: [],
    stats: { hp: 0.8, atk: 0.85, def: 0.85 },
    color: '#52525b', initials: 'SO', emoji: '🎵',
  },
  {
    id: 'e_kankuro', name: 'Kankuro', basedOn: 'kankuro', role: 'Tank', natures: ['Wind'],
    stats: { hp: 1.2, atk: 0.95, def: 1.05 },
    jutsu: { name: 'Puppet Master Jutsu', type: 'single' },
    color: '#7c3aed', initials: 'KA', emoji: '🎭',
  },
  {
    id: 'e_temari', name: 'Temari', basedOn: 'temari', role: 'Ranged', natures: ['Wind'],
    stats: { hp: 1.0, atk: 0.95, def: 0.95 },
    jutsu: { name: 'Ninja Art: Wind Scythe Jutsu', nature: 'Wind', type: 'aoe' },
    color: '#ca8a04', initials: 'TE', emoji: '🪭',
  },
  {
    id: 'e_hashirama', name: 'Hashirama Senju (Reanimated)', role: 'Tank', natures: ['Earth', 'Water'],
    stats: { hp: 1.3, atk: 0.9, def: 1.1 },
    jutsu: { name: 'Wood Style: Deep Forest Emergence', nature: 'Earth', type: 'aoe' },
    color: '#854d0e', initials: 'H1', emoji: '🌳',
  },
  {
    id: 'e_tobirama', name: 'Tobirama Senju (Reanimated)', role: 'Striker', natures: ['Water'],
    stats: { hp: 1.1, atk: 0.95, def: 1.0 },
    mechanics: [{ type: 'shieldPhase', name: 'Water Style: Water Wall', atHp: [0.5] }],
    color: '#0891b2', initials: 'T2', emoji: '🌊',
  },
  {
    id: 'e_orochimaru_crush', name: 'Orochimaru', basedOn: 'orochimaru', role: 'Ranged', natures: ['Wind', 'Earth'],
    stats: { hp: 0.8, atk: 0.8, def: 1.0 },
    jutsu: { name: 'Wind Style: Great Breakthrough', nature: 'Wind', type: 'aoe' },
    mechanics: [{ type: 'telegraphAoE', name: 'Striking Shadow Snakes', nature: null, target: 'front', stun: true }],
    color: '#6b7280', initials: 'OR', emoji: '🐍',
  },
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

  // ============================ Search for Tsunade ===========================
  {
    id: 'e_kisame', name: 'Kisame Hoshigaki', role: 'Striker', natures: ['Water'],
    stats: { hp: 2.0, atk: 0.9, def: 1.1 },
    jutsu: { name: 'Water Style: Water Shark Bomb Jutsu', nature: 'Water', type: 'aoe' },
    mechanics: [{ type: 'lifesteal', name: 'Shark Skin' }],
    color: '#0e7490', initials: 'KS', emoji: '🦈',
  },
  {
    id: 'e_itachi', name: 'Itachi Uchiha', role: 'Ranged', natures: ['Fire', 'Water', 'Wind'],
    stats: { hp: 1.8, atk: 0.9, def: 1.1 },
    mechanics: [{ type: 'telegraphAoE', name: 'Tsukuyomi', nature: null, target: 'random', stun: true, power: 0.8 }],
    color: '#991b1b', initials: 'IU', emoji: '🌙',
  },
  {
    id: 'e_tsunade_bet', name: 'Tsunade', basedOn: 'tsunade', role: 'Striker', natures: ['Lightning'],
    stats: { hp: 3.5, atk: 0.62, def: 1.2 },
    jutsu: { name: 'Heaven Kick of Pain', type: 'single' },
    color: '#10b981', initials: 'TS', emoji: '💎',
  },
  {
    id: 'e_kabuto', name: 'Kabuto Yakushi', basedOn: 'kabuto', role: 'Striker', natures: ['Earth'],
    stats: { hp: 1.2, atk: 0.95, def: 1.0 },
    jutsu: { name: 'Chakra Scalpel', type: 'single' },
    mechanics: [{ type: 'regen', name: 'Healing Jutsu' }],
    color: '#6d28d9', initials: 'KB', emoji: '👓',
  },
  {
    id: 'e_orochimaru_boss', name: 'Orochimaru', basedOn: 'orochimaru', role: 'Ranged', natures: ['Wind', 'Earth'],
    stats: { hp: 1.0, atk: 0.85, def: 1.0 },
    jutsu: { name: 'Wind Style: Great Breakthrough', nature: 'Wind', type: 'aoe' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Striking Shadow Snakes', nature: null, target: 'front', stun: true },
      { type: 'summonAdds', name: 'Summoning Jutsu', enemy: 'e_manda', count: 1, atHp: [0.65] },
    ],
    color: '#6b7280', initials: 'OR', emoji: '🐍',
  },
  {
    id: 'e_manda', name: 'Manda', role: 'Tank', natures: [],
    stats: { hp: 1.5, atk: 1.0, def: 1.0 },
    jutsu: { name: 'Coiling Around', type: 'single' },
    color: '#7e22ce', initials: 'MA', emoji: '🐉',
  },

  // ======================== Land of Tea Escort Mission =======================
  {
    id: 'e_kagari_tea', name: 'Kagari', role: 'Ranged', natures: ['Water', 'Earth'],
    stats: { hp: 0.95, atk: 0.9, def: 0.95 },
    jutsu: { name: 'Water Style: Black Rain Jutsu', nature: 'Water', type: 'aoe' },
    color: '#0c4a6e', initials: 'KG', emoji: '🌧️',
  },
  {
    id: 'e_aoi', name: 'Aoi Rokusho', role: 'Ranged', natures: ['Water'],
    stats: { hp: 1.35, atk: 0.95, def: 1.0 },
    jutsu: { name: 'Ninja Art: Senbon Rainstorm', type: 'aoe' },
    color: '#0f172a', initials: 'AR', emoji: '☂️',
  },
  {
    id: 'e_aoi_boss', name: 'Aoi Rokusho', role: 'Striker', natures: ['Water'],
    stats: { hp: 1.0, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Ninja Art: Senbon Rainstorm', type: 'aoe' },
    mechanics: [
      { type: 'elementSwap', name: 'Blade of the Thunder Spirit', sequence: ['Water', 'Lightning'], atHp: [0.7] },
      { type: 'telegraphAoE', name: 'Blade of the Thunder Spirit', nature: 'Lightning', target: 'front', power: 1.2 },
    ],
    color: '#0f172a', initials: 'AR', emoji: '⚡',
  },

  // ========================== Sasuke Retrieval Squad =========================
  {
    id: 'e_jirobo', name: 'Jirobo', basedOn: 'jirobo', role: 'Tank', natures: ['Earth'],
    stats: { hp: 1.45, atk: 1.0, def: 1.05 },
    jutsu: { name: 'Earth Style Barrier: Earth Dome Prison', nature: 'Earth', type: 'aoe' },
    mechanics: [{ type: 'lifesteal', name: 'Chakra absorption', power: 0.8 }],
    color: '#c2410c', initials: 'JI', emoji: '🪨',
  },
  {
    id: 'e_kidomaru', name: 'Kidomaru', basedOn: 'kidomaru', role: 'Ranged', natures: [], targeting: 'backline',
    stats: { hp: 1.3, atk: 1.05, def: 0.95 },
    jutsu: { name: 'Spider Bow: Fierce Rip', type: 'single' },
    color: '#78716c', initials: 'KD', emoji: '🕷️',
  },
  {
    id: 'e_sakon', name: 'Sakon and Ukon', basedOn: 'sakon', role: 'Striker', natures: [],
    stats: { hp: 1.1, atk: 0.95, def: 1.0 },
    jutsu: { name: 'Multiple Fists Barrage', type: 'single' },
    mechanics: [
      { type: 'summonAdds', name: 'Demon Twin Jutsu', enemy: 'e_ukon', count: 1, atHp: [0.6] },
      { type: 'shieldPhase', name: 'Summoning Jutsu: Rashomon', atHp: [0.35] },
    ],
    color: '#6b21a8', initials: 'SK', emoji: '👥',
  },
  {
    id: 'e_ukon', name: 'Ukon', role: 'Striker', natures: [],
    stats: { hp: 0.8, atk: 0.9, def: 1.0 },
    color: '#581c87', initials: 'UK', emoji: '👤',
  },
  {
    id: 'e_tayuya', name: 'Tayuya', basedOn: 'tayuya', role: 'Ranged', natures: [],
    stats: { hp: 1.0, atk: 0.9, def: 0.95 },
    jutsu: { name: 'Demon Flute: Chains of Fantasia', type: 'aoe' },
    mechanics: [{ type: 'summonAdds', name: 'Demon Flute: Trio Requiem', enemy: 'e_doki', count: 2, atHp: [0.8, 0.4] }],
    color: '#fb7185', initials: 'TA', emoji: '🪈',
  },
  {
    id: 'e_doki', name: 'Doki', role: 'Tank', natures: [],
    stats: { hp: 0.9, atk: 0.75, def: 1.0 },
    color: '#9f1239', initials: 'DO', emoji: '👹',
  },
  {
    id: 'e_kimimaro', name: 'Kimimaro', basedOn: 'kimimaro', role: 'Striker', natures: [],
    stats: { hp: 0.95, atk: 0.9, def: 1.05 },
    jutsu: { name: 'Clematis Dance: Flower', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Bracken Dance', nature: null, target: 'all' },
      { type: 'reflect', name: 'Larch Dance', power: 0.8 },
      { type: 'enrage', name: "Heavens' Curse Mark", atHp: [0.4], power: 0.8 },
    ],
    color: '#e7e5e4', initials: 'KM', emoji: '🦴',
  },
  {
    id: 'e_sasuke_boss', name: "Sasuke Uchiha (Heavens' Curse Mark)", basedOn: 'sasuke', role: 'Striker', natures: ['Fire', 'Lightning'],
    stats: { hp: 0.95, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Fire Style: Phoenix Flower Jutsu', nature: 'Fire', type: 'aoe' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Chidori', nature: 'Lightning', target: 'front', stun: true, power: 1.2 },
      { type: 'reviveOnce', name: "Heavens' Curse Mark" },
    ],
    color: '#3b82f6', initials: 'SU', emoji: '⚡',
  },

  // ===================== Kurosuki Family Removal Mission =====================
  {
    id: 'e_kurosuki', name: 'Kurosuki Family Member', role: 'Striker', natures: [],
    stats: { hp: 0.85, atk: 0.85, def: 0.9 },
    jutsu: { name: 'Ninja Art: Black Tornado', type: 'aoe' },
    color: '#27272a', initials: 'KF', emoji: '🌪️',
  },
  {
    id: 'e_kurosuki_diver', name: 'Kurosuki Family Member', role: 'Striker', natures: [], targeting: 'protected',
    stats: { hp: 0.8, atk: 0.85, def: 0.9, speed: 1.15 },
    color: '#3f3f46', initials: 'KF', emoji: '🌪️',
  },
  {
    id: 'e_raiga', name: 'Raiga Kurosuki', role: 'Striker', natures: ['Lightning', 'Water'],
    stats: { hp: 1.5, atk: 0.95, def: 1.0 },
    jutsu: { name: 'Ninja Art: Lightning Fangs', nature: 'Lightning', type: 'single' },
    mechanics: [{ type: 'shieldPhase', name: 'Ninja Art: Hidden Mist Jutsu', atHp: [0.5] }],
    color: '#facc15', initials: 'RK', emoji: '⚰️',
  },
  {
    id: 'e_ranmaru', name: 'Ranmaru', role: 'Support', natures: [],
    stats: { hp: 0.8, atk: 0.6, def: 0.9 },
    mechanics: [{ type: 'rally', name: "Ranmaru's eyes guide Raiga" }],
    color: '#a3e635', initials: 'RA', emoji: '👀',
  },
  {
    id: 'e_raiga_boss', name: 'Raiga Kurosuki', role: 'Striker', natures: ['Lightning', 'Water'],
    stats: { hp: 1.0, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Ninja Art: Lightning Ball', nature: 'Lightning', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Thunder Funeral: Feast of Lightning', nature: 'Lightning', target: 'all' },
      { type: 'enrage', name: 'Ninja Art: Thunder Armour', atHp: [0.4] },
      { type: 'summonAdds', name: 'Kurosuki Family ambush', enemy: 'e_kurosuki', count: 2, atHp: [0.7] },
    ],
    color: '#facc15', initials: 'RK', emoji: '⚰️',
  },

  // ===========================================================================
  // PART II (Shippuden). Same rules as above; names verified in NAMING.md.
  // ===========================================================================

  // ========================= Kazekage Rescue Mission =========================
  {
    id: 'e_kakashi_kaz', name: 'Kakashi Hatake', basedOn: 'kakashi', role: 'Striker', natures: ['Lightning', 'Earth', 'Water'],
    stats: { hp: 1.3, atk: 0.8, def: 1.0 },
    jutsu: { name: 'Lightning Blade', nature: 'Lightning', type: 'single' },
    mechanics: [{ type: 'reviveOnce', name: 'Substitution Jutsu', power: 0.7 }],
    color: '#cbd5e1', initials: 'KH', emoji: '🔔',
  },
  {
    id: 'e_deidara_sand', name: 'Deidara', basedOn: 'deidara', role: 'Ranged', natures: ['Earth', 'Lightning'],
    stats: { hp: 2.6, atk: 0.75, def: 0.95 },
    jutsu: { name: 'C1', nature: 'Earth', type: 'aoe' },
    mechanics: [{ type: 'telegraphAoE', name: 'C3', nature: 'Earth', target: 'all', power: 0.8, windup: 1.2 }],
    color: '#fde68a', initials: 'DE', emoji: '🐦',
  },
  {
    id: 'e_clone_guy', name: 'Might Guy (Clone)', basedOn: 'guy', role: 'Striker', natures: [], taijutsu: true,
    stats: { hp: 1.0, atk: 0.9, def: 0.95, interval: 0.9 },
    jutsu: { name: 'Dynamic Entry', type: 'single' },
    color: '#15803d', initials: 'MG', emoji: '👤',
  },
  {
    id: 'e_clone_lee', name: 'Rock Lee (Clone)', basedOn: 'lee', role: 'Striker', natures: [], taijutsu: true,
    stats: { hp: 0.95, atk: 0.9, def: 0.9, interval: 0.85 },
    jutsu: { name: 'Primary Lotus', type: 'single' },
    color: '#16a34a', initials: 'RL', emoji: '👤',
  },
  {
    id: 'e_clone_neji', name: 'Neji Hyuga (Clone)', basedOn: 'neji', role: 'Striker', natures: ['Fire'],
    stats: { hp: 0.95, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Gentle Fist', type: 'single' },
    color: '#94a3b8', initials: 'NH', emoji: '👤',
  },
  {
    id: 'e_clone_tenten', name: 'Tenten (Clone)', basedOn: 'tenten', role: 'Ranged', natures: [],
    stats: { hp: 0.9, atk: 0.9, def: 0.9 },
    jutsu: { name: 'Rising Twin Dragons', type: 'aoe' },
    color: '#e11d48', initials: 'TT', emoji: '👤',
  },
  {
    id: 'e_sasori_boss', name: 'Sasori', basedOn: 'sasori', role: 'Ranged', natures: [],
    stats: { hp: 1.0, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Iron Sand: Scattered Showers', type: 'aoe' },
    mechanics: [
      { type: 'shieldPhase', name: 'Hiruko', atHp: [0.8] },
      { type: 'telegraphAoE', name: 'Iron Sand Gathering', nature: null, target: 'front', stun: true },
      { type: 'summonAdds', name: 'Secret Red Move: Performance of a Hundred Puppets', enemy: 'e_puppet', count: 3, atHp: [0.45] },
    ],
    color: '#9f1239', initials: 'SS', emoji: '🦂',
  },
  {
    id: 'e_clay_bird', name: 'Clay Bird', role: 'Striker', natures: ['Earth'],
    stats: { hp: 0.4, atk: 0.6, def: 0.6, speed: 1.3 },
    color: '#fef9c3', initials: 'CB', emoji: '🕊️',
  },
  {
    id: 'e_deidara_boss', name: 'Deidara', basedOn: 'deidara', role: 'Ranged', natures: ['Earth', 'Lightning'],
    stats: { hp: 1.0, atk: 0.9, def: 0.95 },
    jutsu: { name: 'C1', nature: 'Earth', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'C1', nature: 'Earth', target: 'random', power: 1.3 },
      { type: 'summonAdds', name: 'C1', enemy: 'e_clay_bird', count: 2, interval: 1.2 },
      { type: 'reviveOnce', name: 'Clay Clone', power: 0.7 },
    ],
    color: '#fde68a', initials: 'DE', emoji: '💥',
  },

  // =================== Tenchi Bridge Reconnaissance Mission ==================
  {
    id: 'e_yamato_sim', name: 'Yamato', basedOn: 'yamato', role: 'Tank', natures: ['Earth', 'Water'],
    stats: { hp: 1.5, atk: 0.75, def: 1.1 },
    jutsu: { name: 'Wood Style: Four Pillar Prison Jutsu', nature: 'Earth', type: 'single' },
    mechanics: [{ type: 'summonAdds', name: 'Wood Style: Wood Clone Jutsu', enemy: 'e_wood_clone', count: 1, atHp: [0.5] }],
    color: '#92400e', initials: 'YA', emoji: '🌲',
  },
  {
    id: 'e_wood_clone', name: 'Wood Clone', role: 'Striker', natures: ['Earth', 'Water'],
    stats: { hp: 0.5, atk: 0.6, def: 0.8 },
    color: '#a16207', initials: 'WC', emoji: '🪵',
  },
  {
    id: 'e_orochimaru_p2', name: 'Orochimaru', basedOn: 'orochimaru', role: 'Ranged', natures: ['Wind', 'Earth'],
    stats: { hp: 1.3, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Sword of Kusanagi', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Striking Shadow Snakes', nature: null, target: 'front', stun: true, power: 0.8 },
      { type: 'reviveOnce', name: 'Orochimaru Style: Substitution Jutsu', power: 0.6 },
    ],
    color: '#6b7280', initials: 'OR', emoji: '🐍',
  },
  {
    id: 'e_sasuke_tenchi', name: 'Sasuke Uchiha', basedOn: 'sasuke', role: 'Striker', natures: ['Fire', 'Lightning'],
    stats: { hp: 1.0, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Chidori', nature: 'Lightning', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Chidori Stream', nature: 'Lightning', target: 'all', stun: true, power: 0.8 },
      { type: 'enrage', name: "Heavens' Curse Mark", atHp: [0.35], power: 0.8 },
    ],
    color: '#3b82f6', initials: 'SU', emoji: '⚡',
  },

  // ========================== Twelve Guardian Ninja ==========================
  {
    id: 'e_fuka', name: 'Fuka', role: 'Striker', natures: ['Fire'],
    stats: { hp: 0.95, atk: 0.95, def: 0.9 },
    jutsu: { name: 'Fire Style: Phoenix Flower Jutsu', nature: 'Fire', type: 'aoe' },
    mechanics: [{ type: 'lifesteal', name: 'Reaper Kiss', power: 1.2 }],
    color: '#db2777', initials: 'FK', emoji: '💋',
  },
  {
    id: 'e_fudo', name: 'Fudo', role: 'Tank', natures: ['Earth'],
    stats: { hp: 1.15, atk: 0.9, def: 1.1 },
    jutsu: { name: 'Earth Style: Earthquake Slam', nature: 'Earth', type: 'aoe' },
    mechanics: [{ type: 'shieldPhase', name: 'Rock Armour', atHp: [0.5] }],
    color: '#57534e', initials: 'FD', emoji: '🗿',
  },
  {
    id: 'e_sora', name: 'Sora', role: 'Striker', natures: ['Wind'],
    stats: { hp: 3.0, atk: 0.75, def: 1.1 },
    jutsu: { name: 'Beast Wave Gale Palm', nature: 'Wind', type: 'aoe' },
    mechanics: [{ type: 'enrage', name: 'Tailed Beast Chakra Arms', atHp: [0.5], power: 0.8 }],
    color: '#f87171', initials: 'SO', emoji: '🦊',
  },
  {
    id: 'e_revived_soul', name: 'Revived Soul', role: 'Striker', natures: ['Earth'],
    stats: { hp: 0.5, atk: 0.6, def: 0.8 },
    color: '#78716c', initials: 'RS', emoji: '🧟',
  },
  {
    id: 'e_kazuma_boss', name: 'Kazuma', role: 'Ranged', natures: ['Wind', 'Earth'],
    stats: { hp: 1.0, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Flying Swallow', nature: 'Wind', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Earth Style: Hidden in Stones Jutsu', nature: 'Earth', target: 'back', power: 1.1 },
      { type: 'summonAdds', name: 'Earth Style Ultimate Revival Jutsu: Soil Bodies', enemy: 'e_revived_soul', count: 2, atHp: [0.7, 0.35] },
    ],
    color: '#a3a3a3', initials: 'KZ', emoji: '📿',
  },

  // ======================= Akatsuki Suppression Mission ======================
  {
    id: 'e_hidan', name: 'Hidan', basedOn: 'hidan', role: 'Striker', natures: [],
    stats: { hp: 2.4, atk: 0.8, def: 0.95 },
    jutsu: { name: 'Triple-Bladed Scythe', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Curse Jutsu', nature: null, target: 'random', power: 1.3 },
      { type: 'reviveOnce', name: 'Immortality' },
    ],
    color: '#e5e7eb', initials: 'HI', emoji: '⛧',
  },
  {
    id: 'e_kakuzu', name: 'Kakuzu', basedOn: 'kakuzu', role: 'Tank', natures: ['Earth', 'Water', 'Fire', 'Wind', 'Lightning'],
    stats: { hp: 1.4, atk: 0.85, def: 1.1 },
    jutsu: { name: 'Lightning Style: False Darkness', nature: 'Lightning', type: 'single' },
    mechanics: [
      { type: 'summonAdds', name: 'Earth Grudge', enemy: 'e_masked_beast', count: 2, atHp: [0.6] },
      { type: 'shieldPhase', name: 'Earth Style: Iron Skin', atHp: [0.4] },
    ],
    color: '#365314', initials: 'KK', emoji: '🧵',
  },
  {
    id: 'e_masked_beast', name: 'Masked Beast', role: 'Ranged', natures: ['Fire'],
    stats: { hp: 0.55, atk: 0.7, def: 0.8 },
    jutsu: { name: 'Fire Style: Searing Migraine', nature: 'Fire', type: 'aoe' },
    color: '#3f6212', initials: 'MB', emoji: '👺',
  },
  {
    id: 'e_hidan_boss', name: 'Hidan', basedOn: 'hidan', role: 'Striker', natures: [],
    stats: { hp: 1.0, atk: 0.9, def: 0.95 },
    jutsu: { name: 'Triple-Bladed Scythe', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Curse Jutsu', nature: null, target: 'random', power: 1.8 },
      { type: 'reviveOnce', name: 'Immortality' },
    ],
    color: '#e5e7eb', initials: 'HI', emoji: '⛧',
  },
  {
    id: 'e_kakuzu_boss', name: 'Kakuzu', basedOn: 'kakuzu', role: 'Striker', natures: ['Earth', 'Water', 'Fire', 'Wind', 'Lightning'],
    stats: { hp: 1.0, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Wind Style: Pressure Damage', nature: 'Wind', type: 'aoe' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Fire Style: Searing Migraine', nature: 'Fire', target: 'all' },
      { type: 'elementSwap', name: 'Earth Grudge', sequence: ['Earth', 'Water', 'Fire', 'Wind', 'Lightning'] },
      { type: 'reviveOnce', name: 'Earth Grudge', power: 0.7 },
    ],
    color: '#365314', initials: 'KK', emoji: '🧵',
  },

  // ========================= Three-Tails' Appearance =========================
  {
    id: 'e_kigiri', name: 'Kigiri', role: 'Ranged', natures: ['Fire'],
    stats: { hp: 1.0, atk: 0.9, def: 0.95 },
    jutsu: { name: 'Exploding Flame Shot', nature: 'Fire', type: 'aoe' },
    mechanics: [{ type: 'summonAdds', name: 'Multi-Smoke Clone', enemy: 'e_smoke_clone', count: 2, interval: 1.3 }],
    color: '#b45309', initials: 'KI', emoji: '💨',
  },
  {
    id: 'e_smoke_clone', name: 'Smoke Clone', role: 'Striker', natures: ['Fire'],
    stats: { hp: 0.4, atk: 0.55, def: 0.6 },
    color: '#a8a29e', initials: 'SC', emoji: '💨',
  },
  {
    id: 'e_nurari', name: 'Nurari', role: 'Striker', natures: ['Water'], targeting: 'backline',
    stats: { hp: 0.95, atk: 0.95, def: 0.9, speed: 1.15 },
    jutsu: { name: 'Sticky Water', nature: 'Water', type: 'single' },
    color: '#0369a1', initials: 'NU', emoji: '🐍',
  },
  {
    id: 'e_guren_boss', name: 'Guren', role: 'Ranged', natures: ['Earth'],
    stats: { hp: 1.0, atk: 0.9, def: 1.05 },
    jutsu: { name: 'Crystal Style: Jade Crystal Mirror', nature: 'Earth', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Crystal Style: Burst Crystal Falling Dragon', nature: 'Earth', target: 'all' },
      { type: 'reflect', name: 'Crystal Style: Jade Crystal Mirror', power: 0.8 },
    ],
    color: '#a78bfa', initials: 'GU', emoji: '💎',
  },
  {
    id: 'e_three_tails', name: 'Three-Tails', role: 'Tank', natures: ['Water'],
    stats: { hp: 0.9, atk: 0.95, def: 0.95 },
    mechanics: [
      { type: 'telegraphAoE', name: 'Tailed Beast Bomb', nature: null, target: 'all', power: 1.2, windup: 1.2 },
      { type: 'enrage', name: 'The Rampaging Tailed Beast', atHp: [0.35] },
    ],
    color: '#64748b', initials: '3T', emoji: '🐢',
  },

  // ========================= Itachi Pursuit Mission ==========================
  {
    id: 'e_jugo', name: 'Jugo', basedOn: 'jugo', role: 'Striker', natures: ['Wind'],
    stats: { hp: 1.6, atk: 0.9, def: 1.0 },
    mechanics: [{ type: 'enrage', name: 'Sage Transformation', atHp: [0.5] }],
    color: '#d97706', initials: 'JU', emoji: '🐦',
  },
  {
    id: 'e_deidara_clash', name: 'Deidara', basedOn: 'deidara', role: 'Ranged', natures: ['Earth', 'Lightning'],
    stats: { hp: 1.3, atk: 0.9, def: 0.95 },
    jutsu: { name: 'C1', nature: 'Earth', type: 'aoe' },
    mechanics: [{ type: 'summonAdds', name: 'C2 Dragon', enemy: 'e_c2_dragon', count: 1, atHp: [0.6] }],
    color: '#fde68a', initials: 'DE', emoji: '💥',
  },
  {
    id: 'e_c2_dragon', name: 'C2 Dragon', role: 'Ranged', natures: ['Earth'],
    stats: { hp: 0.8, atk: 0.9, def: 0.8 },
    color: '#fef08a', initials: 'C2', emoji: '🐉',
  },
  {
    id: 'e_tobi', name: 'Tobi', basedOn: 'obito', role: 'Striker', natures: ['Fire'],
    stats: { hp: 1.3, atk: 0.5, def: 1.0 },
    mechanics: [{ type: 'shieldPhase', name: 'Kamui', atHp: [0.7, 0.4] }],
    color: '#f97316', initials: 'TO', emoji: '🍭',
  },
  {
    id: 'e_deidara_art', name: 'Deidara', basedOn: 'deidara', role: 'Ranged', natures: ['Earth', 'Lightning'],
    stats: { hp: 1.0, atk: 0.9, def: 0.95 },
    jutsu: { name: 'C1', nature: 'Earth', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'C4 Karura', nature: 'Earth', target: 'all', power: 1.2 },
      { type: 'reviveOnce', name: 'Clay Clone', power: 0.6 },
      { type: 'enrage', name: 'C0', atHp: [0.25] },
    ],
    color: '#fde68a', initials: 'DE', emoji: '💥',
  },

  // ======================= Tale of Jiraiya the Gallant =======================
  {
    id: 'e_rain_ninja', name: 'Rain Ninja', role: 'Ranged', natures: ['Water'],
    stats: { hp: 0.85, atk: 0.85, def: 0.85 },
    color: '#475569', initials: 'RN', emoji: '🌧️',
  },
  {
    id: 'e_konan', name: 'Konan', basedOn: 'konan', role: 'Ranged', natures: ['Wind'],
    stats: { hp: 1.4, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Paper Shuriken', type: 'aoe' },
    mechanics: [{ type: 'shieldPhase', name: 'Dance of the Shikigami', atHp: [0.5] }],
    color: '#c084fc', initials: 'KO', emoji: '📄',
  },
  {
    id: 'e_summoned_beast', name: 'Summoned Beast', role: 'Tank', natures: [],
    stats: { hp: 0.7, atk: 0.7, def: 0.9 },
    color: '#78716c', initials: 'SB', emoji: '🦏',
  },
  {
    id: 'e_pain_animal', name: 'Pain (Chikushodo)', basedOn: 'pain', role: 'Ranged', natures: ['Water'],
    stats: { hp: 1.3, atk: 0.8, def: 1.0 },
    mechanics: [{ type: 'summonAdds', name: 'Summoning Jutsu', enemy: 'e_summoned_beast', count: 2, interval: 1.2 }],
    color: '#fb923c', initials: 'PA', emoji: '🐕',
  },
  {
    id: 'e_pain_sixpaths', name: 'Pain', basedOn: 'pain', role: 'Ranged', natures: ['Water'],
    stats: { hp: 1.0, atk: 0.9, def: 1.05 },
    jutsu: { name: 'Universal Pull', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Asura Attack', nature: null, target: 'front', power: 1.2 },
      { type: 'summonAdds', name: 'Summoning Jutsu', enemy: 'e_summoned_beast', count: 1, atHp: [0.6] },
      { type: 'reviveOnce', name: 'Six Paths of Pain', power: 0.8 },
    ],
    color: '#fb923c', initials: 'PA', emoji: '🌀',
  },

  // ===================== Fated Battle Between Brothers =======================
  {
    id: 'e_kisame_p2', name: 'Kisame Hoshigaki', basedOn: 'kisame', role: 'Striker', natures: ['Water'],
    stats: { hp: 2.6, atk: 0.8, def: 1.1 },
    jutsu: { name: 'Water Style: Exploding Water Shock Wave', nature: 'Water', type: 'aoe' },
    mechanics: [{ type: 'lifesteal', name: 'Shark Skin' }],
    color: '#155e75', initials: 'KS', emoji: '🦈',
  },
  {
    id: 'e_crow_clone', name: 'Itachi (Crow Clone)', role: 'Ranged', natures: ['Fire'],
    stats: { hp: 0.4, atk: 0.6, def: 0.8 },
    color: '#450a0a', initials: 'IC', emoji: '🐦‍⬛',
  },
  {
    id: 'e_itachi_boss', name: 'Itachi Uchiha', basedOn: 'itachi', role: 'Ranged', natures: ['Fire', 'Water', 'Wind'],
    stats: { hp: 1.0, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Fire Style: Fireball Jutsu', nature: 'Fire', type: 'aoe' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Amaterasu', nature: 'Fire', target: 'back', power: 1.3 },
      { type: 'summonAdds', name: 'Crow Clone Jutsu', enemy: 'e_crow_clone', count: 2, atHp: [0.7] },
      { type: 'shieldPhase', name: 'Susanoo', atHp: [0.35] },
    ],
    color: '#7f1d1d', initials: 'IU', emoji: '🌙',
  },
  {
    id: 'e_bee', name: 'Killer Bee', basedOn: 'killer_bee', role: 'Striker', natures: ['Lightning'],
    stats: { hp: 1.8, atk: 0.85, def: 1.0 },
    jutsu: { name: 'Lariat', nature: 'Lightning', type: 'single' },
    mechanics: [{ type: 'enrage', name: 'Tailed Beast Chakra Arms', atHp: [0.4], power: 0.8 }],
    color: '#eab308', initials: 'KB', emoji: '🎤',
  },
  {
    id: 'e_eight_tails', name: 'Eight-Tails', basedOn: 'killer_bee', role: 'Tank', natures: [],
    stats: { hp: 1.1, atk: 0.9, def: 1.1 },
    jutsu: { name: 'Ink Creation', type: 'aoe' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Tailed Beast Bomb', nature: null, target: 'all', power: 1.2, windup: 1.2 },
      { type: 'enrage', name: 'Lariat', atHp: [0.35] },
    ],
    color: '#b91c1c', initials: '8T', emoji: '🐙',
  },

  // =========================== Six-Tails Unleashed ===========================
  {
    id: 'e_tracker_ninja', name: 'Mist Tracker Ninja', role: 'Striker', natures: ['Water'],
    stats: { hp: 0.9, atk: 0.9, def: 0.9 },
    color: '#1e3a8a', initials: 'TN', emoji: '🎭',
  },
  {
    id: 'e_tracker_diver', name: 'Mist Tracker Ninja', role: 'Striker', natures: ['Water'], targeting: 'protected',
    stats: { hp: 0.8, atk: 0.85, def: 0.9, speed: 1.2 },
    color: '#1e40af', initials: 'TN', emoji: '🎭',
  },
  {
    id: 'e_bandit_ninja', name: 'Bandit Ninja', role: 'Striker', natures: [],
    stats: { hp: 0.85, atk: 0.85, def: 0.85 },
    color: '#57534e', initials: 'BN', emoji: '🗡️',
  },
  {
    id: 'e_shiranami_boss', name: 'Shiranami', role: 'Ranged', natures: [],
    stats: { hp: 1.0, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Word Bind Jutsu', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Tsuchigumo Style: Forbidden Jutsu Release: Big Bang', nature: null, target: 'all', power: 1.3, windup: 1.3 },
      { type: 'shieldPhase', name: 'Chameleon Jutsu', atHp: [0.5] },
      { type: 'summonAdds', name: 'Fury Jutsu', enemy: 'e_bandit_ninja', count: 2, atHp: [0.7] },
    ],
    color: '#44403c', initials: 'SN', emoji: '🕷️',
  },

  // ============================== Pain's Assault =============================
  {
    id: 'e_pain_asura', name: 'Pain (Shurado)', basedOn: 'pain', role: 'Striker', natures: ['Water'],
    stats: { hp: 1.2, atk: 0.95, def: 1.1 },
    jutsu: { name: 'Asura Attack', type: 'aoe' },
    color: '#ea580c', initials: 'PA', emoji: '🦾',
  },
  {
    id: 'e_pain_deva', name: 'Pain (Tendo)', basedOn: 'pain', role: 'Ranged', natures: ['Water'],
    stats: { hp: 1.1, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Universal Pull', type: 'single' },
    mechanics: [{ type: 'telegraphAoE', name: 'Almighty Push', nature: null, target: 'all', stun: true, power: 0.9 }],
    color: '#fb923c', initials: 'PA', emoji: '🌀',
  },
  {
    id: 'e_pain_naraka', name: 'Pain (Jigokudo)', basedOn: 'pain', role: 'Support', natures: ['Water'],
    stats: { hp: 1.5, atk: 0.8, def: 1.0 },
    mechanics: [{ type: 'regen', name: 'King of Hell', power: 1.6 }],
    color: '#c2410c', initials: 'PA', emoji: '👹',
  },
  {
    id: 'e_pain_preta', name: 'Pain (Gakido)', basedOn: 'pain', role: 'Tank', natures: ['Water'],
    stats: { hp: 1.2, atk: 0.85, def: 1.1 },
    mechanics: [{ type: 'lifesteal', name: 'Chakra absorption', power: 1.2 }],
    color: '#9a3412', initials: 'PA', emoji: '🫗',
  },
  {
    id: 'e_pain_boss', name: 'Pain (Tendo)', basedOn: 'pain', role: 'Ranged', natures: ['Water'],
    stats: { hp: 1.05, atk: 0.9, def: 1.05 },
    jutsu: { name: 'Universal Pull', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Planetary Devastation', nature: null, target: 'all', stun: true, power: 1.2, windup: 1.3 },
      { type: 'reflect', name: 'Almighty Push' },
    ],
    color: '#fb923c', initials: 'PA', emoji: '🌀',
  },

  // ============================= Five Kage Summit ============================
  {
    id: 'e_sasuke_summit', name: 'Sasuke Uchiha', basedOn: 'sasuke', role: 'Striker', natures: ['Fire', 'Lightning'],
    stats: { hp: 1.4, atk: 0.85, def: 1.0 },
    jutsu: { name: 'Amaterasu', nature: 'Fire', type: 'single' },
    mechanics: [{ type: 'shieldPhase', name: 'Susanoo', atHp: [0.5] }],
    color: '#3b82f6', initials: 'SU', emoji: '🔥',
  },
  {
    id: 'e_kisame_fused', name: 'Kisame Hoshigaki', basedOn: 'kisame', role: 'Striker', natures: ['Water'],
    stats: { hp: 1.8, atk: 0.9, def: 1.05 },
    jutsu: { name: 'Water Prison Shark Dance Jutsu', nature: 'Water', type: 'aoe' },
    mechanics: [{ type: 'lifesteal', name: 'Shark Skin' }],
    color: '#155e75', initials: 'KS', emoji: '🦈',
  },
  {
    id: 'e_danzo_boss', name: 'Danzo Shimura', role: 'Striker', natures: ['Wind', 'Earth', 'Water'],
    stats: { hp: 1.0, atk: 0.9, def: 1.0 },
    mechanics: [
      { type: 'telegraphAoE', name: 'Wind Style: Vacuum Bullets', nature: 'Wind', target: 'all' },
      { type: 'reviveOnce', name: 'Izanagi' },
    ],
    color: '#374151', initials: 'DS', emoji: '🩻',
  },
  {
    id: 'e_sasuke_summit_boss', name: 'Sasuke Uchiha', basedOn: 'sasuke', role: 'Striker', natures: ['Fire', 'Lightning'],
    stats: { hp: 1.0, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Chidori Sharp Spear', nature: 'Lightning', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Amaterasu', nature: 'Fire', target: 'back', power: 1.3 },
      { type: 'shieldPhase', name: 'Susanoo', atHp: [0.6, 0.3] },
      { type: 'enrage', name: 'Inferno Style: Flame Control', atHp: [0.25] },
    ],
    color: '#3b82f6', initials: 'SU', emoji: '🔥',
  },

  // ==================== Fourth Great Ninja War: Countdown ====================
  {
    id: 'e_giant_squid', name: 'Giant Squid', role: 'Tank', natures: ['Water'], targeting: 'protected',
    stats: { hp: 1.5, atk: 0.8, def: 1.0, speed: 0.8 },
    color: '#7c2d12', initials: 'GS', emoji: '🦑',
  },
  {
    id: 'e_nine_tails', name: 'Nine-Tails', role: 'Striker', natures: ['Fire', 'Wind'],
    stats: { hp: 1.05, atk: 0.9, def: 1.05 },
    mechanics: [
      { type: 'telegraphAoE', name: 'Tailed Beast Bomb', nature: null, target: 'all', power: 1.2, windup: 1.2 },
      { type: 'enrage', name: 'Tailed Beast Chakra Arms', atHp: [0.4] },
    ],
    color: '#ea580c', initials: '9T', emoji: '🦊',
  },
  {
    id: 'e_kisame_island', name: 'Kisame Hoshigaki', basedOn: 'kisame', role: 'Striker', natures: ['Water'],
    stats: { hp: 1.7, atk: 0.9, def: 1.05 },
    jutsu: { name: 'Water Style: Thousand Hungry Sharks', nature: 'Water', type: 'aoe' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Water Style: Super Shark Bomb Jutsu', nature: 'Water', target: 'all', power: 0.9 },
      { type: 'lifesteal', name: 'Shark Skin' },
    ],
    color: '#155e75', initials: 'KS', emoji: '🦈',
  },
  {
    id: 'e_tobi_boss', name: 'Tobi', basedOn: 'obito', role: 'Striker', natures: ['Fire'],
    stats: { hp: 1.0, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Kamui', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Fire Style: Fireball Jutsu', nature: 'Fire', target: 'all' },
      { type: 'shieldPhase', name: 'Kamui', atHp: [0.7, 0.4] },
      { type: 'reviveOnce', name: 'Izanagi', power: 0.8 },
    ],
    color: '#f97316', initials: 'TO', emoji: '🌀',
  },

  // ================== Fourth Great Ninja War: Confrontation ==================
  {
    id: 'e_zabuza_re', name: 'Zabuza Momochi (Reanimated)', basedOn: 'zabuza', role: 'Striker', natures: ['Water'],
    stats: { hp: 1.2, atk: 0.95, def: 1.0, interval: 1.1 },
    jutsu: { name: 'Silent Killing', type: 'single' },
    mechanics: [
      { type: 'shieldPhase', name: 'Ninja Art: Hidden Mist Jutsu', atHp: [0.5] },
      { type: 'regen', name: 'Summoning Jutsu: Reanimation', power: 0.8 },
    ],
    color: '#475569', initials: 'ZM', emoji: '🗡️',
  },
  {
    id: 'e_haku_re', name: 'Haku (Reanimated)', basedOn: 'haku', role: 'Ranged', natures: ['Water', 'Wind'],
    stats: { hp: 1.05, atk: 0.9, def: 0.95, interval: 0.9 },
    jutsu: { name: 'Secret Jutsu: Crystal Ice Mirrors', nature: 'Water', type: 'aoe' },
    mechanics: [{ type: 'regen', name: 'Summoning Jutsu: Reanimation', power: 0.8 }],
    color: '#7dd3fc', initials: 'HA', emoji: '❄️',
  },
  {
    id: 'e_kinkaku', name: 'Kinkaku', role: 'Striker', natures: [],
    stats: { hp: 1.2, atk: 0.95, def: 1.0 },
    jutsu: { name: 'Leaf Fan', type: 'aoe' },
    mechanics: [{ type: 'enrage', name: 'Nine-Tails', atHp: [0.5] }],
    color: '#ca8a04', initials: 'KN', emoji: '🥇',
  },
  {
    id: 'e_ginkaku', name: 'Ginkaku', role: 'Striker', natures: [],
    stats: { hp: 1.1, atk: 0.95, def: 1.0 },
    jutsu: { name: 'Amber Purification Jar', type: 'single' },
    color: '#a1a1aa', initials: 'GN', emoji: '🥈',
  },
  {
    id: 'e_asuma_re', name: 'Asuma Sarutobi (Reanimated)', basedOn: 'asuma', role: 'Striker', natures: ['Wind'],
    stats: { hp: 1.7, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Fire Style: Burning Ash', nature: 'Fire', type: 'aoe' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Flying Swallow', nature: 'Wind', target: 'front', power: 1.1 },
      { type: 'regen', name: 'Summoning Jutsu: Reanimation', power: 0.8 },
    ],
    color: '#0f766e', initials: 'AS', emoji: '🚬',
  },
  {
    id: 'e_nagato_boss', name: 'Nagato (Reanimated)', basedOn: 'pain', role: 'Ranged', natures: ['Water'],
    stats: { hp: 1.0, atk: 0.9, def: 1.05 },
    jutsu: { name: 'Universal Pull', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Planetary Devastation', nature: null, target: 'all', stun: true, power: 1.1 },
      { type: 'regen', name: 'King of Hell' },
      { type: 'reflect', name: 'Almighty Push', power: 0.8 },
    ],
    color: '#b91c1c', initials: 'NA', emoji: '🌀',
  },
  {
    id: 'e_mu_fragment', name: 'Mu (Fragmentation)', role: 'Ranged', natures: ['Earth'],
    stats: { hp: 0.5, atk: 0.7, def: 0.8 },
    color: '#a8a29e', initials: 'MU', emoji: '👤',
  },
  {
    id: 'e_mu_boss', name: 'Mu (Reanimated)', role: 'Ranged', natures: ['Earth', 'Wind', 'Fire'],
    stats: { hp: 1.0, atk: 0.9, def: 1.0 },
    mechanics: [
      { type: 'telegraphAoE', name: 'Particle Style: Atomic Dismantling Jutsu', nature: 'Earth', target: 'front', power: 1.3 },
      { type: 'shieldPhase', name: 'Transparency Jutsu', atHp: [0.7, 0.4] },
      { type: 'summonAdds', name: 'Fragmentation', enemy: 'e_mu_fragment', count: 1, atHp: [0.5] },
    ],
    color: '#d6d3d1', initials: 'MU', emoji: '🫥',
  },

  // ===================== Fourth Great Ninja War: Climax ======================
  {
    id: 'e_madara_re', name: 'Madara Uchiha (Reanimated)', basedOn: 'madara', role: 'Striker', natures: ['Fire', 'Earth', 'Water'],
    stats: { hp: 3.2, atk: 0.75, def: 1.2 },
    jutsu: { name: 'Fire Style: Majestic Destroyer Flame', nature: 'Fire', type: 'aoe' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Tengai Shinsei', nature: null, target: 'all', power: 1.2, windup: 1.4 },
      { type: 'regen', name: 'Summoning Jutsu: Reanimation', power: 0.8 },
    ],
    color: '#450a0a', initials: 'MU', emoji: '☄️',
  },
  {
    id: 'e_four_tails', name: 'Four-Tails', role: 'Striker', natures: ['Fire', 'Earth'],
    stats: { hp: 1.7, atk: 0.9, def: 1.1 },
    jutsu: { name: 'Tailed Beast Bomb', type: 'aoe' },
    color: '#b45309', initials: '4T', emoji: '🐒',
  },
  {
    id: 'e_kabuto_sage_boss', name: 'Kabuto Yakushi (Sage Mode)', basedOn: 'kabuto', role: 'Ranged', natures: ['Earth', 'Water'],
    stats: { hp: 1.0, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Sage Art: White Extreme Attack', type: 'aoe' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Sage Art: Inorganic Animation', nature: 'Earth', target: 'all' },
      { type: 'summonAdds', name: 'Demon Twin Jutsu', enemy: 'e_ukon', count: 1, atHp: [0.6] },
      { type: 'regen', name: 'Healing Jutsu' },
    ],
    color: '#6d28d9', initials: 'KB', emoji: '🐍',
  },
  {
    id: 'e_ten_tails_clone', name: 'Ten-Tails Clone', role: 'Striker', natures: ['Earth', 'Water'],
    stats: { hp: 0.9, atk: 0.9, def: 0.95 },
    color: '#6b7280', initials: 'TC', emoji: '👾',
  },
  {
    id: 'e_obito_boss', name: 'Obito Uchiha', basedOn: 'obito', role: 'Striker', natures: ['Fire', 'Earth', 'Water'],
    stats: { hp: 1.0, atk: 0.9, def: 1.0 },
    jutsu: { name: 'Fire Style: Fireball Jutsu', nature: 'Fire', type: 'aoe' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Wood Style: Cutting Sprigs Jutsu', nature: 'Earth', target: 'all' },
      { type: 'shieldPhase', name: 'Kamui', atHp: [0.6, 0.3] },
    ],
    color: '#312e81', initials: 'OU', emoji: '🕳️',
  },

  // ================== Kakashi: Shadow of the ANBU Black Ops ==================
  {
    id: 'e_foundation_op', name: 'Foundation Operative', role: 'Striker', natures: [],
    stats: { hp: 0.9, atk: 0.9, def: 0.9 },
    color: '#27272a', initials: 'FO', emoji: '🥷',
  },
  {
    id: 'e_foundation_sniper', name: 'Foundation Operative', role: 'Ranged', natures: [], targeting: 'backline',
    stats: { hp: 0.8, atk: 0.9, def: 0.85 },
    color: '#3f3f46', initials: 'FO', emoji: '🥷',
  },
  {
    id: 'e_gotta', name: 'Gotta', role: 'Striker', natures: [],
    stats: { hp: 1.6, atk: 0.95, def: 0.9 },
    mechanics: [{ type: 'lifesteal', power: 0.8 }],
    color: '#d4d4d4', initials: 'GO', emoji: '💨',
  },
  {
    id: 'e_kinoe_boss', name: 'Kinoe', basedOn: 'yamato', role: 'Tank', natures: ['Earth', 'Water'],
    stats: { hp: 0.85, atk: 0.95, def: 0.95 },
    jutsu: { name: 'Wood Style: Four Pillar Prison Jutsu', nature: 'Earth', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Wood Style: Four Pillar House Jutsu', nature: 'Earth', target: 'front', stun: true },
      { type: 'shieldPhase', name: 'Wood Style: Domed Wall Jutsu', atHp: [0.5] },
      { type: 'summonAdds', name: 'Wood Style: Wood Clone Jutsu', enemy: 'e_wood_clone', count: 2, atHp: [0.7] },
    ],
    color: '#92400e', initials: 'KI', emoji: '🌲',
  },

  // ================= Birth of the Ten-Tails' Jinchuriki =====================
  {
    id: 'e_obito_jinchuriki', name: 'Obito Uchiha (Ten-Tails Jinchuriki)', basedOn: 'obito', role: 'Striker', natures: ['Fire', 'Earth', 'Water'],
    stats: { hp: 3.2, atk: 0.75, def: 1.2 },
    jutsu: { name: 'Truth-Seeking Ball', type: 'single' },
    mechanics: [{ type: 'shieldPhase', name: 'Truth-Seeking Ball', atHp: [0.5] }],
    color: '#f5f5f4', initials: 'OU', emoji: '⚫',
  },
  {
    id: 'e_obito_jin_boss', name: 'Obito Uchiha (Ten-Tails Jinchuriki)', basedOn: 'obito', role: 'Striker', natures: ['Fire', 'Earth', 'Water'],
    stats: { hp: 1.0, atk: 0.9, def: 1.05 },
    jutsu: { name: 'Truth-Seeking Ball', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Tailed Beast Bomb', nature: null, target: 'all', power: 1.2 },
      { type: 'shieldPhase', name: 'Truth-Seeking Ball', atHp: [0.6, 0.3] },
      { type: 'regen', name: 'Six Paths Sage Jutsu' },
    ],
    color: '#f5f5f4', initials: 'OU', emoji: '⚫',
  },
  {
    id: 'e_madara_sixpaths', name: 'Madara Uchiha', basedOn: 'madara', role: 'Striker', natures: ['Fire', 'Earth', 'Water'],
    stats: { hp: 2.2, atk: 0.85, def: 1.1 },
    jutsu: { name: 'Truth-Seeking Ball', type: 'aoe' },
    mechanics: [{ type: 'shieldPhase', name: 'Truth-Seeking Ball', atHp: [0.5] }],
    color: '#450a0a', initials: 'MU', emoji: '☄️',
  },
  {
    id: 'e_madara_boss', name: 'Madara Uchiha', basedOn: 'madara', role: 'Striker', natures: ['Fire', 'Earth', 'Water'],
    stats: { hp: 1.0, atk: 0.9, def: 1.05 },
    jutsu: { name: 'Truth-Seeking Ball', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: 'Limbo: Hengoku', nature: null, target: 'all', stun: true, power: 1.1 },
      { type: 'shieldPhase', name: 'Truth-Seeking Ball', atHp: [0.6, 0.3] },
      { type: 'enrage', name: 'Six Paths Sage Jutsu', atHp: [0.3] },
    ],
    color: '#450a0a', initials: 'MU', emoji: '☄️',
  },

  // ========================= Kaguya Otsutsuki Strikes ========================
  // Kaguya's natures stand for her dimensions (lava, ice, desert): a design
  // mapping, not canon natures (NAMING.md).
  {
    id: 'e_kaguya', name: 'Kaguya Otsutsuki', role: 'Ranged', natures: ['Fire', 'Water', 'Earth'],
    stats: { hp: 3.2, atk: 0.75, def: 1.2 },
    jutsu: { name: 'All-Killing Ash Bones', type: 'single' },
    mechanics: [{ type: 'elementSwap', name: 'Amenominaka', sequence: ['Fire', 'Water', 'Earth'] }],
    color: '#e9d5ff', initials: 'KO', emoji: '🐇',
  },
  {
    id: 'e_kaguya_boss', name: 'Kaguya Otsutsuki', role: 'Ranged', natures: ['Fire', 'Water', 'Earth'],
    stats: { hp: 1.0, atk: 0.9, def: 1.05 },
    jutsu: { name: 'Eighty Gods Vacuum Attack', type: 'single' },
    mechanics: [
      { type: 'elementSwap', name: 'Amenominaka', sequence: ['Fire', 'Water', 'Earth'] },
      { type: 'telegraphAoE', name: 'Expansive Truth-Seeking Ball', nature: null, target: 'all', power: 1.3, windup: 1.3 },
      { type: 'reflect', name: 'Yomotsu Hirasaka', power: 0.8 },
    ],
    color: '#e9d5ff', initials: 'KO', emoji: '🐇',
  },
  {
    id: 'e_sasuke_final', name: 'Sasuke Uchiha (Rinnegan)', basedOn: 'sasuke', role: 'Striker', natures: ['Fire', 'Lightning'],
    stats: { hp: 1.5, atk: 0.9, def: 1.05 },
    jutsu: { name: 'Chidori', nature: 'Lightning', type: 'single' },
    mechanics: [{ type: 'shieldPhase', name: 'Susanoo', atHp: [0.5] }],
    color: '#1e1b4b', initials: 'SU', emoji: '🟣',
  },
  {
    id: 'e_sasuke_final_boss', name: 'Sasuke Uchiha (Rinnegan)', basedOn: 'sasuke', role: 'Striker', natures: ['Fire', 'Lightning'],
    stats: { hp: 1.0, atk: 0.9, def: 1.05 },
    jutsu: { name: 'Amaterasu', nature: 'Fire', type: 'single' },
    mechanics: [
      { type: 'telegraphAoE', name: "Indra's Arrow", nature: 'Lightning', target: 'all', power: 1.4, windup: 1.4 },
      { type: 'shieldPhase', name: 'Susanoo', atHp: [0.6, 0.3] },
      { type: 'enrage', name: 'Inferno Style: Flame Control', atHp: [0.25] },
    ],
    color: '#1e1b4b', initials: 'SU', emoji: '🟣',
  },

  // ========================= Protect targets (Civilian) =======================
  { id: 'npc_hotaru', name: 'Hotaru', role: 'Civilian', natures: [], stats: { hp: 1.0 }, color: '#fcd34d', initials: 'HO', emoji: '🐞' },
  { id: 'npc_leaf_villager', name: 'Leaf Villager', role: 'Civilian', natures: [], stats: { hp: 1.0 }, color: '#bef264', initials: 'LV', emoji: '🏘️' },
  { id: 'npc_motoi', name: 'Motoi', role: 'Civilian', natures: [], stats: { hp: 1.1 }, color: '#e7e5e4', initials: 'MO', emoji: '🏝️' },
  { id: 'npc_tazuna', name: 'Tazuna', role: 'Civilian', natures: [], stats: { hp: 1.0 }, color: '#a8a29e', initials: 'TZ', emoji: '🌉' },
  { id: 'npc_tsunami', name: 'Tsunami', role: 'Civilian', natures: [], stats: { hp: 0.9 }, color: '#fda4af', initials: 'TN', emoji: '🏠' },
  { id: 'npc_idate', name: 'Idate Morino', role: 'Civilian', natures: [], stats: { hp: 1.0 }, color: '#fbbf24', initials: 'ID', emoji: '🏃' },
  { id: 'npc_rokusuke', name: 'Rokusuke', role: 'Civilian', natures: [], stats: { hp: 0.9 }, color: '#d6d3d1', initials: 'RO', emoji: '🧑‍🌾' },

  // ========================= Akatsuki Boss Rush ==============================
  // Each has ONE telegraphed special (telegraphAoE); extras are passive/other types.
  {
    id: 'e_br_kisame', name: 'Kisame Hoshigaki', role: 'Striker', natures: ['Water'],
    stats: { hp: 1.05, atk: 0.9, def: 1.1 },
    mechanics: [
      { type: 'telegraphAoE', name: 'Water Style: Water Shark Bomb Jutsu', nature: 'Water', target: 'all' },
      { type: 'lifesteal', name: 'Shark Skin' },
    ],
    color: '#0e7490', initials: 'KS', emoji: '🦈',
  },
  {
    id: 'e_br_deidara', name: 'Deidara', role: 'Ranged', natures: ['Earth', 'Lightning'],
    stats: { hp: 0.95, atk: 1.0, def: 0.95 },
    mechanics: [
      { type: 'telegraphAoE', name: 'C3', nature: 'Earth', target: 'all', power: 1.15, windup: 1.2 },
      { type: 'elementSwap', name: 'Explosion Style', sequence: ['Earth', 'Lightning'] },
    ],
    color: '#fbbf24', initials: 'DE', emoji: '💥',
  },
  {
    id: 'e_br_sasori', name: 'Sasori', role: 'Ranged', natures: [],
    stats: { hp: 0.95, atk: 0.95, def: 1.0 },
    mechanics: [
      { type: 'telegraphAoE', name: 'Iron Sand: World Order', nature: null, target: 'all' },
      { type: 'summonAdds', name: 'Secret Red Move: Performance of a Hundred Puppets', enemy: 'e_puppet', count: 3, interval: 1.1 },
    ],
    color: '#b91c1c', initials: 'SA', emoji: '🪆',
  },
  {
    id: 'e_puppet', name: 'Puppet', role: 'Striker', natures: [],
    stats: { hp: 0.4, atk: 0.55, def: 0.8 },
    color: '#7f1d1d', initials: 'PU', emoji: '🪆',
  },
  {
    id: 'e_br_hidan', name: 'Hidan', role: 'Striker', natures: [],
    stats: { hp: 1.0, atk: 1.0, def: 0.95 },
    mechanics: [
      { type: 'telegraphAoE', name: 'Curse Jutsu', nature: null, target: 'random', power: 1.8 },
      { type: 'reviveOnce', name: 'Immortality' },
    ],
    color: '#e5e7eb', initials: 'HI', emoji: '⛧',
  },
  {
    id: 'e_br_kakuzu', name: 'Kakuzu', role: 'Tank', natures: ['Earth', 'Water', 'Fire', 'Wind', 'Lightning'],
    stats: { hp: 1.05, atk: 0.95, def: 1.05 },
    mechanics: [
      { type: 'telegraphAoE', name: 'Fire Style: Searing Migraine', nature: 'Fire', target: 'all' },
      { type: 'elementSwap', name: 'Earth Grudge', sequence: ['Earth', 'Water', 'Fire', 'Wind', 'Lightning'] },
      { type: 'reviveOnce', name: 'Earth Grudge', power: 0.7 },
    ],
    color: '#365314', initials: 'KK', emoji: '🧵',
  },
  {
    id: 'e_br_itachi', name: 'Itachi Uchiha', role: 'Ranged', natures: ['Fire', 'Water', 'Wind'],
    stats: { hp: 1.0, atk: 1.05, def: 1.0 },
    mechanics: [
      { type: 'telegraphAoE', name: 'Amaterasu', nature: 'Fire', target: 'back', power: 1.4 },
      { type: 'summonAdds', name: 'Shadow Clone Jutsu', enemy: 'e_itachi_clone', count: 2, atHp: [0.6, 0.3] },
    ],
    color: '#991b1b', initials: 'IU', emoji: '🌙',
  },
  {
    id: 'e_itachi_clone', name: 'Itachi (Shadow Clone)', role: 'Ranged', natures: ['Fire'],
    stats: { hp: 0.35, atk: 0.6, def: 0.8 },
    color: '#7f1d1d', initials: 'IC', emoji: '🌙',
  },
  {
    id: 'e_br_pain', name: 'Pain', role: 'Ranged', natures: ['Fire', 'Wind', 'Lightning', 'Earth', 'Water'],
    stats: { hp: 1.1, atk: 1.05, def: 1.1 },
    mechanics: [
      { type: 'telegraphAoE', name: 'Almighty Push', nature: null, target: 'all', stun: true, power: 1.1 },
      { type: 'reviveOnce', name: 'Six Paths of Pain', power: 0.8 },
    ],
    color: '#ea580c', initials: 'PA', emoji: '🌀',
  },
];

// Boss Rush configuration (content side). Numbers live in balance.js (bossRush.*).
export const BOSS_RUSH = {
  name: 'Akatsuki Boss Rush',
  unlockArc: 'arc_sasuke_recovery',
  order: ['e_br_kisame', 'e_br_deidara', 'e_br_sasori', 'e_br_hidan', 'e_br_kakuzu', 'e_br_itachi', 'e_br_pain'],
};

export default ENEMIES;
