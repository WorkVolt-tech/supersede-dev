import {test} from 'node:test'
import assert from 'node:assert/strict'
import {ELEMENT_TREES} from './elementsTree.js'
import {CLASSES} from './classes.js'
import {getFusionEligibility,unlockFusionPair,getActiveFusion,
  fusionMasteryLevel,awardFusionPractice,getFusionRider,getFusionSignature,
  selectFusionChainTargets,FUSION_MP_COST} from './classElementFusion.js'

function player(cls='ghostblade',element='fire') {
  return {level:25,skill_points:6,active_class:cls,element,
    defeated_bosses:[ELEMENT_TREES[element].bossKey],
    class_nodes_unlocked:['ghostblade:ghostblade_t1a','ghostblade:ghostblade_t1c',
      cls+':'+cls+'_t1a',cls+':'+cls+'_t1c'],
    elemental_unlocked:ELEMENT_TREES[element].nodes.slice(1,7).map(n=>n.id),
    fusion_unlocked:[],fusion_mastery:{}}
}
test('every class can independently fuse with every element',()=>{
  for(const cls of Object.keys(CLASSES))for(const element of Object.keys(ELEMENT_TREES)){
    const p=player(cls,element)
    const availability=getFusionEligibility(p,element)
    assert.equal(availability.ready,true,cls+':'+element)
    assert.equal(availability.canUnlock,true)
    const upgrade=unlockFusionPair(p,element)
    assert.equal(upgrade.skill_points,4)
    assert.deepEqual(p.fusion_unlocked,[])
    assert.equal(upgrade.fusion_unlocked.length,1)
    assert.equal(getActiveFusion({...p,...upgrade})?.element,element)
  }
})
test('fusion requires real class and element progression, then a separate purchase',()=>{
  const p=player()
  assert.equal(getActiveFusion(p),null)
  assert.equal(getFusionEligibility({...p,level:24},'fire').ready,false)
  assert.equal(getFusionEligibility({...p,class_nodes_unlocked:[]},'fire').ready,false)
  assert.equal(getFusionEligibility({...p,elemental_unlocked:[]},'fire').ready,false)
  assert.equal(getFusionEligibility({...p,defeated_bosses:[]},'fire').ready,false)
  assert.equal(unlockFusionPair({...p,skill_points:1},'fire'),null)
  const unlocked=unlockFusionPair(p,'fire')
  assert.equal(unlockFusionPair({...p,...unlocked},'fire'),null)
  assert.equal(FUSION_MP_COST,3)
})
test('switching elements keeps the previous combination mastery and unlock',()=>{
  const fire=player()
  const unlock=unlockFusionPair(fire,'fire')
  const p={...fire,...unlock,fusion_mastery:{'ghostblade:fire':45}}
  assert.equal(getActiveFusion(p)?.level,6)
  assert.equal(getActiveFusion({...p,element:'water'}),null)
  assert.equal(getActiveFusion(p)?.key,'ghostblade:fire')
  const result=awardFusionPractice(p.fusion_mastery,'ghostblade:water',9)
  assert.equal(result['ghostblade:fire'],45)
  assert.equal(result['ghostblade:water'],6)
  assert.equal(fusionMasteryLevel(117),10)
})
test('10 element riders are distinct and signature upgrades are pair-specific',()=>{
  const types={}
  for(const element of Object.keys(ELEMENT_TREES)){
    const rider=getFusionRider({element,level:1,key:'ghostblade:'+element})
    assert.ok(rider,element)
    types[element]=rider
  }
  assert.equal(types.fire.ember,1)
  assert.ok(types.water.heal>0)
  assert.ok(types.lightning.chainDamage>0)
  assert.ok(types.arcane.bonusDamage>0)
  assert.equal(types.shadow.dodge,true)
  assert.ok(types.earth.ward>0)
  assert.equal(types.wind.stun,1)
  assert.ok(types.plant.regenTurns>0)
  assert.ok(types.metal.bonusDamage>0)
  assert.equal(types.poison.decay,1)
  const phantom=getFusionRider({element:'fire',level:5,key:'ghostblade:fire'})
  assert.equal(phantom.ember,2)
  assert.equal(getFusionSignature({element:'fire',level:5,key:'ghostblade:fire'}),'Phantom Inferno')
  assert.equal(getFusionSignature({element:'fire',level:5,key:'bastion:fire'}),null)
  assert.equal(getFusionRider({element:'earth',level:5,key:'bastion:earth'}).ward,
    2*getFusionRider({element:'earth',level:5,key:'ghostblade:earth'}).ward)
})
test('lightning chooses distinct nearest surviving additional foes',()=>{
  const units=[{id:'a',hp:10,col:1,rank:0},{id:'b',hp:10,col:0,rank:0},
    {id:'c',hp:5,col:2,rank:0},{id:'d',hp:0,col:1,rank:1}]
  assert.deepEqual(selectFusionChainTargets(units,'a',[],2).map(u=>u.id),['b','c'])
  assert.deepEqual(selectFusionChainTargets(units,'a',['b'],2).map(u=>u.id),['c'])
  assert.deepEqual(selectFusionChainTargets(units,'none',[],2),[])
})

test('buying fusion does not rewrite a class tree or elemental tree',()=>{
  const p=player('bastion','earth')
  const cls=[...p.class_nodes_unlocked],nodes=[...p.elemental_unlocked]
  const unlock=unlockFusionPair(p,'earth')
  assert.deepEqual(p.class_nodes_unlocked,cls)
  assert.deepEqual(p.elemental_unlocked,nodes)
  assert.ok(!('class_nodes_unlocked' in unlock))
  assert.ok(!('elemental_unlocked' in unlock))
  assert.ok(!('weapon_mastery' in unlock))
  assert.ok(!('skill_levels' in unlock))
})
