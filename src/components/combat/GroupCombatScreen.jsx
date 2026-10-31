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
import { getActiveElement } from '../../game/activeElement'
import { getFusionSignatureAction, planFusionSignature, canCastFusionSignature } from '../../game/signatureFusion'
import { resolveElementalTriad, triadArmorPierce } from '../../game/elementalTriad'
import { getActiveFusion, getFusionRider, getFusionEligibility, awardFusionPractice,
  selectFusionChainTargets, FUSION_MP_COST, FUSION_MAX_PRACTICE_PER_FIGHT } from '../../game/classElementFusion'
import { getProgressedTacticalSkillRule, canUseTacticalSkill } from '../../game/tacticalSkills'
import { getPlayerTacticalAttacks, startImprovisedThrowRecovery,
  improvisedThrowTurnsRemaining, tacticalAttackDescription,
  getTacticalAttacks, tacticalWeaponType, isTacticalTargetValid,
  getTacticalAffectedSquares, chooseTacticalEnemyAction,
  weaponMasteryLevel, awardWeaponMastery } from '../../game/tacticalGrid'
import CombatActionPoints, { maxCombatAp } from './CombatActionPoints'
import BattleConsumables from './BattleConsumables'
import { createTacticalGroup, applyGroupAttack, nextAliveTarget,
  makeGroupField, advanceGroupFields, planGroupMultiHits,
  groupKeystoneHitDamages, previewGroupAttack } from '../../game/tacticalGroups'
import { withFoeStatus, advanceFoeStatuses, enemyActionBudget,
  spreadTacticalFoeEffects } from '../../game/tacticalFoeStatus'
import { getUnlockedKeystones, applyKeystone } from '../../game/elementalKeystones'
import { getEquippedElementalAttack, canUseElementalAttack, getAttackMpCost, resolveElementalAttack } from '../../game/elementalAttacks'
import { getMaxCombatMp, getCombatMpRegen, recoverCombatMp, clampCombatMp } from '../../game/combatMp'
import { advanceKeystoneCooldowns, applyKeystoneStatuses, applyStonebornDefend,
  resolveKeystoneDefense, resolveKeystoneStrike, resolveKeystoneRegen,
  stonebornArmorPierce } from '../../game/keystoneCombat'
import './CombatScreen.css'

// Existing skill damage/status rules are reused. Spatial footprints now
// evolve from saved skill levels in tacticalSkills.js.
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))

