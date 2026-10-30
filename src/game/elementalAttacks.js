// Chapter 2 elemental attack progression (original thresholds: 7/13/19).
// One elemental attack occupies one battle_skills slot at a time.
// No new database column or skill points are required.
import { ELEMENT_TREES, isElementUnlocked } from './elementsTree.js'
import { getActiveElement } from './activeElement.js'
import { BATTLE_SKILLS_REGISTRY } from './skillsRegistry.js'
import { damageMult } from './elementalBonuses.js'
import { getElementalMpCost } from './combatMp.js'

export const ELEMENTAL_ATTACKS = {
  fire: ['fire_skill_fire_blast','fire_ultimate_inferno_zone','fire_mastery_cinderstorm'],
  water: ['water_skill_water_jet','water_ultimate_tsunami','water_mastery_maelstrom'],
  lightning: ['lightning_skill_lightning_strike','lightning_ultimate_thunderstorm','lightning_mastery_tempest'],
  arcane: ['arcane_skill_resonant_bolt','arcane_ultimate_standing_chord','arcane_mastery_resonance'],
  shadow: ['shadow_skill_shadow_lance','shadow_skill_umbral_burst','shadow_mastery_eclipse'],
  earth: ['earth_skill_stone_throw','earth_ultimate_earthquake','earth_mastery_tectonic'],
  wind: ['wind_skill_dash_strike','wind_ultimate_tornado_field','wind_mastery_cyclone'],
  plant: ['plant_skill_thorn_volley','plant_ultimate_nature_overgrowth','plant_mastery_bloom'],
  metal: ['metal_skill_blade_arc','metal_ultimate_iron_domain','metal_mastery_annihilate'],
  poison: ['poison_skill_venom_spit','poison_skill_blight_nova','poison_mastery_pandemic'],
}
export const ELEMENTAL_ATTACK_THRESHOLDS = [7, 13, 19]
const KEYS = new Set(Object.values(ELEMENTAL_ATTACKS).flat())
const ATTACK_INDEX = Object.fromEntries(
  Object.entries(ELEMENTAL_ATTACKS).flatMap(([element, skills]) =>
    skills.map((id, tier) => [id, {element, tier, id, ...BATTLE_SKILLS_REGISTRY[id]}])),
)
export function isElementalAttack(key) { return KEYS.has(key) }

export function countLearnedElementNodes(player, element) {
  const tree = ELEMENT_TREES[element]
  if (!tree || !isElementUnlocked(element, player)) return 0
  const learned = new Set(player?.elemental_unlocked || [])
  // The shared root is a free unlocked node once the zone guardian is cleared.
  return tree.nodes.filter(node => node.type === 'start' || learned.has(node.id)).length
}

export function getElementalAttackProgress(player, element) {
  return (ELEMENTAL_ATTACKS[element] || []).map((id, tier) => ({
    ...ATTACK_INDEX[id], requiredNodes: ELEMENTAL_ATTACK_THRESHOLDS[tier],
    unlocked: countLearnedElementNodes(player, element) >= ELEMENTAL_ATTACK_THRESHOLDS[tier],
    equipped: (player?.battle_skills || []).includes(id),
  }))
}

export function canUseElementalAttack(player, id) {
  const skill = ATTACK_INDEX[id]
  return Boolean(skill && getActiveElement(player) === skill.element &&
    countLearnedElementNodes(player, skill.element) >= ELEMENTAL_ATTACK_THRESHOLDS[skill.tier] &&
    (player?.battle_skills || []).includes(id))
}

export function equipElementalAttack(player, id) {
  const skill = ATTACK_INDEX[id]
  if (!skill || !isElementUnlocked(skill.element, player) ||
      countLearnedElementNodes(player, skill.element) < ELEMENTAL_ATTACK_THRESHOLDS[skill.tier]) return null
  const remaining = (player?.battle_skills || []).filter(key => !isElementalAttack(key))
  // Preserve other loadout skills. If all slots are full, replace slot 0
  // as the legacy engine does, rather than silently discarding the selection.
  const next = remaining.length >= 4 ? [id, ...remaining.slice(1, 4)] : [id, ...remaining]
  return { battle_skills: next }
}

export function getAttackMpCost(player, id, status = {}) {
  const skill = ATTACK_INDEX[id]
  return skill && canUseElementalAttack(player, id) ? getElementalMpCost(skill.tier, status) : Infinity
}

export function getEquippedElementalAttack(player) {
  const id = (player?.battle_skills || []).find(isElementalAttack)
  return id && canUseElementalAttack(player, id) ? ATTACK_INDEX[id] : null
}

