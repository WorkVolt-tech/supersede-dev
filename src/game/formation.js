// formation.js
// ─────────────────────────────────────────────────────────────────────────
// Darkest Dungeon-style rank mechanics, as pure functions — same spirit as
// class_combat.js/enemyAI.js (no DOM, no React). A "formation" is just an
// array of 4 slots (rank 1 = front, rank 4 = back); a slot holds a
// combatant object or null.
//
// This deliberately knows nothing about WHERE combatants come from (solo
// hero, temporary story ally, future multiplayer pawn) — it only works
// with whatever's already placed in the formation. Populating formations
// is a separate concern, layered on top later.

export function createFormation(combatants) {
  // combatants: array of up to 4, placed front-to-back in the order given.
  const slots = [null, null, null, null]
  combatants.slice(0, 4).forEach((c, i) => { slots[i] = c })
  return slots
}

// A skill can be used if the user's current rank is in `skill.usableFromRanks`.
// Omit usableFromRanks on a skill to mean "usable from any rank."
export function canUseSkill(skill, userRank) {
  if (!skill.usableFromRanks) return true
  return skill.usableFromRanks.includes(userRank)
}

// Which enemy ranks a skill can legally target. Omit targetRanks to mean
// "any rank" (e.g. most ranged/magic skills in DD ignore rank entirely).
export function canTargetRank(skill, targetRank) {
  if (!skill.targetRanks) return true
  return skill.targetRanks.includes(targetRank)
}

// Returns the list of {combatant, rank, side} the skill can legally hit,
// given both formations. side is 'player' or 'enemy'.
export function getLegalTargets(skill, playerFormation, enemyFormation) {
  const targets = []
  const pool = skill.targetsAllies ? playerFormation : enemyFormation
  const side = skill.targetsAllies ? 'player' : 'enemy'
  pool.forEach((c, i) => {
    const rank = i + 1
    if (c && canTargetRank(skill, rank)) targets.push({ combatant: c, rank, side })
  })
  return targets
}

// Push/pull/shuffle — moves a combatant by `delta` ranks (positive = toward
// back, negative = toward front), shifting whoever's in the way. Clamped
// to the formation's 4 slots. This is the mechanic that makes positioning
// a real tactical decision, not just flavor.
export function shiftRank(formation, fromRank, delta) {
  const next = [...formation]
  const idx = fromRank - 1
  const combatant = next[idx]
  if (!combatant) return next

  const targetIdx = Math.max(0, Math.min(3, idx + delta))
  if (targetIdx === idx) return next

  // Remove from current slot, shift everything between old and new
  // position by one, then place the combatant at its new slot — same
  // "insert and bump" behavior DD uses rather than a straight swap.
  next.splice(idx, 1)
  next.splice(targetIdx, 0, combatant)
  while (next.length < 4) next.push(null)
  return next.slice(0, 4)
}

// Swap two combatants directly (used by "swap places" effects, distinct
// from shiftRank's bump-everyone-along behavior).
export function swapRanks(formation, rankA, rankB) {
  const next = [...formation]
  const a = rankA - 1, b = rankB - 1
  ;[next[a], next[b]] = [next[b], next[a]]
  return next
}

// Speed-based turn order queue. Returns an array of {combatant, side, rank}
// sorted fastest-first. Call this at the start of each round — DD
// re-rolls initiative each round rather than keeping one fixed order for
// the whole fight, which keeps position-shuffling meaningful throughout.
export function computeTurnOrder(playerFormation, enemyFormation) {
  const entries = []
  playerFormation.forEach((c, i) => { if (c) entries.push({ combatant: c, side: 'player', rank: i + 1 }) })
  enemyFormation.forEach((c, i) => { if (c) entries.push({ combatant: c, side: 'enemy', rank: i + 1 }) })

  return entries
    .map(e => ({ ...e, roll: (e.combatant.spd || 5) + Math.random() * 3 }))
    .sort((a, b) => b.roll - a.roll)
}
