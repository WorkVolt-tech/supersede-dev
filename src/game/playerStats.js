// playerStats.js
// ─────────────────────────────────────────────────────────────────────────
// Base stat + equipped-item-bonus math. Ch1's vanilla engine computed this
// inline inside its combat function (calcATK()/calcDEF()); pulled out here
// as standalone functions so CombatScreen can call it directly and it's
// testable/reusable on its own.
export function calcATK(player, equippedItems) {
  const base = player.base_atk ?? player.atk ?? 10
  const fromGear = equippedItems.reduce((sum, i) => sum + (i.atk_bonus || 0), 0)
  return base + fromGear
}

export function calcDEF(player, equippedItems) {
  const base = player.base_def ?? player.def ?? 5
  const fromGear = equippedItems.reduce((sum, i) => sum + (i.def_bonus || 0), 0)
  return base + fromGear
}

export function calcMaxHp(player, equippedItems) {
  const base = player.base_max_hp ?? player.max_hp ?? 100
  const fromGear = equippedItems.reduce((sum, i) => sum + (i.max_hp_bonus || 0), 0)
  return base + fromGear
}
