// ─────────────────────────────────────────────────────────────────────────
// reputation.js — single source of truth for moral/reputation systems
//
// There are TWO ladders running in parallel in this game:
//
//   1. moralLabel (6 tiers) — derived from moral_score alone. Player-facing.
//      Hero / Good / Neutral / Ruthless / Corrupt / Villain
//      Used in the HUD seal display. Updates instantly when moral changes.
//
//   2. badge (4 tiers) — derived from moral_score + pvp_kills + helps_given.
//      'elite' / 'green' / 'neutral' / 'red'
//      Stored in player.badge and player.reputation columns. Used by:
//      - Lobby (other players see this label as Hunter/Helper/Elite/Neutral)
//      - Finale gating (hero finale requires high badge etc.)
//      - REPUTATION SHIFT toast on tier transitions
//
// These two systems are intentionally kept separate because (1) is just a
// visual, while (2) has side effects in multiplayer + story gating.
//
// USAGE:
//   import { getMoralTier, calcBadge, applyMoralChange, getBadgeMeta } from '../../data/reputation.js'
//
//   // HUD display
//   const tier = getMoralTier(player.moral_score)
//   // → { key, label, color, seal }
//
//   // After a choice that has choice.moral = +10:
//   const r = applyMoralChange(player, choice.moral)
//   // → mutates player.moral_score and player.badge in memory
//   // → returns { oldMoral, newMoral, oldBadge, newBadge, shifted, updates }
//   // Caller is responsible for: await save(r.updates)
//
//   // Lobby/PvP context — display another player's badge:
//   const meta = getBadgeMeta(otherPlayer.badge)
//   // → { label: 'Hunter', color: '#e05555' }
// ─────────────────────────────────────────────────────────────────────────

// ── Moral score clamping ────────────────────────────────────────────────
// moral_score is bounded [-100, +100]. Apply this whenever moral_score is
// updated to prevent runaway accumulation.
export function clampMoral(moral) {
  return Math.max(-100, Math.min(100, moral || 0))
}

// ── 6-tier moral ladder (HUD display) ───────────────────────────────────
// Thresholds (inclusive lower bound):
//   ≥ 70  → Hero       blue   🔵
//   ≥ 30  → Good       green  🟢
//   ≥ -10 → Neutral    gold   🟡
//   ≥ -40 → Ruthless   orange 🟠
//   ≥ -70 → Corrupt    red    🔴
//   <  -70 → Villain   dark red 🔴 (same emoji as Corrupt, deeper color)
//
// These are the EXACT thresholds and colors from the previous inline HUD
// code in ch1/ch2. Do not change without coordinating with both chapters.
export function getMoralTier(moral) {
  const m = moral || 0
  if (m >=  70) return { key: 'hero',     label: 'Hero',     color: '#1e5a8a', seal: '🔵' }
  if (m >=  30) return { key: 'good',     label: 'Good',     color: '#2f7a2f', seal: '🟢' }
  if (m >= -10) return { key: 'neutral',  label: 'Neutral',  color: '#8b6a20', seal: '🟡' }
  if (m >= -40) return { key: 'ruthless', label: 'Ruthless', color: '#a04a18', seal: '🟠' }
  if (m >= -70) return { key: 'corrupt',  label: 'Corrupt',  color: '#a02020', seal: '🔴' }
  return            { key: 'villain',  label: 'Villain',  color: '#7a0a0a', seal: '🔴' }
}

// Convenience: just the 0–100 bar position (for the moral indicator dot).
// 0% = far left (-100 / pure villain), 100% = far right (+100 / pure hero).
export function getMoralBarPct(moral) {
  const m = clampMoral(moral)
  return Math.round((m + 100) / 2)
}

// ── 4-tier badge ladder (lobby/PvP/finale gating) ───────────────────────
// Badge is DERIVED from moral_score + pvp_kills + helps_given. Stored in
// player.badge and player.reputation. Never directly assigned by the
// player — always recomputed by calcBadge whenever any of the inputs
// change.
//
// EXACT thresholds (matches the inline calcBadge in ch1/ch2/lobby):
//   elite:   moral ≥ 60 AND (helps ≥ 3 OR pvp_kills = 0)
//   green:   moral ≥ 20 AND not elite
//   red:     moral ≤ -20 OR (pvp_kills ≥ 5 AND pvp_kills > helps × 3)
//   neutral: everything else (-19 to +19, low pvp)
export function calcBadge(moral, pvpKills, helpsGiven) {
  const m  = moral      || 0
  const pk = pvpKills   || 0
  const hg = helpsGiven || 0
  if (m >= 60 && (hg >= 3 || pk === 0)) return 'elite'
  if (m >= 20) return 'green'
  if (m <= -20 || (pk >= 5 && pk > hg * 3)) return 'red'
  return 'neutral'
}

// ── Badge display labels (lobby/PvP face) ───────────────────────────────
// In lobby.js, the 4-tier badge keys are translated to friendlier role
// names: 'red'→Hunter, 'green'→Helper, etc. This map is the authority.
// Matches the BC table that was previously inline in lobby.js.
const BADGE_META = {
  elite:   { label: 'Elite',   color: '#a07de0', emoji: '🟣' },
  green:   { label: 'Helper',  color: '#5ec45e', emoji: '🟢' },
  red:     { label: 'Hunter',  color: '#e05555', emoji: '🔴' },
  neutral: { label: 'Neutral', color: '#c8b96e', emoji: '🟡' },
  unknown: { label: 'Unknown', color: '#666',    emoji: '⚫' },
}

export function getBadgeMeta(badgeKey) {
  return BADGE_META[badgeKey] || BADGE_META.neutral
}

// ── Toast-friendly label maps (REPUTATION SHIFT notifications) ──────────
// Used when player.badge transitions cross a tier boundary. The "shift"
// message capitalizes the keys to ELITE/GREEN/NEUTRAL/RED format.
export function getBadgeShiftLabel(badgeKey) {
  const map = { elite: 'ELITE', green: 'GREEN', neutral: 'NEUTRAL', red: 'RED' }
  return map[badgeKey] || badgeKey?.toUpperCase() || 'UNKNOWN'
}

// ── Apply a moral_score delta ───────────────────────────────────────────
// Mutates the player object in memory (moral_score, badge), and returns:
//   - oldMoral / newMoral
//   - oldBadge / newBadge
//   - shifted: true if the badge tier changed
//   - updates: payload object to merge into the next save() call
//
// The caller decides when/how to persist (some flows merge into a bigger
// update, others save standalone). This keeps the function pure of I/O.
//
//   player    — the player object to mutate
//   delta     — the moral change amount (+10, -5, etc.)
//   opts      — optional: { pvpKills, helpsGiven } overrides. If omitted,
//               reads from player.pvp_kills and player.helps_given.
export function applyMoralChange(player, delta, opts = {}) {
  const oldMoral = player.moral_score || 0
  const oldBadge = player.badge || calcBadge(oldMoral, player.pvp_kills, player.helps_given)
  const newMoral = clampMoral(oldMoral + (delta || 0))
  const pvp   = opts.pvpKills   !== undefined ? opts.pvpKills   : player.pvp_kills
  const helps = opts.helpsGiven !== undefined ? opts.helpsGiven : player.helps_given
  const newBadge = calcBadge(newMoral, pvp, helps)
  player.moral_score = newMoral
  player.badge       = newBadge
  return {
    oldMoral, newMoral,
    oldBadge, newBadge,
    shifted: oldBadge !== newBadge,
    updates: { moral_score: newMoral, badge: newBadge, reputation: newBadge },
  }
}
