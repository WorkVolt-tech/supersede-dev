import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getMaxCombatMp, getCombatMpRegen, clampCombatMp, recoverCombatMp,
  getElementalMpCost, aegisMpGain, ELEMENTAL_MP_COSTS,
} from './combatMp.js'
import { getActiveElement } from './activeElement.js'

test('base combat MP is full at the start of each encounter', () => {
  assert.equal(getMaxCombatMp({}), 30)
  assert.equal(getCombatMpRegen({}), 3)
  assert.deepEqual(ELEMENTAL_MP_COSTS, [8, 14, 22])
})

test('current utility branches do not invent MP bonuses from other stats', () => {
  const p = {
    defeated_bosses: ['zone_boss_fire', 'zone_boss_water'],
    elemental_unlocked: ['fire_util_4', 'water_util_4', 'fire_util_5', 'water_util_5'],
    element: 'fire',
  }
  assert.equal(getActiveElement(p), 'fire')
  // The current tree overrides utility nodes 4/5 with ATK/HP and cooldown
  // upgrades; neither is an MP node. Future MP nodes still use the bonus API.
  assert.equal(getMaxCombatMp(p), 30)
  assert.equal(getCombatMpRegen(p), 3)
  assert.equal(getMaxCombatMp({...p,element:'water'}),30)
})

test('MP spending and recovery respect zero and maximum', () => {
  assert.equal(clampCombatMp(-20, 30), 0)
  assert.equal(clampCombatMp(50, 30), 30)
  assert.equal(recoverCombatMp(25, 10, 30), 30)
  assert.equal(recoverCombatMp(0, 3, 30), 3)
  assert.equal(recoverCombatMp(0, -9, 30), 0)
})

test('perfect recall makes one skill free and Time Skip halves MP cost', () => {
  assert.equal(getElementalMpCost(0), 8)
  assert.equal(getElementalMpCost(1), 14)
  assert.equal(getElementalMpCost(2), 22)
  assert.equal(getElementalMpCost(2,{cfx_refundMpHalf:true}),11)
  assert.equal(getElementalMpCost(1,{cfx_refundMpHalf:true}),7)
  assert.equal(getElementalMpCost(2,{cfx_refundMpHalf:true,cfx_perfectRecall:true}),0)
})

test('Aegis converts only actual damage taken into MP while active', () => {
  assert.equal(aegisMpGain({cfx_dmgToMpTurns:2},20),10)
  assert.equal(aegisMpGain({cfx_dmgToMpTurns:1},0),0)
  assert.equal(aegisMpGain({cfx_dmgToMpTurns:0},40),0)
})
