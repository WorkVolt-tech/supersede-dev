import { supabase } from '../lib/supabaseClient'

const FALLBACK_ITEMS = {
  scrap_metal: { name:'Scrap Metal', item_type:'material', icon:'⚙️' },
  medical_pack: { name:'Medical Pack', item_type:'consumable', icon:'🩹', hp_restore:30 },
  medkit: { name:'Medkit', item_type:'consumable', icon:'🧰', hp_restore:50 },
  energy_drink: { name:'Energy Drink', item_type:'consumable', icon:'🥤' },
  rare_component: { name:'Rare Component', item_type:'material', icon:'🔮', rarity:'rare' },
}
const STACKABLE = new Set(['consumable', 'material', 'key'])
const ITEM_COLUMNS = ['item_key','name','item_type','subtype','rarity','icon','atk_bonus','def_bonus','max_hp_bonus',
  'hp_restore','two_handed','element','power_bonus','guard_bonus','control_bonus','speed_bonus',
  'insight_bonus','luck_bonus','agility_bonus','special_effect']

export async function grantLoot(playerId, drops = [], luck = 0) {
  if (!playerId || !Array.isArray(drops) || !drops.length) return []
  const earned = []
  for (const drop of drops) {
    // Explicit chance values are weighted drops. Story rewards without a
    // chance remain guaranteed. Luck improves odds by 5% per point.
    if (typeof drop.chance === 'number') {
      const chance = Math.max(0,Math.min(1,drop.chance * (1+Math.max(0,Number(luck)||0)*.05)))
      if (Math.random() >= chance) continue
    }
    const key = drop.itemKey || drop.item_key
    if (!key) continue
    const qty = Math.max(1, Math.floor(Number(drop.qty || 1)))
    const { data: catalog } = await supabase.from('items').select('*').eq('item_key', key).maybeSingle()
    const item = { name:key.replace(/_/g,' '), item_type:'material', icon:'📦', rarity:'common', ...FALLBACK_ITEMS[key], ...(catalog || {}) }
    const row = Object.fromEntries(ITEM_COLUMNS.filter(k => item[k] !== undefined).map(k => [k,item[k]]))
    row.player_id = playerId
    row.item_key = key
    row.quantity = STACKABLE.has(item.item_type) ? qty : 1
    row.sockets_total = 0
    row.sockets_used = 0
    row.socketed_runes = []

    if (STACKABLE.has(item.item_type)) {
      const { data: existing, error: lookupError } = await supabase.from('inventory')
        .select('id,quantity').eq('player_id',playerId).eq('item_key',key).limit(1)
      if (lookupError) throw new Error(lookupError.message)
      if (existing?.length) {
        const { error } = await supabase.from('inventory').update({ quantity:(existing[0].quantity || 1)+qty }).eq('id',existing[0].id)
        if (error) throw new Error(error.message)
        earned.push({ name:item.name, icon:item.icon, qty })
        continue
      }
    }
    for (let i=0; i<(STACKABLE.has(item.item_type)?1:qty); i++) {
      const { error } = await supabase.from('inventory').insert(row)
      if (error) throw new Error(error.message)
    }
    earned.push({ name:item.name, icon:item.icon, qty })
  }
  return earned
}