function Battlefield({ foes, hero, focused, aim, enemyArea, pattern, fields, canMove, onMove, onFocus,
  signatureFx,protectedPreview=[] }) {
  const preview=previewGroupAttack(foes,pattern,hero,aim)
  const area=preview.squares
  function sideCells(side) {
    const ranks=side==='enemy'?[2,1,0]:[0,1,2]
    return ranks.flatMap(rank=>[0,1,2].map(col=>{
      const foe=side==='enemy'?foes.find(f=>f.hp>0&&f.col===col&&f.rank===rank):null
      const mine=side==='hero'&&hero.rank===rank&&hero.col===col
      const step=side==='hero'&&!mine&&canMove&&
        Math.abs(hero.rank-rank)+Math.abs(hero.col-col)===1
      const inRange=Boolean(foe&&pattern&&isTacticalTargetValid(pattern,hero,foe))
      const selected=Boolean(aim&&aim.col===col&&aim.rank===rank)
      const splash=side==='enemy'&&area.some(p=>p.rank===rank&&p.col===col)
      const hazard=side==='enemy'&&fields.some(f=>f.squares.some(
        p=>p.rank===rank&&p.col===col))
      const fx=signatureFx?.side===side&&signatureFx.squares.some(
        p=>p.rank===rank&&p.col===col)
      const enemyThreat=side==='hero'&&enemyArea.some(p=>p.col===col&&p.rank===rank)
      const barrier=side==='hero'&&protectedPreview.some(
        p=>p.rank===rank&&p.col===col)
      return <button key={side+rank+col} type="button"
        className={['combat-grid-cell',side==='enemy'?'foe':'ally',
          foe||mine?'occupied':'',selected?'selected-foe':'',
          inRange?'attackable':'',
          splash?'splash':'',enemyThreat?'enemy-threat':'',hazard?'hazard':'',step?'movable':'',
          barrier?'signature-preview-guard':''].join(' ')}
        disabled={side==='enemy'?false:!step}
        aria-pressed={side==='enemy'&&foe?foe.id===focused:undefined}
        aria-label={foe?foe.name+' '+foe.hp+' HP · '+
          (inRange?'in range':'out of range'):mine?'You':('Empty '+(rank+1)+'-'+(col+1))}
        onClick={()=>side==='enemy'?onFocus({col,rank},foe?.id):onMove({col,rank})}>
        <span>{foe?foe.icon:mine?'🧑':'·'}</span>
        {fx&&<span key={signatureFx.id} aria-hidden="true"
          className={'signature-grid-flash signature-'+signatureFx.kind+
            (signatureFx.element?' triad-'+signatureFx.element:'')}/>}
        {(foe||mine)&&<small>{foe?'#'+foe.id.split('-')[1]+' '+foe.hp+' HP':'YOU'}</small>
      </button>
    }))
  }
  return <div className="combat-grid-field">
    <div className="combat-grid-caption">ENEMIES · SELECT A SQUARE TO AIM</div>
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
  const consumeItem=useInventoryStore(s=>s.consumeItem)
  const equipped=inventory.filter(i=>i.equipped_slot)
  const legendary=new Set(equipped.map(i=>i.item_key))
  const effective=getEffectiveStats(player,equipped)
  const combatPlayer=getCombatPlayer(player,equipped)
  const maxHp=calcMaxHp(player,equipped)
  const mpMax=getMaxCombatMp(combatPlayer)
  const mpRegen=getCombatMpRegen(combatPlayer)
  const weapon=equipped.find(i=>i.equipped_slot==='mainhand')
  const weaponType=tacticalWeaponType(weapon?equipmentSubtype(weapon):null)
  const weaponKit=getPlayerTacticalAttacks(Boolean(weapon),weaponType,
    (player.weapon_mastery||{})[weaponType]||0)
  const activeFusion=getActiveFusion(player)
  const fusionEligibility=getFusionEligibility(player,getActiveElement(player))
  const signature=getFusionSignatureAction(activeFusion)

  const foesRef=useRef(createTacticalGroup(enemyData))
  const [foes,setFoes]=useState(foesRef.current)
  const [focus,setFocus]=useState(foesRef.current[0].id)
  const [aim,setAim]=useState({col:foesRef.current[0].col,rank:foesRef.current[0].rank})
  const [enemyArea,setEnemyArea]=useState([])
  const [selectedAttack,setSelectedAttack]=useState(null)
  const [fusionEnabled,setFusionEnabled]=useState(false)
  const [signaturePreview,setSignaturePreview]=useState(false)
  const [signatureCooldown,setSignatureCooldown]=useState(0)
  const signatureCooldownRef=useRef(0)
  const [signatureFx,setSignatureFx]=useState(null)
  const signatureFxId=useRef(0)
  const [previewSkill,setPreviewSkill]=useState(null)
  const attack=weaponKit.find(a=>a.id===selectedAttack)||weaponKit[0]
  const [hero,setHero]=useState({col:1,rank:0})
  const heroRef=useRef(hero)
  const maxAp=maxCombatAp(player.level)
  const [ap,setAp]=useState(maxAp)
  const apRef=useRef(maxAp)
  const [emergencyUsed,setEmergencyUsed]=useState(false)
  const emergencyUsedRef=useRef(false)
  const roundStartedRef=useRef(false)
  const roundRef=useRef(1)
  const [round,setRound]=useState(1)
  const throwReadyRef=useRef(0)
  const [throwReady,setThrowReady]=useState(0)
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
  const fusionPracticeRef=useRef(0)
  const fusionWardRef=useRef(0)
  const fortressCounterRef=useRef(0)
  const fusionDodgeRef=useRef(false)
  const fusionRegenRef=useRef({turns:0,amount:0})
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
  function spreadAreaEffects(before,affected,targetId){
    spreadTacticalFoeEffects(before,foeStatusesRef.current[targetId]||{},
      affected,targetId,foeStatusesRef.current)
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
      if(activeFusion&&fusionPracticeRef.current)changes.fusion_mastery=
        awardFusionPractice(player.fusion_mastery||{},
          activeFusion.key,fusionPracticeRef.current)
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

  // Optional fusion applies only after a real class/weapon hit. All original
  // class skills, elemental attacks and AP/cooldown rules remain untouched.
  function infuseHit(affected,originId) {
    if(!fusionEnabled||!activeFusion||!affected?.valid||
       !affected.targets.length||mpRef.current<FUSION_MP_COST)return
    const rider=getFusionRider(activeFusion)
    if(!rider)return
    updateMp(mpRef.current-FUSION_MP_COST)
    const hitIds=affected.targets.map(unit=>unit.id)
    const single={from:[0,1,2],to:[0,1,2],cols:'any',shape:'single'}
    for(const unit of affected.targets) {
      const alive=foesRef.current.find(u=>u.id===unit.id&&u.hp>0)
      if(!alive)continue
      const status=foeStatusesRef.current[unit.id]||{}
      if(rider.ember)status.cfx_emberStacks=
        Math.min(5,(status.cfx_emberStacks||0)+rider.ember)
      if(rider.decay)status.cfx_longDecayStacks=
        Math.min(5,(status.cfx_longDecayStacks||0)+rider.decay)
      if(rider.stun)status.enemyStunTurns=
        Math.max(status.enemyStunTurns||0,rider.stun)
      foeStatusesRef.current[unit.id]=status
      if(rider.bonusDamage)applyDamage(foesRef.current,single,unit.id,
        rider.bonusDamage)
    }
    if(rider.chainDamage) {
      const chains=selectFusionChainTargets(foesRef.current,originId,
        hitIds,rider.chainCount)
      for(const next of chains)applyDamage(foesRef.current,single,
        next.id,rider.chainDamage)
    }
    if(rider.heal)updateHp(hpRef.current+rider.heal)
    if(rider.ward)fusionWardRef.current=Math.max(fusionWardRef.current,rider.ward)
    if(rider.dodge)fusionDodgeRef.current=true
    if(rider.regenTurns)fusionRegenRef.current={
      turns:rider.regenTurns,amount:rider.regenAmount}
    fusionPracticeRef.current=Math.min(FUSION_MAX_PRACTICE_PER_FIGHT,
      fusionPracticeRef.current+1)
    note('✦ '+rider.label+' · '+activeFusion.element+' infusion (-'+FUSION_MP_COST+
      ' MP). Fusion practice +1 on victory.')
  }

  function castSignature(target) {
    const plan=planFusionSignature(signature,foesRef.current,target?.id,heroRef.current)
    if(!plan.valid)return false
    const triad=signature.kind==='triad'?resolveElementalTriad(combatPlayer,
      statusRef.current,{atk:calcATK(player,equipped),
        def:calcDEF(player,equipped),enemyDef:target?.def||0,maxHp}):null
    if(signature.kind==='triad'&&!triad)return false
    updateMp(mpRef.current-signature.mp)
    const single={from:[0,1,2],to:[0,1,2],cols:'any',shape:'single'}
    if(signature.kind==='triad'){
      Object.assign(statusRef.current,triad.playerStatus)
      for(const foe of plan.targets){
        const bonus=triadArmorPierce(triad.special,foe.def)
        const hit=applyDamage(foesRef.current,single,foe.id,triad.damage+bonus)
        if(!hit.valid)continue
        const alive=foesRef.current.find(u=>u.id===foe.id&&u.hp>0)
        if(!alive)continue
        const effects=foeStatusesRef.current[foe.id]||{}
        for(const [key,value] of Object.entries(triad.enemyStatus))
          effects[key]=typeof value==='number'?Math.max(effects[key]||0,value):value
        if(triad.special?.extraDecay)
          effects.cfx_longDecayStacks=Math.min(5,
            (effects.cfx_longDecayStacks||0)+triad.special.extraDecay)
        foeStatusesRef.current[foe.id]=effects
      }
      if(triad.special?.chainDamage){
        let arcs=selectFusionChainTargets(foesRef.current,target.id,
          plan.targets.map(u=>u.id),triad.special.chainCount)
        // In a compact formation the initial cross may already hit all foes.
        // Let its electricity overload the focused survivor once instead.
        if(!arcs.length){
          const primary=foesRef.current.find(u=>u.id===target.id&&u.hp>0)
          if(primary)arcs=[primary]
        }
        for(const arc of arcs)applyDamage(foesRef.current,single,
          arc.id,triad.special.chainDamage)
        note('Storm Circuit arcs to '+arcs.length+' target(s).')
      }
      if(triad.special?.ward)
        fusionWardRef.current=Math.max(fusionWardRef.current,triad.special.ward)
      if(triad.special?.dodge)fusionDodgeRef.current=true
      if(triad.special?.regenTurns)fusionRegenRef.current={
        turns:triad.special.regenTurns,amount:triad.special.regenAmount}
      if(triad.special?.galeTurns)statusRef.current.cfx_tornadoTurns=
        Math.max(statusRef.current.cfx_tornadoTurns||0,triad.special.galeTurns)
      if(triad.special?.mpRefund)updateMp(mpRef.current+triad.special.mpRefund)
      if(triad.playerStatus.infernoTurns>0){
        const field=makeGroupField('triad-fire',signature.attack,target,
          triad.playerStatus.infernoTurns,
          Math.max(1,Math.round((triad.playerStatus.infernoDmg||40)*.65)))
        fieldsRef.current=[...fieldsRef.current.filter(f=>f.kind!=='triad-fire'),field]
        statusRef.current.infernoTurns=0
        statusRef.current.infernoDmg=0
      }
      if(triad.heal)updateHp(hpRef.current+triad.heal)
      note(signature.label+' · '+signature.technique+': '+
        triad.components.map(c=>c.label).join(' + ')+
        ' fused into one attack across '+plan.targets.length+
        ' enemies. '+triad.special.detail+'.')
    }else if(signature.kind==='phantom'){
      for(const hit of plan.hits){
        applyDamage(foesRef.current,single,hit.targetId,hit.damage)
        const unit=foesRef.current.find(u=>u.id===hit.targetId&&u.hp>0)
        if(unit){
          const effects=foeStatusesRef.current[unit.id]||{}
          effects.cfx_emberStacks=Math.min(5,(effects.cfx_emberStacks||0)+1)
          foeStatusesRef.current[unit.id]=effects
        }
      }
      const field=makeGroupField('phantom-fire',signature.attack,target,
        signature.fieldTurns,signature.fieldDamage)
      fieldsRef.current=[...fieldsRef.current.filter(f=>f.kind!=='phantom-fire'),field]
      note('Phantom Inferno burns '+field.squares.length+' squares for '+
        signature.fieldTurns+' rounds.')
    }else if(signature.kind==='thunder'){
      for(const hit of plan.hits)applyDamage(foesRef.current,single,hit.targetId,hit.damage)
      for(const hit of plan.hits){
        const unit=foesRef.current.find(u=>u.id===hit.targetId&&u.hp>0)
        if(!unit)continue
        const effects=foeStatusesRef.current[unit.id]||{}
        effects.enemyStunTurns=Math.max(effects.enemyStunTurns||0,signature.stun)
        foeStatusesRef.current[unit.id]=effects
      }
      note('Thunderous Fury chains to '+plan.hits.length+' enemies.')
    }else if(signature.kind==='titan'){
      fusionWardRef.current=Math.max(fusionWardRef.current,signature.ward)
      fortressCounterRef.current=signature.counter
      note("Titan's Fortress raises a "+signature.ward+'-point barrier with retaliation.')
    }
    fusionPracticeRef.current=Math.min(FUSION_MAX_PRACTICE_PER_FIGHT,
      fusionPracticeRef.current+1)
    note('Signature fusion practice +1 (on victory).')
    signatureCooldownRef.current=signature.cooldown+1
    setSignatureCooldown(signatureCooldownRef.current)
    setSignatureFx({id:++signatureFxId.current,kind:signature.kind,
      side:signature.kind==='titan'?'hero':'enemy',
      element:signature.kind==='triad'?signature.element:null,
      squares:plan.squares})
    setSignaturePreview(false)
    return true
  }

  function strike(square) {
    const units=foesRef.current
    const footprint=previewGroupAttack(units,attack,heroRef.current,square)
    const target=footprint.targets[0]
    if(!footprint.valid)return
    if(!target){
      applyDamage(units,attack,square,0)
      note(attack.label+': no enemy in the affected squares.')
      return
    }
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
    const affected=applyDamage(units,attack,square,foe=>Math.max(1,damage+(target.def||0)-(foe.def||0)))
    if(!attack.fallback)infuseHit(affected,target.id)
    if(attack.thrown&&affected.targets.length){
      const ready=startImprovisedThrowRecovery(roundRef.current,target.rank)
      throwReadyRef.current=ready;setThrowReady(ready)
      setSelectedAttack(null)
      note('Your thrown object will be recovered '+(target.rank===1
        ?'next round.':'in two rounds.'))
    }
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
    const rule=getProgressedTacticalSkillRule(id,getSkillLevel(player,id))
    return rule?.target==='enemy'?rule:null
  }
  function resolveSkill(id,target) {
    const pattern=groupSpellPattern(id)
    const footprint=target&&pattern
      ?previewGroupAttack(foesRef.current,pattern,heroRef.current,target.id):null
    const before={...(foeStatusesRef.current[target?.id]||{})}
    const response=forFoe(target?.id,()=>ClsCombat.onActiveSkill(
      id,combatPlayer,statusRef.current,target))
    response?.messages?.forEach(note)
    if(response?.dbUpdates)Object.assign(dbUpdatesRef.current,response.dbUpdates)
    if(response?.consumed!==false&&footprint?.valid)
      spreadAreaEffects(before,footprint.targets,target.id)
    const damage=scaleSkillAmount(response?.enemyDamage,getSkillLevel(player,id))
    if(damage>0&&target){
      const affected=applyDamage(foesRef.current,
        pattern||{from:[0,1,2],to:[0,1,2],cols:'any',shape:'single'},target.id,damage)
      if(pattern)infuseHit(affected,target.id)
    }
    const heal=scaleSkillAmount(response?.selfHeal,getSkillLevel(player,id))
    if(heal)updateHp(hpRef.current+heal)
    return response?.consumed!==false
  }
  function resolveElement(id,target) {
    const pattern=groupSpellPattern(id)
    const footprint=target&&pattern
      ?previewGroupAttack(foesRef.current,pattern,heroRef.current,target.id):null
    const before={...(foeStatusesRef.current[target?.id]||{})}
    const effect=forFoe(target?.id,()=>{
      const result=resolveElementalAttack(id,combatPlayer,statusRef.current,{
        atk:calcATK(player,equipped),def:calcDEF(player,equipped),
        enemyDef:target?.def||0,currentHp:hpRef.current,maxHp})
      if(result&&mpRef.current>=result.mpCost)
        applyKeystoneStatuses(statusRef.current,result.setStatus)
      return result
    })
    if(!effect||mpRef.current<effect.mpCost)return false
    if(footprint?.valid)spreadAreaEffects(before,footprint.targets,target.id)
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
      const fraction=pattern?.shape!=='single'?0.7:1
      const affected=applyDamage(foesRef.current,pattern,target.id,Math.max(1,Math.round(damage*fraction)))
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
      const occupied=next.filter(other=>other.id!==actor.id&&other.hp>0)
      const hazards=fieldsRef.current.flatMap(field=>field.squares)
      const choice=chooseTacticalEnemyAction(actor.weapon,actor,heroAt,occupied,hazards)
      if(choice.move){
        actor.col=choice.move.col;actor.rank=choice.move.rank
        note(actor.name+' moves to rank '+(actor.rank+1)+', column '+(actor.col+1)+'.')
        continue
      }
      if(enemyDamageBudgetRef.current<=0){
        note(actor.name+' holds position while the group regroups.')
        continue
      }
      const enemySquares=choice.attack?getTacticalAffectedSquares(choice.attack,heroAt):[]
      setEnemyArea(enemySquares)
      await sleep(320)
      const occupiedByHero=enemySquares.some(cell=>cell.col===heroAt.col&&cell.rank===heroAt.rank)
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
      if(!occupiedByHero)incoming=0
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
      if(damage>0&&fusionDodgeRef.current){
        damage=0;fusionDodgeRef.current=false
        note('Shadow Fusion evades an incoming strike.')
      }else if(damage>0&&fusionWardRef.current>0){
        const absorbed=Math.min(damage,fusionWardRef.current)
        damage-=absorbed;fusionWardRef.current-=absorbed
        note('Earth Fusion absorbs '+absorbed+' damage.')
         if(absorbed>0&&fortressCounterRef.current>0){
           const counter=fortressCounterRef.current
           actor.hp=Math.max(0,actor.hp-counter)
           note("Titan's Fortress counters "+actor.name+' for '+counter+' damage.')
         }
         if(fusionWardRef.current<=0)fortressCounterRef.current=0
      }
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
      setEnemyArea([])
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
    if(fusionRegenRef.current.turns>0&&hpRef.current>0){
      updateHp(hpRef.current+fusionRegenRef.current.amount)
      fusionRegenRef.current.turns--
      note('Plant Fusion restores '+fusionRegenRef.current.amount+' HP.')
    }
    regen.messages?.forEach(note)
    setKeyCooldowns(prev=>advanceKeystoneCooldowns(prev,castKeyRef.current))
    setElemCooldowns(prev=>advanceKeystoneCooldowns(prev,castElementRef.current))
    signatureCooldownRef.current=Math.max(0,signatureCooldownRef.current-1)
    setSignatureCooldown(signatureCooldownRef.current)
    if(statusRef.current.cfx_tornadoTurns>0)statusRef.current.cfx_tornadoTurns--
    if(statusRef.current.cfx_ironDomainTurns>0 &&
        castElementRef.current!=='metal_ultimate_iron_domain')
      statusRef.current.cfx_ironDomainTurns--
    castKeyRef.current=null;castElementRef.current=null
    defendingRef.current=false
    if(mpRef.current<mpMax)updateMp(recoverCombatMp(mpRef.current,mpRegen,mpMax))
    roundStartedRef.current=false
    emergencyUsedRef.current=false;setEmergencyUsed(false)
    roundRef.current+=1;setRound(roundRef.current)
    apRef.current=maxAp;setAp(maxAp)
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
    const target=nextAliveTarget(foesRef.current,focus)
    const attackSquare=kind==='attack'?{...aim}:null
    const selected=kind==='attack'?attack:null
    if(kind==='attack'&&((selected?.fallback&&emergencyUsedRef.current)||!isTacticalTargetValid(selected,heroRef.current,attackSquare)||
      (selected?.thrown&&improvisedThrowTurnsRemaining(
        throwReadyRef.current,roundRef.current)>0)))return
    if(kind==='move'&&(!position||position.col<0||position.col>2||position.rank<0||
      position.rank>2||Math.abs(position.col-heroRef.current.col)+
        Math.abs(position.rank-heroRef.current.rank)!==1))return
    if(kind==='skill'&&(!ClsCombat.getActiveClassSkills(combatPlayer,statusRef.current)
      .some(skill=>skill.id===id&&skill.available!==false)||
      !canUseTacticalSkill(id,heroRef.current,target,getSkillLevel(player,id))))return
    if(kind==='elemental'&&(!canUseElementalAttack(combatPlayer,id)||
      !canUseTacticalSkill(id,heroRef.current,target,getSkillLevel(player,id))||
      (elemCooldowns[id]||0)>0||mpRef.current<getAttackMpCost(combatPlayer,id,statusRef.current)))return
    if(kind==='signature'&&!canCastFusionSignature(signature,{
      enabled:fusionEnabled,ap:apRef.current,mp:mpRef.current,
      cooldown:signatureCooldownRef.current,target
    }))return
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
      if((['skill','elemental'].includes(kind) ||
           (kind==='signature'&&signature?.target==='enemy')) &&
        (!liveTarget || (kind==='attack'
          ? !isTacticalTargetValid(attack,heroRef.current,liveTarget)||
            (attack.thrown&&improvisedThrowTurnsRemaining(
              throwReadyRef.current,roundRef.current)>0)
          : kind==='signature'
          ? !planFusionSignature(signature,foesRef.current,liveTarget.id,heroRef.current).valid
          : !canUseTacticalSkill(id,heroRef.current,liveTarget,getSkillLevel(player,id))))){
        note('Your target moved or fell before your action. Select a new target; no AP spent.')
        return
      }
      if(['attack','skill','elemental'].includes(kind))setPreviewSkill(null)
      if(kind==='attack')strike(attackSquare)
      else if(kind==='move'){
        heroRef.current=position;setHero(position)
        note('You move to rank '+(position.rank+1)+', column '+(position.col+1)+'.')
      }
      else if(kind==='skill')resolveSkill(id,liveTarget||target)
      else if(kind==='elemental')resolveElement(id,liveTarget||target)
      else if(kind==='signature')castSignature(liveTarget||target)
      else if(kind==='keystone')resolveKeystone(id,liveTarget||target)
      else if(kind==='defend'){
        defendingRef.current=true
        applyStonebornDefend(combatPlayer,statusRef.current)
        note('You prepare your guard.')
      }else if(kind==='end')note('You end the turn.')

      if(foesRef.current.every(u=>u.hp<=0)){await finish('win');return}
      if(kind==='attack'&&attack.fallback){
        emergencyUsedRef.current=true;setEmergencyUsed(true)
      }
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

  async function useBattlePotion(item) {
    if(busyRef.current||result||apRef.current<1)return
    const restored=Math.min(Math.max(0,maxHp-hpRef.current),Math.max(0,Number(item.hp_restore)||0))
    if(restored<=0){note('No healing needed.');return}
    busyRef.current=true;setBusy(true)
    try {
      const used=await consumeItem(item.id)
      if(!used.ok){note(used.reason||'Could not use item.');return}
      updateHp(hpRef.current+restored)
      apRef.current-=1;setAp(apRef.current)
      note('Used '+item.name+' · +'+restored+' HP (1 AP).')
    } finally {busyRef.current=false;setBusy(false)}
  }

  const target=nextAliveTarget(foes,focus)
  const chosen=target?.id||null
  const activeSkills=ClsCombat.getActiveClassSkills(combatPlayer,statusRef.current)||[]
  const elemental=getEquippedElementalAttack(combatPlayer)
  const keystones=getUnlockedKeystones(combatPlayer,keyCooldowns)
  const displayPattern=signaturePreview
    ?(signature?.target==='enemy'?signature.attack:null)
    :previewSkill?groupSpellPattern(previewSkill.id):attack
  const signaturePlan=signaturePreview?planFusionSignature(signature,foes,chosen,hero):null
  const displayName=signaturePreview?signature?.label:previewSkill?.label||attack.label
  const preview=previewGroupAttack(foes,displayPattern,hero,aim)
  const attackLegal=previewGroupAttack(foes,attack,hero,aim).valid
  const canPlay=!busy&&!result
  const throwTurns=improvisedThrowTurnsRemaining(throwReady,round)
  const throwUnavailable=attack.thrown&&throwTurns>0
  return <div className="combat-screen group-combat">
    <div className="combat-encounter-title">⚔ GROUP ENCOUNTER · {enemyData.name} ⚔</div>
    <div className="combat-turn-banner">{foes.filter(u=>u.hp>0).length}/{foes.length} enemies remaining · {ap}/{maxAp} AP · {hp}/{maxHp} HP · {mp}/{mpMax} MP</div>
    <Battlefield foes={foes} hero={hero} focused={chosen} aim={aim} enemyArea={enemyArea} pattern={displayPattern}
      fields={fieldsRef.current} canMove={canPlay&&ap>=1}
      signatureFx={signatureFx}
      protectedPreview={signaturePreview&&signature?.target==='self'
        ?signaturePlan.squares:[]}
      onFocus={(square,id)=>{setAim(square);if(id)setFocus(id)}}
      onMove={point=>takeTurn('move',null,point)} />
    <div className="combat-group-enemies" aria-live="polite">
      {foes.map(unit=><button key={unit.id} type="button"
        className={'combat-group-unit'+(unit.id===chosen?' current':'')}
        disabled={unit.hp<=0} onClick={()=>{setFocus(unit.id);setAim({col:unit.col,rank:unit.rank})}}>
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
    <button type="button" className="combat-action-btn"
      disabled={!canPlay||!attackLegal||throwUnavailable||ap<attack.ap||(attack.fallback&&emergencyUsed)}
      onClick={()=>takeTurn('attack')}>
      Attack {target?.name||'target'} · {attack.label} · {attack.ap} AP
    </button>
    <div className="combat-tactical-status">
      <span>{weapon?'Weapon: '+weaponType:'No weapon equipped · Basic combat'}
        {' · '}Mastery Lv {weaponMasteryLevel((player.weapon_mastery||{})[weaponType]||0)}
      </span>
    </div>
    <CombatActionPoints ap={ap} max={maxAp} round={round}/>
    {activeFusion&&!result&&<div className="combat-fusion-status">
      <span>✦ {activeFusion.kind==='triad'
        ?activeFusion.element+' Elemental Triad'
        :activeFusion.classKey+' + '+activeFusion.element}
        {' · Fusion Lv '+activeFusion.level}
        {activeFusion.kind==='triad'
          ?' · 3 elemental skills · '+signature?.mp+' MP per combined cast'
          :(fusionEnabled?' · Infusion active':' · Infusion inactive')+
            ' · '+FUSION_MP_COST+' MP per infused hit'}
      </span>
      <button type="button" className="combat-action-btn" disabled={!canPlay}
        aria-pressed={fusionEnabled} onClick={()=>setFusionEnabled(value=>!value)}>
        {fusionEnabled?'Disable Fusion':'Enable Fusion'}
      </button>
    </div>}
    {!activeFusion&&fusionEligibility.pair&&!result&&
      <p className="combat-fusion-locked">✦ Class–element fusion is locked for this pairing.
        Develop both paths, then unlock it in Skills.</p>}
    {signatureFx&&<div key={signatureFx.id}
      className={'combat-signature-burst signature-'+signatureFx.kind+
        (signatureFx.element?' triad-'+signatureFx.element:'')}
      role="status">{signature?.label}</div>}
    {signaturePreview&&signaturePlan?.valid&&!result&&
      <p className="combat-attack-preview" role="status">
        {signature.label} · {signature.target==='self'
          ?signaturePlan.squares.length+' protected ally squares'
          :signaturePlan.hits.length+' targets'} · {signature.attack.shape} pattern
      </p>}
    {target&&attackLegal&&!signaturePreview&&!result&&
      <p className="combat-attack-preview" role="status">
        {displayName} preview · {preview.targets.length} {preview.targets.length===1?'enemy':'enemies'} {previewSkill?'affected':'hit'} · {displayPattern.shape} pattern
      </p>}
    {previewSkill&&!displayPattern&&!signaturePreview&&!result&&
      <p className="combat-attack-preview" role="status">{displayName} · self/support, no enemy squares targeted.</p>}
    {target&&!attackLegal&&!previewSkill&&!signaturePreview&&!result&&
      <p className="combat-range-warning" role="status">
        {attack.label} cannot reach {target.name} from here. Move, choose a different attack, or select another enemy.
      </p>}
    {!result&&<>
      <div className="combat-tactical-weapons">
        {weaponKit.map(item=><button key={item.id} type="button"
          className={'combat-action-btn'+(item.id===attack.id?' selected':'')}
          disabled={!canPlay||(item.thrown&&throwTurns>0)||(item.fallback&&emergencyUsed)}
          aria-pressed={item.id===attack.id}
          onClick={()=>{setSelectedAttack(item.id);setPreviewSkill(null);setSignaturePreview(false)}}>
          {item.label}
          <span className="combat-action-sub">{item.ap} AP · {tacticalAttackDescription(item)}
            {item.thrown&&throwTurns>0?' · Recovering ('+throwTurns+' rounds)':''}
          </span>
        </button>)}
      </div>
      <div className="combat-attack-details" role="status">
        <strong>{attack.label} · {attack.ap} AP</strong>
        <p>{tacticalAttackDescription(attack)}</p>
        {throwTurns>0&&!weapon&&<p className="combat-recovery-status">
          Thrown object recovery: {throwTurns} round{throwTurns===1?'':'s'} remaining.
          Basic Strike is still available.
        </p>}
      </div>
      <BattleConsumables items={inventory} hp={hp} maxHp={maxHp} disabled={!canPlay||ap<1} onUse={useBattlePotion}/>
      <div className="combat-actions">
        <button type="button" className="combat-action-btn"
          disabled={!canPlay||!attackLegal||throwUnavailable||ap<attack.ap||(attack.fallback&&emergencyUsed)}
          onClick={()=>takeTurn('attack',chosen)}>Use {attack.label} · {attack.ap} AP</button>
        <button type="button" className="combat-action-btn" disabled={!canPlay||ap<2}
          onClick={()=>takeTurn('defend')}>Defend · 2 AP</button>
        <button type="button" className="combat-action-btn" disabled={!canPlay}
          onClick={()=>takeTurn('end')}>End turn</button>
        {activeSkills.map(skill=><button key={skill.id} type="button" className="combat-action-btn"
          disabled={!canPlay||skill.available===false||
            (!isFreeClass(skill.id)&&ap<2)||
            !canUseTacticalSkill(skill.id,hero,target,getSkillLevel(player,skill.id))}
          onClick={()=>takeTurn('skill',skill.id)}>
          {skill.label} · Lv {getSkillLevel(player,skill.id)}
          <span className="combat-action-sub">{groupSpellPattern(skill.id)?.shape||'Self / support'} · 2 AP</span>
        </button>)}
        {activeSkills.map(skill=><button key={skill.id+'-preview'} type="button"
          className="combat-action-btn combat-preview-btn" disabled={!canPlay}
          onClick={()=>setPreviewSkill({id:skill.id,label:skill.label})}>
          Preview {skill.label} · Lv {getSkillLevel(player,skill.id)}
        </button>)}
        {elemental&&<button type="button" className="combat-action-btn"
          disabled={!canPlay||ap<2||!canUseTacticalSkill(elemental.id,hero,target,getSkillLevel(player,elemental.id))||
            (elemCooldowns[elemental.id]||0)>0||
            mp<getAttackMpCost(combatPlayer,elemental.id,statusRef.current)}
          onClick={()=>takeTurn('elemental',elemental.id)}>
          {elemental.label} · Lv {getSkillLevel(player,elemental.id)}
          <span className="combat-action-sub">{groupSpellPattern(elemental.id)?.shape||'Self / support'} · {getAttackMpCost(combatPlayer,elemental.id,statusRef.current)} MP</span>
        </button>}
        {elemental&&<button type="button" className="combat-action-btn combat-preview-btn"
          disabled={!canPlay} onClick={()=>setPreviewSkill({id:elemental.id,label:elemental.label})}>
          Preview {elemental.label} · Lv {getSkillLevel(player,elemental.id)}
        </button>}
        {signature&&<button type="button" className="combat-action-btn combat-signature-action"
          disabled={!canPlay||!canCastFusionSignature(signature,{
            enabled:fusionEnabled,ap,mp,cooldown:signatureCooldown,target
          })}
          onClick={()=>takeTurn('signature')}>
          ✦ {signature.label} · {signature.ap} AP · {signature.mp} MP
          <span className="combat-action-sub">
            {signatureCooldown>0?'Cooldown: '+signatureCooldown+' rounds':
              fusionEnabled?(signature.technique||'Signature')+' · '+
                signature.attack.shape:'Fusion inactive'}
          </span>
        </button>}
        {signature&&<button type="button" className="combat-action-btn combat-preview-btn"
          disabled={!canPlay} onClick={()=>{setSignaturePreview(true);setPreviewSkill(null)}}>
          Preview ✦ {signature.label}
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
