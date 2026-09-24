// roster.js — every PULLABLE character (and alternate forms).
// Pure data. See CONTENT_GUIDE.md for the schema and a copy-paste template.
//
// Field reference (short):
//   id          unique, lowercase_snake
//   name        English DUB name (see NAMING.md)
//   tier        'genin' | 'chunin' | 'jonin' | 'kage'   (gacha rarity: Common/Rare/Epic/Legendary)
//   role        'Tank' | 'Striker' | 'Ranged' | 'Support'
//   natures     subset of Fire/Wind/Lightning/Earth/Water ([] = neutral). First = defensive nature.
//               Rule (NAMING.md): natures used on-screen in the character's part; if none, the
//               nature Narutopedia marks as their affinity (else the first listed); kekkei genkai ->
//               component natures; taijutsu specialists -> [].
//   taijutsu    true for taijutsu specialists (neutral, never "resisted", pierce some DEF)
//   stats       RELATIVE weights vs the role template in balance.js (1 = average)
//   ult         { name (dub jutsu), type, nature?, stun? }  type by role:
//               Striker/Ranged: 'single'|'aoe'   Tank: 'taunt'   Support: 'heal'|'buff'
//   leader      { stat, scope? }  stat: atk|hp|def|speed|crit|chakra|startChakra|nature
//               scope: { tag } | { nature } | { role } | { tier } (omit = whole team)
//               The NUMBERS for leader buffs are in balance.js (leader.*).
//   tags        used by leader scopes (TAGS below gives display names)
//   unlock      null (in pools from the start) | { arcCleared: arcId } | { arcReached: arcId }
//   formOf      for alternate forms: id of the base character (a team can't field both)
//   starter     part of the first-load team (starterLeader = the starting Leader)
//   color       unique #rrggbb; initials/emoji are the only "art" (no official designs)

// Village labels use the dub's short forms ("Hidden Leaf", "Hidden Sand"…; see NAMING.md).
export const TAGS = {
  team7: 'Team 7', team8: 'Team 8', team10: 'Team 10', teamguy: 'Team Guy',
  sand: 'Hidden Sand ninja', sound: 'Hidden Sound ninja', sannin: 'the Legendary Sannin', mist: 'Hidden Mist ninja',
  hokage: 'Hokage', leaf: 'Hidden Leaf ninja', medic: 'medical ninja',
  akatsuki: 'Akatsuki', taka: 'Taka', cloud: 'Hidden Cloud ninja', stone: 'Hidden Stone ninja',
};

