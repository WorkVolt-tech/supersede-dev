// data/elements_tree.js
//
// ELEMENTAL TREE SYSTEM — new architecture replacing the old ESP system.
//
// Currency: Resonance Shards (player.resonance_shards). Sources to be wired
// next session: zone-boss kills (5 shards), chapter completion (3), helps (1).
// Old `player.esp` and `player.esp_tree` are migrated to zero on load
// (see skills.js wipe-migration block).
//
// Per-element tree shape:
//   • Shared root node (free)
//   • Three sub-paths: Aggressive / Defensive / Utility
//   • Each sub-path: 6 nodes ending in a keystone active (5 + 1 active)
//   • Plus 1 root  ⇒ 1 + (6 × 3) = 19 nodes per element
//
// Each tree has a SIGNATURE MECHANIC — a status effect or combat behavior
// the tree's notables and actives revolve around:
//   Ignis    🔥 — Ember Memory   (stacking damage-over-time)
//   Aqua     💧 — Still Water    (strip enemy buffs, cleanse self)
//   Volt     ⚡ — Second Strike  (extra hit on attacks)
//   Arcane   ✨ — Reverberation  (chance to re-cast skills)
//   Umbra    🌑 — Unseen         (temporary untargetability)
//   Terra    🪨 — Stoneborn      (stacking damage resistance)
//   Aero     💨 — Held Breath    (enemy can't act / first strike)
//   Flora    🌿 — Slow Bloom     (delayed regen)
//   Ferro    ⚙️ — Mirror Skin    (damage reflection)
//   Venin    ☠️ — Long Decay     (enemy stats fall over time)
//
// Attunement: when player.element matches the tree key, ALL numeric VALUES
// on unlocked nodes are doubled (stat val, proc chance, proc duration stays
// the same). Combat wiring (next session) honours player.element to decide.
//
// Schema additions over the main NODES schema:
//   element        — element tree key (matches ELEMENT_TREES key)
//   procChance     — 0.0..1.0 chance to apply effect on attack
//   procEffect     — status-effect key (e.g. 'ember_memory')
//   procDuration   — turns the effect lasts
//   procStacks     — max stack count if effect stacks
//   fn             — handler name for actives (combat-engine dispatch)
//
// Combat engines read these generically in Pass B (next session). For now
// (Pass A) the data and UI exist but combat ignores them.
//

// ── Shard cost tiers ──────────────────────────────────────────────
export const SHARD_COSTS = {
  small:    1,
  notable:  2,
  keystone: 3,
  active:   3,
}

// ── Tree layout helper — same coord scale as main NODES so SVG renderer
// can reuse pan/zoom logic unchanged.
// Root at (0, 0). Aggressive arm goes up-right, Defensive up-left, Utility down.
// ──────────────────────────────────────────────────────────────────

