import { useState, useEffect } from 'react'
import Formation from '../components/combat/Formation'
import TurnQueue from '../components/combat/TurnQueue'
import {
  createFormation, canUseSkill, computeTurnOrder, shiftRank,
} from '../game/formation'
import './CombatDemoPage.css'

// Proves the whole DD-style loop end to end: rank-gated skill availability,
// rank-gated targeting, drag-to-reposition, a real turn queue, and a
// position-shift skill. Mock combatants — same shape real ones will use
// once this plugs into class_combat.js for actual damage math.
const HERO = {
  id: 'hero', name: 'You', icon: '🧑', hp: 60, maxHp: 60, spd: 6,
  skills: [
    { id: 'strike', label: 'Strike', sub: 'Rank 1-2 only, hits rank 1-2', usableFromRanks: [1, 2], targetRanks: [1, 2], dmg: 12 },
    { id: 'shove',  label: 'Shove',  sub: 'Rank 1 only, pushes target back 1', usableFromRanks: [1], targetRanks: [1, 2], dmg: 4, shove: 1 },
    { id: 'snipe',  label: 'Snipe',  sub: 'Any rank, only hits rank 3-4', targetRanks: [3, 4], dmg: 9 },
  ],
}
const ENEMIES = [
  { id: 'e1', name: 'Looter', icon: '👹', hp: 24, maxHp: 24, spd: 4 },
  { id: 'e2', name: 'Hunter Scout', icon: '🏹', hp: 30, maxHp: 30, spd: 5 },
  { id: 'e3', name: 'Marksman', icon: '🎯', hp: 20, maxHp: 20, spd: 3 },
]

export default function CombatDemoPage() {
  const [playerFormation, setPlayerFormation] = useState(() => createFormation([HERO]))
  const [enemyFormation, setEnemyFormation] = useState(() => createFormation(ENEMIES))
  const [turnOrder, setTurnOrder] = useState([])
  const [turnIndex, setTurnIndex] = useState(0)
  const [activeSkill, setActiveSkill] = useState(null)
  const [log, setLog] = useState(['Round 1 begins.'])

  useEffect(() => {
    setTurnOrder(computeTurnOrder(playerFormation, enemyFormation))
    setTurnIndex(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pushLog(line) { setLog(l => [line, ...l].slice(0, 20)) }

  const current = turnOrder[turnIndex]
  const isPlayerTurn = current?.side === 'player'

  function findRank(formation, id) {
    const idx = formation.findIndex(c => c?.id === id)
    return idx === -1 ? null : idx + 1
  }

  function advanceTurn() {
    setActiveSkill(null)
    const next = turnIndex + 1
    if (next >= turnOrder.length) {
      pushLog('— Round ends —')
      const newOrder = computeTurnOrder(playerFormation, enemyFormation)
      setTurnOrder(newOrder)
      setTurnIndex(0)
    } else {
      setTurnIndex(next)
    }
  }

  function handleTargetEnemy(rank) {
    if (!activeSkill || !current) return
    const target = enemyFormation[rank - 1]
    if (!target) return

    if (activeSkill.dmg) {
      const newHp = Math.max(0, target.hp - activeSkill.dmg)
      const nextFormation = [...enemyFormation]
      nextFormation[rank - 1] = { ...target, hp: newHp }
      setEnemyFormation(nextFormation)
      pushLog(`${current.combatant.name} uses ${activeSkill.label} on ${target.name} for ${activeSkill.dmg}.`)

      if (activeSkill.shove) {
        setTimeout(() => {
          setEnemyFormation(f => shiftRank(f, rank, activeSkill.shove))
          pushLog(`${target.name} is shoved back!`)
        }, 300)
      }
    }
    advanceTurn()
  }

  function handleUseSkillOnAlly(skill) {
    // Mend just heals the lowest-HP ally for this demo.
    const lowest = playerFormation
      .filter(Boolean)
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]
    if (!lowest) return
    const rank = findRank(playerFormation, lowest.id)
    const nextFormation = [...playerFormation]
    nextFormation[rank - 1] = { ...lowest, hp: Math.min(lowest.maxHp, lowest.hp + skill.heal) }
    setPlayerFormation(nextFormation)
    pushLog(`${current.combatant.name} uses ${skill.label} on ${lowest.name} for ${skill.heal} HP.`)
    advanceTurn()
  }

  function handleReorderPlayer(fromRank, toRank) {
    setPlayerFormation(f => shiftRank(f, fromRank, toRank - fromRank))
    pushLog(`Repositioned — rank ${fromRank} → ${toRank}.`)
  }

  // Simple enemy AI: random legal skill-less attack on a random front-ish player.
  useEffect(() => {
    if (current && current.side === 'enemy') {
      const t = setTimeout(() => {
        const targets = playerFormation.filter(Boolean)
        const target = targets[Math.floor(Math.random() * targets.length)]
        const rank = findRank(playerFormation, target.id)
        const dmg = 6
        const nextFormation = [...playerFormation]
        nextFormation[rank - 1] = { ...target, hp: Math.max(0, target.hp - dmg) }
        setPlayerFormation(nextFormation)
        pushLog(`${current.combatant.name} attacks ${target.name} for ${dmg}.`)
        advanceTurn()
      }, 700)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnIndex])

  const userRank = current ? findRank(current.side === 'player' ? playerFormation : enemyFormation, current.combatant.id) : null

  return (
    <div className="combat-demo">
      <p className="combat-demo-note">Training simulation · Not part of the story. Party members join only when you meet and recruit them.</p>
      <TurnQueue order={turnOrder} activeIndex={turnIndex} />
      <Formation
        playerFormation={playerFormation}
        enemyFormation={enemyFormation}
        activeSkill={activeSkill}
        onReorderPlayer={handleReorderPlayer}
        onTargetEnemy={handleTargetEnemy}
      />

      {isPlayerTurn && (
        <div className="combat-demo-skills">
          {current.combatant.skills.map(skill => {
            const usable = canUseSkill(skill, userRank)
            return (
              <button
                key={skill.id}
                className={`combat-demo-skill-btn ${activeSkill?.id === skill.id ? 'selected' : ''}`}
                disabled={!usable}
                onClick={() => {
                  if (skill.targetsAllies) handleUseSkillOnAlly(skill)
                  else setActiveSkill(activeSkill?.id === skill.id ? null : skill)
                }}
              >
                {skill.label}
                <span className="combat-demo-skill-sub">{skill.sub}</span>
              </button>
            )
          })}
        </div>
      )}

      <p className="combat-demo-hint">
        {isPlayerTurn
          ? (activeSkill ? 'Click a glowing enemy to target.' : 'Drag your party to reposition, or pick a skill.')
          : `${current?.combatant.name ?? '…'} is acting…`}
      </p>

      <div className="combat-demo-log">
        {log.map((l, i) => <p key={i}>{l}</p>)}
      </div>
    </div>
  )
}
