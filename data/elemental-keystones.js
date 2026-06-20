// data/elemental-keystones.js — clickable keystone actives for combat.
// ─────────────────────────────────────────────────────────────────────
// The 5th node of each elemental tree branch is a KEYSTONE written as an
// active ability ("Active: ... Cooldown N turns"). The trees stored these
// as data but combat never rendered or ran them. This module makes them
// real: it mirrors the class-skill pattern (a button row + a handler).
//
// USAGE (combat engine):
//   import { getUnlockedKeystones, applyKeystone } from '../../data/elemental-keystones.js'
//   const ks = getUnlockedKeystones(player, ksCooldowns)   // → render buttons
//   const result = applyKeystone(id, player, statusEffects, ctx)  // → on click
//
// Each keystone returns a result object the engine acts on:
//   {
//     messages: string[]          // combat-log lines
//     enemyDamage: number         // immediate damage to deal to enemy
//     healPlayer: number          // immediate HP to restore
//     cooldown: number            // turns until usable again
//     setStatus: { key: value }   // statusEffects to set (engine applies)
//     consumesTurn: boolean       // whether using it ends the player's turn
//   }
//
// Cooldowns are tracked by the engine in a ksCooldowns map (keystoneId ->
// turns remaining), decremented each turn just like skill cooldowns. The
// engine owns the state; this module only computes effects.
//
// "Attuned" doubling: where a keystone says "Attuned: ...", the stronger
// effect applies if the player is attuned to that element.
// ─────────────────────────────────────────────────────────────────────

import { ELEMENT_TREES } from './elements_tree.js'

// Build keystone metadata once: id -> { el, label, cooldown }.
const KEYSTONE_META = (() => {
  const m = {}
  for (const el of Object.keys(ELEMENT_TREES)) {
    for (const n of ELEMENT_TREES[el].nodes) {
      if (n.type === 'keystone') m[n.id] = { el, label: n.label, desc: n.desc || '' }
    }
  }
  return m
})()

const ELEMENT_COLORS = {
  fire:'#ff7a1a', water:'#2a9df4', lightning:'#ffe23a', earth:'#8b5e3c',
  wind:'#a8d8ea', plant:'#66bb6a', metal:'#90a4ae', poison:'#9a7ad0',
  arcane:'#c8a8ff', shadow:'#8a50c0',
}

function isAttuned(player, el) {
  return (player?.attuned_element || player?.element) === el
}

// Which keystones has the player unlocked (bought in the tree)? Returns the
// render-ready list. ksCooldowns is the engine's {id: turnsLeft} map.
export function getUnlockedKeystones(player, ksCooldowns = {}) {
  const unlocked = Array.isArray(player?.elemental_unlocked) ? player.elemental_unlocked : []
  const out = []
  for (const id of unlocked) {
    const meta = KEYSTONE_META[id]
    if (!meta) continue   // not a keystone (passive node) — skip
    const cd = ksCooldowns[id] || 0
    out.push({
      id,
      label: meta.label,
      el: meta.el,
      color: ELEMENT_COLORS[meta.el] || '#c8a8ff',
      desc: meta.desc,
      available: cd <= 0,
      cooldown: cd,
    })
  }
  return out
}

