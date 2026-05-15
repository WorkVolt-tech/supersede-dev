// classes.js — Hidden Class System
// ─────────────────────────────────────────────────────────────────────────
// Layers on top of the existing elemental skills tree without breaking it.
// Classes are:
//   • Hidden by default — the player never sees a "Classes" tab until they
//     unlock at least one class via a run.
//   • Level-gated (not SP-gated) — each class node opens when the player's
//     level meets the node's requirement.
//   • Acquired via Judge-based playstyle conditions, not purchase.
//
// The system is data-driven: add a new class by adding an entry to CLASSES.
// Each class entry has:
//   key            — stable identifier ('arbiter', 'nullborn', etc.)
//   name           — display name
//   judgeOf        — which Judge axis tests this class (lore-only string)
//   tagline        — one-line summary
//   color          — branch color used in tree rendering
//   unlocks(player) — pure predicate; true when this class should be unlocked
//   unlockNarrative — one-line system-message text fired when unlock triggers
//   nodes          — array of class skill nodes:
//     id, label, sub, x, y, levelRequired, requires:[ids], color
//
// Player storage (new player columns — see SQL migration below):
//   classes_unlocked       text[]   — class keys the player has revealed
//   class_nodes_unlocked   text[]   — flat array of "classKey:nodeId" strings
//   active_class           text     — currently displayed class title (lore)
//
// Integration points:
//   • skills.js — imports CLASSES + helpers, renders a hidden tab when the
//     player has any unlocked class. Uses isClassNodeAvailable / unlockClassNode.
//   • Chapter modules — call checkForNewlyUnlockedClasses(player) at chapter
//     end (e.g. after the Twin Judges) to detect newly-earned classes and
//     fire the system overlay.
// ─────────────────────────────────────────────────────────────────────────

// ── Element prefix list — used by "no elemental SP" purity check.
// A class's purity condition asks: has the player ever spent SP on a node
// whose id starts with one of these prefixes? If yes, elemental classes are
// off the table for this run.
export const ELEMENT_PREFIXES = [
  'ignis_', 'aqua_', 'volt_', 'arcane_',
  'umbra_', 'terra_', 'aero_',
  'flora_', 'ferro_', 'venin_',
]

// True if the player has put any SP into the elemental skill tree.
// Reads skill_levels (the {nodeId: level} map) — any element-prefixed key
// with level > 0 counts as "touched an element."
export function hasUsedAnyElement(player) {
  const levels = player.skill_levels || {}
  for (const key in levels) {
    if ((levels[key] || 0) <= 0) continue
    for (const prefix of ELEMENT_PREFIXES) {
      if (key.startsWith(prefix)) return true
    }
  }
  return false
}

// ── CLASS DEFINITIONS ────────────────────────────────────────────────────
// Only Arbiter is fully defined in this first wave. Future classes will be
// added as more Judges appear in later chapters. The data shape is fixed
// so future classes can be slotted in without touching skills.js.

export const CLASSES = {

  // ════════════════════════════════════════════════════════════════════
  // ARBITER — Judge of Truth path
  // Unlocks when: player defeats the Twin Judges WITHOUT investing in any
  // elemental skill AND holds a balanced moral_score (|moral| ≤ 20). This
  // is the "refused both extremes" path — neither hero nor villain, neither
  // builder nor hunter, neither element-aligned nor anti-element. The
  // System recognizes the refusal as its own kind of commitment.
  // ════════════════════════════════════════════════════════════════════
  arbiter: {
    key: 'arbiter',
    name: 'Arbiter',
    judgeOf: 'Judge of Truth',
    tagline: 'A human acknowledged by the System as equal to the Judges.',
    color: '#d4af37',  // gold — recognition, not warmth
    unlockNarrative: 'ANOMALY DETECTED — a path you did not choose has chosen you. CLASS REGISTERED: ARBITER.',

    unlocks(player) {
      const defeated = player.defeated_bosses || []
      const moral = player.moral_score || 0
      if (!defeated.includes('twin_judges')) return false
      if (hasUsedAnyElement(player)) return false
      if (Math.abs(moral) > 20) return false
      return true
    },

    // Six-node tree. Layout uses the same coordinate system as the elemental
    // tree (center at 1000, 1000 within the 2000×2000 canvas). Class trees
    // sit in their own coordinate space so they can be rendered independently
    // when the tab is active.
    nodes: [
      {
        id: 'arbiter_start',
        label: 'Arbiter',
        sub: 'Recognized',
        x: 1000, y: 1000,
        levelRequired: 1,
        requires: [],
        type: 'start',
      },
      {
        id: 'arbiter_verdict',
        label: 'Verdict',
        sub: 'Execute low-health enemies',
        x: 1000, y: 850,
        levelRequired: 5,
        requires: ['arbiter_start'],
        type: 'active',
        effect: 'execute_low_hp',  // 25% chance to instant-kill enemies below 15% HP
      },
      {
        id: 'arbiter_equal_measure',
        label: 'Equal Measure',
        sub: 'Defense scales with HP balance',
        x: 850, y: 950,
        levelRequired: 8,
        requires: ['arbiter_start'],
        type: 'passive',
        effect: 'balance_defense',  // when |player_hp% - enemy_hp%| < 0.15, +30% DEF
      },
      {
        id: 'arbiter_judgment_chain',
        label: 'Judgment Chain',
        sub: 'Consecutive hits increase execution chance',
        x: 1000, y: 700,
        levelRequired: 12,
        requires: ['arbiter_verdict'],
        type: 'passive',
        effect: 'judgment_chain',  // verdict execute threshold +1% per consecutive hit
      },
      {
        id: 'arbiter_law_of_balance',
        label: 'Law of Balance',
        sub: 'Reflect excess damage back to attackers',
        x: 700, y: 900,
        levelRequired: 20,
        requires: ['arbiter_equal_measure'],
        type: 'passive',
        effect: 'reflect_excess',  // damage above 50% max HP reflects back
      },
      {
        id: 'arbiter_final_decree',
        label: 'Final Decree',
        sub: 'Temporarily disable enemy passives',
        x: 1000, y: 550,
        levelRequired: 25,
        requires: ['arbiter_judgment_chain'],
        type: 'active',
        effect: 'silence_enemy',  // 3-turn silence on enemy ability use
      },
    ],
  },

  // Future classes will be added here. Each entry needs at minimum:
  //   key, name, judgeOf, tagline, color, unlocks(player), unlockNarrative,
  //   and a nodes[] array. The skills.js renderer will pick them up
  //   automatically — no UI changes needed per class.
  //
  // Reserved keys (slots for future content):
  //   nullborn, eclipse_walker, prime, unwritten, monarch, chimera,
  //   wrathborn, mourning_king, dreadnought, ghostblade, vessel, error,
  //   oathbreaker, silent_judge
}

