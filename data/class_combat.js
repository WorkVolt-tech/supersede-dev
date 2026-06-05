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
// Storage format in DB is 'classKey:nodeId' (e.g. 'arbiter:arbiter_t1a'),
// so we build the tag here.
export function hasSkill(player, skillNodeId) {
  if (!player.active_class) return false
  return isClassNodeUnlocked(player, player.active_class, skillNodeId)
}

// ── Helper: 24-hour cooldown check ──────────────────────────────────────
// Used by Dawnbringer First Light (t2c) and Mourning King Death Mark (t2c),
// which are once-per-24h real-time-gated skills. Takes an ISO timestamp
// string (the value stored in the DB column) and returns true if the skill
// is available (either never used, or last used more than 24h ago).
//
// Stored format: TIMESTAMPTZ from Supabase, which arrives as ISO 8601
// string. NULL/undefined = never used (always available).
function is24hReady(timestamp) {
  if (!timestamp) return true
  const last = new Date(timestamp).getTime()
  if (!Number.isFinite(last)) return true  // malformed → treat as ready
  const now = Date.now()
  const ONE_DAY_MS = 24 * 60 * 60 * 1000
  return (now - last) >= ONE_DAY_MS
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

  // ── Nullborn ────────────────────────────────────────────────────────
  if (ac === 'nullborn') {
    if (hasSkill(player, 'nullborn_t2c')) {
      out.push({ id: 'erase_mark', label: 'Erase Mark', sub: 'Erase enemy status, deal turns×4 damage',
        classColor: cls.color, available: !used['erase_mark'] })
    }
    if (hasSkill(player, 'nullborn_t5a')) {
      out.push({ id: 'singularity', label: 'Singularity', sub: 'Collapse Null × 30 dmg, ignore DEF',
        classColor: cls.color, available: !used['singularity'] && (statusEffects.cls_nullStacks || 0) > 0 })
    }
    if (hasSkill(player, 'nullborn_t5c')) {
      out.push({ id: 'final_erasure', label: 'Final Erasure', sub: 'Erase all buffs, deal their cumulative ATK',
        classColor: cls.color, available: !used['final_erasure'] })
    }
    if (hasSkill(player, 'nullborn_t6b')) {
      out.push({ id: 'read_error', label: 'Read Error', sub: '5 turns untargetable (can still attack)',
        classColor: cls.color, available: !used['read_error'] })
    }
  }

  // ── Error ───────────────────────────────────────────────────────────
  if (ac === 'error') {
    if (hasSkill(player, 'error_t2a')) {
      out.push({ id: 'caught_exception', label: 'Caught Exception', sub: 'Re-roll the Glitch this turn',
        classColor: cls.color, available: !used['caught_exception'] })
    }
    if (hasSkill(player, 'error_t2c')) {
      out.push({ id: 'buffer', label: 'Buffer', sub: statusEffects.cls_bufferStored ? 'RELEASE — next strike ×2' : 'Store next strike (release later for ×2)',
        classColor: cls.color, available: !used['buffer_release'] })
    }
    if (hasSkill(player, 'error_t3c')) {
      out.push({ id: 'try_catch', label: 'Try/Catch', sub: '3 turns of reflecting all damage',
        classColor: cls.color, available: !used['try_catch'] })
    }
    if (hasSkill(player, 'error_t4c')) {
      out.push({ id: 'kernel_panic', label: 'Kernel Panic', sub: 'Deal current HP as damage. Drop to 1 HP.',
        classColor: cls.color, available: !used['kernel_panic'] })
    }
    if (hasSkill(player, 'error_t5b')) {
      out.push({ id: 'bit_flip', label: 'Bit Flip', sub: 'Swap your HP with enemy HP',
        classColor: cls.color, available: !used['bit_flip'] })
    }
    if (hasSkill(player, 'error_t5c')) {
      out.push({ id: 'segfault', label: 'Segfault', sub: 'Next 3 strikes are crits +50%',
        classColor: cls.color, available: !used['segfault'] })
    }
    if (hasSkill(player, 'error_t6a')) {
      out.push({ id: 'compile_time_error', label: 'Compile-Time Error', sub: '3 turns: all stats × 3, no downgrades',
        classColor: cls.color, available: !used['compile_time_error'] })
    }
    if (hasSkill(player, 'error_t6b')) {
      out.push({ id: 'garbage_collection', label: 'Garbage Collection', sub: 'Clear all status, heal 50%, lose 10 SP',
        classColor: cls.color, available: !used['garbage_collection'] })
    }
    if (hasSkill(player, 'error_t6c')) {
      out.push({ id: 'fatal_exception', label: 'Fatal Exception', sub: 'Instant-kill <50% HP, else you die',
        classColor: cls.color, available: !used['fatal_exception'] })
    }
  }

  // ── Prime ───────────────────────────────────────────────────────────
  if (ac === 'prime') {
    if (hasSkill(player, 'prime_t6a')) {
      out.push({ id: 'apex_sovereign', label: 'Apex Sovereign', sub: 'Damage = stacked stat bonuses',
        classColor: cls.color, available: !used['apex_sovereign'] })
    }
    if (hasSkill(player, 'prime_t6b')) {
      out.push({ id: 'final_standard', label: 'Final Standard', sub: '3 turns of doubled action effects',
        classColor: cls.color, available: !used['final_standard'] })
    }
    if (hasSkill(player, 'prime_t6c')) {
      out.push({ id: 'throne_speaks', label: 'The Throne Speaks', sub: '5 turns of enemy stun',
        classColor: cls.color, available: !used['throne_speaks'] })
    }
  }

  // ── Bastion ─────────────────────────────────────────────────────────
  if (ac === 'bastion') {
    if (hasSkill(player, 'bastion_t5c')) {
      out.push({ id: 'anchor_pulse', label: 'Anchor Pulse', sub: 'Clear all status + heal 30% max HP',
        classColor: cls.color, available: !used['anchor_pulse'] })
    }
    if (hasSkill(player, 'bastion_t6a')) {
      out.push({ id: 'living_wall', label: 'Living Wall', sub: '3 turns immune, attacks add Bulwark',
        classColor: cls.color, available: !used['living_wall'] })
    }
    if (hasSkill(player, 'bastion_t6b')) {
      out.push({ id: 'final_riposte', label: 'Final Riposte', sub: 'Release Bulwark: stacks×15 + DEF×2',
        classColor: cls.color, available: !used['final_riposte'] && (statusEffects.cls_bulwarkStacks || 0) > 0 })
    }
  }

  // ── Dawnbringer ─────────────────────────────────────────────────────
  if (ac === 'dawnbringer') {
    if (hasSkill(player, 'dawnbringer_t2a')) {
      out.push({ id: 'healing_wave', label: 'Healing Wave', sub: 'Heal 30% + (Sun × 5%) max HP',
        classColor: cls.color, available: !used['healing_wave'] })
    }
    if (hasSkill(player, 'dawnbringer_t4b')) {
      out.push({ id: 'radiant_burst', label: 'Radiant Burst', sub: 'Sun × 8 dmg + cleanse self',
        classColor: cls.color, available: !used['radiant_burst'] })
    }
    if (hasSkill(player, 'dawnbringer_t6a')) {
      out.push({ id: 'dawnward_light', label: 'Dawnward Light', sub: '5 turns of life-steal strikes',
        classColor: cls.color, available: !used['dawnward_light'] })
    }
    if (hasSkill(player, 'dawnbringer_t6b')) {
      out.push({ id: 'dawnbreaker', label: 'Dawnbreaker', sub: '5× ATK radiant. Lose 50% Sun.',
        classColor: cls.color, available: !used['dawnbreaker'] })
    }
  }

  // ── Hollow ──────────────────────────────────────────────────────────
  if (ac === 'hollow') {
    if (hasSkill(player, 'hollow_t3a')) {
      out.push({ id: 'disappear', label: 'Disappear', sub: '2 turns untargetable (cannot attack)',
        classColor: cls.color, available: !used['disappear'] })
    }
    if (hasSkill(player, 'hollow_t5c')) {
      out.push({ id: 'all_that_remains', label: 'All That Remains', sub: 'Damage = missing HP × 2',
        classColor: cls.color, available: !used['all_that_remains'] })
    }
    if (hasSkill(player, 'hollow_t6a')) {
      out.push({ id: 'the_empty_one', label: 'The Empty One', sub: '4 turns untargetable, pierce all DEF',
        classColor: cls.color, available: !used['the_empty_one'] })
    }
    if (hasSkill(player, 'hollow_t6b')) {
      out.push({ id: 'survivors_end', label: "Survivor's End", sub: '+50% HP, Void × 20 dmg, drop to 1 HP',
        classColor: cls.color, available: !used['survivors_end'] })
    }
    if (hasSkill(player, 'hollow_t6c')) {
      out.push({ id: 'endless_hollow', label: 'Endless Hollow', sub: 'Damage = max HP. You drop to 1.',
        classColor: cls.color, available: !used['endless_hollow'] })
    }
  }

  // ── Devourer ────────────────────────────────────────────────────────
  if (ac === 'devourer') {
    if (hasSkill(player, 'devourer_t4c')) {
      out.push({ id: 'cleansing_devour', label: 'Cleansing Devour', sub: 'Eat all status, +15 dmg per',
        classColor: cls.color, available: !used['cleansing_devour'] })
    }
    if (hasSkill(player, 'devourer_t6a')) {
      out.push({ id: 'last_course', label: 'The Last Course', sub: 'Damage = max HP × 1.5. Costs all SP.',
        classColor: cls.color, available: !used['last_course'] })
    }
    if (hasSkill(player, 'devourer_t6b')) {
      out.push({ id: 'great_hunger', label: 'The Great Hunger', sub: '5 turns: Hunger=100, +50% dmg, no heals',
        classColor: cls.color, available: !used['great_hunger'] })
    }
  }

  // ── Mourning King ───────────────────────────────────────────────────
  if (ac === 'mourning_king') {
    if (hasSkill(player, 'mourning_king_t3a')) {
      out.push({ id: 'memory_of_steel', label: 'Memory of Steel', sub: 'Burn 5 Wake: next 3 strikes +50%',
        classColor: cls.color, available: !used['memory_of_steel'] && (statusEffects.cls_wakeStacks || 0) >= 5 })
    }
    if (hasSkill(player, 'mourning_king_t4c')) {
      out.push({ id: 'speak_to_dead', label: 'Speak to the Dead', sub: '5 turns of 25% chance extra strikes',
        classColor: cls.color, available: !used['speak_to_dead'] })
    }
    if (hasSkill(player, 'mourning_king_t6a')) {
      out.push({ id: 'all_crowns_worn', label: 'All Crowns Worn', sub: 'Spend ALL Wake stacks × 25',
        classColor: cls.color, available: !used['all_crowns_worn'] && (statusEffects.cls_wakeStacks || 0) > 0 })
    }
    if (hasSkill(player, 'mourning_king_t6b')) {
      out.push({ id: 'last_mercy', label: 'Last Mercy', sub: 'Heal enemy to full, mark for execute',
        classColor: cls.color, available: !used['last_mercy'] })
    }
  }

  // ── Chimera ─────────────────────────────────────────────────────────
  if (ac === 'chimera') {
    const currentForm = statusEffects.cls_chimeraForm || 'beast'
    const cd = statusEffects.cls_shiftCooldown || 0
    if (hasSkill(player, 'chimera_t2a') && currentForm !== 'beast') {
      out.push({ id: 'shift_beast', label: 'Shift: Beast', sub: cd > 0 ? `(cooldown ${cd})` : 'Switch to Beast form (free)',
        classColor: cls.color, available: cd === 0 })
    }
    if (hasSkill(player, 'chimera_t2b') && currentForm !== 'coil') {
      out.push({ id: 'shift_coil', label: 'Shift: Coil', sub: cd > 0 ? `(cooldown ${cd})` : 'Switch to Coil form (free)',
        classColor: cls.color, available: cd === 0 })
    }
    if (hasSkill(player, 'chimera_t2c') && currentForm !== 'storm') {
      out.push({ id: 'shift_storm', label: 'Shift: Storm', sub: cd > 0 ? `(cooldown ${cd})` : 'Switch to Storm form (free)',
        classColor: cls.color, available: cd === 0 })
    }
    if (hasSkill(player, 'chimera_t6a')) {
      out.push({ id: 'true_beast', label: 'True Beast', sub: '3 turns Beast +50% damage',
        classColor: cls.color, available: !used['true_beast'] })
    }
    if (hasSkill(player, 'chimera_t6b')) {
      out.push({ id: 'eternal_coil', label: 'Eternal Coil', sub: '3 turns Coil, damage cap 20% max HP/hit',
        classColor: cls.color, available: !used['eternal_coil'] })
    }
    if (hasSkill(player, 'chimera_t6c')) {
      out.push({ id: 'stormlord', label: 'Stormlord', sub: '3 turns ALL form bonuses simultaneously',
        classColor: cls.color, available: !used['stormlord'] })
    }
  }

  // ── Unwritten ───────────────────────────────────────────────────────
  if (ac === 'unwritten') {
    if (hasSkill(player, 'unwritten_t1a')) {
      out.push({ id: 'erasure', label: 'Erasure', sub: 'Undo the last hit you took',
        classColor: cls.color, available: !used['erasure'] && (statusEffects.cls_lastDamageTaken || 0) > 0 })
    }
    if (hasSkill(player, 'unwritten_t1b')) {
      out.push({ id: 'skip', label: 'Skip', sub: 'Enemy skips their next turn',
        classColor: cls.color, available: !used['skip'] })
    }
    if (hasSkill(player, 'unwritten_t3a')) {
      out.push({ id: 'disowned_hit', label: 'Disowned Hit', sub: 'Undo your last strike, +2 Absence',
        classColor: cls.color, available: !used['disowned_hit'] && (statusEffects.cls_lastStrikeDamage || 0) > 0 })
    }
    if (hasSkill(player, 'unwritten_t4b')) {
      out.push({ id: 'the_unmoved', label: 'The Unmoved', sub: '2 turns of enemy paralysis',
        classColor: cls.color, available: !used['the_unmoved'] })
    }
    if (hasSkill(player, 'unwritten_t5b')) {
      out.push({ id: 'bury_the_hour', label: 'Bury the Hour', sub: 'Rewind combat 3 turns (placeholder)',
        classColor: cls.color, available: !used['bury_the_hour'] })
    }
    if (hasSkill(player, 'unwritten_t6a')) {
      out.push({ id: 'no_such_person', label: 'No Such Person', sub: '5 turns immune + delayed strike',
        classColor: cls.color, available: !used['no_such_person'] })
    }
    if (hasSkill(player, 'unwritten_t6b')) {
      out.push({ id: 'long_silence', label: 'The Long Silence', sub: '5 turns enemy cannot act',
        classColor: cls.color, available: !used['long_silence'] })
    }
    if (hasSkill(player, 'unwritten_t6c')) {
      out.push({ id: 'all_written_out', label: 'All Written Out', sub: 'Erase all enemy skills (placeholder)',
        classColor: cls.color, available: !used['all_written_out'] })
    }
  }

  // ── Oathbreaker ─────────────────────────────────────────────────────
  if (ac === 'oathbreaker') {
    const currentOath = statusEffects.cls_currentOath || null
    if (hasSkill(player, 'oathbreaker_t2a') && currentOath === 'fury') {
      out.push({ id: 'break_fury', label: 'Break: Fury', sub: 'Burn oath for damage × turns held',
        classColor: cls.color, available: !used['break_fury'] })
    }
    if (hasSkill(player, 'oathbreaker_t2b') && currentOath === 'wall') {
      out.push({ id: 'break_wall', label: 'Break: Wall', sub: 'Burn oath for heal × turns held',
        classColor: cls.color, available: !used['break_wall'] })
    }
    if (hasSkill(player, 'oathbreaker_t2c') && currentOath === 'hunt') {
      out.push({ id: 'break_hunt', label: 'Break: Hunt', sub: 'Burn oath: next strike guaranteed crit + pierce',
        classColor: cls.color, available: !used['break_hunt'] })
    }
    // Old Anger: re-swear Fury at half duration
    if (hasSkill(player, 'oathbreaker_t5a') && statusEffects.cls_furyBroken && !currentOath) {
      out.push({ id: 'reswear_fury', label: 'Re-swear: Fury', sub: 'Weaker Fury (+10% damage only)',
        classColor: cls.color, available: !used['reswear_fury'] })
    }
    if (hasSkill(player, 'oathbreaker_t6a')) {
      out.push({ id: 'final_oath_wrath', label: 'Final Oath: Wrath', sub: 'All oaths + break = (turns × 75)',
        classColor: cls.color, available: !used['final_oath_wrath'] })
    }
    if (hasSkill(player, 'oathbreaker_t6b')) {
      out.push({ id: 'final_oath_sanctuary', label: 'Final Oath: Sanctuary', sub: 'Heal to full, cleanse, +50 DEF 5t',
        classColor: cls.color, available: !used['final_oath_sanctuary'] })
    }
    if (hasSkill(player, 'oathbreaker_t6c')) {
      out.push({ id: 'final_oath_hunt', label: 'Final Oath: Hunt', sub: 'Next 5 strikes ×2, pierce, all crit',
        classColor: cls.color, available: !used['final_oath_hunt'] })
    }
  }

  // ── Silent Judge ────────────────────────────────────────────────────
  if (ac === 'silent_judge') {
    if (hasSkill(player, 'silent_judge_t2c')) {
      const marks = statusEffects.cls_verdictMarks || 0
      out.push({ id: 'render_verdict', label: 'Render Verdict', sub: `Consume ${marks} marks × 30 dmg`,
        classColor: cls.color, available: !used['render_verdict'] && marks > 0 })
    }
    if (hasSkill(player, 'silent_judge_t4b')) {
      out.push({ id: 'quiet_court', label: 'The Quiet Court', sub: '3 turns of status immunity',
        classColor: cls.color, available: !used['quiet_court'] })
    }
    if (hasSkill(player, 'silent_judge_t5b')) {
      const marks = statusEffects.cls_verdictMarks || 0
      out.push({ id: 'court_adjourned', label: 'Court Adjourned', sub: marks >= 5 ? 'Consume 5 marks: enemy skips 3 turns' : 'Need 5 marks',
        classColor: cls.color, available: !used['court_adjourned'] && marks >= 5 })
    }
    if (hasSkill(player, 'silent_judge_t6a')) {
      out.push({ id: 'eyes_of_equilibrium', label: 'Eyes of Equilibrium', sub: '5 turns: +3 marks/strike, -50% incoming',
        classColor: cls.color, available: !used['eyes_of_equilibrium'] })
    }
    if (hasSkill(player, 'silent_judge_t6b')) {
      const marks = statusEffects.cls_verdictMarks || 0
      out.push({ id: 'silent_court', label: 'The Silent Court', sub: marks > 0 ? 'Consume all marks: 5-turn stun + ×2 dmg' : 'Need marks',
        classColor: cls.color, available: !used['silent_court'] && marks > 0 })
    }
    if (hasSkill(player, 'silent_judge_t6c')) {
      const marks = statusEffects.cls_verdictMarks || 0
      out.push({ id: 'final_verdict_sj', label: 'Final Verdict', sub: marks > 0 ? `${marks}×50 + 15% max HP` : 'Need marks',
        classColor: cls.color, available: !used['final_verdict_sj'] && marks > 0 })
    }
  }

  // ── Dreadnought ─────────────────────────────────────────────────────
  if (ac === 'dreadnought') {
    if (hasSkill(player, 'dreadnought_t2c')) {
      out.push({ id: 'inexorable', label: 'Inexorable', sub: 'Cleanse + stun enemy 1 turn',
        classColor: cls.color, available: !used['inexorable'] })
    }
    if (hasSkill(player, 'dreadnought_t5c')) {
      out.push({ id: 'one_step_more', label: 'One Step More', sub: '3 turns immune; end = 3 × ATK dmg',
        classColor: cls.color, available: !used['one_step_more'] })
    }
    if (hasSkill(player, 'dreadnought_t6a')) {
      const armor = statusEffects.cls_armorStacks || 0
      out.push({ id: 'hammer_falls', label: 'The Hammer Falls', sub: `Burn ${armor} Armor: ${armor*25} + max HP×50%`,
        classColor: cls.color, available: !used['hammer_falls'] && armor > 0 })
    }
    if (hasSkill(player, 'dreadnought_t6b')) {
      out.push({ id: 'walking_tomb', label: 'Walking Tomb', sub: '5 turns cannot die. End: +20 Armor.',
        classColor: cls.color, available: !used['walking_tomb'] })
    }
    if (hasSkill(player, 'dreadnought_t6c')) {
      out.push({ id: 'the_inevitable', label: 'The Inevitable', sub: '5 turns enemy stunned. Strikes = max HP×25%.',
        classColor: cls.color, available: !used['the_inevitable'] })
    }
  }

  // ── Abyss Walker ────────────────────────────────────────────────────
  if (ac === 'abyss_walker') {
    if (hasSkill(player, 'abyss_walker_t1c')) {
      out.push({ id: 'anchor_line', label: 'Anchor Line', sub: '-3 Depth (once/combat)',
        classColor: cls.color, available: !used['anchor_line'] && (statusEffects.cls_depth || 0) >= 3 })
    }
    if (hasSkill(player, 'abyss_walker_t2c')) {
      out.push({ id: 'climb', label: 'Climb', sub: '-1 Depth/turn for 3 turns',
        classColor: cls.color, available: !used['climb'] })
    }
    if (hasSkill(player, 'abyss_walker_t3c')) {
      out.push({ id: 'surface_memory', label: 'Surface Memory', sub: 'Set Depth to 0 (once/combat)',
        classColor: cls.color, available: !used['surface_memory'] })
    }
    if (hasSkill(player, 'abyss_walker_t6a')) {
      out.push({ id: 'hollow_sea', label: 'The Hollow Sea', sub: '5 turns: max HP×25%/hit, +100% incoming',
        classColor: cls.color, available: !used['hollow_sea'] })
    }
    if (hasSkill(player, 'abyss_walker_t6b')) {
      out.push({ id: 'drowned', label: 'Drowned', sub: 'Set enemy 10 Drown × 5 turns',
        classColor: cls.color, available: !used['drowned'] })
    }
    if (hasSkill(player, 'abyss_walker_t6c')) {
      out.push({ id: 'return_from_below', label: 'Return From Below', sub: 'Full heal + Depth 0',
        classColor: cls.color, available: !used['return_from_below'] })
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

  // ── Nullborn actives ─────────────────────────────────────────────────
  else if (skillId === 'erase_mark') {
    // Find a current enemy status effect with turn count; erase + deal damage
    // = (turn count × 4). Common status fields the engine tracks: burnTurns,
    // poisonTurns, bleedingTurns, enemyStunTurns. We pick the first nonzero.
    const candidates = ['burnTurns', 'poisonTurns', 'cls_bleedingTurns', 'enemyStunTurns', 'cls_rotTurns']
    let erased = null, turns = 0
    for (const k of candidates) {
      if ((statusEffects[k] || 0) > 0) { erased = k; turns = statusEffects[k]; statusEffects[k] = 0; break }
    }
    if (erased) {
      statusEffects.cls_eraseMarkDamage = turns * 4
      messages.push(`✕ Erase Mark — ${erased.replace(/Turns$/,'').replace(/^cls_/,'')} erased. +${turns * 4} damage.`)
    } else {
      messages.push('✕ Erase Mark — nothing to erase. The strike lands flat.')
    }
  } else if (skillId === 'singularity') {
    const stacks = statusEffects.cls_nullStacks || 0
    statusEffects.cls_singularityDamage = stacks * 30
    statusEffects.cls_nullStacks = 0
    messages.push(`✕ Singularity — ${stacks} Null collapse into ${stacks * 30} damage.`)
  } else if (skillId === 'final_erasure') {
    // Erase ALL enemy buffs/passives. We approximate by stripping common
    // boost fields: enemyATKMult, enemy.def, etc. The damage is approximated
    // as enemy.atk × 2 (their cumulative force).
    statusEffects.enemyATKMult = 1.0
    statusEffects.cls_finalErasureDamage = (enemy.atk || 20) * 2
    messages.push(`✕ Final Erasure — all enemy buffs erased. +${statusEffects.cls_finalErasureDamage} damage.`)
  } else if (skillId === 'read_error') {
    statusEffects.cls_readErrorTurns = 5
    messages.push('✕ Read Error — the System cannot find you. 5 turns untargetable.')
  }

  // ── Error actives ────────────────────────────────────────────────────
  else if (skillId === 'caught_exception') {
    // Re-roll the Glitch this turn — engine reads cls_glitchRerollPending
    statusEffects.cls_glitchRerollPending = true
    messages.push('⚠ Caught Exception — glitch re-rolling.')
  } else if (skillId === 'buffer') {
    if (statusEffects.cls_bufferStored) {
      // Release: next strike gets ×2
      statusEffects.cls_bufferRelease = true
      statusEffects.cls_bufferStored = false
      statusEffects.cls_used['buffer_release'] = true  // allow re-trigger of cycle
      messages.push('⚠ Buffer released — next strike ×2.')
    } else {
      // Store
      statusEffects.cls_bufferStored = true
      statusEffects.cls_used['buffer'] = false  // allow release
      messages.push('⚠ Buffer stored — release on a future turn.')
      return { messages, consumed: false }  // doesn't burn the turn
    }
  } else if (skillId === 'try_catch') {
    statusEffects.cls_tryCatchTurns = 3
    messages.push('⚠ Try/Catch — 3 turns of reflection.')
  } else if (skillId === 'kernel_panic') {
    statusEffects.cls_kernelPanicReady = true
    messages.push('⚠ Kernel Panic — deal current HP as damage. Brace for the cost.')
  } else if (skillId === 'bit_flip') {
    statusEffects.cls_bitFlipReady = true
    messages.push('⚠ Bit Flip — HP swap incoming on next sync.')
  } else if (skillId === 'segfault') {
    statusEffects.cls_segfaultStrikes = 3
    messages.push('⚠ Segfault — next 3 strikes are crits +50%.')
  } else if (skillId === 'compile_time_error') {
    statusEffects.cls_compileTimeErrorTurns = 3
    messages.push('⚠ Compile-Time Error — 3 turns of all stats × 3.')
  } else if (skillId === 'garbage_collection') {
    // Clear all known status effects on player, heal, lose SP
    const clearFields = ['burnTurns','poisonTurns','cls_bleedingTurns','enemyStunTurns','statusEffects'].filter(k => k in statusEffects)
    for (const k of clearFields) statusEffects[k] = 0
    statusEffects.cls_garbageCollectionHeal = true
    statusEffects.cls_bonusSP = (statusEffects.cls_bonusSP || 0) - 10
    messages.push('⚠ Garbage Collection — status cleared, heal triggered, -10 SP.')
  } else if (skillId === 'fatal_exception') {
    statusEffects.cls_fatalExceptionReady = true
    messages.push('⚠ Fatal Exception — execute or die.')
  }

  // ── Prime actives ────────────────────────────────────────────────────
  else if (skillId === 'apex_sovereign') {
    const total = (statusEffects.playerATKBonus || 0)
                + (statusEffects.playerDEFBonus || 0)
                + (statusEffects.playerSPDBonus || 0)
    statusEffects.cls_apexSovereignDamage = total
    messages.push(`👑 Apex Sovereign — strike with ${total} stored damage.`)
  } else if (skillId === 'final_standard') {
    statusEffects.cls_finalStandardTurns = 3
    messages.push('👑 Final Standard — 3 turns of doubled actions.')
  } else if (skillId === 'throne_speaks') {
    statusEffects.cls_throneSpeaksTurns = 5
    statusEffects.enemyStunTurns = Math.max(statusEffects.enemyStunTurns || 0, 5)
    messages.push('👑 The Throne Speaks — 5 turns. No one moves but you.')
  }

  // ── Bastion actives ──────────────────────────────────────────────────
  else if (skillId === 'anchor_pulse') {
    // Clear all status on player AND enemy. Heal 30% max HP.
    const clearFields = ['burnTurns', 'poisonTurns', 'cls_bleedingTurns',
                         'enemyStunTurns', 'cls_rotTurns', 'cls_markTurns',
                         'cls_silenceTurns']
    for (const k of clearFields) if (statusEffects[k]) statusEffects[k] = 0
    const maxHp = player.hp_max || player.max_hp || 100
    statusEffects.cls_anchorPulseHeal = Math.round(maxHp * 0.30)
    messages.push(`🛡 Anchor Pulse — status cleared on both sides. Heal incoming.`)
  } else if (skillId === 'living_wall') {
    statusEffects.cls_livingWallTurns = 3
    messages.push('🛡 Living Wall — 3 turns of immunity. Attacks become Bulwark.')
  } else if (skillId === 'final_riposte') {
    // Release ALL Bulwark stacks as one strike: stacks × 15 + DEF × 2
    const stacks = statusEffects.cls_bulwarkStacks || 0
    const def = (player.def || 2) + (statusEffects.playerDEFBonus || 0)
    statusEffects.cls_finalRiposteDamage = (stacks * 15) + (def * 2)
    statusEffects.cls_bulwarkStacks = 0
    messages.push(`🛡 Final Riposte — ${stacks} stacks + DEF released as one strike.`)
  }

  // ── Dawnbringer actives ──────────────────────────────────────────────
  else if (skillId === 'healing_wave') {
    const maxHp = player.hp_max || player.max_hp || 100
    const stacks = statusEffects.cls_sunStacks || 0
    let healPct = 0.30 + (stacks * 0.05)
    // Resurgence — t4a: doubled if <40% HP
    if (hasSkill(player, 'dawnbringer_t4a') && (statusEffects._enginePlayerHpPct || 1) < 0.40) {
      healPct *= 2
    }
    statusEffects.cls_healingWaveHeal = Math.round(maxHp * healPct)
    statusEffects.cls_sunStacks = 0
    // Solar Flow — t3a: +2 SP per heal
    if (hasSkill(player, 'dawnbringer_t3a')) {
      statusEffects.cls_bonusSP = (statusEffects.cls_bonusSP || 0) + 2
    }
    messages.push(`☀ Healing Wave — restoring ${statusEffects.cls_healingWaveHeal} HP.`)
  } else if (skillId === 'radiant_burst') {
    const stacks = statusEffects.cls_sunStacks || 0
    statusEffects.cls_radiantBurstDamage = stacks * 8
    // Cleanse all player debuffs
    const clearFields = ['burnTurns', 'poisonTurns', 'cls_bleedingTurns',
                         'cls_rotTurns']
    for (const k of clearFields) if (statusEffects[k]) statusEffects[k] = 0
    messages.push(`☀ Radiant Burst — ${stacks * 8} damage + cleanse.`)
  } else if (skillId === 'dawnward_light') {
    statusEffects.cls_dawnwardLightTurns = 5
    messages.push('☀ Dawnward Light — 5 turns of life-steal strikes.')
  } else if (skillId === 'dawnbreaker') {
    // 5× ATK as untyped radiant damage; lose 50% Sun
    const atk = (player.atk || 5) + (statusEffects.playerATKBonus || 0)
    statusEffects.cls_dawnbreakerDamage = atk * 5
    statusEffects.cls_sunStacks = Math.round((statusEffects.cls_sunStacks || 0) * 0.5)
    messages.push(`☀ Dawnbreaker — strike for ${atk * 5} radiant damage.`)
  }

  // ── Hollow actives ───────────────────────────────────────────────────
  else if (skillId === 'disappear') {
    statusEffects.cls_disappearTurns = 2
    messages.push('◇ Disappear — 2 turns. The shape of you gone.')
    // Voidwalker (t5a): no longer costs turns — engine doesn't disable strike
    if (!hasSkill(player, 'hollow_t5a')) {
      // Normal Disappear consumes the turn
    }
  } else if (skillId === 'all_that_remains') {
    // Damage = missing HP × 2
    const maxHp = player.hp_max || player.max_hp || 100
    const hpPct = statusEffects._enginePlayerHpPct || 1
    const missing = Math.round(maxHp * (1 - hpPct))
    statusEffects.cls_allThatRemainsDamage = missing * 2
    messages.push(`◇ All That Remains — ${missing * 2} damage from what's gone.`)
  } else if (skillId === 'the_empty_one') {
    statusEffects.cls_emptyOneTurns = 4
    messages.push('◇ The Empty One — 4 turns. Untouchable. All DEF pierced.')
  } else if (skillId === 'survivors_end') {
    // Heal 50% max HP, deal Void × 20, drop to 1 HP
    const maxHp = player.hp_max || player.max_hp || 100
    statusEffects.cls_survivorsEndHeal = Math.round(maxHp * 0.50)
    statusEffects.cls_survivorsEndDamage = (statusEffects.cls_voidStacks || 0) * 20
    statusEffects.cls_survivorsEndDropToOne = true
    messages.push(`◇ Survivor's End — heal ${statusEffects.cls_survivorsEndHeal}, deal ${statusEffects.cls_survivorsEndDamage}, drop to 1 HP.`)
  } else if (skillId === 'endless_hollow') {
    // Damage = max HP. Drop to 1.
    const maxHp = player.hp_max || player.max_hp || 100
    statusEffects.cls_endlessHollowDamage = maxHp
    statusEffects.cls_endlessHollowDropToOne = true
    messages.push(`◇ Endless Hollow — ${maxHp} damage. The last move.`)
  }

  // ── Devourer actives ─────────────────────────────────────────────────
  else if (skillId === 'cleansing_devour') {
    // Eat all status (buffs + debuffs); +15 damage per consumed
    const allStatusFields = ['burnTurns', 'poisonTurns', 'cls_bleedingTurns',
                             'enemyStunTurns', 'cls_rotTurns', 'cls_markTurns',
                             'cls_silenceTurns', 'invulnerable',
                             'cls_possessionSurgeTurns', 'cls_dawnwardLightTurns',
                             'cls_ghostStepTurns', 'cls_shadowmeldTurns',
                             'cls_phaseUntargetableTurns']
    let consumed = 0
    for (const k of allStatusFields) {
      if ((statusEffects[k] || 0) > 0) {
        statusEffects[k] = 0
        consumed += 1
      }
    }
    statusEffects.cls_cleansingDevourDamage = consumed * 15
    messages.push(`🦷 Cleansing Devour — ate ${consumed} effects. +${consumed * 15} damage.`)
  } else if (skillId === 'last_course') {
    const maxHp = player.hp_max || player.max_hp || 100
    statusEffects.cls_lastCourseDamage = Math.round(maxHp * 1.5)
    // Costs all SP — handled via cls_bonusSP set to negative
    statusEffects.cls_lastCourseSPCost = true
    messages.push(`🦷 The Last Course — strike for ${statusEffects.cls_lastCourseDamage}. SP burnt.`)
  } else if (skillId === 'great_hunger') {
    statusEffects.cls_hunger = 100
    statusEffects.cls_greatHungerTurns = 5
    statusEffects.cls_blockAllHeals = true
    messages.push('🦷 The Great Hunger — Hunger maxed. 5 turns. No heals reach you.')
  }

  // ── Mourning King actives ────────────────────────────────────────────
  else if (skillId === 'memory_of_steel') {
    statusEffects.cls_wakeStacks = (statusEffects.cls_wakeStacks || 0) - 5
    statusEffects.cls_memoryOfSteelStrikes = 3
    messages.push('☠ Memory of Steel — next 3 strikes +50%.')
  } else if (skillId === 'speak_to_dead') {
    statusEffects.cls_speakToDeadTurns = 5
    messages.push('☠ Speak to the Dead — echoes will strike.')
  } else if (skillId === 'all_crowns_worn') {
    const stacks = statusEffects.cls_wakeStacks || 0
    statusEffects.cls_allCrownsWornDamage = stacks * 25
    statusEffects.cls_wakeStacks = 0
    messages.push(`☠ All Crowns Worn — ${stacks} stacks released as ${stacks * 25} damage.`)
  } else if (skillId === 'last_mercy') {
    // Heal enemy to full, mark for execute
    statusEffects.cls_lastMercyHealEnemyToFull = true
    statusEffects.cls_lastMercyExecuteMark = true
    messages.push('☠ Last Mercy — they are made whole. Now they die.')
  }

  // ── Chimera actives ──────────────────────────────────────────────────
  else if (skillId === 'shift_beast' || skillId === 'shift_coil' || skillId === 'shift_storm') {
    const newForm = skillId.replace('shift_', '')
    const oldForm = statusEffects.cls_chimeraForm || 'beast'
    statusEffects.cls_chimeraForm = newForm
    statusEffects.cls_shiftCooldown = 2
    // Wild Energy (4c): switching heals 20% max HP if you have Storm
    if (hasSkill(player, 'chimera_t4c')) {
      const maxHp = player.hp_max || player.max_hp || 100
      statusEffects.cls_wildEnergyHeal = Math.round(maxHp * 0.20)
    }
    // Coiled Spring (5b): switching FROM Coil to Beast triggers heavy strike +50%
    if (hasSkill(player, 'chimera_t5b') && oldForm === 'coil' && newForm === 'beast') {
      statusEffects.cls_coiledSpringReady = true
    }
    messages.push(`◎ Shift — ${newForm.toUpperCase()} form active.`)
    return { messages, consumed: false }  // doesn't burn the turn (free action)
  } else if (skillId === 'true_beast') {
    statusEffects.cls_chimeraForm = 'beast'
    statusEffects.cls_trueBeastTurns = 3
    messages.push('◎ True Beast — 3 turns of beast at +50% damage.')
  } else if (skillId === 'eternal_coil') {
    statusEffects.cls_chimeraForm = 'coil'
    statusEffects.cls_eternalCoilTurns = 3
    messages.push('◎ Eternal Coil — 3 turns. Damage capped at 20% max HP per hit.')
  } else if (skillId === 'stormlord') {
    statusEffects.cls_stormlordTurns = 3
    messages.push('◎ Stormlord — 3 turns of every form bonus.')
  }

  // ── Unwritten actives ────────────────────────────────────────────────
  else if (skillId === 'erasure') {
    // Undo last hit taken — heal back the last damage
    const refund = statusEffects.cls_lastDamageTaken || 0
    if (refund > 0) {
      statusEffects.cls_erasureHeal = refund
      statusEffects.cls_absenceStacks = (statusEffects.cls_absenceStacks || 0) + 1
      statusEffects.cls_lastDamageTaken = 0
      messages.push(`✎ Erasure — last hit (${refund}) undone. +1 Absence.`)
    } else {
      messages.push('✎ Erasure — nothing to erase yet.')
      return { messages, consumed: false }
    }
  } else if (skillId === 'skip') {
    statusEffects.enemyStunTurns = Math.max(statusEffects.enemyStunTurns || 0, 1)
    messages.push('✎ Skip — enemy forgets their next turn.')
  } else if (skillId === 'disowned_hit') {
    // Undo your last strike, gain 2 Absence stacks
    const refund = statusEffects.cls_lastStrikeDamage || 0
    if (refund > 0) {
      statusEffects.cls_disownedHitEnemyHeal = refund  // engine reads + restores enemy HP
      statusEffects.cls_absenceStacks = (statusEffects.cls_absenceStacks || 0) + 2
      statusEffects.cls_lastStrikeDamage = 0
      messages.push(`✎ Disowned Hit — last strike (${refund}) undone. +2 Absence.`)
    } else {
      messages.push('✎ Disowned Hit — nothing to disown.')
      return { messages, consumed: false }
    }
  } else if (skillId === 'the_unmoved') {
    statusEffects.enemyStunTurns = Math.max(statusEffects.enemyStunTurns || 0, 2)
    messages.push('✎ The Unmoved — 2 turns of paralysis.')
  } else if (skillId === 'bury_the_hour') {
    // Real rewind: signal engine to restore the oldest snapshot in the
    // rolling buffer. Engine maintains statusEffects.cls_rewindBuffer (last
    // 4 snapshots, one per player turn). On this signal, engine pops the
    // oldest snapshot and overwrites currentHp / enemyHp / statusEffects /
    // maxPlayerHp from it. If buffer is empty (combat just started),
    // applies the placeholder healing instead.
    if (Array.isArray(statusEffects.cls_rewindBuffer) && statusEffects.cls_rewindBuffer.length > 0) {
      statusEffects.cls_buryTheHourPending = true
      messages.push('✎ Bury the Hour — the past unwinds.')
    } else {
      // Fallback: too early in combat to rewind. Apply mild heal + Absence.
      const refund = (statusEffects.cls_lastDamageTaken || 0) * 2
      statusEffects.cls_burryHourHeal = refund
      statusEffects.cls_absenceStacks = (statusEffects.cls_absenceStacks || 0) + 3
      messages.push(`✎ Bury the Hour — nothing to undo yet. +${refund} HP, +3 Absence.`)
    }
  } else if (skillId === 'no_such_person') {
    statusEffects.cls_noSuchPersonTurns = 5
    statusEffects.cls_noSuchPersonAvoidedDamage = 0
    messages.push('✎ No Such Person — 5 turns outside the record. Then the strike comes.')
  } else if (skillId === 'long_silence') {
    statusEffects.enemyStunTurns = Math.max(statusEffects.enemyStunTurns || 0, 5)
    statusEffects.cls_longSilenceTurns = 5
    messages.push('✎ The Long Silence — 5 turns. No motion permitted.')
  } else if (skillId === 'all_written_out') {
    // Populate cls_deletedEnemySkills with sentinel that engine expands to
    // all enemy.moves. enemyAI.js pickWeighted filters by these names.
    // If the engine doesn't use the AI module (current Ch1/Ch2 both have
    // inline AI), the silence fallback still triggers via cls_silenceTurns.
    statusEffects.cls_allWrittenOut = true
    statusEffects.cls_deletedEnemySkills = statusEffects.cls_deletedEnemySkills || []
    statusEffects.cls_deletedEnemySkills.push('__ALL__')
    // Fallback for inline-AI engines: long silence keeps them from using
    // skill-tagged moves (some enemies use this flag).
    statusEffects.cls_silenceTurns = Math.max(statusEffects.cls_silenceTurns || 0, 99)
    messages.push('✎ All Written Out — every skill in their record is erased.')
  }

  // ── Oathbreaker actives ──────────────────────────────────────────────
  else if (skillId === 'break_fury') {
    const turnsHeld = statusEffects.cls_oathTurnsHeld || 0
    statusEffects.cls_breakFuryDamage = turnsHeld * 30
    statusEffects.cls_currentOath = null
    statusEffects.cls_furyBroken = true
    if (hasSkill(player, 'oathbreaker_t4a')) {
      // Bitter Promise: +10% damage permanent for combat
      statusEffects.playerATKBonus = (statusEffects.playerATKBonus || 0) + Math.round((player.atk || 5) * 0.10)
      messages.push(`⚔ Bitter Promise — +10% damage permanent.`)
    }
    messages.push(`⚔ Break: Fury — ${turnsHeld * 30} damage incoming.`)
  } else if (skillId === 'break_wall') {
    const turnsHeld = statusEffects.cls_oathTurnsHeld || 0
    const maxHp = player.hp_max || player.max_hp || 100
    const heal = Math.round(maxHp * 0.08 * turnsHeld)
    statusEffects.cls_breakWallHeal = heal
    statusEffects.cls_currentOath = null
    statusEffects.cls_wallBroken = true
    if (hasSkill(player, 'oathbreaker_t4b')) {
      // Steady Promise: +30% max SP
      const maxSP = player.sp_max || 100
      statusEffects.cls_bonusSP = (statusEffects.cls_bonusSP || 0) + Math.round(maxSP * 0.30)
    }
    if (hasSkill(player, 'oathbreaker_t5b')) {
      // Restoration: next 3 enemy attacks -50%
      statusEffects.cls_wallRestorationCount = 3
    }
    messages.push(`⚔ Break: Wall — ${heal} HP restored.`)
  } else if (skillId === 'break_hunt') {
    statusEffects.cls_breakHuntReady = true
    statusEffects.cls_currentOath = null
    statusEffects.cls_huntBroken = true
    if (hasSkill(player, 'oathbreaker_t4c')) {
      // Hunter's Promise: free extra turn — engine should re-enable buttons
      statusEffects.cls_freeBonusTurn = true
    }
    if (hasSkill(player, 'oathbreaker_t5c')) {
      // Old Hunt: basic strikes ignore 25% DEF rest of combat
      statusEffects.cls_oldHuntActive = true
    }
    messages.push('⚔ Break: Hunt — next strike: guaranteed crit, all DEF pierced.')
  } else if (skillId === 'reswear_fury') {
    // Old Anger: re-swear at half buff
    statusEffects.cls_currentOath = 'fury_weak'
    statusEffects.cls_oathTurnsHeld = 0
    messages.push('⚔ Re-swear Fury — the anger remembers, but weaker.')
  } else if (skillId === 'final_oath_wrath') {
    const turnsElapsed = statusEffects.cls_primeTurnsAlive || statusEffects.cls_turnsElapsed || 0
    statusEffects.cls_finalOathWrathDamage = turnsElapsed * 75
    messages.push(`⚔ Final Oath: Wrath — all oaths broken. ${turnsElapsed * 75} damage.`)
  } else if (skillId === 'final_oath_sanctuary') {
    const maxHp = player.hp_max || player.max_hp || 100
    statusEffects.cls_finalOathSanctuaryHeal = maxHp  // engine clamps
    // Cleanse all status
    const clearFields = ['burnTurns','poisonTurns','cls_bleedingTurns','cls_rotTurns','cls_silenceTurns']
    for (const k of clearFields) if (statusEffects[k]) statusEffects[k] = 0
    statusEffects.cls_finalOathDEFBonusTurns = 5
    statusEffects.playerDEFBonus = (statusEffects.playerDEFBonus || 0) + 50
    messages.push('⚔ Final Oath: Sanctuary — full restore, cleansed, +50 DEF.')
  } else if (skillId === 'final_oath_hunt') {
    statusEffects.cls_finalOathHuntStrikes = 5
    messages.push('⚔ Final Oath: Hunt — 5 strikes coming. All ×2, all crit, all pierce.')
  }

  // ── Silent Judge actives ─────────────────────────────────────────────
  else if (skillId === 'render_verdict') {
    const marks = statusEffects.cls_verdictMarks || 0
    statusEffects.cls_renderVerdictDamage = marks * 30
    statusEffects.cls_verdictMarks = 0
    messages.push(`⚖ Render Verdict — ${marks} marks → ${marks * 30} damage.`)
  } else if (skillId === 'quiet_court') {
    statusEffects.cls_quietCourtTurns = 3
    messages.push('⚖ The Quiet Court — 3 turns, no status reaches you.')
  } else if (skillId === 'court_adjourned') {
    statusEffects.cls_verdictMarks -= 5
    statusEffects.enemyStunTurns = Math.max(statusEffects.enemyStunTurns || 0, 3)
    messages.push('⚖ Court Adjourned — 3 turns of enemy silence.')
  } else if (skillId === 'eyes_of_equilibrium') {
    statusEffects.cls_eyesOfEquilibriumTurns = 5
    messages.push('⚖ Eyes of Equilibrium — 5 turns. The court sees all.')
  } else if (skillId === 'silent_court') {
    const marks = statusEffects.cls_verdictMarks || 0
    statusEffects.cls_silentCourtTurns = 5
    statusEffects.enemyStunTurns = Math.max(statusEffects.enemyStunTurns || 0, 5)
    statusEffects.cls_verdictMarks = 0
    messages.push(`⚖ The Silent Court — ${marks} marks spent. 5 turns of silence + ×2 damage.`)
  } else if (skillId === 'final_verdict_sj') {
    const marks = statusEffects.cls_verdictMarks || 0
    const enemyMax = enemy.hp_max || enemy.hp || 100
    statusEffects.cls_finalVerdictSJDamage = (marks * 50) + Math.round(enemyMax * 0.15)
    statusEffects.cls_verdictMarks = 0
    messages.push(`⚖ Final Verdict — ${statusEffects.cls_finalVerdictSJDamage} damage.`)
  }

  // ── Dreadnought actives ──────────────────────────────────────────────
  else if (skillId === 'inexorable') {
    // Cleanse all status on player + stun enemy 1 turn
    const clearFields = ['burnTurns', 'poisonTurns', 'cls_bleedingTurns',
                         'cls_rotTurns', 'cls_silenceTurns', 'cls_markTurns']
    for (const k of clearFields) if (statusEffects[k]) statusEffects[k] = 0
    statusEffects.enemyStunTurns = Math.max(statusEffects.enemyStunTurns || 0, 1)
    messages.push('🛡 Inexorable — cleansed. Enemy stunned 1 turn.')
  } else if (skillId === 'one_step_more') {
    statusEffects.cls_oneStepMoreTurns = 3
    statusEffects.cls_oneStepMoreBlockHeal = true
    messages.push('🛡 One Step More — 3 turns of nothing reaching you, nothing leaving you.')
  } else if (skillId === 'hammer_falls') {
    const armor = statusEffects.cls_armorStacks || 0
    const maxHp = player.hp_max || player.max_hp || 100
    statusEffects.cls_hammerFallsDamage = (armor * 25) + Math.round(maxHp * 0.5)
    statusEffects.cls_armorStacks = 0
    messages.push(`🛡 The Hammer Falls — ${armor} Armor + max HP × 0.5 = ${statusEffects.cls_hammerFallsDamage} damage.`)
  } else if (skillId === 'walking_tomb') {
    statusEffects.cls_walkingTombTurns = 5
    messages.push('🛡 Walking Tomb — 5 turns. Death does not come.')
  } else if (skillId === 'the_inevitable') {
    statusEffects.cls_theInevitableTurns = 5
    statusEffects.enemyStunTurns = Math.max(statusEffects.enemyStunTurns || 0, 5)
    messages.push('🛡 The Inevitable — 5 turns. No one moves but you.')
  }

  // ── Abyss Walker actives ─────────────────────────────────────────────
  else if (skillId === 'anchor_line') {
    statusEffects.cls_depth = Math.max(0, (statusEffects.cls_depth || 0) - 3)
    messages.push(`◊ Anchor Line — Depth ${statusEffects.cls_depth}.`)
  } else if (skillId === 'climb') {
    statusEffects.cls_climbTurns = 3
    messages.push('◊ Climb — slow ascent begins.')
  } else if (skillId === 'surface_memory') {
    statusEffects.cls_depth = 0
    messages.push('◊ Surface Memory — Depth 0.')
  } else if (skillId === 'hollow_sea') {
    statusEffects.cls_depth = 15
    statusEffects.cls_hollowSeaTurns = 5
    messages.push('◊ The Hollow Sea — Depth 15. 5 turns of devastation.')
  } else if (skillId === 'drowned') {
    statusEffects.cls_drownStacks = 10
    statusEffects.cls_drownTurns = 5
    statusEffects.cls_drownedActive = true
    messages.push('◊ Drowned — 10 stacks. They cannot escape.')
  } else if (skillId === 'return_from_below') {
    const maxHp = player.hp_max || player.max_hp || 100
    statusEffects.cls_returnFromBelowHeal = maxHp
    statusEffects.cls_depth = 0
    messages.push('◊ Return From Below — Depth 0, fully restored.')
  }

  return { messages, consumed: true }
}

// ── Oathbreaker helpers ─────────────────────────────────────────────────
// Applies oath effect + state. Used both by onCombatStart auto-path and
// by setOathbreakerOath (engine UI hook).
function _applyOath(oathKey, statusEffects, messages) {
  statusEffects.cls_currentOath = oathKey
  statusEffects.cls_oathTurnsHeld = 0
  if (oathKey === 'fury') {
    messages.push('⚔ Oath of Fury sworn. +20% damage, -10% DEF.')
  } else if (oathKey === 'wall') {
    messages.push('⚔ Oath of the Wall sworn. +25% DEF, -15% damage.')
  } else if (oathKey === 'hunt') {
    messages.push('⚔ Oath of the Hunt sworn. +15% SPD, +10% crit.')
  }
}

// Called by engine after player clicks an oath in the picker UI.
// Returns: { messages }
export function setOathbreakerOath(oathKey, statusEffects) {
  const messages = []
  if (!['fury', 'wall', 'hunt'].includes(oathKey)) return { messages: ['Invalid oath.'] }
  _applyOath(oathKey, statusEffects, messages)
  delete statusEffects.cls_oathPickerPending
  return { messages }
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
  // Nullborn
  statusEffects.cls_nullStacks          = 0
  statusEffects.cls_nullAbsorbedTotal   = 0  // damage absorbed (for Vacuum Strike)
  statusEffects.cls_readErrorTurns      = 0
  statusEffects.cls_singularityDamage   = 0
  statusEffects.cls_finalErasureDamage  = 0
  statusEffects.cls_eraseMarkDamage     = 0
  statusEffects.cls_voidedRecordActive  = false  // updated each turn
  // Error
  statusEffects.cls_glitchAtkMult       = 1
  statusEffects.cls_glitchDefMult       = 1
  statusEffects.cls_glitchSpdMult       = 1
  statusEffects.cls_glitchRerollPending = false
  statusEffects.cls_bufferStored        = false
  statusEffects.cls_bufferRelease       = false
  statusEffects.cls_tryCatchTurns       = 0
  statusEffects.cls_kernelPanicReady    = false
  statusEffects.cls_bitFlipReady        = false
  statusEffects.cls_segfaultStrikes     = 0
  statusEffects.cls_compileTimeErrorTurns = 0
  statusEffects.cls_garbageCollectionHeal = false
  statusEffects.cls_fatalExceptionReady = false
  statusEffects.cls_recursionCounter    = 0
  // Prime
  statusEffects.cls_primeTurnsAlive     = 0
  statusEffects.cls_primeATKGain        = 0   // accumulated from Stand Tall
  statusEffects.cls_primeDEFGain        = 0
  statusEffects.cls_primeSPDGain        = 0
  statusEffects.cls_primeUnyieldingPct  = 0   // Unyielding Standard
  statusEffects.cls_authorityPulseTurn  = 0   // every-3rd-turn counter
  statusEffects.cls_finalStandardTurns  = 0
  statusEffects.cls_throneSpeaksTurns   = 0
  statusEffects.cls_apexSovereignDamage = 0
  statusEffects.cls_empyreanUsed        = false
  // Bastion
  statusEffects.cls_bulwarkStacks       = 0
  statusEffects.cls_bulwarkCap          = 10   // increases via Tempered Plate
  statusEffects.cls_reinforceCounter    = 0   // every-other-hit gate
  statusEffects.cls_livingWallTurns     = 0
  statusEffects.cls_lastActionDefend    = false  // tracks for Counterpoint
  statusEffects.cls_anchorPulseHeal     = 0
  statusEffects.cls_finalRiposteDamage  = 0
  // Dawnbringer
  statusEffects.cls_sunStacks           = 0
  statusEffects.cls_pureStrikeCounter   = 0   // every-3rd-strike gate
  statusEffects.cls_healingVeilUsedThisTurn = false
  statusEffects.cls_lightsRestorationUsed = false
  statusEffects.cls_eternalVigilUsed    = false
  statusEffects.cls_dawnwardLightTurns  = 0
  statusEffects.cls_healingWaveHeal     = 0
  statusEffects.cls_radiantBurstDamage  = 0
  statusEffects.cls_dawnbreakerDamage   = 0
  // Hollow
  statusEffects.cls_voidStacks          = 0
  statusEffects.cls_disappearTurns      = 0
  statusEffects.cls_emptyOneTurns       = 0
  statusEffects.cls_oneLastStandUsed    = false
  statusEffects.cls_lastWishStrikes     = 0   // Last Wish guaranteed-crit counter
  statusEffects.cls_lastWishTriggered   = false
  statusEffects.cls_coldComfortDebuff   = 0   // enemy ATK reduction (permanent for combat)
  statusEffects.cls_echoOfLossTurns     = 0   // counter for 5-turn loss-cycle
  statusEffects.cls_allThatRemainsDamage = 0
  statusEffects.cls_endlessHollowDamage = 0
  statusEffects.cls_endlessHollowDropToOne = false
  statusEffects.cls_survivorsEndHeal    = 0
  statusEffects.cls_survivorsEndDamage  = 0
  statusEffects.cls_survivorsEndDropToOne = false
  // Devourer
  statusEffects.cls_hunger              = 0  // 0-100 meter
  statusEffects.cls_feastATKGain        = 0  // accumulated per kill
  statusEffects.cls_greatHungerTurns    = 0
  statusEffects.cls_blockAllHeals       = false
  statusEffects.cls_cleansingDevourDamage = 0
  statusEffects.cls_lastCourseDamage    = 0
  statusEffects.cls_lastCourseSPCost    = false
  statusEffects.cls_gnawCounter         = 0
  statusEffects.cls_throatHitCounter    = 0  // Devourer's Throat every-3rd-hit
  // Mourning King
  statusEffects.cls_wakeStacks          = 0
  statusEffects.cls_memoryOfSteelStrikes = 0
  statusEffects.cls_speakToDeadTurns    = 0
  statusEffects.cls_deathMarkUsed       = false
  statusEffects.cls_quietStepReady      = false  // After Death Mark save
  statusEffects.cls_allCrownsWornDamage = 0
  statusEffects.cls_lastMercyHealEnemyToFull = false
  statusEffects.cls_lastMercyExecuteMark = false
  statusEffects.cls_emptyThroneUsed     = false
  // Chimera
  statusEffects.cls_chimeraForm         = 'beast'  // default starting form
  statusEffects.cls_shiftCooldown       = 0
  statusEffects.cls_trueBeastTurns      = 0
  statusEffects.cls_eternalCoilTurns    = 0
  statusEffects.cls_stormlordTurns      = 0
  statusEffects.cls_huntersClawsBonus   = 0  // accumulated per kill in Beast
  statusEffects.cls_livingShellDEFGain  = 0  // accumulated per turn in Coil
  statusEffects.cls_bloodscentNextCrit  = false
  statusEffects.cls_wildEnergyHeal      = 0
  statusEffects.cls_coiledSpringReady   = false
  statusEffects.cls_stormRandomStat     = 'atk'  // rolled per turn in Storm
  statusEffects.cls_tempestCounter      = 0

  // Royal Banner — Prime t1b: +10% all stats at combat start
  if (hasSkill(player, 'prime_t1b')) {
    statusEffects.playerATKBonus = (statusEffects.playerATKBonus || 0) + Math.round((player.atk || 5) * 0.10)
    statusEffects.playerDEFBonus = (statusEffects.playerDEFBonus || 0) + Math.round((player.def || 2) * 0.10)
    statusEffects.playerSPDBonus = (statusEffects.playerSPDBonus || 0) + Math.round((player.speed || 5) * 0.10)
    messages.push('👑 Royal Banner — +10% all stats.')
  }
  // Eternal Sovereign — Prime t5a: load persistent stat stacks from player
  if (hasSkill(player, 'prime_t5a')) {
    const atkStacks = player.prime_atk_stacks || 0
    const defStacks = player.prime_def_stacks || 0
    const spdStacks = player.prime_spd_stacks || 0
    statusEffects.playerATKBonus = (statusEffects.playerATKBonus || 0) + atkStacks
    statusEffects.playerDEFBonus = (statusEffects.playerDEFBonus || 0) + defStacks
    statusEffects.playerSPDBonus = (statusEffects.playerSPDBonus || 0) + spdStacks
    if (atkStacks + defStacks + spdStacks > 0) {
      messages.push(`👑 Eternal Sovereign — carry-over: +${atkStacks} ATK, +${defStacks} DEF, +${spdStacks} SPD.`)
    }
  }
  // Nullborn — Null Form: start with 3 Null stacks
  if (hasSkill(player, 'nullborn_t1a')) {
    statusEffects.cls_nullStacks = 3
    messages.push('✕ Null Form — 3 stacks ready.')
  }
  // Devourer — Empty Stomach (t1b): Hunger starts at 50
  if (hasSkill(player, 'devourer_t1b')) {
    statusEffects.cls_hunger = 50
    messages.push('🦷 Empty Stomach — Hunger at 50.')
  }
  // Devourer — Inverted Stomach (t5c): swap one enemy buff to player side
  // (Cosmetic: most enemies don't have buffs; we just set a flag for engine display)
  if (hasSkill(player, 'devourer_t5c')) {
    // Best-effort: try to swap enemyATKMult > 1 to player
    if ((statusEffects.enemyATKMult || 1) > 1) {
      const buff = statusEffects.enemyATKMult - 1
      statusEffects.enemyATKMult = 1
      // Translate to a flat ATK bonus equal to the buff fraction × current ATK
      statusEffects.playerATKBonus = (statusEffects.playerATKBonus || 0) + Math.round((player.atk || 5) * buff)
      messages.push('🦷 Inverted Stomach — their force is yours now.')
    }
  }
  // Mourning King — First Breath (t1c): +3 Wake at combat start
  if (hasSkill(player, 'mourning_king_t1c')) {
    statusEffects.cls_wakeStacks = (statusEffects.cls_wakeStacks || 0) + 3
  }
  // Mourning King — The Long Wait (t2b): persistent Wake stacks from DB
  if (hasSkill(player, 'mourning_king_t2b')) {
    const persistent = player.mourning_king_wake_stacks || 0
    statusEffects.cls_wakeStacks = (statusEffects.cls_wakeStacks || 0) + persistent
    if (persistent > 0) {
      messages.push(`☠ The Long Wait — ${persistent} Wake stacks carried forward.`)
    }
  }
  // Unwritten state init
  statusEffects.cls_absenceStacks       = 0
  statusEffects.cls_lastDamageTaken     = 0  // for Erasure
  statusEffects.cls_lastStrikeDamage    = 0  // for Disowned Hit
  statusEffects.cls_disownedHitEnemyHeal = 0
  statusEffects.cls_erasureHeal         = 0
  statusEffects.cls_burryHourHeal       = 0
  statusEffects.cls_noSuchPersonTurns   = 0
  statusEffects.cls_noSuchPersonAvoidedDamage = 0
  statusEffects.cls_longSilenceTurns    = 0
  statusEffects.cls_allWrittenOut       = false
  statusEffects.cls_forgottenWoundActive = false
  statusEffects.cls_turnsElapsed        = 0  // generic turn counter

  // Unwritten — Forgotten Wound (t1c): preventatively cleanse one debuff
  if (hasSkill(player, 'unwritten_t1c')) {
    statusEffects.cls_forgottenWoundActive = true
    // Will fire on first debuff application; for simplicity, cleanse any
    // starting debuff now too
    const debuffFields = ['burnTurns', 'poisonTurns', 'cls_bleedingTurns', 'cls_rotTurns']
    for (const k of debuffFields) {
      if ((statusEffects[k] || 0) > 0) {
        statusEffects[k] = 0
        messages.push(`✎ Forgotten Wound — debuff erased.`)
        statusEffects.cls_forgottenWoundActive = false
        break
      }
    }
  }

  // Oathbreaker state + auto-oath swearing
  statusEffects.cls_currentOath         = null   // 'fury' | 'wall' | 'hunt' | 'fury_weak'
  statusEffects.cls_oathTurnsHeld       = 0
  statusEffects.cls_furyBroken          = false
  statusEffects.cls_wallBroken          = false
  statusEffects.cls_huntBroken          = false
  statusEffects.cls_wallRestorationCount = 0
  statusEffects.cls_oldHuntActive       = false
  statusEffects.cls_breakFuryDamage     = 0
  statusEffects.cls_breakWallHeal       = 0
  statusEffects.cls_breakHuntReady      = false
  statusEffects.cls_freeBonusTurn       = false
  statusEffects.cls_finalOathWrathDamage = 0
  statusEffects.cls_finalOathSanctuaryHeal = 0
  statusEffects.cls_finalOathDEFBonusTurns = 0
  statusEffects.cls_finalOathHuntStrikes = 0

  // Oathbreaker — defer oath selection to UI picker.
  // If the player has multiple oath options unlocked, the engine should
  // show a modal at combat start; player picks an oath, then calls
  // ClsCombat.setOathbreakerOath(oathKey, statusEffects, messages).
  // If only one oath is unlocked, we auto-swear it (no UI needed).
  if (player.active_class === 'oathbreaker') {
    const oaths = []
    if (hasSkill(player, 'oathbreaker_t1a')) oaths.push('fury')
    if (hasSkill(player, 'oathbreaker_t1b')) oaths.push('wall')
    if (hasSkill(player, 'oathbreaker_t1c')) oaths.push('hunt')
    if (oaths.length === 1) {
      // Auto-swear if only one option
      _applyOath(oaths[0], statusEffects, messages)
    } else if (oaths.length > 1) {
      // Signal to engine: show picker
      statusEffects.cls_oathPickerPending = oaths
    }
  }

  // Silent Judge state init
  statusEffects.cls_verdictMarks        = 0
  statusEffects.cls_quietCourtTurns     = 0
  statusEffects.cls_silentCourtTurns    = 0
  statusEffects.cls_eyesOfEquilibriumTurns = 0
  statusEffects.cls_renderVerdictDamage = 0
  statusEffects.cls_finalVerdictSJDamage = 0
  statusEffects.cls_sentencingCycleCounter = 0
  // Dreadnought state init
  statusEffects.cls_armorStacks         = 0
  statusEffects.cls_armorCap            = 15
  statusEffects.cls_oneStepMoreTurns    = 0
  statusEffects.cls_oneStepMoreBlockHeal = false
  statusEffects.cls_walkingTombTurns    = 0
  statusEffects.cls_theInevitableTurns  = 0
  statusEffects.cls_hammerFallsDamage   = 0
  // Abyss Walker state init
  statusEffects.cls_depth               = 0
  statusEffects.cls_drownStacks         = 0
  statusEffects.cls_drownTurns          = 0
  statusEffects.cls_drownedActive       = false
  statusEffects.cls_climbTurns          = 0
  statusEffects.cls_hollowSeaTurns      = 0
  statusEffects.cls_returnFromBelowHeal = 0
  // Dreadnought — Thick Hide (t1b): +20% max HP at combat start
  if (hasSkill(player, 'dreadnought_t1b')) {
    // Engine should read this and bump maxPlayerHp accordingly
    statusEffects.cls_thickHideBonus = Math.round((player.hp_max || player.max_hp || 100) * 0.20)
    messages.push(`🛡 Thick Hide — +${statusEffects.cls_thickHideBonus} max HP.`)
  }
  // Dreadnought — Steel Marrow (t2a): Armor cap raised to 20
  if (hasSkill(player, 'dreadnought_t2a')) statusEffects.cls_armorCap = 20
  // Dreadnought — Slow Tide (t4c): -25% SPD permanent for combat
  if (hasSkill(player, 'dreadnought_t4c')) {
    statusEffects.playerSPDBonus = (statusEffects.playerSPDBonus || 0) - Math.round((player.speed || 5) * 0.25)
    messages.push('🛡 Slow Tide — slower steps, heavier strikes.')
  }
  // Dreadnought — No Retreat (t3c): flag for status immunity
  if (hasSkill(player, 'dreadnought_t3c')) {
    statusEffects.cls_noWitness = true
  }

  // Chimera — Beast Form (t1a): default starting form. Apply form-mods.
  // (Form mods recomputed every turn in onTurnEnd; engine reads at start too)
  // Bastion — Standing Watch (t2c): cleanse all negative status at start
  if (hasSkill(player, 'bastion_t2c')) {
    const clearFields = ['burnTurns', 'poisonTurns', 'cls_bleedingTurns',
                         'enemyStunTurns', 'cls_rotTurns', 'cls_markTurns',
                         'cls_silenceTurns']
    for (const k of clearFields) if (statusEffects[k]) statusEffects[k] = 0
    messages.push('🛡 Standing Watch — start clean.')
  }
  // Dawnbringer — First Light (t2c): heal to full, once per 24 hours.
  // Reads player.dawnbringer_first_light_at (TIMESTAMPTZ); if null OR more
  // than 24h ago, the skill fires and the engine writes a fresh timestamp
  // via cls_firstLightConsumed → onCombatEnd dbUpdates.
  if (hasSkill(player, 'dawnbringer_t2c') && is24hReady(player.dawnbringer_first_light_at)) {
    statusEffects.cls_firstLightHealToFull = true
    statusEffects.cls_firstLightConsumed = true  // engine writes timestamp on combat end
    messages.push('☀ First Light — restored. The day has come.')
  }

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

  // ════════ Nullborn ══════════════════════════════════════════════════
  if (ac === 'nullborn') {
    // Vacuum Strike — t3a: 5+ Null → next strike +absorbed damage, consume 1 Null
    if (hasSkill(player, 'nullborn_t3a') && (statusEffects.cls_nullStacks || 0) >= 5) {
      bonusFlatDmg += statusEffects.cls_nullAbsorbedTotal || 0
      statusEffects.cls_nullStacks -= 1
      statusEffects.cls_nullAbsorbedTotal = Math.round((statusEffects.cls_nullAbsorbedTotal || 0) * 0.5)
      messages.push('✕ Vacuum Strike — absorbed energy released.')
    }
    // Voided Record — t5b: <50% HP → +30% damage
    if (hasSkill(player, 'nullborn_t5b') && typeof statusEffects._enginePlayerHpPct === 'number' && statusEffects._enginePlayerHpPct < 0.50) {
      dmgMult *= 1.30
    }
    // Null God — t6a: at 15+ Null, strikes deal Null × 5 bonus
    if (hasSkill(player, 'nullborn_t6a') && (statusEffects.cls_nullStacks || 0) >= 15) {
      bonusFlatDmg += statusEffects.cls_nullStacks * 5
    }
    // Stored active damages from buttons:
    if (statusEffects.cls_singularityDamage > 0) {
      bonusFlatDmg += statusEffects.cls_singularityDamage
      defIgnoreFrac = Math.max(defIgnoreFrac, 1.0)  // ignore all DEF
      statusEffects.cls_singularityDamage = 0
      messages.push('✕ Singularity strikes.')
    }
    if (statusEffects.cls_finalErasureDamage > 0) {
      bonusFlatDmg += statusEffects.cls_finalErasureDamage
      statusEffects.cls_finalErasureDamage = 0
      messages.push('✕ Final Erasure strikes.')
    }
    if (statusEffects.cls_eraseMarkDamage > 0) {
      bonusFlatDmg += statusEffects.cls_eraseMarkDamage
      statusEffects.cls_eraseMarkDamage = 0
    }
  }

  // ════════ Error ═════════════════════════════════════════════════════
  if (ac === 'error') {
    // Glitch — t1a: stat multipliers applied to damage. ATK mult is direct,
    // SPD mult adds to crit chance (per Speed Demon style), DEF mult is
    // applied on incoming damage in onPlayerHit.
    if (hasSkill(player, 'error_t1a')) {
      const atkMult = statusEffects.cls_glitchAtkMult || 1
      if (atkMult > 1) dmgMult *= atkMult
      else if (atkMult < 1) dmgMult *= atkMult  // could be 1/3
      const spdMult = statusEffects.cls_glitchSpdMult || 1
      if (spdMult > 1) critChanceAdd += 0.20  // simplified speed→crit relation
    }
    // Compile-Time Error — t6a: all stats × 3
    if (statusEffects.cls_compileTimeErrorTurns > 0) {
      dmgMult *= 3.0
    }
    // Buffer release: next strike ×2
    if (statusEffects.cls_bufferRelease) {
      dmgMult *= 2.0
      statusEffects.cls_bufferRelease = false
      messages.push('⚠ Buffer fires — ×2 strike.')
    }
    // Segfault strikes
    if ((statusEffects.cls_segfaultStrikes || 0) > 0) {
      critChanceAdd += 1.0
      dmgMult *= 1.5  // +50% crit bonus on top of normal crit ×1.5
      statusEffects.cls_segfaultStrikes -= 1
      messages.push(`⚠ Segfault — crit (${statusEffects.cls_segfaultStrikes} left).`)
    }
    // Stack Overflow — t1c: kills double next strike (flag set in onKill)
    if (statusEffects.cls_stackOverflowReady) {
      dmgMult *= 2.0
      statusEffects.cls_stackOverflowReady = false
      messages.push('⚠ Stack Overflow strikes.')
    }
    // Recursion — t3b: every 4th strike, auto-proc second hit at 60% (deferred)
    if (hasSkill(player, 'error_t3b')) {
      statusEffects.cls_recursionCounter = (statusEffects.cls_recursionCounter || 0) + 1
      if (statusEffects.cls_recursionCounter >= 4) {
        statusEffects.cls_recursionCounter = 0
        statusEffects.cls_recursionPending = true
      }
    }
  }

  // ════════ Prime ═════════════════════════════════════════════════════
  if (ac === 'prime') {
    // Marshal — t2b: +5% damage per turn elapsed
    if (hasSkill(player, 'prime_t2b')) {
      const t = statusEffects.cls_primeTurnsAlive || 0
      if (t > 0) dmgMult *= (1 + 0.05 * t)
    }
    // Throneborn — t4a: at 5+ turns elapsed, +30% damage
    if (hasSkill(player, 'prime_t4a') && (statusEffects.cls_primeTurnsAlive || 0) >= 5) {
      dmgMult *= 1.30
    }
    // Unyielding Standard — t4b: cumulative damage% gain
    if (hasSkill(player, 'prime_t4b') && (statusEffects.cls_primeUnyieldingPct || 0) > 0) {
      dmgMult *= (1 + (statusEffects.cls_primeUnyieldingPct || 0) / 100)
    }
    // Final Standard — t6b: 3 turns of doubled actions
    if (statusEffects.cls_finalStandardTurns > 0) {
      dmgMult *= 2.0
    }
    // Apex Sovereign — store damage from active
    if (statusEffects.cls_apexSovereignDamage > 0) {
      bonusFlatDmg += statusEffects.cls_apexSovereignDamage
      statusEffects.cls_apexSovereignDamage = 0
      messages.push('👑 Apex Sovereign — all banners spent in one strike.')
    }
  }

  // ════════ Bastion ═══════════════════════════════════════════════════
  if (ac === 'bastion') {
    // Counterpoint — t2b: strike after Defend +25% damage
    if (hasSkill(player, 'bastion_t2b') && statusEffects.cls_lastActionDefend) {
      dmgMult *= 1.25
      statusEffects.cls_lastActionDefend = false
      messages.push('🛡 Counterpoint — +25% from defending stance.')
    }
    // Final Riposte staged damage
    if (statusEffects.cls_finalRiposteDamage > 0) {
      bonusFlatDmg += statusEffects.cls_finalRiposteDamage
      statusEffects.cls_finalRiposteDamage = 0
      messages.push('🛡 Final Riposte strikes.')
    }
  }

  // ════════ Dawnbringer ═══════════════════════════════════════════════
  if (ac === 'dawnbringer') {
    // Dawn Strike — t1b: +10% radiant bonus; 25% chance to ignore DEF
    if (hasSkill(player, 'dawnbringer_t1b')) {
      dmgMult *= 1.10
      if (Math.random() < 0.25) {
        defIgnoreFrac = Math.max(defIgnoreFrac, 1.0)
        messages.push('☀ Dawn Strike — light pierces DEF.')
      }
    }
    // Radiant Edge — t2b: +5% damage per Sun stack
    if (hasSkill(player, 'dawnbringer_t2b')) {
      dmgMult *= (1 + 0.05 * (statusEffects.cls_sunStacks || 0))
    }
    // Pure Strike — t3b: every 3rd strike ignores all DEF
    if (hasSkill(player, 'dawnbringer_t3b')) {
      statusEffects.cls_pureStrikeCounter = (statusEffects.cls_pureStrikeCounter || 0) + 1
      if (statusEffects.cls_pureStrikeCounter >= 3) {
        statusEffects.cls_pureStrikeCounter = 0
        defIgnoreFrac = Math.max(defIgnoreFrac, 1.0)
        messages.push('☀ Pure Strike — all DEF pierced.')
      }
    }
    // Radiant Burst staged damage
    if (statusEffects.cls_radiantBurstDamage > 0) {
      bonusFlatDmg += statusEffects.cls_radiantBurstDamage
      statusEffects.cls_radiantBurstDamage = 0
      messages.push('☀ Radiant Burst strikes.')
    }
    // Dawnbreaker staged damage
    if (statusEffects.cls_dawnbreakerDamage > 0) {
      bonusFlatDmg += statusEffects.cls_dawnbreakerDamage
      defIgnoreFrac = Math.max(defIgnoreFrac, 1.0)  // untyped radiant ignores DEF
      statusEffects.cls_dawnbreakerDamage = 0
      messages.push('☀ Dawnbreaker strikes.')
    }
  }

  // ════════ Hollow ════════════════════════════════════════════════════
  if (ac === 'hollow') {
    // Hollowed — t1a: +3% ATK per Void stack
    if (hasSkill(player, 'hollow_t1a')) {
      dmgMult *= (1 + 0.03 * (statusEffects.cls_voidStacks || 0))
    }
    // Empty Strike — t2a: 5+ Void → +20% damage + ignore 25% DEF
    if (hasSkill(player, 'hollow_t2a') && (statusEffects.cls_voidStacks || 0) >= 5) {
      dmgMult *= 1.20
      defIgnoreFrac = Math.max(defIgnoreFrac, 0.25)
    }
    // Survivor's Wound — t1b: +1% damage per 1% HP lost (uncapped)
    if (hasSkill(player, 'hollow_t1b')) {
      const hpPct = statusEffects._enginePlayerHpPct
      if (typeof hpPct === 'number') {
        const missing = (1 - hpPct) * 100
        dmgMult *= (1 + missing / 100)
      }
    }
    // Last Wish — t1c: guaranteed-crit strikes
    if ((statusEffects.cls_lastWishStrikes || 0) > 0) {
      critChanceAdd += 1.0
      statusEffects.cls_lastWishStrikes -= 1
      messages.push(`◇ Last Wish crit (${statusEffects.cls_lastWishStrikes} left).`)
    }
    // Distant Strike — t3c: +10% crit chance + +30% crit damage
    if (hasSkill(player, 'hollow_t3c')) {
      critChanceAdd += 0.10
      // The +30% crit damage is approximated by boosting dmgMult on crit later
      // (we set a flag the engine could read; for now: bump expected value)
      statusEffects.cls_distantStrikeBonus = true
    }
    // Final Verdict — t4c: <10% HP → ATK ×2
    if (hasSkill(player, 'hollow_t4c') && (statusEffects._enginePlayerHpPct || 1) < 0.10) {
      dmgMult *= 2.0
    }
    // The Empty One active: pierce all DEF
    if (statusEffects.cls_emptyOneTurns > 0) {
      defIgnoreFrac = 1.0
    }
    // All That Remains staged damage
    if (statusEffects.cls_allThatRemainsDamage > 0) {
      bonusFlatDmg += statusEffects.cls_allThatRemainsDamage
      statusEffects.cls_allThatRemainsDamage = 0
      messages.push('◇ All That Remains strikes.')
    }
    // Endless Hollow / Survivor's End staged damage
    if (statusEffects.cls_endlessHollowDamage > 0) {
      bonusFlatDmg += statusEffects.cls_endlessHollowDamage
      statusEffects.cls_endlessHollowDamage = 0
      messages.push('◇ Endless Hollow strikes.')
    }
    if (statusEffects.cls_survivorsEndDamage > 0) {
      bonusFlatDmg += statusEffects.cls_survivorsEndDamage
      statusEffects.cls_survivorsEndDamage = 0
      messages.push("◇ Survivor's End strikes.")
    }
  }

  // ════════ Devourer ══════════════════════════════════════════════════
  if (ac === 'devourer') {
    const hunger = statusEffects.cls_hunger || 0
    // Above Half (t3b): Hunger ≥ 50 → +15% damage
    if (hasSkill(player, 'devourer_t3b') && hunger >= 50) {
      dmgMult *= 1.15
    }
    // Fed State (t4b): Hunger ≥ 80 → +30% damage, +10% crit
    if (hasSkill(player, 'devourer_t4b') && hunger >= 80) {
      dmgMult *= 1.30
      critChanceAdd += 0.10
    }
    // Starvation (t5b): Hunger < 25 → guaranteed crits
    if (hasSkill(player, 'devourer_t5b') && hunger < 25) {
      critChanceAdd += 1.0
    }
    // Great Hunger active: +50% damage
    if (statusEffects.cls_greatHungerTurns > 0) {
      dmgMult *= 1.50
    }
    // Stomach Acid (t2c): +10% damage when you have any status on you
    if (hasSkill(player, 'devourer_t2c')) {
      const statusFields = ['burnTurns','poisonTurns','cls_bleedingTurns','cls_rotTurns','cls_silenceTurns','enemyStunTurns']
      const hasStatus = statusFields.some(k => (statusEffects[k] || 0) > 0)
      if (hasStatus) dmgMult *= 1.10
    }
    // Feast (t1a) accumulated ATK bonus
    if ((statusEffects.cls_feastATKGain || 0) > 0) {
      bonusFlatDmg += statusEffects.cls_feastATKGain
    }
    // Staged active damages:
    if (statusEffects.cls_cleansingDevourDamage > 0) {
      bonusFlatDmg += statusEffects.cls_cleansingDevourDamage
      statusEffects.cls_cleansingDevourDamage = 0
      messages.push('🦷 Cleansing Devour strikes.')
    }
    if (statusEffects.cls_lastCourseDamage > 0) {
      bonusFlatDmg += statusEffects.cls_lastCourseDamage
      statusEffects.cls_lastCourseDamage = 0
      messages.push('🦷 The Last Course strikes.')
    }
  }

  // ════════ Mourning King ═════════════════════════════════════════════
  if (ac === 'mourning_king') {
    const wake = statusEffects.cls_wakeStacks || 0
    // Old Wounds Speak (t1a): +1% damage per Wake stack
    if (hasSkill(player, 'mourning_king_t1a') && wake > 0) {
      dmgMult *= (1 + 0.01 * wake)
    }
    // Risen Edge (t2a): at 10+ Wake, basic strikes +8 radiant damage
    if (hasSkill(player, 'mourning_king_t2a') && wake >= 10) {
      bonusFlatDmg += 8
    }
    // Crown Heavy (t4a): at 20+ Wake → DEF bonus (already in DEF pool, but also adds to attack via Sovereign-style nope — this is purely DEF buff. Skip in attack.
    // Memory of Steel strikes
    if ((statusEffects.cls_memoryOfSteelStrikes || 0) > 0) {
      dmgMult *= 1.50
      statusEffects.cls_memoryOfSteelStrikes -= 1
      messages.push(`☠ Memory of Steel — strike +50% (${statusEffects.cls_memoryOfSteelStrikes} left).`)
    }
    // The Quiet Step: after Death Mark save, next strike deals (max HP) damage
    if (statusEffects.cls_quietStepReady) {
      const maxHp = player.hp_max || player.max_hp || 100
      bonusFlatDmg += maxHp
      statusEffects.cls_quietStepReady = false
      messages.push(`☠ The Quiet Step — ${maxHp} damage from grief.`)
    }
    // All Crowns Worn staged damage
    if (statusEffects.cls_allCrownsWornDamage > 0) {
      bonusFlatDmg += statusEffects.cls_allCrownsWornDamage
      statusEffects.cls_allCrownsWornDamage = 0
      messages.push('☠ All Crowns Worn strikes.')
    }
  }

  // ════════ Chimera ═══════════════════════════════════════════════════
  if (ac === 'chimera') {
    const form = statusEffects.cls_chimeraForm || 'beast'
    const stormlord = statusEffects.cls_stormlordTurns > 0
    const tempest = statusEffects.cls_tempestCounter >= 5
    // Beast form mods
    if (form === 'beast' || stormlord) {
      if (hasSkill(player, 'chimera_t1a')) dmgMult *= 1.20
      // Hunter's Claws (t3a) — accumulated
      if ((statusEffects.cls_huntersClawsBonus || 0) > 0) {
        dmgMult *= (1 + statusEffects.cls_huntersClawsBonus / 100)
      }
      // Bloodscent next strike
      if (statusEffects.cls_bloodscentNextCrit) {
        critChanceAdd += 1.0
        statusEffects.cls_bloodscentNextCrit = false
        messages.push('◎ Bloodscent — crit.')
      }
      // Predator's Lock (t5a): enemies <50% HP take +30%
      if (hasSkill(player, 'chimera_t5a') && (statusEffects._engineEnemyHpPct || 1) < 0.50) {
        dmgMult *= 1.30
      }
    }
    if (form === 'coil' || stormlord) {
      if (hasSkill(player, 'chimera_t1b')) dmgMult *= 0.85  // -15% ATK
    }
    if (form === 'storm' || stormlord) {
      // Random stat each turn — applied per-stat. Damage if 'atk'.
      if (hasSkill(player, 'chimera_t1c') && statusEffects.cls_stormRandomStat === 'atk') {
        dmgMult *= 1.30
      }
      // Random Strike (t3c): 33% chance per strike for +10 damage
      if (hasSkill(player, 'chimera_t3c') && Math.random() < 0.33) {
        bonusFlatDmg += 10
        messages.push('◎ Random Strike — +10.')
      }
    }
    // Tempest (t5c): every 5 turns in Storm, ALL form bonuses apply for 1 turn
    if (hasSkill(player, 'chimera_t5c') && tempest) {
      dmgMult *= 1.20  // Beast bonus added
      // (DEF mods applied in onPlayerHit)
    }
    // True Beast (t6a)
    if (statusEffects.cls_trueBeastTurns > 0) {
      dmgMult *= 1.50
    }
    // Coiled Spring (t5b): switching FROM Coil to Beast triggers heavy strike +50%
    if (statusEffects.cls_coiledSpringReady) {
      dmgMult *= 1.50
      statusEffects.cls_coiledSpringReady = false
      messages.push('◎ Coiled Spring — released.')
    }
  }

  // ════════ Unwritten ═════════════════════════════════════════════════
  if (ac === 'unwritten') {
    const abs = statusEffects.cls_absenceStacks || 0
    // Faded Memory (t2a): +5% damage on next strike per Absence stack
    if (hasSkill(player, 'unwritten_t2a') && abs > 0) {
      dmgMult *= (1 + 0.05 * abs)
      // Consume one stack on attack
      statusEffects.cls_absenceStacks = Math.max(0, abs - 1)
    }
    // Pre-emptive Strike (t2c): +5% if you have any Absence
    if (hasSkill(player, 'unwritten_t2c') && abs > 0) {
      dmgMult *= 1.05
    }
    // Refused Account (t4a): 5+ Absence: +30% damage, ignore 15% DEF
    if (hasSkill(player, 'unwritten_t4a') && abs >= 5) {
      dmgMult *= 1.30
      defIgnoreFrac = Math.max(defIgnoreFrac, 0.15)
    }
    // Cold Page (t4c): +20% vs enemies who lost a skill
    if (hasSkill(player, 'unwritten_t4c') && statusEffects.cls_emptyPageProc) {
      dmgMult *= 1.20
    }
    // No Such Person active: deal no damage
    if (statusEffects.cls_noSuchPersonTurns > 0) {
      dmgMult = 0
      messages.push('✎ No Such Person — your strike does not happen.')
    }
  }

  // ════════ Oathbreaker ═══════════════════════════════════════════════
  if (ac === 'oathbreaker') {
    const oath = statusEffects.cls_currentOath
    // Oath of Fury (t1a): +20% damage, -10% DEF
    if (oath === 'fury') dmgMult *= 1.20
    if (oath === 'fury_weak') dmgMult *= 1.10  // re-sworn weaker version
    // Oath of the Wall (t1b): -15% damage
    if (oath === 'wall') dmgMult *= 0.85
    // Oath of the Hunt (t1c): +10% crit
    if (oath === 'hunt') critChanceAdd += 0.10
    // Burning Oath (t3a): while Fury, 20% chance for +15 fire damage
    if (hasSkill(player, 'oathbreaker_t3a') && (oath === 'fury' || oath === 'fury_weak')
        && Math.random() < 0.20) {
      bonusFlatDmg += 15
      messages.push('🔥 Burning Oath — +15 fire damage.')
    }
    // Predator's Patience (t3c): while Hunt, +1% damage per turn elapsed
    if (hasSkill(player, 'oathbreaker_t3c') && oath === 'hunt') {
      const t = statusEffects.cls_turnsElapsed || 0
      if (t > 0) dmgMult *= (1 + 0.01 * t)
    }
    // Old Hunt (t5c): basic strikes ignore 25% DEF rest of combat
    if (statusEffects.cls_oldHuntActive) {
      defIgnoreFrac = Math.max(defIgnoreFrac, 0.25)
    }
    // Break: Fury staged damage
    if (statusEffects.cls_breakFuryDamage > 0) {
      bonusFlatDmg += statusEffects.cls_breakFuryDamage
      statusEffects.cls_breakFuryDamage = 0
      messages.push('⚔ Break: Fury strikes.')
    }
    // Break: Hunt: next attack guaranteed crit + DEF pierce
    if (statusEffects.cls_breakHuntReady) {
      critChanceAdd += 1.0
      defIgnoreFrac = Math.max(defIgnoreFrac, 1.0)
      statusEffects.cls_breakHuntReady = false
      messages.push('⚔ Break: Hunt strikes — all DEF pierced.')
    }
    // Final Oath: Wrath staged damage
    if (statusEffects.cls_finalOathWrathDamage > 0) {
      bonusFlatDmg += statusEffects.cls_finalOathWrathDamage
      statusEffects.cls_finalOathWrathDamage = 0
      messages.push('⚔ Final Oath: Wrath strikes.')
    }
    // Final Oath: Hunt: 5 strikes ×2 + pierce + crit
    if ((statusEffects.cls_finalOathHuntStrikes || 0) > 0) {
      dmgMult *= 2.0
      critChanceAdd += 1.0
      defIgnoreFrac = Math.max(defIgnoreFrac, 1.0)
      statusEffects.cls_finalOathHuntStrikes -= 1
      messages.push(`⚔ Final Oath: Hunt — ${statusEffects.cls_finalOathHuntStrikes} strikes left.`)
    }
  }

  // ════════ Silent Judge ══════════════════════════════════════════════
  if (ac === 'silent_judge') {
    const marks = statusEffects.cls_verdictMarks || 0
    // Deepened Sight (t2a): +2% damage per mark
    if (hasSkill(player, 'silent_judge_t2a') && marks > 0) {
      dmgMult *= (1 + 0.02 * marks)
    }
    // Calm Mind (t1c): 5+ marks → +20% damage
    if (hasSkill(player, 'silent_judge_t1c') && marks >= 5) {
      dmgMult *= 1.20
    }
    // Documented Weakness (t3a): 5+ marks → -25% effective enemy DEF
    if (hasSkill(player, 'silent_judge_t3a') && marks >= 5) {
      defIgnoreFrac = Math.max(defIgnoreFrac, 0.25)
    }
    // Closing Argument (t3c): 5+ marks → 10% chance +20 flat
    if (hasSkill(player, 'silent_judge_t3c') && marks >= 5 && Math.random() < 0.10) {
      bonusFlatDmg += 20
      messages.push('⚖ Closing Argument — +20.')
    }
    // Witness's Standing (t4a): 7+ marks → +15% crit
    if (hasSkill(player, 'silent_judge_t4a') && marks >= 7) {
      critChanceAdd += 0.15
    }
    // Full Witness (t5a): 10 marks → +50% damage
    if (hasSkill(player, 'silent_judge_t5a') && marks >= 10) {
      dmgMult *= 1.50
    }
    // Silent Court active: +100% damage
    if (statusEffects.cls_silentCourtTurns > 0) {
      dmgMult *= 2.0
    }
    // Staged active damages
    if (statusEffects.cls_renderVerdictDamage > 0) {
      bonusFlatDmg += statusEffects.cls_renderVerdictDamage
      statusEffects.cls_renderVerdictDamage = 0
      messages.push('⚖ Render Verdict strikes.')
    }
    if (statusEffects.cls_finalVerdictSJDamage > 0) {
      bonusFlatDmg += statusEffects.cls_finalVerdictSJDamage
      statusEffects.cls_finalVerdictSJDamage = 0
      messages.push('⚖ Final Verdict strikes.')
    }
  }

  // ════════ Dreadnought ═══════════════════════════════════════════════
  if (ac === 'dreadnought') {
    const armor = statusEffects.cls_armorStacks || 0
    // Armor Forms (t1a): +2% damage out per stack
    if (hasSkill(player, 'dreadnought_t1a') && armor > 0) {
      dmgMult *= (1 + 0.02 * armor)
    }
    // Steel Marrow (t2a): at 10+ Armor → +30% damage on basic strikes
    if (hasSkill(player, 'dreadnought_t2a') && armor >= 10) {
      dmgMult *= 1.30
    }
    // Standing Forward (t1c): +10% damage when YOUR HP% < enemy HP%
    if (hasSkill(player, 'dreadnought_t1c')) {
      const pHp = statusEffects._enginePlayerHpPct
      const eHp = statusEffects._engineEnemyHpPct
      if (typeof pHp === 'number' && typeof eHp === 'number' && pHp < eHp) {
        dmgMult *= 1.10
      }
    }
    // Crushing Step (t4a): at 15+ Armor → +25 flat damage
    if (hasSkill(player, 'dreadnought_t4a') && armor >= 15) {
      bonusFlatDmg += 25
    }
    // Final Hammer (t5a): at 20+ Armor → crits ×3 (instead of ×2). Approx via +50% on crit.
    if (hasSkill(player, 'dreadnought_t5a') && armor >= 20 && statusEffects._engineWasCrit) {
      dmgMult *= 1.5
    }
    // The Hammer Falls staged damage
    if ((statusEffects.cls_hammerFallsDamage || 0) > 0) {
      bonusFlatDmg += statusEffects.cls_hammerFallsDamage
      statusEffects.cls_hammerFallsDamage = 0
      messages.push('🛡 The Hammer Falls strikes.')
    }
    // The Inevitable active: per-turn strikes = max HP × 25%
    if (statusEffects.cls_theInevitableTurns > 0) {
      const maxHp = player.hp_max || player.max_hp || 100
      bonusFlatDmg += Math.round(maxHp * 0.25)
    }
    // Slow Tide (t4c): +50% damage on basic strikes
    if (hasSkill(player, 'dreadnought_t4c')) {
      dmgMult *= 1.50
    }
  }

  // ════════ Abyss Walker ══════════════════════════════════════════════
  if (ac === 'abyss_walker') {
    const depth = statusEffects.cls_depth || 0
    // Depth Begins (t1a): per Depth → +5% damage out
    if (hasSkill(player, 'abyss_walker_t1a') && depth > 0) {
      dmgMult *= (1 + 0.05 * depth)
    }
    // Crushing Depth (t3a): at Depth 5+ → ignore 25% enemy DEF
    if (hasSkill(player, 'abyss_walker_t3a') && depth >= 5) {
      defIgnoreFrac = Math.max(defIgnoreFrac, 0.25)
    }
    // Black Sun (t5a): at Depth 10 → +100% damage
    if (hasSkill(player, 'abyss_walker_t5a') && depth >= 10) {
      dmgMult *= 2.0
    }
    // The Hollow Sea active: per-turn max HP × 25% damage
    if (statusEffects.cls_hollowSeaTurns > 0) {
      const maxHp = player.hp_max || player.max_hp || 100
      bonusFlatDmg += Math.round(maxHp * 0.25)
    }
    // Quiet Path (t4c): at Depth 0 → next strike +50% damage
    if (hasSkill(player, 'abyss_walker_t4c') && depth === 0 && !statusEffects.cls_quietPathConsumed) {
      dmgMult *= 1.50
      statusEffects.cls_quietPathConsumed = true
      messages.push('◊ Quiet Path — surface strike +50%.')
    } else if (depth > 0) {
      // Reset the flag when we go back below
      statusEffects.cls_quietPathConsumed = false
    }
    // Beyond Light (t5c): at Depth 0 → +30% crit
    if (hasSkill(player, 'abyss_walker_t5c') && depth === 0) {
      critChanceAdd += 0.30
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

  // ── Dawnbringer ─────────────────────────────────────────────────────
  if (ac === 'dawnbringer') {
    // Searing Truth — t5b: radiant strikes also burn the enemy (3 turns, 5/turn)
    if (hasSkill(player, 'dawnbringer_t5b')) {
      statusEffects.burnTurns = Math.max(statusEffects.burnTurns || 0, 3)
      statusEffects.burnDmg = Math.max(statusEffects.burnDmg || 0, 5)
    }
    // Dawnward Light active: life-steal 50% of damage dealt for 5 turns
    if (statusEffects.cls_dawnwardLightTurns > 0) {
      healToPlayer += Math.round(damageDealt * 0.50)
    }
  }

  // ── Hollow ──────────────────────────────────────────────────────────
  if (ac === 'hollow') {
    // (no per-attack post effects currently — bonus damage handled in attack hook)
  }

  // ── Devourer ────────────────────────────────────────────────────────
  if (ac === 'devourer') {
    const hunger = statusEffects.cls_hunger || 0
    // Above Half (t3b): +5% lifesteal at Hunger ≥ 50
    let lifestealPct = 0
    if (hasSkill(player, 'devourer_t3b') && hunger >= 50) lifestealPct += 0.05
    // Fed State (t4b): +15% lifesteal at Hunger ≥ 80
    if (hasSkill(player, 'devourer_t4b') && hunger >= 80) lifestealPct += 0.15
    // Great Hunger active: +20% lifesteal (but heals blocked)
    if (statusEffects.cls_greatHungerTurns > 0) {
      // Skip lifesteal under Great Hunger (no heals allowed)
      lifestealPct = 0
    }
    if (lifestealPct > 0) {
      healToPlayer += Math.round(damageDealt * lifestealPct)
    }
    // Gnaw (t3a): 20% chance for +5 damage + 1% lifesteal
    if (hasSkill(player, 'devourer_t3a') && Math.random() < 0.20) {
      deferredDamage += 5
      healToPlayer += Math.round(damageDealt * 0.01)
    }
    // Devourer's Throat (t6c): every 3rd hit -2% enemy max HP cap (max -20%)
    if (hasSkill(player, 'devourer_t6c')) {
      statusEffects.cls_throatHitCounter = (statusEffects.cls_throatHitCounter || 0) + 1
      if (statusEffects.cls_throatHitCounter >= 3) {
        statusEffects.cls_throatHitCounter = 0
        const reduction = (statusEffects.cls_throatHpReduction || 0) + 0.02
        if (reduction <= 0.20) {
          statusEffects.cls_throatHpReduction = reduction
          messages.push(`🦷 Devourer's Throat — enemy max HP -2%.`)
        }
      }
    }
  }

  // ── Mourning King ───────────────────────────────────────────────────
  if (ac === 'mourning_king') {
    // Speak to the Dead (t4c): 25% chance to deal extra strike (60% damage)
    if (statusEffects.cls_speakToDeadTurns > 0 && Math.random() < 0.25) {
      const extra = Math.round(damageDealt * 0.60)
      deferredDamage += extra
      messages.push(`☠ Echo of the dead — +${extra} damage.`)
    }
    // Hollow Throne (t5a): vs enemies below 30% HP, 50% chance echo damage (2 turns)
    if (hasSkill(player, 'mourning_king_t5a')
        && (statusEffects._engineEnemyHpPct || 1) < 0.30
        && Math.random() < 0.50) {
      // Apply as bleed-equivalent (uses existing bleed system)
      statusEffects.cls_bleedingTurns = Math.max(statusEffects.cls_bleedingTurns || 0, 2)
      statusEffects.cls_bleedingDmg = Math.max(statusEffects.cls_bleedingDmg || 0, 8)
      messages.push('☠ Hollow Throne — echo strikes follow.')
    }
  }

  // ── Chimera ─────────────────────────────────────────────────────────
  if (ac === 'chimera') {
    // (form-based post effects on kill handled in onKill)
  }

  // ── Unwritten ───────────────────────────────────────────────────────
  if (ac === 'unwritten') {
    // Track last strike damage for Disowned Hit (3a)
    statusEffects.cls_lastStrikeDamage = damageDealt
    // Empty Page (t3c): 10% chance per strike to delete a random enemy skill
    // from their rotation. Real implementation: pick a random move from
    // enemy.moves (if it exists) and add to cls_deletedEnemySkills list.
    // enemyAI.js pickWeighted filters by these names.
    if (hasSkill(player, 'unwritten_t3c') && Math.random() < 0.10) {
      statusEffects.cls_emptyPageProc = true
      if (enemy && Array.isArray(enemy.moves) && enemy.moves.length > 0) {
        statusEffects.cls_deletedEnemySkills = statusEffects.cls_deletedEnemySkills || []
        // Pick a not-yet-deleted move
        const available = enemy.moves.filter(m =>
          m.name && !statusEffects.cls_deletedEnemySkills.includes(m.name))
        if (available.length > 0) {
          const pick = available[Math.floor(Math.random() * available.length)]
          statusEffects.cls_deletedEnemySkills.push(pick.name)
          messages.push(`✎ Empty Page — "${pick.name}" is forgotten.`)
        } else {
          messages.push('✎ Empty Page procs — but nothing left to forget.')
        }
      } else {
        // Fallback: enemy has no named moves array — use stun as proxy
        statusEffects.enemyStunTurns = Math.max(statusEffects.enemyStunTurns || 0, 1)
        messages.push('✎ Empty Page — a beat passes.')
      }
    }
  }

  // ── Silent Judge ────────────────────────────────────────────────────
  if (ac === 'silent_judge') {
    // Witness Strike (t1a): basic strikes place 1 Verdict mark (cap 10)
    if (hasSkill(player, 'silent_judge_t1a')) {
      let cap = 10
      // Eyes of Equilibrium active: +3 marks per strike instead of 1
      const eyes = statusEffects.cls_eyesOfEquilibriumTurns > 0
      const inc = eyes ? 3 : 1
      const oldMarks = statusEffects.cls_verdictMarks || 0
      statusEffects.cls_verdictMarks = Math.min(cap, oldMarks + inc)
      if (statusEffects.cls_verdictMarks > oldMarks) {
        messages.push(`⚖ Verdict marks — ${statusEffects.cls_verdictMarks}/10.`)
      }
    }
    // Full Witness (t5a): 10 marks → +10% life-steal on basic strikes
    if (hasSkill(player, 'silent_judge_t5a') && (statusEffects.cls_verdictMarks || 0) >= 10) {
      healToPlayer += Math.round(damageDealt * 0.10)
    }
    // Sentencing Cycle (t5c): at 10 marks, every 3rd basic strike auto-fires
    // a free Render Verdict. Base damage = marks × 30. Applies the same
    // mark-based multipliers a manually-cast Render Verdict would get when
    // it goes through onPlayerAttack (Deepened Sight +2%/mark, Calm Mind
    // +20% at 5+, Documented Weakness DEF-pierce, Full Witness +50% at 10).
    if (hasSkill(player, 'silent_judge_t5c') && (statusEffects.cls_verdictMarks || 0) >= 10) {
      statusEffects.cls_sentencingCycleCounter = (statusEffects.cls_sentencingCycleCounter || 0) + 1
      if (statusEffects.cls_sentencingCycleCounter >= 3) {
        statusEffects.cls_sentencingCycleCounter = 0
        const marks = statusEffects.cls_verdictMarks
        let damage = marks * 30
        // Mirror the multipliers the same player would get on a strike
        if (hasSkill(player, 'silent_judge_t2a')) damage *= (1 + 0.02 * marks)
        if (hasSkill(player, 'silent_judge_t1c')) damage *= 1.20   // Calm Mind (5+ marks)
        if (hasSkill(player, 'silent_judge_t5a')) damage *= 1.50   // Full Witness (10 marks)
        // Note: Documented Weakness DEF-pierce would only matter if the
        // engine subtracted DEF from this damage. Since deferredDamage
        // bypasses DEF entirely, the pierce is "free" — we just don't need
        // to apply it explicitly. (No bug, but flag for future refactor if
        // damage path becomes DEF-aware for class effects.)
        damage = Math.round(damage)
        deferredDamage += damage
        statusEffects.cls_verdictMarks = 0
        messages.push(`⚖ Sentencing Cycle — free Render Verdict: ${damage} damage.`)
      }
    }
  }

  // ── Abyss Walker ────────────────────────────────────────────────────
  if (ac === 'abyss_walker') {
    // First Tide (t1b): basic strikes apply 1 Drown stack (cap 5; 3 turns; 5 dmg/turn)
    if (hasSkill(player, 'abyss_walker_t1b')) {
      statusEffects.cls_drownStacks = Math.min(5, (statusEffects.cls_drownStacks || 0) + 1)
      statusEffects.cls_drownTurns = Math.max(statusEffects.cls_drownTurns || 0, 3)
      if (statusEffects.cls_drownStacks === 1) {
        messages.push('◊ Drown — 1 stack on enemy.')
      }
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

  // ── Nullborn ────────────────────────────────────────────────────────
  if (ac === 'nullborn') {
    // Read Error active: untargetable
    if (statusEffects.cls_readErrorTurns > 0) {
      dmgMult = 0
      messages.push('✕ Read Error — attack does not find you.')
      return { dmgMult, reflectAmount, messages }
    }
    // Null Form — t1a: each Null absorbs one full attack
    if (hasSkill(player, 'nullborn_t1a') && (statusEffects.cls_nullStacks || 0) > 0) {
      // Null God — t6a: at 15+ Null stacks, enemy attacks add 2 Null instead
      if (hasSkill(player, 'nullborn_t6a') && statusEffects.cls_nullStacks >= 15) {
        const cap = (hasSkill(player, 'nullborn_t4a')) ? 20 : 10
        statusEffects.cls_nullStacks = Math.min(cap, statusEffects.cls_nullStacks + 2)
        dmgMult = 0
        messages.push('✕ Null God — attack absorbed, +2 Null.')
        return { dmgMult, reflectAmount, messages }
      }
      // Otherwise: each Null absorbs the full attack
      statusEffects.cls_nullStacks -= 1
      statusEffects.cls_nullAbsorbedTotal = (statusEffects.cls_nullAbsorbedTotal || 0) + incomingDamage
      dmgMult = 0
      messages.push(`✕ Null absorbs the strike (${statusEffects.cls_nullStacks} stacks remain).`)
      return { dmgMult, reflectAmount, messages }
    }
    // Empty Record — t1b: enemy crits nullified (engine sets _engineWasCrit)
    if (hasSkill(player, 'nullborn_t1b') && statusEffects._engineWasCrit) {
      // Cancel crit bonus by dividing back the typical 1.5x boost
      dmgMult *= 1.0 / 1.5
      statusEffects._engineWasCrit = false
      messages.push('✕ Empty Record — crit nullified.')
    }
    // No Witness — t3b: cannot be afflicted with status (engine should
    // honor this when applying burn/bleed/mark/silence/stun). We set a flag.
    if (hasSkill(player, 'nullborn_t3b')) statusEffects.cls_noWitness = true
    // Cancel — t4b: build a "would die" save (engine reads cls_cancelReady)
    if (hasSkill(player, 'nullborn_t4b') && !statusEffects.cls_cancelUsed) {
      const wouldKill = incomingDamage >= playerMaxHp * (statusEffects._enginePlayerHpPct || 1)
      if (wouldKill) {
        const heal = (statusEffects.cls_nullStacks || 0) * 5
        statusEffects.cls_cancelUsed = true
        statusEffects.cls_nullStacks = 0
        statusEffects.cls_cancelHeal = heal
        statusEffects.cls_loyalGuardSavedHp = 1  // reuse 1-HP save signal
        dmgMult = 0
        messages.push(`✕ Cancel — survive at 1 HP, +${heal} from Null reserves.`)
      }
    }
    // Verdict Voided — t6c: on death emit Null pulse, survive at 1 HP
    if (hasSkill(player, 'nullborn_t6c') && !statusEffects.cls_verdictVoidedUsed) {
      const wouldKill = incomingDamage >= playerMaxHp * (statusEffects._enginePlayerHpPct || 1)
      if (wouldKill) {
        statusEffects.cls_verdictVoidedUsed = true
        statusEffects.cls_verdictVoidedDamage = Math.round(playerMaxHp * 0.5)
        statusEffects.cls_loyalGuardSavedHp = 1
        dmgMult = 0
        messages.push(`✕ Verdict Voided — pulse releases ${Math.round(playerMaxHp * 0.5)} damage. You stand.`)
      }
    }
  }

  // ── Error ───────────────────────────────────────────────────────────
  if (ac === 'error') {
    // Try/Catch — t3c: 3 turns reflect all damage
    if (statusEffects.cls_tryCatchTurns > 0) {
      reflectAmount += incomingDamage
      dmgMult = 0
      messages.push('⚠ Try/Catch — damage reflected.')
      return { dmgMult, reflectAmount, messages }
    }
    // Glitch DEF mult applied to incoming
    if (hasSkill(player, 'error_t1a')) {
      const defMult = statusEffects.cls_glitchDefMult || 1
      // High DEF = less damage. Inverse multiplier on incoming.
      dmgMult *= 1.0 / defMult
    }
    // Compile-Time Error — t6a: +3× DEF (third of incoming)
    if (statusEffects.cls_compileTimeErrorTurns > 0) dmgMult *= 0.33
    // Memory Leak — t1b: +5 SP and -5 HP from taking damage
    if (hasSkill(player, 'error_t1b')) {
      statusEffects.cls_bonusSP = (statusEffects.cls_bonusSP || 0) + 5
      // Format String — t4b: also heal 10 HP from the +5 SP gain
      if (hasSkill(player, 'error_t4b')) {
        // net effect: -5 HP from damage already taken + 10 HP heal = +5 HP net
        statusEffects.cls_memoryLeakNetHeal = (statusEffects.cls_memoryLeakNetHeal || 0) + 10
      }
      // The -5 HP is implicit (regular damage stays); don't deduct separately.
      messages.push('⚠ Memory Leak — +5 SP.')
    }
    // Heap Spray — t2b: 10% chance of 50 random damage (proc per damage event)
    if (hasSkill(player, 'error_t2b') && Math.random() < 0.10) {
      const toEnemy = Math.random() < 0.5
      if (toEnemy) {
        reflectAmount += 50
        messages.push('⚠ Heap Spray — 50 damage thrown at enemy.')
      } else {
        // The damage to self happens via dmgMult: bump it
        dmgMult *= 1 + (50 / Math.max(1, incomingDamage))
        messages.push('⚠ Heap Spray — 50 damage thrown at SELF.')
      }
    }
  }

  // ── Prime ───────────────────────────────────────────────────────────
  if (ac === 'prime') {
    // Crown's Weight — t1c: basic strikes ALSO reduce enemy ATK (applied when
    // YOU strike, not when you're hit — so no-op here)
    // Authority Pulse — t2c: every 3rd turn, DEF doubles
    if (hasSkill(player, 'prime_t2c') && (statusEffects.cls_authorityPulseTurn || 0) >= 2) {
      dmgMult *= 0.5
      messages.push('👑 Authority Pulse — doubled DEF this turn.')
    }
    // Throneborn — t4a: at 5+ turns alive, +30% DEF
    if (hasSkill(player, 'prime_t4a') && (statusEffects.cls_primeTurnsAlive || 0) >= 5) {
      dmgMult *= 0.77  // approximate the +30% DEF effect on incoming damage
    }
    // Unyielding Standard — t4b: +1% damage permanently on hit (cap +50%)
    if (hasSkill(player, 'prime_t4b')) {
      statusEffects.cls_primeUnyieldingPct = Math.min(50, (statusEffects.cls_primeUnyieldingPct || 0) + 1)
    }
    // Empyrean — t5c: on death, survive at 1 HP + bonus to all stacks
    if (hasSkill(player, 'prime_t5c') && !statusEffects.cls_empyreanUsed) {
      const wouldKill = incomingDamage >= playerMaxHp * (statusEffects._enginePlayerHpPct || 1)
      if (wouldKill) {
        statusEffects.cls_empyreanUsed = true
        statusEffects.cls_primeATKGain = (statusEffects.cls_primeATKGain || 0) + 50
        statusEffects.cls_primeDEFGain = (statusEffects.cls_primeDEFGain || 0) + 50
        statusEffects.cls_primeSPDGain = (statusEffects.cls_primeSPDGain || 0) + 50
        statusEffects.playerATKBonus = (statusEffects.playerATKBonus || 0) + 50
        statusEffects.playerDEFBonus = (statusEffects.playerDEFBonus || 0) + 50
        statusEffects.playerSPDBonus = (statusEffects.playerSPDBonus || 0) + 50
        statusEffects.cls_loyalGuardSavedHp = 1
        dmgMult = 0
        messages.push('👑 Empyrean — the throne does not fall. +50 to all stacks.')
      }
    }
  }

  // ── Bastion ─────────────────────────────────────────────────────────
  if (ac === 'bastion') {
    // Living Wall active: 3 turns of zero damage, attacks add Bulwark
    if (statusEffects.cls_livingWallTurns > 0) {
      const cap = statusEffects.cls_bulwarkCap || 10
      statusEffects.cls_bulwarkStacks = Math.min(cap, (statusEffects.cls_bulwarkStacks || 0) + 2)
      dmgMult = 0
      messages.push('🛡 Living Wall — absorbed. +2 Bulwark.')
      return { dmgMult, reflectAmount, messages }
    }
    // Bulwark — t1a: each stack = -5% incoming damage
    if (hasSkill(player, 'bastion_t1a')) {
      const stacks = statusEffects.cls_bulwarkStacks || 0
      if (stacks > 0) dmgMult *= (1 - 0.05 * stacks)
    }
    // Reflection — t3b: stacks reflect damage (stacks × 2)
    if (hasSkill(player, 'bastion_t3b')) {
      reflectAmount += (statusEffects.cls_bulwarkStacks || 0) * 2
    }
    // Mirror Wall — t5b: stacks × 1% of damage reflects
    if (hasSkill(player, 'bastion_t5b')) {
      reflectAmount += Math.round(incomingDamage * 0.01 * (statusEffects.cls_bulwarkStacks || 0))
    }
    // Reinforce — t3a: every other hit grants +1 Bulwark
    if (hasSkill(player, 'bastion_t3a')) {
      statusEffects.cls_reinforceCounter = (statusEffects.cls_reinforceCounter || 0) + 1
      if (statusEffects.cls_reinforceCounter >= 2) {
        statusEffects.cls_reinforceCounter = 0
        const cap = statusEffects.cls_bulwarkCap || 10
        statusEffects.cls_bulwarkStacks = Math.min(cap, (statusEffects.cls_bulwarkStacks || 0) + 1)
      }
    }
    // Punishing Counter — t4b: 30% chance to fully deflect
    if (hasSkill(player, 'bastion_t4b') && Math.random() < 0.30) {
      dmgMult = 0
      messages.push('🛡 Punishing Counter — attack deflected.')
    }
    // Sanctified Ground — t6c: <30% HP → immune to status + halved damage
    if (hasSkill(player, 'bastion_t6c') && (statusEffects._enginePlayerHpPct || 1) < 0.30) {
      dmgMult *= 0.5
      statusEffects.cls_noWitness = true
    }
    // Steady — t1c: full HP → immune to stun/silence
    if (hasSkill(player, 'bastion_t1c') && (statusEffects._enginePlayerHpPct || 1) >= 0.99) {
      statusEffects.enemyStunResist = true
    }
    // Iron Stance — t4a: 5+ Bulwark → immune to knockback/displacement
    // (Engine doesn't have displacement; this is a flag for future use.)
    if (hasSkill(player, 'bastion_t4a') && (statusEffects.cls_bulwarkStacks || 0) >= 5) {
      statusEffects.cls_immuneDisplacement = true
    }
  }

  // ── Dawnbringer ─────────────────────────────────────────────────────
  if (ac === 'dawnbringer') {
    // Healing Veil — t3c: taking damage triggers 8% max HP heal (once/turn)
    if (hasSkill(player, 'dawnbringer_t3c') && !statusEffects.cls_healingVeilUsedThisTurn) {
      statusEffects.cls_healingVeilUsedThisTurn = true
      statusEffects.cls_healingVeilHeal = Math.round(playerMaxHp * 0.08)
      // Resurgence — t4a: doubled healing under 40% HP
      if (hasSkill(player, 'dawnbringer_t4a') && (statusEffects._enginePlayerHpPct || 1) < 0.40) {
        statusEffects.cls_healingVeilHeal *= 2
      }
      messages.push(`☀ Healing Veil — +${statusEffects.cls_healingVeilHeal} HP.`)
    }
    // Eternal Vigil — t6c: on would-die, restored to 50% + max Sun stacks (once)
    if (hasSkill(player, 'dawnbringer_t6c') && !statusEffects.cls_eternalVigilUsed) {
      const wouldKill = incomingDamage >= playerMaxHp * (statusEffects._enginePlayerHpPct || 1)
      if (wouldKill) {
        statusEffects.cls_eternalVigilUsed = true
        statusEffects.cls_eternalVigilHeal = Math.round(playerMaxHp * 0.50)
        statusEffects.cls_sunStacks = 10
        statusEffects.cls_loyalGuardSavedHp = 1
        dmgMult = 0
        messages.push('☀ Eternal Vigil — the sun rises again. +50% HP, max Sun.')
      }
    }
  }

  // ── Hollow ──────────────────────────────────────────────────────────
  if (ac === 'hollow') {
    // Disappear / Empty One: untargetable
    if (statusEffects.cls_disappearTurns > 0 || statusEffects.cls_emptyOneTurns > 0) {
      dmgMult = 0
      messages.push('◇ Hollow — they cannot find you.')
      return { dmgMult, reflectAmount, messages }
    }
    // Hollowed — t1a: +1 Void stack on damage (max 10)
    if (hasSkill(player, 'hollow_t1a')) {
      statusEffects.cls_voidStacks = Math.min(10, (statusEffects.cls_voidStacks || 0) + 1)
    }
    // Drifted — t4a: at 8+ Void, 30% dodge
    if (hasSkill(player, 'hollow_t4a') && (statusEffects.cls_voidStacks || 0) >= 8) {
      if (Math.random() < 0.30) {
        dmgMult = 0
        messages.push('◇ Drifted — the strike passes through nothing.')
        return { dmgMult, reflectAmount, messages }
      }
    }
    // Mourner's Pace — t2b: <50% HP → SPD doubles (engine handles SPD elsewhere; flag here)
    if (hasSkill(player, 'hollow_t2b') && (statusEffects._enginePlayerHpPct || 1) < 0.50) {
      statusEffects.cls_mournersPaceActive = true
    }
    // Mourner's Weight — t5b: <30% HP → damage halved
    if (hasSkill(player, 'hollow_t5b') && (statusEffects._enginePlayerHpPct || 1) < 0.30) {
      dmgMult *= 0.5
    }
    // Cold Comfort — t3b: taking damage applies -5% enemy ATK (stacks)
    if (hasSkill(player, 'hollow_t3b')) {
      const cap = 0.50  // cap so it doesn't reduce enemy to nothing
      statusEffects.cls_coldComfortDebuff = Math.min(cap, (statusEffects.cls_coldComfortDebuff || 0) + 0.05)
      statusEffects.enemyATKMult = (statusEffects.enemyATKMult || 1.0) * (1 - 0.05)
    }
    // Last Wish — t1c: at <25% HP, once/combat → next 3 strikes guaranteed crit
    if (hasSkill(player, 'hollow_t1c') && !statusEffects.cls_lastWishTriggered) {
      const hpPct = statusEffects._enginePlayerHpPct
      if (typeof hpPct === 'number' && hpPct < 0.25) {
        statusEffects.cls_lastWishTriggered = true
        statusEffects.cls_lastWishStrikes = 3
        messages.push('◇ Last Wish — three crits remain.')
      }
    }
    // Final Verdict — t4c: +50% damage taken under 10% HP (offsetting bonus)
    if (hasSkill(player, 'hollow_t4c') && (statusEffects._enginePlayerHpPct || 1) < 0.10) {
      dmgMult *= 1.50
    }
    // One Last Stand — t2c: first would-die per combat, ignore damage
    if (hasSkill(player, 'hollow_t2c') && !statusEffects.cls_oneLastStandUsed) {
      const wouldKill = incomingDamage >= playerMaxHp * (statusEffects._enginePlayerHpPct || 1)
      if (wouldKill) {
        statusEffects.cls_oneLastStandUsed = true
        dmgMult = 0
        messages.push('◇ One Last Stand — the fall does not happen.')
      }
    }
  }

  // ── Devourer ────────────────────────────────────────────────────────
  if (ac === 'devourer') {
    // Hunger Builds (t2b): taking damage adds Hunger = (damage / 5)
    if (hasSkill(player, 'devourer_t2b')) {
      const gain = Math.round(incomingDamage / 5)
      statusEffects.cls_hunger = Math.min(100, (statusEffects.cls_hunger || 0) + gain)
    }
    // Hardened Lining (t3c): 5% damage resistance per status on you (max 25%)
    if (hasSkill(player, 'devourer_t3c')) {
      const statusFields = ['burnTurns','poisonTurns','cls_bleedingTurns','cls_rotTurns','cls_silenceTurns']
      const count = statusFields.filter(k => (statusEffects[k] || 0) > 0).length
      const resist = Math.min(0.25, count * 0.05)
      if (resist > 0) dmgMult *= (1 - resist)
    }
    // Starvation (t5b): take 30% LESS damage at Hunger < 25 (offsetting bonus crit)
    if (hasSkill(player, 'devourer_t5b') && (statusEffects.cls_hunger || 0) < 25) {
      dmgMult *= 0.70
    }
    // Maw of the Survivor (t5a): on death, instant strike at enemy. Kill→survive at 1
    if (hasSkill(player, 'devourer_t5a') && !statusEffects.cls_mawOfSurvivorUsed) {
      const wouldKill = incomingDamage >= playerMaxHp * (statusEffects._enginePlayerHpPct || 1)
      if (wouldKill) {
        statusEffects.cls_mawOfSurvivorUsed = true
        statusEffects.cls_mawOfSurvivorPending = true
        statusEffects.cls_loyalGuardSavedHp = 1  // reuse 1-HP save signal
        dmgMult = 0
        messages.push('🦷 Maw of the Survivor — one last bite.')
      }
    }
  }

  // ── Mourning King ───────────────────────────────────────────────────
  if (ac === 'mourning_king') {
    // Death Mark (t2c): lethal damage leaves you at 1 HP, once per 24h.
    // Combined gate: cls_deathMarkUsed prevents re-triggering within the
    // same combat; is24hReady() prevents re-use across combats within 24h.
    if (hasSkill(player, 'mourning_king_t2c')
        && !statusEffects.cls_deathMarkUsed
        && is24hReady(player.mourning_king_death_mark_at)) {
      const wouldKill = incomingDamage >= playerMaxHp * (statusEffects._enginePlayerHpPct || 1)
      if (wouldKill) {
        statusEffects.cls_deathMarkUsed = true
        statusEffects.cls_deathMarkConsumed = true  // for DB write
        statusEffects.cls_loyalGuardSavedHp = 1
        // The Quiet Step (5c): next strike deals max HP damage
        if (hasSkill(player, 'mourning_king_t5c')) {
          statusEffects.cls_quietStepReady = true
        }
        dmgMult = 0
        messages.push('☠ Death Mark — you do not fall today.')
      }
    }
    // Wakeful (t3c): <30% HP → +1 Wake per turn (handled in onTurnEnd)
    // Crown Heavy (t4a): at 20+ Wake → DEF +5 per stack above 20
    if (hasSkill(player, 'mourning_king_t4a') && (statusEffects.cls_wakeStacks || 0) > 20) {
      // Translate to incoming damage reduction
      const extraDEF = (statusEffects.cls_wakeStacks - 20) * 5
      const def = (player.def || 2) + (statusEffects.playerDEFBonus || 0) + extraDEF
      // Approximation: extraDEF adds to soak. Convert to a 1% damage reduction per 2 DEF added
      dmgMult *= Math.max(0.30, 1 - (extraDEF / 200))
    }
    // Empty Throne (t6c): on death, enemy takes 100% their max HP, both die
    if (hasSkill(player, 'mourning_king_t6c') && !statusEffects.cls_emptyThroneUsed) {
      const wouldKill = incomingDamage >= playerMaxHp * (statusEffects._enginePlayerHpPct || 1)
      if (wouldKill) {
        statusEffects.cls_emptyThroneUsed = true
        statusEffects.cls_emptyThronePending = true  // engine reads + kills enemy
        // Player dies anyway — we don't block the damage
        messages.push('☠ Empty Throne — we go together.')
      }
    }
  }

  // ── Chimera ─────────────────────────────────────────────────────────
  if (ac === 'chimera') {
    const form = statusEffects.cls_chimeraForm || 'beast'
    const stormlord = statusEffects.cls_stormlordTurns > 0
    const eternalCoil = statusEffects.cls_eternalCoilTurns > 0
    // Beast form: -10% DEF (incoming +10%)
    if ((form === 'beast' || stormlord) && hasSkill(player, 'chimera_t1a')) {
      dmgMult *= 1.10  // Worse DEF in Beast
    }
    // Coil form: +30% DEF (incoming /1.30 = approximate 23% reduction)
    if (form === 'coil' || stormlord || eternalCoil) {
      if (hasSkill(player, 'chimera_t1b')) {
        const ironHide = hasSkill(player, 'chimera_t3b') && (statusEffects._enginePlayerHpPct || 1) < 0.50
        const def_mult = ironHide ? 1.40 : 1.30
        dmgMult *= (1 / def_mult)
      }
    }
    // Storm form: random stat. If 'def' rolled, +30% DEF
    if ((form === 'storm' || stormlord) && hasSkill(player, 'chimera_t1c')
        && statusEffects.cls_stormRandomStat === 'def') {
      dmgMult *= (1 / 1.30)
    }
    // Eternal Coil active: damage capped at 20% max HP per hit
    if (eternalCoil) {
      const cap = Math.round(playerMaxHp * 0.20)
      if (incomingDamage * dmgMult > cap) {
        dmgMult = cap / Math.max(1, incomingDamage)
        messages.push('◎ Eternal Coil — damage capped.')
      }
    }
    // Tempest (t5c): every 5 turns, all form bonuses simultaneously
    if (hasSkill(player, 'chimera_t5c') && statusEffects.cls_tempestCounter >= 5) {
      // Applies Coil DEF bonus in addition to whatever form gave
      dmgMult *= (1 / 1.30)
    }
  }

  // ── Unwritten ───────────────────────────────────────────────────────
  if (ac === 'unwritten') {
    // No Such Person active: 5 turns immune. Track avoided damage for ultimate.
    if (statusEffects.cls_noSuchPersonTurns > 0) {
      statusEffects.cls_noSuchPersonAvoidedDamage = (statusEffects.cls_noSuchPersonAvoidedDamage || 0) + incomingDamage
      dmgMult = 0
      messages.push('✎ No Such Person — they cannot reach you.')
      return { dmgMult, reflectAmount, messages }
    }
    // Quiet Disagreement (t2b): 10% chance enemy "doesn't remember" attacking
    // — heal back half the damage
    if (hasSkill(player, 'unwritten_t2b') && Math.random() < 0.10) {
      const healBack = Math.round(incomingDamage * 0.5)
      statusEffects.cls_quietDisagreementHeal = (statusEffects.cls_quietDisagreementHeal || 0) + healBack
      messages.push(`✎ Quiet Disagreement — ${healBack} HP restored.`)
    }
    // The Disremembered (t5c): at 8+ Absence, 25% chance enemy action erased mid-cast
    if (hasSkill(player, 'unwritten_t5c') && (statusEffects.cls_absenceStacks || 0) >= 8
        && Math.random() < 0.25) {
      dmgMult = 0
      messages.push('✎ The Disremembered — their action was never completed.')
    }
    // Track last damage taken for Erasure
    statusEffects.cls_lastDamageTaken = incomingDamage
  }

  // ── Oathbreaker ─────────────────────────────────────────────────────
  if (ac === 'oathbreaker') {
    const oath = statusEffects.cls_currentOath
    // Oath of Fury (t1a): -10% DEF (incoming +10%)
    if (oath === 'fury' || oath === 'fury_weak') dmgMult *= 1.10
    // Oath of the Wall (t1b): +25% DEF (incoming /1.25)
    if (oath === 'wall') dmgMult *= 0.80
    // Oath of the Hunt (t1c): -10% DEF (incoming +10%)
    if (oath === 'hunt') dmgMult *= 1.10
    // Restoration (t5b): next 3 enemy attacks after breaking Wall: -50%
    if ((statusEffects.cls_wallRestorationCount || 0) > 0) {
      dmgMult *= 0.5
      statusEffects.cls_wallRestorationCount -= 1
      messages.push(`⚔ Restoration — incoming halved (${statusEffects.cls_wallRestorationCount} left).`)
    }
    // Final Oath: Sanctuary +50 DEF for 5 turns (handled in stats; here add small reduce)
    if (statusEffects.cls_finalOathDEFBonusTurns > 0) {
      dmgMult *= 0.75
    }
  }

  // ── Silent Judge ────────────────────────────────────────────────────
  if (ac === 'silent_judge') {
    const marks = statusEffects.cls_verdictMarks || 0
    // Witness Strike (t1a): -2% incoming per mark
    if (hasSkill(player, 'silent_judge_t1a') && marks > 0) {
      dmgMult *= (1 - 0.02 * marks)
    }
    // Stillness (t3b): at 7+ marks, 20% chance to fully evade
    if (hasSkill(player, 'silent_judge_t3b') && marks >= 7 && Math.random() < 0.20) {
      dmgMult = 0
      messages.push('⚖ Stillness — you anticipated the strike.')
      return { dmgMult, reflectAmount, messages }
    }
    // Truth Weighs (t4c): at 7+ marks, DEF effectively doubles
    if (hasSkill(player, 'silent_judge_t4c') && marks >= 7) {
      dmgMult *= 0.5
    }
    // The Quiet Court active: no status applied
    if (statusEffects.cls_quietCourtTurns > 0) {
      statusEffects.cls_noWitness = true
    }
    // Eyes of Equilibrium active: -50% incoming
    if (statusEffects.cls_eyesOfEquilibriumTurns > 0) {
      dmgMult *= 0.5
    }
  }

  // ── Dreadnought ─────────────────────────────────────────────────────
  if (ac === 'dreadnought') {
    // Walking Tomb active: cannot die — clamp incoming damage
    if (statusEffects.cls_walkingTombTurns > 0) {
      // The actual "cannot die" check happens in engine; we just signal
      statusEffects.cls_loyalGuardSavedHp = 1
      messages.push('🛡 Walking Tomb — death is not permitted.')
    }
    // One Step More active: immune to damage
    if (statusEffects.cls_oneStepMoreTurns > 0) {
      dmgMult = 0
      messages.push('🛡 One Step More — they cannot reach you.')
      return { dmgMult, reflectAmount, messages }
    }
    // Wall of Flesh (t4b): at 15+ Armor: cap damage at 30% max HP per hit
    if (hasSkill(player, 'dreadnought_t4b') && (statusEffects.cls_armorStacks || 0) >= 15) {
      const cap = Math.round(playerMaxHp * 0.30)
      if (incomingDamage * dmgMult > cap) {
        dmgMult = cap / Math.max(1, incomingDamage)
        messages.push('🛡 Wall of Flesh — damage capped.')
      }
    }
    // Armor Forms (t1a): -3% incoming damage per stack
    if (hasSkill(player, 'dreadnought_t1a')) {
      const armor = statusEffects.cls_armorStacks || 0
      if (armor > 0) dmgMult *= (1 - 0.03 * armor)
    }
    // Build Armor stacks from taking damage
    if (hasSkill(player, 'dreadnought_t1a')) {
      const cap = statusEffects.cls_armorCap || 15
      const inc = hasSkill(player, 'dreadnought_t2b') ? 2 : 1  // Slow Bleed = 2/hit
      const old = statusEffects.cls_armorStacks || 0
      statusEffects.cls_armorStacks = Math.min(cap, old + inc)
      // Hammerhand (t3a): every 5 stacks gained → +1 SP
      if (hasSkill(player, 'dreadnought_t3a')) {
        const prevTier = Math.floor(old / 5)
        const newTier = Math.floor(statusEffects.cls_armorStacks / 5)
        if (newTier > prevTier) {
          statusEffects.cls_bonusSP = (statusEffects.cls_bonusSP || 0) + (newTier - prevTier)
        }
      }
    }
  }

  // ── Abyss Walker ────────────────────────────────────────────────────
  if (ac === 'abyss_walker') {
    const depth = statusEffects.cls_depth || 0
    // Inverted Light (t4a): at Depth 5+ → incoming damage halved
    // (REPLACES the +2% per Depth from t1a)
    if (hasSkill(player, 'abyss_walker_t4a') && depth >= 5) {
      dmgMult *= 0.5
    } else if (hasSkill(player, 'abyss_walker_t1a') && depth > 0) {
      // Depth Begins (t1a): +2% damage in per Depth
      dmgMult *= (1 + 0.02 * depth)
    }
    // Beyond Light (t5c): at Depth 0 → +30% DEF
    if (hasSkill(player, 'abyss_walker_t5c') && depth === 0) {
      dmgMult *= (1 / 1.30)
    }
    // The Hollow Sea active: +100% damage in
    if (statusEffects.cls_hollowSeaTurns > 0) {
      dmgMult *= 2.0
    }
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

  // Fatal Exception — Error t6c: instant-kill if <50% HP; else you die.
  // The "you die" half is handled at active-skill time (engine sees the
  // signal and applies the cost). We resolve the instant-kill here.
  if (!executeKill && statusEffects.cls_fatalExceptionReady) {
    if (enemyHpPct < 0.50) {
      executeKill = true
      messages.push('⚠ Fatal Exception — caught the bug.')
    } else {
      messages.push('⚠ Fatal Exception — uncaught. You die.')
      statusEffects.cls_fatalExceptionSelfKill = true  // engine sets HP=0
    }
    statusEffects.cls_fatalExceptionReady = false
  }

  // Last Mercy — Mourning King t6b: marked enemy executes on next strike
  if (!executeKill && statusEffects.cls_lastMercyExecuteMark) {
    executeKill = true
    statusEffects.cls_lastMercyExecuteMark = false
    messages.push('☠ Last Mercy — the kindness ends them.')
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

  // ── Error ───────────────────────────────────────────────────────────
  if (ac === 'error') {
    // Stack Overflow — t1c: kills double your next basic strike damage
    if (hasSkill(player, 'error_t1c')) {
      statusEffects.cls_stackOverflowReady = true
      messages.push('⚠ Stack Overflow — next strike doubled.')
    }
  }

  // ── Dawnbringer ─────────────────────────────────────────────────────
  if (ac === 'dawnbringer') {
    // Light's Restoration — t5a: kills heal to full (once per combat)
    if (hasSkill(player, 'dawnbringer_t5a') && !statusEffects.cls_lightsRestorationUsed) {
      statusEffects.cls_lightsRestorationUsed = true
      statusEffects.cls_killHeal = (statusEffects.cls_killHeal || 0) + 99999  // engine clamps to maxHp
      messages.push("☀ Light's Restoration — fully restored.")
    }
  }

  // ── Devourer ────────────────────────────────────────────────────────
  if (ac === 'devourer') {
    // Feast (t1a): kills restore 20% max HP and +5 ATK permanent for combat
    if (hasSkill(player, 'devourer_t1a')) {
      const maxHp = player.hp_max || player.max_hp || 100
      const heal = Math.round(maxHp * 0.20)
      statusEffects.cls_killHeal = (statusEffects.cls_killHeal || 0) + heal
      statusEffects.cls_feastATKGain = (statusEffects.cls_feastATKGain || 0) + 5
      messages.push(`🦷 Feast — +${heal} HP, +5 ATK.`)
    }
    // Bone Marrow (t2a): kills also restore 10% max SP (via cls_bonusSP)
    if (hasSkill(player, 'devourer_t2a')) {
      const maxSP = player.sp_max || 100
      statusEffects.cls_bonusSP = (statusEffects.cls_bonusSP || 0) + Math.round(maxSP * 0.10)
    }
    // Ravenous Bite (t4a): kills reset all skill cooldowns
    if (hasSkill(player, 'devourer_t4a') && statusEffects.skillCooldowns) {
      for (const k of Object.keys(statusEffects.skillCooldowns)) {
        statusEffects.skillCooldowns[k] = 0
      }
      messages.push('🦷 Ravenous Bite — cooldowns reset.')
    }
  }

  // ── Chimera ─────────────────────────────────────────────────────────
  if (ac === 'chimera') {
    const form = statusEffects.cls_chimeraForm || 'beast'
    // Hunter's Claws (t3a): kills in Beast → +5% damage permanent for combat
    if (hasSkill(player, 'chimera_t3a') && (form === 'beast' || statusEffects.cls_stormlordTurns > 0)) {
      statusEffects.cls_huntersClawsBonus = (statusEffects.cls_huntersClawsBonus || 0) + 5
      messages.push(`◎ Hunter's Claws — +5% damage.`)
    }
    // Bloodscent (t4a): kills in Beast → next strike guaranteed crit
    if (hasSkill(player, 'chimera_t4a') && (form === 'beast' || statusEffects.cls_stormlordTurns > 0)) {
      statusEffects.cls_bloodscentNextCrit = true
      messages.push('◎ Bloodscent — next strike guaranteed crit.')
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

  // ── Nullborn ────────────────────────────────────────────────────────
  if (ac === 'nullborn') {
    // Mass Null — t4a: +2 Null per turn (cap raised to 20)
    if (hasSkill(player, 'nullborn_t4a')) {
      statusEffects.cls_nullStacks = Math.min(20, (statusEffects.cls_nullStacks || 0) + 2)
    }
    if (statusEffects.cls_readErrorTurns > 0) statusEffects.cls_readErrorTurns--
  }

  // ── Error ───────────────────────────────────────────────────────────
  if (ac === 'error') {
    // Glitch — t1a: roll new multipliers each turn. Pool: ATK, DEF, SPD.
    // One stat gets ×3, another ×1/3. Stable Variant (t3a) makes it only ONE.
    // Hot Patch (t4a) below 30% HP makes both rolls positive.
    // Refactor (t5a) lets player pick the buffed stat (we just default to ATK).
    if (hasSkill(player, 'error_t1a')) {
      const stats = ['Atk', 'Def', 'Spd']
      // Reset
      statusEffects.cls_glitchAtkMult = 1
      statusEffects.cls_glitchDefMult = 1
      statusEffects.cls_glitchSpdMult = 1
      const hotPatch = hasSkill(player, 'error_t4a') && (statusEffects._enginePlayerHpPct || 1) < 0.30
      const stable = hasSkill(player, 'error_t3a')
      const refactor = hasSkill(player, 'error_t5a')
      // Pick buffed stat
      const buffStat = refactor ? 'Atk' : stats[Math.floor(Math.random() * 3)]
      statusEffects['cls_glitch' + buffStat + 'Mult'] = 3
      // Pick downgraded stat (skip if hot patch, skip if stable variant)
      if (!hotPatch && !stable) {
        let pool = stats.filter(s => s !== buffStat)
        const downStat = pool[Math.floor(Math.random() * pool.length)]
        statusEffects['cls_glitch' + downStat + 'Mult'] = 1/3
        messages.push(`⚠ Glitch — ${buffStat} × 3, ${downStat} ÷ 3.`)
      } else {
        messages.push(`⚠ Glitch — ${buffStat} × 3 (no downgrade).`)
      }
    }
    if (statusEffects.cls_tryCatchTurns > 0)       statusEffects.cls_tryCatchTurns--
    if (statusEffects.cls_compileTimeErrorTurns > 0) statusEffects.cls_compileTimeErrorTurns--
    // Apply Memory Leak net heal
    if ((statusEffects.cls_memoryLeakNetHeal || 0) > 0) {
      healToPlayer += statusEffects.cls_memoryLeakNetHeal
      statusEffects.cls_memoryLeakNetHeal = 0
    }
    // Apply Garbage Collection heal (50% max HP)
    if (statusEffects.cls_garbageCollectionHeal) {
      const maxHp = player.hp_max || player.max_hp || 100
      healToPlayer += Math.round(maxHp * 0.50)
      statusEffects.cls_garbageCollectionHeal = false
      messages.push('⚠ Garbage Collection — +50% max HP heal.')
    }
  }

  // ── Prime ───────────────────────────────────────────────────────────
  if (ac === 'prime') {
    statusEffects.cls_primeTurnsAlive = (statusEffects.cls_primeTurnsAlive || 0) + 1
    const marchForever = hasSkill(player, 'prime_t5b')
                     && (statusEffects._enginePlayerHpPct || 1) < 0.30
    const mult = marchForever ? 2 : 1
    // Stand Tall — t1a: +2 ATK / turn (or +4 with March Forever)
    if (hasSkill(player, 'prime_t1a')) {
      const gain = 2 * mult
      statusEffects.playerATKBonus = (statusEffects.playerATKBonus || 0) + gain
      statusEffects.cls_primeATKGain = (statusEffects.cls_primeATKGain || 0) + gain
    }
    // Iron Resolve — t2a: +1 DEF / turn (or +2 with March Forever)
    if (hasSkill(player, 'prime_t2a')) {
      const gain = 1 * mult
      statusEffects.playerDEFBonus = (statusEffects.playerDEFBonus || 0) + gain
      statusEffects.cls_primeDEFGain = (statusEffects.cls_primeDEFGain || 0) + gain
    }
    // Quickening Will — t3a: +2 SPD / turn (or +4 with March Forever)
    if (hasSkill(player, 'prime_t3a')) {
      const gain = 2 * mult
      statusEffects.playerSPDBonus = (statusEffects.playerSPDBonus || 0) + gain
      statusEffects.cls_primeSPDGain = (statusEffects.cls_primeSPDGain || 0) + gain
    }
    if (statusEffects.cls_finalStandardTurns > 0) statusEffects.cls_finalStandardTurns--
    if (statusEffects.cls_throneSpeaksTurns > 0) {
      statusEffects.cls_throneSpeaksTurns--
      statusEffects.enemyStunTurns = Math.max(statusEffects.enemyStunTurns || 0, statusEffects.cls_throneSpeaksTurns)
    }
    // Authority Pulse — t2c: every 3rd turn counter
    if (hasSkill(player, 'prime_t2c')) {
      statusEffects.cls_authorityPulseTurn = (statusEffects.cls_authorityPulseTurn || 0) + 1
      if (statusEffects.cls_authorityPulseTurn >= 3) statusEffects.cls_authorityPulseTurn = 0
    }
  }

  // ── Bastion ─────────────────────────────────────────────────────────
  if (ac === 'bastion') {
    // Tempered Plate — t5a: Bulwark cap +1 per turn (max 30)
    if (hasSkill(player, 'bastion_t5a')) {
      statusEffects.cls_bulwarkCap = Math.min(30, (statusEffects.cls_bulwarkCap || 10) + 1)
    }
    // Living Wall countdown
    if (statusEffects.cls_livingWallTurns > 0) statusEffects.cls_livingWallTurns--
    // Anchor Pulse heal apply
    if (statusEffects.cls_anchorPulseHeal > 0) {
      healToPlayer += statusEffects.cls_anchorPulseHeal
      statusEffects.cls_anchorPulseHeal = 0
    }
  }

  // ── Dawnbringer ─────────────────────────────────────────────────────
  if (ac === 'dawnbringer') {
    // Inner Light — t1a: 5% max HP per turn (passive regen)
    if (hasSkill(player, 'dawnbringer_t1a')) {
      const maxHp = player.hp_max || player.max_hp || 100
      let regen = Math.round(maxHp * 0.05)
      if (hasSkill(player, 'dawnbringer_t4a') && (statusEffects._enginePlayerHpPct || 1) < 0.40) {
        regen *= 2
      }
      healToPlayer += regen
      messages.push(`☀ Inner Light — +${regen} HP.`)
    }
    // Sun's Wake — t1c: +1 Sun stack per turn (max 10)
    if (hasSkill(player, 'dawnbringer_t1c')) {
      statusEffects.cls_sunStacks = Math.min(10, (statusEffects.cls_sunStacks || 0) + 1)
    }
    // Sun's Sanctuary — t5c: <50% HP → 8% HP/turn regen (capped at 50%)
    if (hasSkill(player, 'dawnbringer_t5c') && (statusEffects._enginePlayerHpPct || 1) < 0.50) {
      const maxHp = player.hp_max || player.max_hp || 100
      let regen = Math.round(maxHp * 0.08)
      if (hasSkill(player, 'dawnbringer_t4a') && (statusEffects._enginePlayerHpPct || 1) < 0.40) {
        regen *= 2
      }
      healToPlayer += regen
    }
    // Per-turn flag reset
    statusEffects.cls_healingVeilUsedThisTurn = false
    // Apply Healing Veil heal (if triggered earlier)
    if (statusEffects.cls_healingVeilHeal > 0) {
      healToPlayer += statusEffects.cls_healingVeilHeal
      statusEffects.cls_healingVeilHeal = 0
    }
    // Apply Healing Wave heal (from active)
    if (statusEffects.cls_healingWaveHeal > 0) {
      healToPlayer += statusEffects.cls_healingWaveHeal
      statusEffects.cls_healingWaveHeal = 0
      if (hasSkill(player, 'dawnbringer_t3a')) {
        statusEffects.cls_bonusSP = (statusEffects.cls_bonusSP || 0) + 2
      }
    }
    // Apply Eternal Vigil heal (if triggered)
    if (statusEffects.cls_eternalVigilHeal > 0) {
      healToPlayer += statusEffects.cls_eternalVigilHeal
      statusEffects.cls_eternalVigilHeal = 0
    }
    // Dawnward Light countdown
    if (statusEffects.cls_dawnwardLightTurns > 0) statusEffects.cls_dawnwardLightTurns--
  }

  // ── Hollow ──────────────────────────────────────────────────────────
  if (ac === 'hollow') {
    if (statusEffects.cls_disappearTurns > 0) statusEffects.cls_disappearTurns--
    if (statusEffects.cls_emptyOneTurns > 0) {
      statusEffects.cls_emptyOneTurns--
      // +1 Void stack per turn of The Empty One
      statusEffects.cls_voidStacks = Math.min(10, (statusEffects.cls_voidStacks || 0) + 1)
    }
    // Echo of Loss — t4b: every 5 turns survived, enemy ATK -10% permanently
    if (hasSkill(player, 'hollow_t4b')) {
      statusEffects.cls_echoOfLossTurns = (statusEffects.cls_echoOfLossTurns || 0) + 1
      if (statusEffects.cls_echoOfLossTurns >= 5) {
        statusEffects.cls_echoOfLossTurns = 0
        statusEffects.enemyATKMult = (statusEffects.enemyATKMult || 1) * 0.90
        messages.push('◇ Echo of Loss — enemy ATK -10%.')
      }
    }
  }

  // ── Devourer ────────────────────────────────────────────────────────
  if (ac === 'devourer') {
    // Fed State drain (t4b): Hunger ≥ 80 → drain 5/turn
    if (hasSkill(player, 'devourer_t4b') && (statusEffects.cls_hunger || 0) >= 80) {
      statusEffects.cls_hunger = Math.max(0, statusEffects.cls_hunger - 5)
    }
    // Great Hunger countdown
    if (statusEffects.cls_greatHungerTurns > 0) {
      statusEffects.cls_greatHungerTurns--
      if (statusEffects.cls_greatHungerTurns === 0) {
        statusEffects.cls_blockAllHeals = false
        messages.push('🦷 Great Hunger fades.')
      }
    }
    // Apply Last Course SP cost
    if (statusEffects.cls_lastCourseSPCost) {
      // Burn current SP via negative bonusSP (clamped by engine)
      statusEffects.cls_bonusSP = (statusEffects.cls_bonusSP || 0) - (player.sp || 100)
      statusEffects.cls_lastCourseSPCost = false
    }
    // Apply Throat HP reduction (cosmetic — enemy max HP reduction; engine
    // applies via the modifier when displaying)
    if ((statusEffects.cls_throatHpReduction || 0) > 0) {
      // Already tracked. Engine doesn't enforce max-HP changes mid-fight;
      // the bonus is a flag for narrative effect.
    }
    // Block all heals while Great Hunger active
    if (statusEffects.cls_blockAllHeals) {
      healToPlayer = 0
    }
  }

  // ── Mourning King ───────────────────────────────────────────────────
  if (ac === 'mourning_king') {
    // Wakeful (t3c): <30% HP → +1 Wake per turn
    if (hasSkill(player, 'mourning_king_t3c') && (statusEffects._enginePlayerHpPct || 1) < 0.30) {
      statusEffects.cls_wakeStacks = Math.min(100, (statusEffects.cls_wakeStacks || 0) + 1)
    }
    if (statusEffects.cls_speakToDeadTurns > 0) statusEffects.cls_speakToDeadTurns--
  }

  // ── Chimera ─────────────────────────────────────────────────────────
  if (ac === 'chimera') {
    if (statusEffects.cls_shiftCooldown > 0) statusEffects.cls_shiftCooldown--
    if (statusEffects.cls_trueBeastTurns > 0) statusEffects.cls_trueBeastTurns--
    if (statusEffects.cls_eternalCoilTurns > 0) statusEffects.cls_eternalCoilTurns--
    if (statusEffects.cls_stormlordTurns > 0) statusEffects.cls_stormlordTurns--
    // Wild Energy heal apply
    if ((statusEffects.cls_wildEnergyHeal || 0) > 0) {
      healToPlayer += statusEffects.cls_wildEnergyHeal
      statusEffects.cls_wildEnergyHeal = 0
    }
    // Living Shell (t4b): in Coil, per turn → +5% max HP regen + +1 DEF
    const form = statusEffects.cls_chimeraForm || 'beast'
    if (hasSkill(player, 'chimera_t4b') && (form === 'coil' || statusEffects.cls_stormlordTurns > 0)) {
      const maxHp = player.hp_max || player.max_hp || 100
      healToPlayer += Math.round(maxHp * 0.05)
      statusEffects.playerDEFBonus = (statusEffects.playerDEFBonus || 0) + 1
      statusEffects.cls_livingShellDEFGain = (statusEffects.cls_livingShellDEFGain || 0) + 1
    }
    // Storm Form (t1c): roll new random stat each turn
    if (hasSkill(player, 'chimera_t1c') && (form === 'storm' || statusEffects.cls_stormlordTurns > 0)) {
      const stats = ['atk', 'def', 'spd']
      statusEffects.cls_stormRandomStat = stats[Math.floor(Math.random() * 3)]
      messages.push(`◎ Storm — ${statusEffects.cls_stormRandomStat.toUpperCase()} surged.`)
    }
    // Tempest (t5c): every 5 turns in Storm
    if (hasSkill(player, 'chimera_t5c') && form === 'storm') {
      statusEffects.cls_tempestCounter = (statusEffects.cls_tempestCounter || 0) + 1
      if (statusEffects.cls_tempestCounter >= 5) {
        // Apply for 1 turn — reset next turn
        messages.push('◎ Tempest — all forms speak.')
        // Counter resets after this turn applies. Set to -1 so it goes to 0 next turn.
        statusEffects.cls_tempestCounter = -1
      } else if (statusEffects.cls_tempestCounter < 0) {
        statusEffects.cls_tempestCounter = 0
      }
    }
  }

  // Generic turn counter (used by Unwritten, Oathbreaker for elapsed-turn logic)
  statusEffects.cls_turnsElapsed = (statusEffects.cls_turnsElapsed || 0) + 1

  // ── Unwritten ───────────────────────────────────────────────────────
  if (ac === 'unwritten') {
    // Apply Erasure heal (from active)
    if ((statusEffects.cls_erasureHeal || 0) > 0) {
      healToPlayer += statusEffects.cls_erasureHeal
      statusEffects.cls_erasureHeal = 0
    }
    // Apply Bury the Hour heal
    if ((statusEffects.cls_burryHourHeal || 0) > 0) {
      healToPlayer += statusEffects.cls_burryHourHeal
      statusEffects.cls_burryHourHeal = 0
    }
    // Apply Quiet Disagreement heal
    if ((statusEffects.cls_quietDisagreementHeal || 0) > 0) {
      healToPlayer += statusEffects.cls_quietDisagreementHeal
      statusEffects.cls_quietDisagreementHeal = 0
    }
    // Apply Disowned Hit enemy heal
    if ((statusEffects.cls_disownedHitEnemyHeal || 0) > 0) {
      damageToEnemy -= statusEffects.cls_disownedHitEnemyHeal
      statusEffects.cls_disownedHitEnemyHeal = 0
    }
    // No Such Person countdown — at expiry, deliver the strike
    if (statusEffects.cls_noSuchPersonTurns > 0) {
      statusEffects.cls_noSuchPersonTurns--
      if (statusEffects.cls_noSuchPersonTurns === 0) {
        const finalDmg = Math.round((statusEffects.cls_noSuchPersonAvoidedDamage || 0) * 1.5)
        damageToEnemy += finalDmg
        statusEffects.cls_noSuchPersonAvoidedDamage = 0
        messages.push(`✎ No Such Person ends — ${finalDmg} damage from the absence.`)
      }
    }
    if (statusEffects.cls_longSilenceTurns > 0) {
      statusEffects.cls_longSilenceTurns--
      statusEffects.enemyStunTurns = Math.max(statusEffects.enemyStunTurns || 0, 1)
    }
    // Reset Empty Page proc flag (it should only count for one strike)
    if (statusEffects.cls_emptyPageProc) statusEffects.cls_emptyPageProc = false
  }

  // ── Oathbreaker ─────────────────────────────────────────────────────
  if (ac === 'oathbreaker') {
    // Track turns oath has been held
    if (statusEffects.cls_currentOath) {
      statusEffects.cls_oathTurnsHeld = (statusEffects.cls_oathTurnsHeld || 0) + 1
    }
    // Oath of the Wall (t1b): +5% per-turn regen
    if (statusEffects.cls_currentOath === 'wall' && hasSkill(player, 'oathbreaker_t1b')) {
      const maxHp = player.hp_max || player.max_hp || 100
      healToPlayer += Math.round(maxHp * 0.05)
    }
    // Break: Wall staged heal
    if ((statusEffects.cls_breakWallHeal || 0) > 0) {
      healToPlayer += statusEffects.cls_breakWallHeal
      statusEffects.cls_breakWallHeal = 0
    }
    // Final Oath: Sanctuary heal
    if ((statusEffects.cls_finalOathSanctuaryHeal || 0) > 0) {
      healToPlayer += statusEffects.cls_finalOathSanctuaryHeal
      statusEffects.cls_finalOathSanctuaryHeal = 0
    }
    // Final Oath DEF bonus countdown
    if (statusEffects.cls_finalOathDEFBonusTurns > 0) {
      statusEffects.cls_finalOathDEFBonusTurns--
      if (statusEffects.cls_finalOathDEFBonusTurns === 0) {
        statusEffects.playerDEFBonus = Math.max(0, (statusEffects.playerDEFBonus || 0) - 50)
        messages.push('⚔ Final Oath: Sanctuary fades.')
      }
    }
  }

  // ── Silent Judge ────────────────────────────────────────────────────
  if (ac === 'silent_judge') {
    const marks = statusEffects.cls_verdictMarks || 0
    // Silent Observation (t1b): 3+ marks → 15% chance per turn to skip enemy
    if (hasSkill(player, 'silent_judge_t1b') && marks >= 3 && Math.random() < 0.15) {
      statusEffects.enemyStunTurns = Math.max(statusEffects.enemyStunTurns || 0, 1)
      messages.push('⚖ Silent Observation — they pause.')
    }
    if (statusEffects.cls_quietCourtTurns > 0) statusEffects.cls_quietCourtTurns--
    if (statusEffects.cls_silentCourtTurns > 0) {
      statusEffects.cls_silentCourtTurns--
      // Maintain stun every turn while active
      statusEffects.enemyStunTurns = Math.max(statusEffects.enemyStunTurns || 0, 1)
    }
    if (statusEffects.cls_eyesOfEquilibriumTurns > 0) statusEffects.cls_eyesOfEquilibriumTurns--
  }

  // ── Dreadnought ─────────────────────────────────────────────────────
  if (ac === 'dreadnought') {
    // Slow Heart (t3b): at 10+ Armor → 5% max HP regen per turn
    if (hasSkill(player, 'dreadnought_t3b') && (statusEffects.cls_armorStacks || 0) >= 10) {
      const maxHp = player.hp_max || player.max_hp || 100
      healToPlayer += Math.round(maxHp * 0.05)
    }
    if (statusEffects.cls_oneStepMoreTurns > 0) {
      statusEffects.cls_oneStepMoreTurns--
      if (statusEffects.cls_oneStepMoreTurns === 0) {
        // End: deal damage = 3 × ATK
        const finalDmg = ((player.atk || 5) + (statusEffects.playerATKBonus || 0)) * 3
        damageToEnemy += finalDmg
        statusEffects.cls_oneStepMoreBlockHeal = false
        messages.push(`🛡 One Step More ends — ${finalDmg} damage from the held breath.`)
      } else {
        // Block heals while active
        healToPlayer = 0
      }
    }
    if (statusEffects.cls_walkingTombTurns > 0) {
      statusEffects.cls_walkingTombTurns--
      if (statusEffects.cls_walkingTombTurns === 0) {
        // End: +20 Armor stacks
        const cap = statusEffects.cls_armorCap || 15
        statusEffects.cls_armorStacks = Math.min(cap, (statusEffects.cls_armorStacks || 0) + 20)
        messages.push('🛡 Walking Tomb ends. +20 Armor.')
      } else {
        // Keep loyalGuard signal active while in tomb
        statusEffects.cls_loyalGuardSavedHp = Math.max(statusEffects.cls_loyalGuardSavedHp || 0, 1)
      }
    }
    if (statusEffects.cls_theInevitableTurns > 0) {
      statusEffects.cls_theInevitableTurns--
      statusEffects.enemyStunTurns = Math.max(statusEffects.enemyStunTurns || 0, 1)
    }
  }

  // ── Abyss Walker ────────────────────────────────────────────────────
  if (ac === 'abyss_walker') {
    // Depth Begins / Faster Descent
    if (hasSkill(player, 'abyss_walker_t1a')) {
      const inc = hasSkill(player, 'abyss_walker_t2a') ? 2 : 1
      // Climb cancels out 1 per turn
      const dec = (statusEffects.cls_climbTurns || 0) > 0 ? 1 : 0
      const net = inc - dec
      statusEffects.cls_depth = Math.max(0, (statusEffects.cls_depth || 0) + net)
    }
    if (statusEffects.cls_climbTurns > 0) statusEffects.cls_climbTurns--
    if (statusEffects.cls_hollowSeaTurns > 0) statusEffects.cls_hollowSeaTurns--

    // Drown DoT
    if (statusEffects.cls_drownTurns > 0) {
      const stacks = statusEffects.cls_drownStacks || 1
      let tick = stacks * 5
      // Drown Cascade (t3b): at 5+ stacks, ticks double
      if (hasSkill(player, 'abyss_walker_t3b') && stacks >= 5) tick *= 2
      // Drowned active: (50 + max HP × 10%) damage per turn
      if (statusEffects.cls_drownedActive) {
        const eMax = enemy ? (enemy.hp_max || enemy.hp || 100) : 100
        tick = 50 + Math.round(eMax * 0.10)
      }
      damageToEnemy += tick
      statusEffects.cls_drownTurns--
      if (statusEffects.cls_drownTurns === 0) {
        statusEffects.cls_drownStacks = 0
        statusEffects.cls_drownedActive = false
      }
      messages.push(`◊ Drown — ${tick} damage to enemy.`)
    }
    // Pulled Below (t2b): at 3+ Drown → enemy SPD halves (apply via enemyATKMult proxy? Use a flag)
    if (hasSkill(player, 'abyss_walker_t2b') && (statusEffects.cls_drownStacks || 0) >= 3) {
      // Halve enemy SPD effective; we approximate via enemy stun chance bump
      if (Math.random() < 0.50) {
        statusEffects.enemyStunTurns = Math.max(statusEffects.enemyStunTurns || 0, 1)
      }
    }
    // The Pull (t5b): 5+ Drown → 10% chance per enemy turn their action skipped
    if (hasSkill(player, 'abyss_walker_t5b') && (statusEffects.cls_drownStacks || 0) >= 5
        && Math.random() < 0.10) {
      statusEffects.enemyStunTurns = Math.max(statusEffects.enemyStunTurns || 0, 1)
      messages.push('◊ The Pull — drowned in its own motion.')
    }
    // Apply Return From Below heal
    if ((statusEffects.cls_returnFromBelowHeal || 0) > 0) {
      healToPlayer += statusEffects.cls_returnFromBelowHeal
      statusEffects.cls_returnFromBelowHeal = 0
    }
  }

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

// ── HOOK: combat end (won) ──────────────────────────────────────────────
// Called by the engine when combat ends in victory. Returns a partial
// update object the engine should merge into the player's DB row + memory.
// Used for class effects that persist between combats — currently only
// Prime's Eternal Sovereign (t5a) which carries stat stacks forward.
// Returns: { dbUpdates: {col: value, ...}, messages: [str] }
export function onCombatEnd(player, statusEffects, outcome) {
  if (!player.active_class) return { dbUpdates: {}, messages: [] }
  const messages = []
  const dbUpdates = {}
  const ac = player.active_class

  // ── Defeat: reset accumulating stacks to 0 ──────────────────────────
  // Prime stat stacks (Eternal Sovereign) and Mourning King Wake stacks
  // accumulate across combats indefinitely (up to their caps). On combat
  // defeat (no revive), they reset to 0. This is the only reset trigger;
  // chapter transitions and time do not affect them.
  // Note: 'defeat' is the outcome string from Ch1; 'lose' is used by Ch2.
  // Accept both for safety.
  if (outcome === 'defeat' || outcome === 'lose') {
    if (ac === 'prime') {
      if ((player.prime_atk_stacks || 0) > 0) dbUpdates.prime_atk_stacks = 0
      if ((player.prime_def_stacks || 0) > 0) dbUpdates.prime_def_stacks = 0
      if ((player.prime_spd_stacks || 0) > 0) dbUpdates.prime_spd_stacks = 0
      if (Object.keys(dbUpdates).length > 0) {
        messages.push('👑 Eternal Sovereign — death claims all stacks.')
      }
    }
    if (ac === 'mourning_king') {
      if ((player.mourning_king_wake_stacks || 0) > 0) {
        dbUpdates.mourning_king_wake_stacks = 0
        messages.push('☠ Wake stacks — lost to the long quiet.')
      }
    }
    return { dbUpdates, messages }
  }

  // Wins: continue to the snowball/persistence logic below.
  if (outcome !== 'win') return { dbUpdates, messages }

  if (ac === 'prime' && hasSkill(player, 'prime_t5a')) {
    // Eternal Sovereign — persist stat stacks (cap 50 each, sum with existing).
    const cap = 50
    const newAtk = Math.min(cap, (player.prime_atk_stacks || 0) + (statusEffects.cls_primeATKGain || 0))
    const newDef = Math.min(cap, (player.prime_def_stacks || 0) + (statusEffects.cls_primeDEFGain || 0))
    const newSpd = Math.min(cap, (player.prime_spd_stacks || 0) + (statusEffects.cls_primeSPDGain || 0))
    if (newAtk !== (player.prime_atk_stacks || 0)) dbUpdates.prime_atk_stacks = newAtk
    if (newDef !== (player.prime_def_stacks || 0)) dbUpdates.prime_def_stacks = newDef
    if (newSpd !== (player.prime_spd_stacks || 0)) dbUpdates.prime_spd_stacks = newSpd
    if (Object.keys(dbUpdates).length > 0) {
      messages.push(`👑 Eternal Sovereign — stacks persist: ATK ${newAtk}, DEF ${newDef}, SPD ${newSpd}.`)
    }
  }

  // Dawnbringer First Light — t2c: once-per-24h skill. If we consumed it
  // this combat, write the current timestamp to the DB so subsequent combats
  // within 24h will not re-trigger it.
  if (ac === 'dawnbringer' && statusEffects.cls_firstLightConsumed) {
    dbUpdates.dawnbringer_first_light_at = new Date().toISOString()
  }

  // Mourning King — Wake stack persistence
  if (ac === 'mourning_king') {
    // The Long Wait (t2b): stacks persist across chapter
    // Mercy is Power (t5b): every spare grants +1 permanent across the run
    // We always write the current Wake stack count to the DB if either skill is unlocked
    if (hasSkill(player, 'mourning_king_t2b') || hasSkill(player, 'mourning_king_t5b')) {
      const newStacks = Math.min(100, statusEffects.cls_wakeStacks || 0)
      if (newStacks !== (player.mourning_king_wake_stacks || 0)) {
        dbUpdates.mourning_king_wake_stacks = newStacks
        messages.push(`☠ ${newStacks} Wake stacks remembered.`)
      }
    }
    // Death Mark consumed → write timestamp (24h cooldown)
    if (statusEffects.cls_deathMarkConsumed) {
      dbUpdates.mourning_king_death_mark_at = new Date().toISOString()
    }
  }

  return { dbUpdates, messages }
}
