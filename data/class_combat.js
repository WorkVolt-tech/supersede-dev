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
  const ac = player.active_class

  // ── Arbiter ─────────────────────────────────────────────────────────
  if (ac === 'arbiter') {
    if (hasSkill(player, 'arbiter_t1c')) {
      out.push({ id: 'sentence_mark', label: 'Sentence Mark', sub: 'Mark enemy for 3 turns',
        classColor: cls.color, available: !used['sentence_mark'] })
    }
    if (hasSkill(player, 'arbiter_t6a')) {
      out.push({ id: 'final_decree', label: 'Final Decree', sub: 'Silence enemy 3 turns',
        classColor: cls.color, available: !used['final_decree'] })
    }
  }

  // ── Wrathborn ───────────────────────────────────────────────────────
  if (ac === 'wrathborn') {
    if (hasSkill(player, 'wrathborn_t1c')) {
      out.push({ id: 'fury_slam', label: 'Fury Slam', sub: 'Heavy hit + Bleeding 3 turns',
        classColor: cls.color, available: !used['fury_slam'] })
    }
    if (hasSkill(player, 'wrathborn_t6a')) {
      out.push({ id: 'cataclysm', label: 'Cataclysm', sub: '3× dmg; costs all HP above 1',
        classColor: cls.color, available: !used['cataclysm'] })
    }
    if (hasSkill(player, 'wrathborn_t6b')) {
      out.push({ id: 'last_engine', label: 'Last Engine', sub: 'Drop to 1 HP, ATK = missing HP',
        classColor: cls.color, available: !used['last_engine'] })
    }
    if (hasSkill(player, 'wrathborn_t6c')) {
      out.push({ id: 'final_massacre', label: 'Final Massacre', sub: '3× strike on Bleeding enemy',
        classColor: cls.color, available: !used['final_massacre'] })
    }
  }

  // ── Monarch ─────────────────────────────────────────────────────────
  if (ac === 'monarch') {
    if (hasSkill(player, 'monarch_t4b')) {
      out.push({ id: 'summon_retainer', label: 'Summon Retainer', sub: 'Call 30 HP / 8 ATK ally for 5 turns',
        classColor: cls.color, available: !used['summon_retainer'] })
    }
    if (hasSkill(player, 'monarch_t6a')) {
      out.push({ id: 'the_throne', label: 'The Throne', sub: '4 turns of invulnerability',
        classColor: cls.color, available: !used['the_throne'] })
    }
    if (hasSkill(player, 'monarch_t6b')) {
      out.push({ id: 'mass_decree', label: 'Mass Decree', sub: 'Heal full + ATK +50% for 3 turns',
        classColor: cls.color, available: !used['mass_decree'] })
    }
    if (hasSkill(player, 'monarch_t6c')) {
      out.push({ id: 'conquest', label: 'Conquest', sub: 'Max Dominion + damage = stacks × 5',
        classColor: cls.color, available: !used['conquest'] })
    }
  }

  // ── Eclipse Walker ──────────────────────────────────────────────────
  // Stance toggles always show if the relevant stance node is unlocked. The
  // toggles are FREE (don't consume turn) — they just flip `cls_stance` and
  // re-render. The 'available' flag is true even after use.
  if (ac === 'eclipse_walker') {
    const stance = statusEffects.cls_stance || null
    if (hasSkill(player, 'eclipse_walker_t1a')) {
      out.push({ id: 'stance_solar', label: stance === 'solar' ? '☀ Solar (active)' : '☀ Solar',
        sub: 'Toggle Solar Stance: +20% DEF, regen',
        classColor: cls.color, available: stance !== 'solar' })
    }
    if (hasSkill(player, 'eclipse_walker_t1c')) {
      out.push({ id: 'stance_lunar', label: stance === 'lunar' ? '☾ Lunar (active)' : '☾ Lunar',
        sub: 'Toggle Lunar Stance: +15% SPD, +15% ATK',
        classColor: cls.color, available: stance !== 'lunar' })
    }
    if (hasSkill(player, 'eclipse_walker_t2b')) {
      out.push({ id: 'twilight_shift', label: 'Twilight Shift', sub: 'Switch + free strike',
        classColor: cls.color, available: !used['twilight_shift'] })
    }
    if (hasSkill(player, 'eclipse_walker_t6a')) {
      out.push({ id: 'totality', label: 'Totality', sub: '5-turn Eclipse mode',
        classColor: cls.color, available: !used['totality'] })
    }
    if (hasSkill(player, 'eclipse_walker_t6b')) {
      out.push({ id: 'dual_horizon', label: 'Dual Horizon', sub: '3 turns of both stances',
        classColor: cls.color, available: !used['dual_horizon'] })
    }
    if (hasSkill(player, 'eclipse_walker_t6c')) {
      out.push({ id: 'final_eclipse', label: 'Final Eclipse', sub: 'Switch + damage = switches × 30',
        classColor: cls.color, available: !used['final_eclipse'] })
    }
  }

  // ── Vessel ──────────────────────────────────────────────────────────
  if (ac === 'vessel') {
    if (hasSkill(player, 'vessel_t2c')) {
      out.push({ id: 'possession_surge', label: 'Possession Surge', sub: '+ATK = Corruption × 3 (3 turns)',
        classColor: cls.color, available: !used['possession_surge'] })
    }
    if (hasSkill(player, 'vessel_t6a')) {
      out.push({ id: 'true_vessel', label: 'True Vessel', sub: 'HP×2, ATK+50%, Corruption ×3 (one-way)',
        classColor: cls.color, available: !used['true_vessel'] })
    }
    if (hasSkill(player, 'vessel_t6b')) {
      out.push({ id: 'devour_soul', label: 'Devour Soul', sub: 'Instant-kill <30% HP, full heal',
        classColor: cls.color, available: !used['devour_soul'] })
    }
  }

  // ── Ghostblade ──────────────────────────────────────────────────────
  if (ac === 'ghostblade') {
    if (hasSkill(player, 'ghostblade_t2b')) {
      out.push({ id: 'ghost_step', label: 'Ghost Step', sub: '2 turns crit-immune + never miss',
        classColor: cls.color, available: !used['ghost_step'] })
    }
    if (hasSkill(player, 'ghostblade_t2c')) {
      out.push({ id: 'execution_thread', label: 'Execution Thread', sub: 'Mark enemy 5 turns (+30% dmg)',
        classColor: cls.color, available: !used['execution_thread'] })
    }
    if (hasSkill(player, 'ghostblade_t5b')) {
      out.push({ id: 'phase_strike', label: 'Phase Strike', sub: 'Burn 3 Phase: untargetable + ×3 next hit',
        classColor: cls.color, available: !used['phase_strike'] && (statusEffects.cls_phaseStacks || 0) >= 3 })
    }
    if (hasSkill(player, 'ghostblade_t6a')) {
      out.push({ id: 'void_flurry', label: 'Void Flurry', sub: '5 strikes at 60% each (-25% DEF)',
        classColor: cls.color, available: !used['void_flurry'] })
    }
    if (hasSkill(player, 'ghostblade_t6b')) {
      out.push({ id: 'shadowmeld', label: 'Shadowmeld', sub: '3 turns invisible, exit +100% next hit',
        classColor: cls.color, available: !used['shadowmeld'] })
    }
    if (hasSkill(player, 'ghostblade_t6c')) {
      out.push({ id: 'final_witness_gb', label: 'Final Witness', sub: 'Mark+<40% kills, else 40% maxHP dmg',
        classColor: cls.color, available: !used['final_witness_gb'] })
    }
  }

  // ── Ravager ─────────────────────────────────────────────────────────
  if (ac === 'ravager') {
    if (hasSkill(player, 'ravager_t5a')) {
      out.push({ id: 'murder_strike', label: 'Murder Strike', sub: 'Guaranteed crit + 50% DEF pierce',
        classColor: cls.color, available: !used['murder_strike'] })
    }
    if (hasSkill(player, 'ravager_t6a')) {
      out.push({ id: 'final_massacre_r', label: 'Final Massacre', sub: '3 strikes × 80% all auto-crit',
        classColor: cls.color, available: !used['final_massacre_r'] })
    }
    if (hasSkill(player, 'ravager_t6b')) {
      out.push({ id: 'bleeding_cascade', label: 'Bleeding Cascade', sub: 'Bleed ×2 stacks for 5 turns',
        classColor: cls.color, available: !used['bleeding_cascade'] })
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
  const messages = []
  const ac = player.active_class

  // Stance toggles for Eclipse Walker — free actions (don't consume the turn)
  if (skillId === 'stance_solar' || skillId === 'stance_lunar') {
    const newStance = skillId === 'stance_solar' ? 'solar' : 'lunar'
    const oldStance = statusEffects.cls_stance || null
    statusEffects.cls_stance = newStance
    statusEffects.cls_stanceSwitches = (statusEffects.cls_stanceSwitches || 0) + 1
    if (newStance === 'solar') {
      messages.push('☀ Solar Stance — +20% DEF, regen active.')
    } else {
      messages.push('☾ Lunar Stance — +15% SPD, +15% ATK active.')
    }
    // Stance Step (t1b): switching grants +5% damage on next attack
    if (hasSkill(player, 'eclipse_walker_t1b') && oldStance !== newStance) {
      statusEffects.cls_stanceStepBonus = true
    }
    // Eclipse Window (t3b): both stance bonuses for 1 turn after switching
    if (hasSkill(player, 'eclipse_walker_t3b') && oldStance && oldStance !== newStance) {
      statusEffects.cls_eclipseWindow = true
      messages.push('☀☾ Eclipse Window — both stances apply for 1 turn.')
    }
    // Balance Breaker (t4b): switching deals 10% max HP damage to enemy
    if (hasSkill(player, 'eclipse_walker_t4b') && oldStance && oldStance !== newStance) {
      // Engine reads cls_balanceBreaker on next syncBars and applies damage
      statusEffects.cls_balanceBreakerDmg = true
    }
    // Eclipse Echo (t5b): every 3rd switch is free — engine still consumes
    // it as not-a-turn, but we set a flag the engine can use later.
    return { messages, consumed: false }  // free action — no turn consumed
  }

  // All other actives are once-per-combat
  if (statusEffects.cls_used[skillId]) {
    return { messages: ['Class skill already used this combat.'], consumed: false }
  }
  statusEffects.cls_used[skillId] = true

  // ── Arbiter actives ──────────────────────────────────────────────────
  if (skillId === 'sentence_mark') {
    statusEffects.cls_markTurns = 3
    messages.push('⚖ Sentence Mark — the enemy is Marked for 3 turns.')
  } else if (skillId === 'final_decree') {
    statusEffects.cls_silenceTurns = 3
    statusEffects.enemyStunTurns = Math.max(statusEffects.enemyStunTurns || 0, 3)
    messages.push('⚖ Final Decree — silenced. 3 turns of action denied.')
  }

  // ── Wrathborn actives ────────────────────────────────────────────────
  else if (skillId === 'fury_slam') {
    // Heavy hit signal — engine reads cls_furyPending and applies on next strike.
    // Also pre-applies a Bleeding status that ticks for 3 turns at 5/turn.
    statusEffects.cls_bleedingTurns = 3
    statusEffects.cls_bleedingDmg = 5
    statusEffects.cls_furyPending = true
    messages.push('🩸 Fury Slam — bleeding applied. Your next attack hits harder.')
  } else if (skillId === 'cataclysm') {
    // Player drops HP to 1 and queues a 3× damage attack for next strike.
    // We can't change player HP from here, so we signal the engine via
    // cls_cataclysmReady. The engine should handle the HP drop + 3× modifier.
    statusEffects.cls_cataclysmReady = true
    messages.push('💥 Cataclysm — your blood feeds the strike. Next attack: 3× damage.')
  } else if (skillId === 'last_engine') {
    statusEffects.cls_lastEngineTurns = 3
    statusEffects.cls_lastEngineActive = true
    messages.push('⚙ Last Engine — you collapse to 1 HP. 3 turns of fury.')
  } else if (skillId === 'final_massacre') {
    // Hit 3× boosted by Bleeding stacks. Signals engine via cls_massacrePending.
    statusEffects.cls_massacrePending = true
    messages.push('🩸🩸🩸 Final Massacre — three strikes drink the wound.')
  }

  // ── Monarch actives ──────────────────────────────────────────────────
  else if (skillId === 'summon_retainer') {
    statusEffects.cls_retainerHp = 30
    statusEffects.cls_retainerAtk = 8
    statusEffects.cls_retainerTurns = 5
    messages.push('👑 Summon Retainer — a loyal soldier joins. 30 HP, 8 ATK, 5 turns.')
  } else if (skillId === 'the_throne') {
    statusEffects.cls_throneTurns = 4
    messages.push('👑 The Throne — for 4 turns, HP cannot drop below 1.')
  } else if (skillId === 'mass_decree') {
    statusEffects.cls_massDecree = true  // engine reads to apply heal + ATK
    statusEffects.playerATKBonus = (statusEffects.playerATKBonus || 0) + Math.round((player.atk || 5) * 0.5)
    statusEffects.cls_massDecreeTurns = 3
    messages.push('👑 Mass Decree — fully healed, ATK +50% for 3 turns.')
  } else if (skillId === 'conquest') {
    // Instantly max Dominion stacks, then deal damage = stacks × 5
    statusEffects.cls_dominionStacks = 10
    statusEffects.cls_conquestPending = true
    messages.push('👑 Conquest — dominion claimed. Dealing damage = stacks × 5.')
  }

  // ── Eclipse Walker actives ───────────────────────────────────────────
  else if (skillId === 'twilight_shift') {
    // Switch stance + free strike. Engine should perform a basic strike
    // after applying the new stance bonuses.
    const oldStance = statusEffects.cls_stance || null
    const newStance = oldStance === 'solar' ? 'lunar' : 'solar'
    statusEffects.cls_stance = newStance
    statusEffects.cls_stanceSwitches = (statusEffects.cls_stanceSwitches || 0) + 1
    statusEffects.cls_twilightShiftStrike = true
    messages.push(`☀☾ Twilight Shift — to ${newStance === 'solar' ? '☀ Solar' : '☾ Lunar'}, free strike.`)
  } else if (skillId === 'totality') {
    statusEffects.cls_totalityTurns = 5
    messages.push('☀☾ Totality — Eclipse mode. 5 turns: both stances, +50% all stats.')
  } else if (skillId === 'dual_horizon') {
    statusEffects.cls_dualHorizonTurns = 3
    messages.push('☀☾ Dual Horizon — both stance bonuses apply for 3 turns.')
  } else if (skillId === 'final_eclipse') {
    const oldStance = statusEffects.cls_stance || null
    const newStance = oldStance === 'solar' ? 'lunar' : 'solar'
    statusEffects.cls_stance = newStance
    const switches = statusEffects.cls_stanceSwitches || 0
    statusEffects.cls_finalEclipseDmg = switches * 30
    messages.push(`☀☾ Final Eclipse — ${switches} switches × 30 = ${switches * 30} damage.`)
  }

  // ── Vessel actives ───────────────────────────────────────────────────
  else if (skillId === 'possession_surge') {
    // Burn all Corruption stacks for +ATK
    const stacks = statusEffects.cls_corruptionStacks || 0
    statusEffects.cls_possessionSurgeTurns = 3
    statusEffects.cls_possessionSurgeATK = stacks * 3
    statusEffects.cls_corruptionStacks = 0
    messages.push(`👁 Possession Surge — burned ${stacks} stacks. +${stacks * 3} ATK for 3 turns.`)
  } else if (skillId === 'true_vessel') {
    // Permanent (combat-duration) transformation: HP×2, ATK +50%, Corruption ×3
    statusEffects.cls_trueVesselActive = true
    statusEffects.cls_corruptionMultiplier = 3
    messages.push('👁 True Vessel — the body breaks open. HP cap doubled, ATK +50%, corruption flows freely.')
  } else if (skillId === 'devour_soul') {
    // Signal — engine handles the kill + heal
    statusEffects.cls_devourSoulReady = true
    messages.push('👁 Devour Soul — you reach for what is left of them.')
  }

  // ── Ghostblade actives ───────────────────────────────────────────────
  else if (skillId === 'ghost_step') {
    statusEffects.cls_ghostStepTurns = 2
    messages.push('🗡 Ghost Step — for 2 turns: cannot be crit, your hits cannot miss.')
  } else if (skillId === 'execution_thread') {
    statusEffects.cls_executionMarkTurns = 5
    messages.push('🗡 Execution Thread — enemy marked for 5 turns. +30% damage.')
  } else if (skillId === 'phase_strike') {
    // Burn 3 Phase stacks for untargetable + ×3 next hit
    if ((statusEffects.cls_phaseStacks || 0) < 3) {
      return { messages: ['Not enough Phase stacks (need 3).'], consumed: false }
    }
    statusEffects.cls_phaseStacks -= 3
    statusEffects.cls_phaseUntargetableTurns = 1
    statusEffects.cls_phaseStrikeNext = true
    messages.push('🗡 Phase Strike — you vanish. Next strike: ×3 damage.')
  } else if (skillId === 'void_flurry') {
    statusEffects.cls_voidFlurryReady = true
    messages.push('🗡 Void Flurry — five strikes coming.')
  } else if (skillId === 'shadowmeld') {
    statusEffects.cls_shadowmeldTurns = 3
    statusEffects.cls_shadowmeldExit = true  // marks the buff for exit-hit on expiry
    messages.push('🗡 Shadowmeld — you disappear. 3 turns. Exit strike +100%.')
  } else if (skillId === 'final_witness_gb') {
    statusEffects.cls_finalWitnessReady = true
    messages.push('🗡 Final Witness — judgment is coming.')
  }

  // ── Ravager actives ──────────────────────────────────────────────────
  else if (skillId === 'murder_strike') {
    statusEffects.cls_murderStrikeReady = true
    messages.push('🩸 Murder Strike — guaranteed crit + DEF pierce on next strike.')
  } else if (skillId === 'final_massacre_r') {
    statusEffects.cls_finalMassacreRReady = true
    messages.push('🩸 Final Massacre — three crits coming.')
  } else if (skillId === 'bleeding_cascade') {
    statusEffects.cls_bleedingTurns = Math.max(statusEffects.cls_bleedingTurns || 0, 5)
    statusEffects.cls_bleedingDmg = (statusEffects.cls_bleedingDmg || 0) * 2 || 10
    messages.push('🩸 Bleeding Cascade — wounds tear open. ×2 stacks for 5 turns.')
  }

  return { messages, consumed: true }
}

// ── HOOK: combat start ──────────────────────────────────────────────────
// Called once when combat begins. Initializes per-combat counters and
// applies start-of-combat passives like Equal Sky.
export function onCombatStart(player, statusEffects) {
  if (!player.active_class) return { messages: [] }
  const messages = []
  const ac = player.active_class

  // Per-combat counters used across all classes
  statusEffects.cls_consecutiveHits = 0
  statusEffects.cls_lastTargetHp    = null
  statusEffects.cls_witnessStacks   = 0
  statusEffects.cls_markTurns       = 0
  statusEffects.cls_silenceTurns    = 0
  statusEffects.cls_scalesPrimed    = false
  statusEffects.cls_used            = {}
  statusEffects.cls_pillarUsed      = false
  // Wrathborn
  statusEffects.cls_bleedingTurns   = 0
  statusEffects.cls_bleedingDmg     = 0
  statusEffects.cls_dominionStacks  = 0  // (Monarch — also init'd here)
  statusEffects.cls_kills           = 0
  statusEffects.cls_furyPending     = false
  statusEffects.cls_cataclysmReady  = false
  statusEffects.cls_lastEngineTurns = 0
  statusEffects.cls_massacrePending = false
  statusEffects.cls_deathDoorUsed   = false
  // Monarch
  statusEffects.cls_witnessCourt    = 0  // separate from Arbiter's witness stacks
  statusEffects.cls_retainerHp      = 0
  statusEffects.cls_retainerAtk     = 0
  statusEffects.cls_retainerTurns   = 0
  statusEffects.cls_throneTurns     = 0
  statusEffects.cls_massDecreeTurns = 0
  statusEffects.cls_kingTurns       = 3  // King's Presence countdown
  statusEffects.cls_loyalGuardUsed  = false
  // Eclipse Walker
  statusEffects.cls_stance          = null
  statusEffects.cls_stanceSwitches  = 0
  statusEffects.cls_stanceStepBonus = false
  statusEffects.cls_eclipseWindow   = false
  statusEffects.cls_totalityTurns   = 0
  statusEffects.cls_dualHorizonTurns= 0
  statusEffects.cls_nightHunterDmg  = 0  // Lunar kill stacks
  // Vessel
  statusEffects.cls_corruptionStacks    = 0
  statusEffects.cls_corruptionGained    = 0  // total, for Inner Voice SP gates
  statusEffects.cls_corruptionMultiplier = 1
  statusEffects.cls_rotApplied          = false  // Festering Mark first-hit gate
  statusEffects.cls_possessionSurgeTurns = 0
  statusEffects.cls_possessionSurgeATK   = 0
  statusEffects.cls_trueVesselActive     = false
  statusEffects.cls_finalAwakeningUsed   = false
  statusEffects.cls_finalAwakeningTurns  = 0
  statusEffects.cls_eternalHungerUsedThisTurn = false
  // Ghostblade
  statusEffects.cls_phaseStacks         = 0
  statusEffects.cls_phaseUntargetableTurns = 0
  statusEffects.cls_phaseStrikeNext     = false
  statusEffects.cls_voidFlurryReady     = false
  statusEffects.cls_ghostStepTurns      = 0
  statusEffects.cls_executionMarkTurns  = 0
  statusEffects.cls_shadowmeldTurns     = 0
  statusEffects.cls_shadowmeldExit      = false
  statusEffects.cls_shadowmeldExitBonus = false
  statusEffects.cls_afterimageReady     = false
  statusEffects.cls_quickstepCounter    = 0
  statusEffects.cls_firstStrikeUsed     = false  // Phase Dash t1a +50% gate
  statusEffects.cls_finalWitnessReady   = false
  // Ravager
  statusEffects.cls_frenzyStacks        = 0
  statusEffects.cls_murderStrikeReady   = false
  statusEffects.cls_finalMassacreRReady = false
  statusEffects.cls_finalMassacreShots  = 0

  // Arbiter — Equal Sky: +5 SP at combat start
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
  if (!player.active_class) return { messages: [], dmgMult: 1.0, defIgnoreFrac: 0, bonusFlatDmg: 0, critChanceAdd: 0 }
  const messages = []
  let dmgMult       = 1.0
  let defIgnoreFrac = 0
  let bonusFlatDmg  = 0
  let critChanceAdd = 0
  const ac = player.active_class

  // ════════ Arbiter (existing) ═══════════════════════════════════════
  if (ac === 'arbiter') {
    // Judgment Chain — Arbiter t2a: +5% crit per consecutive hit (cap +30%)
    if (hasSkill(player, 'arbiter_t2a')) {
      const stacks = Math.min(6, statusEffects.cls_consecutiveHits || 0)
      if (stacks > 0) critChanceAdd += 0.05 * stacks
    }
    // Scales of Truth — Arbiter t2b
    if (hasSkill(player, 'arbiter_t2b') && statusEffects.cls_scalesPrimed) {
      dmgMult *= 1.25
      statusEffects.cls_scalesPrimed = false
      messages.push('⚖ Scales of Truth — vengeance strike (+25% damage).')
    }
    // Witness Stand — Arbiter t5c
    if (hasSkill(player, 'arbiter_t5c') && statusEffects.cls_witnessStacks > 0) {
      dmgMult *= (1 + 0.04 * statusEffects.cls_witnessStacks)
    }
    // Crime Tally — Arbiter t3c
    if (hasSkill(player, 'arbiter_t3c') && statusEffects.cls_markTurns > 0) {
      const tally = statusEffects.cls_crimeTally || 0
      if (tally > 0) dmgMult *= (1 + 0.05 * tally)
      statusEffects.cls_crimeTally = tally + 1
    }
    // Executioner's Eye — Arbiter t4a
    if (hasSkill(player, 'arbiter_t4a')) {
      defIgnoreFrac = 0.5
    }
  }

  // ════════ Wrathborn ════════════════════════════════════════════════
  if (ac === 'wrathborn') {
    // Rage Engine — t1a: +1% damage per 1% HP missing
    if (hasSkill(player, 'wrathborn_t1a')) {
      const hpPct = statusEffects._enginePlayerHpPct
      if (typeof hpPct === 'number') {
        const missing = (1 - hpPct) * 100  // 0-100
        dmgMult *= (1 + missing / 100)
      }
    }
    // Bloodrush II — t3b: +15% damage while Bloodrush is active
    if (hasSkill(player, 'wrathborn_t3b') && statusEffects.cls_bloodrushTurns > 0) {
      dmgMult *= 1.15
    }
    // Bone Crush — t3c: track crit -> reduce enemy DEF (handled in onPlayerAttackPost)
    // Fury Slam pending — t1c active hit modifier
    if (statusEffects.cls_furyPending) {
      dmgMult *= 1.6  // heavy-ish bonus
      statusEffects.cls_furyPending = false
      messages.push('🩸 Fury Slam strikes.')
    }
    // Cataclysm ready — t6a: 3× damage for next strike, costs all HP-1
    if (statusEffects.cls_cataclysmReady) {
      dmgMult *= 3.0
      statusEffects.cls_cataclysmReady = false
      statusEffects.cls_cataclysmAfterEffect = true  // engine reads to drop HP to 1
      messages.push('💥 Cataclysm fires.')
    }
    // Last Engine — t6b: ATK bonus = missing HP for 3 turns
    if (statusEffects.cls_lastEngineActive) {
      const hpPct = statusEffects._enginePlayerHpPct
      if (typeof hpPct === 'number') {
        const bonus = Math.round((1 - hpPct) * 100)
        bonusFlatDmg += bonus
      }
    }
    // Death's Door — t5a: at 1 HP, all damage doubled for 3 turns (once/battle)
    if (hasSkill(player, 'wrathborn_t5a') && !statusEffects.cls_deathDoorUsed) {
      const hpPct = statusEffects._enginePlayerHpPct
      if (typeof hpPct === 'number' && hpPct < 0.05) {
        statusEffects.cls_deathDoorUsed = true
        statusEffects.cls_deathDoorTurns = 3
        messages.push("☠ Death's Door — the body refuses to die. Damage doubled 3 turns.")
      }
    }
    if (statusEffects.cls_deathDoorTurns > 0) dmgMult *= 2.0
    // Final Massacre pending — t6c
    if (statusEffects.cls_massacrePending) {
      const bleedStacks = statusEffects.cls_bleedingDmg || 0
      dmgMult *= 3.0  // 3× hit; we approximate the "strike 3 times" as a single ×3
      bonusFlatDmg += bleedStacks * 5  // boosted by bleeding
      statusEffects.cls_massacrePending = false
      messages.push('🩸🩸🩸 Final Massacre — strike compounded by bleeding.')
    }
  }

  // ════════ Monarch ══════════════════════════════════════════════════
  if (ac === 'monarch') {
    // Command Aura — t1a: +10% damage above 50% HP
    if (hasSkill(player, 'monarch_t1a')) {
      const hpPct = statusEffects._enginePlayerHpPct
      if (typeof hpPct === 'number' && hpPct > 0.5) dmgMult *= 1.10
    }
    // Standing Order — t1b: Defend grants +15% ATK next strike (consumed here)
    if (statusEffects.cls_standingOrderBonus) {
      dmgMult *= 1.15
      statusEffects.cls_standingOrderBonus = false
      messages.push('👑 Standing Order — discipline pays.')
    }
    // Royal Blood — t5a: below 25% HP, ATK +30%
    if (hasSkill(player, 'monarch_t5a')) {
      const hpPct = statusEffects._enginePlayerHpPct
      if (typeof hpPct === 'number' && hpPct < 0.25) dmgMult *= 1.30
    }
    // Sovereign Will — t4a: alone (no retainer/ally) → +20% all stats
    if (hasSkill(player, 'monarch_t4a') && statusEffects.cls_retainerTurns <= 0) {
      dmgMult *= 1.20
    }
    // Court of Witnesses — t5b: stack damage (set in onPlayerHit on Defend)
    if (hasSkill(player, 'monarch_t5b') && (statusEffects.cls_witnessCourt || 0) > 0) {
      dmgMult *= (1 + 0.15 * statusEffects.cls_witnessCourt)
    }
    // Dominion — t2c: DEF reduction handled as defIgnoreFrac equivalent
    if (hasSkill(player, 'monarch_t2c') && statusEffects.cls_dominionStacks > 0) {
      const stacks = Math.min(10, statusEffects.cls_dominionStacks)
      const enemyDef = enemy.def || 0
      if (enemyDef > 0) bonusFlatDmg += Math.min(stacks, enemyDef)
    }
    // Conquest pending — t6c: damage = stacks × 5
    if (statusEffects.cls_conquestPending) {
      bonusFlatDmg += (statusEffects.cls_dominionStacks || 10) * 5
      statusEffects.cls_conquestPending = false
      messages.push('👑 Conquest fires.')
    }
    // Mass Decree — t6b: active ATK +50% buff applied via playerATKBonus already
  }

  // ════════ Eclipse Walker ═══════════════════════════════════════════
  if (ac === 'eclipse_walker') {
    const stance = statusEffects.cls_stance
    // Solar stance — defense, regen (regen happens in onTurnEnd)
    // Lunar stance — speed, +15% ATK
    const eclipseWindow = !!statusEffects.cls_eclipseWindow
    const totality = statusEffects.cls_totalityTurns > 0
    const dualHorizon = statusEffects.cls_dualHorizonTurns > 0
    const bothStances = eclipseWindow || totality || dualHorizon
    if (stance === 'lunar' || bothStances) {
      dmgMult *= 1.15  // Lunar +15% ATK
    }
    if (totality) {
      dmgMult *= 1.50  // Totality +50% all stats
    }
    // Stance Step — t1b
    if (statusEffects.cls_stanceStepBonus) {
      dmgMult *= 1.05
      statusEffects.cls_stanceStepBonus = false
      messages.push('☀☾ Stance Step — bonus damage.')
    }
    // Moonchaser — t2c: Lunar +10% crit chance
    if (hasSkill(player, 'eclipse_walker_t2c') && (stance === 'lunar' || bothStances)) {
      critChanceAdd += 0.10
    }
    // Lunar Court — t5c: Lunar crit bonus +50% (handled via crit multiplier in engine)
    // (engine already applies +50% on its standard crit; we boost again here)
    if (hasSkill(player, 'eclipse_walker_t5c') && (stance === 'lunar' || bothStances)) {
      statusEffects.cls_lunarCritBoost = true
    }
    // Night Hunter — t3c: stacking damage from Lunar kills
    if ((stance === 'lunar' || bothStances) && (statusEffects.cls_nightHunterDmg || 0) > 0) {
      dmgMult *= (1 + statusEffects.cls_nightHunterDmg / 100)
    }
    // Final Eclipse pending — t6c
    if (statusEffects.cls_finalEclipseDmg > 0) {
      bonusFlatDmg += statusEffects.cls_finalEclipseDmg
      statusEffects.cls_finalEclipseDmg = 0
      messages.push('☀☾ Final Eclipse strikes.')
    }
  }

  // ════════ Vessel ════════════════════════════════════════════════════
  if (ac === 'vessel') {
    // Whispers Below — t1a: +2% damage per Corruption stack
    if (hasSkill(player, 'vessel_t1a')) {
      const stacks = statusEffects.cls_corruptionStacks || 0
      if (stacks > 0) dmgMult *= (1 + 0.02 * stacks)
    }
    // Awakened Hunger — t1c: <30% HP, +20% damage (life-steal in post)
    if (hasSkill(player, 'vessel_t1c')) {
      const hpPct = statusEffects._enginePlayerHpPct
      if (typeof hpPct === 'number' && hpPct < 0.30) dmgMult *= 1.20
    }
    // Possession Surge active — +ATK = stacks × 3 for 3 turns
    if (statusEffects.cls_possessionSurgeTurns > 0) {
      bonusFlatDmg += statusEffects.cls_possessionSurgeATK || 0
    }
    // Mark of the Inside — t4c: 5+ Corruption → guaranteed crit
    if (hasSkill(player, 'vessel_t4c') && (statusEffects.cls_corruptionStacks || 0) >= 5) {
      critChanceAdd += 1.0  // guaranteed
    }
    // Whispers Strengthen — t5c: 5+ Corruption → +30% all stats
    if (hasSkill(player, 'vessel_t5c') && (statusEffects.cls_corruptionStacks || 0) >= 5) {
      dmgMult *= 1.30
    }
    // True Vessel active: +50% ATK
    if (statusEffects.cls_trueVesselActive) dmgMult *= 1.50
    // Final Awakening: doubles damage during 5-turn revive
    if (statusEffects.cls_finalAwakeningTurns > 0) dmgMult *= 2.0
  }

  // ════════ Ghostblade ═══════════════════════════════════════════════
  if (ac === 'ghostblade') {
    // Phase Dash — t1a: first basic strike each combat is +50%
    if (hasSkill(player, 'ghostblade_t1a') && !statusEffects.cls_firstStrikeUsed) {
      dmgMult *= 1.50
      statusEffects.cls_firstStrikeUsed = true
      messages.push('🗡 Phase Dash — first strike bonus.')
    }
    // Bladework — t2a: +5% damage per SPD point above 30
    if (hasSkill(player, 'ghostblade_t2a')) {
      const spd = player.speed || 0
      if (spd > 30) dmgMult *= (1 + (spd - 30) * 0.05)
    }
    // Silent Cut — t1c: +20% damage vs unmarked enemies
    if (hasSkill(player, 'ghostblade_t1c') && !(statusEffects.cls_executionMarkTurns > 0)) {
      dmgMult *= 1.20
    }
    // Execution Thread mark — t2c: +30% damage on marked
    if (statusEffects.cls_executionMarkTurns > 0) dmgMult *= 1.30
    // Death Thread — t3c: +20% crit on marked
    if (hasSkill(player, 'ghostblade_t3c') && statusEffects.cls_executionMarkTurns > 0) {
      critChanceAdd += 0.20
    }
    // Speed Demon — t4a: effective SPD doubles for crit calc (translate to flat +20% crit)
    if (hasSkill(player, 'ghostblade_t4a')) critChanceAdd += 0.20
    // Blood Tracker — t4c: marked + <30% HP → guaranteed crit
    if (hasSkill(player, 'ghostblade_t4c') && statusEffects.cls_executionMarkTurns > 0
        && typeof statusEffects._engineEnemyHpPct === 'number' && statusEffects._engineEnemyHpPct < 0.30) {
      critChanceAdd += 1.0
    }
    // Coup de Grâce — t5c: marked + <25% HP → +100% from basic strikes
    if (hasSkill(player, 'ghostblade_t5c') && statusEffects.cls_executionMarkTurns > 0
        && typeof statusEffects._engineEnemyHpPct === 'number' && statusEffects._engineEnemyHpPct < 0.25) {
      dmgMult *= 2.0
    }
    // Phase Strike: ×3 next hit
    if (statusEffects.cls_phaseStrikeNext) {
      dmgMult *= 3.0
      statusEffects.cls_phaseStrikeNext = false
      messages.push('🗡 Phase Strike — emergence cut.')
    }
    // Shadowmeld exit bonus: +100% on next attack after meld ends
    if (statusEffects.cls_shadowmeldExitBonus) {
      dmgMult *= 2.0
      statusEffects.cls_shadowmeldExitBonus = false
      messages.push('🗡 Shadowmeld — emergence strike (+100%).')
    }
    // Void Flurry: signal — engine reads cls_voidFlurryReady and resolves
    // as 5 hits at 60% each. We can't multi-hit from here, so we set a flag
    // the engine reads to execute the 5-strike sequence. For v1 we
    // approximate as one big hit: 5 * 60% = 300%, with 25% DEF ignored.
    if (statusEffects.cls_voidFlurryReady) {
      dmgMult *= 3.0
      defIgnoreFrac = Math.max(defIgnoreFrac, 0.25)
      statusEffects.cls_voidFlurryReady = false
      messages.push('🗡 Void Flurry — five cuts at once.')
    }
    // Final Witness: signal — engine reads cls_finalWitnessReady; we boost
    // dmgMult to 40% maxHp equivalent. Actual instant-kill check is in
    // onEnemyHpChange below.
    if (statusEffects.cls_finalWitnessReady) {
      // The big damage hit happens regardless of mark — instant kill is in HP change
      const eMaxHp = enemy.hp_max || enemy.hp || 100
      bonusFlatDmg += Math.round(eMaxHp * 0.40)
      messages.push('🗡 Final Witness — judgment strikes.')
    }
  }

  // ════════ Ravager ═══════════════════════════════════════════════════
  if (ac === 'ravager') {
    // Predator's Eye — t1c: enemies below 50% HP take +25%
    if (hasSkill(player, 'ravager_t1c')) {
      if (typeof statusEffects._engineEnemyHpPct === 'number' && statusEffects._engineEnemyHpPct < 0.50) {
        dmgMult *= 1.25
      }
    }
    // Savage Hit — t1a: 15% crit chance
    if (hasSkill(player, 'ravager_t1a')) critChanceAdd += 0.15
    // Brutal Edge — t2a: crits do +50% damage (×2.5 instead of ×2). Flagged for engine.
    if (hasSkill(player, 'ravager_t2a')) statusEffects.cls_brutalEdge = true
    // Frenzy — t3c: each stack +10% damage
    if (hasSkill(player, 'ravager_t3c') && (statusEffects.cls_frenzyStacks || 0) > 0) {
      dmgMult *= (1 + 0.10 * statusEffects.cls_frenzyStacks)
    }
    // Hemorrhage — t3b: enemies bleeding take +20% damage from all attacks
    if (hasSkill(player, 'ravager_t3b') && (statusEffects.cls_bleedingTurns || 0) > 0) {
      dmgMult *= 1.20
    }
    // Murder Strike active: guaranteed crit + 50% DEF pierce
    if (statusEffects.cls_murderStrikeReady) {
      critChanceAdd += 1.0
      defIgnoreFrac = Math.max(defIgnoreFrac, 0.50)
      statusEffects.cls_murderStrikeReady = false
      messages.push('🩸 Murder Strike — judgment without mercy.')
    }
    // Final Massacre: 3 strikes × 80%, all crits. Approximated as one big hit:
    // 3 * 80% = 240%, with critical bonus. Engine will see wasCrit=true.
    if (statusEffects.cls_finalMassacreRReady) {
      dmgMult *= 2.40
      critChanceAdd += 1.0  // guaranteed crit on this hit
      statusEffects.cls_finalMassacreRReady = false
      messages.push('🩸 Final Massacre — three killing blows in one.')
    }
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
  const ac = player.active_class

  statusEffects.cls_consecutiveHits = (statusEffects.cls_consecutiveHits || 0) + 1

  // ── Arbiter ──────────────────────────────────────────────────────────
  if (ac === 'arbiter') {
    if (hasSkill(player, 'arbiter_t2c') && statusEffects.cls_markTurns > 0) {
      deferredDamage = Math.round(damageDealt * 0.5)
      messages.push(`⚖ Delayed Verdict — +${deferredDamage} delayed damage.`)
    }
  }

  // ── Wrathborn ────────────────────────────────────────────────────────
  if (ac === 'wrathborn') {
    // Tearing Strike — t2c: basic hits apply Bleeding (3 turns, 4 dmg)
    if (hasSkill(player, 'wrathborn_t2c')) {
      if (statusEffects.cls_bleedingTurns < 3) {
        statusEffects.cls_bleedingTurns = 3
        statusEffects.cls_bleedingDmg = Math.max(statusEffects.cls_bleedingDmg || 0, 4)
      }
    }
    // Bone Crush — t3c: crits permanently reduce enemy DEF by 5 (stacks)
    if (wasCrit && hasSkill(player, 'wrathborn_t3c')) {
      enemy.def = Math.max(0, (enemy.def || 0) - 5)
      messages.push('🦴 Bone Crush — enemy DEF reduced 5.')
    }
    // Wild Blood — t5c: every 10 damage you deal reflects 3 as Bleeding
    if (hasSkill(player, 'wrathborn_t5c')) {
      const ticks = Math.floor(damageDealt / 10)
      if (ticks > 0) {
        statusEffects.cls_bleedingTurns = Math.max(statusEffects.cls_bleedingTurns || 0, 2)
        statusEffects.cls_bleedingDmg = (statusEffects.cls_bleedingDmg || 0) + ticks * 3
      }
    }
  }

  // ── Monarch ──────────────────────────────────────────────────────────
  // (no post-attack effects currently — Dominion stacks tick on turn end)

  let healToPlayer = 0

  // ── Vessel ──────────────────────────────────────────────────────────
  if (ac === 'vessel') {
    // Festering Mark — t3a: first hit on enemy applies Rot
    if (hasSkill(player, 'vessel_t3a') && !statusEffects.cls_rotApplied) {
      statusEffects.cls_rotApplied = true
      statusEffects.cls_rotTurns = 3
      statusEffects.cls_rotDmg = 8
      messages.push('👁 Festering Mark — rot takes hold.')
    }
    // Drain Strike — t2b: heal 8% of damage dealt
    if (hasSkill(player, 'vessel_t2b')) {
      healToPlayer += Math.round(damageDealt * 0.08)
    }
    // Awakened Hunger — t1c: at <30% HP, life-steal 10% of damage dealt
    if (hasSkill(player, 'vessel_t1c') && typeof statusEffects._enginePlayerHpPct === 'number' && statusEffects._enginePlayerHpPct < 0.30) {
      const steal = Math.round(damageDealt * 0.10)
      healToPlayer += steal
    }
    // Ravenous — t4b: life-steal doubled below 50% HP (applied retroactively)
    if (hasSkill(player, 'vessel_t4b') && typeof statusEffects._enginePlayerHpPct === 'number' && statusEffects._enginePlayerHpPct < 0.50) {
      healToPlayer *= 2
    }
    // Devour Soul ready: handled in engine (instant kill + full heal signal)
  }

  // ── Ghostblade ──────────────────────────────────────────────────────
  if (ac === 'ghostblade') {
    // Wind Cutter — t5a: basic strikes also apply Bleeding (3 turns, 5 dmg)
    if (hasSkill(player, 'ghostblade_t5a')) {
      statusEffects.cls_bleedingTurns = Math.max(statusEffects.cls_bleedingTurns || 0, 3)
      statusEffects.cls_bleedingDmg = Math.max(statusEffects.cls_bleedingDmg || 0, 5)
    }
    // Quickstep — t3a: every 3rd strike grants a free extra strike (signal engine)
    if (hasSkill(player, 'ghostblade_t3a')) {
      statusEffects.cls_quickstepCounter = (statusEffects.cls_quickstepCounter || 0) + 1
      if (statusEffects.cls_quickstepCounter >= 3) {
        statusEffects.cls_quickstepCounter = 0
        statusEffects.cls_quickstepFreeStrike = true  // engine reads + resolves
        messages.push('🗡 Quickstep — free strike chained.')
      }
    }
  }

  // ── Ravager ─────────────────────────────────────────────────────────
  if (ac === 'ravager') {
    // Tearing Strike — t1b: basic hits apply Bleeding
    if (hasSkill(player, 'ravager_t1b')) {
      const stacks = hasSkill(player, 'ravager_t2b')
        ? Math.min(3, (statusEffects.cls_bleedingStacks || 0) + 1)
        : 1
      statusEffects.cls_bleedingStacks = stacks
      statusEffects.cls_bleedingTurns = 3
      statusEffects.cls_bleedingDmg = 5 * stacks
    }
    // Wild Wound — t4b: 25% chance to deal instant bleed burst (×2 normal)
    if (hasSkill(player, 'ravager_t4b') && Math.random() < 0.25) {
      const burst = (statusEffects.cls_bleedingDmg || 5) * 2
      messages.push(`🩸 Wild Wound — instant bleed burst (${burst}).`)
      // Returned as deferred damage so engine applies immediately
      deferredDamage = (deferredDamage || 0) + burst
    }
    // Bone Crush — t4a: crits permanently reduce enemy DEF by 3
    if (wasCrit && hasSkill(player, 'ravager_t4a')) {
      enemy.def = Math.max(0, (enemy.def || 0) - 3)
      messages.push('🦴 Bone Crush — enemy DEF reduced 3.')
    }
    // Bloodlust — t3a: crits reduce skill cooldowns by 1
    if (wasCrit && hasSkill(player, 'ravager_t3a') && statusEffects.skillCooldowns) {
      for (const k of Object.keys(statusEffects.skillCooldowns)) {
        if (statusEffects.skillCooldowns[k] > 0) statusEffects.skillCooldowns[k]--
      }
    }
    // Apex Predator — t5c: at 5 Frenzy stacks, basic strikes also bleed
    if (hasSkill(player, 'ravager_t5c') && (statusEffects.cls_frenzyStacks || 0) >= 5) {
      statusEffects.cls_bleedingTurns = Math.max(statusEffects.cls_bleedingTurns || 0, 3)
      statusEffects.cls_bleedingDmg = Math.max(statusEffects.cls_bleedingDmg || 0, 4)
    }
  }

  return { deferredDamage, healToPlayer, messages }
}

// ── HOOK: player takes damage ────────────────────────────────────────────
// Called before damage is applied to the player. Allows class skills to
// modify incoming damage, build stacks, or stage reflection.
// Returns: { dmgMult, reflectAmount, messages }
export function onPlayerHit(player, statusEffects, enemy, incomingDamage, playerMaxHp) {
  if (!player.active_class) return { dmgMult: 1, reflectAmount: 0, messages: [] }
  const messages = []
  let dmgMult = 1.0
  let reflectAmount = 0
  const ac = player.active_class

  // ── Arbiter ──────────────────────────────────────────────────────────
  if (ac === 'arbiter') {
    if (hasSkill(player, 'arbiter_t1b')) {
      const hpP = statusEffects._enginePlayerHpPct
      const hpE = statusEffects._engineEnemyHpPct
      if (typeof hpP === 'number' && typeof hpE === 'number') {
        if (Math.abs(hpP - hpE) <= 0.15) {
          dmgMult *= 0.80
          messages.push('⚖ Equal Measure — balance holds (incoming -20%).')
        }
      }
    }
    if (hasSkill(player, 'arbiter_t5c')) {
      const stacks = Math.min(5, (statusEffects.cls_witnessStacks || 0) + 1)
      if (stacks > (statusEffects.cls_witnessStacks || 0)) {
        statusEffects.cls_witnessStacks = stacks
        messages.push(`⚖ Witness Stand — ${stacks} stack${stacks>1?'s':''}.`)
      }
    }
    if (hasSkill(player, 'arbiter_t2b') && incomingDamage > playerMaxHp * 0.25) {
      statusEffects.cls_scalesPrimed = true
    }
    if (hasSkill(player, 'arbiter_t5a') && incomingDamage > playerMaxHp * 0.5) {
      reflectAmount = Math.round(incomingDamage - playerMaxHp * 0.5)
      messages.push(`⚖ Law of Balance — reflects ${reflectAmount} damage.`)
    }
  }

  // ── Wrathborn ────────────────────────────────────────────────────────
  if (ac === 'wrathborn') {
    // Bloodrush — t1b: +15% SPD for 3 turns after taking damage
    if (hasSkill(player, 'wrathborn_t1b')) {
      statusEffects.cls_bloodrushTurns = 3
      statusEffects.playerSPDBonus = (statusEffects.playerSPDBonus || 0) + Math.round((player.spd || 5) * 0.15)
    }
    // Pain Threshold — t4a: cap >25% max HP hits at 25%
    if (hasSkill(player, 'wrathborn_t4a') && incomingDamage > playerMaxHp * 0.25) {
      const cap = Math.round(playerMaxHp * 0.25)
      dmgMult = cap / incomingDamage
      messages.push(`🩸 Pain Threshold — damage capped at ${cap}.`)
    }
    // Unbreakable Anger — t3a: immune to stun/silence below 40% HP
    if (hasSkill(player, 'wrathborn_t3a') && (statusEffects._enginePlayerHpPct || 1) < 0.40) {
      statusEffects.enemyStunResist = true  // hint for engine
    }
  }

  // ── Monarch ──────────────────────────────────────────────────────────
  if (ac === 'monarch') {
    // Loyal Guard — t2b: first killing blow per combat → 1 HP + DEF buff
    if (hasSkill(player, 'monarch_t2b') && !statusEffects.cls_loyalGuardUsed) {
      const wouldKill = incomingDamage >= (playerMaxHp * (statusEffects._enginePlayerHpPct || 1))
      if (wouldKill) {
        statusEffects.cls_loyalGuardUsed = true
        statusEffects.cls_loyalGuardTurns = 3
        statusEffects.playerDEFBonus = (statusEffects.playerDEFBonus || 0) + Math.round((player.def || 2) * 0.30)
        dmgMult = 0  // engine sets HP=1 separately via cls_loyalGuardSavedHp signal
        statusEffects.cls_loyalGuardSavedHp = 1
        messages.push('👑 Loyal Guard — you stand. 1 HP, +30% DEF for 3 turns.')
      }
    }
    // The Throne — t6a active: 4 turns of HP-cannot-drop-below-1
    if (statusEffects.cls_throneTurns > 0) {
      // Engine should detect cls_throneTurns and floor HP at 1
      // We don't modify dmgMult here; the engine clamps the HP after subtract.
    }
    // Iron Reign — t3c: enemies below 30% HP can't crit you
    if (hasSkill(player, 'monarch_t3c') && (statusEffects._engineEnemyHpPct || 1) < 0.30) {
      statusEffects.cls_critImmune = true
    }
    // Crown Tax — t5c: enemy crits grant +20% damage next attack
    // (engine signals via statusEffects._engineWasCrit when enemy crits)
    if (hasSkill(player, 'monarch_t5c') && statusEffects._engineWasCrit) {
      statusEffects.cls_crownTaxBonus = true
      statusEffects._engineWasCrit = false
    }
    // King's Presence — t1c: enemy ATK reduced 15% first 3 turns
    if (hasSkill(player, 'monarch_t1c') && statusEffects.cls_kingTurns > 0) {
      dmgMult *= 0.85
    }
  }

  // ── Eclipse Walker ───────────────────────────────────────────────────
  if (ac === 'eclipse_walker') {
    const stance = statusEffects.cls_stance
    const bothStances = statusEffects.cls_eclipseWindow || statusEffects.cls_totalityTurns > 0 || statusEffects.cls_dualHorizonTurns > 0
    // Solar Stance — t1a: +20% DEF (translated to -15% incoming)
    if (stance === 'solar' || bothStances) {
      dmgMult *= 0.85
    }
    // Totality — +50% all stats (defensive cut)
    if (statusEffects.cls_totalityTurns > 0) dmgMult *= 0.75
    // Sun's Mercy — t3a: first hit per turn halved in Solar Stance
    if (hasSkill(player, 'eclipse_walker_t3a') && (stance === 'solar' || bothStances)) {
      if (!statusEffects.cls_sunsMercyUsedThisTurn) {
        dmgMult *= 0.5
        statusEffects.cls_sunsMercyUsedThisTurn = true
        messages.push("☀ Sun's Mercy — first hit halved.")
      }
    }
    // Burning Ground — t4a: enemies hitting you in Solar take 5 reflect dmg
    if (hasSkill(player, 'eclipse_walker_t4a') && (stance === 'solar' || bothStances)) {
      reflectAmount += 5
    }
  }

  // ── Vessel ──────────────────────────────────────────────────────────
  if (ac === 'vessel') {
    // Build Corruption from taking damage (1 per hit, or 3 with True Vessel mult)
    if (hasSkill(player, 'vessel_t1a')) {
      const gain = 1 * (statusEffects.cls_corruptionMultiplier || 1)
      statusEffects.cls_corruptionStacks = Math.min(10, (statusEffects.cls_corruptionStacks || 0) + gain)
      statusEffects.cls_corruptionGained = (statusEffects.cls_corruptionGained || 0) + gain
      // Inner Voice — t3c: every 10 stacks total → free SP
      if (hasSkill(player, 'vessel_t3c')) {
        const prev = Math.floor(((statusEffects.cls_corruptionGained || 0) - gain) / 10)
        const now  = Math.floor((statusEffects.cls_corruptionGained || 0) / 10)
        if (now > prev) {
          statusEffects.cls_bonusSP = (statusEffects.cls_bonusSP || 0) + (now - prev)
          messages.push(`👁 Inner Voice — +${now - prev} SP from the depths.`)
        }
      }
    }
    // Shared Pain — t2a: 20% of damage taken reflects
    if (hasSkill(player, 'vessel_t2a')) {
      reflectAmount += Math.round(incomingDamage * 0.20)
    }
    // Shared Suffering — t4a: enemy hits you also damage them for 30% of their hit
    if (hasSkill(player, 'vessel_t4a')) {
      reflectAmount += Math.round(incomingDamage * 0.30)
    }
    // Eternal Hunger — t5b: below 25% HP, damage taken heals you (once per turn)
    if (hasSkill(player, 'vessel_t5b') && typeof statusEffects._enginePlayerHpPct === 'number' && statusEffects._enginePlayerHpPct < 0.25
        && !statusEffects.cls_eternalHungerUsedThisTurn) {
      statusEffects.cls_eternalHungerUsedThisTurn = true
      statusEffects.cls_eternalHungerHeal = incomingDamage  // engine reads + heals
      dmgMult = 0  // negate the damage; engine applies the heal instead
      messages.push(`👁 Eternal Hunger — pain becomes nourishment.`)
    }
    // Final Awakening — t6c: at 1 HP would-die → 5-turn revive (once)
    if (hasSkill(player, 'vessel_t6c') && !statusEffects.cls_finalAwakeningUsed) {
      const wouldKill = incomingDamage >= playerMaxHp * (statusEffects._enginePlayerHpPct || 1)
      if (wouldKill) {
        statusEffects.cls_finalAwakeningUsed = true
        statusEffects.cls_finalAwakeningTurns = 5
        statusEffects.cls_loyalGuardSavedHp = 1  // reuse engine 1-HP signal
        dmgMult = 0
        messages.push('👁 Final Awakening — death rejected. 5 turns of doubled damage.')
      }
    }
  }

  // ── Ghostblade ──────────────────────────────────────────────────────
  if (ac === 'ghostblade') {
    // Phase untargetable: full miss
    if (statusEffects.cls_phaseUntargetableTurns > 0) {
      dmgMult = 0
      messages.push('🗡 Phase — attack passes through.')
    }
    // Shadowmeld active: full miss
    if (statusEffects.cls_shadowmeldTurns > 0) {
      dmgMult = 0
      messages.push('🗡 Shadowmeld — they cannot find you.')
    }
    // Afterimage — t1b: 20% chance to fully evade
    if (hasSkill(player, 'ghostblade_t1b') && Math.random() < 0.20) {
      dmgMult = 0
      messages.push('🗡 Afterimage — decoy takes the hit.')
    }
    // Phantom Edge — t3b: gain a Phase stack on hit
    if (hasSkill(player, 'ghostblade_t3b')) {
      statusEffects.cls_phaseStacks = Math.min(5, (statusEffects.cls_phaseStacks || 0) + 1)
    }
    // Untouchable — t4b: at 5 stacks, -50% incoming, consume 1 on hit
    if (hasSkill(player, 'ghostblade_t4b') && (statusEffects.cls_phaseStacks || 0) >= 5) {
      dmgMult *= 0.5
      statusEffects.cls_phaseStacks -= 1
      messages.push('🗡 Untouchable — phase deflects half the damage.')
    }
    // Ghost Step active: no crit on you (engine handles via cls_critImmune)
    if (statusEffects.cls_ghostStepTurns > 0) statusEffects.cls_critImmune = true
  }

  // ── Ravager ─────────────────────────────────────────────────────────
  if (ac === 'ravager') {
    // No direct on-hit defensive — Ravager is offense-focused
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

  // Devour Soul — Vessel t6b: instant-kill if <30% HP (engine signals heal)
  if (!executeKill && statusEffects.cls_devourSoulReady && enemyHpPct < 0.30) {
    executeKill = true
    statusEffects.cls_devourSoulReady = false
    statusEffects.cls_devourSoulHealToFull = true  // engine restores HP
    messages.push('👁 Devour Soul — you consume what remains.')
  }
  // Clear flag if Devour was triggered but enemy wasn't low enough
  if (statusEffects.cls_devourSoulReady && enemyHpPct >= 0.30 && (statusEffects.cls_devourSoulCheckCount || 0) > 0) {
    statusEffects.cls_devourSoulReady = false
    messages.push('👁 Devour Soul — not weak enough. The hunger waits.')
  }
  statusEffects.cls_devourSoulCheckCount = (statusEffects.cls_devourSoulCheckCount || 0) + 1

  // Final Witness — Ghostblade t6c: kill if marked + <40% HP, else big damage hit
  if (!executeKill && statusEffects.cls_finalWitnessReady) {
    if (statusEffects.cls_executionMarkTurns > 0 && enemyHpPct < 0.40) {
      executeKill = true
      messages.push('🗡 Final Witness — execution.')
    }
    statusEffects.cls_finalWitnessReady = false  // consumed regardless
  }

  return { executeKill, messages }
}

// ── HOOK: kill (enemy died) ──────────────────────────────────────────────
// Returns: { refundAction, messages }
export function onKill(player, statusEffects, enemy) {
  if (!player.active_class) return { refundAction: false, messages: [] }
  const messages = []
  let refundAction = false
  const ac = player.active_class

  // Track kills this combat (used by Wrathborn Wild Frenzy + EW Night Hunter)
  statusEffects.cls_kills = (statusEffects.cls_kills || 0) + 1

  if (ac === 'arbiter') {
    // Final Sentence — t3a: refund action
    if (hasSkill(player, 'arbiter_t3a')) {
      refundAction = true
      messages.push('⚖ Final Sentence — the verdict was already written.')
    }
  }

  if (ac === 'wrathborn') {
    // Violence Cycle — t4b: kills refresh skill cooldowns
    if (hasSkill(player, 'wrathborn_t4b') && statusEffects.skillCooldowns) {
      for (const k of Object.keys(statusEffects.skillCooldowns)) {
        statusEffects.skillCooldowns[k] = 0
      }
      messages.push('🩸 Violence Cycle — cooldowns refreshed.')
    }
    // Wild Frenzy — t5b: +5% SPD per consecutive kill
    if (hasSkill(player, 'wrathborn_t5b')) {
      statusEffects.playerSPDBonus = (statusEffects.playerSPDBonus || 0) + Math.round((player.spd || 5) * 0.05)
    }
  }

  if (ac === 'eclipse_walker') {
    // Night Hunter — t3c: Lunar kills grant +10% damage stacking
    if (hasSkill(player, 'eclipse_walker_t3c') && statusEffects.cls_stance === 'lunar') {
      statusEffects.cls_nightHunterDmg = (statusEffects.cls_nightHunterDmg || 0) + 10
      messages.push('☾ Night Hunter — stack gained.')
    }
  }

  if (ac === 'vessel') {
    // Whispers Below — t1a: +2 Corruption on kill
    if (hasSkill(player, 'vessel_t1a')) {
      const gain = 2 * (statusEffects.cls_corruptionMultiplier || 1)
      statusEffects.cls_corruptionStacks = Math.min(10, (statusEffects.cls_corruptionStacks || 0) + gain)
      statusEffects.cls_corruptionGained = (statusEffects.cls_corruptionGained || 0) + gain
      messages.push(`👁 +${gain} Corruption from kill.`)
    }
    // Vampire's Hunger — t3b: kills restore 25% max HP (returned via healToPlayer)
    if (hasSkill(player, 'vessel_t3b')) {
      const maxHp = player.hp_max || player.max_hp || 100
      const heal = Math.round(maxHp * 0.25)
      statusEffects.cls_killHeal = (statusEffects.cls_killHeal || 0) + heal
      messages.push(`👁 Vampire's Hunger — restored ${heal} HP.`)
    }
  }

  if (ac === 'ravager') {
    // Frenzy — t3c: gain stack (max 5)
    if (hasSkill(player, 'ravager_t3c')) {
      const old = statusEffects.cls_frenzyStacks || 0
      statusEffects.cls_frenzyStacks = Math.min(5, old + 1)
      if (statusEffects.cls_frenzyStacks > old) {
        messages.push(`🩸 Frenzy — ${statusEffects.cls_frenzyStacks} stacks.`)
      }
      // Wild Frenzy — t4c: each stack also +5% SPD
      if (hasSkill(player, 'ravager_t4c') && statusEffects.cls_frenzyStacks > old) {
        statusEffects.playerSPDBonus = (statusEffects.playerSPDBonus || 0) + Math.round((player.speed || 5) * 0.05)
      }
    }
    // Hunter's Pulse — t2c: kills heal 15% max HP
    if (hasSkill(player, 'ravager_t2c')) {
      const maxHp = player.hp_max || player.max_hp || 100
      const heal = Math.round(maxHp * 0.15)
      statusEffects.cls_killHeal = (statusEffects.cls_killHeal || 0) + heal
      messages.push(`🩸 Hunter's Pulse — +${heal} HP.`)
    }
    // Slaughterborn — t6c: 3+ Frenzy stacks, kills trigger free basic strike (chains)
    // Engine reads cls_slaughterbornChain — signal only; engine resolves
    if (hasSkill(player, 'ravager_t6c') && (statusEffects.cls_frenzyStacks || 0) >= 3) {
      statusEffects.cls_slaughterbornChain = true
      messages.push('🩸 Slaughterborn — chain swing.')
    }
  }

  return { refundAction, messages }
}

// ── HOOK: turn end ───────────────────────────────────────────────────────
// Decrements per-turn counters (mark, silence). Called at the end of each
// full round (after both player and enemy have acted).
export function onTurnEnd(player, statusEffects) {
  if (!player.active_class) return { messages: [], damageToEnemy: 0, healToPlayer: 0 }
  const messages = []
  let damageToEnemy = 0
  let healToPlayer = 0
  const ac = player.active_class

  // ── Arbiter ──────────────────────────────────────────────────────────
  if (statusEffects.cls_markTurns > 0)    statusEffects.cls_markTurns--
  if (statusEffects.cls_silenceTurns > 0) statusEffects.cls_silenceTurns--
  if (statusEffects.cls_markTurns === 0)  statusEffects.cls_crimeTally = 0

  // ── Wrathborn ────────────────────────────────────────────────────────
  if (ac === 'wrathborn') {
    // Bleeding ticks — applies to enemy (Open Wound prevents enemy regen)
    if (statusEffects.cls_bleedingTurns > 0) {
      damageToEnemy += statusEffects.cls_bleedingDmg || 0
      statusEffects.cls_bleedingTurns--
      // Bleeding Cascade — t4c: also reduce enemy ATK 1 per tick
      if (hasSkill(player, 'wrathborn_t4c')) {
        statusEffects.enemyATKMult = (statusEffects.enemyATKMult || 1) * 0.95
      }
      if (damageToEnemy > 0) messages.push(`🩸 Bleeding — ${damageToEnemy} damage.`)
    }
    if (statusEffects.cls_bloodrushTurns > 0) statusEffects.cls_bloodrushTurns--
    if (statusEffects.cls_deathDoorTurns > 0) statusEffects.cls_deathDoorTurns--
    if (statusEffects.cls_lastEngineTurns > 0) {
      statusEffects.cls_lastEngineTurns--
      if (statusEffects.cls_lastEngineTurns === 0) statusEffects.cls_lastEngineActive = false
    }
  }

  // ── Monarch ──────────────────────────────────────────────────────────
  if (ac === 'monarch') {
    // King's Presence — t1c: countdown
    if (statusEffects.cls_kingTurns > 0) statusEffects.cls_kingTurns--
    // Dominion — t2c: enemy DEF stacks 1 per turn (2 with Wide Reign t4c)
    if (hasSkill(player, 'monarch_t2c')) {
      const inc = hasSkill(player, 'monarch_t4c') ? 2 : 1
      statusEffects.cls_dominionStacks = Math.min(10, (statusEffects.cls_dominionStacks || 0) + inc)
    }
    if (statusEffects.cls_throneTurns > 0)     statusEffects.cls_throneTurns--
    if (statusEffects.cls_massDecreeTurns > 0) statusEffects.cls_massDecreeTurns--
    if (statusEffects.cls_loyalGuardTurns > 0) statusEffects.cls_loyalGuardTurns--
    if (statusEffects.cls_retainerTurns > 0) {
      statusEffects.cls_retainerTurns--
      // Retainer attacks the enemy for cls_retainerAtk
      const retAtk = statusEffects.cls_retainerAtk || 0
      if (retAtk > 0 && statusEffects.cls_retainerHp > 0) {
        damageToEnemy += retAtk
        messages.push(`👑 Retainer strikes for ${retAtk}.`)
      }
      if (statusEffects.cls_retainerTurns === 0) {
        messages.push('👑 Retainer departs — duty served.')
      }
    }
  }

  // ── Eclipse Walker ───────────────────────────────────────────────────
  if (ac === 'eclipse_walker') {
    const stance = statusEffects.cls_stance
    const bothStances = !!statusEffects.cls_eclipseWindow || statusEffects.cls_totalityTurns > 0 || statusEffects.cls_dualHorizonTurns > 0
    // Solar regen — t1a: 3% HP per turn (5% with Daylight t2a)
    if ((stance === 'solar' || bothStances) && hasSkill(player, 'eclipse_walker_t1a')) {
      const pct = hasSkill(player, 'eclipse_walker_t2a') ? 0.05 : 0.03
      const maxHp = player.hp_max || player.hp || 100
      const heal = Math.round(maxHp * pct)
      healToPlayer += heal
      messages.push(`☀ Solar regen — +${heal} HP.`)
      // Solar Crown — t5a: also +2 SP
      if (hasSkill(player, 'eclipse_walker_t5a')) {
        statusEffects.cls_bonusSP = (statusEffects.cls_bonusSP || 0) + 2
      }
    }
    // Eclipse Window — t3b: 1 turn only, then expire
    if (statusEffects.cls_eclipseWindow) {
      statusEffects.cls_eclipseWindow = false
    }
    if (statusEffects.cls_totalityTurns > 0)     statusEffects.cls_totalityTurns--
    if (statusEffects.cls_dualHorizonTurns > 0)  statusEffects.cls_dualHorizonTurns--
    // Reset per-turn flags
    statusEffects.cls_sunsMercyUsedThisTurn = false
    // Balance Breaker damage signal — applied on next turn-end
    if (statusEffects.cls_balanceBreakerDmg) {
      const maxHp = player.hp_max || player.hp || 100
      const d = Math.round(maxHp * 0.10)
      damageToEnemy += d
      statusEffects.cls_balanceBreakerDmg = false
      messages.push(`☀☾ Balance Breaker — ${d} damage from the switch.`)
    }
  }

  // ── Vessel ──────────────────────────────────────────────────────────
  if (ac === 'vessel') {
    // Whispers Below — t1a: +1 Corruption per turn (3 with True Vessel)
    if (hasSkill(player, 'vessel_t1a')) {
      const gain = 1 * (statusEffects.cls_corruptionMultiplier || 1)
      statusEffects.cls_corruptionStacks = Math.min(10, (statusEffects.cls_corruptionStacks || 0) + gain)
      statusEffects.cls_corruptionGained = (statusEffects.cls_corruptionGained || 0) + gain
    }
    // Corrupted Flesh — t1b: 5% max HP regen per turn
    if (hasSkill(player, 'vessel_t1b')) {
      const maxHp = player.hp_max || player.max_hp || 100
      const heal = Math.round(maxHp * 0.05)
      healToPlayer += heal
      messages.push(`👁 Corrupted Flesh — +${heal} HP.`)
    }
    // Rot DoT tick (Festering Mark)
    if (statusEffects.cls_rotTurns > 0) {
      damageToEnemy += statusEffects.cls_rotDmg || 0
      statusEffects.cls_rotTurns--
      messages.push(`👁 Rot — ${statusEffects.cls_rotDmg} damage.`)
    }
    if (statusEffects.cls_possessionSurgeTurns > 0) statusEffects.cls_possessionSurgeTurns--
    if (statusEffects.cls_finalAwakeningTurns > 0)  statusEffects.cls_finalAwakeningTurns--
    // Reset per-turn flag
    statusEffects.cls_eternalHungerUsedThisTurn = false
  }

  // ── Ghostblade ──────────────────────────────────────────────────────
  if (ac === 'ghostblade') {
    if (statusEffects.cls_phaseUntargetableTurns > 0) statusEffects.cls_phaseUntargetableTurns--
    if (statusEffects.cls_ghostStepTurns > 0)         statusEffects.cls_ghostStepTurns--
    if (statusEffects.cls_executionMarkTurns > 0)     statusEffects.cls_executionMarkTurns--
    if (statusEffects.cls_shadowmeldTurns > 0) {
      statusEffects.cls_shadowmeldTurns--
      // +1 Phase stack per turn while in meld
      statusEffects.cls_phaseStacks = Math.min(5, (statusEffects.cls_phaseStacks || 0) + 1)
      if (statusEffects.cls_shadowmeldTurns === 0) {
        // Exit triggers the +100% next hit
        statusEffects.cls_shadowmeldExitBonus = true
        messages.push('🗡 Shadowmeld ends — emergence prepared.')
      }
    }
  }

  // ── Ravager ─────────────────────────────────────────────────────────
  // (Bleeding ticks already shared via Wrathborn's cls_bleedingTurns logic)
  // Ravager-specific bleed compounding: Hemorrhage / Predator's Wound /
  // Bleeding Cascade modifiers are applied in onPlayerAttack and via
  // cls_bleedingDmg directly.

  return { messages, damageToEnemy, healToPlayer }
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
