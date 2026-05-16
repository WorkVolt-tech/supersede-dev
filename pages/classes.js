// classes.js — Hidden Class System (choice-based architecture)
// ─────────────────────────────────────────────────────────────────────────
// When the player defeats the Twin Judges, the boss-state formKey decides
// which set of class CHOICES is presented. The player picks ONE. The choice
// is final — once active_class is set on the player record, no further class
// choices are offered, even on replay.
//
// The hidden gate (must apply regardless of which formKey/class is offered):
//   - hasUsedAnyElement(player) === false
// "Element use" means actual SP investment in skill_levels under one of the
// element prefixes. Defeating zone bosses or unlocking elemental nodes in
// the skills tree without spending SP does NOT count.
//
// Player storage (already in the migration):
//   active_class           text     — the chosen class key (e.g. 'arbiter')
//   class_nodes_unlocked   text[]   — "classKey:nodeId" entries
//   classes_unlocked       text[]   — historical list (one entry == active)
// ─────────────────────────────────────────────────────────────────────────

// ── Element prefix list — used by the purity check.
export const ELEMENT_PREFIXES = [
  'ignis_', 'aqua_', 'volt_', 'arcane_',
  'umbra_', 'terra_', 'aero_',
  'flora_', 'ferro_', 'venin_',
]

// True if the player has put any SP into the elemental skill tree.
// Reads skill_levels (the {nodeId: level} map) — any element-prefixed key
// with level > 0 counts as "touched an element." This is the only gate
// for class eligibility; defeating zone bosses without spending SP is fine.
export function hasUsedAnyElement(player) {
  const levels = player.skill_levels || {}
  for (const key in levels) {
    if ((levels[key] || 0) <= 0) continue
    for (const prefix of ELEMENT_PREFIXES) {
      if (key.startsWith(prefix)) return true
    }
  }
  return false
}

// ─────────────────────────────────────────────────────────────────────────
// CLASS DEFINITIONS
//
// Each class entry is compact: name, judgeOf (lore axis), color, tagline,
// narrativeLine (system overlay text), and a `skills` array of 6 [name, sub]
// tuples lifted from the spec. The 7-node tree (start + 6 skills, linear
// path) is generated at module-load time by makeClassNodes() so each entry
// stays readable. To customize a tree's shape later, replace the entry's
// `nodes` with an explicit array — the renderer doesn't care how it was
// produced.
//
// Level gates are uniform: 1, 5, 8, 12, 16, 20, 25. Spread far enough that
// not all 6 skills are accessible at chapter-2 cap; later chapters
// (with higher level caps) reach the ultimates.
// ─────────────────────────────────────────────────────────────────────────

const NODE_LAYOUT_Y = [1000, 850, 700, 550, 400, 250, 100]
const NODE_LEVELS   = [   1,   5,   8,  12,  16,  20,  25]

function makeClassNodes(classKey, color, name, skills) {
  const nodes = [{
    id: classKey + '_start',
    label: name,
    sub: 'Recognized',
    x: 1000, y: NODE_LAYOUT_Y[0],
    levelRequired: NODE_LEVELS[0],
    requires: [],
    type: 'start',
    color,
  }]
  for (let i = 0; i < 6; i++) {
    const [label, sub] = skills[i] || ['', '']
    const prev = i === 0 ? classKey + '_start' : `${classKey}_s${i}`
    nodes.push({
      id: `${classKey}_s${i + 1}`,
      label, sub,
      x: 1000, y: NODE_LAYOUT_Y[i + 1],
      levelRequired: NODE_LEVELS[i + 1],
      requires: [prev],
      type: (i === 0 || i === 5) ? 'active' : 'passive',
      color,
    })
  }
  return nodes
}

