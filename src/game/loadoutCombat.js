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
export const SUPPORTED_NOTABLES = new Set(['ofn1','fln6'])
export function useNotableSkill(id,ctx) {
  if(!SUPPORTED_NOTABLES.has(id)) return null
  if(id==='ofn1'){
    ctx.status.loadoutWarbound=true
    return {messages:['Warbound primed: your next weapon attack deals 15% ATK bonus damage.'],damage:0}
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
