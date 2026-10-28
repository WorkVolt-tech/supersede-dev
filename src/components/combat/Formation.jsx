// Formation.jsx
// ─────────────────────────────────────────────────────────────────────────
// Renders both ranked rows (player + enemy). Player combatants can be
// dragged between your own ranks (reusing the same drag pattern as
// DragPuzzle/InventoryScreen — drop-rect detection on drag end). When a
// skill is selected (activeSkill prop), legal enemy targets light up and
// become clickable, per formation.js's canTargetRank rules.
import { useRef } from 'react'
import { motion } from 'framer-motion'
import { canTargetRank } from '../../game/formation'
import './Formation.css'

function HpBar({ hp, maxHp }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  return (
    <div className="formation-hp-bar">
      <div className={`formation-hp-fill ${pct < 30 ? 'low' : ''}`} style={{ width: pct + '%' }} />
    </div>
  )
}

export default function Formation({
  playerFormation,
  enemyFormation,
  activeSkill,      // the skill currently selected, or null
  onReorderPlayer,  // (fromRank, toRank) => void
  onTargetEnemy,    // (rank) => void
}) {
  const slotRefs = useRef({})

  function pointInRect(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
  }

  function handleDragEnd(fromRank, info) {
    for (let rank = 1; rank <= 4; rank++) {
      const el = slotRefs.current[`player-${rank}`]
      if (el && pointInRect(info.point.x, info.point.y, el.getBoundingClientRect())) {
        if (rank !== fromRank) onReorderPlayer?.(fromRank, rank)
        return
      }
    }
  }

  const legalEnemyRanks = activeSkill && !activeSkill.targetsAllies
    ? [1, 2, 3, 4].filter(r => enemyFormation[r - 1] && canTargetRank(activeSkill, r))
    : []

  return (
    <div className="formation-wrap">
      <div>
        <div className="formation-labels"><span>ENEMY</span><span>FRONT →</span></div>
        <div className="formation-row enemy">
          {enemyFormation.map((c, i) => {
            const rank = i + 1
            const isLegal = legalEnemyRanks.includes(rank)
            return (
              <div
                key={rank}
                ref={el => (slotRefs.current[`enemy-${rank}`] = el)}
                className={`formation-slot ${isLegal ? 'legal-target' : ''}`}
                onClick={() => isLegal && onTargetEnemy?.(rank)}
              >
                <span className="formation-rank-num">{rank}</span>
                {c && (
                  <div className="formation-combatant enemy-combatant">
                    <span className="formation-combatant-icon">{c.icon || '👤'}</span>
                    <span className="formation-combatant-name">{c.name}</span>
                    <HpBar hp={c.hp} maxHp={c.maxHp} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div className="formation-row">
          {playerFormation.map((c, i) => {
            const rank = i + 1
            return (
              <div
                key={rank}
                ref={el => (slotRefs.current[`player-${rank}`] = el)}
                className="formation-slot"
              >
                <span className="formation-rank-num">{rank}</span>
                {c && (
                  <motion.div
                    className="formation-combatant"
                    drag
                    dragMomentum={false}
                    onDragEnd={(e, info) => handleDragEnd(rank, info)}
                    whileDrag={{ scale: 1.15, zIndex: 30 }}
                    layoutId={`combatant-${c.id}`}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <span className="formation-combatant-icon">{c.icon || '🧑'}</span>
                    <span className="formation-combatant-name">{c.name}</span>
                    <HpBar hp={c.hp} maxHp={c.maxHp} />
                  </motion.div>
                )}
              </div>
            )
          })}
        </div>
        <div className="formation-labels"><span>← FRONT</span><span>YOUR PARTY</span></div>
      </div>
    </div>
  )
}