// Per-element node generator — produces a Y-shape with three LINEAR arms
// branching from a central root. Each arm is a 6-node chain (so each node
// has exactly one predecessor — no forks). Matches the class-tree visual
// concept: clean linear paths along each diagonal.
//
// Layout (canvas coords, 0,0 = root):
//   Aggressive arm: up-right diagonal, 6 nodes  (x:+90,180,...,540  y:-50,-100,...,-300)
//   Defensive arm:  up-left mirror,    6 nodes  (x:-90,-180,...,-540 y:-50,-100,...,-300)
//   Utility arm:    straight down,     6 nodes  (x:0  y:+50,+100,...,+300)
function buildElementTree(elKey, sig) {
  const NX = 0, NY = 0
  const N = sig.names, S = sig.stats
  // Arm step magnitudes — keep equal so each path looks even
  const DX = 95   // horizontal step for the diagonal arms
  const DY = 55   // vertical step (used for diagonals AND down arm)
  return [
    // ── ROOT ─────────────────────────────────────────────────
    { id: `${elKey}_root`, label: N.root, type: 'start',
      element: elKey, branch: `${elKey}_root`,
      x: NX, y: NY, cost: 0, requires: [],
      desc: S.root_desc },

    // ── AGGRESSIVE PATH (up-right) — linear chain ─────────────
    { id: `${elKey}_aggr_1`, label: N.aggr_1, type: 'small',
      element: elKey, branch: `${elKey}_aggressive`,
      x: NX+DX*1, y: NY-DY*1, cost: SHARD_COSTS.small,
      stat: S.aggr_stat, val: 3, requires: [`${elKey}_root`],
      desc: S.aggr_1_desc },
    { id: `${elKey}_aggr_2`, label: N.aggr_2, type: 'small',
      element: elKey, branch: `${elKey}_aggressive`,
      x: NX+DX*2, y: NY-DY*2, cost: SHARD_COSTS.small,
      stat: S.aggr_stat, val: 4, requires: [`${elKey}_aggr_1`],
      desc: S.aggr_2_desc },
    { id: `${elKey}_aggr_3`, label: N.aggr_3, type: 'notable',
      battleType: 'passive',
      element: elKey, branch: `${elKey}_aggressive`,
      x: NX+DX*3, y: NY-DY*3, cost: SHARD_COSTS.notable,
      procChance: 0.15, procEffect: S.proc_aggr_effect,
      procDuration: S.proc_aggr_dur, procStacks: S.proc_aggr_stacks,
      requires: [`${elKey}_aggr_2`],
      desc: S.aggr_3_desc },
    { id: `${elKey}_aggr_4`, label: N.aggr_4, type: 'small',
      element: elKey, branch: `${elKey}_aggressive`,
      x: NX+DX*4, y: NY-DY*4, cost: SHARD_COSTS.small,
      stat: S.aggr_4_stat, val: 10, requires: [`${elKey}_aggr_3`],
      desc: S.aggr_4_desc },
    { id: `${elKey}_aggr_5`, label: N.aggr_5, type: 'small',
      element: elKey, branch: `${elKey}_aggressive`,
      x: NX+DX*5, y: NY-DY*5, cost: SHARD_COSTS.small,
      stat: S.aggr_5_stat, val: 2, requires: [`${elKey}_aggr_4`],
      desc: S.aggr_5_desc },
    { id: `${elKey}_aggr_ks`, label: N.aggr_ks, type: 'keystone',
      battleType: 'active',
      element: elKey, branch: `${elKey}_aggressive`,
      x: NX+DX*6, y: NY-DY*6, cost: SHARD_COSTS.active,
      fn: S.fn_aggr,
      requires: [`${elKey}_aggr_5`],
      desc: S.aggr_ks_desc },

    // ── DEFENSIVE PATH (up-left, mirror) — linear chain ───────
    { id: `${elKey}_def_1`, label: N.def_1, type: 'small',
      element: elKey, branch: `${elKey}_defensive`,
      x: NX-DX*1, y: NY-DY*1, cost: SHARD_COSTS.small,
      stat: S.def_stat, val: 5, requires: [`${elKey}_root`],
      desc: S.def_1_desc },
    { id: `${elKey}_def_2`, label: N.def_2, type: 'small',
      element: elKey, branch: `${elKey}_defensive`,
      x: NX-DX*2, y: NY-DY*2, cost: SHARD_COSTS.small,
      stat: S.def_stat, val: 5, requires: [`${elKey}_def_1`],
      desc: S.def_2_desc },
    { id: `${elKey}_def_3`, label: N.def_3, type: 'notable',
      battleType: 'passive',
      element: elKey, branch: `${elKey}_defensive`,
      x: NX-DX*3, y: NY-DY*3, cost: SHARD_COSTS.notable,
      stat: S.def_3_stat, val: 25, requires: [`${elKey}_def_2`],
      desc: S.def_3_desc },
    { id: `${elKey}_def_4`, label: N.def_4, type: 'small',
      element: elKey, branch: `${elKey}_defensive`,
      x: NX-DX*4, y: NY-DY*4, cost: SHARD_COSTS.small,
      stat: S.def_4_stat, val: 8, requires: [`${elKey}_def_3`],
      desc: S.def_4_desc },
    { id: `${elKey}_def_5`, label: N.def_5, type: 'small',
      element: elKey, branch: `${elKey}_defensive`,
      x: NX-DX*5, y: NY-DY*5, cost: SHARD_COSTS.small,
      stat: S.def_5_stat, val: 3, requires: [`${elKey}_def_4`],
      desc: S.def_5_desc },
    { id: `${elKey}_def_ks`, label: N.def_ks, type: 'keystone',
      battleType: 'active',
      element: elKey, branch: `${elKey}_defensive`,
      x: NX-DX*6, y: NY-DY*6, cost: SHARD_COSTS.active,
      fn: S.fn_def,
      requires: [`${elKey}_def_5`],
      desc: S.def_ks_desc },

    // ── UTILITY PATH (straight down) — linear chain ───────────
    { id: `${elKey}_util_1`, label: N.util_1, type: 'small',
      element: elKey, branch: `${elKey}_utility`,
      x: NX, y: NY+DY*1, cost: SHARD_COSTS.small,
      stat: 'crit_chance_pct', val: 3, requires: [`${elKey}_root`],
      desc: S.util_1_desc },
    { id: `${elKey}_util_2`, label: N.util_2, type: 'small',
      element: elKey, branch: `${elKey}_utility`,
      x: NX, y: NY+DY*2, cost: SHARD_COSTS.small,
      stat: 'crit_dmg_pct', val: 8, requires: [`${elKey}_util_1`],
      desc: S.util_2_desc },
    { id: `${elKey}_util_3`, label: N.util_3, type: 'notable',
      battleType: 'passive',
      element: elKey, branch: `${elKey}_utility`,
      x: NX, y: NY+DY*3, cost: SHARD_COSTS.notable,
      procChance: 0.20, procEffect: S.proc_util_effect,
      procDuration: S.proc_util_dur,
      requires: [`${elKey}_util_2`],
      desc: S.util_3_desc },
    { id: `${elKey}_util_4`, label: N.util_4, type: 'small',
      element: elKey, branch: `${elKey}_utility`,
      x: NX, y: NY+DY*4, cost: SHARD_COSTS.small,
      stat: 'mp_max_bonus', val: 5, requires: [`${elKey}_util_3`],
      desc: S.util_4_desc },
    { id: `${elKey}_util_5`, label: N.util_5, type: 'small',
      element: elKey, branch: `${elKey}_utility`,
      x: NX, y: NY+DY*5, cost: SHARD_COSTS.small,
      stat: 'mp_regen_combat', val: 2, requires: [`${elKey}_util_4`],
      desc: S.util_5_desc },
    { id: `${elKey}_util_ks`, label: N.util_ks, type: 'keystone',
      battleType: 'active',
      element: elKey, branch: `${elKey}_utility`,
      x: NX, y: NY+DY*6, cost: SHARD_COSTS.active,
      fn: S.fn_util,
      requires: [`${elKey}_util_5`],
      desc: S.util_ks_desc },
  ]
}

