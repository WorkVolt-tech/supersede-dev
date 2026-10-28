import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

export const usePlayerStore = create((set, get) => ({
  player: null,
  loading: true,
  error: null,

  async loadPlayer(userId) {
    set({ loading: true, error: null })
    // players are keyed by user_id (the auth account), same as the old
    // auth.html / setup.html. maybeSingle() so "no player yet" is a normal
    // result (-> character setup), not an error.
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) {
      set({ loading: false, error: error.message })
      return null
    }
    set({ player: data || null, loading: false })
    return data || null
  },

  async updatePlayer(updates) {
    const current = get().player
    if (!current) return
    const { error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', current.id)
    if (error) {
      set({ error: error.message })
      return
    }
    set({ player: { ...current, ...updates } })
  },

  setPlayerLocal(updates) {
    const current = get().player
    if (!current) return
    set({ player: { ...current, ...updates } })
  },
}))
