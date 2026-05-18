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

// ─────────────────────────────────────────────────────────────────────────
// TREE LAYOUT — 6 tiers × 3 branches grid
//
// Each tier opens at a specific player level. At each tier the player picks
// ONE of three skills (a/b/c). The pick is final — picking 1a permanently
// locks out 1b and 1c. The branches form vertical "paths" with intra-branch
// synergy (1a + 2a + 3a + 4a + 5a + 6a tells one story; 1b + 2b... tells
// another). Players can technically mix branches if they want, but each
// branch is designed to read as a coherent build on its own.
// ─────────────────────────────────────────────────────────────────────────

// Levels where each tier opens. Six tiers gated 15 / 20 / 25 / 30 / 35 / 40.
const TIER_LEVELS = [15, 20, 25, 30, 35, 40]
// X positions for the 6 columns and Y positions for the 3 rows (a/b/c).
// 2000×2000 canvas, centered horizontally with even spacing.
const TIER_X = [400, 660, 920, 1180, 1440, 1700]
const ROW_Y  = { a: 700, b: 1000, c: 1300 }

// Build the 18-node tree from a 6-tier × 3-branch tiers[] array.
// Each tier entry: { a: [label, sub], b: [label, sub], c: [label, sub] }
// Returns: 18 nodes, each with id = `${classKey}_t${tierNum}${branch}`,
// connected within their branch (1a → 2a → 3a → etc) AND from start node.
function makeClassNodes(classKey, color, name, tiers) {
  const nodes = [{
    id: classKey + '_start',
    label: name,
    sub: 'Recognized',
    // Start sits left of all tiers, vertically centered.
    x: 180, y: 1000,
    levelRequired: 1,
    requires: [],
    type: 'start',
    color,
  }]
  const BRANCHES = ['a', 'b', 'c']
  for (let t = 0; t < 6; t++) {
    const tier = tiers[t] || {}
    for (const br of BRANCHES) {
      const skill = tier[br] || ['', '']
      const [label, sub] = skill
      // Tier 1 nodes require the start node; later tiers require the same
      // branch in the previous tier (so 2a requires 1a, 3a requires 2a, etc).
      // This means you can technically pick 1a then 2b — branches aren't
      // hard-walled. The "final pick" rule is enforced at unlock time
      // (you can only unlock ONE node per tier), but the prereq is just
      // "any node in the previous tier" so you can mix.
      const prevTierRequires = t === 0
        ? [classKey + '_start']
        : BRANCHES.map(prevBr => `${classKey}_t${t}${prevBr}`)
      nodes.push({
        id: `${classKey}_t${t + 1}${br}`,
        label, sub,
        x: TIER_X[t], y: ROW_Y[br],
        levelRequired: TIER_LEVELS[t],
        requires: prevTierRequires,
        type: t === 5 ? 'active' : (t === 0 ? 'active' : 'passive'),
        color,
        tier: t + 1,
        branch: br,
      })
    }
  }
  return nodes
}

