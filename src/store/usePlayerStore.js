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

  // Drives have a one-time completion reward. Confirm the database actually
  // updated the player's row before unlocking the next chapter locally.
  // Return an error to the drive screen instead of dismissing its victory.
  async unlockChapter(destination) {
    const current = get().player
    if (!current?.id) return { ok: false, error: 'Character is not loaded.' }
    const unlocked = Array.isArray(current.chapters_unlocked) ? current.chapters_unlocked : [1]
    const chapters = [...new Set([...unlocked, destination])]
    try {
      const { data, error } = await supabase
        .from('players')
        .update({ chapters_unlocked: chapters })
        .eq('id', current.id)
        .select('chapters_unlocked')
        .single()
      if (error) return { ok: false, error: error.message }
      if (!Array.isArray(data?.chapters_unlocked) || !data.chapters_unlocked.includes(destination)) {
        return { ok: false, error: 'The chapter unlock could not be confirmed. Please retry.' }
      }
      const latest = get().player
      if (latest?.id === current.id) {
        set({ player: { ...latest, chapters_unlocked: data.chapters_unlocked } })
      }
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error?.message || 'The chapter unlock could not be saved.' }
    }
  },

  setPlayerLocal(updates) {
    const current = get().player
    if (!current) return
    set({ player: { ...current, ...updates } })
  },
}))
