import {test} from 'node:test'
import assert from 'node:assert/strict'
import {applySingleFusionHit,absorbSingleFusionDamage,
  advanceSingleFusionRegen,initialSingleFusionGuard} from './singleFusionCombat.js'

const fusion=(element,level=1,key='ghostblade:'+element)=>({element,level,key})
const state={foeHp:100,playerHp:60,maxPlayerHp:100,
  status:{cls_markTurns:2},guard:initialSingleFusionGuard()}

test('Fire and Poison are applied to existing single-foe status without erasing class marks',()=>{
  const fire=applySingleFusionHit(fusion('fire',5),state)
  assert.equal(fire.status.cfx_emberStacks,2)
  assert.equal(fire.status.cls_markTurns,2)
  assert.equal(state.status.cfx_emberStacks,undefined)
  const poison=applySingleFusionHit(fusion('poison'),state)
  assert.equal(poison.status.cfx_longDecayStacks,1)
  assert.equal(poison.status.cls_markTurns,2)
})
test('lightning bounces to same boss, signature adds second arc',()=>{
  const ordinary=applySingleFusionHit(fusion('lightning'),state)
  const signature=applySingleFusionHit(fusion('lightning',5,'wrathborn:lightning'),state)
  assert.equal(ordinary.bonusDamage,3)
  assert.equal(signature.bonusDamage,10)
  assert.equal(signature.foeHp,90)
})
test('water, Arcane and Metal respect max HP and existing damage',()=>{
  const water=applySingleFusionHit(fusion('water',10),{...state,playerHp:99})
  assert.equal(water.playerHp,100)
  assert.ok(applySingleFusionHit(fusion('arcane'),state).bonusDamage>0)
  assert.ok(applySingleFusionHit(fusion('metal'),state).bonusDamage>0)
})
test('Shadow dodge is consumed once, Earth ward is reduced per hit',()=>{
  const shadow=applySingleFusionHit(fusion('shadow'),state)
  const first=absorbSingleFusionDamage(25,shadow.guard)
  assert.equal(first.damage,0)
  assert.equal(first.guard.dodge,false)
  assert.equal(absorbSingleFusionDamage(25,first.guard).damage,25)
  const earth=applySingleFusionHit(fusion('earth',5,'bastion:earth'),state)
  const damaged=absorbSingleFusionDamage(5,earth.guard)
  assert.equal(damaged.damage,0)
  assert.ok(damaged.guard.ward>0)
  assert.equal(absorbSingleFusionDamage(30,damaged.guard).damage,
    30-damaged.guard.ward)
})
test('Wind stun and Plant recovery do not overwrite other status fields',()=>{
  const wind=applySingleFusionHit(fusion('wind'),state)
  assert.equal(wind.status.enemyStunTurns,1)
  const plant=applySingleFusionHit(fusion('plant'),state)
  const round1=advanceSingleFusionRegen(90,100,plant.guard)
  assert.equal(round1.playerHp,92)
  const round2=advanceSingleFusionRegen(round1.playerHp,100,round1.guard)
  assert.equal(round2.playerHp,94)
  assert.equal(round2.guard.regenTurns,0)
  assert.equal(advanceSingleFusionRegen(0,100,plant.guard).playerHp,0)
})
test('no fusion context never adds a rider',()=>{
  assert.equal(applySingleFusionHit(null,state),null)
  assert.equal(absorbSingleFusionDamage(0,initialSingleFusionGuard()).damage,0)
})

test('Titan fortress counter retaliates only when shield absorbs real damage',()=>{
  const base={...initialSingleFusionGuard(),ward:12,counter:5}
  const first=absorbSingleFusionDamage(6,base)
  assert.equal(first.damage,0)
  assert.equal(first.reflected,5)
  assert.equal(first.guard.ward,6)
  const second=absorbSingleFusionDamage(10,first.guard)
  assert.equal(second.damage,4)
  assert.equal(second.reflected,5)
  assert.equal(second.guard.counter,0)
  assert.equal(absorbSingleFusionDamage(6,second.guard).reflected,0)
  assert.equal(absorbSingleFusionDamage(0,base).reflected,0)
})
