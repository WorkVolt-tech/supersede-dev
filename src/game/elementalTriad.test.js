import {test} from 'node:test'
import assert from 'node:assert/strict'
import { ELEMENT_TREES } from './elementsTree.js'
import { ELEMENTAL_ATTACKS } from './elementalAttacks.js'
import { getElementalTriadEligibility,unlockElementalTriad,getActiveFusion,
  unlockFusionPair,getFusionEligibility } from './classElementFusion.js'
import { getElementalTriadAction,resolveElementalTriad,
  TRIAD_MP_COST,TRIAD_COOLDOWN } from './elementalTriad.js'
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
