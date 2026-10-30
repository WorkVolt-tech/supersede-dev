// Per-encounter MP. The original React game has no persistent MP columns.
// Keep these resources local to combat and retain existing elemental passive
// mp_max_bonus / mp_regen_combat bonuses; no changes to player saves.
import { mpMaxBonus, mpRegenCombat } from './elementalBonuses.js'

export const ELEMENTAL_MP_COSTS = [8, 14, 22]
export const BASE_COMBAT_MP = 30
export const BASE_MP_REGEN = 3

export function getMaxCombatMp(player) {
  return Math.max(1, BASE_COMBAT_MP + Math.max(0, Math.floor(mpMaxBonus(player))))
}
export function getCombatMpRegen(player) {
  return Math.max(0, BASE_MP_REGEN + Math.floor(mpRegenCombat(player)))
}
export function clampCombatMp(mp, maxMp) {
  return Math.max(0, Math.min(maxMp, Math.floor(Number(mp) || 0)))
}
export function recoverCombatMp(current, amount, maxMp) {
  return clampCombatMp(current + Math.max(0, Math.round(amount)), maxMp)
}

// Perfect Recall makes the next elemental attack free. Time Skip's
// refund-half marker makes the next elemental attack cost half MP.
// Neither modifier is consumed until an attack actually goes through.
export function getElementalMpCost(tier, status = {}) {
  const base = ELEMENTAL_MP_COSTS[tier]
  if (base == null) return Infinity
  if (status.cfx_perfectRecall) return 0
  if (status.cfx_refundMpHalf) return Math.ceil(base / 2)
  return base
}
export function consumeMpCostModifiers(status) {
  delete status.cfx_refundMpHalf
}

// Aegis grants MP from HP damage actually sustained, not the amount
// blocked by its half-damage ward, and never from a missed attack.
export function aegisMpGain(status, damageTaken) {
  return status.cfx_dmgToMpTurns > 0 ? Math.round(Math.max(0, damageTaken) * 0.5) : 0
}