// Raw class data — fed into the CLASSES export below.
const CLASS_DATA = [
  // ═══ VERDICT EXCLUSIVES (godlike — only obtainable from `verdict`) ═══
  {
    key: 'eclipse_walker', name: 'Eclipse Walker', judgeOf: 'Final Judge',
    color: '#9b6dff', tagline: 'One who walks between Wrath and Mercy.',
    narrative: 'ANOMALY DETECTED — both Judges paused. The eclipse held. CLASS REGISTERED: ECLIPSE WALKER.',
    skills: [
      ['Solar Stance',    'Increased healing and defense'],
      ['Lunar Stance',    'Increased speed and damage'],
      ['Twilight Shift',  'Instantly switch stances mid-combo'],
      ['Balance Breaker', 'Bonus damage when swapping stances'],
      ['Dual Horizon',    'Gain buffs from both stances briefly'],
      ['Totality',        'Merge both forms into an ultimate state'],
    ],
  },
  {
    key: 'nullborn', name: 'Nullborn', judgeOf: 'Final Judge',
    color: '#5e5e5e', tagline: 'The System failed to assign an elemental affinity.',
    narrative: 'ANOMALY DETECTED — element registration failed. The slot is empty. CLASS REGISTERED: NULLBORN.',
    skills: [
      ['System Rejection',  'Reduce incoming elemental damage'],
      ['Silence Field',     'Disable enemy elemental effects briefly'],
      ['Null Pulse',        'Remove buffs from nearby enemies'],
      ['Affinity Collapse', 'Convert elemental damage into raw damage'],
      ['Dead Zone',         'Create an anti-element area'],
      ['Unclassified',      'Become immune to elemental debuffs'],
    ],
  },
  {
    key: 'error', name: 'Error', judgeOf: 'Final Judge',
    color: '#ff3a5e', tagline: 'A broken classification inside the System.',
    narrative: 'ANOMALY DETECTED — record corrupted. The error persists. CLASS REGISTERED: ERROR.',
    skills: [
      ['Data Corruption',    'Randomize enemy buffs'],
      ['Glitch Step',        'Teleport unpredictably'],
      ['Broken Logic',       'Random stat spikes'],
      ['Memory Leak',        'Enemy abilities malfunction'],
      ['Fractured Reality',  'Duplicate attacks randomly'],
      ['Critical Exception', 'Massive chaotic burst attack'],
    ],
  },

  // ═══ DOUBLED CLASSES (appear under two bosses each) ═══
  {
    key: 'arbiter', name: 'Arbiter', judgeOf: 'Judge of Truth',
    color: '#d4af37', tagline: 'A human acknowledged by the System as equal to the Judges.',
    narrative: 'ANOMALY DETECTED — a path you did not choose has chosen you. CLASS REGISTERED: ARBITER.',
    skills: [
      ['Verdict',         'Execute low-health enemies'],
      ['Equal Measure',   'Defense scales with HP balance'],
      ['Judgment Chain',  'Consecutive hits increase execution chance'],
      ['Sentence Delay',  'Mark enemies for delayed burst damage'],
      ['Law of Balance',  'Reflect excess damage back to attackers'],
      ['Final Decree',    'Temporarily disable enemy passives'],
    ],
  },
  {
    key: 'monarch', name: 'Monarch', judgeOf: 'Judge of Mercy',
    color: '#e8c34a', tagline: 'A ruler recognized by survivors and the System.',
    narrative: 'ANOMALY DETECTED — the survivors acknowledge a throne. CLASS REGISTERED: MONARCH.',
    skills: [
      ['Command Aura',      'Buff nearby allies'],
      ['Royal Decree',      'Increase ally attack speed'],
      ['Protect the Throne','Redirect damage from allies'],
      ['Dominion',          'Expand aura effects over time'],
      ['Summon Retainers',  'Call elite followers'],
      ["King's Presence",   'Enemies deal less damage nearby'],
    ],
  },
  {
    key: 'wrathborn', name: 'Wrathborn', judgeOf: 'Judge of Wrath',
    color: '#c0392b', tagline: 'Rage evolved into power.',
    narrative: 'ANOMALY DETECTED — the rage stabilized into form. CLASS REGISTERED: WRATHBORN.',
    skills: [
      ['Rage Engine',        'Damage increases as HP lowers'],
      ['Bloodrush',          'Gain attack speed after taking damage'],
      ['Fury Slam',          'Heavy AoE attack'],
      ['Unbreakable Anger',  'Resist stagger effects'],
      ['Violence Cycle',     'Kills refresh cooldowns'],
      ['Cataclysm',          'Massive berserker eruption'],
    ],
  },
  {
    key: 'chimera', name: 'Chimera', judgeOf: 'Judge of Hunger',
    color: '#8b4a8c', tagline: 'A body constantly mutating from battle.',
    narrative: 'ANOMALY DETECTED — phenotype unstable, but holding. CLASS REGISTERED: CHIMERA.',
    skills: [
      ['Predator Leap',  'Fast beast-like pounce'],
      ['Adaptive Claws', 'Attacks change based on enemy type'],
      ['Mutation Surge', 'Temporary random mutation'],
      ['Alpha Instinct', 'Increased damage while isolated'],
      ['Devour Essence', 'Gain temporary buffs after kills'],
      ['Apex Form',      'Massive transformation state'],
    ],
  },
  {
    key: 'unwritten', name: 'Unwritten', judgeOf: 'Judge of Silence',
    color: '#404a5a', tagline: 'Removed from System records.',
    narrative: 'ANOMALY DETECTED — record absent, presence persists. CLASS REGISTERED: UNWRITTEN.',
    skills: [
      ['Unknown Presence', 'Harder for enemies to detect'],
      ['Blind Spot',       'Increased backstab damage'],
      ['Erased Footsteps', 'Movement makes no sound'],
      ['System Static',    'Enemy targeting becomes unstable'],
      ['Identity Loss',    'Remove aggro temporarily'],
      ['Missing Record',   'Become untargetable briefly'],
    ],
  },
  {
    key: 'oathbreaker', name: 'Oathbreaker', judgeOf: 'Judge of Truth',
    color: '#7a6938', tagline: 'One who refused every path offered.',
    narrative: 'ANOMALY DETECTED — every alliance offered was refused. CLASS REGISTERED: OATHBREAKER.',
    skills: [
      ['Severance',     'Remove buffs from everyone nearby'],
      ['Lone Survivor', 'Increased stats while solo'],
      ['Broken Pact',   'Reflect debuffs back to enemies'],
      ['Unbound Strike','Bonus damage against grouped enemies'],
      ['Pathless Will', 'Resist control effects'],
      ['Last Refusal',  'Become temporarily unstoppable'],
    ],
  },

  // ═══ SINGLES (appear under one boss each) ═══
  {
    key: 'prime', name: 'Prime', judgeOf: 'Judge of Truth',
    color: '#e0a040', tagline: 'Humanity before elemental evolution.',
    narrative: 'ANOMALY DETECTED — pre-evolution baseline holds. CLASS REGISTERED: PRIME.',
    skills: [
      ['Adaptive Skin',    'Gain resistance to recent damage type'],
      ['Perfect Motion',   'Dodge timing becomes more forgiving'],
      ['Combat Evolution', 'Stats increase during long battles'],
      ['Instinct Trigger', 'Automatically counter fatal attacks'],
      ['Predicted Strike', 'Increased damage after enemy repeats attacks'],
      ['Origin State',     'Temporarily maximize all core stats'],
    ],
  },
  {
    key: 'bastion', name: 'Bastion', judgeOf: 'Judge of Mercy',
    color: '#5e8aa0', tagline: 'An immovable shield over those who chose to stay.',
    narrative: 'ANOMALY DETECTED — the line held. CLASS REGISTERED: BASTION.',
    skills: [
      ['Aegis Form',       'Convert offense into defense temporarily'],
      ['Shielded Path',    "Allies behind you take reduced damage"],
      ["Protector's Vow",  'Heal slightly each turn while at full HP'],
      ['Bulwark Wall',     'Plant a barrier that absorbs attacks'],
      ['Reflective Guard', 'Block + counter as one action'],
      ['Final Sanctuary',  'Become invulnerable but rooted for 3 turns'],
    ],
  },
  {
    key: 'dawnbringer', name: 'Dawnbringer', judgeOf: 'Judge of Mercy',
    color: '#f4d96a', tagline: 'The first light after a long siege.',
    narrative: 'ANOMALY DETECTED — light recognized. CLASS REGISTERED: DAWNBRINGER.',
    skills: [
      ['Dawn Light',     'Heal allies in a small area'],
      ['Healing Wave',   'Single-target heal scaling with insight'],
      ["Sun's Promise",  'Revive once per chapter at low HP'],
      ['Radiant Strike', 'Light-based attack, bonus vs corrupted'],
      ['Rising Sun',     'Battlefield-wide buff at chapter start'],
      ['First Light',    'Massive area heal + cleanse'],
    ],
  },
  {
    key: 'ravager', name: 'Ravager', judgeOf: 'Judge of Wrath',
    color: '#a02822', tagline: 'A killer who never paused to consider mercy.',
    narrative: 'ANOMALY DETECTED — kill count tolerable. CLASS REGISTERED: RAVAGER.',
    skills: [
      ['Savage Hit',      'Critical hits deal +50% damage'],
      ['Tearing Strike',  'Apply bleed on hit'],
      ["Predator's Eye",  'Damage scales with target HP missing'],
      ['Bone Crush',      'Reduce target defense permanently'],
      ['Wild Frenzy',     'Attack speed scales with consecutive kills'],
      ['Final Massacre',  'AoE strike that bleeds every enemy'],
    ],
  },
  {
    key: 'dreadnought', name: 'Dreadnought', judgeOf: 'Judge of Wrath',
    color: '#6e7a8c', tagline: 'An unstoppable wall of force.',
    narrative: 'ANOMALY DETECTED — kinetic threshold exceeded. CLASS REGISTERED: DREADNOUGHT.',
    skills: [
      ['Iron Advance',    'Move through attacks uninterrupted'],
      ['Fortress Skin',   'Massive defense boost'],
      ['Titan Crash',     'Ground slam shockwave'],
      ['Immovable',       'Cannot be displaced'],
      ['Heavy Momentum',  'Damage increases while standing ground'],
      ['Siegebreaker',    'Ultimate crushing attack'],
    ],
  },
  {
    key: 'ghostblade', name: 'Ghostblade', judgeOf: 'Judge of Silence',
    color: '#3a8a8c', tagline: 'A killer that exists between moments.',
    narrative: 'ANOMALY DETECTED — temporal signature flickers. CLASS REGISTERED: GHOSTBLADE.',
    skills: [
      ['Phase Dash',       'Blink through enemies'],
      ['Afterimage',       'Leave a damaging illusion behind'],
      ['Silent Cut',       'Critical hit from stealth'],
      ['Ghost Step',       'Temporarily avoid collision and attacks'],
      ['Execution Thread', 'Bonus damage to marked enemies'],
      ['Void Flurry',      'Extreme-speed multi-hit attack'],
    ],
  },
  {
    key: 'silent_judge', name: 'Silent Judge', judgeOf: 'Judge of Silence',
    color: '#604a78', tagline: 'The hidden execution arm of the System.',
    narrative: 'ANOMALY DETECTED — the System has its hand. CLASS REGISTERED: SILENT JUDGE.',
    skills: [
      ['Silent Verdict',   'Mark enemy for execution'],
      ['Observation',      'Reveal enemy weaknesses'],
      ['Unseen Sentence',  'Bonus damage while undetected'],
      ['Judicial Step',    'Teleport behind marked targets'],
      ['Absolute Focus',   'Time slows during executions'],
      ['Final Witness',    'Instantly kill critically weakened enemies'],
    ],
  },
  {
    key: 'devourer', name: 'Devourer', judgeOf: 'Judge of Hunger',
    color: '#7a4848', tagline: 'A hunger that takes more than it needs.',
    narrative: 'ANOMALY DETECTED — intake exceeds output. CLASS REGISTERED: DEVOURER.',
    skills: [
      ['Famine Touch',    'Drain HP on hit'],
      ['Drain Strike',    'Steal a small buff from the target'],
      ['Empty Stomach',   'Damage scales with HP missing'],
      ['Devouring Pull',  'Pull enemy toward you, dealing damage'],
      ['Insatiable',      'Each kill restores HP and stamina'],
      ['Apex Feast',      'Consume an enemy entirely, regaining max HP'],
    ],
  },
  {
    key: 'mourning_king', name: 'Mourning King', judgeOf: 'Judge of Hunger',
    color: '#4a4a5e', tagline: 'The dead follow your grief.',
    narrative: 'ANOMALY DETECTED — the dead recognize their procession. CLASS REGISTERED: MOURNING KING.',
    skills: [
      ['Grave Call',        'Raise fallen enemies temporarily'],
      ['Soul Lantern',      'Summons a spirit companion'],
      ['Funeral Mist',      'Area decay damage'],
      ["King's Procession", 'Summons multiple undead'],
      ['Death Tax',         'Restore HP when enemies die nearby'],
      ['Black Funeral',     'Massive battlefield-wide summon'],
    ],
  },
  {
    key: 'vessel', name: 'Vessel', judgeOf: 'Judge of Despair',
    color: '#5e3a78', tagline: 'Something ancient lives inside you.',
    narrative: 'ANOMALY DETECTED — second signature inside the body. CLASS REGISTERED: VESSEL.',
    skills: [
      ['Whispers Below',   'Gain power while corrupted'],
      ['Possession Surge', 'Temporary stat explosion'],
      ['Corrupted Flesh',  'Regenerate during combat'],
      ['Shared Pain',      'Damage spreads to nearby enemies'],
      ['Awakened Hunger',  'Transformation begins at low HP'],
      ['True Vessel',      'Fully unleash inner entity'],
    ],
  },
  {
    key: 'hollow', name: 'Hollow', judgeOf: 'Judge of Despair',
    color: '#3a3a4a', tagline: 'What remains when grief has finished.',
    narrative: 'ANOMALY DETECTED — interior signal lost. CLASS REGISTERED: HOLLOW.',
    skills: [
      ['Empty Vessel',     'Take less damage from emotional/aura effects'],
      ['Quiet Breath',     'Regenerate stamina while standing still'],
      ['Hollow Step',      'Move at full speed while silenced'],
      ['Silent Endurance', 'Resist debuffs while below 25% HP'],
      ['Numb Strike',      'Ignore enemy defense once per fight'],
      ['Final Emptiness',  'Become unkillable for 3 turns, then sleep'],
    ],
  },
  {
    key: 'abyss_walker', name: 'Abyss Walker', judgeOf: 'Judge of Despair',
    color: '#1c2840', tagline: 'A path downward, walked anyway.',
    narrative: 'ANOMALY DETECTED — descent pattern stable. CLASS REGISTERED: ABYSS WALKER.',
    skills: [
      ['Abyss Step',     'Move through walls of darkness'],
      ['Void Sight',     'See marked enemies through obstacles'],
      ['Sunken Lance',   'Pierce attack ignores armor'],
      ['Drowning Mist',  'Area silence + slow'],
      ['Tidal Crush',    'Crushing wave attack'],
      ['Abyssal Maw',    'Pull all enemies into a point and devour'],
    ],
  },
]