// ══════════════════════════════════════════════════════════════════
// IGNIS — Fire 🔥. Signature: Ember Memory (stacking burn DoT). Echoes
// zone-fire's "fire that doesn't burn / ash / char / Ashen King" lore.
// ══════════════════════════════════════════════════════════════════
const IGNIS_NODES = buildElementTree('fire', {
  signature: 'ember_memory',
  signatureLabel: 'Ember Memory',
  names: {
    root:     'First Char',
    aggr_1:   'Spark',         aggr_2: 'Live Coal',  aggr_3: 'Ash Recall',
    aggr_4:   'Slow Burn',     aggr_5: 'Char Bloom', aggr_ks:'Cinder Step',
    def_1:    'Sun-Tempered',  def_2:  'Slag Skin',  def_3:  'Heat Sink',
    def_4:    'Backdraft',     def_5:  'Ember Bone', def_ks: 'Forge-Body',
    util_1:   'Read by Firelight', util_2: 'Smoke-Sight',
    util_3:   'Wick-Cut',      util_4: 'Long Wick',  util_5: 'Cold Match',
    util_ks:  'Ashen Crown',
  },
  stats: {
    root_desc:  'The first heat you remember. Spend a Resonance Shard at any adjacent node to begin.',
    aggr_stat:  'fire_damage_pct',
    aggr_1_desc:'+3% damage on fire-tagged attacks. Attuned: +6%.',
    aggr_2_desc:'+4% damage on fire-tagged attacks. Attuned: +8%.',
    proc_aggr_effect: 'ember_memory',
    proc_aggr_dur:    3,
    proc_aggr_stacks: 3,
    aggr_3_desc:'15% chance on attack to inflict Ember Memory — the target keeps burning for 3 turns. Stacks to 3. Attuned: 30% chance.',
    aggr_4_stat:'ember_memory_dmg_pct',
    aggr_4_desc:'Ember Memory damage +10% per tick. Attuned: +20%.',
    aggr_5_stat:'ember_memory_max_stacks',
    aggr_5_desc:'Ember Memory can stack 2 more times (max 5). Attuned: +4 (max 7).',
    fn_aggr:    'cinderStep',
    aggr_ks_desc:'Active: your next 3 attacks each apply Ember Memory. Cooldown 2 turns. Attuned: each attack applies twice.',

    def_stat:   'fire_resist_pct',
    def_1_desc: 'Take 5% less damage from fire-tagged sources. Attuned: 10%.',
    def_2_desc: '+5% fire resistance. Attuned: +10%.',
    def_3_stat: 'heat_sink_pct',
    def_3_desc: 'When you take fire damage, 25% of it instead refills your MP. Attuned: 50%.',
    def_4_stat: 'fire_reflect_pct',
    def_4_desc: '8% of fire damage taken reflects to attacker. Attuned: 16%.',
    def_5_stat: 'hp_per_burn_turn',
    def_5_desc: 'Heal +3 HP per turn while the enemy has any Ember Memory stack. Attuned: +6.',
    fn_def:     'forgeBody',
    def_ks_desc:'Active: for 2 turns, take half damage from ALL sources and reflect 25% of fire damage. Cooldown 3 turns.',

    util_1_desc:'+3% crit chance. Attuned: +6%. (Fire sees through fog.)',
    util_2_desc:'+8% crit damage. Attuned: +16%.',
    proc_util_effect: 'enemy_atk_down',
    proc_util_dur:    2,
    util_3_desc:'20% chance on crit to reduce enemy ATK by 5 for 2 turns. Attuned: 40% chance, -10 ATK.',
    util_4_desc:'+5 max MP. Attuned: +10.',
    util_5_desc:'Regenerate +2 MP at the start of each turn. Attuned: +4.',
    fn_util:    'ashenCrown',
    util_ks_desc:'Active: convert each Ember Memory stack on the enemy into 8% max-HP healing. Removes the stacks. Cooldown 3 turns.',
  },
})

