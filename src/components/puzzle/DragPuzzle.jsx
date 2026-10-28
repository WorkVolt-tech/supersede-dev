import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import './DragPuzzle.css'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function DragPuzzle({ config, onWin, onLose }) {
  const { headerText, prompt, pieces, slots, solution, attempts } = config

  const [placements, setPlacements] = useState(() =>
    Object.fromEntries(slots.map(s => [s.id, null]))
  )
  const [trayOrder] = useState(() => shuffle(pieces.map(p => p.id)))
  const [wrongTries, setWrongTries] = useState(0)
  const [result, setResult] = useState(null)
  const [shakeSlot, setShakeSlot] = useState(null)

  const slotRefs = useRef({})
  const containerRef = useRef(null)

  const placedIds = new Set(Object.values(placements).filter(Boolean))
  const trayPieces = trayOrder
    .filter(id => !placedIds.has(id))
    .map(id => pieces.find(p => p.id === id))

  function slotUnderPoint(x, y) {
    for (const slot of slots) {
      const el = slotRefs.current[slot.id]
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return slot.id
    }
    return null
  }

  function handleDragEnd(pieceId, event, info) {
    if (result) return
    const targetSlot = slotUnderPoint(info.point.x, info.point.y)
    if (!targetSlot) return

    setPlacements(prev => {
      const next = { ...prev, [targetSlot]: pieceId }
      for (const sid of Object.keys(next)) {
        if (sid !== targetSlot && next[sid] === pieceId) next[sid] = null
      }
      return next
    })
  }

  function checkSolution(currentPlacements) {
    const allFilled = slots.every(s => currentPlacements[s.id])
    if (!allFilled) return

    const correct = slots.every(s => {
      const placedId = currentPlacements[s.id]
      if (config.matchBy === 'label') {
        const placedPiece = pieces.find(p => p.id === placedId)
        const wantPiece   = pieces.find(p => p.id === solution[s.id])
        return placedPiece?.label === wantPiece?.label
      }
      return placedId === solution[s.id]
    })

    if (correct) {
      setResult('win')
      setTimeout(() => onWin?.(), 1000)
    } else {
      const nextTries = wrongTries + 1
      setWrongTries(nextTries)
      setShakeSlot('all')
      setTimeout(() => setShakeSlot(null), 400)

      if (attempts && nextTries >= attempts) {
        setResult('lose')
        setTimeout(() => onLose?.(), 1200)
      } else {
        setTimeout(() => {
          setPlacements(Object.fromEntries(slots.map(s => [s.id, null])))
        }, 500)
      }
    }
  }

  const placementsSignature = slots.map(s => placements[s.id] || '_').join(',')
  useEffect(() => {
    checkSolution(placements)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placementsSignature])

  return (
    <div className="puzzle-frame drag-puzzle" ref={containerRef}>
      {headerText && <p className="puzzle-header">{headerText}</p>}
      {prompt && <p className="puzzle-prompt">{prompt}</p>}

      <div className={`drag-puzzle-slots ${shakeSlot ? 'shake' : ''}`}>
        {slots.map(slot => {
          const filledId = placements[slot.id]
          const filledPiece = filledId ? pieces.find(p => p.id === filledId) : null
          return (
            <div
              key={slot.id}
              ref={el => (slotRefs.current[slot.id] = el)}
              className={`drag-puzzle-slot ${filledPiece ? 'filled' : ''}`}
            >
              {slot.label && <span className="drag-puzzle-slot-label">{slot.label}</span>}
              {filledPiece && (
                <motion.div
                  className="drag-puzzle-piece placed"
                  drag={!result}
                  dragMomentum={false}
                  onDragEnd={(e, info) => handleDragEnd(filledPiece.id, e, info)}
                  whileDrag={{ scale: 1.08, zIndex: 20 }}
                  layoutId={`piece-${filledPiece.id}`}
                >
                  {filledPiece.label}
                </motion.div>
              )}
            </div>
          )
        })}
      </div>

      <div className="drag-puzzle-tray">
        {trayPieces.map(piece => (
          <motion.div
            key={piece.id}
            className="drag-puzzle-piece"
            drag={!result}
            dragMomentum={false}
            dragElastic={0.15}
            onDragEnd={(e, info) => handleDragEnd(piece.id, e, info)}
            whileDrag={{ scale: 1.12, zIndex: 20 }}
            whileHover={{ scale: 1.05 }}
            layoutId={`piece-${piece.id}`}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {piece.label}
          </motion.div>
        ))}
      </div>

      {attempts && (
        <p className="puzzle-attempts">
          Attempts: {Math.max(0, attempts - wrongTries)} / {attempts}
        </p>
      )}

      {result === 'win' && <p className="puzzle-result win">✓ RESOLVED</p>}
      {result === 'lose' && <p className="puzzle-result lose">✕ EXHAUSTED</p>}
    </div>
  )
}
