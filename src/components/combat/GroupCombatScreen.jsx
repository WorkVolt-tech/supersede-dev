// Explicit Chapter 1 multi-enemy encounters. Kept separate from CombatScreen
// so bosses and existing one-on-one fights retain their mature story scripts.
import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useInventoryStore } from '../../store/useInventoryStore'
import * as ClsCombat from '../../game/classCombat'
import { initEnemyState, resolveEnemyTurn } from '../../game/enemyAI'
import { calcATK, calcDEF, calcSPD, calcMaxHp, getCombatPlayer, getEffectiveStats } from '../../game/playerStats'
import { resistMult, reflectFraction, critChanceBonus, critDamageBonus } from '../../game/elementalBonuses'
import { grantXp } from '../../game/progression'
import { grantLoot } from '../../game/loot'
import { persistCombatResult } from '../../game/combatPersistence'
import { equipmentSubtype } from '../../game/equipmentSlots'
import { getSkillLevel, scaleSkillAmount } from '../../game/skillLeveling'
import { getTacticalSkillRule, canUseTacticalSkill } from '../../game/tacticalSkills'
import { getTacticalAttacks, tacticalWeaponType, isTacticalTargetValid,
  getTacticalAffectedSquares, chooseTacticalEnemyAction,
  weaponMasteryLevel, awardWeaponMastery } from '../../game/tacticalGrid'
import { createTacticalGroup, applyGroupAttack, nextAliveTarget,
  makeGroupField, advanceGroupFields, planGroupMultiHits,
  groupKeystoneHitDamages } from '../../game/tacticalGroups'
import { withFoeStatus, advanceFoeStatuses, enemyActionBudget } from '../../game/tacticalFoeStatus'
import { getUnlockedKeystones, applyKeystone } from '../../game/elementalKeystones'
import { getEquippedElementalAttack, canUseElementalAttack, getAttackMpCost, resolveElementalAttack } from '../../game/elementalAttacks'
import { getMaxCombatMp, getCombatMpRegen, recoverCombatMp, clampCombatMp } from '../../game/combatMp'
import { advanceKeystoneCooldowns, applyKeystoneStatuses, applyStonebornDefend,
  resolveKeystoneDefense, resolveKeystoneStrike, resolveKeystoneRegen,
  stonebornArmorPierce } from '../../game/keystoneCombat'
import './CombatScreen.css'

// The legacy elemental formulas supply single-target damage. For group fights
// a few clearly area-named attacks splash neighboring occupied grid cells;
// the other 20+ elemental and class effects keep their original single target
// or self behavior. We do not alter their damage/MP/cooldown definitions.
const GROUP_AREAS = {
  fire_mastery_cinderstorm:'cross', fire_ultimate_inferno_zone:'cross',
  lightning_ultimate_thunderstorm:'cross', lightning_mastery_tempest:'cross',
  earth_ultimate_earthquake:'cross', earth_mastery_tectonic:'cross',
  water_ultimate_tsunami:'row', water_mastery_maelstrom:'cross',
  wind_mastery_cyclone:'row', poison_mastery_pandemic:'cross',
  poison_skill_blight_nova:'cross', shadow_skill_umbral_burst:'cross',
  plant_mastery_bloom:'cross', metal_mastery_annihilate:'column',
  arcane_mastery_resonance:'cross',
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))

function Battlefield({ foes, hero, focused, pattern, fields, canMove, onMove, onFocus }) {
  const target=nextAliveTarget(foes,focused)
  const area=target&&pattern&&isTacticalTargetValid(pattern,hero,target)
    ?getTacticalAffectedSquares(pattern,target):[]
  function sideCells(side) {
    const ranks=side==='enemy'?[2,1,0]:[0,1,2]
    return ranks.flatMap(rank=>[0,1,2].map(col=>{
      const foe=side==='enemy'?foes.find(f=>f.hp>0&&f.col===col&&f.rank===rank):null
      const mine=side==='hero'&&hero.rank===rank&&hero.col===col
      const step=side==='hero'&&!mine&&canMove&&
        Math.abs(hero.rank-rank)+Math.abs(hero.col-col)===1
      const inRange=Boolean(foe&&pattern&&isTacticalTargetValid(pattern,hero,foe))
      const selected=Boolean(foe&&foe.id===focused)
      const splash=side==='enemy'&&area.some(p=>p.rank===rank&&p.col===col)
      const hazard=side==='enemy'&&fields.some(f=>f.squares.some(
        p=>p.rank===rank&&p.col===col))
      return <button key={side+rank+col} type="button"
        className={['combat-grid-cell',side==='enemy'?'foe':'ally',
          foe||mine?'occupied':'',selected?'selected-foe':'',
          inRange?'attackable':'',
          splash?'splash':'',hazard?'hazard':'',step?'movable':''].join(' ')}
        disabled={side==='enemy'?!foe:!step}
        aria-pressed={side==='enemy'&&foe?foe.id===focused:undefined}
        aria-label={foe?foe.name+' '+foe.hp+' HP · '+
          (inRange?'in range':'out of range'):mine?'You':('Empty '+(rank+1)+'-'+(col+1))}
        onClick={()=>side==='enemy'?onFocus(foe.id):onMove({col,rank})}>
        <span>{foe?foe.icon:mine?'🧑':'·'}</span>
        <small>{foe?'#'+foe.id.split('-')[1]+' '+foe.hp+' HP':mine?'YOU':['FRONT','MID','REAR'][rank]}</small>
      </button>
    }))
  }
  return <div className="combat-grid-field">
    <div className="combat-grid-caption">ENEMIES · SELECT A LIVING TARGET</div>
    <div className="combat-grid-board">{sideCells('enemy')}</div>
    <div className="combat-grid-divider">⚔</div>
    <div className="combat-grid-board">{sideCells('hero')}</div>
    <div className="combat-grid-caption">YOU · MOVE ONE SQUARE FOR 1 AP</div>
  </div>
}