export const ROSTER = [
  // ============================ GENIN (Common) ============================
  {
    id: 'sakura', name: 'Sakura Haruno', short: 'Sakura', tier: 'genin', role: 'Support', natures: ['Earth'],
    stats: { hp: 1.0, atk: 0.95, def: 1.0 },
    ult: { name: 'Healing Jutsu', type: 'heal' },
    leader: { stat: 'hp', scope: { tag: 'team7' } },
    tags: ['team7', 'leaf', 'medic'], unlock: null, starter: true,
    color: '#f472b6', initials: 'SH', emoji: '🌸',
  },
  {
    id: 'ino', name: 'Ino Yamanaka', short: 'Ino', tier: 'genin', role: 'Ranged', natures: ['Earth'],
    stats: { hp: 0.95, atk: 0.95, def: 0.95 },
    ult: { name: 'Ninja Art: Mind Transfer Jutsu', type: 'single', stun: true },
    leader: { stat: 'chakra', scope: { tag: 'team10' } },
    tags: ['team10', 'leaf'], unlock: null,
    color: '#fde047', initials: 'IY', emoji: '💐',
  },
  {
    id: 'choji', name: 'Choji Akimichi', short: 'Choji', tier: 'genin', role: 'Tank', natures: ['Earth'],
    stats: { hp: 1.12, atk: 1.05, def: 0.95 },
    ult: { name: 'Human Boulder', type: 'taunt' },
    leader: { stat: 'hp', scope: { tag: 'team10' } },
    tags: ['team10', 'leaf'], unlock: null,
    color: '#b45309', initials: 'CA', emoji: '🍖',
  },
  {
    id: 'kiba', name: 'Kiba Inuzuka', short: 'Kiba', tier: 'genin', role: 'Striker', natures: ['Earth'],
    stats: { hp: 1.0, atk: 1.02, def: 0.95, interval: 0.92 },
    ult: { name: 'Man-Beast Ultimate Taijutsu: Fang Over Fang', type: 'single' },
    leader: { stat: 'speed', scope: { tag: 'team8' } },
    tags: ['team8', 'leaf'], unlock: null,
    color: '#a16207', initials: 'KI', emoji: '🐕',
  },
  {
    id: 'shino', name: 'Shino Aburame', short: 'Shino', tier: 'genin', role: 'Ranged', natures: ['Earth'],
    stats: { hp: 1.05, atk: 0.95, def: 1.05 },
    ult: { name: 'Parasitic Insects Jutsu', type: 'aoe' },
    leader: { stat: 'def', scope: { tag: 'team8' } },
    tags: ['team8', 'leaf'], unlock: null,
    color: '#4d7c0f', initials: 'SA', emoji: '🪲',
  },
  {
    id: 'hinata', name: 'Hinata Hyuga', short: 'Hinata', tier: 'genin', role: 'Tank', natures: ['Fire'],
    stats: { hp: 0.95, atk: 1.1, def: 1.05, interval: 0.95 },
    ult: { name: 'Protective Eight Trigrams Sixty-Four Palms', type: 'taunt' },
    leader: { stat: 'crit', scope: { tag: 'team8' } },
    tags: ['team8', 'leaf'], unlock: null,
    color: '#a78bfa', initials: 'HH', emoji: '🪻',
  },
  {
    id: 'tenten', name: 'Tenten', short: 'Tenten', tier: 'genin', role: 'Ranged', natures: [],
    stats: { hp: 0.95, atk: 1.05, def: 0.95, crit: 1.3 },
    ult: { name: 'Rising Twin Dragons', type: 'aoe' },
    leader: { stat: 'crit', scope: { role: 'Ranged' } },
    tags: ['teamguy', 'leaf'], unlock: null,
    color: '#e11d48', initials: 'TT', emoji: '🎯',
  },
  {
    id: 'iruka', name: 'Iruka Umino', short: 'Iruka', tier: 'genin', role: 'Ranged', natures: ['Fire'],
    stats: { hp: 1.05, atk: 0.95, def: 1.05 },
    ult: { name: 'Demonic Illusion: Death Mirage Jutsu', type: 'single', stun: true },
    leader: { stat: 'startChakra', scope: { tier: 'genin' } },
    tags: ['leaf'], unlock: null,
    color: '#0e7490', initials: 'IU', emoji: '📚',
  },
  {
    id: 'jirobo', name: 'Jirobo', short: 'Jirobo', tier: 'genin', role: 'Tank', natures: ['Earth'],
    stats: { hp: 1.15, atk: 1.0, def: 1.05, speed: 0.9 },
    ult: { name: 'Earth Style Barrier: Earth Dome Prison', type: 'taunt', nature: 'Earth' },
    leader: { stat: 'hp', scope: { tag: 'sound' } },
    tags: ['sound'], unlock: { arcCleared: 'arc_sasuke_recovery' },
    color: '#c2410c', initials: 'JI', emoji: '🪨',
  },

  // ============================ CHUNIN (Rare) =============================
  {
    id: 'naruto', name: 'Naruto Uzumaki', short: 'Naruto', tier: 'chunin', role: 'Striker', natures: ['Wind'],
    stats: { hp: 1.1, atk: 1.0, def: 1.0 },
    ult: { name: 'Rasengan', type: 'single', nature: 'Wind' },
    leader: { stat: 'chakra' },
    tags: ['team7', 'leaf'], unlock: null, starter: true,
    color: '#f97316', initials: 'NU', emoji: '🍥',
  },
  {
    id: 'sasuke', name: 'Sasuke Uchiha', short: 'Sasuke', tier: 'chunin', role: 'Striker', natures: ['Fire', 'Lightning'],
    stats: { hp: 0.95, atk: 1.08, def: 0.95 },
    ult: { name: 'Chidori', type: 'single', nature: 'Lightning' },
    leader: { stat: 'atk', scope: { nature: 'Fire' } },
    tags: ['team7', 'leaf'], unlock: null, starter: true,
    color: '#3b82f6', initials: 'SU', emoji: '⚡',
  },
  {
    id: 'lee', name: 'Rock Lee', short: 'Lee', tier: 'chunin', role: 'Striker', natures: [], taijutsu: true,
    stats: { hp: 1.0, atk: 1.02, def: 0.95, interval: 0.85 },
    ult: { name: 'Primary Lotus', type: 'single' },
    leader: { stat: 'speed', scope: { tag: 'teamguy' } },
    tags: ['teamguy', 'leaf'], unlock: null,
    color: '#16a34a', initials: 'RL', emoji: '🥋',
  },
  {
    id: 'neji', name: 'Neji Hyuga', short: 'Neji', tier: 'chunin', role: 'Striker', natures: ['Fire'],
    stats: { hp: 1.0, atk: 1.05, def: 1.05 },
    ult: { name: 'Gentle Fist Art: Eight Trigrams Sixty-Four Palms', type: 'single', stun: true },
    leader: { stat: 'crit', scope: { tag: 'teamguy' } },
    tags: ['teamguy', 'leaf'], unlock: null,
    color: '#94a3b8', initials: 'NH', emoji: '👁️',
  },
  {
    id: 'shikamaru', name: 'Shikamaru Nara', short: 'Shikamaru', tier: 'chunin', role: 'Ranged', natures: ['Fire'],
    stats: { hp: 1.0, atk: 0.95, def: 1.0 },
    ult: { name: 'Shadow Possession Jutsu', type: 'single', stun: true },
    leader: { stat: 'startChakra' },
    tags: ['team10', 'leaf'], unlock: null,
    color: '#57534e', initials: 'SN', emoji: '♟️',
  },
  {
    id: 'temari', name: 'Temari', short: 'Temari', tier: 'chunin', role: 'Ranged', natures: ['Wind'],
    stats: { hp: 1.0, atk: 1.05, def: 0.95 },
    ult: { name: 'Ninja Art: Wind Scythe Jutsu', type: 'aoe', nature: 'Wind' },
    leader: { stat: 'atk', scope: { nature: 'Wind' } },
    tags: ['sand'], unlock: { arcCleared: 'arc_konoha_crush' },
    color: '#ca8a04', initials: 'TE', emoji: '🪭',
  },
  {
    id: 'kankuro', name: 'Kankuro', short: 'Kankuro', tier: 'chunin', role: 'Tank', natures: ['Wind'],
    stats: { hp: 1.05, atk: 1.0, def: 1.05 },
    ult: { name: 'Puppet Master Jutsu', type: 'taunt' },
    leader: { stat: 'def', scope: { tag: 'sand' } },
    tags: ['sand'], unlock: { arcCleared: 'arc_konoha_crush' },
    color: '#7c3aed', initials: 'KA', emoji: '🎭',
  },
  {
    id: 'haku', name: 'Haku', short: 'Haku', tier: 'chunin', role: 'Ranged', natures: ['Water', 'Wind'],
    stats: { hp: 0.95, atk: 1.02, def: 0.95, interval: 0.9 },
    ult: { name: 'Secret Jutsu: Crystal Ice Mirrors', type: 'aoe', nature: 'Water' },
    leader: { stat: 'nature' },
    tags: ['mist'], unlock: { arcCleared: 'arc_waves' },
    color: '#7dd3fc', initials: 'HA', emoji: '❄️',
  },
  {
    id: 'shizune', name: 'Shizune', short: 'Shizune', tier: 'chunin', role: 'Ranged', natures: [],
    stats: { hp: 1.0, atk: 1.0, def: 1.0 },
    ult: { name: 'Ninja Art: Poison Fog', type: 'aoe' },
    leader: { stat: 'hp', scope: { tag: 'medic' } },
    tags: ['leaf', 'medic'], unlock: { arcCleared: 'arc_tsunade' },
    color: '#1e3a8a', initials: 'SZ', emoji: '🐖',
  },
  {
    id: 'tayuya', name: 'Tayuya', short: 'Tayuya', tier: 'chunin', role: 'Ranged', natures: [],
    stats: { hp: 0.95, atk: 1.0, def: 0.95 },
    ult: { name: 'Demon Flute: Chains of Fantasia', type: 'aoe', stun: true },
    leader: { stat: 'chakra', scope: { tag: 'sound' } },
    tags: ['sound'], unlock: { arcCleared: 'arc_sasuke_recovery' },
    color: '#fb7185', initials: 'TA', emoji: '🪈',
  },
  {
    id: 'kidomaru', name: 'Kidomaru', short: 'Kidomaru', tier: 'chunin', role: 'Ranged', natures: [],
    stats: { hp: 0.95, atk: 1.08, def: 0.95 },
    ult: { name: 'Spider Bow: Fierce Rip', type: 'single' },
    leader: { stat: 'crit', scope: { tag: 'sound' } },
    tags: ['sound'], unlock: { arcCleared: 'arc_sasuke_recovery' },
    color: '#78716c', initials: 'KD', emoji: '🕷️',
  },
  {
    id: 'sakon', name: 'Sakon and Ukon', short: 'Sakon', tier: 'chunin', role: 'Striker', natures: [],
    stats: { hp: 1.05, atk: 1.02, def: 1.0 },
    ult: { name: 'Multiple Fists Barrage', type: 'single' },
    leader: { stat: 'atk', scope: { tag: 'sound' } },
    tags: ['sound'], unlock: { arcCleared: 'arc_sasuke_recovery' },
    color: '#6b21a8', initials: 'SK', emoji: '👥',
  },

  // ============================ JONIN (Epic) ==============================
  {
    id: 'kakashi', name: 'Kakashi Hatake', short: 'Kakashi', tier: 'jonin', role: 'Striker', natures: ['Lightning', 'Earth', 'Water'],
    stats: { hp: 1.0, atk: 1.02, def: 1.0 },
    ult: { name: 'Lightning Blade', type: 'single', nature: 'Lightning' },
    leader: { stat: 'atk', scope: { tag: 'team7' } },
    tags: ['team7', 'leaf'], unlock: null, starter: true, starterLeader: true,
    color: '#cbd5e1', initials: 'KH', emoji: '📕',
  },
  {
    id: 'guy', name: 'Might Guy', short: 'Guy', tier: 'jonin', role: 'Striker', natures: [], taijutsu: true,
    canonNatures: ['Fire', 'Lightning'],
    stats: { hp: 1.08, atk: 1.02, def: 1.0, interval: 0.88 },
    ult: { name: 'Dynamic Entry', type: 'single' },
    leader: { stat: 'atk', scope: { tag: 'teamguy' } },
    tags: ['teamguy', 'leaf'], unlock: null,
    color: '#15803d', initials: 'MG', emoji: '👍',
  },
  {
    id: 'asuma', name: 'Asuma Sarutobi', short: 'Asuma', tier: 'jonin', role: 'Striker', natures: ['Wind'],
    stats: { hp: 1.05, atk: 1.0, def: 1.0 },
    ult: { name: 'Flying Swallow', type: 'aoe', nature: 'Wind' },
    leader: { stat: 'atk', scope: { tag: 'team10' } },
    tags: ['team10', 'leaf'], unlock: null,
    color: '#0f766e', initials: 'AS', emoji: '🚬',
  },
  {
    id: 'kurenai', name: 'Kurenai Yuhi', short: 'Kurenai', tier: 'jonin', role: 'Ranged', natures: [],
    stats: { hp: 1.0, atk: 1.0, def: 1.0 },
    ult: { name: 'Tree Bind Death', type: 'single', stun: true },
    leader: { stat: 'atk', scope: { tag: 'team8' } },
    tags: ['team8', 'leaf'], unlock: null,
    color: '#be123c', initials: 'KY', emoji: '🌹',
  },
  {
    id: 'zabuza', name: 'Zabuza Momochi', short: 'Zabuza', tier: 'jonin', role: 'Striker', natures: ['Water'],
    stats: { hp: 1.05, atk: 1.05, def: 0.95, interval: 1.1 },
    ult: { name: 'Water Style: Water Dragon Jutsu', type: 'aoe', nature: 'Water' },
    leader: { stat: 'atk', scope: { nature: 'Water' } },
    tags: ['mist'], unlock: { arcCleared: 'arc_waves' },
    color: '#475569', initials: 'ZM', emoji: '🗡️',
  },
  {
    id: 'gaara', name: 'Gaara', short: 'Gaara', tier: 'jonin', role: 'Tank', natures: ['Wind'],
    stats: { hp: 1.05, atk: 1.05, def: 1.1, speed: 0.9 },
    ult: { name: 'Sand Shield', type: 'taunt' },
    leader: { stat: 'def' },
    tags: ['sand'], unlock: { arcCleared: 'arc_konoha_crush' },
    color: '#b91c1c', initials: 'GA', emoji: '🏺',
  },
  {
    id: 'kabuto', name: 'Kabuto Yakushi', short: 'Kabuto', tier: 'jonin', role: 'Striker', natures: ['Earth'],
    stats: { hp: 1.05, atk: 1.0, def: 1.0 },
    ult: { name: 'Chakra Scalpel', type: 'single' },
    leader: { stat: 'hp', scope: { tag: 'sound' } },
    tags: ['sound', 'medic'], unlock: { arcCleared: 'arc_tsunade' },
    color: '#6d28d9', initials: 'KB', emoji: '👓',
  },
  {
    id: 'kimimaro', name: 'Kimimaro', short: 'Kimimaro', tier: 'jonin', role: 'Striker', natures: [],
    stats: { hp: 1.05, atk: 1.05, def: 1.05 },
    ult: { name: 'Bracken Dance', type: 'aoe' },
    leader: { stat: 'atk', scope: { tag: 'sound' } },
    tags: ['sound'], unlock: { arcCleared: 'arc_sasuke_recovery' },
    color: '#e7e5e4', initials: 'KM', emoji: '🦴',
  },

  // ============================ KAGE (Legendary) ==========================
  {
    id: 'hiruzen', name: 'Hiruzen Sarutobi', short: 'Hiruzen', tier: 'kage', role: 'Ranged', natures: ['Fire', 'Earth'],
    stats: { hp: 1.0, atk: 1.02, def: 1.05 },
    ult: { name: 'Sealing Jutsu: Reaper Death Seal', type: 'single', stun: true },
    leader: { stat: 'chakra' },
    tags: ['leaf', 'hokage'], unlock: null,
    color: '#dc2626', initials: 'HS', emoji: '🔥',
  },
  {
    id: 'jiraiya', name: 'Jiraiya', short: 'Jiraiya', tier: 'kage', role: 'Support', natures: ['Fire', 'Earth'],
    stats: { hp: 1.1, atk: 1.05, def: 1.0 },
    ult: { name: 'Summoning Jutsu', type: 'buff' },
    leader: { stat: 'startChakra' },
    tags: ['leaf', 'sannin'], unlock: { arcCleared: 'arc_chunin' },
    color: '#991b1b', initials: 'JR', emoji: '🐸',
  },
  {
    id: 'tsunade', name: 'Tsunade', short: 'Tsunade', tier: 'kage', role: 'Support', natures: ['Lightning'],
    stats: { hp: 1.1, atk: 1.1, def: 1.0 },
    ult: { name: 'Ninja Art: Mitotic Regeneration', type: 'heal' },
    leader: { stat: 'hp' },
    tags: ['leaf', 'sannin', 'medic'], unlock: { arcCleared: 'arc_tsunade' },
    color: '#10b981', initials: 'TS', emoji: '💎',
  },
  {
    id: 'orochimaru', name: 'Orochimaru', short: 'Orochimaru', tier: 'kage', role: 'Ranged', natures: ['Wind', 'Earth'],
    stats: { hp: 1.0, atk: 1.08, def: 1.0 },
    ult: { name: 'Striking Shadow Snakes', type: 'single' },
    leader: { stat: 'atk', scope: { tag: 'sound' } },
    tags: ['sannin', 'sound'], unlock: { arcCleared: 'arc_tsunade' },
    color: '#6b7280', initials: 'OR', emoji: '🐍',
  },

  // ======================= ALTERNATE FORMS (examples) ======================
  // Late-game power comes from forms like these; Session 2 adds Shippuden forms.
  {
    id: 'naruto_ninetails', formOf: 'naruto', name: 'Naruto Uzumaki (Nine-Tails Chakra)', short: 'Naruto★', tier: 'jonin', role: 'Striker', natures: ['Wind'],
    stats: { hp: 1.1, atk: 1.05, def: 1.0 },
    ult: { name: 'Rasengan', type: 'single', nature: 'Wind' },
    leader: { stat: 'startChakra', scope: { tag: 'team7' } },
    tags: ['team7', 'leaf'], unlock: { arcCleared: 'arc_sasuke_recovery' },
    color: '#ea580c', initials: 'NU', emoji: '🦊',
  },
  {
    id: 'sasuke_cursemark', formOf: 'sasuke', name: "Sasuke Uchiha (Heavens' Curse Mark)", short: 'Sasuke★', tier: 'jonin', role: 'Striker', natures: ['Fire', 'Lightning'],
    stats: { hp: 1.0, atk: 1.1, def: 0.95 },
    ult: { name: 'Chidori', type: 'single', nature: 'Lightning' },
    leader: { stat: 'atk', scope: { nature: 'Lightning' } },
    tags: ['team7', 'sound'], unlock: { arcCleared: 'arc_sasuke_recovery' },
    color: '#4c1d95', initials: 'SU', emoji: '🌑',
  },

  // =========================================================================
  // PART II (Shippuden). Same rules; natures = natures used on screen in Part II,
  // else Narutopedia's affinity / first listed (NAMING.md). Villains join after
  // their arc is cleared; allies and forms when the story gives them the power.
  // =========================================================================

  // ============================ GENIN (Common) ============================
  {
    id: 'konohamaru', name: 'Konohamaru Sarutobi', short: 'Konohamaru', tier: 'genin', role: 'Striker', natures: ['Fire'],
    stats: { hp: 0.95, atk: 1.05, def: 0.95 },
    ult: { name: 'Rasengan', type: 'single' },
    leader: { stat: 'startChakra', scope: { tag: 'leaf' } },
    tags: ['leaf'], unlock: { arcCleared: 'arc_pain' },
    color: '#fbbf24', initials: 'KS', emoji: '🧣',
  },
  {
    id: 'karin', name: 'Karin', short: 'Karin', tier: 'genin', role: 'Support', natures: ['Earth'],
    stats: { hp: 0.95, atk: 0.9, def: 0.95 },
    ult: { name: 'Heal Bite', type: 'heal' },
    leader: { stat: 'chakra', scope: { tag: 'taka' } },
    tags: ['taka', 'sound'], unlock: { arcCleared: 'arc_itachi' },
    color: '#e0457b', initials: 'KR', emoji: '📡',
  },
  {
    id: 'jugo', name: 'Jugo', short: 'Jugo', tier: 'genin', role: 'Tank', natures: ['Wind'],
    stats: { hp: 1.15, atk: 1.05, def: 1.0, speed: 0.9 },
    ult: { name: 'Sage Transformation', type: 'taunt' },
    leader: { stat: 'hp', scope: { tag: 'taka' } },
    tags: ['taka', 'sound'], unlock: { arcCleared: 'arc_itachi' },
    color: '#d97706', initials: 'JU', emoji: '🐦',
  },
  {
    id: 'omoi', name: 'Omoi', short: 'Omoi', tier: 'genin', role: 'Striker', natures: ['Lightning'],
    stats: { hp: 1.0, atk: 1.02, def: 0.95 },
    ult: { name: 'Cloud Style: Crescent Moon Slice', type: 'single', nature: 'Lightning' },
    leader: { stat: 'crit', scope: { tag: 'cloud' } },
    tags: ['cloud'], unlock: { arcCleared: 'arc_summit' },
    color: '#9ca3af', initials: 'OM', emoji: '🍭',
  },
  {
    id: 'chojuro', name: 'Chojuro', short: 'Chojuro', tier: 'genin', role: 'Striker', natures: ['Water'],
    stats: { hp: 1.0, atk: 1.03, def: 0.95 },
    ult: { name: 'Hiramekarei', type: 'aoe', nature: 'Water' },
    leader: { stat: 'def', scope: { tag: 'mist' } },
    tags: ['mist'], unlock: { arcCleared: 'arc_summit' },
    color: '#60a5fa', initials: 'CJ', emoji: '🗡️',
  },

  // ============================ CHUNIN (Rare) =============================
  {
    id: 'sai', name: 'Sai', short: 'Sai', tier: 'chunin', role: 'Ranged', natures: ['Earth'],
    stats: { hp: 0.95, atk: 1.05, def: 0.95 },
    ult: { name: 'Ninja Art: Super Beast Scroll', type: 'aoe' },
    leader: { stat: 'crit', scope: { tag: 'team7' } },
    tags: ['team7', 'leaf'], unlock: { arcCleared: 'arc_tenchi' },
    color: '#1f2937', initials: 'SA', emoji: '🖌️',
  },
  {
    id: 'suigetsu', name: 'Suigetsu Hozuki', short: 'Suigetsu', tier: 'chunin', role: 'Striker', natures: ['Water'],
    stats: { hp: 1.05, atk: 1.03, def: 0.95 },
    ult: { name: 'Water Style: Great Water Arm', type: 'single', nature: 'Water' },
    leader: { stat: 'atk', scope: { tag: 'taka' } },
    tags: ['taka', 'mist'], unlock: { arcCleared: 'arc_itachi' },
    color: '#a5f3fc', initials: 'SH', emoji: '💧',
  },
  {
    id: 'kurotsuchi', name: 'Kurotsuchi', short: 'Kurotsuchi', tier: 'chunin', role: 'Ranged', natures: ['Fire', 'Earth'],
    stats: { hp: 1.0, atk: 1.02, def: 1.0 },
    ult: { name: 'Lava Style: Quicklime Jutsu', type: 'single', nature: 'Earth', stun: true },
    leader: { stat: 'def', scope: { tag: 'stone' } },
    tags: ['stone'], unlock: { arcCleared: 'arc_summit' },
    color: '#881337', initials: 'KT', emoji: '🌋',
  },

  // ============================ JONIN (Epic) ==============================
  {
    id: 'yamato', name: 'Yamato', short: 'Yamato', tier: 'jonin', role: 'Tank', natures: ['Earth', 'Water'],
    stats: { hp: 1.1, atk: 1.0, def: 1.1 },
    ult: { name: 'Wood Style: Four Pillar Prison Jutsu', type: 'taunt', nature: 'Earth' },
    leader: { stat: 'def', scope: { tag: 'team7' } },
    tags: ['team7', 'leaf'], unlock: { arcCleared: 'arc_tenchi' },
    color: '#92400e', initials: 'YA', emoji: '🌲',
  },
  {
    id: 'chiyo', name: 'Chiyo', short: 'Chiyo', tier: 'jonin', role: 'Support', natures: [],
    stats: { hp: 0.95, atk: 1.05, def: 1.0 },
    ult: { name: "Secret White Move: Chikamatsu's 10 Puppets", type: 'buff' },
    leader: { stat: 'atk', scope: { tag: 'sand' } },
    tags: ['sand', 'medic'], unlock: { arcCleared: 'arc_kazekage' },
    color: '#a8a29e', initials: 'CH', emoji: '👵',
  },
  {
    id: 'deidara', name: 'Deidara', short: 'Deidara', tier: 'jonin', role: 'Ranged', natures: ['Earth', 'Lightning'],
    stats: { hp: 0.95, atk: 1.08, def: 0.95 },
    ult: { name: 'C4 Karura', type: 'aoe', nature: 'Earth' },
    leader: { stat: 'nature', scope: { tag: 'akatsuki' } },
    tags: ['akatsuki', 'stone'], unlock: { arcCleared: 'arc_kazekage' },
    color: '#fde68a', initials: 'DE', emoji: '💥',
  },
  {
    id: 'sasori', name: 'Sasori', short: 'Sasori', tier: 'jonin', role: 'Ranged', natures: [],
    stats: { hp: 1.0, atk: 1.05, def: 1.0 },
    ult: { name: 'Secret Red Move: Performance of a Hundred Puppets', type: 'aoe' },
    leader: { stat: 'crit', scope: { tag: 'akatsuki' } },
    tags: ['akatsuki', 'sand'], unlock: { arcCleared: 'arc_kazekage' },
    color: '#9f1239', initials: 'SS', emoji: '🦂',
  },
  {
    id: 'hidan', name: 'Hidan', short: 'Hidan', tier: 'jonin', role: 'Striker', natures: [],
    stats: { hp: 1.1, atk: 1.05, def: 0.9 },
    ult: { name: 'Curse Jutsu', type: 'single' },
    leader: { stat: 'hp', scope: { tag: 'akatsuki' } },
    tags: ['akatsuki'], unlock: { arcCleared: 'arc_hidan' },
    color: '#d1d5db', initials: 'HI', emoji: '🔱',
  },
  {
    id: 'kakuzu', name: 'Kakuzu', short: 'Kakuzu', tier: 'jonin', role: 'Tank', natures: ['Earth', 'Water', 'Fire', 'Wind', 'Lightning'],
    stats: { hp: 1.1, atk: 1.0, def: 1.1, speed: 0.9 },
    ult: { name: 'Earth Style: Iron Skin', type: 'taunt', nature: 'Earth' },
    leader: { stat: 'def', scope: { tag: 'akatsuki' } },
    tags: ['akatsuki'], unlock: { arcCleared: 'arc_hidan' },
    color: '#365314', initials: 'KK', emoji: '🧵',
  },
  {
    id: 'kisame', name: 'Kisame Hoshigaki', short: 'Kisame', tier: 'jonin', role: 'Striker', natures: ['Water'],
    stats: { hp: 1.15, atk: 1.0, def: 1.0 },
    ult: { name: 'Water Style: Super Shark Bomb Jutsu', type: 'aoe', nature: 'Water' },
    leader: { stat: 'chakra', scope: { nature: 'Water' } },
    tags: ['akatsuki', 'mist'], unlock: { arcCleared: 'arc_countdown' },
    color: '#155e75', initials: 'KH', emoji: '🦈',
  },
  {
    id: 'konan', name: 'Konan', short: 'Konan', tier: 'jonin', role: 'Ranged', natures: ['Wind'],
    stats: { hp: 0.95, atk: 1.05, def: 1.0 },
    ult: { name: 'Sacred Paper Emissary Jutsu', type: 'aoe', nature: 'Wind' },
    leader: { stat: 'startChakra', scope: { tag: 'akatsuki' } },
    tags: ['akatsuki'], unlock: { arcCleared: 'arc_pain' },
    color: '#c084fc', initials: 'KO', emoji: '📄',
  },
  {
    id: 'darui', name: 'Darui', short: 'Darui', tier: 'jonin', role: 'Ranged', natures: ['Lightning', 'Water'],
    stats: { hp: 1.0, atk: 1.05, def: 1.0 },
    ult: { name: 'Gale Style: Laser Circus', type: 'aoe', nature: 'Lightning' },
    leader: { stat: 'atk', scope: { tag: 'cloud' } },
    tags: ['cloud'], unlock: { arcCleared: 'arc_summit' },
    color: '#fef3c7', initials: 'DA', emoji: '🌩️',
  },
  {
    id: 'killer_bee', name: 'Killer Bee', short: 'Killer Bee', tier: 'jonin', role: 'Striker', natures: ['Lightning'],
    stats: { hp: 1.1, atk: 1.05, def: 1.0 },
    ult: { name: 'Tailed Beast Bomb', type: 'aoe' },
    leader: { stat: 'speed', scope: { tag: 'cloud' } },
    tags: ['cloud'], unlock: { arcCleared: 'arc_brothers' },
    color: '#eab308', initials: 'KB', emoji: '🐙',
  },

  // ============================ KAGE (Legendary) ==========================
  {
    id: 'itachi', name: 'Itachi Uchiha', short: 'Itachi', tier: 'kage', role: 'Ranged', natures: ['Fire', 'Water', 'Wind'],
    stats: { hp: 1.0, atk: 1.08, def: 1.0 },
    ult: { name: 'Tsukuyomi', type: 'single', stun: true },
    leader: { stat: 'chakra', scope: { tag: 'akatsuki' } },
    tags: ['akatsuki', 'leaf'], unlock: { arcCleared: 'arc_brothers' },
    color: '#7f1d1d', initials: 'IU', emoji: '🌙',
  },
  {
    id: 'pain', name: 'Pain', short: 'Pain', tier: 'kage', role: 'Ranged', natures: ['Water', 'Wind'],
    stats: { hp: 1.05, atk: 1.05, def: 1.0 },
    ult: { name: 'Almighty Push', type: 'aoe', stun: true },
    leader: { stat: 'atk', scope: { tag: 'akatsuki' } },
    tags: ['akatsuki'], unlock: { arcCleared: 'arc_pain' },
    color: '#fb923c', initials: 'PA', emoji: '🌀',
  },
  {
    id: 'ay', name: 'Ay', short: 'Ay', tier: 'kage', role: 'Striker', natures: ['Lightning'],
    stats: { hp: 1.1, atk: 1.08, def: 1.0, speed: 1.1 },
    ult: { name: 'Liger Bomb', type: 'single', nature: 'Lightning', stun: true },
    leader: { stat: 'atk', scope: { nature: 'Lightning' } },
    tags: ['cloud'], unlock: { arcCleared: 'arc_summit' },
    color: '#d4d4d8', initials: 'AY', emoji: '💪',
  },
  {
    id: 'onoki', name: 'Onoki', short: 'Onoki', tier: 'kage', role: 'Ranged', natures: ['Earth', 'Wind', 'Fire'],
    stats: { hp: 0.95, atk: 1.1, def: 1.0 },
    ult: { name: 'Particle Style: Atomic Dismantling Jutsu', type: 'single', nature: 'Earth' },
    leader: { stat: 'def', scope: { tag: 'stone' } },
    tags: ['stone'], unlock: { arcCleared: 'arc_summit' },
    color: '#78350f', initials: 'ON', emoji: '⛰️',
  },
  {
    id: 'mei', name: 'Mei Terumi', short: 'Mei', tier: 'kage', role: 'Ranged', natures: ['Water', 'Fire', 'Earth'],
    stats: { hp: 1.0, atk: 1.06, def: 1.0 },
    ult: { name: 'Lava Style: Lava Monster Jutsu', type: 'aoe', nature: 'Fire' },
    leader: { stat: 'nature', scope: { tag: 'mist' } },
    tags: ['mist'], unlock: { arcCleared: 'arc_summit' },
    color: '#2563eb', initials: 'MT', emoji: '🫧',
  },
  {
    id: 'minato', name: 'Minato Namikaze', short: 'Minato', tier: 'kage', role: 'Striker', natures: ['Fire'],
    stats: { hp: 1.0, atk: 1.08, def: 1.0, interval: 0.9 },
    ult: { name: 'Flying Raijin Jutsu', type: 'single' },
    leader: { stat: 'speed' },
    tags: ['leaf', 'hokage'], unlock: { arcCleared: 'arc_climax' },
    color: '#fef08a', initials: 'MN', emoji: '🌠',
  },
  {
    id: 'hashirama', name: 'Hashirama Senju', short: 'Hashirama', tier: 'kage', role: 'Tank', natures: ['Earth', 'Water'],
    stats: { hp: 1.15, atk: 1.02, def: 1.1 },
    ult: { name: 'Wood Style: Wood Dragon Jutsu', type: 'taunt', nature: 'Earth' },
    leader: { stat: 'def', scope: { tag: 'leaf' } },
    tags: ['leaf', 'hokage'], unlock: { arcCleared: 'arc_climax' },
    color: '#166534', initials: 'HS', emoji: '🌳',
  },
  {
    id: 'madara', name: 'Madara Uchiha', short: 'Madara', tier: 'kage', role: 'Striker', natures: ['Fire', 'Earth', 'Water'],
    stats: { hp: 1.08, atk: 1.1, def: 1.0 },
    ult: { name: 'Fire Style: Majestic Destroyer Flame', type: 'aoe', nature: 'Fire' },
    leader: { stat: 'atk', scope: { nature: 'Fire' } },
    tags: ['leaf'], unlock: { arcCleared: 'arc_birth' },
    color: '#450a0a', initials: 'MU', emoji: '☄️',
  },
  {
    id: 'obito', name: 'Obito Uchiha', short: 'Obito', tier: 'kage', role: 'Ranged', natures: ['Fire', 'Earth', 'Water'],
    stats: { hp: 1.05, atk: 1.06, def: 1.0 },
    ult: { name: 'Wood Style: Cutting Sprigs Jutsu', type: 'aoe', nature: 'Earth' },
    leader: { stat: 'crit' },
    tags: ['akatsuki', 'leaf'], unlock: { arcCleared: 'arc_birth' },
    color: '#312e81', initials: 'OU', emoji: '🕳️',
  },

  // ======================= PART II ALTERNATE FORMS =========================
  {
    id: 'sakura_hundred', formOf: 'sakura', name: 'Sakura Haruno (Hundred Healings)', short: 'Sakura★', tier: 'jonin', role: 'Support', natures: ['Earth'],
    stats: { hp: 1.1, atk: 1.05, def: 1.05 },
    ult: { name: 'Mitotic Regeneration: The Hundred Healings', type: 'heal' },
    leader: { stat: 'hp', scope: { tag: 'team7' } },
    tags: ['team7', 'leaf', 'medic'], unlock: { arcCleared: 'arc_climax' },
    color: '#ec4899', initials: 'SH', emoji: '💮',
  },
  {
    id: 'gaara_kazekage', formOf: 'gaara', name: 'Gaara (Fifth Kazekage)', short: 'Kazekage', tier: 'kage', role: 'Tank', natures: ['Wind', 'Earth'],
    stats: { hp: 1.1, atk: 1.05, def: 1.15, speed: 0.9 },
    ult: { name: "Ultimate Defence: Shukaku's Shield", type: 'taunt' },
    leader: { stat: 'def', scope: { tag: 'sand' } },
    tags: ['sand'], unlock: { arcCleared: 'arc_kazekage' },
    color: '#9a3412', initials: 'GA', emoji: '🏜️',
  },
  {
    id: 'kakashi_mangekyo', formOf: 'kakashi', name: 'Kakashi Hatake (Mangekyo Sharingan)', short: 'Kakashi★', tier: 'kage', role: 'Striker', natures: ['Lightning', 'Earth', 'Water'],
    stats: { hp: 1.0, atk: 1.08, def: 1.0 },
    ult: { name: 'Kamui', type: 'single', stun: true },
    leader: { stat: 'atk', scope: { tag: 'team7' } },
    tags: ['team7', 'leaf'], unlock: { arcCleared: 'arc_kazekage' },
    color: '#64748b', initials: 'KH', emoji: '🌪️',
  },
  {
    id: 'naruto_sage', formOf: 'naruto', name: 'Naruto Uzumaki (Sage Mode)', short: 'Sage Naruto', tier: 'kage', role: 'Striker', natures: ['Wind'],
    stats: { hp: 1.1, atk: 1.08, def: 1.0 },
    ult: { name: 'Wind Style: Rasen Shuriken', type: 'aoe', nature: 'Wind' },
    leader: { stat: 'chakra', scope: { tag: 'team7' } },
    tags: ['team7', 'leaf'], unlock: { arcCleared: 'arc_pain' },
    color: '#f59e0b', initials: 'NU', emoji: '🐸',
  },
  {
    id: 'sasuke_ems', formOf: 'sasuke', name: 'Sasuke Uchiha (Eternal Mangekyo Sharingan)', short: 'Sasuke★★', tier: 'kage', role: 'Striker', natures: ['Fire', 'Lightning'],
    stats: { hp: 1.0, atk: 1.12, def: 0.98 },
    ult: { name: 'Inferno Style: Flame Control', type: 'aoe', nature: 'Fire' },
    leader: { stat: 'atk', scope: { tag: 'taka' } },
    tags: ['team7', 'taka'], unlock: { arcCleared: 'arc_climax' },
    color: '#1e1b4b', initials: 'SU', emoji: '🦅',
  },
  {
    id: 'guy_eightgates', formOf: 'guy', name: 'Might Guy (Eight Inner Gates)', short: 'Guy★', tier: 'kage', role: 'Striker', natures: [], taijutsu: true,
    canonNatures: ['Fire', 'Lightning'],
    stats: { hp: 1.05, atk: 1.12, def: 0.95, interval: 0.85 },
    ult: { name: 'Night Guy', type: 'single' },
    leader: { stat: 'atk', scope: { tag: 'teamguy' } },
    tags: ['teamguy', 'leaf'], unlock: { arcCleared: 'arc_birth' },
    color: '#22c55e', initials: 'MG', emoji: '🐘',
  },
  {
    id: 'naruto_sixpaths', formOf: 'naruto', name: 'Naruto Uzumaki (Six Paths Sage Mode)', short: 'Naruto★★', tier: 'kage', role: 'Striker', natures: ['Wind', 'Earth', 'Fire', 'Water'],
    stats: { hp: 1.15, atk: 1.1, def: 1.05 },
    ult: { name: 'Sage Art: Super Tailed Beast Rasen-Shuriken', type: 'aoe', nature: 'Wind' },
    leader: { stat: 'atk' },
    tags: ['team7', 'leaf'], unlock: { arcCleared: 'arc_birth' },
    color: '#fdba74', initials: 'NU', emoji: '☀️',
  },

  // ============ ACHIEVEMENT-EXCLUSIVE FORM (never in any banner) ===============
  // The reward for "Believe It!" (complete Part I and Part II; achievements.js).
  // notPullable keeps it out of every summon pool, and validate checks no banner
  // features it. Tuned inside the existing Naruto forms: a Ranged Kage with weights
  // like Pain's or Obito's, so it hits softer than Six Paths Sage Mode (a Striker).
  // Nine-Tails Chakra Mode lets Naruto share chakra, hence the whole-team startChakra
  // Leader buff. Natures: Wind (Wind Style: Rasen Shuriken on screen).
  {
    id: 'naruto_chakramode', formOf: 'naruto', name: 'Naruto Uzumaki (Nine-Tails Chakra Mode)', short: 'Chakra Mode',
    tier: 'kage', role: 'Ranged', natures: ['Wind'],
    stats: { hp: 1.05, atk: 1.06, def: 1.0 },
    ult: { name: 'Planet Rasengan', type: 'aoe', nature: 'Wind' },
    leader: { stat: 'startChakra' },
    tags: ['team7', 'leaf'], unlock: { achievement: 'ach_story' }, notPullable: true,
    color: '#facc15', initials: 'NU', emoji: '🌟',
  },
];

export default ROSTER;
