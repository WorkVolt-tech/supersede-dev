import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getSkillLevel, getSkillUpgrade, scaleSkillAmount, skillUpgradeCost } from './skillLeveling.js'
test('upgrading one skill retains other skill levels and spends SP', () => {
  const player = {skill_points:3, skill_levels:{fire_skill_fire_blast:4, other:7}}
  const result = getSkillUpgrade(player, 'fire_skill_fire_blast')
  assert.equal(result.skill_levels.fire_skill_fire_blast, 5)
  assert.equal(result.skill_levels.other, 7)
  assert.equal(result.skill_points, 1)
  assert.equal(player.skill_levels.fire_skill_fire_blast, 4)
})
test('baseline, scaling and cap', () => {
  assert.equal(getSkillLevel({}, 'new'),1)
  assert.equal(scaleSkillAmount(100,1),100)
  assert.equal(scaleSkillAmount(100,10),145)
  assert.equal(scaleSkillAmount(100,50),145)
  assert.equal(getSkillUpgrade({skill_points:99,skill_levels:{hit:10}},'hit'),null)
  assert.equal(skillUpgradeCost(4),2)
})
