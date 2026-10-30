// CombatScreen.jsx
// ─────────────────────────────────────────────────────────────────────────
// The piece flagged as "not built yet" in MIGRATION.md since the start of
// this migration — a real single-enemy fight screen. Everything it calls
// (classCombat.js's hooks, enemyAI.js's resolveEnemyTurn/initEnemyState)
// was already ported unchanged; this is what actually calls them from
// real UI state instead of Ch1's innerHTML-templated buildCombatUI.
//
// judgeCtx (optional): { playerMoral, elementsAttempted } — when present,
// gets attached to the ctx passed to resolveEnemyTurn, which is what lets
// an enemy named for a bespoke AI (like the Twin Judges) pick its
// scenario. Every other enemy just falls through enemyAI.js's generic
// handler — this component doesn't need to know or care which.
import { useState, useEffect, useRef } from 'react'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useInventoryStore } from '../../store/useInventoryStore'
import * as ClsCombat from '../../game/classCombat'
import { initEnemyState, resolveEnemyTurn } from '../../game/enemyAI'
import { calcATK, calcDEF, calcSPD, calcMaxHp, getCombatPlayer, getEffectiveStats } from '../../game/playerStats'
import { resistMult, reflectFraction, critChanceBonus, critDamageBonus } from '../../game/elementalBonuses'
import { grantXp } from '../../game/progression'
import { grantLoot } from '../../game/loot'
import { persistCombatResult } from '../../game/combatPersistence'
import { getUnlockedKeystones, applyKeystone } from '../../game/elementalKeystones'
import { getEquippedElementalAttack, canUseElementalAttack, getAttackMpCost, resolveElementalAttack } from '../../game/elementalAttacks'
import { getMaxCombatMp, getCombatMpRegen, recoverCombatMp, clampCombatMp } from '../../game/combatMp'
import { advanceKeystoneCooldowns, applyKeystoneStatuses, applyStonebornDefend, stonebornArmorPierce, consumeEnemyStun, resolveKeystoneDefense, resolveKeystoneStrike, resolveKeystoneRegen } from '../../game/keystoneCombat'
import { equipmentSubtype, RANGED_WEAPONS } from '../../game/equipmentSlots'
import { getSkillLevel, scaleSkillAmount } from '../../game/skillLeveling'
import { getFusionSignatureAction, canCastFusionSignature } from '../../game/signatureFusion'
import { getActiveFusion, getFusionSignature,
  awardFusionPractice, FUSION_MP_COST, FUSION_MAX_PRACTICE_PER_FIGHT } from '../../game/classElementFusion'
import { applySingleFusionHit, absorbSingleFusionDamage, advanceSingleFusionRegen,
  initialSingleFusionGuard } from '../../game/singleFusionCombat'
import { getTacticalSkillRule, canUseTacticalSkill } from '../../game/tacticalSkills'
import {
  tacticalWeaponType, getTacticalAttacks, isTacticalTargetValid,
  getTacticalAffectedSquares, chooseTacticalEnemyAction,
  weaponMasteryLevel, weaponMasteryBonus, awardWeaponMastery,
  nextWeaponMasteryThreshold,
} from '../../game/tacticalGrid'
import './CombatScreen.css'
import EchoBeastPortrait from './EchoBeastPortrait'
import WatcherPortrait from './WatcherPortrait'
import TwinJudgesPortrait from './TwinJudgesPortrait'
import ChapterOneBossPortrait, { CH1_BOSS_ENTRANCE_MS } from './ChapterOneBossPortrait'

function HpBar({ hp, maxHp }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  return (
    <div className="combat-hp-bar">
      <div className={`combat-hp-fill ${pct < 30 ? 'low' : ''}`} style={{ width: pct + '%' }} />
    </div>
  )
}

const pause = ms => new Promise(resolve => setTimeout(resolve, ms))

// 3×3 positions run front (rank 0) to rear (rank 2) on both sides.
// The enemy is rendered at the top, hero at the bottom; blank tiles are
// tactical space, not extra combatants.
function TacticalBattlefield({ hero, enemy, enemyName, enemyIcon, enemyHp, attack, canAttack, canMove, onMove, onAttack,
  signatureFx,signaturePreview }) {
  const affected = attack && isTacticalTargetValid(attack,hero,enemy)
    ? getTacticalAffectedSquares(attack,enemy):[]
  const labels=['Left','Centre','Right']
  const names=['Front','Middle','Rear']
  function cells(side) {
    const rows=side==='enemy'?[2,1,0]:[0,1,2]
    return rows.flatMap(rank=>[0,1,2].map(col=>{
      const occupied=(side==='enemy'?enemy:hero).col===col&&(side==='enemy'?enemy:hero).rank===rank
      const move=side==='hero'&&!occupied&&Math.abs(hero.col-col)+Math.abs(hero.rank-rank)===1
      const targetable=side==='enemy'&&occupied&&enemyHp>0&&canAttack&&isTacticalTargetValid(attack,hero,enemy)
      const splash=side==='enemy'&&affected.some(c=>c.rank===rank&&c.col===col)
      const fx=signatureFx?.side===side&&signatureFx.squares.some(p=>p.rank===rank&&p.col===col)
      const area=signaturePreview?.side===side&&signaturePreview.squares.some(
        p=>p.rank===rank&&p.col===col)
      return <button key={side+'-'+col+'-'+rank} type="button"
        className={['combat-grid-cell',occupied?'occupied':'',side==='enemy'?'foe':'ally',
          targetable?'targetable':'',move&&canMove?'movable':'',
          splash?'splash':'',area?'signature-preview-guard':''].join(' ')}
        disabled={side==='enemy'?!targetable:!move||!canMove}
        onClick={()=>side==='enemy'?onAttack():onMove({col,rank})}
        aria-label={labels[col]+' '+names[rank]+(occupied?(side==='enemy'?' '+enemyName:' You'):' empty')+
          (targetable?' — attack':move&&canMove?' — move':'')}>
        <span>{occupied?(side==='enemy'?enemyIcon||'👹':'🧑'):'·'}</span>
        {fx&&<span key={signatureFx.id} aria-hidden="true"
          className={'signature-grid-flash signature-'+signatureFx.kind}/>}
        <small>{occupied?(side==='enemy'?'FOE':'YOU'):names[rank]}</small>
      </button>
    }))
  }
  return <div className="combat-grid-field" aria-label="Three by three tactical battlefield">
    <div className="combat-grid-caption">ENEMY · FRONT ROW NEAREST CENTRE</div>
    <div className="combat-grid-board">{cells('enemy')}</div>
    <div className="combat-grid-divider">⚔</div>
    <div className="combat-grid-board">{cells('hero')}</div>
    <div className="combat-grid-caption">YOU · TAP AN ADJACENT CELL TO MOVE</div>
  </div>
}

