// data/elements_tree.js
//
// Element trees — one per element. Each element gets its own 20-node tree
// with three sub-paths (Aggressive / Defensive / Utility) branching from
// a shared root. Players spend "Resonance Shards" (not SP) to unlock these.
//
// Currency: Resonance Shards (player.resonance_shards)
//   • 5 shards per zone boss killed
//   • 3 shards per chapter completion
//   • 1 shard per help action (cap pending design)
//
// Costs: 1 shard for small nodes, 2 for notables, 3 for keystones/actives.
//
// Attunement: when player.element matches the tree key, ALL numeric values
// on that tree's unlocked nodes are doubled. Durations on actives are
// NOT scaled — they keep their original turn count.
//
// Schema additions over the main tree:
//   element:        which element this node belongs to (matches tree key)
//   procChance:     0.0-1.0 chance per attack to trigger procEffect
//   procEffect:     status-effect key the proc applies (e.g. 'ember_memory')
//   procDuration:   how long the effect lasts (turns)
//   procStacks:     max stack count if effect stacks
//
// Combat engines read these fields generically:
//   • Stat bonuses (stat/val) — summed at battle start
//   • Proc nodes — checked on each player attack
//   • Active fns — dispatched by fn name (defined in element_mechanics.js)
//
// Resonance Shard cost tiers
export const ELEMENT_COSTS = {
  small:    1,
  notable:  2,
  keystone: 3,
  active:   3,
}

// Per-tree coordinate grid. Each tree gets its own coordinate space; the
// existing skills.js camera logic re-centers when treeMode switches.
// Root at (0,0) for every tree; sub-paths fan out.
//
// Layout: root at center, Aggressive goes UP-RIGHT, Defensive UP-LEFT,
// Utility DOWN. Keystone at the far apex of each path.
const NX = 0, NY = 0     // root anchor for any element tree