// Raw class data — fed into the CLASSES export below.
const CLASS_DATA = [
  // ═══ VERDICT EXCLUSIVES (godlike — only obtainable from `verdict`) ═══
  {
    key: 'eclipse_walker', name: 'Eclipse Walker', judgeOf: 'Final Judge of Humanity',
    color: '#9b6dff', tagline: 'One who walks between Wrath and Mercy.',
    narrative: 'ANOMALY DETECTED — both Judges paused. The eclipse held. CLASS REGISTERED: ECLIPSE WALKER.',
    // Three branches:
    //   a — Solar Path: lock-in defense/regen, survive the long fight
    //   b — Twilight Path: stance-dancer, swap every turn for compound bonuses
    //   c — Lunar Path: lock-in speed/crit glass cannon
    // Stance system: when 1a or 1c is unlocked, a stance toggle appears in the
    // class skill row. Stance toggling is a free action (doesn't consume turn).
    tiers: [
      { // Tier 1 — level 15
        a: ['Solar Stance',   'Toggle: +20% DEF, regen 3% HP/turn while active'],
        b: ['Stance Step',    'Stance switches grant +5% damage on your next attack'],
        c: ['Lunar Stance',   'Toggle: +15% SPD, +15% ATK while active'],
      },
      { // Tier 2 — level 20
        a: ['Daylight',       'Solar regen increased to 5% HP/turn'],
        b: ['Twilight Shift', 'Active: switch stance + free strike with new stance bonuses'],
        c: ['Moonchaser',     '+10% crit chance while in Lunar Stance'],
      },
      { // Tier 3 — level 25
        a: ["Sun's Mercy",    'Solar Stance: first hit per turn is halved'],
        b: ['Eclipse Window', '1 turn after switching, both stance bonuses apply'],
        c: ['Night Hunter',   'Lunar kills grant +10% damage stacking for rest of combat'],
      },
      { // Tier 4 — level 30
        a: ['Burning Ground', 'Solar Stance: enemies attacking you take 5 reflect damage'],
        b: ['Balance Breaker','Each stance switch deals damage = 10% of your max HP to the enemy'],
        c: ['Lunar Reach',    'Lunar Stance: strike first regardless of SPD'],
      },
      { // Tier 5 — level 35
        a: ['Solar Crown',    'Solar regen also restores 2 SP per turn'],
        b: ['Eclipse Echo',   'Every 3rd stance switch is free (no turn cost)'],
        c: ['Lunar Court',    'Lunar Stance crits deal +50% damage instead of +50%'],
      },
      { // Tier 6 — level 40
        a: ['Totality',       'Active: 5-turn Eclipse mode — both stances + 50% all stats'],
        b: ['Dual Horizon',   'Active: 3 turns where every action triggers BOTH stances'],
        c: ['Final Eclipse',  'Active: switch stance, deal damage = stance switches × 30'],
      },
    ],
  },
  {
    key: 'nullborn', name: 'Nullborn', judgeOf: 'Final Judge of Humanity',
    color: '#5e5e5e', tagline: 'The System failed to assign an elemental affinity.',
    narrative: 'ANOMALY DETECTED — element registration failed. The slot is empty. CLASS REGISTERED: NULLBORN.',
    // Verdict-exclusive godlike class. Breaks the "scale one stat" rule —
    // Nullborn manipulates Null stacks which absorb attacks AND build burst
    // damage. Late-game can become functionally immune.
    // Three branches:
    //   a — Path of the Void: Null-stack engine, build-spend cycle
    //   b — Path of the Unwritten: anti-enemy denial (cancel crit/status/death)
    //   c — Path of Erasure: strip enemy buffs/passives, anti-boss specialist
    tiers: [
      { // Tier 1 — level 15
        a: ['Null Form',      'Start combat with 3 Null stacks. Each Null absorbs one full attack.'],
        b: ['Empty Record',   'Enemy crits against you deal normal damage (crit bonus nullified).'],
        c: ['Static',         '10% chance per basic strike: delete a random enemy buff/passive.'],
      },
      { // Tier 2 — level 20
        a: ['Null Charge',    'Taking damage adds 1 Null stack (max 10).'],
        b: ['Misread',        '25% chance each enemy turn: they skip their action.'],
        c: ['Erase Mark',     'Active: erase one enemy status, deal damage equal to its turn count.'],
      },
      { // Tier 3 — level 25
        a: ['Vacuum Strike',  'At 5+ Null: next strike consumes 1 Null and deals (absorbed damage so far) bonus.'],
        b: ['No Witness',     'Enemies cannot apply status effects on you (burn/bleed/mark/silence/stun).'],
        c: ['Static Mark',    'Static (1c) procs also permanently reduce enemy ATK by 2.'],
      },
      { // Tier 4 — level 30
        a: ['Mass Null',      'Null cap raised to 20; +2 Null per turn passively.'],
        b: ['Cancel',         'When HP would drop below 0: survive at 1 HP, consume all Null × 5 as heal.'],
        c: ['Erasure Cascade','When Static (1c) procs, it also clears one of your negative status effects.'],
      },
      { // Tier 5 — level 35
        a: ['Singularity',    'Active: collapse all Null. Damage = Null × 30, ignores all DEF.'],
        b: ['Voided Record',  'Below 50% HP: incoming damage halved, your basic strikes +30%.'],
        c: ['Final Erasure',  'Active: erase all enemy buffs/passives + their cumulative ATK as one-time damage.'],
      },
      { // Tier 6 — level 40
        a: ['Null God',       'At 15+ Null: immune to damage. Enemy attacks add 2 Null instead. Strikes +Null × 5.'],
        b: ['Read Error',     'Active: 5 turns untargetable. You may still attack.'],
        c: ['Verdict Voided', 'On death: emit Null pulse (max HP × 0.5 damage). Survive at 1 HP.'],
      },
    ],
  },
  {
    key: 'error', name: 'Error', judgeOf: 'Final Judge of Humanity',
    color: '#ff3a5e', tagline: 'A broken classification inside the System.',
    narrative: 'ANOMALY DETECTED — record corrupted. The error persists. CLASS REGISTERED: ERROR.',
    // Verdict-exclusive godlike class. Breaks the "predictable damage" rule —
    // Error has high variance via the Glitch mechanic: each turn a random
    // stat triples while another drops to 1/3. Players control the chaos
    // through skill choices.
    // Three branches:
    //   a — Path of the Bug: tame the chaos, control which stats glitch
    //   b — Path of Corruption: leverage chaos, SP↔HP swaps, double-strikes
    //   c — Path of Crash: embrace chaos, suicide-king burst, all-or-nothing
    tiers: [
      { // Tier 1 — level 15
        a: ['Glitch',           'Each turn: 1 stat × 3, 1 stat × 1/3 (ATK/DEF/SPD pool).'],
        b: ['Memory Leak',      'Taking damage gains 5 SP and loses 5 HP.'],
        c: ['Stack Overflow',   'Kills double your next basic strike damage.'],
      },
      { // Tier 2 — level 20
        a: ['Caught Exception', 'Active (once/combat): force a re-roll of Glitch.'],
        b: ['Heap Spray',       'Each strike: 10% chance to deal 50 damage randomly to enemy OR self.'],
        c: ['Buffer',           'Active: store next strike. Release later for 2× damage.'],
      },
      { // Tier 3 — level 25
        a: ['Stable Variant',   'Glitch now affects only one stat per turn (other stays normal).'],
        b: ['Recursion',        'Every 4th strike auto-procs a second hit at 60% damage.'],
        c: ['Try/Catch',        'Active: 3 turns where incoming damage reflects to attacker.'],
      },
      { // Tier 4 — level 30
        a: ['Hot Patch',        'Below 30% HP: Glitch only buffs (no 1/3 drops).'],
        b: ['Format String',    'Memory Leak now also restores 10 HP per 5 SP gained (net heal).'],
        c: ['Kernel Panic',     'Active: enemy takes damage = your current HP. You drop to 1 HP.'],
      },
      { // Tier 5 — level 35
        a: ['Refactor',         'You pick which stat gets × 3 each turn (random downgrade unchanged).'],
        b: ['Bit Flip',         'Active (once/combat): swap your HP and enemy HP.'],
        c: ['Segfault',         'Active: next 3 basic strikes are guaranteed crits +50% bonus.'],
      },
      { // Tier 6 — level 40
        a: ['Compile-Time Error','Active: 3 turns of all stats × 3 (no downgrades).'],
        b: ['Garbage Collection','Active: clear all status effects, heal 50% max HP, lose 10 SP.'],
        c: ['Fatal Exception',   'Active: instant kill if enemy < 50% HP. Else you die.'],
      },
    ],
  },

  // ═══ DOUBLED CLASSES (appear under two bosses each) ═══
  {
    key: 'arbiter', name: 'Arbiter', judgeOf: 'Judges of Authority',
    color: '#d4af37', tagline: 'A human acknowledged by the System as equal to the Judges.',
    narrative: 'ANOMALY DETECTED — a path you did not choose has chosen you. CLASS REGISTERED: ARBITER.',
    // Three vertical paths:
    //   a — Path of Execution: glass-cannon assassin, kills weak enemies
    //   b — Path of Balance:   defensive sustain, punishes unbalance
    //   c — Path of Judgment:  Mark-and-snowball setup play
    tiers: [
      { // Tier 1 — level 15
        a: ['Verdict',        '25% chance to instant-kill enemies below 15% HP'],
        b: ['Equal Measure',  '+30% DEF when your HP% is within 15% of the enemy\'s'],
        c: ['Sentence Mark',  'First hit on an enemy applies "Marked" for 3 turns'],
      },
      { // Tier 2 — level 20
        a: ['Judgment Chain', 'Each consecutive hit on the same target +5% crit (caps at +30%)'],
        b: ['Scales of Truth','Taking damage above 25% max HP grants +25% damage on your next strike'],
        c: ['Delayed Verdict','Marked enemies take 50% of damage dealt to them again at end of turn'],
      },
      { // Tier 3 — level 25
        a: ['Final Sentence', 'Kills below 25% HP refund a battle action this turn'],
        b: ['Restitution',    'When you heal, also heal the lowest-HP ally for 50% of that amount'],
        c: ['Crime Tally',    'Each hit on a Marked enemy adds +5% damage to your next hit on them'],
      },
      { // Tier 4 — level 30
        a: ['Executioner\'s Eye', 'Crit hits ignore 50% of enemy defense'],
        b: ['Iron Verdict',       'DEF buffs last +2 turns longer'],
        c: ['Sentence Cascade',   'Killing a Marked enemy spreads the Mark to the nearest enemy'],
      },
      { // Tier 5 — level 35
        a: ['Law of Balance', 'Damage above 50% of your max HP reflects back to the attacker'],
        b: ['Equal Sky',      'Gain 5 SP at the start of each combat instead of 0'],
        c: ['Witness Stand',  'When an enemy attacks you, gain a Witness stack (max 5); each is +4% damage'],
      },
      { // Tier 6 — level 40
        a: ['Final Decree',    '3-turn silence on enemy ability use; cannot be resisted'],
        b: ['Pillar of Mercy', 'Once per battle, when an ally would die they survive at 1 HP with full action'],
        c: ['Last Witness',    'Instantly kill any enemy below 40% HP if you have 5 Witness stacks (consumes them)'],
      },
    ],
  },
  {
    key: 'monarch', name: 'Monarch', judgeOf: 'Judge of Purity',
    color: '#e8c34a', tagline: 'A ruler recognized by survivors and the System.',
    narrative: 'ANOMALY DETECTED — the survivors acknowledge a throne. CLASS REGISTERED: MONARCH.',
    // Three branches:
    //   a — Path of Sovereignty: self-empowerment, "I am the throne" solo build
    //   b — Path of the Court: patient defender, stack favor while defending
    //   c — Path of Dominion: battlefield control, stack enemy debuffs
    // Branch B is solo-viable (no longer ally-dependent); ally bonuses appear
    // as "(and any ally, if present)" — bonus rather than requirement.
    tiers: [
      { // Tier 1 — level 15
        a: ['Command Aura',    '+10% damage while above 50% HP'],
        b: ['Standing Order',  'Defend action grants +15% ATK on your next strike'],
        c: ["King's Presence", "Enemy ATK reduced 15% in their first 3 turns"],
      },
      { // Tier 2 — level 20
        a: ["Crown's Weight",  'Heavy strike costs no extra speed (same speed as basic Strike)'],
        b: ['Loyal Guard',     'First killing blow per combat reduces to 1 HP and grants +30% DEF for 3 turns'],
        c: ['Dominion',        'Enemy DEF reduced 1 each turn (stacks, max 10)'],
      },
      { // Tier 3 — level 25
        a: ['Throne Steady',   'Taking damage does not interrupt your Defend stance'],
        b: ["Healer's Decree", 'Defend action heals you for 8% max HP (also heals ally if present)'],
        c: ['Iron Reign',      'Enemies below 30% HP cannot crit you'],
      },
      { // Tier 4 — level 30
        a: ['Sovereign Will',  'Immune to fear/intimidation; +20% all stats while alone'],
        b: ['Summon Retainer', 'Active: summon a 30 HP / 8 ATK ally for 5 turns'],
        c: ['Wide Reign',      'Dominion DEF reduction stacks 2× faster (2 per turn)'],
      },
      { // Tier 5 — level 35
        a: ['Royal Blood',     'Below 25% HP: ATK +30% and DEF +30%'],
        b: ['Court of Witnesses', 'Each successful Defend grants a Witness stack (max 3, +15% damage each)'],
        c: ['Crown Tax',       'Enemy crits against you grant +20% damage on your next attack'],
      },
      { // Tier 6 — level 40
        a: ['The Throne',      'Active: 4 turns of HP-cannot-drop-below-1 (effective invulnerability)'],
        b: ['Mass Decree',     'Active: heal to full + grant +50% ATK for 3 turns (allies too if present)'],
        c: ['Conquest',        'Active: instantly stack Dominion to max (10); deal damage = Dominion × 5'],
      },
    ],
  },
  {
    key: 'wrathborn', name: 'Wrathborn', judgeOf: 'Judge of Desolation',
    color: '#c0392b', tagline: 'Rage evolved into power.',
    narrative: 'ANOMALY DETECTED — the rage stabilized into form. CLASS REGISTERED: WRATHBORN.',
    // Three branches:
    //   a — Path of Fury: low-HP glass cannon, gets stronger as you bleed
    //   b — Path of the Engine: momentum/speed, kills refresh cooldowns
    //   c — Path of Cataclysm: bleed/sustain damage, debuff stacking
    tiers: [
      { // Tier 1 — level 15
        a: ['Rage Engine',  '+1% damage per 1% HP missing'],
        b: ['Bloodrush',    '+15% SPD for 3 turns after taking damage'],
        c: ['Fury Slam',    'Active: heavy hit + applies Bleeding (3 turns, 5 dmg/turn)'],
      },
      { // Tier 2 — level 20
        a: ['Open Wound',   'Your hits prevent enemy regen for 2 turns'],
        b: ['Adrenaline',   'Below 25% HP, basic strikes cost no action (effective double-strike)'],
        c: ['Tearing Strike','Basic hits apply Bleeding (3 turns, 4 dmg)'],
      },
      { // Tier 3 — level 25
        a: ['Unbreakable Anger', 'Immune to stun/silence while below 40% HP'],
        b: ['Bloodrush II',      '+15% damage while Bloodrush is active'],
        c: ['Bone Crush',        'Crits permanently reduce enemy DEF by 5 (stacks)'],
      },
      { // Tier 4 — level 30
        a: ['Pain Threshold',    'First hit per turn that would deal >25% HP is capped at 25%'],
        b: ['Violence Cycle',    'Kills refresh skill cooldowns'],
        c: ['Bleeding Cascade',  'Bleeding ticks also reduce enemy ATK by 1 each turn'],
      },
      { // Tier 5 — level 35
        a: ["Death's Door",      'At 1 HP, all damage doubled for 3 turns (once per battle)'],
        b: ['Wild Frenzy',       '+5% SPD per consecutive kill (resets at combat end)'],
        c: ['Wild Blood',        'Every 10 damage you deal reflects 3 back as Bleeding'],
      },
      { // Tier 6 — level 40
        a: ['Cataclysm',         'Active: 3× damage hit, costs all HP above 1'],
        b: ['Last Engine',       'Active: drop to 1 HP, gain ATK = missing HP for 3 turns (once/battle)'],
        c: ['Final Massacre',    'Active: strike Bleeding enemies 3× (boosted by Bleeding stacks)'],
      },
    ],
  },
  {
    key: 'chimera', name: 'Chimera', judgeOf: 'Judge of Desolation',
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
    key: 'unwritten', name: 'Unwritten', judgeOf: 'Judges of Authority',
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
    key: 'oathbreaker', name: 'Oathbreaker', judgeOf: 'Judges of Authority',
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
    key: 'prime', name: 'Prime', judgeOf: 'Judges of Authority',
    color: '#e0a040', tagline: 'Humanity before elemental evolution.',
    narrative: 'ANOMALY DETECTED — pre-evolution baseline holds. CLASS REGISTERED: PRIME.',
    // Dominion class. Breaks the "scale one stat" rule — Prime scales ALL
    // stats per turn alive. The class doesn't shine in short fights, it
    // shines in long ones. Late combat: a juggernaut. Eternal Sovereign
    // (5a) carries stack growth between combats via persistent player
    // columns (prime_atk_stacks / prime_def_stacks / prime_spd_stacks).
    // Three branches:
    //   a — Path of Sovereignty: pure per-turn growth scaling
    //   b — Path of the Standard: buff stacking on damage taken
    //   c — Path of the Crown: enemy debuffs + invulnerability windows
    tiers: [
      { // Tier 1 — level 15
        a: ['Stand Tall',       'Each turn alive: +2 ATK (permanent for combat).'],
        b: ['Royal Banner',     'Start combat with +10% all stats.'],
        c: ["Crown's Weight",   'Basic strikes also permanently reduce enemy ATK by 1.'],
      },
      { // Tier 2 — level 20
        a: ['Iron Resolve',     'Each turn alive: +1 DEF (permanent for combat).'],
        b: ['Marshal',          'Basic strikes +5% damage per turn elapsed.'],
        c: ['Authority Pulse',  'Every 3rd turn: your DEF doubles for that turn.'],
      },
      { // Tier 3 — level 25
        a: ['Quickening Will',  'Each turn alive: +2 SPD (permanent for combat).'],
        b: ['Discipline',       'Defend grants +10% ATK on next strike (stacks).'],
        c: ['Crown Drain',      'Basic strikes permanently reduce enemy DEF by 2.'],
      },
      { // Tier 4 — level 30
        a: ['Throneborn',       'At 5+ turns elapsed: +30% damage and +30% DEF.'],
        b: ['Unyielding Standard','Each time you take damage: +1% damage permanently (cap +50%).'],
        c: ["Sovereign's Reach",'High ATK applies to defense this turn (ATK > DEF → uses ATK).'],
      },
      { // Tier 5 — level 35
        a: ['Eternal Sovereign','Stand Tall / Iron Resolve / Quickening Will stacks persist between combats (cap 50 each, reset at chapter end).'],
        b: ['March Forever',    'Below 30% HP: all stat gains this turn are doubled.'],
        c: ['Empyrean',         'Once/combat: when you would die, survive at 1 HP + +50 to all stacks.'],
      },
      { // Tier 6 — level 40
        a: ['Apex Sovereign',   'Active: damage = (total ATK + DEF + SPD bonus stacks).'],
        b: ['Final Standard',   'Active: 3 turns where every action doubles its effect.'],
        c: ['The Throne Speaks','Active: 5 turns where enemies cannot act.'],
      },
    ],
  },
  {
    key: 'bastion', name: 'Bastion', judgeOf: 'Judge of Purity',
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
    key: 'dawnbringer', name: 'Dawnbringer', judgeOf: 'Judge of Purity',
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
    key: 'ravager', name: 'Ravager', judgeOf: 'Judge of Desolation',
    color: '#a02822', tagline: 'A killer who never paused to consider mercy.',
    narrative: 'ANOMALY DETECTED — kill count tolerable. CLASS REGISTERED: RAVAGER.',
    // Three branches:
    //   a — Path of the Savage: crit-fishing, reliable high-ceiling DPS
    //   b — Path of the Bleed: damage-over-time stacking
    //   c — Path of the Frenzy: kill-chain scaling (works best vs multi or
    //       phased enemies; passable in 1v1 due to Hunter's Pulse heal)
    tiers: [
      { // Tier 1 — level 15
        a: ['Savage Hit',       'Basic strikes have 15% chance to crit (×2 damage)'],
        b: ['Tearing Strike',   'Basic hits apply Bleeding (3 turns, 5 damage)'],
        c: ["Predator's Eye",   'Damage to enemies below 50% HP +25%'],
      },
      { // Tier 2 — level 20
        a: ['Brutal Edge',      'Crits deal ×2.5 damage instead of ×2'],
        b: ['Bleed Stack',      'Bleeding stacks up to 3 (max 15 damage/turn)'],
        c: ["Hunter's Pulse",   'Kills heal 15% max HP'],
      },
      { // Tier 3 — level 25
        a: ['Bloodlust',        'Crits reduce skill cooldowns by 1 turn'],
        b: ['Hemorrhage',       'Bleeding enemies take +20% damage from all your attacks'],
        c: ['Frenzy',           'Gain a Frenzy stack on kill (max 5): each = +10% damage'],
      },
      { // Tier 4 — level 30
        a: ['Bone Crush',       'Crits permanently reduce enemy DEF by 3 (stacks per crit)'],
        b: ['Wild Wound',       'Basic strikes have 25% chance to deal instant bleed burst (×2 normal)'],
        c: ['Wild Frenzy',      'Each Frenzy stack also adds +5% SPD'],
      },
      { // Tier 5 — level 35
        a: ['Murder Strike',    'Active: guaranteed crit + ignores 50% DEF (once per combat)'],
        b: ["Predator's Wound", 'Enemies below 30% HP with Bleeding take 3× bleed damage'],
        c: ['Apex Predator',    'At 5 Frenzy stacks, basic strikes also apply bleed'],
      },
      { // Tier 6 — level 40
        a: ['Final Massacre',   'Active: 3 strikes at 80% each, all guaranteed crits'],
        b: ['Bleeding Cascade', 'Active: enemies bleed at 2× stacks for 5 turns'],
        c: ['Slaughterborn',    'At 3+ Frenzy: kills trigger a free basic strike on same target (chains)'],
      },
    ],
  },
  {
    key: 'dreadnought', name: 'Dreadnought', judgeOf: 'Judge of Desolation',
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
    key: 'ghostblade', name: 'Ghostblade', judgeOf: 'Judges of Balance',
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
    tiers: [
      // Ghostblade — Judge of Silence
      // Three branches:
      //   a — Path of the Blade: raw speed/DPS scaling, bleed chains
      //   b — Path of the Phase: stealth/dodge/teleport, Phase stack mechanic
      //   c — Path of the Execution: mark-and-kill setup, boss specialist
      { // Tier 1 — level 15
        a: ['Phase Dash',       '+20% SPD; first basic strike each combat +50% damage'],
        b: ['Afterimage',       '20% chance when hit: next enemy attack fully misses'],
        c: ['Silent Cut',       'Strikes against unmarked enemies deal +20% damage'],
      },
      { // Tier 2 — level 20
        a: ['Bladework',        'Basic strikes +5% damage per SPD point above 30'],
        b: ['Ghost Step',       'Active: 2 turns of crit-immunity + your hits never miss'],
        c: ['Execution Thread', 'Active: mark enemy for 5 turns (+30% damage to marked)'],
      },
      { // Tier 3 — level 25
        a: ['Quickstep',        'Every 3rd basic strike grants a free extra basic strike'],
        b: ['Phantom Edge',     'Taking damage grants 1 Phase stack (max 5)'],
        c: ['Death Thread',     'Strikes vs Execution-marked enemies have +20% crit chance'],
      },
      { // Tier 4 — level 30
        a: ['Speed Demon',      'Effective SPD doubles for crit-chance calculations'],
        b: ['Untouchable',      'At 5 Phase stacks: take 50% less damage; consume 1 stack/hit'],
        c: ['Blood Tracker',    'Marked enemies dropping below 30% HP: your next hit is guaranteed crit'],
      },
      { // Tier 5 — level 35
        a: ['Wind Cutter',      'Basic strikes also apply bleed (3 turns, 5 damage)'],
        b: ['Phase Strike',     'Active: consume 3 Phase stacks: untargetable 1 turn + next strike ×3'],
        c: ['Coup de Grâce',    'Execution-marked enemies below 25% HP take +100% from basic strikes'],
      },
      { // Tier 6 — level 40
        a: ['Void Flurry',      'Active: 5 strikes at 60% each (300% total, ignores 25% DEF)'],
        b: ['Shadowmeld',       'Active: 3-turn untargetable, +1 Phase stack/turn, exit +100% next hit'],
        c: ['Final Witness',    'Active: instant kill if Mark active + below 40% HP, else damage = 40% max HP'],
      },
    ],
  },
  {
    key: 'silent_judge', name: 'Silent Judge', judgeOf: 'Judges of Balance',
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
    key: 'devourer', name: 'Devourer', judgeOf: 'Judge of Salvation',
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
    key: 'mourning_king', name: 'Mourning King', judgeOf: 'Judge of Salvation',
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
    key: 'vessel', name: 'Vessel', judgeOf: 'Judge of Ruin',
    color: '#5e3a78', tagline: 'Something ancient lives inside you.',
    narrative: 'ANOMALY DETECTED — second signature inside the body. CLASS REGISTERED: VESSEL.',
    // Three branches:
    //   a — Path of Whispers: corruption-stack scaling, reflect/share builds
    //   b — Path of the Hungering: vampire/life-steal sustain
    //   c — Path of Awakening: low-HP transformation burst
    // Corruption stacks: built from taking damage (1/hit) and kills (2/kill).
    // Capped at 10. Tracked in statusEffects.cls_corruptionStacks.
    tiers: [
      { // Tier 1 — level 15
        a: ['Whispers Below',   'Gain 1 Corruption per turn (passive). +2% damage per stack (max 10)'],
        b: ['Corrupted Flesh',  'Heal 5% max HP at the start of each turn'],
        c: ['Awakened Hunger',  'Below 30% HP: +20% damage and life-steal 10% of damage dealt'],
      },
      { // Tier 2 — level 20
        a: ['Shared Pain',      '20% of damage you take is reflected to enemy'],
        b: ['Drain Strike',     'Basic hits restore 8% of damage dealt as HP'],
        c: ['Possession Surge', 'Active: burn all Corruption stacks for +ATK = stacks × 3 (3 turns)'],
      },
      { // Tier 3 — level 25
        a: ['Festering Mark',   'First hit on enemy applies Rot (3 turns, 8 damage/turn)'],
        b: ["Vampire's Hunger", 'Kills restore 25% max HP'],
        c: ['Inner Voice',      'Every 10 stacks of Corruption gained → free SP'],
      },
      { // Tier 4 — level 30
        a: ['Shared Suffering', 'Enemy hits on you also damage them for 30% of their hit'],
        b: ['Ravenous',         'Life-steal effects are doubled while below 50% HP'],
        c: ['Mark of the Inside','At 5+ Corruption stacks, your next attack is guaranteed crit'],
      },
      { // Tier 5 — level 35
        a: ['Spreading Rot',    'Kills with Rot active extend Rot to next combat (1 turn)'],
        b: ['Eternal Hunger',   'Below 25% HP: damage taken heals you instead (once per turn)'],
        c: ['Whispers Strengthen', 'At 5+ Corruption stacks: +30% all stats'],
      },
      { // Tier 6 — level 40
        a: ['True Vessel',      'Active: transform — HP cap ×2, ATK +50%, Corruption builds 3× faster (irreversible this combat)'],
        b: ['Devour Soul',      'Active: instant-kill enemy below 30% HP, restore HP to full'],
        c: ['Final Awakening',  'At 1 HP: cannot die for 5 turns, all damage ×2 (once per battle)'],
      },
    ],
  },
  {
    key: 'hollow', name: 'Hollow', judgeOf: 'Judge of Ruin',
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
    key: 'abyss_walker', name: 'Abyss Walker', judgeOf: 'Judge of Ruin',
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
// Two formats supported:
//   • tiers: [{a:[lbl,sub], b:[lbl,sub], c:[lbl,sub]}, ...]  — fully authored
//   • skills: [[lbl,sub], ...]                                — legacy stub
// Legacy stubs are auto-promoted: each skill becomes the "a" branch, b and c
// are filled with "Path B (TBD)" placeholders. The system works end-to-end
// for every class; only one class (Arbiter) currently has all 18 unique
// skills authored. Future classes get full tier arrays as we author them.
function legacySkillsToTiers(skills, className) {
  return skills.map((s, i) => ({
    a: [s[0], s[1]],
    b: ['Path B — Tier ' + (i+1), 'Alternative skill, to be authored'],
    c: ['Path C — Tier ' + (i+1), 'Alternative skill, to be authored'],
  }))
}

export const CLASSES = {}
for (const c of CLASS_DATA) {
  const tiers = c.tiers || legacySkillsToTiers(c.skills, c.name)
  CLASSES[c.key] = {
    key: c.key,
    name: c.name,
    judgeOf: c.judgeOf,
    color: c.color,
    tagline: c.tagline,
    unlockNarrative: c.narrative,
    tiers,
    nodes: makeClassNodes(c.key, c.color, c.name, tiers),
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CLASS CHOICES — formKey → array of class keys offered at the post-Judges
// pick screen.
//
// Form key convention matches the Judge forms from the world canon:
//   verdict      — Verdict (Final Judge of Humanity) — godlike exclusives
//   dominion     — Dominion (Judges of Authority) — buffed Mercy + Wrath together
//   absolution   — Absolution (Judge of Purity) — buffed Mercy alone
//   ruin         — Ruin (Judge of Desolation) — buffed Wrath alone
//   equilibrium  — Equilibrium (Judges of Balance) — Mercy + Wrath together
//   mercy        — Mercy (Judge of Salvation) — base form
//   wrath        — Wrath (Judge of Ruin) — base form
//
// Rules from design discussion:
//   • verdict has 3 GODLIKE classes that appear nowhere else.
//   • Each of the other 6 forms has 4 class choices.
//   • Across the 6 non-verdict forms (24 slots, 18 classes), 6 classes
//     appear twice (always on thematically-adjacent axes) and 12 appear once.
//   • No class appears three or more times.
// ─────────────────────────────────────────────────────────────────────────
export const CLASS_CHOICES = {
  verdict:     ['eclipse_walker', 'nullborn', 'error'],
  dominion:    ['prime', 'arbiter', 'oathbreaker', 'unwritten'],
  absolution:  ['monarch', 'bastion', 'dawnbringer', 'arbiter'],
  ruin:        ['wrathborn', 'dreadnought', 'ravager', 'chimera'],
  equilibrium: ['ghostblade', 'unwritten', 'silent_judge', 'oathbreaker'],
  mercy:       ['chimera', 'devourer', 'mourning_king', 'monarch'],
  wrath:       ['vessel', 'hollow', 'abyss_walker', 'wrathborn'],
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

// True if the player has already committed to ANY skill in the same tier
// as nodeId (i.e. picked a sibling). The 6×3 grid uses node.tier (1..6).
// Tier picks are final — once a tier choice is made, the other two
// choices in that tier are permanently locked.
export function isTierAlreadyPicked(player, classKey, nodeId) {
  const cls = CLASSES[classKey]
  if (!cls) return false
  const node = cls.nodes.find(n => n.id === nodeId)
  if (!node || !node.tier) return false  // start node has no tier
  const unlocked = player.class_nodes_unlocked || []
  return cls.nodes.some(n =>
    n.tier === node.tier &&
    n.id   !== nodeId &&
    unlocked.includes(classKey + ':' + n.id)
  )
}

export function isClassNodeAvailable(player, classKey, nodeId) {
  const cls = CLASSES[classKey]
  if (!cls) return false
  const node = cls.nodes.find(n => n.id === nodeId)
  if (!node) return false
  if (isClassNodeUnlocked(player, classKey, nodeId)) return false
  if ((player.level || 1) < (node.levelRequired || 1)) return false
  // If a sibling in this tier is already picked, this slot is permanently
  // locked. Renders as a "locked" visual, not "available."
  if (isTierAlreadyPicked(player, classKey, nodeId)) return false
  if (!node.requires || node.requires.length === 0) return true
  return node.requires.some(req => isClassNodeUnlocked(player, classKey, req))
}

export function unlockClassNode(player, classKey, nodeId) {
  // Defensive: re-check the tier-pick gate even though the UI shouldn't
  // surface the button. If a stale UI somehow fires this for a node whose
  // tier sibling is already unlocked, refuse silently.
  if (isTierAlreadyPicked(player, classKey, nodeId)) {
    return { class_nodes_unlocked: player.class_nodes_unlocked || [] }
  }
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
