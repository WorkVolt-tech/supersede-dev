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

// Per-element node generator — matches the user-provided SVG exactly:
//
//        L6                                            R6   ← keystone tips
//          ◌                                      ◌
//            ◌                                  ◌
//              ◌                              ◌
//                ◌                          ◌
//                  ◌                      ◌
//                            ★                       ← center start (root)
//                            ◌
//                            ◌
//                            ◌                       ← Utility arm
//                            ◌
//                            ◌
//                            ◌  ← Util keystone
//
// • Root at CENTER. Three independent arms radiate outward.
// • Right (Aggressive): 6 nodes up-and-right. Steps +60,-60 four times,
//   then +60,-30 twice — the diagonal flattens near the tip (per the SVG).
// • Left  (Defensive):  mirror of right.
// • Down  (Utility):    6 nodes straight down, 80px apart.
// • All three arms chain from root → no trunk-as-prereq.
function buildElementTree(elKey, sig) {
  const NX = 0, NY = 0
  const N = sig.names, S = sig.stats

  // Diagonal arm positions (relative to root). Spaced ~85px center-to-
  // center so 90px-wide labels don't overlap. All 6 steps equal (85,-85)
  // for clean straight 45° diagonals — no flattening at the tip.
  const RIGHT = [
    { x:  85, y:  -85 },   // _1
    { x: 170, y: -170 },   // _2
    { x: 255, y: -255 },   // _3
    { x: 340, y: -340 },   // _4
    { x: 425, y: -425 },   // _5
    { x: 510, y: -510 },   // _ks
  ]
  const LEFT = RIGHT.map(p => ({ x: -p.x, y: p.y }))
  // Utility goes straight down; nodes 110px apart for label clearance.
  const DOWN = [
    { x: 0, y: 110 },
    { x: 0, y: 220 },
    { x: 0, y: 330 },
    { x: 0, y: 440 },
    { x: 0, y: 550 },
    { x: 0, y: 660 },
  ]

  return [
    // ── ROOT (★ CENTER) ─────────────────────────────────────
    { id: `${elKey}_root`, label: N.root, type: 'start',
      element: elKey, branch: `${elKey}_root`,
      x: NX, y: NY, cost: 0, requires: [],
      desc: S.root_desc },

    // ── RIGHT BRANCH (Aggressive) — chains from root ────────
    { id: `${elKey}_aggr_1`, label: N.aggr_1, type: 'small',
      element: elKey, branch: `${elKey}_aggressive`,
      x: NX + RIGHT[0].x, y: NY + RIGHT[0].y, cost: SHARD_COSTS.small,
      stat: S.aggr_stat, val: 3, requires: [`${elKey}_root`],
      desc: S.aggr_1_desc },
    { id: `${elKey}_aggr_2`, label: N.aggr_2, type: 'small',
      element: elKey, branch: `${elKey}_aggressive`,
      x: NX + RIGHT[1].x, y: NY + RIGHT[1].y, cost: SHARD_COSTS.small,
      stat: S.aggr_stat, val: 4, requires: [`${elKey}_aggr_1`],
      desc: S.aggr_2_desc },
    { id: `${elKey}_aggr_3`, label: N.aggr_3, type: 'notable',
      battleType: 'passive',
      element: elKey, branch: `${elKey}_aggressive`,
      x: NX + RIGHT[2].x, y: NY + RIGHT[2].y, cost: SHARD_COSTS.notable,
      procChance: 0.15, procEffect: S.proc_aggr_effect,
      procDuration: S.proc_aggr_dur, procStacks: S.proc_aggr_stacks,
      requires: [`${elKey}_aggr_2`],
      desc: S.aggr_3_desc },
    { id: `${elKey}_aggr_4`, label: N.aggr_4, type: 'small',
      element: elKey, branch: `${elKey}_aggressive`,
      x: NX + RIGHT[3].x, y: NY + RIGHT[3].y, cost: SHARD_COSTS.small,
      stat: S.aggr_4_stat, val: 10, requires: [`${elKey}_aggr_3`],
      desc: S.aggr_4_desc },
    { id: `${elKey}_aggr_5`, label: N.aggr_5, type: 'small',
      element: elKey, branch: `${elKey}_aggressive`,
      x: NX + RIGHT[4].x, y: NY + RIGHT[4].y, cost: SHARD_COSTS.small,
      stat: S.aggr_5_stat, val: 2, requires: [`${elKey}_aggr_4`],
      desc: S.aggr_5_desc },
    { id: `${elKey}_aggr_ks`, label: N.aggr_ks, type: 'keystone',
      battleType: 'active',
      element: elKey, branch: `${elKey}_aggressive`,
      x: NX + RIGHT[5].x, y: NY + RIGHT[5].y, cost: SHARD_COSTS.active,
      fn: S.fn_aggr,
      requires: [`${elKey}_aggr_5`],
      desc: S.aggr_ks_desc },

    // ── LEFT BRANCH (Defensive) — chains from root ──────────
    { id: `${elKey}_def_1`, label: N.def_1, type: 'small',
      element: elKey, branch: `${elKey}_defensive`,
      x: NX + LEFT[0].x, y: NY + LEFT[0].y, cost: SHARD_COSTS.small,
      stat: S.def_stat, val: 5, requires: [`${elKey}_root`],
      desc: S.def_1_desc },
    { id: `${elKey}_def_2`, label: N.def_2, type: 'small',
      element: elKey, branch: `${elKey}_defensive`,
      x: NX + LEFT[1].x, y: NY + LEFT[1].y, cost: SHARD_COSTS.small,
      stat: S.def_stat, val: 5, requires: [`${elKey}_def_1`],
      desc: S.def_2_desc },
    { id: `${elKey}_def_3`, label: N.def_3, type: 'notable',
      battleType: 'passive',
      element: elKey, branch: `${elKey}_defensive`,
      x: NX + LEFT[2].x, y: NY + LEFT[2].y, cost: SHARD_COSTS.notable,
      stat: S.def_3_stat, val: 25, requires: [`${elKey}_def_2`],
      desc: S.def_3_desc },
    { id: `${elKey}_def_4`, label: N.def_4, type: 'small',
      element: elKey, branch: `${elKey}_defensive`,
      x: NX + LEFT[3].x, y: NY + LEFT[3].y, cost: SHARD_COSTS.small,
      stat: S.def_4_stat, val: 8, requires: [`${elKey}_def_3`],
      desc: S.def_4_desc },
    { id: `${elKey}_def_5`, label: N.def_5, type: 'small',
      element: elKey, branch: `${elKey}_defensive`,
      x: NX + LEFT[4].x, y: NY + LEFT[4].y, cost: SHARD_COSTS.small,
      stat: S.def_5_stat, val: 3, requires: [`${elKey}_def_4`],
      desc: S.def_5_desc },
    { id: `${elKey}_def_ks`, label: N.def_ks, type: 'keystone',
      battleType: 'active',
      element: elKey, branch: `${elKey}_defensive`,
      x: NX + LEFT[5].x, y: NY + LEFT[5].y, cost: SHARD_COSTS.active,
      fn: S.fn_def,
      requires: [`${elKey}_def_5`],
      desc: S.def_ks_desc },

    // ── DOWN BRANCH (Utility) — chains from root ────────────
    { id: `${elKey}_util_1`, label: N.util_1, type: 'small',
      element: elKey, branch: `${elKey}_utility`,
      x: NX + DOWN[0].x, y: NY + DOWN[0].y, cost: SHARD_COSTS.small,
      stat: 'crit_chance_pct', val: 3, requires: [`${elKey}_root`],
      desc: S.util_1_desc },
    { id: `${elKey}_util_2`, label: N.util_2, type: 'small',
      element: elKey, branch: `${elKey}_utility`,
      x: NX + DOWN[1].x, y: NY + DOWN[1].y, cost: SHARD_COSTS.small,
      stat: 'crit_dmg_pct', val: 8, requires: [`${elKey}_util_1`],
      desc: S.util_2_desc },
    { id: `${elKey}_util_3`, label: N.util_3, type: 'notable',
      battleType: 'passive',
      element: elKey, branch: `${elKey}_utility`,
      x: NX + DOWN[2].x, y: NY + DOWN[2].y, cost: SHARD_COSTS.notable,
      procChance: 0.20, procEffect: S.proc_util_effect,
      procDuration: S.proc_util_dur,
      requires: [`${elKey}_util_2`],
      desc: S.util_3_desc },
    { id: `${elKey}_util_4`, label: N.util_4, type: 'small',
      element: elKey, branch: `${elKey}_utility`,
      x: NX + DOWN[3].x, y: NY + DOWN[3].y, cost: SHARD_COSTS.small,
      stat: S.util_4_stat || 'mp_max_bonus', val: (S.util_4_val != null ? S.util_4_val : 5), requires: [`${elKey}_util_3`],
      desc: S.util_4_desc },
    { id: `${elKey}_util_5`, label: N.util_5, type: 'small',
      element: elKey, branch: `${elKey}_utility`,
      x: NX + DOWN[4].x, y: NY + DOWN[4].y, cost: SHARD_COSTS.small,
      stat: S.util_5_stat || 'mp_regen_combat', val: (S.util_5_val != null ? S.util_5_val : 2), requires: [`${elKey}_util_4`],
      desc: S.util_5_desc },
    { id: `${elKey}_util_ks`, label: N.util_ks, type: 'keystone',
      battleType: 'active',
      element: elKey, branch: `${elKey}_utility`,
      x: NX + DOWN[5].x, y: NY + DOWN[5].y, cost: SHARD_COSTS.active,
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
    util_4_stat:'atk_bonus', util_4_val:4,
    util_4_desc:'+4 ATK. (Long Wick — the fire burns hotter.)',
    util_5_stat:'cooldown_reduction', util_5_val:1,
    util_5_desc:'Your skill cooldowns recharge faster. (Cold Match — strike again sooner.)',
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
    util_4_stat:'hp_bonus', util_4_val:25,
    util_4_desc:'+25 max HP. (Deep Well — water endures.)',
    util_5_stat:'cooldown_reduction', util_5_val:1,
    util_5_desc:'Your skill cooldowns recharge faster. (Sky Cup — the tide returns quicker.)',
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
               nodes:
               [
                 { id:'lightning_root', label:'First Spark', type:'start', element:'lightning', branch:'lightning_root',
                   x:0, y:0, cost:0, requires:[],
                   desc:'The first jolt that woke something up. Spend a Resonance Shard at any adjacent node to begin.' },

                 // ── Aggressive branch (chain / second strike) ──
                 { id:'lightning_aggr_1', label:'Live Wire', type:'small', element:'lightning', branch:'lightning_aggressive',
                   x:85, y:-85, cost:1, stat:'lightning_damage_pct', val:3, requires:['lightning_root'],
                   desc:'+3% damage on lightning-tagged attacks. Attuned: +6%.' },
                 { id:'lightning_aggr_2', label:'Arc Flash', type:'small', element:'lightning', branch:'lightning_aggressive',
                   x:170, y:-170, cost:1, stat:'lightning_damage_pct', val:4, requires:['lightning_aggr_1'],
                   desc:'+4% damage on lightning-tagged attacks. Attuned: +8%.' },
                 { id:'lightning_aggr_3', label:'Second Strike', type:'notable', element:'lightning', branch:'lightning_aggressive',
                   x:255, y:-255, cost:2, requires:['lightning_aggr_2'],
                   desc:'15% chance on attack to immediately strike a second time for 50% damage. Attuned: 30% chance.' },
                 { id:'lightning_aggr_4', label:'Overcharge', type:'small', element:'lightning', branch:'lightning_aggressive',
                   x:340, y:-340, cost:1, stat:'second_strike_dmg_pct', val:10, requires:['lightning_aggr_3'],
                   desc:'+10% Second Strike damage. Attuned: +20%.' },
                 { id:'lightning_aggr_5', label:'Cascade', type:'small', element:'lightning', branch:'lightning_aggressive',
                   x:425, y:-425, cost:1, stat:'second_strike_chance_pct', val:5, requires:['lightning_aggr_4'],
                   desc:'+5% Second Strike chance. Attuned: +10%.' },
                 { id:'lightning_aggr_ks', label:'Chain Lightning', type:'keystone', element:'lightning', branch:'lightning_aggressive',
                   x:510, y:-510, cost:3, requires:['lightning_aggr_5'],
                   desc:'Active: your next attack chains 3 times, each hit 60% of the last. Cooldown 2 turns. Attuned: 4 chains.' },

                 // ── Defensive branch (static / stun) ──
                 { id:'lightning_def_1', label:'Insulation', type:'small', element:'lightning', branch:'lightning_defensive',
                   x:-85, y:-85, cost:1, stat:'lightning_resist_pct', val:5, requires:['lightning_root'],
                   desc:'+5% lightning resistance.' },
                 { id:'lightning_def_2', label:'Grounding', type:'small', element:'lightning', branch:'lightning_defensive',
                   x:-170, y:-170, cost:1, stat:'lightning_resist_pct', val:5, requires:['lightning_def_1'],
                   desc:'+5% lightning resistance. Immune to your own static.' },
                 { id:'lightning_def_3', label:'Static Field', type:'notable', element:'lightning', branch:'lightning_defensive',
                   x:-255, y:-255, cost:2, stat:'static_stun_chance', val:15, requires:['lightning_def_2'],
                   desc:'When hit, 15% chance to stun the attacker next turn. Attuned: 30%.' },
                 { id:'lightning_def_4', label:'Charged Skin', type:'small', element:'lightning', branch:'lightning_defensive',
                   x:-340, y:-340, cost:1, stat:'lightning_reflect_pct', val:8, requires:['lightning_def_3'],
                   desc:'Attackers take 8% of their melee damage back as static. Attuned: 16%.' },
                 { id:'lightning_def_5', label:'Capacitor', type:'small', element:'lightning', branch:'lightning_defensive',
                   x:-425, y:-425, cost:1, stat:'mp_per_hit_taken', val:2, requires:['lightning_def_4'],
                   desc:'Gain 2 MP each time you are hit. Attuned: 4 MP.' },
                 { id:'lightning_def_ks', label:'Storm Ward', type:'keystone', element:'lightning', branch:'lightning_defensive',
                   x:-510, y:-510, cost:3, requires:['lightning_def_5'],
                   desc:'Active: for 2 turns, take half damage from ALL sources and stun any melee attacker. Cooldown 3 turns.' },

                 // ── Utility branch (speed / initiative) ──
                 { id:'lightning_util_1', label:'Quickening', type:'small', element:'lightning', branch:'lightning_utility',
                   x:0, y:110, cost:1, stat:'speed_bonus', val:3, requires:['lightning_root'],
                   desc:'+3 Speed.' },
                 { id:'lightning_util_2', label:'Reflexes', type:'small', element:'lightning', branch:'lightning_utility',
                   x:0, y:220, cost:1, stat:'crit_chance_pct', val:3, requires:['lightning_util_1'],
                   desc:'+3% critical hit chance.' },
                 { id:'lightning_util_3', label:'First Mover', type:'notable', element:'lightning', branch:'lightning_utility',
                   x:0, y:330, cost:2, stat:'always_first_chance', val:25, requires:['lightning_util_2'],
                   desc:'25% chance to act first regardless of Speed. Attuned: 50%.' },
                 { id:'lightning_util_4', label:'Conductor', type:'small', element:'lightning', branch:'lightning_utility',
                   x:0, y:440, cost:1, stat:'cooldown_reduction', val:1, requires:['lightning_util_3'],
                   desc:'Your skill cooldowns recharge faster (stacks with other recharge nodes).' },
                 { id:'lightning_util_5', label:'Momentum', type:'small', element:'lightning', branch:'lightning_utility',
                   x:0, y:550, cost:1, stat:'crit_dmg_pct', val:8, requires:['lightning_util_4'],
                   desc:'+8% critical hit damage.' },
                 { id:'lightning_util_ks', label:'Time Skip', type:'keystone', element:'lightning', branch:'lightning_utility',
                   x:0, y:660, cost:3, requires:['lightning_util_5'],
                   desc:'Active: take an extra turn immediately. Cooldown 3 turns. Attuned: also refunds 50% MP spent.' },
               ] },
  arcane:    { key:'arcane',    label:'Lux',    sigil:'✨', color:'#b06eff',
               bossKey:'zone_boss_arcane',
               signature:'reverberation', signatureLabel:'Reverberation',
               nodes:
               [
                 { id:'arcane_root', label:'First Word', type:'start', element:'arcane', branch:'arcane_root',
                   x:0, y:0, cost:0, requires:[],
                   desc:'The first symbol that meant something. Spend a Resonance Shard at any adjacent node to begin.' },

                 // ── Aggressive branch (echo / amplify) ──
                 { id:'arcane_aggr_1', label:'Resonant Bolt', type:'small', element:'arcane', branch:'arcane_aggressive',
                   x:85, y:-85, cost:1, stat:'arcane_damage_pct', val:3, requires:['arcane_root'],
                   desc:'+3% damage on Lux-tagged attacks. Attuned: +6%.' },
                 { id:'arcane_aggr_2', label:'Harmonic', type:'small', element:'arcane', branch:'arcane_aggressive',
                   x:170, y:-170, cost:1, stat:'arcane_damage_pct', val:4, requires:['arcane_aggr_1'],
                   desc:'+4% damage on Lux-tagged attacks. Attuned: +8%.' },
                 { id:'arcane_aggr_3', label:'Reverberation', type:'notable', element:'arcane', branch:'arcane_aggressive',
                   x:255, y:-255, cost:2, requires:['arcane_aggr_2'],
                   desc:'Lux skills echo: 15% chance to fire a second time at 50% power. Stacks the echo up to 3 times. Attuned: 30% chance.' },
                 { id:'arcane_aggr_4', label:'Amplitude', type:'small', element:'arcane', branch:'arcane_aggressive',
                   x:340, y:-340, cost:1, stat:'reverberation_dmg_pct', val:10, requires:['arcane_aggr_3'],
                   desc:'+10% echo damage. Attuned: +20%.' },
                 { id:'arcane_aggr_5', label:'Sustain', type:'small', element:'arcane', branch:'arcane_aggressive',
                   x:425, y:-425, cost:1, stat:'reverberation_chance_pct', val:5, requires:['arcane_aggr_4'],
                   desc:'+5% echo chance. Attuned: +10%.' },
                 { id:'arcane_aggr_ks', label:'Standing Wave', type:'keystone', element:'arcane', branch:'arcane_aggressive',
                   x:510, y:-510, cost:3, requires:['arcane_aggr_5'],
                   desc:'Active: your next Lux skill echoes 3 guaranteed times at full power. Cooldown 3 turns. Attuned: also ignores enemy DEF.' },

                 // ── Defensive branch (barrier / mana) ──
                 { id:'arcane_def_1', label:'Ward Sense', type:'small', element:'arcane', branch:'arcane_defensive',
                   x:-85, y:-85, cost:1, stat:'arcane_resist_pct', val:5, requires:['arcane_root'],
                   desc:'+5% Lux resistance.' },
                 { id:'arcane_def_2', label:'Mana Skin', type:'small', element:'arcane', branch:'arcane_defensive',
                   x:-170, y:-170, cost:1, stat:'arcane_resist_pct', val:5, requires:['arcane_def_1'],
                   desc:'+5% Lux resistance.' },
                 { id:'arcane_def_3', label:'Mirror Ward', type:'notable', element:'arcane', branch:'arcane_defensive',
                   x:-255, y:-255, cost:2, stat:'arcane_reflect_pct', val:12, requires:['arcane_def_2'],
                   desc:'Reflect 12% of magical damage taken back at the caster. Attuned: 24%.' },
                 { id:'arcane_def_4', label:'Absorption', type:'small', element:'arcane', branch:'arcane_defensive',
                   x:-340, y:-340, cost:1, stat:'dmg_to_mp_pct', val:15, requires:['arcane_def_3'],
                   desc:'15% of damage taken refills MP instead. Attuned: 30%.' },
                 { id:'arcane_def_5', label:'Mana Bastion', type:'small', element:'arcane', branch:'arcane_defensive',
                   x:-425, y:-425, cost:1, stat:'def_bonus', val:4, requires:['arcane_def_4'],
                   desc:'+4 DEF.' },
                 { id:'arcane_def_ks', label:'Aegis', type:'keystone', element:'arcane', branch:'arcane_defensive',
                   x:-510, y:-510, cost:3, requires:['arcane_def_5'],
                   desc:'Active: for 2 turns, take half damage from ALL sources and convert 50% of damage taken into MP. Cooldown 3 turns.' },

                 // ── Utility branch (foresight / precision) ──
                 { id:'arcane_util_1', label:'Insight', type:'small', element:'arcane', branch:'arcane_utility',
                   x:0, y:110, cost:1, stat:'crit_chance_pct', val:3, requires:['arcane_root'],
                   desc:'+3% critical hit chance.' },
                 { id:'arcane_util_2', label:'Focus', type:'small', element:'arcane', branch:'arcane_utility',
                   x:0, y:220, cost:1, stat:'crit_dmg_pct', val:8, requires:['arcane_util_1'],
                   desc:'+8% critical hit damage.' },
                 { id:'arcane_util_3', label:'Foresight', type:'notable', element:'arcane', branch:'arcane_utility',
                   x:0, y:330, cost:2, stat:'foresight_reduce_pct', val:20, requires:['arcane_util_2'],
                   desc:'20% chance to foresee an attack and take 50% less from it. Attuned: 40% chance.' },
                 { id:'arcane_util_4', label:'Channeling', type:'small', element:'arcane', branch:'arcane_utility',
                   x:0, y:440, cost:1, stat:'cooldown_reduction', val:1, requires:['arcane_util_3'],
                   desc:'Your skill cooldowns recharge faster (stacks with other recharge nodes).' },
                 { id:'arcane_util_5', label:'Clarity', type:'small', element:'arcane', branch:'arcane_utility',
                   x:0, y:550, cost:1, stat:'cooldown_reduction', val:1, requires:['arcane_util_4'],
                   desc:'Your skill cooldowns recharge faster (stacks with other recharge nodes).' },
                 { id:'arcane_util_ks', label:'Perfect Recall', type:'keystone', element:'arcane', branch:'arcane_utility',
                   x:0, y:660, cost:3, requires:['arcane_util_5'],
                   desc:'Active: the next skill you cast costs 0 MP and cannot miss or be resisted. Cooldown 3 turns.' },
               ] },
  shadow:    { key:'shadow',    label:'Umbra',  sigil:'🌑', color:'#9a6fd8',
               bossKey:'zone_boss_shadow',
               signature:'unseen',        signatureLabel:'Unseen',
               nodes:
               [
                 { id:'shadow_root', label:'First Dark', type:'start', element:'shadow', branch:'shadow_root',
                   x:0, y:0, cost:0, requires:[],
                   desc:'The first time no one saw you leave. Spend a Resonance Shard at any adjacent node to begin.' },

                 // ── Aggressive branch (ambush / strike from concealment) ──
                 { id:'shadow_aggr_1', label:'Cutpurse', type:'small', element:'shadow', branch:'shadow_aggressive',
                   x:85, y:-85, cost:1, stat:'shadow_damage_pct', val:3, requires:['shadow_root'],
                   desc:'+3% damage on shadow-tagged attacks. Attuned: +6%.' },
                 { id:'shadow_aggr_2', label:'Backstab', type:'small', element:'shadow', branch:'shadow_aggressive',
                   x:170, y:-170, cost:1, stat:'shadow_damage_pct', val:4, requires:['shadow_aggr_1'],
                   desc:'+4% damage on shadow-tagged attacks. Attuned: +8%.' },
                 { id:'shadow_aggr_3', label:'Unseen', type:'notable', element:'shadow', branch:'shadow_aggressive',
                   x:255, y:-255, cost:2, requires:['shadow_aggr_2'],
                   desc:'15% chance on attack to slip Unseen — gaining a stealth stack. Stacks to 3. Each stack adds bonus damage to your next strike. Attuned: 30% chance.' },
                 { id:'shadow_aggr_4', label:'Killing Edge', type:'small', element:'shadow', branch:'shadow_aggressive',
                   x:340, y:-340, cost:1, stat:'unseen_dmg_pct', val:12, requires:['shadow_aggr_3'],
                   desc:'+12% damage per Unseen stack spent. Attuned: +24%.' },
                 { id:'shadow_aggr_5', label:'Vanishing Act', type:'small', element:'shadow', branch:'shadow_aggressive',
                   x:425, y:-425, cost:1, stat:'unseen_max_stacks', val:2, requires:['shadow_aggr_4'],
                   desc:'+2 max Unseen stacks. Attuned: +4.' },
                 { id:'shadow_aggr_ks', label:'Death Mark', type:'keystone', element:'shadow', branch:'shadow_aggressive',
                   x:510, y:-510, cost:3, requires:['shadow_aggr_5'],
                   desc:'Active: spend all Unseen stacks for a guaranteed crit dealing 40% bonus damage per stack. Cooldown 2 turns. Attuned: also ignores DEF.' },

                 // ── Defensive branch (evasion / misdirection) ──
                 { id:'shadow_def_1', label:'Soft Step', type:'small', element:'shadow', branch:'shadow_defensive',
                   x:-85, y:-85, cost:1, stat:'shadow_resist_pct', val:5, requires:['shadow_root'],
                   desc:'+5% shadow resistance.' },
                 { id:'shadow_def_2', label:'Smoke', type:'small', element:'shadow', branch:'shadow_defensive',
                   x:-170, y:-170, cost:1, stat:'shadow_resist_pct', val:5, requires:['shadow_def_1'],
                   desc:'+5% shadow resistance.' },
                 { id:'shadow_def_3', label:'Misdirection', type:'notable', element:'shadow', branch:'shadow_defensive',
                   x:-255, y:-255, cost:2, stat:'dodge_chance_pct', val:12, requires:['shadow_def_2'],
                   desc:'+12% chance to fully dodge an attack. Attuned: +24%.' },
                 { id:'shadow_def_4', label:'Spite', type:'small', element:'shadow', branch:'shadow_defensive',
                   x:-340, y:-340, cost:1, stat:'shadow_reflect_pct', val:8, requires:['shadow_def_3'],
                   desc:'Attackers take 8% of their damage back from the dark. Attuned: 16%.' },
                 { id:'shadow_def_5', label:'Nightmend', type:'small', element:'shadow', branch:'shadow_defensive',
                   x:-425, y:-425, cost:1, stat:'hp_on_dodge', val:5, requires:['shadow_def_4'],
                   desc:'Heal 5 HP whenever you dodge. Attuned: 10 HP.' },
                 { id:'shadow_def_ks', label:'Nightshade', type:'keystone', element:'shadow', branch:'shadow_defensive',
                   x:-510, y:-510, cost:3, requires:['shadow_def_5'],
                   desc:'Active: for 2 turns, take half damage from ALL sources and gain +50% dodge. Cooldown 3 turns.' },

                 // ── Utility branch (speed / first-strike / crit) ──
                 { id:'shadow_util_1', label:'Lightfoot', type:'small', element:'shadow', branch:'shadow_utility',
                   x:0, y:110, cost:1, stat:'speed_bonus', val:3, requires:['shadow_root'],
                   desc:'+3 Speed.' },
                 { id:'shadow_util_2', label:'Keen Eye', type:'small', element:'shadow', branch:'shadow_utility',
                   x:0, y:220, cost:1, stat:'crit_chance_pct', val:3, requires:['shadow_util_1'],
                   desc:'+3% critical hit chance.' },
                 { id:'shadow_util_3', label:'First Blood', type:'notable', element:'shadow', branch:'shadow_utility',
                   x:0, y:330, cost:2, stat:'always_first_chance', val:25, requires:['shadow_util_2'],
                   desc:'25% chance to act first regardless of Speed. Attuned: 50%.' },
                 { id:'shadow_util_4', label:'Cruel Edge', type:'small', element:'shadow', branch:'shadow_utility',
                   x:0, y:440, cost:1, stat:'crit_dmg_pct', val:10, requires:['shadow_util_3'],
                   desc:'+10% critical hit damage.' },
                 { id:'shadow_util_5', label:'Quick Hands', type:'small', element:'shadow', branch:'shadow_utility',
                   x:0, y:550, cost:1, stat:'cooldown_reduction', val:1, requires:['shadow_util_4'],
                   desc:'Your skill cooldowns recharge faster.' },
                 { id:'shadow_util_ks', label:'No Witnesses', type:'keystone', element:'shadow', branch:'shadow_utility',
                   x:0, y:660, cost:3, requires:['shadow_util_5'],
                   desc:'Active: become untargetable for 1 turn, then your next attack is a guaranteed crit. Cooldown 3 turns.' },
               ] },
  earth:     { key:'earth',     label:'Terra',  sigil:'🪨', color:'#8b5e3c',
               bossKey:'zone_boss_earth',
               signature:'stoneborn',     signatureLabel:'Stoneborn',
               nodes:
               [
                 { id:'earth_root', label:'First Stone', type:'start', element:'earth', branch:'earth_root',
                   x:0, y:0, cost:0, requires:[],
                   desc:'The first weight that would not move. Spend a Resonance Shard at any adjacent node to begin.' },

                 // ── Aggressive branch (crushing / heavy blows) ──
                 { id:'earth_aggr_1', label:'Heavy Hand', type:'small', element:'earth', branch:'earth_aggressive',
                   x:85, y:-85, cost:1, stat:'earth_damage_pct', val:3, requires:['earth_root'],
                   desc:'+3% damage on earth-tagged attacks. Attuned: +6%.' },
                 { id:'earth_aggr_2', label:'Crushing Blow', type:'small', element:'earth', branch:'earth_aggressive',
                   x:170, y:-170, cost:1, stat:'earth_damage_pct', val:4, requires:['earth_aggr_1'],
                   desc:'+4% damage on earth-tagged attacks. Attuned: +8%.' },
                 { id:'earth_aggr_3', label:'Fault Line', type:'notable', element:'earth', branch:'earth_aggressive',
                   x:255, y:-255, cost:2, requires:['earth_aggr_2'],
                   desc:'Your attacks ignore a portion of enemy DEF equal to 15% per Stoneborn stack. Attuned: 30%.' },
                 { id:'earth_aggr_4', label:'Tremor', type:'small', element:'earth', branch:'earth_aggressive',
                   x:340, y:-340, cost:1, stat:'guard_damage_pct', val:30, requires:['earth_aggr_3'],
                   desc:'Your attacks deal +30% of your DEF as bonus damage. Attuned: +60%.' },
                 { id:'earth_aggr_5', label:'Landslide', type:'small', element:'earth', branch:'earth_aggressive',
                   x:425, y:-425, cost:1, stat:'stun_chance_pct', val:10, requires:['earth_aggr_4'],
                   desc:'+10% chance on attack to stun the enemy. Attuned: +20%.' },
                 { id:'earth_aggr_ks', label:'Avalanche', type:'keystone', element:'earth', branch:'earth_aggressive',
                   x:510, y:-510, cost:3, requires:['earth_aggr_5'],
                   desc:'Active: deal damage equal to 200% of your DEF and stun the enemy 1 turn. Cooldown 2 turns. Attuned: 300% DEF.' },

                 // ── Defensive branch (Stoneborn armor) ──
                 { id:'earth_def_1', label:'Thick Hide', type:'small', element:'earth', branch:'earth_defensive',
                   x:-85, y:-85, cost:1, stat:'earth_resist_pct', val:5, requires:['earth_root'],
                   desc:'+5% earth resistance.' },
                 { id:'earth_def_2', label:'Bedrock', type:'small', element:'earth', branch:'earth_defensive',
                   x:-170, y:-170, cost:1, stat:'def_bonus', val:6, requires:['earth_def_1'],
                   desc:'+6 DEF.' },
                 { id:'earth_def_3', label:'Stoneborn', type:'notable', element:'earth', branch:'earth_defensive',
                   x:-255, y:-255, cost:2, requires:['earth_def_2'],
                   desc:'Each turn you Defend, gain a Stoneborn stack (max 3). Each stack reduces incoming damage by 8%. Attuned: 16% per stack.' },
                 { id:'earth_def_4', label:'Aftershock', type:'small', element:'earth', branch:'earth_defensive',
                   x:-340, y:-340, cost:1, stat:'earth_reflect_pct', val:10, requires:['earth_def_3'],
                   desc:'Attackers take 10% of their damage back as crushing force. Attuned: 20%.' },
                 { id:'earth_def_5', label:'Mountainheart', type:'small', element:'earth', branch:'earth_defensive',
                   x:-425, y:-425, cost:1, stat:'hp_bonus', val:30, requires:['earth_def_4'],
                   desc:'+30 max HP.' },
                 { id:'earth_def_ks', label:'Bastion', type:'keystone', element:'earth', branch:'earth_defensive',
                   x:-510, y:-510, cost:3, requires:['earth_def_5'],
                   desc:'Active: for 2 turns, take half damage from ALL sources and gain 3 Stoneborn stacks. Cooldown 3 turns.' },

                 // ── Utility branch (endurance / regen) ──
                 { id:'earth_util_1', label:'Steady', type:'small', element:'earth', branch:'earth_utility',
                   x:0, y:110, cost:1, stat:'guard_bonus', val:4, requires:['earth_root'],
                   desc:'+4 Guard.' },
                 { id:'earth_util_2', label:'Rooted', type:'small', element:'earth', branch:'earth_utility',
                   x:0, y:220, cost:1, stat:'stun_immunity', val:1, requires:['earth_util_1'],
                   desc:'Cannot be stunned or knocked back.' },
                 { id:'earth_util_3', label:'Living Stone', type:'notable', element:'earth', branch:'earth_utility',
                   x:0, y:330, cost:2, stat:'hp_regen_combat', val:4, requires:['earth_util_2'],
                   desc:'Regenerate 4 HP each turn. Attuned: 8 HP.' },
                 { id:'earth_util_4', label:'Endurance', type:'small', element:'earth', branch:'earth_utility',
                   x:0, y:440, cost:1, stat:'hp_bonus', val:30, requires:['earth_util_3'],
                   desc:'+30 max HP.' },
                 { id:'earth_util_5', label:'Weathered', type:'small', element:'earth', branch:'earth_utility',
                   x:0, y:550, cost:1, stat:'def_bonus', val:6, requires:['earth_util_4'],
                   desc:'+6 DEF.' },
                 { id:'earth_util_ks', label:'Worldspine', type:'keystone', element:'earth', branch:'earth_utility',
                   x:0, y:660, cost:3, requires:['earth_util_5'],
                   desc:'Active: heal 25% max HP and cleanse all debuffs. Cooldown 3 turns. Attuned: also gain 2 Stoneborn stacks.' },
               ] },
  wind:      { key:'wind',      label:'Aero',   sigil:'💨', color:'#a8d8ea',
               bossKey:'zone_boss_wind',
               signature:'held_breath',   signatureLabel:'Held Breath',
               nodes: 
               [
                 { id:'wind_root', label:'First Breath', type:'start', element:'wind', branch:'wind_root',
                   x:0, y:0, cost:0, requires:[],
                   desc:'The first gust that pulled you forward. Spend a Resonance Shard at any adjacent node to begin.' },
                 { id:'wind_aggr_1', label:'Cutting Gale', type:'small', element:'wind', branch:'wind_aggressive',
                   x:85, y:-85, cost:1, stat:'wind_damage_pct', val:3, requires:['wind_root'],
                   desc:'+3% damage on wind-tagged attacks. Attuned: +6%.' },
                 { id:'wind_aggr_2', label:'Slipstream', type:'small', element:'wind', branch:'wind_aggressive',
                   x:170, y:-170, cost:1, stat:'wind_damage_pct', val:4, requires:['wind_aggr_1'],
                   desc:'+4% damage on wind-tagged attacks. Attuned: +8%.' },
                 { id:'wind_aggr_3', label:'Held Breath', type:'notable', element:'wind', branch:'wind_aggressive',
                   x:255, y:-255, cost:2, requires:['wind_aggr_2'],
                   desc:'Each turn you do not attack, gain a Held Breath stack (max 3). Your next attack spends them for +25% damage each. Attuned: +50%.' },
                 { id:'wind_aggr_4', label:'Release', type:'small', element:'wind', branch:'wind_aggressive',
                   x:340, y:-340, cost:1, stat:'held_breath_dmg_pct', val:10, requires:['wind_aggr_3'],
                   desc:'+10% damage per Held Breath stack spent. Attuned: +20%.' },
                 { id:'wind_aggr_5', label:'Updraft', type:'small', element:'wind', branch:'wind_aggressive',
                   x:425, y:-425, cost:1, stat:'crit_chance_pct', val:4, requires:['wind_aggr_4'],
                   desc:'+4% critical hit chance.' },
                 { id:'wind_aggr_ks', label:'Cyclone', type:'keystone', element:'wind', branch:'wind_aggressive',
                   x:510, y:-510, cost:3, requires:['wind_aggr_5'],
                   desc:'Active: strike 3 times for 50% ATK each, ignoring DEF. Cooldown 2 turns. Attuned: 4 strikes.' },
                 { id:'wind_def_1', label:'Light Frame', type:'small', element:'wind', branch:'wind_defensive',
                   x:-85, y:-85, cost:1, stat:'wind_resist_pct', val:5, requires:['wind_root'],
                   desc:'+5% wind resistance.' },
                 { id:'wind_def_2', label:'Drift', type:'small', element:'wind', branch:'wind_defensive',
                   x:-170, y:-170, cost:1, stat:'dodge_chance_pct', val:6, requires:['wind_def_1'],
                   desc:'+6% chance to dodge an attack. Attuned: +12%.' },
                 { id:'wind_def_3', label:'Tailwind', type:'notable', element:'wind', branch:'wind_defensive',
                   x:-255, y:-255, cost:2, stat:'dodge_chance_pct', val:12, requires:['wind_def_2'],
                   desc:'+12% dodge. On dodge, your next attack deals double. Attuned: +24% dodge.' },
                 { id:'wind_def_4', label:'Backwash', type:'small', element:'wind', branch:'wind_defensive',
                   x:-340, y:-340, cost:1, stat:'wind_reflect_pct', val:8, requires:['wind_def_3'],
                   desc:'Attackers take 8% of their damage back on the wind. Attuned: 16%.' },
                 { id:'wind_def_5', label:'Float', type:'small', element:'wind', branch:'wind_defensive',
                   x:-425, y:-425, cost:1, stat:'hp_on_dodge', val:5, requires:['wind_def_4'],
                   desc:'Heal 5 HP whenever you dodge. Attuned: 10 HP.' },
                 { id:'wind_def_ks', label:'Eye of the Storm', type:'keystone', element:'wind', branch:'wind_defensive',
                   x:-510, y:-510, cost:3, requires:['wind_def_5'],
                   desc:'Active: for 2 turns, take half damage from ALL sources and gain +50% dodge. Cooldown 3 turns.' },
                 { id:'wind_util_1', label:'Fleet', type:'small', element:'wind', branch:'wind_utility',
                   x:0, y:110, cost:1, stat:'speed_bonus', val:4, requires:['wind_root'],
                   desc:'+4 Speed.' },
                 { id:'wind_util_2', label:'Gust Step', type:'small', element:'wind', branch:'wind_utility',
                   x:0, y:220, cost:1, stat:'speed_bonus', val:4, requires:['wind_util_1'],
                   desc:'+4 Speed.' },
                 { id:'wind_util_3', label:'First Wind', type:'notable', element:'wind', branch:'wind_utility',
                   x:0, y:330, cost:2, stat:'always_first_chance', val:35, requires:['wind_util_2'],
                   desc:'35% chance to act first regardless of Speed. Attuned: 70%.' },
                 { id:'wind_util_4', label:'Second Wind', type:'small', element:'wind', branch:'wind_utility',
                   x:0, y:440, cost:1, stat:'cooldown_reduction', val:1, requires:['wind_util_3'],
                   desc:'Your skill cooldowns recharge faster.' },
                 { id:'wind_util_5', label:'Tempo', type:'small', element:'wind', branch:'wind_utility',
                   x:0, y:550, cost:1, stat:'crit_dmg_pct', val:10, requires:['wind_util_4'],
                   desc:'+10% critical hit damage.' },
                 { id:'wind_util_ks', label:'Hurricane', type:'keystone', element:'wind', branch:'wind_utility',
                   x:0, y:660, cost:3, requires:['wind_util_5'],
                   desc:'Active: take an extra turn immediately. Cooldown 3 turns. Attuned: also gain +50% dodge for 1 turn.' },
               ] },
  plant:     { key:'plant',     label:'Flora',  sigil:'🌿', color:'#66bb6a',
               bossKey:'zone_boss_plant',
               signature:'slow_bloom',    signatureLabel:'Slow Bloom',
               nodes: 
               [
                 { id:'plant_root', label:'First Seed', type:'start', element:'plant', branch:'plant_root',
                   x:0, y:0, cost:0, requires:[],
                   desc:'The first green thing that grew where it should not. Spend a Resonance Shard at any adjacent node to begin.' },
                 { id:'plant_aggr_1', label:'Thorn', type:'small', element:'plant', branch:'plant_aggressive',
                   x:85, y:-85, cost:1, stat:'plant_damage_pct', val:3, requires:['plant_root'],
                   desc:'+3% damage on plant-tagged attacks. Attuned: +6%.' },
                 { id:'plant_aggr_2', label:'Barbed Vine', type:'small', element:'plant', branch:'plant_aggressive',
                   x:170, y:-170, cost:1, stat:'plant_damage_pct', val:4, requires:['plant_aggr_1'],
                   desc:'+4% damage on plant-tagged attacks. Attuned: +8%.' },
                 { id:'plant_aggr_3', label:'Slow Bloom', type:'notable', element:'plant', branch:'plant_aggressive',
                   x:255, y:-255, cost:2, requires:['plant_aggr_2'],
                   desc:'Each turn, your attacks grow stronger: +5% damage per turn elapsed this battle (max +50%). Attuned: +10% per turn.' },
                 { id:'plant_aggr_4', label:'Overgrow', type:'small', element:'plant', branch:'plant_aggressive',
                   x:340, y:-340, cost:1, stat:'slow_bloom_cap_pct', val:25, requires:['plant_aggr_3'],
                   desc:'+25% to the Slow Bloom damage cap. Attuned: +50%.' },
                 { id:'plant_aggr_5', label:'Lifesteal', type:'small', element:'plant', branch:'plant_aggressive',
                   x:425, y:-425, cost:1, stat:'lifesteal_pct', val:10, requires:['plant_aggr_4'],
                   desc:'Heal for 10% of damage you deal. Attuned: 20%.' },
                 { id:'plant_aggr_ks', label:'Bloodflower', type:'keystone', element:'plant', branch:'plant_aggressive',
                   x:510, y:-510, cost:3, requires:['plant_aggr_5'],
                   desc:'Active: your next 3 attacks heal you for 50% of damage dealt. Cooldown 2 turns. Attuned: 100% lifesteal.' },
                 { id:'plant_def_1', label:'Bark Skin', type:'small', element:'plant', branch:'plant_defensive',
                   x:-85, y:-85, cost:1, stat:'plant_resist_pct', val:5, requires:['plant_root'],
                   desc:'+5% plant resistance.' },
                 { id:'plant_def_2', label:'Deep Roots', type:'small', element:'plant', branch:'plant_defensive',
                   x:-170, y:-170, cost:1, stat:'hp_bonus', val:30, requires:['plant_def_1'],
                   desc:'+30 max HP.' },
                 { id:'plant_def_3', label:'Regrowth', type:'notable', element:'plant', branch:'plant_defensive',
                   x:-255, y:-255, cost:2, stat:'hp_regen_combat', val:6, requires:['plant_def_2'],
                   desc:'Regenerate 6 HP each turn. Attuned: 12 HP.' },
                 { id:'plant_def_4', label:'Bramble', type:'small', element:'plant', branch:'plant_defensive',
                   x:-340, y:-340, cost:1, stat:'plant_reflect_pct', val:10, requires:['plant_def_3'],
                   desc:'Attackers take 10% of their damage back on thorns. Attuned: 20%.' },
                 { id:'plant_def_5', label:'Evergreen', type:'small', element:'plant', branch:'plant_defensive',
                   x:-425, y:-425, cost:1, stat:'hp_regen_combat', val:4, requires:['plant_def_4'],
                   desc:'Regenerate an extra 4 HP each turn. Attuned: 8 HP.' },
                 { id:'plant_def_ks', label:'World Tree', type:'keystone', element:'plant', branch:'plant_defensive',
                   x:-510, y:-510, cost:3, requires:['plant_def_5'],
                   desc:'Active: heal 30% max HP now and 10% each turn for 3 turns. Cooldown 3 turns. Attuned: also cleanse debuffs.' },
                 { id:'plant_util_1', label:'Photosynthesis', type:'small', element:'plant', branch:'plant_utility',
                   x:0, y:110, cost:1, stat:'hp_regen_combat', val:3, requires:['plant_root'],
                   desc:'Regenerate 3 HP each turn.' },
                 { id:'plant_util_2', label:'Spore Cloud', type:'small', element:'plant', branch:'plant_utility',
                   x:0, y:220, cost:1, stat:'poison_chance_pct', val:15, requires:['plant_util_1'],
                   desc:'15% chance on attack to poison the enemy (4 dmg/turn). Attuned: 30%.' },
                 { id:'plant_util_3', label:'Entangle', type:'notable', element:'plant', branch:'plant_utility',
                   x:0, y:330, cost:2, stat:'root_chance_pct', val:20, requires:['plant_util_2'],
                   desc:'20% chance on attack to root the enemy (skip their next turn). Attuned: 40%.' },
                 { id:'plant_util_4', label:'Resilience', type:'small', element:'plant', branch:'plant_utility',
                   x:0, y:440, cost:1, stat:'hp_bonus', val:30, requires:['plant_util_3'],
                   desc:'+30 max HP.' },
                 { id:'plant_util_5', label:'Bloom', type:'small', element:'plant', branch:'plant_utility',
                   x:0, y:550, cost:1, stat:'lifesteal_pct', val:8, requires:['plant_util_4'],
                   desc:'Heal for 8% of damage you deal. Attuned: 16%.' },
                 { id:'plant_util_ks', label:'Heartwood', type:'keystone', element:'plant', branch:'plant_utility',
                   x:0, y:660, cost:3, requires:['plant_util_5'],
                   desc:'Active: convert 50% of your missing HP into a heal. Cooldown 3 turns. Attuned: 75%.' },
               ] },
  metal:     { key:'metal',     label:'Ferro',  sigil:'⚙️', color:'#90a4ae',
               bossKey:'zone_boss_metal',
               signature:'mirror_skin',   signatureLabel:'Mirror Skin',
               nodes: 
               [
                 { id:'metal_root', label:'First Edge', type:'start', element:'metal', branch:'metal_root',
                   x:0, y:0, cost:0, requires:[],
                   desc:'The first blade that held its edge. Spend a Resonance Shard at any adjacent node to begin.' },
                 { id:'metal_aggr_1', label:'Whetstone', type:'small', element:'metal', branch:'metal_aggressive',
                   x:85, y:-85, cost:1, stat:'metal_damage_pct', val:3, requires:['metal_root'],
                   desc:'+3% damage on metal-tagged attacks. Attuned: +6%.' },
                 { id:'metal_aggr_2', label:'Serrate', type:'small', element:'metal', branch:'metal_aggressive',
                   x:170, y:-170, cost:1, stat:'metal_damage_pct', val:4, requires:['metal_aggr_1'],
                   desc:'+4% damage on metal-tagged attacks. Attuned: +8%.' },
                 { id:'metal_aggr_3', label:'Armor Pierce', type:'notable', element:'metal', branch:'metal_aggressive',
                   x:255, y:-255, cost:2, stat:'def_ignore_pct', val:25, requires:['metal_aggr_2'],
                   desc:'Your attacks ignore 25% of enemy DEF. Attuned: 50%.' },
                 { id:'metal_aggr_4', label:'Honed', type:'small', element:'metal', branch:'metal_aggressive',
                   x:340, y:-340, cost:1, stat:'crit_dmg_pct', val:12, requires:['metal_aggr_3'],
                   desc:'+12% critical hit damage.' },
                 { id:'metal_aggr_5', label:'Riposte', type:'small', element:'metal', branch:'metal_aggressive',
                   x:425, y:-425, cost:1, stat:'crit_chance_pct', val:4, requires:['metal_aggr_4'],
                   desc:'+4% critical hit chance.' },
                 { id:'metal_aggr_ks', label:'Guillotine', type:'keystone', element:'metal', branch:'metal_aggressive',
                   x:510, y:-510, cost:3, requires:['metal_aggr_5'],
                   desc:'Active: a precise strike for 250% ATK that ignores all DEF. Cooldown 2 turns. Attuned: guaranteed crit.' },
                 { id:'metal_def_1', label:'Plating', type:'small', element:'metal', branch:'metal_defensive',
                   x:-85, y:-85, cost:1, stat:'metal_resist_pct', val:5, requires:['metal_root'],
                   desc:'+5% metal resistance.' },
                 { id:'metal_def_2', label:'Riveted', type:'small', element:'metal', branch:'metal_defensive',
                   x:-170, y:-170, cost:1, stat:'def_bonus', val:6, requires:['metal_def_1'],
                   desc:'+6 DEF.' },
                 { id:'metal_def_3', label:'Mirror Skin', type:'notable', element:'metal', branch:'metal_defensive',
                   x:-255, y:-255, cost:2, stat:'metal_reflect_pct', val:20, requires:['metal_def_2'],
                   desc:'Reflect 20% of all damage taken back at the attacker. Attuned: 40%.' },
                 { id:'metal_def_4', label:'Counterweight', type:'small', element:'metal', branch:'metal_defensive',
                   x:-340, y:-340, cost:1, stat:'metal_reflect_pct', val:10, requires:['metal_def_3'],
                   desc:'+10% reflect. Attuned: +20%.' },
                 { id:'metal_def_5', label:'Tempered', type:'small', element:'metal', branch:'metal_defensive',
                   x:-425, y:-425, cost:1, stat:'def_bonus', val:6, requires:['metal_def_4'],
                   desc:'+6 DEF.' },
                 { id:'metal_def_ks', label:'Iron Maiden', type:'keystone', element:'metal', branch:'metal_defensive',
                   x:-510, y:-510, cost:3, requires:['metal_def_5'],
                   desc:'Active: for 2 turns, take half damage and reflect 50% of all damage taken. Cooldown 3 turns.' },
                 { id:'metal_util_1', label:'Balance', type:'small', element:'metal', branch:'metal_utility',
                   x:0, y:110, cost:1, stat:'crit_chance_pct', val:3, requires:['metal_root'],
                   desc:'+3% critical hit chance.' },
                 { id:'metal_util_2', label:'Precision', type:'small', element:'metal', branch:'metal_utility',
                   x:0, y:220, cost:1, stat:'crit_dmg_pct', val:10, requires:['metal_util_1'],
                   desc:'+10% critical hit damage.' },
                 { id:'metal_util_3', label:'Parry', type:'notable', element:'metal', branch:'metal_utility',
                   x:0, y:330, cost:2, stat:'parry_chance_pct', val:15, requires:['metal_util_2'],
                   desc:'15% chance to parry an attack — negate it and counter for 75% ATK. Attuned: 30%.' },
                 { id:'metal_util_4', label:'Maintenance', type:'small', element:'metal', branch:'metal_utility',
                   x:0, y:440, cost:1, stat:'cooldown_reduction', val:1, requires:['metal_util_3'],
                   desc:'Your skill cooldowns recharge faster.' },
                 { id:'metal_util_5', label:'Alloy', type:'small', element:'metal', branch:'metal_utility',
                   x:0, y:550, cost:1, stat:'def_bonus', val:5, requires:['metal_util_4'],
                   desc:'+5 DEF.' },
                 { id:'metal_util_ks', label:'Living Forge', type:'keystone', element:'metal', branch:'metal_utility',
                   x:0, y:660, cost:3, requires:['metal_util_5'],
                   desc:'Active: gain +30% ATK and +30% DEF for the rest of the battle. Cooldown 4 turns. One use per battle.' },
               ] },
  poison:    { key:'poison',    label:'Venin',  sigil:'☠️', color:'#7aad30',
               bossKey:'zone_boss_poison',
               signature:'long_decay',    signatureLabel:'Long Decay',
               nodes:
               [
                 { id:'poison_root', label:'First Sting', type:'start', element:'poison', branch:'poison_root',
                   x:0, y:0, cost:0, requires:[],
                   desc:'The first thing that ever made you sick and lived. Spend a Resonance Shard at any adjacent node to begin.' },

                 // ── Aggressive branch (offense / venom) ──
                 { id:'poison_aggr_1', label:'Toxic Strike', type:'small', element:'poison', branch:'poison_aggressive',
                   x:85, y:-85, cost:1, stat:'poison_damage_pct', val:3, requires:['poison_root'],
                   desc:'+3% damage on poison-tagged attacks. Attuned: +6%.' },
                 { id:'poison_aggr_2', label:'Seeping Wound', type:'small', element:'poison', branch:'poison_aggressive',
                   x:170, y:-170, cost:1, stat:'poison_damage_pct', val:4, requires:['poison_aggr_1'],
                   desc:'+4% damage on poison-tagged attacks. Attuned: +8%.' },
                 { id:'poison_aggr_3', label:'Virulence', type:'notable', element:'poison', branch:'poison_aggressive',
                   x:255, y:-255, cost:2, requires:['poison_aggr_2'],
                   desc:'15% chance on attack to inflict Long Decay — the target keeps taking poison for 3 turns. Stacks to 3. Attuned: 30% chance.' },
                 { id:'poison_aggr_4', label:'Concentrated Dose', type:'small', element:'poison', branch:'poison_aggressive',
                   x:340, y:-340, cost:1, stat:'long_decay_dmg_pct', val:10, requires:['poison_aggr_3'],
                   desc:'+10% damage per Long Decay tick. Attuned: +20%.' },
                 { id:'poison_aggr_5', label:'Compounding', type:'small', element:'poison', branch:'poison_aggressive',
                   x:425, y:-425, cost:1, stat:'long_decay_max_stacks', val:2, requires:['poison_aggr_4'],
                   desc:'+2 max Long Decay stacks. Attuned: +4.' },
                 { id:'poison_aggr_ks', label:'Plague Fang', type:'keystone', element:'poison', branch:'poison_aggressive',
                   x:510, y:-510, cost:3, requires:['poison_aggr_5'],
                   desc:'Active: your next 3 attacks each apply Long Decay. Cooldown 2 turns. Attuned: each attack applies twice.' },

                 // ── Defensive branch (resistance / antitoxin) ──
                 { id:'poison_def_1', label:'Hardened Gut', type:'small', element:'poison', branch:'poison_defensive',
                   x:-85, y:-85, cost:1, stat:'poison_resist_pct', val:5, requires:['poison_root'],
                   desc:'+5% poison resistance.' },
                 { id:'poison_def_2', label:'Antitoxin', type:'small', element:'poison', branch:'poison_defensive',
                   x:-170, y:-170, cost:1, stat:'poison_resist_pct', val:5, requires:['poison_def_1'],
                   desc:'+5% poison resistance. Immune to your own poison.' },
                 { id:'poison_def_3', label:'Toxin Shell', type:'notable', element:'poison', branch:'poison_defensive',
                   x:-255, y:-255, cost:2, stat:'toxin_shell_pct', val:25, requires:['poison_def_2'],
                   desc:'When you take poison damage, 25% of it instead refills your MP. Attuned: 50%.' },
                 { id:'poison_def_4', label:'Caustic Skin', type:'small', element:'poison', branch:'poison_defensive',
                   x:-340, y:-340, cost:1, stat:'poison_reflect_pct', val:8, requires:['poison_def_3'],
                   desc:'Attackers take 8% of their melee damage back as poison. Attuned: 16%.' },
                 { id:'poison_def_5', label:'Slow Metabolism', type:'small', element:'poison', branch:'poison_defensive',
                   x:-425, y:-425, cost:1, stat:'hp_per_poison_turn', val:3, requires:['poison_def_4'],
                   desc:'Heal 3 HP each turn an enemy is poisoned. Attuned: 6 HP.' },
                 { id:'poison_def_ks', label:'Living Antidote', type:'keystone', element:'poison', branch:'poison_defensive',
                   x:-510, y:-510, cost:3, requires:['poison_def_5'],
                   desc:'Active: for 2 turns, take half damage from ALL sources and reflect 25% of poison damage. Cooldown 3 turns.' },

                 // ── Utility branch (precision / control) ──
                 { id:'poison_util_1', label:'Miasma Step', type:'small', element:'poison', branch:'poison_utility',
                   x:0, y:110, cost:1, stat:'crit_chance_pct', val:3, requires:['poison_root'],
                   desc:'+3% critical hit chance.' },
                 { id:'poison_util_2', label:'Pressure Point', type:'small', element:'poison', branch:'poison_utility',
                   x:0, y:220, cost:1, stat:'crit_dmg_pct', val:8, requires:['poison_util_1'],
                   desc:'+8% critical hit damage.' },
                 { id:'poison_util_3', label:'Dose Read', type:'notable', element:'poison', branch:'poison_utility',
                   x:0, y:330, cost:2, requires:['poison_util_2'],
                   desc:'20% chance on crit to reduce enemy ATK by 5 for 2 turns. Attuned: 40% chance, -10 ATK.' },
                 { id:'poison_util_4', label:'Deep Reserves', type:'small', element:'poison', branch:'poison_utility',
                   x:0, y:440, cost:1, stat:'hp_bonus', val:25, requires:['poison_util_3'],
                   desc:'+25 max HP.' },
                 { id:'poison_util_5', label:'Second Wind', type:'small', element:'poison', branch:'poison_utility',
                   x:0, y:550, cost:1, stat:'cooldown_reduction', val:1, requires:['poison_util_4'],
                   desc:'Your skill cooldowns recharge faster (stacks with other recharge nodes).' },
                 { id:'poison_util_ks', label:'Virulent Crown', type:'keystone', element:'poison', branch:'poison_utility',
                   x:0, y:660, cost:3, requires:['poison_util_5'],
                   desc:'Active: convert each Long Decay stack on the enemy into 8% max-HP healing. Removes the stacks. Cooldown 3 turns.' },
               ] },
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
