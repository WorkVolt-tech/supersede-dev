// One saved combat resonance at a time. The player can learn nodes from
// several unlocked trees, but only the selected tree contributes effects.
// "element" is the existing players column; do not introduce a new field.
import { ELEMENT_TREES, isElementUnlocked } from './elementsTree.js'

export function canActivateElement(player, key) {
  return Object.hasOwn(ELEMENT_TREES, key) && isElementUnlocked(key, player)
}

export function getActiveElement(player) {
  // The canonical saved field wins over legacy attuned_element. Invalid
  // or locked values never grant combat effects.
  if (canActivateElement(player, player?.element)) return player.element
  if (canActivateElement(player, player?.attuned_element)) return player.attuned_element
  return null
}

export function activeElementChange(player, key) {
  if (!canActivateElement(player, key)) return null
  if (getActiveElement(player) === key && player?.element === key) return null
  return { element: key }
}
