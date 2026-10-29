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
import { calcATK, calcDEF, calcMaxHp } from '../../game/playerStats'
import { grantXp } from '../../game/progression'
import { grantLoot } from '../../game/loot'
import './CombatScreen.css'

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

  const maxPlayerHp = calcMaxHp(player, equipped)
  const [currentHp, setCurrentHp] = useState(player.hp ?? maxPlayerHp)
  const [enemyHp, setEnemyHp] = useState(enemyData.hp)
  const [defending, setDefending] = useState(false)
  const [result, setResult] = useState(null)
  const [log, setLog] = useState([`A ${enemyData.name} appears.`])
  const [busy, setBusy] = useState(false)
  const [turnActor, setTurnActor] = useState(null)

  const statusEffectsRef = useRef({})
  const enemyStateRef = useRef(initEnemyState(enemyData))
  const dbUpdatesRef = useRef({})

  useEffect(() => {
    const r = ClsCombat.onCombatStart(player, statusEffectsRef.current)
    if (r?.messages?.length) pushLog(r.messages[0])
    if (r?.dbUpdates) Object.assign(dbUpdatesRef.current, r.dbUpdates)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pushLog(line) { setLog(l => [line, ...l].slice(0, 30)) }

  async function endCombat(outcome, hpAtEnd = currentHp) {
    setResult(outcome)
    const end = ClsCombat.onCombatEnd(player, statusEffectsRef.current, outcome === 'win' ? 'victory' : 'defeat')
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
        const drops = await grantLoot(player.id, enemyData.loot)
        await loadInventory(player.id)
        if (drops.length) pushLog('Loot: '+drops.map(d => `${d.icon || '📦'} ${d.name} ×${d.qty}`).join(' · '))
      } catch (error) {
        pushLog('Loot could not be saved: '+error.message)
      }
    }
    setTimeout(() => {
      if (outcome === 'win') onWin?.()
      else if (outcome === 'escape') onEscape?.()
      else onLose?.()
    }, 900)
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
    resolveEnemyTurn(enemyData, ctx)

    foeHp = Math.min(enemyData.hp, foeHp + healAmt)

    // Route the AI's intended damage through onPlayerHit so defensive class
    // skills (shields, counters, thorns) get a chance to react, same as
    // the vanilla engines did. Real return shape is {dmgMult, reflectAmount,
    // messages} — not a flat "final damage" field, so apply the multiplier
    // ourselves.
    const hitResult = ClsCombat.onPlayerHit(player, statusEffectsRef.current, enemyData, aiDmg, maxPlayerHp)
    const finalDmg = Math.max(0, Math.round(aiDmg * (hitResult?.dmgMult ?? 1)))
    if (hitResult?.messages?.length) messages.push(...hitResult.messages)

    let nextHp = Math.max(0, playerHp - finalDmg)
    setCurrentHp(nextHp)

    // reflectAmount — damage bounced back onto the enemy (thorns-style effects)
    if (hitResult?.reflectAmount > 0) {
      foeHp = Math.max(0, foeHp - hitResult.reflectAmount)
      messages.push(`${hitResult.reflectAmount} damage reflected back.`)
    }
    messages.forEach(pushLog)

    // Real return shape is {messages, damageToEnemy, healToPlayer} — DoT and
    // regen status effects tick here, not via a dbUpdates field.
    const turnEnd = ClsCombat.onTurnEnd(player, statusEffectsRef.current)
    if (turnEnd?.messages?.length) turnEnd.messages.forEach(pushLog)
    if (turnEnd?.damageToEnemy > 0) foeHp = Math.max(0, foeHp - turnEnd.damageToEnemy)
    if (turnEnd?.healToPlayer > 0 && nextHp > 0) nextHp = Math.min(maxPlayerHp, nextHp + turnEnd.healToPlayer)

    setEnemyHp(foeHp)
    setCurrentHp(nextHp)
    setDefending(false)
    return { playerHp: nextHp, foeHp }
  }

  function playerAttack(foeHp) {
    const base = Math.max(1, calcATK(player, equipped) - (enemyData.def || 0) + Math.floor(Math.random() * 4))
    const atkResult = ClsCombat.onPlayerAttack(player, statusEffectsRef.current, enemyData, base)
    const dmg = Math.max(0, Math.round(base * (atkResult?.dmgMult ?? 1)))
    const newEnemyHp = Math.max(0, foeHp - dmg)
    setEnemyHp(newEnemyHp)

    const msgs = [`You strike for ${dmg}.`, ...(atkResult?.messages || [])]
    if (atkResult?.dbUpdates) Object.assign(dbUpdatesRef.current, atkResult.dbUpdates)

    const postResult = ClsCombat.onPlayerAttackPost(player, statusEffectsRef.current, enemyData, dmg, atkResult?.wasCrit)
    if (postResult?.messages?.length) msgs.push(...postResult.messages)
    if (postResult?.dbUpdates) Object.assign(dbUpdatesRef.current, postResult.dbUpdates)

    const hpChange = ClsCombat.onEnemyHpChange(player, statusEffectsRef.current, enemyData, foeHp, newEnemyHp, enemyData.hp)
    if (hpChange?.messages?.length) msgs.push(...hpChange.messages)

    msgs.forEach(pushLog)

    if (newEnemyHp <= 0) {
      const killResult = ClsCombat.onKill(player, statusEffectsRef.current, enemyData)
      if (killResult?.messages?.length) killResult.messages.forEach(pushLog)
      if (killResult?.dbUpdates) Object.assign(dbUpdatesRef.current, killResult.dbUpdates)
      return newEnemyHp
    }
    return newEnemyHp
  }

  function playerSkill(skillId, foeHp, playerHp) {
    const r = ClsCombat.onActiveSkill(skillId, player, statusEffectsRef.current, enemyData)
    if (r?.messages?.length) r.messages.forEach(pushLog)
    if (r?.dbUpdates) Object.assign(dbUpdatesRef.current, r.dbUpdates)
    if (typeof r?.enemyDamage === 'number' && r.enemyDamage > 0) foeHp = Math.max(0, foeHp - r.enemyDamage)
    if (typeof r?.selfHeal === 'number' && r.selfHeal > 0) {
      playerHp = Math.min(maxPlayerHp, playerHp + r.selfHeal)
      setCurrentHp(playerHp)
    }
    setEnemyHp(foeHp)
    return { foeHp, playerHp, consumed: r?.consumed !== false }
  }

  async function takeTurn(action, skillId) {
    if (busy || result) return
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
    const playerSpeed = (player.speed ?? player.spd ?? 5) + (statusEffectsRef.current.playerSPDBonus || 0)
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

  const activeSkills = ClsCombat.getActiveClassSkills(player, statusEffectsRef.current) || []
  const statusChips = Object.entries(statusEffectsRef.current)
    .filter(([k, v]) => !k.startsWith('_') && (v === true || (typeof v === 'number' && v > 0)))

  return (
    <div className="combat-screen">
      <div className="combat-encounter-title">{isBoss ? '☠ BOSS ENCOUNTER ☠' : '⚔ ENCOUNTER ⚔'}</div>
      <div className="combat-turn-banner" aria-live="polite">{turnActor === 'enemy' ? `${enemyData.name} acts` : turnActor === 'player' ? 'Your turn' : 'Choose your move'}</div>
      <div className="combat-panel">
        <div className="combat-side">
          <span className="combat-icon">{enemyData.icon || '👹'}</span>
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
          <button className="combat-action-btn" disabled={busy} onClick={() => takeTurn('attack')}>Attack</button>
          <button className="combat-action-btn" disabled={busy} onClick={() => takeTurn('defend')}>Defend</button>
          {activeSkills.map(skill => (
            <button key={skill.id} className="combat-action-btn" disabled={busy} onClick={() => takeTurn('skill', skill.id)}>
              {skill.label}
              {skill.sub && <span className="combat-action-sub">{skill.sub}</span>}
            </button>
          ))}
          {onEscape && (
            <button className="combat-action-btn" disabled={busy} onClick={() => endCombat('escape')}>Flee</button>
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
