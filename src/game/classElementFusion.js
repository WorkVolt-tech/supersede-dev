// Optional class + active-element infusion. No class or element tree is changed.
// Pair unlocks and mastery are independent of class skills and weapon mastery.
import { CLASSES } from './classes.js'
import { ELEMENT_TREES, isElementUnlocked } from './elementsTree.js'
import { getActiveElement } from './activeElement.js'
import { countLearnedElementNodes, ELEMENTAL_ATTACKS, ELEMENTAL_ATTACK_THRESHOLDS } from './elementalAttacks.js'

export const FUSION_UNLOCK_COST = 2
// A character chooses exactly one fusion, ever: one class + one element OR
// one active-element triad on the classless elemental-user path.
export const MAX_CHARACTER_FUSIONS = 1
export function committedFusionKey(player) {
  return (player?.fusion_unlocked||[]).find(key=>typeof key==='string')||null
}
export function elementalTriadKey(element) {
  return ELEMENTAL_ATTACKS[element] ? 'triad:'+element : null
}
export const FUSION_MP_COST = 3
export const FUSION_MIN_LEVEL = 25
export const FUSION_MIN_CLASS_NODES = 2
export const FUSION_MIN_ELEMENT_NODES = 7
export const FUSION_MAX_PRACTICE_PER_FIGHT = 6
export const FUSION_MASTERY_THRESHOLDS = [0,5,12,21,32,45,60,77,96,117]

export function fusionPairKey(classKey,elementKey) {
  return CLASSES[classKey] && ELEMENT_TREES[elementKey]
    ? classKey+':'+elementKey : null
}
export function fusionMasteryLevel(xp=0) {
  const amount=Math.max(0,Math.floor(Number(xp)||0))
  return FUSION_MASTERY_THRESHOLDS.reduce(
    (level,threshold)=>amount>=threshold?level+1:level,0)
}
export function getFusionEligibility(player,elementKey) {
  const cls=player?.active_class
  const pair=fusionPairKey(cls,elementKey)
  const nodes=(player?.class_nodes_unlocked||[]).filter(
    node=>typeof node==='string'&&node.startsWith(cls+':')).length
  const elementNodes=pair&&isElementUnlocked(elementKey,player)
    ?countLearnedElementNodes(player,elementKey):0
  const committed=committedFusionKey(player)
  const unlocked=Boolean(pair&&committed===pair)
  const ready=Boolean(pair&&Number(player?.level||0)>=FUSION_MIN_LEVEL&&
    nodes>=FUSION_MIN_CLASS_NODES&&
    elementNodes>=FUSION_MIN_ELEMENT_NODES)
  return {pair,unlocked,ready,committed,lockedByOther:Boolean(committed&&committed!==pair),
    level:player?.level||0,
    classNodes:nodes,elementNodes,
    canUnlock:ready&&!committed&&(player?.skill_points||0)>=FUSION_UNLOCK_COST}
}
export function unlockFusionPair(player,elementKey) {
  const eligibility=getFusionEligibility(player,elementKey)
  if(!eligibility.canUnlock)return null
  return {
    fusion_unlocked:[eligibility.pair],
    skill_points:(player.skill_points||0)-FUSION_UNLOCK_COST,
  }
}
export function getElementalTriadEligibility(player,element) {
  const pair=elementalTriadKey(element)
  const committed=committedFusionKey(player)
  const count=pair&&isElementUnlocked(element,player)
    ?countLearnedElementNodes(player,element):0
  const attacks=ELEMENTAL_ATTACKS[element]||[]
  const ready=Boolean(pair&&!player?.active_class&&
    (Number(player?.level)||0)>=FUSION_MIN_LEVEL&&
    count>=ELEMENTAL_ATTACK_THRESHOLDS[2]&&attacks.length===3)
  const unlocked=Boolean(pair&&committed===pair)
  return {pair,committed,ready,unlocked,elementNodes:count,attacks,
    lockedByOther:Boolean(committed&&committed!==pair),
    canUnlock:ready&&!committed&&(player?.skill_points||0)>=FUSION_UNLOCK_COST}
}
export function unlockElementalTriad(player,element) {
  const eligibility=getElementalTriadEligibility(player,element)
  if(!eligibility.canUnlock)return null
  return {
    fusion_unlocked:[eligibility.pair],
    skill_points:(player.skill_points||0)-FUSION_UNLOCK_COST,
  }
}
export function getActiveFusion(player) {
  const element=getActiveElement(player)
  if(!element)return null
  if(!player?.active_class) {
    const triad=getElementalTriadEligibility(player,element)
    if(!triad.unlocked||!triad.ready)return null
    const xp=Math.max(0,Math.floor(Number(player.fusion_mastery?.[triad.pair])||0))
    return {key:triad.pair,classKey:null,kind:'triad',element,
      level:fusionMasteryLevel(xp),xp}
  }
  const eligibility=getFusionEligibility(player,element)
  if(!eligibility.unlocked||!eligibility.ready)return null
  const xp=Math.max(0,Math.floor(Number(player.fusion_mastery?.[eligibility.pair])||0))
  return {key:eligibility.pair,classKey:player.active_class,kind:'class-element',element,
    level:fusionMasteryLevel(xp),xp}
}
export function awardFusionPractice(mastery,pair,successfulUses=1) {
  if(!pair)return {...(mastery||{})}
  const uses=Math.max(0,Math.min(FUSION_MAX_PRACTICE_PER_FIGHT,
    Math.floor(Number(successfulUses)||0)))
  const old=Math.max(0,Math.floor(Number(mastery?.[pair])||0))
  return {...(mastery||{}),[pair]:old+uses}
}
export function getFusionSignature(fusion) {
  if(!fusion||fusion.level<5)return null
  const signatures={
    'ghostblade:fire':'Phantom Inferno',
    'bastion:earth':"Titan's Fortress",
    'wrathborn:lightning':'Thunderous Fury',
  }
  return signatures[fusion.key]||null
}

