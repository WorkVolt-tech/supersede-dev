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
export const TRIAD_DAMAGE_SHARE=.65
export const TRIAD_AREA_CAPS=Object.freeze({cross:1.3,diamond2:1.2,all:1.1})
export const TRIAD_TECHNIQUES=Object.freeze({
  fire:'Cinder Convergence',
  water:'Abyssal Torrent',
  lightning:'Storm Circuit',
  arcane:'Resonance Collapse',
  shadow:'Umbral Trinity',
  earth:'Tectonic Ward',
  wind:'Cyclone Weave',
  plant:'Verdant Rebirth',
  metal:'Iron Cataclysm',
  poison:'Plague Bloom',
})

// The source skills supply the primary damage, healing and statuses.
// A secondary effect gives every elemental-user triad its own combat
// purpose. These bonuses are NOT new learnable class/element tree nodes.
export function getTriadSpecial(element,level,damage) {
  const tier=Math.max(1,Math.min(10,Math.floor(Number(level)||1)))
  switch(element){
    case 'fire':return {kind:'burning-ground',detail:'Ember + persistent fire'}
    case 'water':return {kind:'tidal-recovery',heal:4+2*tier,detail:'Heal + stagger'}
    case 'lightning':return {kind:'chain',chainDamage:Math.max(2,Math.round(damage*.2)),
      chainCount:tier>=8?2:1,detail:'Chain to nearby foes'}
    case 'arcane':return {kind:'resonant-refund',mpRefund:2+Math.floor(tier/3),
      detail:'Recover a little MP'}
    case 'shadow':return {kind:'veil',dodge:true,detail:'Evade next incoming hit'}
    case 'earth':return {kind:'stone-ward',ward:8+2*tier,detail:'Create a stone ward'}
    case 'wind':return {kind:'gale',galeTurns:tier>=5?4:3,
      detail:'Reduce incoming damage during a vortex'}
    case 'plant':return {kind:'growth',regenTurns:2,regenAmount:2+Math.ceil(tier/3),
      detail:'Regenerate HP for two turns'}
    case 'metal':return {kind:'armor-break',armorPierceRatio:.3,armorPierceCap:12,
      detail:'Pierce part of each target’s armor'}
    case 'poison':return {kind:'decay-spread',extraDecay:1,
      detail:'Spread an additional Decay stack'}
    default:return null
  }
}

export function triadArmorPierce(special,armor=0) {
  if(special?.kind!=='armor-break')return 0
  return Math.min(special.armorPierceCap,
    Math.max(0,Math.round((Number(armor)||0)*special.armorPierceRatio)))
}

export function getElementalTriadAction(fusion) {
  if(fusion?.kind!=='triad'||fusion.key!=='triad:'+fusion.element)return null
  const level=Math.max(1,Math.min(10,Math.floor(Number(fusion.level)||1)))
  return {
    id:'elemental_triad_'+fusion.element,kind:'triad',element:fusion.element,
    label:fusion.element[0].toUpperCase()+fusion.element.slice(1)+' Triad Resonance',
    technique:TRIAD_TECHNIQUES[fusion.element],
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
  let summedDamage=0,peakDamage=0,heal=0
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
    const scaled=Math.max(0,Math.round(scaleSkillAmount(effect.enemyDamage,level)))
    peakDamage=Math.max(peakDamage,scaled)
    summedDamage+=Math.round(scaled*TRIAD_DAMAGE_SHARE)
    heal+=Math.round(scaleSkillAmount(effect.healPlayer,level)*TRIAD_DAMAGE_SHARE)
    for(const [key,value] of Object.entries(effect.setStatus||{})){
      const dest=ENEMY_KEYS.has(key)?enemyStatus:playerStatus
      dest[key]=typeof value==='number'&&typeof dest[key]==='number'
        ?Math.max(value,dest[key]):value
    }
    components.push({id,label:effect.label})
  }
  // Area coverage increases at mastery 5/8; keep damage per target
  // proportionate so full-board casts don't replace normal elemental skills.
  const damage=Math.min(summedDamage,
    Math.round(peakDamage*TRIAD_AREA_CAPS[action.attack.shape]))
  const special=getTriadSpecial(action.element,Math.max(1,fusion.level),damage)
  return {...action,damage:Math.max(0,damage),
    heal:heal+(special?.heal||0),special,peakDamage,summedDamage,
    enemyStatus,playerStatus,components}
}
