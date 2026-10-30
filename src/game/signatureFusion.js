// Optional Lv5 class+element signature techniques; never edit existing trees.
// Each is an independent, 2-AP active, not an automatic elemental-class skill.
import { getTacticalAffectedSquares } from './tacticalGrid.js'
import { getFusionSignature } from './classElementFusion.js'
import { getElementalTriadAction } from './elementalTriad.js'

export const SIGNATURE_AP_COST=2
export const SIGNATURE_MP_COST=8
export const SIGNATURE_COOLDOWN=3
const ENEMY_RANGE={from:[0,1,2],to:[0,1,2],cols:'any'}

export function getFusionSignatureAction(fusion) {
  const triad=getElementalTriadAction(fusion)
  if(triad)return triad
  const name=getFusionSignature(fusion)
  if(!name)return null
  const level=Math.max(5,Math.min(10,Math.floor(Number(fusion.level)||5)))
  const large=level>=8,ultimate=level>=10
  if(fusion.key==='ghostblade:fire')return {
    id:'phantom_inferno',label:name,kind:'phantom',target:'enemy',
    attack:{...ENEMY_RANGE,shape:ultimate?'all':large?'diamond2':'cross'},
    damage:4+level,fieldDamage:3+Math.floor(level/2),fieldTurns:2,
    ap:SIGNATURE_AP_COST,mp:SIGNATURE_MP_COST,cooldown:SIGNATURE_COOLDOWN,
  }
  if(fusion.key==='bastion:earth')return {
    id:'titans_fortress',label:name,kind:'titan',target:'self',
    // The protected area is on the player's half; never target foes.
    attack:{shape:ultimate?'all':large?'diamond2':'cross'},
    ward:12+2*level,counter:3+Math.floor(level/2),
    ap:SIGNATURE_AP_COST,mp:SIGNATURE_MP_COST,cooldown:SIGNATURE_COOLDOWN,
  }
  if(fusion.key==='wrathborn:lightning')return {
    id:'thunderous_fury',label:name,kind:'thunder',target:'enemy',
    attack:{...ENEMY_RANGE,shape:ultimate?'all':large?'diamond2':'cross'},
    damage:7+level,hits:ultimate?5:large?4:3,stun:1,
    ap:SIGNATURE_AP_COST,mp:SIGNATURE_MP_COST,cooldown:SIGNATURE_COOLDOWN,
  }
  return null
}

export function planFusionSignature(action,units,targetId,hero={col:1,rank:0}) {
  if(!action)return {valid:false,squares:[],hits:[],targets:[]}
  if(action.target==='self')return {
    valid:true,squares:getTacticalAffectedSquares(action.attack,hero),
    hits:[],targets:[],
  }
  const target=units.find(u=>u.id===targetId&&u.hp>0)
  if(!target)return {valid:false,squares:[],hits:[],targets:[]}
  const squares=getTacticalAffectedSquares(action.attack,target)
  const inside=unit=>squares.some(pos=>pos.col===unit.col&&pos.rank===unit.rank)
  const targets=units.filter(unit=>unit.hp>0&&inside(unit))
  if(action.kind==='phantom'||action.kind==='triad')return {
    valid:true,squares,targets,
    hits:targets.map(u=>({targetId:u.id,damage:action.damage})),
  }
  if(action.kind==='thunder'){
    const visited=new Set([targetId])
    const hits=[{targetId,damage:action.damage}]
    let previous=target
    for(let i=1;i<action.hits;i++){
      const next=targets.filter(u=>!visited.has(u.id)).sort((a,b)=>
        (Math.abs(a.col-previous.col)+Math.abs(a.rank-previous.rank))-
        (Math.abs(b.col-previous.col)+Math.abs(b.rank-previous.rank))||
        a.id.localeCompare(b.id))[0]
      if(!next)break
      hits.push({targetId:next.id,damage:Math.max(1,Math.round(action.damage*.7**i))})
      visited.add(next.id)
      previous=next
    }
    return {valid:true,squares,targets:targets.filter(u=>visited.has(u.id)),hits}
  }
  return {valid:false,squares:[],targets:[],hits:[]}
}

// The signature costs are additional to normal class/element unlocks.
// Used in both React combat screens and by progression tests.
export function canCastFusionSignature(action,{enabled=false,ap=0,mp=0,cooldown=0,
  target=null}={}) {
  return Boolean(action&&enabled&&ap>=action.ap&&mp>=action.mp&&cooldown===0&&
    (action.target==='self'||Boolean(target?.hp>0)))
}
