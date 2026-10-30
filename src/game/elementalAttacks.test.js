import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ELEMENT_TREES } from './elementsTree.js'
import {
  ELEMENTAL_ATTACKS, countLearnedElementNodes, getElementalAttackProgress,
  canUseElementalAttack, equipElementalAttack, getEquippedElementalAttack,
  resolveElementalAttack,
} from './elementalAttacks.js'

const makePlayer = (element='fire', count=19) => {
  const tree=ELEMENT_TREES[element]
  return {
    element, defeated_bosses:[tree.bossKey],
    elemental_unlocked:tree.nodes.filter(n=>n.type!=='start').slice(0,Math.max(0,count-1)).map(n=>n.id),
    battle_skills:[],
  }
}

test('all ten elements have three registered attacks with effects', () => {
  assert.equal(Object.keys(ELEMENTAL_ATTACKS).length,10)
  for (const [element,skills] of Object.entries(ELEMENTAL_ATTACKS)) {
    assert.equal(skills.length,3)
    for (const id of skills) {
      const player={...makePlayer(element),battle_skills:[id]}
      const result=resolveElementalAttack(id,player,{}, {atk:30,def:15,enemyDef:8,maxHp:120})
      assert.ok(result, id+' must resolve')
      assert.ok(Number.isFinite(result.enemyDamage),id+' damage')
      assert.ok(Number.isFinite(result.healPlayer),id+' heal')
      assert.ok(result.cooldown>=0,id+' cooldown')
    }
  }
})

test('attack tier thresholds match original 7, 13 and 19 nodes', () => {
  for (const [nodes,expected] of [[1,[false,false,false]],[6,[false,false,false]],[7,[true,false,false]],[12,[true,false,false]],[13,[true,true,false]],[18,[true,true,false]],[19,[true,true,true]]]) {
    const p=makePlayer('fire',nodes)
    assert.equal(countLearnedElementNodes(p,'fire'),nodes)
    assert.deepEqual(getElementalAttackProgress(p,'fire').map(s=>s.unlocked),expected)
  }
})

test('only one elemental attack can be equipped, preserving unrelated skills', () => {
  const p={...makePlayer('fire'),battle_skills:['some_class_skill','water_skill_water_jet']}
  assert.deepEqual(equipElementalAttack(p,'fire_skill_fire_blast'),{
    battle_skills:['fire_skill_fire_blast','some_class_skill'],
  })
  assert.deepEqual(p.battle_skills,['some_class_skill','water_skill_water_jet'])
})

test('a full four-slot loadout replaces only the first slot when equipping', () => {
  const p={...makePlayer('fire'),battle_skills:['a','b','c','d']}
  assert.deepEqual(equipElementalAttack(p,'fire_mastery_cinderstorm'),{
    battle_skills:['fire_mastery_cinderstorm','b','c','d'],
  })
})

test('cannot equip an attack from a locked or underdeveloped tree', () => {
  const p=makePlayer('fire',6)
  assert.equal(equipElementalAttack(p,'fire_skill_fire_blast'),null)
  assert.equal(equipElementalAttack(p,'water_skill_water_jet'),null)
})

test('equipped attacks remain unusable when another element is active', () => {
  const p={...makePlayer('fire'),battle_skills:['fire_skill_fire_blast']}
  assert.equal(canUseElementalAttack(p,'fire_skill_fire_blast'),true)
  assert.equal(getEquippedElementalAttack(p).id,'fire_skill_fire_blast')
  assert.equal(canUseElementalAttack({...p,element:'water'},'fire_skill_fire_blast'),false)
  assert.equal(resolveElementalAttack('fire_skill_fire_blast',{...p,element:'water'},{}),null)
})

test('Standing Wave echoes one Lux attack and is then consumed', () => {
  const p={...makePlayer('arcane'),battle_skills:['arcane_skill_resonant_bolt']}
  const baseline=resolveElementalAttack('arcane_skill_resonant_bolt',p,{}, {atk:30})
  const echoed=resolveElementalAttack('arcane_skill_resonant_bolt',p,{cfx_standingWave:4},{atk:30})
  assert.equal(echoed.enemyDamage,baseline.enemyDamage*4)
  assert.equal(echoed.setStatus.cfx_standingWave,0)
})

test('Perfect Recall makes the next attack cooldown-free and clears the flag', () => {
  const p={...makePlayer('arcane'),battle_skills:['arcane_skill_resonant_bolt']}
  const recall=resolveElementalAttack('arcane_skill_resonant_bolt',p,{cfx_perfectRecall:true},{atk:30})
  assert.equal(recall.cooldown,0)
  assert.equal(recall.setStatus.cfx_perfectRecall,false)
  assert.ok(recall.messages.some(m=>m.includes('Perfect Recall')))
})

test('attack effects include damage, healing, DoT, stuns, and three-turn buffs', () => {
  const run=(element,key)=>resolveElementalAttack(key,{...makePlayer(element),battle_skills:[key]}, {},{atk:30})
  assert.equal(run('fire','fire_ultimate_inferno_zone').setStatus.infernoTurns,3)
  assert.equal(run('wind','wind_ultimate_tornado_field').setStatus.cfx_tornadoTurns,3)
  assert.equal(run('metal','metal_ultimate_iron_domain').setStatus.cfx_ironDomainTurns,3)
  assert.equal(run('earth','earth_ultimate_earthquake').setStatus.enemyStunTurns,1)
  assert.ok(run('plant','plant_skill_thorn_volley').healPlayer>0)
  assert.ok(run('poison','poison_mastery_pandemic').setStatus.cfx_longDecayStacks>0)
})