// ══════════════════════════════════════════════════════════════════
// AQUA — Water 💧. Signature: Still Water (cleanse, strip buffs).
// Echoes water-as-quietness — patient damage, slow control, removing
// rather than adding.
// ══════════════════════════════════════════════════════════════════
const AQUA_NODES = buildElementTree('water', {
  signature: 'still_water',
  signatureLabel: 'Still Water',
  names: {
    root:     'First Quiet',
    aggr_1:   'Cold Pull',     aggr_2: 'Undertow',   aggr_3: 'Salt Memory',
    aggr_4:   'Slow Pressure', aggr_5: 'Riptide',    aggr_ks:'Drown Step',
    def_1:    'Driftwood',     def_2:  'Tide Skin',  def_3:  'Wash',
    def_4:    'Glass Surface', def_5:  'Pearl',      def_ks: 'Glacier-Body',
    util_1:   'Reading the Surface', util_2: 'Mist-Sight',
    util_3:   'Soft Rain',     util_4: 'Deep Well',  util_5: 'Sky Cup',
    util_ks:  'Pale Tide',
  },
  stats: {
    root_desc:  'A puddle is a memory of where the rain landed. Spend a Resonance Shard at any adjacent node to begin.',
    aggr_stat:  'water_damage_pct',
    aggr_1_desc:'+3% damage on water-tagged attacks. Attuned: +6%.',
    aggr_2_desc:'+4% damage on water-tagged attacks. Attuned: +8%.',
    proc_aggr_effect: 'still_water_strip',
    proc_aggr_dur:    1,
    proc_aggr_stacks: 1,
    aggr_3_desc:'15% chance on attack to strip one buff from the enemy. Attuned: 30%.',
    aggr_4_stat:'still_water_cleanse_count',
    aggr_4_desc:'Still Water strips 1 additional buff per proc. Attuned: 2 additional.',
    aggr_5_stat:'still_water_double_strip',
    aggr_5_desc:'After Still Water strips a buff, your next attack deals +10% damage. Attuned: +20%.',
    fn_aggr:    'drownStep',
    aggr_ks_desc:'Active: deal water damage AND strip ALL buffs from the enemy. Cooldown 2 turns.',

    def_stat:   'water_resist_pct',
    def_1_desc: 'Take 5% less damage from water-tagged sources. Attuned: 10%.',
    def_2_desc: '+5% water resistance. Attuned: +10%.',
    def_3_stat: 'self_cleanse_chance',
    def_3_desc: '25% chance at turn start to remove one debuff from yourself. Attuned: 50%.',
    def_4_stat: 'water_reflect_pct',
    def_4_desc: '8% of water damage taken reflects to attacker. Attuned: 16%.',
    def_5_stat: 'hp_per_cleanse',
    def_5_desc: 'Heal +3 HP when a debuff is removed from you. Attuned: +6.',
    fn_def:     'glacierBody',
    def_ks_desc:'Active: cleanse all debuffs on yourself. For 2 turns, you cannot be debuffed. Cooldown 3 turns.',

    util_1_desc:'+3% crit chance. Attuned: +6%. (Calm water reveals what is beneath.)',
    util_2_desc:'+8% crit damage. Attuned: +16%.',
    proc_util_effect: 'enemy_acc_down',
    proc_util_dur:    2,
    util_3_desc:'20% chance on crit to lower enemy accuracy by 20% for 2 turns. Attuned: 40% chance, 40% accuracy.',
    util_4_desc:'+5 max MP. Attuned: +10.',
    util_5_desc:'Regenerate +2 MP at the start of each turn. Attuned: +4.',
    fn_util:    'paleTide',
    util_ks_desc:'Active: heal 25% max HP and cleanse all debuffs. Cooldown 4 turns.',
  },
})

