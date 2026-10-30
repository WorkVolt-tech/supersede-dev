import {test} from 'node:test'
import assert from 'node:assert/strict'
import { ELEMENT_TREES } from './elementsTree.js'
import { ELEMENTAL_ATTACKS } from './elementalAttacks.js'
import { getElementalTriadEligibility,unlockElementalTriad,getActiveFusion,
  unlockFusionPair,getFusionEligibility } from './classElementFusion.js'
import { getElementalTriadAction,resolveElementalTriad,
  TRIAD_MP_COST,TRIAD_COOLDOWN,TRIAD_AREA_CAPS,TRIAD_TECHNIQUES,
  getTriadSpecial,triadArmorPierce } from './elementalTriad.js'
function player(element='fire'){
  return {active_class:null,level:25,element,skill_points:5,
    defeated_bosses:[ELEMENT_TREES[element].bossKey],
    elemental_unlocked:ELEMENT_TREES[element].nodes.slice(1).map(n=>n.id),
    class_nodes_unlocked:[],fusion_unlocked:[],fusion_mastery:{},
    battle_skills:[],skill_levels:{}}
}
test('all 10 elemental paths fuse their 3 learned attack tiers into one slot',()=>{
  for(const element of Object.keys(ELEMENTAL_ATTACKS)){
    const p=player(element),eligible=getElementalTriadEligibility(p,element)
    assert.equal(eligible.ready,true,element)
    assert.equal(eligible.attacks.length,3)
    const upgrade=unlockElementalTriad(p,element)
    assert.deepEqual(upgrade.fusion_unlocked,['triad:'+element])
    assert.equal(upgrade.skill_points,3)
    const active=getActiveFusion({...p,...upgrade})
    assert.equal(active.kind,'triad')
    const action=getElementalTriadAction(active)
    assert.deepEqual(action.components,ELEMENTAL_ATTACKS[element])
    assert.equal(action.mp,TRIAD_MP_COST)
    assert.equal(action.cooldown,TRIAD_COOLDOWN)
    const outcome=resolveElementalTriad({...p,...upgrade},{},
      {atk:25,def:15,enemyDef:6,maxHp:160})
    assert.equal(outcome.components.length,3)
    assert.ok(outcome.damage>0,element)
    assert.equal(outcome.attack.shape,'cross')
  }
})
test('the same fusion slot cannot buy another triad or a class fusion',()=>{
  const fire=player('fire'),u=unlockElementalTriad(fire,'fire')
  assert.equal(unlockElementalTriad({...fire,...u},'water'),null)
  assert.equal(unlockElementalTriad({...fire,...u},'fire'),null)
  assert.equal(getActiveFusion({...fire,...u,element:'water'}),null)
  const classed={...fire,...u,active_class:'ghostblade',
    class_nodes_unlocked:['ghostblade:ghostblade_t1a','ghostblade:ghostblade_t1c']}
  assert.equal(getFusionEligibility(classed,'fire').lockedByOther,true)
  assert.equal(unlockFusionPair(classed,'fire'),null)
  assert.equal(getActiveFusion(classed),null)
})
test('classed characters cannot buy a triad, and all 19 nodes are required',()=>{
  const p=player()
  assert.equal(unlockElementalTriad({...p,level:24},'fire'),null)
  assert.equal(unlockElementalTriad({...p,active_class:'ghostblade'},'fire'),null)
  assert.equal(unlockElementalTriad({...p,elemental_unlocked:p.elemental_unlocked.slice(0,17)},'fire'),null)
  assert.equal(unlockElementalTriad({...p,skill_points:1},'fire'),null)
  assert.equal(unlockElementalTriad({...p,defeated_bosses:[]},'fire'),null)
})
test('three source skill levels modify their fused damage, not each other',()=>{
  const p=player(),base=unlockElementalTriad(p,'fire')
  const ready={...p,...base}
  const ordinary=resolveElementalTriad(ready,{}, {atk:25,enemyDef:5})
  const stronger=resolveElementalTriad({...ready,
    skill_levels:{fire_skill_fire_blast:10,fire_mastery_cinderstorm:10}},
    {},{atk:25,enemyDef:5})
  assert.ok(stronger.damage>ordinary.damage)
  assert.equal(ordinary.components.length,3)
  assert.ok(ordinary.playerStatus.infernoTurns>0)
  assert.ok(ordinary.enemyStatus.cfx_emberStacks>0)
  assert.equal(resolveElementalTriad(p,{}),null)
})

