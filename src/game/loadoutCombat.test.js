import {test} from 'node:test'
import assert from 'node:assert/strict'
import {equippedNotableSkills,useNotableSkill,consumeWarboundBonus,SUPPORTED_NOTABLES,notableIncomingDamage,consumeNotableReflection,notableFreezeEnemy} from './loadoutCombat.js'
test('only saved, learned, active notable skills appear in combat loadout',()=>{
 const p={skills_unlocked:['ofn1','fln6','ofn2'],battle_skills:['ofn1','fln6','ofn2','nonexistent']}
 assert.deepEqual(equippedNotableSkills(p).map(s=>s.id),['ofn1','fln6'])
})
test('Warbound boosts exactly one subsequent weapon hit',()=>{
 const status={}
 const result=useNotableSkill('ofn1',{status,enemyDef:10})
 assert.equal(result.damage,0)
 assert.equal(consumeWarboundBonus(status,30),5)
 assert.equal(consumeWarboundBonus(status,30),0)
})
test('Momentum applies its own explicit armor-aware damage',()=>{
 assert.equal(useNotableSkill('fln6',{status:{},enemyDef:10}).damage,17)
 assert.equal(useNotableSkill('fln6',{status:{},enemyDef:0}).damage,20)
 assert.equal(useNotableSkill('ofn6',{status:{},enemyDef:0}).damage,0)
 assert.equal(SUPPORTED_NOTABLES.has('ofn6'),true)
})

test('defensive notable abilities intercept real incoming damage',()=>{
 const block={}
 useNotableSkill('df_ks1',{status:block})
 assert.equal(notableIncomingDamage(block,35),0)
 assert.equal(notableIncomingDamage(block,35),5)
 const mirror={}
 useNotableSkill('df_ks2',{status:mirror})
 assert.equal(consumeNotableReflection(mirror,50),20)
 assert.equal(consumeNotableReflection(mirror,50),0)
 assert.equal(notableIncomingDamage(mirror,50),50)
 const foresight={}
 useNotableSkill('arn2',{status:foresight})
 assert.equal(notableIncomingDamage(foresight,40),4)
 assert.equal(notableIncomingDamage(foresight,40),40)
})
test('Time Lock stops exactly one enemy attack',()=>{
 const status={}
 useNotableSkill('fl_ks2',{status})
 assert.equal(notableFreezeEnemy(status),true)
 assert.equal(notableFreezeEnemy(status),false)
})
