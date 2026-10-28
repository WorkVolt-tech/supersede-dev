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
    if (current) {
      await supabase.from('inventory').update({ equipped_slot: null }).eq('id', current.id)
    }
    if (item.two_handed && slotKey === 'mainhand') {
      const oh = items.find(i => i.equipped_slot === 'offhand')
      if (oh) await supabase.from('inventory').update({ equipped_slot: null }).eq('id', oh.id)
    }
    await supabase.from('inventory').update({ equipped_slot: slotKey }).eq('id', itemId)

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
    await supabase.from('inventory').update({ equipped_slot: null }).eq('id', item.id)
    set({ items: items.map(i => i.id === item.id ? { ...i, equipped_slot: null } : i) })
  },
}))
