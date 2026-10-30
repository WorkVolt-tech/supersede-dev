// Turn-safe utilities for the existing elementalKeystones.js result contract.
// No database writes: cooldowns and status effects belong to a single fight.

// Decrement after each completed combat round. The keystone just cast keeps
// its full cooldown until the NEXT completed round.
export function advanceKeystoneCooldowns(cooldowns, castId = null) {
  const next = {}
  for (const [id, turns] of Object.entries(cooldowns || {})) {
    const remaining = id === castId ? turns : turns - 1
    if (remaining > 0) next[id] = remaining
  }
  return next
}

export function applyKeystoneStatuses(status, changes = {}) {
  Object.assign(status, changes)
  if (changes.cfx_cleanseDebuffs) {
    for (const key of [
      'playerBleedTurns', 'playerBleedDmg', 'playerPoisonTurns',
      'playerPoisonDmg', 'playerSlowTurns', 'playerStunTurns',
      'playerTerrorTurns', 'playerDefShredTurns', 'playerDefShredAmt',
    ]) delete status[key]
    delete status.cfx_cleanseDebuffs
  }
}

// Called instead of the enemy AI when a keystone (or class skill) stunned it.
export function consumeEnemyStun(status) {
  if ((status.enemyStunTurns || 0) > 0) {
    status.enemyStunTurns -= 1
    return 'The enemy is stunned and loses its turn.'
  }
  if (status.cfx_freezeNextTurn) {
    status.cfx_freezeNextTurn = false
    return 'The enemy is frozen and loses its turn.'
  }
  return null
}

export function resolveKeystoneDefense(status, incoming) {
  const messages = []
  const before = Math.max(0, incoming)
  let damage = before
  if (status.cfx_untargetableTurns > 0) {
    damage = 0
    status.cfx_untargetableTurns -= 1
    messages.push('You fade out of reach. The attack misses.')
  } else {
    if (status.cfx_damageHalveTurns > 0) {
      damage = Math.round(damage * 0.5)
      messages.push('Your elemental ward halves the damage.')
    }
    if (status.cfx_forgeDef) damage = Math.round(damage * 0.7)
    if (status.cfx_stonebornStacks > 0) {
      damage = Math.round(damage * Math.max(0.5, 1 - status.cfx_stonebornStacks * 0.05))
    }
    if (status.cfx_dodgeBuffTurns > 0 && Math.random() < 0.25) {
      damage = 0
      messages.push('You slip out of the attack with elemental speed.')
    }
  }
  let reflected = 0
  if (damage > 0) {
    if (status.cfx_fireReflectTurns > 0) reflected += Math.round(damage * 0.25)
    if (status.cfx_poisonReflectTurns > 0) reflected += Math.round(damage * 0.25)
    if (status.cfx_ironMaidenTurns > 0) reflected += Math.round(damage * 0.50)
  }
  for (const key of [
    'cfx_damageHalveTurns', 'cfx_fireReflectTurns', 'cfx_poisonReflectTurns',
    'cfx_ironMaidenTurns', 'cfx_dodgeBuffTurns', 'cfx_stunMeleeTurns',
    'cfx_dmgToMpTurns',
  ]) if (status[key] > 0) status[key] -= 1
  return { damage, reflected, messages }
}

export function resolveKeystoneStrike(status, damage, criticalApplied = false) {
  let dealt = damage
  const messages = []
  if (status.cfx_forgeAtk) dealt = Math.round(dealt * 1.3)
  if (status.cfx_guaranteedCrit) {
    // CombatScreen has already applied the critical multiplier when it
    // marks the attack guaranteed. The default supports direct callers.
    if (!criticalApplied) dealt = Math.round(dealt * 1.5)
    delete status.cfx_guaranteedCrit
    messages.push('✦ Elemental critical strike!')
  }
  let heal = 0
  if (status.cfx_bloodflowerTurns > 0) {
    heal = Math.round(dealt * (status.cfx_bloodflowerPct || 0.5))
    status.cfx_bloodflowerTurns -= 1
    messages.push('Bloodflower draws vitality from your strike.')
  }
  if (status.cfx_emberStepTurns > 0) {
    status.cfx_emberStacks = Math.min(5, (status.cfx_emberStacks || 0) + 1)
    status.cfx_emberStepTurns -= 1
    messages.push('Ember Memory builds.')
  }
  if (status.cfx_plagueFangTurns > 0) {
    status.cfx_longDecayStacks = Math.min(5, (status.cfx_longDecayStacks || 0) + 1)
    status.cfx_plagueFangTurns -= 1
    messages.push('Long Decay spreads.')
  }
  return { damage: dealt, heal, messages }
}

export function resolveKeystoneRegen(status, foeHp, hp, maxHp) {
  let enemyHp = foeHp
  let playerHp = hp
  const messages = []
  const ember = status.cfx_emberStacks || 0
  const decay = status.cfx_longDecayStacks || 0
  if (ember || decay) {
    const tick = ember * 4 + decay * 3
    enemyHp = Math.max(0, enemyHp - tick)
    messages.push(`Elemental damage over time: ${tick}.`)
  }
  if (status.cfx_worldTreeTurns > 0 && playerHp > 0) {
    const healed = Math.min(maxHp - playerHp, Math.round(maxHp * 0.05))
    playerHp += healed
    status.cfx_worldTreeTurns -= 1
    if (healed > 0) messages.push(`World Tree restores ${healed} HP.`)
  }
  return { enemyHp, playerHp, messages }
}
