import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CLASS_SKILL_TARGETING, ELEMENTAL_SKILL_TARGETING, getTacticalSkillRule, getProgressedTacticalSkillRule, canUseTacticalSkill } from './tacticalSkills.js'
import { ELEMENTAL_ATTACKS } from './elementalAttacks.js'
import * as ClassCombat from './classCombat.js'
import { CLASSES } from './classes.js'

test('all 30 elemental attacks have an explicit rule', () => {
  const ids=Object.values(ELEMENTAL_ATTACKS).flat()
  assert.equal(ids.length,30)
  for(const id of ids)assert.ok(ELEMENTAL_SKILL_TARGETING[id],id)
})
test('all current class action identifiers have explicit tactical targeting', () => {
  // Read the abilities through the existing class-combat API so this test
  // catches future class additions that lack metadata.
  const listed=new Set()
  for(const [key,cls] of Object.entries(CLASSES)) {
    const unlocked=cls.nodes.map(node=>key+':'+node.id)
    const actor={active_class:key,class_nodes_unlocked:unlocked,level:100,
      skill_points:999,skill_levels:{},class_nodes:unlocked}
    for(const skill of ClassCombat.getActiveClassSkills(actor,{})) listed.add(skill.id)
  }
  for(const id of listed)assert.ok(CLASS_SKILL_TARGETING[id],id+' has no tactical rule')
  assert.ok(listed.size>50)
})
test('close, mid, long and self have distinct range behavior', () => {
  const front={col:1,rank:0}, far={col:2,rank:2}
  assert.equal(canUseTacticalSkill('fury_slam',front,far),false)
  assert.equal(canUseTacticalSkill('fury_slam',front,{col:1,rank:0}),true)
  assert.equal(canUseTacticalSkill('water_skill_water_jet',front,{col:1,rank:1}),true)
  assert.equal(canUseTacticalSkill('water_skill_water_jet',front,far),false)
  assert.equal(canUseTacticalSkill('lightning_skill_lightning_strike',front,far),true)
  assert.equal(canUseTacticalSkill('the_throne',far,front),true)
  assert.equal(getTacticalSkillRule('wind_ultimate_tornado_field').target,'self')
  assert.equal(canUseTacticalSkill('future_unmapped_skill',front,far),true)
})

test('existing offensive skills expand footprints at levels 4, 7 and 10',()=>{
  const id='lightning_skill_lightning_strike'
  const levels=[1,3,4,6,7,9,10]
  assert.deepEqual(levels.map(level=>getProgressedTacticalSkillRule(id,level).shape),
    ['single','single','row','row','cross','cross','crossPlus'])
  assert.equal(getProgressedTacticalSkillRule('water_ultimate_tsunami',1).shape,'row')
  assert.equal(getProgressedTacticalSkillRule('water_ultimate_tsunami',7).shape,'rowPlus')
  assert.equal(getProgressedTacticalSkillRule('fire_ultimate_inferno_zone',7).shape,'all')
  assert.equal(getProgressedTacticalSkillRule('metal_mastery_annihilate',10).shape,'all')
})
test('support skills remain self-only and range restrictions still apply',()=>{
  for(const level of [1,4,7,10]){
    assert.equal(getProgressedTacticalSkillRule('the_throne',level).target,'self')
    assert.equal(getProgressedTacticalSkillRule('the_throne',level).shape,undefined)
    assert.equal(canUseTacticalSkill('fury_slam',{col:1,rank:0},{col:2,rank:2},level),false)
    assert.equal(canUseTacticalSkill('the_throne',{col:1,rank:0},null,level),true)
  }
})