// Enemy AI provides a small, trusted emphasis vocabulary in its messages.
// Render those tags as React elements rather than displaying raw HTML.
function CombatMessage({ message }) {
  const parts = String(message).split(/(<\/?(?:em|strong)>)/gi)
  let emphasis = null
  return parts.map((part, index) => {
    if (/^<(em|strong)>$/i.test(part)) { emphasis = part.slice(1, -1).toLowerCase(); return null }
    if (/^<\/(em|strong)>$/i.test(part)) { emphasis = null; return null }
    if (emphasis === 'em') return <em key={index}>{part}</em>
    if (emphasis === 'strong') return <strong key={index}>{part}</strong>
    return <span key={index}>{part}</span>
  })
}

export default function CombatScreen({ enemyData, onWin, onLose, onEscape, isBoss, judgeCtx }) {
  const player = usePlayerStore(s => s.player)
  const updatePlayer = usePlayerStore(s => s.updatePlayer)
  const items = useInventoryStore(s => s.items)
  const loadInventory = useInventoryStore(s => s.loadInventory)
  const equipped = items.filter(i => i.equipped_slot)
  const legendary = new Set(equipped.map(i => i.item_key))
  const legendaryTurnRef = useRef(0)
  const effective = getEffectiveStats(player,equipped)
  const combatPlayer = getCombatPlayer(player,equipped)
  const activeFusion = getActiveFusion(player)
  const signature=getFusionSignatureAction(activeFusion)
  const [fusionEnabled, setFusionEnabled] = useState(false)
  const [signaturePreview,setSignaturePreview]=useState(false)
  const [signatureCooldown,setSignatureCooldown]=useState(0)
  const signatureCooldownRef=useRef(0)
  const [signatureFx,setSignatureFx]=useState(null)
  const signatureFxId=useRef(0)
  const fusionGuardRef = useRef(initialSingleFusionGuard())
  const fusionPracticeRef = useRef(0)

  const maxPlayerHp = calcMaxHp(player, equipped)
  const maxCombatMp = getMaxCombatMp(combatPlayer)
  const mpRegen = getCombatMpRegen(combatPlayer)
  const [currentMp, setCurrentMp] = useState(maxCombatMp)
  const mpRef = useRef(maxCombatMp)
  function changeCombatMp(value) {
    const next = clampCombatMp(value, maxCombatMp)
    mpRef.current = next
    setCurrentMp(next)
  }
  const [currentHp, setCurrentHp] = useState(player.hp ?? maxPlayerHp)
  const [enemyHp, setEnemyHp] = useState(enemyData.hp)
  const [defending, setDefending] = useState(false)
  const [result, setResult] = useState(null)
  const [combatSaveError, setCombatSaveError] = useState('')
  const [combatSaving, setCombatSaving] = useState(false)
  const [log, setLog] = useState([`A ${enemyData.name} appears.`])
  const [busy, setBusy] = useState(false)
  const weaponItem = equipped.find(item => item.equipped_slot === 'mainhand')
  const weaponType = tacticalWeaponType(weaponItem ? equipmentSubtype(weaponItem) : null)
  const weaponAttacks = getTacticalAttacks(weaponType, [], (player.weapon_mastery || {})[weaponType] || 0)
  const enemyWeapon = tacticalWeaponType(enemyData.weapon_type || enemyData.weapon || enemyData.subtype)
  const [selectedAttackId, setSelectedAttackId] = useState(null)
  const selectedAttack = weaponAttacks.find(a=>a.id===selectedAttackId) || weaponAttacks[0]
  const [heroPosition, setHeroPosition] = useState({col:1,rank:0})
  const [enemyPosition, setEnemyPosition] = useState({col:1,rank:0})
  const [actionPoints, setActionPoints] = useState(2)
  const actionPointsRef = useRef(2)
  const roundStartedRef = useRef(false)
  const masteryHitsRef = useRef(0)
  const [keystoneCooldowns, setKeystoneCooldowns] = useState({})
  const [elementalCooldowns, setElementalCooldowns] = useState({})
  // Chapter 1 guardians have staged introductions; don't allow a move to
  // interrupt the entrance before the first combat turn begins.
  const entranceDuration = CH1_BOSS_ENTRANCE_MS[enemyData.name] ?? 0
  const [entranceReady, setEntranceReady] = useState(entranceDuration === 0)
  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (entranceDuration === 0 || reducedMotion) {
      setEntranceReady(true)
      return
    }
    setEntranceReady(false)
    const timer = setTimeout(() => setEntranceReady(true), entranceDuration)
    return () => clearTimeout(timer)
  }, [enemyData.name, entranceDuration])
  const [turnActor, setTurnActor] = useState(null)
  const [enemyMoveKey, setEnemyMoveKey] = useState(null)
  const [guardianPhase, setGuardianPhase] = useState(1)
  const [judgeHit, setJudgeHit] = useState(false)
  const judgeHitTimer = useRef(null)
  const judgeHitResetTimer = useRef(null)
  useEffect(() => () => {
    clearTimeout(judgeHitTimer.current)
    clearTimeout(judgeHitResetTimer.current)
  }, [])
  function showJudgeHit() {
    if (!['The Twin Judges','Sentinel of the First Eye','The Surveyor','The Unseen'].includes(enemyData.name) && enemyData.name !== 'The Watcher') return
    clearTimeout(judgeHitTimer.current)
    clearTimeout(judgeHitResetTimer.current)
    setJudgeHit(false)
    judgeHitTimer.current = setTimeout(() => {
      setJudgeHit(true)
      judgeHitResetTimer.current = setTimeout(() => setJudgeHit(false), 430)
    }, 20)
  }

  const statusEffectsRef = useRef({})
  const enemyStateRef = useRef(initEnemyState(enemyData))
  // Boss AI adjusts enemy.atk on certain phase transitions. Keep that
  // mutable state private to this fight, not on the shared story node.
  const combatEnemyRef = useRef({ ...enemyData })
  const dbUpdatesRef = useRef({})
  const completionTimerRef = useRef(null)
  const combatOutcomeRef = useRef(null)
  const combatMountedRef = useRef(false)
  // Do not let a delayed save or an old completion timer navigate away
  // after this encounter has been replaced or the page has been closed.
  useEffect(() => {
    combatMountedRef.current = true
    return () => {
      combatMountedRef.current = false
      clearTimeout(completionTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const r = ClsCombat.onCombatStart(combatPlayer, statusEffectsRef.current)
    if (r?.messages?.length) pushLog(r.messages[0])
    if (r?.dbUpdates) Object.assign(dbUpdatesRef.current, r.dbUpdates)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pushLog(line) { setLog(l => [line, ...l].slice(0, 30)) }

  // Fusion is an optional extra after a successful existing weapon or class
  // attack. It never substitutes for boss AI, class hooks or elemental casts.
  function infuseSingleHit(foeHp, playerHp, originalDamage) {
    if(!fusionEnabled || !activeFusion || originalDamage<=0 ||
       mpRef.current<FUSION_MP_COST)return {foeHp,playerHp}
    const effect=applySingleFusionHit(activeFusion,{
      foeHp,playerHp,maxPlayerHp,status:statusEffectsRef.current,
      guard:fusionGuardRef.current,
    })
    if(!effect)return {foeHp,playerHp}
    changeCombatMp(mpRef.current-FUSION_MP_COST)
    statusEffectsRef.current=effect.status
    fusionGuardRef.current=effect.guard
    fusionPracticeRef.current=Math.min(FUSION_MAX_PRACTICE_PER_FIGHT,
      fusionPracticeRef.current+1)
    pushLog('✦ '+effect.rider.label+' · '+activeFusion.element+' infusion (-'+
      FUSION_MP_COST+' MP). Fusion practice +1 on victory.')
    if(effect.bonusDamage>0)pushLog('Fusion deals '+effect.bonusDamage+' additional damage.')
    if(effect.bonusDamage>0)showJudgeHit()
    return {foeHp:effect.foeHp,playerHp:effect.playerHp}
  }

  // Signature actives work alongside the existing class and elemental skills.
  // Existing boss phases, enemy AI and class hooks remain untouched.
  function castSignature(foeHp,playerHp) {
    if(!signature)return {foeHp,playerHp}
    const before=foeHp
    changeCombatMp(mpRef.current-signature.mp)
    if(signature.kind==='phantom'){
      foeHp=Math.max(0,foeHp-signature.damage)
      statusEffectsRef.current.cfx_emberStacks=Math.min(5,
        (statusEffectsRef.current.cfx_emberStacks||0)+1)
      statusEffectsRef.current.infernoTurns=Math.max(
        statusEffectsRef.current.infernoTurns||0,signature.fieldTurns)
      statusEffectsRef.current.infernoDmg=signature.fieldDamage
      pushLog('Phantom Inferno ignites '+signature.attack.shape+
        ' squares, dealing '+signature.damage+' damage and leaving burning ground.')
    }else if(signature.kind==='thunder'){
      let damage=0
      for(let i=0;i<signature.hits;i++)
        damage+=Math.max(1,Math.round(signature.damage*.7**i))
      foeHp=Math.max(0,foeHp-damage)
      statusEffectsRef.current.enemyStunTurns=Math.max(
        statusEffectsRef.current.enemyStunTurns||0,signature.stun)
      pushLog('Thunderous Fury strikes '+signature.hits+' times for '+damage+' damage.')
    }else if(signature.kind==='titan'){
      fusionGuardRef.current={
        ...fusionGuardRef.current,
        ward:Math.max(fusionGuardRef.current.ward,signature.ward),
        counter:signature.counter,
      }
      pushLog("Titan's Fortress creates a "+signature.ward+
        '-point barrier that counters enemy attacks.')
    }
    if(before>foeHp)showJudgeHit()
    setEnemyHp(foeHp);setCurrentHp(playerHp)
    signatureCooldownRef.current=signature.cooldown+1
    setSignatureCooldown(signatureCooldownRef.current)
    setSignatureFx({id:++signatureFxId.current,kind:signature.kind,
      side:signature.target==='self'?'hero':'enemy',
      squares:getTacticalAffectedSquares(signature.attack,
        signature.target==='self'?heroPosition:enemyPosition)})
    setSignaturePreview(false)
    return {foeHp,playerHp}
  }

  async function saveCombatOutcome() {
    const pending = combatOutcomeRef.current
    if (!pending || pending.saving || pending.notified) return
    setCombatSaving(true)
    setCombatSaveError('')
    const saved = await persistCombatResult(
      pending,
      updates => updatePlayer(updates),
      async () => {
        if (pending.outcome !== 'win' || !enemyData.loot?.length) return
        const drops = await grantLoot(player.id, enemyData.loot, effective.core.luck)
        await loadInventory(player.id)
        if (drops.length) {
          pushLog('Loot: ' + drops.map(d => `${d.icon || '📦'} ${d.name} ×${d.qty}`).join(' · '))
        }
      },
    )
    if (!combatMountedRef.current) return
    setCombatSaving(false)
    if (!saved) {
      setCombatSaveError(pending.error || 'Character progress could not be saved. Retry to continue.')
      return
    }
    if (pending.rewardError) pushLog('Loot could not be saved: ' + pending.rewardError)
    if (pending.victoryText) pushLog(pending.victoryText)
    pending.notified = true
    // Keep the victory animation before routing, but never advance
    // the story unless the player progression has actually been saved.
    const victoryDelay = pending.outcome === 'win'
      ? enemyData.name === 'The Watcher' ? 2000
        : ['Sentinel of the First Eye', 'The Surveyor', 'The Unseen'].includes(enemyData.name) ? 1500
        : enemyData.name === 'The Twin Judges' ? 1200
        : 900
      : 900
    clearTimeout(completionTimerRef.current)
    completionTimerRef.current = setTimeout(() => {
      if (!combatMountedRef.current) return
      if (pending.outcome === 'win') onWin?.()
      else if (pending.outcome === 'escape') onEscape?.()
      else onLose?.()
    }, victoryDelay)
  }

  async function endCombat(outcome, hpAtEnd = currentHp) {
    if (combatOutcomeRef.current) return
    setResult(outcome)
    const end = ClsCombat.onCombatEnd(combatPlayer, statusEffectsRef.current,
      outcome === 'win' ? 'victory' : 'defeat')
    if (end?.dbUpdates) Object.assign(dbUpdatesRef.current, end.dbUpdates)
    const finalUpdates = {
      ...dbUpdatesRef.current,
      hp: outcome === 'win' ? hpAtEnd : Math.max(1, hpAtEnd),
    }
    let victoryText = ''
    if (outcome === 'win') {
      // Count a maximum of six meaningful weapon actions per encounter.
      // Emergency System Pulse and non-weapon abilities never earn mastery.
      if (masteryHitsRef.current) {
        finalUpdates.weapon_mastery = awardWeaponMastery(player.weapon_mastery || {},
          weaponType, masteryHitsRef.current)
      }
      if (activeFusion && fusionPracticeRef.current) {
        finalUpdates.fusion_mastery = awardFusionPractice(player.fusion_mastery || {},
          activeFusion.key, fusionPracticeRef.current)
      }
      const rewards = grantXp({ ...player, hp: finalUpdates.hp, ...finalUpdates }, enemyData.xp || 0)
      Object.assign(finalUpdates, rewards)
      victoryText = `Victory! +${enemyData.xp || 0} XP${rewards.level > (player.level || 1) ? ` · Level ${rewards.level}!` : ''}`
    }
    combatOutcomeRef.current = {
      outcome, updates: finalUpdates, victoryText,
      saving: false, committed: false, rewardsHandled: false, notified: false,
    }
    await saveCombatOutcome()
  }

  // Exactly one round of ongoing status/regen per enemy action, including
  // movement and stunned turns. Moving must never suppress bleed, poison,
  // class regeneration or keystone duration ticks.
  function finishEnemyAction(nextHp, foeHp) {
    statusEffectsRef.current._enemyMaxHp = enemyData.hp
    const turnEnd = ClsCombat.onTurnEnd(combatPlayer, statusEffectsRef.current)
    if (turnEnd?.messages?.length) turnEnd.messages.forEach(pushLog)
    if (turnEnd?.damageToEnemy > 0) foeHp = Math.max(0, foeHp - turnEnd.damageToEnemy)
    if (turnEnd?.healToPlayer > 0 && nextHp > 0) nextHp = Math.min(maxPlayerHp, nextHp + turnEnd.healToPlayer)
    const keystoneTick = resolveKeystoneRegen(statusEffectsRef.current, foeHp, nextHp, maxPlayerHp)
    foeHp = keystoneTick.enemyHp
    nextHp = keystoneTick.playerHp
    keystoneTick.messages.forEach(pushLog)
    const fusionRegen=advanceSingleFusionRegen(nextHp,maxPlayerHp,fusionGuardRef.current)
    fusionGuardRef.current=fusionRegen.guard
    nextHp=fusionRegen.playerHp
    if(fusionRegen.healed>0)pushLog('Plant Fusion restores '+fusionRegen.healed+' HP.')

    setEnemyHp(foeHp)
    setCurrentHp(nextHp)
    setDefending(false)
    return { playerHp: nextHp, foeHp }
  }

  function enemyTurn(playerHp, foeHp, isDefending = false, damageLimit = Infinity, forcedPulse = false) {
    const messages = []
    let aiDmg = 0
    let healAmt = 0
    const ctx = {
      enemyState: enemyStateRef.current,
      enemyHp: foeHp, maxEnemyHp: enemyData.hp, currentHp: playerHp, maxPlayerHp,
      playerDEF: () => calcDEF(player, equipped),
      defending: isDefending, statusEffects: statusEffectsRef.current, yara: null, messages,
      triggerAnimation: () => {},
      onEnemyDmgPlayer: (d) => { aiDmg += d },
      onEnemyHealSelf: (h) => { healAmt += h },
      ...(judgeCtx ? { playerMoral: judgeCtx.playerMoral, elementsAttempted: judgeCtx.elementsAttempted } : {}),
    }
    const stunned = consumeEnemyStun(statusEffectsRef.current)
    if (stunned) messages.push(stunned)
    // The emergency pulse must not secretly trigger an enemy AI special
    // attack, including its stun/bleed/status side effects.
    const aiMove = stunned || forcedPulse ? null : resolveEnemyTurn(combatEnemyRef.current, ctx)
    if (!stunned && forcedPulse) aiDmg = 2
    if (!stunned && (statusEffectsRef.current.cfx_longDecayStacks || 0) > 0) {
      aiDmg = Math.max(0, aiDmg - 3 * statusEffectsRef.current.cfx_longDecayStacks)
    }
    if (!stunned && statusEffectsRef.current.cfx_tornadoTurns > 0) {
      aiDmg = Math.round(aiDmg * 0.7)
      statusEffectsRef.current.cfx_tornadoTurns -= 1
      messages.push('Tornado Field weakens the enemy attack.')
    }
    // AI keeps full ownership of move selection and damage. The move key
    // only tells the Chapter 1 portrait which attack to animate.
    if (CH1_BOSS_ENTRANCE_MS[enemyData.name] > 0) {
      setEnemyMoveKey(aiMove?.moveKey ?? null)
      // Use the AI's actual phase gates rather than guessing from HP.
      setGuardianPhase(enemyStateRef.current.phase)
    }

    foeHp = Math.min(enemyData.hp, foeHp + healAmt)

    aiDmg = Math.min(damageLimit, aiDmg)
    // Route the AI's intended damage through onPlayerHit so defensive class
    // skills (shields, counters, thorns) get a chance to react, same as
    // the vanilla engines did. Real return shape is {dmgMult, reflectAmount,
    // messages} — not a flat "final damage" field, so apply the multiplier
    // ourselves.
    const hitResult = ClsCombat.onPlayerHit(combatPlayer, statusEffectsRef.current, enemyData, aiDmg, maxPlayerHp)
    let finalDmg = Math.max(0, Math.round(aiDmg * (hitResult?.dmgMult ?? 1) * resistMult(combatPlayer)))
    const dodgeChance = Math.min(.25,Math.max(0,effective.core.agility)*.01)
    if (finalDmg > 0 && Math.random() < dodgeChance) {
      finalDmg = 0
      messages.push('You evade the attack!')
    }
    if (hitResult?.messages?.length) messages.push(...hitResult.messages)

    if (legendary.has('legendary_miner')) { finalDmg = Math.max(0,finalDmg-3); messages.push('Deepstone Heart absorbs 3 damage.') }
    const keystoneDefense = resolveKeystoneDefense(statusEffectsRef.current, finalDmg)
    finalDmg = keystoneDefense.damage
    messages.push(...keystoneDefense.messages)
    const fusionDefense=absorbSingleFusionDamage(finalDmg,fusionGuardRef.current)
    finalDmg=fusionDefense.damage
    fusionGuardRef.current=fusionDefense.guard
    messages.push(...fusionDefense.messages)
    if(fusionDefense.reflected>0){
      foeHp=Math.max(0,foeHp-fusionDefense.reflected)
      messages.push("Titan's Fortress counters for "+fusionDefense.reflected+' damage.')
    }
    if (keystoneDefense.mpGain > 0) {
      const gained = recoverCombatMp(mpRef.current, keystoneDefense.mpGain, maxCombatMp) - mpRef.current
      if (gained > 0) { changeCombatMp(mpRef.current + gained); messages.push(`Aegis restores ${gained} MP.`) }
    }
    if (keystoneDefense.reflected > 0) {
      foeHp = Math.max(0, foeHp - keystoneDefense.reflected)
      messages.push(`${keystoneDefense.reflected} keystone damage reflected.`)
    }
    let nextHp = Math.max(0, playerHp - finalDmg)
    setCurrentHp(nextHp)

    // reflectAmount — damage bounced back onto the enemy (thorns-style effects)
    if (hitResult?.reflectAmount > 0) {
      foeHp = Math.max(0, foeHp - hitResult.reflectAmount)
      messages.push(`${hitResult.reflectAmount} damage reflected back.`)
    }
    const elementalReflect = Math.round(finalDmg * reflectFraction(combatPlayer))
    if (elementalReflect > 0) {
      foeHp = Math.max(0,foeHp-elementalReflect)
      messages.push(`${elementalReflect} elemental damage reflected.`)
    }
    messages.forEach(pushLog)

    return finishEnemyAction(nextHp, foeHp)
  }

  function playerAttack(foeHp, playerHp, attack) {
    const armorPierce = stonebornArmorPierce(combatPlayer, statusEffectsRef.current, enemyData.def || 0)
    const base = Math.max(1, calcATK(player, equipped) - (enemyData.def || 0) +
      armorPierce + Math.floor(Math.random() * 4))
    const atkResult = ClsCombat.onPlayerAttack(combatPlayer, statusEffectsRef.current, enemyData, base)
    const critChance = Math.min(.5,Math.max(0,effective.core.luck)*.01 + critChanceBonus(combatPlayer) + (atkResult?.critChanceAdd || 0))
    const wasCrit = Boolean(statusEffectsRef.current.cfx_guaranteedCrit) || atkResult?.wasCrit || Math.random() < critChance
    let dmg = Math.max(0, Math.round(base * (atkResult?.dmgMult ?? 1) * (wasCrit ? 1.5 + critDamageBonus(combatPlayer) : 1)))
    if (legendary.has('legendary_forger') && wasCrit) dmg += 12
    if (legendary.has('legendary_hunter') && foeHp === enemyData.hp) dmg += 15
    if (legendary.has('legendary_resonance_weaver')) dmg += 4
    if (statusEffectsRef.current.cfx_ironDomainTurns > 0) dmg *= 2
    const keystoneHit = resolveKeystoneStrike(statusEffectsRef.current, dmg, wasCrit)
    dmg = keystoneHit.damage
    // Existing ATK/DEF, criticals, status and gear effects remain the basis.
    // Tactical weapon techniques provide small relative modifiers only.
    dmg = attack.fallback
      ? Math.max(1, Math.round(dmg * .25))
      : dmg + Math.max(0, attack.damage - 4) +
        weaponMasteryBonus(player.weapon_mastery?.[weaponType] || 0)
    playerHp = Math.min(maxPlayerHp, playerHp + keystoneHit.heal)
    if (keystoneHit.heal > 0) setCurrentHp(playerHp)
    let newEnemyHp = Math.max(0, foeHp - dmg)
    ;({foeHp:newEnemyHp,playerHp}=infuseSingleHit(newEnemyHp,playerHp,dmg))
    setEnemyHp(newEnemyHp)
    setCurrentHp(playerHp)
    if (dmg > 0) showJudgeHit()

    const weapon = equipped.find(i=>i.equipped_slot==='mainhand')
    const ranged = weapon && RANGED_WEAPONS.includes(equipmentSubtype(weapon))
    const verb = ranged ? 'You shoot' : 'You strike'
    const msgs = [`${attack.label}: ${verb.toLowerCase()} for ${dmg}.${wasCrit ? ' ✦ Critical hit!' : ''}`, ...(atkResult?.messages || []), ...keystoneHit.messages]
    if (dmg > 0 && !attack.fallback && masteryHitsRef.current < 6) {
      masteryHitsRef.current++
      msgs.push(`${weaponType} mastery practice +1 (awarded on victory).`)
    }
    if (legendary.has('legendary_forger') && wasCrit) msgs.push('✦ Masterwork Edge adds 12 critical damage.')
    if (legendary.has('legendary_hunter') && foeHp === enemyData.hp) msgs.push('✦ Predator Instinct: opening shot +15.')
    if (legendary.has('legendary_resonance_weaver')) msgs.push('✦ Harmonic Pulse: +4 resonance damage.')
    if (atkResult?.dbUpdates) Object.assign(dbUpdatesRef.current, atkResult.dbUpdates)

    const postResult = ClsCombat.onPlayerAttackPost(combatPlayer, statusEffectsRef.current, enemyData, dmg, wasCrit)
    if (postResult?.messages?.length) msgs.push(...postResult.messages)
    if (postResult?.dbUpdates) Object.assign(dbUpdatesRef.current, postResult.dbUpdates)

    const hpChange = ClsCombat.onEnemyHpChange(combatPlayer, statusEffectsRef.current, enemyData, foeHp, newEnemyHp, enemyData.hp)
    if (hpChange?.messages?.length) msgs.push(...hpChange.messages)

    msgs.forEach(pushLog)

    if (newEnemyHp <= 0) {
      const killResult = ClsCombat.onKill(combatPlayer, statusEffectsRef.current, enemyData)
      if (killResult?.messages?.length) killResult.messages.forEach(pushLog)
      if (killResult?.dbUpdates) Object.assign(dbUpdatesRef.current, killResult.dbUpdates)
      return { foeHp: newEnemyHp, playerHp }
    }
    return { foeHp: newEnemyHp, playerHp }
  }

  function playerSkill(skillId, foeHp, playerHp) {
    const r = ClsCombat.onActiveSkill(skillId, combatPlayer, statusEffectsRef.current, enemyData)
    if (r?.messages?.length) r.messages.forEach(pushLog)
    if (r?.dbUpdates) Object.assign(dbUpdatesRef.current, r.dbUpdates)
    const skillLevel = getSkillLevel(player, skillId)
    const skillDamage = scaleSkillAmount(r?.enemyDamage, skillLevel)
    const skillHeal = scaleSkillAmount(r?.selfHeal, skillLevel)
    if (skillDamage > 0) foeHp = Math.max(0, foeHp - skillDamage)
    if (skillHeal > 0) {
      playerHp = Math.min(maxPlayerHp, playerHp + skillHeal)
    }
    if (skillDamage > 0 && r?.consumed!==false && !isFreeClassAction(skillId)) {
      ;({foeHp,playerHp}=infuseSingleHit(foeHp,playerHp,skillDamage))
    }
    setEnemyHp(foeHp)
    setCurrentHp(playerHp)
    if (typeof r?.enemyDamage === 'number' && r.enemyDamage > 0) showJudgeHit()
    return { foeHp, playerHp, consumed: r?.consumed !== false }
  }

  function castKeystone(skillId, foeHp, playerHp) {
    const effect = applyKeystone(skillId, combatPlayer, statusEffectsRef.current, {
      enemyHp: foeHp, maxEnemyHp: enemyData.hp,
      currentHp: playerHp, maxPlayerHp,
      playerATK: calcATK(player, equipped),
      playerDEF: calcDEF(player, equipped),
    })
    effect.messages?.forEach(pushLog)
    applyKeystoneStatuses(statusEffectsRef.current, effect.setStatus)
    // A Time Skip/Hurricane extra turn is already represented by not
    // consuming this action; don't leave a permanent inactive status icon.
    if (effect.consumesTurn === false) delete statusEffectsRef.current.cfx_extraTurn
    foeHp = Math.max(0, foeHp - Math.max(0, effect.enemyDamage || 0))
    playerHp = Math.min(maxPlayerHp, playerHp + Math.max(0, effect.healPlayer || 0))
    if (effect.enemyDamage > 0) showJudgeHit()
    setEnemyHp(foeHp)
    setCurrentHp(playerHp)
    if (effect.cooldown > 0) {
      setKeystoneCooldowns(prev => ({ ...prev, [skillId]: effect.cooldown }))
    }
    return { foeHp, playerHp, consumed: effect.consumesTurn !== false }
  }

  function castElementalAttack(skillId, foeHp, playerHp) {
    const effect = resolveElementalAttack(skillId, combatPlayer, statusEffectsRef.current, {
      atk: calcATK(player, equipped), def: calcDEF(player, equipped),
      enemyDef: enemyData.def || 0, currentHp: playerHp, maxHp: maxPlayerHp,
    })
    if (!effect || mpRef.current < effect.mpCost) return { foeHp, playerHp }
    changeCombatMp(mpRef.current - effect.mpCost)
    effect.messages.forEach(pushLog)
    applyKeystoneStatuses(statusEffectsRef.current, effect.setStatus)
    const skillLevel = getSkillLevel(player, skillId)
    foeHp = Math.max(0, foeHp - scaleSkillAmount(effect.enemyDamage, skillLevel))
    playerHp = Math.min(maxPlayerHp, playerHp + scaleSkillAmount(effect.healPlayer, skillLevel))
    if (effect.enemyDamage > 0) showJudgeHit()
    setEnemyHp(foeHp)
    setCurrentHp(playerHp)
    if (effect.cooldown > 0) setElementalCooldowns(prev => ({...prev, [skillId]: effect.cooldown}))
    return { foeHp, playerHp }
  }

  // One enemy action per round, with two player AP. Faster enemies act
  // before the first AP; slower enemies act after the last AP.
  function positionedEnemyTurn(playerHp, foeHp, defendAction, heroAt=heroPosition) {
    if (isBoss) return enemyTurn(playerHp,foeHp,defendAction)
    const next=chooseTacticalEnemyAction(enemyWeapon,enemyPosition,heroAt)
    if (next.move) {
      const stunned = consumeEnemyStun(statusEffectsRef.current)
      if (stunned) pushLog(stunned)
      else {
        setEnemyPosition(next.move)
        pushLog(`${enemyData.name} repositions to column ${next.move.col+1}, rank ${next.move.rank+1}.`)
      }
      return finishEnemyAction(playerHp,foeHp)
    }
    if (next.attack?.fallback) {
      pushLog(`${enemyData.name} cannot reach you and uses an emergency ranged pulse.`)
      return enemyTurn(playerHp,foeHp,defendAction,2,true)
    }
    return enemyTurn(playerHp,foeHp,defendAction)
  }

  function isFreeClassAction(skillId) {
    return ['stance_solar','stance_lunar','shift_beast','shift_coil','shift_storm'].includes(skillId) ||
      (skillId==='buffer' && !statusEffectsRef.current.cls_bufferStored)
  }

  async function takeTurn(action, skillId, moveTo=null) {
    if (busy || result || !entranceReady) return
    const attack=action==='attack' ? weaponAttacks.find(a=>a.id===skillId) : null
    if (action==='attack' && (!attack ||
      !isTacticalTargetValid(attack,heroPosition,enemyPosition))) return
    if (action==='move' && (!moveTo || moveTo.col<0||moveTo.col>2 ||
      moveTo.rank<0||moveTo.rank>2 ||
      Math.abs(heroPosition.col-moveTo.col)+Math.abs(heroPosition.rank-moveTo.rank)!==1)) return
    const freeClassAction=action==='skill' && isFreeClassAction(skillId)
    // Keystone utilities that explicitly specify consumesTurn=false in
    // elementalKeystones; leave them available even after spending 1 AP.
    const freeKeystone=action==='keystone' &&
      ['lightning_util_ks','arcane_util_ks','shadow_util_ks','wind_util_ks'].includes(skillId)
    const cost=freeClassAction||freeKeystone?0:
      action==='end'?actionPointsRef.current:
      action==='attack'?attack.ap:action==='move'?1:2
    if (cost > actionPointsRef.current) return
    if (action === 'skill' && (!ClsCombat.getActiveClassSkills(combatPlayer,statusEffectsRef.current)
      .some(skill=>skill.id===skillId && skill.available!==false) ||
      !canUseTacticalSkill(skillId,heroPosition,enemyPosition))) return
    if (action === 'signature' && !canCastFusionSignature(signature,{
      enabled:fusionEnabled,ap:actionPointsRef.current,mp:mpRef.current,
      cooldown:signatureCooldownRef.current,target:{hp:enemyHp}
    }))return
    if (action === 'keystone' && !getUnlockedKeystones(combatPlayer, keystoneCooldowns)
      .some(keystone => keystone.id === skillId && keystone.available)) return
    if (action === 'elemental' && (!canUseTacticalSkill(skillId,heroPosition,enemyPosition) ||
        !canUseElementalAttack(combatPlayer, skillId) ||
        (elementalCooldowns[skillId] || 0) > 0 ||
        mpRef.current < getAttackMpCost(combatPlayer, skillId, statusEffectsRef.current))) return
    setBusy(true)

    // Preserve special free actions, including stance toggles and keystones.
    if (action === 'keystone') {
      const preview=applyKeystone(skillId, combatPlayer, statusEffectsRef.current, {
        currentHp,maxPlayerHp,enemyHp,maxEnemyHp:enemyData.hp,
        playerATK:calcATK(player,equipped),playerDEF:calcDEF(player,equipped),
      })
      if (preview.consumesTurn === false) {
        castKeystone(skillId,enemyHp,currentHp)
        setBusy(false)
        return
      }
    }
    if (action === 'skill' && freeClassAction) {
      // Stances, Chimera shifts and the first Buffer action do not use AP,
      // trigger the enemy phase or advance cooldown clocks.
      playerSkill(skillId,enemyHp,currentHp)
      setBusy(false)
      return
    }

    let playerHp=currentHp
    let foeHp=enemyHp
    const enemySpeed=enemyData.speed??enemyData.spd??enemyData.agility??5
    const playerSpeed=calcSPD(player,equipped)+(statusEffectsRef.current.playerSPDBonus||0)
    const enemyFirst=enemySpeed>playerSpeed
    const defendAction=action==='defend'
    const firstAction=!roundStartedRef.current
    if (firstAction) {
      roundStartedRef.current=true
      legendaryTurnRef.current++
      if (legendary.has('legendary_engineer') && legendaryTurnRef.current%3===0) {
        playerHp=Math.min(maxPlayerHp,playerHp+5)
        setCurrentHp(playerHp)
        pushLog('✦ Mechanist Matrix repairs 5 HP.')
      }
      if (legendary.has('legendary_pathfinder') && legendaryTurnRef.current===1)
        pushLog('✦ Worldsight Compass reveals your opponent’s rhythm.')
      pushLog(enemyFirst ? `${enemyData.name} takes the initiative.` : 'You take the initiative.')
      if (enemyFirst) {
        setTurnActor('enemy')
        ;({playerHp,foeHp}=positionedEnemyTurn(playerHp,foeHp,defendAction))
        await pause(650)
        if (playerHp<=0 || foeHp<=0) {
          setTurnActor(null)
          await endCombat(playerHp<=0?'lose':'win',playerHp)
          setBusy(false)
          return
        }
      }
    }

    setTurnActor('player')
    setDefending(defendAction)
    if (action==='end') {
      pushLog('You end your turn.')
    } else if (action==='move') {
      setHeroPosition(moveTo)
      pushLog(`You move to column ${moveTo.col+1}, rank ${moveTo.rank+1}.`)
    } else if (action==='attack') {
      ;({foeHp,playerHp}=playerAttack(foeHp,playerHp,attack))
    } else if (action==='keystone') {
      ;({foeHp,playerHp}=castKeystone(skillId,foeHp,playerHp))
    } else if (action==='elemental') {
      ;({foeHp,playerHp}=castElementalAttack(skillId,foeHp,playerHp))
    } else if (action==='signature') {
      ;({foeHp,playerHp}=castSignature(foeHp,playerHp))
    } else if (action==='skill') {
      const skillResult=playerSkill(skillId,foeHp,playerHp)
      foeHp=skillResult.foeHp
      playerHp=skillResult.playerHp
    } else {
      pushLog('You brace yourself.')
      const stacks=applyStonebornDefend(combatPlayer,statusEffectsRef.current)
      if (stacks) pushLog(`Stoneborn hardens your guard (${stacks} stacks).`)
    }
    await pause(450)
    const remaining=Math.max(0,actionPointsRef.current-cost)
    actionPointsRef.current=remaining
    setActionPoints(remaining)
    if (playerHp<=0 || foeHp<=0) {
      setTurnActor(null)
      await endCombat(playerHp<=0?'lose':'win',playerHp)
      setBusy(false)
      return
    }
    if (remaining>0) {
      setTurnActor(null)
      setDefending(false)
      setBusy(false)
      return
    }

    if (!enemyFirst) {
      setTurnActor('enemy')
      ;({playerHp,foeHp}=positionedEnemyTurn(playerHp,foeHp,defendAction,
        action==='move'?moveTo:heroPosition))
      await pause(650)
    }
    setTurnActor(null)
    setDefending(false)
    setKeystoneCooldowns(prev=>advanceKeystoneCooldowns(prev,action==='keystone'?skillId:null))
    setElementalCooldowns(prev=>advanceKeystoneCooldowns(prev,action==='elemental'?skillId:null))
    signatureCooldownRef.current=Math.max(0,signatureCooldownRef.current-1)
    setSignatureCooldown(signatureCooldownRef.current)
    if (playerHp>0 && mpRef.current<maxCombatMp)
      changeCombatMp(recoverCombatMp(mpRef.current,mpRegen,maxCombatMp))
    if (statusEffectsRef.current.cfx_ironDomainTurns>0 &&
        !(action==='elemental' && skillId==='metal_ultimate_iron_domain'))
      statusEffectsRef.current.cfx_ironDomainTurns--
    roundStartedRef.current=false
    actionPointsRef.current=2
    setActionPoints(2)
    if (playerHp<=0) await endCombat('lose',playerHp)
    else if (foeHp<=0) await endCombat('win',playerHp)
    setBusy(false)
  }

  const activeSkills = ClsCombat.getActiveClassSkills(combatPlayer, statusEffectsRef.current) || []
  const keystones = getUnlockedKeystones(combatPlayer, keystoneCooldowns)
  const elementalAttack = getEquippedElementalAttack(combatPlayer)
  const statusChips = Object.entries(statusEffectsRef.current)
    .filter(([k, v]) => !k.startsWith('_') && (v === true || (typeof v === 'number' && v > 0)))

  return (
    <div className="combat-screen">
      <div className="combat-encounter-title">{isBoss ? '☠ BOSS ENCOUNTER ☠' : '⚔ ENCOUNTER ⚔'}</div>
      <div className="combat-turn-banner" aria-live="polite">{!entranceReady ? `${enemyData.name} enters the arena…` : turnActor === 'enemy' ? `${enemyData.name} acts` : turnActor === 'player' ? 'Your turn' : 'Choose your move'}</div>
      <div className="combat-panel">
        <div className="combat-side">
          {enemyData.name === 'The Echo Beast' ? <EchoBeastPortrait attacking={turnActor === 'enemy'} /> : enemyData.name === 'The Twin Judges' ? <TwinJudgesPortrait moral={judgeCtx?.playerMoral ?? 0} elements={judgeCtx?.elementsAttempted ?? 1} hpPercent={enemyHp / enemyData.hp} attacking={turnActor === 'enemy'} hit={judgeHit} defeated={result === 'win'} /> : ['Sentinel of the First Eye','The Surveyor','The Unseen'].includes(enemyData.name) ? <ChapterOneBossPortrait name={enemyData.name} attacking={turnActor === 'enemy'} hit={judgeHit} defeated={result === 'win'} moveKey={enemyMoveKey} phase={guardianPhase} /> : enemyData.name === 'The Watcher' ? <WatcherPortrait attacking={turnActor === 'enemy'} hit={judgeHit} defeated={result === 'win'} /> : <span className="combat-icon">{enemyData.icon || '👹'}</span>}
          <span className="combat-name">{enemyData.name}</span>
          <HpBar hp={enemyHp} maxHp={enemyData.hp} />
          <span className="combat-hp-num">{enemyHp}/{enemyData.hp}</span>
        </div>
        <div className="combat-side">
          <span className="combat-icon">🧑</span>
          <span className="combat-name">You</span>
          <HpBar hp={currentHp} maxHp={maxPlayerHp} />
          <span className="combat-hp-num">{currentHp}/{maxPlayerHp} HP</span>
          <div className="combat-mp-label">MP · {currentMp}/{maxCombatMp}</div>
          <div className="combat-mp-bar" role="progressbar" aria-label="Combat MP" aria-valuemin={0}
            aria-valuemax={maxCombatMp} aria-valuenow={currentMp}>
            <div className="combat-mp-fill" style={{ width: (currentMp / maxCombatMp * 100) + '%' }} />
          </div>
          {statusChips.length > 0 && (
            <div className="combat-status-list">
              {statusChips.map(([k]) => <span key={k} className="combat-status-chip">{k}</span>)}
            </div>
          )}
        </div>
      </div>

      {!result && <>
        <div className="combat-tactical-status">
          <strong>{actionPoints}/2 AP</strong>
          <span>{weaponType.toUpperCase()} · Mastery Lv {weaponMasteryLevel((player.weapon_mastery||{})[weaponType]||0)}
            {' · '}{(player.weapon_mastery||{})[weaponType]||0} XP
            {nextWeaponMasteryThreshold((player.weapon_mastery||{})[weaponType]||0)!==null &&
              ' / '+nextWeaponMasteryThreshold((player.weapon_mastery||{})[weaponType]||0)}
          </span>
        </div>
        {activeFusion && <div className="combat-fusion-status">
          <span>✦ {activeFusion.classKey} + {activeFusion.element}
            {' · '}Fusion Lv {activeFusion.level}
            {getFusionSignature(activeFusion) && ' · '+getFusionSignature(activeFusion)}
            {' · '}{FUSION_MP_COST} MP per infused hit
          </span>
          <button type="button" className="combat-action-btn"
            disabled={busy || !entranceReady}
            aria-pressed={fusionEnabled}
            onClick={()=>setFusionEnabled(enabled=>!enabled)}>
            {fusionEnabled?'Disable Fusion':'Enable Fusion'}
          </button>
        </div>}
        {signatureFx&&<div key={signatureFx.id}
          className={'combat-signature-burst signature-'+signatureFx.kind}
          role="status">{signature?.label}</div>}
        <TacticalBattlefield hero={heroPosition} enemy={enemyPosition} enemyName={enemyData.name}
          enemyIcon={enemyData.icon} enemyHp={enemyHp}
          attack={signaturePreview&&signature?.target==='enemy'?signature.attack:selectedAttack}
          signatureFx={signatureFx}
          signaturePreview={signaturePreview&&signature?{
            side:signature.target==='self'?'hero':'enemy',
            squares:getTacticalAffectedSquares(signature.attack,
              signature.target==='self'?heroPosition:enemyPosition)
          }:null}
          canAttack={!busy&&entranceReady&&actionPoints>=selectedAttack.ap}
          canMove={!busy&&entranceReady&&actionPoints>=1}
          onMove={position=>takeTurn('move',null,position)}
          onAttack={()=>takeTurn('attack',selectedAttack.id)} />
        <div className="combat-tactical-weapons">
          {weaponAttacks.map(attack=><button key={attack.id} type="button"
            className={'combat-action-btn'+(selectedAttack.id===attack.id?' selected':'')}
            aria-pressed={selectedAttack.id===attack.id}
            disabled={busy || !entranceReady || actionPoints<attack.ap}
            onClick={()=>setSelectedAttackId(attack.id)}>
            {attack.label}{attack.fallback?' · Emergency':''}
            <span className="combat-action-sub">{attack.reach} · {attack.shape} · {attack.ap} AP</span>
          </button>)}
        </div>
        <div className="combat-actions">
          <button className="combat-action-btn" disabled={busy || !entranceReady || actionPoints<2} onClick={() => takeTurn('defend')}>Defend · 2 AP</button>
          <button type="button" className="combat-action-btn" disabled={busy || !entranceReady}
            onClick={() => takeTurn('end')}>End turn</button>
          {activeSkills.map(skill => (
            <button key={skill.id} className="combat-action-btn" disabled={busy || !entranceReady ||
              (actionPoints<2 && !isFreeClassAction(skill.id)) ||
              skill.available===false ||
              !canUseTacticalSkill(skill.id,heroPosition,enemyPosition)} onClick={() => takeTurn('skill', skill.id)}>
              {skill.label} · Lv {getSkillLevel(player, skill.id)}
              {skill.sub && <span className="combat-action-sub">{skill.sub}</span>}
              {getTacticalSkillRule(skill.id) && <span className="combat-action-sub">
                {getTacticalSkillRule(skill.id).label}
                {!canUseTacticalSkill(skill.id,heroPosition,enemyPosition) && ' · MOVE TO REACH'}
              </span>}
            </button>
          ))}
          {elementalAttack && <button type="button" className="combat-action-btn"
            disabled={busy || !entranceReady || actionPoints<2 || (elementalCooldowns[elementalAttack.id] || 0) > 0 ||
              currentMp < getAttackMpCost(combatPlayer, elementalAttack.id, statusEffectsRef.current) ||
              !canUseTacticalSkill(elementalAttack.id,heroPosition,enemyPosition)}
            onClick={() => takeTurn('elemental', elementalAttack.id)}>
            {elementalAttack.label} · Lv {getSkillLevel(player, elementalAttack.id)}
            <span className="combat-action-sub">
              {(elementalCooldowns[elementalAttack.id] || 0) > 0
                ? `Cooldown: ${elementalCooldowns[elementalAttack.id]} rounds`
                : `${getAttackMpCost(combatPlayer, elementalAttack.id, statusEffectsRef.current)} MP · ${elementalAttack.element}`}
              {' · '}{getTacticalSkillRule(elementalAttack.id)?.label}
              {!canUseTacticalSkill(elementalAttack.id,heroPosition,enemyPosition) && ' · MOVE TO REACH'}
            </span>
          </button>}
          {signature&&<button type="button" className="combat-action-btn combat-signature-action"
            disabled={busy || !entranceReady || !canCastFusionSignature(signature,{
              enabled:fusionEnabled,ap:actionPoints,mp:currentMp,
              cooldown:signatureCooldown,target:{hp:enemyHp}
            })}
            onClick={()=>takeTurn('signature')}>
            ✦ {signature.label} · {signature.ap} AP · {signature.mp} MP
            <span className="combat-action-sub">
              {signatureCooldown>0?'Cooldown: '+signatureCooldown+' rounds':
                fusionEnabled?'Signature '+signature.attack.shape:'Fusion inactive'}
            </span>
          </button>}
          {signature&&<button type="button" className="combat-action-btn combat-preview-btn"
            disabled={busy || !entranceReady}
            onClick={()=>setSignaturePreview(value=>!value)}>
            {signaturePreview?'Hide':'Preview'} ✦ {signature.label}
          </button>}
          {keystones.map(keystone => (
            <button key={keystone.id} type="button" className="combat-action-btn"
              title={keystone.desc}
              disabled={busy || !entranceReady || !keystone.available ||
                (actionPoints<2 && !['lightning_util_ks','arcane_util_ks','shadow_util_ks','wind_util_ks'].includes(keystone.id))}
              onClick={() => takeTurn('keystone', keystone.id)}>
              {keystone.label}
              <span className="combat-action-sub">
                {keystone.available ? '✦ Elemental keystone' : `Cooldown: ${keystone.cooldown} rounds`}
              </span>
            </button>
          ))}
          {onEscape && (
            <button className="combat-action-btn" disabled={busy || !entranceReady} onClick={() => endCombat('escape')}>Flee</button>
          )}
        </div>
      </>}

      {result === 'win' && <p className="combat-result win">✦ Victory ✦</p>}
      {result && combatSaving && <p className="combat-save-status" role="status">Saving combat progress…</p>}
      {result && combatSaveError && (
        <div className="combat-save-error" role="alert">
          <p>{combatSaveError} Your combat outcome is retained here until the save succeeds.</p>
          <button type="button" className="combat-action-btn" disabled={combatSaving}
            onClick={saveCombatOutcome}>Retry saving progress</button>
        </div>
      )}
      {result === 'lose' && <p className="combat-result lose">✦ Defeated ✦</p>}
      {result === 'escape' && <p className="combat-result">✦ Escaped ✦</p>}

      <div className="combat-log">
        {log.map((l, i) => <p key={i}><CombatMessage message={l} /></p>)}
      </div>
    </div>
  )
}
