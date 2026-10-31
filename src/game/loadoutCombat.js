import { NOTABLE_SKILLS_REGISTRY } from './skillsRegistry.js'

// A learned notable is equipped independently of weapon attacks and class abilities.
export function equippedNotableSkills(player={}) {
  const learned=new Set(player.skills_unlocked||[])
  return (player.battle_skills||[])
    .filter(id=>learned.has(id)&&NOTABLE_SKILLS_REGISTRY[id]?.type==='active')
    .map(id=>({id,...NOTABLE_SKILLS_REGISTRY[id]}))
}

// These effects have explicit execution support in both battle engines.
// Other saved notables remain visible, but cannot consume AP without an effect.
export const SUPPORTED_NOTABLES = new Set(Object.entries(NOTABLE_SKILLS_REGISTRY).filter(([,v])=>v.type==='active').map(([id])=>id))
export function useNotableSkill(id,ctx) {
  if(!SUPPORTED_NOTABLES.has(id)) return null
  if(id==='ofn1'){
    ctx.status.loadoutWarbound=true
    return {messages:['Warbound primed: your next weapon attack deals 15% ATK bonus damage.'],damage:0}
  }
  if(id==='ofn6'){
    ctx.status.loadoutPredatorTurns=2
    return {messages:['Predator activated: +20 ATK for 2 turns.'],damage:0}
  }
  const status=ctx.status, atk=Math.max(1,ctx.attack||10), def=ctx.enemyDef||0
  const buff=(key,value=1)=>{status[key]=value;return {messages:[NOTABLE_SKILLS_REGISTRY[id].label+' activated.'],damage:0}}
  switch(id){
    case 'ofn4':return {messages:['Executioner strikes.'],damage:Math.round(atk*(ctx.enemyHp<ctx.enemyMaxHp*.3?1.25:1))}
    case 'ofn5':return {messages:['Hex Cannon poisons the target.'],damage:Math.max(1,atk-def),debuff:{poisonTurns:3,poisonDamage:5}}
    case 'of_ks1':return buff('loadoutBloodthirst')
    case 'of_ks2':return buff('loadoutSpellSurge')
    case 'dfn4':return ctx.playerHp<ctx.playerMaxHp*.3?(status.loadoutFortressTurns=1,{messages:['Fortress activated.'],damage:15}):{messages:['Fortress requires HP below 30%.'],damage:0}
    case 'df_ks1':status.loadoutDefenseTurns=2;return buff('loadoutAbsorb')
    case 'df_ks2':return buff('loadoutReflect',.4)
    case 'fln3':return {messages:['Lockdown reduces enemy speed by 6.'],damage:0,debuff:{speedPenalty:6}}
    case 'fl_ks1':status.loadoutNextCrit=1;return buff('loadoutUntargetable')
    case 'fl_ks2':status.loadoutDoubleStrike=true;return buff('loadoutFreeze')
    case 'arn2':return buff('loadoutForesight')
    case 'arn6':return buff('loadoutNextCrit')
    case 'ar_ks1':return buff('loadoutSixthSense')
    case 'ar_ks2':return Math.random()<.5?{messages:['Chaos Engine erupts.'],damage:atk*2}:buff('loadoutAbsorb')
    case 'dcn1':return buff('loadoutUntargetable')
    case 'dcn6':return {messages:['Dread Pulse weakens the enemy attack.'],damage:0,debuff:{attackPenalty:2}}
    case 'dc_ks1':return buff('loadoutReaper')
  }
  if(id==='fln6'){
    return {messages:['Momentum launches a ground spike.'],damage:Math.max(1,20-Math.floor((ctx.enemyDef||0)*0.3))}
  }
  return null
}
export function consumeWarboundBonus(status,atk) {
  if(!status.loadoutWarbound)return 0
  delete status.loadoutWarbound
  return Math.max(1,Math.round(Math.max(1,atk)*0.15))
}