// ──────────────────────────────────────────────────────────────────────
// FIRE — Element key: 'fire'. Signature mechanic: Ember Memory (DoT that
// the target "can't forget"). Lore-coherent with zone-fire ("fire that
// doesn't burn," "ash," "the Ashen King," "char").
// ──────────────────────────────────────────────────────────────────────
const FIRE_NODES = [
  // ── ROOT ────────────────────────────────────────────────
  { id:'fire_root', label:'First Char', type:'start',
    element:'fire', branch:'fire_root',
    x:NX, y:NY, cost:0, requires:[],
    desc:'The first heat you remember. Spend a Resonance Shard at any adjacent node to begin.' },

  // ═══════════════════════════════════════════════════════════════════
  // AGGRESSIVE PATH (right) — damage, burn, raw heat
  // ═══════════════════════════════════════════════════════════════════
  { id:'fire_aggr_1', label:'Spark', type:'small',
    element:'fire', branch:'fire_aggressive',
    x:NX+90, y:NY-60, cost:ELEMENT_COSTS.small,
    stat:'fire_damage_pct', val:3, requires:['fire_root'],
    desc:'+3% damage on fire-tagged attacks. Attuned: +6%.' },

  { id:'fire_aggr_2', label:'Live Coal', type:'small',
    element:'fire', branch:'fire_aggressive',
    x:NX+170, y:NY-100, cost:ELEMENT_COSTS.small,
    stat:'fire_damage_pct', val:4, requires:['fire_aggr_1'],
    desc:'+4% damage on fire-tagged attacks. Attuned: +8%.' },

  { id:'fire_aggr_3', label:'Ash Recall', type:'notable',
    battleType:'passive',
    element:'fire', branch:'fire_aggressive',
    x:NX+240, y:NY-150, cost:ELEMENT_COSTS.notable,
    procChance:0.15, procEffect:'ember_memory', procDuration:3, procStacks:3,
    requires:['fire_aggr_2'],
    desc:'15% chance on attack to inflict Ember Memory — the target keeps burning for 3 turns. Stacks to 3. Attuned: 30% chance.' },

  { id:'fire_aggr_4', label:'Slow Burn', type:'small',
    element:'fire', branch:'fire_aggressive',
    x:NX+310, y:NY-110, cost:ELEMENT_COSTS.small,
    stat:'ember_memory_dmg_pct', val:10, requires:['fire_aggr_3'],
    desc:'Ember Memory damage +10% per tick. Attuned: +20%.' },

  { id:'fire_aggr_5', label:'Char Bloom', type:'small',
    element:'fire', branch:'fire_aggressive',
    x:NX+330, y:NY-200, cost:ELEMENT_COSTS.small,
    stat:'ember_memory_max_stacks', val:2, requires:['fire_aggr_3'],
    desc:'Ember Memory can stack 2 more times (max 5 stacks). Attuned: +4 (max 7).' },

  { id:'fire_aggr_ks', label:'Cinder Step', type:'keystone',
    battleType:'active',
    element:'fire', branch:'fire_aggressive',
    x:NX+390, y:NY-260, cost:ELEMENT_COSTS.active,
    fn:'cinderStep',
    requires:['fire_aggr_4','fire_aggr_5'],
    desc:'Active: Your next 3 attacks each apply Ember Memory (3 turns). Cooldown 2 turns. Attuned: applies twice per attack (essentially auto-stacks).' },

  // ═══════════════════════════════════════════════════════════════════
  // DEFENSIVE PATH (left) — fire resistance, heat shield, burn turned inward
  // ═══════════════════════════════════════════════════════════════════
  { id:'fire_def_1', label:'Sun-Tempered', type:'small',
    element:'fire', branch:'fire_defensive',
    x:NX-90, y:NY-60, cost:ELEMENT_COSTS.small,
    stat:'fire_resist_pct', val:5, requires:['fire_root'],
    desc:'Take 5% less damage from fire-tagged sources. Attuned: 10%.' },

  { id:'fire_def_2', label:'Slag Skin', type:'small',
    element:'fire', branch:'fire_defensive',
    x:NX-170, y:NY-100, cost:ELEMENT_COSTS.small,
    stat:'fire_resist_pct', val:5, requires:['fire_def_1'],
    desc:'+5% fire resistance. Attuned: +10%.' },

  { id:'fire_def_3', label:'Heat Sink', type:'notable',
    battleType:'passive',
    element:'fire', branch:'fire_defensive',
    x:NX-240, y:NY-150, cost:ELEMENT_COSTS.notable,
    stat:'heat_sink_pct', val:25, requires:['fire_def_2'],
    desc:'When you take fire damage, 25% of it instead refills your MP. Attuned: 50%.' },

  { id:'fire_def_4', label:'Backdraft', type:'small',
    element:'fire', branch:'fire_defensive',
    x:NX-310, y:NY-110, cost:ELEMENT_COSTS.small,
    stat:'fire_reflect_pct', val:8, requires:['fire_def_3'],
    desc:'8% of fire damage taken is reflected to the attacker. Attuned: 16%.' },

  { id:'fire_def_5', label:'Ember Bone', type:'small',
    element:'fire', branch:'fire_defensive',
    x:NX-330, y:NY-200, cost:ELEMENT_COSTS.small,
    stat:'hp_when_burning', val:3, requires:['fire_def_3'],
    desc:'Heal +3 HP per turn while at least one Ember Memory stack is on the enemy. Attuned: +6.' },

  { id:'fire_def_ks', label:'Forge-Body', type:'keystone',
    battleType:'active',
    element:'fire', branch:'fire_defensive',
    x:NX-390, y:NY-260, cost:ELEMENT_COSTS.active,
    fn:'forgeBody',
    requires:['fire_def_4','fire_def_5'],
    desc:'Active: For 2 turns, you take half damage from ALL sources and reflect 25% of fire damage to attackers. Cooldown 3 turns.' },

  // ═══════════════════════════════════════════════════════════════════
  // UTILITY PATH (down) — fire's stranger behaviors. Heat as resource,
  // light as information, ember as memory.
  // ═══════════════════════════════════════════════════════════════════
  { id:'fire_util_1', label:'Read by Firelight', type:'small',
    element:'fire', branch:'fire_utility',
    x:NX-50, y:NY+80, cost:ELEMENT_COSTS.small,
    stat:'crit_chance_pct', val:3, requires:['fire_root'],
    desc:'+3% crit chance. Attuned: +6%. (Fire sees through fog.)' },

  { id:'fire_util_2', label:'Smoke-Sight', type:'small',
    element:'fire', branch:'fire_utility',
    x:NX+50, y:NY+80, cost:ELEMENT_COSTS.small,
    stat:'crit_dmg_pct', val:8, requires:['fire_root'],
    desc:'+8% crit damage. Attuned: +16%.' },

  { id:'fire_util_3', label:'Wick-Cut', type:'notable',
    battleType:'passive',
    element:'fire', branch:'fire_utility',
    x:NX, y:NY+150, cost:ELEMENT_COSTS.notable,
    procChance:0.20, procEffect:'enemy_atk_down', procDuration:2,
    requires:['fire_util_1','fire_util_2'],
    desc:'20% chance on crit to reduce enemy ATK by 5 for 2 turns. Attuned: 40% chance, -10 ATK.' },

  { id:'fire_util_4', label:'Long Wick', type:'small',
    element:'fire', branch:'fire_utility',
    x:NX-60, y:NY+220, cost:ELEMENT_COSTS.small,
    stat:'mp_max_bonus', val:5, requires:['fire_util_3'],
    desc:'+5 max MP. Attuned: +10.' },

  { id:'fire_util_5', label:'Cold Match', type:'small',
    element:'fire', branch:'fire_utility',
    x:NX+60, y:NY+220, cost:ELEMENT_COSTS.small,
    stat:'mp_regen_combat', val:2, requires:['fire_util_3'],
    desc:'Regenerate +2 MP at the start of each turn. Attuned: +4.' },

  { id:'fire_util_ks', label:'Ashen Crown', type:'keystone',
    battleType:'active',
    element:'fire', branch:'fire_utility',
    x:NX, y:NY+300, cost:ELEMENT_COSTS.active,
    fn:'ashenCrown',
    requires:['fire_util_4','fire_util_5'],
    desc:'Active: Convert all current Ember Memory stacks on the enemy into 8% max HP healing each. Removes the stacks. Cooldown 3 turns.' },
]

// ──────────────────────────────────────────────────────────────────────
// REGISTRY — keyed by element. Each element will get its own NODES array
// here. Other elements are PLANNED (sessions 2–5).
// ──────────────────────────────────────────────────────────────────────
export const ELEMENT_TREES = {
  fire: {
    label: 'Fire',
    sigil: '🔥',
    color: '#e05555',
    signature: 'ember_memory',
    signatureLabel: 'Ember Memory',
    nodes: FIRE_NODES,
  },
  // water:       { ... } — TODO session 1 part B
  // lightning:   { ... } — TODO session 2
  // arcane:      { ... } — TODO session 2
  // shadow:      { ... } — TODO session 3
  // earth:       { ... } — TODO session 3
  // wind:        { ... } — TODO session 4
  // plant:       { ... } — TODO session 4
  // metal:       { ... } — TODO session 5
  // poison:      { ... } — TODO session 5
}

// Helper: get all nodes across all element trees (used by combat engines
// to read currently-unlocked element bonuses).
export function getAllElementNodes() {
  const out = []
  for (const key in ELEMENT_TREES) {
    out.push(...ELEMENT_TREES[key].nodes)
  }
  return out
}
