import {NOTABLE_SKILLS_REGISTRY} from './skillsRegistry.js'
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {equippedNotableSkills,useNotableSkill,consumeWarboundBonus,SUPPORTED_NOTABLES,notableIncomingDamage,consumeNotableReflection,notableFreezeEnemy,applyNotableDebuff,tickNotableDebuff,notableEnemyAttackPenalty,learnedNotablePassives,notablePassiveOutgoing,notablePassiveIncoming,notablePassiveStagger,tickNotableSpellblade,notablePassiveStatBonus,activateNotableIronTide,advanceNotableTurn,notablePassiveDefend,notablePassiveBattleStart,notablePassiveResolveHit,enforceNotableControlImmunity,notableEnemyCritChance,notableTargeting,notableOnKill,notableAttackBonus,notableSkillDamage,notableCriticalMultiplier,notableAttackMultiplier,notableArmorPierce,consumeNotableCrit} from './loadoutCombat.js'
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

test('Absorption heals after three hits and consumes the trigger',()=>{
 const p=new Set(['dfn2']),status={}
 for(let i=0;i<3;i++)assert.equal(notablePassiveResolveHit(p,status,12),12)
 assert.equal(notablePassiveDefend(p,status,60,100).heal,15)
 assert.equal(notablePassiveDefend(p,status,60,100).heal,0)
})
test('Ancient Root shields twenty percent of max health',()=>{
 const p=new Set(['dc_ks2']),status={}
 notablePassiveBattleStart(p,status,100)
 assert.equal(notablePassiveResolveHit(p,status,12),0)
 assert.equal(notablePassiveResolveHit(p,status,12),4)
 assert.equal(notablePassiveResolveHit(p,status,12),12)
})

test('control immunity leaves offensive stun intact',()=>{const st={playerStunTurns:2,enemyStunTurns:1};enforceNotableControlImmunity(new Set(['dcn5']),st);assert.equal(st.playerStunTurns,0);assert.equal(st.enemyStunTurns,1)})
test('Prescience lowers critical chance',()=>{assert.equal(notableEnemyCritChance(new Set(['arn4']),{insight:5},.25),.15)})

test('offensive notable skills have legal battlefield patterns',()=>{for(const id of ['ofn4','ofn5','fln3','fln6','dcn6']){const pattern=notableTargeting(id);assert.equal(pattern.target,'enemy');assert.equal(pattern.shape,'single')}assert.equal(notableTargeting('ofn6'),null)})

test('Flicker belongs to the player and stacks with Ricochet without contaminating enemy poison',()=>{
 const owner={notableFlickerReady:true},enemy={}
 const hit=notablePassiveOutgoing(new Set(['fln4','arn5','ofn3']),20,25,()=>0,enemy,owner)
 assert.equal(hit.damage,50)
 assert.equal(owner.notableFlickerReady,undefined)
 assert.equal(enemy.notableFlickerReady,undefined)
 assert.equal(enemy.notableSpellbladePoisonTurns,2)
 assert.equal(notablePassiveOutgoing(new Set(['fln4']),20,25,()=>1,enemy,owner).damage,20)
})

test('all 20 registered active notables have a non-null action result',()=>{
 const active=Object.entries(NOTABLE_SKILLS_REGISTRY).filter(([,skill])=>skill.type==='active')
 assert.equal(active.length,20)
 for(const [id] of active){
  const status={}
  const result=useNotableSkill(id,{status,enemyDef:4,attack:30,enemyHp:20,enemyMaxHp:100,playerHp:20,playerMaxHp:100})
  assert.ok(SUPPORTED_NOTABLES.has(id),id+' absent from battle adapter')
  assert.ok(result&&Array.isArray(result.messages)&&Number.isFinite(result.damage),id+' missing executable result')
 }
})

test('Bloodthirst heals only after a kill and buffs two turns',()=>{
 const status={}
 useNotableSkill('of_ks1',{status})
 assert.equal(notableAttackBonus(status,20),0)
 const result=notableOnKill(status,100)
 assert.equal(result.heal,20)
 assert.equal(notableAttackBonus(status,20),10)
 advanceNotableTurn(status)
 assert.equal(notableAttackBonus(status,20),10)
 advanceNotableTurn(status)
 assert.equal(notableAttackBonus(status,20),0)
 assert.equal(notableOnKill(status,100).heal,0)
})

test('Spell Surge is consumed by damaging skills, not weapon strikes',()=>{
 const status={}
 useNotableSkill('of_ks2',{status})
 assert.equal(notableAttackMultiplier(status),1)
 assert.equal(status.loadoutSpellSurge,true)
 assert.equal(notableSkillDamage(status,20),30)
 assert.equal(notableSkillDamage(status,20),20)
})
test('Mind Pierce guarantees its own 1.75 critical multiplier',()=>{
 const status={}
 useNotableSkill('arn6',{status})
 assert.equal(notableCriticalMultiplier(status),1.75)
 assert.equal(notableCriticalMultiplier(status),1.5)
})
test('Reaper Form pierces defense once and maintains attack boost',()=>{
 const status={}
 useNotableSkill('dc_ks1',{status})
 assert.equal(notableArmorPierce(status,24),24)
 assert.equal(notableArmorPierce(status,24),0)
 assert.equal(notableAttackBonus(status,40),20)
})

test('Mind Pierce remains a guaranteed critical until its multiplier is consumed',()=>{
 const status={}
 useNotableSkill('arn6',{status})
 assert.equal(consumeNotableCrit(status),true)
 assert.equal(notableCriticalMultiplier(status),1.75)
 assert.equal(consumeNotableCrit(status),false)
})
test('Nightshroud returns half attack damage after preventing its next hit',()=>{
 const status={}
 useNotableSkill('dcn1',{status,attack:30})
 assert.equal(consumeNotableReflection(status,20),15)
 assert.equal(notableIncomingDamage(status,20),0)
 assert.equal(consumeNotableReflection(status,20),0)
})

test('Spell Surge boosts a damaging skill with partial defense penetration',()=>{
 const status={}
 useNotableSkill('of_ks2',{status})
 assert.equal(notableSkillDamage(status,20,10),38)
 assert.equal(notableSkillDamage(status,20,10),20)
})
test('Nightshroud cannot activate after the first round',()=>{
 const status={}
 const late=useNotableSkill('dcn1',{status,round:2,attack:30})
 assert.equal(late.consumed,false)
 assert.equal(status.loadoutUntargetable,undefined)
 const first=useNotableSkill('dcn1',{status,round:1,attack:30})
 assert.equal(first.damage,0)
 assert.equal(status.loadoutUntargetable,1)
})

test('Amplifier adds forty percent of effective Power and stacks with Sharp Mind',()=>{
 const passives=new Set(['ofn2','arn1'])
 const bonus=notablePassiveStatBonus(passives,{power:25,insight:6})
 assert.equal(bonus.attack,12)
 assert.equal(notablePassiveStatBonus(new Set(),{power:25,insight:6}).attack,0)
})
test('Spell Surge penetrates half DEF and consumes its bonus on damage',()=>{
 const status={}
 useNotableSkill('of_ks2',{status})
 assert.equal(notableSkillDamage(status,20,10),38)
 assert.equal(notableSkillDamage(status,20,10),20)
})
