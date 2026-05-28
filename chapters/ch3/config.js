// chapters/ch3/config.js — Chapter 3 constants & configuration

export const META = {
  number: 3,
  title:  'Signal Hunters',
  sub:    'A signal pulses from the deep. The System is listening.',
  unlocksChapter: 4,
}

// Signal strength accumulates as the player descends + solves puzzles.
// Used for hidden-loot gates and the Echo Beast intro.
//   0-20  : 'faint'    — barely there, just static
//   21-50 : 'present'  — clear hum, hidden caches start to appear
//   51-80 : 'strong'   — pattern emerges, Echo Beast can detect you
//   81+   : 'lock'     — signal source located, boss available
export function signalTier(strength) {
  const s = strength || 0
  if (s >= 81) return 'lock'
  if (s >= 51) return 'strong'
  if (s >= 21) return 'present'
  return 'faint'
}

// Display metadata for each tier — { key, label, color }. Single source
// of truth for the HUD signal readout AND hidden-cache gating. Colors are
// chosen to stay readable on the dark signal box (no near-black greys).
export function signalTierMeta(strength) {
  const key = signalTier(strength)
  switch (key) {
    case 'lock':    return { key, label: 'LOCKED',  color: '#5ec45e' } // source found — green
    case 'strong':  return { key, label: 'STRONG',  color: '#c8a050' } // gold
    case 'present': return { key, label: 'PRESENT', color: '#8a7050' } // tan
    default:        return { key, label: 'FAINT',   color: '#9a9a9a' } // readable grey
  }
}
