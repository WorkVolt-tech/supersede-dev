import {test} from 'node:test'
import assert from 'node:assert/strict'
import {equippedNotableSkills,useNotableSkill,consumeWarboundBonus,SUPPORTED_NOTABLES,notableIncomingDamage,consumeNotableReflection,notableFreezeEnemy,applyNotableDebuff,tickNotableDebuff,notableEnemyAttackPenalty,learnedNotablePassives,notablePassiveOutgoing,notablePassiveIncoming,notablePassiveStagger,tickNotableSpellblade,notablePassiveStatBonus,activateNotableIronTide,advanceNotableTurn,notableIncomingDamage} from './loadoutCombat.js'
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

test('Hex Cannon poison ticks three times on the target, not the player',()=>{
 const effect=useNotableSkill('ofn5',{status:{},attack:12,enemyDef:2})
 const target=applyNotableDebuff({},effect)
 assert.equal(tickNotableDebuff(target),5)
 assert.equal(tickNotableDebuff(target),5)
 assert.equal(tickNotableDebuff(target),5)
 assert.equal(tickNotableDebuff(target),0)
})
test('Lockdown and Dread Pulse track per-enemy status',()=>{
 const target={}
 applyNotableDebuff(target,useNotableSkill('fln3',{status:{}}))
 assert.equal(target.notableSpeedPenalty,6)
 for(let i=0;i<4;i++)applyNotableDebuff(target,useNotableSkill('dcn6',{status:{}}))
 assert.equal(notableEnemyAttackPenalty(target),6)
 assert.equal(notableEnemyAttackPenalty({}),0)
})

test('only learned passives trigger, never unlearned tree nodes',()=>{
 const passives=learnedNotablePassives({skills_unlocked:['arn5','fln2','ofn1']})
 assert.equal(passives.has('arn5'),true)
 assert.equal(passives.has('dfn3'),false)
 assert.equal(notablePassiveOutgoing(passives,10,20,()=>0).damage,18)
})
test('Ghost Step avoids damage and counters',()=>{
 const passive=notablePassiveIncoming(new Set(['fln2']),{},20,30,()=>0)
 assert.equal(passive.damage,0)
 assert.equal(passive.reflect,15)
})
test('Retaliation requires three consecutive incoming hits',()=>{
 const status={},passives=new Set(['dfn5'])
 assert.equal(notablePassiveIncoming(passives,status,9,20).reflect,0)
 assert.equal(notablePassiveIncoming(passives,status,9,20).reflect,0)
 assert.equal(notablePassiveIncoming(passives,status,9,20).reflect,10)
 assert.equal(status.notableConsecutiveHits,0)
})

test('Spellblade applies a two-tick poison to the struck target',()=>{
 const target={}
 const result=notablePassiveOutgoing(new Set(['ofn3']),12,20,()=>0,target)
 assert.equal(result.damage,12)
 assert.equal(tickNotableSpellblade(target),3)
 assert.equal(tickNotableSpellblade(target),3)
 assert.equal(tickNotableSpellblade(target),0)
})
test('Stagger only interrupts if learned and its chance succeeds',()=>{
 assert.equal(notablePassiveStagger(new Set(),()=>0),false)
 assert.equal(notablePassiveStagger(new Set(['fln5']),()=>0),true)
 assert.equal(notablePassiveStagger(new Set(['fln5']),()=>.9),false)
})

test('Sharp Mind and Shade Walk give learned-only stat bonuses',()=>{
 const stats=notablePassiveStatBonus(new Set(['arn1','dcn4']),{insight:8})
 assert.equal(stats.attack,2)
 assert.equal(stats.speed,5)
 assert.equal(notablePassiveStatBonus(new Set(),{insight:8}).attack,0)
})
test('Iron Tide triggers once below half health and expires',()=>{
 const status={},p=new Set(['dfn1'])
 assert.equal(activateNotableIronTide(p,status,60,100),false)
 assert.equal(activateNotableIronTide(p,status,40,100),true)
 assert.equal(notableIncomingDamage(status,30),10)
 advanceNotableTurn(status);advanceNotableTurn(status)
 assert.equal(notableIncomingDamage(status,30),30)
 assert.equal(activateNotableIronTide(p,status,30,100),false)
})
