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
import { getUnlockedKeystones, applyKeystone } from '../../game/elementalKeystones'
import { advanceKeystoneCooldowns, applyKeystoneStatuses, consumeEnemyStun, resolveKeystoneDefense, resolveKeystoneStrike, resolveKeystoneRegen } from '../../game/keystoneCombat'
import { equipmentSubtype, RANGED_WEAPONS } from '../../game/equipmentSlots'
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

  const maxPlayerHp = calcMaxHp(player, equipped)
  const [currentHp, setCurrentHp] = useState(player.hp ?? maxPlayerHp)
  const [enemyHp, setEnemyHp] = useState(enemyData.hp)
  const [defending, setDefending] = useState(false)
  const [result, setResult] = useState(null)
  const [log, setLog] = useState([`A ${enemyData.name} appears.`])
  const [busy, setBusy] = useState(false)
  const [keystoneCooldowns, setKeystoneCooldowns] = useState({})
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

  async function endCombat(outcome, hpAtEnd = currentHp) {
    setResult(outcome)
    const end = ClsCombat.onCombatEnd(combatPlayer, statusEffectsRef.current, outcome === 'win' ? 'victory' : 'defeat')
    if (end?.dbUpdates) Object.assign(dbUpdatesRef.current, end.dbUpdates)
    const finalUpdates = { ...dbUpdatesRef.current, hp: outcome === 'win' ? hpAtEnd : Math.max(1, hpAtEnd) }
    if (outcome === 'win') {
      const rewards = grantXp({ ...player, hp: finalUpdates.hp, ...finalUpdates }, enemyData.xp || 0)
      Object.assign(finalUpdates, rewards)
      pushLog(`Victory! +${enemyData.xp || 0} XP${rewards.level > (player.level || 1) ? ` · Level ${rewards.level}!` : ''}`)
    }
    await updatePlayer(finalUpdates)
    if (outcome === 'win' && enemyData.loot?.length) {
      try {
        const drops = await grantLoot(player.id, enemyData.loot, effective.core.luck)
        await loadInventory(player.id)
        if (drops.length) pushLog('Loot: '+drops.map(d => `${d.icon || '📦'} ${d.name} ×${d.qty}`).join(' · '))
      } catch (error) {
        pushLog('Loot could not be saved: '+error.message)
      }
    }
    // Let victory animations finish before leaving the arena. The Watcher's
    // eight eye fragments stagger their dispersal for almost two seconds.
    const victoryDelay = outcome === 'win'
      ? enemyData.name === 'The Watcher' ? 2000
        : ['Sentinel of the First Eye', 'The Surveyor', 'The Unseen'].includes(enemyData.name) ? 1500
        : enemyData.name === 'The Twin Judges' ? 1200
        : 900
      : 900
    if (!combatMountedRef.current) return
    clearTimeout(completionTimerRef.current)
    completionTimerRef.current = setTimeout(() => {
      if (!combatMountedRef.current) return
      if (outcome === 'win') onWin?.()
      else if (outcome === 'escape') onEscape?.()
      else onLose?.()
    }, victoryDelay)
  }

  function enemyTurn(playerHp, foeHp, isDefending = false) {
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
    const aiMove = stunned ? null : resolveEnemyTurn(combatEnemyRef.current, ctx)
    if (!stunned && (statusEffectsRef.current.cfx_longDecayStacks || 0) > 0) {
      aiDmg = Math.max(0, aiDmg - 3 * statusEffectsRef.current.cfx_longDecayStacks)
    }
    // AI keeps full ownership of move selection and damage. The move key
    // only tells the Chapter 1 portrait which attack to animate.
    if (CH1_BOSS_ENTRANCE_MS[enemyData.name] > 0) {
      setEnemyMoveKey(aiMove?.moveKey ?? null)
      // Use the AI's actual phase gates rather than guessing from HP.
      setGuardianPhase(enemyStateRef.current.phase)
    }

    foeHp = Math.min(enemyData.hp, foeHp + healAmt)

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

    // Real return shape is {messages, damageToEnemy, healToPlayer} — DoT and
    // regen status effects tick here, not via a dbUpdates field.
    const turnEnd = ClsCombat.onTurnEnd(combatPlayer, statusEffectsRef.current)
    if (turnEnd?.messages?.length) turnEnd.messages.forEach(pushLog)
    if (turnEnd?.damageToEnemy > 0) foeHp = Math.max(0, foeHp - turnEnd.damageToEnemy)
    if (turnEnd?.healToPlayer > 0 && nextHp > 0) nextHp = Math.min(maxPlayerHp, nextHp + turnEnd.healToPlayer)
    const keystoneTick = resolveKeystoneRegen(statusEffectsRef.current, foeHp, nextHp, maxPlayerHp)
    foeHp = keystoneTick.enemyHp
    nextHp = keystoneTick.playerHp
    keystoneTick.messages.forEach(pushLog)

    setEnemyHp(foeHp)
    setCurrentHp(nextHp)
    setDefending(false)
    return { playerHp: nextHp, foeHp }
  }

  function playerAttack(foeHp, playerHp) {
    const base = Math.max(1, calcATK(player, equipped) - (enemyData.def || 0) + Math.floor(Math.random() * 4))
    const atkResult = ClsCombat.onPlayerAttack(combatPlayer, statusEffectsRef.current, enemyData, base)
    const critChance = Math.min(.5,Math.max(0,effective.core.luck)*.01 + critChanceBonus(combatPlayer) + (atkResult?.critChanceAdd || 0))
    const wasCrit = atkResult?.wasCrit || Math.random() < critChance
    let dmg = Math.max(0, Math.round(base * (atkResult?.dmgMult ?? 1) * (wasCrit ? 1.5 + critDamageBonus(combatPlayer) : 1)))
    if (legendary.has('legendary_forger') && wasCrit) dmg += 12
    if (legendary.has('legendary_hunter') && foeHp === enemyData.hp) dmg += 15
    if (legendary.has('legendary_resonance_weaver')) dmg += 4
    const keystoneHit = resolveKeystoneStrike(statusEffectsRef.current, dmg)
    dmg = keystoneHit.damage
    playerHp = Math.min(maxPlayerHp, playerHp + keystoneHit.heal)
    if (keystoneHit.heal > 0) setCurrentHp(playerHp)
    const newEnemyHp = Math.max(0, foeHp - dmg)
    setEnemyHp(newEnemyHp)
    if (dmg > 0) showJudgeHit()

    const weapon = equipped.find(i=>i.equipped_slot==='mainhand')
    const ranged = weapon && RANGED_WEAPONS.includes(equipmentSubtype(weapon))
    const verb = ranged ? 'You shoot' : 'You strike'
    const msgs = [`${verb} for ${dmg}.${wasCrit ? ' ✦ Critical hit!' : ''}`, ...(atkResult?.messages || []), ...keystoneHit.messages]
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
    if (typeof r?.enemyDamage === 'number' && r.enemyDamage > 0) foeHp = Math.max(0, foeHp - r.enemyDamage)
    if (typeof r?.selfHeal === 'number' && r.selfHeal > 0) {
      playerHp = Math.min(maxPlayerHp, playerHp + r.selfHeal)
      setCurrentHp(playerHp)
    }
    setEnemyHp(foeHp)
    if (typeof r?.enemyDamage === 'number' && r.enemyDamage > 0) showJudgeHit()
    return { foeHp, playerHp, consumed: r?.consumed !== false }
  }

  async function takeTurn(action, skillId) {
    if (busy || result || !entranceReady) return
    setBusy(true)
    // Stance switches are explicitly free actions in classCombat.
    // They should neither consume a round nor trigger enemy initiative.
    if (action === 'skill' && (skillId === 'stance_solar' || skillId === 'stance_lunar')) {
      playerSkill(skillId, enemyHp, currentHp)
      setBusy(false)
      return
    }
    let playerHp = currentHp
    let foeHp = enemyHp
    legendaryTurnRef.current += 1
    if (legendary.has('legendary_engineer') && legendaryTurnRef.current % 3 === 0) {playerHp = Math.min(maxPlayerHp,playerHp+5);setCurrentHp(playerHp);pushLog('✦ Mechanist Matrix repairs 5 HP.')}
    if (legendary.has('legendary_pathfinder') && legendaryTurnRef.current === 1) pushLog('✦ Worldsight Compass reveals your opponent’s rhythm.')
    const playerSpeed = calcSPD(player,equipped) + (statusEffectsRef.current.playerSPDBonus || 0)
    const enemySpeed = enemyData.speed ?? enemyData.spd ?? enemyData.agility ?? 5
    const enemyFirst = enemySpeed > playerSpeed
    const defendAction = action === 'defend'
    setDefending(defendAction)
    pushLog(enemyFirst ? `${enemyData.name} takes the initiative.` : 'You take the initiative.')

    const act = async (side) => {
      setTurnActor(side)
      if (side === 'enemy') {
        ;({ playerHp, foeHp } = enemyTurn(playerHp, foeHp, defendAction))
      } else if (action === 'attack') {
        foeHp = playerAttack(foeHp)
      } else if (action === 'skill') {
        const skillResult = playerSkill(skillId, foeHp, playerHp)
        foeHp = skillResult.foeHp
        playerHp = skillResult.playerHp
      } else {
        pushLog('You brace yourself.')
      }
      await pause(650)
    }

    // Each actor finishes before the next begins. A lethal blow ends the
    // round immediately, so a defeated combatant cannot retaliate.
    for (const side of (enemyFirst ? ['enemy', 'player'] : ['player', 'enemy'])) {
      await act(side)
      if (playerHp <= 0 || foeHp <= 0) break
    }
    setTurnActor(null)
    setDefending(false)
    if (playerHp <= 0) await endCombat('lose', playerHp)
    else if (foeHp <= 0) await endCombat('win', playerHp)
    setBusy(false)
  }

  const activeSkills = ClsCombat.getActiveClassSkills(combatPlayer, statusEffectsRef.current) || []
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
          <span className="combat-hp-num">{currentHp}/{maxPlayerHp}</span>
          {statusChips.length > 0 && (
            <div className="combat-status-list">
              {statusChips.map(([k]) => <span key={k} className="combat-status-chip">{k}</span>)}
            </div>
          )}
        </div>
      </div>

      {!result && (
        <div className="combat-actions">
          <button className="combat-action-btn" disabled={busy || !entranceReady} onClick={() => takeTurn('attack')}>Attack</button>
          <button className="combat-action-btn" disabled={busy || !entranceReady} onClick={() => takeTurn('defend')}>Defend</button>
          {activeSkills.map(skill => (
            <button key={skill.id} className="combat-action-btn" disabled={busy || !entranceReady} onClick={() => takeTurn('skill', skill.id)}>
              {skill.label}
              {skill.sub && <span className="combat-action-sub">{skill.sub}</span>}
            </button>
          ))}
          {onEscape && (
            <button className="combat-action-btn" disabled={busy || !entranceReady} onClick={() => endCombat('escape')}>Flee</button>
          )}
        </div>
      )}

      {result === 'win' && <p className="combat-result win">✦ Victory ✦</p>}
      {result === 'lose' && <p className="combat-result lose">✦ Defeated ✦</p>}
      {result === 'escape' && <p className="combat-result">✦ Escaped ✦</p>}

      <div className="combat-log">
        {log.map((l, i) => <p key={i}><CombatMessage message={l} /></p>)}
      </div>
    </div>
  )
}
