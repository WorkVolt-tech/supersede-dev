import { test } from 'node:test'
import assert from 'node:assert/strict'
import { combatApBreakdown, maxCombatAp } from './combatAp.js'

test('five base AP plus one per character level', () => {
  assert.equal(maxCombatAp({level:1}),6)
  assert.equal(maxCombatAp({level:3}),8)
  assert.equal(maxCombatAp({level:10}),15)
  assert.equal(maxCombatAp(3),8) // Legacy number argument remains supported.
})

test('permanent bonuses are per-player and survive a change in equipment', () => {
  const a={level:3,bonus_ap:0}, b={level:3,bonus_ap:2}
  assert.equal(maxCombatAp(a),8)
  assert.equal(maxCombatAp(b),10)
  assert.equal(maxCombatAp(a),8)
})

test('equipped gear adds AP, but inventory items not equipped do not', () => {
  const inventory=[
    {id:1,equipped_slot:'helmet',ap_bonus:2},
    {id:2,equipped_slot:'accessory1',ap_bonus:1},
    {id:3,equipped_slot:null,ap_bonus:9},
    {id:4,equipped_slot:'mainhand',ap_bonus:0},
  ]
  assert.deepEqual(combatApBreakdown({level:3,bonus_ap:2},inventory),
    {base:5,level:3,permanent:2,gear:3,max:13})
  assert.equal(maxCombatAp({level:3,bonus_ap:2},
    inventory.map(item=>({...item,equipped_slot:null}))),10)
})

test('legacy and malformed AP values safely fall back to zero bonuses', () => {
  assert.equal(maxCombatAp({level:3}),8)
  assert.equal(maxCombatAp({level:3,bonus_ap:null}),8)
  assert.equal(maxCombatAp({level:3,bonus_ap:-5},
    [{equipped_slot:'helmet',ap_bonus:-2}]),8)
  assert.equal(maxCombatAp({level:3,bonus_ap:'2'},[{equipped_slot:'mainhand',ap_bonus:'1'}]),11)
  assert.equal(maxCombatAp({level:1,bonus_ap:Infinity}),6)
})
