import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useInventoryStore } from '../../store/useInventoryStore'
import { SLOTS, RARITY } from '../../game/equipmentSlots'
import './InventoryScreen.css'

export default function InventoryScreen() {
  const items = useInventoryStore(s => s.items)
  const equipItem = useInventoryStore(s => s.equipItem)
  const unequipSlot = useInventoryStore(s => s.unequipSlot)

  const [message, setMessage] = useState('')
  const [rejectFlash, setRejectFlash] = useState(false)
  const slotRefs = useRef({})
  const gridRef = useRef(null)

  const equippedBySlot = Object.fromEntries(
    SLOTS.map(s => [s.key, items.find(i => i.equipped_slot === s.key) || null])
  )
  const unequippedItems = items.filter(i => !i.equipped_slot)

  function pointInRect(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
  }

  async function handleDragEnd(item, info) {
    const { x, y } = info.point

    for (const slot of SLOTS) {
      const el = slotRefs.current[slot.key]
      if (el && pointInRect(x, y, el.getBoundingClientRect())) {
        const result = await equipItem(item.id, slot.key)
        if (!result.ok) {
          setMessage(result.reason)
          setRejectFlash(true)
          setTimeout(() => setRejectFlash(false), 350)
          setTimeout(() => setMessage(''), 2200)
        } else {
          setMessage('')
        }
        return
      }
    }

    const gridEl = gridRef.current
    if (item.equipped_slot && gridEl && pointInRect(x, y, gridEl.getBoundingClientRect())) {
      await unequipSlot(item.equipped_slot)
    }
  }

  return (
    <div className="inv-screen">
      <p className="choices-label" style={{ fontSize: 11, letterSpacing: '.1em', color: '#8a7255' }}>EQUIPMENT</p>
      <div className={`inv-slots ${rejectFlash ? 'reject-flash' : ''}`}>
        {SLOTS.map(slot => {
          const item = equippedBySlot[slot.key]
          return (
            <div key={slot.key} ref={el => (slotRefs.current[slot.key] = el)} className={`inv-slot ${item ? 'filled' : ''}`}>
              {item ? (
                <motion.div
                  className="inv-tile in-slot"
                  style={{ background: RARITY[item.rarity] || RARITY.common }}
                  drag
                  dragMomentum={false}
                  onDragEnd={(e, info) => handleDragEnd(item, info)}
                  whileDrag={{ scale: 1.15, zIndex: 30 }}
                  layoutId={`inv-${item.id}`}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  {item.icon || '❔'}
                  <span className="inv-tile-eq-badge">EQ</span>
                </motion.div>
              ) : (
                <span className="inv-slot-empty-icon">{slot.icon}</span>
              )}
              <span className="inv-slot-label">{slot.label}</span>
            </div>
          )
        })}
      </div>

      <p className="inv-toast">{message}</p>

      <div>
        <p className="choices-label" style={{ fontSize: 11, letterSpacing: '.1em', color: '#8a7255', marginBottom: 8 }}>INVENTORY</p>
        <div className="inv-grid" ref={gridRef}>
          {unequippedItems.map(item => (
            <motion.div
              key={item.id}
              className="inv-tile"
              style={{ background: RARITY[item.rarity] || RARITY.common }}
              drag
              dragMomentum={false}
              dragElastic={0.15}
              onDragEnd={(e, info) => handleDragEnd(item, info)}
              whileDrag={{ scale: 1.15, zIndex: 30 }}
              whileHover={{ scale: 1.05 }}
              layoutId={`inv-${item.id}`}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              title={item.name}
            >
              {item.icon || '❔'}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
