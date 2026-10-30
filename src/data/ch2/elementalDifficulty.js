import { ZONE_ELEMENT_MAP } from './config'

// The first Chapter 2 guardian defeated establishes permanent chapter resonance.
// All elemental visits are stored as zone IDs; the same zone does not count twice.
export function getChapterResonance(player) {
  const defeated = player?.defeated_bosses || []
  const flag = defeated.find(key => key.startsWith('element_resonance_'))
  if (flag) return flag.slice('element_resonance_'.length)
  // Legacy saves can predate the dedicated flag. Zone victories are appended
  // in chronological order, so the first guardian still identifies resonance.
  const firstGuardian = defeated.find(key =>
    key.startsWith('zone_boss_') &&
    Object.values(ZONE_ELEMENT_MAP).includes(key.slice('zone_boss_'.length)),
  )
  return firstGuardian ? firstGuardian.slice('zone_boss_'.length) : null
}

export function getZoneElement(nodeId) {
  return Object.keys(ZONE_ELEMENT_MAP).find(zone => nodeId === zone || nodeId.startsWith(zone + '_')) || null
}

export function getElementalDifficulty(player) {
  const attempted = new Set((player?.ch2_elements_attempted || []).filter(id => Object.hasOwn(ZONE_ELEMENT_MAP, id)))
  // First element is baseline. Every additional distinct element doubles
  // HP, ATK, DEF and speed. Revisiting the same element does not increase it.
  return 2 ** Math.max(0, attempted.size - 1)
}

export function scaleCh2ZoneEnemy(enemy, player, nodeId, bossKey) {
  if (!enemy || !getZoneElement(nodeId)) return enemy
  const scaled = { ...enemy }
  const multiplier = getElementalDifficulty(player)

  if (bossKey?.startsWith('zone_boss_')) {
    // The original game scales zone guardians by level and prior kills.
    const level = Number(player?.level) || 1
    const cleared = (player?.defeated_bosses || []).filter(
      key => key.startsWith('zone_boss_') && key !== bossKey,
    ).length
    const escalation = Math.min(3.5, 1 + cleared * 0.5)
    scaled.hp = Math.round((enemy.hp + level * 10) * escalation)
    scaled.atk = Math.round((enemy.atk + Math.floor(level * 0.8)) * escalation)
    scaled.def = Math.round((enemy.def || 0) * escalation)
    // Keep the original gentle SPD scaling for guardian clears.
    const bossSpeedFactor = Math.min(2, 1 + cleared * 0.25)
    const baseSpeed = enemy.speed ?? enemy.spd ?? enemy.agility
    const fallback = scaled.atk <= 36 ? 22 : scaled.atk <= 42 ? 27 : 31
    scaled.spd = Math.round((baseSpeed ?? fallback) * bossSpeedFactor)
    // CombatScreen prioritizes 'speed' over 'spd' when both exist.
    if ('speed' in scaled) scaled.speed = scaled.spd
    if ('agility' in scaled && !('speed' in scaled)) scaled.agility = scaled.spd
  }

  for (const stat of ['hp', 'atk', 'def']) {
    if (Number.isFinite(scaled[stat])) scaled[stat] = Math.round(scaled[stat] * multiplier)
  }
  // Combat's speed lookup is speed ?? spd ?? agility. Multiply only the
  // active field so initiative is changed exactly once.
  const speedStat = scaled.speed != null ? 'speed' : scaled.spd != null ? 'spd' : scaled.agility != null ? 'agility' : 'spd'
  scaled[speedStat] = Math.round((scaled[speedStat] ?? 5) * multiplier)
  // XP, loot, original enemy nodes and all non-elemental encounters are untouched.
  return scaled
}