// ── HELPERS ──────────────────────────────────────────────────────────────

// True if `classKey` has been added to player.classes_unlocked already.
export function isClassRevealed(player, classKey) {
  return (player.classes_unlocked || []).includes(classKey)
}

// Returns class keys that ARE eligible right now but NOT yet revealed —
// these are the unlocks that just happened. Caller (chapter module) is
// expected to add them to player.classes_unlocked and persist + fire
// the system overlay for each.
export function checkForNewlyUnlockedClasses(player) {
  const revealed = new Set(player.classes_unlocked || [])
  const newly = []
  for (const key in CLASSES) {
    if (revealed.has(key)) continue
    if (CLASSES[key].unlocks(player)) newly.push(key)
  }
  return newly
}

// True if any class is currently revealed for this player.
// skills.js uses this to decide whether to render the hidden class tab.
export function shouldShowClassTab(player) {
  return (player.classes_unlocked || []).length > 0
}

// Returns the class definition for a given key, or null.
export function getClass(classKey) {
  return CLASSES[classKey] || null
}

// True if the player has unlocked a specific node in a specific class.
export function isClassNodeUnlocked(player, classKey, nodeId) {
  const tag = classKey + ':' + nodeId
  return (player.class_nodes_unlocked || []).includes(tag)
}

// True if the player meets level + prereq requirements for a class node.
// "Available" means: not yet unlocked, level requirement met, at least one
// prerequisite node is unlocked (or this is the start node).
export function isClassNodeAvailable(player, classKey, nodeId) {
  const cls = CLASSES[classKey]
  if (!cls) return false
  const node = cls.nodes.find(n => n.id === nodeId)
  if (!node) return false
  if (isClassNodeUnlocked(player, classKey, nodeId)) return false
  if ((player.level || 1) < (node.levelRequired || 1)) return false
  if (!node.requires || node.requires.length === 0) return true
  return node.requires.some(req => isClassNodeUnlocked(player, classKey, req))
}

// Apply a class-node unlock to the player and return the new arrays for
// persistence. Pure — caller is responsible for the supabase update and
// for mutating player in place.
export function unlockClassNode(player, classKey, nodeId) {
  const tag = classKey + ':' + nodeId
  const existing = player.class_nodes_unlocked || []
  if (existing.includes(tag)) return { class_nodes_unlocked: existing }
  return { class_nodes_unlocked: [...existing, tag] }
}

// Returns the list of class keys the player has revealed, paired with
// their class definitions, for tab rendering.
export function getRevealedClasses(player) {
  return (player.classes_unlocked || [])
    .map(key => CLASSES[key])
    .filter(Boolean)
}

// ─────────────────────────────────────────────────────────────────────────
// SUPABASE MIGRATION (run once in the SQL editor):
//
// ALTER TABLE players
//   ADD COLUMN IF NOT EXISTS classes_unlocked     text[] DEFAULT '{}',
//   ADD COLUMN IF NOT EXISTS class_nodes_unlocked text[] DEFAULT '{}',
//   ADD COLUMN IF NOT EXISTS active_class         text   DEFAULT NULL;
//
// The reset-player script should also clear these three columns when
// resetting to level 1.
// ─────────────────────────────────────────────────────────────────────────
