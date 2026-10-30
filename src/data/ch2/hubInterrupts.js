// Chapter 2 plaza interruptions. Do not modify the canonical story nodes.
// All visits and completion markers live in the player's existing record.
// The first matching event appears when a player returns to district_hub;
// leaving its conversation saves the appropriate allianceTag before checking
// the next possible interruption.
export function resolveCh2HubInterrupt(player, destination, pendingTags = []) {
  if (destination !== 'district_hub') return destination

  const log = new Set([...(player?.alliance_log || []), ...pendingTags.filter(Boolean)])
  const defeated = new Set(player?.defeated_bosses || [])
  const zonesCleared = [...defeated].filter(id => id.startsWith('zone_boss_')).length

  // Sera follows up only if the player has already helped the Builders.
  // Voss can present the alternative path after the first guardian.
  // Rue's intel is specifically written for two cleared guardians.
  if (zonesCleared >= 1 && log.has('builders_helped') && !log.has('sera_met')) {
    return 'sera_checkin'
  }
  if (zonesCleared >= 1 && !log.has('voss_met')) {
    return 'voss_offer'
  }
  if (zonesCleared >= 2 && !log.has('rue_met')) {
    return 'rue_intel'
  }
  // The offer requires some existing Builder trust, as the story describes.
  // Its decision records cache_seen; a return via the offer cannot replay it.
  if (zonesCleared >= 3 && log.has('builders_helped') && !log.has('cache_seen')) {
    return 'cache_betrayal_offer'
  }

  return destination
}
