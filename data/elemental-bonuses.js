// data/elemental-bonuses.js — applies elemental skill-tree nodes to combat.
// ─────────────────────────────────────────────────────────────────────
// The elemental trees (data/elements_tree.js) let players spend Resonance
// Shards to unlock nodes. Each unlocked node id is stored in the array
// player.elemental_unlocked. Until now nothing READ that array in combat —
// the trees displayed and persisted but their bonuses did nothing.
//
// This module is the missing link. It aggregates every unlocked node's
// stat/val into a single bonuses object, which the combat engines query.
// One source of truth, imported identically by every chapter, so the
// numbers can't drift between Ch1 and Ch2.
//
// SCOPE — Tier 1 (flat numeric bonuses) only, for now:
//   <el>_damage_pct   — % bonus to that element's tagged attacks
//   <el>_resist_pct   — % incoming damage reduction (all sources; simple v1)
//   crit_chance_pct   — flat crit chance added
//   crit_dmg_pct      — flat crit damage multiplier added
//   mp_max_bonus      — flat max-MP bonus
//   mp_regen_combat   — MP regained per combat turn
//   <el>_reflect_pct  — % of damage taken reflected to attacker
//
// Tier-2 stacking mechanics (ember_memory_*, long_decay_*, still_water_*)
// and Tier-3 keystone actives are intentionally NOT handled here yet — they
// need engine-side mechanics and (for keystones) combat UI buttons. This
// module exposes their raw summed values too (via rawBonus) so a later pass
// can build on them without re-aggregating.
//
// "Attuned" doubling: a node's effect doubles when the player is attuned to
// that element (player.element === el or player.attuned_element === el). The
// tree descriptions say "Attuned: +X". We apply the 2x to element-specific
// keys only (damage/resist/reflect), matching the node text.
// ─────────────────────────────────────────────────────────────────────

import { ELEMENT_TREES } from './elements_tree.js'

// Build a fast lookup: node id -> { el, stat, val } for every node in every
// tree. Done once at module load.
const NODE_INDEX = (() => {
  const idx = {}
  for (const elKey of Object.keys(ELEMENT_TREES)) {
    const tree = ELEMENT_TREES[elKey]
    for (const n of (tree.nodes || [])) {
      if (n.stat && typeof n.val === 'number') {
        idx[n.id] = { el: elKey, stat: n.stat, val: n.val }
      }
    }
  }
  return idx
})()

// Which element is the player attuned to (doubles element-specific nodes)?
// Falls back through a couple of likely field names; null if none.
function attunedElement(player) {
  return player?.attuned_element || player?.element || null
}

// Element-specific keys that should double when attuned to that element.
const ELEMENT_DOUBLES = new Set(['damage_pct', 'resist_pct', 'reflect_pct'])

// Aggregate all unlocked nodes into a summed bonuses object.
// Returns a flat map of statKey -> summed value, plus a per-element damage
// map for convenience. Safe on missing/empty input.
export function getElementalBonuses(player) {
  const unlocked = Array.isArray(player?.elemental_unlocked) ? player.elemental_unlocked : []
  const attuned = attunedElement(player)
  const sums = {}
  const dmgByEl = {}     // el -> summed damage_pct (already attuned-adjusted)
  const resistByEl = {}  // el -> summed resist_pct
  const reflectByEl = {} // el -> summed reflect_pct

  for (const id of unlocked) {
    const node = NODE_INDEX[id]
    if (!node) continue
    let val = node.val
    // Element-specific keys double when attuned to that element.
    const suffix = node.stat.replace(node.el + '_', '')
    const isElementKey = node.stat.startsWith(node.el + '_') && ELEMENT_DOUBLES.has(suffix)
    if (isElementKey && attuned === node.el) val *= 2

    sums[node.stat] = (sums[node.stat] || 0) + val

    if (suffix === 'damage_pct'  && node.stat.startsWith(node.el + '_')) dmgByEl[node.el]     = (dmgByEl[node.el]     || 0) + val
    if (suffix === 'resist_pct'  && node.stat.startsWith(node.el + '_')) resistByEl[node.el]  = (resistByEl[node.el]  || 0) + val
    if (suffix === 'reflect_pct' && node.stat.startsWith(node.el + '_')) reflectByEl[node.el] = (reflectByEl[node.el] || 0) + val
  }

  return { sums, dmgByEl, resistByEl, reflectByEl, attuned }
}

// ── Convenience getters the combat engine calls ──────────────────────────

// Damage multiplier for an attack of a given element. element is the attack's
// el (sk.el), or 'physical' for basic strikes (no elemental bonus).
//   returns a multiplier, e.g. 1.07 for +7%.
export function damageMult(player, element) {
  if (!element || element === 'physical') return 1
  const b = getElementalBonuses(player)
  const pct = b.dmgByEl[element] || 0
  return 1 + pct / 100
}

// Incoming-damage multiplier from resistance. v1 is simple: total resist from
// ALL elements applies to all incoming damage (the trees don't tag enemy
// attacks by element yet). Capped at 60% reduction so it can't trivialize.
//   returns a multiplier, e.g. 0.9 for 10% resist.
export function resistMult(player) {
  const b = getElementalBonuses(player)
  let total = 0
  for (const el of Object.keys(b.resistByEl)) total += b.resistByEl[el]
  total = Math.min(60, total)
  return 1 - total / 100
}

// Flat crit-chance bonus (as a 0..1 fraction to add to existing crit rolls).
export function critChanceBonus(player) {
  const b = getElementalBonuses(player)
  return (b.sums.crit_chance_pct || 0) / 100
}

// Flat crit-damage bonus (as a fraction, e.g. 0.16 for +16%).
export function critDamageBonus(player) {
  const b = getElementalBonuses(player)
  return (b.sums.crit_dmg_pct || 0) / 100
}

// Reflect fraction (total across elements) — share of damage taken sent back
// to the attacker. Capped at 50%.
export function reflectFraction(player) {
  const b = getElementalBonuses(player)
  let total = 0
  for (const el of Object.keys(b.reflectByEl)) total += b.reflectByEl[el]
  return Math.min(50, total) / 100
}

// Flat max-MP bonus and per-turn combat MP regen (raw integers).
export function mpMaxBonus(player) {
  return getElementalBonuses(player).sums.mp_max_bonus || 0
}
export function mpRegenCombat(player) {
  return getElementalBonuses(player).sums.mp_regen_combat || 0
}

// Escape hatch for later tiers: raw summed value of any stat key.
export function rawBonus(player, statKey) {
  return getElementalBonuses(player).sums[statKey] || 0
}
