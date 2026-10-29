import test from 'node:test'
import assert from 'node:assert/strict'
import { SLOTS, equipmentSubtype, isTwoHandedWeapon } from '../src/game/equipmentSlots.js'

const mainhand = SLOTS.find(s => s.key==='mainhand')
const offhand = SLOTS.find(s => s.key==='offhand')

test('guns, bows, and crossbows fit the main weapon slot', () => {
  for (const type of ['gun','pistol','revolver','rifle','shotgun','smg','bow','longbow','crossbow']) {
    assert.ok(mainhand.accepts.includes(type),type)
  }
})

test('long ranged weapons require both hands while pistols support offhand', () => {
  for (const type of ['rifle','shotgun','bow','crossbow']) {
    assert.equal(isTwoHandedWeapon({subtype:type}),true,type)
    assert.equal(offhand.accepts.includes(type),false,type)
  }
  assert.equal(isTwoHandedWeapon({subtype:'pistol'}),false)
  assert.ok(offhand.accepts.includes('pistol'))
})

test('legacy weapon records without subtype are recognized', () => {
  assert.equal(equipmentSubtype({item_type:'weapon',item_key:'hunter_crossbow'}),'crossbow')
  assert.equal(equipmentSubtype({item_type:'weapon',name:'Old Revolver'}),'revolver')
})
