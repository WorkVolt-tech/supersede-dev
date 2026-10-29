import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useInventoryStore } from '../../store/useInventoryStore'
import { SLOTS, RARITY, equipmentSubtype } from '../../game/equipmentSlots'
import { usePlayerStore } from '../../store/usePlayerStore'
import { calcMaxHp } from '../../game/playerStats'
import { findRuneword, normalizedItem } from '../../game/runes'
import './InventoryScreen.css'

export default function InventoryScreen() {
  const items = useInventoryStore(s => s.items)
  const equipItem = useInventoryStore(s => s.equipItem)
  const unequipSlot = useInventoryStore(s => s.unequipSlot)
  const consumeItem = useInventoryStore(s => s.consumeItem)
  const socketRune = useInventoryStore(s => s.socketRune)
  const player = usePlayerStore(s => s.player)
  const updatePlayer = usePlayerStore(s => s.updatePlayer)
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('all')

  const [message, setMessage] = useState('')
  const [rejectFlash, setRejectFlash] = useState(false)
  const slotRefs = useRef({})
  const gridRef = useRef(null)

  const equippedBySlot = Object.fromEntries(
    SLOTS.map(s => [s.key, items.find(i => i.equipped_slot === s.key) || null])
  )
  const unequippedItems = items.filter(i => !i.equipped_slot)
  const selected = items.find(i => i.id===selectedId)
  const displayItem = selected && normalizedItem(selected)
  const runeword = selected && findRuneword(selected.socketed_runes || [],selected.item_type,selected.sockets_total)
  const runes = items.filter(i=>i.item_key?.startsWith('rune_') && (i.quantity||1)>0)
  const filteredItems = unequippedItems.filter(i => filter==='all' || i.item_type===filter)
  const itemStats = selected ? [
    ['Attack',displayItem.atk_bonus],['Defense',displayItem.def_bonus],['Max HP',displayItem.max_hp_bonus],
    ['Power',displayItem.power_bonus],['Guard',displayItem.guard_bonus],['Speed',displayItem.speed_bonus],
    ['Control',displayItem.control_bonus],['Insight',displayItem.insight_bonus],['Luck',displayItem.luck_bonus],
    ['Agility',displayItem.agility_bonus],['Healing',displayItem.hp_restore],
  ].filter(([,value])=>Number(value)>0) : []

  async function equipSelected(slotKey) {
    if (!selected) return
    const result = await equipItem(selected.id,slotKey)
    setMessage(result.ok ? `${selected.name} equipped.` : result.reason)
  }
  async function useSelected() {
    if (!selected || !player) return
    const maxHp = calcMaxHp(player,items.filter(i=>i.equipped_slot))
    const restored = Math.min(maxHp-(player.hp||0),selected.hp_restore||0)
    if (selected.hp_restore && restored<=0) { setMessage('Your HP is already full.'); return }
    if (selected.hp_restore) await updatePlayer({hp:(player.hp||0)+restored})
    const result = await consumeItem(selected.id)
    setMessage(result.ok ? `Used ${selected.name}.${restored>0 ? ' Restored '+restored+' HP.' : ''}` : result.reason)
  }

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
      <h2>Inventory &amp; Equipment</h2>
      <p className="inv-help">Select an item to inspect or equip it. You can also drag equipment into a slot.</p>
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
                  onClick={() => setSelectedId(item.id)}
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
        <div className="inv-filters">
          {['all','weapon','armor','accessory','consumable','material','key'].map(type=>
            <button key={type} className={filter===type?'active':''} onClick={()=>setFilter(type)}>{type}</button>)}
        </div>
        <div className="inv-grid" ref={gridRef}>
          {filteredItems.map(item => (
            <motion.div
              key={item.id}
              className="inv-tile"
              style={{ background: RARITY[item.rarity] || RARITY.common }}
              drag
              dragMomentum={false}
              dragElastic={0.15}
              onDragEnd={(e, info) => handleDragEnd(item, info)}
              onClick={() => setSelectedId(item.id)}
              whileDrag={{ scale: 1.15, zIndex: 30 }}
              whileHover={{ scale: 1.05 }}
              layoutId={`inv-${item.id}`}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              title={item.name}
            >
              {item.icon || '❔'}
              {(item.quantity||1)>1 && <span className="inv-quantity">×{item.quantity}</span>}
            </motion.div>
          ))}
          {filteredItems.length===0 && <p className="inv-empty">No items in this category yet. Defeat enemies and collect story rewards.</p>}
        </div>
      </div>
      <section className="inv-detail" aria-live="polite">
        {selected ? <>
          <h3>{selected.icon || '📦'} {selected.name}</h3>
          <p className="inv-meta">{selected.rarity || 'common'} · {selected.subtype || selected.item_type} · ×{selected.quantity||1}</p>
          {itemStats.length>0 && <div className="inv-stats">{itemStats.map(([label,value])=><span key={label}>{label} +{value}</span>)}</div>}
          {Number(selected.sockets_total)>0 && <div className="inv-socket-panel">
            <p><strong>Rune sockets:</strong> {(selected.socketed_runes||[]).length}/{selected.sockets_total}</p>
            <p>{Array.from({length:selected.sockets_total},(_,i)=>selected.socketed_runes?.[i] ? `◆ ${selected.socketed_runes[i]}` : '◇ Empty').join(' · ')}</p>
            {runeword && <><p className="inv-runeword">✦ {runeword.name}</p><div className="inv-stats">{Object.entries(runeword.stats).map(([key,value])=><span key={key}>{key.replace('_bonus','').replace('_',' ')} +{value}</span>)}</div></>}
            {(selected.socketed_runes||[]).length<selected.sockets_total && <>
              <p>Select a rune to permanently socket it:</p>
              {runes.map(r=><button className="inv-action" key={r.id} onClick={async()=>{const result=await socketRune(selected.id,r.id);setMessage(result.reason)}}>{r.icon||'◆'} {r.name} ×{r.quantity||1}</button>)}
              {!runes.length && <p>No runes available. Find them as drops.</p>}
            </>}
          </div>}
          {selected.special_effect && <p>{selected.special_effect}</p>}
          {selected.equipped_slot
            ? <button className="inv-action" onClick={async()=>{const r=await unequipSlot(selected.equipped_slot);setMessage(r?.ok?'Unequipped.':r?.reason)}}>Unequip</button>
            : SLOTS.filter(slot=>slot.accepts.includes(equipmentSubtype(selected))).map(slot=>
              <button className="inv-action" key={slot.key} onClick={()=>equipSelected(slot.key)}>Equip · {slot.label}</button>)}
          {selected.item_type==='consumable' && <button className="inv-action" onClick={useSelected}>Use item</button>}
        </> : <p>Select an item to see its properties and available actions.</p>}
      </section>
    </div>
  )
}
