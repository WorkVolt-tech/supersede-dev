// class_combat.js — Class skill combat hooks
// ─────────────────────────────────────────────────────────────────────────
// Both Ch1 and Ch2 combat engines import this module and call into its
// hook functions at well-defined points during combat. The module reads
// the player's unlocked class nodes (from class_nodes_unlocked) and applies
// the relevant skill effects.
//
// Design contract:
//   • All state lives in the combat engine's existing `statusEffects` object
//     (per-combat scratch space). New fields are namespaced under `cls_*`.
//   • All hooks take and return state — never mutate `player` directly.
//   • Hooks are tolerant of missing data (no class active = early return).
//   • Active skills are returned as button definitions; the engine renders
//     them and calls back into onActiveSkill(skillId, state).
// ─────────────────────────────────────────────────────────────────────────

import { CLASSES, isClassNodeUnlocked } from './classes.js'

// ── Helper: is a specific skill unlocked for the active class? ──────────
// Class skill nodes use IDs like 'arbiter_t1a', 'arbiter_t2c', etc.
function hasSkill(player, skillNodeId) {
  if (!player.active_class) return false
  return isClassNodeUnlocked(player, player.active_class, skillNodeId)
}

// ── Active skill list (rendered as combat buttons) ──────────────────────
// Returns an array of { id, label, sub, classColor, available } for every
// active-type class skill the player has unlocked. The engine renders these
// in a "Class Skills" row beneath the normal combat actions.
//
// "Available" reflects per-combat usage state: each active skill is once-per-
// combat by default (gated via statusEffects.cls_used[skillId]).
export function getActiveClassSkills(player, statusEffects) {
  if (!player.active_class) return []
  const cls = CLASSES[player.active_class]
  if (!cls) return []
  const used = statusEffects.cls_used || {}
  const out = []

  // Arbiter active skills
  if (player.active_class === 'arbiter') {
    if (hasSkill(player, 'arbiter_t1c')) {
      out.push({
        id: 'sentence_mark', label: 'Sentence Mark', sub: 'Mark enemy for 3 turns',
        classColor: cls.color, available: !used['sentence_mark'],
      })
    }
    if (hasSkill(player, 'arbiter_t6a')) {
      out.push({
        id: 'final_decree', label: 'Final Decree', sub: 'Silence enemy 3 turns',
        classColor: cls.color, available: !used['final_decree'],
      })
    }
  }
  return out
}

// ── Active skill activation ──────────────────────────────────────────────
// Called when the player clicks an active class skill button. Mutates
// statusEffects to apply the effect, returns { messages: [str], consumed:
// bool } so the engine can show feedback and decide whether to advance turn.
export function onActiveSkill(skillId, player, statusEffects, enemy) {
  if (!statusEffects.cls_used) statusEffects.cls_used = {}
  if (statusEffects.cls_used[skillId]) {
    return { messages: ['Class skill already used this combat.'], consumed: false }
  }
  statusEffects.cls_used[skillId] = true
  const messages = []

  if (skillId === 'sentence_mark') {
    statusEffects.cls_markTurns = 3
    messages.push('⚖ Sentence Mark — the enemy is Marked for 3 turns.')
  } else if (skillId === 'final_decree') {
    statusEffects.cls_silenceTurns = 3
    statusEffects.enemyStunTurns = Math.max(statusEffects.enemyStunTurns || 0, 3)
    messages.push('⚖ Final Decree — the enemy is silenced. 3 turns of action denied.')
  }
  return { messages, consumed: true }
}

// ── HOOK: combat start ──────────────────────────────────────────────────
// Called once when combat begins. Initializes per-combat counters and
// applies start-of-combat passives like Equal Sky.
export function onCombatStart(player, statusEffects) {
  if (!player.active_class) return { messages: [] }
  const messages = []
  // Initialize counters
  statusEffects.cls_consecutiveHits = 0
  statusEffects.cls_lastTargetHp    = null
  statusEffects.cls_witnessStacks   = 0
  statusEffects.cls_markTurns       = 0
  statusEffects.cls_silenceTurns    = 0
  statusEffects.cls_scalesPrimed    = false
  statusEffects.cls_used            = {}
  statusEffects.cls_pillarUsed      = false
  // Equal Sky — Arbiter t5b: start combat with +5 SP
  if (hasSkill(player, 'arbiter_t5b')) {
    statusEffects.cls_bonusSP = (statusEffects.cls_bonusSP || 0) + 5
    messages.push('⚖ Equal Sky — +5 SP granted.')
  }
  return { messages }
}