// The skill/weapon hit is resolved by the original combat engine first.
// This additive rider never bypasses AP, target legality or existing skill
// cooldowns. Every element contributes its own identifiable minor effect.
export function getFusionRider(fusion) {
  if(!fusion||fusion.kind==='triad')return null
  const tier=Math.max(1,Math.min(10,fusion.level))
  const signature=getFusionSignature(fusion)
  const rider={element:fusion.element,label:signature||'Fusion Infusion',
    bonusDamage:0,heal:0,ward:0,regenTurns:0,regenAmount:0,
    ember:0,decay:0,stun:0,chainDamage:0,chainCount:0,dodge:false}
  switch(fusion.element) {
    case 'fire':rider.ember=signature?2:1;break
    case 'water':rider.heal=2+Math.ceil(tier/3);break
    case 'lightning':
      rider.chainDamage=2+Math.ceil(tier/2)
      rider.chainCount=signature?2:1;break
    case 'arcane':rider.bonusDamage=2+Math.ceil(tier/2);break
    case 'shadow':rider.dodge=true;break
    case 'earth':rider.ward=(3+Math.ceil(tier/2))*(signature?2:1);break
    case 'wind':rider.stun=1;break
    case 'plant':rider.regenTurns=2;rider.regenAmount=1+Math.ceil(tier/3);break
    case 'metal':rider.bonusDamage=3+Math.ceil(tier/2);break
    case 'poison':rider.decay=1;break
    default:return null
  }
  return rider
}

export function selectFusionChainTargets(units,fromId,alreadyHit=[],limit=1) {
  const origin=units.find(u=>u.id===fromId)
  if(!origin)return []
  const hit=new Set(alreadyHit)
  hit.add(fromId)
  const remaining=units.filter(u=>u.hp>0&&!hit.has(u.id))
    .sort((a,b)=>
      (Math.abs(a.col-origin.col)+Math.abs(a.rank-origin.rank))-
      (Math.abs(b.col-origin.col)+Math.abs(b.rank-origin.rank))||
      a.id.localeCompare(b.id))
  return remaining.slice(0,Math.max(0,limit))
}
