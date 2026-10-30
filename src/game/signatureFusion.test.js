import {test} from 'node:test'
import assert from 'node:assert/strict'
import {getFusionSignatureAction,planFusionSignature,canCastFusionSignature,
  SIGNATURE_COOLDOWN,SIGNATURE_MP_COST} from './signatureFusion.js'

const fusion=(key,level)=>({key,level})
const units=[
  {id:'a',hp:30,col:1,rank:0},
  {id:'b',hp:30,col:0,rank:0},
  {id:'c',hp:30,col:2,rank:0},
  {id:'d',hp:30,col:1,rank:1},
  {id:'e',hp:30,col:0,rank:2},
  {id:'dead',hp:0,col:2,rank:1},
]
test('signatures are specific to their purchased pairing and fusion level',()=>{
  assert.equal(getFusionSignatureAction(fusion('ghostblade:fire',4)),null)
  assert.equal(getFusionSignatureAction(fusion('ghostblade:earth',10)),null)
  const phantom=getFusionSignatureAction(fusion('ghostblade:fire',5))
  const titan=getFusionSignatureAction(fusion('bastion:earth',5))
  const thunder=getFusionSignatureAction(fusion('wrathborn:lightning',5))
  assert.equal(phantom.label,'Phantom Inferno')
  assert.equal(titan.label,"Titan's Fortress")
  assert.equal(thunder.label,'Thunderous Fury')
  assert.deepEqual([phantom.ap,phantom.mp,phantom.cooldown],[2,8,3])
  assert.equal(SIGNATURE_MP_COST,8)
  assert.equal(SIGNATURE_COOLDOWN,3)
  assert.equal(titan.target,'self')
  assert.equal(getFusionSignatureAction(fusion('ghostblade:fire',8)).attack.shape,'diamond2')
  assert.equal(getFusionSignatureAction(fusion('ghostblade:fire',10)).attack.shape,'all')
})
test('Phantom Inferno burns positional cross and persists as a field',()=>{
  const action=getFusionSignatureAction(fusion('ghostblade:fire',5))
  const plan=planFusionSignature(action,units,'a')
  assert.equal(plan.valid,true)
  assert.deepEqual(plan.hits.map(h=>h.targetId),['a','b','c','d'])
  assert.equal(plan.squares.length,4)
  assert.equal(action.fieldTurns,2)
  assert.ok(action.fieldDamage>0)
  assert.equal(planFusionSignature(action,units,'dead').valid,false)
})
test('Thunderous Fury chains through distinct occupied squares with falloff',()=>{
  const action=getFusionSignatureAction(fusion('wrathborn:lightning',5))
  const plan=planFusionSignature(action,units,'a')
  assert.equal(plan.valid,true)
  assert.deepEqual(plan.hits.map(h=>h.targetId),['a','b','d'])
  assert.ok(plan.hits[0].damage>plan.hits[1].damage)
  assert.ok(plan.hits[1].damage>plan.hits[2].damage)
  assert.equal(plan.targets.length,3)
  assert.equal(planFusionSignature(action,units,'missing').valid,false)
  const expanded=getFusionSignatureAction(fusion('wrathborn:lightning',10))
  assert.equal(planFusionSignature(expanded,units,'a').hits.length,5)
})
test('Titan fortress covers hero side only and builds larger barriers with mastery',()=>{
  const basic=getFusionSignatureAction(fusion('bastion:earth',5))
  const wide=getFusionSignatureAction(fusion('bastion:earth',8))
  assert.equal(planFusionSignature(basic,units,null,{col:1,rank:0}).squares.length,4)
  assert.equal(planFusionSignature(wide,units,null,{col:1,rank:0}).squares.length,7)
  assert.ok(wide.ward>basic.ward)
  assert.ok(wide.counter>0)
})
test('signature is never cast without enough AP, MP or ready cooldown',()=>{
  const action=getFusionSignatureAction(fusion('ghostblade:fire',5))
  const opts={enabled:true,ap:2,mp:8,cooldown:0,target:units[0]}
  assert.equal(canCastFusionSignature(action,opts),true)
  assert.equal(canCastFusionSignature(action,{...opts,enabled:false}),false)
  assert.equal(canCastFusionSignature(action,{...opts,ap:1}),false)
  assert.equal(canCastFusionSignature(action,{...opts,mp:7}),false)
  assert.equal(canCastFusionSignature(action,{...opts,cooldown:1}),false)
  assert.equal(canCastFusionSignature(action,{...opts,target:null}),false)
  const titan=getFusionSignatureAction(fusion('bastion:earth',5))
  assert.equal(canCastFusionSignature(titan,{...opts,target:null}),true)
})
