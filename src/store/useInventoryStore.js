import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'
import { SLOTS, equipmentSubtype, isTwoHandedWeapon } from '../game/equipmentSlots'
import { findRuneword, RUNE_NAMES, normalizedItem } from '../game/runes'

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
    set({ items: (data || []).map(normalizedItem), loading: false })
  },

  async socketRune(itemId, runeId) {
    const { items } = get()
    const item = items.find(i=>i.id===itemId)
    const rune = items.find(i=>i.id===runeId)
    if (!item || !rune || item.player_id!==rune.player_id) return {ok:false,reason:'Equipment or fragment not found.'}
    if (!['weapon','armor','accessory'].includes(item.item_type)) return {ok:false,reason:'Only equipment accepts fragments.'}
    const runeName = rune.item_key?.replace(/^rune_/, '')
    if (!rune.item_key?.startsWith('rune_') || !RUNE_NAMES.includes(runeName)) return {ok:false,reason:'Select a fragment.'}
    const used = (item.socketed_runes || []).length
    if (!item.sockets_total || used>=item.sockets_total) return {ok:false,reason:'No empty sockets.'}
    const socketed_runes = [...(item.socketed_runes || []),runeName]
    const rw = findRuneword(socketed_runes,item.item_type,item.sockets_total)
    const { error } = await supabase.from('inventory').update({socketed_runes,sockets_used:socketed_runes.length,runeword_name:rw?.name||null}).eq('id',itemId).eq('player_id',item.player_id)
    if (error) return {ok:false,reason:error.message}
    const qty = rune.quantity || 1
    const { error: consumeError } = qty>1
      ? await supabase.from('inventory').update({quantity:qty-1}).eq('id',runeId).eq('player_id',item.player_id)
      : await supabase.from('inventory').delete().eq('id',runeId).eq('player_id',item.player_id)
    if (consumeError) {
      await supabase.from('inventory').update({socketed_runes:item.socketed_runes||[],sockets_used:used,runeword_name:item.runeword_name||null}).eq('id',itemId).eq('player_id',item.player_id)
      return {ok:false,reason:consumeError.message}
    }
    await get().loadInventory(item.player_id)
    return {ok:true,reason:rw ? `✦ ${rw.name} Resonance activated!` : `Fragment inserted (${socketed_runes.length}/${item.sockets_total}).`}
  },

  async equipItem(itemId, slotKey) {
    const { items } = get()
    const item = items.find(i => i.id === itemId)
    const slotDef = SLOTS.find(s => s.key === slotKey)
    if (!item || !slotDef) return { ok: false, reason: 'Invalid item or slot.' }

    if (!slotDef.accepts.includes(equipmentSubtype(item))) {
      return { ok: false, reason: `${item.name} can't go in ${slotDef.label}.` }
    }

    const current = items.find(i => i.equipped_slot === slotKey)
    if (slotKey === 'offhand' && items.some(i => i.equipped_slot === 'mainhand' && isTwoHandedWeapon(i))) {
      return { ok: false, reason: 'Unequip your two-handed weapon first.' }
    }
    if (current) {
      const { error } = await supabase.from('inventory').update({ equipped_slot: null }).eq('id', current.id)
      if (error) return { ok:false, reason:error.message }
    }
    if (isTwoHandedWeapon(item) && slotKey === 'mainhand') {
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
        if (isTwoHandedWeapon(item) && slotKey === 'mainhand' && i.equipped_slot === 'offhand') return { ...i, equipped_slot: null }
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