export function advanceNotableTurn(status) {
  for(const key of ['loadoutDefenseTurns','loadoutFortressTurns'])if(status[key]>0)status[key]--
  if(status.loadoutPredatorTurns>0) {
    status.loadoutPredatorTurns--
    if(!status.loadoutPredatorTurns)delete status.loadoutPredatorTurns
  }
}
export function notableAttackBonus(status,base=0) {
  return (status.loadoutPredatorTurns>0?20:0)+(status.loadoutReaper?Math.round(base*.5):0)
}
export function notableAttackMultiplier(status) {
  if(status.loadoutDoubleStrike){delete status.loadoutDoubleStrike;return 2}
  if(status.loadoutSpellSurge){delete status.loadoutSpellSurge;return 1.5}
  return 1
}
export function consumeNotableCrit(status) {
  if(!status.loadoutNextCrit)return false
  delete status.loadoutNextCrit
  return true
}
export function notableIncomingDamage(status,damage) {
  if(damage<=0)return 0
  if(status.loadoutAbsorb){delete status.loadoutAbsorb;return 0}
  if(status.loadoutUntargetable){delete status.loadoutUntargetable;return 0}
  if(status.loadoutForesight){delete status.loadoutForesight;return Math.ceil(damage*.1)}
  if(status.loadoutSixthSense){delete status.loadoutSixthSense;return Math.ceil(damage*.2)}
  if(status.loadoutDefenseTurns>0)damage=Math.max(0,damage-30)
  else if(status.loadoutFortressTurns>0)damage=Math.max(0,damage-20)
  else if(status.loadoutReflect>0)damage=Math.max(0,damage-15)
  return damage
}
export function consumeNotableReflection(status,damage) {
  if(!status.loadoutReflect||damage<=0)return 0
  const amount=Math.round(damage*status.loadoutReflect)
  delete status.loadoutReflect
  return amount
}
export function notableFreezeEnemy(status) {
  if(!status.loadoutFreeze)return false
  delete status.loadoutFreeze
  return true
}

/** The same per-foe status format is used in single and group battles. */
export function applyNotableDebuff(status={},effect) {
  if(!effect?.debuff)return status
  const debuff=effect.debuff
  if(debuff.poisonTurns){
    status.notablePoisonTurns=Math.max(status.notablePoisonTurns||0,debuff.poisonTurns)
    status.notablePoisonDamage=debuff.poisonDamage
  }
  if(debuff.speedPenalty)status.notableSpeedPenalty=Math.max(status.notableSpeedPenalty||0,debuff.speedPenalty)
  if(debuff.attackPenalty)status.notableAttackPenalty=Math.min(6,(status.notableAttackPenalty||0)+debuff.attackPenalty)
  return status
}
export function tickNotableDebuff(status={}) {
  const damage=status.notablePoisonTurns>0?(status.notablePoisonDamage||5):0
  if(status.notablePoisonTurns>0)status.notablePoisonTurns--
  return damage
}
export function notableEnemyAttackPenalty(status={}) {
  return status.notableAttackPenalty||0
}

/** Passive triggers are limited to learned skills, never merely displayed nodes. */
export function learnedNotablePassives(player={}) {
 const learned=new Set(player.skills_unlocked||[])
 return new Set([...learned].filter(id=>NOTABLE_SKILLS_REGISTRY[id]?.type==='passive'))
}
export function notablePassiveOutgoing(passives,damage,atk=0,rng=Math.random,status={}) {
 let bonus=0;const messages=[]
 if(passives.has('ofn3')&&rng()<.15){status.notableSpellbladePoisonTurns=2;messages.push('Spellblade poisons the enemy.')}
 if(status.notableFlickerReady){bonus+=damage;delete status.notableFlickerReady;messages.push('Flicker doubles damage.')}
 if(passives.has('arn5')&&rng()<.20){bonus=Math.max(1,Math.round(atk*.4));messages.push('Ricochet strikes again for '+bonus+'.')}
 return {damage:Math.max(0,damage)+bonus,messages}
}
export function notablePassiveIncoming(passives,status,damage,atk=0,rng=Math.random) {
 const messages=[];let reflect=0,stun=false
 if(damage>0&&(passives.has('fln2')||passives.has('dcn2'))&&rng()<.15){
   damage=0
   reflect=Math.max(1,Math.round(atk*.5))
   if(passives.has('fln4'))status.notableFlickerReady=true
   messages.push('Ghost Step dodges and counters for '+reflect+'.')
 }else if(damage>0){
   if(passives.has('dfn3')&&rng()<.20){stun=true;messages.push('Thorns stun the attacker.')}
   if(passives.has('dfn5')){
     status.notableConsecutiveHits=(status.notableConsecutiveHits||0)+1
     if(status.notableConsecutiveHits>=3){
       reflect=Math.max(1,Math.round(atk*.5))
       status.notableConsecutiveHits=0
       messages.push('Retaliation counters for '+reflect+'.')
     }
   }
 }
 return {damage,reflect,stun,messages}
}

export function notablePassiveStagger(passives,rng=Math.random){return passives.has('fln5')&&rng()<.2}
export function tickNotableSpellblade(status={}){if(!status.notableSpellbladePoisonTurns)return 0;status.notableSpellbladePoisonTurns--;return 3}