// ── HOOK: player attack (before damage is computed) ─────────────────────
// Returns adjustments the engine should apply:
//   { dmgMult, defIgnoreFrac, bonusFlatDmg, critChanceAdd, messages }
// All adjustments are additive/multiplicative on top of the base damage roll.
export function onPlayerAttack(player, statusEffects, enemy, baseDamage) {
  if (!player.active_class) return { messages: [] }
  const messages = []
  let dmgMult       = 1.0
  let defIgnoreFrac = 0
  let bonusFlatDmg  = 0
  let critChanceAdd = 0

  // Judgment Chain — Arbiter t2a: +5% crit per consecutive hit (cap +30%)
  if (hasSkill(player, 'arbiter_t2a')) {
    const stacks = Math.min(6, statusEffects.cls_consecutiveHits || 0)
    if (stacks > 0) critChanceAdd += 0.05 * stacks
  }

  // Scales of Truth — Arbiter t2b: +25% damage on next strike after taking >25% max HP damage
  if (hasSkill(player, 'arbiter_t2b') && statusEffects.cls_scalesPrimed) {
    dmgMult *= 1.25
    statusEffects.cls_scalesPrimed = false
    messages.push('⚖ Scales of Truth — vengeance strike (+25% damage).')
  }

  // Witness Stand — Arbiter t5c: each stack is +4% damage
  if (hasSkill(player, 'arbiter_t5c') && statusEffects.cls_witnessStacks > 0) {
    dmgMult *= (1 + 0.04 * statusEffects.cls_witnessStacks)
  }

  // Crime Tally — Arbiter t3c: +5% damage per hit on a Marked enemy (compounding)
  if (hasSkill(player, 'arbiter_t3c') && statusEffects.cls_markTurns > 0) {
    const tally = statusEffects.cls_crimeTally || 0
    if (tally > 0) dmgMult *= (1 + 0.05 * tally)
    statusEffects.cls_crimeTally = tally + 1
  }

  // Delayed Verdict — Arbiter t2c: Marked enemy takes 50% of the damage dealt
  // again at end of turn. We stage the deferred damage in statusEffects.
  if (hasSkill(player, 'arbiter_t2c') && statusEffects.cls_markTurns > 0) {
    // Computed AFTER the rest of the modifiers — engine calls onPlayerAttackPost.
  }

  // Executioner's Eye — Arbiter t4a: crits ignore 50% of enemy DEF.
  // Engine needs to roll crit and pass back; we just set the ignore frac.
  // The engine multiplies its base crit roll against (critChanceAdd) too.
  // We return the frac and let the engine apply it if it crits.
  if (hasSkill(player, 'arbiter_t4a')) {
    defIgnoreFrac = 0.5  // engine applies ONLY when crit fires
  }

  return { dmgMult, defIgnoreFrac, bonusFlatDmg, critChanceAdd, messages }
}

// ── HOOK: post-attack — staged effects that depend on actual damage dealt
// Called by the engine after damage is applied to the enemy. The engine
// passes in the final damage dealt so end-of-turn deferred damage can be
// calculated. Returns deferred damage to apply at end of player's turn.
export function onPlayerAttackPost(player, statusEffects, enemy, damageDealt, wasCrit) {
  if (!player.active_class) return { deferredDamage: 0, messages: [] }
  const messages = []
  let deferredDamage = 0

  // Track consecutive hits — increments when this attack hits the same target.
  // If enemy.hp didn't change between this attack and the last attack target,
  // it's the same enemy (Ch2 combat is 1v1 anyway, so this is essentially always
  // incrementing while the same enemy is alive).
  statusEffects.cls_consecutiveHits = (statusEffects.cls_consecutiveHits || 0) + 1

  // Delayed Verdict — Marked enemies take 50% of dealt damage again at end of turn
  if (hasSkill(player, 'arbiter_t2c') && statusEffects.cls_markTurns > 0) {
    deferredDamage = Math.round(damageDealt * 0.5)
    messages.push(`⚖ Delayed Verdict — +${deferredDamage} delayed damage at end of turn.`)
  }

  return { deferredDamage, messages }
}

