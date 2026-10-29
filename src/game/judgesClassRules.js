import { getClassChoicesForFormKey, hasPickedClass, isClassEligible } from './classes.js'

const ELEMENT_PREFIXES = ['ignis_', 'aqua_', 'volt_', 'arcane_', 'umbra_', 'terra_', 'aero_', 'flora_', 'ferro_', 'venin_']

// Ported from the original Supersede composeJudgesForm canonical form selection.
export function getJudgesForm(player) {
  const recorded = (player.alliance_log || []).find(tag => tag.startsWith('class_form_'))
  if (recorded) {
    const form = recorded.slice('class_form_'.length)
    if (getClassChoicesForFormKey(form).length) return form
  }
  const moral = Number(player.moral_score) || 0
  const invested = new Set()
  for (const id of player.skills_unlocked || []) {
    const prefix = ELEMENT_PREFIXES.find(p => id.startsWith(p))
    if (prefix) invested.add(prefix)
  }
  const count = invested.size
  const bosses = (player.defeated_bosses || []).filter(b => b.startsWith('zone_boss_')).length
  if (bosses >= 5) return 'verdict'
  if (Math.abs(moral) < 40 && count >= 2) return 'dominion'
  if (moral >= 40 && count >= 2) return 'absolution'
  if (moral <= -40 && count >= 2) return 'ruin'
  if (Math.abs(moral) < 40) return 'equilibrium'
  return moral >= 40 ? 'mercy' : 'wrath'
}

export function canChooseJudgesClass(player) {
  const judgesDefeated = (player.defeated_bosses || []).includes('twin_judges') ||
    player.current_node === 'ch2_chapter_end_ch2'
  return judgesDefeated &&
    isClassEligible(player) && !hasPickedClass(player)
}

export function judgesClassChoices(player) {
  return canChooseJudgesClass(player) ? getClassChoicesForFormKey(getJudgesForm(player)) : []
}