export default function GroupCombatScreen({ enemyData, onWin, onLose, onEscape }) {
  const player=usePlayerStore(s=>s.player)
  const updatePlayer=usePlayerStore(s=>s.updatePlayer)
  const inventory=useInventoryStore(s=>s.items)
  const loadInventory=useInventoryStore(s=>s.loadInventory)
  const equipped=inventory.filter(i=>i.equipped_slot)
  const legendary=new Set(equipped.map(i=>i.item_key))
  const effective=getEffectiveStats(player,equipped)
  const combatPlayer=getCombatPlayer(player,equipped)
  const maxHp=calcMaxHp(player,equipped)
  const mpMax=getMaxCombatMp(combatPlayer)
  const mpRegen=getCombatMpRegen(combatPlayer)
  const weapon=equipped.find(i=>i.equipped_slot==='mainhand')
  const weaponType=tacticalWeaponType(weapon?equipmentSubtype(weapon):null)
  const weaponKit=getTacticalAttacks(weaponType,[],(player.weapon_mastery||{})[weaponType]||0)

  const foesRef=useRef(createTacticalGroup(enemyData))
  const [foes,setFoes]=useState(foesRef.current)
  const [focus,setFocus]=useState(foesRef.current[0].id)
  const [selectedAttack,setSelectedAttack]=useState(null)
  const attack=weaponKit.find(a=>a.id===selectedAttack)||weaponKit[0]
  const [hero,setHero]=useState({col:1,rank:0})
  const heroRef=useRef(hero)
  const [ap,setAp]=useState(2)
  const apRef=useRef(2)
  const roundStartedRef=useRef(false)
  const defendingRef=useRef(false)
  const legendaryTurnRef=useRef(0)
  const busyRef=useRef(false)
  const [busy,setBusy]=useState(false)
  const hpRef=useRef(player.hp??maxHp)
  const [hp,setHp]=useState(hpRef.current)
  const mpRef=useRef(mpMax)
  const [mp,setMp]=useState(mpMax)
  const [result,setResult]=useState(null)
  const [log,setLog]=useState(['Encounter: '+enemyData.groupSize+' enemies advance.'])
  const [saveError,setSaveError]=useState('')
  const [saving,setSaving]=useState(false)
  const [keyCooldowns,setKeyCooldowns]=useState({})
  const [elemCooldowns,setElemCooldowns]=useState({})
  const castKeyRef=useRef(null)
  const castElementRef=useRef(null)
  const masteryHitsRef=useRef(0)
  const statusRef=useRef({})
  const dbUpdatesRef=useRef({})
  const pendingRef=useRef(null)
  const aliveRef=useRef(true)
  const completionTimerRef=useRef(null)
  const enemyStatesRef=useRef(Object.fromEntries(foesRef.current.map(u=>[u.id,initEnemyState(u)])))
  const foeStatusesRef=useRef({})
  const fieldsRef=useRef([])
  const enemyDamageBudgetRef=useRef(enemyActionBudget(enemyData.atk,enemyData.groupSize))
  const enemyCopiesRef=useRef(Object.fromEntries(foesRef.current.map(u=>[u.id,{...u,name:u.name.replace(/ \d+$/,'')}])))

  function note(message){setLog(prev=>[String(message),...prev].slice(0,35))}
  function updateFoes(next){foesRef.current=next;setFoes(next)}
  function updateHp(value){hpRef.current=Math.max(0,Math.min(maxHp,value));setHp(hpRef.current)}
  function updateMp(value){mpRef.current=clampCombatMp(value,mpMax);setMp(mpRef.current)}
  // All enemy debuffs belong to the selected unit. Player buffs remain
  // in statusRef, so existing class and elemental hooks still work.
  function forFoe(id,fn){return withFoeStatus(statusRef.current,foeStatusesRef.current,id,fn)}
  function onFoeDefeated(dead){
    note(dead.name+' defeated.')
    const kill=ClsCombat.onKill(combatPlayer,statusRef.current,dead)
    kill?.messages?.forEach(note)
    if(kill?.dbUpdates)Object.assign(dbUpdatesRef.current,kill.dbUpdates)
  }
  function propagateAreaStatus(changes,hitUnits,targetId){
    if(!changes)return
    for(const unit of hitUnits){
      if(unit.id===targetId)continue
      const status=foeStatusesRef.current[unit.id]||{}
      for(const key of ['enemyStunTurns','cfx_longDecayStacks','cfx_emberStacks'])
        if(changes[key]>0)status[key]=Math.max(status[key]||0,changes[key])
      foeStatusesRef.current[unit.id]=status
    }
  }

  useEffect(()=>{
    aliveRef.current=true
    const start=ClsCombat.onCombatStart(combatPlayer,statusRef.current)
    if(start?.messages?.length)start.messages.forEach(note)
    if(start?.dbUpdates)Object.assign(dbUpdatesRef.current,start.dbUpdates)
    return ()=>{
      aliveRef.current=false
      clearTimeout(completionTimerRef.current)
    }
    // Only one encounter per mounted story node.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  async function saveOutcome() {
    const pending=pendingRef.current
    if(!pending||pending.notified||pending.saving)return
    setSaving(true);setSaveError('')
    const ok=await persistCombatResult(pending,updates=>updatePlayer(updates),async()=>{
      if(pending.outcome!=='win'||!enemyData.loot?.length)return
      const drops=await grantLoot(player.id,enemyData.loot,effective.core.luck)
      await loadInventory(player.id)
      if(drops.length)note('Loot: '+drops.map(d=>d.name+' ×'+d.qty).join(' · '))
    })
    if(!aliveRef.current)return
    setSaving(false)
    if(!ok){setSaveError(pending.error||'Could not save combat result.');return}
    if(pending.rewardError)note('Loot: '+pending.rewardError)
    if(pending.victoryText)note(pending.victoryText)
    pending.notified=true
    completionTimerRef.current=setTimeout(()=>{
      if(!aliveRef.current)return
      if(pending.outcome==='win')onWin?.()
      else if(pending.outcome==='escape')onEscape?.()
      else onLose?.()
    },900)
  }

  async function finish(outcome) {
    if(pendingRef.current)return
    setResult(outcome)
    const end=ClsCombat.onCombatEnd(combatPlayer,statusRef.current,
      outcome==='win'?'victory':'defeat')
    if(end?.dbUpdates)Object.assign(dbUpdatesRef.current,end.dbUpdates)
    const changes={...dbUpdatesRef.current,hp:outcome==='win'?hpRef.current:Math.max(1,hpRef.current)}
    let victoryText=''
    if(outcome==='win'){
      if(masteryHitsRef.current)changes.weapon_mastery=awardWeaponMastery(
        player.weapon_mastery||{},weaponType,masteryHitsRef.current)
      Object.assign(changes,grantXp({...player,...changes},enemyData.xp||0))
      victoryText='Victory! +'+(enemyData.xp||0)+' XP · '+enemyData.groupSize+' enemies defeated.'
    }
    pendingRef.current={outcome,updates:changes,victoryText,
      saving:false,committed:false,rewardsHandled:false,notified:false}
    await saveOutcome()
  }

  function applyDamage(units,pattern,targetId,damageFn) {
    const result=applyGroupAttack(units,pattern,heroRef.current,targetId,damageFn)
    if(result.valid){
      for(const target of result.targets){
        const after=result.units.find(u=>u.id===target.id)
        const hpChange=forFoe(target.id,()=>ClsCombat.onEnemyHpChange(
          combatPlayer,statusRef.current,target,target.hp,after.hp,target.maxHp))
        hpChange?.messages?.forEach(note)
      }
      for(const dead of result.defeated)onFoeDefeated(dead)
      updateFoes(result.units)
    }
    return result
  }

  function strike(id) {
    const units=foesRef.current
    const target=units.find(u=>u.id===id)
    if(!target)return
    const pierce=stonebornArmorPierce(combatPlayer,statusRef.current,target.def||0)
    const base=Math.max(1,calcATK(player,equipped)-(target.def||0)+pierce+Math.floor(Math.random()*4))
    const mod=forFoe(target.id,()=>ClsCombat.onPlayerAttack(
      combatPlayer,statusRef.current,target,base))
    const crit=Boolean(statusRef.current.cfx_guaranteedCrit)||mod?.wasCrit||
      Math.random()<Math.min(.5,Math.max(0,effective.core.luck)*.01+
        critChanceBonus(combatPlayer)+(mod?.critChanceAdd||0))
    const mult=(mod?.dmgMult??1)*(crit?1.5+critDamageBonus(combatPlayer):1)
    let priorDamage=Math.max(1,Math.round(base*mult))
    if(legendary.has('legendary_forger')&&crit)priorDamage+=12
    if(legendary.has('legendary_hunter')&&target.hp===target.maxHp)priorDamage+=15
    if(legendary.has('legendary_resonance_weaver'))priorDamage+=4
    if(statusRef.current.cfx_ironDomainTurns>0)priorDamage*=2
    // Cinder Step and Plague Fang are player buffs that inflict stacks on
    // the struck enemy. Scope only the resulting stacks to this foe.
    const keystone=forFoe(target.id,()=>resolveKeystoneStrike(
      statusRef.current,priorDamage,crit))
    const damage=attack.fallback?Math.max(1,Math.round(keystone.damage*.25)):
      keystone.damage+Math.max(0,attack.damage-4)+
      Math.floor((weaponMasteryLevel((player.weapon_mastery||{})[weaponType]||0)-1)/10)
    const affected=applyDamage(units,attack,id,foe=>Math.max(1,damage+(target.def||0)-(foe.def||0)))
    if(keystone.heal)updateHp(hpRef.current+keystone.heal)
    note(attack.label+': '+affected.targets.length+' target(s), '+damage+' damage'+(crit?' · Critical!':'')+'.')
    mod?.messages?.forEach(note);keystone.messages?.forEach(note)
    if(mod?.dbUpdates)Object.assign(dbUpdatesRef.current,mod.dbUpdates)
    const post=forFoe(target.id,()=>ClsCombat.onPlayerAttackPost(
      combatPlayer,statusRef.current,target,damage,crit))
    post?.messages?.forEach(note)
    if(post?.dbUpdates)Object.assign(dbUpdatesRef.current,post.dbUpdates)
    if(affected.targets.length&&!attack.fallback&&masteryHitsRef.current<6){
      masteryHitsRef.current++
      note('Weapon mastery practice +1 (on victory).')
    }
  }

  function groupSpellPattern(id) {
    const rule=getTacticalSkillRule(id)
    return rule?.target==='enemy'?{...rule,shape:GROUP_AREAS[id]||'single'}:null
  }
  function resolveSkill(id,target) {
    const response=forFoe(target?.id,()=>ClsCombat.onActiveSkill(
      id,combatPlayer,statusRef.current,target))
    response?.messages?.forEach(note)
    if(response?.dbUpdates)Object.assign(dbUpdatesRef.current,response.dbUpdates)
    const damage=scaleSkillAmount(response?.enemyDamage,getSkillLevel(player,id))
    if(damage>0&&target)applyDamage(foesRef.current,
      groupSpellPattern(id)||{from:[0,1,2],to:[0,1,2],cols:'any',shape:'single'},target.id,damage)
    const heal=scaleSkillAmount(response?.selfHeal,getSkillLevel(player,id))
    if(heal)updateHp(hpRef.current+heal)
    return response?.consumed!==false
  }
  function resolveElement(id,target) {
    const effect=forFoe(target?.id,()=>{
      const result=resolveElementalAttack(id,combatPlayer,statusRef.current,{
        atk:calcATK(player,equipped),def:calcDEF(player,equipped),
        enemyDef:target?.def||0,currentHp:hpRef.current,maxHp})
      if(result&&mpRef.current>=result.mpCost)
        applyKeystoneStatuses(statusRef.current,result.setStatus)
      return result
    })
    if(!effect||mpRef.current<effect.mpCost)return false
    updateMp(mpRef.current-effect.mpCost)
    if(id==='fire_ultimate_inferno_zone' && target &&
        effect.setStatus?.infernoTurns>0) {
      // Inferno occupies a fixed pattern of squares. A target can escape
      // the fire by moving, and other enemies entering the area are hit.
      const zone=makeGroupField('inferno',groupSpellPattern(id),target,
        effect.setStatus.infernoTurns,effect.setStatus.infernoDmg||40)
      fieldsRef.current=[...fieldsRef.current.filter(f=>f.kind!=='inferno'),zone]
      // Do not also damage a separately selected enemy through the legacy
      // single-target regen hook, which would double-count the zone.
      statusRef.current.infernoTurns=0
      statusRef.current.infernoDmg=0
      note('Inferno Zone ignites '+zone.squares.length+' battlefield squares.')
    }
    const damage=scaleSkillAmount(effect.enemyDamage,getSkillLevel(player,id))
    if(damage>0&&target){
      const area=groupSpellPattern(id)
      const fraction=area?.shape!=='single'?0.7:1
      const affected=applyDamage(foesRef.current,area,target.id,Math.max(1,Math.round(damage*fraction)))
      if(area?.shape!=='single')propagateAreaStatus(effect.setStatus,affected.targets,target.id)
      note(effect.label+': '+affected.targets.length+' target(s) hit.')
    }
    const heal=scaleSkillAmount(effect.healPlayer,getSkillLevel(player,id))
    if(heal)updateHp(hpRef.current+heal)
    effect.messages?.forEach(note)
    if(effect.cooldown>0)setElemCooldowns(prev=>({...prev,[id]:effect.cooldown}))
    castElementRef.current=id
    return true
  }
  function resolveKeystone(id,target) {
    const effect=forFoe(target?.id,()=>{
      const result=applyKeystone(id,combatPlayer,statusRef.current,{
        enemyHp:target?.hp||0,maxEnemyHp:target?.maxHp||0,
        currentHp:hpRef.current,maxPlayerHp:maxHp,
        playerATK:calcATK(player,equipped),playerDEF:calcDEF(player,equipped)})
      applyKeystoneStatuses(statusRef.current,result.setStatus)
      return result
    })
    if(effect.consumesTurn===false)delete statusRef.current.cfx_extraTurn
    if(effect.enemyDamage>0&&target) {
      const multiHit=id==='lightning_aggr_ks'||id==='wind_aggr_ks'
      if(multiHit) {
        const damages=groupKeystoneHitDamages(
          id,effect.enemyDamage,calcATK(player,equipped))
        const combo=planGroupMultiHits(foesRef.current,target.id,damages)
        const single={from:[0,1,2],to:[0,1,2],cols:'any',shape:'single'}
        for(const hit of combo.hits) {
          // Apply each arc through the normal per-unit damage/kill hooks.
          // No second application of effect.enemyDamage to the primary foe.
          const struck=applyDamage(foesRef.current,single,hit.targetId,hit.damage)
          if(struck.valid)
            note((id==='lightning_aggr_ks'?'⚡ Arc':'💨 Cyclone hit')+
              ' → '+hit.name+': '+hit.dealt+' damage.')
        }
      } else applyDamage(foesRef.current,
        {from:[0,1,2],to:[0,1,2],cols:'any',shape:'single'},target.id,effect.enemyDamage)
    }
    if(effect.healPlayer)updateHp(hpRef.current+effect.healPlayer)
    effect.messages?.forEach(note)
    if(effect.cooldown>0)setKeyCooldowns(prev=>({...prev,[id]:effect.cooldown}))
    castKeyRef.current=id
    return effect.consumesTurn!==false
  }

  async function enemyPhase(fast,heroAt) {
    let next=foesRef.current.map(u=>({...u}))
    let currentHp=hpRef.current
    const speed=calcSPD(player,equipped)+(statusRef.current.playerSPDBonus||0)
    const sorted=next.filter(u=>u.hp>0 &&
      ((u.speed||5)>speed)===fast).sort((a,b)=>(b.speed||5)-(a.speed||5))
    for(const foe of sorted){
      const actor=next.find(u=>u.id===foe.id)
      if(!actor||actor.hp<=0||currentHp<=0)continue
      const ownStatus=foeStatusesRef.current[actor.id]||{}
      const stun=ownStatus.enemyStunTurns||0
      if(stun>0){
        ownStatus.enemyStunTurns=stun-1
        foeStatusesRef.current[actor.id]=ownStatus
        note(actor.name+' is stunned and loses its turn.')
        continue
      }
      if(enemyDamageBudgetRef.current<=0){
        note(actor.name+' holds position while the group regroups.')
        continue
      }
      const occupied=next.filter(other=>other.id!==actor.id&&other.hp>0)
      const choice=chooseTacticalEnemyAction(actor.weapon,actor,heroAt,occupied)
      if(choice.move){
        actor.col=choice.move.col;actor.rank=choice.move.rank
        note(actor.name+' moves to rank '+(actor.rank+1)+', column '+(actor.col+1)+'.')
        continue
      }
      const pulse=Boolean(choice.attack?.fallback)
      const hpBeforeAction=actor.hp
      const messages=[]
      let incoming=0,heal=0
      const foeData=enemyCopiesRef.current[actor.id]
      const state=enemyStatesRef.current[actor.id]
      if(!pulse)forFoe(actor.id,()=>resolveEnemyTurn(foeData,{
        enemyState:state,enemyHp:actor.hp,maxEnemyHp:actor.maxHp,
        currentHp,maxPlayerHp:maxHp,
        playerDEF:()=>calcDEF(player,equipped),defending:defendingRef.current,
        statusEffects:statusRef.current,yara:null,messages,
        triggerAnimation:()=>{},
        onEnemyDmgPlayer:d=>{incoming+=d},
        onEnemyHealSelf:h=>{heal+=h},
      }))
      else incoming=2
      actor.hp=Math.min(actor.maxHp,actor.hp+heal)
      const decay=foeStatusesRef.current[actor.id]?.cfx_longDecayStacks||0
      if(decay>0)incoming=Math.max(0,incoming-3*decay)
      if(statusRef.current.cfx_tornadoTurns>0)
        incoming=Math.round(incoming*.7)
      const hit=ClsCombat.onPlayerHit(combatPlayer,statusRef.current,foeData,incoming,maxHp)
      let damage=Math.max(0,Math.round(incoming*(hit?.dmgMult??1)*resistMult(combatPlayer)))
      if(damage>0&&Math.random()<Math.min(.25,Math.max(0,effective.core.agility)*.01)){
        damage=0;messages.push('You evade '+actor.name+'.')
      }
      if(legendary.has('legendary_miner'))damage=Math.max(0,damage-3)
      const guard=resolveKeystoneDefense(statusRef.current,damage)
      damage=guard.damage
      damage=Math.min(damage,enemyDamageBudgetRef.current)
      enemyDamageBudgetRef.current=Math.max(0,enemyDamageBudgetRef.current-damage)
      actor.hp=Math.max(0,actor.hp-(hit?.reflectAmount||0)-(guard.reflected||0)-
        Math.round(damage*reflectFraction(combatPlayer)))
      currentHp=Math.max(0,currentHp-damage)
      note(actor.name+(pulse?' fires an emergency pulse':' attacks')+' for '+damage+' damage.')
      hit?.messages?.forEach(note);guard.messages?.forEach(note)
      messages.forEach(note)
      if(guard.mpGain)updateMp(mpRef.current+guard.mpGain)
      if(actor.hp===0&&hpBeforeAction>0)onFoeDefeated(actor)
      await sleep(170)
    }
    updateFoes(next)
    updateHp(currentHp)
    return currentHp
  }

  function roundEnd() {
    let units=foesRef.current
    statusRef.current._enemyMaxHp=nextAliveTarget(units,focus)?.maxHp||100
    const tick=ClsCombat.onTurnEnd(combatPlayer,statusRef.current)
    tick?.messages?.forEach(note)
    const perFoe=advanceFoeStatuses(units,foeStatusesRef.current,combatPlayer)
    foeStatusesRef.current=perFoe.statuses
    units=perFoe.units
    const fieldTicks=advanceGroupFields(units,fieldsRef.current)
    fieldsRef.current=fieldTicks.fields
    units=fieldTicks.units
    for(const event of fieldTicks.events) {
      note(event.name+' takes '+event.damage+' '+event.kind+' field damage.')
      if(event.defeated)onFoeDefeated(units.find(u=>u.id===event.id))
    }
    for(const event of perFoe.events){
      note(event.name+' takes '+event.damage+' damage from ongoing effects.')
      if(event.defeated)onFoeDefeated(units.find(u=>u.id===event.id))
    }
    // Global crowd-control generated by passive class effects.
    if(statusRef.current.enemyStunTurns>0){
      for(const unit of units.filter(u=>u.hp>0)){
        const effects=foeStatusesRef.current[unit.id]||{}
        effects.enemyStunTurns=Math.max(effects.enemyStunTurns||0,
          statusRef.current.enemyStunTurns)
        foeStatusesRef.current[unit.id]=effects
      }
      statusRef.current.enemyStunTurns=0
    }
    const target=nextAliveTarget(units,focus)
    if(tick?.damageToEnemy>0&&target){
      units=units.map(u=>u.id===target.id
        ?{...u,hp:Math.max(0,u.hp-tick.damageToEnemy)}:u)
      if(units.find(u=>u.id===target.id).hp===0)onFoeDefeated(target)
    }
    if(tick?.healToPlayer>0&&hpRef.current>0)updateHp(hpRef.current+tick.healToPlayer)
    const targetAfter=nextAliveTarget(units,focus)
    const regen=resolveKeystoneRegen(statusRef.current,targetAfter?.hp||0,hpRef.current,maxHp)
    if(targetAfter){
      units=units.map(u=>u.id===targetAfter.id?{...u,hp:regen.enemyHp}:u)
      if(regen.enemyHp===0&&targetAfter.hp>0)onFoeDefeated(targetAfter)
    }
    updateFoes(units)
    updateHp(regen.playerHp)
    regen.messages?.forEach(note)
    setKeyCooldowns(prev=>advanceKeystoneCooldowns(prev,castKeyRef.current))
    setElemCooldowns(prev=>advanceKeystoneCooldowns(prev,castElementRef.current))
    if(statusRef.current.cfx_tornadoTurns>0)statusRef.current.cfx_tornadoTurns--
    if(statusRef.current.cfx_ironDomainTurns>0 &&
        castElementRef.current!=='metal_ultimate_iron_domain')
      statusRef.current.cfx_ironDomainTurns--
    castKeyRef.current=null;castElementRef.current=null
    defendingRef.current=false
    if(mpRef.current<mpMax)updateMp(recoverCombatMp(mpRef.current,mpRegen,mpMax))
    roundStartedRef.current=false
    apRef.current=2;setAp(2)
  }
  function isFreeClass(id){
    return ['stance_solar','stance_lunar','shift_beast','shift_coil','shift_storm'].includes(id)||
      (id==='buffer'&&!statusRef.current.cls_bufferStored)
  }
  function isFreeKey(id){
    return ['lightning_util_ks','arcane_util_ks','shadow_util_ks','wind_util_ks'].includes(id)
  }

  async function takeTurn(kind,id=null,position=null) {
    if(busyRef.current||pendingRef.current)return
    const target=nextAliveTarget(foesRef.current,kind==='attack'?id:focus)
    const selected=kind==='attack'?attack:null
    if(kind==='attack'&&(!target||!isTacticalTargetValid(selected,heroRef.current,target)))return
    if(kind==='move'&&(!position||position.col<0||position.col>2||position.rank<0||
      position.rank>2||Math.abs(position.col-heroRef.current.col)+
        Math.abs(position.rank-heroRef.current.rank)!==1))return
    if(kind==='skill'&&(!ClsCombat.getActiveClassSkills(combatPlayer,statusRef.current)
      .some(skill=>skill.id===id&&skill.available!==false)||
      !canUseTacticalSkill(id,heroRef.current,target)))return
    if(kind==='elemental'&&(!canUseElementalAttack(combatPlayer,id)||
      !canUseTacticalSkill(id,heroRef.current,target)||
      (elemCooldowns[id]||0)>0||mpRef.current<getAttackMpCost(combatPlayer,id,statusRef.current)))return
    if(kind==='keystone'&&!getUnlockedKeystones(combatPlayer,keyCooldowns)
      .some(k=>k.id===id&&k.available))return
    const free=(kind==='skill'&&isFreeClass(id))||(kind==='keystone'&&isFreeKey(id))
    const cost=free?0:kind==='end'?apRef.current:
      kind==='move'?1:kind==='attack'?attack.ap:2
    if(cost>apRef.current)return
    busyRef.current=true;setBusy(true)
    try{
      if(free){
        if(kind==='skill')resolveSkill(id,target)
        else resolveKeystone(id,target)
        return
      }
      if(!roundStartedRef.current){
        roundStartedRef.current=true
        enemyDamageBudgetRef.current=enemyActionBudget(enemyData.atk,enemyData.groupSize)
        legendaryTurnRef.current++
        if(legendary.has('legendary_engineer')&&legendaryTurnRef.current%3===0){
          updateHp(hpRef.current+5)
          note('Mechanist Matrix repairs 5 HP.')
        }
        if(legendary.has('legendary_pathfinder')&&legendaryTurnRef.current===1)
          note('Worldsight Compass reveals the formation.')
        const alive=await enemyPhase(true,heroRef.current)
        if(alive<=0){await finish('lose');return}
        if(foesRef.current.every(u=>u.hp<=0)){await finish('win');return}
      }
      // Fast enemies can reposition or be defeated before the player acts.
      // Revalidate against the CURRENT formation so the player never burns
      // AP hitting a stale square or applying debuffs to an absent enemy.
      const liveTarget=target&&foesRef.current.find(
        foe=>foe.id===target.id&&foe.hp>0)
      if(['attack','skill','elemental'].includes(kind) &&
        (!liveTarget || (kind==='attack'
          ? !isTacticalTargetValid(attack,heroRef.current,liveTarget)
          : !canUseTacticalSkill(id,heroRef.current,liveTarget)))){
        note('Your target moved or fell before your action. Select a new target; no AP spent.')
        return
      }
      if(kind==='attack')strike(liveTarget.id)
      else if(kind==='move'){
        heroRef.current=position;setHero(position)
        note('You move to rank '+(position.rank+1)+', column '+(position.col+1)+'.')
      }
      else if(kind==='skill')resolveSkill(id,liveTarget||target)
      else if(kind==='elemental')resolveElement(id,liveTarget||target)
      else if(kind==='keystone')resolveKeystone(id,liveTarget||target)
      else if(kind==='defend'){
        defendingRef.current=true
        applyStonebornDefend(combatPlayer,statusRef.current)
        note('You prepare your guard.')
      }else if(kind==='end')note('You end the turn.')

      if(foesRef.current.every(u=>u.hp<=0)){await finish('win');return}
      apRef.current=Math.max(0,apRef.current-cost)
      setAp(apRef.current)
      if(apRef.current>0)return
      await enemyPhase(false,heroRef.current)
      if(hpRef.current<=0){await finish('lose');return}
      roundEnd()
      if(foesRef.current.every(u=>u.hp<=0))await finish('win')
      else if(hpRef.current<=0)await finish('lose')
    }catch(error){
      note('Combat action failed: '+(error?.message||'unknown error'))
    }finally{
      busyRef.current=false
      if(aliveRef.current)setBusy(false)
    }
  }

  const target=nextAliveTarget(foes,focus)
  const chosen=target?.id||null
  const activeSkills=ClsCombat.getActiveClassSkills(combatPlayer,statusRef.current)||[]
  const elemental=getEquippedElementalAttack(combatPlayer)
  const keystones=getUnlockedKeystones(combatPlayer,keyCooldowns)
  const attackLegal=Boolean(target&&isTacticalTargetValid(attack,hero,target))
  const canPlay=!busy&&!result
  return <div className="combat-screen group-combat">
    <div className="combat-encounter-title">⚔ GROUP ENCOUNTER · {enemyData.name} ⚔</div>
    <div className="combat-turn-banner">{foes.filter(u=>u.hp>0).length}/{foes.length} enemies remaining · {ap}/2 AP · {hp}/{maxHp} HP · {mp}/{mpMax} MP</div>
    <Battlefield foes={foes} hero={hero} focused={chosen} pattern={attack}
      fields={fieldsRef.current} canMove={canPlay&&ap>=1}
      onFocus={id=>setFocus(id)}
      onMove={point=>takeTurn('move',null,point)} />
    <div className="combat-group-enemies" aria-live="polite">
      {foes.map(unit=><button key={unit.id} type="button"
        className={'combat-group-unit'+(unit.id===chosen?' current':'')}
        disabled={unit.hp<=0} onClick={()=>setFocus(unit.id)}>
        {unit.icon} {unit.name} · {unit.hp}/{unit.maxHp} HP
        {unit.hp>0&&foeStatusesRef.current[unit.id]?.cls_bleedingTurns>0?' 🩸':''}
        {unit.hp>0&&foeStatusesRef.current[unit.id]?.cls_rotTurns>0?' ☣️':''}
        {unit.hp>0&&foeStatusesRef.current[unit.id]?.cls_drownTurns>0?' 💧':''}
        {unit.hp>0&&foeStatusesRef.current[unit.id]?.enemyStunTurns>0?' ⚡':''}
        {unit.hp>0&&foeStatusesRef.current[unit.id]?.cls_markTurns>0?' 🎯':''}
        {unit.hp>0&&foeStatusesRef.current[unit.id]?.cfx_longDecayStacks>0?' ☠️':''}
        {unit.hp>0&&foeStatusesRef.current[unit.id]?.cfx_emberStacks>0?' 🔥':''}
      </button>)}
    </div>
    <div className="combat-tactical-status">
      <span>Weapon: {weaponType} · Mastery Lv {weaponMasteryLevel((player.weapon_mastery||{})[weaponType]||0)}</span>
      <strong>{ap} AP</strong>
    </div>
    {target&&!attackLegal&&!result&&
      <p className="combat-range-warning" role="status">
        {attack.label} cannot reach {target.name} from here. Move, choose a different attack, or select another enemy.
      </p>}
    {!result&&<>
      <div className="combat-tactical-weapons">
        {weaponKit.map(item=><button key={item.id} type="button"
          className={'combat-action-btn'+(item.id===attack.id?' selected':'')}
          disabled={!canPlay} aria-pressed={item.id===attack.id}
          onClick={()=>setSelectedAttack(item.id)}>
          {item.label}<span className="combat-action-sub">{item.reach} · {item.shape} · {item.ap} AP</span>
        </button>)}
      </div>
      <div className="combat-actions">
        <button type="button" className="combat-action-btn"
          disabled={!canPlay||!attackLegal||ap<attack.ap}
          onClick={()=>takeTurn('attack',chosen)}>Use {attack.label} · {attack.ap} AP</button>
        <button type="button" className="combat-action-btn" disabled={!canPlay||ap<2}
          onClick={()=>takeTurn('defend')}>Defend · 2 AP</button>
        <button type="button" className="combat-action-btn" disabled={!canPlay}
          onClick={()=>takeTurn('end')}>End turn</button>
        {activeSkills.map(skill=><button key={skill.id} type="button" className="combat-action-btn"
          disabled={!canPlay||skill.available===false||
            (!isFreeClass(skill.id)&&ap<2)||
            !canUseTacticalSkill(skill.id,hero,target)}
          onClick={()=>takeTurn('skill',skill.id)}>
          {skill.label} · Lv {getSkillLevel(player,skill.id)}
          <span className="combat-action-sub">{getTacticalSkillRule(skill.id)?.label||'Class skill'}</span>
        </button>)}
        {elemental&&<button type="button" className="combat-action-btn"
          disabled={!canPlay||ap<2||!canUseTacticalSkill(elemental.id,hero,target)||
            (elemCooldowns[elemental.id]||0)>0||
            mp<getAttackMpCost(combatPlayer,elemental.id,statusRef.current)}
          onClick={()=>takeTurn('elemental',elemental.id)}>
          {elemental.label} · Lv {getSkillLevel(player,elemental.id)}
          <span className="combat-action-sub">{getTacticalSkillRule(elemental.id)?.label} · {getAttackMpCost(combatPlayer,elemental.id,statusRef.current)} MP</span>
        </button>}
        {keystones.map(k=><button key={k.id} type="button" className="combat-action-btn"
          disabled={!canPlay||!k.available||(!isFreeKey(k.id)&&ap<2)}
          onClick={()=>takeTurn('keystone',k.id)}>{k.label}
          <span className="combat-action-sub">{isFreeKey(k.id)?'Free':'2 AP'} · Keystone
            {['lightning_aggr_ks','wind_aggr_ks'].includes(k.id)?' · 4 positional hits':''}</span>
        </button>)}
        {onEscape&&<button type="button" className="combat-action-btn" disabled={!canPlay}
          onClick={()=>finish('escape')}>Flee</button>}
      </div>
    </>}
    {result&&<p className={'combat-result '+(result==='win'?'win':result==='lose'?'lose':'')}>
      {result==='win'?'✦ Victory ✦':result==='lose'?'✦ Defeated ✦':'Escaped'}
    </p>}
    {saving&&<p className="combat-save-status">Saving group combat result…</p>}
    {saveError&&<div className="combat-save-error" role="alert">
      <p>{saveError} Your result is kept until the save succeeds.</p>
      <button type="button" className="combat-action-btn" disabled={saving}
        onClick={saveOutcome}>Retry save</button>
    </div>}
    <div className="combat-log">{log.map((entry,i)=><p key={i}>{entry}</p>)}</div>
  </div>
}