// Apply a keystone's effect. Returns the result object described above.
// ctx carries combat snapshot values the keystone may need:
//   { enemyHp, maxEnemyHp, currentHp, maxPlayerHp, playerATK }
export function applyKeystone(id, player, statusEffects, ctx = {}) {
  const meta = KEYSTONE_META[id]
  if (!meta) return { messages: ['Unknown keystone.'], cooldown: 0, consumesTurn: false }
  const att = isAttuned(player, meta.el)
  const atk = ctx.playerATK || (player?.atk || 10)
  const r = { messages: [], enemyDamage: 0, healPlayer: 0, cooldown: 3, setStatus: {}, consumesTurn: true }

  switch (id) {
    // ── FIRE ──────────────────────────────────────────────────────────
    case 'fire_aggr_ks': // Cinder Step — next 3 attacks apply Ember Memory
      r.setStatus.cfx_emberStepTurns = att ? 6 : 3
      r.cooldown = 2
      r.messages.push('🔥 Cinder Step — your next attacks scorch with Ember Memory.')
      break
    case 'fire_def_ks': // Forge-Body — 2 turns half damage + reflect 25% fire
      r.setStatus.cfx_damageHalveTurns = 2
      r.setStatus.cfx_fireReflectTurns = 2
      r.cooldown = 3
      r.messages.push('🔥 Forge-Body — for 2 turns you take half damage and reflect fire.')
      break
    case 'fire_util_ks': // Ashen Crown — convert Ember stacks to healing
      { const stacks = statusEffects.cfx_emberStacks || 0
        const heal = Math.round((ctx.maxPlayerHp || 100) * 0.08 * stacks)
        r.healPlayer = heal
        r.setStatus.cfx_emberStacks = 0
        r.cooldown = 3
        r.messages.push(stacks > 0 ? `🔥 Ashen Crown — ${stacks} Ember stacks become ${heal} HP.` : '🔥 Ashen Crown — no Ember stacks to convert.') }
      break

    // ── WATER ─────────────────────────────────────────────────────────
    case 'water_aggr_ks':
      r.enemyDamage = Math.round(atk * (att ? 2.4 : 1.8))
      r.cooldown = 2
      r.messages.push('💧 Drown Step — a crushing wave for ' + r.enemyDamage + '.')
      break
    case 'water_def_ks':
      r.setStatus.cfx_damageHalveTurns = 2
      r.setStatus.cfx_freezeNextTurn = true
      r.cooldown = 3
      r.messages.push('💧 Glacier-Body — half damage for 2 turns; the enemy slows.')
      break
    case 'water_util_ks':
      r.healPlayer = Math.round((ctx.maxPlayerHp || 100) * (att ? 0.30 : 0.20))
      r.cooldown = 3
      r.messages.push('💧 Pale Tide — restores ' + r.healPlayer + ' HP.')
      break

    // ── LIGHTNING (Volt) ──────────────────────────────────────────────
    case 'lightning_aggr_ks': { // Chain Lightning — 3 (or 4) chaining hits
      const chains = att ? 4 : 3
      let dmg = Math.round(atk * 1.0), total = 0
      for (let i = 0; i < chains; i++) { total += dmg; dmg = Math.round(dmg * 0.6) }
      r.enemyDamage = total
      r.cooldown = 2
      r.messages.push('⚡ Chain Lightning — ' + chains + ' arcs for ' + total + ' total.')
      break }
    case 'lightning_def_ks':
      r.setStatus.cfx_damageHalveTurns = 2
      r.setStatus.cfx_stunMeleeTurns = 2
      r.cooldown = 3
      r.messages.push('⚡ Storm Ward — half damage for 2 turns; melee attackers are stunned.')
      break
    case 'lightning_util_ks': // Time Skip — extra turn
      r.setStatus.cfx_extraTurn = true
      if (att) r.setStatus.cfx_refundMpHalf = true
      r.cooldown = 3
      r.consumesTurn = false  // the whole point is NOT ending your turn
      r.messages.push('⚡ Time Skip — you move again.')
      break

    // ── ARCANE (Lux) ──────────────────────────────────────────────────
    case 'arcane_aggr_ks': // Standing Wave — next Lux skill echoes 3x full
      r.setStatus.cfx_standingWave = att ? 4 : 3
      if (att) r.setStatus.cfx_standingWaveIgnoreDef = true
      r.cooldown = 3
      r.messages.push('✨ Standing Wave — your next Lux skill echoes at full power.')
      break
    case 'arcane_def_ks': // Aegis — half damage + 50% damage→MP
      r.setStatus.cfx_damageHalveTurns = 2
      r.setStatus.cfx_dmgToMpTurns = 2
      r.cooldown = 3
      r.messages.push('✨ Aegis — half damage for 2 turns; harm feeds your reserves.')
      break
    case 'arcane_util_ks': // Perfect Recall — next skill free + unmissable
      r.setStatus.cfx_perfectRecall = true
      r.cooldown = 3
      r.consumesTurn = false
      r.messages.push('✨ Perfect Recall — your next skill is free and certain.')
      break

    // ── POISON (Venin) ────────────────────────────────────────────────
    case 'poison_aggr_ks': // Plague Fang — next 3 attacks apply Long Decay
      r.setStatus.cfx_plagueFangTurns = att ? 6 : 3
      r.cooldown = 2
      r.messages.push('☠ Plague Fang — your next attacks carry Long Decay.')
      break
    case 'poison_def_ks': // Living Antidote — half damage + reflect 25% poison
      r.setStatus.cfx_damageHalveTurns = 2
      r.setStatus.cfx_poisonReflectTurns = 2
      r.cooldown = 3
      r.messages.push('☠ Living Antidote — half damage for 2 turns; toxins rebound.')
      break
    case 'poison_util_ks': { // Virulent Crown — convert Long Decay stacks to healing
      const stacks = statusEffects.cfx_longDecayStacks || 0
      const heal = Math.round((ctx.maxPlayerHp || 100) * 0.08 * stacks)
      r.healPlayer = heal
      r.setStatus.cfx_longDecayStacks = 0
      r.cooldown = 3
      r.messages.push(stacks > 0 ? `☠ Virulent Crown — ${stacks} Decay stacks become ${heal} HP.` : '☠ Virulent Crown — no Decay stacks to convert.')
      break }

    // ── SHADOW (Umbra) ────────────────────────────────────────────────
    case 'shadow_aggr_ks': { // Death Mark — spend all Unseen stacks for a big crit
      const stacks = statusEffects.cfx_unseenStacks || 0
      const atk2 = ctx.playerATK || (player?.atk || 10)
      const dmg = Math.round(atk2 * (1.5 + 0.4 * stacks))
      r.enemyDamage = dmg
      r.setStatus.cfx_unseenStacks = 0
      if (att) r.setStatus.cfx_deathMarkIgnoreDef = true
      r.cooldown = 2
      r.messages.push(stacks > 0
        ? '🌑 Death Mark — ' + stacks + ' stacks spent for ' + dmg + '!'
        : '🌑 Death Mark — ' + dmg + ' (no stacks).')
      break }
    case 'shadow_def_ks': // Nightshade — half damage + big dodge for 2 turns
      r.setStatus.cfx_damageHalveTurns = 2
      r.setStatus.cfx_dodgeBuffTurns = 2
      r.cooldown = 3
      r.messages.push('🌑 Nightshade — half damage and you melt into shadow.')
      break
    case 'shadow_util_ks': // No Witnesses — untargetable 1 turn, then guaranteed crit
      r.setStatus.cfx_untargetableTurns = 1
      r.setStatus.cfx_guaranteedCrit = true
      r.cooldown = 3
      r.consumesTurn = false
      r.messages.push('🌑 No Witnesses — you vanish; your next strike is lethal.')
      break

    // ── EARTH (Terra) ─────────────────────────────────────────────────
    case 'earth_aggr_ks': { // Avalanche — damage = % of DEF, stun
      const def = (ctx.playerDEF != null ? ctx.playerDEF : (player?.def || 5))
      const mult = att ? 3.0 : 2.0
      r.enemyDamage = Math.round(def * mult)
      r.setStatus.enemyStunTurns = 1
      r.cooldown = 2
      r.messages.push('🪨 Avalanche — ' + r.enemyDamage + ' crushing damage; enemy stunned!')
      break }
    case 'earth_def_ks': // Bastion — half damage + 3 Stoneborn stacks
      r.setStatus.cfx_damageHalveTurns = 2
      r.setStatus.cfx_stonebornStacks = 3
      r.cooldown = 3
      r.messages.push('🪨 Bastion — you set yourself like bedrock.')
      break
    case 'earth_util_ks': // Worldspine — heal 25% + cleanse debuffs
      r.healPlayer = Math.round((ctx.maxPlayerHp || 100) * 0.25)
      r.setStatus.cfx_cleanseDebuffs = true
      if (att) r.setStatus.cfx_stonebornBonus = 2
      r.cooldown = 3
      r.messages.push('🪨 Worldspine — the mountain mends you.')
      break

    // ── WIND (Aero) ───────────────────────────────────────────────────
    case 'wind_aggr_ks': { // Cyclone — 3-4 strikes at 50% ATK, ignore DEF
      const hits = att ? 4 : 3
      r.enemyDamage = Math.round((ctx.playerATK||10) * 0.5 * hits)
      r.cooldown = 2
      r.messages.push('💨 Cyclone — ' + hits + ' cutting strikes for ' + r.enemyDamage + '!')
      break }
    case 'wind_def_ks': // Eye of the Storm — half damage + dodge buff
      r.setStatus.cfx_damageHalveTurns = 2
      r.setStatus.cfx_dodgeBuffTurns = 2
      r.cooldown = 3
      r.messages.push('💨 Eye of the Storm — the blows pass through you.')
      break
    case 'wind_util_ks': // Hurricane — extra turn
      r.setStatus.cfx_extraTurn = true
      if (att) r.setStatus.cfx_dodgeBuffTurns = 1
      r.cooldown = 3
      r.consumesTurn = false
      r.messages.push('💨 Hurricane — you move again on the wind.')
      break

    // ── PLANT (Flora) ─────────────────────────────────────────────────
    case 'plant_aggr_ks': // Bloodflower — next attacks lifesteal heavily
      r.setStatus.cfx_bloodflowerTurns = att ? 3 : 3
      r.setStatus.cfx_bloodflowerPct = att ? 1.0 : 0.5
      r.cooldown = 2
      r.messages.push('🌿 Bloodflower — your strikes drink deep.')
      break
    case 'plant_def_ks': // World Tree — big heal now + regen
      r.healPlayer = Math.round((ctx.maxPlayerHp||100) * 0.30)
      r.setStatus.cfx_worldTreeTurns = 3
      if (att) r.setStatus.cfx_cleanseDebuffs = true
      r.cooldown = 3
      r.messages.push('🌿 World Tree — you root and flourish.')
      break
    case 'plant_util_ks': { // Heartwood — heal from missing HP
      const missing = Math.max(0, (ctx.maxPlayerHp||100) - (ctx.currentHp||0))
      r.healPlayer = Math.round(missing * (att ? 0.75 : 0.5))
      r.cooldown = 3
      r.messages.push('🌿 Heartwood — ' + r.healPlayer + ' HP drawn from the wound.')
      break }

    // ── METAL (Ferro) ─────────────────────────────────────────────────
    case 'metal_aggr_ks': // Guillotine — 250% ATK, ignore all DEF
      r.enemyDamage = Math.round((ctx.playerATK||10) * 2.5)
      if (att) r.setStatus.cfx_guaranteedCrit = true
      r.cooldown = 2
      r.messages.push('⚙ Guillotine — a clean cut for ' + r.enemyDamage + '!')
      break
    case 'metal_def_ks': // Iron Maiden — half damage + 50% reflect
      r.setStatus.cfx_damageHalveTurns = 2
      r.setStatus.cfx_ironMaidenTurns = 2
      r.cooldown = 3
      r.messages.push('⚙ Iron Maiden — every blow returns.')
      break
    case 'metal_util_ks': // Living Forge — +30% ATK & DEF for the battle
      r.setStatus.cfx_forgeAtk = true
      r.setStatus.cfx_forgeDef = true
      r.cooldown = 4
      r.messages.push('⚙ Living Forge — you reforge yourself, stronger.')
      break

    default:
      r.messages.push('This keystone has no effect yet.')
      r.consumesTurn = false
  }
  return r
}