// Build the CLASSES export by attaching generated nodes to each definition.
export const CLASSES = {}
for (const c of CLASS_DATA) {
  CLASSES[c.key] = {
    key: c.key,
    name: c.name,
    judgeOf: c.judgeOf,
    color: c.color,
    tagline: c.tagline,
    unlockNarrative: c.narrative,
    skills: c.skills,
    nodes: makeClassNodes(c.key, c.color, c.name, c.skills),
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CLASS CHOICES — formKey → array of class keys offered at the post-Judges
// pick screen.
//
// Rules from design discussion:
//   • verdict has 3 GODLIKE classes that appear nowhere else.
//   • Each of the other 6 bosses has 4 class choices.
//   • Across the 6 non-verdict bosses (24 slots, 18 classes), 6 classes
//     appear twice (always on thematically-adjacent axes) and 12 appear once.
//   • No class appears three or more times.
// ─────────────────────────────────────────────────────────────────────────
export const CLASS_CHOICES = {
  verdict:        ['eclipse_walker', 'nullborn', 'error'],
  dual_powered:   ['prime', 'arbiter', 'oathbreaker', 'unwritten'],
  mercy_powered:  ['monarch', 'bastion', 'dawnbringer', 'arbiter'],
  wrath_powered:  ['wrathborn', 'dreadnought', 'ravager', 'chimera'],
  dual:           ['ghostblade', 'unwritten', 'silent_judge', 'oathbreaker'],
  mercy:          ['chimera', 'devourer', 'mourning_king', 'monarch'],
  wrath:          ['vessel', 'hollow', 'abyss_walker', 'wrathborn'],
}

// ── HELPERS ──────────────────────────────────────────────────────────────

export function getClassChoicesForFormKey(formKey) {
  return CLASS_CHOICES[formKey] || []
}

export function hasPickedClass(player) {
  return !!(player.active_class)
}

export function isClassEligible(player) {
  return !hasUsedAnyElement(player)
}

export function getActiveClass(player) {
  if (!player.active_class) return null
  return CLASSES[player.active_class] || null
}

export function shouldShowClassTab(player) {
  return hasPickedClass(player)
}

export function getRevealedClasses(player) {
  const c = getActiveClass(player)
  return c ? [c] : []
}

export function isClassNodeUnlocked(player, classKey, nodeId) {
  const tag = classKey + ':' + nodeId
  return (player.class_nodes_unlocked || []).includes(tag)
}

export function isClassNodeAvailable(player, classKey, nodeId) {
  const cls = CLASSES[classKey]
  if (!cls) return false
  const node = cls.nodes.find(n => n.id === nodeId)
  if (!node) return false
  if (isClassNodeUnlocked(player, classKey, nodeId)) return false
  if ((player.level || 1) < (node.levelRequired || 1)) return false
  if (!node.requires || node.requires.length === 0) return true
  return node.requires.some(req => isClassNodeUnlocked(player, classKey, req))
}

export function unlockClassNode(player, classKey, nodeId) {
  const tag = classKey + ':' + nodeId
  const existing = player.class_nodes_unlocked || []
  if (existing.includes(tag)) return { class_nodes_unlocked: existing }
  return { class_nodes_unlocked: [...existing, tag] }
}

// Pure: returns column updates to commit a class pick. Caller MUST verify
// hasPickedClass(player) === false AND isClassEligible(player) === true.
export function pickClass(player, classKey) {
  if (!CLASSES[classKey]) throw new Error('Unknown class key: ' + classKey)
  const startNodeTag = classKey + ':' + classKey + '_start'
  const nodes = [...new Set([...(player.class_nodes_unlocked || []), startNodeTag])]
  const list  = [...new Set([...(player.classes_unlocked     || []), classKey])]
  return {
    active_class:         classKey,
    classes_unlocked:     list,
    class_nodes_unlocked: nodes,
  }
}
