import { resolveLevelUp } from './leveling.js'

export function chapterOneComplete(player) {
  return player?.current_node === 'ch1_chapter_end' || (player?.chapters_completed || []).includes(1) || (player?.chapters_unlocked || []).includes(2)
}

export function firstDriveComplete(player) {
  return (player?.chapters_unlocked || []).includes(2)
}

export function chapterTwoComplete(player) {
  return player?.current_node === 'ch2_chapter_end_ch2' || (player?.chapters_completed || []).includes(2) || (player?.chapters_unlocked || []).includes(3)
}

export function secondDriveComplete(player) {
  return (player?.chapters_unlocked || []).includes(3)
}

export function grantXp(player, amount) {
  const earned = Math.max(0, Number(amount) || 0)
  const result = resolveLevelUp((player.xp || 0) + earned, player.level || 1)
  const updates = { xp: result.leftoverXp, level: result.newLevel }
  if (result.leveled) {
    // Match the original Supersede level-up rules: every base attribute,
    // including Insight, increases by one for each level gained.
    for (const stat of ['atk','def','power','guard','speed','insight','luck','control','agility']) {
      updates[stat] = (Number(player[stat]) || (stat === 'atk' ? 1 : 0)) + result.levelsGained
    }
    updates.max_hp = (player.max_hp || 100) + result.levelsGained * 5
    updates.hp = updates.max_hp
    updates.skill_points = (player.skill_points || 0) + result.levelsGained
    updates.sp_claimed = (player.sp_claimed || 0) + result.levelsGained
  }
  return updates
}