// ══════════════════════════════════════════════════════════════════
// REGISTRY
// ══════════════════════════════════════════════════════════════════
export const ELEMENT_TREES = {
  fire:      { key:'fire',      label:'Ignis',  sigil:'🔥', color:'#ff5500',
               bossKey:'zone_boss_fire',
               signature:'ember_memory',  signatureLabel:'Ember Memory',
               nodes: IGNIS_NODES },
  water:     { key:'water',     label:'Aqua',   sigil:'💧', color:'#0088ff',
               bossKey:'zone_boss_water',
               signature:'still_water',   signatureLabel:'Still Water',
               nodes: AQUA_NODES },
  lightning: { key:'lightning', label:'Volt',   sigil:'⚡', color:'#ffee58',
               bossKey:'zone_boss_lightning',
               signature:'second_strike', signatureLabel:'Second Strike',
               nodes: [] },  // TODO: session 2
  arcane:    { key:'arcane',    label:'Arcane', sigil:'✨', color:'#b06eff',
               bossKey:'zone_boss_arcane',
               signature:'reverberation', signatureLabel:'Reverberation',
               nodes: [] },  // TODO: session 2
  shadow:    { key:'shadow',    label:'Umbra',  sigil:'🌑', color:'#9a6fd8',
               bossKey:'zone_boss_shadow',
               signature:'unseen',        signatureLabel:'Unseen',
               nodes: [] },  // TODO: session 3
  earth:     { key:'earth',     label:'Terra',  sigil:'🪨', color:'#8b5e3c',
               bossKey:'zone_boss_earth',
               signature:'stoneborn',     signatureLabel:'Stoneborn',
               nodes: [] },  // TODO: session 3
  wind:      { key:'wind',      label:'Aero',   sigil:'💨', color:'#a8d8ea',
               bossKey:'zone_boss_wind',
               signature:'held_breath',   signatureLabel:'Held Breath',
               nodes: [] },  // TODO: session 4
  plant:     { key:'plant',     label:'Flora',  sigil:'🌿', color:'#66bb6a',
               bossKey:'zone_boss_plant',
               signature:'slow_bloom',    signatureLabel:'Slow Bloom',
               nodes: [] },  // TODO: session 4
  metal:     { key:'metal',     label:'Ferro',  sigil:'⚙️', color:'#90a4ae',
               bossKey:'zone_boss_metal',
               signature:'mirror_skin',   signatureLabel:'Mirror Skin',
               nodes: [] },  // TODO: session 5
  poison:    { key:'poison',    label:'Venin',  sigil:'☠️', color:'#7aad30',
               bossKey:'zone_boss_poison',
               signature:'long_decay',    signatureLabel:'Long Decay',
               nodes: [] },  // TODO: session 5
}

// Returns true if the player has cleared the zone boss that unlocks this
// element's tree. Reads player.defeated_bosses (existing field).
export function isElementUnlocked(elKey, player) {
  const t = ELEMENT_TREES[elKey]
  if (!t) return false
  const defeated = player?.defeated_bosses || []
  return defeated.includes(t.bossKey)
}

// Aggregate all nodes from all 10 trees — used by combat engines (next
// session) to scan player.elemental_unlocked for active bonuses.
export function getAllElementNodes() {
  const out = []
  for (const k in ELEMENT_TREES) out.push(...ELEMENT_TREES[k].nodes)
  return out
}
