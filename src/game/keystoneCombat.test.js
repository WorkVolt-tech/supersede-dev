import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  advanceKeystoneCooldowns, applyKeystoneStatuses, consumeEnemyStun,
  resolveKeystoneDefense, resolveKeystoneStrike, resolveKeystoneRegen, applyStonebornDefend, stonebornArmorPierce,
} from './keystoneCombat.js'

test('newly cast keystone retains full cooldown for its casting round', () => {
  assert.deepEqual(advanceKeystoneCooldowns({ water_aggr_ks: 2 }, 'water_aggr_ks'), { water_aggr_ks: 2 })
  assert.deepEqual(advanceKeystoneCooldowns({ water_aggr_ks: 2 }), { water_aggr_ks: 1 })
  assert.deepEqual(advanceKeystoneCooldowns({ water_aggr_ks: 1 }), {})
})

test('other active keystones recharge when a different skill is used', () => {
  assert.deepEqual(advanceKeystoneCooldowns({ a: 3, b: 2 }, 'b'), { a: 2, b: 2 })
  assert.deepEqual(advanceKeystoneCooldowns({ a: 3, b: 2 }, null), { a: 2, b: 1 })
})

test('status applications preserve existing effects and cleanse enemy debuffs', () => {
  const status = { playerBleedTurns: 2, playerPoisonTurns: 1, cfx_stonebornStacks: 2 }
  applyKeystoneStatuses(status, { cfx_cleanseDebuffs: true, cfx_damageHalveTurns: 2 })
  assert.equal(status.playerBleedTurns, undefined)
  assert.equal(status.playerPoisonTurns, undefined)
  assert.equal(status.cfx_stonebornStacks, 2)
  assert.equal(status.cfx_damageHalveTurns, 2)
})

test('stun and freeze consume one enemy action, not permanent locks', () => {
  const status = { enemyStunTurns: 1, cfx_freezeNextTurn: true }
  assert.ok(consumeEnemyStun(status))
  assert.equal(status.enemyStunTurns, 0)
  assert.ok(consumeEnemyStun(status))
  assert.equal(status.cfx_freezeNextTurn, false)
  assert.equal(consumeEnemyStun(status), null)
})

test('two-turn damage wards halve damage twice and expire', () => {
  const status = { cfx_damageHalveTurns: 2 }
  assert.equal(resolveKeystoneDefense(status, 20).damage, 10)
  assert.equal(status.cfx_damageHalveTurns, 1)
  assert.equal(resolveKeystoneDefense(status, 20).damage, 10)
  assert.equal(status.cfx_damageHalveTurns, 0)
  assert.equal(resolveKeystoneDefense(status, 20).damage, 20)
})

test('reflect and untargetable effects do not fabricate damage', () => {
  const status = { cfx_ironMaidenTurns: 2, cfx_untargetableTurns: 1 }
  assert.deepEqual([resolveKeystoneDefense(status, 40).damage, resolveKeystoneDefense(status, 40).reflected], [0, 20])
})

test('Ember Memory and Long Decay accumulate from empowered strikes', () => {
  const status = { cfx_emberStepTurns: 1, cfx_plagueFangTurns: 1 }
  const hit = resolveKeystoneStrike(status, 20)
  assert.equal(hit.damage, 20)
  assert.equal(status.cfx_emberStacks, 1)
  assert.equal(status.cfx_longDecayStacks, 1)
  const tick = resolveKeystoneRegen(status, 60, 40, 100)
  assert.equal(tick.enemyHp, 53)
})

test('guaranteed critical bonuses are consumed exactly once', () => {
  const status = { cfx_guaranteedCrit: true }
  assert.equal(resolveKeystoneStrike(status, 20).damage, 30)
  assert.equal(resolveKeystoneStrike(status, 20).damage, 20)
  const alreadyCritical = { cfx_guaranteedCrit: true }
  assert.equal(resolveKeystoneStrike(alreadyCritical, 30, true).damage, 30)
  assert.equal(alreadyCritical.cfx_guaranteedCrit, undefined)
})

test('Bloodflower lifesteal is derived from the delivered strike', () => {
  const status = { cfx_bloodflowerTurns: 1, cfx_bloodflowerPct: 0.5 }
  assert.equal(resolveKeystoneStrike(status, 30).heal, 15)
  assert.equal(resolveKeystoneStrike(status, 30).heal, 0)
})

test('World Tree regeneration is capped at max HP and lasts three enemy turns', () => {
  const status = { cfx_worldTreeTurns: 3 }
  assert.equal(resolveKeystoneRegen(status, 100, 97, 100).playerHp, 100)
  assert.equal(status.cfx_worldTreeTurns, 2)
})

test('Inferno Zone deals three damage-over-time ticks then expires', () => {
  const status = { infernoTurns: 3, infernoDmg: 40 }
  let enemyHp = 200
  for (let turn = 0; turn < 3; turn++) {
    enemyHp = resolveKeystoneRegen(status, enemyHp, 90, 100).enemyHp
  }
  assert.equal(enemyHp, 80)
  assert.equal(status.infernoTurns, 0)
  assert.equal(resolveKeystoneRegen(status, enemyHp, 90, 100).enemyHp, 80)
})

test('Aegis converts half of sustained damage to MP over two enemy actions', () => {
  const status = { cfx_damageHalveTurns: 2, cfx_dmgToMpTurns: 2 }
  const first = resolveKeystoneDefense(status, 40)
  assert.equal(first.damage, 20)
  assert.equal(first.mpGain, 10)
  assert.equal(status.cfx_dmgToMpTurns, 1)
  const second = resolveKeystoneDefense(status, 20)
  assert.equal(second.damage, 10)
  assert.equal(second.mpGain, 5)
  assert.equal(status.cfx_dmgToMpTurns, 0)
  assert.equal(resolveKeystoneDefense(status, 40).mpGain, 0)
})

test('Stoneborn builds on Defend only for the active Earth tree', () => {
  const earth = { element: 'earth', defeated_bosses: ['zone_boss_earth'],
    elemental_unlocked: ['earth_def_3'] }
  const inactive = {...earth, element: 'fire'}
  const status = {}
  assert.equal(applyStonebornDefend(earth, status), 1)
  assert.equal(applyStonebornDefend(earth, status), 2)
  assert.equal(applyStonebornDefend(earth, status), 3)
  assert.equal(applyStonebornDefend(earth, status), 3)
  assert.equal(applyStonebornDefend(inactive, status), 0)
  assert.equal(status.cfx_stonebornStacks, 3)
})

test('Stoneborn reduces damage 16 percent per active stack, capped at 60 percent', () => {
  assert.equal(resolveKeystoneDefense({cfx_stonebornStacks:1},100).damage,84)
  assert.equal(resolveKeystoneDefense({cfx_stonebornStacks:2},100).damage,68)
  assert.equal(resolveKeystoneDefense({cfx_stonebornStacks:3},100).damage,52)
  assert.equal(resolveKeystoneDefense({cfx_stonebornStacks:20},100).damage,40)
})

test('Fault Line pierces enemy DEF with Earth offensive tier unlocked', () => {
  const earth = { element:'earth', defeated_bosses:['zone_boss_earth'],
    elemental_unlocked:['earth_aggr_3'] }
  const status = {cfx_stonebornStacks:3}
  assert.equal(stonebornArmorPierce(earth,status,100),90)
  assert.equal(stonebornArmorPierce({...earth,element:'water'},status,100),0)
  assert.equal(stonebornArmorPierce({...earth,elemental_unlocked:[]},status,100),0)
  assert.equal(stonebornArmorPierce(earth,{cfx_stonebornStacks:0},100),0)
})
