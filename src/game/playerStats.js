// One stat calculation shared by the record, equipment screen, and combat.
// Skill-tree purchases already update player core columns; don't count them twice.
import { rawBonus } from './elementalBonuses.js'
import { findRuneword, normalizedItem } from './runes.js'

export const CORE_STATS = ['atk','def','power','guard','speed','control','insight','luck','agility']
const DEFAULTS = { atk:1, def:0, power:0, guard:0, speed:0, control:0, insight:0, luck:0, agility:0 }
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0

export function getEquipmentBonuses(equippedItems = []) {
  const bonuses = Object.fromEntries([...CORE_STATS,'max_hp'].map(key => [key,0]))
  for (const item of equippedItems) {
    if (!item.equipped_slot) continue
    const normalized = normalizedItem(item)
    const runeword = findRuneword(item.socketed_runes || [], item.item_type, item.sockets_total)
    for (const key of Object.keys(bonuses)) {
      const column = key === 'max_hp' ? 'max_hp_bonus' : key + '_bonus'
      bonuses[key] += number(normalized[column]) + number(runeword?.stats[column])
    }
  }
  return bonuses
}

export function getEffectiveStats(player = {}, equippedItems = []) {
  const equipment = getEquipmentBonuses(equippedItems)
  const base = {}
  const core = {}
  for (const stat of CORE_STATS) {
    base[stat] = number(player[stat] ?? player['base_' + stat] ?? DEFAULTS[stat])
    core[stat] = base[stat] + equipment[stat] + rawBonus(player, stat + '_bonus')
  }
  const baseMaxHp = number(player.max_hp ?? player.base_max_hp ?? 100)
  const maxHp = Math.max(1,baseMaxHp + equipment.max_hp + rawBonus(player, 'max_hp_bonus'))

  // Original Supersede derived-stat formulas.
  const attack = Math.max(1, Math.round(core.atk + core.power * .6 + core.speed * .2))
  const defense = Math.max(0, Math.round(core.def + core.guard * .6 + core.control * .2))
  const initiative = Math.max(0, Math.round(core.speed + core.insight * .1))
  return { base, equipment, core, baseMaxHp, maxHp, attack, defense, initiative }
}

export function calcATK(player, equippedItems = []) { return getEffectiveStats(player,equippedItems).attack }
export function calcDEF(player, equippedItems = []) { return getEffectiveStats(player,equippedItems).defense }
export function calcSPD(player, equippedItems = []) { return getEffectiveStats(player,equippedItems).initiative }
export function calcMaxHp(player, equippedItems = []) { return getEffectiveStats(player,equippedItems).maxHp }

// Class-combat hooks expect the old player shape. Supply effective attributes
// during battle without writing temporary gear stats to the database.
export function getCombatPlayer(player, equippedItems = []) {
  const stats = getEffectiveStats(player,equippedItems)
  return {
    ...player, ...stats.core,
    atk:stats.attack, def:stats.defense, speed:stats.initiative,
    max_hp:stats.maxHp, hp_max:stats.maxHp,
  }
}
