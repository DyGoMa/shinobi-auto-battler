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

  // ========================= Protect targets (Civilian) =======================
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
