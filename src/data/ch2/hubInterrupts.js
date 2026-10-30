// Chapter 2's original plaza and finale interrupts, ported from
// WorkVolt-tech/supersede/chapters/ch2/index.js (_goToCore).
// All conditions use existing player flags; no new database columns.
export function computeCh2Tension(player) {
  const log = player?.alliance_log || []
  let tension = 0
  for (const tag of log) {
    if (tag === 'builders_helped') tension -= 5
    else if (tag === 'spared_humanoid') tension -= 3
    else if (tag === 'sera_met') tension -= 2
    else if (tag === 'executed_humanoid') tension += 10
    else if (tag === 'voss_aligned') tension += 15
    else if (tag === 'cowardice') tension += 5
  }
  if (log.includes('cache_seen') && (player?.moral_score || 0) >= 10) tension -= 8
  return Math.max(-60, Math.min(60, tension))
}

export function resolveCh2HubInterrupt(player, destination, pendingTags = []) {
  if (destination !== 'district_hub' && destination !== 'pre_boss_ch2') {
    return destination
  }
  const log = new Set([...(player?.alliance_log || []), ...pendingTags.filter(Boolean)])
  const cleared = (player?.defeated_bosses || []).filter(id => id.startsWith('zone_boss_')).length
  const moral = player?.moral_score || 0

  // Finales are eligible only on the way to the Judges, not at the hub.
  if (destination === 'pre_boss_ch2') {
    if (moral >= 60 && log.has('sweep_builders') && cleared >= 5 && !log.has('hero_finale_done')) {
      return 'hero_finale_offer'
    }
    if (moral <= -60 && log.has('sweep_hunters') && cleared >= 5 && !log.has('villain_finale_done')) {
      return 'villain_finale_offer'
    }
    return destination
  }

  // Priority exactly follows the original Chapter 2 _goToCore.
  if (!log.has('cache_seen') && cleared >= 3) return 'cache_betrayal_offer'
  if (!log.has('sweep_fired') && log.has('cache_seen') && computeCh2Tension(player) >= 35) {
    return 'sweep_arrival'
  }
  if (!log.has('sera_met') && log.has('builders_helped') && cleared >= 1) return 'sera_checkin'
  if (!log.has('voss_met') && (moral <= -20 || log.has('executed_humanoid')) && cleared >= 1) return 'voss_offer'
  if (!log.has('rue_met') && cleared >= 2) return 'rue_intel'
  if (log.has('spared_humanoid') && !log.has('spare_reaction_seen') && log.has('sera_met')) {
    return 'spare_reaction_sera'
  }
  if (log.has('executed_humanoid') && !log.has('execute_reaction_seen') && log.has('voss_met')) {
    return 'execute_reaction_voss'
  }
  if ((log.has('spared_humanoid') || log.has('executed_humanoid')) &&
      !log.has('rue_action_reaction_seen') && log.has('rue_met')) {
    return 'rue_action_reaction'
  }
  if (!log.has('tam_mid1_seen') && log.has('cache_seen') && cleared >= 2 && cleared <= 5) {
    return 'tam_wounded'
  }
  if (!log.has('tam_mid2_seen') && log.has('tam_mid1_seen') && cleared >= 4 && cleared <= 7) {
    return 'tam_at_crossroads'
  }
  return destination
}
