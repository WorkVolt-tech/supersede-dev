// data/leveling.js — single source of truth for XP / level math.
// ─────────────────────────────────────────────────────────────────────
// Why this file exists:
//   The XP-into-level math was copy-pasted into every chapter's index.js.
//   The copies drifted and the HUD bar bug ("doesn't reset after leveling")
//   kept reappearing whenever one copy was fixed but the others weren't, or
//   a file got reverted. Centralizing it here means: fix once, correct
//   everywhere; future chapters just import it.
//
// XP MODEL (canonical — matches the live save data):
//   player.xp is the XP earned INTO the current level. It resets toward 0
//   after each level-up. player.level is the current level.
//   xpForLevel(lvl) is the XP required to clear the current level.
//
//   The HUD bar is therefore simply xp / xpForLevel(level). After a level-up
//   the leftover (xp - cost) carries into the next level, so the bar resets
//   correctly — PROVIDED level-up logic stores the leftover, not the total.
//   resolveLevelUp() below does exactly that.
// ─────────────────────────────────────────────────────────────────────

// XP required to clear level `lvl` (go from lvl -> lvl+1).
// 100 * 1.5^(lvl-1) — the formula all three chapters already used.
export function xpForLevel(lvl) {
  return Math.floor(100 * Math.pow(1.5, (lvl || 1) - 1))
}

// HUD bar progress for the current level.
//   player.xp    — XP into the current level
//   player.level — current level
// returns { into, needed, pct } where pct is 0..100 clamped.
export function xpProgress(player) {
  const lvl    = player.level || 1
  const into   = Math.max(0, player.xp || 0)
  const needed = xpForLevel(lvl)
  const pct    = needed > 0 ? Math.min(100, Math.max(0, Math.round(into / needed * 100))) : 0
  // Clamp the displayed "into" so it never shows more than the bar can hold
  // (e.g. a pending level-up not yet processed). The real value still lives
  // in player.xp; this is display-only.
  const shownInto = Math.min(into, needed)
  return { into: shownInto, needed, pct }
}

// Pure level-up resolver on the "xp = into current level" model.
// Given the xp-into-level AFTER a gain and the current level, spend level
// costs until the leftover no longer affords the next level.
//   returns { leveled, levelsGained, newLevel, leftoverXp }
//     leftoverXp — the XP-into-level to STORE in player.xp (the value that
//                  makes the bar reset correctly). Callers MUST persist this,
//                  not the pre-subtraction total.
export function resolveLevelUp(xpIntoLevel, oldLevel) {
  let level = oldLevel || 1
  let xp = Math.max(0, xpIntoLevel || 0)
  let levelsGained = 0
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level)
    level++
    levelsGained++
  }
  return { leveled: levelsGained > 0, levelsGained, newLevel: level, leftoverXp: xp }
}
