// Fuse exactly the three already-unlocked attacks of ONE active element.
// This is the classless elemental-user route, not a second class or element slot.
import { ELEMENTAL_ATTACKS, resolveElementalAttack } from './elementalAttacks.js'
import { getActiveFusion } from './classElementFusion.js'
import { scaleSkillAmount, getSkillLevel } from './skillLeveling.js'
import { FOE_STATUS_KEYS } from './tacticalFoeStatus.js'
export const TRIAD_MP_COST=20
export const TRIAD_AP_COST=2
export const TRIAD_COOLDOWN=4
const ENEMY_KEYS=new Set(FOE_STATUS_KEYS)

export function getElementalTriadAction(fusion) {
  if(fusion?.kind!=='triad'||fusion.key!=='triad:'+fusion.element)return null
  const level=Math.max(1,Math.min(10,Math.floor(Number(fusion.level)||1)))
  return {
    id:'elemental_triad_'+fusion.element,kind:'triad',element:fusion.element,
    label:fusion.element[0].toUpperCase()+fusion.element.slice(1)+' Triad Resonance',
    target:'enemy',attack:{from:[0,1,2],to:[0,1,2],cols:'any',
      shape:level>=8?'all':level>=5?'diamond2':'cross'},
    ap:TRIAD_AP_COST,mp:TRIAD_MP_COST,cooldown:TRIAD_COOLDOWN,
    components:[...ELEMENTAL_ATTACKS[fusion.element]],
  }
}
export function resolveElementalTriad(player,status={},ctx={}) {
  const fusion=getActiveFusion(player)
  const action=getElementalTriadAction(fusion)
  if(!action)return null
  let damage=0,heal=0
  const enemyStatus={},playerStatus={},components=[]
  // Each of the three original skill formulas contributes; the combined
  // cast has ONE MP charge and cooldown, not three individual charges.
  // Perfect Recall/refund modifiers remain untouched for regular spells.
  const baseStatus={...status,cfx_perfectRecall:false,cfx_refundMpHalf:false}
  for(const id of action.components){
    const effect=resolveElementalAttack(id,{...player,battle_skills:[id]},
      baseStatus,ctx)
    if(!effect)return null
    const level=getSkillLevel(player,id)
    damage+=Math.round(scaleSkillAmount(effect.enemyDamage,level)*.65)
    heal+=Math.round(scaleSkillAmount(effect.healPlayer,level)*.65)
    for(const [key,value] of Object.entries(effect.setStatus||{})){
      const dest=ENEMY_KEYS.has(key)?enemyStatus:playerStatus
      dest[key]=typeof value==='number'&&typeof dest[key]==='number'
        ?Math.max(value,dest[key]):value
    }
    components.push({id,label:effect.label})
  }
  return {...action,damage:Math.max(0,damage),heal:Math.max(0,heal),
    enemyStatus,playerStatus,components}
}
