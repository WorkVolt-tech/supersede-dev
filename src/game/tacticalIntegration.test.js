import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chooseTacticalEnemyAction, getTacticalAttacks, weaponMasteryLevel } from './tacticalGrid.js'
import { getSkillLevel, getSkillUpgrade, scaleSkillAmount } from './skillLeveling.js'

test('persisted weapon and skill mastery have separate progression', () => {
  const player={skill_levels:{fire_skill_fire_blast:3}, weapon_mastery:{sword:500000},skill_points:2}
  assert.equal(weaponMasteryLevel(player.weapon_mastery.sword),100)
  assert.equal(getSkillLevel(player,'fire_skill_fire_blast'),3)
  const update=getSkillUpgrade(player,'fire_skill_fire_blast')
  assert.equal(update.skill_levels.fire_skill_fire_blast,4)
  assert.equal(player.weapon_mastery.sword,500000)
  assert.equal(scaleSkillAmount(100,4),115)
})

test('level 100 sword gains specialized areas but fallback remains universal', () => {
  const options=getTacticalAttacks('sword',[],500000)
  assert.ok(options.some(a=>a.id==='masterArc' && a.shape==='rowPlus'))
  assert.ok(options.some(a=>a.id==='masterBurst' && a.shape==='all'))
  assert.ok(options.some(a=>a.id==='pulse' && a.fallback))
})
