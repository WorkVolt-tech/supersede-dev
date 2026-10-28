import { supabase } from '../lib/supabaseClient'

// Only reset progress fields already present on this player's row. Keeping
// the player id, auth user id and username preserves account ownership.
export function freshStartFields(player) {
  const defaults = {
    level: 1, xp: 0, hp: 100, max_hp: 100, gold: 0,
    current_node: 'ch1_opening', current_chapter: 1, chapters_unlocked: [1],
    chapters_completed: [], drives_unlocked: [],
    moral_score: 0, badge: 'neutral', reputation: 'neutral',
    pvp_kills: 0, helps_given: 0, insight: 0,
    alliance_log: [], ch2_elements_attempted: [],
  }
  return Object.fromEntries(Object.entries(defaults).filter(([key]) => Object.hasOwn(player, key)))
}

export async function resetOwnCharacter(player) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user || user.id !== player.user_id) throw new Error('Your signed-in account could not be verified.')

  // A failure stops immediately and is shown in the UI; no silent success.
  const { error: playerError, data: updated } = await supabase
    .from('players').update(freshStartFields(player))
    .eq('id', player.id).eq('user_id', user.id).select('id').single()
  if (playerError || !updated) throw new Error(playerError?.message || 'Character reset was not saved.')

  const { error: inventoryError } = await supabase.from('inventory').delete().eq('player_id', player.id)
  if (inventoryError) throw new Error(`Character progress was reset, but the inventory could not be cleared: ${inventoryError.message}`)
}
