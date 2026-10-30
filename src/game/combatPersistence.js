// One fight, one confirmed character save, and at most one reward attempt.
// Failure keeps the outcome pending so the UI can retry without rerunning
// XP calculation or rerolling loot.
export async function persistCombatResult(pending, saveCharacter, grantRewards = async () => {}) {
  if (!pending || pending.saving) return false
  if (pending.committed) return true

  pending.saving = true
  pending.error = null
  try {
    const saved = await saveCharacter(pending.updates)
    if (!saved) {
      pending.error = 'Character progress could not be saved.'
      return false
    }
    pending.committed = true
    // Only roll loot after the character outcome is committed. A repeat
    // request must never grant it again.
    if (!pending.rewardsHandled) {
      pending.rewardsHandled = true
      try {
        await grantRewards()
      } catch (error) {
        pending.rewardError = error?.message || 'Could not save loot.'
      }
    }
    return true
  } catch (error) {
    pending.error = error?.message || 'Character progress could not be saved.'
    return false
  } finally {
    pending.saving = false
  }
}
