// roster.js — every PULLABLE character (and alternate forms).
// Pure data. See CONTENT_GUIDE.md for the schema and a copy-paste template.
//
// Field reference (short):
//   id          unique, lowercase_snake
//   name        English DUB name (see NAMING.md)
//   tier        'genin' | 'chunin' | 'jonin' | 'kage'   (gacha rarity: Common/Rare/Epic/Legendary)
//   role        'Tank' | 'Striker' | 'Ranged' | 'Support'
//   natures     subset of Fire/Wind/Lightning/Earth/Water ([] = neutral). First = defensive nature.
//               Rule (NAMING.md): natures used on-screen in Part 1; if none, the first nature
//               Narutopedia lists; kekkei genkai -> component natures; taijutsu specialists -> [].
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

export const TAGS = {
  team7: 'Team 7', team8: 'Team 8', team10: 'Team 10', teamguy: 'Team Guy',
  sand: 'Sand Siblings', sound: 'Sound ninja', sannin: 'the Legendary Sannin', mist: 'Mist ninja',
  hokage: 'Hokage', leaf: 'Hidden Leaf ninja', medic: 'medical ninja',
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
];

export default ROSTER;