// The old Chapter 2 combat formulas are used at baseline (skillScale=1).
// The return value is consumed atomically by the React combat screen.
// MP conversion remains unavailable until the game implements actual MP.
export function resolveElementalAttack(id, player, status, ctx = {}) {
  if (!canUseElementalAttack(player, id)) return null
  const skill = ATTACK_INDEX[id]
  const atk = Math.max(1, Number(ctx.atk) || 10)
  const def = Math.max(0, Number(ctx.def) || 0)
  const foeDef = Math.max(0, Number(ctx.enemyDef) || 0)
  const maxHp = Math.max(1, Number(ctx.maxHp) || 100)
  const mult = damageMult(player, skill.element)
  const setStatus = {}
  let damage = 0, heal = 0
  const fn = skill.fn
  const magic = base => Math.max(1, Math.round(base * mult))
  switch (fn) {
    case 'fireBlast': damage=magic(25+atk-foeDef*.5); break
    case 'infernoZone': setStatus.infernoTurns=3; setStatus.infernoDmg=40; break
    case 'cinderstorm': damage=magic(55+atk*.5); setStatus.cfx_emberStacks=Math.min(5,(status.cfx_emberStacks||0)+1); break
    case 'waterJet': damage=magic(28+atk*.4); break
    case 'tsunami': damage=magic(50+atk*.4); setStatus.enemyStunTurns=Math.max(1,status.enemyStunTurns||0); break
    case 'maelstrom': damage=magic(55+atk*.5); break
    case 'lightningStrike': damage=magic(30+atk*.5); break
    case 'thunderstorm': damage=magic(5*15); break
    case 'tempest': damage=magic(55+atk*.5); if(Math.random()<.4) setStatus.enemyStunTurns=Math.max(1,status.enemyStunTurns||0); break
    case 'resonantBolt': damage=magic(30+atk*.4); break
    case 'standingChord': damage=magic(45+atk*.5); break
    case 'resonanceBurst': damage=magic(55+atk*.5); break
    case 'shadowLance': damage=magic(28+atk*.4); break
    case 'umbralBurst': damage=magic(38+atk*.45); break
    case 'eclipse': damage=magic(55+atk*.5); setStatus.cfx_unseenStacks=Math.min(3,(status.cfx_unseenStacks||0)+2); break
    case 'stoneThrow': damage=magic(26+atk*.4+def*.3); break
    case 'earthquake': damage=magic(atk*2); setStatus.enemyStunTurns=Math.max(1,status.enemyStunTurns||0); break
    case 'tectonicCrush': damage=magic(55+atk*.4+def*.5); setStatus.enemyStunTurns=Math.max(1,status.enemyStunTurns||0); break
    case 'dashStrike': damage=magic(atk*2+4); break
    case 'tornadoField': setStatus.cfx_tornadoTurns=3; break
    case 'wildCyclone': damage=magic(55+atk*.5); break
    case 'thornVolley': damage=magic(26+atk*.4); heal=Math.round(damage*.2); break
    case 'overgrowth': damage=magic(30); heal=40; break
    case 'carnivoreBloom': damage=magic(55+atk*.5); heal=Math.round(damage*.5); break
    case 'bladeArc': damage=magic(28+atk*.4+foeDef*.25); break
    case 'ironDomain': setStatus.cfx_ironDomainTurns=3; break
    case 'annihilate': damage=magic(55+atk*.6); break
    case 'venomSpit': damage=magic(24+atk*.35); setStatus.cfx_longDecayStacks=Math.min(5,(status.cfx_longDecayStacks||0)+1); break
    case 'blightNova': damage=magic(38+atk*.45); break
    case 'pandemic': damage=magic(55+atk*.5); setStatus.cfx_longDecayStacks=Math.min(5,(status.cfx_longDecayStacks||0)+2); break
    default: return null
  }
  // Standing Wave: next Lux attack hits four times total while attuned.
  if (skill.element === 'arcane' && damage > 0 && status.cfx_standingWave > 0) {
    damage *= status.cfx_standingWave
    setStatus.cfx_standingWave = 0
    setStatus.cfx_standingWaveIgnoreDef = false
  }
  // Perfect Recall gives the next skill no cooldown, exactly once.
  const perfectRecall = Boolean(status.cfx_perfectRecall)
  if (perfectRecall) setStatus.cfx_perfectRecall = false
  if (status.cfx_refundMpHalf) setStatus.cfx_refundMpHalf = false
  const mpCost = getElementalMpCost(skill.tier, status)
  const cooldown = perfectRecall ? 0 : skill.tier === 0 ? 2 : 4
  return {
    id, label: skill.label, element: skill.element,
    enemyDamage: damage, healPlayer: heal, setStatus, cooldown, mpCost,
    messages: [`${skill.label}: ${damage > 0 ? damage + ' damage' : 'effect activated'}${heal ? ', +' + heal + ' HP' : ''}.`,
      ...(perfectRecall ? ['Perfect Recall: no MP cost or cooldown.'] : [])],
  }
}
