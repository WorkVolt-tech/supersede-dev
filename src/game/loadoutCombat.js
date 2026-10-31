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
    case 'ofn5':status.loadoutPoisonTurns=3;return {messages:['Hex Cannon poisons the target.'],damage:Math.max(1,atk-def)}
    case 'of_ks1':return buff('loadoutBloodthirst')
    case 'of_ks2':return buff('loadoutSpellSurge')
    case 'dfn4':return ctx.playerHp<ctx.playerMaxHp*.3?(status.loadoutFortressTurns=1,{messages:['Fortress activated.'],damage:15}):{messages:['Fortress requires HP below 30%.'],damage:0}
    case 'df_ks1':status.loadoutDefenseTurns=2;return buff('loadoutAbsorb')
    case 'df_ks2':status.loadoutDefenseTurns=1;return buff('loadoutReflect',.4)
    case 'fln3':return buff('loadoutLockdown')
    case 'fl_ks1':status.loadoutNextCrit=1;return buff('loadoutUntargetable')
    case 'fl_ks2':status.loadoutDoubleStrike=true;return buff('loadoutFreeze')
    case 'arn2':return buff('loadoutForesight')
    case 'arn6':return buff('loadoutNextCrit')
    case 'ar_ks1':return buff('loadoutSixthSense')
    case 'ar_ks2':return Math.random()<.5?{messages:['Chaos Engine erupts.'],damage:atk*2}:buff('loadoutAbsorb')
    case 'dcn1':return buff('loadoutUntargetable')
    case 'dcn6':return buff('loadoutDreadPulse',3)
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
  if(status.loadoutAbsorb){delete status.loadoutAbsorb;return 0}
  if(status.loadoutUntargetable){delete status.loadoutUntargetable;return 0}
  if(status.loadoutForesight){delete status.loadoutForesight;return Math.ceil(damage*.1)}
  if(status.loadoutSixthSense){delete status.loadoutSixthSense;return Math.ceil(damage*.2)}
  return damage
}
export function notableFreezeEnemy(status) {
  if(!status.loadoutFreeze)return false
  delete status.loadoutFreeze
  return true
}
