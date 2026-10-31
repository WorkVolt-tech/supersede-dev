import {test} from 'node:test'
import assert from 'node:assert/strict'
import {refundableSkillPoints,skillResetCost,skillResetUpdates} from './skillReset.js'
test('paid respec refunds node SP and removes only bonuses granted by refunded nodes',()=>{
 const player={level:3,gold:500,skill_points:1,skills_unlocked:['of1','of2','ofn1'],atk:30,battle_skills:['ofn1','other'],skill_levels:{ofn1:4}}
 const updates=skillResetUpdates(player)
 assert.equal(refundableSkillPoints(player),4)
 assert.equal(skillResetCost(player),200)
 assert.equal(updates.gold,300)
 assert.equal(updates.skill_points,5)
 assert.equal(updates.atk,19)
 assert.deepEqual(updates.battle_skills,['other'])
 assert.deepEqual(updates.skills_unlocked,[])
 assert.equal(player.skill_levels.ofn1,4)
})
test('respec refuses insufficient gold and unspent tree',()=>{
 assert.equal(skillResetUpdates({level:1,gold:50,skills_unlocked:['of1']}),null)
 assert.equal(skillResetUpdates({level:1,gold:500,skills_unlocked:[]}),null)
})