test('area progression trades per-target damage for an increasingly wide hit zone',()=>{
  const p=player('lightning'),unlock=unlockElementalTriad(p,'lightning')
  const variants=[
    {xp:0,level:1,shape:'cross'},
    {xp:32,level:5,shape:'diamond2'},
    {xp:77,level:8,shape:'all'},
  ]
  let lastTotal=0
  for(const variant of variants){
    const cast=resolveElementalTriad({...p,...unlock,
      fusion_mastery:{'triad:lightning':variant.xp}}, {},
      {atk:25,def:15,enemyDef:6,maxHp:160})
    assert.equal(cast.attack.shape,variant.shape)
    assert.ok(cast.damage<=Math.round(cast.peakDamage*TRIAD_AREA_CAPS[variant.shape]))
    assert.ok(cast.damage<=cast.summedDamage)
    assert.ok(cast.damage>=0)
    assert.equal(cast.components.length,3)
    assert.ok(cast.damage>0)
    lastTotal=cast.damage
  }
  assert.ok(lastTotal>0)
})
test('all ten triads have unique named techniques and distinct secondary effects',()=>{
  const expected={
    fire:'burning-ground',water:'tidal-recovery',lightning:'chain',
    arcane:'resonant-refund',shadow:'veil',earth:'stone-ward',
    wind:'gale',plant:'growth',metal:'armor-break',poison:'decay-spread',
  }
  assert.equal(new Set(Object.values(TRIAD_TECHNIQUES)).size,10)
  for(const element of Object.keys(ELEMENTAL_ATTACKS)){
    const p=player(element),unlock=unlockElementalTriad(p,element)
    const cast=resolveElementalTriad({...p,...unlock},{},
      {atk:25,def:15,enemyDef:6,maxHp:160})
    assert.equal(cast.special.kind,expected[element])
    assert.equal(cast.technique,TRIAD_TECHNIQUES[element])
    assert.equal(cast.mp,TRIAD_MP_COST)
    assert.equal(cast.cooldown,TRIAD_COOLDOWN)
    assert.ok(cast.special.detail)
  }
  assert.ok(getTriadSpecial('water',10,80).heal>getTriadSpecial('water',1,80).heal)
  assert.ok(getTriadSpecial('lightning',10,80).chainCount>
    getTriadSpecial('lightning',1,80).chainCount)
  assert.equal(getTriadSpecial('arcane',4,80).mpRefund,3)
  assert.equal(getTriadSpecial('shadow',4,80).dodge,true)
  assert.ok(getTriadSpecial('earth',10,80).ward>getTriadSpecial('earth',1,80).ward)
  assert.equal(getTriadSpecial('wind',5,80).galeTurns,4)
  assert.ok(getTriadSpecial('plant',5,80).regenAmount>0)
  assert.equal(getTriadSpecial('poison',5,80).extraDecay,1)
  assert.equal(triadArmorPierce(getTriadSpecial('metal',5,80),20),6)
  assert.equal(triadArmorPierce(getTriadSpecial('metal',5,80),100),12)
  assert.equal(triadArmorPierce(getTriadSpecial('fire',5,80),100),0)
})
test('fused attack formulas do not modify individual elemental slots or learned nodes',()=>{
  const p=player('plant'),unlock=unlockElementalTriad(p,'plant')
  const treeBefore=[...p.elemental_unlocked],slotsBefore=[...p.battle_skills]
  const original={...p,...unlock}
  const first=resolveElementalTriad(original,{}, {atk:30,maxHp:130})
  const second=resolveElementalTriad(original,{}, {atk:30,maxHp:130})
  assert.deepEqual(first,second)
  assert.deepEqual(p.elemental_unlocked,treeBefore)
  assert.deepEqual(p.battle_skills,slotsBefore)
  assert.ok(!('battle_skills' in unlock))
  assert.ok(!('elemental_unlocked' in unlock))
})