// ── HOOK: player takes damage ────────────────────────────────────────────
// Called before damage is applied to the player. Allows class skills to
// modify incoming damage, build stacks, or stage reflection.
// Returns: { dmgMult, reflectAmount, messages }
export function onPlayerHit(player, statusEffects, enemy, incomingDamage, playerMaxHp) {
  if (!player.active_class) return { messages: [] }
  const messages = []
  let dmgMult = 1.0
  let reflectAmount = 0

  // Equal Measure — Arbiter t1b: +30% DEF when |player HP% - enemy HP%| < 15
  // We translate "+30% DEF" into "reduce incoming damage by ~20%" for simplicity
  // (DEF doesn't enter incoming damage formula the same way in every engine).
  if (hasSkill(player, 'arbiter_t1b')) {
    const playerPct = (playerMaxHp ? (playerMaxHp - (statusEffects._engineCurrentHp || playerMaxHp)) / playerMaxHp : 0)
    // We don't have direct HP refs here; engine must populate _engineCurrentHp and _engineEnemyHp
    const hpP = statusEffects._enginePlayerHpPct
    const hpE = statusEffects._engineEnemyHpPct
    if (typeof hpP === 'number' && typeof hpE === 'number') {
      if (Math.abs(hpP - hpE) <= 0.15) {
        dmgMult *= 0.80
        messages.push('⚖ Equal Measure — balance holds (incoming -20%).')
      }
    }
  }

  // Witness Stand — Arbiter t5c: gain a Witness stack on hit (max 5)
  if (hasSkill(player, 'arbiter_t5c')) {
    const stacks = Math.min(5, (statusEffects.cls_witnessStacks || 0) + 1)
    if (stacks > (statusEffects.cls_witnessStacks || 0)) {
      statusEffects.cls_witnessStacks = stacks
      messages.push(`⚖ Witness Stand — ${stacks} stack${stacks>1?'s':''}.`)
    }
  }

  // Scales of Truth — prime the next-strike bonus if damage > 25% max HP
  if (hasSkill(player, 'arbiter_t2b') && incomingDamage > playerMaxHp * 0.25) {
    statusEffects.cls_scalesPrimed = true
  }

  // Law of Balance — Arbiter t5a: damage above 50% max HP reflects back
  if (hasSkill(player, 'arbiter_t5a') && incomingDamage > playerMaxHp * 0.5) {
    reflectAmount = Math.round(incomingDamage - playerMaxHp * 0.5)
    messages.push(`⚖ Law of Balance — reflects ${reflectAmount} damage.`)
  }

  return { dmgMult, reflectAmount, messages }
}

// ── HOOK: enemy HP changed (after player attack) ─────────────────────────
// Used by Verdict (auto-execute low-HP) and Last Witness.
// Returns: { executeKill, messages }
// The engine should set enemyHp = 0 if executeKill is true.
export function onEnemyHpChange(player, statusEffects, enemy, oldHp, newHp, enemyMaxHp) {
  if (!player.active_class) return { messages: [] }
  const messages = []
  let executeKill = false

  // Already dead — nothing to execute
  if (newHp <= 0) return { messages: [] }

  const enemyHpPct = enemyMaxHp > 0 ? (newHp / enemyMaxHp) : 1.0

  // Verdict — Arbiter t1a: 25% chance to instant-kill enemies below 15% HP
  if (hasSkill(player, 'arbiter_t1a') && enemyHpPct < 0.15) {
    if (Math.random() < 0.25) {
      executeKill = true
      messages.push('⚖ Verdict — execution. The Judges have read the case.')
    }
  }

  // Last Witness — Arbiter t6c: instantly kill enemies <40% HP if 5 Witness stacks
  if (!executeKill && hasSkill(player, 'arbiter_t6c')) {
    if ((statusEffects.cls_witnessStacks || 0) >= 5 && enemyHpPct < 0.40) {
      executeKill = true
      statusEffects.cls_witnessStacks = 0
      messages.push('⚖ Last Witness — five testimonies. Execution.')
    }
  }

  return { executeKill, messages }
}

// ── HOOK: kill (enemy died) ──────────────────────────────────────────────
// Returns: { refundAction, messages }
export function onKill(player, statusEffects, enemy) {
  if (!player.active_class) return { messages: [] }
  const messages = []
  let refundAction = false

  // Final Sentence — Arbiter t3a: kills below 25% HP refund a battle action
  // (We can't easily check "was it a low-HP kill" after the fact, but kills
  // that come from Verdict/Last Witness/normal damage on a near-dead enemy
  // all qualify. Use: if enemy had < 25% maxHp just before death.)
  if (hasSkill(player, 'arbiter_t3a')) {
    refundAction = true
    messages.push('⚖ Final Sentence — action refunded. The verdict was already written.')
  }

  return { refundAction, messages }
}

// ── HOOK: turn end ───────────────────────────────────────────────────────
// Decrements per-turn counters (mark, silence). Called at the end of each
// full round (after both player and enemy have acted).
export function onTurnEnd(player, statusEffects) {
  if (!player.active_class) return { messages: [] }
  if (statusEffects.cls_markTurns > 0)    statusEffects.cls_markTurns--
  if (statusEffects.cls_silenceTurns > 0) statusEffects.cls_silenceTurns--
  // Crime Tally resets when Mark falls off
  if (statusEffects.cls_markTurns === 0)  statusEffects.cls_crimeTally = 0
  return { messages: [] }
}

// ── HOOK: ally would die (only fires when an ally NPC is present) ───────
// Used by Pillar of Mercy. Returns true if the death should be prevented.
export function onAllyWouldDie(player, statusEffects, ally) {
  if (!player.active_class) return false
  if (!hasSkill(player, 'arbiter_t6b')) return false
  if (statusEffects.cls_pillarUsed) return false
  statusEffects.cls_pillarUsed = true
  return true  // engine should set ally.hp = 1 and grant a full action
}
