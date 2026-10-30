import { useState } from 'react'

// Keep inventory access inside the mounted combat screen so fights never reset.
export default function BattleConsumables({ items, hp, maxHp, disabled, onUse }) {
  const [open,setOpen]=useState(false)
  const potions=items.filter(item=>item.item_type==='consumable'&&Number(item.hp_restore)>0&&(item.quantity||1)>0)
  return <div className="combat-attack-details">
    <button type="button" className="combat-action-btn" aria-expanded={open}
      onClick={()=>setOpen(value=>!value)}>Bag · Potions ({potions.reduce((n,item)=>n+(item.quantity||1),0)}) {open?'▴':'▾'}</button>
    {open&&<div className="combat-potion-list">
      {potions.length===0?<p>No healing potions in inventory.</p>:
      potions.map(item=><button type="button" key={item.id} className="combat-action-btn"
        disabled={disabled||hp>=maxHp} onClick={()=>onUse(item)}>
        {item.name} ×{item.quantity||1} · +{item.hp_restore} HP · 1 AP
      </button>)}
    </div>}
  </div>
}
