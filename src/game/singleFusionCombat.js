// A small adapter for the existing single-enemy/boss combat engine.
// The original attack, class hooks, enemy phases and boss scripts run first.
// Only the optional class-element infusion effect is added here.
import { getFusionRider } from './classElementFusion.js'

export function initialSingleFusionGuard() {
  return {ward:0,dodge:false,regenTurns:0,regenAmount:0}
}

export function applySingleFusionHit(fusion,{foeHp,playerHp,maxPlayerHp,status={},guard=initialSingleFusionGuard()}={}) {
  const rider=getFusionRider(fusion)
  if(!rider)return null
  const nextStatus={...status}
  const nextGuard={...guard}
  let nextFoeHp=Math.max(0,Number(foeHp)||0)
  let nextPlayerHp=Math.max(0,Number(playerHp)||0)
  let bonusDamage=rider.bonusDamage
  // There are no secondary enemies in this encounter. Lightning's follow-up
  // arcs strike the current enemy instead, once per allowed chain.
  if(rider.chainDamage)bonusDamage+=rider.chainDamage*rider.chainCount
  nextFoeHp=Math.max(0,nextFoeHp-bonusDamage)
  if(rider.ember)nextStatus.cfx_emberStacks=
    Math.min(5,(nextStatus.cfx_emberStacks||0)+rider.ember)
  if(rider.decay)nextStatus.cfx_longDecayStacks=
    Math.min(5,(nextStatus.cfx_longDecayStacks||0)+rider.decay)
  if(rider.stun)nextStatus.enemyStunTurns=
    Math.max(nextStatus.enemyStunTurns||0,rider.stun)
  if(rider.heal)nextPlayerHp=Math.min(maxPlayerHp,nextPlayerHp+rider.heal)
  if(rider.ward)nextGuard.ward=Math.max(nextGuard.ward,rider.ward)
  if(rider.dodge)nextGuard.dodge=true
  if(rider.regenTurns) {
    nextGuard.regenTurns=rider.regenTurns
    nextGuard.regenAmount=rider.regenAmount
  }
  return {foeHp:nextFoeHp,playerHp:nextPlayerHp,
    status:nextStatus,guard:nextGuard,bonusDamage,rider}
}

export function absorbSingleFusionDamage(damage,guard=initialSingleFusionGuard()) {
  const next={...guard}
  let remaining=Math.max(0,Math.round(Number(damage)||0))
  const messages=[]
  if(remaining>0&&next.dodge){
    remaining=0;next.dodge=false
    messages.push('Shadow Fusion evades an incoming strike.')
  }else if(remaining>0&&next.ward>0) {
    const amount=Math.min(remaining,next.ward)
    remaining-=amount;next.ward-=amount
    messages.push('Earth Fusion absorbs '+amount+' damage.')
  }
  return {damage:remaining,guard:next,messages}
}

export function advanceSingleFusionRegen(hp,maxHp,guard=initialSingleFusionGuard()) {
  const next={...guard}
  let playerHp=Math.max(0,Number(hp)||0)
  let healed=0
  if(playerHp>0&&next.regenTurns>0){
    healed=Math.max(0,Math.min(maxHp-playerHp,next.regenAmount))
    playerHp+=healed
    next.regenTurns-=1
  }
  return {playerHp,healed,guard:next}
}
