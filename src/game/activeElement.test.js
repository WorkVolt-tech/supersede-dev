import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canActivateElement, getActiveElement, activeElementChange } from './activeElement.js'
import { getElementalBonuses, critChanceBonus } from './elementalBonuses.js'
import { getUnlockedKeystones, applyKeystone } from './elementalKeystones.js'

const player = (element = 'neutral', defeated = [], unlocked = []) => ({
  element,
  defeated_bosses: defeated.map(key => 'zone_boss_' + key),
  elemental_unlocked: unlocked,
})

test('no elemental effects before a valid zone guardian victory', () => {
  const p = player('fire', [], ['fire_util_1'])
  assert.equal(getActiveElement(p), null)
  assert.equal(critChanceBonus(p), 0)
  assert.equal(canActivateElement(p, 'fire'), false)
})

test('activation requires its own defeated guardian', () => {
  const p = player('neutral', ['fire'])
  assert.deepEqual(activeElementChange(p, 'fire'), { element: 'fire' })
  assert.equal(activeElementChange(p, 'water'), null)
})

test('one selected element is active even when multiple bosses are cleared', () => {
  const p = player('fire', ['fire', 'water'])
  assert.equal(getActiveElement(p), 'fire')
  assert.deepEqual(activeElementChange(p, 'water'), { element: 'water' })
  assert.equal(activeElementChange(p, 'fire'), null)
})

test('canonical element takes precedence over legacy attuned_element', () => {
  const p = { ...player('water', ['fire', 'water']), attuned_element: 'fire' }
  assert.equal(getActiveElement(p), 'water')
})

test('passive values from a second learned tree stay dormant', () => {
  const p = player('fire', ['fire', 'water'], ['fire_util_1', 'water_util_1'])
  assert.equal(getElementalBonuses(p).sums.crit_chance_pct, 3)
  assert.equal(critChanceBonus(p), 0.03)
  const switched = { ...p, element: 'water' }
  assert.equal(getElementalBonuses(switched).sums.crit_chance_pct, 3)
  assert.deepEqual(p.elemental_unlocked, ['fire_util_1', 'water_util_1'])
})

test('an unselected element never contributes bonus HP or other shared stats', () => {
  const p = player('fire', ['fire', 'poison'], ['poison_util_4'])
  assert.equal(getElementalBonuses(p).sums.hp_bonus || 0, 0)
  assert.equal(getElementalBonuses({ ...p, element: 'poison' }).sums.hp_bonus, 25)
})

test('keystone loadout includes only the active tree', () => {
  const p = player('fire', ['fire', 'water'], ['fire_aggr_ks', 'water_aggr_ks'])
  assert.deepEqual(getUnlockedKeystones(p).map(x => x.id), ['fire_aggr_ks'])
  assert.deepEqual(getUnlockedKeystones({ ...p, element: 'water' }).map(x => x.id), ['water_aggr_ks'])
})

test('inactive and unlearned keystones cannot cast even with a direct call', () => {
  const p = player('fire', ['fire', 'water'], ['fire_aggr_ks', 'water_aggr_ks'])
  assert.equal(applyKeystone('water_aggr_ks', p, {}).consumesTurn, false)
  assert.equal(applyKeystone('fire_def_ks', p, {}).consumesTurn, false)
  assert.equal(applyKeystone('fire_aggr_ks', p, {}).consumesTurn, true)
})
