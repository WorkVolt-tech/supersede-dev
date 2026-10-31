// AP capacity is permanent character progression plus equipped bonuses.
// Remaining AP is battle-only state and resets at the start of a new round.
const wholeNonnegative = value => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0
}

export function combatApBreakdown(playerOrLevel = 1, equipped = []) {
  const player = playerOrLevel && typeof playerOrLevel === 'object'
    ? playerOrLevel : { level:playerOrLevel }
  const level = Math.max(1, wholeNonnegative(player.level))
  const permanent = wholeNonnegative(player.bonus_ap)
  // Ignore unequipped items, even if callers provide the entire inventory.
  const gear = Array.isArray(equipped) ? equipped.reduce((sum, item) =>
    sum + (item?.equipped_slot ? wholeNonnegative(item.ap_bonus) : 0), 0) : 0
  return { base:5, level, permanent, gear, max:5+level+permanent+gear }
}

export function maxCombatAp(playerOrLevel = 1, equipped = []) {
  return combatApBreakdown(playerOrLevel, equipped).max
}
