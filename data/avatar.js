// data/avatar.js — single source of truth for player avatars/icons.
//
// PURPOSE
// Consolidates avatar rendering so every chapter, the lobby, and PvP all
// use the same images, paths, and visual style. Same pattern as
// reputation.js — when this changes, every consumer changes.
//
// CURRENT EXPORTS
//   getReputationAvatar(moral) → { tier, label, color, src }
//   renderReputationBadge(moral, opts?) → HTML string of the rounded avatar
//
// PLANNED EXPORTS (next pass — not in this batch):
//   getClassAvatar(classKey)
//   renderClassBadge(classKey, opts?)
//
// USAGE
//   import { renderReputationBadge } from '../../data/avatar.js'
//   document.getElementById('hud').innerHTML = `
//     ${renderReputationBadge(player.moral_score, { size: 56 })}
//     <p>...</p>
//   `
//
// The HTML returned uses inline styles only (no external CSS) so the
// markup drops in anywhere without a stylesheet dependency.

import { getMoralTier } from './reputation.js'

// ── Reputation avatar mapping ─────────────────────────────────────
// Each 6-tier moral tier key maps to a WEBP file in /assets/reputation/.
// The tier keys come from reputation.js getMoralTier() — keep them in
// sync if you ever rename a tier.
const REP_AVATAR_FILES = {
  hero:     'hero.webp',
  good:     'good.webp',
  neutral:  'neutral.webp',
  ruthless: 'ruthless.webp',
  corrupt:  'corrupt.webp',
  villain:  'villain.webp',
}

// Resolve the asset path. Pages live at /pages/<thing>.html and the
// assets directory is one level up at /assets/. The relative prefix
// `../assets/reputation/` matches how the rest of the project addresses
// asset folders (see vehicle.js EYE_FILES, etc.).
const REP_AVATAR_PATH = '../assets/reputation/'

// Get the full descriptor for a player's current rep avatar.
// Returns: { tier, label, color, src }
//   tier   — 'hero' | 'good' | 'neutral' | 'ruthless' | 'corrupt' | 'villain'
//   label  — display label ('Hero', 'Good', etc.)
//   color  — hex string for the ring/border
//   src    — relative URL to the avatar image
export function getReputationAvatar(moral) {
  const tier = getMoralTier(moral)
  return {
    tier:  tier.key,
    label: tier.label,
    color: tier.color,
    src:   REP_AVATAR_PATH + (REP_AVATAR_FILES[tier.key] || REP_AVATAR_FILES.neutral),
  }
}

// Render the rep avatar as an HTML string — round image with a colored
// ring matching the tier color. Suitable for inlining into innerHTML.
//
// opts:
//   size       — pixel dimensions (default 48). The img is sized to
//                size, the ring adds 4px outside (so total = size+8).
//   ringWidth  — px width of the colored ring (default 2)
//   title      — tooltip text (default = tier label)
//   className  — extra class for targeting
//
// The wrapper is a span with `display:inline-block` so it sits inline
// with text, and `vertical-align:middle` so it aligns nicely beside a
// label.
export function renderReputationBadge(moral, opts = {}) {
  const { tier, label, color, src } = getReputationAvatar(moral)
  const size      = opts.size      || 48
  const ringWidth = opts.ringWidth || 2
  const title     = opts.title     || label
  const className = opts.className || ''
  // Outer span sets the ring (border) and circular clip. Inner img is
  // sized to fill. We use `object-fit:cover` so non-square art is
  // center-cropped rather than stretched.
  return `<span class="rep-avatar rep-avatar-${tier} ${className}"
    title="${title}"
    style="display:inline-block;width:${size}px;height:${size}px;
      border-radius:50%;border:${ringWidth}px solid ${color};
      box-shadow:0 0 ${ringWidth*3}px ${color}66;
      overflow:hidden;vertical-align:middle;line-height:0;
      background:#0a0908;flex-shrink:0">
    <img src="${src}" alt="${label}"
      style="width:100%;height:100%;object-fit:cover;display:block"
      onerror="this.style.display='none'"/>
  </span>`
}
