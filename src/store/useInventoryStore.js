import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'
import { SLOTS } from '../game/equipmentSlots'

export const useInventoryStore = create((set, get) => ({
  items: [],
  loading: true,

  async loadInventory(playerId) {
    set({ loading: true })
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .eq('player_id', playerId)
      .order('obtained_at', { ascending: false })
    set({ items: data || [], loading: false })
  },

  async equipItem(itemId, slotKey) {
    const { items } = get()
    const item = items.find(i => i.id === itemId)
    const slotDef = SLOTS.find(s => s.key === slotKey)
    if (!item || !slotDef) return { ok: false, reason: 'Invalid item or slot.' }

    if (!slotDef.accepts.includes(item.subtype || item.item_type)) {
      return { ok: false, reason: `${item.name} can't go in ${slotDef.label}.` }
    }

    const current = items.find(i => i.equipped_slot === slotKey)
    if (slotKey === 'offhand' && items.some(i => i.equipped_slot === 'mainhand' && i.two_handed)) {
      return { ok: false, reason: 'Unequip your two-handed weapon first.' }
    }
    if (current) {
      const { error } = await supabase.from('inventory').update({ equipped_slot: null }).eq('id', current.id)
      if (error) return { ok:false, reason:error.message }
    }
    if (item.two_handed && slotKey === 'mainhand') {
      const oh = items.find(i => i.equipped_slot === 'offhand')
      if (oh) {
        const { error } = await supabase.from('inventory').update({ equipped_slot: null }).eq('id', oh.id)
        if (error) return { ok:false, reason:error.message }
      }
    }
    const { error } = await supabase.from('inventory').update({ equipped_slot: slotKey }).eq('id', itemId)
    if (error) { await get().loadInventory(item.player_id); return { ok:false, reason:error.message } }

    set({
      items: items.map(i => {
        if (i.id === itemId) return { ...i, equipped_slot: slotKey }
        if (current && i.id === current.id) return { ...i, equipped_slot: null }
        if (item.two_handed && slotKey === 'mainhand' && i.equipped_slot === 'offhand') return { ...i, equipped_slot: null }
        return i
      }),
    })
    return { ok: true }
  },

  async unequipSlot(slotKey) {
    const { items } = get()
    const item = items.find(i => i.equipped_slot === slotKey)
    if (!item) return
    const { error } = await supabase.from('inventory').update({ equipped_slot: null }).eq('id', item.id)
    if (error) return { ok:false, reason:error.message }
    set({ items: items.map(i => i.id === item.id ? { ...i, equipped_slot: null } : i) })
    return { ok:true }
  },

  async consumeItem(itemId) {
    const item = get().items.find(i => i.id===itemId)
    if (!item || item.item_type!=='consumable') return { ok:false, reason:'Not a consumable.' }
    const qty = item.quantity || 1
    const query = supabase.from('inventory')
    const { error } = qty>1
      ? await query.update({quantity:qty-1}).eq('id',itemId)
      : await query.delete().eq('id',itemId)
    if (error) return { ok:false, reason:error.message }
    set({items:get().items.flatMap(i => i.id!==itemId ? [i] : qty>1 ? [{...i,quantity:qty-1}] : [])})
    return { ok:true }
  },
}))
